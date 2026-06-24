// components/plx/PlxProgramPage.tsx
// Shared template for /apprenticeships and /fellowships — sub-program pages.
import Image from "next/image";
import Link from "next/link";
import {
  formatDeadline,
  type Opportunity,
} from "@/lib/opportunities";

export interface PlxProgramCopy {
  programLabel: string; // "Global Apprenticeship" | "Global Fellowship"
  heroImage: string;
  eyebrow: string;      // "Global Apprenticeship" | "Global Fellowship"
  headlineLine1: string;
  headlineLine2: string;
  pitch: string;        // hero sub
  hookQuestion: string;
  introTitle: string;
  introBody: string;
  compensationBullets: { head: string; tail: string }[];
  requirements: string[];
  whoYouAre: { head: string; tail: string }[];
  timeline: { label: string; detail: string }[];
  closingLine: string;
  faq: { q: string; a: string }[];
  crossLink: { href: string; label: string };
  contactEmail: string;
  accent: string;       // CSS color
}

export default function PlxProgramPage({
  copy,
  opp,
}: {
  copy: PlxProgramCopy;
  opp: Opportunity | undefined;
}) {
  const status = opp?.status ?? "closed";
  const isOpen = status === "open";
  const applyUrl = opp?.applyUrl;

  return (
    <main className="pp-root" style={{ ["--accent" as string]: copy.accent }}>
      {/* HERO */}
      <section className="pp-hero">
        <div className="pp-hero-imgwrap">
          <Image
            src={copy.heroImage}
            alt={copy.programLabel}
            fill
            priority
            sizes="100vw"
            style={{ objectFit: "cover", objectPosition: "center 32%" }}
          />
        </div>
        <div className="pp-hero-overlay" />
        <div className="pp-hero-content">
          <Link href="/professional-leadership-experience" className="pp-back">
            ← All PLX Programs
          </Link>
          <span className="pp-hero-eyebrow">{copy.eyebrow}</span>
          <h1 className="pp-hero-title">
            {copy.headlineLine1}<br />
            <span className="pp-hero-title-em">{copy.headlineLine2}</span>
          </h1>
          <p className="pp-hero-sub">{copy.pitch}</p>
          {!isOpen && (
            <div className="pp-status-banner">
              {status === "closed"
                ? "Applications are currently closed — sign up to be notified about the next cohort."
                : status === "coming_soon"
                  ? "Applications open soon — get on the list."
                  : "Reviewed on a rolling basis."}
            </div>
          )}
          <div className="pp-hero-actions">
            {isOpen && applyUrl && (
              <a href={applyUrl} className="pp-cta pp-cta--primary">Apply Today</a>
            )}
            {!isOpen && (
              <a
                href={`mailto:${copy.contactEmail}?subject=${encodeURIComponent(`${copy.programLabel} — Future Cohorts`)}`}
                className="pp-cta pp-cta--primary"
              >
                Get Notified
              </a>
            )}
            <Link href={copy.crossLink.href} className="pp-cta pp-cta--ghost">
              {copy.crossLink.label}
            </Link>
          </div>
        </div>
      </section>

      {/* HOOK */}
      <section className="pp-hook">
        <div className="pp-hook-inner">
          <p className="pp-hook-question">{copy.hookQuestion}</p>
          <h2 className="pp-hook-title">{copy.introTitle}</h2>
          <p className="pp-hook-body">{copy.introBody}</p>
        </div>
      </section>

      {/* WHEN + COMPENSATION (two-column) */}
      <section className="pp-grid-section">
        <div className="pp-grid-inner">
          {/* When */}
          <div className="pp-col">
            <span className="pp-eyebrow">When is this happening?</span>
            <h2 className="pp-col-title">Timeline</h2>
            <ol className="pp-timeline">
              {copy.timeline.map((t, i) => (
                <li key={i}>
                  <span className="pp-timeline-num">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <strong>{t.label}</strong>
                    {t.detail && <p>{t.detail}</p>}
                  </div>
                </li>
              ))}
            </ol>
            {opp?.deadline && isOpen && (
              <div className="pp-deadline">
                <span className="pp-deadline-label">Apply By</span>
                <span className="pp-deadline-value">{formatDeadline(opp.deadline)}</span>
              </div>
            )}
          </div>

          {/* Compensation */}
          <div className="pp-col">
            <span className="pp-eyebrow">Compensation</span>
            <h2 className="pp-col-title">{opp?.compensation || "Stipend + travel grant"}</h2>
            <ul className="pp-comp-list">
              {copy.compensationBullets.map((b, i) => (
                <li key={i}>
                  <span className="pp-comp-head">{b.head}</span>
                  <span className="pp-comp-tail">{b.tail}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* WHO YOU ARE */}
      <section className="pp-who">
        <div className="pp-who-inner">
          <span className="pp-eyebrow pp-eyebrow--light">Who you are</span>
          <h2 className="pp-who-title">Ready to roll up your sleeves?</h2>
          <ol className="pp-who-list">
            {copy.whoYouAre.map((r, i) => (
              <li key={i}>
                <span className="pp-who-num">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <strong>{r.head}</strong>
                  <p>{r.tail}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* REQUIREMENTS */}
      <section className="pp-reqs">
        <div className="pp-reqs-inner">
          <span className="pp-eyebrow">Basic Requirements</span>
          <h2 className="pp-col-title">The fine print.</h2>
          <ul className="pp-reqs-list">
            {copy.requirements.map((r, i) => (
              <li key={i}>
                <span className="pp-reqs-dot" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      {copy.faq.length > 0 && (
        <section className="pp-faq-section">
          <div className="pp-faq-inner">
            <span className="pp-eyebrow">FAQ</span>
            <h2 className="pp-col-title">Common questions.</h2>
            <div className="pp-faq">
              {copy.faq.map((f, i) => (
                <details key={i} className="pp-faq-item">
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="pp-closing">
        <div className="pp-closing-inner">
          <span className="pp-closing-eyebrow">Apply online today</span>
          <h2 className="pp-closing-title">{copy.closingLine}</h2>
          <p className="pp-closing-body">
            {isOpen
              ? "Your application is reviewed by real DAT staff. You will hear back from us, regardless of outcome."
              : `Reach out at ${copy.contactEmail} and we will let you know when the next cohort opens.`}
          </p>
          <div className="pp-closing-actions">
            {isOpen && applyUrl ? (
              <a href={applyUrl} className="pp-cta pp-cta--primary">Apply Today</a>
            ) : (
              <a
                href={`mailto:${copy.contactEmail}?subject=${encodeURIComponent(`${copy.programLabel} — Future Cohorts`)}`}
                className="pp-cta pp-cta--primary"
              >
                Get Notified
              </a>
            )}
            <Link href={copy.crossLink.href} className="pp-cta pp-cta--ghost-dark">
              {copy.crossLink.label}
            </Link>
          </div>
          {opp && (
            <p className="pp-closing-meta">
              <Link href={`/opportunities/${opp.id}`} className="pp-closing-link">
                See the full listing →
              </Link>
            </p>
          )}
        </div>
      </section>

      <style>{`
        .pp-root { background: transparent; color: #241123; }

        /* HERO */
        .pp-hero {
          position: relative;
          min-height: 70vh;
          display: flex; align-items: center;
          overflow: hidden;
          background: #0d0812;
        }
        .pp-hero-imgwrap { position: absolute; inset: 0; z-index: 0; }
        .pp-hero-overlay {
          position: absolute; inset: 0; z-index: 1;
          background:
            linear-gradient(to right, rgba(8,3,12,0.62) 0%, rgba(8,3,12,0.32) 42%, rgba(8,3,12,0.06) 75%, rgba(8,3,12,0) 100%),
            linear-gradient(to bottom, rgba(8,3,12,0) 0%, rgba(8,3,12,0) 55%, rgba(8,3,12,0.4) 100%),
            radial-gradient(ellipse 60% 60% at 80% 30%, color-mix(in srgb, var(--accent) 18%, transparent) 0%, transparent 70%);
        }
        .pp-hero-content {
          position: relative; z-index: 2;
          padding: clamp(4rem, 9vw, 7rem) clamp(1.5rem, 6vw, 5rem);
          max-width: 900px;
        }
        .pp-back {
          display: inline-block;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.7rem; font-weight: 700;
          letter-spacing: 0.18em; text-transform: uppercase;
          color: rgba(255,255,255,0.5);
          text-decoration: none; margin-bottom: 1.25rem;
        }
        .pp-back:hover { color: var(--accent); }
        .pp-hero-eyebrow {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.72rem; font-weight: 700;
          letter-spacing: 0.26em; text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 0.9rem; display: inline-block;
        }
        .pp-hero-title {
          font-family: var(--font-anton), sans-serif;
          font-size: clamp(3rem, 8vw, 6.5rem);
          line-height: 0.94; font-weight: 400;
          color: #fff; margin: 0 0 1.25rem;
          text-shadow: 0 10px 36px rgba(0,0,0,0.95), 0 3px 12px rgba(0,0,0,0.8);
          letter-spacing: 0.005em;
        }
        .pp-hero-title-em { color: var(--accent); font-size: 0.72em; line-height: 0.98; display: inline-block; }
        .pp-hero-sub {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: clamp(1rem, 1.9vw, 1.2rem);
          color: rgba(255,255,255,0.82);
          line-height: 1.65; max-width: 620px;
          margin: 0 0 1.5rem;
        }
        .pp-status-banner {
          display: inline-block;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.72rem; font-weight: 700;
          letter-spacing: 0.18em; text-transform: uppercase;
          padding: 0.55rem 1rem; border-radius: 8px;
          background: rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.85);
          border: 1px solid rgba(255,255,255,0.18);
          margin-bottom: 1.5rem;
        }
        .pp-hero-actions { display: flex; flex-wrap: wrap; gap: 0.7rem; }

        .pp-cta {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.8rem; font-weight: 700;
          letter-spacing: 0.14em; text-transform: uppercase;
          padding: 1rem 1.7rem; border-radius: 12px;
          text-decoration: none; cursor: pointer; border: none;
          transition: transform 160ms ease, opacity 160ms ease, background 160ms ease, color 160ms ease;
        }
        .pp-cta--primary { background: var(--accent); color: #241123; }
        .pp-cta--primary:hover { transform: translateY(-2px); opacity: 0.94; }
        .pp-cta--ghost { background: transparent; color: #f2f2f2; border: 1.5px solid rgba(242,242,242,0.4); }
        .pp-cta--ghost:hover { background: rgba(242,242,242,0.12); transform: translateY(-2px); }
        .pp-cta--ghost-dark { background: transparent; color: #241123; border: 1.5px solid rgba(36,17,35,0.3); }
        .pp-cta--ghost-dark:hover { background: rgba(36,17,35,0.05); transform: translateY(-2px); }

        /* HOOK */
        .pp-hook {
          background: #241123; color: #fff;
          padding: clamp(3rem, 6vw, 5rem) clamp(1.5rem, 5vw, 3rem);
        }
        .pp-hook-inner { max-width: 880px; margin: 0 auto; text-align: center; }
        .pp-hook-question {
          font-family: var(--font-space-grotesk), sans-serif;
          font-style: italic;
          font-size: clamp(1.05rem, 2vw, 1.3rem);
          color: rgba(255,255,255,0.6);
          margin: 0 0 1rem;
        }
        .pp-hook-title {
          font-family: var(--font-anton), sans-serif;
          font-size: clamp(2rem, 4vw, 3.2rem);
          font-weight: 400; line-height: 1.05;
          color: #fff; margin: 0 0 1.25rem;
        }
        .pp-hook-body {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: clamp(1rem, 1.6vw, 1.12rem);
          line-height: 1.75; color: rgba(255,255,255,0.82);
          margin: 0;
        }

        /* TWO-COLUMN GRID */
        .pp-grid-section { padding: clamp(3rem, 5vw, 5rem) clamp(1.25rem, 5vw, 3rem); }
        .pp-grid-inner {
          max-width: 1220px; margin: 0 auto;
          background: rgba(254,250,242,0.78);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          border: 1px solid rgba(255,255,255,0.5);
          border-radius: 20px;
          box-shadow: 0 6px 32px rgba(36,17,35,0.05), inset 0 1px 0 rgba(255,255,255,0.5);
          padding: clamp(2rem, 4vw, 3rem);
          display: grid; grid-template-columns: repeat(2, 1fr);
          gap: clamp(2rem, 5vw, 4rem);
        }
        @media (max-width: 820px) { .pp-grid-inner { grid-template-columns: 1fr; } }
        .pp-col {}
        .pp-eyebrow {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.72rem; font-weight: 700;
          letter-spacing: 0.22em; text-transform: uppercase;
          color: var(--accent);
          display: block; margin-bottom: 0.6rem;
        }
        .pp-eyebrow--light { color: #FFCC00; }
        .pp-col-title {
          font-family: var(--font-anton), sans-serif;
          font-size: clamp(1.9rem, 3.5vw, 2.6rem);
          font-weight: 400; line-height: 1.05;
          color: #241123; margin: 0 0 1.25rem;
        }
        .pp-timeline {
          list-style: none; padding: 0; margin: 0;
          display: flex; flex-direction: column;
        }
        .pp-timeline li {
          display: flex; gap: 1rem;
          padding: 0.85rem 0;
          border-bottom: 1px solid rgba(36,17,35,0.08);
        }
        .pp-timeline li:last-child { border-bottom: none; }
        .pp-timeline-num {
          font-family: var(--font-anton), sans-serif;
          font-size: 1.5rem; color: var(--accent);
          flex: 0 0 2.5rem; line-height: 1.1;
        }
        .pp-timeline li strong {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 1rem; font-weight: 700;
          color: #241123; display: block;
        }
        .pp-timeline li p {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.92rem; line-height: 1.55;
          color: rgba(36,17,35,0.65);
          margin: 0.2rem 0 0;
        }

        .pp-deadline {
          display: inline-flex; flex-direction: column;
          padding: 1rem 1.25rem; margin-top: 1.5rem;
          border-radius: 12px;
          background: color-mix(in srgb, var(--accent) 12%, transparent);
          border: 1px solid color-mix(in srgb, var(--accent) 40%, transparent);
        }
        .pp-deadline-label {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.62rem; font-weight: 700;
          letter-spacing: 0.22em; text-transform: uppercase;
          color: rgba(36,17,35,0.55);
        }
        .pp-deadline-value {
          font-family: var(--font-anton), sans-serif;
          font-size: 1.4rem; color: #241123;
          margin-top: 0.2rem;
        }

        .pp-comp-list {
          list-style: none; padding: 0; margin: 0;
          display: flex; flex-direction: column; gap: 0.85rem;
        }
        .pp-comp-list li {
          display: flex; flex-direction: column;
          padding: 1rem 1.25rem;
          background: #fff;
          border: 1px solid rgba(36,17,35,0.08);
          border-left: 3px solid var(--accent);
          border-radius: 0 10px 10px 0;
        }
        .pp-comp-head {
          font-family: var(--font-space-grotesk), sans-serif;
          font-weight: 800; color: var(--accent);
          font-size: 1.04rem;
        }
        .pp-comp-tail {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.92rem; line-height: 1.55;
          color: rgba(36,17,35,0.7);
          margin-top: 0.25rem;
        }

        /* WHO YOU ARE */
        .pp-who {
          background: #241123; color: #fff;
          padding: clamp(4rem, 7vw, 6rem) clamp(1.5rem, 5vw, 3rem);
        }
        .pp-who-inner { max-width: 920px; margin: 0 auto; }
        .pp-who-title {
          font-family: var(--font-anton), sans-serif;
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 400; line-height: 1.05;
          color: #fff; margin: 0 0 2rem;
        }
        .pp-who-list {
          list-style: none; padding: 0; margin: 0;
          display: grid; grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }
        @media (max-width: 720px) { .pp-who-list { grid-template-columns: 1fr; } }
        .pp-who-list li {
          display: flex; gap: 1rem;
          padding: 1rem 1.25rem;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
        }
        .pp-who-num {
          font-family: var(--font-anton), sans-serif;
          font-size: 1.4rem; color: #FFCC00;
          flex: 0 0 2.2rem; line-height: 1.1;
        }
        .pp-who-list strong {
          font-family: var(--font-space-grotesk), sans-serif;
          font-weight: 800; color: #fff;
          display: block; font-size: 1rem;
        }
        .pp-who-list p {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.9rem; line-height: 1.55;
          color: rgba(255,255,255,0.72);
          margin: 0.25rem 0 0;
        }

        /* REQUIREMENTS */
        .pp-reqs {
          padding: clamp(3rem, 5vw, 4rem) clamp(1.25rem, 5vw, 3rem);
        }
        .pp-reqs-inner {
          max-width: 820px; margin: 0 auto;
          background: rgba(254,250,242,0.78);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          border: 1px solid rgba(255,255,255,0.5);
          border-radius: 20px;
          box-shadow: 0 6px 32px rgba(36,17,35,0.05), inset 0 1px 0 rgba(255,255,255,0.5);
          padding: clamp(1.75rem, 4vw, 2.75rem);
        }
        .pp-reqs-list {
          list-style: none; padding: 0; margin: 0;
          display: flex; flex-direction: column; gap: 0.7rem;
        }
        .pp-reqs-list li {
          display: flex; align-items: flex-start; gap: 0.8rem;
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 1rem; line-height: 1.6;
          color: rgba(36,17,35,0.85);
        }
        .pp-reqs-dot {
          flex: 0 0 8px; width: 8px; height: 8px;
          border-radius: 50%; background: var(--accent);
          margin-top: 0.5rem;
        }

        /* FAQ */
        .pp-faq-section {
          background: rgba(36,17,35,0.04);
          padding: clamp(4rem, 6vw, 5rem) clamp(1.5rem, 5vw, 3rem);
        }
        .pp-faq-inner { max-width: 820px; margin: 0 auto; }
        .pp-faq { display: flex; flex-direction: column; gap: 0.5rem; }
        .pp-faq-item {
          background: #fff;
          border: 1px solid rgba(36,17,35,0.08);
          border-radius: 12px;
          padding: 0 1.25rem;
        }
        .pp-faq-item[open] { background: #fff; border-color: var(--accent); }
        .pp-faq-item summary {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 1rem; font-weight: 700;
          color: #241123; padding: 1rem 0;
          cursor: pointer; list-style: none;
          display: flex; justify-content: space-between;
          align-items: center; gap: 1rem;
        }
        .pp-faq-item summary::-webkit-details-marker { display: none; }
        .pp-faq-item summary::after {
          content: "+";
          font-family: var(--font-anton), sans-serif;
          font-size: 1.3rem; color: var(--accent);
          transition: transform 200ms ease;
        }
        .pp-faq-item[open] summary::after { transform: rotate(45deg); }
        .pp-faq-item p {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.94rem; line-height: 1.7;
          color: rgba(36,17,35,0.78);
          margin: 0 0 1rem;
        }

        /* CLOSING */
        .pp-closing {
          background: #FFCC00;
          padding: clamp(4rem, 7vw, 6rem) clamp(1.5rem, 5vw, 3rem);
          text-align: center;
        }
        .pp-closing-inner { max-width: 820px; margin: 0 auto; }
        .pp-closing-eyebrow {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.72rem; font-weight: 700;
          letter-spacing: 0.26em; text-transform: uppercase;
          color: rgba(36,17,35,0.7);
          display: block; margin-bottom: 0.85rem;
        }
        .pp-closing-title {
          font-family: var(--font-anton), sans-serif;
          font-size: clamp(2rem, 4.5vw, 3.2rem);
          font-weight: 400; line-height: 1.05;
          color: #241123; margin: 0 0 1rem;
        }
        .pp-closing-body {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: clamp(1rem, 1.6vw, 1.12rem);
          line-height: 1.7; color: rgba(36,17,35,0.78);
          margin: 0 0 2rem;
        }
        .pp-closing-actions { display: flex; flex-wrap: wrap; gap: 0.7rem; justify-content: center; }
        .pp-closing-meta {
          margin: 2rem 0 0;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.82rem;
        }
        .pp-closing-link {
          color: rgba(36,17,35,0.7); text-decoration: none;
          border-bottom: 1.5px solid rgba(36,17,35,0.3);
        }
        .pp-closing-link:hover { color: #241123; border-color: #241123; }
      `}</style>
    </main>
  );
}

