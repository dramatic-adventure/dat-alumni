// lib/buildPastVisitingArtistsForClub.ts

import type { DramaClub, PersonRef } from "@/lib/dramaClubMap";

/**
 * “Program-like” shape so we don't couple hard to Program typing
 * (keeps this helper resilient if programMap evolves).
 *
 * Supports:
 * - NEW model:
 *    - program.artists: Record<slug, roles[]>
 *    - program.footprints: [{ country, region?, city?, artists?: Record<slug, roles[]> }]
 * - LEGACY model (still supported):
 *    - visitingArtists / artists: PersonRef[]
 *    - visitingArtistsByRegion / artistsByRegion: Record<region, PersonRef[]>
 */
type ArtistsLike = Record<string, string[]> | PersonRef[] | undefined;

type FootprintLike = {
  country?: string;
  region?: string;
  city?: string;

  /**
   * NEW: optional subset of artists for this footprint.
   * If omitted => assume ALL program artists apply to this footprint.
   */
  artists?: Record<string, string[]> | PersonRef[];
};

type ProgramLike = {
  slug?: string;

  // “simple” structured geo (optional convenience)
  country?: string;
  region?: string;
  city?: string;

  // legacy free-form geo (back-compat / migration)
  location?: string;

  // NEW canonical master list (recommended)
  artists?: ArtistsLike;

  // NEW complex routing
  footprints?: FootprintLike[];

  // LEGACY support
  visitingArtists?: PersonRef[];
  visitingArtistsByRegion?: Record<string, PersonRef[]>;
  artistsByRegion?: Record<string, PersonRef[]>;
};

type ClubLike = Pick<DramaClub, "country" | "region" | "relatedProgramSlugs"> & {
  city?: string;
};

function clean(s?: string): string | undefined {
  const t = (s ?? "").trim();
  return t ? t : undefined;
}

function normalizeKey(s: string): string {
  return String(s || "").trim().toLowerCase();
}

/** Name key used ONLY for de-duping / comparisons (unicode-safe). */
function nameKey(s: string): string {
  return String(s || "")
    .normalize("NFC")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .trim();
}

function personKey(p: PersonRef): string {
  const href = (p as any)?.href as string | undefined;
  const h = clean(href);
  if (h) return `href:${normalizeKey(h)}`;
  return `name:${nameKey((p as any)?.name || "")}`;
}

/**
 * Normalizes “slug-ish” inputs that sometimes come in as:
 * - "john-doe"
 * - "/alumni/john-doe"
 * - "alumni/john-doe"
 * - "john-doe?x=y"
 * - "john-doe#anchor"
 */
function normalizeArtistSlug(raw: string): string {
  let s = String(raw || "").trim();
  if (!s) return "";

  // drop query/hash
  s = s.split(/[?#]/)[0] || "";

  // strip leading slashes
  s = s.replace(/^\/+/, "");

  // strip any leading "alumni/"
  if (s.toLowerCase().startsWith("alumni/")) {
    s = s.slice("alumni/".length);
  }

  // if caller passed a full-ish path, take last segment
  const parts = s.split("/").filter(Boolean);
  s = parts.length ? parts[parts.length - 1] : s;

  // try decode (best-effort)
  try {
    s = decodeURIComponent(s);
  } catch {
    // ignore
  }

  return s.trim();
}

function slugToDisplayName(slug: string): string {
  const s = clean(slug) ?? "";
  if (!s) return "Visiting Artist";
  return s
    .split("/")
    .pop()!
    .split(/[?#]/)[0]
    .replace(/[-_]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function countryMatches(programCountry: string, clubCountry: string): boolean {
  const p = normalizeKey(programCountry);
  const c = normalizeKey(clubCountry);

  if (p === c) return true;

  // Helps migration cases like "Esmeraldas, Ecuador" matching "Ecuador"
  if (p.includes(c)) return true;
  if (c.includes(p)) return true;

  return false;
}

/**
 * Region logic:
 * - If clubRegion is set:
 *    - If program/footprint region is set: must match
 *    - If program/footprint region is missing: treat as "ALL REGIONS" => include
 * - If clubRegion missing: match only by country (include regardless of program region)
 */
function regionMatches(programRegion?: string, clubRegion?: string): boolean {
  const p = clean(programRegion);
  const c = clean(clubRegion);

  if (!c) return true; // club has no region => don't filter by region
  if (!p) return true; // program has no region => "ALL REGIONS"
  return normalizeKey(p) === normalizeKey(c);
}

/**
 * City logic:
 * - If footprint/program city is set: require club city match
 * - If footprint/program city missing: do not filter by city
 *
 * (City is only meant for truly city-specific projects.)
 */
function cityMatches(programCity?: string, clubCity?: string): boolean {
  const p = clean(programCity);
  if (!p) return true;

  const c = clean(clubCity);
  if (!c) return false;

  return normalizeKey(p) === normalizeKey(c);
}

function isPersonRefArray(x: unknown): x is PersonRef[] {
  return Array.isArray(x);
}

function isRolesMap(x: unknown): x is Record<string, string[]> {
  return !!x && !Array.isArray(x) && typeof x === "object";
}

/** Case-insensitive get for legacy byRegion maps. */
function getByRegionCI<T>(
  byRegion: Record<string, T>,
  wantRegion?: string
): T | undefined {
  const want = clean(wantRegion);
  if (!want) return undefined;
  const wantKey = normalizeKey(want);

  for (const k of Object.keys(byRegion)) {
    if (normalizeKey(k) === wantKey) return byRegion[k];
  }
  return undefined;
}

/**
 * LEGACY: choose artists when a program is split by region using PersonRef lists.
 */
function pickLegacyArtistsForClubRegion(
  program: ProgramLike,
  clubRegion?: string
): PersonRef[] {
  const byRegion =
    program.visitingArtistsByRegion ?? program.artistsByRegion ?? undefined;

  if (byRegion && Object.keys(byRegion).length) {
    const match = getByRegionCI(byRegion, clubRegion);
    if (match && Array.isArray(match) && match.length) return match;

    // Club region not present => flatten as “all regions”
    return Object.values(byRegion).flat().filter(Boolean);
  }

  // ✅ bulletproof: never assume program.artists is an array here
  const legacyList = program.visitingArtists?.length
    ? program.visitingArtists
    : isPersonRefArray(program.artists)
    ? (program.artists as PersonRef[])
    : [];

  return legacyList.filter(Boolean);
}

/**
 * Extract “master” artists for the program:
 * - NEW: program.artists is a roles map => use slug keys
 * - LEGACY: program.visitingArtists / program.artists as PersonRef[]
 */
function getProgramMasterArtists(program: ProgramLike): ArtistsLike {
  if (program.visitingArtists?.length) return program.visitingArtists;

  const a = program.artists;
  if (a && (isPersonRefArray(a) || isRolesMap(a))) return a;

  return undefined;
}

/** Slug lookup that tolerates caller passing mixed-cased keys. */
function getPersonRefBySlug(
  personBySlug: Record<string, PersonRef> | undefined,
  slug: string
): PersonRef | undefined {
  if (!personBySlug) return undefined;

  const raw = normalizeArtistSlug(slug);
  if (!raw) return undefined;

  const n = normalizeKey(raw);
  return (
    personBySlug[n] ??
    personBySlug[raw] ??
    personBySlug[raw.toLowerCase()] ??
    personBySlug[n.toLowerCase()]
  );
}

/**
 * Build and dedupe PersonRefs from a mix of:
 * - direct PersonRef[] (legacy)
 * - slug->roles[] maps (new)
 *
 * IMPORTANT:
 * - If we cannot resolve a slug to a PersonRef, we still emit a graceful PersonRef.
 * - For roles maps, we preserve roles (roles[] + subtitle/role string) so UI can render tags.
 */
function pushArtistsIntoOutput(
  artistsLike: ArtistsLike,
  personBySlug: Record<string, PersonRef> | undefined,
  seen: Set<string>,
  out: PersonRef[],
  exclude?: {
    hrefSet: Set<string>;
    nameSet: Set<string>;
  }
) {
  if (!artistsLike) return;

  const isExcluded = (p: PersonRef) => {
    const href = clean((p as any)?.href as string | undefined);
    if (href && exclude?.hrefSet.has(normalizeKey(href))) return true;
    const nm = clean((p as any)?.name as string | undefined);
    if (nm && exclude?.nameSet.has(nameKey(nm))) return true;
    return false;
  };

  // LEGACY: already PersonRef[]
  if (isPersonRefArray(artistsLike)) {
    for (const p of artistsLike) {
      if (!p?.name) continue;
      if (isExcluded(p)) continue;

      const key = personKey(p);
      if (seen.has(key)) continue;
      seen.add(key);

      out.push(p);
    }
    return;
  }

  // NEW: Record<slug, roles[]>
  if (isRolesMap(artistsLike)) {
    for (const rawSlug of Object.keys(artistsLike)) {
      const slug = normalizeArtistSlug(rawSlug);
      if (!slug) continue;

      const rolesRaw = artistsLike[rawSlug];
      const roles = Array.isArray(rolesRaw)
        ? rolesRaw.map((r) => String(r).trim()).filter(Boolean)
        : [];

      const roleLabel = roles.length ? roles.join(", ") : "Visiting artist";

      const resolved = getPersonRefBySlug(personBySlug, slug);

      // Build a ref, preserving any resolved fields, but ensuring we keep role info
      const base: any =
        resolved?.name
          ? resolved
          : {
              name: slugToDisplayName(slug),
              slug,
              href: `/alumni/${encodeURIComponent(slug)}`,
            };

      // Attach role info in a way that won’t trip excess property checks
      const ref = {
        ...base,
        // common fields your UI already checks: subtitle / role / roles
        subtitle: (base.subtitle ?? roleLabel) as string,
        role: (base.role ?? roleLabel) as string,
        roles: (base.roles ?? roles) as string[],
      } as PersonRef;

      if (!ref?.name) continue;
      if (isExcluded(ref)) continue;

      const key = personKey(ref);
      if (seen.has(key)) continue;
      seen.add(key);

      out.push(ref);
    }
  }
}

/**
 * Compute the matching footprints for a club.
 * If program has footprints => use them.
 * Else treat the program itself as a single implied footprint.
 */
function getMatchingFootprintsForClub(
  program: ProgramLike,
  club: ClubLike
): FootprintLike[] {
  const clubCountry = clean(club.country);
  if (!clubCountry) return [];

  const clubRegion = clean(club.region);
  const clubCity = clean(club.city);

  const footprints = (program.footprints ?? []).filter(Boolean);
  if (footprints.length) {
    return footprints.filter((fp) => {
      const fpCountry = clean(fp.country);
      if (!fpCountry) return false;

      if (!countryMatches(fpCountry, clubCountry)) return false;
      if (!regionMatches(fp.region, clubRegion)) return false;
      if (!cityMatches(fp.city, clubCity)) return false;

      return true;
    });
  }

  // No footprints => implied single footprint based on program-level geo
  const pCountry = clean(program.country) ?? clean(program.location);
  if (!pCountry) return [];

  if (!countryMatches(pCountry, clubCountry)) return [];

  if (!regionMatches(program.region, clubRegion)) return [];
  if (!cityMatches(program.city, clubCity)) return [];

  return [
    {
      country: pCountry,
      region: clean(program.region),
      city: clean(program.city),
    },
  ];
}

/**
 * Rules (NEW + LEGACY):
 * - Prefer footprint routing when present.
 * - Country must match (footprints can be multi-country).
 * - Region:
 *    - If club.region exists, a footprint/program region must match if set.
 *    - If footprint/program region is missing => “ALL REGIONS” in that country.
 * - City:
 *    - If footprint/program city is set => must match club.city.
 * - Artist source:
 *    - If matching footprint has `artists` => use that subset
 *    - Else => use program master list (`program.artists` / `program.visitingArtists`)
 * - Explicit `club.relatedProgramSlugs`:
 *    - Adds those programs as candidates even if country/region logic fails,
 *      but we STILL try to match footprints first; if none match, we fall back
 *      to the program’s master list.
 *
 * OPTIONAL:
 * - excludePeople: lets the caller exclude (e.g., Lead Team) at source.
 */
export function buildPastVisitingArtistsForClub(
  club: ClubLike,
  programMap: Record<string, ProgramLike>,
  personBySlug?: Record<string, PersonRef>,
  excludePeople?: PersonRef[]
): PersonRef[] {
  const clubCountry = clean(club.country);
  if (!clubCountry) return [];

  const exclude = (() => {
    const hrefSet = new Set<string>();
    const nameSet = new Set<string>();

    for (const p of excludePeople ?? []) {
      const href = clean((p as any)?.href as string | undefined);
      if (href) hrefSet.add(normalizeKey(href));

      const nm = clean((p as any)?.name as string | undefined);
      if (nm) nameSet.add(nameKey(nm));
    }

    return { hrefSet, nameSet };
  })();

  // Build a normalized index so explicit slugs work regardless of exact keys
  const programByKey = new Map<string, ProgramLike>();
  for (const [key, program] of Object.entries(programMap)) {
    const a = normalizeKey(key);
    const b = normalizeKey(program.slug || key);
    programByKey.set(a, program);
    programByKey.set(b, program);
    if (program.slug) programByKey.set(normalizeKey(program.slug), program);
  }

  const explicitSlugs = new Set(
    (club.relatedProgramSlugs ?? [])
      .filter(Boolean)
      .map((s) => normalizeKey(String(s)))
  );

  type Candidate = { keySlug: string; program: ProgramLike };
  const candidates: Candidate[] = [];
  const seenPrograms = new Set<string>();

  // 1) Default candidates: anything whose country matches
  for (const [key, program] of Object.entries(programMap)) {
    const pCountry = clean(program.country) ?? clean(program.location);
    if (!pCountry) continue;

    if (!countryMatches(pCountry, clubCountry)) continue;

    const keySlug = normalizeKey(program.slug || key);
    if (seenPrograms.has(keySlug)) continue;
    seenPrograms.add(keySlug);
    candidates.push({ keySlug, program });
  }

  // 2) Explicit overrides: add even if geo doesn’t match
  for (const slug of explicitSlugs) {
    const p = programByKey.get(slug);
    if (!p) continue;

    const keySlug = normalizeKey(p.slug || slug);
    if (seenPrograms.has(keySlug)) continue;
    seenPrograms.add(keySlug);
    candidates.push({ keySlug, program: p });
  }

  // 3) Collect + dedupe artists (preserve first-seen order)
  const seenArtists = new Set<string>();
  const out: PersonRef[] = [];

  for (const { keySlug, program } of candidates) {
    const matches = getMatchingFootprintsForClub(program, club);

    if (matches.length) {
      for (const fp of matches) {
        const sourceArtists =
          (fp.artists as ArtistsLike) ?? getProgramMasterArtists(program);

        if (!sourceArtists) {
          const legacy = pickLegacyArtistsForClubRegion(program, club.region);
          pushArtistsIntoOutput(legacy, personBySlug, seenArtists, out, exclude);
          continue;
        }

        pushArtistsIntoOutput(
          sourceArtists,
          personBySlug,
          seenArtists,
          out,
          exclude
        );
      }
      continue;
    }

    // If no footprints matched:
    // - If this program is an explicit override, include the master list anyway.
    // - Otherwise: skip
    const isExplicit = explicitSlugs.has(keySlug);

    if (isExplicit) {
      const master = getProgramMasterArtists(program);
      if (master) {
        pushArtistsIntoOutput(master, personBySlug, seenArtists, out, exclude);
      } else {
        const legacy = pickLegacyArtistsForClubRegion(program, club.region);
        pushArtistsIntoOutput(legacy, personBySlug, seenArtists, out, exclude);
      }
    }
  }

  return out;
}
