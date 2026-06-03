// app/journey-card-mockup/v9/JourneyCardV9.tsx
// ⚠️  MOCKUP ONLY — no live data, no auth, no backend.
//
// v9: Light-ground four-zone landscape ("printed journal paper" aesthetic).
//     Zone A (300px)  — Cover: full-bleed field photo, cream identity strip.
//     Zone B (280px)  — Editorial Spine: PASSAGE title + vertical timeline.
//     Zone C (180px)  — Photo Strip: clean vertical stack of 5 tiles.
//     Zone D (320px)  — Map: Slovakia relief map, light paper treatment.
//     Below: Profile Embed — compact light-surface card for alumni profiles.
"use client";

import { useState } from "react";
import Image from "next/image";

// ── Design tokens ──────────────────────────────────────────────────────────────
const C = {
  bg:     "#f2f2f2",           // cream — whole card feels like printed journal paper
  ink:    "#241123",           // primary text
  yellow: "#f5c842",
  teal:   "#2493a9",
  grape:  "#7b4fa6",
  muted:  "rgba(36,17,35,0.45)",
  dim:    "rgba(36,17,35,0.22)",
  sep:    "rgba(36,17,35,0.10)",
  border: "rgba(36,17,35,0.12)",
};

// ── Artist & Program ──────────────────────────────────────────────────────────
const ARTIST = {
  name:  "Isabel Martínez",
  roles: ["Actor", "Teaching Artist"],
  // Squarespace CDN — allowed in next.config.js remotePatterns
  photo: "https://images.squarespace-cdn.com/content/v1/6022114419b886404b1030fa/1688754593745-N9E8YZU0VE49QMQIOG4J/Marisa+Puller+007.jpg",
};

const PROGRAM = {
  name:  "PASSAGE · SLOVAKIA 2026",
  dates: "July 12 – August 2, 2026",
};

const PRIMARY_QUOTE =
  "I arrived thinking I was here to teach. I left knowing how much I had been taught.";

// ── Chapter data (5 standard stops — no pre/post-departure in this view) ──────
type Photo = { src: string; caption: string };
type Chapter = {
  id:          string;
  num:         string;
  location:    string;
  component:   string;
  description: string;
  response:    string;
  photos:      Photo[];
  accentColor: string;
};

const CHAPTERS: Chapter[] = [
  {
    id:          "bratislava",
    num:         "01",
    location:    "BRATISLAVA",
    component:   "Acclimate · Program Orientation",
    description: "Bratislava's cobblestone old town, first workshops, the group comes together.",
    response:    "The first moment I arrived was not at the airport. It was the first time I heard the group laugh together.",
    photos: [
      {
        src:     "/images/projects/archive/action-heart-of-europe-street-theatre.webp",
        caption: "the hallway laugh.",
      },
    ],
    accentColor: C.yellow,
  },
  {
    id:          "kosice-lab",
    num:         "02",
    location:    "KOŠICE",
    component:   "Engage · DAT Lab",
    description: "Europe's City of Culture. Co-creative workshops with a local theatre company.",
    response:    "A doorway — who stands inside, who waits outside, who gets invited in.",
    photos: [
      {
        src:     "/images/rehearsing-nitra.jpg",
        caption: "DAT Lab — the doorway.",
      },
    ],
    accentColor: C.teal,
  },
  {
    id:          "teplica",
    num:         "03",
    location:    "ZEMPLÍNSKA TEPLICA",
    component:   "Connect · Teaching Artist Residency",
    description: "Community storytelling workshops with Roma youth alongside ETP Slovensko.",
    response:    "A student corrected my rhythm with her whole body. She taught me before we shared a language.",
    photos: [
      {
        src:     "/images/projects/archive/teaching-artist-residency-slovakia-camp.webp",
        caption: "she counted with her shoulders.",
      },
    ],
    accentColor: C.grape,
  },
  {
    id:          "raj",
    num:         "04",
    location:    "SLOVENSKÝ RAJ",
    component:   "Create · Cohort Retreat",
    description: "Mountain wilderness, the Dobšinská Ice Cave, work development in the Slovak Paradise.",
    response:    "The cave felt older than language. I stopped trying to make meaning and started listening.",
    photos: [
      {
        src:     "/images/opportunities/team-adventure.jpg",
        caption: "older than language.",
      },
    ],
    accentColor: C.teal,
  },
  {
    id:          "kosice-final",
    num:         "05",
    location:    "KOŠICE",
    component:   "Perform · Eclectic Evening",
    description: "Return to Košice. Polish, rehearse, share. An evening of everything.",
    response:    "A different relationship to silence.",
    photos: [
      {
        src:     "/images/theatre/archive/hotel-millionaire/hotel_millionaire1.jpg",
        caption: "Eclectic Evening.",
      },
    ],
    accentColor: C.yellow,
  },
];

// Map stop pixel positions in SVG viewBox "0 0 320 580"
// Slovakia: Bratislava = SW corner, Košice = E, ZT = NE, Slovenský Raj = central-E
const MAP_STOPS = [
  { id: "bratislava",   label: "BRATISLAVA", x: 67,  y: 378 },
  { id: "kosice-lab",   label: "KOŠICE",     x: 244, y: 268 },
  { id: "teplica",      label: "ZT",         x: 256, y: 220 },
  { id: "raj",          label: "S.RAJ",      x: 204, y: 255 },
  { id: "kosice-final", label: "KOŠICE",     x: 244, y: 268 },
];
// De-duplicated for the route polyline (Košice appears twice as stop, once on map)
const ROUTE_POINTS = [
  { x: 67,  y: 378 },
  { x: 244, y: 268 },
  { x: 256, y: 220 },
  { x: 204, y: 255 },
  { x: 244, y: 268 },
];

// ── Zone A — Cover (300px) ────────────────────────────────────────────────────
function ZoneA() {
  return (
    <div
      style={{
        width: 300,
        flexShrink: 0,
        position: "relative",
        overflow: "hidden",
        backgroundColor: C.bg,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Field photo — fills the upper portion of the zone */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <Image
          src="/images/projects/archive/teaching-artist-residency-slovakia-camp.webp"
          alt="PASSAGE Slovakia 2026 — Teaching Artist Residency"
          fill
          sizes="300px"
          priority
          style={{
            objectFit: "cover",
            objectPosition: "center 30%",
          }}
        />
        {/* Subtle light-to-cream gradient at bottom of photo — smooth fade into identity strip */}
        <div
          style={{
            position: "absolute",
            left: 0, right: 0, bottom: 0,
            height: "42%",
            background: `linear-gradient(to bottom, transparent 0%, ${C.bg} 88%)`,
            pointerEvents: "none",
          }}
        />
      </div>

      {/* DAT logo — top-left, 72px, ink color, small cream backing for legibility */}
      <div
        style={{
          position: "absolute",
          top: 14,
          left: 14,
          zIndex: 3,
          backgroundColor: "rgba(242,242,242,0.82)",
          borderRadius: 4,
          padding: 5,
          lineHeight: 0,
        }}
      >
        <Image
          src="/images/dat-logo7.svg"
          alt="Dramatic Adventure Theatre"
          width={72}
          height={72}
          style={{ display: "block" }}
        />
      </div>

      {/* Bottom identity block — sits on cream bg where gradient has fully faded */}
      <div
        style={{
          flexShrink: 0,
          padding: "0 16px 18px",
          backgroundColor: C.bg,
          zIndex: 2,
        }}
      >
        {/* Program name */}
        <p
          style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontWeight: 700,
            fontSize: "8.5px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: C.ink,
            margin: "0 0 6px",
            opacity: 0.55,
          }}
        >
          {PROGRAM.name}
        </p>

        {/* Artist name + headshot row */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 10, marginBottom: 5 }}>
          <h2
            style={{
              fontFamily: "var(--font-anton), system-ui, sans-serif",
              fontSize: 28,
              color: C.ink,
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
              position: "relative",
              border: `1.5px solid ${C.sep}`,
            }}
          >
            <Image
              src={ARTIST.photo}
              alt={ARTIST.name}
              fill
              sizes="44px"
              style={{ objectFit: "cover", objectPosition: "center 15%" }}
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
            letterSpacing: "0.025em",
          }}
        >
          {ARTIST.roles.join(" · ")}
        </p>
      </div>
    </div>
  );
}

// ── Zone B — Editorial Spine (280px) ─────────────────────────────────────────
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
        backgroundColor: C.bg,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderLeft:  `1px solid ${C.sep}`,
        borderRight: `1px solid ${C.sep}`,
      }}
    >
      {/* ── Title block (fixed) ── */}
      <div
        style={{
          flexShrink: 0,
          padding: "22px 24px 16px",
          textAlign: "center",
          borderBottom: `1px solid ${C.sep}`,
        }}
      >
        {/* "PASSAGE" — loudest text on the card */}
        <h1
          style={{
            fontFamily: "var(--font-anton), system-ui, sans-serif",
            fontSize: 56,
            color: C.ink,
            margin: "0 0 2px",
            lineHeight: 1,
            letterSpacing: "0.02em",
            textTransform: "uppercase",
          }}
        >
          PASSAGE
        </h1>

        {/* "SLOVAKIA 2026" */}
        <p
          style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontWeight: 700,
            fontSize: "12px",
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: C.teal,
            margin: "0 0 6px",
          }}
        >
          SLOVAKIA 2026
        </p>

        {/* Date range */}
        <p
          style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontSize: "10.5px",
            color: C.muted,
            margin: 0,
          }}
        >
          {PROGRAM.dates}
        </p>
      </div>

      {/* ── Vertical timeline (scrollable if needed) ── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          position: "relative",
          padding: "16px 20px 16px 52px",
        }}
      >
        {/* The vertical spine line */}
        <div
          style={{
            position: "absolute",
            left: 28,
            top: 0,
            bottom: 0,
            width: 1,
            backgroundColor: C.ink,
            opacity: 0.18,
            pointerEvents: "none",
          }}
        />

        {CHAPTERS.map((ch, idx) => {
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
                background: isActive
                  ? `rgba(245,200,66,0.09)`
                  : "transparent",
                border: "none",
                borderLeft: isActive
                  ? `2px solid ${C.yellow}`
                  : "2px solid transparent",
                marginLeft: "-2px",
                padding: "10px 10px 10px 12px",
                marginBottom: idx < CHAPTERS.length - 1 ? 2 : 0,
                cursor: "pointer",
                position: "relative",
                transition: "background 0.12s ease",
                borderRadius: 2,
              }}
            >
              {/* Timeline dot on the spine line */}
              <div
                style={{
                  position: "absolute",
                  left: -38,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: isActive ? 11 : 9,
                  height: isActive ? 11 : 9,
                  borderRadius: "50%",
                  backgroundColor: isActive ? C.yellow : C.ink,
                  opacity: isActive ? 1 : 0.35,
                  border: isActive ? `2px solid ${C.yellow}` : `2px solid ${C.ink}`,
                  transition: "all 0.14s ease",
                  zIndex: 1,
                  boxShadow: isActive ? `0 0 0 3px rgba(245,200,66,0.2)` : "none",
                }}
              />

              {/* Chapter number + location name */}
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 2 }}>
                <span
                  style={{
                    fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                    fontWeight: 700,
                    fontSize: "8px",
                    letterSpacing: "0.12em",
                    color: isActive ? C.yellow : C.muted,
                    transition: "color 0.12s ease",
                  }}
                >
                  {ch.num}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                    fontWeight: 700,
                    fontSize: "10.5px",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: isActive ? C.yellow : C.ink,
                    transition: "color 0.12s ease",
                    lineHeight: 1.1,
                  }}
                >
                  {ch.location}
                </span>
              </div>

              {/* Component / DAT description — teal, 11px */}
              <p
                style={{
                  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                  fontSize: "10px",
                  color: C.teal,
                  margin: "0 0 3px",
                  lineHeight: 1.3,
                }}
              >
                {ch.component}
              </p>

              {/* Artist response — italic, muted, 2-line clamp */}
              <p
                style={{
                  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                  fontStyle: "italic",
                  fontSize: "10.5px",
                  color: isActive ? C.muted : C.dim,
                  margin: 0,
                  lineHeight: 1.45,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  transition: "color 0.12s ease",
                } as React.CSSProperties}
              >
                &ldquo;{ch.response}&rdquo;
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Zone C — Photo Strip (180px) ──────────────────────────────────────────────
function ZoneC({
  activeChapter,
  onChapterClick,
}: {
  activeChapter: string | null;
  onChapterClick: (id: string) => void;
}) {
  const activeData = CHAPTERS.find((c) => c.id === activeChapter) ?? null;

  // ── Default: one clean photo tile per chapter, stacked vertically ────────────
  if (!activeData) {
    return (
      <div
        style={{
          width: 180,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          gap: "2px",
          backgroundColor: C.bg,
          overflow: "hidden",
        }}
      >
        {CHAPTERS.map((ch) => (
          <div
            key={ch.id}
            onClick={() => onChapterClick(ch.id)}
            style={{
              flex: 1,
              position: "relative",
              overflow: "hidden",
              cursor: "pointer",
            }}
          >
            {ch.photos[0] ? (
              <Image
                src={ch.photos[0].src}
                alt={ch.location}
                fill
                sizes="180px"
                style={{
                  objectFit: "cover",
                  objectPosition: "center",
                  transition: "transform 0.22s ease",
                }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  backgroundColor: C.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 10,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                    fontStyle: "italic",
                    fontSize: "9px",
                    color: C.muted,
                    textAlign: "center",
                    lineHeight: 1.5,
                  }}
                >
                  {ch.response}
                </span>
              </div>
            )}

            {/* Location label — bottom gradient overlay */}
            <div
              style={{
                position: "absolute",
                bottom: 0, left: 0, right: 0,
                padding: "18px 7px 5px",
                background:
                  "linear-gradient(to top, rgba(36,17,35,0.62) 0%, transparent 100%)",
                pointerEvents: "none",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                  fontWeight: 700,
                  fontSize: "7.5px",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "#f2f2f2",
                }}
              >
                {ch.num} {ch.location}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── Active: text tile (with accent border) + photo tile(s) ──────────────────
  const hasPhotos = activeData.photos.length > 0;

  if (!hasPhotos) {
    return (
      <div
        style={{
          width: 180,
          flexShrink: 0,
          backgroundColor: C.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 16px",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontStyle: "italic",
            fontSize: 13,
            color: C.ink,
            lineHeight: 1.65,
            textAlign: "center",
            margin: 0,
          }}
        >
          &ldquo;{activeData.response}&rdquo;
        </p>
      </div>
    );
  }

  // One photo (all current chapters have exactly 1): enlarge + text bar below
  if (activeData.photos.length === 1) {
    return (
      <div
        style={{
          width: 180,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          backgroundColor: C.bg,
        }}
      >
        {/* Text tile with accent left border */}
        <div
          style={{
            flexShrink: 0,
            padding: "12px 14px",
            borderLeft: `3px solid ${activeData.accentColor}`,
            backgroundColor: C.bg,
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              fontStyle: "italic",
              fontSize: "11px",
              color: C.ink,
              lineHeight: 1.55,
              margin: 0,
            }}
          >
            &ldquo;{activeData.response}&rdquo;
          </p>
        </div>

        {/* 2px gap */}
        <div style={{ height: 2, backgroundColor: C.sep, flexShrink: 0 }} />

        {/* Enlarged photo — fills remaining height */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          <Image
            src={activeData.photos[0].src}
            alt={activeData.photos[0].caption}
            fill
            sizes="180px"
            style={{ objectFit: "cover", objectPosition: "center" }}
          />
        </div>
      </div>
    );
  }

  // Multiple photos: text tile on top, photos stacked below (up to 5)
  return (
    <div
      style={{
        width: 180,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        gap: "2px",
        backgroundColor: C.sep,
      }}
    >
      {/* Text tile */}
      <div
        style={{
          flexShrink: 0,
          padding: "12px 14px",
          borderLeft: `3px solid ${activeData.accentColor}`,
          backgroundColor: C.bg,
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontStyle: "italic",
            fontSize: "11px",
            color: C.ink,
            lineHeight: 1.55,
            margin: 0,
          }}
        >
          &ldquo;{activeData.response}&rdquo;
        </p>
      </div>

      {/* Photo tiles */}
      {activeData.photos.slice(0, 5).map((photo) => (
        <div key={photo.src} style={{ flex: 1, position: "relative", overflow: "hidden" }}>
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
  );
}

// ── Zone D — Map (320px) ──────────────────────────────────────────────────────
// Uses a publicly available Wikimedia Slovakia relief map via plain <img>.
function ZoneD({ activeChapter }: { activeChapter: string | null }) {
  const routePolyline = ROUTE_POINTS.map((p) => `${p.x},${p.y}`).join(" ");

  // De-duplicate stops for rendering (Košice appears twice in route, once on map)
  const uniqueStops = MAP_STOPS.filter(
    (s, i, arr) => arr.findIndex((x) => x.x === s.x && x.y === s.y) === i
  );

  return (
    <div
      style={{
        width: 320,
        flexShrink: 0,
        position: "relative",
        overflow: "hidden",
        backgroundColor: C.bg,
        borderLeft: `1px solid ${C.sep}`,
      }}
    >
      {/* Slovakia relief map — printed paper feel, light treatment */}
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
          opacity: 0.72,
          mixBlendMode: "multiply",  // blends map into the cream base — paper map feel
        }}
      />

      {/* No dark overlay — let the map read as a printed paper map */}

      {/* Route SVG overlay */}
      <svg
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        viewBox="0 0 320 580"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Dashed yellow route line */}
        <polyline
          points={routePolyline}
          fill="none"
          stroke={C.yellow}
          strokeWidth="2"
          strokeDasharray="6,4"
          opacity="0.9"
        />

        {/* City stop dots */}
        {uniqueStops.map((stop) => {
          const isActive = activeChapter === stop.id;
          return (
            <g key={`${stop.x}-${stop.y}`}>
              {/* Active ring */}
              {isActive && (
                <circle
                  cx={stop.x}
                  cy={stop.y}
                  r={11}
                  fill="none"
                  stroke={C.yellow}
                  strokeWidth="1.5"
                  opacity="0.55"
                />
              )}
              <circle
                cx={stop.x}
                cy={stop.y}
                r={isActive ? 6 : 4.5}
                fill={isActive ? C.yellow : C.ink}
                opacity={isActive ? 1 : 0.72}
              />
              <circle
                cx={stop.x}
                cy={stop.y}
                r={isActive ? 2.5 : 2}
                fill={isActive ? C.ink : C.bg}
              />
              <text
                x={stop.x + 10}
                y={stop.y + 4}
                fill={C.ink}
                fontSize="8.5"
                fontFamily="var(--font-space-grotesk), system-ui, sans-serif"
                fontWeight="700"
                letterSpacing="0.06em"
                opacity="0.78"
              >
                {stop.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* "Program Route" label — small caps, top-center */}
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
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontWeight: 700,
            fontSize: "7.5px",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: C.ink,
            opacity: 0.55,
            backgroundColor: "rgba(242,242,242,0.72)",
            padding: "3px 10px",
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
// Compact light-surface card for the artist's alumni profile.
function ProfileEmbed() {
  return (
    <div
      style={{
        width: 420,
        backgroundColor: "#ede3d0",
        borderRadius: 8,
        padding: "22px 24px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        border: `1px solid rgba(36,17,35,0.12)`,
      }}
    >
      {/* Program pill */}
      <div>
        <span
          style={{
            display: "inline-block",
            backgroundColor: C.yellow,
            color: C.ink,
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
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

      {/* Artist row: 4:5 headshot + name + primary quote */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <div
          style={{
            width: 64,
            height: 80,
            flexShrink: 0,
            borderRadius: 3,
            overflow: "hidden",
            position: "relative",
            border: `1px solid rgba(36,17,35,0.1)`,
          }}
        >
          <Image
            src={ARTIST.photo}
            alt={ARTIST.name}
            fill
            sizes="64px"
            style={{ objectFit: "cover", objectPosition: "center 15%" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <h3
            style={{
              fontFamily: "var(--font-anton), system-ui, sans-serif",
              fontSize: 26,
              color: C.ink,
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
              color: "rgba(36,17,35,0.68)",
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
            color: "#f2f2f2",
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
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

// ── Mockup Banner ─────────────────────────────────────────────────────────────
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
        boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
        <span
          style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
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
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontSize: "0.75rem",
            color: C.ink,
            opacity: 0.65,
          }}
        >
          /journey-card-mockup/v9 · light-ground landscape · click a chapter
        </span>
      </div>
      <nav style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
        {(
          [
            ["/journey-card-mockup/v7", "← v7"],
            ["/journey-card-mockup/v8", "← v8"],
            ["/journey-card-mockup/v9", "v9"],
          ] as [string, string][]
        ).map(([href, label]) => (
          <a
            key={href}
            href={href}
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "0.58rem",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: C.ink,
              textDecoration: "none",
              padding: "0.18rem 0.5rem",
              borderRadius: "3px",
              backgroundColor:
                label === "v9"
                  ? "rgba(36,17,35,0.18)"
                  : "rgba(36,17,35,0.09)",
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
export default function JourneyCardV9() {
  const [activeChapter, setActiveChapter] = useState<string | null>(null);

  function handleChapterClick(id: string) {
    setActiveChapter((prev) => (prev === id ? null : id));
  }

  return (
    <>
      {/* Responsive stacking: on narrow viewports zones stack A → B → C → D full-width */}
      <style>{`
        .jc-v9-container {
          display: flex;
          width: 1080px;
          height: 580px;
          border-radius: 4px;
          overflow: hidden;
          box-shadow: 0 8px 40px rgba(36,17,35,0.14), 0 2px 10px rgba(36,17,35,0.08);
          flex-shrink: 0;
          border: 1px solid rgba(36,17,35,0.10);
        }
        @media (max-width: 1140px) {
          .jc-v9-container {
            width: 100%;
            height: auto;
            flex-direction: column;
            border-radius: 6px;
          }
          .jc-v9-container > * {
            width: 100% !important;
            height: 420px !important;
            flex-shrink: 0 !important;
          }
        }
      `}</style>

      <MockupBanner />

      <main
        style={{
          backgroundColor: "#e8e2da",
          minHeight: "100vh",
          padding: "32px 16px 72px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
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
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "0.52rem",
              fontWeight: 700,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: C.muted,
            }}
          >
            Journey Card · v9 · Light-Ground Landscape
          </span>
          <span
            style={{
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              fontSize: "0.6rem",
              color: C.muted,
              fontStyle: "italic",
            }}
          >
            Click a chapter to explore
          </span>
        </div>

        {/* ── Four-zone landscape container ──────────────────────────────────── */}
        <div className="jc-v9-container">
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

        {/* Divider */}
        <div
          style={{
            width: "100%",
            maxWidth: 1080,
            marginTop: 52,
            marginBottom: 24,
            borderTop: `1px solid ${C.border}`,
            paddingTop: 14,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "0.5rem",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: C.muted,
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
