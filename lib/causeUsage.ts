// lib/causeUsage.ts

import { productionMap, type Production } from "@/lib/productionMap";
import {
  productionDetailsMap,
  type ProductionExtra,
  type CauseItem,
} from "@/lib/productionDetailsMap";

import { stories, type Story } from "@/lib/stories";
import { dramaClubs, type DramaClub } from "@/lib/dramaClubs";

import {
  CAUSE_CATEGORIES_BY_ID,
  CAUSE_SUBCATEGORIES_BY_CATEGORY,
  type DramaClubCauseCategory,
  type DramaClubCauseSubcategory,
  type DramaClubCauseSubcategoryMeta,
} from "@/lib/causes";

import { slugifyTag as slugify, getCanonicalTag } from "@/lib/tags";

/**
 * A single "used cause" in the system, enriched with count & labels.
 */
export type UsedCause = {
  id: DramaClubCauseSubcategory;
  label: string;
  shortLabel?: string;
  categoryId: DramaClubCauseCategory;
  count: number;
};

/**
 * Group of used causes for a single high-level category.
 */
export type UsedCauseGroup = {
  category: (typeof CAUSE_CATEGORIES_BY_ID)[DramaClubCauseCategory];
  causes: UsedCause[];
};

/**
 * Internal lookup:
 * subcategory id → { meta, categoryId }
 */
const SUB_BY_ID: Record<
  DramaClubCauseSubcategory,
  { meta: DramaClubCauseSubcategoryMeta; categoryId: DramaClubCauseCategory }
> = (() => {
  const acc = {} as Record<
    DramaClubCauseSubcategory,
    { meta: DramaClubCauseSubcategoryMeta; categoryId: DramaClubCauseCategory }
  >;

  (Object.entries(CAUSE_SUBCATEGORIES_BY_CATEGORY) as [
    DramaClubCauseCategory,
    DramaClubCauseSubcategoryMeta[]
  ][]).forEach(([categoryId, list]) => {
    list.forEach((sub) => {
      acc[sub.id as DramaClubCauseSubcategory] = {
        meta: sub,
        categoryId,
      };
    });
  });

  return acc;
})();

/**
 * Global usage counter, computed once at module import.
 *
 * key: subcategory id
 * value: number of times it was referenced anywhere
 */
const usedCounts = new Map<DramaClubCauseSubcategory, number>();

const bump = (id: DramaClubCauseSubcategory | undefined | null) => {
  if (!id) return;
  if (!SUB_BY_ID[id as DramaClubCauseSubcategory]) return;
  const current = usedCounts.get(id as DramaClubCauseSubcategory) ?? 0;
  usedCounts.set(id as DramaClubCauseSubcategory, current + 1);
};

const bumpBySlugLike = (raw: string | undefined | null) => {
  if (!raw) return;
  const canonical = getCanonicalTag(raw) ?? raw;
  const s = slugify(canonical).toLowerCase();

  if ((SUB_BY_ID as any)[s]) {
    bump(s as DramaClubCauseSubcategory);
  }
};

/* ----------------------------------------
 * Scan DRAMA CLUBS
 * ------------------------------------- */

(function scanDramaClubs() {
  const clubs = dramaClubs as DramaClub[];

  for (const club of clubs) {
    // New taxonomy-style causes: { category, subcategory }
    const rawCauses = (club as any).causes as
      | { category: DramaClubCauseCategory; subcategory: DramaClubCauseSubcategory }[]
      | undefined;

    if (Array.isArray(rawCauses)) {
      for (const c of rawCauses) {
        bump(c?.subcategory);
      }
    }

    // Legacy string tags: try to map to subcategory IDs by slug
    const tags = (club as any).causeTags as string[] | undefined;
    if (Array.isArray(tags)) {
      for (const tag of tags) {
        bumpBySlugLike(tag);
      }
    }
  }
})();

/* ----------------------------------------
 * Scan PRODUCTIONS
 * ------------------------------------- */

(function scanProductions() {
  const allProductions: Production[] = Object.values(productionMap);

  for (const prod of allProductions) {
    const extra = productionDetailsMap[prod.slug] as ProductionExtra | undefined;
    const causes = (extra?.causes ?? []) as CauseItem[];

    for (const cause of causes) {
      const anyCause = cause as any;

      // If you later add { subcategory } to CauseItem, this supports it:
      if (anyCause?.subcategory) {
        bump(anyCause.subcategory as DramaClubCauseSubcategory);
        continue;
      }

      // Fallback: label-based, via slug matching
      if (cause?.label) {
        bumpBySlugLike(cause.label);
      }
    }
  }
})();

/* ----------------------------------------
 * Scan STORIES
 * ------------------------------------- */

(function scanStories() {
  const allStories = stories as Story[];

  for (const story of allStories) {
    const tags = (story as any).causeTags as string[] | undefined;
    if (!Array.isArray(tags)) continue;

    for (const tag of tags) {
      bumpBySlugLike(tag);
    }
  }
})();

/* ----------------------------------------
 * Public API
 * ------------------------------------- */

/**
 * Returns the list of "other causes we champion", grouped by category,
 * including ONLY subcategories that are actually used somewhere
 * (drama clubs, productions, or stories).
 *
 * If `currentSubId` is provided, that cause is excluded from the result
 * so we don't link to the page we're already on.
 */
export function getUsedCauseGroups(
  currentSubId?: DramaClubCauseSubcategory
): UsedCauseGroup[] {
  const groupsByCat = new Map<DramaClubCauseCategory, UsedCause[]>();

  for (const [subId, count] of usedCounts.entries()) {
    if (!count) continue;
    if (currentSubId && subId === currentSubId) continue;

    const entry = SUB_BY_ID[subId];
    if (!entry) continue;

    const { meta, categoryId } = entry;

    const list = groupsByCat.get(categoryId) ?? [];
    list.push({
      id: subId,
      label: meta.label,
      shortLabel: meta.shortLabel,
      categoryId,
      count,
    });
    groupsByCat.set(categoryId, list);
  }

  const result: UsedCauseGroup[] = [];

  for (const [categoryId, causes] of groupsByCat.entries()) {
    const catMeta = CAUSE_CATEGORIES_BY_ID[categoryId];
    if (!catMeta) continue;

    // Sort causes alphabetically within each category
    causes.sort((a, b) =>
      a.label.localeCompare(b.label, undefined, { sensitivity: "base" })
    );

    result.push({
      category: catMeta,
      causes,
    });
  }

  // Sort categories alphabetically by label/short label
  result.sort((a, b) =>
    (a.category.shortLabel ?? a.category.label).localeCompare(
      b.category.shortLabel ?? b.category.label,
      undefined,
      { sensitivity: "base" }
    )
  );

  return result;
}
