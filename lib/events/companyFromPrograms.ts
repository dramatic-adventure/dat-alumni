// lib/events/companyFromPrograms.ts
// ─────────────────────────────────────────────────────────────────────────────
// Builds an event's company roster from programMap instead of a hand-written
// `credits` array, so the roster stays live: add an artist to a program in
// lib/programMap.ts and they appear on the event page on the next revalidation.
//
// Usage: set `companyPrograms` on the event to one or more programMap slugs.
//   companyPrograms: ["passage-slovakia-2026", "dat-lab-kosice-2026"]
//
// Names and profile links resolve against alumni data; headshots are filled in
// afterwards by the existing credit-enrichment pass in app/theatre/[slug]/page.tsx
// (it matches on the `/alumni/<slug>` href, which this builder always sets when
// the artist exists in the alumni sheet).
//
// An explicit `credits` array on the event always wins — this is a fallback,
// never an override.
// ─────────────────────────────────────────────────────────────────────────────

import { programMap } from "@/lib/programMap";
import { productionMap } from "@/lib/productionMap";
import type { AlumniRow } from "@/lib/types";

export type CompanyCredit = {
  role: string;
  name: string;
  href?: string;
  group?: "creative" | "cast";
  photo?: string;
};

/**
 * Roles that put someone on stage. Everything else is creative team.
 * Matched loosely so "Lead Actor" or "Live Musician" still land as cast.
 */
const CAST_ROLE = /actor|actress|performer|puppeteer|musician|dancer|singer|ensemble|narrator/i;

/**
 * Sort key for alphabetical cast billing: everything after the first name, so
 * compound surnames stay intact ("Adrián Pica Borjas" → "Pica Borjas").
 */
function surnameKey(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.length > 1 ? parts.slice(1).join(" ") : name;
}

/** "barbora-curejova" → "Barbora Curejova" (last-resort display name). */
function nameFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/**
 * Unions the artist rosters of the given programMap slugs, in the order the
 * programs are listed (first appearance wins for ordering). Role lines are
 * merged and de-duplicated across programs, so someone credited as
 * "Teaching Artist" in one and "Writer" in another reads "Teaching Artist, Writer".
 *
 * Artists missing from the alumni sheet are still listed (de-slugified name,
 * no link) rather than silently dropped.
 *
 * `excludeSlugs` drops specific artists from this event's roster only — their
 * programMap credit (and everything derived from it: passport stamps, project
 * rosters, artist counts) is untouched.
 */
export function buildCompanyFromPrograms(
  programSlugs: string[] | undefined,
  alumni: AlumniRow[],
  group: "creative" | "cast" = "cast",
  excludeSlugs?: string[],
): CompanyCredit[] {
  if (!programSlugs?.length) return [];

  const alumniBySlug = new Map(alumni.map((a) => [a.slug, a]));
  const excluded = new Set(excludeSlugs ?? []);
  const rolesBySlug = new Map<string, string[]>();

  for (const programSlug of programSlugs) {
    const program = programMap[programSlug];
    if (!program?.artists) continue;
    for (const [artistSlug, roles] of Object.entries(program.artists)) {
      if (excluded.has(artistSlug)) continue;
      const existing = rolesBySlug.get(artistSlug) ?? [];
      for (const role of roles) {
        if (role && !existing.includes(role)) existing.push(role);
      }
      rolesBySlug.set(artistSlug, existing);
    }
  }

  return [...rolesBySlug.entries()].map(([artistSlug, roles]) => {
    const alum = alumniBySlug.get(artistSlug);
    return {
      role: roles.join(", "),
      name: alum?.name ?? nameFromSlug(artistSlug),
      ...(alum ? { href: `/alumni/${alum.slug}` } : {}),
      group,
    } satisfies CompanyCredit;
  });
}

/**
 * Builds the roster from a productionMap entry, split into Cast and Creative
 * Team the way the production page does it (see /theatre/a-girl-without-wings).
 *
 * Production roles are the show's own roles — "Director", "Actor", "Puppeteer" —
 * rather than the programme roles someone carries for the whole trip
 * ("Artistic Director", "Road Manager"), so this is the better source once the
 * production record exists. Someone credited both ways appears in both
 * sections, carrying only the roles that belong to each: Jesse Baxter reads
 * "Director" under Creative Team and "Actor" under Cast.
 *
 * `programSlugs` additionally folds each person's off-stage programme titles
 * ("Artistic Director", "Road Manager") into their Creative Team line, so the
 * page shows both what they did on the show and what they carry for the trip.
 * Performing roles from the programmes are ignored — the production is the
 * authority on who is on stage. Only people in the production are listed;
 * programme data enriches them, it does not add anyone.
 */
export function buildCompanyFromProduction(
  productionSlug: string | undefined,
  alumni: AlumniRow[],
  excludeSlugs?: string[],
  programSlugs?: string[],
): CompanyCredit[] {
  if (!productionSlug) return [];
  const artists = productionMap[productionSlug]?.artists;
  if (!artists) return [];

  // Off-stage programme titles, keyed by artist slug.
  const programTitles = new Map<string, string[]>();
  for (const programSlug of programSlugs ?? []) {
    const program = programMap[programSlug];
    if (!program?.artists) continue;
    for (const [artistSlug, roles] of Object.entries(program.artists)) {
      const existing = programTitles.get(artistSlug) ?? [];
      for (const role of roles) {
        if (role && !CAST_ROLE.test(role) && !existing.includes(role)) {
          existing.push(role);
        }
      }
      programTitles.set(artistSlug, existing);
    }
  }

  const alumniBySlug = new Map(alumni.map((a) => [a.slug, a]));
  const excluded = new Set(excludeSlugs ?? []);
  const cast: CompanyCredit[] = [];
  const creative: CompanyCredit[] = [];

  for (const [artistSlug, roles] of Object.entries(artists)) {
    if (excluded.has(artistSlug)) continue;
    const alum = alumniBySlug.get(artistSlug);
    const identity = {
      name: alum?.name ?? nameFromSlug(artistSlug),
      ...(alum ? { href: `/alumni/${alum.slug}` } : {}),
    };

    const castRoles = roles.filter((r) => CAST_ROLE.test(r));
    const creativeRoles = roles.filter((r) => !CAST_ROLE.test(r));

    // Show role first, then the trip title, skipping exact duplicates.
    for (const title of programTitles.get(artistSlug) ?? []) {
      if (!creativeRoles.includes(title)) creativeRoles.push(title);
    }

    if (castRoles.length) {
      cast.push({ ...identity, role: castRoles.join(", "), group: "cast" });
    }
    if (creativeRoles.length) {
      creative.push({ ...identity, role: creativeRoles.join(", "), group: "creative" });
    }
  }

  // Cast is billed alphabetically by surname — the standard ensemble
  // convention, and the honest one for devised work where no one is the lead.
  // Slovak collation so Č/Š/Ť sort where a Slovak reader expects them.
  cast.sort((a, b) =>
    surnameKey(a.name).localeCompare(surnameKey(b.name), "sk", { sensitivity: "base" }),
  );

  // Creative team keeps its authored order, which encodes the hierarchy that
  // matters there (stage directors, then assistant, then technical).
  // Creative first so the template's "Creative Team" heading logic
  // (which switches to "The Company" when there is no cast) stays correct.
  return [...creative, ...cast];
}
