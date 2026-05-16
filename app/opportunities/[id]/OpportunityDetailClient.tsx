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
            <span className="od-typebadge">{meta.label}</span>
            <StatusPill status={o.status} />
            {o.featured && <span className="od-featured-star">★ Featured</span>}
          </div>

          <h1 className="od-hero-title">{o.title}</h1>

          <p className="od-hero-meta">
            <span>{hub.label}</span>
            <span className="od-dot">·</span>
            <span>{hub.country}</span>
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
              {showDeadline ? "Apply By" : o.status === "evergreen" ? "Status" : "Status"}
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

          {o.whatYoullDo.length > 0 && (
            <Section eyebrow="What you'll do" accent={meta.color}>
              <ul className="od-list">
                {o.whatYoullDo.map((item, i) => (
                  <li key={i}>
                    <span className="od-list-mark" style={{ background: meta.color }} />
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

          {o.timeline.length > 0 && (
            <Section eyebrow="Timeline" accent={meta.color}>
              <ol className="od-timeline">
                {o.timeline.map((t, i) => (
                  <li key={i}>
                    <span className="od-timeline-num">{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <strong className="od-timeline-label">{t.label}</strong>
                      {t.detail && <div className="od-timeline-detail">{t.detail}</div>}
                    </div>
                  </li>
                ))}
              </ol>
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
              <ul>
                {o.perks.map((p, i) => (
                  <li key={i}>
                    <span className="od-perks-check" style={{ color: meta.color }}>✓</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
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
          </div>
        </section>
      )}

      {/* ── STYLES ──────────────────────────────────── */}
      <style>{`
        .od-root { background: transparent; color: #241123; }

        /* ── Hero ── */
        .od-hero {
          position: relative;
          min-height: 64vh;
          display: flex;
          align-items: flex-end;
          overflow: hidden;
          background: #0d0812;
        }
        .od-hero-imgwrap { position: absolute; inset: 0; z-index: 0; }
        .od-hero-overlay {
          position: absolute; inset: 0; z-index: 1;
          background:
            linear-gradient(to right, rgba(8,3,12,0.62) 0%, rgba(8,3,12,0.32) 45%, rgba(8,3,12,0.08) 80%, rgba(8,3,12,0) 100%),
            linear-gradient(to top, rgba(8,3,12,0.72) 0%, rgba(8,3,12,0) 55%);
        }
        .od-hero-glow {
          position: absolute; inset: 0; z-index: 1;
          background: radial-gradient(ellipse 50% 50% at 80% 30%, color-mix(in srgb, var(--accent) 18%, transparent) 0%, transparent 70%);
        }
        .od-hero-content {
          position: relative; z-index: 2;
          width: 100%;
          max-width: 1180px;
          margin: 0 auto;
          padding: clamp(4rem, 8vw, 6rem) clamp(1.25rem, 5vw, 3rem) clamp(2.5rem, 5vw, 4rem);
        }
        .od-back {
          display: inline-block;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.5);
          text-decoration: none;
          margin-bottom: 1.5rem;
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
        }
        .od-hero-title {
          font-family: var(--font-anton), sans-serif;
          font-size: clamp(2.5rem, 7vw, 5.5rem);
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
          font-size: 0.92rem;
          color: #fff;
          margin: 0 0 1.25rem;
          display: flex; flex-wrap: wrap; gap: 0.45rem;
          text-shadow: 0 2px 12px rgba(0,0,0,0.85);
        }
        .od-dot { opacity: 0.55; }
        .od-hero-tease {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: clamp(1rem, 1.7vw, 1.18rem);
          line-height: 1.65;
          color: #fff;
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
          background: #241123;
          color: #fff;
          padding: 1.5rem clamp(1.25rem, 5vw, 3rem);
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .od-ribbon-inner {
          max-width: 1180px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
        }
        @media (max-width: 720px) { .od-ribbon-inner { grid-template-columns: repeat(2, 1fr); } }
        .od-ribbon-cell { display: flex; flex-direction: column; gap: 0.25rem; }
        .od-ribbon-label {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.4);
        }
        .od-ribbon-value {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.98rem;
          font-weight: 600;
          color: #fff;
        }
        .od-ribbon-value--accent { color: #FFCC00; }

        /* ── Body ── */
        .od-body-wrap {
          padding: clamp(2rem, 4vw, 3rem) clamp(1.25rem, 5vw, 3rem);
        }
        .od-body {
          max-width: 1220px;
          margin: 0 auto;
          background: rgba(254,250,242,0.78);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          border: 1px solid rgba(255,255,255,0.5);
          border-radius: 20px;
          box-shadow: 0 6px 32px rgba(36,17,35,0.05), inset 0 1px 0 rgba(255,255,255,0.5);
          padding: clamp(2rem, 5vw, 3.5rem);
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: clamp(2rem, 5vw, 4rem);
          align-items: start;
        }
        @media (max-width: 960px) { .od-body { grid-template-columns: 1fr; } }

        .od-section { margin-bottom: clamp(2rem, 4vw, 3rem); }
        .od-section:last-child { margin-bottom: 0; }
        .od-section-eyebrow {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          display: block;
          margin-bottom: 0.6rem;
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
          line-height: 1.75;
          color: rgba(36,17,35,0.85);
          margin: 0 0 1.15rem;
        }
        .od-prose p:last-child { margin: 0; }

        .od-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
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
        .od-list--pillars li { display: block; line-height: 1.6; }
        .od-pillar-head {
          font-family: var(--font-space-grotesk), sans-serif;
          font-weight: 700;
          color: var(--accent);
        }
        .od-pillar-tail {
          font-family: var(--font-space-grotesk), sans-serif;
          color: rgba(36,17,35,0.78);
        }

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
          gap: 1rem;
          padding: 0.85rem 0;
          border-bottom: 1px solid rgba(36,17,35,0.08);
        }
        .od-timeline li:last-child { border-bottom: none; }
        .od-timeline-num {
          font-family: var(--font-anton), sans-serif;
          font-size: 1.5rem;
          color: var(--accent);
          font-weight: 400;
          flex: 0 0 2.2rem;
          line-height: 1.1;
        }
        .od-timeline-label {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.98rem;
          font-weight: 700;
          color: #241123;
          display: block;
        }
        .od-timeline-detail {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.92rem;
          color: rgba(36,17,35,0.65);
          margin-top: 0.15rem;
        }

        .od-faq { display: flex; flex-direction: column; gap: 0.5rem; }
        .od-faq-item {
          background: rgba(36,17,35,0.03);
          border: 1px solid rgba(36,17,35,0.08);
          border-radius: 12px;
          padding: 0 1.25rem;
          transition: background 160ms ease;
        }
        .od-faq-item[open] { background: rgba(36,17,35,0.05); }
        .od-faq-item summary {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 1rem;
          font-weight: 700;
          color: #241123;
          padding: 1rem 0;
          cursor: pointer;
          list-style: none;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }
        .od-faq-item summary::-webkit-details-marker { display: none; }
        .od-faq-item summary::after {
          content: "+";
          font-family: var(--font-anton), sans-serif;
          font-size: 1.3rem;
          color: var(--accent);
          transition: transform 200ms ease;
        }
        .od-faq-item[open] summary::after { transform: rotate(45deg); }
        .od-faq-item p {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.95rem;
          line-height: 1.7;
          color: rgba(36,17,35,0.78);
          margin: 0 0 1rem;
        }

        /* ── Side column ── */
        .od-side { display: flex; flex-direction: column; gap: 1.5rem; position: sticky; top: 1.5rem; }
        @media (max-width: 960px) { .od-side { position: static; } }
        .od-applycard {
          background: linear-gradient(160deg, #241123 0%, #3a1a3a 100%);
          color: #fff;
          padding: 1.75rem 1.5rem 1.5rem;
          border-radius: 18px;
          border: 1px solid rgba(255,204,0,0.18);
          box-shadow: 0 10px 36px rgba(36,17,35,0.18);
        }
        .od-applycard-eyebrow {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #FFCC00;
          display: block;
          margin-bottom: 0.6rem;
        }
        .od-applycard-title {
          font-family: var(--font-anton), sans-serif;
          font-size: 1.7rem;
          font-weight: 400;
          margin: 0 0 0.7rem;
          line-height: 1.05;
        }
        .od-applycard-deadline {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.92rem;
          color: rgba(255,255,255,0.78);
          margin: 0 0 1.25rem;
        }
        .od-applycard-deadline strong { color: #FFCC00; font-weight: 700; }
        .od-applycard-btn {
          display: block;
          text-align: center;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          padding: 1rem 1.4rem;
          background: #FFCC00;
          color: #241123;
          border-radius: 12px;
          text-decoration: none;
          margin-bottom: 1rem;
          transition: transform 160ms ease, opacity 160ms ease;
        }
        .od-applycard-btn:hover { transform: translateY(-2px); opacity: 0.94; }
        .od-applycard-closed {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.88rem;
          line-height: 1.6;
          color: rgba(255,255,255,0.72);
          margin: 0 0 1rem;
        }
        .od-applycard-contact {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.78rem;
          color: rgba(255,255,255,0.55);
          padding-top: 1rem;
          border-top: 1px solid rgba(255,255,255,0.08);
        }
        .od-applycard-contact a { color: #FFCC00; text-decoration: none; }
        .od-applycard-contact a:hover { text-decoration: underline; }

        .od-perks {
          background: #fff;
          padding: 1.5rem;
          border-radius: 16px;
          border: 1px solid rgba(36,17,35,0.08);
        }
        .od-perks-eyebrow {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          display: block;
          margin-bottom: 0.85rem;
        }
        .od-perks ul {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }
        .od-perks li {
          display: flex;
          align-items: flex-start;
          gap: 0.65rem;
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.92rem;
          line-height: 1.5;
          color: rgba(36,17,35,0.82);
        }
        .od-perks-check { flex: 0 0 1rem; font-weight: 700; }

        .od-roles {
          background: #fff;
          padding: 1.5rem;
          border-radius: 16px;
          border: 1px solid rgba(36,17,35,0.08);
        }
        .od-roles-list { display: flex; flex-wrap: wrap; gap: 0.4rem; }
        .od-roletag {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.7rem;
          font-weight: 600;
          padding: 0.3rem 0.7rem;
          border-radius: 999px;
          background: rgba(36,17,35,0.05);
          color: rgba(36,17,35,0.7);
        }

        /* ── Related ── */
        .od-related {
          background: rgba(36,17,35,0.04);
          padding: clamp(3rem, 6vw, 5rem) clamp(1.25rem, 5vw, 3rem);
          border-top: 1px solid rgba(36,17,35,0.08);
        }
        .od-related-inner { max-width: 1180px; margin: 0 auto; }
        .od-related-eyebrow {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(36,17,35,0.5);
          display: block;
          margin-bottom: 0.6rem;
        }
        .od-related-title {
          font-family: var(--font-anton), sans-serif;
          font-size: clamp(1.8rem, 3.5vw, 2.6rem);
          font-weight: 400;
          margin: 0 0 1.75rem;
          color: #241123;
        }
        .od-related-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
        }
        @media (max-width: 820px) { .od-related-grid { grid-template-columns: 1fr; } }
        .od-related-card {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 0.55rem;
          background: #fff;
          padding: 1.5rem;
          border-radius: 14px;
          border: 1px solid rgba(36,17,35,0.08);
          border-top: 3px solid var(--ca);
          text-decoration: none;
          color: inherit;
          transition: transform 200ms ease, box-shadow 200ms ease;
        }
        .od-related-card:hover { transform: translateY(-4px); box-shadow: 0 14px 36px rgba(36,17,35,0.12); }
        .od-related-card-type {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--ca);
        }
        .od-related-card-title {
          font-family: var(--font-anton), sans-serif;
          font-size: 1.35rem;
          font-weight: 400;
          color: #241123;
          margin: 0;
          line-height: 1.15;
        }
        .od-related-card-meta {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.85rem;
          color: rgba(36,17,35,0.6);
          margin: 0;
        }
        .od-related-card-arrow {
          font-family: var(--font-anton), sans-serif;
          color: var(--ca);
          font-size: 1.2rem;
          margin-top: 0.5rem;
          transition: transform 200ms ease;
        }
        .od-related-card:hover .od-related-card-arrow { transform: translateX(4px); }
      `}</style>
    </main>
  );
}
