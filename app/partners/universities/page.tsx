// app/partners/universities/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { COUNTRY_COUNT } from "@/lib/datStats";

/* ─── Programs ─────────────────────────────────────────── */
const programs = [
  {
    code: "ACTion",
    name: "Applied Community Theatre",
    desc: "DAT's flagship university program — and the one faculty return to year after year. Students are embedded in partner communities in Ecuador, Slovakia, and beyond, leading theatre workshops with local youth, devising original work, and performing at an international festival. Faculty travel as co-facilitators or academic supervisors, deepening their own practice alongside students. Fully structured for credit integration. Arrive as students. Return as teaching artists.",
    length: "3–6 weeks",
    credits: "Credit-eligible",
  },
  {
    code: "RAW",
    name: "Rugged Artist Workshops",
    desc: "An intensive artist-development program for theatre students ready for more than the studio. Students train alongside working DAT artists in international partner communities — rigorous, place-based, and community-rooted. Designed to fit spring break or semester schedules. Ecuador, Slovakia, and beyond.",
    length: "9 days – 6 weeks",
    credits: "Credit-eligible",
  },
  {
    code: "PASSAGE",
    name: "Cross-Cultural Arts Journey",
    desc: "A three-week international journey open to students of any arts discipline — not just theatre. Students travel with DAT to partner communities, take part in professional workshops and international performances, collaborate with local artists, and culminate in a shared performance. Ideal for departments seeking interdisciplinary credit-bearing travel beyond their own form.",
    length: "3 weeks",
    credits: "Credit-eligible",
  },
  {
    code: "CREATIVE TREK",
    name: "Academic Arts Fieldwork",
    desc: "Short, rigorous cultural immersions built around a specific academic or artistic question. Students pair theatre practice with community observation, ethnographic encounter, and artistic exchange. A natural fit for doctoral fieldwork, interdisciplinary seminars, or a department's first step into a longer DAT partnership.",
    length: "1–3 weeks",
    credits: "Credit-eligible",
  },
  {
    code: "PLACES",
    name: "Curated Theatre Weekend",
    desc: "A curated weekend in a city where great theatre is being made. Students see two or three productions together, share meals at restaurants connected to DAT's international communities, meet working artists, and complete a minga — preparing gift boxes for DAT drama clubs around the world. A powerful standalone experience, or the opening move of a longer partnership. Places: Chicago. Places: Edinburgh. Places: New York.",
    length: "1 weekend",
    credits: "Standalone or add-on",
  },
  {
    code: "DAT LAB",
    name: "Applied Theatre Pedagogy",
    desc: "A research-centered intensive for faculty, advanced students, and departments exploring DAT's community-rooted methodology. Structured around your institution's specific questions — about applied theatre, international pedagogy, or community engagement. Can be brought to your campus or hosted internationally. A strong fit for drama education graduate programs and faculty development.",
    length: "Custom",
    credits: "Negotiable",
  },
];

/* ─── Process steps ─────────────────────────────────────── */
const steps = [
  { num: "01", title: "Reach Out", body: "Share your vision, your students, and your learning goals. We'll ask the right questions to understand what you're really after." },
  { num: "02", title: "Co-Design", body: "Our team works with your faculty and administrators to design a partnership that integrates DAT's methodology with your academic requirements." },
  { num: "03", title: "In the Field", body: "Students travel with DAT artists to partner communities. They devise, teach, produce, and perform — learning by doing." },
  { num: "04", title: "Back Home", body: "Artists return changed. The stories they created ripple outward — in papers, performances, and the lives they continue to live." },
];

/* ─── Benefits ──────────────────────────────────────────── */
const benefits = [
  { icon: "🌐", label: "Global Competency", desc: "Students develop cross-cultural fluency, active listening, and collaborative leadership that lasts a lifetime." },
  { icon: "🎓", label: "Academic Rigor", desc: "Programs can be structured to meet your institution's credit-bearing requirements — we work closely with faculty and registrars to make it happen." },
  { icon: "🏛️", label: "DEI & Equity", desc: "Programs center underrepresented communities and amplify underheard voices — a genuine contribution to your institution's equity goals." },
  { icon: "🤝", label: "Faculty Integration", desc: "Your faculty can join as co-facilitators, researchers, or academic supervisors — deepening their own practice alongside students." },
  { icon: "✏️", label: "Co-Designed Partnership", desc: "Every partnership is built from scratch around your students, your calendar, and your learning goals. No off-the-shelf tours." },
  { icon: "♻️", label: "Lasting Impact", desc: "Relationships between your institution and DAT communities can deepen over multiple cohorts, creating real continuity of care." },
];

export default function UniversityPartnersPage() {
  return (
    <main style={{ background: "transparent", overflowX: "hidden" }}>

      {/* ── HERO ────────────────────────────────────────────── */}
      <section style={{ position: "relative", minHeight: "82vh", display: "flex", alignItems: "flex-end", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0 }}>
          <Image src="/images/rehearsing-nitra.jpg" alt="DAT students rehearsing in Nitra, Slovakia" fill priority sizes="100vw" style={{ objectFit: "cover", objectPosition: "center 35%" }} />
        </div>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(36,17,35,0.2) 0%, rgba(36,17,35,0.62) 55%, rgba(36,17,35,0.92) 100%)" }} />
        <div style={{ position: "relative", zIndex: 2, width: "90vw", maxWidth: 1000, margin: "0 auto 6vh", padding: "0 1rem" }}>
          <Link href="/partners" style={{ display: "inline-block", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(242,242,242,0.65)", textDecoration: "none", marginBottom: "1rem", transition: "color 150ms" }}>
            ← All Partnerships
          </Link>
          <span style={{ display: "block", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "#FFCC00", marginBottom: "0.75rem" }}>
            For Universities &amp; Study Abroad Programs
          </span>
          <h1 style={{ margin: 0, fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: "clamp(2.5rem, 6vw, 5.5rem)", fontWeight: 800, lineHeight: 1.05, color: "#f2f2f2", textShadow: "0 4px 24px rgba(0,0,0,0.5)" }}>
            Your students don't just<br />study the world. They change it.
          </h1>
          <p style={{ margin: "1.25rem 0 0", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "clamp(0.95rem, 1.8vw, 1.2rem)", fontWeight: 500, color: "rgba(242,242,242,0.88)", maxWidth: 620, lineHeight: 1.6 }}>
            Build a credit-eligible study abroad that lets your students devise, teach, produce, and perform theatre addressing real-world issues — in collaboration with communities around the globe.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.85rem", marginTop: "2rem" }}>
            <Link href="/partners/propose-project?type=university" className="u-btn-yellow">Propose a Partnership</Link>
            <a href="#programs" className="u-btn-ghost">See Our Programs</a>
          </div>
        </div>
      </section>

      {/* ── THE DAT DIFFERENCE ─────────────────────────────────── */}
      <section style={{ padding: "4.5rem 2rem", background: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }} className="u-two-col">
          <div>
            <span style={{ display: "block", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "#6C00AF", marginBottom: "0.5rem" }}>THE DAT DIFFERENCE</span>
            <h2 style={{ margin: "0 0 1rem", fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: "clamp(1.6rem, 3vw, 2.4rem)", fontWeight: 800, color: "#6C00AF", lineHeight: 1.2 }}>
              Not a tour. Not a course. A practice.
            </h2>
            <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.98rem", lineHeight: 1.75, color: "rgba(36,17,35,0.82)", margin: "0 0 0.75rem" }}>
              A DAT university partnership is not a cultural tour with theatre on the side. Students are embedded in real communities, working alongside local artists and youth to create original performances that speak to the issues that matter most in that place, at that time.
            </p>
            <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.98rem", lineHeight: 1.75, color: "rgba(36,17,35,0.82)", margin: "0 0 1.5rem" }}>
              Students don't just study theatre — they practice it as a tool for listening, justice, and transformation. They come home with a fundamentally different sense of what art can do.
            </p>
            <Link href="/partners/propose-project?type=university" className="u-btn-purple">Start a Conversation</Link>
          </div>
          <div style={{ position: "relative", height: 420, borderRadius: 18, overflow: "hidden", boxShadow: "0 16px 48px rgba(36,17,35,0.2)" }}>
            <Image src="/images/teaching-andes.jpg" alt="DAT teaching artist working with students in the Andes" fill sizes="(min-width:900px) 40vw, 90vw" style={{ objectFit: "cover", objectPosition: "center" }} />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section style={{ padding: "4rem 2rem" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ marginBottom: "2.5rem" }}>
            <span style={{ display: "block", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "#6C00AF", marginBottom: "0.5rem" }}>HOW IT WORKS</span>
            <h2 style={{ margin: 0, fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)", fontWeight: 800, color: "#241123", lineHeight: 1.15 }}>
              From conversation to performance.
            </h2>
          </div>
          <div className="u-steps-grid">
            {steps.map((s) => (
              <div key={s.num} className="u-step">
                <span style={{ display: "block", fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: "2.5rem", fontWeight: 800, color: "#6C00AF", opacity: 0.22, lineHeight: 1, marginBottom: "0.5rem" }}>{s.num}</span>
                <h3 style={{ margin: "0 0 0.4rem", fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: "1.05rem", fontWeight: 800, color: "#6C00AF" }}>{s.title}</h3>
                <p style={{ margin: 0, fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.88rem", lineHeight: 1.65, color: "rgba(36,17,35,0.78)" }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROGRAMS ─────────────────────────────────────────── */}
      <section id="programs" style={{ padding: "4.5rem 2rem", background: "#241123" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <span style={{ display: "block", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(242,242,242,0.55)", marginBottom: "0.5rem" }}>OUR PROGRAMS</span>
          <h2 style={{ margin: "0 0 0.65rem", fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)", fontWeight: 800, color: "#f2f2f2", lineHeight: 1.15 }}>
            A program for every vision.
          </h2>
          <p style={{ margin: "0 0 2.5rem", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "1rem", lineHeight: 1.65, color: "rgba(242,242,242,0.72)", maxWidth: 580 }}>
            From weekend intensives to multi-week immersions, we'll find the right shape for your students, your faculty, and your academic calendar.
          </p>

          <div className="u-programs-grid">
            {programs.map((p) => (
              <div key={p.code} className="u-program-card">
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                  <span style={{ fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: "1.4rem", fontWeight: 800, color: "#FFCC00", letterSpacing: "0.05em" }}>{p.code}</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", alignItems: "flex-end" }}>
                    <span className="u-badge-teal">{p.length}</span>
                    <span className="u-badge-yellow">{p.credits}</span>
                  </div>
                </div>
                <h3 style={{ margin: "0 0 0.5rem", fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: "1rem", fontWeight: 700, color: "#f2f2f2" }}>{p.name}</h3>
                <p style={{ margin: 0, fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.86rem", lineHeight: 1.65, color: "rgba(242,242,242,0.7)" }}>{p.desc}</p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
            <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", color: "rgba(242,242,242,0.6)", fontSize: "0.9rem", marginBottom: "1rem" }}>
              Don't see exactly what you need? We can co-design every partnership from scratch.
            </p>
            <Link href="/partners/propose-project?type=university" className="u-btn-yellow">Propose Something Custom</Link>
          </div>
        </div>
      </section>

      {/* ── BENEFITS ─────────────────────────────────────────── */}
      <section style={{ padding: "4rem 2rem" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <span style={{ display: "block", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "#6C00AF", marginBottom: "0.5rem" }}>FOR YOUR INSTITUTION</span>
          <h2 style={{ margin: "0 0 2rem", fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)", fontWeight: 800, color: "#241123", lineHeight: 1.15 }}>
            Why partner with DAT?
          </h2>
          <div className="u-benefits-grid">
            {benefits.map((b) => (
              <div key={b.label} className="u-benefit">
                <span style={{ display: "block", fontSize: "1.8rem", marginBottom: "0.6rem" }}>{b.icon}</span>
                <h3 style={{ margin: "0 0 0.35rem", fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: "0.95rem", fontWeight: 800, color: "#6C00AF" }}>{b.label}</h3>
                <p style={{ margin: 0, fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.86rem", lineHeight: 1.65, color: "rgba(36,17,35,0.75)" }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── QUOTE ────────────────────────────────────────────── */}
      <section style={{ position: "relative", minHeight: 420, display: "flex", alignItems: "center", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0 }}>
          <Image src="/images/performing-zanzibar.jpg" alt="Students performing in Zanzibar" fill sizes="100vw" style={{ objectFit: "cover", objectPosition: "center" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(105deg, rgba(36,17,35,0.96) 0%, rgba(36,17,35,0.82) 50%, rgba(36,17,35,0.5) 100%)" }} />
        </div>
        <div style={{ position: "relative", zIndex: 2, width: "90vw", maxWidth: 620, margin: "0 auto", padding: "4rem 2rem 4rem 3rem" }}>
          <div style={{ fontFamily: "var(--font-gloucester), serif", fontSize: "7rem", lineHeight: 0.55, color: "#FFCC00", opacity: 0.28, marginBottom: "-0.25rem" }}>"</div>
          <blockquote style={{ margin: 0, fontFamily: "var(--font-rock-salt), cursive", fontSize: "clamp(0.95rem, 1.8vw, 1.3rem)", lineHeight: 1.7, color: "#f2f2f2", fontStyle: "normal" }}>
            Our students came back different. Not just more worldly — more human. DAT didn't give them an experience; they gave them a practice.
          </blockquote>
          <cite style={{ display: "block", marginTop: "1.25rem", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#FFCC00", opacity: 0.7, fontStyle: "normal" }}>
            — Study Abroad Director, Partner University
          </cite>
          <div style={{ marginTop: "2rem" }}>
            <Link href="/partners/propose-project?type=university" className="u-btn-yellow">Build This for Your Students</Link>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────── */}
      <section style={{ background: "#6C00AF", padding: "5rem 2rem" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <span style={{ display: "block", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "#FFCC00", marginBottom: "0.75rem" }}>READY TO PARTNER?</span>
          <h2 style={{ margin: "0 0 1rem", fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 800, color: "#f2f2f2", lineHeight: 1.15 }}>
            Let's design something extraordinary.
          </h2>
          <p style={{ margin: "0 0 2.5rem", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "1.05rem", lineHeight: 1.7, color: "rgba(242,242,242,0.85)" }}>
            Share a few details about your program, your students, and what you're hoping to build. We'll be in touch to start the conversation.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0.85rem" }}>
            <Link href="/partners/propose-project?type=university" className="u-btn-yellow" style={{ fontSize: "0.9rem", padding: "1.1rem 2.2rem" }}>Submit a Proposal</Link>
            <Link href="/partners" className="u-btn-outline-light">← Back to Partnerships</Link>
          </div>
        </div>
      </section>

      <style>{`
        .u-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 3.5rem; align-items: center; }
        @media (max-width: 900px) { .u-two-col { grid-template-columns: 1fr; } }

        .u-steps-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; }
        @media (max-width: 900px) { .u-steps-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 540px) { .u-steps-grid { grid-template-columns: 1fr; } }

        .u-step {
          background: rgba(255,255,255,0.7);
          border: 1px solid rgba(108,0,175,0.15);
          border-radius: 16px;
          padding: 1.5rem 1.25rem;
          transition: transform 180ms ease, box-shadow 180ms ease;
        }
        .u-step:hover { transform: translateY(-3px); box-shadow: 0 10px 28px rgba(108,0,175,0.1); }

        .u-programs-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem; }
        @media (max-width: 900px) { .u-programs-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 540px) { .u-programs-grid { grid-template-columns: 1fr; } }

        .u-program-card {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(108,0,175,0.3);
          border-radius: 16px;
          padding: 1.4rem 1.25rem 1.5rem;
          transition: border-color 180ms ease, transform 180ms ease, background 180ms ease;
        }
        .u-program-card:hover { border-color: rgba(108,0,175,0.7); background: rgba(108,0,175,0.1); transform: translateY(-2px); }

        .u-badge-teal {
          display: inline-block;
          padding: 0.18rem 0.5rem;
          border-radius: 6px;
          background: rgba(36,147,169,0.2);
          border: 1px solid rgba(36,147,169,0.4);
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #4fc3d8;
        }
        .u-badge-yellow {
          display: inline-block;
          padding: 0.18rem 0.5rem;
          border-radius: 6px;
          background: rgba(255,204,0,0.15);
          border: 1px solid rgba(255,204,0,0.35);
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #FFCC00;
        }

        .u-benefits-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem; }
        @media (max-width: 900px) { .u-benefits-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 540px) { .u-benefits-grid { grid-template-columns: 1fr; } }

        .u-benefit {
          background: rgba(255,255,255,0.70);
          border: 1px solid rgba(108,0,175,0.15);
          border-radius: 16px;
          padding: 1.4rem 1.25rem;
          transition: transform 180ms ease;
        }
        .u-benefit:hover { transform: translateY(-3px); }

        .u-btn-yellow {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.9rem 1.75rem;
          border-radius: 14px;
          background: #FFCC00;
          color: #241123;
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          text-decoration: none;
          border: none;
          transition: transform 150ms ease, background 140ms ease;
        }
        .u-btn-yellow:hover { transform: translateY(-2px); background: #e6b800; }

        .u-btn-purple {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.9rem 1.75rem;
          border-radius: 14px;
          background: #6C00AF;
          color: #f2f2f2;
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          text-decoration: none;
          border: none;
          transition: transform 150ms ease, background 140ms ease;
        }
        .u-btn-purple:hover { transform: translateY(-2px); background: #530088; }

        .u-btn-ghost {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.9rem 1.75rem;
          border-radius: 14px;
          background: rgba(242,242,242,0.12);
          color: #f2f2f2;
          border: 2px solid rgba(242,242,242,0.4);
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          text-decoration: none;
          backdrop-filter: blur(6px);
          transition: transform 150ms ease, background 140ms ease;
        }
        .u-btn-ghost:hover { transform: translateY(-2px); background: rgba(242,242,242,0.2); }

        .u-btn-outline-light {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.9rem 1.75rem;
          border-radius: 14px;
          background: transparent;
          color: #f2f2f2;
          border: 2px solid rgba(242,242,242,0.45);
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          text-decoration: none;
          transition: transform 150ms ease, background 140ms ease;
        }
        .u-btn-outline-light:hover { transform: translateY(-2px); background: rgba(242,242,242,0.1); }
      `}</style>
    </main>
  );
}
