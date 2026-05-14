// components/drama/DramaClubIndexMicroGrid.tsx
"use client";

import { useEffect, useState } from "react";
import type { DramaClub } from "@/lib/dramaClubMap";
import {
  computeDramaClubStatus,
  type DramaClubStatus,
} from "@/lib/dramaClubStatus";
import DramaClubCard from "@/components/drama/DramaClubCard";

type DramaClubIndexMicroGridProps = {
  clubs: DramaClub[];
};

const statusOrder: Record<DramaClubStatus, number> = {
  new: 0,
  ongoing: 1,
  legacy: 2,
};

/**
 * How many clubs to show when collapsed:
 * - Phones (<640px): 3  (1 col × 3 rows)
 * - Tablets (640–1023px): 6 (2 cols × 3 rows)
 * - Desktop (≥1024px): 9 (3 cols × 3 rows)
 */
function useBaseVisibleCount() {
  const [count, setCount] = useState<number>(9); // safe default for SSR

  useEffect(() => {
    if (typeof window === "undefined") return;

    const queries: { mql: MediaQueryList; value: number }[] = [
      { mql: window.matchMedia("(max-width: 639px)"), value: 3 },
      {
        mql: window.matchMedia(
          "(min-width: 640px) and (max-width: 1023px)"
        ),
        value: 6,
      },
      { mql: window.matchMedia("(min-width: 1024px)"), value: 9 },
    ];

    const update = () => {
      for (const { mql, value } of queries) {
        if (mql.matches) {
          setCount(value);
          return;
        }
      }
      setCount(9);
    };

    update();

    queries.forEach(({ mql }) => {
      mql.addEventListener("change", update);
    });

    return () => {
      queries.forEach(({ mql }) => {
        mql.removeEventListener("change", update);
      });
    };
  }, []);

  return count;
}

/* ===============================
   Grid wrapper
=============================== */

export default function DramaClubIndexMicroGrid({
  clubs,
}: DramaClubIndexMicroGridProps) {
  // Defensive re-sort in case the caller ever passes unsorted data.
  const sorted = [...clubs].sort((a, b) => {
    const aStatus: DramaClubStatus = computeDramaClubStatus(a);
    const bStatus: DramaClubStatus = computeDramaClubStatus(b);

    const statusDiff = statusOrder[aStatus] - statusOrder[bStatus];
    if (statusDiff !== 0) return statusDiff;

    const aCountry = a.country ?? "";
    const bCountry = b.country ?? "";
    const countryDiff = aCountry.localeCompare(bCountry);
    if (countryDiff !== 0) return countryDiff;

    const aName = a.name ?? "";
    const bName = b.name ?? "";
    return aName.localeCompare(bName);
  });

  const baseVisibleCount = useBaseVisibleCount();
  const [showAll, setShowAll] = useState(false);

  const visibleCount = showAll
    ? sorted.length
    : Math.min(baseVisibleCount, sorted.length);

  const visibleClubs = sorted.slice(0, visibleCount);
  const hasMoreThanBase = sorted.length > baseVisibleCount;

  return (
    <>
      <style>{`
        /* Grid: 1 col mobile, 2 cols tablet, 3 cols desktop */
        .drama-micro-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 56px;
          justify-content: center;
          justify-items: center;
        }

        @media (min-width: 640px) {
          .drama-micro-grid {
            grid-template-columns: repeat(2, minmax(260px, 1fr));
          }
        }

        @media (min-width: 1024px) {
          .drama-micro-grid {
            grid-template-columns: repeat(3, minmax(260px, 1fr));
          }
        }

        /* See more / See fewer button */
        .drama-micro-toggle-wrapper {
          display: flex;
          justify-content: center;
          margin-top: 1.75rem;
        }

        .drama-micro-toggle-button {
          border-radius: 999px;
          border: 1px solid rgba(36,17,35,0.26);
          background-color: #fdf5e6;
          padding: 0.6rem 1.8rem;
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: #241123;
          box-shadow: 0 10px 28px rgba(0,0,0,0.32);
          cursor: pointer;
          outline: none;
          transition:
            border-color 120ms ease-out,
            color 120ms ease-out,
            box-shadow 120ms ease-out,
            transform 120ms ease-out,
            background-color 120ms ease-out;
        }

        .drama-micro-toggle-button:hover {
          border-color: rgba(108,0,175,0.5);
          color: #6C00AF;
          background-color: #fcefdc;
          box-shadow: 0 16px 40px rgba(0,0,0,0.45);
          transform: translateY(-1px);
        }

        .drama-micro-toggle-button:focus-visible {
          box-shadow:
            0 0 0 2px rgba(255,255,255,0.9),
            0 0 0 4px rgba(108,0,175,0.7);
        }
      `}</style>

      <div className="drama-micro-grid">
        {visibleClubs.map((club) => (
          <DramaClubCard key={club.slug} club={club} />
        ))}
      </div>

      {hasMoreThanBase && (
        <div className="drama-micro-toggle-wrapper">
          <button
            type="button"
            className="drama-micro-toggle-button"
            onClick={() => setShowAll((prev) => !prev)}
            style={{
              fontFamily:
                "var(--font-space-grotesk), system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            }}
          >
            {showAll ? "See fewer clubs" : "See more clubs"}
          </button>
        </div>
      )}
    </>
  );
}

