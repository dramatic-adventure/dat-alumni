// app/api/field-kit/push/unsubscribe/route.ts
//
// POST /api/field-kit/push/unsubscribe — forget this device's web-push
// subscription (the artist turned trip alerts off). Same access gate as
// subscribe; the row is matched purely by its own `endpoint`.

import { NextResponse } from "next/server";
import { guardFieldKitApi, FIELD_KIT_PROGRAM_ID } from "@/lib/fieldKitAccess";
import { deleteSubscriptionsByEndpoint } from "@/lib/pushSubscriptions";
import { rateLimit, rateKey } from "@/lib/rateLimit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    if (!rateLimit(rateKey(req), 30, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const asId =
      typeof body?.asId === "string" && body.asId.trim() ? body.asId.trim() : undefined;
    const program =
      typeof body?.program === "string" && body.program.trim()
        ? body.program.trim()
        : FIELD_KIT_PROGRAM_ID;

    const denied = await guardFieldKitApi(program, asId);
    if (denied) return denied;

    const endpoint = String(body?.endpoint ?? "").trim();
    if (!endpoint) return NextResponse.json({ error: "endpoint is required" }, { status: 400 });

    await deleteSubscriptionsByEndpoint([endpoint]);
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("FIELD-KIT PUSH UNSUBSCRIBE ERROR:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
