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

type Involvement = {
  intlPrograms: Set<string>; // distinct international programMap slugs
  allPrograms: Set<string>; // distinct programMap slugs (intl + domestic)
  productions: Set<string>; // distinct productionMap slugs (deduped via projectSlugs)
};

function emptyInvolvement(): Involvement {
  return {
    intlPrograms: new Set<string>(),
    allPrograms: new Set<string>(),
    productions: new Set<string>(),
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
    };
    const intl = isInternationalProgram(prog);
    for (const artistSlug of Object.keys(prog?.artists ?? {})) {
      const rec = recFor(artistSlug);
      if (!rec) continue;
      rec.allPrograms.add(normSlug(programSlug));
      if (intl) rec.intlPrograms.add(normSlug(programSlug));
    }
  }

  // 2) Productions (deduped against the slug's program set)
  for (const prodSlug in productionMap) {
    const prod = productionMap[prodSlug] as {
      projectSlugs?: string[];
      artists?: Record<string, unknown>;
    };
    const projectSlugs = (prod?.projectSlugs ?? []).map((s) => normSlug(s));
    for (const artistSlug of Object.keys(prod?.artists ?? {})) {
      const rec = recFor(artistSlug);
      if (!rec) continue;
      // Skip when this production grew out of a program the slug is already counted in.
      const dedup = projectSlugs.some((p) => rec.allPrograms.has(p));
      if (dedup) continue;
      rec.productions.add(normSlug(prodSlug));
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
 * Sort key for the /role/collective-artist page (most involved first). Implicit
 * ordering only — never surface this number in the UI.
 */
export function collectiveInvolvementScore(slug: string): number {
  const rec = involvementIndex.get(normSlug(slug));
  if (!rec) return 0;
  return rec.intlPrograms.size * 1000 + rec.allPrograms.size + rec.productions.size;
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
