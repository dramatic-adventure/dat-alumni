export {}; // forces the file to be treated as a module

import { StoryRow } from "./types";

const DEBUG = process.env.SHOW_DAT_DEBUG === "true";

export function normalizeStoryRow(row: Record<string, string>): StoryRow | null {
  if (!row["slug"] || !row["Title"]) {
    if (DEBUG) {
      console.warn("⚠️ Skipping row due to missing slug or title:", row);
    }
    return null;
  }

  // 🧼 Normalize all keys to trim whitespace and standardize access
  const cleanedRow = Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key.trim(), value])
  );

  return {
    title: cleanedRow["Title"]?.trim() || "",
    slug: cleanedRow["slug"]?.trim() || "",
    program: cleanedRow["Program"]?.trim(),
    location: cleanedRow["Location Name"]?.trim(),
    latitude: cleanedRow["Latitude"]?.trim(),
    longitude: cleanedRow["Longitude"]?.trim(),
    year: cleanedRow["Year(s)"]?.trim(),
    partners: cleanedRow["Partners"]?.trim(),
    story: cleanedRow["Short Story"]?.trim(),
    quote: cleanedRow["Quote"]?.trim(),
    quoteAuthor: cleanedRow["Quote Author"]?.trim(),
    imageUrl: cleanedRow["Image URL"]?.trim(),
    author: cleanedRow["Author"]?.trim(),
    authorSlug: cleanedRow["authorSlug"]?.trim(),
    moreInfoLink: cleanedRow["More Info Link"]?.trim(), // ✅ Fixed field reference
    country: cleanedRow["Country"]?.trim(),
    regionTag: cleanedRow["Region Tag"]?.trim(),
    category: cleanedRow["Category"]?.trim(),
    showOnMap: cleanedRow["Show on Map?"]?.trim(),
    storyId: cleanedRow["Story ID"]?.trim(),
    storyUrl: cleanedRow["Story URL"]?.trim(),
  };
}
