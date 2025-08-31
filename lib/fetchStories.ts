import fs from "fs/promises";
import path from "path";
import Papa from "papaparse";
import { normalizeStoryRow } from "./normalizeStoryRow";
import { StoryRow } from "./types";
import { loadCsv } from "./loadCsv";

const DEBUG = process.env.SHOW_DAT_DEBUG === "true";
const CSV_URL = process.env.STORY_MAP_CSV_URL;
const FALLBACK_FILENAME = "story-map.csv";

export async function fetchStories(): Promise<StoryRow[]> {
  try {
    const csvText = await loadCsv(CSV_URL, FALLBACK_FILENAME);

    const { data, errors } = Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    if (DEBUG) {
      console.log("🧪 [fetchStories] CSV source:", CSV_URL || FALLBACK_FILENAME);
      console.log("🔍 First row of CSV:", data[0]);
    }

    if (errors.length > 0) {
      console.warn("⚠️ [fetchStories] CSV parse warnings:", errors);
    }

    const normalized = data
      .map(normalizeStoryRow)
      .filter((row): row is StoryRow => !!row);

    if (normalized.length === 0) {
      console.warn("🚨 No stories found — check CSV or normalizeStoryRow()");
    }

    if (DEBUG) {
      console.log("✅ [fetchStories] Parsed story count:", normalized.length);
    }

    return normalized;
  } catch (err) {
    console.error("❌ [fetchStories] Failed to load stories:", err);
    return [];
  }
}
