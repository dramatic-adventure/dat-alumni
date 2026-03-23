// app/partners/universities/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";

/* ─── Programs DAT offers to university partners ─── */
const programs = [
  {
    code: "RAW",
    name: "Residency & Workshop",
    desc: "Intensive devised-theatre residencies in international communities. Students collaborate with local artists to create original work from the ground up.",
    length: "2–4 weeks",
    credits: "3–6 credits",
  },
  {
    code: "CASTAWAY",
    name: "Full Semester Abroad",
    desc: "A complete academic semester immersed in DAT's methodology — teaching, devising, producing, and performing across multiple communities.",
    length: "Full semester",
    credits: "12–18 credits",
  },
  {
    code: "PASSAGE",
    name: "Community Passage",
    desc: "A guided intensive that takes students through the full arc of a DAT project — from community listening sessions to final performance.",
    length: "3–6 weeks",
    credits: "6–9 credits",
  },
  {
    code: "ACTion",
    name: "Applied Community Theatre",
    desc: "Students develop applied-theatre facilitation skills while leading workshops with youth in partner communities.",
    length: "2–3 weeks",
    credits: "3–6 credits",
  },
  {
    code: "TREKS",
    name: "Creative Treks",
    desc: "Short, high-impact cultural immersion experiences pairing theatre practice with community observation, storytelling, and artistic exchange.",
    length: "1–2 weeks",
    credits: "1–3 credits",
  },
  {
    code: "LAB",
    name: "DAT Lab",
    desc: "Research-centered intensive for advanced students and educators exploring DAT's pedagogy, methodology, and community-rooted practice.",
    length: "Custom",
    credits: "Negotiable",
  },
];

/* ─── How it works – steps ─── */
const steps = [
  {
    num: "01",
    title: "Reach Out",
    body: "Share your vision, your students, and your learning goals. We'll ask the right questions to understand what you're really after.",
  },
  {
    num: "02",
    title: "Co-Design",
    body: "Our team works with your faculty and administrators to design a program that integrates DAT's methodology with your academic requirements.",
  },
  {
    num: "03",
    title: "In the Field",
    body: "Students travel with DAT artists to partner communities. They devise, teach, produce, and perform — learning by doing.",
  },
  {
    num: "04",
    title: "Back Home",
    body: "Artists return changed. The stories they created ripple outward — in papers, performances, and the lives they continue to live.",
  },
];

/* ─── Benefits ─── */
const benefits = [
  { icon: "🎓", label: "Credit-Bearing", desc: "Fully accredited programs that count toward theatre, international studies, education, and more." },
  { icon: "🌐", label: "Global Competency", desc: "Students develop cross-cultural fluency, active listening, and collaborative leadership." },
  { icon: "🏛️", label: "DEI & Equity", desc: "Programs are designed around underrepresented communities and amplify underheard voices." },
  { icon: "🤝", label: "Faculty Integration", desc: "Your faculty can join as co-facilitators, researchers, or academic supervisors." },
  { icon: "📝", label: "Original Curriculum", desc: "Every program is co-designed — no off-the-shelf tours. Your students' needs drive the design." },
  { icon: "♻️", label: "Lasting Impact", desc: "Relationships between your institution and DAT communities can deepen over multiple cohorts." },
];

export default function UniversityPartnersPage() {
  return (
    <main style={{ background: "transparent", overflowX: "hidden" }}>

      {/* ══════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════ */}
      <section className="u-hero" aria-label="University partnerships hero">
        <div className="u-hero__img-wrap">
          <Image
            src="/images/rehearsing-nitra.jpg"
            alt="DAT students rehearsing in Nitra, Slovakia"
            fill
            priority
            sizes="100vw"
            style={{ objectFit: "cover", objectPosition: "center 35%" }}
          />
        </div>
        <div className="u-hero__overlay" aria-hidden="true" />

        <div className="u-hero__stack">
          <Link href="/partners" className="u-breadcrumb">← All Partnerships</Link>
          <span className="u-eyebrow">For Universities & Study Abroad Programs</span>
          <h1 className="u-hero__title">
            Theatre without borders.<br />Learning without limits.
          </h1>
          <p className="u-hero__sub">
            Build a credit-bearing study abroad that lets your students devise, teach, produce, and perform theatre that tackles real-world issues — in collaboration with communities around the globe.
          </p>
          <div className="u-hero__ctas">
            <Link href="/partners/propose-project?type=university" className="u-btn u-btn--yellow">
              Propose a Partnership
            </Link>
            <a href="#programs" className="u-btn u-btn--ghost">
              See Our Programs
            </a>
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════════════
          INTRO BAND
      ══════════════════════════════════════════════════ */}
      <section className="u-intro" aria-label="What university partnership means">
        <div className="u-intro__inner">
          <div className="u-intro__text">
            <span className="u-eyebrow u-eyebrow--purple">THE DAT DIFFERENCE</span>
            <h2 className="u-intro__title">
              Your students don't observe the world. They change it.
            </h2>
            <p className="u-intro__body">
              A DAT university partnership is not a cultural tour with theatre on the side. Students are embedded in real communities, working alongside local artists and youth to create original performances that speak to the issues that matter most in that place, at that time.
            </p>
            <p className="u-intro__body">
              That means students don't just study theatre — they practice it as a tool for listening, justice, and transformation. They come home with a fundamentally different sense of what art can do.
            </p>
            <div style={{ marginTop: "1.5rem" }}>
              <Link href="/partners/propose-project?type=university" className="u-btn u-btn--purple">
                Start a Conversation
              </Link>
            </div>
          </div>
          <div className="u-intro__image">
            <Image
              src="/images/teaching-andes.jpg"
              alt="DAT teaching artist working with students in the Andes"
              fill
              sizes="(min-width: 900px) 40vw, 90vw"
              style={{ objectFit: "cover", objectPosition: "center", borderRadius: 18 }}
            />
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════════ */}
      <section className="u-steps" aria-labelledby="steps-heading">
        <div className="u-steps__inner">
          <div className="u-steps__head">
            <span className="u-eyebrow">HOW IT WORKS</span>
            <h2 id="steps-heading" className="u-section-title">
              From conversation to performance.
            </h2>
          </div>
          <div className="u-steps__grid">
            {steps.map((s) => (
              <div key={s.num} className="u-step">
                <span className="u-step__num">{s.num}</span>
                <h3 className="u-step__title">{s.title}</h3>
                <p className="u-step__body">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════════════
          PROGRAMS
      ══════════════════════════════════════════════════ */}
      <section id="programs" className="u-programs" aria-labelledby="programs-heading">
        <div className="u-programs__inner">
          <span className="u-eyebrow u-eyebrow--light">OUR PROGRAMS</span>
          <h2 id="programs-heading" className="u-section-title u-section-title--light">
            A program for every vision.
          </h2>
          <p className="u-section-sub u-section-sub--light">
            From week-long intensives to full semesters abroad, we'll find the right shape for your students, your faculty, and your academic calendar.
          </p>

          <div className="u-programs__grid">
            {programs.map((p) => (
              <div key={p.code} className="u-program-card">
                <div className="u-program-card__header">
                  <span className="u-program-card__code">{p.code}</span>
                  <div className="u-program-card__meta">
                    <span className="u-program-card__badge">{p.length}</span>
                    <span className="u-program-card__badge u-program-card__badge--yellow">{p.credits}</span>
                  </div>
                </div>
                <h3 className="u-program-card__name">{p.name}</h3>
                <p className="u-program-card__desc">{p.desc}</p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
            <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", color: "rgba(242,242,242,0.7)", fontSize: "0.9rem", marginBottom: "1rem" }}>
              Don't see exactly what you need? We co-design every program from scratch.
            </p>
            <Link href="/partners/propose-project?type=university" className="u-btn u-btn--yellow">
              Propose Something Custom
            </Link>
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════════════
          BENEFITS
      ══════════════════════════════════════════════════ */}
      <section className="u-benefits" aria-labelledby="benefits-heading">
        <div className="u-benefits__inner">
          <span className="u-eyebrow u-eyebrow--purple">FOR YOUR INSTITUTION</span>
          <h2 id="benefits-heading" className="u-section-title u-section-title--dark">
            Why partner with DAT?
          </h2>

          <div className="u-benefits__grid">
            {benefits.map((b) => (
              <div key={b.label} className="u-benefit">
                <span className="u-benefit__icon" aria-hidden="true">{b.icon}</span>
                <h3 className="u-benefit__label">{b.label}</h3>
                <p className="u-benefit__desc">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════════════
          QUOTE
      ══════════════════════════════════════════════════ */}
      <section className="u-quote" aria-label="Partner quote">
        <div className="u-quote__inner">
          <div className="u-quote__img-wrap">
            <Image
              src="/images/performing-zanzibar.jpg"
              alt="Students performing in Zanzibar"
              fill
              sizes="50vw"
              style={{ objectFit: "cover", objectPosition: "center" }}
            />
            <div className="u-quote__img-overlay" aria-hidden="true" />
          </div>
          <div className="u-quote__content">
            <div className="u-quote__mark" aria-hidden="true">"</div>
            <blockquote className="u-quote__text">
              Our students came back different. Not just more worldly — more human. DAT didn't give them an experience; they gave them a practice.
            </blockquote>
            <cite className="u-quote__cite">
              — Study Abroad Director, Partner University
            </cite>
            <div style={{ marginTop: "2rem" }}>
              <Link href="/partners/propose-project?type=university" className="u-btn u-btn--yellow">
                Build This for Your Students
              </Link>
            </div>
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════════════ */}
      <section className="u-final-cta" aria-labelledby="final-cta-heading">
        <div className="u-final-cta__inner">
          <span className="u-eyebrow u-eyebrow--purple">READY TO PARTNER?</span>
          <h2 id="final-cta-heading" className="u-section-title u-section-title--dark">
            Let's design something extraordinary.
          </h2>
          <p className="u-final-cta__sub">
            Share a few details about your program, your students, and what you're hoping to build. We'll be in touch to start the conversation.
          </p>
          <div className="u-final-cta__actions">
            <Link href="/partners/propose-project?type=university" className="u-btn u-btn--purple">
              Submit a Proposal
            </Link>
            <Link href="/partners" className="u-btn u-btn--outline-dark">
              ← Back to Partnerships
            </Link>
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════════════
          STYLES
      ══════════════════════════════════════════════════ */}
      <style jsx>{`
        /* ── HERO ───────────────────────────────────────── */
        .u-hero {
          position: relative;
          min-height: 82vh;
          display: flex;
          align-items: flex-end;
          overflow: hidden;
        }
        .u-hero__img-wrap {
          position: absolute;
          inset: 0;
        }
        .u-hero__overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(36,17,35,0.2) 0%,
            rgba(36,17,35,0.62) 55%,
            rgba(36,17,35,0.9) 100%
          );
        }
        .u-hero__stack {
          position: relative;
          z-index: 2;
          width: 90vw;
          max-width: 1000px;
          margin: 0 auto 6vh;
          padding: 0 1rem;
        }
        .u-breadcrumb {
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
        .u-breadcrumb:hover { color: #ffcc00; }
        .u-eyebrow {
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
        .u-eyebrow--purple { color: #6c00af !important; opacity: 1 !important; }
        .u-eyebrow--light { color: rgba(242,242,242,0.6) !important; opacity: 1 !important; }
        .u-hero__title {
          margin: 0;
          font-family: var(--font-space-grotesk), system-ui, sans-serif;
          font-size: clamp(2.5rem, 6vw, 5.5rem);
          font-weight: 800;
          line-height: 1.08;
          color: #f2f2f2;
          text-shadow: 0 4px 24px rgba(0,0,0,0.45);
        }
        .u-hero__sub {
          margin: 1.25rem 0 0;
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: clamp(0.95rem, 1.8vw, 1.2rem);
          font-weight: 500;
          color: rgba(242,242,242,0.85);
          max-width: 620px;
          line-height: 1.6;
        }
        .u-hero__ctas {
          display: flex;
          flex-wrap: wrap;
          gap: 0.85rem;
          margin-top: 2rem;
        }

        /* ── BUTTONS ─────────────────────────────────────── */
        .u-btn {
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
        .u-btn:hover { transform: translateY(-2px); }
        .u-btn--yellow { background: #ffcc00; color: #241123; }
        .u-btn--yellow:hover { background: #e6b800; }
        .u-btn--purple { background: #6c00af; color: #f2f2f2; }
        .u-btn--purple:hover { background: #530088; }
        .u-btn--ghost { background: rgba(242,242,242,0.1); color: #f2f2f2; border-color: rgba(242,242,242,0.4); backdrop-filter: blur(6px); }
        .u-btn--ghost:hover { background: rgba(242,242,242,0.18); }
        .u-btn--outline-dark { background: transparent; color: #241123; border-color: rgba(36,17,35,0.35); }
        .u-btn--outline-dark:hover { background: rgba(36,17,35,0.06); }

        /* ── SHARED SECTION ──────────────────────────────── */
        .u-section-title {
          margin: 0.4rem 0 0.75rem;
          font-family: var(--font-space-grotesk), system-ui, sans-serif;
          font-size: clamp(1.8rem, 3.5vw, 2.6rem);
          font-weight: 800;
          color: #d9a919;
          line-height: 1.15;
        }
        .u-section-title--dark { color: #241123; }
        .u-section-title--light { color: #f2f2f2; }
        .u-section-sub { margin: 0; font-family: var(--font-dm-sans), system-ui, sans-serif; font-size: 1rem; line-height: 1.65; color: rgba(242,242,242,0.78); }
        .u-section-sub--light { color: rgba(242,242,242,0.78); }

        /* ── INTRO BAND ──────────────────────────────────── */
        .u-intro { padding: 4.5rem 2rem; }
        .u-intro__inner {
          max-width: 1100px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3.5rem;
          align-items: center;
        }
        @media (max-width: 900px) {
          .u-intro__inner { grid-template-columns: 1fr; }
        }
        .u-intro__title {
          margin: 0.5rem 0 1rem;
          font-family: var(--font-space-grotesk), system-ui, sans-serif;
          font-size: clamp(1.6rem, 3vw, 2.4rem);
          font-weight: 800;
          color: #6c00af;
          line-height: 1.2;
        }
        .u-intro__body {
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 0.98rem;
          line-height: 1.75;
          color: rgba(36,17,35,0.82);
          margin: 0 0 0.75rem;
        }
        .u-intro__image {
          position: relative;
          height: 420px;
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 16px 48px rgba(36,17,35,0.25);
        }

        /* ── HOW IT WORKS ────────────────────────────────── */
        .u-steps {
          background: rgba(36,17,35,0.06);
          padding: 4rem 2rem;
        }
        .u-steps__inner { max-width: 1100px; margin: 0 auto; }
        .u-steps__head { margin-bottom: 2.5rem; }
        .u-steps__grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
        }
        @media (max-width: 900px) {
          .u-steps__grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 540px) {
          .u-steps__grid { grid-template-columns: 1fr; }
        }
        .u-step {
          background: rgba(255,255,255,0.5);
          border: 1px solid rgba(108,0,175,0.15);
          border-radius: 16px;
          padding: 1.5rem 1.25rem;
          transition: transform 180ms ease, box-shadow 180ms ease;
        }
        .u-step:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 28px rgba(108,0,175,0.12);
        }
        .u-step__num {
          display: block;
          font-family: var(--font-space-grotesk), system-ui, sans-serif;
          font-size: 2.5rem;
          font-weight: 800;
          color: #6c00af;
          opacity: 0.25;
          line-height: 1;
          margin-bottom: 0.5rem;
        }
        .u-step__title {
          margin: 0 0 0.4rem;
          font-family: var(--font-space-grotesk), system-ui, sans-serif;
          font-size: 1.05rem;
          font-weight: 800;
          color: #6c00af;
        }
        .u-step__body {
          margin: 0;
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 0.88rem;
          line-height: 1.65;
          color: rgba(36,17,35,0.78);
        }

        /* ── PROGRAMS ────────────────────────────────────── */
        .u-programs {
          padding: 4.5rem 2rem;
          background: #241123;
        }
        .u-programs__inner { max-width: 1100px; margin: 0 auto; }
        .u-programs__grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
          margin-top: 2.5rem;
        }
        @media (max-width: 900px) {
          .u-programs__grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 540px) {
          .u-programs__grid { grid-template-columns: 1fr; }
        }
        .u-program-card {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(108,0,175,0.3);
          border-radius: 16px;
          padding: 1.4rem 1.25rem 1.5rem;
          transition: border-color 180ms ease, transform 180ms ease, background 180ms ease;
        }
        .u-program-card:hover {
          border-color: rgba(108,0,175,0.7);
          background: rgba(108,0,175,0.1);
          transform: translateY(-2px);
        }
        .u-program-card__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.75rem;
        }
        .u-program-card__code {
          font-family: var(--font-space-grotesk), system-ui, sans-serif;
          font-size: 1.4rem;
          font-weight: 800;
          color: #ffcc00;
          letter-spacing: 0.05em;
        }
        .u-program-card__meta {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          align-items: flex-end;
        }
        .u-program-card__badge {
          display: inline-block;
          padding: 0.18rem 0.5rem;
          border-radius: 6px;
          background: rgba(36,147,169,0.2);
          border: 1px solid rgba(36,147,169,0.4);
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #2493a9;
        }
        .u-program-card__badge--yellow {
          background: rgba(255,204,0,0.15);
          border-color: rgba(255,204,0,0.35);
          color: #d9a919;
        }
        .u-program-card__name {
          margin: 0 0 0.5rem;
          font-family: var(--font-space-grotesk), system-ui, sans-serif;
          font-size: 1rem;
          font-weight: 700;
          color: #f2f2f2;
        }
        .u-program-card__desc {
          margin: 0;
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 0.86rem;
          line-height: 1.65;
          color: rgba(242,242,242,0.7);
        }

        /* ── BENEFITS ────────────────────────────────────── */
        .u-benefits { padding: 4rem 2rem; }
        .u-benefits__inner { max-width: 1100px; margin: 0 auto; }
        .u-benefits__grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
          margin-top: 2rem;
        }
        @media (max-width: 900px) {
          .u-benefits__grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 540px) {
          .u-benefits__grid { grid-template-columns: 1fr; }
        }
        .u-benefit {
          background: rgba(108,0,175,0.06);
          border: 1px solid rgba(108,0,175,0.15);
          border-radius: 16px;
          padding: 1.4rem 1.25rem;
          transition: transform 180ms ease, box-shadow 180ms ease;
        }
        .u-benefit:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 28px rgba(108,0,175,0.1);
        }
        .u-benefit__icon {
          display: block;
          font-size: 1.8rem;
          margin-bottom: 0.6rem;
        }
        .u-benefit__label {
          margin: 0 0 0.35rem;
          font-family: var(--font-space-grotesk), system-ui, sans-serif;
          font-size: 0.95rem;
          font-weight: 800;
          color: #6c00af;
        }
        .u-benefit__desc {
          margin: 0;
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 0.86rem;
          line-height: 1.65;
          color: rgba(36,17,35,0.75);
        }

        /* ── QUOTE ───────────────────────────────────────── */
        .u-quote {
          position: relative;
          min-height: 420px;
          display: flex;
          align-items: center;
          overflow: hidden;
        }
        .u-quote__img-wrap {
          position: absolute;
          inset: 0;
          z-index: 0;
        }
        .u-quote__img-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            105deg,
            rgba(36,17,35,0.94) 0%,
            rgba(36,17,35,0.80) 50%,
            rgba(36,17,35,0.5) 100%
          );
        }
        .u-quote__content {
          position: relative;
          z-index: 2;
          width: 90vw;
          max-width: 620px;
          margin: 0 auto;
          padding: 4rem 1rem;
        }
        .u-quote__mark {
          font-family: var(--font-gloucester), serif;
          font-size: 7rem;
          line-height: 0.6;
          color: #ffcc00;
          opacity: 0.3;
          display: block;
          margin-bottom: -0.5rem;
        }
        .u-quote__text {
          margin: 0;
          font-family: var(--font-gloucester), serif;
          font-size: clamp(1.15rem, 2vw, 1.65rem);
          line-height: 1.55;
          color: #f2f2f2;
          font-style: italic;
        }
        .u-quote__cite {
          display: block;
          margin-top: 1.25rem;
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #ffcc00;
          opacity: 0.7;
          font-style: normal;
        }

        /* ── FINAL CTA ───────────────────────────────────── */
        .u-final-cta { padding: 4rem 2rem; background: rgba(108,0,175,0.06); }
        .u-final-cta__inner { max-width: 700px; margin: 0 auto; text-align: center; }
        .u-final-cta__sub {
          margin: 0.5rem 0 2rem;
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 0.98rem;
          line-height: 1.7;
          color: rgba(36,17,35,0.75);
        }
        .u-final-cta__actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.85rem;
          justify-content: center;
        }
      `}</style>
    </main>
  );
}
