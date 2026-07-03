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

## 4-R. RESOLVED — §4 answers (locked with Jesse, 2026-07-02)

All seven questions were resolved with Jesse before any Slice 6 code was written, per the
95%-confidence gate. Three code findings surfaced during resolution corrected the audits'
framing and are recorded here because the decisions depend on them:

- **(F1)** Production captures are already most of the "rich Entry" shape: `QueuedCapture`/
  `FieldCapture` carry `programId`, real ISO timestamps, a Drive media ref, and queue-side
  sync status — and `dayIndex` already stores the itinerary **day id** (`CaptureForm.tsx`
  sends `currentDayId`), from which `chapterId` is derivable via the spine. The audits were
  describing the mockup's loose Trace *fixture*, not shipped code.
- **(F2)** The publish write is ONE system in shipped code, not three: a single Sheets append.
  `loadJourneyCards.ts` reads live (no Blobs index cache exists), and profiles/index load
  cards by slug at request time (no alumni-record reference exists). Read-side de-dupe is
  last-row-wins by id, so a retried append with the same id is naturally idempotent.
- **(F3)** `programMap.ts` already holds identity (program/location/country/year/artists)
  for all 28 back-catalog programs; the itinerary store has records only for the live program.

**Q1 — Serialization: flatten + `chaptersJson` column.** Publish writes today's flat fields
via a defined flatten step — the artist picks one response line as `pullQuote` and one hero
photo in the Publish flow; `body` = chapters merged with heading lines — so the current
public renderer works unchanged. Additionally, ONE new column `chaptersJson` (appended,
A:V → A:W) carries the full chapter array as JSON. Ghost-placeholder rendering on the public
card defers to the next phase, but no structure is lost and the next phase can light it up
without anyone re-publishing. Old rows (blank column) stay valid.

**Q2 — Trace/Entry unification: additive extension, no migration.** Field-Captures remains
THE Trace store. Add `chapterId` and `visibility` as new header-keyed sheet columns (old
rows read fine; Slices 1–2 behavior unchanged). The Entry draft is a NEW store — a
`JourneyDraft` document (IndexedDB + server sync) that composes traces by referencing
`captureId`s — not a rewrite of the capture path.

**Q3 — Visibility: binary `card | sealed`** (the Composer/Invitation model). `sealed` never
leaves the private journal — never reviewed, never published, never attachable to a card;
`card` is available to Composer and becomes public only on stamp. Matches the shipped
"captures are PRIVATE to their author" trust model. Existing captures (blank cell) default
to `card`. The 4-level ladder is dropped; a crew tier can grow later if crew-sharing ships.

**Q4 — Retroactive gate: profile owner AND on that program's roster.** The alum must be
signed in, own an alumni profile (`lib/ownership`), **and** appear in the `artists` of the
`programMap` entry (cluster-aware) they're building a card for. The program picker only
offers programs where their slug is on the roster. This is its own check, distinct from
`fieldKitAccess.ts`'s in-program logic; the write-side gate remains `assertCanEditProfile`.

**Q5 — Publish failure story: single idempotent append.** (Per F2.) The card id is minted
client-side BEFORE publishing so retries are idempotent (last-row-wins de-dupe). Media must
fully drain before the stamp activates. On failure: the draft stays on device with an
explicit "publish didn't go through — retry" state. No rollback machinery — no partial
state can exist. (Media promotion runs as an idempotent step before the append; a promoted-
but-unpublished file is unreferenced and harmless, and the retry re-uses it.)

**Q6 — Retroactive `programId`: store the programMap slug.** At publish, program facts
(program/location/country/year) are copied from the `programMap` entry into the row's
snapshot columns (accurate, zero data entry), and the programMap slug is stored in
`programId`. Today the itinerary-store lookup finds nothing so the snapshot renders (the
fallback `lib/journeyCard.ts:24` anticipates); if an itinerary record for that program is
ever created later, live-merge activates automatically for already-published cards.
`sortDate` is backdated to the trip year so back-catalog cards sort historically. The
"live program facts" guarantee explicitly does not apply to the back-catalog, by design.

**Q7 — Autosave: debounced local + background server sync.** Every change autosaves to
IndexedDB on a ~1s debounce (offline-first — "Saved on this device" is always literally
true). A queued, last-write-wins background push syncs the draft to a private server draft
store on field blur / periodically while online, reusing the captureQueue drain pattern —
so a lost phone doesn't lose the draft and phone-capture → desktop-compose works. The save
bar always shows explicit state, giving save-button reassurance without the burden.

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

---

## 9. HANDOFF — what Slice 6 changed in the shared write path (built 2026-07-02)

For whoever picks up the Journey Card phase next:

**The "Journey Cards" tab grew one column: `chaptersJson` (column W, A:V → A:W).**
- `lib/journeyCard.ts` now owns the chapter-block model (`JourneyCardChapter`),
  `parseChaptersJson`/`serializeChaptersJson` (bounded: 40k chars, 40 blocks, coerced
  fields), and the Q1 flatten helpers (`flattenChaptersToBody`/`flattenChaptersToMediaUrls`).
  `JourneyCard.chapters` is always populated ([] for flat/legacy cards).
- `POST /api/alumni/journey` accepts `chapters` (array) or `chaptersJson` (string),
  sanitizes by parse→re-serialize, and — important — an edit that sends NEITHER
  (the V1 studio's flat payload) PRESERVES the existing card's chapters. Verified.
- **The public renderer does not read `chapters` yet.** Ghost-placeholder chapter
  pages on the public card are the next phase's first job — the data is already
  in every Field-Kit-published row, so no re-publishing will be needed.
- `loadJourneyCards.ts` gained `dateCellToIso`: the append path writes with
  USER_ENTERED, so date-like cells (sortDate/createdAt) come back from
  UNFORMATTED_VALUE reads as day-serial numbers; the loader now normalizes
  plausible serials (20000–80000) back to ISO. Pre-existing latent bug, surfaced
  by retroactive backdating.

**The Field-Captures tab grew two columns: `chapterId` (M) + `visibility` (N, "card"|"sealed").**
Everything is header-keyed and additive; old rows/clients keep working. Sealed
captures are excluded from the Composer, publish-media, and the publish flow.
Run `npm run setup:field-kit-slice6-columns` to add the columns to a sheet that
doesn't have them (already run on the live sheet 2026-07-02).

**New stores/routes (not part of the card write path but adjacent):**
- `JourneyDraft` (lib/journeyDraft.ts) — IndexedDB `journeyDrafts` store (DB v4)
  + private Blobs backup via `/api/field-kit/draft` (store `dat-journey-drafts`;
  falls back to per-process memory in local dev without Netlify creds).
- `/api/field-kit/publish-media` — copies chosen private capture files into a
  `published/` Drive subfolder (idempotent by `<captureId>.<ext>`) and returns
  public `/api/media/thumb/<id>` URLs. The private originals' file ids are never
  exposed.
- `/api/alumni/journey-card/upload` + `/alumni/journey-card/create` — the
  Retroactive builder (gate: `lib/retroJourneyAccess.ts` — profile owner AND on
  the programMap roster; programId = programMap slug per §4-R Q6).
- Audio traces can be attached to a draft but are NOT yet promoted/published
  (the public renderer has no audio affordance) — next phase if wanted.

**Write-path size limits (added after the adversarial verification pass, 2026-07-03):**
- `POST /api/alumni/journey` now 400s (with a human, field-naming message the
  publish UIs surface verbatim) instead of failing opaquely or losing data when:
  any flat cell exceeds `MAX_SHEET_CELL_CHARS` (45k — Sheets rejects >50k and the
  append would fail identically on every retry); the `chapters` array exceeds
  `MAX_CHAPTER_BLOCKS` (40) or serializes over `MAX_CHAPTERS_JSON_CHARS` (40k).
  Before this, an oversized `chapters` array sanitized to `""` and published
  `ok:true` with the structured chapters silently erased.
- `/api/field-kit/publish-media`'s idempotency listing paginates
  (`nextPageToken`) so retries stay stable past 200 files in `published/`.
- RetroactiveClient persists the minted `publishedCardId` to IndexedDB
  *before* the publish POST (bypassing the autosave debounce), matching
  PublishClient — otherwise a failed stamp + reload could mint a second id.

**Known limitation (accepted, documented for the next phase):**
`/api/media/thumb/[fileId]` serves any service-account-readable Drive file with
no folder allowlist. An author who hand-crafts a journey POST with their own
sealed capture's `driveFileId` (visible to them in their Traces list) can
publish that sealed file's bytes, bypassing publish-media's sealed check. This
is self-leak only — nobody can learn another user's fileIds — but it means the
sealed boundary is enforced at the promotion path, not at the media proxy. If
the next phase wants a hard guarantee, add a folder allowlist (or a
`published/`-ancestor check) to the thumb proxy.
