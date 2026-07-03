// app/alumni/journey-card/create/page.tsx
//
// Retroactive Journey Card creation (Slice 6) — for DAT artists from the 20
// years of travel before the Companion existed. Ported from the approved mockup
// retroactive/RetroactiveJourneyCard.tsx at the route that mockup itself
// suggested (/alumni/journey-card/create).
//
// Gate (§4-R Q4, locked with Jesse 2026-07-02): authenticated alumni-profile
// owner AND on the programMap roster of the program they're building for —
// its own check via lib/retroJourneyAccess, deliberately distinct from
// fieldKitAccess's in-program logic (the trip is over; there is no "in-program").
// The program picker only ever offers programs the signed-in artist was on.

import { redirect } from "next/navigation";
import RetroactiveClient from "@/components/journey-card/RetroactiveClient";
import { getRetroJourneyAccess } from "@/lib/retroJourneyAccess";
import { KRAFT_PAGE, T, FONT } from "@/components/field-kit/tokens";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function RetroactiveJourneyCardPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = searchParams ? await searchParams : undefined;
  const asId = Array.isArray(sp?.asId) ? sp?.asId[0] : sp?.asId;

  const access = await getRetroJourneyAccess(asId);
  if (!access.allowed) {
    if (access.reason === "signed-out") redirect(access.loginUrl);
    return <NoProfileGate />;
  }

  return (
    <div style={{ ...KRAFT_PAGE, minHeight: "100vh" }}>
      <RetroactiveClient
        slug={access.slug}
        asId={access.impersonating ? access.slug : undefined}
        programs={access.programs}
      />
    </div>
  );
}

function NoProfileGate() {
  return (
    <div style={{ ...KRAFT_PAGE, minHeight: "100vh" }}>
      <main style={{ maxWidth: 560, margin: "0 auto", padding: "88px clamp(18px, 5vw, 40px)", textAlign: "center" }}>
        <p style={{ fontFamily: FONT.grotesk, fontWeight: 700, fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase", color: T.grape, margin: "0 0 12px" }}>
          Alum-only · Retroactive Journey Card
        </p>
        <h1 style={{ fontFamily: FONT.anton, fontSize: "clamp(30px, 6.5vw, 52px)", lineHeight: 0.95, textTransform: "uppercase", color: T.ink, margin: "0 0 16px" }}>
          This space is for DAT alumni.
        </h1>
        <p style={{ fontFamily: FONT.dm, fontSize: 14.5, lineHeight: 1.6, color: T.ink, opacity: 0.8, margin: 0 }}>
          We couldn&apos;t find an alumni profile connected to this account. If you traveled with
          DAT, sign in with the email that owns your profile — or reach out and we&apos;ll connect
          it for you.
        </p>
      </main>
    </div>
  );
}
