"use server";

import axios from "axios";

const DEBUG = process.env.SHOW_DAT_DEBUG === "true";

/**
 * Load a CSV from a live URL or local fallback.
 * @param sourceUrl Optional URL (from env var)
 * @param fallbackFileName Optional fallback CSV file (e.g., "alumni.csv")
 */
export async function loadCsv(sourceUrl?: string, fallbackFileName = "alumni.csv"): Promise<string> {
  // ✅ Dynamically import fs & path ONLY when needed
  const fs = await import("fs/promises");
  const path = await import("path");

  const fallbackPath = path.join(process.cwd(), "public", "fallback", fallbackFileName);

  // 1️⃣ Try live fetch first if sourceUrl is provided
  if (sourceUrl) {
    try {
      if (DEBUG) console.log("🌐 [loadCsv] Trying live fetch:", sourceUrl);

      const response = await axios.get(sourceUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0",
          Accept: "text/csv",
          Referer: "https://docs.google.com/",
        },
        timeout: 8000,
      });

      let csvText: string = response.data;

      // Remove BOM if present
      if (csvText.charCodeAt(0) === 0xfeff) {
        csvText = csvText.slice(1);
      }

      // ✅ Save fallback copy
      await fs.mkdir(path.dirname(fallbackPath), { recursive: true });
      await fs.writeFile(fallbackPath, csvText, "utf-8");

      if (DEBUG) console.log("✅ [loadCsv] Live fetch succeeded & fallback updated:", fallbackFileName);
      return csvText;
    } catch (err) {
      console.error("⚠️ [loadCsv] Live fetch failed:", (err as Error).message);
    }
  }

  // 2️⃣ Fallback to local file
  try {
    if (DEBUG) console.log("📂 [loadCsv] Using fallback:", fallbackFileName);
    const csvText = await fs.readFile(fallbackPath, "utf-8");
    return csvText;
  } catch {
    throw new Error(`❌ No CSV content found from URL or fallback: ${fallbackFileName}`);
  }
}
