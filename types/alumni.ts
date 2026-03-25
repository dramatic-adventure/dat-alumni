// /types/alumni.ts

/** ✅ Represents a single alumni item (base model) — public directory friendly */
export interface AlumniItem {
  name: string;
  slug: string;

  roles?: string[];
  location?: string;

  lat?: number;
  lng?: number;

  programs?: string[];
  statusFlags?: string[];
  identityTags?: string[];

  artistStatement?: string;
  bio?: string;

  /** ✅ NEW: languages spoken (public-facing) */
  languages?: string[];

  /** ✅ NEW: seasons participated in (public-facing) */
  seasons?: number[];
}

/** ✅ Extended model for enriched alumni (with tokenized fields) */
export interface EnrichedAlumniItem extends AlumniItem {
  programTokens: string[];
  productionTokens: string[];
  festivalTokens: string[];

  roleTokens: string[];
  bioTokens: string[];

  statusTokens: string[];
  identityTokens: string[];
  locationTokens: string[];

  /** ✅ NEW: language tokens (normalized) */
  languageTokens: string[];

  /** ✅ NEW: season tokens (normalized) */
  seasonTokens: string[];
}

/** ✅ Filters for alumni directory search */
export interface Filters {
  program?: string;
  season?: string; // e.g. "spring", "winter 2024", "12", "season 12"
  location?: string;
  role?: string;
  statusFlag?: string;
  identityTag?: string;

  /** ✅ NEW */
  language?: string;

  updatedOnly?: boolean;
}

/** ✅ Standardized search result shape */
export interface SearchResult<T = AlumniItem> {
  primary: T[];
  secondary: T[];
  query: string;
}
