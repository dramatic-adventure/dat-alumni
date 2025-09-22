/**
 * ✅ Normalize text:
 * - Lowercase
 * - Remove diacritics
 * - Remove punctuation
 * - Trim spaces
 */
export function normalizeText(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

/**
 * ✅ Clean query:
 * Removes duplicate spaces and normalizes.
 */
export function cleanQuery(query: string): string {
  return normalizeText(query).replace(/\s+/g, " ");
}

/**
 * ✅ Convert to singular (basic heuristic)
 * - Removes trailing "s" if not part of "ss"
 */
export function singularize(word: string): string {
  return word.endsWith("s") && !word.endsWith("ss")
    ? word.slice(0, -1)
    : word;
}

/**
 * ✅ Synonym map: Locations, roles, programs, tags
 */
export const synonymMap: Record<string, string[]> = {
  // 🌍 Locations
  "nyc": ["new york", "new york city", "ny", "ny, ny", "brooklyn", "manhattan", "queens"],
  "los angeles": ["la", "city of angels", "l.a.", "los angeles california"],
  "san francisco": ["sf", "san fran", "bay area"],
  "quito": ["ecuador capital"],

  // 🎭 Roles
  "actor": ["actress", "performer", "player"],
  "director": ["stage director", "theatre director"],
  "writer": ["playwright", "author", "dramaturg"],
  "teacher": ["educator", "teaching artist", "mentor"],

  // 🎨 Design roles
  "designer": [
    "set designer",
    "scenic designer",
    "costume designer",
    "lighting designer",
    "projection designer",
    "sound designer"
  ],

  "stage manager": ["production stage manager", "psm"],
  "assistant stage manager": ["asm"],

  // 🎶 Music & dance
  "musician": ["composer", "instrumentalist", "music director"],
  "dancer": ["choreographer", "movement director"],

  // 🏷️ Status
  "resident": ["artist in residence", "air", "resident artist"],
  "fellow": ["fellowship", "artistic fellow"],

  // 📚 Programs
  "raw": ["rugged artist workshops", "rugged workshops", "residency program"],
  "castaway": ["adaptation project", "festival show", "global storytelling"],
  "action": ["winter program", "intensive", "showcase"],
  "travelogue": ["storytelling series"],

  // 🌍 Festivals
  "edinburgh": ["edinburgh fringe", "fringe festival", "scotland"],
  "avignon": ["avignon festival", "france"]
};

/**
 * ✅ Expand query with synonyms + singular/plural variations
 */
export function expandQueryTerms(query: string): string[] {
  const normalizedQuery = normalizeText(query);
  const words = normalizedQuery.split(/\s+/);
  const expanded = new Set<string>([normalizedQuery, ...words]);

  for (const [key, synonyms] of Object.entries(synonymMap)) {
    const normalizedKey = normalizeText(key);
    const normalizedSynonyms = synonyms.map(normalizeText);
    const group = [normalizedKey, ...normalizedSynonyms];

    // ✅ Check if query contains key or any synonym
    if (
      group.includes(normalizedQuery) ||
      words.some((word) => group.includes(word) || group.includes(singularize(word)))
    ) {
      group.forEach((term) => {
        expanded.add(term);
        expanded.add(singularize(term)); // ✅ Add singular version
      });
    }
  }

  // ✅ Add singular versions of all original query words
  words.forEach((w) => expanded.add(singularize(w)));

  return Array.from(expanded);
}

/**
 * ✅ Parse quoted phrases (future)
 */
export function parseQuery(query: string): string[] {
  const matches = query.match(/"([^"]+)"|\S+/g) || [];
  return matches.map((term) => term.replace(/"/g, ""));
}
