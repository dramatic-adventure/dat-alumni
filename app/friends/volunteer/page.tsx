"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

// ── Volunteer areas ───────────────────────────────────────────────────────────

const VOLUNTEER_AREAS = [
  {
    id: "event-production",
    label: "Event Production",
    icon: "🎭",
    description:
      "Help produce community showcases, benefit performances, and touring events — from logistics and tech to front-of-house hospitality.",
  },
  {
    id: "outreach-communications",
    label: "Outreach & Communications",
    icon: "📣",
    description:
      "Spread the word. Write content, manage social channels, design graphics, or help us reach new audiences and communities.",
  },
  {
    id: "translation",
    label: "Translation & Interpretation",
    icon: "🌐",
    description:
      "DAT works across languages. Help us translate materials, interpret in workshops, or make our stories accessible across cultural contexts.",
  },
  {
    id: "research-grants",
    label: "Research & Grant Writing",
    icon: "📋",
    description:
      "Support our development work — research funding sources, help draft grant proposals, or assist with impact documentation.",
  },
  {
    id: "mentorship",
    label: "Mentorship & Teaching",
    icon: "✨",
    description:
      "Share your expertise with our artists. Offer skill-building sessions, career guidance, or creative collaboration.",
  },
  {
    id: "advisory",
    label: "Advisory & Strategy",
    icon: "🧭",
    description:
      "Bring your professional background to the table. Advise on finance, legal, communications, technology, or organizational growth.",
  },
];

// ── What to expect steps ──────────────────────────────────────────────────────

const STEPS = [
  {
    number: "01",
    title: "Apply",
    body: "Fill out the short form below. Tell us who you are, what you bring, and where you want to help.",
  },
  {
    number: "02",
    title: "We Connect",
    body: "A member of the DAT team will reach out within two weeks to learn more and explore where you fit.",
  },
  {
    number: "03",
    title: "We Match",
    body: "We'll find the right project, team, or moment that makes good use of your time and talent.",
  },
  {
    number: "04",
    title: "You Show Up",
    body: "Jump in. Volunteer commitments flex to fit your life — one-time, seasonal, or ongoing.",
  },
];

// ── Page ─────────────────────────────────────────────────────────────────────

export default function VolunteerPage() {
  const heroRef = useRef<HTMLDivElement>(null);

  // Parallax
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const handleScroll = () => {
      const scrollY = window.scrollY;
      el.style.backgroundPositionY = `calc(50% + ${scrollY * 0.3}px)`;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Form state
  const [fields, setFields] = useState({
    name: "",
    email: "",
    city: "",
    background: "",
    availability: "",
    message: "",
    website: "", // honeypot
  });
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const toggleArea = (id: string) => {
    setSelectedAreas((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!fields.name.trim() || !fields.email.trim()) {
      setError("Please provide your name and email.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/volunteer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...fields,
          areas: selectedAreas.map(
            (id) => VOLUNTEER_AREAS.find((a) => a.id === id)?.label ?? id
          ),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
      } else {
        setSubmitted(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div
        ref={heroRef}
        style={{
          position: "relative",
          height: "72vh",
          minHeight: 480,
          backgroundImage: "url('/images/rehearsing-nitra.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center 40%",
          display: "flex",
          alignItems: "flex-end",
        }}
      >
        {/* Gradient overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(10,28,18,0.92) 0%, rgba(10,28,18,0.55) 45%, rgba(10,28,18,0.18) 100%)",
          }}
        />
        {/* Green tint strip */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(47,168,115,0.12)",
            mixBlendMode: "multiply",
          }}
        />

        <div className="vl-hero-content">
          <nav className="vl-breadcrumb">
            <Link href="/friends">Friends of DAT</Link>
            <span>/</span>
            <span>Volunteer</span>
          </nav>
          <p className="vl-eyebrow">Give Your Time &amp; Talent</p>
          <h1 className="vl-hero-headline">
            SHOW UP.<br />MAKE IT HAPPEN.
          </h1>
          <p className="vl-hero-sub">
            Every DAT production, workshop, and community programme runs on the energy of people
            who care enough to act. Join us.
          </p>
        </div>
      </div>

      {/* ── Intro ─────────────────────────────────────────────────────────── */}
      <section className="vl-intro-band">
        <div className="vl-container">
          <p className="vl-intro-eyebrow">Why Volunteer with DAT</p>
          <p className="vl-intro-body">
            Dramatic Adventure Theatre is a small organisation doing large-scale work — creating
            original theatre across continents, building drama clubs in underserved communities,
            and telling stories that deserve to be told. Volunteers are not a nice-to-have. They
            are how we make things happen.
          </p>
          <p className="vl-intro-body">
            Whether you have a weekend, a season, or a set of professional skills you&apos;ve been
            waiting to put to meaningful use — there&apos;s a role for you here.
          </p>
        </div>
      </section>

      {/* ── Volunteer Areas ───────────────────────────────────────────────── */}
      <section className="vl-areas-section">
        <div className="vl-container">
          <p className="vl-section-eyebrow">Where You Can Help</p>
          <h2 className="vl-section-title">Six Ways to Show Up</h2>
          <div className="vl-areas-grid">
            {VOLUNTEER_AREAS.map((area) => (
              <div key={area.id} className="vl-area-card">
                <span className="vl-area-icon">{area.icon}</span>
                <h3 className="vl-area-name">{area.label}</h3>
                <p className="vl-area-desc">{area.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What to Expect ────────────────────────────────────────────────── */}
      <section className="vl-process-section">
        <div className="vl-container">
          <p className="vl-section-eyebrow vl-eyebrow-light">What to Expect</p>
          <h2 className="vl-section-title vl-title-light">How It Works</h2>
          <div className="vl-steps-row">
            {STEPS.map((step, i) => (
              <div key={step.number} className="vl-step">
                <div className="vl-step-number">{step.number}</div>
                {i < STEPS.length - 1 && <div className="vl-step-connector" />}
                <h3 className="vl-step-title">{step.title}</h3>
                <p className="vl-step-body">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Application Form ──────────────────────────────────────────────── */}
      <section className="vl-form-section" id="apply">
        <div className="vl-container vl-form-container">
          <p className="vl-section-eyebrow">Ready to Help?</p>
          <h2 className="vl-section-title">Apply to Volunteer</h2>
          <p className="vl-form-intro">
            Tell us a little about yourself. We&apos;ll be in touch within two weeks.
          </p>

          {submitted ? (
            <div className="vl-success">
              <div className="vl-success-icon">🌿</div>
              <h3 className="vl-success-title">You&apos;re in the queue.</h3>
              <p className="vl-success-body">
                Thank you, {fields.name}. We&apos;ve received your application and will reach out
                soon. In the meantime, explore our{" "}
                <Link href="/alumni">artist community</Link> and see the work you&apos;re
                joining.
              </p>
            </div>
          ) : (
            <form className="vl-form" onSubmit={handleSubmit} noValidate>
              {/* Honeypot — hidden from humans */}
              <input
                type="text"
                name="website"
                value={fields.website}
                onChange={handleChange}
                style={{ display: "none" }}
                tabIndex={-1}
                autoComplete="off"
              />

              <div className="vl-form-row">
                <div className="vl-field">
                  <label className="vl-label" htmlFor="vl-name">
                    Full Name <span className="vl-required">*</span>
                  </label>
                  <input
                    id="vl-name"
                    name="name"
                    type="text"
                    className="vl-input"
                    value={fields.name}
                    onChange={handleChange}
                    placeholder="Your name"
                    required
                  />
                </div>
                <div className="vl-field">
                  <label className="vl-label" htmlFor="vl-email">
                    Email Address <span className="vl-required">*</span>
                  </label>
                  <input
                    id="vl-email"
                    name="email"
                    type="email"
                    className="vl-input"
                    value={fields.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div className="vl-field">
                <label className="vl-label" htmlFor="vl-city">
                  City / Country
                </label>
                <input
                  id="vl-city"
                  name="city"
                  type="text"
                  className="vl-input"
                  value={fields.city}
                  onChange={handleChange}
                  placeholder="Where are you based?"
                />
              </div>

              <fieldset className="vl-areas-fieldset">
                <legend className="vl-label">
                  Areas of Interest{" "}
                  <span className="vl-label-note">(select all that apply)</span>
                </legend>
                <div className="vl-areas-check-grid">
                  {VOLUNTEER_AREAS.map((area) => (
                    <label key={area.id} className="vl-checkbox-label">
                      <input
                        type="checkbox"
                        className="vl-checkbox"
                        checked={selectedAreas.includes(area.id)}
                        onChange={() => toggleArea(area.id)}
                      />
                      <span className="vl-checkbox-icon">{area.icon}</span>
                      {area.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="vl-field">
                <label className="vl-label" htmlFor="vl-background">
                  Background &amp; Skills
                </label>
                <textarea
                  id="vl-background"
                  name="background"
                  className="vl-textarea"
                  rows={4}
                  value={fields.background}
                  onChange={handleChange}
                  placeholder="Tell us about your experience, skills, or what you bring to the table."
                />
              </div>

              <div className="vl-field">
                <label className="vl-label" htmlFor="vl-availability">
                  Availability
                </label>
                <select
                  id="vl-availability"
                  name="availability"
                  className="vl-select"
                  value={fields.availability}
                  onChange={handleChange}
                >
                  <option value="">— Select one —</option>
                  <option value="One-time project">One-time project</option>
                  <option value="A few hours per month">A few hours per month</option>
                  <option value="Regular weekly commitment">Regular weekly commitment</option>
                  <option value="Seasonal / event-based">Seasonal / event-based</option>
                  <option value="Open to whatever's needed">Open to whatever&apos;s needed</option>
                </select>
              </div>

              <div className="vl-field">
                <label className="vl-label" htmlFor="vl-message">
                  Anything Else?
                </label>
                <textarea
                  id="vl-message"
                  name="message"
                  className="vl-textarea"
                  rows={3}
                  value={fields.message}
                  onChange={handleChange}
                  placeholder="Questions, ideas, or context you want us to know."
                />
              </div>

              {error && <p className="vl-error">{error}</p>}

              <button type="submit" className="vl-submit-btn" disabled={submitting}>
                {submitting ? "Sending…" : "Send My Application →"}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ── Bottom CTA ────────────────────────────────────────────────────── */}
      <section className="vl-bottom-band">
        <div className="vl-container vl-bottom-inner">
          <p className="vl-bottom-label">Other Ways to Get Involved</p>
          <div className="vl-bottom-links">
            <Link href="/friends/ambassador" className="vl-bottom-link vl-gold">
              Become an Ambassador →
            </Link>
            <Link href="/donate" className="vl-bottom-link vl-pink">
              Make a Donation →
            </Link>
            <Link href="/friends" className="vl-bottom-link vl-muted">
              ← Back to Friends of DAT
            </Link>
          </div>
        </div>
      </section>

      {/* ── Styles ────────────────────────────────────────────────────────── */}
      <style>{`
        /* ── Base ─────────────────────────────────────────────────────────── */
        .vl-container {
          max-width: 1060px;
          margin: 0 auto;
          padding: 0 clamp(1.25rem, 5vw, 3rem);
        }

        /* ── Hero ─────────────────────────────────────────────────────────── */
        .vl-hero-content {
          position: relative;
          z-index: 2;
          padding: 0 clamp(1.5rem, 6vw, 5rem) clamp(2.5rem, 5vw, 4rem);
          max-width: 820px;
        }
        .vl-breadcrumb {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-family: "DM Sans", sans-serif;
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.55);
          margin-bottom: 1.25rem;
        }
        .vl-breadcrumb a {
          color: rgba(255,255,255,0.55);
          text-decoration: none;
          transition: color 0.2s;
        }
        .vl-breadcrumb a:hover { color: #2FA873; }
        .vl-eyebrow {
          font-family: "DM Sans", sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: #2FA873;
          margin: 0 0 0.75rem;
        }
        .vl-hero-headline {
          font-family: "Anton", sans-serif;
          font-size: clamp(2.8rem, 7vw, 6rem);
          font-weight: 400;
          line-height: 0.95;
          color: #fff;
          margin: 0 0 1.25rem;
          letter-spacing: 0.01em;
          text-shadow: 0 2px 20px rgba(0,0,0,0.5);
        }
        .vl-hero-sub {
          font-family: "Space Grotesk", sans-serif;
          font-size: clamp(0.95rem, 2vw, 1.15rem);
          color: rgba(255,255,255,0.78);
          line-height: 1.65;
          margin: 0;
          max-width: 520px;
        }

        /* ── Intro Band ────────────────────────────────────────────────────── */
        .vl-intro-band {
          background: #f6e4c1;
          padding: clamp(3rem, 6vw, 5rem) 0;
        }
        .vl-intro-eyebrow {
          font-family: "DM Sans", sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: #2FA873;
          margin: 0 0 1rem;
        }
        .vl-intro-body {
          font-family: "Space Grotesk", sans-serif;
          font-size: clamp(1rem, 1.8vw, 1.15rem);
          color: #241123;
          line-height: 1.75;
          margin: 0 0 1rem;
          max-width: 720px;
        }
        .vl-intro-body:last-child { margin-bottom: 0; }

        /* ── Areas Section ─────────────────────────────────────────────────── */
        .vl-areas-section {
          background: #fff;
          padding: clamp(3.5rem, 7vw, 6rem) 0;
        }
        .vl-section-eyebrow {
          font-family: "DM Sans", sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: #2FA873;
          margin: 0 0 0.6rem;
        }
        .vl-section-title {
          font-family: "Anton", sans-serif;
          font-size: clamp(2rem, 4vw, 3.2rem);
          font-weight: 400;
          color: #241123;
          margin: 0 0 2.5rem;
          letter-spacing: 0.01em;
          line-height: 1;
        }
        .vl-areas-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
          gap: 1.25rem;
        }
        .vl-area-card {
          background: #fdf9f1;
          border: 1px solid #e8d9bc;
          border-radius: 12px;
          padding: 1.75rem 1.5rem;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .vl-area-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 28px rgba(47,168,115,0.12);
        }
        .vl-area-icon {
          font-size: 2rem;
          display: block;
          margin-bottom: 0.85rem;
        }
        .vl-area-name {
          font-family: "Space Grotesk", sans-serif;
          font-size: 1rem;
          font-weight: 700;
          color: #241123;
          margin: 0 0 0.6rem;
        }
        .vl-area-desc {
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.88rem;
          color: #5a4060;
          line-height: 1.65;
          margin: 0;
        }

        /* ── Process Section ───────────────────────────────────────────────── */
        .vl-process-section {
          background: #1a0d1a;
          padding: clamp(3.5rem, 7vw, 6rem) 0;
        }
        .vl-eyebrow-light {
          color: #2FA873 !important;
        }
        .vl-title-light {
          color: #fff !important;
        }
        .vl-steps-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 2rem;
        }
        .vl-step {
          position: relative;
        }
        .vl-step-number {
          font-family: "Anton", sans-serif;
          font-size: 3.5rem;
          font-weight: 400;
          color: #2FA873;
          opacity: 0.35;
          line-height: 1;
          margin-bottom: 0.5rem;
        }
        .vl-step-title {
          font-family: "Space Grotesk", sans-serif;
          font-size: 1.05rem;
          font-weight: 700;
          color: #fff;
          margin: 0 0 0.5rem;
        }
        .vl-step-body {
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.88rem;
          color: rgba(255,255,255,0.6);
          line-height: 1.65;
          margin: 0;
        }

        /* ── Form Section ──────────────────────────────────────────────────── */
        .vl-form-section {
          background: #f6e4c1;
          padding: clamp(3.5rem, 7vw, 6rem) 0;
        }
        .vl-form-container {
          max-width: 760px;
        }
        .vl-form-intro {
          font-family: "Space Grotesk", sans-serif;
          font-size: 1rem;
          color: #5a4060;
          margin: 0 0 2.5rem;
          line-height: 1.6;
        }
        .vl-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .vl-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
        }
        @media (max-width: 600px) {
          .vl-form-row { grid-template-columns: 1fr; }
        }
        .vl-field {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .vl-label {
          font-family: "DM Sans", sans-serif;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #241123;
        }
        .vl-label-note {
          font-weight: 400;
          letter-spacing: 0;
          text-transform: none;
          color: #7a5e80;
          font-size: 0.75rem;
        }
        .vl-required { color: #2FA873; }
        .vl-input,
        .vl-textarea,
        .vl-select {
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.95rem;
          color: #241123;
          background: #fff;
          border: 1.5px solid #d4c4a8;
          border-radius: 8px;
          padding: 0.7rem 0.9rem;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          width: 100%;
          box-sizing: border-box;
        }
        .vl-input:focus,
        .vl-textarea:focus,
        .vl-select:focus {
          border-color: #2FA873;
          box-shadow: 0 0 0 3px rgba(47,168,115,0.15);
        }
        .vl-textarea { resize: vertical; }
        .vl-select { appearance: none; cursor: pointer; }

        /* Checkbox area grid */
        .vl-areas-fieldset {
          border: 1.5px solid #d4c4a8;
          border-radius: 10px;
          padding: 1.25rem 1.25rem 1rem;
          background: #fff;
        }
        .vl-areas-fieldset legend { padding: 0 0.4rem; }
        .vl-areas-check-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 0.6rem;
          margin-top: 0.9rem;
        }
        .vl-checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.55rem;
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.88rem;
          color: #241123;
          cursor: pointer;
          padding: 0.45rem 0.6rem;
          border-radius: 6px;
          transition: background 0.15s;
        }
        .vl-checkbox-label:hover { background: #f6e4c1; }
        .vl-checkbox {
          width: 16px;
          height: 16px;
          accent-color: #2FA873;
          cursor: pointer;
          flex-shrink: 0;
        }
        .vl-checkbox-icon { font-size: 1rem; }

        /* Error / Submit */
        .vl-error {
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.88rem;
          color: #c0392b;
          background: rgba(192,57,43,0.08);
          border: 1px solid rgba(192,57,43,0.2);
          border-radius: 6px;
          padding: 0.6rem 0.9rem;
          margin: 0;
        }
        .vl-submit-btn {
          align-self: flex-start;
          font-family: "DM Sans", sans-serif;
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #fff;
          background: #2FA873;
          border: none;
          border-radius: 10px;
          padding: 0.9rem 2rem;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s;
        }
        .vl-submit-btn:hover:not(:disabled) {
          background: #259962;
          transform: translateY(-1px);
        }
        .vl-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Success state */
        .vl-success {
          text-align: center;
          padding: clamp(2rem, 5vw, 4rem) 1rem;
        }
        .vl-success-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }
        .vl-success-title {
          font-family: "Anton", sans-serif;
          font-size: clamp(1.8rem, 4vw, 2.8rem);
          font-weight: 400;
          color: #241123;
          margin: 0 0 0.75rem;
        }
        .vl-success-body {
          font-family: "Space Grotesk", sans-serif;
          font-size: 1rem;
          color: #5a4060;
          line-height: 1.7;
          max-width: 480px;
          margin: 0 auto;
        }
        .vl-success-body a {
          color: #2FA873;
          font-weight: 600;
        }

        /* ── Bottom Band ───────────────────────────────────────────────────── */
        .vl-bottom-band {
          background: #241123;
          padding: clamp(2.5rem, 5vw, 4rem) 0;
        }
        .vl-bottom-inner {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .vl-bottom-label {
          font-family: "DM Sans", sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.4);
          margin: 0;
        }
        .vl-bottom-links {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          align-items: center;
        }
        .vl-bottom-link {
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
        .vl-bottom-link:hover {
          opacity: 0.85;
          transform: translateY(-1px);
        }
        .vl-gold {
          background: #D9A919;
          color: #241123;
        }
        .vl-pink {
          background: transparent;
          color: #F23359;
          border: 1.5px solid rgba(242,51,89,0.45);
        }
        .vl-muted {
          background: transparent;
          color: rgba(255,255,255,0.45);
          border: 1.5px solid rgba(255,255,255,0.15);
        }
      `}</style>
    </>
  );
}
