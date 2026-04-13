// app/api/campaign/[slug]/totals/route.ts
/**
 * GET /api/campaign/[slug]/totals
 *
 * Returns live donation totals for a given campaign. Used by the CampaignGiveWidget
 * for periodic client-side refresh of the progress bar and supporter wall.
 *
 * Returns { raisedMinor, donorCount, recentSupporters } or 404 for unknown campaigns.
 */

import { NextResponse } from "next/server";
import { getCampaign } from "@/lib/fundraisingCampaigns";
import { getCampaignTotals } from "@/lib/getCampaignTotals";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const campaign = getCampaign(slug);
  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  const totals = await getCampaignTotals(campaign.id);
  return NextResponse.json(totals, {
    headers: { "Cache-Control": "no-store" },
  });
}
