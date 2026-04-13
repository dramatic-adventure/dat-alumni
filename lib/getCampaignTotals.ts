// lib/getCampaignTotals.ts
/**
 * Server-side helper: query live donation totals for a fundraising campaign.
 *
 * Uses the existing Prisma + SQLite setup. Works by filtering DonationPayment
 * and RecurringGift records where contextType = "campaign" and contextId = campaignId.
 *
 * This matches the Stripe checkout route's context resolution logic exactly:
 * when a campaign give widget posts to /api/stripe/checkout with only a
 * campaignSlug (no club/production/project/cause), the checkout sets
 * contextType = "campaign" and contextId = campaignSlug automatically.
 */

import { prisma, ContextType } from "@/lib/prisma";

export type CampaignTotals = {
  /** Total raised in minor units (cents). 0 when no donations yet. */
  raisedMinor: number;
  /** Number of distinct successful donations (not deduped by donor). */
  donorCount: number;
  /** Up to 10 most recent successful supporters (for the wall). */
  recentSupporters: Array<{
    name: string | null;
    amountMinor: number;
    currency: string;
    createdAt: Date;
  }>;
};

export async function getCampaignTotals(campaignId: string): Promise<CampaignTotals> {
  try {
    const whereClause = {
      contextType: ContextType.campaign,
      contextId: campaignId,
      status: "succeeded" as const,
    };

    const [aggregate, recent] = await Promise.all([
      prisma.donationPayment.aggregate({
        where: whereClause,
        _sum: { amountMinor: true },
        _count: { id: true },
      }),
      prisma.donationPayment.findMany({
        where: whereClause,
        select: {
          donorName: true,
          amountMinor: true,
          currency: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    // Also sum active recurring gifts (monthly donors count too)
    const recurringAggregate = await prisma.recurringGift.aggregate({
      where: {
        contextType: ContextType.campaign,
        contextId: campaignId,
        status: "active",
      },
      _sum: { amountMinor: true },
      _count: { id: true },
    });

    const raisedMinor =
      (aggregate._sum.amountMinor ?? 0) +
      (recurringAggregate._sum.amountMinor ?? 0);

    const donorCount =
      (aggregate._count.id ?? 0) + (recurringAggregate._count.id ?? 0);

    return {
      raisedMinor,
      donorCount,
      recentSupporters: recent.map((r) => ({
        name: r.donorName,
        amountMinor: r.amountMinor,
        currency: r.currency,
        createdAt: r.createdAt,
      })),
    };
  } catch (err) {
    // Graceful degradation: return zeros rather than breaking the page
    console.error("[getCampaignTotals] Prisma query failed:", err);
    return { raisedMinor: 0, donorCount: 0, recentSupporters: [] };
  }
}
