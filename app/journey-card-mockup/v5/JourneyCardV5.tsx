// app/journey-card-mockup/v5/JourneyCardV5.tsx
// ⚠️  MOCKUP ONLY — no live data, no auth, no backend, no commits.
//
// v5: Editorial study. ONE artifact, composed as a four-spread magazine feature.
// Three references chosen and translated directly:
//   • Japanese "SPECIAL ISSUE" nabe spread — asymmetric photo grid with
//     vertical text strips between images.
//   • Camino travel journal (yellow waypoints + kraft right page) — torn-edge
//     map page facing a handwritten journal entry with washi tape and stamps.
//   • SULTEN restaurant-guide spread — black slab-cap title plate, photo grid,
//     two-column body text, page folios in corners.
"use client";

import Image from "next/image";

// ── Tokens ────────────────────────────────────────────────────────────────────
const C = {
  ink: "#241123",
  grape: "#6C00AF",
  yellow: "#FFCC00",
  yellowSoft: "#F5C518",
  teal: "#2493A9",
  paper: "#F6F1E6",
  parchment: "#EFE5CC",
  kraft: "#C9A874",
  kraftDeep: "#A98551",
  snow: "#FFFFFF",
  fog: "rgba(36,17,35,0.08)",
};

const ARTIST = { name: "Maria Reyes", roles: "Traveling Artist · Teaching Artist · Writer" };
const PROGRAM = {
  short: "PASSAGE",
  long: "PASSAGE: Slovakia 2026",
  dates: "July 12 – August 2, 2026",
};
const WORK = {
  title: "Songs We Couldn't Translate",
  type: "A Performance Essay",
  premiere: "Eclectic Evening · Košice · 31 July 2026",
};

// ── Reusable: DAT logo (next/image) ───────────────────────────────────────────
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
          /journey-card-mockup/v5 · editorial study
        </span>
      </div>
      <nav style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
        {[
          ["#spread-01", "Title"],
          ["#spread-02", "Grid"],
          ["#spread-03", "Journal"],
          ["#spread-04", "Colophon"],
          ["#refs", "References"],
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

// ── Folio + page furniture ────────────────────────────────────────────────────
function Folio({ number, side }: { number: string; side: "left" | "right" }) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: "1.25rem",
        [side]: "1.5rem",
        display: "flex",
        alignItems: "center",
        gap: "0.55rem",
        fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
        fontSize: "0.6rem",
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: C.ink,
        opacity: 0.55,
      }}
    >
      {side === "left" ? (
        <>
          <span>{number}</span>
          <span style={{ width: 24, height: 1, backgroundColor: "rgba(36,17,35,0.3)" }} />
          <span>DAT · Field Journal</span>
        </>
      ) : (
        <>
          <span>Songs We Couldn&apos;t Translate</span>
          <span style={{ width: 24, height: 1, backgroundColor: "rgba(36,17,35,0.3)" }} />
          <span>{number}</span>
        </>
      )}
    </div>
  );
}

function SpreadWrapper({
  id,
  children,
  pageColor = C.snow,
  minHeight = 640,
}: {
  id: string;
  children: React.ReactNode;
  pageColor?: string;
  minHeight?: number;
}) {
  return (
    <section
      id={id}
      style={{
        position: "relative",
        backgroundColor: pageColor,
        minHeight,
        boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 18px 50px rgba(0,0,0,0.14)",
        borderRadius: "2px",
        marginBottom: "3.5rem",
        overflow: "hidden",
        border: "1px solid rgba(36,17,35,0.06)",
      }}
    >
      {children}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SPREAD 01 — TITLE PLATE (Sulten-inspired)
// Black slab-cap title box + opener body text + photo grid wrap.
// ─────────────────────────────────────────────────────────────────────────────
function SpreadOne() {
  return (
    <SpreadWrapper id="spread-01" pageColor={C.snow} minHeight={780}>
      {/* Masthead */}
      <header
        style={{
          padding: "1.5rem 2.5rem 1.25rem",
          display: "grid",
          gridTemplateColumns: "auto 1fr auto",
          alignItems: "center",
          gap: "1rem",
          borderBottom: "1px solid rgba(36,17,35,0.1)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
          <DatLogo size={26} />
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
                fontSize: "0.62rem",
                color: "rgba(36,17,35,0.5)",
                letterSpacing: "0.04em",
              }}
            >
              Field Journal · Issue 06 · Slovakia · Summer 2026
            </span>
          </div>
        </div>
        <div />
        <span
          style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "0.55rem",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: C.ink,
            opacity: 0.55,
          }}
        >
          A Performance-Essay Feature
        </span>
      </header>

      {/* Body: 12-col grid split between black title plate, body columns, and image grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1fr)",
          gap: "2rem",
          padding: "2.25rem 2.5rem 4rem",
        }}
      >
        {/* LEFT: Black title plate floating over a smaller hero image */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
          <div style={{ position: "relative" }}>
            <div
              style={{
                position: "relative",
                aspectRatio: "5 / 6",
                overflow: "hidden",
                backgroundColor: "#111",
              }}
            >
              <Image
                src="/images/projects/archive/teaching-artist-residency-slovakia-camp.webp"
                alt="PASSAGE: Slovakia 2026 — Teaching Artist Residency"
                fill
                sizes="(max-width: 760px) 100vw, 460px"
                style={{ objectFit: "cover", objectPosition: "center 30%" }}
                priority
              />
            </div>
            {/* The Sulten title box — overlaid bottom-left */}
            <div
              style={{
                position: "absolute",
                left: "-0.5rem",
                bottom: "-0.85rem",
                width: "min(85%, 360px)",
                backgroundColor: C.ink,
                color: C.snow,
                padding: "1.4rem 1.4rem 1.25rem",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                  fontSize: "0.56rem",
                  letterSpacing: "0.32em",
                  textTransform: "uppercase",
                  color: C.yellow,
                  margin: "0 0 0.7rem",
                  borderTop: `1px solid ${C.yellow}`,
                  paddingTop: "0.55rem",
                  width: "fit-content",
                }}
              >
                Field Essay № 06
              </p>
              <h1
                style={{
                  fontFamily: "var(--font-anton), system-ui, sans-serif",
                  fontSize: "clamp(1.9rem, 4vw, 2.55rem)",
                  margin: 0,
                  lineHeight: 0.92,
                  textTransform: "uppercase",
                  letterSpacing: "-0.005em",
                }}
              >
                Songs<br />We Couldn&apos;t<br />Translate
              </h1>
              <p
                style={{
                  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                  fontSize: "0.6rem",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.6)",
                  margin: "0.85rem 0 0",
                }}
              >
                Photographs &amp; field notes by
              </p>
              <p
                style={{
                  fontFamily: "var(--font-anton), system-ui, sans-serif",
                  fontSize: "1.05rem",
                  letterSpacing: "0.02em",
                  textTransform: "uppercase",
                  margin: "0.15rem 0 0",
                  color: C.snow,
                }}
              >
                {ARTIST.name}
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT: Two-column body opener + small image grid below */}
        <div style={{ paddingTop: "0.5rem" }}>
          {/* Standfirst */}
          <p
            style={{
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              fontSize: "0.78rem",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: C.grape,
              margin: "0 0 0.8rem",
              fontWeight: 700,
            }}
          >
            On translation, rhythm, and the rooms we are<br />
            let into.
          </p>
          <p
            style={{
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              fontSize: "1rem",
              color: C.ink,
              lineHeight: 1.55,
              margin: "0 0 1.5rem",
              opacity: 0.85,
              fontStyle: "italic",
            }}
          >
            Three weeks across six rooms in Slovakia. The piece this journey produced
            wasn&apos;t the one I came to make.
          </p>

          {/* Two columns of body */}
          <div
            style={{
              columnCount: 2,
              columnGap: "1.4rem",
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              fontSize: "0.82rem",
              color: C.ink,
              opacity: 0.85,
              lineHeight: 1.65,
            }}
          >
            <p style={{ margin: "0 0 0.8rem" }}>
              <span
                style={{
                  fontFamily: "var(--font-anton), system-ui, sans-serif",
                  fontSize: "2.4rem",
                  lineHeight: 0.85,
                  float: "left",
                  marginRight: "0.35rem",
                  marginTop: "0.15rem",
                  color: C.ink,
                }}
              >
                I
              </span>
              arrived in Bratislava convinced I was here to teach. I had a workshop
              outline, a translator on call, three weeks of plans. The first laugh
              the group shared together happened in a hallway, while I was still
              looking for the room. That hallway laugh is when the program started
              for me — not at the airport, not at orientation.
            </p>
            <p style={{ margin: "0 0 0.8rem" }}>
              By Košice I had stopped trusting my outline. In Zemplínska Teplica a
              student corrected my rhythm with her whole body — counted with her
              shoulders, before either of us had a shared word. At Luník IX I learned
              the discipline of not explaining. By the time we reached Slovenský Raj
              I had stopped trying to make meaning and started listening for what
              was already there.
            </p>
            <p style={{ margin: 0 }}>
              <em>Songs We Couldn&apos;t Translate</em> is the short performance
              essay I built from those weeks — field notes, translation pauses,
              children&apos;s games, and the sound of rain in Teplica. It premiered
              the night before we flew home, at Eclectic Evening in Košice.
            </p>
          </div>

          {/* Small image grid — Sulten-style, three small images strung together */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "0.4rem",
              marginTop: "1.8rem",
            }}
          >
            {[
              ["/images/projects/archive/action-heart-of-europe-street-theatre.webp", "Bratislava"],
              ["/images/rehearsing-nitra.jpg", "Košice"],
              ["/images/opportunities/team-adventure.jpg", "Slovenský Raj"],
            ].map(([src, place]) => (
              <figure key={src} style={{ margin: 0 }}>
                <div
                  style={{
                    position: "relative",
                    aspectRatio: "1 / 1",
                    overflow: "hidden",
                    backgroundColor: "#111",
                  }}
                >
                  <Image
                    src={src}
                    alt={place}
                    fill
                    sizes="150px"
                    style={{ objectFit: "cover", objectPosition: "center 40%" }}
                  />
                </div>
                <figcaption
                  style={{
                    fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                    fontSize: "0.52rem",
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: C.ink,
                    opacity: 0.55,
                    marginTop: "0.35rem",
                  }}
                >
                  {place}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>

      <Folio number="066" side="left" />
      <Folio number="067" side="right" />
    </SpreadWrapper>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SPREAD 02 — FIELD GRID (Japanese SPECIAL ISSUE-inspired)
// Asymmetric multi-image grid, vertical text strips between images,
// mixed image scales, italic caption strips.
// ─────────────────────────────────────────────────────────────────────────────
function SpreadTwo() {
  // Vertical text strip used between image cells
  const VStrip = ({
    text,
    align = "start",
    color = C.ink,
  }: {
    text: string;
    align?: "start" | "end" | "center";
    color?: string;
  }) => (
    <span
      style={{
        writingMode: "vertical-rl",
        textOrientation: "mixed",
        fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
        fontSize: "0.62rem",
        letterSpacing: "0.32em",
        textTransform: "uppercase",
        color,
        opacity: 0.85,
        alignSelf: align,
        padding: "0.4rem 0",
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </span>
  );

  return (
    <SpreadWrapper id="spread-02" pageColor={C.snow} minHeight={760}>
      {/* Top bar — SPECIAL ISSUE-style label */}
      <header
        style={{
          padding: "1.5rem 2.5rem 1rem",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          borderBottom: "1px solid rgba(36,17,35,0.1)",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-anton), system-ui, sans-serif",
            fontSize: "1rem",
            color: C.ink,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            paddingRight: "0.85rem",
            borderRight: `2px solid ${C.ink}`,
          }}
        >
          Field Grid
        </span>
        <span
          style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontSize: "0.78rem",
            color: C.ink,
            opacity: 0.6,
            fontStyle: "italic",
          }}
        >
          Chapters 02 – 06 · what the camera held while I couldn&apos;t.
        </span>
        <div style={{ flex: 1 }} />
        <span
          style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "0.55rem",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: C.ink,
            opacity: 0.5,
          }}
        >
          18 frames · selected
        </span>
      </header>

      {/* The grid — 6 column track. Photos span varying numbers of columns and rows.
          Vertical text strips live in narrow gutter cells. */}
      <div
        style={{
          padding: "1.25rem 2rem 4rem",
          display: "grid",
          gridTemplateColumns: "1.6rem repeat(6, minmax(0, 1fr)) 1.6rem",
          gridAutoRows: "82px",
          gap: "8px",
        }}
      >
        {/* Row 1 */}
        <div style={{ gridColumn: "1 / 2", gridRow: "1 / 4", display: "flex", justifyContent: "flex-end" }}>
          <VStrip text="BRATISLAVA · 12 JUL" />
        </div>
        <GridImage src="/images/projects/archive/action-heart-of-europe-street-theatre.webp" col="2 / 5" row="1 / 4" pos="center 35%" caption="The first laugh." />
        <GridImage src="/images/rehearsing-nitra.jpg" col="5 / 8" row="1 / 3" pos="center 40%" caption="Košice · DAT Lab." />

        {/* Row 2 small details */}
        <GridImage src="/images/drama-clubs/boy-with-wings.jpg" col="5 / 7" row="3 / 5" pos="center 30%" small caption="Luník IX." />
        <GridImage src="/images/theatre/archive/hotel-millionaire/hotel_millionaire1.jpg" col="7 / 8" row="3 / 5" pos="center 30%" small caption="" />

        {/* Row 3 hero */}
        <GridImage src="/images/projects/archive/teaching-artist-residency-slovakia-camp.webp" col="2 / 5" row="4 / 8" pos="center 30%" caption="Zemplínska Teplica — she counted with her shoulders." />
        <div style={{ gridColumn: "5 / 6", gridRow: "5 / 8", display: "flex", alignItems: "stretch" }}>
          <VStrip text="ZEMPLÍNSKA TEPLICA · 19 JUL" color={C.grape} />
        </div>
        <GridImage src="/images/opportunities/team-adventure.jpg" col="6 / 8" row="5 / 8" pos="center 50%" caption="Slovenský Raj — the cave was older than language." />

        {/* Final row */}
        <div style={{ gridColumn: "8 / 9", gridRow: "1 / 5", display: "flex", justifyContent: "flex-start" }}>
          <VStrip text="KOŠICE · 14–18 JUL" />
        </div>
        <div style={{ gridColumn: "8 / 9", gridRow: "5 / 8", display: "flex", justifyContent: "flex-start" }}>
          <VStrip text="SLOVENSKÝ RAJ · 26 JUL" />
        </div>
      </div>

      {/* Footer micro-caption */}
      <div
        style={{
          padding: "0 2.5rem 2rem",
          fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
          fontSize: "0.7rem",
          color: C.ink,
          opacity: 0.5,
          fontStyle: "italic",
          maxWidth: "640px",
          lineHeight: 1.55,
        }}
      >
        Maria worked without a translator for the residency week. The selection above
        is what her camera held while she couldn&apos;t.
      </div>

      <Folio number="068" side="left" />
      <Folio number="069" side="right" />
    </SpreadWrapper>
  );
}

function GridImage({
  src,
  col,
  row,
  pos = "center",
  caption,
  small = false,
}: {
  src: string;
  col: string;
  row: string;
  pos?: string;
  caption?: string;
  small?: boolean;
}) {
  return (
    <figure
      style={{
        gridColumn: col,
        gridRow: row,
        margin: 0,
        position: "relative",
        backgroundColor: "#111",
        overflow: "hidden",
      }}
    >
      <Image src={src} alt={caption ?? ""} fill sizes="320px" style={{ objectFit: "cover", objectPosition: pos }} />
      {caption ? (
        <figcaption
          style={{
            position: "absolute",
            left: 0,
            bottom: 0,
            backgroundColor: "rgba(255,255,255,0.92)",
            padding: small ? "0.25rem 0.45rem" : "0.35rem 0.6rem",
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontSize: small ? "0.6rem" : "0.66rem",
            color: C.ink,
            fontStyle: "italic",
            maxWidth: "85%",
            lineHeight: 1.3,
          }}
        >
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SPREAD 03 — THE JOURNAL (Camino-inspired)
// Two-page composition. Left = map page with torn-edge separating it from the
// kraft journal page on the right. Numbered waypoints, washi tape, a DAT field
// stamp, handwriting radiating with curly arrows.
// ─────────────────────────────────────────────────────────────────────────────
const ROUTE_POINTS = [
  { n: 1, name: "Bratislava", date: "12 Jul", x: 18, y: 70 },
  { n: 2, name: "Košice", date: "14 Jul", x: 80, y: 38 },
  { n: 3, name: "Zemplínska Teplica", date: "19 Jul", x: 82, y: 50 },
  { n: 4, name: "Luník IX", date: "23 Jul", x: 78, y: 36 },
  { n: 5, name: "Slovenský Raj", date: "26 Jul", x: 70, y: 45 },
  { n: 6, name: "Košice", date: "31 Jul", x: 80, y: 38 },
];

function SpreadThree() {
  return (
    <SpreadWrapper id="spread-03" pageColor={C.paper} minHeight={780}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
          minHeight: 760,
        }}
      >
        {/* LEFT PAGE — printed map page, light parchment, torn right edge */}
        <div
          style={{
            position: "relative",
            backgroundColor: C.paper,
            padding: "1.75rem 1.5rem 4.5rem 2rem",
            // jagged torn right edge
            clipPath:
              "polygon(0 0, 100% 0, 98% 4%, 100% 9%, 97% 14%, 99% 19%, 96% 25%, 99% 31%, 95% 38%, 100% 44%, 96% 50%, 99% 57%, 95% 63%, 100% 69%, 96% 76%, 99% 82%, 95% 88%, 99% 94%, 96% 100%, 0 100%)",
            boxShadow: "8px 0 14px -10px rgba(0,0,0,0.18)",
            zIndex: 2,
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "1rem" }}>
            <span
              style={{
                fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                fontSize: "0.55rem",
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                color: C.ink,
                opacity: 0.6,
                fontWeight: 700,
              }}
            >
              Slovakia · July 2026
            </span>
            <span
              style={{
                fontFamily: "var(--font-rock-salt), system-ui, sans-serif",
                fontSize: "0.75rem",
                color: C.grape,
                opacity: 0.85,
                transform: "rotate(-2deg)",
                transformOrigin: "right",
              }}
            >
              ~ 420 km, six rooms.
            </span>
          </div>

          {/* The map */}
          <div style={{ position: "relative" }}>
            <svg
              viewBox="0 0 100 60"
              preserveAspectRatio="none"
              style={{ width: "100%", height: "auto", display: "block" }}
            >
              {/* Country shape */}
              <path
                d="M 8 28 Q 12 18 22 22 Q 30 14 40 20 Q 50 12 60 18 Q 70 14 82 20 Q 92 22 94 32 Q 92 42 84 46 Q 72 50 60 48 Q 46 52 34 50 Q 22 54 14 46 Q 6 38 8 28 Z"
                fill="rgba(36,17,35,0.04)"
                stroke="rgba(36,17,35,0.42)"
                strokeWidth="0.35"
              />
              {/* Soft hill marks */}
              {[
                [28, 36],
                [44, 42],
                [60, 40],
                [68, 30],
              ].map(([x, y], i) => (
                <path
                  key={i}
                  d={`M ${x - 3} ${y} Q ${x} ${y - 2.2} ${x + 3} ${y}`}
                  fill="none"
                  stroke="rgba(36,17,35,0.18)"
                  strokeWidth="0.22"
                />
              ))}
              {/* Route line — Camino-yellow with marker dots */}
              <path
                d={ROUTE_POINTS.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${(p.y / 100) * 60}`).join(" ")}
                fill="none"
                stroke={C.yellowSoft}
                strokeWidth="0.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Waypoint pins */}
              {ROUTE_POINTS.map((p) => {
                const py = (p.y / 100) * 60;
                return (
                  <g key={p.n}>
                    <circle cx={p.x} cy={py} r={1.7} fill={C.yellowSoft} stroke={C.ink} strokeWidth={0.35} />
                    <text
                      x={p.x}
                      y={py + 0.55}
                      fontSize="1.6"
                      fontFamily="var(--font-space-grotesk), system-ui, sans-serif"
                      fontWeight={700}
                      fill={C.ink}
                      textAnchor="middle"
                    >
                      {p.n}
                    </text>
                  </g>
                );
              })}
            </svg>
            {/* Small illustrated city markers — schematic, ink line */}
            <span
              aria-hidden
              style={{
                position: "absolute",
                left: "12%",
                top: "70%",
                fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                fontSize: "0.55rem",
                letterSpacing: "0.05em",
                color: C.ink,
                opacity: 0.7,
                fontWeight: 700,
              }}
            >
              ◇ Bratislava
            </span>
            <span
              aria-hidden
              style={{
                position: "absolute",
                left: "72%",
                top: "26%",
                fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                fontSize: "0.55rem",
                letterSpacing: "0.05em",
                color: C.ink,
                opacity: 0.7,
                fontWeight: 700,
              }}
            >
              ✦ Košice
            </span>
          </div>

          {/* Waypoint legend list — printed, formal */}
          <ol
            style={{
              listStyle: "none",
              padding: 0,
              margin: "1.4rem 0 0",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.5rem 1rem",
            }}
          >
            {ROUTE_POINTS.map((p) => (
              <li
                key={`${p.n}-${p.name}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr auto",
                  gap: "0.5rem",
                  alignItems: "baseline",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                    fontSize: "0.62rem",
                    fontWeight: 700,
                    color: C.ink,
                    backgroundColor: C.yellowSoft,
                    padding: "0.05rem 0.32rem",
                    borderRadius: "2px",
                  }}
                >
                  {String(p.n).padStart(2, "0")}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                    fontSize: "0.72rem",
                    color: C.ink,
                    opacity: 0.8,
                  }}
                >
                  {p.name}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                    fontSize: "0.58rem",
                    color: C.ink,
                    opacity: 0.5,
                    letterSpacing: "0.06em",
                  }}
                >
                  {p.date}
                </span>
              </li>
            ))}
          </ol>

          {/* Handwriting margin notes pointing at the map */}
          <p
            style={{
              position: "absolute",
              right: "9%",
              top: "30%",
              maxWidth: "120px",
              fontFamily: "var(--font-rock-salt), system-ui, sans-serif",
              fontSize: "0.7rem",
              color: C.grape,
              opacity: 0.9,
              lineHeight: 1.4,
              transform: "rotate(-3deg)",
              margin: 0,
            }}
          >
            walked the
            <br />
            rest from
            <br />
            Teplica
          </p>
          <svg
            aria-hidden
            width="80"
            height="40"
            style={{ position: "absolute", right: "20%", top: "27%", opacity: 0.6 }}
          >
            <path d="M 5 8 Q 30 30 60 18" fill="none" stroke={C.grape} strokeWidth="1.2" strokeLinecap="round" />
            <polygon points="58,16 66,17 60,22" fill={C.grape} />
          </svg>

          {/* DAT field-stamp — circular */}
          <div
            style={{
              position: "absolute",
              left: "1.5rem",
              bottom: "1.5rem",
              width: 76,
              height: 76,
              borderRadius: "50%",
              border: `1.5px solid ${C.ink}`,
              backgroundColor: "rgba(246,241,230,0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: "0.05rem",
              transform: "rotate(-7deg)",
              padding: "0.3rem",
              boxShadow: "inset 0 0 0 1px rgba(36,17,35,0.08)",
            }}
          >
            <DatLogo size={28} alt="" />
            <span
              style={{
                fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                fontSize: "0.42rem",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: C.ink,
                opacity: 0.78,
              }}
            >
              DAT · Field
            </span>
            <span
              style={{
                fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                fontSize: "0.42rem",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: C.ink,
                opacity: 0.78,
              }}
            >
              Passage&nbsp;06
            </span>
          </div>

          <Folio number="070" side="left" />
        </div>

        {/* RIGHT PAGE — kraft, journal entry with photo, washi tape, handwriting */}
        <div
          style={{
            position: "relative",
            backgroundColor: C.kraft,
            backgroundImage:
              "radial-gradient(ellipse at 20% 30%, rgba(0,0,0,0.06), transparent 60%), radial-gradient(ellipse at 80% 70%, rgba(0,0,0,0.08), transparent 65%)",
            padding: "1.85rem 2rem 4.5rem 1.75rem",
            // Mirror torn edge on left so the seam matches
            clipPath:
              "polygon(2% 0, 100% 0, 100% 100%, 2% 100%, 4% 96%, 0 92%, 4% 86%, 1% 80%, 5% 74%, 0 68%, 4% 62%, 1% 56%, 5% 50%, 0 44%, 4% 38%, 1% 32%, 5% 26%, 0 20%, 4% 14%, 1% 8%, 4% 4%)",
            zIndex: 1,
          }}
        >
          {/* Date header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: "0.6rem",
              paddingLeft: "1rem",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-rock-salt), system-ui, sans-serif",
                fontSize: "0.95rem",
                color: "rgba(36,17,35,0.85)",
                margin: 0,
              }}
            >
              July 19, 2026 — Zemplínska Teplica
            </p>
            <span
              style={{
                fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                fontSize: "0.5rem",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(36,17,35,0.5)",
              }}
            >
              CH 03 · Residency
            </span>
          </div>

          {/* Photo with washi tape corners */}
          <div
            style={{
              position: "relative",
              width: "min(280px, 75%)",
              marginLeft: "1rem",
              marginTop: "1rem",
              transform: "rotate(-2deg)",
            }}
          >
            <div
              style={{
                position: "relative",
                aspectRatio: "4 / 3",
                overflow: "hidden",
                backgroundColor: "#222",
                border: "10px solid #fff",
                boxShadow: "0 6px 16px rgba(0,0,0,0.22)",
              }}
            >
              <Image
                src="/images/projects/archive/teaching-artist-residency-slovakia-camp.webp"
                alt="Teaching Artist Residency — Zemplínska Teplica"
                fill
                sizes="280px"
                style={{ objectFit: "cover", objectPosition: "center 35%" }}
              />
            </div>
            {/* Washi tape */}
            <span
              style={{
                position: "absolute",
                top: -12,
                left: -8,
                width: 70,
                height: 18,
                backgroundColor: "rgba(36,147,169,0.6)",
                transform: "rotate(-18deg)",
                boxShadow: "0 2px 4px rgba(0,0,0,0.12)",
              }}
            />
            <span
              style={{
                position: "absolute",
                bottom: -10,
                right: -8,
                width: 60,
                height: 16,
                backgroundColor: "rgba(255,204,0,0.7)",
                transform: "rotate(10deg)",
                boxShadow: "0 2px 4px rgba(0,0,0,0.12)",
              }}
            />
            {/* Caption tag */}
            <span
              style={{
                position: "absolute",
                bottom: -22,
                left: 12,
                fontFamily: "var(--font-rock-salt), system-ui, sans-serif",
                fontSize: "0.65rem",
                color: "rgba(36,17,35,0.78)",
                transform: "rotate(-2deg)",
              }}
            >
              the rhythm lesson — day 8.
            </span>
          </div>

          {/* Handwritten body with arrows */}
          <p
            style={{
              position: "absolute",
              right: "1.5rem",
              top: "9rem",
              maxWidth: "175px",
              fontFamily: "var(--font-rock-salt), system-ui, sans-serif",
              fontSize: "0.72rem",
              color: "rgba(36,17,35,0.86)",
              lineHeight: 1.7,
              margin: 0,
              transform: "rotate(-1deg)",
            }}
          >
            she counted with her shoulders. I followed for the first time all week.
          </p>
          <svg
            aria-hidden
            width="120"
            height="60"
            style={{ position: "absolute", right: "11.5rem", top: "10rem", opacity: 0.75 }}
          >
            <path
              d="M 110 6 C 70 26 30 8 8 38"
              fill="none"
              stroke="rgba(36,17,35,0.7)"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            <polygon points="6,38 13,32 16,42" fill="rgba(36,17,35,0.7)" />
          </svg>

          {/* Torn-edge tag — the key quote */}
          <div
            style={{
              position: "absolute",
              right: "1.25rem",
              top: "16rem",
              width: 180,
              backgroundColor: C.yellowSoft,
              padding: "0.7rem 0.85rem 0.85rem",
              transform: "rotate(2deg)",
              boxShadow: "0 3px 8px rgba(0,0,0,0.18)",
              // small torn-paper feel via clip-path on bottom
              clipPath:
                "polygon(0 0, 100% 0, 100% 88%, 92% 100%, 84% 92%, 76% 100%, 68% 92%, 60% 100%, 52% 92%, 44% 100%, 36% 92%, 28% 100%, 20% 92%, 12% 100%, 4% 92%, 0 100%)",
            }}
          >
            <span
              style={{
                display: "block",
                fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                fontSize: "0.5rem",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: C.ink,
                opacity: 0.7,
                marginBottom: "0.35rem",
                fontWeight: 700,
              }}
            >
              field tag · ch 03
            </span>
            <span
              style={{
                fontFamily: "var(--font-rock-salt), system-ui, sans-serif",
                fontSize: "0.75rem",
                color: C.ink,
                lineHeight: 1.35,
                display: "block",
              }}
            >
              she taught me before we shared a language.
            </span>
          </div>

          {/* Secondary photo, smaller, stuck on lower-left */}
          <div
            style={{
              position: "absolute",
              bottom: "5rem",
              left: "2.5rem",
              width: 140,
              transform: "rotate(1.5deg)",
            }}
          >
            <div
              style={{
                position: "relative",
                aspectRatio: "3 / 4",
                overflow: "hidden",
                backgroundColor: "#222",
                border: "8px solid #fff",
                boxShadow: "0 6px 12px rgba(0,0,0,0.18)",
              }}
            >
              <Image
                src="/images/drama-clubs/boy-with-wings.jpg"
                alt="Drama Club — Luník IX"
                fill
                sizes="140px"
                style={{ objectFit: "cover", objectPosition: "center 25%" }}
              />
            </div>
            <span
              style={{
                position: "absolute",
                left: "0.5rem",
                bottom: "-1.2rem",
                fontFamily: "var(--font-rock-salt), system-ui, sans-serif",
                fontSize: "0.62rem",
                color: "rgba(36,17,35,0.78)",
              }}
            >
              Luník IX, day 12 — honor, not explain.
            </span>
          </div>

          {/* Body of the journal entry — handwritten, sits between photo and tag */}
          <p
            style={{
              position: "absolute",
              left: "2.25rem",
              bottom: "1.5rem",
              maxWidth: "60%",
              fontFamily: "var(--font-rock-salt), system-ui, sans-serif",
              fontSize: "0.72rem",
              color: "rgba(36,17,35,0.78)",
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            — m.r.
          </p>

          {/* Maria's name as signature */}
          <Folio number="071" side="right" />
        </div>
      </div>
    </SpreadWrapper>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SPREAD 04 — COLOPHON (Sulten-clean restraint)
// ─────────────────────────────────────────────────────────────────────────────
function SpreadFour() {
  return (
    <SpreadWrapper id="spread-04" pageColor={C.snow} minHeight={460}>
      <div
        style={{
          padding: "3rem 2.5rem 4.5rem",
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1fr) auto",
          gap: "2.5rem",
          alignItems: "start",
        }}
      >
        {/* Left — closing body */}
        <div>
          <p
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "0.55rem",
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: C.grape,
              margin: "0 0 1rem",
              fontWeight: 700,
            }}
          >
            What I am carrying forward
          </p>
          <p
            style={{
              fontFamily: "var(--font-anton), system-ui, sans-serif",
              fontSize: "clamp(1.4rem, 3.4vw, 2rem)",
              color: C.ink,
              lineHeight: 1.02,
              textTransform: "uppercase",
              letterSpacing: "0.005em",
              margin: "0 0 1rem",
              maxWidth: "380px",
            }}
          >
            A different relationship to silence.
          </p>
          <p
            style={{
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              fontSize: "0.82rem",
              color: C.ink,
              opacity: 0.68,
              lineHeight: 1.65,
              margin: 0,
              maxWidth: "420px",
            }}
          >
            <em>{WORK.title}</em> premiered at {WORK.premiere}. The work was built from
            field notes, translation pauses, children&apos;s games, and the sound of
            rain in Zemplínska Teplica.
          </p>
        </div>

        {/* Middle — credits column */}
        <div
          style={{
            borderTop: `1px solid ${C.ink}`,
            paddingTop: "0.9rem",
          }}
        >
          {[
            ["Artist", ARTIST.name],
            ["Role", ARTIST.roles],
            ["Program", PROGRAM.long],
            ["Dates", PROGRAM.dates],
            ["Final work", WORK.title],
            ["Form", WORK.type],
            ["Premiere", WORK.premiere],
          ].map(([k, v]) => (
            <div
              key={k}
              style={{
                display: "grid",
                gridTemplateColumns: "70px 1fr",
                gap: "0.75rem",
                padding: "0.32rem 0",
                borderBottom: `1px solid ${C.fog}`,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                  fontSize: "0.55rem",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: C.ink,
                  opacity: 0.55,
                  fontWeight: 700,
                  paddingTop: "0.2rem",
                }}
              >
                {k}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                  fontSize: "0.78rem",
                  color: C.ink,
                  lineHeight: 1.45,
                }}
              >
                {v}
              </span>
            </div>
          ))}
        </div>

        {/* Right — publisher seal */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.6rem",
          }}
        >
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: "50%",
              border: `2px solid ${C.ink}`,
              padding: 8,
              backgroundColor: C.paper,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: "rotate(-5deg)",
              boxShadow: "inset 0 0 0 1px rgba(36,17,35,0.05)",
            }}
          >
            <DatLogo size={64} alt="DAT publisher seal" />
          </div>
          <span
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "0.5rem",
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: C.ink,
              opacity: 0.62,
              textAlign: "center",
            }}
          >
            Dramatic Adventure Theatre
            <br />
            Edition № 006 · 2026
          </span>
        </div>
      </div>

      {/* CTAs */}
      <div
        style={{
          padding: "1.5rem 2.5rem 2.5rem",
          display: "flex",
          gap: "0.7rem",
          flexWrap: "wrap",
          borderTop: `1px solid ${C.fog}`,
        }}
      >
        <button
          type="button"
          style={{
            backgroundColor: C.ink,
            color: C.snow,
            padding: "0.65rem 1.4rem",
            borderRadius: "2px",
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            letterSpacing: "0.16em",
            fontSize: "0.62rem",
            textTransform: "uppercase",
            fontWeight: 700,
            border: "none",
            cursor: "pointer",
          }}
        >
          Read the full journey
        </button>
        <button
          type="button"
          style={{
            backgroundColor: "transparent",
            color: C.ink,
            padding: "0.65rem 1.1rem",
            borderRadius: "2px",
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            letterSpacing: "0.14em",
            fontSize: "0.62rem",
            textTransform: "uppercase",
            border: `1px solid rgba(36,17,35,0.3)`,
            cursor: "pointer",
          }}
        >
          About DAT
        </button>
        <button
          type="button"
          style={{
            backgroundColor: C.yellow,
            color: C.ink,
            padding: "0.65rem 1.1rem",
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
          Support DAT
        </button>
      </div>

      <Folio number="072" side="left" />
      <Folio number="073" side="right" />
    </SpreadWrapper>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Reference notes — explain which three inspirations were chosen
// ─────────────────────────────────────────────────────────────────────────────
const REFS: { title: string; from: string; lessons: string[] }[] = [
  {
    title: "SULTEN restaurant guide",
    from: "Danish magazine spread (image #14)",
    lessons: [
      "Black slab-cap title plate floats over the photo grid as the artifact's authority mark — overlapping the hero image rather than sitting beside it.",
      "Two-column body text with a drop-cap I opens the essay, the way a real magazine feature begins.",
      "Page folios sit in the bottom corners with thin ink rules — small detail, big editorial signal.",
      "Restrained palette: ink, snow, single yellow accent. Lets the photographs do the talking.",
    ],
  },
  {
    title: "Japanese SPECIAL ISSUE nabe spread",
    from: "Editorial photo grid (image #3)",
    lessons: [
      "Asymmetric multi-image grid — one hero portrait, several medium frames, small details. No two cells the same size.",
      "Vertical text strips (writing-mode: vertical-rl) sit between images as labels — place names + dates in the gutters, the way Japanese magazines run vertical captions.",
      "Italic caption strips inset on the bottom edge of select images rather than placed below them.",
      "Tight 8px gutters; the grid reads as one composition, not six separate photos.",
    ],
  },
  {
    title: "Camino travel journal (yellow waypoints)",
    from: "Handmade journal spread (image #18)",
    lessons: [
      "Two-page composition: printed map page on the left with a torn edge, kraft-paper journal page on the right — clip-path simulates the tear.",
      "Numbered yellow waypoints with the same color used for handwritten place tags later. The route is the spine of the spread.",
      "Right page is layered with: dated header, a Polaroid-edged photo on washi tape, handwriting radiating from the photo with curly drawn arrows, a torn-edge yellow tag carrying the key quote, a smaller secondary photo lower-left.",
      "A circular DAT field-stamp on the map page in place of the Camino's GBC Hostel stamp — same maker's-mark logic.",
    ],
  },
];

function ReferenceNotes() {
  return (
    <section id="refs" style={{ marginTop: "4rem", maxWidth: "1000px" }}>
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
          05
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
          References
        </span>
        <span
          style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontSize: "0.78rem",
            color: C.ink,
            opacity: 0.46,
          }}
        >
          Three sources, what each contributed
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.25rem",
        }}
      >
        {REFS.map((ref) => (
          <div
            key={ref.title}
            style={{
              backgroundColor: C.snow,
              border: `1px solid ${C.fog}`,
              borderRadius: "4px",
              padding: "1.25rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.85rem",
            }}
          >
            <div>
              <p
                style={{
                  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                  fontSize: "0.55rem",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: C.grape,
                  margin: "0 0 0.3rem",
                  fontWeight: 700,
                }}
              >
                {ref.from}
              </p>
              <h3
                style={{
                  fontFamily: "var(--font-anton), system-ui, sans-serif",
                  fontSize: "1.15rem",
                  margin: 0,
                  textTransform: "uppercase",
                  letterSpacing: "0.01em",
                  color: C.ink,
                  lineHeight: 1.05,
                }}
              >
                {ref.title}
              </h3>
            </div>
            <ul
              style={{
                margin: 0,
                paddingLeft: "0.95rem",
                fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                fontSize: "0.78rem",
                lineHeight: 1.6,
                color: C.ink,
                opacity: 0.78,
                display: "flex",
                flexDirection: "column",
                gap: "0.55rem",
              }}
            >
              {ref.lessons.map((l, i) => (
                <li key={i}>{l}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: "1.5rem",
          padding: "1.25rem 1.4rem",
          backgroundColor: C.ink,
          color: "rgba(242,242,242,0.85)",
          borderRadius: "4px",
          fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
          fontSize: "0.82rem",
          lineHeight: 1.65,
        }}
      >
        <span
          style={{
            display: "block",
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "0.55rem",
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            color: C.yellow,
            marginBottom: "0.7rem",
            fontWeight: 700,
          }}
        >
          What I deliberately did not pick
        </span>
        Every Morgan-Harper-Nichols-style quote card (#4, #16, #17); the &ldquo;budget
        travel guide&rdquo; Pinterest pin (#9); the &ldquo;BACK TO NATURE&rdquo;
        3-image story-template (#10); the &ldquo;wander / explore / scenic view
        point&rdquo; project-life pages (#20); the K-pop scrapbook collages (#12,
        #13). All of those drift toward either travel-cute or
        theatre-aspirational. The three chosen ones are professional editorial,
        documentary photography, and a real person&apos;s actual handmade journal —
        which is what an artist&apos;s Journey Card should feel like.
      </div>
    </section>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function JourneyCardV5() {
  return (
    <>
      <MockupBanner />
      <main
        style={{
          backgroundColor: "#E8E2D3",
          backgroundImage:
            "radial-gradient(circle at 20% 10%, rgba(0,0,0,0.04), transparent 50%), radial-gradient(circle at 80% 90%, rgba(0,0,0,0.04), transparent 50%)",
          minHeight: "100vh",
          padding: "3rem 1.5rem 6rem",
        }}
      >
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          {/* Page header */}
          <header style={{ marginBottom: "2.75rem" }}>
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
                Journey Card · Editorial Study
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
                v5
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
              A digital translation of three editorial references — the Danish SULTEN
              magazine spread, a Japanese SPECIAL ISSUE photo essay, and a handmade
              Camino travel journal — composed as one four-spread feature for Maria
              Reyes&apos; PASSAGE: Slovakia 2026 piece, &ldquo;Songs We Couldn&apos;t
              Translate.&rdquo;
            </p>
          </header>

          {/* The artifact — four spreads stacked as if turning pages of a magazine feature */}
          <SpreadOne />
          <SpreadTwo />
          <SpreadThree />
          <SpreadFour />

          <ReferenceNotes />
        </div>
      </main>
    </>
  );
}
