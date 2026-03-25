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
  getEventImage,
  type DatEvent,
} from "@/lib/events";

// ── Full event card ───────────────────────────────────────────────────────────

function PerfCard({ event, index }: { event: DatEvent; index: number }) {
  const accent = categoryMeta.performance.color;
  const isFeatured = event.featured;

  if (isFeatured) {
    return (
      <div
        className="perf-card perf-card--featured"
        style={{
          backgroundImage: getEventImage(event) ? `url('${getEventImage(event)}')` : undefined,
        }}
      >
        <div className="perf-card-overlay" />
        <div className="perf-card-inner">
          <div className="perf-card-header">
            {event.endDate ? (
              <div className="perf-multiday-badge" style={{ borderColor: accent }}>
                <span className="perf-badge-month">{shortMonth(event.date)}</span>
                <span className="perf-badge-range">
                  {dayOfMonth(event.date)}–{dayOfMonth(event.endDate)}
                </span>
                <span className="perf-badge-year">{eventYear(event.date)}</span>
              </div>
            ) : (
              <div className="perf-date-stamp" style={{ borderColor: accent }}>
                <span className="perf-stamp-day">{dayOfMonth(event.date)}</span>
                <span className="perf-stamp-month">{shortMonth(event.date)}</span>
                <span className="perf-stamp-year">{eventYear(event.date)}</span>
              </div>
            )}
            <div className="perf-featured-tag" style={{ background: accent }}>
              Featured
            </div>
          </div>
          <div className="perf-card-body">
            <span className="perf-card-eyebrow" style={{ color: accent }}>
              Live Performance
            </span>
            <h2 className="perf-card-title-lg">{event.title}</h2>
            {event.subtitle && (
              <p className="perf-card-subtitle">{event.subtitle}</p>
            )}
            <p className="perf-card-loc">
              {event.venue} · {event.city}, {event.country}
            </p>
            {event.doors && (
              <p className="perf-card-doors">{event.doors}</p>
            )}
            <p className="perf-card-desc">{event.description}</p>
            <div className="perf-card-actions">
              {event.ticketUrl && (
                <a
                  href={event.ticketUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="perf-btn-ticket"
                  style={{ background: accent }}
                >
                  {event.ticketType === "free" ? "Register Free →" : "Get Tickets →"}
                </a>
              )}
              {event.ticketPrice && (
                <span className="perf-price-tag">{event.ticketPrice}</span>
              )}
              {event.production && (
                <Link href={`/theatre/${event.production}`} className="perf-production-link">
                  Full Production →
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="perf-card"
      style={{
        backgroundImage: getEventImage(event) ? `url('${getEventImage(event)}')` : undefined,
        animationDelay: `${index * 60}ms`,
      }}
    >
      <div className="perf-card-overlay" />
      <div className="perf-card-inner">
        <div className="perf-card-header">
          <div className="perf-date-stamp" style={{ borderColor: accent }}>
            <span className="perf-stamp-day">{dayOfMonth(event.date)}</span>
            <span className="perf-stamp-month">{shortMonth(event.date)}</span>
            <span className="perf-stamp-year">{eventYear(event.date)}</span>
          </div>
        </div>
        <div className="perf-card-body">
          <span className="perf-card-eyebrow" style={{ color: accent }}>
            {event.endDate ? "Multi-Night Run" : "One Night Only"}
          </span>
          <h3 className="perf-card-title">{event.title}</h3>
          {event.subtitle && (
            <p className="perf-card-subtitle">{event.subtitle}</p>
          )}
          <p className="perf-card-loc">
            {event.venue} · {event.city}
          </p>
          {event.time && (
            <p className="perf-card-time">{event.time}</p>
          )}
          <p className="perf-card-desc">{event.description}</p>
          <div className="perf-card-actions">
            {event.ticketUrl && (
              <a
                href={event.ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="perf-btn-ticket"
                style={{ background: accent }}
              >
                {event.ticketType === "free" ? "Register Free →" : "Get Tickets →"}
              </a>
            )}
            {event.ticketPrice && (
              <span className="perf-price-tag">{event.ticketPrice}</span>
            )}
            {event.production && (
              <Link href={`/theatre/${event.production}`} className="perf-production-link">
                Full Production →
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Past performance row ──────────────────────────────────────────────────────

function PastRow({ event }: { event: DatEvent }) {
  return (
    <div className="perf-past-row">
      <div className="perf-past-date">
        <span className="perf-past-month">{shortMonth(event.date)}</span>
        <span className="perf-past-year">{eventYear(event.date)}</span>
      </div>
      <div className="perf-past-body">
        <h4 className="perf-past-title">{event.title}</h4>
        <p className="perf-past-loc">
          {event.venue} · {event.city}, {event.country}
        </p>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function PerformancesPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const onScroll = () => {
      el.style.backgroundPositionY = `calc(40% + ${window.scrollY * 0.25}px)`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const upcoming = upcomingByCategory("performance");
  const past = pastEvents.filter((e) => e.category === "performance");
  const accent = categoryMeta.performance.color; // #F23359

  // 1 featured + up to 2 smaller — feature flag wins, else first event is featured
  const featuredEvent = upcoming.find((e) => e.featured) ?? upcoming[0];
  const otherEvents   = upcoming.filter((e) => e !== featuredEvent).slice(0, 2);
  const displayEvents = featuredEvent ? [featuredEvent, ...otherEvents] : [];

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div
        ref={heroRef}
        className="perf-hero"
        style={{
          backgroundImage: "url('/images/performing-zanzibar.jpg')",
        }}
      >
        <div className="perf-hero-overlay" />
        <div className="perf-hero-pink-glow" />
        <div className="perf-hero-content">
          <nav className="perf-breadcrumb">
            <Link href="/events">Events</Link>
            <span>/</span>
            <span>Performances</span>
          </nav>
          <p className="perf-eyebrow" style={{ color: accent }}>Upcoming Performances</p>
          <h1 className="perf-hero-headline">
            LIVE.<br />IN THE ROOM.<br />WITH YOU.
          </h1>
          <p className="perf-hero-sub">
            Original theatre created in communities across the world — now coming to a stage near
            you. These are stories that travelled a long way to reach you.
          </p>
          {upcoming.length > 0 && (
            <p className="perf-hero-season-note" style={{ color: accent }}>
              Come for the story. Stay for the world it opens. ↓
            </p>
          )}
        </div>
      </div>

      {/* ── Event listing ─────────────────────────────────────────────────── */}
      <section className="perf-listing">
        <div className="perf-container">
          {upcoming.length === 0 ? (
            <div className="perf-empty">
              <div className="perf-empty-icon">🎭</div>
              <h2 className="perf-empty-title">No performances announced yet.</h2>
              <p className="perf-empty-body">
                We&apos;re always in rehearsal. New dates are added when they&apos;re confirmed — join
                our mailing list to hear first.
              </p>
              <a
                href="https://dramaticadventure.com"
                target="_blank"
                rel="noopener noreferrer"
                className="perf-btn-ticket"
                style={{ background: accent }}
              >
                Join the Mailing List →
              </a>
            </div>
          ) : (
            <div className="perf-grid">
              {displayEvents.map((ev, i) => (
                <PerfCard key={ev.id} event={ev} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── What to expect band ──────────────────────────────────────────── */}
      <section className="perf-expect-band">
        <div className="perf-container">
          <div className="perf-expect-heading-box">
            <p className="perf-expect-eyebrow" style={{ color: accent }}>
              What to Expect
            </p>
            <h2 className="perf-expect-title">Theatre Made in the World</h2>
          </div>
          <div className="perf-expect-grid">
            <div className="perf-expect-item">
              <span className="perf-expect-icon">🌍</span>
              <h3>Born in community</h3>
              <p>
                Every DAT production is devised on location — in the places and with the people
                whose stories it tells. You&apos;re seeing something built across continents.
              </p>
            </div>
            <div className="perf-expect-item">
              <span className="perf-expect-icon">🎵</span>
              <h3>Live music & physical theatre</h3>
              <p>
                No passive watching. DAT performances are immersive, musical, and physical —
                built from the ground up by ensemble artists.
              </p>
            </div>
            <div className="perf-expect-item">
              <span className="perf-expect-icon">💬</span>
              <h3>Post-show conversations</h3>
              <p>
                Most performances include a post-show Q&amp;A or community conversation. The
                performance is just the beginning.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Past performances ────────────────────────────────────────────── */}
      {past.length > 0 && (
        <section className="perf-past-section">
          <div className="perf-container">
            <p className="perf-past-eyebrow">Archive</p>
            <h2 className="perf-past-heading">Past Performances</h2>
            <div className="perf-past-list">
              {past.map((ev) => (
                <PastRow key={ev.id} event={ev} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Bottom CTA ─────────────────────────────────────────────────── */}
      <section className="perf-bottom-band">
        <div className="perf-container perf-bottom-inner">
          <p className="perf-bottom-label">Explore More</p>
          <div className="perf-bottom-links">
            <Link href="/events/festivals" className="perf-bottom-link perf-teal">
              Festivals &amp; Showcases →
            </Link>
            <Link href="/events/fundraisers" className="perf-bottom-link perf-gold">
              Fundraisers &amp; Community Nights →
            </Link>
            <Link href="/theatre" className="perf-bottom-link perf-muted">
              Theatre Archive →
            </Link>
            <Link href="/events" className="perf-bottom-link perf-muted">
              ← All Events
            </Link>
          </div>
        </div>
      </section>

      {/* ── Styles ─────────────────────────────────────────────────────── */}
      <style>{`
        .perf-container {
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 clamp(1.25rem, 5vw, 3rem);
        }

        /* ── Hero ─────────────────────────────────────────────────────── */
        .perf-hero {
          position: relative;
          min-height: 78vh;
          background-size: cover;
          background-position: center 40%;
          display: flex;
          align-items: flex-end;
          overflow: hidden;
        }
        .perf-hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to top,
            rgba(13,8,18,1.0) 0%,
            rgba(13,8,18,1.0) 12%,
            rgba(8,3,12,0.88) 35%,
            rgba(8,3,12,0.5) 65%,
            rgba(8,3,12,0.15) 100%
          );
        }
        .perf-hero-pink-glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 60% 50% at 20% 80%, rgba(242,51,89,0.18) 0%, transparent 60%);
        }
        .perf-hero-content {
          position: relative;
          z-index: 4;
          padding: clamp(6rem, 12vw, 10rem) clamp(1.5rem, 6vw, 5rem) clamp(2.5rem, 5vw, 4.5rem);
          max-width: 760px;
        }
        .perf-breadcrumb {
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
        .perf-breadcrumb a { color: rgba(255,255,255,0.4); text-decoration: none; transition: color 0.2s; }
        .perf-breadcrumb a:hover { color: #F23359; }
        .perf-eyebrow {
          font-family: "DM Sans", sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          margin: 0 0 0.75rem;
        }
        .perf-hero-headline {
          font-family: "Anton", sans-serif;
          font-size: clamp(3rem, 8vw, 7rem);
          font-weight: 400;
          line-height: 0.92;
          color: #fff;
          margin: 0 0 1.25rem;
          letter-spacing: 0.01em;
          text-shadow: 0 2px 24px rgba(0,0,0,0.6);
        }
        .perf-hero-sub {
          font-family: "Space Grotesk", sans-serif;
          font-size: clamp(0.95rem, 2vw, 1.1rem);
          color: rgba(255,255,255,0.7);
          line-height: 1.65;
          margin: 0 0 2rem;
          max-width: 500px;
        }
        .perf-hero-season-note {
          font-family: "DM Sans", sans-serif;
          font-size: 0.82rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin: 0;
        }

        /* ── Listing ──────────────────────────────────────────────────── */
        .perf-listing {
          background: #0d0812;
          padding: clamp(3rem, 6vw, 5rem) 0;
          margin-top: 0;
          position: relative;
          z-index: 1;
        }
        .perf-hero::after {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 35%;
          background: linear-gradient(to bottom, transparent 0%, #0d0812 100%);
          z-index: 3;
          pointer-events: none;
        }
        .perf-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
        }

        /* ── Cards ────────────────────────────────────────────────────── */
        .perf-card {
          position: relative;
          border-radius: 14px;
          overflow: hidden;
          min-height: 420px;
          background: #1a0d1a;
          background-size: cover;
          background-position: center;
          display: flex;
          flex-direction: column;
          transition: transform 0.3s, box-shadow 0.3s;
        }
        .perf-card--featured {
          min-height: 520px;
          grid-column: 1 / -1;
          margin-bottom: clamp(1.5rem, 3vw, 2.5rem);
        }
        @media (min-width: 900px) {
          .perf-card--featured { min-height: 480px; }
        }
        .perf-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 50px rgba(242,51,89,0.2);
        }
        .perf-card-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to top,
            rgba(8,3,12,0.97) 0%,
            rgba(8,3,12,0.82) 35%,
            rgba(8,3,12,0.45) 65%,
            rgba(8,3,12,0.18) 100%
          );
          transition: opacity 0.3s;
        }
        .perf-card-inner {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          flex: 1;
          padding: 1.75rem;
          gap: 0;
        }
        .perf-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
        }
        .perf-date-stamp {
          border-left: 3px solid;
          padding-left: 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .perf-stamp-day {
          font-family: "Anton", sans-serif;
          font-size: 3rem;
          color: #fff;
          line-height: 1;
        }
        .perf-stamp-month {
          font-family: "DM Sans", sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          color: rgba(255,255,255,0.6);
        }
        .perf-stamp-year {
          font-family: "DM Sans", sans-serif;
          font-size: 0.65rem;
          font-weight: 600;
          color: rgba(255,255,255,0.35);
          letter-spacing: 0.1em;
        }
        .perf-multiday-badge {
          border-left: 3px solid;
          padding-left: 0.75rem;
          display: flex;
          flex-direction: column;
        }
        .perf-badge-month {
          font-family: "DM Sans", sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          color: rgba(255,255,255,0.6);
        }
        .perf-badge-range {
          font-family: "Anton", sans-serif;
          font-size: 2.2rem;
          color: #fff;
          line-height: 1;
        }
        .perf-badge-year {
          font-family: "DM Sans", sans-serif;
          font-size: 0.65rem;
          font-weight: 600;
          color: rgba(255,255,255,0.35);
          letter-spacing: 0.1em;
        }
        .perf-featured-tag {
          font-family: "DM Sans", sans-serif;
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #fff;
          padding: 0.3rem 0.7rem;
          border-radius: 4px;
        }
        .perf-card-body {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .perf-card-eyebrow {
          font-family: "DM Sans", sans-serif;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
        }
        .perf-card-title-lg {
          font-family: "Anton", sans-serif;
          font-size: clamp(2rem, 4vw, 3.2rem);
          font-weight: 400;
          color: #fff;
          margin: 0;
          line-height: 1;
          text-shadow: 0 2px 12px rgba(0,0,0,0.7);
        }
        .perf-card-title {
          font-family: "Anton", sans-serif;
          font-size: 1.8rem;
          font-weight: 400;
          color: #fff;
          margin: 0;
          line-height: 1;
          text-shadow: 0 2px 10px rgba(0,0,0,0.65);
        }
        .perf-card-subtitle {
          font-family: "DM Sans", sans-serif;
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.72);
          margin: 0;
          text-shadow: 0 1px 6px rgba(0,0,0,0.6);
        }
        .perf-card-loc {
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.85rem;
          color: rgba(255,255,255,0.75);
          margin: 0;
          text-shadow: 0 1px 6px rgba(0,0,0,0.55);
        }
        .perf-card-doors,
        .perf-card-time {
          font-family: "DM Sans", sans-serif;
          font-size: 0.78rem;
          color: rgba(255,255,255,0.62);
          margin: 0;
          letter-spacing: 0.04em;
          text-shadow: 0 1px 6px rgba(0,0,0,0.5);
        }
        .perf-card-desc {
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.88rem;
          color: rgba(255,255,255,0.82);
          line-height: 1.6;
          margin: 0.25rem 0 0;
          max-width: 540px;
          text-shadow: 0 1px 6px rgba(0,0,0,0.5);
        }
        .perf-card-actions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.75rem;
          margin-top: 1rem;
        }
        .perf-btn-ticket {
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
        .perf-btn-ticket:hover { opacity: 0.85; transform: translateY(-1px); }
        .perf-price-tag {
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.82rem;
          color: rgba(255,255,255,0.45);
        }
        .perf-production-link,
        .perf-production-link:link,
        .perf-production-link:visited,
        .perf-production-link:hover,
        .perf-production-link:focus,
        .perf-production-link:focus-visible,
        .perf-production-link:active {
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.72rem; font-weight: 700; letter-spacing: 0.18em;
          text-transform: uppercase; color: rgba(255,204,0,0.75) !important;
          text-decoration: none !important;
          transition: color 150ms ease;
        }
        .perf-production-link:hover,
        .perf-production-link:focus-visible { color: #FFCC00 !important; }

        /* ── Empty state ──────────────────────────────────────────────── */
        .perf-empty {
          text-align: center;
          padding: 5rem 1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }
        .perf-empty-icon { font-size: 3rem; }
        .perf-empty-title {
          font-family: "Anton", sans-serif;
          font-size: clamp(1.8rem, 4vw, 2.8rem);
          color: #fff;
          margin: 0;
        }
        .perf-empty-body {
          font-family: "Space Grotesk", sans-serif;
          font-size: 1rem;
          color: rgba(255,255,255,0.55);
          max-width: 420px;
          line-height: 1.65;
          margin: 0;
        }

        /* ── What to expect ───────────────────────────────────────────── */
        .perf-expect-band {
          background: transparent;
          padding: clamp(3.5rem, 7vw, 6rem) 0;
        }
        .perf-expect-heading-box {
          display: inline-flex;
          flex-direction: column;
          gap: 0.2rem;
          background: rgba(36,17,35,0.28);
          border-left: 4px solid #F23359;
          padding: 0.75rem 1.5rem 0.75rem 1rem;
          border-radius: 0 10px 10px 0;
          margin-bottom: 2.5rem;
        }
        .perf-expect-eyebrow {
          font-family: "DM Sans", sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          margin: 0 0 0.4rem;
        }
        .perf-expect-title {
          font-family: "Anton", sans-serif;
          font-size: clamp(2rem, 4vw, 3.2rem);
          color: #241123;
          margin: 0;
          line-height: 1;
        }
        .perf-expect-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 2rem;
        }
        .perf-expect-item {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          background: rgba(242,242,242,0.70);
          border-radius: 14px;
          padding: 1.25rem 1.5rem;
        }
        .perf-expect-icon { font-size: 2rem; }
        .perf-expect-item h3 {
          font-family: "Space Grotesk", sans-serif;
          font-size: 1rem;
          font-weight: 700;
          color: #241123;
          margin: 0;
        }
        .perf-expect-item p {
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.88rem;
          color: #5a4060;
          line-height: 1.65;
          margin: 0;
        }

        /* ── Past performances ────────────────────────────────────────── */
        .perf-past-section {
          background: #1a0d1a;
          padding: clamp(3rem, 5vw, 4rem) 0;
        }
        .perf-past-eyebrow {
          font-family: "DM Sans", sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.3);
          margin: 0 0 0.5rem;
        }
        .perf-past-heading {
          font-family: "Anton", sans-serif;
          font-size: clamp(1.8rem, 3vw, 2.5rem);
          color: #fff;
          margin: 0 0 2rem;
        }
        .perf-past-list {
          display: flex;
          flex-direction: column;
          gap: 0;
          border-top: 1px solid rgba(255,255,255,0.08);
        }
        .perf-past-row {
          display: grid;
          grid-template-columns: 80px 1fr;
          gap: 1.5rem;
          align-items: center;
          padding: 1.1rem 0;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .perf-past-date {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        .perf-past-month {
          font-family: "DM Sans", sans-serif;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          color: rgba(255,255,255,0.35);
        }
        .perf-past-year {
          font-family: "Anton", sans-serif;
          font-size: 1.2rem;
          color: rgba(255,255,255,0.2);
        }
        .perf-past-title {
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.95rem;
          font-weight: 700;
          color: rgba(255,255,255,0.55);
          margin: 0 0 0.2rem;
        }
        .perf-past-loc {
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.8rem;
          color: rgba(255,255,255,0.3);
          margin: 0;
        }

        /* ── Bottom band ──────────────────────────────────────────────── */
        .perf-bottom-band {
          background: #3a0013;
          padding: clamp(2.5rem, 5vw, 4rem) 0;
        }
        .perf-bottom-inner {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .perf-bottom-label {
          font-family: "DM Sans", sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.35);
          margin: 0;
        }
        .perf-bottom-links {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
        }
        .perf-bottom-link {
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
        .perf-bottom-link:hover { opacity: 0.8; transform: translateY(-1px); }
        .perf-teal { background: #2493A9; color: #fff; }
        .perf-gold { background: #D9A919; color: #241123; }
        .perf-muted { color: rgba(255,255,255,0.4); border: 1.5px solid rgba(255,255,255,0.15); }
      `}</style>
    </>
  );
}
