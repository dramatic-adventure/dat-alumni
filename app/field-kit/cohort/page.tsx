// app/field-kit/cohort/page.tsx
//
// The Company — the live crew roster for the program. Reads the cluster roster
// (lib/loadFieldKitCrew), resolves each member's name/headshot/roles from live
// profile data, and renders the ported V17 company view. Access is gated by
// app/field-kit/layout AND here (defense in depth), mirroring the Itinerary.

import CrewCompany from "@/components/field-kit/CrewCompany";
import { loadFieldKitCrew } from "@/lib/loadFieldKitCrew";
import { requireFieldKitPage } from "@/lib/fieldKitAccess";
import { programMap } from "@/lib/programMap";
import { T, FONT } from "@/components/field-kit/tokens";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function CohortPage() {
  // Defense in depth: gate BEFORE any roster/profile data is loaded.
  const access = await requireFieldKitPage();
  if (!access) return null; // not on the roster — the layout renders the gate.

  // Scope strictly to the program whose roster we just verified.
  const crew = await loadFieldKitCrew(access.programId);
  if (!crew.length) return <CrewEmpty />;

  const programLabel = programMap[access.programId]?.title || "Field Kit";
  return <CrewCompany members={crew} programLabel={programLabel} />;
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
