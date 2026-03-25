// app/donate/page.tsx
import DonationPageTemplate from "@/components/donate/DonationPageTemplate";
import { getDonationCampaign } from "@/lib/donations";
import type { DonationModeId, DonationFrequency } from "@/lib/donations";
import { getActiveProductions } from "@/lib/getActiveProductions";
import { getActiveSpecialProjects } from "@/lib/specialProjects";
import type { DramaClubCauseCategory } from "@/lib/causes";
import { CAUSE_CATEGORIES_BY_ID } from "@/lib/causes";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const MODE_IDS: DonationModeId[] = [
  "drama-club",
  "artist",
  "new-work",
  "new-work-specific",
  "special-project",
  "special-project-specific",
  "cause",
  "general",
];

function getString(
  sp: Record<string, string | string[] | undefined>,
  key: string
): string | undefined {
  const v = sp[key];
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v[0];
  return undefined;
}

function asModeId(v?: string): DonationModeId | undefined {
  if (!v) return undefined;
  return (MODE_IDS as string[]).includes(v) ? (v as DonationModeId) : undefined;
}

function asFrequency(v?: string): DonationFrequency | undefined {
  if (v === "monthly" || v === "one_time") return v;
  return undefined;
}

function asCauseCategory(v?: string): DramaClubCauseCategory | undefined {
  if (!v) return undefined;
  // runtime-safe check without fighting TS index types
  return Object.prototype.hasOwnProperty.call(CAUSE_CATEGORIES_BY_ID, v)
    ? (v as DramaClubCauseCategory)
    : undefined;
}

export default async function DonatePage({ searchParams }: PageProps) {
  const sp = await searchParams;

  const club = getString(sp, "club");
  const production = getString(sp, "production");
  const project = getString(sp, "project");
  const tier = getString(sp, "tier");

  const causeCategory = asCauseCategory(getString(sp, "cause"));

  // If mode is not provided, infer it from context (keeps links dead simple)
  const explicitMode = asModeId(getString(sp, "mode"));
  const inferredMode: DonationModeId =
    explicitMode ??
    (production ? "new-work-specific" : undefined) ??
    (project ? "special-project-specific" : undefined) ??
    (club ? "drama-club" : undefined) ??
    (causeCategory ? "cause" : undefined) ??
    "general";

  const activeProductions = getActiveProductions();
  const activeSpecialProjects = getActiveSpecialProjects();

  const campaign = getDonationCampaign({
    mode: inferredMode,
    causeCategory,
    clubSlug: club,
    productionSlug: production,
    specialProjectId: project,
    activeProductions,
    activeSpecialProjects,
  });

  const freq = asFrequency(getString(sp, "freq")) ?? campaign.defaultFrequency;

  return (
    <DonationPageTemplate
      campaign={campaign}
      initial={{
        mode: inferredMode,
        frequency: freq,
        club,
        cause: causeCategory,
        production,
        project,
        tier,
      }}
      activeProductions={activeProductions}
      activeSpecialProjects={activeSpecialProjects}
    />
  );
}
