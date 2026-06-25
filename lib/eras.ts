// lib/eras.ts
//
// SINGLE SOURCE OF TRUTH for DAT eras.
//
// These eras anchor blocks of seasons and are shared by:
//   • /theatre   (app/theatre/page.tsx)   — Theatre Archive era sections
//   • /projects  (app/projects/page.tsx)  — Project Archive era sections
//   • Collective Artist ordering (lib/deriveCollectiveArtist.ts) — recency weight
//
// 🔧 TO CHANGE THE ERAS: edit DAT_ERAS below. The archive pages read their
// structure (label, seasons, years, geography) from here and supply only their
// own per-era images; the Collective Artist score derives its recency weights
// from here too. Keep the array ordered OLDEST → NEWEST.

export interface DatEra {
  /** Stable id used to attach page-specific images (e.g. "era-7"). */
  id: string;
  /** Display label, e.g. "The Present Tense". */
  label: string;
  /** DAT season numbers that belong to this era. */
  seasons: readonly number[];
  /** Human year range, e.g. "2021–2025". */
  years: string;
  /** Short geography summary, e.g. "Ecuador · Slovakia · Hudson Valley". */
  geography: string;
}

/** Ordered OLDEST → NEWEST. */
export const DAT_ERAS: readonly DatEra[] = [
  {
    id: "era-1",
    label: "The Beginning",
    seasons: [1, 2],
    years: "2006–2008",
    geography: "Zimbabwe · Ecuador · USA",
  },
  {
    id: "era-2",
    label: "Hecho en Ecuador",
    seasons: [3],
    years: "2008–2009",
    geography: "Ecuador · NYC",
  },
  {
    id: "era-3",
    label: "Finding the Form",
    seasons: [4, 5, 6],
    years: "2009–2012",
    geography: "Ecuador · Slovakia · Washington D.C.",
  },
  {
    id: "era-4",
    label: "The Story Deepens",
    seasons: [7, 8],
    years: "2012–2014",
    geography: "Slovakia · Ecuador · NYC",
  },
  {
    id: "era-5",
    label: "The Wide World",
    seasons: [9, 10],
    years: "2014–2016",
    geography: "Tanzania · Zanzibar · Slovakia · Ecuador",
  },
  {
    id: "era-6",
    label: "Into the Margins",
    seasons: [11, 12, 13, 14, 15],
    years: "2016–2021",
    geography: "Ecuador · Galápagos · Slovakia · USA",
  },
  {
    id: "era-7",
    label: "The Present Tense",
    seasons: [16, 17, 18, 19],
    years: "2021–2025",
    geography: "Ecuador · Slovakia · Hudson Valley",
  },
  {
    id: "era-8",
    label: "A New Era",
    seasons: [20],
    years: "2025–present",
    geography: "TBA",
  },
];

/** Floor weight for seasons that fall outside every defined era. */
export const ERA_WEIGHT_FLOOR = 1;

/**
 * season → recency weight. The NEWEST era (last in DAT_ERAS) carries the most
 * weight and it degrades era by era: oldest era = 1 … newest era = DAT_ERAS.length.
 * Built once from DAT_ERAS, so changing the eras automatically reweights.
 */
const SEASON_TO_ERA_WEIGHT: ReadonlyMap<number, number> = (() => {
  const m = new Map<number, number>();
  DAT_ERAS.forEach((era, index) => {
    const weight = index + 1; // index 0 = oldest era → weight 1
    for (const season of era.seasons) m.set(season, weight);
  });
  return m;
})();

/**
 * Recency weight for a DAT season, derived dynamically from DAT_ERAS.
 * Most recent era weighted highest; unknown/missing seasons get the floor.
 */
export function eraRecencyWeightForSeason(
  season: number | undefined | null
): number {
  if (typeof season !== "number" || !Number.isFinite(season)) {
    return ERA_WEIGHT_FLOOR;
  }
  return SEASON_TO_ERA_WEIGHT.get(season) ?? ERA_WEIGHT_FLOOR;
}

/** The era a season belongs to (or null if it falls outside every era). */
export function eraForSeason(season: number | undefined | null): DatEra | null {
  if (typeof season !== "number" || !Number.isFinite(season)) return null;
  return DAT_ERAS.find((era) => era.seasons.includes(season)) ?? null;
}
