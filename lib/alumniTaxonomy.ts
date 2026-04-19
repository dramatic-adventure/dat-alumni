// lib/alumniTaxonomy.ts
//
// Shared controlled vocabulary for the three-layer alumni taxonomy:
//   1. "How I Identify"                   (identity)
//   2. "My Artistic Practice"             (practice)
//   3. "What I Explore & Care About in My Work" (exploreCare)
//
// Canonical V1 labels. Do not rename without updating the canon across:
//  - components/alumni/fields.ts
//  - app/alumni/update/studio/IdentityPanel.tsx
//  - app/tag/[slug]/page.tsx
//  - public profile render
//
// Identity tags are self-selected only; never infer from bio/credits/roles.
// Identity list must NOT be sorted by popularity.

import type { DramaClubCauseSubcategory } from "./causes";

export type TaxonomyLayer = "identity" | "practice" | "exploreCare";

export type TaxonomyTag = {
  /** URL-safe canonical id (also used as map key). */
  id: string;
  /** Public-facing label. Source of truth for display. */
  label: string;
  layer: TaxonomyLayer;
  /** Part of the seeded first-set shown before "Show more". */
  seeded: boolean;
  /** Sensitive tags never get inferred, popularity-sorted, or auto-suggested. */
  sensitive: boolean;
  /** Lifecycle status. "pending" = user-suggested; not rendered publicly. */
  status: "active" | "deprecated" | "pending";
  /** Aliases for search / typeahead matching. Not shown as chips. */
  aliases?: string[];
  /**
   * Optional mapping hook to the broader DAT Themes/Causes taxonomy
   * (see lib/causes.ts). Populated only where the mapping is obvious;
   * unmapped entries are intentionally left empty.
   */
  causeSubcategories?: DramaClubCauseSubcategory[];
};

export const IDENTITY_MAX = 3;
export const PRACTICE_MAX = 3;
export const EXPLORE_CARE_MAX = 4;

export const SELECTION_LIMITS: Record<TaxonomyLayer, number> = {
  identity: IDENTITY_MAX,
  practice: PRACTICE_MAX,
  exploreCare: EXPLORE_CARE_MAX,
};

export const LAYER_LABELS: Record<TaxonomyLayer, string> = {
  identity: "How I Identify",
  practice: "My Artistic Practice",
  exploreCare: "What I Explore & Care About in My Work",
};

export const LAYER_HELPER_COPY: Record<TaxonomyLayer, string> = {
  identity:
    "Optional self-identified tags that may help others understand your perspective and lived context.",
  practice:
    "Select the forms, methods, or modes of making that best reflect your work.",
  exploreCare:
    "Select the themes, questions, and causes that most shape your work.",
};

/* ----------------------------------------------------------------------------
 * 1) HOW I IDENTIFY — self-selected only, never inferred, no popularity sort.
 * -------------------------------------------------------------------------- */
export const IDENTITY_TAGS: TaxonomyTag[] = [
  { id: "queer",            label: "Queer",            layer: "identity", seeded: true,  sensitive: true, status: "active" },
  { id: "trans",            label: "Trans",            layer: "identity", seeded: true,  sensitive: true, status: "active" },
  { id: "nonbinary",        label: "Nonbinary",        layer: "identity", seeded: true,  sensitive: true, status: "active" },
  { id: "disabled",         label: "Disabled",         layer: "identity", seeded: true,  sensitive: true, status: "active" },
  { id: "neurodivergent",   label: "Neurodivergent",   layer: "identity", seeded: true,  sensitive: true, status: "active" },
  { id: "indigenous",       label: "Indigenous",       layer: "identity", seeded: true,  sensitive: true, status: "active" },
  { id: "immigrant",        label: "Immigrant",        layer: "identity", seeded: true,  sensitive: true, status: "active" },
  { id: "first-generation", label: "First-Generation", layer: "identity", seeded: true,  sensitive: true, status: "active" },
  { id: "diasporic",        label: "Diasporic",        layer: "identity", seeded: false, sensitive: true, status: "active" },
  { id: "parent",           label: "Parent",           layer: "identity", seeded: false, sensitive: true, status: "active" },
];

/* ----------------------------------------------------------------------------
 * 2) MY ARTISTIC PRACTICE — forms, methods, or modes of making.
 * -------------------------------------------------------------------------- */
export const PRACTICE_TAGS: TaxonomyTag[] = [
  { id: "teaching-artist",             label: "Teaching Artist",             layer: "practice", seeded: true,  sensitive: false, status: "active" },
  { id: "devised-theatre",             label: "Devised Theatre",             layer: "practice", seeded: true,  sensitive: false, status: "active", aliases: ["Devising", "Theatre Devising"] },
  { id: "physical-theatre",            label: "Physical Theatre",            layer: "practice", seeded: true,  sensitive: false, status: "active" },
  { id: "site-specific-performance",   label: "Site-Specific Performance",   layer: "practice", seeded: true,  sensitive: false, status: "active", aliases: ["Site-Specific Theatre"] },
  { id: "community-engaged-theatre",   label: "Community-Engaged Theatre",   layer: "practice", seeded: true,  sensitive: false, status: "active", aliases: ["Community-Engaged Art", "Community-Based Art"] },
  { id: "new-work-development",        label: "New Work Development",        layer: "practice", seeded: true,  sensitive: false, status: "active" },
  { id: "interdisciplinary-performance", label: "Interdisciplinary Performance", layer: "practice", seeded: true, sensitive: false, status: "active" },
  { id: "ensemble-creation",           label: "Ensemble Creation",           layer: "practice", seeded: true,  sensitive: false, status: "active" },
  { id: "immersive-theatre",           label: "Immersive Theatre",           layer: "practice", seeded: false, sensitive: false, status: "active" },
  { id: "documentary-theatre",         label: "Documentary Theatre",         layer: "practice", seeded: false, sensitive: false, status: "active" },
  { id: "cross-cultural-collaboration", label: "Cross-Cultural Collaboration", layer: "practice", seeded: false, sensitive: false, status: "active" },
];

/* ----------------------------------------------------------------------------
 * 3) WHAT I EXPLORE & CARE ABOUT IN MY WORK
 *    Artist-facing thematic layer. Where the meaning obviously overlaps with
 *    lib/causes.ts advocacy taxonomy, we link via causeSubcategories so future
 *    cause/theme pages can surface matching alumni. Entries with no clean
 *    mapping (e.g. Myth & Folklore) are intentionally left unmapped.
 * -------------------------------------------------------------------------- */
export const EXPLORE_CARE_TAGS: TaxonomyTag[] = [
  { id: "myth-and-folklore",        label: "Myth & Folklore",        layer: "exploreCare", seeded: true, sensitive: false, status: "active" },
  { id: "belonging",                label: "Belonging",              layer: "exploreCare", seeded: true, sensitive: false, status: "active" },
  {
    id: "identity-and-representation",
    label: "Identity & Representation",
    layer: "exploreCare",
    seeded: true,
    sensitive: false,
    status: "active",
    causeSubcategories: ["representation-in-the-arts", "equity-in-storytelling"],
  },
  {
    id: "migration-and-diaspora",
    label: "Migration & Diaspora",
    layer: "exploreCare",
    seeded: true,
    sensitive: false,
    status: "active",
    causeSubcategories: ["migration-refugee-rights"],
  },
  {
    id: "youth-voice",
    label: "Youth Voice",
    layer: "exploreCare",
    seeded: true,
    sensitive: false,
    status: "active",
    causeSubcategories: ["youth-leadership", "arts-access-for-youth"],
  },
  {
    id: "cultural-preservation",
    label: "Cultural Preservation",
    layer: "exploreCare",
    seeded: true,
    sensitive: false,
    status: "active",
    causeSubcategories: [
      "arts-cultural-preservation",
      "indigenous-cultural-preservation-traditional-knowledge",
      "arts-heritage-traditional-knowledge",
    ],
  },
  {
    id: "environmental-justice",
    label: "Environmental Justice",
    layer: "exploreCare",
    seeded: true,
    sensitive: false,
    status: "active",
    causeSubcategories: ["climate-justice", "community-led-conservation"],
  },
  {
    id: "arts-access",
    label: "Arts Access",
    layer: "exploreCare",
    seeded: true,
    sensitive: false,
    status: "active",
    causeSubcategories: ["arts-education-access", "artistic-rights-access"],
  },
  { id: "memory-and-history", label: "Memory & History", layer: "exploreCare", seeded: false, sensitive: false, status: "active" },
  {
    id: "education-equity",
    label: "Education Equity",
    layer: "exploreCare",
    seeded: false,
    sensitive: false,
    status: "active",
    causeSubcategories: ["education-equity", "reducing-barriers-to-education"],
  },
  {
    id: "community-empowerment",
    label: "Community Empowerment",
    layer: "exploreCare",
    seeded: false,
    sensitive: false,
    status: "active",
    causeSubcategories: ["local-leadership-capacity-building", "community-creative-expression"],
  },
  { id: "place-and-landscape", label: "Place & Landscape", layer: "exploreCare", seeded: false, sensitive: false, status: "active" },
];

/* ----------------------------------------------------------------------------
 * Unified registry
 * -------------------------------------------------------------------------- */
export const ALL_TAGS: TaxonomyTag[] = [
  ...IDENTITY_TAGS,
  ...PRACTICE_TAGS,
  ...EXPLORE_CARE_TAGS,
];

const TAGS_BY_LAYER: Record<TaxonomyLayer, TaxonomyTag[]> = {
  identity: IDENTITY_TAGS,
  practice: PRACTICE_TAGS,
  exploreCare: EXPLORE_CARE_TAGS,
};

export function getTagsForLayer(layer: TaxonomyLayer): TaxonomyTag[] {
  return TAGS_BY_LAYER[layer] ?? [];
}

export function getSeededTagsForLayer(layer: TaxonomyLayer): TaxonomyTag[] {
  return getTagsForLayer(layer).filter((t) => t.seeded && t.status === "active");
}

export function getActiveTagsForLayer(layer: TaxonomyLayer): TaxonomyTag[] {
  return getTagsForLayer(layer).filter((t) => t.status === "active");
}

/** Compare strings loosely: lower-cased, apostrophes stripped, non-alphanum collapsed. */
function looseKey(s: string): string {
  return String(s || "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Find a tag by label or alias, optionally scoped to a layer. */
export function findTagByLabelOrAlias(
  raw: string,
  layer?: TaxonomyLayer
): TaxonomyTag | null {
  const needle = looseKey(raw);
  if (!needle) return null;
  const pool = layer ? getTagsForLayer(layer) : ALL_TAGS;
  for (const tag of pool) {
    if (looseKey(tag.label) === needle) return tag;
    if (looseKey(tag.id) === needle) return tag;
    if (tag.aliases?.some((a) => looseKey(a) === needle)) return tag;
  }
  return null;
}

/** True when `raw` matches a canonical tag (by label, id, or alias). */
export function isCanonicalTag(raw: string, layer?: TaxonomyLayer): boolean {
  return !!findTagByLabelOrAlias(raw, layer);
}

/**
 * Filter a free-form list of tag strings down to canonical labels for a layer,
 * preserving order and removing duplicates. Non-canonical values are dropped.
 */
export function filterToCanonicalLabels(
  raw: unknown,
  layer: TaxonomyLayer
): string[] {
  const arr = Array.isArray(raw)
    ? raw
    : typeof raw === "string"
      ? raw.split(/[,;\n|]/g)
      : [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of arr) {
    const tag = findTagByLabelOrAlias(String(item ?? "").trim(), layer);
    if (!tag) continue;
    if (seen.has(tag.id)) continue;
    seen.add(tag.id);
    out.push(tag.label);
  }
  return out;
}

/** Enforce selection limit for a layer, preserving order. */
export function enforceLimit(labels: string[], layer: TaxonomyLayer): string[] {
  return labels.slice(0, SELECTION_LIMITS[layer]);
}

/** Which layer does a given (canonical) tag belong to? Null if not canonical. */
export function getLayerForTag(raw: string): TaxonomyLayer | null {
  const tag = findTagByLabelOrAlias(raw);
  return tag ? tag.layer : null;
}

/** All search tokens (labels + aliases) for a tag — used by search indexing. */
export function searchTokensFor(tag: TaxonomyTag): string[] {
  return [tag.label, ...(tag.aliases ?? [])];
}
