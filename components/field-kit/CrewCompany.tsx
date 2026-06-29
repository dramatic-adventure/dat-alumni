// components/field-kit/CrewCompany.tsx
//
// THE COMPANY — the live crew roster, ported from the V17 mockup
// (cohort/CohortCompany.tsx) onto real profile data. Server component: it only
// renders props (no interactivity this slice). The mockup's Company Choice
// voting, "with you today" presence, roll-call, and DM/contact actions are
// intentionally OMITTED — they have no live data store yet.
//
// Each member renders with the directory's MiniProfileCard (variant "dark" —
// cream type on the field-kit's dark theme), so the headshots match the rest of
// the site: a flat 4:5 portrait with the name + single top DAT role beneath, and
// the shared /images/default-headshot.png fallback when a member has no photo.
// Order is staff-first (see lib/loadFieldKitCrew).

import MiniProfileCard from "@/components/profile/MiniProfileCard";
import { T, FONT } from "@/components/field-kit/tokens";
import type { CrewMember } from "@/lib/loadFieldKitCrew";

export default function CrewCompany({
  members,
  programLabel,
}: {
  members: CrewMember[];
  programLabel: string;
}) {
  const count = members.length;

  return (
    <div style={{ padding: "32px clamp(14px, 4vw, 56px) 40px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        {/* Masthead — matches ItineraryCompanion's type scale */}
        <p style={{ fontFamily: FONT.grotesk, fontWeight: 700, fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase", color: T.teal, margin: "0 0 10px" }}>
          {programLabel} · The Company
        </p>
        <h1 style={{ fontFamily: FONT.anton, fontSize: "clamp(34px, 6.5vw, 70px)", lineHeight: 0.92, textTransform: "uppercase", color: T.ink, margin: "0 0 14px" }}>
          The Company.
        </h1>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 30, paddingBottom: 22, borderBottom: `1px solid ${T.sep}` }}>
          <span aria-hidden style={{ display: "inline-block", width: 26, height: 2, marginTop: 9, backgroundColor: T.pink, borderRadius: 1, flexShrink: 0 }} />
          <p style={{ fontFamily: FONT.dm, fontStyle: "italic", fontSize: "clamp(14px, 1.7vw, 18px)", color: T.ink, opacity: 0.84, margin: 0, lineHeight: 1.45 }}>
            {count} {count === 1 ? "artist" : "artists"} on the company — the people you&apos;re making this with.
          </p>
        </div>

        {/* Roster grid — staff first (loader order), directory-style mini cards */}
        <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fill, minmax(144px, 1fr))" }}>
          {members.map((m) => (
            <MiniProfileCard
              key={m.slug}
              name={m.name}
              role={m.role}
              slug={m.slug}
              headshotUrl={m.headshotUrl || ""}
              href={`/field-kit/artist/${m.slug}`}
              variant="dark"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
