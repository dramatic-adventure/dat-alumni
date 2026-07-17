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
// (see field-kit-NAV-CACHE-DESIGN.md): only a successful, non-redirected,
// non-gate, non-admin, non-impersonated 200 gets written to the cache. If
// there's no cached copy yet and the network fails, the itinerary route falls
// back to its SLICE 2 bespoke non-gated shell (SHELL_URL, ships no user data,
// renders from the IndexedDB snapshot) and every other kit route falls back to
// the generic OFFLINE_URL notice. Never cache: /api/*, login redirects, the
// "not in program" gate screen (detected via GATE_MARKER), /field-kit/admin
// (staff console — online-only, cohort-wide data), or any ?asId= view.
//
// SLICE 4b (instant open): kit navigations are now CACHE-FIRST. A cached copy
// is served immediately (~0ms, with or without signal) and revalidated in the
// background; when the fresh copy differs, controlled clients on that URL get
// a "fk-nav-fresh" message and NavCacheReconciler runs a silent
// router.refresh() (home + itinerary additionally self-correct via
// LiveRefresh). If the revalidate comes back as a login redirect or the
// roster-gate screen, the cached entry is DELETED and the client gets
// "fk-nav-auth" → hard reload → the real redirect/gate shows (never masked by
// a stale page while online). Transient server errors leave the cached copy
// standing. The home ("/field-kit") + itinerary routes are also background-
// precached after any successful kit visit, so the day page cold-opens
// offline even if never directly visited. Cache-first only ever serves the
// device owner's own pages: admin/asId/gate responses are never written, and
// sign-out sweeps every fk-* cache (lib/fieldKitCache#clearFieldKitCaches).
//
// IMPORTANT: do NOT bump CACHE on routine deploys — see design §5. Cached HTML
// and the exact hashed _next/static chunks it references stay paired only
// because the asset cache is never purged by a normal deploy; bumping CACHE
// purges it and would break hydration for a device that's currently offline
// on an older build. Only bump it for an actual SW cache-schema change (like
// this one) — the existing activate fk-* sweep does the one-time migration.
const CACHE = "fk-v3";

// SLICE 5 — Field Library files (cache-on-open). Entries are written by the
// PAGE (lib/fieldKitCache#cacheLibraryFile stores the FULL file — the SW can't,
// because iOS audio only ever fetches Range partials); this SW serves them when
// the network can't, slicing Range responses out of the stored full body.
// Name is duplicated in lib/fieldKitCache.ts (LIB_CACHE_NAME) — keep in
// lockstep. NOT purged by activate (it survives SW schema bumps); sign-out
// clears it via the fk- prefix sweep in lib/fieldKitCache.ts.
const LIB_CACHE = "fk-lib-v1";

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

// SLICE 4b — the two daily-use routes, guaranteed cached after ANY successful
// kit visit (not just after being directly visited), so a cold offline open of
// the day page works from day one. Fetched with same-origin credentials and
// subject to the exact same isCacheableFieldKitResponse rules as a real visit.
const CORE_NAV_PRECACHE = ["/field-kit", "/field-kit/itinerary"];

// Once per SW lifetime is enough — the SW is torn down when idle, so misses
// (e.g. attempted while offline) retry naturally on the next cold start.
let corePrecacheAttempted = false;

async function ensureCoreNavPrecache(cache) {
  if (corePrecacheAttempted) return;
  corePrecacheAttempted = true;
  await Promise.all(
    CORE_NAV_PRECACHE.map(async (path) => {
      try {
        if (await cache.match(path)) return; // already have a (fresher) real visit
        const res = await fetch(path, { credentials: "same-origin" });
        const url = new URL(path, self.location.origin);
        if (await isCacheableFieldKitResponse(res, url)) await cache.put(path, res.clone());
      } catch {
        // offline / transient — next SW start retries
      }
    })
  );
}

// Tell every controlled kit window about a nav-cache event for `targetUrl`.
// The client (NavCacheReconciler) compares the URL against its own location
// and acts only if it's the page being viewed.
async function notifyClients(targetUrl, type) {
  const clients = await self.clients.matchAll({ type: "window" });
  for (const c of clients) c.postMessage({ type, url: targetUrl });
}

// Background revalidate for a navigation that was just answered from cache.
async function revalidateFieldKitNavigation(req, url, cache, cached) {
  let res;
  try {
    res = await fetch(req);
  } catch {
    return; // offline — the cached copy stands, nothing to reconcile
  }

  // Network reachable and says "signed out" (server-side redirect to /login):
  // never mask that with the stale copy — drop it and make the page show the
  // real redirect on reload.
  if (res.redirected) {
    await cache.delete(req);
    await notifyClients(req.url, "fk-nav-auth");
    return;
  }

  // Transient server trouble (5xx etc.) — keep the saved copy standing.
  if (!res.ok || res.status !== 200) return;

  const text = await res.clone().text();

  // Roster-gate screen at the same URL: access was revoked — same treatment
  // as the login redirect.
  if (text.includes(GATE_MARKER)) {
    await cache.delete(req);
    await notifyClients(req.url, "fk-nav-auth");
    return;
  }

  // Belt & braces: admin/asId can't be cache hits (never written), but never
  // let them be written here either.
  if (isAdminRoute(url) || url.searchParams.has("asId")) return;

  const oldText = await cached.clone().text();
  await cache.put(req, res);
  await ensureCoreNavPrecache(cache);
  if (text !== oldText) await notifyClients(req.url, "fk-nav-fresh");
}

// Serve a kit navigation: cache-first (instant) with background revalidate;
// network-first with offline fallbacks when there's no cached copy yet.
async function serveFieldKitNavigation(event, req, url) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(req);

  if (cached) {
    event.waitUntil(revalidateFieldKitNavigation(req, url, cache, cached));
    return cached;
  }

  try {
    const res = await fetch(req);
    if (await isCacheableFieldKitResponse(res, url)) {
      await cache.put(req, res.clone());
      event.waitUntil(ensureCoreNavPrecache(cache));
    }
    return res;
  } catch {
    const fallbackUrl = isItineraryNavigation(req, url) ? SHELL_URL : OFFLINE_URL;
    const fallback = await cache.match(fallbackUrl);
    return fallback || Response.error();
  }
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
            .filter((k) => k.startsWith("fk-") && k !== CACHE && k !== LIB_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// SLICE 5 — is this a Field Library file fetch (gated resource proxy)?
function isLibraryFile(url) {
  return url.pathname.startsWith("/api/field-kit/library/file/");
}

// Serve a library file: network-first (the route revalidates auth), falling
// back to the device-cached full copy. A Range request against the cached copy
// gets a properly sliced 206 — iOS <audio> won't play without one.
async function serveLibraryFile(req) {
  try {
    return await fetch(req);
  } catch {
    const cache = await caches.open(LIB_CACHE);
    // Match by URL (the stored entry is a Range-less full GET).
    const cached = await cache.match(req.url);
    if (!cached) {
      // A full-page open of a never-cached file while offline: show the kit's
      // offline notice, not the browser's raw network-error page.
      if (req.mode === "navigate") {
        const fallback = await (await caches.open(CACHE)).match(OFFLINE_URL);
        if (fallback) return fallback;
      }
      return Response.error();
    }

    const rangeHeader = (req.headers.get("range") || "").trim();
    const m = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader);
    if (!m || (!m[1] && !m[2])) return cached.clone();

    const buf = await cached.clone().arrayBuffer();
    const total = buf.byteLength;
    let start;
    let end;
    if (!m[1]) {
      // Suffix range "bytes=-N" — the LAST N bytes (matches the server route).
      start = Math.max(total - Number(m[2]), 0);
      end = total - 1;
    } else {
      start = Number(m[1]);
      end = m[2] ? Math.min(Number(m[2]), total - 1) : total - 1;
    }
    if (!(start >= 0) || start > end || start >= total) {
      start = 0;
      end = total - 1;
    }
    return new Response(buf.slice(start, end + 1), {
      status: 206,
      headers: {
        "Content-Type": cached.headers.get("Content-Type") || "application/octet-stream",
        "Content-Range": `bytes ${start}-${end}/${total}`,
        "Content-Length": String(end - start + 1),
        "Accept-Ranges": "bytes",
      },
    });
  }
}

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

  // Field Kit navigation: CACHE-FIRST for instant opens (SLICE 4b) — a cached
  // copy is served immediately and revalidated in the background (fresh →
  // silent client refresh; login-redirect/gate → entry deleted + client
  // reload). With no cached copy yet: network-first, writing only cacheable
  // responses (see isCacheableFieldKitResponse); on network failure the
  // itinerary route falls back to its SLICE 2 shell and every other kit route
  // falls back to the generic offline notice.
  if (isFieldKitNavigation(req, url)) {
    event.respondWith(serveFieldKitNavigation(event, req, url));
    return;
  }

  // SLICE 5 — Field Library files: the one /api path with an offline story.
  // Checked BEFORE the generic /api and navigation bails (opening a file in a
  // new tab is a navigation). Network-first; offline falls back to the page-cached
  // copy with real Range slicing (see serveLibraryFile).
  if (isLibraryFile(url)) {
    event.respondWith(serveLibraryFile(req));
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
