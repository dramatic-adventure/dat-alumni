// lip/normalizeStoryRow.ts
export {}; // forces the file to be treated as a module

import { StoryRow } from "./types";
import { canonicalizeSlug } from "@/lib/slugAliases";

const DEBUG = process.env.SHOW_DAT_DEBUG === "true";

/** Coerce any input to a trimmed string. Never throws. */
function s(v: unknown): string {
  return String(v ?? "").trim();
}

// 🔧 Force all URLs to use HTTPS for consistency
function forceHttps(url: string): string {
  const u = s(url);
  if (!u) return "";
  return u.startsWith("http://") ? u.replace("http://", "https://") : u;
}

function normalizeKey(k: string): string {
  return s(k).toLowerCase().replace(/\s+/g, " ");
}

/** Build a case/space-insensitive getter for the *exact* Clean Map headers (+ variations). */
function makeGetter(row: Record<string, unknown>) {
  const map = new Map<string, string>();

  for (const [k, v] of Object.entries(row || {})) {
    map.set(normalizeKey(k), s(v));
  }

  const get = (...candidates: string[]) => {
    for (const c of candidates) {
      const v = map.get(normalizeKey(c));
      if (v) return v;
    }
    return "";
  };

  return { get };
}

function extractSlugFromStoryUrl(url: string): string {
  const u = s(url);
  if (!u) return "";
  try {
    const parsed = new URL(u, "http://local");
    const m = parsed.pathname.match(/\/story\/([^\/?#]+)/i);
    if (m?.[1]) return decodeURIComponent(m[1]).trim();
  } catch {
    const cleaned = u.replace(/^https?:\/\/[^/]+/i, "");
    const m = cleaned.match(/\/story\/([^\/?#]+)/i);
    if (m?.[1]) return decodeURIComponent(m[1]).trim();
  }
  return "";
}

async function canonAuthorSlug(v: string): Promise<string> {
  const raw = s(v);
  if (!raw) return "";
  return canonicalizeSlug(raw);
}

/**
 * ✅ Normalize one story row.
 * This function is now aligned to Clean Map Data headers:
 * - story slug lives in "storySlug" (or can be extracted from "Story URL")
 * - media lives in "mediaUrl"
 * - quote attribution lives in "Quote Attribution"
 *
 * It NEVER returns null if it can infer at least a slug or a title.
 */
export async function normalizeStoryRow(
  row: Record<string, unknown>
): Promise<StoryRow> {
  const { get } = makeGetter(row);

  // ---- derive core identity ----
  const title = get("Title", "title");

  const storySlug = get("storySlug", "story slug");
  const storyUrl = get("Story URL", "story url");
  const slugFromUrl = extractSlugFromStoryUrl(storyUrl);

  // Normalize output slug to the route slug
  const slug = storySlug || slugFromUrl || get("slug"); // optional, in case something upstream still uses it

  // If both are missing, do not “skip” — synthesize something stable.
  // (This prevents 404s when upstream matching succeeded but fields are missing.)
  const safeSlug =
    slug ||
    (title
      ? title
          .toLowerCase()
          .trim()
          .replace(/['"]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
      : "story");

  const safeTitle = title || safeSlug;

  // ---- authorSlug canonicalization ----
  const authorSlugRaw = get("authorSlug", "author slug");
  const authorSlug = await canonAuthorSlug(authorSlugRaw);

  // ---- map exact headers to normalized StoryRow keys ----
  return {
    title: safeTitle,
    slug: safeSlug,

    program: get("Program", "program"),

    // ✅ support BOTH sheet headers and already-normalized keys
    location: get("Location Name", "location name", "location", "Location"),
    latitude: get("Latitude", "latitude", "lat"),
    longitude: get("Longitude", "longitude", "lng"),
    year: get("Year(s)", "year(s)", "years", "year", "Year"),
    partners: get("Partners", "partners"),

    // Full body first, then teaser
    story: get(
      "Full Story",
      "full story",
      "Story",
      "story",
      "Short Story",
      "short story",
    ),
    quote: get("Quote", "quote"),

    // ✅ your data sometimes calls this quoteAuthor; sheet calls it Quote Attribution
    quoteAuthor: get(
      "Quote Attribution",
      "quote attribution",
      "Quote Author",
      "quote author",
      "quoteAuthor",
      "QuoteAuthor",
    ),

    // ✅ accept both new (mediaUrl) and legacy/drift (Image URL / imageUrl)
    imageUrl: forceHttps(
      get(
        "mediaUrl",
        "media url",
        "Image URL",
        "image url",
        "imageUrl",
        "ImageUrl",
      ),
    ),


    author: get("Author", "author"),
    authorSlug,

    moreInfoLink: forceHttps(
      get("More Info Link", "more info link", "moreInfoLink", "MoreInfoLink"),
    ),

    country: get("Country", "country"),
    regionTag: get("Region Tag", "region tag"),
    category: get("Category", "category"),
    showOnMap: get("Show on Map?", "show on map?"),

    // keep these in case client expects them
    storyUrl: forceHttps(storyUrl),
    storyId: get("storyKey", "story key"), // closest stable key now
  } as any;
}
