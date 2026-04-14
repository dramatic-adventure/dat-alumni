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
import {
  CURRENT_SEASON_NUMBER,
  CURRENT_SEASON_LABEL,
  CURRENT_SEASON_YEARS,
  CURRENT_SEASON_PROGRAMS,
  CURRENT_SEASON_PROGRAM_COUNT,
  YEARS_OF_WORK,
  CLUB_COUNT,
  COUNTRY_COUNT,
} from "@/lib/datStats";

const _seasonFraming = `${CURRENT_SEASON_PROGRAM_COUNT} active programs in ${CURRENT_SEASON_LABEL}. ${CLUB_COUNT}+ partner communities across ${COUNTRY_COUNT} countries. ${YEARS_OF_WORK} years of relationship-based theatre — and still going.`;

export const sponsorTheStory: FundraisingCampaign = {
  // ── Identity ──────────────────────────────────────────────────────
  id: "sponsor-the-story",
  status: "active",
  evergreen: true,

  // ── Hero ──────────────────────────────────────────────────────────
  title: "Sponsor the Story",
  eyebrow: `Annual Fund · ${CURRENT_SEASON_LABEL}`,
  tagline: `${YEARS_OF_WORK} years of community theatre. Keep the door open.`,
  heroCopy:
    `DAT has been making theatre in communities around the world for ${YEARS_OF_WORK} years — not for audiences, but with the people who live there. The work is relationship-based, residency-driven, and deeply relational. It doesn't happen without ongoing investment.\n\n${CURRENT_SEASON_LABEL} includes ${CURRENT_SEASON_PROGRAM_COUNT} active programs: ${CURRENT_SEASON_PROGRAMS.join(", ")}. Each one depends on a base of sustained support that goes beyond any single campaign.\n\nSponsoring the Story means becoming a recurring part of that investment. Your monthly or annual gift sustains the full scope of DAT's work — the residencies, the partnerships, the artist development, and the community programs that don't fit neatly into a single campaign.\n\nThis is not about one trip or one show. It is about keeping the conditions for honest, community-embedded theatre alive. Your gift does that.`,
  heroImage: "/images/teaching-amazon.jpg",
  heroImageFocus: "center top",

  // ── Goal ──────────────────────────────────────────────────────────
  // Annual operating support goal. No deadline — renews each year.
  goalAmount: 50000,
  currency: "usd",

  // ── Season framing ────────────────────────────────────────────────
  seasonNumber: CURRENT_SEASON_NUMBER,
  seasonLabel: CURRENT_SEASON_LABEL,
  seasonYears: CURRENT_SEASON_YEARS,
  seasonPrograms: CURRENT_SEASON_PROGRAMS,
  seasonFraming: _seasonFraming,

  // ── Giving ────────────────────────────────────────────────────────
  giveAmounts: [25, 50, 100, 250, 500],       // fallback
  monthlyAmounts: [10, 25, 50, 100, 250],     // lower threshold for recurring
  oneTimeAmounts: [50, 100, 250, 500, 1000],  // higher threshold for one-time
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
    { amount: 10, description: "Covers supplies for one drama club session in a partner community", icon: "✏️" },
    { amount: 25, description: "Supports one artist's preparation session for a community residency", icon: "🎭" },
    { amount: 50, description: "Funds one day of ongoing drama club work", icon: "🎨" },
    { amount: 100, description: "Covers materials and space for a full community workshop", icon: "🌍" },
    { amount: 250, description: "Sustains a community drama program for one month", icon: "⭐" },
    { amount: 500, description: "Enables DAT to keep a long-term residency partnership active", icon: "🤝" },
  ],

  // ── Links ─────────────────────────────────────────────────────────
  learnMoreUrl: "https://dramaticadventure.com",
  ambassadorUrl: "https://dramaticadventure.com",

  // ── Archive state ─────────────────────────────────────────────────
  archiveHeadline: "The annual fund never closes.",
  archiveSummary: "Support for DAT's ongoing work is always welcome.",

  // ── Labels ────────────────────────────────────────────────────────
  dramaClubsCtaLabel: "Sponsor the Story",

  // ── Progress label ────────────────────────────────────────────────
  // Honest label: this is YTD giving, not all-time cumulative.
  progressLabel: "raised this year",

  // ── Analytics ─────────────────────────────────────────────────────
  utmCampaign: "sponsor-the-story",

  // ── Frequency-aware impact copy ────────────────────────────────────
  monthlyImpactCopy:
    "Your monthly gift keeps drama alive in communities where it wouldn't otherwise exist — sustaining residencies, workshops, and partnerships every single month.",
  oneTimeImpactCopy:
    "Your gift goes directly into the field — artist fees, travel, materials, and the community infrastructure that makes this work real.",
};
