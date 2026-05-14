// app/api/admin/migrate-isoriginal/route.ts
//
// One-time migration: adds the `isOriginal` column (M) to Profile-Media.
// Sets TRUE for rows where note = "legacy currentHeadshotUrl import",
// FALSE for all other rows.
//
// POST /api/admin/migrate-isoriginal
// Requires admin auth. Idempotent — safe to run more than once.

import { NextResponse } from "next/server";
import { sheetsClient } from "@/lib/googleClients";
import { requireAdmin } from "@/lib/requireAuth";
import { idxOf } from "@/lib/ownership";

export const runtime = "nodejs";

const LEGACY_NOTE = "legacy currentHeadshotUrl import";

export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const spreadsheetId = process.env.ALUMNI_SHEET_ID;
  if (!spreadsheetId) {
    return NextResponse.json({ error: "Missing ALUMNI_SHEET_ID" }, { status: 500 });
  }

  const sheets = sheetsClient();

  // Read current state — include M in case column already exists
  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Profile-Media!A:M",
    valueRenderOption: "UNFORMATTED_VALUE",
  });

  const rows = (resp.data.values ?? []) as any[][];
  if (rows.length === 0) {
    return NextResponse.json({ ok: true, message: "Empty sheet, nothing to migrate" });
  }

  const header = rows[0] as string[];
  const dataRows = rows.slice(1);

  const headerLower = header.map((h) => String(h || "").trim().toLowerCase());
  const existingIsOriginalIdx = idxOf(header, ["isoriginal", "is original"]);

  if (existingIsOriginalIdx !== -1) {
    return NextResponse.json({
      ok: true,
      message: `isOriginal column already exists at column index ${existingIsOriginalIdx} (already migrated)`,
    });
  }

  const idxNote = idxOf(header, ["note", "notes"]);

  // Build batch: header cell + one cell per data row
  const batchData: { range: string; values: string[][] }[] = [
    { range: "Profile-Media!M1", values: [["isOriginal"]] },
  ];

  let trueCount = 0;
  let falseCount = 0;

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i] as string[];
    const note = idxNote !== -1 ? String(row[idxNote] || "").trim() : "";
    const isOriginal = note === LEGACY_NOTE ? "TRUE" : "FALSE";
    if (isOriginal === "TRUE") trueCount++;
    else falseCount++;
    batchData.push({ range: `Profile-Media!M${i + 2}`, values: [[isOriginal]] });
  }

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: { data: batchData, valueInputOption: "RAW" },
  });

  return NextResponse.json({
    ok: true,
    migrated: dataRows.length,
    isOriginalTrue: trueCount,
    isOriginalFalse: falseCount,
    message: `Migration complete. ${dataRows.length} rows updated (${trueCount} original, ${falseCount} non-original).`,
  });
}
