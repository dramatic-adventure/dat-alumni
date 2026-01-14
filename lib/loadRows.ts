// lib/loadRows.ts  (or wherever this file lives)

import { cache } from "react";
import { fetchStories } from "./fetchStories";
import { StoryRow } from "./types";
import { getSlugAliases, normSlug } from "@/lib/slugAliases";

// 🔄 Cached story fetcher
const loadRows = cache(async (): Promise<StoryRow[]> => {
  // IMPORTANT: fetchStories() must already return normalized StoryRow[]
  // (see notes below)
  return await fetchStories();
});

export default loadRows;

// 🔍 Lookup by alumni author slug (CANON + alias aware)
export async function getStoriesByAlumniSlug(slug: string): Promise<StoryRow[]> {
  const incoming = normSlug(slug);
  if (!incoming) return [];

  // canonical + all aliases
  const aliases = await getSlugAliases(incoming);
  const aliasSet = new Set(Array.from(aliases).map((s) => normSlug(s)));

  const rows = await loadRows();
  return rows.filter((row) => {
    const a = normSlug((row as any)?.authorSlug);
    return a ? aliasSet.has(a) : false;
  });
}

// ✅ Fetch all stories
export const getAllStories = async (): Promise<StoryRow[]> => {
  return await loadRows();
};
