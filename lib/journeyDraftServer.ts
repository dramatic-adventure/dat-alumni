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
import type { JourneyDraft, StoredJourneyDraft } from "@/lib/journeyDraft";

const STORE_NAME = "dat-journey-drafts";

function norm(s: unknown): string {
  return String(s ?? "").trim().toLowerCase();
}

const memStore = new Map<string, StoredJourneyDraft>();

function blobsConfigured(): boolean {
  const isNetlifyRuntime = process.env.NETLIFY === "true" || !!process.env.NETLIFY_SITE_ID;
  const hasLocalCreds =
    !!process.env.NETLIFY_SITE_ID?.trim() && !!process.env.NETLIFY_AUTH_TOKEN?.trim();
  return isNetlifyRuntime || hasLocalCreds;
}

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

export async function readStoredDraft(key: string): Promise<StoredJourneyDraft | null> {
  if (blobsConfigured()) {
    try {
      const v = await blobStore().get(key, { type: "json" });
      return (v as StoredJourneyDraft | null) ?? null;
    } catch (err) {
      console.error("[field-kit draft] blob get failed:", err);
      return null;
    }
  }
  return memStore.get(key) ?? null;
}

export async function writeStoredDraft(key: string, value: StoredJourneyDraft): Promise<void> {
  if (blobsConfigured()) {
    await blobStore().setJSON(key, value);
    return;
  }
  memStore.set(key, value);
}
