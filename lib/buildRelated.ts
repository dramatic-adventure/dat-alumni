// lib/buildRelated.ts
import { productionMap, type Production } from "@/lib/productionMap";
import {
  productionDetailsMap,
  type ProductionExtra,
} from "@/lib/productionDetailsMap";

/* -------------------------- Types -------------------------- */

export type RelatedItem = {
  slug: string;
  title: string;

  heroImageUrl?: string;
  dates?: string;

  seasonLabel?: string;

  kind: "production" | "project";
  score?: number;

  baseTitle?: string;
};

export type BuildRelatedResult = {
  baseTitle: string;
  items: RelatedItem[];
};

/* ----------------------- Title helpers ---------------------- */

function getBaseTitleFromRawTitle(raw: string): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  const idx = trimmed.indexOf("--");
  const main = idx === -1 ? trimmed : trimmed.slice(0, idx);
  return main.replace(/\s+/g, " ").trim();
}

function normalizeTitle(s: string): string {
  return (s || "").toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Source of truth for baseTitle:
 * 1) productionDetailsMap[slug].relatedBaseTitle (if provided)
 * 2) otherwise derive from productionMap[slug].title (split on "--")
 */
function resolveBaseTitle(slug: string, base: Production, extra?: ProductionExtra): string {
  const override = extra?.relatedBaseTitle?.trim();
  if (override) return override.replace(/\s+/g, " ").trim();
  return getBaseTitleFromRawTitle(base.title);
}

/* ----------------------- Image helpers ---------------------- */

function normalizeImagePath(input?: string | null): string | undefined {
  if (!input) return undefined;

  const raw = input.trim();
  if (!raw) return undefined;

  if (/^https?:\/\//i.test(raw)) return raw;

  if (raw.startsWith("public/")) {
    const withoutPublic = raw.slice("public/".length);
    return `/${withoutPublic.replace(/^\/+/, "")}`;
  }

  if (raw.startsWith("/")) return raw;

  return `/${raw.replace(/^\/+/, "")}`;
}

function getHeroImageUrl(
  slug: string,
  base: Production,
  extra?: ProductionExtra
): string | undefined {
  const normalizedPosterUrl =
    base.posterUrl &&
    (base.posterUrl.includes("-landscape") ||
      base.posterUrl.includes("-portrait"))
      ? base.posterUrl
      : undefined;

  const candidates: Array<string | undefined> = [
    extra?.heroImageUrl,
    `/posters/${slug}-landscape.jpg`,
    `/posters/${slug}-portrait.jpg`,
    normalizedPosterUrl,
    "/posters/fallback-16x9.jpg",
  ];

  for (const raw of candidates) {
    const normalized = normalizeImagePath(raw);
    if (normalized) return normalized;
  }

  return undefined;
}

/* ----------------------- Scoring helpers -------------------- */

function intersectCount(a?: string[], b?: string[]): number {
  if (!a?.length || !b?.length) return 0;
  const setA = new Set(a.map((x) => x.toLowerCase()));
  let count = 0;
  for (const item of b) {
    if (setA.has(item.toLowerCase())) count++;
  }
  return count;
}

function sharedArtistCount(a: Production, b: Production): number {
  const aPeople = Object.keys(a.artists ?? {});
  const bPeople = Object.keys(b.artists ?? {});
  if (!aPeople.length || !bPeople.length) return 0;

  const setA = new Set(aPeople);
  let count = 0;
  for (const p of bPeople) if (setA.has(p)) count++;
  return count;
}

/* -------------------------- Main API ------------------------ */

export function buildRelated(currentSlug: string, limit = 8): BuildRelatedResult {
  const currentBase = productionMap[currentSlug];
  if (!currentBase) return { baseTitle: "", items: [] };

  const currentExtra = productionDetailsMap[currentSlug];
  const currentBaseTitle = resolveBaseTitle(currentSlug, currentBase, currentExtra);
  const currentThemes = currentExtra?.themes ?? [];
  const currentLocation = currentBase.location ?? "";

  const candidates: Array<RelatedItem & { _score: number; _year: number }> = [];

  for (const [slug, base] of Object.entries(productionMap)) {
    if (slug === currentSlug) continue;

    const extra = productionDetailsMap[slug];
    const baseTitle = resolveBaseTitle(slug, base, extra);

    let score = 0;

    // Same “cycle” / same base title
    if (normalizeTitle(baseTitle) === normalizeTitle(currentBaseTitle)) {
      score += 100;
    }

    // Thematic similarity
    score += intersectCount(currentThemes, extra?.themes) * 10;

    // Shared artists
    score += sharedArtistCount(currentBase, base) * 2;

    // Same location bump
    if (
      currentLocation &&
      base.location &&
      currentLocation.toLowerCase() === base.location.toLowerCase()
    ) {
      score += 5;
    }

    if (score <= 0) continue;

    const seasonLabel =
      base.season != null
        ? `Season ${base.season} • ${base.year}`
        : String(base.year);

    const dates = extra?.dates || base.festival || String(base.year);

    // Coerce year into a real number for sorting
    const yearNum =
      typeof base.year === "number"
        ? base.year
        : Number(String(base.year).match(/\d{4}/)?.[0]) || 0;

    candidates.push({
      slug,
      title: base.title,
      baseTitle,
      kind: "production",
      _score: score,
      _year: yearNum,
      score,
      seasonLabel,
      dates,
      heroImageUrl: getHeroImageUrl(slug, base, extra),
    });
  }

  candidates.sort((a, b) => {
    if (b._score !== a._score) return b._score - a._score;
    return b._year - a._year;
  });

  const items = candidates
    .slice(0, limit)
    .map(({ _score, _year, ...rest }) => rest);

  return {
    baseTitle: currentBaseTitle,
    items,
  };
}

// Back-compat alias for older imports
export const buildRelatedProductions = buildRelated;
