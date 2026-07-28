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
import type { AlumniRow } from "@/lib/types";

export type CompanyCredit = {
  role: string;
  name: string;
  href?: string;
  group?: "creative" | "cast";
  photo?: string;
};

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
 */
export function buildCompanyFromPrograms(
  programSlugs: string[] | undefined,
  alumni: AlumniRow[],
  group: "creative" | "cast" = "cast",
): CompanyCredit[] {
  if (!programSlugs?.length) return [];

  const alumniBySlug = new Map(alumni.map((a) => [a.slug, a]));
  const rolesBySlug = new Map<string, string[]>();

  for (const programSlug of programSlugs) {
    const program = programMap[programSlug];
    if (!program?.artists) continue;
    for (const [artistSlug, roles] of Object.entries(program.artists)) {
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
