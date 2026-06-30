// app/api/field-kit/itinerary/route.ts
//
// GET /api/field-kit/itinerary?program=… — the canonical client-facing itinerary
// fetch. Returns { itinerary, hash } where `hash` is a cheap, server-computed
// fingerprint of the serialized itinerary (lib/programItinerary#hashItinerary)
// for change detection. The Field Kit's live-refresh client polls this to notice
// edits without a manual reload; Slice 2 will reuse it for the offline snapshot.
//
// Trust model (defense in depth — never trust the layout/middleware for a direct
// API hit): this route re-runs the SAME access gate the pages use, scoped to the
// requested program, so a member of one program can never read another's data.
// `program` is validated against the caller's roster by guardFieldKitApi; an
// admin's asId only attributes access, never widens scope.
//
// Quota: many clients polling (~30s each) must not blow the Sheets rate limit, so
// a SHORT module-level TTL cache (per warm instance) shares one itinerary read
// across requests. This only governs change-detection latency — the itinerary
// PAGE stays force-dynamic and renders fresh Sheets data on every request, so the
// displayed document is never stale; this endpoint just trails reality by ≤ TTL.

import { NextResponse } from "next/server";
import { guardFieldKitApi, FIELD_KIT_PROGRAM_ID } from "@/lib/fieldKitAccess";
import { loadProgramItinerary } from "@/lib/loadProgram";
import { hashItinerary, type ProgramItinerary } from "@/lib/programItinerary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Short shared cache: long enough to absorb a fleet of 30s pollers, short enough
// that change detection stays near-real-time.
const CACHE_TTL_MS = 8_000;

type Snapshot = { itinerary: ProgramItinerary | null; hash: string };
const snapshotCache = new Map<string, { at: number; value: Snapshot }>();

// Keyed by programId only — the itinerary is program-level (identical for every
// roster member), so asId never affects what's returned, only whether the caller
// is allowed in (gated above).
async function getSnapshot(programId: string): Promise<Snapshot> {
  const now = Date.now();
  const hit = snapshotCache.get(programId);
  if (hit && now - hit.at < CACHE_TTL_MS) return hit.value;

  const itinerary = await loadProgramItinerary(programId);
  const value: Snapshot = { itinerary, hash: itinerary ? hashItinerary(itinerary) : "" };
  snapshotCache.set(programId, { at: now, value });
  return value;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const program = (url.searchParams.get("program") || "").trim() || FIELD_KIT_PROGRAM_ID;
  const asId = (url.searchParams.get("asId") || "").trim() || undefined;

  // Signed-out → 401, not on THIS program's roster → 403. Scoped to `program`, so
  // one program's member can't read another's itinerary.
  const denied = await guardFieldKitApi(program, asId);
  if (denied) return denied;

  const { itinerary, hash } = await getSnapshot(program);
  return NextResponse.json(
    { itinerary, hash },
    { headers: { "Cache-Control": "no-store" } }
  );
}
