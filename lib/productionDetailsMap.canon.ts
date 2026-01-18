// lib/productionDetailsMap.canon.ts
export type ProductionDetails = {
  slug: string;
  heroImageUrl?: string;
  city?: string;
  dates?: string;
  [key: string]: any;
};

/**
 * Bridge re-export to guarantee runtime data exists.
 * Replace later when you fully canonize the details map.
 */
import { productionDetailsMap as rawProductionDetailsMap } from "@/lib/productionDetailsMap";

export const productionDetailsMap: Record<string, ProductionDetails> =
  rawProductionDetailsMap as unknown as Record<string, ProductionDetails>;
