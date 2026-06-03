// app/journey-card-mockup/final/JourneyCardFinal.tsx
// ⚠️  MOCKUP ONLY — no live data, no auth, no backend, no commits.
// v4: Field-edition artifact. DAT logo as publisher seal. Editorial cover plate
//     with hero-image + title overlay. Hand-drawn route map as a real structural
//     spread. Chapter layouts vary (image-led / text-led / contact-sheet / quiet
//     / wide / final-climax) drawn directly from editorial / journal references.
"use client";

import Image from "next/image";

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  ink: "#241123",
  grape: "#6C00AF",
  yellow: "#FFCC00",
  teal: "#2493A9",
  cream: "#FAF5EA",
  parchment: "#F0E6CE",
  snow: "#F2F2F2",
  fog: "rgba(36,17,35,0.07)",
  fogText: "rgba(36,17,35,0.38)",
};

// ── Data ──────────────────────────────────────────────────────────────────────
// Each chapter = one stop on the route + the program component active there
// + the artist's dispatch + a chosen layout treatment.
//
// layoutMode lets a chapter render differently — drawn from the editorial /
// journal references (image-led / text-led / contact / quiet / wide / final).
type LayoutMode =
  | "threshold"   // before-you-leave, no place, marginalia-led
  | "image"       // image-led, photo wraps the body
  | "split"       // text on one side, image on other (writing-around-image)
  | "contact"     // contact-sheet grid moment
  | "wide"        // landscape image with handwritten note overlay
  | "quiet"       // text-only, restraint
  | "final";      // the climax — final piece title + key image

type Chapter = {
  id: string;
  stop: string | null;          // geographic stop
  stopIndex: number | null;     // 1-based index on the route, for the map
  coord: [number, number] | null; // approx (x, y) on the SVG map, 0..100
  component: string | null;     // DAT program component active here
  label: string;                // display label for the chapter header
  dispatch: string;             // artist's primary dispatch (typed)
  marginNote: string | null;    // handwritten marginalia fragment
  image: string | null;         // primary field photo
  imageCaption: string | null;
  secondaryImage: string | null;// optional second image (contact-sheet, split)
  secondaryCaption: string | null;
  layoutMode: LayoutMode;
};

const CHAPTERS: Chapter[] = [
  {
    id: "before",
    stop: null,
    stopIndex: null,
    coord: null,
    component: null,
    label: "Before the threshold",
    dispatch: "I was afraid I would not know how to enter the room.",
    marginNote: "the night before — packed twice, slept once.",
    image: null,
    imageCaption: null,
    secondaryImage: null,
    secondaryCaption: null,
    layoutMode: "threshold",
  },
  {
    id: "bratislava",
    stop: "Bratislava",
    stopIndex: 1,
    coord: [18, 64],
    component: "Program Orientation",
    label: "Arrival",
    dispatch:
      "The first moment I arrived was not at the airport. It was the first time I heard the group laugh together.",
    marginNote: "first laugh = first room.",
    image: "/images/projects/archive/action-heart-of-europe-street-theatre.webp",
    imageCaption: "Orientation, street theatre with communities — the program's first shared language.",
    secondaryImage: null,
    secondaryCaption: null,
    layoutMode: "image",
  },
  {
    id: "kosice-lab",
    stop: "Košice",
    stopIndex: 2,
    coord: [80, 38],
    component: "DAT Lab",
    label: "DAT Lab",
    dispatch:
      "I kept returning to the image of a doorway — who stands inside, who waits outside, who gets invited in.",
    marginNote: "doorway — start here.",
    image: "/images/rehearsing-nitra.jpg",
    imageCaption: "DAT Lab — Košice.",
    secondaryImage: null,
    secondaryCaption: null,
    layoutMode: "split",
  },
  {
    id: "teplica",
    stop: "Zemplínska Teplica",
    stopIndex: 3,
    coord: [82, 50],
    component: "Teaching Artist Residency",
    label: "Teaching Artist Residency",
    dispatch:
      "A student corrected my rhythm with her whole body. She taught me before we shared a language.",
    marginNote: "she counted with her shoulders.",
    image: "/images/projects/archive/teaching-artist-residency-slovakia-camp.webp",
    imageCaption: "Residency — Zemplínska Teplica.",
    secondaryImage: "/images/drama-clubs/boy-with-wings.jpg",
    secondaryCaption: "Games before language.",
    layoutMode: "contact",
  },
  {
    id: "lunik",
    stop: "Luník IX",
    stopIndex: 4,
    coord: [82, 36],
    component: "Drama Club & Community Showcase",
    label: "Drama Club & Showcase",
    dispatch:
      "I don't want to explain what happened today. I want to honor it.",
    marginNote: "honor, not explain.",
    image: null,
    imageCaption: null,
    secondaryImage: null,
    secondaryCaption: null,
    layoutMode: "quiet",
  },
  {
    id: "raj",
    stop: "Slovenský Raj",
    stopIndex: 5,
    coord: [70, 44],
    component: "Cohort Retreat",
    label: "Retreat",
    dispatch:
      "The cave felt older than language. I stopped trying to make meaning and started listening.",
    marginNote: "stop making meaning. listen.",
    image: "/images/opportunities/team-adventure.jpg",
    imageCaption: "Slovenský Raj — the mountains held a different kind of silence.",
    secondaryImage: null,
    secondaryCaption: null,
    layoutMode: "wide",
  },
  {
    id: "kosice-final",
    stop: "Košice",
    stopIndex: 6,
    coord: [80, 38],
    component: "Eclectic Evening",
    label: "Final Performance",
    dispatch: "I am carrying home a different relationship to silence.",
    marginNote: null,
    image: "/images/theatre/archive/hotel-millionaire/hotel_millionaire1.jpg",
    imageCaption: "Eclectic Evening — Košice.",
    secondaryImage: null,
    secondaryCaption: null,
    layoutMode: "final",
  },
];

const ARTIST = {
  name: "Maria Reyes",
  roles: ["Traveling Artist", "Teaching Artist", "Writer"],
};

const PROGRAM = {
  name: "PASSAGE: Slovakia 2026",
  word: "PASSAGE",
  location: "Slovakia 2026",
  dates: "July 12 – August 2, 2026",
  route: [
    "Bratislava",
    "Košice",
    "Zemplínska Teplica",
    "Luník IX",
    "Slovenský Raj",
    "Košice",
  ],
};

const FINAL_PIECE = {
  title: "Songs We Couldn't Translate",
  subtitle: "A Performance Essay",
  occasion: "Eclectic Evening · Košice · July 31, 2026",
  description:
    "A short performance essay built from field notes, translation pauses, children's games, and the sound of rain in Zemplínska Teplica.",
};

const PRIMARY_QUOTE =
  "I arrived thinking I was here to teach. I left knowing how much I had been taught.";

const CARRYING_FORWARD = "A different relationship to silence.";

const STAFF_NOTE =
  "Maria's work with Drama Club participants at Luník IX shaped the closing installation in ways none of us had planned. Her final essay — built from field notes and fragments — became one of the defining pieces of PASSAGE 2026.";

// ── Mockup chrome ─────────────────────────────────────────────────────────────
function MockupBanner() {
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 200,
        backgroundColor: C.yellow,
        padding: "0.4rem 1.25rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "0.75rem",
        flexWrap: "wrap",
        boxShadow: "0 2px 6px rgba(0,0,0,0.14)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
        <span
          style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "0.62rem",
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
            opacity: 0.62,
          }}
        >
          /journey-card-mockup/final · v4 · field-edition artifact
        </span>
      </div>
      <nav style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
        {[
          ["#card", "Journey Card"],
          ["#variants", "Variants"],
          ["#postcard", "Postcard"],
          ["#profile-embed", "Profile"],
          ["#share-images", "Share"],
          ["#notes", "Notes"],
        ].map(([href, label]) => (
          <a
            key={href}
            href={href}
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "0.6rem",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: C.ink,
              textDecoration: "none",
              padding: "0.18rem 0.5rem",
              borderRadius: "3px",
              backgroundColor: "rgba(36,17,35,0.1)",
            }}
          >
            {label}
          </a>
        ))}
      </nav>
    </div>
  );
}

function MockupSection({
  id,
  n,
  label,
  sublabel,
  children,
}: {
  id: string;
  n: string;
  label: string;
  sublabel: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} style={{ marginBottom: "5rem" }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: "0.85rem",
          marginBottom: "1.5rem",
          paddingBottom: "0.6rem",
          borderBottom: `2px solid ${C.yellow}`,
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "0.6rem",
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: C.yellow,
            background: C.ink,
            padding: "0.18em 0.55em",
            borderRadius: "3px",
          }}
        >
          {n}
        </span>
        <span
          style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "0.8rem",
            fontWeight: 700,
            color: C.ink,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontSize: "0.78rem",
            color: C.ink,
            opacity: 0.42,
          }}
        >
          {sublabel}
        </span>
      </div>
      {children}
    </section>
  );
}

// ── Reusable: DAT logo (next/image) ───────────────────────────────────────────
// Use the official mark as the publisher seal / artifact stamp.
function DatLogo({ size = 38, alt = "Dramatic Adventure Theatre" }: { size?: number; alt?: string }) {
  return (
    <Image
      src="/images/dat-logo7.svg"
      alt={alt}
      width={size}
      height={size}
      style={{ display: "block" }}
    />
  );
}

// ── Journey Card: Cover Plate ─────────────────────────────────────────────────
// Editorial cover. DAT logo as publisher seal. Hero image with the project
// title overlaid in cinematic typography (writing-on-image). Maria's name as
// authorship. Program info as edition metadata.
function CoverPlate() {
  return (
    <div style={{ backgroundColor: C.ink }}>
      {/* Masthead: DAT logo as publisher seal + edition metadata */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr auto",
          alignItems: "center",
          gap: "1rem",
          padding: "1.5rem 2rem 1.25rem",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <DatLogo size={36} />
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
            <span
              style={{
                fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                fontSize: "0.6rem",
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
                fontSize: "0.62rem",
                color: "rgba(255,255,255,0.42)",
                letterSpacing: "0.06em",
              }}
            >
              Field Edition · A Journey Card from PASSAGE
            </span>
          </div>
        </div>
        <div />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "0.15rem",
            textAlign: "right",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "0.55rem",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.5)",
            }}
          >
            Edition №&nbsp;006
          </span>
          <span
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "0.55rem",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.28)",
            }}
          >
            Slovakia · Summer 2026
          </span>
        </div>
      </div>

      {/* Hero image with cinematic title overlay */}
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "16 / 10",
          minHeight: "320px",
          overflow: "hidden",
          backgroundColor: "#111",
        }}
      >
        <Image
          src="/images/projects/archive/teaching-artist-residency-slovakia-camp.webp"
          alt="PASSAGE: Slovakia 2026 — Teaching Artist Residency"
          fill
          sizes="(max-width: 760px) 100vw, 760px"
          style={{ objectFit: "cover", objectPosition: "center 35%" }}
          priority
        />
        {/* Soft cinematic gradient — darker at bottom for type legibility */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(36,17,35,0.5) 0%, rgba(36,17,35,0.18) 38%, rgba(36,17,35,0.78) 100%)",
          }}
        />

        {/* Top-left frame mark: program */}
        <div
          style={{
            position: "absolute",
            top: "1.25rem",
            left: "1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "0.55rem",
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              backgroundColor: C.yellow,
              borderRadius: "50%",
              boxShadow: "0 0 0 3px rgba(255,204,0,0.15)",
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "0.6rem",
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: C.yellow,
              fontWeight: 700,
            }}
          >
            PASSAGE · Slovakia 2026
          </span>
        </div>

        {/* Top-right: dates as a quiet edition mark */}
        <div
          style={{
            position: "absolute",
            top: "1.25rem",
            right: "1.5rem",
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "0.55rem",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.62)",
          }}
        >
          {PROGRAM.dates}
        </div>

        {/* The TITLE — writing on the image (largest type in the artifact) */}
        <div
          style={{
            position: "absolute",
            left: "1.75rem",
            right: "1.75rem",
            bottom: "1.5rem",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "0.58rem",
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: C.yellow,
              opacity: 0.92,
              margin: "0 0 0.6rem",
            }}
          >
            A performance essay by {ARTIST.name}
          </p>
          <h1
            style={{
              fontFamily: "var(--font-anton), system-ui, sans-serif",
              fontSize: "clamp(2.4rem, 7vw, 4.6rem)",
              color: C.snow,
              margin: 0,
              lineHeight: 0.95,
              textTransform: "uppercase",
              letterSpacing: "-0.005em",
              textShadow: "0 2px 18px rgba(0,0,0,0.45)",
            }}
          >
            Songs<br />We Couldn&apos;t<br />Translate
          </h1>
        </div>
      </div>

      {/* Author / role strip beneath the hero */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          alignItems: "center",
          gap: "1rem",
          padding: "1.1rem 2rem",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "0.18rem" }}>
          <span
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "0.55rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.36)",
            }}
          >
            Artist
          </span>
          <span
            style={{
              fontFamily: "var(--font-anton), system-ui, sans-serif",
              fontSize: "1.4rem",
              color: C.snow,
              textTransform: "uppercase",
              letterSpacing: "0.02em",
              lineHeight: 1,
            }}
          >
            {ARTIST.name}
          </span>
          <span
            style={{
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              fontSize: "0.74rem",
              color: "rgba(255,255,255,0.45)",
              marginTop: "0.18rem",
            }}
          >
            {ARTIST.roles.join(" · ")}
          </span>
        </div>
        <div style={{ textAlign: "right" }}>
          <span
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "0.55rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.36)",
              display: "block",
            }}
          >
            Premiered at
          </span>
          <span
            style={{
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              fontSize: "0.78rem",
              color: "rgba(255,255,255,0.7)",
              display: "block",
              marginTop: "0.2rem",
            }}
          >
            Eclectic Evening · Košice
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Map Spread — hand-drawn route, the artifact's geographic chapter ──────────
// A real visual spine. SVG country plate, route path, numbered stops, marginalia.
function MapSpread() {
  // Stops with coords are placed on the SVG. Map viewbox 0..100, 0..100.
  const stops = CHAPTERS.filter((c) => c.coord && c.stopIndex);
  // Path string for the route line connecting stops in order
  const pathD = stops
    .map((c, i) => {
      const [x, y] = c.coord!;
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <div
      style={{
        position: "relative",
        backgroundColor: C.parchment,
        padding: "2.25rem 2rem 2rem",
        borderBottom: "1px solid rgba(36,17,35,0.08)",
        overflow: "hidden",
      }}
    >
      {/* Spread header */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: "0.75rem",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
        }}
      >
        <div>
          <p
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "0.55rem",
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: C.teal,
              margin: "0 0 0.3rem",
            }}
          >
            Spread 01 · The route
          </p>
          <h2
            style={{
              fontFamily: "var(--font-anton), system-ui, sans-serif",
              fontSize: "clamp(1.4rem, 3.6vw, 2.1rem)",
              color: C.ink,
              textTransform: "uppercase",
              margin: 0,
              lineHeight: 1.02,
              letterSpacing: "0.01em",
            }}
          >
            Three weeks. Six rooms.
          </h2>
        </div>
        <p
          style={{
            fontFamily: "var(--font-rock-salt), system-ui, sans-serif",
            fontSize: "0.78rem",
            color: C.ink,
            opacity: 0.62,
            lineHeight: 1.4,
            margin: 0,
            maxWidth: "200px",
            textAlign: "right",
            transform: "rotate(-1.5deg)",
          }}
        >
          drew this on the train.
        </p>
      </div>

      {/* Map + side-list */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.4fr) minmax(160px, 1fr)",
          gap: "1.25rem",
          alignItems: "start",
        }}
      >
        {/* Country plate with hand-drawn route */}
        <div
          style={{
            position: "relative",
            aspectRatio: "5 / 3",
            borderRadius: "8px",
            backgroundColor: C.cream,
            border: "1px solid rgba(36,17,35,0.08)",
            overflow: "hidden",
            boxShadow:
              "0 1px 2px rgba(0,0,0,0.04), 0 6px 18px rgba(0,0,0,0.06)",
          }}
        >
          {/* Soft grid for field-survey feel */}
          <svg
            viewBox="0 0 100 60"
            preserveAspectRatio="none"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
              opacity: 0.4,
            }}
            aria-hidden
          >
            {Array.from({ length: 11 }).map((_, i) => (
              <line
                key={`v-${i}`}
                x1={i * 10}
                y1={0}
                x2={i * 10}
                y2={60}
                stroke="rgba(36,17,35,0.06)"
                strokeWidth="0.1"
              />
            ))}
            {Array.from({ length: 7 }).map((_, i) => (
              <line
                key={`h-${i}`}
                x1={0}
                y1={i * 10}
                x2={100}
                y2={i * 10}
                stroke="rgba(36,17,35,0.06)"
                strokeWidth="0.1"
              />
            ))}
          </svg>

          {/* Country outline — rough Slovakia shape, schematic */}
          <svg
            viewBox="0 0 100 60"
            preserveAspectRatio="none"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
            }}
            aria-label="Schematic route across Slovakia"
          >
            <path
              d="M 10 30 Q 14 22 22 24 Q 30 18 38 22 Q 48 16 58 20 Q 68 18 78 22 Q 88 22 92 30 Q 90 38 82 42 Q 72 46 60 44 Q 48 48 36 46 Q 24 50 16 44 Q 8 38 10 30 Z"
              fill="rgba(36,17,35,0.04)"
              stroke="rgba(36,17,35,0.32)"
              strokeWidth="0.35"
              strokeDasharray="0.8 0.8"
            />
            {/* Route line — hand-drawn feel */}
            <path
              d={pathD.replace(/(\d+(\.\d+)?)\s+(\d+(\.\d+)?)/g, (_m, x, _xd, y) => {
                // remap (0..100, 0..100) coords to map viewbox (0..100, 0..60)
                const ny = (parseFloat(y) / 100) * 60;
                return `${x} ${ny}`;
              })}
              fill="none"
              stroke={C.grape}
              strokeWidth="0.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="0 0"
              style={{ filter: "drop-shadow(0 0 0.4px rgba(108,0,175,0.3))" }}
            />
            {/* Stops as marks */}
            {stops.map((c, i) => {
              const [x, y] = c.coord!;
              const ny = (y / 100) * 60;
              const isFinal = c.layoutMode === "final";
              return (
                <g key={c.id}>
                  <circle
                    cx={x}
                    cy={ny}
                    r={isFinal ? 1.6 : 1.2}
                    fill={isFinal ? C.yellow : C.snow}
                    stroke={isFinal ? C.ink : C.grape}
                    strokeWidth={0.4}
                  />
                  <text
                    x={x}
                    y={ny - 2.2}
                    fontSize="1.8"
                    fontFamily="var(--font-space-grotesk), system-ui, sans-serif"
                    fontWeight={700}
                    fill={C.ink}
                    textAnchor="middle"
                  >
                    {i + 1}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Map corner stamp — DAT mark as field-survey seal */}
          <div
            style={{
              position: "absolute",
              top: "0.6rem",
              right: "0.6rem",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              backgroundColor: "rgba(250,245,234,0.85)",
              border: `1px solid ${C.fog}`,
              padding: "0.25rem 0.5rem",
              borderRadius: "3px",
            }}
          >
            <DatLogo size={16} alt="" />
            <span
              style={{
                fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                fontSize: "0.5rem",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: C.ink,
                opacity: 0.55,
              }}
            >
              DAT · Field Survey
            </span>
          </div>

          {/* Scale / compass — bottom-left marginalia */}
          <div
            style={{
              position: "absolute",
              bottom: "0.55rem",
              left: "0.75rem",
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "0.5rem",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "rgba(36,17,35,0.45)",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 24,
                height: 4,
                borderTop: "1px solid rgba(36,17,35,0.4)",
                borderBottom: "1px solid rgba(36,17,35,0.4)",
                position: "relative",
              }}
            />
            ≈ 400 km
          </div>
        </div>

        {/* Side-list: stops as field-log */}
        <ol
          style={{
            listStyle: "none",
            margin: 0,
            padding: 0,
            display: "flex",
            flexDirection: "column",
            gap: "0.65rem",
          }}
        >
          {stops.map((c) => {
            const isFinal = c.layoutMode === "final";
            return (
              <li
                key={c.id + "-list"}
                style={{
                  display: "grid",
                  gridTemplateColumns: "20px 1fr",
                  gap: "0.5rem",
                  alignItems: "baseline",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                    fontSize: "0.62rem",
                    fontWeight: 700,
                    color: isFinal ? C.grape : C.teal,
                    letterSpacing: "0.08em",
                    textAlign: "right",
                  }}
                >
                  {String(c.stopIndex).padStart(2, "0")}
                </span>
                <span style={{ display: "flex", flexDirection: "column" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      color: C.ink,
                      letterSpacing: "0.02em",
                      lineHeight: 1.2,
                    }}
                  >
                    {c.stop}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                      fontSize: "0.62rem",
                      color: C.ink,
                      opacity: 0.5,
                      lineHeight: 1.3,
                    }}
                  >
                    {c.component}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

// ── Chapter sub-pieces ────────────────────────────────────────────────────────
function ChapterHeader({ chapter }: { chapter: Chapter }) {
  const isFinal = chapter.layoutMode === "final";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: "0.6rem",
        flexWrap: "wrap",
        marginBottom: "0.5rem",
      }}
    >
      {chapter.stopIndex !== null && (
        <span
          style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "0.62rem",
            fontWeight: 700,
            letterSpacing: "0.14em",
            color: isFinal ? C.grape : C.teal,
          }}
        >
          CH&nbsp;{String(chapter.stopIndex).padStart(2, "0")}
        </span>
      )}
      {chapter.component && (
        <>
          <span style={{ color: "rgba(36,17,35,0.18)", fontSize: "0.7rem" }}>·</span>
          <span
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "0.62rem",
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: isFinal ? C.grape : C.teal,
            }}
          >
            {chapter.component}
          </span>
        </>
      )}
      {chapter.stop && (
        <>
          <span style={{ color: "rgba(36,17,35,0.18)", fontSize: "0.7rem" }}>·</span>
          <span
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "0.62rem",
              fontWeight: isFinal ? 700 : 500,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: isFinal ? C.ink : "rgba(36,17,35,0.55)",
            }}
          >
            {chapter.stop}
          </span>
        </>
      )}
      {!chapter.stop && !chapter.component && (
        <span
          style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "0.62rem",
            fontWeight: 600,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "rgba(36,17,35,0.42)",
          }}
        >
          {chapter.label}
        </span>
      )}
    </div>
  );
}

function Dispatch({
  text,
  large = false,
}: {
  text: string;
  large?: boolean;
}) {
  return (
    <p
      style={{
        fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
        fontSize: large ? "1.15rem" : "1rem",
        fontStyle: "italic",
        color: large ? C.ink : "rgba(36,17,35,0.82)",
        fontWeight: large ? 500 : 400,
        lineHeight: 1.65,
        margin: 0,
      }}
    >
      &ldquo;{text}&rdquo;
    </p>
  );
}

function MarginNote({ text, rotate = -2 }: { text: string; rotate?: number }) {
  return (
    <p
      style={{
        fontFamily: "var(--font-rock-salt), system-ui, sans-serif",
        fontSize: "0.78rem",
        color: C.grape,
        opacity: 0.78,
        lineHeight: 1.4,
        margin: 0,
        transform: `rotate(${rotate}deg)`,
        transformOrigin: "left top",
      }}
    >
      {text}
    </p>
  );
}

function ChapterImage({
  src,
  caption,
  height = 220,
  objectPosition = "center 30%",
}: {
  src: string;
  caption: string | null;
  height?: number;
  objectPosition?: string;
}) {
  return (
    <figure style={{ margin: 0 }}>
      <div
        style={{
          position: "relative",
          width: "100%",
          height,
          borderRadius: "4px",
          overflow: "hidden",
          boxShadow:
            "0 1px 2px rgba(0,0,0,0.05), 0 4px 14px rgba(0,0,0,0.08)",
          border: "1px solid rgba(36,17,35,0.08)",
        }}
      >
        <Image
          src={src}
          alt={caption ?? ""}
          fill
          sizes="520px"
          style={{ objectFit: "cover", objectPosition }}
        />
      </div>
      {caption && (
        <figcaption
          style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontSize: "0.66rem",
            color: C.ink,
            opacity: 0.4,
            marginTop: "0.4rem",
            lineHeight: 1.4,
            fontStyle: "italic",
          }}
        >
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

// ── Journey Card: Chapter Entry (multi-layout) ────────────────────────────────
function ChapterEntry({
  chapter,
  isLast,
}: {
  chapter: Chapter;
  isLast: boolean;
}) {
  const isFinal = chapter.layoutMode === "final";
  const markerColor = isFinal ? C.yellow : chapter.layoutMode === "threshold" ? "rgba(36,17,35,0.22)" : C.teal;
  const markerShape = chapter.layoutMode === "threshold" ? "square" : "circle";

  return (
    <div style={{ display: "flex", alignItems: "stretch", gap: 0, position: "relative" }}>
      {/* Route spine column */}
      <div
        style={{
          flexShrink: 0,
          width: "44px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {chapter.stopIndex !== null && (
          <span
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "0.55rem",
              fontWeight: 700,
              letterSpacing: "0.06em",
              color: isFinal ? C.grape : "rgba(36,17,35,0.42)",
              marginBottom: "0.25rem",
            }}
          >
            {String(chapter.stopIndex).padStart(2, "0")}
          </span>
        )}
        <div
          style={{
            width: isFinal ? 12 : 10,
            height: isFinal ? 12 : 10,
            borderRadius: markerShape === "square" ? "2px" : "50%",
            backgroundColor: isFinal ? C.yellow : "transparent",
            border: `2px solid ${markerColor}`,
            flexShrink: 0,
            transform: markerShape === "square" ? "rotate(45deg)" : "none",
            boxShadow: isFinal ? "0 0 0 4px rgba(255,204,0,0.18)" : "none",
          }}
        />
        {!isLast && (
          <div
            style={{
              flex: 1,
              width: "2px",
              backgroundColor: "rgba(36,17,35,0.1)",
              marginTop: "4px",
            }}
          />
        )}
      </div>

      {/* Chapter content */}
      <div
        style={{
          flex: 1,
          paddingLeft: "1.1rem",
          paddingBottom: isLast ? 0 : "2.75rem",
          minWidth: 0,
        }}
      >
        <ChapterHeader chapter={chapter} />

        {/* THRESHOLD — before-you-leave, marginalia + typewriter dispatch */}
        {chapter.layoutMode === "threshold" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: "0.5rem",
              maxWidth: "520px",
              paddingTop: "0.25rem",
            }}
          >
            <Dispatch text={chapter.dispatch} />
            {chapter.marginNote && (
              <div style={{ marginTop: "0.85rem", paddingLeft: "1rem" }}>
                <MarginNote text={chapter.marginNote} rotate={-2.2} />
              </div>
            )}
          </div>
        )}

        {/* IMAGE-LED — image first, then dispatch, with marginalia tucked beside */}
        {chapter.layoutMode === "image" && chapter.image && (
          <div style={{ maxWidth: "560px", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <ChapterImage src={chapter.image} caption={chapter.imageCaption} height={240} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "1.25rem", alignItems: "start" }}>
              <Dispatch text={chapter.dispatch} />
              {chapter.marginNote && (
                <div style={{ paddingTop: "0.2rem", maxWidth: "150px" }}>
                  <MarginNote text={chapter.marginNote} rotate={1.5} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* SPLIT — writing around image. Text on left, image on right (or stacks mobile). */}
        {chapter.layoutMode === "split" && chapter.image && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) minmax(0, 0.9fr)",
              gap: "1.1rem",
              maxWidth: "560px",
              alignItems: "start",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <Dispatch text={chapter.dispatch} />
              {chapter.marginNote && <MarginNote text={chapter.marginNote} rotate={-1.5} />}
            </div>
            <ChapterImage
              src={chapter.image}
              caption={chapter.imageCaption}
              height={180}
              objectPosition="center 40%"
            />
          </div>
        )}

        {/* CONTACT — two-image grid, like a contact sheet */}
        {chapter.layoutMode === "contact" && chapter.image && chapter.secondaryImage && (
          <div style={{ maxWidth: "560px", display: "flex", flexDirection: "column", gap: "0.95rem" }}>
            <Dispatch text={chapter.dispatch} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
              <ChapterImage src={chapter.image} caption={chapter.imageCaption} height={170} />
              <ChapterImage src={chapter.secondaryImage} caption={chapter.secondaryCaption} height={170} />
            </div>
            {chapter.marginNote && (
              <div style={{ paddingLeft: "0.5rem" }}>
                <MarginNote text={chapter.marginNote} rotate={-1.2} />
              </div>
            )}
          </div>
        )}

        {/* QUIET — text-only, restraint. Important moment held in white space. */}
        {chapter.layoutMode === "quiet" && (
          <div style={{ maxWidth: "440px" }}>
            <Dispatch text={chapter.dispatch} large />
            {chapter.marginNote && (
              <div style={{ marginTop: "1.1rem", paddingLeft: "0.4rem" }}>
                <MarginNote text={chapter.marginNote} rotate={-1.8} />
              </div>
            )}
            <p
              style={{
                fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                fontSize: "0.55rem",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: C.ink,
                opacity: 0.32,
                marginTop: "1.5rem",
              }}
            >
              No photograph from this room.
            </p>
          </div>
        )}

        {/* WIDE — landscape image with handwritten overlay (writing-on-image) */}
        {chapter.layoutMode === "wide" && chapter.image && (
          <div style={{ maxWidth: "560px", display: "flex", flexDirection: "column", gap: "0.95rem" }}>
            <div
              style={{
                position: "relative",
                width: "100%",
                height: 200,
                borderRadius: "4px",
                overflow: "hidden",
                boxShadow: "0 4px 18px rgba(0,0,0,0.12)",
              }}
            >
              <Image
                src={chapter.image}
                alt={chapter.imageCaption ?? ""}
                fill
                sizes="560px"
                style={{ objectFit: "cover", objectPosition: "center 50%" }}
              />
              {/* Soft vignette so the handwriting reads */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.42) 100%)",
                }}
              />
              {chapter.marginNote && (
                <p
                  style={{
                    position: "absolute",
                    left: "1.1rem",
                    bottom: "1rem",
                    fontFamily: "var(--font-rock-salt), system-ui, sans-serif",
                    fontSize: "0.95rem",
                    color: C.yellow,
                    margin: 0,
                    lineHeight: 1.3,
                    maxWidth: "280px",
                    transform: "rotate(-1.2deg)",
                    textShadow: "0 1px 6px rgba(0,0,0,0.45)",
                  }}
                >
                  {chapter.marginNote}
                </p>
              )}
            </div>
            <Dispatch text={chapter.dispatch} />
            {chapter.imageCaption && (
              <p
                style={{
                  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                  fontSize: "0.66rem",
                  color: C.ink,
                  opacity: 0.4,
                  fontStyle: "italic",
                  margin: 0,
                }}
              >
                {chapter.imageCaption}
              </p>
            )}
          </div>
        )}

        {/* FINAL — the climax. Dispatch, then the title moment with image. */}
        {chapter.layoutMode === "final" && (
          <div style={{ maxWidth: "620px" }}>
            <Dispatch text={chapter.dispatch} />

            <div
              style={{
                marginTop: "1.75rem",
                paddingTop: "1.5rem",
                borderTop: `1px solid rgba(36,17,35,0.1)`,
                display: "grid",
                gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1fr)",
                gap: "1.25rem",
                alignItems: "end",
              }}
            >
              <div>
                <div
                  style={{
                    height: 3,
                    width: 36,
                    backgroundColor: C.yellow,
                    marginBottom: "1rem",
                  }}
                />
                <p
                  style={{
                    fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                    fontSize: "0.58rem",
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    color: C.grape,
                    margin: "0 0 0.45rem",
                  }}
                >
                  The piece this journey made
                </p>
                <h3
                  style={{
                    fontFamily: "var(--font-anton), system-ui, sans-serif",
                    fontSize: "clamp(1.6rem, 4.6vw, 2.6rem)",
                    color: C.ink,
                    margin: "0 0 0.35rem",
                    lineHeight: 0.98,
                    textTransform: "uppercase",
                    letterSpacing: "0.005em",
                  }}
                >
                  {FINAL_PIECE.title}
                </h3>
                <p
                  style={{
                    fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                    fontSize: "0.65rem",
                    letterSpacing: "0.08em",
                    color: C.ink,
                    opacity: 0.4,
                    margin: "0 0 1rem",
                  }}
                >
                  {FINAL_PIECE.occasion}
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                    fontSize: "0.9rem",
                    color: "rgba(36,17,35,0.72)",
                    lineHeight: 1.7,
                    margin: 0,
                  }}
                >
                  {FINAL_PIECE.description}
                </p>
              </div>
              {chapter.image && (
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    height: 180,
                    borderRadius: "4px",
                    overflow: "hidden",
                    boxShadow: "0 6px 22px rgba(0,0,0,0.15)",
                  }}
                >
                  <Image
                    src={chapter.image}
                    alt={chapter.imageCaption ?? FINAL_PIECE.title}
                    fill
                    sizes="280px"
                    style={{ objectFit: "cover", objectPosition: "center 40%" }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(180deg, rgba(36,17,35,0) 50%, rgba(36,17,35,0.55) 100%)",
                    }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      bottom: "0.55rem",
                      left: "0.65rem",
                      fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                      fontSize: "0.52rem",
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: C.yellow,
                    }}
                  >
                    {chapter.imageCaption}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Journey Card: Document Body ───────────────────────────────────────────────
function DocumentBody() {
  return (
    <div style={{ backgroundColor: C.cream }}>
      {/* Opening epigraph — handwritten primary quote pulled large */}
      <div
        style={{
          padding: "2.75rem 2.5rem 2.25rem",
          borderBottom: `1px solid ${C.fog}`,
          display: "grid",
          gridTemplateColumns: "auto 1fr",
          gap: "1.5rem",
          alignItems: "start",
        }}
      >
        {/* Big drop-quote mark */}
        <span
          aria-hidden
          style={{
            fontFamily: "var(--font-anton), system-ui, sans-serif",
            fontSize: "4.5rem",
            color: C.yellow,
            lineHeight: 0.7,
            opacity: 0.95,
            transform: "translateY(0.05em)",
          }}
        >
          &ldquo;
        </span>
        <div>
          <p
            style={{
              fontFamily: "var(--font-rock-salt), system-ui, sans-serif",
              fontSize: "clamp(0.88rem, 2vw, 1.05rem)",
              color: C.ink,
              lineHeight: 1.85,
              opacity: 0.85,
              margin: "0 0 0.65rem",
            }}
          >
            {PRIMARY_QUOTE}
          </p>
          <p
            style={{
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              fontSize: "0.7rem",
              color: C.ink,
              opacity: 0.4,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              margin: 0,
            }}
          >
            — {ARTIST.name}, on the train to Košice
          </p>
        </div>
      </div>

      {/* Spread 01 — the route map */}
      <MapSpread />

      {/* Spread 02 — chapter dispatches */}
      <div
        style={{
          padding: "2.25rem 2.5rem 1.25rem",
          display: "grid",
          gridTemplateColumns: "auto 1fr auto",
          alignItems: "baseline",
          gap: "0.85rem",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "0.55rem",
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            color: C.teal,
            fontWeight: 700,
          }}
        >
          Spread 02 · Field dispatches
        </span>
        <div style={{ height: "1px", backgroundColor: "rgba(36,17,35,0.1)" }} />
        <span
          style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontSize: "0.62rem",
            color: C.ink,
            opacity: 0.32,
            whiteSpace: "nowrap",
          }}
        >
          Selected by the artist
        </span>
      </div>

      {/* Chapters */}
      <div style={{ padding: "0 2.5rem 2.5rem 2.5rem" }}>
        {CHAPTERS.map((chapter, i) => (
          <ChapterEntry
            key={chapter.id}
            chapter={chapter}
            isLast={i === CHAPTERS.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

// ── Journey Card: Carrying Forward + Colophon ─────────────────────────────────
function DocumentColophon() {
  return (
    <div
      style={{
        backgroundColor: C.parchment,
        borderTop: "1px solid rgba(36,17,35,0.1)",
      }}
    >
      {/* Carrying forward — a journal-page treatment */}
      <div
        style={{
          padding: "2.5rem 2.5rem 2.25rem",
          borderBottom: "1px solid rgba(36,17,35,0.08)",
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) auto",
          gap: "1.25rem",
          alignItems: "start",
        }}
      >
        <div>
          <p
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "0.55rem",
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: C.teal,
              fontWeight: 700,
              margin: "0 0 0.85rem",
            }}
          >
            Spread 03 · What I&apos;m carrying forward
          </p>
          <p
            style={{
              fontFamily: "var(--font-rock-salt), system-ui, sans-serif",
              fontSize: "clamp(1.05rem, 2.6vw, 1.45rem)",
              color: C.ink,
              lineHeight: 1.55,
              margin: 0,
              opacity: 0.92,
              maxWidth: "440px",
              transform: "rotate(-0.6deg)",
            }}
          >
            {CARRYING_FORWARD}
          </p>
        </div>
        {/* DAT seal — the artifact's publisher stamp */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.5rem",
            paddingTop: "0.5rem",
          }}
        >
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: "50%",
              border: `2px solid ${C.ink}`,
              padding: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 1px 0 rgba(36,17,35,0.05), inset 0 0 0 1px rgba(36,17,35,0.04)",
              backgroundColor: C.cream,
              transform: "rotate(-6deg)",
            }}
          >
            <DatLogo size={56} alt="DAT publisher seal" />
          </div>
          <span
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "0.5rem",
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: C.ink,
              opacity: 0.55,
            }}
          >
            Stamped · 2026
          </span>
        </div>
      </div>

      {/* Staff note — DAT's brief field-editor word */}
      <div
        style={{
          padding: "1.5rem 2.5rem",
          display: "grid",
          gridTemplateColumns: "auto 1fr",
          gap: "1rem",
          alignItems: "start",
          borderBottom: "1px solid rgba(36,17,35,0.07)",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "0.55rem",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: C.teal,
            fontWeight: 700,
            flexShrink: 0,
            marginTop: "0.18rem",
            width: 72,
          }}
        >
          From DAT
        </span>
        <p
          style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontSize: "0.82rem",
            color: "rgba(36,17,35,0.55)",
            lineHeight: 1.65,
            margin: 0,
            maxWidth: "560px",
          }}
        >
          {STAFF_NOTE}
        </p>
      </div>

      {/* CTAs */}
      <div
        style={{
          padding: "1.5rem 2.5rem",
          display: "flex",
          gap: "0.7rem",
          flexWrap: "wrap",
          borderBottom: "1px solid rgba(36,17,35,0.07)",
        }}
      >
        <button
          type="button"
          style={{
            backgroundColor: C.ink,
            color: C.snow,
            padding: "0.65rem 1.4rem",
            borderRadius: "7px",
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            letterSpacing: "0.1em",
            fontSize: "0.7rem",
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
            color: C.ink,
            padding: "0.65rem 1.1rem",
            borderRadius: "7px",
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            letterSpacing: "0.08em",
            fontSize: "0.7rem",
            textTransform: "uppercase",
            border: `1px solid rgba(36,17,35,0.2)`,
            cursor: "pointer",
          }}
        >
          View Maria&apos;s Profile
        </button>
        <button
          type="button"
          style={{
            backgroundColor: C.yellow,
            color: C.ink,
            padding: "0.65rem 1.1rem",
            borderRadius: "7px",
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            letterSpacing: "0.08em",
            fontSize: "0.7rem",
            textTransform: "uppercase",
            fontWeight: 700,
            border: "none",
            cursor: "pointer",
          }}
        >
          Support DAT
        </button>
      </div>

      {/* Ethics colophon + edition mark */}
      <div
        style={{
          padding: "1.1rem 2.5rem 1.75rem",
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: "0.85rem",
          alignItems: "center",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontSize: "0.68rem",
            color: C.ink,
            opacity: 0.35,
            lineHeight: 1.6,
            margin: 0,
            maxWidth: "520px",
          }}
        >
          Reviewed and approved by the artist before sharing.
          Nothing is published automatically. These responses belong to {ARTIST.name}.
          DAT amplifies — it does not extract.
        </p>
        <span
          style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "0.55rem",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: C.ink,
            opacity: 0.4,
            whiteSpace: "nowrap",
          }}
        >
          dramaticadventure.org · Edition №&nbsp;006
        </span>
      </div>
    </div>
  );
}

// ── Assembled primary Journey Card ────────────────────────────────────────────
function PrimaryJourneyCard() {
  return (
    <div
      style={{
        maxWidth: "760px",
        borderRadius: "16px",
        overflow: "hidden",
        boxShadow:
          "0 1px 2px rgba(0,0,0,0.05), 0 12px 36px rgba(0,0,0,0.16), 0 36px 90px rgba(0,0,0,0.12)",
        border: "1px solid rgba(36,17,35,0.08)",
        backgroundColor: C.cream,
      }}
    >
      <CoverPlate />
      <DocumentBody />
      <DocumentColophon />
    </div>
  );
}

// ── Section: Artifact Variants ────────────────────────────────────────────────
// The Journey Card is a form, not a template. Different artists' journeys
// produce different artifacts. These mini-comps show how the same components
// (DAT seal · project title · artist name · program · journey) compose
// differently depending on which material is dominant.
type VariantMode = "photo" | "text" | "map" | "collage";

const VARIANT_LABELS: Record<VariantMode, { tag: string; whoFor: string }> = {
  photo: { tag: "Photo-led", whoFor: "Photographers · documentarians · place-driven artists" },
  text: { tag: "Text-led", whoFor: "Writers · poets · oral historians" },
  map: { tag: "Map-led", whoFor: "Touring artists · multi-site residencies · roving programs" },
  collage: { tag: "Collage-led", whoFor: "Multimedia · ensemble · object-based work" },
};

function VariantCard({ mode }: { mode: VariantMode }) {
  const meta = VARIANT_LABELS[mode];
  return (
    <article
      style={{
        backgroundColor: mode === "text" ? C.cream : C.snow,
        borderRadius: "10px",
        border: `1px solid ${C.fog}`,
        boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 6px 22px rgba(0,0,0,0.06)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        minHeight: 360,
      }}
    >
      {/* Variant header */}
      <div
        style={{
          padding: "0.65rem 0.9rem",
          backgroundColor: C.ink,
          color: C.yellow,
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <DatLogo size={18} alt="" />
        <span
          style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "0.55rem",
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
          }}
        >
          {meta.tag}
        </span>
      </div>

      {/* Body — composition differs per variant */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {mode === "photo" && <VariantPhoto />}
        {mode === "text" && <VariantText />}
        {mode === "map" && <VariantMap />}
        {mode === "collage" && <VariantCollage />}
      </div>

      {/* Variant footer */}
      <div
        style={{
          padding: "0.6rem 0.9rem",
          borderTop: `1px solid ${C.fog}`,
          backgroundColor: "rgba(36,17,35,0.02)",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontSize: "0.62rem",
            color: C.ink,
            opacity: 0.5,
            margin: 0,
            lineHeight: 1.4,
          }}
        >
          {meta.whoFor}
        </p>
      </div>
    </article>
  );
}

function VariantPhoto() {
  // The artifact is dominated by image. Title slips along the bottom edge.
  return (
    <div style={{ flex: 1, position: "relative", minHeight: 240 }}>
      <Image
        src="/images/projects/archive/action-heart-of-europe-street-theatre.webp"
        alt=""
        fill
        sizes="280px"
        style={{ objectFit: "cover", objectPosition: "center 35%" }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(36,17,35,0.2) 0%, rgba(36,17,35,0.05) 38%, rgba(36,17,35,0.78) 100%)",
        }}
      />
      <div style={{ position: "absolute", top: "0.7rem", left: "0.8rem" }}>
        <span
          style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "0.5rem",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: C.yellow,
            fontWeight: 700,
          }}
        >
          PASSAGE · Croatia 2025
        </span>
      </div>
      <div style={{ position: "absolute", bottom: "0.7rem", left: "0.8rem", right: "0.8rem" }}>
        <p
          style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "0.5rem",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: C.yellow,
            margin: "0 0 0.25rem",
            opacity: 0.85,
          }}
        >
          A photo essay by Andre Okoye
        </p>
        <h4
          style={{
            fontFamily: "var(--font-anton), system-ui, sans-serif",
            fontSize: "1.4rem",
            color: C.snow,
            margin: 0,
            lineHeight: 0.95,
            textTransform: "uppercase",
            textShadow: "0 2px 14px rgba(0,0,0,0.5)",
          }}
        >
          Light, Held<br />Between Walls
        </h4>
      </div>
    </div>
  );
}

function VariantText() {
  // The artifact is dominated by a poem / fragment. Photo nearly absent.
  return (
    <div style={{ padding: "1rem 1rem 0.85rem", flex: 1, display: "flex", flexDirection: "column" }}>
      <span
        style={{
          fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
          fontSize: "0.5rem",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: C.teal,
          fontWeight: 700,
        }}
      >
        PASSAGE · Ecuador 2024
      </span>
      <p
        style={{
          fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
          fontSize: "0.5rem",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: C.ink,
          opacity: 0.5,
          margin: "1.1rem 0 0.4rem",
        }}
      >
        A field poem by
      </p>
      <p
        style={{
          fontFamily: "var(--font-anton), system-ui, sans-serif",
          fontSize: "1.1rem",
          color: C.ink,
          margin: 0,
          letterSpacing: "0.02em",
          textTransform: "uppercase",
        }}
      >
        Daniela Cuesta
      </p>
      <h4
        style={{
          fontFamily: "var(--font-anton), system-ui, sans-serif",
          fontSize: "1.6rem",
          color: C.grape,
          margin: "0.6rem 0 0.9rem",
          lineHeight: 0.95,
          textTransform: "uppercase",
        }}
      >
        What the<br />River Forgets
      </h4>
      <p
        style={{
          fontFamily: "var(--font-rock-salt), system-ui, sans-serif",
          fontSize: "0.72rem",
          color: C.ink,
          opacity: 0.78,
          lineHeight: 1.7,
          margin: "0 0 0.85rem",
        }}
      >
        five mornings,<br />
        five rivers,<br />
        the same question.
      </p>
      <div style={{ flex: 1 }} />
      <p
        style={{
          fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
          fontSize: "0.62rem",
          color: C.ink,
          opacity: 0.42,
          fontStyle: "italic",
          margin: 0,
        }}
      >
        No images included — by the artist&apos;s choice.
      </p>
    </div>
  );
}

function VariantMap() {
  // Map dominant. Sites listed, route line, title at top.
  return (
    <div style={{ padding: "0.9rem 1rem", flex: 1, display: "flex", flexDirection: "column", gap: "0.6rem" }}>
      <span
        style={{
          fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
          fontSize: "0.5rem",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: C.teal,
          fontWeight: 700,
        }}
      >
        PASSAGE · Tanzania 2025
      </span>
      <h4
        style={{
          fontFamily: "var(--font-anton), system-ui, sans-serif",
          fontSize: "1.15rem",
          color: C.ink,
          margin: 0,
          lineHeight: 1,
          textTransform: "uppercase",
        }}
      >
        Six Rooms,<br />Six Languages
      </h4>
      <span
        style={{
          fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
          fontSize: "0.66rem",
          color: C.ink,
          opacity: 0.5,
        }}
      >
        Khadija Omari — Touring Teaching Artist
      </span>
      <div
        style={{
          position: "relative",
          flex: 1,
          minHeight: 130,
          backgroundColor: C.parchment,
          borderRadius: "4px",
          border: `1px solid ${C.fog}`,
          marginTop: "0.25rem",
        }}
      >
        <svg
          viewBox="0 0 100 60"
          preserveAspectRatio="none"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        >
          <path
            d="M 20 20 Q 25 18 30 22 L 38 30 Q 45 32 52 28 L 62 36 Q 68 42 78 40"
            fill="none"
            stroke={C.grape}
            strokeWidth="0.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {[
            [20, 20],
            [30, 22],
            [38, 30],
            [52, 28],
            [62, 36],
            [78, 40],
          ].map(([x, y], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r={1.4} fill={C.snow} stroke={C.grape} strokeWidth={0.4} />
              <text
                x={x}
                y={y - 2.2}
                fontSize="1.8"
                fontWeight={700}
                fill={C.ink}
                textAnchor="middle"
                fontFamily="var(--font-space-grotesk), system-ui, sans-serif"
              >
                {i + 1}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem 0.6rem" }}>
        {["Dar es Salaam", "Bagamoyo", "Morogoro", "Zanzibar Town", "Stone Town", "Mikumi"].map(
          (city, i) => (
            <span
              key={city}
              style={{
                fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                fontSize: "0.55rem",
                letterSpacing: "0.06em",
                color: C.ink,
                opacity: 0.6,
              }}
            >
              <span style={{ color: C.grape, fontWeight: 700, marginRight: "0.18em" }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              {city}
            </span>
          )
        )}
      </div>
    </div>
  );
}

function VariantCollage() {
  // 4-image grid plus title strip. Multimedia / ensemble form.
  const tiles = [
    "/images/projects/archive/teaching-artist-residency-slovakia-camp.webp",
    "/images/drama-clubs/boy-with-wings.jpg",
    "/images/projects/archive/action-heart-of-europe-street-theatre.webp",
    "/images/opportunities/team-adventure.jpg",
  ];
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "0.7rem 1rem 0.5rem" }}>
        <span
          style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "0.5rem",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: C.teal,
            fontWeight: 700,
          }}
        >
          DAT Lab · NYC 2025
        </span>
        <h4
          style={{
            fontFamily: "var(--font-anton), system-ui, sans-serif",
            fontSize: "1.1rem",
            color: C.ink,
            margin: "0.3rem 0 0.1rem",
            lineHeight: 1,
            textTransform: "uppercase",
          }}
        >
          Things We<br />Made From Nothing
        </h4>
        <span
          style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontSize: "0.62rem",
            color: C.ink,
            opacity: 0.5,
          }}
        >
          Ensemble: Sam Hill, Theo Vance, Iris Mwangi, Lin Park
        </span>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "2px",
          backgroundColor: C.ink,
          flex: 1,
          minHeight: 180,
        }}
      >
        {tiles.map((src, i) => (
          <div key={i} style={{ position: "relative", overflow: "hidden" }}>
            <Image
              src={src}
              alt=""
              fill
              sizes="140px"
              style={{ objectFit: "cover", objectPosition: i % 2 === 0 ? "center 30%" : "center 50%" }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function ArtifactVariants() {
  return (
    <div>
      <p
        style={{
          fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
          fontSize: "0.88rem",
          color: C.ink,
          opacity: 0.62,
          lineHeight: 1.65,
          margin: "0 0 1.5rem",
          maxWidth: "560px",
        }}
      >
        The Journey Card is a <em>form</em>, not a template. Maria&apos;s artifact above is
        text-and-place-led because that fits her work. For other artists the same components
        — DAT seal · project title · artist name · program · journey — should compose
        differently. Four flex modes:
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1rem",
        }}
      >
        {(["photo", "text", "map", "collage"] as VariantMode[]).map((mode) => (
          <VariantCard key={mode} mode={mode} />
        ))}
      </div>
    </div>
  );
}

// ── Section 3: Shareable Postcard ─────────────────────────────────────────────
function ShareablePostcard() {
  return (
    <div style={{ maxWidth: "760px" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow:
            "0 6px 28px rgba(0,0,0,0.16), 0 1px 4px rgba(0,0,0,0.06)",
          border: "1px solid rgba(36,17,35,0.07)",
          minHeight: "400px",
        }}
      >
        {/* Image face */}
        <div style={{ position: "relative", minHeight: "360px" }}>
          <Image
            src="/images/projects/archive/teaching-artist-residency-slovakia-camp.webp"
            alt="PASSAGE Slovakia 2026"
            fill
            sizes="380px"
            style={{ objectFit: "cover", objectPosition: "center 30%" }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(160deg, rgba(36,17,35,0.55) 0%, rgba(36,17,35,0.15) 50%, rgba(36,17,35,0.6) 100%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                alignSelf: "flex-start",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                backgroundColor: "rgba(36,17,35,0.62)",
                padding: "0.3rem 0.5rem 0.3rem 0.35rem",
                borderRadius: "999px",
                backdropFilter: "blur(4px)",
              }}
            >
              <DatLogo size={18} alt="" />
              <span
                style={{
                  color: C.yellow,
                  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                  fontWeight: 700,
                  fontSize: "0.55rem",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                }}
              >
                DAT
              </span>
            </div>
            <div>
              <p
                style={{
                  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                  fontSize: "0.6rem",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: C.yellow,
                  margin: "0 0 0.35rem",
                }}
              >
                {PROGRAM.name}
              </p>
              <h2
                style={{
                  fontFamily: "var(--font-anton), system-ui, sans-serif",
                  fontSize: "clamp(1.4rem, 3vw, 2rem)",
                  color: C.snow,
                  margin: 0,
                  lineHeight: 1.05,
                  textTransform: "uppercase",
                }}
              >
                {ARTIST.name}
              </h2>
              <p
                style={{
                  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                  fontSize: "0.6rem",
                  color: "rgba(242,242,242,0.45)",
                  letterSpacing: "0.04em",
                  margin: "0.35rem 0 0",
                }}
              >
                {PROGRAM.route.join(" → ")}
              </p>
            </div>
          </div>
        </div>

        {/* Text face */}
        <div
          style={{
            backgroundColor: C.cream,
            padding: "1.6rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.25rem",
                paddingBottom: "0.65rem",
                borderBottom: `1px solid ${C.fog}`,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                  fontSize: "0.56rem",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: C.ink,
                  opacity: 0.28,
                }}
              >
                Journey Card
              </span>
              <span
                style={{
                  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                  fontSize: "0.62rem",
                  color: C.ink,
                  opacity: 0.3,
                }}
              >
                {PROGRAM.dates}
              </span>
            </div>

            <blockquote style={{ margin: "0 0 1.4rem" }}>
              <p
                style={{
                  fontFamily: "var(--font-rock-salt), system-ui, sans-serif",
                  fontSize: "0.78rem",
                  color: C.ink,
                  lineHeight: 1.85,
                  margin: "0 0 0.45rem",
                  opacity: 0.85,
                }}
              >
                &ldquo;{PRIMARY_QUOTE}&rdquo;
              </p>
              <footer
                style={{
                  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                  fontSize: "0.65rem",
                  color: C.ink,
                  opacity: 0.35,
                }}
              >
                — {ARTIST.name}
              </footer>
            </blockquote>

            {/* 3 dispatch fragments */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", marginBottom: "1.4rem" }}>
              {CHAPTERS.filter((c) => c.stop && c.layoutMode !== "final")
                .slice(0, 3)
                .map((c) => (
                  <div key={c.id} style={{ display: "flex", gap: "0.6rem" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                        fontSize: "0.55rem",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: C.teal,
                        flexShrink: 0,
                        paddingTop: "0.18rem",
                        width: "62px",
                        lineHeight: 1.4,
                      }}
                    >
                      {c.stop?.split(" ")[0]}
                    </span>
                    <p
                      style={{
                        fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                        fontSize: "0.75rem",
                        fontStyle: "italic",
                        color: `rgba(36,17,35,0.62)`,
                        lineHeight: 1.55,
                        margin: 0,
                      }}
                    >
                      &ldquo;{c.dispatch}&rdquo;
                    </p>
                  </div>
                ))}
            </div>

            {/* Final piece title on the postcard */}
            <div
              style={{
                padding: "0.85rem",
                backgroundColor: C.ink,
                borderRadius: "8px",
                marginBottom: "1.25rem",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                  fontSize: "0.56rem",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: C.grape,
                  margin: "0 0 0.25rem",
                }}
              >
                Final work
              </p>
              <p
                style={{
                  fontFamily: "var(--font-anton), system-ui, sans-serif",
                  fontSize: "1rem",
                  color: C.snow,
                  margin: 0,
                  textTransform: "uppercase",
                  lineHeight: 1.1,
                }}
              >
                {FINAL_PIECE.title}
              </p>
            </div>
          </div>

          <div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem", marginBottom: "0.75rem" }}>
              <button
                type="button"
                style={{
                  backgroundColor: C.ink,
                  color: C.snow,
                  padding: "0.55rem",
                  borderRadius: "6px",
                  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                  letterSpacing: "0.1em",
                  fontSize: "0.65rem",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                Read the full Journey →
              </button>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                {["About DAT", "Support DAT"].map((label, i) => (
                  <button
                    key={label}
                    type="button"
                    style={{
                      flex: 1,
                      backgroundColor: i === 1 ? C.yellow : "transparent",
                      color: i === 1 ? C.ink : C.ink,
                      padding: "0.45rem",
                      borderRadius: "6px",
                      fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                      letterSpacing: "0.08em",
                      fontSize: "0.6rem",
                      textTransform: "uppercase",
                      fontWeight: i === 1 ? 700 : 400,
                      border: i === 0 ? `1px solid rgba(36,17,35,0.18)` : "none",
                      cursor: "pointer",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <p
              style={{
                fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                fontSize: "0.6rem",
                color: C.ink,
                opacity: 0.25,
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              Shared with the artist&apos;s review and approval.{" "}
              dramaticadventure.org
            </p>
          </div>
        </div>
      </div>

      <p
        style={{
          fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
          fontSize: "0.7rem",
          color: C.ink,
          opacity: 0.32,
          margin: "0.75rem 0 0",
          fontStyle: "italic",
        }}
      >
        On mobile: image stacks above text face. Route strip collapses to a pill.
      </p>
    </div>
  );
}

// ── Section 4: Alumni Profile Embed ──────────────────────────────────────────
function AlumniProfileEmbed() {
  return (
    <div style={{ maxWidth: "660px" }}>
      <div
        style={{
          backgroundColor: C.cream,
          borderRadius: "16px",
          padding: "1.6rem",
          border: `1px solid ${C.fog}`,
          boxShadow: "0 3px 14px rgba(0,0,0,0.06)",
        }}
      >
        {/* Profile stub */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.9rem",
            paddingBottom: "1.1rem",
            marginBottom: "1.1rem",
            borderBottom: `1px solid ${C.fog}`,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${C.grape} 0%, ${C.teal} 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: C.yellow,
              fontFamily: "var(--font-anton), system-ui, sans-serif",
              fontSize: "1.1rem",
              flexShrink: 0,
            }}
          >
            MR
          </div>
          <div>
            <p
              style={{
                fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                fontSize: "0.9rem",
                fontWeight: 700,
                color: C.ink,
                margin: 0,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              Maria Reyes
            </p>
            <p
              style={{
                fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                fontSize: "0.75rem",
                color: C.ink,
                opacity: 0.48,
                margin: "0.15rem 0 0",
              }}
            >
              Traveling Artist · Teaching Artist · Writer
            </p>
          </div>
        </div>

        {/* Section label */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.55rem",
            marginBottom: "0.9rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.38rem",
              backgroundColor: C.grape,
              color: C.snow,
              padding: "0.28rem 0.75rem",
              borderRadius: "999px",
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontWeight: 700,
              fontSize: "0.62rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                backgroundColor: C.yellow,
              }}
            />
            Journeys with DAT
          </div>
          <span
            style={{
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              fontSize: "0.68rem",
              color: C.ink,
              opacity: 0.32,
            }}
          >
            1 journey
          </span>
        </div>

        {/* Compact card */}
        <div
          style={{
            backgroundColor: C.ink,
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          {/* Color bar */}
          <div
            style={{
              height: "3px",
              background: `linear-gradient(to right, ${C.yellow}, ${C.grape}, ${C.teal})`,
            }}
          />
          <div style={{ padding: "1.1rem 1.25rem" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "0.6rem",
                gap: "0.4rem",
              }}
            >
              <span
                style={{
                  backgroundColor: "rgba(255,204,0,0.14)",
                  color: C.yellow,
                  border: `1px solid rgba(255,204,0,0.28)`,
                  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                  fontWeight: 700,
                  fontSize: "0.6rem",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  padding: "0.22rem 0.55rem",
                  borderRadius: "999px",
                }}
              >
                {PROGRAM.name}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                  fontSize: "0.62rem",
                  color: "rgba(242,242,242,0.3)",
                  flexShrink: 0,
                }}
              >
                {PROGRAM.dates}
              </span>
            </div>

            <p
              style={{
                fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                fontSize: "0.62rem",
                color: C.teal,
                letterSpacing: "0.03em",
                margin: "0 0 0.55rem",
                opacity: 0.85,
              }}
            >
              {PROGRAM.route.join(" → ")}
            </p>

            <p
              style={{
                fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                fontSize: "0.82rem",
                fontStyle: "italic",
                color: "rgba(242,242,242,0.7)",
                lineHeight: 1.55,
                margin: "0 0 0.85rem",
              }}
            >
              &ldquo;{PRIMARY_QUOTE}&rdquo;
            </p>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                gap: "0.5rem",
                flexWrap: "wrap",
              }}
            >
              <div>
                <p
                  style={{
                    fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                    fontSize: "0.55rem",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "rgba(242,242,242,0.25)",
                    margin: "0 0 0.18rem",
                  }}
                >
                  Final work
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-anton), system-ui, sans-serif",
                    fontSize: "0.9rem",
                    color: C.snow,
                    margin: 0,
                    textTransform: "uppercase",
                    lineHeight: 1.1,
                  }}
                >
                  {FINAL_PIECE.title}
                </p>
              </div>
              <button
                type="button"
                style={{
                  backgroundColor: C.grape,
                  color: "#FFEFE3",
                  padding: "0.48rem 1rem",
                  borderRadius: "6px",
                  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                  letterSpacing: "0.1em",
                  fontSize: "0.65rem",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                View Journey →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Section 5: Share Image Previews ──────────────────────────────────────────
function ShareImagePreviews() {
  const caption =
    "Three weeks in Slovakia with Dramatic Adventure Theatre — and one moment I'm still carrying home.";

  return (
    <div>
      <div
        style={{
          backgroundColor: "rgba(36,17,35,0.04)",
          border: `1px solid ${C.fog}`,
          borderRadius: "9px",
          padding: "0.8rem 1rem",
          marginBottom: "2rem",
          maxWidth: "540px",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "0.56rem",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: C.ink,
            opacity: 0.32,
            margin: "0 0 0.35rem",
          }}
        >
          Sample share caption
        </p>
        <p
          style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontSize: "0.88rem",
            color: C.ink,
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          &ldquo;{caption}&rdquo;
        </p>
      </div>

      <div
        style={{
          display: "flex",
          gap: "1.5rem",
          flexWrap: "wrap",
          alignItems: "flex-start",
        }}
      >
        {/* Square */}
        <div>
          <p
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "0.58rem",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: C.ink,
              opacity: 0.35,
              margin: "0 0 0.55rem",
            }}
          >
            Square · Instagram 1:1
          </p>
          <div
            style={{
              width: "256px",
              height: "256px",
              backgroundColor: C.ink,
              borderRadius: "10px",
              overflow: "hidden",
              boxShadow: "0 5px 18px rgba(0,0,0,0.2)",
              position: "relative",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ position: "relative", flex: "0 0 54%" }}>
              <Image
                src="/images/projects/archive/teaching-artist-residency-slovakia-camp.webp"
                alt="Square share"
                fill
                sizes="256px"
                style={{ objectFit: "cover", objectPosition: "center 30%" }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(to bottom, rgba(36,17,35,0.2) 0%, rgba(36,17,35,0.9) 100%)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: "0.65rem",
                  left: "0.8rem",
                  right: "0.8rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    backgroundColor: C.yellow,
                    color: C.ink,
                    fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                    fontWeight: 700,
                    fontSize: "0.52rem",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    padding: "0.18rem 0.45rem",
                    borderRadius: "999px",
                  }}
                >
                  DAT
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                    fontSize: "0.48rem",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.35)",
                  }}
                >
                  Slovakia 2026
                </span>
              </div>
            </div>
            <div
              style={{
                flex: "0 0 46%",
                backgroundColor: "#201020",
                padding: "0.75rem 0.9rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: "0.38rem",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-rock-salt), system-ui, sans-serif",
                  fontSize: "0.58rem",
                  color: C.snow,
                  lineHeight: 1.65,
                  margin: 0,
                  opacity: 0.88,
                }}
              >
                &ldquo;I arrived thinking I was here to teach.&rdquo;
              </p>
              <p
                style={{
                  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                  fontSize: "0.56rem",
                  fontWeight: 700,
                  color: C.yellow,
                  margin: 0,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Maria Reyes
              </p>
            </div>
          </div>
        </div>

        {/* Story */}
        <div>
          <p
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "0.58rem",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: C.ink,
              opacity: 0.35,
              margin: "0 0 0.55rem",
            }}
          >
            Story 9:16
          </p>
          <div
            style={{
              width: "143px",
              height: "256px",
              borderRadius: "14px",
              overflow: "hidden",
              boxShadow: "0 5px 18px rgba(0,0,0,0.22)",
              position: "relative",
              backgroundColor: C.ink,
            }}
          >
            <Image
              src="/images/rehearsing-nitra.jpg"
              alt="Story share"
              fill
              sizes="143px"
              style={{ objectFit: "cover", objectPosition: "center 20%" }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(to bottom, rgba(36,17,35,0.45) 0%, rgba(36,17,35,0.1) 35%, rgba(36,17,35,0.88) 70%, rgba(36,17,35,0.98) 100%)",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                padding: "0.8rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                    fontWeight: 700,
                    fontSize: "0.52rem",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: C.yellow,
                  }}
                >
                  DAT
                </span>
                <span
                  style={{
                    backgroundColor: "rgba(255,204,0,0.16)",
                    color: C.yellow,
                    border: "1px solid rgba(255,204,0,0.28)",
                    fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                    fontSize: "0.46rem",
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    padding: "0.15rem 0.35rem",
                    borderRadius: "999px",
                  }}
                >
                  PASSAGE 2026
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                <p
                  style={{
                    fontFamily: "var(--font-anton), system-ui, sans-serif",
                    fontSize: "1.25rem",
                    color: C.snow,
                    margin: 0,
                    lineHeight: 0.95,
                    textTransform: "uppercase",
                  }}
                >
                  PASSAGE
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-rock-salt), system-ui, sans-serif",
                    fontSize: "0.48rem",
                    color: C.snow,
                    lineHeight: 1.65,
                    margin: "0 0 0.4rem",
                    opacity: 0.82,
                  }}
                >
                  &ldquo;The cave felt older than language.&rdquo;
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                    fontSize: "0.52rem",
                    fontWeight: 700,
                    color: C.snow,
                    margin: 0,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  Maria Reyes
                </p>
                <div
                  style={{
                    backgroundColor: C.grape,
                    color: C.snow,
                    fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                    fontSize: "0.48rem",
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    padding: "0.3rem",
                    borderRadius: "5px",
                    textAlign: "center",
                    marginTop: "0.15rem",
                  }}
                >
                  Read Journey →
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* OG / link preview */}
        <div>
          <p
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "0.58rem",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: C.ink,
              opacity: 0.35,
              margin: "0 0 0.55rem",
            }}
          >
            Link preview · OG / email
          </p>
          <div
            style={{
              width: "310px",
              borderRadius: "10px",
              overflow: "hidden",
              boxShadow: "0 3px 12px rgba(0,0,0,0.1)",
              border: "1px solid rgba(36,17,35,0.09)",
              backgroundColor: "#fff",
            }}
          >
            <div style={{ position: "relative", height: "155px" }}>
              <Image
                src="/images/projects/archive/teaching-artist-residency-slovakia-camp.webp"
                alt="OG preview"
                fill
                sizes="310px"
                style={{ objectFit: "cover", objectPosition: "center 30%" }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(to bottom, rgba(36,17,35,0.1) 0%, rgba(36,17,35,0.65) 100%)",
                }}
              />
              <span
                style={{
                  position: "absolute",
                  bottom: "0.65rem",
                  left: "0.7rem",
                  backgroundColor: C.yellow,
                  color: C.ink,
                  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                  fontWeight: 700,
                  fontSize: "0.55rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  padding: "0.2rem 0.5rem",
                  borderRadius: "999px",
                }}
              >
                {PROGRAM.name}
              </span>
            </div>
            <div style={{ padding: "0.8rem 0.9rem 1rem" }}>
              <p
                style={{
                  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                  fontSize: "0.55rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: C.teal,
                  margin: "0 0 0.25rem",
                }}
              >
                dramaticadventure.org
              </p>
              <h4
                style={{
                  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  color: C.ink,
                  margin: "0 0 0.28rem",
                  lineHeight: 1.3,
                }}
              >
                {ARTIST.name} — {PROGRAM.name}
              </h4>
              <p
                style={{
                  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                  fontSize: "0.72rem",
                  color: C.ink,
                  opacity: 0.5,
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                {caption}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Section 6: Design Notes ───────────────────────────────────────────────────
function DesignNotes() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "760px" }}>
      {/* Block 1: What the inspiration images contributed */}
      <div
        style={{
          backgroundColor: C.ink,
          borderRadius: "14px",
          padding: "1.85rem",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "0.62rem",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: C.yellow,
            margin: "0 0 1rem",
          }}
        >
          Moves drawn from the references
        </p>
        {[
          [
            "Writing on image",
            "The cover plate lays the title \"Songs We Couldn't Translate\" directly over a hero photograph, with the project's authorship-line written in yellow caps above it — the dominant editorial move from Writing on image and writing across image.",
          ],
          [
            "Handwritten marginalia",
            "Each chapter carries a Rock-Salt-set marginNote — short field-note fragments tucked beside the body. The map spread has a hand-rotated \"drew this on the train\" caption. From writing around image and journal/journal 2.",
          ],
          [
            "Map and color as structure",
            "The route is no longer a text strip — it is a real drawn map spread with a country plate, route line, numbered stops, scale bar, and DAT field-survey corner stamp. From map and color and timline.",
          ],
          [
            "Contact-sheet grid",
            "The Zemplínska Teplica chapter uses a two-up contact-sheet grid rather than a single hero photo — the documentary register from grid, grid surprise, and lots of images.",
          ],
          [
            "Quiet white space",
            "The Luník IX chapter is text-only and pulls the dispatch larger, with no photograph and an italic note explaining the absence. From clean lines and clean journey — restraint as composition.",
          ],
          [
            "Editorial cover hierarchy",
            "DAT seal (publisher) → small program tag → hero image with authorship line and the largest title in the artifact → artist credit strip beneath. The masthead pattern from editorial 3 and editorial collage 2.",
          ],
          [
            "Asymmetry chapter-to-chapter",
            "Image-led, split, contact, quiet, wide-with-overlay, and final — no two chapters compose the same way. Drawn from how spread 2 and journal vary spread treatments rather than templating them.",
          ],
        ].map(([label, text]) => (
          <div
            key={label}
            style={{
              display: "grid",
              gridTemplateColumns: "180px 1fr",
              gap: "1rem",
              padding: "0.7rem 0",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
              alignItems: "baseline",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                fontSize: "0.66rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
                color: C.yellow,
                opacity: 0.92,
                textTransform: "uppercase",
              }}
            >
              {label}
            </span>
            <p
              style={{
                fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                fontSize: "0.82rem",
                color: "rgba(242,242,242,0.7)",
                lineHeight: 1.62,
                margin: 0,
              }}
            >
              {text}
            </p>
          </div>
        ))}
      </div>

      {/* Block 2: Why this feels like an artifact (not a webpage) */}
      <div
        style={{
          backgroundColor: C.parchment,
          borderRadius: "14px",
          padding: "1.85rem",
          border: `1px solid ${C.fog}`,
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "0.62rem",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: C.grape,
            margin: "0 0 1rem",
          }}
        >
          Why this reads as artifact, not webpage
        </p>
        <p
          style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontSize: "0.92rem",
            color: C.ink,
            opacity: 0.7,
            lineHeight: 1.7,
            margin: "0 0 0.85rem",
          }}
        >
          Three things shifted from v3. <strong>One:</strong> the cover plate now functions as
          a cover, not a header — masthead, hero image, the title written across the photograph,
          edition number, premiere venue, all composed as if printed. <strong>Two:</strong> the
          route map is now a real spread of its own (with grid, country plate, route path, stop
          numbers, scale, and a DAT survey stamp), the way a journal or field document would
          treat geography. <strong>Three:</strong> the chapters compose differently from one
          another, the way a magazine&apos;s spreads vary; the layout itself becomes evidence
          that this artifact was made <em>from this artist&apos;s material</em>, not poured into
          a template.
        </p>
        <p
          style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontSize: "0.85rem",
            color: C.ink,
            opacity: 0.55,
            lineHeight: 1.65,
            margin: 0,
          }}
        >
          The DAT logo appears <em>three times</em>, each time as a printer / publisher mark:
          in the masthead at top-left, as a small corner stamp on the field-survey map, and as
          the 76mm circular seal at the bottom of the carrying-forward spread. It behaves like
          a maker&apos;s mark on a printed object, not a logo on a webpage.
        </p>
      </div>

      {/* Block 3: Hierarchy explanation */}
      <div
        style={{
          backgroundColor: C.cream,
          borderRadius: "14px",
          padding: "1.85rem",
          border: `1px solid ${C.fog}`,
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "0.62rem",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: C.teal,
            margin: "0 0 1rem",
          }}
        >
          Hierarchy — how the four marks sit
        </p>
        {[
          ["DAT", "Publisher / maker mark. Small but recurring. Sets context that this artifact comes from a known practice."],
          ["PASSAGE · Slovakia 2026", "Program / journey. Small program tag in yellow over the hero, repeated in the masthead. Frames the context the work was made within."],
          ["Songs We Couldn't Translate", "Maria's created work. LARGEST type in the artifact — written across the hero image like a movie title. The artifact exists to document how this piece came to be."],
          ["Maria Reyes", "Artist / author. Appears as the credit-line over the hero (\"A performance essay by\") and again beneath the hero as the bylined author block in Anton caps. Clearly authorship, not a label."],
        ].map(([label, text]) => (
          <div
            key={label}
            style={{
              display: "grid",
              gridTemplateColumns: "200px 1fr",
              gap: "1rem",
              padding: "0.8rem 0",
              borderBottom: `1px solid ${C.fog}`,
              alignItems: "baseline",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                fontSize: "0.7rem",
                fontWeight: 700,
                letterSpacing: "0.04em",
                color: C.ink,
                opacity: 0.78,
              }}
            >
              {label}
            </span>
            <p
              style={{
                fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                fontSize: "0.82rem",
                color: C.ink,
                opacity: 0.65,
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              {text}
            </p>
          </div>
        ))}
      </div>

      {/* Block 4: What still has to be decided */}
      <div
        style={{
          backgroundColor: C.cream,
          borderRadius: "14px",
          padding: "1.85rem",
          border: `1px solid ${C.fog}`,
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "0.62rem",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: C.ink,
            opacity: 0.42,
            margin: "0 0 1rem",
          }}
        >
          Decide before building
        </p>
        {[
          ["Program chapter data model", "Chapter labels (DAT Lab, Teaching Artist Residency, etc.) are program-specific. They have to live in a structured Program model, not free-text per artist, otherwise the artifact loses its specificity. Production needs: program → ordered components → assigned stops."],
          ["Variant choice", "Should each artist pick a variant (text-led / photo-led / map-led / collage-led), or does the system suggest one from their submitted material? Recommendation: artist picks, with a suggestion based on what they submitted."],
          ["Final piece fallback", "When a program has no single \"final piece,\" the bottom-of-spread title slot needs another anchor — \"What this journey produced,\" maybe — and the cover plate needs to drop the title overlay gracefully."],
          ["Hand-drawn map source", "The country plate here is a schematic SVG. Production decision: stylized country outlines per country (small library), or a single neutral plate with stops only?"],
          ["Mobile composition", "The route spine + chapter columns and the cover plate's giant title work on desktop; on a narrow phone the spine should compress to a chapter-number badge inline with each header, and the cover title should reflow. Not yet implemented in this mockup."],
          ["DAT seal asset", "The 76mm circular seal at the bottom uses dat-logo7.svg inside a stroked circle. If DAT wants a true \"stamp\" finish (texture / slightly broken edge / faux-letterpress), we'd want a dedicated stamp asset rather than synthesizing it in CSS."],
          ["Postcard / share URLs", "Postcard wants /journey/maria-reyes-slovakia-2026 or similar. Slug auto-generated from artist + program slugs, or artist-chosen?"],
          ["Privacy / approval flow", "The colophon line \"reviewed and approved by the artist before sharing\" implies a real approval state. That has to actually exist before a Journey Card is ever publicly shareable."],
        ].map(([label, text]) => (
          <div
            key={label}
            style={{
              display: "grid",
              gridTemplateColumns: "200px 1fr",
              gap: "1rem",
              padding: "0.8rem 0",
              borderBottom: `1px solid ${C.fog}`,
              alignItems: "baseline",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                fontSize: "0.68rem",
                fontWeight: 700,
                letterSpacing: "0.04em",
                color: C.ink,
                opacity: 0.72,
              }}
            >
              {label}
            </span>
            <p
              style={{
                fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                fontSize: "0.82rem",
                color: C.ink,
                opacity: 0.62,
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              {text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function JourneyCardFinal() {
  return (
    <>
      <MockupBanner />
      <main
        style={{
          backgroundImage: "url('/texture/kraft-paper.png')",
          backgroundSize: "cover",
          backgroundAttachment: "fixed",
          minHeight: "100vh",
          padding: "3rem 1.5rem 7rem",
        }}
      >
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          {/* Page header */}
          <div style={{ marginBottom: "3.5rem" }}>
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.85rem", marginBottom: "0.4rem" }}
            >
              <h1
                style={{
                  fontFamily: "var(--font-anton), system-ui, sans-serif",
                  fontSize: "clamp(1.8rem, 4.5vw, 3rem)",
                  color: C.ink,
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                  margin: 0,
                  lineHeight: 1,
                }}
              >
                Journey Card
              </h1>
              <span
                style={{
                  backgroundColor: C.ink,
                  color: C.yellow,
                  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  padding: "0.25em 0.65em",
                  borderRadius: "3px",
                }}
              >
                v4
              </span>
            </div>
            <p
              style={{
                fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                fontSize: "0.92rem",
                color: C.ink,
                opacity: 0.55,
                lineHeight: 1.6,
                maxWidth: "600px",
                margin: 0,
              }}
            >
              Field-edition artifact. DAT publisher seal. Editorial cover plate with the project
              title written across a hero image. Hand-drawn route map as a real structural
              spread. Chapter dispatches in mixed layouts — image-led, split, contact sheet,
              quiet, wide with handwritten overlay, climactic — drawn from the editorial /
              journal references.
            </p>
          </div>

          <MockupSection
            id="card"
            n="01"
            label="Primary Journey Card"
            sublabel="Maria's artifact — cover plate, route map, varied chapter spreads, DAT publisher seal"
          >
            <PrimaryJourneyCard />
          </MockupSection>

          <MockupSection
            id="variants"
            n="02"
            label="Artifact Variants"
            sublabel="The form flexes — photo-led, text-led, map-led, collage-led — to fit the artist"
          >
            <ArtifactVariants />
          </MockupSection>

          <MockupSection
            id="postcard"
            n="03"
            label="Shareable Postcard"
            sublabel="Two-panel postal card form — image face + text face"
          >
            <ShareablePostcard />
          </MockupSection>

          <MockupSection
            id="profile-embed"
            n="04"
            label="Alumni Profile Embed"
            sublabel="Compact card within the artist's DAT profile"
          >
            <AlumniProfileEmbed />
          </MockupSection>

          <MockupSection
            id="share-images"
            n="05"
            label="Share Image Previews"
            sublabel="Square, story, and link-preview formats"
          >
            <ShareImagePreviews />
          </MockupSection>

          <MockupSection
            id="notes"
            n="06"
            label="Design Notes"
            sublabel="What this version tests and what to decide before building"
          >
            <DesignNotes />
          </MockupSection>
        </div>
      </main>
    </>
  );
}
