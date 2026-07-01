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

  // Gate + artist read are independent (the gate always resolves to this same
  // FIELD_KIT_PROGRAM_ID), so run them concurrently rather than waiting on the
  // gate's Sheets round-trip before starting the profile's.
  const [access, artist] = await Promise.all([
    requireFieldKitPage(FIELD_KIT_PROGRAM_ID),
    loadFieldKitArtist(FIELD_KIT_PROGRAM_ID, slug),
  ]);
  if (!access) return null; // not on the roster — the layout renders the gate.
  if (!artist) notFound();

  return <ArtistView artist={artist} />;
}
