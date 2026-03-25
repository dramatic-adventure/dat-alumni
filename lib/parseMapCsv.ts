import { parse } from "csv-parse/sync";
import { Update } from "./types";

/**
 * Parses the Story Map CSV into Update objects with only Story Map–related fields.
 */
export function parseMapCsv(csvText: string): Update[] {
  const records = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
  });

  return records.map((row: Record<string, string>): Update => {
    const cleanedRow: Record<string, string> = Object.fromEntries(
      Object.entries(row).map(([key, value]) => [key.trim(), value.trim()])
    );

    const mediaUrls = (cleanedRow["storyMapImageMedia"] || "")
      .split(",")
      .map((url) => url.trim())
      .filter(Boolean)
      .join(",");

    return {
      profileSlug: cleanedRow["storyMapAuthorSlug"]?.toLowerCase() || "",
      category: "Story Map",
      title: cleanedRow["storyMapTitle"] || "",
      subtitle: "",
      location: cleanedRow["storyMapLocationName"] || "",
      eventDate: "",
      bodyNote: cleanedRow["storyMapShortStory"] || "",
      mediaUrls,
      mediaType: "image",
      ctaText: "Read More",
      ctaUrl: cleanedRow["storyMapMoreInfoLink"] || "",
      tags: [],
      evergreen: true,
      expirationDate: "",
      featured: false,
      sortDate: "",
      updateId: cleanedRow["storyMapUrl"] || crypto.randomUUID(),
      lastModified: null,
      body: cleanedRow["storyMapShortStory"] || "",
      ctaLink: cleanedRow["storyMapMoreInfoLink"] || "",

      // Story Map–specific fields
      storyMapEligible: true,
      storyMapTitle: cleanedRow["storyMapTitle"] || "",
      storyMapProgram: cleanedRow["storyMapProgram"] || "",
      storyMapProgramYear: cleanedRow["storyMapProgramYear"] || "",
      storyMapLocationName: cleanedRow["storyMapLocationName"] || "",
      storyMapPartners: cleanedRow["storyMapPartners"] || "",
      storyMapQuote: cleanedRow["storyMapQuote"] || "",
      storyMapQuoteAuthor: cleanedRow["storyMapQuoteAuthor"] || "",
      storyMapShortStory: cleanedRow["storyMapShortStory"] || "",
      storyMapImageMedia: mediaUrls.split(",")[0] || "",
      storyMapUrl: cleanedRow["storyMapUrl"] || "",
      storyMapAuthor: cleanedRow["storyMapAuthor"] || "",
      storyMapAuthorSlug: cleanedRow["storyMapAuthorSlug"]?.toLowerCase() || "",
      storyMapMoreInfoLink: cleanedRow["storyMapMoreInfoLink"] || "",
      storyMapCountry: cleanedRow["storyMapCountry"] || "",
    };
  });
}
