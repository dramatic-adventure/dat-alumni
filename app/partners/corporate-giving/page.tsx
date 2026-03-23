// app/partners/corporate-giving/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { dramaClubs } from "@/lib/dramaClubMap";
import JoinTheJourneyPanel from "@/components/shared/JoinTheJourneyPanel";

const COUNTRY_COUNT = new Set(dramaClubs.map((c) => c.country).filter(Boolean)).size;
const CLUB_COUNT    = dramaClubs.length;

/* ─── Partnership types ──────────────────────────────────── */
const partnershipTypes = [
  {
    icon: "🌱",
    title: "CSR Initiative",
    tagline: "Purpose-driven giving with measurable impact",
    desc: "Align your company's social responsibility goals with international arts education, youth empowerment, and community development. We'll help you identify partner communities, design the initiative, and provide the reporting your stakeholders need.",
    bestFor: "Companies with CSR budgets, ESG commitments, or social impact goals.",
    accent: "#2FA873",
    border: "rgba(47,168,115,0.35)",
    bg: "rgba(47,168,115,0.08)",
  },
  {
    icon: "⚡",
    title: "Adventure Day",
    tagline: "Team building that actually builds something",
    desc: "A curated day (or weekend) of creativity, cross-cultural exchange, and youth mentorship — led by DAT artists. Your team works alongside young artists to create, perform, and reflect. No trust falls. No ropes courses. Just the transformative power of making something together, with real people, around real stories. And if your team is already retreating somewhere — Barcelona, Prague, Lisbon — give us a heads-up. We can develop an Adventure Day wherever you are, especially in countries where we already work.",
    bestFor: "Companies planning leadership retreats or team off-sites, anywhere in the world.",
    accent: "#FFCC00",
    border: "rgba(217,169,25,0.45)",
    bg: "rgba(217,169,25,0.06)",
  },
  {
    icon: "🎭",
    title: "Artist Sponsorship",
    tagline: "Fund the artist. Change the story.",
    desc: "Your sponsorship puts an artist in the room who couldn't otherwise be there. Some sponsorships unlock a single residency. Others fund a multi-season journey, a fellowship, or a creative breakthrough that shifts the trajectory of a career. Either way: your company's name is woven into the work — and into the life that made it.",
    bestFor: "Companies drawn to patron-level creative impact and direct alignment with a living artistic practice.",
    accent: "#F23359",
    border: "rgba(242,51,89,0.3)",
    bg: "rgba(242,51,89,0.06)",
  },
  {
    icon: "🏘️",
    title: "Drama Club Sponsorship",
    tagline: "Sustain the work between the residencies",
    desc: "Fund a DAT Drama Club in a specific community. These youth-led, locally-rooted groups gather year-round to create original performances. Your sponsorship keeps the space open, the teaching artists coming, and the stories alive — building the kind of youth leadership that outlasts any single program.",
    bestFor: "Long-term partners interested in sustained community relationships, youth mentorship, and measurable local impact.",
    accent: "#2493A9",
    border: "rgba(36,147,169,0.3)",
    bg: "rgba(36,147,169,0.06)",
  },
];

/* ─── Adventure Day timeline ─────────────────────────────── */
const adventureDaySteps = [
  { time: "Morning", icon: "🌄", activity: "Community arrival, orientation, and creative warm-up with DAT artists" },
  { time: "Late Morning", icon: "🎙️", activity: "Story circles: your team listens to young artists share their experiences" },
  { time: "Midday", icon: "🍽️", activity: "Shared meal and informal exchange with local artists and community members" },
  { time: "Afternoon", icon: "🛠️", activity: "Devising workshop: teams co-create short scenes with youth artists" },
  { time: "Evening", icon: "🎭", activity: "Sharing + reflection: your team performs alongside the young artists" },
];

/* ─── SDG alignment ──────────────────────────────────────── */
const sdgs = [
  { sdg: "SDG 4", label: "Quality Education", desc: "Arts education and youth development in underserved communities." },
  { sdg: "SDG 10", label: "Reduced Inequalities", desc: "Centering the voices of marginalized and Indigenous communities." },
  { sdg: "SDG 11", label: "Sustainable Communities", desc: "Supporting cultural vitality and community cohesion." },
  { sdg: "SDG 13", label: "Climate Action", desc: "Many of our partner communities are climate-frontline — theatre helps them process, respond, and advocate." },
  { sdg: "SDG 16", label: "Peace &amp; Justice", desc: "Conflict resolution, truth-telling, and reconciliation through story." },
  { sdg: "SDG 17", label: "Partnerships for Goals", desc: "Long-term institutional relationships that go beyond one-time giving." },
];

export default function CorporateGivingPage() {
  return (
    <main style={{ background: "#f6e4c1", overflowX: "hidden" }}>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section style={{ position: "relative", minHeight: "82vh", display: "flex", alignItems: "flex-end", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0 }}>
          <Image src="/images/teaching-amazon.jpg" alt="DAT artists working with youth in the Amazon" fill priority sizes="100vw" style={{ objectFit: "cover", objectPosition: "center 40%" }} />
        </div>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(36,17,35,0.3) 0%, rgba(36,17,35,0.65) 50%, rgba(36,17,35,0.95) 100%)" }} />
        <div style={{ position: "relative", zIndex: 2, width: "90vw", maxWidth: 1000, margin: "0 auto 6vh", padding: "0 1rem" }}>
          <Link href="/partners" style={{ display: "inline-block", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(242,242,242,0.65)", textDecoration: "none", marginBottom: "1rem" }}>
            ← All Partnerships
          </Link>
          <span style={{ display: "block", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "#FFCC00", marginBottom: "0.75rem" }}>
            For Companies, Foundations &amp; Social Impact Teams
          </span>
          <h1 style={{ margin: 0, fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: "clamp(2.5rem, 6vw, 5.5rem)", fontWeight: 800, lineHeight: 1.05, color: "#f2f2f2", textShadow: "0 4px 24px rgba(0,0,0,0.5)" }}>
            Give with your whole company.
          </h1>
          <p style={{ margin: "1.25rem 0 0", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "clamp(0.95rem, 1.8vw, 1.2rem)", fontWeight: 500, color: "rgba(242,242,242,0.88)", maxWidth: 620, lineHeight: 1.6 }}>
            Partner with DAT to align your brand with bold, community-powered theatre — through CSR initiatives, Adventure Days, Artist Sponsorships, and Drama Club funding that creates measurable, lasting impact.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.85rem", marginTop: "2rem" }}>
            <Link href="/partners/propose-project?type=corporate" className="cg-btn-yellow">Explore a Partnership</Link>
            <a href="#types" className="cg-btn-ghost">See What's Possible</a>
          </div>
        </div>
      </section>

      {/* ── IMPACT STATS ─────────────────────────────────────── */}
      <section style={{ background: "#241123", padding: "2.5rem 2rem" }}>
        <div className="cg-stats-grid">
          {[
            { value: `${COUNTRY_COUNT}`, label: "Countries with DAT Clubs", sub: "active community partnerships" },
            { value: `${CLUB_COUNT}+`, label: "Drama Clubs Created", sub: "and counting" },
            { value: "32", label: "New Plays", sub: "devised with community artists" },
            { value: "350+", label: "DAT Alumni", sub: "artists worldwide" },
          ].map((s) => (
            <div key={s.label} style={{ display: "flex", flexDirection: "column", gap: "0.2rem", textAlign: "center" }}>
              <span style={{ fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: "clamp(2rem, 4.5vw, 3rem)", fontWeight: 700, color: "#2FA873", lineHeight: 1 }}>{s.value}</span>
              <span style={{ fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: "0.85rem", fontWeight: 700, color: "rgba(242,242,242,0.85)" }}>{s.label}</span>
              <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.72rem", color: "rgba(242,242,242,0.4)", letterSpacing: "0.04em" }}>{s.sub}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHY THEATRE / INTRO ──────────────────────────────── */}
      <section style={{ padding: "4.5rem 2rem", background: "#f6e4c1" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }} className="cg-two-col">
          <div>
            <span style={{ display: "block", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "#2FA873", marginBottom: "0.5rem" }}>WHY THEATRE? WHY DAT?</span>
            <h2 style={{ margin: "0 0 1rem", fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: "clamp(1.6rem, 3vw, 2.4rem)", fontWeight: 800, color: "#2FA873", lineHeight: 1.2 }}>
              Art is where change takes root.
            </h2>
            <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.96rem", lineHeight: 1.75, color: "rgba(36,17,35,0.82)", margin: "0 0 0.75rem" }}>
              The most persistent challenges facing communities — climate disruption, cultural erasure, youth disengagement — aren't solved with money alone. They're addressed when people find the language to name them, the courage to speak them, and the community to hear them.
            </p>
            <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.96rem", lineHeight: 1.75, color: "rgba(36,17,35,0.82)", margin: "0 0 0.75rem" }}>
              That's what theatre does. And that's what a DAT corporate partnership supports.
            </p>
            <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.96rem", lineHeight: 1.75, color: "rgba(36,17,35,0.82)", margin: 0 }}>
              Whether your company wants to deepen its ESG impact, engage your team around shared purpose, or build a visible philanthropic identity — we'll design a partnership that works for your organization and makes a real difference on the ground.
            </p>
          </div>
          <div className="cg-aside-card">
            <span style={{ display: "block", fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#2FA873", marginBottom: "0.5rem" }}>DAT Is a 501(c)(3) Nonprofit</span>
            <p style={{ margin: "0 0 0.75rem", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.86rem", lineHeight: 1.65, color: "rgba(36,17,35,0.72)" }}>
              All corporate donations to Dramatic Adventure Theatre are tax-deductible. We'll provide full documentation for your CSR and tax reporting needs.
            </p>
            <div style={{ height: 1, background: "rgba(36,17,35,0.1)", margin: "1rem 0" }} />
            <span style={{ display: "block", fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#2FA873", marginBottom: "0.25rem" }}>EIN: 80-0178507</span>
            <p style={{ margin: 0, fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.86rem", lineHeight: 1.65, color: "rgba(36,17,35,0.65)" }}>
              Registered with Candid/GuideStar. Financials available on request.
            </p>
          </div>
        </div>
      </section>

      {/* ── FOUR PARTNERSHIP TYPES ───────────────────────────── */}
      <section id="types" style={{ background: "#241123", padding: "4.5rem 2rem" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <span style={{ display: "block", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(242,242,242,0.55)", marginBottom: "0.5rem" }}>HOW WE CAN WORK TOGETHER</span>
          <h2 style={{ margin: "0 0 0.65rem", fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)", fontWeight: 800, color: "#f2f2f2", lineHeight: 1.15 }}>
            Four ways to partner with DAT.
          </h2>
          <p style={{ margin: "0 0 2.5rem", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "1rem", lineHeight: 1.65, color: "rgba(242,242,242,0.7)", maxWidth: 580 }}>
            Every partnership is unique. These are starting points — we co-design from here.
          </p>
          <div className="cg-types-grid">
            {partnershipTypes.map((pt) => (
              <div key={pt.title} className="cg-type-card" style={{ ["--ta" as any]: pt.accent, ["--tb" as any]: pt.border, ["--tc" as any]: pt.bg }}>
                <span style={{ display: "block", fontSize: "2.2rem", marginBottom: "0.9rem" }}>{pt.icon}</span>
                <h3 style={{ margin: "0 0 0.2rem", fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: "1.3rem", fontWeight: 800, color: "var(--ta)" }}>{pt.title}</h3>
                <span style={{ display: "block", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.78rem", fontWeight: 600, fontStyle: "italic", color: "rgba(242,242,242,0.55)", marginBottom: "0.85rem" }}>{pt.tagline}</span>
                <p style={{ margin: "0 0 1rem", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.9rem", lineHeight: 1.7, color: "rgba(242,242,242,0.78)" }}>{pt.desc}</p>
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "0.75rem" }}>
                  <span style={{ fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ta)", opacity: 0.7, marginRight: "0.4rem" }}>Best for:</span>
                  <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", color: "rgba(242,242,242,0.5)", fontStyle: "italic" }}>{pt.bestFor}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ADVENTURE DAY SPOTLIGHT ──────────────────────────── */}
      <section style={{ padding: "4.5rem 2rem", background: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }} className="cg-two-col">
          <div>
            <span style={{ display: "block", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "#2493A9", marginBottom: "0.5rem" }}>ADVENTURE DAY SPOTLIGHT</span>
            <h2 style={{ margin: "0 0 1rem", fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: "clamp(1.6rem, 3vw, 2.4rem)", fontWeight: 800, color: "#2493A9", lineHeight: 1.2 }}>
              What does an Adventure Day look like?
            </h2>
            <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.96rem", lineHeight: 1.75, color: "rgba(36,17,35,0.82)", margin: "0 0 0.75rem" }}>
              An Adventure Day brings your entire team — from C-suite to frontline — into a shared creative experience that builds empathy, communication, and purpose.
            </p>
            <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.96rem", lineHeight: 1.75, color: "rgba(36,17,35,0.82)", margin: "0 0 0.75rem" }}>
              No trust falls. No ropes courses. Just the transformative power of making something together, with real people, around real stories.
            </p>
            <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.96rem", lineHeight: 1.75, color: "rgba(36,17,35,0.82)", margin: "0 0 1.75rem" }}>
              Already planning a retreat abroad? With a little lead time — and if you're covering travel — we can bring an Adventure Day to you anywhere in the world. We're particularly well-placed in the countries where we already work.
            </p>
            <Link href="/partners/propose-project?type=adventure-day" className="cg-btn-teal">Plan an Adventure Day</Link>
          </div>
          <div className="cg-timeline">
            {adventureDaySteps.map((step, i) => (
              <div key={i} className="cg-timeline-step">
                <div className="cg-timeline-dot">{step.icon}</div>
                <div>
                  <span style={{ display: "block", fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#2493A9", marginBottom: "0.25rem" }}>{step.time}</span>
                  <p style={{ margin: 0, fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.88rem", lineHeight: 1.55, color: "rgba(36,17,35,0.78)" }}>{step.activity}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── QUOTE ─────────────────────────────────────────────── */}
      <section style={{ position: "relative", minHeight: 360, display: "flex", alignItems: "center", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0 }}>
          <Image src="/images/Andean_Mask_Work.jpg" alt="DAT artists in traditional Andean mask work" fill sizes="100vw" style={{ objectFit: "cover", objectPosition: "center" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(105deg, rgba(36,17,35,0.97) 0%, rgba(36,17,35,0.82) 55%, rgba(36,17,35,0.5) 100%)" }} />
        </div>
        <div style={{ position: "relative", zIndex: 2, width: "90vw", maxWidth: 620, margin: "0 auto", padding: "3.5rem 2rem 3.5rem 3rem" }}>
          <div style={{ fontFamily: "var(--font-gloucester), serif", fontSize: "7rem", lineHeight: 0.55, color: "#FFCC00", opacity: 0.28, marginBottom: "-0.25rem" }}>"</div>
          <blockquote style={{ margin: 0, fontFamily: "var(--font-rock-salt), cursive", fontSize: "clamp(0.9rem, 1.6vw, 1.25rem)", lineHeight: 1.7, color: "#f2f2f2", fontStyle: "normal" }}>
            Our team came back from the Adventure Day talking about it for months. It wasn't just a retreat — it was a shared experience that reminded us why our work matters and who we're ultimately doing it for.
          </blockquote>
          <cite style={{ display: "block", marginTop: "1.25rem", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#FFCC00", opacity: 0.65, fontStyle: "normal" }}>
            — Corporate Partner, Adventure Day
          </cite>
        </div>
      </section>

      {/* ── ESG ALIGNMENT ─────────────────────────────────────── */}
      <section style={{ padding: "4rem 2rem", background: "#f6e4c1" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ marginBottom: "2.5rem", maxWidth: 600 }}>
            <span style={{ display: "block", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "#2FA873", marginBottom: "0.5rem" }}>ESG &amp; CSR ALIGNMENT</span>
            <h2 style={{ margin: "0 0 0.65rem", fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)", fontWeight: 800, color: "#241123", lineHeight: 1.15 }}>
              Built for your impact goals.
            </h2>
            <p style={{ margin: 0, fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "1rem", lineHeight: 1.65, color: "rgba(36,17,35,0.72)" }}>
              A DAT corporate partnership can be structured to support SDG reporting, ESG frameworks, and CSR disclosures.
            </p>
          </div>
          <div className="cg-sdgs-grid">
            {sdgs.map((item) => (
              <div key={item.sdg} className="cg-sdg-item">
                <span style={{ display: "block", fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#2FA873", marginBottom: "0.2rem" }}>{item.sdg}</span>
                <h3 style={{ margin: "0 0 0.35rem", fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: "0.95rem", fontWeight: 800, color: "#241123" }} dangerouslySetInnerHTML={{ __html: item.label }} />
                <p style={{ margin: 0, fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.83rem", lineHeight: 1.6, color: "rgba(36,17,35,0.72)" }} dangerouslySetInnerHTML={{ __html: item.desc }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PHOTO STACK + CTA ─────────────────────────────────── */}
      <section style={{ background: "#f6e4c1", paddingTop: "1rem", paddingBottom: "0" }}>
        <JoinTheJourneyPanel variant="photos-only" />
      </section>
      <section style={{ background: "#2FA873", padding: "3.5rem 2rem" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <span style={{ display: "block", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "#241123", opacity: 0.75, marginBottom: "0.75rem" }}>START THE CONVERSATION</span>
          <h2 style={{ margin: "0 0 1rem", fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", fontWeight: 800, color: "#241123", lineHeight: 1.2 }}>
            Your company can change a story.
          </h2>
          <p style={{ margin: "0 0 2rem", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "1rem", lineHeight: 1.7, color: "rgba(36,17,35,0.85)" }}>
            Ready to explore a CSR initiative, Adventure Day, or Artist Sponsorship? Tell us about your company and what you're hoping to build.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0.85rem" }}>
            <Link href="/partners/propose-project?type=corporate" className="cg-btn-dark">Propose a Corporate Partnership</Link>
            <Link href="/partners" className="cg-btn-outline-dark">← All Partnership Pathways</Link>
          </div>
        </div>
      </section>

      <style>{`
        .cg-stats-grid {
          max-width: 1100px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.25rem;
        }
        @media (max-width: 640px) { .cg-stats-grid { grid-template-columns: repeat(2, 1fr); } }

        .cg-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 3.5rem; align-items: flex-start; }
        @media (max-width: 900px) { .cg-two-col { grid-template-columns: 1fr; } }

        .cg-aside-card {
          background: rgba(47,168,115,0.06);
          border: 1px solid rgba(47,168,115,0.2);
          border-radius: 18px;
          padding: 1.5rem 1.4rem;
          position: sticky;
          top: 6rem;
        }

        .cg-types-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.25rem;
        }
        @media (max-width: 700px) { .cg-types-grid { grid-template-columns: 1fr; } }

        .cg-type-card {
          background: var(--tc);
          border: 1.5px solid var(--tb);
          border-radius: 18px;
          padding: 1.6rem 1.4rem 1.8rem;
          transition: transform 200ms ease, box-shadow 200ms ease;
        }
        .cg-type-card:hover { transform: translateY(-4px); box-shadow: 0 14px 40px rgba(0,0,0,0.25); }

        .cg-timeline { display: flex; flex-direction: column; gap: 0; }
        .cg-timeline-step {
          display: flex;
          gap: 1rem;
          padding-bottom: 1.4rem;
          position: relative;
          align-items: flex-start;
        }
        .cg-timeline-step:not(:last-child)::before {
          content: "";
          position: absolute;
          left: 1.35rem;
          top: 2.8rem;
          bottom: 0;
          width: 2px;
          background: rgba(36,147,169,0.2);
        }
        .cg-timeline-dot {
          flex-shrink: 0;
          width: 2.75rem;
          height: 2.75rem;
          border-radius: 50%;
          background: rgba(36,147,169,0.12);
          border: 2px solid rgba(36,147,169,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          z-index: 1;
          padding-top: 0.2rem;
        }

        .cg-sdgs-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }
        @media (max-width: 900px) { .cg-sdgs-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 540px) { .cg-sdgs-grid { grid-template-columns: 1fr; } }

        .cg-sdg-item {
          background: rgba(255,255,255,0.7);
          border: 1px solid rgba(47,168,115,0.18);
          border-radius: 14px;
          padding: 1.25rem 1.1rem;
          transition: transform 180ms ease;
        }
        .cg-sdg-item:hover { transform: translateY(-2px); }

        .cg-btn-yellow {
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
        .cg-btn-yellow:hover { transform: translateY(-2px); background: #e6b800; }

        .cg-btn-teal {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.9rem 1.75rem;
          border-radius: 14px;
          background: #2493A9;
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
        .cg-btn-teal:hover { transform: translateY(-2px); background: #1e7e93; }

        .cg-btn-ghost {
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
        .cg-btn-ghost:hover { transform: translateY(-2px); background: rgba(242,242,242,0.2); }

        .cg-btn-dark {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.9rem 1.75rem;
          border-radius: 14px;
          background: #241123;
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
        .cg-btn-dark:hover { transform: translateY(-2px); background: #3a1d38; }

        .cg-btn-outline-dark {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.9rem 1.75rem;
          border-radius: 14px;
          background: transparent;
          color: #241123;
          border: 2px solid rgba(36,17,35,0.4);
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          text-decoration: none;
          transition: transform 150ms ease, background 140ms ease;
        }
        .cg-btn-outline-dark:hover { transform: translateY(-2px); background: rgba(36,17,35,0.08); }
      `}</style>
    </main>
  );
}
