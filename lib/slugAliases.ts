// lib/slugAliases.ts

import { loadSlugMap } from "@/lib/loadSlugMap";

/** Normalize strings like 'Slug Name ' to 'slug-name' for matching and URLs. */
export function normSlug(v: string | null | undefined): string {
  return (v ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type Forward = { from: string; to: string };

type Cache = {
  stamp: number;
  forwards: Forward[];
  byFrom: Map<string, string>; // from -> to
  byTo: Map<string, Set<string>>; // to -> set(from)
  all: Set<string>;
};

// In-memory cache so we don’t re-read the sheet constantly in dev.
let cache: Cache | null = null;

function debugLog(...args: any[]) {
  if (process.env.SHOW_DAT_DEBUG === "true") {
    // eslint-disable-next-line no-console
    console.log("[slug-aliases]", ...args);
  }
}

// Small helper so env parsing is consistent.
function getTtlMs(): number {
  const raw = process.env.SLUG_ALIAS_CACHE_TTL_MS;
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) && n > 0 ? n : 60_000;
}

/**
 * Load the slug map and return a normalized Map(from -> to).
 *
 * Source of truth:
 * - loadSlugMap() should ultimately read Profile-Slugs (or SLUGS_CSV_URL) and
 *   write/update the local fallback slug-map.csv on success.
 */
export async function loadSlugForwardsMap(): Promise<Map<string, string>> {
  try {
    const map = await loadSlugMap();

    if (!(map instanceof Map) || map.size === 0) {
      debugLog("loadSlugMap returned empty map");
      return map instanceof Map ? map : new Map();
    }

    return map;
  } catch (err) {
    debugLog(
      "loadSlugForwardsMap failed, returning empty map:",
      (err as Error)?.message || err,
    );
    return new Map();
  }
}

/** Build/refresh indices in memory. */
async function ensureIndex(): Promise<void> {
  try {
    const ttlMs = getTtlMs();
    if (cache && Date.now() - cache.stamp < ttlMs) return;

    const fwdMap = await loadSlugForwardsMap();
    const forwards: Forward[] = [];
    const byFrom = new Map<string, string>();
    const byTo = new Map<string, Set<string>>();
    const all = new Set<string>();

    for (const [fromRaw, toRaw] of fwdMap.entries()) {
      const from = normSlug(fromRaw);
      const to = normSlug(toRaw);

      // skip blanks, no-ops, and self-maps
      if (!from || !to || from === to) continue;

      forwards.push({ from, to });
      byFrom.set(from, to);

      const set = byTo.get(to) ?? new Set<string>();
      set.add(from);
      byTo.set(to, set);

      all.add(from);
      all.add(to);
    }

    cache = { stamp: Date.now(), forwards, byFrom, byTo, all };

    debugLog("index built", {
      fromCount: byFrom.size,
      toCount: byTo.size,
      aliasCount: all.size,
      ttlMs,
    });
  } catch (err) {
    debugLog("ensureIndex failed; leaving cache empty:", (err as Error)?.message || err);
    cache = null;
  }
}

/**
 * Resolve any incoming slug to a canonical slug.
 * We expect your sheet rows to always point directly to the canonical,
 * but this defensively follows chains and breaks cycles.
 */
export async function resolveCanonicalSlug(incoming: string): Promise<string> {
  await ensureIndex();

  const seen = new Set<string>();
  let cur = normSlug(incoming);

  if (!cache) return cur; // safe fallback

  for (let i = 0; i < 100; i++) {
    if (seen.has(cur)) break; // cycle
    seen.add(cur);

    const next = cache.byFrom.get(cur);
    if (!next) break;
    cur = next;
  }

  return cur;
}

/**
 * Back-compat shim: older callers import canonicalizeSlug.
 * Prefer resolveCanonicalSlug for new code.
 */
export async function canonicalizeSlug(incoming: string): Promise<string> {
  return resolveCanonicalSlug(incoming);
}

/**
 * Given a canonical (or alias), return the full alias set that should be treated as equivalent.
 * Includes the canonical itself.
 *
 * Robust to accidental chains in the sheet; will “grow” the set until stable.
 */
export async function getSlugAliases(canonicalOrAlias: string): Promise<Set<string>> {
  await ensureIndex();

  const canonical = await resolveCanonicalSlug(canonicalOrAlias);
  const aliases = new Set<string>([canonical]);

  if (!cache) return aliases; // safe fallback

  // Direct “from → canonical”
  const direct = cache.byTo.get(canonical);
  if (direct) for (const a of direct) aliases.add(a);

  // Defensive pass to absorb any chained/incorrect entries:
  let grew = true;
  for (let pass = 0; pass < 100 && grew; pass++) {
    grew = false;
    for (const [from, to] of cache.byFrom.entries()) {
      if (aliases.has(to) && !aliases.has(from)) {
        aliases.add(from);
        grew = true;
      }
    }
  }

  return aliases;
}

/** 🔎 All “from” slugs that forward to this exact target slug. */
export async function getReverseSlugSources(target: string): Promise<string[]> {
  await ensureIndex();
  if (!cache) return [];
  const t = normSlug(target);
  const set = cache.byTo.get(t);
  return set ? Array.from(set) : [];
}

/**
 * 🔎 Convenience: given a target (the "to" side), pick one current live "from" that maps to it.
 */
export async function getReverseSlugSource(target: string): Promise<string | null> {
  const all = await getReverseSlugSources(target);
  if (!all.length) return null;
  return all.sort()[0] ?? null;
}

/** 🔧 On-demand in-memory flush (does NOT touch Google Sheets or any files). */
export function invalidateSlugAliasesCache() {
  cache = null;
}

/** (Optional) Lightweight debug snapshot for logs or admin UI. */
export function getSlugAliasDebugSnapshot() {
  if (!cache) return { ready: false as const };
  return {
    ready: true as const,
    sizeFrom: cache.byFrom.size,
    sizeTo: cache.byTo.size,
    aliasesKnown: cache.all.size,
    ageMs: Date.now() - cache.stamp,
  };
}
