"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

// ── What ambassadors do ───────────────────────────────────────────────────────

const AMBASSADOR_ROLES = [
  {
    icon: "📢",
    title: "Spread the Story",
    body: "Share DAT's work with your personal and professional networks — on social media, in conversation, at events.",
  },
  {
    icon: "🤝",
    title: "Make Introductions",
    body: "Connect us with potential partners, funders, venues, schools, and communities who could benefit from or support our work.",
  },
  {
    icon: "🎟️",
    title: "Support Live Events",
    body: "Help promote and host events in your city — from benefit performances to community screenings to fundraising evenings.",
  },
  {
    icon: "🌍",
    title: "Be a Local Voice",
    body: "Represent DAT in your community. When people ask who we are, you have the answer — and the story to tell.",
  },
  {
    icon: "💡",
    title: "Bring Ideas",
    body: "You know your community better than we do. Propose collaborations, flag opportunities, and help us think bigger.",
  },
];

// ── Ambassador benefits ───────────────────────────────────────────────────────

const BENEFITS = [
  { icon: "🎭", label: "Behind-the-scenes access to DAT productions and rehearsals" },
  { icon: "📬", label: "Regular ambassador briefings and programme updates" },
  { icon: "🌐", label: "A named place in the DAT community and on our site" },
  { icon: "✈️", label: "Priority access to DAT travel and cultural exchange opportunities" },
  { icon: "🤲", label: "Direct connection with the artists and communities you're supporting" },
];

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AmbassadorPage() {
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
    why: "",
    connections: "",
    hear: "",
    website: "", // honeypot
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

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
      const res = await fetch("/api/ambassador", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
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
          backgroundImage: "url('/images/alumni-hero.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center 30%",
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
              "linear-gradient(to top, rgba(28,18,5,0.93) 0%, rgba(28,18,5,0.5) 45%, rgba(28,18,5,0.15) 100%)",
          }}
        />
        {/* Gold tint */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(217,169,25,0.08)",
            mixBlendMode: "multiply",
          }}
        />

        <div className="amb-hero-content">
          <nav className="amb-breadcrumb">
            <Link href="/friends">Friends of DAT</Link>
            <span>/</span>
            <span>Ambassador</span>
          </nav>
          <p className="amb-eyebrow">Join as an Ambassador</p>
          <h1 className="amb-hero-headline">
            CARRY THE<br />STORY HOME.
          </h1>
          <p className="amb-hero-sub">
            DAT Ambassadors are advocates, connectors, and champions who bring our work to new
            communities — wherever in the world they live.
          </p>
        </div>
      </div>

      {/* ── What Is an Ambassador ─────────────────────────────────────────── */}
      <section className="amb-intro-band">
        <div className="amb-container amb-intro-grid">
          <div>
            <p className="amb-section-eyebrow">The Role</p>
            <h2 className="amb-section-title">What Is a DAT Ambassador?</h2>
          </div>
          <div>
            <p className="amb-intro-body">
              A DAT Ambassador is someone who believes in the power of theatre to cross borders,
              build empathy, and change lives — and who is willing to say so. Publicly.
            </p>
            <p className="amb-intro-body">
              Ambassadors are our most vocal supporters. They show up at events, make introductions,
              champion our fundraising campaigns, and help the communities they move through
              understand what Dramatic Adventure Theatre is and why it matters.
            </p>
            <p className="amb-intro-body">
              This is not a passive role. We want people who are genuinely excited about our work
              and ready to talk about it. In return, we invest in you — with access, information,
              and connection to the artists and stories at the heart of DAT.
            </p>
          </div>
        </div>
      </section>

      {/* ── What Ambassadors Do ───────────────────────────────────────────── */}
      <section className="amb-roles-section">
        <div className="amb-container">
          <p className="amb-section-eyebrow">What You&apos;ll Do</p>
          <h2 className="amb-section-title">Five Ways Ambassadors Act</h2>
          <div className="amb-roles-grid">
            {AMBASSADOR_ROLES.map((role) => (
              <div key={role.title} className="amb-role-card">
                <span className="amb-role-icon">{role.icon}</span>
                <h3 className="amb-role-title">{role.title}</h3>
                <p className="amb-role-body">{role.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Benefits ──────────────────────────────────────────────────────── */}
      <section className="amb-benefits-section">
        <div className="amb-container amb-benefits-inner">
          <div className="amb-benefits-left">
            <p className="amb-section-eyebrow amb-eyebrow-light">What You Get</p>
            <h2 className="amb-section-title amb-title-light">Ambassador Benefits</h2>
            <p className="amb-benefits-sub">
              Ambassadorship is a two-way relationship. We want you to feel as connected and
              informed as any member of the DAT team.
            </p>
          </div>
          <ul className="amb-benefits-list">
            {BENEFITS.map((b) => (
              <li key={b.label} className="amb-benefit-item">
                <span className="amb-benefit-icon">{b.icon}</span>
                <span>{b.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Commitment ────────────────────────────────────────────────────── */}
      <section className="amb-commitment-section">
        <div className="amb-container">
          <p className="amb-section-eyebrow">What We Ask</p>
          <h2 className="amb-section-title">The Commitment</h2>
          <div className="amb-commitment-grid">
            <div className="amb-commitment-card">
              <div className="amb-commit-num">01</div>
              <h3 className="amb-commit-title">One Year Minimum</h3>
              <p className="amb-commit-body">
                We ask for a one-year commitment so we can build real momentum together.
                Most ambassadors stay much longer.
              </p>
            </div>
            <div className="amb-commitment-card">
              <div className="amb-commit-num">02</div>
              <h3 className="amb-commit-title">A Few Hours Per Month</h3>
              <p className="amb-commit-body">
                There&apos;s no fixed hour count — ambassadors flex to their availability.
                Active ambassadors find natural ways to show up regularly.
              </p>
            </div>
            <div className="amb-commitment-card">
              <div className="amb-commit-num">03</div>
              <h3 className="amb-commit-title">Genuine Enthusiasm</h3>
              <p className="amb-commit-body">
                We need people who are genuinely moved by the work. The only requirement
                is that you care — and that it shows.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Application Form ──────────────────────────────────────────────── */}
      <section className="amb-form-section" id="apply">
        <div className="amb-container amb-form-container">
          <p className="amb-section-eyebrow">Ready to Carry the Story?</p>
          <h2 className="amb-section-title">Apply to Be an Ambassador</h2>
          <p className="amb-form-intro">
            Tell us who you are and why you want to represent DAT. We review every application
            personally and respond within two weeks.
          </p>

          {submitted ? (
            <div className="amb-success">
              <div className="amb-success-icon">✨</div>
              <h3 className="amb-success-title">Application received.</h3>
              <p className="amb-success-body">
                Thank you, {fields.name}. We&apos;ll be in touch soon. In the meantime, take a
                look at our{" "}
                <Link href="/alumni">artist community</Link> — the people whose stories you&apos;ll
                be carrying.
              </p>
            </div>
          ) : (
            <form className="amb-form" onSubmit={handleSubmit} noValidate>
              {/* Honeypot */}
              <input
                type="text"
                name="website"
                value={fields.website}
                onChange={handleChange}
                style={{ display: "none" }}
                tabIndex={-1}
                autoComplete="off"
              />

              <div className="amb-form-row">
                <div className="amb-field">
                  <label className="amb-label" htmlFor="amb-name">
                    Full Name <span className="amb-required">*</span>
                  </label>
                  <input
                    id="amb-name"
                    name="name"
                    type="text"
                    className="amb-input"
                    value={fields.name}
                    onChange={handleChange}
                    placeholder="Your name"
                    required
                  />
                </div>
                <div className="amb-field">
                  <label className="amb-label" htmlFor="amb-email">
                    Email Address <span className="amb-required">*</span>
                  </label>
                  <input
                    id="amb-email"
                    name="email"
                    type="email"
                    className="amb-input"
                    value={fields.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div className="amb-form-row">
                <div className="amb-field">
                  <label className="amb-label" htmlFor="amb-city">
                    City / Country
                  </label>
                  <input
                    id="amb-city"
                    name="city"
                    type="text"
                    className="amb-input"
                    value={fields.city}
                    onChange={handleChange}
                    placeholder="Where are you based?"
                  />
                </div>
                <div className="amb-field">
                  <label className="amb-label" htmlFor="amb-hear">
                    How Did You Hear About DAT?
                  </label>
                  <input
                    id="amb-hear"
                    name="hear"
                    type="text"
                    className="amb-input"
                    value={fields.hear}
                    onChange={handleChange}
                    placeholder="Referral, social media, event…"
                  />
                </div>
              </div>

              <div className="amb-field">
                <label className="amb-label" htmlFor="amb-why">
                  Why Do You Want to Be a DAT Ambassador?
                </label>
                <textarea
                  id="amb-why"
                  name="why"
                  className="amb-textarea"
                  rows={5}
                  value={fields.why}
                  onChange={handleChange}
                  placeholder="Tell us what draws you to DAT's work and why you want to represent it."
                />
              </div>

              <div className="amb-field">
                <label className="amb-label" htmlFor="amb-connections">
                  What Communities or Networks Can You Reach?
                </label>
                <textarea
                  id="amb-connections"
                  name="connections"
                  className="amb-textarea"
                  rows={4}
                  value={fields.connections}
                  onChange={handleChange}
                  placeholder="Schools, arts organisations, businesses, social communities — who do you know who should know about DAT?"
                />
              </div>

              {error && <p className="amb-error">{error}</p>}

              <button type="submit" className="amb-submit-btn" disabled={submitting}>
                {submitting ? "Sending…" : "Send My Application →"}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ── Bottom CTA ────────────────────────────────────────────────────── */}
      <section className="amb-bottom-band">
        <div className="amb-container amb-bottom-inner">
          <p className="amb-bottom-label">Other Ways to Get Involved</p>
          <div className="amb-bottom-links">
            <Link href="/friends/volunteer" className="amb-bottom-link amb-green">
              Volunteer with DAT →
            </Link>
            <Link href="/donate" className="amb-bottom-link amb-pink">
              Make a Donation →
            </Link>
            <Link href="/friends" className="amb-bottom-link amb-muted">
              ← Back to Friends of DAT
            </Link>
          </div>
        </div>
      </section>

      {/* ── Styles ────────────────────────────────────────────────────────── */}
      <style>{`
        /* ── Base ─────────────────────────────────────────────────────────── */
        .amb-container {
          max-width: 1060px;
          margin: 0 auto;
          padding: 0 clamp(1.25rem, 5vw, 3rem);
        }

        /* ── Hero ─────────────────────────────────────────────────────────── */
        .amb-hero-content {
          position: relative;
          z-index: 2;
          padding: 0 clamp(1.5rem, 6vw, 5rem) clamp(2.5rem, 5vw, 4rem);
          max-width: 820px;
        }
        .amb-breadcrumb {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-family: "DM Sans", sans-serif;
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.5);
          margin-bottom: 1.25rem;
        }
        .amb-breadcrumb a {
          color: rgba(255,255,255,0.5);
          text-decoration: none;
          transition: color 0.2s;
        }
        .amb-breadcrumb a:hover { color: #D9A919; }
        .amb-eyebrow {
          font-family: "DM Sans", sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: #D9A919;
          margin: 0 0 0.75rem;
        }
        .amb-hero-headline {
          font-family: "Anton", sans-serif;
          font-size: clamp(2.8rem, 7vw, 6rem);
          font-weight: 400;
          line-height: 0.95;
          color: #fff;
          margin: 0 0 1.25rem;
          letter-spacing: 0.01em;
          text-shadow: 0 2px 20px rgba(0,0,0,0.5);
        }
        .amb-hero-sub {
          font-family: "Space Grotesk", sans-serif;
          font-size: clamp(0.95rem, 2vw, 1.15rem);
          color: rgba(255,255,255,0.78);
          line-height: 1.65;
          margin: 0;
          max-width: 520px;
        }

        /* ── Intro Band ────────────────────────────────────────────────────── */
        .amb-intro-band {
          background: #f6e4c1;
          padding: clamp(3rem, 6vw, 5rem) 0;
        }
        .amb-intro-grid {
          display: grid;
          grid-template-columns: 1fr 1.6fr;
          gap: clamp(2rem, 5vw, 4rem);
          align-items: start;
        }
        @media (max-width: 700px) {
          .amb-intro-grid { grid-template-columns: 1fr; }
        }
        .amb-section-eyebrow {
          font-family: "DM Sans", sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: #D9A919;
          margin: 0 0 0.6rem;
        }
        .amb-section-title {
          font-family: "Anton", sans-serif;
          font-size: clamp(2rem, 4vw, 3.2rem);
          font-weight: 400;
          color: #241123;
          margin: 0 0 1.5rem;
          letter-spacing: 0.01em;
          line-height: 1;
        }
        .amb-intro-body {
          font-family: "Space Grotesk", sans-serif;
          font-size: clamp(0.95rem, 1.8vw, 1.05rem);
          color: #241123;
          line-height: 1.75;
          margin: 0 0 1rem;
        }
        .amb-intro-body:last-child { margin-bottom: 0; }

        /* ── Roles Section ─────────────────────────────────────────────────── */
        .amb-roles-section {
          background: #fff;
          padding: clamp(3.5rem, 7vw, 6rem) 0;
        }
        .amb-roles-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
          gap: 1.25rem;
        }
        .amb-role-card {
          background: #fdf9f1;
          border: 1px solid #e8d9bc;
          border-radius: 12px;
          padding: 1.75rem 1.5rem;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .amb-role-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 28px rgba(217,169,25,0.15);
        }
        .amb-role-icon {
          font-size: 2rem;
          display: block;
          margin-bottom: 0.85rem;
        }
        .amb-role-title {
          font-family: "Space Grotesk", sans-serif;
          font-size: 1rem;
          font-weight: 700;
          color: #241123;
          margin: 0 0 0.6rem;
        }
        .amb-role-body {
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.88rem;
          color: #5a4060;
          line-height: 1.65;
          margin: 0;
        }

        /* ── Benefits Section ──────────────────────────────────────────────── */
        .amb-benefits-section {
          background: #1a0d1a;
          padding: clamp(3.5rem, 7vw, 6rem) 0;
        }
        .amb-benefits-inner {
          display: grid;
          grid-template-columns: 1fr 1.4fr;
          gap: clamp(2.5rem, 6vw, 5rem);
          align-items: start;
        }
        @media (max-width: 700px) {
          .amb-benefits-inner { grid-template-columns: 1fr; }
        }
        .amb-eyebrow-light { color: #D9A919 !important; }
        .amb-title-light { color: #fff !important; }
        .amb-benefits-sub {
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.95rem;
          color: rgba(255,255,255,0.55);
          line-height: 1.7;
          margin: 0;
        }
        .amb-benefits-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding-top: 0.5rem;
        }
        .amb-benefit-item {
          display: flex;
          align-items: flex-start;
          gap: 0.9rem;
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.95rem;
          color: rgba(255,255,255,0.78);
          line-height: 1.55;
          padding: 1rem 1.25rem;
          background: rgba(217,169,25,0.06);
          border: 1px solid rgba(217,169,25,0.15);
          border-radius: 10px;
        }
        .amb-benefit-icon { font-size: 1.2rem; flex-shrink: 0; }

        /* ── Commitment Section ────────────────────────────────────────────── */
        .amb-commitment-section {
          background: #f6e4c1;
          padding: clamp(3.5rem, 7vw, 6rem) 0;
        }
        .amb-commitment-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 1.25rem;
        }
        .amb-commitment-card {
          background: #fff;
          border: 1px solid #e8d9bc;
          border-radius: 12px;
          padding: 2rem 1.75rem;
        }
        .amb-commit-num {
          font-family: "Anton", sans-serif;
          font-size: 3rem;
          font-weight: 400;
          color: #D9A919;
          opacity: 0.45;
          line-height: 1;
          margin-bottom: 0.5rem;
        }
        .amb-commit-title {
          font-family: "Space Grotesk", sans-serif;
          font-size: 1.05rem;
          font-weight: 700;
          color: #241123;
          margin: 0 0 0.5rem;
        }
        .amb-commit-body {
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.88rem;
          color: #5a4060;
          line-height: 1.65;
          margin: 0;
        }

        /* ── Form Section ──────────────────────────────────────────────────── */
        .amb-form-section {
          background: #fff;
          padding: clamp(3.5rem, 7vw, 6rem) 0;
        }
        .amb-form-container {
          max-width: 760px;
        }
        .amb-form-intro {
          font-family: "Space Grotesk", sans-serif;
          font-size: 1rem;
          color: #5a4060;
          margin: 0 0 2.5rem;
          line-height: 1.65;
        }
        .amb-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .amb-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
        }
        @media (max-width: 600px) {
          .amb-form-row { grid-template-columns: 1fr; }
        }
        .amb-field {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .amb-label {
          font-family: "DM Sans", sans-serif;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #241123;
        }
        .amb-required { color: #D9A919; }
        .amb-input,
        .amb-textarea {
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.95rem;
          color: #241123;
          background: #fdf9f1;
          border: 1.5px solid #d4c4a8;
          border-radius: 8px;
          padding: 0.7rem 0.9rem;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          width: 100%;
          box-sizing: border-box;
        }
        .amb-input:focus,
        .amb-textarea:focus {
          border-color: #D9A919;
          box-shadow: 0 0 0 3px rgba(217,169,25,0.15);
        }
        .amb-textarea { resize: vertical; }

        .amb-error {
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.88rem;
          color: #c0392b;
          background: rgba(192,57,43,0.08);
          border: 1px solid rgba(192,57,43,0.2);
          border-radius: 6px;
          padding: 0.6rem 0.9rem;
          margin: 0;
        }
        .amb-submit-btn {
          align-self: flex-start;
          font-family: "DM Sans", sans-serif;
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #241123;
          background: #D9A919;
          border: none;
          border-radius: 10px;
          padding: 0.9rem 2rem;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s;
        }
        .amb-submit-btn:hover:not(:disabled) {
          background: #c49616;
          transform: translateY(-1px);
        }
        .amb-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Success state */
        .amb-success {
          text-align: center;
          padding: clamp(2rem, 5vw, 4rem) 1rem;
        }
        .amb-success-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }
        .amb-success-title {
          font-family: "Anton", sans-serif;
          font-size: clamp(1.8rem, 4vw, 2.8rem);
          font-weight: 400;
          color: #241123;
          margin: 0 0 0.75rem;
        }
        .amb-success-body {
          font-family: "Space Grotesk", sans-serif;
          font-size: 1rem;
          color: #5a4060;
          line-height: 1.7;
          max-width: 480px;
          margin: 0 auto;
        }
        .amb-success-body a {
          color: #D9A919;
          font-weight: 600;
        }

        /* ── Bottom Band ───────────────────────────────────────────────────── */
        .amb-bottom-band {
          background: #241123;
          padding: clamp(2.5rem, 5vw, 4rem) 0;
        }
        .amb-bottom-inner {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .amb-bottom-label {
          font-family: "DM Sans", sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.4);
          margin: 0;
        }
        .amb-bottom-links {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          align-items: center;
        }
        .amb-bottom-link {
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
        .amb-bottom-link:hover {
          opacity: 0.85;
          transform: translateY(-1px);
        }
        .amb-green {
          background: #2FA873;
          color: #fff;
        }
        .amb-pink {
          background: transparent;
          color: #F23359;
          border: 1.5px solid rgba(242,51,89,0.45);
        }
        .amb-muted {
          background: transparent;
          color: rgba(255,255,255,0.45);
          border: 1.5px solid rgba(255,255,255,0.15);
        }
      `}</style>
    </>
  );
}
