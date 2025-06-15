// lib/loadCsv.ts
import fs from "fs/promises";
import path from "path";
import { cache } from "react";

/**
 * Loads a CSV file from a given URL or local path, or uses default sources if none provided.
 * @param source Optional custom URL or file path for loading CSV.
 */
export const loadCsv = cache(async (source?: string): Promise<string> => {
  const LIVE_URL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQzkIPStlL2TU7AHySD3Kw9CqBFTi1q6QW7N99ivE3FpofNhHlwWejU0LXeMOmnTawtmLCT71KWMU-F/pub?gid=1202839730&single=true&output=csv";

  const FALLBACK_PATH = path.join(process.cwd(), "public", "fallback", "alumni.csv");

  // Use defaults if no custom source is provided
  const isCustom = !!source;
  const target = source ?? LIVE_URL;
  const isUrl = target.startsWith("http");

  // 1️⃣ Try reading local file if not a URL
  if (!isUrl) {
    try {
      console.log("📄 [loadCsv] Reading local file:", target);
      return await fs.readFile(target, "utf-8");
    } catch (err) {
      console.warn("⚠️ [loadCsv] Local file read failed:", (err as Error).message);
      throw err;
    }
  }

  // 2️⃣ Try fetching from live URL
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    console.log("🌍 [loadCsv] Fetching from URL:", target);
    const res = await fetch(target, { signal: controller.signal });

    if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);

    const csvText = await res.text();

    // 3️⃣ Save fallback if using default live URL
    if (!isCustom) {
      await fs.mkdir(path.dirname(FALLBACK_PATH), { recursive: true });
      await fs.writeFile(FALLBACK_PATH, csvText, "utf-8");
      console.log("✅ [loadCsv] Saved fallback after live fetch");
    }

    return csvText;
  } catch (err: any) {
    console.error("❌ [loadCsv] Fetch error:", err.message);

    // 4️⃣ Final fallback to local snapshot if default
    if (!isCustom) {
      try {
        console.log("🔁 [loadCsv] Retrying fallback file:", FALLBACK_PATH);
        return await fs.readFile(FALLBACK_PATH, "utf-8");
      } catch {
        throw new Error("❌ Could not load CSV from live or fallback.");
      }
    }

    throw err; // custom source failed — don't fallback
  } finally {
    clearTimeout(timeout);
  }
});
