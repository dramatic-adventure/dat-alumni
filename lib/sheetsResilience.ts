// lib/sheetsResilience.ts
//
// Shared Google Sheets resilience helpers, extracted verbatim from
// app/api/upload/route.ts so other routes/loaders (e.g. the Field Kit capture
// log) reuse the same retry + header-lookup behavior. No behavior change — these
// are the exact implementations the upload route shipped with.

/** Retry a Sheets/Drive call on transient network + Google backend errors. */
export async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
  tries = 3,
  baseDelayMs = 250
): Promise<T> {
  let lastErr: any;
  for (let attempt = 1; attempt <= tries; attempt++) {
    try {
      return await fn();
    } catch (e: any) {
      lastErr = e;
      const msg = String(e?.message || e);
      if (
        /ECONNRESET|ENOTFOUND|ETIMEDOUT|EPIPE|socket hang up|rateLimitExceeded|backendError|internalError/i.test(
          msg
        ) &&
        attempt < tries
      ) {
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      break;
    }
  }
  throw new Error(`${label} failed: ${lastErr?.message || String(lastErr)}`);
}

/** Case-insensitive header lookup; returns the column index or -1. */
export function idxOf(header: string[], candidates: string[]) {
  const lower = header.map((h) => String(h || "").trim().toLowerCase());
  for (const c of candidates) {
    const i = lower.indexOf(c.toLowerCase());
    if (i !== -1) return i;
  }
  return -1;
}

/** Normalize an id/slug for comparison (trim + lowercase). */
export function normId(x: unknown) {
  return String(x ?? "").trim().toLowerCase();
}
