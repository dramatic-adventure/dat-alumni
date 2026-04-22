// app/campaign/[slug]/page.tsx
/**
 * Fundraising campaign page — server component.
 *
 * Fetches campaign config from the registry and live donation totals from Prisma,
 * then renders the CampaignTemplate with both sets of data.
 *
 * Revalidates every 60 seconds so the progress bar and supporter wall stay
 * fresh without a full dynamic render on every request.
 *
 * DEMO TOTALS: If a campaign has demoTotals configured and no real donations
 * have arrived yet (raisedMinor === 0 && donorCount === 0), the demo totals
 * are used as a preview state so the full UI is visible during setup.
 */

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCampaign, getAllCampaignSlugs } from "@/lib/fundraisingCampaigns";
import { getCampaignTotals } from "@/lib/getCampaignTotals";
import type { CampaignTotals } from "@/lib/getCampaignTotals";
import CampaignTemplate from "@/components/campaign/CampaignTemplate";
import { resolveCampaignLinkedContent } from "@/lib/resolveCampaignLinkedContent";
import { campaignLinkedContentResolvers } from "@/lib/campaignLinkedContentResolvers";

export const revalidate = 60; // ISR — refresh totals every 60s

/* ------------------------------------------------------------------ */
/* Static params                                                       */
/* ------------------------------------------------------------------ */

export async function generateStaticParams() {
  return getAllCampaignSlugs().map((slug) => ({ slug }));
}

/* ------------------------------------------------------------------ */
/* Metadata                                                            */
/* ------------------------------------------------------------------ */

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const campaign = getCampaign(slug);
  if (!campaign) return {};

  return {
    title: `${campaign.title} | Dramatic Adventure Theatre`,
    description: campaign.tagline,
    openGraph: {
      title: campaign.title,
      description: campaign.tagline,
      images: campaign.heroImage ? [{ url: campaign.heroImage }] : [],
    },
  };
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default async function CampaignPage({ params }: PageProps) {
  const { slug } = await params;
  const campaign = getCampaign(slug);
  if (!campaign) notFound();

  let totals: CampaignTotals = await getCampaignTotals(campaign.id);

  // Apply demo totals when no real donations exist yet and a demo is configured.
  // This lets the full UI — match banner, supporter wall, updates, stretch goals — be
  // visible during setup without compromising production data integrity.
  if (
    campaign.demoTotals &&
    totals.raisedMinor === 0 &&
    totals.donorCount === 0
  ) {
    totals = {
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

  const resolvedCampaign = await resolveCampaignLinkedContent(
    campaign,
    campaignLinkedContentResolvers
  );

  return <CampaignTemplate campaign={resolvedCampaign} totals={totals} />;
}
