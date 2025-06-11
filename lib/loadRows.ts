import Papa from "papaparse";
import { cache } from "react";
import { loadCsv } from "./loadCsv";
import { normalizeStoryRow } from "./normalizeStoryRow";
import { StoryRow } from "./types";

// ✅ Define loadRows first
const loadRows = cache(async (): Promise<StoryRow[]> => {
  try {
    const csvText = await loadCsv();

    const parsed = Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    console.log("✅ Parsed CSV row count:", parsed.data.length);

    return parsed.data
      .map(normalizeStoryRow)
      .filter((row): row is StoryRow => !!row);
  } catch (err) {
    console.error("❌ Error loading rows:", err);
    return [];
  }
});

// ✅ Default export for general use
export default loadRows;

export async function getStoriesByAlumniSlug(slug: string): Promise<StoryRow[]> {
  const rows = await loadRows();
  return rows.filter((row) => row.authorSlug === slug);
}
