// app/api/stories/route.ts
import { NextResponse } from "next/server";
import { loadCsv } from "@/lib/loadCsv";

export const runtime = "nodejs"; // important on Netlify

// ✅ Ensure Next doesn't cache this route
export const dynamic = "force-dynamic";
export const revalidate = 0;

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
  const rawLines = String(csvText || "")
    .split(/\r?\n/)
    .map((l) => l.replace(/^\uFEFF/, "").trimEnd());

  if (!rawLines.length) return [];

  // ✅ This sheet has an ARRAYFORMULA row in row 1.
  // Headers are in row 2.
  let headerIdx = -1;

  // Prefer row 2 explicitly (deterministic for this sheet)
  if (rawLines.length >= 2 && rawLines[1]) {
    headerIdx = 1;
  } else {
    // Fallback: find first “real” header line (skip comma-only junk + blanks)
    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i];
      if (!line) continue;
      if (isCommaOnlyLine(line)) continue;
      headerIdx = i;
      break;
    }
  }

  if (headerIdx === -1) return [];

  const headers = parseCsvLine(rawLines[headerIdx]).map((h) =>
    String(h ?? "").replace(/^\uFEFF/, "").trim()
  );

  const rows: any[] = [];

  for (let i = headerIdx + 1; i < rawLines.length; i++) {
    const line = rawLines[i];
    if (!line) continue;
    if (isCommaOnlyLine(line)) continue;

    const cols = parseCsvLine(line);
    const obj: any = {};
    headers.forEach((h, idx) => {
      if (!h) return; // ignore blank header names
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

function truthyShowOnMap(row: any): boolean {
  const showRaw = firstNonEmpty(row, [
    "Show on Map?",
    "Show on Map",
    "showOnMap",
    "show_on_map",
  ]);
  // If missing/blank, default true (don’t accidentally hide everything)
  return showRaw.trim() === "" ? true : yesNo(showRaw);
}

/* ===========================
   Slug helpers (tolerant)
   =========================== */
function extractSlugFromStoryUrl(url: string): string {
  const u = String(url || "").trim();
  if (!u) return "";
  const cleaned = u.replace(/^https?:\/\/[^/]+/i, "");
  const m = cleaned.match(/\/story\/([^/?#]+)/i);
  if (m?.[1]) return decodeURIComponent(m[1]).trim();
  const parts = cleaned.split("/").filter(Boolean);
  return parts.length ? decodeURIComponent(parts[parts.length - 1]).trim() : "";
}

function cleanSlug(s: string): string {
  return String(s || "")
    .trim()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
}

/* ===========================
   CSV validity checks (loose)
   =========================== */
function snippet(text: string, n = 500) {
  return String(text || "").slice(0, n);
}

function isCommaOnlyLine(line: string): boolean {
  const s = String(line || "").trim();
  if (!s) return true;
  // Remove commas and whitespace; if nothing left, it's effectively empty.
  return s.replace(/[, \t]/g, "") === "";
}

function firstMeaningfulLine(text: string): string {
  const lines = String(text || "").split(/\r?\n/);
  for (const line of lines) {
    const cleaned = String(line ?? "").replace(/^\uFEFF/, "").trim();
    if (!cleaned) continue;
    if (isCommaOnlyLine(cleaned)) continue;
    return cleaned;
  }
  return "";
}

function looksLikeHtml(text: string): boolean {
  const t = snippet(text, 800).toLowerCase();
  return (
    t.includes("<!doctype html") ||
    t.includes("<html") ||
    t.includes("<head") ||
    t.includes("<body")
  );
}

function looksLikeCsv(text: string): boolean {
  const h = firstMeaningfulLine(text);
  const commaCount = (h.match(/,/g) || []).length;
  return commaCount >= 2;
}

function headerHasExpectedColumns(csvText: string): boolean {
  const h = firstMeaningfulLine(csvText).toLowerCase();
  // Expect SOME of these in your export
  const expected = ["title", "latitude", "longitude", "country", "year"];
  return expected.some((k) => h.includes(k));
}

function validateCsvOrThrow(csvText: string, label: string) {
  if (!csvText || String(csvText).trim() === "") {
    throw new Error(`${label}: empty response`);
  }
  if (looksLikeHtml(csvText)) {
    throw new Error(`${label}: looks like HTML (auth/permission page)`);
  }
  if (!looksLikeCsv(csvText)) {
    throw new Error(`${label}: does not look like CSV (header has too few commas)`);
  }
  if (!headerHasExpectedColumns(csvText)) {
    const hdr = firstMeaningfulLine(csvText);
    throw new Error(
      `${label}: CSV headers missing expected columns (saw header: ${JSON.stringify(
        hdr.slice(0, 160)
      )})`
    );
  }
}

function buildSearchBlob(row: any, extra: Record<string, any>) {
  const pick = (k: string) => (row?.[k] == null ? "" : String(row[k]));

  const curatedFields = [
    pick("Title"),
    pick("Program"),
    pick("Location Name"),
    pick("Country"),
    pick("Region Tag"),
    pick("Year(s)"),
    pick("Partners"),
    pick("Story"),
    pick("Full Story"),
    pick("Short Story"),
    pick("Quote"),
    pick("Quote Attribution"),
    pick("Author"),
    pick("authorSlug"),
    pick("Story URL"),
    pick("Slug"),
    pick("storySlug"),
    pick("storyKey"),
    pick("alumniId"),
    pick("Category"),
  ].join(" ");

  const curatedExtra = Object.values(extra || {})
    .map((v) => (v == null ? "" : String(v)))
    .join(" ");

  return `${curatedFields} ${curatedExtra}`.trim();
}


/* ===========================
   Output shape expected by StoryMap + Studio picker
   =========================== */
function buildStoriesFromCsv(csv: string) {
  const rows = csvToObjects(csv);

  return rows
    .map((r: any) => {
      if (!truthyShowOnMap(r)) return null;

      // canonical identity + sorting (Map Data headers)
      const storyKey = firstNonEmpty(r, ["storyKey", "StoryKey", "story_key"]);
      const alumniId = firstNonEmpty(r, ["alumniId", "AlumniId", "alumni_id"]);
      const ts = firstNonEmpty(r, ["ts", "createdTs", "createdAt"]);
      const updatedTs =
        firstNonEmpty(r, ["updatedTs", "UpdatedTs", "updated_ts"]) || ts;

      const storyUrl = firstNonEmpty(r, [
        "Story URL",
        "StoryURL",
        "storyUrl",
        "story_url",
      ]);

      const slugRaw =
        firstNonEmpty(r, [
          "storySlug",
          "storySlug ",
          "story_slug",
          "Story Slug",
          "Story Slug ",
          "StorySlug",
          "Slug",
          "Slug ",
          "slug",
          "slug ",
          "SLUG",
        ]) || extractSlugFromStoryUrl(storyUrl);

      const slug = cleanSlug(slugRaw);

      const title = firstNonEmpty(r, [
        "Title",
        "title",
        "TITLE",
        "storyTitle",
        "story_title",
      ]);

      const lat = toNumberOrNull(
        firstNonEmpty(r, ["Latitude", "Latitude ", "latitude", "Lat", "lat", "LAT"])
      );

      const lng = toNumberOrNull(
        firstNonEmpty(r, [
          "Longitude",
          "Longitude ",
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

      if (!title || !slug || lat == null || lng == null) return null;

      const categoryRaw = firstNonEmpty(r, ["Category", "category"]);
      const category = categoryRaw ? categoryRaw.toLowerCase().trim() : "";

      const quoteAttribution = firstNonEmpty(r, [
        "Quote Attribution",
        "Quote attribution",
        // legacy fallbacks
        "Quote Author",
        "QuoteAuthor",
        "quoteAuthor",
        "quote_author",
      ]);

      const __search = buildSearchBlob(r, {
        title,
        slug,
        storyUrl,
        storyKey,
        alumniId,
        category,
        quoteAttribution,
      });

      return {
        lat,
        lng,

        Title: title,
        Program: firstNonEmpty(r, ["Program", "program"]),
        "Location Name": firstNonEmpty(r, ["Location Name", "LocationName", "locationName"]),
        Country: firstNonEmpty(r, ["Country", "country"]),
        RegionTag: firstNonEmpty(r, ["Region Tag", "RegionTag", "regionTag"]),
        "Year(s)": firstNonEmpty(r, ["Year(s)", "Years", "year(s)", "years"]),
        Partners: firstNonEmpty(r, ["Partners", "partners"]),
        // ✅ Excerpt / teaser (safe to show on cards + map)
        "Short Story": firstNonEmpty(r, [
          "Short Story",
          "shortStory",
          "short_story",
          "Excerpt",
          "excerpt",
          "Summary",
          "summary",
        ]),
        // ✅ Full story body (DO NOT overwrite with excerpt)
        Story: firstNonEmpty(r, [
          "Full Story",
          "FullStory",
          "fullStory",
          "full_story",
          "Story",
          "story",
          "Body",
          "body",
          "Content",
          "content",
          "Text",
          "text",
        ]),
        Quote: firstNonEmpty(r, ["Quote", "quote"]),

        "Quote Attribution": quoteAttribution,
        "Quote Author": quoteAttribution,

        "Image URL": firstNonEmpty(r, [
          "Image URL",
          "ImageURL",
          "imageUrl",
          "image_url",
          "mediaUrl",
          "mediaUrl ",
        ]),
        Author: firstNonEmpty(r, ["Author", "author"]),
        authorSlug: firstNonEmpty(r, ["authorSlug", "AuthorSlug", "author_slug"]),
        "More Info Link": firstNonEmpty(r, ["More Info Link", "MoreInfoLink", "moreInfoLink", "more_info_link"]),
        "Story URL": storyUrl,

        storyKey,
        alumniId,
        ts,
        updatedTs,

        // ✅ keep both shapes for client compatibility
        slug,
        Slug: slug,

        category,

        // ✅ the whole point: deterministic search on client
        __search,
      };
    })
    .filter(Boolean);
}

function noStoreHeaders() {
  return {
    "Cache-Control": "no-store, max-age=0, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  };
}

function compareTsDesc(a: any, b: any) {
  const ax = String(a?.updatedTs || a?.ts || "").trim();
  const bx = String(b?.updatedTs || b?.ts || "").trim();
  if (!ax && !bx) return 0;
  if (!ax) return 1;
  if (!bx) return -1;
  return bx.localeCompare(ax);
}

/* ===========================
   Route handler
   =========================== */
export async function GET(req: Request) {
  const isProd = process.env.NODE_ENV === "production";

  try {
    const url = new URL(req.url);
    const debug = url.searchParams.get("debug") === "1" && !isProd;

    const sheetId = (process.env.STORIES_SHEET_ID || "").trim();
    const gid = (process.env.STORIES_GID || "582055134").trim();

    if (!sheetId) {
      return NextResponse.json(
        { ok: false, error: "Missing STORIES_SHEET_ID" },
        { status: 500, headers: noStoreHeaders() }
      );
    }

    const filterAlumniId = String(url.searchParams.get("alumniId") || "").trim();

    // ✅ Cache-bust param to avoid stale CSV from intermediary caches
    const cb = Date.now();

    const sourceUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${encodeURIComponent(
      gid
    )}&_cb=${cb}`;

    const publishedUrlRaw = (process.env.NEXT_PUBLIC_MAP_CSV_URL || "").trim();
    const publishedUrl = publishedUrlRaw
      ? `${publishedUrlRaw}${publishedUrlRaw.includes("?") ? "&" : "?"}_cb=${cb}`
      : "";

    const FALLBACK_NAME = "Clean Map Data.csv"; // local repo fallback

    const diag: any = debug
      ? {
          env: {
            NODE_ENV: process.env.NODE_ENV,
            has_STORIES_SHEET_ID: !!sheetId,
            STORIES_GID: gid,
            has_NEXT_PUBLIC_MAP_CSV_URL: !!publishedUrlRaw,
          },
          urls: {
            primary: sourceUrl,
            published: publishedUrl || "(missing)",
          },
          primary: {},
          published: {},
          fallback: {},
        }
      : null;

const tryLoad = async (
  label: "primary" | "published",
  urlToUse: string
): Promise<{ text: string; didFallback: boolean }> => {
  try {
    const txt = await loadCsv(urlToUse, FALLBACK_NAME, {
      noStore: true,
      cacheBust: false,
    });

    // Heuristic: if the remote source fails, loadCsv may return the local fallback file.
    // Detect that by checking whether the returned content looks like the expected CSV
    // *and* the URL we asked for is empty or clearly not reachable is not detectable here,
    // so we mark fallback if validation fails for the remote label but succeeds for the text.
    //
    // Instead: we validate normally (remote expectations). If it passes, we assume remote.
    // If it fails, the caller will handle fallback explicitly.

    if (debug) {
      diag[label].firstMeaningfulLine = firstMeaningfulLine(txt);
      diag[label].looksLikeHtml = looksLikeHtml(txt);
      diag[label].looksLikeCsv = looksLikeCsv(txt);
      diag[label].hasExpectedHeaders = headerHasExpectedColumns(txt);
      diag[label].snippet = snippet(txt, 600);
    }

    validateCsvOrThrow(txt, label);
    return { text: txt, didFallback: false };
  } catch (e: any) {
    if (debug) {
      diag[label].error = e?.message || String(e);
    }
    throw e;
  }
};

const loadLocalFallback = async (): Promise<string> => {
  // Force “no url” so loadCsv MUST use the local fallback file.
  const txt = await loadCsv("", FALLBACK_NAME, { noStore: true, cacheBust: false });

  if (debug) {
    diag.fallback = {
      firstMeaningfulLine: firstMeaningfulLine(txt),
      looksLikeHtml: looksLikeHtml(txt),
      looksLikeCsv: looksLikeCsv(txt),
      hasExpectedHeaders: headerHasExpectedColumns(txt),
      snippet: snippet(txt, 600),
    };
  }

  // Validate as “fallback”
  validateCsvOrThrow(txt, "fallback");
  return txt;
};

let csv = "";
let used: "primary" | "published" | "fallback" = "primary";

try {
  csv = (await tryLoad("primary", sourceUrl)).text;
  used = "primary";
} catch (primaryErr: any) {
  try {
    if (publishedUrl) {
      csv = (await tryLoad("published", publishedUrl)).text;
      used = "published";
    } else {
      throw new Error("NEXT_PUBLIC_MAP_CSV_URL is missing");
    }
  } catch (publishedErr: any) {
    // Final tier: local fallback file
    try {
      csv = await loadLocalFallback();
      used = "fallback";
    } catch (fallbackErr: any) {
      const msg1 = primaryErr?.message || String(primaryErr);
      const msg2 = publishedErr?.message || String(publishedErr);
      const msg3 = fallbackErr?.message || String(fallbackErr);

      return NextResponse.json(
        {
          ok: false,
          error: `All CSV sources failed. primary=${msg1}; published=${msg2}; fallback=${msg3}`,
          ...(debug ? { _debug: diag } : {}),
        },
        { status: 500, headers: noStoreHeaders() }
      );
    }
  }
}

    let stories = buildStoriesFromCsv(csv);

    if (filterAlumniId) {
      stories = stories.filter(
        (s: any) => String(s?.alumniId || "").trim() === filterAlumniId
      );
    }

    stories.sort(compareTsDesc);

    return NextResponse.json(
      {
        ok: true,
        stories,
        ...(debug ? { _debug: { used, ...diag } } : {}),
      },
      { status: 200, headers: noStoreHeaders() }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || String(err),
        ...(isProd
          ? {}
          : { hint: "Open /api/stories?debug=1 to see detailed diagnostics." }),
      },
      { status: 500, headers: noStoreHeaders() }
    );
  }
}
