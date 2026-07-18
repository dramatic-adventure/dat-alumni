// components/field-kit/TracesList.tsx
//
// "My Traces" — the signed-in member's own captures (notes, quotes, photos,
// voice), newest first. Author-scoping is enforced by the caller + loader.
//
// Edit + delete: each trace can be edited (text/caption, quote speaker,
// card/sealed visibility) or deleted (soft delete server-side; a deleted trace
// is also stripped from the journey draft). Both actions are ONLINE-ONLY — the
// server row is the source of truth and the offline story for mutations is
// deliberately out of scope — so the buttons disable offline with a notice.
// (Captures still waiting in the offline queue don't appear here at all; this
// list renders the server's rows only.)

"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FieldCapture } from "@/lib/loadFieldKitCaptures";
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

  // Server rows are the source of truth; local copy lets a save/delete land
  // instantly while router.refresh() re-fetches in the background.
  const [items, setItems] = useState<FieldCapture[]>(captures);
  useEffect(() => setItems(captures), [captures]);

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
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<{ captureId: string; message: string } | null>(null);

  const apiUrl = (captureId: string) =>
    `/api/field-kit/capture/${encodeURIComponent(captureId)}${
      asId ? `?asId=${encodeURIComponent(asId)}` : ""
    }`;

  async function saveEdit(c: FieldCapture) {
    if (!edit || busyId) return;
    setBusyId(c.captureId);
    setError(null);
    try {
      const res = await fetch(apiUrl(c.captureId), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bodyText: edit.bodyText,
          ...(c.kind === "quote" ? { quoteSpeaker: edit.quoteSpeaker } : {}),
          visibility: edit.visibility,
        }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(data?.error || "Couldn't save — try again");
      setItems((prev) =>
        prev.map((it) =>
          it.captureId === c.captureId
            ? {
                ...it,
                bodyText: edit.bodyText.trim(),
                quoteSpeaker: c.kind === "quote" ? edit.quoteSpeaker.trim() : it.quoteSpeaker,
                visibility: edit.visibility,
              }
            : it
        )
      );
      setEdit(null);
      router.refresh();
    } catch (e) {
      setError({ captureId: c.captureId, message: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusyId(null);
    }
  }

  async function deleteCapture(c: FieldCapture) {
    if (busyId) return;
    setBusyId(c.captureId);
    setError(null);
    try {
      const res = await fetch(apiUrl(c.captureId), { method: "DELETE" });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(data?.error || "Couldn't delete — try again");
      setItems((prev) => prev.filter((it) => it.captureId !== c.captureId));
      setConfirmId(null);
      router.refresh();
    } catch (e) {
      setError({ captureId: c.captureId, message: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusyId(null);
    }
  }

  if (!items.length) return <TracesEmpty />;

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

      {/* Edits and deletes talk to the server; captures themselves still queue offline. */}
      {!online && (
        <p
          role="status"
          style={{
            fontFamily: FONT.dm, fontSize: 12.5, lineHeight: 1.5, color: T.muted,
            background: T.black, border: `1px dashed ${T.border}`, borderRadius: 10,
            padding: "10px 14px", margin: "0 0 16px",
          }}
        >
          You&apos;re offline — editing and deleting traces needs a connection. Your traces are
          safe; try again once you&apos;re back online.
        </p>
      )}

      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
        {items.map((c) => {
          const isQuote = c.kind === "quote";
          const isPhoto = c.kind === "photo";
          const isVoice = c.kind === "voice";
          const label = isVoice ? "Voice" : isPhoto ? "Photo" : isQuote ? "Quote" : "Note";
          const labelColor = isVoice ? T.green : isPhoto ? T.yellow : isQuote ? T.pink : T.teal;
          const isEditing = edit?.captureId === c.captureId;
          const isConfirming = confirmId === c.captureId;
          const busy = busyId === c.captureId;
          const rowError = error?.captureId === c.captureId ? error.message : "";
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
                      disabled={busy || (!hasFile && !edit.bodyText.trim())}
                      onClick={() => saveEdit(c)}
                      style={{ ...ACTION_BTN, color: T.yellow, opacity: busy ? 0.5 : 1 }}
                    >
                      {busy ? "Saving…" : "Save"}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => { setEdit(null); setError(null); }}
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
                      </p>
                      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => deleteCapture(c)}
                          style={{ ...ACTION_BTN, color: T.pink, opacity: busy ? 0.5 : 1 }}
                        >
                          {busy ? "Deleting…" : "Delete"}
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => { setConfirmId(null); setError(null); }}
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
                        disabled={!online || busy}
                        title={online ? "Edit this trace" : "You're offline — editing needs a connection"}
                        onClick={() => {
                          setError(null);
                          setConfirmId(null);
                          setEdit({
                            captureId: c.captureId,
                            bodyText: c.bodyText,
                            quoteSpeaker: c.quoteSpeaker,
                            visibility: c.visibility,
                          });
                        }}
                        style={{ ...ACTION_BTN, color: online ? T.teal : T.dim, cursor: online ? "pointer" : "not-allowed" }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={!online || busy}
                        title={online ? "Delete this trace" : "You're offline — deleting needs a connection"}
                        onClick={() => { setError(null); setEdit(null); setConfirmId(c.captureId); }}
                        style={{ ...ACTION_BTN, color: online ? T.muted : T.dim, cursor: online ? "pointer" : "not-allowed" }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </>
              )}

              {rowError && (
                <p role="alert" style={{ fontFamily: FONT.dm, fontSize: 12.5, color: T.pink, margin: "8px 0 0" }}>
                  {rowError}
                </p>
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
