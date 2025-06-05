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

// Optional: for future Alumni profiles
export interface AlumniProfileRow {
  slug: string;
  name: string;
  role?: string;
  photo?: string;
  story?: string;
  currentWork?: string;
  datProductions?: string;
  location?: string;
  hashtags?: string;
  legacyProjects?: string;
}
