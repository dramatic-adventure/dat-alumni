"use client";

import MiniProfileCard from "@/components/profile/MiniProfileCard";
import { useEffect, useMemo, useState } from "react";
import { useInView } from "react-intersection-observer";

interface AlumniResultsProps {
  results: any[];
  compact?: boolean;
}

export default function AlumniResults({ results, compact = false }: AlumniResultsProps) {
  const PAGE_SIZE = 20;

  // ✅ Keep initial slice stable even if results is undefined-ish
  const safeResults = useMemo(() => (Array.isArray(results) ? results : []), [results]);

  const [page, setPage] = useState(1);
  const [visibleResults, setVisibleResults] = useState<any[]>(safeResults.slice(0, PAGE_SIZE));

  // ✅ A bit more eager so it loads before you hit the bottom
  const { ref, inView } = useInView({ threshold: 0, rootMargin: "400px" });

  /** ✅ Reset when results change */
  useEffect(() => {
    setPage(1);
    setVisibleResults(safeResults.slice(0, PAGE_SIZE));
  }, [safeResults]);

  /** ✅ Infinite scroll for non-compact mode */
  useEffect(() => {
    if (compact) return;
    if (!inView) return;
    if (safeResults.length <= visibleResults.length) return;

    const nextPage = page + 1;
    setPage(nextPage);
    setVisibleResults(safeResults.slice(0, nextPage * PAGE_SIZE));
  }, [inView, safeResults, visibleResults.length, page, compact]);

  /** ✅ Empty state */
  if (safeResults.length === 0) {
    return (
      <p
        style={{
          marginTop: "1rem",
          fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
          fontSize: "1.3rem",
          color: "#F6E4C1",
          fontWeight: 600,
          textAlign: "center",
        }}
      >
        No results found.
      </p>
    );
  }

  return (
    <>
      {/* ✅ Show results count only when not compact */}
      {!compact && (
        <h2
          style={{
            textAlign: "center",
            marginBottom: "1rem",
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontWeight: 600,
            fontSize: "1.3rem",
            color: "#F6E4C1",
          }}
        >
          Results ({safeResults.length})
        </h2>
      )}

      {/* ✅ Main container */}
      <div
        style={{
          display: compact ? "flex" : "grid",
          flexDirection: compact ? "row" : undefined,
          overflowX: compact ? "auto" : "visible",
          gap: compact ? "1rem" : "20px",
          paddingBottom: compact ? "1rem" : 0,
          paddingLeft: compact ? "2rem" : 0,
          scrollSnapType: compact ? "x mandatory" : undefined,
          scrollPaddingLeft: compact ? "2rem" : undefined,
          WebkitOverflowScrolling: compact ? "touch" : undefined,
        }}
      >
        {visibleResults.map((alum, index) => (
          <div
            key={alum?.slug ? `${alum.slug}-${index}` : `row-${index}`}
            style={{
              flex: compact ? "0 0 auto" : undefined,
              width: compact ? "180px" : "auto",
              scrollSnapAlign: compact ? "start" : undefined,
            }}
          >
            <MiniProfileCard
              alumniId={alum?.slug}
              name={alum?.name || "No Name"}
              role={
                (Array.isArray(alum?.roles) ? alum.roles.join(", ") : alum?.roles) ||
                alum?.role ||
                "No Role"
              }
              slug={alum?.slug}
              headshotUrl={alum?.headshotUrl || ""}
              cacheKey={alum?.headshotCacheKey}
            />
          </div>
        ))}
      </div>

      {/* ✅ Infinite scroll trigger for full mode */}
      {!compact && <div ref={ref} className="h-10" />}
    </>
  );
}
