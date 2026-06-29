// app/field-kit/artist/[slug]/page.tsx
//
// In-app artist screen — opens INSIDE the Field Kit (kit chrome + tab bar) when
// Crew taps a company member, instead of bouncing to the marketing /alumni page.
// A streamlined, crew-facing view of one roster member's PUBLIC profile, scoped
// to the trip's program. Access is gated by app/field-kit/layout AND here
// (defense in depth), mirroring the cohort + itinerary pages.

import { notFound } from "next/navigation";
import ArtistView from "@/components/field-kit/ArtistView";
import { loadFieldKitArtist } from "@/lib/loadFieldKitArtist";
import { requireFieldKitPage, FIELD_KIT_PROGRAM_ID } from "@/lib/fieldKitAccess";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function FieldKitArtistPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Defense in depth: gate BEFORE any profile data is loaded.
  const access = await requireFieldKitPage(FIELD_KIT_PROGRAM_ID);
  if (!access) return null; // not on the roster — the layout renders the gate.

  // Scope strictly to the program whose roster we just verified.
  const artist = await loadFieldKitArtist(access.programId, slug);
  if (!artist) notFound();

  return <ArtistView artist={artist} />;
}
