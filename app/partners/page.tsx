// app/partners/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useEffect } from "react";

/* ─── Brand tokens ─────────────────────────────────────── */
const T = {
  purple: "#6C00AF",
  deepPurple: "#241123",
  pink: "#F23359",
  teal: "#2493A9",
  yellow: "#FFCC00",
  yellowFlat: "#D9A919",
  green: "#2FA873",
};

/* ─── Partnership pathways ──────────────────────────────── */
const pathways = [
  {
    tone: "purple" as const,
    eyebrow: "Study Abroad & Academic Programs",
    title: "University Partnerships",
    desc: "Build a credit-bearing study abroad that lets students devise, teach, produce, and perform theatre addressing real-world issues — in collaboration with communities around the globe. We design the arc together: immersive, rigorous, unforgettable.",
    href: "/partners/universities",
    cta: "Build an Academic Partnership",
    image: "/images/rehearsing-nitra.jpg",
    accent: T.purple,
    accentLight: "rgba(108,0,175,0.14)",
    border: "rgba(108,0,175,0.35)",
    pill: "rgba(108,0,175,1)",
    pillText: "#f2f2f2",
  },
  {
    tone: "teal" as const,
    eyebrow: "CSR · Team Building · Youth Impact",
    title: "Corporate Giving",
    desc: "Launch a CSR initiative, sponsor an 'Adventure Day' of cross-cultural creativity and youth mentorship, or align your company's purpose with theatre-making that sparks transformation in underserved communities worldwide.",
    href: "/partners/corporate-giving",
    cta: "Explore Corporate Partnerships",
    image: "/images/teaching-amazon.jpg",
    accent: T.teal,
    accentLight: "rgba(36,147,169,0.14)",
    border: "rgba(36,147,169,0.35)",
    pill: "rgba(36,147,169,1)",
    pillText: "#f2f2f2",
  },
  {
    tone: "yellow" as const,
    eyebrow: "Your Vision · Your Terms",
    title: "Propose a Project",
    desc: "Have a bold idea that doesn't fit a box? Good — neither do we. Whether you're a foundation, a municipality, a cultural organization, or a visionary individual, let's co-design something extraordinary.",
    href: "/partners/propose-project",
    cta: "Start the Conversation",
    image: "/images/Andean_Mask_Work.jpg",
    accent: T.yellowFlat,
    accentLight: "rgba(217,169,25,0.14)",
    border: "rgba(217,169,25,0.4)",
    pill: "rgba(217,169,25,1)",
    pillText: T.deepPurple,
  },
];

/* ─── Stats ─────────────────────────────────────────────── */
const partnerStats = [
  { value: "15+", label: "University Partners" },
  { value: "9", label: "Countries" },
  { value: "350+", label: "Traveling Artists" },
  { value: "3,000+", label: "Youth Reached" },
];

/* ─── Partner logos (existing DAT community partners) ───── */
const featuredPartners = [
  { name: "Amakhosi", src: "/images/partners/amakhosi.jpg" },
  { name: "CEDENMA", src: "/images/partners/cedenma.jpg" },
  { name: "Forgotten Voices", src: "/images/partners/forgotten-voices.png" },
];

/* ─── Why DAT pillars ───────────────────────────────────── */
const pillars = [
  {
    icon: "🎭",
    title: "Process-Driven",
    body: "We don't import theatre. We make it together — in the community, with the community, for the community.",
  },
  {
    icon: "🌍",
    title: "Globally Rooted",
    body: "Our network spans 9 countries. Every partnership plugs into a living ecosystem of artists, educators, and community leaders.",
  },
  {
    icon: "⚡",
    title: "Mission-Aligned",
    body: "Climate justice. Indigenous rights. Youth empowerment. We work where theatre is most needed — and most powerful.",
  },
  {
    icon: "🔁",
    title: "Long-Term Impact",
    body: "Relationships, not transactions. Our Drama Clubs, alumni networks, and residencies create ripples that last for decades.",
  },
];

export default function PartnersPage() {
  const heroRef = useRef<HTMLDivElement>(null);

  // Subtle parallax on hero
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const handle = () => {
      const y = window.scrollY;
      el.style.transform = `translateY(${y * 0.28}px)`;
    };
    window.addEventListener("scroll", handle, { passive: true });
    return () => window.removeEventListener("scroll", handle);
  }, []);

  return (
    <main style={{ background: "transparent", overflowX: "hidden" }}>

      {/* ══════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════ */}
      <section className="p-hero" aria-label="Partners hero">
        <div className="p-hero__img-wrap" ref={heroRef}>
          <Image
            src="/images/performing-zanzibar.jpg"
            alt="DAT artists performing in Zanzibar"
            fill
            priority
            sizes="100vw"
            style={{ objectFit: "cover", objectPosition: "center 30%" }}
          />
        </div>

        {/* Gradient overlay */}
        <div className="p-hero__overlay" aria-hidden="true" />

        {/* Text stack */}
        <div className="p-hero__stack">
          <span className="p-hero__eyebrow">Dramatic Adventure Theatre</span>
          <h1 className="p-hero__title">
            MAKE SOMETHING<br />UNFORGETTABLE.
          </h1>
          <p className="p-hero__subtitle">
            Partner with DAT and bring bold, cross-cultural theatre-making to your campus, company, or community.
          </p>
          <div className="p-hero__ctas">
            <Link href="/partners/propose-project" className="p-btn p-btn--yellow">
              Start the Conversation
            </Link>
            <Link href="#pathways" className="p-btn p-btn--ghost">
              Explore Partnerships
            </Link>
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════════════════
          STAT BAND
      ══════════════════════════════════════════════════════ */}
      <section className="p-stats" aria-label="DAT Impact at a glance">
        <div className="p-stats__inner">
          {partnerStats.map((s) => (
            <div key={s.label} className="p-stats__box">
              <span className="p-stats__value">{s.value}</span>
              <span className="p-stats__label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>


      {/* ══════════════════════════════════════════════════════
          PATHWAY CARDS
      ══════════════════════════════════════════════════════ */}
      <section id="pathways" className="p-pathways" aria-labelledby="pathways-heading">
        <div className="p-pathways__inner">
          <div className="p-pathways__head">
            <span className="p-band-label">PARTNERSHIP PATHWAYS</span>
            <h2 id="pathways-heading" className="p-section-title">
              Choose Your Adventure.
            </h2>
            <p className="p-section-sub">
              Whether you're building a semester abroad, launching a CSR initiative, or dreaming something entirely new — we're ready to co-create it.
            </p>
          </div>

          <div className="p-cards">
            {pathways.map((pw) => (
              <article
                key={pw.title}
                className="p-card"
                style={{ ["--card-accent" as any]: pw.accent, ["--card-border" as any]: pw.border, ["--card-light" as any]: pw.accentLight }}
              >
                {/* Image panel */}
                <div className="p-card__img-wrap">
                  <Image
                    src={pw.image}
                    alt={pw.title}
                    fill
                    sizes="(min-width: 1024px) 33vw, 90vw"
                    style={{ objectFit: "cover", objectPosition: "center" }}
                  />
                  <div className="p-card__img-overlay" aria-hidden="true" />
                </div>

                {/* Content */}
                <div className="p-card__body">
                  <span
                    className="p-card__pill"
                    style={{ background: pw.pill, color: pw.pillText }}
                  >
                    {pw.eyebrow}
                  </span>
                  <h3 className="p-card__title">{pw.title}</h3>
                  <p className="p-card__desc">{pw.desc}</p>
                  <Link href={pw.href} className="p-card__cta">
                    {pw.cta} →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════════════════
          WHY DAT — FOUR PILLARS
      ══════════════════════════════════════════════════════ */}
      <section className="p-why" aria-labelledby="why-heading">
        <div className="p-why__inner">
          <div className="p-why__head">
            <span className="p-band-label p-band-label--dark">WHY DAT</span>
            <h2 id="why-heading" className="p-section-title p-section-title--dark">
              Theatre that changes everything.
            </h2>
            <p className="p-section-sub p-section-sub--dark">
              A DAT partnership isn't just programming — it's an invitation into a way of making art that reshapes how people see themselves and each other.
            </p>
          </div>

          <div className="p-pillars">
            {pillars.map((p) => (
              <div key={p.title} className="p-pillar">
                <span className="p-pillar__icon" aria-hidden="true">{p.icon}</span>
                <h3 className="p-pillar__title">{p.title}</h3>
                <p className="p-pillar__body">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════════════════
          FEATURED COMMUNITY PARTNERS
      ══════════════════════════════════════════════════════ */}
      <section className="p-partners" aria-labelledby="community-partners-heading">
        <div className="p-partners__inner">
          <span className="p-band-label">OUR COMMUNITY</span>
          <h2 id="community-partners-heading" className="p-section-title">
            Built on real relationships.
          </h2>
          <p className="p-section-sub" style={{ maxWidth: 640 }}>
            DAT's partnerships are rooted in communities — not transactions. Here are a few of the organizations we've built long-term creative relationships with.
          </p>

          <div className="p-partner-logos">
            {featuredPartners.map((logo) => (
              <div key={logo.name} className="p-partner-logo">
                <div className="p-partner-logo__img-wrap">
                  <Image
                    src={logo.src}
                    alt={logo.name}
                    fill
                    sizes="160px"
                    style={{ objectFit: "contain" }}
                  />
                </div>
                <span className="p-partner-logo__name">{logo.name}</span>
              </div>
            ))}
            {/* Placeholder slots */}
            {["University Partner", "Foundation Partner", "Corporate Partner"].map((label) => (
              <div key={label} className="p-partner-logo p-partner-logo--placeholder">
                <div className="p-partner-logo__placeholder-box">
                  <span style={{ opacity: 0.35, fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    {label}
                  </span>
                </div>
                <span className="p-partner-logo__name" style={{ opacity: 0.4 }}>Coming Soon</span>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════════════════
          QUOTE / TESTIMONIAL BAND
      ══════════════════════════════════════════════════════ */}
      <section className="p-quote" aria-label="Partner testimonial">
        <div className="p-quote__inner">
          <div className="p-quote__mark" aria-hidden="true">"</div>
          <blockquote className="p-quote__text">
            DAT doesn't bring a show — they bring a method. Students didn't just learn about global theatre; they lived it, with artists who challenged them to find the story in every room they entered.
          </blockquote>
          <cite className="p-quote__cite">
            — Faculty Partner, Study Abroad Program
          </cite>
        </div>
      </section>


      {/* ══════════════════════════════════════════════════════
          FINAL CTA BAND
      ══════════════════════════════════════════════════════ */}
      <section className="p-cta-band" aria-labelledby="cta-band-heading">
        <div className="p-cta-band__inner">
          <div className="p-cta-band__image-wrap">
            <Image
              src="/images/teaching-andes.jpg"
              alt="DAT artist leading workshop in the Andes"
              fill
              sizes="50vw"
              style={{ objectFit: "cover", objectPosition: "center" }}
            />
            <div className="p-cta-band__img-overlay" aria-hidden="true" />
          </div>
          <div className="p-cta-band__content">
            <span className="p-band-label p-band-label--light">READY TO PARTNER?</span>
            <h2 id="cta-band-heading" className="p-cta-band__title">
              Bring your bold ideas.<br />Let's create something unforgettable.
            </h2>
            <p className="p-cta-band__sub">
              Every great partnership starts with a conversation. Tell us who you are, what you're imagining, and where your community is. We'll take it from there.
            </p>
            <div className="p-cta-band__actions">
              <Link href="/partners/propose-project" className="p-btn p-btn--pink">
                Propose a Partnership
              </Link>
              <Link href="/partners/universities" className="p-btn p-btn--outline-light">
                University Programs
              </Link>
              <Link href="/partners/corporate-giving" className="p-btn p-btn--outline-light">
                Corporate Giving
              </Link>
            </div>
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════════════════
          STYLES
      ══════════════════════════════════════════════════════ */}
      <style jsx>{`
        /* ── Tokens ─────────────────────────────────────── */
        :root {
          --p-purple: #6c00af;
          --p-deep: #241123;
          --p-pink: #f23359;
          --p-teal: #2493a9;
          --p-yellow: #ffcc00;
          --p-yellowFlat: #d9a919;
          --p-green: #2fa873;
        }

        /* ── HERO ────────────────────────────────────────── */
        .p-hero {
          position: relative;
          height: 88vh;
          min-height: 560px;
          overflow: hidden;
          display: flex;
          align-items: flex-end;
        }
        .p-hero__img-wrap {
          position: absolute;
          inset: -15% 0;
          will-change: transform;
        }
        .p-hero__overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(36, 17, 35, 0.18) 0%,
            rgba(36, 17, 35, 0.55) 55%,
            rgba(36, 17, 35, 0.85) 100%
          );
        }
        .p-hero__stack {
          position: relative;
          z-index: 2;
          width: 90vw;
          max-width: 1100px;
          margin: 0 auto 6vh;
          padding: 0 1rem;
        }
        .p-hero__eyebrow {
          display: block;
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--p-yellow);
          margin-bottom: 0.75rem;
          opacity: 0.85;
        }
        .p-hero__title {
          margin: 0;
          font-family: var(--font-anton), system-ui, sans-serif;
          font-size: clamp(3.2rem, 9vw, 7.5rem);
          line-height: 0.96;
          text-transform: uppercase;
          color: #f2f2f2;
          text-shadow: 0 6px 32px rgba(0,0,0,0.55);
        }
        .p-hero__subtitle {
          margin: 1.25rem 0 0;
          font-family: var(--font-space-grotesk), system-ui, sans-serif;
          font-size: clamp(1rem, 2vw, 1.4rem);
          font-weight: 500;
          color: rgba(242, 242, 242, 0.88);
          max-width: 600px;
          line-height: 1.5;
        }
        .p-hero__ctas {
          display: flex;
          flex-wrap: wrap;
          gap: 0.85rem;
          margin-top: 2rem;
        }

        /* ── BUTTONS ─────────────────────────────────────── */
        .p-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.9rem 1.8rem;
          border-radius: 14px;
          font-family: var(--font-space-grotesk), system-ui, sans-serif;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          text-decoration: none;
          cursor: pointer;
          border: 2px solid transparent;
          transition: transform 150ms ease, opacity 150ms ease, background-color 150ms ease, border-color 150ms ease;
        }
        .p-btn:hover { transform: translateY(-2px); opacity: 0.92; }
        .p-btn--yellow {
          background: var(--p-yellow);
          color: var(--p-deep);
        }
        .p-btn--yellow:hover { background: #e6b800; }
        .p-btn--ghost {
          background: rgba(242,242,242,0.12);
          color: #f2f2f2;
          border-color: rgba(242,242,242,0.4);
          backdrop-filter: blur(6px);
        }
        .p-btn--ghost:hover { background: rgba(242,242,242,0.2); }
        .p-btn--pink {
          background: var(--p-pink);
          color: #f2f2f2;
        }
        .p-btn--pink:hover { background: #d52a4c; }
        .p-btn--teal {
          background: var(--p-teal);
          color: #f2f2f2;
        }
        .p-btn--teal:hover { background: #1e7e93; }
        .p-btn--outline-light {
          background: transparent;
          color: #f2f2f2;
          border-color: rgba(242,242,242,0.45);
        }
        .p-btn--outline-light:hover { background: rgba(242,242,242,0.1); }

        /* ── STAT BAND ───────────────────────────────────── */
        .p-stats {
          background: var(--p-deep);
          padding: 2.25rem 2rem;
        }
        .p-stats__inner {
          max-width: 1100px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
          text-align: center;
        }
        @media (max-width: 640px) {
          .p-stats__inner { grid-template-columns: repeat(2, 1fr); }
        }
        .p-stats__box { display: flex; flex-direction: column; gap: 0.3rem; }
        .p-stats__value {
          font-family: var(--font-space-grotesk), system-ui, sans-serif;
          font-size: clamp(2rem, 5vw, 3.2rem);
          font-weight: 700;
          color: var(--p-yellow);
          line-height: 1;
        }
        .p-stats__label {
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: clamp(0.78rem, 1.4vw, 0.95rem);
          color: rgba(242,242,242,0.75);
          font-weight: 500;
        }

        /* ── SHARED LABELS ───────────────────────────────── */
        .p-band-label {
          display: inline-block;
          font-family: var(--font-space-grotesk), system-ui, sans-serif;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--p-yellowFlat);
          margin-bottom: 0.6rem;
          opacity: 0.9;
        }
        .p-band-label--dark { color: var(--p-purple); }
        .p-band-label--light { color: var(--p-yellow); }

        .p-section-title {
          margin: 0 0 0.6rem;
          font-family: var(--font-space-grotesk), system-ui, sans-serif;
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 800;
          color: var(--p-yellowFlat);
          opacity: 0.95;
          line-height: 1.15;
        }
        .p-section-title--dark { color: var(--p-deep); opacity: 1; }

        .p-section-sub {
          margin: 0;
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: clamp(0.95rem, 1.6vw, 1.1rem);
          color: rgba(242,242,242,0.8);
          line-height: 1.65;
        }
        .p-section-sub--dark { color: rgba(36,17,35,0.75); }

        /* ── PATHWAY CARDS ───────────────────────────────── */
        .p-pathways {
          padding: 4rem 2rem;
          background: rgba(36, 17, 35, 0.1);
        }
        .p-pathways__inner { max-width: 1200px; margin: 0 auto; }
        .p-pathways__head {
          margin-bottom: 2.5rem;
          max-width: 680px;
        }
        .p-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }
        @media (max-width: 900px) {
          .p-cards { grid-template-columns: 1fr; }
        }

        .p-card {
          display: flex;
          flex-direction: column;
          border-radius: 18px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.22);
          border: 1px solid var(--card-border);
          box-shadow: 0 8px 32px rgba(0,0,0,0.16);
          transition: transform 220ms ease, box-shadow 220ms ease;
        }
        .p-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 18px 50px rgba(0,0,0,0.25);
        }

        .p-card__img-wrap {
          position: relative;
          height: 240px;
          overflow: hidden;
          flex-shrink: 0;
        }
        .p-card__img-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            transparent 40%,
            rgba(36,17,35,0.72) 100%
          );
        }

        .p-card__body {
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
          padding: 1.4rem 1.5rem 1.6rem;
          flex: 1;
        }
        .p-card__pill {
          display: inline-block;
          align-self: flex-start;
          padding: 0.25rem 0.75rem;
          border-radius: 8px;
          font-family: var(--font-space-grotesk), system-ui, sans-serif;
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }
        .p-card__title {
          margin: 0;
          font-family: var(--font-space-grotesk), system-ui, sans-serif;
          font-size: clamp(1.3rem, 2.2vw, 1.7rem);
          font-weight: 800;
          color: var(--card-accent);
          line-height: 1.15;
        }
        .p-card__desc {
          margin: 0;
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 0.92rem;
          line-height: 1.65;
          color: var(--p-deep);
          flex: 1;
        }
        .p-card__cta {
          display: inline-flex;
          align-self: flex-start;
          margin-top: 0.5rem;
          padding: 0.7rem 1.2rem;
          border-radius: 12px;
          background: var(--card-light);
          border: 1.5px solid var(--card-border);
          font-family: var(--font-space-grotesk), system-ui, sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--card-accent);
          text-decoration: none;
          transition: background 140ms ease, transform 140ms ease;
        }
        .p-card__cta:hover {
          background: var(--card-accent);
          color: #f2f2f2;
          transform: translateX(2px);
        }

        /* ── WHY DAT ─────────────────────────────────────── */
        .p-why {
          padding: 4rem 2rem;
          background: #f6e4c1; /* kraft */
        }
        .p-why__inner { max-width: 1100px; margin: 0 auto; }
        .p-why__head {
          margin-bottom: 2.5rem;
          max-width: 640px;
        }
        .p-pillars {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
        }
        @media (max-width: 900px) {
          .p-pillars { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 540px) {
          .p-pillars { grid-template-columns: 1fr; }
        }
        .p-pillar {
          background: rgba(36, 17, 35, 0.05);
          border: 1px solid rgba(36,17,35,0.1);
          border-radius: 16px;
          padding: 1.5rem 1.25rem 1.4rem;
          transition: transform 180ms ease, box-shadow 180ms ease;
        }
        .p-pillar:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 28px rgba(36,17,35,0.1);
        }
        .p-pillar__icon {
          display: block;
          font-size: 2rem;
          margin-bottom: 0.75rem;
        }
        .p-pillar__title {
          margin: 0 0 0.5rem;
          font-family: var(--font-space-grotesk), system-ui, sans-serif;
          font-size: 1.05rem;
          font-weight: 800;
          color: var(--p-purple);
        }
        .p-pillar__body {
          margin: 0;
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 0.88rem;
          line-height: 1.65;
          color: rgba(36,17,35,0.8);
        }

        /* ── COMMUNITY PARTNERS ──────────────────────────── */
        .p-partners {
          padding: 4rem 2rem;
          background: rgba(36,17,35,0.06);
        }
        .p-partners__inner {
          max-width: 1100px;
          margin: 0 auto;
        }
        .p-partner-logos {
          display: flex;
          flex-wrap: wrap;
          gap: 1.5rem;
          margin-top: 2rem;
          align-items: center;
        }
        .p-partner-logo {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }
        .p-partner-logo__img-wrap {
          position: relative;
          width: 140px;
          height: 90px;
          border-radius: 12px;
          overflow: hidden;
          background: rgba(255,255,255,0.6);
          border: 1px solid rgba(36,17,35,0.1);
        }
        .p-partner-logo__placeholder-box {
          width: 140px;
          height: 90px;
          border-radius: 12px;
          background: rgba(36,17,35,0.05);
          border: 1.5px dashed rgba(36,17,35,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 0.5rem;
          font-family: var(--font-space-grotesk), system-ui, sans-serif;
          color: rgba(36,17,35,0.55);
        }
        .p-partner-logo__name {
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(36,17,35,0.7);
        }

        /* ── QUOTE ───────────────────────────────────────── */
        .p-quote {
          background: var(--p-purple);
          padding: 4rem 2rem;
        }
        .p-quote__inner {
          max-width: 820px;
          margin: 0 auto;
          text-align: center;
          position: relative;
        }
        .p-quote__mark {
          font-family: var(--font-gloucester), serif;
          font-size: 9rem;
          line-height: 0.6;
          color: var(--p-yellow);
          opacity: 0.35;
          margin-bottom: -1rem;
          display: block;
        }
        .p-quote__text {
          margin: 0;
          font-family: var(--font-gloucester), serif;
          font-size: clamp(1.25rem, 2.5vw, 1.85rem);
          line-height: 1.55;
          color: #f2f2f2;
          font-style: italic;
          font-weight: 400;
        }
        .p-quote__cite {
          display: block;
          margin-top: 1.5rem;
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 0.82rem;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--p-yellow);
          opacity: 0.75;
          font-style: normal;
        }

        /* ── CTA BAND ────────────────────────────────────── */
        .p-cta-band {
          position: relative;
          min-height: 500px;
          display: flex;
          align-items: stretch;
          overflow: hidden;
        }
        .p-cta-band__image-wrap {
          position: absolute;
          inset: 0;
          z-index: 0;
        }
        .p-cta-band__img-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            105deg,
            rgba(36,17,35,0.92) 0%,
            rgba(36,17,35,0.75) 50%,
            rgba(36,17,35,0.45) 100%
          );
        }
        .p-cta-band__inner {
          position: relative;
          z-index: 2;
          width: 90vw;
          max-width: 1100px;
          margin: 0 auto;
          padding: 5rem 1rem;
          display: flex;
          align-items: center;
        }
        .p-cta-band__content {
          max-width: 560px;
        }
        .p-cta-band__title {
          margin: 0.5rem 0 1rem;
          font-family: var(--font-space-grotesk), system-ui, sans-serif;
          font-size: clamp(1.8rem, 3.5vw, 2.8rem);
          font-weight: 800;
          color: #f2f2f2;
          line-height: 1.2;
        }
        .p-cta-band__sub {
          margin: 0 0 2rem;
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 1rem;
          line-height: 1.7;
          color: rgba(242,242,242,0.82);
        }
        .p-cta-band__actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.85rem;
        }
      `}</style>
    </main>
  );
}
