// app/journey-card-mockup/v7/JourneyCardV7.tsx
// ⚠️  MOCKUP ONLY — no live data, no auth, no backend, no commits.
//
// v7: Dark zine. Not a magazine, not a website. A thing the artist assembled
// from their own material and handed to you. Prompt-response pairs (one per
// chapter, answered during the journey). Artist headshot on the cover.
// Program name + artist name front and center. Photos are personal, not stock.
// DAT is a maker's mark, not the subject.
"use client";

import Image from "next/image";

// ── Tokens ────────────────────────────────────────────────────────────────────
const C = {
  bg:       "#241123",         // page background — DAT ink
  card:     "#1E0D1E",         // slightly darker card surface
  lift:     "rgba(255,255,255,0.04)",  // subtle card lift
  border:   "rgba(255,255,255,0.08)",
  grape:    "#6C00AF",
  yellow:   "#FFCC00",
  teal:     "#2493A9",
  snow:     "#F2F2F2",
  cream:    "#EDE3D0",
  muted:    "rgba(242,242,242,0.45)",
  dim:      "rgba(242,242,242,0.22)",
};

// ── Data ──────────────────────────────────────────────────────────────────────
const ARTIST = {
  name:   "Maria Reyes",
  roles:  ["Traveling Artist", "Teaching Artist", "Writer"],
  photo:  "/images/drama-clubs/boy-with-wings.jpg",  // stand-in headshot
  initials: "MR",
};

const PROGRAM = {
  name:   "PASSAGE: Slovakia 2026",
  word:   "PASSAGE",
  place:  "Slovakia",
  year:   "2026",
  dates:  "12 July – 2 August 2026",
  route:  ["Bratislava", "Košice", "Zemplínska Teplica", "Luník IX", "Slovenský Raj", "Košice"],
};

const PRIMARY_QUOTE =
  "I arrived thinking I was here to teach. I left knowing how much I had been taught.";

const CARRYING_FORWARD = "A different relationship to silence.";

const FINAL_WORK = {
  title:       "Songs We Couldn't Translate",
  form:        "A short performance essay",
  occasion:    "Eclectic Evening · Košice · 31 July 2026",
  description: "Built from field notes, translation pauses, children's games, and the sound of rain in Zemplínska Teplica.",
};

const DAT_NOTE =
  "Maria's work with Drama Club participants at Luník IX shaped the closing installation in ways none of us had planned. Her final essay — built from field notes and fragments — became one of the defining pieces of PASSAGE 2026.";

// ── Chapters: one prompt-response pair per stop ───────────────────────────────
type Chapter = {
  id:        string;
  ch:        string;
  place:     string | null;
  date:      string;
  component: string;
  prompt:    string;
  response:  string;
  photos:    { src: string; caption: string; rotate: number }[];
  size:      "quiet" | "normal" | "wide" | "final";
};

const CHAPTERS: Chapter[] = [
  {
    id: "before",
    ch: "00",
    place: null,
    date: "9 July",
    component: "The night before",
    prompt: "What are you arriving with?",
    response: "I was afraid I would not know how to enter the room.",
    photos: [],
    size: "quiet",
  },
  {
    id: "bratislava",
    ch: "01",
    place: "Bratislava",
    date: "12 July",
    component: "Program Orientation",
    prompt: "When did you actually arrive?",
    response:
      "The first moment I arrived was not at the airport. It was the first time I heard the group laugh together.",
    photos: [
      {
        src: "/images/projects/archive/action-heart-of-europe-street-theatre.webp",
        caption: "the hallway laugh.",
        rotate: -2.2,
      },
    ],
    size: "normal",
  },
  {
    id: "kosice-lab",
    ch: "02",
    place: "Košice",
    date: "14–18 July",
    component: "DAT Lab",
    prompt: "What image keeps returning?",
    response:
      "I kept returning to the image of a doorway — who stands inside, who waits outside, who gets invited in.",
    photos: [
      {
        src: "/images/rehearsing-nitra.jpg",
        caption: "DAT Lab — sketching the doorway.",
        rotate: 1.4,
      },
    ],
    size: "normal",
  },
  {
    id: "teplica",
    ch: "03",
    place: "Zemplínska Teplica",
    date: "19–22 July",
    component: "Teaching Artist Residency",
    prompt: "Who taught you today?",
    response:
      "A student corrected my rhythm with her whole body. She taught me before we shared a language.",
    photos: [
      {
        src: "/images/projects/archive/teaching-artist-residency-slovakia-camp.webp",
        caption: "she counted with her shoulders.",
        rotate: -1.8,
      },
      {
        src: "/images/drama-clubs/boy-with-wings.jpg",
        caption: "games before language.",
        rotate: 2.1,
      },
    ],
    size: "wide",
  },
  {
    id: "lunik",
    ch: "04",
    place: "Luník IX",
    date: "23 July",
    component: "Drama Club & Community Showcase",
    prompt: "What's hard to put into words?",
    response:
      "I don't want to explain what happened today. I want to honor it.",
    photos: [],
    size: "quiet",
  },
  {
    id: "raj",
    ch: "05",
    place: "Slovenský Raj",
    date: "26 July",
    component: "Cohort Retreat",
    prompt: "What did the quiet teach you?",
    response:
      "The cave felt older than language. I stopped trying to make meaning and started listening.",
    photos: [
      {
        src: "/images/opportunities/team-adventure.jpg",
        caption: "older than language.",
        rotate: -1.2,
      },
    ],
    size: "normal",
  },
  {
    id: "final",
    ch: "06",
    place: "Košice",
    date: "31 July",
    component: "Eclectic Evening · Final Performance",
    prompt: "What are you carrying home?",
    response: "I am carrying home a different relationship to silence.",
    photos: [
      {
        src: "/images/theatre/archive/hotel-millionaire/hotel_millionaire1.jpg",
        caption: "Eclectic Evening.",
        rotate: 0.8,
      },
    ],
    size: "final",
  },
];

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
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "0.6rem",
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            backgroundColor: C.bg,
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
            color: C.bg,
            opacity: 0.65,
          }}
        >
          /journey-card-mockup/v7 · dark zine
        </span>
      </div>
      <nav style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
        {[
          ["#cover", "Cover"],
          ["#journey", "Journey"],
          ["#work", "Final Work"],
          ["#share", "Share"],
        ].map(([href, label]) => (
          <a
            key={href}
            href={href}
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "0.58rem",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: C.bg,
              textDecoration: "none",
              padding: "0.18rem 0.5rem",
              borderRadius: "3px",
              backgroundColor: "rgba(36,17,35,0.12)",
            }}
          >
            {label}
          </a>
        ))}
      </nav>
    </div>
  );
}

// ── DAT mark ──────────────────────────────────────────────────────────────────
function DatMark({ size = 28 }: { size?: number }) {
  return (
    <Image
      src="/images/dat-logo7.svg"
      alt="Dramatic Adventure Theatre"
      width={size}
      height={size}
      style={{ display: "block", opacity: 0.9 }}
    />
  );
}

// ── Cover ──────────────────────────────────────────────────────────────────────
// The artist's photo, their name, the program name. Like a zine cover page.
function Cover() {
  return (
    <div
      id="cover"
      style={{
        paddingBottom: "3rem",
        borderBottom: `1px solid ${C.border}`,
        marginBottom: "3rem",
      }}
    >
      {/* Top strip: DAT mark + program name */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "2.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <DatMark size={24} />
          <span
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "0.58rem",
              fontWeight: 700,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: C.muted,
            }}
          >
            Dramatic Adventure Theatre
          </span>
        </div>
        <span
          style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "0.52rem",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: C.dim,
          }}
        >
          Journey Card
        </span>
      </div>

      {/* Program name — the loudest thing on the cover */}
      <div style={{ marginBottom: "2rem" }}>
        <p
          style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "0.62rem",
            fontWeight: 700,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            color: C.teal,
            margin: "0 0 0.5rem",
          }}
        >
          {PROGRAM.place} · {PROGRAM.year}
        </p>
        <h1
          style={{
            fontFamily: "var(--font-anton), system-ui, sans-serif",
            fontSize: "clamp(3.2rem, 10vw, 5.5rem)",
            color: C.yellow,
            margin: 0,
            lineHeight: 0.9,
            textTransform: "uppercase",
            letterSpacing: "-0.01em",
          }}
        >
          {PROGRAM.word}
        </h1>
      </div>

      {/* Artist photo + name — tipped slightly, like it was placed by hand */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr",
          gap: "1.5rem",
          alignItems: "flex-end",
          marginBottom: "2rem",
        }}
      >
        {/* Photo — slightly tilted */}
        <div
          style={{
            transform: "rotate(-1.8deg)",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 120,
              height: 150,
              position: "relative",
              borderRadius: "2px",
              overflow: "hidden",
              border: "3px solid rgba(255,255,255,0.92)",
              boxShadow: "3px 5px 20px rgba(0,0,0,0.45)",
            }}
          >
            <Image
              src={ARTIST.photo}
              alt={ARTIST.name}
              fill
              sizes="120px"
              style={{ objectFit: "cover", objectPosition: "center 20%" }}
            />
          </div>
          {/* Caption under photo */}
          <p
            style={{
              fontFamily: "var(--font-rock-salt), system-ui, sans-serif",
              fontSize: "0.55rem",
              color: C.muted,
              margin: "0.4rem 0 0",
              textAlign: "center",
            }}
          >
            {ARTIST.name.split(" ")[0].toLowerCase()}
          </p>
        </div>

        {/* Name block */}
        <div>
          <p
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "0.58rem",
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: C.dim,
              margin: "0 0 0.4rem",
            }}
          >
            Artist
          </p>
          <h2
            style={{
              fontFamily: "var(--font-anton), system-ui, sans-serif",
              fontSize: "clamp(1.8rem, 5vw, 2.8rem)",
              color: C.snow,
              margin: "0 0 0.5rem",
              textTransform: "uppercase",
              lineHeight: 1,
              letterSpacing: "0.01em",
            }}
          >
            {ARTIST.name}
          </h2>
          <p
            style={{
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              fontSize: "0.78rem",
              color: C.muted,
              margin: "0 0 1.1rem",
              lineHeight: 1.4,
            }}
          >
            {ARTIST.roles.join(" · ")}
          </p>
          <p
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "0.6rem",
              letterSpacing: "0.1em",
              color: C.dim,
              margin: 0,
            }}
          >
            {PROGRAM.dates}
          </p>
        </div>
      </div>

      {/* Route strip */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          flexWrap: "wrap",
          padding: "0.7rem 0",
          borderTop: `1px solid ${C.border}`,
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "0.52rem",
            fontWeight: 700,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: C.teal,
            marginRight: "0.25rem",
            flexShrink: 0,
          }}
        >
          Route
        </span>
        {PROGRAM.route.map((city, i) => (
          <span key={city + i} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span
              style={{
                fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                fontSize: "0.65rem",
                color:
                  i === 0 || i === PROGRAM.route.length - 1
                    ? C.yellow
                    : C.muted,
                fontWeight: i === 0 || i === PROGRAM.route.length - 1 ? 700 : 400,
                whiteSpace: "nowrap",
              }}
            >
              {city}
            </span>
            {i < PROGRAM.route.length - 1 && (
              <span style={{ color: C.dim, fontSize: "0.6rem" }}>→</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Opening quote ──────────────────────────────────────────────────────────────
function OpeningQuote() {
  return (
    <div
      style={{
        padding: "1rem 0 3rem",
        borderBottom: `1px solid ${C.border}`,
        marginBottom: "3rem",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-rock-salt), system-ui, sans-serif",
          fontSize: "clamp(0.9rem, 2.5vw, 1.2rem)",
          color: C.snow,
          lineHeight: 1.8,
          opacity: 0.88,
          margin: "0 0 0.75rem",
        }}
      >
        &ldquo;{PRIMARY_QUOTE}&rdquo;
      </p>
      <p
        style={{
          fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
          fontSize: "0.7rem",
          color: C.dim,
          margin: 0,
          letterSpacing: "0.06em",
        }}
      >
        — {ARTIST.name}, on the train to Košice
      </p>
    </div>
  );
}

// ── Photo strip: polaroid-style ────────────────────────────────────────────────
function PhotoStrip({ photos }: { photos: Chapter["photos"] }) {
  if (photos.length === 0) return null;

  // Single photo
  if (photos.length === 1) {
    const p = photos[0];
    return (
      <div
        style={{
          marginTop: "1.25rem",
          display: "inline-block",
          transform: `rotate(${p.rotate}deg)`,
          transformOrigin: "center center",
        }}
      >
        <div
          style={{
            backgroundColor: "#fff",
            padding: "5px 5px 22px",
            boxShadow: "2px 4px 18px rgba(0,0,0,0.5)",
            display: "inline-block",
          }}
        >
          <div
            style={{
              position: "relative",
              width: 220,
              height: 160,
              overflow: "hidden",
              display: "block",
            }}
          >
            <Image
              src={p.src}
              alt={p.caption}
              fill
              sizes="220px"
              style={{ objectFit: "cover", objectPosition: "center 30%" }}
            />
          </div>
          <p
            style={{
              fontFamily: "var(--font-rock-salt), system-ui, sans-serif",
              fontSize: "0.52rem",
              color: "#241123",
              margin: "5px 2px 0",
              textAlign: "center",
              lineHeight: 1.3,
            }}
          >
            {p.caption}
          </p>
        </div>
      </div>
    );
  }

  // Two photos — staggered side by side
  return (
    <div
      style={{
        marginTop: "1.5rem",
        display: "flex",
        gap: "1rem",
        alignItems: "flex-start",
        flexWrap: "wrap",
      }}
    >
      {photos.map((p) => (
        <div
          key={p.src}
          style={{
            transform: `rotate(${p.rotate}deg)`,
            transformOrigin: "center center",
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              padding: "4px 4px 18px",
              boxShadow: "2px 4px 14px rgba(0,0,0,0.45)",
              display: "inline-block",
            }}
          >
            <div
              style={{
                position: "relative",
                width: 160,
                height: 120,
                overflow: "hidden",
              }}
            >
              <Image
                src={p.src}
                alt={p.caption}
                fill
                sizes="160px"
                style={{ objectFit: "cover", objectPosition: "center 30%" }}
              />
            </div>
            <p
              style={{
                fontFamily: "var(--font-rock-salt), system-ui, sans-serif",
                fontSize: "0.48rem",
                color: "#241123",
                margin: "4px 2px 0",
                textAlign: "center",
                lineHeight: 1.3,
              }}
            >
              {p.caption}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Chapter card ───────────────────────────────────────────────────────────────
function ChapterCard({ chapter }: { chapter: Chapter }) {
  const isQuiet  = chapter.size === "quiet";
  const isFinal  = chapter.size === "final";

  return (
    <div
      style={{
        backgroundColor: isFinal ? "transparent" : C.lift,
        border: `1px solid ${isFinal ? C.yellow + "33" : C.border}`,
        borderRadius: "6px",
        padding: isFinal ? "2rem 0" : "1.5rem",
        marginBottom: "1.5rem",
        borderLeft: isFinal ? `3px solid ${C.yellow}` : `1px solid ${C.border}`,
        paddingLeft: isFinal ? "1.5rem" : undefined,
      }}
    >
      {/* Chapter header */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: "0.6rem",
          marginBottom: "0.75rem",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "0.58rem",
            fontWeight: 700,
            letterSpacing: "0.22em",
            color: isFinal ? C.yellow : C.teal,
          }}
        >
          CH {chapter.ch}
        </span>
        {chapter.place && (
          <>
            <span style={{ color: C.dim, fontSize: "0.6rem" }}>·</span>
            <span
              style={{
                fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                fontSize: "0.62rem",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: isFinal ? C.snow : C.muted,
              }}
            >
              {chapter.place}
            </span>
          </>
        )}
        <span style={{ color: C.dim, fontSize: "0.6rem" }}>·</span>
        <span
          style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontSize: "0.6rem",
            color: C.dim,
            fontStyle: "italic",
          }}
        >
          {chapter.component}
        </span>
      </div>

      {/* Prompt */}
      <div style={{ marginBottom: "0.9rem" }}>
        <span
          style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "0.5rem",
            fontWeight: 700,
            letterSpacing: "0.26em",
            textTransform: "uppercase",
            color: C.grape,
            marginRight: "0.5rem",
          }}
        >
          Prompt
        </span>
        <span
          style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontSize: "0.75rem",
            color: C.muted,
            fontStyle: "italic",
          }}
        >
          {chapter.prompt}
        </span>
      </div>

      {/* Response */}
      <p
        style={{
          fontFamily: isFinal ? "var(--font-rock-salt), system-ui, sans-serif" : "var(--font-dm-sans), system-ui, sans-serif",
          fontSize: isQuiet
            ? "1.15rem"
            : isFinal
            ? "clamp(0.95rem, 2.2vw, 1.2rem)"
            : "1rem",
          color: isQuiet || isFinal ? C.snow : "rgba(242,242,242,0.88)",
          lineHeight: 1.6,
          margin: 0,
          fontWeight: isQuiet ? 500 : 400,
          fontStyle: isFinal ? "normal" : undefined,
        }}
      >
        &ldquo;{chapter.response}&rdquo;
      </p>

      {/* No-photo note for quiet chapters */}
      {isQuiet && chapter.photos.length === 0 && (
        <p
          style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "0.5rem",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: C.dim,
            margin: "1.25rem 0 0",
          }}
        >
          No photograph from this room.
        </p>
      )}

      {/* Photos */}
      <PhotoStrip photos={chapter.photos} />

      {/* Date footer */}
      <div
        style={{
          marginTop: "1rem",
          paddingTop: "0.6rem",
          borderTop: `1px solid ${C.border}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "0.55rem",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: C.dim,
          }}
        >
          {chapter.date}
        </span>
        {isFinal && (
          <span
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "0.55rem",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: C.yellow,
              opacity: 0.7,
            }}
          >
            Final entry
          </span>
        )}
      </div>
    </div>
  );
}

// ── Journey section ────────────────────────────────────────────────────────────
function JourneySection() {
  return (
    <section id="journey" style={{ marginBottom: "4rem" }}>
      {/* Section header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          marginBottom: "2rem",
        }}
      >
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            backgroundColor: C.teal,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "0.6rem",
            fontWeight: 700,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: C.teal,
          }}
        >
          Field Dispatches
        </span>
        <span
          style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontSize: "0.65rem",
            color: C.dim,
            fontStyle: "italic",
          }}
        >
          answered during the journey
        </span>
      </div>

      {CHAPTERS.map((chapter) => (
        <ChapterCard key={chapter.id} chapter={chapter} />
      ))}
    </section>
  );
}

// ── Carrying Forward ───────────────────────────────────────────────────────────
function CarryingForward() {
  return (
    <div
      style={{
        padding: "2.5rem 0",
        borderTop: `1px solid ${C.border}`,
        borderBottom: `1px solid ${C.border}`,
        marginBottom: "3rem",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
          fontSize: "0.55rem",
          fontWeight: 700,
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          color: C.dim,
          margin: "0 0 1.25rem",
        }}
      >
        What I&apos;m carrying forward
      </p>
      <p
        style={{
          fontFamily: "var(--font-rock-salt), system-ui, sans-serif",
          fontSize: "clamp(1.1rem, 3vw, 1.55rem)",
          color: C.yellow,
          lineHeight: 1.55,
          margin: 0,
          transform: "rotate(-0.5deg)",
          transformOrigin: "left center",
        }}
      >
        {CARRYING_FORWARD}
      </p>
    </div>
  );
}

// ── Final Work ────────────────────────────────────────────────────────────────
function FinalWork() {
  return (
    <section id="work" style={{ marginBottom: "3.5rem" }}>
      <div
        style={{
          position: "relative",
          borderRadius: "6px",
          overflow: "hidden",
        }}
      >
        {/* Full-bleed program photo behind the work title */}
        <div style={{ position: "relative", width: "100%", height: 220 }}>
          <Image
            src="/images/projects/archive/teaching-artist-residency-slovakia-camp.webp"
            alt={FINAL_WORK.title}
            fill
            sizes="600px"
            style={{ objectFit: "cover", objectPosition: "center 35%" }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(36,17,35,0.55) 0%, rgba(36,17,35,0.92) 100%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                fontSize: "0.55rem",
                fontWeight: 700,
                letterSpacing: "0.26em",
                textTransform: "uppercase",
                color: C.grape,
                margin: "0 0 0.4rem",
                opacity: 0.9,
              }}
            >
              {FINAL_WORK.form}
            </p>
            <h2
              style={{
                fontFamily: "var(--font-anton), system-ui, sans-serif",
                fontSize: "clamp(1.8rem, 5vw, 2.8rem)",
                color: C.snow,
                margin: "0 0 0.35rem",
                lineHeight: 0.97,
                textTransform: "uppercase",
                letterSpacing: "-0.005em",
              }}
            >
              {FINAL_WORK.title}
            </h2>
            <p
              style={{
                fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                fontSize: "0.68rem",
                color: C.muted,
                margin: 0,
                letterSpacing: "0.04em",
              }}
            >
              {FINAL_WORK.occasion}
            </p>
          </div>
        </div>
        {/* Description */}
        <div
          style={{
            backgroundColor: C.lift,
            border: `1px solid ${C.border}`,
            borderTop: "none",
            borderRadius: "0 0 6px 6px",
            padding: "1.1rem 1.5rem",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              fontSize: "0.9rem",
              color: "rgba(242,242,242,0.7)",
              lineHeight: 1.65,
              margin: 0,
            }}
          >
            {FINAL_WORK.description}
          </p>
        </div>
      </div>
    </section>
  );
}

// ── DAT Note ──────────────────────────────────────────────────────────────────
function DatNoteSection() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "auto 1fr",
        gap: "0.85rem",
        alignItems: "start",
        padding: "1.5rem 0",
        borderTop: `1px solid ${C.border}`,
        marginBottom: "2.5rem",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
          fontSize: "0.52rem",
          fontWeight: 700,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: C.teal,
          flexShrink: 0,
          marginTop: "0.15rem",
          width: 58,
        }}
      >
        From DAT
      </span>
      <p
        style={{
          fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
          fontSize: "0.82rem",
          color: C.muted,
          lineHeight: 1.65,
          margin: 0,
        }}
      >
        {DAT_NOTE}
      </p>
    </div>
  );
}

// ── CTAs ──────────────────────────────────────────────────────────────────────
function CTAs() {
  return (
    <div
      style={{
        display: "flex",
        gap: "0.65rem",
        flexWrap: "wrap",
        paddingBottom: "1.5rem",
        borderBottom: `1px solid ${C.border}`,
        marginBottom: "1.5rem",
      }}
    >
      {[
        { label: "Share this Journey", bg: C.yellow, color: C.bg, weight: 700 },
        { label: "View Maria's Profile", bg: "transparent", color: C.snow, weight: 400 },
        { label: "Support DAT", bg: C.grape, color: C.snow, weight: 700 },
      ].map((btn) => (
        <button
          key={btn.label}
          type="button"
          style={{
            backgroundColor: btn.bg,
            color: btn.color,
            fontWeight: btn.weight,
            padding: "0.6rem 1.25rem",
            borderRadius: "6px",
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "0.68rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            border: btn.bg === "transparent" ? `1px solid ${C.border}` : "none",
            cursor: "pointer",
          }}
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
}

// ── Share section preview ─────────────────────────────────────────────────────
// Shows what the share image and postcard look like — kept intentionally compact.
function ShareSection() {
  return (
    <section id="share" style={{ marginTop: "4rem", paddingTop: "3rem", borderTop: `1px solid ${C.border}` }}>
      <p
        style={{
          fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
          fontSize: "0.6rem",
          fontWeight: 700,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: C.dim,
          marginBottom: "2rem",
        }}
      >
        Share formats
      </p>

      <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", alignItems: "flex-start" }}>

        {/* Instagram square */}
        <div>
          <p style={{ fontFamily: "var(--font-space-grotesk), system-ui, sans-serif", fontSize: "0.52rem", letterSpacing: "0.14em", textTransform: "uppercase", color: C.dim, margin: "0 0 0.5rem" }}>
            Square · Instagram
          </p>
          <div
            style={{
              width: 240,
              height: 240,
              backgroundColor: C.bg,
              borderRadius: "8px",
              overflow: "hidden",
              boxShadow: "0 4px 18px rgba(0,0,0,0.4)",
              position: "relative",
            }}
          >
            <Image
              src="/images/projects/archive/teaching-artist-residency-slovakia-camp.webp"
              alt="Share square"
              fill
              sizes="240px"
              style={{ objectFit: "cover", objectPosition: "center 30%", opacity: 0.55 }}
            />
            <div style={{ position: "absolute", inset: 0, padding: "1rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <DatMark size={20} />
                <span style={{ fontFamily: "var(--font-space-grotesk), system-ui, sans-serif", fontSize: "0.5rem", letterSpacing: "0.14em", textTransform: "uppercase", color: C.yellow, fontWeight: 700 }}>
                  PASSAGE 2026
                </span>
              </div>
              <div>
                <p style={{ fontFamily: "var(--font-rock-salt), system-ui, sans-serif", fontSize: "0.62rem", color: C.snow, lineHeight: 1.6, margin: "0 0 0.5rem", opacity: 0.9 }}>
                  &ldquo;I arrived thinking I was here to teach.&rdquo;
                </p>
                <p style={{ fontFamily: "var(--font-space-grotesk), system-ui, sans-serif", fontSize: "0.62rem", fontWeight: 700, color: C.snow, margin: "0 0 0.15rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {ARTIST.name}
                </p>
                <p style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: "0.54rem", color: C.muted, margin: 0 }}>
                  Slovakia · DAT
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Link preview card */}
        <div>
          <p style={{ fontFamily: "var(--font-space-grotesk), system-ui, sans-serif", fontSize: "0.52rem", letterSpacing: "0.14em", textTransform: "uppercase", color: C.dim, margin: "0 0 0.5rem" }}>
            Link preview · email / text
          </p>
          <div
            style={{
              width: 300,
              borderRadius: "10px",
              overflow: "hidden",
              boxShadow: "0 3px 14px rgba(0,0,0,0.3)",
              border: `1px solid ${C.border}`,
              backgroundColor: "#fff",
            }}
          >
            <div style={{ position: "relative", height: 140 }}>
              <Image
                src="/images/projects/archive/teaching-artist-residency-slovakia-camp.webp"
                alt="Link preview"
                fill
                sizes="300px"
                style={{ objectFit: "cover", objectPosition: "center 30%" }}
              />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(36,17,35,0.1) 0%, rgba(36,17,35,0.65) 100%)" }} />
              <span style={{ position: "absolute", bottom: "0.6rem", left: "0.65rem", backgroundColor: C.yellow, color: C.bg, fontFamily: "var(--font-space-grotesk), system-ui, sans-serif", fontWeight: 700, fontSize: "0.52rem", letterSpacing: "0.1em", textTransform: "uppercase", padding: "0.18rem 0.45rem", borderRadius: "999px" }}>
                {PROGRAM.name}
              </span>
            </div>
            <div style={{ padding: "0.75rem 0.85rem 0.9rem" }}>
              <p style={{ fontFamily: "var(--font-space-grotesk), system-ui, sans-serif", fontSize: "0.52rem", letterSpacing: "0.1em", textTransform: "uppercase", color: C.teal, margin: "0 0 0.22rem" }}>
                dramaticadventure.org
              </p>
              <p style={{ fontFamily: "var(--font-space-grotesk), system-ui, sans-serif", fontSize: "0.82rem", fontWeight: 700, color: C.bg, margin: "0 0 0.22rem", lineHeight: 1.3 }}>
                {ARTIST.name} — {PROGRAM.name}
              </p>
              <p style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: "0.72rem", color: C.bg, opacity: 0.5, lineHeight: 1.45, margin: 0 }}>
                Three weeks in Slovakia with Dramatic Adventure Theatre — and one moment I&apos;m still carrying home.
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

// ── Ethics footer ─────────────────────────────────────────────────────────────
function Footer() {
  return (
    <div
      style={{
        marginTop: "3rem",
        paddingTop: "1.5rem",
        borderTop: `1px solid ${C.border}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "1rem",
        flexWrap: "wrap",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
          fontSize: "0.65rem",
          color: C.dim,
          lineHeight: 1.55,
          margin: 0,
          maxWidth: "480px",
        }}
      >
        Reviewed and approved by the artist before sharing. Nothing is published automatically.
        These words belong to {ARTIST.name}. DAT amplifies — it does not extract.
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <DatMark size={18} />
        <span
          style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "0.5rem",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: C.dim,
          }}
        >
          dramaticadventure.org
        </span>
      </div>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function JourneyCardV7() {
  return (
    <>
      <MockupBanner />
      <main
        style={{
          backgroundColor: C.bg,
          minHeight: "100vh",
          padding: "3rem 1.5rem 7rem",
        }}
      >
        {/* Narrow column — feels like a phone zine, not a magazine */}
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <Cover />
          <OpeningQuote />
          <JourneySection />
          <CarryingForward />
          <FinalWork />
          <DatNoteSection />
          <CTAs />
          <ShareSection />
          <Footer />
        </div>
      </main>
    </>
  );
}
