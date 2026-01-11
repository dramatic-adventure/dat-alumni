// lib/getActiveProductions.ts
import { productionMap } from "@/lib/productionMap";
import { PRODUCTION_FUNDRAISING_BY_SLUG } from "@/lib/productionFundraising";

export function getActiveProductions() {
  return Object.values(productionMap)
    .map((p) => {
      const meta = PRODUCTION_FUNDRAISING_BY_SLUG[p.slug];
      if (!meta?.is_active) return null;

      return {
        id: p.slug,
        label: meta.label ?? p.title,
        subline: meta.subline,
      };
    })
    .filter(Boolean) as { id: string; label: string; subline?: string }[];
}
