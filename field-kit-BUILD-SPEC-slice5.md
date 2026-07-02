# Field Kit — Production Build Spec · Slice 5 (Field Ops & Library)

**Status:** Ready to build once §12 open questions are resolved. Hand this whole file to a fresh Claude (Fable) task as the anchoring context.
**Prepared:** 2026-07-02 · companion to `field-kit-STATUS-AUDIT-2026-07-02.md` (read that first — it's the audit this spec is built from).
**Approved visual reference:** `app/journey-card-mockup/v17/traveling-artist/` — still present in the working tree, still untouched. This slice specifically ports `roll-call/RollCall.tsx`, the Company Choice tile in `shell/Shell.tsx` + the vote-bar section of `admin/AdminFieldOps.tsx`, and `resources/ResourcesLibrary.tsx`.
**Shipped already (do not re-build):** Slices 1–4a — Today/Home, Itinerary, Quick Capture (text/photo/voice + offline queue), The Company roster, PWA install + offline nav cache, and the Slice-3 web-push/notifications backbone (Rally Point included). See `field-kit-STATUS-AUDIT-2026-07-02.md` §1 for the full list with file paths.
**Two standing requirements for this slice, non-negotiable (Jesse, 2026-07-02):**
1. **Offline-first is not optional for any new surface.** Every read this slice adds (Roll Call status, Company Choice question/results, the Field Library list and — where feasible — the resource files themselves) must be usable with no signal, the same way the itinerary already is. "We'll do offline later" is not an acceptable answer for anything built in this slice.
2. **The Field Kit must be fast.** Every new screen loads instantly on a mid-range phone on a bad connection, and every interaction (check-in, vote, tab switch) responds immediately — optimistic UI, not spinner-then-wait. This slice must also not regress the performance of Slices 1–4a; performance is part of the verification gate (§9), not a nice-to-have.

**Build this slice only.** Slice 6 (Composer, Publish, Retroactive — the private→public handoff) is a separate spec and comes after this one. Do not start it here.

---

## 0. First, before any code

1. Read `field-kit-STATUS-AUDIT-2026-07-02.md` end to end — it's the map of what exists and what's missing.
2. **Honor CLAUDE.md: make no changes until you have 95% confidence.** §12 below is the open-questions list. Resolve them with Jesse first; several have a recommended default — confirm before relying on it.
3. Read the three mockup files named above end to end. They are the design contract for the surfaces this slice builds.
4. Read `lib/rallyPoint.ts` and `field-kit-NOTIFICATIONS-SCHEMA.md` in full — Rally Point is the exact pattern this slice's two new field-ops stores (Roll Call, Company Choice) should copy: a Sheet-tab-backed store with `readGrid`/`columns`/`get*`/`set*` helpers, `withRetry` + `idxOf`/`normId` from `lib/sheetsResilience.ts`, attached to the itinerary payload so it precaches offline and rides the existing `LiveRefresh` poll/focus-refetch mechanism. Do not invent a new persistence or refresh pattern.
5. Read `lib/fieldKitCache.ts`, `lib/itinerarySnapshot.ts`, and `public/sw.js`, and skim the perf commits `ffac953`, `9fbd9ed`, and `0babb61` (`git show --stat`) — these are the existing offline-precache and performance patterns (TTL caching, parallelized data fetches, cacheable image headers, Sheets cache-stampede avoidance) that this slice's new surfaces must follow, per the standing requirements above. Do not invent a second caching strategy.
6. `npm run check` (typecheck + lint) must pass before you commit — it is currently clean; keep it that way.
7. Do not edit anything under `app/journey-card-mockup/`. Do not touch `lib/journeyCard.ts`, `lib/loadJourneyCards.ts`, `app/journeys/`, `app/api/alumni/journey/`, or `app/alumni/update/studio/` — that boundary is reserved for Slice 6.

---

## 1. What this slice is (context)

The Field Kit's mission board (`shell/Shell.tsx` in the mockup, `TodayCompanion.tsx` in production) has four color-coded ops modules: Rally Point, Roll Call, Company Choice, Field Updates. Rally Point shipped in Slice 3. Roll Call and Company Choice never got past "honestly omitted" — `TodayCompanion.tsx`'s own header comment says so. Field Library (Resources) is a fully designed mockup surface with zero production code.

This slice closes out the **pure Field Kit** surfaces — the ones that don't require the private→public handoff. Composer, Review & Publish, and Retroactive are explicitly the next spec (Slice 6), not this one.

This slice also carries two small polish items flagged in the 2026-07-02 status audit: missing empty states on `CrewCompany.tsx` and `TracesList.tsx`, and a thin accessibility pass across Field Kit components (only 18 of 27 components use any `aria-*`, only 3 use `alt`).

---

## 2. Scope

### In scope
- **Roll Call**, real read + write: an artist one-tap check-in ("here" / "needs help"), admin can open/close a roll call for a given day and see live status. Offline-queued exactly like Quick Capture (§6).
- **Company Choice**, real read + write: admin posts a question + choices with a deadline; each artist votes once. The mockup has no dedicated full-screen surface for this — it's a mission-board tile (linking to `/cohort` in the mockup) plus the vote-bar section of `AdminFieldOps.tsx`. Confirm the artist-facing surface shape in §12.
- **Field Library**: the resources list from `resources/ResourcesLibrary.tsx`, scoped to the program (and "today's picks" computed from the real itinerary, not hardcoded — the old audit flagged the mockup's "Day 5 · Košice" hardcode as a bug to not repeat). The list itself precaches offline like every other new surface in this slice (it's small, always-available data); whether individual resource *files* are downloaded ahead of time or cached the first time they're opened is a sizing question, not an offline-vs-not question — see §12 Q3 and Q7.
- **Empty states** on `CrewCompany.tsx` (zero-member roster) and `TracesList.tsx` (no captures yet) — short, in the "no shame" tone already used elsewhere (see `ComingSoon.tsx` for the voice).
- **Accessibility pass**: alt text on headshots/media images, `aria-label` on icon-only controls (tab bar, account menu, close/dismiss buttons), verify visible focus states on interactive elements. Scope covers this slice's new components **and** a pass over what's already shipped (Today, Itinerary, Capture, Crew) — see §12 for how wide.
- Update the Today mission board (`TodayCompanion.tsx`) so the Roll Call and Company Choice tiles become real links instead of the current stub/omission.

### Explicitly OUT of scope (Slice 6 — do not build here)
- Composer, Review & Publish, Retroactive.
- Itinerary ingestion/OCR, offline maps/ETA, true real-time presence.

---

## 3. Locked decisions

- **Store-and-forward, not real-time.** Roll Call and Company Choice read via the same poll/focus-refetch pattern `LiveRefresh` already provides for the itinerary; writes go through the same offline-queue-then-sync approach as Capture (`captureQueue.ts` / `captureSync.ts` / `fieldKitDb.ts`) — do not build a second offline-write mechanism.
- **Data backend = new Sheet tabs** in `ALUMNI_SHEET_ID`, following `lib/rallyPoint.ts`'s pattern verbatim.
- **Auth = `guardFieldKitApi` / `guardFieldKitAdminApi`** (`lib/fieldKitAccess.ts`), exactly as the existing push and admin routes already do.
- **Design tokens = `components/field-kit/tokens.ts` verbatim.** No new colors. Reuse `CompanionTabBar`, `Pill`, `ClubChip`, `StatusChip` from `components/field-kit/parts.tsx`.
- **Notification piggyback**: opening a Roll Call or posting a Company Choice question can fire a push through the existing `lib/notifications.ts` / `Field Kit Notifications` tab (Slice 3) — do not build a second notification channel.

### Offline completeness (standing requirement, not new infrastructure)
- Every new read this slice adds (Roll Call open/closed status + this device's own response, the current Company Choice question + this device's own vote, the Field Library list) rides the same itinerary-payload precache Rally Point already uses (`lib/loadProgram.ts` → service worker precache). If a read can't be made to precache this way, that's a design problem to flag in review, not something to ship read-online-only silently.
- Every new write (check-in, vote) queues offline through the existing `fieldKitDb.ts`/`captureQueue.ts`/`captureSync.ts` mechanism and shows the existing "saved on this device — syncs when reconnected" language. No new error states, no data loss on a dropped connection.
- Field Library resource files: see §12 Q3/Q7 for the download-ahead-vs-cache-on-open decision — but the decision is *how* to make them available offline, not *whether*.

### Performance (standing requirement)
- **Server-side data fetching**: mirror the TTL-cache + parallelized-fetch pattern from `lib/fieldKitCache.ts` and the `ffac953`/`9fbd9ed`/`0babb61` commits for every new loader (`rollCall.ts`, `companyChoice.ts`, `resources.ts`). No new sequential-fetch waterfalls; no new unbounded Sheets reads on every request.
- **Client-side interactions are optimistic.** A check-in, a vote, or opening a tab must update the UI immediately, with the sync/queue status shown asynchronously alongside it — never a blocking spinner for an action that's going to succeed locally regardless of connectivity.
- **Images** (any new headshots/media in Roll Call, Company Choice, or the Library) follow the existing cacheable-headshot pattern (`0babb61`) — sized/thumbnailed, cache-friendly headers, lazy-loaded off the critical path.
- **No new heavy client dependencies** for this slice's UI — it's list/form/toggle-shaped work; if something feels like it needs a new library, that's a signal to simplify the design instead.

---

## 4. Data model — new Sheet tabs (draft; confirm exact columns with Jesse before creating, same as every prior slice)

- **`Field Kit Roll Call`**: `id, programId, dayId, label, openedAt, closedAt`.
- **`Field Kit Roll Call Responses`**: `rollCallId, alumniSlug, status (here | needs-help), respondedAt`.
- **`Field Kit Company Choice`**: `id, programId, question, choices (delimited), deadline, postedAt`.
- **`Field Kit Company Choice Votes`**: `choiceSetId, alumniSlug, selection, votedAt`.
- **`Field Kit Resources`**: `id, programId, dayId (optional), title, type, url, tags`.

---

## 5. Data layer

Create `lib/rollCall.ts`, `lib/companyChoice.ts`, `lib/resources.ts` — each mirrors `lib/rallyPoint.ts` exactly (`readGrid` / `columns` / `rowToX` / `getX` / `setX`, `withRetry`, `normId`, never-throws-on-read behavior). Attach current Roll Call / Company Choice state to the itinerary payload the way Rally Point already does (`lib/loadProgram.ts`), so both precache offline and ride the existing `LiveRefresh` change detection.

---

## 6. Components to port / build

- `roll-call/RollCall.tsx` (mockup, 175 lines) → `components/field-kit/RollCall.tsx` — real check-in UI, offline-queued write.
- Company Choice tile (`shell/Shell.tsx`) + vote-bar section (`admin/AdminFieldOps.tsx`) → a real artist-facing vote surface (shape TBD, §12) + an extension to `AdminConsole.tsx`.
- `resources/ResourcesLibrary.tsx` (mockup, 437 lines) → `components/field-kit/FieldLibrary.tsx` — read-only; the list itself precaches offline by default, individual resource files cached per §12 Q3/Q7.
- `CrewCompany.tsx`, `TracesList.tsx` — add empty-state blocks (small, original copy in the existing voice; no mockup to port from).
- `TodayCompanion.tsx` — wire the Roll Call / Company Choice mission-board tiles to the new real routes.

---

## 7. Routes & API

- `/field-kit/roll-call`, `/field-kit/company-choice` (route naming per §12 Q1), `/field-kit/library`.
- `app/api/field-kit/roll-call/route.ts` (+ a respond endpoint), `app/api/field-kit/company-choice/route.ts` (+ a vote endpoint).
- `app/api/field-kit/admin/roll-call/route.ts`, `app/api/field-kit/admin/company-choice/route.ts` — gated exactly like the existing `app/api/field-kit/admin/rally/route.ts`.

---

## 8. Build sequence

1. Resolve §12 with Jesse. No code before 95% confidence.
2. Data layer: three new Sheet tabs (confirmed columns) → `rollCall.ts` / `companyChoice.ts` / `resources.ts` → attach to `loadProgram.ts` payload.
3. Roll Call end to end (artist check-in + admin open/close/view).
4. Company Choice end to end (admin post + artist vote + result visibility per §12 Q2).
5. Field Library (read-only v1).
6. Empty states on Crew + Traces.
7. Accessibility pass (scope per §12 Q6).
8. Verification (§9).

---

## 9. Verification (required final step)

- `npm run check` clean.
- Manual phone-viewport pass on all new surfaces.
- **Offline completeness test** (do this for every new surface, not just Capture): load Roll Call, Company Choice, and the Field Library once online, then go fully offline (DevTools → Offline / airplane mode on a real device) and confirm: Roll Call status + this device's own response render; the current Company Choice question + this device's own vote render; the Field Library list renders; any previously-opened resource file still opens. Then perform a check-in and a vote while offline, confirm both queue with the existing "saved on this device" language and drain correctly on reconnect.
- **Performance check**: run a mobile Lighthouse pass (or equivalent) against `/field-kit`, `/field-kit/roll-call`, `/field-kit/company-choice`, and `/field-kit/library` — Performance and PWA scores should not regress versus the pre-Slice-5 baseline. Confirm no new sequential-fetch waterfalls in the network panel and no new render-blocking requests.
- Confirm Slices 1–4a still work end to end (itinerary, capture, crew, notifications, Rally Point) **and haven't gotten slower** — this slice must not regress functionality or performance.
- Accessibility spot check: alt text present on all images, aria-labels on icon-only controls, visible focus rings on interactive elements.
- Confirm `app/journey-card-mockup/` is untouched.
- Consider a subagent verification pass for the offline-queue behavior and the admin gating, since those are the highest-risk pieces (same rationale as Slice 1 §10).

---

## 10. Guardrails (repeat)

- CLAUDE.md: **no changes until 95% confidence — ask follow-ups first.**
- `npm run check` before committing.
- Do not edit `app/journey-card-mockup/`. Do not touch `lib/journeyCard.ts`, `lib/loadJourneyCards.ts`, `app/journeys/`, `app/api/alumni/journey/`, `app/alumni/update/studio/` — reserved for Slice 6.
- Build **only** what's in §2 "In scope." Composer/Publish/Retroactive stay untouched.

---

## 11. Open questions to resolve early (95%-confidence gate)

1. **Company Choice surface shape:** a dedicated `/field-kit/company-choice` screen, or folded into `/field-kit/cohort` (the mockup's own tile links to `/cohort`)?
2. **The no-metrics line:** do artists see live Roll Call headcount ("4/6 checked in") and Company Choice vote tallies, or are those staff-only in `AdminConsole`? (The 2026-06-28 audit flagged this as sitting right on the "no shame, no metrics" ethos line.)
3. **Field Library file-caching mechanism:** given offline availability is now a hard requirement (not optional), the choice is *how*, not *whether* — (a) cache-on-open (a resource is fetched into the Cache Storage API the first time an artist opens it, then available offline from then on), or (b) download-ahead (the whole library is proactively fetched onto the device once, e.g. on Wi-Fi/first install). Recommend (a) for v1 — it's a small addition to the existing service-worker runtime caching already in `public/sw.js`, versus (b) which is real new infrastructure (background fetch, a download-progress UI, retry logic) — and revisit (b) later if artists report needing resources they never got a chance to open while they had signal.
4. **Roll Call "needs help" flag:** does this trigger an immediate push to admin, or just surface on next `AdminConsole` load?
5. **Company Choice cadence:** one active question at a time (mirrors Rally Point's "one row per program, latest wins"), or a history of multiple questions with past results visible?
6. **Accessibility pass scope:** just this slice's new components, or a pass across everything shipped so far (Today, Itinerary, Capture, Crew)? Recommend the full pass — it's cheap relative to the rest of this slice and the audit flagged it repo-wide, not just for new surfaces.
7. **On-device storage budget for the Library.** Mobile Safari's Cache Storage/IndexedDB quotas are finite and can be evicted under pressure. Do we cap how much of the Library caches offline (e.g. images/PDFs only, video excluded; a total size ceiling), or is this not a real concern for the size of library DAT expects to publish per program? Recommend confirming expected file types/sizes with Jesse before building the cache-on-open logic, so it doesn't silently break on a large PDF or video resource.
