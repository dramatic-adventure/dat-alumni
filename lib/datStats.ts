/**
 * lib/datStats.ts
 *
 * SINGLE SOURCE OF TRUTH for DAT's public-facing impact statistics.
 *
 * Every page/component that shows an impact number MUST import it from here.
 * Do NOT re-derive these counts locally and do NOT hardcode them in components
 * — that's what caused the numbers to drift apart across pages.
 *
 * All stats below are derived from the static data files, so they update
 * automatically when the underlying data changes (add a season, a club, a
 * production, a program, or fill in a club's youth/showcase numbers).
 */

import { dramaClubs } from "@/lib/dramaClubMap";
import { seasons } from "@/lib/seasonData";
import { productionMap } from "@/lib/productionMap";
import { programMap } from "@/lib/programMap";

// ── Current season helpers ─────────────────────────────────────────────────

function _parseSeasonNumber(title: string): number {
  const m = title.match(/\d+/);
  return m ? parseInt(m[0], 10) : 0;
}

const _current = seasons[0];

// ── Geography / catalog (derived from static data) ─────────────────────────

// Countries are derived from EVERY place DAT has worked: programs (structured
// country + footprints), productions (parsed from the location string), and
// drama clubs. Aliases collapse US city/state tokens and "United States"/"USA"
// to a single country so the same place isn't counted twice.
const _US_ALIASES = new Set([
  "usa", "us", "u.s.", "u.s.a.", "united states",
  "united states of america", "america",
  "nyc", "ny", "new york", "and new york", "brooklyn", "manhattan", "queens",
  "washington", "dc", "d.c.", "md", "maryland", "pa", "pennsylvania",
  "nj", "new jersey", "ma", "massachusetts", "ca", "california",
]);

function _normalizeCountry(raw?: string): string | null {
  const t = (raw ?? "").trim();
  if (!t) return null;
  return _US_ALIASES.has(t.toLowerCase()) ? "USA" : t;
}

/** Best-effort country from a free-form "city, region, country" location. */
function _countryFromLocation(location?: string): string | null {
  if (!location) return null;
  const parts = location.split(",");
  return _normalizeCountry(parts[parts.length - 1]);
}

const _countries = new Set<string>();
for (const p of Object.values(programMap)) {
  const c = _normalizeCountry(p.country);
  if (c) _countries.add(c);
  for (const f of p.footprints ?? []) {
    const fc = _normalizeCountry(f.country);
    if (fc) _countries.add(fc);
  }
}
for (const pr of Object.values(productionMap)) {
  const c = _countryFromLocation(pr.location);
  if (c) _countries.add(c);
}
for (const club of dramaClubs) {
  const c = _normalizeCountry(club.country);
  if (c) _countries.add(c);
}

/** Number of distinct countries where DAT has worked (programs, productions, clubs). */
export const COUNTRY_COUNT = _countries.size;

/**
 * Distinct countries that specifically HOST a drama club (a subset of
 * COUNTRY_COUNT). Use this for "countries hosting drama clubs" copy; use
 * COUNTRY_COUNT for "countries DAT has worked in".
 */
export const CLUB_COUNTRY_COUNT = new Set(
  dramaClubs.map((c) => c.country).filter(Boolean)
).size;

/** Total drama clubs created across all partner communities. */
export const CLUB_COUNT = dramaClubs.length;

/** Number of DAT seasons completed or underway. */
export const SEASON_COUNT = seasons.length;

/** Number of original productions ("new plays") in the production archive. */
export const PRODUCTION_COUNT = Object.keys(productionMap).length;

// ── Traveling artists ──────────────────────────────────────────────────────
//
// This is NOT a count of unique alumni. It's the number of times anyone has
// traveled with us — i.e. total artist journeys. A person who traveled on
// three programs counts three times.
//
// Counted as: every credit in programMap, PLUS credits in productionMap for
// people who never appear in programMap (so a trip recorded in both a program
// and its resulting production isn't double-counted).

const _isRealArtistKey = (k: string) => !k.startsWith("[");

const _programCredits = Object.values(programMap).flatMap((p) =>
  Object.keys(p.artists ?? {}).filter(_isRealArtistKey)
);

/** Everyone who appears anywhere in programMap (used to de-dupe productions). */
const _programPeople = new Set(_programCredits);

const _productionAddCredits = Object.values(productionMap).flatMap((p) =>
  Object.keys(p.artists ?? {}).filter(
    (k) => _isRealArtistKey(k) && !_programPeople.has(k)
  )
);

/** Total artist journeys (programs + production-only people). */
export const TRAVELING_ARTIST_COUNT =
  _programCredits.length + _productionAddCredits.length;

/** Display string for the traveling-artist count (e.g. "477+"). */
export const TRAVELING_ARTIST_COUNT_DISPLAY = `${TRAVELING_ARTIST_COUNT}+`;

// ── Drama club impact (derived from drama club data) ───────────────────────
//
// These sum per-club fields, so they grow automatically as club records are
// filled in. Clubs without a value contribute 0 (i.e. the totals are only as
// complete as the data in lib/dramaClubMap.ts).

/** Approximate youth reached through drama clubs. */
export const YOUTH_REACHED = dramaClubs.reduce(
  (sum, c) => sum + (c.approxYouthServed ?? 0),
  0
);

/** Community showcases / performances led by drama clubs. */
export const COMMUNITY_SHOWCASES = dramaClubs.reduce(
  (sum, c) => sum + (c.communityShowcases ?? c.showcasesCount ?? 0),
  0
);

// ── Founding / tenure ──────────────────────────────────────────────────────

/** Years since DAT's founding in 2006. */
export const YEARS_OF_WORK = new Date().getFullYear() - 2006;

// ── Current season (auto-updates when seasonData changes) ─────────────────

/** Current DAT season number (e.g. 20). */
export const CURRENT_SEASON_NUMBER = _parseSeasonNumber(_current.seasonTitle);

/** Current season title string (e.g. "Season 20"). */
export const CURRENT_SEASON_LABEL = _current.seasonTitle;

/** Current season year span (e.g. "2025 / 2026"). */
export const CURRENT_SEASON_YEARS = _current.years;

/** Active programs in the current season. */
export const CURRENT_SEASON_PROGRAMS: string[] = _current.projects;

/** Number of active programs in the current season. */
export const CURRENT_SEASON_PROGRAM_COUNT = _current.projects.length;

// ── Prebuilt stat sets ─────────────────────────────────────────────────────

export type ImpactStat = { value: number; label: string; subLabel?: string };

/**
 * The headline impact strip used on the public story-map page.
 * Order matters (it's the on-screen order). Edit here, not in StatsStrip.
 */
export const GLOBAL_IMPACT_STATS: ImpactStat[] = [
  { value: TRAVELING_ARTIST_COUNT, label: "Traveling Artists" },
  { value: COUNTRY_COUNT, label: "Countries" },
  { value: CLUB_COUNT, label: "Drama Clubs" },
  { value: COMMUNITY_SHOWCASES, label: "Community Showcases" },
  { value: PRODUCTION_COUNT, label: "New Plays" },
  { value: YOUTH_REACHED, label: "Youth Reached" },
];
