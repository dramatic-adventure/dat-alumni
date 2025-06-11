// lib/types.ts

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
  imageUrl?: string;
  author?: string;
  authorSlug?: string;
  moreInfoLink?: string; // ✅ Ensures optional typing
  country?: string;
  regionTag?: string;
  category?: string;
  showOnMap?: string;
  storyId?: string;
  storyUrl?: string;
};

// Alumni profiles
export type AlumniRow = {
  slug: string;
  name: string;
  role?: string;
  location?: string;
  latitude?: string;
  longitude?: string;
  identityTags?: string[];
  programBadges?: string[];
  headshotUrl?: string;
  imageUrls?: string[];
  artistStatement?: string;
  currentWork?: string;
  legacyProductions?: string;
  storyTitle?: string;
  storyThumbnail?: string;
  storyExcerpt?: string;
  storyUrl?: string;
  tags?: string[];
  artistUrl?: string;
  socialLinks?: string[];
  artistEmail?: string;
  updateLink?: string;
  showOnProfile?: string;
  profileId?: string;
  profileUrl?: string;
  fieldNotes?: string[];
  locations?: { lat: number; lng: number; label?: string }[];
};

// Trigger Netlify cache refresh
