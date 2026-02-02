// lib/sheets/index.ts
import { sheetsClient } from "@/lib/googleClients";
import {
  getSheetValues,
  loadSheet,
  appendRowAlignedToHeaders,
  updateRowAlignedToHeaders,
  findRowNumberByHeaderValue,
  rowToObject,
  headerIndexMap,
} from "@/lib/sheets/sheetUtils";

function spreadsheetIdOrThrow() {
  const id = process.env.ALUMNI_SHEET_ID;
  if (!id) throw new Error("Missing ALUMNI_SHEET_ID");
  return id;
}

const SHEET_PROFILE_LIVE = "Profile-Live";
const SHEET_MAP_DATA = "Map Data";
const SHEET_STORY_EDITS = "Story-Edits";

export async function getProfileLiveRowByAlumniId(alumniId: string): Promise<Record<string, any> | null> {
  const sheets = sheetsClient();
  const spreadsheetId = spreadsheetIdOrThrow();

  // ✅ Map Data headers live on row 2 (row 1 is a note row)
  const all = await getSheetValues({
    sheets,
    spreadsheetId,
    range: `${SHEET_MAP_DATA}!A2:ZZ`,
  });

  if (all.length < 1) return null;

  const header = all[0] ?? [];
  const rows = all.slice(1);

  const hmap = headerIndexMap(header);

  const idIdx = hmap["alumniId"] ?? hmap["alumniid"];
  if (typeof idIdx !== "number") {
    throw new Error(`Sheet "${SHEET_PROFILE_LIVE}" missing "alumniId" header`);
  }

  const hit = rows.find((r: any[]) => String(r?.[idIdx] ?? "").trim() === alumniId);
  if (!hit) return null;

  return rowToObject(header, hit);
}

export async function getMapDataRowByStoryKey(storyKey: string): Promise<Record<string, any> | null> {
  const sheets = sheetsClient();
  const spreadsheetId = spreadsheetIdOrThrow();

  // ✅ Map Data headers live on row 2 (row 1 is a note row)
  const all = await getSheetValues({
    sheets,
    spreadsheetId,
    range: `${SHEET_MAP_DATA}!A2:ZZ`,
  });

  if (all.length < 1) return null;

  const header = all[0] ?? [];
  const rows = all.slice(1);

  const hmap = headerIndexMap(header);

  const kIdx = hmap["storyKey"];
  if (typeof kIdx !== "number") {
    throw new Error(`Sheet "${SHEET_MAP_DATA}" missing "storyKey" header`);
  }

  const hit = rows.find((r: any[]) => String(r?.[kIdx] ?? "").trim() === storyKey);
  if (!hit) return null;

  return rowToObject(header, hit);
}

export async function insertMapDataRow(rowByHeader: Record<string, any>) {
  const sheets = sheetsClient();
  const spreadsheetId = spreadsheetIdOrThrow();

  await appendRowAlignedToHeaders({
    sheets,
    spreadsheetId,
    sheetName: SHEET_MAP_DATA,
    rowByHeader,
  });
}

export async function updateMapDataRowByStoryKey(storyKey: string, rowByHeader: Record<string, any>) {
  const sheets = sheetsClient();
  const spreadsheetId = spreadsheetIdOrThrow();

  const rowNumber = await findRowNumberByHeaderValue({
    sheets,
    spreadsheetId,
    sheetName: SHEET_MAP_DATA,
    headerName: "storyKey",
    value: storyKey,
  });

  if (!rowNumber) {
    throw new Error(`storyKey not found in "${SHEET_MAP_DATA}": ${storyKey}`);
  }

  await updateRowAlignedToHeaders({
    sheets,
    spreadsheetId,
    sheetName: SHEET_MAP_DATA,
    rowNumber,
    rowByHeader,
  });
}

export async function appendStoryEditsRow(rowByHeader: Record<string, any>) {
  const sheets = sheetsClient();
  const spreadsheetId = spreadsheetIdOrThrow();

  await appendRowAlignedToHeaders({
    sheets,
    spreadsheetId,
    sheetName: SHEET_STORY_EDITS,
    rowByHeader,
  });
}

/**
 * Utility: load Map Data sheet header+rows (used by story editor logic to preserve created ts, etc.)
 */
export async function loadMapDataSheet() {
  const sheets = sheetsClient();
  const spreadsheetId = spreadsheetIdOrThrow();

  // ✅ Map Data headers live on row 2 (row 1 is a note row)
  const all = await getSheetValues({
    sheets,
    spreadsheetId,
    range: `${SHEET_MAP_DATA}!A2:ZZ`,
  });

  if (!all || all.length < 1) return { header: [], rows: [] };

  const header = all[0] ?? [];
  const rows = all.slice(1);

  return { header, rows };
}

