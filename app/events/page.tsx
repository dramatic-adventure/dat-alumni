"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  upcomingEvents,
  upcomingByCategory,
  categoryMeta,
  formatDateRange,
  shortMonth,
  dayOfMonth,
  getEventImage,
  type DatEvent,
  type EventCategory,
} from "@/lib/events";

// ── Mini event card ───────────────────────────────────────────────────────────

function EventCard({ event, accent }: { event: DatEvent; accent: string }) {
  const router = useRouter();
  const meta = categoryMeta[event.category];
  return (
    <div
      className="evhub-card"
      onClick={() => router.push(meta.href)}
      style={{ cursor: "pointer" }}
    >
      {getEventImage(event) && (
        <div
          className="evhub-card-img"
          style={{ backgroundImage: `url('${getEventImage(event)}')` }}
        />
      )}
      <div className="evhub-card-overlay" />
      <div className="evhub-card-body">
        <div className="evhub-card-date-badge" style={{ background: accent }}>
          <span className="evhub-date-day">{dayOfMonth(event.date)}</span>
          <span className="evhub-date-month">{shortMonth(event.date)}</span>
        </div>
        <div className="evhub-card-content">
          <span className="evhub-card-cat" style={{ color: accent }}>
            {meta.eyebrow}
          </span>
          <h3 className="evhub-card-title">{event.title}</h3>
          <p className="evhub-card-venue">
            {event.venue} · {event.city}
          </p>
          <p className="evhub-card-desc">{event.description}</p>
          {event.ticketPrice && (
            <p className="evhub-card-price">{event.ticketPrice}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Featured event (hero card) ────────────────────────────────────────────────

function FeaturedEventCard({ event }: { event: DatEvent }) {
  const meta = categoryMeta[event.category];
  const accent = meta.color;
  return (
    <div
      className="evhub-featured"
      style={{
        backgroundImage: getEventImage(event) ? `url('${getEventImage(event)}')` : undefined,
      }}
    >
      <div className="evhub-featured-overlay" />
      <div className="evhub-featured-body">
        <div className="evhub-featured-left">
          <div className="evhub-featured-date-block" style={{ borderColor: accent }}>
            <span className="evhub-featured-day">{dayOfMonth(event.date)}</span>
            <span className="evhub-featured-month">{shortMonth(event.date)}</span>
          </div>
        </div>
        <div className="evhub-featured-right">
          <span className="evhub-featured-eyebrow" style={{ color: accent }}>
            {meta.eyebrow} — Next Up
          </span>
          <h2 className="evhub-featured-title">{event.title}</h2>
          {event.subtitle && (
            <p className="evhub-featured-subtitle">{event.subtitle}</p>
          )}
          <p className="evhub-featured-meta">
            <span>{event.venue}</span>
            <span className="evhub-dot">·</span>
            <span>{event.city}, {event.country}</span>
            {event.time && (
              <>
                <span className="evhub-dot">·</span>
                <span>{event.time}</span>
              </>
            )}
          </p>
          <p className="evhub-featured-desc">{event.description}</p>
          <div className="evhub-featured-actions">
            {event.ticketUrl && (
              <a
                href={event.ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="evhub-btn-primary"
                style={{ background: accent, color: event.category === "fundraiser" ? "#241123" : "#fff" }}
                onClick={(e) => e.stopPropagation()}
              >
                {event.ticketType === "free" ? "Register Free" : "Get Tickets"}
              </a>
            )}
            <Link
              href={meta.href}
              className="evhub-btn-ghost"
              style={{ borderColor: "rgba(255,255,255,0.3)", color: "rgba(255,255,255,0.75)" }}
            >
              See All {meta.plural} →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Category row ──────────────────────────────────────────────────────────────

function CategoryRow({
  category,
  events,
}: {
  category: EventCategory;
  events: DatEvent[];
}) {
  const meta = categoryMeta[category];
  const accent = meta.color;

  return (
    <section className="evhub-category-row">
      <div className="evhub-container">
        <div className="evhub-cat-header">
          <div className="evhub-cat-heading-group" style={{ borderColor: accent }}>
            <p className="evhub-cat-eyebrow" style={{ color: accent }}>
              {meta.eyebrow}
            </p>
            <h2 className="evhub-cat-title">{meta.plural}</h2>
            <Link href={meta.href} className="evhub-see-all" style={{ color: accent }}>
              See all →
            </Link>
          </div>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="evhub-container">
          <div className="evhub-empty">
            <p>No upcoming {meta.plural.toLowerCase()} announced yet.</p>
            <Link href={meta.href} style={{ color: accent }}>
              Check back soon →
            </Link>
          </div>
        </div>
      ) : (
        <div className="evhub-cards-scroll">
          {events.slice(0, 2).map((ev) => (
            <EventCard key={ev.id} event={ev} accent={accent} />
          ))}
        </div>
      )}
    </section>
  );
}

// ── Mailing list inline form ──────────────────────────────────────────────────

function MailingListForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [honey, setHoney] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/mailing-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, source: "events-page", website: honey }),
      });
      if (!res.ok) throw new Error("submit-failed");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="evhub-ml-success">
        <span className="evhub-ml-check">✓</span>
        <div>
          <p className="evhub-ml-success-title">You&apos;re on the list.</p>
          <p className="evhub-ml-success-sub">We&apos;ll be in touch when something exciting is happening.</p>
        </div>
      </div>
    );
  }

  return (
    <form className="evhub-ml-form" onSubmit={handleSubmit} noValidate>
      {/* Honeypot — hidden from humans */}
      <input
        aria-hidden="true"
        tabIndex={-1}
        name="website"
        value={honey}
        onChange={(e) => setHoney(e.target.value)}
        style={{ display: "none" }}
        autoComplete="off"
      />
      <div className="evhub-ml-fields">
        <input
          type="text"
          placeholder="Your name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="evhub-ml-input"
          autoComplete="name"
        />
        <input
          type="email"
          required
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="evhub-ml-input evhub-ml-input--email"
          autoComplete="email"
        />
        <button
          type="submit"
          className="evhub-ml-btn"
          disabled={status === "loading"}
        >
          {status === "loading" ? "Signing up…" : "Join the List →"}
        </button>
      </div>
      {status === "error" && (
        <p className="evhub-ml-error">
          Something went wrong — email us at{" "}
          <a href="mailto:hello@dramaticadventure.com">hello@dramaticadventure.com</a>
        </p>
      )}
      <p className="evhub-ml-fine">
        No spam, ever. Unsubscribe any time by replying to any email.
      </p>
    </form>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EventsHubPage() {
  const nextUp = upcomingEvents[0];
  const performances = upcomingByCategory("performance");
  const festivals = upcomingByCategory("festival");
  const fundraisers = upcomingByCategory("fundraiser");

  return (
    <>
      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <div className="evhub-hero" style={{ backgroundImage: "url('/images/performing-zanzibar.jpg')" }}>
        <div className="evhub-hero-img-overlay" />
        <div className="evhub-hero-bg" />
        <div className="evhub-hero-grid-lines" aria-hidden="true" />
        <div className="evhub-hero-content">
          <p className="evhub-hero-eyebrow">Events</p>
          <h1 className="evhub-hero-headline">
            THE STAGE<br />IS EVERYWHERE.
          </h1>
          <p className="evhub-hero-sub">
            Performances, festivals, and community nights — live and in the room with you.
            Find DAT near you, or join us from wherever you are.
          </p>
          <div className="evhub-hero-cats">
            <Link href="/events/performances" className="evhub-hero-cat evhub-cat-pink">
              <span className="evhub-hero-cat-count">{performances.length}</span>
              Performances
            </Link>
            <Link href="/events/festivals" className="evhub-hero-cat evhub-cat-teal">
              <span className="evhub-hero-cat-count">{festivals.length}</span>
              Festivals
            </Link>
            <Link href="/events/fundraisers" className="evhub-hero-cat evhub-cat-gold">
              <span className="evhub-hero-cat-count">{fundraisers.length}</span>
              Community Nights
            </Link>
          </div>
        </div>
      </div>

      {/* ── Featured / Next Up ─────────────────────────────────────────── */}
      {nextUp && (
        <section className="evhub-featured-section">
          <div className="evhub-container">
            <p className="evhub-section-label">Next Up</p>
          </div>
          <div className="evhub-container">
            <FeaturedEventCard event={nextUp} />
          </div>
        </section>
      )}

      {/* ── Category rows ──────────────────────────────────────────────── */}
      <div className="evhub-rows">
        <CategoryRow category="performance" events={performances} />
        <CategoryRow category="festival" events={festivals} />
        <CategoryRow category="fundraiser" events={fundraisers} />
      </div>

      {/* ── Oscar Wilde quote overlaid on theatre photo ─────────────── */}
      <section className="evhub-quote-band">
        <div className="evhub-quote-photo-wrap">
          <div className="evhub-quote-photo" aria-hidden="true" />
          <div className="evhub-quote-photo-overlay" />
          <div className="evhub-quote-photo-content">
            <blockquote className="evhub-quote">
              <p className="evhub-quote-text">
                &ldquo;I regard the theatre as the greatest of all art forms, the most immediate
                way in which a human being can share with another the sense of what it is
                to be a human being.&rdquo;
              </p>
              <footer className="evhub-quote-attribution">— Oscar Wilde</footer>
            </blockquote>
          </div>
        </div>
      </section>

      {/* ── Bottom band ────────────────────────────────────────────────── */}
      <section className="evhub-bottom-band">
        <div className="evhub-container">
          <p className="evhub-bottom-eyebrow">Stay in the Loop</p>
          <h2 className="evhub-bottom-title">Never miss a curtain.</h2>
          <p className="evhub-bottom-body">
            Events are announced first to our community list. Be the first to know
            when new shows, festivals, and community nights are announced.
          </p>
          <MailingListForm />
          <div className="evhub-bottom-links">
            <Link href="/donate" className="evhub-btn-bottom-link">
              Support the Work
            </Link>
            <Link href="/theatre" className="evhub-btn-bottom-link">
              Theatre Archive →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Styles ─────────────────────────────────────────────────────── */}
      <style>{`
        /* ── Base ─────────────────────────────────────────────────────── */
        .evhub-container {
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 clamp(1.25rem, 5vw, 3rem);
        }

        /* ── Hero ─────────────────────────────────────────────────────── */
        .evhub-hero {
          position: relative;
          min-height: 70vh;
          background: #0d0812;
          background-size: cover;
          background-position: center 30%;
          display: flex;
          align-items: center;
          overflow: hidden;
        }
        .evhub-hero-img-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to right,
            rgba(8,3,12,0.92) 0%,
            rgba(8,3,12,0.75) 45%,
            rgba(8,3,12,0.4) 100%
          );
          z-index: 1;
        }
        .evhub-hero-bg {
          position: absolute;
          inset: 0;
          z-index: 1;
          background:
            radial-gradient(ellipse 80% 60% at 70% 50%, rgba(242,51,89,0.06) 0%, transparent 70%),
            radial-gradient(ellipse 60% 80% at 20% 80%, rgba(36,147,169,0.05) 0%, transparent 60%),
            radial-gradient(ellipse 50% 50% at 80% 20%, rgba(217,169,25,0.04) 0%, transparent 60%);
        }
        .evhub-hero-grid-lines {
          position: absolute;
          inset: 0;
          z-index: 1;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 80px 80px;
          pointer-events: none;
        }
        .evhub-hero-content {
          position: relative;
          z-index: 3;
          padding: clamp(4rem, 10vw, 7rem) clamp(1.5rem, 6vw, 5rem);
          max-width: 800px;
        }
        .evhub-hero-eyebrow {
          font-family: "DM Sans", sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.4);
          margin: 0 0 1rem;
        }
        .evhub-hero-headline {
          font-family: "Anton", sans-serif;
          font-size: clamp(3.5rem, 9vw, 8rem);
          font-weight: 400;
          line-height: 0.92;
          color: #fff;
          margin: 0 0 1.5rem;
          letter-spacing: 0.01em;
        }
        .evhub-hero-sub {
          font-family: "Space Grotesk", sans-serif;
          font-size: clamp(1rem, 2vw, 1.2rem);
          color: rgba(255,255,255,0.65);
          line-height: 1.65;
          max-width: 520px;
          margin: 0 0 2.5rem;
        }
        .evhub-hero-cats {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
        }
        .evhub-hero-cat {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          font-family: "DM Sans", sans-serif;
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          text-decoration: none;
          padding: 0.6rem 1.25rem;
          border-radius: 50px;
          transition: transform 0.2s, opacity 0.2s;
        }
        .evhub-hero-cat:hover { transform: translateY(-2px); opacity: 0.88; }
        .evhub-hero-cat-count {
          font-family: "Anton", sans-serif;
          font-size: 1.1rem;
          font-weight: 400;
          margin-right: 0.1rem;
        }
        .evhub-cat-pink { background: rgba(242,51,89,0.15); color: #F23359; border: 1px solid rgba(242,51,89,0.3); }
        .evhub-cat-teal { background: rgba(36,147,169,0.15); color: #2493A9; border: 1px solid rgba(36,147,169,0.3); }
        .evhub-cat-gold { background: rgba(217,169,25,0.15); color: #D9A919; border: 1px solid rgba(217,169,25,0.3); }

        /* ── Featured section ─────────────────────────────────────────── */
        .evhub-featured-section {
          background: #0d0812;
          padding: 0 0 clamp(2.5rem, 5vw, 4rem);
        }
        .evhub-section-label {
          font-family: "DM Sans", sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.3);
          margin: 0 0 1.25rem;
          padding: clamp(1.5rem, 3vw, 2.5rem) 0 0;
        }
        .evhub-featured {
          position: relative;
          border-radius: 16px;
          overflow: hidden;
          min-height: 380px;
          background: #1a0d1a;
          background-size: cover;
          background-position: center;
          display: flex;
          align-items: flex-end;
        }
        .evhub-featured-overlay {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(
              to right,
              rgba(10,5,14,0.95) 0%,
              rgba(10,5,14,0.75) 55%,
              rgba(10,5,14,0.35) 100%
            ),
            linear-gradient(
              to top,
              rgba(10,5,14,0.85) 0%,
              rgba(10,5,14,0.0) 50%
            );
        }
        .evhub-featured-body {
          position: relative;
          z-index: 2;
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 2.5rem;
          align-items: end;
          padding: clamp(1.75rem, 4vw, 3rem);
          width: 100%;
        }
        @media (max-width: 640px) {
          .evhub-featured-body { grid-template-columns: 1fr; gap: 1rem; }
          .evhub-featured-left { display: none; }
        }
        .evhub-featured-date-block {
          border-left: 3px solid;
          padding-left: 1rem;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0;
          min-width: 56px;
        }
        .evhub-featured-day {
          font-family: "Anton", sans-serif;
          font-size: 4.5rem;
          font-weight: 400;
          color: #fff;
          line-height: 1;
        }
        .evhub-featured-month {
          font-family: "DM Sans", sans-serif;
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          color: rgba(255,255,255,0.6);
          margin-top: 0.2rem;
        }
        .evhub-featured-eyebrow {
          font-family: "DM Sans", sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          display: block;
          margin-bottom: 0.6rem;
        }
        .evhub-featured-title {
          font-family: "Anton", sans-serif;
          font-size: clamp(2rem, 4vw, 3.5rem);
          font-weight: 400;
          color: #fff;
          margin: 0 0 0.35rem;
          line-height: 1;
          text-shadow: 0 2px 14px rgba(0,0,0,0.7);
        }
        .evhub-featured-subtitle {
          font-family: "DM Sans", sans-serif;
          font-size: 0.82rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.75);
          margin: 0 0 0.85rem;
          text-shadow: 0 1px 6px rgba(0,0,0,0.65);
        }
        .evhub-featured-meta {
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.88rem;
          color: rgba(255,255,255,0.75);
          margin: 0 0 0.85rem;
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
          align-items: center;
          text-shadow: 0 1px 6px rgba(0,0,0,0.55);
        }
        .evhub-dot { opacity: 0.5; }
        .evhub-featured-desc {
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.95rem;
          color: rgba(255,255,255,0.85);
          line-height: 1.65;
          margin: 0 0 1.5rem;
          max-width: 520px;
          text-shadow: 0 1px 6px rgba(0,0,0,0.5);
        }
        .evhub-featured-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          align-items: center;
        }
        .evhub-btn-primary {
          font-family: "DM Sans", sans-serif;
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          text-decoration: none;
          padding: 0.8rem 1.75rem;
          border-radius: 10px;
          transition: opacity 0.2s, transform 0.15s;
        }
        .evhub-btn-primary:hover { opacity: 0.88; transform: translateY(-1px); }
        .evhub-btn-ghost {
          font-family: "DM Sans", sans-serif;
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          text-decoration: none;
          padding: 0.8rem 1.75rem;
          border-radius: 10px;
          border: 1.5px solid;
          transition: opacity 0.2s, transform 0.15s;
        }
        .evhub-btn-ghost:hover { opacity: 0.75; transform: translateY(-1px); }

        /* ── Category rows ─────────────────────────────────────────────── */
        .evhub-rows {
          background: transparent;
        }
        .evhub-category-row {
          padding: clamp(2.5rem, 5vw, 4rem) 0 clamp(2.5rem, 5vw, 4rem);
          border-bottom: 1px solid rgba(36,17,35,0.1);
        }
        .evhub-category-row:last-child { border-bottom: none; }
        .evhub-cat-header {
          margin-bottom: 1.5rem;
        }
        .evhub-cat-heading-group {
          display: inline-flex;
          flex-direction: column;
          gap: 0.2rem;
          background: rgba(36,17,35,0.1);
          border-left: 4px solid currentColor;
          padding: 0.6rem 1.25rem 0.6rem 0.9rem;
          border-radius: 0 10px 10px 0;
        }
        .evhub-cat-eyebrow {
          font-family: "DM Sans", sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          margin: 0;
        }
        .evhub-cat-title {
          font-family: "Anton", sans-serif;
          font-size: clamp(1.8rem, 3.5vw, 2.8rem);
          font-weight: 400;
          color: #241123;
          margin: 0;
          line-height: 1;
        }
        .evhub-see-all {
          font-family: "DM Sans", sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          text-decoration: none;
          transition: opacity 0.2s;
          white-space: nowrap;
          margin-top: 0.45rem;
          opacity: 0.85;
        }
        .evhub-see-all:hover { opacity: 1; }
        .evhub-empty {
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.95rem;
          color: #7a5e80;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .evhub-empty a { font-weight: 600; text-decoration: none; }

        /* Cards scroll row — 50vw per card */
        .evhub-cards-scroll {
          display: grid;
          grid-template-columns: repeat(2, calc(50vw - 2rem));
          gap: 1rem;
          padding: 0 clamp(1.25rem, 5vw, 3rem);
          overflow-x: auto;
          scrollbar-width: none;
        }
        .evhub-cards-scroll::-webkit-scrollbar { display: none; }
        @media (max-width: 600px) {
          .evhub-cards-scroll {
            grid-template-columns: calc(100vw - 2.5rem);
          }
        }
        .evhub-card {
          position: relative;
          border-radius: 14px;
          overflow: hidden;
          min-height: 360px;
          background: #1a0d1a;
          display: flex;
          flex-direction: column;
          transition: transform 0.25s, box-shadow 0.25s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.18), 0 8px 28px rgba(0,0,0,0.14);
        }
        .evhub-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.32), 0 24px 60px rgba(0,0,0,0.38), 0 2px 6px rgba(0,0,0,0.22);
        }
        .evhub-card-img {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          opacity: 0.45;
          transition: opacity 0.3s, transform 0.4s;
        }
        .evhub-card:hover .evhub-card-img {
          opacity: 0.62;
          transform: scale(1.04);
        }
        .evhub-card-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(10,5,14,0.92) 0%, rgba(10,5,14,0.3) 60%, transparent 100%);
        }
        .evhub-card-body {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          flex: 1;
          padding: 1.5rem;
          gap: 0.75rem;
        }
        .evhub-card-date-badge {
          align-self: flex-start;
          display: flex;
          align-items: baseline;
          gap: 0.3rem;
          padding: 0.35rem 0.7rem;
          border-radius: 6px;
        }
        .evhub-date-day {
          font-family: "Anton", sans-serif;
          font-size: 1.4rem;
          color: #fff;
          line-height: 1;
        }
        .evhub-date-month {
          font-family: "DM Sans", sans-serif;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: rgba(255,255,255,0.85);
        }
        .evhub-card-content { display: flex; flex-direction: column; gap: 0.3rem; }
        .evhub-card-cat {
          font-family: "DM Sans", sans-serif;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
        }
        .evhub-card-title {
          font-family: "Anton", sans-serif;
          font-size: 1.4rem;
          font-weight: 400;
          color: #fff;
          margin: 0;
          line-height: 1.1;
        }
        .evhub-card-venue {
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.8rem;
          color: rgba(255,255,255,0.55);
          margin: 0;
        }
        .evhub-card-desc {
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.82rem;
          color: rgba(255,255,255,0.65);
          line-height: 1.55;
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .evhub-card-price {
          font-family: "DM Sans", sans-serif;
          font-size: 0.78rem;
          font-weight: 600;
          color: rgba(255,255,255,0.45);
          margin: 0;
          letter-spacing: 0.04em;
        }

        /* ── Bottom band ───────────────────────────────────────────────── */
        .evhub-bottom-band {
          background: #1d0a36;
          padding: clamp(3rem, 6vw, 5rem) 0;
          width: 100%;
        }
        .evhub-bottom-eyebrow {
          font-family: "DM Sans", sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.35);
          margin: 0 0 0.6rem;
        }
        .evhub-bottom-title {
          font-family: "Anton", sans-serif;
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 400;
          color: #fff;
          margin: 0 0 0.75rem;
        }
        .evhub-bottom-body {
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.95rem;
          color: rgba(255,255,255,0.55);
          line-height: 1.65;
          margin: 0 0 1.5rem;
          max-width: 480px;
        }
        .evhub-bottom-links {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          margin-top: 1.25rem;
        }
        .evhub-btn-bottom-link {
          font-family: "DM Sans", sans-serif;
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          text-decoration: none;
          color: rgba(255,255,255,0.6);
          border: 1.5px solid rgba(255,255,255,0.18);
          padding: 0.7rem 1.5rem;
          border-radius: 10px;
          transition: color 0.2s, border-color 0.2s;
          white-space: nowrap;
        }
        .evhub-btn-bottom-link:hover { color: #fff; border-color: rgba(255,255,255,0.45); }
        .evhub-btn-gold {
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
          transition: opacity 0.2s, transform 0.15s;
          white-space: nowrap;
        }
        .evhub-btn-gold:hover { opacity: 0.88; transform: translateY(-1px); }
        .evhub-btn-outline-light {
          font-family: "DM Sans", sans-serif;
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          text-decoration: none;
          color: rgba(255,255,255,0.5);
          border: 1.5px solid rgba(255,255,255,0.2);
          padding: 0.8rem 1.75rem;
          border-radius: 10px;
          transition: opacity 0.2s;
          white-space: nowrap;
        }
        .evhub-btn-outline-light:hover { opacity: 0.7; }

        /* ── Bottom copy column ────────────────────────────────────────── */
        .evhub-bottom-copy { display: flex; flex-direction: column; gap: 0; }

        /* ── Mailing list form ─────────────────────────────────────────── */
        .evhub-ml-form { display: flex; flex-direction: column; gap: 0.5rem; }
        .evhub-ml-fields {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          align-items: stretch;
        }
        .evhub-ml-input {
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.9rem;
          background: rgba(255,255,255,0.08);
          border: 1.5px solid rgba(255,255,255,0.18);
          color: #fff;
          padding: 0.7rem 1rem;
          border-radius: 8px;
          flex: 1 1 160px;
          min-width: 0;
          outline: none;
          transition: border-color 0.18s;
        }
        .evhub-ml-input::placeholder { color: rgba(255,255,255,0.35); }
        .evhub-ml-input:focus { border-color: rgba(255,204,0,0.6); }
        .evhub-ml-input--email { flex: 2 1 200px; }
        .evhub-ml-btn {
          font-family: "DM Sans", sans-serif;
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          background: #D9A919;
          color: #241123;
          border: none;
          padding: 0.7rem 1.4rem;
          border-radius: 8px;
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
          transition: opacity 0.18s, transform 0.15s;
        }
        .evhub-ml-btn:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
        .evhub-ml-btn:disabled { opacity: 0.55; cursor: default; }
        .evhub-ml-fine {
          font-family: "DM Sans", sans-serif;
          font-size: 0.72rem;
          color: rgba(255,255,255,0.28);
          margin: 0;
          line-height: 1.5;
        }
        .evhub-ml-error {
          font-family: "DM Sans", sans-serif;
          font-size: 0.82rem;
          color: #F23359;
          margin: 0;
        }
        .evhub-ml-error a { color: #F23359; text-decoration: underline; }
        .evhub-ml-success {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 1rem 1.25rem;
          background: rgba(47,168,115,0.12);
          border: 1.5px solid rgba(47,168,115,0.3);
          border-radius: 10px;
        }
        .evhub-ml-check {
          font-size: 1.1rem;
          color: #2FA873;
          flex-shrink: 0;
          line-height: 1.4;
        }
        .evhub-ml-success-title {
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.95rem;
          font-weight: 700;
          color: #2FA873;
          margin: 0 0 0.2rem;
        }
        .evhub-ml-success-sub {
          font-family: "DM Sans", sans-serif;
          font-size: 0.82rem;
          color: rgba(255,255,255,0.55);
          margin: 0;
        }

        /* ── Oscar Wilde quote band ─────────────────────────────────────── */
        .evhub-quote-band {
          padding: clamp(2.5rem, 5vw, 4rem) 0 0;
          background: transparent;
        }
        .evhub-quote-photo-wrap {
          position: relative;
          height: clamp(260px, 38vw, 480px);
          overflow: hidden;
        }
        .evhub-quote-photo {
          position: absolute;
          inset: 0;
          background-image: url('/images/performing-zanzibar.jpg');
          background-size: cover;
          background-position: center 35%;
        }
        .evhub-quote-photo-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to right,
            rgba(10,5,14,0.82) 0%,
            rgba(10,5,14,0.6) 50%,
            rgba(10,5,14,0.35) 100%
          );
        }
        .evhub-quote-photo-content {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          padding: 0 clamp(1.5rem, 6vw, 5rem);
          max-width: 860px;
        }
        .evhub-quote {
          margin: 0;
          padding: 0;
          border-left: 3px solid rgba(217,169,25,0.6);
          padding-left: clamp(1.25rem, 3vw, 2.5rem);
        }
        .evhub-quote-text {
          font-family: "Space Grotesk", sans-serif;
          font-size: clamp(1.05rem, 2.2vw, 1.45rem);
          font-style: italic;
          color: rgba(255,255,255,0.9);
          line-height: 1.7;
          margin: 0 0 0.75rem;
          max-width: 660px;
          text-shadow: 0 1px 8px rgba(0,0,0,0.5);
        }
        .evhub-quote-attribution {
          font-family: "DM Sans", sans-serif;
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.5);
        }
      `}</style>
    </>
  );
}
