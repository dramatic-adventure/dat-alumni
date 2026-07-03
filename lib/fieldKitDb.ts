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
//
// SSR-safe: hasIDB() guards the browser-only API so every importer no-ops cleanly
// on the server (no "server-only" — this is imported by client code).

export const DB_NAME = "dat-field-kit";
export const DB_VERSION = 4;

export const CAPTURE_STORE = "captureQueue"; // keyPath: "captureId" (Slice C)
export const SNAPSHOT_STORE = "itinerarySnapshot"; // keyPath: "programId" (Slice 2)
export const OPS_QUEUE_STORE = "opsQueue"; // keyPath: "opId" (Slice 5 — queued check-ins/votes)
export const OPS_STATE_STORE = "opsState"; // keyPath: "key" (Slice 5 — this device's own response/vote)
export const DRAFT_STORE = "journeyDrafts"; // keyPath: "key" (Slice 6 — Composer/Retro drafts)

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

/** Promisify a simple IDBRequest. */
export function reqToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
