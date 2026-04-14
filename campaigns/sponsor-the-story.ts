// campaigns/sponsor-the-story.ts
/**
 * Sponsor the Story — evergreen annual-fund campaign.
 *
 * This campaign is always open. No deadline, no match pressure.
 * It is the "always on" giving option for donors who want to support
 * DAT's ongoing work beyond any single production or residency.
 *
 * Marked evergreen: true so the hub page renders it in the
 * "Annual Support" section rather than the time-limited active grid.
 *
 * The hub page handles evergreen campaigns differently:
 *   - No deadline / days-left display
 *   - Compact horizontal card, lower visual hierarchy than active campaigns
 *   - Monthly giving emphasized over one-time
 */

import type { FundraisingCampaign } from "@/lib/fundraisingCampaigns";

export const sponsorTheStory: FundraisingCampaign = {
  // ── Identity ──────────────────────────────────────────────────────
  id: "sponsor-the-story",
  status: "active",
  evergreen: true,

  // ── Hero ──────────────────────────────────────────────────────────
  title: "Sponsor the Story",
  eyebrow: "Annual Fund",
  tagline: "Sustain the work. Keep the door open.",
  heroCopy:
    "DAT has been making theatre in communities around the world for more than two decades — not for audiences, but with the people who live there. The work is relationship-based, residency-driven, and deeply relational. It doesn't happen without ongoing investment.\n\nSponsoring the Story means becoming a recurring part of that investment. Your monthly or annual gift sustains the full scope of DAT's work: the residencies, the partnerships, the artist development, and the community programs that don't fit neatly into a single campaign.\n\nThis is not about one trip or one show. It is about keeping the conditions for honest, community-embedded theatre alive. Your gift does that.",
  heroImage: "/images/teaching-amazon.jpg",
  heroImageFocus: "center top",

  // ── Goal ──────────────────────────────────────────────────────────
  // Annual operating support goal. No deadline — renews each year.
  goalAmount: 50000,
  currency: "usd",

  // ── Giving ────────────────────────────────────────────────────────
  giveAmounts: [25, 50, 100, 250, 500],
  defaultAmount: 50,
  allowMonthly: true,

  // ── Donor callout ─────────────────────────────────────────────────
  donorCallout:
    "This is the work that happens before the curtain goes up — and long after. Your gift keeps it going.",

  // ── Share ─────────────────────────────────────────────────────────
  shareText:
    "I support DAT's ongoing storytelling work — community theatre that goes to where the story lives. Join me:",

  // ── Gift impact ────────────────────────────────────────────────────
  giftImpact: [
    { amount: 25, description: "Supports one artist's preparation session for a community residency", icon: "✏️" },
    { amount: 50, description: "Funds one day of ongoing drama club work in a partner community", icon: "🎭" },
    { amount: 100, description: "Covers materials and space for a full community workshop", icon: "🎨" },
    { amount: 250, description: "Sustains a community drama program for one month", icon: "🌍" },
    { amount: 500, description: "Enables DAT to keep a long-term residency partnership active", icon: "⭐" },
  ],

  // ── Links ─────────────────────────────────────────────────────────
  learnMoreUrl: "https://dramaticadventure.com",
  ambassadorUrl: "https://dramaticadventure.com",

  // ── Archive state ─────────────────────────────────────────────────
  archiveHeadline: "The annual fund never closes.",
  archiveSummary: "Support for DAT's ongoing work is always welcome.",

  // ── Labels ────────────────────────────────────────────────────────
  dramaClubsCtaLabel: "Sponsor the Story",

  // ── Analytics ─────────────────────────────────────────────────────
  utmCampaign: "sponsor-the-story",
};
