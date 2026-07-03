// components/journey-card/RetroactiveClient.tsx
//
// Retroactive Journey Card builder (Slice 6) — production port of the approved
// mockup retroactive/RetroactiveJourneyCard.tsx. The artist arrives from
// memory: chooses a past program (only programs they were on — §4-R Q4),
// rebuilds a chapter spine (full CRUD; approximate is fine), adds memories
// (response lines, photos, archive-assist prompts), and stamps.
//
// Reuses the whole Slice 6 stack: the JourneyDraft store (kind "retro" —
// IndexedDB + server backup), the Q1 flatten, and the SAME extended
// /api/alumni/journey publish write the live Composer uses. Photos upload via
// /api/alumni/journey-card/upload (public URLs — no capture store to promote).
// Publish is the §4-R Q5 single idempotent append with a client-minted id;
// programId is the programMap slug and sortDate backdates to the trip (§4-R Q6).

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { T, FONT, STAMP_SHADOW } from "@/components/field-kit/tokens";
import {
  chapterReadiness,
  draftToChapterBlocks,
  flattenDraftForPublish,
  type JourneyDraft,
  type JourneyDraftChapter,
} from "@/lib/journeyDraft";
import {
  draftKey,
  loadDraft,
  pushDraft,
  saveDraftLocal,
  startDraftSync,
} from "@/lib/journeyDraftStore";
import { ulid } from "@/lib/ulid";
import type { RetroProgramOption } from "@/lib/retroJourneyAccess";

const STAMP_SRC = "/images/dat-logo7.svg";
const AUTOSAVE_DEBOUNCE_MS = 800;
const MAX_PHOTOS_PER_CHAPTER = 5;

// Sense-memory prompts, ported from the approved mockup's ARCHIVE_PROMPTS —
// designed to surface what an itinerary can't: the sensory, the relational,
// the still-unresolved.
const ARCHIVE_PROMPTS: string[] = [
  "Where did the work change — the moment when something unexpected happened in the room?",
  "Who was there? Name one person whose work or presence has stayed with you.",
  "What do you remember physically — a smell, a texture, a sound, a temperature?",
  "What image still lives in you from that trip?",
  "What did you bring back that you didn't pack?",
  "If you could write one sentence on a postcard to the person you were then, what would it say?",
];

// The starter spine. There is no archive-spine store yet, so these generic,
// memory-shaped slots seed the CRUD — keep what feels right, rename what
// doesn't, delete freely. "A card with two chapters and one photograph is a
// real card."
function starterChapters(p: RetroProgramOption): JourneyDraftChapter[] {
  const mk = (title: string, num: number): JourneyDraftChapter => ({
    chapterId: `custom-${ulid()}`,
    kind: "chapter",
    num: String(num).padStart(2, "0"),
    title,
    location: p.location,
    dateLabel: p.year,
    response: "",
    body: "",
    reflection: "",
    photoCaptureIds: [],
    photoUrls: [],
  });
  return [
    mk(`Arrive in ${p.location}`, 0),
    mk("The work", 1),
    mk("The people", 2),
    mk("What you carried home", 3),
  ];
}

function initRetroDraft(slug: string, p: RetroProgramOption): JourneyDraft {
  return {
    draftId: ulid(),
    kind: "retro",
    programId: p.programId,
    authorSlug: slug,
    program: p.program,
    location: p.location,
    country: p.country,
    year: p.year,
    dates: "",
    title: "",
    primaryRole: "",
    accent: "teal",
    pullQuote: "",
    chapters: starterChapters(p),
    updatedAt: new Date().toISOString(),
  };
}

function mintCardId(slug: string, p: RetroProgramOption): string {
  const base = [slug, p.program, p.country, p.year]
    .map((s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""))
    .filter(Boolean)
    .join("-");
  return `${base ? base + "-" : ""}${ulid().toLowerCase()}`;
}

type PublishState =
  | { step: "draft" }
  | { step: "publishing" }
  | { step: "failed"; error: string }
  | { step: "published"; cardId: string };

export default function RetroactiveClient({
  slug,
  asId,
  programs,
}: {
  slug: string;
  asId?: string;
  programs: RetroProgramOption[];
}) {
  const [program, setProgram] = useState<RetroProgramOption | null>(null);
  const [draft, setDraft] = useState<JourneyDraft | null>(null);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [state, setState] = useState<PublishState>({ step: "draft" });
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestDraft = useRef<JourneyDraft | null>(null);

  useEffect(() => {
    startDraftSync();
  }, []);

  async function selectProgram(p: RetroProgramOption) {
    setProgram(p);
    setState({ step: "draft" });
    setLoadingDraft(true);
    const loaded = await loadDraft("retro", p.programId, asId);
    const next = loaded ?? initRetroDraft(slug, p);
    latestDraft.current = next;
    setDraft(next);
    setLoadingDraft(false);
    if (!loaded) void saveDraftLocal(next);
  }

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

  const flush = useCallback(() => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    const d = latestDraft.current;
    if (d) void saveDraftLocal(d).then(() => void pushDraft(draftKey(d.kind, d.programId), asId));
  }, [asId]);

  useEffect(() => flush, [flush]);

  const patchChapter = useCallback(
    (chapterId: string, patch: Partial<JourneyDraftChapter>) => {
      updateDraft((d) => ({
        ...d,
        chapters: d.chapters.map((c) => (c.chapterId === chapterId ? { ...c, ...patch } : c)),
      }));
    },
    [updateDraft]
  );

  // ── Publish (single idempotent append; §4-R Q5/Q6) ──
  async function stamp() {
    if (!draft || !program || state.step === "publishing") return;

    // Mint + persist the card id BEFORE any network call, bypassing the
    // autosave debounce — if the id only lives in the debounce window, a
    // failed publish + reload would mint a second id and duplicate the card.
    let cardId = draft.publishedCardId;
    if (!cardId) {
      cardId = mintCardId(slug, program);
      const next = { ...draft, publishedCardId: cardId, updatedAt: new Date().toISOString() };
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
      latestDraft.current = next;
      setDraft(next);
      await saveDraftLocal(next);
    }

    setState({ step: "publishing" });
    try {
      // Retro photos are already public URLs — no promotion step.
      const blocks = draftToChapterBlocks(draft, () => []);
      const flat = flattenDraftForPublish(draft, blocks, draft.heroUrl || "");

      const res = await fetch("/api/alumni/journey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: cardId,
          profileSlug: slug,
          programId: program.programId, // programMap slug (§4-R Q6)
          program: program.program,
          location: program.location,
          country: program.country,
          year: program.year,
          title: draft.title,
          primaryRole: draft.primaryRole,
          accent: draft.accent,
          pullQuote: flat.pullQuote,
          heroUrl: flat.heroUrl,
          body: flat.body,
          mediaUrls: flat.mediaUrls,
          chapters: blocks,
          // Backdate so the card sorts with its trip, not with today.
          sortDate: program.startDate || `${program.year}-01-01`,
        }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; id?: string; error?: string }
        | null;
      if (!res.ok || !data?.ok) throw new Error(data?.error || "The publish didn't go through");

      flush();
      setState({ step: "published", cardId: data.id || cardId });
    } catch (e) {
      setState({
        step: "failed",
        error: e instanceof Error ? e.message : "The publish didn't go through",
      });
    }
  }

  const hasContent =
    (draft?.chapters ?? []).some((c) => chapterReadiness(c) !== "empty") || false;

  // ── Render ──
  return (
    <main style={{ maxWidth: 680, margin: "0 auto", padding: "44px clamp(16px, 5vw, 44px) 110px" }}>
      {/* Hero */}
      <p style={{ fontFamily: FONT.grotesk, fontWeight: 700, fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase", color: T.grape, margin: "0 0 10px" }}>
        Alum-only · Retroactive Journey Card
      </p>
      <h1 style={{ fontFamily: FONT.anton, fontSize: "clamp(32px, 6.5vw, 60px)", lineHeight: 0.93, textTransform: "uppercase", color: T.ink, margin: "0 0 16px" }}>
        Create a card<br />from a past journey.
      </h1>
      <p style={{ fontFamily: FONT.dm, fontStyle: "italic", fontSize: 15, lineHeight: 1.55, color: T.ink, opacity: 0.82, margin: "0 0 18px" }}>
        For DAT artists whose trips happened before the Companion existed. Exact dates, perfect
        documentation, and complete itineraries are not required — only what you still carry.
      </p>
      <div style={{ padding: "13px 16px", borderRadius: 10, background: T.card, border: `1px solid ${T.border}`, borderLeft: `3px solid ${T.grape}`, marginBottom: 30 }}>
        <p style={{ fontFamily: FONT.grotesk, fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: T.grape, margin: "0 0 5px" }}>Tips</p>
        <p style={{ fontFamily: FONT.dm, fontSize: 13.5, lineHeight: 1.6, color: T.ink, margin: 0 }}>
          Choose the journey that shaped you most. You&apos;ll get a starter chapter structure —
          keep what feels right, rename what doesn&apos;t, add anything it missed. Approximate years
          are fine. Unnamed locations are fine.{" "}
          <strong>A card with two chapters and one photograph is a real card.</strong>
        </p>
      </div>

      {/* Program selector */}
      <SectionLabel>Choose a past journey</SectionLabel>
      {programs.length === 0 ? (
        <p style={{ fontFamily: FONT.dm, fontSize: 14, lineHeight: 1.6, color: T.muted, margin: 0 }}>
          We couldn&apos;t find you on a past program&apos;s roster yet. If you traveled with DAT,
          reach out and we&apos;ll get your program connected.
        </p>
      ) : (
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", marginBottom: 8 }}>
          {programs.map((p) => {
            const on = program?.programId === p.programId;
            return (
              <button
                key={p.programId}
                type="button"
                onClick={() => void selectProgram(p)}
                style={{
                  textAlign: "left", cursor: "pointer", padding: "15px 16px", borderRadius: 12,
                  background: on ? T.black : T.card,
                  border: `1.5px solid ${on ? T.yellow : T.border}`,
                }}
              >
                <span style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <span style={{ fontFamily: FONT.grotesk, fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: on ? T.yellow : T.teal }}>
                    {p.label}
                  </span>
                  {on && (
                    <span style={{ fontFamily: FONT.grotesk, fontSize: 8, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: T.yellow }}>
                      Selected
                    </span>
                  )}
                </span>
                <span style={{ display: "block", fontFamily: FONT.dm, fontWeight: 700, fontSize: 14, color: T.ink, lineHeight: 1.25 }}>
                  {p.location} · {p.year}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {!program && programs.length > 0 && (
        <div style={{ marginTop: 16, padding: "20px 24px", borderRadius: 14, border: `1.5px dashed ${T.border}`, textAlign: "center" }}>
          <p style={{ fontFamily: FONT.dm, fontStyle: "italic", fontSize: 14, color: T.muted, margin: 0 }}>
            Select a past journey above to begin rebuilding your card.
          </p>
        </div>
      )}

      {loadingDraft && (
        <p style={{ fontFamily: FONT.grotesk, fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: T.muted, margin: "24px 0 0", textAlign: "center" }}>
          Opening your draft…
        </p>
      )}

      {program && draft && !loadingDraft && state.step !== "published" && (
        <>
          <Sep />
          {/* Spine CRUD */}
          <SectionLabel>Rebuild the spine</SectionLabel>
          <p style={{ fontFamily: FONT.dm, fontSize: 14, color: T.ink, opacity: 0.82, margin: "0 0 14px", lineHeight: 1.5 }}>
            Keep what feels right, rename what doesn&apos;t, and add anything we missed.{" "}
            <em style={{ color: T.muted }}>Approximate is fine.</em>
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
            {draft.chapters.map((ch, i) => (
              <SpineRow
                key={ch.chapterId}
                index={i}
                value={ch.title}
                onRename={(v) => patchChapter(ch.chapterId, { title: v })}
                onRemove={() =>
                  updateDraft((d) => ({
                    ...d,
                    chapters: d.chapters.filter((c) => c.chapterId !== ch.chapterId),
                  }))
                }
                onBlur={flush}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              updateDraft((d) => ({
                ...d,
                chapters: [
                  ...d.chapters,
                  {
                    chapterId: `custom-${ulid()}`,
                    kind: "chapter",
                    num: String(d.chapters.length).padStart(2, "0"),
                    title: "",
                    location: program.location,
                    dateLabel: program.year,
                    response: "",
                    body: "",
                    reflection: "",
                    photoCaptureIds: [],
                    photoUrls: [],
                  },
                ],
              }))
            }
            style={ghostBtn}
          >
            + Add a chapter
          </button>

          <Sep />
          {/* Memories */}
          <SectionLabel>Add memories</SectionLabel>
          <p style={{ fontFamily: FONT.dm, fontSize: 14, color: T.ink, opacity: 0.82, margin: "0 0 16px", lineHeight: 1.5 }}>
            Fill in what you remember. Response lines can be a single sentence. Dates can be
            approximate. <em style={{ color: T.muted }}>Leave anything blank you&apos;re not sure about — it can wait.</em>
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {draft.chapters.map((ch) => (
              <MemoryCard
                key={ch.chapterId}
                chapter={ch}
                programId={program.programId}
                asId={asId}
                onPatch={(patch) => patchChapter(ch.chapterId, patch)}
                onBlur={flush}
              />
            ))}
          </div>

          <Sep />
          {/* Archive assist */}
          <SectionLabel>Archive assist</SectionLabel>
          <p style={{ fontFamily: FONT.dm, fontSize: 14, color: T.ink, opacity: 0.82, margin: "0 0 16px", lineHeight: 1.5 }}>
            Prompts designed to surface what the itinerary can&apos;t — the sensory, the relational,
            the still-unresolved. Use any that feel useful. Skip the rest.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 8 }}>
            {ARCHIVE_PROMPTS.map((prompt) => (
              <div key={prompt} style={{ padding: "12px 15px", borderRadius: 10, background: T.card, border: `1px solid ${T.border}`, borderLeft: `3px solid ${T.grape}40` }}>
                <p style={{ fontFamily: FONT.grotesk, fontSize: 8.5, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: T.grape, margin: "0 0 5px" }}>» Prompt</p>
                <p style={{ fontFamily: FONT.dm, fontStyle: "italic", fontSize: 13.5, color: T.ink, margin: 0, lineHeight: 1.5 }}>{prompt}</p>
              </div>
            ))}
          </div>
          <p style={{ fontFamily: FONT.dm, fontStyle: "italic", fontSize: 12, color: T.muted, margin: "0 0 4px" }}>
            Write toward any of these in a chapter&apos;s memory field — or keep the answer for yourself.
          </p>

          <Sep />
          {/* Final picks + publish */}
          <SectionLabel>Publish path</SectionLabel>
          <div style={{ marginBottom: 12 }}>
            <FieldLabel>Card title <Hint>— optional</Hint></FieldLabel>
            <input
              type="text"
              value={draft.title}
              onChange={(e) => updateDraft((d) => ({ ...d, title: e.target.value }))}
              onBlur={flush}
              placeholder={program.label}
              style={inputStyle}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <FieldLabel>Your role on that trip <Hint>— e.g. Performer, Teaching Artist</Hint></FieldLabel>
            <input
              type="text"
              value={draft.primaryRole}
              onChange={(e) => updateDraft((d) => ({ ...d, primaryRole: e.target.value }))}
              onBlur={flush}
              placeholder="Teaching Artist"
              style={inputStyle}
            />
          </div>
          <PullQuotePicker draft={draft} updateDraft={updateDraft} />
          <HeroPicker draft={draft} updateDraft={updateDraft} />

          <div style={{ padding: "12px 16px", borderRadius: 10, border: `1.5px dashed ${T.border}`, margin: "16px 0 24px" }}>
            <p style={{ fontFamily: FONT.dm, fontStyle: "italic", fontSize: 13, color: T.muted, margin: 0, lineHeight: 1.5 }}>
              » You don&apos;t need to publish today. The draft saves on this device and backs up to
              your account — come back when it feels right. The card will wait.
            </p>
          </div>

          {/* Stamp */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "28px 24px", borderRadius: 16, background: T.card, border: `2px solid ${hasContent ? T.ink : T.border}`, textAlign: "center" }}>
            <div style={{ filter: hasContent ? STAMP_SHADOW : "none", opacity: hasContent ? 1 : 0.25 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={STAMP_SRC} alt="DAT stamp" width={76} height={76} />
            </div>
            <h2 style={{ fontFamily: FONT.anton, fontSize: "clamp(22px, 3.5vw, 32px)", textTransform: "uppercase", lineHeight: 0.95, color: hasContent ? T.ink : T.muted, margin: 0 }}>
              Stamp to publish.
            </h2>
            {state.step === "failed" && (
              <p style={{ fontFamily: FONT.dm, fontSize: 13, lineHeight: 1.5, color: T.pink, margin: 0, maxWidth: 380 }}>
                The publish didn&apos;t go through ({state.error}). Your draft is safe — try again
                when you&apos;re ready.
              </p>
            )}
            <p style={{ fontFamily: FONT.dm, fontSize: 13.5, color: T.ink, opacity: 0.78, margin: 0, maxWidth: 380, lineHeight: 1.5 }}>
              This sends your Journey Card to the index and your alumni profile, backdated to the
              year of your trip.
            </p>
            <button
              type="button"
              onClick={() => void stamp()}
              disabled={!hasContent || state.step === "publishing"}
              style={{
                ...primaryBtn,
                border: "none",
                cursor: hasContent ? "pointer" : "default",
                opacity: hasContent ? 1 : 0.45,
              }}
            >
              {state.step === "publishing" ? "Stamping…" : state.step === "failed" ? "Try again →" : "Stamp to publish →"}
            </button>
          </div>
        </>
      )}

      {state.step === "published" && program && (
        <>
          <Sep />
          <h2 style={{ fontFamily: FONT.anton, fontSize: "clamp(28px, 5vw, 44px)", textTransform: "uppercase", lineHeight: 0.95, color: T.ink, margin: "0 0 14px" }}>
            Congratulations.
          </h2>
          <p style={{ fontFamily: FONT.dm, fontSize: 14.5, lineHeight: 1.65, color: T.ink, opacity: 0.85, margin: "0 0 18px", maxWidth: "56ch" }}>
            You have published your <em>{program.label}</em> Journey Card — {program.year} finally
            has its page. You can return and add to it at any time.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <a href={`/journeys/${slug}/${state.cardId}`} style={primaryBtn}>See your card →</a>
            <button type="button" onClick={() => setState({ step: "draft" })} style={{ ...ghostBtn, cursor: "pointer" }}>
              Keep editing
            </button>
          </div>
        </>
      )}
    </main>
  );
}

// ── Spine row (inline rename / remove) ────────────────────────────────────────

function SpineRow({
  index,
  value,
  onRename,
  onRemove,
  onBlur,
}: {
  index: number;
  value: string;
  onRename: (v: string) => void;
  onRemove: () => void;
  onBlur: () => void;
}) {
  const [editing, setEditing] = useState(value === "");
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderRadius: 10, background: T.card, border: `1px solid ${T.border}` }}>
      <span style={{ width: 28, height: 28, borderRadius: "50%", background: T.black, color: T.yellow, fontFamily: FONT.anton, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {String(index).padStart(2, "0")}
      </span>
      {editing ? (
        <input
          autoFocus
          value={value}
          onChange={(e) => onRename(e.target.value)}
          onBlur={() => {
            setEditing(false);
            onBlur();
          }}
          placeholder="e.g. The day in the jungle"
          style={{ flex: 1, fontFamily: FONT.dm, fontSize: 14, color: T.ink, border: "none", outline: "none", background: "transparent", minWidth: 0 }}
        />
      ) : (
        <p style={{ flex: 1, fontFamily: FONT.dm, fontWeight: 700, fontSize: 14, color: T.ink, margin: 0, lineHeight: 1.3 }}>
          {value || <em style={{ color: T.muted, fontWeight: 400 }}>Unnamed chapter</em>}
        </p>
      )}
      <button type="button" onClick={() => setEditing(true)} title="Rename" style={iconBtn}>✎</button>
      <button type="button" onClick={onRemove} title="Remove" style={iconBtn}>×</button>
    </div>
  );
}

// ── Memory card (response line + memory + photos) ─────────────────────────────

function MemoryCard({
  chapter,
  programId,
  asId,
  onPatch,
  onBlur,
}: {
  chapter: JourneyDraftChapter;
  programId: string;
  asId?: string;
  onPatch: (patch: Partial<JourneyDraftChapter>) => void;
  onBlur: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const readiness = chapterReadiness(chapter);
  const photos = chapter.photoUrls ?? [];

  async function onFile(f: File | null) {
    if (!f || uploading || photos.length >= MAX_PHOTOS_PER_CHAPTER) return;
    setUploading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.set("file", f);
      fd.set("programId", programId);
      if (asId) fd.set("asId", asId);
      const res = await fetch("/api/alumni/journey-card/upload", { method: "POST", body: fd });
      const data = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (!res.ok || !data?.url) throw new Error(data?.error || "Upload failed");
      onPatch({ photoUrls: [...photos, data.url] });
      onBlur();
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ borderRadius: 12, background: T.card, border: `1px solid ${T.border}`, overflow: "hidden" }}>
      {photos[0] && (
        <div style={{ position: "relative", height: 130 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photos[0]} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(14,10,19,0.05) 40%, rgba(14,10,19,0.85) 100%)" }} />
          {chapter.response && (
            <p style={{ position: "absolute", left: 14, right: 14, bottom: 10, fontFamily: FONT.anton, fontSize: 16, textTransform: "uppercase", color: "#fff", margin: 0, lineHeight: 1.05 }}>
              {chapter.response}
            </p>
          )}
        </div>
      )}
      <div style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, gap: 10 }}>
          <div>
            <p style={{ fontFamily: FONT.dm, fontWeight: 700, fontSize: 14.5, color: T.ink, margin: "0 0 2px" }}>
              {chapter.title || <em style={{ color: T.muted, fontWeight: 400 }}>Unnamed chapter</em>}
            </p>
            <p style={{ fontFamily: FONT.grotesk, fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: T.muted, margin: 0 }}>
              {chapter.dateLabel} · {chapter.location}
            </p>
          </div>
          <span style={{ fontFamily: FONT.grotesk, fontSize: 8, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: readiness === "written" ? T.green : readiness === "in-progress" ? T.pink : T.muted, flexShrink: 0 }}>
            {readiness === "written" ? "✓ Written" : readiness === "in-progress" ? "↻ Started" : "○ Blank"}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <FieldLabel>Response line</FieldLabel>
            <input
              type="text"
              value={chapter.response}
              onChange={(e) => onPatch({ response: e.target.value })}
              onBlur={onBlur}
              placeholder="One sentence — what you still feel when you think of this chapter…"
              style={inputStyle}
            />
          </div>
          <div>
            <FieldLabel>The memory <Hint>— as much or as little as you carry</Hint></FieldLabel>
            <textarea
              value={chapter.body}
              onChange={(e) => onPatch({ body: e.target.value })}
              onBlur={onBlur}
              placeholder="What happened. What it felt like. What you can still see…"
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>
          <div>
            <FieldLabel>Photos <Hint>— optional, {photos.length}/{MAX_PHOTOS_PER_CHAPTER}</Hint></FieldLabel>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              {photos.map((url) => (
                <div key={url} style={{ position: "relative", width: 58, height: 58, borderRadius: 8, overflow: "hidden", border: `1px solid ${T.border}` }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  <button
                    type="button"
                    onClick={() => {
                      onPatch({ photoUrls: photos.filter((u) => u !== url) });
                      onBlur();
                    }}
                    aria-label="Remove photo"
                    style={{ position: "absolute", top: 2, right: 2, width: 16, height: 16, borderRadius: "50%", border: "none", cursor: "pointer", background: "rgba(14,10,19,0.75)", color: "#fff", fontSize: 10, lineHeight: 1, padding: 0 }}
                  >
                    ×
                  </button>
                </div>
              ))}
              {photos.length < MAX_PHOTOS_PER_CHAPTER && (
                <label style={{ width: 58, height: 58, borderRadius: 8, border: `1.5px dashed ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: T.muted, fontSize: 20, cursor: uploading ? "default" : "pointer" }}>
                  {uploading ? "…" : "+"}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploading}
                    onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
                    style={{ display: "none" }}
                  />
                </label>
              )}
            </div>
            {uploadError && (
              <p style={{ fontFamily: FONT.dm, fontSize: 12, color: T.pink, margin: "6px 0 0" }}>{uploadError}</p>
            )}
            <p style={{ fontFamily: FONT.dm, fontStyle: "italic", fontSize: 11.5, color: T.muted, margin: "8px 0 0" }}>
              » Approximate dates and locations are fine — the card is yours, not an archive record.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Pull-quote + hero pickers ─────────────────────────────────────────────────

function PullQuotePicker({
  draft,
  updateDraft,
}: {
  draft: JourneyDraft;
  updateDraft: (m: (d: JourneyDraft) => JourneyDraft) => void;
}) {
  const lines = draft.chapters
    .map((c) => c.response.trim())
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i);
  if (!lines.length) return null;
  return (
    <div style={{ marginBottom: 12 }}>
      <FieldLabel>Pull-quote <Hint>— the one line that fronts your card</Hint></FieldLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {lines.map((line) => {
          const on = draft.pullQuote === line;
          return (
            <button
              key={line}
              type="button"
              onClick={() => updateDraft((d) => ({ ...d, pullQuote: on ? "" : line }))}
              style={{
                textAlign: "left", cursor: "pointer", padding: "10px 13px", borderRadius: 10,
                background: on ? `${T.yellow}18` : T.card,
                border: `1.5px solid ${on ? T.yellow : T.border}`,
                fontFamily: FONT.dm, fontStyle: "italic", fontSize: 13, lineHeight: 1.5, color: T.ink,
              }}
            >
              “{line}”
            </button>
          );
        })}
      </div>
    </div>
  );
}

function HeroPicker({
  draft,
  updateDraft,
}: {
  draft: JourneyDraft;
  updateDraft: (m: (d: JourneyDraft) => JourneyDraft) => void;
}) {
  const urls = draft.chapters.flatMap((c) => c.photoUrls ?? []).filter((v, i, a) => a.indexOf(v) === i);
  if (!urls.length) return null;
  return (
    <div style={{ marginBottom: 12 }}>
      <FieldLabel>Cover photo <Hint>— fronts the published card</Hint></FieldLabel>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
        {urls.map((url) => {
          const on = draft.heroUrl === url;
          return (
            <button
              key={url}
              type="button"
              onClick={() => updateDraft((d) => ({ ...d, heroUrl: on ? undefined : url }))}
              style={{
                position: "relative", width: 72, height: 72, borderRadius: 10, overflow: "hidden",
                flexShrink: 0, padding: 0, cursor: "pointer",
                border: on ? `2.5px solid ${T.yellow}` : `1px solid ${T.border}`,
                opacity: on ? 1 : 0.8, background: T.card,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Shared style bits ─────────────────────────────────────────────────────────

function Sep() {
  return <div style={{ height: 1, background: T.sep, margin: "30px 0" }} />;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: FONT.grotesk, fontSize: 9.5, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: T.muted, margin: "0 0 12px" }}>
      {children}
    </p>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: FONT.grotesk, fontSize: 8.5, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: T.muted, margin: "0 0 6px" }}>
      {children}
    </p>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <span style={{ fontWeight: 400, letterSpacing: 0, textTransform: "none", color: T.dim }}>{children}</span>;
}

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  fontFamily: FONT.dm, fontSize: 14.5, lineHeight: 1.5,
  color: T.ink, background: T.paper,
  border: `1.5px solid ${T.border}`, borderRadius: 10, padding: "10px 13px",
};

const primaryBtn: React.CSSProperties = {
  display: "inline-block",
  fontFamily: FONT.grotesk, fontSize: 11, fontWeight: 700,
  letterSpacing: "0.1em", textTransform: "uppercase",
  background: T.yellow, color: T.black, textDecoration: "none",
  padding: "12px 26px", borderRadius: 10,
};

const ghostBtn: React.CSSProperties = {
  display: "inline-block",
  fontFamily: FONT.grotesk, fontSize: 10, fontWeight: 700,
  letterSpacing: "0.08em", textTransform: "uppercase",
  background: "transparent", color: T.muted, textDecoration: "none",
  padding: "10px 18px", borderRadius: 9, border: `1.5px solid ${T.border}`,
  cursor: "pointer",
};

const iconBtn: React.CSSProperties = {
  background: "none", border: "none", cursor: "pointer",
  color: T.muted, fontSize: 13, padding: 4,
};
