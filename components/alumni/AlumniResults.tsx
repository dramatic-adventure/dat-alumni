"use client";

import MiniProfileCard from "@/components/profile/MiniProfileCard";
import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";

interface AlumniResultsProps {
  results: any[];
  compact?: boolean;
}

export default function AlumniResults({ results, compact = false }: AlumniResultsProps) {
  const [visibleResults, setVisibleResults] = useState(results.slice(0, 20));
  const [page, setPage] = useState(1);
  const { ref, inView } = useInView({ threshold: 0.5 });

  /** ✅ Reset when results change */
  useEffect(() => {
    setVisibleResults(results.slice(0, 20));
    setPage(1);
  }, [results]);

  /** ✅ Infinite scroll for non-compact mode */
  useEffect(() => {
    if (!compact && inView && results.length > visibleResults.length) {
      const nextPage = page + 1;
      setVisibleResults(results.slice(0, nextPage * 20));
      setPage(nextPage);
    }
  }, [inView, results, visibleResults, page, compact]);

  /** ✅ Empty state */
  if (results.length === 0) {
    return (
      <p
        style={{
          marginTop: "1rem",
          fontFamily: "Space Grotesk",
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
            fontFamily: "Space Grotesk",
            fontWeight: 600,
            fontSize: "1.3rem",
            color: "#F6E4C1",
          }}
        >
          Results ({results.length})
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
          paddingLeft: compact ? "2rem" : 0, // ✅ NEW: Left padding for scrollable carousels
          scrollSnapType: compact ? "x mandatory" : undefined,
          scrollPaddingLeft: compact ? "2rem" : undefined, // ✅ Helps maintain snap offset
          WebkitOverflowScrolling: compact ? "touch" : undefined,
        }}
      >
        {visibleResults.map((alum, index) => (
          <div
            key={index}
            style={{
              flex: compact ? "0 0 auto" : undefined,
              width: compact ? "180px" : "auto",
              scrollSnapAlign: compact ? "start" : undefined,
            }}
          >
            <MiniProfileCard
              name={alum.name || "No Name"}
              role={(alum.roles && alum.roles.join(", ")) || alum.role || "No Role"}
              slug={alum.slug}
              headshotUrl={alum.headshotUrl || ""}
            />
          </div>
        ))}
      </div>

      {/* ✅ Infinite scroll trigger for full mode */}
      {!compact && <div ref={ref} className="h-10" />}
    </>
  );
}
