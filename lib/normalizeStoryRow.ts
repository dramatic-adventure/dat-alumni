export {}; // forces the file to be treated as a module

import { StoryRow } from "./types";

const DEBUG = process.env.SHOW_DAT_DEBUG === "true";

// 🔧 Force all URLs to use HTTPS for consistency
function forceHttps(url: string | undefined): string | undefined {
  if (!url) return undefined;
  return url.startsWith("http://") ? url.replace("http://", "https://") : url;
}

// ✅ Normalize one story row
export function normalizeStoryRow(row: Record<string, string>): StoryRow | null {
  if (!row["slug"] || !row["Title"]) {
    if (DEBUG) {
      console.warn("⚠️ Skipping row due to missing slug or title:", row);
    }
    return null;
  }

  // 🧼 Normalize keys and values (trim whitespace)
  const cleanedRow: Record<string, string> = Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key.trim(), value.trim()])
  );

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
    authorSlug: cleanedRow["authorSlug"] || "",
    moreInfoLink: forceHttps(cleanedRow["More Info Link"]),
    country: cleanedRow["Country"] || "",
    regionTag: cleanedRow["Region Tag"] || "",
    category: cleanedRow["Category"] || "",
    showOnMap: cleanedRow["Show on Map?"] || "",
    storyId: cleanedRow["Story ID"] || "",
    storyUrl: forceHttps(cleanedRow["Story URL"]),
  };
}
