import fs from "fs/promises";
import path from "path";

const LIVE_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQzkIPStlL2TU7AHySD3Kw9CqBFTi1q6QW7N99ivE3FpofNhHlwWejU0LXeMOmnTawtmLCT71KWMU-F/pub?gid=1202839730&single=true&output=csv";

const FALLBACK_PATH = path.join(process.cwd(), "public", "fallback", "alumni.csv");

export async function loadCsv(): Promise<string> {
  // 1️⃣ Try reading local fallback file first (for dev speed)
  try {
    console.log("⚡️ [loadCsv] Reading local fallback CSV");
    return await fs.readFile(FALLBACK_PATH, "utf-8");
  } catch {
    console.warn("⚠️ [loadCsv] No local fallback, trying to fetch live CSV");
  }

  // 2️⃣ If no fallback, fetch live from Google
  try {
    const response = await fetch(LIVE_URL, {
      headers: { "User-Agent": "Mozilla/5.0" },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
    }

    const csvText = await response.text();

    // Save live response to fallback file for future loads
    await fs.mkdir(path.dirname(FALLBACK_PATH), { recursive: true });
    await fs.writeFile(FALLBACK_PATH, csvText, "utf-8");

    console.log("✅ [loadCsv] Fetched live CSV and saved fallback");
    return csvText;
  } catch (err) {
    const error = err as Error;
    console.error("❌ [loadCsv] Live fetch failed:", error.message);

    // Final fallback if everything else fails
    try {
      console.log("🔁 [loadCsv] Retrying local fallback as last resort");
      return await fs.readFile(FALLBACK_PATH, "utf-8");
    } catch {
      throw new Error("❌ Could not load CSV from network or local fallback.");
    }
  }
}
