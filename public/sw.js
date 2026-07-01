// public/sw.js
//
// Hand-rolled service worker for the DAT Field Kit PWA. Lives in public/ so it
// ships as a plain static asset — no next.config or build-pipeline changes.
//
// ASSET caching: static, same-origin GETs (Next build assets, icons, fonts,
// images) are served stale-while-revalidate. /api/* responses are per-user and
// are NEVER cached here.
//
// SLICE 4a generalizes offline nav caching to every gated /field-kit/* page
// (see field-kit-NAV-CACHE-DESIGN.md): network-FIRST, and only a successful,
// non-redirected, non-gate, non-admin, non-impersonated 200 gets written to the
// cache. On a network failure the last cached copy of that exact URL is served;
// if there's no cached copy yet, the itinerary route falls back to its SLICE 2
// bespoke non-gated shell (SHELL_URL, ships no user data, renders from the
// IndexedDB snapshot) and every other kit route falls back to the generic
// OFFLINE_URL notice. Never cache: /api/*, login redirects, the "not in
// program" gate screen (detected via GATE_MARKER), /field-kit/admin (staff
// console — online-only, cohort-wide data), or any ?asId= impersonation view.
//
// IMPORTANT: do NOT bump CACHE on routine deploys — see design §5. Cached HTML
// and the exact hashed _next/static chunks it references stay paired only
// because the asset cache is never purged by a normal deploy; bumping CACHE
// purges it and would break hydration for a device that's currently offline
// on an older build. Only bump it for an actual SW cache-schema change (like
// this one) — the existing activate fk-* sweep does the one-time migration.
const CACHE = "fk-v3";

// The non-gated offline app-shell (static file in public/). Served as the
// last-resort offline fallback for the itinerary route specifically, when
// there's no cached copy of the live page yet. Must NOT be a per-user/gated
// document.
const SHELL_URL = "/field-kit-shell.html";

// Generic offline fallback for every OTHER /field-kit/* route when there's no
// cached copy yet. Non-gated, ships no data.
const OFFLINE_URL = "/field-kit-offline.html";

// The roster-gate screen (NotInProgram, app/field-kit/layout.tsx) renders as a
// plain 200 at the SAME url as the real page — nothing at the HTTP level
// distinguishes it, so the layout stamps this literal marker into that render
// only. The SW sniffs the response text for it before ever caching a nav.
const GATE_MARKER = "<!--fk-gate-->";

// Best-effort precache of the install icons; failure must not abort install.
const PRECACHE = [
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/apple-touch-icon.png",
];

// Is this a navigation into the Field Kit (any gated app page)? The home route
// is the bare "/field-kit" (no trailing slash — Next's default), so that exact
// path must be checked alongside the "/field-kit/…" prefix for every subroute.
function isFieldKitNavigation(req, url) {
  return req.mode === "navigate" && (url.pathname === "/field-kit" || url.pathname.startsWith("/field-kit/"));
}

// Is this a navigation to the itinerary route specifically — the one route
// with a bespoke SLICE 2 shell to fall back to when there's no cached copy.
function isItineraryNavigation(req, url) {
  return (
    req.mode === "navigate" &&
    (url.pathname === "/field-kit/itinerary" || url.pathname.startsWith("/field-kit/itinerary/"))
  );
}

// Staff console — online-only surface, carries cohort-wide notification/rally
// data. Never cached, regardless of who's viewing it.
function isAdminRoute(url) {
  return url.pathname.startsWith("/field-kit/admin");
}

// Decide whether a successful network response for a Field Kit navigation may
// be written to the cache. Reads (clones) the body to sniff for GATE_MARKER —
// the original response passed to event.respondWith is untouched and still
// streams to the page.
async function isCacheableFieldKitResponse(res, url) {
  if (!res.ok || res.status !== 200 || res.redirected) return false;
  if (isAdminRoute(url)) return false;
  if (url.searchParams.has("asId")) return false;
  const text = await res.clone().text();
  return !text.includes(GATE_MARKER);
}

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then(async (cache) => {
      // Icons are best-effort; the shells are cached separately so an icon 404
      // can't take an offline fallback down with it.
      await cache.addAll(PRECACHE).catch(() => undefined);
      await cache.add(SHELL_URL).catch(() => undefined);
      await cache.add(OFFLINE_URL).catch(() => undefined);
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

  // Field Kit navigation: network-FIRST. A cacheable response (see
  // isCacheableFieldKitResponse) is written to the cache and returned as-is; an
  // uncacheable one (login redirect, gate screen, admin, impersonation) is
  // returned as-is WITHOUT touching the cache — never served stale. On a
  // network failure, serve the last cached copy of this exact URL if present;
  // otherwise the itinerary route falls back to its SLICE 2 shell and every
  // other kit route falls back to the generic offline notice.
  if (isFieldKitNavigation(req, url)) {
    event.respondWith(
      fetch(req)
        .then(async (res) => {
          if (await isCacheableFieldKitResponse(res, url)) {
            const cache = await caches.open(CACHE);
            await cache.put(req, res.clone());
          }
          return res;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE);
          const cached = await cache.match(req);
          if (cached) return cached;
          const fallbackUrl = isItineraryNavigation(req, url) ? SHELL_URL : OFFLINE_URL;
          const fallback = await cache.match(fallbackUrl);
          return fallback || Response.error();
        })
    );
    return;
  }

  // Any other navigation (outside /field-kit) and API responses are per-user /
  // gated or out of scope — network only, never cached here.
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
