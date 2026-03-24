"use client";

import Link from "next/link";
import { useRef, useEffect } from "react";
import {
  upcomingByCategory,
  pastEvents,
  formatDateRange,
  shortMonth,
  dayOfMonth,
  eventYear,
  categoryMeta,
  type DatEvent,
} from "@/lib/events";

// ── Festival card ─────────────────────────────────────────────────────────────

function FestCard({ event, index }: { event: DatEvent; index: number }) {
  const accent = categoryMeta.festival.color; // #2493A9
  const isFeatured = event.featured;

  if (isFeatured) {
    return (
      <div
        className="fest-card fest-card--featured"
        style={{ backgroundImage: event.image ? `url('${event.image}')` : undefined }}
      >
        <div className="fest-card-overlay" />
        <div className="fest-card-inner">
          <div className="fest-card-top">
            <div className="fest-featured-badge" style={{ background: accent }}>
              DAT Featured
            </div>
            <div className="fest-date-range" style={{ borderColor: accent }}>
              <span className="fest-range-text">{formatDateRange(event.date, event.endDate)}</span>
            </div>
          </div>
          <div className="fest-card-body">
            <span className="fest-card-eyebrow" style={{ color: accent }}>
              {categoryMeta.festival.eyebrow}
            </span>
            <h2 className="fest-card-title-lg">{event.title}</h2>
            {event.subtitle && (
              <p className="fest-card-subtitle">{event.subtitle}</p>
            )}
            <p className="fest-card-loc">
              {event.venue} · {event.city}, {event.country}
            </p>
            <p className="fest-card-desc">{event.description}</p>
            <div className="fest-card-actions">
              {event.ticketUrl && (
                <a
                  href={event.ticketUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="fest-btn-ticket"
                  style={{ background: accent }}
                >
                  Learn More &amp; Register →
                </a>
              )}
              {event.ticketPrice && (
                <span className="fest-price-tag">{event.ticketPrice}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fest-card"
      style={{
        backgroundImage: event.image ? `url('${event.image}')` : undefined,
        animationDelay: `${index * 80}ms`,
      }}
    >
      <div className="fest-card-overlay" />
      <div className="fest-card-inner">
        <div className="fest-card-top">
          {event.endDate ? (
            <div className="fest-multi-stamp" style={{ borderColor: accent }}>
              <span className="fest-multi-month">{shortMonth(event.date)}</span>
              <span className="fest-multi-days">
                {dayOfMonth(event.date)}–{dayOfMonth(event.endDate)}
              </span>
              <span className="fest-multi-year">{eventYear(event.date)}</span>
            </div>
          ) : (
            <div className="fest-single-stamp" style={{ borderColor: accent }}>
              <span className="fest-single-day">{dayOfMonth(event.date)}</span>
              <span className="fest-single-month">{shortMonth(event.date)}</span>
            </div>
          )}
        </div>
        <div className="fest-card-body">
          <span className="fest-card-eyebrow" style={{ color: accent }}>
            {event.country}
          </span>
          <h3 className="fest-card-title">{event.title}</h3>
          {event.subtitle && (
            <p className="fest-card-subtitle">{event.subtitle}</p>
          )}
          <p className="fest-card-loc">
            {event.city}
            {event.venue && event.venue !== "Various Venues" ? ` · ${event.venue}` : ""}
          </p>
          <p className="fest-card-desc">{event.description}</p>
          <div className="fest-card-actions">
            {event.ticketUrl && (
              <a
                href={event.ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="fest-btn-ticket"
                style={{ background: accent }}
              >
                {event.ticketType === "free" ? "Free — Info →" : "Info & Tickets →"}
              </a>
            )}
            {event.ticketPrice && (
              <span className="fest-price-tag">{event.ticketPrice}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function FestivalsPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const onScroll = () => {
      el.style.backgroundPositionY = `calc(35% + ${window.scrollY * 0.25}px)`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const upcoming = upcomingByCategory("festival");
  const past = pastEvents.filter((e) => e.category === "festival");
  const accent = categoryMeta.festival.color;

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div
        ref={heroRef}
        className="fest-hero"
        style={{ backgroundImage: "url('/images/Andean_Mask_Work.jpg')" }}
      >
        <div className="fest-hero-overlay" />
        <div className="fest-hero-teal-glow" />
        <div className="fest-hero-content">
          <nav className="fest-breadcrumb">
            <Link href="/events">Events</Link>
            <span>/</span>
            <span>Festivals</span>
          </nav>
          <p className="fest-eyebrow" style={{ color: accent }}>Festivals &amp; Showcases</p>
          <h1 className="fest-hero-headline">
            WHERE<br />THEATRE<br />MEETS<br />THE WORLD.
          </h1>
          <p className="fest-hero-sub">
            DAT performs and participates in festivals across the globe — from Edinburgh to Bogotá,
            from Reykjavík to regional stages you&apos;ve never heard of yet.
          </p>
          <div className="fest-hero-strip">
            {upcoming.slice(0, 3).map((ev) => (
              <div key={ev.id} className="fest-hero-strip-item">
                <span className="fest-strip-city">{ev.city}</span>
                <span className="fest-strip-date">{shortMonth(ev.date)} {eventYear(ev.date)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Event listing ─────────────────────────────────────────────────── */}
      <section className="fest-listing">
        <div className="fest-container">
          <p className="fest-section-eyebrow" style={{ color: accent }}>
            {upcoming.length} Upcoming
          </p>
          {upcoming.length === 0 ? (
            <div className="fest-empty">
              <div className="fest-empty-icon">🌐</div>
              <h2 className="fest-empty-title">No festivals announced yet.</h2>
              <p className="fest-empty-body">
                Festival bookings are confirmed closer to the season. Follow us for updates.
              </p>
            </div>
          ) : (
            <div className="fest-grid">
              {upcoming.map((ev, i) => (
                <FestCard key={ev.id} event={ev} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Why festivals matter ──────────────────────────────────────────── */}
      <section className="fest-about-band">
        <div className="fest-container fest-about-grid">
          <div>
            <p className="fest-about-eyebrow" style={{ color: accent }}>
              DAT &amp; The Festival Circuit
            </p>
            <h2 className="fest-about-title">
              The Whole World<br />Is a Stage
            </h2>
          </div>
          <div>
            <p className="fest-about-body">
              Festivals are where theatre communities find each other. For DAT, the festival
              circuit is how we take work made in rural Ecuador or coastal Tanzania to audiences
              in Edinburgh, New York, and beyond — and how we stay connected to the global
              conversation about what theatre can do.
            </p>
            <p className="fest-about-body">
              We also perform in cities, communities, and venues that don&apos;t have a festival
              attached. Anywhere there&apos;s an audience ready to lean forward.
            </p>
            <div className="fest-about-stats">
              <div className="fest-stat">
                <span className="fest-stat-num" style={{ color: accent }}>16+</span>
                <span className="fest-stat-label">International festivals</span>
              </div>
              <div className="fest-stat">
                <span className="fest-stat-num" style={{ color: accent }}>24+</span>
                <span className="fest-stat-label">Countries performed in</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Past festivals ────────────────────────────────────────────────── */}
      {past.length > 0 && (
        <section className="fest-past-section">
          <div className="fest-container">
            <p className="fest-past-eyebrow">Archive</p>
            <h2 className="fest-past-heading">Past Festivals</h2>
            <div className="fest-past-list">
              {past.map((ev) => (
                <div key={ev.id} className="fest-past-row">
                  <div className="fest-past-date">
                    <span className="fest-past-month">{shortMonth(ev.date)}</span>
                    <span className="fest-past-year">{eventYear(ev.date)}</span>
                  </div>
                  <div>
                    <h4 className="fest-past-title">{ev.title}</h4>
                    <p className="fest-past-loc">{ev.city}, {ev.country}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Bottom CTA ─────────────────────────────────────────────────── */}
      <section className="fest-bottom-band">
        <div className="fest-container fest-bottom-inner">
          <p className="fest-bottom-label">Explore More</p>
          <div className="fest-bottom-links">
            <Link href="/events/performances" className="fest-bottom-link fest-pink">
              Upcoming Performances →
            </Link>
            <Link href="/events/fundraisers" className="fest-bottom-link fest-gold">
              Fundraisers &amp; Community Nights →
            </Link>
            <Link href="/events" className="fest-bottom-link fest-muted">
              ← All Events
            </Link>
          </div>
        </div>
      </section>

      <style>{`
        .fest-container {
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 clamp(1.25rem, 5vw, 3rem);
        }

        /* ── Hero ─────────────────────────────────────────────────────── */
        .fest-hero {
          position: relative;
          min-height: 80vh;
          background-size: cover;
          background-position: center 35%;
          display: flex;
          align-items: flex-end;
          overflow: hidden;
        }
        .fest-hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to top,
            rgba(5,15,20,0.96) 0%,
            rgba(5,15,20,0.6) 40%,
            rgba(5,15,20,0.2) 100%
          );
        }
        .fest-hero-teal-glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 70% 55% at 10% 85%, rgba(36,147,169,0.2) 0%, transparent 60%);
        }
        .fest-hero-content {
          position: relative;
          z-index: 2;
          padding: 0 clamp(1.5rem, 6vw, 5rem) clamp(2.5rem, 5vw, 4.5rem);
          max-width: 700px;
        }
        .fest-breadcrumb {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-family: "DM Sans", sans-serif;
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.4);
          margin-bottom: 1.25rem;
        }
        .fest-breadcrumb a { color: rgba(255,255,255,0.4); text-decoration: none; transition: color 0.2s; }
        .fest-breadcrumb a:hover { color: #2493A9; }
        .fest-eyebrow {
          font-family: "DM Sans", sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          margin: 0 0 0.75rem;
        }
        .fest-hero-headline {
          font-family: "Anton", sans-serif;
          font-size: clamp(3rem, 8.5vw, 7.5rem);
          font-weight: 400;
          line-height: 0.9;
          color: #fff;
          margin: 0 0 1.25rem;
          letter-spacing: 0.01em;
          text-shadow: 0 2px 24px rgba(0,0,0,0.5);
        }
        .fest-hero-sub {
          font-family: "Space Grotesk", sans-serif;
          font-size: clamp(0.95rem, 2vw, 1.1rem);
          color: rgba(255,255,255,0.68);
          line-height: 1.65;
          margin: 0 0 2.25rem;
          max-width: 480px;
        }
        .fest-hero-strip {
          display: flex;
          flex-wrap: wrap;
          gap: 0 2rem;
        }
        .fest-hero-strip-item {
          display: flex;
          flex-direction: column;
          padding: 0.5rem 0;
          border-top: 1px solid rgba(36,147,169,0.35);
          min-width: 90px;
        }
        .fest-strip-city {
          font-family: "DM Sans", sans-serif;
          font-size: 0.82rem;
          font-weight: 700;
          color: rgba(255,255,255,0.75);
          letter-spacing: 0.06em;
        }
        .fest-strip-date {
          font-family: "DM Sans", sans-serif;
          font-size: 0.68rem;
          font-weight: 600;
          color: rgba(36,147,169,0.8);
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        /* ── Listing ──────────────────────────────────────────────────── */
        .fest-listing {
          background: #05141a;
          padding: clamp(3rem, 6vw, 5rem) 0;
        }
        .fest-section-eyebrow {
          font-family: "DM Sans", sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          margin: 0 0 1.75rem;
        }
        .fest-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
          gap: 1.5rem;
        }

        /* ── Cards ────────────────────────────────────────────────────── */
        .fest-card {
          position: relative;
          border-radius: 14px;
          overflow: hidden;
          min-height: 400px;
          background: #0a1e24;
          background-size: cover;
          background-position: center;
          display: flex;
          flex-direction: column;
          transition: transform 0.3s, box-shadow 0.3s;
        }
        .fest-card--featured {
          min-height: 500px;
          grid-column: 1 / -1;
        }
        .fest-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 50px rgba(36,147,169,0.2);
        }
        .fest-card-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to top,
            rgba(5,15,20,0.96) 0%,
            rgba(5,15,20,0.55) 45%,
            rgba(5,15,20,0.12) 100%
          );
        }
        .fest-card-inner {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          flex: 1;
          padding: 1.75rem;
          gap: 0;
        }
        .fest-card-top {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .fest-featured-badge {
          font-family: "DM Sans", sans-serif;
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #fff;
          padding: 0.3rem 0.75rem;
          border-radius: 4px;
        }
        .fest-date-range {
          border-left: 3px solid;
          padding-left: 0.75rem;
        }
        .fest-range-text {
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.88rem;
          font-weight: 600;
          color: rgba(255,255,255,0.75);
        }
        .fest-multi-stamp {
          border-left: 3px solid;
          padding-left: 0.75rem;
          display: flex;
          flex-direction: column;
        }
        .fest-multi-month {
          font-family: "DM Sans", sans-serif;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          color: rgba(255,255,255,0.5);
        }
        .fest-multi-days {
          font-family: "Anton", sans-serif;
          font-size: 2.5rem;
          color: #fff;
          line-height: 1;
        }
        .fest-multi-year {
          font-family: "DM Sans", sans-serif;
          font-size: 0.65rem;
          color: rgba(255,255,255,0.3);
          letter-spacing: 0.1em;
        }
        .fest-single-stamp {
          border-left: 3px solid;
          padding-left: 0.75rem;
          display: flex;
          flex-direction: column;
        }
        .fest-single-day {
          font-family: "Anton", sans-serif;
          font-size: 3rem;
          color: #fff;
          line-height: 1;
        }
        .fest-single-month {
          font-family: "DM Sans", sans-serif;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          color: rgba(255,255,255,0.5);
        }
        .fest-card-body { display: flex; flex-direction: column; gap: 0.4rem; }
        .fest-card-eyebrow {
          font-family: "DM Sans", sans-serif;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
        }
        .fest-card-title-lg {
          font-family: "Anton", sans-serif;
          font-size: clamp(1.8rem, 3.5vw, 3rem);
          color: #fff;
          margin: 0;
          line-height: 1;
        }
        .fest-card-title {
          font-family: "Anton", sans-serif;
          font-size: 1.6rem;
          color: #fff;
          margin: 0;
          line-height: 1;
        }
        .fest-card-subtitle {
          font-family: "DM Sans", sans-serif;
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.4);
          margin: 0;
        }
        .fest-card-loc {
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.85rem;
          color: rgba(255,255,255,0.5);
          margin: 0;
        }
        .fest-card-desc {
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.88rem;
          color: rgba(255,255,255,0.65);
          line-height: 1.6;
          margin: 0.25rem 0 0;
          max-width: 520px;
        }
        .fest-card-actions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.75rem;
          margin-top: 1rem;
        }
        .fest-btn-ticket {
          font-family: "DM Sans", sans-serif;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          text-decoration: none;
          color: #fff;
          padding: 0.7rem 1.5rem;
          border-radius: 8px;
          transition: opacity 0.2s, transform 0.15s;
          display: inline-block;
        }
        .fest-btn-ticket:hover { opacity: 0.85; transform: translateY(-1px); }
        .fest-price-tag {
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.82rem;
          color: rgba(255,255,255,0.4);
        }
        .fest-empty {
          text-align: center;
          padding: 5rem 1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }
        .fest-empty-icon { font-size: 3rem; }
        .fest-empty-title {
          font-family: "Anton", sans-serif;
          font-size: clamp(1.8rem, 4vw, 2.8rem);
          color: #fff;
          margin: 0;
        }
        .fest-empty-body {
          font-family: "Space Grotesk", sans-serif;
          font-size: 1rem;
          color: rgba(255,255,255,0.5);
          max-width: 380px;
          line-height: 1.65;
          margin: 0;
        }

        /* ── About band ───────────────────────────────────────────────── */
        .fest-about-band {
          background: #f6e4c1;
          padding: clamp(3.5rem, 7vw, 6rem) 0;
        }
        .fest-about-grid {
          display: grid;
          grid-template-columns: 1fr 1.6fr;
          gap: clamp(2.5rem, 6vw, 5rem);
          align-items: start;
        }
        @media (max-width: 700px) {
          .fest-about-grid { grid-template-columns: 1fr; }
        }
        .fest-about-eyebrow {
          font-family: "DM Sans", sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          margin: 0 0 0.6rem;
        }
        .fest-about-title {
          font-family: "Anton", sans-serif;
          font-size: clamp(2rem, 4vw, 3.2rem);
          color: #241123;
          margin: 0;
          line-height: 1;
        }
        .fest-about-body {
          font-family: "Space Grotesk", sans-serif;
          font-size: 1rem;
          color: #241123;
          line-height: 1.75;
          margin: 0 0 1rem;
        }
        .fest-about-body:last-of-type { margin-bottom: 0; }
        .fest-about-stats {
          display: flex;
          gap: 2.5rem;
          margin-top: 2rem;
          flex-wrap: wrap;
        }
        .fest-stat { display: flex; flex-direction: column; gap: 0.2rem; }
        .fest-stat-num {
          font-family: "Anton", sans-serif;
          font-size: 2.8rem;
          line-height: 1;
        }
        .fest-stat-label {
          font-family: "DM Sans", sans-serif;
          font-size: 0.78rem;
          font-weight: 600;
          color: #5a4060;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        /* ── Past section ─────────────────────────────────────────────── */
        .fest-past-section {
          background: #0a1e24;
          padding: clamp(3rem, 5vw, 4rem) 0;
        }
        .fest-past-eyebrow {
          font-family: "DM Sans", sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.3);
          margin: 0 0 0.5rem;
        }
        .fest-past-heading {
          font-family: "Anton", sans-serif;
          font-size: clamp(1.8rem, 3vw, 2.5rem);
          color: #fff;
          margin: 0 0 2rem;
        }
        .fest-past-list {
          border-top: 1px solid rgba(255,255,255,0.07);
        }
        .fest-past-row {
          display: grid;
          grid-template-columns: 80px 1fr;
          gap: 1.5rem;
          align-items: center;
          padding: 1rem 0;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .fest-past-date { display: flex; flex-direction: column; }
        .fest-past-month {
          font-family: "DM Sans", sans-serif;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          color: rgba(36,147,169,0.6);
        }
        .fest-past-year {
          font-family: "Anton", sans-serif;
          font-size: 1.2rem;
          color: rgba(255,255,255,0.2);
        }
        .fest-past-title {
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.95rem;
          font-weight: 700;
          color: rgba(255,255,255,0.5);
          margin: 0 0 0.2rem;
        }
        .fest-past-loc {
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.8rem;
          color: rgba(255,255,255,0.28);
          margin: 0;
        }

        /* ── Bottom band ──────────────────────────────────────────────── */
        .fest-bottom-band {
          background: #241123;
          padding: clamp(2.5rem, 5vw, 4rem) 0;
        }
        .fest-bottom-inner { display: flex; flex-direction: column; gap: 1.25rem; }
        .fest-bottom-label {
          font-family: "DM Sans", sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.35);
          margin: 0;
        }
        .fest-bottom-links { display: flex; flex-wrap: wrap; gap: 0.75rem; }
        .fest-bottom-link {
          font-family: "DM Sans", sans-serif;
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          text-decoration: none;
          padding: 0.65rem 1.4rem;
          border-radius: 8px;
          transition: opacity 0.2s, transform 0.15s;
        }
        .fest-bottom-link:hover { opacity: 0.8; transform: translateY(-1px); }
        .fest-pink { background: #F23359; color: #fff; }
        .fest-gold { background: #D9A919; color: #241123; }
        .fest-muted { color: rgba(255,255,255,0.4); border: 1.5px solid rgba(255,255,255,0.15); }
      `}</style>
    </>
  );
}
