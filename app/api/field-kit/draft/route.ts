// app/api/field-kit/draft/route.ts
//
// Slice 6 — private server copy of a JourneyDraft (§4-R Q7). The device's
// IndexedDB copy is the working truth; this route holds the last-write-wins
// backup in Netlify Blobs so a lost phone doesn't lose a draft and desktop can
// continue what a phone started.
//
//   GET  ?kind=live|retro&programId=…[&asId=…]  → { draft } (null when none)
//   PUT  { draft, asId? }                       → { ok: true }
//
// Trust model (defense in depth, mirrors /api/field-kit/capture): the author is
// ALWAYS derived server-side —
//   • kind "live"  → lib/fieldKitAccess (in-program roster / admin), and the
//     draft's programId must be the verified Field Kit program.
//   • kind "retro" → lib/retroJourneyAccess (§4-R Q4: profile owner AND on the
//     programMap roster of the target past program).
// The blob key is derived from the server-side slug, so one artist can never
// read or write another's draft regardless of what the body claims.
//
// Drafts are text + capture refs only (media bytes live in the capture queue /
// Drive), so a per-draft JSON size cap is plenty.
//
// Storage: site-wide persistent Blobs store (no deployID — survives deploys),
// like dat-notification-secrets. Falls back to a per-instance memory map when
// Blobs isn't configured (plain local `next dev`), which is fine there: the
// IndexedDB copy still carries the draft; the server copy is best-effort.

import { NextResponse } from "next/server";
import { getStore } from "@netlify/blobs";
import { rateLimit, rateKey } from "@/lib/rateLimit";
import { getFieldKitAccess, FIELD_KIT_PROGRAM_ID } from "@/lib/fieldKitAccess";
import { getRetroJourneyAccess, isOnRetroProgram } from "@/lib/retroJourneyAccess";
import {
  coerceJourneyDraft,
  MAX_DRAFT_JSON_CHARS,
  type JourneyDraft,
  type StoredJourneyDraft,
} from "@/lib/journeyDraft";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STORE_NAME = "dat-journey-drafts";

function norm(s: unknown): string {
  return String(s ?? "").trim().toLowerCase();
}

// ── Storage backend (Blobs on Netlify / with local creds; memory otherwise) ──

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

async function readStored(key: string): Promise<StoredJourneyDraft | null> {
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

async function writeStored(key: string, value: StoredJourneyDraft): Promise<void> {
  if (blobsConfigured()) {
    await blobStore().setJSON(key, value);
    return;
  }
  memStore.set(key, value);
}

// ── Auth: resolve the server-side slug for (kind, programId) ─────────────────

type DraftAuth =
  | { ok: true; slug: string }
  | { ok: false; response: NextResponse };

async function authorizeDraft(
  kind: JourneyDraft["kind"],
  programId: string,
  asId?: string
): Promise<DraftAuth> {
  if (kind === "live") {
    const access = await getFieldKitAccess(FIELD_KIT_PROGRAM_ID, asId);
    if (!access.allowed) {
      const status = access.reason === "signed-out" ? 401 : 403;
      return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status }) };
    }
    if (norm(programId) !== norm(access.programId)) {
      return {
        ok: false,
        response: NextResponse.json({ error: "Unknown live program" }, { status: 403 }),
      };
    }
    const slug = norm(access.slug);
    if (!slug) {
      return {
        ok: false,
        response: NextResponse.json({ error: "No profile linked to this account" }, { status: 403 }),
      };
    }
    return { ok: true, slug };
  }

  // retro
  const access = await getRetroJourneyAccess(asId);
  if (!access.allowed) {
    const status = access.reason === "signed-out" ? 401 : 403;
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status }) };
  }
  if (!isOnRetroProgram(access.slug, programId)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Not on this program's roster" },
        { status: 403 }
      ),
    };
  }
  return { ok: true, slug: access.slug };
}

function storageKey(slug: string, kind: JourneyDraft["kind"], programId: string): string {
  return `${slug}/${kind}/${norm(programId)}`;
}

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(req: Request) {
  try {
    if (!rateLimit(rateKey(req), 120, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
    const url = new URL(req.url);
    const kind = norm(url.searchParams.get("kind")) === "retro" ? "retro" : "live";
    const programId = String(url.searchParams.get("programId") ?? "").trim();
    const asId = String(url.searchParams.get("asId") ?? "").trim() || undefined;
    if (!programId) {
      return NextResponse.json({ error: "programId is required" }, { status: 400 });
    }

    const auth = await authorizeDraft(kind, programId, asId);
    if (!auth.ok) return auth.response;

    const stored = await readStored(storageKey(auth.slug, kind, programId));
    return NextResponse.json(
      { draft: stored?.draft ?? null },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("FIELD-KIT DRAFT GET ERROR:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ── PUT ───────────────────────────────────────────────────────────────────────

export async function PUT(req: Request) {
  try {
    if (!rateLimit(rateKey(req), 60, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const raw = await req.text();
    if (raw.length > MAX_DRAFT_JSON_CHARS) {
      return NextResponse.json({ error: "Draft too large" }, { status: 413 });
    }
    let body: { draft?: unknown; asId?: string };
    try {
      body = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const draft = coerceJourneyDraft(body.draft);
    if (!draft) {
      return NextResponse.json({ error: "Invalid draft" }, { status: 400 });
    }
    const asId = String(body.asId ?? "").trim() || undefined;

    const auth = await authorizeDraft(draft.kind, draft.programId, asId);
    if (!auth.ok) return auth.response;

    // The author is the verified session identity — never the body's claim.
    draft.authorSlug = auth.slug;

    // Last-write-wins by the draft's own updatedAt: never let a stale device
    // (e.g. a phone that was offline for a day, syncing on reconnect) clobber
    // newer edits made from another device.
    const key = storageKey(auth.slug, draft.kind, draft.programId);
    const stored = await readStored(key);
    if (stored && stored.draft.updatedAt > draft.updatedAt) {
      return NextResponse.json(
        { ok: true, stale: true, draft: stored.draft },
        { headers: { "Cache-Control": "no-store, max-age=0" } }
      );
    }

    await writeStored(key, { draft, serverUpdatedAt: new Date().toISOString() });
    return NextResponse.json(
      { ok: true },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("FIELD-KIT DRAFT PUT ERROR:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
