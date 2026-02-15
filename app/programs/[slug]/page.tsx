// app/programs/[slug]/page.tsx
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { programMap } from "@/lib/programMap";
import { loadVisibleAlumni } from "@/lib/loadAlumni";
import type { AlumniRow } from "@/lib/types";
import MiniProfileCard from "@/components/profile/MiniProfileCard";
import SeasonsCarouselAlt from "@/components/alumni/SeasonsCarouselAlt"; // ← added

export const revalidate = 3600;

// --------- SSG all program slugs ----------
export function generateStaticParams() {
  return Object.keys(programMap).map((slug) => ({ slug }));
}

// ---------- helpers ----------
function familyLabel(program?: string, location?: string) {
  const parts = [program, location].filter(Boolean);
  return parts.join(": ");
}
function extractYearNumber(y?: string | number) {
  if (typeof y === "number" && Number.isFinite(y)) return y;
  const m = String(y || "").match(/\b(20\d{2}|19\d{2})\b/);
  return m ? Number(m[1]) : -Infinity;
}
type ProgramEntry = (typeof programMap)[string] & { slug: string };

// Group by Program → Location → Years
function groupByProgramLocation() {
  const entries: ProgramEntry[] = Object.entries(programMap).map(([slug, data]) => ({
    ...data,
    slug,
  }));

  const byProgram = new Map<
    string,
    { program: string; locations: Map<string, ProgramEntry[]> }
  >();

  for (const e of entries) {
    const progKey = e.program || "Other";
    const locKey = e.location || "Unknown";
    const progBucket =
      byProgram.get(progKey) || { program: progKey, locations: new Map() };
    const locBucket = progBucket.locations.get(locKey) || [];
    locBucket.push(e);
    progBucket.locations.set(locKey, locBucket);
    byProgram.set(progKey, progBucket);
  }

  // Sort programs alpha, locations alpha, entries by year desc
  const programs = Array.from(byProgram.values()).sort((a, b) =>
    a.program.localeCompare(b.program)
  );
  for (const p of programs) {
    for (const [loc, list] of p.locations) {
      p.locations.set(
        loc,
        list
          .slice()
          .sort((a, b) => extractYearNumber(b.year) - extractYearNumber(a.year))
      );
    }
  }
  return programs;
}

// auto-open helpers
function listHasSlug(list: ProgramEntry[], slug: string) {
  return list.some((x) => x.slug === slug);
}
function programHasSlug(pg: { locations: Map<string, ProgramEntry[]> }, slug: string) {
  for (const [, list] of pg.locations) if (listHasSlug(list, slug)) return true;
  return false;
}

// Safe link helper (mirrors Season page behavior)
// NOTE: prefetch={false} to mitigate stale-chunk prefetches in dev
function renderMaybeLink(href: string | undefined, label: string, className?: string) {
  if (!href) return <span className={className}>{label}</span>;
  const isInternal = href.startsWith("/");
  return isInternal ? (
    <Link href={href} prefetch={false} className={className}>
      {label}
    </Link>
  ) : (
    <a href={href} className={className} target="_blank" rel="noopener noreferrer">
      {label}
    </a>
  );
}

// ---------- Metadata ----------
export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const { slug } = params;
  const p = programMap[slug];

  if (!p) {
    return {
      title: "Program Not Found — Dramatic Adventure Theatre",
      description: "This program could not be found.",
      alternates: { canonical: `/programs/${slug}` },
    };
  }

  const fam = familyLabel(p.program, p.location);
  const description = `${fam}${p.year ? ` — ${p.year}` : ""}`;

  return {
    title: `${fam}${p.year ? ` ${p.year}` : ""} — DAT Programs`,
    description,
    alternates: { canonical: `/programs/${slug}` },
    openGraph: {
      title: `${fam}${p.year ? ` ${p.year}` : ""} — DAT Programs`,
      description,
      url: `/programs/${slug}`,
      type: "article",
    },
    twitter: {
      card: "summary",
      title: `${fam}${p.year ? ` ${p.year}` : ""} — DAT Programs`,
      description,
    },
  };
}

// ---------- page ----------
export default async function ProgramPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const p = programMap[slug];
  if (!p) return notFound();

  // Participating artists
  const alumni: AlumniRow[] = await loadVisibleAlumni();
  const alumniMap = new Map(alumni.map((a) => [a.slug, a]));

  const artistSlugs = Object.keys(p.artists || {}).sort();
  const people = artistSlugs
    .map((s) => {
      const alum = alumniMap.get(s);
      if (!alum) return null;
      const roles = p.artists?.[s]?.join(", ") ?? "";
      return { alum, roles };
    })
    .filter(Boolean) as { alum: AlumniRow; roles: string }[];

  const fam = familyLabel(p.program, p.location);
  const programGroups = groupByProgramLocation();

  return (
    <div>
      {/* HERO */}
      <div
        style={{
          position: "relative",
          height: "55vh",
          overflow: "hidden",
          zIndex: 0,
          boxShadow: "0 0 33px rgba(0, 0, 0, 0.5)",
        }}
      >
        <Image
          src="/images/alumni-hero.jpg"
          alt={`${fam} Hero`}
          fill
          priority
          className="object-cover object-center"
        />
        <div style={{ position: "absolute", bottom: "1rem", right: "5%" }}>
          {/* Fixed title & subtitle (your copy kept) */}
          <h1
            style={{
              fontFamily: "var(--font-anton), system-ui, sans-serif",
              fontSize: "clamp(4rem, 9vw, 8rem)",
              color: "#f2f2f2",
              textTransform: "uppercase",
              textShadow: "0 8px 20px rgba(0,0,0,0.8)",
              margin: 0,
              lineHeight: "1",
              textAlign: "right",
            }}
          >
            TEAM DAT
          </h1>
          <p
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "1.5rem",
              color: "#f2f2f2",
              opacity: 0.7,
              margin: 0,
              marginTop: "0rem",
              textShadow: "0 4px 9px rgba(0,0,0,0.9)",
              textAlign: "right",
            }}
          >
            Recognizing our talented teams of travelling artists.
          </p>
        </div>
      </div>

      {/* MAIN */}
      <main
        style={{
          marginTop: "-5rem",
          padding: "8rem 0 2rem",
          position: "relative",
          opacity: 0.9,
          zIndex: 10,
        }}
      >
        <div style={{ width: "90%", margin: "0 auto" }}>
          {/* Linked header pill (your pill styles preserved) */}
          <h3
            style={{
              fontFamily: "var(--font-anton), system-ui, sans-serif",
              fontSize: "2.4rem",
              margin: "3.5rem 0 1.1rem",
              textTransform: "uppercase",
              letterSpacing: "0.2rem",
              color: "#241123",
              backgroundColor: "#FFCC00",
              opacity: 0.6,
              padding: "0.1em 0.5em",
              borderRadius: "0.3em",
              display: "inline-block",
            }}
          >
            {renderMaybeLink(
              p.url,
              `${fam}${p.year ? ` ${p.year}` : ""}`,
              "program-link"
            )}
          </h3>

          {/* PARTICIPATING ARTISTS */}
          <div
            style={{
              background: "rgba(36, 17, 35, 0.2)",
              borderRadius: "8px",
              padding: "2rem",
              boxSizing: "border-box",
            }}
          >
            {people.length ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                  gap: "1rem",
                  justifyItems: "center",
                }}
              >
                {people.map(({ alum, roles }) => (
                  <MiniProfileCard
                    key={alum.slug}
                    // ✅ IMPORTANT: lets MiniProfileCard self-hydrate selected/current headshot
                    alumniId={alum.slug}
                    name={alum.name}
                    role={roles || alum.role}
                    slug={alum.slug}
                    // keep this as fallback only
                    headshotUrl={alum.headshotUrl}
                    // ✅ Cache-bust when available (safe no-op if missing)
                    cacheKey={(alum as any)?.headshotCacheKey}
                  />
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No visible alumni listed for this program.</p>
            )}
          </div>
          <br />
          {/* EXPLORE PROGRAMS: Program → (inside card) Location → Years */}
          <section style={{ marginTop: "2.5rem", marginBottom: "5rem" }}>
            <h3
              style={{
                fontFamily: "var(--font-anton), system-ui, sans-serif",
                fontSize: "2.4rem",
                margin: "0 0 1rem",
                textTransform: "uppercase",
                letterSpacing: "0.2rem",
                color: "#241123",
                backgroundColor: "#FFCC00",
                opacity: 0.6,
                padding: "0.1em 0.5em",
                borderRadius: "0.3em",
                display: "inline-block",
              }}
            >
              Explore Program Teams
            </h3>

            {/* Shaded wrapper (everything fits inside) */}
            <div
              style={{
                background: "rgba(36, 17, 35, 0.2)",
                borderRadius: "8px",
                padding: "2rem",
                marginBottom: "4rem",
                boxSizing: "border-box",
              }}
            >
              {/* Grid: 1 col mobile → 3 cols desktop */}
              <div className="program-grid">
                {programGroups.map((pg, i) => {
                  const openProgram = programHasSlug(pg, slug);
                  const pgId = `pg-${i}`;

                  return (
                    <div className="program-card" key={pg.program}>
                      {/* PROGRAM: checkbox + label = button (allows open/close) */}
                      <input
                        type="checkbox"
                        id={pgId}
                        className="acc-radio"
                        defaultChecked={openProgram}
                        aria-controls={`${pgId}-panel`}
                      />
                      <label
                        htmlFor={pgId}
                        className={`program-btn ${openProgram ? "active" : ""}`}
                        aria-expanded={openProgram}
                      >
                        <span className="program-title">{pg.program}</span>
                      </label>

                      {/* Panel shown only when this checkbox is checked */}
                      <div className="program-panel" id={`${pgId}-panel`}>
                        {Array.from(pg.locations.entries())
                          .sort(([a], [b]) => a.localeCompare(b))
                          .map(([loc, list], j) => {
                            const openLocation = listHasSlug(list, slug);
                            const locId = `loc-${i}-${j}`;
                            return (
                              <div className="location-block" key={loc}>
                                {/* LOCATION: checkbox + label (open/close), exclusive within program via script */}
                                <input
                                  type="checkbox"
                                  id={locId}
                                  className="loc-radio"
                                  defaultChecked={openLocation}
                                  aria-controls={`${locId}-panel`}
                                />
                                <label
                                  htmlFor={locId}
                                  className={`location-btn ${openLocation ? "active" : ""}`}
                                  aria-expanded={openLocation}
                                >
                                  <span className="location-title">{loc}</span>
                                </label>

                                <div className="loc-panel" id={`${locId}-panel`}>
                                  <div className="years-row">
                                    {list.map((child) => {
                                      const isCurrent = child.slug === slug;
                                      return (
                                        <Link
                                          key={child.slug}
                                          href={`/programs/${child.slug}`}
                                          prefetch={false}
                                          aria-current={isCurrent ? "page" : undefined}
                                          className={`year-chip ${isCurrent ? "current" : ""}`}
                                        >
                                          {String(child.year || "Year")}
                                        </Link>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>

        {/* SEASONS NAV */}
        <section
          style={{
            width: "100vw",
            backgroundColor: "#6C00AF",
            boxShadow: "0px 0px 33px rgba(0.8,0.8,0.8,0.8)",
            padding: "4rem 0",
            marginTop: "4rem",
          }}
        >
          <SeasonsCarouselAlt />
        </section>
      </main>

      {/* CLIENT-SIDE: enforce one open Program globally, one open Location per Program */}
      <Script id="accordion-behavior" strategy="afterInteractive">{`
        (function () {
          function setupProgramExclusivity() {
            var programs = Array.prototype.slice.call(document.querySelectorAll('.acc-radio'));
            programs.forEach(function (inp) {
              inp.addEventListener('change', function () {
                if (inp.checked) {
                  programs.forEach(function (other) {
                    if (other !== inp) other.checked = false;
                  });
                }
                // reflect expanded state for a11y
                var label = document.querySelector('label[for="' + inp.id + '"]');
                if (label) label.setAttribute('aria-expanded', String(inp.checked));
              });
            });
          }

          function setupLocationExclusivity() {
            var programCards = Array.prototype.slice.call(document.querySelectorAll('.program-card'));
            programCards.forEach(function (card) {
              var locs = Array.prototype.slice.call(card.querySelectorAll('.loc-radio'));
              locs.forEach(function (inp) {
                inp.addEventListener('change', function () {
                  if (inp.checked) {
                    locs.forEach(function (other) {
                      if (other !== inp) other.checked = false;
                    });
                  }
                  var label = card.querySelector('label[for="' + inp.id + '"]');
                  if (label) label.setAttribute('aria-expanded', String(inp.checked));
                });
              });
            });
          }

          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function () {
              setupProgramExclusivity();
              setupLocationExclusivity();
            });
          } else {
            setupProgramExclusivity();
            setupLocationExclusivity();
          }
        })();
      `}</Script>

      {/* STYLES */}
      <style>{`
        /* STRONG underline reset on all link states */
        a, a:link, a:visited, a:hover, a:active { text-decoration: none !important; }

        h3 { color: #FFCC00; }

        /* EXACT Seasons pill for the linked header text (your tweaks preserved) */
        .program-link {
          cursor: pointer; text-decoration: none !important;
          font-family: var(--font-anton), system-ui, sans-serif;
          font-size: 2.4rem;
          text-transform: uppercase;
          color: #241123;
          display: inline-block;
          margin: 0 0 0rem;
          letter-spacing: 0.2rem;
          background-color: #FFCC00;
          opacity: 0.98;
          padding: 0em 0em;
          border-radius: 0.3em;
          transition: color 0.3s ease, letter-spacing 0.3s ease;
        }
        .program-link:hover { color: #6C00AF !important; letter-spacing: 0.4rem; }
        /* Keep the pill text readable even when visited (override visited color) */
        .program-link:visited { color: #241123 !important; }

        /* ---------- Program cards grid (3 across on desktop) ---------- */
        .program-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }
        @media (min-width: 1024px) {
          .program-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }

        /* Hide inputs, keep them accessible */
        .acc-radio, .loc-radio {
          position: absolute;
          opacity: 0;
          pointer-events: none;
        }

        /* Program card shell */
        .program-card {
          border-radius: 12px;
          overflow: hidden;
        }

        /* PROGRAM button – your values preserved */
        .program-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 1rem 1rem;
          background: #241123;
          opacity: 0.6;
          border: 1px solid #241123;
          border-radius: 12px;
          cursor: pointer;
          user-select: none;
          transition: transform 120ms ease, background-color 120ms ease, border-color 120ms ease, box-shadow 120ms ease;
          position: relative;
        }
        /* PROGRAM toggle: + (closed) → − (open) */
        .program-btn::after {
          content: "+";
          font-size: 1.25rem;
          color: #FFCC00;
          opacity: 0.95;
          margin-left: .5rem;
          transition: transform 160ms ease;
        }
        .program-btn:hover {
          transform: translateY(-1px);
          background: #241123;
          opacity: 0.8;
          border-color: #241123;
          box-shadow: 0 6px 16px rgba(0,0,0,0.08);
        }
        /* Keep program in "hover" look when it contains the current page's year */
        .program-btn.active {
          transform: translateY(-1px);
          background: #241123;
          opacity: 0.9;
          border-color: #241123;
          box-shadow: 0 6px 16px rgba(0,0,0,0.08);
        }

        .program-title {
          font-family: var(--font-anton), system-ui, sans-serif;
          text-transform: uppercase;
          letter-spacing: 0.2rem;
          font-size: 1.6rem;                     /* bigger program titles */
          color: #f2f2f2;
        }

        /* PROGRAM panel (only visible when checkbox is checked) */
        .program-panel { display: none; padding: 0.8rem 0.2rem 0.2rem; }
        .acc-radio:checked + .program-btn { border-bottom-left-radius: 0; border-bottom-right-radius: 0; }
        .acc-radio:checked + .program-btn::after { content: "\\2212"; transform: translateY(1px); } /* − */
        .acc-radio:checked + .program-btn + .program-panel {
          display: block;
          background: rgba(255, 204, 0, 0.06);   /* subtle krafty base when open */
          border: 1px solid rgba(255, 204, 0, 0.18);
          border-top: 0;
          border-bottom-left-radius: 12px;
          border-bottom-right-radius: 12px;
          padding: 0.8rem;
        }

        /* LOCATION block inside program panel */
        .location-block { margin-bottom: 0.6rem; }

        /* LOCATION button – DAT Plum @ ~35% */
        .location-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 0.75rem 0.85rem;
          background: rgba(36, 17, 35, 0.3);
          border: 1px solid rgba(36, 17, 35, 0.35);
          border-radius: 10px;
          cursor: pointer;
          transition: transform 120ms ease, background-color 120ms ease, border-color 120ms ease, box-shadow 120ms ease;
          position: relative;
        }
        /* LOCATION toggle: + (closed) → − (open) */
        .location-btn::after {
          content: "+";
          font-size: 1.05rem;
          color: #ffcc00;
          opacity: 0.95;
          margin-left: .5rem;
          transition: transform 160ms ease;
        }
        .location-btn:hover {
          transform: translateY(-1px);
          background: rgba(36, 17, 35, 0.5);
          border-color: rgba(36, 17, 35, 0.5);
          box-shadow: 0 6px 16px rgba(0,0,0,0.08);
        }
        .location-title {
          font-family: var(--font-space-grotesk), system-ui, sans-serif;
          font-weight: 600;
          letter-spacing: 0.02rem;
          font-size: 1.05rem;
          color: #f2f2f2;
          opacity: 0.85;
        }

        /* Keep location in "hover" look when it contains the current page's year */
        .location-btn.active {
          transform: translateY(-1px);
          background: rgba(36, 17, 35, 0.9);
          border-color: rgba(36, 17, 35, 0.5);
          box-shadow: 0 6px 16px rgba(0,0,0,0.08);
        }
        .location-btn:hover .location-title,
        .location-btn.active .location-title {
          opacity: 1;
        }

        /* LOCATION panel (only visible when its checkbox is checked) */
        .loc-panel { display: none; }
        .loc-radio:checked + .location-btn { border-bottom-left-radius: 0; border-bottom-right-radius: 0; }
        .loc-radio:checked + .location-btn::after { content: "\\2212"; transform: translateY(1px); } /* − */
        .loc-radio:checked + .location-btn + .loc-panel {
          display: block;
          background: rgba(36, 17, 35, 0.06);
          border: 1px solid rgba(36, 17, 35, 0.22);
          border-top: 0;
          border-bottom-left-radius: 10px;
          border-bottom-right-radius: 10px;
          padding: 0.5rem 0.6rem 0.8rem;
        }

        /* Years row + chips */
        .years-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .year-chip {
          display: inline-block;
          padding: 0.38rem 0.62rem;
          border-radius: 8px;
          background-color: #6C00AF;  /* unvisited */
          opacity: 0.8;
          color: #FFCC00;
          font-family: var(--font-space-grotesk), system-ui, sans-serif;
          font-size: 1.05rem;
          border: 1.5px solid rgba(255, 204, 0, 0);
          transform: translateY(0);
          transition: transform 120ms ease, opacity 120ms ease, border-color 120ms ease, box-shadow 120ms ease;
        }
        .year-chip:hover {
          transform: translateY(-0.25px);
          background-color: #56008C; /* darker on hover */
          border-color: rgba(255, 204, 0, 0.45);
          box-shadow: 0 4px 14px rgba(0,0,0,0.08);
        }
        /* Visited — darker purple bg + gold text */
        .year-chip:visited {
          background-color: #56008C;
          color: #D9A919 !important;
          border-color: rgba(255, 204, 0, 0.25);
        }
        /* keep current chip readable even if visited */
        .year-chip.current {
          background-color: #44006E;
          opacity: 0.8;
          font-size: 1.05rem;
          color: #FFCC00 !important;
          border: 1.5px solid rgba(255, 204, 0, 0.8);
        }

        /* Keyboard focus */
        .program-btn:focus-visible, .location-btn:focus-visible {
          outline: 2px solid #FFCC00;
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}
