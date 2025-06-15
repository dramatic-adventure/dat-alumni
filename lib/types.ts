// lib/types.ts

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


// ========== Alumni Profile Rows ==========

export type AlumniRow = {
  slug: string;
  name: string;
  role?: string;
  location?: string;
  latitude?: string;
  longitude?: string;
  identityTags?: string[];
  programBadges?: string[];
  headshotUrl?: UrlString;
  imageUrls?: UrlString[];
  posterUrls?: string[]; // ✅ Local paths to poster images
  artistStatement?: string;
  currentWork?: string;
  legacyProductions?: string;
  storyTitle?: string;
  storyThumbnail?: UrlString;
  storyExcerpt?: string;
  storyUrl?: UrlString;
  tags?: string[];
  artistUrl?: UrlString;
  socialLinks?: UrlString[];
  artistEmail?: string;
  updateLink?: UrlString;
  showOnProfile?: string;
  profileId?: string;
  profileUrl?: UrlString;
  fieldNotes?: string[];
  locations?: GeoLocation[];
  statusFlags?: string[];
};
