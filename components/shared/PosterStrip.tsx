// components/shared/PosterStrip.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import type { PosterData } from "@/lib/types";

interface PosterStripProps {
  posters: PosterData[];
}

export default function PosterStrip({ posters }: PosterStripProps) {
  const [expanded, setExpanded] = useState(false);
  if (!posters?.length) return null;

  const visiblePosters = expanded ? posters : posters.slice(0, 3);
  const hasExtra = posters.length > 3;

  return (
    <div>
      {/* Poster Grid */}
      <div className="flex flex-wrap justify-center gap-6">
        {visiblePosters.map((poster, index) => {
          const basis =
            visiblePosters.length === 1
              ? "100%"
              : visiblePosters.length === 2
              ? "calc((100% - 1.5rem) / 2)"
              : "calc((100% - 3rem) / 3)";

        return (
          <div
            key={index}
            className="flex-1 min-w-[300px] max-w-full flex flex-col items-center"
            style={{ flexBasis: basis }}
          >
            {/* Image with Hover Border */}
            <a
              href={poster.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block group relative w-full"
              style={{ lineHeight: 0 }}
            >
              {/* Aspect wrapper for next/image fill */}
              <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
                <Image
                  src={poster.posterUrl}
                  alt={poster.title}
                  fill
                  className="object-cover block border-4 border-transparent transition-all duration-300 group-hover:border-[#f23359]"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  priority={false}
                />
              </div>
            </a>

            {/* Title under image */}
            <div className="text-center mt-4" style={{ width: "60%", paddingBottom: "2rem" }}>
              <div
                className="text-[#D9A919] tracking-tight leading-snug"
                style={{
                  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                  fontWeight: 500,
                  fontSize: "1.15rem",
                  wordWrap: "break-word",
                }}
              >
                {poster.title}
              </div>
            </div>
          </div>
        )})}
      </div>

      {/* See More / See Less Button */}
      {hasExtra && (
        <div className="flex justify-end mt-6">
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.35rem",
              fontSize: "1.2rem",
              color: "#241123",
              backgroundColor: "#3FA9BE",
              padding: "18px 40px",
              border: "none",
              borderRadius: "12px",
              cursor: "pointer",
              transition: "opacity 0.3s ease-in-out",
              opacity: 1,
              marginBottom: "0.5rem",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            {expanded ? "Show Less Productions" : "Show All My Productions"}
          </button>
        </div>
      )}
    </div>
  );
}
