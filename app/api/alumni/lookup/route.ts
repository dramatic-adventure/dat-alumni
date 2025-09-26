// app/api/alumni/lookup/route.ts
import { NextResponse } from "next/server";
import { google } from "googleapis";

export const runtime = "nodejs";

function parseSA(jsonStr: string) {
  try {
    return JSON.parse(jsonStr);
  } catch {
    return JSON.parse(jsonStr.replace(/\\n/g, "\n"));
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = (searchParams.get("email") || "").trim().toLowerCase();
    if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

    const sheetId = process.env.ALUMNI_SHEET_ID!;
    const sa = parseSA(process.env.GCP_SA_JSON!);

    const auth = new google.auth.JWT({
      email: sa.client_email,
      key: sa.private_key,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });
    const sheets = google.sheets({ version: "v4", auth });

    // Read the whole Profile-Live sheet (header + rows)
    // If your tab is named differently, change it here:
    const range = "Profile-Live!A:Z";
    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range,
      valueRenderOption: "UNFORMATTED_VALUE",
    });

    const values = (data.values || []) as any[][];
    if (values.length === 0) return NextResponse.json({ error: "no rows" }, { status: 404 });

    const [header, ...rows] = values;
    const toIndex = (names: string[]) =>
      header.findIndex((h) => names.includes(String(h || "").toLowerCase().trim()));

    const emailIdx = toIndex(["email"]);
    if (emailIdx === -1) return NextResponse.json({ error: "email column not found" }, { status: 500 });

    const slugIdx = toIndex(["slug", "alumniid", "alumni_id", "alumni id"]);
    if (slugIdx === -1) return NextResponse.json({ error: "slug/alumniId column not found" }, { status: 500 });

    const match = rows.find((r) => String(r[emailIdx] || "").toLowerCase().trim() === email);
    if (!match) return NextResponse.json({ error: "not found" }, { status: 404 });

    const alumniId = String(match[slugIdx] || "").trim().toLowerCase();
    if (!alumniId) return NextResponse.json({ error: "slug empty" }, { status: 404 });

    return NextResponse.json({ alumniId });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "server error" }, { status: 500 });
  }
}
