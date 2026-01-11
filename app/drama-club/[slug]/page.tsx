// app/drama-club/[slug]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { dramaClubs } from "@/lib/dramaClubMap";
import type { DramaClub } from "@/lib/dramaClubMap";
import DramaClubPageTemplate from "@/components/drama/DramaClubPageTemplate";

import { loadRoleAssignments } from "@/lib/loadRoleAssignments";
import {
  buildDramaClubLeadTeam,
  type PersonRef,
} from "@/lib/buildDramaClubLeadTeam";
import { loadVisibleAlumni } from "@/lib/loadAlumni";

import {
  programMap,
  type ProgramData,
  type ProgramFootprint,
} from "@/lib/programMap";

type PageProps = {
  // ✅ Next 15 “sync dynamic APIs” fix:
  // params is now a Promise in server components routes
  params: Promise<{ slug: string }>;
};

export const runtime = "nodejs";
export const revalidate = 3600;

const DEBUG_DRAMA_CLUB = process.env.DEBUG_DRAMA_CLUB === "1";

function getDramaClubBySlug(slug: string): DramaClub | undefined {
  return dramaClubs.find((club) => club.slug === slug);
}

/* ------------------ Metadata ------------------ */

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;

  const club = getDramaClubBySlug(slug);

  if (!club) {
    return {
      title: "Drama Club | Dramatic Adventure Theatre",
      description:
        "Explore Drama Clubs created with Dramatic Adventure Theatre and community partners around the world.",
    };
  }

  return {
    title: `${club.name} Drama Club | Dramatic Adventure Theatre`,
    description:
      club.shortBlurb ||
      club.description ||
      `Learn more about the ${club.name} Drama Club and the young artists creating theatre in ${
        club.city || club.region || club.country || "their community"
      }.`,
  };
}

/* ------------------ Static params (SSG) ------------------ */

export function generateStaticParams() {
  return dramaClubs.map((club) => ({
    slug: club.slug,
  }));
}

function buildPeopleById(rows: unknown[]): Record<string, PersonRef> {
  const out: Record<string, PersonRef> = {};

  for (const raw of rows as Array<Record<string, unknown>>) {
    const profileId = String(
      raw.profileId ?? raw["Profile ID"] ?? raw.slug ?? ""
    ).trim();
    if (!profileId) continue;

    const name = String(raw.name ?? raw["Name"] ?? "").trim();
    if (!name) continue;

    const slug = String(raw.slug ?? "").trim();
    const profileUrl = String(raw.profileUrl ?? raw["Profile URL"] ?? "").trim();
    const artistUrl = String(raw.artistUrl ?? raw["Artist URL"] ?? "").trim();

    const href = slug ? `/alumni/${slug}` : profileUrl || artistUrl || undefined;

    const headshotUrl = String(
      raw.headshotUrl ??
        raw["Headshot URL"] ??
        raw.avatarSrc ??
        raw["Avatar Src"] ??
        raw.photoUrl ??
        raw["Photo URL"] ??
        ""
    ).trim();

    const avatarSrc = headshotUrl
      ? headshotUrl.replace(/^http:\/\//i, "https://")
      : "/images/default-headshot.png";

    out[profileId] = { name, href, avatarSrc };
  }

  return out;
}

/**
 * ✅ programMap uses artist slugs as keys.
 * Build a lookup keyed by alumni slug so we can resolve name + href + avatar.
 */
function buildPeopleBySlug(rows: unknown[]): Record<string, PersonRef> {
  const out: Record<string, PersonRef> = {};

  for (const raw of rows as Array<Record<string, unknown>>) {
    const slug = String(raw.slug ?? "").trim();
    if (!slug) continue;

    const name = String(raw.name ?? raw["Name"] ?? "").trim();
    if (!name) continue;

    const profileUrl = String(raw.profileUrl ?? raw["Profile URL"] ?? "").trim();
    const artistUrl = String(raw.artistUrl ?? raw["Artist URL"] ?? "").trim();

    // ✅ Fix: don’t use `"/alumni/..." || ...` (it always wins)
    const href = `/alumni/${slug}` || profileUrl || artistUrl || undefined;

    const headshotUrl = String(
      raw.headshotUrl ??
        raw["Headshot URL"] ??
        raw.avatarSrc ??
        raw["Avatar Src"] ??
        raw.photoUrl ??
        raw["Photo URL"] ??
        ""
    ).trim();

    const avatarSrc = headshotUrl
      ? headshotUrl.replace(/^http:\/\//i, "https://")
      : "/images/default-headshot.png";

    out[slug.toLowerCase()] = { name, href, avatarSrc };
  }

  return out;
}

/** More robust debug matching (don’t rely on “includes(slug)”). */
function normalizeClubKey(s: string) {
  return (s ?? "")
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\/[^/]+/i, "")
    .replace(/^\/?drama-?club\/?/i, "")
    .replace(/-?drama-?club$/i, "")
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

function logLeadTeamDebug(input: {
  clubSlug: string;
  alumniRowsCount: number;
  roleAssignmentsCount: number;
  peopleById: Record<string, PersonRef>;
  roleAssignments: Array<{
    profileId: string;
    roleCode: string;
    scopeType: string;
    scopeKey: string;
    startDate?: string;
    endDate?: string;
    showOnProfile?: boolean;
  }>;
  creativeLeadTeam: PersonRef[];
}) {
  if (!DEBUG_DRAMA_CLUB) return;

  const {
    clubSlug,
    alumniRowsCount,
    roleAssignmentsCount,
    peopleById,
    roleAssignments,
    creativeLeadTeam,
  } = input;

  const clubKey = normalizeClubKey(clubSlug);

  const clubAny = roleAssignments.filter((a) => {
    const st = String(a.scopeType ?? "").toUpperCase();
    if (st !== "CLUB") return false;
    return normalizeClubKey(String(a.scopeKey ?? "")) === clubKey;
  });

  const clubTAIR = clubAny.filter(
    (a) => String(a.roleCode ?? "").toUpperCase() === "TAIR"
  );

  const missingPeople = clubAny
    .map((a) => String(a.profileId ?? "").trim())
    .filter(Boolean)
    .filter((pid) => !peopleById[pid]);

  // eslint-disable-next-line no-console
  console.log("\n=== DEBUG_DRAMA_CLUB ===");
  // eslint-disable-next-line no-console
  console.log("slug:", clubSlug);
  // eslint-disable-next-line no-console
  console.log("clubKey:", clubKey);
  // eslint-disable-next-line no-console
  console.log("alumni rows:", alumniRowsCount);
  // eslint-disable-next-line no-console
  console.log("role assignments:", roleAssignmentsCount);

  // eslint-disable-next-line no-console
  console.log("club assignments (CLUB exact match):", clubAny.length);
  if (clubAny.length) {
    // eslint-disable-next-line no-console
    console.log("club assignments sample:", clubAny.slice(0, 5));
  }

  // eslint-disable-next-line no-console
  console.log("club TAIR rows:", clubTAIR.length);
  if (clubTAIR.length) {
    // eslint-disable-next-line no-console
    console.log("TAIR rows:", clubTAIR);
  }

  if (missingPeople.length) {
    // eslint-disable-next-line no-console
    console.log(
      "⚠️ missing peopleById for profileIds:",
      Array.from(new Set(missingPeople))
    );
  } else {
    // eslint-disable-next-line no-console
    console.log("peopleById coverage for club assignments: OK");
  }

  // eslint-disable-next-line no-console
  console.log(
    "creativeLeadTeam:",
    creativeLeadTeam.map((p) => ({
      name: p.name,
      profileId: (p as any).profileId,
      subtitle: (p as any).subtitle,
      href: (p as any).href,
      avatarSrc: (p as any).avatarSrc,
    }))
  );
  // eslint-disable-next-line no-console
  console.log("=== /DEBUG_DRAMA_CLUB ===\n");
}

/* ------------------ Program → club matching (Artist Lineage) ------------------ */

const norm = (v?: string) => (v ?? "").trim().toLowerCase();

/** geo normalization: strip diacritics/punct/extra spaces for safer matching */
function normGeo(v?: string) {
  const s = (v ?? "").trim().toLowerCase();
  if (!s) return "";
  return s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // diacritics
    .replace(/&/g, "and")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/** allow exact OR “contains either way” (useful for "Amazon" vs "Amazon Shuar Territory") */
function geoMatches(a?: string, b?: string) {
  const A = normGeo(a);
  const B = normGeo(b);
  if (!A || !B) return false;
  if (A === B) return true;
  return A.includes(B) || B.includes(A);
}

function clubRegion(club: DramaClub): string {
  return String((club as any).region ?? "").trim();
}
function clubCity(club: DramaClub): string {
  return String((club as any).city ?? "").trim();
}

function footprintMatchesClub(club: DramaClub, fp: ProgramFootprint): boolean {
  if (!fp?.country) return false;
  if (norm(fp.country) !== norm(club.country)) return false;

  const r = (fp.region ?? "").trim();
  const c = (fp.city ?? "").trim();

  // City is “most specific”: if footprint city is present, require a match (but allow contains)
  if (c) {
    const clubC = clubCity(club);
    if (!clubC) return false;
    if (!geoMatches(c, clubC)) return false;
  }

  // Region: if footprint region is present, require match (but allow contains)
  if (r) {
    const clubR = clubRegion(club);
    if (!clubR) return false;
    if (!geoMatches(r, clubR)) return false;
  }

  return true;
}

function inferCountryForProgram(
  club: DramaClub,
  prog: ProgramData
): string | undefined {
  const explicit = (prog.country ?? "").trim();
  if (explicit) return explicit;

  // 80/20 fallback: if location mentions the country (e.g. "Esmeraldas, Ecuador" or "Slovakia")
  const loc = (prog.location ?? "").trim();
  if (!loc || !club.country) return undefined;

  const locL = loc.toLowerCase();
  const countryL = club.country.toLowerCase();

  if (locL === countryL) return club.country;
  if (locL.includes(countryL)) return club.country;

  return undefined;
}

function programMatchesClubSimple(club: DramaClub, prog: ProgramData): boolean {
  const pCountry = inferCountryForProgram(club, prog);
  if (!pCountry) return false;
  if (norm(pCountry) !== norm(club.country)) return false;

  const pCity = (prog.city ?? "").trim();
  if (pCity) {
    const cCity = clubCity(club);
    if (!cCity) return false;
    if (!geoMatches(pCity, cCity)) return false;
  }

  const cRegion = clubRegion(club);
  const pRegion = (prog.region ?? "").trim();

  if (cRegion) {
    // If program region is specified, must match. If missing, treat as ALL REGIONS.
    if (pRegion && !geoMatches(pRegion, cRegion)) return false;
  }

  return true;
}

function buildLineageArtistsForClub(opts: {
  club: DramaClub;
  peopleBySlug: Record<string, PersonRef>;
}) {
  const { club, peopleBySlug } = opts;

  const roleMap = new Map<string, Set<string>>();
  const matchedPrograms: Array<{ key: string; title: string }> = [];
  const missingSlugs = new Set<string>();

  const addArtist = (slug: string, roles: string[] | undefined) => {
    const s = (slug ?? "").trim().toLowerCase();
    if (!s) return;

    const set = roleMap.get(s) ?? new Set<string>();
    for (const r of roles ?? []) {
      const rr = String(r ?? "").trim();
      if (rr) set.add(rr);
    }
    roleMap.set(s, set);
  };

  for (const [key, prog] of Object.entries(programMap)) {
    if (!prog) continue;

    // 1) footprints mode
    if (Array.isArray(prog.footprints) && prog.footprints.length > 0) {
      const matching = prog.footprints.filter((fp) =>
        footprintMatchesClub(club, fp)
      );
      if (!matching.length) continue;

      matchedPrograms.push({ key, title: prog.title });

      for (const fp of matching) {
        const artistsModel =
          fp.artists && Object.keys(fp.artists).length ? fp.artists : prog.artists;

        for (const [slug, roles] of Object.entries(artistsModel ?? {})) {
          addArtist(slug, roles);
        }
      }
      continue;
    }

    // 2) simple mode
    if (!programMatchesClubSimple(club, prog)) continue;

    matchedPrograms.push({ key, title: prog.title });

    for (const [slug, roles] of Object.entries(prog.artists ?? {})) {
      addArtist(slug, roles);
    }
  }

  const out: PersonRef[] = [];

  for (const [slug, rolesSet] of roleMap.entries()) {
    const person = peopleBySlug[slug];
    if (!person?.name) {
      missingSlugs.add(slug);
      continue; // don’t guess names (accuracy > completeness)
    }

    const subtitle = Array.from(rolesSet).join(", ").trim();

    out.push({
      ...person,
      ...(subtitle ? { subtitle } : {}),
      ...(slug ? ({ profileId: slug } as any) : {}),
    });
  }

  // stable display order
  out.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

  if (DEBUG_DRAMA_CLUB) {
    // eslint-disable-next-line no-console
    console.log("\n=== DEBUG_DRAMA_CLUB LINEAGE ===");
    // eslint-disable-next-line no-console
    console.log("club:", club.slug, "|", club.name);
    // eslint-disable-next-line no-console
    console.log("club geo:", {
      country: club.country,
      region: clubRegion(club),
      city: clubCity(club),
    });
    // eslint-disable-next-line no-console
    console.log(
      "matched programs:",
      matchedPrograms.length,
      matchedPrograms.slice(0, 12)
    );
    // eslint-disable-next-line no-console
    console.log("lineage artists:", out.length);
    if (missingSlugs.size) {
      // eslint-disable-next-line no-console
      console.log(
        "⚠️ lineage slugs missing in alumni dataset:",
        Array.from(missingSlugs).slice(0, 40)
      );
    }
    // eslint-disable-next-line no-console
    console.log("=== /DEBUG_DRAMA_CLUB LINEAGE ===\n");
  }

  return out;
}

/* ------------------ Page ------------------ */

export default async function DramaClubPage({ params }: PageProps) {
  const { slug } = await params;

  const club = getDramaClubBySlug(slug);

  if (!club) {
    return notFound();
  }

  const heroTextureTagline =
    club.heroTextureTagline ??
    [club.region, club.country].filter(Boolean).join(" • ");

  const whatHappensCopy = club.whatHappens ?? club.description;
  const localContext = club.localContext ?? club.originStory;

  const sponsorLink = `/cause/drama-clubs?club=${encodeURIComponent(club.slug)}`;

  const [alumniRows, roleAssignments] = await Promise.all([
    loadVisibleAlumni(),
    loadRoleAssignments(),
  ]);

  const peopleById = buildPeopleById(alumniRows as unknown[]);
  const peopleBySlug = buildPeopleBySlug(alumniRows as unknown[]);

  const creativeLeadTeam = buildDramaClubLeadTeam(
    club,
    roleAssignments,
    peopleById
  );

  const lineageArtists = buildLineageArtistsForClub({
    club,
    peopleBySlug,
  });

  logLeadTeamDebug({
    clubSlug: club.slug,
    alumniRowsCount: Array.isArray(alumniRows) ? alumniRows.length : 0,
    roleAssignmentsCount: Array.isArray(roleAssignments)
      ? roleAssignments.length
      : 0,
    peopleById,
    roleAssignments: roleAssignments.map((a: any) => ({
      profileId: String(a?.profileId ?? ""),
      roleCode: String(a?.roleCode ?? ""),
      scopeType: String(a?.scopeType ?? ""),
      scopeKey: String(a?.scopeKey ?? ""),
      startDate: a?.startDate,
      endDate: a?.endDate,
      showOnProfile: a?.showOnProfile,
    })),
    creativeLeadTeam,
  });

  return (
    <DramaClubPageTemplate
      club={club}
      allClubs={dramaClubs}
      heroTextureTagline={heroTextureTagline}
      whatHappensCopy={whatHappensCopy}
      localContext={localContext}
      sponsorLink={sponsorLink}
      artistProgramsLink="/programs"
      backToIndexHref="/drama-club"
      dramaClubLeadTeam={creativeLeadTeam}
      // ✅ THIS is what makes the marquee draw from programMap
      lineageArtists={lineageArtists}
    />
  );
}
