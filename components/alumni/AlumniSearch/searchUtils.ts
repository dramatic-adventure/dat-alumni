import { programMap } from "@/lib/programMap";
import { productionMap } from "@/lib/productionMap";

/** ✅ Normalize strings for consistent search (diacritics + punctuation tolerant) */
export function normalizeText(text: string): string {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")     // strip diacritics
    .replace(/[^a-z0-9]+/g, " ")         // punctuation -> space
    .trim()
    .replace(/\s+/g, " ");               // collapse spaces
}

/** ✅ Extra variants for names like "J'nelle" => "jnelle" */
export function normalizeNameNoSpace(text: string): string {
  return normalizeText(text).replace(/\s/g, "");
}

/** ✅ Clean query string */
export function cleanQuery(query: string): string {
  return (query || "").trim();
}

/** ✅ Split query into normalized terms */
export function expandQueryTerms(query: string): string[] {
  const base = normalizeText(query);
  if (!base) return [];
  const terms = base.split(/\s+/).filter(Boolean);

  // also include no-space version for name-like matching
  const noSpace = normalizeNameNoSpace(query);
  if (noSpace && noSpace !== base) terms.push(noSpace);

  return Array.from(new Set(terms));
}

/** ✅ Extract quoted phrase for exact-match mode */
export function extractQuotedPhrase(query: string): string | null {
  const match = (query || "").match(/"([^"]+)"/);
  return match ? normalizeText(match[1]) : null;
}

/** ✅ Extract any year tokens */
export function extractYears(query: string): string[] {
  return (query || "").match(/\b(19|20)\d{2}\b/g) || [];
}

/** ✅ Extract known locations from query */
export function extractLocations(query: string): string[] {
  const lower = normalizeText(query);
  const knownLocations = [
    "nyc",
    "new york",
    "ecuador",
    "slovakia",
    "quito",
    "baltimore",
    "pittsburgh",
    "rochester",
  ];
  return knownLocations
    .map(normalizeText)
    .filter((loc) => loc && lower.includes(loc));
}

/** ✅ Levenshtein distance for typo tolerance */
export function levenshteinDistance(a: string, b: string): number {
  const A = a || "";
  const B = b || "";
  const m = A.length;
  const n = B.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        A[i - 1] === B[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/** ✅ Optional custom aliases for tricky cases */
const customAliases: Record<string, string[]> = {
  "action slovakia": ["heart of europe"],
  slovakia: ["heart of europe"],
  ecuador: ["andes", "amazon"],
};

/** ✅ Build Alias Index for strict matches */
export function buildAliasIndex(): Record<string, string[]> {
  const index: Record<string, string[]> = {};

  const addAlias = (alias: string, slugs: string[]) => {
    const a = normalizeText(alias);
    if (!a) return;
    if (!index[a]) index[a] = [];
    index[a].push(...slugs.map((s) => normalizeText(s)).filter(Boolean));
  };

  /** ✅ Programs */
  for (const key in programMap) {
    const prog = programMap[key];
    const slugs = Object.keys(prog.artists || {});

    const aliases = [
      normalizeText(prog.title),
      normalizeText(prog.program),
      normalizeText(prog.program.replace(/^action[:\s]+/i, "")),
      normalizeText(prog.location),
      normalizeText(`${prog.program} ${prog.year}`),
      normalizeText(`${prog.program} ${prog.location}`),
      normalizeText(`${prog.program} ${prog.location} ${prog.year}`),
    ];

    aliases.forEach((alias) => addAlias(alias, slugs));
  }

  /** ✅ Productions */
  for (const key in productionMap) {
    const prod = productionMap[key];
    const slugs = Object.keys(prod.artists || {});

    const aliases = [
      normalizeText(prod.title),
      ...(prod.festival ? prod.festival.split(/[:—-]/).map(normalizeText) : []),
      normalizeText(prod.location),
      normalizeText(`${prod.title} ${prod.year}`),
    ];

    aliases.forEach((alias) => addAlias(alias, slugs));
  }

  /** ✅ Inject custom aliases */
  for (const alias in customAliases) {
    const linkedAliases = customAliases[alias] || [];
    linkedAliases.forEach((linked) => {
      const lk = normalizeText(linked);
      if (index[lk]) addAlias(alias, index[lk]);
    });
  }

  /** ✅ Deduplicate slugs for each alias */
  for (const alias in index) {
    index[alias] = Array.from(new Set(index[alias]));
  }

  return index;
}
