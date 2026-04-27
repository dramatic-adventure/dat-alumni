// /schemas/alumni.ts

/** Controlled vocab for DAT roles shown as badges */
export type RoleAtDAT =
  | "Actor" | "Director" | "Designer" | "Dramaturg" | "Playwright" | "Writer"
  | "Teaching Artist / Workshop Leader" | "Mentor" | "Filmmaker"
  | "Project Photographer / Videographer" | "Production Stage Manager"
  | "Assistant Stage Manager / Crew" | "Event Host / Emcee / Moderator / Speaker"
  | "Road Manager" | "Staff / Administrator" | "Other";

/**
 * "How I Identify" — V1 canonical identity tags (self-selected only).
 * Never inferred from bio/credits/roles/geography. See lib/alumniTaxonomy.ts.
 */
export type IdentityTag =
  | "Queer"
  | "Trans"
  | "Nonbinary"
  | "Disabled"
  | "Neurodivergent"
  | "Indigenous"
  | "Immigrant"
  | "First-Generation"
  | "Diasporic"
  | "Parent";

/** "My Artistic Practice" — V1 canonical practice tags. */
export type PracticeTag =
  | "Teaching Artist"
  | "Devised Theatre"
  | "Physical Theatre"
  | "Site-Specific Performance"
  | "Community-Engaged Theatre"
  | "New Work Development"
  | "Interdisciplinary Performance"
  | "Ensemble Creation"
  | "Immersive Theatre"
  | "Documentary Theatre"
  | "Cross-Cultural Collaboration";

/** "What I Explore & Care About in My Work" — V1 canonical themes. */
export type ExploreCareTag =
  | "Myth & Folklore"
  | "Belonging"
  | "Identity & Representation"
  | "Migration & Diaspora"
  | "Youth Voice"
  | "Cultural Preservation"
  | "Environmental Justice"
  | "Arts Access"
  | "Memory & History"
  | "Education Equity"
  | "Community Empowerment"
  | "Place & Landscape";

/** Generic social link (kept for back-compat; specific fields are also supported) */
export type SocialLink = { platform: string; url: string };

/** Visual theme for profile background */
export type BackgroundStyle = "kraft" | "leather";

/** Atomic event entry (kept separate from profile document) */
export type UpcomingEvent = {
  alumniId: string;             // slug
  title: string;
  mediaUrl?: string;
  startDate?: string;           // ISO
  endDate?: string;             // ISO
  link?: string;
  expiresAt?: string;           // default endDate or +90d
  status?: "active" | "archived";
};

/** Primary profile document */
export type AlumniProfile = {
  /** Canonical identifier (lowercase-with-dashes). Old slugs should 301 to this. */
  slug: string;

  /** Public display name (what appears on profile & story map) */
  name: string;

  /** Private recordkeeping name (not shown unless same as public) */
  legalName?: string;

  /** Back-compat: prior public names; you may prefer `aliases` going forward */
  previousNames?: string[];

  /** Search aliases / stage names (used to resolve old searches) */
  aliases?: string[];

  /** Slug history for permanent redirects and search resolution */
  oldSlugs?: string[];

  /** Roles with DAT (historical, multi-select) */
  datRoles?: RoleAtDAT[];

  /** Who they are today (free text; may be non-arts) */
  currentRole?: string;

  /** Primary city/country (free text for now; can evolve to structured) */
  location?: string;

  /** If true, show secondary base as “A ⇄ B” */
  isBiCoastal?: boolean;

  /** Secondary base (free text) */
  secondLocation?: string;

  /** Public/display headshot URL (often derived). */
  headshotUrl?: string;

  /** Profile-Live write key used by the Studio editor. */
  currentHeadshotUrl?: string;

  /** Optional identity tags (opt-in, controlled vocab, max 3). */
  identityTags?: IdentityTag[];

  /** Artistic practice tags (controlled vocab, max 3). */
  practiceTags?: PracticeTag[];

  /** Themes / causes the artist explores (controlled vocab, max 4). */
  exploreCareTags?: ExploreCareTag[];

  /** Languages spoken (comma-separated, e.g. "Español (Advanced), English (Native)") */
  languages?: string;

  /** Short bio / artist statement (shown near the top of profile) */
  artistStatement?: string;

  // ── Links / contact
  website?: string;
  socials?: SocialLink[];       // optional generic list
  publicEmail?: string;

  /** Socials (normalized to @handle where relevant; some kept as URL) */
  instagram?: string;           // @handle
  x?: string;                   // @handle (formerly Twitter)
  tiktok?: string;              // @handle
  threads?: string;             // @handle
  bluesky?: string;             // @handle (e.g., name.bsky.social)
  linkedin?: string;            // full URL
  youtube?: string;             // full URL (channel/video)
  vimeo?: string;               // full URL
  facebook?: string;            // full URL (page/profile)
  linktree?: string;            // full URL

  /** Background theme selection */
  backgroundStyle?: BackgroundStyle;

  // ── Current Update (auto-expires → archive)
  currentUpdateText?: string;   // one-liner
  currentUpdateLink?: string;   // optional URL
  currentUpdateExpiresAt?: string; // ISO date (server can default to ~90d)

  // ── Story Map contribution (all optional so drafts don’t fail validation)
  story?: {
    title?: string;
    program?: string;
    programCountry?: string;
    years?: string;             // "2016" or "2015–2016"
    location?: string;          // map pin label
    partners?: string;
    mediaUrl?: string;          // URL we may ingest to Drive
    shortStory?: string;        // 1–2 paragraphs
    url?: string;               // external
    quote?: string;
    quoteAuthor?: string;
  };

  // ── Tech Support (collected via same form; routed elsewhere)
  support?: {
    bug?: string;
    feature?: string;
    assistance?: string;
  };
};
