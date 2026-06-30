// app/api/field-kit/admin/rally/route.ts
//
// POST /api/field-kit/admin/rally — "Set Rally Point" (admin-only). Updates the
// CURRENT rally point (lib/rallyPoint — stored so it rides the itinerary payload
// and precaches offline), records a Notifications row (type "rally", sentAt SET),
// and pushes a "rally" notification to the program roster. The push links to the
// Today home, where the rally card renders.

import { NextResponse } from "next/server";
import { guardFieldKitAdminApi, FIELD_KIT_PROGRAM_ID } from "@/lib/fieldKitAccess";
import { appendNotification, newNotificationId } from "@/lib/notifications";
import { setRallyPoint } from "@/lib/rallyPoint";
import { sendToProgram } from "@/lib/webPush";
import type { RallyPoint } from "@/lib/programItinerary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RALLY_LINK = "/field-kit"; // Today home, where RallyPointBanner shows

/** Compose the push title/body from the rally fields, omitting empty parts. */
function composeRallyMessage(rally: RallyPoint): { title: string; body: string; link: string } {
  const parts: string[] = [];
  if (rally.location) parts.push(`Meet at ${rally.location}`);
  if (rally.meetTime) parts.push(`by ${rally.meetTime}`);
  let body = parts.join(" ");
  if (rally.lookFor) body += `${body ? ". " : ""}Look for ${rally.lookFor}`;
  if (rally.departure) body += `${body ? ". " : ""}Departs ${rally.departure}`;
  return {
    title: rally.location ? `Rally point: ${rally.location}` : "Rally point set",
    body: body || "A new rally point has been set.",
    link: RALLY_LINK,
  };
}

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

    const location = String(body?.location ?? "").trim();
    const lookFor = String(body?.lookFor ?? "").trim();
    const meetTime = String(body?.meetTime ?? "").trim();
    const departure = String(body?.departure ?? "").trim();
    if (!location) {
      return NextResponse.json({ error: "location is required" }, { status: 400 });
    }

    const rally = await setRallyPoint(access.programId, { location, lookFor, meetTime, departure });
    const message = composeRallyMessage(rally);

    await appendNotification({
      id: newNotificationId(),
      programId: access.programId,
      type: "rally",
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

    return NextResponse.json({
      ok: true,
      rally,
      message,
      sent,
      total,
      ...(sendError ? { sendError } : {}),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("FIELD-KIT ADMIN RALLY ERROR:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
