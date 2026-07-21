// lib/traceMutationSync.ts
//
// Client-only drainer for the trace mutation queue (edits + deletes of
// existing captures). Mirrors lib/opsSync exactly: a module-level singleton
// that processes due items serially, classifies each response, and reschedules
// with exponential backoff. Delivery contract: at-least-once on the wire →
// the capture route PATCHes by captureId and DELETE is idempotent, so a replay
// is a same-value overwrite, never a duplicate.
//
// SSR-safe: no browser API touched at module load; start() guards
// window/document before wiring triggers.

import { getAll, update, remove, type QueuedTraceMutation } from "@/lib/traceMutationQueue";
import { fetchWithTimeout, TEXT_TIMEOUT_MS } from "@/lib/syncFetch";

const MAX_ATTEMPTS = 8;
const BASE_BACKOFF_MS = 5_000;
const MAX_BACKOFF_MS = 5 * 60_000;

// 4xx that need a human — never auto-retried. 404 on an EDIT means the trace
// is gone server-side (deleted elsewhere) — treated as permanent below; 404 on
// a DELETE means "already gone", which is success (handled in send()).
const PERMANENT = new Set([400, 404, 413, 415]);

// 401/403 = this SESSION can't deliver (signed out / off the roster). Removed
// outright — replaying later, possibly under the next user on a shared device,
// would mutate someone else's trace attribution.
const AUTH_DEAD = new Set([401, 403]);

// A failed mutation that's sat for a day is history, not a to-do.
const FAILED_TTL_MS = 24 * 60 * 60_000;

export type TraceMutationSyncCounts = { pending: number; failed: number };
type Listener = (counts: TraceMutationSyncCounts) => void;

const listeners = new Set<Listener>();
let counts: TraceMutationSyncCounts = { pending: 0, failed: 0 };

let draining = false;
let drainRequested = false;
let started = false;
let backoffTimer: ReturnType<typeof setTimeout> | null = null;

function emit() {
  for (const l of listeners) l(counts);
}

async function refreshCounts() {
  let items = await getAll();
  const cutoff = Date.now() - FAILED_TTL_MS;
  const expired = items.filter((i) => i.status === "failed" && Date.parse(i.createdAt) < cutoff);
  if (expired.length) {
    await Promise.all(expired.map((i) => remove(i.mutationId)));
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

export function getCounts(): TraceMutationSyncCounts {
  return counts;
}

function backoffFor(attempts: number): number {
  return Math.min(BASE_BACKOFF_MS * 2 ** (attempts - 1), MAX_BACKOFF_MS);
}

function urlFor(item: QueuedTraceMutation): string {
  return `/api/field-kit/capture/${encodeURIComponent(item.captureId)}${
    item.asId ? `?asId=${encodeURIComponent(item.asId)}` : ""
  }`;
}

async function retry(item: QueuedTraceMutation, lastError: string): Promise<void> {
  const attempts = item.attempts + 1;
  if (attempts >= MAX_ATTEMPTS) {
    // Transient exhaustion — permanent:false so reconnect/return auto-revives it.
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

async function send(item: QueuedTraceMutation): Promise<void> {
  await update({ ...item, status: "syncing", lastError: undefined });
  await refreshCounts();

  let res: Response;
  try {
    // Timeout so a stalled request can't wedge the serial drain loop.
    res =
      item.action === "delete"
        ? await fetchWithTimeout(urlFor(item), { method: "DELETE" }, TEXT_TIMEOUT_MS)
        : await fetchWithTimeout(
            urlFor(item),
            {
              method: "PATCH",
              headers: { "content-type": "application/json" },
              body: JSON.stringify(item.payload ?? {}),
            },
            TEXT_TIMEOUT_MS
          );
  } catch (e) {
    await retry(item, e instanceof Error ? e.message : "Network error");
    return;
  }

  if (res.ok) {
    await remove(item.mutationId);
    return;
  }
  // A delete that finds nothing to delete has already succeeded.
  if (item.action === "delete" && res.status === 404) {
    await remove(item.mutationId);
    return;
  }
  if (AUTH_DEAD.has(res.status)) {
    await remove(item.mutationId);
    return;
  }
  if (PERMANENT.has(res.status)) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    await update({
      ...item,
      status: "failed",
      lastError: data?.error || `Failed (${res.status})`,
      nextAttemptAt: undefined,
      permanent: true, // a 4xx (incl. 404 gone) needs a human — never auto-resumed.
    });
    return;
  }
  await retry(item, `Server error (${res.status})`);
}

function isDue(item: QueuedTraceMutation, now: number): boolean {
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

// Manual override: revives EVERY failed item, including permanent 4xx ones.
export async function retryFailed(): Promise<void> {
  const items = await getAll();
  for (const i of items) {
    if (i.status === "failed") {
      await update({ ...i, status: "pending", attempts: 0, nextAttemptAt: undefined, lastError: undefined, permanent: false });
    }
  }
  await refreshCounts();
  void drain();
}

// Auto-recovery on reconnect/return: revive ONLY transiently-failed items,
// never permanent 4xx failures. Wired to online + visibilitychange in start().
export async function resume(): Promise<void> {
  const items = await getAll();
  for (const i of items) {
    if (i.status === "failed" && !i.permanent) {
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
  window.addEventListener("online", () => void resume());
  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") void resume();
    });
  }
  void refreshCounts();
  void drain();
}
