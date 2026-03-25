// app/theatre/page.tsx
import Link from "next/link";
import Image from "next/image";
import { productionMap, type Production, getSortYear } from "@/lib/productionMap";
import { seasons as seasonData } from "@/lib/seasonData";
import { showcasesBySeason, type DatEvent } from "@/lib/events";

const FALLBACK_POSTER = "/posters/fallback-16x9.jpg";
const CARD_BG = "#f2f2f2";

// ─── Colour palette ────────────────────────────────────────────────────────────
const C = {
  ink:       "#241123",
  inkMid:    "#4a2a56",
  inkLight:  "#6b3f7a",
  gold:      "#FFCC00",
  white:     "#f2f2f2",
  divider:   "rgba(36,17,35,0.30)",
  dividerSm: "rgba(36,17,35,0.20)",
} as const;

// ─── Era definitions ───────────────────────────────────────────────────────────
// Each era anchors a block of seasons with a signature image.
// src: null = no image yet — renders a "New Era" placeholder.
// objectPosition: controls which part of the image shows (use "top" when the
//   subject is near the top so it isn't cropped).

interface EraConfig {
  id: string;
  label: string;
  seasons: readonly number[];
  years: string;
  geography: string;
  src: string | null;
  alt: string;
  objectPosition: string;
  filter?: string;          // optional CSS filter for per-image tone correction
}

const ERAS: EraConfig[] = [
  {
    id: "era-1",
    label: "The Beginning",
    seasons: [1, 2],
    years: "2006–2008",
    geography: "Zimbabwe · Ecuador · USA",
    src: "/posters/flight-360-landscape.jpg",
    alt: "Flight 360 — DAT Season 2, Ecuador",
    objectPosition: "top",          // subject sits high in the frame
  },
  {
    id: "era-2",
    label: "Hecho en Ecuador",
    seasons: [3],
    years: "2008–2009",
    geography: "Ecuador · NYC",
    src: "/images/theatre/archive/hotel_millionaire.webp",
    alt: "Hotel Millionaire — DAT Season 3, Ecuador",
    objectPosition: "center",
  },
  {
    id: "era-3",
    label: "Finding the Form",
    seasons: [4, 5, 6],
    years: "2009–2012",
    geography: "Ecuador · Slovakia · Washington D.C.",
    src: "/images/theatre/archive/esmeraldas_dumbshow.webp",
    alt: "Esmeraldas Dumbshow — DAT Season 4, Ecuador",
    objectPosition: "center",
  },
  {
    id: "era-4",
    label: "The Story Deepens",
    seasons: [7, 8],
    years: "2012–2014",
    geography: "Slovakia · Ecuador · NYC",
    src: "/images/theatre/archive/agwow-condor.webp",
    alt: "A Girl Without Wings — the Condor, the Andes",
    objectPosition: "top",   // subject near top — cut from bottom
  },
  {
    id: "era-5",
    label: "The Wide World",
    seasons: [9, 10],
    years: "2014–2016",
    geography: "Tanzania · Zanzibar · Slovakia · Ecuador",
    src: "/images/theatre/archive/tembo.webp",
    alt: "Tembo — DAT Season 10, Tanzania",
    objectPosition: "center",
  },
  {
    id: "era-6",
    label: "Into the Margins",
    seasons: [11, 12, 13, 14, 15],
    years: "2016–2021",
    geography: "Ecuador · Galápagos · Slovakia · USA",
    src: "/images/theatre/archive/blackfish_mommy.webp",
    alt: "Blackfish — DAT Season 12",
    objectPosition: "top",   // subject near top — cut from bottom
  },
  {
    id: "era-7",
    label: "The Present Tense",
    seasons: [16, 17, 18, 19],
    years: "2021–2025",
    geography: "Ecuador · Slovakia · Hudson Valley",
    src: "/images/theatre/archive/the-rainbow-of-san-luis-puppets.jpeg",
    alt: "The Rainbow of San Luis — DAT Season 16, Ecuador",
    objectPosition: "60% 30%",      // subject upper-right of frame
    filter: "contrast(1.18) saturate(1.3) brightness(1.04)", // sharpen and enrich the image
  },
  {
    id: "era-8",
    label: "A New Era",
    seasons: [20],
    years: "2025–present",
    geography: "TBA",
    src: null,               // image coming this summer — placeholder rendered below
    alt: "",
    objectPosition: "center",
  },
];

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

function schoolYear(sortYear: number): string {
  if (!sortYear || sortYear === 0) return "";
  return `${sortYear - 1}–${sortYear}`;
}

// All season numbers from seasonData, sorted newest → oldest (for jump nav)
function allSeasonNums(): number[] {
  return seasonData
    .map((s) => parseInt(s.slug.replace("season-", ""), 10))
    .filter((n) => !isNaN(n))
    .sort((a, b) => b - a);
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function TheatreIndexPage() {
  const allProductions = Object.values(productionMap).sort(sortProductions);

  const bySeason = new Map<number, Production[]>();
  for (const p of allProductions) {
    const s = p.season ?? 0;
    if (!bySeason.has(s)) bySeason.set(s, []);
    bySeason.get(s)!.push(p);
  }

  // Community showcases grouped by season — auto-derived from events data
  const showcaseMap = showcasesBySeason();

  // Stats — all derived dynamically from data
  const years = allProductions.map(getSortYear).filter(Boolean);
  const earliestYear = Math.min(...years);
  const totalSeasons = seasonData.length; // always accurate as seasons are added

  const uniqueCountries = new Set<string>();
  for (const p of allProductions) {
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

  // Jump nav: every season in seasonData — updates automatically as seasons are added
  const jumpSeasons = allSeasonNums();

  return (
    <div style={{ minHeight: "100vh", background: "transparent" }}>

      {/* ════════════════════════════════════════════
          HERO
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
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, rgba(36,17,35,0.88) 0%, rgba(36,17,35,0.3) 45%, transparent 70%)",
          }}
        />
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
            <em style={{ fontStyle: "italic" }}>Moved to act.</em>
          </p>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          STATS
      ════════════════════════════════════════════ */}
      <section style={{ padding: "3.5rem 0 3rem" }}>
        <div style={{ width: "90vw", maxWidth: "1120px", margin: "0 auto" }}>
          <p style={eyebrowOnKraft}>The adventure, by the numbers</p>
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
              { n: String(totalSeasons),         label: "Seasons",        sub: "2006–present" },
              { n: String(allProductions.length), label: "Productions",    sub: "original works & adaptations" },
              { n: String(uniqueArtists.size),    label: "Alumni Artists", sub: "directors, actors & designers" },
              { n: String(uniqueCountries.size),  label: "Countries",      sub: "where the work was born" },
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
                    color: C.white,
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
                    <p style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: "0.78rem", color: C.ink, margin: 0, lineHeight: 1.5 }}>
                      {event}
                      {venue && <span style={{ display: "block", fontSize: "0.68rem", fontWeight: 700, color: C.inkMid, marginTop: "0.2rem" }}>{venue}</span>}
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
          THE FULL ARCHIVE — header merges mission
          statement with jump navigation
      ════════════════════════════════════════════ */}
      <section style={{ padding: "4rem 0 5rem" }}>
        <div style={{ width: "90vw", maxWidth: "1120px", margin: "0 auto" }}>

          {/* ── Archive intro block ── */}
          <div
            style={{
              marginBottom: "4rem",
              backgroundColor: "rgba(255,255,255,0.35)",
              borderRadius: "14px",
              padding: "2rem 2rem 1.5rem",
            }}
          >
            {/* Heading row */}
            <div style={{ marginBottom: "1.5rem" }}>
              <p style={{ ...eyebrowOnKraft, margin: "0 0 0.3rem" }}>The Full Archive</p>
              <h2
                style={{
                  fontFamily: "var(--font-anton), system-ui, sans-serif",
                  fontSize: "clamp(2.2rem, 5vw, 3.6rem)",
                  textTransform: "uppercase",
                  color: C.ink,
                  margin: 0,
                  lineHeight: 1.0,
                }}
              >
                All Productions
              </h2>
            </div>

            {/* Mission statement */}
            <p
              style={{
                fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                fontSize: "clamp(0.92rem, 1.6vw, 1.05rem)",
                fontWeight: 500,
                color: C.ink,
                lineHeight: 1.75,
                margin: "0 0 1.25rem",
                opacity: 0.88,
              }}
            >
              All DAT works are born abroad — inspired by unique landscapes, moved by local and global
              concerns, devised with a diverse ensemble, and developed through cross-cultural partnership.
              Whether a play, a community collaboration, or an immersive experience, each production is
              researched in the field and shared with audiences near and far.
            </p>

            {/* Mission pillars — typographic, not interactive */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
                gap: "0.65rem 2.5rem",
                marginBottom: "1.75rem",
              }}
            >
              {[
                "Connect communities",
                "Amplify local concerns",
                "Explore global implications",
                "Move audiences to act",
              ].map((line) => (
                <div
                  key={line}
                  style={{
                    fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                    fontSize: "0.88rem",
                    fontWeight: 700,
                    color: C.ink,
                    borderLeft: `3px solid ${C.gold}`,
                    paddingLeft: "0.75em",
                    lineHeight: 1.4,
                  }}
                >
                  {line}
                </div>
              ))}
            </div>

            {/* Divider */}
            <div style={{ height: "1.5px", backgroundColor: "rgba(36,17,35,0.15)", marginBottom: "1.1rem" }} />

            {/* Jump nav — ALL seasons from seasonData, always current */}
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
              {jumpSeasons.map((sn) => (
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
                    padding: "0.35em 0.75em",
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
          <div style={{ display: "flex", flexDirection: "column" }}>
            {ERAS.map((era, eraIdx) => {
              const eraSeasonNums = era.seasons.filter((sn) =>
                bySeason.has(sn) || seasonData.some((s) => s.slug === `season-${sn}`)
              );
              if (eraSeasonNums.length === 0) return null;

              return (
                <div key={era.id} id={era.id}>

                  {/* Era separator */}
                  {eraIdx > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", padding: "3.5rem 0 3rem" }}>
                      <div style={{ flex: 1, height: "1.5px", background: C.divider }} />
                      <div
                        style={{
                          padding: "0.4em 1.4em",
                          borderRadius: "999px",
                          backgroundColor: "rgba(36,17,35,0.13)",
                          border: `1px solid rgba(36,17,35,0.32)`,
                          flexShrink: 0,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                            fontSize: "0.72rem",
                            fontWeight: 900,
                            textTransform: "uppercase",
                            letterSpacing: "0.22em",
                            color: C.ink,
                          }}
                        >
                          {era.years}
                        </span>
                      </div>
                      <div style={{ flex: 1, height: "1.5px", background: C.divider }} />
                    </div>
                  )}

                  {/* Two-column: sticky image left + seasons right */}
                  <div
                    className="theatre-era-grid"
                    style={{ display: "grid", gridTemplateColumns: "38% 1fr", gap: "2.5rem", alignItems: "flex-start" }}
                  >

                    {/* ── Left: era image (or placeholder) ── */}
                    <div className="theatre-era-image-panel" style={{ position: "sticky", top: "5.5rem" }}>
                      <div
                        style={{
                          position: "relative",
                          borderRadius: "18px",
                          overflow: "hidden",
                          aspectRatio: "4 / 5",
                          boxShadow: "0 12px 48px rgba(36,17,35,0.32), 0 2px 8px rgba(36,17,35,0.2)",
                          backgroundColor: C.ink,
                        }}
                      >
                        {era.src ? (
                          <Image
                            src={era.src}
                            alt={era.alt}
                            fill
                            className="theatre-era-photo"
                            style={{
                              objectFit: "cover",
                              objectPosition: era.objectPosition,
                              ...(era.filter ? { filter: era.filter } : {}),
                            }}
                            sizes="(max-width: 860px) 90vw, 38vw"
                          />
                        ) : (
                          /* Season 20 — "A New Era" placeholder */
                          <div
                            style={{
                              position: "absolute",
                              inset: 0,
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "1rem",
                              padding: "2rem",
                              background: `linear-gradient(145deg, #241123 0%, #3a1040 60%, #241123 100%)`,
                            }}
                          >
                            <span
                              style={{
                                fontFamily: "var(--font-anton), system-ui, sans-serif",
                                fontSize: "clamp(4rem, 12vw, 7rem)",
                                color: "rgba(255,204,0,0.12)",
                                lineHeight: 1,
                                userSelect: "none",
                              }}
                            >
                              20
                            </span>
                            <div style={{ width: "40px", height: "2px", backgroundColor: C.gold, borderRadius: "1px" }} />
                            <p
                              style={{
                                fontFamily: "var(--font-anton), system-ui, sans-serif",
                                fontSize: "clamp(1.2rem, 3vw, 1.6rem)",
                                textTransform: "uppercase",
                                color: C.white,
                                textAlign: "center",
                                lineHeight: 1.1,
                                margin: 0,
                                letterSpacing: "0.06em",
                              }}
                            >
                              A New Era
                            </p>
                            <p
                              style={{
                                fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                                fontSize: "0.72rem",
                                fontWeight: 600,
                                textTransform: "uppercase",
                                letterSpacing: "0.2em",
                                color: "rgba(255,204,0,0.7)",
                                textAlign: "center",
                                margin: 0,
                              }}
                            >
                              Image coming this summer
                            </p>
                          </div>
                        )}

                        {/* Gradient + caption (only when there's a real image) */}
                        {era.src && (
                          <>
                            <div
                              style={{
                                position: "absolute",
                                inset: 0,
                                background: "linear-gradient(to top, rgba(36,17,35,0.92) 0%, rgba(36,17,35,0.4) 38%, transparent 62%)",
                                pointerEvents: "none",
                              }}
                            />
                            <div style={{ position: "absolute", bottom: "1.4rem", left: "1.4rem", right: "1.4rem" }}>
                              <p
                                style={{
                                  fontFamily: "var(--font-anton), system-ui, sans-serif",
                                  fontSize: "clamp(1.4rem, 2.8vw, 2rem)",
                                  textTransform: "uppercase",
                                  color: C.white,
                                  margin: "0 0 0.35rem",
                                  lineHeight: 1,
                                  textShadow: "0 2px 10px rgba(0,0,0,0.7)",
                                }}
                              >
                                {era.label}
                              </p>
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
                                Seasons {era.seasons[0]}
                                {era.seasons.length > 1 ? `–${era.seasons[era.seasons.length - 1]}` : ""}
                                &ensp;·&ensp;{era.years}
                              </p>
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
                          </>
                        )}
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

                            {/* Productions or activity list */}
                            {prods && prods.length > 0 ? (
                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "repeat(auto-fill, minmax(195px, 1fr))",
                                  gap: "1rem",
                                }}
                              >
                                {prods.map((p) => <ProductionCard key={p.slug} p={p} />)}
                              </div>
                            ) : sdEntry ? (
                              <SeasonActivities projects={sdEntry.projects as unknown as string[]} />
                            ) : null}

                            {/* Community Showcases — auto-populated from events data */}
                            <ShowcaseArchiveRows showcases={showcaseMap.get(sn)} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Bottom cross-nav ── */}
          <div style={{ marginTop: "5rem", paddingTop: "2.5rem", borderTop: `2.5px solid ${C.divider}` }}>
            <p style={{ ...eyebrowOnKraft, marginBottom: "1.5rem" }}>Explore More</p>
            <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap" }}>
              {[
                {
                  href:  "/projects",
                  title: "Project Archive →",
                  sub:   "Every trek, residency, and retreat",
                },
                {
                  href:  "/alumni",
                  title: "Alumni Directory →",
                  sub:   "The artists who made it happen",
                },
              ].map(({ href, title, sub }) => (
                <Link
                  key={href}
                  href={href}
                  className="theatre-bottom-link"
                  style={{
                    flex:            "1 1 260px",
                    display:         "flex",
                    flexDirection:   "column",
                    justifyContent:  "center",
                    gap:             "0.4rem",
                    padding:         "1.6rem 2rem",
                    borderRadius:    "14px",
                    border:          `1.5px solid ${C.divider}`,
                    backgroundColor: "rgba(36,17,35,0.06)",
                    textDecoration:  "none",
                    minHeight:       "110px",
                  }}
                >
                  <span
                    style={{
                      fontFamily:    "var(--font-anton), system-ui, sans-serif",
                      fontSize:      "clamp(1.4rem, 3vw, 2rem)",
                      textTransform: "uppercase",
                      color:         C.ink,
                      lineHeight:    1,
                      letterSpacing: "0.04em",
                    }}
                  >
                    {title}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                      fontSize:   "0.82rem",
                      color:      "rgba(36,17,35,0.72)",
                      fontWeight: 600,
                      lineHeight: 1.4,
                    }}
                  >
                    {sub}
                  </span>
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
        .theatre-nav-pill {
          transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
        }
        .theatre-nav-pill:hover {
          background: #FFCC00 !important;
          border-color: rgba(36,17,35,0.4) !important;
          color: #241123 !important;
        }
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
        .theatre-bottom-link {
          transition: box-shadow 0.2s ease, filter 0.2s ease;
        }
        .theatre-bottom-link:hover {
          box-shadow: 0 4px 20px rgba(36,17,35,0.22);
          filter: brightness(0.96);
        }

        /* ── Responsive ── */
        @media (max-width: 860px) {
          .theatre-era-grid {
            grid-template-columns: 1fr !important;
          }
          .theatre-era-image-panel {
            position: static !important;
          }
          .theatre-era-image-panel > div {
            aspect-ratio: 16 / 9 !important;
            max-height: 340px;
          }
        }
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
  fontSize: "0.95rem",
  fontWeight: 900,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "#FFCC00",
  margin: 0,
};

const eyebrowOnKraft: React.CSSProperties = {
  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
  fontSize: "0.95rem",
  fontWeight: 900,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "#241123",
  margin: "0 0 1.1rem",
};

// ═══════════════════════════════════════════════════════════════
// SEASON ACTIVITIES — seasons without productions show their
// project list from seasonData
// ═══════════════════════════════════════════════════════════════
// ─── Community Showcase rows — shown under each season that has archived showcases ─
function ShowcaseArchiveRows({ showcases }: { showcases?: DatEvent[] }) {
  if (!showcases || showcases.length === 0) return null;

  return (
    <div
      style={{
        marginTop: "1rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
      }}
    >
      {/* Section eyebrow */}
      <p
        style={{
          fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
          fontSize: "0.62rem",
          fontWeight: 800,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "rgba(47,168,115,0.75)",
          margin: "0 0 0.35rem 0.1rem",
        }}
      >
        Community Showcases
      </p>

      {showcases.map((ev) => {
        const month = new Date(ev.date + "T12:00:00Z").toLocaleString("en-US", { month: "short", timeZone: "UTC" });
        const day   = new Date(ev.date + "T12:00:00Z").getUTCDate();
        const year  = new Date(ev.date + "T12:00:00Z").getUTCFullYear();

        return (
          <div
            key={ev.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.55rem 0.9rem",
              borderRadius: "8px",
              backgroundColor: "rgba(47,168,115,0.06)",
              border: "1px solid rgba(47,168,115,0.18)",
            }}
          >
            {/* Date badge */}
            <span
              style={{
                fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                fontSize: "0.65rem",
                fontWeight: 700,
                letterSpacing: "0.06em",
                color: "rgba(47,168,115,0.85)",
                whiteSpace: "nowrap",
                flexShrink: 0,
                minWidth: "5.5rem",
              }}
            >
              {month} {day}, {year}
            </span>

            {/* Title */}
            <span
              style={{
                fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                fontSize: "0.82rem",
                fontWeight: 600,
                color: "#241123",
                flex: 1,
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {ev.title}
            </span>

            {/* City · Country */}
            <span
              style={{
                fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                fontSize: "0.7rem",
                color: "rgba(36,17,35,0.45)",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {ev.city}, {ev.country}
            </span>

            {/* Badge */}
            <span
              style={{
                fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                fontSize: "0.58rem",
                fontWeight: 800,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(47,168,115,0.85)",
                border: "1px solid rgba(47,168,115,0.3)",
                borderRadius: "4px",
                padding: "0.15rem 0.45rem",
                flexShrink: 0,
              }}
            >
              Showcase
            </span>
          </div>
        );
      })}
    </div>
  );
}

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
