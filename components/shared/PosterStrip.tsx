// components/shared/PosterStrip.tsx

"use client";

import { PosterData } from "@/lib/types";

interface PosterStripProps {
  posters: PosterData[];
}

export default function PosterStrip({ posters }: PosterStripProps) {
  if (!posters?.length) return null;

  return (
    <div className="flex flex-wrap justify-center gap-6 px-4 md:px-[60px]">
      {posters.map((poster, index) => (
        <div
          key={index}
          className="flex-grow max-w-[calc(33.333%-1.5rem)] min-w-[300px]"
          style={{ flexBasis: "calc(33.333% - 1.5rem)" }}
        >
          <a
            href={poster.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group block border-4 border-transparent hover:border-[#F23359] transition-all duration-300 overflow-hidden"
            style={{ lineHeight: 0 }}
          >
            <img
              src={poster.posterUrl}
              alt={poster.title}
              className="w-full h-auto block"
              style={{
                aspectRatio: "16/9",
                objectFit: "cover",
              }}
            />
          </a>

          <div className="text-center mt-4 px-2">
            <div
              className="text-[#D9A919] text-lg font-extrabold tracking-tight"
              style={{
                fontFamily: '"Space Grotesk", sans-serif',
                lineHeight: "1.3",
              }}
            >
              {poster.title}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
