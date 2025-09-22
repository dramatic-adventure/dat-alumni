/** ✅ Represents a single alumni item (base model) */
export interface AlumniItem {
  name: string;
  slug: string;
  roles?: string[];
  location?: string;
  lat?: number;                // ✅ Optional latitude for geolocation
  lng?: number;                // ✅ Optional longitude for geolocation
  programs?: string[];
  statusFlags?: string[];
  identityTags?: string[];
  artistStatement?: string;
  bio?: string;
}

/** ✅ Extended model for enriched alumni (with all tokenized fields) */
export interface EnrichedAlumniItem extends AlumniItem {
  programTokens: string[];
  productionTokens: string[];
  festivalTokens: string[];
  roleTokens: string[];        // ✅ Roles normalized for scoring
  bioTokens: string[];         // ✅ Bio + artistStatement tokenized
  statusTokens: string[];      // ✅ Normalized status flags
  identityTokens: string[];    // ✅ Normalized identity tags
  locationTokens: string[];    // ✅ Normalized location split into tokens
}

/** ✅ Filters for alumni directory search */
export interface Filters {
  program?: string;
  season?: string;
  location?: string;
  role?: string;
  statusFlag?: string;
  identityTag?: string;
  language?: string;
  updatedOnly?: boolean;
}

/** ✅ Standardized search result shape */
export interface SearchResult {
  primary: AlumniItem[];
  secondary: AlumniItem[];
  query: string;
}
