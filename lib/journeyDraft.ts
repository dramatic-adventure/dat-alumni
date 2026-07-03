// lib/journeyDraft.ts
//
// Slice 6 — the JourneyDraft: the private, in-progress Journey Card the artist
// shapes in the Composer (live, mid-trip) or the Retroactive builder (past
// programs). This is the "Entry" layer of the Trace/Entry unification locked
// with Jesse 2026-07-02 (slice-6 spec §4-R Q2): traces (Field-Captures rows)
// stay the atomic capture store; a draft COMPOSES them by referencing
// captureIds, adding the authored layer (response lines, prompt responses,
// personal notes, hero/pull-quote picks) on top.
//
// Storage: IndexedDB on device (lib/journeyDraftStore, autosaved on a debounce)
// + a private server copy in Netlify Blobs via /api/field-kit/draft (last-write-
// wins by updatedAt) so a lost phone doesn't lose the draft and a desktop can
// continue what a phone started (§4-R Q7).
//
// Intentionally PURE (no "server-only", no IO) so client components, the API
// route, and the publish flatten can all import it.

import {
  flattenChaptersToBody,
  flattenChaptersToMediaUrls,
  type JourneyCardChapter,
} from "@/lib/journeyCard";

// ── Draft shape ───────────────────────────────────────────────────────────────

export type JourneyDraftChapter = {
  /** Itinerary chapter id (live) or "custom-…" (retro/added). Stable join key. */
  chapterId: string;
  /** "chapter" = bound passport page (expected); "daily" = loose postcard insert. */
  kind: "chapter" | "daily";
  /** Day anchor for daily pages (itinerary day id). */
  dayId?: string;
  num?: string;
  title: string;
  location?: string;
  dateLabel?: string;
  /** The single poetic response line — headlines the chapter when published. */
  response: string;
  /** The longer prompt response — becomes the chapter's public body text. */
  body: string;
  /** Personal notes — PRIVATE, never published, never included in the flatten. */
  reflection: string;
  /** Trace refs (photo captures) attached to this chapter — live flow. */
  photoCaptureIds: string[];
  /** Trace ref (voice/ambient capture) attached to this chapter — live flow. */
  audioCaptureId?: string;
  /** Already-public photo URLs (retro flow uploads via /api/upload). */
  photoUrls?: string[];
  accent?: string;
};

export type JourneyDraft = {
  /** Client-minted ULID; stable across autosaves. */
  draftId: string;
  kind: "live" | "retro";
  /** Itinerary programId (live) or programMap slug (retro — §4-R Q6). */
  programId: string;
  /** Informational; the server ALWAYS re-derives the author from the session. */
  authorSlug: string;
  // Program snapshot (live: from the itinerary; retro: from programMap).
  program: string;
  location: string;
  country: string;
  year: string;
  dates?: string;
  // Card-level authored fields.
  title: string;
  primaryRole: string;
  accent: string;
  /** The artist's pull-quote pick — one of their chapter response lines. */
  pullQuote: string;
  /** Hero pick: a trace ref (live) or a public URL (retro). */
  heroCaptureId?: string;
  heroUrl?: string;
  chapters: JourneyDraftChapter[];
  /** Set after the first successful publish so edits reuse the same card id. */
  publishedCardId?: string;
  /** Last-write-wins key across device ↔ server copies. ISO timestamp. */
  updatedAt: string;
};

/** Server envelope for a stored draft. */
export type StoredJourneyDraft = { draft: JourneyDraft; serverUpdatedAt: string };

// A draft is text + refs only (media bytes live in the capture queue / Drive),
// so this cap is generous; it exists to stop a runaway payload, not real use.
export const MAX_DRAFT_JSON_CHARS = 200_000;
export const MAX_DRAFT_CHAPTERS = 60;

// ── Coercion (route + store both funnel untrusted JSON through this) ──────────

const str = (v: unknown) => String(v ?? "").trim();

function coerceChapter(raw: unknown): JourneyDraftChapter | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const chapterId = str(o.chapterId);
  if (!chapterId) return null;
  const ids = (v: unknown, cap: number) =>
    Array.isArray(v) ? v.map(str).filter(Boolean).slice(0, cap) : [];
  return {
    chapterId,
    kind: str(o.kind) === "daily" ? "daily" : "chapter",
    dayId: str(o.dayId) || undefined,
    num: str(o.num) || undefined,
    title: str(o.title).slice(0, 300),
    location: str(o.location).slice(0, 300) || undefined,
    dateLabel: str(o.dateLabel).slice(0, 120) || undefined,
    response: str(o.response).slice(0, 2_000),
    body: str(o.body).slice(0, 20_000),
    reflection: str(o.reflection).slice(0, 20_000),
    photoCaptureIds: ids(o.photoCaptureIds, 12),
    audioCaptureId: str(o.audioCaptureId) || undefined,
    photoUrls: ids(o.photoUrls, 12),
    accent: str(o.accent) || undefined,
  };
}

/**
 * Coerce untrusted JSON into a JourneyDraft (or null when structurally unusable).
 * Every string is trimmed and bounded; unknown keys are dropped. authorSlug is
 * carried through but MUST be overwritten server-side from the session.
 */
export function coerceJourneyDraft(raw: unknown): JourneyDraft | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const draftId = str(o.draftId);
  const programId = str(o.programId);
  if (!draftId || !programId) return null;
  const chapters = Array.isArray(o.chapters)
    ? (o.chapters.slice(0, MAX_DRAFT_CHAPTERS).map(coerceChapter).filter(Boolean) as JourneyDraftChapter[])
    : [];
  return {
    draftId,
    kind: str(o.kind) === "retro" ? "retro" : "live",
    programId,
    authorSlug: str(o.authorSlug),
    program: str(o.program).slice(0, 200),
    location: str(o.location).slice(0, 200),
    country: str(o.country).slice(0, 200),
    year: str(o.year).slice(0, 20),
    dates: str(o.dates).slice(0, 200) || undefined,
    title: str(o.title).slice(0, 300),
    primaryRole: str(o.primaryRole).slice(0, 200),
    accent: str(o.accent) || "teal",
    pullQuote: str(o.pullQuote).slice(0, 2_000),
    heroCaptureId: str(o.heroCaptureId) || undefined,
    heroUrl: str(o.heroUrl) || undefined,
    chapters,
    publishedCardId: str(o.publishedCardId) || undefined,
    updatedAt: str(o.updatedAt) || new Date(0).toISOString(),
  };
}

// ── Readiness (drives the Publish flow's honest, non-punitive summary) ────────

export type ChapterReadiness = "written" | "in-progress" | "empty";

export function chapterReadiness(ch: JourneyDraftChapter): ChapterReadiness {
  const hasMedia = ch.photoCaptureIds.length > 0 || (ch.photoUrls?.length ?? 0) > 0 || !!ch.audioCaptureId;
  if (ch.response && (ch.body || hasMedia)) return "written";
  if (ch.response || ch.body || ch.reflection || hasMedia) return "in-progress";
  return "empty";
}

// ── Publish flatten (§4-R Q1) ─────────────────────────────────────────────────

/**
 * Draft chapters → sanitized JourneyCardChapter blocks for the chaptersJson
 * column. `resolvePhotoUrls` maps a chapter's trace refs to the PUBLIC URLs the
 * media-promotion step minted (empty for unpromoted/sealed/missing captures);
 * retro chapters already carry public URLs. `reflection` is deliberately never
 * copied — personal notes stay private forever.
 */
export function draftToChapterBlocks(
  draft: JourneyDraft,
  resolvePhotoUrls: (ch: JourneyDraftChapter) => string[],
  resolveAudioUrl?: (ch: JourneyDraftChapter) => string | undefined
): JourneyCardChapter[] {
  return draft.chapters.map((ch) => {
    const readiness = chapterReadiness(ch);
    const photoUrls = [...(ch.photoUrls ?? []), ...resolvePhotoUrls(ch)].filter(Boolean);
    return {
      chapterId: ch.chapterId,
      kind: ch.kind,
      num: ch.num,
      title: ch.title,
      location: ch.location,
      dateLabel: ch.dateLabel,
      response: ch.response || undefined,
      body: ch.body || undefined,
      photoUrls: photoUrls.length ? photoUrls : undefined,
      audioUrl: resolveAudioUrl?.(ch),
      accent: ch.accent,
      status: readiness === "empty" ? "empty" : "written",
    };
  });
}

/**
 * The flat fields the extended /api/alumni/journey POST expects, derived from
 * the chapter blocks plus the artist's explicit picks (pullQuote, hero).
 */
export function flattenDraftForPublish(
  draft: JourneyDraft,
  blocks: JourneyCardChapter[],
  heroUrl: string
): {
  body: string;
  mediaUrls: string;
  pullQuote: string;
  heroUrl: string;
} {
  const media = flattenChaptersToMediaUrls(blocks);
  return {
    body: flattenChaptersToBody(blocks),
    mediaUrls: media.join(", "),
    pullQuote: draft.pullQuote,
    heroUrl: heroUrl || media[0] || "",
  };
}
