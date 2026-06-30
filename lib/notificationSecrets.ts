// lib/notificationSecrets.ts
//
// VAPID_PRIVATE_KEY, VAPID_SUBJECT, and CRON_SECRET live in a site-wide Netlify
// Blobs store, not the function environment — added to the Lambda env they tip
// the AWS function bundle over the 4 KB limit. getStore(STORE_NAME) (no
// deployID) is the persistent, site-wide store: it survives across deploys and
// is readable from any function/route on the site, unlike a deploy-scoped store.
//
// Falls back to the same-named env var if Blobs has nothing for a key, so the
// env vars can stay in place during rollout (and so local `next dev` — which
// has no Blobs credentials — keeps working off .env.local).
//
// Read once per warm instance, cached on globalThis. Deliberately NOT
// "server-only": this is imported by both Next API routes and the
// esbuild-bundled scheduled function (netlify/functions/send-notifications.ts),
// and "server-only" only resolves cleanly in the former.

import { getStore } from "@netlify/blobs";

const STORE_NAME = "dat-notification-secrets";

export const SECRET_KEYS = {
  vapidPrivateKey: "VAPID_PRIVATE_KEY",
  vapidSubject: "VAPID_SUBJECT",
  cronSecret: "CRON_SECRET",
} as const;

type SecretName = keyof typeof SECRET_KEYS;

declare global {
  // eslint-disable-next-line no-var
  var __DAT_NOTIFICATION_SECRETS__: Partial<Record<SecretName, string | null>> | undefined;
}

function cache(): Partial<Record<SecretName, string | null>> {
  if (!globalThis.__DAT_NOTIFICATION_SECRETS__) {
    globalThis.__DAT_NOTIFICATION_SECRETS__ = {};
  }
  return globalThis.__DAT_NOTIFICATION_SECRETS__;
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
    const v = await getBlobStore().get(SECRET_KEYS[name], { type: "text" });
    if (typeof v === "string" && v.trim()) value = v.trim();
  } catch {
    // Blobs unreachable (e.g. local dev without NETLIFY_SITE_ID/NETLIFY_AUTH_TOKEN) — fall through to env.
  }

  if (!value) {
    const envVal = String(process.env[SECRET_KEYS[name]] || "").trim();
    if (envVal) value = envVal;
  }

  c[name] = value;
  return value;
}

export function getVapidPrivateKey(): Promise<string | null> {
  return readSecret("vapidPrivateKey");
}

export function getVapidSubject(): Promise<string | null> {
  return readSecret("vapidSubject");
}

export function getCronSecret(): Promise<string | null> {
  return readSecret("cronSecret");
}

/** Write-through for the one-time admin setup script. Not used at request time. */
export async function setNotificationSecret(name: SecretName, value: string): Promise<void> {
  await getBlobStore().set(SECRET_KEYS[name], value);
}
