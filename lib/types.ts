// ========== Shared Utility Types ==========
export type GeoLocation = {
  lat: number;
  lng: number;
  label?: string;
};

export type UrlString = string;
export type RawRow = Record<string, string>; // For raw Google Sheet parsing

// ========== Story Map Rows ==========
export type StoryRow = {
  title: string;
  slug: string;
  program?: string;
  location?: string;
  latitude?: string;
  longitude?: string;
  year?: string;
  partners?: string;
  story?: string;
  quote?: string;
  quoteAuthor?: string;
  imageUrl?: UrlString;
  author?: string;
  authorSlug?: string;
  moreInfoLink?: UrlString;
  country?: string;
  regionTag?: string;
  category?: string;
  showOnMap?: string;
  storyId?: string;
  storyUrl?: UrlString;
};

// ========== Alumni Profiles ==========
export interface AlumniRow {
  slug: string;
  name: string;

  // Legacy + new fields
  role: string;
  roles: string[];

  // Core fields
  location: string;
  headshotUrl?: string;
  artistStatement?: string;

  // Filters & tags
  programBadges: string[];
  productions?: string[];
  festival?: string;
  identityTags: string[];
  statusFlags: string[];
  programSeasons: number[];

  // For updates feature
  lastModifiedRaw?: string;
  lastModified?: Date | null;

  // Extended profile fields
  locations?: { lat: number; lng: number; label?: string }[];
  latitude?: string;
  longitude?: string;
  imageUrls?: string[];
  posterUrls?: string[];
  currentWork?: string;
  legacyProductions?: string;

  storyTitle?: string;
  storyThumbnail?: string;
  storyExcerpt?: string;
  storyUrl?: string;

  tags?: string[];
  artistUrl?: string;
  artistEmail?: string;
  socialLinks?: string[];
  updateLink?: string;

  showOnProfile?: string;
  profileId?: string;
  profileUrl?: string;
  fieldNotes?: string[];
  backgroundChoice?: string;

  // Spotlight updates shown on profile / feeds
  updates?: SpotlightUpdate[];

  // Optional contact
  email?: string;
  website?: string;
  socials?: string[];
  hasContactInfo?: boolean;
}

// ========== Updates ==========
/**
 * SpotlightUpdate: the lightweight shape your UI consumes directly,
 * and the shape you’re aggregating in loadJourneyFeed/loadJourneyUpdates.
 * Note: dates are ISO strings (YYYY-MM-DD).
 */
export type SpotlightUpdate = {
  // Identification / dedupe
  id?: string;          // unique ID for the update (optional)
  slug?: string;        // artist/profile slug (REQUIRED for dedupe if present)
  artistId?: string;    // useful to avoid adjacent repeats in carousels

  // Content
  tag?: string;
  headline: string;
  subheadlineTitle?: string;
  subheadlineDescription?: string;
  body: string;

  // Media & CTA
  mediaUrl?: string;
  ctaText?: string;
  ctaLink?: string;

  // Meta
  evergreen?: boolean;
  eventDate?: string;   // ISO date string
  sortDate?: string;    // ISO date string used for sorting
  location?: string;

  // Optional category for display classification
  category?: HighlightCategory;
};

// ========== Posters & Productions ==========
export type PosterData = {
  title: string;
  posterUrl: string; // path to image
  url: string; // slug for the production (used in link)
};

export type Layout = "landscape" | "portrait";
export type TitlePosition = "bottom-left" | "bottom-center";

export type Production = {
  title: string;
  slug: string;
  year: number;
  location: string;
  festival: string;
  url: UrlString;
  posterUrl: UrlString;
  artists: Record<string, string[]>;
  layout?: Layout;
  titlePosition?: TitlePosition;
};

// ========== Journey Cards ==========
export type HighlightCategory =
  | "DAT Memory"
  | "Creative Work"
  | "What I’m Up To"
  | "What’s Next";

/**
 * JourneyCardType: the shape JourneyCard/JourneyFeed render.
 * Align this with SpotlightUpdate where possible.
 */
export interface JourneyCardType {
  id: string;
  artistId: string;
  headline: string;
  body: string;

  mediaUrl?: string;
  title?: string;

  // Keep category aligned with union to prevent typos
  category?: HighlightCategory;

  story?: string;

  // CTA naming unified with SpotlightUpdate
  ctaText?: string;
  ctaUrl?: string;

  // Sorting
  sortDate?: string; // ISO date
}

export type HighlightCard = {
  headline: string;              // required by HighlightPanel
  mediaUrl?: string;             // make optional (panel handles no media)
  subheadline?: string;          // panel supports it
  body?: string;                 // panel supports it
  ctaLink?: string;              // panel supports it
  evergreen?: boolean;
  expirationDate?: string;

  // If you want categorization, keep it but make it optional
  category?: HighlightCategory;

  // legacy/extra fields are fine to keep optional
  title?: string;                // if you still use it elsewhere
  fallbackCategory?: HighlightCategory;
  story?: string;
  location?: string;
  programName?: string;
  dateAdded?: string;
};


export type CreativeWorkUpdate = {
  tag: "Creative Work";
  headline: string;
  body: string;
  ctaLink?: string;
  mediaUrl?: string;
  evergreen?: boolean;
  dateAdded?: string;
  location?: string;
};

// Full Update object used by some legacy flows / admin / exports
export interface Update {
  profileSlug: string;
  category: string;
  title: string;
  subtitle: string;
  location: string;
  eventDate: string;
  bodyNote: string;
  mediaUrls: string;
  mediaType: string;
  ctaText: string;
  ctaUrl?: string;
  tags: string[];
  evergreen: boolean;
  expirationDate: string;
  featured: boolean;
  sortDate: string;
  updateId: string;
  lastModified: Date | null;
  body?: string;
  ctaLink?: string;
  tag?: string;

  // Optional fields
  program?: string;
  year?: string;
  collaborator?: string;
  partner?: string;
  hidden?: boolean;
  institution?: string;
  externalLink?: string;
  additionalMediaUrls?: string;
  notes?: string;
  timestamp?: number;

  // Story Map fields
  storyMapEligible: boolean;
  storyMapTitle: string;
  storyMapProgram: string;
  storyMapProgramYear: string;
  storyMapLocationName: string;
  storyMapPartners: string;
  storyMapQuote: string;
  storyMapQuoteAuthor: string;
  storyMapShortStory: string;
  storyMapImageMedia?: string;
  storyMapUrl?: string;
  storyMapAuthor: string;
  storyMapAuthorSlug: string;
  storyMapMoreInfoLink?: string;
  storyMapCountry: string;
}

// ID helper with runtime safety across environments
const makeId = (): string => {
  try {
    // Browser / modern Node
    // @ts-ignore-next-line - crypto may be global
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      // @ts-ignore
      return crypto.randomUUID();
    }
  } catch {}
  // Fallback
  return `upd_${Math.random().toString(36).slice(2)}${Date.now()}`;
};

/**
 * Maps a SpotlightUpdate (used in profiles) to a full Update object.
 * This allows Spotlight updates to be reused in components expecting full Update shape.
 */
export function mapSpotlightUpdateToUpdate(
  source: SpotlightUpdate,
  profileSlug = "unknown"
): Update {
  return {
    updateId: makeId(),
    profileSlug,
    category: source.category ?? "What I’m Up To",
    title: source.headline || "Untitled",
    subtitle: source.subheadlineTitle || "",
    location: source.location || "",
    eventDate: source.eventDate || "",

    bodyNote: source.body || "",
    body: source.body || "",
    mediaUrls: source.mediaUrl || "",
    mediaType: "image",

    ctaText: source.ctaText ?? "Learn More",
    ctaUrl: source.ctaLink,
    ctaLink: source.ctaLink,

    tags: source.tag ? [source.tag] : [],
    tag: source.tag,
    evergreen: source.evergreen ?? false,
    expirationDate: "",

    featured: false,
    sortDate: source.sortDate || new Date().toISOString().split("T")[0],
    lastModified: new Date(),

    // Story Map fields - defaults or empty
    storyMapEligible: false,
    storyMapTitle: "",
    storyMapProgram: "",
    storyMapProgramYear: "",
    storyMapLocationName: "",
    storyMapPartners: "",
    storyMapQuote: "",
    storyMapQuoteAuthor: "",
    storyMapShortStory: "",
    storyMapImageMedia: "",
    storyMapUrl: "",
    storyMapAuthor: "",
    storyMapAuthorSlug: "",
    storyMapMoreInfoLink: "",
    storyMapCountry: "",
  };
}
