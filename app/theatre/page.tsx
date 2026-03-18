// app/theatre/page.tsx
import Link from "next/link";
import Image from "next/image";
import { productionMap, type Production, getSortYear } from "@/lib/productionMap";
import { seasons as seasonData } from "@/lib/seasonData";

const FALLBACK_POSTER = "/posters/fallback-16x9.jpg";
const CARD_BG = "#f2f2f2";

// ─── Colour palette ────────────────────────────────────────────────────────────
const C = {
  ink:       "#241123",
  inkMid:    "#4a2a56",
  inkLight:  "#6b3f7a",
  gold:      "#FFCC00",
  purple:    "#530087",
  white:     "#f2f2f2",
  divider:   "rgba(36,17,35,0.30)",
  dividerSm: "rgba(36,17,35,0.20)",
} as const;

// ─── Era definitions ───────────────────────────────────────────────────────────
// Each era anchors a block of seasons with a signature image from that period.
const ERAS = [
  {
    id: "era-1",
    label: "In the Beginning",
    seasons: [1, 2, 3],
    years: "2006–2009",
    geography: "Zimbabwe · Ecuador · USA",
    src: "/images/theatre/archive/hotel_millionaire.webp",
    alt: "Hotel Millionaire — DAT Season 3, Ecuador",
  },
  {
    id: "era-2",
    label: "Finding the Form",
    seasons: [4, 5, 6, 7],
    years: "2009–2013",
    geography: "Ecuador · Slovakia · Washington D.C.",
    src: "/images/theatre/archive/esmeraldas_dumbshow.webp",
    alt: "Esmeraldas Dumbshow — DAT Season 4, Ecuador",
  },
  {
    id: "era-3",
    label: "The Wide World",
    seasons: [8, 9, 10],
    years: "2013–2016",
    geography: "Ecuador · Tanzania · Slovakia",
    src: "/images/theatre/archive/tembo.webp",
    alt: "Tembo — DAT Season 10, Tanzania",
  },
  {
    id: "era-4",
    label: "Into the Margins",
    seasons: [11, 12, 13, 14, 15],
    years: "2016–2021",
    geography: "Ecuador · Galápagos · Slovakia · USA",
    src: "/images/theatre/archive/agwow-condor.webp",
    alt: "A Girl Without Wings — DAT, the Andes",
  },
  {
    id: "era-5",
    label: "The Present Tense",
    seasons: [16, 17, 18, 19, 20],
    years: "2021–present",
    geography: "Ecuador · Slovakia · Hudson Valley",
    src: "/images/theatre/archive/blackfish_mommy.webp",
    alt: "Blackfish — DAT Season 12",
  },
] as const;

// ─── Helpers ───────────────────────────────────────────────────────────────────
function posterSrc(p: Production): string {
  return p.posterUrl && p.posterUrl.trim() ? p.posterUrl : FALLBACK_POSTER;
}

function sortProductions(a: Production, b: Production) {
  const yearA = getSortYear(a);
  const yearB = getSortYear(b);
  if (yearA !== yearB) return yearB - yearA;
  if (a.season !== b.season) return (b.season || 0) - (a.season || 0);
  return a.title.localeCompare(b.title);
}

function shortTitle(title: string): string {
  return title.split(" -- ")[0].trim();
}

function parseFestival(festival: string | undefined): { event: string | null; venue: string | null } {
  if (!festival || !festival.trim()) return { event: null, venue: null };
  const parts = festival.split("--");
  return {
    event: parts[0].trim() || null,
    venue: parts[1]?.trim() || null,
  };
}

// Seasons run Fall–Summer. Season 1 = 2006-2007, so schoolYear(2007) → "2006–2007"
function schoolYear(sortYear: number): string {
  if (!sortYear || sortYear === 0) return "";
  return `${sortYear - 1}–${sortYear}`;
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function TheatreIndexPage() {
  const allProductions = Object.values(productionMap).sort(sortProductions);

  // Group productions by season
  const bySeason = new Map<number, Production[]>();
  for (const p of allProductions) {
    const s = p.season ?? 0;
    if (!bySeason.has(s)) bySeason.set(s, []);
    bySeason.get(s)!.push(p);
  }

  // All season numbers present in productionMap, sorted descending
  const seasonNums = Array.from(bySeason.keys()).sort((a, b) => b - a);

  // Stats
  const years = allProductions.map(getSortYear).filter(Boolean);
  const earliestYear = Math.min(...years);
  const latestYear = Math.max(...years);
  const totalSeasons = seasonData.length; // 20 — use seasonData as source of truth

  const uniqueCountries = new Set<string>();
  for (const p of allProductions) {
    // Extract country from "City, Country" or plain location
    const parts = p.location.split(",");
    const country = parts.length > 1 ? parts[parts.length - 1].trim() : p.location.trim();
    if (country) uniqueCountries.add(country);
  }

  const uniqueArtists = new Set<string>();
  for (const p of allProductions) {
    for (const key of Object.keys(p.artists)) {
      if (!key.startsWith("[")) uniqueArtists.add(key);
    }
  }

  const featured = allProductions[0];

  return (
    <div style={{ minHeight: "100vh", background: "transparent" }}>

      {/* ════════════════════════════════════════════
          HERO — Flakes
      ════════════════════════════════════════════ */}
      <section
        style={{
          position: "relative",
          width: "100%",
          height: "75vh",
          boxShadow: "0px 0px 40px rgba(36, 17, 35, 0.5)",
          overflow: "hidden",
        }}
      >
        <Image
          src="/images/theatre/archive/flakes.webp"
          alt="DAT company performing — Flakes, Season 7"
          fill
          priority
          className="object-cover object-center"
          style={{ filter: "brightness(1.08) contrast(1.06) saturate(1.05)" }}
        />
        {/* Primary gradient — darkens bottom for text legibility */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, rgba(36,17,35,0.88) 0%, rgba(36,17,35,0.3) 45%, transparent 70%)",
          }}
        />
        {/* Radial ink bleed behind text */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: "65%",
            height: "75%",
            background: "radial-gradient(ellipse 90% 80% at 85% 80%, rgba(36,17,35,0.5) 0%, rgba(36,17,35,0.15) 45%, transparent 72%)",
            pointerEvents: "none",
          }}
        />
        {/* Hero text — bottom right */}
        <div
          style={{
            position: "absolute",
            bottom: "4vw",
            right: "5%",
            maxWidth: "90vw",
            textAlign: "right",
          }}
        >
          <p style={{ ...eyebrowOnDark, marginBottom: "0.5rem" }}>
            Dramatic Adventure Theatre
          </p>
          <h1
            style={{
              fontFamily: "var(--font-anton), system-ui, sans-serif",
              fontSize: "clamp(3.4rem, 10vw, 7.5rem)",
              textTransform: "uppercase",
              color: C.white,
              lineHeight: 1.0,
              textShadow: "0 8px 24px rgba(0,0,0,0.8)",
              margin: 0,
            }}
          >
            Theatre
            <br />
            <span style={{ color: C.gold }}>Archive</span>
          </h1>
          <p
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "clamp(1rem, 2vw, 1.45rem)",
              color: C.white,
              opacity: 0.75,
              margin: "0.6rem 0 0",
              fontWeight: 400,
              textShadow: "0 3px 10px rgba(0,0,0,0.9)",
            }}
          >
            Rehearsed in the wild. Built in the margins.{" "}
            <em style={{ fontStyle: "italic", opacity: 0.9 }}>Moved to act.</em>
          </p>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          STATS
      ════════════════════════════════════════════ */}
      <section style={{ padding: "3.5rem 0 3rem" }}>
        <div style={{ width: "90vw", maxWidth: "1120px", margin: "0 auto" }}>
          <p style={eyebrowOnKraft}>A lifetime of making theatre</p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              backgroundColor: "rgba(36, 17, 35, 0.16)",
              borderRadius: "18px",
              border: `1px solid rgba(36,17,35,0.22)`,
              overflow: "hidden",
              boxShadow: "0 4px 24px rgba(36, 17, 35, 0.18)",
            }}
          >
            {[
              { n: String(totalSeasons),          label: "Seasons",        sub: `${earliestYear}–present` },
              { n: String(allProductions.length),  label: "Productions",    sub: "original works & adaptations" },
              { n: String(uniqueArtists.size),     label: "Alumni Artists", sub: "directors, actors & designers" },
              { n: String(uniqueCountries.size),   label: "Countries",      sub: "where the work was born" },
            ].map(({ n, label, sub }, i, arr) => (
              <div
                key={label}
                style={{
                  padding: "1.75rem 2rem",
                  borderRight: i < arr.length - 1 ? `1px solid rgba(36,17,35,0.12)` : "none",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-anton), system-ui, sans-serif",
                    fontSize: "clamp(2.8rem, 6vw, 4rem)",
                    color: C.gold,
                    lineHeight: 1,
                    marginBottom: "0.35rem",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {n}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                    fontSize: "0.95rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "#f2f2f2",
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                    fontSize: "0.78rem",
                    fontWeight: 500,
                    color: "rgba(242,242,242,0.62)",
                    marginTop: "0.25rem",
                    lineHeight: 1.4,
                  }}
                >
                  {sub}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          MISSION STATEMENT
      ════════════════════════════════════════════ */}
      <section style={{ padding: "0 0 3.5rem" }}>
        <div style={{ width: "90vw", maxWidth: "1120px", margin: "0 auto" }}>
          <div
            style={{
              backgroundColor: "rgba(36,17,35,0.06)",
              borderRadius: "16px",
              border: `1px solid rgba(36,17,35,0.12)`,
              padding: "2rem 2.5rem",
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: "2rem",
              alignItems: "center",
            }}
          >
            <div>
              <p
                style={{
                  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                  fontSize: "clamp(1rem, 1.8vw, 1.15rem)",
                  fontWeight: 500,
                  color: C.ink,
                  lineHeight: 1.7,
                  margin: "0 0 1.25rem",
                }}
              >
                All DAT plays are born abroad — inspired by unique landscapes, moved by local and global
                concerns, devised with a diverse ensemble, and developed through cross-cultural partnership.
                Each play is researched, rehearsed in the field, and brought home to share with New York
                audiences and the world.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
                {[
                  "Connect communities",
                  "Amplify local concerns",
                  "Explore global implications",
                  "Move audiences to act",
                ].map((line) => (
                  <span
                    key={line}
                    style={{
                      fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.14em",
                      color: C.ink,
                      backgroundColor: C.gold,
                      padding: "0.35em 0.9em",
                      borderRadius: "6px",
                    }}
                  >
                    {line}
                  </span>
                ))}
              </div>
            </div>
            {/* Decorative quote mark */}
            <div
              aria-hidden
              style={{
                fontFamily: "var(--font-anton), system-ui, sans-serif",
                fontSize: "8rem",
                lineHeight: 0.8,
                color: "rgba(36,17,35,0.06)",
                userSelect: "none",
                flexShrink: 0,
              }}
            >
              "
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          FEATURED PRODUCTION
      ════════════════════════════════════════════ */}
      {featured && (
        <section style={{ padding: "0 0 3.5rem" }}>
          <div style={{ width: "90vw", maxWidth: "1120px", margin: "0 auto" }}>
            <p style={eyebrowOnKraft}>Most Recent Production</p>
            <Link
              href={`/theatre/${featured.slug}`}
              className="theatre-featured-card"
              style={{
                display: "flex",
                borderRadius: "14px",
                overflow: "hidden",
                border: `1px solid ${C.divider}`,
                textDecoration: "none",
                minHeight: "300px",
                boxShadow: "0 4px 24px rgba(36,17,35,0.16)",
              }}
            >
              {/* Poster */}
              <div
                style={{
                  position: "relative",
                  flex: "0 0 42%",
                  minHeight: "260px",
                  overflow: "hidden",
                  backgroundColor: C.ink,
                }}
              >
                <Image
                  src={posterSrc(featured)}
                  alt={featured.title}
                  fill
                  className="object-cover object-top theatre-poster-img"
                  priority
                  style={{ filter: "brightness(1.1) contrast(1.05) saturate(1.1)" }}
                />
              </div>
              {/* Text panel */}
              <div
                style={{
                  flex: 1,
                  padding: "2rem 2.5rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  gap: "0.65rem",
                  backgroundColor: CARD_BG,
                }}
              >
                <p
                  style={{
                    fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                    fontSize: "0.78rem",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.18em",
                    color: C.ink,
                    margin: 0,
                  }}
                >
                  Season {featured.season} · {featured.year} · {featured.location}
                </p>
                <h2
                  style={{
                    fontFamily: "var(--font-anton), system-ui, sans-serif",
                    fontSize: "clamp(1.8rem, 4vw, 3.2rem)",
                    textTransform: "uppercase",
                    color: C.ink,
                    lineHeight: 1.0,
                    margin: 0,
                  }}
                >
                  {shortTitle(featured.title)}
                </h2>
                {featured.festival && (() => {
                  const { event, venue } = parseFestival(featured.festival);
                  return event ? (
                    <p
                      style={{
                        fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                        fontSize: "0.78rem",
                        color: C.ink,
                        margin: 0,
                        lineHeight: 1.5,
                      }}
                    >
                      {event}
                      {venue && (
                        <span style={{ display: "block", fontSize: "0.68rem", fontWeight: 700, color: C.inkMid, marginTop: "0.2rem" }}>
                          {venue}
                        </span>
                      )}
                    </p>
                  ) : null;
                })()}
                <span
                  className="theatre-explore-btn"
                  style={{
                    display: "inline-block",
                    alignSelf: "flex-start",
                    marginTop: "0.5rem",
                    fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.16em",
                    color: C.ink,
                    backgroundColor: C.gold,
                    padding: "0.5em 1.2em",
                    borderRadius: "6px",
                  }}
                >
                  Explore Production →
                </span>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════
          THE FULL ARCHIVE — Era-anchored layout
      ════════════════════════════════════════════ */}
      <section style={{ padding: "4rem 0 5rem" }}>
        <div style={{ width: "90vw", maxWidth: "1120px", margin: "0 auto" }}>

          {/* Archive heading + quick-nav */}
          <div
            style={{
              marginBottom: "4rem",
              backgroundColor: "rgba(255,255,255,0.35)",
              borderRadius: "14px",
              padding: "1.4rem 1.6rem",
            }}
          >
            <p style={{ ...eyebrowOnKraft, margin: "0 0 0.3rem" }}>The Full Archive</p>
            <h2
              style={{
                fontFamily: "var(--font-anton), system-ui, sans-serif",
                fontSize: "clamp(2.2rem, 5vw, 3.6rem)",
                textTransform: "uppercase",
                color: C.ink,
                margin: "0 0 1.1rem",
                lineHeight: 1.0,
              }}
            >
              All Productions
            </h2>
            <div style={{ height: "1.5px", backgroundColor: "rgba(36,17,35,0.15)", marginBottom: "1rem" }} />
            {/* Season jump-nav */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <span
                style={{
                  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.2em",
                  color: C.inkMid,
                  marginRight: "0.3rem",
                  flexShrink: 0,
                }}
              >
                Jump to
              </span>
              {seasonNums.map((sn) => (
                <a
                  key={sn}
                  href={`#season-${sn}`}
                  className="theatre-nav-pill"
                  style={{
                    fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: C.ink,
                    textDecoration: "none",
                    padding: "0.35em 0.85em",
                    borderRadius: "6px",
                    flexShrink: 0,
                    border: `1.5px solid rgba(36,17,35,0.28)`,
                    backgroundColor: "rgba(255,255,255,0.5)",
                  }}
                >
                  S{sn}
                </a>
              ))}
            </div>
          </div>

          {/* ── Era sections ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {ERAS.map((era, eraIdx) => {
              // Seasons in this era that have either productions or seasonData entries
              const eraSeasonNums = era.seasons.filter((sn) =>
                bySeason.has(sn) || seasonData.some((s) => s.slug === `season-${sn}`)
              );

              if (eraSeasonNums.length === 0) return null;

              return (
                <div key={era.id} id={era.id}>

                  {/* Era separator — not shown before the first era */}
                  {eraIdx > 0 && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "1.25rem",
                        padding: "3.5rem 0 3rem",
                      }}
                    >
                      <div style={{ flex: 1, height: "1.5px", background: C.divider }} />
                      <div
                        style={{
                          padding: "0.4em 1.4em",
                          borderRadius: "999px",
                          backgroundColor: "rgba(36,17,35,0.08)",
                          border: `1px solid rgba(36,17,35,0.18)`,
                          flexShrink: 0,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                            fontSize: "0.7rem",
                            fontWeight: 800,
                            textTransform: "uppercase",
                            letterSpacing: "0.22em",
                            color: C.inkMid,
                          }}
                        >
                          {era.years}
                        </span>
                      </div>
                      <div style={{ flex: 1, height: "1.5px", background: C.divider }} />
                    </div>
                  )}

                  {/* Two-column era layout: sticky image left + seasons right */}
                  <div className="theatre-era-grid" style={{ display: "grid", gridTemplateColumns: "38% 1fr", gap: "2.5rem", alignItems: "flex-start" }}>

                    {/* ── Left: sticky era image ── */}
                    <div className="theatre-era-image-panel" style={{ position: "sticky", top: "5.5rem" }}>
                      <div
                        style={{
                          position: "relative",
                          borderRadius: "18px",
                          overflow: "hidden",
                          aspectRatio: "4 / 5",
                          boxShadow: "0 12px 48px rgba(36,17,35,0.32), 0 2px 8px rgba(36,17,35,0.2)",
                        }}
                      >
                        <Image
                          src={era.src}
                          alt={era.alt}
                          fill
                          className="object-cover object-center"
                          sizes="(max-width: 768px) 90vw, 38vw"
                        />
                        {/* Dark gradient overlay — bottom half */}
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            background:
                              "linear-gradient(to top, rgba(36,17,35,0.92) 0%, rgba(36,17,35,0.4) 38%, transparent 62%)",
                            pointerEvents: "none",
                          }}
                        />
                        {/* Era caption */}
                        <div
                          style={{
                            position: "absolute",
                            bottom: "1.4rem",
                            left: "1.4rem",
                            right: "1.4rem",
                          }}
                        >
                          {/* Era label in Anton */}
                          <p
                            style={{
                              fontFamily: "var(--font-anton), system-ui, sans-serif",
                              fontSize: "clamp(1.4rem, 2.8vw, 2rem)",
                              textTransform: "uppercase",
                              color: C.white,
                              margin: "0 0 0.35rem",
                              lineHeight: 1,
                              textShadow: "0 2px 10px rgba(0,0,0,0.7)",
                              letterSpacing: "0.04em",
                            }}
                          >
                            {era.label}
                          </p>
                          {/* Season range + years */}
                          <p
                            style={{
                              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                              fontSize: "0.72rem",
                              fontWeight: 800,
                              textTransform: "uppercase",
                              letterSpacing: "0.16em",
                              color: C.gold,
                              margin: "0 0 0.2rem",
                            }}
                          >
                            Seasons {era.seasons[0]}–{era.seasons[era.seasons.length - 1]}&ensp;·&ensp;{era.years}
                          </p>
                          {/* Geography */}
                          <p
                            style={{
                              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                              fontSize: "0.67rem",
                              fontWeight: 500,
                              color: "rgba(242,242,242,0.72)",
                              margin: 0,
                              letterSpacing: "0.06em",
                            }}
                          >
                            {era.geography}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* ── Right: season groups ── */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "2.75rem" }}>
                      {eraSeasonNums.map((sn) => {
                        const prods = bySeason.get(sn);
                        const sdEntry = seasonData.find((s) => s.slug === `season-${sn}`);
                        const year = prods ? getSortYear(prods[0]) : undefined;

                        return (
                          <div key={sn} id={`season-${sn}`}>

                            {/* Season header */}
                            <div
                              style={{
                                display: "flex",
                                alignItems: "stretch",
                                backgroundColor: "rgba(255,255,255,0.38)",
                                borderRadius: "14px",
                                border: "1px solid rgba(36,17,35,0.1)",
                                overflow: "hidden",
                                marginBottom: "1.25rem",
                              }}
                            >
                              {/* Big season number */}
                              <div
                                aria-hidden
                                style={{
                                  backgroundColor: "rgba(36,17,35,0.07)",
                                  borderRight: "1px solid rgba(36,17,35,0.1)",
                                  padding: "0.6rem 1rem",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                  minWidth: "4rem",
                                }}
                              >
                                <span
                                  style={{
                                    fontFamily: "var(--font-anton), system-ui, sans-serif",
                                    fontSize: "clamp(2.5rem, 5vw, 4rem)",
                                    color: "rgba(36,17,35,0.22)",
                                    lineHeight: 1,
                                    userSelect: "none",
                                  }}
                                >
                                  {sn}
                                </span>
                              </div>

                              {/* Season label + year + full-season link */}
                              <div
                                style={{
                                  flex: 1,
                                  padding: "0.75rem 1.25rem",
                                  display: "flex",
                                  alignItems: "flex-start",
                                  justifyContent: "space-between",
                                  gap: "1rem",
                                  flexWrap: "wrap",
                                }}
                              >
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                                  <Link
                                    href={`/season/${sn}`}
                                    className="theatre-season-pill-link"
                                    style={{
                                      textDecoration: "none",
                                      fontFamily: "var(--font-anton), system-ui, sans-serif",
                                      fontSize: "1.3rem",
                                      textTransform: "uppercase",
                                      letterSpacing: "0.2em",
                                      color: C.ink,
                                      backgroundColor: C.gold,
                                      padding: "0.25em 0.85em",
                                      borderRadius: "0.3em",
                                      display: "inline-block",
                                      alignSelf: "flex-start",
                                    }}
                                  >
                                    Season {sn}
                                  </Link>
                                  <span
                                    style={{
                                      fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                                      fontSize: "0.95rem",
                                      fontWeight: 600,
                                      color: C.ink,
                                      paddingLeft: "0.2em",
                                    }}
                                  >
                                    {sdEntry?.years ?? (year ? schoolYear(year) : "")}
                                  </span>
                                </div>
                                <Link
                                  href={`/season/${sn}`}
                                  className="theatre-season-chapter-link"
                                  style={{
                                    textDecoration: "none",
                                    fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                                    fontSize: "0.78rem",
                                    fontWeight: 800,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.16em",
                                    color: C.ink,
                                    flexShrink: 0,
                                    alignSelf: "flex-start",
                                    paddingTop: "0.1rem",
                                  }}
                                >
                                  Full Season ↗
                                </Link>
                              </div>
                            </div>

                            {/* Production cards — or season activity block if no productions */}
                            {prods && prods.length > 0 ? (
                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "repeat(auto-fill, minmax(195px, 1fr))",
                                  gap: "1rem",
                                }}
                              >
                                {prods.map((p) => (
                                  <ProductionCard key={p.slug} p={p} />
                                ))}
                              </div>
                            ) : sdEntry ? (
                              <SeasonActivities projects={sdEntry.projects as unknown as string[]} />
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom cross-nav */}
          <div
            style={{
              marginTop: "5rem",
              paddingTop: "2.5rem",
              borderTop: `2.5px solid ${C.divider}`,
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
            }}
          >
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
              {[
                { href: "/alumni", label: "← Alumni Directory" },
                { href: "/story-map", label: "Story Map →" },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="theatre-bottom-link"
                  style={{
                    display: "inline-block",
                    fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.14em",
                    color: "#f2f2f2",
                    textDecoration: "none",
                    padding: "0.6em 1.4em",
                    borderRadius: "99px",
                    backgroundColor: "#2493A9",
                    border: "none",
                  }}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          PAGE STYLES
      ════════════════════════════════════════════ */}
      <style>{`
        /* Featured card */
        .theatre-featured-card {
          transition: box-shadow 0.28s ease, border-color 0.28s ease;
        }
        .theatre-featured-card:hover {
          box-shadow: 0 12px 48px rgba(108,0,175,0.2) !important;
          border-color: rgba(108,0,175,0.35) !important;
        }
        .theatre-explore-btn {
          transition: background-color 0.2s ease, color 0.2s ease, letter-spacing 0.2s ease;
        }
        .theatre-explore-btn:hover {
          background-color: #6C00AF !important;
          color: #f2f2f2 !important;
          letter-spacing: 0.24em !important;
        }
        .theatre-poster-img {
          transition: transform 0.5s ease;
        }
        .theatre-featured-card:hover .theatre-poster-img {
          transform: scale(1.04);
        }

        /* Jump nav pills */
        .theatre-nav-pill {
          transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
        }
        .theatre-nav-pill:hover {
          background: #FFCC00 !important;
          border-color: rgba(36,17,35,0.4) !important;
          color: #241123 !important;
        }

        /* Season headings */
        .theatre-season-chapter-link {
          transition: color 0.18s ease, letter-spacing 0.18s ease;
        }
        .theatre-season-chapter-link:hover {
          color: #6C00AF !important;
          letter-spacing: 0.24em !important;
        }
        .theatre-season-pill-link {
          transition: letter-spacing 0.22s ease, opacity 0.22s ease;
        }
        .theatre-season-pill-link:hover {
          letter-spacing: 0.3em !important;
          opacity: 0.82;
        }

        /* Production cards */
        .theatre-prod-card {
          box-shadow: 0 2px 10px rgba(36,17,35,0.15), 0 1px 3px rgba(36,17,35,0.1);
          transition: box-shadow 0.25s ease, transform 0.25s ease, border-color 0.25s ease;
        }
        .theatre-prod-card:hover {
          box-shadow: 0 8px 32px rgba(108,0,175,0.18), 0 2px 6px rgba(108,0,175,0.1);
          transform: translateY(-3px);
          border-color: rgba(108,0,175,0.3) !important;
        }
        .theatre-prod-card:hover .theatre-card-poster {
          transform: scale(1.05);
        }
        .theatre-card-poster {
          transition: transform 0.5s ease;
        }

        /* Bottom cross-nav */
        .theatre-bottom-link {
          transition: box-shadow 0.2s ease, filter 0.2s ease, letter-spacing 0.2s ease;
        }
        .theatre-bottom-link:hover {
          box-shadow: 0 4px 16px rgba(108,0,175,0.3);
          filter: brightness(0.9) saturate(1.3);
          letter-spacing: 0.2em !important;
        }

        /* ── Responsive ── */

        /* Collapse era grid to single column on tablet/mobile */
        @media (max-width: 860px) {
          .theatre-era-grid {
            grid-template-columns: 1fr !important;
          }
          .theatre-era-image-panel {
            position: static !important;
          }
          .theatre-era-image-panel > div {
            aspect-ratio: 16 / 9 !important;
            max-height: 360px;
          }
        }

        /* Featured card stacks on mobile */
        @media (max-width: 640px) {
          .theatre-featured-card { flex-direction: column !important; }
          .theatre-featured-card > div:first-child { flex: 0 0 200px !important; min-height: 200px !important; }
        }
      `}</style>
    </div>
  );
}

// ─── Shared text styles ────────────────────────────────────────────────────────

const eyebrowOnDark: React.CSSProperties = {
  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
  fontSize: "0.8rem",
  fontWeight: 700,
  letterSpacing: "0.24em",
  textTransform: "uppercase",
  color: "#FFCC00",
  margin: 0,
};

const eyebrowOnKraft: React.CSSProperties = {
  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
  fontSize: "0.85rem",
  fontWeight: 800,
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  color: "#241123",
  margin: "0 0 1.1rem",
};

// ═══════════════════════════════════════════════════════════════
// SEASON ACTIVITIES — shown for seasons without productions
// ═══════════════════════════════════════════════════════════════
function SeasonActivities({ projects }: { projects: string[] }) {
  return (
    <div
      style={{
        backgroundColor: "rgba(255,255,255,0.22)",
        borderRadius: "10px",
        border: "1px dashed rgba(36,17,35,0.18)",
        padding: "1rem 1.25rem",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
          fontSize: "0.68rem",
          fontWeight: 800,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "#4a2a56",
          margin: "0 0 0.6rem",
        }}
      >
        Season Activities
      </p>
      <ul style={{ margin: 0, padding: "0 0 0 1rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        {projects.map((proj) => (
          <li
            key={proj}
            style={{
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              fontSize: "0.85rem",
              fontWeight: 400,
              color: "#241123",
              lineHeight: 1.6,
            }}
          >
            {proj}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PRODUCTION CARD
// ═══════════════════════════════════════════════════════════════
function ProductionCard({ p }: { p: Production }) {
  const { event, venue } = parseFestival(p.festival ?? undefined);

  return (
    <Link
      href={`/theatre/${p.slug}`}
      className="theatre-prod-card"
      style={{
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderRadius: "12px",
        border: `1px solid rgba(36,17,35,0.2)`,
        textDecoration: "none",
        backgroundColor: CARD_BG,
      }}
    >
      {/* Poster */}
      <div
        style={{
          position: "relative",
          height: "160px",
          flexShrink: 0,
          overflow: "hidden",
          backgroundColor: "#241123",
        }}
      >
        <Image
          src={posterSrc(p)}
          alt={shortTitle(p.title)}
          fill
          className="object-cover object-top theatre-card-poster"
          style={{ filter: "brightness(1.12) contrast(1.05) saturate(1.1)" }}
        />
      </div>

      {/* Text panel */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "0.3rem",
          padding: "0.8rem 1rem 1rem",
          borderTop: `1.5px solid rgba(36,17,35,0.18)`,
        }}
      >
        {/* Year + season + location */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
          <span
            style={{
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              fontSize: "0.72rem",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "#241123",
            }}
          >
            {p.year}{p.season ? ` · S${p.season}` : ""}
          </span>
          <span
            style={{
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              fontSize: "0.68rem",
              fontWeight: 600,
              color: "#4a2a56",
              textAlign: "right",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "55%",
            }}
          >
            {p.location}
          </span>
        </div>

        {/* Title */}
        <h3
          style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "1.05rem",
            fontWeight: 700,
            color: "#241123",
            lineHeight: 1.25,
            margin: 0,
          }}
        >
          {shortTitle(p.title)}
        </h3>

        {/* Festival */}
        {event && (
          <p
            style={{
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              fontSize: "0.72rem",
              fontWeight: 500,
              color: "#241123",
              margin: 0,
              lineHeight: 1.45,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            } as React.CSSProperties}
          >
            {event}
          </p>
        )}

        {/* Venue */}
        {venue && (
          <p
            style={{
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              fontSize: "0.68rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "#4a2a56",
              margin: "auto 0 0",
              paddingTop: "0.4rem",
            }}
          >
            {venue}
          </p>
        )}
      </div>
    </Link>
  );
}
