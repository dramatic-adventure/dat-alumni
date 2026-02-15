// lib/alumniSheetsPublic.server.ts
import "server-only";

import { sheetsClient } from "@/lib/googleClients";
import type {
  ProfileLiveRow,
  ProfileMediaRow,
} from "@/components/alumni/AlumniSearch/enrichAlumniData.server";

// ------------------------------
// shared helpers (keep identical across pages)
// ------------------------------
function idxOf(header: string[], candidates: string[]) {
  const lower = header.map((h) => String(h || "").trim().toLowerCase());
  for (const c of candidates) {
    const i = lower.indexOf(c.toLowerCase());
    if (i !== -1) return i;
  }
  return -1;
}

function truthy(v: unknown) {
  const s = String(v ?? "").trim().toLowerCase();
  return (
    s === "true" ||
    s === "yes" ||
    s === "y" ||
    s === "1" ||
    s === "✓" ||
    s === "checked"
  );
}

function cell(r: any[], idx: number) {
  return idx !== -1 ? String(r?.[idx] ?? "").trim() : "";
}

// ------------------------------
// Minimal cache: in-flight dedupe + short TTL (dev + prod)
// - Goal: prevent quota explosions during dev/prefetch bursts
// - NOTE: when using published CSV, this is mostly extra safety.
// ------------------------------
type CacheEntry<T> = { at: number; promise: Promise<T>; inFlight: boolean };

const GLOBAL_KEY = "__DAT_ALUMNI_SHEETS_PUBLIC_CACHE__";
const SALT = process.env.VERCEL_GIT_COMMIT_SHA || process.env.NODE_ENV || "dev";
const CACHE_KEY = `${GLOBAL_KEY}_${SALT}`;

function getCache(): Map<string, CacheEntry<any>> {
  const g = globalThis as any;
  if (!g[CACHE_KEY]) g[CACHE_KEY] = new Map<string, CacheEntry<any>>();
  return g[CACHE_KEY] as Map<string, CacheEntry<any>>;
}

/**
 * Cache TTL behavior:
 * - If ALUMNI_SHEETS_CACHE_TTL_MS is set, use it.
 * - Else:
 *    - dev defaults to 15s
 *    - prod defaults to 60s
 */
function getTtlMs(): number {
  const raw = process.env.ALUMNI_SHEETS_CACHE_TTL_MS;
  if (raw != null && raw !== "") {
    const n = Number(raw);
    return Number.isFinite(n) ? Math.max(0, n) : 0;
  }
  return process.env.NODE_ENV === "development" ? 15_000 : 60_000;
}

function cached<T>(key: string, fn: () => Promise<T>) {
  const cache = getCache();
  const now = Date.now();
  const ttlMs = getTtlMs();

  const hit = cache.get(key) as CacheEntry<T> | undefined;
  if (hit) {
    if (hit.inFlight) return hit.promise;
    if (ttlMs > 0 && now - hit.at < ttlMs) return hit.promise;
  }

  let entry!: CacheEntry<T>;
  entry = {
    at: now,
    inFlight: true,
    promise: Promise.resolve()
      .then(fn)
      .finally(() => {
        const cur = cache.get(key) as CacheEntry<T> | undefined;
        if (cur && cur.promise === entry.promise) cur.inFlight = false;
      })
      .catch((err) => {
        const cur = cache.get(key) as CacheEntry<T> | undefined;
        if (cur && cur.promise === entry.promise) cache.delete(key);
        throw err;
      }),
  };

  cache.set(key, entry);
  return entry.promise;
}

// ------------------------------
// CSV support (Fix 4): published CSV for Directory (zero Sheets quota)
// ------------------------------
function cleanBOM(s: string) {
  if (!s) return s;
  return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}

/**
 * Robust-enough CSV parser for Google Sheets CSV export:
 * - Handles commas, quotes, newlines inside quotes.
 * - Returns rows of string cells.
 */
function parseCsv(text: string): string[][] {
  const s = cleanBOM(String(text ?? ""));
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];

    if (inQuotes) {
      if (ch === '"') {
        const next = s[i + 1];
        if (next === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }

    if (ch === ",") {
      row.push(cur);
      cur = "";
      continue;
    }

    if (ch === "\n") {
      row.push(cur);
      rows.push(row);
      row = [];
      cur = "";
      continue;
    }

    if (ch === "\r") {
      // ignore CR (Windows line endings)
      continue;
    }

    cur += ch;
  }

  // last cell
  row.push(cur);
  rows.push(row);

  // Trim trailing empty final row if present
  if (
    rows.length &&
    rows[rows.length - 1].every((c) => String(c ?? "").trim() === "")
  ) {
    rows.pop();
  }

  return rows;
}

function pickCsvUrl(kind: "live" | "media"): string | null {
  // Prefer server-only vars if you add them later:
  //   PROFILE_LIVE_CSV_URL / PROFILE_MEDIA_CSV_URL
  // Fallback to your current NEXT_PUBLIC_* vars.
  const raw =
    kind === "live"
      ? process.env.PROFILE_LIVE_CSV_URL ||
        process.env.ALUMNI_LIVE_CSV_URL ||
        process.env.NEXT_PUBLIC_PROFILE_LIVE_CSV_URL
      : process.env.PROFILE_MEDIA_CSV_URL ||
        process.env.ALUMNI_MEDIA_CSV_URL ||
        process.env.NEXT_PUBLIC_PROFILE_MEDIA_CSV_URL;

  const url = String(raw ?? "").trim();
  if (!url) return null;

  return url;
}

function normalizeGoogleSheetsCsvUrl(rawUrl: string): string {
  const u = String(rawUrl || "").trim();
  if (!u) return u;

  let url: URL;
  try {
    url = new URL(u);
  } catch {
    return u;
  }

  const host = url.hostname.toLowerCase();
  const pathname = url.pathname;

  if (host !== "docs.google.com") return u;

  if (pathname.includes("/gviz/tq")) {
    const tqx = url.searchParams.get("tqx") || "";
    if (!/out:csv/i.test(tqx)) {
      url.searchParams.set("tqx", tqx ? `${tqx};out:csv` : "out:csv");
    }
    return url.toString();
  }

  if (pathname.includes("/spreadsheets/d/e/")) {
    const isPubHtml = pathname.includes("/pubhtml");
    const isPub = pathname.includes("/pub");
    if (isPubHtml) {
      url.pathname = pathname.replace("/pubhtml", "/pub");
    } else if (!isPub && !pathname.endsWith("/pub")) {
      // leave as-is if it isn't a published link; caller must provide a proper endpoint
    }
    if (!url.searchParams.get("output")) url.searchParams.set("output", "csv");
    return url.toString();
  }

  const m = pathname.match(/\/spreadsheets\/d\/([^/]+)\//);
  if (m && m[1]) {
    const sheetId = m[1];
    const gid = url.searchParams.get("gid") || "0";

    if (pathname.includes("/export")) {
      if (!url.searchParams.get("format")) url.searchParams.set("format", "csv");
      if (!url.searchParams.get("gid")) url.searchParams.set("gid", gid);
      return url.toString();
    }

    if (
      pathname.includes("/edit") ||
      pathname.includes("/view") ||
      pathname.endsWith(`/${sheetId}`)
    ) {
      const out = new URL(`https://docs.google.com/spreadsheets/d/${sheetId}/export`);
      out.searchParams.set("format", "csv");
      out.searchParams.set("gid", gid);
      return out.toString();
    }
  }

  if (pathname.includes("/spreadsheets/") && pathname.includes("/pub")) {
    if (!url.searchParams.get("output")) url.searchParams.set("output", "csv");
    return url.toString();
  }

  return u;
}

function looksLikeHtmlInterstitial(body: string) {
  const s = String(body || "").trimStart();
  if (!s) return false;
  const head = s.slice(0, 400).toLowerCase();
  if (head.startsWith("<!doctype html") || head.startsWith("<html")) return true;
  if (head.includes("<html") && head.includes("</html")) return true;
  if (head.includes("accounts.google.com")) return true;
  if (head.includes("consent.google.com")) return true;
  if (head.includes("to continue to google")) return true;
  if (head.includes("sign in")) return true;
  return false;
}

async function fetchCsvRows(url: string, key: string): Promise<string[][]> {
  const normalized = normalizeGoogleSheetsCsvUrl(url);

  return cached(key, async () => {
    const timeoutRaw = process.env.ALUMNI_CSV_FETCH_TIMEOUT_MS;
    const timeoutMs =
      timeoutRaw && Number.isFinite(Number(timeoutRaw))
        ? Math.max(1_000, Number(timeoutRaw))
        : 15_000;

    const headers: Record<string, string> = {
      accept: "text/csv,text/plain;q=0.9,*/*;q=0.8",
      "accept-language": "en-US,en;q=0.9",
      "user-agent": "DAT-AlumniDirectory/1.0",
    };

    let res: Response;
    if (typeof (AbortSignal as any)?.timeout === "function") {
      res = await fetch(normalized, {
        cache: "force-cache",
        next: { revalidate: 300 },
        redirect: "follow",
        headers,
        signal: (AbortSignal as any).timeout(timeoutMs),
      });
    } else {
      const ac = new AbortController();
      const t = setTimeout(() => ac.abort(), timeoutMs);
      try {
        res = await fetch(normalized, {
          cache: "force-cache",
          next: { revalidate: 300 },
          redirect: "follow",
          headers,
          signal: ac.signal,
        });
      } finally {
        clearTimeout(t);
      }
    }

    const ct = String(res.headers.get("content-type") || "").toLowerCase();

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      const hint = looksLikeHtmlInterstitial(body)
        ? " (received HTML interstitial; ensure the sheet is Published to the web as CSV or publicly accessible)"
        : "";
      throw new Error(
        `CSV fetch failed (${res.status})${hint}: ${body?.slice(0, 250) || ""}`
      );
    }

    const text = await res.text();

    if (ct.includes("text/html") || looksLikeHtmlInterstitial(text)) {
      throw new Error(
        `CSV fetch returned HTML (likely Google auth/consent interstitial). Use a published CSV URL (e.g., /pub?output=csv) or a truly public CSV export endpoint. Snippet: ${String(
          text || ""
        )
          .slice(0, 250)
          .replace(/\s+/g, " ")
          .trim()}`
      );
    }

    return parseCsv(text);
  });
}

// ------------------------------
// Google Sheets range tuning (fallback only, when CSV not configured)
// ------------------------------
function getRange(tab: string, fallback: string) {
  const envKey =
    tab === (process.env.ALUMNI_LIVE_TAB || "Profile-Live")
      ? process.env.ALUMNI_LIVE_RANGE
      : tab === (process.env.ALUMNI_MEDIA_TAB || "Profile-Media")
      ? process.env.ALUMNI_MEDIA_RANGE
      : undefined;

  if (envKey && envKey.includes("!")) return envKey;
  return `${tab}!${fallback}`;
}

/**
 * ✅ Read Profile-Media rows into the shape that enrichAlumniData expects.
 * ✅ Fix 4: Prefer published CSV (zero quota) when a published CSV URL is set
 *    (PROFILE_*_CSV_URL / ALUMNI_*_CSV_URL / NEXT_PUBLIC_PROFILE_*_CSV_URL).
 * ✅ Fallback: Sheets API (still deduped + TTL).
 */
export async function loadProfileMediaRows(): Promise<ProfileMediaRow[]> {
  const spreadsheetId = process.env.ALUMNI_SHEET_ID || "";
  const MEDIA_TAB = process.env.ALUMNI_MEDIA_TAB || "Profile-Media";

  // --- Fix 4 path: published CSV ---
  const csvUrl = pickCsvUrl("media");
  if (csvUrl) {
    try {
      const key = `csv:profile-media:${csvUrl}`;
      const all = await fetchCsvRows(csvUrl, key);
      if (!all.length) return [];

      const header = (all[0] ?? []).map((h) => String(h ?? "").trim());
      const rows = all.slice(1);

      const collectionTitleIdx = idxOf(header, [
        "collectiontitle",
        "collection title",
      ]);
      const alumniIdIdx = idxOf(header, ["alumniid", "alumni id", "slug"]);
      const kindIdx = idxOf(header, ["kind"]);
      const fileIdIdx = idxOf(header, ["fileid", "file id"]);
      const externalUrlIdx = idxOf(header, ["externalurl", "external url"]);
      const uploadedAtIdx = idxOf(header, ["uploadedat", "uploaded at"]);
      const isCurrentIdx = idxOf(header, ["iscurrent", "is current"]);
      const sortIndexIdx = idxOf(header, ["sortindex", "sort index"]);

      const driveIdLike = (s: string) => /^[A-Za-z0-9_-]{20,}$/.test(s);

      const out: ProfileMediaRow[] = [];

      for (const r of rows) {
        const alumniId = (cell(r as any[], alumniIdIdx) || "").toLowerCase();
        const kind = cell(r as any[], kindIdx);
        const rawFileId = cell(r as any[], fileIdIdx);
        const rawCollectionTitle = cell(r as any[], collectionTitleIdx);

        const fileId =
          rawFileId ||
          (driveIdLike(rawCollectionTitle) ? rawCollectionTitle : "");

        const externalUrl = cell(r as any[], externalUrlIdx);
        const uploadedAt = cell(r as any[], uploadedAtIdx);
        const isCurrent =
          isCurrentIdx !== -1 ? truthy((r as any[])?.[isCurrentIdx]) : false;
        const sortIndex =
          sortIndexIdx !== -1 ? cell(r as any[], sortIndexIdx) : "";

        if (!alumniId && !fileId && !externalUrl) continue;

        out.push({
          alumniId: alumniId || undefined,
          kind: kind || undefined,
          fileId: fileId || undefined,
          externalUrl: externalUrl || undefined,
          uploadedAt: uploadedAt || undefined,
          isCurrent,
          sortIndex: sortIndex || undefined,
        });
      }

      return out;
    } catch (err: any) {
      if (!spreadsheetId) throw err;
      console.warn(
        `[alumniSheetsPublic] CSV media fetch failed; falling back to Sheets API. url=${csvUrl} err=${
          err?.message || String(err)
        }`
      );
    }
  }

  // --- Fallback path: Sheets API ---
  if (!spreadsheetId) {
    throw new Error(
      "Missing ALUMNI_SHEET_ID (and no published CSV URL configured for this dataset)"
    );
  }

  const key = `sheets:profile-media:${spreadsheetId}:${MEDIA_TAB}`;

  return cached(key, async () => {
    const sheets = sheetsClient();

    const range = getRange(MEDIA_TAB, "A:K");

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
      valueRenderOption: "UNFORMATTED_VALUE",
    });

    const all = (res.data.values ?? []) as any[][];
    if (!all.length) return [];

    const header = (all[0] ?? []).map((h) => String(h ?? "").trim());
    const rows = all.slice(1);

    const collectionTitleIdx = idxOf(header, [
      "collectiontitle",
      "collection title",
    ]);
    const alumniIdIdx = idxOf(header, ["alumniid", "alumni id", "slug"]);
    const kindIdx = idxOf(header, ["kind"]);
    const fileIdIdx = idxOf(header, ["fileid", "file id"]);
    const externalUrlIdx = idxOf(header, ["externalurl", "external url"]);
    const uploadedAtIdx = idxOf(header, ["uploadedat", "uploaded at"]);
    const isCurrentIdx = idxOf(header, ["iscurrent", "is current"]);
    const sortIndexIdx = idxOf(header, ["sortindex", "sort index"]);

    const driveIdLike = (s: string) => /^[A-Za-z0-9_-]{20,}$/.test(s);

    const out: ProfileMediaRow[] = [];

    for (const r of rows) {
      const alumniId = (cell(r, alumniIdIdx) || "").toLowerCase();
      const kind = cell(r, kindIdx);
      const rawFileId = cell(r, fileIdIdx);
      const rawCollectionTitle = cell(r, collectionTitleIdx);

      const fileId =
        rawFileId || (driveIdLike(rawCollectionTitle) ? rawCollectionTitle : "");

      const externalUrl = cell(r, externalUrlIdx);
      const uploadedAt = cell(r, uploadedAtIdx);
      const isCurrent =
        isCurrentIdx !== -1 ? truthy(r?.[isCurrentIdx]) : false;
      const sortIndex = sortIndexIdx !== -1 ? cell(r, sortIndexIdx) : "";

      if (!alumniId && !fileId && !externalUrl) continue;

      out.push({
        alumniId: alumniId || undefined,
        kind: kind || undefined,
        fileId: fileId || undefined,
        externalUrl: externalUrl || undefined,
        uploadedAt: uploadedAt || undefined,
        isCurrent,
        sortIndex: sortIndex || undefined,
      });
    }

    return out;
  });
}

/**
 * ✅ Read Profile-Live rows (public only) into the shape that enrichAlumniData expects.
 * ✅ Fix 4: Prefer published CSV (zero quota) when a published CSV URL is set
 *    (PROFILE_*_CSV_URL / ALUMNI_*_CSV_URL / NEXT_PUBLIC_PROFILE_*_CSV_URL).
 * ✅ Fallback: Sheets API (still deduped + TTL).
 */
export async function loadProfileLiveRowsPublic(): Promise<ProfileLiveRow[]> {
  const spreadsheetId = process.env.ALUMNI_SHEET_ID || "";
  const LIVE_TAB = process.env.ALUMNI_LIVE_TAB || "Profile-Live";

  // --- Fix 4 path: published CSV ---
  const csvUrl = pickCsvUrl("live");
  if (csvUrl) {
    try {
      const key = `csv:profile-live-public:${csvUrl}`;
      const all = await fetchCsvRows(csvUrl, key);
      if (!all.length) return [];

      const header = (all[0] ?? []).map((h) => String(h ?? "").trim());
      const rows = all.slice(1);

      const slugIdx = idxOf(header, ["slug", "profile slug", "profile-slug"]);
      const nameIdx = idxOf(header, ["name", "full name"]);
      const alumniIdIdx = idxOf(header, ["alumniid", "alumni id"]);
      const emailIdx = idxOf(header, ["email", "email address"]);

      const pronounsIdx = idxOf(header, ["pronouns"]);
      const rolesIdx = idxOf(header, ["roles", "role", "primary role"]);
      const locationIdx = idxOf(header, [
        "location",
        "based in",
        "currently based in",
      ]);
      const currentWorkIdx = idxOf(header, ["currentwork", "current work"]);

      const bioShortIdx = idxOf(header, ["bioshort", "bio short", "short bio"]);
      const bioLongIdx = idxOf(header, [
        "biolong",
        "bio long",
        "bio",
        "artist statement",
        "artiststatement",
      ]);

      const websiteIdx = idxOf(header, [
        "website",
        "site",
        "portfolio",
        "portfolio url",
      ]);
      const instagramIdx = idxOf(header, ["instagram"]);
      const youtubeIdx = idxOf(header, ["youtube"]);
      const vimeoIdx = idxOf(header, ["vimeo"]);
      const imdbIdx = idxOf(header, ["imdb"]);

      const spotlightIdx = idxOf(header, ["spotlight"]);

      const programsIdx = idxOf(header, [
        "programs",
        "program badges",
        "project badges",
        "badges",
      ]);
      const tagsIdx = idxOf(header, ["tags", "identity tags", "identity"]);
      const statusFlagsIdx = idxOf(header, [
        "statusflags",
        "status flags",
        "flags",
      ]);
      const statusIdx = idxOf(header, ["status"]);
      const isPublicIdx = idxOf(header, [
        "ispublic",
        "is public",
        "show on profile?",
        "show on profile",
      ]);
      const updatedAtIdx = idxOf(header, [
        "updatedat",
        "updated at",
        "lastmodified",
        "last modified",
      ]);

      const currentHeadshotIdIdx = idxOf(header, [
        "currentheadshotid",
        "current headshot id",
      ]);
      const currentHeadshotUrlIdx = idxOf(header, [
        "currentheadshoturl",
        "current headshot url",
        "headshot url",
        "headshoturl",
      ]);

      const featuredAlbumIdIdx = idxOf(header, [
        "featuredalbumid",
        "featured album id",
      ]);
      const featuredReelIdIdx = idxOf(header, [
        "featuredreelid",
        "featured reel id",
      ]);
      const featuredEventIdIdx = idxOf(header, [
        "featuredeventid",
        "featured event id",
      ]);

      const languagesIdx = idxOf(header, [
        "languages",
        "language",
        "spoken languages",
      ]);

      const canonicalSlugIdx = idxOf(header, ["canonicalslug", "canonical slug"]);
      const headshotCacheKeyIdx = idxOf(header, [
        "headshotcachekey",
        "headshot cache key",
        "avatarupdatedat",
        "avatar updated at",
        "headshotupdatedat",
        "headshot updated at",
      ]);

      const out: ProfileLiveRow[] = [];

      for (const r of rows) {
        const isPublic =
          isPublicIdx !== -1 ? truthy((r as any[])?.[isPublicIdx]) : false;
        if (!isPublic) continue;

        const slug = cell(r as any[], slugIdx).toLowerCase();
        const name = cell(r as any[], nameIdx);
        if (!slug || !name) continue;

        const canonicalSlug =
          cell(r as any[], canonicalSlugIdx).toLowerCase() || "";

        out.push({
          name,
          slug,

          alumniId:
            (cell(r as any[], alumniIdIdx) || "").toLowerCase() || undefined,
          email: cell(r as any[], emailIdx) || undefined,

          pronouns: cell(r as any[], pronounsIdx) || undefined,
          roles: cell(r as any[], rolesIdx) || undefined,
          location: cell(r as any[], locationIdx) || undefined,
          currentWork: cell(r as any[], currentWorkIdx) || undefined,

          bioShort: cell(r as any[], bioShortIdx) || undefined,
          bioLong: cell(r as any[], bioLongIdx) || undefined,

          website: cell(r as any[], websiteIdx) || undefined,
          instagram: cell(r as any[], instagramIdx) || undefined,
          youtube: cell(r as any[], youtubeIdx) || undefined,
          vimeo: cell(r as any[], vimeoIdx) || undefined,
          imdb: cell(r as any[], imdbIdx) || undefined,

          spotlight: cell(r as any[], spotlightIdx) || undefined,

          programs: cell(r as any[], programsIdx) || undefined,
          tags: cell(r as any[], tagsIdx) || undefined,
          statusFlags: cell(r as any[], statusFlagsIdx) || undefined,

          isPublic: isPublic ? "true" : "false",
          status: cell(r as any[], statusIdx) || undefined,
          updatedAt: cell(r as any[], updatedAtIdx) || undefined,

          currentHeadshotId:
            cell(r as any[], currentHeadshotIdIdx) || undefined,
          currentHeadshotUrl:
            cell(r as any[], currentHeadshotUrlIdx) || undefined,

          featuredAlbumId:
            cell(r as any[], featuredAlbumIdIdx) || undefined,
          featuredReelId: cell(r as any[], featuredReelIdIdx) || undefined,
          featuredEventId: cell(r as any[], featuredEventIdIdx) || undefined,

          languages: cell(r as any[], languagesIdx) || undefined,

          ...(canonicalSlug ? ({ canonicalSlug } as any) : null),
          ...(cell(r as any[], headshotCacheKeyIdx)
            ? ({ headshotCacheKey: cell(r as any[], headshotCacheKeyIdx) } as any)
            : null),
        } as any);
      }

      return out;
    } catch (err: any) {
      if (!spreadsheetId) throw err;
      console.warn(
        `[alumniSheetsPublic] CSV live fetch failed; falling back to Sheets API. url=${csvUrl} err=${
          err?.message || String(err)
        }`
      );
    }
  }

  // --- Fallback path: Sheets API ---
  if (!spreadsheetId) {
    throw new Error(
      "Missing ALUMNI_SHEET_ID (and no published CSV URL configured for this dataset)"
    );
  }

  const key = `sheets:profile-live-public:${spreadsheetId}:${LIVE_TAB}`;

  return cached(key, async () => {
    const sheets = sheetsClient();

    const range = getRange(LIVE_TAB, "A:AZ");

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
      valueRenderOption: "UNFORMATTED_VALUE",
    });

    const all = (res.data.values ?? []) as any[][];
    if (!all.length) return [];

    const header = (all[0] ?? []).map((h) => String(h ?? "").trim());
    const rows = all.slice(1);

    const slugIdx = idxOf(header, ["slug", "profile slug", "profile-slug"]);
    const nameIdx = idxOf(header, ["name", "full name"]);
    const alumniIdIdx = idxOf(header, ["alumniid", "alumni id"]);
    const emailIdx = idxOf(header, ["email", "email address"]);

    const pronounsIdx = idxOf(header, ["pronouns"]);
    const rolesIdx = idxOf(header, ["roles", "role", "primary role"]);
    const locationIdx = idxOf(header, [
      "location",
      "based in",
      "currently based in",
    ]);
    const currentWorkIdx = idxOf(header, ["currentwork", "current work"]);

    const bioShortIdx = idxOf(header, ["bioshort", "bio short", "short bio"]);
    const bioLongIdx = idxOf(header, [
      "biolong",
      "bio long",
      "bio",
      "artist statement",
      "artiststatement",
    ]);

    const websiteIdx = idxOf(header, [
      "website",
      "site",
      "portfolio",
      "portfolio url",
    ]);
    const instagramIdx = idxOf(header, ["instagram"]);
    const youtubeIdx = idxOf(header, ["youtube"]);
    const vimeoIdx = idxOf(header, ["vimeo"]);
    const imdbIdx = idxOf(header, ["imdb"]);

    const spotlightIdx = idxOf(header, ["spotlight"]);

    const programsIdx = idxOf(header, [
      "programs",
      "program badges",
      "project badges",
      "badges",
    ]);
    const tagsIdx = idxOf(header, ["tags", "identity tags", "identity"]);
    const statusFlagsIdx = idxOf(header, [
      "statusflags",
      "status flags",
      "flags",
    ]);
    const statusIdx = idxOf(header, ["status"]);
    const isPublicIdx = idxOf(header, [
      "ispublic",
      "is public",
      "show on profile?",
      "show on profile",
    ]);
    const updatedAtIdx = idxOf(header, [
      "updatedat",
      "updated at",
      "lastmodified",
      "last modified",
    ]);

    const currentHeadshotIdIdx = idxOf(header, [
      "currentheadshotid",
      "current headshot id",
    ]);
    const currentHeadshotUrlIdx = idxOf(header, [
      "currentheadshoturl",
      "current headshot url",
      "headshot url",
      "headshoturl",
    ]);

    const featuredAlbumIdIdx = idxOf(header, [
      "featuredalbumid",
      "featured album id",
    ]);
    const featuredReelIdIdx = idxOf(header, [
      "featuredreelid",
      "featured reel id",
    ]);
    const featuredEventIdIdx = idxOf(header, [
      "featuredeventid",
      "featured event id",
    ]);

    const languagesIdx = idxOf(header, [
      "languages",
      "language",
      "spoken languages",
    ]);

    const canonicalSlugIdx = idxOf(header, ["canonicalslug", "canonical slug"]);
    const headshotCacheKeyIdx = idxOf(header, [
      "headshotcachekey",
      "headshot cache key",
      "avatarupdatedat",
      "avatar updated at",
      "headshotupdatedat",
      "headshot updated at",
    ]);

    const out: ProfileLiveRow[] = [];

    for (const r of rows) {
      const isPublic = isPublicIdx !== -1 ? truthy(r?.[isPublicIdx]) : false;
      if (!isPublic) continue;

      const slug = cell(r, slugIdx).toLowerCase();
      const name = cell(r, nameIdx);
      if (!slug || !name) continue;

      const canonicalSlug = cell(r, canonicalSlugIdx).toLowerCase() || "";

      out.push({
        name,
        slug,

        alumniId: (cell(r, alumniIdIdx) || "").toLowerCase() || undefined,
        email: cell(r, emailIdx) || undefined,

        pronouns: cell(r, pronounsIdx) || undefined,
        roles: cell(r, rolesIdx) || undefined,
        location: cell(r, locationIdx) || undefined,
        currentWork: cell(r, currentWorkIdx) || undefined,

        bioShort: cell(r, bioShortIdx) || undefined,
        bioLong: cell(r, bioLongIdx) || undefined,

        website: cell(r, websiteIdx) || undefined,
        instagram: cell(r, instagramIdx) || undefined,
        youtube: cell(r, youtubeIdx) || undefined,
        vimeo: cell(r, vimeoIdx) || undefined,
        imdb: cell(r, imdbIdx) || undefined,

        spotlight: cell(r, spotlightIdx) || undefined,

        programs: cell(r, programsIdx) || undefined,
        tags: cell(r, tagsIdx) || undefined,
        statusFlags: cell(r, statusFlagsIdx) || undefined,

        isPublic: isPublic ? "true" : "false",
        status: cell(r, statusIdx) || undefined,
        updatedAt: cell(r, updatedAtIdx) || undefined,

        currentHeadshotId: cell(r, currentHeadshotIdIdx) || undefined,
        currentHeadshotUrl: cell(r, currentHeadshotUrlIdx) || undefined,

        featuredAlbumId: cell(r, featuredAlbumIdIdx) || undefined,
        featuredReelId: cell(r, featuredReelIdIdx) || undefined,
        featuredEventId: cell(r, featuredEventIdIdx) || undefined,

        languages: cell(r, languagesIdx) || undefined,

        ...(canonicalSlug ? ({ canonicalSlug } as any) : null),
        ...(cell(r, headshotCacheKeyIdx)
          ? ({ headshotCacheKey: cell(r, headshotCacheKeyIdx) } as any)
          : null),
      } as any);
    }

    return out;
  });
}
