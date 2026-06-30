// public/sw.js
//
// Hand-rolled service worker for the DAT Field Kit PWA. Lives in public/ so it
// ships as a plain static asset — no next.config or build-pipeline changes.
//
// ASSET caching: static, same-origin GETs (Next build assets, icons, fonts,
// images) are served stale-while-revalidate. Gated HTML and /api/* responses are
// per-user and are NEVER cached here.
//
// SLICE 2 adds OFFLINE COLD-START for the itinerary ONLY: the /field-kit/itinerary
// navigation is network-FIRST with a fallback to a precached, NON-gated app-shell
// (SHELL_URL) when the network fails. The shell ships no user data — it renders
// the itinerary client-side from the IndexedDB snapshot. Every OTHER /field-kit/*
// navigation still passes straight to the network (network-required offline).

const CACHE = "fk-v2";

// The non-gated offline app-shell (static file in public/). Served as the offline
// fallback for the itinerary route. Must NOT be a per-user/gated document.
const SHELL_URL = "/field-kit-shell.html";

// Best-effort precache of the install icons; failure must not abort install.
const PRECACHE = [
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/apple-touch-icon.png",
];

// Is this a navigation to the itinerary route (the only Slice 2 offline route)?
function isItineraryNavigation(req, url) {
  return (
    req.mode === "navigate" &&
    (url.pathname === "/field-kit/itinerary" || url.pathname.startsWith("/field-kit/itinerary/"))
  );
}

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then(async (cache) => {
      // Icons are best-effort; the shell is cached separately so an icon 404
      // can't take the offline fallback down with it.
      await cache.addAll(PRECACHE).catch(() => undefined);
      await cache.add(SHELL_URL).catch(() => undefined);
    })
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

  // Itinerary navigation: network-FIRST, falling back to the precached shell when
  // offline. The live network response (gated HTML) is NEVER cached — only the
  // static shell is, and only at install. Other /field-kit/* navigations fall
  // through to network-only below.
  if (isItineraryNavigation(req, url)) {
    event.respondWith(
      fetch(req).catch(() =>
        caches.open(CACHE).then((cache) =>
          cache
            .match(SHELL_URL)
            .then((shell) => shell || Response.error())
        )
      )
    );
    return;
  }

  // Other navigations (HTML) and API responses are per-user / gated — network
  // only, never cached here.
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

// SLICE 3 (Notifications) — web push. These handlers add notification display +
// click routing; they do NOT touch the cache (gated HTML / /api stay uncached).
// The push payload is { title, body, link } (lib/webPush.ts); `link` defaults to
// the itinerary, the one route that also works offline.

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }
  const title = data.title || "DAT Field Kit";
  const link = data.link || "/field-kit/itinerary";
  const options = {
    body: data.body || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: { link },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = (event.notification.data && event.notification.data.link) || "/field-kit/itinerary";
  const target = new URL(link, self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      // Already on the exact page → just focus it.
      for (const c of clients) {
        if (c.url === target && "focus" in c) return c.focus();
      }
      // Any open Field Kit window → navigate it to the target, then focus.
      for (const c of clients) {
        if (c.url.includes("/field-kit") && "focus" in c) {
          if ("navigate" in c) c.navigate(target).catch(() => undefined);
          return c.focus();
        }
      }
      // Nothing open → open a new window on the target.
      return self.clients.openWindow ? self.clients.openWindow(target) : undefined;
    })
  );
});
