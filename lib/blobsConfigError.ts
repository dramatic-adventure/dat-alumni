// lib/blobsConfigError.ts
//
// Shared detector for @netlify/blobs' "not configured" error (local `next dev`
// with no NETLIFY_SITE_ID/NETLIFY_AUTH_TOKEN). Callers that keep an in-memory
// dev fallback must gate it on THIS error — never on build-time env vars like
// NETLIFY/NETLIFY_SITE_ID, which are absent in the deployed function runtime.
// That gate silently routed production journey drafts, nudge logs, and login
// codes into per-instance memory for weeks (found 2026-08-19): the runtime DOES
// have Blobs auto-config (lib/notificationSecrets.ts proves it), so the right
// shape is "try Blobs, fall back only when Blobs says it isn't configured".

export function isBlobsConfigError(e: unknown): boolean {
  if (!(e instanceof Error)) return false;
  return (
    e.name === "MissingBlobsEnvironmentError" ||
    /environment has not been configured/i.test(e.message)
  );
}
