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
// across requests. That cache now lives in lib/itineraryServerSnapshot so the
// itinerary PAGE can render through the SAME getItinerarySnapshot — making the
// page's SSR hash equal this endpoint's (no spurious live-refresh). The displayed
// document trails live edits by ≤ TTL, which is the accepted trade.

import { NextResponse } from "next/server";
import { guardFieldKitApi, FIELD_KIT_PROGRAM_ID } from "@/lib/fieldKitAccess";
import { getItinerarySnapshot } from "@/lib/itineraryServerSnapshot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const program = (url.searchParams.get("program") || "").trim() || FIELD_KIT_PROGRAM_ID;
  const asId = (url.searchParams.get("asId") || "").trim() || undefined;
  // Change-detection short-circuit: pollers send the hash they already render
  // (`since`); when nothing changed we answer with a few bytes instead of the
  // full itinerary payload — on weak field signal that's the difference
  // between a poll that always completes and one that stalls.
  const since = (url.searchParams.get("since") || "").trim();

  // Signed-out → 401, not on THIS program's roster → 403. Scoped to `program`, so
  // one program's member can't read another's itinerary.
  const denied = await guardFieldKitApi(program, asId);
  if (denied) return denied;

  const { itinerary, hash } = await getItinerarySnapshot(program);
  if (since && hash && since === hash) {
    return NextResponse.json(
      { hash, unchanged: true },
      { headers: { "Cache-Control": "no-store" } }
    );
  }
  return NextResponse.json(
    { itinerary, hash },
    { headers: { "Cache-Control": "no-store" } }
  );
}
