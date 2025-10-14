// lib/logHelpers.ts
type LogFn = (...args: unknown[]) => void;

// Respect your existing SHOW_DAT_DEBUG flag (dev-only verbosity)
const DEBUG =
  process.env.NODE_ENV !== "production" &&
  ["true", "1"].includes(String(process.env.SHOW_DAT_DEBUG || "").toLowerCase());

const seen = new Map<string, number>();
const seenOnce = new Set<string>();

/**
 * Rate limit a log by key. Will emit at most once per windowMs.
 * Example keys: "sheets-401", "cache-miss", "retry-timeout"
 */
export function rateLog(
  key: string,
  fn: LogFn = console.warn,
  windowMs = 60_000,
  ...args: unknown[]
) {
  if (!DEBUG) return; // keep prod/dev-quiet behavior
  const now = Date.now();
  const last = seen.get(key) ?? 0;
  if (now - last >= windowMs) {
    seen.set(key, now);
    fn(...args);
  }
}

/** Log only once per key, ever (until process restarts). */
export function logOnce(key: string, fn: LogFn = console.warn, ...args: unknown[]) {
  if (!DEBUG) return;
  if (seenOnce.has(key)) return;
  seenOnce.add(key);
  fn(...args);
}
