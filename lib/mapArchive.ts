// lib/mapArchive.ts
import { sheetsClient } from "@/lib/googleClients";

type Sheets = ReturnType<typeof sheetsClient>;

type LiveRow = {
  name?: string;
  alumniId?: string;
  slug?: string;

  storyTitle?: string;
  storyProgram?: string;
  storyLocationName?: string;
  storyYears?: string;
  storyPartners?: string;
  storyShortStory?: string;
  storyQuote?: string;
  storyQuoteAttribution?: string;
  storyMediaUrl?: string;
  storyMoreInfoUrl?: string;
  storyCountry?: string;
  storyShowOnMap?: any; // boolean-ish
  storyTimeStamp?: string; // ISO
};

function truthy(x: any) {
  if (x === true) return true;
  const s = String(x ?? "").trim().toLowerCase();
  return s === "true" || s === "1" || s === "yes" || s === "y";
}

async function getSheetValues(opts: {
  sheets: Sheets;
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

function headerIndexMap(headerRow: any[]) {
  const map: Record<string, number> = {};
  for (let i = 0; i < headerRow.length; i++) {
    const h = String(headerRow[i] ?? "").trim();
    if (!h) continue;
    map[h] = i;
  }
  return map;
}

function buildAlignedRow(opts: {
  headers: any[];
  rowByHeader: Record<string, any>;
}) {
  const { headers, rowByHeader } = opts;
  return headers.map((h: any) => {
    const key = String(h ?? "").trim();
    if (!key) return "";
    const v = rowByHeader[key];
    return v == null ? "" : String(v);
  });
}

async function findExactInColumn(opts: {
  sheets: Sheets;
  spreadsheetId: string;
  sheetName: string;
  headerName: string;
  value: string;
}) {
  const { sheets, spreadsheetId, sheetName, headerName, value } = opts;

  const all = await getSheetValues({
    sheets,
    spreadsheetId,
    range: `${sheetName}!A:ZZ`,
  });

  if (!all.length) return false;

  const header = all[0] ?? [];
  const rows = all.slice(1);

  const map = headerIndexMap(header);
  const colIdx = map[headerName];

  if (typeof colIdx !== "number") {
    throw new Error(`Sheet "${sheetName}" missing header "${headerName}"`);
  }

  const want = String(value ?? "");
  for (const r of rows) {
    if (String(r?.[colIdx] ?? "") === want) return true;
  }
  return false;
}

async function appendAligned(opts: {
  sheets: Sheets;
  spreadsheetId: string;
  sheetName: string;
  rowByHeader: Record<string, any>;
}) {
  const { sheets, spreadsheetId, sheetName, rowByHeader } = opts;

  const all = await getSheetValues({
    sheets,
    spreadsheetId,
    range: `${sheetName}!A1:ZZ1`,
  });

  const header = all[0] ?? [];
  if (!header.length) throw new Error(`Sheet "${sheetName}" has no header row`);

  const aligned = buildAlignedRow({ headers: header, rowByHeader });

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A:ZZ`,
    valueInputOption: "RAW",
    requestBody: { values: [aligned] },
  });
}

/**
 * Append-only archive:
 * - Dedupe checks Clean Map Data by storyKey
 * - Appends to Map Data + Clean Map Data
 */
export async function maybeArchiveStorySnapshotFromLiveRow(opts: {
  sheets: Sheets;
  spreadsheetId: string;
  live: LiveRow;
}) {
  const { sheets, spreadsheetId, live } = opts;

  const alumniId = String(live.alumniId ?? "").trim();
  const ts = String(live.storyTimeStamp ?? "").trim();

  if (!alumniId) return { ok: true, skipped: true, reason: "missing_alumniId" };
  if (!ts) return { ok: true, skipped: true, reason: "missing_ts" };
  if (!truthy(live.storyShowOnMap))
    return { ok: true, skipped: true, reason: "show_on_map_false" };

  const storyKey = `${alumniId}::${ts}`;

  const exists = await findExactInColumn({
    sheets,
    spreadsheetId,
    sheetName: "Clean Map Data",
    headerName: "storyKey",
    value: storyKey,
  });

  if (exists) return { ok: true, deduped: true, storyKey };

  const common = {
    "Title": live.storyTitle ?? "",
    "Program": live.storyProgram ?? "",
    "Location Name": live.storyLocationName ?? "",
    "Year(s)": live.storyYears ?? "",
    "Partners": live.storyPartners ?? "",
    "Short Story": live.storyShortStory ?? "",
    "Quote": live.storyQuote ?? "",
    "Quote Attribution": live.storyQuoteAttribution ?? "",
    "mediaUrl": live.storyMediaUrl ?? "",
    "Author": live.name ?? "",
    "authorSlug": live.slug ?? "",
    "More Info Link": live.storyMoreInfoUrl ?? "",
    "Country": live.storyCountry ?? "",
    "Show on Map?": truthy(live.storyShowOnMap) ? "TRUE" : "FALSE",
    "storyKey": storyKey,
  };

  // 1) Append Map Data (includes ts + alumniId)
  await appendAligned({
    sheets,
    spreadsheetId,
    sheetName: "Map Data",
    rowByHeader: {
      ...common,
      ts,
      alumniId,
    },
  });

  // 2) Append Clean Map Data (no ts/alumniId in headers)
  await appendAligned({
    sheets,
    spreadsheetId,
    sheetName: "Clean Map Data",
    rowByHeader: common,
  });

  return { ok: true, appended: true, storyKey };
}
