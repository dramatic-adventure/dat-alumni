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
 * ✅ Clean query:
 * Removes duplicate spaces and normalizes for consistency.
 */
export function cleanQuery(query: string): string {
  return normalizeText(query).replace(/\s+/g, " ");
}

/**
 * ✅ Synonym Map for better matching
 * Includes locations, roles, programs, and tags.
 */
export const synonymMap: Record<string, string[]> = {
  // 🌍 Locations
  "nyc": ["new york", "new york city", "ny", "brooklyn", "manhattan", "queens"],
  "los angeles": ["la", "city of angels", "l.a", "los angeles california"],
  "san francisco": ["sf", "san fran", "bay area"],
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

  // 🌍 Festivals
  "edinburgh": ["edinburgh fringe", "fringe festival", "scotland"],
  "avignon": ["avignon festival", "france"],
};

/**
 * ✅ Expand query terms using synonym map
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
