"use client";

import { useEffect, useMemo, useState } from "react";
import Fuse from "fuse.js";
import { useRouter, useSearchParams } from "next/navigation";
import { cleanQuery, expandQueryTerms } from "@/utils/searchHelpers";

interface AlumniSearchProps {
  alumniData: any[];
  onResults: (primary: any[], secondary: any[]) => void;
  compact?: boolean;
  filters?: Record<string, string | boolean>;
}

export default function AlumniSearch({ alumniData, onResults, compact, filters = {} }: AlumniSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");

  /** ✅ Fuse Configs */
  const fusePrimary = useMemo(() => {
    return new Fuse(alumniData, {
      includeScore: true,
      threshold: 0.2, // Strict
      minMatchCharLength: 2,
      ignoreLocation: true,
      keys: [
        { name: "name", weight: 0.55 },
        { name: "roles", weight: 0.3 },
        { name: "location", weight: 0.2 },
        { name: "programs", weight: 0.15 },
        { name: "identityTags", weight: 0.08 },
        { name: "languages", weight: 0.08 },
      ],
    });
  }, [alumniData]);

  const fuseFuzzy = useMemo(() => {
    return new Fuse(alumniData, {
      includeScore: true,
      threshold: 0.4, // More forgiving for near misses
      minMatchCharLength: 2,
      ignoreLocation: true,
      keys: [
        { name: "name", weight: 0.7 }, // Prioritize name for fuzzy
        { name: "roles", weight: 0.2 },
        { name: "location", weight: 0.1 },
      ],
    });
  }, [alumniData]);

  /** ✅ Sync query + filters in URL */
  const updateURL = (q: string) => {
    const params = new URLSearchParams(window.location.search);
    if (q.trim()) params.set("q", q);
    else params.delete("q");

    for (const [key, value] of Object.entries(filters)) {
      if (value) params.set(key, String(value));
      else params.delete(key);
    }

    router.replace(`?${params.toString()}`, { scroll: false });
  };

  /** ✅ Main Search Logic */
  useEffect(() => {
    const handler = setTimeout(() => {
      const cleanedQuery = cleanQuery(query);
      updateURL(cleanedQuery);

      if (!cleanedQuery) {
        onResults([], []);
        return;
      }

      const terms = cleanedQuery.split(/\s+/);

      /** ✅ Primary Search (Strict AND) */
      const primaryQuery: any = {
        $and: terms.map((t: string) => ({
          $or: [{ name: t }, { roles: t }, { location: t }, { programs: t }],
        })),
      };

      let primaryResults = fusePrimary.search(primaryQuery).map((r) => r.item);

      /** ✅ Synonym Expansion */
      let secondaryResults: any[] = [];
      const expandedTerms = expandQueryTerms(cleanedQuery);
      if (expandedTerms.length > terms.length) {
        const expandedQuery = expandedTerms.join(" ");
        const expandedSearch = fusePrimary.search(expandedQuery).map((r) => r.item);
        const primaryIds = new Set(primaryResults.map((item) => item.slug));
        secondaryResults = expandedSearch.filter((item) => !primaryIds.has(item.slug));
      }

      /** ✅ Fuzzy Fallback */
      const fuzzyResults = fuseFuzzy.search(cleanedQuery).map((r) => r.item);
      const allPrimaryIds = new Set([...primaryResults, ...secondaryResults].map((item) => item.slug));
      const fuzzyOnly = fuzzyResults.filter((item) => !allPrimaryIds.has(item.slug));

      // Merge synonyms and fuzzy into one "secondary" bucket
      const combinedSecondary = [...secondaryResults, ...fuzzyOnly];

      onResults(primaryResults, combinedSecondary);
    }, 250);

    return () => clearTimeout(handler);
  }, [query, filters, fusePrimary, fuseFuzzy, onResults]);

  /** ✅ Clear Search */
  const clearSearch = () => {
    setQuery("");
    onResults([], []);
    updateURL("");
  };

  return (
    <div style={{ marginBottom: compact ? "0" : "1rem", height: "100%", position: "relative" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          height: "47px",
          backgroundColor: "#F6E4C1",
          padding: "0 0.5rem",
          borderRadius: "6px",
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2.5"
          stroke="#241123"
          style={{ width: "35px", height: "35px", marginRight: "0.25rem" }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>

        <input
          type="text"
          placeholder="Search alumni by name, program, location..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            flex: 1,
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "1.2rem",
            backgroundColor: "#F6E4C1",
            border: "none",
            outline: "none",
          }}
        />

        {query && (
          <button
            onClick={clearSearch}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.5rem",
              cursor: "pointer",
              color: "#241123",
              padding: "0 0.5rem",
            }}
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
