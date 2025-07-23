"use client";

import MiniProfileCard from "@/components/profile/MiniProfileCard";
import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";

interface AlumniResultsProps {
  results: any[];
}

export default function AlumniResults({ results }: AlumniResultsProps) {
  const [visibleResults, setVisibleResults] = useState(results.slice(0, 20));
  const [page, setPage] = useState(1);
  const { ref, inView } = useInView({ threshold: 0.5 });

  useEffect(() => {
    setVisibleResults(results.slice(0, 20));
    setPage(1);
  }, [results]);

  useEffect(() => {
    if (inView && results.length > visibleResults.length) {
      const nextPage = page + 1;
      setVisibleResults(results.slice(0, nextPage * 20));
      setPage(nextPage);
    }
  }, [inView, results, visibleResults, page]);

  if (results.length === 0) {
    return <p className="text-center text-gray-600 mt-6">No results found.</p>;
  }

  return (
    <>
      <h2 className="text-center mb-4 font-semibold">
        Results ({results.length})
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "20px",
        }}
      >
        {visibleResults.map((alum, index) => (
          <MiniProfileCard
            key={index}
            name={alum.name || "No Name"}
            role={(alum.roles && alum.roles.join(", ")) || alum.role || "No Role"}
            slug={alum.slug}
            headshotUrl={alum.headshotUrl || ""}
          />
        ))}
      </div>
      <div ref={ref} className="h-10"></div>
    </>
  );
}
