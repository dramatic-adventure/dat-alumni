// lib/fundraisingCampaigns.ts
/**
 * Reusable DAT Fundraising Campaign Engine — config types, registry, and helpers.
 *
 * HOW TO ADD A CAMPAIGN:
 *   1. Create a campaign config object below (or in a separate file under /campaigns/)
 *   2. Add it to CAMPAIGN_REGISTRY with its stable slug as the key
 *   3. Deploy — the route at /campaign/[slug] picks it up automatically
 *
 * IMPORTANT:
 *   - Never hardcode campaign-specific data in reusable components
 *   - All linked content blocks hide cleanly when their array is empty/absent
 *   - The `id` field MUST match the Stripe contextId for live totals to work
 */

/* ------------------------------------------------------------------ */
/* Status                                                              */
/* ------------------------------------------------------------------ */

export type CampaignStatus =
  | "active"     // accepting donations, full UI
  | "ended"      // deadline passed, show archive state, no give panel
  | "archived";  // older ended campaign, minimal display

/* ------------------------------------------------------------------ */
/* Linked content types (all optional — hide cleanly when absent)      */
/* ------------------------------------------------------------------ */

export type CampaignStretchGoal = {
  amount: number;         // same currency as goalAmount
  title: string;
  description: string;
};

export type CampaignUpdate = {
  id: string;
  date: string;           // "YYYY-MM-DD"
  title: string;
  body: string;
  authorName?: string;
  authorRole?: string;
};

export type CampaignTestimonial = {
  id: string;
  quote: string;
  name: string;
  role?: string;
  imageUrl?: string;      // /public path or absolute URL
};

export type CampaignLinkedAlumnus = {
  slug: string;
  name: string;
  role?: string;
  imageUrl?: string;
};

export type CampaignLinkedDramaClub = {
  slug: string;
  name: string;
  country: string;
  city?: string;
};

export type CampaignLinkedProduction = {
  slug: string;
  title: string;
  imageUrl?: string;
  year?: number;
};

export type CampaignLinkedEvent = {
  id: string;
  title: string;
  date: string;           // "YYYY-MM-DD"
  venue: string;
  city: string;
  country: string;
  ticketUrl?: string;
};

export type CampaignLinkedStory = {
  slug: string;
  title: string;
  teaser?: string;
};

export type CampaignGalleryItem = {
  src: string;
  alt: string;
  caption?: string;
};

/* ------------------------------------------------------------------ */
/* Core campaign config                                                */
/* ------------------------------------------------------------------ */

export type FundraisingCampaign = {
  // ── Identity ───────────────────────────────────────────────────────
  /** Stable kebab-case slug — used in URL /campaign/[slug] AND in Stripe/Prisma as contextId */
  id: string;
  status: CampaignStatus;

  // ── Hero ───────────────────────────────────────────────────────────
  title: string;
  eyebrow?: string;         // e.g. "Artist Fundraising Campaign"
  tagline: string;          // short punchy editorial headline
  heroCopy: string;         // longer paragraph shown in the story section
  heroImage: string;        // /public path
  heroImageFocus?: string;  // CSS background-position hint
  heroImageCredit?: string;

  // ── Goal ───────────────────────────────────────────────────────────
  goalAmount: number;       // in whole currency units (e.g. 12000 = $12,000)
  currency?: string;        // default "usd"

  // ── Deadline ───────────────────────────────────────────────────────
  deadline?: string;        // "YYYY-MM-DD" — drives countdown + ended state

  // ── Match ──────────────────────────────────────────────────────────
  matchActive?: boolean;
  matchDescription?: string;  // e.g. "All gifts matched 1:1 through April 30"
  matchCap?: number;          // optional cap amount

  // ── Giving ─────────────────────────────────────────────────────────
  giveAmounts: number[];      // preset amounts displayed as buttons
  defaultAmount?: number;     // pre-selected amount
  allowMonthly?: boolean;     // default false — campaign donations typically one-time

  // ── Stretch goals ──────────────────────────────────────────────────
  stretchGoals?: CampaignStretchGoal[];

  // ── Linked content (all optional — hidden cleanly when absent) ─────
  alumni?: CampaignLinkedAlumnus[];
  dramaClubs?: CampaignLinkedDramaClub[];
  productions?: CampaignLinkedProduction[];
  events?: CampaignLinkedEvent[];
  stories?: CampaignLinkedStory[];
  testimonials?: CampaignTestimonial[];
  gallery?: CampaignGalleryItem[];

  // ── Campaign updates ───────────────────────────────────────────────
  updates?: CampaignUpdate[];

  // ── Links ──────────────────────────────────────────────────────────
  learnMoreUrl?: string;    // primary external "learn more" link
  secondaryUrl?: string;    // lower-priority contextual link

  // ── Archive state ──────────────────────────────────────────────────
  archiveHeadline?: string;
  archiveSummary?: string;
  archiveImage?: string;

  // ── Analytics ──────────────────────────────────────────────────────
  utmCampaign?: string;     // defaults to campaign.id
};

/* ------------------------------------------------------------------ */
/* Campaign registry                                                   */
/* ------------------------------------------------------------------ */

// Import individual campaign configs here:
import { passageSlovakia2026 } from "@/campaigns/passage-slovakia-2026";

const CAMPAIGN_REGISTRY: Record<string, FundraisingCampaign> = {
  [passageSlovakia2026.id]: passageSlovakia2026,
};

export function getCampaign(slug: string): FundraisingCampaign | null {
  return CAMPAIGN_REGISTRY[slug] ?? null;
}

export function getAllCampaignSlugs(): string[] {
  return Object.keys(CAMPAIGN_REGISTRY);
}

/* ------------------------------------------------------------------ */
/* Shared helpers                                                      */
/* ------------------------------------------------------------------ */

/** Format a minor-unit amount (cents) as a human currency string: $12,000 */
export function formatCurrencyMinor(amountMinor: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amountMinor / 100));
}

/** Format a whole-unit amount (dollars) as a human currency string: $12,000 */
export function formatCurrency(amount: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Compute progress percentage (0–100, capped at 100) */
export function campaignProgress(raisedMinor: number, goalAmount: number): number {
  if (goalAmount <= 0) return 0;
  const pct = (raisedMinor / 100 / goalAmount) * 100;
  return Math.min(100, Math.max(0, pct));
}

/** Return the active stretch goal based on raised amount, if any */
export function activeStretchGoal(
  stretchGoals: CampaignStretchGoal[] | undefined,
  raisedMinor: number
): CampaignStretchGoal | null {
  if (!stretchGoals || stretchGoals.length === 0) return null;
  const raised = raisedMinor / 100;
  // Return the lowest stretch goal that hasn't been hit yet
  return stretchGoals.find((g) => raised < g.amount) ?? null;
}

/** Days remaining until deadline (0 if past) */
export function daysUntilDeadline(deadline: string | undefined): number | null {
  if (!deadline) return null;
  const now = new Date();
  const end = new Date(deadline + "T23:59:59");
  const ms = end.getTime() - now.getTime();
  if (ms <= 0) return 0;
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}
