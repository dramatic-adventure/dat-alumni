// app/api/field-kit/company-choice/route.ts
//
// GET ?id=<choiceSetId> — the LEADER/ADMIN tally board: live per-choice counts
// + who hasn't voted. Tallies are staff + road managers/directors ONLY while a
// question is open (Jesse, 2026-07-02); artists get results only after close,
// per the question's visibility, via the itinerary payload — never from here.

import { NextResponse } from "next/server";
import { rateLimit, rateKey } from "@/lib/rateLimit";
import { getFieldKitAccess, FIELD_KIT_PROGRAM_ID } from "@/lib/fieldKitAccess";
import { isFieldKitLeader } from "@/lib/fieldKitLeaders";
import { getCompanyChoiceById, getCompanyChoiceVotes, tallyVotes } from "@/lib/companyChoice";
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

    const [choice, votes, crew] = await Promise.all([
      getCompanyChoiceById(access.programId, id),
      getCompanyChoiceVotes(id),
      loadFieldKitCrew(access.programId),
    ]);
    if (!choice) return NextResponse.json({ error: "Unknown question" }, { status: 404 });

    const votedSlugs = new Set(votes.map((v) => normId(v.alumniSlug)));
    const notVoted = crew
      .filter((m) => !votedSlugs.has(normId(m.slug)))
      .map((m) => ({ slug: m.slug, name: m.name }));

    return NextResponse.json(
      {
        choice,
        tallies: tallyVotes(choice.choices, votes),
        votedCount: votes.length,
        total: crew.length,
        notVoted,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("FIELD-KIT COMPANY CHOICE BOARD ERROR:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
