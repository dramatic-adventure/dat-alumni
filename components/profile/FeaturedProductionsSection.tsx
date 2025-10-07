// components/profile/FeaturedProductionsSection.tsx

import PosterStrip from "@/components/shared/PosterStrip";
import { productionMap } from "@/lib/productionMap";

export default function FeaturedProductionsSection({ slug }: { slug: string }) {
  const featuredProductions = Object.values(productionMap)
    .filter((p) => p?.artists?.[slug])
    .sort((a, b) => b.year - a.year)
    .slice(0, 3);

  if (featuredProductions.length === 0) return null;

  return (
    <div className="bg-[#19657c] py-[30px] m-0">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1">
          <div className="px-[60px]">
            <h2
              className="text-6xl text-[#D9A919] mb-4"
              style={{ fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif' }}
            >
              Featured DAT Work
            </h2>
            <p
              className="text-[#2493A9] text-lg max-w-3xl"
              style={{ fontFamily: 'var(--font-dm-sans), system-ui, sans-serif' }}
            >
              Developed through cross-cultural exchange and a fearless approach to storytelling,
              this work reflects a deep engagement with place, people, and purpose.
            </p>
          </div>

          <div className="flex justify-end mt-[4px]">
            <div className="pr-[60px]">
              <PosterStrip
                posters={featuredProductions.map((p) => ({
                  posterUrl: `/posters/${p.slug}-landscape.jpg`,
                  url: `https://www.dramaticadventure.com${p.url}`,
                  title: p.title,
                }))}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
