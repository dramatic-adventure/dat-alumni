// lib/journeyChapterMeta.ts
//
// The DAT-institutional layer of a Journey Card's chapter pages (v17 mockup
// parity, wired 2026-08-19): each itinerary chapter's authored DESCRIPTION of
// that leg, its drama club(s) (canonical records from lib/dramaClubMap), and
// its partner org(s) (lib/partnerOrgs — logos from the repo; URL only when
// verified). Joined at RENDER time from the itinerary, never baked into
// chaptersJson: this is DAT's content, kept fresh by editing the sheet, and a
// card whose program has no itinerary simply renders without the layer.
//
// dramaClub / partnerOrg sheet columns accept COMMA-SEPARATED slugs — a
// chapter can carry several (e.g. ZT Youth Ensemble + Luník IX Collective).
//
// Server-safe, no "use client": called by the public card page and the
// Composer page; the resolved map is plain serializable props for the view.

import { dramaClubMap } from "@/lib/dramaClubMap";
import { PARTNER_ORGS } from "@/lib/partnerOrgs";
import { partnerOrgName } from "@/components/field-kit/partnerOrgName";
import type { ProgramItinerary } from "@/lib/programItinerary";

export type CardChapterMeta = {
  /** DAT's authored line about this leg (itinerary column) — written as the
   *  PLAN (present/future tense), so the view frames it as the plan-as-written. */
  description?: string;
  clubs?: { slug: string; name: string; location?: string }[];
  partners?: { slug: string; name: string; logo?: string; logoBg?: string; url?: string }[];
};

export type CardChapterMetaMap = Record<string, CardChapterMeta>;

const slugs = (v: unknown): string[] =>
  String(v ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

export function buildChapterMeta(itinerary: ProgramItinerary | null): CardChapterMetaMap {
  if (!itinerary) return {};
  const out: CardChapterMetaMap = {};
  for (const ch of itinerary.chapters ?? []) {
    const entry: CardChapterMeta = {};
    const description = String(ch.description ?? "").trim();
    if (description) entry.description = description;

    const clubs = slugs(ch.dramaClub).map((slug) => {
      const rec = (dramaClubMap as Record<string, { name?: string; city?: string; country?: string; location?: string }>)[slug];
      return {
        slug,
        name: rec?.name || partnerOrgName(slug),
        location: rec ? [rec.city, rec.country].filter(Boolean).join(", ") || rec.location : undefined,
      };
    });
    if (clubs.length) entry.clubs = clubs;

    const partners = slugs(ch.partnerOrg).map((slug) => {
      const rec = PARTNER_ORGS[slug];
      return {
        slug,
        name: rec?.name || partnerOrgName(slug),
        logo: rec?.logo,
        logoBg: rec?.logoBg,
        url: rec?.url,
      };
    });
    if (partners.length) entry.partners = partners;

    if (Object.keys(entry).length) out[ch.id] = entry;
  }
  return out;
}
