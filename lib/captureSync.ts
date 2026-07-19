// lib/captureSync.ts
//
// Slice C — client-only drainer for the Field Kit capture queue. Module-level
// singleton: it processes due items serially against /api/field-kit/capture,
// classifies each response, and reschedules with exponential backoff.
//
// Two network paths: blobs ≤ DIRECT_MAX_BYTES post as one multipart/form-data
// request (the route's parser accepts note/quote too, file optional); larger
// blobs (big voice notes and photos) go chunked via
// /api/field-kit/capture/chunk + a JSON finalize, because Netlify's
// Lambda-backed routes cap request bodies at ~6 MB. Chunking is byte-exact —
// no client-side recompression, so media quality is never degraded in transit.
// Every request runs through fetchWithTimeout so a stalled connection can
// NEVER wedge the serial drain loop (the bug that used to leave items at
// "waiting to sync" forever).
//
// Delivery contract: at-least-once on the wire (retries) → exactly-once in the
// sheet, because the route dedups on captureId and returns {ok:true, deduped:true}
// for a replay. SSR-safe: no browser API touched at module load; start() guards
// window/document before wiring triggers.

import { getAll, update, remove, type QueuedCapture } from "@/lib/captureQueue";
import { fetchWithTimeout, TEXT_TIMEOUT_MS, BLOB_TIMEOUT_MS } from "@/lib/syncFetch";
import { DIRECT_MAX_BYTES, CHUNK_BYTES } from "@/lib/captureChunkContract";

const ENDPOINT = "/api/field-kit/capture";
const CHUNK_ENDPOINT = "/api/field-kit/capture/chunk";
const MAX_ATTEMPTS = 8;
const BASE_BACKOFF_MS = 5_000; // first retry ~5s, doubling
const MAX_BACKOFF_MS = 5 * 60_000; // cap ~5 min

// 4xx that need a human — never auto-retried.
const PERMANENT = new Set([400, 401, 403, 413, 415]);

export type SyncCounts = { pending: number; failed: number };
type Listener = (counts: SyncCounts) => void;

const listeners = new Set<Listener>();
let counts: SyncCounts = { pending: 0, failed: 0 };

let draining = false;
let drainRequested = false; // a kick arrived mid-drain → loop once more
let started = false;
let backoffTimer: ReturnType<typeof setTimeout> | null = null;

function emit() {
  for (const l of listeners) l(counts);
}

async function refreshCounts() {
  const items = await getAll();
  counts = {
    pending: items.filter((i) => i.status !== "failed").length,
    failed: items.filter((i) => i.status === "failed").length,
  };
  emit();
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  listener(counts);
  return () => {
    listeners.delete(listener);
  };
}

export function getCounts(): SyncCounts {
  return counts;
}

function backoffFor(attempts: number): number {
  return Math.min(BASE_BACKOFF_MS * 2 ** (attempts - 1), MAX_BACKOFF_MS);
}

function buildFormData(item: QueuedCapture): FormData {
  const fd = new FormData();
  fd.set("captureId", item.captureId);
  fd.set("kind", item.kind);
  fd.set("bodyText", item.bodyText);
  fd.set("createdAt", item.createdAt);
  if (item.dayIndex) fd.set("dayIndex", item.dayIndex);
  if (item.chapterId) fd.set("chapterId", item.chapterId);
  if (item.visibility) fd.set("visibility", item.visibility);
  if (item.quoteSpeaker) fd.set("quoteSpeaker", item.quoteSpeaker);
  if (item.asId) fd.set("asId", item.asId);
  if (item.blob) {
    // The route names the Drive file from the MIME and strips any ;codecs= param,
    // so the File name here is immaterial.
    const type = item.blobType || item.blob.type || "application/octet-stream";
    fd.set("file", new File([item.blob], item.captureId, { type }));
  }
  return fd;
}

async function retry(item: QueuedCapture, lastError: string): Promise<void> {
  const attempts = item.attempts + 1;
  if (attempts >= MAX_ATTEMPTS) {
    await update({ ...item, status: "failed", attempts, lastError, nextAttemptAt: undefined });
    return;
  }
  await update({
    ...item,
    status: "pending",
    attempts,
    lastError,
    nextAttemptAt: Date.now() + backoffFor(attempts),
  });
}

async function markFailed(item: QueuedCapture, res: Response): Promise<void> {
  const data = (await res.json().catch(() => null)) as { error?: string } | null;
  await update({
    ...item,
    status: "failed",
    lastError: data?.error || `Failed (${res.status})`,
    nextAttemptAt: undefined,
  });
}

async function send(item: QueuedCapture): Promise<void> {
  await update({ ...item, status: "syncing", lastError: undefined });
  await refreshCounts();

  // DELIBERATELY NO client-side compression/re-encoding: originals upload
  // byte-exact (the server already normalizes photos via sharp — see
  // lib/normalizeUploadImage — and a client re-encode would double-compress).
  // Blobs above the direct-body ceiling take the lossless chunked path.
  const current = item;
  if (current.blob && current.blob.size > DIRECT_MAX_BYTES) {
    await sendChunked(current);
    return;
  }

  let res: Response;
  try {
    res = await fetchWithTimeout(
      ENDPOINT,
      { method: "POST", body: buildFormData(current) },
      current.blob ? BLOB_TIMEOUT_MS : TEXT_TIMEOUT_MS
    );
  } catch (e) {
    await retry(current, e instanceof Error ? e.message : "Network error");
    return;
  }

  if (res.ok) {
    // {ok:true}, including {deduped:true} for a replay.
    await remove(current.captureId);
    return;
  }
  if (PERMANENT.has(res.status)) {
    await markFailed(current, res);
    return;
  }
  // Retryable: network already handled above; here 5xx / 408 / 429 / anything else.
  await retry(current, `Server error (${res.status})`);
}

// Chunked path for blobs the Lambda body ceiling can't take in one request
// (large voice recordings and full-resolution photos): stage ~3 MB chunks
// via /capture/chunk, then finalize with a small JSON POST that the route
// reassembles server-side. uploadedChunks is the resume pointer — a retry
// after a dropped connection re-uploads only what's missing.
async function sendChunked(item: QueuedCapture): Promise<void> {
  const blob = item.blob;
  if (!blob) {
    await retry(item, "Missing blob for chunked upload");
    return;
  }
  const total = Math.ceil(blob.size / CHUNK_BYTES);

  for (let seq = Math.min(item.uploadedChunks ?? 0, total); seq < total; seq++) {
    const fd = new FormData();
    fd.set("captureId", item.captureId);
    fd.set("seq", String(seq));
    fd.set("total", String(total));
    if (item.asId) fd.set("asId", item.asId);
    const start = seq * CHUNK_BYTES;
    fd.set(
      "chunk",
      new File([blob.slice(start, start + CHUNK_BYTES)], `${item.captureId}.${seq}`, {
        type: "application/octet-stream",
      })
    );

    let res: Response;
    try {
      res = await fetchWithTimeout(CHUNK_ENDPOINT, { method: "POST", body: fd }, BLOB_TIMEOUT_MS);
    } catch (e) {
      await retry({ ...item, uploadedChunks: seq }, e instanceof Error ? e.message : "Network error");
      return;
    }
    if (!res.ok) {
      if (PERMANENT.has(res.status)) await markFailed({ ...item, uploadedChunks: seq }, res);
      else await retry({ ...item, uploadedChunks: seq }, `Server error (${res.status})`);
      return;
    }
    // Persist progress so a later retry resumes here instead of restarting.
    await update({ ...item, status: "syncing", uploadedChunks: seq + 1 });
  }

  let res: Response;
  try {
    res = await fetchWithTimeout(
      ENDPOINT,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          captureId: item.captureId,
          kind: item.kind,
          bodyText: item.bodyText,
          createdAt: item.createdAt,
          dayIndex: item.dayIndex ?? "",
          chapterId: item.chapterId ?? "",
          visibility: item.visibility ?? "",
          quoteSpeaker: item.quoteSpeaker ?? "",
          ...(item.asId ? { asId: item.asId } : {}),
          stagedChunkCount: total,
          blobType: item.blobType || blob.type || "application/octet-stream",
        }),
      },
      TEXT_TIMEOUT_MS
    );
  } catch (e) {
    await retry({ ...item, uploadedChunks: total }, e instanceof Error ? e.message : "Network error");
    return;
  }

  if (res.ok) {
    await remove(item.captureId);
    return;
  }
  if (res.status === 409) {
    // CHUNKS_INCOMPLETE — staging lost bytes; restart the chunk uploads.
    await retry({ ...item, uploadedChunks: 0 }, "Upload incomplete — retrying from the start");
    return;
  }
  if (PERMANENT.has(res.status)) {
    await markFailed({ ...item, uploadedChunks: total }, res);
    return;
  }
  await retry({ ...item, uploadedChunks: total }, `Server error (${res.status})`);
}

function isDue(item: QueuedCapture, now: number): boolean {
  // A "syncing" row left by a crashed/closed tab is orphaned — treat as due.
  if (item.status === "syncing") return true;
  if (item.status === "failed") return false;
  return !item.nextAttemptAt || item.nextAttemptAt <= now;
}

async function scheduleBackoffTimer(): Promise<void> {
  if (backoffTimer) {
    clearTimeout(backoffTimer);
    backoffTimer = null;
  }
  const now = Date.now();
  const waits = (await getAll())
    .filter((i) => i.status === "pending" && i.nextAttemptAt && i.nextAttemptAt > now)
    .map((i) => i.nextAttemptAt as number);
  if (!waits.length) return;
  const delay = Math.max(Math.min(...waits) - now, 1_000);
  backoffTimer = setTimeout(() => {
    backoffTimer = null;
    void drain();
  }, delay);
}

export async function drain(): Promise<void> {
  if (draining) {
    drainRequested = true; // don't drop a kick that lands mid-drain
    return;
  }
  draining = true;
  try {
    do {
      drainRequested = false;
      if (typeof navigator !== "undefined" && navigator.onLine === false) break;
      for (;;) {
        const now = Date.now();
        const due = (await getAll()).find((i) => isDue(i, now));
        if (!due) break;
        await send(due);
        await refreshCounts();
      }
    } while (drainRequested);
  } finally {
    draining = false;
    await refreshCounts();
    void scheduleBackoffTimer();
  }
}

export function kick(): void {
  void drain();
}

// Reset failed rows to pending so the user can retry them by hand, then drain.
export async function retryFailed(): Promise<void> {
  const items = await getAll();
  for (const i of items) {
    if (i.status === "failed") {
      await update({ ...i, status: "pending", attempts: 0, nextAttemptAt: undefined, lastError: undefined });
    }
  }
  await refreshCounts();
  void drain();
}

// Idempotent: wire connectivity triggers once, then prime counts + drain.
export function start(): void {
  if (started || typeof window === "undefined") return;
  started = true;
  window.addEventListener("online", () => void drain());
  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") void drain();
    });
  }
  void refreshCounts();
  void drain();
}
