export {}; // ensures module scope

import { AlumniRow } from "./types";

const DEBUG = process.env.SHOW_DAT_DEBUG === "true";

// 🔧 Force HTTPS on remote URLs
function forceHttps(url?: string): string {
  return url?.startsWith("http://") ? url.replace("http://", "https://") : url ?? "";
}

// 🔧 Split comma-separated strings into trimmed arrays
const cleanArray = (val?: string): string[] =>
  typeof val === "string"
    ? val.split(",").map((v) => v.trim()).filter(Boolean)
    : [];

// ✅ Normalize one alumni row
export function normalizeAlumniRow(row: Record<string, string>): AlumniRow | null {
  // 🧼 Trim all keys and values
  const cleanedRow: Record<string, string> = Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      key.trim(),
      value?.toString().trim() ?? "",
    ])
  );

  // 🚫 Skip rows with no name or slug or mostly empty content
  const isMostlyEmpty = Object.values(cleanedRow).filter(Boolean).length <= 2;
  if (!cleanedRow["slug"] || !cleanedRow["Name"] || isMostlyEmpty) {
    if (DEBUG) {
      console.warn("⚠️ Skipping alumni row:", cleanedRow);
    }
    return null;
  }

  // 📍 Coordinates and location block
  const lat = parseFloat(cleanedRow["Latitude"]);
  const lng = parseFloat(cleanedRow["Longitude"]);
  const hasCoordinates = !isNaN(lat) && !isNaN(lng);
  const locations = hasCoordinates
    ? [{ lat, lng, label: cleanedRow["Location"] }]
    : [];

  return {
    slug: cleanedRow["slug"] || "",
    name: cleanedRow["Name"] || "",
    role: cleanedRow["Role"] || "",
    location: cleanedRow["Location"] || "",
    latitude: cleanedRow["Latitude"] || "",
    longitude: cleanedRow["Longitude"] || "",
    identityTags: cleanArray(cleanedRow["Identity Tags"]),
    programBadges: cleanArray(cleanedRow["Project Badges"]),
    headshotUrl: forceHttps(cleanedRow["Headshot URL"]),
    imageUrls: cleanArray(cleanedRow["Gallery Image URLs"]).map(forceHttps),
    artistStatement: cleanedRow["Artist Statement"] || "",
    currentWork: cleanedRow["Current Work"] || "",
    legacyProductions: cleanedRow["Legacy Productions"] || "",
    storyTitle: cleanedRow["Story Title"] || "",
    storyThumbnail: forceHttps(cleanedRow["Story Thumbnail"]),
    storyExcerpt: cleanedRow["Story Excerpt"] || "",
    storyUrl: forceHttps(cleanedRow["Story URL"]),
    tags: cleanArray(cleanedRow["Tags"]),
    artistUrl: forceHttps(cleanedRow["Artist URL"]),
    socialLinks: cleanArray(cleanedRow["Artist Social Links"]).map(forceHttps),
    artistEmail: cleanedRow["Artist Email"] || "",
    updateLink: cleanedRow["Update Link"] || "",
    showOnProfile: cleanedRow["Show on Profile?"] || "",
    profileId: cleanedRow["Profile ID"] || "",
    profileUrl: forceHttps(cleanedRow["Profile URL"]),
    backgroundChoice: cleanedRow["Background Choice"] || "kraft",
    locations,
  };
}
