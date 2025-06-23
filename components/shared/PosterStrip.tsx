"use client";

import { PosterData } from "@/lib/types";

interface PosterStripProps {
  posters: PosterData[];
  heading?: string;
}

export default function PosterStrip({ posters, heading }: PosterStripProps) {
  if (!posters?.length) return null;

  return (
    <section className="w-full pr-2">
      <div className="flex overflow-x-auto gap-8 md:gap-10 snap-x snap-mandatory justify-end">
        {posters.map((poster, index) => (
          <a
            key={index}
            href={poster.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-[300px] flex-shrink-0 snap-start"
          >
            <div className="overflow-hidden border-4 border-transparent hover:border-[#F23359] transition-transform transform hover:scale-105 box-border">
              <img
                src={poster.posterUrl}
                alt={poster.title}
                className="w-full block align-middle"
              />
            </div>
            <div className="text-white leading-tight mt-0 text-center">
              <div
                className="font-semibold text-base underline underline-offset-2"
                style={{ fontFamily: '"DM Sans", sans-serif' }}
              >
                {poster.title}
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
