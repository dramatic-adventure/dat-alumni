// /lib/loadAlumni.ts
import { serverDebug, serverInfo, serverWarn, serverError } from "@/lib/serverDebug";
import "server-only";
// (note: `export {}` at top isn't needed; TS treats this file as a module already)

import Papa from "papaparse";
import { cache } from "react";
import { AlumniRow } from "./types";
import { normalizeAlumniRow } from "./normalizeAlumniRow";
import { loadCsv } from "./loadCsv";
import { sheetsClient } from "./googleClients"; // service-account Sheets client

const DEBUG = process.env.SHOW_DAT_DEBUG === "true";

/* ──────────────────────────────────────────────────────────
 * Env
 * ────────────────────────────────────────────────────────── */

// ✅ Default to internal API exports (Profile-Live source of truth)
// Env overrides still supported for emergency.
const csvUrl =
  process.env.ALUMNI_CSV_URL ||
  process.env.NEXT_PUBLIC_ALUMNI_CSV_URL ||
  "/api/alumni/lookup?export=alumni.csv";

const slugCsvUrl =
  process.env.SLUGS_CSV_URL ||
  process.env.NEXT_PUBLIC_SLUGS_CSV_URL ||
  "/api/alumni/lookup?export=slug-map.csv";

const spreadsheetId = process.env.ALUMNI_SHEET_ID || "";
const AUTO_CANON =
  (process.env.AUTO_CANONICALIZE_SLUGS ?? "true").toLowerCase() === "true";
const AUTO_CANON_CREATE_ON_MISS =
  (process.env.AUTO_CANON_CREATE_ON_MISS ?? "false").toLowerCase() === "true";

// Optional explicit tab names (recommended):
const ALUMNI_TAB = process.env.ALUMNI_TAB || ""; // e.g. "Profile-Data"
const SLUGS_TAB = process.env.SLUGS_TAB || "Profile-Slugs";

if (DEBUG) {
  serverDebug("🔍 ALUMNI_CSV_URL:", process.env.ALUMNI_CSV_URL);
  serverDebug("🔍 NEXT_PUBLIC_ALUMNI_CSV_URL:", process.env.NEXT_PUBLIC_ALUMNI_CSV_URL);
  serverDebug("✅ Using Alumni CSV URL:", csvUrl || "❌ NONE FOUND");
  serverDebug("🔍 SLUGS_CSV_URL:", process.env.SLUGS_CSV_URL);
  serverDebug("🔍 NEXT_PUBLIC_SLUGS_CSV_URL:", process.env.NEXT_PUBLIC_SLUGS_CSV_URL);
  serverDebug("✅ Using Slug CSV URL:", slugCsvUrl || "❌ NONE FOUND");
  serverDebug("🔍 ALUMNI_SHEET_ID:", spreadsheetId ? "<set>" : "<missing>");
  serverDebug("🔧 AUTO_CANONICALIZE_SLUGS:", AUTO_CANON);
  serverDebug("🔧 AUTO_CANON_CREATE_ON_MISS:", AUTO_CANON_CREATE_ON_MISS);
  serverDebug("🗂️  ALUMNI_TAB:", ALUMNI_TAB || "<auto>");
  serverDebug("🗂️  SLUGS_TAB:", SLUGS_TAB);
}

/* ──────────────────────────────────────────────────────────
 * Utilities
 * ────────────────────────────────────────────────────────── */

function isMostlyEmpty(row: Record<string, string>): boolean {
  const relevantFields = [
    "name",
    "role",
    "location",
    "headshot url",
    "identity tags",
    "project badges",
    "slug",
  ];
  return relevantFields.filter((field) => row[field]?.trim()).length < 2;
}

function toLowerSlug(s: string | undefined | null) {
  return String(s || "").trim().toLowerCase();
}

function normalizeHeaderKey(k: string) {
  return k.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

/** Build a fresh mapping from rows of [fromSlug, toSlug, createdAt] */
function buildSlugForwardMap(rows: Array<[string, string, string?]>) {
  const mapLatest = new Map<string, { to: string; at: number }>();
  for (const r of rows) {
    const from = toLowerSlug(r?.[0]);
    const to = toLowerSlug(r?.[1]);
    if (!from || !to) continue;
    const at = new Date(r?.[2] || 0).getTime() || 0;

    const prev = mapLatest.get(from);
    if (!prev || at >= prev.at) {
      mapLatest.set(from, { to, at });
    }
  }
  const out: Record<string, string> = {};
  for (const [from, { to }] of mapLatest) out[from] = to;
  return out;
}

/** Extracts the gid number from a Google Sheets CSV url (?gid=XXXX). */
function extractGidFromUrl(url?: string | null): number | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const gidStr = u.searchParams.get("gid");
    if (!gidStr) return null;
    const n = Number(gidStr);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

/** Resolves a sheet tab title from spreadsheet metadata using its numeric gid. */
async function resolveSheetTitleByGid(
  spreadsheetId: string,
  targetGid: number
): Promise<string | null> {
  try {
    const sheets = sheetsClient();
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const match = meta.data.sheets?.find(
      (s) => s.properties?.sheetId === targetGid
    );
    return match?.properties?.title || null;
  } catch {
    return null;
  }
}

/** Convert a zero-based column index to A1 letter(s). */
function colIndexToA1(n: number): string {
  let x = n + 1;
  let s = "";
  while (x > 0) {
    const rem = (x - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    x = Math.floor((x - 1) / 26);
  }
  return s;
}

/* ──────────────────────────────────────────────────────────
 * In-memory caches
 * ────────────────────────────────────────────────────────── */

let alumniCache: AlumniRow[] = [];
let slugForwardMapCache: Record<string, string> | null = null;

/* ──────────────────────────────────────────────────────────
 * Slug-forward map (CSV-only)
 * ────────────────────────────────────────────────────────── */

async function loadSlugMapFromCsv(): Promise<Record<string, string> | null> {
  if (!slugCsvUrl) return null;
  try {
    const csvText = await loadCsv(slugCsvUrl, "slug-map.csv");
    const parsed = Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    // Be defensive about header casing/variants
    const rows = parsed.data.map((r) => {
      // Try common header variants
      const from =
        r.fromSlug ??
        (r as any)["from-slug"] ??
        (r as any).from ??
        (r as any).old ??
        (r as any).alias ??
        "";
      const to =
        r.toSlug ??
        (r as any)["to-slug"] ??
        (r as any).to ??
        (r as any).canonical ??
        (r as any).target ??
        "";
      const createdAt = (r as any).createdAt ?? (r as any)["created-at"] ?? "";
      return [toLowerSlug(from), toLowerSlug(to), createdAt] as [string, string, string?];
    });

    const map = buildSlugForwardMap(rows);
    if (DEBUG) serverDebug(`🔁 [slug-map] Loaded ${Object.keys(map).length} mappings from CSV`);
    return map;
  } catch (e) {
    if (DEBUG) serverWarn("⚠️ [slug-map] CSV load failed:", e);
    return null;
  }
}

export const loadSlugForwardMap = cache(async (): Promise<Record<string, string>> => {
  if (slugForwardMapCache) return slugForwardMapCache;
  const map = (await loadSlugMapFromCsv()) ?? {};
  slugForwardMapCache = map;
  return map;
});

/** Resolve a→b→c chains defensively, with cycle guard. */
export async function resolveForwardChain(fromSlug: string): Promise<string> {
  const map = await loadSlugForwardMap();
  let cur = toLowerSlug(fromSlug);
  const seen = new Set<string>();
  for (let i = 0; i < 100; i++) {
    if (seen.has(cur)) break; // cycle
    seen.add(cur);
    const next = map[cur];
    if (!next || next === cur) break;
    cur = next;
  }
  return cur;
}

/** Returns the latest slug if `fromSlug` has been renamed; else null */
export const getSlugForward = cache(async (fromSlug: string): Promise<string | null> => {
  const resolved = await resolveForwardChain(fromSlug);
  const key = toLowerSlug(fromSlug);
  return resolved && resolved !== key ? resolved : null;
});

/** Reverse lookup: given a target (the "to" side), find a *current* "from" that maps to it. */
export async function getReverseSlugSource(target: string): Promise<string | null> {
  const want = toLowerSlug(target);
  const map = await loadSlugForwardMap();
  let candidate: string | null = null;
  for (const [from, to] of Object.entries(map)) {
    if (to === want) {
      if (!candidate || from < candidate) candidate = from; // deterministic
    }
  }
  return candidate;
}

/* ──────────────────────────────────────────────────────────
 * Alumni CSV loaders
 * ────────────────────────────────────────────────────────── */

export const loadAlumni = cache(async (): Promise<AlumniRow[]> => {
  if (alumniCache.length) {
    if (DEBUG) serverDebug("⚡ Returning cached alumni:", alumniCache.length);
    return alumniCache;
  }

  if (!csvUrl) {
    serverError("❌ [loadAlumni] Missing ALUMNI_CSV_URL or NEXT_PUBLIC_ALUMNI_CSV_URL in env");
    return [];
  }

  try {
    if (DEBUG) serverDebug("🌐 [loadCsv] Fetching:", csvUrl);
    const csvText = await loadCsv(csvUrl, "alumni.csv");

    if (DEBUG) serverDebug("📄 [loadAlumni] Raw CSV snippet:", csvText.slice(0, 300));

    const parsed = Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    const rows: AlumniRow[] = [];
    let skipped = 0;

    for (const raw of parsed.data) {
      const normalizedKeys = Object.fromEntries(
        Object.entries(raw).map(([key, value]) => [
          key.trim().toLowerCase(),
          value?.toString().trim() ?? "",
        ])
      );

      const show = normalizedKeys["show on profile?"]?.toLowerCase();
      const name = normalizedKeys["name"];
      const slug = normalizedKeys["slug"] || normalizedKeys["profile slug"] || normalizedKeys["profile-slug"];

      if (!["yes", "y", "✓"].includes(show) || (!slug && !name) || isMostlyEmpty(normalizedKeys)) {
        skipped++;
        continue;
      }

      const normalized = normalizeAlumniRow({
        ...normalizedKeys,
        // normalize alternate slug header into `slug` before row shaping
        slug: slug || "",
      });
      if (normalized) rows.push(normalized);
      else skipped++;
    }

    alumniCache = rows;

    if (DEBUG) {
      serverDebug(`✅ [loadAlumni] Loaded ${rows.length} alumni, skipped ${skipped}`);
    }

    return rows;
  } catch (err) {
    serverError("❌ [loadAlumni] Failed to load alumni:", err);
    return [];
  }
});

export const loadVisibleAlumni = cache(async (): Promise<AlumniRow[]> => {
  const all = await loadAlumni();
  return all.filter(
    (a) => a.showOnProfile?.toLowerCase().trim() === "yes" && !!a.name?.trim()
  );
});

/**
 * Returns a single alumni by slug — respects forward chains and uses reverse fallback.
 * - If the slug has been forwarded (old→new), we return the row for the latest target.
 * - If there is *no* row at a brand-new target yet, we try reverse lookup (new→old) and
 *   return the old row so the page/API doesn’t 404 while auto-canon catches up.
 */
export const loadAlumniBySlug = cache(async (slug: string): Promise<AlumniRow | null> => {
  const incoming = toLowerSlug(slug);
  const canonical = await resolveForwardChain(incoming);

  const all = await loadAlumni();

  // Try exact canonical row first
  const foundCanonical =
    all.find((a) => toLowerSlug(a.slug) === canonical) || null;
  if (foundCanonical) return foundCanonical;

  // Reverse fallback: new target hit before sheet updated – serve the old row
  const reverse = await getReverseSlugSource(incoming);
  if (reverse) {
    const foundReverse = all.find((a) => toLowerSlug(a.slug) === reverse) || null;
    if (foundReverse) return foundReverse;
  }

  return null;
});

/** ✅ Find a Profile-Data row by ANY alias (case-insensitive). */
export async function loadAlumniByAliases(
  aliases: Set<string>,
): Promise<AlumniRow | null> {
  const all = await loadAlumni();
  const want = new Set(
    Array.from(aliases).map((s) => String(s || "").trim().toLowerCase()),
  );
  return (
    all.find(
      (a) => want.has(String(a.slug || "").trim().toLowerCase()),
    ) || null
  );
}

/** Returns alumni for a specific season */
export const loadAlumniBySeason = cache(async (season: number): Promise<AlumniRow[]> => {
  const all = await loadAlumni();
  return all.filter((a) => {
    const badges = a.programBadges || [];
    return badges.some((badge) => badge.toLowerCase().includes(`season ${season}`));
  });
});

/* ──────────────────────────────────────────────────────────
 * Manual cache invalidation
 * ────────────────────────────────────────────────────────── */

export function invalidateAlumniCaches(): void {
  alumniCache = [];
  slugForwardMapCache = null;
  if (DEBUG) serverDebug("🧹 Cleared alumni + slug-forward caches");
}

/* ──────────────────────────────────────────────────────────
 * Auto-canonicalize (write-through on first hit)
 * ────────────────────────────────────────────────────────── */

/** simple in-memory guard so we don’t race the same pair */
const inflightCanon = new Set<string>();

/**
 * If Profile-Slugs says old→next and Alumni CSV still contains `old`,
 * rewrite that row’s slug to `next`, then clear caches.
 *
 * No-ops if:
 *  - feature flag AUTO_CANONICALIZE_SLUGS is false
 *  - no ALUMNI_SHEET_ID
 *  - next already exists as a row
 *  - alumni tab title cannot be resolved and fallback tab lacks a slug column
 * Also supports AUTO_CANON_CREATE_ON_MISS to optionally create a minimal row at `next`.
 */
export async function ensureCanonicalAlumniSlug(oldSlug: string, nextSlug: string): Promise<void> {
  if (!AUTO_CANON) return;
  if (!spreadsheetId) return;

  const oldKey = toLowerSlug(oldSlug);
  const newKey = toLowerSlug(nextSlug);
  if (!oldKey || !newKey || oldKey === newKey) return;

  const guardKey = `${oldKey}→${newKey}`;
  if (inflightCanon.has(guardKey)) return;
  inflightCanon.add(guardKey);

  try {
    // 0) If `newKey` already exists in Profile-Data, nothing to do.
    const all = await loadAlumni();
    if (all.some((a) => toLowerSlug(a.slug) === newKey)) return;

    // find the row with `oldKey`
    const oldRow = all.find((a) => toLowerSlug(a.slug) === oldKey);

    // Optionally create a minimal row if old is gone but we have a target slug
    if (!oldRow && AUTO_CANON_CREATE_ON_MISS) {
      let tabTitle: string | null = ALUMNI_TAB || null;
      if (!tabTitle) {
        const gid = extractGidFromUrl(csvUrl);
        if (gid !== null) {
          tabTitle = await resolveSheetTitleByGid(spreadsheetId, gid);
        }
      }
      if (!tabTitle) tabTitle = "Profile-Data";

      const sheets = sheetsClient();

      const read = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${tabTitle}!A:ZZ`,
        valueRenderOption: "UNFORMATTED_VALUE",
      });
      const rows = (read.data.values || []) as string[][];
      if (!rows.length) return;

      const header = rows[0].map((h) => String(h || "").trim().toLowerCase());
      const slugCol = header.indexOf("slug");
      const nameCol = header.indexOf("name");
      const showCol = header.indexOf("show on profile?");
      const width = header.length;

      const newRow: string[] = Array.from({ length: width }, () => "");
      if (slugCol >= 0) newRow[slugCol] = nextSlug;
      if (nameCol >= 0) newRow[nameCol] = "";
      if (showCol >= 0) newRow[showCol] = "Yes";

      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${tabTitle}!A:ZZ`,
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        requestBody: { values: [newRow] },
      });

      invalidateAlumniCaches();
      if (DEBUG) serverDebug(`✅ [auto-canon] Created minimal row for slug='${nextSlug}'`);
      return;
    }

    if (!oldRow) return;

    // 1) Resolve tab title:
    let tabTitle: string | null = ALUMNI_TAB || null;
    if (!tabTitle) {
      const gid = extractGidFromUrl(csvUrl);
      if (gid !== null) {
        tabTitle = await resolveSheetTitleByGid(spreadsheetId, gid);
      }
    }
    if (!tabTitle) tabTitle = "Profile-Data";

    if (DEBUG) {
      serverDebug(`✏️ [auto-canon] Updating slug on tab "${tabTitle}": ${oldKey} → ${newKey}`);
    }

    const sheets = sheetsClient();

    // 2) Read entire tab to locate slug column and row
    const read = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${tabTitle}!A:ZZZ`,
      valueRenderOption: "UNFORMATTED_VALUE",
    });

    const rows = (read.data.values || []) as string[][];
    if (!rows.length) return;

    const rawHeader = rows[0].map((h) => String(h ?? ""));
    const headerNorm = rawHeader.map(normalizeHeaderKey);

    // Accept multiple header variants for slug
    const slugHeaderCandidates = new Set([
      "slug",
      "profile slug",
      "profile-slug",
    ]);
    let slugCol = headerNorm.findIndex((h) => slugHeaderCandidates.has(h));
    if (slugCol === -1) {
      if (DEBUG) serverWarn(`⚠️ [auto-canon] No 'slug' column on tab "${tabTitle}"`);
      return;
    }

    const oldRowIdx = rows.findIndex(
      (r, i) => i > 0 && toLowerSlug(r?.[slugCol]) === oldKey
    );
    if (oldRowIdx === -1) {
      if (DEBUG) serverDebug("[auto-canon] No row with old slug; skip");
      return;
    }

    // Also ensure no other row already has newKey (double-check)
    const newRowIdx = rows.findIndex(
      (r, i) => i > 0 && toLowerSlug(r?.[slugCol]) === newKey
    );
    if (newRowIdx !== -1) {
      if (DEBUG) serverDebug("[auto-canon] New slug already present; skip update");
      return;
    }

    const rowNumber = oldRowIdx + 1; // 1-based A1
    const row = rows[oldRowIdx];
    const newRow = [...row];
    newRow[slugCol] = nextSlug; // preserve original casing/format provided

    const endCol = colIndexToA1((rows[0]?.length || (slugCol + 1)) - 1);

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${tabTitle}!A${rowNumber}:${endCol}${rowNumber}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [newRow] },
    });

    invalidateAlumniCaches(); // next request sees updated slug

    if (DEBUG) {
      serverDebug(
        `✅ [auto-canon] Row ${rowNumber} updated on "${tabTitle}" → slug='${nextSlug}'`
      );
    }
  } catch (e) {
    if (DEBUG) serverWarn("⚠️ [auto-canon] Failed to update Alumni slug:", e);
  } finally {
    inflightCanon.delete(guardKey);
  }
}
