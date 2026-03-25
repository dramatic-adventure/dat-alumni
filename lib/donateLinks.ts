import type { DonationFrequency, DonationModeId } from "@/lib/donations";

type DonateLinkParams = {
  mode: DonationModeId;
  freq?: DonationFrequency;
  club?: string;
  production?: string;
  project?: string;
  cause?: string; // "category" or "category::subcategory"
  tier?: string;
};

export function getDonateHref(params: DonateLinkParams) {
  const qp = new URLSearchParams();

  qp.set("mode", params.mode);

  if (params.freq) qp.set("freq", params.freq);
  if (params.club) qp.set("club", params.club);
  if (params.production) qp.set("production", params.production);
  if (params.project) qp.set("project", params.project);
  if (params.cause) qp.set("cause", params.cause);
  if (params.tier) qp.set("tier", params.tier);

  const qs = qp.toString();
  return `/donate${qs ? `?${qs}` : ""}`;
}

export const donateForClub = (clubSlug: string) =>
  getDonateHref({ mode: "drama-club", club: clubSlug });

export const donateForProduction = (productionSlug: string) =>
  getDonateHref({ mode: "new-work", production: productionSlug });

export const donateForProject = (projectId: string) =>
  getDonateHref({ mode: "special-project", project: projectId });
