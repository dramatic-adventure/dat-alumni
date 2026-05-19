// lib/loadOpportunities.ts
// ─────────────────────────────────────────────────────────────────────────────
// Server-only loader for the "Opportunities" tab in the DAT Google Sheet.
//
// Reads via the Google Sheets API using the existing service-account creds
// (same pattern as lib/loadAlumni.ts and lib/sheets/index.ts). Falls back to
// data/opportunities.json (via getOpportunitiesSync) if the API call fails
// or the env vars aren't set, so the site never breaks.
//
// Required env vars (already in place for alumni):
//   - ALUMNI_SHEET_ID
//   - GCP_SA_JSON_BASE64  (or GCP_SA_JSON, or the split GCP_SA_* vars)
//
// Sheet shape — see the header comment in lib/opportunities.ts for the full
// 27-column spec.
// ─────────────────────────────────────────────────────────────────────────────

import "server-only";

import { cache } from "react";

import { sheetsClient } from "./googleClients";
import {
  csvRowsToSeed,
  getOpportunitiesSync,
  normalize,
  sortOpportunities,
  type Opportunity,
} from "./opportunities";

const SHEET_TAB = "Opportunities";

/* ──────────────────────────────────────────────────────────
 * Module-level snapshot cache
 * Mirrors the loadRoleAssignments pattern. One Sheets API call per TTL window
 * per Node.js worker process — prevents 429 quota errors during Netlify builds
 * where many pages are pre-rendered in the same process.
 * Default TTL matches the page revalidate (3600s), overridable via env var.
 * ────────────────────────────────────────────────────────── */
let _cache: Opportunity[] | null = null;
let _cacheAt = 0;
const OPPORTUNITIES_TTL_MS = Number(
  process.env.OPPORTUNITIES_TTL_MS || 3_600_000
);

async function fetchFromSheet(): Promise<Opportunity[] | null> {
  const spreadsheetId = String(process.env.ALUMNI_SHEET_ID || "").trim();
  if (!spreadsheetId) return null;

  try {
    const sheets = sheetsClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${SHEET_TAB}!A1:AA`,
      // FORMATTED_VALUE returns cells as the user sees them — so dates render
      // as the YYYY-MM-DD text they typed, booleans as "TRUE"/"FALSE", and
      // numbers as strings. This matches what `csvRowsToSeed` expects.
      valueRenderOption: "FORMATTED_VALUE",
      dateTimeRenderOption: "FORMATTED_STRING",
    });

    const rows = (res.data.values ?? []) as string[][];
    if (rows.length < 2) return null;

    const seeds = csvRowsToSeed(rows);
    const out = seeds.map(normalize).filter((o) => o.id && o.title);
    if (out.length === 0) return null;
    return sortOpportunities(out);
  } catch (err) {
    console.warn("[loadOpportunities] Sheets API fetch failed:", err);
    return null;
  }
}

/**
 * Server-only loader. Reads the "Opportunities" tab via the Sheets API and
 * falls back to data/opportunities.json (the seeded snapshot) if the API
 * call fails or the env vars aren't configured.
 *
 * Uses a module-level cache (one Sheets call per TTL per worker process) so
 * that the Netlify static-generation pass — which pre-renders many pages in the
 * same process — doesn't hammer the Sheets API quota. React cache() provides
 * additional deduplication within a single render request.
 */
export const loadOpportunities = cache(async (): Promise<Opportunity[]> => {
  const now = Date.now();
  if (_cache !== null && now - _cacheAt < OPPORTUNITIES_TTL_MS) {
    return _cache;
  }

  const live = await fetchFromSheet();
  const result = live && live.length > 0 ? live : getOpportunitiesSync();

  _cache = result;
  _cacheAt = Date.now();
  return result;
});

/** Find a single opportunity by id (uses the live loader). */
export async function findOpportunity(id: string): Promise<Opportunity | null> {
  const all = await loadOpportunities();
  return all.find((o) => o.id === id) ?? null;
}
