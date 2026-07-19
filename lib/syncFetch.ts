// lib/syncFetch.ts
//
// fetch with a hard timeout for the Field Kit offline-queue drainers
// (captureSync / opsSync / traceMutationSync).
//
// WHY THIS EXISTS: the drainers process their queues SERIALLY and `await` each
// request. A bare fetch() whose connection stalls (flaky cell signal, app
// backgrounded mid-upload — routine on iOS PWAs) can stay pending forever; the
// drain loop then never finishes, `draining` never resets, and every later
// kick/online/visibility trigger is swallowed. One stalled upload silently
// blocked the ENTIRE queue for the life of the page — captures sat at
// "waiting to sync" indefinitely. A timeout guarantees every send() settles,
// so the item is rescheduled with backoff and the rest of the queue proceeds.

export class SyncTimeoutError extends Error {
  constructor(ms: number) {
    super(`Timed out after ${Math.round(ms / 1000)}s`);
    this.name = "SyncTimeoutError";
  }
}

/** Timeout for small JSON/text requests. */
export const TEXT_TIMEOUT_MS = 30_000;
/** Timeout for requests carrying a media chunk/blob (≤ ~3.5 MB) — generous for
 *  slow field connections, but bounded so the queue can never wedge. */
export const BLOB_TIMEOUT_MS = 4 * 60_000;

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: ctrl.signal });
  } catch (e) {
    // Distinguish our timeout from a real network error so lastError is honest.
    if (e instanceof DOMException && e.name === "AbortError") {
      throw new SyncTimeoutError(timeoutMs);
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
