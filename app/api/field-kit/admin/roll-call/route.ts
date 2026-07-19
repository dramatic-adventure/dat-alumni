// app/api/field-kit/admin/roll-call/route.ts
//
// POST — admin-only Roll Call controls, gated exactly like the existing
// admin/rally route. action "open" appends a new roll call (it becomes the
// current one on artists' Today via the itinerary payload), records a
// Notifications row (sentAt SET — the cron never re-sends), and pushes the
// whole roster a "check in" nudge. action "close" stamps closedAt; no push
// (the card quietly flips to closed on the next LiveRefresh tick).

import { NextResponse } from "next/server";
import { guardFieldKitAdminApi, FIELD_KIT_PROGRAM_ID } from "@/lib/fieldKitAccess";
import { openRollCall, closeRollCall } from "@/lib/rollCall";
import { appendNotification, newNotificationId } from "@/lib/notifications";
import { sendToProgram } from "@/lib/webPush";
import { bumpLiveVersion } from "@/lib/fieldKitLiveVersion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LINK = "/field-kit"; // Today home, where the Roll Call card renders

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const asId = typeof body?.asId === "string" && body.asId.trim() ? body.asId.trim() : undefined;
    const program =
      typeof body?.program === "string" && body.program.trim()
        ? body.program.trim()
        : FIELD_KIT_PROGRAM_ID;

    const access = await guardFieldKitAdminApi(program, asId);
    if (access instanceof NextResponse) return access;

    const action = String(body?.action ?? "").trim().toLowerCase();

    if (action === "open") {
      const label = String(body?.label ?? "").trim();
      const dayId = String(body?.dayId ?? "").trim();
      if (!label) return NextResponse.json({ error: "label is required" }, { status: 400 });

      const rollCall = await openRollCall(access.programId, { dayId, label });
      // Cross-instance cache-bust: artists' next poll refetches the itinerary
      // (which carries the roll call) instead of waiting out server TTLs.
      await bumpLiveVersion(access.programId);
      const message = {
        title: "Roll call — check in",
        body: label,
        link: LINK,
      };

      await appendNotification({
        id: newNotificationId(),
        programId: access.programId,
        type: "roll-call",
        title: message.title,
        body: message.body,
        link: message.link,
        notify: true,
        sentAt: new Date().toISOString(),
      });

      let sent = 0;
      let total = 0;
      let sendError: string | undefined;
      try {
        const r = await sendToProgram(access.programId, message);
        sent = r.sent;
        total = r.total;
      } catch (e) {
        sendError = e instanceof Error ? e.message : String(e);
      }

      return NextResponse.json({ ok: true, rollCall, sent, total, ...(sendError ? { sendError } : {}) });
    }

    if (action === "close") {
      const id = String(body?.id ?? "").trim();
      if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
      const rollCall = await closeRollCall(access.programId, id);
      if (!rollCall) return NextResponse.json({ error: "Unknown roll call" }, { status: 404 });
      await bumpLiveVersion(access.programId);
      return NextResponse.json({ ok: true, rollCall });
    }

    return NextResponse.json({ error: "action must be open or close" }, { status: 400 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("FIELD-KIT ADMIN ROLL CALL ERROR:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
