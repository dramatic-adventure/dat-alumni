# Events: Google Sheets migration, detail pages & auto-archive — Implementation Plan

_Status: proposal for review. No code changes yet._

This plan covers two intertwined pieces of work:

- **Item 5** — move event data into a Google Sheet read via the Sheets API, with a `visible` toggle (and related flags).
- **Item 6** — make event clicks render the live `EventDetailPageTemplate`, and auto-archive events into `/projects` (default) or `/theatre` when they pass, with a Sheet override.

Decisions already confirmed:

- Sheets migration → **write a full plan first** (this document).
- Archive routing → **`/projects` by default, unless the Sheet says otherwise.**
- Detail page → **reuse the live `EventDetailPageTemplate`.**

---

## 1. The core design decision: a hybrid data model

`DatEvent` (in `lib/events.ts`) is not a flat record. Alongside scheduling fields it carries deeply nested editorial content: `translations` (per-language title/subtitle/credits/quotes), `credits[]`, `photoGallery[]`, `pressQuotes[]`, `heroCreditPeople[]`, and more. A spreadsheet is the wrong home for that nested content — it would be unmanageable as dozens of JSON-in-a-cell columns.

**Recommendation: split the data by who owns it and how often it changes.**

- **Sheet-owned (operational fields)** — the things you and non-devs will edit often, one row per event:
  `id`, `title`, `subtitle`, `category`, `date`, `endDate`, `time`, `doors`, `venue`, `address`, `city`, `country`, `description`, `image`, `imageFocus`, `ticketUrl`, `ticketPrice`, `ticketType`, `featured`, plus the new control flags below.
- **Code-owned (rich editorial content)** — `translations`, `credits`, `photoGallery`, `pressQuotes`, `artistNote`, etc. These keep living in code (or are inherited from the linked `production` via `productionMap`). Most events never need them; the ones that do are usually flagship productions that already have a linked production record.

The loader **merges** the two: Sheet row (operational) + optional code override keyed by `id` (rich content) → a complete `DatEvent`. This gives non-devs full control of scheduling and visibility without a deploy, while preserving the rich detail pages where they exist.

New control columns in the Sheet:

| Column | Type | Meaning |
|---|---|---|
| `visible` | `TRUE`/`FALSE` | Master on/off. `FALSE` hides the event everywhere (listings, detail, archive). |
| `featured` | `TRUE`/`FALSE` | Pins as the "Featured" pick. |
| `archiveTo` | `projects` \| `theatre` \| `none` | Override for where it lands once past. Blank = default by category. |
| `status` | `upcoming` \| `past` \| `cancelled` | Optional manual override; normally derived from the date (see §4). |

---

## 2. The Sheet

- A new tab (e.g. `Events-Live`) in the existing DAT spreadsheet, mirroring the alumni convention (`Profile-Live`).
- Column headers exactly matching the Sheet-owned field names above (one header row, one event per row).
- A published CSV export URL added to `lib/csvUrls.ts` for the Netlify Blobs fallback path (same pattern as alumni/stories).
- Documented column reference (a `README` tab or a short doc) so editors know the allowed values for `category`, `ticketType`, `archiveTo`, and the `TRUE/FALSE` flags.

---

## 3. The loader (`lib/loadEvents.ts`)

Mirror `lib/loadAlumni.ts` exactly so we inherit the proven caching/fallback behaviour:

1. **Primary:** Sheets API via `sheetsClient` (`lib/googleClients.ts`), reading `EVENTS_SHEET_ID` / `EVENTS_LIVE_TAB` env vars.
2. **Fallback:** `loadCsv` against the Blobs-cached CSV when the API is unavailable (rate limit / cold start).
3. **Normalisation:** a `normalizeEventRow()` (parallel to `normalizeAlumniRow`) that coerces `TRUE/FALSE` strings to booleans, trims fields, validates `category`/`ticketType`, and drops rows with no `id` or `date`.
4. **Merge:** join each row with the optional code-owned rich-content record by `id`.
5. **Filter:** drop `visible === FALSE` rows up front so hidden events never reach any page.
6. **Memoise:** wrap in React `cache()` and honour the existing `ALUMNI_TTL_MS`-style TTL.
7. **Refresh:** add the events tab to `netlify/functions/refresh-fallbacks.ts` so the Blob stays fresh on the 15-min schedule.

Then `lib/events.ts` is reduced to: the `DatEvent` type, the date/format helpers (`formatDateRange`, `shortMonth`, etc.), the derived-production logic, and the code-owned rich-content map. The hardcoded `events` array is replaced by `loadEvents()`.

**Migration:** a one-off script reads the current `events` array and writes the operational columns to the Sheet, so we start with today's data already populated — no manual re-entry.

**Note on client vs server:** `loadEvents` is server-only (like `loadAlumni`). The events-prototype page is currently a Client Component (`"use client"`). To consume server-loaded data it becomes a thin server wrapper that fetches events and passes them to the existing client UI as props (small refactor, no visual change).

---

## 4. Auto-archive (Item 6)

The data already supports this — `isElapsed()` exists. Logic:

- **Past detection:** an event is "past" when its `endDate` (or `date` if single-day) is before today, unless `status` is manually set in the Sheet.
- **Upcoming listings** (`/events`, the prototype) show non-past, visible events.
- **Archive placement** when past:
  - `archiveTo` set → honour it (`projects`, `theatre`, or `none`).
  - Otherwise default by category: **`performance` → `/theatre`**, **`festival` & `fundraiser`/community → `/projects`**.
  - `none` → archived (drops out of upcoming) but listed in neither public archive.
- `/theatre` and `/projects` archive pages get a resolver that pulls past events matching their bucket and merges them with their existing archive sources.

No cron needed — placement is derived at render time from the date, so an event moves itself the day after it ends.

---

## 5. Detail pages (Item 6)

- Event clicks (currently the prototype's in-page `PerformanceDetail` / `ArchiveDetail`) route to the live **`EventDetailPageTemplate`** — the same template behind `/festivals/[id]` and `/gatherings/[id]`.
- All three categories use it for now; festivals/community can get bespoke templates later without re-plumbing.
- The prototype's bespoke `DetailViews.tsx` is retired once the standard template is wired in (kept until then so nothing breaks mid-migration).
- Open question to confirm during build: canonical event URL. Today there are parallel routes (`/events/[id]`, `/festivals/[id]`, `/gatherings/[id]`). I'd recommend consolidating on one event route with the template branching internally, but I'll flag the exact slug strategy before changing any routing.

---

## 6. Suggested sequencing

1. **Sheet + loader foundation** — create the tab, `loadEvents.ts`, normaliser, fallback, refresh hook; migrate current events into the Sheet. (No visible change; validate parity against the current hardcoded list.)
2. **Visibility + flags** — wire `visible`/`featured`/`archiveTo`/`status` through listings.
3. **Auto-archive** — date-driven placement into `/theatre` and `/projects`.
4. **Detail template swap** — route clicks to `EventDetailPageTemplate`; retire `DetailViews`.
5. **Verification** — parity check (Sheet output vs current pages), archive-routing spot checks, and a hidden-event check; run `npm run check`.

---

## 7. Risks / things to confirm before coding

- **Rich-content fields**: confirm the hybrid split is acceptable (Sheet = operational, code = translations/credits/galleries). If you'd rather some of those be Sheet-editable too, we add specific columns — but I'd keep nested arrays in code.
- **Env vars**: needs `EVENTS_SHEET_ID` (and optional `EVENTS_LIVE_TAB`) plus a CSV export URL in `csvUrls.ts`; the existing GCP service account already has Sheets access.
- **Canonical event route** (see §5) — the one routing decision I want to settle before touching middleware/redirects.
- **`/projects` archive shape** — I'll confirm how `/projects` currently sources and renders items so archived festivals/community events slot in cleanly.
