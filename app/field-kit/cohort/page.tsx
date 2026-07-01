// app/field-kit/cohort/page.tsx
//
// The Company — the live crew roster for the program. Reads the cluster roster
// (lib/loadFieldKitCrew), resolves each member's name/headshot/roles from live
// profile data, and renders the ported V17 company view. Access is gated by
// app/field-kit/layout AND here (defense in depth), mirroring the Itinerary.

import CrewCompany from "@/components/field-kit/CrewCompany";
import ImpersonationBanner from "@/components/field-kit/ImpersonationBanner";
import { loadFieldKitCrew } from "@/lib/loadFieldKitCrew";
import { requireFieldKitPage, FIELD_KIT_PROGRAM_ID } from "@/lib/fieldKitAccess";
import { programMap } from "@/lib/programMap";
import { T, FONT } from "@/components/field-kit/tokens";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function CohortPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = searchParams ? await searchParams : undefined;
  const asId = Array.isArray(sp?.asId) ? sp?.asId[0] : sp?.asId;

  // Gate + crew read are independent (the gate always resolves to this same
  // FIELD_KIT_PROGRAM_ID), so run them concurrently rather than waiting on the
  // gate's Sheets round-trip before starting the roster's.
  const [access, crew] = await Promise.all([
    requireFieldKitPage(FIELD_KIT_PROGRAM_ID, asId),
    loadFieldKitCrew(FIELD_KIT_PROGRAM_ID),
  ]);
  if (!access) return null; // not on the roster — the layout renders the gate.
  if (!crew.length) return <CrewEmpty />;

  const programLabel = programMap[access.programId]?.title || "Field Kit";
  return (
    <>
      {access.impersonating && <ImpersonationBanner slug={access.slug} />}
      <CrewCompany members={crew} programLabel={programLabel} />
    </>
  );
}

function CrewEmpty() {
  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "72px clamp(18px, 5vw, 40px)", textAlign: "center" }}>
      <p style={{ fontFamily: FONT.grotesk, fontWeight: 700, fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase", color: T.teal, margin: "0 0 12px" }}>
        The Company
      </p>
      <h1 style={{ fontFamily: FONT.anton, fontSize: "clamp(28px, 6.5vw, 48px)", lineHeight: 0.96, textTransform: "uppercase", color: T.ink, margin: "0 0 16px" }}>
        Roster not published yet.
      </h1>
      <p style={{ fontFamily: FONT.dm, fontSize: 14.5, lineHeight: 1.55, color: T.ink, opacity: 0.78, margin: 0 }}>
        Once the program&apos;s artists are on the roster, the full company shows up here —
        every member, their role, and a link to their profile.
      </p>
    </main>
  );
}
