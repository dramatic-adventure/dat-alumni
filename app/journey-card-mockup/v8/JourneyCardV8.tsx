// app/journey-card-mockup/v8/JourneyCardV8.tsx
// ⚠️  MOCKUP ONLY — no live data, no auth, no backend.
//
// v8: Four-zone fixed landscape artifact.
//     Zone A — Cover: program identity stamped on a field photo.
//     Zone B — Chapters: quote + scrollable chapter list (the only navigation).
//     Zone C — Photos: grid driven by active chapter state (useState).
//     Zone D — Map: Slovakia aerial with program route overlay.
//     Below: Profile Embed — compact card for alumni profile pages.
"use client";

import { useState } from "react";
import Image from "next/image";

// ── Design tokens ──────────────────────────────────────────────────────────────
const C = {
  page:    "#0d0d14",   // viewport / ink background
  ink:     "#0f0f1a",   // Zone A / D surface when no image
  surface: "#14141f",   // Zone B / C background
  surfAlt: "#111119",   // Zone C default grid background
  sep:     "rgba(255,255,255,0.07)",
  border:  "rgba(255,255,255,0.09)",
  yellow:  "#f5c842",
  teal:    "#2493a9",
  grape:   "#7b4fa6",
  snow:    "#f2f2f2",
  cream:   "#ede3d0",
  muted:   "rgba(242,242,242,0.45)",
  dim:     "rgba(242,242,242,0.22)",
};

// ── Data ──────────────────────────────────────────────────────────────────────
const ARTIST = {
  name:    "Maria Reyes",
  roles:   ["Traveling Artist", "Teaching Artist", "Writer"],
  photo:   "/images/drama-clubs/boy-with-wings.jpg",
};

const PROGRAM = {
  name:  "PASSAGE · SLOVAKIA 2026",
  dates: "12 July – 2 August 2026",
};

const PRIMARY_QUOTE =
  "I arrived thinking I was here to teach. I left knowing how much I had been taught.";

type Photo = { src: string; caption: string };
type Chapter = {
  id:        string;
  ch:        string;
  location:  string | null;
  date:      string;
  component: string;
  response:  string;
  photos:    Photo[];
  quiet:     boolean;
  accentColor: string;
};

const CHAPTERS: Chapter[] = [
  {
    id: "before",
    ch: "00",
    location: null,
    date: "9 Jul",
    component: "The night before",
    response: "I was afraid I would not know how to enter the room.",
    photos: [],
    quiet: true,
    accentColor: C.dim,
  },
  {
    id: "bratislava",
    ch: "01",
    location: "BRATISLAVA",
    date: "12 Jul",
    component: "Program Orientation",
    response:
      "The first moment I arrived was not at the airport. It was the first time I heard the group laugh together.",
    photos: [
      {
        src: "/images/projects/archive/action-heart-of-europe-street-theatre.webp",
        caption: "the hallway laugh.",
      },
    ],
    quiet: false,
    accentColor: C.yellow,
  },
  {
    id: "kosice-lab",
    ch: "02",
    location: "KOŠICE",
    date: "14–18 Jul",
    component: "DAT Lab",
    response:
      "A doorway — who stands inside, who waits outside, who gets invited in.",
    photos: [
      {
        src: "/images/rehearsing-nitra.jpg",
        caption: "DAT Lab — sketching the doorway.",
      },
    ],
    quiet: false,
    accentColor: C.teal,
  },
  {
    id: "teplica",
    ch: "03",
    location: "ZEMPLÍNSKA TEPLICA",
    date: "19–22 Jul",
    component: "Teaching Artist Residency",
    response:
      "A student corrected my rhythm with her whole body. She taught me before we shared a language.",
    photos: [
      {
        src: "/images/projects/archive/teaching-artist-residency-slovakia-camp.webp",
        caption: "she counted with her shoulders.",
      },
      {
        src: "/images/drama-clubs/boy-with-wings.jpg",
        caption: "games before language.",
      },
    ],
    quiet: false,
    accentColor: C.grape,
  },
  {
    id: "lunik",
    ch: "04",
    location: "LUNÍK IX",
    date: "23 Jul",
    component: "Drama Club & Community Showcase",
    response: "I don't want to explain what happened today. I want to honor it.",
    photos: [],
    quiet: true,
    accentColor: C.dim,
  },
  {
    id: "raj",
    ch: "05",
    location: "SLOVENSKÝ RAJ",
    date: "26 Jul",
    component: "Cohort Retreat",
    response:
      "The cave felt older than language. I stopped trying to make meaning and started listening.",
    photos: [
      {
        src: "/images/opportunities/team-adventure.jpg",
        caption: "older than language.",
      },
    ],
    quiet: false,
    accentColor: C.teal,
  },
  {
    id: "final",
    ch: "06",
    location: "KOŠICE",
    date: "31 Jul",
    component: "Eclectic Evening · Final Performance",
    response: "A different relationship to silence.",
    photos: [
      {
        src: "/images/theatre/archive/hotel-millionaire/hotel_millionaire1.jpg",
        caption: "Eclectic Evening.",
      },
    ],
    quiet: false,
    accentColor: C.yellow,
  },
];

// Approximate pixel positions in the 220×580 Zone D viewport.
// Slovakia: Bratislava=SW, Košice/Zemplínska Teplica/Luník IX=E, Slovenský Raj=central-E.
const MAP_STOPS = [
  { id: "bratislava", label: "BRA", x: 46,  y: 385 },
  { id: "kosice-lab", label: "KOŠ", x: 168, y: 268 },
  { id: "teplica",    label: "ZT",  x: 174, y: 215 },
  { id: "lunik",      label: "L9",  x: 174, y: 282 },
  { id: "raj",        label: "SR",  x: 141, y: 255 },
  { id: "final",      label: "KOŠ", x: 168, y: 268 },
];
// Deduplicated for the polyline (draw route once)
const ROUTE_POINTS = [
  { x: 46,  y: 385 },
  { x: 141, y: 255 },
  { x: 168, y: 268 },
  { x: 174, y: 215 },
  { x: 174, y: 282 },
];

// ── Zone A — Cover ─────────────────────────────────────────────────────────────
function ZoneA() {
  return (
    <div
      style={{
        width: 220,
        flexShrink: 0,
        position: "relative",
        overflow: "hidden",
        backgroundColor: C.ink,
      }}
    >
      {/* Field photo — full cover */}
      <Image
        src="/images/projects/archive/teaching-artist-residency-slovakia-camp.webp"
        alt="Program cover"
        fill
        sizes="220px"
        priority
        style={{
          objectFit: "cover",
          objectPosition: "center 25%",
          opacity: 0.82,
        }}
      />

      {/* Bottom-heavy gradient so text stays readable */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(13,13,20,0.5) 0%, rgba(13,13,20,0.02) 32%, rgba(13,13,20,0.6) 58%, rgba(13,13,20,0.96) 100%)",
        }}
      />

      {/* DAT logo — large stamp, top-left */}
      <div
        style={{
          position: "absolute",
          top: 15,
          left: 15,
          zIndex: 2,
          lineHeight: 1,
        }}
      >
        <Image
          src="/images/dat-logo7.svg"
          alt="Dramatic Adventure Theatre"
          width={52}
          height={52}
          style={{ display: "block", opacity: 0.95, filter: "brightness(0) invert(1)" }}
        />
      </div>

      {/* Bottom identity block */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "0 15px 16px",
          zIndex: 2,
        }}
      >
        {/* Program name — most dominant text on Zone A */}
        <p
          style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontWeight: 700,
            fontSize: "8px",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: C.yellow,
            margin: "0 0 4px",
          }}
        >
          {PROGRAM.name}
        </p>

        {/* Artist name + headshot row */}
        <div
          style={{ display: "flex", alignItems: "flex-end", gap: 9, marginBottom: 4 }}
        >
          <h2
            style={{
              fontFamily: "var(--font-anton), system-ui, sans-serif",
              fontSize: 25,
              color: C.cream,
              margin: 0,
              lineHeight: 0.95,
              flex: 1,
              textTransform: "uppercase",
              letterSpacing: "0.01em",
            }}
          >
            {ARTIST.name}
          </h2>
          {/* Headshot — 4:5 ratio, ~44px wide */}
          <div
            style={{
              width: 44,
              height: 55,
              flexShrink: 0,
              borderRadius: 2,
              overflow: "hidden",
              border: `1.5px solid ${C.yellow}`,
              position: "relative",
            }}
          >
            <Image
              src={ARTIST.photo}
              alt={ARTIST.name}
              fill
              sizes="44px"
              style={{ objectFit: "cover", objectPosition: "center 18%" }}
            />
          </div>
        </div>

        {/* Roles */}
        <p
          style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontSize: 10,
            color: C.muted,
            margin: 0,
            letterSpacing: "0.03em",
          }}
        >
          {ARTIST.roles.slice(0, 2).join(" · ")}
        </p>
      </div>
    </div>
  );
}

// ── Zone B — Chapters ─────────────────────────────────────────────────────────
function ZoneB({
  activeChapter,
  onChapterClick,
}: {
  activeChapter: string | null;
  onChapterClick: (id: string) => void;
}) {
  return (
    <div
      style={{
        width: 280,
        flexShrink: 0,
        backgroundColor: C.surface,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderLeft: `1px solid ${C.sep}`,
        borderRight: `1px solid ${C.sep}`,
      }}
    >
      {/* Primary quote */}
      <div
        style={{
          padding: "18px 20px 15px",
          borderBottom: `1px solid ${C.border}`,
          flexShrink: 0,
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontStyle: "italic",
            fontSize: 13,
            color: C.cream,
            lineHeight: 1.65,
            margin: 0,
            opacity: 0.88,
          }}
        >
          &ldquo;{PRIMARY_QUOTE}&rdquo;
        </p>
      </div>

      {/* Chapter list — the only navigation */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {CHAPTERS.map((ch) => {
          const isActive = activeChapter === ch.id;
          return (
            <button
              key={ch.id}
              type="button"
              onClick={() => onChapterClick(ch.id)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "11px 18px 11px 20px",
                backgroundColor: isActive ? "rgba(245,200,66,0.07)" : "transparent",
                border: "none",
                borderLeft: isActive
                  ? `3px solid ${C.yellow}`
                  : "3px solid transparent",
                cursor: "pointer",
                transition: "background 0.12s ease, border-color 0.12s ease",
              }}
            >
              <span
                style={{
                  display: "block",
                  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                  fontWeight: 700,
                  fontSize: "10px",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: isActive ? C.yellow : C.cream,
                  marginBottom: 3,
                  transition: "color 0.12s ease",
                }}
              >
                {ch.location ?? "Before · Berlin"}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                  fontStyle: "italic",
                  fontSize: "11px",
                  color: isActive ? "rgba(237,227,208,0.78)" : C.muted,
                  lineHeight: 1.45,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  transition: "color 0.12s ease",
                } as React.CSSProperties}
              >
                {ch.response}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Zone C — Photos ───────────────────────────────────────────────────────────
function ZoneC({
  activeChapter,
  onChapterClick,
}: {
  activeChapter: string | null;
  onChapterClick: (id: string) => void;
}) {
  const activeData = CHAPTERS.find((c) => c.id === activeChapter) ?? null;

  // ── Default state: one tile per chapter ─────────────────────────────────────
  if (!activeData) {
    const count = CHAPTERS.length; // 7
    const cols = 3;
    const isOdd = count % cols !== 0;

    return (
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: "2px",
          backgroundColor: "#0a0a10",
          overflow: "hidden",
          alignContent: "stretch",
        }}
      >
        {CHAPTERS.map((ch, idx) => {
          const photo = ch.photos[0] ?? null;
          // Last item spans full width when it would be alone on a row
          const itemsInLastRow = count % cols;
          const isLastItem = idx === count - 1;
          const spanFull = isLastItem && itemsInLastRow === 1;

          return (
            <div
              key={ch.id}
              onClick={() => onChapterClick(ch.id)}
              style={{
                position: "relative",
                overflow: "hidden",
                cursor: "pointer",
                backgroundColor: ch.quiet ? "#0c0c18" : C.surface,
                gridColumn: spanFull ? `1 / -1` : undefined,
              }}
            >
              {photo ? (
                <Image
                  src={photo.src}
                  alt={ch.location ?? ""}
                  fill
                  sizes="130px"
                  style={{
                    objectFit: "cover",
                    objectPosition: "center",
                    transition: "transform 0.22s ease",
                  }}
                />
              ) : (
                // Quiet chapter — typographic tile
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "10px",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                      fontStyle: "italic",
                      fontSize: "10px",
                      color: C.muted,
                      textAlign: "center",
                      lineHeight: 1.5,
                    }}
                  >
                    {ch.response.length > 55
                      ? ch.response.slice(0, 55) + "…"
                      : ch.response}
                  </span>
                </div>
              )}

              {/* Chapter label — bottom gradient overlay */}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: "16px 8px 5px",
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)",
                  pointerEvents: "none",
                }}
              >
                <span
                  style={{
                    fontFamily:
                      "var(--font-space-grotesk), system-ui, sans-serif",
                    fontWeight: 700,
                    fontSize: "8px",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: C.cream,
                  }}
                >
                  {ch.location ?? "Before"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ── Active chapter — no photos (quiet) ──────────────────────────────────────
  if (activeData.photos.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          backgroundColor: C.surface,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px 28px",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "8px",
            fontWeight: 700,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            color: C.dim,
            margin: "0 0 18px",
          }}
        >
          {activeData.component}
        </p>
        <p
          style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontStyle: "italic",
            fontSize: 17,
            color: C.snow,
            lineHeight: 1.7,
            textAlign: "center",
            opacity: 0.88,
            maxWidth: 260,
            margin: 0,
          }}
        >
          &ldquo;{activeData.response}&rdquo;
        </p>
        <p
          style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "8px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: C.dim,
            margin: "20px 0 0",
          }}
        >
          No photograph from this room.
        </p>
      </div>
    );
  }

  // ── Active chapter — one photo (enlarge) ─────────────────────────────────────
  if (activeData.photos.length === 1) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Full-height photo */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          <Image
            src={activeData.photos[0].src}
            alt={activeData.photos[0].caption}
            fill
            sizes="360px"
            style={{ objectFit: "cover", objectPosition: "center" }}
          />
        </div>

        {/* Response text bar */}
        <div
          style={{
            padding: "13px 16px",
            backgroundColor: C.surface,
            borderTop: `2px solid ${activeData.accentColor}`,
            flexShrink: 0,
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              fontStyle: "italic",
              fontSize: 13,
              color: C.cream,
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            {activeData.response}
          </p>
        </div>
      </div>
    );
  }

  // ── Active chapter — multiple photos (text tile + photo tiles) ───────────────
  // Layout: text tile full-width on top, photos side-by-side below.
  return (
    <div
      style={{
        flex: 1,
        display: "grid",
        gridTemplateRows: "auto 1fr",
        gap: "2px",
        overflow: "hidden",
        backgroundColor: "#0a0a10",
      }}
    >
      {/* Text tile */}
      <div
        style={{
          padding: "14px 16px",
          backgroundColor: `color-mix(in srgb, ${activeData.accentColor} 12%, ${C.surface})`,
          borderLeft: `2px solid ${activeData.accentColor}`,
          flexShrink: 0,
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontStyle: "italic",
            fontSize: 13,
            color: C.cream,
            lineHeight: 1.65,
            margin: 0,
          }}
        >
          {activeData.response}
        </p>
      </div>

      {/* Photo grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${activeData.photos.length}, 1fr)`,
          gap: "2px",
          overflow: "hidden",
        }}
      >
        {activeData.photos.map((photo) => (
          <div
            key={photo.src}
            style={{ position: "relative", overflow: "hidden" }}
          >
            <Image
              src={photo.src}
              alt={photo.caption}
              fill
              sizes="180px"
              style={{ objectFit: "cover", objectPosition: "center" }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Zone D — Map ───────────────────────────────────────────────────────────────
// Uses a publicly available Wikimedia Slovakia relief map.
// In production this would be a generated static screenshot keyed to the program route.
function ZoneD({ activeChapter }: { activeChapter: string | null }) {
  const routePolyline = ROUTE_POINTS.map((p) => `${p.x},${p.y}`).join(" ");

  // Deduplicate map stops so Košice only appears once
  const uniqueStops = MAP_STOPS.filter(
    (s, i, arr) => arr.findIndex((x) => x.x === s.x && x.y === s.y) === i
  );

  return (
    <div
      style={{
        width: 220,
        flexShrink: 0,
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#0e1820",
        borderLeft: `1px solid ${C.sep}`,
      }}
    >
      {/* Slovakia relief map — plain <img> for external URL (mockup only) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Slovakia_relief_location_map.jpg/800px-Slovakia_relief_location_map.jpg"
        alt="Slovakia relief map"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center",
          opacity: 0.65,
        }}
      />

      {/* Ink overlay — matches Zone A visual weight */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(160deg, rgba(10,14,22,0.35) 0%, rgba(10,14,22,0.48) 100%)",
        }}
      />

      {/* Route SVG overlay */}
      <svg
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        viewBox="0 0 220 580"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Dashed route line */}
        <polyline
          points={routePolyline}
          fill="none"
          stroke={C.yellow}
          strokeWidth="1.5"
          strokeDasharray="5,3.5"
          opacity="0.72"
        />

        {/* City stops */}
        {uniqueStops.map((stop) => {
          const isActive = activeChapter === stop.id;
          return (
            <g key={`${stop.x}-${stop.y}`}>
              {/* Outer ring when active */}
              {isActive && (
                <circle
                  cx={stop.x}
                  cy={stop.y}
                  r={9}
                  fill="none"
                  stroke={C.yellow}
                  strokeWidth="1"
                  opacity="0.5"
                />
              )}
              <circle
                cx={stop.x}
                cy={stop.y}
                r={isActive ? 5.5 : 4}
                fill={C.yellow}
                opacity={isActive ? 1 : 0.78}
              />
              <circle cx={stop.x} cy={stop.y} r={isActive ? 2.5 : 2} fill="#0d0d14" />
              <text
                x={stop.x + 9}
                y={stop.y + 4}
                fill={C.cream}
                fontSize="8"
                fontFamily="system-ui, sans-serif"
                fontWeight="600"
                opacity="0.88"
              >
                {stop.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* "Program Route" label */}
      <div
        style={{
          position: "absolute",
          top: 13,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          zIndex: 2,
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            fontFamily:
              "var(--font-space-grotesk), system-ui, sans-serif",
            fontWeight: 700,
            fontSize: "7.5px",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: C.cream,
            opacity: 0.58,
            backgroundColor: "rgba(0,0,0,0.32)",
            padding: "3px 9px",
            borderRadius: 2,
          }}
        >
          Program Route
        </span>
      </div>
    </div>
  );
}

// ── Profile Embed Card ─────────────────────────────────────────────────────────
// Compact card that appears on the artist's alumni profile before the full artifact.
function ProfileEmbed() {
  return (
    <div
      style={{
        width: 420,
        backgroundColor: C.surface,
        borderRadius: 8,
        padding: "22px 24px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        border: `1px solid ${C.border}`,
      }}
    >
      {/* Program pill */}
      <div>
        <span
          style={{
            display: "inline-block",
            backgroundColor: C.yellow,
            color: C.ink,
            fontFamily:
              "var(--font-space-grotesk), system-ui, sans-serif",
            fontWeight: 700,
            fontSize: "8px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            padding: "4px 10px",
            borderRadius: 2,
          }}
        >
          {PROGRAM.name}
        </span>
      </div>

      {/* Artist row: headshot 4:5 + name + quote */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <div
          style={{
            width: 64,
            height: 80,
            flexShrink: 0,
            borderRadius: 3,
            overflow: "hidden",
            position: "relative",
          }}
        >
          <Image
            src={ARTIST.photo}
            alt={ARTIST.name}
            fill
            sizes="64px"
            style={{ objectFit: "cover", objectPosition: "center 18%" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <h3
            style={{
              fontFamily: "var(--font-anton), system-ui, sans-serif",
              fontSize: 26,
              color: C.cream,
              lineHeight: 1.05,
              margin: "0 0 8px",
              textTransform: "uppercase",
              letterSpacing: "0.01em",
            }}
          >
            {ARTIST.name}
          </h3>
          <p
            style={{
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              fontStyle: "italic",
              fontSize: 13,
              color: "rgba(237,227,208,0.78)",
              lineHeight: 1.62,
              margin: 0,
            }}
          >
            &ldquo;{PRIMARY_QUOTE}&rdquo;
          </p>
        </div>
      </div>

      {/* CTA */}
      <div>
        <button
          type="button"
          style={{
            backgroundColor: C.grape,
            color: C.cream,
            fontFamily:
              "var(--font-space-grotesk), system-ui, sans-serif",
            fontWeight: 600,
            fontSize: 12,
            letterSpacing: "0.05em",
            border: "none",
            borderRadius: 3,
            padding: "10px 20px",
            cursor: "pointer",
          }}
        >
          View Journey →
        </button>
      </div>
    </div>
  );
}

// ── Mockup banner ─────────────────────────────────────────────────────────────
function MockupBanner() {
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 200,
        backgroundColor: C.yellow,
        padding: "0.38rem 1.25rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "0.75rem",
        flexWrap: "wrap",
        boxShadow: "0 2px 6px rgba(0,0,0,0.18)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
        <span
          style={{
            fontFamily:
              "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "0.6rem",
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            backgroundColor: C.ink,
            color: C.yellow,
            padding: "0.18em 0.55em",
            borderRadius: "3px",
          }}
        >
          ⚠ MOCKUP
        </span>
        <span
          style={{
            fontFamily:
              "var(--font-dm-sans), system-ui, sans-serif",
            fontSize: "0.75rem",
            color: C.ink,
            opacity: 0.65,
          }}
        >
          /journey-card-mockup/v8 · four-zone landscape · click a chapter
        </span>
      </div>
      <nav style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
        {[
          ["/journey-card-mockup/v7", "← v7"],
          ["/journey-card-mockup/v8", "v8"],
        ].map(([href, label]) => (
          <a
            key={href}
            href={href}
            style={{
              fontFamily:
                "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "0.58rem",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: C.ink,
              textDecoration: "none",
              padding: "0.18rem 0.5rem",
              borderRadius: "3px",
              backgroundColor: "rgba(13,13,20,0.12)",
            }}
          >
            {label}
          </a>
        ))}
      </nav>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function JourneyCardV8() {
  const [activeChapter, setActiveChapter] = useState<string | null>(null);

  function handleChapterClick(id: string) {
    setActiveChapter((prev) => (prev === id ? null : id));
  }

  return (
    <>
      {/* Responsive stacking: on narrow viewports zones stack A→B→C→D full-width */}
      <style>{`
        .jc-v8-container {
          display: flex;
          width: 1080px;
          height: 580px;
          border-radius: 4px;
          overflow: hidden;
          box-shadow: 0 24px 72px rgba(0,0,0,0.7), 0 4px 20px rgba(0,0,0,0.4);
          flex-shrink: 0;
        }
        @media (max-width: 1140px) {
          .jc-v8-container {
            width: 100%;
            height: auto;
            flex-direction: column;
            border-radius: 6px;
          }
          .jc-v8-container > * {
            width: 100% !important;
            height: 420px !important;
            flex-shrink: 0 !important;
          }
        }
      `}</style>

      <MockupBanner />

      <main
        style={{
          backgroundColor: C.page,
          minHeight: "100vh",
          padding: "32px 16px 72px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0,
        }}
      >
        {/* Meta label */}
        <div
          style={{
            width: "100%",
            maxWidth: 1080,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <span
            style={{
              fontFamily:
                "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "0.52rem",
              fontWeight: 700,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: C.dim,
            }}
          >
            Journey Card · v8 · Four-Zone Landscape
          </span>
          <span
            style={{
              fontFamily:
                "var(--font-dm-sans), system-ui, sans-serif",
              fontSize: "0.6rem",
              color: C.dim,
              fontStyle: "italic",
            }}
          >
            Click a chapter in Zone B to explore
          </span>
        </div>

        {/* ── Four-zone landscape container ──────────────────────────────────── */}
        <div className="jc-v8-container">
          <ZoneA />
          <ZoneB
            activeChapter={activeChapter}
            onChapterClick={handleChapterClick}
          />
          <ZoneC
            activeChapter={activeChapter}
            onChapterClick={handleChapterClick}
          />
          <ZoneD activeChapter={activeChapter} />
        </div>

        {/* Divider label */}
        <div
          style={{
            width: "100%",
            maxWidth: 1080,
            marginTop: 48,
            marginBottom: 24,
            borderTop: `1px solid ${C.border}`,
            paddingTop: 14,
          }}
        >
          <span
            style={{
              fontFamily:
                "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "0.5rem",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: C.dim,
            }}
          >
            ↓ Profile Embed — appears on the artist&apos;s alumni profile
          </span>
        </div>

        {/* ── Profile Embed ──────────────────────────────────────────────────── */}
        <ProfileEmbed />
      </main>
    </>
  );
}
