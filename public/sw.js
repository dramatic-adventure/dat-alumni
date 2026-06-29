// public/sw.js
//
// Hand-rolled service worker for the DAT Field Kit PWA. Lives in public/ so it
// ships as a plain static asset — no next.config or build-pipeline changes.
//
// SLICE 1 scope: ASSET caching only. Static, same-origin GETs (Next build assets,
// icons, fonts, images) are served stale-while-revalidate. Navigations (HTML) and
// /api/* always pass through to the network — gated HTML and API responses are
// per-user and must NOT be cached here (a later slice owns offline navigation).

const CACHE = "fk-v1";

// Best-effort precache of the install icons; failure must not abort install.
const PRECACHE = [
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE).catch(() => undefined))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("fk-") && k !== CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Decide whether a request is a cacheable static asset.
function isStaticAsset(url) {
  if (url.pathname.startsWith("/_next/static/")) return true;
  if (url.pathname.startsWith("/icons/")) return true;
  if (url.pathname === "/apple-touch-icon.png") return true;
  // fonts + images by extension
  return /\.(?:woff2?|ttf|otf|eot|png|jpe?g|gif|svg|webp|avif|ico)$/i.test(url.pathname);
}

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Never touch non-GET (mutations, uploads) — pass straight through.
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Same-origin only.
  if (url.origin !== self.location.origin) return;

  // Navigations (HTML) and API responses are per-user / gated — network only,
  // no caching in this slice.
  if (req.mode === "navigate") return;
  if (url.pathname.startsWith("/api/")) return;

  if (!isStaticAsset(url)) return;

  // Stale-while-revalidate: serve cache immediately if present, refresh in the
  // background; otherwise fall back to the network and cache the result.
  event.respondWith(
    caches.open(CACHE).then((cache) =>
      cache.match(req).then((cached) => {
        const network = fetch(req)
          .then((res) => {
            if (res && res.ok) cache.put(req, res.clone());
            return res;
          })
          .catch(() => cached);
        return cached || network;
      })
    )
  );
});
