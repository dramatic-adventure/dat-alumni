// /lib/loadAlumni.ts
import {
  serverDebug,
  serverWarn,
  serverError,
  serverDebugEnv,
  serverDebugBranch,
} from "@/lib/serverDebug";
import "server-only";

import { cache } from "react";
import { AlumniRow } from "./types";
import { normalizeAlumniRow } from "./normalizeAlumniRow";
import { sheetsClient } from "./googleClients"; // service-account Sheets client
import { csvUrls } from "@/lib/csvUrls";

const DEBUG =
  process.env.SHOW_DAT_DEBUG === "true" &&
  process.env.CI !== "true" &&
  process.env.CI !== "1" &&
  process.env.NETLIFY !== "true" &&
  !process.env.CONTEXT;

/* ──────────────────────────────────────────────────────────
 * Env
 * ────────────────────────────────────────────────────────── */

// ✅ alumni URL still used in ensureCanonicalAlumniSlug for gid resolution
const csvUrl = csvUrls.alumni;

const spreadsheetId = process.env.ALUMNI_SHEET_ID || "";

// ✅ Live is source of truth
const LIVE_TAB = process.env.ALUMNI_LIVE_TAB || "Profile-Live";

const AUTO_CANON =
  (process.env.AUTO_CANONICALIZE_SLUGS ?? "true").toLowerCase() === "true";
const AUTO_CANON_CREATE_ON_MISS =
  (process.env.AUTO_CANON_CREATE_ON_MISS ?? "false").toLowerCase() === "true";

// Optional explicit tab names (recommended):
const ALUMNI_TAB = process.env.ALUMNI_TAB || ""; // e.g. "Profile-Data" (legacy auto-canon target)
const SLUGS_TAB = process.env.SLUGS_TAB || "Profile-Slugs";

if (DEBUG) {
  serverDebug("🔍 ALUMNI_SHEET_ID:", spreadsheetId ? "<set>" : "<missing>");
  serverDebug("🟩 LIVE TAB:", LIVE_TAB);
  serverDebug("🔧 AUTO_CANONICALIZE_SLUGS:", AUTO_CANON);
  serverDebug("🔧 AUTO_CANON_CREATE_ON_MISS:", AUTO_CANON_CREATE_ON_MISS);
  serverDebug("🗂️  ALUMNI_TAB (legacy):", ALUMNI_TAB || "<auto>");
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
  return k
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** case-insensitive header lookup */
function idxOf(header: string[], candidates: string[]) {
  const lower = header.map((h) => String(h || "").trim().toLowerCase());
  for (const c of candidates) {
    const i = lower.indexOf(c.toLowerCase());
    if (i !== -1) return i;
  }
  return -1;
}

function truthy(v: any) {
  const s = String(v ?? "").trim().toLowerCase();
  return s === "true" || s === "yes" || s === "y" || s === "1" || s === "✓";
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
    const match = meta.data.sheets?.find((s) => s.properties?.sheetId === targetGid);
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
let alumniCacheAt = 0;

const ALUMNI_TTL_MS = Number(process.env.ALUMNI_TTL_MS || 60_000); // 60s default

let slugForwardMapCache: Record<string, string> | null = null;

/* ──────────────────────────────────────────────────────────
 * Slug-forward map (Sheets API)
 * ────────────────────────────────────────────────────────── */

async function loadSlugMapFromSheets(): Promise<Record<string, string> | null> {
  if (!spreadsheetId) return null;
  try {
    const sheets = sheetsClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${SLUGS_TAB}!A:C`,
      valueRenderOption: "UNFORMATTED_VALUE",
    });
    const all = (res.data.values ?? []) as string[][];
    if (all.length < 2) return {};

    const header = all[0].map((h) => String(h ?? "").trim().toLowerCase());
    const iFrom = header.indexOf("fromslug");
    const iTo = header.indexOf("toslug");
    const iAt = header.indexOf("createdat");

    const rows = all.slice(1).map((r) => [
      toLowerSlug(r[iFrom] ?? ""),
      toLowerSlug(r[iTo] ?? ""),
      String(r[iAt] ?? "").trim(),
    ] as [string, string, string?]);

    const map = buildSlugForwardMap(rows);
    if (DEBUG) serverDebug(`🔁 [slug-map] Loaded ${Object.keys(map).length} mappings from Sheets API`);
    return map;
  } catch (e) {
    if (DEBUG) serverWarn("⚠️ [slug-map] Sheets API load failed:", e);
    return null;
  }
}

export const loadSlugForwardMap = cache(async (): Promise<Record<string, string>> => {
  if (slugForwardMapCache) return slugForwardMapCache;
  const map = (await loadSlugMapFromSheets()) ?? {};
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
      if (!candidate || from < candidate) candidate = from;
    }
  }
  return candidate;
}

/* ──────────────────────────────────────────────────────────
 * ✅ Profile-Live loader (SOURCE OF TRUTH)
 * ────────────────────────────────────────────────────────── */

async function loadAlumniFromLive(): Promise<AlumniRow[]> {
  if (!spreadsheetId) throw new Error("Missing ALUMNI_SHEET_ID");

  const sheets = sheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${LIVE_TAB}!A:ZZ`,
    valueRenderOption: "UNFORMATTED_VALUE",
  });

  const all = (res.data.values ?? []) as any[][];
  if (!all.length) return [];

  const header = (all[0] ?? []).map((h) => String(h ?? "").trim());
  const rows = all.slice(1);

  // Core indices
  const slugIdx = idxOf(header, ["slug", "profile slug", "profile-slug"]);
  const nameIdx = idxOf(header, ["name", "full name"]);
  const isPublicIdx = idxOf(header, ["ispublic", "is public", "show on profile?", "show on profile"]);
  const headshotIdx = idxOf(header, ["currentheadshoturl", "current headshot url", "headshot url"]);
  const locationIdx = idxOf(header, ["location", "based in", "currently based in"]);

  // Roles / tags / programs
  const rolesIdx = idxOf(header, ["roles", "role", "primary role"]);
  const tagsIdx = idxOf(header, ["identity tags", "tags", "identity", "identity_tags"]);
  const programsIdx = idxOf(header, ["program badges", "project badges", "programs", "badges"]);

  // ✅ Missing fields that your UI needs
  const statusFlagsIdx = idxOf(header, ["status flags", "statusflags", "flags", "status"]);
  const artistStatementIdx = idxOf(header, [
    "artist statement",
    "artiststatement",
    "bio long",
    "biolong",
    "bio",
    "bio (long)",
  ]);
  const publicEmailIdx = idxOf(header, [
    "public email",
    "publicemail",
    "public_email",
    "publicemail address",
    "publicemailaddress",
    "publicEmail", // <-- add this
  ]);
  if (DEBUG) {
    serverDebug("🧾 [live] publicEmailIdx:", publicEmailIdx, "headerSample:", header.slice(0, 40));
  }
  const websiteIdx = idxOf(header, ["website", "site", "portfolio", "portfolio url"]);
  const socialsIdx = idxOf(header, ["socials", "social links", "social links (csv)", "social"]);

  // Optional
  const backgroundIdx = idxOf(header, ["background choice", "background", "background style", "background key"]);

  const out: AlumniRow[] = [];
  let skipped = 0;

  const cell = (r: any[], idx: number) =>
    idx !== -1 ? String(r?.[idx] ?? "").trim() : "";

  for (const r of rows) {
    const isPublic = isPublicIdx !== -1 ? truthy(r?.[isPublicIdx]) : false;
    if (!isPublic) {
      skipped++;
      continue;
    }

    const slug = slugIdx !== -1 ? toLowerSlug(r?.[slugIdx]) : "";
    const name = cell(r, nameIdx);
    if (!slug && !name) {
      skipped++;
      continue;
    }

    // Adapter: produce the same kind of shape your normalizer expects
    // IMPORTANT: keys here are intentionally "legacy-ish" because normalizeAlumniRow
    // already knows how to translate these into AlumniRow fields.
    const shaped: Record<string, string> = {
      "show on profile?": "Yes",
      name,
      slug,

      location: cell(r, locationIdx),

      // roles (both legacy + new)
      role: cell(r, rolesIdx),
      roles: cell(r, rolesIdx),

      // headshot
      "headshot url": cell(r, headshotIdx),

      // identity tags + programs (legacy labels normalizeAlumniRow expects)
      tags: cell(r, tagsIdx),
      "identity tags": cell(r, tagsIdx),
      programs: cell(r, programsIdx),
      "project badges": cell(r, programsIdx),

      // ✅ NEW: pass through what the Profile page needs
      "status flags": cell(r, statusFlagsIdx),

      // Put this under both likely keys; your normalizer can pick whichever it supports
      "artist statement": cell(r, artistStatementIdx),
      "bio long": cell(r, artistStatementIdx),
      "public email": cell(r, publicEmailIdx),
      publicEmail: cell(r, publicEmailIdx),
      website: cell(r, websiteIdx),
      socials: cell(r, socialsIdx),
      "social links": cell(r, socialsIdx),

      // optional but harmless if your normalizer supports it
      "background choice": cell(r, backgroundIdx),
    };

    const normalizedKeys = Object.fromEntries(
      Object.entries(shaped).map(([k, v]) => [
        k.trim().toLowerCase(),
        String(v ?? "").trim(),
      ])
    );

    // Keep your existing empty-row heuristic
    if (isMostlyEmpty(normalizedKeys)) {
      skipped++;
      continue;
    }

    const normalized = normalizeAlumniRow(normalizedKeys as any);
    if (normalized) out.push(normalized);
    else skipped++;
  }

  if (DEBUG) {
    serverDebug(
      `✅ [loadAlumniFromLive] Loaded ${out.length} public alumni from ${LIVE_TAB}, skipped ${skipped}`
    );
    // Optional: sanity log one row’s key fields
    const sample = out[0] as any;
    if (sample) {
      serverDebug("🧪 [loadAlumniFromLive] sample normalized:", {
        slug: sample.slug,
        statusFlags: sample.statusFlags,
        artistStatementPreview: (sample.artistStatement || "").slice?.(0, 60),
        hasEmail: !!sample.email,
        hasWebsite: !!sample.website,
        hasSocials: !!sample.socials,
      });
    }
  }

  return out;
}

/* ──────────────────────────────────────────────────────────
 * Public exports
 * ────────────────────────────────────────────────────────── */

export const loadAlumni = async (): Promise<AlumniRow[]> => {
  const now = Date.now();

  if (alumniCache.length && now - alumniCacheAt < ALUMNI_TTL_MS) {
    if (DEBUG) serverDebug("⚡ Returning cached alumni:", alumniCache.length);
    return alumniCache;
  }

  if (DEBUG && alumniCache.length) {
    serverDebug("♻️ Cache expired; reloading from Sheets. Cached count:", alumniCache.length);
  }

  try {
    const liveRows = await loadAlumniFromLive();
    alumniCache = liveRows;
    alumniCacheAt = Date.now();
    return liveRows;
  } catch (err) {
    serverError("❌ [loadAlumni] Sheets API load failed:", err);
    return [];
  }
};

export const loadVisibleAlumni = cache(async (): Promise<AlumniRow[]> => {
  const all = await loadAlumni();
  return all.filter((a) => a.showOnProfile?.toLowerCase().trim() === "yes" && !!a.name?.trim());
});

export const loadAlumniNameBySlug = cache(async (): Promise<Record<string, string>> => {
  const all = await loadVisibleAlumni();

  const map: Record<string, string> = {};

  for (const alum of all) {
    const slug = String(alum.slug ?? "").trim().toLowerCase();
    const name = String(alum.name ?? "").trim();

    if (!slug || !name) continue;
    map[slug] = name;
  }

  return map;
});

/**
 * Returns a single alumni by slug — respects forward chains and uses reverse fallback.
 * NOTE: forward map is loaded from Sheets API (Profile-Slugs tab).
 */
export const loadAlumniBySlug = cache(async (slug: string): Promise<AlumniRow | null> => {
  const incoming = toLowerSlug(slug);
  const canonical = await resolveForwardChain(incoming);

  const all = await loadAlumni();

  const foundCanonical = all.find((a) => toLowerSlug(a.slug) === canonical) || null;
  if (foundCanonical) return foundCanonical;

  const reverse = await getReverseSlugSource(incoming);
  if (reverse) {
    const foundReverse = all.find((a) => toLowerSlug(a.slug) === reverse) || null;
    if (foundReverse) return foundReverse;
  }

  return null;
});

/** ✅ Find an alumni row by ANY alias (case-insensitive). */
export async function loadAlumniByAliases(aliases: Set<string>): Promise<AlumniRow | null> {
  const all = await loadAlumni();
  const want = new Set(Array.from(aliases).map((s) => String(s || "").trim().toLowerCase()));
  return all.find((a) => want.has(String(a.slug || "").trim().toLowerCase())) || null;
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
  alumniCacheAt = 0; // ✅ reset TTL clock
  slugForwardMapCache = null;
  if (DEBUG) serverDebug("🧹 Cleared alumni + slug-forward caches");
}

/* ──────────────────────────────────────────────────────────
 * Auto-canonicalize (legacy write-through, unchanged)
 * ────────────────────────────────────────────────────────── */

const inflightCanon = new Set<string>();

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
    // If `newKey` already exists in current dataset, nothing to do.
    const all = await loadAlumni();
    if (all.some((a) => toLowerSlug(a.slug) === newKey)) return;

    const oldRow = all.find((a) => toLowerSlug(a.slug) === oldKey);

    // Optional creation path (legacy, Profile-Data tab)
    if (!oldRow && AUTO_CANON_CREATE_ON_MISS) {
      let tabTitle: string | null = ALUMNI_TAB || null;
      if (!tabTitle) {
        const gid = extractGidFromUrl(csvUrl);
        if (gid !== null) tabTitle = await resolveSheetTitleByGid(spreadsheetId, gid);
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

    let tabTitle: string | null = ALUMNI_TAB || null;
    if (!tabTitle) {
      const gid = extractGidFromUrl(csvUrl);
      if (gid !== null) tabTitle = await resolveSheetTitleByGid(spreadsheetId, gid);
    }
    if (!tabTitle) tabTitle = "Profile-Data";

    if (DEBUG) serverDebug(`✏️ [auto-canon] Updating slug on tab "${tabTitle}": ${oldKey} → ${newKey}`);

    const sheets = sheetsClient();

    const read = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${tabTitle}!A:ZZZ`,
      valueRenderOption: "UNFORMATTED_VALUE",
    });

    const rows = (read.data.values || []) as string[][];
    if (!rows.length) return;

    const rawHeader = rows[0].map((h) => String(h ?? ""));
    const headerNorm = rawHeader.map(normalizeHeaderKey);

    const slugHeaderCandidates = new Set(["slug", "profile slug", "profile-slug"]);
    const slugCol = headerNorm.findIndex((h) => slugHeaderCandidates.has(h));
    if (slugCol === -1) {
      if (DEBUG) serverWarn(`⚠️ [auto-canon] No 'slug' column on tab "${tabTitle}"`);
      return;
    }

    const oldRowIdx = rows.findIndex((r, i) => i > 0 && toLowerSlug(r?.[slugCol]) === oldKey);
    if (oldRowIdx === -1) return;

    const newRowIdx = rows.findIndex((r, i) => i > 0 && toLowerSlug(r?.[slugCol]) === newKey);
    if (newRowIdx !== -1) return;

    const rowNumber = oldRowIdx + 1;
    const row = rows[oldRowIdx];
    const newRow = [...row];
    newRow[slugCol] = nextSlug;

    const endCol = colIndexToA1((rows[0]?.length || (slugCol + 1)) - 1);

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${tabTitle}!A${rowNumber}:${endCol}${rowNumber}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [newRow] },
    });

    invalidateAlumniCaches();
    if (DEBUG) serverDebug(`✅ [auto-canon] Row ${rowNumber} updated on "${tabTitle}" → slug='${nextSlug}'`);
  } catch (e) {
    if (DEBUG) serverWarn("⚠️ [auto-canon] Failed to update Alumni slug:", e);
  } finally {
    inflightCanon.delete(guardKey);
  }
}

