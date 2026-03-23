/**
 * lib/datStats.ts
 *
 * Single source of truth for DAT's public-facing impact statistics.
 *
 * - Stats derived from static data files update automatically when those
 *   files change (e.g. add a season, add a drama club, add a production).
 * - Stats that require the Google Sheets alumni loader (server-only async)
 *   are maintained as manually-updated constants here. Update ALUMNI_COUNT
 *   whenever the roster changes significantly.
 */

import { dramaClubs } from "@/lib/dramaClubMap";
import { seasons } from "@/lib/seasonData";
import { productionMap } from "@/lib/productionMap";

// ── Derived from static data (auto-updates) ────────────────────────────────

/** Number of distinct countries with active or legacy DAT drama clubs */
export const COUNTRY_COUNT = new Set(
  dramaClubs.map((c) => c.country).filter(Boolean)
).size;

/** Total drama clubs created across all partner communities */
export const CLUB_COUNT = dramaClubs.length;

/** Number of DAT seasons completed or underway */
export const SEASON_COUNT = seasons.length;

/** Number of original productions in the production archive */
export const PRODUCTION_COUNT = Object.keys(productionMap).length;

// ── Manually updated ───────────────────────────────────────────────────────

/**
 * Total DAT alumni artists (participants across all programs).
 * Update this when the roster grows significantly.
 * Last updated: March 2026
 */
export const ALUMNI_COUNT = 350;

/** Display string for alumni count (e.g. "350+") */
export const ALUMNI_COUNT_DISPLAY = `${ALUMNI_COUNT}+`;
