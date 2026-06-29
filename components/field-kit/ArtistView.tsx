// components/field-kit/ArtistView.tsx
//
// In-app artist screen body — a STREAMLINED, crew-facing view of one roster
// member's public profile, rendered in the Field Kit's dark theatrical chrome
// (the layout supplies the top bar + bottom tab bar). NOT a mirror of the full
// marketing /alumni profile: just the headshot, top DAT role, this trip's
// role(s), bio, location, and public links — each section omitted when empty.
// Server component (renders props only; no interactivity). The headshot is the
// SAME resolved src the Crew roster uses (lib/loadFieldKitArtist), rendered
// large here rather than via the small MiniProfileCard.

import Image from "next/image";
import Link from "next/link";
import { T, FONT } from "@/components/field-kit/tokens";
import { Pill } from "@/components/field-kit/parts";
import type { FieldKitArtist } from "@/lib/loadFieldKitArtist";

const DEFAULT_HEADSHOT = "/images/default-headshot.png";

export default function ArtistView({ artist }: { artist: FieldKitArtist }) {
  const { slug, name, headshotUrl, topRole, programRoles, bio, location, links } = artist;

  return (
    <div style={{ padding: "20px clamp(14px, 4vw, 56px) 48px" }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        {/* ← Crew — back into the company roster */}
        <Link
          href="/field-kit/cohort"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontFamily: FONT.grotesk,
            fontWeight: 700,
            fontSize: 11,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: T.teal,
            textDecoration: "none",
            marginBottom: 22,
          }}
        >
          ← Crew
        </Link>

        {/* Headshot — large 4:5 portrait, same resolved src as the Crew roster */}
        <div
          style={{
            position: "relative",
            width: "100%",
            maxWidth: 320,
            aspectRatio: "4 / 5",
            overflow: "hidden",
            backgroundColor: T.card,
            boxShadow: "2px 3px 10px rgba(14,10,19,0.5)",
            marginBottom: 22,
          }}
        >
          <Image
            src={headshotUrl || DEFAULT_HEADSHOT}
            alt={`${name}${topRole ? ` — ${topRole}` : ""}`}
            fill
            sizes="(max-width: 640px) 100vw, 320px"
            style={{ objectFit: "cover" }}
            priority
          />
        </div>

        {/* Name + top DAT role */}
        <h1
          style={{
            fontFamily: FONT.anton,
            fontSize: "clamp(34px, 7vw, 60px)",
            lineHeight: 0.94,
            textTransform: "uppercase",
            color: T.ink,
            margin: "0 0 6px",
          }}
        >
          {name}
        </h1>
        {topRole && (
          <p
            style={{
              fontFamily: FONT.dm,
              fontSize: "clamp(15px, 2vw, 18px)",
              color: T.ink,
              opacity: 0.7,
              margin: "0 0 24px",
            }}
          >
            {topRole}
          </p>
        )}

        {/* On this trip — the program roster role(s) */}
        {programRoles.length > 0 && (
          <Section label="On this trip">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {programRoles.map((role) => (
                <Pill key={role} color={T.teal}>
                  {role}
                </Pill>
              ))}
            </div>
          </Section>
        )}

        {/* Bio / artist statement */}
        {bio && (
          <Section label="About">
            <p
              style={{
                fontFamily: FONT.dm,
                fontSize: 15,
                lineHeight: 1.6,
                color: T.ink,
                opacity: 0.86,
                margin: 0,
                whiteSpace: "pre-line",
              }}
            >
              {bio}
            </p>
          </Section>
        )}

        {/* Location */}
        {location && (
          <Section label="Based in">
            <p style={{ fontFamily: FONT.dm, fontSize: 15, color: T.ink, opacity: 0.86, margin: 0 }}>
              {location}
            </p>
          </Section>
        )}

        {/* Links — social / website */}
        {links.length > 0 && (
          <Section label="Links">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {links.map((link, i) => (
                <a
                  key={`${link.url}-${i}`}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontFamily: FONT.dm,
                    fontSize: 15,
                    color: T.teal,
                    textDecoration: "none",
                    wordBreak: "break-word",
                  }}
                >
                  ➤ {link.label}
                </a>
              ))}
            </div>
          </Section>
        )}

        {/* Full marketing profile — out-of-kit (outside the manifest scope), so a
            plain <a> lets iOS open it in the in-app browser with a Done button. */}
        <a
          href={`/alumni/${slug}`}
          style={{
            display: "inline-block",
            marginTop: 32,
            fontFamily: FONT.grotesk,
            fontWeight: 700,
            fontSize: 11,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: T.muted,
            textDecoration: "none",
          }}
        >
          View full profile →
        </a>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 24 }}>
      <p
        style={{
          fontFamily: FONT.grotesk,
          fontWeight: 700,
          fontSize: 10,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: T.muted,
          margin: "0 0 10px",
        }}
      >
        {label}
      </p>
      {children}
    </section>
  );
}
