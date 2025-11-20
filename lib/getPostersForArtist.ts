// lib/getPostersForArtist.ts
import {
  productionMap,
  type Layout,
  type TitlePosition,
  type Production,
} from "@/lib/productionMap";
import { getProductionPath } from "@/lib/getProductionPath";

const validLayouts: Layout[] = ["landscape", "portrait"];
const validTitlePositions: TitlePosition[] = ["bottom-left", "bottom-center"];

export interface ArtistPoster {
  title: string;
  slug: string;
  url: string;
  posterUrl: string;
  layout: Layout;
  titlePosition: TitlePosition;
}

export function getPostersForArtist(slug: string): ArtistPoster[] {
  return Object.values(productionMap)
    .filter(
      (production): production is Production =>
        !!production.artists && slug in production.artists,
    )
    .map((production) => {
      const layout: Layout =
        production.layout && validLayouts.includes(production.layout)
          ? production.layout
          : "landscape";

      const titlePosition: TitlePosition =
        production.titlePosition &&
        validTitlePositions.includes(production.titlePosition)
          ? production.titlePosition
          : "bottom-left";

      // 👇 This is now your link target
      const url = getProductionPath(production);

      const posterUrl =
        production.posterUrl && production.posterUrl.trim().length > 0
          ? production.posterUrl
          : `/posters/${production.slug}-${layout}.jpg`;

      return {
        title: production.title,
        slug: production.slug,
        url,
        posterUrl,
        layout,
        titlePosition,
      };
    });
}

