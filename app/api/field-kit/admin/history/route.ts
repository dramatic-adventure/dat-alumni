// app/api/field-kit/admin/history/route.ts
//
// GET /api/field-kit/admin/history — the Sent-history log for the staff console
// (admin-only). Reads the "Field Kit Notifications" tab for the admin's program.
//
// DELETE /api/field-kit/admin/history — "Clear" a history entry (admin-only).
// Marks the row cancelled (cancelledAt=now, expiresAt=now) rather than deleting
// it; the row stays in the Sheet as an audit trail but disappears from the
// console and can never be sent by the cron. Note: a push already delivered to
// phones can't be recalled — this stops future delivery and hides the entry.

import { NextResponse } from "next/server";
import { guardFieldKitAdminApi, FIELD_KIT_PROGRAM_ID } from "@/lib/fieldKitAccess";
import { listNotifications, cancelNotification } from "@/lib/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const program = (url.searchParams.get("program") || "").trim() || FIELD_KIT_PROGRAM_ID;
    const asId = (url.searchParams.get("asId") || "").trim() || undefined;

    const access = await guardFieldKitAdminApi(program, asId);
    if (access instanceof NextResponse) return access;

    const notifications = await listNotifications(access.programId);
    return NextResponse.json(
      { ok: true, notifications },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("FIELD-KIT ADMIN HISTORY ERROR:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const program =
      typeof body?.program === "string" && body.program.trim()
        ? body.program.trim()
        : FIELD_KIT_PROGRAM_ID;
    const asId =
      typeof body?.asId === "string" && body.asId.trim() ? body.asId.trim() : undefined;

    const access = await guardFieldKitAdminApi(program, asId);
    if (access instanceof NextResponse) return access;

    const id = String(body?.id ?? "").trim();
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const cancelled = await cancelNotification(access.programId, id);
    if (!cancelled) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("FIELD-KIT ADMIN HISTORY CLEAR ERROR:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
