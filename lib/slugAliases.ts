// /lib/slugAliases.ts
import { loadCsv } from "@/lib/loadCsv";

/** Normalize strings like 'Slug Name ' to 'slug-name' for matching and URLs. */
export function normSlug(v: string | null | undefined): string {
  return (v ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type Forward = { from: string; to: string };

// In-memory cache so we don’t re-read the sheet constantly in dev.
let cache:
  | {
      stamp: number;
      forwards: Forward[];
      byFrom: Map<string, string>;     // from -> to
      byTo: Map<string, Set<string>>;  // to -> set(from)
      all: Set<string>;
    }
  | null = null;

function debugLog(...args: any[]) {
  if (process.env.SHOW_DAT_DEBUG === "true") {
    // eslint-disable-next-line no-console
    console.log("[slug-aliases]", ...args);
  }
}

/**
 * Load the slug forwards CSV and return a normalized Map(from -> to).
 * Accepts either:
 *  - SLUGS_CSV_URL, or
 *  - ALUMNI_SHEET_ID + SLUGS_TAB (defaults to "Profile-Slugs")
 */
export async function loadSlugForwardsMap(): Promise<Map<string, string>> {
  try {
    const url =
      process.env.SLUGS_CSV_URL ||
      (process.env.ALUMNI_SHEET_ID &&
        `https://docs.google.com/spreadsheets/d/${process.env.ALUMNI_SHEET_ID}/export?format=csv&sheet=${encodeURIComponent(
          process.env.SLUGS_TAB || "Profile-Slugs"
        )}`) ||
      "";

    if (!url) {
      debugLog("SLUGS_CSV_URL not configured; returning empty map");
      return new Map();
    }

    // Uses loadCsv which updates a local fallback only on success.
    const csv = await loadCsv(url, "slug-forwards");
    if (!csv || typeof csv !== "string") {
      debugLog("loadCsv returned empty/invalid content; returning empty map");
      return new Map();
    }

    // Basic parsing is fine because slugs won’t contain commas.
    const lines = csv
      .replace(/^\uFEFF/, "") // strip BOM if present
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      // Either no header or no data
      debugLog("CSV has no data rows; returning empty map");
      return new Map();
    }

    // Parse header
    const headerLine = lines[0];
    const headers = headerLine
      .split(",")
      .map((h) => h.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-"));

    // Accept several possible header names
    const fromKeys = ["fromslug", "from", "old", "alias", "alias-slug"];
    const toKeys = ["toslug", "to", "canonical", "target", "canonical-slug"];

    let iFrom = headers.findIndex((h) => fromKeys.includes(h));
    let iTo = headers.findIndex((h) => toKeys.includes(h));

    // Back-compat: allow “from,to” by position if exactly two columns and unknown headings
    if ((iFrom < 0 || iTo < 0) && headers.length === 2) {
      iFrom = 0;
      iTo = 1;
    }

    if (iFrom < 0 || iTo < 0) {
      debugLog("CSV missing recognizable headers; returning empty map", { headers });
      return new Map();
    }

    const out = new Map<string, string>();

    // Start after the header row. We’re assuming slugs have no commas.
    for (let li = 1; li < lines.length; li++) {
      const row = lines[li];
      if (!row) continue;
      const cells = row.split(",");
      const rawFrom = cells[iFrom] ?? "";
      const rawTo = cells[iTo] ?? "";

      const from = normSlug(rawFrom);
      const to = normSlug(rawTo);

      if (!from || !to || from === to) continue;

      // Later rows win (allows fixing mistakes in sheet without clearing cache)
      out.set(from, to);
    }

    return out;
  } catch (err) {
    debugLog("loadSlugForwardsMap failed, returning empty map:", (err as Error)?.message || err);
    return new Map();
  }
}

/** Build/refresh indices in memory. */
async function ensureIndex(): Promise<void> {
  try {
    // 60s cache window is plenty for dev; override with env if you like
    const ttlMs = Number(process.env.SLUG_ALIAS_CACHE_TTL_MS || 60_000);
    if (cache && Date.now() - cache.stamp < ttlMs) return;

    const fwdMap = await loadSlugForwardsMap();
    const forwards: Forward[] = [];
    const byFrom = new Map<string, string>();
    const byTo = new Map<string, Set<string>>();
    const all = new Set<string>();

    for (const [from, to] of fwdMap.entries()) {
      forwards.push({ from, to });
      byFrom.set(from, to);
      if (!byTo.has(to)) byTo.set(to, new Set());
      byTo.get(to)!.add(from);
      all.add(from);
      all.add(to);
    }

    cache = { stamp: Date.now(), forwards, byFrom, byTo, all };
    debugLog("index built", {
      fromCount: byFrom.size,
      toCount: byTo.size,
      aliasCount: all.size,
    });
  } catch (err) {
    // If anything fails, keep cache null so callers get safe fallbacks downstream.
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

  // Follow “from -> to” until we stop moving or detect a cycle.
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
 * Given a canonical (or alias), return the full alias set that should be treated as equivalent.
 * Includes the canonical itself.
 *
 * Robust to accidental chains in the sheet; will “grow” the set until stable.
 */
export async function getSlugAliases(canonicalOrAlias: string): Promise<Set<string>> {
  await ensureIndex();

  // Always resolve to canonical first (works even if caller passed an alias).
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
 * Use case: someone navigates to /alumni/<new-target> before Profile-Data is updated —
 * we can fetch using a current Profile-Data row (the "from") so the page never 404s.
 */
export async function getReverseSlugSource(target: string): Promise<string | null> {
  const all = await getReverseSlugSources(target);
  if (!all.length) return null;
  // Prefer a deterministic choice (alphabetical). You could prefer the most recent instead.
  return all.sort()[0] ?? null;
}

/** 🔧 On-demand in-memory flush (does NOT touch Google Sheets or any files). */
export function invalidateSlugAliasesCache() {
  cache = null;
}

/** (Optional) Lightweight debug snapshot for logs or admin UI. */
export function getSlugAliasDebugSnapshot() {
  if (!cache) return { ready: false };
  return {
    ready: true,
    sizeFrom: cache.byFrom.size,
    sizeTo: cache.byTo.size,
    aliasesKnown: cache.all.size,
    ageMs: Date.now() - cache.stamp,
  };
}
