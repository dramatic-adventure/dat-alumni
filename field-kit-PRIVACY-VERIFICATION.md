# Field Kit privacy hardening — verification

The Field Kit (`/field-kit/*`) is **completely private**: visible only to (a) admins
and (b) artists on the roster for the program being viewed. No public/anonymous
access; no cross-program access.

## Where the gate lives (defense in depth)

| Layer | File | Role |
|---|---|---|
| Access resolver | `lib/fieldKitAccess.ts` → `getFieldKitAccess(programId)` | Single source of truth. Admin bypass via `isAdmin()`; members matched via `getAlumniIdForOwnerEmail` against `clusterRoster(programId)` (built from `programMap`). |
| Page guard | `lib/fieldKitAccess.ts` → `requireFieldKitPage()` | Called at the **top of every page**, **before any data load**. Signed-out → `redirect(login)`; not-on-roster → `return null` (no data fetched). |
| Layout | `app/field-kit/layout.tsx` | Redirects signed-out; renders the generic "not on the roster" gate (leaks no program metadata). |
| API/route/action guard | `lib/fieldKitAccess.ts` → `guardFieldKitApi()` | For any **future** route handler / API route / server action. Returns 401 (signed-out) / 403 (not on roster). **Rule: every such endpoint MUST call this itself — never trust the layout or middleware.** |

Why the page must guard and not rely on the layout: in the App Router the page's
server component still **executes** even when the layout opts not to render
`{children}`. Without the top-of-page guard, an unauthorized request would still
trigger the page's data fetch.

## Strict per-program scoping

- `requireFieldKitPage()` returns the **verified** `programId`, and the itinerary
  page loads only `loadProgramItinerary(access.programId)`.
- The previous `?? loadActiveProgramItinerary()` fallback was **removed** from the
  itinerary page: it could resolve a *different* program (the first/active one) than
  the roster we verified, i.e. a cross-program leak. If no itinerary exists for the
  verified program, the page renders the empty state — never another program's data.
- If routes ever become multi-program (`/field-kit/[program]/...`), derive the
  `programId` from the route and pass it to `requireFieldKitPage(programId)` /
  `guardFieldKitApi(programId)` so a member of program A cannot load program B.

## Data source stays private

- The `program*` CSV URLs in `lib/csvUrls.ts` are intentionally **empty** (`""`),
  so `lib/loadProgram.ts` uses the **authenticated Sheets API only** and never
  fetches a public "published to web" CSV. Do **not** fill these in unless the
  published CSVs are themselves access-controlled.
- **Manual confirm (one-time, in Google Sheets):** for the alumni spreadsheet,
  File → Share → Publish to web → confirm the *Field Kit Program / Itinerary
  Chapters / Itinerary Days / Time Anchors* tabs are **not** published.

## No static generation / shared-CDN caching

Every `/field-kit` page and the layout export `revalidate = 0` **and**
`dynamic = "force-dynamic"`. There is no `generateStaticParams`. Responses are
per-user and never served from a shared cache.

## Manual test matrix

Run `npm run dev`, then for each persona hit `/field-kit`, `/field-kit/itinerary`,
`/field-kit/capture`, `/field-kit/cohort`, `/field-kit/traces`:

| # | Persona | Expected |
|---|---|---|
| a | **Anonymous** (signed out) | 307 redirect to `/login?callbackUrl=…`. No itinerary/program data in the HTML. |
| b | **Signed-in, NOT on roster** | Generic gate screen ("For artists on the trip."). No program title/dates/partner/club names in the response. Confirm the network/HTML contains **no** itinerary data. |
| c | **Roster member** (a `programMap` `artists` slug for `passage-slovakia-2026`, mapped to their owner email in Profile-Owners) | Full itinerary renders. |
| d | **Admin** (email in `ADMIN_EMAILS`) | Full itinerary renders (bypasses roster). |

Quick checks for (a) and (b) — itinerary content must NOT appear:

```bash
# (a) anonymous — expect a redirect, and no itinerary content in the body
curl -si http://localhost:3000/field-kit/itinerary | head -20
curl -s  http://localhost:3000/field-kit/itinerary | grep -i "slovakia\|chapter\|partner" && echo "LEAK!" || echo "clean"
```

For (b), repeat with a non-roster session cookie; the body should contain the gate
copy ("For artists on the trip.") and none of the program metadata.

To flip a test account between (b) and (c): add/remove its slug under the
`passage-slovakia-2026` cluster `artists` in `lib/programMap.ts` (and ensure
Profile-Owners maps the test email → that slug).
