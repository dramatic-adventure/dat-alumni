// app/minga/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, FormEvent, useRef, useEffect } from "react";

/* ─── Collaboration modes ─────────────────────────────────── */
const collaborationModes = [
  {
    label: "Drama Clubs",
    desc: "Ongoing creative homes where young people gather, devise, and perform. Drama Clubs grow from residencies and continue long after — sustained by local artists, educators, and DAT teaching artists.",
    accent: "#FFCC00",
    border: "rgba(255,204,0,0.4)",
    bg: "rgba(255,204,0,0.07)",
  },
  {
    label: "Workshops & Residencies",
    desc: "Intensive theatre-making processes anchored in a community's stories. DAT artists work alongside local facilitators to build skills, deepen confidence, and create work that belongs to the people who made it.",
    accent: "#2493A9",
    border: "rgba(36,147,169,0.4)",
    bg: "rgba(36,147,169,0.07)",
  },
  {
    label: "Community-Devised Performance",
    desc: "Full productions built from the ground up with community members as co-creators. Not imported scripts — original work drawn from local history, folklore, experience, and imagination.",
    accent: "#6C00AF",
    border: "rgba(108,0,175,0.4)",
    bg: "rgba(108,0,175,0.07)",
  },
  {
    label: "Local Artist Partnerships",
    desc: "Pathways for emerging local artists to build their practice, connect with DAT's global network, and lead creative work in their own communities — through programs like ACTion, RAW, CASTAWAY, and PASSAGE.",
    accent: "#D9A919",
    border: "rgba(217,169,25,0.4)",
    bg: "rgba(217,169,25,0.07)",
  },
  {
    label: "Cultural Preservation Projects",
    desc: "Storytelling initiatives that center elders, traditional art forms, local history, and community memory — ensuring living cultures are carried forward by those who will inherit them.",
    accent: "#2493A9",
    border: "rgba(36,147,169,0.4)",
    bg: "rgba(36,147,169,0.07)",
  },
];

/* ─── Values ─────────────────────────────────────────────── */
const values = [
  {
    title: "Local Leadership",
    body: "Strong partnerships begin with local people leading the work. We look for communities with artists, educators, and leaders who are already doing the work and ready to deepen it.",
  },
  {
    title: "Reciprocity",
    body: "MINGA is a two-way relationship. DAT learns as much as it contributes. We want to be changed by the communities we work with — not the other way around.",
  },
  {
    title: "Long-Term Possibility",
    body: "We are not interested in one-off programs. We are looking for communities serious about building something that outlasts any single residency or visit.",
  },
  {
    title: "Artistic Seriousness",
    body: "Theatre is the tool, not the decoration. We want partners who believe in the transformative power of imagination, story, and creative rigor.",
  },
  {
    title: "Youth & Community Benefit",
    body: "Every project must create genuine opportunity and meaning for young people and the broader community — not for outside audiences or institutional résumés.",
  },
  {
    title: "Cultural Humility",
    body: "We bring craft. Communities bring knowledge, story, and context. No partnership works without deep respect for what communities already know and carry.",
  },
  {
    title: "Practical Feasibility",
    body: "Good intentions don't make projects work. We need partners who can commit time, local coordination, and the practical support that makes sustained work possible.",
  },
  {
    title: "Safety & Trust",
    body: "Every project requires a foundation of safety, consent, and mutual trust — for young people, community members, and artists alike.",
  },
];

/* ─── Partner types ──────────────────────────────────────── */
const partnerTypes = [
  {
    label: "Community Organizations",
    desc: "Nonprofits, cultural centers, and grassroots organizations already embedded in their communities and looking to deepen the work.",
  },
  {
    label: "Schools & Education Partners",
    desc: "Schools, teachers, and education leaders seeking a sustained creative practice that builds real skills and lasting confidence.",
  },
  {
    label: "Local Arts Organizations",
    desc: "Regional theatres, cultural institutions, and arts groups ready to co-create new work rooted in their communities' stories.",
  },
  {
    label: "Indigenous & Cultural Communities",
    desc: "Communities working to preserve and carry forward traditional art forms, oral histories, and cultural memory through living practice.",
  },
  {
    label: "Local & Municipal Leaders",
    desc: "Mayors, community councils, and civic leaders who see storytelling as a genuine community development tool.",
  },
  {
    label: "Social Impact Foundations",
    desc: "Funders who want to support long-term, community-embedded creative work that generates real, measurable transformation.",
  },
];

export default function MingaPage() {
  const heroRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    org: "",
    location: "",
    contact: "",
    partnerType: "",
    hopeToBuild: "",
    whoServed: "",
    localPartners: "",
    timeline: "",
    resources: "",
    whyDat: "",
  });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const handle = () => {
      el.style.transform = `translateY(${window.scrollY * 0.28}px)`;
    };
    window.addEventListener("scroll", handle, { passive: true });
    return () => window.removeEventListener("scroll", handle);
  }, []);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const subject = encodeURIComponent(
      `MINGA Inquiry: ${formData.org || "Community Partner"}`
    );
    const body = encodeURIComponent(
      [
        `Organization / Community: ${formData.org}`,
        `Location: ${formData.location}`,
        `Contact Person: ${formData.contact}`,
        `Type of Partner: ${formData.partnerType}`,
        `What We Hope to Build Together:\n${formData.hopeToBuild}`,
        `Who the Project Would Serve:\n${formData.whoServed}`,
        `Local Partners Already Involved:\n${formData.localPartners}`,
        `Ideal Timeline: ${formData.timeline}`,
        `Resources / Support Available:\n${formData.resources}`,
        `Why DAT Feels Like the Right Fit:\n${formData.whyDat}`,
      ].join("\n\n")
    );
    window.location.href = `mailto:contact@dramaticadventure.com?subject=${subject}&body=${body}`;
    setSubmitted(true);
  }

  return (
    <main style={{ background: "transparent", overflowX: "hidden" }}>

      {/* ══ HERO ════════════════════════════════════════════════ */}
      <section
        style={{
          position: "relative",
          height: "90vh",
          minHeight: 580,
          overflow: "hidden",
          display: "flex",
          alignItems: "flex-end",
        }}
      >
        <div
          ref={heroRef}
          style={{ position: "absolute", inset: "-15% 0", willChange: "transform" }}
        >
          <Image
            src="/images/teaching-amazon.jpg"
            alt="DAT artists building community theatre in the Amazon"
            fill
            priority
            sizes="100vw"
            style={{ objectFit: "cover", objectPosition: "center 40%" }}
          />
        </div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(36,17,35,0.12) 0%, rgba(36,17,35,0.52) 45%, rgba(36,17,35,0.95) 100%)",
          }}
        />
        <div
          style={{
            position: "relative",
            zIndex: 2,
            width: "90vw",
            maxWidth: 1100,
            margin: "0 auto 7vh",
            padding: "0 1rem",
          }}
        >
          <span
            style={{
              display: "block",
              fontFamily: "var(--font-dm-sans), sans-serif",
              fontSize: "0.72rem",
              fontWeight: 700,
              letterSpacing: "0.26em",
              textTransform: "uppercase",
              color: "#FFCC00",
              marginBottom: "0.6rem",
            }}
          >
            Dramatic Adventure Theatre
          </span>
          <h1
            style={{
              margin: 0,
              fontFamily: "var(--font-anton), sans-serif",
              fontSize: "clamp(4.5rem, 14vw, 11rem)",
              lineHeight: 0.88,
              textTransform: "uppercase",
              color: "#f2f2f2",
              textShadow: "0 6px 40px rgba(0,0,0,0.65)",
              letterSpacing: "0.04em",
            }}
          >
            MINGA
          </h1>
          <h2
            style={{
              margin: "0.65rem 0 0",
              fontFamily: "var(--font-space-grotesk), sans-serif",
              fontSize: "clamp(1rem, 2.4vw, 1.65rem)",
              fontWeight: 600,
              color: "rgba(242,242,242,0.78)",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            Community Partnerships
          </h2>
          <p
            style={{
              margin: "1.5rem 0 0",
              fontFamily: "var(--font-dm-sans), sans-serif",
              fontSize: "clamp(1rem, 1.8vw, 1.2rem)",
              fontWeight: 500,
              color: "rgba(242,242,242,0.86)",
              maxWidth: 580,
              lineHeight: 1.65,
            }}
          >
            We build with communities, not around them. A MINGA begins when
            people decide the work is worth doing together.
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.85rem",
              marginTop: "2rem",
            }}
          >
            <a href="#inquiry" className="minga-btn-yellow">
              Start a Conversation
            </a>
            <a href="#what-is-minga" className="minga-btn-ghost">
              What Is MINGA?
            </a>
          </div>
        </div>
      </section>

      {/* ══ WHAT MINGA MEANS ════════════════════════════════════ */}
      <section
        id="what-is-minga"
        style={{ background: "#241123", padding: "5rem 2rem" }}
      >
        <div style={{ maxWidth: 820, margin: "0 auto", textAlign: "center" }}>
          <span
            style={{
              display: "block",
              fontFamily: "var(--font-dm-sans), sans-serif",
              fontSize: "0.7rem",
              fontWeight: 700,
              letterSpacing: "0.26em",
              textTransform: "uppercase",
              color: "#FFCC00",
              marginBottom: "1.5rem",
            }}
          >
            What MINGA Means
          </span>
          <div
            style={{
              fontFamily: "var(--font-gloucester), serif",
              fontSize: "7rem",
              lineHeight: 0.55,
              color: "#FFCC00",
              opacity: 0.22,
              marginBottom: "-0.25rem",
            }}
          >
            "
          </div>
          <p
            style={{
              margin: 0,
              fontFamily: "var(--font-space-grotesk), sans-serif",
              fontSize: "clamp(1.2rem, 2.3vw, 1.85rem)",
              fontWeight: 700,
              color: "#f2f2f2",
              lineHeight: 1.5,
            }}
          >
            In Quechua tradition, a minga is communal work — people gathering
            to build something together that benefits everyone. No hierarchy.
            No outside saviors. Just shared labor in service of shared life.
          </p>
          <p
            style={{
              margin: "2rem auto 0",
              maxWidth: 680,
              fontFamily: "var(--font-dm-sans), sans-serif",
              fontSize: "clamp(0.97rem, 1.6vw, 1.1rem)",
              color: "rgba(242,242,242,0.75)",
              lineHeight: 1.8,
            }}
          >
            DAT chose this word deliberately. Theatre is not the gift we bring
            to a community. It is the tool we use together to help a community
            make more room for its own stories. We are not looking for places
            to perform impact. We are looking for partners ready to build it.
          </p>
          <div
            style={{
              marginTop: "2.5rem",
              padding: "1.6rem 2rem",
              background: "rgba(255,204,0,0.06)",
              border: "1px solid rgba(255,204,0,0.22)",
              borderRadius: "16px",
              maxWidth: 640,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            <p
              style={{
                margin: 0,
                fontFamily: "var(--font-rock-salt), cursive",
                fontSize: "clamp(0.82rem, 1.3vw, 1rem)",
                color: "#FFCC00",
                lineHeight: 1.9,
                opacity: 0.9,
              }}
            >
              "A strong partnership begins with local leadership, shared trust,
              and a story that belongs to the people living it."
            </p>
          </div>
        </div>
      </section>

      {/* ══ WHO THIS IS FOR ══════════════════════════════════════ */}
      <section style={{ padding: "4.5rem 2rem", background: "#f7f3ef" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ maxWidth: 640, marginBottom: "2.5rem" }}>
            <span
              style={{
                display: "inline-block",
                fontFamily: "var(--font-dm-sans), sans-serif",
                fontSize: "0.7rem",
                fontWeight: 700,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "#6C00AF",
                marginBottom: "0.6rem",
              }}
            >
              Who This Is For
            </span>
            <h2
              style={{
                margin: "0 0 0.75rem",
                fontFamily: "var(--font-space-grotesk), sans-serif",
                fontSize: "clamp(2rem, 4vw, 2.8rem)",
                fontWeight: 800,
                color: "#241123",
                lineHeight: 1.15,
              }}
            >
              Serious partners.
              <br />
              Real communities.
            </h2>
            <p
              style={{
                margin: 0,
                fontFamily: "var(--font-dm-sans), sans-serif",
                fontSize: "clamp(0.95rem, 1.6vw, 1.1rem)",
                color: "rgba(36,17,35,0.75)",
                lineHeight: 1.7,
              }}
            >
              MINGA is for communities, organizations, and leaders who believe
              that theatre and storytelling are tools for voice, confidence,
              memory, imagination, and possibility — and who are ready to do
              the work of building that together with DAT.
            </p>
          </div>
          <div className="minga-who-grid">
            {partnerTypes.map((pt) => (
              <div key={pt.label} className="minga-who-card">
                <h3
                  style={{
                    margin: "0 0 0.5rem",
                    fontFamily: "var(--font-space-grotesk), sans-serif",
                    fontSize: "1rem",
                    fontWeight: 800,
                    color: "#6C00AF",
                  }}
                >
                  {pt.label}
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontFamily: "var(--font-dm-sans), sans-serif",
                    fontSize: "0.88rem",
                    lineHeight: 1.65,
                    color: "rgba(36,17,35,0.8)",
                  }}
                >
                  {pt.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ HOW DAT COLLABORATES ════════════════════════════════ */}
      <section style={{ padding: "4.5rem 2rem", background: "#0d1f26" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ maxWidth: 640, marginBottom: "2.5rem" }}>
            <span
              style={{
                display: "inline-block",
                fontFamily: "var(--font-dm-sans), sans-serif",
                fontSize: "0.7rem",
                fontWeight: 700,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "#2493A9",
                marginBottom: "0.6rem",
              }}
            >
              How DAT Collaborates
            </span>
            <h2
              style={{
                margin: "0 0 0.75rem",
                fontFamily: "var(--font-space-grotesk), sans-serif",
                fontSize: "clamp(2rem, 4vw, 2.8rem)",
                fontWeight: 800,
                color: "#f2f2f2",
                lineHeight: 1.15,
              }}
            >
              Many forms. One ethos.
            </h2>
            <p
              style={{
                margin: 0,
                fontFamily: "var(--font-dm-sans), sans-serif",
                fontSize: "clamp(0.95rem, 1.6vw, 1.1rem)",
                color: "rgba(242,242,242,0.7)",
                lineHeight: 1.7,
              }}
            >
              DAT&apos;s community partnerships take many shapes. What stays
              constant is the approach: process over product, community voice
              at the center, and local artists as co-creators — not recipients.
            </p>
          </div>

          <div className="minga-collab-grid">
            {collaborationModes.map((mode) => (
              <div
                key={mode.label}
                className="minga-collab-card"
                style={
                  {
                    "--ca": mode.accent,
                    "--cb": mode.border,
                    "--cc": mode.bg,
                  } as React.CSSProperties
                }
              >
                <div className="minga-collab-pill">{mode.label}</div>
                <p
                  style={{
                    margin: 0,
                    fontFamily: "var(--font-dm-sans), sans-serif",
                    fontSize: "0.88rem",
                    lineHeight: 1.7,
                    color: "rgba(242,242,242,0.78)",
                  }}
                >
                  {mode.desc}
                </p>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: "2.5rem",
              padding: "1.5rem 2rem",
              background: "rgba(36,147,169,0.1)",
              border: "1px solid rgba(36,147,169,0.3)",
              borderRadius: "16px",
              maxWidth: 780,
            }}
          >
            <span
              style={{
                display: "block",
                fontFamily: "var(--font-dm-sans), sans-serif",
                fontSize: "0.65rem",
                fontWeight: 700,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "#2493A9",
                marginBottom: "0.6rem",
              }}
            >
              Programs Connected to Community Work
            </span>
            <p
              style={{
                margin: 0,
                fontFamily: "var(--font-dm-sans), sans-serif",
                fontSize: "0.9rem",
                lineHeight: 1.75,
                color: "rgba(242,242,242,0.8)",
              }}
            >
              Local artists connected through MINGA partnerships may find
              pathways into DAT&apos;s broader ecosystem — including{" "}
              <strong style={{ color: "#FFCC00" }}>ACTion</strong> (immersive
              community residencies),{" "}
              <strong style={{ color: "#FFCC00" }}>RAW</strong> (new work
              development), <strong style={{ color: "#FFCC00" }}>CASTAWAY</strong>{" "}
              (island-based creation labs), and{" "}
              <strong style={{ color: "#FFCC00" }}>PASSAGE</strong> (long-form
              ensemble journeys). These are not separate tracks — they are
              extensions of the same ongoing relationship.
            </p>
          </div>
        </div>
      </section>

      {/* ══ WHAT WE LOOK FOR ════════════════════════════════════ */}
      <section style={{ padding: "4.5rem 2rem" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ maxWidth: 640, marginBottom: "2.5rem" }}>
            <span
              style={{
                display: "inline-block",
                fontFamily: "var(--font-dm-sans), sans-serif",
                fontSize: "0.7rem",
                fontWeight: 700,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "#6C00AF",
                marginBottom: "0.6rem",
              }}
            >
              What We Look For
            </span>
            <h2
              style={{
                margin: "0 0 0.75rem",
                fontFamily: "var(--font-space-grotesk), sans-serif",
                fontSize: "clamp(2rem, 4vw, 2.8rem)",
                fontWeight: 800,
                color: "#241123",
                lineHeight: 1.15,
              }}
            >
              Not every invitation
              <br />
              is the right one.
            </h2>
            <p
              style={{
                margin: 0,
                fontFamily: "var(--font-dm-sans), sans-serif",
                fontSize: "clamp(0.95rem, 1.6vw, 1.1rem)",
                color: "rgba(36,17,35,0.75)",
                lineHeight: 1.7,
              }}
            >
              DAT cannot say yes to every inquiry. We look for genuine
              alignment across a set of values that make the work sustainable,
              meaningful, and honest.
            </p>
          </div>
          <div className="minga-values-grid">
            {values.map((v) => (
              <div key={v.title} className="minga-value-card">
                <h3
                  style={{
                    margin: "0 0 0.5rem",
                    fontFamily: "var(--font-space-grotesk), sans-serif",
                    fontSize: "1rem",
                    fontWeight: 800,
                    color: "#6C00AF",
                  }}
                >
                  {v.title}
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontFamily: "var(--font-dm-sans), sans-serif",
                    fontSize: "0.87rem",
                    lineHeight: 1.65,
                    color: "rgba(36,17,35,0.78)",
                  }}
                >
                  {v.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ WHAT WE CANNOT PROMISE ══════════════════════════════ */}
      <section style={{ background: "#241123", padding: "4.5rem 2rem" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <span
            style={{
              display: "block",
              fontFamily: "var(--font-dm-sans), sans-serif",
              fontSize: "0.7rem",
              fontWeight: 700,
              letterSpacing: "0.26em",
              textTransform: "uppercase",
              color: "#FFCC00",
              marginBottom: "0.8rem",
            }}
          >
            What We Cannot Promise
          </span>
          <h2
            style={{
              margin: "0 0 2rem",
              fontFamily: "var(--font-space-grotesk), sans-serif",
              fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)",
              fontWeight: 800,
              color: "#f2f2f2",
              lineHeight: 1.2,
            }}
          >
            Honesty is part of the work.
          </h2>
          <div className="minga-limits-grid">
            {[
              {
                label: "We cannot accept every invitation.",
                body: "DAT's capacity is real, and our commitments run deep. An inquiry is the beginning of a conversation — not a reservation.",
              },
              {
                label: "We do not parachute in.",
                body: "A visit without sustained relationship, local leadership, and preparation is not a DAT partnership. We are not interested in fly-in, fly-out impact theater.",
              },
              {
                label: "We do not impose stories on communities.",
                body: "Devised work is built with communities — not for them. We do not arrive with scripts, narratives, or conclusions already written.",
              },
              {
                label: "Projects require real resources.",
                body: "Meaningful work requires genuine investment: time, local coordination, financial support, and community commitment. We are happy to discuss what that looks like, but we cannot wave it away.",
              },
            ].map((l) => (
              <div key={l.label} className="minga-limit-item">
                <div className="minga-limit-dot" />
                <div>
                  <strong
                    style={{
                      display: "block",
                      fontFamily: "var(--font-space-grotesk), sans-serif",
                      fontSize: "0.97rem",
                      fontWeight: 800,
                      color: "#FFCC00",
                      marginBottom: "0.4rem",
                    }}
                  >
                    {l.label}
                  </strong>
                  <p
                    style={{
                      margin: 0,
                      fontFamily: "var(--font-dm-sans), sans-serif",
                      fontSize: "0.88rem",
                      lineHeight: 1.7,
                      color: "rgba(242,242,242,0.72)",
                    }}
                  >
                    {l.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ INQUIRY ═════════════════════════════════════════════ */}
      <section id="inquiry" style={{ padding: "5rem 2rem", background: "#f7f3ef" }}>
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          <div style={{ maxWidth: 640, marginBottom: "2.5rem" }}>
            <span
              style={{
                display: "inline-block",
                fontFamily: "var(--font-dm-sans), sans-serif",
                fontSize: "0.7rem",
                fontWeight: 700,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "#6C00AF",
                marginBottom: "0.6rem",
              }}
            >
              Start a Conversation
            </span>
            <h2
              style={{
                margin: "0 0 0.75rem",
                fontFamily: "var(--font-space-grotesk), sans-serif",
                fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)",
                fontWeight: 800,
                color: "#241123",
                lineHeight: 1.2,
              }}
            >
              Tell us who you are.
              <br />
              Tell us what you want to build.
            </h2>
            <p
              style={{
                margin: 0,
                fontFamily: "var(--font-dm-sans), sans-serif",
                fontSize: "clamp(0.95rem, 1.6vw, 1.05rem)",
                color: "rgba(36,17,35,0.72)",
                lineHeight: 1.75,
              }}
            >
              We read every inquiry personally. If there&apos;s genuine
              alignment, we&apos;ll reach out for a real conversation.
              There&apos;s no rush, no sales process, and no promise — just
              two parties figuring out if the work is worth building together.
            </p>
          </div>

          {submitted ? (
            <div
              style={{
                padding: "2.5rem",
                background: "rgba(108,0,175,0.06)",
                border: "1.5px solid rgba(108,0,175,0.28)",
                borderRadius: "18px",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontFamily: "var(--font-space-grotesk), sans-serif",
                  fontSize: "1.2rem",
                  fontWeight: 800,
                  color: "#6C00AF",
                }}
              >
                Your email client should be opening now.
              </p>
              <p
                style={{
                  margin: "0.75rem 0 0",
                  fontFamily: "var(--font-dm-sans), sans-serif",
                  fontSize: "0.93rem",
                  color: "rgba(36,17,35,0.7)",
                  lineHeight: 1.65,
                }}
              >
                If it didn&apos;t open automatically, send your inquiry
                directly to{" "}
                <a
                  href="mailto:contact@dramaticadventure.com"
                  style={{ color: "#6C00AF", fontWeight: 700 }}
                >
                  contact@dramaticadventure.com
                </a>
                . We&apos;ll be in touch.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
            >
              <div className="minga-form-row">
                <div className="minga-field">
                  <label className="minga-label">
                    Organization or Community Name
                  </label>
                  <input
                    className="minga-input"
                    name="org"
                    value={formData.org}
                    onChange={handleChange}
                    placeholder="e.g. Comunidad Shuar de Gualaquiza"
                    required
                  />
                </div>
                <div className="minga-field">
                  <label className="minga-label">Location</label>
                  <input
                    className="minga-input"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="City, Region, Country"
                    required
                  />
                </div>
              </div>

              <div className="minga-form-row">
                <div className="minga-field">
                  <label className="minga-label">Contact Person</label>
                  <input
                    className="minga-input"
                    name="contact"
                    value={formData.contact}
                    onChange={handleChange}
                    placeholder="Name and email address"
                    required
                  />
                </div>
                <div className="minga-field">
                  <label className="minga-label">Type of Partner</label>
                  <select
                    className="minga-input"
                    name="partnerType"
                    value={formData.partnerType}
                    onChange={handleChange}
                  >
                    <option value="">Select one…</option>
                    <option value="Community Organization">
                      Community Organization
                    </option>
                    <option value="School / Education Partner">
                      School / Education Partner
                    </option>
                    <option value="Local Arts Organization">
                      Local Arts Organization
                    </option>
                    <option value="Indigenous / Cultural Community">
                      Indigenous / Cultural Community
                    </option>
                    <option value="Local / Municipal Government">
                      Local / Municipal Government
                    </option>
                    <option value="Foundation / Funder">
                      Foundation / Funder
                    </option>
                    <option value="Something Else">Something Else</option>
                  </select>
                </div>
              </div>

              <div className="minga-field">
                <label className="minga-label">
                  What do you hope to build together?
                </label>
                <textarea
                  className="minga-textarea"
                  name="hopeToBuild"
                  value={formData.hopeToBuild}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Tell us about the work you're imagining. What would success look like in five years?"
                  required
                />
              </div>

              <div className="minga-field">
                <label className="minga-label">
                  Who would the project serve?
                </label>
                <textarea
                  className="minga-textarea"
                  name="whoServed"
                  value={formData.whoServed}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Young people? A specific cultural community? An underserved neighborhood? Tell us who this is for."
                />
              </div>

              <div className="minga-form-row">
                <div className="minga-field">
                  <label className="minga-label">
                    Local partners already involved
                  </label>
                  <input
                    className="minga-input"
                    name="localPartners"
                    value={formData.localPartners}
                    onChange={handleChange}
                    placeholder="Artists, educators, community orgs…"
                  />
                </div>
                <div className="minga-field">
                  <label className="minga-label">Ideal timeline</label>
                  <input
                    className="minga-input"
                    name="timeline"
                    value={formData.timeline}
                    onChange={handleChange}
                    placeholder="e.g. Starting in 2026, 3-year horizon"
                  />
                </div>
              </div>

              <div className="minga-field">
                <label className="minga-label">
                  Resources and support available
                </label>
                <textarea
                  className="minga-textarea"
                  name="resources"
                  value={formData.resources}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Local coordination, facilities, partial funding, in-kind support — what can your organization bring to the partnership?"
                />
              </div>

              <div className="minga-field">
                <label className="minga-label">
                  Why does DAT feel like the right fit?
                </label>
                <textarea
                  className="minga-textarea"
                  name="whyDat"
                  value={formData.whyDat}
                  onChange={handleChange}
                  rows={4}
                  placeholder="What drew you to DAT specifically? What in DAT's approach aligns with what you're trying to build?"
                />
              </div>

              <div style={{ paddingTop: "0.5rem" }}>
                <button type="submit" className="minga-btn-submit">
                  Send Inquiry →
                </button>
                <p
                  style={{
                    marginTop: "0.75rem",
                    fontFamily: "var(--font-dm-sans), sans-serif",
                    fontSize: "0.78rem",
                    color: "rgba(36,17,35,0.45)",
                    lineHeight: 1.5,
                  }}
                >
                  This will open your email client with your responses
                  pre-filled. No data is stored on our end.
                </p>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* ══ CLOSING QUOTE BAND ══════════════════════════════════ */}
      <section style={{ background: "#6C00AF", padding: "4.5rem 2rem" }}>
        <div style={{ maxWidth: 780, margin: "0 auto", textAlign: "center" }}>
          <div
            style={{
              fontFamily: "var(--font-gloucester), serif",
              fontSize: "8rem",
              lineHeight: 0.55,
              color: "#FFCC00",
              opacity: 0.22,
              marginBottom: "-0.5rem",
            }}
          >
            "
          </div>
          <blockquote
            style={{
              margin: 0,
              fontFamily: "var(--font-rock-salt), cursive",
              fontSize: "clamp(0.88rem, 1.7vw, 1.2rem)",
              lineHeight: 1.9,
              color: "#f2f2f2",
              fontStyle: "normal",
            }}
          >
            We aren&apos;t going to change the world, but we have the chance
            to change the world of a child.
          </blockquote>
          <div
            style={{
              marginTop: "2.75rem",
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: "0.85rem",
            }}
          >
            <Link href="/drama-club" className="minga-btn-yellow">
              Explore Drama Clubs
            </Link>
            <Link href="/programs" className="minga-btn-outline-light">
              Programs for Artists
            </Link>
            <Link href="/partners" className="minga-btn-outline-light">
              All Partnership Pathways
            </Link>
          </div>
        </div>
      </section>

      {/* ══ SCOPED STYLES ═══════════════════════════════════════ */}
      <style>{`
        /* ── Buttons ─────────────────────────────────────── */
        .minga-btn-yellow {
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
          cursor: pointer;
        }
        .minga-btn-yellow:hover { transform: translateY(-2px); background: #e6b800; }

        .minga-btn-ghost {
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
        .minga-btn-ghost:hover { transform: translateY(-2px); background: rgba(242,242,242,0.2); }

        .minga-btn-outline-light {
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
        .minga-btn-outline-light:hover { transform: translateY(-2px); background: rgba(242,242,242,0.1); }

        .minga-btn-submit {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 1rem 2.2rem;
          border-radius: 14px;
          background: #6C00AF;
          color: #f2f2f2;
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          border: none;
          cursor: pointer;
          transition: transform 150ms ease, background 150ms ease;
        }
        .minga-btn-submit:hover { transform: translateY(-2px); background: #5a009a; }

        /* ── Who grid ────────────────────────────────────── */
        .minga-who-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
        }
        @media (max-width: 900px) { .minga-who-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 560px) { .minga-who-grid { grid-template-columns: 1fr; } }

        .minga-who-card {
          background: rgba(255,255,255,0.78);
          border: 1px solid rgba(108,0,175,0.14);
          border-radius: 16px;
          padding: 1.4rem 1.25rem;
          transition: transform 180ms ease, box-shadow 180ms ease;
        }
        .minga-who-card:hover { transform: translateY(-3px); box-shadow: 0 10px 28px rgba(108,0,175,0.1); }

        /* ── Collab grid ─────────────────────────────────── */
        .minga-collab-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
        }
        @media (max-width: 900px) { .minga-collab-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 560px) { .minga-collab-grid { grid-template-columns: 1fr; } }

        .minga-collab-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--cb);
          border-radius: 16px;
          padding: 1.4rem 1.3rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          transition: transform 180ms ease, background 180ms ease;
        }
        .minga-collab-card:hover { transform: translateY(-3px); background: var(--cc); }

        .minga-collab-pill {
          display: inline-block;
          align-self: flex-start;
          padding: 0.25rem 0.75rem;
          border-radius: 8px;
          background: var(--cc);
          border: 1px solid var(--cb);
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--ca);
        }

        /* ── Values grid ─────────────────────────────────── */
        .minga-values-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.25rem;
        }
        @media (max-width: 1000px) { .minga-values-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 560px) { .minga-values-grid { grid-template-columns: 1fr; } }

        .minga-value-card {
          background: rgba(255,255,255,0.75);
          border: 1px solid rgba(108,0,175,0.14);
          border-radius: 16px;
          padding: 1.3rem 1.2rem;
          transition: transform 180ms ease, box-shadow 180ms ease;
        }
        .minga-value-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(108,0,175,0.09); }

        /* ── Limits ──────────────────────────────────────── */
        .minga-limits-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.75rem;
        }
        @media (max-width: 680px) { .minga-limits-grid { grid-template-columns: 1fr; } }

        .minga-limit-item {
          display: flex;
          gap: 1rem;
          align-items: flex-start;
        }

        .minga-limit-dot {
          flex-shrink: 0;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #FFCC00;
          margin-top: 0.3rem;
        }

        /* ── Form ────────────────────────────────────────── */
        .minga-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
        }
        @media (max-width: 640px) { .minga-form-row { grid-template-columns: 1fr; } }

        .minga-field {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .minga-label {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.73rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(36,17,35,0.6);
        }

        .minga-input,
        .minga-textarea {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.92rem;
          color: #241123;
          background: #fff;
          border: 1.5px solid rgba(36,17,35,0.2);
          border-radius: 10px;
          padding: 0.75rem 1rem;
          outline: none;
          transition: border-color 150ms ease, box-shadow 150ms ease;
          resize: vertical;
          width: 100%;
          box-sizing: border-box;
          appearance: none;
        }
        .minga-input:focus,
        .minga-textarea:focus {
          border-color: #6C00AF;
          box-shadow: 0 0 0 3px rgba(108,0,175,0.11);
        }
        .minga-input::placeholder,
        .minga-textarea::placeholder {
          color: rgba(36,17,35,0.32);
          font-style: italic;
        }
      `}</style>
    </main>
  );
}
