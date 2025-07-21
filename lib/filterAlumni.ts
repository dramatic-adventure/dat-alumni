import { AlumniRow } from "./types";

export interface AlumniFilters {
  season?: number;              // e.g., filter by Season number
  program?: string;             // e.g., ACTion, RAW, etc.
  role?: string;                // Filter by single role
  location?: string;            // Partial text match
  production?: string;          // Filter by production name
  festival?: string;            // Filter by festival
  identityTags?: string[];      // Filter by identity tags
  statusFlags?: string[];       // Filter by special flags
  search?: string;              // Free text search
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

    // ✅ Identity tags (must match all requested)
    if (filters.identityTags && !filters.identityTags.every(tag => a.identityTags.includes(tag))) return false;

    // ✅ Status flags
    if (filters.statusFlags && !filters.statusFlags.every(flag => a.statusFlags.includes(flag))) return false;

    // ✅ Free text search
    if (filters.search) {
      const searchStr = filters.search.toLowerCase();
      const haystack = [
        a.name,
        ...a.roles,
        a.location,
        a.artistStatement || "",
        ...(a.productions || []),
        a.festival || "",
        ...a.identityTags,
        ...a.statusFlags,
      ].join(" ").toLowerCase();

      if (!haystack.includes(searchStr)) return false;
    }

    return true;
  });
}
