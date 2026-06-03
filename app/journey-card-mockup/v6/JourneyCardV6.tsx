// app/journey-card-mockup/v6/JourneyCardV6.tsx
// ⚠️  MOCKUP ONLY — no live data, no auth, no backend, no commits.
//
// v6: A DIGITAL ARTIFACT.
// Built the way the polaroid-journal page is built: each polaroid + handwritten
// caption is one unit; the units are arranged on a composed page; the page
// itself is the artifact. Here each "polaroid unit" is a PROMPT-RESPONSE PAIR
// from Maria's PASSAGE: Slovakia 2026 journey. The prompts are visible
// scaffolding; the responses are the substance. The composition holds.
//
// Deliberately NOT magazine furniture: no masthead, no body columns, no drop
// cap, no folios, no standfirst. The artifact is a digital object, not a
// printed article rendered on screen.
"use client";

import Image from "next/image";

// ── Tokens ────────────────────────────────────────────────────────────────────
const C = {
  ink: "#241123",
  grape: "#6C00AF",
  yellow: "#FFCC00",
  teal: "#2493A9",
  paper: "#FAF5EA",       // soft cream page
  pageEdge: "#F0E6CE",    // slightly warmer edge
  card: "#FFFFFF",        // pure white card face
  cardSoft: "#FCFAF4",    // off-white for quiet cards
  ink60: "rgba(36,17,35,0.6)",
  ink40: "rgba(36,17,35,0.4)",
  ink20: "rgba(36,17,35,0.2)",
  ink10: "rgba(36,17,35,0.1)",
};

// ── Subject ───────────────────────────────────────────────────────────────────
const ARTIST = {
  name: "Maria Reyes",
  roles: "Traveling Artist · Teaching Artist · Writer",
};

const PROGRAM = {
  name: "PASSAGE: Slovakia 2026",
  dates: "12 July – 2 August 2026",
};

const WORK = {
  title: "Songs We Couldn't Translate",
  form: "A short performance essay",
  description:
    "Built from field notes, translation pauses, children's games, and the sound of rain in Zemplínska Teplica.",
  premiere: "Eclectic Evening · Košice · 31 July 2026",
};

// ── Data: seven prompt-response units ─────────────────────────────────────────
// Each unit was answered by Maria during the journey. The prompt is the
// question DAT actually asked. The response is what she sent back.
type LayoutHint = "quiet" | "photo" | "wide" | "final";

type Unit = {
  id: string;
  chapter: string;          // CH 01..07
  place: string | null;     // where the prompt was answered
  date: string | null;      // when
  component: string | null; // DAT program component active here
  prompt: string;           // the question DAT asked
  response: string;         // Maria's short answer
  photo: string | null;     // associated photo (optional)
  photoCaption: string | null;
  layout: LayoutHint;
  rotation?: number;        // tiny polaroid tilt, sparing
};

const UNITS: Unit[] = [
  {
    id: "before",
    chapter: "Ch 01",
    place: null,
    date: "9 July, the night before",
    component: "Before the journey",
    prompt: "What are you arriving with?",
    response: "I was afraid I would not know how to enter the room.",
    photo: null,
    photoCaption: null,
    layout: "quiet",
  },
  {
    id: "bratislava",
    chapter: "Ch 02",
    place: "Bratislava",
    date: "12 July",
    component: "Program Orientation",
    prompt: "When did you actually arrive?",
    response:
      "The first moment I arrived was not at the airport. It was the first time I heard the group laugh together.",
    photo: "/images/projects/archive/action-heart-of-europe-street-theatre.webp",
    photoCaption: "the hallway laugh.",
    layout: "photo",
    rotation: -1.4,
  },
  {
    id: "kosice-lab",
    chapter: "Ch 03",
    place: "Košice",
    date: "14–18 July",
    component: "DAT Lab",
    prompt: "What image keeps returning?",
    response:
      "I kept returning to the image of a doorway — who stands inside, who waits outside, who gets invited in.",
    photo: "/images/rehearsing-nitra.jpg",
    photoCaption: "DAT Lab — sketching the doorway.",
    layout: "photo",
    rotation: 1.1,
  },
  {
    id: "teplica",
    chapter: "Ch 04",
    place: "Zemplínska Teplica",
    date: "19–22 July",
    component: "Teaching Artist Residency",
    prompt: "Who taught you today?",
    response:
      "A student corrected my rhythm with her whole body. She taught me before we shared a language.",
    photo: "/images/projects/archive/teaching-artist-residency-slovakia-camp.webp",
    photoCaption: "she counted with her shoulders.",
    layout: "photo",
    rotation: -2.1,
  },
  {
    id: "lunik",
    chapter: "Ch 05",
    place: "Luník IX",
    date: "23 July",
    component: "Drama Club & Community Showcase",
    prompt: "What's hard to put into words?",
    response:
      "I don't want to explain what happened today. I want to honor it.",
    photo: null,
    photoCaption: null,
    layout: "quiet",
  },
  {
    id: "raj",
    chapter: "Ch 06",
    place: "Slovenský Raj",
    date: "26 July",
    component: "Cohort Retreat",
    prompt: "What did the quiet teach you?",
    response:
      "The cave felt older than language. I stopped trying to make meaning and started listening.",
    photo: "/images/opportunities/team-adventure.jpg",
    photoCaption: "older than language.",
    layout: "wide",
  },
  {
    id: "kosice-final",
    chapter: "Ch 07",
    place: "Košice",
    date: "31 July",
    component: "Eclectic Evening · Final Performance",
    prompt: "What are you carrying home?",
    response: "I am carrying home a different relationship to silence.",
    photo: "/images/theatre/archive/hotel-millionaire/hotel_millionaire1.jpg",
    photoCaption: "Eclectic Evening — Košice.",
    layout: "final",
  },
];

// ── DAT logo ──────────────────────────────────────────────────────────────────
function DatLogo({ size = 32, alt = "Dramatic Adventure Theatre" }: { size?: number; alt?: string }) {
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
          /journey-card-mockup/v6 · prompt-response artifact
        </span>
      </div>
      <nav style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
        {[
          ["#artifact", "Artifact"],
          ["#close", "Carrying forward"],
          ["#notes", "What changed"],
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

// ── Small atoms used inside the cards ─────────────────────────────────────────
function ChapterTag({ ch, place }: { ch: string; place: string | null }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: "0.55rem",
        marginBottom: "0.35rem",
      }}
    >
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
        {ch}
      </span>
      {place && (
        <>
          <span style={{ width: 14, height: 1, backgroundColor: C.ink20 }} />
          <span
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "0.6rem",
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: C.ink,
              opacity: 0.72,
            }}
          >
            {place}
          </span>
        </>
      )}
    </div>
  );
}

function PromptLine({ text }: { text: string }) {
  return (
    <div style={{ marginBottom: "0.85rem" }}>
      <span
        style={{
          display: "inline-block",
          fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
          fontSize: "0.55rem",
          fontWeight: 700,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: C.grape,
          marginRight: "0.55rem",
        }}
      >
        Prompt
      </span>
      <span
        style={{
          fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
          fontSize: "0.78rem",
          color: C.ink,
          opacity: 0.65,
          fontStyle: "italic",
        }}
      >
        {text}
      </span>
    </div>
  );
}

function Response({ text, scale = 1 }: { text: string; scale?: number }) {
  return (
    <p
      style={{
        fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
        fontSize: `${1 * scale}rem`,
        color: C.ink,
        lineHeight: 1.55,
        margin: 0,
        fontWeight: 500,
      }}
    >
      &ldquo;{text}&rdquo;
    </p>
  );
}

function DateStamp({ date, component }: { date: string | null; component: string | null }) {
  if (!date && !component) return null;
  return (
    <div
      style={{
        marginTop: "1rem",
        paddingTop: "0.65rem",
        borderTop: `1px solid ${C.ink10}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: "0.6rem",
        flexWrap: "wrap",
      }}
    >
      {date && (
        <span
          style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "0.58rem",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: C.ink,
            opacity: 0.55,
            fontWeight: 600,
          }}
        >
          {date}
        </span>
      )}
      {component && (
        <span
          style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontSize: "0.66rem",
            color: C.ink,
            opacity: 0.45,
            fontStyle: "italic",
          }}
        >
          {component}
        </span>
      )}
    </div>
  );
}

// ── Polaroid photo ────────────────────────────────────────────────────────────
function Polaroid({
  src,
  alt,
  caption,
  rotate = 0,
  height = 200,
  fullBleed = false,
}: {
  src: string;
  alt: string;
  caption: string | null;
  rotate?: number;
  height?: number;
  fullBleed?: boolean;
}) {
  return (
    <figure
      style={{
        margin: 0,
        backgroundColor: "#FFFFFF",
        padding: fullBleed ? "9px 9px 32px" : "10px 10px 38px",
        boxShadow:
          "0 1px 1px rgba(0,0,0,0.05), 0 4px 14px rgba(0,0,0,0.1), 0 16px 36px rgba(0,0,0,0.06)",
        transform: `rotate(${rotate}deg)`,
        transformOrigin: "center",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height,
          backgroundColor: "#1a1a1a",
          overflow: "hidden",
        }}
      >
        <Image src={src} alt={alt} fill sizes="(max-width: 760px) 100vw, 380px" style={{ objectFit: "cover", objectPosition: "center 35%" }} />
      </div>
      {caption && (
        <figcaption
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: "8px",
            textAlign: "center",
            fontFamily: "var(--font-rock-salt), system-ui, sans-serif",
            fontSize: "0.7rem",
            color: "rgba(36,17,35,0.78)",
            padding: "0 0.5rem",
          }}
        >
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

// ── Card shells ───────────────────────────────────────────────────────────────
function CardShell({
  children,
  tone = "card",
  gridColumn,
  padding = "1.5rem 1.6rem",
}: {
  children: React.ReactNode;
  tone?: "card" | "soft";
  gridColumn?: string;
  padding?: string;
}) {
  return (
    <div
      style={{
        gridColumn,
        backgroundColor: tone === "card" ? C.card : C.cardSoft,
        border: `1px solid ${C.ink10}`,
        borderRadius: "3px",
        padding,
        boxShadow:
          "0 1px 1px rgba(0,0,0,0.03), 0 4px 14px rgba(0,0,0,0.05), 0 18px 38px rgba(0,0,0,0.04)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      {children}
    </div>
  );
}

// ── Quiet card (no photo) ─────────────────────────────────────────────────────
function QuietCard({ unit, gridColumn }: { unit: Unit; gridColumn?: string }) {
  return (
    <CardShell tone="soft" gridColumn={gridColumn} padding="1.6rem 1.8rem">
      <ChapterTag ch={unit.chapter} place={unit.place} />
      <PromptLine text={unit.prompt} />
      <Response text={unit.response} scale={1.05} />
      <p
        style={{
          fontFamily: "var(--font-rock-salt), system-ui, sans-serif",
          fontSize: "0.72rem",
          color: C.ink,
          opacity: 0.5,
          margin: "1rem 0 0",
          lineHeight: 1.4,
        }}
      >
        — she chose not to attach a photograph.
      </p>
      <DateStamp date={unit.date} component={unit.component} />
    </CardShell>
  );
}

// ── Photo card (standard prompt + polaroid + response) ────────────────────────
function PhotoCard({ unit, gridColumn }: { unit: Unit; gridColumn?: string }) {
  return (
    <CardShell gridColumn={gridColumn}>
      <ChapterTag ch={unit.chapter} place={unit.place} />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 0.85fr) minmax(0, 1fr)",
          gap: "1.4rem",
          alignItems: "start",
          marginTop: "0.4rem",
        }}
      >
        {unit.photo && (
          <Polaroid
            src={unit.photo}
            alt={unit.photoCaption ?? ""}
            caption={unit.photoCaption}
            rotate={unit.rotation ?? 0}
            height={170}
          />
        )}
        <div>
          <PromptLine text={unit.prompt} />
          <Response text={unit.response} />
        </div>
      </div>
      <DateStamp date={unit.date} component={unit.component} />
    </CardShell>
  );
}

// ── Wide card (landscape photo on top, prompt + response beneath) ────────────
function WideCard({ unit, gridColumn }: { unit: Unit; gridColumn?: string }) {
  return (
    <CardShell gridColumn={gridColumn} padding="1.5rem 1.6rem 1.5rem">
      <ChapterTag ch={unit.chapter} place={unit.place} />
      {unit.photo && (
        <div
          style={{
            position: "relative",
            width: "100%",
            height: 240,
            marginTop: "0.4rem",
            marginBottom: "0.8rem",
            overflow: "hidden",
            backgroundColor: "#111",
            borderRadius: "2px",
          }}
        >
          <Image
            src={unit.photo}
            alt={unit.photoCaption ?? ""}
            fill
            sizes="(max-width: 760px) 100vw, 720px"
            style={{ objectFit: "cover", objectPosition: "center 55%" }}
          />
          {unit.photoCaption && (
            <span
              style={{
                position: "absolute",
                left: "1rem",
                bottom: "0.85rem",
                fontFamily: "var(--font-rock-salt), system-ui, sans-serif",
                fontSize: "0.85rem",
                color: C.yellow,
                textShadow: "0 1px 8px rgba(0,0,0,0.55)",
                transform: "rotate(-0.8deg)",
              }}
            >
              {unit.photoCaption}
            </span>
          )}
        </div>
      )}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.4fr)",
          gap: "1.4rem",
          alignItems: "start",
        }}
      >
        <PromptLine text={unit.prompt} />
        <Response text={unit.response} scale={1.05} />
      </div>
      <DateStamp date={unit.date} component={unit.component} />
    </CardShell>
  );
}

// ── Final card (climax — last response + the work title that resulted) ───────
function FinalCard({ unit, gridColumn }: { unit: Unit; gridColumn?: string }) {
  return (
    <CardShell gridColumn={gridColumn} padding="0">
      {/* Top: the prompt-response unit */}
      <div style={{ padding: "1.6rem 1.8rem 1.25rem" }}>
        <ChapterTag ch={unit.chapter} place={unit.place} />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 0.9fr) minmax(0, 1.1fr)",
            gap: "1.4rem",
            alignItems: "start",
            marginTop: "0.4rem",
          }}
        >
          {unit.photo && (
            <Polaroid
              src={unit.photo}
              alt={unit.photoCaption ?? ""}
              caption={unit.photoCaption}
              rotate={-1.5}
              height={175}
            />
          )}
          <div>
            <PromptLine text={unit.prompt} />
            <Response text={unit.response} scale={1.05} />
          </div>
        </div>
        <DateStamp date={unit.date} component={unit.component} />
      </div>

      {/* Bottom: the work this journey made — visually distinct */}
      <div
        style={{
          backgroundColor: C.ink,
          color: "#fff",
          padding: "1.5rem 1.8rem 1.7rem",
        }}
      >
        <span
          style={{
            display: "inline-block",
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "0.55rem",
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            color: C.yellow,
            margin: "0 0 0.7rem",
            fontWeight: 700,
            borderTop: `1px solid ${C.yellow}`,
            paddingTop: "0.55rem",
          }}
        >
          The piece this journey made
        </span>
        <h3
          style={{
            fontFamily: "var(--font-anton), system-ui, sans-serif",
            fontSize: "clamp(1.5rem, 4vw, 2.2rem)",
            margin: "0 0 0.4rem",
            textTransform: "uppercase",
            letterSpacing: "0.005em",
            lineHeight: 0.98,
          }}
        >
          {WORK.title}
        </h3>
        <p
          style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontSize: "0.8rem",
            color: "rgba(255,255,255,0.78)",
            margin: "0 0 0.65rem",
            lineHeight: 1.55,
            maxWidth: "440px",
          }}
        >
          {WORK.form}. {WORK.description}
        </p>
        <span
          style={{
            display: "inline-block",
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "0.58rem",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.55)",
          }}
        >
          {WORK.premiere}
        </span>
      </div>
    </CardShell>
  );
}

// ── Card router ───────────────────────────────────────────────────────────────
function UnitCard({ unit, gridColumn }: { unit: Unit; gridColumn?: string }) {
  switch (unit.layout) {
    case "quiet":
      return <QuietCard unit={unit} gridColumn={gridColumn} />;
    case "wide":
      return <WideCard unit={unit} gridColumn={gridColumn} />;
    case "final":
      return <FinalCard unit={unit} gridColumn={gridColumn} />;
    case "photo":
    default:
      return <PhotoCard unit={unit} gridColumn={gridColumn} />;
  }
}

// ── Title block — sits at the top of the artifact ─────────────────────────────
function TitleBlock() {
  return (
    <div
      style={{
        backgroundColor: C.card,
        border: `1px solid ${C.ink10}`,
        borderRadius: "3px",
        padding: "1.75rem 1.8rem 1.5rem",
        marginBottom: "1.25rem",
        boxShadow:
          "0 1px 1px rgba(0,0,0,0.03), 0 4px 14px rgba(0,0,0,0.05), 0 18px 38px rgba(0,0,0,0.04)",
      }}
    >
      {/* Top row: DAT seal + small program tag, right side carries the issue mark */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          paddingBottom: "1.25rem",
          marginBottom: "1.25rem",
          borderBottom: `1px solid ${C.ink10}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
          <DatLogo size={32} />
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
            <span
              style={{
                fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                fontSize: "0.58rem",
                fontWeight: 700,
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                color: C.ink,
              }}
            >
              Dramatic Adventure Theatre
            </span>
            <span
              style={{
                fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                fontSize: "0.65rem",
                color: C.ink,
                opacity: 0.5,
              }}
            >
              A Journey Card from {PROGRAM.name}
            </span>
          </div>
        </div>
        <span
          style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "0.55rem",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: C.ink,
            opacity: 0.4,
          }}
        >
          Edition № 006
        </span>
      </div>

      {/* Title block */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: "1.25rem", alignItems: "end" }}>
        <div>
          <span
            style={{
              display: "inline-block",
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "0.6rem",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: C.grape,
              fontWeight: 700,
              marginBottom: "0.45rem",
            }}
          >
            Seven prompts · seven responses
          </span>
          <h1
            style={{
              fontFamily: "var(--font-anton), system-ui, sans-serif",
              fontSize: "clamp(2rem, 5vw, 3rem)",
              color: C.ink,
              margin: 0,
              lineHeight: 0.95,
              textTransform: "uppercase",
              letterSpacing: "0.005em",
            }}
          >
            {WORK.title}
          </h1>
          <p
            style={{
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              fontSize: "0.95rem",
              color: C.ink,
              opacity: 0.65,
              margin: "0.5rem 0 0",
              maxWidth: "560px",
              lineHeight: 1.5,
            }}
          >
            A Journey Card by{" "}
            <strong style={{ color: C.ink, fontWeight: 700 }}>{ARTIST.name}</strong>, assembled
            from the prompts she answered during {PROGRAM.name}.
          </p>
        </div>
        <RoutePreview />
      </div>
    </div>
  );
}

// ── Route preview — small line of seven dots ─────────────────────────────────
function RoutePreview() {
  const stops = UNITS.map((u, i) => ({
    label: u.place ?? "Before",
    isFinal: u.layout === "final",
    isQuiet: u.layout === "quiet",
    n: i + 1,
  }));
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: "0.45rem",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
          fontSize: "0.5rem",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: C.ink,
          opacity: 0.5,
        }}
      >
        {PROGRAM.dates}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
        {stops.map((s, i) => (
          <span key={i} style={{ display: "flex", alignItems: "center", gap: 0 }}>
            <span
              title={s.label}
              style={{
                width: s.isFinal ? 11 : 8,
                height: s.isFinal ? 11 : 8,
                borderRadius: "50%",
                backgroundColor: s.isFinal ? C.yellow : s.isQuiet ? "transparent" : C.teal,
                border: s.isQuiet ? `2px solid ${C.ink20}` : "none",
                flexShrink: 0,
              }}
            />
            {i < stops.length - 1 && (
              <span style={{ width: 16, height: 1, backgroundColor: C.ink20 }} />
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── The artifact — composed grid of seven units ───────────────────────────────
function Artifact() {
  return (
    <div
      id="artifact"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
        gap: "1.1rem",
      }}
    >
      <UnitCard unit={UNITS[0]} gridColumn="span 5" /> {/* before — quiet */}
      <UnitCard unit={UNITS[1]} gridColumn="span 7" /> {/* bratislava — photo */}
      <UnitCard unit={UNITS[2]} gridColumn="span 12" /> {/* košice DAT lab — photo */}
      <UnitCard unit={UNITS[3]} gridColumn="span 7" /> {/* zemplínska teplica — photo */}
      <UnitCard unit={UNITS[4]} gridColumn="span 5" /> {/* lunik — quiet */}
      <UnitCard unit={UNITS[5]} gridColumn="span 12" /> {/* raj — wide */}
      <UnitCard unit={UNITS[6]} gridColumn="span 12" /> {/* final */}
    </div>
  );
}

// ── Carrying-forward close ────────────────────────────────────────────────────
function ClosingBlock() {
  return (
    <section
      id="close"
      style={{
        marginTop: "1.25rem",
        backgroundColor: C.card,
        border: `1px solid ${C.ink10}`,
        borderRadius: "3px",
        padding: "1.75rem 1.8rem 1.4rem",
        boxShadow:
          "0 1px 1px rgba(0,0,0,0.03), 0 4px 14px rgba(0,0,0,0.05), 0 18px 38px rgba(0,0,0,0.04)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.6fr) auto",
          gap: "1.5rem",
          alignItems: "center",
        }}
      >
        <div>
          <span
            style={{
              display: "inline-block",
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "0.55rem",
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: C.grape,
              fontWeight: 700,
              marginBottom: "0.6rem",
            }}
          >
            Closing prompt
          </span>
          <p
            style={{
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              fontSize: "0.85rem",
              color: C.ink,
              opacity: 0.6,
              fontStyle: "italic",
              margin: "0 0 0.85rem",
            }}
          >
            What are you carrying forward?
          </p>
          <p
            style={{
              fontFamily: "var(--font-rock-salt), system-ui, sans-serif",
              fontSize: "clamp(1rem, 2.6vw, 1.4rem)",
              color: C.ink,
              lineHeight: 1.4,
              margin: 0,
              opacity: 0.92,
              maxWidth: "520px",
              transform: "rotate(-0.5deg)",
              transformOrigin: "left center",
            }}
          >
            A different relationship to silence.
          </p>
        </div>

        {/* DAT seal as the publisher mark closing the artifact */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              border: `2px solid ${C.ink}`,
              padding: 7,
              backgroundColor: C.paper,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: "rotate(-6deg)",
              boxShadow: "inset 0 0 0 1px rgba(36,17,35,0.06)",
            }}
          >
            <DatLogo size={58} alt="DAT seal" />
          </div>
          <span
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "0.5rem",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: C.ink,
              opacity: 0.55,
              textAlign: "center",
            }}
          >
            Issued 2026
          </span>
        </div>
      </div>

      {/* CTAs */}
      <div
        style={{
          marginTop: "1.5rem",
          paddingTop: "1.25rem",
          borderTop: `1px solid ${C.ink10}`,
          display: "flex",
          gap: "0.6rem",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", gap: "0.55rem", flexWrap: "wrap" }}>
          <button
            type="button"
            style={{
              backgroundColor: C.ink,
              color: "#fff",
              padding: "0.6rem 1.3rem",
              borderRadius: "2px",
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              letterSpacing: "0.14em",
              fontSize: "0.62rem",
              textTransform: "uppercase",
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
            }}
          >
            Share this Journey Card
          </button>
          <button
            type="button"
            style={{
              backgroundColor: "transparent",
              color: C.ink,
              padding: "0.6rem 1rem",
              borderRadius: "2px",
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              letterSpacing: "0.12em",
              fontSize: "0.62rem",
              textTransform: "uppercase",
              border: `1px solid ${C.ink20}`,
              cursor: "pointer",
            }}
          >
            View {ARTIST.name.split(" ")[0]}&apos;s Profile
          </button>
          <button
            type="button"
            style={{
              backgroundColor: C.yellow,
              color: C.ink,
              padding: "0.6rem 1rem",
              borderRadius: "2px",
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              letterSpacing: "0.12em",
              fontSize: "0.62rem",
              textTransform: "uppercase",
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
            }}
          >
            Support DAT
          </button>
        </div>
        <p
          style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontSize: "0.66rem",
            color: C.ink,
            opacity: 0.42,
            margin: 0,
            lineHeight: 1.5,
            maxWidth: "320px",
            textAlign: "right",
          }}
        >
          Reviewed and approved by {ARTIST.name} before sharing.
          These responses belong to her.
        </p>
      </div>
    </section>
  );
}

// ── What changed — small reframe note for Jesse ───────────────────────────────
function ReframeNotes() {
  const points: { label: string; text: string }[] = [
    {
      label: "Architecture",
      text: "The prompts are the visible scaffolding of the artifact. Each card is one prompt + one short response Maria sent in. The composition is the collection of those units, the way the polaroid page is a collection of polaroids — not an essay built from them.",
    },
    {
      label: "Not an article",
      text: "Removed: magazine masthead, two-column body, drop cap, page folios, standfirst, editorial cover plate, image-grid-with-vertical-text spread. None of v5's printed-page furniture survived. The artifact no longer pretends to be a published feature.",
    },
    {
      label: "Hybrid",
      text: "Webpage-native: cards, share/save buttons, a sticky banner, scroll-as-the-natural-interaction. Artifact-native: polaroid-style photos with handwritten captions and gentle tilts, DAT publisher seal, chapter tags, date stamps, a closing handwritten line. Neither register dominates.",
    },
    {
      label: "Restraint",
      text: "Handwriting (Rock Salt) appears in only three places — polaroid captions, the closing carrying-forward line, and the quiet \"no photograph\" note. No washi tape, no torn paper, no kraft texture, no stamps everywhere. The artifact stays digital first.",
    },
    {
      label: "Specificity",
      text: "Layout still varies — quiet card (no photo) for Before and Luník IX where Maria opted out of an image; wide landscape for Slovenský Raj; final card lifts the work title into a black bottom-block. The journey shapes the form.",
    },
  ];
  return (
    <section id="notes" style={{ marginTop: "3rem", maxWidth: "920px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: "0.85rem",
          marginBottom: "1.25rem",
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
          ✦
        </span>
        <span
          style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "0.82rem",
            fontWeight: 700,
            color: C.ink,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          What changed from v5 → v6
        </span>
      </div>
      <div
        style={{
          backgroundColor: C.card,
          border: `1px solid ${C.ink10}`,
          borderRadius: "3px",
          padding: "1.5rem 1.6rem",
        }}
      >
        {points.map((p) => (
          <div
            key={p.label}
            style={{
              display: "grid",
              gridTemplateColumns: "140px 1fr",
              gap: "1rem",
              padding: "0.65rem 0",
              borderBottom: `1px solid ${C.ink10}`,
              alignItems: "baseline",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                fontSize: "0.62rem",
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: C.grape,
              }}
            >
              {p.label}
            </span>
            <p
              style={{
                fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                fontSize: "0.84rem",
                color: C.ink,
                opacity: 0.72,
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              {p.text}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function JourneyCardV6() {
  return (
    <>
      <MockupBanner />
      <main
        style={{
          backgroundColor: C.pageEdge,
          minHeight: "100vh",
          padding: "3rem 1.5rem 6rem",
        }}
      >
        <div style={{ maxWidth: "960px", margin: "0 auto" }}>
          {/* Page header (mockup framing — not part of the artifact) */}
          <header style={{ marginBottom: "2.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", marginBottom: "0.4rem" }}>
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
                Journey Card · Digital Artifact
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
                v6
              </span>
            </div>
            <p
              style={{
                fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                fontSize: "0.92rem",
                color: C.ink,
                opacity: 0.6,
                lineHeight: 1.6,
                maxWidth: "640px",
                margin: 0,
              }}
            >
              Built from the seven prompts Maria answered during PASSAGE: Slovakia 2026.
              Each card carries one prompt and her short response. The artifact is the
              collection — composed, web-native, hybrid.
            </p>
          </header>

          {/* The artifact */}
          <TitleBlock />
          <Artifact />
          <ClosingBlock />

          {/* Designer notes (not part of the artifact) */}
          <ReframeNotes />
        </div>
      </main>
    </>
  );
}
