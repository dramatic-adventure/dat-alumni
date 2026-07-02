# Field Kit — Navigation Cache / App-Shell Design

**Date:** 2026-06-30 · **Mode:** design only, no code changed.
**Extends:** `public/sw.js` (Slice 1 asset cache + Slice 2 itinerary-only offline
fallback + Slice 3 push). **Must stay consistent with:** `lib/captureQueue.ts` /
`lib/captureSync.ts` (Slice C offline capture queue) and `lib/fieldKitAccess.ts`
(the gate every page re-checks server-side).

Goal: already-visited `/field-kit/*` pages load instantly on repeat nav, and
(later) the app can cold-open with no signal at all — for ALL kit pages, not
just the itinerary.

---

## 0. What exists today

- `sw.js` caches static assets (`_next/static/*`, icons, fonts, images)
  stale-while-revalidate. Safe: these are content-hashed and non-gated.
- `sw.js` special-cases exactly one navigation — `/field-kit/itinerary` — as
  network-first with fallback to a **precached, non-gated static shell**
  (`field-kit-shell.html`) that renders from the on-device IndexedDB itinerary
  snapshot. No live gated HTML is ever cached, even for the itinerary.
- Every other `/field-kit/*` navigation (home, cohort, artist/[slug], capture,
  traces, admin) is network-only. First-time-offline or slow-network opens of
  these pages currently just fail.
- Every page is `force-dynamic` / `revalidate = 0` and re-checks
  `requireFieldKitPage()` itself (defense in depth against the layout being
  bypassed) — the HTML body is per-user (roster, headshots, capture text,
  impersonation state).
- `signOut()` (`components/field-kit/AccountMenu.tsx`) does **not** clear
  IndexedDB or Cache Storage today — pre-existing gap, see §3.

---

## 1. Navigation caching strategy

**Recommendation: network-first with cache-fallback-on-failure, generalized
to every gated `/field-kit/*` navigation** (not stale-while-revalidate).

Reasoning: these documents are per-user and, for `/field-kit/admin` and the
`?asId=` impersonation case, carry cohort-wide or another-artist's data. SWR's
whole point is to *show the stale copy first, unconditionally* — for gated
content that means an admin could see yesterday's cohort roster, or a
just-un-impersonated admin could flash the previous artist's traces, before
the revalidate lands. That's an acceptable trade for anonymous, content-hashed
assets; it isn't for gated HTML. Network-first only ever shows a cached copy
when the network genuinely fails (offline, or the request errors) — never as
a matter of course. This is exactly the rule Slice 2 already applied to the
itinerary; this design just generalizes it instead of special-casing one
route.

The honest cost: on a slow-but-present connection, network-first still waits
on the round trip, so it doesn't feel "instant" the way SWR would. I'm
splitting that off as a follow-up (§8) rather than solving it in the same
change — see open question there.

---

## 2. What to cache vs never cache

Cache a navigation response only if **all** of:
- `req.mode === "navigate"`, same-origin, `req.method === "GET"`.
- `url.pathname` starts with `/field-kit/` (never `/api/*` — already excluded
  today and unchanged).
- `res.ok && res.status === 200 && !res.redirected` — this alone excludes the
  signed-out case, since `requireFieldKitPage`'s signed-out branch is a
  server-side `redirect()` to `/login`, which `fetch()` surfaces as
  `res.redirected === true` (or a final `res.url` outside `/field-kit/`).
- No `asId` search param — see §3.
- Not the roster-gate ("not in program") screen — and here there's a real
  gap: `app/field-kit/layout.tsx` renders `NotInProgram` for that case as a
  **plain 200**, same URL, same status as the real page (it's inline JSX, not
  a redirect or a distinct status). Nothing currently distinguishes the two
  responses at the HTTP level, so the SW can't tell them apart without a
  signal.

  Two ways to add that signal, in order of preference:
  1. **HTML marker**: add a small literal (e.g. `<!--fk-gate-->` or a
     `data-fk-gate` attribute) to the `NotInProgram` render only. The SW
     clones the response, reads the (small) HTML text, checks for the marker
     before deciding to `cache.put`. Cheap, no auth/runtime plumbing, one-line
     change confined to the existing gate branch.
  2. **Response header**: have the layout emit e.g. `x-fk-gate: 1` when
     `!access.allowed`. Cleaner in principle, but Server Components can't set
     arbitrary response headers directly — this would need to move (part of)
     the gate check into `middleware.ts`, which re-runs `getFieldKitAccess()`
     (session + Sheets roster lookup) on the edge runtime. That duplicates an
     already-nontrivial server check and risks edge-runtime incompatibility
     with the Google Sheets client.

  I'd recommend (1) — flagged as an open question in §9 since it's a small
  but real product-code change, not just an SW change.

- `/field-kit/admin` — recommend **excluding entirely** from the nav cache
  (see §9, open question #1): it's a staff console, not an in-field artist
  surface, and the value of offline access there is close to zero while the
  privacy cost (cohort-wide notification/rally-point data resting on disk) is
  real.

---

## 3. Auth / privacy

Caching a signed-in owner's own gated pages on their own device isn't a new
trust boundary — the app already persists per-user data unencrypted on-device
via IndexedDB (`lib/fieldKitDb.ts`'s itinerary snapshot + `captureQueue.ts`'s
queued captures, including photo/voice blobs). Cache Storage is the same
sandbox (per browser profile + origin) as IndexedDB. The nav cache adds more
of the same kind of data (cohort roster, traces text, itinerary), not a new
category of risk.

**Real risk: shared/borrowed devices.** Two gaps, one pre-existing and one
this feature would enlarge:
- `signOut()` doesn't clear IndexedDB or Cache Storage today. Anyone with
  devtools access to that browser profile can read the last signed-in user's
  itinerary/captures right now, session or no session. This feature adds the
  same exposure for cohort roster + traces + admin data (if admin isn't
  excluded). This is worth fixing in this slice or immediately after — see
  open question #4.
- **Impersonation (`asId=`)**: an admin's device would otherwise cache the
  *impersonated artist's* page content (their traces, their view) under a
  cache key that includes `?asId=...` (Cache API keys on full URL, so this
  doesn't collide with the admin's own unimpersonated pages) — but it still
  means another person's data sits on the admin's device indefinitely.
  Recommend excluding any request with `asId` from the nav cache outright.
  Impersonation is an online staff workflow; it doesn't need offline support,
  so this costs nothing functionally.

**Expired session while offline:** while genuinely offline, no fetch can
reach the server to re-validate the session at all — this isn't specific to
navigation caching, it's true of the whole app. Rule: only fall back to the
cached copy on a **network failure** (offline/timeout), never on a
successful-but-redirected response. If the network is reachable and answers
"go to /login" (session actually expired, but device is online), show that
real redirect — never mask it with a stale cached page. If the device is
truly offline, serve the last-cached page (matches the itinerary's existing
behavior) rather than a generic "you're offline" wall — the whole point of
this feature is a touring artist with zero signal who *was* legitimately
allowed in when that page was captured. Residual, accepted risk: if access
was revoked while they were offline (e.g. removed from the roster), they'd
keep seeing the stale cached page until back online. Same trade-off Slice 2
already accepted for the itinerary; this just extends it.

---

## 4. Freshness

Network-first means every online visit already revalidates by definition —
no separate background-refresh mechanism is required for correctness. The
open question is UX: when a page loads from cache (device was offline or the
fetch timed out — once §8's race exists), should the app silently swap in
fresh content when connectivity returns, or prompt?

Recommend reusing the existing `SyncStatus` surface
(`components/field-kit/SyncStatus.tsx`) rather than inventing new UI: it
already shows Online/Offline and "last synced ⋯" for the itinerary snapshot.
Extend the same pattern — "showing offline copy" / "synced 3m ago" — for
whichever page is currently cached-and-stale, instead of a silent swap or a
modal. Avoid the itinerary shell's current approach of a hard `location
reload()` on reconnect for the *general* case — reloading every open kit page
the instant signal returns is more jarring across cohort/traces/admin than it
is for the single-purpose itinerary shell.

---

## 5. Next.js build-ID / chunk versioning

The safety property that matters: **a cached HTML document is only ever
served when the device is too offline to have fetched anything else anyway**
(§1's network-first rule). That means whenever a stale HTML entry *is*
served, the device's static-asset cache (`isStaticAsset` SWR bucket) still
holds the exact hashed `_next/static/<buildId>/...` chunks that HTML
references, because:
- New deploys produce new hashed filenames; they never overwrite or evict old
  ones from Cache Storage.
- The only thing that purges the asset cache is the `activate` handler's
  `fk-*` prefix sweep, which only fires when the `CACHE` string constant
  itself changes between deploys.

Conclusion: **do not bump `CACHE` on routine deploys.** Doing so would purge
the old hashed chunks a currently-offline device's cached HTML still depends
on, breaking hydration for exactly the user this feature is meant to help.
Only bump it for an actual SW cache-schema change (e.g. changing what gets
cached, as this design itself would do — that's a legitimate one-time bump).
Self-healing is automatic: the moment the device is back online, the next
successful navigation fetch returns fresh HTML (new build refs) and
overwrites the stale cache entry for that URL — no explicit build-ID tracking
needed. (Build-ID tracking would matter if we ever moved to SWR for HTML,
which is one more reason not to — see §1.)

No change needed to the existing `skipWaiting()`/`clients.claim()` lifecycle:
a tab already open during a deploy keeps running its already-hydrated JS
regardless of which SW controls it; only its *next* navigation is affected,
and that's handled correctly by network-first.

---

## 6. Offline fallback for a never-visited page

For a `/field-kit/*` navigation that fails on the network **and** has no
cache entry: serve a small generic static offline page (sibling to
`field-kit-shell.html`, e.g. `field-kit-offline.html`) — non-gated, ships no
data, just "You're offline. This page hasn't been saved to your device yet."
plus a link back to `/field-kit` (the natural entry point, almost certainly
already cached) and a retry/reload action. Not attempting a dynamic "here's
what you do have offline" listing in v1 — enumerating Cache Storage keys from
a static HTML file requires SW messaging plumbing for marginal value; flag as
a nice-to-have, not required now.

---

## 7. Consistency with Slice C (capture)

`/field-kit/capture`'s **page shell** (the RSC wrapper around `CaptureForm`,
gated + resolving `currentDayId`) is not currently cached at all — only the
itinerary has a bespoke offline path today. Under the general rule in §2, the
capture page becomes cacheable like any other kit page, so it can be opened
offline (first requirement for "queued captures can be made" while offline).
Once the HTML shell loads from cache, `CaptureForm` + `captureQueue.ts` +
`captureSync.ts` already handle the actual offline-safe write path — nothing
in Slice C needs to change. The one dependency: `currentDayId` gets baked
into the cached HTML at capture time and won't auto-advance while offline
across midnight — acceptable, matches how the itinerary's own "today" resolve
already behaves offline.

---

## 8. Slicing

Two genuinely different capabilities are bundled in the prompt, and they
don't have to ship together:

- **4a — network-first + cache-fallback for all gated `/field-kit/*` nav**
  (this doc's core mechanism). Gives "cold-open offline for anything you've
  already visited" uniformly. Small diff, same shape as Slice 2, no new UX
  decisions beyond the `SyncStatus` tweak in §4.
- **4b — perceived-speed race** (short network timeout, e.g. ~2s; serve
  cache immediately if it wins the race, then silently reconcile when the
  slower network response lands). This is where "instant repeat-nav" *while
  online-but-slow* actually comes from — 4a alone doesn't produce it, since
  network-first still waits on a live round trip whenever the network
  eventually answers. 4b needs more product judgment (reconcile UX, whether
  to swap content under the user mid-read) and is riskier to get subtly wrong
  than 4a.

**Recommendation: ship 4a first**, validate with real field connectivity
(touring artists on foreign SIMs / venue wifi), then layer 4b once the
baseline network-first behavior is proven safe. This mirrors how Slice 2 → 3
→ C were already sequenced in this codebase.

---

## 9. Open questions (need answers before implementation)

1. **Exclude `/field-kit/admin` from the nav cache entirely?** Recommend yes
   — staff console, online-only use case, avoids resting cohort-wide
   notification/rally-point data on disk for no real offline benefit.
2. **Exclude any navigation with `?asId=` (impersonation) from caching?**
   Recommend yes — see §3.
3. **How to detect the "not in program" gate screen** — OK to add a small
   HTML marker to `NotInProgram` in `app/field-kit/layout.tsx` (§2, option 1),
   or do you want to investigate the middleware/header route instead despite
   the edge-runtime/Sheets-client complication?
4. **Sign-out should clear on-device state.** `signOut()` currently leaves
   IndexedDB (itinerary snapshot, capture queue) and would leave the new nav
   cache behind on a shared device. Fix now as part of this slice, or file as
   an immediate fast-follow?
5. **Keep the itinerary's Slice 2 bespoke shell, or fold it into the general
   mechanism?** My take: keep it as an *extra* last-resort fallback
   specifically for itinerary (cache-miss-of-last-resort, i.e. first-ever
   offline open with zero prior visit) since it already exists and itinerary
   is the highest-value cold-open page; every other route falls back to the
   generic offline page (§6) in that same never-visited case. Confirm, or
   would you rather retire the bespoke shell in favor of one mechanism?
6. **Cache eviction/TTL for cached HTML** — none proposed; entries are simply
   overwritten on the next successful online visit (§5). Is "no explicit
   eviction" acceptable, or do you want a max-age sweep on `activate`?
7. **4a vs 4a+4b together** — confirm shipping network-first-fallback alone
   first (§8), rather than bundling the timeout-race in the same change.

---

## Recommended approach (summary)

Generalize Slice 2's network-first-with-cache-fallback pattern to every
gated `/field-kit/*` navigation except `/field-kit/admin` and any `asId=`
impersonation request, gated on `res.ok && status===200 && !redirected` plus a
new HTML marker to exclude the roster-gate screen. Keep `CACHE` un-bumped
across routine deploys so offline devices' cached HTML and cached chunks stay
paired (§5). Ship as its own slice (4a) without the perceived-speed race;
layer the race + reconcile UX later (4b) once real field data justifies it.
Fix the `signOut()` on-device-data gap alongside this, since the feature
meaningfully enlarges what's left behind on a shared device otherwise.
