// /app/api/media/feature/route.ts
import { NextResponse } from "next/server";
import { sheetsClient } from "@/lib/googleClients";
import { requireAuth } from "@/lib/requireAuth";
import { rateLimit } from "@/lib/rateLimit";
import {
  isAdmin,
  resolveOwnerAlumniId,
  withRetry,
  featureExistingInMedia,
  setLivePointer,
  type MediaKind,
} from "@/lib/ownership";

export const runtime = "nodejs";

export async function POST(req: Request) {
  // Auth (supports admin key / DEV_BYPASS_AUTH via requireAuth)
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  // Per-IP rate limit (60/min)
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // Parse body safely
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    // Normalize inputs
    const alumniId = String(body.alumniId || "").trim().toLowerCase();
    const kind = String(body.kind || "").trim().toLowerCase() as MediaKind;
    const fileId = String(body.fileId || "").trim();

    if (!alumniId) return NextResponse.json({ error: "alumniId required" }, { status: 400 });
    if (!["headshot", "album", "reel", "event"].includes(kind)) {
      return NextResponse.json({ error: "kind invalid" }, { status: 400 });
    }
    if (!fileId) return NextResponse.json({ error: "fileId required" }, { status: 400 });

    const spreadsheetId = process.env.ALUMNI_SHEET_ID;
    if (!spreadsheetId) {
      return NextResponse.json({ error: "Missing ALUMNI_SHEET_ID" }, { status: 500 });
    }

    // Owner/Admin guard: non-admins can only edit their own alumniId
    if (auth.email && !isAdmin(auth.email)) {
      const ownerId = await resolveOwnerAlumniId(spreadsheetId, auth.email);
      if (!ownerId || ownerId !== alumniId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const sheets = sheetsClient();
    const nowIso = new Date().toISOString();

    // 1) Flip featured/current flags in Profile-Media
    try {
      await featureExistingInMedia(spreadsheetId, alumniId, kind, fileId);
    } catch (e: any) {
      const msg = String(e?.message || e);
      // If the fileId isn't present yet, create a minimal row and retry
      if (/fileid not found for this alumni\/kind/i.test(msg)) {
        await withRetry(
          () =>
            sheets.spreadsheets.values.append({
              spreadsheetId,
              range: "Profile-Media!A:L",
              valueInputOption: "RAW",
              requestBody: {
                values: [
                  [
                    alumniId, // A: alumniId
                    kind, // B: kind
                    "", // C: collectionId
                    "", // D: collectionTitle
                    fileId, // E: fileId
                    "", // F: externalUrl
                    auth.email || "", // G: uploadedByEmail (best guess)
                    nowIso, // H: uploadedAt
                    "", // I: isCurrent (set by flip)
                    "", // J: isFeatured (set by flip)
                    "", // K: sortIndex
                    "stub from /api/media/feature", // L: note
                  ],
                ],
              },
            }),
          "Sheets append Profile-Media (stub for missing fileId)"
        );
        // Retry the flip now that the row exists
        await featureExistingInMedia(spreadsheetId, alumniId, kind, fileId);
      } else {
        throw e; // bubble up other errors
      }
    }

    // 2) Update Live pointer + needs_review + lastChangeType="media"
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
