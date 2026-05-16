// app/professional-leadership-experience/page.tsx
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { formatDeadline, type Opportunity } from "@/lib/opportunities";
import { loadOpportunities } from "@/lib/loadOpportunities";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "PLX — Professional Leadership Experience · DAT",
  description:
    "Global Internships & Apprenticeships at Dramatic Adventure Theatre. Hands-on experience, mentorship, and in-the-field international training for emerging arts administrators.",
  openGraph: {
    title: "PLX — Professional Leadership Experience · DAT",
    description:
      "Global Internships & Apprenticeships at Dramatic Adventure Theatre. Hands-on experience, mentorship, and in-the-field international training for emerging arts administrators.",
    images: ["/images/opportunities/PLX-hero.jpg"],
  },
};

const BENEFITS = [
  { icon: "🎯", title: "Hands-on experience", body: "Real projects, real outcomes — not coffee runs or filing." },
  { icon: "🧭", title: "Mentorship", body: "Weekly 1:1s with a DAT staff member who's done the job." },
  { icon: "📈", title: "Pro-dev workshops", body: "Resume reviews, pitch coaching, grant writing, EDI training." },
  { icon: "🌍", title: "International travel", body: "ACTion expeditions to Tanzania, Ecuador, Slovakia, Czechia — travel grants available." },
  { icon: "💰", title: "Stipends", body: "Both programs are paid. We believe in compensating early-career work." },
  { icon: "🤝", title: "DAT alumni network", body: "Lifetime access to a global community of artists and arts admins." },
  { icon: "🎟️", title: "Free event tickets", body: "Performances, festivals, fundraisers — wherever we're working." },
  { icon: "📝", title: "Real portfolio + reference", body: "Leave with a body of work and a letter from someone who knows it." },
];

const ROLE_BLURBS: { value: string; head: string; tail: string }[] = [
  { value: "01", head: "You are an ambitious go-getter.", tail: "You finish what you start." },
  { value: "02", head: "You take pride in what you do.", tail: "Craft matters to you." },
  { value: "03", head: "You are inspired.", tail: "Something pulled you here — we want to hear what." },
  { value: "04", head: "You are scrappy and entrepreneurial.", tail: "You make do, then make better." },
  { value: "05", head: "You are action oriented.", tail: "You turn ideas into outcomes." },
  { value: "06", head: "You enjoy your work.", tail: "You love what you do and find yourself tinkering at strange hours." },
  { value: "07", head: "You are a good soul.", tail: "Generous, kind, and listening." },
];

function PlxProgramTile({ o, color }: { o: Opportunity; color: string }) {
  const programLabel = o.plxProgram === "internship" ? "Internship" : "Apprenticeship";
  const learnHref = o.plxProgram === "internship" ? "/internships" : "/apprenticeships";
  return (
    <article className="plx-tile" style={{ ["--accent" as string]: color }}>
      <div className="plx-tile-top">
        <span className="plx-tile-tag">{programLabel}</span>
        {o.status === "open" && <span className="plx-tile-status">Now Accepting</span>}
        {o.status === "coming_soon" && <span className="plx-tile-status plx-tile-status--soon">Coming Soon</span>}
        {o.status === "closed" && <span className="plx-tile-status plx-tile-status--closed">Applications Closed</span>}
      </div>
      <h3 className="plx-tile-title">{o.title}</h3>
      <p className="plx-tile-desc">{o.description}</p>
      <dl className="plx-tile-meta">
        <div><dt>Commitment</dt><dd>{o.commitment}</dd></div>
        <div><dt>Compensation</dt><dd>{o.compensation}</dd></div>
        {o.deadline && o.status === "open" && (
          <div><dt>Apply By</dt><dd>{formatDeadline(o.deadline)}</dd></div>
        )}
      </dl>
      <div className="plx-tile-actions">
        {o.applyUrl && (o.status === "open" || o.status === "coming_soon") && (
          <a href={o.applyUrl} className="plx-tile-cta plx-tile-cta--primary">
            {o.status === "coming_soon" ? "Get Notified" : "Apply Today"}
          </a>
        )}
        <Link href={learnHref} className="plx-tile-cta plx-tile-cta--ghost">
          Full Program Details
        </Link>
      </div>
    </article>
  );
}

export default async function PLXLandingPage() {
  const all = await loadOpportunities();
  const plxItems = all.filter(
    (o) => o.plxProgram === "internship" || o.plxProgram === "apprenticeship",
  );
  const intern = plxItems.find((p) => p.plxProgram === "internship");
  const apprentice = plxItems.find((p) => p.plxProgram === "apprenticeship");

  return (
    <main className="plx-root">
      {/* ── HERO ─────────────────────────── */}
      <section className="plx-hero">
        <div className="plx-hero-imgwrap">
          <Image
            src="/images/opportunities/PLX-hero.jpg"
            alt="PLX — Professional Leadership Experience"
            fill
            priority
            sizes="100vw"
            style={{ objectFit: "cover", objectPosition: "center 30%" }}
          />
        </div>
        <div className="plx-hero-overlay" />
        <div className="plx-hero-grid" aria-hidden="true" />
        <div className="plx-hero-content">
          <span className="plx-hero-eyebrow">Professional Leadership Experience</span>
          <h1 className="plx-hero-title">
            PLX.<br />
            <span className="plx-hero-title-em">Global Internships<br />&amp; Apprenticeships.</span>
          </h1>
          <p className="plx-hero-sub">
            Hands-on experience coupled with mentorship and professional development.
            Take the first step of an incredible journey with DAT.
          </p>
          <div className="plx-hero-cta">
            <a href="#programs" className="plx-cta plx-cta--primary">See the Programs</a>
            <Link href="/opportunities" className="plx-cta plx-cta--ghost">All Opportunities</Link>
          </div>
        </div>
      </section>

      {/* ── INTRO BAND ─────────────────────── */}
      <section className="plx-intro">
        <div className="plx-intro-inner">
          <h2 className="plx-intro-title">Launch your arts admin career with a dramatic adventure.</h2>
          <p className="plx-intro-body">
            Are you passionate about DAT's mission? Do you want to change the world with art? Are you willing
            to roll up your sleeves and make magic happen? PLX is a hybrid program of remote, in-person, and
            in-the-field work — thoughtfully designed so you can take part from wherever you're based.
          </p>
        </div>
      </section>

      {/* ── PROGRAMS ──────────────────────── */}
      <section id="programs" className="plx-programs">
        <div className="plx-programs-inner">
          <span className="plx-programs-eyebrow">Two Programs · One Mission</span>
          <h2 className="plx-programs-title">Find the right path.</h2>
          <p className="plx-programs-sub">
            The <strong>Internship</strong> is an introduction — a 12-week window into the work for students
            and recent grads. The <strong>Apprenticeship</strong> is a 10-month leadership track for
            early-career arts administrators ready to own real work.
          </p>
          <div className="plx-programs-grid">
            {intern && <PlxProgramTile o={intern} color="#FFCC00" />}
            {apprentice && <PlxProgramTile o={apprentice} color="#F23359" />}
          </div>
        </div>
      </section>

      {/* ── BENEFITS ─────────────────────── */}
      <section className="plx-benefits">
        <div className="plx-benefits-inner">
          <span className="plx-benefits-eyebrow">What you'll gain</span>
          <h2 className="plx-benefits-title">What are the benefits of this experience?</h2>
          <div className="plx-benefits-grid">
            {BENEFITS.map((b) => (
              <div key={b.title} className="plx-benefit">
                <span className="plx-benefit-icon">{b.icon}</span>
                <h3 className="plx-benefit-name">{b.title}</h3>
                <p className="plx-benefit-body">{b.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHO YOU ARE ─────────────────────── */}
      <section className="plx-who">
        <div className="plx-who-inner">
          <span className="plx-who-eyebrow">Who You Are</span>
          <h2 className="plx-who-title">Ready to roll up your sleeves?</h2>
          <p className="plx-who-sub">
            DAT is for the curious, the collaborative, the bold, and the scrappy. If this sounds like you,
            we want to hear from you.
          </p>
          <ol className="plx-who-list">
            {ROLE_BLURBS.map((r) => (
              <li key={r.value}>
                <span className="plx-who-num">{r.value}</span>
                <div>
                  <strong>{r.head}</strong>
                  <p>{r.tail}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── CTA ─────────────────────────── */}
      <section className="plx-closing">
        <div className="plx-closing-inner">
          <span className="plx-closing-eyebrow">Apply online today</span>
          <h2 className="plx-closing-title">Take the first step of an incredible journey with DAT.</h2>
          <p className="plx-closing-body">
            Applications are reviewed on a rolling basis. We carefully select a small cohort each season —
            we want to know you, not just your resume.
          </p>
          <div className="plx-closing-actions">
            <Link href="/internships" className="plx-cta plx-cta--primary">
              Internship Details
            </Link>
            <Link href="/apprenticeships" className="plx-cta plx-cta--primary plx-cta--alt">
              Apprenticeship Details
            </Link>
          </div>
          <p className="plx-closing-contact">
            Sponsorship inquiries:{" "}
            <a href="mailto:hello@dramaticadventure.com?subject=PLX%20Sponsorship">hello@dramaticadventure.com</a>
          </p>
        </div>
      </section>

      {/* ── STYLES ──────────────────────── */}
      <style>{`
        .plx-root { background: transparent; color: #241123; }

        /* HERO */
        .plx-hero {
          position: relative;
          min-height: 78vh;
          display: flex;
          align-items: center;
          overflow: hidden;
          background: #0d0812;
        }
        .plx-hero-imgwrap { position: absolute; inset: 0; z-index: 0; }
        .plx-hero-overlay {
          position: absolute; inset: 0; z-index: 1;
          background:
            linear-gradient(to right, rgba(8,3,12,0.58) 0%, rgba(8,3,12,0.3) 38%, rgba(8,3,12,0.05) 70%, rgba(8,3,12,0) 100%),
            linear-gradient(to bottom, rgba(8,3,12,0) 0%, rgba(8,3,12,0) 55%, rgba(8,3,12,0.4) 100%),
            radial-gradient(ellipse 60% 60% at 80% 30%, rgba(255,204,0,0.14) 0%, transparent 70%);
        }
        .plx-hero-grid {
          position: absolute; inset: 0; z-index: 1;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 80px 80px;
        }
        .plx-hero-content {
          position: relative; z-index: 2;
          padding: clamp(5rem, 10vw, 8rem) clamp(1.5rem, 6vw, 5rem);
          max-width: 900px;
        }
        .plx-hero-eyebrow {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.72rem; font-weight: 700;
          letter-spacing: 0.26em; text-transform: uppercase;
          color: #FFCC00; margin-bottom: 1rem; display: inline-block;
        }
        .plx-hero-title {
          font-family: var(--font-anton), sans-serif;
          font-size: clamp(3.5rem, 10vw, 8rem);
          line-height: 0.94; font-weight: 400;
          color: #fff; margin: 0 0 1.5rem;
          letter-spacing: 0.01em;
          text-shadow: 0 10px 36px rgba(0,0,0,0.95), 0 3px 12px rgba(0,0,0,0.8);
        }
        .plx-hero-title-em {
          color: #FFCC00;
          font-size: 0.62em;
          line-height: 0.98;
          display: inline-block;
        }
        .plx-hero-sub {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: clamp(1rem, 2vw, 1.22rem);
          color: rgba(255,255,255,0.82);
          line-height: 1.65; max-width: 620px;
          margin: 0 0 2rem;
        }
        .plx-hero-cta { display: flex; flex-wrap: wrap; gap: 0.7rem; }

        .plx-cta {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.8rem; font-weight: 700;
          letter-spacing: 0.14em; text-transform: uppercase;
          padding: 1rem 1.7rem; border-radius: 12px;
          text-decoration: none; cursor: pointer; border: none;
          transition: transform 160ms ease, opacity 160ms ease, background 160ms ease, color 160ms ease;
        }
        .plx-cta--primary { background: #FFCC00; color: #241123; }
        .plx-cta--primary:hover { transform: translateY(-2px); background: #ffd633; }
        .plx-cta--alt { background: #F23359; color: #fff; }
        .plx-cta--alt:hover { background: #d92a4d; }
        .plx-cta--ghost {
          background: transparent; color: #f2f2f2;
          border: 1.5px solid rgba(242,242,242,0.4);
        }
        .plx-cta--ghost:hover { background: rgba(242,242,242,0.12); transform: translateY(-2px); }

        /* INTRO */
        .plx-intro {
          background: #241123; color: #fff;
          padding: clamp(3rem, 6vw, 5rem) clamp(1.5rem, 5vw, 3rem);
        }
        .plx-intro-inner { max-width: 880px; margin: 0 auto; text-align: center; }
        .plx-intro-title {
          font-family: var(--font-anton), sans-serif;
          font-size: clamp(2rem, 4vw, 3.2rem);
          font-weight: 400; line-height: 1.05;
          margin: 0 0 1.25rem;
        }
        .plx-intro-body {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: clamp(1rem, 1.6vw, 1.15rem);
          line-height: 1.75; color: rgba(255,255,255,0.78);
          margin: 0;
        }

        /* PROGRAMS */
        .plx-programs {
          padding: clamp(3rem, 5vw, 5rem) clamp(1.25rem, 5vw, 3rem);
        }
        .plx-programs-inner {
          max-width: 1220px; margin: 0 auto;
          background: rgba(254,250,242,0.78);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          border: 1px solid rgba(255,255,255,0.5);
          border-radius: 20px;
          box-shadow: 0 6px 32px rgba(36,17,35,0.05), inset 0 1px 0 rgba(255,255,255,0.5);
          padding: clamp(2rem, 4vw, 3rem);
        }
        .plx-programs-eyebrow {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.72rem; font-weight: 700;
          letter-spacing: 0.22em; text-transform: uppercase;
          color: #6C00AF;
          display: block; margin-bottom: 0.6rem;
        }
        .plx-programs-title {
          font-family: var(--font-anton), sans-serif;
          font-size: clamp(2.2rem, 4.5vw, 3.4rem);
          font-weight: 400; line-height: 1.02;
          color: #241123; margin: 0 0 0.85rem;
        }
        .plx-programs-sub {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: clamp(1rem, 1.6vw, 1.12rem);
          line-height: 1.7; color: rgba(36,17,35,0.75);
          margin: 0 0 2.5rem; max-width: 760px;
        }
        .plx-programs-sub strong { color: #241123; font-weight: 700; }
        .plx-programs-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }
        @media (max-width: 820px) { .plx-programs-grid { grid-template-columns: 1fr; } }

        .plx-tile {
          background: #fff;
          border: 1.5px solid rgba(36,17,35,0.1);
          border-top: 4px solid var(--accent);
          border-radius: 18px;
          padding: 1.75rem 1.75rem 1.5rem;
          display: flex; flex-direction: column;
          transition: transform 220ms ease, box-shadow 220ms ease;
        }
        .plx-tile:hover { transform: translateY(-4px); box-shadow: 0 18px 48px rgba(36,17,35,0.13); }

        .plx-tile-top { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.85rem; flex-wrap: wrap; }
        .plx-tile-tag {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.66rem; font-weight: 700;
          letter-spacing: 0.22em; text-transform: uppercase;
          padding: 0.35rem 0.75rem; border-radius: 6px;
          background: var(--accent); color: #241123;
        }
        .plx-tile-status {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.6rem; font-weight: 700;
          letter-spacing: 0.2em; text-transform: uppercase;
          padding: 0.3rem 0.6rem; border-radius: 6px;
          background: rgba(47,168,115,0.14); color: #1f8c5d;
          border: 1px solid rgba(47,168,115,0.4);
        }
        .plx-tile-status--soon { background: rgba(217,169,25,0.15); color: #b8881d; border-color: rgba(217,169,25,0.4); }
        .plx-tile-status--closed { background: rgba(36,17,35,0.08); color: rgba(36,17,35,0.6); border-color: rgba(36,17,35,0.18); }

        .plx-tile-title {
          font-family: var(--font-anton), sans-serif;
          font-size: clamp(1.6rem, 2.6vw, 2rem);
          font-weight: 400; line-height: 1.05;
          margin: 0 0 0.75rem; color: #241123;
        }
        .plx-tile-desc {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.95rem; line-height: 1.65;
          color: rgba(36,17,35,0.72);
          margin: 0 0 1.5rem;
        }
        .plx-tile-meta {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 1rem; margin: 0 0 1.5rem; padding: 0;
        }
        @media (max-width: 480px) { .plx-tile-meta { grid-template-columns: 1fr; } }
        .plx-tile-meta div { display: flex; flex-direction: column; gap: 0.18rem; }
        .plx-tile-meta dt {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.6rem; font-weight: 700;
          letter-spacing: 0.18em; text-transform: uppercase;
          color: rgba(36,17,35,0.5);
        }
        .plx-tile-meta dd {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.92rem; font-weight: 600;
          color: #241123; margin: 0;
        }
        .plx-tile-actions { display: flex; gap: 0.6rem; flex-wrap: wrap; margin-top: auto; }
        .plx-tile-cta {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.76rem; font-weight: 700;
          letter-spacing: 0.14em; text-transform: uppercase;
          padding: 0.85rem 1.3rem; border-radius: 10px;
          text-decoration: none;
          transition: transform 160ms ease, background 160ms ease, opacity 160ms ease;
        }
        .plx-tile-cta--primary { background: var(--accent); color: #241123; }
        .plx-tile-cta--primary:hover { transform: translateY(-2px); opacity: 0.94; }
        .plx-tile-cta--ghost {
          background: transparent; color: var(--accent);
          border: 1.5px solid var(--accent);
        }
        .plx-tile-cta--ghost:hover { background: rgba(0,0,0,0.04); transform: translateY(-2px); }

        /* BENEFITS */
        .plx-benefits {
          background: rgba(36,17,35,0.04);
          padding: clamp(4rem, 7vw, 6rem) clamp(1.5rem, 5vw, 3rem);
        }
        .plx-benefits-inner { max-width: 1180px; margin: 0 auto; }
        .plx-benefits-eyebrow {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.72rem; font-weight: 700;
          letter-spacing: 0.22em; text-transform: uppercase;
          color: #6C00AF;
          display: block; margin-bottom: 0.6rem;
        }
        .plx-benefits-title {
          font-family: var(--font-anton), sans-serif;
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 400; line-height: 1.05;
          color: #241123; margin: 0 0 2.5rem;
        }
        .plx-benefits-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.25rem;
        }
        @media (max-width: 1024px) { .plx-benefits-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 540px) { .plx-benefits-grid { grid-template-columns: 1fr; } }
        .plx-benefit {
          background: #fff;
          padding: 1.5rem 1.25rem;
          border-radius: 14px;
          border: 1px solid rgba(36,17,35,0.08);
          transition: transform 180ms ease, box-shadow 180ms ease;
        }
        .plx-benefit:hover { transform: translateY(-3px); box-shadow: 0 10px 28px rgba(36,17,35,0.1); }
        .plx-benefit-icon { font-size: 1.6rem; display: block; margin-bottom: 0.6rem; }
        .plx-benefit-name {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 1rem; font-weight: 800;
          color: #6C00AF; margin: 0 0 0.4rem;
        }
        .plx-benefit-body {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.88rem; line-height: 1.6;
          color: rgba(36,17,35,0.72); margin: 0;
        }

        /* WHO YOU ARE */
        .plx-who {
          padding: clamp(3rem, 5vw, 5rem) clamp(1.25rem, 5vw, 3rem);
        }
        .plx-who-inner {
          max-width: 980px; margin: 0 auto;
          background: rgba(254,250,242,0.78);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          border: 1px solid rgba(255,255,255,0.5);
          border-radius: 20px;
          box-shadow: 0 6px 32px rgba(36,17,35,0.05), inset 0 1px 0 rgba(255,255,255,0.5);
          padding: clamp(2rem, 4vw, 3rem);
        }
        .plx-who-eyebrow {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.72rem; font-weight: 700;
          letter-spacing: 0.22em; text-transform: uppercase;
          color: #F23359;
          display: block; margin-bottom: 0.6rem;
        }
        .plx-who-title {
          font-family: var(--font-anton), sans-serif;
          font-size: clamp(2.2rem, 4.5vw, 3.4rem);
          font-weight: 400; line-height: 1.02;
          color: #241123; margin: 0 0 0.85rem;
        }
        .plx-who-sub {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 1.04rem; line-height: 1.7;
          color: rgba(36,17,35,0.72);
          margin: 0 0 2rem;
        }
        .plx-who-list {
          list-style: none; padding: 0; margin: 0;
          display: flex; flex-direction: column; gap: 1rem;
        }
        .plx-who-list li {
          display: flex; gap: 1.25rem;
          padding: 1rem 1.25rem;
          background: rgba(242,51,89,0.04);
          border-left: 3px solid rgba(242,51,89,0.4);
          border-radius: 0 12px 12px 0;
        }
        .plx-who-num {
          font-family: var(--font-anton), sans-serif;
          font-size: 1.6rem; color: #F23359;
          flex: 0 0 2.5rem; line-height: 1.1;
        }
        .plx-who-list strong {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 1.02rem; font-weight: 800;
          color: #241123; display: block;
        }
        .plx-who-list p {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.94rem; line-height: 1.6;
          color: rgba(36,17,35,0.7);
          margin: 0.2rem 0 0;
        }

        /* CLOSING */
        .plx-closing {
          background: #6C00AF;
          background-image: radial-gradient(ellipse at top right, rgba(255,204,0,0.18) 0%, transparent 60%);
          padding: clamp(4rem, 8vw, 7rem) clamp(1.5rem, 5vw, 3rem);
          color: #fff; text-align: center;
        }
        .plx-closing-inner { max-width: 800px; margin: 0 auto; }
        .plx-closing-eyebrow {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.72rem; font-weight: 700;
          letter-spacing: 0.26em; text-transform: uppercase;
          color: #FFCC00;
          display: block; margin-bottom: 1rem;
        }
        .plx-closing-title {
          font-family: var(--font-anton), sans-serif;
          font-size: clamp(2.2rem, 5vw, 3.8rem);
          font-weight: 400; line-height: 1.05;
          margin: 0 0 1.25rem;
        }
        .plx-closing-body {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: clamp(1rem, 1.7vw, 1.15rem);
          line-height: 1.7; color: rgba(255,255,255,0.82);
          margin: 0 0 2rem;
        }
        .plx-closing-actions {
          display: flex; flex-wrap: wrap; gap: 0.7rem; justify-content: center;
        }
        .plx-closing-contact {
          margin: 2rem 0 0;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.82rem;
          color: rgba(255,255,255,0.6);
        }
        .plx-closing-contact a {
          color: #FFCC00; text-decoration: none;
          border-bottom: 1.5px solid rgba(255,204,0,0.5);
        }
        .plx-closing-contact a:hover { border-color: #FFCC00; }
      `}</style>
    </main>
  );
}
