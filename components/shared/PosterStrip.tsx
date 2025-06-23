"use client";

import { PosterData } from "@/lib/types";

interface PosterStripProps {
  posters: PosterData[];
}

export default function PosterStrip({ posters }: PosterStripProps) {
  if (!posters?.length) return null;

  return (
    <div className="flex overflow-x-auto gap-8 md:gap-10 snap-x snap-mandatory justify-end">
      {posters.map((poster, index) => (
        <div
          key={index}
          className="flex-shrink-0 snap-start w-[300px] box-border"
        >
          <a
            href={poster.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group block border-4 border-transparent hover:border-[#F23359] transition-all duration-300 overflow-hidden"
            style={{ lineHeight: 0 }} // eliminates any extra spacing
          >
            <img
              src={poster.posterUrl}
              alt={poster.title}
              className="w-full h-auto block"
            />
          </a>

          <div className="text-center mt-3 pt-1">
  <div
    className="text-[#D9A919] font-bold text-lg"
    style={{ fontFamily: '"Space Grotesk", sans-serif' }}
  >
    {poster.title}
  </div>
</div>
        </div>
      ))}
    </div>
  );
}
