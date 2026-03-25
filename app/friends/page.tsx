// app/friends/page.tsx
"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  COUNTRY_COUNT,
  CLUB_COUNT,
  SEASON_COUNT,
  ALUMNI_COUNT_DISPLAY,
} from "@/lib/datStats";

/* ─── What friends do ─────────────────────────────────────────── */
const ways = [
  {
    tone: "green" as const,
    eyebrow: "Volunteer",
    title: "Give Your Time & Talent",
    body: "Help DAT run smoother, reach further, and do more. Whether you're a graphic designer, translator, event producer, or strategic thinker — there's a role waiting for you.",
    cta: "Explore Volunteer Roles",
    href: "/friends/volunteer",
  },
  {
    tone: "gold" as const,
    eyebrow: "Ambassador",
    title: "Carry the Story Home",
    body: "Introduce DAT to your community. Host conversations. Make connections that open doors. Be the bridge between DAT and the people who haven't found us yet.",
    cta: "Become an Ambassador",
    href: "/friends/ambassador",
  },
  {
    tone: "pink" as const,
    eyebrow: "Donate",
    title: "Fund the Work",
    body: "Every gift — from $5 to $5,000 — funds artists in the field, sustains drama clubs in underserved communities, and keeps the adventure alive. Give once or give monthly.",
    cta: "Make a Gift",
    href: "/donate",
  },
];

/* ─── Why friends matter ────────────────────────────────────── */
const reasons = [
  {
    title: "You carry the story.",
    body: "Artists make the work. Friends make sure the world hears about it. Every introduction, every share, every conversation you start multiplies DAT's reach.",
  },
  {
    title: "You keep the clubs alive.",
    body: `DAT's ${CLUB_COUNT} drama clubs serve communities with few resources and no end of need. Friends fund space, materials, and mentorship that keep young artists creating.`,
  },
  {
    title: "You make the next season possible.",
    body: `${ALUMNI_COUNT_DISPLAY} artists. ${COUNTRY_COUNT} countries. ${SEASON_COUNT} seasons of original work. None of it happens without a community of people who show up.`,
  },
];

/* ─── Page ─────────────────────────────────────────────────── */
export default function FriendsPage() {
  const router = useRouter();

  return (
    <main style={{ background: "transparent" }}>

      {/* ════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════ */}
      <section style={{
        position: "relative",
        height: "72vh",
        minHeight: 520,
        overflow: "hidden",
        display: "flex",
        alignItems: "flex-end",
      }}>
        <Image
          src="/images/teaching-amazon.jpg"
          alt="DAT teaching artists working with a community in the Amazon"
          fill
          priority
          style={{ objectFit: "cover", objectPosition: "center 45%" }}
        />
        {/* Gradient overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(36,17,35,0.18) 0%, rgba(36,17,35,0.0) 22%, rgba(36,17,35,0.5) 62%, rgba(36,17,35,0.94) 100%)",
          pointerEvents: "none",
        }} />
        {/* Headline content */}
        <div style={{ position: "relative", zIndex: 2, width: "90vw", maxWidth: 1100, margin: "0 auto 5vh", padding: "0 1.5rem" }}>
          <span className="fr-hero-eyebrow">Friends of DAT</span>
          <h1 className="fr-hero-title" style={{ fontFamily: '"Anton", sans-serif' }}>
            MOVED<br />TO ACT.
          </h1>
          <p className="fr-hero-sub" style={{ fontFamily: 'var(--font-space-grotesk), "Space Grotesk", system-ui, sans-serif' }}>
            You don't have to be a performer to change what theatre can do.<br />
            You just have to care — and show up.
          </p>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          INTRO — who friends are
      ════════════════════════════════════════════════ */}
      <section className="fr-intro-section">
        <div className="fr-intro-inner">
          <div className="fr-intro-text">
            <p className="fr-eyebrow fr-eyebrow--ink">Who Are Friends of DAT?</p>
            <p className="fr-intro-body">
              Friends of DAT are teachers and technologists, writers and world-travelers,
              parents and professionals who believe that story is one of the most powerful
              tools we have. They aren&apos;t always artists. They aren&apos;t always onstage.
              But they are always showing up — volunteering their skills, championing DAT
              in their communities, giving when they can, and spreading the word when they can&apos;t.
            </p>
            <p className="fr-intro-body">
              If you&apos;ve ever watched a performance and thought{" "}
              <em>someone needs to know about this</em> — or felt the pull to be part
              of something that actually matters — this is your door.
            </p>
          </div>
          <div className="fr-intro-aside">
            <blockquote className="fr-blockquote">
              <p className="fr-blockquote-text">
                &ldquo;Every gift — of time, funds, or passion — helps spark
                transformation, one story at a time.&rdquo;
              </p>
              <cite className="fr-blockquote-cite">— Dramatic Adventure Theatre</cite>
            </blockquote>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          THREE WAYS IN
      ════════════════════════════════════════════════ */}
      <section className="fr-ways-section">
        <div className="fr-ways-inner">
          <p className="fr-eyebrow fr-eyebrow--ink fr-eyebrow--center">Get Involved</p>
          <h2 className="fr-ways-title">Find Your Way In.</h2>
          <div className="fr-ways-grid">
            {ways.map((w) => (
              <div key={w.eyebrow} className={`fr-way-card fr-way-card--${w.tone}`}>
                <p className="fr-way-label">{w.eyebrow}</p>
                <h3 className="fr-way-h3">{w.title}</h3>
                <p className="fr-way-body">{w.body}</p>
                <button
                  className={`fr-way-btn fr-way-btn--${w.tone}`}
                  onClick={() => router.push(w.href)}
                >
                  {w.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          STATS BAND
      ════════════════════════════════════════════════ */}
      <section className="fr-stats-band" style={{ background: "#241123" }}>
        <div className="fr-stats-inner">
          <div className="fr-stat">
            <span className="fr-stat-num">{SEASON_COUNT}</span>
            <span className="fr-stat-lbl">Seasons</span>
          </div>
          <div className="fr-stat-sep" aria-hidden="true" />
          <div className="fr-stat">
            <span className="fr-stat-num">{COUNTRY_COUNT}</span>
            <span className="fr-stat-lbl">Countries</span>
          </div>
          <div className="fr-stat-sep" aria-hidden="true" />
          <div className="fr-stat">
            <span className="fr-stat-num">{CLUB_COUNT}</span>
            <span className="fr-stat-lbl">Drama Clubs</span>
          </div>
          <div className="fr-stat-sep" aria-hidden="true" />
          <div className="fr-stat">
            <span className="fr-stat-num">{ALUMNI_COUNT_DISPLAY}</span>
            <span className="fr-stat-lbl">Artists</span>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          WHY IT MATTERS
      ════════════════════════════════════════════════ */}
      <section className="fr-why-section" style={{ background: "#1a0d1a" }}>
        <div className="fr-why-inner">
          <p className="fr-eyebrow" style={{ color: "rgba(255,204,0,0.6)" }}>Why Friends Matter</p>
          <h2 className="fr-why-headline">
            The most persistent challenges facing communities aren&apos;t solved with money alone.
          </h2>
          <p className="fr-why-body">
            They&apos;re addressed when people find the language to name them, the courage to
            speak them, and the community to hear them. That&apos;s what theatre does.
            That&apos;s what DAT does. And that&apos;s what Friends of DAT make possible.
          </p>
          <div className="fr-why-grid">
            {reasons.map((r) => (
              <div key={r.title} className="fr-why-card">
                <h3 className="fr-why-card-title">{r.title}</h3>
                <p className="fr-why-card-body">{r.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          FINAL CTA
      ════════════════════════════════════════════════ */}
      <section className="fr-cta-band" style={{ background: "#D9A919" }}>
        <div className="fr-cta-inner">
          <h2 className="fr-cta-headline">Ready to Act?</h2>
          <p className="fr-cta-sub">
            Pick your path and take a step. We&apos;ll meet you there.
          </p>
          <div className="fr-cta-buttons">
            <button className="fr-cta-btn fr-cta-btn--dark" onClick={() => router.push("/friends/volunteer")}>
              Volunteer with DAT
            </button>
            <button className="fr-cta-btn fr-cta-btn--dark" onClick={() => router.push("/friends/ambassador")}>
              Become an Ambassador
            </button>
            <button className="fr-cta-btn fr-cta-btn--outline" onClick={() => router.push("/donate")}>
              Donate
            </button>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          STYLES
      ════════════════════════════════════════════════ */}
      <style>{`

@font-face {
  font-family: "Anton";
  src: url("/fonts/anton-v27-latin_latin-ext_vietnamese-regular.woff2") format("woff2");
  font-display: swap;
}

main a, main a:visited, main a:hover, main a:focus, main a:active {
  text-decoration: none !important;
}

/* ── Eyebrow ──────────────────────────────── */
.fr-eyebrow {
  font-family: var(--font-space-grotesk), "Space Grotesk", sans-serif;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.28em;
  color: #FFCC00;
  margin: 0 0 0.6rem;
  display: block;
}
.fr-eyebrow--ink  { color: rgba(36,17,35,0.72) !important; }
.fr-eyebrow--center { text-align: center; }

/* ── Hero ─────────────────────────────────── */
.fr-hero-eyebrow {
  display: block;
  font-family: var(--font-dm-sans), "DM Sans", system-ui, sans-serif;
  font-weight: 900;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.38em;
  color: rgba(246,228,193,0.68);
  margin-bottom: 0.65rem;
}
.fr-hero-title {
  font-size: clamp(3.5rem, 10vw, 8rem);
  line-height: 0.95;
  text-transform: uppercase;
  color: #D9A919;
  opacity: 0.93;
  margin: 0 0 0.8rem;
  text-shadow: 0 4px 32px rgba(0,0,0,0.4);
}
.fr-hero-sub {
  font-weight: 500;
  font-size: clamp(0.95rem, 2vw, 1.3rem);
  color: rgba(246,228,193,0.88);
  margin: 0;
  line-height: 1.5;
}
@media (max-width: 540px) {
  .fr-hero-title { font-size: clamp(3rem, 14vw, 5rem); }
  .fr-hero-sub br { display: none; }
}

/* ── Intro ────────────────────────────────── */
.fr-intro-section {
  background: transparent;
  padding: 3.5rem 2rem 3rem;
}
.fr-intro-inner {
  max-width: 1100px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 4rem;
  align-items: start;
}
@media (max-width: 900px) {
  .fr-intro-inner { grid-template-columns: 1fr; gap: 2rem; }
}
.fr-intro-body {
  font-family: var(--font-dm-sans), "DM Sans", system-ui, sans-serif;
  font-size: 1.06rem;
  line-height: 1.72;
  color: rgba(36,17,35,0.82);
  margin: 0 0 1.1rem;
}
.fr-intro-body:last-child { margin-bottom: 0; }
.fr-intro-body em { font-style: italic; color: #241123; }

.fr-blockquote {
  margin: 0;
  padding: 1.75rem 2rem;
  background: rgba(36,17,35,0.06);
  border-left: 4px solid #D9A919;
  border-radius: 0 12px 12px 0;
}
.fr-blockquote-text {
  font-family: var(--font-space-grotesk), "Space Grotesk", system-ui, sans-serif;
  font-size: 1.15rem;
  font-weight: 600;
  line-height: 1.55;
  color: #241123;
  margin: 0 0 0.85rem;
  font-style: italic;
}
.fr-blockquote-cite {
  font-family: var(--font-dm-sans), "DM Sans", system-ui, sans-serif;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(36,17,35,0.48);
  font-style: normal;
}

/* ── Three Ways ───────────────────────────── */
.fr-ways-section {
  background: transparent;
  padding: 0.5rem 2rem 4rem;
}
.fr-ways-inner { max-width: 1100px; margin: 0 auto; }
.fr-ways-title {
  font-family: var(--font-space-grotesk), "Space Grotesk", system-ui, sans-serif !important;
  font-weight: 800;
  font-size: clamp(2rem, 4vw, 3rem);
  color: #241123;
  margin: 0.4rem 0 2rem;
  text-align: center;
  line-height: 1.1;
}
.fr-ways-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}
@media (max-width: 860px) {
  .fr-ways-grid { grid-template-columns: 1fr; gap: 1.25rem; }
  .fr-ways-title { text-align: left; }
  .fr-eyebrow--center { text-align: left; }
}

.fr-way-card {
  display: flex;
  flex-direction: column;
  padding: 1.75rem 1.75rem 1.6rem;
  border-radius: 16px;
  background: rgba(255,255,255,0.55);
  border-top: 5px solid transparent;
  box-shadow: 0 3px 12px rgba(36,17,35,0.08), 0 8px 28px rgba(36,17,35,0.08);
  transition: transform 0.22s ease, box-shadow 0.22s ease;
}
.fr-way-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 20px rgba(36,17,35,0.12), 0 16px 44px rgba(36,17,35,0.14);
}
.fr-way-card--green { border-top-color: #2FA873; }
.fr-way-card--gold  { border-top-color: #D9A919; }
.fr-way-card--pink  { border-top-color: #F23359; }

.fr-way-label {
  font-family: var(--font-dm-sans), "DM Sans", system-ui, sans-serif;
  font-weight: 900;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.26em;
  margin: 0 0 0.55rem;
}
.fr-way-card--green .fr-way-label { color: #1d8558; }
.fr-way-card--gold  .fr-way-label { color: #9e7900; }
.fr-way-card--pink  .fr-way-label { color: #c4163d; }

.fr-way-h3 {
  font-family: var(--font-space-grotesk), "Space Grotesk", system-ui, sans-serif !important;
  font-weight: 800;
  font-size: clamp(1.4rem, 2.2vw, 1.75rem);
  color: #241123;
  margin: 0 0 0.7rem;
  line-height: 1.15;
}
.fr-way-body {
  font-family: var(--font-dm-sans), "DM Sans", system-ui, sans-serif;
  font-size: 0.96rem;
  line-height: 1.65;
  color: rgba(36,17,35,0.72);
  margin: 0 0 1.6rem;
  flex: 1;
}
.fr-way-btn {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  padding: 0.82rem 1.65rem;
  border: none;
  border-radius: 10px;
  font-family: var(--font-space-grotesk), "Space Grotesk", system-ui, sans-serif;
  font-weight: 700;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.22em;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
  box-shadow: 0 4px 14px rgba(0,0,0,0.14);
}
.fr-way-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 22px rgba(0,0,0,0.2); }
.fr-way-btn--green { background: #2FA873; color: #fff; }
.fr-way-btn--gold  { background: #D9A919; color: #241123; }
.fr-way-btn--pink  { background: #F23359; color: #fff; }
.fr-way-btn--green:hover { background: #23946038; background: #259e62; }
.fr-way-btn--gold:hover  { background: #c09610; }
.fr-way-btn--pink:hover  { background: #d42248; }

/* ── Stats ────────────────────────────────── */
.fr-stats-band { padding: 2.25rem 2rem; }
.fr-stats-inner {
  max-width: 1100px; margin: 0 auto;
  display: flex; align-items: center;
  justify-content: center; flex-wrap: wrap;
}
.fr-stat {
  display: flex; flex-direction: column; align-items: center;
  padding: 0.75rem 3rem; flex: 1 1 130px;
}
.fr-stat-num {
  font-family: "Anton", sans-serif;
  font-size: clamp(2.8rem, 5vw, 4.5rem);
  color: #FFCC00; line-height: 1; letter-spacing: 0.02em;
}
.fr-stat-lbl {
  font-family: var(--font-space-grotesk), "Space Grotesk", sans-serif;
  font-size: 0.78rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.2em;
  color: rgba(246,228,193,0.62); margin-top: 0.45rem;
}
.fr-stat-sep {
  width: 1px; height: 2.5rem;
  background: rgba(255,255,255,0.14);
  flex: 0 0 auto; align-self: center;
}
@media (max-width: 600px) {
  .fr-stat-sep { display: none; }
  .fr-stat { padding: 0.6rem 1.25rem; flex: 1 1 90px; }
}

/* ── Why it matters ───────────────────────── */
.fr-why-section { padding: 4rem 2rem 4.5rem; }
.fr-why-inner { max-width: 1100px; margin: 0 auto; }
.fr-why-headline {
  font-family: var(--font-space-grotesk), "Space Grotesk", system-ui, sans-serif !important;
  font-weight: 800;
  font-size: clamp(1.5rem, 3.2vw, 2.4rem);
  color: rgba(246,228,193,0.95);
  line-height: 1.25;
  margin: 0.5rem 0 1rem;
  max-width: 780px;
}
.fr-why-body {
  font-family: var(--font-dm-sans), "DM Sans", system-ui, sans-serif;
  font-size: 1.05rem;
  line-height: 1.7;
  color: rgba(246,228,193,0.68);
  max-width: 660px;
  margin: 0 0 3rem;
}
.fr-why-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}
@media (max-width: 800px) { .fr-why-grid { grid-template-columns: 1fr; gap: 1.25rem; } }
.fr-why-card {
  padding: 1.5rem 1.6rem;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-top: 3px solid rgba(217,169,25,0.5);
  border-radius: 12px;
}
.fr-why-card-title {
  font-family: var(--font-space-grotesk), "Space Grotesk", system-ui, sans-serif !important;
  font-weight: 700;
  font-size: 1.05rem;
  color: #FFCC00;
  margin: 0 0 0.6rem;
  line-height: 1.2;
}
.fr-why-card-body {
  font-family: var(--font-dm-sans), "DM Sans", system-ui, sans-serif;
  font-size: 0.92rem;
  line-height: 1.65;
  color: rgba(246,228,193,0.72);
  margin: 0;
}

/* ── Final CTA ────────────────────────────── */
.fr-cta-band { padding: 3.5rem 2rem; }
.fr-cta-inner {
  max-width: 820px; margin: 0 auto; text-align: center;
}
.fr-cta-headline {
  font-family: "Anton", sans-serif;
  font-size: clamp(2.5rem, 6vw, 4rem);
  color: #241123;
  margin: 0 0 0.6rem;
  line-height: 1;
  text-transform: uppercase;
}
.fr-cta-sub {
  font-family: var(--font-space-grotesk), "Space Grotesk", system-ui, sans-serif;
  font-size: 1.1rem;
  font-weight: 500;
  color: rgba(36,17,35,0.7);
  margin: 0 0 2rem;
  line-height: 1.5;
}
.fr-cta-buttons {
  display: flex; flex-wrap: wrap;
  gap: 0.85rem; justify-content: center;
}
.fr-cta-btn {
  display: inline-flex; align-items: center;
  padding: 0.9rem 1.85rem;
  border-radius: 12px;
  font-family: var(--font-space-grotesk), "Space Grotesk", system-ui, sans-serif;
  font-weight: 700; font-size: 0.84rem;
  text-transform: uppercase; letter-spacing: 0.2em;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}
.fr-cta-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 22px rgba(0,0,0,0.2); }
.fr-cta-btn--dark {
  background: #241123; color: #fff; border: none;
  box-shadow: 0 4px 14px rgba(36,17,35,0.25);
}
.fr-cta-btn--dark:hover { background: #3a0055; }
.fr-cta-btn--outline {
  background: transparent;
  color: #241123;
  border: 2px solid rgba(36,17,35,0.5);
}
.fr-cta-btn--outline:hover { background: rgba(36,17,35,0.08); }

      `}</style>
    </main>
  );
}
