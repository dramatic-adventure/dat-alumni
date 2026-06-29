# Field Kit — Production Build Spec · Slice 1

**Status:** Mockup approved → ready to build the first slice. Hand this whole file to a fresh Claude Code task as the anchoring context.
**Prepared:** June 2026 · companion to `journey-card-BUILD-SPEC.md` (the public-artifact side, already in progress).
**Approved visual reference:** `app/journey-card-mockup/v17/traveling-artist/` — especially `shell/Shell.tsx`, `itinerary/ItineraryCompanion.tsx`, `parts.tsx`, `sampleProgram.ts`.
> **Location note (2026-06-28):** this directory is NOT in the working tree — it was removed in commit `ece64e8` (Jun 3) and gitignored (`.gitignore:78`). The files survive in the live design workspace at `~/Documents/dat-alumni.OLD-icloud/app/journey-card-mockup/v17/traveling-artist/`. Restore that folder into the working tree (it stays gitignored — fine) before porting components; see `field-kit-AUDIT.md` §0. The data-layer work (§4–§5) does not need the mockup and is already underway: `lib/programItinerary.ts` + `lib/loadProgram.ts` exist; the Sheet schema to create is in `field-kit-ITINERARY-SCHEMA.md`.
**Build this slice only.** The Field Kit is large; we are building it in parts. This spec is **Slice 1**. Do not build later slices.

---

## 0. First, before any code

1. **Load the `dat-app-guardrails` skill** and follow it for the entire task (surgical edits, no repo drift, no token waste in this large Next.js 16 codebase).
2. **Honor CLAUDE.md: make no changes until you have 95% confidence.** Section 12 of this spec is a list of open questions — resolve them with Jesse first. Several have a recommended default; confirm before relying on it.
3. Read the four mockup files above end-to-end. They are the design contract for this slice.
4. `npm run check` (typecheck + lint) must pass before you commit. Netlify build command: `DATABASE_URL=file:./dev.db npm run prisma:generate && npm run build`.
5. **Keep the mockup intact** as the visual reference until the production surface replaces it. Do not edit anything under `app/journey-card-mockup/`.

---

## 1. What the Field Kit is (the whole product, for context)

The V17 mockup describes one system with **two surfaces** and **two products**:

- **Two surfaces:** the **Field Kit** (mobile, offline-first, installable PWA — used on the ground mid-trip) and the **Journey Card Studio** (desktop — composing/reviewing/publishing the artifact).
- **Two products:** **The Companion** (private in-program workspace) and **The Journey Card** (the public artifact that comes out of it).

The **Journey Card** side (public artifact, alumni-profile-attached) is already being built — see `journey-card-BUILD-SPEC.md`, `lib/journeyCard.ts`, `lib/loadJourneyCards.ts`, `app/journeys/`, `app/api/alumni/journey/`. **Do not touch that work.**

This spec is the **Companion / Field Kit** side, which has **no production code yet**. We build it slice by slice.

The full Companion eventually includes: Today home, Itinerary, Quick Capture, My Traces, Composer, Field Library (Resources), The Company (Cohort), and the Field Updates ops primitives (Rally Point · Roll Call · Company Choice), plus staff Admin Field Ops and the Itinerary System pipeline. **None of those are in Slice 1.**

---

## 2. Slice 1 — scope (build exactly this)

**Goal:** stand up the Field Kit as an installable, offline-first PWA whose first job is the one an artist needs most in the field: *“What is today, and what do I do with it — even with no signal?”* That means the **Today home** and the **full Itinerary field document**, reading **live program/itinerary data**, precached for offline.

### In scope
- A **dedicated Google Sheet tab** (or tabs) holding the program + itinerary, with a first-class loader (mirrors `lib/loadJourneyCards.ts`). The itinerary is the single source of truth for program facts.
- The **Field Kit route shell**: a mobile-first base route with the persistent bottom tab bar.
- **Today / Home** (`shell/Shell.tsx` ported): masthead, today’s itinerary timeline, the four color-coded ops modules **as read-only stubs**, the Quick Capture spark **as a stub**, “pack for today,” today’s resources (read-only list), and “with you today.”
- **Itinerary** (`itinerary/ItineraryCompanion.tsx` ported): the chapter spine with nested day leaves, GOAL/TIPS blocks, spirit lines, time anchors, drama-club + partner-org chips, today highlighting.
- **PWA foundation:** web app manifest, service worker, “Add to Home Screen,” and offline precache of the app shell + itinerary + cohort roster + safety card. Offline-state indicators (“Saved on this device — syncs when reconnected”).
- **Auth gating** so only in-program artists (and staff) reach the Field Kit.

### Explicitly OUT of scope (later slices — leave as stubs/links, do not build)
- Quick Capture write flow and the seven invitations (`INVITATIONS`).
- My Traces.
- Field Updates **write paths**: Rally Point, Roll Call, Company Choice (and their offline queues/sync).
- Composer, Publish, Resources detail/library, full Cohort/Company detail, Admin Field Ops, the Itinerary System (Pipeline), Retroactive.

On Today, the four ops modules and the capture spark **render visually** (so the board looks right) but are **non-interactive stubs** — disabled, or linking to a simple “Coming soon” state. Confirm the stub treatment in §12.

---

## 3. Locked decisions

- **Design system:** the V17 dark-theatrical token system in `sampleProgram.ts` (`T`, `FONT`, `KRAFT_PAGE`, `WASH`, `accent()`). Reuse it verbatim — do not invent new colors. Fonts are the existing `--font-anton` / `--font-space-grotesk` / `--font-dm-sans` already wired in `app/fonts.ts` + `app/layout.tsx`.
- **Mobile-first, offline-first.** The Field Kit is for artists in jungles, mountain gorges, and basement venues with no signal. Every save reads “Saved on this device — syncs when reconnected.” No scary error states. Nothing gets lost.
- **Data source = a dedicated Google Sheet tab** in `ALUMNI_SHEET_ID` (Jesse’s decision), loaded via the Sheets API with the CSV/Netlify-Blobs fallback pattern the rest of the app uses. **Not** a repo config file, **not** the staff Pipeline UI (that is a later slice).
- **Itinerary is the single source of truth** for program-level facts (chapters, days, locations, dates, drama clubs, partner orgs). Anything later (capture, cards) binds to this spine.
- **Reuse existing domain data where it already exists:** drama clubs via `lib/dramaClubMap.ts`, programs via `lib/programMap.ts`. Do not duplicate them into the new tab — reference by slug, exactly as the mockup does.
- **The four ops modules are stubs in this slice.** They are real surfaces in a later slice; here they only need to look right.
- First program = **PASSAGE: Slovakia 2026** (matches the mockup’s `sampleProgram` story and the Journey Card work).

---

## 4. Data model — the program/itinerary store (its own thing)

Model the new tab(s) on the real types already in the mockup’s `sampleProgram.ts`. Give them **first-class columns**, exactly as `loadJourneyCards.ts` did for Journey Cards — no metadata crammed into a `tags` blob.

The shapes to reproduce as a real store (copy the field semantics from `sampleProgram.ts`):

- **Program (meta):** `programId, program, location, country, year, label, dates, essence, todayDayId` (+ link). One row.
- **Chapter:** `id, programId, num, verb, place, title, description, goal, tips, accent, prompt, dramaClub (slug), partnerOrg (slug), dayIds, status`. (`status` ∈ `complete | draft | empty` is the artist’s private chapter-contribution state; for Slice 1 it can default to `empty`.)
- **ItineraryDay:** `id, programId, chapterId, dayNum, dateLabel, fullDate, location, title, what, spirit, cohortNote, dramaClub (slug), partnerOrg (slug), prep[], times[]`.
- **TimeAnchor:** `time, label, bold, note, marker` — the day’s schedule rows (Ecuador-PDF pattern).

**Open decision (resolve in §12 with Jesse before creating the tab):** the exact tab layout — one tab vs. a small set (e.g. `Program`, `Itinerary Chapters`, `Itinerary Days`), and how to serialize the nested `times[]`/`prep[]`/`dayIds` into cells (separate Time-Anchors tab vs. a delimited cell). Recommend: a `Program` row + a `Chapters` tab + a `Days` tab, with `times` in their own `Time Anchors` tab keyed by `dayId` (cleanest for staff editing). Confirm the column set the same way the Journey Card tab was confirmed before it was created.

---

## 5. The new data layer (mirror the Journey Card loader)

Create a dedicated loader — **do not** overload an existing one:

- `lib/loadProgram.ts` (new). Define first-class TS types (`ProgramRow`, `ChapterRow`, `ItineraryDayRow`, `TimeAnchor`) and a display type (`ProgramItinerary` with nested `Chapter[] → ItineraryDay[] → TimeAnchor[]`).
- Loaders: `loadProgramItinerary(programId)` → fully-resolved nested object for the Field Kit; plus small selectors mirroring the mockup helpers (`dayById`, `chapterForDay`, `chapterById`).
- **Auth/read pattern:** mirror `lib/loadJourneyCards.ts` exactly — `sheetsClient` from `lib/googleClients.ts`, read the new tab(s) in `ALUMNI_SHEET_ID`, `rowToObj`/`norm`/`coerceBool` helpers, header-keyed parsing.
- **Fallback + caching:** follow the project caching strategy (CLAUDE.md §“Caching Strategy”): React `cache()` request memoization, and a CSV/Netlify-Blobs fallback via `lib/loadCsv.ts` + a new `gid` entry in `lib/csvUrls.ts` so the field document survives a cold start / Sheets rate-limit. This fallback freshness matters more here than usual because the data must precache for offline.
- Map `*Row → ProgramItinerary` in a small pure module (keep transform logic out of the loader), the way `lib/journeyCard.ts` maps `JourneyCardRow → JourneyCard`.

---

## 6. Components to port (mockup → real, reading live data)

All under `app/journey-card-mockup/v17/traveling-artist/`. Port into real components in the production tree; swap the `sampleProgram` imports for the live loader’s data and types. Keep the markup/styling faithful.

- `parts.tsx` → shared Field Kit primitives: `PhoneFrame` (review-chrome only — **drop it in production**; the content is already responsive and renders full-width on a real device), `CompanionTabBar` (the real persistent bottom nav — Home · Journey · Capture · Crew · Stories; Capture/Crew/Stories are stub destinations this slice), `Pill`, `ClubChip`, `Stamp`, `SectionIntro`, `StatusChip`.
- `TravelingArtistChrome.tsx` → the top chrome / offline+auth status strip. Decide whether the production Field Kit keeps a top chrome at all on mobile (the mockup uses it for review framing). Confirm in §12.
- `shell/Shell.tsx` → **Today / Home**. Note: the mockup wraps the screen in `PhoneFrame` + a desktop annotation `<aside>`; production renders only the phone’s inner content as the actual page. Wire timeline, modules (stubs), resources list, and “with you today” to live data.
- `itinerary/ItineraryCompanion.tsx` → **Itinerary**. Port the spine, `ChapterBlock`, `DayLeaf`, `GoalBlock`, `TipsBlock`, `TimeAnchorList`, `dayState()` (today/past/future) — reading live chapters/days. The “Capture today” / “Today’s resources” day actions become stubs this slice.

---

## 7. Routes & PWA

- **Base route:** recommend `/field-kit` (Today/home) and `/field-kit/itinerary`. Confirm the base path in §12 (`/field-kit` vs `/companion` vs `/passage`).
- **PWA manifest:** add a web app manifest (name “PASSAGE Field Kit”, standalone display, theme/background from the dark token system, icons from `public/icons/`). Wire it in `app/layout.tsx` metadata.
- **Service worker / offline:** precache the app shell + the resolved itinerary + the cohort roster + the safety card; runtime-cache images. Use IndexedDB only later (no write queues in this slice). The mockup’s “Offline-first model” table in `TravelingArtistOverview.tsx` is the target behavior — implement only the **read/precache** rows for this slice (itinerary, roster, safety, shell); the queue/sync rows belong to later slices.
- **Library choice is an open decision (§12):** `@ducanh2912/next-pwa` / Serwist / hand-rolled Workbox, given Next.js 16 App Router. Pick one with Jesse; don’t guess.
- **Install affordance:** an “Add to your phone home screen” prompt/instructions surface (the two-surfaces section calls this out).

---

## 8. Auth / visibility

- The Field Kit is **in-program** (artists enrolled in the active program) **+ staff**. It is not public and not all-alumni.
- **Open question (§12, 95% gate):** how does a session map to “in-program for PASSAGE Slovakia 2026”? Today auth is email-keyed (`auth.ts`, NextAuth — Google OAuth + email/password credentials). Confirm the session→artist→program-roster mapping before writing the gate. Until confirmed, do not invent a roster source.
- Mirror the existing auth-guard patterns already in the repo (e.g. how `app/alumni/update/` and `app/api/alumni/journey/` gate their routes) rather than inventing a new one.

---

## 9. Build sequence

1. **Resolve §12 open questions with Jesse.** No code until 95% confidence.
2. **Data layer:** create the program/itinerary tab(s) (confirmed columns) → `lib/loadProgram.ts` (types + loader + selectors) → `Row → ProgramItinerary` mapping → `csvUrls.ts` fallback gid. Verify it loads the real PASSAGE: Slovakia 2026 data.
3. **Route shell + nav:** the `/field-kit` base, `CompanionTabBar`, in-program auth gate, top-chrome decision.
4. **Itinerary** (`/field-kit/itinerary`): port `ItineraryCompanion` against live data first — it’s the richest read-only surface and proves the data model.
5. **Today/Home** (`/field-kit`): port `Shell` against live data; ops modules + capture spark as stubs.
6. **PWA:** manifest + service worker + precache (shell/itinerary/roster/safety) + offline indicators + install affordance.
7. **Verification** (see §10).

---

## 10. Verification (required final step)

- `npm run check` (typecheck + lint) clean.
- Manual pass on a phone viewport: Today renders today’s timeline from live data; Itinerary spine highlights the correct “today,” dims past, shows GOAL/TIPS/spirit/time-anchors; drama-club and partner-org chips resolve via the existing maps.
- **Offline test:** load once online, then go offline (DevTools → Offline) and confirm the app shell, itinerary, roster, and safety card still render; offline indicators show the “Saved on this device” language; no scary errors.
- Retina/legibility spot-check of cream-on-dark type over the kraft wash; confirm small text never sits directly on raw texture (per the `WASH` note).
- Confirm the mockup under `app/journey-card-mockup/` is untouched.
- Consider a subagent verification pass for the offline/service-worker behavior and the auth gate, since those are the highest-risk pieces.

---

## 11. Guardrails (repeat)

- `dat-app-guardrails` skill loaded and followed; surgical edits only.
- CLAUDE.md: **no changes until 95% confidence — ask follow-ups first.**
- `npm run check` before committing; Netlify build: `DATABASE_URL=file:./dev.db npm run prisma:generate && npm run build`.
- Do not edit anything under `app/journey-card-mockup/`. Do not touch the in-progress Journey Card work (`lib/journeyCard.ts`, `lib/loadJourneyCards.ts`, `app/journeys/`, `app/api/alumni/journey/`, `app/alumni/update/studio/`).
- Build **only Slice 1**. Everything in §2 “OUT of scope” stays a stub.

---

## 12. Open questions to resolve early (95%-confidence gate)

1. **Sheet schema:** exact tab layout and columns for the program/itinerary store (§4) — one tab vs. `Program` + `Chapters` + `Days` (+ `Time Anchors`), and how `times[]`/`prep[]`/`dayIds` are serialized. Confirm and create the tab(s) before coding the loader.
2. **In-program auth:** the session → artist → program-roster mapping for the in-program gate (§8). What is the source of truth for “who is on PASSAGE Slovakia 2026”?
3. **Base route name:** `/field-kit` (recommended) vs `/companion` vs `/passage` vs nested under an existing route.
4. **PWA library:** `next-pwa` (`@ducanh2912/next-pwa`) vs Serwist vs hand-rolled Workbox SW, on Next.js 16 App Router.
5. **Top chrome on mobile:** does the production Field Kit keep a `TravelingArtistChrome`-style top strip, or is the bottom tab bar + masthead enough?
6. **Stub treatment:** for the four ops modules + capture spark on Today — disabled-with-tooltip, or link to a shared “Coming soon” screen?
7. **Today pointer:** does “today” come from the real calendar date vs. the program clock (`PROGRAM.todayDayId`)? For a live July–Aug 2026 trip it should be date-derived; confirm the before-trip / after-trip fallbacks.
8. **Safety card source:** the offline-precached “safety card” referenced in the offline model — where does its content live for this slice (a resource row, a fixed page, or deferred)?
