                                                                                                                                                                                                                                                                                                                                                                                                                                                  // app/api/map/story/route.ts
import { NextResponse } from "next/server";
import { loadMapDataSheet } from "@/lib/sheets";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function norm(v: any) {
  return String(v ?? "").trim();
}

// "Story Key" / "story_key" / "storyKey" -> "storykey"
function keyify(v: any) {
  return norm(v).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function rowToObj(header: any[], row: any[]) {
  const obj: Record<string, any> = {};
  for (let i = 0; i < header.length; i++) {
    const key = keyify(header[i]);
    if (key) obj[key] = row?.[i];
  }

  // ✅ camelCase aliases expected by UI (keep originals too)
  if (obj.storykey != null && obj.storyKey == null) obj.storyKey = obj.storykey;
  if (obj.alumniid != null && obj.alumniId == null) obj.alumniId = obj.alumniid;
  if (obj.authorslug != null && obj.authorSlug == null) obj.authorSlug = obj.authorslug;
  if (obj.locationname != null && obj.locationName == null) obj.locationName = obj.locationname;
  if (obj.moreinfolink != null && obj.moreInfoLink == null) obj.moreInfoLink = obj.moreinfolink;
  if (obj.showonmap != null && obj.showOnMap == null) obj.showOnMap = obj.showonmap;
  if (obj.updatedts != null && obj.updatedTs == null) obj.updatedTs = obj.updatedts;
  if (obj.mediaurl != null && obj.mediaUrl == null) obj.mediaUrl = obj.mediaurl;
  if (obj.storyurl != null && obj.storyUrl == null) obj.storyUrl = obj.storyurl;
  if (obj.storyslug != null && obj.storySlug == null) obj.storySlug = obj.storyslug;

  return obj;
}

function noStoreHeaders() {
  return {
    "Cache-Control": "no-store, max-age=0, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const storyKey = norm(searchParams.get("storyKey"));

    if (!storyKey) {
      return NextResponse.json(
        { error: "Missing storyKey" },
        { status: 400, headers: noStoreHeaders() }
      );
    }

    const loaded = await loadMapDataSheet();

    let header = loaded.header;
    let rows = loaded.rows;

    // Header fallback (same as /my-stories)
    const headerKeys = (header || []).map((h: any) => keyify(h));
    const hasStoryKeyHeader = headerKeys.includes("storykey");

    if (!hasStoryKeyHeader && Array.isArray(rows) && Array.isArray(rows[0])) {
      const candidateHeader = rows[0];
      const candidateKeys = (candidateHeader || []).map((h: any) => keyify(h));
      const candidateHasStoryKey = candidateKeys.includes("storykey");

      if (candidateHasStoryKey) {
        header = candidateHeader;
        rows = rows.slice(1);
      }
    }

    const items = rows
      .map((r: any[]) => rowToObj(header, r))
      // compare against normalized-keyified storykey, but match input as-is
      .filter((r: any) => norm(r?.storykey) === storyKey || norm(r?.storyKey) === storyKey)
      // prefer newest by updatedTs, then ts
      .sort((a: any, b: any) => {
        const aT = norm(a?.updatedTs || a?.updatedts || a?.ts);
        const bT = norm(b?.updatedTs || b?.updatedts || b?.ts);
        return bT.localeCompare(aT);
      });

    // If you truly keep Map Data append-only and might have duplicates per storyKey,
    // we return the newest by updatedTs/ts. Otherwise it will just be the one row.
    const item = items[0];

    if (!item) {
      return NextResponse.json(
        { error: "Story not found" },
        { status: 404, headers: noStoreHeaders() }
      );
    }

    return NextResponse.json({ item }, { headers: noStoreHeaders() });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to load story", detail: err?.message || String(err) },
      { status: 500, headers: noStoreHeaders() }
    );
  }
}
