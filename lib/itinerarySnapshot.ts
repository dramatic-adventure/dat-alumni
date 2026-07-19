// lib/itinerarySnapshot.ts
//
// Slice 2 — client-only ON-DEVICE itinerary snapshot. The "itinerarySnapshot"
// store (in the shared "dat-field-kit" DB, keyed by programId) holds the last
// itinerary the device successfully fetched while online. It is ONLY ever the
// offline fallback + the "last synced" basis — an online user is always shown
// live data, never this snapshot. lib/fetchItinerary writes it on every live
// fetch; the offline view + cold-start shell read it.
//
// SSR-safe: no "server-only" (imported by client components); every entry point
// no-ops cleanly when IndexedDB is absent.

import { openDb, hasIDB, objectStore, reqToPromise, SNAPSHOT_STORE } from "@/lib/fieldKitDb";
import type { ProgramItinerary } from "@/lib/programItinerary";

export type ItinerarySnapshotRecord = {
  programId: string;
  itinerary: ProgramItinerary;
  hash: string;
  syncedAt: number; // epoch ms of the live fetch that produced this snapshot
};

export async function getSnapshot(
  programId: string
): Promise<ItinerarySnapshotRecord | undefined> {
  if (!hasIDB() || !programId) return undefined;
  const db = await openDb();
  const rec = await reqToPromise(
    objectStore(db, SNAPSHOT_STORE, "readonly").get(programId)
  );
  return (rec as ItinerarySnapshotRecord | undefined) ?? undefined;
}

export async function putSnapshot(record: ItinerarySnapshotRecord): Promise<void> {
  if (!hasIDB() || !record.programId) return;
  const db = await openDb();
  await reqToPromise(objectStore(db, SNAPSHOT_STORE, "readwrite").put(record));
  notifySnapshotChange();
}

/**
 * Refresh only `syncedAt` on the existing snapshot — used when a hash-only
 * poll confirms the itinerary is UNCHANGED (no payload to store, but the
 * "synced Xs ago" readout should reflect that a live check just succeeded).
 * No-op when there's no snapshot yet.
 */
export async function touchSnapshot(programId: string, syncedAt: number): Promise<void> {
  if (!hasIDB() || !programId) return;
  const existing = await getSnapshot(programId);
  if (!existing) return;
  const db = await openDb();
  await reqToPromise(
    objectStore(db, SNAPSHOT_STORE, "readwrite").put({ ...existing, syncedAt })
  );
  notifySnapshotChange();
}

/** Wipe every on-device itinerary snapshot. Used on sign-out — see AccountMenu. */
export async function clearAllSnapshots(): Promise<void> {
  if (!hasIDB()) return;
  const db = await openDb();
  await reqToPromise(objectStore(db, SNAPSHOT_STORE, "readwrite").clear());
  notifySnapshotChange();
}

// ── change notification ────────────────────────────────────────────────────────
//
// A snapshot write happens deep inside fetchItinerary; UI that surfaces the
// "synced …" readout (SyncStatus) subscribes here so it updates immediately on a
// fresh sync rather than only on its own poll tick.

const SNAPSHOT_EVENT = "fk:itinerary-synced";

function notifySnapshotChange(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SNAPSHOT_EVENT));
  }
}

export function onSnapshotChange(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(SNAPSHOT_EVENT, cb);
  return () => window.removeEventListener(SNAPSHOT_EVENT, cb);
}
