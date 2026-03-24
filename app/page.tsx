// app/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";

import {
  COUNTRY_COUNT,
  CLUB_COUNT,
  SEASON_COUNT,
  ALUMNI_COUNT_DISPLAY,
} from "@/lib/datStats";
import { dramaClubs } from "@/lib/dramaClubMap";
import { productionMap, getSortYear } from "@/lib/productionMap";

/* ─── Types ─────────────────────────────────────────────────────────── */

type StoryCard = {
  Title: string;
  "Location Name": string;
  Country: string;
  Author: string;
  authorSlug: string;
  "Image URL": string;
  "Short Story": string;
  slug: string;
};

type LinkSpec = { href: string; label: string; tone: "pink" | "purple" | "green" | "yellow" };
type CardSpec = {
  tone: "pink" | "purple" | "green" | "yellow";
  title: string;
  desc: string;
  ctaHref: string;
  ctaLabel: string;
  links: LinkSpec[];
};

/* ─── Page ──────────────────────────────────────────────────────────── */

export default function Page() {
  const router = useRouter();

  /* ── Live stories ─────────────────────────────────── */
  const [stories, setStories] = useState<StoryCard[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stories")
      .then((r) => r.json())
      .then((data) => {
        if (data?.ok && Array.isArray(data.stories)) {
          setStories(data.stories.slice(0, 3));
        }
      })
      .catch(() => {})
      .finally(() => setStoriesLoading(false));
  }, []);

  /* ── Featured drama club (rotates daily) ─────────── */
  const featuredClub = useMemo(() => {
    const active = dramaClubs.filter(
      (c) =>
        (c.status === "ongoing" || c.status === "new") &&
        (c.heroImage || c.cardImage)
    );
    const pool = active.length > 0 ? active : dramaClubs;
    // deterministic daily rotation — avoids hydration mismatch (client-only)
    const dayIndex = Math.floor(Date.now() / 86_400_000);
    return pool[dayIndex % pool.length];
  }, []);

  /* ── Featured production (most recent by year) ────── */
  const featuredProduction = useMemo(() => {
    const prods = Object.values(productionMap).sort(
      (a, b) => getSortYear(b) - getSortYear(a)
    );
    return prods[0] ?? null;
  }, []);

  /* ── Community accordion data ─────────────────────── */
  const cards: CardSpec[] = useMemo(
    () => [
      {
        tone: "pink",
        title: "DAT ALUMNI",
        desc: "Spin the globe and explore artist stories on DAT's Story Map. Find and (re)connect with artists through the Alumni Directory. Sponsor an Artist to build community-rooted work abroad — then watch the impact multiply as those artists return home to inspire others, create new work, and ignite change in their own communities.",
        ctaHref: "/alumni",
        ctaLabel: "DAT ALUMNI",
        links: [
          { href: "/story-map", label: "Explore the Story Map", tone: "pink" },
          { href: "/directory", label: "Find an Artist", tone: "pink" },
          { href: "/donate?mode=artist&freq=monthly&artistFocus=all", label: "Sponsor an Artist", tone: "pink" },
        ],
      },
      {
        tone: "purple",
        title: "PARTNERS",
        desc: "Host DAT on your campus. Build a credit-bearing study abroad that lets students devise, teach, produce, and perform theatre that tackles real-world issues. Or launch a CSR initiative or 'Adventure Day' of creativity, cross-cultural exchange, and youth mentorship.",
        ctaHref: "/partners",
        ctaLabel: "PARTNERS",
        links: [
          { href: "/partners/universities", label: "Build a University Partnership", tone: "purple" },
          { href: "/partners/corporate-giving", label: "Launch a Corporate Partnership (CSR)", tone: "purple" },
          { href: "/partners/propose-project", label: "Propose a Project or Partnership", tone: "purple" },
        ],
      },
      {
        tone: "green",
        title: "DRAMA CLUBS",
        desc: "Start a club or explore the Drama Clubs and communities we already serve. Mentor young artists. Sponsor a Club with space, materials, and workshops so youth in under-resourced communities can develop their voices and share their stories.",
        ctaHref: "/drama-club",
        ctaLabel: "DRAMA CLUBS",
        links: [
          { href: "/drama-club", label: "Find a Club", tone: "green" },
          { href: "/drama-club", label: "Become a Mentor", tone: "green" },
          { href: "/donate?mode=drama-club&freq=monthly", label: "Sponsor a Club", tone: "green" },
        ],
      },
      {
        tone: "yellow",
        title: "FRIENDS OF DAT",
        desc: "Join our circle of supporters and changemakers. Volunteer behind the scenes. Friend-raise and advocate for DAT as an Ambassador in your city. Every gift — of time, funds, or passion — helps spark transformation, one story at a time.",
        ctaHref: "/alumni",
        ctaLabel: "FRIENDS OF DAT",
        links: [
          { href: "/partners/propose-project", label: "Volunteer with DAT", tone: "yellow" },
          { href: "/partners/propose-project", label: "Join as an Ambassador", tone: "yellow" },
          { href: "/donate", label: "Donate", tone: "yellow" },
        ],
      },
    ],
    []
  );

  /* ── Accordion state ──────────────────────────────── */
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [panelHeights, setPanelHeights] = useState<number[]>([]);
  const revealRefs = useRef<Array<HTMLDivElement | null>>([]);

  const setRevealRef = useCallback(
    (idx: number) => (el: HTMLDivElement | null) => {
      revealRefs.current[idx] = el;
    },
    []
  );

  const measureOpen = useCallback(() => {
    setPanelHeights(() => {
      const next = new Array(cards.length).fill(0);
      if (openIndex != null) {
        const node = revealRefs.current[openIndex];
        next[openIndex] = node ? node.scrollHeight : 0;
      }
      return next;
    });
  }, [cards.length, openIndex]);

  useEffect(() => {
    const handler = () => measureOpen();
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [measureOpen]);

  useEffect(() => {
    requestAnimationFrame(measureOpen);
  }, [openIndex, measureOpen]);

  /* ── Render ───────────────────────────────────────── */
  return (
    <main style={{ background: "transparent" }}>

      {/* ════════════════════════════════════════════════
          HERO — full-bleed image, let it breathe
      ════════════════════════════════════════════════ */}
      <div className="hp-hero">
        <Image
          src="/images/alumni-hero.jpg"
          alt="DAT artists performing in the field"
          fill
          priority
          style={{ objectFit: "cover", objectPosition: "center" }}
        />
        <div className="hp-hero-fade" aria-hidden="true" />
      </div>

      {/* ════════════════════════════════════════════════
          HEADLINE — big, gold, slightly faded
      ════════════════════════════════════════════════ */}
      <header className="hp-headline-area" aria-labelledby="landing-headline">
        <div className="hp-headline-wrap">
          <h1
            id="landing-headline"
            className="hp-headline-title"
            style={{
              fontFamily: '"Anton", sans-serif',
              fontSize: "14vw",
              color: "#d9a919",
              opacity: 0.55,
            }}
          >
            EVERY STORY STARTS SOMEWHERE.
          </h1>
          <p
            className="hp-headline-subtitle"
            style={{
              fontFamily: 'var(--font-space-grotesk), "Space Grotesk", system-ui, sans-serif',
              fontWeight: 500,
              color: "#241123",
              opacity: 0.9,
            }}
          >
            We develop artists, travel the world, and make theatre that matters.
          </p>
        </div>
      </header>

      {/* ════════════════════════════════════════════════
          CTA — three doors for three audiences
      ════════════════════════════════════════════════ */}
      <section className="hp-cta-section" aria-label="Who are you?">
        <div className="hp-cta-wrapper">

          {/* Artists */}
          <div className="hp-cta-block">
            <div className="hp-cta-box">
              <div className="hp-cta-content">
                <div className="hp-text-elements">
                  <div className="hp-cta-label">Artists</div>
                  <h3 className="hp-cta-h3">Take the Stage</h3>
                  <p className="hp-cta-p">
                    Join residencies, expeditions, and workshops that spark meaningful new work — onstage and beyond.
                  </p>
                </div>
                <button
                  className="hp-dat-btn"
                  onClick={() => router.push("/partners/universities")}
                >
                  Join the Adventure
                </button>
              </div>
            </div>
          </div>

          {/* Audiences */}
          <div className="hp-cta-block">
            <div className="hp-cta-box">
              <div className="hp-cta-content">
                <div className="hp-text-elements">
                  <div className="hp-cta-label">Audiences</div>
                  <h3 className="hp-cta-h3">Follow the Journey</h3>
                  <p className="hp-cta-p">
                    Explore a season of bold journeys, deep listening, unique collaborations, and daring creativity.
                  </p>
                </div>
                <button
                  className="hp-dat-btn"
                  onClick={() => router.push("/story-map")}
                >
                  Experience the Work
                </button>
              </div>
            </div>
          </div>

          {/* Supporters */}
          <div className="hp-cta-block hp-cta-block--supporters">
            <div className="hp-cta-box">
              <div className="hp-cta-content">
                <div className="hp-text-elements">
                  <div className="hp-cta-label">Supporters &amp; Funders</div>
                  <h3 className="hp-cta-h3">Make Magic Possible</h3>
                  <p className="hp-cta-p">
                    Support responsive, community-powered theatre — where story is needed most.
                  </p>
                </div>
                <button
                  className="hp-dat-btn"
                  onClick={() => router.push("/donate")}
                >
                  Sponsor the Story
                </button>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ════════════════════════════════════════════════
          STATS BAND — dark island, yellow numbers
      ════════════════════════════════════════════════ */}
      <section
        className="hp-stats-band"
        aria-label="DAT by the numbers"
        style={{ background: "#241123" }}
      >
        <div className="hp-stats-inner">

          <div className="hp-stat">
            <span className="hp-stat-number">{SEASON_COUNT}</span>
            <span className="hp-stat-label">Seasons</span>
          </div>

          <div className="hp-stat-sep" aria-hidden="true" />

          <div className="hp-stat">
            <span className="hp-stat-number">{COUNTRY_COUNT}</span>
            <span className="hp-stat-label">Countries</span>
          </div>

          <div className="hp-stat-sep" aria-hidden="true" />

          <div className="hp-stat">
            <span className="hp-stat-number">{CLUB_COUNT}</span>
            <span className="hp-stat-label">Drama Clubs</span>
          </div>

          <div className="hp-stat-sep" aria-hidden="true" />

          <div className="hp-stat">
            <span className="hp-stat-number">{ALUMNI_COUNT_DISPLAY}</span>
            <span className="hp-stat-label">Artists</span>
          </div>

        </div>
      </section>

      {/* ════════════════════════════════════════════════
          LIVE STORY STRIP — recent field dispatches
      ════════════════════════════════════════════════ */}
      <section
        className="hp-stories-section"
        aria-labelledby="hp-stories-heading"
        style={{ background: "#1a0d1a" }}
      >
        <div className="hp-stories-inner">

          <div className="hp-stories-header">
            <p id="hp-stories-heading" className="hp-eyebrow-label">
              FROM THE FIELD
            </p>
            <Link href="/story-map" className="hp-see-all-link">
              Explore all stories →
            </Link>
          </div>

          {/* Loading skeletons */}
          {storiesLoading && (
            <div className="hp-stories-grid">
              <div className="hp-skeleton-card" />
              <div className="hp-skeleton-card" />
              <div className="hp-skeleton-card" />
            </div>
          )}

          {/* Story cards */}
          {!storiesLoading && stories.length > 0 && (
            <div className="hp-stories-grid">
              {stories.map((s) => (
                <Link
                  key={s.slug}
                  href={`/story/${s.slug}`}
                  className="hp-story-card"
                >
                  <div className="hp-story-img-shell">
                    {s["Image URL"] ? (
                      <img
                        src={s["Image URL"]}
                        alt={s.Title}
                        className="hp-story-img"
                        loading="lazy"
                      />
                    ) : (
                      <div className="hp-story-img-placeholder" aria-hidden="true" />
                    )}
                  </div>
                  <div className="hp-story-body">
                    <p className="hp-story-location">
                      {[s["Location Name"], s.Country].filter(Boolean).join(" · ")}
                    </p>
                    <h3 className="hp-story-title">{s.Title}</h3>
                    {s.Author && (
                      <p className="hp-story-author">by {s.Author}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!storiesLoading && stories.length === 0 && (
            <p className="hp-stories-empty">
              Stories are live on the{" "}
              <Link href="/story-map" className="hp-inline-link">Story Map</Link>.
            </p>
          )}

        </div>
      </section>

      {/* ════════════════════════════════════════════════
          DRAMA CLUB SPOTLIGHT — teal, community-rooted
      ════════════════════════════════════════════════ */}
      {featuredClub && (
        <section
          className="hp-club-section"
          aria-labelledby="hp-club-heading"
          style={{ background: "#2493A9" }}
        >
          <div className="hp-club-inner">

            <div className="hp-club-text">
              <p className="hp-eyebrow-label hp-eyebrow-muted">DRAMA CLUB SPOTLIGHT</p>
              <h2 id="hp-club-heading" className="hp-club-name">
                {featuredClub.name}
              </h2>
              <p className="hp-club-location">
                {[featuredClub.city, featuredClub.country].filter(Boolean).join(", ")}
              </p>
              <p className="hp-club-desc">
                {featuredClub.shortBlurb
                  ? featuredClub.shortBlurb
                  : typeof featuredClub.description === "string"
                  ? featuredClub.description.length > 240
                    ? featuredClub.description.slice(0, 240) + "…"
                    : featuredClub.description
                  : ""}
              </p>
              <div className="hp-club-actions">
                <button
                  className="hp-club-btn"
                  onClick={() => router.push(`/drama-club/${featuredClub.slug}`)}
                >
                  Meet the Club
                </button>
                <Link href="/drama-club" className="hp-club-alt-link">
                  See all clubs →
                </Link>
              </div>
            </div>

            {(featuredClub.heroImage || featuredClub.cardImage) && (
              <div className="hp-club-img-wrap">
                <img
                  src={(featuredClub.heroImage || featuredClub.cardImage) as string}
                  alt={featuredClub.name}
                  className="hp-club-img"
                />
              </div>
            )}

          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════
          PRODUCTION HIGHLIGHT — deep purple, theatrical
      ════════════════════════════════════════════════ */}
      {featuredProduction && (
        <section
          className="hp-prod-section"
          aria-labelledby="hp-prod-heading"
          style={{ background: "#241123" }}
        >
          <div className="hp-prod-inner">

            {featuredProduction.posterUrl && (
              <div className="hp-prod-poster-wrap">
                <img
                  src={featuredProduction.posterUrl}
                  alt={`${featuredProduction.title} poster`}
                  className="hp-prod-poster"
                />
              </div>
            )}

            <div className="hp-prod-text">
              <p className="hp-eyebrow-label hp-eyebrow-muted">RECENT PRODUCTION</p>
              <h2 id="hp-prod-heading" className="hp-prod-title">
                {featuredProduction.title}
              </h2>
              <p className="hp-prod-meta">
                {featuredProduction.location}
                {featuredProduction.year ? ` · ${featuredProduction.year}` : ""}
              </p>
              {featuredProduction.venue && (
                <p className="hp-prod-sub">{featuredProduction.venue}</p>
              )}
              {featuredProduction.festival && (
                <p className="hp-prod-sub hp-prod-italic">
                  {featuredProduction.festival}
                </p>
              )}
              <div className="hp-prod-actions">
                <button
                  className="hp-prod-btn"
                  onClick={() =>
                    router.push(featuredProduction.url || "/story-map")
                  }
                >
                  Explore the Story
                </button>
                <Link href="/story-map" className="hp-prod-alt-link">
                  Full story map →
                </Link>
              </div>
            </div>

          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════
          COMMUNITY ACCORDION — kraft, four doors
      ════════════════════════════════════════════════ */}
      <section
        className="hp-community-band"
        aria-labelledby="hp-community-heading"
        style={{ background: "transparent" }}
      >
        <div className="hp-community-wrap">
          <h3 className="hp-band-heading">COMMUNITY</h3>

          <div className="hp-community-container">
            <div className="hp-community-head">
              <h2 id="hp-community-heading">Moved to Act.</h2>
              <p className="hp-sub">
                Alumni, partners, and friends who carry the work forward — on stage, in the field, at home, online, and around the world.
              </p>
            </div>

            <div className="hp-community-grid">
              {cards.map((card, i) => {
                const expanded = openIndex === i;
                return (
                  <div
                    key={card.title}
                    className="hp-community-card"
                    data-open={expanded ? "true" : "false"}
                  >
                    {/* Colored pill — navigates to section */}
                    <button
                      className={`hp-card-cta-bar hp-card-cta-bar--${card.tone}`}
                      type="button"
                      onClick={() => router.push(card.ctaHref)}
                      aria-label={`Open ${card.title} portal`}
                    >
                      <span className="hp-card-cta-text">{card.title}</span>
                    </button>

                    {/* Description (clamps when closed) */}
                    <p
                      className="hp-card-desc"
                      data-open={expanded ? "true" : "false"}
                    >
                      {card.desc}
                    </p>

                    {/* Chevron toggle */}
                    <button
                      className="hp-chev-toggle"
                      type="button"
                      aria-expanded={expanded}
                      aria-controls={`hp-reveal-${i}`}
                      onClick={() => setOpenIndex(openIndex === i ? null : i)}
                    >
                      <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                        <path d="M4 7.5 L10 13 L16 7.5" />
                      </svg>
                    </button>

                    {/* Animated reveal zone */}
                    <div
                      className="hp-reveal-wrap"
                      id={`hp-reveal-${i}`}
                      ref={setRevealRef(i)}
                      style={{ maxHeight: expanded ? (panelHeights[i] ?? 0) : 0 }}
                    >
                      <div
                        className="hp-mini-buttons-row"
                        role="group"
                        aria-label={`${card.title} links`}
                      >
                        {card.links.map((lnk) => (
                          <button
                            key={`${lnk.href}-${lnk.label}`}
                            className={`hp-mini-btn hp-mini-btn--${lnk.tone}`}
                            onClick={() => router.push(lnk.href)}
                            type="button"
                          >
                            <span>{lnk.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          STYLES — plain <style>, hp- prefix throughout
          No styled-jsx. background:transparent on kraft sections.
      ════════════════════════════════════════════════ */}
      <style>{`

/* ── Font face ─────────────────────────────────────────── */
@font-face {
  font-family: "Anton";
  src: url("/fonts/anton-v27-latin_latin-ext_vietnamese-regular.woff2") format("woff2");
  font-display: swap;
}

/* ── Page link reset ───────────────────────────────────── */
main a,
main a:visited,
main a:hover,
main a:focus,
main a:active { text-decoration: none !important; }

/* ── Brand tokens ──────────────────────────────────────── */
:root {
  --hp-purple:     #6C00AF;
  --hp-deep:       #241123;
  --hp-teal:       #2493A9;
  --hp-pink:       #F23359;
  --hp-yellow:     #FFCC00;
  --hp-gold:       #D9A919;
  --hp-green:      #2FA873;
}

/* ══════════════════════════════════════════════════════════
   HERO
══════════════════════════════════════════════════════════ */
.hp-hero {
  position: relative;
  height: 55vh;
  overflow: hidden;
  z-index: 0;
  box-shadow: 0 0 33px rgba(0,0,0,.5);
}
.hp-hero-fade {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, transparent 55%, rgba(246,228,193,.25) 100%);
  pointer-events: none;
}
@media (max-width: 1024px) { .hp-hero { height: 50vh; } }
@media (max-width: 767px)  { .hp-hero { height: 42vh; } }

/* ══════════════════════════════════════════════════════════
   HEADLINE
══════════════════════════════════════════════════════════ */
.hp-headline-area { background: transparent; margin-top: -.35rem; }
.hp-headline-wrap {
  max-width: 1200px;
  margin: 0 auto;
  padding: .75rem 2rem 0;
  text-align: left;
}
.hp-headline-title {
  margin: 0;
  line-height: 1.02;
  text-transform: uppercase;
  text-shadow: 0 8px 20px rgba(0,0,0,.08);
  /* color + fontSize set inline */
}
.hp-headline-subtitle {
  margin: .25rem 0 0;
  font-size: clamp(1rem, 2.4vw, 1.75rem);
  /* fontFamily + color set inline */
}

/* ══════════════════════════════════════════════════════════
   CTA SECTION
══════════════════════════════════════════════════════════ */
.hp-cta-section {
  background: transparent;
  padding: 1.5rem 2rem 2.5rem;
  max-width: 1200px;
  margin: 0 auto;
}
.hp-cta-wrapper {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  width: 100%;
  box-sizing: border-box;
}
.hp-cta-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
  min-width: 0;
  padding: 1rem;
}

/* Card shell */
.hp-cta-box {
  position: relative;
  overflow: hidden;
  border-radius: 15px;
  background: rgba(255,255,255,.25);
  box-shadow: 0 8px 20px rgba(0,0,0,.2);
  min-height: 500px;
  text-align: center;
  width: 100%;
  transition: background .5s ease;
}
.hp-cta-box::before {
  content: "";
  background: url("/images/masked-adjustment.png") center / cover no-repeat;
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 1s ease;
  z-index: 1;
}
.hp-cta-box:hover::before { opacity: 1; }

.hp-cta-content {
  position: relative;
  z-index: 2;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 500px;
}
.hp-text-elements {
  flex: 1 1 auto;
  transition: opacity .6s ease;
}
.hp-cta-box:hover .hp-text-elements { opacity: 0; }

.hp-cta-label {
  font-family: var(--font-dm-sans), "DM Sans", system-ui, sans-serif;
  font-weight: 900;
  text-transform: uppercase;
  font-size: 1.2rem;
  margin-bottom: .5rem;
  color: var(--hp-purple);
}
.hp-cta-h3 {
  font-family: var(--font-space-grotesk), "Space Grotesk", system-ui, sans-serif !important;
  font-size: 2.2rem;
  margin-bottom: 1rem;
  color: var(--hp-pink);
  font-weight: 800;
  line-height: 1.18;
}
.hp-cta-p {
  font-family: var(--font-dm-sans), "DM Sans", system-ui, sans-serif;
  font-size: 1rem;
  line-height: 1.5;
  font-weight: 500;
  margin-bottom: 2.5rem;
  color: var(--hp-deep);
  text-align: center;
}

/* CTA button */
.hp-dat-btn {
  position: relative;
  z-index: 3;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  max-width: 100%;
  box-sizing: border-box;
  text-align: center;
  margin-top: 2rem;
  padding: 1.1rem 2.2rem;
  font-family: var(--font-space-grotesk), "Space Grotesk", system-ui, sans-serif;
  font-size: 1.1rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .35em;
  background-color: #2493a9;
  color: #f2f2f2;
  border: none;
  border-radius: 15px;
  cursor: pointer;
  transition: transform .3s ease, box-shadow .3s ease;
  box-shadow: 0 8px 20px rgba(0,0,0,.18);
}
.hp-dat-btn:hover { transform: translateY(-1px); }
.hp-cta-box:hover .hp-dat-btn { animation: hp-pulse-glow 1.2s infinite; }
@keyframes hp-pulse-glow {
  0%   { transform: scale(1);    box-shadow: 0 0 0   rgba(255,204,0,0); }
  50%  { transform: scale(1.05); box-shadow: 0 0 15px rgba(255,204,0,.6); }
  100% { transform: scale(1);    box-shadow: 0 0 0   rgba(255,204,0,0); }
}

/* Responsive CTA */
@media (max-width: 1024px) {
  .hp-cta-wrapper { grid-template-columns: repeat(2, 1fr); }
  .hp-cta-block--supporters { grid-column: 1 / -1; }
}
@media (max-width: 768px) {
  .hp-cta-wrapper { grid-template-columns: 1fr; }
  .hp-cta-block { width: 100%; }
}

/* ══════════════════════════════════════════════════════════
   STATS BAND
══════════════════════════════════════════════════════════ */
.hp-stats-band {
  /* background set inline */
  padding: 2.5rem 2rem;
}
.hp-stats-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0;
}
.hp-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem 3rem;
  flex: 1 1 140px;
}
.hp-stat-number {
  font-family: "Anton", var(--font-anton), sans-serif;
  font-size: clamp(2.8rem, 5vw, 4.5rem);
  color: #FFCC00;
  line-height: 1;
  letter-spacing: .02em;
}
.hp-stat-label {
  font-family: var(--font-space-grotesk), "Space Grotesk", sans-serif;
  font-size: .8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .2em;
  color: rgba(246,228,193,.65);
  margin-top: .5rem;
}
.hp-stat-sep {
  width: 1px;
  height: 2.5rem;
  background: rgba(255,255,255,.15);
  flex: 0 0 auto;
  align-self: center;
}
@media (max-width: 600px) {
  .hp-stat-sep { display: none; }
  .hp-stat { padding: .75rem 1.25rem; flex: 1 1 100px; }
  .hp-stat-label { font-size: .7rem; letter-spacing: .12em; }
}

/* ══════════════════════════════════════════════════════════
   SHARED EYEBROW LABEL
══════════════════════════════════════════════════════════ */
.hp-eyebrow-label {
  font-family: var(--font-space-grotesk), "Space Grotesk", sans-serif;
  font-size: .72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .28em;
  color: #FFCC00;
  margin: 0;
}
.hp-eyebrow-muted {
  color: rgba(255,255,255,.55) !important;
}

/* ══════════════════════════════════════════════════════════
   LIVE STORY STRIP
══════════════════════════════════════════════════════════ */
.hp-stories-section {
  /* background set inline */
  padding: 3rem 2rem 3.5rem;
}
.hp-stories-inner {
  max-width: 1200px;
  margin: 0 auto;
}
.hp-stories-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: .5rem;
  margin-bottom: 1.75rem;
}
.hp-see-all-link {
  font-family: var(--font-dm-sans), "DM Sans", sans-serif;
  font-size: .88rem;
  font-weight: 600;
  color: rgba(246,228,193,.6) !important;
  transition: color .18s ease;
}
.hp-see-all-link:hover { color: #FFCC00 !important; }

/* Grid */
.hp-stories-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}
@media (max-width: 860px)  { .hp-stories-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 520px)  { .hp-stories-grid { grid-template-columns: 1fr; } }

/* Story card */
.hp-story-card {
  display: block;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(255,255,255,.06);
  border: 1px solid rgba(255,255,255,.09);
  transition: transform .2s ease, box-shadow .2s ease, background .2s ease;
  cursor: pointer;
}
.hp-story-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 16px 40px rgba(0,0,0,.5);
  background: rgba(255,255,255,.1);
}

/* Image shell */
.hp-story-img-shell {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: #28112a;
}
.hp-story-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform .4s ease;
}
.hp-story-card:hover .hp-story-img { transform: scale(1.04); }
.hp-story-img-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #3a1a3a 0%, #1a2a4a 100%);
}

/* Story text */
.hp-story-body { padding: .9rem 1rem 1.1rem; }
.hp-story-location {
  font-family: var(--font-space-grotesk), "Space Grotesk", sans-serif;
  font-size: .65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .15em;
  color: #2493A9;
  margin: 0 0 .35rem;
}
.hp-story-title {
  font-family: var(--font-space-grotesk), "Space Grotesk", sans-serif !important;
  font-size: 1rem;
  font-weight: 700;
  color: rgba(246,228,193,.95);
  margin: 0 0 .4rem;
  line-height: 1.3;
}
.hp-story-author {
  font-family: var(--font-dm-sans), "DM Sans", sans-serif;
  font-size: .78rem;
  color: rgba(246,228,193,.45);
  font-style: italic;
  margin: 0;
}

/* Skeleton shimmer */
.hp-skeleton-card {
  border-radius: 12px;
  min-height: 220px;
  background: linear-gradient(
    90deg,
    rgba(255,255,255,.04) 0%,
    rgba(255,255,255,.09) 50%,
    rgba(255,255,255,.04) 100%
  );
  background-size: 200% 100%;
  animation: hp-shimmer 1.5s infinite linear;
}
@keyframes hp-shimmer {
  0%   { background-position:  200% center; }
  100% { background-position: -200% center; }
}

.hp-stories-empty {
  font-family: var(--font-dm-sans), "DM Sans", sans-serif;
  color: rgba(246,228,193,.55);
  text-align: center;
  padding: 2.5rem 1rem;
  font-size: 1rem;
}
.hp-inline-link { color: #FFCC00 !important; }

/* ══════════════════════════════════════════════════════════
   DRAMA CLUB SPOTLIGHT
══════════════════════════════════════════════════════════ */
.hp-club-section {
  /* background set inline */
  padding: 3.5rem 2rem;
}
.hp-club-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  align-items: center;
}
@media (max-width: 780px) {
  .hp-club-inner { grid-template-columns: 1fr; gap: 2rem; }
}

.hp-club-name {
  font-family: var(--font-space-grotesk), "Space Grotesk", sans-serif !important;
  font-size: clamp(1.8rem, 3.5vw, 2.7rem);
  font-weight: 800;
  color: #fff;
  margin: .6rem 0 .35rem;
  line-height: 1.15;
}
.hp-club-location {
  font-family: var(--font-dm-sans), "DM Sans", sans-serif;
  font-size: .95rem;
  font-weight: 600;
  color: rgba(255,255,255,.7);
  margin: 0 0 1rem;
  letter-spacing: .04em;
}
.hp-club-desc {
  font-family: var(--font-dm-sans), "DM Sans", sans-serif;
  font-size: 1rem;
  line-height: 1.65;
  color: rgba(255,255,255,.88);
  margin: 0 0 1.75rem;
}
.hp-club-actions {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}
.hp-club-btn {
  display: inline-flex;
  align-items: center;
  padding: .9rem 2rem;
  background: #241123;
  color: #fff;
  font-family: var(--font-space-grotesk), "Space Grotesk", sans-serif;
  font-size: .92rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .2em;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background .2s ease, transform .2s ease;
  box-shadow: 0 6px 20px rgba(0,0,0,.25);
}
.hp-club-btn:hover { background: #3a0055; transform: translateY(-1px); }
.hp-club-alt-link {
  font-family: var(--font-dm-sans), "DM Sans", sans-serif;
  font-size: .88rem;
  font-weight: 600;
  color: rgba(255,255,255,.75) !important;
  transition: color .18s ease;
}
.hp-club-alt-link:hover { color: #fff !important; }

.hp-club-img-wrap {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,.3);
  aspect-ratio: 4 / 3;
}
.hp-club-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* ══════════════════════════════════════════════════════════
   PRODUCTION HIGHLIGHT
══════════════════════════════════════════════════════════ */
.hp-prod-section {
  /* background set inline */
  padding: 3.5rem 2rem;
}
.hp-prod-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 3rem;
  align-items: center;
}
@media (max-width: 780px) {
  .hp-prod-inner { grid-template-columns: 1fr; gap: 2rem; }
}

.hp-prod-poster-wrap {
  width: 200px;
  flex-shrink: 0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow:
    0 20px 60px rgba(0,0,0,.55),
    0 4px 12px  rgba(0,0,0,.3);
}
@media (max-width: 780px) {
  .hp-prod-poster-wrap { width: 100%; max-width: 260px; margin: 0 auto; }
}
.hp-prod-poster { width: 100%; height: auto; display: block; }

.hp-prod-title {
  font-family: "Anton", var(--font-anton), sans-serif !important;
  font-size: clamp(2rem, 4.5vw, 3.4rem);
  color: #FFCC00;
  margin: .75rem 0 .5rem;
  line-height: 1.05;
  text-transform: uppercase;
}
.hp-prod-meta {
  font-family: var(--font-space-grotesk), "Space Grotesk", sans-serif;
  font-size: 1rem;
  font-weight: 600;
  color: rgba(246,228,193,.7);
  margin: 0 0 .4rem;
  letter-spacing: .05em;
}
.hp-prod-sub {
  font-family: var(--font-dm-sans), "DM Sans", sans-serif;
  font-size: .88rem;
  color: rgba(246,228,193,.5);
  margin: 0 0 .3rem;
}
.hp-prod-italic { font-style: italic; }
.hp-prod-actions {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
  margin-top: 1.75rem;
}
.hp-prod-btn {
  display: inline-flex;
  align-items: center;
  padding: .9rem 2rem;
  background: #FFCC00;
  color: #241123;
  font-family: var(--font-space-grotesk), "Space Grotesk", sans-serif;
  font-size: .92rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: .2em;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background .2s ease, transform .2s ease;
  box-shadow: 0 6px 20px rgba(0,0,0,.25);
}
.hp-prod-btn:hover { background: #ffe033; transform: translateY(-1px); }
.hp-prod-alt-link {
  font-family: var(--font-dm-sans), "DM Sans", sans-serif;
  font-size: .88rem;
  font-weight: 600;
  color: rgba(246,228,193,.55) !important;
  transition: color .18s ease;
}
.hp-prod-alt-link:hover { color: rgba(246,228,193,.9) !important; }

/* ══════════════════════════════════════════════════════════
   COMMUNITY ACCORDION
══════════════════════════════════════════════════════════ */
.hp-community-band {
  /* background: transparent set inline */
  padding: 2.5rem 0 3.25rem;
}
.hp-community-wrap {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}
.hp-band-heading {
  font-family: var(--font-space-grotesk), "Space Grotesk", system-ui, sans-serif;
  font-size: 2.4rem;
  margin: 0 0 1rem;
  text-transform: uppercase;
  letter-spacing: .2rem;
  color: #241123;
  background-color: #ffcc00;
  opacity: .6;
  padding: .1em .5em;
  border-radius: .3em;
  display: inline-block;
}
.hp-community-container {
  background: rgba(36,17,35,.20);
  border-radius: 8px;
  padding: clamp(16px, 2.2vw, 32px);
}
.hp-community-head { margin-bottom: 1rem; text-align: left; }
.hp-community-head h2 {
  margin: 0;
  font-family: var(--font-space-grotesk), "Space Grotesk", system-ui, sans-serif !important;
  font-weight: 800;
  font-size: clamp(1.4rem, 3vw, 2rem);
  color: #D9A919;
  opacity: .95;
  line-height: 1.15;
  text-align: left;
}
.hp-sub {
  margin: .25rem 0 0;
  font-family: var(--font-dm-sans), "DM Sans", system-ui, sans-serif;
  color: rgba(234,222,170,.6);
  font-weight: 600;
  font-size: 1rem;
  text-align: left;
  line-height: 1.5;
}

/* FLEX grid — CSS-var-driven column count */
.hp-community-grid {
  position: relative;
  z-index: 1;
  margin-top: 1rem;
  display: flex;
  flex-wrap: wrap;
  --hp-gap: clamp(14px, 1.6vw, 24px);
  --hp-cols: 4;
  gap: var(--hp-gap);
  align-items: flex-start;
  box-sizing: border-box;
}
.hp-community-card {
  flex: 0 1 calc((100% - (var(--hp-cols) - 1) * var(--hp-gap)) / var(--hp-cols));
  position: relative;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding: 1rem 1.1rem .3rem;
  border-radius: 12px;
  background: rgba(255,255,255,.30);
  border: 1px solid rgba(0,0,0,.08);
  box-shadow: 0 6px 16px rgba(0,0,0,.14);
  transition: background .2s ease, box-shadow .2s ease;
  text-align: left;
  overflow: visible;
  min-height: auto;
}
.hp-community-card[data-open="true"]  { padding-bottom: 1rem; }
.hp-community-card[data-open="false"] { padding-bottom: .3rem !important; }

@media (max-width: 1000px) { .hp-community-grid { --hp-cols: 2; } }
@media (max-width: 540px)  { .hp-community-grid { --hp-cols: 1; } }

/* Colored pill button */
.hp-card-cta-bar {
  display: block;
  width: 100%;
  box-sizing: border-box;
  border-radius: 12px;
  padding: .7rem .9rem;
  margin: 0 0 .75rem;
  border: 1px solid rgba(0,0,0,.08);
  font-family: var(--font-space-grotesk), "Space Grotesk", system-ui, sans-serif;
  font-weight: 700;
  font-size: .82rem;
  line-height: 1.2;
  letter-spacing: .14em;
  text-transform: uppercase;
  text-align: center;
  cursor: pointer;
  transition: transform 120ms ease, box-shadow 120ms ease, background-color 120ms ease;
}
.hp-card-cta-bar:hover { transform: translateY(-1px); box-shadow: 0 2px 10px rgba(0,0,0,.12); }
.hp-card-cta-bar--pink   { background: rgba(242,51,89,1);  color: #f2f2f2; }
.hp-card-cta-bar--purple { background: rgba(108,0,175,1);  color: #f2f2f2; }
.hp-card-cta-bar--green  { background: rgba(47,168,115,1); color: #f2f2f2; }
.hp-card-cta-bar--yellow { background: rgba(217,169,25,1); color: #241123; }
.hp-card-cta-bar--pink:hover   { background: rgba(164,2,35,.92); }
.hp-card-cta-bar--purple:hover { background: rgba(62,0,101,.92); }
.hp-card-cta-bar--green:hover  { background: rgba(13,111,68,.92); }
.hp-card-cta-bar--yellow:hover { background: rgba(187,141,3,.92); }

/* Description */
.hp-card-desc {
  margin: .3rem 0 .1rem;
  font-family: var(--font-dm-sans), "DM Sans", system-ui, sans-serif;
  color: #241123;
  font-size: .95rem;
  line-height: 1.5;
  text-align: left;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.hp-card-desc[data-open="true"] {
  display: block;
  -webkit-line-clamp: unset;
  -webkit-box-orient: unset;
  overflow: visible;
}

/* Chevron */
.hp-chev-toggle {
  align-self: flex-end;
  margin: 0;
  margin-top: .15rem;
  margin-right: -6px;
  padding: 0;
  background: transparent;
  border: none;
  cursor: pointer;
}
.hp-chev-toggle svg {
  width: 30px;
  height: 30px;
  display: block;
  opacity: .9;
  transition: transform .2s ease, opacity .2s ease;
}
.hp-chev-toggle path {
  fill: none;
  stroke: #241123;
  stroke-width: 1.75;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.hp-chev-toggle:hover svg { opacity: 1; }
.hp-chev-toggle[aria-expanded="true"] svg { transform: rotate(180deg); }

/* Open state: fix chevron to bottom-right */
.hp-community-card[data-open="true"] .hp-chev-toggle {
  position: absolute;
  right: 12px;
  bottom: 6px;
  padding-left: 28px;
}
.hp-community-card[data-open="true"] .hp-mini-buttons-row {
  padding-right: 36px;
  padding-bottom: .75px;
  margin-bottom: 0;
}

/* Animated reveal */
.hp-reveal-wrap {
  max-height: 0;
  overflow: hidden;
  transition: max-height 280ms ease;
}
@media (prefers-reduced-motion: reduce) {
  .hp-reveal-wrap   { transition: none; }
  .hp-chev-toggle svg { transition: none; }
}

/* Mini link buttons */
.hp-mini-buttons-row {
  margin-top: .75rem;
  display: flex;
  gap: .6rem;
  flex-wrap: wrap;
  justify-content: flex-start;
}
.hp-mini-btn {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  padding: .55rem .9rem;
  border-radius: 12px;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  font-family: var(--font-space-grotesk), "Space Grotesk", system-ui, sans-serif;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .16em;
  font-size: .7rem;
  line-height: 1.1;
  color: inherit;
  transition: background-color 120ms ease, border-color 120ms ease, color 120ms ease, transform 120ms ease;
}
.hp-mini-btn span { text-align: left; }
.hp-mini-btn--pink   { color: rgba(168,2,35,1);  background-color: rgba(242,51,89,.20);  border-color: rgba(242,51,89,1); }
.hp-mini-btn--purple { color: rgba(80,0,130,1);  background-color: rgba(108,0,175,.20);  border-color: rgba(108,0,175,1); }
.hp-mini-btn--green  { color: rgba(3,37,22,1);   background-color: rgba(47,168,115,.28); border-color: rgba(26,209,130,1); }
.hp-mini-btn--yellow { color: rgba(52,39,0,1);   background-color: rgba(217,169,25,.32); border-color: rgba(243,183,5,1); }
.hp-mini-btn:hover { transform: translateY(-.5px); color: #fff; }
.hp-mini-btn--pink:hover   { background-color: rgba(231,44,81,.60);  border-color: rgba(242,51,89,1); }
.hp-mini-btn--purple:hover { background-color: rgba(97,2,156,.60);   border-color: rgba(108,0,175,1); }
.hp-mini-btn--green:hover  { background-color: rgba(47,168,115,.68); border-color: rgba(26,209,130,1); }
.hp-mini-btn--yellow:hover { background-color: rgba(217,169,25,.88); border-color: rgba(243,183,5,1); }

      `}</style>

    </main>
  );
}
