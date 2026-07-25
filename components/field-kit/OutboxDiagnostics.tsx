// components/field-kit/OutboxDiagnostics.tsx
//
// On-device outbox inspector. Reads the three offline queues straight out of
// IndexedDB and shows the RAW row state — status, attempts, byte size, chunk
// progress, and the last recorded error.
//
// WHY THIS EXISTS: the Traces chip renders `status` verbatim, so a row left at
// "syncing" by a session that died mid-upload is indistinguishable from one
// that's genuinely in flight right now. That ambiguity burned two rounds of
// remote debugging. Worse, the only way to see the truth was Safari Web
// Inspector over a USB cable — useless for a touring cohort where the stuck
// captures are on someone else's phone in another country.
//
// So: any artist can open this page, read what's actually wrong, tap Copy
// diagnostics, and paste the result into a message. No cable, no laptop.
//
// It also carries the self-service unstick (Force retry everything), which
// resets orphaned "syncing" and parked "failed" rows back to pending and kicks
// all three drainers — the thing that previously required pasting JS into a
// console.
//
// READ-ONLY on media: nothing here mutates or drops a capture's blob. The
// worst it can do is re-queue something for another upload attempt.

"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { T, FONT } from "@/components/field-kit/tokens";
import { getAll as getCaptures, update as updateCapture } from "@/lib/captureQueue";
import { getAll as getOps, update as updateOp } from "@/lib/opsQueue";
import { getAll as getTraceMutations, update as updateTraceMutation } from "@/lib/traceMutationQueue";
import { DIRECT_MAX_BYTES, CHUNK_BYTES } from "@/lib/captureChunkContract";
import { kick } from "@/lib/captureSync";
import { kick as kickOps } from "@/lib/opsSync";
import { kick as kickTraceMutations } from "@/lib/traceMutationSync";

type Row = {
  queue: "capture" | "ops" | "trace-mutation";
  id: string;
  label: string;
  status: string;
  attempts: number;
  createdAt: string;
  /** undefined for non-media rows; null means the row claims media but the blob is GONE. */
  bytes?: number | null;
  chunks?: string;
  nextAttemptAt?: number;
  lastError?: string;
  permanent?: boolean;
};

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function fmtAge(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms)) return "—";
  const mins = Math.floor(ms / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function OutboxDiagnostics() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [readError, setReadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      const [caps, ops, muts] = await Promise.all([getCaptures(), getOps(), getTraceMutations()]);

      const capRows: Row[] = caps.map((c) => {
        // A media capture whose blob has been evicted is unrecoverable — surface
        // it loudly rather than letting it look like a normal pending row.
        const isMedia = c.kind === "photo" || c.kind === "voice";
        const bytes = c.blob ? c.blob.size : isMedia ? null : undefined;
        const chunked = c.blob && c.blob.size > DIRECT_MAX_BYTES;
        return {
          queue: "capture",
          id: c.captureId,
          label: c.kind,
          status: c.status,
          attempts: c.attempts,
          createdAt: c.createdAt,
          bytes,
          ...(chunked && c.blob
            ? {
                chunks: `${Math.min(c.uploadedChunks ?? 0, Math.ceil(c.blob.size / CHUNK_BYTES))}/${Math.ceil(
                  c.blob.size / CHUNK_BYTES
                )}`,
              }
            : {}),
          ...(c.nextAttemptAt ? { nextAttemptAt: c.nextAttemptAt } : {}),
          ...(c.lastError ? { lastError: c.lastError } : {}),
          ...(c.permanent ? { permanent: true } : {}),
        };
      });

      const opRows: Row[] = ops.map((o) => ({
        queue: "ops",
        id: o.opId,
        label: o.kind,
        status: o.status,
        attempts: o.attempts,
        createdAt: o.createdAt,
        ...(o.nextAttemptAt ? { nextAttemptAt: o.nextAttemptAt } : {}),
        ...(o.lastError ? { lastError: o.lastError } : {}),
        ...(o.permanent ? { permanent: true } : {}),
      }));

      const mutRows: Row[] = muts.map((m) => ({
        queue: "trace-mutation",
        id: m.mutationId,
        label: m.action,
        status: m.status,
        attempts: m.attempts,
        createdAt: m.createdAt,
        ...(m.nextAttemptAt ? { nextAttemptAt: m.nextAttemptAt } : {}),
        ...(m.lastError ? { lastError: m.lastError } : {}),
        ...(m.permanent ? { permanent: true } : {}),
      }));

      setRows([...capRows, ...opRows, ...mutRows]);
      setReadError(null);
    } catch (e) {
      // An IndexedDB read that throws is itself a finding worth reporting.
      setReadError(e instanceof Error ? e.message : "Could not read the outbox");
      setRows([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Reset every non-pending row (orphaned "syncing" AND parked "failed",
  // including permanent 4xx ones) back to a clean pending state, then drain.
  // This is the manual override — it deliberately ignores the permanent flag,
  // because the artist tapping it is the human that flag was waiting for.
  const forceRetryAll = useCallback(async () => {
    setBusy(true);
    try {
      const [caps, ops, muts] = await Promise.all([getCaptures(), getOps(), getTraceMutations()]);
      const reset = { status: "pending" as const, attempts: 0, nextAttemptAt: undefined, lastError: undefined, permanent: false };
      await Promise.all([
        ...caps.filter((c) => c.status !== "pending").map((c) => updateCapture({ ...c, ...reset })),
        ...ops.filter((o) => o.status !== "pending").map((o) => updateOp({ ...o, ...reset })),
        ...muts.filter((m) => m.status !== "pending").map((m) => updateTraceMutation({ ...m, ...reset })),
      ]);
      kick();
      kickOps();
      kickTraceMutations();
      await load();
    } finally {
      setBusy(false);
    }
  }, [load]);

  const copyDiagnostics = useCallback(async () => {
    const payload = {
      capturedAt: new Date().toISOString(),
      online: typeof navigator !== "undefined" ? navigator.onLine : null,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      readError,
      rows,
    };
    const text = JSON.stringify(payload, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard blocked (non-secure context / permission) — the <pre> below
      // is always rendered so the text can still be selected by hand.
      setCopied(false);
    }
  }, [rows, readError]);

  if (rows === null) {
    return <p style={{ ...BODY, padding: "0 16px" }}>Reading the outbox…</p>;
  }

  return (
    <div style={{ padding: "0 16px 32px" }}>
      <p style={EYEBROW}>Outbox diagnostics</p>
      <h1 style={TITLE}>{rows.length === 0 ? "Nothing queued" : `${rows.length} queued ${rows.length === 1 ? "item" : "items"}`}</h1>

      <p style={BODY}>
        This is the raw state of everything still on this phone. If something is stuck, tap{" "}
        <strong style={{ color: T.ink }}>Copy diagnostics</strong> and send it to Jesse.
      </p>

      {readError && (
        <p style={{ ...BODY, color: T.pink }}>
          Could not read the local database: {readError}. That itself is the problem — report it.
        </p>
      )}

      {rows.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "0 0 18px" }}>
          <button type="button" onClick={forceRetryAll} disabled={busy} style={{ ...CTA, opacity: busy ? 0.5 : 1 }}>
            {busy ? "Working…" : "Force retry everything"}
          </button>
          <button type="button" onClick={copyDiagnostics} style={SECONDARY}>
            {copied ? "Copied ✓" : "Copy diagnostics"}
          </button>
          <button type="button" onClick={() => void load()} style={SECONDARY}>
            Refresh
          </button>
        </div>
      )}

      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
        {rows.map((r) => {
          const stale = r.status === "syncing";
          const accent = r.status === "failed" ? T.pink : stale ? T.yellow : T.muted;
          return (
            <li key={`${r.queue}:${r.id}`} style={CARD}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 6 }}>
                <span style={{ ...CHIP, color: accent, borderColor: accent }}>
                  {r.label} · {r.status}
                </span>
                <span style={{ ...META, whiteSpace: "nowrap" }}>{fmtAge(r.createdAt)}</span>
              </div>

              <p style={META}>
                attempts {r.attempts}
                {r.bytes != null ? ` · ${fmtBytes(r.bytes)}` : ""}
                {r.chunks ? ` · chunks ${r.chunks}` : ""}
                {r.nextAttemptAt ? ` · retry in ${Math.max(0, Math.round((r.nextAttemptAt - Date.now()) / 1000))}s` : ""}
                {r.permanent ? " · needs a human" : ""}
              </p>

              {r.bytes === null && (
                <p style={{ ...META, color: T.pink }}>
                  Media bytes are missing from this device — this capture cannot be recovered.
                </p>
              )}

              {stale && r.attempts === 0 && (
                <p style={{ ...META, color: T.yellow }}>
                  Left mid-upload by a closed session and never retried. Tap Force retry everything.
                </p>
              )}

              {r.lastError && <p style={{ ...META, color: T.pink }}>{r.lastError}</p>}

              <p style={{ ...META, opacity: 0.5, wordBreak: "break-all" }}>{r.id}</p>
            </li>
          );
        })}
      </ul>

      {rows.length > 0 && (
        <>
          <p style={{ ...META, margin: "20px 0 6px" }}>
            Raw — select and copy if the button above doesn&apos;t work:
          </p>
          <pre style={PRE}>{JSON.stringify(rows, null, 2)}</pre>
        </>
      )}
    </div>
  );
}

const EYEBROW: CSSProperties = {
  fontFamily: FONT.grotesk,
  fontWeight: 700,
  fontSize: 10,
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  color: T.yellow,
  margin: "0 0 8px",
};

const TITLE: CSSProperties = {
  fontFamily: FONT.anton,
  fontSize: "clamp(22px, 6vw, 30px)",
  lineHeight: 1.05,
  textTransform: "uppercase",
  color: T.ink,
  margin: "0 0 12px",
};

const BODY: CSSProperties = {
  fontFamily: FONT.dm,
  fontSize: 13.5,
  lineHeight: 1.55,
  color: T.ink,
  opacity: 0.86,
  margin: "0 0 16px",
};

const CARD: CSSProperties = {
  background: T.card,
  border: `1px solid ${T.border}`,
  borderRadius: 12,
  padding: "12px 14px",
};

const CHIP: CSSProperties = {
  fontFamily: FONT.grotesk,
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  border: "1px dashed",
  borderRadius: 4,
  padding: "2px 7px",
};

const META: CSSProperties = {
  fontFamily: FONT.dm,
  fontSize: 12,
  lineHeight: 1.5,
  color: T.muted,
  margin: "0 0 2px",
};

const btnBase: CSSProperties = {
  fontFamily: FONT.grotesk,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  padding: "11px 15px",
  borderRadius: 9,
  cursor: "pointer",
};

const CTA: CSSProperties = { ...btnBase, background: T.yellow, color: T.black, border: "none" };

const SECONDARY: CSSProperties = {
  ...btnBase,
  background: "transparent",
  color: T.ink,
  border: `1px solid ${T.border}`,
};

const PRE: CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  fontSize: 10.5,
  lineHeight: 1.45,
  color: T.muted,
  background: T.card,
  border: `1px solid ${T.border}`,
  borderRadius: 10,
  padding: 12,
  margin: 0,
  overflowX: "auto",
  whiteSpace: "pre-wrap",
  wordBreak: "break-all",
};
