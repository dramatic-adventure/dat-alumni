// /lib/emailLoginCodes.ts
//
// Ephemeral storage + verification for email "sign-in code" (OTP) login.
// Lets artists without a Google account sign in by email.
//
// Storage:
//   - Netlify runtime (or local creds present) → Netlify Blobs (durable across
//     function instances).
//   - Local dev without Blobs creds → in-memory Map (fine for a single
//     long-lived `next dev` process).
//
// Codes are 6 digits, expire after 2 weeks, allow up to 5 verify attempts,
// and are rate-limited to one send per 60 seconds per email. Only an HMAC of
// the code is stored, never the code itself.
import "server-only";
import { getStore } from "@netlify/blobs";
import { createHash, createHmac, randomInt } from "crypto";

const STORE_NAME = "email-login-codes";
const CODE_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 2 weeks
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds

const SECRET =
  process.env.NEXTAUTH_SECRET ||
  // Fallback so local dev without NEXTAUTH_SECRET still works; codes are
  // still single-use + short-lived, but set NEXTAUTH_SECRET in production.
  "dat-alumni-email-code-dev-secret";

type CodeRecord = {
  codeHash: string;
  expiresAt: number;
  attempts: number;
  lastSentAt: number;
};

// ── Storage backend selection ──────────────────────────────────
const memStore = new Map<string, CodeRecord>();

function blobsConfigured() {
  const isNetlifyRuntime =
    process.env.NETLIFY === "true" || !!process.env.NETLIFY_SITE_ID;
  const hasLocalCreds =
    !!process.env.NETLIFY_SITE_ID?.trim() && !!process.env.NETLIFY_AUTH_TOKEN?.trim();
  return isNetlifyRuntime || hasLocalCreds;
}

function getBlobStore() {
  const siteID = (process.env.NETLIFY_SITE_ID || process.env.SITE_ID || "").trim();
  const token = (process.env.NETLIFY_AUTH_TOKEN || "").trim();
  if (siteID && token) return getStore({ name: STORE_NAME, siteID, token });
  return getStore(STORE_NAME);
}

async function getRecord(key: string): Promise<CodeRecord | null> {
  if (blobsConfigured()) {
    try {
      const store = getBlobStore();
      const v = await store.get(key, { type: "json" });
      return (v as CodeRecord | null) ?? null;
    } catch (err) {
      console.error("[emailLoginCodes] blob get failed:", err);
      return null;
    }
  }
  return memStore.get(key) ?? null;
}

async function setRecord(key: string, record: CodeRecord): Promise<void> {
  if (blobsConfigured()) {
    try {
      const store = getBlobStore();
      await store.setJSON(key, record);
      return;
    } catch (err) {
      console.error("[emailLoginCodes] blob set failed:", err);
    }
  }
  memStore.set(key, record);
}

async function deleteRecord(key: string): Promise<void> {
  if (blobsConfigured()) {
    try {
      const store = getBlobStore();
      await store.delete(key);
      return;
    } catch (err) {
      console.error("[emailLoginCodes] blob delete failed:", err);
    }
  }
  memStore.delete(key);
}

// ── Helpers ──────────────────────────────────────────────────────
function normalizeEmail(raw: string): string {
  return String(raw || "").trim().toLowerCase();
}

function keyFor(email: string): string {
  return createHash("sha256").update(email).digest("hex");
}

function hashCode(email: string, code: string): string {
  return createHmac("sha256", SECRET).update(`${email}:${code}`).digest("hex");
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── Public API ───────────────────────────────────────────────────

export type RequestCodeResult =
  | { ok: true; code: string; email: string }
  | { ok: false; reason: "invalid_email" }
  | { ok: false; reason: "rate_limited" };

/**
 * Generates a fresh 6-digit code for `rawEmail` and stores its hash.
 * Returns the plaintext code so the caller can email it — it is never
 * persisted in plaintext.
 *
 * If a code was sent within the last 60 seconds, returns `rate_limited`
 * without generating a new one (the existing code is still valid).
 */
export async function requestEmailCode(rawEmail: string): Promise<RequestCodeResult> {
  const email = normalizeEmail(rawEmail);
  if (!email || !EMAIL_RE.test(email)) {
    return { ok: false, reason: "invalid_email" };
  }

  const key = keyFor(email);
  const now = Date.now();
  const existing = await getRecord(key);

  if (existing && now - existing.lastSentAt < RESEND_COOLDOWN_MS) {
    return { ok: false, reason: "rate_limited" };
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const record: CodeRecord = {
    codeHash: hashCode(email, code),
    expiresAt: now + CODE_TTL_MS,
    attempts: 0,
    lastSentAt: now,
  };

  await setRecord(key, record);
  return { ok: true, code, email };
}

/**
 * Verifies a 6-digit code for `rawEmail`. Consumes the code on success
 * (single use) and on exhausting MAX_ATTEMPTS (to force a resend).
 */
export async function verifyEmailCode(rawEmail: string, rawCode: string): Promise<boolean> {
  const email = normalizeEmail(rawEmail);
  const code = String(rawCode || "").trim();
  if (!email || !/^\d{6}$/.test(code)) return false;

  const key = keyFor(email);
  const record = await getRecord(key);
  if (!record) return false;

  const now = Date.now();
  if (now > record.expiresAt) {
    await deleteRecord(key);
    return false;
  }
  if (record.attempts >= MAX_ATTEMPTS) {
    await deleteRecord(key);
    return false;
  }

  if (hashCode(email, code) !== record.codeHash) {
    record.attempts += 1;
    await setRecord(key, record);
    return false;
  }

  await deleteRecord(key);
  return true;
}
