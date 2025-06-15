import fs from "fs/promises";
import path from "path";
import Papa from "papaparse";
import { normalizeStoryRow } from "./normalizeStoryRow";
import { StoryRow } from "./types";

// 🔗 Public Google Sheet CSV export URL
const LIVE_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQzkIPStlL2TU7AHySD3Kw9CqBFTi1q6QW7N99ivE3FpofNhHlwWejU0LXeMOmnTawtmLCT71KWMU-F/pub?gid=582055134&single=true&output=csv";

const FALLBACK_PATH = path.join(process.cwd(), "public", "fallback", "story-map.csv");

export async function fetchStories(): Promise<StoryRow[]> {
  let csvText: string | null = null;

  // 1️⃣ Try reading local fallback file first
  try {
    console.log("⚡️ [fetchStories] Reading local fallback CSV");
    csvText = await fs.readFile(FALLBACK_PATH, "utf-8");
  } catch {
    console.warn("⚠️ [fetchStories] No local fallback found, attempting to fetch live CSV");
  }

  // 2️⃣ If no fallback, fetch from live URL
  if (!csvText) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

      const response = await fetch(LIVE_URL, {
        headers: { "User-Agent": "Mozilla/5.0" },
        cache: "no-store",
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
      }

      csvText = await response.text();

      // Strip BOM if present
      if (csvText.charCodeAt(0) === 0xfeff) {
        csvText = csvText.slice(1);
      }

      // Optional schema check
      if (!csvText.includes("Title") || !csvText.includes("Slug")) {
        throw new Error("CSV schema mismatch: expected columns not found.");
      }

      // Save to fallback
      await fs.mkdir(path.dirname(FALLBACK_PATH), { recursive: true });
      await fs.writeFile(FALLBACK_PATH, csvText, "utf-8");

      console.log("✅ [fetchStories] Fetched live CSV and saved fallback");
    } catch (err) {
      const error = err as Error;
      console.error("❌ [fetchStories] Live fetch failed:", error.message);
      throw new Error("Could not load stories from network or fallback.");
    }
  }

  // 3️⃣ Parse and normalize
  const { data, errors } = Papa.parse<Record<string, string>>(csvText!, {
    header: true,
    skipEmptyLines: true,
  });

  if (errors.length > 0) {
    console.warn("⚠️ [fetchStories] CSV parse warnings:", errors);
  }

  const normalized = data
    .map(normalizeStoryRow)
    .filter((row): row is StoryRow => !!row);

  if (process.env.NODE_ENV === "development") {
    console.log("✅ [fetchStories] Parsed story count:", normalized.length);
  }

  return normalized;
}
