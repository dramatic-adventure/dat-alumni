// app/field-kit/itinerary/page.tsx
//
// The Itinerary — the live field document. Reads the program/itinerary store
// (Field Kit tabs) via lib/loadProgram, resolves "today" from the device clock,
// and renders the ported V17 spine. Access is gated by app/field-kit/layout.

import ItineraryCompanion from "@/components/field-kit/ItineraryCompanion";
import ImpersonationBanner from "@/components/field-kit/ImpersonationBanner";
import LiveRefresh from "@/components/field-kit/LiveRefresh";
import { loadProgramItinerary } from "@/lib/loadProgram";
import { resolveToday, hashItinerary } from "@/lib/programItinerary";
import { requireFieldKitPage, FIELD_KIT_PROGRAM_ID } from "@/lib/fieldKitAccess";
import { T, FONT } from "@/components/field-kit/tokens";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function ItineraryPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = searchParams ? await searchParams : undefined;
  const asId = Array.isArray(sp?.asId) ? sp?.asId[0] : sp?.asId;

  // Defense in depth: gate BEFORE any program/itinerary data is loaded.
  const access = await requireFieldKitPage(FIELD_KIT_PROGRAM_ID, asId);
  if (!access) return null; // not on the roster — the layout renders the gate.

  // Scope strictly to the program whose roster we just verified — never fall
  // back to "the active program", which could belong to a different roster.
  const itinerary = await loadProgramItinerary(access.programId);
  if (!itinerary) return <ItineraryEmpty />;

  const today = resolveToday(itinerary);
  return (
    <>
      {access.impersonating && <ImpersonationBanner slug={access.slug} />}
      <ItineraryCompanion itinerary={itinerary} today={today} />
      {/* Live-refresh sentinel: keeps this page current while online without a
          manual reload. ItineraryCompanion above stays the single renderer; this
          only watches the canonical /api/field-kit/itinerary hash and triggers a
          router.refresh() + "Updated" banner when the published itinerary changes. */}
      <LiveRefresh programId={access.programId} initialHash={hashItinerary(itinerary)} />
    </>
  );
}

function ItineraryEmpty() {
  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "72px clamp(18px, 5vw, 40px)", textAlign: "center" }}>
      <p style={{ fontFamily: FONT.grotesk, fontWeight: 700, fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase", color: T.teal, margin: "0 0 12px" }}>
        The Journey
      </p>
      <h1 style={{ fontFamily: FONT.anton, fontSize: "clamp(28px, 6.5vw, 48px)", lineHeight: 0.96, textTransform: "uppercase", color: T.ink, margin: "0 0 16px" }}>
        Itinerary not published yet.
      </h1>
      <p style={{ fontFamily: FONT.dm, fontSize: 14.5, lineHeight: 1.55, color: T.ink, opacity: 0.78, margin: 0 }}>
        Once the program&apos;s itinerary is in the Field Kit tabs, the day-by-day journey shows up here —
        chapters, days, schedules, and today highlighted.
      </p>
    </main>
  );
}
