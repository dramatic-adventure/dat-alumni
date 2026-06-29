// components/field-kit/CrewCompany.tsx
//
// THE COMPANY — the live crew roster, ported from the V17 mockup
// (cohort/CohortCompany.tsx) onto real profile data. Server component: it only
// renders props (no interactivity this slice). The mockup's Company Choice
// voting, "with you today" presence, roll-call, and DM/contact actions are
// intentionally OMITTED — they have no live data store yet.
//
// Each card is a playbill-style headshot (4:5 actor's framing) linking to the
// member's public profile. Order is staff-first (see lib/loadFieldKitCrew).

import Image from "next/image";
import Link from "next/link";
import { Pill } from "@/components/field-kit/parts";
import { T, FONT } from "@/components/field-kit/tokens";
import type { CrewMember } from "@/lib/loadFieldKitCrew";

/** "Jesse Baxter" → "JB" — placeholder when a member has no headshot. */
function initialsOf(name: string): string {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "·";
}

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

        {/* Roster grid — staff first (loader order) */}
        <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))" }}>
          {members.map((m) => (
            <CrewCard key={m.slug} member={m} />
          ))}
        </div>
      </div>
    </div>
  );
}

function CrewCard({ member }: { member: CrewMember }) {
  return (
    <Link
      href={`/alumni/${member.slug}`}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        textDecoration: "none",
        backgroundColor: T.card,
        border: `1px solid ${T.border}`,
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      {/* 4:5 portrait — actor's-headshot framing */}
      <div style={{ position: "relative", width: "100%", aspectRatio: "4 / 5", backgroundColor: T.paper }}>
        {member.headshotUrl ? (
          <Image
            src={member.headshotUrl}
            alt={member.name}
            fill
            sizes="(max-width: 760px) 50vw, 180px"
            style={{ objectFit: "cover" }}
          />
        ) : (
          <span
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: FONT.anton,
              fontSize: 34,
              letterSpacing: "0.04em",
              color: T.dim,
            }}
          >
            {initialsOf(member.name)}
          </span>
        )}
      </div>

      {/* Name + unioned roles */}
      <div style={{ padding: "0 12px 14px", display: "flex", flexDirection: "column", gap: 7 }}>
        <p style={{ fontFamily: FONT.dm, fontWeight: 700, fontSize: 14, color: T.ink, margin: 0, lineHeight: 1.2 }}>
          {member.name}
        </p>
        {member.roles.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {member.roles.map((role) => (
              <Pill key={role}>{role}</Pill>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
