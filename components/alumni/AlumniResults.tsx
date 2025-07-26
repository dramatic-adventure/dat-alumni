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

  /** ✅ Reset on new results */
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

  if (results.length === 0) {
    return (
      <p
        style={{
          marginTop: "1rem",
          fontFamily: "Space Grotesk",
          fontSize: "1.3rem",
          color: "#F6E4C1", // Cream color
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
      {/* ✅ Show results count only in full mode (not in compact carousel mode) */}
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

      <div
        style={{
          display: "grid",
          gridTemplateColumns: compact
            ? "auto / auto-flow" // For horizontal scroll
            : "repeat(auto-fit, minmax(160px, 1fr))",
          gap: compact ? "1rem" : "20px",
          overflowX: compact ? "auto" : "visible",
          whiteSpace: compact ? "nowrap" : "normal",
          paddingBottom: compact ? "1rem" : "0",
        }}
      >
        {visibleResults.map((alum, index) => (
          <div
            key={index}
            style={{
              display: "inline-block",
              width: compact ? "180px" : "auto",
              flexShrink: compact ? 0 : undefined,
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

      {/* ✅ Only show infinite scroll trigger if NOT compact */}
      {!compact && <div ref={ref} className="h-10"></div>}
    </>
  );
}
