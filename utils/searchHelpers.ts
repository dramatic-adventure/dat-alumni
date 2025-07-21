/**
 * ✅ Normalize text for consistent searching:
 * - Lowercase
 * - Remove diacritics (accents)
 * - Remove punctuation
 * - Trim spaces
 */
export function normalizeText(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD") // Decompose accents
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^a-z0-9\s]/g, "") // Remove punctuation
    .trim();
}

/**
 * ✅ Synonym Map for better matching
 * Expanded with:
 * - Locations
 * - Roles
 * - Programs
 * - Productions
 * - Festivals
 * - Common tags
 */
export const synonymMap: Record<string, string[]> = {
  // 🌍 Locations
  "nyc": ["new york", "new york city", "ny", "n.y.c", "ny ny", "brooklyn", "manhattan", "queens"],
  "los angeles": ["la", "l.a", "city of angels", "los angeles california"],
  "san francisco": ["sf", "s.f", "san fran", "bay area"],
  "chicago": ["chi-town"],
  "boston": ["beantown"],
  "quito": ["ecuador capital", "quito city"],

  // 🎭 Roles
  "actor": ["actress", "performer", "player"],
  "director": ["stage director", "theatre director"],
  "writer": ["playwright", "author", "dramaturg"],
  "producer": ["theatrical producer"],
  "teacher": ["educator", "teaching artist", "trainer", "mentor"],

  // 🎨 Design roles
  "designer": [
    "set designer",
    "scenic designer",
    "costume designer",
    "lighting designer",
    "projection designer",
    "sound designer",
  ],

  // 🎶 Other roles
  "musician": ["composer", "instrumentalist", "music director"],
  "dancer": ["choreographer", "movement director"],

  // 🏷️ Status flags
  "resident": ["artist-in-residence", "air", "resident artist"],
  "fellow": ["fellowship", "artistic fellow"],

  // 📚 Programs
  "raw": ["rugged artist workshops", "rugged workshops", "residency program"],
  "castaway": ["adaptation project", "festival show", "global storytelling"],
  "action": ["winter program", "intensive", "showcase"],
  "travelogue": ["storytelling series", "travel storytelling"],

  // 🎭 Productions (add real ones if needed)
  "hamlet": ["shakespeare", "hamlet adaptation"],
  "othello": ["shakespeare", "tragedy"],

  // 🌍 Festivals
  "edinburgh": ["edinburgh fringe", "fringe festival", "scotland"],
  "avignon": ["avignon festival", "france"],
};

/**
 * ✅ Expand query terms using synonym map
 * Example:
 *   "actor NYC" → ["actor", "actress", "performer", "player", "nyc", "new york", "new york city"]
 */
export function expandQueryTerms(query: string): string[] {
  const normalizedQuery = normalizeText(query);
  const words = normalizedQuery.split(/\s+/);
  const expanded = new Set<string>();

  words.forEach((word) => {
    expanded.add(word);
    if (synonymMap[word]) {
      synonymMap[word].forEach((syn) => expanded.add(normalizeText(syn)));
    }
  });

  return Array.from(expanded);
}

/**
 * ✅ Clean query:
 * Removes duplicate spaces and normalizes for consistency.
 */
export function cleanQuery(query: string): string {
  return normalizeText(query).replace(/\s+/g, " ");
}

/**
 * ✅ Levenshtein Distance:
 * Measures how many edits (insert, delete, substitute) are needed
 * to transform one word into another.
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]) + 1;
      }
    }
  }

  return dp[m][n];
}

/**
 * ✅ Typo-tolerant match check:
 */
export function isFuzzyMatch(input: string, target: string, threshold = 2): boolean {
  const distance = levenshteinDistance(normalizeText(input), normalizeText(target));
  return distance <= threshold;
}

/**
 * ✅ Extract quoted phrases and unquoted words from query
 */
export function parseQuery(query: string): string[] {
  const matches = query.match(/"([^"]+)"|\S+/g) || [];
  return matches.map((term) => term.replace(/"/g, ""));
}

/**
 * ✅ Advanced parsing (future-proof)
 */
export function parseAdvancedQuery(query: string): {
  include: string[];
  exclude: string[];
} {
  const terms = parseQuery(query);
  const include: string[] = [];
  const exclude: string[] = [];

  terms.forEach((term) => {
    if (term.startsWith("-")) exclude.push(term.substring(1));
    else include.push(term);
  });

  return { include, exclude };
}
