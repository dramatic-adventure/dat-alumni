"use client";

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
} from "./enrichAlumniData.server"; // type-only is fine
import { clientDebug } from "@/lib/clientDebug";

import type { Filters } from "@/types/alumni";

interface UseAlumniSearchResult {
  query: string;
  setQuery: (value: string) => void;
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

          // ✅ The big one: slug aliases, name aliases, socials, story, etc (server-generated)
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
        ],
      }),
    [enrichedData]
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      const cleanedQuery = cleanQuery(query);

      if (!cleanedQuery) {
        const all = enrichedData as unknown as ProfileLiveRow[];
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

      enrichedData.forEach((item) => {
        let score = 0;
        const reasons: string[] = [];

        const nameNorm = normalizeText(item.name || "");
        const nameParts = nameNorm.split(" ").filter(Boolean);

        const locationNorm = normalizeText(item.location || "");

        const aliasSet = new Set<string>(item.aliasTokens || []);

        /** ✅ Alias Index Match (program/prod aliases) */
        // NOTE: aliasIndex stores slugs; your enriched item has both slug + canonicalSlug
        if (aliasIndex[qLower]?.includes(item.slug) || aliasIndex[qLower]?.includes(item.canonicalSlug)) {
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
            item.roleTokens.includes(quoted) ||
            item.bioTokens.includes(quoted) ||
            item.programTokens.includes(quoted) ||
            item.productionTokens.includes(quoted) ||
            item.festivalTokens.includes(quoted) ||
            item.locationTokens.includes(quoted) ||
            aliasSet.has(quoted))
        ) {
          score += 170;
          reasons.push("Quoted Phrase Match");
        }

        /** ✅ Exact Program/Production matches (strong intent) */
        if (item.programTokens.includes(qLower)) {
          score += 160;
          reasons.push("Exact Program Match");
        }
        if (item.productionTokens.includes(qLower)) {
          score += 160;
          reasons.push("Exact Production Match");
        }

        /** ✅ Name + Location Combo */
        const hasNameTerm = queryTerms.some(
          (term) => nameParts.includes(term) || aliasSet.has(term)
        );
        const hasLocationTerm =
          !!locationNorm && (queryTerms.includes(locationNorm) || aliasSet.has(locationNorm));

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

          if (item.roleTokens.includes(term)) {
            score += 120;
            reasons.push(`Role Match (${term})`);
          }

          if (item.programTokens.includes(term) || item.productionTokens.includes(term)) {
            score += 90;
            reasons.push(`Program/Production Match (${term})`);
          }

          if (item.festivalTokens.includes(term)) {
            score += 70;
            reasons.push(`Festival Match (${term})`);
          }

          if (item.bioTokens.includes(term)) {
            score += 50;
            reasons.push(`Bio Match (${term})`);
          }

          if (item.identityTokens.includes(term)) {
            score += 80;
            reasons.push(`Tag Match (${term})`);
          }

          if (item.statusTokens.includes(term)) {
            score += 75;
            reasons.push(`Status Match (${term})`);
          }

          if (item.locationTokens.includes(term)) {
            score += 100;
            reasons.push(`Location Token Match (${term})`);
          }
        });

        /** ✅ Coverage for multi-term confidence */
        const tokensMatched = queryTerms.filter((term) =>
          nameParts.includes(term) ||
          aliasSet.has(term) ||
          item.roleTokens.includes(term) ||
          item.programTokens.includes(term) ||
          item.productionTokens.includes(term) ||
          item.festivalTokens.includes(term) ||
          item.bioTokens.includes(term) ||
          item.identityTokens.includes(term) ||
          item.statusTokens.includes(term) ||
          item.locationTokens.includes(term)
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
