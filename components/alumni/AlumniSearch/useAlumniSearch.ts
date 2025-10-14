import { useEffect, useMemo, useState } from "react";
import Fuse from "fuse.js";
import {
  cleanQuery,
  expandQueryTerms,
  normalizeText,
  extractQuotedPhrase,
  buildAliasIndex
} from "./searchUtils";
import { enrichAlumniData } from "./tokenUtils";
import { AlumniItem, Filters, EnrichedAlumniItem } from "@/types/alumni";
import { clientDebug } from "@/lib/clientDebug";

interface UseAlumniSearchResult {
  query: string;
  setQuery: (value: string) => void;
}

export function useAlumniSearch(
  alumniData: AlumniItem[],
  filters: Filters,
  maxSecondary: number = 50,
  showAllIfEmpty: boolean = false,
  onResults: (primary: AlumniItem[], secondary: AlumniItem[], q: string) => void,
  debug: boolean = false
): UseAlumniSearchResult {
  const [query, setQuery] = useState<string>("");

  const enrichedData: EnrichedAlumniItem[] = useMemo(() => enrichAlumniData(alumniData), [alumniData]);
  const aliasIndex = useMemo(buildAliasIndex, []);

  const fuse = useMemo(
    () =>
      new Fuse(enrichedData, {
        includeScore: true,
        threshold: 0.35,
        ignoreLocation: true,
        keys: [
          { name: "name", weight: 0.6 },
          { name: "roles", weight: 0.3 },
          { name: "roleTokens", weight: 0.3 },
          { name: "location", weight: 0.25 },
          { name: "locationTokens", weight: 0.25 }, // ✅ ADDED
          { name: "programTokens", weight: 0.35 },
          { name: "productionTokens", weight: 0.35 },
          { name: "festivalTokens", weight: 0.2 },
          { name: "bioTokens", weight: 0.2 },
          { name: "statusTokens", weight: 0.25 },
          { name: "identityTokens", weight: 0.25 }
        ]
      }),
    [enrichedData]
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      const cleanedQuery = cleanQuery(query);
      if (!cleanedQuery) {
        onResults(showAllIfEmpty ? [] : [], showAllIfEmpty ? alumniData : [], "");
        return;
      }

      const qLower = normalizeText(cleanedQuery);
      const quotedPhrase = extractQuotedPhrase(cleanedQuery);
      const queryTerms = expandQueryTerms(cleanedQuery);
      const multiTerm = queryTerms.length > 1;

      const scoredResults: { item: AlumniItem; score: number; coverage: number; reasons: string[] }[] = [];
      const seen = new Set<string>();

      enrichedData.forEach(item => {
        let score = 0;
        const reasons: string[] = [];

        const nameNorm = normalizeText(item.name || "");
        const nameParts = nameNorm.split(" ");
        const locationNorm = normalizeText(item.location || "");
        const queryNorm = normalizeText(cleanedQuery);

        /** ✅ Alias Match */
        if (aliasIndex[qLower]?.includes(item.slug)) {
          score += 180;
          reasons.push("Alias Match");
        }

        /** ✅ Full Name Exact */
        if (nameNorm === qLower) {
          score += 150;
          reasons.push("Full Name Exact");
        }

        /** ✅ Quoted Phrase Boosts */
        if (quotedPhrase && (
          nameNorm.includes(quotedPhrase) ||
          item.roleTokens.includes(quotedPhrase) ||
          item.bioTokens.includes(quotedPhrase)
        )) {
          score += 150;
          reasons.push("Quoted Phrase Match");
        }

        /** ✅ Exact Program Match */
        if (item.programTokens.includes(qLower)) {
          score += 150;
          reasons.push("Exact Program Match");
        }

        /** ✅ Exact Role Phrase Match */
        (item.roles || []).forEach(role => {
          if (normalizeText(role) === queryNorm) {
            score += 300;
            reasons.push(`Full Role Phrase Match (${role})`);
          }
        });

        /** ✅ Name + Location Combo */
        const hasNameTerm = queryTerms.some(term => nameParts.includes(term));
        const hasLocationTerm = queryTerms.includes(locationNorm);
        if (hasNameTerm && hasLocationTerm) {
          score += 250;
          reasons.push("Name + Location Combo");
        }

        /** ✅ Token-by-token scoring */
        queryTerms.forEach(term => {
          if (nameParts.includes(term)) {
            score += 80;
            reasons.push(`Name Match (${term})`);
          }
          if (item.roleTokens.includes(term)) {
            score += 120;
            reasons.push(`Role Match (${term})`);
          }
          if (item.programTokens.includes(term) || item.productionTokens.includes(term)) {
            score += 90;
            reasons.push(`Program/Production Match (${term})`);
          }
          if (item.bioTokens.includes(term)) {
            score += 50;
            reasons.push(`Bio Match (${term})`);
          }
          if (item.statusTokens.includes(term)) {
            score += 80;
            reasons.push(`Status Flag Match (${term})`);
          }
          if (item.identityTokens.includes(term)) {
            score += 80;
            reasons.push(`Identity Tag Match (${term})`);
          }
          if ((item as any).locationTokens?.includes(term)) {
            score += 100;
            reasons.push(`Location Token Match (${term})`);
          }
        });

        /** ✅ Multi-term bonuses */
        const tokensMatched = queryTerms.filter(term =>
          nameParts.includes(term) ||
          item.roleTokens.includes(term) ||
          item.programTokens.includes(term) ||
          item.productionTokens.includes(term) ||
          item.bioTokens.includes(term) ||
          item.statusTokens.includes(term) ||
          item.identityTokens.includes(term) ||
          (item as any).locationTokens?.includes(term)
        ).length;

        const coverage = queryTerms.length > 0 ? tokensMatched / queryTerms.length : 0;

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
          scoredResults.push({ item, score, coverage, reasons });
          seen.add(item.slug);
        }
      });

      scoredResults.sort((a, b) => b.score - a.score);
      const primary = scoredResults.map(r => r.item);

      const secondary: AlumniItem[] = [];
      fuse.search(cleanedQuery).forEach(result => {
        if (!seen.has(result.item.slug)) {
          secondary.push(result.item);
          seen.add(result.item.slug);
        }
      });

      if (debug) {
        clientDebug(`🔍 Search Debug: "${cleanedQuery}"`);
        scoredResults.forEach(r =>
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
    alumniData,
    fuse,
    onResults,
    showAllIfEmpty,
    debug,
    aliasIndex,
    maxSecondary,
  ]);

  return { query, setQuery };
}
