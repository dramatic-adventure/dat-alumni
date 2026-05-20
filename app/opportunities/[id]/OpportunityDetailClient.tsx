"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  COMMITMENT_LABELS,
  HUB_META,
  OPPORTUNITY_ROLE_LABELS,
  STATUS_LABELS,
  TYPE_GROUP_META,
  TYPE_TO_GROUP,
  formatDeadline,
  type Opportunity,
} from "@/lib/opportunities";

function StatusPill({ status }: { status: Opportunity["status"] }) {
  const palette: Record<Opportunity["status"], { bg: string; fg: string; border: string }> = {
    open:        { bg: "rgba(47,168,115,0.15)", fg: "#1f8c5d", border: "rgba(47,168,115,0.45)" },
    coming_soon: { bg: "rgba(217,169,25,0.15)", fg: "#b8881d", border: "rgba(217,169,25,0.45)" },
    evergreen:   { bg: "rgba(36,147,169,0.15)", fg: "#1a7a8c", border: "rgba(36,147,169,0.45)" },
    closed:      { bg: "rgba(36,17,35,0.08)",   fg: "rgba(36,17,35,0.6)", border: "rgba(36,17,35,0.18)" },
  };
  const p = palette[status];
  return (
    <span
      className="od-statuspill"
      style={{ background: p.bg, color: p.fg, borderColor: p.border }}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function Section({
  eyebrow,
  title,
  children,
  accent = "#6C00AF",
}: {
  eyebrow?: string;
  title?: string;
  children: React.ReactNode;
  accent?: string;
}) {
  return (
    <section className="od-section">
      {eyebrow && (
        <span className="od-section-eyebrow" style={{ color: accent }}>
          {eyebrow}
        </span>
      )}
      {title && <h2 className="od-section-title">{title}</h2>}
      <div className="od-section-body">{children}</div>
    </section>
  );
}

export default function OpportunityDetailClient({
  opportunity: o,
  related,
}: {
  opportunity: Opportunity;
  related: Opportunity[];
}) {
  const meta = TYPE_GROUP_META[TYPE_TO_GROUP[o.type]];
  const hub = HUB_META[o.hub];
  const heroImage = o.heroImage || "/images/opportunities/PLX-hero.jpg";
  const isClosed = o.status === "closed";
  const showDeadline = !!o.deadline && o.status === "open";

  const [shareCopied, setShareCopied] = useState(false);
  const onShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : `https://stories.dramaticadventure.com/opportunities/${o.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: o.title, text: o.description, url });
        return;
      } catch {
        // fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 1800);
    } catch {
      // ignore
    }
  };

  return (
    <main className="od-root" style={{ ["--accent" as string]: meta.color }}>
      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="od-hero">
        <div className="od-hero-imgwrap">
          <Image
            src={heroImage}
            alt={o.title}
            fill
            priority
            sizes="100vw"
            style={{ objectFit: "cover", objectPosition: "center 35%" }}
          />
        </div>
        <div className="od-hero-overlay" />
        <div className="od-hero-glow" aria-hidden="true" />

        <div className="od-hero-content">
          <Link href="/opportunities" className="od-back">
            ← Back to all opportunities
          </Link>

          <div className="od-hero-badges">
            <Link href={`/opportunities?type=${TYPE_TO_GROUP[o.type]}&browse=1`} className="od-typebadge">{meta.label}</Link>
            <Link href={`/opportunities?browse=1`} style={{ textDecoration: "none" }}><StatusPill status={o.status} /></Link>
            {o.featured && <Link href="/opportunities?browse=1" className="od-featured-star">★ Featured</Link>}
          </div>

          <h1 className="od-hero-title">{o.title}</h1>

          <p className="od-hero-meta">
            <span>{hub.label}</span>
            {o.hub !== "remote" && (
              <>
                <span className="od-dot">·</span>
                <span>{hub.country}</span>
              </>
            )}
            <span className="od-dot">·</span>
            <span>{COMMITMENT_LABELS[o.commitmentType]}</span>
            {o.season && (
              <>
                <span className="od-dot">·</span>
                <span>{o.season}</span>
              </>
            )}
          </p>

          <p className="od-hero-tease">{o.description}</p>

          <div className="od-hero-actions">
            {o.applyUrl && !isClosed && (
              <a
                href={o.applyUrl}
                className="od-cta od-cta--primary"
                target={o.applyUrl.startsWith("http") ? "_blank" : undefined}
                rel={o.applyUrl.startsWith("http") ? "noopener noreferrer" : undefined}
              >
                {o.status === "coming_soon" ? "Get Notified" : "Apply Now"}
              </a>
            )}
            {o.learnMoreUrl && (
              <Link href={o.learnMoreUrl} className="od-cta od-cta--ghost">
                Learn More
              </Link>
            )}
            <button onClick={onShare} className="od-cta od-cta--share" type="button">
              {shareCopied ? "Link copied ✓" : "Share"}
            </button>
          </div>
        </div>
      </section>

      {/* ── KEY DETAILS RIBBON ──────────────────────────── */}
      <section className="od-ribbon">
        <div className="od-ribbon-inner">
          <div className="od-ribbon-cell">
            <span className="od-ribbon-label">Commitment</span>
            <span className="od-ribbon-value">{o.commitment}</span>
          </div>
          <div className="od-ribbon-cell">
            <span className="od-ribbon-label">Compensation</span>
            <span className="od-ribbon-value">
              {o.isPaid ? o.compensation || "Paid" : "Volunteer"}
            </span>
          </div>
          <div className="od-ribbon-cell">
            <span className="od-ribbon-label">Location</span>
            <span className="od-ribbon-value">{hub.label}, {hub.country}</span>
          </div>
          <div className="od-ribbon-cell">
            <span className="od-ribbon-label">
              {showDeadline ? "Apply By" : o.status === "evergreen" ? "Availability" : "Status"}
            </span>
            <span className="od-ribbon-value od-ribbon-value--accent">
              {showDeadline
                ? formatDeadline(o.deadline)
                : o.status === "evergreen"
                  ? "Rolling Basis"
                  : STATUS_LABELS[o.status]}
            </span>
          </div>
        </div>
      </section>

      {/* ── MAIN BODY (two-column) ────────────────────── */}
      <div className="od-body-wrap">
      <div className="od-body">
        <div className="od-body-main">
          {o.longDescription && (
            <Section eyebrow="About this opportunity" title="" accent={meta.color}>
              <div className="od-prose">
                {o.longDescription.split(/\n{2,}/).map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </Section>
          )}

          {o.timeline.length > 0 && (
            <Section eyebrow="Timeline" accent={meta.color}>
              <ol className="od-timeline od-timeline--light">
                {o.timeline.map((t, i) => (
                  <li key={i}>
                    <span className="od-timeline-num">{i + 1}</span>
                    <div>
                      <strong className="od-timeline-label">{t.label}</strong>
                      {t.detail && <div className="od-timeline-detail">{t.detail}</div>}
                    </div>
                  </li>
                ))}
              </ol>
            </Section>
          )}

          {o.whatYoullDo.length > 0 && (
            <Section eyebrow="What you'll do" accent={meta.color}>
              <ul className="od-list od-list--do">
                {o.whatYoullDo.map((item, i) => (
                  <li key={i}>
                    <span className="od-list-mark" style={{ background: meta.color }} aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {o.whoYouAre.length > 0 && (
            <Section eyebrow="Who you are" accent={meta.color}>
              <ul className="od-list od-list--pillars">
                {o.whoYouAre.map((item, i) => {
                  const [head, ...rest] = item.split("—");
                  const tail = rest.join("—").trim();
                  return (
                    <li key={i}>
                      <strong className="od-pillar-head">{head.trim()}</strong>
                      {tail && <span className="od-pillar-tail"> — {tail}</span>}
                    </li>
                  );
                })}
              </ul>
            </Section>
          )}

          {o.requirements.length > 0 && (
            <Section eyebrow="Basic requirements" accent={meta.color}>
              <ul className="od-list">
                {o.requirements.map((item, i) => (
                  <li key={i}>
                    <span className="od-list-mark od-list-mark--ring" style={{ borderColor: meta.color }} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {o.faq.length > 0 && (
            <Section eyebrow="FAQ" accent={meta.color}>
              <div className="od-faq">
                {o.faq.map((f, i) => (
                  <details key={i} className="od-faq-item">
                    <summary>{f.q}</summary>
                    <p>{f.a}</p>
                  </details>
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* ── SIDE: apply card + perks ─────────────── */}
        <aside className="od-side">
          <div className="od-side-inner">
          <div className="od-applycard">
            <span className="od-applycard-eyebrow">Ready to step in?</span>
            <h3 className="od-applycard-title">
              {isClosed ? "Applications closed" : o.status === "coming_soon" ? "Coming soon" : "Take the first step"}
            </h3>
            {showDeadline && (
              <p className="od-applycard-deadline">
                Apply by <strong>{formatDeadline(o.deadline)}</strong>
              </p>
            )}
            {o.status === "evergreen" && (
              <p className="od-applycard-deadline">
                We review applications on a rolling basis.
              </p>
            )}
            {o.applyUrl && !isClosed ? (
              <a
                href={o.applyUrl}
                className="od-applycard-btn"
                target={o.applyUrl.startsWith("http") ? "_blank" : undefined}
                rel={o.applyUrl.startsWith("http") ? "noopener noreferrer" : undefined}
              >
                {o.status === "coming_soon" ? "Get Notified" : "Apply Now"}
              </a>
            ) : (
              <p className="od-applycard-closed">
                This opportunity is currently closed. {o.contactEmail || "hello@dramaticadventure.com"} can answer
                questions about future cohorts.
              </p>
            )}
            <div className="od-applycard-contact">
              Questions?{" "}
              <a href={`mailto:${o.contactEmail || "hello@dramaticadventure.com"}?subject=${encodeURIComponent(o.title)}`}>
                {o.contactEmail || "hello@dramaticadventure.com"}
              </a>
            </div>
          </div>

          {o.perks.length > 0 && (
            <div className="od-perks">
              <span className="od-perks-eyebrow" style={{ color: meta.color }}>What's included</span>
              {/* TODO: tighten perk copy — pills can be verbose */}
              <div className="od-perks-pills">
                {o.perks.map((p, i) => (
                  <span key={i} className="od-perk-pill" style={{ ["--pill-accent" as string]: meta.color }}>
                    <span className="od-perk-pill-check">✓</span>
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}

          {o.roleTypes.length > 0 && (
            <div className="od-roles">
              <span className="od-perks-eyebrow" style={{ color: meta.color }}>Role types</span>
              <div className="od-roles-list">
                {o.roleTypes.map((r) => (
                  <span key={r} className="od-roletag">
                    {OPPORTUNITY_ROLE_LABELS[r]}
                  </span>
                ))}
              </div>
            </div>
          )}
          </div>{/* end od-side-inner */}
        </aside>
      </div>
      </div>

      {/* ── RELATED ─────────────────────────────────── */}
      {related.length > 0 && (
        <section className="od-related">
          <div className="od-related-inner">
            <span className="od-related-eyebrow">More like this</span>
            <h2 className="od-related-title">Other {meta.label} opportunities</h2>
            <div className="od-related-grid">
              {related.map((r) => {
                const rm = TYPE_GROUP_META[TYPE_TO_GROUP[r.type]];
                return (
                  <Link
                    key={r.id}
                    href={`/opportunities/${r.id}`}
                    className="od-related-card"
                    style={{ ["--ca" as string]: rm.color }}
                  >
                    <span className="od-related-card-type">{rm.label}</span>
                    <h3 className="od-related-card-title">{r.title}</h3>
                    <p className="od-related-card-meta">
                      {HUB_META[r.hub].label} · {COMMITMENT_LABELS[r.commitmentType]}
                    </p>
                    <span className="od-related-card-arrow">→</span>
                  </Link>
                );
              })}
            </div>
            <div className="od-related-footer">
              <Link href="/opportunities" className="od-related-all">
                Browse all opportunities →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── MOBILE STICKY CTA ───────────────────────── */}
      {o.applyUrl && !isClosed && (
        <div className="od-mobile-cta" aria-label="Quick apply">
          <a
            href={o.applyUrl}
            className="od-mobile-cta-btn"
            target={o.applyUrl.startsWith("http") ? "_blank" : undefined}
            rel={o.applyUrl.startsWith("http") ? "noopener noreferrer" : undefined}
          >
            {o.status === "coming_soon" ? "Get Notified" : "Apply Now"}
          </a>
        </div>
      )}

      {/* ── STYLES ──────────────────────────────────── */}
      <style>{`
        .od-root { background: transparent; color: #241123; }

        /* ── Hero ── */
        .od-hero {
          position: relative;
          min-height: 68vh;
          display: flex;
          align-items: flex-end;
          overflow: hidden;
          background: #0d0812;
        }
        .od-hero-imgwrap { position: absolute; inset: 0; z-index: 0; }
        .od-hero-overlay {
          position: absolute; inset: 0; z-index: 1;
          background:
            linear-gradient(to right, rgba(8,3,12,0.68) 0%, rgba(8,3,12,0.38) 45%, rgba(8,3,12,0.1) 80%, rgba(8,3,12,0) 100%),
            linear-gradient(to top, rgba(8,3,12,0.88) 0%, rgba(8,3,12,0) 60%);
        }
        .od-hero-glow {
          position: absolute; inset: 0; z-index: 1;
          background: radial-gradient(ellipse 50% 50% at 80% 30%, color-mix(in srgb, var(--accent) 22%, transparent) 0%, transparent 70%);
        }
        .od-hero-content {
          position: relative; z-index: 2;
          width: 100%;
          max-width: 1180px;
          margin: 0 auto;
          padding: clamp(4rem, 8vw, 6rem) clamp(1.25rem, 5vw, 3rem) clamp(2.5rem, 5vw, 4rem);
        }
        .od-back {
          display: inline-flex;
          align-items: center;
          min-height: 44px;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.5);
          text-decoration: none;
          margin-bottom: 1rem;
          transition: color 160ms ease;
        }
        .od-back:hover { color: #FFCC00; }

        .od-hero-badges { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem; align-items: center; }
        .od-typebadge {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.66rem;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          padding: 0.35rem 0.75rem;
          border-radius: 6px;
          background: var(--accent);
          color: #fff;
          text-decoration: none;
          cursor: pointer;
        }
        .od-statuspill {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          padding: 0.32rem 0.7rem;
          border-radius: 6px;
          border: 1px solid;
        }
        .od-featured-star {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.66rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #FFCC00;
          padding: 0.32rem 0.7rem;
          background: rgba(255,204,0,0.12);
          border: 1px solid rgba(255,204,0,0.4);
          border-radius: 6px;
          text-decoration: none;
          cursor: pointer;
        }
        .od-hero-title {
          font-family: var(--font-anton), sans-serif;
          font-size: clamp(2.2rem, 7vw, 5.5rem);
          font-weight: 400;
          line-height: 1;
          color: #fff;
          margin: 0 0 1rem;
          text-shadow: 0 10px 36px rgba(0,0,0,0.95), 0 3px 12px rgba(0,0,0,0.8);
          letter-spacing: 0.005em;
          max-width: 920px;
        }
        .od-hero-meta {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.88rem;
          color: rgba(255,255,255,0.82);
          margin: 0 0 1.15rem;
          display: flex; flex-wrap: wrap; gap: 0.35rem;
          text-shadow: 0 2px 12px rgba(0,0,0,0.85);
        }
        .od-dot { opacity: 0.4; }
        .od-hero-tease {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: clamp(0.98rem, 1.7vw, 1.18rem);
          line-height: 1.68;
          color: rgba(255,255,255,0.92);
          max-width: 760px;
          margin: 0 0 1.75rem;
          text-shadow: 0 3px 14px rgba(0,0,0,0.95), 0 0 4px rgba(0,0,0,0.7);
        }

        .od-hero-actions { display: flex; flex-wrap: wrap; gap: 0.7rem; }
        .od-cta {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          padding: 0.95rem 1.6rem;
          border-radius: 12px;
          text-decoration: none;
          cursor: pointer;
          border: none;
          transition: transform 160ms ease, background 160ms ease, color 160ms ease;
        }
        .od-cta--primary { background: #FFCC00; color: #241123; }
        .od-cta--primary:hover { transform: translateY(-2px); background: #ffd633; }
        .od-cta--ghost {
          background: transparent;
          color: #f2f2f2;
          border: 1.5px solid rgba(242,242,242,0.4);
        }
        .od-cta--ghost:hover { background: rgba(242,242,242,0.12); transform: translateY(-2px); }
        .od-cta--share {
          background: rgba(242,242,242,0.08);
          color: #f2f2f2;
          border: 1.5px solid rgba(242,242,242,0.2);
        }
        .od-cta--share:hover { background: rgba(242,242,242,0.16); transform: translateY(-2px); }

        /* ── Ribbon ── */
        .od-ribbon {
          background: #2411233c;
          color: #f2f2f2;
          padding: 0 clamp(1.25rem, 5vw, 3rem);
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .od-ribbon-inner {
          max-width: 1180px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 0.7fr 1.4fr 1fr 0.9fr;
          gap: 0;
        }
        .od-ribbon-cell {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          padding: 1.25rem 1.25rem 1.25rem 0;
          border-right: 1px solid rgba(255,255,255,0.07);
        }
        .od-ribbon-cell:first-child { padding-left: 0; }
        .od-ribbon-cell:last-child { border-right: none; padding-left: 1.25rem; padding-right: 0; }
        .od-ribbon-cell:not(:first-child):not(:last-child) { padding-left: 1.25rem; }
        @media (max-width: 720px) {
          .od-ribbon { padding-top: 0; padding-bottom: 0; }
          .od-ribbon-inner { grid-template-columns: 1fr 1fr; }
          .od-ribbon-cell {
            padding: 1.1rem 1rem;
            border-right: 1px solid rgba(255,255,255,0.07);
            border-bottom: 1px solid rgba(255,255,255,0.07);
          }
          .od-ribbon-cell:nth-child(2n) { border-right: none; }
          .od-ribbon-cell:nth-child(n+3) { border-bottom: none; }
        }
        .od-ribbon-label {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.59rem;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.35);
        }
        .od-ribbon-value {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.98rem;
          font-weight: 600;
          color: #fff;
          line-height: 1.3;
        }
        .od-ribbon-value--accent { color: #FFCC00; }

        /* ── Body ── */
        .od-body-wrap {
          padding: clamp(1.5rem, 3vw, 2.5rem) clamp(1rem, 4vw, 2.5rem);
        }
        @media (max-width: 520px) {
          .od-body-wrap { padding: 1rem 0.75rem; }
        }
        .od-body {
          max-width: 1220px;
          margin: 0 auto;
          background: transparent;
          border: 1px solid rgba(36,17,35,0.1);
          border-radius: 20px;
          box-shadow: 0 12px 52px rgba(36,17,35,0.15), 0 3px 10px rgba(36,17,35,0.07);
          padding: 0;
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 0;
          align-items: start;
          overflow: clip;
        }
        @media (max-width: 960px) { .od-body { grid-template-columns: 1fr; } }
        .od-body-main {
          background: #fdf9e3b3;
          padding: clamp(1.75rem, 5vw, 3.5rem);
          padding-right: clamp(2rem, 4vw, 3rem);
        }
        @media (max-width: 520px) { .od-body-main { padding: 1.5rem 1.25rem; } }
        .od-side {
          border-left: 1px solid rgba(255,255,255,0.07);
          background: #24112383;
          align-self: stretch;
          padding: 0;
        }
        .od-side-inner {
          position: sticky;
          top: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          padding: clamp(1.75rem, 4vw, 2.5rem) clamp(1.25rem, 3vw, 2rem);
        }
        @media (max-width: 960px) {
          .od-side {
            border-left: none;
            border-top: 1px solid rgba(255,255,255,0.07);
            background: #000;
          }
          .od-side-inner {
            position: static;
            padding: clamp(1.5rem, 4vw, 2rem);
          }
        }
        @media (max-width: 520px) { .od-side-inner { padding: 1.5rem 1.25rem; } }
        .od-section { margin-bottom: clamp(1.75rem, 3.5vw, 2.75rem); }
        .od-section:last-child { margin-bottom: 0; }
        .od-section + .od-section {
          padding-top: clamp(1.5rem, 3vw, 2rem);
          border-top: 1px solid rgba(36,17,35,0.07);
        }
        .od-section-eyebrow {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 1.05rem;
          font-weight: 900;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          display: block;
          margin-bottom: 1rem;
          line-height: 1.4;
        }
        .od-section-title {
          font-family: var(--font-anton), sans-serif;
          font-size: clamp(1.7rem, 3vw, 2.4rem);
          font-weight: 400;
          color: #241123;
          line-height: 1.05;
          margin: 0 0 1.25rem;
          letter-spacing: 0.005em;
        }
        .od-section-body {}

        .od-prose p {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 1.02rem;
          line-height: 1.78;
          color: rgba(36,17,35,0.82);
          margin: 0 0 1.15rem;
        }
        .od-prose p:last-child { margin: 0; }

        /* ── Lists ── */
        .od-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }
        .od-list li {
          display: flex;
          align-items: flex-start;
          gap: 0.85rem;
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 1rem;
          line-height: 1.6;
          color: rgba(36,17,35,0.85);
        }
        .od-list-mark {
          flex: 0 0 8px;
          width: 8px; height: 8px;
          border-radius: 50%;
          background: var(--accent);
          margin-top: 0.55rem;
        }
        .od-list-mark--ring {
          background: transparent;
          border: 2px solid;
        }

        /* "What you'll do" — accent-line editorial */
        .od-list--do { gap: 0; }
        .od-list--do > li {
          padding: 0.95rem 0;
          border-bottom: 1px solid rgba(36,17,35,0.07);
          align-items: center;
          gap: 1.1rem;
        }
        .od-list--do > li:first-child { padding-top: 0; }
        .od-list--do > li:last-child { border-bottom: none; padding-bottom: 0; }
        .od-list--do .od-list-mark { display: none; }
        .od-list--do > li::before {
          content: '';
          flex: 0 0 22px;
          height: 2.5px;
          background: var(--accent);
          border-radius: 2px;
          align-self: center;
        }

        /* "Who you are" — pillar cards */
        .od-list--pillars { gap: 0.55rem; }
        .od-list--pillars li {
          display: block;
          line-height: 1.6;
          background: #6c00af1f;
          border-radius: 10px;
          padding: 0.85rem 1rem;
          border-left: 3px solid var(--accent);
        }
        .od-pillar-head {
          font-family: var(--font-space-grotesk), sans-serif;
          font-weight: 700;
          color: var(--accent);
        }
        .od-pillar-tail {
          font-family: var(--font-space-grotesk), sans-serif;
          color: rgba(36,17,35,0.72);
        }

        /* ── Timeline ── */
        .od-timeline {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
        }
        .od-timeline li {
          position: relative;
          display: flex;
          gap: 1.1rem;
          padding: 0 0 1.5rem 0;
        }
        .od-timeline li:last-child { padding-bottom: 0; }
        .od-timeline li:not(:last-child)::before {
          content: '';
          position: absolute;
          left: 1.1rem;
          top: 2.2rem;
          bottom: 0;
          width: 2px;
          background: rgba(255,255,255,0.12);
          z-index: 0;
        }
        .od-timeline-num {
          flex: 0 0 2.2rem;
          width: 2.2rem;
          height: 2.2rem;
          border-radius: 50%;
          background: var(--accent);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.75rem;
          font-weight: 800;
          position: relative;
          z-index: 1;
          flex-shrink: 0;
          align-self: flex-start;
        }
        .od-timeline-label {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.98rem;
          font-weight: 700;
          color: #fff;
          display: block;
          padding-top: 0.3rem;
        }
        .od-timeline-detail {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.92rem;
          color: rgba(255,255,255,0.55);
          margin-top: 0.2rem;
          line-height: 1.6;
        }

        /* Light-background variant (left column) */
        .od-timeline--light .od-timeline-label { color: #241123; }
        .od-timeline--light .od-timeline-detail { color: rgba(36,17,35,0.6); }
        .od-timeline--light li:not(:last-child)::before { background: rgba(36,17,35,0.12); }

        /* ── FAQ ── */
        .od-faq { display: flex; flex-direction: column; gap: 0.5rem; }
        .od-faq-item {
          background: #24112308;
          border: 1px solid rgba(36,17,35,0.08);
          border-radius: 12px;
          padding: 0 1.25rem;
          transition: background 160ms ease, border-left 160ms ease;
        }
        .od-faq-item[open] {
          background: rgba(36,17,35,0.05);
          border-left: 3px solid var(--accent);
          padding-left: calc(1.25rem - 2px);
        }
        .od-faq-item summary {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 1rem;
          font-weight: 700;
          color: #241123;
          padding: 1rem 0;
          min-height: 56px;
          cursor: pointer;
          list-style: none;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }
        .od-faq-item summary::-webkit-details-marker { display: none; }
        .od-faq-item summary::after {
          content: "";
          width: 8px;
          height: 8px;
          border-right: 2.5px solid var(--accent);
          border-bottom: 2.5px solid var(--accent);
          transform: rotate(45deg);
          flex-shrink: 0;
          transition: transform 200ms ease;
        }
        .od-faq-item[open] summary::after { transform: rotate(-135deg); }
        .od-faq-item p {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.95rem;
          line-height: 1.75;
          color: rgba(36,17,35,0.75);
          margin: 0 0 1.1rem;
        }

        /* ── Side column ── */

        .od-applycard {
          position: relative;
          overflow: hidden;
          background: #FFCC00;
          color: #241123;
          padding: 1.75rem 1.5rem 1.5rem;
          border-radius: 18px;
          border: none;
          box-shadow: 0 6px 24px rgba(0,0,0,0.35);
        }
        .od-applycard::after {
          content: "★";
          position: absolute;
          right: -0.75rem;
          bottom: -1.5rem;
          font-size: 9rem;
          line-height: 1;
          color: rgba(0,0,0,0.07);
          pointer-events: none;
          user-select: none;
        }
        .od-applycard-eyebrow {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(36,17,35,0.55);
          display: block;
          margin-bottom: 0.6rem;
          position: relative; z-index: 1;
        }
        .od-applycard-title {
          font-family: var(--font-anton), sans-serif;
          font-size: 1.7rem;
          font-weight: 400;
          margin: 0 0 0.7rem;
          line-height: 1.05;
          color: #241123;
          position: relative; z-index: 1;
        }
        .od-applycard-deadline {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.92rem;
          color: rgba(36,17,35,0.65);
          margin: 0 0 1.25rem;
          position: relative; z-index: 1;
        }
        .od-applycard-deadline strong { color: #241123; font-weight: 700; }
        .od-applycard-btn {
          display: block;
          text-align: center;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          padding: 1rem 1.4rem;
          background: #241123;
          color: #FFCC00;
          border-radius: 12px;
          text-decoration: none;
          margin-bottom: 1rem;
          position: relative; z-index: 1;
          transition: transform 160ms ease, opacity 160ms ease;
        }
        .od-applycard-btn:hover { transform: translateY(-2px); opacity: 0.88; }
        .od-applycard-closed {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.88rem;
          line-height: 1.6;
          color: rgba(36,17,35,0.7);
          margin: 0 0 1rem;
          position: relative; z-index: 1;
        }
        .od-applycard-contact {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.78rem;
          color: rgba(36,17,35,0.5);
          padding-top: 1rem;
          border-top: 1px solid rgba(36,17,35,0.12);
          position: relative; z-index: 1;
        }
        .od-applycard-contact a { color: #241123; text-decoration: none; font-weight: 600; }
        .od-applycard-contact a:hover { text-decoration: underline; }

        .od-perks {
          padding-top: 0.9rem;
          border-top: 1px solid rgba(255,255,255,0.1);
        }
        .od-perks-eyebrow {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.68rem;
          font-weight: 1200;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          display: block;
          margin-bottom: 0.85rem;
          color: #ffcc00 !important;
        }
        .od-perks-pills {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.45rem;
        }
        .od-perk-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.85rem;
          font-weight: 700;
          color: #fff2bd;
          background: #d9a91928;
          border-radius: 999px;
          padding: 0.3rem 1rem;
        }
        .od-perk-pill-check {
          font-size: 0.8rem;
          color: #ffcc00 !important;
          font-weight: 800;
          flex-shrink: 0;
        }

        .od-roles {
          padding-top: 0.85rem;
          border-top: 1px solid rgba(255,255,255,0.1);
        }
        .od-roles-list { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 0.1rem; }
        .od-roletag {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.8rem;
          font-weight: 600;
          padding: 0.35rem 0.8rem;
          border-radius: 999px;
          background: #d9a9191f;
          border: 0.5px solid #ffcc00d8;
          color: #fff2bd;
          transition: background 140ms ease;
        }
        .od-roletag:hover { background: #ffcc0038; }

        /* ── Related ── */
        .od-related {
          background: transparent;
          padding: clamp(3rem, 6vw, 5rem) clamp(1.25rem, 5vw, 3rem);
        }
        .od-related-inner { max-width: 1180px; margin: 0 auto; }
        .od-related-eyebrow {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #241123;
          display: block;
          margin-bottom: 0.5rem;
        }
        .od-related-title {
          font-family: var(--font-anton), sans-serif;
          font-size: clamp(2.8rem, 3.5vw, 3.6rem);
          font-weight: 400;
          margin: 0 0 1.75rem;
          color: #241123;
        }
        .od-related-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }
        @media (max-width: 820px) { .od-related-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 520px) {
          .od-related-grid {
            display: flex;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
            gap: 0.85rem;
            padding-bottom: 0.75rem;
            scrollbar-width: none;
          }
          .od-related-grid::-webkit-scrollbar { display: none; }
          .od-related-card { flex: 0 0 240px; scroll-snap-align: start; }
        }
        .od-related-card {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          background: #f2f2f22b;
          padding: 1.35rem;
          border-radius: 14px;
          border: none;
          border-top: 0px solid var(--ca);
          box-shadow: 0 4px 20px rgba(36,17,35,0.18);
          text-decoration: none;
          color: inherit;
          transition: transform 200ms ease, box-shadow 200ms ease;
        }
        .od-related-card:hover { transform: translateY(-4px); box-shadow: 0 10px 36px rgba(36,17,35,0.28); }
        .od-related-card-type {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #ffcc00;
        }
        .od-related-card-title {
          font-family: var(--font-anton), sans-serif;
          font-size: 1.8rem;
          font-weight: 400;
          color: #241123;
          margin: 0;
          line-height: 1.15;
        }
        .od-related-card-meta {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.85rem;
          color: #241123a8;
          margin: 0;
        }
        .od-related-card-arrow {
          font-family: var(--font-anton), sans-serif;
          color: #ffcc00;
          font-size: 1.5rem;
          margin-top: auto;
          padding-top: 0.25rem;
          transition: transform 200ms ease;
        }
        .od-related-card:hover .od-related-card-arrow { transform: translateX(4px); }

        .od-related-footer {
          margin-top: 1.5rem;
          text-align: center;
        }
        .od-related-all {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #ffcc00;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          min-height: 44px;
          transition: color 160ms ease;
        }
        .od-related-all:hover { color: #241123; }

        /* ── Mobile sticky CTA ── */
        .od-mobile-cta {
          display: none;
          position: fixed;
          bottom: 0; left: 0; right: 0;
          z-index: 80;
          padding: 0.85rem 1.25rem;
          background: rgba(36,17,35,0.97);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-top: 1px solid rgba(255,255,255,0.08);
        }
        @media (max-width: 960px) { .od-mobile-cta { display: block; } }
        @media (max-width: 960px) { .od-root { padding-bottom: 5.5rem; } }
        .od-mobile-cta-btn {
          display: block;
          text-align: center;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.88rem;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          padding: 1rem 1.4rem;
          background: #FFCC00;
          color: #241123;
          border-radius: 12px;
          text-decoration: none;
          transition: opacity 160ms ease;
        }
        .od-mobile-cta-btn:hover { opacity: 0.9; }
      `}</style>
    </main>
  );
}
