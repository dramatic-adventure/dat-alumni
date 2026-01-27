// app/api/stories/route.ts
import { NextResponse } from "next/server";
import { loadCsv } from "@/lib/loadCsv";

export const runtime = "nodejs"; // important on Netlify

/* ===========================
   CSV parsing helpers
   =========================== */
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQ = !inQ;
      }
      continue;
    }

    if (ch === "," && !inQ) {
      out.push(cur);
      cur = "";
      continue;
    }

    cur += ch;
  }

  out.push(cur);
  return out;
}

function csvToObjects(csvText: string): any[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.length > 0);

  if (!lines.length) return [];

  const headers = parseCsvLine(lines[0]).map((h) =>
    String(h ?? "").replace(/^\uFEFF/, "").trim()
  );

  const rows: any[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const obj: any = {};
    headers.forEach((h, idx) => {
      obj[h] = (cols[idx] ?? "").trim();
    });
    rows.push(obj);
  }

  return rows;
}

function firstNonEmpty(obj: any, keys: string[]): string {
  for (const k of keys) {
    const v = obj?.[k];
    if (v != null && String(v).trim() !== "") return String(v).trim();
  }
  return "";
}

function toNumberOrNull(v: any): number | null {
  const raw = String(v ?? "").trim();
  if (!raw) return null;

  // handle commas, spaces, em/en dashes
  const cleaned = raw
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, "")
    .replace(/,/g, "");

  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function yesNo(v: any): boolean {
  const s = String(v ?? "").trim().toLowerCase();
  if (!s) return false;
  return ["y", "yes", "true", "1", "show", "visible"].includes(s);
}

/* ===========================
   Output shape expected by StoryMap
   =========================== */
function buildStoriesFromCsv(csv: string) {
  const rows = csvToObjects(csv);

  return rows
    .map((r: any) => {
      // Respect “Show on Map?” when present.
      // If the column is missing/blank, default to true (so we don’t accidentally hide everything).
      const showRaw = firstNonEmpty(r, ["Show on Map?", "Show on Map", "showOnMap", "show_on_map"]);
      const show =
        showRaw.trim() === "" ? true : yesNo(showRaw);

      if (!show) return null;

      const slug = firstNonEmpty(r, ["slug", "Slug", "SLUG"]);
      const title = firstNonEmpty(r, ["Title", "title", "TITLE"]);

      const lat = toNumberOrNull(
        firstNonEmpty(r, ["Latitude", "latitude", "Lat", "lat", "LAT"])
      );

      const lng = toNumberOrNull(
        firstNonEmpty(r, [
          "Longitude",
          "longitude",
          "Lng",
          "lng",
          "LNG",
          "lon",
          "Lon",
          "long",
          "Long",
        ])
      );

      // Require the minimum viable fields for a pin
      if (!title || !slug || lat == null || lng == null) return null;

      const categoryRaw = firstNonEmpty(r, ["Category", "category"]);
      const category = categoryRaw ? categoryRaw.toLowerCase().trim() : "";

      // Return *all* fields your popup expects (matching your client mapping)
      return {
        // coordinates used by client fetchStoriesAsFeatures()
        lat,
        lng,

        // story content fields (matching your FeatureProps keys)
        Title: title,
        Program: firstNonEmpty(r, ["Program", "program"]),
        "Location Name": firstNonEmpty(r, ["Location Name", "LocationName", "locationName"]),
        Country: firstNonEmpty(r, ["Country", "country"]),
        RegionTag: firstNonEmpty(r, ["Region Tag", "RegionTag", "regionTag"]),
        "Year(s)": firstNonEmpty(r, ["Year(s)", "Years", "year(s)", "years"]),
        Partners: firstNonEmpty(r, ["Partners", "partners"]),
        "Short Story": firstNonEmpty(r, ["Short Story", "shortStory", "short_story", "Story", "story"]),
        Quote: firstNonEmpty(r, ["Quote", "quote"]),
        "Quote Author": firstNonEmpty(r, ["Quote Author", "QuoteAuthor", "quoteAuthor"]),
        "Image URL": firstNonEmpty(r, ["Image URL", "ImageURL", "imageUrl", "image_url"]),
        Author: firstNonEmpty(r, ["Author", "author"]),
        authorSlug: firstNonEmpty(r, ["authorSlug", "AuthorSlug", "author_slug"]),
        "More Info Link": firstNonEmpty(r, ["More Info Link", "MoreInfoLink", "moreInfoLink", "more_info_link"]),
        "Story URL": firstNonEmpty(r, ["Story URL", "StoryURL", "storyUrl", "story_url"]),
        "Story ID": firstNonEmpty(r, ["Story ID", "StoryID", "storyId", "story_id"]),

        // keep canonical slug + category fields too
        slug,
        category,
      };
    })
    .filter(Boolean);
}

/* ===========================
   Route handler
   =========================== */
export async function GET() {
  try {
    const sheetId = (process.env.STORIES_SHEET_ID || "").trim();
    const gid = (process.env.STORIES_GID || "582055134").trim();

    if (!sheetId) {
      return NextResponse.json(
        { ok: false, error: "Missing STORIES_SHEET_ID" },
        { status: 500 }
      );
    }

    // Primary: must be /spreadsheets/d/<id>/export so SA fallback can work
    const sourceUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${encodeURIComponent(
      gid
    )}`;

    // Optional secondary: published CSV (works when sheet is public)
    const publishedUrl = (process.env.NEXT_PUBLIC_MAP_CSV_URL || "").trim();

    // Always use the unified fallback name
    const FALLBACK_NAME = "Clean Map Data.csv";

    // 1) Try primary export (with loadCsv fallbacks + SA fallback + blobs/local)
    try {
      const csv = await loadCsv(sourceUrl, FALLBACK_NAME, { noStore: true });
      const stories = buildStoriesFromCsv(csv);
      return NextResponse.json({ ok: true, stories }, { status: 200 });
    } catch (primaryErr: any) {
      // 2) If primary fails, try published CSV as a last-ditch live source
      if (publishedUrl) {
        const csv = await loadCsv(publishedUrl, FALLBACK_NAME, { noStore: true });
        const stories = buildStoriesFromCsv(csv);
        return NextResponse.json({ ok: true, stories }, { status: 200 });
      }
      throw primaryErr;
    }
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || String(err) },
      { status: 500 }
    );
  }
}
