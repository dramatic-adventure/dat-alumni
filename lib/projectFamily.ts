// lib/projectFamily.ts
//
// Family (program) grouping for the project archive. A "family" is the
// program line a project belongs to (PASSAGE, Creative Trek, ACTion,
// Teaching Artist Residency, DAT Retreat, SITE-LINES, etc.). The family
// archive page at /projects/program/[program] lists every project in a
// family; the project detail page's eyebrow links into it.
//
// Slugs are derived from the program name, so adding a new programMap entry
// in an existing family needs no wiring, and a brand-new family gets its own
// page automatically.

import { programMap, type ProgramData } from "@/lib/programMap";

export type FamilyProject = ProgramData & { slug: string };

/** URL-safe slug for a program family, e.g. "Teaching Artist Residency" → "teaching-artist-residency". */
export function familySlug(program: string): string {
  return program
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip combining diacritics
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Every distinct family slug present in programMap. */
export function allFamilySlugs(): string[] {
  return Array.from(new Set(Object.values(programMap).map((p) => familySlug(p.program))));
}

/**
 * All projects in a family, newest first. Returns null when the slug matches
 * no family (so the route can notFound()).
 */
export function getProjectsByFamily(
  slug: string
): { family: string; projects: FamilyProject[] } | null {
  const projects: FamilyProject[] = Object.entries(programMap)
    .map(([s, d]) => ({ ...d, slug: s }))
    .filter((p) => familySlug(p.program) === slug)
    .sort(
      (a, b) => Number(b.year) - Number(a.year) || a.title.localeCompare(b.title)
    );
  if (projects.length === 0) return null;
  return { family: projects[0].program, projects };
}
