// lib/donations.ts
/**
 * Canonical donation architecture for Dramatic Adventure Theatre (DAT).
 *
 * Goals:
 * - One clean, data-driven “donation engine” template
 * - Minimal maintenance: update copy + slugs, not components
 * - Consistent, research-aligned tier amounts across modes
 * - Mode-driven defaults (monthly vs one-time)
 * - Supports:
 *   - Sponsor a Drama Club (club selector)
 *   - Sponsor an Artist
 *   - Sponsor a New Work (general) + optional “support a specific production” selector
 *   - Sponsor a Specific Production (production-specific route)
 *   - Sponsor a Special Project (one-off, urgent, unusual) + project-specific route
 *   - Sponsor What Matters to You (cause selector, 7 buckets)
 *   - Give Where Needed Most (general fund)
 */

import type { DramaClubCauseCategory } from "@/lib/causes";
import { CAUSE_CATEGORIES_BY_ID } from "@/lib/causes";

/* ----------------------------------------
 * Tier amounts (keep consistent across modes)
 * ------------------------------------- */

export const DONATION_AMOUNTS = {
  monthly: [25, 50, 100, 250, 500] as const,
  one_time: [100, 250, 500, 1000, 2500, 5000] as const,
} as const;

export type DonationFrequency = "monthly" | "one_time";
export type DonationAmountMonthly = (typeof DONATION_AMOUNTS.monthly)[number];
export type DonationAmountOneTime = (typeof DONATION_AMOUNTS.one_time)[number];

export type DonationModeId =
  | "drama-club"
  | "artist"
  | "new-work"
  | "new-work-specific"
  | "special-project"
  | "special-project-specific"
  | "cause"
  | "general";

/* ----------------------------------------
 * UI selector option types (kept generic)
 * ------------------------------------- */

export type DonationSelectOption = {
  /** Typically a slug or stable id (club slug, production slug, project id, etc.) */
  id: string;
  /** Human label */
  label: string;
  /** Optional short descriptor */
  subline?: string;
};

export type DonationTier = {
  id: string;
  amount: DonationAmountMonthly | DonationAmountOneTime;
  frequency: DonationFrequency;

  /** Big label on the tier card */
  title: string;

  /** One-line “why this matters” */
  eyebrow: string;

  /** Optional bullets (keep to 2–3 max to avoid walls) */
  bullets?: string[];

  /** Visual / behavioral hint for the UI */
  featured?: boolean;
};

export type DonationCampaign = {
  /** Campaign id (mode id or derived id) */
  id: string;

  /** Label for mode selector */
  modeLabel: string;

  /** Hero headline & subhead */
  headline: string;
  subhead?: string;

  /** Default frequency toggle */
  defaultFrequency: DonationFrequency;

  /** Tier sets (same amounts, mode-specific copy) */
  tiers: {
    monthly: DonationTier[];
    one_time: DonationTier[];
  };

  /** Optional trust block / helper text */
  trust?: string[];

  /**
   * Optional “selector” hints:
   * - clubSelector for drama clubs
   * - causeSelector for cause mode
   * - productionSelector for new-work mode (only shown when options exist)
   * - projectSelector for special projects (only shown when options exist)
   */
  selectors?: {
    type: "club" | "cause" | "production" | "special-project";
    label: string;
    emptyStateHidden?: boolean; // if true, UI should not render selector when options = []
  }[];

  /**
   * Optional “jump” CTA shown in-mode when active slugs exist (UI decides whether to show)
   */
  jumpLinks?: {
    label: string;
    /** URL the UI can render (or you can generate with buildDonateUrl) */
    href: string;
  }[];
};

/* ----------------------------------------
 * Defaults (mode → default frequency)
 * ------------------------------------- */

export const DEFAULT_FREQUENCY_BY_MODE: Record<DonationModeId, DonationFrequency> =
  {
    "drama-club": "monthly",
    artist: "monthly",
    "new-work": "monthly",
    "new-work-specific": "one_time", // project donors convert better as one-time
    "special-project": "one_time", // special projects are inherently “right now”
    "special-project-specific": "one_time",
    cause: "monthly",
    general: "monthly",
  };

/* ----------------------------------------
 * Shared helper: build donate URL with query params
 * ------------------------------------- */

export type DonateUrlParams = {
  mode?: DonationModeId;
  freq?: DonationFrequency;
  tier?: string;

  // selectors
  club?: string;
  cause?: DramaClubCauseCategory;
  production?: string;
  project?: string;
};

/**
 * Build a clean, stable URL for the donation engine.
 * Keep this “dumb” and pure; routing pages decide where it points.
 */
export function buildDonateUrl(
  basePath: string,
  params: DonateUrlParams
): string {
  const qp = new URLSearchParams();

  if (params.mode) qp.set("mode", params.mode);
  if (params.freq) qp.set("freq", params.freq);
  if (params.tier) qp.set("tier", params.tier);

  if (params.club) qp.set("club", params.club);
  if (params.cause) qp.set("cause", params.cause);
  if (params.production) qp.set("production", params.production);
  if (params.project) qp.set("project", params.project);

  const qs = qp.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

/* ----------------------------------------
 * Mode campaigns (non-cause)
 * ------------------------------------- */

export const CAMPAIGN_BY_MODE: Record<
  Exclude<DonationModeId, "cause">,
  DonationCampaign
> = {
  /* ---------------------------------- */
  /* Sponsor a Drama Club               */
  /* ---------------------------------- */
  "drama-club": {
    id: "drama-club",
    modeLabel: "Sponsor a Drama Club",
    headline: "Sponsor a Drama Club",
    subhead:
      "Keep youth-led theatre alive year-round—sessions, mentorship, showcases, and the practical needs that sustain a club between DAT residencies.",
    defaultFrequency: DEFAULT_FREQUENCY_BY_MODE["drama-club"],
    selectors: [
      {
        type: "club",
        label: "Choose a drama club",
        emptyStateHidden: true,
      },
    ],
    tiers: {
      monthly: [
        {
          id: "club-m25-fuel-circle",
          amount: 25,
          frequency: "monthly",
          title: "Fuel the Circle",
          eyebrow: "Keeps weekly sessions alive in the community.",
          bullets: ["Materials + prompts", "Transport + rehearsal support"],
        },
        {
          id: "club-m50-youth-mentor",
          amount: 50,
          frequency: "monthly",
          title: "Support a Youth Mentor",
          eyebrow: "Nurtures youth leadership inside the club.",
          bullets: ["Youth leader development", "Ongoing local mentorship"],
          featured: true,
        },
        {
          id: "club-m100-showcase",
          amount: 100,
          frequency: "monthly",
          title: "Build Toward a Showcase",
          eyebrow: "Gives kids a stage and a moment of pride.",
          bullets: ["Scripts + simple costumes/props", "Documentation moments"],
        },
        {
          id: "club-m250-local-ta",
          amount: 250,
          frequency: "monthly",
          title: "Local Teaching Artist Residency",
          eyebrow: "Helps ensure a local TA can sustain the club week-to-week.",
          bullets: ["Local TA stipend support", "Continuity between residencies"],
        },
        {
          id: "club-m500-master-artist",
          amount: 500,
          frequency: "monthly",
          title: "Master Artist + Community Spotlight",
          eyebrow:
            "Brings master workshops and helps the club’s story be heard locally.",
          bullets: ["Visiting master artist support", "Local press + photo/video"],
        },
      ],
      one_time: [
        {
          id: "club-o100-rehearsal-cube",
          amount: 100,
          frequency: "one_time",
          title: "Rehearsal Cube",
          eyebrow:
            "A portable, usable story kit—opened like treasure in rehearsal.",
          bullets: ["Prompt cards + tools", "Materials for devising + play"],
          featured: true,
        },
        {
          id: "club-o250-rehearsal-boost",
          amount: 250,
          frequency: "one_time",
          title: "Rehearsal Boost",
          eyebrow: "Strengthens a month of sessions with real resources.",
          bullets: ["Materials + printing", "Transport + session support"],
        },
        {
          id: "club-o500-showcase-weekend",
          amount: 500,
          frequency: "one_time",
          title: "Showcase Weekend",
          eyebrow: "Helps create a community performance moment.",
          bullets: ["Props/costumes + space prep", "Photo/video documentation"],
        },
        {
          id: "club-o1000-ta-sprint",
          amount: 1000,
          frequency: "one_time",
          title: "Teaching Artist Sprint",
          eyebrow: "Supports sustained local facilitation over a key period.",
          bullets: ["TA stipend support", "Preparation + continuity"],
        },
        {
          id: "club-o2500-club-season",
          amount: 2500,
          frequency: "one_time",
          title: "Club Season Underwriter",
          eyebrow: "Makes a full season of club activity possible.",
          bullets: ["Mentorship + materials", "Showcase + celebration"],
        },
        {
          id: "club-o5000-annual-underwrite",
          amount: 5000,
          frequency: "one_time",
          title: "Annual Club Underwriter",
          eyebrow: "Sustains a club for the year—stability, pride, and momentum.",
          bullets: ["TA support + supplies", "Major showcase + documentation"],
        },
      ],
    },
    trust: [
      "DAT partners with communities to build youth-led drama clubs designed for longevity.",
      "If needs shift, gifts are allocated where they create the greatest impact within the club ecosystem.",
    ],
  },

  /* ---------------------------------- */
  /* Sponsor an Artist                  */
  /* ---------------------------------- */
  artist: {
    id: "artist",
    modeLabel: "Sponsor an Artist",
    headline: "Sponsor an Artist",
    subhead:
      "Equitable access to life-changing, cross-cultural theatre-making—so under-resourced artists can say yes, grow, and bring ripple effects back to their communities.",
    defaultFrequency: DEFAULT_FREQUENCY_BY_MODE.artist,
    tiers: {
      monthly: [
        {
          id: "artist-m25-open-world",
          amount: 25,
          frequency: "monthly",
          title: "Open the World",
          eyebrow:
            "Helps an under-resourced artist cross the threshold into DAT work.",
          bullets: ["Equitable access support", "Removes a key barrier to saying yes"],
        },
        {
          id: "artist-m50-momentum",
          amount: 50,
          frequency: "monthly",
          title: "Build Momentum",
          eyebrow:
            "Keeps an artist immersed long enough for transformation, not just exposure.",
          bullets: [
            "Sustained field-based creation days",
            "Continuity that turns insight → growth",
          ],
        },
        {
          id: "artist-m100-breakthrough",
          amount: 100,
          frequency: "monthly",
          title: "Fuel a Breakthrough",
          eyebrow:
            "Resources a clear leap in craft, cultural navigation, and community trust.",
          bullets: [
            "Multi-week arc support",
            "Mentorship + responsibility in the work",
          ],
          featured: true,
        },
        {
          id: "artist-m250-leadership",
          amount: 250,
          frequency: "monthly",
          title: "Develop a Leader",
          eyebrow:
            "Supports an artist stepping into teaching, mentorship, or facilitation.",
          bullets: [
            "Assistant teaching artist pathway",
            "Mentoring youth / emerging artists",
          ],
        },
        {
          id: "artist-m500-fellow",
          amount: 500,
          frequency: "monthly",
          title: "Advance a Fellow",
          eyebrow:
            "Invest in long-form leadership—multi-stage, multi-season artistic growth.",
          bullets: [
            "Sustained development arc",
            "International + community-rooted leadership",
          ],
        },
      ],
      one_time: [
        {
          id: "artist-o100-first-step",
          amount: 100,
          frequency: "one_time",
          title: "First Step Grant",
          eyebrow: "One catalytic “yes” that changes an artist’s trajectory.",
          featured: true,
        },
        {
          id: "artist-o250-creation-boost",
          amount: 250,
          frequency: "one_time",
          title: "Creation Boost",
          eyebrow: "Funds sustained field-based rehearsal and making.",
        },
        {
          id: "artist-o500-access-grant",
          amount: 500,
          frequency: "one_time",
          title: "Residency Access Grant",
          eyebrow: "Unlocks a deeper arc where real growth happens.",
        },
        {
          id: "artist-o1000-leadership-arc",
          amount: 1000,
          frequency: "one_time",
          title: "Leadership Arc Scholarship",
          eyebrow: "Supports training → community engagement → showcase responsibility.",
        },
        {
          id: "artist-o2500-fellowship-builder",
          amount: 2500,
          frequency: "one_time",
          title: "Fellowship Builder",
          eyebrow: "Seeds a major leadership and mentorship pathway.",
        },
        {
          id: "artist-o5000-fellowship-underwriter",
          amount: 5000,
          frequency: "one_time",
          title: "Fellowship Underwriter",
          eyebrow: "Sustains an artist’s long-form arc with real stability.",
        },
      ],
    },
    trust: [
      "DAT creates field-based theatre experiences—often in found locations—rooted in cross-cultural exchange and community partnership.",
      "Artist support is distributed as access grants, stipends, and expense coverage to reduce barriers ethically.",
    ],
  },

  /* ---------------------------------- */
  /* Sponsor a New Work (general)       */
  /* ---------------------------------- */
  "new-work": {
    id: "new-work",
    modeLabel: "Sponsor a New Work",
    headline: "Sponsor a New Work",
    subhead:
      "Support the pipeline—research, dramaturgy-in-place, field rehearsals, cross-cultural collaboration, production, film development, and festival pathways.",
    defaultFrequency: DEFAULT_FREQUENCY_BY_MODE["new-work"],
    selectors: [
      {
        type: "production",
        label: "Looking to support a specific production?",
        emptyStateHidden: true, // UI shows only if options exist
      },
    ],
    tiers: {
      monthly: [
        {
          id: "nw-m25-seed-story",
          amount: 25,
          frequency: "monthly",
          title: "Seed the Story",
          eyebrow: "Supports early development, research, and dramaturgy-in-place.",
        },
        {
          id: "nw-m50-field-rehearsals",
          amount: 50,
          frequency: "monthly",
          title: "Fuel Field Rehearsals",
          eyebrow:
            "Brings the rehearsal room into jungles, beaches, markets, and community spaces.",
          bullets: ["Local transport + meals", "Rehearsal supplies in the field"],
          featured: true,
        },
        {
          id: "nw-m100-advance-script",
          amount: 100,
          frequency: "monthly",
          title: "Advance the Script",
          eyebrow:
            "Funds shaping the story—structure, consultation, and development labs.",
          bullets: ["Writer labs + table work", "Cultural consultation when needed"],
        },
        {
          id: "nw-m250-collaboration",
          amount: 250,
          frequency: "monthly",
          title: "Drive Cross-Cultural Collaboration",
          eyebrow:
            "Supports international partnership, translation, and community exchange.",
          bullets: ["Translation / liaison support", "Documentation + continuity"],
        },
        {
          id: "nw-m500-build-production",
          amount: 500,
          frequency: "monthly",
          title: "Build the Production",
          eyebrow:
            "Supports design, filming days, festival submissions, and public sharing.",
          bullets: ["Festival strategy + submissions", "Filming / recording support"],
        },
      ],
      one_time: [
        {
          id: "nw-o100-research-boost",
          amount: 100,
          frequency: "one_time",
          title: "Field Research Boost",
          eyebrow: "Helps gather stories and cultural context for new work.",
        },
        {
          id: "nw-o250-rehearsal-day",
          amount: 250,
          frequency: "one_time",
          title: "Rehearsal Day in the Field",
          eyebrow: "Funds a full day of devising / rehearsal in a found environment.",
          featured: true,
        },
        {
          id: "nw-o500-production-essentials",
          amount: 500,
          frequency: "one_time",
          title: "Production Essentials",
          eyebrow: "Props, design materials, transportation, and rehearsal logistics.",
        },
        {
          id: "nw-o1000-festival-push",
          amount: 1000,
          frequency: "one_time",
          title: "Festival Push",
          eyebrow: "Supports submissions and readiness for international festivals.",
        },
        {
          id: "nw-o2500-momentum-grant",
          amount: 2500,
          frequency: "one_time",
          title: "Production Momentum Grant",
          eyebrow: "Moves the project meaningfully closer to stage or film.",
        },
        {
          id: "nw-o5000-underwrite",
          amount: 5000,
          frequency: "one_time",
          title: "Underwrite a Signature New Work",
          eyebrow: "Seeds a major artistic project with global ripple effects.",
        },
      ],
    },
    trust: [
      "New works are developed in collaboration with communities and artists across cultures and landscapes.",
      "If needs shift during development, funds are allocated to the highest-impact phase of the work.",
    ],
    // Jump links are generated dynamically in UI when productions exist
  },

  /* ---------------------------------- */
  /* Sponsor a Specific Production       */
  /* (Template — production pages should override copy) */
  /* ---------------------------------- */
  "new-work-specific": {
    id: "new-work-specific",
    modeLabel: "Sponsor This Production",
    headline: "Sponsor This Production",
    subhead:
      "Help bring this work to life—development, field rehearsal, production, filming, and festival momentum.",
    defaultFrequency: DEFAULT_FREQUENCY_BY_MODE["new-work-specific"],
    tiers: {
      monthly: [
        // (allowed, but not default)
        {
          id: "nws-m25-seed",
          amount: 25,
          frequency: "monthly",
          title: "Stay with the Story",
          eyebrow: "Sustains the work across its development arc.",
        },
        {
          id: "nws-m50-rehearsal",
          amount: 50,
          frequency: "monthly",
          title: "Support Field Rehearsals",
          eyebrow: "Keeps creation moving week-to-week.",
        },
        {
          id: "nws-m100-development",
          amount: 100,
          frequency: "monthly",
          title: "Advance Development",
          eyebrow: "Supports deeper collaboration and refinement.",
          featured: true,
        },
        {
          id: "nws-m250-production",
          amount: 250,
          frequency: "monthly",
          title: "Strengthen Production",
          eyebrow: "Supports design, filming, and readiness.",
        },
        {
          id: "nws-m500-launch",
          amount: 500,
          frequency: "monthly",
          title: "Launch the Work",
          eyebrow: "Powers festival and audience pathways.",
        },
      ],
      one_time: [
        {
          id: "nws-o100-now",
          amount: 100,
          frequency: "one_time",
          title: "Make Today Possible",
          eyebrow: "Covers immediate creation needs in the field.",
        },
        {
          id: "nws-o250-rehearsal-day",
          amount: 250,
          frequency: "one_time",
          title: "Sponsor a Rehearsal Day",
          eyebrow: "Funds a full day of devising / rehearsal in place.",
          featured: true,
        },
        {
          id: "nws-o500-essentials",
          amount: 500,
          frequency: "one_time",
          title: "Production Essentials",
          eyebrow: "Design materials, logistics, and documentation support.",
        },
        {
          id: "nws-o1000-festival",
          amount: 1000,
          frequency: "one_time",
          title: "Festival Push",
          eyebrow: "Supports submissions and readiness for the circuit.",
        },
        {
          id: "nws-o2500-momentum",
          amount: 2500,
          frequency: "one_time",
          title: "Momentum Grant",
          eyebrow: "Moves the project significantly toward stage / film.",
        },
        {
          id: "nws-o5000-underwrite",
          amount: 5000,
          frequency: "one_time",
          title: "Underwrite This Work",
          eyebrow: "A transformational gift that accelerates the full arc.",
        },
      ],
    },
    trust: [
      "Production-specific gifts support this work’s path to audience: stage, film, and festival.",
      "If needs shift, funds are used within this production to create the greatest impact.",
    ],
  },

  /* ---------------------------------- */
  /* Sponsor a Special Project (general) */
  /* ---------------------------------- */
  "special-project": {
    id: "special-project",
    modeLabel: "Sponsor a Special Project",
    headline: "Sponsor a Special Project",
    subhead:
      "One-off needs, urgent moments, and bold experiments—support the projects that demand a fast, focused response.",
    defaultFrequency: DEFAULT_FREQUENCY_BY_MODE["special-project"],
    selectors: [
      {
        type: "special-project",
        label: "Choose a special project",
        emptyStateHidden: true,
      },
    ],
    tiers: {
      monthly: [
        // (allowed, but not default)
        {
          id: "sp-m25-steadiness",
          amount: 25,
          frequency: "monthly",
          title: "Steady Support",
          eyebrow: "Keeps special projects possible when moments arise.",
        },
        {
          id: "sp-m50-response",
          amount: 50,
          frequency: "monthly",
          title: "Rapid Response",
          eyebrow: "Funds quick action for urgent or time-sensitive needs.",
          featured: true,
        },
        {
          id: "sp-m100-stabilize",
          amount: 100,
          frequency: "monthly",
          title: "Stabilize a Moment",
          eyebrow: "Supports short, focused bursts of real-world impact.",
        },
        {
          id: "sp-m250-build",
          amount: 250,
          frequency: "monthly",
          title: "Build the Project",
          eyebrow: "Resources logistics, materials, and key collaborators.",
        },
        {
          id: "sp-m500-lead",
          amount: 500,
          frequency: "monthly",
          title: "Lead Supporter",
          eyebrow: "Powers a special project from idea to execution.",
        },
      ],
      one_time: [
        {
          id: "sp-o100-help-now",
          amount: 100,
          frequency: "one_time",
          title: "Help Now",
          eyebrow: "Direct support for immediate needs or urgent response.",
          featured: true,
        },
        {
          id: "sp-o250-direct-relief",
          amount: 250,
          frequency: "one_time",
          title: "Direct Relief",
          eyebrow: "Supports supplies, transport, or emergency assistance.",
        },
        {
          id: "sp-o500-logistics",
          amount: 500,
          frequency: "one_time",
          title: "Emergency Logistics",
          eyebrow: "Covers the hard costs that make action possible.",
        },
        {
          id: "sp-o1000-stabilize",
          amount: 1000,
          frequency: "one_time",
          title: "Stabilize a Community Partner",
          eyebrow: "Helps partners recover and continue the work.",
        },
        {
          id: "sp-o2500-rebuild",
          amount: 2500,
          frequency: "one_time",
          title: "Rebuild & Resume",
          eyebrow: "A major push to restore capacity after disruption.",
        },
        {
          id: "sp-o5000-make-the-thing",
          amount: 5000,
          frequency: "one_time",
          title: "Make the Big Thing Possible",
          eyebrow: "Funds bold one-offs—boats, pop-ups, unique opportunities.",
        },
      ],
    },
    trust: [
      "Special projects are time-sensitive by nature—your gift helps DAT move quickly and responsibly.",
      "If the specific need resolves early, funds are used for the closest aligned special project or urgent partner need.",
    ],
  },

  /* ---------------------------------- */
  /* Sponsor a Specific Special Project  */
  /* (Template — project pages should override copy) */
  /* ---------------------------------- */
  "special-project-specific": {
    id: "special-project-specific",
    modeLabel: "Sponsor This Special Project",
    headline: "Sponsor This Special Project",
    subhead: "Fast, focused support for a specific moment of need or possibility.",
    defaultFrequency: DEFAULT_FREQUENCY_BY_MODE["special-project-specific"],
    tiers: {
      monthly: [
        {
          id: "sps-m25-stay",
          amount: 25,
          frequency: "monthly",
          title: "Stay with the Project",
          eyebrow: "Sustains momentum while needs evolve.",
        },
        {
          id: "sps-m50-response",
          amount: 50,
          frequency: "monthly",
          title: "Rapid Response",
          eyebrow: "Keeps the project moving quickly.",
          featured: true,
        },
        {
          id: "sps-m100-stabilize",
          amount: 100,
          frequency: "monthly",
          title: "Stabilize the Work",
          eyebrow: "Supports core logistics and collaborators.",
        },
        {
          id: "sps-m250-build",
          amount: 250,
          frequency: "monthly",
          title: "Build Capacity",
          eyebrow: "Resources a significant portion of the project’s needs.",
        },
        {
          id: "sps-m500-underwrite",
          amount: 500,
          frequency: "monthly",
          title: "Underwrite the Push",
          eyebrow: "A major commitment to completion.",
        },
      ],
      one_time: [
        {
          id: "sps-o100-now",
          amount: 100,
          frequency: "one_time",
          title: "Help Right Now",
          eyebrow: "Supports immediate needs.",
          featured: true,
        },
        {
          id: "sps-o250-relief",
          amount: 250,
          frequency: "one_time",
          title: "Direct Support",
          eyebrow: "Funds concrete, near-term project costs.",
        },
        {
          id: "sps-o500-logistics",
          amount: 500,
          frequency: "one_time",
          title: "Logistics + Materials",
          eyebrow: "Covers the essentials that unlock action.",
        },
        {
          id: "sps-o1000-stabilize",
          amount: 1000,
          frequency: "one_time",
          title: "Stabilize & Continue",
          eyebrow: "Helps ensure the project can carry through.",
        },
        {
          id: "sps-o2500-major-push",
          amount: 2500,
          frequency: "one_time",
          title: "Major Push",
          eyebrow: "A significant acceleration toward completion.",
        },
        {
          id: "sps-o5000-transform",
          amount: 5000,
          frequency: "one_time",
          title: "Transform the Outcome",
          eyebrow: "A cornerstone gift for this specific effort.",
        },
      ],
    },
    trust: [
      "Special-project gifts are allocated to this project’s needs first.",
      "If needs shift, funds remain within this project’s scope or the closest aligned special project.",
    ],
  },

  /* ---------------------------------- */
  /* Give Where Needed Most (general fund) */
  /* ---------------------------------- */
  general: {
  id: "general",
  modeLabel: "Sponsor the Story",
  headline: "Sponsor the Story",
  subhead:
    "Give where needed most—fund moments, not maintenance. Fuel the backbone that lets DAT respond, create, and sustain impact across the full season.",
    defaultFrequency: DEFAULT_FREQUENCY_BY_MODE.general,
    tiers: {
      monthly: [
        {
          id: "gen-m25-backbone",
          amount: 25,
          frequency: "monthly",
          title: "Build the Backbone",
          eyebrow:
            "Covers the small constants that make global work possible.",
          bullets: ["Printing + permits", "Local transport + supplies"],
        },
        {
          id: "gen-m50-engine",
          amount: 50,
          frequency: "monthly",
          title: "Fuel the Story Engine",
          eyebrow:
            "Keeps documentation, translation, and team coordination running.",
          bullets: ["Photo/video + storage", "Translation + communications"],
          featured: true,
        },
        {
          id: "gen-m100-season",
          amount: 100,
          frequency: "monthly",
          title: "Power the Season",
          eyebrow:
            "Strengthens ACTion, RAW, CASTAWAY, drama clubs, and new work together.",
          bullets: ["Flexibility across programs", "Capacity to seize opportunities"],
        },
        {
          id: "gen-m250-people",
          amount: 250,
          frequency: "monthly",
          title: "Empower Artists & Communities",
          eyebrow:
            "Supports stipends, honoraria, and community collaborators on the ground.",
          bullets: ["Pays real people", "Builds real capacity"],
        },
        {
          id: "gen-m500-underwrite-year",
          amount: 500,
          frequency: "monthly",
          title: "Underwrite the Year",
          eyebrow:
            "Transforms DAT’s ability to plan boldly and sustainably.",
          bullets: ["Stability → creativity", "Predictable support → bigger impact"],
        },
      ],
      one_time: [
        {
          id: "gen-o100-missing-piece",
          amount: 100,
          frequency: "one_time",
          title: "Solve the Missing Piece",
          eyebrow: "Covers the surprise gaps that stall good work.",
          featured: true,
        },
        {
          id: "gen-o250-logistics-kit",
          amount: 250,
          frequency: "one_time",
          title: "Creative Logistics Kit",
          eyebrow: "Materials, printing, transport—the practical glue.",
        },
        {
          id: "gen-o500-document",
          amount: 500,
          frequency: "one_time",
          title: "Document the Story",
          eyebrow: "Supports filming, photo, editing, and archiving moments.",
        },
        {
          id: "gen-o1000-collaboration",
          amount: 1000,
          frequency: "one_time",
          title: "International Collaboration Boost",
          eyebrow: "Helps bridge distances—literally and culturally.",
        },
        {
          id: "gen-o2500-season-underwriter",
          amount: 2500,
          frequency: "one_time",
          title: "Season Underwriter",
          eyebrow: "A major push across the annual arc of work.",
        },
        {
          id: "gen-o5000-year-underwriter",
          amount: 5000,
          frequency: "one_time",
          title: "Annual Underwriter",
          eyebrow: "A cornerstone gift powering the whole ecosystem.",
        },
      ],
    },
    trust: [
      "General gifts let DAT move fast when moments arise—opportunities, crises, collaborations, and breakthroughs.",
      "Funds are allocated to the highest-impact needs across programs when circumstances change.",
    ],
  },
};

/* ----------------------------------------
 * Cause mode (Sponsor What Matters to You)
 * ------------------------------------- */

export type CauseCampaign = Omit<DonationCampaign, "id"> & {
  causeCategory: DramaClubCauseCategory;
};

const CAUSE_TIER_SKELETON = {
  monthly: (causeLabelShort: string): DonationTier[] => [
    {
      id: `cause-m25-ignite`,
      amount: 25,
      frequency: "monthly",
      title: `Ignite the Work`,
      eyebrow: `Put practical tools into local hands—often through a Rehearsal Cube and community-led storywork.`,
    },
    {
      id: `cause-m50-amplify`,
      amount: 50,
      frequency: "monthly",
      title: `Amplify Local Voices`,
      eyebrow: `Support local leaders, culture-bearers, and storytellers advancing ${causeLabelShort}.`,
      featured: true,
    },
    {
      id: `cause-m100-initiative`,
      amount: 100,
      frequency: "monthly",
      title: `Support a Community-Led Initiative`,
      eyebrow: `Fund workshops, gatherings, and creation led by the community itself.`,
    },
    {
      id: `cause-m250-movement`,
      amount: 250,
      frequency: "monthly",
      title: `Catalyze a Movement Moment`,
      eyebrow: `Help produce a performance, gathering, or visibility event that advances ${causeLabelShort}.`,
    },
    {
      id: `cause-m500-signature`,
      amount: 500,
      frequency: "monthly",
      title: `Underwrite a Signature Project`,
      eyebrow: `Sustain a major initiative with long-term ripple effects.`,
    },
  ],
  one_time: (causeLabelShort: string): DonationTier[] => [
    {
      id: `cause-o100-cube`,
      amount: 100,
      frequency: "one_time",
      title: `Rehearsal Cube`,
      eyebrow: `A portable, usable story kit for community rehearsal and creation.`,
      featured: true,
    },
    {
      id: `cause-o250-workshop`,
      amount: 250,
      frequency: "one_time",
      title: `Community Workshop Day`,
      eyebrow: `Funds a full day of storywork and creative exchange in place.`,
    },
    {
      id: `cause-o500-visibility`,
      amount: 500,
      frequency: "one_time",
      title: `Visibility + Documentation`,
      eyebrow: `Helps amplify the story—photo/video, sharing, and local momentum.`,
    },
    {
      id: `cause-o1000-catalyst`,
      amount: 1000,
      frequency: "one_time",
      title: `Catalyst Grant`,
      eyebrow: `Accelerates a cause-aligned initiative from idea to action.`,
    },
    {
      id: `cause-o2500-signature-boost`,
      amount: 2500,
      frequency: "one_time",
      title: `Signature Project Boost`,
      eyebrow: `A major push for a sustained cause-aligned effort.`,
    },
    {
      id: `cause-o5000-underwrite`,
      amount: 5000,
      frequency: "one_time",
      title: `Underwrite a Signature Project`,
      eyebrow: `A cornerstone gift advancing ${causeLabelShort} through story, art, and community partnership.`,
    },
  ],
};

export const CAUSE_CAMPAIGNS: Record<DramaClubCauseCategory, CauseCampaign> = {
  "indigenous-sovereignty-rights": {
    causeCategory: "indigenous-sovereignty-rights",
    modeLabel: "Sponsor What Matters to You",
    headline: "Sponsor What Matters to You",
    subhead: "Support a cause that aligns with your values.",
    defaultFrequency: DEFAULT_FREQUENCY_BY_MODE.cause,
    tiers: {
      monthly: CAUSE_TIER_SKELETON.monthly("Indigenous sovereignty and rights"),
      one_time: CAUSE_TIER_SKELETON.one_time("Indigenous sovereignty and rights"),
    },
    trust: [
      "DAT supports community-led storywork that protects land, language, and cultural survival.",
      "Gifts are allocated to the highest-impact cause-aligned work when needs shift.",
    ],
  },

  "climate-justice-biodiversity-environmental-protection": {
    causeCategory: "climate-justice-biodiversity-environmental-protection",
    modeLabel: "Sponsor What Matters to You",
    headline: "Sponsor What Matters to You",
    subhead: "Support a cause that aligns with your values.",
    defaultFrequency: DEFAULT_FREQUENCY_BY_MODE.cause,
    tiers: {
      monthly: CAUSE_TIER_SKELETON.monthly("climate justice and biodiversity"),
      one_time: CAUSE_TIER_SKELETON.one_time("climate justice and biodiversity"),
    },
    trust: [
      "DAT supports frontline communities protecting ecosystems through story, art, and action.",
      "Gifts are allocated where they create the greatest environmental and community impact.",
    ],
  },

  "youth-empowerment-mental-health-wellbeing": {
    causeCategory: "youth-empowerment-mental-health-wellbeing",
    modeLabel: "Sponsor What Matters to You",
    headline: "Sponsor What Matters to You",
    subhead: "Support a cause that aligns with your values.",
    defaultFrequency: DEFAULT_FREQUENCY_BY_MODE.cause,
    tiers: {
      monthly: CAUSE_TIER_SKELETON.monthly("youth empowerment and wellbeing"),
      one_time: CAUSE_TIER_SKELETON.one_time("youth empowerment and wellbeing"),
    },
    trust: [
      "DAT helps youth find strength, voice, and belonging through creative practice.",
      "Gifts support safe, trauma-informed spaces and youth-led leadership arcs.",
    ],
  },

  "education-access-equity-opportunity": {
    causeCategory: "education-access-equity-opportunity",
    modeLabel: "Sponsor What Matters to You",
    headline: "Sponsor What Matters to You",
    subhead: "Support a cause that aligns with your values.",
    defaultFrequency: DEFAULT_FREQUENCY_BY_MODE.cause,
    tiers: {
      monthly: CAUSE_TIER_SKELETON.monthly("education access and opportunity"),
      one_time: CAUSE_TIER_SKELETON.one_time("education access and opportunity"),
    },
    trust: [
      "DAT expands arts learning through hands-on practice and teacher/community partnership.",
      "Gifts help reduce barriers to education and creative access.",
    ],
  },

  "social-justice-human-rights-equity": {
    causeCategory: "social-justice-human-rights-equity",
    modeLabel: "Sponsor What Matters to You",
    headline: "Sponsor What Matters to You",
    subhead: "Support a cause that aligns with your values.",
    defaultFrequency: DEFAULT_FREQUENCY_BY_MODE.cause,
    tiers: {
      monthly: CAUSE_TIER_SKELETON.monthly("justice, human rights, and equity"),
      one_time: CAUSE_TIER_SKELETON.one_time("justice, human rights, and equity"),
    },
    trust: [
      "DAT advances equity through narrative justice—whose stories are told, and how.",
      "Gifts support community-rooted work that strengthens dignity and rights.",
    ],
  },

  "community-wellbeing-safety-resilience": {
    causeCategory: "community-wellbeing-safety-resilience",
    modeLabel: "Sponsor What Matters to You",
    headline: "Sponsor What Matters to You",
    subhead: "Support a cause that aligns with your values.",
    defaultFrequency: DEFAULT_FREQUENCY_BY_MODE.cause,
    tiers: {
      monthly: CAUSE_TIER_SKELETON.monthly("community wellbeing and resilience"),
      one_time: CAUSE_TIER_SKELETON.one_time("community wellbeing and resilience"),
    },
    trust: [
      "DAT supports partners building safety, resilience, and community capacity.",
      "Gifts help resource local leadership and community-led recovery when needed.",
    ],
  },

  "arts-culture-storytelling-representation": {
    causeCategory: "arts-culture-storytelling-representation",
    modeLabel: "Sponsor What Matters to You",
    headline: "Sponsor What Matters to You",
    subhead: "Support a cause that aligns with your values.",
    defaultFrequency: DEFAULT_FREQUENCY_BY_MODE.cause,
    tiers: {
      monthly: CAUSE_TIER_SKELETON.monthly("arts, culture, and storytelling"),
      one_time: CAUSE_TIER_SKELETON.one_time("arts, culture, and storytelling"),
    },
    trust: [
      "DAT champions representation, freedom of expression, and community creative power.",
      "Gifts help stories travel—locally and globally—without losing integrity.",
    ],
  },
};

/* ----------------------------------------
 * Public API: get campaign by mode/context
 * ------------------------------------- */

export type DonationConfigInput = {
  mode?: DonationModeId;
  /** For cause mode */
  causeCategory?: DramaClubCauseCategory;

  /**
   * Optional slugs/ids for prefill (UI can store these and render header chips)
   * (This file does not enforce their existence—your UI/router does.)
   */
  clubSlug?: string;
  productionSlug?: string;
  specialProjectId?: string;

  /**
   * Optional active options: if you pass these into your template,
   * it can decide whether to show the selector and/or jump links.
   */
  activeProductions?: DonationSelectOption[]; // only those fundraisingActive
  activeSpecialProjects?: DonationSelectOption[];
  activeClubs?: DonationSelectOption[];
};

export function getDonationCampaign(
  input: DonationConfigInput
): DonationCampaign {
  const mode: DonationModeId = input.mode ?? "cause";

  if (mode === "cause") {
    // If no cause category provided, return a safe default (first category in your taxonomy)
    const fallbackCause =
      input.causeCategory ??
      ("indigenous-sovereignty-rights" as DramaClubCauseCategory);

    const base = CAUSE_CAMPAIGNS[fallbackCause];

    // For UI: reflect the chosen cause label in the subhead if desired (optional)
    const causeMeta = CAUSE_CATEGORIES_BY_ID[fallbackCause];
    const causeLine = causeMeta?.label ? ` — ${causeMeta.label}` : "";

    return {
      id: `cause:${fallbackCause}`,
      modeLabel: "Sponsor What Matters to You",
      headline: base.headline,
      subhead: `${base.subhead ?? ""}${causeLine}`.trim(),
      defaultFrequency: base.defaultFrequency,
      selectors: [
        {
          type: "cause",
          label: "Choose a cause",
          emptyStateHidden: true,
        },
      ],
      tiers: base.tiers,
      trust: base.trust,
    };
  }

  // Non-cause modes
  const campaign = CAMPAIGN_BY_MODE[mode as Exclude<DonationModeId, "cause">];

  // Add “jump to specific production” links (only when active productions exist)
  // UI can render these as simple text links or compact cards.
  if (
    mode === "new-work" &&
    input.activeProductions &&
    input.activeProductions.length > 0
  ) {
    const jumpLinks = input.activeProductions.map((p) => ({
      label: `Sponsor this specific production: ${p.label}`,
      href: buildDonateUrl("/donate", {
        mode: "new-work-specific",
        freq: "one_time",
        production: p.id,
      }),
    }));

    return {
      ...campaign,
      jumpLinks,
    };
  }

  return campaign;
}

/* ----------------------------------------
 * Convenience: mode list for UI ordering
 * ------------------------------------- */

export const DONATION_MODE_ORDER: DonationModeId[] = [
  "drama-club",
  "artist",
  "new-work",
  "special-project",
  "cause", // Sponsor What Matters to You
  "general",
];

/* ----------------------------------------
 * Display labels (single source of truth for nav)
 * ------------------------------------- */

export const DONATION_MODE_LABELS: Record<DonationModeId, string> = {
  "drama-club": "Sponsor a Drama Club",
  artist: "Sponsor an Artist",
  "new-work": "Sponsor a New Work",
  "new-work-specific": "Sponsor This Production",
  "special-project": "Sponsor a Special Project",
  "special-project-specific": "Sponsor This Special Project",
  cause: "Sponsor What Matters to You",
  general: "Sponsor the Story",
};
