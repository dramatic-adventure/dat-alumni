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
import {
  upcomingEvents,
  categoryMeta,
  getEventImage,
  shortMonth,
  dayOfMonth,
  formatDateRange,
} from "@/lib/events";

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

/* ─── Story media helper ─────────────────────────────────────────────── */

function getYouTubeId(url: string): string | null {
  const m = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([a-zA-Z0-9_-]{11})/
  );
  return m ? m[1] : null;
}

function StoryMedia({ url, title }: { url: string; title: string }) {
  if (!url) {
    return <div className="hp-story-img-placeholder" aria-hidden="true" />;
  }

  const ytId = getYouTubeId(url);
  if (ytId) {
    return (
      <>
        <img
          src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
          alt={title}
          className="hp-story-img"
          loading="lazy"
        />
        <div className="hp-story-play-badge" aria-hidden="true">▶</div>
      </>
    );
  }

  const isVideo =
    url.includes("vimeo.com") ||
    /\.(mp4|webm|ogg)(\?|$)/i.test(url);

  if (isVideo) {
    return (
      <div className="hp-story-video-placeholder">
        <div className="hp-story-play-badge hp-story-play-badge--static">▶</div>
        <span className="hp-story-video-label">Video</span>
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={title}
      className="hp-story-img"
      loading="lazy"
    />
  );
}

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
    const dayIndex = Math.floor(Date.now() / 86_400_000);
    return pool[dayIndex % pool.length];
  }, []);

  /* ── Featured production — prefer upcoming, fall back to most recent ── */
  const { featuredProduction, isUpcoming } = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const all = Object.values(productionMap);

    const upcoming = all
      .filter((p) => getSortYear(p) >= currentYear)
      .sort((a, b) => getSortYear(a) - getSortYear(b));

    if (upcoming.length > 0) {
      return { featuredProduction: upcoming[0], isUpcoming: true };
    }

    const past = [...all].sort((a, b) => getSortYear(b) - getSortYear(a));
    return { featuredProduction: past[0] ?? null, isUpcoming: false };
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
        ctaHref: "/friends",
        ctaLabel: "FRIENDS OF DAT",
        links: [
          { href: "/friends/volunteer", label: "Volunteer with DAT", tone: "yellow" },
          { href: "/friends/ambassador", label: "Join as an Ambassador", tone: "yellow" },
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

  /* ── Derived production values ────────────────────── */
  const productionUrl = featuredProduction
    ? featuredProduction.url || `/story/${featuredProduction.slug}`
    : "/story-map";
  const prodCtaLabel = isUpcoming ? "Get Your Seat →" : "Explore the Story →";
  const prodSectionLabel = isUpcoming ? "UPCOMING PRODUCTION" : "RECENT PRODUCTION";

  /* ── Render ───────────────────────────────────────── */
  return (
    <main style={{ background: "transparent" }}>

      {/* ════════════════════════════════════════════════
          HERO — full-bleed image, headline in lower third
      ════════════════════════════════════════════════ */}
      <div className="hp-hero">
        <Image
          src="/images/alumni-hero.jpg"
          alt="DAT artists performing in the field"
          fill
          priority
          style={{ objectFit: "cover", objectPosition: "center 30%" }}
        />
        <div className="hp-hero-overlay" aria-hidden="true" />
        <div className="hp-hero-content-outer">
          <div className="hp-hero-content-inner">
            <p
              className="hp-hero-eyebrow"
              style={{ fontFamily: 'var(--font-dm-sans), "DM Sans", system-ui, sans-serif' }}
            >
              Dramatic Adventure Theatre
            </p>
            <h1
              className="hp-hero-title"
              style={{ fontFamily: '"Anton", sans-serif' }}
            >
              EVERY STORY<br />STARTS SOMEWHERE.
            </h1>
            <p
              className="hp-hero-sub"
              style={{ fontFamily: 'var(--font-space-grotesk), "Space Grotesk", system-ui, sans-serif' }}
            >
              We develop artists, travel the world, and make theatre that matters.
            </p>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          CTA — three doors, editorial cards with hover reveal
      ════════════════════════════════════════════════ */}
      <section className="hp-cta-section" aria-label="Find your path">
        <div className="hp-cta-inner">

          <p className="hp-eyebrow-label hp-eyebrow-ink hp-cta-intro-label">Find Your Path</p>

          <div className="hp-cta-wrapper">

            {/* ── Artists ── */}
            <div className="hp-cta-card hp-cta-card--pink">
              <div
                className="hp-cta-card-bg"
                style={{ backgroundImage: "url('/images/performing-zanzibar.jpg')" }}
                aria-hidden="true"
              />
              <div className="hp-cta-card-overlay" aria-hidden="true" />
              <div className="hp-cta-card-content">
                <div className="hp-cta-text-group">
                  <p className="hp-cta-card-label">FOR ARTISTS</p>
                  <h3 className="hp-cta-card-h3">Take the Stage</h3>
                  <p className="hp-cta-card-p">
                    Join residencies, expeditions, and workshops that spark meaningful new work — onstage and beyond.
                  </p>
                </div>
                <a
                  href="https://dramaticadventure.com/travel-opportunities"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hp-cta-card-btn hp-cta-card-btn--pink"
                >
                  Join the Adventure
                </a>
              </div>
            </div>

            {/* ── Audiences ── */}
            <div className="hp-cta-card hp-cta-card--teal">
              <div
                className="hp-cta-card-bg"
                style={{ backgroundImage: "url('/images/Andean_Mask_Work.jpg')" }}
                aria-hidden="true"
              />
              <div className="hp-cta-card-overlay" aria-hidden="true" />
              <div className="hp-cta-card-content">
                <div className="hp-cta-text-group">
                  <p className="hp-cta-card-label">FOR AUDIENCES</p>
                  <h3 className="hp-cta-card-h3">Follow the Journey</h3>
                  <p className="hp-cta-card-p">
                    Explore a season of bold journeys, deep listening, unique collaborations, and daring creativity.
                  </p>
                </div>
                <button
                  className="hp-cta-card-btn hp-cta-card-btn--teal"
                  onClick={() => router.push("/story-map")}
                >
                  Experience the Work
                </button>
              </div>
            </div>

            {/* ── Supporters ── */}
            <div className="hp-cta-card hp-cta-card--gold">
              <div
                className="hp-cta-card-bg"
                style={{ backgroundImage: "url('/images/teaching-andes.jpg')" }}
                aria-hidden="true"
              />
              <div className="hp-cta-card-overlay" aria-hidden="true" />
              <div className="hp-cta-card-content">
                <div className="hp-cta-text-group">
                  <p className="hp-cta-card-label">FOR SUPPORTERS &amp; FUNDERS</p>
                  <h3 className="hp-cta-card-h3">Make Magic Possible</h3>
                  <p className="hp-cta-card-p">
                    Support responsive, community-powered theatre — where story is needed most.
                  </p>
                </div>
                <button
                  className="hp-cta-card-btn hp-cta-card-btn--gold"
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
          STATS BAND — dark, compact credibility bar
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
          LIVE STORY STRIP — kraft background, editorial cards
      ════════════════════════════════════════════════ */}
      <section
        className="hp-stories-section"
        aria-labelledby="hp-stories-heading"
        style={{ background: "transparent" }}
      >
        <div className="hp-stories-inner">

          <div className="hp-stories-header">
            <p id="hp-stories-heading" className="hp-eyebrow-label hp-eyebrow-ink">
              From the Field
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
                    <StoryMedia url={s["Image URL"]} title={s.Title} />
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
          PRODUCTION — marquee treatment, theatrical
      ════════════════════════════════════════════════ */}
      {featuredProduction && (
        <section className="hp-prod-section" aria-labelledby="hp-prod-heading">
          {/* Archive image texture */}
          <div className="hp-prod-stage-texture" aria-hidden="true" />
          {/* Gradient vignette over texture */}
          <div className="hp-prod-stage-vignette" aria-hidden="true" />

          <div className="hp-prod-inner">

            {featuredProduction.posterUrl && (
              <div className="hp-prod-poster-wrap">
                <img
                  src={featuredProduction.posterUrl}
                  alt={`${featuredProduction.title} poster`}
                  className="hp-prod-poster"
                />
                <div className="hp-prod-poster-glow" aria-hidden="true" />
              </div>
            )}

            <div className="hp-prod-text">
              <p className="hp-eyebrow-label hp-eyebrow-gold-muted">{prodSectionLabel}</p>
              <h2 id="hp-prod-heading" className="hp-prod-title">
                {featuredProduction.title}
              </h2>
              <div className="hp-prod-meta-block">
                <p className="hp-prod-meta">
                  {featuredProduction.location}
                  {featuredProduction.year ? ` · Season ${featuredProduction.season}` : ""}
                </p>
                {featuredProduction.venue && (
                  <p className="hp-prod-sub">{featuredProduction.venue}</p>
                )}
                {featuredProduction.festival && (
                  <p className="hp-prod-sub hp-prod-italic">{featuredProduction.festival}</p>
                )}
              </div>
              <div className="hp-prod-actions">
                <button
                  className="hp-prod-btn"
                  onClick={() => router.push(productionUrl)}
                >
                  {prodCtaLabel}
                </button>
                <Link href="/story-map" className="hp-prod-alt-link">
                  Full archive →
                </Link>
              </div>
            </div>

          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════
          EVENTS — upcoming events strip
      ════════════════════════════════════════════════ */}
      {upcomingEvents.length > 0 && (
        <section className="hp-events-section" aria-labelledby="hp-events-heading">
          <div className="hp-events-stage-texture" aria-hidden="true" />
          <div className="hp-events-inner">

            <div className="hp-events-header">
              <div>
                <p className="hp-eyebrow-label hp-eyebrow-gold-muted">Live &amp; Coming Up</p>
                <h2 id="hp-events-heading" className="hp-events-title">What&apos;s On</h2>
              </div>
              <Link href="/events" className="hp-events-see-all">
                All Events →
              </Link>
            </div>

            <div className="hp-events-grid">
              {upcomingEvents.slice(0, 2).map((ev) => {
                const meta = categoryMeta[ev.category];
                const img = getEventImage(ev);
                return (
                  <Link
                    key={ev.id}
                    href={meta.href}
                    className="hp-event-card"
                    aria-label={`${ev.title} — ${ev.city}`}
                  >
                    <div
                      className="hp-event-card-img"
                      style={img ? { backgroundImage: `url('${img}')` } : undefined}
                    />
                    <div className="hp-event-card-overlay" />
                    <div className="hp-event-card-body">
                      <div
                        className="hp-event-date-badge"
                        style={{ background: meta.color }}
                      >
                        <span className="hp-event-badge-day">{dayOfMonth(ev.date)}</span>
                        <span className="hp-event-badge-mo">{shortMonth(ev.date)}</span>
                      </div>
                      <div className="hp-event-card-text">
                        <span
                          className="hp-event-cat-label"
                          style={{ color: meta.color }}
                        >
                          {meta.eyebrow}
                        </span>
                        <p className="hp-event-card-title">{ev.title}</p>
                        <p className="hp-event-card-venue">
                          {ev.venue}
                          {ev.city ? ` · ${ev.city}` : ""}
                        </p>
                        {ev.endDate ? (
                          <p className="hp-event-card-dates">
                            {formatDateRange(ev.date, ev.endDate)}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    {ev.ticketUrl && (
                      <div className="hp-event-card-ticket-bar" style={{ borderTopColor: meta.color }}>
                        <span style={{ color: meta.color }}>
                          {ev.ticketType === "free" ? "Free" : ev.ticketPrice ?? "Tickets"}
                        </span>
                        <span className="hp-event-ticket-cta">
                          {ev.ticketType === "free" ? "Register →" : "Get Tickets →"}
                        </span>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>

          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════
          COMMUNITY — kraft, four constituent doors
      ════════════════════════════════════════════════ */}
      <section
        className="hp-community-band"
        aria-labelledby="hp-community-heading"
        style={{ background: "transparent" }}
      >
        <div className="hp-community-wrap">

          <div className="hp-community-band-header">
            <p className="hp-community-eyebrow">Community</p>
            <h2 id="hp-community-heading" className="hp-community-band-title">
              Moved to Act.
            </h2>
            <p className="hp-community-band-sub">
              Alumni, partners, and friends who carry the work forward — on stage, in the field, at home, and around the world.
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
      </section>

      {/* ════════════════════════════════════════════════
          STYLES — plain <style>, hp- prefix throughout
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
  --hp-purple:  #6C00AF;
  --hp-deep:    #241123;
  --hp-teal:    #2493A9;
  --hp-pink:    #F23359;
  --hp-yellow:  #FFCC00;
  --hp-gold:    #D9A919;
  --hp-green:   #2FA873;
  --hp-kraft:   rgba(36,17,35,0.72);
}

/* ══════════════════════════════════════════════════════════
   SHARED EYEBROW LABEL
══════════════════════════════════════════════════════════ */
.hp-eyebrow-label {
  font-family: var(--font-space-grotesk), "Space Grotesk", sans-serif;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.28em;
  color: #FFCC00;
  margin: 0;
}
/* On light/kraft backgrounds */
.hp-eyebrow-ink {
  color: rgba(36,17,35,0.72) !important;
}
/* On dark backgrounds, slightly muted white */
.hp-eyebrow-muted {
  color: rgba(255,255,255,0.52) !important;
}
/* On very dark backgrounds, muted gold */
.hp-eyebrow-gold-muted {
  color: rgba(255,204,0,0.65) !important;
}

/* ══════════════════════════════════════════════════════════
   HERO
══════════════════════════════════════════════════════════ */
.hp-hero {
  position: relative;
  height: 70vh;
  min-height: 520px;
  overflow: hidden;
  z-index: 0;
}
@media (max-width: 1024px) { .hp-hero { height: 65vh; min-height: 460px; } }
@media (max-width: 767px)  { .hp-hero { height: 58vh; min-height: 380px; } }

.hp-hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(36,17,35,0.20) 0%,
    rgba(36,17,35,0.0)  20%,
    rgba(36,17,35,0.38) 60%,
    rgba(36,17,35,0.94) 100%
  );
  pointer-events: none;
  z-index: 1;
}
.hp-hero-content-outer {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  z-index: 2;
  padding-bottom: 2.75rem;
}
.hp-hero-content-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}
.hp-hero-eyebrow {
  /* fontFamily set inline */
  font-weight: 900;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.38em;
  color: rgba(246,228,193,0.72);
  margin: 0 0 0.6rem;
}
.hp-hero-title {
  /* fontFamily set inline */
  font-size: clamp(3rem, 8vw, 6.5rem);
  line-height: 1.0;
  text-transform: uppercase;
  color: #D9A919;
  opacity: 0.93;
  margin: 0 0 0.7rem;
  text-shadow: 0 4px 32px rgba(0,0,0,0.4);
}
.hp-hero-sub {
  /* fontFamily set inline */
  font-weight: 500;
  font-size: clamp(0.92rem, 1.9vw, 1.22rem);
  color: rgba(246,228,193,0.88);
  margin: 0;
  line-height: 1.45;
}
@media (max-width: 540px) {
  .hp-hero-content-outer { padding-bottom: 1.75rem; }
}

/* ══════════════════════════════════════════════════════════
   CTA SECTION — three doors with image hover reveal
══════════════════════════════════════════════════════════ */
.hp-cta-section {
  background: transparent;
  padding: 2.75rem 2rem 3.5rem;
}
.hp-cta-inner { max-width: 1200px; margin: 0 auto; }
.hp-cta-intro-label { margin-bottom: 1.4rem; }

.hp-cta-wrapper {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}
@media (max-width: 960px) {
  .hp-cta-wrapper { grid-template-columns: repeat(2, 1fr); }
  .hp-cta-wrapper > .hp-cta-card:last-child {
    grid-column: 1 / -1;
    max-width: 480px;
  }
}
@media (max-width: 580px) {
  .hp-cta-wrapper { grid-template-columns: 1fr; }
  .hp-cta-wrapper > .hp-cta-card:last-child { max-width: none; }
}

/* ── Card shell ── */
.hp-cta-card {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  background: rgba(255,255,255,0.55);
  box-shadow: 0 2px 8px rgba(36,17,35,0.07), 0 8px 24px rgba(36,17,35,0.10);
  border-top: 5px solid transparent;
  transition: transform 0.24s ease, box-shadow 0.24s ease;
  min-height: 340px;
}
.hp-cta-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(36,17,35,0.12), 0 18px 44px rgba(36,17,35,0.22);
}
.hp-cta-card--pink { border-top-color: #F23359; }
.hp-cta-card--teal { border-top-color: #2493A9; }
.hp-cta-card--gold { border-top-color: #D9A919; }

/* ── Background image (reveals on hover) ── */
.hp-cta-card-bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  opacity: 0;
  transform: scale(1.07);
  transition: opacity 0.65s ease, transform 0.65s ease;
  z-index: 0;
}
.hp-cta-card:hover .hp-cta-card-bg {
  opacity: 1;
  transform: scale(1);
}

/* ── Dark scrim over image ── */
.hp-cta-card-overlay {
  position: absolute;
  inset: 0;
  background: rgba(20,6,22,0.74);
  opacity: 0;
  transition: opacity 0.55s ease;
  z-index: 1;
  pointer-events: none;
}
.hp-cta-card:hover .hp-cta-card-overlay { opacity: 1; }

/* ── Content sits above image + overlay ── */
.hp-cta-card-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 1.75rem 1.75rem 1.6rem;
  box-sizing: border-box;
  flex: 1;
}

/* ── Text group fades out on hover ── */
.hp-cta-text-group { flex: 1 1 auto; transition: opacity 0.42s ease; }
.hp-cta-card:hover .hp-cta-text-group { opacity: 0; }

/* ── Label ── */
.hp-cta-card-label {
  font-family: var(--font-dm-sans), "DM Sans", system-ui, sans-serif;
  font-weight: 900;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.26em;
  margin: 0 0 0.55rem;
}
.hp-cta-card--pink .hp-cta-card-label { color: #c4163d; }
.hp-cta-card--teal .hp-cta-card-label { color: #1a7a8f; }
.hp-cta-card--gold .hp-cta-card-label { color: #9e7900; }

/* ── Headline ── */
.hp-cta-card-h3 {
  font-family: var(--font-space-grotesk), "Space Grotesk", system-ui, sans-serif !important;
  font-weight: 800;
  font-size: clamp(1.5rem, 2.4vw, 2rem);
  color: #241123;
  margin: 0 0 0.7rem;
  line-height: 1.12;
}

/* ── Body ── */
.hp-cta-card-p {
  font-family: var(--font-dm-sans), "DM Sans", system-ui, sans-serif;
  font-size: 0.95rem;
  line-height: 1.62;
  color: rgba(36,17,35,0.72);
  margin: 0;
}

/* ── CTA button — stays visible on hover ── */
.hp-cta-card-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  align-self: flex-start;
  margin-top: 1.5rem;
  padding: 0.8rem 1.65rem;
  border: none;
  border-radius: 10px;
  font-family: var(--font-space-grotesk), "Space Grotesk", system-ui, sans-serif;
  font-weight: 700;
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.22em;
  cursor: pointer;
  text-decoration: none !important;
  box-shadow: 0 4px 14px rgba(0,0,0,0.14);
  transition: transform 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;
}
.hp-cta-card-btn:hover { transform: translateY(-2px); box-shadow: 0 7px 22px rgba(0,0,0,0.28); }
.hp-cta-card-btn--pink { background: #F23359; color: #fff; }
.hp-cta-card-btn--teal { background: #2493A9; color: #fff; }
.hp-cta-card-btn--gold { background: #D9A919; color: #241123; }
/* Button pulse when card image is showing */
.hp-cta-card:hover .hp-cta-card-btn { animation: hp-btn-pulse 1.4s ease-in-out infinite; }
@keyframes hp-btn-pulse {
  0%   { box-shadow: 0 0 0   6px rgba(255,204,0,0);   }
  50%  { box-shadow: 0 0 0  10px rgba(255,204,0,0.28); }
  100% { box-shadow: 0 0 0   6px rgba(255,204,0,0);   }
}

/* ══════════════════════════════════════════════════════════
   STATS BAND
══════════════════════════════════════════════════════════ */
.hp-stats-band { padding: 2.25rem 2rem; }
.hp-stats-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
}
.hp-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75rem 3rem;
  flex: 1 1 140px;
}
.hp-stat-number {
  font-family: "Anton", sans-serif;
  font-size: clamp(2.8rem, 5vw, 4.5rem);
  color: #FFCC00;
  line-height: 1;
  letter-spacing: 0.02em;
}
.hp-stat-label {
  font-family: var(--font-space-grotesk), "Space Grotesk", sans-serif;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: rgba(246,228,193,0.62);
  margin-top: 0.45rem;
}
.hp-stat-sep {
  width: 1px; height: 2.5rem;
  background: rgba(255,255,255,0.14);
  flex: 0 0 auto; align-self: center;
}
@media (max-width: 600px) {
  .hp-stat-sep { display: none; }
  .hp-stat { padding: 0.6rem 1.25rem; flex: 1 1 90px; }
  .hp-stat-label { font-size: 0.68rem; letter-spacing: 0.12em; }
}

/* ══════════════════════════════════════════════════════════
   LIVE STORY STRIP — kraft background, ink cards
══════════════════════════════════════════════════════════ */
.hp-stories-section { padding: 3rem 2rem 3.5rem; }
.hp-stories-inner { max-width: 1200px; margin: 0 auto; }
.hp-stories-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.75rem;
}
.hp-see-all-link {
  font-family: var(--font-dm-sans), "DM Sans", sans-serif;
  font-size: 0.88rem;
  font-weight: 600;
  color: rgba(36,17,35,0.5) !important;
  transition: color 0.18s ease;
}
.hp-see-all-link:hover { color: #241123 !important; }

/* Grid */
.hp-stories-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}
@media (max-width: 860px) { .hp-stories-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 520px) { .hp-stories-grid { grid-template-columns: 1fr; } }

/* Story card — light treatment on kraft */
.hp-story-card {
  display: block;
  border-radius: 14px;
  overflow: hidden;
  background: rgba(255,255,255,0.62);
  border: 1px solid rgba(36,17,35,0.08);
  box-shadow: 0 2px 10px rgba(36,17,35,0.08), 0 6px 20px rgba(36,17,35,0.06);
  transition: transform 0.22s ease, box-shadow 0.22s ease;
  cursor: pointer;
}
.hp-story-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(36,17,35,0.14), 0 14px 36px rgba(36,17,35,0.14);
}

/* Image shell */
.hp-story-img-shell {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: rgba(36,17,35,0.08);
}
.hp-story-img {
  width: 100%; height: 100%;
  object-fit: cover; display: block;
  transition: transform 0.4s ease;
}
.hp-story-card:hover .hp-story-img { transform: scale(1.04); }

.hp-story-img-placeholder {
  width: 100%; height: 100%;
  background: linear-gradient(135deg, rgba(36,17,35,0.12) 0%, rgba(36,147,169,0.12) 100%);
}

/* Video placeholder */
.hp-story-video-placeholder {
  width: 100%; height: 100%;
  background: linear-gradient(135deg, #241123 0%, #1a3a4a 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
}
.hp-story-play-badge {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 40px; height: 40px;
  background: rgba(255,255,255,0.92);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;
  color: #241123;
  box-shadow: 0 2px 10px rgba(0,0,0,0.3);
  padding-left: 3px; /* optical center for play triangle */
}
.hp-story-play-badge--static { position: static; transform: none; }
.hp-story-video-label {
  font-family: var(--font-dm-sans), "DM Sans", sans-serif;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.22em;
  color: rgba(246,228,193,0.65);
}

/* Story text */
.hp-story-body { padding: 0.9rem 1rem 1.1rem; }
.hp-story-location {
  font-family: var(--font-space-grotesk), "Space Grotesk", sans-serif;
  font-size: 0.64rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: #2493A9;
  margin: 0 0 0.32rem;
}
.hp-story-title {
  font-family: var(--font-space-grotesk), "Space Grotesk", sans-serif !important;
  font-size: 1rem;
  font-weight: 700;
  color: #241123;
  margin: 0 0 0.4rem;
  line-height: 1.3;
}
.hp-story-author {
  font-family: var(--font-dm-sans), "DM Sans", sans-serif;
  font-size: 0.78rem;
  color: rgba(36,17,35,0.48);
  font-style: italic;
  margin: 0;
}

/* Skeleton shimmer — kraft-toned */
.hp-skeleton-card {
  border-radius: 14px;
  min-height: 220px;
  background: linear-gradient(
    90deg,
    rgba(36,17,35,0.06) 0%,
    rgba(36,17,35,0.12) 50%,
    rgba(36,17,35,0.06) 100%
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
  color: rgba(36,17,35,0.55);
  text-align: center;
  padding: 2.5rem 1rem;
  font-size: 1rem;
}
.hp-inline-link { color: #2493A9 !important; }

/* ══════════════════════════════════════════════════════════
   DRAMA CLUB SPOTLIGHT
══════════════════════════════════════════════════════════ */
.hp-club-section { padding: 3.5rem 2rem; }
.hp-club-inner {
  max-width: 1200px; margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  align-items: center;
}
@media (max-width: 780px) { .hp-club-inner { grid-template-columns: 1fr; gap: 2rem; } }

.hp-club-name {
  font-family: var(--font-space-grotesk), "Space Grotesk", sans-serif !important;
  font-size: clamp(1.8rem, 3.5vw, 2.7rem);
  font-weight: 800;
  color: #fff;
  margin: 0.6rem 0 0.35rem;
  line-height: 1.15;
}
.hp-club-location {
  font-family: var(--font-dm-sans), "DM Sans", sans-serif;
  font-size: 0.95rem; font-weight: 600;
  color: rgba(255,255,255,0.7);
  margin: 0 0 1rem; letter-spacing: 0.04em;
}
.hp-club-desc {
  font-family: var(--font-dm-sans), "DM Sans", sans-serif;
  font-size: 1rem; line-height: 1.65;
  color: rgba(255,255,255,0.88);
  margin: 0 0 1.75rem;
}
.hp-club-actions { display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap; }
.hp-club-btn {
  display: inline-flex; align-items: center;
  padding: 0.9rem 2rem;
  background: #241123; color: #fff;
  font-family: var(--font-space-grotesk), "Space Grotesk", sans-serif;
  font-size: 0.92rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.2em;
  border: none; border-radius: 10px; cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;
  box-shadow: 0 6px 20px rgba(0,0,0,0.25);
}
.hp-club-btn:hover { background: #3a0055; transform: translateY(-1px); }
.hp-club-alt-link {
  font-family: var(--font-dm-sans), "DM Sans", sans-serif;
  font-size: 0.88rem; font-weight: 600;
  color: rgba(255,255,255,0.75) !important;
  transition: color 0.18s ease;
}
.hp-club-alt-link:hover { color: #fff !important; }
.hp-club-img-wrap {
  border-radius: 16px; overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  aspect-ratio: 4 / 3;
}
.hp-club-img { width: 100%; height: 100%; object-fit: cover; display: block; }

/* ══════════════════════════════════════════════════════════
   PRODUCTION — theatrical marquee
══════════════════════════════════════════════════════════ */
.hp-prod-section {
  position: relative;
  background: #100718;
  padding: 4.5rem 2rem;
  overflow: hidden;
}

/* Archive image as atmospheric texture */
.hp-prod-stage-texture {
  position: absolute;
  inset: 0;
  background: url("/images/theatre/archive/agwow-condor.webp") center / cover no-repeat;
  opacity: 0.14;
  z-index: 0;
}
/* Layered vignette over texture */
.hp-prod-stage-vignette {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(to right,  rgba(16,7,24,0.82) 0%, rgba(16,7,24,0.25) 60%, rgba(16,7,24,0.60) 100%),
    linear-gradient(to bottom, rgba(16,7,24,0.55) 0%, rgba(16,7,24,0.0) 40%, rgba(16,7,24,0.65) 100%);
  z-index: 1;
}

.hp-prod-inner {
  position: relative;
  z-index: 2;
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 4rem;
  align-items: center;
}
@media (max-width: 780px) { .hp-prod-inner { grid-template-columns: 1fr; gap: 2.5rem; } }

/* Poster — larger, more dramatic */
.hp-prod-poster-wrap {
  width: 260px;
  border-radius: 14px;
  overflow: hidden;
  position: relative;
  box-shadow:
    0 0 0 1px rgba(255,204,0,0.15),
    0 28px 70px rgba(0,0,0,0.75),
    0 8px 24px rgba(0,0,0,0.55);
  flex-shrink: 0;
}
/* Gold border glow on poster */
.hp-prod-poster-glow {
  position: absolute;
  inset: 0;
  border-radius: 14px;
  border: 2px solid rgba(255,204,0,0.22);
  pointer-events: none;
}
@media (max-width: 780px) {
  .hp-prod-poster-wrap { width: 100%; max-width: 280px; margin: 0 auto; }
}
.hp-prod-poster { width: 100%; height: auto; display: block; }

/* Title — marquee scale */
.hp-prod-title {
  font-family: "Anton", sans-serif !important;
  font-size: clamp(2.4rem, 5.5vw, 4.8rem);
  color: #FFCC00;
  margin: 0.7rem 0 0;
  line-height: 1.0;
  text-transform: uppercase;
  text-shadow: 0 4px 30px rgba(0,0,0,0.5);
  letter-spacing: 0.01em;
}

/* Meta block — left-bordered accent */
.hp-prod-meta-block {
  border-left: 3px solid rgba(255,204,0,0.35);
  padding-left: 1rem;
  margin: 1.1rem 0 0;
}
.hp-prod-meta {
  font-family: var(--font-space-grotesk), "Space Grotesk", sans-serif;
  font-size: 1rem; font-weight: 600;
  color: rgba(246,228,193,0.75);
  margin: 0 0 0.3rem; letter-spacing: 0.04em;
}
.hp-prod-sub {
  font-family: var(--font-dm-sans), "DM Sans", sans-serif;
  font-size: 0.88rem;
  color: rgba(246,228,193,0.5);
  margin: 0 0 0.25rem;
}
.hp-prod-italic { font-style: italic; }

.hp-prod-actions {
  display: flex; align-items: center;
  gap: 1.75rem; flex-wrap: wrap;
  margin-top: 2rem;
}
/* Main CTA — gold, bold, unmissable */
.hp-prod-btn {
  display: inline-flex; align-items: center;
  padding: 1rem 2.5rem;
  background: #FFCC00;
  color: #241123;
  font-family: var(--font-space-grotesk), "Space Grotesk", sans-serif;
  font-size: 0.95rem; font-weight: 800;
  text-transform: uppercase; letter-spacing: 0.22em;
  border: none; border-radius: 12px; cursor: pointer;
  box-shadow: 0 6px 28px rgba(255,204,0,0.28), 0 2px 8px rgba(0,0,0,0.3);
  transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}
.hp-prod-btn:hover {
  background: #ffe640;
  transform: translateY(-2px);
  box-shadow: 0 10px 36px rgba(255,204,0,0.42), 0 4px 12px rgba(0,0,0,0.35);
}
.hp-prod-alt-link {
  font-family: var(--font-dm-sans), "DM Sans", sans-serif;
  font-size: 0.88rem; font-weight: 600;
  color: rgba(246,228,193,0.48) !important;
  transition: color 0.18s ease;
}
.hp-prod-alt-link:hover { color: rgba(246,228,193,0.85) !important; }

/* ══════════════════════════════════════════════════════════
   COMMUNITY ACCORDION
══════════════════════════════════════════════════════════ */
.hp-community-band { padding: 3.5rem 0 4.5rem; }
.hp-community-wrap { max-width: 1200px; margin: 0 auto; padding: 0 2rem; }

/* Section header — strong on kraft */
.hp-community-band-header { margin-bottom: 2.25rem; }

.hp-community-eyebrow {
  font-family: var(--font-space-grotesk), "Space Grotesk", sans-serif;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.28em;
  color: #241123;
  opacity: 0.72;
  margin: 0 0 0.45rem;
}

.hp-community-band-title {
  font-family: var(--font-space-grotesk), "Space Grotesk", system-ui, sans-serif !important;
  font-size: clamp(2.2rem, 4.5vw, 3.4rem);
  font-weight: 800;
  color: #241123;
  margin: 0 0 0.5rem;
  line-height: 1.1;
  opacity: 0.92;
}

.hp-community-band-sub {
  font-family: var(--font-dm-sans), "DM Sans", system-ui, sans-serif;
  font-size: 1rem;
  font-weight: 500;
  color: rgba(36,17,35,0.72);
  margin: 0;
  line-height: 1.55;
  max-width: 600px;
}

/* FLEX grid — CSS-var-driven column count */
.hp-community-grid {
  position: relative; z-index: 1;
  display: flex; flex-wrap: wrap;
  --hp-gap: clamp(14px, 1.6vw, 24px);
  --hp-cols: 4;
  gap: var(--hp-gap);
  align-items: flex-start;
  box-sizing: border-box;
}
.hp-community-card {
  flex: 0 1 calc((100% - (var(--hp-cols) - 1) * var(--hp-gap)) / var(--hp-cols));
  position: relative;
  display: flex; flex-direction: column;
  box-sizing: border-box;
  padding: 1rem 1.1rem 0.3rem;
  border-radius: 12px;
  background: rgba(255,255,255,0.42);
  border: 1px solid rgba(36,17,35,0.08);
  box-shadow: 0 4px 14px rgba(36,17,35,0.10);
  transition: background 0.2s ease, box-shadow 0.2s ease;
  text-align: left;
  overflow: visible;
}
.hp-community-card[data-open="true"]  { padding-bottom: 1rem; }
.hp-community-card[data-open="false"] { padding-bottom: 0.3rem !important; }

@media (max-width: 1000px) { .hp-community-grid { --hp-cols: 2; } }
@media (max-width: 540px)  { .hp-community-grid { --hp-cols: 1; } }

/* Colored pill button */
.hp-card-cta-bar {
  display: block; width: 100%; box-sizing: border-box;
  border-radius: 12px; padding: 0.7rem 0.9rem; margin: 0 0 0.75rem;
  border: 1px solid rgba(0,0,0,0.08);
  font-family: var(--font-space-grotesk), "Space Grotesk", system-ui, sans-serif;
  font-weight: 700; font-size: 0.82rem; line-height: 1.2;
  letter-spacing: 0.14em; text-transform: uppercase; text-align: center;
  cursor: pointer;
  transition: transform 120ms ease, box-shadow 120ms ease, background-color 120ms ease;
}
.hp-card-cta-bar:hover { transform: translateY(-1px); box-shadow: 0 2px 10px rgba(0,0,0,0.12); }
.hp-card-cta-bar--pink   { background: #F23359; color: #f2f2f2; }
.hp-card-cta-bar--purple { background: #6C00AF; color: #f2f2f2; }
.hp-card-cta-bar--green  { background: #2FA873; color: #f2f2f2; }
.hp-card-cta-bar--yellow { background: #D9A919; color: #241123; }
.hp-card-cta-bar--pink:hover   { background: rgba(164,2,35,0.92); }
.hp-card-cta-bar--purple:hover { background: rgba(62,0,101,0.92); }
.hp-card-cta-bar--green:hover  { background: rgba(13,111,68,0.92); }
.hp-card-cta-bar--yellow:hover { background: rgba(187,141,3,0.92); }

/* Description */
.hp-card-desc {
  margin: 0.3rem 0 0.1rem;
  font-family: var(--font-dm-sans), "DM Sans", system-ui, sans-serif;
  color: #241123; font-size: 0.95rem; line-height: 1.5; text-align: left;
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
  margin: 0.15rem -6px 0 0;
  padding: 0;
  background: transparent; border: none; cursor: pointer;
}
.hp-chev-toggle svg {
  width: 30px; height: 30px; display: block;
  opacity: 0.7; transition: transform 0.2s ease, opacity 0.2s ease;
}
.hp-chev-toggle path {
  fill: none; stroke: #241123;
  stroke-width: 1.75; stroke-linecap: round; stroke-linejoin: round;
}
.hp-chev-toggle:hover svg { opacity: 1; }
.hp-chev-toggle[aria-expanded="true"] svg { transform: rotate(180deg); }

.hp-community-card[data-open="true"] .hp-chev-toggle {
  position: absolute; right: 12px; bottom: 6px; padding-left: 28px;
}
.hp-community-card[data-open="true"] .hp-mini-buttons-row {
  padding-right: 36px; padding-bottom: 0.75px; margin-bottom: 0;
}

/* Animated reveal */
.hp-reveal-wrap {
  max-height: 0; overflow: hidden;
  transition: max-height 280ms ease;
}
@media (prefers-reduced-motion: reduce) {
  .hp-reveal-wrap { transition: none; }
  .hp-chev-toggle svg { transition: none; }
}

/* Mini link buttons */
.hp-mini-buttons-row {
  margin-top: 0.75rem; display: flex; gap: 0.6rem;
  flex-wrap: wrap; justify-content: flex-start;
}
.hp-mini-btn {
  display: inline-flex; align-items: center; justify-content: flex-start;
  padding: 0.55rem 0.9rem;
  border-radius: 12px; border: 1px solid transparent; background: transparent;
  cursor: pointer;
  font-family: var(--font-space-grotesk), "Space Grotesk", system-ui, sans-serif;
  font-weight: 600; text-transform: uppercase; letter-spacing: 0.16em;
  font-size: 0.7rem; line-height: 1.1;
  transition: background-color 120ms ease, border-color 120ms ease, color 120ms ease, transform 120ms ease;
}
.hp-mini-btn span { text-align: left; }
.hp-mini-btn--pink   { color: rgba(168,2,35,1);  background: rgba(242,51,89,0.18);   border-color: rgba(242,51,89,1); }
.hp-mini-btn--purple { color: rgba(80,0,130,1);  background: rgba(108,0,175,0.18);   border-color: rgba(108,0,175,1); }
.hp-mini-btn--green  { color: rgba(3,37,22,1);   background: rgba(47,168,115,0.26);  border-color: rgba(26,209,130,1); }
.hp-mini-btn--yellow { color: rgba(52,39,0,1);   background: rgba(217,169,25,0.30);  border-color: rgba(243,183,5,1); }
.hp-mini-btn:hover { transform: translateY(-0.5px); color: #fff; }
.hp-mini-btn--pink:hover   { background: rgba(231,44,81,0.60);  border-color: rgba(242,51,89,1); }
.hp-mini-btn--purple:hover { background: rgba(97,2,156,0.60);   border-color: rgba(108,0,175,1); }
.hp-mini-btn--green:hover  { background: rgba(47,168,115,0.66); border-color: rgba(26,209,130,1); }
.hp-mini-btn--yellow:hover { background: rgba(217,169,25,0.86); border-color: rgba(243,183,5,1); }

/* ══════════════════════════════════════════════════════════
   EVENTS STRIP — dark theatrical band, up to 3 cards
══════════════════════════════════════════════════════════ */
.hp-events-section {
  position: relative;
  background: #0d0a14;
  padding: 4rem 2rem 4.5rem;
  overflow: hidden;
}
.hp-events-stage-texture {
  position: absolute;
  inset: 0;
  background: url("/images/theatre/esmeraldas_dumbshow.webp") center 30% / cover no-repeat;
  opacity: 0.07;
  z-index: 0;
}
.hp-events-inner {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
}
.hp-events-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 2rem;
}
.hp-events-title {
  font-family: "Anton", sans-serif;
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 400;
  color: #fff;
  margin: 0.4rem 0 0;
  line-height: 1;
}
.hp-events-see-all {
  font-family: var(--font-dm-sans), "DM Sans", sans-serif;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(255,204,0,0.7) !important;
  white-space: nowrap;
  transition: color 0.18s;
  padding-bottom: 0.25rem;
}
.hp-events-see-all:hover { color: #FFCC00 !important; }

/* Card grid — 2 cards at ~50% viewport */
.hp-events-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;
}
@media (max-width: 640px) {
  .hp-events-grid { grid-template-columns: 1fr; }
}

/* Individual event card */
.hp-event-card {
  position: relative;
  display: flex;
  flex-direction: column;
  border-radius: 14px;
  overflow: hidden;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  text-decoration: none !important;
  color: #fff;
  transition: transform 0.22s ease, box-shadow 0.22s ease;
  min-height: 220px;
}
.hp-event-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0,0,0,0.4);
  border-color: rgba(255,255,255,0.14);
}
.hp-event-card-img {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  background-color: #1a0f22;
}
.hp-event-card-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(10,5,18,0.35) 0%,
    rgba(10,5,18,0.72) 60%,
    rgba(10,5,18,0.93) 100%
  );
}
.hp-event-card-body {
  position: relative;
  z-index: 1;
  display: flex;
  gap: 0.85rem;
  align-items: flex-start;
  padding: 1.1rem 1.1rem 0.9rem;
  flex: 1;
}
.hp-event-date-badge {
  flex-shrink: 0;
  width: 44px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.35rem 0.2rem;
  line-height: 1;
}
.hp-event-badge-day {
  font-family: "Anton", sans-serif;
  font-size: 1.5rem;
  font-weight: 400;
  color: #fff;
  display: block;
}
.hp-event-badge-mo {
  font-family: var(--font-dm-sans), "DM Sans", sans-serif;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.85);
  display: block;
  margin-top: 1px;
}
.hp-event-card-text { flex: 1; min-width: 0; }
.hp-event-cat-label {
  display: block;
  font-family: var(--font-dm-sans), "DM Sans", sans-serif;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  margin-bottom: 0.25rem;
}
.hp-event-card-title {
  font-family: var(--font-space-grotesk), "Space Grotesk", sans-serif;
  font-size: 1rem;
  font-weight: 700;
  color: #fff;
  margin: 0 0 0.2rem;
  line-height: 1.3;
}
.hp-event-card-venue {
  font-family: var(--font-dm-sans), "DM Sans", sans-serif;
  font-size: 0.78rem;
  color: rgba(255,255,255,0.55);
  margin: 0;
}
.hp-event-card-dates {
  font-family: var(--font-dm-sans), "DM Sans", sans-serif;
  font-size: 0.75rem;
  color: rgba(255,255,255,0.4);
  margin: 0.2rem 0 0;
}

/* Ticket info bar at bottom of card */
.hp-event-card-ticket-bar {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 1.1rem;
  border-top: 1px solid;
  border-top-color: rgba(255,255,255,0.12);
  font-family: var(--font-dm-sans), "DM Sans", sans-serif;
  font-size: 0.75rem;
}
.hp-event-ticket-cta {
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.7);
}
.hp-event-card:hover .hp-event-ticket-cta { color: #fff; }

      `}</style>

    </main>
  );
}
