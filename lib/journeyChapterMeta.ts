// lib/journeyChapterMeta.ts
//
// The DAT-institutional layer of a Journey Card's chapter pages (v17 mockup
// parity, wired 2026-08-19): each itinerary chapter's authored DESCRIPTION of
// that leg, its drama club (canonical record from lib/dramaClubMap), and its
// partner org (name only — there is no partner store yet, so no fabricated
// links or logos). Joined at RENDER time from the itinerary, never baked into
// chaptersJson: this is DAT's content, kept fresh by editing the sheet, and a
// card whose program has no itinerary simply renders without the layer.
//
// Server-safe, no "use client": called by the public card page and the
// Composer page; the resolved map is plain serializable props for the view.

import { dramaClubMap } from "@/lib/dramaClubMap";
import { partnerOrgName } from "@/components/field-kit/partnerOrgName";
import type { ProgramItinerary } from "@/lib/programItinerary";

export type CardChapterMeta = {
  /** DAT's authored line about this leg of the journey (itinerary column). */
  description?: string;
  club?: { slug: string; name: string; location?: string };
  partnerName?: string;
};

export type CardChapterMetaMap = Record<string, CardChapterMeta>;

export function buildChapterMeta(itinerary: ProgramItinerary | null): CardChapterMetaMap {
  if (!itinerary) return {};
  const out: CardChapterMetaMap = {};
  for (const ch of itinerary.chapters ?? []) {
    const entry: CardChapterMeta = {};
    const description = String(ch.description ?? "").trim();
    if (description) entry.description = description;

    const clubSlug = String(ch.dramaClub ?? "").trim();
    if (clubSlug) {
      const rec = (dramaClubMap as Record<string, { name?: string; city?: string; country?: string; location?: string }>)[clubSlug];
      entry.club = {
        slug: clubSlug,
        name: rec?.name || partnerOrgName(clubSlug),
        location: rec ? [rec.city, rec.country].filter(Boolean).join(", ") || rec.location : undefined,
      };
    }

    const partnerSlug = String(ch.partnerOrg ?? "").trim();
    if (partnerSlug) entry.partnerName = partnerOrgName(partnerSlug);

    if (Object.keys(entry).length) out[ch.id] = entry;
  }
  return out;
}
