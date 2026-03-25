// lib/fetchUpdates.ts

import { parse } from "csv-parse/sync";
import { normalizeUpdateRow } from "./normalizeUpdateRow";
import { Update } from "./types";
import { loadCsv } from "./loadCsv";
import { serverDebug, serverInfo, serverWarn, serverError } from "@/lib/serverDebug";

const DEBUG = process.env.SHOW_DAT_DEBUG === "true";
const CSV_URL = process.env.JOURNEY_UPDATES_CSV_URL;
const FALLBACK_FILENAME = "journey-updates.csv"; // or whatever your file is called

export async function fetchUpdates(): Promise<Update[]> {
  try {
    const csvText = await loadCsv(CSV_URL, FALLBACK_FILENAME);

    if (DEBUG) {
      serverDebug("📄 CSV TEXT (first 500 chars):", csvText.slice(0, 500));
    }

    const rawRecords = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
    });

    const updates: Update[] = rawRecords
      .map((row: Record<string, string>) => normalizeUpdateRow(row))
      .filter((u: Update | null): u is Update => u !== null);

    updates.sort((a, b) => b.sortDate.localeCompare(a.sortDate));

    if (DEBUG) {
      serverDebug("🧪 [fetchUpdates] CSV source:", CSV_URL || FALLBACK_FILENAME);
      serverDebug("🔍 First update row:", updates[0]);
      serverDebug("✅ [fetchUpdates] Parsed update count:", updates.length);
    }

    return updates;
  } catch (err) {
    serverError("❌ [fetchUpdates] Failed to load journey updates:", err);
    return [];
  }
}
