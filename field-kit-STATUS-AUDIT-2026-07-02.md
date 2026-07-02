# Field Kit — Status Audit vs. Vision (2026-07-02)

**Mode:** read-only audit, no code changed. `npm run typecheck` and `npm run lint` both pass clean on current `main` as of this writing.
**Supersedes:** `field-kit-AUDIT.md` (2026-06-28), which assessed the V17 mockup at "~75% design / ~2% build." That was true nine days ago. It is no longer true — Slices 1 through 4a have shipped (16 feature commits, `cea3928` → `ffac953`) and the build is now meaningfully ahead of what that audit describes. This doc re-baselines against the actual working tree.

---

## Bottom line

The mockup's design contract (`app/journey-card-mockup/v17/traveling-artist/`, still intact and untouched, as required) has been ported with real fidelity for the surfaces that were in scope. Today/Home, Itinerary, Quick Capture (text + photo + voice, with an offline write queue), The Company roster, offline PWA install, live-refresh, and a real web-push notification backbone with an admin console are all live, reading real data, typecheck-clean, and lint-clean. That's a lot more than "Slice 1."

What's left splits into two different kinds of gaps:

1. **Features never started:** Composer, Review & Publish (the private→public handoff), Roll Call, Company Choice, Field Library, Retroactive, and itinerary ingestion/OCR. These are the rest of the original 14-surface vision — roughly half of it, by surface count, though the built half is the highest-leverage half (it's the part artists touch daily in the field).
2. **Polish gaps on what's already built:** a few missing empty states, thin accessibility coverage, some stale code comments, and a couple of "no-metrics ethos" judgment calls that were flagged in the original audit and still haven't been explicitly decided.

Neither list is large. This is closer to a finishing pass than a fresh build.

---

## 1. What's actually built (verified in the working tree)

| Surface | Route / component | Status |
|---|---|---|
| Today / Home | `app/field-kit/page.tsx` → `TodayCompanion.tsx` | Live. Real before/during/after-trip states, countdown, time anchors, Rally Point banner. Ops modules (Roll Call, Company Choice) and "with you today" avatar stack are honestly omitted rather than faked — see code comment at top of `TodayCompanion.tsx`. |
| Itinerary | `app/field-kit/itinerary/page.tsx` → `ItineraryCompanion.tsx` | Live, ported faithfully from the mockup. Chapter spine, GOAL/TIPS, spirit lines, drama-club/partner-org chips, today-highlighting, offline snapshot + print/copy/share (`itinerarySnapshot.ts`). |
| Quick Capture | `app/field-kit/capture/page.tsx` → `CaptureForm.tsx` (557 lines) | Live and further than the original Slice 1 scope: text notes, photo (Drive-backed upload), voice recorder, and an IndexedDB offline queue with drainer (`captureQueue.ts`, `captureSync.ts`, `fieldKitDb.ts`) with exponential backoff. This is Phase 2 territory from the old audit, already done. |
| My Traces | `app/field-kit/traces/page.tsx` → `TracesList.tsx` | Live, read-only view of an artist's own captures. No per-trace visibility editor yet (still binary/implicit, not the 4-level ladder the mockup implies). |
| The Company (Crew) | `app/field-kit/cohort/page.tsx` → `CrewCompany.tsx` | Live roster, restyled as `MiniProfileCard`s, admin impersonation support. |
| PWA / offline | `app/manifest.ts`, `public/sw.js`, `ServiceWorkerRegistrar.tsx`, `field-kit-shell.html`, `field-kit-offline.html` | Real hand-rolled service worker (no Workbox dependency), installable, scoped to `/field-kit`, safe-area insets handled, network-first nav caching with offline fallback (Slice 4a, `field-kit-NAV-CACHE-DESIGN.md`). |
| Notifications | `lib/webPush.ts`, `lib/pushSubscriptions.ts`, `lib/rallyPoint.ts`, `AdminConsole.tsx`, `netlify/functions/send-notifications.ts` | Real web-push backbone (Slice 3), secrets stored in Netlify Blobs per CLAUDE.md's documented workaround for the Lambda 4KB limit. Admin can push Field Updates and manage Rally Point. |
| Auth / gating | `lib/fieldKitAccess.ts` | Single gating module, in-program check, admin impersonation, verified by `scripts/field-kit-roster.check.ts` (`npm run verify:field-kit`). |
| Design system fidelity | `components/field-kit/tokens.ts` | Ported **verbatim** from `sampleProgram.ts` — same hex values, same font variable names, same kraft-wash formula. I diffed this directly against the mockup source; it's not just "close," it's the same token object. |

This is a materially bigger build than the original Slice 1 spec asked for — Capture's offline queue, voice recording, live-refresh, and the entire notification system were all originally scoped as "later slices" and have since been pulled forward and shipped.

---

## 2. What's aesthetically real vs. what's still a mockup-only idea

The V17 "dark theatrical" look — near-black plum background, kraft-paper wash, Anton display type over Space Grotesk/DM Sans, the yellow/teal/pink/grape accent system — is carried through correctly in every shipped surface. The kraft texture asset, the app icons (`icon-192`, `icon-512`, maskable), and the wordmark all exist in `public/`. I don't see aesthetic drift from the approved design in what's built.

Two smaller polish items worth fixing rather than a redesign:

- **No empty states** on `CrewCompany.tsx` (zero-member roster) or `TracesList.tsx` (no captures yet). Both will render awkwardly, not brokenly, the first time an artist opens them before anyone has posted anything — worth a one-line "nothing here yet" treatment consistent with the "no shame" ethos copy elsewhere.
- **Accessibility is thin.** Across 27 Field Kit components, only 18 files use any `aria-*` attribute and only 3 use `alt` text on images. For a product meant to work for artists in low-connectivity, sometimes low-visibility field conditions (bright sun on a phone screen, one-handed use), this is worth a dedicated pass — focus states, alt text on headshots/media, and aria labeling on icon-only buttons (the tab bar, the account menu).

---

## 3. What isn't built at all (the honest remainder of the vision)

Pulled directly from `field-kit-BUILD-SPEC.md` §1 and the mockup's surface list — these have designed mockups under `app/journey-card-mockup/v17/traveling-artist/` but no production code:

- **Composer** (`composer/ComposerStudio.tsx` in the mockup) — turning raw captures into a structured multi-chapter draft. Nothing built.
- **Review & Publish** (`publish/PublishReview.tsx`) — the actual private→public handoff that turns a Companion record into a live Journey Card. This is the one gap that blocks the whole "two products" promise: right now Field Kit captures things but there's no path from a capture to a published Journey Card. Also structurally unresolved: `JourneyCardRow` is a flat single-chapter row; the Companion model is multi-chapter. That serialization question (flagged in the old audit §5) is still open.
- **Roll Call** and **Company Choice** — the other two mission-board modules alongside Rally Point. Rally Point shipped (read-only banner + admin push); these two haven't started.
- **Field Library / Resources** — a designed surface with no production code or data store.
- **Retroactive** (letting alumni from past, pre-Field-Kit trips build a journey card after the fact) — designed, most interactive of any mockup surface, not started. Probably the cheapest surface to build next since it reuses the eventual Publish write path and needs no live itinerary data.
- **Itinerary ingestion pipeline** (PDF/paste → structured chapters) — explicitly deferred even in the mockup itself; a human still has to type the itinerary into the Sheet. Fine for one program at a time; will become a bottleneck if DAT runs itineraries for multiple concurrent programs.
- **Offline maps / ETA for Rally Point** — the mockup's map is a decorative SVG; no real map data. Low priority per the mockup's own "human landmark beats GPS" framing.

---

## 4. Practical gaps for artists on the ground

The offline story is the strongest part of this build and it shows: real IndexedDB queue, real service worker, real "saved on this device" language, real background drain-and-retry. Two things I'd still tighten before artists rely on it in poor-connectivity conditions:

- **Push notifications on iOS PWAs are a known platform constraint** (Apple's web-push support for installed PWAs has real limitations around when the app is backgrounded/killed). The admin console can push Field Updates, but there's no fallback path documented in code for when a push silently fails to reach an iOS artist — worth confirming what happens today and whether a WhatsApp/SMS copy-paste fallback (which the original mockup explicitly designed for exactly this reason) is worth keeping in reserve.
- **Capture upload failure UX** — I found retry/offline/error handling in `CaptureForm.tsx` (8 occurrences), which is good, but I did not verify the actual failure-path UI (a stuck "uploading" spinner vs. a clear "will retry when reconnected" message) end to end. Worth a manual test: start a photo/voice capture, kill the network mid-upload, confirm the message an artist sees.

---

## 5. Practical gaps for you as admin

`AdminConsole.tsx` is 458 lines — solid, but noticeably thinner than the mockup's `AdminFieldOps.tsx` (1,358 lines, the richest surface in the entire mockup). The gap is mostly the unbuilt features (no Roll Call or Company Choice to administer yet), but two things worth deciding regardless:

- **Partial-delivery / push-failure visibility.** When you push a Field Update, do you currently see which artists received it vs. which didn't? The mockup treats this as important admin information; worth confirming it's surfaced, not just logged.
- **The "no metrics" line.** The original audit flagged that count badges (roll-call totals, vote tallies) sit right on the edge of the platform's stated "no shame, no metrics" ethos for artist-facing views, while being legitimately useful for you as admin. That's a real product decision, not a bug — worth explicitly deciding staff-only vs. artist-visible for any future Roll Call/Company Choice build, rather than defaulting one way by accident.

---

## 6. Recommended order of work

1. **Empty states for Crew and Traces** — small, fast, removes the only "looks unfinished" moment in what's shipped.
2. **Accessibility pass** — alt text, aria labels on icon buttons, focus states. Matters more here than on the marketing site given the field-use context.
3. **Decide the Composer→Publish serialization question** (multi-chapter Companion record → flat `JourneyCardRow`) — this is a data-model decision, not a coding task, and it blocks Publish, Composer, and Retroactive alike. Resolving it once unblocks three surfaces.
4. **Retroactive** — cheapest of the unbuilt surfaces once #3 is resolved; reuses the Publish write path and needs no live itinerary.
5. **Composer + Review & Publish** — the actual "private workspace becomes a public Journey Card" moment. This is the single feature that completes the "two products" vision.
6. **Roll Call / Company Choice** — only after 3–5, since they're the least differentiated from what Rally Point already proved out (a store-and-forward, not-really-live pattern), and the least urgent for artists day to day.
7. **Field Library / itinerary ingestion** — lowest priority; both are quality-of-life for you rather than blockers for artists.

---

*Files reviewed directly for this audit: `field-kit-BUILD-SPEC.md`, `field-kit-AUDIT.md`, `field-kit-NAV-CACHE-DESIGN.md`, `field-kit-NOTIFICATIONS-SCHEMA.md`, `components/field-kit/tokens.ts`, `TodayCompanion.tsx`, `ComingSoon.tsx`, `RallyPointBanner.tsx`, `CrewCompany.tsx`, `CaptureForm.tsx`, `TracesList.tsx`, `AdminConsole.tsx`, `app/field-kit/layout.tsx`, `app/manifest.ts`, full `app/field-kit` and `components/field-kit` trees, `app/journey-card-mockup/v17/traveling-artist/` (confirmed present and untouched), git log for all field-kit commits, `npm run typecheck` and `npm run lint` (both clean).*
