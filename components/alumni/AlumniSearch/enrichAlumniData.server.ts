import "server-only";

import { normalizeText } from "./searchUtils";
import { addPhraseTokens, tokenize } from "./tokenUtils";
import { programMap } from "@/lib/programMap";
import { productionMap } from "@/lib/productionMap";
import { seasons } from "@/lib/seasonData";
import { getSlugAliases, normSlug, resolveCanonicalSlug } from "@/lib/slugAliases";

function devLog(...args: any[]) {
  if (process.env.NODE_ENV !== "development") return;
  if (process.env.DEBUG_HEADSHOTS !== "1") return;
  // eslint-disable-next-line no-console
  console.log(...args);
}

/**
 * Profile-Live row shape (based on your current headers).
 * Keep it local to this module so it stays obviously tied to enrichment.
 */
export type ProfileLiveRow = {
  name: string;
  alumniId?: string;
  email?: string;
  slug: string;

  pronouns?: string;
  roles?: string; // likely CSV/pipe separated string
  location?: string;
  currentWork?: string;

  bioShort?: string;
  bioLong?: string;

  website?: string;
  instagram?: string;
  youtube?: string;
  vimeo?: string;
  imdb?: string;

  spotlight?: string;

  programs?: string; // list-ish string
  tags?: string; // list-ish string
  statusFlags?: string; // list-ish string

  // ✅ NEW
  languages?: string; // list-ish string (English | Spanish | ...)

  isPublic?: string;
  status?: string;
  updatedAt?: string;

  currentHeadshotId?: string;
  currentHeadshotUrl?: string;

  featuredAlbumId?: string;
  featuredReelId?: string;
  featuredEventId?: string;
};

export type EnrichedProfileLiveRow = ProfileLiveRow & {
  canonicalSlug: string;

  /**
   * ✅ SINGLE authoritative headshot URL for all UI.
   * Must be either:
   * - `/api/img?url=...` (encoded upstream URL), OR
   * - `/images/default-headshot.png`
   */
  headshotUrl?: string;

  /**
   * ✅ Cache-bust key that changes when the headshot changes.
   * Prefer uploadedAt from Profile-Media.
   */
  headshotCacheKey?: string;

  // Search fields
  aliasTokens: string[];
  programTokens: string[];
  productionTokens: string[];
  festivalTokens: string[];
  roleTokens: string[];
  bioTokens: string[];
  locationTokens: string[];

  // Optional (nice to have)
  identityTokens: string[]; // your sheet calls these `tags` right now
  statusTokens: string[]; // from statusFlags/status/isPublic

  // ✅ NEW
  seasonTokens: string[]; // derived from seasonData + programMap/productionMap season numbers
  languageTokens: string[]; // derived from Profile-Live languages (and tags fallback)
};

function addNameTokens(set: Set<string>, raw?: string) {
  addPhraseTokens(set, raw);
}

/**
 * Add a string to tokens and also extract:
 * - 4-digit years (19xx/20xx)
 * - common season words (spring/summer/fall/autumn/winter/j-term/may-term)
 */
function addYearishTokens(set: Set<string>, raw?: unknown) {
  const s = String(raw ?? "").trim();
  if (!s) return;

  // Full phrase + words
  addPhraseTokens(set, s);

  // 4-digit years
  const years = s.match(/\b(19|20)\d{2}\b/g) || [];
  for (const y of years) set.add(y);

  // Season words
  const n = normalizeText(s);
  const seasonWords = [
    "spring",
    "summer",
    "fall",
    "autumn",
    "winter",
    "j term",
    "j-term",
    "jterm",
    "may term",
    "may-term",
    "mayterm",
  ];

  // normalizeText collapses punctuation to spaces
  for (const w of seasonWords) {
    const wn = normalizeText(w);
    if (n.includes(wn)) set.add(wn);
  }
}

/** Parse list-ish strings: commas, pipes, semicolons, newlines */
function splitListish(raw?: string): string[] {
  const s = String(raw ?? "").trim();
  if (!s) return [];
  return s
    .split(/[\n,;|]+/g)
    .map((x) => x.trim())
    .filter(Boolean);
}

/**
 * Add all Profile-Live fields we care about into aliasTokens (catch-all).
 * This is how we guarantee "anything in Profile-Live should hit search".
 */
function addProfileLiveTokens(aliasTokens: Set<string>, item: ProfileLiveRow) {
  // Core identity
  addNameTokens(aliasTokens, item.name);
  addPhraseTokens(aliasTokens, item.slug);
  addPhraseTokens(aliasTokens, item.alumniId);

  // Contact / web
  addPhraseTokens(aliasTokens, item.email);
  addPhraseTokens(aliasTokens, item.website);
  addPhraseTokens(aliasTokens, item.instagram);
  addPhraseTokens(aliasTokens, item.youtube);
  addPhraseTokens(aliasTokens, item.vimeo);
  addPhraseTokens(aliasTokens, item.imdb);

  // Profile fields
  addPhraseTokens(aliasTokens, item.pronouns);
  addPhraseTokens(aliasTokens, item.location);
  addPhraseTokens(aliasTokens, item.currentWork);

  // Bios
  addPhraseTokens(aliasTokens, item.bioShort);
  addPhraseTokens(aliasTokens, item.bioLong);
  addPhraseTokens(aliasTokens, item.spotlight);

  // List-ish fields (programs/tags/statusFlags/languages)
  for (const x of splitListish(item.roles)) addPhraseTokens(aliasTokens, x);
  for (const x of splitListish(item.programs)) addPhraseTokens(aliasTokens, x);
  for (const x of splitListish(item.tags)) addPhraseTokens(aliasTokens, x);
  for (const x of splitListish(item.statusFlags))
    addPhraseTokens(aliasTokens, x);
  for (const x of splitListish(item.languages))
    addPhraseTokens(aliasTokens, x);

  // Status / public flags
  addPhraseTokens(aliasTokens, item.isPublic);
  addPhraseTokens(aliasTokens, item.status);

  // Dates / year-ish
  addYearishTokens(aliasTokens, item.updatedAt);

  // Media IDs/URLs (people sometimes paste these)
  addPhraseTokens(aliasTokens, item.currentHeadshotId);
  addPhraseTokens(aliasTokens, item.currentHeadshotUrl);
  addPhraseTokens(aliasTokens, item.featuredAlbumId);
  addPhraseTokens(aliasTokens, item.featuredReelId);
  addPhraseTokens(aliasTokens, item.featuredEventId);
}

/**
 * Add canonical season tokens from lib/seasonData.ts
 * given a season number like 18.
 */
function addSeasonFromNumber(set: Set<string>, seasonNum?: unknown) {
  const n = Number(seasonNum);
  if (!Number.isFinite(n) || n <= 0) return;

  const slug = `season-${n}`;
  const info = seasons.find((s) => s.slug === slug);

  // Always add slug + human label
  addPhraseTokens(set, slug); // "season-18"
  addPhraseTokens(set, `season ${n}`); // "season 18"

  if (!info) return;

  // Add official title/years
  addPhraseTokens(set, info.seasonTitle); // "Season 18"
  addPhraseTokens(set, info.years); // "2023 / 2024"
  addYearishTokens(set, info.years); // adds 2023, 2024

  // Add projects (helps search/filter discoverability)
  for (const p of info.projects || []) addPhraseTokens(set, p);

  // Add combined tokens for better matching
  addPhraseTokens(set, `${info.seasonTitle} ${info.years}`); // "Season 18 2023 / 2024"
}

function addLanguageTokens(set: Set<string>, raw?: string) {
  // Add phrase tokens for each list item
  for (const x of splitListish(raw)) addPhraseTokens(set, x);

  // Canonicalize common names -> stable tokens for filtering
  const all = splitListish(raw).join(" ");
  const n = normalizeText(all);

  const map: Record<string, string[]> = {
    english: ["english", "en"],
    spanish: ["spanish", "espanol", "español", "es"],
    french: ["french", "francais", "français", "fr"],
    portuguese: ["portuguese", "portugues", "português", "pt"],
    german: ["german", "deutsch", "de"],
    italian: ["italian", "it"],
    arabic: ["arabic", "ar"],
  };

  for (const [canon, variants] of Object.entries(map)) {
    if (variants.some((v) => n.includes(normalizeText(v)))) {
      set.add(canon);
    }
  }
}

function headshotUrlFrom(item: ProfileLiveRow): string {
  const id = String(item.currentHeadshotId ?? "").trim();
  if (id) {
    return `https://drive.google.com/uc?export=view&id=${encodeURIComponent(id)}`;
  }

  const u = String(item.currentHeadshotUrl ?? "").trim();
  return u;
}

/**
 * ✅ SINGLE SOURCE OF TRUTH (server-only)
 * Enrich Profile-Live rows with alias/program/production tokens for client fuzzy search.
 */
export type ProfileMediaRow = {
  alumniId?: string;
  kind?: string;
  fileId?: string;
  externalUrl?: string;
  uploadedAt?: string;
  isCurrent?: string | boolean; // sheet readers may return boolean true/false
  sortIndex?: string; // optional; if present, can break ties deterministically
};

function driveUrlFromId(id: string) {
  // More reliable than /thumbnail for returning an actual image/* response
  return `https://drive.google.com/uc?export=view&id=${encodeURIComponent(id)}`;
}


function withVersion(url: string, v?: string) {
  const raw = String(url || "").trim();
  if (!raw) return raw;

  const ver = String(v || "").trim();
  if (!ver) return raw;

  try {
    const u = new URL(raw);
    // Use a stable param name; Drive ignores it, but caches won’t.
    u.searchParams.set("v", ver);
    return u.toString();
  } catch {
    // If it's not a valid absolute URL, just return as-is.
    // (In your case it should be absolute, but this keeps it non-breaking.)
    return raw;
  }
}

function mediaKeysForRow(m: ProfileMediaRow): string[] {
  const keys = new Set<string>();

  const a = String(m.alumniId || "").trim();
  if (a) keys.add(a);

  // If your sheet sometimes stores slug in alumniId, also add normalized slug forms.
  // (This is harmless even if alumniId is numeric; normSlug("123") is still "123".)
  if (a) keys.add(normSlug(a));

  return Array.from(keys);
}

function pickBestHeadshot(media: ProfileMediaRow[] | undefined) {
  const kindIsHeadshot = (k?: unknown) => {
    const s = String(k ?? "")
      .trim()
      .toLowerCase()
      .replace(/[\s_-]+/g, " "); // normalize "head-shot" / "head_shot" / "head  shot"
    // Accept common variants
    return s === "headshot" || s === "head shot" || s.includes("headshot") || s.includes("head shot");
  };

  const rows = (media ?? []).filter((r) => kindIsHeadshot(r.kind));


  const parseTime = (s?: string) => {
    const t = Date.parse(String(s || ""));
    return Number.isFinite(t) ? t : 0;
  };

  const isTrue = (v?: string | boolean) => {
    if (v === true) return true;
    if (v === false) return false;

    const s = String(v ?? "").trim().toLowerCase();
    return s === "true" || s === "t" || s === "yes" || s === "y" || s === "1";
  };

    const parseSortIndex = (v?: string) => {
    const n = Number(String(v ?? "").trim());
    return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
  };

  if (!rows.length) return { upstreamUrl: "", cacheKey: "" };

  rows.sort((a, b) => {
    // 0) TRUE wins first (PRIMARY)
    const aCur = isTrue(a.isCurrent);
    const bCur = isTrue(b.isCurrent);
    if (aCur !== bCur) return aCur ? -1 : 1;

    // 1) newest uploadedAt wins (SECONDARY)
    const tA = parseTime(a.uploadedAt);
    const tB = parseTime(b.uploadedAt);
    if (tA !== tB) return tB - tA;

    // 2) if present, lower sortIndex wins (explicit manual quality ordering)
    const sA = parseSortIndex(a.sortIndex);
    const sB = parseSortIndex(b.sortIndex);
    if (sA !== sB) return sA - sB;

    // 3) prefer Drive uploads (fileId) over externalUrl
    const aHasFile = !!String(a.fileId || "").trim();
    const bHasFile = !!String(b.fileId || "").trim();
    if (aHasFile !== bHasFile) return aHasFile ? -1 : 1;

    // 4) stable deterministic fallback
    const aKey = String(a.fileId || a.externalUrl || "").trim();
    const bKey = String(b.fileId || b.externalUrl || "").trim();
    if (aKey !== bKey) return aKey.localeCompare(bKey);

    return 0;
  });

  const best = rows[0];

  const fileId = String(best.fileId || "").trim();
  const externalUrl = String(best.externalUrl || "").trim();
  const uploadedAt = String(best.uploadedAt || "").trim();

  const upstreamUrl = fileId ? driveUrlFromId(fileId) : externalUrl;
  const cacheKey = uploadedAt || fileId || externalUrl;

  return { upstreamUrl, cacheKey };
}

export async function enrichAlumniData(
  alumni: ProfileLiveRow[],
  profileMedia: ProfileMediaRow[] = []
): Promise<EnrichedProfileLiveRow[]> {
  const out: EnrichedProfileLiveRow[] = [];

  // ✅ Index Profile-Media rows by alumniId/slug-like key for fast lookup
  // Note: Profile-Live `alumniId` can be blank; we must also resolve by `slug`.
  const mediaByKey = new Map<string, ProfileMediaRow[]>();

  for (const m of profileMedia ?? []) {
    for (const k of mediaKeysForRow(m)) {
      const arr = mediaByKey.get(k) ?? [];
      arr.push(m);
      mediaByKey.set(k, arr);
    }
  }

  for (const item of alumni) {
    const aliasTokens = new Set<string>();
    const programTokens = new Set<string>();
    const productionTokens = new Set<string>();
    const festivalTokens = new Set<string>();
    const roleTokens = new Set<string>();
    const bioTokens = new Set<string>();
    const locationTokens = new Set<string>();
    const identityTokens = new Set<string>();
    const statusTokens = new Set<string>();

    // ✅ NEW
    const seasonTokens = new Set<string>();
    const languageTokens = new Set<string>();

    // ✅ Canonical slug + slug aliases (async)
    const canonicalSlug = await resolveCanonicalSlug(item.slug);
    const slugAliases = await getSlugAliases(canonicalSlug); // includes canonical

    // ✅ Resolve authoritative headshot from Profile-Media (most recent wins; prefers isCurrent=TRUE)
    // Profile-Media is keyed by alumniId, but many Profile-Live rows may have alumniId blank.
    // In your data, Profile-Media.alumniId often matches Profile-Live.slug (e.g. "jesse-baxter"),
    // so we fall back deterministically to slug/canonicalSlug when alumniId is missing.

    // Profile-Media is keyed by alumniId, but many Profile-Live rows may have alumniId blank.
    // In your data, Profile-Media.alumniId often matches Profile-Live.slug (e.g. "jesse-baxter"),
    // so we fall back deterministically to slug/canonicalSlug when alumniId is missing.
    const key1 = String(item.alumniId || "").trim();
    const key2 = String(item.slug || "").trim();
    const key3 = String(canonicalSlug || "").trim();

    const k1 = String(key1 || "").trim();
    const k2 = String(key2 || "").trim();
    const k3 = String(key3 || "").trim();

    const mediaRows: ProfileMediaRow[] =
      (k1 ? mediaByKey.get(k1) : undefined) ??
      (k1 ? mediaByKey.get(normSlug(k1)) : undefined) ??
      (k2 ? mediaByKey.get(k2) : undefined) ??
      (k2 ? mediaByKey.get(normSlug(k2)) : undefined) ??
      (k3 ? mediaByKey.get(k3) : undefined) ??
      (k3 ? mediaByKey.get(normSlug(k3)) : undefined) ??
      [];



    if (
  process.env.NODE_ENV === "development" &&
  process.env.DEBUG_HEADSHOT_SLUG &&
  normSlug(item.slug) === normSlug(process.env.DEBUG_HEADSHOT_SLUG)
) {
      devLog("[enrich] mediaRows (pre-pick):", mediaRows.map(r => ({
        kind: r.kind,
        isCurrent: r.isCurrent,
        fileId: r.fileId,
        externalUrl: r.externalUrl,
        uploadedAt: r.uploadedAt,
      })));
    }

    const resolvedHeadshot = pickBestHeadshot(mediaRows);
    if (process.env.NODE_ENV === "development") {
      devLog("[headshot-picker]", {
        slug: item.slug,
        alumniId: item.alumniId,
        canonicalSlug,
        mediaRowCount: mediaRows.length,
        picked: resolvedHeadshot,
        mediaRows: mediaRows.map((r) => ({
          kind: r.kind,
          isCurrent: r.isCurrent,
          fileId: r.fileId,
          externalUrl: r.externalUrl,
          uploadedAt: r.uploadedAt,
          sortIndex: r.sortIndex,
        })),
      });
    }

    if (
  process.env.NODE_ENV === "development" &&
  process.env.DEBUG_HEADSHOT_SLUG &&
  normSlug(item.slug) === normSlug(process.env.DEBUG_HEADSHOT_SLUG)
) {
      devLog("[enrich] picked headshot:", resolvedHeadshot);
    }

    // ✅ Cache key based on Profile-Media uploadedAt (or stable fallback)
    const resolvedHeadshotCacheKey =
      resolvedHeadshot.cacheKey ||
      String(item.updatedAt || item.currentHeadshotId || item.currentHeadshotUrl || "");

    // Fallback to Profile-Live only if Profile-Media has nothing usable
    const upstreamRaw = resolvedHeadshot.upstreamUrl || headshotUrlFrom(item) || "";

    // ✅ VERSION the upstream URL so caches can't serve stale bytes when headshot changes
    const upstream = upstreamRaw ? withVersion(upstreamRaw, resolvedHeadshotCacheKey) : "";

    // ✅ All UI must route through /api/img?url=...
    const resolvedHeadshotUrl = upstream
      ? `/api/img?url=${encodeURIComponent(upstream)}`
      : "/images/default-headshot.png";

    // Normalized slug set for joining against programMap/productionMap keys
    const aliasesNorm = new Set<string>();
    for (const s of slugAliases) {
      const n = normSlug(s);
      aliasesNorm.add(n);

      // Slug searchable in multiple ways
      aliasTokens.add(normalizeText(s)); // as text
      aliasTokens.add(n); // hyphen form
    }

    // ✅ Catch-all: include all Profile-Live fields into aliasTokens
    addProfileLiveTokens(aliasTokens, item);

    // ✅ Roles bucket (for scoring)
    for (const r of splitListish(item.roles)) addPhraseTokens(roleTokens, r);

    // ✅ Location bucket (for scoring)
    addPhraseTokens(locationTokens, item.location);

    // ✅ Bio bucket (for scoring)
    addPhraseTokens(bioTokens, item.bioShort);
    addPhraseTokens(bioTokens, item.bioLong);
    addPhraseTokens(bioTokens, item.spotlight);
    addPhraseTokens(bioTokens, item.currentWork);

    // ✅ Identity bucket (for scoring) — treat tags as identity-ish for now
    for (const t of splitListish(item.tags)) addPhraseTokens(identityTokens, t);

    // ✅ Status bucket (for scoring)
    for (const s of splitListish(item.statusFlags))
      addPhraseTokens(statusTokens, s);
    addPhraseTokens(statusTokens, item.status);
    addPhraseTokens(statusTokens, item.isPublic);

    // ✅ Language tokens (from new Profile-Live header; tags fallback)
    addLanguageTokens(languageTokens, item.languages);
    // fallback: some people may put "Spanish" in tags
    addLanguageTokens(languageTokens, item.tags);

    /** ✅ Programs (alias-aware join via normSlug) */
    for (const key in programMap) {
      const prog = programMap[key] as any;
      const artists = prog.artists || {};

      const hit = Object.keys(artists).some((artistSlug) =>
        aliasesNorm.has(normSlug(artistSlug))
      );

      if (hit) {
        // season tokens derived from numeric season using seasonData
        addSeasonFromNumber(seasonTokens, prog.season);

        if (prog.title) programTokens.add(normalizeText(prog.title));
        if (prog.program) programTokens.add(normalizeText(prog.program));
        if (prog.location) programTokens.add(normalizeText(prog.location));
        if (prog.year) addYearishTokens(programTokens, prog.year);
        if (prog.season) addYearishTokens(programTokens, prog.season);

        if (prog.program && prog.location)
          programTokens.add(
            normalizeText(`${prog.program} ${prog.location}`)
          );
        if (prog.program && prog.year)
          addYearishTokens(programTokens, `${prog.program} ${prog.year}`);
        if (prog.program && prog.season)
          addYearishTokens(programTokens, `${prog.program} ${prog.season}`);

        // Feed into catch-all too
        if (prog.title) addPhraseTokens(aliasTokens, prog.title);
        if (prog.program) addPhraseTokens(aliasTokens, prog.program);
        if (prog.location) addPhraseTokens(aliasTokens, prog.location);
        if (prog.year) addYearishTokens(aliasTokens, prog.year);
        if (prog.season) addYearishTokens(aliasTokens, prog.season);

        // Feed season info into catch-all too (so people can search "Season 18")
        addPhraseTokens(aliasTokens, `season-${Number(prog.season)}`);
        addPhraseTokens(aliasTokens, `season ${Number(prog.season)}`);
      }
    }

    /** ✅ Productions (alias-aware join via normSlug) */
    for (const key in productionMap) {
      const prod = productionMap[key] as any;
      const artists = prod.artists || {};

      const hit = Object.keys(artists).some((artistSlug) =>
        aliasesNorm.has(normSlug(artistSlug))
      );

      if (hit) {
        addSeasonFromNumber(seasonTokens, prod.season);

        if (prod.title) productionTokens.add(normalizeText(prod.title));
        if (prod.location) productionTokens.add(normalizeText(prod.location));
        if (prod.year) addYearishTokens(productionTokens, prod.year);
        if (prod.season) addYearishTokens(productionTokens, prod.season);

        if (prod.title && prod.location)
          productionTokens.add(
            normalizeText(`${prod.title} ${prod.location}`)
          );
        if (prod.title && prod.year)
          addYearishTokens(productionTokens, `${prod.title} ${prod.year}`);
        if (prod.title && prod.season)
          addYearishTokens(productionTokens, `${prod.title} ${prod.season}`);

        if (prod.festival) {
          productionTokens.add(normalizeText(prod.festival));
          prod.festival
            .split(/[:—-]/)
            .map((frag: string) => normalizeText(frag))
            .filter(Boolean)
            .forEach((p: string) => festivalTokens.add(p));
        }

        // Feed into catch-all too
        if (prod.title) addPhraseTokens(aliasTokens, prod.title);
        if (prod.location) addPhraseTokens(aliasTokens, prod.location);
        if (prod.year) addYearishTokens(aliasTokens, prod.year);
        if (prod.season) addYearishTokens(aliasTokens, prod.season);
        if (prod.festival) addPhraseTokens(aliasTokens, prod.festival);

        addPhraseTokens(aliasTokens, `season-${Number(prod.season)}`);
        addPhraseTokens(aliasTokens, `season ${Number(prod.season)}`);
      }
    }

    // Optional: expand some fields into word tokens for better matching
    tokenize(item.bioShort).forEach((t: string) => bioTokens.add(t));
    tokenize(item.bioLong).forEach((t: string) => bioTokens.add(t));
    tokenize(item.currentWork).forEach((t: string) => bioTokens.add(t));
    tokenize(item.location).forEach((t: string) => locationTokens.add(t));

    out.push({
      ...item,
      canonicalSlug,

      /**
       * ✅ Authoritative headshot for all UI (already proxied or default).
       * Do NOT overwrite Profile-Live’s currentHeadshotId/currentHeadshotUrl.
       */
      headshotUrl: resolvedHeadshotUrl,
      headshotCacheKey: resolvedHeadshotCacheKey,

      aliasTokens: Array.from(aliasTokens),
      programTokens: Array.from(programTokens),
      productionTokens: Array.from(productionTokens),
      festivalTokens: Array.from(festivalTokens),
      roleTokens: Array.from(roleTokens),
      bioTokens: Array.from(bioTokens),
      locationTokens: Array.from(locationTokens),
      identityTokens: Array.from(identityTokens),
      statusTokens: Array.from(statusTokens),

      // ✅ NEW
      seasonTokens: Array.from(seasonTokens),
      languageTokens: Array.from(languageTokens),
    });
  }

  return out;
}
