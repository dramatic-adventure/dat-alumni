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

function str(v: any) {
  return (v == null ? "" : String(v)).trim();
}

function asListCSV(v: any): string[] {
  const s = str(v);
  if (!s) return [];
  return s.split(/[;,]/).map((x) => x.trim()).filter(Boolean);
}

function lower(s: any) {
  return str(s).toLowerCase();
}

function buildNameCandidates(canonicalName: string, nameAliases?: Set<string>) {
  const out = new Set<string>();
  const canon = lower(canonicalName);
  if (canon) out.add(canon);
  if (nameAliases) {
    for (const n of nameAliases) {
      const nn = lower(n);
      if (nn) out.add(nn);
    }
  }
  return out;
}

function rewriteSlugishString(input: string, aliases: Set<string>, canonicalSlug: string): string {
  if (!input) return input;

  // 1) Replace in /alumni/<slug> paths
  let out = input.replace(/(\/alumni\/)([a-z0-9\-_%]+)/gi, (_m, p1, slugPart) => {
    const decoded = (() => {
      try { return decodeURIComponent(slugPart); } catch { return slugPart; }
    })();
    const n = normSlug(decoded);
    return aliases.has(n) ? `${p1}${encodeURIComponent(canonicalSlug)}` : `${p1}${slugPart}`;
  });

  // 2) Replace in simple CSV or whitespace lists
  const looksCSV = out.includes(",");
  const parts = out
    .split(looksCSV ? /,/g : /\s+/g)
    .map((t) => t.trim())
    .filter(Boolean);

  const replaced = parts.map((token) => {
    const n = normSlug(token);
    return aliases.has(n) ? canonicalSlug : token;
  });

  return looksCSV ? replaced.join(",") : replaced.join(" ");
}

/**
 * Match by:
 * 1) slug fields (aliases set)
 * 2) name fields (canonicalName OR nameAliases)
 * 3) akaFields lists (canonicalName OR nameAliases)
 */
export function rowMatchesAliases(
  row: Record<string, any>,
  aliases: Set<string>,
  canonicalName: string,
  cfg: AliasMatchConfig = {},
  nameAliases?: Set<string>
) {
  const c = { ...DEFAULTS, ...cfg };

  // 1) Any slug field
  for (const k of c.slugFields) {
    const val = normSlug(str(row[k]));
    if (val && aliases.has(val)) return true;
  }

  // 2) Name fields (canonical or alias names)
  const nameCandidates = buildNameCandidates(canonicalName, nameAliases);
  if (nameCandidates.size) {
    for (const k of c.nameFields) {
      const v = lower(row[k]);
      if (v && nameCandidates.has(v)) return true;
    }
  }

  // 3) AKA/alias name lists (CSV/semicolon)
  if (nameCandidates.size) {
    for (const k of c.akaFields) {
      const list = asListCSV(row[k]).map((s) => s.toLowerCase());
      for (const cand of nameCandidates) {
        if (cand && list.includes(cand)) return true;
      }
    }
  }

  return false;
}

/** Filter an array of objects to anything that matches by slug OR name/aka. */
export function filterByAliasesAndNames<T extends Record<string, any>>(
  rows: T[],
  aliases: Set<string>,
  canonicalName: string,
  cfg?: AliasMatchConfig,
  nameAliases?: Set<string>
): T[] {
  return rows.filter((r) => rowMatchesAliases(r, aliases, canonicalName, cfg, nameAliases));
}

/**
 * Rewrite any slug-like fields in matching rows to the canonical slug (non-destructive copy).
 * NOTE: To also allow name/aka-based matches to trigger rewrite, pass canonicalName/nameAliases.
 */
export function rewriteSlugsToCanonical<T extends Record<string, any>>(
  rows: T[],
  aliases: Set<string>,
  canonicalSlug: string,
  cfg: AliasMatchConfig = {},
  canonicalName: string = "",
  nameAliases?: Set<string>
): T[] {
  const c = { ...DEFAULTS, ...cfg };

  return rows.map((row) => {
    const hit = rowMatchesAliases(row, aliases, canonicalName, c, nameAliases);
    if (!hit) return row;

    const copy: Record<string, any> = { ...row };
    for (const k of c.slugFields) {
      const raw = str(copy[k]);
      if (!raw) continue;
      copy[k] = rewriteSlugishString(raw, aliases, canonicalSlug);
    }
    return copy as T;
  });
}
