// lib/opsQueue.ts
//
// Slice 5 — client-only IndexedDB queue for Field Kit OPS actions (Roll Call
// check-ins + Company Choice votes). Same offline-write mechanism as the
// capture queue (lib/captureQueue): every action is written HERE first
// (instant, offline-safe); lib/opsSync drains each to its API route when
// connectivity allows. The server routes UPSERT by (targetId, alumniSlug), so
// at-least-once delivery on the wire is naturally idempotent in the Sheet.
//
// Alongside the queue lives the OPS STATE store — this device's own latest
// response/vote, keyed `${kind}:${targetId}`. Unlike queue items (removed once
// synced), state records PERSIST, so the Today cards can render "you checked in
// as here" offline and across reloads without trusting the server's short-TTL
// caches to have caught up.
//
// The "dat-field-kit" DB (version/upgrade) is owned by lib/fieldKitDb — shared
// with the capture queue + itinerary snapshot, so the open path stays central.

import { openDb, hasIDB, objectStore, reqToPromise, OPS_QUEUE_STORE, OPS_STATE_STORE } from "@/lib/fieldKitDb";

export type OpKind = "roll-call" | "vote";
export type OpQueueStatus = "pending" | "syncing" | "failed";

export type QueuedOp = {
  opId: string; // client-minted ULID
  kind: OpKind;
  /** rollCallId (kind "roll-call") or choiceSetId (kind "vote"). */
  targetId: string;
  /** "here" | "needs-help" (roll-call) or the selected choice text (vote). */
  value: string;
  createdAt: string; // ISO — when the artist acted (sent as respondedAt/votedAt)
  asId?: string;
  status: OpQueueStatus;
  attempts: number;
  nextAttemptAt?: number;
  lastError?: string;
};

export type OpsStateRecord = {
  key: string; // `${kind}:${targetId}`
  value: string;
  at: string; // ISO
};

export function opsStateKey(kind: OpKind, targetId: string): string {
  return `${kind}:${targetId}`;
}

// Crockford base32 ULID (same shape as CaptureForm's): 48-bit timestamp + 80
// bits of randomness — time-ordered, so the drainer's keyPath order replays a
// changed answer in the order the artist tapped it.
const ULID_ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
export function newOpId(): string {
  let now = Date.now();
  const time = Array<string>(10);
  for (let i = 9; i >= 0; i--) {
    time[i] = ULID_ENCODING[now % 32];
    now = Math.floor(now / 32);
  }
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const rand = Array.from(bytes, (b) => ULID_ENCODING[b % 32]);
  return time.join("") + rand.join("");
}

// Set by clearAllOps (sign-out). An in-flight drainer callback racing the wipe
// would otherwise RE-CREATE its row via update() right after the store was
// cleared — and that resurrected op would sync under the NEXT signed-in user.
// Any queue write for an op created before the wipe is dropped.
let _wipedAt = 0;

async function putItem(store: string, item: unknown): Promise<void> {
  if (!hasIDB()) return;
  const db = await openDb();
  await reqToPromise(objectStore(db, store, "readwrite").put(item as never));
}

function putQueueItem(item: QueuedOp): Promise<void> {
  if (_wipedAt && Date.parse(item.createdAt) < _wipedAt) return Promise.resolve();
  return putItem(OPS_QUEUE_STORE, item);
}

/**
 * Enqueue an op, COALESCING per (kind, targetId): any older queued op for the
 * same target is superseded by this tap and removed. Without this, a retrying
 * older answer could drain AFTER the newer one and win on the server (the
 * routes' stale-write guard is the backstop; this keeps the queue honest and
 * the "N to sync" count truthful).
 */
export async function enqueue(item: QueuedOp): Promise<void> {
  const existing = await getAll();
  await Promise.all(
    existing
      .filter((i) => i.kind === item.kind && i.targetId === item.targetId && i.opId !== item.opId)
      .map((i) => remove(i.opId))
  );
  return putQueueItem(item);
}

/**
 * Status/backoff update for an op ALREADY in the queue. Deliberately a no-op
 * when the row is gone — a superseded (coalesced) or wiped op that was
 * mid-send when it failed must stay dead, not be re-created by its own
 * retry bookkeeping.
 */
export async function update(item: QueuedOp): Promise<void> {
  if (!hasIDB()) return;
  const db = await openDb();
  const existing = await reqToPromise(
    objectStore(db, OPS_QUEUE_STORE, "readonly").get(item.opId)
  );
  if (!existing) return;
  return putQueueItem(item);
}

export async function getAll(): Promise<QueuedOp[]> {
  if (!hasIDB()) return [];
  const db = await openDb();
  const result = await reqToPromise(objectStore(db, OPS_QUEUE_STORE, "readonly").getAll());
  return (result as QueuedOp[]) ?? [];
}

export async function remove(opId: string): Promise<void> {
  if (!hasIDB()) return;
  const db = await openDb();
  await reqToPromise(objectStore(db, OPS_QUEUE_STORE, "readwrite").delete(opId));
}

/** Persist this device's own latest response/vote (survives sync + reloads). */
export function putOpsState(kind: OpKind, targetId: string, value: string): Promise<void> {
  return putItem(OPS_STATE_STORE, {
    key: opsStateKey(kind, targetId),
    value,
    at: new Date().toISOString(),
  } satisfies OpsStateRecord);
}

export async function getOpsState(kind: OpKind, targetId: string): Promise<OpsStateRecord | undefined> {
  if (!hasIDB()) return undefined;
  const db = await openDb();
  const rec = await reqToPromise(
    objectStore(db, OPS_STATE_STORE, "readonly").get(opsStateKey(kind, targetId))
  );
  return (rec as OpsStateRecord | undefined) ?? undefined;
}

/** Wipe queue + state. Used on sign-out (AccountMenu) — shared-device hygiene. */
export async function clearAllOps(): Promise<void> {
  if (!hasIDB()) return;
  _wipedAt = Date.now(); // drop any racing re-writes of pre-wipe ops (see putQueueItem)
  const db = await openDb();
  await reqToPromise(objectStore(db, OPS_QUEUE_STORE, "readwrite").clear());
  await reqToPromise(objectStore(db, OPS_STATE_STORE, "readwrite").clear());
}
