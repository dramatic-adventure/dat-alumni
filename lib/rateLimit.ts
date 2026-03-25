// /lib/rateLimit.ts
/**
 * Simple in-memory leaky bucket rate limiter.
 * Good enough for MVP on a single instance. For multi-region / serverless fan-out,
 * consider Redis or Upstash.
 */

type Bucket = { count: number; reset: number };

const buckets = new Map<string, Bucket>();

/**
 * Extract client IP from headers. Use in routes:
 *   const ip = getClientIp(req);
 */
export function getClientIp(req: Request): string {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) {
    // First IP in the list is the client (proxies append)
    const first = xf.split(",")[0]?.trim();
    if (first) return first;
  }
  // Fallbacks
  return req.headers.get("x-real-ip")?.trim() || "local";
}

/**
 * Rate limit a given key.
 *
 * @param key      Unique identifier (e.g., `${ip}:${route}`).
 * @param limit    Max requests within the window (default 60).
 * @param windowMs Window duration in ms (default 60_000).
 * @returns        true if allowed, false if limit exceeded.
 */
export function rateLimit(key: string, limit = 60, windowMs = 60_000): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) return false;
  bucket.count++;
  return true;
}

/**
 * Utility to build a sane default key (IP + method + path).
 * Use:
 *   const key = rateKey(req);
 *   if (!rateLimit(key)) return 429...
 */
export function rateKey(req: Request): string {
  const url = new URL(req.url);
  const ip = getClientIp(req);
  return `${ip}:${req.method}:${url.pathname}`;
}

/** Testing / ops helper: clear all buckets */
export function _clearRateLimitBuckets() {
  buckets.clear();
}
