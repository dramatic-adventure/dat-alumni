import { normalizeStoryRow } from "./normalizeStoryRow";
import type { StoryRow } from "./types";

export function loadSluggedStory(
  slug: string,
  rows: Record<string, string>[]
): StoryRow | undefined {
  const normalizedSlug = slug.trim().toLowerCase();

  for (const row of rows) {
    if (row["slug"]?.trim().toLowerCase() === normalizedSlug) {
      return normalizeStoryRow(row) || undefined;
    }
  }

  return undefined;
}
