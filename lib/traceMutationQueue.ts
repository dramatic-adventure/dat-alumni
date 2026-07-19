// lib/traceMutationQueue.ts
//
// Client-only IndexedDB queue for Field Kit TRACE MUTATIONS (edits + deletes of
// existing captures) — the last write path that used to be online-only. Same
// offline-write mechanism as the capture queue (lib/captureQueue) and the ops
// queue (lib/opsQueue): the mutation is written HERE first (instant,
// offline-safe); lib/traceMutationSync drains each to
// /api/field-kit/capture/[captureId] when connectivity allows. The server side
// is already idempotent (DELETE of a deleted row is ok; PATCH keys by
// captureId), so at-least-once delivery is safe.
//
// COALESCING per captureId: one queued mutation per trace. A newer edit
// supersedes an older queued edit; a delete supersedes everything (and any
// edit queued after a delete is rejected by the UI, which hides deleted rows).
//
// The "dat-field-kit" DB (version/upgrade) is owned by lib/fieldKitDb.

import { openDb, hasIDB, objectStore, reqToPromise, TRACE_MUTATION_STORE } from "@/lib/fieldKitDb";
import { newOpId } from "@/lib/opsQueue";

export type TraceMutationAction = "edit" | "delete";
export type TraceMutationStatus = "pending" | "syncing" | "failed";

export type TraceEditPayload = {
  bodyText: string;
  quoteSpeaker?: string;
  visibility: "card" | "sealed";
};

export type QueuedTraceMutation = {
  mutationId: string; // client-minted ULID (time-ordered)
  captureId: string;
  action: TraceMutationAction;
  /** Present for "edit"; absent for "delete". */
  payload?: TraceEditPayload;
  asId?: string;
  createdAt: string; // ISO — when the artist acted
  status: TraceMutationStatus;
  attempts: number;
  nextAttemptAt?: number;
  lastError?: string;
};

export function newTraceMutationId(): string {
  return newOpId();
}

// Same sign-out race guard as opsQueue: an in-flight drainer callback must not
// resurrect a wiped row (it would sync under the NEXT signed-in user).
let _wipedAt = 0;

async function putItem(item: QueuedTraceMutation): Promise<void> {
  if (!hasIDB()) return;
  if (_wipedAt && Date.parse(item.createdAt) < _wipedAt) return;
  const db = await openDb();
  await reqToPromise(objectStore(db, TRACE_MUTATION_STORE, "readwrite").put(item));
}

/** Enqueue a mutation, coalescing away any older queued mutation for the same trace. */
export async function enqueue(item: QueuedTraceMutation): Promise<void> {
  const existing = await getAll();
  await Promise.all(
    existing
      .filter((i) => i.captureId === item.captureId && i.mutationId !== item.mutationId)
      .map((i) => remove(i.mutationId))
  );
  return putItem(item);
}

/** Status/backoff bookkeeping — no-op when the row is gone (coalesced/wiped). */
export async function update(item: QueuedTraceMutation): Promise<void> {
  if (!hasIDB()) return;
  const db = await openDb();
  const existing = await reqToPromise(
    objectStore(db, TRACE_MUTATION_STORE, "readonly").get(item.mutationId)
  );
  if (!existing) return;
  return putItem(item);
}

export async function getAll(): Promise<QueuedTraceMutation[]> {
  if (!hasIDB()) return [];
  const db = await openDb();
  const result = await reqToPromise(objectStore(db, TRACE_MUTATION_STORE, "readonly").getAll());
  return (result as QueuedTraceMutation[]) ?? [];
}

export async function remove(mutationId: string): Promise<void> {
  if (!hasIDB()) return;
  const db = await openDb();
  await reqToPromise(objectStore(db, TRACE_MUTATION_STORE, "readwrite").delete(mutationId));
}

/** Wipe the queue. Used on sign-out (AccountMenu) — shared-device hygiene. */
export async function clearAllTraceMutations(): Promise<void> {
  if (!hasIDB()) return;
  _wipedAt = Date.now();
  const db = await openDb();
  await reqToPromise(objectStore(db, TRACE_MUTATION_STORE, "readwrite").clear());
}
