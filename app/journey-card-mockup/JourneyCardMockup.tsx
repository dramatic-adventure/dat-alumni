// app/journey-card-mockup/JourneyCardMockup.tsx
// ⚠️  MOCKUP ONLY — no live data, no auth, no commits.
"use client";

import { useState } from "react";
import Image from "next/image";

// ── Shared design tokens (matching DAT design system) ────────────────────────
const C = {
  ink: "#241123",
  grape: "#6C00AF",
  yellow: "#FFCC00",
  teal: "#2493A9",
  skyTeal: "#65C7DA",
  cream: "#FDF6EC",
  snow: "#F2F2F2",
  red: "#F25C4D",
};

// ── Sample data ───────────────────────────────────────────────────────────────
const MOCK = {
  program: "PASSAGE: Slovakia 2026",
  dates: "July 12 – August 2, 2026",
  route: [
    "Bratislava",
    "Košice",
    "Zemplínska Teplica",
    "Luník IX",
    "Slovenský Raj",
    "Košice",
  ],
  artist: {
    name: "Maria Reyes",
    roles: ["Traveling Artist", "Teaching Artist", "Writer"],
  },
  finalPiece: {
    title: "Songs We Couldn't Translate",
    description:
      "A short performance essay built from field notes, translation pauses, children's games, and the sound of rain in Zemplínska Teplica.",
  },
  primaryQuote:
    "I arrived thinking I was here to teach. I left knowing how much I had been taught.",
  moments: [
    {
      label: "Before You Leave",
      text: "I was afraid I would not know how to enter the room.",
    },
    {
      label: "Bratislava",
      text: "The first moment I arrived was not at the airport. It was the first time I heard the group laugh together.",
    },
    {
      label: "Košice / DAT Lab",
      text: "I kept returning to the image of a doorway — who stands inside, who waits outside, who gets invited in.",
    },
    {
      label: "Zemplínska Teplica",
      text: "A student corrected my rhythm with her whole body. She taught me before we shared a language.",
    },
    {
      label: "Luník IX",
      text: "I don't want to explain what happened today. I want to honor it.",
    },
    {
      label: "Slovenský Raj",
      text: "The cave felt older than language. I stopped trying to make meaning and started listening.",
    },
    {
      label: "Final Košice",
      text: "I am carrying home a different relationship to silence.",
    },
  ],
  staffNote:
    "Maria's work with Drama Club participants at Luník IX shaped the closing installation in ways none of us had planned. Her final essay — built from field notes and fragments — became one of the defining pieces of PASSAGE 2026.",
};

// ── Helper: Route string ──────────────────────────────────────────────────────
function routeString(route: string[]) {
  return route.join(" → ");
}

// ── Section wrapper for the mockup scaffolding ────────────────────────────────
function MockupSection({
  id,
  label,
  sublabel,
  children,
}: {
  id: string;
  label: string;
  sublabel: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      style={{
        borderTop: `3px solid ${C.yellow}`,
        paddingTop: "2rem",
        marginBottom: "4rem",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: "1rem",
          marginBottom: "0.4rem",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "0.7rem",
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: C.yellow,
            background: C.ink,
            padding: "0.25em 0.7em",
            borderRadius: "999px",
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontSize: "0.82rem",
            color: C.ink,
            opacity: 0.55,
          }}
        >
          {sublabel}
        </span>
      </div>
      {children}
    </section>
  );
}

// ── Section 1: Profile Module ─────────────────────────────────────────────────
function ProfileModuleSection() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      style={{
        backgroundImage: "url('/texture/kraft-paper.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        borderRadius: "18px",
        padding: "2rem",
        boxShadow: "6px 12px 20px rgba(0,0,0,0.18)",
        maxWidth: "680px",
      }}
    >
      {/* Profile header stub */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1.25rem",
          marginBottom: "1.75rem",
          paddingBottom: "1.25rem",
          borderBottom: `1px solid rgba(36,17,35,0.12)`,
        }}
      >
        {/* Avatar stub */}
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${C.grape} 0%, ${C.teal} 100%)`,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: C.yellow,
            fontFamily: "var(--font-anton), system-ui, sans-serif",
            fontSize: "1.6rem",
            letterSpacing: "0.02em",
          }}
        >
          MR
        </div>
        <div>
          <h2
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "1.15rem",
              fontWeight: 700,
              color: C.ink,
              margin: 0,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Maria Reyes
          </h2>
          <p
            style={{
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              fontSize: "0.85rem",
              color: C.ink,
              opacity: 0.6,
              margin: "0.15rem 0 0",
            }}
          >
            Traveling Artist · Teaching Artist · Writer
          </p>
        </div>
      </div>

      {/* "Journeys with DAT" section header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
          marginBottom: "1rem",
        }}
      >
        <div
          style={{
            backgroundColor: C.grape,
            color: C.snow,
            fontSize: "0.78rem",
            padding: "0.35rem 0.85rem 0.35rem 0.6rem",
            borderRadius: "999px",
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            display: "flex",
            alignItems: "center",
            gap: "0.45rem",
            boxShadow: "1px 1px 3px rgba(0,0,0,0.2)",
          }}
        >
          {/* dot decorator matching existing pattern */}
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: C.yellow,
              display: "inline-block",
              flexShrink: 0,
            }}
          />
          Journeys with DAT
        </div>
        <span
          style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontSize: "0.78rem",
            color: C.ink,
            opacity: 0.45,
          }}
        >
          1 journey
        </span>
      </div>

      {/* Journey preview card */}
      <div
        style={{
          backgroundColor: "rgba(36,17,35,0.94)",
          borderRadius: "14px",
          overflow: "hidden",
          boxShadow: "0 4px 16px rgba(0,0,0,0.22)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {/* Card image strip */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "130px",
            overflow: "hidden",
          }}
        >
          <Image
            src="/images/rehearsing-nitra.jpg"
            alt="Rehearsal scene — DAT Slovakia"
            fill
            sizes="680px"
            style={{ objectFit: "cover", objectPosition: "center 30%" }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to bottom, rgba(36,17,35,0.25) 0%, rgba(36,17,35,0.75) 100%)",
            }}
          />
          {/* Program pill */}
          <div
            style={{
              position: "absolute",
              top: "0.75rem",
              left: "0.75rem",
              backgroundColor: C.yellow,
              color: C.ink,
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontWeight: 700,
              fontSize: "0.7rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              padding: "0.3rem 0.7rem",
              borderRadius: "999px",
            }}
          >
            PASSAGE: Slovakia 2026
          </div>
          {/* Dates */}
          <div
            style={{
              position: "absolute",
              top: "0.75rem",
              right: "0.75rem",
              color: "rgba(255,255,255,0.72)",
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              fontSize: "0.7rem",
            }}
          >
            {MOCK.dates}
          </div>
        </div>

        {/* Card body */}
        <div style={{ padding: "1rem 1.25rem 1.25rem" }}>
          {/* Route */}
          <p
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "0.72rem",
              color: C.teal,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              margin: "0 0 0.5rem",
            }}
          >
            {routeString(MOCK.route)}
          </p>

          {/* Roles */}
          <p
            style={{
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              fontSize: "0.82rem",
              color: "rgba(242,242,242,0.65)",
              margin: "0 0 0.75rem",
            }}
          >
            {MOCK.artist.roles.join(" · ")}
          </p>

          {/* Final piece */}
          <p
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "0.78rem",
              color: "rgba(242,242,242,0.5)",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              margin: "0 0 0.2rem",
            }}
          >
            Final work
          </p>
          <p
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "0.95rem",
              fontWeight: 600,
              color: C.snow,
              margin: "0 0 1rem",
              lineHeight: 1.35,
            }}
          >
            {MOCK.finalPiece.title}
          </p>

          {/* Quote */}
          <blockquote
            style={{
              borderLeft: `3px solid ${C.yellow}`,
              paddingLeft: "0.85rem",
              margin: "0 0 1.25rem",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                fontSize: "0.9rem",
                fontStyle: "italic",
                color: "rgba(242,242,242,0.82)",
                lineHeight: 1.55,
                margin: 0,
              }}
            >
              &ldquo;{MOCK.primaryQuote}&rdquo;
            </p>
          </blockquote>

          {/* Expand toggle + CTA */}
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              style={{
                backgroundColor: C.grape,
                color: "#FFEFE3",
                padding: "0.55rem 1.2rem",
                borderRadius: "8px",
                fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                letterSpacing: "0.12em",
                fontSize: "0.75rem",
                textTransform: "uppercase",
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              {expanded ? "Close Journey ↑" : "View Journey →"}
            </button>
            <button
              type="button"
              style={{
                backgroundColor: "transparent",
                color: "rgba(242,242,242,0.55)",
                padding: "0.55rem 1rem",
                borderRadius: "8px",
                fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                letterSpacing: "0.1em",
                fontSize: "0.75rem",
                textTransform: "uppercase",
                border: "1px solid rgba(242,242,242,0.18)",
                cursor: "pointer",
              }}
            >
              Learn about PASSAGE
            </button>
          </div>

          {/* Inline expanded preview (placeholder hint) */}
          {expanded && (
            <div
              style={{
                marginTop: "1.25rem",
                padding: "1rem",
                backgroundColor: "rgba(255,255,255,0.05)",
                borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                  fontSize: "0.82rem",
                  color: "rgba(242,242,242,0.5)",
                  margin: 0,
                  fontStyle: "italic",
                }}
              >
                ↓ Expanded Journey Card appears here (see Section 2 below for full design)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Section 2: Expanded Journey Card ─────────────────────────────────────────
function ExpandedJourneyCard() {
  return (
    <div
      style={{
        backgroundColor: C.ink,
        borderRadius: "20px",
        overflow: "hidden",
        boxShadow: "0 12px 48px rgba(0,0,0,0.45)",
        maxWidth: "860px",
      }}
    >
      {/* ── Hero area ── */}
      <div style={{ position: "relative", width: "100%", height: "340px" }}>
        <Image
          src="/images/rehearsing-nitra.jpg"
          alt="PASSAGE Slovakia 2026 — rehearsal"
          fill
          sizes="860px"
          style={{ objectFit: "cover", objectPosition: "center 25%" }}
          priority
        />
        {/* Gradient overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(135deg, rgba(36,17,35,0.82) 0%, rgba(36,17,35,0.42) 60%, rgba(36,17,35,0.72) 100%)",
          }}
        />

        {/* Top-left: DAT wordmark stub + program badge */}
        <div
          style={{
            position: "absolute",
            top: "1.25rem",
            left: "1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "0.85rem",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontWeight: 700,
              fontSize: "0.78rem",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: C.yellow,
            }}
          >
            DAT
          </span>
          <span
            style={{
              width: 1,
              height: 14,
              backgroundColor: "rgba(255,255,255,0.25)",
              display: "inline-block",
            }}
          />
          <span
            style={{
              backgroundColor: "rgba(255,204,0,0.18)",
              color: C.yellow,
              border: `1px solid rgba(255,204,0,0.45)`,
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontWeight: 600,
              fontSize: "0.7rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              padding: "0.3rem 0.75rem",
              borderRadius: "999px",
            }}
          >
            PASSAGE: Slovakia 2026
          </span>
        </div>

        {/* Top-right: dates */}
        <div
          style={{
            position: "absolute",
            top: "1.25rem",
            right: "1.5rem",
            color: "rgba(255,255,255,0.6)",
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontSize: "0.78rem",
            textAlign: "right",
          }}
        >
          {MOCK.dates}
        </div>

        {/* Bottom overlay: artist name + role */}
        <div
          style={{
            position: "absolute",
            bottom: "1.75rem",
            left: "1.5rem",
            right: "1.5rem",
          }}
        >
          <h1
            style={{
              fontFamily: "var(--font-anton), system-ui, sans-serif",
              fontSize: "clamp(2rem, 5vw, 3.25rem)",
              color: C.snow,
              margin: 0,
              lineHeight: 1.05,
              textTransform: "uppercase",
              letterSpacing: "0.03em",
              textShadow: "0 2px 8px rgba(0,0,0,0.6)",
            }}
          >
            {MOCK.artist.name}
          </h1>
          <p
            style={{
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              fontSize: "0.9rem",
              color: "rgba(242,242,242,0.72)",
              margin: "0.4rem 0 0",
              letterSpacing: "0.03em",
            }}
          >
            {MOCK.artist.roles.join(" · ")}
          </p>
        </div>
      </div>

      {/* ── Route bar ── */}
      <div
        style={{
          backgroundColor: "rgba(255,255,255,0.04)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          padding: "0.85rem 1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          overflowX: "auto",
          scrollbarWidth: "none",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "0.65rem",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: C.teal,
            flexShrink: 0,
            marginRight: "0.5rem",
          }}
        >
          Route
        </span>
        {MOCK.route.map((city, i) => (
          <span key={city + i} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span
              style={{
                fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                fontSize: "0.78rem",
                color: i === 0 || i === MOCK.route.length - 1 ? C.yellow : "rgba(242,242,242,0.7)",
                fontWeight: i === 0 || i === MOCK.route.length - 1 ? 700 : 400,
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {city}
            </span>
            {i < MOCK.route.length - 1 && (
              <span
                style={{
                  color: "rgba(255,255,255,0.25)",
                  fontSize: "0.7rem",
                  flexShrink: 0,
                }}
              >
                →
              </span>
            )}
          </span>
        ))}
      </div>

      {/* ── Primary quote ── */}
      <div
        style={{
          padding: "2.25rem 2rem 0",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-rock-salt), system-ui, sans-serif",
            fontSize: "clamp(0.9rem, 2.2vw, 1.2rem)",
            color: C.snow,
            lineHeight: 1.65,
            opacity: 0.9,
            maxWidth: "620px",
            margin: "0 auto",
          }}
        >
          &ldquo;{MOCK.primaryQuote}&rdquo;
        </p>
      </div>

      {/* ── Journey Moments ── */}
      <div style={{ padding: "2.5rem 2rem 1rem" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            marginBottom: "1.75rem",
          }}
        >
          <span
            style={{
              backgroundColor: C.grape,
              color: C.snow,
              fontSize: "0.7rem",
              padding: "0.3rem 0.8rem",
              borderRadius: "999px",
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            Journey Moments
          </span>
          <span
            style={{
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              fontSize: "0.78rem",
              color: "rgba(242,242,242,0.35)",
            }}
          >
            Selected by the artist · Reviewed and approved
          </span>
        </div>

        {/* Timeline */}
        <div style={{ position: "relative" }}>
          {/* Vertical line */}
          <div
            style={{
              position: "absolute",
              left: "1.35rem",
              top: "1.5rem",
              bottom: "1.5rem",
              width: "2px",
              backgroundColor: "rgba(255,255,255,0.08)",
            }}
          />

          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {MOCK.moments.map((moment, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: "1.25rem",
                  padding: "1rem 0",
                  borderBottom:
                    i < MOCK.moments.length - 1
                      ? "1px solid rgba(255,255,255,0.05)"
                      : "none",
                  alignItems: "flex-start",
                }}
              >
                {/* Number bubble */}
                <div
                  style={{
                    width: "2.7rem",
                    height: "2.7rem",
                    borderRadius: "50%",
                    backgroundColor:
                      i === MOCK.moments.length - 1 ? C.yellow : "rgba(255,255,255,0.07)",
                    border: `2px solid ${i === MOCK.moments.length - 1 ? C.yellow : "rgba(255,255,255,0.12)"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    zIndex: 1,
                    position: "relative",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color:
                        i === MOCK.moments.length - 1 ? C.ink : "rgba(255,255,255,0.55)",
                    }}
                  >
                    {i + 1}
                  </span>
                </div>

                {/* Moment content */}
                <div style={{ flex: 1, paddingTop: "0.4rem" }}>
                  <p
                    style={{
                      fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                      fontSize: "0.68rem",
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: C.teal,
                      margin: "0 0 0.35rem",
                      fontWeight: 600,
                    }}
                  >
                    {moment.label}
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                      fontSize: "0.95rem",
                      color:
                        i === MOCK.moments.length - 1
                          ? C.snow
                          : "rgba(242,242,242,0.78)",
                      lineHeight: 1.6,
                      margin: 0,
                      fontStyle: "italic",
                    }}
                  >
                    &ldquo;{moment.text}&rdquo;
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Final Piece ── */}
      <div
        style={{
          margin: "0.5rem 2rem",
          padding: "1.5rem",
          backgroundColor: "rgba(108,0,175,0.22)",
          border: `1px solid rgba(108,0,175,0.45)`,
          borderRadius: "14px",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "0.65rem",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: C.grape,
            margin: "0 0 0.4rem",
            opacity: 0.85,
          }}
        >
          Final Work
        </p>
        <h2
          style={{
            fontFamily: "var(--font-anton), system-ui, sans-serif",
            fontSize: "clamp(1.3rem, 3vw, 1.85rem)",
            color: C.snow,
            margin: "0 0 0.65rem",
            lineHeight: 1.1,
            letterSpacing: "0.02em",
            textTransform: "uppercase",
          }}
        >
          {MOCK.finalPiece.title}
        </h2>
        <p
          style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontSize: "0.92rem",
            color: "rgba(242,242,242,0.75)",
            lineHeight: 1.65,
            margin: 0,
          }}
        >
          {MOCK.finalPiece.description}
        </p>
      </div>

      {/* ── What I'm carrying forward ── */}
      <div
        style={{
          margin: "1.5rem 2rem",
          padding: "1.25rem 1.5rem",
          borderLeft: `4px solid ${C.yellow}`,
          backgroundColor: "rgba(255,204,0,0.06)",
          borderRadius: "0 10px 10px 0",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "0.65rem",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: C.yellow,
            margin: "0 0 0.5rem",
            opacity: 0.85,
          }}
        >
          What I&apos;m carrying forward
        </p>
        <p
          style={{
            fontFamily: "var(--font-rock-salt), system-ui, sans-serif",
            fontSize: "1rem",
            color: C.snow,
            lineHeight: 1.65,
            margin: 0,
          }}
        >
          A different relationship to silence.
        </p>
      </div>

      {/* ── Staff Note ── */}
      <div
        style={{
          margin: "1rem 2rem 0",
          padding: "1rem 1.25rem",
          backgroundColor: "rgba(255,255,255,0.03)",
          borderRadius: "10px",
          border: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          gap: "0.85rem",
          alignItems: "flex-start",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "0.62rem",
            color: C.teal,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            flexShrink: 0,
            marginTop: "0.15rem",
          }}
        >
          DAT Note
        </span>
        <p
          style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontSize: "0.82rem",
            color: "rgba(242,242,242,0.48)",
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          {MOCK.staffNote}
        </p>
      </div>

      {/* ── CTA Buttons ── */}
      <div
        style={{
          padding: "2rem",
          display: "flex",
          gap: "0.85rem",
          flexWrap: "wrap",
          borderTop: "1px solid rgba(255,255,255,0.07)",
          marginTop: "2rem",
        }}
      >
        <button
          type="button"
          style={{
            backgroundColor: C.yellow,
            color: C.ink,
            padding: "0.65rem 1.5rem",
            borderRadius: "10px",
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            letterSpacing: "0.1em",
            fontSize: "0.78rem",
            textTransform: "uppercase",
            fontWeight: 700,
            border: "none",
            cursor: "pointer",
          }}
        >
          Share this Journey
        </button>
        <button
          type="button"
          style={{
            backgroundColor: "transparent",
            color: "rgba(242,242,242,0.72)",
            padding: "0.65rem 1.25rem",
            borderRadius: "10px",
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            letterSpacing: "0.08em",
            fontSize: "0.78rem",
            textTransform: "uppercase",
            border: "1px solid rgba(255,255,255,0.2)",
            cursor: "pointer",
          }}
        >
          View full alumni profile
        </button>
        <button
          type="button"
          style={{
            backgroundColor: "transparent",
            color: "rgba(242,242,242,0.72)",
            padding: "0.65rem 1.25rem",
            borderRadius: "10px",
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            letterSpacing: "0.08em",
            fontSize: "0.78rem",
            textTransform: "uppercase",
            border: "1px solid rgba(255,255,255,0.2)",
            cursor: "pointer",
          }}
        >
          Learn about PASSAGE
        </button>
        <button
          type="button"
          style={{
            backgroundColor: C.grape,
            color: "#FFEFE3",
            padding: "0.65rem 1.25rem",
            borderRadius: "10px",
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            letterSpacing: "0.08em",
            fontSize: "0.78rem",
            textTransform: "uppercase",
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
          }}
        >
          Support DAT
        </button>
      </div>
    </div>
  );
}

// ── Section 3: Standalone Postcard Page ──────────────────────────────────────
function PostcardPage() {
  return (
    <div
      style={{
        backgroundColor: "#FDF9F4",
        borderRadius: "20px",
        overflow: "hidden",
        boxShadow: "0 8px 32px rgba(0,0,0,0.14)",
        maxWidth: "860px",
        border: "1px solid rgba(36,17,35,0.08)",
      }}
    >
      {/* Postcard top bar */}
      <div
        style={{
          backgroundColor: C.ink,
          padding: "0.65rem 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "0.72rem",
            fontWeight: 700,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: C.yellow,
          }}
        >
          Dramatic Adventure Theatre
        </span>
        <span
          style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontSize: "0.7rem",
            color: "rgba(255,255,255,0.35)",
          }}
        >
          dramaticadventure.org
        </span>
      </div>

      {/* Hero image */}
      <div style={{ position: "relative", width: "100%", height: "360px" }}>
        <Image
          src="/images/rehearsing-nitra.jpg"
          alt="Maria Reyes — PASSAGE Slovakia 2026"
          fill
          sizes="860px"
          style={{ objectFit: "cover", objectPosition: "center 30%" }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(36,17,35,0.1) 30%, rgba(36,17,35,0.85) 100%)",
          }}
        />

        {/* Postcard headline */}
        <div
          style={{
            position: "absolute",
            bottom: "1.75rem",
            left: "1.75rem",
            right: "1.75rem",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "0.75rem",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: C.yellow,
              margin: "0 0 0.5rem",
            }}
          >
            PASSAGE: Slovakia 2026 &nbsp;·&nbsp; {MOCK.dates}
          </p>
          <h1
            style={{
              fontFamily: "var(--font-anton), system-ui, sans-serif",
              fontSize: "clamp(1.8rem, 4.5vw, 2.8rem)",
              color: C.snow,
              margin: "0 0 0.4rem",
              textTransform: "uppercase",
              lineHeight: 1.05,
            }}
          >
            {MOCK.artist.name}
          </h1>
          <p
            style={{
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              fontSize: "0.88rem",
              color: "rgba(242,242,242,0.7)",
              margin: 0,
            }}
          >
            {MOCK.artist.roles.join(" · ")}
          </p>
        </div>
      </div>

      {/* Postcard body */}
      <div style={{ padding: "2.25rem 2rem" }}>
        {/* Route pill */}
        <div style={{ marginBottom: "1.75rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              backgroundColor: "rgba(36,147,169,0.1)",
              border: `1px solid rgba(36,147,169,0.3)`,
              borderRadius: "999px",
              padding: "0.4rem 1rem",
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: C.teal,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                fontSize: "0.72rem",
                color: C.teal,
                letterSpacing: "0.05em",
              }}
            >
              {routeString(MOCK.route)}
            </span>
          </div>
        </div>

        {/* Primary quote — hero treatment */}
        <blockquote style={{ margin: "0 0 2.5rem" }}>
          <p
            style={{
              fontFamily: "var(--font-rock-salt), system-ui, sans-serif",
              fontSize: "clamp(1rem, 2.5vw, 1.35rem)",
              color: C.ink,
              lineHeight: 1.7,
              margin: "0 0 0.75rem",
            }}
          >
            &ldquo;{MOCK.primaryQuote}&rdquo;
          </p>
          <footer
            style={{
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              fontSize: "0.82rem",
              color: C.ink,
              opacity: 0.5,
            }}
          >
            — {MOCK.artist.name}, {MOCK.program}
          </footer>
        </blockquote>

        {/* Moment previews — 4 highlights */}
        <p
          style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "0.65rem",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: C.ink,
            opacity: 0.4,
            marginBottom: "1rem",
          }}
        >
          From the journey
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: "0.85rem",
            marginBottom: "2.5rem",
          }}
        >
          {MOCK.moments.slice(1, 5).map((m, i) => (
            <div
              key={i}
              style={{
                padding: "1rem",
                backgroundColor: "rgba(36,17,35,0.04)",
                border: "1px solid rgba(36,17,35,0.07)",
                borderRadius: "10px",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                  fontSize: "0.65rem",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: C.teal,
                  margin: "0 0 0.4rem",
                }}
              >
                {m.label}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                  fontSize: "0.88rem",
                  color: C.ink,
                  opacity: 0.78,
                  lineHeight: 1.55,
                  margin: 0,
                  fontStyle: "italic",
                }}
              >
                &ldquo;{m.text}&rdquo;
              </p>
            </div>
          ))}
        </div>

        {/* Final piece */}
        <div
          style={{
            padding: "1.5rem",
            backgroundColor: C.ink,
            borderRadius: "14px",
            marginBottom: "2rem",
            display: "flex",
            gap: "1.5rem",
            alignItems: "flex-start",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, minWidth: "200px" }}>
            <p
              style={{
                fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                fontSize: "0.62rem",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: C.grape,
                margin: "0 0 0.4rem",
              }}
            >
              Final performance
            </p>
            <h3
              style={{
                fontFamily: "var(--font-anton), system-ui, sans-serif",
                fontSize: "1.5rem",
                color: C.snow,
                margin: "0 0 0.5rem",
                textTransform: "uppercase",
                lineHeight: 1.1,
              }}
            >
              {MOCK.finalPiece.title}
            </h3>
            <p
              style={{
                fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                fontSize: "0.88rem",
                color: "rgba(242,242,242,0.62)",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              {MOCK.finalPiece.description}
            </p>
          </div>
        </div>

        {/* CTAs */}
        <div style={{ display: "flex", gap: "0.85rem", flexWrap: "wrap" }}>
          <button
            type="button"
            style={{
              backgroundColor: C.grape,
              color: "#FFEFE3",
              padding: "0.7rem 1.5rem",
              borderRadius: "10px",
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              letterSpacing: "0.1em",
              fontSize: "0.78rem",
              textTransform: "uppercase",
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
            }}
          >
            Read the full Journey Card
          </button>
          <button
            type="button"
            style={{
              backgroundColor: "transparent",
              color: C.ink,
              padding: "0.7rem 1.25rem",
              borderRadius: "10px",
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              letterSpacing: "0.08em",
              fontSize: "0.78rem",
              textTransform: "uppercase",
              border: `1px solid rgba(36,17,35,0.2)`,
              cursor: "pointer",
            }}
          >
            Learn about DAT
          </button>
          <button
            type="button"
            style={{
              backgroundColor: C.yellow,
              color: C.ink,
              padding: "0.7rem 1.25rem",
              borderRadius: "10px",
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              letterSpacing: "0.08em",
              fontSize: "0.78rem",
              textTransform: "uppercase",
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
            }}
          >
            Support DAT
          </button>
        </div>

        {/* Privacy note */}
        <p
          style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontSize: "0.72rem",
            color: C.ink,
            opacity: 0.35,
            marginTop: "1.75rem",
            lineHeight: 1.5,
          }}
        >
          Shared with the artist&apos;s full review and approval. Journey Cards are not published
          automatically. Participant privacy and consent are central to how DAT tells stories.
        </p>
      </div>
    </div>
  );
}

// ── Section 4: Social Share Previews ─────────────────────────────────────────
function SocialPreviews() {
  const sampleCaption =
    "Three weeks in Slovakia with Dramatic Adventure Theatre — and one moment I'm still carrying home.";

  return (
    <div>
      {/* Caption sample */}
      <div
        style={{
          backgroundColor: "rgba(36,17,35,0.06)",
          border: "1px solid rgba(36,17,35,0.1)",
          borderRadius: "10px",
          padding: "1rem 1.25rem",
          marginBottom: "2rem",
          maxWidth: "600px",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "0.65rem",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: C.ink,
            opacity: 0.4,
            margin: "0 0 0.4rem",
          }}
        >
          Sample share caption
        </p>
        <p
          style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontSize: "0.95rem",
            color: C.ink,
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          &ldquo;{sampleCaption}&rdquo;
        </p>
      </div>

      {/* Cards row */}
      <div
        style={{
          display: "flex",
          gap: "1.5rem",
          flexWrap: "wrap",
          alignItems: "flex-start",
        }}
      >
        {/* 1 — Square (Instagram) */}
        <div>
          <p
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "0.65rem",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: C.ink,
              opacity: 0.4,
              marginBottom: "0.6rem",
            }}
          >
            Square — Instagram
          </p>
          <div
            style={{
              width: "280px",
              height: "280px",
              position: "relative",
              borderRadius: "12px",
              overflow: "hidden",
              boxShadow: "0 6px 24px rgba(0,0,0,0.22)",
            }}
          >
            <Image
              src="/images/rehearsing-nitra.jpg"
              alt="Social share square"
              fill
              sizes="280px"
              style={{ objectFit: "cover", objectPosition: "center 25%" }}
            />
            {/* Dark overlay */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(180deg, rgba(36,17,35,0.45) 0%, rgba(36,17,35,0.78) 100%)",
              }}
            />
            {/* Content */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                padding: "1rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              {/* Top */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <span
                  style={{
                    backgroundColor: C.yellow,
                    color: C.ink,
                    fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                    fontWeight: 700,
                    fontSize: "0.6rem",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    padding: "0.25rem 0.6rem",
                    borderRadius: "999px",
                  }}
                >
                  DAT
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                    fontSize: "0.58rem",
                    color: "rgba(255,255,255,0.5)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  Slovakia 2026
                </span>
              </div>
              {/* Bottom */}
              <div>
                <p
                  style={{
                    fontFamily: "var(--font-rock-salt), system-ui, sans-serif",
                    fontSize: "0.72rem",
                    color: C.snow,
                    lineHeight: 1.55,
                    margin: "0 0 0.6rem",
                  }}
                >
                  &ldquo;I arrived thinking I was here to teach.&rdquo;
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    color: C.snow,
                    margin: "0 0 0.15rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  Maria Reyes
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                    fontSize: "0.6rem",
                    color: "rgba(255,255,255,0.5)",
                    margin: 0,
                  }}
                >
                  Traveling Artist · Slovakia
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 2 — Vertical (Story) */}
        <div>
          <p
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "0.65rem",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: C.ink,
              opacity: 0.4,
              marginBottom: "0.6rem",
            }}
          >
            Vertical — Story (9:16)
          </p>
          <div
            style={{
              width: "160px",
              height: "284px",
              position: "relative",
              borderRadius: "16px",
              overflow: "hidden",
              boxShadow: "0 6px 24px rgba(0,0,0,0.25)",
              backgroundColor: C.ink,
            }}
          >
            {/* Top half: image */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "55%",
                overflow: "hidden",
              }}
            >
              <Image
                src="/images/rehearsing-nitra.jpg"
                alt="Social share story"
                fill
                sizes="160px"
                style={{ objectFit: "cover", objectPosition: "center 20%" }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(to bottom, rgba(36,17,35,0.1) 0%, rgba(36,17,35,0.8) 100%)",
                }}
              />
            </div>

            {/* Content */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                padding: "0.85rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              {/* Top */}
              <span
                style={{
                  backgroundColor: C.yellow,
                  color: C.ink,
                  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                  fontWeight: 700,
                  fontSize: "0.55rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  padding: "0.2rem 0.5rem",
                  borderRadius: "999px",
                  alignSelf: "flex-start",
                }}
              >
                PASSAGE 2026
              </span>

              {/* Bottom */}
              <div>
                <p
                  style={{
                    fontFamily: "var(--font-rock-salt), system-ui, sans-serif",
                    fontSize: "0.6rem",
                    color: C.snow,
                    lineHeight: 1.55,
                    margin: "0 0 0.5rem",
                  }}
                >
                  &ldquo;The cave felt older than language.&rdquo;
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                    fontSize: "0.62rem",
                    fontWeight: 700,
                    color: C.snow,
                    margin: "0 0 0.15rem",
                    textTransform: "uppercase",
                  }}
                >
                  Maria Reyes
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                    fontSize: "0.55rem",
                    color: "rgba(255,255,255,0.5)",
                    margin: "0 0 0.6rem",
                  }}
                >
                  Slovakia · DAT
                </p>
                <div
                  style={{
                    backgroundColor: C.grape,
                    color: C.snow,
                    fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                    fontSize: "0.55rem",
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    padding: "0.35rem 0.6rem",
                    borderRadius: "6px",
                    textAlign: "center",
                  }}
                >
                  Read Journey →
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3 — Link preview (OG/email) */}
        <div>
          <p
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "0.65rem",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: C.ink,
              opacity: 0.4,
              marginBottom: "0.6rem",
            }}
          >
            Link preview — email / text
          </p>
          <div
            style={{
              width: "340px",
              borderRadius: "12px",
              overflow: "hidden",
              boxShadow: "0 4px 16px rgba(0,0,0,0.14)",
              border: "1px solid rgba(36,17,35,0.1)",
              backgroundColor: "#fff",
            }}
          >
            {/* OG image */}
            <div style={{ position: "relative", width: "100%", height: "175px" }}>
              <Image
                src="/images/rehearsing-nitra.jpg"
                alt="OG preview"
                fill
                sizes="340px"
                style={{ objectFit: "cover", objectPosition: "center 25%" }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(to bottom, rgba(36,17,35,0.15) 0%, rgba(36,17,35,0.65) 100%)",
                }}
              />
              {/* Yellow pill overlay */}
              <span
                style={{
                  position: "absolute",
                  bottom: "0.75rem",
                  left: "0.75rem",
                  backgroundColor: C.yellow,
                  color: C.ink,
                  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                  fontWeight: 700,
                  fontSize: "0.6rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  padding: "0.25rem 0.6rem",
                  borderRadius: "999px",
                }}
              >
                PASSAGE: Slovakia 2026
              </span>
            </div>
            {/* Meta text */}
            <div style={{ padding: "0.85rem 1rem" }}>
              <p
                style={{
                  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                  fontSize: "0.62rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: C.teal,
                  margin: "0 0 0.3rem",
                }}
              >
                dramaticadventure.org
              </p>
              <h4
                style={{
                  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                  fontSize: "0.92rem",
                  fontWeight: 700,
                  color: C.ink,
                  margin: "0 0 0.3rem",
                  lineHeight: 1.3,
                }}
              >
                Maria Reyes — PASSAGE: Slovakia 2026
              </h4>
              <p
                style={{
                  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                  fontSize: "0.78rem",
                  color: C.ink,
                  opacity: 0.55,
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                Three weeks in Slovakia with Dramatic Adventure Theatre — and one moment
                I&apos;m still carrying home.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Section 5: Mockup Notes ───────────────────────────────────────────────────
function MockupNotes() {
  const items = [
    {
      label: "Profile Module",
      color: C.teal,
      what: "Appears inside the alumni profile page alongside Story, Media, Impact.",
      who: "The alumni themselves + anyone viewing their public profile.",
      why: "Surfaces the Journey Card in the artist's existing DAT context without breaking the profile layout.",
      questions: [
        "One card per program, or a mini-grid if they've done multiple programs?",
        "Should this be opt-in / toggled from Profile Studio?",
      ],
    },
    {
      label: "Expanded Journey Card",
      color: C.grape,
      what: "The full artifact — opens from the profile module or a direct URL.",
      who: "Alumni, their network, DAT supporters, press.",
      why: "This is the core artifact. Cinematic, restrained, artist-centered. The artist controls what appears.",
      questions: [
        "Is the 'Staff Note' always optional — or sometimes absent?",
        "Should the hero image come from a DAT-provided set or the artist's own upload?",
        "Ordering of moments: chronological only, or artist-curated sequence?",
      ],
    },
    {
      label: "Standalone Postcard Page",
      color: C.red,
      what: "A public-facing landing page at a shareable URL (e.g. /journey/maria-reyes-slovakia-2026).",
      who: "Family, friends, donors, press — people who may not know DAT.",
      why: "Optimized for sharing outside the platform. Tells DAT's story through the artist's story.",
      questions: [
        "Does the postcard URL appear in the meta so the share image auto-populates on social?",
        "Should the postcard page suppress navigation / be a minimal shell?",
        "Privacy: should the postcard be toggled on/off by the artist?",
      ],
    },
    {
      label: "Social Share Image",
      color: C.yellow,
      what: "A generated OG/share image and pre-filled caption for social posting.",
      who: "The artist sharing their own experience.",
      why: "Makes the artist the storyteller on social media, amplifying DAT's reach authentically.",
      questions: [
        "Generate server-side (Next.js og:image route) or static download?",
        "Should the artist be able to pick which quote appears on the share image?",
        "Story/vertical format vs. square vs. both?",
      ],
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
        gap: "1.25rem",
      }}
    >
      {items.map((item) => (
        <div
          key={item.label}
          style={{
            backgroundColor: C.ink,
            borderRadius: "14px",
            overflow: "hidden",
            padding: "1.5rem",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.65rem",
              marginBottom: "1rem",
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                backgroundColor: item.color,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                fontSize: "0.7rem",
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: item.color,
              }}
            >
              {item.label}
            </span>
          </div>

          <div style={{ marginBottom: "0.85rem" }}>
            <p
              style={{
                fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                fontSize: "0.62rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "rgba(242,242,242,0.3)",
                margin: "0 0 0.25rem",
              }}
            >
              What it is
            </p>
            <p
              style={{
                fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                fontSize: "0.88rem",
                color: "rgba(242,242,242,0.82)",
                lineHeight: 1.55,
                margin: 0,
              }}
            >
              {item.what}
            </p>
          </div>

          <div style={{ marginBottom: "0.85rem" }}>
            <p
              style={{
                fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                fontSize: "0.62rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "rgba(242,242,242,0.3)",
                margin: "0 0 0.25rem",
              }}
            >
              Why it matters
            </p>
            <p
              style={{
                fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                fontSize: "0.88rem",
                color: "rgba(242,242,242,0.72)",
                lineHeight: 1.55,
                margin: 0,
              }}
            >
              {item.why}
            </p>
          </div>

          <div>
            <p
              style={{
                fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                fontSize: "0.62rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "rgba(242,242,242,0.3)",
                margin: "0 0 0.5rem",
              }}
            >
              Decide before building
            </p>
            <ul style={{ margin: 0, padding: "0 0 0 1.1rem" }}>
              {item.questions.map((q, i) => (
                <li
                  key={i}
                  style={{
                    fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                    fontSize: "0.82rem",
                    color: "rgba(242,242,242,0.55)",
                    lineHeight: 1.55,
                    marginBottom: "0.35rem",
                  }}
                >
                  {q}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Root Component ─────────────────────────────────────────────────────────────
export default function JourneyCardMockup() {
  return (
    <>
      {/* ── Mockup banner (always visible) ── */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          backgroundColor: C.yellow,
          color: C.ink,
          padding: "0.5rem 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          flexWrap: "wrap",
          boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <span
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "0.7rem",
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              backgroundColor: C.ink,
              color: C.yellow,
              padding: "0.2em 0.65em",
              borderRadius: "4px",
            }}
          >
            ⚠ MOCKUP
          </span>
          <span
            style={{
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              fontSize: "0.82rem",
              color: C.ink,
              opacity: 0.7,
            }}
          >
            /journey-card-mockup &nbsp;·&nbsp; Not production &nbsp;·&nbsp; No live data &nbsp;·&nbsp; Not committed
          </span>
        </div>

        {/* Jump links */}
        <nav
          style={{
            display: "flex",
            gap: "0.5rem",
            flexWrap: "wrap",
          }}
        >
          {[
            ["#profile-module", "1 Profile"],
            ["#expanded-card", "2 Expanded"],
            ["#postcard", "3 Postcard"],
            ["#social-previews", "4 Social"],
            ["#notes", "5 Notes"],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              style={{
                fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                fontSize: "0.65rem",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: C.ink,
                textDecoration: "none",
                padding: "0.2rem 0.6rem",
                borderRadius: "4px",
                backgroundColor: "rgba(36,17,35,0.1)",
              }}
            >
              {label}
            </a>
          ))}
        </nav>
      </div>

      {/* ── Page content ── */}
      <main
        style={{
          backgroundImage: "url('/texture/kraft-paper.png')",
          backgroundSize: "cover",
          backgroundAttachment: "fixed",
          minHeight: "100vh",
          padding: "3rem 1.5rem 6rem",
        }}
      >
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          {/* Page title */}
          <div style={{ marginBottom: "3rem" }}>
            <h1
              style={{
                fontFamily: "var(--font-anton), system-ui, sans-serif",
                fontSize: "clamp(2rem, 5vw, 3.5rem)",
                color: C.ink,
                textTransform: "uppercase",
                letterSpacing: "0.03em",
                margin: "0 0 0.5rem",
                lineHeight: 1,
              }}
            >
              Journey Card
            </h1>
            <p
              style={{
                fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                fontSize: "1rem",
                color: C.ink,
                opacity: 0.6,
                lineHeight: 1.6,
                maxWidth: "560px",
                margin: 0,
              }}
            >
              Design prototype for the DAT participant Journey Card artifact.
              Showing the profile module, expanded card, shareable postcard, and social
              previews — all with Maria Reyes / PASSAGE: Slovakia 2026 sample data.
            </p>
          </div>

          {/* ── Section 1 ── */}
          <MockupSection
            id="profile-module"
            label="Section 1"
            sublabel="How the Journey Card appears inside an alumni profile"
          >
            <ProfileModuleSection />
          </MockupSection>

          {/* ── Section 2 ── */}
          <MockupSection
            id="expanded-card"
            label="Section 2"
            sublabel="Full Journey Card artifact (opens from the profile module)"
          >
            <ExpandedJourneyCard />
          </MockupSection>

          {/* ── Section 3 ── */}
          <MockupSection
            id="postcard"
            label="Section 3"
            sublabel="Standalone shareable postcard page — for friends, family, donors"
          >
            <PostcardPage />
          </MockupSection>

          {/* ── Section 4 ── */}
          <MockupSection
            id="social-previews"
            label="Section 4"
            sublabel="Static previews of the generated share image and link card"
          >
            <SocialPreviews />
          </MockupSection>

          {/* ── Section 5 ── */}
          <MockupSection
            id="notes"
            label="Section 5"
            sublabel="What each piece is for and what to decide before building"
          >
            <MockupNotes />
          </MockupSection>
        </div>
      </main>
    </>
  );
}
