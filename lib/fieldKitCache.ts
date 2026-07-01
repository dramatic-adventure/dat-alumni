// lib/fieldKitCache.ts
//
// Client-only helper for clearing the Field Kit's Cache Storage (public/sw.js's
// "fk-*" caches — cached gated navigations + precached shells/assets). Used on
// sign-out (AccountMenu) so a signed-out session doesn't leave gated pages
// sitting in Cache Storage on a shared device. Mirrors the "fk-" prefix
// convention the service worker's own activate handler sweeps by — deletes
// every matching cache rather than hardcoding a version string here, since the
// current CACHE name lives in sw.js (a separate script, not importable).
//
// SSR-safe: no "server-only" import (this is client code); no-ops when the
// Cache Storage API is absent.

export async function clearFieldKitCaches(): Promise<void> {
  if (typeof caches === "undefined") return;
  const keys = await caches.keys();
  await Promise.all(keys.filter((k) => k.startsWith("fk-")).map((k) => caches.delete(k)));
}
