// app/journeys/[slug]/[cardId]/page.tsx
// A single published Journey Card, opened from the per-alum index or the archive.

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { loadAlumniByAliases } from "@/lib/loadAlumni";
import { getSlugAliases, resolveCanonicalSlug } from "@/lib/slugAliases";
import { loadJourneyCardsForSlug } from "@/lib/loadJourneyCards";
import { withCanonicalSlug } from "@/lib/journeyCard";
import JourneyCardView, { type CardViewAlum } from "@/components/journeys/JourneyCardView";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string; cardId: string }> };

async function load(incomingSlug: string, cardId: string) {
  const canonical = (await resolveCanonicalSlug(incomingSlug)) || incomingSlug;
  const aliases = await getSlugAliases(canonical);
  const [row, cards] = await Promise.all([
    loadAlumniByAliases(aliases),
    loadJourneyCardsForSlug(canonical, aliases),
  ]);
  const found = cards.find((c) => c.id === cardId) ?? null;
  if (!row || !found) return null;
  // Reflect the current canonical slug in links even if the card was published
  // under an older slug.
  const card = withCanonicalSlug(found, canonical);
  const alum: CardViewAlum = {
    name: row.name || canonical,
    slug: row.slug || canonical,
    roles: Array.isArray(row.roles) ? row.roles : [],
    headshotUrl: row.headshotUrl || undefined,
  };
  return { card, alum };
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug, cardId } = await params;
  const data = await load(slug, cardId);
  if (!data) return { title: "Journey Card | DAT" };
  const { card, alum } = data;
  const title = card.title || `${card.program}: ${card.country} ${card.year}`;
  return {
    title: `${title} · ${alum.name} | DAT`,
    description: card.pullQuote || `A Journey Card by ${alum.name} — ${card.programLabel}.`,
  };
}

export default async function JourneyCardPage({ params }: Params) {
  const { slug, cardId } = await params;
  const data = await load(slug, cardId);
  if (!data) notFound();
  return <JourneyCardView card={data.card} alum={data.alum} />;
}
