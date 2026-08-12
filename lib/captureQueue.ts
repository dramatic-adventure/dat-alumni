// lib/captureQueue.ts
//
// Slice C — client-only IndexedDB queue for Field Kit captures. Every capture is
// written HERE first (instant, offline-safe); lib/captureSync then drains each to
// /api/field-kit/capture when connectivity allows. The captureId ULID doubles as
// the idempotency key, so at-least-once delivery on the wire becomes exactly-once
// in the sheet (the route dedups on captureId).
//
// ─────────────────────────────────────────────────────────────────────────────
// MEDIA LIVES IN ITS OWN STORE. THE QUEUE ROW HOLDS METADATA ONLY.
//
// It did not always. Capture bytes used to ride inline on the queue record as a
// Blob, and IndexedDB put() replaces the WHOLE record — so every metadata write
// (status → "syncing", attempts++, backoff, resume pointer) re-stored the media:
// it took a Blob handle that had just come out of IndexedDB and wrote it straight
// back in. On WebKit/iOS that round-trip breaks the Blob's backing-file
// reference. The bytes survive on disk, but the handle stops resolving, and any
// read of it throws NotFoundError. captureSync writes metadata 2–3 times per
// upload attempt against MAX_ATTEMPTS = 8, so a capture that could not complete
// was rewritten 16–24 times before it parked — 16–24 chances to break it.
//
// Confirmed in production (iOS 18.7, installed home-screen PWA):
//   "lastError": "MEDIA READ FAILED: NotFoundError: The object can not be found here. (1379647B)"
// Four voice notes stranded for six days; two never attempted at all.
//
// So: bytes are written ONCE, at enqueue, into CAPTURE_MEDIA_STORE, and are
// never rewritten by anything. update() is metadata-only and physically cannot
// persist a blob. The one rule this file exists to enforce:
//
//     NOTHING HERE EVER WRITES A `blob` FIELD INTO THE QUEUE STORE.
//
// Bytes are stored as an ArrayBuffer, not a Blob. An ArrayBuffer comes back
// with the record and has no separate backing file to lose — there is no second
// lookup left to fail. Every consumer needs the full bytes anyway (captureSync
// materializes them for both the direct and chunked paths; "Save off phone"
// builds a File), and callers that only need the size read mediaSize off the
// metadata, so nothing pays for this.
//
// MIGRATION (old rows, gentle by design). Rows queued before v6 still carry an
// inline blob. They are NOT rewritten eagerly — no upgrade-time pass over data
// this split exists to protect. Instead the first read that needs their bytes
// copies them across (media store first, THEN the inline copy is dropped, so a
// crash in between leaves two copies and never zero). If those bytes cannot be
// read back, the row is marked in CAPTURE_MEDIA_LOST_STORE and left BYTE-FOR-BYTE
// ALONE — see markMediaLost() for why the mark can't live on the row itself.
// Both shapes coexist safely until the old ones drain.
// ─────────────────────────────────────────────────────────────────────────────
//
// SSR-safe: every entry point no-ops cleanly when indexedDB is absent (no
// "server-only" import; this just guards the browser API).
//
// The "dat-field-kit" DB (and its version/upgrade) is owned by lib/fieldKitDb —
// the itinerary snapshot store (Slice 2) shares the same database, so the open
// path must be centralized to avoid an IndexedDB version conflict.

import {
  openDb,
  hasIDB,
  objectStore,
  objectStores,
  reqToPromise,
  txToPromise,
  CAPTURE_STORE,
  CAPTURE_MEDIA_STORE,
  CAPTURE_MEDIA_LOST_STORE,
} from "@/lib/fieldKitDb";

export type CaptureKind = "note" | "quote" | "photo" | "voice";
export type QueueStatus = "pending" | "syncing" | "failed";

// Slice 6 (Trace unification): "card" saves toward the artist's Journey Card
// (still private until they stamp); "sealed" never leaves the private journal —
// never reviewed, never publishable. Locked with Jesse 2026-07-02 (§4-R Q3).
export type CaptureVisibility = "card" | "sealed";

export type QueuedCapture = {
  captureId: string;
  kind: CaptureKind;
  bodyText: string;
  quoteSpeaker?: string;
  createdAt: string;
  dayIndex?: string;
  /** Itinerary chapter id (Slice 6) — derived from the current day's chapter. */
  chapterId?: string;
  /** Slice 6; absent (older queued items) means "card". */
  visibility?: CaptureVisibility;
  asId?: string;
  /**
   * LEGACY — inline media on rows queued before v6.
   *
   * Only ever READ, and only by this module (getMedia / the migration path).
   * enqueue() accepts it as the way a caller hands over media, and immediately
   * splits it out; get()/getAll() strip it so no caller can hold a handle and
   * hand it back to update(). Nothing writes it.
   */
  blob?: Blob;
  /** LEGACY companion to `blob`. New rows carry mediaType instead. */
  blobType?: string;
  /** Byte length of this capture's media. Written once at enqueue; derived
   *  from the inline blob for not-yet-migrated old rows. Absent = no media. */
  mediaSize?: number;
  /** MIME of this capture's media, as the server's allow-set expects it. */
  mediaType?: string;
  /** DERIVED ON READ, never persisted on the row — see markMediaLost(). True
   *  when this capture's media could not be read back and no retry can ever
   *  succeed. captureSync refuses to pick these up. */
  mediaLost?: boolean;
  /** DERIVED ON READ. Why the media read failed, for the outbox to display. */
  mediaLostReason?: string;
  status: QueueStatus;
  attempts: number;
  nextAttemptAt?: number;
  lastError?: string;
  /** True only when a 4xx parked this item (needs a human). Distinguishes it
   *  from transient exhaustion, which auto-resumes on reconnect/return — see
   *  captureSync.resume(). */
  permanent?: boolean;
  /** Chunked-upload resume pointer: chunks [0, uploadedChunks) are already
   *  staged server-side, so a retry after a dropped connection re-uploads only
   *  the remainder (see lib/captureSync sendChunked). */
  uploadedChunks?: number;
};

/** What getMedia() hands back: the bytes plus the MIME to send them as. */
export type CaptureMedia = { bytes: ArrayBuffer; type: string };

type MediaRecord = { captureId: string; bytes: ArrayBuffer; type: string };
type MediaLostRecord = { captureId: string; reason: string; at: number };

const DEFAULT_TYPE = "application/octet-stream";

function store(db: IDBDatabase, mode: IDBTransactionMode): IDBObjectStore {
  return objectStore(db, CAPTURE_STORE, mode);
}

/**
 * Strip every field that must never reach the queue store: the legacy inline
 * blob (writing it back is the entire bug) and the two flags that are derived
 * from the lost-media sidecar on read.
 *
 * This is the enforcement point. Callers spread rows freely — `update({...item,
 * status: "syncing"})` — so the guarantee cannot rest on any of them
 * remembering. It rests here.
 */
function metaOnly(item: QueuedCapture): Omit<QueuedCapture, "blob" | "mediaLost" | "mediaLostReason"> {
  const { blob: _blob, mediaLost: _lost, mediaLostReason: _reason, ...meta } = item;
  void _blob;
  void _lost;
  void _reason;
  return meta;
}

async function putMeta(db: IDBDatabase, meta: object): Promise<void> {
  await reqToPromise(store(db, "readwrite").put(meta));
}

/** Fold the lost-media sidecar and legacy inline media into what callers see. */
function hydrate(row: QueuedCapture, lostReason?: string): QueuedCapture {
  const { blob, ...meta } = row;
  return {
    ...meta,
    // Old rows predate mediaSize/mediaType; read them off the inline blob so
    // every consumer can rely on these regardless of the row's shape. Reading
    // .size and .type is metadata only — it never touches the bytes, so it is
    // safe even on a blob whose backing file is gone.
    ...(blob && meta.mediaSize == null ? { mediaSize: blob.size } : {}),
    ...(blob && meta.mediaType == null ? { mediaType: row.blobType || blob.type || DEFAULT_TYPE } : {}),
    ...(lostReason ? { mediaLost: true, mediaLostReason: lostReason } : {}),
  };
}

/**
 * Record that a capture's media could not be read back.
 *
 * This mark lives in its OWN store, not as a field on the queue row, and that
 * is deliberate. Setting a field on the row means a put() of the whole row,
 * which re-stores the inline blob we have just failed to read — the precise
 * write this refactor exists to eliminate, aimed at the most fragile row in the
 * database. A failed read is not always final (WebKit can throw under memory
 * pressure, and the outbox's own probe tells artists to refresh and re-check
 * before believing it), so the row is left exactly as it lies: untouched, with
 * its bytes still on disk, still recoverable if a later read succeeds.
 */
async function markMediaLost(db: IDBDatabase, captureId: string, reason: string): Promise<void> {
  const rec: MediaLostRecord = { captureId, reason, at: Date.now() };
  await reqToPromise(objectStore(db, CAPTURE_MEDIA_LOST_STORE, "readwrite").put(rec));
}

async function readLostReason(db: IDBDatabase, captureId: string): Promise<string | undefined> {
  const rec = await reqToPromise<MediaLostRecord | undefined>(
    objectStore(db, CAPTURE_MEDIA_LOST_STORE, "readonly").get(captureId)
  );
  return rec?.reason;
}

async function readLostMap(db: IDBDatabase): Promise<Map<string, string>> {
  // getAll() is fine here: these records never hold bytes.
  const rows = await reqToPromise<MediaLostRecord[]>(
    objectStore(db, CAPTURE_MEDIA_LOST_STORE, "readonly").getAll()
  );
  return new Map((rows ?? []).map((r) => [r.captureId, r.reason]));
}

/**
 * Copy an old-shape row's inline media into the media store.
 *
 * Returns the bytes on success so the caller can use them without a re-read.
 * On failure the row is marked lost and left untouched — see markMediaLost().
 * This does NOT drop the inline copy; the caller does that only once the bytes
 * are safely in the new store, so an interruption leaves two copies, never none.
 */
async function migrateInlineMedia(
  db: IDBDatabase,
  row: QueuedCapture
): Promise<CaptureMedia | undefined> {
  const blob = row.blob;
  if (!blob) return undefined;
  const type = row.blobType || blob.type || DEFAULT_TYPE;

  // Interrupted mid-migration on a previous run? The bytes are already across;
  // don't read this blob again.
  const already = await reqToPromise<MediaRecord | undefined>(
    objectStore(db, CAPTURE_MEDIA_STORE, "readonly").get(row.captureId)
  );
  if (already?.bytes) return { bytes: already.bytes, type: already.type || type };

  let bytes: ArrayBuffer;
  try {
    bytes = await blob.arrayBuffer();
  } catch (e) {
    const detail = e instanceof Error ? `${e.name}: ${e.message}` : "read failed";
    await markMediaLost(db, row.captureId, `${detail} (${blob.size}B)`);
    return undefined;
  }
  const rec: MediaRecord = { captureId: row.captureId, bytes, type };
  await reqToPromise(objectStore(db, CAPTURE_MEDIA_STORE, "readwrite").put(rec));
  return { bytes, type };
}

/** Drop the now-redundant inline copy. Only ever called AFTER the bytes have
 *  landed in the media store. */
async function dropInlineMedia(db: IDBDatabase, row: QueuedCapture, media: CaptureMedia): Promise<void> {
  const { blob: _blob, blobType: _blobType, ...meta } = row;
  void _blob;
  void _blobType;
  await putMeta(db, { ...meta, mediaSize: media.bytes.byteLength, mediaType: media.type });
}

/**
 * Write a new capture: metadata and media, in ONE transaction.
 *
 * The caller hands media over as `item.blob` (that is the only place a blob is
 * accepted anywhere in this module) and it is split out here. Both writes share
 * a transaction, so a capture can never land as a queue row with no recording
 * behind it, nor as orphaned bytes no drain will ever clear.
 *
 * The bytes are read HERE, at capture time, from a handle that was just minted
 * in memory. If a recording is ever going to be unreadable, this is where it
 * surfaces — while the artist is still standing there and can record it again —
 * rather than six days later in a drainer they cannot see. CaptureForm shows
 * the thrown message on its status line.
 */
export async function enqueue(item: QueuedCapture): Promise<void> {
  if (!hasIDB()) return;
  const db = await openDb();
  const meta = metaOnly(item);
  const blob = item.blob;
  if (!blob) {
    await putMeta(db, meta);
    return;
  }

  // Materialize BEFORE opening the transaction. An IDB transaction deactivates
  // as soon as control returns to the event loop, so awaiting a Blob read
  // inside one would abort it.
  const bytes = await blob.arrayBuffer();
  const type = item.blobType || blob.type || DEFAULT_TYPE;
  const media: MediaRecord = { captureId: item.captureId, bytes, type };

  const { tx, stores } = objectStores(db, [CAPTURE_STORE, CAPTURE_MEDIA_STORE], "readwrite");
  stores[0].put({ ...meta, mediaSize: bytes.byteLength, mediaType: type });
  stores[1].put(media);
  await txToPromise(tx);
}

/**
 * Write METADATA ONLY. This never touches a capture's bytes — that is the fix.
 *
 * One wrinkle for old rows: they still carry their media inline, and IndexedDB
 * has no partial update, so writing metadata to such a row would rewrite the
 * blob (the bug) or drop it (data loss). Neither is acceptable, so the row is
 * migrated out of the way FIRST. If its media cannot be read, the row is marked
 * lost and this write is skipped entirely — leaving the fragile row untouched.
 * Callers do not have to know any of this; the guard lives here so no call site
 * can get it wrong.
 *
 * A skipped write leaves the row's status as it was, which would normally mean
 * the drainer picks it straight back up — but getAll() surfaces mediaLost and
 * captureSync's isDue() refuses those rows, so it parks instead of looping.
 */
export async function update(item: QueuedCapture): Promise<void> {
  if (!hasIDB()) return;
  const db = await openDb();

  const stored = await reqToPromise<QueuedCapture | undefined>(
    store(db, "readonly").get(item.captureId)
  );
  if (!stored) return; // removed by a concurrent drain — nothing to update.

  if (stored.blob) {
    const media = await migrateInlineMedia(db, stored);
    if (!media) return; // unreadable: leave the row exactly as it lies.
    const meta = metaOnly(item);
    await putMeta(db, { ...meta, mediaSize: media.bytes.byteLength, mediaType: media.type });
    return;
  }

  await putMeta(db, metaOnly(item));
}

export async function getAll(): Promise<QueuedCapture[]> {
  if (!hasIDB()) return [];
  const db = await openDb();
  const rows = await reqToPromise<QueuedCapture[]>(store(db, "readonly").getAll());
  const lost = await readLostMap(db);
  return (rows ?? []).map((r) => hydrate(r, lost.get(r.captureId)));
}

/**
 * Read ONE row by id.
 *
 * Prefer this over getAll() whenever a single capture is what's needed. (Since
 * v6 neither one carries media, so this is no longer the megabytes-per-call
 * difference it once was — but reading one row to use one row is still the
 * honest call.)
 */
export async function get(captureId: string): Promise<QueuedCapture | undefined> {
  if (!hasIDB()) return undefined;
  const db = await openDb();
  const row = await reqToPromise<QueuedCapture | undefined>(store(db, "readonly").get(captureId));
  if (!row) return undefined;
  return hydrate(row, await readLostReason(db, captureId));
}

/**
 * The ONE way to get a capture's bytes.
 *
 * Reads the media store; falls back to an old row's inline blob and copies it
 * across on the way past (media store first, then the inline copy is dropped).
 * Returns undefined when there is no media, or when an old row's media could
 * not be read — in which case the row is marked so nothing keeps hammering it.
 *
 * Always call this fresh at the moment the bytes are needed. Do not cache what
 * it returns across an await that might include a queue write.
 */
export async function getMedia(captureId: string): Promise<CaptureMedia | undefined> {
  if (!hasIDB()) return undefined;
  const db = await openDb();

  const rec = await reqToPromise<MediaRecord | undefined>(
    objectStore(db, CAPTURE_MEDIA_STORE, "readonly").get(captureId)
  );
  if (rec?.bytes) return { bytes: rec.bytes, type: rec.type || DEFAULT_TYPE };

  // Not migrated yet (or no media at all).
  const row = await reqToPromise<QueuedCapture | undefined>(store(db, "readonly").get(captureId));
  if (!row?.blob) return undefined;

  const media = await migrateInlineMedia(db, row);
  if (!media) return undefined;
  await dropInlineMedia(db, row, media);
  return media;
}

/** True when this capture's media has been marked unreadable. */
export async function isMediaLost(captureId: string): Promise<boolean> {
  if (!hasIDB()) return false;
  const db = await openDb();
  return (await readLostReason(db, captureId)) !== undefined;
}

export async function remove(captureId: string): Promise<void> {
  if (!hasIDB()) return;
  const db = await openDb();
  const { tx, stores } = objectStores(
    db,
    [CAPTURE_STORE, CAPTURE_MEDIA_STORE, CAPTURE_MEDIA_LOST_STORE],
    "readwrite"
  );
  for (const s of stores) s.delete(captureId);
  await txToPromise(tx);
}
