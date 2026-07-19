// app/field-kit/itinerary/page.tsx
//
// The Itinerary — the live field document. Reads the program/itinerary store
// (Field Kit tabs) via lib/loadProgram, resolves "today" from the device clock,
// and renders the ported V17 spine. Access is gated by app/field-kit/layout.

import ItineraryCompanion from "@/components/field-kit/ItineraryCompanion";
import ImpersonationBanner from "@/components/field-kit/ImpersonationBanner";
import ItineraryView from "@/components/field-kit/ItineraryView";
import ItineraryPrivacyNotice from "@/components/field-kit/ItineraryPrivacyNotice";
import LiveRefresh from "@/components/field-kit/LiveRefresh";
import { getItinerarySnapshot } from "@/lib/itineraryServerSnapshot";
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

  // Gate + snapshot read are independent (the gate always resolves to this
  // same FIELD_KIT_PROGRAM_ID), so run them concurrently rather than waiting
  // on the gate's Sheets round-trip before starting the snapshot's.
  // Render through the SHARED server snapshot so this page's hash equals the
  // /api endpoint's (no spurious live-refresh); the page trails live edits by
  // ≤ the snapshot TTL, which is the accepted trade.
  const [access, { itinerary, hash, today: snapshotToday }] = await Promise.all([
    requireFieldKitPage(FIELD_KIT_PROGRAM_ID, asId),
    getItinerarySnapshot(FIELD_KIT_PROGRAM_ID),
  ]);
  if (!access) return null; // not on the roster — the layout renders the gate.
  if (!itinerary) return <ItineraryEmpty />;

  // "Today" comes from the snapshot (resolved in the program's timezone) so the
  // render always matches the hash LiveRefresh polls — including day rollovers.
  const today = snapshotToday ?? { state: "unknown" as const };
  return (
    <>
      {access.impersonating && <ImpersonationBanner slug={access.slug} />}
      {/* One-time privacy heads-up on first open of the itinerary (per device). */}
      <ItineraryPrivacyNotice programId={access.programId} />
      {/* ItineraryView keeps online users on the live path below; if the device
          is offline it swaps in the on-device snapshot instead (and back on
          reconnect). The snapshot is never shown to an online user. */}
      <ItineraryView programId={access.programId}>
        <ItineraryCompanion itinerary={itinerary} today={today} />
        {/* Live-refresh sentinel: keeps this page current while online without a
            manual reload. ItineraryCompanion above stays the single renderer; this
            only watches the canonical /api/field-kit/itinerary hash and triggers a
            router.refresh() + "Updated" banner when the published itinerary changes.
            It also writes the on-device snapshot on every successful fetch. */}
        <LiveRefresh programId={access.programId} initialHash={hash} />
      </ItineraryView>
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
