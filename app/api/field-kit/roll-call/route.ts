// app/api/field-kit/roll-call/route.ts
//
// GET ?id=<rollCallId> — the LEADER/ADMIN Roll Call board: per-status counts +
// who's responded / who hasn't, joined with crew names. Headcounts are staff +
// road managers/directors ONLY (Jesse, 2026-07-02 — the "no shame, no metrics"
// line): a regular roster member gets a 403, and their own status never comes
// from here (it rides the Today page render + the device's own ops state).
//
// All reads underneath are TTL-cached (responses 15s, crew/leaders 60s), so the
// leader panel's focus/poll refetch never hammers Sheets.

import { NextResponse } from "next/server";
import { rateLimit, rateKey } from "@/lib/rateLimit";
import { getFieldKitAccess, FIELD_KIT_PROGRAM_ID } from "@/lib/fieldKitAccess";
import { isFieldKitLeader } from "@/lib/fieldKitLeaders";
import { getRollCallById, getRollCallResponses } from "@/lib/rollCall";
import { loadFieldKitCrew } from "@/lib/loadFieldKitCrew";
import { normId } from "@/lib/sheetsResilience";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    if (!rateLimit(rateKey(req), 60, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
    const url = new URL(req.url);
    const id = (url.searchParams.get("id") || "").trim();
    const asId = (url.searchParams.get("asId") || "").trim() || undefined;

    const access = await getFieldKitAccess(FIELD_KIT_PROGRAM_ID, asId);
    if (!access.allowed) {
      const status = access.reason === "signed-out" ? 401 : 403;
      return NextResponse.json({ error: "Forbidden" }, { status });
    }
    if (!(await isFieldKitLeader(access))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const [rollCall, responses, crew] = await Promise.all([
      getRollCallById(access.programId, id),
      getRollCallResponses(id),
      loadFieldKitCrew(access.programId),
    ]);
    if (!rollCall) return NextResponse.json({ error: "Unknown roll call" }, { status: 404 });

    const nameOf = new Map(crew.map((m) => [normId(m.slug), m.name]));
    const bySlug = new Map(responses.map((r) => [normId(r.alumniSlug), r]));

    const responded = responses.map((r) => ({
      slug: r.alumniSlug,
      name: nameOf.get(normId(r.alumniSlug)) || r.alumniSlug,
      status: r.status,
      respondedAt: r.respondedAt,
    }));
    const notResponded = crew
      .filter((m) => !bySlug.has(normId(m.slug)))
      .map((m) => ({ slug: m.slug, name: m.name }));

    return NextResponse.json(
      {
        rollCall,
        counts: {
          here: responses.filter((r) => r.status === "here").length,
          needsHelp: responses.filter((r) => r.status === "needs-help").length,
          responded: responses.length,
          total: crew.length,
        },
        responded,
        notResponded,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("FIELD-KIT ROLL CALL BOARD ERROR:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
