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

// ── Fundraiser card ───────────────────────────────────────────────────────────

function FundCard({ event, index }: { event: DatEvent; index: number }) {
  const accent = categoryMeta.fundraiser.color; // #D9A919
  const isFeatured = event.featured;

  if (isFeatured) {
    return (
      <div
        className="fund-card fund-card--featured"
        style={{ backgroundImage: event.image ? `url('${event.image}')` : undefined }}
      >
        <div className="fund-card-overlay" />
        <div className="fund-glow" />
        <div className="fund-card-inner">
          <div className="fund-card-top">
            <div className="fund-featured-label" style={{ borderColor: accent, color: accent }}>
              ★ Featured Event
            </div>
          </div>
          <div className="fund-card-body">
            <div className="fund-date-strip" style={{ borderColor: accent }}>
              <span className="fund-strip-day">{dayOfMonth(event.date)}</span>
              <div className="fund-strip-meta">
                <span className="fund-strip-month">{shortMonth(event.date)} {eventYear(event.date)}</span>
                {event.time && <span className="fund-strip-time">{event.time}</span>}
              </div>
            </div>
            <span className="fund-card-eyebrow" style={{ color: accent }}>
              {categoryMeta.fundraiser.eyebrow}
            </span>
            <h2 className="fund-card-title-lg">{event.title}</h2>
            {event.subtitle && (
              <p className="fund-card-subtitle">{event.subtitle}</p>
            )}
            <p className="fund-card-loc">
              {event.venue}
              {event.city !== "Worldwide" && ` · ${event.city}, ${event.country}`}
            </p>
            {event.doors && (
              <p className="fund-card-doors">{event.doors}</p>
            )}
            <p className="fund-card-desc">{event.description}</p>
            <div className="fund-card-actions">
              {event.ticketUrl && (
                <a
                  href={event.ticketUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="fund-btn-ticket"
                  style={{ background: accent, color: "#241123" }}
                >
                  {event.ticketType === "free" ? "Register Free →"
                    : event.ticketType === "pay-what-you-can" ? "Get Your Ticket →"
                    : "Reserve Your Seat →"}
                </a>
              )}
              {event.ticketPrice && (
                <span className="fund-price-tag">{event.ticketPrice}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fund-card"
      style={{
        backgroundImage: event.image ? `url('${event.image}')` : undefined,
        animationDelay: `${index * 80}ms`,
      }}
    >
      <div className="fund-card-overlay" />
      <div className="fund-card-inner">
        <div className="fund-card-top">
          <div className="fund-mini-date" style={{ background: "rgba(0,0,0,0.5)", borderColor: accent }}>
            <span className="fund-mini-day">{dayOfMonth(event.date)}</span>
            <span className="fund-mini-month">{shortMonth(event.date)}</span>
          </div>
          {event.ticketType === "free" || event.ticketType === "pay-what-you-can" ? (
            <div className="fund-access-tag">
              {event.ticketType === "free" ? "Free" : "Pay What You Can"}
            </div>
          ) : null}
        </div>
        <div className="fund-card-body">
          <span className="fund-card-eyebrow" style={{ color: accent }}>
            {event.country === "Online" ? "Online Event" : event.city}
          </span>
          <h3 className="fund-card-title">{event.title}</h3>
          {event.subtitle && (
            <p className="fund-card-subtitle">{event.subtitle}</p>
          )}
          <p className="fund-card-loc">
            {event.venue}
            {event.time ? ` · ${event.time}` : ""}
          </p>
          <p className="fund-card-desc">{event.description}</p>
          <div className="fund-card-actions">
            {event.ticketUrl && (
              <a
                href={event.ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="fund-btn-ticket"
                style={{ background: accent, color: "#241123" }}
              >
                {event.ticketType === "free" ? "Register Free →"
                  : event.ticketType === "pay-what-you-can" ? "Get Your Ticket →"
                  : "Reserve Your Seat →"}
              </a>
            )}
            {event.ticketPrice && (
              <span className="fund-price-tag">{event.ticketPrice}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function FundraisersPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const onScroll = () => {
      el.style.backgroundPositionY = `calc(30% + ${window.scrollY * 0.25}px)`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const upcoming = upcomingByCategory("fundraiser");
  const past = pastEvents.filter((e) => e.category === "fundraiser");
  const accent = categoryMeta.fundraiser.color;

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div
        ref={heroRef}
        className="fund-hero"
        style={{ backgroundImage: "url('/images/teaching-amazon.jpg')" }}
      >
        <div className="fund-hero-overlay" />
        <div className="fund-hero-gold-glow" />
        <div className="fund-hero-content">
          <nav className="fund-breadcrumb">
            <Link href="/events">Events</Link>
            <span>/</span>
            <span>Fundraisers</span>
          </nav>
          <p className="fund-eyebrow" style={{ color: accent }}>
            Fundraisers &amp; Community Nights
          </p>
          <h1 className="fund-hero-headline">
            MAKE IT<br />POSSIBLE.
          </h1>
          <p className="fund-hero-sub">
            Every gala, every community screening, every late-night conversation — these are the
            events that keep DAT in the field. Come for the night. Stay for the mission.
          </p>
          <div className="fund-hero-pills">
            <span className="fund-pill" style={{ borderColor: "rgba(217,169,25,0.4)", color: "rgba(217,169,25,0.9)" }}>
              🎟️ Live Events
            </span>
            <span className="fund-pill" style={{ borderColor: "rgba(217,169,25,0.4)", color: "rgba(217,169,25,0.9)" }}>
              🌐 Online Streams
            </span>
            <span className="fund-pill" style={{ borderColor: "rgba(217,169,25,0.4)", color: "rgba(217,169,25,0.9)" }}>
              🤲 Pay What You Can
            </span>
          </div>
        </div>
      </div>

      {/* ── Event listing ─────────────────────────────────────────────────── */}
      <section className="fund-listing">
        <div className="fund-container">
          {upcoming.length === 0 ? (
            <div className="fund-empty">
              <div className="fund-empty-icon">✨</div>
              <h2 className="fund-empty-title">Nothing announced yet.</h2>
              <p className="fund-empty-body">
                Our next community event is in the works. Sign up for updates and you&apos;ll be
                first to know.
              </p>
              <Link href="/donate" className="fund-btn-donate">
                Donate in the meantime →
              </Link>
            </div>
          ) : (
            <div className="fund-grid">
              {upcoming.map((ev, i) => (
                <FundCard key={ev.id} event={ev} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Why come band ─────────────────────────────────────────────────── */}
      <section className="fund-why-band">
        <div className="fund-container fund-why-grid">
          <div className="fund-why-text">
            <p className="fund-why-eyebrow" style={{ color: accent }}>Why It Matters</p>
            <h2 className="fund-why-title">Your Night Out<br />Funds the Work</h2>
            <p className="fund-why-body">
              DAT fundraisers are not galas for galas&apos; sake. They&apos;re how we tell the story of
              what we do — and how we raise the resources to keep doing it.
            </p>
            <p className="fund-why-body">
              Every ticket, every donation, every table bought at the gala directly funds
              artist stipends, drama club materials, travel costs, and community residencies
              in places where cultural programming is scarce.
            </p>
            <Link href="/donate" className="fund-why-link" style={{ color: accent }}>
              Or donate directly — any amount, any time →
            </Link>
          </div>
          <div className="fund-why-impact">
            <div className="fund-impact-card">
              <span className="fund-impact-icon">🎭</span>
              <h3>Funds artist stipends</h3>
              <p>Every dollar raised supports the artists who make the field work possible.</p>
            </div>
            <div className="fund-impact-card">
              <span className="fund-impact-icon">📚</span>
              <h3>Sustains drama clubs</h3>
              <p>Materials, space, and facilitation for clubs in under-resourced communities.</p>
            </div>
            <div className="fund-impact-card">
              <span className="fund-impact-icon">✈️</span>
              <h3>Enables field seasons</h3>
              <p>Production, travel, and logistics for DAT&apos;s next international season.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Past events ───────────────────────────────────────────────────── */}
      {past.length > 0 && (
        <section className="fund-past-section">
          <div className="fund-container">
            <p className="fund-past-eyebrow">Archive</p>
            <h2 className="fund-past-heading">Past Community Events</h2>
            <div className="fund-past-list">
              {past.map((ev) => (
                <div key={ev.id} className="fund-past-row">
                  <div className="fund-past-date">
                    <span className="fund-past-month">{shortMonth(ev.date)}</span>
                    <span className="fund-past-year">{eventYear(ev.date)}</span>
                  </div>
                  <div>
                    <h4 className="fund-past-title">{ev.title}</h4>
                    <p className="fund-past-loc">{ev.venue} · {ev.city}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Bottom CTA ─────────────────────────────────────────────────── */}
      <section className="fund-bottom-band">
        <div className="fund-container fund-bottom-inner">
          <p className="fund-bottom-label">Explore More</p>
          <div className="fund-bottom-links">
            <Link href="/events/performances" className="fund-bottom-link fund-pink">
              Upcoming Performances →
            </Link>
            <Link href="/events/festivals" className="fund-bottom-link fund-teal">
              Festivals &amp; Showcases →
            </Link>
            <Link href="/events" className="fund-bottom-link fund-muted">
              ← All Events
            </Link>
          </div>
        </div>
      </section>

      <style>{`
        .fund-container {
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 clamp(1.25rem, 5vw, 3rem);
        }

        /* ── Hero ─────────────────────────────────────────────────────── */
        .fund-hero {
          position: relative;
          min-height: 76vh;
          background-size: cover;
          background-position: center 30%;
          display: flex;
          align-items: flex-end;
          overflow: hidden;
        }
        .fund-hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to top,
            rgba(20,12,4,0.96) 0%,
            rgba(20,12,4,0.6) 42%,
            rgba(20,12,4,0.18) 100%
          );
        }
        .fund-hero-gold-glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 65% 55% at 15% 85%, rgba(217,169,25,0.18) 0%, transparent 65%);
        }
        .fund-hero-content {
          position: relative;
          z-index: 2;
          padding: 0 clamp(1.5rem, 6vw, 5rem) clamp(2.5rem, 5vw, 4.5rem);
          max-width: 720px;
        }
        .fund-breadcrumb {
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
        .fund-breadcrumb a { color: rgba(255,255,255,0.4); text-decoration: none; transition: color 0.2s; }
        .fund-breadcrumb a:hover { color: #D9A919; }
        .fund-eyebrow {
          font-family: "DM Sans", sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          margin: 0 0 0.75rem;
        }
        .fund-hero-headline {
          font-family: "Anton", sans-serif;
          font-size: clamp(3.5rem, 9vw, 8rem);
          font-weight: 400;
          line-height: 0.9;
          color: #fff;
          margin: 0 0 1.25rem;
          letter-spacing: 0.01em;
          text-shadow: 0 2px 24px rgba(0,0,0,0.55);
        }
        .fund-hero-sub {
          font-family: "Space Grotesk", sans-serif;
          font-size: clamp(0.95rem, 2vw, 1.1rem);
          color: rgba(255,255,255,0.7);
          line-height: 1.65;
          margin: 0 0 2rem;
          max-width: 500px;
        }
        .fund-hero-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 0.6rem;
        }
        .fund-pill {
          font-family: "DM Sans", sans-serif;
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          padding: 0.4rem 0.9rem;
          border-radius: 50px;
          border: 1px solid;
        }

        /* ── Listing ──────────────────────────────────────────────────── */
        .fund-listing {
          background: #140c04;
          padding: clamp(3rem, 6vw, 5rem) 0;
        }
        .fund-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
          gap: 1.5rem;
        }

        /* ── Cards ────────────────────────────────────────────────────── */
        .fund-card {
          position: relative;
          border-radius: 14px;
          overflow: hidden;
          min-height: 420px;
          background: #241a08;
          background-size: cover;
          background-position: center;
          display: flex;
          flex-direction: column;
          transition: transform 0.3s, box-shadow 0.3s;
        }
        .fund-card--featured {
          min-height: 500px;
          grid-column: 1 / -1;
        }
        .fund-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 50px rgba(217,169,25,0.18);
        }
        .fund-card-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to top,
            rgba(20,12,4,0.96) 0%,
            rgba(20,12,4,0.58) 45%,
            rgba(20,12,4,0.14) 100%
          );
        }
        .fund-glow {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 50%;
          background: radial-gradient(ellipse 80% 60% at 20% 100%, rgba(217,169,25,0.12) 0%, transparent 70%);
        }
        .fund-card-inner {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          flex: 1;
          padding: 1.75rem;
          gap: 0;
        }
        .fund-card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.75rem;
        }
        .fund-featured-label {
          font-family: "DM Sans", sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          border: 1.5px solid;
          padding: 0.3rem 0.75rem;
          border-radius: 4px;
        }
        .fund-date-strip {
          display: flex;
          align-items: baseline;
          gap: 0.75rem;
          border-left: 3px solid;
          padding-left: 0.9rem;
          margin-bottom: 1.25rem;
        }
        .fund-strip-day {
          font-family: "Anton", sans-serif;
          font-size: 4rem;
          color: #fff;
          line-height: 1;
        }
        .fund-strip-meta {
          display: flex;
          flex-direction: column;
          gap: 0.1rem;
        }
        .fund-strip-month {
          font-family: "DM Sans", sans-serif;
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: rgba(255,255,255,0.65);
        }
        .fund-strip-time {
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.8rem;
          color: rgba(255,255,255,0.4);
        }
        .fund-mini-date {
          border-left: 3px solid;
          padding-left: 0.65rem;
          display: flex;
          align-items: baseline;
          gap: 0.35rem;
          backdrop-filter: blur(4px);
          padding: 0.4rem 0.7rem 0.4rem 0.65rem;
          border-radius: 0 6px 6px 0;
        }
        .fund-mini-day {
          font-family: "Anton", sans-serif;
          font-size: 2rem;
          color: #fff;
          line-height: 1;
        }
        .fund-mini-month {
          font-family: "DM Sans", sans-serif;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.15em;
          color: rgba(255,255,255,0.55);
        }
        .fund-access-tag {
          font-family: "DM Sans", sans-serif;
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #D9A919;
          background: rgba(217,169,25,0.15);
          border: 1px solid rgba(217,169,25,0.3);
          padding: 0.3rem 0.65rem;
          border-radius: 4px;
        }
        .fund-card-body { display: flex; flex-direction: column; gap: 0.4rem; }
        .fund-card-eyebrow {
          font-family: "DM Sans", sans-serif;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
        }
        .fund-card-title-lg {
          font-family: "Anton", sans-serif;
          font-size: clamp(2rem, 3.5vw, 3rem);
          color: #fff;
          margin: 0;
          line-height: 1;
        }
        .fund-card-title {
          font-family: "Anton", sans-serif;
          font-size: 1.7rem;
          color: #fff;
          margin: 0;
          line-height: 1;
        }
        .fund-card-subtitle {
          font-family: "DM Sans", sans-serif;
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.4);
          margin: 0;
        }
        .fund-card-loc {
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.85rem;
          color: rgba(255,255,255,0.5);
          margin: 0;
        }
        .fund-card-doors {
          font-family: "DM Sans", sans-serif;
          font-size: 0.78rem;
          color: rgba(255,255,255,0.38);
          margin: 0;
          letter-spacing: 0.04em;
        }
        .fund-card-desc {
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.88rem;
          color: rgba(255,255,255,0.65);
          line-height: 1.6;
          margin: 0.25rem 0 0;
          max-width: 520px;
        }
        .fund-card-actions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.75rem;
          margin-top: 1.1rem;
        }
        .fund-btn-ticket {
          font-family: "DM Sans", sans-serif;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          text-decoration: none;
          padding: 0.7rem 1.5rem;
          border-radius: 8px;
          transition: opacity 0.2s, transform 0.15s;
          display: inline-block;
        }
        .fund-btn-ticket:hover { opacity: 0.85; transform: translateY(-1px); }
        .fund-price-tag {
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.82rem;
          color: rgba(255,255,255,0.4);
        }

        /* Empty state */
        .fund-empty {
          text-align: center;
          padding: 5rem 1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }
        .fund-empty-icon { font-size: 3rem; }
        .fund-empty-title {
          font-family: "Anton", sans-serif;
          font-size: clamp(1.8rem, 4vw, 2.8rem);
          color: #fff;
          margin: 0;
        }
        .fund-empty-body {
          font-family: "Space Grotesk", sans-serif;
          font-size: 1rem;
          color: rgba(255,255,255,0.5);
          max-width: 380px;
          line-height: 1.65;
          margin: 0;
        }
        .fund-btn-donate {
          font-family: "DM Sans", sans-serif;
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          text-decoration: none;
          background: #D9A919;
          color: #241123;
          padding: 0.8rem 1.75rem;
          border-radius: 10px;
          transition: opacity 0.2s;
        }
        .fund-btn-donate:hover { opacity: 0.88; }

        /* ── Why band ─────────────────────────────────────────────────── */
        .fund-why-band {
          background: #f6e4c1;
          padding: clamp(3.5rem, 7vw, 6rem) 0;
        }
        .fund-why-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: clamp(2.5rem, 6vw, 5rem);
          align-items: start;
        }
        @media (max-width: 700px) {
          .fund-why-grid { grid-template-columns: 1fr; }
        }
        .fund-why-eyebrow {
          font-family: "DM Sans", sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          margin: 0 0 0.6rem;
        }
        .fund-why-title {
          font-family: "Anton", sans-serif;
          font-size: clamp(2rem, 4vw, 3.2rem);
          color: #241123;
          margin: 0 0 1.5rem;
          line-height: 1;
        }
        .fund-why-body {
          font-family: "Space Grotesk", sans-serif;
          font-size: 1rem;
          color: #241123;
          line-height: 1.75;
          margin: 0 0 1rem;
        }
        .fund-why-link {
          font-family: "DM Sans", sans-serif;
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-decoration: none;
          display: inline-block;
          margin-top: 0.5rem;
        }
        .fund-why-link:hover { opacity: 0.75; }
        .fund-why-impact {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .fund-impact-card {
          background: #fff;
          border: 1px solid #e8d9bc;
          border-radius: 12px;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .fund-impact-icon { font-size: 1.5rem; }
        .fund-impact-card h3 {
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.95rem;
          font-weight: 700;
          color: #241123;
          margin: 0;
        }
        .fund-impact-card p {
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.85rem;
          color: #5a4060;
          line-height: 1.6;
          margin: 0;
        }

        /* ── Past section ─────────────────────────────────────────────── */
        .fund-past-section {
          background: #241a08;
          padding: clamp(3rem, 5vw, 4rem) 0;
        }
        .fund-past-eyebrow {
          font-family: "DM Sans", sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.3);
          margin: 0 0 0.5rem;
        }
        .fund-past-heading {
          font-family: "Anton", sans-serif;
          font-size: clamp(1.8rem, 3vw, 2.5rem);
          color: #fff;
          margin: 0 0 2rem;
        }
        .fund-past-list { border-top: 1px solid rgba(255,255,255,0.07); }
        .fund-past-row {
          display: grid;
          grid-template-columns: 80px 1fr;
          gap: 1.5rem;
          align-items: center;
          padding: 1rem 0;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .fund-past-date { display: flex; flex-direction: column; }
        .fund-past-month {
          font-family: "DM Sans", sans-serif;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          color: rgba(217,169,25,0.6);
        }
        .fund-past-year {
          font-family: "Anton", sans-serif;
          font-size: 1.2rem;
          color: rgba(255,255,255,0.2);
        }
        .fund-past-title {
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.95rem;
          font-weight: 700;
          color: rgba(255,255,255,0.5);
          margin: 0 0 0.2rem;
        }
        .fund-past-loc {
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.8rem;
          color: rgba(255,255,255,0.28);
          margin: 0;
        }

        /* ── Bottom band ──────────────────────────────────────────────── */
        .fund-bottom-band {
          background: #241123;
          padding: clamp(2.5rem, 5vw, 4rem) 0;
        }
        .fund-bottom-inner { display: flex; flex-direction: column; gap: 1.25rem; }
        .fund-bottom-label {
          font-family: "DM Sans", sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.35);
          margin: 0;
        }
        .fund-bottom-links { display: flex; flex-wrap: wrap; gap: 0.75rem; }
        .fund-bottom-link {
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
        .fund-bottom-link:hover { opacity: 0.8; transform: translateY(-1px); }
        .fund-pink { background: #F23359; color: #fff; }
        .fund-teal { background: #2493A9; color: #fff; }
        .fund-muted { color: rgba(255,255,255,0.4); border: 1.5px solid rgba(255,255,255,0.15); }
      `}</style>
    </>
  );
}
