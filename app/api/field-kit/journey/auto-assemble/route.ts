// app/api/field-kit/journey/auto-assemble/route.ts
//
// POST — Slice 7's scheduled entry point (§4-R Q1). Triggered every 15 min by
// netlify/functions/journey-auto-composer.ts; NOT a user gate (no session) —
// authorized by the shared CRON_SECRET header, exactly like /push/dispatch.
//
// Each run: (1) auto-assemble every roster artist's JourneyDraft from their own
// captures — pure rules, no LLM (lib/journeyAutoComposer) — into the private
// draft store Composer already reads; (2) run the end-of-trip nudge check
// (push at end+1d, email at end+3d, publishedCardId the only skip).
//
// Idempotent by design: the assembler skips byte-identical drafts, the nudge
// log claims each channel before sending, and nothing here ever publishes —
// drafts stay private until the artist stamps them.

import { NextResponse } from "next/server";
import { FIELD_KIT_PROGRAM_ID } from "@/lib/fieldKitAccess";
import { runAutoAssembly, runTripEndNudge } from "@/lib/journeyAutoAssemble";
import { getCronSecret } from "@/lib/notificationSecrets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(req: Request, secret: string): boolean {
  const header = (req.headers.get("x-cron-secret") || "").trim();
  return header === secret;
}

export async function POST(req: Request) {
  const secret = await getCronSecret();
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  }
  if (!authorized(req, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const assembly = await runAutoAssembly(FIELD_KIT_PROGRAM_ID);
    const nudge = await runTripEndNudge(FIELD_KIT_PROGRAM_ID);
    return NextResponse.json({ ok: true, programId: FIELD_KIT_PROGRAM_ID, assembly, nudge });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("JOURNEY AUTO-ASSEMBLE ERROR:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
