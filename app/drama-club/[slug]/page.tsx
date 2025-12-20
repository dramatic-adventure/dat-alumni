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
  // ✅ await params in Next 15
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

    // ✅ be generous with upstream headshot keys (prevents silent missing avatars)
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
      profileId: p.profileId,
      subtitle: p.subtitle,
      href: p.href,
      avatarSrc: p.avatarSrc,
    }))
  );
  // eslint-disable-next-line no-console
  console.log("=== /DEBUG_DRAMA_CLUB ===\n");
}

/* ------------------ Page ------------------ */

export default async function DramaClubPage({ params }: PageProps) {
  // ✅ await params in Next 15
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
  const creativeLeadTeam = buildDramaClubLeadTeam(
    club,
    roleAssignments,
    peopleById
  );

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
    />
  );
}
