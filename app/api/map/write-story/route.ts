// app/api/map/write-story/route.ts
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { sheetsClient } from "@/lib/googleClients";

export const runtime = "nodejs";

/* ===========================
   Helpers
   =========================== */

// Map Data headers live on row 2 (row 1 is a note row)
function headerRowNumberFor(sheetName: string) {
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

function truthy(x: any) {
  if (x === true) return true;
  const s = String(x ?? "").trim().toLowerCase();
  return s === "true" || s === "1" || s === "yes" || s === "y";
}

function slugifyLite(input: string) {
  return String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
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

async function loadSheet(opts: {
  sheets: ReturnType<typeof sheetsClient>;
  spreadsheetId: string;
  sheetName: string;
}) {
  const { sheets, spreadsheetId, sheetName } = opts;

  const headerRowNumber = headerRowNumberFor(sheetName);
  const start = headerRowNumber === 2 ? "A2" : "A1";

  const all = await getSheetValues({
    sheets,
    spreadsheetId,
    range: `${sheetName}!${start}:ZZ`,
  });

  const header = all[0] ?? [];
  const rows = all.slice(1);
  const hmap = headerIndexMap(header);

  return { header, rows, hmap, headerRowNumber };
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

async function updateRowAlignedToHeaders(opts: {
  sheets: ReturnType<typeof sheetsClient>;
  spreadsheetId: string;
  sheetName: string;
  rowNumber: number; // 1-based
  rowByHeader: Record<string, any>;
}) {
  const { sheets, spreadsheetId, sheetName, rowNumber, rowByHeader } = opts;

  const headerRowNumber = headerRowNumberFor(sheetName);

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

async function findRowNumberByHeaderValue(opts: {
  sheets: ReturnType<typeof sheetsClient>;
  spreadsheetId: string;
  sheetName: string;
  headerName: string;
  value: string;
}) {
  const { sheets, spreadsheetId, sheetName, headerName, value } = opts;

  const { header, rows, hmap, headerRowNumber } = await loadSheet({
    sheets,
    spreadsheetId,
    sheetName,
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

function rowToObject(header: any[], row: any[]) {
  const obj: Record<string, any> = {};
  for (let i = 0; i < header.length; i++) {
    const key = String(header[i] ?? "").trim();
    if (!key) continue;
    obj[key] = row?.[i] ?? "";
  }
  return obj;
}

function computeFieldsChanged(before: Record<string, any> | null, after: Record<string, any>) {
  if (!before) return "ALL";
  const changed = Object.keys(after).filter((k) => {
    const a = after[k] ?? null;
    const b = before[k] ?? null;
    return JSON.stringify(a) !== JSON.stringify(b);
  });
  return changed.length ? changed.join(", ") : "";
}

/* ===========================
   Route
   =========================== */
/**
 * POST body:
 * {
 *   alumniId: string,         // target profile (canonical owner)
 *   editorAlumniId?: string,  // viewer (who performed the edit)
 *   editorSlug: string,   // viewer who performed the write (display)
 *   mode: "create" | "edit",
 *   storyKey?: string         // required for edit
 * }

 *
 * Reads story buffer from Profile-Live story* fields,
 * writes canonical to Map Data + logs to Story-Edits.
 *
 * IMPORTANT: Option C — DO NOT TOUCH "Clean Map Data" here.
 */
export async function POST(req: Request) {
  try {
    const spreadsheetId = process.env.ALUMNI_SHEET_ID;
    if (!spreadsheetId) {
      return NextResponse.json({ ok: false, error: "Missing ALUMNI_SHEET_ID" }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const alumniId = String(body?.alumniId ?? "").trim(); // target
    const editorAlumniId = String(body?.editorAlumniId ?? "").trim(); // viewer (optional)
    const editorSlug = String(body?.editorSlug ?? "").trim() || "unknown";
    const mode = String(body?.mode ?? "create").trim() as "create" | "edit";
    const incomingStoryKey = String(body?.storyKey ?? "").trim();


    if (!alumniId) {
      return NextResponse.json({ ok: false, error: "Missing alumniId" }, { status: 400 });
    }
    if (mode !== "create" && mode !== "edit") {
      return NextResponse.json({ ok: false, error: "Invalid mode" }, { status: 400 });
    }
    if (mode === "edit" && !incomingStoryKey) {
      return NextResponse.json(
        { ok: false, error: "Missing storyKey for edit mode" },
        { status: 400 }
      );
    }

    if (!editorAlumniId) {
      return NextResponse.json({ ok: false, error: "Missing editorAlumniId" }, { status: 400 });
    }

    const sheets = sheetsClient();

    // 1) Read Profile-Live row for the alumni
    const liveAll = await getSheetValues({
      sheets,
      spreadsheetId,
      range: "Profile-Live!A:ZZ",
    });

    if (liveAll.length < 2) {
      return NextResponse.json({ ok: false, error: "Profile-Live empty" }, { status: 500 });
    }

    const liveHeader = liveAll[0] ?? [];
    const liveRows = liveAll.slice(1);
    const liveHmap = headerIndexMap(liveHeader);

    const idIdx = liveHmap["alumniId"] ?? liveHmap["alumniid"];
    if (typeof idIdx !== "number") {
      return NextResponse.json(
        { ok: false, error: 'Profile-Live missing "alumniId" header' },
        { status: 500 }
      );
    }

    const liveRow = liveRows.find((r) => String(r?.[idIdx] ?? "").trim() === alumniId);
    if (!liveRow) {
      return NextResponse.json({ ok: false, error: "Profile-Live row not found" }, { status: 404 });
    }

    const getLive = (key: string) => {
      const idx = liveHmap[key];
      if (typeof idx !== "number") return "";
      return String(liveRow?.[idx] ?? "");
    };

    const showRaw = getLive("storyShowOnMap");
    if (!truthy(showRaw)) {
      return NextResponse.json({ ok: true, skipped: true, reason: "storyShowOnMap is false" });
    }

    const nowIso = new Date().toISOString();

    // 2) Build canonical story fields (ONLY the fields alumni controls)
    const title = getLive("storyTitle");
    const country = getLive("storyCountry");

    // Optional: if you later add storySlug to Profile-Live, we’ll respect it.
    const incomingStorySlug = getLive("storySlug");
    const derivedStorySlug =
      incomingStorySlug ||
      slugifyLite(`${title}-${country}`) ||
      slugifyLite(title) ||
      "";

    // NOTE: We intentionally do NOT set Latitude/Longitude/Region Tag/Category/Story URL here for edits
    // so we don't accidentally blank admin-managed fields.
    const canonicalEditable: Record<string, any> = {
      Title: title,
      Program: getLive("storyProgram"),
      "Location Name": getLive("storyLocationName"),
      "Year(s)": getLive("storyYears"),
      Partners: getLive("storyPartners"),
      "Short Story": getLive("storyShortStory"),
      Quote: getLive("storyQuote"),
      "Quote Attribution": getLive("storyQuoteAttribution"),

      // ✅ Canonical sheet header is "mediaUrl"
      mediaUrl: getLive("storyMediaUrl"),

      "More Info Link": getLive("storyMoreInfoUrl"),
      Country: country,

      // author identity
      Author: getLive("name"),
      authorSlug: getLive("slug"),

      // story identity
      "Show on Map?": "TRUE",
      storySlug: derivedStorySlug,

      // stable
      alumniId,
    };

    // 3) CREATE
    if (mode === "create") {
      const storyKey = `${alumniId}:s:${randomUUID()}`;

      // For brand new rows, include admin-managed columns as blanks so header-alignment is clean.
      // (These columns can be filled later by admin / sheet formulas.)
      const rowByHeader: Record<string, any> = {
        // editable
        ...canonicalEditable,

        // viewer attribution (optional; only takes effect if headers exist)
        lastEditedByAlumniId: editorAlumniId || "",
        lastEditedBySlug: editorSlug || "unknown",

        // admin-managed (initialize)
        Latitude: "",
        Longitude: "",
        "Region Tag": "",
        Category: "",
        "Story URL": "",

        // identity + timestamps
        storyKey,
        ts: nowIso,
        updatedTs: nowIso,
      };


      await appendRowAlignedToHeaders({
        sheets,
        spreadsheetId,
        sheetName: "Map Data",
        rowByHeader,
      });

      await appendRowAlignedToHeaders({
        sheets,
        spreadsheetId,
        sheetName: "Story-Edits",
        rowByHeader: {
          ts: nowIso,
          storyKey,
          alumniId,              // target
          editorAlumniId,        // viewer (optional)
          editorSlug,            // viewer display slug
          action: "create",
          fieldsChanged: "ALL",
          beforeJson: "",
          afterJson: JSON.stringify(rowByHeader),
        },
      });

      return NextResponse.json({ ok: true, mode, storyKey });
    }

    // 4) EDIT
    const storyKey = incomingStoryKey;

    const rowNumber = await findRowNumberByHeaderValue({
      sheets,
      spreadsheetId,
      sheetName: "Map Data",
      headerName: "storyKey",
      value: storyKey,
    });

    if (!rowNumber) {
      return NextResponse.json(
        { ok: false, error: "storyKey not found in Map Data", storyKey },
        { status: 404 }
      );
    }

    const { header: mapHeader, rows: mapRows, headerRowNumber } = await loadSheet({
      sheets,
      spreadsheetId,
      sheetName: "Map Data",
    });

    const beforeRow = mapRows[rowNumber - (headerRowNumber + 1)];
    const beforeObj = rowToObject(mapHeader, beforeRow);

    // Preserve created timestamp
    const createdTs = String(beforeObj?.ts ?? "").trim() || nowIso;

    // Preserve admin-managed fields by starting with beforeObj,
    // then overwrite ONLY editable fields, then enforce identity/timestamps.
    const afterObj: Record<string, any> = {
      ...beforeObj,

      // overwrite alumnus-editable fields
      ...canonicalEditable,

      // enforce identity
      storyKey,
      alumniId,

      // viewer attribution (optional; only takes effect if headers exist)
      lastEditedByAlumniId: editorAlumniId || "",
      lastEditedBySlug: editorSlug || "unknown",

      // timestamps
      ts: createdTs,
      updatedTs: nowIso,
    };

    const fieldsChanged = computeFieldsChanged(beforeObj, afterObj);

    await updateRowAlignedToHeaders({
      sheets,
      spreadsheetId,
      sheetName: "Map Data",
      rowNumber,
      rowByHeader: afterObj,
    });

    await appendRowAlignedToHeaders({
      sheets,
      spreadsheetId,
      sheetName: "Story-Edits",
      rowByHeader: {
        ts: nowIso,
        storyKey,
        alumniId,              // target
        editorAlumniId,        // viewer (optional)
        editorSlug,            // viewer display slug
        action: "edit",
        fieldsChanged,
        beforeJson: JSON.stringify(beforeObj),
        afterJson: JSON.stringify(afterObj),
      },
    });

    return NextResponse.json({
      ok: true,
      mode,
      storyKey,
      updated: true,
      fieldsChanged,
    });
  } catch (e: any) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
