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

import { bucketsForTitleToken, splitTitles } from "@/lib/titles";

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
    ...(item.locationExactTokens || []),
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
    ...(item.locationExactTokens || []),
    ...(item.festivalTokens || []),
    ...(item.seasonTokens || []),
  ]);
}

function hasWholePhraseInStructuredField(
  value: string | undefined,
  quotedPhrase: string
): boolean {
  const normalizedValue = normalizeText(String(value || ""));
  const normalizedPhrase = normalizeText(String(quotedPhrase || ""));

  if (!normalizedValue || !normalizedPhrase) return false;

  const escaped = normalizedPhrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const wholePhrasePattern = new RegExp(`(^|\\b)${escaped}(\\b|$)`);

  return wholePhrasePattern.test(normalizedValue);
}


function hasStructuredQualifierMatch(
  qualifierTerms: string[],
  qualifierPhrase: string,
  qualifierTokens: Set<string>,
  _structuredSearchText: string
): boolean {
  if (qualifierTerms.length === 0) return true;

  const hasExactPhrase =
    !!qualifierPhrase && qualifierTokens.has(qualifierPhrase);

  const hasAllTerms = qualifierTerms.every((term) =>
    qualifierTokens.has(term)
  );

  return hasAllTerms || hasExactPhrase;
}

function stripQualifierNoiseTerms(terms: string[]) {
  return terms.filter(
    (term) => term && !["a", "an", "of", "the", "and"].includes(term)
  );
}

function splitNormalizedTerms(value: string) {
  return normalizeText(value).split(" ").filter(Boolean);
}

function hasWholePhrase(value: string, phrase: string) {
  if (!value || !phrase) return false;

  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|\\b)${escaped}(\\b|$)`).test(value);
}

function fieldHasLooseWholePhrase(
  value: string | undefined,
  phrase: string
): boolean {
  const normalizedValue = normalizeText(String(value || ""));
  const normalizedPhrase = normalizeText(String(phrase || ""));

  if (!normalizedValue || !normalizedPhrase) return false;

  const articlelessValue = stripQualifierNoiseTerms(
    splitNormalizedTerms(normalizedValue)
  ).join(" ");

  const articlelessPhrase = stripQualifierNoiseTerms(
    splitNormalizedTerms(normalizedPhrase)
  ).join(" ");

  return (
    hasWholePhrase(normalizedValue, normalizedPhrase) ||
    hasWholePhrase(normalizedValue, articlelessPhrase) ||
    hasWholePhrase(articlelessValue, articlelessPhrase)
  );
}

function tokensHaveLooseWholePhrase(
  tokens: string[] | undefined,
  phrase: string
): boolean {
  if (!tokens?.length || !phrase) return false;
  return tokens.some((value) => fieldHasLooseWholePhrase(value, phrase));
}

function resolveProductionTypoOnlyPhrase(
  query: string,
  knownProductionTokens: Set<string>
): string {
  const normalizedQuery = stripQualifierNoiseTerms(
    splitNormalizedTerms(normalizeText(query)).filter(
      (term) => !/^(19|20)\d{2}$/.test(term)
    )
  ).join(" ");

  if (splitNormalizedTerms(normalizedQuery).length < 2) return "";

  const candidates = [...knownProductionTokens]
    .map((token) => ({
      raw: token,
      articleless: stripQualifierNoiseTerms(splitNormalizedTerms(token)).join(" "),
    }))
    .filter((item) => item.articleless);

  const exactLoose = candidates.find((item) =>
    fieldHasLooseWholePhrase(item.raw, normalizedQuery)
  );
  if (exactLoose) return exactLoose.raw;

  const fuse = new Fuse(candidates, {
    includeScore: true,
    threshold: 0.38,
    ignoreLocation: true,
    keys: [{ name: "articleless", weight: 1 }],
  });

  const best = fuse.search(normalizedQuery)[0];
  if (!best || typeof best.score !== "number" || best.score > 0.38) {
    return "";
  }

  return best.item.raw;
}

function resolveUnquotedMultiTermProductionPhrase(
  query: string,
  knownProductionTokens: Set<string>
): string {
  const normalizedQuery = normalizeText(query);

  const queryTerms = stripQualifierNoiseTerms(
    splitNormalizedTerms(normalizedQuery).filter(
      (term) => !/^(19|20)\d{2}$/.test(term)
    )
  );

  if (queryTerms.length < 2) return "";

  const loosePhrase = queryTerms.join(" ");
  const candidates = [...knownProductionTokens].filter(Boolean);

  const exactLoose = candidates.find((token) =>
    fieldHasLooseWholePhrase(token, loosePhrase)
  );
  if (exactLoose) return exactLoose;

  const tokenFuse = new Fuse(
    candidates.map((token) => ({
      raw: token,
      articleless: stripQualifierNoiseTerms(splitNormalizedTerms(token)).join(" "),
    })),
    {
      includeScore: true,
      threshold: 0.28,
      ignoreLocation: true,
      keys: [{ name: "articleless", weight: 1 }],
    }
  );

  const best = tokenFuse.search(loosePhrase)[0];
  if (!best || typeof best.score !== "number" || best.score > 0.28) {
    return "";
  }

  return best.item.raw;
}

function singularizeSimplePhrase(value: string) {
  return normalizeText(value)
    .split(" ")
    .filter(Boolean)
    .map((term) => {
      if (term.endsWith("ies") && term.length > 3) {
        return `${term.slice(0, -3)}y`;
      }
      if (term.endsWith("s") && !term.endsWith("ss") && term.length > 3) {
        return term.slice(0, -1);
      }
      return term;
    })
    .join(" ");
}

function buildStructuredComboKey(parts: string[]) {
  return normalizeText(parts.join(" "))
    .split(" ")
    .filter(Boolean)
    .sort()
    .join(" ");
}

function findLongestKnownPhrase(
  terms: string[],
  knownPhrases: Set<string>
): { phrase: string; terms: string[] } {
  for (let size = terms.length; size >= 1; size -= 1) {
    for (let start = 0; start <= terms.length - size; start += 1) {
      const slice = terms.slice(start, start + size);
      const phrase = normalizeText(slice.join(" "));
      if (phrase && knownPhrases.has(phrase)) {
        return { phrase, terms: slice };
      }
    }
  }

  return { phrase: "", terms: [] };
}

function removeMatchedPhrase(terms: string[], matchedTerms: string[]) {
  if (matchedTerms.length === 0) return terms;

  for (let start = 0; start <= terms.length - matchedTerms.length; start += 1) {
    const slice = terms.slice(start, start + matchedTerms.length);
    if (slice.join(" ") === matchedTerms.join(" ")) {
      return [...terms.slice(0, start), ...terms.slice(start + matchedTerms.length)];
    }
  }

  return terms;
}

function hasStructuredTokenContainingAllParts(
  tokens: string[] | undefined,
  parts: string[]
): boolean {
  if (!tokens?.length || parts.length === 0) return false;

  return tokens.some((token) => {
    const normalizedToken = normalizeText(token);
    return parts.every((part) => normalizedToken.includes(normalizeText(part)));
  });
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

function itemMatchesTeachingArtistsBucket(item: EnrichedProfileLiveRow): boolean {
  const tokens = new Set<string>();

  for (const role of item.mergedRoles || []) {
    const clean = String(role || "").trim();
    if (clean) tokens.add(clean);
  }

  for (const title of splitTitles(item.currentTitle || "")) {
    const clean = String(title || "").trim();
    if (clean) tokens.add(clean);
  }

  for (const token of tokens) {
    if (bucketsForTitleToken(token).includes("teaching-artists")) {
      return true;
    }
  }

  return false;
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
        threshold: 0.42,
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

      const quotedRaw = extractQuotedPhrase(cleanedQuery);
      const quoted = quotedRaw ? normalizeText(quotedRaw) : "";

      const rawTrimmedQuery = cleanedQuery.trim();
      const hasWholeQuotedQuery =
        /^".+"$/.test(rawTrimmedQuery) ||
        /^“.+”$/.test(rawTrimmedQuery) ||
        /^".+”$/.test(rawTrimmedQuery) ||
        /^“.+"$/.test(rawTrimmedQuery);

      const effectiveCleanedQuery =
        !hasWholeQuotedQuery
          ? cleanedQuery.replace(
              /\b(?:[A-Za-z]\.){2,}[A-Za-z]?\.?/g,
              (match) => match.replace(/\./g, "")
            )
          : cleanedQuery;

      const qLower = normalizeText(effectiveCleanedQuery);
      const rawSegments = effectiveCleanedQuery
        .split(":")
        .map((s) => s.trim())
        .filter(Boolean);

      const normalizedBucketQuery = normalizeText(effectiveCleanedQuery);

      if (
        !hasWholeQuotedQuery &&
        (
          normalizedBucketQuery === "teaching artist" ||
          normalizedBucketQuery === "teaching artists"
        )
      ) {
        const teachingArtistMatches: ProfileLiveRow[] = gated
          .filter((item) => itemMatchesTeachingArtistsBucket(item))
          .map((item) => item as unknown as ProfileLiveRow);

        onResults(teachingArtistMatches, [], cleanedQuery);
        return;
      }

      const rawQueryTerms = splitNormalizedTerms(effectiveCleanedQuery.replace(/:/g, " "));
      const queryTerms = expandQueryTerms(effectiveCleanedQuery.replace(/:/g, " "));

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
      const knownLocationTokens = new Set<string>();
      const knownProgramTokens = new Set<string>();
      const knownProductionTokens = new Set<string>();

      (enrichedData ?? []).forEach((row) => {
        (row.locationExactTokens || []).forEach((token) => {
          knownQualifierTokens.add(token);
          knownLocationTokens.add(token);
        });
        (row.festivalTokens || []).forEach((token) => knownQualifierTokens.add(token));
        (row.seasonTokens || []).forEach((token) => knownQualifierTokens.add(token));

        (row.programTokens || []).forEach((token) => knownProgramTokens.add(token));
        (row.productionTokens || []).forEach((token) => knownProductionTokens.add(token));
      });

      const knownCoreTokens = new Set<string>([
        ...knownProgramTokens,
        ...knownProductionTokens,
      ]);

      const unquotedProductionTypoQuery = stripQualifierNoiseTerms(
        splitNormalizedTerms(qLower).filter((term) => !/^(19|20)\d{2}$/.test(term))
      ).join(" ");

      const shouldTryUnquotedProductionTypoFallback =
        !hasWholeQuotedQuery &&
        !cleanedQuery.includes(":") &&
        splitNormalizedTerms(unquotedProductionTypoQuery).length >= 2 &&
        ![...knownProgramTokens].some((token) =>
          fieldHasLooseWholePhrase(token, unquotedProductionTypoQuery)
        ) &&
        ![...knownLocationTokens].some((token) =>
          fieldHasLooseWholePhrase(token, unquotedProductionTypoQuery)
        ) &&
        ![...knownQualifierTokens].some((token) =>
          fieldHasLooseWholePhrase(token, unquotedProductionTypoQuery)
        );

      const resolvedUnquotedProductionTypo =
        shouldTryUnquotedProductionTypoFallback
          ? resolveProductionTypoOnlyPhrase(
              unquotedProductionTypoQuery,
              knownProductionTokens
            )
          : "";

      if (resolvedUnquotedProductionTypo) {
        const unquotedProductionTypoMatches: ProfileLiveRow[] = gated
          .filter((item) =>
            tokensHaveLooseWholePhrase(
              item.productionTokens,
              resolvedUnquotedProductionTypo
            )
          )
          .map((item) => item as unknown as ProfileLiveRow);

        onResults(unquotedProductionTypoMatches, [], cleanedQuery);
        return;
      }

      const isKnownQuotedProductionQuery =
        hasWholeQuotedQuery &&
        !!quoted &&
        [...knownProductionTokens].some((token) =>
          fieldHasLooseWholePhrase(token, quoted)
        );

      if (isKnownQuotedProductionQuery) {
        const exactProductionMatches: ProfileLiveRow[] = gated
          .filter((item) => tokensHaveLooseWholePhrase(item.productionTokens, quoted))
          .map((item) => item as unknown as ProfileLiveRow);

        onResults(exactProductionMatches, [], cleanedQuery);
        return;
      }

      const resolvedUnquotedProductionPhrase =
        !hasWholeQuotedQuery && !cleanedQuery.includes(":")
          ? resolveUnquotedMultiTermProductionPhrase(cleanedQuery, knownProductionTokens)
          : "";

      if (resolvedUnquotedProductionPhrase) {
        const unquotedProductionMatches: ProfileLiveRow[] = gated
          .filter((item) =>
            tokensHaveLooseWholePhrase(
              item.productionTokens,
              resolvedUnquotedProductionPhrase
            )
          )
          .map((item) => item as unknown as ProfileLiveRow);

        onResults(unquotedProductionMatches, [], cleanedQuery);
        return;
      }

      const knownInferableCoreTokens = new Set<string>(
        [...knownCoreTokens].filter((token) => {
          const terms = splitNormalizedTerms(token);

          return (
            terms.length > 0 &&
            !terms.some((term) => /^(19|20)\d{2}$/.test(term)) &&
            !terms.some((term) => knownQualifierTokens.has(term))
          );
        })
      );

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

      const inferredCoreMatch = !hasExplicitColonQualifier
        ? findLongestKnownPhrase(nonYearTerms, knownInferableCoreTokens)
        : { phrase: "", terms: [] as string[] };

      const remainingNonYearTerms = !hasExplicitColonQualifier
        ? removeMatchedPhrase(nonYearTerms, inferredCoreMatch.terms)
        : nonYearTerms;

      const inferredQualifierMatch = !hasExplicitColonQualifier
        ? findLongestKnownPhrase(remainingNonYearTerms, knownQualifierTokens)
        : { phrase: "", terms: [] as string[] };

      const strictQualifierTerms = hasExplicitColonQualifier
        ? normalizedColonQualifierTerms
        : stripQualifierNoiseTerms(inferredQualifierMatch.terms);

      const strictQualifierPhrase = hasExplicitColonQualifier
        ? colonQualifierTerms.length >= 2 || hasKnownColonQualifierPhrase
          ? colonQualifierBasePhrase
          : ""
        : inferredQualifierMatch.phrase;

      const coreTerms =
        !hasExplicitColonQualifier && inferredCoreMatch.phrase
          ? stripQualifierNoiseTerms(inferredCoreMatch.terms)
          : stripQualifierNoiseTerms(
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

      const standaloneStructuredQualifierPhrase = "";

      const effectiveQualifierPhrase =
        strictQualifierPhrase || standaloneStructuredQualifierPhrase;

      const hasKnownStructuredCorePhrase =
        !!corePhrase &&
        (knownProgramTokens.has(corePhrase) || knownProductionTokens.has(corePhrase));

      const hasStructuredQualifierComboIntent =
        hasKnownStructuredCorePhrase &&
        !!effectiveQualifierPhrase &&
        coreTerms.length > 0;

      const structuredQualifierComboKey = hasStructuredQualifierComboIntent
        ? buildStructuredComboKey([coreTerms.join(" "), effectiveQualifierPhrase])
        : "";

      const hasStructuredCoreYearComboIntent =
        hasKnownStructuredCorePhrase &&
        hasYearIntent &&
        coreTerms.length > 0;

      const structuredCoreYearComboKey = hasStructuredCoreYearComboIntent
        ? buildStructuredComboKey([coreTerms.join(" "), yearTerms.join(" ")])
        : "";

      const hasStructuredYearComboIntent =
        hasStructuredQualifierComboIntent &&
        hasYearIntent;

      const structuredYearComboKey = hasStructuredYearComboIntent
        ? buildStructuredComboKey([
            coreTerms.join(" "),
            effectiveQualifierPhrase,
            yearTerms.join(" "),
          ])
        : "";

      const treatAsStandaloneQualifierYearSearch =
        hasYearIntent &&
        !hasExplicitColonQualifier &&
        !!standaloneStructuredQualifierPhrase &&
        coreTerms.length <= 1;

      const structuredExactQuery = quoted || qLower;
      const normalizedExactRoleQuery =
        singularizeSimplePhrase(structuredExactQuery);

      const isTeachingArtistsBucketQuery =
        structuredExactQuery === "teaching artist" ||
        structuredExactQuery === "teaching artists";

      const hasKnownStructuredQualifierQueryPhrase =
        !!structuredExactQuery && knownQualifierTokens.has(structuredExactQuery);

      const hasKnownStructuredCoreQueryPhrase =
        !!structuredExactQuery &&
        (
          knownProgramTokens.has(structuredExactQuery) ||
          knownProductionTokens.has(structuredExactQuery)
        );

      const hasKnownStructuredQueryPhrase =
        hasKnownStructuredQualifierQueryPhrase ||
        hasKnownStructuredCoreQueryPhrase;

      const isExactStructuredCoreOnlyQuery =
        !!structuredExactQuery &&
        !hasYearIntent &&
        !hasExplicitColonQualifier &&
        hasKnownStructuredCoreQueryPhrase &&
        corePhrase === structuredExactQuery &&
        !effectiveQualifierPhrase;

      const isExactStructuredQualifierOnlyQuery =
        !!structuredExactQuery &&
        !hasYearIntent &&
        !hasExplicitColonQualifier &&
        hasKnownStructuredQualifierQueryPhrase &&
        effectiveQualifierPhrase === structuredExactQuery &&
        coreTerms.length === 0;

      const suppressSecondaryForExactStructuredOnlyQuery =
        isExactStructuredCoreOnlyQuery || isExactStructuredQualifierOnlyQuery;

      const isSingleTermExactLocationQuery =
        queryTerms.length === 1 &&
        !hasYearIntent &&
        !hasExplicitColonQualifier &&
        knownLocationTokens.has(structuredExactQuery);

      const hasStructuredQualifierYearOnlyComboIntent =
        hasYearIntent &&
        hasStrictQualifierIntent &&
        coreTerms.length === 0;

      const structuredQualifierYearOnlyParts =
        hasStructuredQualifierYearOnlyComboIntent && effectiveQualifierPhrase
          ? [effectiveQualifierPhrase, ...yearTerms]
          : [];

      const isQualifierOnlyYearSearch =
        hasYearIntent &&
        hasStrictQualifierIntent &&
        coreTerms.length === 0;

      const searchBase: SearchRow[] = gated.filter((item) => {
        const flatTokens = buildFlatTokenSet(item);

      const structuredSearchText = normalizeText(
        [
          ...(item.locationTokens || []),
          ...(item.festivalTokens || []),
          ...(item.seasonTokens || []),
        ].join(" ")
      );

        if (
          yearTerms.length > 0 &&
          !yearTerms.every((term) =>
            isQualifierOnlyYearSearch
              ? structuredSearchText.includes(term)
              : flatTokens.has(term) || structuredSearchText.includes(term)
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

        if (
          hasStructuredQualifierYearOnlyComboIntent &&
          !(
            hasStructuredTokenContainingAllParts(item.aliasTokens, structuredQualifierYearOnlyParts) ||
            hasStructuredTokenContainingAllParts(item.programTokens, structuredQualifierYearOnlyParts) ||
            hasStructuredTokenContainingAllParts(item.productionTokens, structuredQualifierYearOnlyParts) ||
            hasStructuredTokenContainingAllParts(item.locationTokens, structuredQualifierYearOnlyParts) ||
            hasStructuredTokenContainingAllParts(item.festivalTokens, structuredQualifierYearOnlyParts) ||
            hasStructuredTokenContainingAllParts(item.seasonTokens, structuredQualifierYearOnlyParts)
          )
        ) {
          return false;
        }

        if (
          hasStructuredQualifierComboIntent &&
          !(
            (item.aliasTokens || []).includes(structuredQualifierComboKey) ||
            (item.programTokens || []).includes(structuredQualifierComboKey) ||
            (item.productionTokens || []).includes(structuredQualifierComboKey)
          )
        ) {
          return false;
        }

        if (hasStructuredCoreYearComboIntent) {
          const hasExactCoreYearCombo =
            (item.aliasTokens || []).includes(structuredCoreYearComboKey) ||
            (item.programTokens || []).includes(structuredCoreYearComboKey) ||
            (item.productionTokens || []).includes(structuredCoreYearComboKey);

          const hasExactCorePhrase =
            !!corePhrase &&
            (
              (item.aliasTokens || []).includes(corePhrase) ||
              (item.programTokens || []).includes(corePhrase) ||
              (item.productionTokens || []).includes(corePhrase)
            );

          if (!hasExactCoreYearCombo && !hasExactCorePhrase) {
            return false;
          }
        }

        if (
          hasStructuredYearComboIntent &&
          !(
            (item.aliasTokens || []).includes(structuredYearComboKey) ||
            (item.programTokens || []).includes(structuredYearComboKey) ||
            (item.productionTokens || []).includes(structuredYearComboKey)
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
        const locationExactTokens = item.locationExactTokens || [];
        const programTokens = item.programTokens || [];
        const productionTokens = item.productionTokens || [];
        const festivalTokens = item.festivalTokens || [];
        const bioTokens = item.bioTokens || [];
        const identityTokens = item.identityTokens || [];
        const statusTokens = item.statusTokens || [];
        const languageTokens = item.languageTokens || [];
        const seasonTokens = item.seasonTokens || [];

        const hasEffectiveQualifierFieldMatch =
          !!effectiveQualifierPhrase &&
          (
            festivalTokens.includes(effectiveQualifierPhrase) ||
            locationExactTokens.includes(effectiveQualifierPhrase) ||
            seasonTokens.includes(effectiveQualifierPhrase)
          );

        const flatTokenSet = buildFlatTokenSet(item);

        const hasFullQueryExact =
          aliasSet.has(structuredExactQuery) ||
          programTokens.includes(structuredExactQuery) ||
          productionTokens.includes(structuredExactQuery) ||
          festivalTokens.includes(structuredExactQuery) ||
          seasonTokens.includes(structuredExactQuery) ||
          locationExactTokens.includes(structuredExactQuery) ||
          roleTokens.includes(structuredExactQuery) ||
          roleTokens.includes(normalizedExactRoleQuery) ||
          nameNorm === structuredExactQuery;

        const hasExactCoreFieldMatch =
          programTokens.includes(structuredExactQuery) ||
          productionTokens.includes(structuredExactQuery);

        const hasExactQualifierFieldMatch =
          festivalTokens.includes(structuredExactQuery) ||
          locationExactTokens.includes(structuredExactQuery) ||
          seasonTokens.includes(structuredExactQuery);

        const hasExactStructuredFieldMatch =
          hasExactCoreFieldMatch || hasExactQualifierFieldMatch;

        const matchesTeachingArtistsBucket =
          isTeachingArtistsBucketQuery &&
          itemMatchesTeachingArtistsBucket(item);

        const qualifierTokenSet = buildStructuredQualifierTokenSet(item);

        const qualifierSearchText = normalizeText(
          [
            ...(item.locationTokens || []),
            ...(item.festivalTokens || []),
            ...(item.seasonTokens || []),
          ].join(" ")
        );

        const hasAllYearTerms =
          yearTerms.length > 0 &&
          yearTerms.every((term) =>
            isQualifierOnlyYearSearch
              ? qualifierSearchText.includes(term)
              : flatTokenSet.has(term) || qualifierSearchText.includes(term)
          );

        const hasAllStrictQualifierTerms = hasStructuredQualifierMatch(
          strictQualifierTerms,
          strictQualifierPhrase,
          qualifierTokenSet,
          qualifierSearchText
        );

        const projectPhraseMatch =
          !!phraseWithoutYearsOrQualifiers &&
          (
            tokensHaveLooseWholePhrase(item.aliasTokens, phraseWithoutYearsOrQualifiers) ||
            tokensHaveLooseWholePhrase(programTokens, phraseWithoutYearsOrQualifiers) ||
            tokensHaveLooseWholePhrase(productionTokens, phraseWithoutYearsOrQualifiers) ||
            tokensHaveLooseWholePhrase(festivalTokens, phraseWithoutYearsOrQualifiers) ||
            tokensHaveLooseWholePhrase(locationTokens, phraseWithoutYearsOrQualifiers) ||
            tokensHaveLooseWholePhrase(seasonTokens, phraseWithoutYearsOrQualifiers)
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

        if (locationExactTokens.includes(qLower)) {
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
            return isQualifierOnlyYearSearch
              ? qualifierSearchText.includes(term)
              : flatTokenSet.has(term) || qualifierSearchText.includes(term);
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
                    ? hasEffectiveQualifierFieldMatch
                    : (
                        hasEffectiveQualifierFieldMatch &&
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
                        hasEffectiveQualifierFieldMatch &&
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
                          hasYearIntent &&
                          (
                            hasKnownProgramCorePhrase
                              ? coreProgramHits >= minCoreHits
                              : hasKnownProductionCorePhrase
                                ? coreProductionHits >= minCoreHits
                                : strongStructuredCoreHits >= minCoreHits
                          )
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

        const includeAsPrimary =
          matchesTeachingArtistsBucket
            ? true
            : suppressSecondaryForExactStructuredOnlyQuery
              ? (
                  isExactStructuredCoreOnlyQuery
                    ? (
                        hasExactCoreFieldMatch ||
                        aliasSet.has(qLower) ||
                        nameNorm === qLower
                      )
                    : isExactStructuredQualifierOnlyQuery
                      ? hasExactQualifierFieldMatch
                      : false
                )
              : hasKnownStructuredQueryPhrase &&
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

const candidateQueries =
  hasWholeQuotedQuery || suppressSecondaryForExactStructuredOnlyQuery
    ? []
    : Array.from(
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
          ...(it.festivalTokens || []),
          ...(it.seasonTokens || []),
        ].join(" ")
      );

        if (
          yearTerms.length > 0 &&
          !yearTerms.every((term) =>
            isQualifierOnlyYearSearch
              ? qualifierSearchText.includes(term)
              : flatTokens.has(term) || qualifierSearchText.includes(term)
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

        if (
          hasStructuredQualifierYearOnlyComboIntent &&
          !(
            hasStructuredTokenContainingAllParts(it.aliasTokens, structuredQualifierYearOnlyParts) ||
            hasStructuredTokenContainingAllParts(it.programTokens, structuredQualifierYearOnlyParts) ||
            hasStructuredTokenContainingAllParts(it.productionTokens, structuredQualifierYearOnlyParts) ||
            hasStructuredTokenContainingAllParts(it.locationTokens, structuredQualifierYearOnlyParts) ||
            hasStructuredTokenContainingAllParts(it.festivalTokens, structuredQualifierYearOnlyParts) ||
            hasStructuredTokenContainingAllParts(it.seasonTokens, structuredQualifierYearOnlyParts)
          )
        ) {
          return;
        }

        if (
          hasStructuredQualifierComboIntent &&
          !(
            (it.aliasTokens || []).includes(structuredQualifierComboKey) ||
            (it.programTokens || []).includes(structuredQualifierComboKey) ||
            (it.productionTokens || []).includes(structuredQualifierComboKey)
          )
        ) {
          return;
        }

        if (hasStructuredCoreYearComboIntent) {
          const hasExactCoreYearCombo =
            (it.aliasTokens || []).includes(structuredCoreYearComboKey) ||
            (it.programTokens || []).includes(structuredCoreYearComboKey) ||
            (it.productionTokens || []).includes(structuredCoreYearComboKey);

          const hasExactCorePhrase =
            !!corePhrase &&
            (
              (it.aliasTokens || []).includes(corePhrase) ||
              (it.programTokens || []).includes(corePhrase) ||
              (it.productionTokens || []).includes(corePhrase)
            );

          if (!hasExactCoreYearCombo && !hasExactCorePhrase) {
            return;
          }
        }

        if (
          hasStructuredYearComboIntent &&
          !(
            (it.aliasTokens || []).includes(structuredYearComboKey) ||
            (it.programTokens || []).includes(structuredYearComboKey) ||
            (it.productionTokens || []).includes(structuredYearComboKey)
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

        if (queryTerms.length === 1 && matchedTerms.length === 0) {
          return;
        }

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
