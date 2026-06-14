// app/api/alumni/events/route.ts
import "server-only";
import { NextResponse } from "next/server";
import { assertCanEditProfile } from "@/lib/ownership";
import {
  loadEventsForAlumniId,
  appendEventRow,
  updateEventRow,
  setEventHidden,
  type EventRow,
} from "@/lib/loadEventsFromSheet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function noStore(payload: unknown, init?: ResponseInit) {
  return NextResponse.json(payload, {
    ...(init ?? {}),
    headers: {
      "Cache-Control": "no-store, max-age=0",
      ...((init as any)?.headers ?? {}),
    },
  });
}

// Pull only the alumni-editable event fields out of an arbitrary body.
function pickEventFields(e: any): Omit<EventRow, "eventId" | "alumniId" | "createdTs" | "updatedTs" | "hidden"> {
  return {
    title: String(e?.title ?? "").trim(),
    link: String(e?.link ?? "").trim(),
    date: String(e?.date ?? "").trim(),
    expiresAt: String(e?.expiresAt ?? "").trim(),
    description: String(e?.description ?? "").trim(),
    city: String(e?.city ?? "").trim(),
    stateCountry: String(e?.stateCountry ?? "").trim(),
    mediaType: String(e?.mediaType ?? "").trim(),
    mediaUrl: String(e?.mediaUrl ?? "").trim(),
    mediaFileId: String(e?.mediaFileId ?? "").trim(),
    mediaAlt: String(e?.mediaAlt ?? "").trim(),
    videoAutoplay: String(e?.videoAutoplay ?? "").trim(),
    sortDate: String(e?.sortDate ?? "").trim(),
  };
}

// ── GET /api/alumni/events?alumniId=<id> ──────────────────────────────────────
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const alumniId = (url.searchParams.get("alumniId") ?? "").trim();
    if (!alumniId) return noStore({ error: "Missing alumniId" }, { status: 400 });
    const data = await loadEventsForAlumniId(alumniId);
    return noStore(data);
  } catch (err: any) {
    console.error("[events GET]", err);
    return noStore({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}

// ── POST /api/alumni/events — create / edit / delete / restore ────────────────
export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return noStore({ error: "Invalid JSON" }, { status: 400 });
  }

  const alumniId = String(body?.alumniId ?? "").trim();
  const mode = String(body?.mode ?? "create").trim();
  if (!alumniId) return noStore({ error: "alumniId is required" }, { status: 400 });
  if (!["create", "edit", "delete", "restore"].includes(mode)) {
    return noStore({ error: "Invalid mode" }, { status: 400 });
  }

  // Auth: must be admin or the profile owner.
  const auth = await assertCanEditProfile(req, alumniId);
  if (!auth.ok) return auth.response;

  try {
    if (mode === "create") {
      const fields = pickEventFields(body?.event);
      if (!fields.title) return noStore({ error: "title is required" }, { status: 400 });
      const eventId = await appendEventRow({ ...fields, alumniId });
      return noStore({ ok: true, eventId });
    }

    if (mode === "edit") {
      const eventId = String(body?.event?.eventId ?? body?.eventId ?? "").trim();
      if (!eventId) return noStore({ error: "eventId is required" }, { status: 400 });
      const fields = pickEventFields(body?.event);
      if (!fields.title) return noStore({ error: "title is required" }, { status: 400 });
      const ok = await updateEventRow(eventId, fields);
      if (!ok) return noStore({ error: "Event not found", eventId }, { status: 404 });
      return noStore({ ok: true, eventId });
    }

    // delete / restore
    const eventId = String(body?.eventId ?? body?.event?.eventId ?? "").trim();
    if (!eventId) return noStore({ error: "eventId is required" }, { status: 400 });
    const ok = await setEventHidden(eventId, mode === "delete");
    if (!ok) return noStore({ error: "Event not found", eventId }, { status: 404 });
    return noStore({ ok: true, eventId, mode });
  } catch (err: any) {
    console.error("[events POST]", err);
    return noStore({ error: err?.message ?? "Failed to save" }, { status: 500 });
  }
}
