// lib/captureQueue.ts
//
// Slice C — client-only IndexedDB queue for Field Kit captures. Every capture is
// written HERE first (instant, offline-safe); lib/captureSync then drains each to
// /api/field-kit/capture when connectivity allows. The captureId ULID doubles as
// the idempotency key, so at-least-once delivery on the wire becomes exactly-once
// in the sheet (the route dedups on captureId).
//
// Blobs (photo/voice bytes) are stored DIRECTLY — IndexedDB persists binary
// natively, so no base64 bloat. SSR-safe: every entry point no-ops cleanly when
// indexedDB is absent (no "server-only" import; this just guards the browser API).
//
// The "dat-field-kit" DB (and its version/upgrade) is owned by lib/fieldKitDb —
// the itinerary snapshot store (Slice 2) shares the same database, so the open
// path must be centralized to avoid an IndexedDB version conflict.

import { openDb, hasIDB, objectStore, CAPTURE_STORE } from "@/lib/fieldKitDb";

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
  blob?: Blob;
  blobType?: string;
  status: QueueStatus;
  attempts: number;
  nextAttemptAt?: number;
  lastError?: string;
  /** Chunked-upload resume pointer: chunks [0, uploadedChunks) are already
   *  staged server-side, so a retry after a dropped connection re-uploads only
   *  the remainder (see lib/captureSync sendChunked). */
  uploadedChunks?: number;
};

function store(db: IDBDatabase, mode: IDBTransactionMode): IDBObjectStore {
  return objectStore(db, CAPTURE_STORE, mode);
}

// put() upserts on the keyPath, so enqueue + update share one path.
async function put(item: QueuedCapture): Promise<void> {
  if (!hasIDB()) return;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const r = store(db, "readwrite").put(item);
    r.onsuccess = () => resolve();
    r.onerror = () => reject(r.error);
  });
}

export function enqueue(item: QueuedCapture): Promise<void> {
  return put(item);
}

export function update(item: QueuedCapture): Promise<void> {
  return put(item);
}

export async function getAll(): Promise<QueuedCapture[]> {
  if (!hasIDB()) return [];
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const r = store(db, "readonly").getAll();
    r.onsuccess = () => resolve((r.result as QueuedCapture[]) ?? []);
    r.onerror = () => reject(r.error);
  });
}

export async function remove(captureId: string): Promise<void> {
  if (!hasIDB()) return;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const r = store(db, "readwrite").delete(captureId);
    r.onsuccess = () => resolve();
    r.onerror = () => reject(r.error);
  });
}
