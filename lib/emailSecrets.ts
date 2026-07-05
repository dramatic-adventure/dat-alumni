// lib/emailSecrets.ts
//
// GMAIL_OAUTH_CLIENT_ID, GMAIL_OAUTH_CLIENT_SECRET, and GMAIL_OAUTH_REFRESH_TOKEN
// live in a site-wide Netlify Blobs store, not the function environment — the
// Lambda env bundle already sits near AWS's 4 KB limit (adding the VAPID keys
// there broke deploys once; see CLAUDE.md and lib/notificationSecrets.ts, which
// this file mirrors). getStore(STORE_NAME) (no deployID) is the persistent,
// site-wide store: it survives across deploys and is readable from any
// function/route on the site.
//
// Falls back to the same-named env var if Blobs has nothing for a key, so
// local `next dev` — which has no Blobs credentials — works off .env.local.
//
// Read once per warm instance, cached on globalThis. Deliberately NOT
// "server-only": scripts/setup-email-secrets.ts imports this outside of Next.

import { getStore } from "@netlify/blobs";

const STORE_NAME = "dat-email-secrets";

export const EMAIL_SECRET_KEYS = {
  gmailClientId: "GMAIL_OAUTH_CLIENT_ID",
  gmailClientSecret: "GMAIL_OAUTH_CLIENT_SECRET",
  gmailRefreshToken: "GMAIL_OAUTH_REFRESH_TOKEN",
} as const;

type SecretName = keyof typeof EMAIL_SECRET_KEYS;

declare global {
  // eslint-disable-next-line no-var
  var __DAT_EMAIL_SECRETS__: Partial<Record<SecretName, string | null>> | undefined;
}

function cache(): Partial<Record<SecretName, string | null>> {
  if (!globalThis.__DAT_EMAIL_SECRETS__) {
    globalThis.__DAT_EMAIL_SECRETS__ = {};
  }
  return globalThis.__DAT_EMAIL_SECRETS__;
}

function getBlobStore() {
  const siteID = (process.env.NETLIFY_SITE_ID || process.env.SITE_ID || "").trim();
  const token = (process.env.NETLIFY_AUTH_TOKEN || "").trim();
  if (siteID && token) return getStore({ name: STORE_NAME, siteID, token });
  return getStore(STORE_NAME);
}

async function readSecret(name: SecretName): Promise<string | null> {
  const c = cache();
  if (name in c) return c[name] ?? null;

  let value: string | null = null;
  try {
    const v = await getBlobStore().get(EMAIL_SECRET_KEYS[name], { type: "text" });
    if (typeof v === "string" && v.trim()) value = v.trim();
  } catch {
    // Blobs unreachable (e.g. local dev without NETLIFY_SITE_ID/NETLIFY_AUTH_TOKEN) — fall through to env.
  }

  if (!value) {
    const envVal = String(process.env[EMAIL_SECRET_KEYS[name]] || "").trim();
    if (envVal) value = envVal;
  }

  c[name] = value;
  return value;
}

export function getGmailClientId(): Promise<string | null> {
  return readSecret("gmailClientId");
}

export function getGmailClientSecret(): Promise<string | null> {
  return readSecret("gmailClientSecret");
}

export function getGmailRefreshToken(): Promise<string | null> {
  return readSecret("gmailRefreshToken");
}

/** Write-through for the one-time admin setup script. Not used at request time. */
export async function setEmailSecret(name: SecretName, value: string): Promise<void> {
  await getBlobStore().set(EMAIL_SECRET_KEYS[name], value);
}
