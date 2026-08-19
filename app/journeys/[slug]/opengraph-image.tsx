// app/journeys/[slug]/opengraph-image.tsx
// Share unfurl for an alum's journeys index: the NEWEST card's hero (review/
// audio build §5).

import { notFound } from "next/navigation";
import { loadJourneyCardsForSlug } from "@/lib/loadJourneyCards";
import { getSlugAliases, resolveCanonicalSlug } from "@/lib/slugAliases";
import { journeyOgImage, ogBaseUrl, OG_SIZE } from "@/lib/journeyOgImage";

export const runtime = "nodejs";
// Match the journeys pages: resolve live (see the card OG's note).
export const dynamic = "force-dynamic";
export const alt = "Journey Cards — Dramatic Adventure Theatre";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const canonical = (await resolveCanonicalSlug(slug)) || slug;
  const aliases = await getSlugAliases(canonical).catch(() => undefined);
  const cards = await loadJourneyCardsForSlug(canonical, aliases);
  if (!cards.length) notFound();
  const newest = [...cards].sort((a, b) =>
    String(b.sortDate ?? "").localeCompare(String(a.sortDate ?? ""))
  )[0];
  return journeyOgImage(newest, ogBaseUrl());
}
