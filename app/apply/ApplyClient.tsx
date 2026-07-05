"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  HUB_META,
  OPPORTUNITY_HUBS,
  OPPORTUNITY_ROLE_LABELS,
  TYPE_META,
  formatDeadline,
  type Opportunity,
  type OpportunityHub,
} from "@/lib/opportunities";

type OppSummary = {
  id: string;
  title: string;
  type: Opportunity["type"];
  hub: OpportunityHub;
};

const STEPS = [
  { num: "01", title: "Apply", body: "Fill out this form. Tell us who you are and why this work pulls at you." },
  { num: "02", title: "We Read It", body: "A real DAT staff member reads every application. We aim to reply within two weeks." },
  { num: "03", title: "We Talk", body: "If it's a fit, we schedule a 30-min video call. You'll meet the team you'd work with." },
  { num: "04", title: "You Begin", body: "If we move forward, we welcome you in — orientation, onboarding, and the work." },
];

export default function ApplyClient({
  opportunity,
  openOpportunities,
}: {
  opportunity: Opportunity | null;
  openOpportunities: OppSummary[];
}) {
  const accent = opportunity ? TYPE_META[opportunity.type].color : "#6C00AF";
  const isGeneral = !opportunity;

  const [chosenId, setChosenId] = useState<string>("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [location, setLocation] = useState("");
  const [hub, setHub] = useState<OpportunityHub | "">("");
  const [roleInterest, setRoleInterest] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [links, setLinks] = useState("");
  const [whyDAT, setWhyDAT] = useState("");
  const [anythingElse, setAnythingElse] = useState("");
  const [website, setWebsite] = useState(""); // honeypot

  // ── File uploads ──
  const [headshot, setHeadshot] = useState<File | null>(null);
  const [resume, setResume] = useState<File | null>(null);
  const [coverLetter, setCoverLetter] = useState<File | null>(null);

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const MAX_FILE_MB = 8;
  const checkFile = (file: File | null, label: string): string | null => {
    if (!file) return null;
    if (file.size > MAX_FILE_MB * 1024 * 1024) return `${label} must be under ${MAX_FILE_MB} MB.`;
    return null;
  };

  const targetOpp = useMemo(() => {
    if (opportunity) return opportunity;
    if (chosenId) return openOpportunities.find((o) => o.id === chosenId) ?? null;
    return null;
  }, [opportunity, chosenId, openOpportunities]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!name.trim() || !email.trim()) {
      setErrorMsg("Name and email are required.");
      return;
    }
    for (const [file, label] of [
      [headshot, "Headshot"],
      [resume, "Resume / CV"],
      [coverLetter, "Cover letter"],
    ] as [File | null, string][]) {
      const err = checkFile(file, label);
      if (err) {
        setErrorMsg(err);
        return;
      }
    }
    setStatus("loading");
    try {
      const fd = new FormData();
      fd.append("opportunityId", opportunity?.id ?? chosenId ?? "");
      fd.append(
        "opportunityTitle",
        opportunity?.title ?? (chosenId ? openOpportunities.find((o) => o.id === chosenId)?.title ?? "" : "General Interest"),
      );
      fd.append("name", name);
      fd.append("email", email);
      fd.append("phone", phone);
      fd.append("pronouns", pronouns);
      fd.append("location", location);
      fd.append("hub", hub);
      fd.append("roleInterest", roleInterest);
      fd.append("yearsExperience", yearsExperience);
      fd.append("links", links);
      fd.append("whyDAT", whyDAT);
      fd.append("anythingElse", anythingElse);
      fd.append("website", website);
      if (headshot) fd.append("headshot", headshot);
      if (resume) fd.append("resume", resume);
      if (coverLetter) fd.append("coverLetter", coverLetter);

      const res = await fetch("/api/apply", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Something went wrong." }));
        throw new Error(data.error || "Submission failed");
      }
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Submission failed");
    }
  };

  if (status === "success") {
    return (
      <main className="ap-root">
        <section className="ap-success">
          <div className="ap-success-inner">
            <span className="ap-success-eyebrow">Application Received</span>
            <h1 className="ap-success-title">Thank you, {name.split(" ")[0] || "friend"}.</h1>
            <p className="ap-success-body">
              We've got your application{opportunity ? ` for ${opportunity.title}` : ""}. A real DAT staff
              member will read it and get back to you within two weeks — yes or no, you'll hear from us.
            </p>
            <p className="ap-success-body">
              In the meantime: explore what else is happening, or share an opportunity with someone who
              should know about it.
            </p>
            <div className="ap-success-actions">
              <Link href="/opportunities" className="ap-cta ap-cta--primary">
                See More Opportunities
              </Link>
              <Link href="/" className="ap-cta ap-cta--ghost">
                Back to DAT
              </Link>
            </div>
          </div>
        </section>
        <style>{AP_CSS}</style>
      </main>
    );
  }

  return (
    <main className="ap-root" style={{ ["--accent" as string]: accent }}>
      {/* ── HERO ─────────────────────────── */}
      <section className="ap-hero">
        <div className="ap-hero-bg" aria-hidden="true" />
        <div className="ap-hero-content">
          <Link href={opportunity ? `/opportunities/${opportunity.id}` : "/opportunities"} className="ap-back">
            ← {opportunity ? "Back to opportunity" : "Back to opportunities"}
          </Link>
          <span className="ap-hero-eyebrow">
            {opportunity ? `Apply — ${TYPE_META[opportunity.type].label}` : "Apply"}
          </span>
          <h1 className="ap-hero-title">
            {opportunity ? opportunity.title : "Tell us about you."}
          </h1>
          {opportunity ? (
            <p className="ap-hero-sub">
              {opportunity.description}
            </p>
          ) : (
            <p className="ap-hero-sub">
              This form goes to a real DAT staff member. Tell us who you are, what you bring, and which
              opportunity (or kind of opportunity) you're applying for. We read everything.
            </p>
          )}
          {opportunity?.deadline && opportunity.status === "open" && (
            <div className="ap-deadline">
              <span>Apply by</span>
              <strong>{formatDeadline(opportunity.deadline)}</strong>
            </div>
          )}
        </div>
      </section>

      {/* ── STEPS ─────────────────────────── */}
      <section className="ap-steps">
        <div className="ap-steps-inner">
          {STEPS.map((s) => (
            <div key={s.num} className="ap-step">
              <span className="ap-step-num">{s.num}</span>
              <h3 className="ap-step-title">{s.title}</h3>
              <p className="ap-step-body">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FORM ─────────────────────────── */}
      <section className="ap-form-section">
        <div className="ap-form-shell">
          <form className="ap-form" onSubmit={handleSubmit} noValidate>
            {/* Honeypot */}
            <input
              aria-hidden="true"
              tabIndex={-1}
              name="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              style={{ display: "none" }}
              autoComplete="off"
            />

            {/* Opportunity context */}
            {opportunity ? (
              <div className="ap-context">
                <span className="ap-context-label">Applying for</span>
                <div className="ap-context-card">
                  <span className="ap-context-type">{TYPE_META[opportunity.type].label}</span>
                  <h2 className="ap-context-title">{opportunity.title}</h2>
                  <p className="ap-context-meta">
                    {HUB_META[opportunity.hub].label} · {opportunity.commitment}
                  </p>
                </div>
              </div>
            ) : isGeneral ? (
              <div className="ap-field">
                <label htmlFor="ap-opp" className="ap-label">Which opportunity? (optional)</label>
                <select
                  id="ap-opp"
                  className="ap-input"
                  value={chosenId}
                  onChange={(e) => setChosenId(e.target.value)}
                >
                  <option value="">I'm exploring — general interest</option>
                  {openOpportunities.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.title} ({TYPE_META[o.type].label} · {HUB_META[o.hub].label})
                    </option>
                  ))}
                </select>
                <p className="ap-help">Not sure yet? Leave this on "I'm exploring" — we'll figure it out together.</p>
              </div>
            ) : null}

            {/* Identity */}
            <fieldset className="ap-fieldset">
              <legend className="ap-legend">Who you are</legend>
              <div className="ap-row">
                <div className="ap-field">
                  <label htmlFor="ap-name" className="ap-label">Full name <span className="ap-req">*</span></label>
                  <input id="ap-name" required className="ap-input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
                </div>
                <div className="ap-field">
                  <label htmlFor="ap-pronouns" className="ap-label">Pronouns</label>
                  <input id="ap-pronouns" className="ap-input" value={pronouns} onChange={(e) => setPronouns(e.target.value)} placeholder="she/her, they/them, he/him…" />
                </div>
              </div>
              <div className="ap-row">
                <div className="ap-field">
                  <label htmlFor="ap-email" className="ap-label">Email <span className="ap-req">*</span></label>
                  <input id="ap-email" required type="email" className="ap-input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                </div>
                <div className="ap-field">
                  <label htmlFor="ap-phone" className="ap-label">Phone (optional)</label>
                  <input id="ap-phone" type="tel" className="ap-input" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
                </div>
              </div>
              <div className="ap-row">
                <div className="ap-field">
                  <label htmlFor="ap-location" className="ap-label">Where are you based?</label>
                  <input id="ap-location" className="ap-input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, Country" />
                </div>
                <div className="ap-field">
                  <label htmlFor="ap-hub" className="ap-label">Most-interested DAT hub</label>
                  <select id="ap-hub" className="ap-input" value={hub} onChange={(e) => setHub(e.target.value as OpportunityHub | "")}>
                    <option value="">No preference</option>
                    {OPPORTUNITY_HUBS.map((h) => (
                      <option key={h} value={h}>{HUB_META[h].label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </fieldset>

            {/* About the work */}
            <fieldset className="ap-fieldset">
              <legend className="ap-legend">About the work</legend>
              <div className="ap-row">
                <div className="ap-field">
                  <label htmlFor="ap-role" className="ap-label">
                    {targetOpp ? "Role / department of interest" : "What kind of work pulls at you?"}
                  </label>
                  <input
                    id="ap-role"
                    className="ap-input"
                    value={roleInterest}
                    onChange={(e) => setRoleInterest(e.target.value)}
                    placeholder={
                      opportunity?.roleTypes.length
                        ? opportunity.roleTypes.map((r) => OPPORTUNITY_ROLE_LABELS[r]).join(" / ")
                        : "Acting, Producing, Marketing, Devising…"
                    }
                  />
                </div>
                <div className="ap-field">
                  <label htmlFor="ap-years" className="ap-label">Years of experience (in this area)</label>
                  <select id="ap-years" className="ap-input" value={yearsExperience} onChange={(e) => setYearsExperience(e.target.value)}>
                    <option value="">—</option>
                    <option>Student / Just starting</option>
                    <option>0–1 years</option>
                    <option>1–3 years</option>
                    <option>3–5 years</option>
                    <option>5–10 years</option>
                    <option>10+ years</option>
                  </select>
                </div>
              </div>
              <div className="ap-field">
                <label htmlFor="ap-links" className="ap-label">Links (portfolio, reel, LinkedIn, website)</label>
                <textarea
                  id="ap-links"
                  className="ap-input ap-input--textarea"
                  rows={3}
                  value={links}
                  onChange={(e) => setLinks(e.target.value)}
                  placeholder="One per line is great"
                />
              </div>
            </fieldset>

            {/* Files */}
            <fieldset className="ap-fieldset">
              <legend className="ap-legend">Files (optional)</legend>
              <p className="ap-help" style={{ marginTop: "-0.4rem" }}>
                PDF, Word, or image. Up to 8 MB each. You can also paste links above instead — your choice.
              </p>
              <div className="ap-row">
                <FileField
                  id="ap-headshot"
                  label="Headshot"
                  accept="image/*"
                  hint="JPG / PNG"
                  file={headshot}
                  onChange={setHeadshot}
                />
                <FileField
                  id="ap-resume"
                  label="Resume / CV"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  hint="PDF or DOCX"
                  file={resume}
                  onChange={setResume}
                />
              </div>
              <FileField
                id="ap-cover"
                label="Cover letter (optional)"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                hint="PDF or DOCX"
                file={coverLetter}
                onChange={setCoverLetter}
              />
            </fieldset>

            {/* Why DAT */}
            <fieldset className="ap-fieldset">
              <legend className="ap-legend">Tell us a little</legend>
              <div className="ap-field">
                <label htmlFor="ap-why" className="ap-label">Why DAT? Why this opportunity?</label>
                <textarea
                  id="ap-why"
                  className="ap-input ap-input--textarea"
                  rows={5}
                  value={whyDAT}
                  onChange={(e) => setWhyDAT(e.target.value)}
                  placeholder="Doesn't need to be polished — just real. A paragraph is plenty."
                />
              </div>
              <div className="ap-field">
                <label htmlFor="ap-else" className="ap-label">Anything else we should know?</label>
                <textarea
                  id="ap-else"
                  className="ap-input ap-input--textarea"
                  rows={3}
                  value={anythingElse}
                  onChange={(e) => setAnythingElse(e.target.value)}
                />
              </div>
            </fieldset>

            {/* Submit */}
            <div className="ap-submit-row">
              <button type="submit" className="ap-submit" disabled={status === "loading"}>
                {status === "loading" ? "Sending…" : "Send Application"}
              </button>
              <p className="ap-fine">
                We read every application. You'll hear from us within two weeks.
              </p>
            </div>

            {status === "error" && (
              <div className="ap-error">
                <strong>Something went wrong.</strong>
                <span>{errorMsg || "Please try again — or email "}<a href="mailto:hello@dramaticadventure.com">hello@dramaticadventure.com</a>.</span>
              </div>
            )}
          </form>
        </div>
      </section>

      <style>{AP_CSS}</style>
    </main>
  );
}

const AP_CSS = `
        .ap-root { background: transparent; color: #241123; }

        /* HERO */
        .ap-hero {
          position: relative;
          background: linear-gradient(135deg, #241123 0%, #3a1a3a 100%);
          color: #fff;
          padding: clamp(4rem, 8vw, 6rem) clamp(1.5rem, 5vw, 3rem) clamp(3rem, 6vw, 5rem);
          overflow: hidden;
        }
        .ap-hero-bg {
          position: absolute; inset: 0; z-index: 0;
          background:
            radial-gradient(ellipse 50% 70% at 80% 30%, color-mix(in srgb, var(--accent) 22%, transparent) 0%, transparent 70%),
            radial-gradient(ellipse 60% 60% at 20% 80%, rgba(255,204,0,0.08) 0%, transparent 60%);
        }
        .ap-hero-content { position: relative; z-index: 1; max-width: 880px; margin: 0 auto; }
        .ap-back {
          display: inline-block;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.7rem; font-weight: 700;
          letter-spacing: 0.18em; text-transform: uppercase;
          color: rgba(255,255,255,0.5);
          text-decoration: none; margin-bottom: 1.25rem;
        }
        .ap-back:hover { color: var(--accent); }
        .ap-hero-eyebrow {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.72rem; font-weight: 700;
          letter-spacing: 0.26em; text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 0.85rem; display: inline-block;
        }
        .ap-hero-title {
          font-family: var(--font-anton), sans-serif;
          font-size: clamp(2.4rem, 6vw, 4.4rem);
          font-weight: 400; line-height: 1;
          color: #fff; margin: 0 0 1rem;
        }
        .ap-hero-sub {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: clamp(0.98rem, 1.7vw, 1.12rem);
          color: rgba(255,255,255,0.78);
          line-height: 1.65; max-width: 620px;
          margin: 0 0 1.25rem;
        }
        .ap-deadline {
          display: inline-flex; align-items: baseline; gap: 0.6rem;
          padding: 0.55rem 1rem;
          background: rgba(255,204,0,0.12);
          border: 1px solid rgba(255,204,0,0.35);
          border-radius: 10px;
          margin-top: 0.5rem;
        }
        .ap-deadline span {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.7rem; font-weight: 700;
          letter-spacing: 0.18em; text-transform: uppercase;
          color: rgba(255,255,255,0.7);
        }
        .ap-deadline strong { font-family: var(--font-space-grotesk), sans-serif; color: #FFCC00; font-weight: 800; }

        /* STEPS */
        .ap-steps {
          padding: clamp(2.5rem, 5vw, 4rem) clamp(1.5rem, 5vw, 3rem);
          background: rgba(36,17,35,0.04);
        }
        .ap-steps-inner {
          max-width: 1100px; margin: 0 auto;
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 1.25rem;
        }
        @media (max-width: 820px) { .ap-steps-inner { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 480px) { .ap-steps-inner { grid-template-columns: 1fr; } }
        .ap-step {
          background: #fff;
          padding: 1.25rem 1.25rem 1.4rem;
          border-radius: 14px;
          border: 1px solid rgba(36,17,35,0.08);
        }
        .ap-step-num {
          font-family: var(--font-anton), sans-serif;
          font-size: 1.4rem; color: var(--accent);
          display: block; margin-bottom: 0.3rem;
        }
        .ap-step-title {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 1rem; font-weight: 800;
          color: #241123; margin: 0 0 0.35rem;
        }
        .ap-step-body {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.86rem; line-height: 1.55;
          color: rgba(36,17,35,0.7);
          margin: 0;
        }

        /* FORM */
        .ap-form-section { padding: clamp(3rem, 6vw, 5rem) clamp(1.5rem, 5vw, 3rem); }
        .ap-form-shell {
          max-width: 820px; margin: 0 auto;
          background: #fff;
          border-radius: 20px;
          border: 1px solid rgba(36,17,35,0.08);
          padding: clamp(1.75rem, 4vw, 3rem);
          box-shadow: 0 12px 36px rgba(36,17,35,0.06);
        }
        .ap-form { display: flex; flex-direction: column; gap: 2rem; }

        .ap-context { display: flex; flex-direction: column; gap: 0.5rem; }
        .ap-context-label {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.7rem; font-weight: 700;
          letter-spacing: 0.22em; text-transform: uppercase;
          color: rgba(36,17,35,0.5);
        }
        .ap-context-card {
          padding: 1.1rem 1.25rem;
          background: color-mix(in srgb, var(--accent) 8%, transparent);
          border: 1px solid color-mix(in srgb, var(--accent) 25%, transparent);
          border-left: 4px solid var(--accent);
          border-radius: 0 12px 12px 0;
        }
        .ap-context-type {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.62rem; font-weight: 700;
          letter-spacing: 0.22em; text-transform: uppercase;
          color: var(--accent);
        }
        .ap-context-title {
          font-family: var(--font-anton), sans-serif;
          font-size: clamp(1.3rem, 2.5vw, 1.7rem);
          font-weight: 400; color: #241123;
          margin: 0.3rem 0 0.2rem;
        }
        .ap-context-meta {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.88rem;
          color: rgba(36,17,35,0.65); margin: 0;
        }

        .ap-fieldset { border: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 1rem; }
        .ap-legend {
          font-family: var(--font-anton), sans-serif;
          font-size: clamp(1.4rem, 2.5vw, 1.8rem);
          font-weight: 400; color: #241123;
          padding-bottom: 0.4rem;
          border-bottom: 2px solid color-mix(in srgb, var(--accent) 35%, transparent);
          margin-bottom: 0.25rem;
        }
        .ap-row {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        @media (max-width: 640px) { .ap-row { grid-template-columns: 1fr; } }
        .ap-field { display: flex; flex-direction: column; gap: 0.4rem; }
        .ap-label {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.78rem; font-weight: 700;
          letter-spacing: 0.04em;
          color: rgba(36,17,35,0.78);
        }
        .ap-req { color: var(--accent); margin-left: 0.15rem; }
        .ap-input {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.96rem;
          padding: 0.75rem 0.9rem;
          border-radius: 10px;
          border: 1.5px solid rgba(36,17,35,0.15);
          background: #fff;
          color: #241123;
          outline: none;
          transition: border-color 160ms ease, box-shadow 160ms ease;
        }
        .ap-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 15%, transparent);
        }
        .ap-input::placeholder { color: rgba(36,17,35,0.4); }
        .ap-input--textarea { resize: vertical; line-height: 1.55; }
        .ap-help {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.78rem;
          color: rgba(36,17,35,0.55);
          margin: 0;
        }

        /* SUBMIT */
        .ap-submit-row {
          display: flex; flex-wrap: wrap; align-items: center;
          gap: 1rem; padding-top: 0.5rem;
        }
        .ap-submit {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.86rem; font-weight: 700;
          letter-spacing: 0.14em; text-transform: uppercase;
          padding: 1rem 1.8rem;
          background: var(--accent); color: #fff;
          border-radius: 12px; border: none;
          cursor: pointer;
          transition: transform 160ms ease, opacity 160ms ease;
        }
        .ap-submit:hover:not(:disabled) { transform: translateY(-2px); opacity: 0.94; }
        .ap-submit:disabled { opacity: 0.55; cursor: default; }
        .ap-fine {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.78rem; color: rgba(36,17,35,0.55);
          margin: 0;
        }

        .ap-error {
          background: rgba(242,51,89,0.08);
          border: 1px solid rgba(242,51,89,0.4);
          border-radius: 12px;
          padding: 1rem 1.25rem;
          display: flex; flex-direction: column; gap: 0.25rem;
        }
        .ap-error strong {
          font-family: var(--font-space-grotesk), sans-serif;
          color: #F23359; font-weight: 800;
        }
        .ap-error span {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.92rem; color: rgba(36,17,35,0.78);
        }
        .ap-error a { color: #F23359; }

        /* SUCCESS */
        .ap-success {
          /* extra top padding clears the fixed site header (~100px tall) */
          padding: clamp(9rem, 14vw, 12rem) clamp(1.5rem, 5vw, 3rem) clamp(5rem, 10vw, 9rem);
          background: linear-gradient(135deg, #2FA873 0%, #1f8c5d 100%);
          color: #fff; text-align: center;
          min-height: 60vh;
          display: flex; align-items: center; justify-content: center;
        }
        .ap-success-inner { max-width: 720px; margin: 0 auto; }
        .ap-success-eyebrow {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.72rem; font-weight: 700;
          letter-spacing: 0.26em; text-transform: uppercase;
          color: #FFCC00;
          display: block; margin-bottom: 0.85rem;
        }
        .ap-success-title {
          font-family: var(--font-anton), sans-serif;
          font-size: clamp(2.5rem, 6vw, 4.5rem);
          font-weight: 400; line-height: 1;
          margin: 0 0 1.25rem;
        }
        .ap-success-body {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: clamp(1rem, 1.7vw, 1.15rem);
          line-height: 1.7; color: rgba(255,255,255,0.88);
          margin: 0 auto 1rem; max-width: 580px;
        }
        .ap-success-actions {
          display: flex; flex-wrap: wrap; gap: 0.7rem;
          justify-content: center; margin-top: 2rem;
        }

        .ap-cta {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.8rem; font-weight: 700;
          letter-spacing: 0.14em; text-transform: uppercase;
          padding: 1rem 1.7rem; border-radius: 12px;
          text-decoration: none;
          transition: transform 160ms ease, background 160ms ease, color 160ms ease, opacity 160ms ease;
        }
        .ap-cta--primary { background: #FFCC00; color: #241123; }
        .ap-cta--primary:hover { transform: translateY(-2px); opacity: 0.94; }
        .ap-cta--ghost {
          background: transparent; color: #fff;
          border: 1.5px solid rgba(255,255,255,0.4);
        }
        .ap-cta--ghost:hover { background: rgba(255,255,255,0.12); transform: translateY(-2px); }

        /* FILE FIELDS */
        .ap-file {
          display: flex; flex-direction: column; gap: 0.4rem;
        }
        .ap-file-control {
          display: flex; align-items: stretch;
          gap: 0;
          border: 1.5px dashed rgba(36,17,35,0.2);
          border-radius: 12px;
          background: rgba(36,17,35,0.02);
          transition: border-color 160ms ease, background 160ms ease;
          overflow: hidden;
        }
        .ap-file-control:hover { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 6%, transparent); }
        .ap-file-control--has {
          border-style: solid;
          border-color: var(--accent);
          background: color-mix(in srgb, var(--accent) 7%, transparent);
        }
        .ap-file-input { position: absolute; opacity: 0; pointer-events: none; width: 0; height: 0; }
        .ap-file-trigger {
          flex: 0 0 auto;
          padding: 0.85rem 1.1rem;
          background: rgba(36,17,35,0.05);
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.76rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--accent);
          cursor: pointer;
          display: inline-flex; align-items: center; gap: 0.45rem;
          border-right: 1.5px dashed rgba(36,17,35,0.18);
        }
        .ap-file-trigger:hover { background: rgba(36,17,35,0.08); }
        .ap-file-control--has .ap-file-trigger {
          border-right-style: solid;
          border-right-color: color-mix(in srgb, var(--accent) 35%, transparent);
        }
        .ap-file-state {
          flex: 1 1 auto;
          padding: 0.85rem 1rem;
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.88rem;
          color: rgba(36,17,35,0.65);
          min-width: 0;
        }
        .ap-file-name {
          color: #241123;
          font-weight: 600;
          display: block;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .ap-file-size {
          color: rgba(36,17,35,0.55);
          font-size: 0.78rem;
          margin-left: 0.5rem;
        }
        .ap-file-clear {
          background: transparent; border: none;
          padding: 0.4rem 0.85rem;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.72rem; font-weight: 700;
          letter-spacing: 0.14em; text-transform: uppercase;
          color: rgba(36,17,35,0.5);
          cursor: pointer;
          border-left: 1px solid rgba(36,17,35,0.08);
        }
        .ap-file-clear:hover { color: #F23359; }
`;

function FileField({
  id,
  label,
  hint,
  accept,
  file,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  accept: string;
  file: File | null;
  onChange: (f: File | null) => void;
}) {
  const has = !!file;
  const sizeKB = file ? Math.round(file.size / 1024) : 0;
  const sizeLabel = file ? (sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`) : "";
  return (
    <div className="ap-file">
      <label htmlFor={id} className="ap-label">{label}</label>
      <div className={`ap-file-control${has ? " ap-file-control--has" : ""}`}>
        <input
          id={id}
          type="file"
          accept={accept}
          className="ap-file-input"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
        <label htmlFor={id} className="ap-file-trigger">
          {has ? "Replace" : "Choose file"}
        </label>
        <span className="ap-file-state">
          {has ? (
            <>
              <span className="ap-file-name">{file!.name}</span>
              <span className="ap-file-size">{sizeLabel}</span>
            </>
          ) : (
            <>No file chosen · {hint}</>
          )}
        </span>
        {has && (
          <button
            type="button"
            className="ap-file-clear"
            onClick={() => onChange(null)}
            aria-label={`Remove ${label}`}
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
