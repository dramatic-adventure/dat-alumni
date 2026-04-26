// app/ripple-effect/page.tsx
"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import JoinTheJourneyPanel from "@/components/shared/JoinTheJourneyPanel";

/* ─── Ripple type definitions ──────────────────────────────── */
const rippleTypes = [
  {
    label: "New Companies & Projects",
    body: "Alumni have gone on to found theatre companies, production groups, and community arts organizations — carrying forward the devising methods and collaborative ethic they practiced with DAT.",
    accent: "#FFCC00",
    accentBg: "rgba(255,204,0,0.08)",
    accentBorder: "rgba(255,204,0,0.35)",
    number: "01",
  },
  {
    label: "Collaborations Born Through DAT",
    body: "Connections forged inside a devising process — between a director and a performer, a teaching artist and a playwright — continue generating work long after the program ends.",
    accent: "#6C00AF",
    accentBg: "rgba(108,0,175,0.08)",
    accentBorder: "rgba(108,0,175,0.35)",
    number: "02",
  },
  {
    label: "Alumni Returning as Leaders",
    body: "Former participants come back as facilitators, mentors, guest artists, and program designers — becoming part of the living infrastructure DAT depends on.",
    accent: "#2493A9",
    accentBg: "rgba(36,147,169,0.08)",
    accentBorder: "rgba(36,147,169,0.35)",
    number: "03",
  },
  {
    label: "Teaching & Community Work Carried Forward",
    body: "Theatre educators, classroom teachers, youth workers, and community organizers bring DAT's process home — adapting what they've learned to new contexts and populations.",
    accent: "#FFCC00",
    accentBg: "rgba(255,204,0,0.08)",
    accentBorder: "rgba(255,204,0,0.35)",
    number: "04",
  },
  {
    label: "Cross-Country Artistic Relationships",
    body: "A devising process in Ecuador connects an artist from Chicago with a collaborator in Slovakia. The relationship continues. The geography changes. The work keeps moving.",
    accent: "#6C00AF",
    accentBg: "rgba(108,0,175,0.08)",
    accentBorder: "rgba(108,0,175,0.35)",
    number: "05",
  },
  {
    label: "New Careers & Creative Paths",
    body: "For some alumni, DAT is a turning point — the experience that clarified a calling, opened a door, or changed the question they were asking about their own creative life.",
    accent: "#2493A9",
    accentBg: "rgba(36,147,169,0.08)",
    accentBorder: "rgba(36,147,169,0.35)",
    number: "06",
  },
];

/* ─── Ecosystem nodes ─────────────────────────────────────── */
const ecosystemNodes = [
  { label: "ACTion", desc: "International devising programs" },
  { label: "RAW", desc: "New work development" },
  { label: "CASTAWAY", desc: "Ensemble creation" },
  { label: "PASSAGE", desc: "Cross-cultural storytelling" },
  { label: "Drama Clubs", desc: "Local community roots" },
  { label: "Alumni Network", desc: "Living connective tissue" },
  { label: "Local Partners", desc: "Community anchors worldwide" },
  { label: "Public Performances", desc: "Work returned to the world" },
  { label: "Future Collaborations", desc: "Still becoming" },
];

export default function RippleEffectPage() {
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
      <section style={{ position: "relative", height: "90vh", minHeight: 580, overflow: "hidden", display: "flex", alignItems: "flex-end" }}>
        <div ref={heroRef} style={{ position: "absolute", inset: "-15% 0", willChange: "transform" }}>
          <Image
            src="/images/teaching-andes.jpg"
            alt="DAT artists performing together"
            fill
            priority
            sizes="100vw"
            style={{ objectFit: "cover", objectPosition: "center 40%" }}
          />
        </div>
        {/* Concentric ripple rings — decorative */}
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                width: `${i * 22}vw`,
                height: `${i * 22}vw`,
                maxWidth: `${i * 260}px`,
                maxHeight: `${i * 260}px`,
                borderRadius: "50%",
                border: `1px solid rgba(255,204,0,${0.18 - i * 0.04})`,
                opacity: 0.6,
              }}
            />
          ))}
        </div>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(20,8,30,0.25) 0%, rgba(20,8,30,0.62) 50%, rgba(20,8,30,0.95) 100%)" }} />
        <div style={{ position: "relative", zIndex: 2, width: "90vw", maxWidth: 1100, margin: "0 auto 7vh", padding: "0 1rem" }}>
          <span style={{ display: "block", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "#FFCC00", marginBottom: "0.9rem" }}>
            Dramatic Adventure Theatre
          </span>
          <h1 style={{ margin: "0 0 0.5rem", fontFamily: "var(--font-anton), sans-serif", fontSize: "clamp(3.2rem, 9vw, 7.5rem)", lineHeight: 0.94, textTransform: "uppercase", color: "#f2f2f2", textShadow: "0 6px 40px rgba(0,0,0,0.6)" }}>
            Artist Ripple<br />Effect
          </h1>
          <p style={{ margin: "1.5rem 0 0", fontFamily: "var(--font-zilla-slab), serif", fontSize: "clamp(1.1rem, 2.2vw, 1.5rem)", fontWeight: 400, color: "rgba(242,242,242,0.88)", maxWidth: 620, lineHeight: 1.55, fontStyle: "italic" }}>
            The work does not end when a program ends.
          </p>
        </div>
      </section>

      {/* ── WHAT WE MEAN ─────────────────────────────────────── */}
      <section style={{ background: "#241123", padding: "5rem 2rem" }}>
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          <span style={{ display: "block", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "#FFCC00", marginBottom: "1rem" }}>
            What We Mean by Ripple Effect
          </span>
          <h2 style={{ margin: "0 0 1.75rem", fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: "clamp(1.7rem, 3.5vw, 2.6rem)", fontWeight: 800, color: "#f2f2f2", lineHeight: 1.2 }}>
            A DAT program is a beginning, not an event.
          </h2>
          <div style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "clamp(0.95rem, 1.6vw, 1.1rem)", color: "rgba(242,242,242,0.82)", lineHeight: 1.75 }}>
            <p style={{ margin: "0 0 1.2rem" }}>
              Theatre made in community doesn't stay in the room where it was made. It moves. It travels in the bodies and minds of the people who made it — into their next rehearsal rooms, their classrooms, their kitchens, their cities.
            </p>
            <p style={{ margin: "0 0 1.2rem" }}>
              We use the phrase "ripple effect" not as metaphor for impact metrics, but as something more literal: a disturbance in still water that continues moving outward long after the initial force is spent.
            </p>
            <p style={{ margin: 0 }}>
              Ripples are artistic, professional, communal, pedagogical, relational, personal. They are sometimes visible, often invisible. They matter whether or not anyone is counting.
            </p>
          </div>
        </div>
      </section>

      {/* ── RIPPLE TYPES ─────────────────────────────────────── */}
      <section style={{ padding: "5rem 2rem", background: "#1a0b27" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ marginBottom: "3rem", maxWidth: 680 }}>
            <span style={{ display: "inline-block", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "#6C00AF", marginBottom: "0.6rem" }}>
              Six Kinds of Ripples
            </span>
            <h2 style={{ margin: "0 0 0.75rem", fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", fontWeight: 800, color: "#f2f2f2", lineHeight: 1.15 }}>
              How the work travels.
            </h2>
            <p style={{ margin: 0, fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "clamp(0.92rem, 1.5vw, 1.05rem)", color: "rgba(242,242,242,0.7)", lineHeight: 1.65 }}>
              No two artists carry DAT the same way. But these are some of the shapes the work takes once it leaves the room.
            </p>
          </div>

          <div className="re-ripple-grid">
            {rippleTypes.map((rt) => (
              <article
                key={rt.number}
                style={{
                  background: rt.accentBg,
                  border: `1.5px solid ${rt.accentBorder}`,
                  borderRadius: 18,
                  padding: "1.75rem 1.5rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                  transition: "transform 200ms ease, box-shadow 200ms ease",
                }}
                className="re-ripple-card"
              >
                <span style={{ fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.2em", color: rt.accent, textTransform: "uppercase" }}>
                  {rt.number}
                </span>
                <h3 style={{ margin: 0, fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: "clamp(1rem, 1.6vw, 1.2rem)", fontWeight: 800, color: rt.accent, lineHeight: 1.2 }}>
                  {rt.label}
                </h3>
                <p style={{ margin: 0, fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.9rem", lineHeight: 1.7, color: "rgba(242,242,242,0.8)" }}>
                  {rt.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED RIPPLE STORIES ───────────────────────────── */}
      <section style={{ padding: "5rem 2rem", background: "#241123" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ marginBottom: "3rem", maxWidth: 680 }}>
            <span style={{ display: "inline-block", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "#FFCC00", marginBottom: "0.6rem" }}>
              Ripple Stories
            </span>
            <h2 style={{ margin: "0 0 0.75rem", fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", fontWeight: 800, color: "#f2f2f2", lineHeight: 1.15 }}>
              Where the work went.
            </h2>
            <p style={{ margin: 0, fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "clamp(0.92rem, 1.5vw, 1.05rem)", color: "rgba(242,242,242,0.7)", lineHeight: 1.65 }}>
              These are not origin stories. They're continuation stories.
            </p>
          </div>

          {/* Featured: Outer Loop / Mloka — real content */}
          <article style={{ marginBottom: "2rem", background: "rgba(36,147,169,0.07)", border: "1.5px solid rgba(36,147,169,0.35)", borderRadius: 20, overflow: "hidden", display: "grid", gridTemplateColumns: "1fr 1fr" }} className="re-feature-card">
            <div style={{ position: "relative", minHeight: 320 }}>
              <Image
                src="/images/teaching-amazon.jpg"
                alt="Community theatre work in Tanzania"
                fill
                sizes="(min-width: 900px) 50vw, 100vw"
                style={{ objectFit: "cover" }}
              />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, transparent 60%, rgba(20,8,30,0.6) 100%)" }} />
            </div>
            <div style={{ padding: "2.5rem 2rem", display: "flex", flexDirection: "column", gap: "1rem", justifyContent: "center" }}>
              <span style={{ display: "inline-block", alignSelf: "flex-start", padding: "0.28rem 0.9rem", borderRadius: 8, background: "rgba(36,147,169,0.15)", border: "1px solid rgba(36,147,169,0.4)", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#2493A9" }}>
                One Ripple — Tanzania
              </span>
              <h3 style={{ margin: 0, fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: "clamp(1.3rem, 2.2vw, 1.8rem)", fontWeight: 800, color: "#f2f2f2", lineHeight: 1.15 }}>
                Outer Loop & the Mloka Connection
              </h3>
              <p style={{ margin: 0, fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.94rem", lineHeight: 1.72, color: "rgba(242,242,242,0.82)" }}>
                A director travels with DAT. A community connection takes root. Years later, the relationship continues through new theatre and humanitarian work in Tanzania.
              </p>
              <p style={{ margin: 0, fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.94rem", lineHeight: 1.72, color: "rgba(242,242,242,0.82)" }}>
                Michael Herman first encountered the Mloka community through ACTion: Tanzania. Outer Loop's later Tanzania work offers one example of how a DAT journey can continue moving through an artist's life and practice.
              </p>
              <a
                href="https://www.outerlooptheatre.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{ alignSelf: "flex-start", marginTop: "0.5rem", padding: "0.65rem 1.2rem", borderRadius: 12, background: "rgba(36,147,169,0.15)", border: "1.5px solid rgba(36,147,169,0.45)", fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#2493A9", textDecoration: "none", transition: "background 150ms ease" }}
              >
                Outer Loop Theatre →
              </a>
            </div>
          </article>

          {/* Placeholder cards */}
          <div className="re-placeholder-grid">
            {[
              {
                label: "Future Story — Teaching Artist",
                placeholder: "A DAT alum brings the devising process home to their high school drama classroom. Their students devise work about their own community. The methodology travels.",
                accent: "#6C00AF",
                accentBg: "rgba(108,0,175,0.07)",
                accentBorder: "rgba(108,0,175,0.3)",
              },
              {
                label: "Future Story — New Company",
                placeholder: "Two artists who met during a DAT program found a company together. The show they make five years later still carries traces of the room where they first devised something together.",
                accent: "#FFCC00",
                accentBg: "rgba(255,204,0,0.06)",
                accentBorder: "rgba(255,204,0,0.28)",
              },
              {
                label: "Future Story — Community Work",
                placeholder: "An alum goes home and starts a drama club. Then another. Then a regional festival. The community has a new relationship with storytelling.",
                accent: "#6C00AF",
                accentBg: "rgba(108,0,175,0.07)",
                accentBorder: "rgba(108,0,175,0.3)",
              },
            ].map((ph) => (
              <article
                key={ph.label}
                style={{ background: ph.accentBg, border: `1.5px dashed ${ph.accentBorder}`, borderRadius: 18, padding: "1.75rem 1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}
              >
                <span style={{ display: "inline-block", alignSelf: "flex-start", padding: "0.22rem 0.7rem", borderRadius: 7, background: "rgba(255,255,255,0.05)", border: `1px solid ${ph.accentBorder}`, fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: ph.accent }}>
                  Placeholder — Story to Be Curated
                </span>
                <h3 style={{ margin: 0, fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: "1rem", fontWeight: 700, color: "rgba(242,242,242,0.55)", lineHeight: 1.25 }}>
                  {ph.label}
                </h3>
                <p style={{ margin: 0, fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.88rem", lineHeight: 1.7, color: "rgba(242,242,242,0.5)", fontStyle: "italic" }}>
                  {ph.placeholder}
                </p>
                <p style={{ margin: "0.25rem 0 0", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.72rem", color: "rgba(242,242,242,0.32)", letterSpacing: "0.1em" }}>
                  This card is a placeholder for alumni-contributed content.
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY IT MATTERS ───────────────────────────────────── */}
      <section style={{ padding: "5rem 2rem", background: "#14081e" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ marginBottom: "2.5rem" }}>
            <span style={{ display: "block", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "#FFCC00", marginBottom: "0.75rem" }}>
              Why It Matters
            </span>
            <h2 style={{ margin: "0 0 1.5rem", fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", fontWeight: 800, color: "#f2f2f2", lineHeight: 1.15 }}>
              The mission doesn't live in the program.<br />It lives in the people.
            </h2>
          </div>

          <div className="re-why-grid">
            {[
              {
                heading: "Young people learn that their stories matter",
                body: "When a community devises theatre together, something shifts: the participants recognize that their experience is worth putting on a stage. That recognition doesn't leave when the program does.",
                accent: "#FFCC00",
              },
              {
                heading: "Artists carry practices home",
                body: "The devising methods, the ensemble ethics, the way of listening — these travel in the bodies of the artists who learned them. They appear in new rooms, new cities, new generations.",
                accent: "#6C00AF",
              },
              {
                heading: "Cultural memory continues",
                body: "The stories made in a community hold something real about that community. When those stories keep moving — into archives, new performances, teaching — cultural memory lives on.",
                accent: "#2493A9",
              },
              {
                heading: "Relationships generate future work",
                body: "The most durable output of a DAT program is often invisible: a relationship between two artists, a trust between an organization and a community, a conversation that started in 2012 and is still going.",
                accent: "#FFCC00",
              },
            ].map((item) => (
              <div key={item.heading} style={{ borderLeft: `3px solid ${item.accent}`, paddingLeft: "1.25rem" }}>
                <h3 style={{ margin: "0 0 0.6rem", fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: "clamp(1rem, 1.6vw, 1.15rem)", fontWeight: 700, color: item.accent, lineHeight: 1.25 }}>
                  {item.heading}
                </h3>
                <p style={{ margin: 0, fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.92rem", lineHeight: 1.72, color: "rgba(242,242,242,0.78)" }}>
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PULLQUOTE ─────────────────────────────────────────── */}
      <section style={{ background: "#241123", padding: "4.5rem 2rem" }}>
        <div style={{ maxWidth: 780, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-gloucester), serif", fontSize: "8rem", lineHeight: 0.55, color: "#FFCC00", opacity: 0.25, marginBottom: "-0.5rem" }}>"</div>
          <blockquote style={{ margin: 0, fontFamily: "var(--font-rock-salt), cursive", fontSize: "clamp(0.95rem, 1.8vw, 1.3rem)", lineHeight: 1.75, color: "#f2f2f2", fontStyle: "normal" }}>
            What a young person learns about storytelling in Ecuador travels with them to Chicago. What a director discovers in Tanzania shapes what they make in Cleveland. Art is a carrier — it carries meaning across time and geography.
          </blockquote>
          <cite style={{ display: "block", marginTop: "2rem", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: "#FFCC00", opacity: 0.7, fontStyle: "normal" }}>
            — On the nature of the ripple
          </cite>
        </div>
      </section>

      {/* ── HOW RIPPLES GROW ─────────────────────────────────── */}
      <section style={{ padding: "5rem 2rem", background: "#1a0b27" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ marginBottom: "3rem", maxWidth: 640 }}>
            <span style={{ display: "inline-block", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "#6C00AF", marginBottom: "0.6rem" }}>
              The Ecosystem
            </span>
            <h2 style={{ margin: "0 0 0.75rem", fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", fontWeight: 800, color: "#f2f2f2", lineHeight: 1.15 }}>
              How ripples grow.
            </h2>
            <p style={{ margin: 0, fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "clamp(0.92rem, 1.5vw, 1.05rem)", color: "rgba(242,242,242,0.7)", lineHeight: 1.65 }}>
              Ripples don't happen by accident. They're generated by a living ecosystem of programs, people, and relationships.
            </p>
          </div>

          {/* Concentric ripple visualization */}
          <div style={{ position: "relative", display: "flex", justifyContent: "center", marginBottom: "3rem", paddingTop: "2rem", paddingBottom: "2rem" }}>
            {/* Central node */}
            <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}>
              <div style={{ width: 120, height: 120, borderRadius: "50%", background: "#241123", border: "3px solid #FFCC00", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", boxShadow: "0 0 40px rgba(255,204,0,0.25)" }}>
                <span style={{ fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: "0.68rem", fontWeight: 800, color: "#FFCC00", letterSpacing: "0.12em", textTransform: "uppercase", lineHeight: 1.3 }}>DAT<br />Core</span>
              </div>
            </div>
          </div>

          <div className="re-ecosystem-grid">
            {ecosystemNodes.map((node, i) => {
              const colors = ["#FFCC00", "#6C00AF", "#2493A9"];
              const c = colors[i % 3];
              const bg = i % 3 === 0 ? "rgba(255,204,0,0.06)" : i % 3 === 1 ? "rgba(108,0,175,0.07)" : "rgba(36,147,169,0.07)";
              const border = i % 3 === 0 ? "rgba(255,204,0,0.25)" : i % 3 === 1 ? "rgba(108,0,175,0.28)" : "rgba(36,147,169,0.28)";
              return (
                <div key={node.label} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 14, padding: "1.2rem 1rem", textAlign: "center" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: c, margin: "0 auto 0.6rem" }} />
                  <h4 style={{ margin: "0 0 0.35rem", fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: "0.85rem", fontWeight: 700, color: c }}>
                    {node.label}
                  </h4>
                  <p style={{ margin: 0, fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.75rem", color: "rgba(242,242,242,0.55)", lineHeight: 1.5 }}>
                    {node.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── PHOTO STRIP ───────────────────────────────────────── */}
      <section style={{ paddingTop: "1rem", paddingBottom: 0 }}>
        <JoinTheJourneyPanel variant="photos-only" />
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section style={{ background: "#6C00AF", padding: "5rem 2rem" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <span style={{ display: "block", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "#FFCC00", marginBottom: "0.85rem", textAlign: "center" }}>
            Be Part of the Ripple
          </span>
          <h2 style={{ margin: "0 0 1rem", fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", fontWeight: 800, color: "#f2f2f2", lineHeight: 1.2, textAlign: "center" }}>
            The next ripple is already in motion.
          </h2>
          <p style={{ margin: "0 0 3rem", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "clamp(0.95rem, 1.6vw, 1.1rem)", color: "rgba(242,242,242,0.83)", lineHeight: 1.7, maxWidth: 700, marginLeft: "auto", marginRight: "auto", textAlign: "center" }}>
            Ripples need conditions to grow. Those conditions are programs, relationships, time, and resources. You can help create them.
          </p>

          <div className="re-cta-grid">
            {[
              {
                heading: "Alumni",
                body: "You carry something from your time with DAT. We'd love to hear where it went. Share your ripple story — your company, your classroom, your community, your creative path.",
                cta: "Share Your Story",
                href: "mailto:info@dramaticadventure.com?subject=My%20Ripple%20Story",
                border: "rgba(255,204,0,0.35)",
                bg: "rgba(255,204,0,0.08)",
                ctaColor: "#FFCC00",
                ctaBg: "rgba(255,204,0,0.15)",
                ctaBorder: "rgba(255,204,0,0.4)",
              },
              {
                heading: "Partners",
                body: "Organizations, universities, community partners, and collaborators: ripples happen at the intersection of committed relationships. Let's build the next one.",
                cta: "Start the Conversation",
                href: "mailto:info@dramaticadventure.com?subject=Partnership%20Inquiry",
                border: "rgba(255,255,255,0.2)",
                bg: "rgba(255,255,255,0.05)",
                ctaColor: "#f2f2f2",
                ctaBg: "rgba(255,255,255,0.1)",
                ctaBorder: "rgba(255,255,255,0.3)",
              },
              {
                heading: "Donors",
                body: "The ripple effect is possible because programs exist. Because artists travel. Because communities are met with respect and resources. Your support funds those conditions.",
                cta: "Fund the Conditions",
                href: "/donate",
                border: "rgba(255,204,0,0.35)",
                bg: "rgba(255,204,0,0.08)",
                ctaColor: "#FFCC00",
                ctaBg: "rgba(255,204,0,0.15)",
                ctaBorder: "rgba(255,204,0,0.4)",
              },
            ].map((cta) => (
              <div
                key={cta.heading}
                style={{ background: cta.bg, border: `1.5px solid ${cta.border}`, borderRadius: 18, padding: "2rem 1.75rem", display: "flex", flexDirection: "column", gap: "0.85rem" }}
              >
                <h3 style={{ margin: 0, fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: "1.2rem", fontWeight: 800, color: "#f2f2f2" }}>
                  {cta.heading}
                </h3>
                <p style={{ margin: 0, fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.9rem", lineHeight: 1.7, color: "rgba(242,242,242,0.82)", flex: 1 }}>
                  {cta.body}
                </p>
                <a
                  href={cta.href}
                  style={{ alignSelf: "flex-start", marginTop: "0.25rem", padding: "0.7rem 1.2rem", borderRadius: 12, background: cta.ctaBg, border: `1.5px solid ${cta.ctaBorder}`, fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: cta.ctaColor, textDecoration: "none" }}
                >
                  {cta.cta} →
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <style>{`
        .re-ripple-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
        }
        @media (max-width: 900px) { .re-ripple-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 560px) { .re-ripple-grid { grid-template-columns: 1fr; } }

        .re-ripple-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 14px 40px rgba(0,0,0,0.25);
        }

        .re-feature-card {
          grid-template-columns: 1fr 1fr;
        }
        @media (max-width: 780px) {
          .re-feature-card {
            grid-template-columns: 1fr !important;
          }
          .re-feature-card > div:first-child {
            min-height: 220px !important;
          }
        }

        .re-placeholder-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
          margin-top: 1.25rem;
        }
        @media (max-width: 860px) { .re-placeholder-grid { grid-template-columns: 1fr; } }

        .re-why-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2.5rem 3.5rem;
        }
        @media (max-width: 700px) { .re-why-grid { grid-template-columns: 1fr; gap: 2rem; } }

        .re-ecosystem-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }
        @media (max-width: 700px) { .re-ecosystem-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 440px) { .re-ecosystem-grid { grid-template-columns: 1fr; } }

        .re-cta-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
        }
        @media (max-width: 860px) { .re-cta-grid { grid-template-columns: 1fr; } }
      `}</style>
    </main>
  );
}
