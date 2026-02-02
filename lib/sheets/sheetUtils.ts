// lib/sheets/sheetUtils.ts
import type { sheets_v4 } from "googleapis";

/**
 * Keep these helpers dumb + reusable.
 * No sheet-name knowledge. No business logic.
 */

export function headerIndexMap(headerRow: any[]) {
  const map: Record<string, number> = {};
  for (let i = 0; i < headerRow.length; i++) {
    const h = String(headerRow[i] ?? "").trim();
    if (!h) continue;
    map[h] = i;
  }
  return map;
}

export function buildAlignedRow(headers: any[], rowByHeader: Record<string, any>) {
  return headers.map((h: any) => {
    const key = String(h ?? "").trim();
    if (!key) return "";
    const v = rowByHeader[key];
    return v == null ? "" : String(v);
  });
}

export async function getSheetValues(opts: {
  sheets: sheets_v4.Sheets;
  spreadsheetId: string;
  range: string;
}) {
  const { sheets, spreadsheetId, range } = opts;
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
    valueRenderOption: "UNFORMATTED_VALUE",
  });
  return (res.data.values ?? []) as any[][];
}

export async function loadSheet(opts: {
  sheets: sheets_v4.Sheets;
  spreadsheetId: string;
  sheetName: string;
  /**
   * 1-based header row number. Defaults to 1.
   * Example: Map Data uses 2 when row 1 is a note row.
   */
  headerRowNumber?: number;
}) {
  const { sheets, spreadsheetId, sheetName, headerRowNumber = 1 } = opts;

  const startA1 = `A${headerRowNumber}`;
  const all = await getSheetValues({
    sheets,
    spreadsheetId,
    range: `${sheetName}!${startA1}:ZZ`,
  });

  const header = all[0] ?? [];
  const rows = all.slice(1);
  const hmap = headerIndexMap(header);

  return { header, rows, hmap };
}

export async function appendRowAlignedToHeaders(opts: {
  sheets: sheets_v4.Sheets;
  spreadsheetId: string;
  sheetName: string;
  rowByHeader: Record<string, any>;
  /**
   * 1-based header row number. Defaults to 1.
   * If headers live on row 2, pass 2.
   */
  headerRowNumber?: number;
}) {
  const { sheets, spreadsheetId, sheetName, rowByHeader, headerRowNumber = 1 } = opts;

  const headerRows = await getSheetValues({
    sheets,
    spreadsheetId,
    range: `${sheetName}!A${headerRowNumber}:ZZ${headerRowNumber}`,
  });

  const header = headerRows[0] ?? [];
  if (!header.length) throw new Error(`Sheet "${sheetName}" has no header row`);

  const aligned = buildAlignedRow(header, rowByHeader);

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A:ZZ`,
    valueInputOption: "RAW",
    requestBody: { values: [aligned] },
  });
}

export async function updateRowAlignedToHeaders(opts: {
  sheets: sheets_v4.Sheets;
  spreadsheetId: string;
  sheetName: string;
  rowNumber: number; // 1-based
  rowByHeader: Record<string, any>;
  /**
   * 1-based header row number. Defaults to 1.
   * If headers live on row 2, pass 2.
   */
  headerRowNumber?: number;
}) {
  const { sheets, spreadsheetId, sheetName, rowNumber, rowByHeader, headerRowNumber = 1 } = opts;

  const headerRows = await getSheetValues({
    sheets,
    spreadsheetId,
    range: `${sheetName}!A${headerRowNumber}:ZZ${headerRowNumber}`,
  });

  const header = headerRows[0] ?? [];
  if (!header.length) throw new Error(`Sheet "${sheetName}" has no header row`);

  const aligned = buildAlignedRow(header, rowByHeader);

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!A${rowNumber}:ZZ${rowNumber}`,
    valueInputOption: "RAW",
    requestBody: { values: [aligned] },
  });
}

export async function findRowNumberByHeaderValue(opts: {
  sheets: sheets_v4.Sheets;
  spreadsheetId: string;
  sheetName: string;
  headerName: string;
  value: string;
  /**
   * 1-based header row number. Defaults to 1.
   * If headers live on row 2, pass 2.
   */
  headerRowNumber?: number;
}) {
  const {
    sheets,
    spreadsheetId,
    sheetName,
    headerName,
    value,
    headerRowNumber = 1,
  } = opts;

  const { header, rows, hmap } = await loadSheet({
    sheets,
    spreadsheetId,
    sheetName,
    headerRowNumber,
  });

  if (!header.length) throw new Error(`Sheet "${sheetName}" has no header row`);

  const colIdx = hmap[headerName];
  if (typeof colIdx !== "number") {
    throw new Error(`Sheet "${sheetName}" missing header "${headerName}"`);
  }

  const want = String(value ?? "");
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (String(r?.[colIdx] ?? "") === want) {
      // header is at headerRowNumber; first data row is headerRowNumber + 1
      return i + (headerRowNumber + 1);
    }
  }
  return null;
}

export function rowToObject(header: any[], row: any[]) {
  const obj: Record<string, any> = {};
  for (let i = 0; i < header.length; i++) {
    const key = String(header[i] ?? "").trim();
    if (!key) continue;
    obj[key] = row?.[i] ?? "";
  }
  return obj;
}
