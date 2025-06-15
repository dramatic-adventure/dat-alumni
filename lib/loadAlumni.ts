export {}; // ensures ES module scope

import path from "path";
import Papa from "papaparse";
import { cache } from "react";
import { AlumniRow } from "./types";
import { normalizeAlumniRow } from "./normalizeAlumniRow";
import { loadCsv } from "./loadCsv";

const DEBUG = process.env.SHOW_DAT_DEBUG === "true";

// ✅ Only check meaningful fields to avoid false skips
function isMostlyEmpty(row: Record<string, string>): boolean {
  const relevantFields = [
    "Name",
    "Role",
    "Headshot URL",
    "Identity Tags",
    "Project Badges",
    "slug",
  ];

  let nonEmptyCount = 0;

  for (const field of relevantFields) {
    const value = row[field];
    if (value && value.trim() !== "") {
      nonEmptyCount++;
    }
  }

  return nonEmptyCount < 2;
}

export const loadAlumni = cache(async (): Promise<AlumniRow[]> => {
  try {
    const fallbackPath = path.join(process.cwd(), "public", "fallback", "alumni.csv");
    const csvUrl = process.env.ALUMNI_CSV_URL || fallbackPath;

    if (DEBUG) console.log("📥 [loadAlumni] Using CSV source:", csvUrl);

    const csvText = await loadCsv(csvUrl);

    const parsed = Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    const rows: AlumniRow[] = [];
    let skipped = 0;

    if (DEBUG && parsed.data.length > 0) {
      console.log("🧪 Sample parsed row keys:", Object.keys(parsed.data[0]));
    }

    for (const raw of parsed.data) {
      const name = raw["Name"]?.trim();
      const slug = raw["slug"]?.trim();
      const show = raw["Show on Profile?"]?.trim().toLowerCase();

      // ✅ Skip if not marked "yes" for profile
      if (show !== "yes") {
        skipped++;
        continue;
      }

      // ✅ Skip if both slug and name are missing
      if (!slug && !name) {
        skipped++;
        continue;
      }

      // ✅ Skip if mostly empty (no meaningful content)
      if (isMostlyEmpty(raw)) {
        skipped++;
        continue;
      }

      const normalized = normalizeAlumniRow(raw);
      if (normalized) {
        rows.push(normalized);
      } else {
        skipped++;
      }
    }

    if (DEBUG) {
      console.log(`🧪 Loaded ${rows.length} valid alumni row(s)`);
      console.log(`⚠️ Skipped ${skipped} incomplete or invalid row(s)`);
    }

    return rows;
  } catch (err) {
    console.error("❌ Error loading alumni rows:", err);
    return [];
  }
});

export async function loadVisibleAlumni(): Promise<AlumniRow[]> {
  const all = await loadAlumni();

  const visible = all.filter((a) =>
    a.showOnProfile?.toLowerCase().trim() === "yes" && !!a.name?.trim()
  );

  if (DEBUG) {
    console.log("✅ Visible alumni:", visible.map((a) => a.slug));
  }

  return visible;
}

export async function loadAlumniBySlug(slug: string): Promise<AlumniRow | null> {
  const all = await loadVisibleAlumni();
  return all.find((a) => a.slug === slug) || null;
}
