export {}; // force module

import { Update } from "./types";

const DEBUG = process.env.SHOW_DAT_DEBUG === "true";

// 🔧 Force all URLs to use HTTPS for consistency
function forceHttps(url: string | undefined): string | undefined {
  if (!url) return undefined;
  return url.startsWith("http://") ? url.replace("http://", "https://") : url;
}

// 🧼 Normalize one update row
export function normalizeUpdateRow(row: Record<string, string>): Update | null {
  const hasProfileSlug = !!row["profileSlug"]?.trim();
  const hasAlumName = !!row["alum name"]?.trim();

  if (!hasProfileSlug || !hasAlumName) {
    if (DEBUG) {
      console.warn("⚠️ Skipping update due to missing profileSlug or alum name:", row);
    }
    return null;
  }

  const cleanedRow: Record<string, string> = Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key.trim(), value.trim()])
  );

  const mediaUrls = (cleanedRow["mediaUrls"] || "")
    .split(",")
    .map((url) => forceHttps(url.trim()))
    .filter(Boolean)
    .join(",");

  const tags = (cleanedRow["tags"] || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  return {
    profileSlug: cleanedRow["profileSlug"].toLowerCase(),
    category: cleanedRow["category"] || "DAT Spotlight",
    title: cleanedRow["title"] || "",
    subtitle: cleanedRow["subtitle"] || "",
    location: cleanedRow["location"] || "",
    eventDate: cleanedRow["eventDate"] || "",
    bodyNote: cleanedRow["bodyNote"] || "",
    mediaUrls,
    mediaType: cleanedRow["mediaType"] || "",
    ctaText: cleanedRow["ctaText"] || "",
    ctaUrl: forceHttps(cleanedRow["ctaUrl"]),
    tags,
    evergreen: cleanedRow["evergreen"]?.toLowerCase().startsWith("y") || false,
    expirationDate: cleanedRow["expirationDate"] || "",
    featured: cleanedRow["featured"]?.toLowerCase().startsWith("y") || false,
    sortDate: cleanedRow["sortDate"] || cleanedRow["eventDate"] || "",
    updateId: cleanedRow["updateId"] || "",
    lastModified: cleanedRow["lastModified"]
      ? new Date(cleanedRow["lastModified"])
      : null,

    // 🗺️ Story Map fields
    storyMapEligible: cleanedRow["storyMapEligible"]?.toLowerCase().startsWith("y") || false,
    storyMapTitle: cleanedRow["storyMapTitle"] || cleanedRow["title"] || "",
    storyMapProgram: cleanedRow["storyMapProgram"] || "",
    storyMapProgramYear: cleanedRow["storyMapProgramYear"] || "",
    storyMapLocationName: cleanedRow["storyMapLocationName"] || cleanedRow["location"] || "",
    storyMapPartners: cleanedRow["storyMapPartners"] || "",
    storyMapQuote: cleanedRow["storyMapQuote"] || "",
    storyMapQuoteAuthor: cleanedRow["storyMapQuoteAuthor"] || "",
    storyMapShortStory: cleanedRow["storyMapShortStory"] || cleanedRow["bodyNote"] || "",
    storyMapImageMedia: forceHttps(cleanedRow["storyMapImageMedia"] || mediaUrls.split(",")[0]),
    storyMapUrl: forceHttps(cleanedRow["storyMapUrl"]),
    storyMapAuthor: cleanedRow["storyMapAuthor"] || cleanedRow["alum name"],
    storyMapAuthorSlug: cleanedRow["profileSlug"].toLowerCase(),
    storyMapMoreInfoLink: forceHttps(cleanedRow["storyMapMoreInfoLink"]),
    storyMapCountry: cleanedRow["storyMapCountry"] || "",
  };
}
