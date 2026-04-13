// app/campaign/[slug]/page.tsx
/**
 * Fundraising campaign page — server component.
 *
 * Fetches campaign config from the registry and live donation totals from Prisma,
 * then renders the CampaignTemplate with both sets of data.
 *
 * Revalidates every 60 seconds so the progress bar and supporter wall stay
 * fresh without a full dynamic render on every request.
 */

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCampaign, getAllCampaignSlugs } from "@/lib/fundraisingCampaigns";
import { getCampaignTotals } from "@/lib/getCampaignTotals";
import CampaignTemplate from "@/components/campaign/CampaignTemplate";

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

  const totals = await getCampaignTotals(campaign.id);

  return <CampaignTemplate campaign={campaign} totals={totals} />;
}
