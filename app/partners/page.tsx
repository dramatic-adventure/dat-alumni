// app/partners/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useEffect } from "react";
import { dramaClubs } from "@/lib/dramaClubMap";
import JoinTheJourneyPanel from "@/components/shared/JoinTheJourneyPanel";

/* ─── Dynamic stats from live data ───────────────────────── */
const COUNTRY_COUNT = new Set(dramaClubs.map((c) => c.country).filter(Boolean)).size;
const CLUB_COUNT    = dramaClubs.length;

/* ─── Partnership pathways ───────────────────────────────── */
const pathways = [
  {
    eyebrow: "Study Abroad & Academic Programs",
    title: "University Partnerships",
    desc: "Build a credit-eligible study abroad that lets students devise, teach, produce, and perform theatre addressing real-world issues — in collaboration with communities around the globe. We shape the arc together: immersive, rigorous, unforgettable.",
    href: "/partners/universities",
    cta: "Build an Academic Partnership",
    image: "/images/rehearsing-nitra.jpg",
    accent: "#6C00AF",
    border: "rgba(108,0,175,0.45)",
    bg: "rgba(108,0,175,0.08)",
  },
  {
    eyebrow: "CSR · Team Building · Youth Impact",
    title: "Corporate Giving",
    desc: "Launch a CSR initiative, sponsor an Adventure Day of cross-cultural creativity and youth mentorship, or align your company's purpose with theatre-making that sparks transformation in underserved communities worldwide.",
    href: "/partners/corporate-giving",
    cta: "Explore Corporate Partnerships",
    image: "/images/teaching-amazon.jpg",
    accent: "#2493A9",
    border: "rgba(36,147,169,0.45)",
    bg: "rgba(36,147,169,0.08)",
  },
  {
    eyebrow: "Your Vision · Your Terms",
    title: "Propose a Project",
    desc: "Have a bold idea that doesn't fit a box? Whether you're a foundation, a municipality, a cultural organization, or a visionary individual, let's co-design something extraordinary together.",
    href: "/partners/propose-project",
    cta: "Start the Conversation",
    image: "/images/Andean_Mask_Work.jpg",
    accent: "#D9A919",
    border: "rgba(217,169,25,0.5)",
    bg: "rgba(217,169,25,0.08)",
  },
];

/* ─── Partners to feature ────────────────────────────────── */
const featuredPartners = [
  { name: "ETP Slovensko", src: "/images/partners/etp-slovensko.jpg" },
  { name: "Amakhosi Theatre", src: "/images/partners/amakhosi.jpg" },
  { name: "CEDENMA", src: "/images/partners/cedenma.jpg" },
  { name: "Forgotten Voices", src: "/images/partners/forgotten-voices.png" },
  { name: "Daigle Tours", src: "/images/partners/daigle-tours.jpg" },
];

/* ─── Why DAT pillars ─────────────────────────────────────── */
const pillars = [
  {
    icon: "🎭",
    title: "Process-Driven",
    body: "We don't import theatre. We make it together — in the community, with the community, for the community.",
  },
  {
    icon: "🌍",
    title: "Globally Rooted",
    body: `Our network spans ${COUNTRY_COUNT} countries. Every partnership plugs into a living ecosystem of artists, educators, and community leaders.`,
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

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const handle = () => {
      el.style.transform = `translateY(${window.scrollY * 0.28}px)`;
    };
    window.addEventListener("scroll", handle, { passive: true });
    return () => window.removeEventListener("scroll", handle);
  }, []);

  return (
    <main style={{ background: "transparent", overflowX: "hidden" }}>

      {/* ── HERO ────────────────────────────────────────────── */}
      <section style={{ position: "relative", height: "88vh", minHeight: 560, overflow: "hidden", display: "flex", alignItems: "flex-end" }}>
        <div ref={heroRef} style={{ position: "absolute", inset: "-15% 0", willChange: "transform" }}>
          <Image src="/images/performing-zanzibar.jpg" alt="DAT artists performing in Zanzibar" fill priority sizes="100vw" style={{ objectFit: "cover", objectPosition: "center 30%" }} />
        </div>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(36,17,35,0.2) 0%, rgba(36,17,35,0.6) 55%, rgba(36,17,35,0.92) 100%)" }} />
        <div style={{ position: "relative", zIndex: 2, width: "90vw", maxWidth: 1100, margin: "0 auto 6vh", padding: "0 1rem" }}>
          <span style={{ display: "block", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "#FFCC00", marginBottom: "0.75rem" }}>
            Dramatic Adventure Theatre
          </span>
          <h1 style={{ margin: 0, fontFamily: "var(--font-anton), sans-serif", fontSize: "clamp(3.2rem, 9vw, 7.5rem)", lineHeight: 0.96, textTransform: "uppercase", color: "#f2f2f2", textShadow: "0 6px 32px rgba(0,0,0,0.55)" }}>
            MAKE SOMETHING<br />UNFORGETTABLE.
          </h1>
          <p style={{ margin: "1.25rem 0 0", fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: "clamp(1rem, 2vw, 1.4rem)", fontWeight: 500, color: "rgba(242,242,242,0.88)", maxWidth: 640, lineHeight: 1.55 }}>
            We create theatre with communities around the world. If you're a university, a company, or an organization with a bold vision — let's build something together.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.85rem", marginTop: "2rem" }}>
            <Link href="/partners/propose-project" className="p-btn-yellow">Start the Conversation</Link>
            <a href="#pathways" className="p-btn-ghost">Explore Partnerships</a>
          </div>
        </div>
      </section>

      {/* ── STAT BAND ────────────────────────────────────────── */}
      <section style={{ background: "#241123", padding: "2.25rem 2rem" }}>
        <div className="p-stats-grid">
          {[
            { value: `${COUNTRY_COUNT}`, label: "Countries" },
            { value: `${CLUB_COUNT}+`, label: "Drama Clubs Created" },
            { value: "350+", label: "DAT Alumni Artists" },
            { value: "20", label: "Seasons of Global Work" },
          ].map((s) => (
            <div key={s.label} style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <span style={{ fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: "clamp(2rem, 5vw, 3.2rem)", fontWeight: 700, color: "#FFCC00", lineHeight: 1 }}>{s.value}</span>
              <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "clamp(0.78rem, 1.4vw, 0.95rem)", color: "rgba(242,242,242,0.75)", fontWeight: 500 }}>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── PATHWAY CARDS ─────────────────────────────────────── */}
      <section id="pathways" style={{ padding: "4rem 2rem" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ marginBottom: "2.5rem", maxWidth: 680 }}>
            <span style={{ display: "inline-block", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "#6C00AF", marginBottom: "0.6rem" }}>PARTNERSHIP PATHWAYS</span>
            <h2 style={{ margin: "0 0 0.6rem", fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 800, color: "#241123", lineHeight: 1.15 }}>
              Choose Your Adventure.
            </h2>
            <p style={{ margin: 0, fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "clamp(0.95rem, 1.6vw, 1.1rem)", color: "rgba(36,17,35,0.75)", lineHeight: 1.65 }}>
              Whether you're building a semester abroad, launching a CSR initiative, or dreaming something entirely new — we're ready to co-create it.
            </p>
          </div>

          <div className="p-cards-grid">
            {pathways.map((pw) => (
              <article key={pw.title} className="p-card" style={{ ["--ca" as any]: pw.accent, ["--cb" as any]: pw.border, ["--cc" as any]: pw.bg }}>
                <div style={{ position: "relative", height: 240, overflow: "hidden", flexShrink: 0 }}>
                  <Image src={pw.image} alt={pw.title} fill sizes="(min-width:1024px) 33vw, 90vw" style={{ objectFit: "cover" }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 40%, rgba(36,17,35,0.72) 100%)" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem", padding: "1.4rem 1.5rem 1.6rem", flex: 1, background: "#fff" }}>
                  <span className="p-card-pill">{pw.eyebrow}</span>
                  <h3 style={{ margin: 0, fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: "clamp(1.3rem, 2.2vw, 1.7rem)", fontWeight: 800, color: "var(--ca)", lineHeight: 1.15 }}>{pw.title}</h3>
                  <p style={{ margin: 0, fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.92rem", lineHeight: 1.65, color: "#241123", flex: 1 }}>{pw.desc}</p>
                  <Link href={pw.href} className="p-card-cta">{pw.cta} →</Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY DAT ───────────────────────────────────────────── */}
      <section style={{ padding: "4rem 2rem" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ marginBottom: "2.5rem", maxWidth: 640 }}>
            <span style={{ display: "inline-block", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "#6C00AF", marginBottom: "0.6rem" }}>WHY DAT</span>
            <h2 style={{ margin: "0 0 0.6rem", fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 800, color: "#241123", lineHeight: 1.15 }}>
              Theatre that changes everything.
            </h2>
            <p style={{ margin: 0, fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "clamp(0.95rem, 1.6vw, 1.1rem)", color: "rgba(36,17,35,0.72)", lineHeight: 1.65 }}>
              A DAT partnership isn't just programming — it's an invitation into a way of making art that reshapes how people see themselves and each other.
            </p>
          </div>
          <div className="p-pillars-grid">
            {pillars.map((p) => (
              <div key={p.title} className="p-pillar">
                <span style={{ display: "block", fontSize: "2rem", marginBottom: "0.75rem" }}>{p.icon}</span>
                <h3 style={{ margin: "0 0 0.5rem", fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: "1.05rem", fontWeight: 800, color: "#6C00AF" }}>{p.title}</h3>
                <p style={{ margin: 0, fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.88rem", lineHeight: 1.65, color: "rgba(36,17,35,0.78)" }}>{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMMUNITY PARTNERS ─────────────────────────────────── */}
      <section style={{ padding: "4rem 2rem" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <span style={{ display: "block", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "#6C00AF", marginBottom: "0.6rem" }}>OUR COMMUNITY</span>
          <h2 style={{ margin: "0 0 0.6rem", fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 800, color: "#241123", lineHeight: 1.15 }}>
            Built on real relationships.
          </h2>
          <p style={{ margin: "0 0 2rem", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "clamp(0.95rem, 1.6vw, 1.1rem)", color: "rgba(36,17,35,0.72)", lineHeight: 1.65, maxWidth: 640 }}>
            DAT's partnerships are rooted in communities — not transactions. From Amakhosi's stages in Zimbabwe to ETP Slovensko's schools in Central Europe to Daigle Tours' on-the-ground support for our Tanzania scouting work, every relationship is built on shared purpose and long-term commitment.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", alignItems: "center" }}>
            {featuredPartners.map((logo) => (
              <div key={logo.name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                <div style={{ position: "relative", width: 140, height: 90, borderRadius: 12, overflow: "hidden", background: "rgba(255,255,255,0.8)", border: "1px solid rgba(36,17,35,0.12)" }}>
                  <Image src={logo.src} alt={logo.name} fill sizes="140px" style={{ objectFit: "contain" }} />
                </div>
                <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(36,17,35,0.7)" }}>{logo.name}</span>
              </div>
            ))}
            {["University Partner", "Corporate Partner"].map((label) => (
              <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                <div style={{ width: 140, height: 90, borderRadius: 12, background: "rgba(36,17,35,0.04)", border: "1.5px dashed rgba(36,17,35,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.62rem", color: "rgba(36,17,35,0.4)", textAlign: "center", textTransform: "uppercase", letterSpacing: "0.1em", padding: "0.5rem" }}>{label}</span>
                </div>
                <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(36,17,35,0.35)" }}>Your Name Here</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── QUOTE ─────────────────────────────────────────────── */}
      <section style={{ background: "#241123", padding: "4rem 2rem" }}>
        <div style={{ maxWidth: 820, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-gloucester), serif", fontSize: "8rem", lineHeight: 0.55, color: "#FFCC00", opacity: 0.3, marginBottom: "-0.5rem" }}>"</div>
          <blockquote style={{ margin: 0, fontFamily: "var(--font-rock-salt), cursive", fontSize: "clamp(1rem, 2vw, 1.4rem)", lineHeight: 1.7, color: "#f2f2f2", fontStyle: "normal" }}>
            DAT doesn't bring a show — they bring a method. Students didn't just learn about global theatre; they lived it, with artists who challenged them to find the story in every room they entered.
          </blockquote>
          <cite style={{ display: "block", marginTop: "1.75rem", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "#FFCC00", opacity: 0.75, fontStyle: "normal" }}>
            — Faculty Partner, Study Abroad Program
          </cite>
        </div>
      </section>

      {/* ── PHOTO STACK + CTA ─────────────────────────────────── */}
      <section style={{ paddingTop: "1rem", paddingBottom: "0" }}>
        <JoinTheJourneyPanel variant="photos-only" />
      </section>
      <section style={{ background: "#6C00AF", padding: "3.5rem 2rem" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <span style={{ display: "block", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "#FFCC00", marginBottom: "0.75rem" }}>READY TO PARTNER?</span>
          <h2 style={{ margin: "0 0 1rem", fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", fontWeight: 800, color: "#f2f2f2", lineHeight: 1.2 }}>
            Bring your bold ideas.<br />Let's create something unforgettable.
          </h2>
          <p style={{ margin: "0 0 2rem", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "1rem", lineHeight: 1.7, color: "rgba(242,242,242,0.85)" }}>
            Every great partnership starts with a conversation. Tell us who you are, what you're imagining, and where your community is.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0.85rem" }}>
            <Link href="/partners/propose-project" className="p-btn-yellow">Propose a Partnership</Link>
            <Link href="/partners/universities" className="p-btn-outline-light">University Programs</Link>
            <Link href="/partners/corporate-giving" className="p-btn-outline-light">Corporate Giving</Link>
          </div>
        </div>
      </section>

      <style>{`
        .p-stats-grid {
          max-width: 1100px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
          text-align: center;
        }
        @media (max-width: 640px) { .p-stats-grid { grid-template-columns: repeat(2, 1fr); } }

        .p-cards-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }
        @media (max-width: 900px) { .p-cards-grid { grid-template-columns: 1fr; } }

        .p-card {
          display: flex;
          flex-direction: column;
          border-radius: 18px;
          overflow: hidden;
          border: 1.5px solid var(--cb);
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
          transition: transform 220ms ease, box-shadow 220ms ease;
        }
        .p-card:hover { transform: translateY(-5px); box-shadow: 0 18px 50px rgba(0,0,0,0.18); }

        .p-card-pill {
          display: inline-block;
          align-self: flex-start;
          padding: 0.25rem 0.75rem;
          border-radius: 8px;
          background: var(--cc);
          border: 1px solid var(--cb);
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--ca);
        }

        .p-card-cta {
          display: inline-flex;
          align-self: flex-start;
          margin-top: 0.5rem;
          padding: 0.7rem 1.2rem;
          border-radius: 12px;
          background: var(--cc);
          border: 1.5px solid var(--cb);
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--ca);
          text-decoration: none;
          transition: background 140ms ease, transform 140ms ease, color 140ms ease;
        }
        .p-card-cta:hover { background: var(--ca); color: #f2f2f2; transform: translateX(2px); }

        .p-pillars-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
        }
        @media (max-width: 900px) { .p-pillars-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 540px) { .p-pillars-grid { grid-template-columns: 1fr; } }

        .p-pillar {
          background: rgba(108,0,175,0.05);
          border: 1px solid rgba(108,0,175,0.12);
          border-radius: 16px;
          padding: 1.5rem 1.25rem;
          transition: transform 180ms ease, box-shadow 180ms ease;
        }
        .p-pillar:hover { transform: translateY(-3px); box-shadow: 0 10px 28px rgba(108,0,175,0.1); }

        .p-btn-yellow {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.9rem 1.8rem;
          border-radius: 14px;
          background: #FFCC00;
          color: #241123;
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          text-decoration: none;
          border: none;
          transition: transform 150ms ease, background 150ms ease;
        }
        .p-btn-yellow:hover { transform: translateY(-2px); background: #e6b800; }

        .p-btn-ghost {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.9rem 1.8rem;
          border-radius: 14px;
          background: rgba(242,242,242,0.12);
          color: #f2f2f2;
          border: 2px solid rgba(242,242,242,0.4);
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          text-decoration: none;
          backdrop-filter: blur(6px);
          transition: transform 150ms ease, background 150ms ease;
        }
        .p-btn-ghost:hover { transform: translateY(-2px); background: rgba(242,242,242,0.2); }

        .p-btn-outline-light {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.9rem 1.8rem;
          border-radius: 14px;
          background: transparent;
          color: #f2f2f2;
          border: 2px solid rgba(242,242,242,0.45);
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          text-decoration: none;
          transition: transform 150ms ease, background 150ms ease;
        }
        .p-btn-outline-light:hover { transform: translateY(-2px); background: rgba(242,242,242,0.1); }
      `}</style>
    </main>
  );
}
