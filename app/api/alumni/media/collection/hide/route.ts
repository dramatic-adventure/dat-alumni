// POST /api/alumni/media/collection/hide
//
// Soft-deletes an entire collection from a profile by prefixing every row's
// collectionId with "__hidden__:".  The actual Drive files are never touched —
// rows remain in Profile-Media, they just stop appearing in the media lists.
//
// Body: { alumniId: string, colKey: string }
//   colKey is Collection.id from the UI: collectionId || collectionTitle || "__ungrouped__"
//
import { NextResponse } from "next/server";
import { sheetsClient } from "@/lib/googleClients";
import { assertCanEditProfile, withRetry } from "@/lib/ownership";

export const runtime = "nodejs";

export const HIDDEN_PREFIX = "__hidden__:";

export async function POST(req: Request) {
  const spreadsheetId = process.env.ALUMNI_SHEET_ID;
  if (!spreadsheetId) {
    return NextResponse.json({ error: "Server misconfigured: ALUMNI_SHEET_ID missing" }, { status: 500 });
  }

  let body: any;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const alumniId = String(body.alumniId || "").trim().toLowerCase();
  const colKey   = String(body.colKey   || "").trim();

  if (!alumniId) return NextResponse.json({ error: "alumniId required" }, { status: 400 });
  if (!colKey)   return NextResponse.json({ error: "colKey required" },   { status: 400 });
  if (colKey.startsWith(HIDDEN_PREFIX)) {
    return NextResponse.json({ error: "Collection is already hidden" }, { status: 400 });
  }

  // Auth + ownership
  const auth = await assertCanEditProfile(req, alumniId);
  if (!auth.ok) return auth.response;

  const sheets = sheetsClient();

  const resp = await withRetry(
    () => sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Profile-Media!A:L",
      valueRenderOption: "UNFORMATTED_VALUE",
    }),
    "Sheets get Profile-Media (hide-collection)"
  );

  const rows = (resp.data.values ?? []) as string[][];
  const [header, ...dataRows] = rows;
  if (!header) return NextResponse.json({ error: "Sheet has no header row" }, { status: 500 });

  const mhLower = header.map((h) => String(h || "").trim().toLowerCase());
  const idxAid      = mhLower.indexOf("alumniid");
  const idxColId    = mhLower.indexOf("collectionid");
  const idxColTitle = mhLower.indexOf("collectiontitle");

  if (idxAid === -1) {
    return NextResponse.json({ error: "Profile-Media missing alumniId column" }, { status: 500 });
  }

  const hiddenKey = `${HIDDEN_PREFIX}${colKey}`;
  const updates: { range: string; values: string[][] }[] = [];

  dataRows.forEach((row, i) => {
    const aid = String(row[idxAid] ?? "").trim().toLowerCase();
    if (aid !== alumniId) return;

    const rowColId    = idxColId    !== -1 ? String(row[idxColId]    ?? "").trim() : "";
    const rowColTitle = idxColTitle !== -1 ? String(row[idxColTitle] ?? "").trim() : "";
    const rowKey      = rowColId || rowColTitle || "__ungrouped__";

    if (rowKey !== colKey) return;

    // Pad the row to header length and update collectionId
    const updated = [...row];
    while (updated.length < header.length) updated.push("");
    if (idxColId !== -1) {
      updated[idxColId] = hiddenKey;
    } else {
      // No collectionId column — nothing safe to write; skip
      return;
    }

    // Rows in the sheet are 1-indexed, header is row 1, data starts at row 2
    updates.push({
      range: `Profile-Media!A${i + 2}:L${i + 2}`,
      values: [updated],
    });
  });

  if (!updates.length) {
    return NextResponse.json({ ok: true, hidden: 0, note: "No matching rows found" });
  }

  await withRetry(
    () => sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: { valueInputOption: "RAW", data: updates },
    }),
    "Sheets batchUpdate Profile-Media (hide-collection)"
  );

  return NextResponse.json({ ok: true, hidden: updates.length });
}
