// lib/fetchStories.ts
import "server-only";

import Papa from "papaparse";
import { normalizeStoryRow } from "./normalizeStoryRow";
import { StoryRow } from "./types";
import { loadCsv } from "./loadCsv";
import { serverDebug, serverWarn, serverError } from "@/lib/serverDebug";
import { csvUrls } from "@/lib/csvUrls";

const DEBUG = process.env.SHOW_DAT_DEBUG === "true";

// ✅ Use code-based URL (avoids Lambda env 4KB limit)
const CSV_URL = csvUrls.cleanMapData;

const FALLBACK_FILENAME = "Clean Map Data.csv";

export async function fetchStories(): Promise<StoryRow[]> {
  try {
    const csvText = await loadCsv(CSV_URL, FALLBACK_FILENAME);

    // ✅ Clean Map Data exports often start with a comma-only “ARRAYFORMULA” junk row.
    // PapaParse (header:true) will treat that as the header row unless we strip it.
    function isCommaOnlyLine(line: string): boolean {
      const s = String(line || "").trim();
      if (!s) return true;
      return s.replace(/[, \t]/g, "") === "";
    }

    function stripLeadingJunk(csv: string): string {
      const lines = String(csv || "").split(/\r?\n/);
      let start = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = String(lines[i] ?? "").replace(/^\uFEFF/, "").trim();
        if (!line) continue;
        if (isCommaOnlyLine(line)) continue;

        // First meaningful line is our true header row
        start = i;
        break;
      }

      return lines.slice(start).join("\n");
    }

    const cleanedCsvText = stripLeadingJunk(csvText);

    const { data, errors } = Papa.parse<Record<string, string>>(cleanedCsvText, {
      header: true,
      skipEmptyLines: true,
    });

    if (DEBUG) {
      serverDebug("🧪 [fetchStories] CSV source:", "csvUrls.cleanMapData");
      serverDebug("🔍 [fetchStories] First row of CSV:", data?.[0]);
    }

    if (errors?.length) {
      serverWarn("⚠️ [fetchStories] CSV parse warnings:", errors);
    }

    // ✅ CRITICAL: normalizeStoryRow is async now
    const normalizedAll = await Promise.all((data || []).map((row) => normalizeStoryRow(row)));

    const normalized = normalizedAll.filter((row): row is StoryRow => !!row);

    if (normalized.length === 0) {
      serverWarn("🚨 [fetchStories] No stories found — check CSV or normalizeStoryRow()");
    }

    if (DEBUG) {
      serverDebug("✅ [fetchStories] Parsed story count:", normalized.length);
      serverDebug(
        "🧪 [fetchStories] authorSlug sample:",
        normalized.slice(0, 8).map((r: any) => (r as any)?.authorSlug)
      );
    }

    return normalized;
  } catch (err) {
    serverError("❌ [fetchStories] Failed to load stories:", err);
    return [];
  }
}