// lib/fieldKitDb.ts
//
// Single owner of the Field Kit's IndexedDB ("dat-field-kit"). Both the capture
// queue (Slice C) and the itinerary snapshot (Slice 2) live in this ONE database,
// so they MUST agree on its version and share one connection — opening the same
// DB at two different versions from two modules throws a VersionError. This module
// centralizes that: it owns the version, the single connection promise, and the
// ADDITIVE upgrade that creates whatever stores are missing.
//
// Upgrades are ADDITIVE only: a device on an older version keeps its existing
// stores (and their queued data) untouched; each bump only ADDS the stores that
// are missing. A fresh install at the current version gets all of them.
//   v1 → v2: added "itinerarySnapshot" (Slice 2)
//   v2 → v3: added "opsQueue" + "opsState" (Slice 5 — Roll Call / Company Choice)
//   v3 → v4: added "journeyDrafts" (Slice 6 — Composer / Retroactive drafts)
//   v4 → v5: added "traceMutationQueue" + "traceMirror" (offline trace edit/delete)
//   v5 → v6: added "captureMedia" — capture bytes moved OUT of the queue record.
//            Media used to ride inline on the queue row, so every metadata write
//            (status, attempts, backoff) re-stored the Blob; on WebKit that
//            round-trip breaks the Blob's backing-file reference and the bytes
//            stop resolving. Bytes now live here, written once and never
//            rewritten. Old rows keep their inline blob and are copied forward
//            lazily on first successful read — see lib/captureQueue getMedia().
//
// SSR-safe: hasIDB() guards the browser-only API so every importer no-ops cleanly
// on the server (no "server-only" — this is imported by client code).

export const DB_NAME = "dat-field-kit";
export const DB_VERSION = 6;

export const CAPTURE_STORE = "captureQueue"; // keyPath: "captureId" (Slice C — metadata only, as of v6)
export const CAPTURE_MEDIA_STORE = "captureMedia"; // keyPath: "captureId" (v6 — write-once capture bytes)
// v6. Tiny sidecar: which old-shape rows have media that could NOT be read back.
// It lives in its own store rather than as a field on the queue row because
// writing that field would mean re-storing the very Blob we just failed to read
// — see lib/captureQueue markMediaLost(). Records here never hold bytes, so
// reading the whole store is cheap.
export const CAPTURE_MEDIA_LOST_STORE = "captureMediaLost"; // keyPath: "captureId" (v6)
export const SNAPSHOT_STORE = "itinerarySnapshot"; // keyPath: "programId" (Slice 2)
export const OPS_QUEUE_STORE = "opsQueue"; // keyPath: "opId" (Slice 5 — queued check-ins/votes)
export const OPS_STATE_STORE = "opsState"; // keyPath: "key" (Slice 5 — this device's own response/vote)
export const DRAFT_STORE = "journeyDrafts"; // keyPath: "key" (Slice 6 — Composer/Retro drafts)
export const TRACE_MUTATION_STORE = "traceMutationQueue"; // keyPath: "mutationId" (queued edits/deletes)
export const TRACE_MIRROR_STORE = "traceMirror"; // keyPath: "captureId" (device copy of own traces)

export function hasIDB(): boolean {
  return typeof indexedDB !== "undefined";
}

let dbPromise: Promise<IDBDatabase> | null = null;

export function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    // Runs for a brand-new DB AND for any version bump. Create only what's
    // missing so the upgrade is purely additive and never drops existing data.
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(CAPTURE_STORE)) {
        db.createObjectStore(CAPTURE_STORE, { keyPath: "captureId" });
      }
      // v6. Deliberately NOT backfilled here: an upgrade handler that read and
      // rewrote every queued recording would be one big write pass across the
      // exact data this split exists to protect, at the least recoverable
      // moment (blocking, before any UI is up, with no way to report failure).
      // Old rows are migrated one at a time, on demand, only after their bytes
      // have been read back intact.
      if (!db.objectStoreNames.contains(CAPTURE_MEDIA_STORE)) {
        db.createObjectStore(CAPTURE_MEDIA_STORE, { keyPath: "captureId" });
      }
      if (!db.objectStoreNames.contains(CAPTURE_MEDIA_LOST_STORE)) {
        db.createObjectStore(CAPTURE_MEDIA_LOST_STORE, { keyPath: "captureId" });
      }
      if (!db.objectStoreNames.contains(SNAPSHOT_STORE)) {
        db.createObjectStore(SNAPSHOT_STORE, { keyPath: "programId" });
      }
      if (!db.objectStoreNames.contains(OPS_QUEUE_STORE)) {
        db.createObjectStore(OPS_QUEUE_STORE, { keyPath: "opId" });
      }
      if (!db.objectStoreNames.contains(OPS_STATE_STORE)) {
        db.createObjectStore(OPS_STATE_STORE, { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains(DRAFT_STORE)) {
        db.createObjectStore(DRAFT_STORE, { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains(TRACE_MUTATION_STORE)) {
        db.createObjectStore(TRACE_MUTATION_STORE, { keyPath: "mutationId" });
      }
      if (!db.objectStoreNames.contains(TRACE_MIRROR_STORE)) {
        db.createObjectStore(TRACE_MIRROR_STORE, { keyPath: "captureId" });
      }
    };
    req.onsuccess = () => {
      const db = req.result;
      // Another tab (on a newer deploy) is version-bumping this DB: close our
      // connection so its upgrade proceeds instead of blocking forever, and
      // reset the memo so our next call reopens fresh.
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      resolve(db);
    };
    // An old-version tab holds the DB open and hasn't gotten out of the way:
    // fail fast (callers surface an error) rather than hanging a tap forever.
    req.onblocked = () => {
      dbPromise = null;
      reject(new Error("IndexedDB open blocked by another tab"));
    };
    // Never memoize a failure (e.g. an OLD cached bundle opening at a lower
    // version than the DB now has throws VersionError) — the next call should
    // retry rather than poisoning every queue/snapshot read until reload.
    req.onerror = () => {
      dbPromise = null;
      reject(req.error);
    };
  });
  return dbPromise;
}

/** Open a single-store transaction and return that store. */
export function objectStore(
  db: IDBDatabase,
  name: string,
  mode: IDBTransactionMode
): IDBObjectStore {
  return db.transaction(name, mode).objectStore(name);
}

/**
 * Open ONE transaction spanning several stores.
 *
 * Needed wherever a capture's metadata and its media must move together — an
 * enqueue that wrote one but not the other would leave either a queue row with
 * no recording behind it or orphaned bytes no drain will ever clear. Both
 * writes share a transaction, so they commit together or not at all.
 */
export function objectStores(
  db: IDBDatabase,
  names: string[],
  mode: IDBTransactionMode
): { tx: IDBTransaction; stores: IDBObjectStore[] } {
  const tx = db.transaction(names, mode);
  return { tx, stores: names.map((n) => tx.objectStore(n)) };
}

/** Promisify a simple IDBRequest. */
export function reqToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Resolve when a transaction commits; reject if it aborts or errors. */
export function txToPromise(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error ?? new Error("Transaction aborted"));
    tx.onerror = () => reject(tx.error);
  });
}
