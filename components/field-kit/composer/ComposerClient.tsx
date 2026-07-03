// components/field-kit/composer/ComposerClient.tsx
//
// The Composer (Slice 6) — production port of the approved mockup
// app/journey-card-mockup/v17/traveling-artist/composer/ComposerStudio.tsx.
// Two faces:
//
//   Editor  — the considered per-chapter surface: prompt with the » field-doc
//             marker, the response line, the longer response, Personal Notes
//             (first-class, private, never published), and attaching the
//             artist's REAL traces (photos/voice) to the chapter.
//   Preview — how the assembled card reads right now: passport pages for
//             written chapters, postcard inserts for daily pages, ghost slots
//             for chapters not yet started, and the Stamp CTA → /field-kit/publish.
//
// Offline-first (§4-R Q7): every edit autosaves to IndexedDB on a debounce
// ("Saved on this device" is always literally true); a background last-write-
// wins push mirrors the draft to /api/field-kit/draft on blur / when online.
// The mockup's Face 1 (Quick Capture) is the existing /field-kit/capture
// screen — linked from the editor, not duplicated.

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { T, FONT, accent as accentHex } from "@/components/field-kit/tokens";
import {
  chapterReadiness,
  type JourneyDraft,
  type JourneyDraftChapter,
} from "@/lib/journeyDraft";
import {
  draftKey,
  loadDraft,
  pushDraft,
  saveDraftLocal,
  startDraftSync,
  subscribeDraftSync,
  type DraftSyncState,
} from "@/lib/journeyDraftStore";
import { ulid } from "@/lib/ulid";
import type { ItineraryAccent } from "@/lib/programItinerary";

// ── Serializable inputs from the server page ─────────────────────────────────

export type ComposerChapter = {
  id: string;
  num: number;
  verb: string;
  place: string;
  title: string;
  goal: string;
  prompt: string;
  accent: ItineraryAccent;
  dayIds: string[];
  dateLabel: string;
};

export type ComposerTrace = {
  captureId: string;
  kind: string; // "note" | "quote" | "photo" | "voice"
  bodyText: string;
  createdAt: string;
  dayIndex: string;
  chapterId: string;
  quoteSpeaker: string;
  driveFileId: string;
};

type ProgramMeta = {
  program: string;
  location: string;
  country: string;
  year: string;
  dates: string;
  label: string;
};

const AUTOSAVE_DEBOUNCE_MS = 800;
const MAX_PHOTOS_PER_CHAPTER = 5;

export function captureMediaUrl(driveFileId: string): string {
  return `/api/field-kit/capture/media/${encodeURIComponent(driveFileId)}`;
}

// ── Draft init / reconcile ────────────────────────────────────────────────────

function chapterFromSpine(ch: ComposerChapter): JourneyDraftChapter {
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

function initDraft(
  programId: string,
  authorSlug: string,
  program: ProgramMeta,
  chapters: ComposerChapter[]
): JourneyDraft {
  return {
    draftId: ulid(),
    kind: "live",
    programId,
    authorSlug,
    program: program.program,
    location: program.location,
    country: program.country,
    year: program.year,
    dates: program.dates,
    title: "",
    primaryRole: "",
    accent: "teal",
    pullQuote: "",
    chapters: chapters.map(chapterFromSpine),
    updatedAt: new Date().toISOString(),
  };
}

/** Additive reconcile: a chapter added to the itinerary mid-trip gains a slot. */
function reconcileWithSpine(draft: JourneyDraft, chapters: ComposerChapter[]): JourneyDraft {
  const have = new Set(draft.chapters.map((c) => c.chapterId));
  const missing = chapters.filter((ch) => !have.has(ch.id));
  if (!missing.length) return draft;
  return { ...draft, chapters: [...draft.chapters, ...missing.map(chapterFromSpine)] };
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ComposerClient({
  programId,
  authorSlug,
  asId,
  program,
  chapters,
  traces,
}: {
  programId: string;
  authorSlug: string;
  asId?: string;
  program: ProgramMeta;
  chapters: ComposerChapter[];
  traces: ComposerTrace[];
}) {
  const [face, setFace] = useState<"editor" | "preview">("editor");
  const [draft, setDraft] = useState<JourneyDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeChapterId, setActiveChapterId] = useState<string>(chapters[0]?.id ?? "");
  const [syncState, setSyncState] = useState<DraftSyncState>("synced");
  const key = draftKey("live", programId);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestDraft = useRef<JourneyDraft | null>(null);

  // Load (device ↔ server merge) once; init from the spine when nothing exists.
  useEffect(() => {
    let cancelled = false;
    startDraftSync();
    void (async () => {
      const loaded = await loadDraft("live", programId, asId);
      if (cancelled) return;
      const next = loaded
        ? reconcileWithSpine(loaded, chapters)
        : initDraft(programId, authorSlug, program, chapters);
      latestDraft.current = next;
      setDraft(next);
      setLoading(false);
      if (!loaded) void saveDraftLocal(next);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programId]);

  useEffect(() => {
    return subscribeDraftSync((k, state) => {
      if (k === key) setSyncState(state);
    });
  }, [key]);

  // Debounced local autosave (the always-true "Saved on this device").
  const updateDraft = useCallback((mutate: (d: JourneyDraft) => JourneyDraft) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const next = { ...mutate(prev), updatedAt: new Date().toISOString() };
      latestDraft.current = next;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        saveTimer.current = null;
        void saveDraftLocal(next);
      }, AUTOSAVE_DEBOUNCE_MS);
      return next;
    });
  }, []);

  // Field blur → flush the local save now and nudge the server push.
  const flush = useCallback(() => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    const d = latestDraft.current;
    if (d) void saveDraftLocal(d).then(() => void pushDraft(key, asId));
  }, [key, asId]);

  // Flush on unmount so navigating away never drops a keystroke.
  useEffect(() => flush, [flush]);

  const updateChapter = useCallback(
    (chapterId: string, patch: Partial<JourneyDraftChapter>) => {
      updateDraft((d) => ({
        ...d,
        chapters: d.chapters.map((c) => (c.chapterId === chapterId ? { ...c, ...patch } : c)),
      }));
    },
    [updateDraft]
  );

  if (loading || !draft) {
    return (
      <main style={{ maxWidth: 620, margin: "0 auto", padding: "60px 20px", textAlign: "center" }}>
        <p style={{ fontFamily: FONT.grotesk, fontSize: 11, fontWeight: 700, letterSpacing: "0.24em", textTransform: "uppercase", color: T.muted }}>
          Opening your draft…
        </p>
      </main>
    );
  }

  const activeSpine = chapters.find((c) => c.id === activeChapterId) ?? chapters[0];
  const activeEntry = draft.chapters.find(
    (c) => c.kind === "chapter" && c.chapterId === (activeSpine?.id ?? "")
  );

  return (
    <main style={{ maxWidth: 620, margin: "0 auto", padding: "34px clamp(16px, 5vw, 40px) 110px" }}>
      {/* ── Header + face switcher ── */}
      <p style={{ fontFamily: FONT.grotesk, fontWeight: 700, fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase", color: T.teal, margin: "0 0 8px" }}>
        Composer · {program.label || `${program.program}: ${program.location} ${program.year}`}
      </p>
      <h1 style={{ fontFamily: FONT.anton, fontSize: "clamp(28px, 6.5vw, 44px)", lineHeight: 0.96, textTransform: "uppercase", color: T.ink, margin: "0 0 14px" }}>
        Shape your card.
      </h1>

      <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
        {(
          [
            { id: "editor", label: "Editor" },
            { id: "preview", label: "Preview" },
          ] as const
        ).map((f) => {
          const on = face === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                if (f.id === "preview") flush();
                setFace(f.id);
              }}
              style={{
                fontFamily: FONT.grotesk, fontSize: 11, fontWeight: 700,
                letterSpacing: "0.08em", textTransform: "uppercase",
                cursor: "pointer", padding: "8px 18px", borderRadius: 8,
                border: `1px solid ${on ? T.yellow : T.border}`,
                background: on ? T.yellow : "transparent",
                color: on ? T.black : T.muted,
              }}
            >
              {f.label}
            </button>
          );
        })}
        <Link
          href={asId ? `/field-kit/capture?asId=${encodeURIComponent(asId)}` : "/field-kit/capture"}
          style={{
            fontFamily: FONT.grotesk, fontSize: 11, fontWeight: 700,
            letterSpacing: "0.08em", textTransform: "uppercase",
            padding: "8px 18px", borderRadius: 8, marginLeft: "auto",
            border: `1px solid ${T.border}`, color: T.muted, textDecoration: "none",
          }}
        >
          ✦ Quick capture
        </Link>
      </div>

      {face === "editor" ? (
        <>
          {/* ── Chapter chips ── */}
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 6, marginBottom: 16 }}>
            {chapters.map((ch) => {
              const entry = draft.chapters.find((c) => c.kind === "chapter" && c.chapterId === ch.id);
              const readiness = entry ? chapterReadiness(entry) : "empty";
              const on = ch.id === activeSpine?.id;
              const acc = accentHex(ch.accent);
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => {
                    flush();
                    setActiveChapterId(ch.id);
                  }}
                  style={{
                    fontFamily: FONT.grotesk, fontSize: 10, fontWeight: 700,
                    letterSpacing: "0.08em", textTransform: "uppercase",
                    cursor: "pointer", padding: "7px 12px", borderRadius: 7,
                    whiteSpace: "nowrap", flexShrink: 0,
                    border: `1.5px solid ${on ? acc : T.border}`,
                    background: on ? `${acc}22` : T.card,
                    color: on ? T.ink : T.muted,
                  }}
                >
                  {String(ch.num).padStart(2, "0")} · {ch.verb}
                  <span style={{ marginLeft: 6, color: readiness === "written" ? T.green : readiness === "in-progress" ? T.pink : T.dim }}>
                    {readiness === "written" ? "✓" : readiness === "in-progress" ? "↻" : "○"}
                  </span>
                </button>
              );
            })}
          </div>

          {activeSpine && activeEntry && (
            <ChapterEditor
              spine={activeSpine}
              entry={activeEntry}
              draft={draft}
              traces={traces}
              onPatch={(patch) => updateChapter(activeEntry.chapterId, patch)}
              onBlur={flush}
              onAddDaily={() => {
                const dailyId = `daily-${ulid()}`;
                updateDraft((d) => {
                  const idx = d.chapters.findIndex(
                    (c) => c.kind === "chapter" && c.chapterId === activeSpine.id
                  );
                  // A daily page slips in right after its chapter (and after any
                  // dailies already tucked there) so array order IS card order.
                  let insertAt = idx + 1;
                  while (insertAt < d.chapters.length && d.chapters[insertAt].kind === "daily") insertAt++;
                  const daily: JourneyDraftChapter = {
                    chapterId: dailyId,
                    kind: "daily",
                    dayId: activeSpine.dayIds[0],
                    title: "",
                    location: activeSpine.place,
                    dateLabel: "",
                    response: "",
                    body: "",
                    reflection: "",
                    photoCaptureIds: [],
                    accent: activeSpine.accent,
                  };
                  const next = [...d.chapters];
                  next.splice(insertAt, 0, daily);
                  return { ...d, chapters: next };
                });
              }}
              onPatchDaily={updateChapter}
              onRemoveDaily={(dailyId) =>
                updateDraft((d) => ({
                  ...d,
                  chapters: d.chapters.filter((c) => c.chapterId !== dailyId),
                }))
              }
            />
          )}
        </>
      ) : (
        <PreviewFace draft={draft} chapters={chapters} traces={traces} asId={asId} />
      )}

      {/* ── Save bar ── */}
      <div
        style={{
          position: "sticky", bottom: 74, marginTop: 22,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: T.black, borderRadius: 12, padding: "11px 16px",
          border: `1px solid ${T.border}`, boxShadow: "0 6px 18px rgba(0,0,0,0.4)",
        }}
      >
        <div>
          <p style={{ fontFamily: FONT.grotesk, fontSize: 8.5, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: T.yellow, margin: "0 0 2px" }}>
            Saved on this device
          </p>
          <p style={{ fontFamily: FONT.dm, fontSize: 11.5, color: T.muted, margin: 0 }}>
            {syncState === "synced" && "Backed up to your account"}
            {syncState === "syncing" && "Backing up…"}
            {syncState === "offline" && "Offline — backs up when reconnected"}
            {syncState === "local-only" && "On this device — will back up when it can"}
          </p>
        </div>
        {face === "preview" ? (
          <Link
            href={asId ? `/field-kit/publish?asId=${encodeURIComponent(asId)}` : "/field-kit/publish"}
            style={{
              fontFamily: FONT.grotesk, fontSize: 10, fontWeight: 700,
              letterSpacing: "0.1em", textTransform: "uppercase",
              background: T.yellow, color: T.black, textDecoration: "none",
              padding: "9px 18px", borderRadius: 8,
            }}
          >
            Review &amp; publish →
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => {
              flush();
              setFace("preview");
            }}
            style={{
              fontFamily: FONT.grotesk, fontSize: 10, fontWeight: 700,
              letterSpacing: "0.1em", textTransform: "uppercase",
              background: "transparent", color: T.yellow, cursor: "pointer",
              padding: "9px 14px", borderRadius: 8, border: `1px solid ${T.border}`,
            }}
          >
            Preview →
          </button>
        )}
      </div>
    </main>
  );
}

// ── Chapter editor (Face 2 of the mockup) ─────────────────────────────────────

function ChapterEditor({
  spine,
  entry,
  draft,
  traces,
  onPatch,
  onBlur,
  onAddDaily,
  onPatchDaily,
  onRemoveDaily,
}: {
  spine: ComposerChapter;
  entry: JourneyDraftChapter;
  draft: JourneyDraft;
  traces: ComposerTrace[];
  onPatch: (patch: Partial<JourneyDraftChapter>) => void;
  onBlur: () => void;
  onAddDaily: () => void;
  onPatchDaily: (dailyId: string, patch: Partial<JourneyDraftChapter>) => void;
  onRemoveDaily: (dailyId: string) => void;
}) {
  const acc = accentHex(spine.accent);
  const [showAllPhotos, setShowAllPhotos] = useState(false);

  const photoTraces = useMemo(() => traces.filter((t) => t.kind === "photo" && t.driveFileId), [traces]);
  const voiceTraces = useMemo(() => traces.filter((t) => t.kind === "voice" && t.driveFileId), [traces]);

  // Photos captured in this chapter (by chapterId or day anchor) surface first.
  const chapterDaySet = useMemo(() => new Set(spine.dayIds), [spine.dayIds]);
  const matchesChapter = useCallback(
    (t: ComposerTrace) => t.chapterId === spine.id || chapterDaySet.has(t.dayIndex),
    [spine.id, chapterDaySet]
  );
  const visiblePhotos = showAllPhotos ? photoTraces : photoTraces.filter(matchesChapter);

  const dailies = useMemo(() => {
    // Dailies tucked directly after this chapter in card order.
    const idx = draft.chapters.findIndex((c) => c.kind === "chapter" && c.chapterId === spine.id);
    const out: JourneyDraftChapter[] = [];
    for (let i = idx + 1; i < draft.chapters.length; i++) {
      if (draft.chapters[i].kind !== "daily") break;
      out.push(draft.chapters[i]);
    }
    return out;
  }, [draft.chapters, spine.id]);

  function togglePhoto(captureId: string) {
    const has = entry.photoCaptureIds.includes(captureId);
    if (!has && entry.photoCaptureIds.length >= MAX_PHOTOS_PER_CHAPTER) return;
    onPatch({
      photoCaptureIds: has
        ? entry.photoCaptureIds.filter((id) => id !== captureId)
        : [...entry.photoCaptureIds, captureId],
    });
  }

  return (
    <section>
      {/* Chapter header */}
      <div
        style={{
          padding: "16px 16px 12px", borderRadius: 12, marginBottom: 14,
          background: `linear-gradient(135deg, ${acc}22 0%, ${T.card} 60%)`,
          border: `1px solid ${T.border}`,
        }}
      >
        <p style={{ fontFamily: FONT.grotesk, fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: acc, margin: "0 0 3px" }}>
          Ch {String(spine.num).padStart(2, "0")} · {spine.place}{spine.dateLabel ? ` · ${spine.dateLabel}` : ""}
        </p>
        <p style={{ fontFamily: FONT.anton, fontSize: 24, textTransform: "uppercase", color: T.ink, margin: "0 0 6px", lineHeight: 1 }}>
          {spine.verb} <span style={{ color: acc }}>in {spine.place}</span>
        </p>
        {spine.goal && (
          <p style={{ fontFamily: FONT.dm, fontStyle: "italic", fontSize: 12, color: T.muted, margin: 0, lineHeight: 1.45 }}>
            Goal: {spine.goal}
          </p>
        )}
      </div>

      {/* Prompt — » field-doc marker */}
      {spine.prompt && (
        <div style={{ padding: "10px 13px", borderRadius: 9, background: `${acc}14`, border: `1px solid ${acc}40`, marginBottom: 16 }}>
          <p style={{ fontFamily: FONT.grotesk, fontSize: 8.5, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: acc, margin: "0 0 4px" }}>
            » Prompt
          </p>
          <p style={{ fontFamily: FONT.dm, fontStyle: "italic", fontSize: 13, color: T.ink, opacity: 0.85, margin: 0, lineHeight: 1.5 }}>
            {spine.prompt}
          </p>
        </div>
      )}

      {/* Response line */}
      <Field label="Response line" hint="— one sentence; it headlines this chapter">
        <input
          type="text"
          value={entry.response}
          onChange={(e) => onPatch({ response: e.target.value })}
          onBlur={onBlur}
          placeholder="One sentence. The line that makes the reader feel it."
          style={inputStyle}
        />
      </Field>

      {/* Longer response */}
      <Field label="Your response">
        <textarea
          value={entry.body}
          onChange={(e) => onPatch({ body: e.target.value })}
          onBlur={onBlur}
          placeholder="Write toward the prompt or past it…"
          rows={5}
          style={{ ...inputStyle, resize: "vertical", borderColor: `${acc}50` }}
        />
      </Field>

      {/* Personal notes — first-class, private, never published */}
      <Field label="Personal notes" hint="— optional, private. Never published.">
        <textarea
          value={entry.reflection}
          onChange={(e) => onPatch({ reflection: e.target.value })}
          onBlur={onBlur}
          placeholder="What would you write if no one would read it?"
          rows={3}
          style={{ ...inputStyle, resize: "vertical", borderStyle: "dashed" }}
        />
      </Field>

      {/* Photos from real traces */}
      <Field
        label={`Photos (${entry.photoCaptureIds.length}/${MAX_PHOTOS_PER_CHAPTER})`}
        hint="— tap to attach from your traces"
      >
        {photoTraces.length === 0 ? (
          <p style={{ fontFamily: FONT.dm, fontSize: 12.5, fontStyle: "italic", color: T.muted, margin: 0 }}>
            No photo traces yet — catch one with Quick Capture and it appears here.
          </p>
        ) : (
          <>
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
              {visiblePhotos.map((t) => {
                const attachedIdx = entry.photoCaptureIds.indexOf(t.captureId);
                const attached = attachedIdx !== -1;
                return (
                  <button
                    key={t.captureId}
                    type="button"
                    aria-pressed={attached}
                    onClick={() => {
                      togglePhoto(t.captureId);
                      onBlur();
                    }}
                    title={t.bodyText || "Attach photo"}
                    style={{
                      position: "relative", width: 64, height: 64, borderRadius: 9,
                      overflow: "hidden", flexShrink: 0, padding: 0, cursor: "pointer",
                      border: attached ? `2.5px solid ${acc}` : `1px solid ${T.border}`,
                      opacity: attached ? 1 : 0.75,
                      background: T.card,
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={captureMediaUrl(t.driveFileId)}
                      alt={t.bodyText || "Trace photo"}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                    {attached && (
                      <span
                        style={{
                          position: "absolute", top: 3, right: 3, width: 16, height: 16,
                          borderRadius: "50%", background: acc, color: "#fff",
                          fontFamily: FONT.grotesk, fontSize: 9, fontWeight: 700,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        {attachedIdx + 1}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {photoTraces.length > visiblePhotos.length || showAllPhotos ? (
              <button
                type="button"
                onClick={() => setShowAllPhotos((v) => !v)}
                style={{
                  fontFamily: FONT.grotesk, fontSize: 9.5, fontWeight: 700,
                  letterSpacing: "0.1em", textTransform: "uppercase",
                  background: "none", border: "none", cursor: "pointer",
                  color: T.teal, padding: "6px 0 0",
                }}
              >
                {showAllPhotos ? "Show this chapter's photos" : "Show all trip photos"}
              </button>
            ) : null}
          </>
        )}
      </Field>

      {/* Voice/ambient from real traces */}
      <Field label="Audio note" hint="— one voice or ambient trace">
        {voiceTraces.length === 0 ? (
          <p style={{ fontFamily: FONT.dm, fontSize: 12.5, fontStyle: "italic", color: T.muted, margin: 0 }}>
            No voice traces yet.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {voiceTraces.filter((t) => showAllPhotos || matchesChapter(t) || entry.audioCaptureId === t.captureId).map((t) => {
              const attached = entry.audioCaptureId === t.captureId;
              return (
                <button
                  key={t.captureId}
                  type="button"
                  onClick={() => {
                    onPatch({ audioCaptureId: attached ? undefined : t.captureId });
                    onBlur();
                  }}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, textAlign: "left",
                    padding: "9px 12px", borderRadius: 10, cursor: "pointer",
                    background: T.card,
                    border: attached ? `1.5px solid ${T.purple}` : `1px solid ${T.border}`,
                  }}
                >
                  <span style={{ fontFamily: FONT.grotesk, fontSize: 8, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#fff", background: T.purple, padding: "0.25em 0.6em", borderRadius: 3 }}>
                    Audio
                  </span>
                  <span style={{ fontFamily: FONT.dm, fontSize: 12.5, color: T.ink, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {t.bodyText || new Date(t.createdAt).toLocaleDateString()}
                  </span>
                  <span style={{ fontFamily: FONT.grotesk, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: attached ? T.purple : T.dim }}>
                    {attached ? "✓ Attached" : "Attach"}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </Field>

      {/* Daily pages */}
      <Field label="Daily pages" hint="— optional loose inserts, tucked after this chapter">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {dailies.map((d) => (
            <div key={d.chapterId} style={{ padding: "11px 13px", borderRadius: 10, background: T.card, border: `1px solid ${T.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontFamily: FONT.grotesk, fontSize: 8.5, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: accentHex(spine.accent) }}>
                  ◈ Daily page
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveDaily(d.chapterId)}
                  aria-label="Remove daily page"
                  style={{ background: "none", border: "none", cursor: "pointer", color: T.muted, fontSize: 14, padding: 2 }}
                >
                  ×
                </button>
              </div>
              <input
                type="text"
                value={d.title}
                onChange={(e) => onPatchDaily(d.chapterId, { title: e.target.value })}
                onBlur={onBlur}
                placeholder="A title — “Castle hill, 7am”"
                style={{ ...inputStyle, marginBottom: 8 }}
              />
              <textarea
                value={d.response}
                onChange={(e) => onPatchDaily(d.chapterId, { response: e.target.value })}
                onBlur={onBlur}
                placeholder="The thing you can't not write…"
                rows={2}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={onAddDaily}
            style={{
              fontFamily: FONT.grotesk, fontSize: 10, fontWeight: 700,
              letterSpacing: "0.08em", textTransform: "uppercase",
              border: `1.5px dashed ${T.border}`, cursor: "pointer",
              background: "transparent", color: T.muted,
              padding: "10px 16px", borderRadius: 9, textAlign: "center",
            }}
          >
            + Add a daily page
          </button>
        </div>
      </Field>
    </section>
  );
}

// ── Preview (Face 3 of the mockup) ────────────────────────────────────────────

function PreviewFace({
  draft,
  chapters,
  traces,
  asId,
}: {
  draft: JourneyDraft;
  chapters: ComposerChapter[];
  traces: ComposerTrace[];
  asId?: string;
}) {
  const traceById = useMemo(() => new Map(traces.map((t) => [t.captureId, t])), [traces]);

  function firstPhotoUrl(ch: JourneyDraftChapter): string {
    const fromTrace = ch.photoCaptureIds
      .map((id) => traceById.get(id)?.driveFileId)
      .filter(Boolean)[0];
    if (fromTrace) return captureMediaUrl(fromTrace);
    return ch.photoUrls?.[0] ?? "";
  }

  return (
    <div>
      {/* Private banner */}
      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 14px", borderRadius: 8, background: T.black, border: `1px solid ${T.border}`, marginBottom: 14 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.pink, display: "inline-block" }} />
        <span style={{ fontFamily: FONT.grotesk, fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: T.yellow }}>
          Draft · Private · Not published
        </span>
      </div>

      <div style={{ background: T.paper, borderRadius: 16, border: `1px solid ${T.border}`, overflow: "hidden" }}>
        {draft.chapters.map((ch) => {
          const readiness = chapterReadiness(ch);
          if (ch.kind === "daily") {
            if (readiness === "empty") return null;
            const acc = ch.accent ? accentHex(ch.accent as ItineraryAccent) : T.pink;
            return (
              <div key={ch.chapterId} style={{ margin: "10px 16px", padding: "12px 14px", borderRadius: 10, border: `1px solid ${T.border}`, background: T.card }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontFamily: FONT.grotesk, fontSize: 8, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: acc }}>
                    ◈ Daily page{ch.title ? ` · ${ch.title}` : ""}
                  </span>
                  <span style={{ fontFamily: FONT.grotesk, fontSize: 7.5, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: T.pink }}>
                    Draft
                  </span>
                </div>
                <p style={{ fontFamily: FONT.dm, fontStyle: "italic", fontSize: 12.5, color: T.ink, opacity: 0.85, margin: 0, lineHeight: 1.5 }}>
                  “{ch.response}”
                </p>
              </div>
            );
          }

          const spine = chapters.find((c) => c.id === ch.chapterId);
          const acc = spine ? accentHex(spine.accent) : T.teal;
          if (readiness === "empty") {
            // Ghost page — the passport holds the slot, the page is blank.
            return (
              <div key={ch.chapterId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", opacity: 0.32, borderTop: `1px solid ${T.sep}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 28, height: 28, borderRadius: "50%", background: T.sep, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT.anton, fontSize: 13, color: T.muted }}>
                    {ch.num}
                  </span>
                  <span style={{ fontFamily: FONT.grotesk, fontSize: 9.5, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: T.muted }}>
                    {ch.title || spine?.title}
                  </span>
                </div>
                <span style={{ fontFamily: FONT.grotesk, fontSize: 8, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: T.muted }}>
                  Not started
                </span>
              </div>
            );
          }

          const photo = firstPhotoUrl(ch);
          return (
            <div key={ch.chapterId} style={{ borderTop: `1px solid ${T.sep}` }}>
              <div style={{ position: "relative", height: 150, overflow: "hidden", background: `${acc}18` }}>
                {photo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photo} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.7 }} />
                )}
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(14,10,19,0.05) 25%, rgba(14,10,19,0.88) 100%)" }} />
                <div style={{ position: "absolute", left: 14, top: 12, display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ fontFamily: FONT.grotesk, fontSize: 8, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#fff", background: acc, padding: "0.25em 0.6em", borderRadius: 3 }}>
                    Ch {ch.num}
                  </span>
                  <span style={{ fontFamily: FONT.grotesk, fontSize: 8, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.75)" }}>
                    {spine?.verb ?? ch.title}
                  </span>
                </div>
                <span style={{ position: "absolute", top: 12, right: 12, fontFamily: FONT.grotesk, fontSize: 7.5, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#fff", background: T.pink, padding: "0.25em 0.6em", borderRadius: 3 }}>
                  Draft · Private
                </span>
                {ch.response ? (
                  <p style={{ position: "absolute", left: 14, right: 14, bottom: 10, fontFamily: FONT.anton, fontSize: 17, textTransform: "uppercase", color: "#fff", margin: 0, lineHeight: 1.05 }}>
                    {ch.response}
                  </p>
                ) : (
                  <p style={{ position: "absolute", left: 14, right: 14, bottom: 10, fontFamily: FONT.dm, fontStyle: "italic", fontSize: 13, color: "rgba(255,255,255,0.5)", margin: 0 }}>
                    Response not yet written…
                  </p>
                )}
              </div>
              <div style={{ padding: "8px 14px" }}>
                <p style={{ fontFamily: FONT.grotesk, fontSize: 8.5, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: acc, margin: 0 }}>
                  {ch.location}{ch.dateLabel ? ` · ${ch.dateLabel}` : ""}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <p style={{ fontFamily: FONT.dm, fontStyle: "italic", fontSize: 12.5, color: T.muted, margin: "14px 2px 0", lineHeight: 1.5 }}>
        Only you can see this. Nothing is public until you stamp it in{" "}
        <Link href={asId ? `/field-kit/publish?asId=${encodeURIComponent(asId)}` : "/field-kit/publish"} style={{ color: T.yellow }}>
          Review &amp; publish
        </Link>
        .
      </p>
    </div>
  );
}

// ── Shared micro-components ───────────────────────────────────────────────────

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <p style={{ fontFamily: FONT.grotesk, fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: T.muted, margin: "0 0 7px" }}>
        {label}
        {hint && <span style={{ fontWeight: 400, letterSpacing: 0, textTransform: "none", color: T.dim }}> {hint}</span>}
      </p>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  fontFamily: FONT.dm,
  fontSize: 15,
  lineHeight: 1.5,
  color: T.ink,
  background: T.card,
  border: `1.5px solid ${T.border}`,
  borderRadius: 10,
  padding: "11px 13px",
};
