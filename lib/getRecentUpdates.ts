// lib/getRecentUpdates.ts
import { AlumniRow } from "./types";

export function getRecentUpdates(
  alumni: AlumniRow[],
  limit = 5
): { message: string; slug: string }[] {
  // Sort by lastModified descending
  const sorted = [...alumni]
    .filter(a => a.lastModified)
    .sort((a, b) => b.lastModified!.getTime() - a.lastModified!.getTime());

  const updates: { message: string; slug: string }[] = [];
  const seen = new Set<string>();

  for (const a of sorted) {
    if (updates.length >= limit) break;
    if (seen.has(a.slug)) continue; // Ensure unique artists

    // ✅ Smart reason logic (priority)
    let reason = "updated their profile";
    if (a.programBadges.length > 0) {
      reason = `joined ${a.programBadges[0]}`;
    } else if (a.headshotUrl) {
      reason = "added a new headshot";
    } else if (a.roles.length > 0) {
      reason = `updated role to ${a.roles.join(", ")}`;
    }

    updates.push({
      message: `${a.name} ${reason}`,
      slug: a.slug
    });
    seen.add(a.slug);
  }

  return updates;
}
