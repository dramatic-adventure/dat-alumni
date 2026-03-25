// lib/productionMap.canon.ts
export type Layout = "landscape" | "portrait";
export type TitlePosition = "bottom-left" | "bottom-center";

export interface Production {
  title: string;
  slug: string;
  year: number | string;
  season: number;
  location: string;
  venue?: string;
  festival?: string;
  url?: string;
  posterUrl?: string;
  artists: Record<string, string[]>;
  layout?: Layout;
  titlePosition?: TitlePosition;
}

/**
 * IMPORTANT:
 * This file must EXPORT the live map object used throughout the app.
 * If your canon migration isn’t done yet, re-export the existing map as a bridge.
 */
import {
  productionMap as rawProductionMap,
  getSortYear as rawGetSortYear,
} from "./productionMap";

export const productionMap: Record<string, Production> =
  rawProductionMap as unknown as Record<string, Production>;

export function getSortYear(prod: Production): number {
  return rawGetSortYear(prod as any);
}
