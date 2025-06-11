// lib/normalizeAlumniRow.ts

import { AlumniRow } from "./types";

const DEBUG = process.env.SHOW_DAT_DEBUG === "true";

export function normalizeAlumniRow(row: Record<string, string>): AlumniRow | null {
  // 🚫 Skip empty rows with no slug or name
  if (!row["slug"] || !row["Name"]) {
    // No more logging here — skip silently
return null;
  }

  // 🧼 Clean keys and values
  const cleanedRow = Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key.trim(), value?.trim() ?? ""])
  );

  const cleanArray = (val?: string): string[] =>
    val?.split(",").map((v) => v.trim()).filter(Boolean) || [];

  // 📍 Location handling
  const lat = parseFloat(cleanedRow["Latitude"] || "");
  const lng = parseFloat(cleanedRow["Longitude"] || "");
  const hasCoordinates = !isNaN(lat) && !isNaN(lng);

  const locations = hasCoordinates
    ? [{ lat, lng, label: cleanedRow["Location"] }]
    : [];

  return {
    slug: cleanedRow["slug"],
    name: cleanedRow["Name"],
    role: cleanedRow["Role"],
    location: cleanedRow["Location"],
    latitude: cleanedRow["Latitude"],
    longitude: cleanedRow["Longitude"],
    identityTags: cleanArray(cleanedRow["Identity Tags"]),
    programBadges: cleanArray(cleanedRow["Project Badges"]),
    headshotUrl: cleanedRow["Headshot URL"],
    imageUrls: cleanArray(cleanedRow["Gallery Image URLs"]),
    artistStatement: cleanedRow["Artist Statement"],
    currentWork: cleanedRow["Current Work"],
    legacyProductions: cleanedRow["Legacy Productions"],
    storyTitle: cleanedRow["Story Title"],
    storyThumbnail: cleanedRow["Story Thumbnail"],
    storyExcerpt: cleanedRow["Story Excerpt"],
    storyUrl: cleanedRow["Story URL"],
    tags: cleanArray(cleanedRow["Tags"]),
    artistUrl: cleanedRow["Artist URL"],
    socialLinks: cleanArray(cleanedRow["Artist Social Links"]),
    artistEmail: cleanedRow["Artist Email"],
    updateLink: cleanedRow["Update Link"],
    showOnProfile: cleanedRow["Show on Profile?"],
    profileId: cleanedRow["Profile ID"],
    profileUrl: cleanedRow["Profile URL"],
    locations,
  };
}
