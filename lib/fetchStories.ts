// lib/fetchStories.ts
export {}; // ensures module scope

import Papa from "papaparse";
import { cache } from "react";
import { normalizeStoryRow } from "./normalizeStoryRow";
import { StoryRow } from "./types";
import { loadCsv } from "./loadCsv";

const DEBUG = process.env.SHOW_DAT_DEBUG === "true";

export const fetchStories = cache(async (): Promise<StoryRow[]> => {
  try {
    const csvSource =
      process.env.STORY_MAP_CSV_URL ||
      "public/fallback/story-map.csv";

    if (DEBUG) console.log("📥 [fetchStories] Using CSV source:", csvSource);

    const csvText = await loadCsv(csvSource);
    const { data, errors } = Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    if (errors.length > 0) {
      console.warn("⚠️ [fetchStories] CSV parse warnings:", errors);
    }

    const stories = data
      .map(normalizeStoryRow)
      .filter((row): row is StoryRow => !!row);

    if (DEBUG) {
      console.log("✅ Parsed story count:", stories.length);
    }

    return stories;
  } catch (err) {
    console.error("❌ [fetchStories] Failed to load story rows:", err);
    return [];
  }
});
