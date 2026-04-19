import { AlumniRow } from "./types";
import {
  findTagByLabelOrAlias,
  searchTokensFor,
  type TaxonomyLayer,
} from "./alumniTaxonomy";

export interface AlumniFilters {
  season?: number;              // e.g., filter by Season number
  program?: string;             // e.g., ACTion, RAW, etc.
  role?: string;                // Filter by single role
  location?: string;            // Partial text match
  production?: string;          // Filter by production name
  festival?: string;            // Filter by festival
  identityTags?: string[];      // Filter by identity tags
  practiceTags?: string[];      // Filter by artistic-practice tags
  exploreCareTags?: string[];   // Filter by what-I-explore-&-care-about tags
  statusFlags?: string[];       // Filter by special flags
  search?: string;              // Free text search
}

/**
 * A filter value matches if either:
 *  - it equals any stored label, or
 *  - it resolves (via alias) to the same canonical tag as any stored label.
 */
function matchesTagFilter(
  stored: string[],
  requested: string[],
  layer: TaxonomyLayer
): boolean {
  const storedIds = new Set(
    stored
      .map((s) => findTagByLabelOrAlias(s, layer)?.id ?? s.toLowerCase())
  );
  return requested.every((r) => {
    const rid = findTagByLabelOrAlias(r, layer)?.id ?? r.toLowerCase();
    if (storedIds.has(rid)) return true;
    // Fallback: exact string match (case-insensitive) for non-canonical values.
    return stored.some((s) => s.toLowerCase() === r.toLowerCase());
  });
}

export function filterAlumni(alumni: AlumniRow[], filters: AlumniFilters): AlumniRow[] {
  return alumni.filter((a) => {
    // ✅ Season filter
    if (filters.season && !a.programSeasons.includes(filters.season)) return false;

    // ✅ Program filter
    if (filters.program && !a.programBadges.includes(filters.program)) return false;

    // ✅ Role filter
    if (filters.role && !a.roles.includes(filters.role)) return false;

    // ✅ Location filter (case-insensitive partial match)
    if (filters.location && !a.location.toLowerCase().includes(filters.location.toLowerCase())) return false;

    // ✅ Production filter
    if (filters.production && !(a.productions || []).includes(filters.production)) return false;

    // ✅ Festival filter
    if (filters.festival && !(a.festival || "").toLowerCase().includes(filters.festival.toLowerCase())) return false;

    // ✅ Identity tags (must match all requested, alias-aware)
    if (
      filters.identityTags &&
      !matchesTagFilter(a.identityTags ?? [], filters.identityTags, "identity")
    ) {
      return false;
    }

    // ✅ Practice tags
    if (
      filters.practiceTags &&
      !matchesTagFilter(a.practiceTags ?? [], filters.practiceTags, "practice")
    ) {
      return false;
    }

    // ✅ Explore & care tags
    if (
      filters.exploreCareTags &&
      !matchesTagFilter(
        a.exploreCareTags ?? [],
        filters.exploreCareTags,
        "exploreCare"
      )
    ) {
      return false;
    }

    // ✅ Status flags
    if (filters.statusFlags && !filters.statusFlags.every(flag => a.statusFlags.includes(flag))) return false;

    // ✅ Free text search — include canonical labels + aliases so searching
    // "Devising" finds "Devised Theatre", etc.
    if (filters.search) {
      const searchStr = filters.search.toLowerCase();

      const tagTokens = [
        ...(a.identityTags ?? []),
        ...(a.practiceTags ?? []),
        ...(a.exploreCareTags ?? []),
      ].flatMap((label) => {
        const tag = findTagByLabelOrAlias(label);
        return tag ? searchTokensFor(tag) : [label];
      });

      const haystack = [
        a.name,
        ...a.roles,
        a.location,
        a.artistStatement || "",
        ...(a.productions || []),
        a.festival || "",
        ...tagTokens,
        ...a.statusFlags,
      ]
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(searchStr)) return false;
    }

    return true;
  });
}
