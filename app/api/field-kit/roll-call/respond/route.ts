// app/api/field-kit/roll-call/respond/route.ts
//
// POST — an artist's Roll Call check-in ("here" / "needs-help"). The write side
// of the offline ops queue (lib/opsQueue → lib/opsSync), mirroring the capture
// route's trust model: re-runs the SAME access gate the pages use, derives BOTH
// programId and the responding slug server-side, and ignores any identity sent
// in the body. Upserts by (rollCallId, alumniSlug), so the queue's
// at-least-once retries are naturally idempotent.
//
// A transition INTO "needs-help" fires an immediate push to the LEADER tier
// (staff + road managers/directors — Jesse, 2026-07-02), never to the whole
// company. Late check-ins for an already-closed roll call are still recorded
// (a queued response that missed the window is data, not an error).

import { NextResponse } from "next/server";
import { rateLimit, rateKey } from "@/lib/rateLimit";
import { getFieldKitAccess, FIELD_KIT_PROGRAM_ID } from "@/lib/fieldKitAccess";
import { getRollCallById, upsertRollCallResponse } from "@/lib/rollCall";
import { getFieldKitLeaderSlugs } from "@/lib/fieldKitLeaders";
import { sendToSlugs } from "@/lib/webPush";
import { loadAlumniBySlug } from "@/lib/loadAlumni";
import { normId } from "@/lib/sheetsResilience";
import type { RollCallStatus } from "@/lib/programItinerary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function coerceStatus(v: unknown): RollCallStatus | null {
  const s = normId(v);
  if (s === "here") return "here";
  if (s === "needs-help" || s === "needs help" || s === "needs_help") return "needs-help";
  return null;
}

// Needs-help alert damper: at most one leader push per (rollCall, slug) per
// window, per warm instance — so here/needs-help toggling can't turn one
// artist into a push cannon aimed at the whole leader tier. In-memory is fine:
// a cold start forgetting the damper only risks one extra (legitimate) alert.
const ALERT_COOLDOWN_MS = 5 * 60_000;
const _lastAlert = new Map<string, number>();

function recentlyAlerted(rollCallId: string, slug: string): boolean {
  const at = _lastAlert.get(`${normId(rollCallId)}::${slug}`);
  return !!at && Date.now() - at < ALERT_COOLDOWN_MS;
}

function markAlerted(rollCallId: string, slug: string): void {
  _lastAlert.set(`${normId(rollCallId)}::${slug}`, Date.now());
}

function humanizeSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w[0]!.toUpperCase() + w.slice(1))
    .join(" ");
}

export async function POST(req: Request) {
  try {
    if (!rateLimit(rateKey(req), 60, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    const asId = typeof body.asId === "string" && body.asId.trim() ? body.asId.trim() : undefined;

    const access = await getFieldKitAccess(FIELD_KIT_PROGRAM_ID, asId);
    if (!access.allowed) {
      const status = access.reason === "signed-out" ? 401 : 403;
      return NextResponse.json({ error: "Forbidden" }, { status });
    }
    const slug = normId(access.slug);
    if (!slug) {
      return NextResponse.json({ error: "No profile linked to this account" }, { status: 403 });
    }

    const rollCallId = String(body.rollCallId ?? "").trim();
    const status = coerceStatus(body.status);
    const respondedAt = String(body.respondedAt ?? "").trim();
    if (!rollCallId) return NextResponse.json({ error: "rollCallId is required" }, { status: 400 });
    if (!status) {
      return NextResponse.json({ error: "status must be here or needs-help" }, { status: 400 });
    }

    const rollCall = await getRollCallById(access.programId, rollCallId);
    if (!rollCall) {
      return NextResponse.json({ error: "Unknown roll call" }, { status: 400 });
    }

    const { previousStatus, applied } = await upsertRollCallResponse({
      rollCallId,
      alumniSlug: slug,
      status,
      respondedAt: respondedAt || undefined,
    });

    // Immediate leader alert on a real, APPLIED transition into needs-help (an
    // upsert replay of the same value, or a stale tap rejected by the
    // stale-write guard, must not alert), dampened per (rollCall, slug) so
    // toggling here/needs-help can't spam the leader tier.
    if (applied && status === "needs-help" && previousStatus !== "needs-help" && !recentlyAlerted(rollCallId, slug)) {
      try {
        const [leaders, alum] = await Promise.all([
          getFieldKitLeaderSlugs(access.programId),
          loadAlumniBySlug(slug),
        ]);
        const name = alum?.name?.trim() || humanizeSlug(slug);
        // Link to Today (the leader panel renders there) — /field-kit/admin
        // would 404 for road managers/directors who aren't admins.
        await sendToSlugs(access.programId, leaders, {
          title: `${name} needs help`,
          body: rollCall.label ? `Roll call: ${rollCall.label}` : "Open the roll call board.",
          link: "/field-kit",
        });
        markAlerted(rollCallId, slug);
      } catch (e) {
        // The check-in itself succeeded — never fail the write because a push
        // couldn't go out. Leaders still see the flag on their next load.
        console.warn("[roll-call respond] needs-help push failed:", e instanceof Error ? e.message : e);
      }
    }

    // Deliberately no push/leader metrics in the artist-facing response — even
    // a delivery count is a leadership-tier number ("no metrics" line).
    return NextResponse.json({ ok: true, rollCallId, status });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("FIELD-KIT ROLL CALL RESPOND ERROR:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
