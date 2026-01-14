export {}; // forces the file to be treated as a module

import { StoryRow } from "./types";
import { canonicalizeSlug } from "@/lib/slugAliases";

const DEBUG = process.env.SHOW_DAT_DEBUG === "true";

// 🔧 Force all URLs to use HTTPS for consistency
function forceHttps(url: string | undefined): string | undefined {
  if (!url) return undefined;
  const u = url.trim();
  if (!u) return undefined;
  return u.startsWith("http://") ? u.replace("http://", "https://") : u;
}

function cleanStr(v?: string | null): string {
  return (v ?? "").trim();
}

async function canonAuthorSlug(v?: string | null): Promise<string> {
  const raw = cleanStr(v);
  if (!raw) return "";
  return canonicalizeSlug(raw);
}

// ✅ Normalize one story row
export async function normalizeStoryRow(
  row: Record<string, string>,
): Promise<StoryRow | null> {
  if (!row["slug"] || !row["Title"]) {
    if (DEBUG) {
      // eslint-disable-next-line no-console
      console.warn("⚠️ Skipping row due to missing slug or title:", row);
    }
    return null;
  }

  // 🧼 Normalize keys and values (trim whitespace)
  const cleanedRow: Record<string, string> = Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key.trim(), (value ?? "").trim()]),
  );

  // Support either "authorSlug" or "Author Slug" (Sheets column drift)
  const authorSlugRaw =
    cleanedRow["authorSlug"] ||
    cleanedRow["Author Slug"] ||
    cleanedRow["AuthorSlug"] ||
    "";

  const authorSlug = await canonAuthorSlug(authorSlugRaw);

  return {
    title: cleanedRow["Title"] || "",
    slug: cleanedRow["slug"] || "",
    program: cleanedRow["Program"] || "",
    location: cleanedRow["Location Name"] || "",
    latitude: cleanedRow["Latitude"] || "",
    longitude: cleanedRow["Longitude"] || "",
    year: cleanedRow["Year(s)"] || "",
    partners: cleanedRow["Partners"] || "",
    story: cleanedRow["Short Story"] || "",
    quote: cleanedRow["Quote"] || "",
    quoteAuthor: cleanedRow["Quote Author"] || "",
    imageUrl: forceHttps(cleanedRow["Image URL"]),
    author: cleanedRow["Author"] || "",
    authorSlug,
    moreInfoLink: forceHttps(cleanedRow["More Info Link"]),
    country: cleanedRow["Country"] || "",
    regionTag: cleanedRow["Region Tag"] || "",
    category: cleanedRow["Category"] || "",
    showOnMap: cleanedRow["Show on Map?"] || "",
    storyId: cleanedRow["Story ID"] || "",
    storyUrl: forceHttps(cleanedRow["Story URL"]),
  };
}
