// lib/turnstile.ts
//
// Server-side Cloudflare Turnstile verification for the mailing-list form.
// Turnstile is the PRIMARY control against the 2026 subscription-bombing
// campaign: it stops the automated submission from happening at all, so no
// welcome email is ever generated at a victim's address.
//
// The secret key follows the same Netlify Blobs pattern as
// lib/notificationSecrets.ts / lib/emailSecrets.ts — it must NOT become a
// Netlify function env var (the Lambda env bundle is against AWS's 4 KB limit;
// adding secrets there has broken deploys before). Falls back to the
// TURNSTILE_SECRET_KEY env var so local `next dev` works off .env.local.
// Write it with: npm run setup:turnstile-secret
//
// The matching site key is public by design: NEXT_PUBLIC_TURNSTILE_SITE_KEY,
// set in Netlify's BUILDS-scoped env (inlined at build time, never in the
// Lambda bundle) — same treatment as NEXT_PUBLIC_VAPID_PUBLIC_KEY.
//
// ROLLOUT: until the secret exists (Blobs or env), isTurnstileConfigured()
// is false and the route skips verification entirely, so this deploys safely
// before the Cloudflare keys are created.
//
// Deliberately NOT "server-only" (same as lib/notificationSecrets.ts): the tsx
// setup script imports setTurnstileSecret, and "server-only" doesn't resolve
// outside Next. Never import this from client components.

import { getStore } from "@netlify/blobs";

const STORE_NAME = "dat-turnstile-secrets";
const SECRET_KEY_NAME = "TURNSTILE_SECRET_KEY";
const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

declare global {
  // eslint-disable-next-line no-var
  var __DAT_TURNSTILE_SECRET__: string | null | undefined;
}

function getBlobStore() {
  const siteID = (process.env.NETLIFY_SITE_ID || process.env.SITE_ID || "").trim();
  const token = (process.env.NETLIFY_AUTH_TOKEN || "").trim();
  if (siteID && token) return getStore({ name: STORE_NAME, siteID, token });
  return getStore(STORE_NAME);
}

export async function getTurnstileSecret(): Promise<string | null> {
  if (globalThis.__DAT_TURNSTILE_SECRET__ !== undefined) {
    return globalThis.__DAT_TURNSTILE_SECRET__;
  }

  let value: string | null = null;
  try {
    const v = await getBlobStore().get(SECRET_KEY_NAME, { type: "text" });
    if (typeof v === "string" && v.trim()) value = v.trim();
  } catch {
    // Blobs unreachable (e.g. local dev without Netlify credentials) — fall through to env.
  }
  if (!value) {
    const envVal = String(process.env[SECRET_KEY_NAME] || "").trim();
    if (envVal) value = envVal;
  }

  globalThis.__DAT_TURNSTILE_SECRET__ = value;
  return value;
}

export async function isTurnstileConfigured(): Promise<boolean> {
  return (await getTurnstileSecret()) !== null;
}

/** Write-through for the one-time admin setup script. Not used at request time. */
export async function setTurnstileSecret(value: string): Promise<void> {
  await getBlobStore().set(SECRET_KEY_NAME, value);
}

export type TurnstileResult =
  /** Token verified by Cloudflare. */
  | { outcome: "pass" }
  /** Cloudflare rejected the token (or none was sent). Treat as a bot. */
  | { outcome: "fail"; reason: string }
  /** Couldn't reach Cloudflare — fail OPEN so an outage never loses real
   *  signups; the content heuristics still apply downstream. */
  | { outcome: "unavailable" };

export async function verifyTurnstileToken(
  token: string | undefined,
  remoteIp: string
): Promise<TurnstileResult> {
  const secret = await getTurnstileSecret();
  if (!secret) return { outcome: "pass" }; // not configured — nothing to enforce

  if (!token || !token.trim()) {
    return { outcome: "fail", reason: "no token" };
  }

  try {
    const body = new URLSearchParams({ secret, response: token.trim() });
    if (remoteIp && remoteIp !== "unknown") body.set("remoteip", remoteIp);

    const res = await fetch(VERIFY_URL, { method: "POST", body });
    if (!res.ok) {
      console.error(`[turnstile] siteverify HTTP ${res.status}`);
      return { outcome: "unavailable" };
    }
    const data = (await res.json()) as { success?: boolean; "error-codes"?: string[] };
    if (data.success) return { outcome: "pass" };
    return {
      outcome: "fail",
      reason: (data["error-codes"] ?? []).join(",") || "rejected",
    };
  } catch (err) {
    console.error("[turnstile] siteverify unreachable:", err);
    return { outcome: "unavailable" };
  }
}
