// app/theatre/page.tsx
import Link from "next/link";
import Image from "next/image";
import { productionMap, type Production, getSortYear } from "@/lib/productionMap";

const FALLBACK_POSTER = "/posters/fallback-16x9.jpg";
// The cream used for card panels — must match the gradient endpoint exactly to kill the flicker line
const CARD_CREAM = "rgba(252, 247, 237, 0.92)";

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

// "Blackfish -- Workshop Production" → "Blackfish"
function shortTitle(title: string): string {
  return title.split(" -- ")[0].trim();
}

// "ACTion Fest 2015: Tu a Teraz -- IATI Theatre" → { event, venue }
function parseFestival(festival: string | undefined): { event: string | null; venue: string | null } {
  if (!festival || !festival.trim()) return { event: null, venue: null };
  const parts = festival.split("--");
  return {
    event: parts[0].trim() || null,
    venue: parts[1]?.trim() || null,
  };
}

export default function TheatreIndexPage() {
  const allProductions = Object.values(productionMap).sort(sortProductions);

  // Group by season, descending
  const bySeason = new Map<number, Production[]>();
  for (const p of allProductions) {
    const s = p.season ?? 0;
    if (!bySeason.has(s)) bySeason.set(s, []);
    bySeason.get(s)!.push(p);
  }
  const seasonNums = Array.from(bySeason.keys()).sort((a, b) => b - a);

  // Dynamic stats from real data
  const years = allProductions.map(getSortYear).filter(Boolean);
  const earliestYear = Math.min(...years);
  const latestYear = Math.max(...years);

  // Count unique human artists (skip [todo-...] placeholder keys)
  const uniqueArtists = new Set<string>();
  for (const p of allProductions) {
    for (const key of Object.keys(p.artists)) {
      if (!key.startsWith("[")) uniqueArtists.add(key);
    }
  }

  // Count unique festivals/events
  const uniqueFestivals = new Set<string>();
  for (const p of allProductions) {
    if (p.festival && p.festival.trim()) {
      const { event } = parseFestival(p.festival);
      if (event) uniqueFestivals.add(event);
    }
  }

  const featured = allProductions[0];

  return (
    <div style={{ minHeight: "100vh", background: "transparent" }}>

      {/* ═══════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════ */}
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
          src="/images/performing-zanzibar.jpg"
          alt="DAT company performing on stage"
          fill
          priority
          className="object-cover object-center"
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(36,17,35,0.78) 0%, rgba(36,17,35,0.35) 40%, transparent 70%)",
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
          <p
            style={{
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              fontSize: "0.68rem",
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "#FFCC00",
              opacity: 0.9,
              margin: "0 0 0.5rem",
            }}
          >
            Dramatic Adventure Theatre
          </p>
          <h1
            style={{
              fontFamily: "var(--font-anton), system-ui, sans-serif",
              fontSize: "clamp(3.4rem, 10vw, 7.5rem)",
              textTransform: "uppercase",
              color: "#f2f2f2",
              lineHeight: 1.0,
              textShadow: "0 8px 24px rgba(0,0,0,0.8)",
              margin: 0,
            }}
          >
            Theatre
            <br />
            <span style={{ color: "#FFCC00" }}>Archive</span>
          </h1>
          <p
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "clamp(1rem, 2vw, 1.45rem)",
              color: "#f2f2f2",
              opacity: 0.65,
              margin: "0.6rem 0 0",
              fontWeight: 400,
              textShadow: "0 3px 10px rgba(0,0,0,0.9)",
            }}
          >
            Every world we&apos;ve visited. Every story we&apos;ve told.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          STATS — all computed from real data
      ═══════════════════════════════════════════ */}
      <section style={{ padding: "3.5rem 0 3rem" }}>
        <div style={{ width: "90vw", maxWidth: "1120px", margin: "0 auto" }}>
          <p style={eyebrow}>A lifetime of making theatre</p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(175px, 1fr))",
              backgroundColor: "rgba(36, 17, 35, 0.13)",
              borderRadius: "18px",
              border: "1px solid rgba(36, 17, 35, 0.16)",
              overflow: "hidden",
              boxShadow: "0 4px 20px rgba(36, 17, 35, 0.1)",
            }}
          >
            {[
              {
                n: String(seasonNums.length),
                label: "Seasons",
                sub: `${earliestYear}–${latestYear}`,
              },
              {
                n: String(allProductions.length),
                label: "Productions",
                sub: "original works & adaptations",
              },
              {
                n: `${uniqueArtists.size}+`,
                label: "Alumni Artists",
                sub: "directors, actors, designers",
              },
              {
                n: String(latestYear - earliestYear),
                label: "Years of Work",
                sub: `${earliestYear} to ${latestYear}`,
              },
            ].map(({ n, label, sub }, i, arr) => (
              <div
                key={label}
                style={{
                  padding: "1.5rem 1.75rem",
                  borderRight: i < arr.length - 1 ? "1px solid rgba(36,17,35,0.1)" : "none",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-anton), system-ui, sans-serif",
                    fontSize: "clamp(2rem, 5vw, 2.9rem)",
                    color: "#FFCC00",
                    lineHeight: 1,
                    marginBottom: "0.3rem",
                  }}
                >
                  {n}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.14em",
                    color: "#241123",
                    opacity: 0.88,
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                    fontSize: "0.62rem",
                    color: "#241123",
                    opacity: 0.52,
                    marginTop: "0.15rem",
                  }}
                >
                  {sub}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          FEATURED PRODUCTION
      ═══════════════════════════════════════════ */}
      {featured && (
        <section style={{ padding: "0 0 3.5rem" }}>
          <div style={{ width: "90vw", maxWidth: "1120px", margin: "0 auto" }}>
            <p style={eyebrow}>Most Recent Production</p>

            <Link
              href={`/theatre/${featured.slug}`}
              className="theatre-featured-card"
              style={{
                display: "flex",
                borderRadius: "14px",
                overflow: "hidden",
                border: "1px solid rgba(36,17,35,0.16)",
                textDecoration: "none",
                minHeight: "300px",
                boxShadow: "0 4px 24px rgba(36, 17, 35, 0.14)",
              }}
            >
              {/* Poster */}
              <div
                style={{
                  position: "relative",
                  flex: "0 0 42%",
                  minHeight: "260px",
                  overflow: "hidden",
                  backgroundColor: "rgba(36,17,35,0.12)",
                }}
              >
                <Image
                  src={posterSrc(featured)}
                  alt={featured.title}
                  fill
                  className="object-cover object-top theatre-poster-img"
                  priority
                />
                {/* Gradient fades right-edge into the cream text panel */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(to right, transparent 50%, rgba(252,247,237,0.6) 100%)",
                  }}
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
                  backgroundColor: CARD_CREAM,
                }}
              >
                <p
                  style={{
                    fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                    fontSize: "0.62rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.2em",
                    color: "#241123",
                    opacity: 0.5,
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
                    color: "#241123",
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
                        color: "#241123",
                        opacity: 0.55,
                        margin: 0,
                        lineHeight: 1.5,
                      }}
                    >
                      {event}
                      {venue && (
                        <span
                          style={{
                            display: "block",
                            fontSize: "0.66rem",
                            fontWeight: 600,
                            marginTop: "0.2rem",
                          }}
                        >
                          {venue}
                        </span>
                      )}
                    </p>
                  ) : null;
                })()}

                <span
                  style={{
                    display: "inline-block",
                    alignSelf: "flex-start",
                    marginTop: "0.5rem",
                    fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                    fontSize: "0.62rem",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.18em",
                    color: "#241123",
                    backgroundColor: "#FFCC00",
                    padding: "0.45em 1.1em",
                    borderRadius: "6px",
                  }}
                >
                  Explore Production →
                </span>
              </div>
            </Link>

            {/* Season archive link — outside card, avoids nested <a> */}
            <div style={{ marginTop: "0.75rem" }}>
              <Link
                href={`/season/${featured.season}`}
                className="theatre-text-link"
                style={{
                  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.18em",
                  color: "#241123",
                  opacity: 0.45,
                  textDecoration: "none",
                }}
              >
                Season {featured.season} Archive ↗
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════
          SEASON QUICK-NAV
      ═══════════════════════════════════════════ */}
      <div
        style={{
          borderTop: "1px solid rgba(36,17,35,0.1)",
          borderBottom: "1px solid rgba(36,17,35,0.1)",
          backgroundColor: "rgba(36, 17, 35, 0.07)",
          padding: "0.75rem 0",
        }}
      >
        <div
          style={{
            width: "90vw",
            maxWidth: "1120px",
            margin: "0 auto",
            overflowX: "auto",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
              whiteSpace: "nowrap",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                fontSize: "0.58rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.18em",
                color: "#241123",
                opacity: 0.3,
                marginRight: "0.5rem",
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
                  fontSize: "0.62rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  color: "#241123",
                  opacity: 0.55,
                  textDecoration: "none",
                  padding: "0.35em 0.75em",
                  borderRadius: "6px",
                  flexShrink: 0,
                }}
              >
                S{sn}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          PRODUCTIONS BY SEASON
      ═══════════════════════════════════════════ */}
      <section style={{ padding: "4rem 0 5rem" }}>
        <div style={{ width: "90vw", maxWidth: "1120px", margin: "0 auto" }}>

          <div style={{ marginBottom: "3rem" }}>
            <p style={eyebrow}>The Full Archive</p>
            <h2
              style={{
                fontFamily: "var(--font-anton), system-ui, sans-serif",
                fontSize: "clamp(2.2rem, 5vw, 3.6rem)",
                textTransform: "uppercase",
                color: "#530087",
                margin: 0,
                lineHeight: 1.0,
              }}
            >
              All Productions
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4rem" }}>
            {seasonNums.map((sn) => {
              const prods = bySeason.get(sn)!;
              const year = getSortYear(prods[0]);
              const locs = Array.from(new Set(prods.map((p) => p.location))).join(" · ");

              return (
                <div key={sn} id={`season-${sn}`}>
                  {/* Season chapter heading */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1.25rem",
                      marginBottom: "1.5rem",
                      paddingBottom: "1rem",
                      borderBottom: "1px solid rgba(36,17,35,0.12)",
                    }}
                  >
                    {/* Watermark number */}
                    <span
                      aria-hidden
                      style={{
                        fontFamily: "var(--font-anton), system-ui, sans-serif",
                        fontSize: "clamp(4rem, 9vw, 6rem)",
                        color: "rgba(36,17,35,0.07)",
                        lineHeight: 1,
                        userSelect: "none",
                        flexShrink: 0,
                      }}
                    >
                      {sn}
                    </span>

                    <div style={{ minWidth: 0 }}>
                      <Link
                        href={`/season/${sn}`}
                        className="theatre-season-chapter-link"
                        style={{
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.75rem",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--font-anton), system-ui, sans-serif",
                            fontSize: "1rem",
                            textTransform: "uppercase",
                            letterSpacing: "0.2em",
                            color: "#241123",
                            backgroundColor: "#FFCC00",
                            opacity: 0.72,
                            padding: "0.15em 0.6em",
                            borderRadius: "0.3em",
                            display: "inline-block",
                          }}
                        >
                          Season {sn}
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                            fontSize: "0.58rem",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.14em",
                            color: "#241123",
                            opacity: 0.4,
                          }}
                        >
                          Full season ↗
                        </span>
                      </Link>

                      <p
                        style={{
                          fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                          fontSize: "0.62rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.12em",
                          color: "#241123",
                          opacity: 0.45,
                          margin: "0.4rem 0 0",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {year} · {locs}
                      </p>
                    </div>
                  </div>

                  {/* Production cards grid */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                      gap: "1rem",
                    }}
                  >
                    {prods.map((p) => (
                      <ProductionCard key={p.slug} p={p} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom cross-nav */}
          <div
            style={{
              marginTop: "4rem",
              paddingTop: "2.5rem",
              borderTop: "1px solid rgba(36,17,35,0.12)",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
            }}
          >
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
              <Link
                href="/alumni"
                className="theatre-bottom-link"
                style={{
                  display: "inline-block",
                  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.14em",
                  color: "#241123",
                  textDecoration: "none",
                  border: "1px solid rgba(36,17,35,0.24)",
                  padding: "0.55em 1.2em",
                  borderRadius: "99px",
                  backgroundColor: "rgba(252,247,237,0.6)",
                }}
              >
                ← Alumni Directory
              </Link>
              <Link
                href="/story-map"
                className="theatre-bottom-link"
                style={{
                  display: "inline-block",
                  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.14em",
                  color: "#241123",
                  textDecoration: "none",
                  border: "1px solid rgba(36,17,35,0.24)",
                  padding: "0.55em 1.2em",
                  borderRadius: "99px",
                  backgroundColor: "rgba(252,247,237,0.6)",
                }}
              >
                Story Map →
              </Link>
            </div>
            <p
              style={{
                fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                fontSize: "0.6rem",
                color: "#241123",
                opacity: 0.38,
                margin: 0,
              }}
            >
              {earliestYear}–{latestYear} · {allProductions.length} productions · {uniqueArtists.size}+ artists
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          PAGE STYLES
      ═══════════════════════════════════════════ */}
      <style>{`
        /* ── Featured card ── */
        .theatre-featured-card {
          transition: box-shadow 0.28s ease, border-color 0.28s ease;
        }
        .theatre-featured-card:hover {
          box-shadow: 0 12px 48px rgba(36, 17, 35, 0.22) !important;
          border-color: rgba(36, 17, 35, 0.3) !important;
        }
        .theatre-poster-img {
          transition: transform 0.5s ease;
        }
        .theatre-featured-card:hover .theatre-poster-img {
          transform: scale(1.04);
        }

        /* ── Text links ── */
        .theatre-text-link:hover { opacity: 0.85 !important; }
        .theatre-nav-pill:hover {
          background: rgba(36, 17, 35, 0.09) !important;
          opacity: 0.8 !important;
        }
        .theatre-season-chapter-link:hover span:first-child {
          opacity: 0.95 !important;
        }
        .theatre-season-chapter-link:hover span:last-child {
          opacity: 0.65 !important;
        }

        /* ── Bottom nav ── */
        .theatre-bottom-link {
          opacity: 0.75;
          transition: opacity 0.2s ease, border-color 0.2s ease, background 0.2s ease;
        }
        .theatre-bottom-link:hover {
          opacity: 1;
          background: rgba(252,247,237,0.9) !important;
          border-color: rgba(36,17,35,0.35) !important;
        }

        /* ── Production card ── */
        .theatre-prod-card {
          /* Resting shadow so cards lift off the kraft surface */
          box-shadow: 0 2px 10px rgba(36, 17, 35, 0.12), 0 1px 3px rgba(36, 17, 35, 0.08);
          transition: box-shadow 0.25s ease, transform 0.25s ease, border-color 0.25s ease;
        }
        .theatre-prod-card:hover {
          box-shadow: 0 8px 32px rgba(36, 17, 35, 0.2), 0 2px 6px rgba(36, 17, 35, 0.1);
          transform: translateY(-3px);
          border-color: rgba(36, 17, 35, 0.28) !important;
        }
        .theatre-prod-card:hover .theatre-card-poster {
          transform: scale(1.05);
        }
        .theatre-card-poster {
          transition: transform 0.5s ease;
        }

        /* Mobile stacking */
        @media (max-width: 640px) {
          .theatre-featured-card {
            flex-direction: column !important;
          }
          .theatre-featured-card > div:first-child {
            flex: 0 0 200px !important;
            min-height: 200px !important;
          }
        }
      `}</style>
    </div>
  );
}

// ─── Shared style ─────────────────────────────────────────────────────────────
const eyebrow: React.CSSProperties = {
  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
  fontSize: "0.68rem",
  letterSpacing: "0.26em",
  textTransform: "uppercase",
  color: "#241123",
  opacity: 0.45,
  margin: "0 0 1.1rem",
};

// ═══════════════════════════════════════════════════════════════
// PRODUCTION CARD
// ═══════════════════════════════════════════════════════════════
function ProductionCard({ p }: { p: Production }) {
  const hasPoster = Boolean(p.posterUrl && p.posterUrl.trim());
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
        border: "1px solid rgba(36,17,35,0.13)",
        textDecoration: "none",
      }}
    >
      {/* ── Poster ── */}
      <div
        style={{
          position: "relative",
          height: "160px",
          flexShrink: 0,
          overflow: "hidden",
          // Background matches card-cream exactly — any subpixel gap at the border is invisible
          backgroundColor: CARD_CREAM,
        }}
      >
        <Image
          src={posterSrc(p)}
          alt={shortTitle(p.title)}
          fill
          className="object-cover object-top theatre-card-poster"
        />
        {/*
          Gradient fades bottom of poster INTO the same cream as the card body.
          Using a solid match at 0% eliminates the flicker line on hover zoom.
        */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(to top, ${CARD_CREAM} 0%, rgba(252,247,237,0.55) 28%, transparent 55%)`,
            // Extend 1px below to close the subpixel gap
            marginBottom: "-1px",
          }}
        />
        {/* Season badge for no-real-poster productions */}
        {!hasPoster && (
          <span
            style={{
              position: "absolute",
              top: "0.6rem",
              left: "0.6rem",
              fontFamily: "var(--font-anton), system-ui, sans-serif",
              fontSize: "0.65rem",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              color: "#241123",
              backgroundColor: "#FFCC00",
              opacity: 0.8,
              padding: "0.2em 0.55em",
              borderRadius: "4px",
            }}
          >
            S{p.season}
          </span>
        )}
      </div>

      {/* ── Text panel — cream matches gradient endpoint exactly ── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "0.3rem",
          padding: "0.75rem 1rem 0.9rem",
          backgroundColor: CARD_CREAM,
        }}
      >
        {/* Year + season meta */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              fontSize: "0.58rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              color: "#241123",
              opacity: 0.55,
            }}
          >
            {p.year}{p.season ? ` · S${p.season}` : ""}
          </span>
          <span
            style={{
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              fontSize: "0.56rem",
              color: "#241123",
              opacity: 0.4,
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
            fontSize: "0.88rem",
            fontWeight: 700,
            color: "#241123",
            lineHeight: 1.3,
            margin: 0,
          }}
        >
          {shortTitle(p.title)}
        </h3>

        {/* Festival context */}
        {event && (
          <p
            style={{
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              fontSize: "0.58rem",
              color: "#241123",
              opacity: 0.48,
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

        {/* Venue — pinned to bottom */}
        {venue && (
          <p
            style={{
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              fontSize: "0.56rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "#241123",
              opacity: 0.5,
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
