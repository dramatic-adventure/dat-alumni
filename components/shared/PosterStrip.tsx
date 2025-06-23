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
            style={{ lineHeight: 0 }}
          >
            <img
              src={poster.posterUrl}
              alt={poster.title}
              className="w-full h-auto block"
            />
          </a>

          <div className="text-center mt-6">
            <div
              className="text-[#D9A919] text-xl font-extrabold tracking-tight"
              style={{
                fontFamily: '"Space Grotesk", sans-serif',
                paddingTop: "0.5rem",
                maxWidth: "260px", // 👈 triggers earlier wraparound
                margin: "0 auto", // centers the constrained text
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
