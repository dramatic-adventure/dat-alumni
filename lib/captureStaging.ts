// lib/captureStaging.ts
//
// Netlify Blobs staging store for CHUNKED Field Kit capture uploads.
//
// WHY: Next API routes on Netlify are Lambda-backed with a ~6 MB request-body
// ceiling, but voice recordings legitimately run larger (server cap is 25 MB).
// The client (lib/captureSync) splits an oversized blob into ~3 MB chunks and
// POSTs each to /api/field-kit/capture/chunk, which stages the bytes here;
// the finalize call to /api/field-kit/capture then reassembles them and runs
// the normal Drive + Sheet flow. Same site-wide persistent store pattern as
// lib/notificationSecrets.ts (no deployID → survives deploys, readable from
// any route), with the same siteID/token fallback so local dev with
// NETLIFY_SITE_ID + NETLIFY_AUTH_TOKEN in .env.local works too.
//
// Keys are `<captureId>/<seq>`; chunks are deleted (best-effort) after a
// successful finalize or a dedup hit. captureId is a client-minted ULID, so
// keys never collide across captures.

import { getStore } from "@netlify/blobs";

const STORE_NAME = "dat-capture-staging";

// Size contract lives in lib/captureChunkContract (import-free so the client
// drainer can share it without pulling the Blobs SDK into the browser bundle).
export { DIRECT_MAX_BYTES, CHUNK_BYTES, MAX_CHUNKS } from "@/lib/captureChunkContract";

export function captureStagingStore() {
  const siteID = (process.env.NETLIFY_SITE_ID || process.env.SITE_ID || "").trim();
  const token = (process.env.NETLIFY_AUTH_TOKEN || "").trim();
  if (siteID && token) return getStore({ name: STORE_NAME, siteID, token });
  return getStore(STORE_NAME);
}

export function chunkKey(captureId: string, seq: number): string {
  return `${captureId}/${seq}`;
}

/** Best-effort cleanup after finalize/dedup — never throws. */
export async function deleteStagedChunks(captureId: string, chunkCount: number): Promise<void> {
  try {
    const store = captureStagingStore();
    await Promise.all(
      Array.from({ length: chunkCount }, (_, i) => store.delete(chunkKey(captureId, i)).catch(() => {}))
    );
  } catch {
    // Orphaned staging bytes are harmless; a later upload never reuses the key.
  }
}
