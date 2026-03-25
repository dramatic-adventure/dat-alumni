// app/api/map/append-story/route.ts
import { NextResponse } from "next/server";
import { sheetsClient } from "@/lib/googleClients";

export const runtime = "nodejs";

function headerRowNumberFor(sheetName: string) {
  // Map Data headers live on row 2 (row 1 is a note row)
  return sheetName === "Map Data" ? 2 : 1;
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

function buildAlignedRow(headers: any[], rowByHeader: Record<string, any>) {
  return headers.map((h: any) => {
    const key = String(h ?? "").trim();
    if (!key) return "";
    const v = rowByHeader[key];
    return v == null ? "" : String(v);
  });
}

async function getSheetValues(opts: {
  sheets: ReturnType<typeof sheetsClient>;
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

async function findExactInColumnByHeader(opts: {
  sheets: ReturnType<typeof sheetsClient>;
  spreadsheetId: string;
  sheetName: string;
  headerName: string;
  value: string;
}) {
  const { sheets, spreadsheetId, sheetName, headerName, value } = opts;

  const headerRowNumber = headerRowNumberFor(sheetName);
  const start = headerRowNumber === 2 ? "A2" : "A1";

  const all = await getSheetValues({
    sheets,
    spreadsheetId,
    range: `${sheetName}!${start}:ZZ`,
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

async function appendRowAlignedToHeaders(opts: {
  sheets: ReturnType<typeof sheetsClient>;
  spreadsheetId: string;
  sheetName: string;
  rowByHeader: Record<string, any>;
}) {
  const { sheets, spreadsheetId, sheetName, rowByHeader } = opts;

  const headerRowNumber = headerRowNumberFor(sheetName);

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

function truthy(x: any) {
  if (x === true) return true;
  const s = String(x ?? "").trim().toLowerCase();
  return s === "true" || s === "1" || s === "yes" || s === "y";
}

export async function POST(req: Request) {
  try {
    const spreadsheetId = process.env.ALUMNI_SHEET_ID;
    if (!spreadsheetId) {
      return NextResponse.json({ ok: false, error: "Missing ALUMNI_SHEET_ID" }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const alumniId: string = String(body?.alumniId ?? "").trim();
    if (!alumniId) {
      return NextResponse.json({ ok: false, error: "Missing alumniId" }, { status: 400 });
    }

    const sheets = sheetsClient();

    // Pull Profile-Live row by scanning (simple + consistent with your save route style)
    const liveAll = await getSheetValues({
      sheets,
      spreadsheetId,
      range: "Profile-Live!A:ZZ",
    });

    if (liveAll.length < 2) {
      return NextResponse.json({ ok: false, error: "Profile-Live empty" }, { status: 500 });
    }

    const header = liveAll[0] ?? [];
    const rows = liveAll.slice(1);
    const hmap = headerIndexMap(header);

    const idIdx = hmap["alumniId"] ?? hmap["alumniid"];
    if (typeof idIdx !== "number") {
      return NextResponse.json(
        { ok: false, error: 'Profile-Live missing "alumniId" header' },
        { status: 500 }
      );
    }

    const row = rows.find((r) => String(r?.[idIdx] ?? "").trim() === alumniId);
    if (!row) {
      return NextResponse.json({ ok: false, error: "Profile-Live row not found" }, { status: 404 });
    }

    const get = (key: string) => {
      const idx = hmap[key];
      if (typeof idx !== "number") return "";
      return String(row?.[idx] ?? "");
    };

    const ts = get("storyTimeStamp");
    if (!ts) {
      return NextResponse.json({ ok: false, error: "Missing storyTimeStamp" }, { status: 400 });
    }

    const show = get("storyShowOnMap");
    if (!truthy(show)) {
      return NextResponse.json({ ok: true, skipped: true, reason: "storyShowOnMap is false" });
    }

    const stableId = get("alumniId");
    const storyKey = `${stableId}::${ts}`;

    // Dedupe in Clean Map Data
    const exists = await findExactInColumnByHeader({
      sheets,
      spreadsheetId,
      sheetName: "Clean Map Data",
      headerName: "storyKey",
      value: storyKey,
    });

    if (exists) {
      return NextResponse.json({ ok: true, deduped: true, storyKey });
    }

    const common = {
      Title: get("storyTitle"),
      Program: get("storyProgram"),
      "Location Name": get("storyLocationName"),
      "Year(s)": get("storyYears"),
      Partners: get("storyPartners"),
      "Short Story": get("storyShortStory"),
      Quote: get("storyQuote"),
      "Quote Attribution": get("storyQuoteAttribution"),
      mediaUrl: get("storyMediaUrl"),
      Author: get("name"),
      authorSlug: get("slug"),
      "More Info Link": get("storyMoreInfoUrl"),
      Country: get("storyCountry"),
      "Show on Map?": truthy(show) ? "TRUE" : "FALSE",

      // ✅ add these so Clean Map Data can be filtered per alumni + sorted
      alumniId: stableId,
      ts,

      storyKey,
    } as const;

    await appendRowAlignedToHeaders({
      sheets,
      spreadsheetId,
      sheetName: "Map Data",
      rowByHeader: {
        ...common,
        ts,
        alumniId: stableId,
      },
    });

    await appendRowAlignedToHeaders({
      sheets,
      spreadsheetId,
      sheetName: "Clean Map Data",
      rowByHeader: common,
    });

    return NextResponse.json({ ok: true, appended: true, storyKey });
  } catch (e: any) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("APPEND-STORY ERROR:", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
