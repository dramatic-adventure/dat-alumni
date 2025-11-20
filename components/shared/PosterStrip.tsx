// components/shared/PosterStrip.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import type { PosterData } from "@/lib/types";

interface PosterStripProps {
  posters: PosterData[];
}

// Make sure this file actually exists at public/posters/fallback-16x9.jpg
// For debugging you can temporarily set this to "/images/default-headshot.png"
const FALLBACK_POSTER_URL = "/posters/fallback-16x9.jpg";

type LayoutMode = "mobile" | "tablet" | "desktop";

export default function PosterStrip({ posters }: PosterStripProps) {
  const [expanded, setExpanded] = useState(false);
  const [layout, setLayout] = useState<LayoutMode>("desktop");

  // Track which posters have errored so we can swap to fallback via React state
  const [errorMap, setErrorMap] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (typeof window === "undefined") return;

    const getLayout = (): LayoutMode => {
      const w = window.innerWidth;
      if (w < 640) return "mobile"; // phone
      if (w < 1024) return "tablet"; // iPad-ish
      return "desktop";
    };

    const handleResize = () => {
      setLayout(getLayout());
    };

    setLayout(getLayout());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!posters?.length) return null;

  const visiblePosters = expanded ? posters : posters.slice(0, 3);
  const hasExtra = posters.length > 3;

  return (
    <>
      <div>
        {/* Poster Grid */}
        <div className="flex flex-wrap justify-center gap-x-10 gap-y-12">
          {visiblePosters.map((poster, index) => {
            const itemCount = visiblePosters.length;

            // Responsive 3 / 2 / 1 layout
            let basis: string;
            if (layout === "mobile") {
              // Always single column
              basis = "100%";
            } else if (layout === "tablet") {
              // iPad: 1 poster -> full; 2+ -> 2-up
              basis =
                itemCount === 1
                  ? "100%"
                  : "calc((100% - 2.5rem) / 2)"; // 2.5rem = gap-x-10
            } else {
              // Desktop
              basis =
                itemCount === 1
                  ? "100%"
                  : itemCount === 2
                  ? "calc((100% - 2.5rem) / 2)"
                  : "calc((100% - 5rem) / 3)"; // 2 gaps (2.5rem each) across 3 cols
            }

            const key = `${(poster as any).slug ?? poster.url ?? "poster"}-${index}`;

            // Decide which src to use: original or fallback
            const hasValidPosterUrl =
              typeof poster.posterUrl === "string" &&
              poster.posterUrl.trim().length > 0;

            const shouldUseFallback = errorMap[index] || !hasValidPosterUrl;
            const posterSrc = shouldUseFallback
              ? FALLBACK_POSTER_URL
              : poster.posterUrl!.trim();

            const isExternal = poster.url?.startsWith("http");

            const PosterInner = (
              <div
                className="poster-card-inner relative w-full overflow-hidden bg-black shadow-md transition-transform duration-300 ease-out group-hover:-translate-y-1 group-hover:scale-[1.12] group-hover:shadow-[0_26px_60px_rgba(0,0,0,0.85)]"
                style={{ aspectRatio: "16 / 9" }}
              >
                {/* Poster image */}
                <Image
                  src={posterSrc}
                  alt={poster.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  priority={false}
                  onError={() => {
                    // If the original fails, mark this index as errored
                    setErrorMap((prev) =>
                      prev[index] ? prev : { ...prev, [index]: true }
                    );
                  }}
                />

                {/* Sheen (sits on top of the image) */}
                <span className="poster-sheen" />
              </div>
            );

            return (
              <div
                key={key}
                className="flex-1 max-w-full flex flex-col items-center"
                style={{
                  flexBasis: basis,
                  paddingInline: "1.25rem", // breathing room around each poster
                  paddingBlock: "0.5rem",
                }}
              >
                <div className="poster-card group relative w-full" style={{ lineHeight: 0 }}>
                  {isExternal ? (
                    <a
                      href={poster.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full"
                    >
                      {PosterInner}
                    </a>
                  ) : (
                    <Link href={poster.url} prefetch={false} className="block w-full">
                      {PosterInner}
                    </Link>
                  )}
                </div>

                <div
                  className="text-center mt-4"
                  style={{ width: "60%", paddingBottom: "2rem" }}
                >
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
            );
          })}
        </div>

        {/* Show More Button */}
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

      {/* Sheen CSS – Apple-TV subtle gloss */}
      <style jsx>{`
        .poster-card-inner {
          border-radius: 0; /* movie poster edge, no rounding */
        }

        .poster-sheen {
          pointer-events: none;
          position: absolute;
          inset: -20%;
          z-index: 2;
          background: linear-gradient(
            120deg,
            rgba(255, 255, 255, 0) 20%,
            rgba(255, 255, 255, 0.18) 45%,
            rgba(255, 255, 255, 0) 75%
          );
          mix-blend-mode: screen;
          opacity: 0;
          transform: translateX(-120%) rotate(2deg);
          transition: transform 650ms ease, opacity 360ms ease;
        }

        .poster-card:hover .poster-sheen {
          opacity: 0.55;
          transform: translateX(0%) rotate(2deg);
        }
      `}</style>
    </>
  );
}
