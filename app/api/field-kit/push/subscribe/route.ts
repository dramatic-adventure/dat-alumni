// app/api/field-kit/push/subscribe/route.ts
//
// POST /api/field-kit/push/subscribe — store the caller's web-push
// PushSubscription so trip alerts can reach this device.
//
// Trust model (defense in depth — never trust the layout/middleware for a direct
// API hit): re-run the SAME access resolver the pages use. programId + alumniSlug
// are ALWAYS server-derived from the verified access record (the impersonated
// member when an admin sends asId); the body's subscription is the only trusted
// input. Signed-out → 401, not on this program's roster → 403.

import { NextResponse } from "next/server";
import { getFieldKitAccess, FIELD_KIT_PROGRAM_ID } from "@/lib/fieldKitAccess";
import { upsertSubscription } from "@/lib/pushSubscriptions";
import { rateLimit, rateKey } from "@/lib/rateLimit";
import { normId } from "@/lib/sheetsResilience";

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

    const access = await getFieldKitAccess(program, asId);
    if (!access.allowed) {
      const status = access.reason === "signed-out" ? 401 : 403;
      return NextResponse.json({ error: "Forbidden" }, { status });
    }

    const sub = (body?.subscription ?? null) as
      | { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } }
      | null;
    const endpoint = String(sub?.endpoint ?? "").trim();
    const p256dh = String(sub?.keys?.p256dh ?? "").trim();
    const auth = String(sub?.keys?.auth ?? "").trim();
    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
    }

    await upsertSubscription({
      programId: access.programId,
      alumniSlug: normId(access.slug),
      endpoint,
      keys: { p256dh, auth },
    });

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("FIELD-KIT PUSH SUBSCRIBE ERROR:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
