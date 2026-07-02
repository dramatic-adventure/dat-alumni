# Field Kit — Production Build Spec · Slice 6 (Composer, Publish & Retroactive — the private→public handoff)

**Status:** Ready to build once §12 open questions are resolved — and once Slice 5 has shipped. Hand this whole file to a fresh Claude (Fable) task as the anchoring context.
**Prepared:** 2026-07-02 · this is the slice Jesse referred to as "1.5": the seam between "finish the Field Kit" (Slice 5) and the deeper Journey Card work that comes after this.
**Approved visual reference:** `app/journey-card-mockup/v17/traveling-artist/composer/ComposerStudio.tsx` (812 lines, "strongest / spec-grade" per the 2026-06-28 audit), `publish/PublishReview.tsx` (803 lines), `retroactive/RetroactiveJourneyCard.tsx` (573 lines, already the most interactive mockup surface — real spine CRUD).
**Depends on:** Slice 5 shipped first. Also depends on the already-built Journey Card V1 (`lib/journeyCard.ts`, `lib/loadJourneyCards.ts`, `app/api/alumni/journey/`) — this slice extends that boundary rather than replacing it.
**Build this slice only.** Deeper Journey Card work (templates, sharing, the public-facing polish) is its own phase after this and is out of scope here.

---

## 0. First, before any code

1. Read `field-kit-STATUS-AUDIT-2026-07-02.md` §3 and §6 and `field-kit-AUDIT.md` §4–§5 in full — the data-model conflicts this slice must resolve are documented there in detail; do not re-derive them from scratch.
2. **Honor CLAUDE.md: make no changes until you have 95% confidence.** §12 below lists open questions that are genuinely load-bearing — they've been flagged in two separate audits (2026-06-28 and 2026-07-02) and still aren't resolved. Get Jesse's answers before writing code; this slice has more real design-decision risk than Slice 5.
3. Read the three mockup files named above end to end.
4. Read `lib/journeyCard.ts`, `lib/loadJourneyCards.ts`, and `app/api/alumni/journey/` in full — these are the existing Journey Card V1 write path this slice must extend, not fork.
5. `npm run check` must pass before you commit.
6. **This is the one slice allowed to touch the Journey Card boundary files** (`lib/journeyCard.ts`, `lib/loadJourneyCards.ts`, `app/api/alumni/journey/`) — every prior Field Kit spec told builders not to. Still do not touch `app/journeys/` (the public rendering side) or `app/alumni/update/studio/` (the V1 manual authoring UI) beyond what's strictly needed to accept a new write shape; those are the next phase's territory.

---

## 1. What this slice is (context)

The Field Kit captures things (Quick Capture, since Slice 1–2) but has no path from a capture to a published Journey Card. That gap is the single item blocking the "two products" promise of the original vision (`field-kit-BUILD-SPEC.md` §1: The Companion writes privately, The Journey Card publishes — "nothing is public until the artist stamps it"). This slice builds that path.

It also resolves the data-model split flagged twice now: Quick Capture/Traces use a loose `CaptureKind`/`Trace` shape (string `meta`, no `dayId`/`chapterId` FK, no media-blob ref, no sync status); the mockup's Composer uses a richer, better-linked `Invitation`/`Entry` shape (structured `chapterId` **and** `dayId`, photos/audio, reflection, status). These need to become one model before Composer can read what Capture writes.

---

## 2. Scope

### In scope
- **Data model unification**: one `Trace`/`Entry` shape carrying `chapterId`/`dayId`, real timestamps, a media-blob reference, and a `syncStatus` — resolve per §12 Q2, then migrate/adapt the existing Capture write path (`captureQueue.ts`, `app/api/field-kit/capture/route.ts`) onto it without breaking what Slices 1–2 already shipped.
- **Composer**: port `composer/ComposerStudio.tsx` — the artist shapes their own Traces into a structured multi-chapter draft (real text inputs, autosave, upload states — not the mockup's static fixtures).
- **Review & Publish**: port `publish/PublishReview.tsx` — the ceremonial "make it public" screen. Writes through the existing self-publish path in `app/api/alumni/journey/`, extended (not forked) to accept whatever shape §12 Q1 resolves to.
- **Retroactive**: port `retroactive/RetroactiveJourneyCard.tsx` — lets alumni from past, pre-Field-Kit programs build a card without live itinerary data. Reuses the Publish write path built above; needs its own auth gate (§12 Q4) since "in-program" doesn't apply to a finished trip.

### Explicitly OUT of scope
- Anything in the Journey Card's own next-phase work (templates, sharing/embeds, public-page polish) — that's the phase after this one.
- Field Ops real-time/push work beyond what Slices 3 and 5 already built.
- Itinerary ingestion/OCR, offline maps.

---

## 3. Locked decisions

- **Reuse `app/api/alumni/journey/` as the write path.** Extend it to accept the new shape; do not build a second publish endpoint.
- **`lib/journeyCard.ts`'s `JourneyCardRow` is the landing format**, even if that means Composer/Publish must flatten a multi-chapter draft before writing — unless §12 Q1 concludes the row itself should grow a chapter structure. Either way, the decision must be explicit and written down before code, not implied by whatever's easiest.
- **The public Journey Card side (`app/journeys/`, `journey-card-BUILD-SPEC.md`) is not to be regressed or duplicated** — this slice feeds it, it doesn't rebuild it.

---

## 4. Open questions to resolve early (95%-confidence gate — resolve ALL before writing Composer or Publish code)

1. **Multi-chapter → flat-card serialization.** The Companion's content is multi-chapter (each chapter has its own response/photos/prompt); `JourneyCardRow` is one flat row (single `title`/`pullQuote`/`body`/`heroUrl`, comma-joined `mediaUrls`). Define the flatten step (pick one hero image, one pull-quote, merge body text) **or** extend `JourneyCardRow` and the public renderer to carry a chapter array. This determines whether the mockup's "blank chapters become placeholder shapes in the published card" feature has anywhere to live at all. This is the single most load-bearing decision in this slice — it has been flagged in both the 2026-06-28 and 2026-07-02 audits and is still open.
2. **Trace/Entry unification.** Confirm: one `Trace` entity with `chapterId`/`dayId`, real timestamps, a media-blob reference, and `syncStatus`, composing into an `Entry` draft for Composer. Confirm this before touching the existing Capture write path, since it's a migration, not a greenfield build.
3. **Visibility model.** The Traces 4-level ladder (`private | crew | review | public`) vs. Composer's `Invitation` binary (`card | sealed`) currently conflict. Pick one.
4. **Retroactive's auth gate.** A past-program alum can't be "in-program" — the trip is over. Is the gate "authenticated alumni-profile owner," something else? This needs to be its own check, distinct from `fieldKitAccess.ts`'s in-program logic.
5. **Publish failure/rollback story.** The write touches three systems in sequence: the Journey Cards Sheet tab, the Netlify Blobs index cache, and a reference on the alumni record. What happens on partial failure (e.g., Sheet write succeeds, cache bust fails)? Needs an explicit retry/rollback design — the mockup only shows the happy path.
6. **`programId` for retroactive cards.** Retroactive trips predate the itinerary store (Slice 1/D1), so there's legitimately no `ProgramRecord` to bind to. Confirm the row-snapshot fallback already anticipated in `lib/journeyCard.ts` is the intended behavior for these cards (i.e., the "live program facts" guarantee doesn't apply to the back-catalog, by design).
7. **Composer autosave granularity.** Save on every keystroke (debounced), per-field blur, or an explicit "save draft" action? Affects both the offline-queue design and the UI.

---

## 5. Data model (depends on §4 answers — do not create until confirmed)

- Unified **`Trace`/`Entry`** store per Q2, replacing/extending the current Capture shape.
- **`MediaQueue`** entries joined to `Entry` (photos/audio pending upload/drain) — extends the existing offline-queue pattern from `captureQueue.ts`/`fieldKitDb.ts` rather than inventing a new one.
- Publish write shape per Q1 — either a flatten function producing today's `JourneyCardRow`, or a `JourneyCardRow` extension carrying `chapters[]`.

---

## 6. Build sequence

1. Resolve all of §4 with Jesse. This slice does not start on partial confidence given how load-bearing Q1/Q2 are.
2. Unify the Trace/Entry model; migrate the existing Capture write path onto it without breaking Slices 1–2's shipped behavior.
3. Composer, reading real Traces, with real autosave (granularity per Q7).
4. Review & Publish, writing through the extended `app/api/alumni/journey/` path, with explicit failure/rollback handling per Q5.
5. Retroactive, reusing the Publish write path, with its own auth gate per Q4.
6. Verification (§7).

---

## 7. Verification (required final step)

- `npm run check` clean.
- End-to-end manual test: capture something with Quick Capture → shape it in Composer → publish → confirm it renders as a real Journey Card on the public side (`app/journeys/` or wherever V1 renders) with correct `programId` merge.
- Confirm the existing Journey Card V1 self-publish flow (manual authoring, not via Field Kit) still works unmodified.
- Confirm Slices 1–5 still work end to end (this slice touches the Capture write path — regression risk is real here).
- Retroactive test: publish a card with no `programId`, confirm it falls back to the row snapshot correctly.
- Confirm `app/journey-card-mockup/` is untouched.
- Given the write-path and data-migration risk, use a subagent verification pass specifically on the Capture → Trace migration and the Publish failure/rollback path before considering this slice done.

---

## 8. Guardrails

- CLAUDE.md: **no changes until 95% confidence — ask follow-ups first.** This slice has more open, unresolved design decisions than any prior one; do not fill gaps with assumptions.
- `npm run check` before committing.
- This slice may touch `lib/journeyCard.ts`, `lib/loadJourneyCards.ts`, `app/api/alumni/journey/` — but still not `app/journeys/` or `app/alumni/update/studio/` beyond what's required to accept the new write shape, and not `app/journey-card-mockup/` at all.
- Treat this as the last Field Kit-side slice before the Journey Card becomes the primary focus — hand off cleanly (a short note on what changed in the shared write path) for whoever picks up the next phase.
