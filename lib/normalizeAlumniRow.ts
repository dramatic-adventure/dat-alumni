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
  // 🧼 Trim all keys and values, force lowercase keys
  const cleanedRow: Record<string, string> = Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      key.trim().toLowerCase(),
      value?.toString().trim() ?? "",
    ])
  );

  // 🧪 DEBUG: Show key/value pair if this is a watched profile
  if (cleanedRow["slug"] === "isabel-martinez") {
    console.log("🧪 Cleaned row for Isabel:", cleanedRow);
    console.log("📍 Cleaned location:", cleanedRow["location"]);
  }

  // 🚫 Skip rows with missing or mostly empty essential fields
  const essentialFields = ["name", "slug", "headshot url", "location"];
  const isMostlyEmpty = essentialFields.filter((key) => cleanedRow[key])?.length < 2;

  if (!cleanedRow["slug"] || !cleanedRow["name"] || isMostlyEmpty) {
    if (DEBUG || cleanedRow["slug"] === "isabel-martinez") {
      console.warn("⚠️ Skipping alumni row:", cleanedRow);
    }
    return null;
  }

  // 📍 Coordinates and location label
  const lat = parseFloat(cleanedRow["latitude"]);
  const lng = parseFloat(cleanedRow["longitude"]);
  const hasCoordinates = !isNaN(lat) && !isNaN(lng);
  const locations = hasCoordinates
    ? [{ lat, lng, label: cleanedRow["location"] }]
    : [];

  // ✅ Final normalized row
  return {
    slug: cleanedRow["slug"],
    name: cleanedRow["name"],
    role: cleanedRow["role"] || "",
    location: cleanedRow["location"],
    locations,
    latitude: cleanedRow["latitude"] || "",
    longitude: cleanedRow["longitude"] || "",
    identityTags: cleanArray(cleanedRow["identity tags"]),
    programBadges: cleanArray(cleanedRow["project badges"]),
    headshotUrl: forceHttps(cleanedRow["headshot url"]),
    imageUrls: cleanArray(cleanedRow["gallery image urls"]).map(forceHttps),
    artistStatement: cleanedRow["artist statement"] || "",
    currentWork: cleanedRow["current work"] || "",
    legacyProductions: cleanedRow["legacy productions"] || "",
    storyTitle: cleanedRow["story title"] || "",
    storyThumbnail: forceHttps(cleanedRow["story thumbnail"]),
    storyExcerpt: cleanedRow["story excerpt"] || "",
    storyUrl: forceHttps(cleanedRow["story url"]),
    tags: cleanArray(cleanedRow["tags"]),
    artistUrl: forceHttps(cleanedRow["artist url"]),
    socialLinks: cleanArray(cleanedRow["artist social links"]).map(forceHttps),
    artistEmail: cleanedRow["artist email"] || "",
    updateLink: cleanedRow["update link"] || "",
    showOnProfile: cleanedRow["show on profile?"] || "",
    profileId: cleanedRow["profile id"] || "",
    profileUrl: forceHttps(cleanedRow["profile url"]),
    backgroundChoice: cleanedRow["background choice"] || "kraft",
  };
}
