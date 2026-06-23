// app/journeys/[slug]/page.tsx
// Per-alum adaptive Journey Card index. The alum profile is just the global
// archive pre-filtered to one person, rendered as the left-aligned adaptive
// index (≤3 editorial · ≥4 rail · passport-stack alternative).
//
// Slug source: reuses the existing alumni slug + the slug-forward/alias
// canonicalization (resolveCanonicalSlug / getSlugAliases), mirroring
// /alumni/[slug], so old/alternate slugs resolve to the current profile.

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { loadAlumniByAliases } from "@/lib/loadAlumni";
import { getSlugAliases, resolveCanonicalSlug } from "@/lib/slugAliases";
import { loadJourneyCardsForSlug } from "@/lib/loadJourneyCards";
import { withCanonicalSlug } from "@/lib/journeyCard";
import { loadRoleAssignments } from "@/lib/loadRoleAssignments";
import { getPrimaryDatRoleForProfile } from "@/lib/profileRoleAssignments";
import AdaptiveProfileJourneys, { type ProfileAlum } from "@/components/journeys/AdaptiveProfileJourneys";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

async function resolveAlum(incoming: string): Promise<{ canonical: string; aliases: Set<string>; alum: ProfileAlum } | null> {
  const canonical = (await resolveCanonicalSlug(incoming)) || incoming;
  const aliases = await getSlugAliases(canonical);
  const row = await loadAlumniByAliases(aliases);
  if (!row) return null;
  return {
    canonical,
    aliases,
    alum: {
      name: row.name || canonical,
      slug: row.slug || canonical,
      roles: Array.isArray(row.roles) ? row.roles : [],
      headshotUrl: row.headshotUrl || undefined,
    },
  };
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const resolved = await resolveAlum(slug);
  const name = resolved?.alum.name ?? slug;
  return {
    title: `${name} · Journeys | DAT`,
    description: `Journey Cards published by ${name} through Dramatic Adventure Theatre.`,
    alternates: { canonical: `/journeys/${resolved?.canonical ?? slug}` },
  };
}

export default async function JourneysForAlumPage({ params }: Params) {
  const { slug } = await params;
  const resolved = await resolveAlum(slug);
  if (!resolved) notFound();

  const [loadedCards, assignments] = await Promise.all([
    loadJourneyCardsForSlug(resolved.canonical, resolved.aliases),
    loadRoleAssignments(),
  ]);
  // Every card here belongs to this alum — link them under the CURRENT slug
  // even if some were published before a slug change.
  const cards = loadedCards.map((c) => withCanonicalSlug(c, resolved.canonical));

  // Fallback shown under the name when the alum has no Journey Cards yet:
  // their most current DAT title (top ordered DAT role, else their first role).
  const currentTitle = getPrimaryDatRoleForProfile(resolved.canonical, resolved.alum.roles, assignments);

  return <AdaptiveProfileJourneys alum={{ ...resolved.alum, currentTitle }} cards={cards} />;
}
