// app/field-kit/page.tsx
//
// Field Kit HOME / Today — the daily landing screen. Reads the program/itinerary
// store (Field Kit tabs) via lib/loadProgram, resolves "today" from the device
// clock, and renders the ported V17 Shell subset. Access is gated by
// app/field-kit/layout. Mirrors app/field-kit/itinerary/page.tsx.

import TodayCompanion from "@/components/field-kit/TodayCompanion";
import ImpersonationBanner from "@/components/field-kit/ImpersonationBanner";
import RallyPointBanner from "@/components/field-kit/RallyPointBanner";
import { loadProgramItinerary } from "@/lib/loadProgram";
import { resolveToday } from "@/lib/programItinerary";
import { requireFieldKitPage, FIELD_KIT_PROGRAM_ID } from "@/lib/fieldKitAccess";
import { T, FONT } from "@/components/field-kit/tokens";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function FieldKitHome({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = searchParams ? await searchParams : undefined;
  const asId = Array.isArray(sp?.asId) ? sp?.asId[0] : sp?.asId;

  // Defense in depth, still: nothing below is rendered until access.allowed is
  // checked. But the itinerary read no longer WAITS on the gate — the gate
  // always resolves to this same FIELD_KIT_PROGRAM_ID (getFieldKitAccess
  // returns the programId it was called with), so the two Sheets round-trips
  // are independent and run concurrently instead of serially.
  const [access, itinerary] = await Promise.all([
    requireFieldKitPage(FIELD_KIT_PROGRAM_ID, asId),
    loadProgramItinerary(FIELD_KIT_PROGRAM_ID),
  ]);
  if (!access) return null; // not on the roster — the layout renders the gate.
  if (!itinerary) return <TodayEmpty />;

  const today = resolveToday(itinerary);
  return (
    <>
      {access.impersonating && <ImpersonationBanner slug={access.slug} />}
      {itinerary.rallyPoint && <RallyPointBanner rally={itinerary.rallyPoint} />}
      <TodayCompanion itinerary={itinerary} today={today} />
    </>
  );
}

function TodayEmpty() {
  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "72px clamp(18px, 5vw, 40px)", textAlign: "center" }}>
      <p style={{ fontFamily: FONT.grotesk, fontWeight: 700, fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase", color: T.teal, margin: "0 0 12px" }}>
        Field Kit
      </p>
      <h1 style={{ fontFamily: FONT.anton, fontSize: "clamp(28px, 6.5vw, 48px)", lineHeight: 0.96, textTransform: "uppercase", color: T.ink, margin: "0 0 16px" }}>
        Itinerary not published yet.
      </h1>
      <p style={{ fontFamily: FONT.dm, fontSize: 14.5, lineHeight: 1.55, color: T.ink, opacity: 0.78, margin: 0 }}>
        Once the program&apos;s itinerary is in the Field Kit tabs, today&apos;s schedule, chapter, and prep
        show up here — auto-selected from the trip calendar.
      </p>
    </main>
  );
}
