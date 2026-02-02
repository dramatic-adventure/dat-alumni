import { NextResponse } from "next/server";
import { sheetsClient } from "@/lib/googleClients";

export const runtime = "nodejs";

function headerIndexMap(headerRow: any[]) {
  const map: Record<string, number> = {};
  for (let i = 0; i < headerRow.length; i++) {
    const h = String(headerRow[i] ?? "").trim();
    if (!h) continue;

    // store both raw and "keyified"
    map[h] = i;
    map[h.toLowerCase().replace(/[^a-z0-9]/g, "")] = i; // storyKey -> storykey
  }
  return map;
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

function keyify(v: any) {
  return String(v ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function rowToObject(header: any[], row: any[]) {
  const obj: Record<string, any> = {};
  const keyed: Record<string, any> = {};

  for (let i = 0; i < header.length; i++) {
    const rawKey = String(header[i] ?? "").trim();
    if (!rawKey) continue;

    const val = row?.[i] ?? "";

    // preserve raw header keys for debugging/inspection
    obj[rawKey] = val;

    // also store normalized keys for robust lookups
    const k = keyify(rawKey);
    if (k && keyed[k] == null) keyed[k] = val;
  }

  // --- aliases for client expectations (camelCase) ---
  const storyKeyVal = String(keyed["storykey"] ?? "").trim();
  if (storyKeyVal && !obj.storyKey) obj.storyKey = storyKeyVal;

  const alumniIdVal = String(keyed["alumniid"] ?? "").trim();
  if (alumniIdVal && !obj.alumniId) obj.alumniId = alumniIdVal;

  const authorSlugVal = String(keyed["authorslug"] ?? "").trim();
  if (authorSlugVal && !obj.authorSlug) obj.authorSlug = authorSlugVal;

    const mediaUrlVal = String(keyed["mediaurl"] ?? "").trim();
  if (mediaUrlVal && !obj.mediaUrl) obj.mediaUrl = mediaUrlVal;

  const updatedTsVal = String(keyed["updatedts"] ?? "").trim();
  if (updatedTsVal && !obj.updatedTs) obj.updatedTs = updatedTsVal;

  const storySlugVal = String(keyed["storyslug"] ?? "").trim();
  if (storySlugVal && !obj.storySlug) obj.storySlug = storySlugVal;

  const showOnMapVal = String(keyed["showonmap"] ?? "").trim();
  if (showOnMapVal && !obj.showOnMap) obj.showOnMap = showOnMapVal;

  const moreInfoLinkVal = String(keyed["moreinfolink"] ?? "").trim();
  if (moreInfoLinkVal && !obj.moreInfoLink) obj.moreInfoLink = moreInfoLinkVal;

  const locationNameVal = String(keyed["locationname"] ?? "").trim();
  if (locationNameVal && !obj.locationName) obj.locationName = locationNameVal;

  return obj;
}


export async function GET(req: Request) {
  try {
    const spreadsheetId = process.env.ALUMNI_SHEET_ID;
    if (!spreadsheetId) {
      return NextResponse.json({ ok: false, error: "Missing ALUMNI_SHEET_ID" }, { status: 500 });
    }

    const url = new URL(req.url);
    const storyKey = String(url.searchParams.get("storyKey") || "").trim();
    if (!storyKey) {
      return NextResponse.json({ ok: false, error: "Missing storyKey" }, { status: 400 });
    }

    const sheets = sheetsClient();
    const all = await getSheetValues({
      sheets,
      spreadsheetId,
      range: "Map Data!A:ZZ",
    });

    if (all.length < 2) {
      return NextResponse.json({ ok: false, error: "Map Data empty" }, { status: 404 });
    }

    const header = all[0] ?? [];
    const rows = all.slice(1);
    const idx = header.findIndex((h: any) => keyify(h) === "storykey");

    if (typeof idx !== "number") {
      return NextResponse.json(
        { ok: false, error: 'Map Data missing header "storyKey" (case-insensitive: storyKey/storykey)' },
        { status: 500 }
      );
    }

    const hit = rows.find((r) => String(r?.[idx] ?? "").trim() === storyKey);
    if (!hit) return NextResponse.json({ ok: true, row: null }, { status: 200 });

    const raw = rowToObject(header, hit);
    return NextResponse.json({ ok: true, row: raw }, { status: 200 });


  } catch (e: any) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
