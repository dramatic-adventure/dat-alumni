"use client";

import { PosterData } from "@/lib/types";

interface FeaturedProductionsSectionProps {
  posters: PosterData[];
  heading?: string;
}

export default function FeaturedProductionsSection({
  posters,
  heading = "Featured Productions",
}: FeaturedProductionsSectionProps) {
  if (!posters?.length) return null;

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
        {/* Left Column: Heading and Description */}
        <div className="md:col-span-1">
          {heading && (
            <>
              <h2 className="text-xl font-semibold tracking-wide uppercase text-[#241123] mb-2">
                {heading}
              </h2>
              <p className="text-[#241123] text-sm leading-snug">
                Developed through cross-cultural exchange and a fearless approach to
                storytelling, these productions reflect a deep engagement with place,
                people, and purpose.
              </p>
            </>
          )}
        </div>

        {/* Right Column: Posters */}
        <div className="md:col-span-3">
          <div className="flex overflow-x-auto gap-6 pb-4 pr-2">
            {posters.map((poster, index) => (
              <a
                key={index}
                href={poster.url} // ✅ Now uses full external URL
                target="_blank"
                rel="noopener noreferrer"
                className="block w-[300px] flex-shrink-0"
              >
                <img
                  src={poster.posterUrl}
                  alt={poster.title}
                  className="w-full h-auto rounded shadow-md hover:opacity-90 transition-opacity duration-200"
                />
                <div className="text-[#241123] leading-tight mt-3 text-center font-semibold text-base font-dm-sans">
                  {poster.title}
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
