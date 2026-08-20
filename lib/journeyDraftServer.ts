// lib/journeyDraftServer.ts
//
// Slice 7 — the server-side JourneyDraft storage backend, extracted verbatim
// from app/api/field-kit/draft/route.ts so the scheduled auto-assembler
// (lib/journeyAutoAssemble.ts) and the draft route read/write the SAME store
// with the same keying and the same local-dev memory fallback.
//
// Storage: site-wide persistent Netlify Blobs store (no deployID — survives
// deploys), like dat-notification-secrets. Falls back to a per-instance memory
// map when Blobs isn't configured (plain local `next dev`) — fine there: the
// device's IndexedDB copy still carries the artist's draft.

import "server-only";
import { getStore } from "@netlify/blobs";
import { isBlobsConfigError } from "@/lib/blobsConfigError";
import type { JourneyDraft, StoredJourneyDraft } from "@/lib/journeyDraft";

const STORE_NAME = "dat-journey-drafts";

function norm(s: unknown): string {
  return String(s ?? "").trim().toLowerCase();
}

const memStore = new Map<string, StoredJourneyDraft>();

function blobStore() {
  const siteID = (process.env.NETLIFY_SITE_ID || process.env.SITE_ID || "").trim();
  const token = (process.env.NETLIFY_AUTH_TOKEN || "").trim();
  if (siteID && token) return getStore({ name: STORE_NAME, siteID, token });
  return getStore(STORE_NAME);
}

export function draftStorageKey(
  slug: string,
  kind: JourneyDraft["kind"],
  programId: string
): string {
  return `${slug}/${kind}/${norm(programId)}`;
}

// Always TRY Blobs; the memory map is only for local `next dev` without creds
// (isBlobsConfigError). Gating on build-time env vars here silently sent every
// production draft write to per-instance memory — see lib/blobsConfigError.ts.
export async function readStoredDraft(key: string): Promise<StoredJourneyDraft | null> {
  try {
    const v = await blobStore().get(key, { type: "json" });
    return (v as StoredJourneyDraft | null) ?? null;
  } catch (err) {
    if (isBlobsConfigError(err)) return memStore.get(key) ?? null;
    console.error("[field-kit draft] blob get failed:", err);
    return null;
  }
}

export async function writeStoredDraft(key: string, value: StoredJourneyDraft): Promise<void> {
  try {
    await blobStore().setJSON(key, value);
  } catch (err) {
    if (isBlobsConfigError(err)) {
      memStore.set(key, value);
      return;
    }
    // A real Blobs failure must be loud — never silently lose an artist's draft.
    throw err;
  }
}
