# Field Kit — Status Audit vs. Vision (2026-07-02, updated 2026-07-03)

**Mode:** read-only audit, no code changed. `npm run typecheck` and `npm run lint` both pass clean on current `main` as of this writing.
**Supersedes:** `field-kit-AUDIT.md` (2026-06-28), which assessed the V17 mockup at "~75% design / ~2% build."
**2026-07-03 update:** the section below ("What's left") was written the morning of 07-02 and was stale within hours. Slice 5 (`c3c482c`, 07-02 17:10) and Slice 6 (`6e523a8`, 07-03 01:02, plus two follow-up fixes through 02:00) shipped everything this doc originally listed as "never started." All 14 surfaces from the original vision now have production routes and components. This revision re-baselines against the working tree as of `2ca373f`.

---

## Bottom line

All 14 surfaces from the original Field Kit vision are now built: Today/Home, Itinerary, Quick Capture, Traces, The Company, Rally Point, Roll Call, Company Choice, Field Library, Composer, Review & Publish, and Retroactive, plus the offline PWA shell and the notification backbone underneath all of it. The mockup's design contract (`app/journey-card-mockup/v17/traveling-artist/`, still intact and untouched) has been ported with real fidelity throughout — same tokens, same type system, same kraft-wash values, diffed directly against the mockup source.

What's left is genuinely polish and verification, not missing features:

1. **Polish gaps on what's built:** accessibility coverage improved since 06-28 (23/29 field-kit component files now use `aria-*`, up from 18/27; 5 files use `alt=`, up from 3) but is still thin for a product meant to work one-handed in bright sun. *(Correction 2026-07-03: the previously listed empty-state gap was already closed — `TracesEmpty` shipped in Capture Slice A (`242f049`) and `CrewEmpty` in Slice 5 (`c3c482c`); this doc's grep predated Slice 5 landing.)*
2. **One still-open decision from Slice 6's own spec:** `field-kit-BUILD-SPEC-slice6.md` §4 Q1 (multi-chapter Companion draft → flat `JourneyCardRow`) was flagged as the single most load-bearing open question before Composer/Publish shipped. `mergeProgramIntoCard()` is still defined but never invoked anywhere in routes or components — confirmed by direct grep — so it's either a deliberate "ship on snapshots" call or an unresolved carry-over. Worth an explicit one-line confirmation rather than assuming.
3. **No manual end-to-end QA pass yet** on the full Capture → Composer → Publish → `/journeys` path with a real trip's data.

---

## 1. What's actually built (verified in the working tree)

| Surface | Route / component | Status |
|---|---|---|
| Today / Home | `app/field-kit/page.tsx` → `TodayCompanion.tsx` | Live. Real before/during/after-trip states, countdown, time anchors, Rally Point banner, Roll Call + Company Choice mission-board modules. |
| Itinerary | `app/field-kit/itinerary/page.tsx` → `ItineraryCompanion.tsx` | Live. Chapter spine, GOAL/TIPS, spirit lines, offline snapshot + print/copy/share. |
| Quick Capture | `app/field-kit/capture/page.tsx` → `CaptureForm.tsx` | Live. Text, photo (Drive-backed), voice, IndexedDB offline queue with backoff. |
| My Traces | `app/field-kit/traces/page.tsx` → `TracesList.tsx` | Live, read-only view of an artist's own captures. |
| The Company (Crew) | `app/field-kit/cohort/page.tsx` → `CrewCompany.tsx` | Live roster, `MiniProfileCard`s, admin impersonation. |
| Roll Call | `app/api/field-kit/roll-call/*`, `RollCallCard.tsx`, `lib/rollCall.ts` | Live (Slice 5). |
| Company Choice | `app/api/field-kit/company-choice/*`, `CompanyChoiceCard.tsx`, `lib/companyChoice.ts` | Live (Slice 5). |
| Field Library | `app/field-kit/library/page.tsx` → `FieldLibrary.tsx` (292 lines) | Live (Slice 5). |
| Composer | `app/field-kit/composer/page.tsx` | Live (Slice 6). Artist shapes Traces into a structured multi-chapter draft. |
| Review & Publish | `app/field-kit/publish/page.tsx` | Live (Slice 6). Writes through the existing `app/api/alumni/journey/` self-publish path per the slice's locked decision (extended, not forked). |
| Retroactive | `app/alumni/journey-card/create/page.tsx` → `RetroactiveClient.tsx` (826 lines) | Live (Slice 6). Own auth gate distinct from `fieldKitAccess.ts`'s in-program check; scoped to past field programs (`21a3268`). |
| PWA / offline | `app/manifest.ts`, `public/sw.js`, `ServiceWorkerRegistrar.tsx` | Real hand-rolled service worker, installable, network-first nav caching with offline fallback. |
| Notifications | `lib/webPush.ts`, `lib/pushSubscriptions.ts`, `lib/rallyPoint.ts`, `AdminConsole.tsx`, `netlify/functions/send-notifications.ts` | Real web-push backbone, secrets in Netlify Blobs per CLAUDE.md's documented Lambda-4KB workaround. |
| Admin surface | `AdminConsole.tsx` (410 lines) + `AdminOps.tsx` (497 lines) | Combined ~900 lines, up from the single 458-line file this doc previously compared against the mockup's 1,358-line `AdminFieldOps.tsx`. Now administers Roll Call, Company Choice, and Field Update pushes. |
| Auth / gating | `lib/fieldKitAccess.ts` | Single gating module, in-program check, admin impersonation, verified by `npm run verify:field-kit`. |
| Design system fidelity | `components/field-kit/tokens.ts` | Ported verbatim from `sampleProgram.ts`. |

---

## 2. What's aesthetically real vs. what's still a mockup-only idea

The V17 "dark theatrical" look carries through correctly in every shipped surface — no aesthetic drift found.

One polish item still open (carried forward from the 07-02 pass):

- ~~**No empty states** on `CrewCompany.tsx` (zero-member roster) or `TracesList.tsx` (no captures yet)~~ **Corrected 2026-07-03: both exist.** `TracesEmpty` ("Nothing caught yet.") landed in Capture Slice A (`242f049`); `CrewEmpty` ("The company is assembling.") landed in Slice 5 (`c3c482c`), hours after this doc's original grep.
- **Accessibility is thin**, though improved since 06-28: 23 of 29 Field Kit component files now use some `aria-*` attribute (was 18/27), and 5 use `alt=` on images (was 3). Still worth a dedicated pass — focus states, alt text on headshots/media, aria labeling on icon-only buttons.

---

## 3. What isn't built at all

Nothing from the original 14-surface vision remains unbuilt. The only structural open item is the Slice 6 §4 Q1 decision on chapter-array vs. flattened-row serialization for Composer→Publish — `mergeProgramIntoCard()` exists but is never called, which may be the intended "ship on snapshots" outcome or an unresolved carry-over worth confirming explicitly.

Itinerary ingestion/OCR (PDF/paste → structured chapters) and offline maps/ETA for Rally Point remain explicitly out of scope per the original spec — low priority, unchanged.

---

## 4. Practical gaps for artists on the ground

Unchanged from 07-02:

- **Push notifications on iOS PWAs** are a known platform constraint. No documented fallback (WhatsApp/SMS copy-paste, which the mockup designed for this) confirmed in code for when a push silently fails to reach an iOS artist.
- **Capture upload failure UX** — retry/offline/error handling exists in `CaptureForm.tsx`, but the actual failure-path UI (stuck spinner vs. clear "will retry when reconnected" message) hasn't been manually verified end to end.

---

## 5. Practical gaps for you as admin

- **Partial-delivery / push-failure visibility** on Field Update pushes — worth confirming it's surfaced, not just logged.
- **The "no metrics" line** for Roll Call/Company Choice tallies — now that both are live, this is no longer a hypothetical future decision; it's live in production and worth confirming staff-only vs. artist-visible was decided deliberately during the Slice 5 build rather than defaulted.

---

## 6. Recommended order of work

1. **Confirm the Slice 6 §4 Q1 serialization decision was made deliberately** (chapter array vs. flattened row) — five-minute conversation, not a coding task, but worth closing the loop since two audits flagged it as load-bearing.
2. **Manual end-to-end QA pass**: Capture → Composer → Publish → appears on `/journeys` → Retroactive path with a real trip's data.
3. ~~**Empty states for Crew and Traces**~~ Already done — see the correction in §2.
4. **Accessibility pass** — alt text, aria labels on icon buttons, focus states.
5. **iOS push fallback + capture-failure UX** — manual verification, possibly a small build if gaps are found.
6. **Journey Card discoverability** (see `journey-card-AUDIT.md`) — `/journeys` still has zero entry points in `Header.tsx`, `Footer.tsx`, or the public alumni profile page; confirmed via grep on 07-03. This is the one item that makes the now-complete Field Kit → Journey Card pipeline invisible to a visitor.

---

*Files reviewed directly for this revision: full `app/field-kit` and `components/field-kit` trees, `app/alumni/journey-card/create/`, `components/journey-card/RetroactiveClient.tsx`, `field-kit-BUILD-SPEC-slice6.md`, `git log` for all field-kit commits through `2ca373f`, direct grep for `mergeProgramIntoCard(` call sites and `aria-`/`alt=` usage, `Header.tsx`/`Footer.tsx`/alumni profile page for `/journeys` links.*
