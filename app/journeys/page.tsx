// app/journeys/page.tsx
// The global, searchable Journey Archive — every published Journey Card across
// all profiles. Default view is most-recently-added; facets group by person /
// country / program / project.

import type { Metadata } from "next";
import { loadAllJourneyCards } from "@/lib/loadJourneyCards";
import { loadVisibleAlumni, loadSlugForwardMap } from "@/lib/loadAlumni";
import { withCanonicalSlug } from "@/lib/journeyCard";
import JourneyArchive, { type AlumniDirectory } from "@/components/journeys/JourneyArchive";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "The Journey Archive | DAT",
  description:
    "Every Journey Card published by Dramatic Adventure Theatre's traveling artists — searchable by person, country, program, and project.",
  alternates: { canonical: "/journeys" },
};

const lc = (s: string) => String(s ?? "").trim().toLowerCase();

export default async function JourneysArchivePage() {
  const [loadedCards, alumni, forwardMap] = await Promise.all([
    loadAllJourneyCards(),
    loadVisibleAlumni(),
    loadSlugForwardMap(),
  ]);

  // Forward each card's stored slug to the alum's CURRENT slug (follow the
  // forward chain), so links + by-person grouping stay correct after a slug change.
  const fwd: Record<string, string> = {};
  for (const [from, to] of Object.entries(forwardMap)) fwd[lc(from)] = lc(to);
  const chase = (slug: string): string => {
    let s = lc(slug);
    const seen = new Set<string>();
    while (fwd[s] && !seen.has(s)) { seen.add(s); s = fwd[s]; }
    return s;
  };
  const cards = loadedCards.map((c) => withCanonicalSlug(c, chase(c.profileSlug)));

  const dir: AlumniDirectory = {};
  for (const a of alumni) {
    if (!a.slug) continue;
    dir[lc(a.slug)] = {
      name: a.name || a.slug,
      role: Array.isArray(a.roles) ? a.roles[0] : undefined,
      headshot: a.headshotUrl || undefined,
    };
  }

  return <JourneyArchive cards={cards} alumni={dir} />;
}
