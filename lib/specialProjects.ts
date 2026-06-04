// lib/specialProjects.ts
import type { DonationSelectOption } from "@/lib/donations";
import { programMap } from "@/lib/programMap";
import {
  upcomingEvents,
  isElapsed,
  isCommunityShowcase,
  seasonNumberFor,
} from "@/lib/events";

export type SpecialProject = {
  id: string; // stable id used in URLs / query params
  title: string;
  subline?: string;
  is_active: boolean;
};

/**
 * Manually-curated one-off special projects (urgent appeals, etc.).
 * These are merged with current/upcoming programs + events below.
 */
export const specialProjects: SpecialProject[] = [
  // Example:
  // {
  //   id: "ecuador-earthquake-relief",
  //   title: "Ecuador Artist Relief",
  //   subline: "Rapid response for artists after disaster.",
  //   is_active: true,
  // },
];

/**
 * "Sponsor a Special Project" options, composed from real, current data:
 *   1. programMap programs for the current and upcoming seasons.
 *   2. Upcoming festival + community (fundraiser) events.
 *   3. Community showcases (which fit both this and the new-work mode).
 *   + any manually-curated active specialProjects above.
 * Deduped by id and sorted by label.
 */
export function getActiveSpecialProjects(): DonationSelectOption[] {
  const byId = new Map<string, DonationSelectOption>();

  // Manual special projects first (lowest priority — programs/events can refine).
  for (const p of specialProjects) {
    if (!p.is_active) continue;
    byId.set(p.id, {
      id: p.id,
      label: p.title,
      ...(p.subline ? { subline: p.subline } : {}),
    });
  }

  // 1) Programs for the current and upcoming seasons.
  // Programs have no day-level dates, so approximate "not yet passed" at the
  // season level: include programs where program.season >= currentSeason.
  const currentSeason = seasonNumberFor(new Date().toISOString().slice(0, 10));
  for (const program of Object.values(programMap)) {
    if (program.season < currentSeason) continue;
    if (!byId.has(program.slug)) {
      byId.set(program.slug, { id: program.slug, label: program.title });
    }
  }

  // 2 + 3) Upcoming festival / community events and community showcases.
  for (const e of upcomingEvents) {
    if (isElapsed(e)) continue;
    const isFestivalOrCommunity =
      e.category === "festival" || e.category === "fundraiser";
    if (isFestivalOrCommunity || isCommunityShowcase(e)) {
      if (!byId.has(e.id)) byId.set(e.id, { id: e.id, label: e.title });
    }
  }

  return Array.from(byId.values()).sort((a, b) => a.label.localeCompare(b.label));
}
