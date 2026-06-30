// app/api/field-kit/admin/notify/route.ts
//
// POST /api/field-kit/admin/notify — "Send Field Update" (admin-only). Writes a
// Notifications row (type "update", sentAt SET so the cron never re-sends it) AND
// sends immediately via lib/webPush#sendToProgram. Strictly scoped to the admin's
// verified program — one program can't notify another's roster.

import { NextResponse } from "next/server";
import { guardFieldKitAdminApi, FIELD_KIT_PROGRAM_ID } from "@/lib/fieldKitAccess";
import { appendNotification, newNotificationId } from "@/lib/notifications";
import { sendToProgram } from "@/lib/webPush";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const asId =
      typeof body?.asId === "string" && body.asId.trim() ? body.asId.trim() : undefined;
    const program =
      typeof body?.program === "string" && body.program.trim()
        ? body.program.trim()
        : FIELD_KIT_PROGRAM_ID;

    const access = await guardFieldKitAdminApi(program, asId);
    if (access instanceof NextResponse) return access;

    const title = String(body?.title ?? "").trim();
    const text = String(body?.body ?? "").trim();
    const link = String(body?.link ?? "").trim() || "/field-kit/itinerary";
    if (!title || !text) {
      return NextResponse.json({ error: "title and body are required" }, { status: 400 });
    }

    const message = { title, body: text, link };

    // Record first (sentAt set) so the cron treats it as already handled.
    await appendNotification({
      id: newNotificationId(),
      programId: access.programId,
      type: "update",
      title,
      body: text,
      link,
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

    return NextResponse.json({ ok: true, message, sent, total, ...(sendError ? { sendError } : {}) });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("FIELD-KIT ADMIN NOTIFY ERROR:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
