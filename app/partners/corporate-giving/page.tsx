// app/partners/corporate-giving/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";

/* ─── Partnership types ─── */
const partnershipTypes = [
  {
    icon: "🌱",
    title: "CSR Initiative",
    tagline: "Purpose-driven giving with measurable impact",
    desc: "Align your company's corporate social responsibility goals with international arts education, youth empowerment, and community development. We'll help you identify partner communities, design the initiative, and report on the impact.",
    bestFor: "Companies with CSR budgets, ESG commitments, or social impact goals.",
    accentColor: "#2FA873",
    borderColor: "rgba(47,168,115,0.3)",
    bgColor: "rgba(47,168,115,0.06)",
  },
  {
    icon: "⚡",
    title: "Adventure Day",
    tagline: "Team building that actually builds something",
    desc: "A curated day (or weekend) of creativity, cross-cultural exchange, and youth mentorship — led by DAT artists. Your team works alongside young artists to create, perform, and reflect. It's the best off-site you've never had.",
    bestFor: "Companies looking for meaningful team building, leadership retreats, or employee engagement.",
    accentColor: "#FFCC00",
    borderColor: "rgba(217,169,25,0.4)",
    bgColor: "rgba(217,169,25,0.06)",
  },
  {
    icon: "🎭",
    title: "Artist Sponsorship",
    tagline: "Fund the artist. Change the story.",
    desc: "Sponsor a traveling DAT artist to create new work with an underserved community. Your company's name becomes part of a story that matters — associated with original theatre that tackles real issues and reaches real people.",
    bestFor: "Companies interested in visibility, creative philanthropy, and patron-level community impact.",
    accentColor: "#F23359",
    borderColor: "rgba(242,51,89,0.3)",
    bgColor: "rgba(242,51,89,0.06)",
  },
  {
    icon: "🏘️",
    title: "Drama Club Sponsorship",
    tagline: "Sustain the work between the residencies",
    desc: "Fund a DAT Drama Club in a specific community. These youth-led, locally-rooted groups create original performances year-round. Your sponsorship keeps the doors open and the stories alive.",
    bestFor: "Long-term partners interested in sustained community relationships and measurable youth impact.",
    accentColor: "#2493A9",
    borderColor: "rgba(36,147,169,0.3)",
    bgColor: "rgba(36,147,169,0.06)",
  },
];

/* ─── Adventure Day breakdown ─── */
const adventureDaySteps = [
  { time: "Morning", icon: "🌄", activity: "Community arrival, orientation, and creative warm-up with DAT artists" },
  { time: "Late Morning", icon: "🎙️", activity: "Story circles: your team listens to young artists share their experiences" },
  { time: "Midday", icon: "🍽️", activity: "Shared meal and informal exchange with local artists and community members" },
  { time: "Afternoon", icon: "🛠️", activity: "Devising workshop: teams co-create short scenes with youth artists" },
  { time: "Evening", icon: "🎭", activity: "Sharing + reflection: your team performs alongside the young artists" },
];

/* ─── Impact areas ─── */
const impactAreas = [
  {
    stat: "3,000+",
    label: "Youth Reached",
    sub: "through DAT programs globally",
  },
  {
    stat: "9",
    label: "Countries",
    sub: "with active community partnerships",
  },
  {
    stat: "32",
    label: "New Plays Created",
    sub: "by and with community artists",
  },
  {
    stat: "75+",
    label: "Mingas & Showcases",
    sub: "community-designed and led",
  },
];

export default function CorporateGivingPage() {
  return (
    <main style={{ background: "transparent", overflowX: "hidden" }}>

      {/* ══════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════ */}
      <section className="cg-hero" aria-label="Corporate giving hero">
        <div className="cg-hero__img-wrap">
          <Image
            src="/images/teaching-amazon.jpg"
            alt="DAT artists working with youth in the Amazon"
            fill
            priority
            sizes="100vw"
            style={{ objectFit: "cover", objectPosition: "center 40%" }}
          />
        </div>
        <div className="cg-hero__overlay" aria-hidden="true" />

        <div className="cg-hero__stack">
          <Link href="/partners" className="cg-breadcrumb">← All Partnerships</Link>
          <span className="cg-eyebrow">For Companies, Foundations & Social Impact Teams</span>
          <h1 className="cg-hero__title">
            Give with your whole company.
          </h1>
          <p className="cg-hero__sub">
            Partner with DAT to align your brand with bold, community-powered theatre — through CSR initiatives, Adventure Days, artist sponsorships, and Drama Club funding that creates measurable, lasting impact.
          </p>
          <div className="cg-hero__ctas">
            <Link href="/partners/propose-project?type=corporate" className="cg-btn cg-btn--yellow">
              Explore a Partnership
            </Link>
            <a href="#types" className="cg-btn cg-btn--ghost">
              See What's Possible
            </a>
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════════════
          IMPACT STATS BAND
      ══════════════════════════════════════════════════ */}
      <section className="cg-stats" aria-label="Impact at a glance">
        <div className="cg-stats__inner">
          {impactAreas.map((s) => (
            <div key={s.label} className="cg-stat">
              <span className="cg-stat__value">{s.stat}</span>
              <span className="cg-stat__label">{s.label}</span>
              <span className="cg-stat__sub">{s.sub}</span>
            </div>
          ))}
        </div>
      </section>


      {/* ══════════════════════════════════════════════════
          INTRO
      ══════════════════════════════════════════════════ */}
      <section className="cg-intro" aria-label="Why partner with DAT">
        <div className="cg-intro__inner">
          <div className="cg-intro__text">
            <span className="cg-eyebrow cg-eyebrow--green">WHY THEATRE? WHY DAT?</span>
            <h2 className="cg-intro__title">
              Art is where change takes root.
            </h2>
            <p className="cg-intro__body">
              The most persistent challenges facing communities — climate disruption, cultural erasure, youth disengagement — aren't solved with money alone. They're addressed when people find the language to name them, the courage to speak them, and the community to hear them.
            </p>
            <p className="cg-intro__body">
              That's what theatre does. And that's what a DAT corporate partnership supports.
            </p>
            <p className="cg-intro__body">
              Whether your company wants to deepen its ESG impact, engage your team around shared purpose, or build a visible philanthropic identity — we'll design a partnership that works for your organization and makes a real difference on the ground.
            </p>
          </div>
          <div className="cg-intro__aside">
            <div className="cg-aside-card">
              <span className="cg-aside-card__label">DAT Is a 501(c)(3) Nonprofit</span>
              <p className="cg-aside-card__body">
                All corporate donations to Dramatic Adventure Theatre are tax-deductible. We'll provide full documentation for your CSR and tax reporting needs.
              </p>
              <div className="cg-aside-card__divider" />
              <span className="cg-aside-card__label">EIN: 80-0178507</span>
              <p className="cg-aside-card__body" style={{ marginTop: "0.25rem" }}>
                Registered with Candid/GuideStar. Financials available on request.
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════════════
          PARTNERSHIP TYPES
      ══════════════════════════════════════════════════ */}
      <section id="types" className="cg-types" aria-labelledby="types-heading">
        <div className="cg-types__inner">
          <span className="cg-eyebrow" style={{ color: "rgba(242,242,242,0.6)" }}>HOW WE CAN WORK TOGETHER</span>
          <h2 id="types-heading" className="cg-section-title cg-section-title--light">
            Four ways to partner with DAT.
          </h2>
          <p className="cg-section-sub">
            Every partnership is unique. These are starting points — we co-design from here.
          </p>

          <div className="cg-types__grid">
            {partnershipTypes.map((pt) => (
              <div
                key={pt.title}
                className="cg-type-card"
                style={{
                  ["--type-accent" as any]: pt.accentColor,
                  ["--type-border" as any]: pt.borderColor,
                  ["--type-bg" as any]: pt.bgColor,
                }}
              >
                <span className="cg-type-card__icon" aria-hidden="true">{pt.icon}</span>
                <h3 className="cg-type-card__title">{pt.title}</h3>
                <span className="cg-type-card__tagline">{pt.tagline}</span>
                <p className="cg-type-card__desc">{pt.desc}</p>
                <div className="cg-type-card__best-for">
                  <span className="cg-type-card__best-label">Best for:</span>
                  <span className="cg-type-card__best-text">{pt.bestFor}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════════════
          ADVENTURE DAY SPOTLIGHT
      ══════════════════════════════════════════════════ */}
      <section className="cg-adventure" aria-labelledby="adventure-heading">
        <div className="cg-adventure__inner">
          <div className="cg-adventure__text">
            <span className="cg-eyebrow cg-eyebrow--teal">ADVENTURE DAY SPOTLIGHT</span>
            <h2 id="adventure-heading" className="cg-adventure__title">
              What does an Adventure Day look like?
            </h2>
            <p className="cg-adventure__body">
              An Adventure Day brings your entire team — from C-suite to frontline — into a shared creative experience that builds empathy, communication, and purpose. No "trust falls." No ropes courses. Just the transformative power of making something together, with real people, around real stories.
            </p>
            <div style={{ marginTop: "2rem" }}>
              <Link href="/partners/propose-project?type=adventure-day" className="cg-btn cg-btn--teal">
                Plan an Adventure Day
              </Link>
            </div>
          </div>

          <div className="cg-adventure__timeline">
            {adventureDaySteps.map((step, i) => (
              <div key={i} className="cg-timeline-step">
                <div className="cg-timeline-step__dot" aria-hidden="true">
                  <span>{step.icon}</span>
                </div>
                <div className="cg-timeline-step__content">
                  <span className="cg-timeline-step__time">{step.time}</span>
                  <p className="cg-timeline-step__activity">{step.activity}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════════════
          QUOTE + IMAGE
      ══════════════════════════════════════════════════ */}
      <section className="cg-quote" aria-label="Corporate partner quote">
        <div className="cg-quote__img-wrap">
          <Image
            src="/images/Andean_Mask_Work.jpg"
            alt="DAT artists in traditional Andean mask work"
            fill
            sizes="60vw"
            style={{ objectFit: "cover", objectPosition: "center" }}
          />
          <div className="cg-quote__overlay" aria-hidden="true" />
        </div>
        <div className="cg-quote__inner">
          <div className="cg-quote__mark" aria-hidden="true">"</div>
          <blockquote className="cg-quote__text">
            Our team came back from the Adventure Day talking about it for months. It wasn't just a retreat — it was a shared experience that reminded us why our work matters and who we're ultimately doing it for.
          </blockquote>
          <cite className="cg-quote__cite">— Corporate Partner, Adventure Day</cite>
        </div>
      </section>


      {/* ══════════════════════════════════════════════════
          CSR ALIGNMENT
      ══════════════════════════════════════════════════ */}
      <section className="cg-alignment" aria-labelledby="alignment-heading">
        <div className="cg-alignment__inner">
          <div className="cg-alignment__head">
            <span className="cg-eyebrow cg-eyebrow--green">ESG & CSR ALIGNMENT</span>
            <h2 id="alignment-heading" className="cg-section-title cg-section-title--dark">
              Built for your impact goals.
            </h2>
            <p className="cg-section-sub cg-section-sub--dark">
              A DAT corporate partnership can be structured to support SDG reporting, ESG frameworks, and CSR disclosures.
            </p>
          </div>

          <div className="cg-alignment__grid">
            {[
              { sdg: "SDG 4", label: "Quality Education", desc: "Arts education and youth development in underserved communities." },
              { sdg: "SDG 10", label: "Reduced Inequalities", desc: "Centering the voices of marginalized and Indigenous communities." },
              { sdg: "SDG 11", label: "Sustainable Communities", desc: "Supporting cultural vitality and community cohesion." },
              { sdg: "SDG 13", label: "Climate Action", desc: "Many of our partner communities are climate-frontline — theatre helps them process and respond." },
              { sdg: "SDG 16", label: "Peace & Justice", desc: "Conflict resolution, truth-telling, and reconciliation through story." },
              { sdg: "SDG 17", label: "Partnerships for Goals", desc: "Long-term institutional relationships that go beyond one-time giving." },
            ].map((item) => (
              <div key={item.sdg} className="cg-align-item">
                <span className="cg-align-item__sdg">{item.sdg}</span>
                <h3 className="cg-align-item__label">{item.label}</h3>
                <p className="cg-align-item__desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════════════ */}
      <section className="cg-final-cta" aria-labelledby="cg-cta-heading">
        <div className="cg-final-cta__inner">
          <div className="cg-final-cta__img-wrap">
            <Image
              src="/images/alumni-hero.jpg"
              alt="DAT artists on stage"
              fill
              sizes="100vw"
              style={{ objectFit: "cover", objectPosition: "center" }}
            />
            <div className="cg-final-cta__overlay" aria-hidden="true" />
          </div>
          <div className="cg-final-cta__content">
            <span className="cg-eyebrow" style={{ color: "#ffcc00" }}>START THE CONVERSATION</span>
            <h2 id="cg-cta-heading" className="cg-final-cta__title">
              Your company can change a story.
            </h2>
            <p className="cg-final-cta__sub">
              Ready to explore a CSR initiative, Adventure Day, or artist sponsorship? Tell us about your company and what you're hoping to build.
            </p>
            <div className="cg-final-cta__actions">
              <Link href="/partners/propose-project?type=corporate" className="cg-btn cg-btn--yellow">
                Propose a Corporate Partnership
              </Link>
              <Link href="/partners" className="cg-btn cg-btn--outline-light">
                ← All Partnership Pathways
              </Link>
            </div>
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════════════
          STYLES
      ══════════════════════════════════════════════════ */}
      <style jsx>{`
        /* ── HERO ───────────────────────────────────────── */
        .cg-hero {
          position: relative;
          min-height: 82vh;
          display: flex;
          align-items: flex-end;
          overflow: hidden;
        }
        .cg-hero__img-wrap { position: absolute; inset: 0; }
        .cg-hero__overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(36,17,35,0.22) 0%,
            rgba(36,17,35,0.60) 50%,
            rgba(36,17,35,0.9) 100%
          );
        }
        .cg-hero__stack {
          position: relative;
          z-index: 2;
          width: 90vw;
          max-width: 1000px;
          margin: 0 auto 6vh;
          padding: 0 1rem;
        }
        .cg-breadcrumb {
          display: inline-block;
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(242,242,242,0.65);
          text-decoration: none;
          margin-bottom: 1rem;
          transition: color 150ms ease;
        }
        .cg-breadcrumb:hover { color: #ffcc00; }
        .cg-eyebrow {
          display: block;
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #ffcc00;
          margin-bottom: 0.75rem;
          opacity: 0.85;
        }
        .cg-eyebrow--green { color: #2fa873 !important; opacity: 1 !important; }
        .cg-eyebrow--teal { color: #2493a9 !important; opacity: 1 !important; }
        .cg-hero__title {
          margin: 0;
          font-family: var(--font-space-grotesk), system-ui, sans-serif;
          font-size: clamp(2.5rem, 6vw, 5.5rem);
          font-weight: 800;
          line-height: 1.05;
          color: #f2f2f2;
          text-shadow: 0 4px 24px rgba(0,0,0,0.45);
        }
        .cg-hero__sub {
          margin: 1.25rem 0 0;
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: clamp(0.95rem, 1.8vw, 1.2rem);
          font-weight: 500;
          color: rgba(242,242,242,0.85);
          max-width: 620px;
          line-height: 1.6;
        }
        .cg-hero__ctas { display: flex; flex-wrap: wrap; gap: 0.85rem; margin-top: 2rem; }

        /* ── BUTTONS ─────────────────────────────────────── */
        .cg-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.9rem 1.75rem;
          border-radius: 14px;
          font-family: var(--font-space-grotesk), system-ui, sans-serif;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          text-decoration: none;
          border: 2px solid transparent;
          cursor: pointer;
          transition: transform 150ms ease, opacity 140ms ease, background-color 140ms ease;
        }
        .cg-btn:hover { transform: translateY(-2px); }
        .cg-btn--yellow { background: #ffcc00; color: #241123; }
        .cg-btn--yellow:hover { background: #e6b800; }
        .cg-btn--teal { background: #2493a9; color: #f2f2f2; }
        .cg-btn--teal:hover { background: #1e7e93; }
        .cg-btn--ghost { background: rgba(242,242,242,0.12); color: #f2f2f2; border-color: rgba(242,242,242,0.4); backdrop-filter: blur(6px); }
        .cg-btn--ghost:hover { background: rgba(242,242,242,0.2); }
        .cg-btn--outline-light { background: transparent; color: #f2f2f2; border-color: rgba(242,242,242,0.45); }
        .cg-btn--outline-light:hover { background: rgba(242,242,242,0.1); }

        /* ── STATS BAND ──────────────────────────────────── */
        .cg-stats { background: #241123; padding: 2.5rem 2rem; }
        .cg-stats__inner {
          max-width: 1100px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.25rem;
          text-align: center;
        }
        @media (max-width: 640px) { .cg-stats__inner { grid-template-columns: repeat(2, 1fr); } }
        .cg-stat { display: flex; flex-direction: column; gap: 0.2rem; }
        .cg-stat__value {
          font-family: var(--font-space-grotesk), system-ui, sans-serif;
          font-size: clamp(2rem, 4.5vw, 3rem);
          font-weight: 700;
          color: #2fa873;
          line-height: 1;
        }
        .cg-stat__label {
          font-family: var(--font-space-grotesk), system-ui, sans-serif;
          font-size: 0.85rem;
          font-weight: 700;
          color: rgba(242,242,242,0.85);
        }
        .cg-stat__sub {
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 0.72rem;
          color: rgba(242,242,242,0.45);
          letter-spacing: 0.04em;
        }

        /* ── SHARED SECTION ──────────────────────────────── */
        .cg-section-title {
          margin: 0.4rem 0 0.65rem;
          font-family: var(--font-space-grotesk), system-ui, sans-serif;
          font-size: clamp(1.8rem, 3.5vw, 2.6rem);
          font-weight: 800;
          color: #d9a919;
          line-height: 1.15;
        }
        .cg-section-title--light { color: #f2f2f2; }
        .cg-section-title--dark { color: #241123; }
        .cg-section-sub { margin: 0; font-family: var(--font-dm-sans), system-ui, sans-serif; font-size: 1rem; line-height: 1.65; color: rgba(242,242,242,0.78); }
        .cg-section-sub--dark { color: rgba(36,17,35,0.72); }

        /* ── INTRO ───────────────────────────────────────── */
        .cg-intro { padding: 4.5rem 2rem; }
        .cg-intro__inner {
          max-width: 1100px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 3rem;
          align-items: flex-start;
        }
        @media (max-width: 900px) { .cg-intro__inner { grid-template-columns: 1fr; } }
        .cg-intro__title {
          margin: 0.5rem 0 1rem;
          font-family: var(--font-space-grotesk), system-ui, sans-serif;
          font-size: clamp(1.6rem, 3vw, 2.4rem);
          font-weight: 800;
          color: #2fa873;
          line-height: 1.2;
        }
        .cg-intro__body {
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 0.96rem;
          line-height: 1.75;
          color: rgba(36,17,35,0.82);
          margin: 0 0 0.75rem;
        }
        .cg-aside-card {
          background: rgba(36,17,35,0.06);
          border: 1px solid rgba(36,17,35,0.12);
          border-radius: 18px;
          padding: 1.5rem 1.4rem;
          position: sticky;
          top: 6rem;
        }
        .cg-aside-card__label {
          display: block;
          font-family: var(--font-space-grotesk), system-ui, sans-serif;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #2fa873;
          margin-bottom: 0.5rem;
        }
        .cg-aside-card__body {
          margin: 0;
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 0.86rem;
          line-height: 1.65;
          color: rgba(36,17,35,0.75);
        }
        .cg-aside-card__divider {
          height: 1px;
          background: rgba(36,17,35,0.1);
          margin: 1.1rem 0;
        }

        /* ── TYPES ───────────────────────────────────────── */
        .cg-types { background: #241123; padding: 4.5rem 2rem; }
        .cg-types__inner { max-width: 1100px; margin: 0 auto; }
        .cg-types__grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.25rem;
          margin-top: 2.5rem;
        }
        @media (max-width: 700px) { .cg-types__grid { grid-template-columns: 1fr; } }
        .cg-type-card {
          background: var(--type-bg, rgba(255,255,255,0.05));
          border: 1.5px solid var(--type-border, rgba(255,255,255,0.15));
          border-radius: 18px;
          padding: 1.6rem 1.4rem 1.8rem;
          transition: transform 200ms ease, box-shadow 200ms ease;
        }
        .cg-type-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 14px 40px rgba(0,0,0,0.25);
        }
        .cg-type-card__icon {
          display: block;
          font-size: 2.2rem;
          margin-bottom: 0.9rem;
        }
        .cg-type-card__title {
          margin: 0 0 0.2rem;
          font-family: var(--font-space-grotesk), system-ui, sans-serif;
          font-size: 1.3rem;
          font-weight: 800;
          color: var(--type-accent);
        }
        .cg-type-card__tagline {
          display: block;
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 0.78rem;
          font-weight: 600;
          font-style: italic;
          color: rgba(242,242,242,0.55);
          margin-bottom: 0.85rem;
          letter-spacing: 0.02em;
        }
        .cg-type-card__desc {
          margin: 0 0 1rem;
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 0.9rem;
          line-height: 1.7;
          color: rgba(242,242,242,0.78);
        }
        .cg-type-card__best-for {
          border-top: 1px solid rgba(255,255,255,0.08);
          padding-top: 0.75rem;
        }
        .cg-type-card__best-label {
          font-family: var(--font-space-grotesk), system-ui, sans-serif;
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--type-accent);
          opacity: 0.7;
          margin-right: 0.4rem;
        }
        .cg-type-card__best-text {
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 0.8rem;
          color: rgba(242,242,242,0.5);
          font-style: italic;
        }

        /* ── ADVENTURE DAY ───────────────────────────────── */
        .cg-adventure { padding: 4.5rem 2rem; }
        .cg-adventure__inner {
          max-width: 1100px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3.5rem;
          align-items: flex-start;
        }
        @media (max-width: 900px) { .cg-adventure__inner { grid-template-columns: 1fr; } }
        .cg-adventure__title {
          margin: 0.5rem 0 1rem;
          font-family: var(--font-space-grotesk), system-ui, sans-serif;
          font-size: clamp(1.6rem, 3vw, 2.4rem);
          font-weight: 800;
          color: #2493a9;
          line-height: 1.2;
        }
        .cg-adventure__body {
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 0.96rem;
          line-height: 1.75;
          color: rgba(36,17,35,0.82);
          margin: 0 0 0.75rem;
        }
        .cg-adventure__timeline {
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .cg-timeline-step {
          display: flex;
          gap: 1rem;
          padding-bottom: 1.4rem;
          position: relative;
        }
        .cg-timeline-step:not(:last-child)::before {
          content: "";
          position: absolute;
          left: 1.35rem;
          top: 2.8rem;
          bottom: 0;
          width: 2px;
          background: rgba(36,147,169,0.25);
        }
        .cg-timeline-step__dot {
          flex-shrink: 0;
          width: 2.75rem;
          height: 2.75rem;
          border-radius: 50%;
          background: rgba(36,147,169,0.15);
          border: 2px solid rgba(36,147,169,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          z-index: 1;
        }
        .cg-timeline-step__content { padding-top: 0.2rem; }
        .cg-timeline-step__time {
          display: block;
          font-family: var(--font-space-grotesk), system-ui, sans-serif;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #2493a9;
          margin-bottom: 0.25rem;
        }
        .cg-timeline-step__activity {
          margin: 0;
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 0.88rem;
          line-height: 1.55;
          color: rgba(36,17,35,0.78);
        }

        /* ── QUOTE ───────────────────────────────────────── */
        .cg-quote {
          position: relative;
          min-height: 380px;
          display: flex;
          align-items: center;
          overflow: hidden;
        }
        .cg-quote__img-wrap { position: absolute; inset: 0; z-index: 0; }
        .cg-quote__overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            105deg,
            rgba(36,17,35,0.95) 0%,
            rgba(36,17,35,0.78) 55%,
            rgba(36,17,35,0.42) 100%
          );
        }
        .cg-quote__inner {
          position: relative;
          z-index: 2;
          width: 90vw;
          max-width: 620px;
          margin: 0 auto;
          padding: 3.5rem 1rem;
        }
        .cg-quote__mark {
          font-family: var(--font-gloucester), serif;
          font-size: 7rem;
          line-height: 0.55;
          color: #ffcc00;
          opacity: 0.28;
          display: block;
          margin-bottom: -0.25rem;
        }
        .cg-quote__text {
          margin: 0;
          font-family: var(--font-gloucester), serif;
          font-size: clamp(1.1rem, 2vw, 1.6rem);
          line-height: 1.55;
          color: #f2f2f2;
          font-style: italic;
        }
        .cg-quote__cite {
          display: block;
          margin-top: 1.25rem;
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #ffcc00;
          opacity: 0.65;
          font-style: normal;
        }

        /* ── ALIGNMENT ───────────────────────────────────── */
        .cg-alignment { padding: 4rem 2rem; }
        .cg-alignment__inner { max-width: 1100px; margin: 0 auto; }
        .cg-alignment__head { margin-bottom: 2.5rem; max-width: 600px; }
        .cg-alignment__grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }
        @media (max-width: 900px) { .cg-alignment__grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 540px) { .cg-alignment__grid { grid-template-columns: 1fr; } }
        .cg-align-item {
          background: rgba(47,168,115,0.06);
          border: 1px solid rgba(47,168,115,0.18);
          border-radius: 14px;
          padding: 1.25rem 1.1rem;
          transition: transform 180ms ease;
        }
        .cg-align-item:hover { transform: translateY(-2px); }
        .cg-align-item__sdg {
          display: block;
          font-family: var(--font-space-grotesk), system-ui, sans-serif;
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #2fa873;
          margin-bottom: 0.2rem;
        }
        .cg-align-item__label {
          margin: 0 0 0.35rem;
          font-family: var(--font-space-grotesk), system-ui, sans-serif;
          font-size: 0.95rem;
          font-weight: 800;
          color: #241123;
        }
        .cg-align-item__desc {
          margin: 0;
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 0.83rem;
          line-height: 1.6;
          color: rgba(36,17,35,0.72);
        }

        /* ── FINAL CTA ───────────────────────────────────── */
        .cg-final-cta {
          position: relative;
          min-height: 480px;
          display: flex;
          align-items: center;
          overflow: hidden;
        }
        .cg-final-cta__img-wrap { position: absolute; inset: 0; z-index: 0; }
        .cg-final-cta__overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            105deg,
            rgba(36,17,35,0.95) 0%,
            rgba(36,17,35,0.7) 55%,
            rgba(36,17,35,0.4) 100%
          );
        }
        .cg-final-cta__inner {
          position: relative;
          z-index: 2;
          width: 90vw;
          max-width: 1100px;
          margin: 0 auto;
          padding: 4.5rem 1rem;
          display: flex;
          align-items: center;
        }
        .cg-final-cta__content { max-width: 560px; }
        .cg-final-cta__title {
          margin: 0.5rem 0 1rem;
          font-family: var(--font-space-grotesk), system-ui, sans-serif;
          font-size: clamp(1.8rem, 3.5vw, 2.8rem);
          font-weight: 800;
          color: #f2f2f2;
          line-height: 1.18;
        }
        .cg-final-cta__sub {
          margin: 0 0 2rem;
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 1rem;
          line-height: 1.7;
          color: rgba(242,242,242,0.82);
        }
        .cg-final-cta__actions { display: flex; flex-wrap: wrap; gap: 0.85rem; }
      `}</style>
    </main>
  );
}
