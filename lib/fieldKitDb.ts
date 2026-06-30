// lib/fieldKitDb.ts
//
// Single owner of the Field Kit's IndexedDB ("dat-field-kit"). Both the capture
// queue (Slice C) and the itinerary snapshot (Slice 2) live in this ONE database,
// so they MUST agree on its version and share one connection — opening the same
// DB at two different versions from two modules throws a VersionError. This module
// centralizes that: it owns the version, the single connection promise, and the
// ADDITIVE upgrade that creates whatever stores are missing.
//
// v1 → v2 upgrade is additive: a device that already has the v1 "captureQueue"
// store keeps it (and its queued captures) untouched; v2 only ADDS the
// "itinerarySnapshot" store. A fresh install at v2 gets both.
//
// SSR-safe: hasIDB() guards the browser-only API so every importer no-ops cleanly
// on the server (no "server-only" — this is imported by client code).

export const DB_NAME = "dat-field-kit";
export const DB_VERSION = 2;

export const CAPTURE_STORE = "captureQueue"; // keyPath: "captureId" (Slice C)
export const SNAPSHOT_STORE = "itinerarySnapshot"; // keyPath: "programId" (Slice 2)

export function hasIDB(): boolean {
  return typeof indexedDB !== "undefined";
}

let dbPromise: Promise<IDBDatabase> | null = null;

export function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    // Runs for a brand-new DB AND for a v1→v2 bump. Create only what's missing so
    // the upgrade is purely additive and never drops existing data.
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(CAPTURE_STORE)) {
        db.createObjectStore(CAPTURE_STORE, { keyPath: "captureId" });
      }
      if (!db.objectStoreNames.contains(SNAPSHOT_STORE)) {
        db.createObjectStore(SNAPSHOT_STORE, { keyPath: "programId" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
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
