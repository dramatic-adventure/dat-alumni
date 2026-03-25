// /app/api/admin/forward-slug/route.ts
import { NextResponse } from "next/server";
import { sheetsClient } from "@/lib/googleClients";
import { requireAuth } from "@/lib/requireAuth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth.ok) return auth.response;

    const body = await req.json().catch(() => ({}));
    const fromSlug = String(body?.fromSlug || "").trim().toLowerCase();
    const toSlug   = String(body?.toSlug   || "").trim().toLowerCase();
    if (!fromSlug || !toSlug) {
      return NextResponse.json({ error: "fromSlug and toSlug are required" }, { status: 400 });
    }

    const spreadsheetId = process.env.ALUMNI_SHEET_ID!;
    if (!spreadsheetId) {
      return NextResponse.json({ error: "Missing ALUMNI_SHEET_ID" }, { status: 500 });
    }

    const sheets = sheetsClient();
    const nowIso = new Date().toISOString();

    // Ensure header exists
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "Profile-Slugs!A1:C1",
      valueInputOption: "RAW",
      requestBody: { values: [["fromSlug", "toSlug", "createdAt"]] },
    });

    // Append mapping
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Profile-Slugs!A:C",
      valueInputOption: "RAW",
      requestBody: { values: [[fromSlug, toSlug, nowIso]] },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}
