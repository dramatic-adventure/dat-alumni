// app/api/alumni/owner/route.ts
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/requireAuth";
import {
  getAlumniIdForOwnerEmail,
  normalizeGmail,
} from "@/lib/ownership";

export const runtime = "nodejs";

function isDevBypassAllowed() {
  return process.env.NODE_ENV !== "production";
}

function hasValidAdminHeader(req: Request) {
  const key = String(req.headers.get("x-admin-key") || "").trim();
  const token = String(req.headers.get("x-admin-token") || "").trim();

  const envKey = String(process.env.ADMIN_API_KEY || "").trim();
  const envToken = String(process.env.ADMIN_TOKEN || "").trim();

  return (!!envKey && key === envKey) || (!!envToken && token === envToken);
}

function normId(x: unknown) {
  return String(x ?? "").trim().toLowerCase();
}

export async function GET(req: Request) {
  // always discourage caching (this endpoint is identity-sensitive)
  const noStoreHeaders = {
    "Cache-Control": "no-store, max-age=0",
    Pragma: "no-cache",
  };

  const spreadsheetId = process.env.ALUMNI_SHEET_ID;
  if (!spreadsheetId) {
    return NextResponse.json(
      { ok: false, error: "Missing ALUMNI_SHEET_ID" },
      { status: 500, headers: noStoreHeaders }
    );
  }

  // ✅ DEV-ONLY admin header bypass for local curl/debug:
  // Accept ?email=... OR ?alumniId=...
  // If neither is provided, fall back to ADMIN_ALUMNI_ID (DEV only).
  if (isDevBypassAllowed() && hasValidAdminHeader(req)) {
    const url = new URL(req.url);

    const directId = normId(url.searchParams.get("alumniId") || "");
    if (directId) {
      return NextResponse.json(
        { ok: true, alumniId: directId, devBypass: true },
        { status: 200, headers: noStoreHeaders }
      );
    }

    const email = normalizeGmail(url.searchParams.get("email") || "");
    if (email) {
      const ownerId = await getAlumniIdForOwnerEmail(spreadsheetId, email);
      if (!ownerId) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "No alumniId found for that email (Profile-Owners/Profile-Aliases).",
          },
          { status: 404, headers: noStoreHeaders }
        );
      }
      return NextResponse.json(
        { ok: true, alumniId: ownerId, devBypass: true },
        { headers: noStoreHeaders }
      );
    }

    const fallback = normId(process.env.ADMIN_ALUMNI_ID || "");
    if (!fallback) {
      return NextResponse.json(
        {
          ok: false,
          error: "Admin bypass requires ?email=... or ?alumniId=... (DEV only).",
        },
        { status: 400, headers: noStoreHeaders }
      );
    }

    return NextResponse.json(
      { ok: true, alumniId: fallback, devBypass: true },
      { headers: noStoreHeaders }
    );
  }

  // ✅ Normal path: requires real session auth
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const email = normalizeGmail(auth.email || "");
  if (!email) {
    return NextResponse.json(
      { ok: false, error: "Missing session email" },
      { status: 400, headers: noStoreHeaders }
    );
  }

  const ownerId = await getAlumniIdForOwnerEmail(spreadsheetId, email);
  if (!ownerId) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "No alumniId found for session email (Profile-Owners/Profile-Aliases).",
      },
      { status: 404, headers: noStoreHeaders }
    );
  }

  return NextResponse.json(
    { ok: true, alumniId: ownerId },
    { headers: noStoreHeaders }
  );
}
