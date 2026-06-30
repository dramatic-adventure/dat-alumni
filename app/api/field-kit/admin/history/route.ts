// app/api/field-kit/admin/history/route.ts
//
// GET /api/field-kit/admin/history — the Sent-history log for the staff console
// (admin-only). Reads the "Field Kit Notifications" tab for the admin's program.

import { NextResponse } from "next/server";
import { guardFieldKitAdminApi, FIELD_KIT_PROGRAM_ID } from "@/lib/fieldKitAccess";
import { listNotifications } from "@/lib/notifications";

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
