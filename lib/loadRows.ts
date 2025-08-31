import { cache } from "react";
import { fetchStories } from "./fetchStories";
import { StoryRow } from "./types";

// 🔄 Cached story fetcher
const loadRows = cache(async (): Promise<StoryRow[]> => {
  return await fetchStories();
});

export default loadRows;

// 🔍 Lookup by alumni author slug
export async function getStoriesByAlumniSlug(slug: string): Promise<StoryRow[]> {
  const rows = await loadRows();
  return rows.filter((row) => row.authorSlug === slug);
}

// ✅ NEW: Fetch all stories
export const getAllStories = async (): Promise<StoryRow[]> => {
  return await loadRows();
};
