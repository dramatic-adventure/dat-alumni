"use client";

import { useEffect, useState, useMemo } from "react";
import { normalizeText, expandQueryTerms } from "@/utils/searchHelpers";

interface AlumniSearchProps {
  alumniData: any[];
  onResults: (results: any[]) => void;
}

export default function AlumniSearch({ alumniData, onResults }: AlumniSearchProps) {
  const [rawInput, setRawInput] = useState(""); // ✅ What user sees
  const [searchTerm, setSearchTerm] = useState(""); // ✅ Normalized for matching

  /** ✅ Normalize alumni fields for searching */
  const normalizedData = useMemo(() => {
    return alumniData.map((alum) => ({
      ...alum,
      _searchBlob: normalizeText([
        alum.name,
        alum.roles?.join(" "),
        alum.location,
        alum.identityTags?.join(" "),
        alum.programBadges?.join(" "),
        alum.artistStatement,
      ].join(" "))
    }));
  }, [alumniData]);

  /** ✅ Build search groups */
  function buildSearchGroups(query: string): string[][] {
    const words = query.split(/\s+/).filter(Boolean);
    return words.map((word) => expandQueryTerms(word)); // each word becomes a group
  }

  /** ✅ Matching logic */
  function matchesAllGroups(text: string, groups: string[][]): boolean {
    return groups.every((group) => group.some((term) => text.includes(term)));
  }

  /** ✅ Compute results */
  useEffect(() => {
    if (!searchTerm.trim()) {
      onResults([]); // ✅ No fallback to all
      return;
    }

    const groups = buildSearchGroups(searchTerm);
    const results = normalizedData.filter((alum) =>
      matchesAllGroups(alum._searchBlob, groups)
    );

    onResults(results);
  }, [searchTerm, normalizedData]);

  return (
    <div className="mb-8">
      <div className="flex justify-center gap-4 mb-4">
        <input
          type="text"
          placeholder="Search alumni..."
          value={rawInput}
          onChange={(e) => {
            const input = e.target.value;
            setRawInput(input); // ✅ Keep spaces for user
            setSearchTerm(normalizeText(input)); // ✅ Use normalized internally
          }}
          className="rounded-full border border-gray-400 px-6 py-3 w-full md:w-96"
        />
        {rawInput && (
          <button
            onClick={() => {
              setRawInput("");
              setSearchTerm("");
            }}
            className="bg-gray-300 px-4 py-2 rounded-md font-bold"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
