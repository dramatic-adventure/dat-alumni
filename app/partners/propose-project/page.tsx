// app/partners/propose-project/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, FormEvent, Suspense } from "react";
import { useSearchParams } from "next/navigation";

/* ─── Partnership type options ─── */
const PARTNER_TYPES = [
  { value: "university", label: "University / Study Abroad Program" },
  { value: "corporate", label: "Corporate / CSR Initiative" },
  { value: "adventure-day", label: "Adventure Day" },
  { value: "artist-sponsorship", label: "Artist Sponsorship" },
  { value: "drama-club", label: "Drama Club Sponsorship" },
  { value: "foundation", label: "Foundation / Grant Partnership" },
  { value: "municipal", label: "Municipality / Government Body" },
  { value: "cultural-org", label: "Cultural Organization" },
  { value: "custom", label: "Something Else Entirely" },
];

/* ─── What happens after ─── */
const nextSteps = [
  { icon: "📬", step: "We read your proposal", desc: "Every submission is read personally by DAT's partnership team — usually within 3–5 business days." },
  { icon: "☎️", step: "We reach out", desc: "If there's a good fit, we'll schedule a call to learn more about your vision, your community, and what you're hoping to build." },
  { icon: "✏️", step: "We co-design", desc: "Together, we shape a program, initiative, or partnership that works for both our organizations." },
  { icon: "🚀", step: "We launch", desc: "We handle the logistics. You get to be part of something unforgettable." },
];

/* ─── Inner form component (needs useSearchParams) ─── */
function ProposeForm() {
  const params = useSearchParams();
  const preselectedType = params?.get("type") ?? "";

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    org: "",
    orgType: preselectedType || "",
    vision: "",
    timeline: "",
    community: "",
    hear: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/partner-proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          org: form.org,
          orgType: form.orgType,
          vision: form.vision,
          timeline: form.timeline,
          community: form.community,
          hear: form.hear,
        }),
      });

      if (!res.ok) throw new Error("Submission failed");
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please email us directly at hello@dramaticadventure.com");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="pp-success">
        <span className="pp-success__icon" aria-hidden="true">✨</span>
        <h2 className="pp-success__title">We received your proposal.</h2>
        <p className="pp-success__body">
          Thank you, {form.name || "friend"}. We'll read your message and be in touch within 3–5 business days. We're looking forward to learning more about what you're imagining.
        </p>
        <div className="pp-success__actions">
          <Link href="/partners" className="pp-btn pp-btn--purple">
            Explore Other Partnerships
          </Link>
          <Link href="/alumni" className="pp-btn pp-btn--outline">
            Meet DAT Artists
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="pp-form" noValidate>
      {/* Row 1: Name + Email */}
      <div className="pp-row">
        <div className="pp-field">
          <label htmlFor="name" className="pp-label">Your Name <span aria-hidden="true">*</span></label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="pp-input"
            placeholder="First and last name"
            value={form.name}
            onChange={handleChange}
            autoComplete="name"
          />
        </div>
        <div className="pp-field">
          <label htmlFor="email" className="pp-label">Email Address <span aria-hidden="true">*</span></label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="pp-input"
            placeholder="you@yourorganization.org"
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
          />
        </div>
      </div>

      {/* Row 2: Org + Partnership Type */}
      <div className="pp-row">
        <div className="pp-field">
          <label htmlFor="org" className="pp-label">Organization Name</label>
          <input
            id="org"
            name="org"
            type="text"
            className="pp-input"
            placeholder="University, company, foundation, etc."
            value={form.org}
            onChange={handleChange}
          />
        </div>
        <div className="pp-field">
          <label htmlFor="orgType" className="pp-label">Partnership Type <span aria-hidden="true">*</span></label>
          <select
            id="orgType"
            name="orgType"
            required
            className="pp-input pp-select"
            value={form.orgType}
            onChange={handleChange}
          >
            <option value="" disabled>Select the closest fit…</option>
            {PARTNER_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Vision */}
      <div className="pp-field pp-field--full">
        <label htmlFor="vision" className="pp-label">What are you imagining? <span aria-hidden="true">*</span></label>
        <textarea
          id="vision"
          name="vision"
          required
          rows={5}
          className="pp-input pp-textarea"
          placeholder="Tell us about your vision — what you'd love to create, why it excites you, and who it would serve. Don't be afraid to dream big."
          value={form.vision}
          onChange={handleChange}
        />
      </div>

      {/* Row 3: Community + Timeline */}
      <div className="pp-row">
        <div className="pp-field">
          <label htmlFor="community" className="pp-label">Where is your community or audience?</label>
          <input
            id="community"
            name="community"
            type="text"
            className="pp-input"
            placeholder="City, country, or region"
            value={form.community}
            onChange={handleChange}
          />
        </div>
        <div className="pp-field">
          <label htmlFor="timeline" className="pp-label">Hoped-for timeline</label>
          <input
            id="timeline"
            name="timeline"
            type="text"
            className="pp-input"
            placeholder="e.g. Fall 2025, ASAP, flexible…"
            value={form.timeline}
            onChange={handleChange}
          />
        </div>
      </div>

      {/* How did you hear */}
      <div className="pp-field pp-field--full">
        <label htmlFor="hear" className="pp-label">How did you find DAT?</label>
        <input
          id="hear"
          name="hear"
          type="text"
          className="pp-input"
          placeholder="Referral, social media, a DAT alumni, etc."
          value={form.hear}
          onChange={handleChange}
        />
      </div>

      {/* Error state */}
      {error && (
        <p className="pp-error" role="alert">{error}</p>
      )}

      <div className="pp-form__footer">
        <button
          type="submit"
          className="pp-btn pp-btn--submit"
          disabled={submitting}
          aria-busy={submitting}
        >
          {submitting ? "Sending…" : "Send My Proposal →"}
        </button>
        <p className="pp-form__note">
          We read every proposal personally. You'll hear from a human.
        </p>
      </div>
    </form>
  );
}

/* ─── Page component ─── */
export default function ProposeProjectPage() {
  return (
    <main style={{ background: "transparent", overflowX: "hidden" }}>

      {/* ══════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════ */}
      <section className="pp-hero" aria-label="Propose a partnership hero">
        <div className="pp-hero__img-wrap">
          <Image
            src="/images/alumni-hero.jpg"
            alt="DAT artists in performance"
            fill
            priority
            sizes="100vw"
            style={{ objectFit: "cover", objectPosition: "center 25%" }}
          />
        </div>
        <div className="pp-hero__overlay" aria-hidden="true" />
        <div className="pp-hero__stack">
          <Link href="/partners" className="pp-breadcrumb">← All Partnerships</Link>
          <span className="pp-eyebrow">Co-create with DAT</span>
          <h1 className="pp-hero__title">
            Bring your bold idea.
          </h1>
          <p className="pp-hero__sub">
            We don't do off-the-shelf. Every DAT partnership is built from scratch — shaped around your community, your vision, and what theatre can do in that specific place and time.
          </p>
        </div>
      </section>


      {/* ══════════════════════════════════════════════════
          MAIN LAYOUT: FORM + SIDEBAR
      ══════════════════════════════════════════════════ */}
      <section className="pp-main" aria-labelledby="pp-form-heading">
        <div className="pp-main__inner">

          {/* Left: form */}
          <div className="pp-main__form-col">
            <div className="pp-form-header">
              <span className="pp-eyebrow pp-eyebrow--purple">YOUR PROPOSAL</span>
              <h2 id="pp-form-heading" className="pp-form-header__title">
                Start the conversation.
              </h2>
              <p className="pp-form-header__sub">
                Tell us who you are and what you're imagining. We'll take it from there.
              </p>
            </div>

            <Suspense fallback={<div className="pp-form-loading">Loading form…</div>}>
              <ProposeForm />
            </Suspense>
          </div>

          {/* Right: sidebar */}
          <aside className="pp-sidebar" aria-label="What happens next">
            <div className="pp-sidebar__block">
              <span className="pp-eyebrow pp-eyebrow--purple">WHAT HAPPENS NEXT</span>
              <h3 className="pp-sidebar__title">From submission to partnership.</h3>
              <div className="pp-next-steps">
                {nextSteps.map((ns, i) => (
                  <div key={i} className="pp-next-step">
                    <span className="pp-next-step__icon" aria-hidden="true">{ns.icon}</span>
                    <div>
                      <h4 className="pp-next-step__title">{ns.step}</h4>
                      <p className="pp-next-step__desc">{ns.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pp-sidebar__block pp-sidebar__block--teal">
              <span className="pp-sidebar__block-label">Already have a program in mind?</span>
              <p className="pp-sidebar__block-body">
                Explore our university and corporate pathways for more detail on what a structured DAT partnership might look like for you.
              </p>
              <div className="pp-sidebar__links">
                <Link href="/partners/universities" className="pp-link">University Programs →</Link>
                <Link href="/partners/corporate-giving" className="pp-link">Corporate Giving →</Link>
              </div>
            </div>

            <div className="pp-sidebar__block pp-sidebar__block--dark">
              <span className="pp-sidebar__block-label pp-sidebar__block-label--yellow">Prefer to email directly?</span>
              <p className="pp-sidebar__block-body" style={{ color: "rgba(242,242,242,0.7)" }}>
                Reach our partnership team at:
              </p>
              <a
                href="mailto:hello@dramaticadventure.com"
                className="pp-email-link"
              >
                hello@dramaticadventure.com
              </a>
            </div>
          </aside>
        </div>
      </section>


      {/* ══════════════════════════════════════════════════
          INSPIRATION BAND
      ══════════════════════════════════════════════════ */}
      <section className="pp-inspiration" aria-label="Partnership examples">
        <div className="pp-inspiration__inner">
          <span className="pp-eyebrow" style={{ color: "rgba(242,242,242,0.55)" }}>WHAT'S BEEN DONE</span>
          <h2 className="pp-inspiration__title">Some of what we've built with partners.</h2>
          <p className="pp-inspiration__sub">
            These are real programs that started with a conversation like the one you're about to have.
          </p>

          <div className="pp-inspiration__cards">
            {[
              {
                label: "University Partnership",
                headline: "A semester-long devised theatre program in Ecuador",
                body: "Students from a US university spent a full semester in the Amazon working with Shuar youth artists — devising, performing, and co-creating a play about environmental justice.",
                color: "#6c00af",
              },
              {
                label: "Corporate CSR",
                headline: "An Adventure Day with a mid-size tech company in NYC",
                body: "Fifty employees spent a day creating short plays alongside young artists from the Bronx, exploring themes of belonging, ambition, and neighborhood pride.",
                color: "#2493a9",
              },
              {
                label: "Foundation Partnership",
                headline: "Multi-year Drama Club funding in Central Europe",
                body: "A family foundation funded Drama Clubs in Slovakia and Kosovo for three years, with annual site visits and annual impact reports for board presentations.",
                color: "#2fa873",
              },
            ].map((ex) => (
              <div
                key={ex.label}
                className="pp-inspiration__card"
                style={{ ["--insp-color" as any]: ex.color }}
              >
                <span className="pp-inspiration__card-label">{ex.label}</span>
                <h3 className="pp-inspiration__card-headline">{ex.headline}</h3>
                <p className="pp-inspiration__card-body">{ex.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════════════
          STYLES
      ══════════════════════════════════════════════════ */}
      <style jsx>{`
        /* ── HERO ───────────────────────────────────────── */
        .pp-hero {
          position: relative;
          min-height: 70vh;
          display: flex;
          align-items: flex-end;
          overflow: hidden;
        }
        .pp-hero__img-wrap { position: absolute; inset: 0; }
        .pp-hero__overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(36,17,35,0.15) 0%,
            rgba(36,17,35,0.55) 50%,
            rgba(36,17,35,0.88) 100%
          );
        }
        .pp-hero__stack {
          position: relative;
          z-index: 2;
          width: 90vw;
          max-width: 900px;
          margin: 0 auto 6vh;
          padding: 0 1rem;
        }
        .pp-breadcrumb {
          display: inline-block;
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(242,242,242,0.6);
          text-decoration: none;
          margin-bottom: 1rem;
          transition: color 150ms ease;
        }
        .pp-breadcrumb:hover { color: #ffcc00; }
        .pp-eyebrow {
          display: block;
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #ffcc00;
          margin-bottom: 0.65rem;
          opacity: 0.85;
        }
        .pp-eyebrow--purple { color: #6c00af !important; opacity: 1 !important; }
        .pp-hero__title {
          margin: 0;
          font-family: var(--font-space-grotesk), system-ui, sans-serif;
          font-size: clamp(2.8rem, 6.5vw, 6rem);
          font-weight: 800;
          line-height: 1.02;
          color: #f2f2f2;
          text-shadow: 0 4px 24px rgba(0,0,0,0.45);
        }
        .pp-hero__sub {
          margin: 1.25rem 0 0;
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: clamp(0.95rem, 1.8vw, 1.2rem);
          color: rgba(242,242,242,0.85);
          max-width: 560px;
          line-height: 1.6;
          font-weight: 500;
        }

        /* ── BUTTONS ─────────────────────────────────────── */
        .pp-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.9rem 1.75rem;
          border-radius: 14px;
          font-family: var(--font-space-grotesk), system-ui, sans-serif;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          text-decoration: none;
          border: 2px solid transparent;
          cursor: pointer;
          transition: transform 150ms ease, opacity 140ms ease, background-color 140ms ease;
        }
        .pp-btn:hover { transform: translateY(-2px); }
        .pp-btn--purple { background: #6c00af; color: #f2f2f2; }
        .pp-btn--purple:hover { background: #530088; }
        .pp-btn--submit {
          width: 100%;
          background: #6c00af;
          color: #f2f2f2;
          padding: 1.1rem 2rem;
          font-size: 0.85rem;
          border-radius: 14px;
          border: none;
          box-shadow: 0 6px 24px rgba(108,0,175,0.28);
          transition: background 150ms ease, transform 150ms ease, box-shadow 150ms ease;
        }
        .pp-btn--submit:hover:not(:disabled) {
          background: #530088;
          transform: translateY(-1px);
          box-shadow: 0 10px 30px rgba(108,0,175,0.35);
        }
        .pp-btn--submit:disabled { opacity: 0.6; cursor: not-allowed; }
        .pp-btn--outline {
          background: transparent;
          color: #241123;
          border-color: rgba(36,17,35,0.3);
        }
        .pp-btn--outline:hover { background: rgba(36,17,35,0.06); }

        /* ── MAIN LAYOUT ─────────────────────────────────── */
        .pp-main { padding: 4rem 2rem 5rem; }
        .pp-main__inner {
          max-width: 1100px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: 3.5rem;
          align-items: flex-start;
        }
        @media (max-width: 900px) {
          .pp-main__inner { grid-template-columns: 1fr; }
        }

        /* ── FORM HEADER ─────────────────────────────────── */
        .pp-form-header { margin-bottom: 2rem; }
        .pp-form-header__title {
          margin: 0.4rem 0 0.6rem;
          font-family: var(--font-space-grotesk), system-ui, sans-serif;
          font-size: clamp(1.8rem, 3vw, 2.4rem);
          font-weight: 800;
          color: #6c00af;
          line-height: 1.15;
        }
        .pp-form-header__sub {
          margin: 0;
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 0.96rem;
          line-height: 1.65;
          color: rgba(36,17,35,0.72);
        }

        /* ── FORM ────────────────────────────────────────── */
        .pp-form { display: flex; flex-direction: column; gap: 1.4rem; }
        .pp-form-loading { color: rgba(36,17,35,0.5); font-size: 0.9rem; padding: 2rem 0; }
        .pp-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
        }
        @media (max-width: 600px) { .pp-row { grid-template-columns: 1fr; } }
        .pp-field { display: flex; flex-direction: column; gap: 0.35rem; }
        .pp-field--full { grid-column: 1 / -1; }
        .pp-label {
          font-family: var(--font-space-grotesk), system-ui, sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(36,17,35,0.72);
        }
        .pp-label span { color: #f23359; }
        .pp-input {
          width: 100%;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          border: 1.5px solid rgba(36,17,35,0.18);
          background: rgba(255,255,255,0.7);
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 0.92rem;
          color: #241123;
          transition: border-color 150ms ease, box-shadow 150ms ease, background 150ms ease;
          outline: none;
          -webkit-appearance: none;
          appearance: none;
        }
        .pp-input:focus {
          border-color: #6c00af;
          box-shadow: 0 0 0 3px rgba(108,0,175,0.12);
          background: #fff;
        }
        .pp-input::placeholder { color: rgba(36,17,35,0.38); }
        .pp-select { cursor: pointer; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath fill='%23241123' fill-opacity='0.5' d='M5 7l5 5 5-5z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 0.75rem center; background-size: 1.25em; padding-right: 2.5rem; }
        .pp-textarea { resize: vertical; min-height: 140px; }
        .pp-form__footer { display: flex; flex-direction: column; gap: 0.75rem; }
        .pp-form__note {
          margin: 0;
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 0.78rem;
          color: rgba(36,17,35,0.5);
          text-align: center;
          font-style: italic;
        }
        .pp-error {
          margin: 0;
          padding: 0.9rem 1.1rem;
          border-radius: 10px;
          background: rgba(242,51,89,0.08);
          border: 1px solid rgba(242,51,89,0.3);
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 0.86rem;
          color: #b01d3c;
          line-height: 1.5;
        }

        /* ── SUCCESS ─────────────────────────────────────── */
        .pp-success {
          text-align: center;
          padding: 2.5rem 1rem;
        }
        .pp-success__icon {
          display: block;
          font-size: 3rem;
          margin-bottom: 1rem;
        }
        .pp-success__title {
          font-family: var(--font-space-grotesk), system-ui, sans-serif;
          font-size: clamp(1.6rem, 3vw, 2.2rem);
          font-weight: 800;
          color: #6c00af;
          margin: 0 0 0.75rem;
        }
        .pp-success__body {
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 1rem;
          line-height: 1.7;
          color: rgba(36,17,35,0.75);
          max-width: 520px;
          margin: 0 auto 2rem;
        }
        .pp-success__actions { display: flex; flex-wrap: wrap; gap: 0.85rem; justify-content: center; }

        /* ── SIDEBAR ─────────────────────────────────────── */
        .pp-sidebar {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          position: sticky;
          top: 6rem;
        }
        .pp-sidebar__block {
          background: rgba(255,255,255,0.55);
          border: 1px solid rgba(36,17,35,0.1);
          border-radius: 18px;
          padding: 1.4rem 1.25rem 1.5rem;
        }
        .pp-sidebar__block--teal {
          background: rgba(36,147,169,0.07);
          border-color: rgba(36,147,169,0.2);
        }
        .pp-sidebar__block--dark {
          background: #241123;
          border-color: transparent;
        }
        .pp-sidebar__title {
          margin: 0.35rem 0 1.1rem;
          font-family: var(--font-space-grotesk), system-ui, sans-serif;
          font-size: 1.1rem;
          font-weight: 800;
          color: #241123;
        }
        .pp-sidebar__block-label {
          display: block;
          font-family: var(--font-space-grotesk), system-ui, sans-serif;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #2493a9;
          margin-bottom: 0.5rem;
        }
        .pp-sidebar__block-label--yellow { color: #ffcc00 !important; }
        .pp-sidebar__block-body {
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 0.86rem;
          line-height: 1.65;
          color: rgba(36,17,35,0.72);
          margin: 0 0 0.75rem;
        }
        .pp-sidebar__links { display: flex; flex-direction: column; gap: 0.4rem; }
        .pp-link {
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 0.82rem;
          font-weight: 600;
          color: #2493a9;
          text-decoration: none;
          transition: color 130ms ease;
        }
        .pp-link:hover { color: #6c00af; }
        .pp-email-link {
          display: block;
          font-family: var(--font-space-grotesk), system-ui, sans-serif;
          font-size: 0.88rem;
          font-weight: 700;
          color: #ffcc00;
          text-decoration: none;
          transition: color 130ms ease;
          letter-spacing: 0.04em;
        }
        .pp-email-link:hover { color: #f23359; }

        /* ── NEXT STEPS ──────────────────────────────────── */
        .pp-next-steps { display: flex; flex-direction: column; gap: 1rem; }
        .pp-next-step { display: flex; gap: 0.9rem; align-items: flex-start; }
        .pp-next-step__icon {
          flex-shrink: 0;
          font-size: 1.4rem;
          margin-top: 0.1rem;
        }
        .pp-next-step__title {
          margin: 0 0 0.2rem;
          font-family: var(--font-space-grotesk), system-ui, sans-serif;
          font-size: 0.88rem;
          font-weight: 800;
          color: #241123;
        }
        .pp-next-step__desc {
          margin: 0;
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 0.82rem;
          line-height: 1.6;
          color: rgba(36,17,35,0.65);
        }

        /* ── INSPIRATION ─────────────────────────────────── */
        .pp-inspiration { background: #241123; padding: 4rem 2rem; }
        .pp-inspiration__inner { max-width: 1100px; margin: 0 auto; }
        .pp-inspiration__title {
          margin: 0.4rem 0 0.65rem;
          font-family: var(--font-space-grotesk), system-ui, sans-serif;
          font-size: clamp(1.6rem, 3vw, 2.4rem);
          font-weight: 800;
          color: #f2f2f2;
        }
        .pp-inspiration__sub {
          margin: 0 0 2.5rem;
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 0.96rem;
          line-height: 1.65;
          color: rgba(242,242,242,0.65);
          max-width: 560px;
        }
        .pp-inspiration__cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
        }
        @media (max-width: 900px) { .pp-inspiration__cards { grid-template-columns: 1fr; } }
        .pp-inspiration__card {
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          padding: 1.5rem 1.3rem 1.6rem;
          transition: border-color 180ms ease, background 180ms ease, transform 180ms ease;
        }
        .pp-inspiration__card:hover {
          border-color: var(--insp-color);
          background: rgba(255,255,255,0.08);
          transform: translateY(-3px);
        }
        .pp-inspiration__card-label {
          display: block;
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--insp-color);
          margin-bottom: 0.6rem;
        }
        .pp-inspiration__card-headline {
          margin: 0 0 0.65rem;
          font-family: var(--font-space-grotesk), system-ui, sans-serif;
          font-size: 1rem;
          font-weight: 700;
          color: #f2f2f2;
          line-height: 1.3;
        }
        .pp-inspiration__card-body {
          margin: 0;
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 0.85rem;
          line-height: 1.65;
          color: rgba(242,242,242,0.65);
        }
      `}</style>
    </main>
  );
}
