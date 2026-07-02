// app/api/field-kit/company-choice/vote/route.ts
//
// POST — an artist's Company Choice vote. Write side of the offline ops queue,
// same trust model as the capture + roll-call routes: identity and program are
// server-derived, never from the body. Upserts by (choiceSetId, alumniSlug) —
// one vote per artist, changeable while the question is open, idempotent under
// queue retries.
//
// A vote that syncs AFTER the question closed is rejected 409 (a PERMANENT
// status for lib/opsSync — the results were announced; counting a late vote
// would silently change them). The card surfaces that in "no shame" language.

import { NextResponse } from "next/server";
import { rateLimit, rateKey } from "@/lib/rateLimit";
import { getFieldKitAccess, FIELD_KIT_PROGRAM_ID } from "@/lib/fieldKitAccess";
import { getCompanyChoiceById, upsertCompanyChoiceVote } from "@/lib/companyChoice";
import { normId } from "@/lib/sheetsResilience";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    if (!rateLimit(rateKey(req), 60, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    const asId = typeof body.asId === "string" && body.asId.trim() ? body.asId.trim() : undefined;

    const access = await getFieldKitAccess(FIELD_KIT_PROGRAM_ID, asId);
    if (!access.allowed) {
      const status = access.reason === "signed-out" ? 401 : 403;
      return NextResponse.json({ error: "Forbidden" }, { status });
    }
    const slug = normId(access.slug);
    if (!slug) {
      return NextResponse.json({ error: "No profile linked to this account" }, { status: 403 });
    }

    const choiceSetId = String(body.choiceSetId ?? "").trim();
    const selection = String(body.selection ?? "").trim();
    const votedAt = String(body.votedAt ?? "").trim();
    if (!choiceSetId) return NextResponse.json({ error: "choiceSetId is required" }, { status: 400 });
    if (!selection) return NextResponse.json({ error: "selection is required" }, { status: 400 });

    const choice = await getCompanyChoiceById(access.programId, choiceSetId);
    if (!choice) return NextResponse.json({ error: "Unknown question" }, { status: 400 });
    if (choice.closedAt) {
      return NextResponse.json(
        { error: "Voting closed before this vote reached the server" },
        { status: 409 }
      );
    }
    const match = choice.choices.find((c) => normId(c) === normId(selection));
    if (!match) {
      return NextResponse.json({ error: "selection is not one of the choices" }, { status: 400 });
    }

    await upsertCompanyChoiceVote({
      choiceSetId,
      alumniSlug: slug,
      selection: match, // store the canonical choice text
      votedAt: votedAt || undefined,
    });

    return NextResponse.json({ ok: true, choiceSetId, selection: match });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("FIELD-KIT COMPANY CHOICE VOTE ERROR:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
