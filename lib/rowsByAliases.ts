// /lib/rowsByAliases.ts
import { normSlug } from "@/lib/slugAliases";

export type Row = Record<string, unknown>;

export type FilterConfig = {
  /** fields that may carry a slug */
  slugFields?: string[];
  /** fields that may carry a single name */
  nameFields?: string[];
  /** fields that may carry CSV list or array of prior names */
  akaFields?: string[];
};

const DEFAULT_CONFIG: Required<FilterConfig> = {
  slugFields: ["slug", "alumniSlug", "profileSlug", "alumnislug", "profile-slug"],
  nameFields: ["name", "alumniName", "profileName"],
  akaFields: ["aka", "aliases", "previousNames", "formerNames"],
};

function normName(v: unknown): string {
  return (v ?? "").toString().trim().toLowerCase();
}

function listFromAny(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(normName).filter(Boolean);
  const s = normName(v);
  if (!s) return [];
  // support comma/semicolon separated lists
  return s.split(/[;,]/).map((x) => x.trim()).filter(Boolean);
}

/**
 * Returns true if the row matches any slug alias OR the current canonical name.
 */
export function rowMatchesAliasesAndName(
  row: Row,
  aliases: Set<string>,
  canonicalNameLc: string,
  cfg: FilterConfig = {}
): boolean {
  const { slugFields, nameFields, akaFields } = { ...DEFAULT_CONFIG, ...cfg };

  // 1) slug match against aliases
  for (const f of slugFields) {
    if (f in row) {
      const v = normSlug((row as any)[f] as string);
      if (v && aliases.has(v)) return true;
    }
  }

  // 2) name match (exact, case-insensitive)
  for (const f of nameFields) {
    if (f in row) {
      const v = normName((row as any)[f]);
      if (v && v === canonicalNameLc) return true;
    }
  }

  // 3) AKA / previous names may be CSV string or array
  for (const f of akaFields) {
    if (f in row) {
      const list = listFromAny((row as any)[f]);
      if (list.includes(canonicalNameLc)) return true;
    }
  }

  return false;
}

/**
 * Backward-compatible filter:
 * - Legacy usage: filterRowsByAliases(rows, aliases, ["slug","alumniSlug"])
 * - New usage:    filterRowsByAliases(rows, aliases, alumniName, { ...config })
 */
export function filterRowsByAliases<T extends Row>(
  rows: T[],
  aliases: Set<string>,
  nameOrSlugKeys?: string | string[],
  cfg?: FilterConfig
): T[] {
  // Legacy path: third arg is an array of slug field names (or omitted)
  if (Array.isArray(nameOrSlugKeys) || typeof nameOrSlugKeys === "undefined") {
    const slugKeys =
      (Array.isArray(nameOrSlugKeys) && nameOrSlugKeys.length
        ? nameOrSlugKeys
        : DEFAULT_CONFIG.slugFields);

    return rows.filter((r) =>
      slugKeys.some((k) => k in r && aliases.has(normSlug((r as any)[k] as string)))
    );
  }

  // New path: third arg is canonical name (string), optional config in fourth arg
  const canonicalNameLc = normName(nameOrSlugKeys);
  return rows.filter((r) => rowMatchesAliasesAndName(r, aliases, canonicalNameLc, cfg));
}
