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
import { createPortal } from "react-dom";
import Link from "next/link";
import { T, FONT, accent as accentHex } from "@/components/field-kit/tokens";
import {
  chapterReadiness,
  CHAPTER_TOUCHABLE_FIELDS,
  draftToChapterBlocks,
  draftToPreviewCard,
  type ChapterTouchedField,
  type JourneyDraft,
  type JourneyDraftChapter,
} from "@/lib/journeyDraft";
import JourneyCardView, { type CardViewAlum, type CardEditHooks } from "@/components/journeys/JourneyCardView";
import {
  MAX_MORE_AUDIO_PER_CHAPTER,
  MAX_MORE_PHOTOS_PER_CHAPTER,
} from "@/lib/journeyCard";
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
  /** "in" for a chapter that names a real place; "for" for a pre-departure
   *  chapter that doesn't. Authored in the itinerary — see lib/composerSpine. */
  preposition: string;
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
    // Epoch, NOT now (same rule as the assembler's freshDraft): merely OPENING
    // the Composer is not an artist edit, and a fresh-init stamped "now" would
    // beat every assembled draft in last-write-wins forever. This is exactly
    // how a day-1 device draft clobbered the assembled cards on 2026-08-19.
    // updateDraft bumps updatedAt on the first real edit.
    updatedAt: new Date(0).toISOString(),
  };
}

/**
 * Reconcile with the current spine: a chapter added to the itinerary mid-trip
 * gains a slot (additive), and EMPTY chapters from retired spine ids — a draft
 * created against an older itinerary generation — are dropped, because they
 * render as blank duplicate pages next to their replacements. Anything the
 * artist actually wrote is kept forever, spine or no spine; dailies untouched.
 */
function reconcileWithSpine(draft: JourneyDraft, chapters: ComposerChapter[]): JourneyDraft {
  const spineIds = new Set(chapters.map((c) => c.id));
  const kept = draft.chapters.filter(
    (c) => c.kind !== "chapter" || spineIds.has(c.chapterId) || chapterReadiness(c) !== "empty"
  );
  const have = new Set(kept.filter((c) => c.kind === "chapter").map((c) => c.chapterId));
  const missing = chapters.filter((ch) => !have.has(ch.id));
  if (!missing.length && kept.length === draft.chapters.length) return draft;
  return { ...draft, chapters: [...kept, ...missing.map(chapterFromSpine)] };
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ComposerClient({
  programId,
  authorSlug,
  asId,
  program,
  chapters,
  traces,
  alum,
}: {
  programId: string;
  authorSlug: string;
  asId?: string;
  program: ProgramMeta;
  chapters: ComposerChapter[];
  traces: ComposerTrace[];
  alum: CardViewAlum;
}) {
  // Preview-first for EVERY entry (locked with Jesse 2026-08-19, §10-Q1):
  // "does this look like your trip?" only works when the first thing an artist
  // sees IS the real card. The editor stays one tap away.
  const [face, setFace] = useState<"editor" | "preview">("preview");
  const [draft, setDraft] = useState<JourneyDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeChapterId, setActiveChapterId] = useState<string>(chapters[0]?.id ?? "");
  const [syncState, setSyncState] = useState<DraftSyncState>("synced");
  // Live copy of the server trace snapshot — the "place unplaced captures" flow
  // re-files traces (PATCH chapterId) and this keeps every surface in step.
  const [traceList, setTraceList] = useState<ComposerTrace[]>(traces);
  // Overlay surfaces on the preview (Slice A/B).
  const [chooser, setChooser] = useState<{ chapterId: string; mode: "photos" | "voice" } | null>(null);
  const [textEdit, setTextEdit] = useState<{ chapterId: string; field: "response" | "body" } | null>(null);
  const [placeOpen, setPlaceOpen] = useState(false);
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

  // Every patch through here is an ARTIST edit, so the touched fields it names
  // are marked — the auto-assembler (Slice 7) never overwrites them again.
  const updateChapter = useCallback(
    (chapterId: string, patch: Partial<JourneyDraftChapter>) => {
      const touched = Object.keys(patch).filter((k): k is ChapterTouchedField =>
        (CHAPTER_TOUCHABLE_FIELDS as readonly string[]).includes(k)
      );
      updateDraft((d) => ({
        ...d,
        chapters: d.chapters.map((c) =>
          c.chapterId === chapterId
            ? {
                ...c,
                ...patch,
                ...(touched.length
                  ? {
                      touchedFields: Array.from(
                        new Set([...(c.touchedFields ?? []), ...touched])
                      ),
                    }
                  : {}),
              }
            : c
        ),
      }));
    },
    [updateDraft]
  );

  // ── Extras data (Slice B): what each chapter's captures offer ──
  const spineById = useMemo(() => new Map(chapters.map((c) => [c.id, c])), [chapters]);
  const chapterMatches = useCallback(
    (t: ComposerTrace, chapterId: string) => {
      if (t.chapterId === chapterId) return true;
      const sp = spineById.get(chapterId);
      return !!sp && sp.dayIds.includes(t.dayIndex);
    },
    [spineById]
  );
  const photoCandidates = useCallback(
    (chapterId: string) =>
      traceList.filter((t) => t.kind === "photo" && t.driveFileId && chapterMatches(t, chapterId)),
    [traceList, chapterMatches]
  );
  const voiceCandidates = useCallback(
    (chapterId: string) =>
      traceList.filter((t) => t.kind === "voice" && t.driveFileId && chapterMatches(t, chapterId)),
    [traceList, chapterMatches]
  );

  // Re-file an unplaced capture under the chapter the artist tapped — the
  // existing trace-mutation path (PATCH), then keep every surface in step.
  // Photos also land in the draft immediately (optimistic, NOT touched — same
  // §10-Q7 rule as the camera-roll invitation).
  const placeCapture = useCallback(
    async (captureId: string, chapterId: string) => {
      const res = await fetch(
        `/api/field-kit/capture/${encodeURIComponent(captureId)}${asId ? `?asId=${encodeURIComponent(asId)}` : ""}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chapterId }),
        }
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Couldn't place that capture — try again.");
      }
      const placed = traceList.find((t) => t.captureId === captureId);
      setTraceList((prev) => prev.map((t) => (t.captureId === captureId ? { ...t, chapterId } : t)));
      if (placed?.kind === "photo") {
        updateDraft((d) => ({
          ...d,
          chapters: d.chapters.map((c) =>
            c.kind === "chapter" && c.chapterId === chapterId && !c.photoCaptureIds.includes(captureId)
              ? { ...c, photoCaptureIds: [...c.photoCaptureIds, captureId] }
              : c
          ),
        }));
      }
    },
    [asId, traceList, updateDraft]
  );

  // The preview's light edit affordances (Slice A/B) — prompts appear ONLY when
  // extras exist; an artist who never over-captured sees zero prompts.
  const editHooks: CardEditHooks = useMemo(
    () => ({
      photoPrompt: (ch) => {
        if (ch.kind !== "chapter") return null;
        const n = photoCandidates(ch.chapterId).length;
        const entry = draft?.chapters.find((c) => c.kind === "chapter" && c.chapterId === ch.chapterId);
        const featured = entry?.photoCaptureIds.length ?? 0;
        // Extras exist (over the featured cap), or captures exist but none are
        // on the page yet — both deserve the chooser. Otherwise: no prompt.
        if (n > MAX_PHOTOS_PER_CHAPTER) {
          return `${n} photos here — ${featured === 1 ? "1 is" : `${featured} are`} featured`;
        }
        if (n > 0 && featured === 0) {
          return `${n === 1 ? "1 photo" : `${n} photos`} from these days — none on the card yet`;
        }
        return null;
      },
      voicePrompt: (ch) => {
        if (ch.kind !== "chapter") return null;
        const n = voiceCandidates(ch.chapterId).length;
        if (n < 2) return null;
        const entry = draft?.chapters.find((c) => c.kind === "chapter" && c.chapterId === ch.chapterId);
        return `${n} voice notes — ${entry?.audioCaptureId ? "this one's on the card" : "none on the card yet"}`;
      },
      onChoosePhotos: (chapterId) => setChooser({ chapterId, mode: "photos" }),
      onChooseVoice: (chapterId) => setChooser({ chapterId, mode: "voice" }),
      onEditText: (chapterId, field) => setTextEdit({ chapterId, field }),
      onAddPhoto: (chapterId) => {
        flush();
        const qs = new URLSearchParams({ kind: "photo", chapterId });
        if (asId) qs.set("asId", asId);
        window.location.href = `/field-kit/capture?${qs.toString()}`;
      },
    }),
    [draft, photoCandidates, voiceCandidates, asId, flush]
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
          <UnsortedNote chapters={chapters} traces={traceList} onPlace={() => setPlaceOpen(true)} />

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
              traces={traceList}
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

          {/* The old strip-list preview lives on as the editor's structural
              overview — good at showing the whole card's state at a glance;
              tapping a chapter strip jumps the editor to it. */}
          <CardOverview
            draft={draft}
            chapters={chapters}
            traces={traceList}
            onSelect={(chapterId) => {
              flush();
              setActiveChapterId(chapterId);
            }}
          />
        </>
      ) : (
        <>
          <UnsortedNote chapters={chapters} traces={traceList} onPlace={() => setPlaceOpen(true)} />
          <PreviewFace draft={draft} traces={traceList} alum={alum} asId={asId} editHooks={editHooks} />
        </>
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
            Publish this card →
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

      {/* ── Overlay surfaces (Slice B) ── */}
      {chooser && (
        <ExtrasChooser
          mode={chooser.mode}
          entry={draft.chapters.find((c) => c.kind === "chapter" && c.chapterId === chooser.chapterId)}
          spine={spineById.get(chooser.chapterId)}
          candidates={chooser.mode === "photos" ? photoCandidates(chooser.chapterId) : voiceCandidates(chooser.chapterId)}
          onSave={(patch) => {
            updateChapter(chooser.chapterId, patch);
            flush();
            setChooser(null);
          }}
          onClose={() => setChooser(null)}
        />
      )}
      {textEdit && (
        <TextEditSheet
          entry={draft.chapters.find((c) => c.chapterId === textEdit.chapterId)}
          field={textEdit.field}
          onSave={(value) => {
            updateChapter(textEdit.chapterId, { [textEdit.field]: value });
            flush();
            setTextEdit(null);
          }}
          onClose={() => setTextEdit(null)}
        />
      )}
      {placeOpen && (
        <PlaceCapturesSheet
          chapters={chapters}
          traces={traceList}
          onPlace={placeCapture}
          onClose={() => setPlaceOpen(false)}
        />
      )}
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

  // Slice 7 affordance: a filled field the artist hasn't edited was built from
  // their captures by the auto-assembler — say so, so nothing feels sprung.
  const isAuto = (field: ChapterTouchedField, hasValue: boolean) =>
    hasValue && !(entry.touchedFields ?? []).includes(field);

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
          {spine.verb}{" "}
          <span style={{ color: acc }}>
            {spine.preposition || "in"} {spine.place}
          </span>
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
      <Field
        label="Response line"
        hint="— one sentence; it headlines this chapter"
        auto={isAuto("response", !!entry.response)}
      >
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
      <Field label="Your response" auto={isAuto("body", !!entry.body)}>
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
        auto={isAuto("photoCaptureIds", entry.photoCaptureIds.length > 0)}
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
      <Field
        label="Audio note"
        hint="— one voice or ambient trace"
        auto={isAuto("audioCaptureId", !!entry.audioCaptureId)}
      >
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
              {/* §10-Q9 (locked 2026-08-19): dailies are PRIVATE unless the
                  artist opts each one onto the card — and the label says
                  plainly what that means. */}
              <label style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 10, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={!!d.dailyPublic}
                  onChange={(e) => {
                    onPatchDaily(d.chapterId, { dailyPublic: e.target.checked || undefined });
                    onBlur();
                  }}
                  style={{ marginTop: 2 }}
                />
                <span style={{ fontFamily: FONT.dm, fontSize: 12, color: T.ink, lineHeight: 1.4 }}>
                  Include this daily page on my public card
                  <span style={{ display: "block", fontSize: 10.5, color: T.muted, fontStyle: "italic" }}>
                    Anyone can read it once you publish. Unchecked, it stays in your private journal.
                  </span>
                </span>
              </label>
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

// ── Preview (Face 3) — the REAL card, fed by the draft ────────────────────────
// The preview mounts the actual public renderer (JourneyCardView, embedded)
// through the SAME draft→blocks mapping the publish stamp uses
// (draftToChapterBlocks → draftToPreviewCard), with photo/audio refs resolved
// to the PRIVATE capture-media URLs since nothing is promoted yet. One source
// of truth: preview and published output cannot drift.

function PreviewFace({
  draft,
  traces,
  alum,
  asId,
  editHooks,
}: {
  draft: JourneyDraft;
  traces: ComposerTrace[];
  alum: CardViewAlum;
  asId?: string;
  editHooks?: CardEditHooks;
}) {
  const traceById = useMemo(() => new Map(traces.map((t) => [t.captureId, t])), [traces]);

  const card = useMemo(() => {
    const mediaUrl = (id?: string): string => {
      const fileId = id ? traceById.get(id)?.driveFileId : "";
      return fileId ? captureMediaUrl(fileId) : "";
    };
    const blocks = draftToChapterBlocks(
      draft,
      (ch) => ch.photoCaptureIds.map(mediaUrl).filter(Boolean),
      (ch) => mediaUrl(ch.audioCaptureId) || undefined,
      (ch) => (ch.morePhotoCaptureIds ?? []).map(mediaUrl).filter(Boolean),
      (ch) => (ch.moreAudioCaptureIds ?? []).map(mediaUrl).filter(Boolean)
    );
    const heroUrl = mediaUrl(draft.heroCaptureId) || draft.heroUrl || "";
    return draftToPreviewCard(draft, blocks, heroUrl);
  }, [draft, traceById]);

  return (
    <div>
      {/* Persistent Draft·Private ribbon */}
      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 14px", borderRadius: 8, background: T.black, border: `1px solid ${T.border}`, marginBottom: 14 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.pink, display: "inline-block" }} />
        <span style={{ fontFamily: FONT.grotesk, fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: T.yellow }}>
          Draft · Private · Not published
        </span>
      </div>

      <JourneyCardView card={card} alum={alum} embedded editHooks={editHooks} />

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

// ── Structural overview (the former strip-list preview, now in the editor) ────

function CardOverview({
  draft,
  chapters,
  traces,
  onSelect,
}: {
  draft: JourneyDraft;
  chapters: ComposerChapter[];
  traces: ComposerTrace[];
  onSelect: (chapterId: string) => void;
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
    <div style={{ marginTop: 26 }}>
      <p style={{ fontFamily: FONT.grotesk, fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: T.muted, margin: "0 0 8px" }}>
        Card overview
        <span style={{ fontWeight: 400, letterSpacing: 0, textTransform: "none", color: T.dim }}> — the whole card at a glance; tap a chapter to edit it</span>
      </p>

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
              <div key={ch.chapterId} onClick={() => onSelect(ch.chapterId)}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", opacity: 0.32, borderTop: `1px solid ${T.sep}`, cursor: "pointer" }}>
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
            <div key={ch.chapterId} onClick={() => onSelect(ch.chapterId)} style={{ borderTop: `1px solid ${T.sep}`, cursor: "pointer" }}>
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
    </div>
  );
}

// ── Shared micro-components ───────────────────────────────────────────────────

function Field({
  label,
  hint,
  auto,
  children,
}: {
  label: string;
  hint?: string;
  /** Slice 7: field is filled but machine-built (auto-assembled, not yet edited). */
  auto?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 18 }}>
      <p style={{ fontFamily: FONT.grotesk, fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: T.muted, margin: "0 0 7px" }}>
        {label}
        {auto && (
          <span
            style={{
              fontSize: 8, fontWeight: 700, letterSpacing: "0.12em",
              color: T.black, background: T.yellow, borderRadius: 4,
              padding: "0.2em 0.55em", marginLeft: 7, verticalAlign: "middle",
            }}
          >
            ✦ Built from your captures
          </span>
        )}
        {hint && <span style={{ fontWeight: 400, letterSpacing: 0, textTransform: "none", color: T.dim }}> {hint}</span>}
      </p>
      {children}
    </div>
  );
}

/**
 * Slice 7 — captures with a blank/unknown chapterId are held aside by the
 * auto-assembler, never silently dropped. Slice B makes the note actionable:
 * "Place them" opens the placement sheet (tap a chapter for each capture).
 */
function UnsortedNote({
  chapters,
  traces,
  onPlace,
}: {
  chapters: ComposerChapter[];
  traces: ComposerTrace[];
  onPlace?: () => void;
}) {
  const count = useMemo(() => {
    const spineIds = new Set(chapters.map((c) => c.id));
    return traces.filter((t) => !spineIds.has(t.chapterId.trim())).length;
  }, [chapters, traces]);
  if (!count) return null;
  return (
    <p style={{ fontFamily: FONT.dm, fontStyle: "italic", fontSize: 12, color: T.muted, margin: "0 0 12px" }}>
      {count === 1 ? "1 capture isn't" : `${count} captures aren't`} placed in a chapter — nothing is
      lost.{" "}
      {onPlace ? (
        <button
          type="button"
          onClick={onPlace}
          style={{
            fontFamily: FONT.grotesk, fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em",
            textTransform: "uppercase", background: "none", border: "none", cursor: "pointer",
            color: T.yellow, padding: 0,
          }}
        >
          Place {count === 1 ? "it" : "them"} →
        </button>
      ) : (
        <>find {count === 1 ? "it" : "them"} under “Show all trip photos” or in your Traces.</>
      )}
    </p>
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

// ── Extras chooser (Slice B — "the system proposes, the artist disposes") ─────
// Full-screen (locked 2026-08-19, §10-Q4). Three tiers per item:
//   Featured (photos ≤5 / voice 1) → the chapter page's main layout;
//   On the card (photos ≤7 / voices ≤4) → public, behind "+N more"/"Hear more";
//   Private → never leaves the capture store.
// Tapping an item cycles its tier (respecting caps). Saving writes the tiers
// through updateChapter, which marks the fields touched — the artist's choice
// is theirs forever; the auto-assembler never overrides it.

const sheetOverlay: React.CSSProperties = {
  position: "fixed", inset: 0, zIndex: 300, background: "rgba(10,7,12,0.96)",
  display: "flex", flexDirection: "column",
  // Safe-area aware: content must clear the notch/status bar and the home bar.
  padding:
    "max(18px, env(safe-area-inset-top)) clamp(14px, 4vw, 32px) max(20px, env(safe-area-inset-bottom))",
  overflowY: "auto",
};

// Every sheet renders through a PORTAL to <body>: position:fixed is computed
// against the nearest transformed/filtered ancestor, and inside the app shell
// that produced sheets anchored to the wrong box ("too high", overlapping the
// page). The body has no transforms, so the overlay always fills the viewport.
function SheetPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}

function SheetHeader({ title, sub, onClose }: { title: string; sub?: string; onClose: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
      <div>
        <p style={{ fontFamily: FONT.anton, fontSize: 22, textTransform: "uppercase", color: "#f2f2f2", margin: "0 0 4px", lineHeight: 1 }}>{title}</p>
        {sub && <p style={{ fontFamily: FONT.dm, fontSize: 12.5, color: "rgba(242,242,242,0.6)", margin: 0, lineHeight: 1.45 }}>{sub}</p>}
      </div>
      <button type="button" onClick={onClose} aria-label="Close"
        style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 8, color: "#f2f2f2", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: "6px 12px", flexShrink: 0 }}>
        ×
      </button>
    </div>
  );
}

type ExtrasTier = "featured" | "also" | "private";

function ExtrasChooser({
  mode,
  entry,
  spine,
  candidates,
  onSave,
  onClose,
}: {
  mode: "photos" | "voice";
  entry?: JourneyDraftChapter;
  spine?: ComposerChapter;
  candidates: ComposerTrace[];
  onSave: (patch: Partial<JourneyDraftChapter>) => void;
  onClose: () => void;
}) {
  const FEAT_CAP = mode === "photos" ? MAX_PHOTOS_PER_CHAPTER : 1;
  const ALSO_CAP = mode === "photos" ? MAX_MORE_PHOTOS_PER_CHAPTER : MAX_MORE_AUDIO_PER_CHAPTER;

  // One state object + functional updates: caps hold even under rapid taps
  // (separate list states would read stale closures and overfill a tier).
  const [sel, setSel] = useState<{ featured: string[]; also: string[] }>(() => ({
    featured:
      mode === "photos"
        ? [...(entry?.photoCaptureIds ?? [])]
        : entry?.audioCaptureId ? [entry.audioCaptureId] : [],
    also: mode === "photos" ? [...(entry?.morePhotoCaptureIds ?? [])] : [...(entry?.moreAudioCaptureIds ?? [])],
  }));
  const { featured, also } = sel;

  // Every candidate plus anything already selected (even if it no longer
  // matches the chapter's days), chronological, deduped.
  const items = useMemo(() => {
    const byId = new Map(candidates.map((t) => [t.captureId, t]));
    const list = [...candidates].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return list.filter((t, i, a) => a.findIndex((x) => x.captureId === t.captureId) === i && byId.has(t.captureId));
  }, [candidates]);

  if (!entry) return null;

  const tierOf = (id: string): ExtrasTier =>
    featured.includes(id) ? "featured" : also.includes(id) ? "also" : "private";

  // featured → also → private → featured, respecting caps (a full tier is
  // skipped; both full → stays private — the footer explains the caps plainly).
  function cycle(id: string) {
    setSel((s) => {
      if (s.featured.includes(id)) {
        const nextFeatured = s.featured.filter((x) => x !== id);
        return s.also.length < ALSO_CAP
          ? { featured: nextFeatured, also: [...s.also, id] }
          : { featured: nextFeatured, also: s.also };
      }
      if (s.also.includes(id)) {
        return { featured: s.featured, also: s.also.filter((x) => x !== id) };
      }
      if (s.featured.length < FEAT_CAP) return { featured: [...s.featured, id], also: s.also };
      if (s.also.length < ALSO_CAP) return { featured: s.featured, also: [...s.also, id] };
      return s;
    });
  }

  const tierLabel = (t: ExtrasTier) =>
    t === "featured" ? "★ Featured" : t === "also" ? "On the card" : "Private";
  const tierColor = (t: ExtrasTier) =>
    t === "featured" ? T.yellow : t === "also" ? T.teal : "rgba(242,242,242,0.35)";

  function save() {
    if (mode === "photos") {
      onSave({
        photoCaptureIds: featured,
        morePhotoCaptureIds: also.length ? also : undefined,
      });
    } else {
      onSave({
        audioCaptureId: featured[0],
        moreAudioCaptureIds: also.length ? also : undefined,
      });
    }
  }

  const chapterLabel = spine ? `${String(spine.num).padStart(2, "0")} · ${spine.verb} ${spine.preposition || "in"} ${spine.place}` : entry.title;

  return (
    <SheetPortal>
    <div role="dialog" aria-modal="true" style={sheetOverlay}>
      <SheetHeader
        title={mode === "photos" ? "Choose photos" : "Choose voice notes"}
        sub={`${chapterLabel} — tap to move between Featured, On the card, and Private. Nothing is ever lost; Private just stays yours.`}
        onClose={onClose}
      />

      {mode === "photos" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(104px, 1fr))", gap: 8 }}>
          {items.map((t) => {
            const tier = tierOf(t.captureId);
            return (
              <button key={t.captureId} type="button" onClick={() => cycle(t.captureId)}
                title={t.bodyText || undefined}
                style={{
                  position: "relative", aspectRatio: "1 / 1", borderRadius: 10, overflow: "hidden",
                  padding: 0, cursor: "pointer", background: T.card,
                  border: `2.5px solid ${tier === "private" ? T.border : tierColor(tier)}`,
                  opacity: tier === "private" ? 0.55 : 1,
                }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={captureMediaUrl(t.driveFileId)} alt={t.bodyText || "Photo"} loading="lazy"
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                <span style={{
                  position: "absolute", left: 4, bottom: 4, fontFamily: FONT.grotesk, fontSize: 8,
                  fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                  color: tier === "featured" ? T.black : "#fff",
                  background: tier === "featured" ? T.yellow : "rgba(10,7,12,0.72)",
                  padding: "0.3em 0.6em", borderRadius: 4,
                }}>
                  {tier === "featured" ? `★ ${featured.indexOf(t.captureId) + 1}` : tierLabel(tier)}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {items.map((t) => {
            const tier = tierOf(t.captureId);
            return (
              <button key={t.captureId} type="button" onClick={() => cycle(t.captureId)}
                style={{
                  display: "flex", alignItems: "center", gap: 10, textAlign: "left",
                  padding: "11px 13px", borderRadius: 10, cursor: "pointer", background: T.card,
                  border: `1.5px solid ${tier === "private" ? T.border : tierColor(tier)}`,
                  opacity: tier === "private" ? 0.6 : 1,
                }}>
                <span style={{ fontFamily: FONT.grotesk, fontSize: 8, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#fff", background: T.purple, padding: "0.25em 0.6em", borderRadius: 3, flexShrink: 0 }}>
                  Audio
                </span>
                <span style={{ fontFamily: FONT.dm, fontSize: 12.5, color: T.ink, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {t.bodyText || new Date(t.createdAt).toLocaleString()}
                </span>
                <span style={{ fontFamily: FONT.grotesk, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: tierColor(tier), flexShrink: 0 }}>
                  {tierLabel(tier)}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <p style={{ fontFamily: FONT.dm, fontSize: 11.5, fontStyle: "italic", color: "rgba(242,242,242,0.55)", margin: "14px 0 0", lineHeight: 1.5 }}>
        {mode === "photos"
          ? `Featured (up to ${FEAT_CAP}) lead the page; “On the card” (up to ${ALSO_CAP} more) show behind “+N more”. Anything past that stays private — nothing is lost.`
          : `One featured voice plays on the page; “On the card” (up to ${ALSO_CAP} more) sit behind “Hear more”. The rest stay private.`}
      </p>

      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button type="button" onClick={save}
          style={{ fontFamily: FONT.grotesk, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", background: T.yellow, color: T.black, border: "none", borderRadius: 8, padding: "11px 22px", cursor: "pointer" }}>
          Use these
        </button>
        <button type="button" onClick={onClose}
          style={{ fontFamily: FONT.grotesk, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", background: "transparent", color: "rgba(242,242,242,0.7)", border: `1px solid ${T.border}`, borderRadius: 8, padding: "11px 18px", cursor: "pointer" }}>
          Cancel
        </button>
      </div>
    </div>
    </SheetPortal>
  );
}

// ── One-textarea edit sheet (Slice A: "tap a text block") ─────────────────────

function TextEditSheet({
  entry,
  field,
  onSave,
  onClose,
}: {
  entry?: JourneyDraftChapter;
  field: "response" | "body";
  onSave: (value: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(entry?.[field] ?? "");
  if (!entry) return null;
  const isResponse = field === "response";
  return (
    <SheetPortal>
    <div role="dialog" aria-modal="true" style={sheetOverlay}>
      <SheetHeader
        title={isResponse ? "This chapter’s line" : "Your words"}
        sub={
          isResponse
            ? "One sentence — it headlines the chapter. Yours forever once you save."
            : "The chapter’s longer text. Yours forever once you save."
        }
        onClose={onClose}
      />
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={isResponse ? 3 : 9}
        autoFocus
        placeholder={isResponse ? "One sentence. The line that makes the reader feel it." : "Write toward the prompt or past it…"}
        style={{ ...inputStyle, resize: "vertical" }}
      />
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button type="button" onClick={() => onSave(value.trim())}
          style={{ fontFamily: FONT.grotesk, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", background: T.yellow, color: T.black, border: "none", borderRadius: 8, padding: "11px 22px", cursor: "pointer" }}>
          Save
        </button>
        <button type="button" onClick={onClose}
          style={{ fontFamily: FONT.grotesk, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", background: "transparent", color: "rgba(242,242,242,0.7)", border: `1px solid ${T.border}`, borderRadius: 8, padding: "11px 18px", cursor: "pointer" }}>
          Cancel
        </button>
      </div>
    </div>
    </SheetPortal>
  );
}

// ── Place unplaced captures (Slice B: the actionable UnsortedNote) ────────────
// The artist taps a chapter for each unplaced capture; the choice writes
// through the trace-mutation path (PATCH chapterId). Or they leave it off the
// card — nothing is invented, nothing silently dropped.

function PlaceCapturesSheet({
  chapters,
  traces,
  onPlace,
  onClose,
}: {
  chapters: ComposerChapter[];
  traces: ComposerTrace[];
  onPlace: (captureId: string, chapterId: string) => Promise<void>;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const spineIds = useMemo(() => new Set(chapters.map((c) => c.id)), [chapters]);
  const unplaced = traces.filter((t) => !spineIds.has(t.chapterId.trim()));

  async function place(captureId: string, chapterId: string) {
    setBusy(captureId);
    setError(null);
    try {
      await onPlace(captureId, chapterId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't place that capture — try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <SheetPortal>
    <div role="dialog" aria-modal="true" style={sheetOverlay}>
      <SheetHeader
        title="Place your captures"
        sub="These aren't in a chapter yet. Tap the chapter each one belongs to — or leave it; nothing is lost either way."
        onClose={onClose}
      />
      {error && (
        <p style={{ fontFamily: FONT.dm, fontSize: 12.5, color: T.pink, margin: "0 0 10px" }}>{error}</p>
      )}
      {unplaced.length === 0 ? (
        <p style={{ fontFamily: FONT.dm, fontSize: 13, fontStyle: "italic", color: "rgba(242,242,242,0.65)", margin: 0 }}>
          Everything is placed. ✓
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {unplaced.map((t) => (
            <div key={t.captureId} style={{ padding: "12px 13px", borderRadius: 12, background: T.card, border: `1px solid ${T.border}`, opacity: busy === t.captureId ? 0.55 : 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                {t.kind === "photo" && t.driveFileId ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={captureMediaUrl(t.driveFileId)} alt="" loading="lazy"
                    style={{ width: 52, height: 52, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                ) : (
                  <span style={{ fontFamily: FONT.grotesk, fontSize: 8, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#fff", background: t.kind === "voice" ? T.purple : T.teal, padding: "0.3em 0.7em", borderRadius: 3, flexShrink: 0 }}>
                    {t.kind}
                  </span>
                )}
                <span style={{ fontFamily: FONT.dm, fontSize: 12.5, color: T.ink, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {t.bodyText || new Date(t.createdAt).toLocaleString()}
                </span>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {chapters.map((ch) => (
                  <button key={ch.id} type="button" disabled={busy === t.captureId}
                    onClick={() => void place(t.captureId, ch.id)}
                    style={{
                      fontFamily: FONT.grotesk, fontSize: 9.5, fontWeight: 700, letterSpacing: "0.08em",
                      textTransform: "uppercase", cursor: "pointer", padding: "6px 10px", borderRadius: 7,
                      border: `1px solid ${T.border}`, background: "transparent", color: T.muted,
                    }}>
                    {String(ch.num).padStart(2, "0")} · {ch.verb}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </SheetPortal>
  );
}
