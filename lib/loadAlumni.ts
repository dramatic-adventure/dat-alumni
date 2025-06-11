// lib/loadAlumni.ts
export {}; // ensures module scope

import Papa from "papaparse";
import { cache } from "react";
import { AlumniRow } from "./types";
import { normalizeAlumniRow } from "./normalizeAlumniRow";
import { loadCsv } from "./loadCsv"; // ✅ assumes same CSV helper is reused

const DEBUG = process.env.SHOW_DAT_DEBUG === "true";

/**
 * ✅ Loads + normalizes alumni rows from Google Sheet CSV
 * - Uses `cache()` to prevent redundant fetches
 * - Returns *all* valid rows, visible or not (use filtering later)
 */
export const loadAlumni = cache(async (): Promise<AlumniRow[]> => {
  try {
    const csvText = await loadCsv();

    const parsed = Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    const rows: AlumniRow[] = [];
    let skipped = 0;

    for (const raw of parsed.data) {
      const normalized = normalizeAlumniRow(raw);
      if (normalized) {
        rows.push(normalized);
      } else {
        skipped++;
      }
    }

    if (DEBUG) {
      console.log(`🧪 loadAlumni: ${rows.length} valid rows`);
      console.warn(`⚠️ Skipped ${skipped} row(s) due to missing slug or name.`);
    }

    return rows;
  } catch (err) {
    console.error("❌ Error loading alumni rows:", err);
    return [];
  }
});

/**
 * ✅ Get only alumni marked "yes" in `Show on Profile?`
 */
export async function loadVisibleAlumni(): Promise<AlumniRow[]> {
  const all = await loadAlumni();
  return all.filter((a) =>
    a.showOnProfile?.toLowerCase().trim() === "yes" && !!a.name?.trim()
  );
}

/**
 * ✅ Get a single visible row by slug
 */
export async function loadAlumniBySlug(slug: string): Promise<AlumniRow | null> {
  const all = await loadVisibleAlumni();
  return all.find((a) => a.slug === slug) || null;
}
