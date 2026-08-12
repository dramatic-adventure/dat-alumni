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

import {
  getAll,
  get as getOne,
  getMedia,
  update,
  remove,
  type QueuedCapture,
  type CaptureMedia,
} from "@/lib/captureQueue";
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
  // A row whose media can't be read is counted as failed even if its status
  // still reads "pending". It is never going to upload, and showing it as
  // pending forever is exactly the false reassurance this queue kept giving.
  counts = {
    pending: items.filter((i) => i.status !== "failed" && !i.mediaLost).length,
    failed: items.filter((i) => i.status === "failed" || i.mediaLost).length,
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

/** `media` is the already-materialized payload from captureQueue.getMedia().
 *  Bytes are read as their own step, before any of this, so a media failure is
 *  reported separately from a network failure. */
function buildFormData(item: QueuedCapture, media?: CaptureMedia): FormData {
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
  if (media) {
    // The route names the Drive file from the MIME and strips any ;codecs= param,
    // so the File name here is immaterial.
    fd.set("file", new File([media.bytes], item.captureId, { type: media.type }));
  }
  return fd;
}

async function retry(item: QueuedCapture, lastError: string): Promise<void> {
  const attempts = item.attempts + 1;
  if (attempts >= MAX_ATTEMPTS) {
    // Transient exhaustion (network/5xx/timeout) — permanent:false so a later
    // reconnect/return auto-revives it (see resume()).
    await update({ ...item, status: "failed", attempts, lastError, nextAttemptAt: undefined, permanent: false });
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

/**
 * Park a capture whose media cannot be read. No number of retries can conjure
 * bytes back, so this is permanent — it stops the drainer hammering the most
 * fragile row in the database, which is how the damage compounded in the first
 * place. For an old-shape row this write is a deliberate no-op (captureQueue
 * refuses to rewrite a row it just failed to read); the mediaLost flag it
 * derives on read is what actually keeps isDue() away from it.
 */
async function markMediaLost(item: QueuedCapture): Promise<void> {
  await update({
    ...item,
    status: "failed",
    lastError:
      item.mediaLostReason
        ? `MEDIA UNREADABLE: ${item.mediaLostReason} — the recording can no longer be read off this device.`
        : "MEDIA UNREADABLE — the recording can no longer be read off this device.",
    nextAttemptAt: undefined,
    permanent: true,
  });
}

async function markFailed(item: QueuedCapture, res: Response): Promise<void> {
  const data = (await res.json().catch(() => null)) as { error?: string } | null;
  await update({
    ...item,
    status: "failed",
    lastError: data?.error || `Failed (${res.status})`,
    nextAttemptAt: undefined,
    permanent: true, // a 4xx needs a human — never auto-resumed.
  });
}

async function send(item: QueuedCapture): Promise<void> {
  // NOTE: lastError is deliberately PRESERVED here. It used to be cleared at the
  // top of every send, which meant a row abandoned mid-attempt (page closed, iOS
  // suspended the app) lost the only record of why its previous attempts had
  // failed. Three voice notes sat unsent for six days and the queue could not
  // say why, because each new attempt erased the evidence before dying itself.
  // A successful send removes the row entirely, and retry()/markFailed() both
  // overwrite lastError, so keeping it here can never surface a stale message.
  await update({ ...item, status: "syncing" });
  await refreshCounts();

  // RE-READ THE ROW AFTER THE STATUS WRITE — do not reuse `item`.
  //
  // Since v6 the status write above cannot touch this capture's bytes at all
  // (media lives in its own store — see lib/captureQueue), which is what makes
  // the whole retry path safe. The re-read stays for two reasons that still
  // hold: `item` came from an earlier getAll() and may be stale, and for an
  // old-shape row the write above is the moment its media was migrated out —
  // or found unreadable. This is where we learn which.
  //
  // For the record, because it cost days: `item`'s Blob handle used to be the
  // problem. put() re-stored the Blob, WebKit invalidated the handle the caller
  // still held, and reading it threw "object can not be found" — which fetch
  // surfaced as the same opaque "Load failed" a dead network gives you. Three
  // voice notes died building the request body, never reaching the network,
  // while the recordings themselves were perfectly intact (they exported and
  // played back fine). A fourth in the same queue uploaded normally; whether
  // the stale handle still resolved came down to timing.
  //
  // If the row has vanished (removed by a concurrent drain) there is nothing
  // to send.
  const fresh = await getOne(item.captureId);
  if (!fresh) return;
  const current = fresh;

  if (current.mediaLost) {
    await markMediaLost(current);
    return;
  }

  // READ THE MEDIA AS ITS OWN STEP, BEFORE THE NETWORK.
  //
  // buildFormData() used to be passed straight into fetchWithTimeout as an
  // argument, so reading the recording and reaching the network happened inside
  // one try/catch — and `new File([blob])` doesn't read anything, the bytes are
  // only pulled while fetch streams the body. A dead Blob handle and a dead
  // network therefore produced a byte-identical "Load failed" in lastError.
  // That ambiguity is why this took days to pin down. Keeping the read separate
  // keeps the two failures distinguishable for good.
  //
  // mediaSize is metadata, so this asks for bytes only when there are bytes.
  let media: CaptureMedia | undefined;
  if (current.mediaSize) {
    media = await getMedia(current.captureId);
    if (!media) {
      // getMedia() has already recorded why; re-read to pick up the reason.
      await markMediaLost((await getOne(current.captureId)) ?? current);
      return;
    }
  }

  // Route on the real byte length, now that we're holding it.
  if (media && media.bytes.byteLength > DIRECT_MAX_BYTES) {
    await sendChunked(current, media);
    return;
  }

  const startedAt = Date.now();
  let res: Response;
  try {
    res = await fetchWithTimeout(
      ENDPOINT,
      { method: "POST", body: buildFormData(current, media) },
      media ? BLOB_TIMEOUT_MS : TEXT_TIMEOUT_MS
    );
  } catch (e) {
    // Rich context straight into lastError, which the outbox page already dumps.
    // ELAPSED TIME IS THE TELL: a failure after tens of milliseconds never left
    // the device; one after many seconds is a genuine network or server problem.
    const ms = Date.now() - startedAt;
    const name = e instanceof Error ? e.name : "Unknown";
    const msg = e instanceof Error ? e.message : "Network error";
    const online = typeof navigator !== "undefined" ? navigator.onLine : "?";
    await retry(
      current,
      `NETWORK: ${msg} [${name} after ${ms}ms, online=${online}, ${media?.bytes.byteLength ?? 0}B]`
    );
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
async function sendChunked(item: QueuedCapture, media: CaptureMedia): Promise<void> {
  // The bytes were read once by send() and are held in memory for the whole
  // upload. The loop below calls update() after every chunk to persist the
  // resume pointer; those writes are metadata-only now, but slicing from a
  // buffer rather than re-reading storage per chunk is still the right shape —
  // it is one read for a recording that may take a dozen requests to deliver.
  // Capped by the server's 25 MB limit, so this is bounded.
  const bytes = media.bytes;
  const blobType = media.type;
  const total = Math.ceil(bytes.byteLength / CHUNK_BYTES);

  for (let seq = Math.min(item.uploadedChunks ?? 0, total); seq < total; seq++) {
    const fd = new FormData();
    fd.set("captureId", item.captureId);
    fd.set("seq", String(seq));
    fd.set("total", String(total));
    if (item.asId) fd.set("asId", item.asId);
    const start = seq * CHUNK_BYTES;
    fd.set(
      "chunk",
      // Sliced from the in-memory buffer — see above.
      new File([bytes.slice(start, start + CHUNK_BYTES)], `${item.captureId}.${seq}`, {
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
    // Persist progress so a later retry resumes here instead of restarting,
    // and emit so the UI ("Uploading x/y") tracks the upload live.
    await update({ ...item, status: "syncing", uploadedChunks: seq + 1 });
    await refreshCounts();
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
          blobType,
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
  // "syncing" is NOT due. Orphans are reclaimed by reclaimOrphans() before the
  // drain loop starts, so anything still marked syncing at this point is the
  // item this very drain has in flight — re-picking it would double-send.
  //
  // This used to `return true` unconditionally, which turned any row that could
  // not complete into a poison pill: getAll() yields rows in captureId (ULID,
  // so chronological) order, the oldest orphan was therefore re-picked on EVERY
  // drain, and everything behind it starved. Observed in the field 2026-07:
  // one stuck voice note held two others at attempts:0 — never tried even once
  // — for six days.
  if (item.status === "syncing") return false;
  if (item.status === "failed") return false;
  // No retry can conjure bytes back, and retrying is what compounded the damage
  // in the first place — every attempt used to rewrite the record it was trying
  // to read. Park it and let the outbox explain itself to the artist.
  if (item.mediaLost) return false;
  return !item.nextAttemptAt || item.nextAttemptAt <= now;
}

// Fold rows abandoned mid-send by a previous session back into the normal
// retry schedule: count the abandonment as an attempt and apply backoff, so the
// row still retries but takes its turn instead of monopolising the head of the
// queue. Runs once per drain(), before the loop — never while a send is live.
async function reclaimOrphans(): Promise<void> {
  const items = await getAll();
  for (const i of items) {
    if (i.status !== "syncing") continue;
    if (i.mediaLost) {
      await markMediaLost(i);
      continue;
    }
    const attempts = i.attempts + 1;
    const lastError = i.lastError || "Upload interrupted — the app closed mid-upload";
    if (attempts >= MAX_ATTEMPTS) {
      // permanent:false — a reconnect/return can still revive it via resume().
      await update({ ...i, status: "failed", attempts, lastError, nextAttemptAt: undefined, permanent: false });
    } else {
      await update({ ...i, status: "pending", attempts, lastError, nextAttemptAt: Date.now() + backoffFor(attempts) });
    }
  }
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
    // Before anything is picked: hand rows stranded by a previous session back
    // to the normal schedule, so one un-completable item can't starve the rest.
    await reclaimOrphans();
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
// Manual override: revives EVERY failed item, including permanent 4xx ones.
export async function retryFailed(): Promise<void> {
  const items = await getAll();
  for (const i of items) {
    // mediaLost is the one thing this override does NOT clear. Every other
    // parked state is a judgement call a human can overrule; missing bytes are
    // not, and re-queueing them only puts the drainer back on the row it must
    // leave alone.
    if (i.status === "failed" && !i.mediaLost) {
      await update({ ...i, status: "pending", attempts: 0, nextAttemptAt: undefined, lastError: undefined, permanent: false });
    }
  }
  await refreshCounts();
  void drain();
}

// Auto-recovery on reconnect/return: revive ONLY items parked by transient
// exhaustion (network/5xx/timeout), never permanent 4xx failures (those need a
// human or the manual retry chip). Wired to online + visibilitychange in
// start(), so backgrounding the app and coming back finishes the queue from
// where it left off — no manual tap.
export async function resume(): Promise<void> {
  const items = await getAll();
  for (const i of items) {
    if (i.status === "failed" && !i.permanent && !i.mediaLost) {
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
  // resume() (not drain()) so returning to the app or regaining connectivity
  // also revives transiently-failed items, not just the still-pending ones.
  window.addEventListener("online", () => void resume());
  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") void resume();
    });
  }
  void refreshCounts();
  void drain();
}
