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
// Minimal cache: in-flight dedupe + short dev TTL
// - Goal: prevent Sheets quota explosions during dev/prefetch bursts
// - In prod, Next `revalidate` should do the heavy lifting.
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
 * - Else dev defaults to 15s, prod defaults to 0 (no TTL caching, just in-flight dedupe).
 */
function getTtlMs(): number {
  const raw = process.env.ALUMNI_SHEETS_CACHE_TTL_MS;
  if (raw != null && raw !== "") {
    const n = Number(raw);
    return Number.isFinite(n) ? Math.max(0, n) : 0;
  }
  return process.env.NODE_ENV === "development" ? 15_000 : 0;
}

function cached<T>(key: string, fn: () => Promise<T>) {
  const cache = getCache();
  const now = Date.now();
  const ttlMs = getTtlMs();

  const hit = cache.get(key) as CacheEntry<T> | undefined;
  if (hit) {
    // in-flight only
    if (ttlMs <= 0) {
      if (hit.inFlight) return hit.promise;
      // resolved already: do not reuse
    } else {
      // TTL caching
      if (now - hit.at < ttlMs) return hit.promise;
    }
  }

  // Create entry first (so we can compare promise identity safely in finally/catch)
  let entry!: CacheEntry<T>;

  entry = {
    at: now,
    inFlight: true,
    promise: Promise.resolve()
      .then(fn)
      .finally(() => {
        const cur = cache.get(key) as CacheEntry<T> | undefined;
        // Only mark complete if we're still the newest entry
        if (cur && cur.promise === entry.promise) cur.inFlight = false;
      })
      .catch((err) => {
        const cur = cache.get(key) as CacheEntry<T> | undefined;
        // Only delete if we're still the newest entry
        if (cur && cur.promise === entry.promise) cache.delete(key);
        throw err;
      }),
  };

  cache.set(key, entry);
  return entry.promise;
}



/**
 * ✅ Read Profile-Media rows into the shape that enrichAlumniData expects.
 * ✅ In-flight deduped (+ short dev TTL) to reduce Sheets quota hits.
 */
export async function loadProfileMediaRows(): Promise<ProfileMediaRow[]> {
  const spreadsheetId = process.env.ALUMNI_SHEET_ID || "";
  if (!spreadsheetId) throw new Error("Missing ALUMNI_SHEET_ID");

  const MEDIA_TAB = process.env.ALUMNI_MEDIA_TAB || "Profile-Media";
  const key = `profile-media:${spreadsheetId}:${MEDIA_TAB}`;

  return cached(key, async () => {
    const sheets = sheetsClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${MEDIA_TAB}!A:ZZ`,
      valueRenderOption: "UNFORMATTED_VALUE",
    });

    const all = (res.data.values ?? []) as any[][];
    if (!all.length) return [];

    const header = (all[0] ?? []).map((h) => String(h ?? "").trim());
    const rows = all.slice(1);

    const collectionTitleIdx = idxOf(header, ["collectiontitle", "collection title"]);
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

      // If fileId col is empty but collectionTitle looks like a Drive file id, use it.
      const fileId =
        rawFileId || (driveIdLike(rawCollectionTitle) ? rawCollectionTitle : "");

      const externalUrl = cell(r, externalUrlIdx);
      const uploadedAt = cell(r, uploadedAtIdx);
      const isCurrent = isCurrentIdx !== -1 ? truthy(r?.[isCurrentIdx]) : false;
      const sortIndex = sortIndexIdx !== -1 ? cell(r, sortIndexIdx) : "";

      // skip empty rows
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
 * ✅ In-flight deduped (+ short dev TTL) to reduce Sheets quota hits.
 */
export async function loadProfileLiveRowsPublic(): Promise<ProfileLiveRow[]> {
  const spreadsheetId = process.env.ALUMNI_SHEET_ID || "";
  if (!spreadsheetId) throw new Error("Missing ALUMNI_SHEET_ID");

  const LIVE_TAB = process.env.ALUMNI_LIVE_TAB || "Profile-Live";
  const key = `profile-live-public:${spreadsheetId}:${LIVE_TAB}`;

  return cached(key, async () => {
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

    // Indices we care about (tolerant)
    const slugIdx = idxOf(header, ["slug", "profile slug", "profile-slug"]);
    const nameIdx = idxOf(header, ["name", "full name"]);
    const alumniIdIdx = idxOf(header, ["alumniid", "alumni id"]);
    const emailIdx = idxOf(header, ["email", "email address"]);

    const pronounsIdx = idxOf(header, ["pronouns"]);
    const rolesIdx = idxOf(header, ["roles", "role", "primary role"]);
    const locationIdx = idxOf(header, ["location", "based in", "currently based in"]);
    const currentWorkIdx = idxOf(header, ["currentwork", "current work"]);

    const bioShortIdx = idxOf(header, ["bioshort", "bio short", "short bio"]);
    const bioLongIdx = idxOf(header, [
      "biolong",
      "bio long",
      "bio",
      "artist statement",
      "artiststatement",
    ]);

    const websiteIdx = idxOf(header, ["website", "site", "portfolio", "portfolio url"]);
    const instagramIdx = idxOf(header, ["instagram"]);
    const youtubeIdx = idxOf(header, ["youtube"]);
    const vimeoIdx = idxOf(header, ["vimeo"]);
    const imdbIdx = idxOf(header, ["imdb"]);

    const spotlightIdx = idxOf(header, ["spotlight"]);

    const programsIdx = idxOf(header, ["programs", "program badges", "project badges", "badges"]);
    const tagsIdx = idxOf(header, ["tags", "identity tags", "identity"]);
    const statusFlagsIdx = idxOf(header, ["statusflags", "status flags", "flags"]);
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
    ]);

    const featuredAlbumIdIdx = idxOf(header, ["featuredalbumid", "featured album id"]);
    const featuredReelIdIdx = idxOf(header, ["featuredreelid", "featured reel id"]);
    const featuredEventIdIdx = idxOf(header, ["featuredeventid", "featured event id"]);

    const languagesIdx = idxOf(header, ["languages", "language", "spoken languages"]);

    const out: ProfileLiveRow[] = [];

    for (const r of rows) {
      const isPublic = isPublicIdx !== -1 ? truthy(r?.[isPublicIdx]) : false;
      if (!isPublic) continue;

      const slug = cell(r, slugIdx).toLowerCase();
      const name = cell(r, nameIdx);
      if (!slug || !name) continue;

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
      });
    }

    return out;
  });
}
