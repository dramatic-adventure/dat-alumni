// app/api/map/my-stories/route.ts
import { NextResponse } from "next/server";
import { loadMapDataSheet } from "@/lib/sheets";

export const dynamic = "force-dynamic";

function norm(v: any) {
  return String(v ?? "").trim();
}

// "Alumni Id" / "alumni_id" / "alumniId" -> "alumniid"
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

    // ✅ UI-friendly aliases for story editor (Profile-Live style keys)
  if (obj.title != null && obj.storyTitle == null) obj.storyTitle = obj.title;
  if (obj.program != null && obj.storyProgram == null) obj.storyProgram = obj.program;
  if (obj.country != null && obj.storyCountry == null) obj.storyCountry = obj.country;
  if (obj.years != null && obj.storyYears == null) obj.storyYears = obj.years;

  if (obj.shortstory != null && obj.storyShortStory == null) obj.storyShortStory = obj.shortstory;
  if (obj.quote != null && obj.storyQuote == null) obj.storyQuote = obj.quote;
  if (obj.quoteattribution != null && obj.storyQuoteAttribution == null)
    obj.storyQuoteAttribution = obj.quoteattribution;
  if (obj.locationname != null && obj.storyLocationName == null) obj.storyLocationName = obj.locationname;
  if (obj.moreinfolink != null && obj.storyMoreInfoUrl == null) obj.storyMoreInfoUrl = obj.moreinfolink;


  return obj;
}


export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    // Prefer alumniId. Slug is optional fallback.
    const alumniId = norm(searchParams.get("alumniId"));
    const slug = norm(searchParams.get("slug"));

    if (!alumniId && !slug) {
      return NextResponse.json(
        { error: "Missing alumniId or slug" },
        { status: 400 }
      );
    }

    const loaded = await loadMapDataSheet();

    let header = loaded.header;
    let rows = loaded.rows;

    // If the sheet loader grabbed row 1 as header, but row 2 is the real header,
    // the "header" won’t contain alumniId, but rows[0] will.
    const headerKeys = (header || []).map((h: any) => keyify(h));
    const hasAlumniIdHeader = headerKeys.includes("alumniid");

    if (!hasAlumniIdHeader && Array.isArray(rows) && Array.isArray(rows[0])) {
    const candidateHeader = rows[0];
    const candidateKeys = (candidateHeader || []).map((h: any) => keyify(h));
    const candidateHasAlumniId = candidateKeys.includes("alumniid");

    if (candidateHasAlumniId) {
        header = candidateHeader;
        rows = rows.slice(1);
    }
    }


    const items = rows
      .map((r: any[]) => rowToObj(header, r))
      .filter((r: any) => {
        const rAlumniId = norm(r?.alumniId ?? r?.alumniid);
        const rSlug = norm(r?.authorSlug ?? r?.authorslug ?? r?.slug ?? r?.author);
        return (alumniId && rAlumniId === alumniId) || (!alumniId && slug && rSlug === slug);
      })
      .sort((a: any, b: any) => norm(b?.ts).localeCompare(norm(a?.ts)));

  return NextResponse.json({ items });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to load stories", detail: err?.message || String(err) },
      { status: 500 }
    );
  }
}
