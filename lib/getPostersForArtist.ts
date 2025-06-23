// lib/getPostersForArtist.ts
import {
  productionMap,
  Layout,
  TitlePosition,
  Production,
} from "@/lib/productionMap";

const validLayouts: Layout[] = ["landscape", "portrait"];
const validTitlePositions: TitlePosition[] = ["bottom-left", "bottom-center"];

export function getPostersForArtist(slug: string) {
  return Object.values(productionMap)
    .filter(
      (production): production is Production =>
        !!production.artists && slug in production.artists
    )
    .map((production) => {
      const layout: Layout = validLayouts.includes(production.layout as Layout)
        ? (production.layout as Layout)
        : "landscape";

      const titlePosition: TitlePosition = validTitlePositions.includes(
        production.titlePosition as TitlePosition
      )
        ? (production.titlePosition as TitlePosition)
        : "bottom-left";

      return {
        title: production.title,
        slug: production.slug,
        url: production.url ?? `https://www.dramaticadventure.com/${production.slug}`,
        posterUrl: `/posters/${production.slug}-landscape.jpg`,
        layout,
        titlePosition,
      };
    });
}
