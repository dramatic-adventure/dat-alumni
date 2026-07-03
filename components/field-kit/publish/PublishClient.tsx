// components/field-kit/publish/PublishClient.tsx
//
// Review & Publish (Slice 6) — client side of the private→public handoff,
// ported from the approved mockup publish/PublishReview.tsx.
//
// Structure (top → bottom, mirroring the mockup): hero → readiness → lanes →
// chapter review → daily pages → media status → final picks (title / pull-quote
// / hero) → visibility boundary → stamp → congratulations.
//
// Publish design (§4-R Q5 — single idempotent append):
//   1. The card id is minted CLIENT-SIDE and persisted into the draft BEFORE
//      any network call, so every retry reuses it (the sheet's read side
//      de-dupes by id, last-row-wins → retries can never double-publish).
//   2. Promote media: POST /api/field-kit/publish-media (idempotent copies of
//      the chosen private captures → public URLs).
//   3. One POST to the extended /api/alumni/journey with the flat fields (the
//      Q1 flatten) + the full chapters array (chaptersJson).
//   On any failure the draft stays safe on device with an explicit
//   "publish didn't go through — retry" state. No partial-publish exists:
//   promoted-but-unpublished files are unreferenced and reused on retry.

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { T, FONT, STAMP_SHADOW } from "@/components/field-kit/tokens";
import {
  chapterReadiness,
  draftToChapterBlocks,
  flattenDraftForPublish,
  type JourneyDraft,
} from "@/lib/journeyDraft";
import { draftKey, loadDraft, pushDraft, saveDraftLocal } from "@/lib/journeyDraftStore";
import { subscribe as subscribeCaptureSync, getCounts, type SyncCounts } from "@/lib/captureSync";
import { captureMediaUrl } from "@/components/field-kit/composer/ComposerClient";
import { ulid } from "@/lib/ulid";

type ProgramMeta = {
  program: string;
  location: string;
  country: string;
  year: string;
  dates: string;
  label: string;
};

export type PublishPhotoTrace = { captureId: string; driveFileId: string; bodyText: string };

type PublishState =
  | { step: "review" }
  | { step: "publishing"; note: string }
  | { step: "failed"; error: string }
  | { step: "published"; cardId: string };

const STAMP_SRC = "/images/dat-logo7.svg";

function mintCardId(profileSlug: string, program: string, country: string, year: string): string {
  const base = [profileSlug, program, country, year]
    .map((s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""))
    .filter(Boolean)
    .join("-");
  return `${base ? base + "-" : ""}${ulid().toLowerCase()}`;
}

export default function PublishClient({
  programId,
  profileSlug,
  asId,
  program,
  photoTraces,
}: {
  programId: string;
  profileSlug: string;
  asId?: string;
  program: ProgramMeta;
  photoTraces: PublishPhotoTrace[];
}) {
  const [draft, setDraft] = useState<JourneyDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<SyncCounts>(getCounts());
  const [online, setOnline] = useState(true);
  const [state, setState] = useState<PublishState>({ step: "review" });
  const key = draftKey("live", programId);

  useEffect(() => {
    let cancelled = false;
    void loadDraft("live", programId, asId).then((d) => {
      if (!cancelled) {
        setDraft(d);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [programId, asId]);

  useEffect(() => subscribeCaptureSync(setCounts), []);
  useEffect(() => {
    const sync = () => setOnline(navigator.onLine !== false);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  const updateDraft = useCallback(
    (mutate: (d: JourneyDraft) => JourneyDraft) => {
      setDraft((prev) => {
        if (!prev) return prev;
        const next = { ...mutate(prev), updatedAt: new Date().toISOString() };
        void saveDraftLocal(next);
        return next;
      });
    },
    []
  );

  const traceById = useMemo(
    () => new Map(photoTraces.map((t) => [t.captureId, t])),
    [photoTraces]
  );

  // ── Readiness ──
  const chapterEntries = useMemo(
    () => (draft?.chapters ?? []).filter((c) => c.kind === "chapter"),
    [draft]
  );
  const dailyEntries = useMemo(
    () =>
      (draft?.chapters ?? []).filter(
        (c) => c.kind === "daily" && chapterReadiness(c) !== "empty"
      ),
    [draft]
  );
  const written = chapterEntries.filter((c) => chapterReadiness(c) === "written");
  const inProgress = chapterEntries.filter((c) => chapterReadiness(c) === "in-progress");
  const empty = chapterEntries.filter((c) => chapterReadiness(c) === "empty");

  const attachedCaptureIds = useMemo(() => {
    const ids = new Set<string>();
    for (const ch of draft?.chapters ?? []) {
      for (const id of ch.photoCaptureIds) if (traceById.has(id)) ids.add(id);
    }
    if (draft?.heroCaptureId && traceById.has(draft.heroCaptureId)) ids.add(draft.heroCaptureId);
    return Array.from(ids);
  }, [draft, traceById]);

  const responseLines = useMemo(
    () =>
      (draft?.chapters ?? [])
        .map((c) => c.response.trim())
        .filter(Boolean)
        .filter((v, i, a) => a.indexOf(v) === i),
    [draft]
  );

  const mediaPending = counts.pending > 0;
  const hasContent = written.length + inProgress.length > 0 || dailyEntries.length > 0;
  const canStamp = !mediaPending && online && hasContent && state.step !== "publishing";

  // ── The stamp (§4-R Q5) ──
  async function stamp() {
    if (!draft || !canStamp) return;

    // 1. Mint + persist the card id BEFORE any network call (idempotent retry).
    let cardId = draft.publishedCardId;
    if (!cardId) {
      cardId = mintCardId(profileSlug, program.program, program.country, program.year);
      updateDraft((d) => ({ ...d, publishedCardId: cardId }));
    }

    try {
      // 2. Promote chosen private captures → public URLs (idempotent).
      setState({ step: "publishing", note: "Preparing your photos…" });
      let urls: Record<string, string> = {};
      if (attachedCaptureIds.length) {
        const res = await fetch("/api/field-kit/publish-media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ captureIds: attachedCaptureIds, ...(asId ? { asId } : {}) }),
        });
        const data = (await res.json().catch(() => null)) as
          | { urls?: Record<string, string>; error?: string }
          | null;
        if (!res.ok || !data?.urls) {
          throw new Error(data?.error || "Could not prepare photos for publishing");
        }
        urls = data.urls;
      }

      // 3. Flatten (Q1) + one idempotent append through the extended route.
      setState({ step: "publishing", note: "Stamping your card…" });
      const blocks = draftToChapterBlocks(draft, (ch) =>
        ch.photoCaptureIds.map((id) => urls[id]).filter(Boolean)
      );
      const heroUrl =
        (draft.heroCaptureId && urls[draft.heroCaptureId]) || draft.heroUrl || "";
      const flat = flattenDraftForPublish(draft, blocks, heroUrl);

      const res = await fetch("/api/alumni/journey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: cardId,
          profileSlug,
          programId,
          program: program.program,
          location: program.location,
          country: program.country,
          year: program.year,
          dates: program.dates,
          title: draft.title,
          primaryRole: draft.primaryRole,
          accent: draft.accent,
          pullQuote: flat.pullQuote,
          heroUrl: flat.heroUrl,
          body: flat.body,
          mediaUrls: flat.mediaUrls,
          chapters: blocks,
        }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; id?: string; error?: string }
        | null;
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "The publish didn't go through");
      }

      void pushDraft(key, asId);
      setState({ step: "published", cardId: data.id || cardId });
    } catch (e) {
      setState({
        step: "failed",
        error: e instanceof Error ? e.message : "The publish didn't go through",
      });
    }
  }

  // ── Render ──
  if (loading) {
    return (
      <main style={pageStyle}>
        <p style={{ fontFamily: FONT.grotesk, fontSize: 11, fontWeight: 700, letterSpacing: "0.24em", textTransform: "uppercase", color: T.muted, textAlign: "center", padding: "60px 0" }}>
          Opening your draft…
        </p>
      </main>
    );
  }

  if (!draft) {
    return (
      <main style={pageStyle}>
        <h1 style={h1Style}>Nothing to review yet.</h1>
        <p style={{ fontFamily: FONT.dm, fontSize: 14.5, lineHeight: 1.55, color: T.muted, margin: "0 0 20px" }}>
          Your Journey Card draft starts in the Composer — shape a chapter or two, then come back here to stamp it.
        </p>
        <Link href={composerHref(asId)} style={primaryBtn}>Open the Composer →</Link>
      </main>
    );
  }

  if (state.step === "published") {
    const cardHref = `/journeys/${draft.authorSlug || profileSlug}/${state.cardId}`;
    return (
      <main style={pageStyle}>
        <p style={kickerStyle}>{program.label}</p>
        <h1 style={h1Style}>Congratulations.</h1>
        <p style={{ fontFamily: FONT.dm, fontSize: 14.5, lineHeight: 1.65, color: T.ink, opacity: 0.85, margin: "0 0 18px", maxWidth: "56ch" }}>
          You have published your <em>{program.label}</em> Journey Card. Thank you for having the
          courage to jump into the unknown and take the journey — and for sharing it.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
          {[
            "Your Journey Card is now live",
            "Your company can find it on your alumni profile",
            "You can return and add to your card at any time",
          ].map((line) => (
            <p key={line} style={{ fontFamily: FONT.grotesk, fontSize: 10.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: T.ink, margin: 0, display: "flex", gap: 8 }}>
              <span style={{ color: T.teal }}>»</span> {line}
            </p>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a href={cardHref} style={primaryBtn}>See your card →</a>
          <Link href={composerHref(asId)} style={ghostBtn}>Back to the Composer</Link>
        </div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      {/* 1 · Hero */}
      <p style={kickerStyle}>{program.label}{program.dates ? ` · ${program.dates}` : ""}</p>
      <h1 style={h1Style}>Your Journey Card<br />is waiting.</h1>
      <p style={{ fontFamily: FONT.dm, fontStyle: "italic", fontSize: 14.5, lineHeight: 1.55, color: T.ink, opacity: 0.82, margin: "0 0 26px" }}>
        Review what you&apos;ve made. When it&apos;s ready for the world — stamp it. There&apos;s no
        rush and no wrong answer. Every Journey Card is different, and not everything you captured
        has to come along.
      </p>

      {/* 2 · Readiness */}
      <SectionLabel>At a glance</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, marginBottom: 14 }}>
        <Stat n={written.length} label="Chapters written" color={T.green} />
        <Stat n={inProgress.length} label="In progress" color={T.pink} />
        <Stat n={empty.length} label="Not started" color={T.muted} />
        <Stat n={dailyEntries.length} label="Daily pages" color={T.teal} />
      </div>
      <Card accentTop={T.teal}>
        <p style={{ fontFamily: FONT.dm, fontSize: 13, lineHeight: 1.55, color: T.ink, margin: 0 }}>
          <strong>{written.length} of {chapterEntries.length} chapters written in full.</strong>{" "}
          Chapters you haven&apos;t started stay as blank slots — the card holds their place, and you
          can always return and add to your card after publishing.
        </p>
      </Card>

      {/* 2½ · Lanes */}
      <SectionLabel>What stays yours · what becomes public</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 26 }}>
        {[
          { tag: "Only you", label: "Sealed journal", note: "Sealed reflections and personal notes. Never reviewed, never published.", color: T.grape },
          { tag: "Yours to shape", label: "Your traces & draft", note: "Everything you captured toward your card — on your device.", color: T.teal },
          { tag: "You choose", label: "Review & select", note: "Nothing is taken; everything is offered. You decide what comes along.", color: "#c98a1b" },
          { tag: "The world", label: "Published card", note: "Only what you stamp becomes your public Journey Card.", color: T.green },
        ].map((l, i) => (
          <div key={l.label} style={{ padding: "11px 13px", borderRadius: 10, background: T.card, border: `1px solid ${T.border}`, borderTop: `3px solid ${l.color}` }}>
            <p style={{ fontFamily: FONT.grotesk, fontSize: 8.5, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: l.color, margin: "0 0 4px" }}>{i + 1} · {l.tag}</p>
            <p style={{ fontFamily: FONT.dm, fontWeight: 700, fontSize: 12.5, color: T.ink, margin: "0 0 3px" }}>{l.label}</p>
            <p style={{ fontFamily: FONT.dm, fontSize: 11, lineHeight: 1.45, color: T.muted, margin: 0 }}>{l.note}</p>
          </div>
        ))}
      </div>

      {/* 3 · Chapter review */}
      <SectionLabel>Chapters</SectionLabel>
      <div style={{ background: T.card, borderRadius: 12, border: `1px solid ${T.border}`, overflow: "hidden", marginBottom: 26 }}>
        {chapterEntries.map((ch, i) => {
          const readiness = chapterReadiness(ch);
          return (
            <div key={ch.chapterId} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 15px", borderTop: i > 0 ? `1px solid ${T.sep}` : "none", opacity: readiness === "empty" ? 0.55 : 1 }}>
              <span style={{ width: 28, height: 28, borderRadius: "50%", background: readiness === "empty" ? T.sep : T.black, color: readiness === "empty" ? T.muted : T.yellow, fontFamily: FONT.anton, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {ch.num}
              </span>
              <span style={{ flex: 1, fontFamily: FONT.dm, fontWeight: 700, fontSize: 13.5, color: T.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {ch.title}
              </span>
              <span style={{ fontFamily: FONT.grotesk, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: readiness === "written" ? T.green : readiness === "in-progress" ? T.pink : T.muted, flexShrink: 0 }}>
                {readiness === "written" ? "✓ Written" : readiness === "in-progress" ? "↻ In progress" : "○ Not written"}
              </span>
            </div>
          );
        })}
      </div>

      {/* 4 · Daily pages */}
      {dailyEntries.length > 0 && (
        <>
          <SectionLabel>Daily page inserts</SectionLabel>
          <Card>
            <p style={{ fontFamily: FONT.dm, fontSize: 13, lineHeight: 1.5, color: T.ink, margin: 0 }}>
              <span style={{ fontFamily: FONT.anton, fontSize: 26, color: T.teal, marginRight: 10, verticalAlign: "middle" }}>{dailyEntries.length}</span>
              loose postcard {dailyEntries.length === 1 ? "insert" : "inserts"} — {dailyEntries.map((e) => e.title || "untitled").join(" · ")} — tucked between your chapters.
            </p>
          </Card>
        </>
      )}

      {/* 5 · Media status */}
      <SectionLabel>Media · sync status</SectionLabel>
      <Card accentTop={mediaPending ? T.pink : T.green}>
        {mediaPending ? (
          <p style={{ fontFamily: FONT.dm, fontSize: 13, lineHeight: 1.5, color: T.ink, margin: 0 }}>
            <strong>{counts.pending} {counts.pending === 1 ? "item is" : "items are"} still syncing</strong> from
            this device. They&apos;ll upload automatically when you reconnect — your card content is
            safe, and the stamp unlocks the moment they land.
          </p>
        ) : (
          <p style={{ fontFamily: FONT.dm, fontSize: 13, lineHeight: 1.5, color: T.ink, margin: 0 }}>
            <strong>Everything is synced.</strong> All your captures are safely uploaded.
          </p>
        )}
      </Card>

      {/* 6 · Final picks */}
      <SectionLabel>Final touches</SectionLabel>
      <div style={{ marginBottom: 8 }}>
        <FieldLabel>Card title <Hint>— optional; the program name carries it if blank</Hint></FieldLabel>
        <input
          type="text"
          value={draft.title}
          onChange={(e) => updateDraft((d) => ({ ...d, title: e.target.value }))}
          placeholder={program.label}
          style={inputStyle}
        />
      </div>
      <div style={{ marginBottom: 14 }}>
        <FieldLabel>Your role <Hint>— e.g. Teaching Artist</Hint></FieldLabel>
        <input
          type="text"
          value={draft.primaryRole}
          onChange={(e) => updateDraft((d) => ({ ...d, primaryRole: e.target.value }))}
          placeholder="Teaching Artist"
          style={inputStyle}
        />
      </div>

      {responseLines.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <FieldLabel>Pull-quote <Hint>— the one line that fronts your card</Hint></FieldLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {responseLines.map((line) => {
              const on = draft.pullQuote === line;
              return (
                <button
                  key={line}
                  type="button"
                  aria-pressed={on}
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
      )}

      {attachedCaptureIds.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <FieldLabel>Cover photo <Hint>— fronts the published card</Hint></FieldLabel>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
            {attachedCaptureIds.map((id) => {
              const t = traceById.get(id);
              if (!t) return null;
              const on = draft.heroCaptureId === id;
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => updateDraft((d) => ({ ...d, heroCaptureId: on ? undefined : id }))}
                  style={{
                    position: "relative", width: 72, height: 72, borderRadius: 10, overflow: "hidden",
                    flexShrink: 0, padding: 0, cursor: "pointer",
                    border: on ? `2.5px solid ${T.yellow}` : `1px solid ${T.border}`,
                    opacity: on ? 1 : 0.8, background: T.card,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={captureMediaUrl(t.driveFileId)} alt={t.bodyText || "photo"} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  {on && (
                    <span style={{ position: "absolute", top: 4, right: 4, fontFamily: FONT.grotesk, fontSize: 8, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: T.black, background: T.yellow, borderRadius: 3, padding: "2px 5px" }}>
                      Cover
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 7 · Visibility boundary */}
      <SectionLabel>What changes when you stamp</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, alignItems: "center", padding: "18px", background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, marginBottom: 26 }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontFamily: FONT.grotesk, fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: T.muted, margin: "0 0 4px" }}>Before</p>
          <p style={{ fontFamily: FONT.dm, fontWeight: 700, fontSize: 13.5, color: T.ink, margin: "0 0 4px" }}>🔒 Private draft</p>
          <p style={{ fontFamily: FONT.dm, fontSize: 11.5, color: T.muted, margin: 0, lineHeight: 1.4 }}>Only you can see this.</p>
        </div>
        <div style={{ textAlign: "center" }}>
          <span style={{ fontFamily: FONT.anton, fontSize: 20, color: T.pink }}>→</span>
          <p style={{ fontFamily: FONT.grotesk, fontSize: 8, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: T.pink, margin: "2px 0 0" }}>Stamp</p>
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontFamily: FONT.grotesk, fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: T.green, margin: "0 0 4px" }}>After</p>
          <p style={{ fontFamily: FONT.dm, fontWeight: 700, fontSize: 13.5, color: T.ink, margin: "0 0 4px" }}>🌍 Public Journey Card</p>
          <p style={{ fontFamily: FONT.dm, fontSize: 11.5, color: T.muted, margin: 0, lineHeight: 1.4 }}>On the Journey index and your alumni profile.</p>
        </div>
      </div>

      {/* 8 · Stamp */}
      <div style={{ padding: "30px 22px", borderRadius: 16, background: canStamp ? T.card : "rgba(246,239,227,0.03)", border: `2px solid ${canStamp ? T.ink : T.border}`, display: "flex", flexDirection: "column", alignItems: "center", gap: 14, textAlign: "center" }}>
        <div style={{ filter: canStamp ? STAMP_SHADOW : "none", opacity: canStamp ? 1 : 0.25, transition: "opacity 0.3s" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={STAMP_SRC} alt="DAT stamp" width={84} height={84} />
        </div>
        <h2 style={{ fontFamily: FONT.anton, fontSize: "clamp(24px, 4.5vw, 36px)", textTransform: "uppercase", lineHeight: 0.95, color: canStamp ? T.ink : T.muted, margin: 0 }}>
          {canStamp ? "Stamp to publish." : "Ready to stamp."}
        </h2>

        {state.step === "failed" && (
          <p style={{ fontFamily: FONT.dm, fontSize: 13, lineHeight: 1.5, color: T.pink, margin: 0, maxWidth: 380 }}>
            The publish didn&apos;t go through ({state.error}). Your draft is safe on this device —
            nothing was lost. Try again when you&apos;re ready.
          </p>
        )}

        {canStamp ? (
          <>
            <p style={{ fontFamily: FONT.dm, fontSize: 13.5, lineHeight: 1.55, color: T.ink, opacity: 0.8, margin: 0, maxWidth: 380 }}>
              This sends your Journey Card to the index and your alumni profile. It will be publicly
              viewable from that moment.
            </p>
            <button type="button" onClick={() => void stamp()} style={{ ...primaryBtn, fontSize: 12, padding: "14px 34px", border: "none", cursor: "pointer" }}>
              {state.step === "failed" ? "Try again →" : "Stamp to publish →"}
            </button>
          </>
        ) : state.step === "publishing" ? (
          <p style={{ fontFamily: FONT.dm, fontSize: 13.5, color: T.ink, opacity: 0.8, margin: 0 }}>{state.note}</p>
        ) : (
          <p style={{ fontFamily: FONT.dm, fontStyle: "italic", fontSize: 13, lineHeight: 1.5, color: T.muted, margin: 0, maxWidth: 380 }}>
            {!hasContent
              ? "Write at least one chapter or daily page in the Composer first — a card with a single chapter is a real card."
              : mediaPending
                ? `Ready to stamp when reconnected — ${counts.pending} ${counts.pending === 1 ? "item is" : "items are"} still syncing. Nothing will be lost.`
                : "Ready to stamp when you're back online."}
          </p>
        )}

        <Link href={composerHref(asId)} style={{ fontFamily: FONT.grotesk, fontSize: 9.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: T.muted, textDecoration: "none" }}>
          ← Return to Composer
        </Link>
      </div>

      <p style={{ fontFamily: FONT.dm, fontStyle: "italic", fontSize: 12.5, color: T.muted, margin: "16px 2px 0", lineHeight: 1.5 }}>
        » You don&apos;t need to publish today. The draft is saved; come back when it feels right.
        The card will wait.
      </p>
    </main>
  );
}

// ── Shared bits ───────────────────────────────────────────────────────────────

function composerHref(asId?: string): string {
  return asId ? `/field-kit/composer?asId=${encodeURIComponent(asId)}` : "/field-kit/composer";
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
    <p style={{ fontFamily: FONT.grotesk, fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: T.muted, margin: "0 0 7px" }}>
      {children}
    </p>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <span style={{ fontWeight: 400, letterSpacing: 0, textTransform: "none", color: T.dim }}>{children}</span>;
}

function Stat({ n, label, color }: { n: number; label: string; color: string }) {
  return (
    <div style={{ padding: "13px 15px", borderRadius: 10, background: T.card, border: `1px solid ${T.border}` }}>
      <p style={{ fontFamily: FONT.anton, fontSize: 30, lineHeight: 1, color, margin: "0 0 4px" }}>{n}</p>
      <p style={{ fontFamily: FONT.grotesk, fontSize: 8.5, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: T.muted, margin: 0 }}>{label}</p>
    </div>
  );
}

function Card({ children, accentTop }: { children: React.ReactNode; accentTop?: string }) {
  return (
    <div style={{ padding: "13px 16px", borderRadius: 10, background: T.card, border: `1px solid ${T.border}`, ...(accentTop ? { borderLeft: `3px solid ${accentTop}` } : {}), marginBottom: 26 }}>
      {children}
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  maxWidth: 640,
  margin: "0 auto",
  padding: "38px clamp(16px, 5vw, 40px) 110px",
};

const kickerStyle: React.CSSProperties = {
  fontFamily: FONT.grotesk, fontWeight: 700, fontSize: 11,
  letterSpacing: "0.28em", textTransform: "uppercase",
  color: T.teal, margin: "0 0 10px",
};

const h1Style: React.CSSProperties = {
  fontFamily: FONT.anton, fontSize: "clamp(32px, 7vw, 56px)",
  lineHeight: 0.94, textTransform: "uppercase", color: T.ink, margin: "0 0 16px",
};

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  fontFamily: FONT.dm, fontSize: 15, lineHeight: 1.5,
  color: T.ink, background: T.card,
  border: `1.5px solid ${T.border}`, borderRadius: 10, padding: "11px 13px",
};

const primaryBtn: React.CSSProperties = {
  display: "inline-block",
  fontFamily: FONT.grotesk, fontSize: 11, fontWeight: 700,
  letterSpacing: "0.1em", textTransform: "uppercase",
  background: T.yellow, color: T.black, textDecoration: "none",
  padding: "12px 24px", borderRadius: 10,
};

const ghostBtn: React.CSSProperties = {
  display: "inline-block",
  fontFamily: FONT.grotesk, fontSize: 11, fontWeight: 700,
  letterSpacing: "0.1em", textTransform: "uppercase",
  background: "transparent", color: T.muted, textDecoration: "none",
  padding: "12px 24px", borderRadius: 10, border: `1px solid ${T.border}`,
};
