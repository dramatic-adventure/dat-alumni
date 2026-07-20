// components/field-kit/TracesList.tsx
//
// "My Traces" — the signed-in member's own captures (notes, quotes, photos,
// voice), newest first. Author-scoping is enforced by the caller + loader.
//
// OFFLINE-FIRST: this list always shows the most current data the DEVICE has.
//   • Edits + deletes queue in IndexedDB (lib/traceMutationQueue) and drain via
//     lib/traceMutationSync — they apply instantly on screen and sync when
//     connectivity allows (the server routes are idempotent).
//   • Captures still waiting in the capture outbox render here too, marked
//     "waiting to sync", so nothing ever looks lost.
//   • The merged view is mirrored to IndexedDB (lib/traceMirror), so a later
//     offline open (served stale HTML by the service worker) reconciles to the
//     newest local state on mount.

"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FieldCapture } from "@/lib/loadFieldKitCaptures";
import { getAll as getQueuedCaptures } from "@/lib/captureQueue";
import { subscribe as subscribeCaptureSync } from "@/lib/captureSync";
import {
  enqueue as enqueueMutation,
  getAll as getQueuedMutations,
  newTraceMutationId,
  type QueuedTraceMutation,
} from "@/lib/traceMutationQueue";
import {
  start as startTraceMutationSync,
  kick as kickTraceMutationSync,
  subscribe as subscribeTraceMutationSync,
} from "@/lib/traceMutationSync";
import { getMirror, putMirror, ownerKey } from "@/lib/traceMirror";
import { DIRECT_MAX_BYTES, CHUNK_BYTES } from "@/lib/captureChunkContract";
import { T, FONT } from "@/components/field-kit/tokens";

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const ACTION_BTN: CSSProperties = {
  fontFamily: FONT.grotesk,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  background: "transparent",
  border: "none",
  padding: "6px 0",
  cursor: "pointer",
};

const CHIP: CSSProperties = {
  fontFamily: FONT.grotesk,
  fontSize: 9.5,
  fontWeight: 700,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  borderRadius: 6,
  padding: "6px 10px",
  cursor: "pointer",
};

const FIELD: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  fontFamily: FONT.dm,
  fontSize: 14.5,
  lineHeight: 1.5,
  color: T.ink,
  background: T.black,
  border: `1px solid ${T.border}`,
  borderRadius: 9,
  padding: "10px 12px",
  outline: "none",
  resize: "vertical",
};

type EditState = {
  captureId: string;
  bodyText: string;
  quoteSpeaker: string;
  visibility: "card" | "sealed";
};

export default function TracesList({ captures, asId }: { captures: FieldCapture[]; asId?: string }) {
  const router = useRouter();
  const owner = ownerKey(asId);

  // The merged, device-truth view: server rows (or the newer on-device mirror
  // when offline) with queued edits/deletes applied.
  const [items, setItems] = useState<FieldCapture[]>(captures);
  // Captures still in the offline outbox — rendered read-only, marked pending.
  const [pendingCaptures, setPendingCaptures] = useState<FieldCapture[]>([]);
  // captureId → live outbox queue state, so the chip tells the truth:
  // actively uploading ("Syncing…" / "Uploading x/y"), waiting for a retry
  // (with the last attempt's error), or permanently failed ("Sync failed").
  type OutboxInfo = {
    status: "pending" | "syncing" | "failed";
    lastError?: string;
    attempts: number;
    /** Chunked uploads only: [uploaded, total]. */
    progress?: [number, number];
  };
  const [outboxState, setOutboxState] = useState<Map<string, OutboxInfo>>(new Map());
  // captureId → queued mutation, for the per-row "waiting to sync" chip.
  const [queuedFor, setQueuedFor] = useState<Map<string, QueuedTraceMutation>>(new Map());

  const [online, setOnline] = useState(true);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  const [edit, setEdit] = useState<EditState | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  // Rebuild the merged view from (server rows | mirror) + queued mutations +
  // queued captures, then persist it back to the mirror.
  const reconcile = useCallback(async () => {
    try {
      const [mutations, queuedCaps, mirror] = await Promise.all([
        getQueuedMutations(),
        getQueuedCaptures(),
        getMirror(owner),
      ]);
      const mine = mutations.filter((m) => ownerKey(m.asId) === owner);
      const mutationFor = new Map(mine.map((m) => [m.captureId, m]));

      // Offline, the page HTML (and its embedded server rows) may be a stale
      // service-worker copy — prefer the mirror, which tracked every local
      // change since the last fresh render.
      const offline = typeof navigator !== "undefined" && !navigator.onLine;
      const base = offline && mirror.length ? mirror : captures;

      const merged = base
        .filter((c) => mutationFor.get(c.captureId)?.action !== "delete")
        .map((c) => {
          const m = mutationFor.get(c.captureId);
          if (m?.action === "edit" && m.payload) {
            return {
              ...c,
              bodyText: m.payload.bodyText.trim(),
              quoteSpeaker:
                m.payload.quoteSpeaker != null ? m.payload.quoteSpeaker.trim() : c.quoteSpeaker,
              visibility: m.payload.visibility,
            };
          }
          return c;
        });

      setItems(merged);
      setQueuedFor(mutationFor);
      void putMirror(owner, merged);

      const mergedIds = new Set(merged.map((c) => c.captureId));
      setPendingCaptures(
        queuedCaps
          .filter((q) => ownerKey(q.asId) === owner && !mergedIds.has(q.captureId))
          .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
          .map((q) => ({
            captureId: q.captureId,
            programId: "",
            authorSlug: "",
            kind: q.kind,
            bodyText: q.bodyText,
            createdAt: q.createdAt,
            dayIndex: q.dayIndex ?? "",
            chapterId: q.chapterId ?? "",
            visibility: q.visibility ?? "card",
            quoteSpeaker: q.quoteSpeaker ?? "",
            driveFileId: "",
            mimeType: "",
          }))
      );
      setOutboxState(
        new Map(
          queuedCaps.map((q) => {
            const total =
              q.blob && q.blob.size > DIRECT_MAX_BYTES ? Math.ceil(q.blob.size / CHUNK_BYTES) : 0;
            return [
              q.captureId,
              {
                status: q.status,
                attempts: q.attempts,
                ...(q.lastError ? { lastError: q.lastError } : {}),
                ...(total > 0 ? { progress: [Math.min(q.uploadedChunks ?? 0, total), total] as [number, number] } : {}),
              },
            ];
          })
        )
      );
    } catch {
      // IndexedDB unavailable — fall back to the server rows as-is.
      setItems(captures);
    }
  }, [captures, owner]);

  // Drive the mutation drainer and reconcile on every relevant signal: fresh
  // server rows, connectivity flips, and queue drains (an edit landing on the
  // server drops out of the queue; router.refresh brings the server copy).
  useEffect(() => {
    startTraceMutationSync();
    void reconcile();
    const onOnline = () => void reconcile();
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOnline);
    const unsubMut = subscribeTraceMutationSync(() => void reconcile());
    const unsubCap = subscribeCaptureSync(() => void reconcile());
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOnline);
      unsubMut();
      unsubCap();
    };
  }, [reconcile]);

  // Queue an edit: instant on screen, syncs when connectivity allows.
  async function saveEdit(c: FieldCapture) {
    if (!edit) return;
    await enqueueMutation({
      mutationId: newTraceMutationId(),
      captureId: c.captureId,
      action: "edit",
      payload: {
        bodyText: edit.bodyText,
        ...(c.kind === "quote" ? { quoteSpeaker: edit.quoteSpeaker } : {}),
        visibility: edit.visibility,
      },
      ...(asId ? { asId } : {}),
      createdAt: new Date().toISOString(),
      status: "pending",
      attempts: 0,
    });
    kickTraceMutationSync();
    setEdit(null);
    await reconcile();
    if (navigator.onLine) router.refresh();
  }

  // Queue a delete: disappears instantly, syncs when connectivity allows.
  async function deleteCapture(c: FieldCapture) {
    await enqueueMutation({
      mutationId: newTraceMutationId(),
      captureId: c.captureId,
      action: "delete",
      ...(asId ? { asId } : {}),
      createdAt: new Date().toISOString(),
      status: "pending",
      attempts: 0,
    });
    kickTraceMutationSync();
    setConfirmId(null);
    await reconcile();
    if (navigator.onLine) router.refresh();
  }

  if (!items.length && !pendingCaptures.length) return <TracesEmpty />;

  const composerHref = asId
    ? `/field-kit/composer?asId=${encodeURIComponent(asId)}`
    : "/field-kit/composer";

  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "40px clamp(18px, 5vw, 40px) 96px" }}>
      <p style={{ fontFamily: FONT.grotesk, fontWeight: 700, fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase", color: T.teal, margin: "0 0 10px" }}>
        My Traces
      </p>
      <h1 style={{ fontFamily: FONT.anton, fontSize: "clamp(28px, 6.5vw, 44px)", lineHeight: 0.96, textTransform: "uppercase", color: T.ink, margin: "0 0 16px" }}>
        Everything you&apos;ve caught.
      </h1>

      {/* Slice 6 — the path from traces to a published Journey Card. */}
      <Link
        href={composerHref}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
          background: T.black, border: `1px solid ${T.border}`, borderRadius: 12,
          padding: "12px 16px", marginBottom: 22, textDecoration: "none",
        }}
      >
        <span>
          <span style={{ display: "block", fontFamily: FONT.grotesk, fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: T.yellow, marginBottom: 2 }}>
            Shape your card
          </span>
          <span style={{ fontFamily: FONT.dm, fontSize: 12.5, color: T.muted }}>
            Turn these traces into your Journey Card — private until you stamp it.
          </span>
        </span>
        <span aria-hidden style={{ fontFamily: FONT.anton, fontSize: 18, color: T.yellow }}>→</span>
      </Link>

      {/* Everything works offline: new captures, edits, and deletes all queue
          on-device and sync when signal returns. */}
      {!online && (
        <p
          role="status"
          style={{
            fontFamily: FONT.dm, fontSize: 12.5, lineHeight: 1.5, color: T.muted,
            background: T.black, border: `1px dashed ${T.border}`, borderRadius: 10,
            padding: "10px 14px", margin: "0 0 16px",
          }}
        >
          You&apos;re offline — showing the latest saved on this device. Any edits or deletes you
          make now are kept here and sync automatically when you&apos;re back online.
        </p>
      )}

      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Captures still in the offline outbox — safe on this device, syncing soon. */}
        {pendingCaptures.map((c) => {
          const isQuote = c.kind === "quote";
          const isPhoto = c.kind === "photo";
          const isVoice = c.kind === "voice";
          const label = isVoice ? "Voice" : isPhoto ? "Photo" : isQuote ? "Quote" : "Note";
          const labelColor = isVoice ? T.green : isPhoto ? T.yellow : isQuote ? T.pink : T.teal;
          const state = outboxState.get(c.captureId);
          const failed = state?.status === "failed";
          const syncing = state?.status === "syncing";
          const chipColor = failed ? T.pink : syncing ? T.green : T.yellow;
          const chipText = failed
            ? "Sync failed"
            : syncing
              ? state?.progress
                ? `Uploading ${state.progress[0]}/${state.progress[1]}`
                : "Syncing…"
              : (state?.attempts ?? 0) > 0
                ? "Will retry"
                : "Waiting to sync";
          // The last attempt's error, shown for anything not actively syncing —
          // this is the "WHY isn't this landing" diagnostic.
          const errorNote = !syncing && state?.lastError ? state.lastError : null;
          return (
            <li
              key={c.captureId}
              style={{ background: T.card, border: `1px dashed ${T.border}`, borderRadius: 12, padding: "14px 16px" }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: FONT.grotesk, fontSize: 10.5, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: labelColor }}>
                    {label}
                  </span>
                  <span
                    style={{
                      fontFamily: FONT.grotesk, fontSize: 9, fontWeight: 700, letterSpacing: "0.14em",
                      textTransform: "uppercase", color: chipColor, border: `1px dashed ${chipColor}`,
                      borderRadius: 4, padding: "2px 7px",
                    }}
                  >
                    {chipText}
                  </span>
                </span>
                <span style={{ fontFamily: FONT.dm, fontSize: 12, color: T.muted }}>{formatWhen(c.createdAt)}</span>
              </div>
              {(isPhoto || isVoice) && (
                <p style={{ fontFamily: FONT.dm, fontSize: 12.5, color: T.muted, margin: "0 0 6px" }}>
                  {failed
                    ? `${isPhoto ? "Photo" : "Recording"} is safe on this device but couldn't upload — tap the sync chip in the top bar to retry.`
                    : syncing
                      ? `${isPhoto ? "Photo" : "Recording"} is uploading now…`
                      : `${isPhoto ? "Photo" : "Recording"} saved on this device — it uploads when you're online.`}
                </p>
              )}
              {errorNote && (
                <p style={{ fontFamily: FONT.dm, fontSize: 12, color: failed ? T.pink : T.muted, margin: "0 0 6px" }}>
                  Last attempt: {errorNote}
                </p>
              )}
              {c.bodyText && (
                <p style={{ fontFamily: FONT.dm, fontStyle: isQuote ? "italic" : undefined, fontSize: 14.5, lineHeight: 1.5, color: T.ink, margin: 0, whiteSpace: "pre-wrap" }}>
                  {isQuote ? `“${c.bodyText}”` : c.bodyText}
                </p>
              )}
            </li>
          );
        })}

        {items.map((c) => {
          const isQuote = c.kind === "quote";
          const isPhoto = c.kind === "photo";
          const isVoice = c.kind === "voice";
          const label = isVoice ? "Voice" : isPhoto ? "Photo" : isQuote ? "Quote" : "Note";
          const labelColor = isVoice ? T.green : isPhoto ? T.yellow : isQuote ? T.pink : T.teal;
          const isEditing = edit?.captureId === c.captureId;
          const isConfirming = confirmId === c.captureId;
          const queued = queuedFor.get(c.captureId);
          const hasFile = isPhoto || isVoice;

          return (
            <li
              key={c.captureId}
              style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "14px 16px" }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: FONT.grotesk, fontSize: 10.5, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: labelColor }}>
                    {label}
                  </span>
                  {c.visibility === "sealed" && !isEditing && (
                    // Slice 6 — sealed reflections never leave the journal and are
                    // never offered to the Journey Card Composer.
                    <span
                      style={{
                        fontFamily: FONT.grotesk,
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: T.muted,
                        border: `1px dashed ${T.border}`,
                        borderRadius: 4,
                        padding: "2px 7px",
                      }}
                    >
                      ✦ Sealed
                    </span>
                  )}
                </span>
                <span style={{ fontFamily: FONT.dm, fontSize: 12, color: T.muted }}>{formatWhen(c.createdAt)}</span>
              </div>

              {/* Media renders in both modes — you edit the caption, not the file. */}
              {isPhoto && c.driveFileId && (
                // Private media: served only through the authorized route, never
                // the public /api/media/thumb proxy.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/field-kit/capture/media/${encodeURIComponent(c.driveFileId)}`}
                  alt={c.bodyText || "Capture photo"}
                  style={{ display: "block", width: "100%", height: "auto", borderRadius: 9, border: `1px solid ${T.border}` }}
                />
              )}
              {isVoice && c.driveFileId && (
                // Private audio: streamed (with Range support) only through the
                // authorized media route.
                <audio
                  controls
                  src={`/api/field-kit/capture/media/${encodeURIComponent(c.driveFileId)}`}
                  aria-label={c.bodyText ? `Voice capture: ${c.bodyText}` : "Voice capture"}
                  style={{ width: "100%", display: "block" }}
                />
              )}

              {isEditing ? (
                <div style={{ marginTop: hasFile ? 10 : 0, display: "flex", flexDirection: "column", gap: 10 }}>
                  <textarea
                    value={edit.bodyText}
                    onChange={(e) => setEdit({ ...edit, bodyText: e.target.value })}
                    rows={hasFile ? 2 : 4}
                    placeholder={hasFile ? "Caption (optional)" : isQuote ? "The quote…" : "Your note…"}
                    aria-label={hasFile ? "Caption" : isQuote ? "Quote" : "Note"}
                    style={FIELD}
                  />
                  {isQuote && (
                    <input
                      type="text"
                      value={edit.quoteSpeaker}
                      onChange={(e) => setEdit({ ...edit, quoteSpeaker: e.target.value })}
                      placeholder="Who said it (optional)"
                      aria-label="Who said it"
                      style={{ ...FIELD, resize: "none" }}
                    />
                  )}

                  {/* Card ↔ Sealed. Sealing pulls the trace out of the Composer's reach. */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {(["card", "sealed"] as const).map((v) => {
                      const on = edit.visibility === v;
                      return (
                        <button
                          key={v}
                          type="button"
                          aria-pressed={on}
                          onClick={() => setEdit({ ...edit, visibility: v })}
                          style={{
                            ...CHIP,
                            color: on ? T.black : T.muted,
                            background: on ? (v === "sealed" ? T.muted : T.yellow) : "transparent",
                            border: `1px solid ${on ? "transparent" : T.border}`,
                          }}
                        >
                          {v === "card" ? "For my card" : "✦ Sealed"}
                        </button>
                      );
                    })}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                    <button
                      type="button"
                      disabled={!hasFile && !edit.bodyText.trim()}
                      onClick={() => saveEdit(c)}
                      style={{ ...ACTION_BTN, color: T.yellow }}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEdit(null)}
                      style={{ ...ACTION_BTN, color: T.muted }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {isQuote ? (
                    <>
                      <p style={{ fontFamily: FONT.dm, fontStyle: "italic", fontSize: 15, lineHeight: 1.5, color: T.ink, margin: 0, whiteSpace: "pre-wrap" }}>
                        {`“${c.bodyText}”`}
                      </p>
                      {c.quoteSpeaker && (
                        <p style={{ fontFamily: FONT.dm, fontSize: 13.5, color: T.muted, margin: "6px 0 0" }}>
                          — {c.quoteSpeaker}
                        </p>
                      )}
                    </>
                  ) : c.bodyText ? (
                    <p style={{ fontFamily: FONT.dm, fontSize: hasFile ? 14.5 : 15, lineHeight: 1.5, color: T.ink, margin: hasFile ? "10px 0 0" : 0, whiteSpace: "pre-wrap" }}>
                      {c.bodyText}
                    </p>
                  ) : null}

                  {isConfirming ? (
                    <div style={{ marginTop: 12, borderTop: `1px solid ${T.sep}`, paddingTop: 10 }}>
                      <p style={{ fontFamily: FONT.dm, fontSize: 12.5, lineHeight: 1.5, color: T.ink, margin: "0 0 8px" }}>
                        Delete this {label.toLowerCase()}? If it&apos;s part of your journey draft,
                        it&apos;ll be removed there too.
                        {!online && " (You're offline — it disappears now and syncs later.)"}
                      </p>
                      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                        <button
                          type="button"
                          onClick={() => deleteCapture(c)}
                          style={{ ...ACTION_BTN, color: T.pink }}
                        >
                          Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmId(null)}
                          style={{ ...ACTION_BTN, color: T.muted }}
                        >
                          Keep it
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 10 }}>
                      <button
                        type="button"
                        title="Edit this trace"
                        onClick={() => {
                          setConfirmId(null);
                          setEdit({
                            captureId: c.captureId,
                            bodyText: c.bodyText,
                            quoteSpeaker: c.quoteSpeaker,
                            visibility: c.visibility,
                          });
                        }}
                        style={{ ...ACTION_BTN, color: T.teal }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        title="Delete this trace"
                        onClick={() => { setEdit(null); setConfirmId(c.captureId); }}
                        style={{ ...ACTION_BTN, color: T.muted }}
                      >
                        Delete
                      </button>
                      {queued && (
                        <span
                          title="This change is saved on your device and syncs when you're online"
                          style={{
                            fontFamily: FONT.grotesk, fontSize: 9, fontWeight: 700,
                            letterSpacing: "0.14em", textTransform: "uppercase", color: T.yellow,
                          }}
                        >
                          {queued.status === "failed" ? "Sync failed" : "Change syncing…"}
                        </span>
                      )}
                    </div>
                  )}
                </>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}

function TracesEmpty() {
  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "72px clamp(18px, 5vw, 40px)", textAlign: "center" }}>
      <p style={{ fontFamily: FONT.grotesk, fontWeight: 700, fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase", color: T.teal, margin: "0 0 12px" }}>
        My Traces
      </p>
      <h1 style={{ fontFamily: FONT.anton, fontSize: "clamp(28px, 6.5vw, 48px)", lineHeight: 0.96, textTransform: "uppercase", color: T.ink, margin: "0 0 16px" }}>
        Nothing caught yet.
      </h1>
      <p style={{ fontFamily: FONT.dm, fontSize: 14.5, lineHeight: 1.55, color: T.ink, opacity: 0.78, margin: 0 }}>
        Tap Capture below to jot a note or a quote — it&apos;ll show up here, newest first.
      </p>
    </main>
  );
}
