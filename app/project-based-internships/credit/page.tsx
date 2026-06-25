// app/project-based-internships/credit/page.tsx
// Student-facing on-ramp: earn academic credit on a DAT project when your
// school isn't a formal DAT partner. Positions students TAKE — no DIY projects,
// no institution named anywhere. Matches the PLX program-page visual language.
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const revalidate = 3600;

const ACCENT = "#0FB5A8";
const CONTACT = "info@dramaticadventure.com";
const APPLY_MAILTO = `mailto:${CONTACT}?subject=${encodeURIComponent(
  "Project-Based Internship — Earn Credit",
)}`;

export const metadata: Metadata = {
  title: "Earn Academic Credit — Project-Based Internship · Dramatic Adventure Theatre",
  description:
    "Step into a defined internship role on a real DAT international production and take the academic credit back to your own school. No formal partnership required — DAT supplies the learning agreement, site supervisor, and outcomes your registrar needs.",
  openGraph: {
    title: "Earn Academic Credit on a Real International Production — DAT",
    description:
      "Take a defined internship role on a DAT project and earn credit at your own school. No formal partnership required.",
    images: ["/images/opportunities/team-adventure.jpg"],
  },
};

const STEPS = [
  {
    head: "Choose a project and a track.",
    tail:
      "Apply for an open internship role — Production / Stage Management, Dramaturgy & Research, Community Engagement & Teaching, Company & Tour Management, Documentation, or Devising Ensemble.",
  },
  {
    head: "We give you the structure for credit.",
    tail:
      "A Learning Agreement, a DAT site supervisor, defined hours, and clear learning outcomes — exactly what your internship office needs to approve credit.",
  },
  {
    head: "You take it to your school.",
    tail:
      "Bring it to your faculty advisor or internship coordinator, enroll for credit, and join the project. You cover a participation fee (financial aid may apply through your school).",
  },
];

const LEAVE_WITH = [
  { head: "A real production credit", tail: "On a real, professional international production." },
  { head: "A body of work", tail: "A supervised portfolio of the work you actually did." },
  { head: "A recommendation", tail: "A letter from someone who watched you do it." },
  { head: "A network", tail: "A place in DAT's global alumni and artist community." },
];

const FAQ = [
  {
    q: "Does my school have to partner with DAT?",
    a: "No. You can pursue this as an individual internship for credit — we hand you everything your registrar asks for.",
  },
  {
    q: "What if my school won't grant credit?",
    a: "You can still join the project as a participant. The experience, the portfolio, and the network are yours either way.",
  },
  {
    q: "What can I major in?",
    a: "Anything. The tracks are built for theatre-makers and for writers, designers, researchers, and communicators alike.",
  },
];

export default function EarnCreditPage() {
  return (
    <main className="sc-root" style={{ ["--accent" as string]: ACCENT }}>
      {/* HERO */}
      <section className="sc-hero">
        <div className="sc-hero-imgwrap">
          <Image
            src="/images/opportunities/team-adventure.jpg"
            alt="DAT team on a project abroad"
            fill
            priority
            sizes="100vw"
            style={{ objectFit: "cover", objectPosition: "center 32%" }}
          />
        </div>
        <div className="sc-hero-overlay" />
        <div className="sc-hero-content">
          <Link href="/project-based-internships" className="sc-back">
            ← Project-Based Internship
          </Link>
          <span className="sc-hero-eyebrow">For Students</span>
          <h1 className="sc-hero-title">
            Earn academic credit
            <br />
            <span className="sc-hero-title-em">on a real international production.</span>
          </h1>
          <p className="sc-hero-sub">
            Step into a defined internship role on a DAT project — and take the credit back to your
            own school. No formal partnership required.
          </p>
          <div className="sc-hero-actions">
            <a href={APPLY_MAILTO} className="sc-cta sc-cta--primary">
              Apply for a Project-Based Internship
            </a>
            <Link href="/project-based-internships" className="sc-cta sc-cta--ghost">
              About the internship
            </Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="sc-steps">
        <div className="sc-steps-inner">
          <span className="sc-eyebrow sc-eyebrow--light">How it works</span>
          <h2 className="sc-steps-title">Three steps to credit.</h2>
          <ol className="sc-steps-list">
            {STEPS.map((s, i) => (
              <li key={i}>
                <span className="sc-steps-num">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <strong>{s.head}</strong>
                  <p>{s.tail}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* WHAT YOU LEAVE WITH */}
      <section className="sc-leave">
        <div className="sc-leave-inner">
          <span className="sc-eyebrow">What you leave with</span>
          <h2 className="sc-col-title">More than a transcript line.</h2>
          <ul className="sc-comp-list">
            {LEAVE_WITH.map((b, i) => (
              <li key={i}>
                <span className="sc-comp-head">{b.head}</span>
                <span className="sc-comp-tail">{b.tail}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* GETTING CREDIT AT YOUR SCHOOL */}
      <section className="sc-faq-section">
        <div className="sc-faq-inner">
          <span className="sc-eyebrow">Getting credit at your school</span>
          <h2 className="sc-col-title">The questions students ask.</h2>
          <div className="sc-faq">
            {FAQ.map((f, i) => (
              <details key={i} className="sc-faq-item">
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CLOSING CTA */}
      <section className="sc-closing">
        <div className="sc-closing-inner">
          <span className="sc-closing-eyebrow">Take the role</span>
          <h2 className="sc-closing-title">Apply for a project-based internship.</h2>
          <p className="sc-closing-body">
            Tell us which track you want and where you go to school. We&apos;ll help you line up the
            credit and answer to {CONTACT}.
          </p>
          <div className="sc-closing-actions">
            <a href={APPLY_MAILTO} className="sc-cta sc-cta--primary">
              Apply Today
            </a>
            <Link href="/project-based-internships" className="sc-cta sc-cta--ghost-dark">
              Back to the internship
            </Link>
          </div>
        </div>
      </section>

      <style>{`
        .sc-root { background: transparent; color: #241123; }

        /* HERO */
        .sc-hero {
          position: relative;
          min-height: 64vh;
          display: flex; align-items: center;
          overflow: hidden;
          background: #0d0812;
        }
        .sc-hero-imgwrap { position: absolute; inset: 0; z-index: 0; }
        .sc-hero-overlay {
          position: absolute; inset: 0; z-index: 1;
          background:
            linear-gradient(to right, rgba(8,3,12,0.62) 0%, rgba(8,3,12,0.32) 42%, rgba(8,3,12,0.06) 75%, rgba(8,3,12,0) 100%),
            linear-gradient(to bottom, rgba(8,3,12,0) 0%, rgba(8,3,12,0) 55%, rgba(8,3,12,0.4) 100%),
            radial-gradient(ellipse 60% 60% at 80% 30%, color-mix(in srgb, var(--accent) 18%, transparent) 0%, transparent 70%);
        }
        .sc-hero-content {
          position: relative; z-index: 2;
          padding: clamp(4rem, 9vw, 7rem) clamp(1.5rem, 6vw, 5rem);
          max-width: 900px;
        }
        .sc-back {
          display: block;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.7rem; font-weight: 700;
          letter-spacing: 0.18em; text-transform: uppercase;
          color: rgba(255,255,255,0.5);
          text-decoration: none; margin-bottom: 1.25rem;
        }
        .sc-back:hover { color: var(--accent); }
        .sc-hero-eyebrow {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.72rem; font-weight: 700;
          letter-spacing: 0.26em; text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 0.9rem; display: inline-block;
        }
        .sc-hero-title {
          font-family: var(--font-anton), sans-serif;
          font-size: clamp(2.6rem, 7vw, 5.5rem);
          line-height: 0.96; font-weight: 400;
          color: #fff; margin: 0 0 1.25rem;
          text-shadow: 0 10px 36px rgba(0,0,0,0.95), 0 3px 12px rgba(0,0,0,0.8);
          letter-spacing: 0.005em;
        }
        .sc-hero-title-em { color: var(--accent); font-size: 0.62em; line-height: 1.02; display: inline-block; }
        .sc-hero-sub {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: clamp(1rem, 1.9vw, 1.2rem);
          color: rgba(255,255,255,0.82);
          line-height: 1.65; max-width: 620px;
          margin: 0 0 1.5rem;
        }
        .sc-hero-actions { display: flex; flex-wrap: wrap; gap: 0.7rem; }

        .sc-cta {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.8rem; font-weight: 700;
          letter-spacing: 0.14em; text-transform: uppercase;
          padding: 1rem 1.7rem; border-radius: 12px;
          text-decoration: none; cursor: pointer; border: none;
          transition: transform 160ms ease, opacity 160ms ease, background 160ms ease, color 160ms ease;
        }
        .sc-cta--primary { background: var(--accent); color: #241123; }
        .sc-cta--primary:hover { transform: translateY(-2px); opacity: 0.94; }
        .sc-cta--ghost { background: transparent; color: #f2f2f2; border: 1.5px solid rgba(242,242,242,0.4); }
        .sc-cta--ghost:hover { background: rgba(242,242,242,0.12); transform: translateY(-2px); }
        .sc-cta--ghost-dark { background: transparent; color: #241123; border: 1.5px solid rgba(36,17,35,0.3); }
        .sc-cta--ghost-dark:hover { background: rgba(36,17,35,0.05); transform: translateY(-2px); }

        .sc-eyebrow {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.72rem; font-weight: 700;
          letter-spacing: 0.22em; text-transform: uppercase;
          color: var(--accent);
          display: block; margin-bottom: 0.6rem;
        }
        .sc-eyebrow--light { color: #FFCC00; }
        .sc-col-title {
          font-family: var(--font-anton), sans-serif;
          font-size: clamp(1.9rem, 3.5vw, 2.6rem);
          font-weight: 400; line-height: 1.05;
          color: #241123; margin: 0 0 1.5rem;
        }

        /* HOW IT WORKS */
        .sc-steps {
          background: #241123; color: #fff;
          padding: clamp(4rem, 7vw, 6rem) clamp(1.5rem, 5vw, 3rem);
        }
        .sc-steps-inner { max-width: 880px; margin: 0 auto; }
        .sc-steps-title {
          font-family: var(--font-anton), sans-serif;
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 400; line-height: 1.05;
          color: #fff; margin: 0 0 2rem;
        }
        .sc-steps-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 1rem; }
        .sc-steps-list li {
          display: flex; gap: 1rem;
          padding: 1.1rem 1.35rem;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
        }
        .sc-steps-num {
          font-family: var(--font-anton), sans-serif;
          font-size: 1.6rem; color: var(--accent);
          flex: 0 0 2.4rem; line-height: 1.05;
        }
        .sc-steps-list strong {
          font-family: var(--font-space-grotesk), sans-serif;
          font-weight: 800; color: #fff;
          display: block; font-size: 1.05rem;
        }
        .sc-steps-list p {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.92rem; line-height: 1.6;
          color: rgba(255,255,255,0.74);
          margin: 0.3rem 0 0;
        }

        /* WHAT YOU LEAVE WITH */
        .sc-leave { padding: clamp(3rem, 5vw, 5rem) clamp(1.25rem, 5vw, 3rem); }
        .sc-leave-inner {
          max-width: 820px; margin: 0 auto;
          background: rgba(254,250,242,0.78);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          border: 1px solid rgba(255,255,255,0.5);
          border-radius: 20px;
          box-shadow: 0 6px 32px rgba(36,17,35,0.05), inset 0 1px 0 rgba(255,255,255,0.5);
          padding: clamp(1.75rem, 4vw, 2.75rem);
        }
        .sc-comp-list { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.85rem; }
        @media (max-width: 640px) { .sc-comp-list { grid-template-columns: 1fr; } }
        .sc-comp-list li {
          display: flex; flex-direction: column;
          padding: 1rem 1.25rem;
          background: #fff;
          border: 1px solid rgba(36,17,35,0.08);
          border-left: 3px solid var(--accent);
          border-radius: 0 10px 10px 0;
        }
        .sc-comp-head {
          font-family: var(--font-space-grotesk), sans-serif;
          font-weight: 800; color: var(--accent);
          font-size: 1.04rem;
        }
        .sc-comp-tail {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.92rem; line-height: 1.55;
          color: rgba(36,17,35,0.7);
          margin-top: 0.25rem;
        }

        /* FAQ */
        .sc-faq-section {
          background: rgba(36,17,35,0.04);
          padding: clamp(4rem, 6vw, 5rem) clamp(1.5rem, 5vw, 3rem);
        }
        .sc-faq-inner { max-width: 820px; margin: 0 auto; }
        .sc-faq { display: flex; flex-direction: column; gap: 0.5rem; }
        .sc-faq-item {
          background: #fff;
          border: 1px solid rgba(36,17,35,0.08);
          border-radius: 12px;
          padding: 0 1.25rem;
        }
        .sc-faq-item[open] { background: #fff; border-color: var(--accent); }
        .sc-faq-item summary {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 1rem; font-weight: 700;
          color: #241123; padding: 1rem 0;
          cursor: pointer; list-style: none;
          display: flex; justify-content: space-between;
          align-items: center; gap: 1rem;
        }
        .sc-faq-item summary::-webkit-details-marker { display: none; }
        .sc-faq-item summary::after {
          content: "+";
          font-family: var(--font-anton), sans-serif;
          font-size: 1.3rem; color: var(--accent);
          transition: transform 200ms ease;
        }
        .sc-faq-item[open] summary::after { transform: rotate(45deg); }
        .sc-faq-item p {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.94rem; line-height: 1.7;
          color: rgba(36,17,35,0.78);
          margin: 0 0 1rem;
        }

        /* CLOSING */
        .sc-closing {
          background: #FFCC00;
          padding: clamp(4rem, 7vw, 6rem) clamp(1.5rem, 5vw, 3rem);
          text-align: center;
        }
        .sc-closing-inner { max-width: 820px; margin: 0 auto; }
        .sc-closing-eyebrow {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.72rem; font-weight: 700;
          letter-spacing: 0.26em; text-transform: uppercase;
          color: rgba(36,17,35,0.7);
          display: block; margin-bottom: 0.85rem;
        }
        .sc-closing-title {
          font-family: var(--font-anton), sans-serif;
          font-size: clamp(2rem, 4.5vw, 3.2rem);
          font-weight: 400; line-height: 1.05;
          color: #241123; margin: 0 0 1rem;
        }
        .sc-closing-body {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: clamp(1rem, 1.6vw, 1.12rem);
          line-height: 1.7; color: rgba(36,17,35,0.78);
          margin: 0 0 2rem;
        }
        .sc-closing-actions { display: flex; flex-wrap: wrap; gap: 0.7rem; justify-content: center; }
      `}</style>
    </main>
  );
}
