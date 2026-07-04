# Field Kit — Production Build Spec · Slice 7 (Auto-Composer — the card builds itself + end-of-trip nudge)

**Status:** Open questions in §4 must be resolved before any code — hand this whole file to a fresh Claude task as the anchoring context.
**Prepared:** 2026-07-03 · this is the slice after Slice 6 (Composer/Publish/Retroactive). It doesn't replace Composer, it removes the requirement that the artist ever open it.
**Depends on:** Slice 6 shipped (`lib/journeyDraft.ts`, `ComposerClient.tsx`, `lib/loadFieldKitCaptures.ts`, the `chapterId`/`visibility` columns on Field-Captures). Also depends on the web-push backbone (`lib/webPush.ts`, `netlify/functions/send-notifications.ts`) and the itinerary spine (program end date).
**Build this slice only.** Public-renderer ghost-chapter work is still the next phase after this.

---

## 0. First, before any code

1. Read `field-kit-BUILD-SPEC-slice6.md` in full, especially §4-R (the Trace/Entry/Draft decisions this slice builds on top of) and its Handoff (§9).
2. Read `lib/journeyDraft.ts`, `components/field-kit/composer/ComposerClient.tsx`, and `lib/loadFieldKitCaptures.ts` in full.
3. **Honor CLAUDE.md: no changes until 95% confidence.** §4 below is not fully resolved yet — two load-bearing decisions are locked (§3), the rest are still open and must be answered before writing code.
4. `npm run check` must pass before you commit.

---

## 1. What this slice is (context)

Today, Composer starts every chapter **empty** (`chapterFromSpine()` in `ComposerClient.tsx`) even though every capture already carries the two things needed to place it automatically: `chapterId` (which chapter it belongs to — the "where," already resolved from the itinerary spine at capture time, since Slice 6) and `createdAt` (the "when"). Nothing currently uses that. The artist must open Composer, manually attach each trace to a chapter, and manually write the response/body text before Publish has anything to show — and if they never open Composer, nothing exists at all.

This slice makes the card build itself:

- Every capture the artist makes is already grouped (by `chapterId`) and ordered (by `createdAt`) into chapters with zero input from them.
- Those raw captures are assembled into a chapter's response/body text by rule, not by a model — the artist's own words, verbatim, arranged and trimmed. No AI-generated prose anywhere in this slice.
- Card-level picks (title, pull-quote, hero image) are auto-selected from the assembled chapters.
- The artist can open Composer at any time and everything is already there, fully editable — same fields, same Publish gate, nothing new to learn.
- Once the program's itinerary end date passes, **every artist on the roster** gets a push notification + email inviting them to review the card that was quietly built for them — regardless of whether they've opened Composer once, ten times, or never. The one and only exception: an artist who has already stamped/published their card doesn't get it — they've finished, there's nothing left to invite them to review.

Nothing is ever published without the artist stamping it. This slice only makes the *draft* free.

---

## 2. Scope

### In scope
- **Auto-assembly**, running server-side (not dependent on the artist ever loading Composer): group captures by `chapterId`, order by `createdAt`, produce a `JourneyDraft` with every chapter pre-filled — by rule, not by model.
- **Text assembly**: a deterministic, rule-based step (no LLM, no API call, per §3) that arranges an artist's own raw captures into a chapter's `response`/`body` text — verbatim, never rewritten, never summarized into new sentences.
- **Card-level auto-picks**: title, `pullQuote`, hero image — derived from the assembled chapters, still overridable in Composer.
- **"Touched vs. auto-filled" tracking**: once the artist edits a field in Composer, auto-assembly must never overwrite it again on a later run (new captures still flow into *untouched* fields/chapters).
- **End-of-trip nudge**: fire push + email to every artist on the program's roster once the program has ended — not gated on prior Composer visits, only on whether they've already published (§3).
- **Composer UI**: a small affordance marking which fields are machine-built vs. artist-edited, so nothing feels sprung on them.

### Explicitly OUT of scope
- Public renderer / `chaptersJson` ghost-page rendering (next phase, per Slice 6 handoff).
- Retroactive builder (past programs have no capture stream to auto-assemble from — it stays manual).
- Audio transcription/promotion (still not published, per Slice 6 handoff).
- Any change to the Publish write path itself (`app/api/alumni/journey/`) — this slice only changes how a draft gets *populated*, not how it's written.

---

## 3. Locked decisions (resolved with Jesse, 2026-07-03)

- **No LLM anywhere in this slice.** Auto-text is heuristic assembly only — the artist's own captures, grouped and arranged by rule, never rewritten, never paraphrased, nothing generated. Jesse's framing: *"the structure should be designed in a way that accepting raw ingredients will be fine"* — i.e. the raw captures themselves, arranged well, are the deliverable. This is one step, not two:
  - **Grouping/ordering/assembly — pure rule-based, no model call, no external API.** Which captures go in which chapter (`chapterId` match), what order they appear in (`createdAt` sort), and how they're joined into `response`/`body` text (§5b) is deterministic and auditable end to end. This step never fails and never needs a fallback, because there's no external dependency to fail.
- **Nudge channel: push + email fallback, sent to everyone.** Push first (reuse `lib/webPush.ts` / `netlify/functions/send-notifications.ts`, the same backbone Rally Point/Roll Call already use). Email a few days after the itinerary end date if a contact email is on file — this specifically covers the iOS-push gap already flagged as unresolved in `field-kit-STATUS-AUDIT-2026-07-02.md` §4.
- **The nudge's only gate is "already published," not "already viewed."** It does not check whether the artist has ever opened Composer or how many times. Jesse's instructions: *"no matter how many times I have opened the composer... everyone should get it"* — then refined to *"the only person that doesn't get a notification is the go-getter artist that has already stamped their card."* So: skip an artist only when their draft has a `publishedCardId` set (the field `lib/journeyDraft.ts` already defines, set on first successful Publish/Stamp and retained through later edits). Composer-visit count is never a factor, in either direction.
- **Nothing is ever silently published.** Auto-assembly only ever produces/updates a `JourneyDraft`. The Publish/Stamp gate is unchanged — a capture never becomes public without the artist acting.
- **Sealed captures are excluded from auto-assembly**, exactly as they're already excluded from Composer/publish-media (`visibility === "sealed"`).

---

## 4. Open questions to resolve before writing code (95%-confidence gate)

1. **Where does auto-assembly actually run?** It must run even if the artist never opens the app at all — client-side-on-mount (what Composer does today) isn't enough, because the nudge (§5c) has to point at a real, already-built card for every roster member, including someone who never once opens Field Kit after capturing. Recommendation: a scheduled Netlify function (mirrors `refresh-fallbacks.ts` / `send-notifications.ts` cadence), running periodically for in-progress programs and once definitively at trip-end, that builds/updates the server-side draft in the private Blobs draft store directly. Composer, when opened, just loads whatever the assembler already built (same `loadDraft()` path it uses today). Pure rule-based logic, so it's cheap to run often.
2. **"Touched" tracking granularity.** Per-field (`response`/`body`/`title`/`pullQuote`/`heroUrl` each independently touched) or per-chapter (any edit locks the whole chapter from re-assembly)? Per-field is more precise but needs a `touchedFields` set somewhere in `JourneyDraft` or `JourneyDraftChapter` — this is a schema addition, confirm before building.
3. **Hero image auto-pick rule.** First photo capture chronologically overall, or the first photo per chapter with one promoted to card-level hero? Needs one explicit rule.
4. **Card-level title & pull-quote auto-pick.** Title: derive from the program label (`PASSAGE: Slovakia 2026`) or something more personal? Pull-quote: longest `response` line across chapters, first "quote"-kind capture, or some other rule? Needs one explicit rule per field — no model to fall back on, so the rule has to be fully specified up front.
5. **Nudge trigger timing and cadence.** How many days after the itinerary end date does the first nudge fire, and if ignored, does it repeat (and how many times / how far apart) or fire once?
6. **Re-assembly boundary.** If new captures land after the artist has already hand-edited some chapters (mid-trip Composer use), the assembler must only touch chapters/fields still in their auto-filled state — confirm this is the "touched" flag from Q2, not some separate mechanism.

**None of Q1–Q6 should be filled in with assumptions.** This is the same gate Slice 6 applied to its own §4 — resolve explicitly with Jesse first.

*(Dropped: the earlier draft of this spec had a Q7 about gating the nudge on whether the artist had ever viewed Composer, via a `firstViewedAt` field. Locked with Jesse 2026-07-03: Composer-visit history is never a gate — the nudge's only skip condition is having already published (§3, §5c) — so the `firstViewedAt` field is no longer part of this slice.)*

---

## 4-R. RESOLVED — §4 answers (locked with Jesse, 2026-07-03)

**Q1 — Scheduled Netlify function.** `netlify/functions/journey-auto-composer.ts` (thin
trigger, every 15 min, mirrors `send-notifications.ts`) POSTs
`/api/field-kit/journey/auto-assemble` with the shared `CRON_SECRET`. The route loads the
itinerary spine + every roster artist's captures, runs the pure assembler, and writes each
artist's `JourneyDraft` directly into the private `dat-journey-drafts` Blobs store — the
same store Composer's `loadDraft()` already reads. Runs while the program is live and for a
grace window past the end date; the same run performs the end-of-trip nudge check (Q5).

**Q2 — Per-field touched tracking.** `JourneyDraftChapter` gains
`touchedFields?: ("response"|"body"|"reflection"|"title"|"photoCaptureIds"|"audioCaptureId")[]`;
`JourneyDraft` gains `touchedFields?: ("title"|"pullQuote"|"hero")[]` for the card-level
picks, plus `assembledAt` (when the assembler last wrote). Additive — old drafts read as
all-untouched. Composer/Publish mark a field touched on artist edit; the assembler only
ever writes untouched fields.

**Q3 + Q4 — Anchor-chapter rule (Jesse's synthesis).** The **anchor chapter** = the chapter
with the most non-sealed captures (tiebreak: earliest in card order). Hero = the anchor's
first photo chronologically (fallback: the trip's first photo). Title = the anchor's
assembled response line — the artist's own strongest capture, verbatim, word-boundary
trimmed — NOT the program label, since the card already shows program/location/year from
its snapshot fields. Both re-pick on every assembly run ("changes as you go") until the
artist touches that field (Q2 flag) or publishes (`publishedCardId` freezes all three
card-level picks; chapter fields keep flowing per Q6). Composer marks machine-built
fields with an invite-to-edit affordance; "encourage a creative title" is UX copy, never
generation. **Pull-quote:** the earliest `quote`-kind capture verbatim (`quoteSpeaker`
preserved as attribution); else the longest response line across chapters, excluding the
line already used as the title.

**Q5 — Push at end+1 day, email at end+3 days, once each.** End date = the itinerary's
last day `fullDate`; sends fire at the first 15-min tick past 15:00 UTC on the target day
(≈17:00 in Slovakia). Per-channel, claim-first send log in Blobs (`dat-journey-nudges`) so
each channel fires at most once, ever — no repeats. The `publishedCardId` skip is
re-checked at each channel's send time, so publishing after the push suppresses the email.
Email goes to the artist's Profile-Owners `ownerEmail` via the existing Resend pattern.

**Q6 — Confirmed: the Q2 touched flags are the only re-assembly boundary.** Every run
rewrites only fields still in their auto state; new captures keep flowing into untouched
fields of otherwise-edited chapters. No separate lock.

**Sync-safety decision (surfaced during design — load-bearing).** The draft store is
last-write-wins by `updatedAt` (device ↔ server). The assembler therefore **never bumps
`updatedAt`** — it preserves the base draft's value (epoch for drafts it creates from
scratch) and stamps `assembledAt` instead. So an artist's copy always wins LWW against
machine output and no offline edit can ever be clobbered by the assembler; at worst an
assembler enrichment is overwritten by a stale artist push and reappears on the next
15-min run. `loadDraft()` adopts the server copy when `updatedAt` is equal but
`assembledAt` is newer, so auto-fill still shows up on devices.

---

## 5. Design sketch for the load-bearing pieces (draft — confirm before building)

### 5a. Grouping (deterministic, no model call)

For each program, for each of the artist's non-sealed captures (`loadCapturesForAuthor`, filtered `visibility !== "sealed"`):

1. Bucket by `chapterId` (blank/unmatched `chapterId` → held aside, not silently dropped — surfaces later as "unsorted" so nothing an artist captured vanishes without a trace).
2. Within a chapter's bucket, sort by `createdAt` ascending — this is the "when."
3. Split by `kind`: `photo` captures feed `photoCaptureIds`; `note`/`quote`/`voice`-transcript captures feed the text pool for that chapter.

This step is pure data plumbing and needs no fallback — it either has captures for a chapter or it doesn't.

### 5b. Text assembly (rule-based only — no LLM, no external API call)

Applied per chapter, over that chapter's text-pool captures from §5a, in `createdAt` order:

- **`response`** (the headline line) = the longest single capture's `bodyText` in the chapter, trimmed at a sentence boundary if it runs long. If a `quote`-kind capture exists, prefer it verbatim (quotes are never altered — `quoteSpeaker` is preserved as an attribution, not folded into the sentence).
- **`body`** (the paragraph) = every other capture's `bodyText` in that chapter, joined in chronological order with line breaks — verbatim, exactly as the artist wrote or transcribed it. No rewriting, no summarizing, no smoothing over gaps between fragments. If the notes read a little disjointed, that's fine — they're the artist's real words, in the order they wrote them, and it's always editable in Composer.
- If a chapter has exactly one capture, `response` = that capture's `bodyText` (trimmed to fit) and `body` is left empty rather than duplicating it.
- If a chapter has zero non-photo captures but does have photos, `response`/`body` stay empty and the chapter shows as photo-only until the artist adds words (in Composer or via another capture).

This is the same "raw ingredients are fine" bar Jesse set — the deliverable *is* the artist's own captured text, arranged well, not a rewritten version of it.

### 5c. End-of-trip nudge

- A scheduled check (extends the existing `send-notifications.ts` pattern) runs once past a program's itinerary end date (+ N days per §4 Q5) for every artist on that program's roster.
- **The only skip condition: `draft.publishedCardId` is set for that artist+program.** Load their `JourneyDraft` (`lib/journeyDraft.ts`) via the same draft store Composer/Publish already use; if `publishedCardId` is populated, they've stamped a card — skip them entirely, no push, no email. If it's unset — whether because they never opened Composer, opened it once, or have been editing daily without publishing — they get the nudge. Composer-visit count/history is never read or checked; the published state is the only signal that matters.
- Send push if subscribed; send email if a contact address exists — both channels, independent of each other, per the locked "push + email fallback" decision (§3).
- Copy should make clear a card already exists and is theirs to review/edit/publish — not "you forgot to do something," since they were never asked to do anything, and it should read the same whether they've been living in Composer all trip or never opened it once. Something like: *"We put together a Journey Card from what you captured in {location}. Take a look — it's yours to edit or publish whenever you're ready."*

---

## 6. Data model additions (depends on §4 answers — do not create until confirmed)

- `JourneyDraft` / `JourneyDraftChapter` gains a touched-tracking field (shape depends on §4 Q2 — per-field set vs. per-chapter flag) so re-assembly never clobbers something the artist wrote.
- No `firstViewedAt` or any other "has this artist looked at it" field — the nudge's only gate is the existing `publishedCardId` on `JourneyDraft` (already defined in `lib/journeyDraft.ts`, no schema change needed for this part).
- No changes to the Journey Cards Sheet tab or the Publish write path — this slice is entirely upstream of Publish.

---

## 7. Build sequence

1. Resolve all of §4 with Jesse. Q1–Q2 are the most load-bearing (they determine whether this is even architecturally possible without a scheduled job and a schema change) — do not start on partial confidence.
2. Build the scheduled auto-assembler (grouping + rule-based text assembly, §5a–§5b) as its own module, unit-testable against fixture captures without touching Composer at all.
3. Wire the "touched" tracking into `ComposerClient.tsx`'s `updateChapter`/`updateDraft` so manual edits mark fields touched.
4. Build the end-of-trip nudge as a scheduled check, reusing the push backbone + adding the email step — gated only on `draft.publishedCardId`, no Composer view-history check to build.
5. Verification (§8).

---

## 8. Verification (required final step)

- `npm run check` clean.
- Fixture test: a program with only 2 captures in one chapter and 0 in others → draft shows one filled chapter, others empty, no fabricated content anywhere — every word in `response`/`body` traces back to a real capture's `bodyText`.
- Fixture test: a chapter with only a single capture → `response` = that capture, `body` empty, no duplication.
- Confirm a manually-edited field survives a second auto-assembly run untouched, while an untouched chapter still receives new captures added after the edit.
- Confirm sealed captures never appear in any auto-filled field.
- Confirm the nudge (push + email) fires past the program's end date + the agreed delay for every roster member whose draft has no `publishedCardId` — including one who has opened Composer repeatedly but hasn't stamped yet, and one who never opened it at all. Confirm it does NOT fire for an artist whose draft has `publishedCardId` set, even if that's the only artist on the roster who's published.
- Confirm Composer, Publish, and Retroactive (Slice 6) still work unmodified for an artist who composes by hand.
- Given the new scheduled job, use a subagent verification pass specifically on the §5b assembly rules against real fixture captures (including messy/short/duplicate ones) to confirm nothing is ever rewritten, summarized, or invented.

---

## 9. Guardrails

- CLAUDE.md: **no changes until 95% confidence — ask follow-ups first.** §4 is intentionally left open; do not fill any of it in with an assumption.
- `npm run check` before committing.
- Do not touch the Journey Card Publish write path (`app/api/alumni/journey/`), the public renderer (`app/journeys/`), or the Retroactive builder beyond what's strictly needed to leave them working unmodified.
- **No LLM, no external model API, in any part of this slice.** Auto-assembly is rule-based end to end (§5a–§5b) — if a future phase wants AI-polished prose, that's a separate, explicitly-scoped decision, not something to slip in here.

---

## 10. HANDOFF — what Slice 7 built (2026-07-03)

**New modules**
- `lib/journeyAutoComposer.ts` — the PURE assembler (§5a/§5b + §4-R picks). No IO, no
  "server-only": fixture-tested by `npm run verify:auto-composer`
  (`scripts/journey-auto-composer.check.ts`, annotation-free per scripts/ convention).
- `lib/journeyAutoAssemble.ts` — server orchestrator: per-roster assembly into the draft
  store + the end-of-trip nudge (push via `sendToSlugs`, email via Resend to the
  Profile-Owners `ownerEmail`). Nudge state lives in a new site-wide Blobs store
  **`dat-journey-nudges`** (one small JSON per programId, claim-first per channel).
- `lib/journeyDraftServer.ts` — draft Blobs storage extracted from the draft route so the
  assembler and `/api/field-kit/draft` share one backend (`dat-journey-drafts`).
- `lib/composerSpine.ts` — itinerary→spine mapping extracted from the Composer page so the
  page and the assembler can never disagree about chapters.
- `lib/journeyNudgeEmail.ts` — Resend email (same pattern as `notifyJourneyTakedown`).
- `app/api/field-kit/journey/auto-assemble/route.ts` — CRON_SECRET-gated entry point.
- `netlify/functions/journey-auto-composer.ts` — thin scheduled trigger, every 15 min.

**Schema (additive, in `lib/journeyDraft.ts`)**
- `JourneyDraftChapter.touchedFields`, `JourneyDraft.touchedFields`, `JourneyDraft.assembledAt`
  (+ coercion). Old drafts read as all-untouched. `updatedAt` semantics unchanged — the
  assembler never bumps it (see §4-R sync-safety).

**Client wiring**
- `ComposerClient.tsx`: `updateChapter` marks patch keys touched; "✦ Built from your
  captures" tag on auto-filled fields; unsorted-captures note under the header.
- `PublishClient.tsx`: title/pull-quote/hero edits mark card-level touched; auto chips; the
  auto-picked pull-quote (possibly a quote capture, not a response line) is shown as a
  selectable option so it's never invisible.
- `journeyDraftStore.loadDraft`: adopts the server copy when `updatedAt` is equal and
  `assembledAt` is newer — the only path assembler output reaches a device.

**Deploy notes**
- No new env vars. CRON_SECRET/VAPID stay in `dat-notification-secrets` Blobs;
  `RESEND_API_KEY`/`CONTACT_FROM_EMAIL` already exist for other routes.
- The nudge can be re-armed for testing by deleting the program's key from
  `dat-journey-nudges`.
- Untouched: `app/api/alumni/journey/` (publish write path), `app/journeys/`, Retroactive,
  `app/journey-card-mockup/`.
