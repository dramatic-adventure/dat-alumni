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

  // ✅ Add these two for updates feature
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
  updates?: SpotlightUpdate[];


  email?: string;
  website?: string;
  socials?: string[];
  hasContactInfo?: boolean;
}


// ========== Updates ==========
export type SpotlightUpdate = {
  tag?: string;
  headline: string;
  subheadlineTitle?: string;
  subheadlineDescription?: string;
  body: string;
  ctaLink?: string;
  mediaUrl?: string;
  evergreen?: boolean;
  ctaText?: string;
  eventDate?: string;
  sortDate?: string;
  location?: string;
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
  url: UrlString; // rarely used directly, but defined
  posterUrl: UrlString; // optional if needed outside poster component
  artists: Record<string, string[]>;
  layout?: Layout;
  titlePosition?: TitlePosition;
};


// ========== Journey Cards ==========
export type HighlightCategory = "DAT Memory" | "Creative Work" | "What I’m Up To" | "What’s Next";

export type HighlightCard = {
  title: string;
  headline: string; // ✅ Required by HighlightPanel
  mediaUrl: string;
  category: HighlightCategory;
  expirationDate?: string;
  fallbackCategory?: HighlightCategory;
  evergreen?: boolean;
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




/**
 * Maps a SpotlightUpdate (used in profiles) to a full Update object.
 * This allows Spotlight updates to be reused in components expecting full Update shape.
 */
export function mapSpotlightUpdateToUpdate(source: SpotlightUpdate, profileSlug = "unknown"): Update {
  return {
    updateId: crypto.randomUUID(),
    profileSlug,
    category: "What I’m Up To",
    title: source.headline || "Untitled",
    subtitle: source.subheadlineTitle || "",
    location: source.location || "",
    eventDate: "",

    bodyNote: source.body || "",
    body: source.body || "",
    mediaUrls: source.mediaUrl || "",
    mediaType: "image",

    ctaText: "Learn More",
    ctaUrl: source.ctaLink,
    ctaLink: source.ctaLink,

    tags: source.tag ? [source.tag] : [],
    tag: source.tag,
    evergreen: source.evergreen ?? false,
    expirationDate: "",

    featured: false,
    sortDate: new Date().toISOString().split("T")[0],
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
