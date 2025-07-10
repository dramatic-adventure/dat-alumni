export {}; // ensures ES module scope

import Papa from "papaparse";
import { cache } from "react";
import { AlumniRow } from "./types";
import { normalizeAlumniRow } from "./normalizeAlumniRow";
import { loadCsv } from "./loadCsv";

const DEBUG = process.env.SHOW_DAT_DEBUG === "true";

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

export const loadAlumni = cache(async (): Promise<AlumniRow[]> => {
  try {
    const csvText = await loadCsv(process.env.ALUMNI_CSV_URL, "alumni.csv");

    if (DEBUG) {
      console.log("📄 Raw CSV Text Preview:\n", csvText.slice(0, 1000));
    }

    const parsed = Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    const rows: AlumniRow[] = [];
    let skipped = 0;

    for (const raw of parsed.data) {
      // Normalize keys and trim early for filtering
      const normalizedKeys: Record<string, string> = Object.fromEntries(
        Object.entries(raw).map(([key, value]) => [
          key.trim().toLowerCase(),
          value?.toString().trim() ?? "",
        ])
      );

      if (DEBUG || true) {
        console.log("🧾 Parsed Rows:", parsed.data.map((r) => r["Name"]), parsed.data.length);
      }

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

  if (DEBUG || true) {
    console.log("👀 [loadVisibleAlumni] Visible slugs:", visible.map((a) => a.slug));
  }

  return visible;
}

export const loadAlumniBySlug = cache(async (slug: string): Promise<AlumniRow | null> => {
  const all = await loadAlumni();
  return all.find((a) => a.slug?.toLowerCase() === slug.toLowerCase()) || null;
});
