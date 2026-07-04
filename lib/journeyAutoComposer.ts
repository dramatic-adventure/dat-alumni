// lib/journeyAutoComposer.ts
//
// Slice 7 — the Auto-Composer: builds/updates a JourneyDraft from an artist's
// own Field Kit captures, BY RULE ONLY. No LLM, no external API, nothing
// generated: every word in an auto-filled field is a capture's bodyText,
// verbatim — grouped by chapterId, ordered by createdAt, joined with line
// breaks, at most trimmed at a sentence/word boundary (spec §5b; locked with
// Jesse 2026-07-03: "raw ingredients are fine").
//
// Touched-field contract (§4-R Q2/Q6): the assembler writes ONLY fields absent
// from touchedFields (chapter-level and card-level). Once the artist edits a
// field, it is theirs forever; untouched fields are honestly recomputed on
// every run. Daily pages (kind "daily") are artist-created and never touched.
//
// Sync contract (§4-R sync-safety): the assembler NEVER bumps updatedAt — it
// preserves the base draft's value (epoch for drafts it creates) and stamps
// assembledAt instead, so an artist's copy always wins last-write-wins.
//
// Intentionally PURE (no "server-only", no IO) so the scheduled assembler, the
// draft route, and fixture tests can all run it.

import {
  type CardTouchedField,
  type ChapterTouchedField,
  type JourneyDraft,
  type JourneyDraftChapter,
} from "@/lib/journeyDraft";
import type { SpineChapter } from "@/lib/composerSpine";
import { ulid } from "@/lib/ulid";

// ── Inputs ────────────────────────────────────────────────────────────────────

/** The capture fields assembly needs — FieldCapture satisfies this structurally. */
export type AssemblerCapture = {
  captureId: string;
  kind: string; // "note" | "quote" | "photo" | "voice"
  bodyText: string;
  createdAt: string;
  chapterId: string;
  visibility: "card" | "sealed";
  quoteSpeaker: string;
  driveFileId: string;
};

export type AssemblerProgramMeta = {
  program: string;
  location: string;
  country: string;
  year: string;
  dates: string;
};

export type AssembleResult = {
  draft: JourneyDraft;
  /** False when the run produced a byte-identical draft — callers skip the write. */
  changed: boolean;
  /** Non-sealed captures with a blank/unmatched chapterId — held aside, never dropped. */
  unsortedCaptureIds: string[];
};

// Matches the Composer UI's photo cap so auto-fill never exceeds what the
// editor lets the artist manage by hand.
export const AUTO_MAX_PHOTOS_PER_CHAPTER = 5;
/** "Runs long" boundary for a chapter's response line (§5b trim rule). */
export const RESPONSE_MAX_CHARS = 200;
/** Card title length — the anchor's response line, word-boundary trimmed. */
export const TITLE_MAX_CHARS = 80;

// ── Pure text helpers (trim only — never rewrite) ─────────────────────────────

/**
 * Trim verbatim text to fit `max`: prefer the longest whole-sentence prefix;
 * fall back to a word boundary with an ellipsis. Never inserts or reorders
 * words — the output is always a prefix of the input (plus "…" when cut).
 */
export function trimAtBoundary(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  const slice = t.slice(0, max);
  let sentenceEnd = -1;
  for (const m of slice.matchAll(/[.!?…](?=["”'’)\]]*(\s|$))["”'’)\]]*/g)) {
    sentenceEnd = m.index + m[0].length;
  }
  if (sentenceEnd > 0) return slice.slice(0, sentenceEnd).trim();
  const lastSpace = slice.lastIndexOf(" ");
  let stem = lastSpace > 0 ? slice.slice(0, lastSpace) : slice;
  // Never split a surrogate pair (e.g. an emoji) — a lone half would be an
  // invented character, and no output character may be something the artist
  // didn't type.
  const lastCode = stem.charCodeAt(stem.length - 1);
  if (lastCode >= 0xd800 && lastCode <= 0xdbff) stem = stem.slice(0, -1);
  return `${stem.trim()}…`;
}

/**
 * A quote capture, verbatim, with quoteSpeaker preserved as an attribution —
 * never folded into the sentence (§5b).
 */
export function formatQuote(bodyText: string, speaker: string): string {
  const text = bodyText.trim();
  const who = speaker.trim();
  return who ? `“${text}” — ${who}` : text;
}

function captureText(c: AssemblerCapture): string {
  return c.kind === "quote" ? formatQuote(c.bodyText, c.quoteSpeaker) : c.bodyText.trim();
}

// ── Grouping (§5a) ────────────────────────────────────────────────────────────

type ChapterBucket = {
  /** note/quote captures with words — the chapter's text pool, createdAt asc. */
  textPool: AssemblerCapture[];
  /** photo captures with a media ref, createdAt asc. */
  photos: AssemblerCapture[];
  /** voice captures with a media ref, createdAt asc. */
  voices: AssemblerCapture[];
  /** Everything above, for anchor-chapter weighing. */
  total: number;
};

function bucketCaptures(
  spine: SpineChapter[],
  captures: AssemblerCapture[]
): { buckets: Map<string, ChapterBucket>; unsorted: AssemblerCapture[] } {
  const spineIds = new Set(spine.map((s) => s.id));
  const buckets = new Map<string, ChapterBucket>();
  for (const id of spineIds) buckets.set(id, { textPool: [], photos: [], voices: [], total: 0 });

  const unsorted: AssemblerCapture[] = [];
  const sorted = [...captures]
    .filter((c) => c.visibility !== "sealed")
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  for (const c of sorted) {
    const bucket = buckets.get(c.chapterId.trim());
    if (!bucket) {
      unsorted.push(c); // blank/unmatched chapterId — held aside, surfaced, never dropped
      continue;
    }
    if (c.kind === "photo") {
      if (c.driveFileId) {
        bucket.photos.push(c);
        bucket.total += 1;
      }
    } else if (c.kind === "voice") {
      if (c.driveFileId) {
        bucket.voices.push(c);
        bucket.total += 1;
      }
    } else if (c.bodyText.trim()) {
      // note / quote — the text pool
      bucket.textPool.push(c);
      bucket.total += 1;
    }
  }
  return { buckets, unsorted };
}

// ── Text assembly (§5b) ───────────────────────────────────────────────────────

/**
 * Pick the response-line source: prefer quote-kind captures (the longest one,
 * earliest on ties — quotes are never altered); otherwise the longest capture.
 */
function pickResponseSource(pool: AssemblerCapture[]): AssemblerCapture | null {
  if (!pool.length) return null;
  const candidates = pool.some((c) => c.kind === "quote")
    ? pool.filter((c) => c.kind === "quote")
    : pool;
  // pool is createdAt-ascending, so > keeps the earliest of equal lengths.
  return candidates.reduce((best, c) =>
    c.bodyText.trim().length > best.bodyText.trim().length ? c : best
  );
}

/**
 * `responseIsAuto` matters: when the artist has touched the response, NO capture
 * is routed to it — so the would-be response source stays in the body pool and
 * its words still land somewhere instead of silently vanishing.
 */
function assembleChapterText(
  pool: AssemblerCapture[],
  responseIsAuto: boolean
): { response: string; body: string } {
  const source = responseIsAuto ? pickResponseSource(pool) : null;
  // Quotes are never altered (§5b): a quote response stays fully verbatim with
  // its attribution — trimming could cut words or lose the speaker. Notes trim
  // at a sentence/word boundary when they run long.
  const response = !source
    ? ""
    : source.kind === "quote"
      ? captureText(source)
      : trimAtBoundary(captureText(source), RESPONSE_MAX_CHARS);
  // Exactly one capture → it IS the response; body stays empty (no duplication).
  const rest = source ? pool.filter((c) => c.captureId !== source.captureId) : pool;
  const body = rest.map(captureText).filter(Boolean).join("\n\n");
  return { response, body };
}

// ── Draft scaffolding ─────────────────────────────────────────────────────────

function chapterFromSpine(ch: SpineChapter): JourneyDraftChapter {
  return {
    chapterId: ch.id,
    kind: "chapter",
    num: String(ch.num).padStart(2, "0"),
    title: ch.title,
    location: ch.place,
    dateLabel: ch.dateLabel,
    response: "",
    body: "",
    reflection: "",
    photoCaptureIds: [],
    accent: ch.accent,
  };
}

function freshDraft(
  programId: string,
  authorSlug: string,
  meta: AssemblerProgramMeta,
  spine: SpineChapter[]
): JourneyDraft {
  return {
    draftId: ulid(),
    kind: "live",
    programId,
    authorSlug,
    program: meta.program,
    location: meta.location,
    country: meta.country,
    year: meta.year,
    dates: meta.dates,
    title: "",
    primaryRole: "",
    accent: "teal",
    pullQuote: "",
    chapters: spine.map(chapterFromSpine),
    // Epoch, NOT now: any artist copy must win last-write-wins over this.
    updatedAt: new Date(0).toISOString(),
  };
}

const chapterTouched = (ch: JourneyDraftChapter, f: ChapterTouchedField) =>
  (ch.touchedFields ?? []).includes(f);
// Card-level picks re-pick "until the artist touches that field or publishes"
// (§4-R Q3/Q4) — once stamped, the card's face is theirs, frozen. Chapter
// fields keep flowing per Q6 (touched flags are their only boundary).
const cardTouched = (d: JourneyDraft, f: CardTouchedField) =>
  !!d.publishedCardId || (d.touchedFields ?? []).includes(f);

// ── The assembler ─────────────────────────────────────────────────────────────

export function assembleDraft(input: {
  programId: string;
  authorSlug: string;
  program: AssemblerProgramMeta;
  spine: SpineChapter[];
  captures: AssemblerCapture[];
  existing: JourneyDraft | null;
  /** ISO timestamp stamped as assembledAt when the run changes anything. */
  now: string;
}): AssembleResult {
  const { programId, authorSlug, program, spine, captures, existing, now } = input;
  const { buckets, unsorted } = bucketCaptures(spine, captures);

  const base = existing ?? freshDraft(programId, authorSlug, program, spine);

  // Additive spine reconcile (same rule as Composer): new itinerary chapters
  // gain a slot; existing entries and dailies keep their order and content.
  const have = new Set(base.chapters.map((c) => c.chapterId));
  const chapters = [
    ...base.chapters,
    ...spine.filter((s) => !have.has(s.id)).map(chapterFromSpine),
  ].map((ch) => {
    if (ch.kind !== "chapter") return ch; // dailies are artist-owned, never assembled
    const bucket = buckets.get(ch.chapterId);
    if (!bucket) return ch; // not on this spine (e.g. removed chapter) — leave alone

    const next = { ...ch };
    const responseIsAuto = !chapterTouched(ch, "response");
    const { response, body } = assembleChapterText(bucket.textPool, responseIsAuto);
    if (responseIsAuto) next.response = response;
    if (!chapterTouched(ch, "body")) next.body = body;
    if (!chapterTouched(ch, "photoCaptureIds")) {
      next.photoCaptureIds = bucket.photos
        .slice(0, AUTO_MAX_PHOTOS_PER_CHAPTER)
        .map((c) => c.captureId);
    }
    if (!chapterTouched(ch, "audioCaptureId")) {
      next.audioCaptureId = bucket.voices[0]?.captureId;
    }
    return next;
  });

  const draft: JourneyDraft = { ...base, chapters };

  // ── Card-level picks (§4-R Q3/Q4: the anchor-chapter rule) ──
  // Anchor = the spine chapter with the most captures, earliest on ties.
  let anchorId = "";
  let anchorCount = 0;
  for (const s of spine) {
    const count = buckets.get(s.id)?.total ?? 0;
    if (count > anchorCount) {
      anchorId = s.id;
      anchorCount = count;
    }
  }
  const entryById = new Map(
    chapters.filter((c) => c.kind === "chapter").map((c) => [c.chapterId, c])
  );
  const anchor = anchorId ? entryById.get(anchorId) : undefined;

  // Title: the anchor's response line — the artist's own strongest sentence —
  // word-boundary trimmed. Fallback: the first chapter (card order) with words.
  // The SOURCE chapter is tracked (not assumed to be the anchor) so the
  // pull-quote exclusion below always excludes the line actually used.
  const autoTitleSource =
    (anchor?.response ? anchor : undefined) ??
    chapters.find((c): c is JourneyDraftChapter => c.kind === "chapter" && !!c.response);
  if (!cardTouched(draft, "title")) {
    draft.title = autoTitleSource
      ? trimAtBoundary(autoTitleSource.response, TITLE_MAX_CHARS)
      : "";
  }

  // Pull-quote: earliest quote-kind capture verbatim (attribution preserved);
  // else the longest response line, excluding the line the title came from.
  if (!cardTouched(draft, "pullQuote")) {
    let firstQuote: AssemblerCapture | null = null;
    for (const s of spine) {
      for (const c of buckets.get(s.id)?.textPool ?? []) {
        if (c.kind !== "quote") continue;
        if (!firstQuote || c.createdAt.localeCompare(firstQuote.createdAt) < 0) firstQuote = c;
      }
    }
    if (firstQuote) {
      draft.pullQuote = formatQuote(firstQuote.bodyText, firstQuote.quoteSpeaker);
    } else {
      // Exclude the line the title actually came from (only when the title is
      // machine-picked — an artist-written title duplicates nothing).
      const titleSourceId = !cardTouched(draft, "title") && autoTitleSource
        ? autoTitleSource.chapterId
        : "";
      const lines = chapters.filter(
        (c) => c.kind === "chapter" && c.response && c.chapterId !== titleSourceId
      );
      const longest = lines.reduce<JourneyDraftChapter | null>(
        (best, c) => (!best || c.response.length > best.response.length ? c : best),
        null
      );
      draft.pullQuote = longest?.response ?? "";
    }
  }

  // Hero: the anchor's first photo; fallback, the trip's first photo overall.
  if (!cardTouched(draft, "hero")) {
    const anchorPhoto = anchorId ? buckets.get(anchorId)?.photos[0] : undefined;
    const tripFirst = spine
      .flatMap((s) => buckets.get(s.id)?.photos ?? [])
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
    draft.heroCaptureId = (anchorPhoto ?? tripFirst)?.captureId;
  }

  // ── Change detection (assembledAt/updatedAt excluded — updatedAt never moves) ──
  const strip = (d: JourneyDraft) => JSON.stringify({ ...d, assembledAt: "" });
  const changed = !existing || strip(draft) !== strip(existing);
  if (changed) draft.assembledAt = now;

  return { draft, changed, unsortedCaptureIds: unsorted.map((c) => c.captureId) };
}
