// app/theatre/page.tsx
import Link from "next/link";
import Image from "next/image";
import { productionMap, type Production, getSortYear } from "@/lib/productionMap";

const FALLBACK_POSTER = "/posters/fallback-16x9.jpg";
const CARD_BG = "#f2f2f2";

// Colour palette — no opacity games, everything is a solid value
const C = {
  ink:       "#241123",   // primary text
  inkMid:    "#4a2a56",   // secondary text (readable on kraft + #f2f2f2)
  inkLight:  "#6b3f7a",   // tertiary text
  gold:      "#FFCC00",
  purple:    "#530087",
  white:     "#f2f2f2",
  divider:   "rgba(36,17,35,0.30)",   // strong rule
  dividerSm: "rgba(36,17,35,0.20)",   // card border / light rule
} as const;

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

export default function TheatreIndexPage() {
  const allProductions = Object.values(productionMap).sort(sortProductions);

  const bySeason = new Map<number, Production[]>();
  for (const p of allProductions) {
    const s = p.season ?? 0;
    if (!bySeason.has(s)) bySeason.set(s, []);
    bySeason.get(s)!.push(p);
  }
  const seasonNums = Array.from(bySeason.keys()).sort((a, b) => b - a);

  const years = allProductions.map(getSortYear).filter(Boolean);
  const earliestYear = Math.min(...years);
  const latestYear = Math.max(...years);

  const uniqueArtists = new Set<string>();
  for (const p of allProductions) {
    for (const key of Object.keys(p.artists)) {
      if (!key.startsWith("[")) uniqueArtists.add(key);
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
          style={{ filter: "brightness(1.12) contrast(1.06) saturate(1.08)" }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, rgba(36,17,35,0.85) 0%, rgba(36,17,35,0.3) 42%, transparent 70%)",
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
              opacity: 0.7,
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
              { n: String(seasonNums.length),         label: "Seasons",        sub: `${earliestYear}–${latestYear}` },
              { n: String(allProductions.length),     label: "Productions",    sub: "original works & adaptations" },
              { n: String(uniqueArtists.size),        label: "Alumni Artists", sub: "directors, actors & designers" },
              { n: String(latestYear - earliestYear), label: "Years of Work",  sub: `${earliestYear} to ${latestYear}` },
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
                    color: C.ink,
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                    fontSize: "0.78rem",
                    fontWeight: 500,
                    color: C.inkMid,
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

      {/* ═══════════════════════════════════════════
          FEATURED PRODUCTION
      ═══════════════════════════════════════════ */}
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

            <div style={{ marginTop: "0.75rem" }}>
              <Link
                href={`/season/${featured.season}`}
                className="theatre-text-link"
                style={{
                  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                  fontSize: "0.7rem",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.16em",
                  color: C.ink,
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
          SEASON QUICK-NAV  — dark band, fully readable
      ═══════════════════════════════════════════ */}
      <div
        style={{
          backgroundColor: C.ink,
          borderTop: `2px solid rgba(36,17,35,0.9)`,
          borderBottom: `2px solid rgba(36,17,35,0.9)`,
          padding: "0.85rem 0",
        }}
      >
        <div style={{ width: "90vw", maxWidth: "1120px", margin: "0 auto", overflowX: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", whiteSpace: "nowrap" }}>
            <span
              style={{
                fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                fontSize: "0.72rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                color: "#9c7ab0",
                marginRight: "0.6rem",
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
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: C.white,
                  textDecoration: "none",
                  padding: "0.4em 0.9em",
                  borderRadius: "6px",
                  flexShrink: 0,
                  border: "1px solid rgba(255,255,255,0.15)",
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

          <div
            style={{
              marginBottom: "3rem",
              backgroundColor: "rgba(255,255,255,0.35)",
              borderRadius: "10px",
              padding: "1.1rem 1.4rem",
              display: "inline-block",
            }}
          >
            <p style={{ ...eyebrowOnKraft, margin: "0 0 0.4rem" }}>The Full Archive</p>
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
                      marginBottom: "1.5rem",
                      paddingBottom: "1.25rem",
                      borderBottom: `2.5px solid ${C.divider}`,
                    }}
                  >
                    {/* Row 1: ghost number */}
                    <span
                      aria-hidden
                      style={{
                        fontFamily: "var(--font-anton), system-ui, sans-serif",
                        fontSize: "clamp(4.5rem, 10vw, 7rem)",
                        color: "rgba(36,17,35,0.11)",
                        lineHeight: 0.85,
                        userSelect: "none",
                        display: "block",
                        marginBottom: "0.5rem",
                      }}
                    >
                      {sn}
                    </span>

                    {/* Row 2: full-width white scrim strip */}
                    <div
                      style={{
                        backgroundColor: "rgba(255,255,255,0.35)",
                        borderRadius: "10px",
                        padding: "0.7rem 1.1rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "1rem",
                        flexWrap: "wrap",
                      }}
                    >
                      {/* Left: season pill + year · location */}
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                        <span
                          style={{
                            fontFamily: "var(--font-anton), system-ui, sans-serif",
                            fontSize: "1.05rem",
                            textTransform: "uppercase",
                            letterSpacing: "0.18em",
                            color: C.ink,
                            backgroundColor: C.gold,
                            padding: "0.18em 0.65em",
                            borderRadius: "0.3em",
                            display: "inline-block",
                            flexShrink: 0,
                          }}
                        >
                          Season {sn}
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                            fontSize: "0.9rem",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            color: C.ink,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {year} · {locs}
                        </span>
                      </div>

                      {/* Right: full season link */}
                      <Link
                        href={`/season/${sn}`}
                        className="theatre-season-chapter-link"
                        style={{
                          textDecoration: "none",
                          fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                          fontSize: "0.8rem",
                          fontWeight: 800,
                          textTransform: "uppercase",
                          letterSpacing: "0.16em",
                          color: C.ink,
                          flexShrink: 0,
                        }}
                      >
                        Full Season ↗
                      </Link>
                    </div>
                  </div>

                  {/* Production cards */}
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

      {/* ═══════════════════════════════════════════
          PAGE STYLES
      ═══════════════════════════════════════════ */}
      <style>{`
        .theatre-featured-card {
          transition: box-shadow 0.28s ease, border-color 0.28s ease;
        }
        .theatre-featured-card:hover {
          box-shadow: 0 12px 48px rgba(36,17,35,0.24) !important;
          border-color: rgba(36,17,35,0.5) !important;
        }
        .theatre-poster-img {
          transition: transform 0.5s ease;
        }
        .theatre-featured-card:hover .theatre-poster-img {
          transform: scale(1.04);
        }
        .theatre-text-link { transition: color 0.18s ease; }
        .theatre-text-link:hover { color: #530087 !important; }

        .theatre-nav-pill {
          transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
        }
        .theatre-nav-pill:hover {
          background: rgba(255,255,255,0.12) !important;
          border-color: rgba(255,255,255,0.4) !important;
          color: #FFCC00 !important;
        }
        .theatre-season-chapter-link:hover span:last-child {
          color: #530087 !important;
        }
        .theatre-bottom-link {
          transition: box-shadow 0.2s ease, filter 0.2s ease;
        }
        .theatre-bottom-link:hover {
          box-shadow: 0 4px 16px rgba(36,73,169,0.3);
          filter: brightness(1.1);
        }
        .theatre-prod-card {
          box-shadow: 0 2px 10px rgba(36,17,35,0.15), 0 1px 3px rgba(36,17,35,0.1);
          transition: box-shadow 0.25s ease, transform 0.25s ease, border-color 0.25s ease;
        }
        .theatre-prod-card:hover {
          box-shadow: 0 8px 32px rgba(36,17,35,0.24), 0 2px 6px rgba(36,17,35,0.12);
          transform: translateY(-3px);
          border-color: rgba(36,17,35,0.35) !important;
        }
        .theatre-prod-card:hover .theatre-card-poster {
          transform: scale(1.05);
        }
        .theatre-card-poster {
          transition: transform 0.5s ease;
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

// Eyebrow on the dark stat box / hero (white text)
const eyebrowOnDark: React.CSSProperties = {
  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
  fontSize: "0.8rem",
  fontWeight: 700,
  letterSpacing: "0.24em",
  textTransform: "uppercase",
  color: "#FFCC00",
  margin: 0,
};

// Eyebrow directly on the kraft paper — max weight, max contrast
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
        border: `1px solid rgba(36,17,35,0.2)`,
        textDecoration: "none",
        backgroundColor: CARD_BG,
      }}
    >
      {/* Poster — solid dark bg, brightness-boosted image */}
      <div
        style={{
          position: "relative",
          height: "160px",
          flexShrink: 0,
          overflow: "hidden",
          backgroundColor: C.ink,
        }}
      >
        <Image
          src={posterSrc(p)}
          alt={shortTitle(p.title)}
          fill
          className="object-cover object-top theatre-card-poster"
          style={{ filter: "brightness(1.12) contrast(1.05) saturate(1.1)" }}
        />
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
              color: C.ink,
              backgroundColor: C.gold,
              padding: "0.2em 0.55em",
              borderRadius: "4px",
            }}
          >
            S{p.season}
          </span>
        )}
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
              color: C.ink,
            }}
          >
            {p.year}{p.season ? ` · S${p.season}` : ""}
          </span>
          <span
            style={{
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              fontSize: "0.68rem",
              fontWeight: 600,
              color: C.inkMid,
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
            color: C.ink,
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
              color: C.ink,
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
              color: C.inkMid,
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
