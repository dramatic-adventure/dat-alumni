import fs from "fs/promises";
import path from "path";
import Papa from "papaparse";
import { normalizeStoryRow } from "./normalizeStoryRow";
import { StoryRow } from "./types";
import { loadCsv } from "./loadCsv";
import { serverDebug, serverInfo, serverWarn, serverError } from "@/lib/serverDebug";

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
      serverDebug("🧪 [fetchStories] CSV source:", CSV_URL || FALLBACK_FILENAME);
      serverDebug("🔍 First row of CSV:", data[0]);
    }

    if (errors.length > 0) {
      serverWarn("⚠️ [fetchStories] CSV parse warnings:", errors);
    }

    const normalized = data
      .map(normalizeStoryRow)
      .filter((row): row is StoryRow => !!row);

    if (normalized.length === 0) {
      serverWarn("🚨 No stories found — check CSV or normalizeStoryRow()");
    }

    if (DEBUG) {
      serverDebug("✅ [fetchStories] Parsed story count:", normalized.length);
    }

    return normalized;
  } catch (err) {
    serverError("❌ [fetchStories] Failed to load stories:", err);
    return [];
  }
}
