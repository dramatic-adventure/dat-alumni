"use client";

import React, { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlumniItem, Filters } from "@/types/alumni"; // ✅ Shared type file
import { useAlumniSearch } from "./useAlumniSearch";

/** ✅ Props interface for the AlumniSearch component */
interface AlumniSearchProps {
  /** List of alumni data to search through */
  alumniData: AlumniItem[];
  /** Callback to return primary and secondary search results */
  onResults: (primary: AlumniItem[], secondary: AlumniItem[], q: string) => void;
  /** Compact mode for UI layout (optional) */
  compact?: boolean;
  /** Active filters applied to the search */
  filters?: Filters;
  /** Max number of secondary results to show */
  maxSecondary?: number;
  /** Show all results if search query is empty */
  showAllIfEmpty?: boolean;
  /** Enable console debug logs for search logic */
  debug?: boolean;
}

export default function AlumniSearch({
  alumniData,
  onResults,
  compact = false,
  filters = {},
  maxSecondary = 50,
  showAllIfEmpty = false,
  debug = true
}: AlumniSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  /** ✅ Custom hook handles all search logic */
  const { query, setQuery } = useAlumniSearch(
    alumniData,
    filters,
    maxSecondary,
    showAllIfEmpty,
    onResults,
    debug
  );

  /** ✅ Sync initial query from URL when component mounts */
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery, setQuery]);

  /** ✅ Update URL query parameters */
  const updateURL = (q: string) => {
    const params = new URLSearchParams(window.location.search);

    if (q.trim()) {
      params.set("q", q);
    } else {
      params.delete("q");
    }

    Object.entries(filters).forEach(([k, v]) =>
      v ? params.set(k, String(v)) : params.delete(k)
    );

    router.replace(`?${params.toString()}`, { scroll: false });
  };

  /** ✅ Clear search input and reset URL */
  const clearSearch = () => {
    setQuery("");
    onResults([], [], "");
    updateURL("");
  };

  return (
    <div style={{ marginBottom: compact ? "0" : "1rem" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          height: "47px",
          backgroundColor: "#F6E4C1",
          padding: "0 0.5rem",
          borderRadius: "6px"
        }}
      >
        {/* 🔍 Search Icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2.5"
          stroke="#241123"
          style={{ width: "35px", height: "35px", marginRight: "0.25rem" }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>

        {/* ✅ Search Input */}
        <input
          type="text"
          placeholder="Search alumni by name, program, or alias..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            updateURL(e.target.value);
          }}
          style={{
            flex: 1,
            fontSize: "1.2rem",
            backgroundColor: "#F6E4C1",
            border: "none",
            outline: "none"
          }}
        />

        {/* ❌ Clear Button */}
        {query && (
          <button
            onClick={clearSearch}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.5rem",
              cursor: "pointer",
              color: "#241123"
            }}
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
