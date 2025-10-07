// /lib/normalizeEmbeddedRefs.ts
import { normSlug } from "@/lib/slugAliases";

/**
 * Replace any occurrence of an old alias with the canonical slug inside:
 * - plain strings
 * - well-known "slug fields" (profileSlug, alumniSlug, authorSlug, slug, url paths like /alumni/<slug>)
 * - arrays / objects (deep)
 *
 * Optionally, also normalize "name fields" that are known join keys across CSVs.
 */
export type NormalizeOpts = {
  canonicalSlug: string;
  aliases: Set<string>;              // includes canonical too (safe)
  alsoNormalizeNames?: boolean;      // default false
  nameAliases?: Set<string>;         // optional: all previous names/aka for this alum
  canonicalName?: string;            // optional canonical name (used if alsoNormalizeNames)
};

const SLUG_FIELD_NAMES = new Set([
  "slug",
  "profileSlug",
  "alumniSlug",
  "authorSlug",
  "artistSlug",
  "bySlug",
  "nameSlug",        // optional convenience
  "profile-slug",
  "alumni-slug",
  "author-slug",
  "artist-slug",
  "by-slug",
  "name-slug",
]);

const NAME_FIELD_NAMES = new Set([
  "alumniName",
  "author",
  "artist",
  "byline",
  "name",
]);

/** URL segment replace: /alumni/<alias> → /alumni/<canonical> */
function replaceSlugInPaths(s: string, aliases: Set<string>, canonical: string): string {
  if (!s) return s;
  return s.replace(/(\/alumni\/)([a-z0-9\-_%]+)/gi, (_m, p1, slugPart) => {
    const n = normSlug(decodeURIComponent(slugPart));
    return aliases.has(n) ? `${p1}${encodeURIComponent(canonical)}` : `${p1}${slugPart}`;
  });
}

/**
 * List-aware normalization for known slug fields.
 * Accepts CSV or whitespace lists and returns the same shape joined by comma if CSV-like,
 * otherwise by single spaces.
 */
function normalizeSlugListValue(s: string, aliases: Set<string>, canonical: string): string {
  if (!s) return s;
  // Normalize possible embedded paths first
  let out = replaceSlugInPaths(s, aliases, canonical);

  const looksCSV = out.includes(",");
  const parts = out.split(looksCSV ? /,/g : /\s+/g).map(t => t.trim()).filter(Boolean);
  const replaced = parts.map(token => {
    const n = normSlug(token);
    return aliases.has(n) ? canonical : token;
  });
  return looksCSV ? replaced.join(",") : replaced.join(" ");
}

/** Replace any of the name aliases only in known "name join" fields. */
function replaceNameInString(
  s: string,
  nameAliases?: Set<string>,
  canonicalName?: string
): string {
  if (!s || !nameAliases || !canonicalName) return s;

  const looksCSV = s.includes(",");
  const parts = s.split(looksCSV ? /,/g : /\s+/g).map(t => t.trim()).filter(Boolean);
  const replaced = parts.map(token => (nameAliases.has(token) ? canonicalName : token));
  return looksCSV ? replaced.join(",") : replaced.join(" ");
}

function isPlainObject(v: unknown): v is Record<string, any> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

/**
 * Deep copy + rewrite.
 * - Strings in known slug fields: list-aware normalization (tokens).
 * - Generic strings (like prose): ONLY path replacement; NO whole-string alias substitution.
 *   (Prevents 'name' from turning into the canonical slug.)
 * - If alsoNormalizeNames=true: only normalize NAME_FIELD_NAMES using nameAliases.
 */
export function normalizeEmbeddedRefs<T>(
  input: T,
  opts: NormalizeOpts
): T {
  const { canonicalSlug, aliases, alsoNormalizeNames, nameAliases, canonicalName } = opts;

  const walk = (val: any, parentKey?: string): any => {
    if (typeof val === "string") {
      // Known slug fields: list-aware normalization (including exact tokens)
      if (parentKey && SLUG_FIELD_NAMES.has(parentKey)) {
        return normalizeSlugListValue(val, aliases, canonicalSlug);
      }

      // Generic strings:
      // - Only normalize URL paths (/alumni/<alias> → /alumni/<canonical>)
      // - Do NOT replace a whole-string alias value here (to avoid clobbering names)
      let next = replaceSlugInPaths(val, aliases, canonicalSlug);

      // Name normalization only on known name fields (non-prose tokens), if opted in
      if (
        parentKey &&
        alsoNormalizeNames &&
        NAME_FIELD_NAMES.has(parentKey) &&
        nameAliases &&
        canonicalName
      ) {
        next = replaceNameInString(next, nameAliases, canonicalName);
      }
      return next;
    }

    if (Array.isArray(val)) {
      // Preserve array-ness; do not build arrays from strings elsewhere.
      return val.map((item) => walk(item, parentKey));
    }

    if (isPlainObject(val)) {
      const out: Record<string, any> = {};
      for (const [k, v] of Object.entries(val)) {
        out[k] = walk(v, k);
      }
      return out;
    }

    // numbers, booleans, null, undefined, functions
    return val;
  };

  return walk(input);
}
