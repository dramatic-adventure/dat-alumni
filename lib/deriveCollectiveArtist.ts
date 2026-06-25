// lib/deriveCollectiveArtist.ts
// Derive the metric-based "Collective Artist" rung of the artist ladder from
// participation data (programMap + productionMap), mirroring deriveBoardStatus.
//
// Ladder: Resident Artist (staff) → Associate Artist (nominated) →
// Collective Artist (earned by the numbers). This helper only computes the
// earned base rung; it is additive to manual Sheet tags and is suppressed for
// anyone who already holds a higher-ranked flag (see shouldFlagCollectiveArtist).

import { programMap } from "@/lib/programMap";
import { productionMap } from "@/lib/productionMap";
import { ROLE_DISPLAY_ORDER, getCanonicalFlag } from "@/lib/flags";
import { eraRecencyWeightForSeason as eraWeight } from "@/lib/eras";

/**
 * Local copy of lib/slugAliases#normSlug. Inlined so this stays a pure,
 * client-safe derivation module (the slugAliases version pulls in a
 * server-only loadAlumni chain). Keep in sync if that normalizer changes.
 */
function normSlug(v: string | null | undefined): string {
  return (v ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Manual exclusion set — slugs listed here are NEVER auto-flagged as Collective
 * Artist (false-positive overrides). A manual Sheet "Collective Artist" tag is
 * unaffected: exclusion only suppresses the automatic derivation. Use canonical
 * alumni slugs; lookups are normalized via normSlug.
 */
const COLLECTIVE_EXCLUDE = new Set<string>([
  // Temporarily suppressed (working relationship ended) — hide from the
  // Collective Artist designation for now. Remove a slug to restore.
  "santi-baxter",
  "petra-slovakova",
  "rachel-wiese",
]);

/** Country values treated as domestic (US). Everything else is international. */
const DOMESTIC_COUNTRIES = new Set<string>([
  "usa",
  "us",
  "u s",
  "u s a",
  "united states",
  "united states of america",
  "america",
]);

function isDomesticCountry(country: string | undefined | null): boolean {
  const c = String(country ?? "")
    .trim()
    .toLowerCase()
    .replace(/[.]/g, "")
    .replace(/\s+/g, " ");
  if (!c) return false;
  return DOMESTIC_COUNTRIES.has(c);
}

/**
 * A program is international when its country — or ANY footprint country — is
 * not the US. Uses the structured country / footprint.country fields.
 */
function isInternationalProgram(prog: {
  country?: string;
  footprints?: { country?: string }[];
}): boolean {
  const countries: (string | undefined)[] = [prog.country];
  for (const fp of prog.footprints ?? []) countries.push(fp?.country);
  const known = countries.filter((c) => String(c ?? "").trim().length > 0);
  if (!known.length) return false;
  return known.some((c) => !isDomesticCountry(c));
}

/**
 * Recency weighting comes from the SHARED DAT eras in lib/eras.ts — the same
 * eras rendered on /theatre and /projects. Each engagement is weighted by the
 * era its season falls in; the most recent era carries the most weight and it
 * degrades era by era. 🔧 To change the eras, edit DAT_ERAS in lib/eras.ts and
 * everything (both archive pages + this ordering) updates together.
 *
 * International travel is the most valuable signal: an international PROGRAM
 * engagement is worth this multiple of a domestic one, on top of its era
 * weight. Productions carry no structured country, so they score as domestic.
 * 🔧 Tune freely.
 */
export const INTERNATIONAL_MULTIPLIER = 5;

type Involvement = {
  intlPrograms: Set<string>; // distinct international programMap slugs
  allPrograms: Set<string>; // distinct programMap slugs (intl + domestic)
  productions: Set<string>; // distinct productionMap slugs (deduped via projectSlugs)
  score: number; // era + international weighted ordering score
};

function emptyInvolvement(): Involvement {
  return {
    intlPrograms: new Set<string>(),
    allPrograms: new Set<string>(),
    productions: new Set<string>(),
    score: 0,
  };
}

/**
 * Module-level memoized index, built ONCE from the static programMap +
 * productionMap imports: slug -> Involvement.
 *
 * Programs are processed before productions so that the production dedup can see
 * a slug's complete program set: a production is skipped for a slug when its
 * projectSlugs already include a program that slug is counted in (a program +
 * its production = one engagement, not two).
 */
const involvementIndex: Map<string, Involvement> = (() => {
  const index = new Map<string, Involvement>();

  const recFor = (artistSlug: string): Involvement | null => {
    const ns = normSlug(artistSlug);
    if (!ns) return null;
    let rec = index.get(ns);
    if (!rec) {
      rec = emptyInvolvement();
      index.set(ns, rec);
    }
    return rec;
  };

  // 1) Programs
  for (const programSlug in programMap) {
    const prog = programMap[programSlug] as {
      country?: string;
      footprints?: { country?: string }[];
      artists?: Record<string, unknown>;
      season?: number;
    };
    const intl = isInternationalProgram(prog);
    const points = eraWeight(prog.season) * (intl ? INTERNATIONAL_MULTIPLIER : 1);
    for (const artistSlug of Object.keys(prog?.artists ?? {})) {
      const rec = recFor(artistSlug);
      if (!rec) continue;
      rec.allPrograms.add(normSlug(programSlug));
      if (intl) rec.intlPrograms.add(normSlug(programSlug));
      rec.score += points;
    }
  }

  // 2) Productions (deduped against the slug's program set)
  for (const prodSlug in productionMap) {
    const prod = productionMap[prodSlug] as {
      projectSlugs?: string[];
      artists?: Record<string, unknown>;
      season?: number;
    };
    const projectSlugs = (prod?.projectSlugs ?? []).map((s) => normSlug(s));
    // Productions carry no structured country → scored as domestic (no intl premium).
    const points = eraWeight(prod.season);
    for (const artistSlug of Object.keys(prod?.artists ?? {})) {
      const rec = recFor(artistSlug);
      if (!rec) continue;
      // Skip when this production grew out of a program the slug is already counted in.
      const dedup = projectSlugs.some((p) => rec.allPrograms.has(p));
      if (dedup) continue;
      rec.productions.add(normSlug(prodSlug));
      rec.score += points;
    }
  }

  return index;
})();

/**
 * The qualification rule (no suppression, no exclusion). A slug qualifies if EITHER:
 *   A) it appears in >= 2 distinct INTERNATIONAL programs, OR
 *   B) it appears in >= 3 distinct engagements across programs + productions
 *      (deduped), with AT LEAST ONE of them international.
 * Only programs carry a structured country, so "at least one international"
 * means at least one international program among the engagements.
 */
export function deriveCollectiveArtistQualifies(slug: string): boolean {
  const rec = involvementIndex.get(normSlug(slug));
  if (!rec) return false;

  // Rule A
  if (rec.intlPrograms.size >= 2) return true;

  // Rule B
  const combined = rec.allPrograms.size + rec.productions.size;
  if (combined >= 3 && rec.intlPrograms.size >= 1) return true;

  return false;
}

/**
 * Sort key for the /role/collective-artist page (highest first). Implicit
 * ordering only — never surface this number in the UI.
 *
 * Each engagement contributes
 *   eraWeight(season) × (international program ? INTERNATIONAL_MULTIPLIER : 1)
 * summed across the artist's deduped programs + productions. This rewards
 * RECENT travel (era weights, most-recent era highest) and INTERNATIONAL
 * travel (the multiplier). Edit DAT_ERAS in lib/eras.ts to change the eras, or
 * INTERNATIONAL_MULTIPLIER above, to retune the ordering.
 */
export function collectiveInvolvementScore(slug: string): number {
  const rec = involvementIndex.get(normSlug(slug));
  if (!rec) return 0;
  return rec.score;
}

const COLLECTIVE_RANK = ROLE_DISPLAY_ORDER.indexOf("Collective Artist");

/**
 * Ladder-aware gate: returns true only when the slug should be AUTO-flagged as
 * "Collective Artist". It must qualify by the numbers, not be excluded, and hold
 * no flag ranked above Collective Artist in ROLE_DISPLAY_ORDER. Pass every flag
 * the person already holds — manual Sheet flags AND any derived flags (e.g. a
 * derived "Board Member" from deriveBoardStatus) — so suppression is correct.
 */
export function shouldFlagCollectiveArtist(
  slug: string,
  existingFlags: readonly string[] = []
): boolean {
  if (COLLECTIVE_EXCLUDE.has(normSlug(slug))) return false;
  if (!deriveCollectiveArtistQualifies(slug)) return false;

  for (const flag of existingFlags) {
    const canonical = getCanonicalFlag(String(flag ?? ""));
    if (!canonical) continue;
    const rank = ROLE_DISPLAY_ORDER.indexOf(canonical);
    if (rank !== -1 && rank < COLLECTIVE_RANK) return false; // higher-ranked flag present
  }

  return true;
}
