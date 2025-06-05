import Papa from "papaparse";
import { normalizeStoryRow } from "./normalizeStoryRow";
import { StoryRow } from "./types";

const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/REPLACE_ME/pub?output=csv";

export async function fetchStories(): Promise<StoryRow[]> {
  try {
    const res = await fetch(SHEET_URL, {
      headers: { "User-Agent": "Mozilla/5.0" },
      cache: "no-store", // Always fetch fresh stories
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch stories: ${res.status} ${res.statusText}`);
    }

    const csvText = await res.text();

    const { data, errors } = Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    if (errors.length > 0) {
      console.warn("⚠️ CSV Parse Warnings:", errors);
    }

    return data
      .map(normalizeStoryRow)
      .filter((row): row is StoryRow => !!row);
  } catch (err) {
    console.error("❌ fetchStories error:", err);
    throw err;
  }
}
