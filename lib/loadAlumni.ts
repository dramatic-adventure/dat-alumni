// lib/loadAlumni.ts
export {}; // ensures ES module scope

import Papa from "papaparse";
import { cache } from "react";
import { AlumniRow } from "./types";
import { normalizeAlumniRow } from "./normalizeAlumniRow";
import { loadCsv } from "./loadCsv";

const DEBUG = process.env.SHOW_DAT_DEBUG === "true";

function isMostlyEmpty(row: Record<string, string>): boolean {
  const relevantFields = [
    "Name",
    "Role",
    "Location",
    "Headshot URL",
    "Identity Tags",
    "Project Badges",
    "slug",
  ];

  return relevantFields.filter((field) => row[field]?.trim()).length < 2;
}

export const loadAlumni = cache(async (): Promise<AlumniRow[]> => {
  try {
    const csvText = await loadCsv(process.env.ALUMNI_CSV_URL, "alumni.csv");
    const parsed = Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    const rows: AlumniRow[] = [];
    let skipped = 0;

    for (const raw of parsed.data) {
      const name = raw["Name"]?.trim();
      const slug = raw["slug"]?.trim();
      const show = raw["Show on Profile?"]?.trim().toLowerCase();

      if (show !== "yes" || (!slug && !name) || isMostlyEmpty(raw)) {
        skipped++;
        continue;
      }

      const normalized = normalizeAlumniRow(raw);
      if (normalized) rows.push(normalized);
      else skipped++;
    }

    if (DEBUG) {
      console.log(`✅ [loadAlumni] Loaded ${rows.length} alumni`);
      console.log(`⚠️ [loadAlumni] Skipped ${skipped} incomplete rows`);
    }

    return rows;
  } catch (err) {
    console.error("❌ [loadAlumni] Error loading alumni rows:", err);
    return [];
  }
});

export async function loadVisibleAlumni(): Promise<AlumniRow[]> {
  const all = await loadAlumni();
  const visible = all.filter(
    (a) => a.showOnProfile?.toLowerCase().trim() === "yes" && !!a.name?.trim()
  );

  if (DEBUG) {
    console.log("👀 [loadVisibleAlumni] Visible alumni:", visible.map((a) => a.slug));
  }

  return visible;
}

export const loadAlumniBySlug = cache(async (slug: string): Promise<AlumniRow | null> => {
  const all = await loadAlumni();
  return all.find((a) => a.slug?.toLowerCase() === slug.toLowerCase()) || null;
});
