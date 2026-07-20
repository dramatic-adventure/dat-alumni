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
//
// CASCADE (Jesse, 2026-07-20): clearing a rally / roll-call / choice entry also
// clears the matching Today-page surface — the rally banner, roll-call card, or
// company-choice card disappear for everyone via LiveRefresh. Every cascade
// targets the program's CURRENT op, guarded so a notification older than the
// current op never clears a newer one (its updatedAt/openedAt/postedAt must
// not postdate the entry's sentAt, with 60s clock skew allowed).

import { NextResponse } from "next/server";
import { guardFieldKitAdminApi, FIELD_KIT_PROGRAM_ID } from "@/lib/fieldKitAccess";
import { listNotifications, cancelNotification, type NotificationRow } from "@/lib/notifications";
import { getCurrentRollCall, clearRollCall } from "@/lib/rollCall";
import { getCurrentCompanyChoice, clearCompanyChoice } from "@/lib/companyChoice";
import { getRallyPoint, clearRallyPoint } from "@/lib/rallyPoint";
import { bumpLiveVersion } from "@/lib/fieldKitLiveVersion";

const SKEW_MS = 60_000;

/** The current op predates (or matches) this notification → safe to cascade. */
function opMatchesNotification(opStartedAt: string, n: NotificationRow): boolean {
  const op = Date.parse(opStartedAt);
  const sent = Date.parse(n.sentAt);
  if (!Number.isFinite(op) || !Number.isFinite(sent)) return true; // unparseable — assume the single-current-op case
  return op <= sent + SKEW_MS;
}

/** Clear the Today-page surface the cancelled notification announced, if any. */
async function cascadeClear(programId: string, n: NotificationRow): Promise<string | null> {
  if (n.type === "rally") {
    // Same guard as roll-call/choice: the rally row is one-per-program and
    // overwritten in place, so a newer rally than this notification means the
    // banner belongs to a different op — leave it standing.
    const current = await getRallyPoint(programId);
    if (current && opMatchesNotification(current.updatedAt, n)) {
      await clearRallyPoint(programId);
      return "rally";
    }
    return null;
  }
  if (n.type === "roll-call") {
    const current = await getCurrentRollCall(programId);
    if (current && opMatchesNotification(current.openedAt, n)) {
      await clearRollCall(programId, current.id);
      return "roll-call";
    }
    return null;
  }
  if (n.type === "choice") {
    const current = await getCurrentCompanyChoice(programId);
    if (current && opMatchesNotification(current.postedAt, n)) {
      await clearCompanyChoice(programId, current.id);
      return "choice";
    }
    return null;
  }
  return null; // "update" — push-only, nothing on Today to clear
}

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

    // Cascade to the Today-page surface (rally banner / roll-call card /
    // choice card), then cache-bust so artists' next poll picks it up. A
    // cascade failure doesn't undo the cancel — report it so staff can fall
    // back to the section's own Clear/Close control.
    let cleared: string | null = null;
    let cascadeError: string | undefined;
    try {
      cleared = await cascadeClear(access.programId, cancelled);
      if (cleared) await bumpLiveVersion(access.programId);
    } catch (e) {
      cascadeError = e instanceof Error ? e.message : String(e);
      console.error("FIELD-KIT ADMIN HISTORY CASCADE ERROR:", cascadeError);
    }

    return NextResponse.json({
      ok: true,
      ...(cleared ? { cleared } : {}),
      ...(cascadeError ? { cascadeError } : {}),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("FIELD-KIT ADMIN HISTORY CLEAR ERROR:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
