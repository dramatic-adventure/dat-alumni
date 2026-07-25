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

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { T, FONT } from "@/components/field-kit/tokens";
import { getAll as getCaptures, update as updateCapture } from "@/lib/captureQueue";
import { getAll as getOps, update as updateOp } from "@/lib/opsQueue";
import { getAll as getTraceMutations, update as updateTraceMutation } from "@/lib/traceMutationQueue";
import { DIRECT_MAX_BYTES, CHUNK_BYTES } from "@/lib/captureChunkContract";
import { clearFieldKitCaches } from "@/lib/fieldKitCache";
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

export default function OutboxDiagnostics({ build }: { build: string }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [readError, setReadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  // null until measured on the client — see the standalone note below.
  const [standalone, setStandalone] = useState<boolean | null>(null);
  // captureId → the live Blob, kept out of `rows` so the JSON dump stays small.
  const blobsRef = useRef<Map<string, Blob>>(new Map());
  // captureId → result of the readability probe.
  const [probe, setProbe] = useState<Record<string, string>>({});

  // WHICH CONTAINER AM I READING? On iOS an installed home-screen web app gets
  // its own IndexedDB, isolated from Safari's, even for an identical origin.
  // (Service Worker registration and CacheStorage ARE shared, which is what
  // makes the two contexts look identical while their outboxes are not.)
  // Without this check the page happily reports "Nothing queued" for a Safari
  // tab while the installed app holds a stranded backlog — a false negative
  // that reads as good news. navigator.standalone is the iOS signal; the
  // display-mode query covers installed PWAs elsewhere.
  useEffect(() => {
    const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
    const displayMode = window.matchMedia?.("(display-mode: standalone)")?.matches === true;
    setStandalone(iosStandalone || displayMode);
  }, []);

  const load = useCallback(async () => {
    try {
      const [caps, ops, muts] = await Promise.all([getCaptures(), getOps(), getTraceMutations()]);

      blobsRef.current = new Map(caps.filter((c) => c.blob).map((c) => [c.captureId, c.blob as Blob]));

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
      build,
      capturedAt: new Date().toISOString(),
      online: typeof navigator !== "undefined" ? navigator.onLine : null,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      readError,
      rows,
    } as const;
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
  }, [rows, readError, build]);

  // DECISIVE TEST for a "Load failed" upload error. A Blob in IndexedDB reports
  // `size` from metadata, but its bytes live in a separate file-backed store —
  // so a Blob whose backing bytes are gone still reports the right size and only
  // throws when something actually READS it. fetch() reading that Blob to build
  // a request body is exactly such a read, and WebKit reports the failure as the
  // generic "Load failed" — indistinguishable from a network error. Reading it
  // here tells the two apart:
  //   readable → bytes are intact; the upload is failing on the network/server
  //   throws   → the media is gone from this device and no retry can ever work
  // Always re-read the row before touching its Blob. A handle cached from an
  // earlier getAll() goes stale as soon as the drainer rewrites that record,
  // and reading it then throws "object can not be found" even though the bytes
  // are perfectly intact on disk. Probing a stale handle reports healthy media
  // as lost — which is exactly the false alarm this page raised in July 2026.
  const freshBlob = useCallback(async (id: string): Promise<Blob | undefined> => {
    const caps = await getCaptures();
    return caps.find((c) => c.captureId === id)?.blob;
  }, []);

  const verifyMedia = useCallback(async (id: string) => {
    const blob = await freshBlob(id);
    if (!blob) {
      setProbe((p) => ({ ...p, [id]: "No media attached to this row." }));
      return;
    }
    setProbe((p) => ({ ...p, [id]: "Reading…" }));
    try {
      const buf = await blob.arrayBuffer();
      setProbe((p) => ({
        ...p,
        [id]:
          buf.byteLength === blob.size
            ? `Readable — all ${buf.byteLength} bytes intact. The recording is fine; the upload is failing on the network.`
            : `Readable but SHORT — ${buf.byteLength} of ${blob.size} bytes.`,
      }));
    } catch (e) {
      setProbe((p) => ({
        ...p,
        [id]: `UNREADABLE — ${e instanceof Error ? e.message : "read failed"}. Try Refresh, then check again before treating this as lost.`,
      }));
    }
  }, [freshBlob]);

  // Get the recording OFF the phone regardless of whether sync ever works.
  // Web Share with a File is the iOS-native path (AirDrop, Files, Messages);
  // the object-URL download is the fallback everywhere else.
  const saveMedia = useCallback(async (id: string, kind: string) => {
    const blob = await freshBlob(id);
    if (!blob) return;
    const ext = (blob.type.split("/")[1] || "bin").split(";")[0];
    const name = `${kind}-${id}.${ext}`;
    const file = new File([blob], name, { type: blob.type || "application/octet-stream" });
    const nav = navigator as Navigator & {
      canShare?: (d: { files: File[] }) => boolean;
      share?: (d: { files: File[]; title?: string }) => Promise<void>;
    };
    if (nav.canShare?.({ files: [file] }) && nav.share) {
      try {
        await nav.share({ files: [file], title: name });
        return;
      } catch {
        // Cancelled or unsupported for this payload — fall through to download.
      }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }, [freshBlob]);

  // Bulk rescue. The queue is the ONLY copy of these recordings — there is no
  // server-side backup of anything that hasn't synced, and IndexedDB is not
  // durable storage: iOS can evict it under space pressure, and deleting or
  // reinstalling the home-screen app destroys the whole container. So getting
  // the bytes off the device is strictly more urgent than fixing the upload.
  const saveAllMedia = useCallback(async () => {
    // Re-read every row here too — cached handles may already be stale.
    const caps = await getCaptures();
    const files: File[] = [];
    for (const c of caps) {
      if (!c.blob) continue;
      const ext = (c.blob.type.split("/")[1] || "bin").split(";")[0];
      files.push(
        new File([c.blob], `capture-${c.captureId}.${ext}`, {
          type: c.blob.type || "application/octet-stream",
        })
      );
    }
    if (!files.length) return;
    const nav = navigator as Navigator & {
      canShare?: (d: { files: File[] }) => boolean;
      share?: (d: { files: File[]; title?: string }) => Promise<void>;
    };
    if (nav.canShare?.({ files }) && nav.share) {
      try {
        await nav.share({ files, title: "Field Kit captures" });
        return;
      } catch {
        // Cancelled, or too many files for one share — fall through.
      }
    }
    // Fallback: one download at a time, spaced so the browser doesn't drop them.
    for (const f of files) {
      const url = URL.createObjectURL(f);
      const a = document.createElement("a");
      a.href = url;
      a.download = f.name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      await new Promise((r) => setTimeout(r, 800));
    }
  }, []);

  // FORCE THE APP ONTO THE LATEST CODE.
  //
  // sw.js caches hashed chunks and deliberately does not purge them on routine
  // deploys, so an installed iOS app can keep running an old bundle long after a
  // fix ships. That bit hard in July 2026: a NEW route (this page) was fetched
  // fresh while the layout's chunks — which is where the capture drainer
  // actually lives — kept being served stale. Every "deploy and retest" cycle
  // was testing code the phone had never downloaded.
  //
  // SAFETY: this clears Cache Storage (the fk-* caches) and unregisters the
  // service worker. It NEVER touches IndexedDB, so queued captures and their
  // media are untouched. That distinction matters — "clear website data" in
  // Safari settings WOULD destroy the recordings, and nobody should be reaching
  // for that as a workaround.
  const forceUpdate = useCallback(async () => {
    setBusy(true);
    try {
      await clearFieldKitCaches();
      if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister().catch(() => false)));
      }
    } finally {
      // Full reload, bypassing any in-memory module state.
      window.location.href = `/field-kit/outbox?fresh=${Date.now()}`;
    }
  }, []);

  if (rows === null) {
    return <p style={{ ...BODY, padding: "0 16px" }}>Reading the outbox…</p>;
  }

  return (
    <div style={{ padding: "0 16px 32px" }}>
      <p style={EYEBROW}>Outbox diagnostics · build {build}</p>

      {/* Always available, never gated on the queue: if the app is running stale
          code, that is precisely when nothing else on this page can be trusted. */}
      <div style={{ margin: "0 0 14px" }}>
        <button type="button" onClick={() => void forceUpdate()} disabled={busy} style={TINY}>
          {busy ? "Updating…" : "Force app update (safe — keeps your recordings)"}
        </button>
      </div>
      <h1 style={TITLE}>{rows.length === 0 ? "Nothing queued" : `${rows.length} queued ${rows.length === 1 ? "item" : "items"}`}</h1>

      <p style={BODY}>
        This is the raw state of everything still on this phone. If something is stuck, tap{" "}
        <strong style={{ color: T.ink }}>Copy diagnostics</strong> and send it to Jesse.
      </p>

      {standalone === false && (
        <div style={WARN}>
          <p style={{ ...EYEBROW, color: T.pink, margin: "0 0 6px" }}>Wrong outbox</p>
          <p style={{ ...BODY, margin: 0 }}>
            You&apos;re in a <strong style={{ color: T.ink }}>browser tab</strong>. On iPhone the
            Field&nbsp;Kit you open from your <strong style={{ color: T.ink }}>home-screen icon</strong>{" "}
            keeps a completely separate outbox from this one — so what you see below is{" "}
            <strong style={{ color: T.ink }}>not</strong> the queue holding your captures.
            {rows.length === 0 ? " “Nothing queued” here does not mean nothing is stuck." : ""}
          </p>
          <p style={{ ...BODY, margin: "10px 0 0" }}>
            Close this tab, open the Field&nbsp;Kit from your home-screen icon, and reach this page
            from the account menu there.
          </p>
        </div>
      )}

      {standalone === true && (
        <p style={{ ...META, color: T.green, margin: "0 0 16px" }}>
          Reading the installed app&apos;s outbox — this is the right one.
        </p>
      )}

      {readError && (
        <p style={{ ...BODY, color: T.pink }}>
          Could not read the local database: {readError}. That itself is the problem — report it.
        </p>
      )}

      {/* Rescue is the FIRST action offered, ahead of any retry: an unsynced
          capture exists in exactly one place on earth, and that place is a
          phone. Retrying can wait; losing the recording cannot be undone. */}
      {blobsRef.current.size > 0 && (
        <div style={RESCUE}>
          <p style={{ ...EYEBROW, color: T.green, margin: "0 0 6px" }}>Protect this work first</p>
          <p style={{ ...BODY, margin: "0 0 12px" }}>
            {blobsRef.current.size} recording{blobsRef.current.size === 1 ? "" : "s"} here{" "}
            {blobsRef.current.size === 1 ? "exists" : "exist"} <strong style={{ color: T.ink }}>only
            on this phone</strong>. Save {blobsRef.current.size === 1 ? "it" : "them"} somewhere else
            now — AirDrop to a laptop, or Save to Files. Do this before troubleshooting anything.
          </p>
          <button type="button" onClick={() => void saveAllMedia()} style={{ ...CTA, background: T.green, color: T.black }}>
            Save all recordings off this phone
          </button>
        </div>
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

              {/* "Load failed" is WebKit's generic fetch rejection — it cannot
                  distinguish a dead network from an unreadable Blob. These two
                  buttons settle it, and rescue the audio either way. */}
              {r.queue === "capture" && r.bytes != null && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "8px 0 4px" }}>
                  <button type="button" onClick={() => void verifyMedia(r.id)} style={TINY}>
                    Check media
                  </button>
                  <button type="button" onClick={() => void saveMedia(r.id, r.label)} style={TINY}>
                    Save off phone
                  </button>
                </div>
              )}

              {probe[r.id] && (
                <p
                  style={{
                    ...META,
                    color: probe[r.id].startsWith("UNREADABLE") ? T.pink : T.green,
                  }}
                >
                  {probe[r.id]}
                </p>
              )}

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

const RESCUE: CSSProperties = {
  background: T.card,
  border: `1px solid ${T.green}`,
  borderRadius: 12,
  padding: "14px 16px",
  margin: "0 0 18px",
};

const TINY: CSSProperties = {
  fontFamily: FONT.grotesk,
  fontSize: 9.5,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  padding: "7px 11px",
  borderRadius: 7,
  background: "transparent",
  color: T.ink,
  border: `1px solid ${T.border}`,
  cursor: "pointer",
};

const WARN: CSSProperties = {
  background: T.card,
  border: `1px solid ${T.pink}`,
  borderRadius: 12,
  padding: "14px 16px",
  margin: "0 0 18px",
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
