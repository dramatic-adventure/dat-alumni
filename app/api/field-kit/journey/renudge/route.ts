// app/api/field-kit/journey/renudge/route.ts
//
// POST — the ONE-SHOT "your card got easier" re-nudge (review/audio build,
// §10-Q5). Deliberately NOT on any schedule: nothing calls this route
// automatically. Jesse fires it once, when he decides, with the shared
// CRON_SECRET header (same auth as /journey/auto-assemble):
//
//   dry run (lists who would receive it, sends nothing):
//     curl -X POST -H "x-cron-secret: $CRON_SECRET" <site>/api/field-kit/journey/renudge
//   the real send (once; the claim-first log makes retries no-ops):
//     curl -X POST -H "x-cron-secret: $CRON_SECRET" <site>/api/field-kit/journey/renudge \
//       -H "Content-Type: application/json" -d '{"send":true}'

import { NextResponse } from "next/server";
import { FIELD_KIT_PROGRAM_ID } from "@/lib/fieldKitAccess";
import { runCardEasierRenudge } from "@/lib/journeyAutoAssemble";
import { getCronSecret } from "@/lib/notificationSecrets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const secret = await getCronSecret();
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  }
  if ((req.headers.get("x-cron-secret") || "").trim() !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as { send?: unknown } | null;
  const send = body?.send === true;

  try {
    const result = await runCardEasierRenudge(FIELD_KIT_PROGRAM_ID, send);
    return NextResponse.json({ ok: true, programId: FIELD_KIT_PROGRAM_ID, ...result });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("JOURNEY RENUDGE ERROR:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
