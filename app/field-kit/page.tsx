// app/field-kit/page.tsx
//
// Field Kit HOME / Today — the daily landing screen. Reads the program/itinerary
// store via the SHARED server snapshot (lib/itineraryServerSnapshot) so this
// page's rendered hash equals the /api/field-kit/itinerary endpoint's — the
// LiveRefresh sentinel mounted here (Slice 5) never spurious-refreshes at
// steady state. Resolves "today" from the device clock and renders the ported
// V17 Shell subset. Access is gated by app/field-kit/layout.
//
// Slice 5: the mission-board ops modules are REAL here — the current Roll Call
// and Company Choice ride the itinerary payload (offline-precached, LiveRefresh
// -propagated); this device's own answers come from a per-request self lookup +
// the on-device ops state; headcounts/tallies render only for leaders.

import TodayCompanion from "@/components/field-kit/TodayCompanion";
import ImpersonationBanner from "@/components/field-kit/ImpersonationBanner";
import EnableAlertsBanner from "@/components/field-kit/EnableAlertsBanner";
import RallyPointBanner from "@/components/field-kit/RallyPointBanner";
import RollCallCard from "@/components/field-kit/RollCallCard";
import CompanyChoiceCard from "@/components/field-kit/CompanyChoiceCard";
import LiveRefresh from "@/components/field-kit/LiveRefresh";
import { getItinerarySnapshot } from "@/lib/itineraryServerSnapshot";
import type { RollCallStatus } from "@/lib/programItinerary";
import { requireFieldKitPage, FIELD_KIT_PROGRAM_ID } from "@/lib/fieldKitAccess";
import { isFieldKitLeader } from "@/lib/fieldKitLeaders";
import { getRollCallResponses } from "@/lib/rollCall";
import { getCompanyChoiceVotes } from "@/lib/companyChoice";
import { normId } from "@/lib/sheetsResilience";
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

  // Gate + snapshot read are independent (the gate always resolves to this same
  // FIELD_KIT_PROGRAM_ID), so they run concurrently — same shape as before.
  const [access, { itinerary, hash, today: snapshotToday }] = await Promise.all([
    requireFieldKitPage(FIELD_KIT_PROGRAM_ID, asId),
    getItinerarySnapshot(FIELD_KIT_PROGRAM_ID),
  ]);
  if (!access) return null; // not on the roster — the layout renders the gate.
  if (!itinerary) return <TodayEmpty />;

  // Per-user + leader lookups, all TTL-cached underneath and independent of
  // each other — one parallel wave, no waterfall.
  const slug = normId(access.slug);
  const [leader, rollCallResponses, choiceVotes] = await Promise.all([
    isFieldKitLeader(access),
    itinerary.rollCall ? getRollCallResponses(itinerary.rollCall.id) : Promise.resolve([]),
    itinerary.companyChoice ? getCompanyChoiceVotes(itinerary.companyChoice.id) : Promise.resolve([]),
  ]);
  const myStatus: RollCallStatus | "" =
    rollCallResponses.find((r) => normId(r.alumniSlug) === slug)?.status ?? "";
  const mySelection = choiceVotes.find((v) => normId(v.alumniSlug) === slug)?.selection ?? "";

  // "Today" comes from the snapshot (resolved in the program's timezone) so the
  // render always matches the hash LiveRefresh polls — including day rollovers.
  const today = snapshotToday ?? { state: "unknown" as const };
  return (
    <>
      {access.impersonating && <ImpersonationBanner slug={access.slug} />}
      {/* Push opt-in nudge — shows until this device has trip alerts on. */}
      <EnableAlertsBanner programId={access.programId} />
      {itinerary.rallyPoint && <RallyPointBanner rally={itinerary.rallyPoint} />}
      {itinerary.rollCall && (
        <RollCallCard rollCall={itinerary.rollCall} serverMyStatus={myStatus} isLeader={leader} />
      )}
      {itinerary.companyChoice && (
        <CompanyChoiceCard
          choice={itinerary.companyChoice}
          serverMySelection={mySelection}
          isLeader={leader}
        />
      )}
      <TodayCompanion itinerary={itinerary} today={today} />
      {/* Live-refresh sentinel (Slice 5): the ops cards above ride the itinerary
          payload, so a roll call opening or a question posting changes the hash
          and lands here within a poll tick — same mechanism as the itinerary. */}
      <LiveRefresh programId={access.programId} initialHash={hash} label="Today updated" />
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
