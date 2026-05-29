// lib/projectArchive.ts
//
// Server-side data assembly for the archived project pages
// (/projects/[slug] and /projects/[slug]/recap).
//
// "Automate everything derivable, curate only the irreducible": this module
// pulls together everything derivable from existing data (roster, clubs,
// causes, campaign totals, tagged productions/stories, ripples, sibling
// projects) and folds in the curated narrative. Sections with no data come
// back empty so the pages can hide them gracefully.

import { programMap, type ProgramData } from "@/lib/programMap";
import { loadVisibleAlumni } from "@/lib/loadAlumni";
import type { AlumniRow } from "@/lib/types";
import { dramaClubs, type DramaClubDraft } from "@/lib/dramaClubMap";
import {
  CAUSE_CATEGORIES_BY_ID,
  type DramaClubCauseCategory,
} from "@/lib/causes";
import { productionMap, getSortYear, type Production } from "@/lib/productionMap";
import { getProductionPath } from "@/lib/getProductionPath";
import { stories as allStories, type Story } from "@/lib/stories";
import { loadRipples, type Ripple } from "@/lib/ripples";
import {
  getCampaign,
  type FundraisingCampaign,
} from "@/lib/fundraisingCampaigns";
import { getCampaignTotals, type CampaignTotals } from "@/lib/getCampaignTotals";
import {
  projectNarratives,
  resolveProjectEssence,
  type ProjectNarrative,
} from "@/lib/projectNarratives";
import { resolveProjectHeroImage } from "@/lib/projectHeroImage";
import { familySlug } from "@/lib/projectFamily";

/** A category-level cause derived from the project's drama clubs. */
export type ProjectCause = {
  id: DramaClubCauseCategory;
  label: string;
  shortLabel: string;
  href: string;
  color: string;
};

export type ProjectRosterMember = {
  slug: string;
  name: string;
  roles: string;
  headshotUrl?: string;
};

export type ProjectClub = {
  slug: string;
  name: string;
  location: string;
  heroImage?: string;
  causeLabel?: string;
  href: string;
};

export type ProjectProduction = {
  slug: string;
  title: string;
  subtitle: string;
  posterUrl?: string;
  href: string;
};

export type ProjectStory = {
  slug: string;
  title: string;
  teaser?: string;
  heroImage?: string;
  href: string;
};

export type ProjectThreadEntry = {
  slug: string;
  title: string;
  year: number | string;
  href: string;
};

export type ProjectArchiveData = {
  slug: string;
  program: ProgramData;
  family: string;
  familyLabel: string;
  seasonLabel: string;
  seasonHref: string;
  familyHref?: string;
  recruitingUrl?: string;
  heroImage: string;
  essence?: string;
  narrative?: ProjectNarrative;
  // Stats inputs
  artistCount: number;
  footprintCount: number;
  regionLabel: string; // "Regions" | "Region" | "Country"
  regionSub: string;
  clubCount: number;
  // Sections
  roster: ProjectRosterMember[];
  clubs: ProjectClub[];
  causes: ProjectCause[];
  productions: ProjectProduction[];
  legacyStories: ProjectStory[];
  ripples: Ripple[];
  thread: ProjectThreadEntry[];
  // Campaign
  campaign: FundraisingCampaign | null;
  campaignTotals: CampaignTotals | null;
  campaignConcluded: boolean;
};

// Cause-category → accent color (DAT palette).
const CATEGORY_COLOR: Record<DramaClubCauseCategory, string> = {
  "indigenous-sovereignty-rights": "#3b6d11",
  "climate-justice-biodiversity-environmental-protection": "#2493a9",
  "youth-empowerment-mental-health-wellbeing": "#2493a9",
  "education-access-equity-opportunity": "#7b4fa6",
  "social-justice-human-rights-equity": "#3b6d11",
  "community-wellbeing-safety-resilience": "#F23359",
  "arts-culture-storytelling-representation": "#F23359",
};

function familyLabel(program?: string, location?: string): string {
  return [program, location].filter(Boolean).join(": ");
}

function clubLocation(club: DramaClubDraft): string {
  if (club.location) return club.location;
  return [club.city, club.region, club.country].filter(Boolean).join(", ");
}

function clubCauseLabel(club: DramaClubDraft): string | undefined {
  const first = club.causes?.[0];
  if (!first) return undefined;
  return CAUSE_CATEGORIES_BY_ID[first.category]?.shortLabel;
}

/** Apply campaign demo totals when no real donations exist yet (matches /campaign). */
function withDemoTotals(
  campaign: FundraisingCampaign,
  totals: CampaignTotals
): CampaignTotals {
  if (
    campaign.demoTotals &&
    totals.raisedMinor === 0 &&
    totals.donorCount === 0
  ) {
    return {
      raisedMinor: campaign.demoTotals.raisedMinor,
      donorCount: campaign.demoTotals.donorCount,
      recentSupporters: (campaign.demoTotals.recentSupporters ?? []).map((s) => ({
        name: s.name,
        amountMinor: s.amountMinor,
        currency: s.currency,
        createdAt: s.createdAt,
      })),
    };
  }
  return totals;
}

export async function getProjectArchiveData(
  slug: string
): Promise<ProjectArchiveData | null> {
  const program = programMap[slug];
  if (!program) return null;

  // ── Roster (resolved against visible alumni) ──
  const alumni: AlumniRow[] = await loadVisibleAlumni();
  const alumniMap = new Map(alumni.map((a) => [a.slug, a]));
  const artistSlugs = Object.keys(program.artists || {});
  const roster: ProjectRosterMember[] = artistSlugs
    .map((s) => {
      const alum = alumniMap.get(s);
      if (!alum) return null;
      return {
        slug: alum.slug,
        name: alum.name,
        roles: program.artists?.[s]?.join(", ") || alum.role,
        headshotUrl: alum.headshotUrl,
      } satisfies ProjectRosterMember;
    })
    .filter(Boolean) as ProjectRosterMember[];

  // ── Drama clubs (in partnership) ──
  const clubSlugs = program.dramaClubSlugs ?? [];
  const clubs: ProjectClub[] = clubSlugs
    .map((cs) => dramaClubs.find((c) => c.slug === cs))
    .filter((c): c is DramaClubDraft => Boolean(c))
    .map((c) => ({
      slug: c.slug,
      name: c.name,
      location: clubLocation(c),
      heroImage: c.heroImage,
      causeLabel: clubCauseLabel(c),
      href: `/drama-club/${c.slug}`,
    }));

  // ── Causes (inherited from clubs, deduped by category) ──
  const seen = new Set<DramaClubCauseCategory>();
  const causes: ProjectCause[] = [];
  for (const cs of clubSlugs) {
    const club = dramaClubs.find((c) => c.slug === cs);
    for (const cause of club?.causes ?? []) {
      if (seen.has(cause.category)) continue;
      seen.add(cause.category);
      const meta = CAUSE_CATEGORIES_BY_ID[cause.category];
      if (!meta) continue;
      causes.push({
        id: cause.category,
        label: meta.label,
        shortLabel: meta.shortLabel ?? meta.label,
        href: `/cause/${cause.category}`,
        color: CATEGORY_COLOR[cause.category] ?? "#7b4fa6",
      });
    }
  }

  // ── Productions tagged to this project ("The Work") ──
  const productions: ProjectProduction[] = Object.values(productionMap)
    .filter((p: Production) => p.projectSlugs?.includes(slug))
    .sort((a, b) => getSortYear(b) - getSortYear(a))
    .map((p) => ({
      slug: p.slug,
      title: p.title,
      subtitle: [p.festival || p.venue, p.location].filter(Boolean).join(" · "),
      posterUrl: p.posterUrl,
      href: getProductionPath(p),
    }));

  // ── Stories tagged to this project ("What It Left Behind") ──
  const legacyStories: ProjectStory[] = allStories
    .filter((s: Story) => s.projectSlugs?.includes(slug))
    .map((s) => ({
      slug: s.slug,
      title: s.title,
      teaser: s.teaser,
      heroImage: s.heroImage ?? s.thumbnail,
      href: `/story/${s.slug}`,
    }));

  // ── Ripples (win-only; empty until the pipeline is wired) ──
  const ripples = await loadRipples({ projectSlug: slug });

  // ── The Thread (sibling projects in the same family) ──
  const thread: ProjectThreadEntry[] = Object.entries(programMap)
    .filter(([s, d]) => d.program === program.program && s !== slug)
    .sort((a, b) => Number(b[1].year) - Number(a[1].year))
    .map(([s, d]) => ({
      slug: s,
      title: d.title,
      year: d.year,
      href: `/projects/${s}`,
    }));

  // ── Campaign (matched by slug == campaign id) ──
  const campaign = getCampaign(slug);
  let campaignTotals: CampaignTotals | null = null;
  let campaignConcluded = false;
  if (campaign) {
    const raw = await getCampaignTotals(campaign.id);
    campaignTotals = withDemoTotals(campaign, raw);
    campaignConcluded =
      campaign.status === "ended" || campaign.status === "archived";
  }

  // ── Family link: only link the program eyebrow when the family has 2+
  // projects (a single-project family page is too thin to be worth a link). ──
  const famSlug = familySlug(program.program);
  const familyProjectCount = Object.values(programMap).filter(
    (p) => familySlug(p.program) === famSlug
  ).length;
  const familyHref =
    familyProjectCount >= 2 ? `/projects/program/${famSlug}` : undefined;

  // ── Stats inputs ──
  const footprintCount = program.footprints?.length ?? 0;
  let regionLabel = "Country";
  let regionSub = program.country ?? program.location ?? "";
  if (footprintCount > 0) {
    regionLabel = footprintCount === 1 ? "Region" : "Regions";
    regionSub = `across ${program.country ?? program.location ?? ""}`.trim();
  }

  return {
    slug,
    program,
    family: program.program,
    familyLabel: familyLabel(program.program, program.location),
    seasonLabel: `Season ${program.season}`,
    seasonHref: `/season/${program.season}`,
    // Program eyebrow → the family archive (only when 2+ projects exist;
    // see familyHref above). NOT program.url, which points at non-existent
    // /passage etc.
    familyHref,
    recruitingUrl: program.externalUrl || program.url,
    heroImage: resolveProjectHeroImage(slug, program.season),
    essence: resolveProjectEssence(slug, program.program),
    narrative: projectNarratives[slug],
    artistCount: artistSlugs.length,
    footprintCount,
    regionLabel,
    regionSub,
    clubCount: clubs.length,
    roster,
    clubs,
    causes,
    productions,
    legacyStories,
    ripples,
    thread,
    campaign,
    campaignTotals,
    campaignConcluded,
  };
}
