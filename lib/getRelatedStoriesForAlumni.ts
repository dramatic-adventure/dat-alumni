// lib/getRelatedStoriesForAlumni.ts
import { getStoriesByAlumniSlug } from "./loadRows";
import { StoryRow } from "./types";

export async function getRelatedStoriesForAlumni(slug: string): Promise<StoryRow[]> {
  return await getStoriesByAlumniSlug(slug);
}
