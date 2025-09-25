// app/api/alumni/save/route.ts
import { NextResponse } from "next/server";
import { sheetsClient } from "@/lib/googleClients";

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const {
      alumniId,
      changes,            // object of fields being edited (e.g., { bio: "...", website: "..." })
      submittedByEmail="",// optional: who submitted the change
      note="",            // optional: any reviewer note
    } = body || {};

    if (!alumniId || typeof changes !== "object")
      return NextResponse.json({ error: "alumniId and changes are required" }, { status: 400 });

    const sheets = sheetsClient();
    const spreadsheetId = process.env.ALUMNI_SHEET_ID!;
    const now = new Date().toISOString();

    // 1) Append an audit row to Profile-Changes
    // Expected headers we set earlier:
    // alumniId | field | newValue | oldValue | submittedAt | submittedByEmail | reviewed | reviewedBy | reviewedAt | note
    const rows: string[][] = [];
    Object.entries(changes as Record<string, unknown>).forEach(([field, newValue]) => {
      rows.push([
        String(alumniId),
        field,
        newValue == null ? "" : String(newValue),
        "",            // oldValue (optional; you can backfill later)
        now,
        submittedByEmail,
        "", "", "",    // reviewed, reviewedBy, reviewedAt
        note,
      ]);
    });
    if (rows.length) {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: "Profile-Changes!A:J",
        valueInputOption: "RAW",
        requestBody: { values: rows },
      });
    }

    // 2) Touch Profile-Live row: set status=pending + updatedAt
    const live = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Profile-Live!A:Z",
    });
    const lRows = live.data.values ?? [];
    const headers = lRows[0] ?? [];
    const idIdx = headers.indexOf("alumniId");
    const statusIdx = headers.indexOf("status");
    const updatedIdx = headers.indexOf("updatedAt");
    if (idIdx === -1) throw new Error('Profile-Live missing "alumniId" header');
    if (statusIdx === -1) throw new Error('Profile-Live missing "status" header');

    let rowIndex = lRows.findIndex((r, i) => i > 0 && r[idIdx] === alumniId);
    if (rowIndex === -1) {
      // create a new baseline row
      rowIndex = lRows.length;
      const newRow = new Array(headers.length).fill("");
      newRow[idIdx] = alumniId;
      newRow[statusIdx] = "pending";
      if (updatedIdx !== -1) newRow[updatedIdx] = now;
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Profile-Live!A${rowIndex + 1}:Z${rowIndex + 1}`,
        valueInputOption: "RAW",
        requestBody: { values: [newRow] },
      });
    } else {
      const row = lRows[rowIndex];
      row[statusIdx] = "pending";
      if (updatedIdx !== -1) row[updatedIdx] = now;
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Profile-Live!A${rowIndex + 1}:Z${rowIndex + 1}`,
        valueInputOption: "RAW",
        requestBody: { values: [row] },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("SAVE ERROR:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
