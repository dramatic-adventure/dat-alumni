// lib/loadUpdates.ts
import { parse } from "csv-parse/sync";
import type { Update } from "./types";

/** Parse CSV text into typed rows. */
function parseCsv<T = any>(text: string): T[] {
  return parse(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as T[];
}

/**
 * Try a remote Google Sheet first; fall back to a public file (e.g. /fallback/*.csv).
 * Note: fallbackPath must live under /public so it's fetchable on the client.
 */
async function fetchCsvOrFallback(
  remoteUrl: string | undefined,
  fallbackPath: string
): Promise<string> {
  try {
    if (!remoteUrl) throw new Error("No remote URL");
    const res = await fetch(remoteUrl, { cache: "no-store" });
    if (!res.ok) throw new Error(`Bad status: ${res.status}`);
    return await res.text();
  } catch {
    const res = await fetch(fallbackPath, { cache: "no-store" });
    if (!res.ok) throw new Error(`Fallback not found at ${fallbackPath}`);
    return await res.text();
  }
}

/** 🟡 Spotlights & Highlights (single tab that includes both) */
export async function loadSpotlightsHighlights(): Promise<Update[]> {
  const text = await fetchCsvOrFallback(
    process.env.SPOTLIGHTS_CSV_URL,
    "/fallback/spotlights-highlights.csv"
  );
  return parseCsv<Update>(text);
}

/** 🔴 Promos */
export async function loadPromos(): Promise<Update[]> {
  const text = await fetchCsvOrFallback(
    process.env.PROMOS_CSV_URL,
    "/fallback/promos.csv"
  );
  return parseCsv<Update>(text);
}

/** 🟢 Journey Albums */
export async function loadJourneyAlbums(): Promise<Update[]> {
  const text = await fetchCsvOrFallback(
    process.env.JOURNEY_ALBUMS_CSV_URL,
    "/fallback/journey-albums.csv"
  );
  return parseCsv<Update>(text);
}

/**
 * 🧰 Aggregate: pulls the combined tab with everything (if you keep it).
 * Use this when you need a single stream of all updates.
 */
export async function loadAllUpdates(): Promise<Update[]> {
  const text = await fetchCsvOrFallback(
    process.env.ALUMNI_UPDATES_CSV_URL,
    "/fallback/alumni-updates.csv"
  );
  return parseCsv<Update>(text);
}
