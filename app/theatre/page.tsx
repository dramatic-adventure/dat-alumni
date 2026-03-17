// app/theatre/page.tsx
import Link from "next/link";
import Image from "next/image";
import { productionMap, type Production, getSortYear } from "@/lib/productionMap";

const FALLBACK_POSTER = "/posters/fallback-16x9.jpg";

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

// "ACTion Fest 2015: Tu a Teraz / Here and Now -- IATI Theatre" → event / venue
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

  // Stats
  const years = allProductions.map(getSortYear).filter(Boolean);
  const earliestYear = Math.min(...years);
  const latestYear = Math.max(...years);
  const uniqueCountries = new Set(
    allProductions.map((p) => {
      const parts = p.location.split(",");
      return parts[parts.length - 1].trim();
    })
  );

  // Featured: most recent production
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
        {/* Gradient: darkens bottom for legibility */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(36,17,35,0.75) 0%, rgba(36,17,35,0.35) 40%, transparent 70%)",
          }}
        />
        {/* Title block — bottom right */}
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
          STATS
      ═══════════════════════════════════════════ */}
      <section style={{ padding: "3.5rem 0 3rem" }}>
        <div style={{ width: "90vw", maxWidth: "1120px", margin: "0 auto" }}>
          <p
            style={{
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              fontSize: "0.68rem",
              letterSpacing: "0.26em",
              textTransform: "uppercase",
              color: "#6C00AF",
              margin: "0 0 1.25rem",
            }}
          >
            A lifetime of making theatre
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              backgroundColor: "rgba(36, 17, 35, 0.12)",
              borderRadius: "18px",
              border: "1px solid rgba(36, 17, 35, 0.14)",
              overflow: "hidden",
            }}
          >
            {[
              { n: `${seasonNums.length}`, label: "Seasons", sub: `${earliestYear}–${latestYear}` },
              { n: `${allProductions.length}+`, label: "Productions", sub: "original works & adaptations" },
              { n: `${uniqueCountries.size}+`, label: "Countries & Regions", sub: "across 5 continents" },
              { n: `${latestYear - earliestYear}+`, label: "Years of Work", sub: `since ${earliestYear}` },
            ].map(({ n, label, sub }, i) => (
              <div
                key={label}
                style={{
                  padding: "1.5rem 1.75rem",
                  borderRight: i < 3 ? "1px solid rgba(36,17,35,0.1)" : "none",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-anton), system-ui, sans-serif",
                    fontSize: "clamp(2rem, 5vw, 3rem)",
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
                    opacity: 0.85,
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                    fontSize: "0.62rem",
                    color: "#241123",
                    opacity: 0.55,
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
            <p
              style={{
                fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                fontSize: "0.68rem",
                letterSpacing: "0.26em",
                textTransform: "uppercase",
                color: "#6C00AF",
                margin: "0 0 1.1rem",
              }}
            >
              Most Recent Production
            </p>

            <Link
              href={`/theatre/${featured.slug}`}
              className="theatre-featured-card"
              style={{
                display: "flex",
                borderRadius: "16px",
                overflow: "hidden",
                border: "1px solid rgba(36,17,35,0.18)",
                textDecoration: "none",
                minHeight: "300px",
              }}
            >
              {/* Poster */}
              <div
                style={{
                  position: "relative",
                  flex: "0 0 42%",
                  minHeight: "260px",
                  overflow: "hidden",
                }}
              >
                <Image
                  src={posterSrc(featured)}
                  alt={featured.title}
                  fill
                  className="object-cover object-top theatre-poster-img"
                  priority
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(to right, transparent 55%, rgba(255,250,240,0.15) 100%)",
                  }}
                />
              </div>

              {/* Text panel — white/cream for readability */}
              <div
                style={{
                  flex: 1,
                  padding: "2rem 2.5rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  gap: "0.65rem",
                  backgroundColor: "rgba(255, 250, 240, 0.85)",
                }}
              >
                <p
                  style={{
                    fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                    fontSize: "0.62rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.2em",
                    color: "#6C00AF",
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
                        opacity: 0.6,
                        margin: 0,
                        lineHeight: 1.4,
                      }}
                    >
                      {event}
                      {venue ? (
                        <span style={{ display: "block", fontSize: "0.68rem", opacity: 0.75, marginTop: "0.2rem" }}>
                          {venue}
                        </span>
                      ) : null}
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

            {/* Season archive link — outside card (avoids nested <a>) */}
            <div style={{ marginTop: "0.75rem" }}>
              <Link
                href={`/season/${featured.season}`}
                className="theatre-season-link"
                style={{
                  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.18em",
                  color: "#6C00AF",
                  textDecoration: "none",
                  opacity: 0.7,
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
        <div style={{ width: "90vw", maxWidth: "1120px", margin: "0 auto", overflowX: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", whiteSpace: "nowrap" }}>
            <span
              style={{
                fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                fontSize: "0.58rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.18em",
                color: "#241123",
                opacity: 0.35,
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

          {/* Heading */}
          <div style={{ marginBottom: "3rem" }}>
            <p
              style={{
                fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                fontSize: "0.68rem",
                letterSpacing: "0.26em",
                textTransform: "uppercase",
                color: "#6C00AF",
                margin: "0 0 0.5rem",
              }}
            >
              The Full Archive
            </p>
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
                        {/* Yellow pill */}
                        <span
                          style={{
                            fontFamily: "var(--font-anton), system-ui, sans-serif",
                            fontSize: "1rem",
                            textTransform: "uppercase",
                            letterSpacing: "0.2em",
                            color: "#241123",
                            backgroundColor: "#FFCC00",
                            opacity: 0.7,
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
                            color: "#6C00AF",
                            opacity: 0.6,
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
                          opacity: 0.5,
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
                  border: "1px solid rgba(36,17,35,0.22)",
                  padding: "0.55em 1.2em",
                  borderRadius: "99px",
                  backgroundColor: "rgba(255,250,240,0.55)",
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
                  border: "1px solid rgba(36,17,35,0.22)",
                  padding: "0.55em 1.2em",
                  borderRadius: "99px",
                  backgroundColor: "rgba(255,250,240,0.55)",
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
                opacity: 0.4,
                margin: 0,
              }}
            >
              {earliestYear}–{latestYear} · {allProductions.length} productions · {uniqueCountries.size} locations
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          PAGE STYLES
      ═══════════════════════════════════════════ */}
      <style>{`
        /* Featured card */
        .theatre-featured-card {
          transition: box-shadow 0.28s ease, border-color 0.28s ease;
        }
        .theatre-featured-card:hover {
          box-shadow: 0 10px 44px rgba(36, 17, 35, 0.18);
          border-color: rgba(108, 0, 175, 0.38) !important;
        }
        .theatre-poster-img {
          transition: transform 0.5s ease;
        }
        .theatre-featured-card:hover .theatre-poster-img {
          transform: scale(1.04);
        }

        /* Season / nav links */
        .theatre-season-link:hover { opacity: 1 !important; }
        .theatre-nav-pill:hover {
          background: rgba(36, 17, 35, 0.09) !important;
          opacity: 0.85 !important;
        }
        .theatre-season-chapter-link:hover span:first-child {
          opacity: 0.95 !important;
        }

        /* Bottom nav links */
        .theatre-bottom-link {
          transition: opacity 0.2s ease, border-color 0.2s ease, background 0.2s ease;
          opacity: 0.8;
        }
        .theatre-bottom-link:hover {
          opacity: 1;
          border-color: rgba(108, 0, 175, 0.4) !important;
          background: rgba(255, 250, 240, 0.85) !important;
        }

        /* Production card */
        .theatre-prod-card {
          transition: box-shadow 0.25s ease, border-color 0.25s ease, transform 0.25s ease;
        }
        .theatre-prod-card:hover {
          box-shadow: 0 6px 28px rgba(36, 17, 35, 0.16);
          border-color: rgba(255, 204, 0, 0.5) !important;
          transform: translateY(-2px);
        }
        .theatre-prod-card:hover .theatre-card-poster {
          transform: scale(1.05);
        }
        .theatre-card-poster {
          transition: transform 0.5s ease;
        }

        /* Mobile: featured card stacks vertically */
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
        border: "1px solid rgba(36,17,35,0.14)",
        textDecoration: "none",
      }}
    >
      {/* Poster image — always shown, fallback if no real poster */}
      <div
        style={{
          position: "relative",
          height: "160px",
          flexShrink: 0,
          overflow: "hidden",
          backgroundColor: "rgba(36,17,35,0.12)",
        }}
      >
        <Image
          src={posterSrc(p)}
          alt={shortTitle(p.title)}
          fill
          className="object-cover object-top theatre-card-poster"
        />
        {/* Fade-to-card-body at bottom */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, rgba(255,250,240,0.9) 0%, transparent 45%)",
          }}
        />
        {/* Season badge — top left */}
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

      {/* Text panel — cream white for readability off kraft */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "0.3rem",
          padding: "0.75rem 1rem 0.9rem",
          backgroundColor: "rgba(255, 250, 240, 0.85)",
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
              color: "#6C00AF",
              opacity: 0.8,
            }}
          >
            {p.year}{p.season ? ` · S${p.season}` : ""}
          </span>
          <span
            style={{
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              fontSize: "0.56rem",
              color: "#241123",
              opacity: 0.45,
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

        {/* Festival event */}
        {event && (
          <p
            style={{
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              fontSize: "0.58rem",
              color: "#241123",
              opacity: 0.5,
              margin: 0,
              lineHeight: 1.4,
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
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "#6C00AF",
              opacity: 0.65,
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
