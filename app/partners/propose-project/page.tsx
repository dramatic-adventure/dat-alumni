// app/partners/propose-project/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, FormEvent, Suspense } from "react";
import { useSearchParams } from "next/navigation";

/* ─── Partnership type options ─── */
const PARTNER_TYPES = [
  { value: "university", label: "University / Study Abroad Program" },
  { value: "corporate", label: "Corporate / CSR Initiative" },
  { value: "adventure-day", label: "Adventure Day" },
  { value: "artist-sponsorship", label: "Artist Sponsorship" },
  { value: "drama-club", label: "Drama Club Sponsorship" },
  { value: "foundation", label: "Foundation / Grant Partnership" },
  { value: "municipal", label: "Municipality / Government Body" },
  { value: "cultural-org", label: "Cultural Organization" },
  { value: "custom", label: "Something Else Entirely" },
];

/* ─── What happens after ─── */
const nextSteps = [
  {
    icon: "📬",
    step: "We read your proposal",
    desc: "Every submission is read personally by DAT's partnership team — usually within 3–5 business days.",
  },
  {
    icon: "☎️",
    step: "We reach out",
    desc: "If there's a good fit, we'll schedule a call to learn more about your vision, your community, and what you're hoping to build.",
  },
  {
    icon: "✏️",
    step: "We co-design",
    desc: "Together, we shape a program, initiative, or partnership that works for both our organizations.",
  },
  {
    icon: "🚀",
    step: "We launch",
    desc: "We handle the logistics. You get to be part of something unforgettable.",
  },
];

/* ─── Inner form component (needs useSearchParams) ─── */
function ProposeForm() {
  const params = useSearchParams();
  const preselectedType = params?.get("type") ?? "";

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    org: "",
    orgType: preselectedType || "",
    vision: "",
    timeline: "",
    community: "",
    hear: "",
  });

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/partner-proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          org: form.org,
          orgType: form.orgType,
          vision: form.vision,
          timeline: form.timeline,
          community: form.community,
          hear: form.hear,
        }),
      });

      if (!res.ok) throw new Error("Submission failed");
      setSubmitted(true);
    } catch {
      setError(
        "Something went wrong. Please email us directly at hello@dramaticadventure.com"
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "2.5rem 1rem",
        }}
      >
        <span
          style={{ display: "block", fontSize: "3rem", marginBottom: "1rem" }}
          aria-hidden="true"
        >
          ✨
        </span>
        <h2
          style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
            fontWeight: 800,
            color: "#6c00af",
            margin: "0 0 0.75rem",
          }}
        >
          We received your proposal.
        </h2>
        <p
          style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontSize: "1rem",
            lineHeight: 1.7,
            color: "rgba(36,17,35,0.75)",
            maxWidth: "520px",
            margin: "0 auto 2rem",
          }}
        >
          Thank you, {form.name || "friend"}. We'll read your message and be in
          touch within 3–5 business days. We're looking forward to learning more
          about what you're imagining.
        </p>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap" as const,
            gap: "0.85rem",
            justifyContent: "center",
          }}
        >
          <Link href="/partners" className="pp-btn pp-btn--purple">
            Explore Other Partnerships
          </Link>
          <Link href="/alumni" className="pp-btn pp-btn--outline">
            Meet DAT Artists
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="pp-form" noValidate>
      {/* Row 1: Name + Email */}
      <div className="pp-row">
        <div className="pp-field">
          <label htmlFor="name" className="pp-label">
            Your Name <span aria-hidden="true" style={{ color: "#f23359" }}>*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="pp-input"
            placeholder="First and last name"
            value={form.name}
            onChange={handleChange}
            autoComplete="name"
          />
        </div>
        <div className="pp-field">
          <label htmlFor="email" className="pp-label">
            Email Address <span aria-hidden="true" style={{ color: "#f23359" }}>*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="pp-input"
            placeholder="you@yourorganization.org"
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
          />
        </div>
      </div>

      {/* Row 2: Org + Partnership Type */}
      <div className="pp-row">
        <div className="pp-field">
          <label htmlFor="org" className="pp-label">
            Organization Name
          </label>
          <input
            id="org"
            name="org"
            type="text"
            className="pp-input"
            placeholder="University, company, foundation, etc."
            value={form.org}
            onChange={handleChange}
          />
        </div>
        <div className="pp-field">
          <label htmlFor="orgType" className="pp-label">
            Partnership Type <span aria-hidden="true" style={{ color: "#f23359" }}>*</span>
          </label>
          <select
            id="orgType"
            name="orgType"
            required
            className="pp-input pp-select"
            value={form.orgType}
            onChange={handleChange}
          >
            <option value="" disabled>
              Select the closest fit…
            </option>
            {PARTNER_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Vision */}
      <div className="pp-field pp-field--full">
        <label htmlFor="vision" className="pp-label">
          What are you imagining? <span aria-hidden="true" style={{ color: "#f23359" }}>*</span>
        </label>
        <textarea
          id="vision"
          name="vision"
          required
          rows={5}
          className="pp-input pp-textarea"
          placeholder="Tell us about your vision — what you'd love to create, why it excites you, and who it would serve. Don't be afraid to dream big."
          value={form.vision}
          onChange={handleChange}
        />
      </div>

      {/* Row 3: Community + Timeline */}
      <div className="pp-row">
        <div className="pp-field">
          <label htmlFor="community" className="pp-label">
            Where is your community, audience, or team?
          </label>
          <input
            id="community"
            name="community"
            type="text"
            className="pp-input"
            placeholder="City, country, or region"
            value={form.community}
            onChange={handleChange}
          />
        </div>
        <div className="pp-field">
          <label htmlFor="timeline" className="pp-label">
            Hoped-for timeline
          </label>
          <input
            id="timeline"
            name="timeline"
            type="text"
            className="pp-input"
            placeholder="e.g. Fall 2026, ASAP, flexible…"
            value={form.timeline}
            onChange={handleChange}
          />
        </div>
      </div>

      {/* How did you hear */}
      <div className="pp-field pp-field--full">
        <label htmlFor="hear" className="pp-label">
          How did you find DAT?
        </label>
        <input
          id="hear"
          name="hear"
          type="text"
          className="pp-input"
          placeholder="Referral, social media, a DAT alumni, etc."
          value={form.hear}
          onChange={handleChange}
        />
      </div>

      {/* Honeypot — hidden from humans */}
      <div style={{ display: "none" }} aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {/* Error state */}
      {error && (
        <p
          style={{
            margin: 0,
            padding: "0.9rem 1.1rem",
            borderRadius: "10px",
            background: "rgba(242,51,89,0.08)",
            border: "1px solid rgba(242,51,89,0.3)",
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontSize: "0.86rem",
            color: "#b01d3c",
            lineHeight: 1.5,
          }}
          role="alert"
        >
          {error}
        </p>
      )}

      <div className="pp-form__footer">
        <button
          type="submit"
          className="pp-btn-submit"
          disabled={submitting}
          aria-busy={submitting}
        >
          {submitting ? "Sending…" : "Send My Proposal →"}
        </button>
        <p
          style={{
            margin: 0,
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontSize: "0.78rem",
            color: "rgba(36,17,35,0.5)",
            textAlign: "center",
            fontStyle: "italic",
          }}
        >
          We read every proposal personally. You'll hear from a human.
        </p>
      </div>
    </form>
  );
}

/* ─── Page component ─── */
export default function ProposeProjectPage() {
  return (
    <main style={{ background: "transparent", overflowX: "hidden" }}>

      {/* ══════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════ */}
      <section
        style={{
          position: "relative",
          minHeight: "68vh",
          display: "flex",
          alignItems: "flex-end",
          overflow: "hidden",
        }}
        aria-label="Propose a partnership hero"
      >
        <div style={{ position: "absolute", inset: 0 }}>
          <Image
            src="/images/alumni-hero.jpg"
            alt="DAT artists in performance"
            fill
            priority
            sizes="100vw"
            style={{ objectFit: "cover", objectPosition: "center 25%" }}
          />
        </div>
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(36,17,35,0.1) 0%, rgba(36,17,35,0.5) 45%, rgba(36,17,35,0.92) 100%)",
          }}
        />
        <div
          style={{
            position: "relative",
            zIndex: 2,
            width: "90vw",
            maxWidth: "900px",
            margin: "0 auto 6vh",
            padding: "0 1rem",
          }}
        >
          <Link href="/partners" className="pp-breadcrumb">
            ← All Partnerships
          </Link>
          <span className="pp-eyebrow">Co-create with DAT</span>
          <h1 className="pp-hero-title">Bring your bold idea.</h1>
          <p className="pp-hero-sub">
            We don't do off-the-shelf. Every DAT partnership is built from scratch
            — shaped around your community, your vision, and what theatre can do in
            that specific place and time.
          </p>
        </div>
      </section>


      {/* ══════════════════════════════════════════════════
          MAIN LAYOUT: FORM + SIDEBAR
      ══════════════════════════════════════════════════ */}
      <section
        style={{ padding: "4rem 2rem 5rem" }}
        aria-labelledby="pp-form-heading"
      >
        <div className="pp-main-inner">

          {/* Left: form card */}
          <div className="pp-form-col">
            <div
              style={{
                background: "#fff",
                border: "1.5px solid rgba(36,17,35,0.1)",
                borderRadius: "20px",
                padding: "2.25rem 2rem",
                boxShadow: "0 4px 32px rgba(36,17,35,0.07)",
              }}
            >
              <div style={{ marginBottom: "2rem" }}>
                <span
                  style={{
                    display: "block",
                    fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    letterSpacing: "0.22em",
                    textTransform: "uppercase" as const,
                    color: "#6c00af",
                    marginBottom: "0.5rem",
                  }}
                >
                  YOUR PROPOSAL
                </span>
                <h2
                  id="pp-form-heading"
                  style={{
                    margin: "0 0 0.5rem",
                    fontFamily:
                      "var(--font-space-grotesk), system-ui, sans-serif",
                    fontSize: "clamp(1.8rem, 3vw, 2.4rem)",
                    fontWeight: 800,
                    color: "#241123",
                    lineHeight: 1.15,
                  }}
                >
                  Start the conversation.
                </h2>
                <p
                  style={{
                    margin: 0,
                    fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                    fontSize: "0.98rem",
                    lineHeight: 1.65,
                    color: "rgba(36,17,35,0.65)",
                  }}
                >
                  Tell us who you are and what you're imagining. We'll take it from there.
                </p>
              </div>

              <Suspense
                fallback={
                  <div
                    style={{
                      color: "rgba(36,17,35,0.5)",
                      fontSize: "0.9rem",
                      padding: "2rem 0",
                    }}
                  >
                    Loading form…
                  </div>
                }
              >
                <ProposeForm />
              </Suspense>
            </div>
          </div>

          {/* Right: sidebar */}
          <aside
            className="pp-sidebar"
            aria-label="What happens next"
          >
            {/* What happens next */}
            <div
              style={{
                background: "#fff",
                border: "1.5px solid rgba(36,17,35,0.1)",
                borderRadius: "18px",
                padding: "1.5rem 1.4rem 1.6rem",
                boxShadow: "0 2px 16px rgba(36,17,35,0.05)",
              }}
            >
              <span
                style={{
                  display: "block",
                  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase" as const,
                  color: "#6c00af",
                  marginBottom: "0.4rem",
                }}
              >
                WHAT HAPPENS NEXT
              </span>
              <h3
                style={{
                  margin: "0 0 1.25rem",
                  fontFamily:
                    "var(--font-space-grotesk), system-ui, sans-serif",
                  fontSize: "1.1rem",
                  fontWeight: 800,
                  color: "#241123",
                }}
              >
                From submission to partnership.
              </h3>
              <div
                style={{ display: "flex", flexDirection: "column" as const, gap: "1rem" }}
              >
                {nextSteps.map((ns, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: "0.85rem",
                      alignItems: "flex-start",
                    }}
                  >
                    <span
                      style={{
                        flexShrink: 0,
                        fontSize: "1.35rem",
                        marginTop: "0.05rem",
                      }}
                      aria-hidden="true"
                    >
                      {ns.icon}
                    </span>
                    <div>
                      <h4
                        style={{
                          margin: "0 0 0.2rem",
                          fontFamily:
                            "var(--font-space-grotesk), system-ui, sans-serif",
                          fontSize: "0.88rem",
                          fontWeight: 800,
                          color: "#241123",
                        }}
                      >
                        {ns.step}
                      </h4>
                      <p
                        style={{
                          margin: 0,
                          fontFamily:
                            "var(--font-dm-sans), system-ui, sans-serif",
                          fontSize: "0.82rem",
                          lineHeight: 1.6,
                          color: "rgba(36,17,35,0.62)",
                        }}
                      >
                        {ns.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Already have a program in mind */}
            <div
              style={{
                background: "rgba(255,255,255,0.70)",
                border: "1.5px solid rgba(36,147,169,0.25)",
                borderRadius: "18px",
                padding: "1.4rem 1.25rem 1.5rem",
              }}
            >
              <span
                style={{
                  display: "block",
                  fontFamily:
                    "var(--font-space-grotesk), system-ui, sans-serif",
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase" as const,
                  color: "#2493a9",
                  marginBottom: "0.5rem",
                }}
              >
                Already have a program in mind?
              </span>
              <p
                style={{
                  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                  fontSize: "0.86rem",
                  lineHeight: 1.65,
                  color: "#241123",
                  margin: "0 0 0.85rem",
                }}
              >
                Explore our university and corporate pathways for more detail on
                what a structured DAT partnership might look like for you.
              </p>
              <div
                style={{ display: "flex", flexDirection: "column" as const, gap: "0.4rem" }}
              >
                <Link href="/partners/universities" className="pp-sidebar-link">
                  University Programs →
                </Link>
                <Link href="/partners/corporate-giving" className="pp-sidebar-link">
                  Corporate Giving →
                </Link>
              </div>
            </div>

            {/* Email directly */}
            <div
              style={{
                background: "#241123",
                borderRadius: "18px",
                padding: "1.4rem 1.25rem 1.5rem",
              }}
            >
              <span
                style={{
                  display: "block",
                  fontFamily:
                    "var(--font-space-grotesk), system-ui, sans-serif",
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase" as const,
                  color: "#ffcc00",
                  marginBottom: "0.5rem",
                }}
              >
                Prefer to email directly?
              </span>
              <p
                style={{
                  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                  fontSize: "0.86rem",
                  lineHeight: 1.65,
                  color: "rgba(242,242,242,0.72)",
                  margin: "0 0 0.6rem",
                }}
              >
                Reach our partnership team at:
              </p>
              <a href="mailto:hello@dramaticadventure.com" className="pp-email-link">
                hello@dramaticadventure.com
              </a>
            </div>
          </aside>
        </div>
      </section>


      {/* ══════════════════════════════════════════════════
          SEEDS OF WHAT'S POSSIBLE
          Kraft paper background — distinct from CTA footer
      ══════════════════════════════════════════════════ */}
      <section
        style={{
          padding: "5rem 2rem",
          borderTop: "1px solid rgba(36,17,35,0.08)",
        }}
        aria-label="Partnership seeds"
      >
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <span
            style={{
              display: "block",
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              fontSize: "0.7rem",
              fontWeight: 700,
              letterSpacing: "0.22em",
              textTransform: "uppercase" as const,
              color: "rgba(36,17,35,0.45)",
              marginBottom: "0.6rem",
            }}
          >
            SEEDS OF WHAT'S POSSIBLE
          </span>
          <h2
            style={{
              margin: "0 0 0.6rem",
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "clamp(1.7rem, 3vw, 2.5rem)",
              fontWeight: 800,
              color: "#241123",
              lineHeight: 1.15,
            }}
          >
            Partnerships that started with a conversation.
          </h2>
          <p
            style={{
              margin: "0 0 2.75rem",
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              fontSize: "1rem",
              lineHeight: 1.7,
              color: "rgba(36,17,35,0.7)",
              maxWidth: "580px",
            }}
          >
            These are real things that have grown from a simple reach-out — just
            like the one you're about to make.
          </p>

          <div className="pp-seeds-grid">
            {[
              {
                label: "University Partnership",
                headline: "A faculty-led study abroad embedded in ACTion",
                body: "A US university professor co-designed a three-week intensive with DAT, embedding students in our ACTion program in Central Europe. Students earned academic credit and co-facilitated workshops alongside DAT teaching artists in local schools.",
                accent: "#6c00af",
                border: "rgba(108,0,175,0.15)",
              },
              {
                label: "Independent Research",
                headline: "A doctoral dissertation built around a Creative Trek",
                body: "A doctoral student embedded their ethnographic fieldwork in a DAT Creative Trek — interviewing artists, youth participants, and community members across two countries. The experience became the methodological core of their thesis on applied theatre in international contexts.",
                accent: "#2493a9",
                border: "rgba(36,147,169,0.15)",
              },
              {
                label: "Corporate CSR Partnership",
                headline: "Daigle Tours & DAT in Tanzania",
                body: "Daigle Tours served as DAT's CSR partner for our Tanzania scouting work — handling logistics, hosting a press conference in Kigamboni, and introducing DAT to the Kigamboni Community Centre. Under their Supporting the Arts programme, they helped identify communities across Tanzania ready for long-term creative partnership. Logistical expertise turned into arts access.",
                accent: "#2fa873",
                border: "rgba(47,168,115,0.15)",
              },
            ].map((ex) => (
              <div
                key={ex.label}
                style={{
                  background: "#fff",
                  border: `1.5px solid ${ex.border}`,
                  borderTop: `4px solid ${ex.accent}`,
                  borderRadius: "16px",
                  padding: "1.6rem 1.4rem 1.8rem",
                  transition: "transform 180ms ease, box-shadow 180ms ease",
                }}
                className="pp-seed-card"
              >
                <span
                  style={{
                    display: "block",
                    fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase" as const,
                    color: ex.accent,
                    marginBottom: "0.65rem",
                  }}
                >
                  {ex.label}
                </span>
                <h3
                  style={{
                    margin: "0 0 0.7rem",
                    fontFamily:
                      "var(--font-space-grotesk), system-ui, sans-serif",
                    fontSize: "1.05rem",
                    fontWeight: 700,
                    color: "#241123",
                    lineHeight: 1.3,
                  }}
                >
                  {ex.headline}
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                    fontSize: "0.87rem",
                    lineHeight: 1.7,
                    color: "rgba(36,17,35,0.72)",
                  }}
                >
                  {ex.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════════════
          CTA FOOTER — purple band
      ══════════════════════════════════════════════════ */}
      <section
        style={{
          background: "#6c00af",
          padding: "4rem 2rem",
          textAlign: "center",
        }}
        aria-label="Partnership call to action"
      >
        <p
          style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontSize: "0.72rem",
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase" as const,
            color: "rgba(255,255,255,0.55)",
            margin: "0 0 0.75rem",
          }}
        >
          READY TO ACT?
        </p>
        <h2
          style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)",
            fontWeight: 800,
            color: "#fff",
            margin: "0 0 1rem",
            lineHeight: 1.12,
          }}
        >
          Your vision is the starting point.
        </h2>
        <p
          style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontSize: "1rem",
            lineHeight: 1.65,
            color: "rgba(255,255,255,0.78)",
            maxWidth: "480px",
            margin: "0 auto 2.25rem",
          }}
        >
          Scroll back up and send us your proposal. Or reach us directly at{" "}
          <a
            href="mailto:hello@dramaticadventure.com"
            style={{ color: "#ffcc00", textDecoration: "underline" }}
          >
            hello@dramaticadventure.com
          </a>
          .
        </p>
        <a
          href="#pp-form-heading"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem 2.25rem",
            background: "#ffcc00",
            color: "#241123",
            borderRadius: "14px",
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "0.82rem",
            fontWeight: 800,
            letterSpacing: "0.12em",
            textTransform: "uppercase" as const,
            textDecoration: "none",
            transition: "transform 150ms ease, background 150ms ease",
          }}
          className="pp-cta-anchor"
        >
          Start the Conversation →
        </a>
      </section>


      {/* ══════════════════════════════════════════════════
          STYLES
      ══════════════════════════════════════════════════ */}
      <style>{`
        /* ── Breadcrumb + eyebrow ─────────────────────── */
        .pp-breadcrumb {
          display: inline-block;
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(242,242,242,0.6);
          text-decoration: none;
          margin-bottom: 1rem;
          transition: color 150ms ease;
        }
        .pp-breadcrumb:hover { color: #ffcc00; }
        .pp-eyebrow {
          display: block;
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #ffcc00;
          margin-bottom: 0.65rem;
          opacity: 0.85;
        }

        /* ── Hero text ───────────────────────────────── */
        .pp-hero-title {
          margin: 0;
          font-family: var(--font-space-grotesk), system-ui, sans-serif;
          font-size: clamp(2.8rem, 6.5vw, 6rem);
          font-weight: 800;
          line-height: 1.02;
          color: #f2f2f2;
          text-shadow: 0 4px 24px rgba(0,0,0,0.45);
        }
        .pp-hero-sub {
          margin: 1.25rem 0 0;
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: clamp(0.95rem, 1.8vw, 1.18rem);
          color: rgba(242,242,242,0.85);
          max-width: 560px;
          line-height: 1.65;
          font-weight: 500;
        }

        /* ── Main inner grid ─────────────────────────── */
        .pp-main-inner {
          max-width: 1100px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: 3rem;
          align-items: flex-start;
        }
        @media (max-width: 900px) {
          .pp-main-inner { grid-template-columns: 1fr; }
        }

        /* ── Form column ─────────────────────────────── */
        .pp-form-col { min-width: 0; }

        /* ── Sidebar ─────────────────────────────────── */
        .pp-sidebar {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          position: sticky;
          top: 6rem;
        }
        @media (max-width: 900px) {
          .pp-sidebar { position: static; }
        }

        /* ── Form internals ──────────────────────────── */
        .pp-form {
          display: flex;
          flex-direction: column;
          gap: 1.4rem;
        }
        .pp-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
        }
        @media (max-width: 600px) {
          .pp-row { grid-template-columns: 1fr; }
        }
        .pp-field {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }
        .pp-field--full { grid-column: 1 / -1; }
        .pp-label {
          font-family: var(--font-space-grotesk), system-ui, sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(36,17,35,0.65);
        }
        .pp-input {
          width: 100%;
          padding: 0.8rem 1rem;
          border-radius: 12px;
          border: 1.5px solid rgba(36,17,35,0.16);
          background: #fafaf9;
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 0.94rem;
          color: #241123;
          transition: border-color 150ms ease, box-shadow 150ms ease, background 150ms ease;
          outline: none;
          -webkit-appearance: none;
          appearance: none;
          box-sizing: border-box;
        }
        .pp-input:focus {
          border-color: #6c00af;
          box-shadow: 0 0 0 3px rgba(108,0,175,0.12);
          background: #fff;
        }
        .pp-input::placeholder { color: rgba(36,17,35,0.35); }
        .pp-select {
          cursor: pointer;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath fill='%23241123' fill-opacity='0.45' d='M5 7l5 5 5-5z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 0.75rem center;
          background-size: 1.25em;
          padding-right: 2.5rem;
        }
        .pp-textarea { resize: vertical; min-height: 144px; }
        .pp-form__footer {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        /* ── Submit button ───────────────────────────── */
        .pp-btn-submit {
          width: 100%;
          background: #6c00af;
          color: #f2f2f2;
          padding: 1.1rem 2rem;
          font-family: var(--font-space-grotesk), system-ui, sans-serif;
          font-size: 0.85rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          border-radius: 14px;
          border: none;
          cursor: pointer;
          box-shadow: 0 6px 24px rgba(108,0,175,0.25);
          transition: background 150ms ease, transform 150ms ease, box-shadow 150ms ease;
        }
        .pp-btn-submit:hover:not(:disabled) {
          background: #530088;
          transform: translateY(-1px);
          box-shadow: 0 10px 30px rgba(108,0,175,0.32);
        }
        .pp-btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }

        /* ── Link buttons (success state) ────────────── */
        .pp-btn--purple {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.9rem 1.75rem;
          border-radius: 14px;
          font-family: var(--font-space-grotesk), system-ui, sans-serif;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          text-decoration: none;
          background: #6c00af;
          color: #f2f2f2;
          transition: background 150ms ease, transform 150ms ease;
        }
        .pp-btn--purple:hover { background: #530088; transform: translateY(-2px); }
        .pp-btn--outline {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.9rem 1.75rem;
          border-radius: 14px;
          font-family: var(--font-space-grotesk), system-ui, sans-serif;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          text-decoration: none;
          background: transparent;
          color: #241123;
          border: 2px solid rgba(36,17,35,0.25);
          transition: background 150ms ease, transform 150ms ease;
        }
        .pp-btn--outline:hover { background: rgba(36,17,35,0.06); transform: translateY(-2px); }

        /* ── Sidebar links ───────────────────────────── */
        .pp-sidebar-link {
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 0.85rem;
          font-weight: 600;
          color: #2493a9;
          text-decoration: none;
          transition: color 130ms ease;
        }
        .pp-sidebar-link:hover { color: #6c00af; }

        /* ── Email link (dark card) ───────────────────── */
        .pp-email-link {
          display: block;
          font-family: var(--font-space-grotesk), system-ui, sans-serif;
          font-size: 0.9rem;
          font-weight: 700;
          color: #ffcc00;
          text-decoration: none;
          letter-spacing: 0.04em;
          transition: color 130ms ease;
        }
        .pp-email-link:hover { color: #f23359; }

        /* ── Seeds grid ──────────────────────────────── */
        .pp-seeds-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.4rem;
        }
        @media (max-width: 900px) {
          .pp-seeds-grid { grid-template-columns: 1fr; }
        }

        /* ── Seed card hover ─────────────────────────── */
        .pp-seed-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 36px rgba(36,17,35,0.1);
        }

        /* ── CTA anchor hover ────────────────────────── */
        .pp-cta-anchor:hover {
          background: #fff;
          transform: translateY(-2px);
        }
      `}</style>
    </main>
  );
}
