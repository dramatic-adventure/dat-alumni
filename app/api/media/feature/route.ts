// /app/api/media/feature/route.ts
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/requireAuth";
import { rateLimit } from "@/lib/rateLimit";
import {
  isAdmin,
  resolveOwnerAlumniId,
  featureExistingInMedia,
  setLivePointer,
  setCurrentHeadshot,
  type MediaKind,
} from "@/lib/ownership";

export const runtime = "nodejs";

function isPlausibleDriveFileId(id: string) {
  const s = (id || "").trim();
  if (s.length < 10 || s.length > 200) return false;
  if (s.includes("...")) return false; // ✅ never allow stubs
  return /^[a-zA-Z0-9_-]+$/.test(s);
}

export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const alumniId = String(body.alumniId || "").trim().toLowerCase();
    const kind = String(body.kind || "").trim().toLowerCase() as MediaKind;
    const fileId = String(body.fileId || "").trim();

    if (!alumniId) return NextResponse.json({ error: "alumniId required" }, { status: 400 });
    if (!["headshot", "album", "reel", "event"].includes(kind)) {
      return NextResponse.json({ error: "kind invalid" }, { status: 400 });
    }
    if (!fileId) return NextResponse.json({ error: "fileId required" }, { status: 400 });

    // ✅ hard validation: no stubs, no junk
    if (!isPlausibleDriveFileId(fileId)) {
      return NextResponse.json(
        {
          error: "Invalid fileId",
          detail:
            "fileId must be a real Drive file id (letters/numbers/_/-), 10–200 chars, and must not contain '...'.",
        },
        { status: 400 }
      );
    }

    const spreadsheetId = process.env.ALUMNI_SHEET_ID;
    if (!spreadsheetId) {
      return NextResponse.json({ error: "Missing ALUMNI_SHEET_ID" }, { status: 500 });
    }

    // Owner/Admin guard
    if (auth.email && !isAdmin(auth.email)) {
      const ownerId = await resolveOwnerAlumniId(spreadsheetId, auth.email);
      if (!ownerId || ownerId !== alumniId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const nowIso = new Date().toISOString();

    // ✅ Headshots are special: setCurrentHeadshot flips isCurrent AND writes Live id+url.
    // We still need to ensure the row exists (no stubs), so we surface the same 404.
    if (kind === "headshot") {
      try {
        const result = await setCurrentHeadshot(spreadsheetId, alumniId, fileId, nowIso);

        return NextResponse.json({
          ok: true,
          updated: {
            currentHeadshotId: result.currentHeadshotId,
            currentHeadshotUrl: result.currentHeadshotUrl,
          },
          status: "needs_review",
          at: nowIso,
        });
      } catch (e: any) {
        const msg = String(e?.message || e);
        if (/fileid not found for this alumni\/kind/i.test(msg)) {
          return NextResponse.json(
            {
              error: "Media row not found",
              detail:
                "That fileId does not exist in Profile-Media for this alumniId/kind. Add the row first (via upload/insert), then feature it.",
              alumniId,
              kind,
              fileId,
            },
            { status: 404 }
          );
        }
        throw e;
      }
    }

    // ✅ IMPORTANT: do NOT create stub rows.
    // If the row doesn't exist yet, featureExistingInMedia should throw and we surface it.
    try {
      await featureExistingInMedia(spreadsheetId, alumniId, kind, fileId);
    } catch (e: any) {
      const msg = String(e?.message || e);
      if (/fileid not found for this alumni\/kind/i.test(msg)) {
        return NextResponse.json(
          {
            error: "Media row not found",
            detail:
              "That fileId does not exist in Profile-Media for this alumniId/kind. Add the row first (via upload/insert), then feature it.",
            alumniId,
            kind,
            fileId,
          },
          { status: 404 }
        );
      }
      throw e;
    }

    // Other kinds keep existing pointer behavior
    const updatedCol = await setLivePointer(spreadsheetId, alumniId, kind, fileId, nowIso);

    return NextResponse.json({
      ok: true,
      updated: { [updatedCol]: fileId },
      status: "needs_review",
      at: nowIso,
    });
  } catch (e: any) {
    const msg = e?.message || "server error";
    console.error("FEATURE ERROR:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
