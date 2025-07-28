import { programMap } from "@/lib/programMap";
import { productionMap } from "@/lib/productionMap";

/** ✅ Normalize strings for consistent search */
export function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/** ✅ Clean query string */
export function cleanQuery(query: string): string {
  return query.trim();
}

/** ✅ Split query into normalized terms */
export function expandQueryTerms(query: string): string[] {
  return query.split(/\s+/).map(normalizeText).filter(Boolean);
}

/** ✅ Extract quoted phrase for exact-match mode */
export function extractQuotedPhrase(query: string): string | null {
  const match = query.match(/"([^"]+)"/);
  return match ? normalizeText(match[1]) : null;
}

/** ✅ Extract any year tokens */
export function extractYears(query: string): string[] {
  return query.match(/\b(19|20)\d{2}\b/g) || [];
}

/** ✅ Extract known locations from query */
export function extractLocations(query: string): string[] {
  const lower = normalizeText(query);
  const knownLocations = [
    "nyc",
    "ecuador",
    "slovakia",
    "quito",
    "baltimore",
    "pittsburgh",
    "rochester"
  ];
  return knownLocations.filter((loc) => lower.includes(loc));
}

/** ✅ Levenshtein distance for typo tolerance */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length,
    n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/** ✅ Optional custom aliases for tricky cases */
const customAliases: Record<string, string[]> = {
  "action slovakia": ["heart of europe"],
  "slovakia": ["heart of europe"],
  "ecuador": ["andes", "amazon"]
};

/** ✅ Build Alias Index for strict matches */
export function buildAliasIndex(): Record<string, string[]> {
  const index: Record<string, string[]> = {};

  const addAlias = (alias: string, slugs: string[]) => {
    if (!alias) return;
    if (!index[alias]) index[alias] = [];
    index[alias].push(...slugs);
  };

  /** ✅ Programs */
  for (const key in programMap) {
    const prog = programMap[key];
    const slugs = Object.keys(prog.artists);

    const aliases = [
      normalizeText(prog.title), // Full title
      normalizeText(prog.program), // Program name
      normalizeText(prog.program.replace(/^action[:\s]+/i, "")), // Remove ACTion prefix
      normalizeText(prog.location), // Location
      normalizeText(`${prog.program} ${prog.year}`), // Program + Year
      normalizeText(`${prog.program} ${prog.location}`), // Program + Location
      normalizeText(`${prog.program} ${prog.location} ${prog.year}`) // Program + Location + Year
    ];

    aliases.forEach(alias => addAlias(alias, slugs));
  }

  /** ✅ Productions */
  for (const key in productionMap) {
    const prod = productionMap[key];
    const slugs = Object.keys(prod.artists);

    const aliases = [
      normalizeText(prod.title),
      ...(prod.festival ? prod.festival.split(/[:—-]/).map(normalizeText) : []),
      normalizeText(prod.location),
      normalizeText(`${prod.title} ${prod.year}`)
    ];

    aliases.forEach(alias => addAlias(alias, slugs));
  }

  /** ✅ Inject custom aliases */
  for (const alias in customAliases) {
    const linkedAliases = customAliases[alias];
    linkedAliases.forEach(linked => {
      if (index[linked]) {
        addAlias(alias, index[linked]);
      }
    });
  }

  /** ✅ Deduplicate slugs for each alias */
  for (const alias in index) {
    index[alias] = Array.from(new Set(index[alias]));
  }

  return index;
}
