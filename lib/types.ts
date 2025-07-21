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
  role?: string;        
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

  email?: string;
  website?: string;
  socials?: string[];
  hasContactInfo?: boolean;
}


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
