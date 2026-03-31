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
} from "./enrichAlumniData.server";

import { clientDebug } from "@/lib/clientDebug";
import type { Filters } from "@/types/alumni";

interface UseAlumniSearchResult {
  query: string;
  setQuery: (value: string) => void;
}

type SearchRow = EnrichedProfileLiveRow;

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
  if (!v) return true;
  const n = normalizeText(v);
  return hasToken(tokens, n);
}

/** Flatten all searchable tokens on a row into one set */
function buildFlatTokenSet(item: EnrichedProfileLiveRow): Set<string> {
  return new Set<string>([
    ...normalizeText(item.name || "").split(" ").filter(Boolean),
    ...(item.aliasTokens || []),
    ...(item.roleTokens || []),
    ...(item.locationTokens || []),
    ...(item.programTokens || []),
    ...(item.productionTokens || []),
    ...(item.festivalTokens || []),
    ...(item.bioTokens || []),
    ...(item.identityTokens || []),
    ...(item.statusTokens || []),
    ...(item.languageTokens || []),
    ...(item.seasonTokens || []),
  ]);
}

function buildStructuredQualifierTokenSet(item: EnrichedProfileLiveRow): Set<string> {
  return new Set<string>([
    ...(item.locationTokens || []),
    ...(item.programTokens || []),
    ...(item.productionTokens || []),
    ...(item.festivalTokens || []),
    ...(item.seasonTokens || []),
  ]);
}

function hasStructuredQualifierMatch(
  qualifierTerms: string[],
  qualifierPhrase: string,
  qualifierTokens: Set<string>,
  structuredSearchText: string
): boolean {
  if (qualifierTerms.length === 0) return true;

  const hasPhrase =
    !!qualifierPhrase && structuredSearchText.includes(qualifierPhrase);

  const hasAllTerms = qualifierTerms.every((term) =>
    qualifierTokens.has(term)
  );

  return hasAllTerms || hasPhrase;
}

function stripQualifierNoiseTerms(terms: string[]) {
  return terms.filter((term) => term && !["of", "the", "and"].includes(term));
}

function splitNormalizedTerms(value: string) {
  return normalizeText(value).split(" ").filter(Boolean);
}

function matchesCoreProjectIntent(
  coreTerms: string[],
  strongCoreTokenHits: number,
  strongStructuredCoreHits: number,
  projectPhraseMatch: boolean
): boolean {
  if (coreTerms.length === 0) return true;

  const minHits = Math.max(1, Math.min(2, coreTerms.length));

  return (
    projectPhraseMatch ||
    strongStructuredCoreHits >= minHits ||
    strongCoreTokenHits >= minHits
  );
}

export function useAlumniSearch(
  enrichedData: EnrichedProfileLiveRow[] | undefined,
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

  const keyOf = (it: EnrichedProfileLiveRow) => it.canonicalSlug || it.slug;

  const fuse = useMemo(
    () =>
      new Fuse(enrichedData ?? [], {
        includeScore: true,
        threshold: 0.35,
        ignoreLocation: true,
        keys: [
          { name: "name", weight: 0.6 },
          { name: "aliasTokens", weight: 0.7 },
          { name: "roleTokens", weight: 0.35 },
          { name: "locationTokens", weight: 0.25 },
          { name: "programTokens", weight: 0.35 },
          { name: "productionTokens", weight: 0.35 },
          { name: "festivalTokens", weight: 0.2 },
          { name: "bioTokens", weight: 0.2 },
          { name: "identityTokens", weight: 0.22 },
          { name: "statusTokens", weight: 0.18 },
          { name: "languageTokens", weight: 0.22 },
          { name: "seasonTokens", weight: 0.22 },
        ],
      }),
    [enrichedData]
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      const cleanedQuery = cleanQuery(query);

      const gated: SearchRow[] = (enrichedData ?? []).filter((item) => {
        if (!passesTokenFilter(filters.program, item.programTokens)) return false;
        if (!passesTokenFilter(filters.role, item.roleTokens)) return false;
        if (!passesTokenFilter(filters.location, item.locationTokens)) return false;
        if (!passesTokenFilter(filters.statusFlag, item.statusTokens)) return false;
        if (!passesTokenFilter(filters.identityTag, item.identityTokens)) return false;
        if (!passesTokenFilter(filters.language, item.languageTokens)) return false;
        if (!passesTokenFilter(filters.season, item.seasonTokens)) return false;
        return true;
      });

      if (!cleanedQuery) {
        const all: ProfileLiveRow[] = gated as unknown as ProfileLiveRow[];
        onResults(showAllIfEmpty ? [] : [], showAllIfEmpty ? all : [], "");
        return;
      }

      const qLower = normalizeText(cleanedQuery);
      const rawSegments = cleanedQuery
        .split(":")
        .map((s) => s.trim())
        .filter(Boolean);

      const quotedRaw = extractQuotedPhrase(cleanedQuery);
      const quoted = quotedRaw ? normalizeText(quotedRaw) : "";

      const rawQueryTerms = splitNormalizedTerms(cleanedQuery.replace(/:/g, " "));
      const queryTerms = expandQueryTerms(cleanedQuery.replace(/:/g, " "));
      const yearTerms = rawQueryTerms.filter((term) => /^(19|20)\d{2}$/.test(term));
      const nonYearTerms = rawQueryTerms.filter((term) => !/^(19|20)\d{2}$/.test(term));

      const rawColonQualifierText =
        rawSegments.length > 1 ? rawSegments.slice(1).join(" ") : "";

      const colonQualifierTerms = rawColonQualifierText
        ? splitNormalizedTerms(rawColonQualifierText).filter(
            (term) => !/^(19|20)\d{2}$/.test(term)
          )
        : [];

      const normalizedColonQualifierTerms =
        stripQualifierNoiseTerms(colonQualifierTerms);

      const colonQualifierBasePhrase = normalizeText(
        colonQualifierTerms.join(" ")
      );

      const hasExplicitColonQualifier = normalizedColonQualifierTerms.length > 0;

      const knownQualifierTokens = new Set<string>();
      const knownProgramTokens = new Set<string>();
      const knownProductionTokens = new Set<string>();

      (enrichedData ?? []).forEach((row) => {
        (row.locationTokens || []).forEach((token) => knownQualifierTokens.add(token));
        (row.programTokens || []).forEach((token) => {
          knownQualifierTokens.add(token);
          knownProgramTokens.add(token);
        });
        (row.productionTokens || []).forEach((token) => {
          knownQualifierTokens.add(token);
          knownProductionTokens.add(token);
        });
        (row.festivalTokens || []).forEach((token) => knownQualifierTokens.add(token));
        (row.seasonTokens || []).forEach((token) => knownQualifierTokens.add(token));
      });

      /**
       * If the full phrase after ":" exists as a known structured qualifier,
       * treat the whole phrase as a strict named qualifier.
       * This supports:
       *   ACTion: Heart of Europe
       *   Creative Trek: Zimbabwe
       */
      const hasKnownColonQualifierPhrase =
        !!colonQualifierBasePhrase &&
        knownQualifierTokens.has(colonQualifierBasePhrase);

      const inferredQualifierPhrase =
        !hasExplicitColonQualifier
          ? (() => {
              for (let start = 1; start < nonYearTerms.length; start += 1) {
                const rawCandidateTerms = nonYearTerms.slice(start);
                const candidateTerms = stripQualifierNoiseTerms(rawCandidateTerms);
                const candidatePhrase = normalizeText(rawCandidateTerms.join(" "));

                if (candidatePhrase && knownQualifierTokens.has(candidatePhrase)) {
                  return candidatePhrase;
                }

                if (candidateTerms.length === 0) continue;

                const structuredMatchCount = (enrichedData ?? []).filter((row) => {
                  const qualifierTokens = buildStructuredQualifierTokenSet(row);
                  return candidateTerms.every((term) => qualifierTokens.has(term));
                }).length;

                if (structuredMatchCount >= 3) {
                  return candidatePhrase;
                }
              }

              return "";
            })()
          : "";

      const inferredQualifierTerms = inferredQualifierPhrase
        ? stripQualifierNoiseTerms(
            expandQueryTerms(inferredQualifierPhrase).filter(
              (term) => !/^(19|20)\d{2}$/.test(term)
            )
          )
        : !hasExplicitColonQualifier &&
            nonYearTerms.length >= 3 &&
            knownQualifierTokens.has(nonYearTerms[nonYearTerms.length - 1])
          ? [nonYearTerms[nonYearTerms.length - 1]]
          : [];

      const strictQualifierTerms = hasExplicitColonQualifier
        ? normalizedColonQualifierTerms
        : inferredQualifierTerms;

      const strictQualifierPhrase = hasExplicitColonQualifier
        ? colonQualifierTerms.length >= 2 || hasKnownColonQualifierPhrase
          ? colonQualifierBasePhrase
          : ""
        : inferredQualifierPhrase;
      const coreTerms = stripQualifierNoiseTerms(
        nonYearTerms.filter((term) => !strictQualifierTerms.includes(term))
      );

      const fuzzyCoreTerms = stripQualifierNoiseTerms(
        queryTerms.filter(
          (term) =>
            !/^(19|20)\d{2}$/.test(term) &&
            !strictQualifierTerms.includes(term)
        )
      );

      const corePhrase = normalizeText(coreTerms.join(" "));
      const minCoreHits = Math.max(1, Math.min(2, coreTerms.length || fuzzyCoreTerms.length));

      const phraseWithoutYearsOrQualifiers = normalizeText(coreTerms.join(" "));
      const hasYearIntent = yearTerms.length > 0;
      const hasStrictQualifierIntent = strictQualifierTerms.length > 0;
      const multiTerm = queryTerms.length > 1;

      const standaloneStructuredQualifierPhrase =
        !hasStrictQualifierIntent &&
        nonYearTerms.length >= 2 &&
        (enrichedData ?? []).some((row) => {
          const qualifierTokens = buildStructuredQualifierTokenSet(row);
          return nonYearTerms.every((term) => qualifierTokens.has(term));
        })
          ? normalizeText(nonYearTerms.join(" "))
          : "";

      const effectiveQualifierPhrase =
        strictQualifierPhrase || standaloneStructuredQualifierPhrase;

      const treatAsStandaloneQualifierYearSearch =
        hasYearIntent &&
        !hasExplicitColonQualifier &&
        !!standaloneStructuredQualifierPhrase &&
        coreTerms.length <= 1;

      const searchBase: SearchRow[] = gated.filter((item) => {
        const flatTokens = buildFlatTokenSet(item);

        const structuredSearchText = normalizeText(
          [
            ...(item.locationTokens || []),
            ...(item.programTokens || []),
            ...(item.productionTokens || []),
            ...(item.festivalTokens || []),
            ...(item.seasonTokens || []),
          ].join(" ")
        );

        if (
          yearTerms.length > 0 &&
          !yearTerms.every(
            (term) => flatTokens.has(term) || structuredSearchText.includes(term)
          )
        ) {
          return false;
        }

        const qualifierTokens = buildStructuredQualifierTokenSet(item);

        if (
          hasStrictQualifierIntent &&
          !hasStructuredQualifierMatch(
            strictQualifierTerms,
            strictQualifierPhrase,
            qualifierTokens,
            structuredSearchText
          )
        ) {
          return false;
        }

        return true;
      });

      const scoredResults: {
        item: EnrichedProfileLiveRow;
        score: number;
        coverage: number;
        reasons: string[];
      }[] = [];

      const seen = new Set<string>();

      searchBase.forEach((item) => {
        let score = 0;
        const reasons: string[] = [];

        const nameNorm = normalizeText(item.name || "");
        const nameParts = nameNorm.split(" ").filter(Boolean);
        const aliasSet = new Set<string>(item.aliasTokens || []);

        const roleTokens = item.roleTokens || [];
        const locationTokens = item.locationTokens || [];
        const programTokens = item.programTokens || [];
        const productionTokens = item.productionTokens || [];
        const festivalTokens = item.festivalTokens || [];
        const bioTokens = item.bioTokens || [];
        const identityTokens = item.identityTokens || [];
        const statusTokens = item.statusTokens || [];
        const languageTokens = item.languageTokens || [];
        const seasonTokens = item.seasonTokens || [];

        const flatTokenSet = buildFlatTokenSet(item);

        const structuredExactQuery = quoted || qLower;

        const hasFullQueryExact =
          aliasSet.has(structuredExactQuery) ||
          programTokens.includes(structuredExactQuery) ||
          productionTokens.includes(structuredExactQuery) ||
          festivalTokens.includes(structuredExactQuery) ||
          seasonTokens.includes(structuredExactQuery) ||
          locationTokens.includes(structuredExactQuery) ||
          nameNorm === structuredExactQuery;

        const hasExactStructuredFieldMatch =
          programTokens.includes(structuredExactQuery) ||
          productionTokens.includes(structuredExactQuery) ||
          festivalTokens.includes(structuredExactQuery) ||
          locationTokens.includes(structuredExactQuery) ||
          seasonTokens.includes(structuredExactQuery);

          

        const qualifierTokenSet = buildStructuredQualifierTokenSet(item);

        const qualifierSearchText = normalizeText(
          [
            ...(item.locationTokens || []),
            ...(item.programTokens || []),
            ...(item.productionTokens || []),
            ...(item.festivalTokens || []),
            ...(item.seasonTokens || []),
          ].join(" ")
        );

        const hasAllYearTerms =
          yearTerms.length > 0 &&
          yearTerms.every(
            (term) => flatTokenSet.has(term) || qualifierSearchText.includes(term)
          );

        const hasAllStrictQualifierTerms = hasStructuredQualifierMatch(
          strictQualifierTerms,
          strictQualifierPhrase,
          qualifierTokenSet,
          qualifierSearchText
        );

        const projectSearchText = normalizeText(
          [
            ...(item.aliasTokens || []),
            ...(item.programTokens || []),
            ...(item.productionTokens || []),
            ...(item.festivalTokens || []),
            ...(item.locationTokens || []),
            ...(item.seasonTokens || []),
            ...(item.bioTokens || []),
          ].join(" ")
        );

        const projectPhraseMatch =
          !!phraseWithoutYearsOrQualifiers &&
          (
            aliasSet.has(phraseWithoutYearsOrQualifiers) ||
            programTokens.includes(phraseWithoutYearsOrQualifiers) ||
            productionTokens.includes(phraseWithoutYearsOrQualifiers) ||
            festivalTokens.includes(phraseWithoutYearsOrQualifiers) ||
            locationTokens.includes(phraseWithoutYearsOrQualifiers) ||
            seasonTokens.includes(phraseWithoutYearsOrQualifiers) ||
            bioTokens.includes(phraseWithoutYearsOrQualifiers) ||
            projectSearchText.includes(phraseWithoutYearsOrQualifiers)
          );

        const strongCoreTokenHits = coreTerms.filter(
          (term) =>
            aliasSet.has(term) ||
            programTokens.includes(term) ||
            productionTokens.includes(term) ||
            festivalTokens.includes(term) ||
            bioTokens.includes(term) ||
            locationTokens.includes(term) ||
            nameParts.includes(term)
        ).length;

        const strongStructuredCoreHits = coreTerms.filter(
          (term) =>
            aliasSet.has(term) ||
            programTokens.includes(term) ||
            productionTokens.includes(term) ||
            festivalTokens.includes(term) ||
            nameParts.includes(term)
        ).length;

        const coreProgramHits = fuzzyCoreTerms.filter(
          (term) => aliasSet.has(term) || programTokens.includes(term)
        ).length;

        const coreProductionHits = fuzzyCoreTerms.filter(
          (term) => aliasSet.has(term) || productionTokens.includes(term)
        ).length;

        const coreFestivalHits = fuzzyCoreTerms.filter(
          (term) => festivalTokens.includes(term)
        ).length;

        const coreLocationHits = fuzzyCoreTerms.filter(
          (term) => locationTokens.includes(term)
        ).length;

        const coreRoleHits = fuzzyCoreTerms.filter(
          (term) => roleTokens.includes(term)
        ).length;

        const coreNameHits = fuzzyCoreTerms.filter(
          (term) => nameParts.includes(term) || aliasSet.has(term)
        ).length;

        if (
          aliasIndex[qLower]?.includes(item.slug) ||
          (item.canonicalSlug && aliasIndex[qLower]?.includes(item.canonicalSlug))
        ) {
          score += 180;
          reasons.push("Alias Index Match");
        }

        if (aliasSet.has(qLower)) {
          score += 240;
          reasons.push("Alias Token Exact");
        }

        if (nameNorm === qLower) {
          score += 160;
          reasons.push("Full Name Exact");
        }

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

        if (programTokens.includes(qLower)) {
          score += 160;
          reasons.push("Exact Program Match");
        }

        if (productionTokens.includes(qLower)) {
          score += 160;
          reasons.push("Exact Production Match");
        }

        if (locationTokens.includes(qLower)) {
          score += 150;
          reasons.push("Exact Location Match");
        }

        if (languageTokens.includes(qLower)) {
          score += 150;
          reasons.push("Exact Language Match");
        }

        if (seasonTokens.includes(qLower)) {
          score += 150;
          reasons.push("Exact Season Match");
        }

        if (hasYearIntent && projectPhraseMatch && hasAllYearTerms) {
          score += 320;
          reasons.push("Project + Year Match");
        } else if (hasYearIntent && projectPhraseMatch && !hasAllYearTerms) {
          score -= 220;
          reasons.push("Missing Year Penalty");
        } else if (
          hasYearIntent &&
          strongCoreTokenHits >= Math.max(1, Math.min(2, coreTerms.length)) &&
          hasAllYearTerms
        ) {
          score += 180;
          reasons.push("Project Tokens + Year Match");
        } else if (
          hasYearIntent &&
          strongCoreTokenHits >= Math.max(1, Math.min(2, coreTerms.length)) &&
          !hasAllYearTerms
        ) {
          score -= 120;
          reasons.push("Project Tokens Missing Year");
        }

        if (hasStrictQualifierIntent && projectPhraseMatch && hasAllStrictQualifierTerms) {
          score += 320;
          reasons.push("Project + Qualifier Match");
        } else if (
          hasStrictQualifierIntent &&
          projectPhraseMatch &&
          !hasAllStrictQualifierTerms
        ) {
          score -= 220;
          reasons.push("Missing Qualifier Penalty");
        } else if (
          hasStrictQualifierIntent &&
          strongStructuredCoreHits >= Math.max(1, Math.min(2, coreTerms.length)) &&
          hasAllStrictQualifierTerms
        ) {
          score += 180;
          reasons.push("Project Tokens + Qualifier Match");
        } else if (
          hasStrictQualifierIntent &&
          strongStructuredCoreHits >= Math.max(1, Math.min(2, coreTerms.length)) &&
          !hasAllStrictQualifierTerms
        ) {
          score -= 120;
          reasons.push("Project Tokens Missing Qualifier");
        }

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

          if (languageTokens.includes(term)) {
            score += 90;
            reasons.push(`Language Match (${term})`);
          }

          if (seasonTokens.includes(term)) {
            score += 90;
            reasons.push(`Season Match (${term})`);
          }
        });

        const matchedQueryTerms = queryTerms.filter((term) => {
          if (yearTerms.includes(term)) {
            return flatTokenSet.has(term) || qualifierSearchText.includes(term);
          }

          return (
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
          );
        }).length;

        const coverage =
          queryTerms.length > 0 ? matchedQueryTerms / queryTerms.length : 0;

        const allTermsPresent =
          queryTerms.length > 0 && matchedQueryTerms === queryTerms.length;

        if (matchedQueryTerms > 1) {
          score += (matchedQueryTerms - 1) * 50;
          reasons.push("Multi-term Bonus");
        }

        if (matchedQueryTerms === queryTerms.length) {
          score += 150;
          reasons.push("Full Coverage Bonus");
        }

        if (multiTerm && coverage < 0.6) {
          score -= 50;
          reasons.push("Low Coverage Penalty");
        }

        const qualifiesStrictQualifierPrimary =
          !hasStrictQualifierIntent ||
          hasFullQueryExact ||
          (
            hasAllStrictQualifierTerms &&
            matchesCoreProjectIntent(
              coreTerms,
              strongCoreTokenHits,
              strongStructuredCoreHits,
              projectPhraseMatch
            )
          );

        const hasKnownProgramCorePhrase =
          !!corePhrase && knownProgramTokens.has(corePhrase);

        const hasKnownProductionCorePhrase =
          !!corePhrase && knownProductionTokens.has(corePhrase);

        const includeStructuredProjectPrimary =
          (
            hasYearIntent &&
            (hasStrictQualifierIntent || !!standaloneStructuredQualifierPhrase)
              ? (
                  (coreTerms.length === 0 || treatAsStandaloneQualifierYearSearch)
                    ? (
                        !!effectiveQualifierPhrase &&
                        (
                          programTokens.includes(effectiveQualifierPhrase) ||
                          productionTokens.includes(effectiveQualifierPhrase) ||
                          festivalTokens.includes(effectiveQualifierPhrase) ||
                          locationTokens.includes(effectiveQualifierPhrase) ||
                          seasonTokens.includes(effectiveQualifierPhrase)
                        )
                      )
                    : (
                        !!effectiveQualifierPhrase &&
                        (
                          programTokens.includes(effectiveQualifierPhrase) ||
                          productionTokens.includes(effectiveQualifierPhrase) ||
                          festivalTokens.includes(effectiveQualifierPhrase) ||
                          locationTokens.includes(effectiveQualifierPhrase) ||
                          seasonTokens.includes(effectiveQualifierPhrase)
                        ) &&
                        (
                          hasKnownProgramCorePhrase
                            ? coreProgramHits >= minCoreHits
                            : hasKnownProductionCorePhrase
                              ? coreProductionHits >= minCoreHits
                              : (
                                  coreProgramHits >= minCoreHits ||
                                  coreProductionHits >= minCoreHits ||
                                  coreFestivalHits >= minCoreHits ||
                                  coreLocationHits >= minCoreHits ||
                                  coreRoleHits >= minCoreHits ||
                                  coreNameHits >= minCoreHits
                                )
                        )
                      )
                )
              : (
                  (hasStrictQualifierIntent || !!standaloneStructuredQualifierPhrase) &&
                  coreTerms.length > 0
                    ? (
                        !!effectiveQualifierPhrase &&
                        (
                          programTokens.includes(effectiveQualifierPhrase) ||
                          productionTokens.includes(effectiveQualifierPhrase) ||
                          festivalTokens.includes(effectiveQualifierPhrase) ||
                          locationTokens.includes(effectiveQualifierPhrase) ||
                          seasonTokens.includes(effectiveQualifierPhrase)
                        ) &&
                        (
                          hasKnownProgramCorePhrase
                            ? coreProgramHits >= minCoreHits
                            : hasKnownProductionCorePhrase
                              ? coreProductionHits >= minCoreHits
                              : (
                                  coreProgramHits >= minCoreHits ||
                                  coreProductionHits >= minCoreHits ||
                                  coreFestivalHits >= minCoreHits ||
                                  coreLocationHits >= minCoreHits ||
                                  coreRoleHits >= minCoreHits ||
                                  coreNameHits >= minCoreHits
                                )
                        )
                      )
                    : (
                        matchesCoreProjectIntent(
                          coreTerms,
                          strongCoreTokenHits,
                          strongStructuredCoreHits,
                          projectPhraseMatch
                        ) ||
                        (
                          hasKnownProgramCorePhrase
                            ? coreProgramHits >= minCoreHits && hasYearIntent && coreTerms.length <= 1
                            : hasKnownProductionCorePhrase
                              ? coreProductionHits >= minCoreHits && hasYearIntent && coreTerms.length <= 1
                              : strongStructuredCoreHits >= 1 && hasYearIntent && coreTerms.length <= 1
                        ) ||
                        (
                          coverage >= 0.75 &&
                          (hasYearIntent || hasStrictQualifierIntent) &&
                          coreTerms.length <= 1
                        )
                      )
                )
          ) &&
          (!hasYearIntent || hasAllYearTerms) &&
          (!hasStrictQualifierIntent || hasAllStrictQualifierTerms);

        const requiresExplicitStructuredProjectPrimary =
          (
            hasYearIntent &&
            (
              hasExplicitColonQualifier ||
              hasStrictQualifierIntent ||
              !!standaloneStructuredQualifierPhrase
            )
          ) ||
          (
            (hasStrictQualifierIntent || !!standaloneStructuredQualifierPhrase) &&
            coreTerms.length > 0
          );

        const hasKnownStructuredQueryPhrase =
          !!structuredExactQuery && knownQualifierTokens.has(structuredExactQuery);

        const includeAsPrimary =
          hasKnownStructuredQueryPhrase &&
          !hasYearIntent &&
          !requiresExplicitStructuredProjectPrimary
            ? (
                hasExactStructuredFieldMatch ||
                aliasSet.has(qLower) ||
                nameNorm === qLower
              )
            : queryTerms.length === 1
              ? (score >= 120 || coverage >= 0.6) &&
                (!hasYearIntent || hasAllYearTerms || hasFullQueryExact) &&
                qualifiesStrictQualifierPrimary
              : (
                  requiresExplicitStructuredProjectPrimary
                    ? includeStructuredProjectPrimary
                    : (
                        hasKnownStructuredQueryPhrase
                          ? (
                              hasExactStructuredFieldMatch ||
                              aliasSet.has(qLower) ||
                              nameNorm === qLower ||
                              (!hasYearIntent && includeStructuredProjectPrimary)
                            )
                          : (
                              allTermsPresent ||
                              hasFullQueryExact ||
                              nameNorm === qLower ||
                              aliasSet.has(qLower) ||
                              includeStructuredProjectPrimary
                            )
                      )
                ) &&
                (!hasYearIntent || hasAllYearTerms || hasFullQueryExact) &&
                qualifiesStrictQualifierPrimary;

        if (includeAsPrimary) {
          scoredResults.push({
            item,
            score,
            coverage,
            reasons,
          });
          seen.add(keyOf(item));
        }
      });

      scoredResults.sort((a, b) => b.score - a.score);

      const primary: ProfileLiveRow[] = scoredResults.map(
        (r) => r.item as unknown as ProfileLiveRow
      );

      const secondary: ProfileLiveRow[] = [];

      const candidateQueries = Array.from(
        new Set(
          [
            cleanedQuery,
            qLower,
            strictQualifierPhrase || standaloneStructuredQualifierPhrase,
            queryTerms.join(" "),
            coreTerms.join(" "),
            ...(
              strictQualifierPhrase
                ? coreTerms
                : standaloneStructuredQualifierPhrase
                  ? []
                  : queryTerms
            ),
          ]
            .map((q) => q.trim())
            .filter(Boolean)
        )
      );

      const secondaryCandidates = new Map<string, EnrichedProfileLiveRow>();

      candidateQueries.forEach((candidateQuery) => {
        fuse.search(candidateQuery).forEach((result) => {
          const it = result.item as EnrichedProfileLiveRow;
          const k = keyOf(it);
          if (!secondaryCandidates.has(k)) {
            secondaryCandidates.set(k, it);
          }
        });
      });

      secondaryCandidates.forEach((it) => {
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

const flatTokens = buildFlatTokenSet(it);
const qualifierTokenSet = buildStructuredQualifierTokenSet(it);

const qualifierSearchText = normalizeText(
  [
    ...(it.locationTokens || []),
    ...(it.programTokens || []),
    ...(it.productionTokens || []),
    ...(it.festivalTokens || []),
    ...(it.seasonTokens || []),
  ].join(" ")
);

        if (
          yearTerms.length > 0 &&
          !yearTerms.every(
            (term) => flatTokens.has(term) || qualifierSearchText.includes(term)
          )
        ) {
          return;
        }
        if (
          hasStrictQualifierIntent &&
          !hasStructuredQualifierMatch(
            strictQualifierTerms,
            strictQualifierPhrase,
            qualifierTokenSet,
            qualifierSearchText
          )
        ) {
          return;
        }

        const secondaryProjectSearchText = normalizeText(
          [
            ...(it.aliasTokens || []),
            ...(it.programTokens || []),
            ...(it.productionTokens || []),
            ...(it.festivalTokens || []),
            ...(it.locationTokens || []),
            ...(it.seasonTokens || []),
            ...(it.bioTokens || []),
          ].join(" ")
        );

        const matchedTerms = queryTerms.filter((term) => flatTokens.has(term));
        const coreMatchedTerms = coreTerms.filter(
          (term) => flatTokens.has(term) || secondaryProjectSearchText.includes(term)
        );
        const structuredCoreMatchedTerms = coreTerms.filter(
          (term) =>
            (it.aliasTokens || []).includes(term) ||
            (it.programTokens || []).includes(term) ||
            (it.productionTokens || []).includes(term) ||
            (it.festivalTokens || []).includes(term) ||
            (it.locationTokens || []).includes(term) ||
            (it.seasonTokens || []).includes(term) ||
            secondaryProjectSearchText.includes(term) ||
            normalizeText(it.name || "").split(" ").includes(term)
        );

        if (
          standaloneStructuredQualifierPhrase &&
          stripQualifierNoiseTerms(nonYearTerms).length > 0 &&
          stripQualifierNoiseTerms(nonYearTerms).some(
            (term) => !qualifierTokenSet.has(term)
          )
        ) {
          return;
        }

        if (
          hasStrictQualifierIntent &&
          coreTerms.length > 0 &&
          !matchesCoreProjectIntent(
            coreTerms,
            coreMatchedTerms.length,
            structuredCoreMatchedTerms.length,
            false
          )
        ) {
          return;
        }

        if (queryTerms.length >= 3 && coreTerms.length > 0 && coreMatchedTerms.length === 0) {
          return;
        }

        if (queryTerms.length === 2 && matchedTerms.length === 0) {
          return;
        }

        const k = keyOf(it);

        if (!seen.has(k)) {
          secondary.push(it as unknown as ProfileLiveRow);
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
