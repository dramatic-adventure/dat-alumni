// lib/opsSync.ts
//
// Slice 5 — client-only drainer for the Field Kit OPS queue (check-ins +
// votes). Mirrors lib/captureSync exactly: a module-level singleton that
// processes due items serially, classifies each response, and reschedules with
// exponential backoff. Delivery contract: at-least-once on the wire → the
// routes upsert by (targetId, alumniSlug), so a replay is a same-value
// overwrite, never a duplicate.
//
// SSR-safe: no browser API touched at module load; start() guards
// window/document before wiring triggers.

import { getAll, update, remove, type QueuedOp } from "@/lib/opsQueue";
import { fetchWithTimeout, TEXT_TIMEOUT_MS } from "@/lib/syncFetch";

const ENDPOINTS: Record<QueuedOp["kind"], string> = {
  "roll-call": "/api/field-kit/roll-call/respond",
  vote: "/api/field-kit/company-choice/vote",
};

const MAX_ATTEMPTS = 8;
const BASE_BACKOFF_MS = 5_000;
const MAX_BACKOFF_MS = 5 * 60_000;

// 4xx that need a human — never auto-retried. 409 = voting closed before the
// queued item reached the server (a permanent fact, not a transient failure).
const PERMANENT = new Set([400, 409, 413, 415]);

// 401/403 = this SESSION can't deliver the op (signed out / off the roster).
// These are REMOVED from the queue outright, not parked as failed: identity is
// derived server-side from whoever is signed in, so replaying later — possibly
// under the NEXT user on a shared device — would mis-attribute the answer.
const AUTH_DEAD = new Set([401, 403]);

// A failed op that's sat for a day is history, not a to-do — expire it so the
// "N failed" chip doesn't nag forever about a vote that can never land.
const FAILED_TTL_MS = 24 * 60 * 60_000;

export type OpsSyncCounts = { pending: number; failed: number };
type Listener = (counts: OpsSyncCounts) => void;

const listeners = new Set<Listener>();
let counts: OpsSyncCounts = { pending: 0, failed: 0 };

let draining = false;
let drainRequested = false;
let started = false;
let backoffTimer: ReturnType<typeof setTimeout> | null = null;

function emit() {
  for (const l of listeners) l(counts);
}

async function refreshCounts() {
  let items = await getAll();
  // Expire day-old permanent failures (see FAILED_TTL_MS).
  const cutoff = Date.now() - FAILED_TTL_MS;
  const expired = items.filter((i) => i.status === "failed" && Date.parse(i.createdAt) < cutoff);
  if (expired.length) {
    await Promise.all(expired.map((i) => remove(i.opId)));
    items = items.filter((i) => !expired.includes(i));
  }
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

export function getCounts(): OpsSyncCounts {
  return counts;
}

function backoffFor(attempts: number): number {
  return Math.min(BASE_BACKOFF_MS * 2 ** (attempts - 1), MAX_BACKOFF_MS);
}

function buildBody(item: QueuedOp): string {
  if (item.kind === "roll-call") {
    return JSON.stringify({
      rollCallId: item.targetId,
      status: item.value,
      respondedAt: item.createdAt,
      ...(item.asId ? { asId: item.asId } : {}),
    });
  }
  return JSON.stringify({
    choiceSetId: item.targetId,
    selection: item.value,
    votedAt: item.createdAt,
    ...(item.asId ? { asId: item.asId } : {}),
  });
}

async function retry(item: QueuedOp, lastError: string): Promise<void> {
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

async function send(item: QueuedOp): Promise<void> {
  await update({ ...item, status: "syncing", lastError: undefined });
  await refreshCounts();

  let res: Response;
  try {
    // Timeout so a stalled request can't wedge the serial drain loop.
    res = await fetchWithTimeout(
      ENDPOINTS[item.kind],
      { method: "POST", headers: { "content-type": "application/json" }, body: buildBody(item) },
      TEXT_TIMEOUT_MS
    );
  } catch (e) {
    await retry(item, e instanceof Error ? e.message : "Network error");
    return;
  }

  if (res.ok) {
    await remove(item.opId);
    return;
  }
  if (AUTH_DEAD.has(res.status)) {
    await remove(item.opId);
    return;
  }
  if (PERMANENT.has(res.status)) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    await update({
      ...item,
      status: "failed",
      lastError: data?.error || `Failed (${res.status})`,
      nextAttemptAt: undefined,
    });
    return;
  }
  await retry(item, `Server error (${res.status})`);
}

function isDue(item: QueuedOp, now: number): boolean {
  if (item.status === "syncing") return true; // orphaned by a closed tab → due
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
    drainRequested = true;
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
