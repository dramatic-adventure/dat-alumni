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

/* ── Slice 5 — Field Library file cache (cache-on-open) ─────────────────────────
 *
 * Library files live in their OWN named cache so the service worker's activate
 * sweep (which purges stale fk-* page/asset caches) can keep it, while sign-out
 * (clearFieldKitCaches above, matching the fk- prefix) still wipes it — it's
 * gated content on a possibly shared device. The name is duplicated in
 * public/sw.js (LIB_CACHE) — keep the two in lockstep.
 *
 * Caching is CLIENT-driven (an explicit fetch of the full file, then
 * cache.put) rather than sniffed in the SW fetch handler, because iOS <audio>
 * streams via Range requests — the SW would only ever see 206 partials, which
 * can't be stored as the full file. The SW serves these entries when offline,
 * slicing Range responses out of the stored full body.
 */

export const LIB_CACHE_NAME = "fk-lib-v1";

/** Per-file ceiling for on-device caching — Jesse: text/audio/images only, no
 *  video; anything larger stays online-only (mobile Safari quotas are finite
 *  and evictable). */
export const MAX_LIB_FILE_BYTES = 20 * 1024 * 1024; // 20 MB

export type LibraryCacheResult = "cached" | "too-large" | "failed" | "unsupported";

/** Fetch a library file in full and store it for offline use. */
export async function cacheLibraryFile(url: string): Promise<LibraryCacheResult> {
  if (typeof caches === "undefined") return "unsupported";
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok || res.status !== 200 || res.redirected) return "failed";
    const blob = await res.blob();
    if (blob.size > MAX_LIB_FILE_BYTES) return "too-large";
    const cache = await caches.open(LIB_CACHE_NAME);
    await cache.put(
      url,
      new Response(blob, {
        status: 200,
        headers: {
          "Content-Type": res.headers.get("Content-Type") || "application/octet-stream",
          "Content-Length": String(blob.size),
          "Accept-Ranges": "bytes",
        },
      })
    );
    return "cached";
  } catch {
    return "failed";
  }
}

export type LibraryFileLoad = {
  blob: Blob;
  contentType: string;
  /** Outcome for the offline copy — "cached" covers both a cache hit and a fresh write. */
  cache: LibraryCacheResult;
};

/** Load a library file for in-page rendering (pdf.js), serving the offline
 *  cache when present — otherwise ONE full network fetch that also populates
 *  the cache. Same cache-on-open moment as cacheLibraryFile, without a second
 *  download; still returns the blob even when it's too large to store. */
export async function loadLibraryFile(url: string): Promise<LibraryFileLoad | null> {
  const hasCaches = typeof caches !== "undefined";
  if (hasCaches) {
    try {
      const cache = await caches.open(LIB_CACHE_NAME);
      const hit = await cache.match(url);
      if (hit) {
        return {
          blob: await hit.blob(),
          contentType: hit.headers.get("Content-Type") || "",
          cache: "cached",
        };
      }
    } catch {
      /* Cache Storage unreadable — fall through to the network */
    }
  }
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok || res.status !== 200 || res.redirected) return null;
    const blob = await res.blob();
    const contentType = res.headers.get("Content-Type") || "";
    if (!hasCaches) return { blob, contentType, cache: "unsupported" };
    if (blob.size > MAX_LIB_FILE_BYTES) return { blob, contentType, cache: "too-large" };
    try {
      const cache = await caches.open(LIB_CACHE_NAME);
      await cache.put(
        url,
        new Response(blob, {
          status: 200,
          headers: {
            "Content-Type": contentType || "application/octet-stream",
            "Content-Length": String(blob.size),
            "Accept-Ranges": "bytes",
          },
        })
      );
      return { blob, contentType, cache: "cached" };
    } catch {
      return { blob, contentType, cache: "failed" };
    }
  } catch {
    return null;
  }
}

/** Is this library file already saved on the device? */
export async function isLibraryFileCached(url: string): Promise<boolean> {
  if (typeof caches === "undefined") return false;
  try {
    const cache = await caches.open(LIB_CACHE_NAME);
    return !!(await cache.match(url));
  } catch {
    return false;
  }
}
