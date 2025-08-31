export {}; // Ensures ES module scope

import Papa from "papaparse";
import { cache } from "react";
import { AlumniRow } from "./types";
import { normalizeAlumniRow } from "./normalizeAlumniRow";
import { loadCsv } from "./loadCsv";

const DEBUG = process.env.SHOW_DAT_DEBUG === "true";

// ✅ Pick correct env variable
const csvUrl =
  process.env.ALUMNI_CSV_URL || process.env.NEXT_PUBLIC_ALUMNI_CSV_URL;

if (DEBUG) {
  console.log("🔍 ALUMNI_CSV_URL in process.env:", process.env.ALUMNI_CSV_URL);
  console.log("🔍 NEXT_PUBLIC_ALUMNI_CSV_URL in process.env:", process.env.NEXT_PUBLIC_ALUMNI_CSV_URL);
  console.log("✅ Using CSV URL:", csvUrl || "❌ NONE FOUND");
}

function isMostlyEmpty(row: Record<string, string>): boolean {
  const relevantFields = [
    "name",
    "role",
    "location",
    "headshot url",
    "identity tags",
    "project badges",
    "slug",
  ];
  return relevantFields.filter((field) => row[field]?.trim()).length < 2;
}

let alumniCache: AlumniRow[] = []; // ✅ Local in-memory cache

/**
 * ✅ Loads and normalizes all alumni from CSV
 */
export const loadAlumni = cache(async (): Promise<AlumniRow[]> => {
  if (alumniCache.length) {
    if (DEBUG) console.log("⚡ Returning cached alumni:", alumniCache.length);
    return alumniCache;
  }

  if (!csvUrl) {
    console.error("❌ [loadAlumni] Missing ALUMNI_CSV_URL or NEXT_PUBLIC_ALUMNI_CSV_URL in env");
    return [];
  }

  try {
    if (DEBUG) console.log("🌐 [loadCsv] Fetching:", csvUrl);
    const csvText = await loadCsv(csvUrl, "alumni.csv");

    if (DEBUG) console.log("📄 [loadAlumni] Raw CSV snippet:", csvText.slice(0, 300));

    const parsed = Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    const rows: AlumniRow[] = [];
    let skipped = 0;

    for (const raw of parsed.data) {
      const normalizedKeys = Object.fromEntries(
        Object.entries(raw).map(([key, value]) => [
          key.trim().toLowerCase(),
          value?.toString().trim() ?? "",
        ])
      );

      const show = normalizedKeys["show on profile?"]?.toLowerCase();
      const name = normalizedKeys["name"];
      const slug = normalizedKeys["slug"];

      if (!["yes", "y", "✓"].includes(show) || (!slug && !name) || isMostlyEmpty(normalizedKeys)) {
        skipped++;
        continue;
      }

      const normalized = normalizeAlumniRow(normalizedKeys);
      if (normalized) rows.push(normalized);
      else skipped++;
    }

    alumniCache = rows;

    if (DEBUG) {
      console.log(`✅ [loadAlumni] Loaded ${rows.length} alumni, skipped ${skipped}`);
    }

    return rows;
  } catch (err) {
    console.error("❌ [loadAlumni] Failed to load alumni:", err);
    return [];
  }
});

/**
 * ✅ Returns only alumni flagged for display
 */
export const loadVisibleAlumni = cache(async (): Promise<AlumniRow[]> => {
  const all = await loadAlumni();
  return all.filter((a) => a.showOnProfile?.toLowerCase().trim() === "yes" && !!a.name?.trim());
});

/**
 * ✅ Returns a single alumni by slug
 */
export const loadAlumniBySlug = cache(async (slug: string): Promise<AlumniRow | null> => {
  const all = await loadAlumni();
  return all.find((a) => a.slug?.toLowerCase() === slug.toLowerCase()) || null;
});

/**
 * ✅ Returns alumni for a specific season
 */
export const loadAlumniBySeason = cache(async (season: number): Promise<AlumniRow[]> => {
  const all = await loadAlumni();
  return all.filter((a) => {
    const badges = a.programBadges || [];
    return badges.some((badge) => badge.toLowerCase().includes(`season ${season}`));
  });
});
