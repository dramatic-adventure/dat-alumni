// /lib/aliasMatch.ts
import { normSlug } from "@/lib/slugAliases";

export type AliasMatchConfig = {
  slugFields?: string[];   // keys that may hold a slug
  nameFields?: string[];   // keys that may hold a display name
  akaFields?: string[];    // keys that may hold CSV list of alt names
};

const DEFAULTS: Required<AliasMatchConfig> = {
  slugFields: ["slug", "alumniSlug", "profileSlug", "artistSlug"],
  nameFields: ["name", "alumniName", "artistName"],
  akaFields: ["aka", "aliases", "previousNames", "formerNames"],
};

function str(v: any) { return (v == null ? "" : String(v)).trim(); }
function asListCSV(v: any): string[] {
  const s = str(v);
  if (!s) return [];
  return s.split(/[;,]/).map(x => x.trim()).filter(Boolean);
}

export function rowMatchesAliases(
  row: Record<string, any>,
  aliases: Set<string>,
  canonicalName: string,
  cfg: AliasMatchConfig = {}
) {
  const c = { ...DEFAULTS, ...cfg };

  // 1) Any slug field
  for (const k of c.slugFields) {
    const val = normSlug(str(row[k]));
    if (val && aliases.has(val)) return true;
  }

  // 2) Name fields
  const canonLower = str(canonicalName).toLowerCase();
  for (const k of c.nameFields) {
    const v = str(row[k]).toLowerCase();
    if (v && (v === canonLower)) return true;
  }

  // 3) AKA/alias name lists (CSV/semicolon)
  for (const k of c.akaFields) {
    const list = asListCSV(row[k]).map(s => s.toLowerCase());
    if (list.includes(canonLower)) return true;
  }

  return false;
}

/** Filter an array of objects to anything that matches by slug OR name/aka. */
export function filterByAliasesAndNames<T extends Record<string, any>>(
  rows: T[],
  aliases: Set<string>,
  canonicalName: string,
  cfg?: AliasMatchConfig
): T[] {
  return rows.filter(r => rowMatchesAliases(r, aliases, canonicalName, cfg));
}

/** Optional: rewrite any slug-like fields in matching rows to the canonical slug (non-destructive copy). */
export function rewriteSlugsToCanonical<T extends Record<string, any>>(
  rows: T[],
  aliases: Set<string>,
  canonicalSlug: string,
  cfg: AliasMatchConfig = {}
): T[] {
  const c = { ...DEFAULTS, ...cfg };
  return rows.map((row) => {
    const hit = rowMatchesAliases(row, aliases, "", c);
    if (!hit) return row;
    const copy: Record<string, any> = { ...row };
    for (const k of c.slugFields) {
      if (copy[k] && aliases.has(normSlug(copy[k]))) copy[k] = canonicalSlug;
    }
    return copy as T;
  });
}
