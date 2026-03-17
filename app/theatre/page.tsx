// app/theatre/page.tsx
import Link from "next/link";
import Image from "next/image";
import { productionMap, type Production, getSortYear } from "@/lib/productionMap";

function sortProductions(a: Production, b: Production) {
  const yearA = getSortYear(a);
  const yearB = getSortYear(b);
  if (yearA !== yearB) return yearB - yearA;
  if (a.season !== b.season) return (b.season || 0) - (a.season || 0);
  return a.title.localeCompare(b.title);
}

function festivalShort(festival: string | undefined): string | null {
  if (!festival) return null;
  const clean = festival.split("--")[0].trim();
  return clean || null;
}

function festivalVenue(festival: string | undefined): string | null {
  if (!festival) return null;
  const parts = festival.split("--");
  return parts[1]?.trim() || null;
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
  const uniqueLocations = new Set(
    allProductions.map((p) => {
      const parts = p.location.split(",");
      return parts[parts.length - 1].trim();
    })
  );

  // Featured: most recent production that has a poster
  const featured = allProductions.find((p) => p.posterUrl && p.posterUrl.trim());

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "transparent",
      }}
    >
      {/* ── HERO ──────────────────────────────────────────────────────────── */}
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

        {/* Gradient overlay — darkens bottom-left for text legibility */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(135deg, rgba(36,17,35,0.72) 0%, rgba(36,17,35,0.35) 45%, transparent 75%), " +
              "linear-gradient(to top, rgba(36,17,35,0.6) 0%, transparent 50%)",
          }}
        />

        {/* Title block — bottom right, Anton style */}
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
              fontSize: "0.7rem",
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "#FFCC00",
              opacity: 0.9,
              margin: 0,
              marginBottom: "0.5rem",
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
              opacity: 0.95,
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
              fontSize: "clamp(1rem, 2vw, 1.5rem)",
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

      {/* ── STATS STRIP ───────────────────────────────────────────────────── */}
      <section
        style={{
          padding: "3.5rem 0 3rem",
        }}
      >
        <div
          style={{
            width: "90vw",
            maxWidth: "1120px",
            margin: "0 auto",
          }}
        >
          {/* Eyebrow */}
          <p
            style={{
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              fontSize: "0.68rem",
              letterSpacing: "0.26em",
              textTransform: "uppercase",
              color: "#6C00AF",
              opacity: 0.8,
              margin: "0 0 1.25rem",
            }}
          >
            A lifetime of making theatre
          </p>

          {/* Stats box */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "0.1rem",
              backgroundColor: "rgba(36, 17, 35, 0.1)",
              borderRadius: "18px",
              padding: "2rem 2.5rem",
              border: "1px solid rgba(36, 17, 35, 0.12)",
            }}
          >
            {[
              { n: `${seasonNums.length}`, label: "Seasons", sub: `${earliestYear}–${latestYear}` },
              { n: `${allProductions.length}+`, label: "Productions", sub: "original works & adaptations" },
              { n: `${uniqueLocations.size}+`, label: "Countries & Regions", sub: "across 5 continents" },
              { n: `${latestYear - earliestYear}+`, label: "Years of Work", sub: `since ${earliestYear}` },
            ].map(({ n, label, sub }) => (
              <div
                key={label}
                style={{
                  padding: "1rem",
                  borderRight: "1px solid rgba(36,17,35,0.1)",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-anton), system-ui, sans-serif",
                    fontSize: "clamp(2.2rem, 5vw, 3.2rem)",
                    color: "#FFCC00",
                    lineHeight: 1,
                    marginBottom: "0.2rem",
                  }}
                >
                  {n}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.16em",
                    color: "#241123",
                    opacity: 0.8,
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                    fontSize: "0.65rem",
                    color: "#241123",
                    opacity: 0.45,
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

      {/* ── FEATURED PRODUCTION ───────────────────────────────────────────── */}
      {featured && (
        <section
          style={{
            padding: "0 0 3.5rem",
          }}
        >
          <div
            style={{
              width: "90vw",
              maxWidth: "1120px",
              margin: "0 auto",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                fontSize: "0.68rem",
                letterSpacing: "0.26em",
                textTransform: "uppercase",
                color: "#6C00AF",
                opacity: 0.8,
                margin: "0 0 1.1rem",
              }}
            >
              Most Recent Production
            </p>

            {/* Featured card */}
            <Link
              href={`/theatre/${featured.slug}`}
              style={{
                display: "flex",
                borderRadius: "16px",
                overflow: "hidden",
                border: "1px solid rgba(36,17,35,0.15)",
                backgroundColor: "rgba(36, 17, 35, 0.06)",
                textDecoration: "none",
                transition: "box-shadow 0.3s ease, border-color 0.3s ease",
                minHeight: "320px",
                position: "relative",
              }}
              className="theatre-featured-card"
            >
              {/* Poster image */}
              <div
                style={{
                  position: "relative",
                  flex: "0 0 42%",
                  minHeight: "280px",
                  overflow: "hidden",
                }}
              >
                <Image
                  src={featured.posterUrl!}
                  alt={featured.title}
                  fill
                  className="object-cover object-top"
                  priority
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(to right, transparent 60%, rgba(36,17,35,0.15) 100%)",
                  }}
                />
              </div>

              {/* Text content */}
              <div
                style={{
                  flex: 1,
                  padding: "2rem 2.5rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  gap: "0.75rem",
                }}
              >
                <p
                  style={{
                    fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                    fontSize: "0.62rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.22em",
                    color: "#6C00AF",
                    margin: 0,
                  }}
                >
                  Season {featured.season} · {featured.year} · {featured.location}
                </p>

                <h2
                  style={{
                    fontFamily: "var(--font-anton), system-ui, sans-serif",
                    fontSize: "clamp(2rem, 4vw, 3.6rem)",
                    textTransform: "uppercase",
                    color: "#241123",
                    lineHeight: 1.0,
                    margin: 0,
                  }}
                >
                  {featured.title}
                </h2>

                {featured.festival && (
                  <p
                    style={{
                      fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                      fontSize: "0.8rem",
                      color: "#241123",
                      opacity: 0.5,
                      margin: 0,
                    }}
                  >
                    {festivalShort(featured.festival)}
                  </p>
                )}

                <div style={{ marginTop: "0.5rem" }}>
                  <span
                    style={{
                      display: "inline-block",
                      fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                      fontSize: "0.65rem",
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.2em",
                      color: "#241123",
                      backgroundColor: "#FFCC00",
                      opacity: 0.75,
                      padding: "0.4em 1em",
                      borderRadius: "6px",
                    }}
                    className="theatre-explore-btn"
                  >
                    Explore Production →
                  </span>
                </div>
              </div>
            </Link>

            {/* Season archive link — outside the card to avoid nested anchors */}
            <div style={{ marginTop: "0.75rem" }}>
              <Link
                href={`/season/${featured.season}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.18em",
                  color: "#6C00AF",
                  textDecoration: "none",
                  opacity: 0.7,
                  transition: "opacity 0.2s ease",
                }}
                className="theatre-season-link"
              >
                Season {featured.season} Archive ↗
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── SEASON QUICK-NAV ──────────────────────────────────────────────── */}
      <div
        style={{
          borderTop: "1px solid rgba(36,17,35,0.1)",
          borderBottom: "1px solid rgba(36,17,35,0.1)",
          backgroundColor: "rgba(36, 17, 35, 0.05)",
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
              gap: "0.4rem",
              whiteSpace: "nowrap",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                fontSize: "0.58rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.2em",
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
                style={{
                  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                  fontSize: "0.62rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  color: "#241123",
                  opacity: 0.5,
                  textDecoration: "none",
                  padding: "0.35em 0.75em",
                  borderRadius: "6px",
                  transition: "background 0.15s ease, opacity 0.15s ease",
                  flexShrink: 0,
                }}
                className="theatre-nav-pill"
              >
                S{sn}
              </a>
            ))}
            <span style={{ margin: "0 0.5rem", color: "rgba(36,17,35,0.2)", flexShrink: 0 }}>·</span>
            {seasonNums.map((sn) => (
              <Link
                key={sn}
                href={`/season/${sn}`}
                style={{
                  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "#6C00AF",
                  textDecoration: "none",
                  padding: "0.3em 0.5em",
                  flexShrink: 0,
                  opacity: 0.7,
                  transition: "opacity 0.15s ease",
                }}
                className="theatre-season-nav-link"
              >
                Season {sn} ↗
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── PRODUCTIONS BY SEASON ─────────────────────────────────────────── */}
      <section
        style={{
          padding: "4rem 0 5rem",
        }}
      >
        <div
          style={{
            width: "90vw",
            maxWidth: "1120px",
            margin: "0 auto",
          }}
        >
          {/* Section heading */}
          <div style={{ marginBottom: "3rem" }}>
            <p
              style={{
                fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                fontSize: "0.68rem",
                letterSpacing: "0.26em",
                textTransform: "uppercase",
                color: "#6C00AF",
                opacity: 0.8,
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
                color: "#241123",
                opacity: 0.85,
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
                      gap: "1.5rem",
                      marginBottom: "1.5rem",
                      paddingBottom: "1rem",
                      borderBottom: "1px solid rgba(36,17,35,0.1)",
                    }}
                  >
                    {/* Big season watermark number */}
                    <span
                      aria-hidden
                      style={{
                        fontFamily: "var(--font-anton), system-ui, sans-serif",
                        fontSize: "clamp(4rem, 9vw, 6.5rem)",
                        color: "rgba(36,17,35,0.06)",
                        lineHeight: 1,
                        userSelect: "none",
                        flexShrink: 0,
                      }}
                    >
                      {sn}
                    </span>

                    <div style={{ minWidth: 0 }}>
                      {/* Yellow pill season label */}
                      <Link
                        href={`/season/${sn}`}
                        style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.6rem" }}
                        className="theatre-season-chapter-link"
                      >
                        <span
                          style={{
                            fontFamily: "var(--font-anton), system-ui, sans-serif",
                            fontSize: "1rem",
                            textTransform: "uppercase",
                            letterSpacing: "0.2em",
                            color: "#241123",
                            backgroundColor: "#FFCC00",
                            opacity: 0.65,
                            padding: "0.15em 0.6em",
                            borderRadius: "0.3em",
                            display: "inline-block",
                            transition: "opacity 0.2s ease",
                          }}
                        >
                          Season {sn}
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                            fontSize: "0.6rem",
                            color: "#241123",
                            opacity: 0.3,
                            textTransform: "uppercase",
                            letterSpacing: "0.15em",
                          }}
                        >
                          View full season ↗
                        </span>
                      </Link>

                      {/* Year + Locations */}
                      <p
                        style={{
                          fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                          fontSize: "0.62rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.14em",
                          color: "#241123",
                          opacity: 0.4,
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
                      gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
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
              borderTop: "1px solid rgba(36,17,35,0.1)",
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
                style={{
                  display: "inline-block",
                  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  color: "#241123",
                  opacity: 0.55,
                  textDecoration: "none",
                  border: "1px solid rgba(36,17,35,0.2)",
                  padding: "0.55em 1.2em",
                  borderRadius: "99px",
                  transition: "opacity 0.2s ease, border-color 0.2s ease",
                }}
                className="theatre-bottom-link"
              >
                ← Alumni Directory
              </Link>
              <Link
                href="/story-map"
                style={{
                  display: "inline-block",
                  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  color: "#241123",
                  opacity: 0.55,
                  textDecoration: "none",
                  border: "1px solid rgba(36,17,35,0.2)",
                  padding: "0.55em 1.2em",
                  borderRadius: "99px",
                  transition: "opacity 0.2s ease, border-color 0.2s ease",
                }}
                className="theatre-bottom-link"
              >
                Story Map →
              </Link>
            </div>
            <p
              style={{
                fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                fontSize: "0.62rem",
                color: "#241123",
                opacity: 0.3,
                margin: 0,
              }}
            >
              {earliestYear}–{latestYear} · {allProductions.length} productions across{" "}
              {uniqueLocations.size} locations
            </p>
          </div>
        </div>
      </section>

      {/* ── PAGE STYLES ───────────────────────────────────────────────────── */}
      <style>{`
        .theatre-featured-card:hover {
          box-shadow: 0 8px 40px rgba(36, 17, 35, 0.18);
          border-color: rgba(108, 0, 175, 0.35) !important;
        }
        .theatre-featured-card:hover .theatre-explore-btn {
          opacity: 1 !important;
        }
        .theatre-nav-pill:hover {
          background: rgba(36, 17, 35, 0.08) !important;
          opacity: 0.85 !important;
        }
        .theatre-season-link:hover {
          opacity: 1 !important;
        }
        .theatre-season-nav-link:hover {
          opacity: 1 !important;
        }
        .theatre-season-chapter-link:hover span:first-child {
          opacity: 0.9 !important;
        }
        .theatre-bottom-link:hover {
          opacity: 0.9 !important;
          border-color: rgba(108, 0, 175, 0.45) !important;
        }
        .theatre-prod-card:hover {
          box-shadow: 0 6px 28px rgba(36, 17, 35, 0.15);
          border-color: rgba(255, 204, 0, 0.45) !important;
          transform: translateY(-2px);
        }
        .theatre-prod-card {
          transition: box-shadow 0.25s ease, border-color 0.25s ease, transform 0.25s ease;
        }

        @media (max-width: 640px) {
          .theatre-featured-card {
            flex-direction: column !important;
          }
          .theatre-featured-card > div:first-child {
            flex: 0 0 220px !important;
            min-height: 220px !important;
          }
        }
      `}</style>
    </div>
  );
}

// ── PRODUCTION CARD ──────────────────────────────────────────────────────────

function ProductionCard({ p }: { p: Production }) {
  const hasPoster = Boolean(p.posterUrl && p.posterUrl.trim());
  const short = festivalShort(p.festival ?? undefined);
  const venue = festivalVenue(p.festival ?? undefined);

  return (
    <Link
      href={`/theatre/${p.slug}`}
      className="theatre-prod-card"
      style={{
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderRadius: "12px",
        border: "1px solid rgba(36,17,35,0.12)",
        backgroundColor: "rgba(36, 17, 35, 0.06)",
        textDecoration: "none",
      }}
    >
      {/* Poster or typographic fill */}
      <div
        style={{
          position: "relative",
          height: "176px",
          flexShrink: 0,
          overflow: "hidden",
        }}
      >
        {hasPoster ? (
          <>
            <Image
              src={p.posterUrl!}
              alt={p.title}
              fill
              className="object-cover object-top"
              style={{ transition: "transform 0.5s ease" }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(to top, rgba(36,17,35,0.65) 0%, transparent 50%)",
              }}
            />
          </>
        ) : (
          /* Typographic fill for no-poster productions */
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              padding: "1rem",
              background:
                "linear-gradient(135deg, rgba(108,0,175,0.18) 0%, rgba(36,17,35,0.4) 55%, rgba(36,17,35,0.7) 100%)",
            }}
          >
            {/* Season watermark */}
            <span
              aria-hidden
              style={{
                position: "absolute",
                right: "0.75rem",
                top: "0.5rem",
                fontFamily: "var(--font-anton), system-ui, sans-serif",
                fontSize: "4.5rem",
                color: "rgba(255,255,255,0.06)",
                lineHeight: 1,
                userSelect: "none",
              }}
            >
              {p.season}
            </span>
            <p
              style={{
                position: "relative",
                zIndex: 1,
                fontFamily: "var(--font-anton), system-ui, sans-serif",
                fontSize: "clamp(1rem, 3vw, 1.4rem)",
                textTransform: "uppercase",
                color: "rgba(242,242,242,0.85)",
                lineHeight: 1.15,
                margin: 0,
              }}
            >
              {p.title}
            </p>
          </div>
        )}
      </div>

      {/* Card body */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "0.35rem",
          padding: "0.85rem 1rem 0.9rem",
        }}
      >
        {/* Meta row */}
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
              letterSpacing: "0.16em",
              color: "#241123",
              opacity: 0.4,
            }}
          >
            {p.year}{p.season ? ` · S${p.season}` : ""}
          </span>
          <span
            style={{
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              fontSize: "0.58rem",
              fontWeight: 600,
              color: "#241123",
              opacity: 0.35,
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
            fontSize: "0.9rem",
            fontWeight: 700,
            color: "#241123",
            opacity: 0.85,
            lineHeight: 1.3,
            margin: 0,
          }}
        >
          {p.title}
        </h3>

        {/* Festival context */}
        {short && (
          <p
            style={{
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              fontSize: "0.6rem",
              color: "#241123",
              opacity: 0.38,
              margin: 0,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 1,
              WebkitBoxOrient: "vertical",
            } as React.CSSProperties}
          >
            {short}
          </p>
        )}

        {/* Venue tag */}
        {venue && (
          <p
            style={{
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              fontSize: "0.57rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "#6C00AF",
              opacity: 0.55,
              margin: "auto 0 0",
              paddingTop: "0.5rem",
            }}
          >
            {venue}
          </p>
        )}
      </div>
    </Link>
  );
}
