"use client";

// /components/alumni/AlumniSearch/useAlumniSearch.ts

import { useEffect, useMemo, useState } from "react";
import Fuse from "fuse.js";
import {
  cleanQuery,
  expandQueryTerms,
  normalizeText,
  extractQuotedPhrase,
  buildAliasIndex,
} from "./searchUtils";

import type {
  EnrichedProfileLiveRow,
  ProfileLiveRow,
} from "./enrichAlumniData.server"; // type-only OK

import { clientDebug } from "@/lib/clientDebug";
import type { Filters } from "@/types/alumni";

interface UseAlumniSearchResult {
  query: string;
  setQuery: (value: string) => void;
}

/** Small helper: safe includes for optional arrays */
function hasToken(arr: string[] | undefined, token: string) {
  if (!arr?.length) return false;
  return arr.includes(token);
}

/** Small helper: match filter values against a token bucket */
function passesTokenFilter(
  filterValue: string | undefined,
  tokens: string[] | undefined
): boolean {
  const v = (filterValue || "").trim();
  if (!v) return true; // no filter → pass
  const n = normalizeText(v);
  return hasToken(tokens, n);
}

export function useAlumniSearch(
  enrichedData: EnrichedProfileLiveRow[],
  filters: Filters,
  maxSecondary: number = 50,
  showAllIfEmpty: boolean = false,
  onResults: (
    primary: ProfileLiveRow[],
    secondary: ProfileLiveRow[],
    q: string
  ) => void,
  debug: boolean = false
): UseAlumniSearchResult {
  const [query, setQuery] = useState<string>("");

  const aliasIndex = useMemo(buildAliasIndex, []);

  // ✅ Use canonicalSlug if present; otherwise slug (for dedupe / seen)
  const keyOf = (it: EnrichedProfileLiveRow) => it.canonicalSlug || it.slug;

  const fuse = useMemo(
    () =>
      new Fuse(enrichedData, {
        includeScore: true,
        threshold: 0.35,
        ignoreLocation: true,
        keys: [
          { name: "name", weight: 0.6 },

          // ✅ Catch-all: slug aliases, name aliases, socials, story, etc (server-generated)
          { name: "aliasTokens", weight: 0.7 },

          // Buckets for stronger intent
          { name: "roleTokens", weight: 0.35 },
          { name: "locationTokens", weight: 0.25 },
          { name: "programTokens", weight: 0.35 },
          { name: "productionTokens", weight: 0.35 },
          { name: "festivalTokens", weight: 0.2 },
          { name: "bioTokens", weight: 0.2 },
          { name: "identityTokens", weight: 0.22 },
          { name: "statusTokens", weight: 0.18 },

          // ✅ NEW
          { name: "languageTokens", weight: 0.22 },
          { name: "seasonTokens", weight: 0.22 },
        ],
      }),
    [enrichedData]
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      const cleanedQuery = cleanQuery(query);

      // --------------------------------------------
      // 0) Optional filters (hard gate)
      // --------------------------------------------
      // If filters are set, we gate results against token buckets.
      // This keeps your scoring logic unchanged while honoring filters.
      const gated = enrichedData.filter((item) => {
        // NOTE: these match against normalized token arrays produced on server.
        if (!passesTokenFilter(filters.program, item.programTokens)) return false;
        if (!passesTokenFilter(filters.role, item.roleTokens)) return false;
        if (!passesTokenFilter(filters.location, item.locationTokens)) return false;
        if (!passesTokenFilter(filters.statusFlag, item.statusTokens)) return false;
        if (!passesTokenFilter(filters.identityTag, item.identityTokens)) return false;

        // ✅ NEW
        if (!passesTokenFilter(filters.language, item.languageTokens)) return false;
        if (!passesTokenFilter(filters.season, item.seasonTokens)) return false;

        return true;
      });

      // If empty query:
      if (!cleanedQuery) {
        const all = gated as unknown as ProfileLiveRow[];
        onResults(showAllIfEmpty ? [] : [], showAllIfEmpty ? all : [], "");
        return;
      }

      const qLower = normalizeText(cleanedQuery);
      const quotedRaw = extractQuotedPhrase(cleanedQuery);
      const quoted = quotedRaw ? normalizeText(quotedRaw) : "";
      const queryTerms = expandQueryTerms(cleanedQuery);
      const multiTerm = queryTerms.length > 1;

      const scoredResults: {
        item: ProfileLiveRow;
        score: number;
        coverage: number;
        reasons: string[];
      }[] = [];

      const seen = new Set<string>();

      gated.forEach((item) => {
        let score = 0;
        const reasons: string[] = [];

        const nameNorm = normalizeText(item.name || "");
        const nameParts = nameNorm.split(" ").filter(Boolean);

        const aliasSet = new Set<string>(item.aliasTokens || []);

        // convenience refs
        const roleTokens = item.roleTokens || [];
        const locationTokens = item.locationTokens || [];
        const programTokens = item.programTokens || [];
        const productionTokens = item.productionTokens || [];
        const festivalTokens = item.festivalTokens || [];
        const bioTokens = item.bioTokens || [];
        const identityTokens = item.identityTokens || [];
        const statusTokens = item.statusTokens || [];

        // ✅ NEW
        const languageTokens = item.languageTokens || [];
        const seasonTokens = item.seasonTokens || [];

        /** ✅ Alias Index Match (program/prod aliases) */
        if (
          aliasIndex[qLower]?.includes(item.slug) ||
          (item.canonicalSlug && aliasIndex[qLower]?.includes(item.canonicalSlug))
        ) {
          score += 180;
          reasons.push("Alias Index Match");
        }

        /** ✅ Exact alias token match (slug aliases, name aliases, socials, etc.) */
        if (aliasSet.has(qLower)) {
          score += 240;
          reasons.push("Alias Token Exact");
        }

        /** ✅ Full Name Exact */
        if (nameNorm === qLower) {
          score += 160;
          reasons.push("Full Name Exact");
        }

        /** ✅ Quoted Phrase Boosts (normalized) */
        if (
          quoted &&
          (nameNorm.includes(quoted) ||
            roleTokens.includes(quoted) ||
            bioTokens.includes(quoted) ||
            programTokens.includes(quoted) ||
            productionTokens.includes(quoted) ||
            festivalTokens.includes(quoted) ||
            locationTokens.includes(quoted) ||
            identityTokens.includes(quoted) ||
            statusTokens.includes(quoted) ||
            languageTokens.includes(quoted) ||
            seasonTokens.includes(quoted) ||
            aliasSet.has(quoted))
        ) {
          score += 170;
          reasons.push("Quoted Phrase Match");
        }

        /** ✅ Exact strong-intent matches */
        if (programTokens.includes(qLower)) {
          score += 160;
          reasons.push("Exact Program Match");
        }
        if (productionTokens.includes(qLower)) {
          score += 160;
          reasons.push("Exact Production Match");
        }

        // ✅ NEW
        if (languageTokens.includes(qLower)) {
          score += 150;
          reasons.push("Exact Language Match");
        }
        if (seasonTokens.includes(qLower)) {
          score += 150;
          reasons.push("Exact Season Match");
        }

        /** ✅ Name + Location Combo */
        const hasNameTerm = queryTerms.some(
          (term) => nameParts.includes(term) || aliasSet.has(term)
        );
        const hasLocationTerm = queryTerms.some(
          (term) => locationTokens.includes(term) || aliasSet.has(term)
        );

        if (hasNameTerm && hasLocationTerm) {
          score += 260;
          reasons.push("Name + Location Combo");
        }

        /** ✅ Token-by-token scoring */
        queryTerms.forEach((term) => {
          if (nameParts.includes(term)) {
            score += 80;
            reasons.push(`Name Match (${term})`);
          }

          if (aliasSet.has(term)) {
            score += 95;
            reasons.push(`Alias Token Match (${term})`);
          }

          if (roleTokens.includes(term)) {
            score += 120;
            reasons.push(`Role Match (${term})`);
          }

          if (programTokens.includes(term) || productionTokens.includes(term)) {
            score += 90;
            reasons.push(`Program/Production Match (${term})`);
          }

          if (festivalTokens.includes(term)) {
            score += 70;
            reasons.push(`Festival Match (${term})`);
          }

          if (bioTokens.includes(term)) {
            score += 50;
            reasons.push(`Bio Match (${term})`);
          }

          if (identityTokens.includes(term)) {
            score += 80;
            reasons.push(`Tag Match (${term})`);
          }

          if (statusTokens.includes(term)) {
            score += 75;
            reasons.push(`Status Match (${term})`);
          }

          if (locationTokens.includes(term)) {
            score += 100;
            reasons.push(`Location Token Match (${term})`);
          }

          // ✅ NEW
          if (languageTokens.includes(term)) {
            score += 90;
            reasons.push(`Language Match (${term})`);
          }

          if (seasonTokens.includes(term)) {
            score += 90;
            reasons.push(`Season Match (${term})`);
          }
        });

        /** ✅ Coverage for multi-term confidence */
        const tokensMatched = queryTerms.filter((term) =>
          nameParts.includes(term) ||
          aliasSet.has(term) ||
          roleTokens.includes(term) ||
          programTokens.includes(term) ||
          productionTokens.includes(term) ||
          festivalTokens.includes(term) ||
          bioTokens.includes(term) ||
          identityTokens.includes(term) ||
          statusTokens.includes(term) ||
          locationTokens.includes(term) ||
          languageTokens.includes(term) ||
          seasonTokens.includes(term)
        ).length;

        const coverage =
          queryTerms.length > 0 ? tokensMatched / queryTerms.length : 0;

        if (tokensMatched > 1) {
          score += (tokensMatched - 1) * 50;
          reasons.push("Multi-term Bonus");
        }

        if (tokensMatched === queryTerms.length) {
          score += 150;
          reasons.push("Full Coverage Bonus");
        }

        if (multiTerm && coverage < 0.6) {
          score -= 50;
          reasons.push("Low Coverage Penalty");
        }

        const includeAsPrimary = score >= 120 || coverage >= 0.6;

        if (includeAsPrimary) {
          scoredResults.push({
            item: item as unknown as ProfileLiveRow,
            score,
            coverage,
            reasons,
          });
          seen.add(keyOf(item));
        }
      });

      scoredResults.sort((a, b) => b.score - a.score);
      const primary = scoredResults.map((r) => r.item);

      /** ✅ Secondary via Fuse (deduped by canonicalSlug/slug) */
      const secondary: ProfileLiveRow[] = [];
      fuse.search(cleanedQuery).forEach((result) => {
        const it = result.item as EnrichedProfileLiveRow;

        // apply same filters to fuse results
        // (Fuse searched whole dataset, so we gate)
        if (
          !passesTokenFilter(filters.program, it.programTokens) ||
          !passesTokenFilter(filters.role, it.roleTokens) ||
          !passesTokenFilter(filters.location, it.locationTokens) ||
          !passesTokenFilter(filters.statusFlag, it.statusTokens) ||
          !passesTokenFilter(filters.identityTag, it.identityTokens) ||
          !passesTokenFilter(filters.language, it.languageTokens) ||
          !passesTokenFilter(filters.season, it.seasonTokens)
        ) {
          return;
        }

        const k = keyOf(it);
        if (!seen.has(k)) {
          secondary.push(result.item as unknown as ProfileLiveRow);
          seen.add(k);
        }
      });

      if (debug) {
        clientDebug(`🔍 Search Debug: "${cleanedQuery}"`);
        scoredResults.forEach((r) =>
          clientDebug(
            `✅ ${r.item.name} → Score: ${r.score}, Coverage: ${(r.coverage * 100).toFixed(0)}%`,
            r.reasons
          )
        );
      }

      onResults(primary, secondary.slice(0, maxSecondary), cleanedQuery);
    }, 250);

    return () => clearTimeout(handler);
  }, [
    query,
    filters,
    enrichedData,
    fuse,
    onResults,
    showAllIfEmpty,
    debug,
    aliasIndex,
    maxSecondary,
  ]);

  return { query, setQuery };
}
