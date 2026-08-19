// app/journeys/[slug]/[cardId]/opengraph-image.tsx
// Share unfurl for a single Journey Card: hero full-bleed + program label +
// title + DAT line (review/audio build §5).

import { notFound } from "next/navigation";
import { loadJourneyCardsForSlug } from "@/lib/loadJourneyCards";
import { getSlugAliases, resolveCanonicalSlug } from "@/lib/slugAliases";
import { journeyOgImage, ogBaseUrl, OG_SIZE } from "@/lib/journeyOgImage";

export const runtime = "nodejs";
// Match the card page: cards resolve live (takedowns, slug moves). Scrapers hit
// this rarely; the sheet loaders carry their own caching.
export const dynamic = "force-dynamic";
export const alt = "A Journey Card — Dramatic Adventure Theatre";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string; cardId: string }>;
}) {
  const { slug, cardId } = await params;
  const canonical = (await resolveCanonicalSlug(slug)) || slug;
  const aliases = await getSlugAliases(canonical).catch(() => undefined);
  const cards = await loadJourneyCardsForSlug(canonical, aliases);
  const card = cards.find((c) => c.id === cardId);
  if (!card) notFound();
  return journeyOgImage(card, ogBaseUrl());
}
