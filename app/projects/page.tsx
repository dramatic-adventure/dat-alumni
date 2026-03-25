// app/projects/page.tsx
// Project Archive — the full life of the company beyond productions:
// Creative Treks, ACTion programs, Teaching Artist Residencies, Travelogues,
// Company Retreats, festival presentations, workshop productions, and more.
//
// DATA: lib/seasonData.ts is the only data source. No productionMap is needed.
//
// TO ADD A NEW SEASON: add a new SeasonInfo entry to lib/seasonData.ts.
// Stats, jump nav, project counts, and era groupings all update automatically.
//
// TO ADD A NEW ERA: append a new EraConfig object to the ERAS array below
// and assign era images to public/images/projects/. That is the only manual
// step required when a new chapter of the company's history begins.

import Link from "next/link";
import Image from "next/image";
import { seasons as seasonData } from "@/lib/seasonData";
import { showcasesBySeason, type DatEvent } from "@/lib/events";
import { dramaClubs } from "@/lib/dramaClubMap";

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
// Mirrors the 8 eras in app/theatre/page.tsx exactly.
// src: null = no image yet — renders the "A New Era" dark-gradient placeholder.
// objectPosition: controls which part of the image is shown at 4:5 aspect ratio.
// filter: optional CSS filter for per-image tone correction.

interface EraConfig {
  id:             string;
  label:          string;
  seasons:        readonly number[];
  years:          string;
  geography:      string;
  src:            string | null;
  alt:            string;
  objectPosition: string;
  filter?:        string;
}

// ─── MANUAL MAINTENANCE POINT ─────────────────────────────────────────────────
// Add a new EraConfig here when a new era begins. See comment at top of file.
const ERAS: EraConfig[] = [
  {
    id:             "era-1",
    label:          "The Beginning",
    seasons:        [1, 2],
    years:          "2006–2008",
    geography:      "Zimbabwe · Ecuador · USA",
    src:            "/images/projects/archive/Creative-Trek-Zimbabwe.webp",
    alt:            "Creative Trek: Zimbabwe — DAT Season 1",
    objectPosition: "center",
  },
  {
    id:             "era-2",
    label:          "Hecho en Ecuador",
    seasons:        [3],
    years:          "2008–2009",
    geography:      "Ecuador · NYC",
    src:            "/images/projects/archive/creative-trek-ecuador-teatro-la-catanga.webp",
    alt:            "Creative Trek: Ecuador — Teatro La Catanga",
    objectPosition: "50% 20%",   // subject in upper portion of frame
  },
  {
    id:             "era-3",
    label:          "Finding the Form",
    seasons:        [4, 5, 6],
    years:          "2009–2012",
    geography:      "Ecuador · Slovakia · Washington D.C.",
    src:            "/images/projects/archive/teaching-artist-residency-esmeraldas.webp",
    alt:            "Teaching Artist Residency: Esmeraldas, Ecuador — Season 5",
    objectPosition: "center",
  },
  {
    id:             "era-4",
    label:          "The Story Deepens",
    seasons:        [7, 8],
    years:          "2012–2014",
    geography:      "Slovakia · Ecuador · NYC",
    src:            "/images/projects/archive/action-heart-of-europe-street-theatre.webp",
    alt:            "ACTion: Heart of Europe — Street Theatre, Slovakia",
    objectPosition: "50% 80%",   // crop top, focus lower half of frame
    filter:         "brightness(1.08) contrast(1.22) saturate(1.3)",  // sharpen dull tones
  },
  {
    id:             "era-5",
    label:          "The Wide World",
    seasons:        [9, 10],
    years:          "2014–2016",
    geography:      "Tanzania · Zanzibar · Slovakia · Ecuador",
    src:            "/images/projects/archive/ACTion-Tanzania-7-kids.webp",
    alt:            "ACTion: Tanzania — Season 10",
    objectPosition: "50% 60%",   // slightly lower than center
  },
  {
    id:             "era-6",
    label:          "Into the Margins",
    seasons:        [11, 12, 13, 14, 15],
    years:          "2016–2021",
    geography:      "Ecuador · Galápagos · Slovakia · USA",
    src:            "/images/projects/archive/teaching-artist-residency-slovakia-camp.webp",
    alt:            "Teaching Artist Residency: Slovakia — Season 12",
    objectPosition: "50% 60%",   // slightly lower than center
  },
  {
    id:             "era-7",
    label:          "The Present Tense",
    seasons:        [16, 17, 18, 19],
    years:          "2021–2025",
    geography:      "Ecuador · Slovakia · Hudson Valley",
    src:            "/images/projects/archive/travelogue-on-clubhouse-4-17-21.webp",
    alt:            "Travelogue on Clubhouse — Season 15/16",
    objectPosition: "50% 20%",   // subject in upper portion of frame
    filter:         "brightness(1.08) contrast(1.06) saturate(1.05)",
  },
  {
    id:             "era-8",
    label:          "A New Era",
    seasons:        [20],
    years:          "2025–present",
    geography:      "TBA",
    src:            null,   // image coming soon — placeholder rendered below
    alt:            "",
    objectPosition: "center",
  },
];

// ─── Countries logic ──────────────────────────────────────────────────────────
// An explicit map handles ambiguous or compound geography.
// "Heart of Europe" = Czechia + Slovakia (per company usage).
// Galápagos, Esmeraldas, and Moldava nad Bodvou resolve to their host countries.
// Domestic project locations (Berkshires, Baltimore, NYC, etc.) → United States.

const LOCATION_TO_COUNTRIES: Record<string, string[]> = {
  "Zimbabwe":                       ["Zimbabwe"],
  "Ecuador":                        ["Ecuador"],
  "Ecuador (refresh)":              ["Ecuador"],
  "Slovakia":                       ["Slovakia"],
  "Slovakia (refresh)":             ["Slovakia"],
  "Tanzania":                       ["Tanzania"],
  "Heart of Europe":                ["Czechia", "Slovakia"],
  "Esmeraldas, Ecuador":            ["Ecuador"],
  "Galápagos":                      ["Ecuador"],
  "Moldava nad Bodvou, Slovakia":   ["Slovakia"],
};

// Maps each country to its continent (for the Continents stat)
const COUNTRY_TO_CONTINENT: Record<string, string> = {
  "Zimbabwe":      "Africa",
  "Tanzania":      "Africa",
  "Ecuador":       "South America",
  "Slovakia":      "Europe",
  "Czechia":       "Europe",
  "United States": "North America",
};

// Project-string prefixes that carry geographic context
const GEO_PATTERNS: RegExp[] = [
  /^Creative Trek:\s*(.+)$/,
  /^ACTion:\s*(.+)$/,
  /^(?:Virtual )?Teaching Artist Residency:\s*(.+)$/,
];

// ─── Housekeeping entries ─────────────────────────────────────────────────────
// Real history, visually de-emphasized in the archive.
const HOUSEKEEPING_EXACT = new Set(["Covid-19 Hiatus", "Founding Year", "TBA"]);

function isHousekeeping(project: string): boolean {
  return HOUSEKEEPING_EXACT.has(project.trim());
}

// ─── Stats helpers ────────────────────────────────────────────────────────────

function extractAllCountries(allSeasons: typeof seasonData): Set<string> {
  const countries = new Set<string>();

  // USA: present if any domestic retreat, reading, or festival is in the data
  const hasDomestic = allSeasons.some((s) =>
    s.projects.some(
      (p) =>
        p.includes("Retreat:") ||
        p.includes("Kennedy Center") ||
        p.includes("IATI") ||
        p.includes("Towson") ||
        p.includes("Anniversary Party")
    )
  );
  if (hasDomestic) countries.add("United States");

  for (const season of allSeasons) {
    for (const proj of season.projects) {
      for (const pattern of GEO_PATTERNS) {
        const match = proj.match(pattern);
        if (match) {
          const loc = match[1].trim();
          const mapped = LOCATION_TO_COUNTRIES[loc];
          if (mapped) mapped.forEach((c) => countries.add(c));
          break;
        }
      }
    }
  }

  return countries;
}

// Derives the set of continents represented across all season field work
function extractAllContinents(allSeasons: typeof seasonData): Set<string> {
  const countries = extractAllCountries(allSeasons);
  const continents = new Set<string>();
  for (const country of countries) {
    const continent = COUNTRY_TO_CONTINENT[country];
    if (continent) continents.add(continent);
  }
  return continents;
}

// All season numbers from seasonData, newest → oldest
function allSeasonNums(): number[] {
  return seasonData
    .map((s) => parseInt(s.slug.replace("season-", ""), 10))
    .filter((n) => !isNaN(n))
    .sort((a, b) => b - a);
}

// ─── Shared text styles ────────────────────────────────────────────────────────
const eyebrowOnDark: React.CSSProperties = {
  fontFamily:    "var(--font-dm-sans), system-ui, sans-serif",
  fontSize:      "0.95rem",
  fontWeight:    900,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color:         "#FFCC00",
  margin:        0,
};

const eyebrowOnKraft: React.CSSProperties = {
  fontFamily:    "var(--font-dm-sans), system-ui, sans-serif",
  fontSize:      "0.95rem",
  fontWeight:    900,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color:         "#241123",
  margin:        "0 0 1.1rem",
};

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function ProjectsIndexPage() {

  // ── Stats (all derived dynamically from seasonData) ──
  const totalSeasons    = seasonData.length;
  const totalProjects   = seasonData.reduce(
    (sum, s) => sum + s.projects.filter((p) => !isHousekeeping(p)).length,
    0
  );
  const allCountries    = extractAllCountries(seasonData);
  const allContinents   = extractAllContinents(seasonData);
  const jumpSeasons     = allSeasonNums();

  // Community showcases grouped by season — auto-derived from events data
  const showcaseMap = showcasesBySeason();

  return (
    <div style={{ minHeight: "100vh", background: "transparent" }}>

      {/* ════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════ */}
      <section
        style={{
          position:   "relative",
          width:      "100%",
          height:     "75vh",
          boxShadow:  "0px 0px 40px rgba(36, 17, 35, 0.5)",
          overflow:   "hidden",
        }}
      >
        <Image
          src="/images/projects/archive/ACTion-Tanzania-3-hike.webp"
          alt="ACTion: Tanzania — company hiking in the field"
          fill
          priority
          className="object-cover object-center"
          style={{ filter: "brightness(0.95) contrast(1.08) saturate(1.08)" }}
        />
        {/* Bottom-up gradient */}
        <div
          style={{
            position:   "absolute",
            inset:      0,
            background: "linear-gradient(to top, rgba(36,17,35,0.88) 0%, rgba(36,17,35,0.28) 45%, transparent 70%)",
          }}
        />
        {/* Radial vignette on right side */}
        <div
          style={{
            position:      "absolute",
            inset:         0,
            background:    "radial-gradient(ellipse 90% 80% at 85% 80%, rgba(36,17,35,0.45) 0%, rgba(36,17,35,0.1) 45%, transparent 72%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position:  "absolute",
            bottom:    "4vw",
            right:     "5%",
            maxWidth:  "90vw",
            textAlign: "right",
          }}
        >
          <p style={{ ...eyebrowOnDark, marginBottom: "0.5rem" }}>
            Dramatic Adventure Theatre
          </p>
          <h1
            style={{
              fontFamily:    "var(--font-anton), system-ui, sans-serif",
              fontSize:      "clamp(3.4rem, 10vw, 7.5rem)",
              textTransform: "uppercase",
              color:         C.white,
              lineHeight:    1.0,
              textShadow:    "0 8px 24px rgba(0,0,0,0.8)",
              margin:        0,
            }}
          >
            Project
            <br />
            <span style={{ color: C.gold }}>Archive</span>
          </h1>
          <p
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize:   "clamp(1rem, 2vw, 1.45rem)",
              color:      C.white,
              opacity:    0.75,
              margin:     "0.6rem 0 0",
              fontWeight: 400,
              textShadow: "0 3px 10px rgba(0,0,0,0.9)",
            }}
          >
            Treks. Residencies. Travelogues.{" "}
            <em style={{ fontStyle: "italic" }}>The full journey.</em>
          </p>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          STATS
      ════════════════════════════════════════════ */}
      <section style={{ padding: "3.5rem 0 3rem" }}>
        <div style={{ width: "90vw", maxWidth: "1120px", margin: "0 auto" }}>
          <p style={eyebrowOnKraft}>The journey, by the numbers</p>
          <div
            style={{
              display:         "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              backgroundColor: "rgba(36, 17, 35, 0.16)",
              borderRadius:    "18px",
              border:          `1px solid rgba(36,17,35,0.22)`,
              overflow:        "hidden",
              boxShadow:       "0 4px 24px rgba(36, 17, 35, 0.18)",
            }}
          >
            {[
              {
                n:     String(totalSeasons),
                label: "Seasons",
                sub:   "2006–present",
              },
              {
                n:     String(totalProjects),
                label: "Projects",
                sub:   "treks, residencies & more",
              },
              {
                n:     String(allCountries.size),
                label: "Countries",
                sub:   "across four continents",
              },
              {
                n:     String(allContinents.size),
                label: "Continents",
                sub:   "Africa · Europe · the Americas",
              },
            ].map(({ n, label, sub }, i, arr) => (
              <div
                key={label}
                style={{
                  padding:     "1.75rem 2rem",
                  borderRight: i < arr.length - 1 ? `1px solid rgba(36,17,35,0.12)` : "none",
                  textAlign:   "center",
                }}
              >
                <div
                  style={{
                    fontFamily:    "var(--font-anton), system-ui, sans-serif",
                    fontSize:      "clamp(2.8rem, 6vw, 4rem)",
                    color:         C.gold,
                    lineHeight:    1,
                    marginBottom:  "0.35rem",
                  }}
                >
                  {n}
                </div>
                <div
                  style={{
                    fontFamily:    "var(--font-space-grotesk), system-ui, sans-serif",
                    fontSize:      "0.95rem",
                    fontWeight:    700,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color:         C.white,
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                    fontSize:   "0.78rem",
                    fontWeight: 500,
                    color:      "rgba(242,242,242,0.62)",
                    marginTop:  "0.25rem",
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
          ARCHIVE — intro block + jump nav + era sections
      ════════════════════════════════════════════ */}
      <section style={{ padding: "4rem 0 5rem" }}>
        <div style={{ width: "90vw", maxWidth: "1120px", margin: "0 auto" }}>

          {/* ── Archive intro block ── */}
          <div
            style={{
              marginBottom:    "4rem",
              backgroundColor: "rgba(255,255,255,0.35)",
              borderRadius:    "14px",
              padding:         "2rem 2rem 1.5rem",
            }}
          >
            {/* Heading row */}
            <div style={{ marginBottom: "1.5rem" }}>
              <p style={{ ...eyebrowOnKraft, margin: "0 0 0.3rem" }}>The Full Archive</p>
              <h2
                style={{
                  fontFamily:    "var(--font-anton), system-ui, sans-serif",
                  fontSize:      "clamp(2.2rem, 5vw, 3.6rem)",
                  textTransform: "uppercase",
                  color:         C.ink,
                  margin:        0,
                  lineHeight:    1.0,
                }}
              >
                All Projects
              </h2>
            </div>

            {/* Mission statement */}
            <p
              style={{
                fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                fontSize:   "clamp(0.92rem, 1.6vw, 1.05rem)",
                fontWeight: 500,
                color:      C.ink,
                lineHeight: 1.75,
                margin:     "0 0 1.25rem",
                opacity:    0.88,
              }}
            >
              Over twenty seasons, DAT has worked with thousands of young people, collaborated
              with hundreds of artists, and partnered with dozens of communities across multiple
              continents. This is the full journey — every trek, residency, festival, workshop,
              and retreat that made the work possible.
            </p>

            {/* Mission pillars */}
            <div
              style={{
                display:             "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
                gap:                 "0.65rem 2.5rem",
                marginBottom:        "1.75rem",
              }}
            >
              {[
                "Adventure as pedagogy",
                "Partnership across borders",
                "Art born in the field",
                "Community, season after season",
              ].map((line) => (
                <div
                  key={line}
                  style={{
                    fontFamily:  "var(--font-dm-sans), system-ui, sans-serif",
                    fontSize:    "0.88rem",
                    fontWeight:  700,
                    color:       C.ink,
                    borderLeft:  `3px solid ${C.gold}`,
                    paddingLeft: "0.75em",
                    lineHeight:  1.4,
                  }}
                >
                  {line}
                </div>
              ))}
            </div>

            {/* Divider */}
            <div
              style={{
                height:          "1.5px",
                backgroundColor: "rgba(36,17,35,0.15)",
                marginBottom:    "1.1rem",
              }}
            />

            {/* Jump nav — all seasons from seasonData, always current */}
            <div
              style={{
                display:    "flex",
                alignItems: "center",
                gap:        "0.5rem",
                flexWrap:   "wrap",
              }}
            >
              <span
                style={{
                  fontFamily:    "var(--font-dm-sans), system-ui, sans-serif",
                  fontSize:      "0.72rem",
                  fontWeight:    700,
                  textTransform: "uppercase",
                  letterSpacing: "0.2em",
                  color:         C.inkMid,
                  marginRight:   "0.3rem",
                  flexShrink:    0,
                }}
              >
                Jump to
              </span>
              {jumpSeasons.map((sn) => (
                <a
                  key={sn}
                  href={`#season-${sn}`}
                  className="project-nav-pill"
                  style={{
                    fontFamily:    "var(--font-dm-sans), system-ui, sans-serif",
                    fontSize:      "0.7rem",
                    fontWeight:    700,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color:         C.ink,
                    textDecoration:"none",
                    padding:       "0.35em 0.75em",
                    borderRadius:  "6px",
                    flexShrink:    0,
                    border:        `1.5px solid rgba(36,17,35,0.28)`,
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
              // Only render eras that have seasons present in seasonData
              const eraSeasonNums = era.seasons.filter((sn) =>
                seasonData.some((s) => s.slug === `season-${sn}`)
              );
              if (eraSeasonNums.length === 0) return null;

              return (
                <div key={era.id} id={era.id}>

                  {/* Era timeline separator (skip for first era) */}
                  {eraIdx > 0 && (
                    <div
                      style={{
                        display:    "flex",
                        alignItems: "center",
                        gap:        "1.25rem",
                        padding:    "3.5rem 0 3rem",
                      }}
                    >
                      <div style={{ flex: 1, height: "1.5px", background: C.divider }} />
                      <div
                        style={{
                          padding:         "0.4em 1.4em",
                          borderRadius:    "999px",
                          backgroundColor: "rgba(36,17,35,0.13)",
                          border:          `1px solid rgba(36,17,35,0.32)`,
                          flexShrink:      0,
                        }}
                      >
                        <span
                          style={{
                            fontFamily:    "var(--font-dm-sans), system-ui, sans-serif",
                            fontSize:      "0.72rem",
                            fontWeight:    900,
                            textTransform: "uppercase",
                            letterSpacing: "0.22em",
                            color:         C.ink,
                          }}
                        >
                          {era.years}
                        </span>
                      </div>
                      <div style={{ flex: 1, height: "1.5px", background: C.divider }} />
                    </div>
                  )}

                  {/* Two-column: sticky image left, seasons right */}
                  <div
                    className="project-era-grid"
                    style={{
                      display:             "grid",
                      gridTemplateColumns: "38% 1fr",
                      gap:                 "2.5rem",
                      alignItems:          "flex-start",
                    }}
                  >

                    {/* ── Left: era image panel ── */}
                    <div
                      className="project-era-image-panel"
                      style={{ position: "sticky", top: "5.5rem" }}
                    >
                      <div
                        style={{
                          position:     "relative",
                          borderRadius: "18px",
                          overflow:     "hidden",
                          aspectRatio:  "4 / 5",
                          boxShadow:    "0 12px 48px rgba(36,17,35,0.32), 0 2px 8px rgba(36,17,35,0.2)",
                          backgroundColor: C.ink,
                        }}
                      >
                        {era.src ? (
                          <Image
                            src={era.src}
                            alt={era.alt}
                            fill
                            className="project-era-photo"
                            style={{
                              objectFit:      "cover",
                              objectPosition: era.objectPosition,
                              ...(era.filter ? { filter: era.filter } : {}),
                            }}
                            sizes="(max-width: 860px) 90vw, 38vw"
                          />
                        ) : (
                          /* "A New Era" placeholder */
                          <div
                            style={{
                              position:       "absolute",
                              inset:          0,
                              display:        "flex",
                              flexDirection:  "column",
                              alignItems:     "center",
                              justifyContent: "center",
                              gap:            "1rem",
                              padding:        "2rem",
                              background:     `linear-gradient(145deg, #241123 0%, #3a1040 60%, #241123 100%)`,
                            }}
                          >
                            <span
                              style={{
                                fontFamily:  "var(--font-anton), system-ui, sans-serif",
                                fontSize:    "clamp(4rem, 12vw, 7rem)",
                                color:       "rgba(255,204,0,0.12)",
                                lineHeight:  1,
                                userSelect:  "none",
                              }}
                            >
                              {era.seasons[0]}
                            </span>
                            <div
                              style={{
                                width:           "40px",
                                height:          "2px",
                                backgroundColor: C.gold,
                                borderRadius:    "1px",
                              }}
                            />
                            <p
                              style={{
                                fontFamily:    "var(--font-anton), system-ui, sans-serif",
                                fontSize:      "clamp(1.2rem, 3vw, 1.6rem)",
                                textTransform: "uppercase",
                                color:         C.white,
                                textAlign:     "center",
                                lineHeight:    1.1,
                                margin:        0,
                                letterSpacing: "0.06em",
                              }}
                            >
                              {era.label}
                            </p>
                            <p
                              style={{
                                fontFamily:    "var(--font-dm-sans), system-ui, sans-serif",
                                fontSize:      "0.72rem",
                                fontWeight:    600,
                                textTransform: "uppercase",
                                letterSpacing: "0.2em",
                                color:         "rgba(255,204,0,0.7)",
                                textAlign:     "center",
                                margin:        0,
                              }}
                            >
                              Image coming soon
                            </p>
                          </div>
                        )}

                        {/* Gradient + caption (only when there's a real image) */}
                        {era.src && (
                          <>
                            <div
                              style={{
                                position:      "absolute",
                                inset:         0,
                                background:    "linear-gradient(to top, rgba(36,17,35,0.92) 0%, rgba(36,17,35,0.4) 38%, transparent 62%)",
                                pointerEvents: "none",
                              }}
                            />
                            <div
                              style={{
                                position: "absolute",
                                bottom:   "1.4rem",
                                left:     "1.4rem",
                                right:    "1.4rem",
                              }}
                            >
                              <p
                                style={{
                                  fontFamily:    "var(--font-anton), system-ui, sans-serif",
                                  fontSize:      "clamp(1.4rem, 2.8vw, 2rem)",
                                  textTransform: "uppercase",
                                  color:         C.white,
                                  margin:        "0 0 0.35rem",
                                  lineHeight:    1,
                                  textShadow:    "0 2px 10px rgba(0,0,0,0.7)",
                                }}
                              >
                                {era.label}
                              </p>
                              <p
                                style={{
                                  fontFamily:    "var(--font-dm-sans), system-ui, sans-serif",
                                  fontSize:      "0.72rem",
                                  fontWeight:    800,
                                  textTransform: "uppercase",
                                  letterSpacing: "0.16em",
                                  color:         C.gold,
                                  margin:        "0 0 0.2rem",
                                }}
                              >
                                Seasons {era.seasons[0]}
                                {era.seasons.length > 1
                                  ? `–${era.seasons[era.seasons.length - 1]}`
                                  : ""}
                                &ensp;·&ensp;{era.years}
                              </p>
                              <p
                                style={{
                                  fontFamily:  "var(--font-dm-sans), system-ui, sans-serif",
                                  fontSize:    "0.67rem",
                                  fontWeight:  500,
                                  color:       "rgba(242,242,242,0.72)",
                                  margin:      0,
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
                    <div
                      style={{
                        display:       "flex",
                        flexDirection: "column",
                        gap:           "2.75rem",
                      }}
                    >
                      {eraSeasonNums.map((sn) => {
                        const sdEntry = seasonData.find(
                          (s) => s.slug === `season-${sn}`
                        );
                        if (!sdEntry) return null;

                        return (
                          <div key={sn} id={`season-${sn}`}>

                            {/* Season header — matches Theatre Archive structure */}
                            <div
                              style={{
                                display:         "flex",
                                alignItems:      "stretch",
                                backgroundColor: "rgba(255,255,255,0.38)",
                                borderRadius:    "14px",
                                border:          "1px solid rgba(36,17,35,0.1)",
                                overflow:        "hidden",
                                marginBottom:    "1.1rem",
                              }}
                            >
                              {/* Season number badge */}
                              <div
                                aria-hidden
                                style={{
                                  backgroundColor: "rgba(36,17,35,0.07)",
                                  borderRight:     "1px solid rgba(36,17,35,0.1)",
                                  padding:         "0.6rem 1rem",
                                  display:         "flex",
                                  alignItems:      "center",
                                  justifyContent:  "center",
                                  flexShrink:      0,
                                  minWidth:        "4rem",
                                }}
                              >
                                <span
                                  style={{
                                    fontFamily: "var(--font-anton), system-ui, sans-serif",
                                    fontSize:   "clamp(2.5rem, 5vw, 4rem)",
                                    color:      "rgba(36,17,35,0.22)",
                                    lineHeight: 1,
                                    userSelect: "none",
                                  }}
                                >
                                  {sn}
                                </span>
                              </div>

                              {/* Season title + year + "Full Season" link */}
                              <div
                                style={{
                                  flex:           1,
                                  padding:        "0.75rem 1.25rem",
                                  display:        "flex",
                                  alignItems:     "flex-start",
                                  justifyContent: "space-between",
                                  gap:            "1rem",
                                  flexWrap:       "wrap",
                                }}
                              >
                                <div
                                  style={{
                                    display:       "flex",
                                    flexDirection: "column",
                                    gap:           "0.3rem",
                                  }}
                                >
                                  <Link
                                    href={`/season/${sn}`}
                                    className="project-season-pill-link"
                                    style={{
                                      textDecoration: "none",
                                      fontFamily:     "var(--font-anton), system-ui, sans-serif",
                                      fontSize:       "1.3rem",
                                      textTransform:  "uppercase",
                                      letterSpacing:  "0.2em",
                                      color:          C.ink,
                                      backgroundColor: C.gold,
                                      padding:        "0.25em 0.85em",
                                      borderRadius:   "0.3em",
                                      display:        "inline-block",
                                      alignSelf:      "flex-start",
                                    }}
                                  >
                                    Season {sn}
                                  </Link>
                                  <span
                                    style={{
                                      fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                                      fontSize:   "0.95rem",
                                      fontWeight: 600,
                                      color:      C.ink,
                                      paddingLeft:"0.2em",
                                    }}
                                  >
                                    {sdEntry.years}
                                  </span>
                                </div>
                                <Link
                                  href={`/season/${sn}`}
                                  className="project-season-chapter-link"
                                  style={{
                                    textDecoration: "none",
                                    fontFamily:     "var(--font-dm-sans), system-ui, sans-serif",
                                    fontSize:       "0.78rem",
                                    fontWeight:     800,
                                    textTransform:  "uppercase",
                                    letterSpacing:  "0.16em",
                                    color:          C.ink,
                                    flexShrink:     0,
                                    alignSelf:      "flex-start",
                                    paddingTop:     "0.1rem",
                                  }}
                                >
                                  Full Season ↗
                                </Link>
                              </div>
                            </div>

                            {/* Project list — each entry a line in the journal */}
                            <ProjectList projects={sdEntry.projects} seasonNum={sn} />

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
        </div>
      </section>

      {/* ════════════════════════════════════════════
          BOTTOM CROSS-NAV
      ════════════════════════════════════════════ */}
      <section style={{ padding: "4rem 0 5rem" }}>
        <div
          style={{
            width:    "90vw",
            maxWidth: "1120px",
            margin:   "0 auto",
          }}
        >
          <p style={{ ...eyebrowOnKraft, marginBottom: "1.5rem" }}>
            Explore More
          </p>
          <div
            style={{
              display:  "flex",
              gap:      "1.25rem",
              flexWrap: "wrap",
            }}
          >
            <Link
              href="/theatre"
              className="project-bottom-link"
              style={{
                flex:           "1 1 260px",
                display:        "flex",
                flexDirection:  "column",
                justifyContent: "center",
                gap:            "0.4rem",
                padding:        "1.6rem 2rem",
                borderRadius:   "14px",
                border:         `1.5px solid ${C.divider}`,
                backgroundColor: "rgba(36,17,35,0.06)",
                textDecoration: "none",
                minHeight:      "110px",
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
                Theatre Archive →
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
                Every production, season by season
              </span>
            </Link>

            <Link
              href="/alumni"
              className="project-bottom-link"
              style={{
                flex:           "1 1 260px",
                display:        "flex",
                flexDirection:  "column",
                justifyContent: "center",
                gap:            "0.4rem",
                padding:        "1.6rem 2rem",
                borderRadius:   "14px",
                border:         `1.5px solid ${C.divider}`,
                backgroundColor: "rgba(36,17,35,0.06)",
                textDecoration: "none",
                minHeight:      "110px",
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
                Alumni Directory →
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
                The artists who made it happen
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          STYLES  (project- prefix throughout)
      ════════════════════════════════════════════ */}
      <style>{`
        /* ── Jump nav pills ── */
        .project-nav-pill {
          transition: background-color 0.18s ease, border-color 0.18s ease, color 0.18s ease;
        }
        .project-nav-pill:hover {
          background-color: #FFCC00 !important;
          border-color: rgba(36,17,35,0.4) !important;
          color: #241123 !important;
        }

        /* ── Season header links ── */
        .project-season-chapter-link {
          transition: color 0.2s ease, letter-spacing 0.22s ease;
        }
        .project-season-chapter-link:hover {
          color: #6C00AF !important;
          letter-spacing: 0.24em !important;
        }
        .project-season-pill-link {
          transition: letter-spacing 0.22s ease, opacity 0.22s ease;
        }
        .project-season-pill-link:hover {
          letter-spacing: 0.3em !important;
          opacity: 0.82;
        }
        .project-showcase-card {
          box-shadow: 0 2px 10px rgba(36,17,35,0.13), 0 1px 3px rgba(36,17,35,0.08);
          transition: box-shadow 0.25s ease, transform 0.25s ease, border-color 0.25s ease;
        }
        .project-showcase-card:hover {
          box-shadow: 0 8px 28px rgba(47,168,115,0.18), 0 2px 6px rgba(47,168,115,0.1);
          transform: translateY(-3px);
          border-color: rgba(47,168,115,0.5) !important;
        }
        .showcase-card-img {
          transition: transform 0.5s ease;
        }
        .project-showcase-card:hover .showcase-card-img {
          transform: scale(1.05);
        }

        /* ── Era photo ── */
        .project-era-photo {
          transition: transform 0.6s ease;
        }

        /* ── Project list entries ── */
        .project-entry-text:hover {
          color: #6C00AF !important;
        }
        .project-entry-line {
          position:    relative;
          padding:     0.55rem 0 0.55rem 1.05rem;
          border-bottom: 1px solid rgba(36,17,35,0.08);
          transition:  background-color 0.15s ease;
        }
        .project-entry-line:last-child {
          border-bottom: none;
        }
        /* Gold bookmark accent on the left edge */
        .project-entry-line::before {
          content:      '';
          position:     absolute;
          left:         0;
          top:          50%;
          transform:    translateY(-50%);
          width:        3px;
          height:       55%;
          background:   rgba(255,204,0,0.5);
          border-radius: 2px;
          transition:   height 0.2s ease, background 0.2s ease;
        }
        .project-entry-line:hover::before {
          height:     80%;
          background: rgba(255,204,0,0.85);
        }

        /* ── Housekeeping entries (Covid-19 Hiatus, Founding Year, TBA) ── */
        .project-housekeeping-line {
          font-style: italic;
          opacity:    0.42;
          padding:    0.35rem 0 0.35rem 1.05rem;
          position:   relative;
        }
        .project-housekeeping-line::before {
          content:    '';
          position:   absolute;
          left:       0;
          top:        50%;
          transform:  translateY(-50%);
          width:      2px;
          height:     40%;
          background: rgba(36,17,35,0.25);
          border-radius: 2px;
        }

        /* ── Bottom cross-nav ── */
        .project-bottom-link {
          transition: box-shadow 0.2s ease, filter 0.2s ease;
        }
        .project-bottom-link:hover {
          box-shadow: 0 4px 20px rgba(36,17,35,0.22);
          filter:     brightness(0.96);
        }

        /* ── Responsive ── */
        @media (max-width: 860px) {
          .project-era-grid {
            grid-template-columns: 1fr !important;
          }
          .project-era-image-panel {
            position: static !important;
          }
          .project-era-image-panel > div {
            aspect-ratio: 16 / 9 !important;
            max-height:   320px;
          }
        }
      `}</style>

    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROJECT LIST
// Renders a season's projects[] as an editorial typographic list.
// Housekeeping entries (Covid-19 Hiatus, Founding Year, TBA) are de-emphasised
// but preserved — they're real company history, just not featured projects.
// ═══════════════════════════════════════════════════════════════════════════════

// Badge config — mirrors theatre/page.tsx
const SUBCATEGORY_BADGE: Record<string, { label: string; color: string; border: string; bg: string }> = {
  "community-showcase": {
    label: "Community Showcase",
    color: "rgba(47,168,115,0.9)",
    border: "rgba(47,168,115,0.35)",
    bg:    "rgba(47,168,115,0.07)",
  },
  "commission": {
    label: "Commission",
    color: "rgba(36,147,169,0.9)",
    border: "rgba(36,147,169,0.35)",
    bg:    "rgba(36,147,169,0.07)",
  },
};

// ─── Community Showcase cards — shown under each season that has archived showcases ─
function ShowcaseArchiveRows({ showcases }: { showcases?: DatEvent[] }) {
  if (!showcases || showcases.length === 0) return null;

  return (
    <div style={{ marginTop: "1.25rem" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(185px, 1fr))",
          gap: "1rem",
        }}
      >
        {showcases.map((ev) => {
          const club   = dramaClubs.find((c) => c.slug === ev.dramaClub);
          const imgSrc = club?.heroImage ?? ev.image ?? "/images/Andean_Mask_Work.jpg";
          const href   = club ? `/drama-club/${club.slug}` : "/drama-club";
          const badge  = SUBCATEGORY_BADGE[ev.subcategory ?? "community-showcase"]
            ?? SUBCATEGORY_BADGE["community-showcase"];
          const d      = new Date(ev.date + "T12:00:00Z");
          const dateStr = d.toLocaleString("en-US", { month: "short", timeZone: "UTC" })
            + " " + d.getUTCDate() + ", " + d.getUTCFullYear();

          return (
            <Link
              key={ev.id}
              href={href}
              style={{
                display: "flex",
                flexDirection: "column",
                borderRadius: "12px",
                overflow: "hidden",
                border: `1.5px solid ${badge.border}`,
                textDecoration: "none",
                backgroundColor: "#f2f2f2",
              }}
              className="project-showcase-card"
            >
              {/* Image */}
              <div
                style={{
                  position: "relative",
                  height: "140px",
                  flexShrink: 0,
                  overflow: "hidden",
                  backgroundColor: "#241123",
                }}
              >
                <Image
                  src={imgSrc}
                  alt={club?.name ?? ev.title}
                  fill
                  className="object-cover object-center showcase-card-img"
                  sizes="(max-width: 860px) 50vw, 200px"
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(to top, rgba(36,17,35,0.55) 0%, transparent 55%)",
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    bottom: "0.5rem",
                    left: "0.6rem",
                    fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                    fontSize: "0.56rem",
                    fontWeight: 800,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "#fff",
                    background: badge.color,
                    borderRadius: "4px",
                    padding: "0.18rem 0.5rem",
                  }}
                >
                  {badge.label}
                </span>
              </div>

              {/* Info */}
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.25rem",
                  padding: "0.7rem 0.9rem 0.85rem",
                  borderTop: `1.5px solid ${badge.border}`,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                    fontSize: "0.64rem",
                    fontWeight: 700,
                    color: badge.color,
                    letterSpacing: "0.06em",
                  }}
                >
                  {dateStr}
                </span>
                <h4
                  style={{
                    fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                    fontSize: "0.9rem",
                    fontWeight: 700,
                    color: "#241123",
                    margin: 0,
                    lineHeight: 1.25,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  } as React.CSSProperties}
                >
                  {ev.title}
                </h4>
                <span
                  style={{
                    fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                    fontSize: "0.7rem",
                    color: "rgba(36,17,35,0.5)",
                  }}
                >
                  {ev.city}, {ev.country}
                </span>
                {club && (
                  <span
                    style={{
                      fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                      fontSize: "0.68rem",
                      fontWeight: 600,
                      color: badge.color,
                      marginTop: "0.1rem",
                    }}
                  >
                    {club.name} →
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function ProjectList({ projects, seasonNum }: { projects: string[]; seasonNum: number }) {
  const regular      = projects.filter((p) => !isHousekeeping(p));
  const housekeeping = projects.filter(isHousekeeping);

  if (regular.length === 0 && housekeeping.length === 0) return null;

  return (
    <div
      style={{
        backgroundColor: "rgba(255,255,255,0.22)",
        borderRadius:    "10px",
        padding:         "0.5rem 1.1rem 0.5rem 1.25rem",
        border:          "1px solid rgba(36,17,35,0.09)",
      }}
    >
      {regular.length > 0 && (
        <ul
          style={{
            margin:    0,
            padding:   0,
            listStyle: "none",
          }}
        >
          {regular.map((proj) => (
            <li key={proj} className="project-entry-line">
              <Link
                href={`/season/${seasonNum}#projects-section`}
                className="project-entry-text"
                style={{
                  fontFamily:     "var(--font-space-grotesk), system-ui, sans-serif",
                  fontSize:       "0.97rem",
                  fontWeight:     500,
                  color:          C.ink,
                  lineHeight:     1.55,
                  display:        "block",
                  textDecoration: "none",
                }}
              >
                {proj}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {housekeeping.length > 0 && (
        <div style={{ marginTop: regular.length > 0 ? "0.6rem" : 0 }}>
          {housekeeping.map((proj) => (
            <div key={proj} className="project-housekeeping-line">
              <span
                style={{
                  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                  fontSize:   "0.8rem",
                  fontWeight: 500,
                  color:      C.ink,
                  lineHeight: 1.5,
                }}
              >
                {proj}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
