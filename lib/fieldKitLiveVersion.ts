// lib/fieldKitLiveVersion.ts
//
// Field Kit LIVE VERSION ("epoch") — the cross-instance cache-bust signal that
// makes staff-console actions propagate near-instantly.
//
// Problem it solves: the itinerary is TTL-cached per warm serverless instance
// (lib/loadProgram, lib/itineraryServerSnapshot). An in-process invalidation
// (invalidateAlumniCaches) only clears the ONE instance that handled the write,
// so other instances keep serving the pre-write payload for up to a full TTL.
//
// Mechanism: a site-wide, persistent Netlify Blobs store holds one epoch value
// per program. Write paths that change what rides the itinerary payload (rally
// point, roll call, company choice, field updates) call bumpLiveVersion();
// every cached read stores the epoch it was built under and re-fetches when
// the stored epoch no longer matches. Reads are micro-cached for a few seconds
// per instance so a polling fleet costs ~1 blob read every few seconds, not
// one per request.
//
// Resilience: fail-open everywhere. If Blobs is unreachable (local dev without
// credentials, transient outage) reads return null — callers treat that as
// "no signal" and fall back to plain TTL behavior. A bump failure is logged
// and swallowed; the TTL remains the backstop.

import "server-only";
import { getStore } from "@netlify/blobs";

const STORE_NAME = "dat-field-kit-live";

// How long one instance trusts its last blob read. Keep small — this bounds
// how "instant" a cross-instance bump can be — but > 0 so a 20s polling fleet
// doesn't turn into a blob read per request.
const VERSION_READ_TTL_MS = 2_500;

function getBlobStore() {
  const siteID = (process.env.NETLIFY_SITE_ID || process.env.SITE_ID || "").trim();
  const token = (process.env.NETLIFY_AUTH_TOKEN || "").trim();
  if (siteID && token) return getStore({ name: STORE_NAME, siteID, token });
  return getStore(STORE_NAME);
}

function blobsUsable(): boolean {
  // Mirrors lib/loadCsv.ts: Netlify runtime auto-injects credentials; local
  // dev needs both NETLIFY_SITE_ID + NETLIFY_AUTH_TOKEN to reach Blobs.
  return (
    process.env.NETLIFY === "true" ||
    !!(process.env.NETLIFY_SITE_ID && process.env.NETLIFY_AUTH_TOKEN)
  );
}

const key = (programId: string) => `epoch:${String(programId ?? "").trim().toLowerCase()}`;

type VersionHit = { at: number; value: string | null };
const _readCache = new Map<string, VersionHit>();

/**
 * Current live epoch for a program, or null when unavailable (no Blobs, never
 * bumped, or read failure). Micro-cached per instance (VERSION_READ_TTL_MS).
 */
export async function getLiveVersion(programId: string): Promise<string | null> {
  if (!blobsUsable()) return null;
  const k = key(programId);
  const now = Date.now();
  const hit = _readCache.get(k);
  if (hit && now - hit.at < VERSION_READ_TTL_MS) return hit.value;

  let value: string | null = null;
  try {
    const v = await getBlobStore().get(k, { type: "text" });
    value = typeof v === "string" && v.trim() ? v.trim() : null;
  } catch {
    value = null; // fail open — TTL caching remains the backstop
  }
  _readCache.set(k, { at: now, value });
  return value;
}

/**
 * Bump the live epoch for a program — every instance's next version check sees
 * a mismatch and refetches. Best-effort: failures are logged, never thrown
 * (the action that triggered the bump must still succeed).
 */
export async function bumpLiveVersion(programId: string): Promise<void> {
  const k = key(programId);
  const value = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  try {
    await getBlobStore().set(k, value);
    _readCache.set(k, { at: Date.now(), value }); // this instance sees it immediately
  } catch (e) {
    console.warn("[fieldKitLiveVersion] bump failed (TTL backstop applies):", e instanceof Error ? e.message : e);
  }
}
