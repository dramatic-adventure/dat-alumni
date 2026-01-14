// lib/loadSluggedStory.ts
import { normalizeStoryRow } from "./normalizeStoryRow";
import type { StoryRow } from "./types";

/**
 * Find a story by its slug in raw sheet rows.
 * normalizeStoryRow is async (it may canonicalize author slugs),
 * so this function must also be async.
 */
export async function loadSluggedStory(
  slug: string,
  rows: Record<string, string>[],
): Promise<StoryRow | undefined> {
  const normalizedSlug = slug.trim().toLowerCase();

  for (const row of rows) {
    const rowSlug = (row["slug"] ?? "").trim().toLowerCase();
    if (rowSlug === normalizedSlug) {
      const normalized = await normalizeStoryRow(row);
      return normalized ?? undefined;
    }
  }

  return undefined;
}
