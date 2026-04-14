// app/campaign/page.tsx
/**
 * Campaign hub — editorial listing of all DAT fundraising campaigns.
 *
 * Active campaigns are featured prominently.
 * Ended/archived campaigns are listed tastefully below.
 *
 * No live totals are fetched here — this is a discovery + navigation surface.
 * Users click through to the individual campaign page for live data.
 */

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getAllCampaigns } from "@/lib/fundraisingCampaigns";
import { formatCurrency, daysUntilDeadline } from "@/lib/fundraisingCampaigns";
import type { FundraisingCampaign } from "@/lib/fundraisingCampaigns";

export const metadata: Metadata = {
  title: "Campaigns | Dramatic Adventure Theatre",
  description:
    "Support DAT's artists and community programs through focused fundraising campaigns. Every gift is specific, purposeful, and directly impactful.",
  openGraph: {
    title: "Campaigns | Dramatic Adventure Theatre",
    description:
      "Support DAT's artists and community programs through focused fundraising campaigns.",
  },
};

/* ------------------------------------------------------------------ */
/* Active campaign card — prominent, with hero image                  */
/* ------------------------------------------------------------------ */

function ActiveCampaignCard({ campaign }: { campaign: FundraisingCampaign }) {
  const daysLeft = daysUntilDeadline(campaign.deadline);

  return (
    <article className="chub-active-card">
      {/* Hero image */}
      <div className="chub-card-img-wrap">
        <Image
          src={campaign.heroImage}
          alt={campaign.title}
          fill
          sizes="(min-width: 1024px) 55vw, 95vw"
          style={{ objectFit: "cover", objectPosition: campaign.heroImageFocus ?? "center" }}
        />
        <div className="chub-card-img-overlay" />

        {/* Status badges */}
        <div className="chub-card-badges">
          <span className="chub-badge chub-badge--active">Active Campaign</span>
          {campaign.matchActive && (
            <span className="chub-badge chub-badge--match">⚡ Match Active</span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="chub-card-body">
        {campaign.eyebrow && (
          <span className="chub-card-eyebrow">{campaign.eyebrow}</span>
        )}
        <h2 className="chub-card-title">{campaign.title}</h2>
        <p className="chub-card-tagline">{campaign.tagline}</p>

        <div className="chub-card-meta">
          <span className="chub-card-goal">
            Goal: {formatCurrency(campaign.goalAmount, campaign.currency ?? "usd")}
          </span>
          {typeof daysLeft === "number" && daysLeft > 0 && (
            <span className="chub-card-deadline">
              {daysLeft} {daysLeft === 1 ? "day" : "days"} left
            </span>
          )}
          {campaign.deadline && typeof daysLeft === "number" && daysLeft === 0 && (
            <span className="chub-card-deadline chub-card-deadline--ended">Deadline today</span>
          )}
        </div>

        <div className="chub-card-actions">
          <Link href={`/campaign/${campaign.id}`} className="chub-btn-primary">
            Give Now
          </Link>
          <Link href={`/campaign/${campaign.id}`} className="chub-btn-secondary">
            View Campaign
          </Link>
        </div>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* Evergreen campaign card — sidebar companion to the live campaign   */
/* ------------------------------------------------------------------ */

function EvergreenCampaignCard({ campaign }: { campaign: FundraisingCampaign }) {
  return (
    <article className="chub-evergreen-card">
      {campaign.heroImage && (
        <div className="chub-evergreen-img-wrap">
          <Image
            src={campaign.heroImage}
            alt={campaign.title}
            fill
            sizes="(min-width:1024px) 340px, 90vw"
            style={{ objectFit: "cover", objectPosition: campaign.heroImageFocus ?? "center top" }}
          />
          <div className="chub-evergreen-img-overlay" />
        </div>
      )}
      <div className="chub-evergreen-body">
        <div className="chub-evergreen-top">
          <span className="chub-badge chub-badge--evergreen">Always Open</span>
          {campaign.allowMonthly && (
            <span className="chub-badge chub-badge--monthly">Monthly giving</span>
          )}
        </div>
        {campaign.eyebrow && (
          <span className="chub-evergreen-eyebrow">{campaign.eyebrow}</span>
        )}
        <h3 className="chub-evergreen-title">{campaign.title}</h3>
        <p className="chub-evergreen-tagline">{campaign.tagline}</p>
        <Link href={`/campaign/${campaign.id}`} className="chub-btn-evergreen">
          Give Monthly
        </Link>
        <Link href={`/campaign/${campaign.id}`} className="chub-btn-evergreen-ghost">
          Give Once
        </Link>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* Archived campaign row — compact, tasteful                          */
/* ------------------------------------------------------------------ */

function ArchivedCampaignRow({ campaign }: { campaign: FundraisingCampaign }) {
  return (
    <Link href={`/campaign/${campaign.id}`} className="chub-archive-row">
      {campaign.heroImage && (
        <div className="chub-archive-thumb">
          <Image
            src={campaign.heroImage}
            alt={campaign.title}
            fill
            sizes="80px"
            style={{ objectFit: "cover", objectPosition: campaign.heroImageFocus ?? "center" }}
          />
        </div>
      )}
      <div className="chub-archive-info">
        <span className="chub-archive-row-title">{campaign.title}</span>
        {campaign.archiveHeadline ? (
          <span className="chub-archive-sub">{campaign.archiveHeadline}</span>
        ) : (
          <span className="chub-archive-sub">Campaign complete · Thank you to every donor.</span>
        )}
      </div>
      <span className="chub-archive-badge">Complete</span>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Hub page                                                            */
/* ------------------------------------------------------------------ */

export default function CampaignHubPage() {
  const all = getAllCampaigns();
  const active = all.filter((c) => c.status === "active" && !c.evergreen);
  const evergreen = all.filter((c) => c.evergreen);
  const ended = all.filter((c) => c.status === "ended" || c.status === "archived");

  return (
    <main className="chub-main">

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="chub-hero">
        <div className="chub-hero-img-wrap">
          <Image
            src="/images/rehearsing-nitra.jpg"
            alt="DAT artists at work"
            fill
            priority
            sizes="100vw"
            style={{ objectFit: "cover", objectPosition: "center 30%" }}
          />
        </div>
        <div className="chub-hero-gradient" />
        <div className="chub-hero-body">
          <div className="chub-hero-panel">
            <span className="chub-hero-eyebrow">Dramatic Adventure Theatre</span>
            <h1 className="chub-hero-h1">Campaigns</h1>
            <p className="chub-hero-tagline">
              Support specific, purposeful work — and know exactly where your gift goes.
            </p>
          </div>
        </div>
      </section>

      {/* ── Combined live + evergreen layout ────────────────────── */}
      {active.length > 0 && evergreen.length > 0 && (
        <section className="chub-combined-section">
          <div className="chub-combined-inner">
            {/* Left: live campaign(s) */}
            <div className="chub-combined-primary">
              <div className="chub-section-head">
                <span className="chub-section-eyebrow">Active Now</span>
                <p className="chub-section-note">
                  {active.length === 1
                    ? "One campaign is currently accepting gifts."
                    : `${active.length} campaigns are currently accepting gifts.`}
                </p>
              </div>
              <div className="chub-active-grid">
                {active.map((c) => (
                  <ActiveCampaignCard key={c.id} campaign={c} />
                ))}
              </div>
            </div>

            {/* Right: evergreen / annual fund */}
            <div className="chub-combined-evergreen">
              <div className="chub-section-head">
                <span className="chub-section-eyebrow">Annual Support</span>
                <p className="chub-section-note">Always open — sustain the work year-round.</p>
              </div>
              <div className="chub-evergreen-stack">
                {evergreen.map((c) => (
                  <EvergreenCampaignCard key={c.id} campaign={c} />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Active only (no evergreen) ────────────────────────────── */}
      {active.length > 0 && evergreen.length === 0 && (
        <section className="chub-active-section">
          <div className="chub-inner">
            <div className="chub-section-head">
              <span className="chub-section-eyebrow">Active Now</span>
              <p className="chub-section-note">
                {active.length === 1
                  ? "One campaign is currently accepting gifts."
                  : `${active.length} campaigns are currently accepting gifts.`}
              </p>
            </div>
            <div className="chub-active-grid">
              {active.map((c) => (
                <ActiveCampaignCard key={c.id} campaign={c} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Evergreen only (no active) ────────────────────────────── */}
      {active.length === 0 && evergreen.length > 0 && (
        <section className="chub-evergreen-section">
          <div className="chub-inner">
            <div className="chub-section-head">
              <span className="chub-section-eyebrow">Annual Support</span>
              <p className="chub-section-note">Always open — give monthly or once, any time of year.</p>
            </div>
            <div className="chub-evergreen-grid">
              {evergreen.map((c) => (
                <EvergreenCampaignCard key={c.id} campaign={c} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── No active campaigns, no evergreen ─────────────────────── */}
      {active.length === 0 && evergreen.length === 0 && (
        <section className="chub-empty-section">
          <div className="chub-inner">
            <div className="chub-empty">
              <h2 className="chub-empty-title">No active campaigns right now.</h2>
              <p className="chub-empty-body">
                Check back soon — or support DAT&apos;s ongoing work through our general fund.
              </p>
              <Link href="/donate" className="chub-btn-primary">
                Donate to DAT
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Trust layer / general giving ─────────────────────────── */}
      <section className="chub-trust-section">
        <div className="chub-inner">
          <div className="chub-trust-row">
            <div className="chub-trust-item">
              <span className="chub-trust-icon">🎭</span>
              <span className="chub-trust-label">Direct impact</span>
              <span className="chub-trust-desc">Gifts go to specific programs, not general overhead.</span>
            </div>
            <div className="chub-trust-item">
              <span className="chub-trust-icon">🌍</span>
              <span className="chub-trust-label">Global reach</span>
              <span className="chub-trust-desc">30+ countries of work over more than two decades.</span>
            </div>
            <div className="chub-trust-item">
              <span className="chub-trust-icon">🤝</span>
              <span className="chub-trust-label">Community-led</span>
              <span className="chub-trust-desc">Every program is built with the community it serves.</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Ended / archived campaigns ───────────────────────────── */}
      {ended.length > 0 && (
        <section className="chub-archive-section">
          <div className="chub-inner">
            <span className="chub-section-eyebrow">Past Campaigns</span>
            <h2 className="chub-archive-title">
              Campaigns that made it happen.
            </h2>
            <div className="chub-archive-list">
              {ended.map((c) => (
                <ArchivedCampaignRow key={c.id} campaign={c} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── General giving CTA ───────────────────────────────────── */}
      <section className="chub-cta-section">
        <div className="chub-inner">
          <div className="chub-cta-inner">
            <span className="chub-cta-eyebrow">Always Open</span>
            <h2 className="chub-cta-title">Support DAT&apos;s ongoing work.</h2>
            <p className="chub-cta-body">
              Beyond campaigns, DAT accepts general gifts that support the full scope of the
              organization — residencies, touring, community programs, and artist development.
            </p>
            <Link href="/donate" className="chub-btn-primary">
              Donate to DAT
            </Link>
          </div>
        </div>
      </section>

      {/* ── Styles ───────────────────────────────────────────────── */}
      <style>{`
        .chub-main {
          background: #fff;
          overflow-x: hidden;
        }

        /* ─── Hero ─────────────────────────────────────────────────── */
        .chub-hero {
          position: relative;
          height: 65vh;
          min-height: 400px;
          max-height: 680px;
          overflow: hidden;
          display: flex;
          align-items: flex-end;
          background: #241123;
        }
        .chub-hero-img-wrap {
          position: absolute;
          inset: 0;
        }
        .chub-hero-gradient {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to top,
            rgba(36,17,35,0.96) 0%,
            rgba(36,17,35,0.72) 35%,
            rgba(36,17,35,0.28) 70%,
            rgba(36,17,35,0.08) 100%
          );
          z-index: 1;
        }
        .chub-hero-body {
          position: relative;
          z-index: 2;
          width: 100%;
          padding: 0 clamp(1rem, 4vw, 3.5rem) clamp(2rem, 4vw, 3.5rem);
        }
        .chub-hero-panel {
          max-width: 600px;
        }
        .chub-hero-eyebrow {
          display: block;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(255,204,0,0.75);
          margin-bottom: 0.85rem;
        }
        .chub-hero-h1 {
          margin: 0;
          font-family: var(--font-anton), sans-serif;
          font-size: clamp(3.5rem, 9vw, 6.5rem);
          text-transform: uppercase;
          line-height: 0.93;
          color: #f2f2f2;
          letter-spacing: -0.01em;
          text-shadow: 0 3px 24px rgba(0,0,0,0.5);
        }
        .chub-hero-tagline {
          margin: 1.1rem 0 0;
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: clamp(0.95rem, 1.7vw, 1.1rem);
          font-weight: 400;
          color: rgba(242,242,242,0.72);
          max-width: 480px;
          line-height: 1.6;
        }

        /* ─── Shared inner ──────────────────────────────────────────── */
        .chub-inner {
          max-width: 1140px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        /* ─── Section heads ────────────────────────────────────────── */
        .chub-section-eyebrow {
          display: block;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #0BC5E0;
          margin-bottom: 0.4rem;
        }
        .chub-section-head {
          margin-bottom: 2rem;
        }
        .chub-section-note {
          margin: 0.3rem 0 0;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.85rem;
          color: rgba(8,28,58,0.52);
        }

        /* ─── Combined live + evergreen layout ────────────────────── */
        .chub-combined-section {
          padding: 4rem 0;
          background: #f5f0f8;
        }
        .chub-combined-inner {
          max-width: 1140px;
          margin: 0 auto;
          padding: 0 2rem;
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 2.5rem;
          align-items: start;
        }
        .chub-combined-primary { min-width: 0; }
        .chub-combined-evergreen { min-width: 0; }
        .chub-evergreen-stack {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        @media (max-width: 900px) {
          .chub-combined-inner {
            grid-template-columns: 1fr;
          }
          .chub-combined-evergreen {
            border-top: 1px solid rgba(108,0,175,0.1);
            padding-top: 2rem;
          }
        }

        /* ─── Active campaigns (standalone section, no evergreen) ─── */
        .chub-active-section {
          padding: 4rem 0;
          background: #f5f0f8;
        }
        .chub-active-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(440px, 1fr));
          gap: 2rem;
        }
        @media (max-width: 560px) {
          .chub-active-grid {
            grid-template-columns: 1fr;
          }
        }
        .chub-active-card {
          border-radius: 20px;
          overflow: hidden;
          border: 1.5px solid rgba(8,28,58,0.08);
          background: #fff;
          box-shadow: 0 4px 24px rgba(0,0,0,0.05);
          display: flex;
          flex-direction: column;
        }

        /* Card image */
        .chub-card-img-wrap {
          position: relative;
          height: 240px;
        }
        .chub-card-img-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, rgba(8,28,58,0.1) 0%, rgba(8,28,58,0.5) 100%);
        }
        .chub-card-badges {
          position: absolute;
          top: 1rem;
          left: 1rem;
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .chub-badge {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 0.22rem 0.6rem;
          border-radius: 6px;
        }
        .chub-badge--active {
          background: rgba(255,204,0,0.95);
          color: #081C3A;
        }
        .chub-badge--match {
          background: rgba(255,255,255,0.92);
          color: #6C00AF;
        }

        /* Card body */
        .chub-card-body {
          padding: 1.75rem 1.75rem 2rem;
          display: flex;
          flex-direction: column;
          gap: 0;
          flex: 1;
        }
        .chub-card-eyebrow {
          display: block;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #0BC5E0;
          margin-bottom: 0.4rem;
        }
        .chub-card-title {
          margin: 0 0 0.5rem;
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: clamp(1.3rem, 2.5vw, 1.65rem);
          font-weight: 800;
          color: #0f1f38;
          line-height: 1.15;
        }
        .chub-card-tagline {
          margin: 0 0 1.25rem;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.9rem;
          line-height: 1.62;
          color: rgba(8,28,58,0.68);
        }
        .chub-card-meta {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }
        .chub-card-goal {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.78rem;
          font-weight: 700;
          color: rgba(8,28,58,0.55);
        }
        .chub-card-deadline {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.75rem;
          font-weight: 600;
          color: #6C00AF;
          background: rgba(108,0,175,0.1);
          padding: 0.18rem 0.55rem;
          border-radius: 6px;
        }
        .chub-card-deadline--ended {
          color: #C44B2B;
          background: rgba(196,75,43,0.08);
        }
        .chub-card-actions {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          margin-top: auto;
        }

        /* ─── Evergreen campaigns (standalone section) ────────────── */
        .chub-evergreen-section {
          padding: 3.5rem 0 4rem;
          background: #f5f0f8;
          border-top: 1px solid rgba(108,0,175,0.1);
        }
        .chub-evergreen-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 1.25rem;
          margin-top: 1.25rem;
        }
        @media (max-width: 440px) {
          .chub-evergreen-grid { grid-template-columns: 1fr; }
        }

        /* Evergreen card — vertical, sidebar-friendly */
        .chub-evergreen-card {
          display: flex;
          flex-direction: column;
          border-radius: 18px;
          overflow: hidden;
          border: 1.5px solid rgba(108,0,175,0.18);
          background: #241123;
          box-shadow: 0 4px 20px rgba(36,17,35,0.18);
          transition: box-shadow 180ms, transform 180ms;
        }
        .chub-evergreen-card:hover {
          box-shadow: 0 8px 32px rgba(108,0,175,0.22);
          transform: translateY(-2px);
        }
        .chub-evergreen-img-wrap {
          position: relative;
          width: 100%;
          height: 160px;
          flex-shrink: 0;
          background: rgba(108,0,175,0.15);
        }
        .chub-evergreen-img-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, rgba(36,17,35,0.1) 0%, rgba(36,17,35,0.55) 100%);
        }
        .chub-evergreen-body {
          padding: 1.25rem 1.4rem 1.6rem;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          flex: 1;
        }
        .chub-evergreen-top {
          display: flex;
          gap: 0.4rem;
          flex-wrap: wrap;
          margin-bottom: 0.25rem;
        }
        .chub-badge--evergreen {
          background: rgba(108,0,175,0.35);
          color: rgba(242,242,242,0.85);
        }
        .chub-badge--monthly {
          background: rgba(36,147,169,0.25);
          color: rgba(242,242,242,0.75);
        }
        .chub-evergreen-eyebrow {
          display: block;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.62rem;
          font-weight: 800;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #0BC5E0;
        }
        .chub-evergreen-title {
          margin: 0;
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 1.15rem;
          font-weight: 800;
          color: #f2f2f2;
          line-height: 1.2;
        }
        .chub-evergreen-tagline {
          margin: 0 0 0.75rem;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.83rem;
          line-height: 1.6;
          color: rgba(242,242,242,0.58);
          flex: 1;
        }
        /* Evergreen-specific buttons */
        .chub-btn-evergreen {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.75rem 1.4rem;
          border-radius: 12px;
          background: #2493A9;
          color: #fff;
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.77rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          text-decoration: none;
          margin-bottom: 0.4rem;
          transition: transform 150ms, background 150ms;
        }
        .chub-btn-evergreen:hover { transform: translateY(-2px); background: #1e7d90; }
        .chub-btn-evergreen-ghost {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.65rem 1.4rem;
          border-radius: 12px;
          background: transparent;
          color: rgba(242,242,242,0.6);
          border: 1px solid rgba(242,242,242,0.2);
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          text-decoration: none;
          transition: border-color 150ms, color 150ms;
        }
        .chub-btn-evergreen-ghost:hover { border-color: rgba(242,242,242,0.45); color: rgba(242,242,242,0.9); }

        /* ─── No active campaigns ──────────────────────────────────── */
        .chub-empty-section { padding: 4rem 0 2rem; }
        .chub-empty {
          padding: 3rem 2rem;
          background: rgba(8,28,58,0.03);
          border-radius: 18px;
          border: 1.5px solid rgba(8,28,58,0.08);
          text-align: center;
          max-width: 500px;
          margin: 0 auto;
        }
        .chub-empty-title {
          margin: 0 0 0.75rem;
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 1.3rem;
          font-weight: 800;
          color: #0f1f38;
        }
        .chub-empty-body {
          margin: 0 0 1.5rem;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.9rem;
          line-height: 1.65;
          color: rgba(8,28,58,0.62);
        }

        /* ─── Trust layer ──────────────────────────────────────────── */
        .chub-trust-section {
          padding: 3.5rem 0;
          border-top: 1px solid rgba(8,28,58,0.06);
        }
        .chub-trust-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 2rem;
        }
        .chub-trust-item {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }
        .chub-trust-icon {
          font-size: 1.4rem;
          line-height: 1;
          margin-bottom: 0.1rem;
        }
        .chub-trust-label {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.82rem;
          font-weight: 700;
          color: #0f1f38;
        }
        .chub-trust-desc {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.8rem;
          line-height: 1.6;
          color: rgba(8,28,58,0.58);
        }

        /* ─── Archive ──────────────────────────────────────────────── */
        .chub-archive-section {
          padding: 4rem 0;
          border-top: 1px solid rgba(8,28,58,0.07);
        }
        .chub-archive-title {
          margin: 0.3rem 0 1.75rem;
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: clamp(1.4rem, 2.5vw, 2rem);
          font-weight: 800;
          color: #0f1f38;
        }
        .chub-archive-list {
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .chub-archive-row {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          padding: 1.1rem 0;
          border-top: 1px solid rgba(8,28,58,0.07);
          text-decoration: none;
          transition: background 140ms;
          border-radius: 8px;
        }
        .chub-archive-row:last-child {
          border-bottom: 1px solid rgba(8,28,58,0.07);
        }
        .chub-archive-row:hover { background: rgba(108,0,175,0.05); }
        .chub-archive-thumb {
          position: relative;
          width: 64px;
          height: 48px;
          border-radius: 8px;
          overflow: hidden;
          flex-shrink: 0;
          background: rgba(8,28,58,0.06);
        }
        .chub-archive-info {
          flex: 1;
          min-width: 0;
        }
        .chub-archive-row-title {
          display: block;
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.92rem;
          font-weight: 700;
          color: #0f1f38;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .chub-archive-sub {
          display: block;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.75rem;
          color: rgba(8,28,58,0.5);
          margin-top: 0.15rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .chub-archive-badge {
          flex-shrink: 0;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #2FA873;
          background: rgba(47,168,115,0.1);
          padding: 0.2rem 0.55rem;
          border-radius: 6px;
        }

        /* ─── General giving CTA ───────────────────────────────────── */
        .chub-cta-section {
          background: #6C00AF;
          padding: 5rem 2rem;
        }
        .chub-cta-inner {
          max-width: 600px;
          margin: 0 auto;
          text-align: center;
        }
        .chub-cta-eyebrow {
          display: block;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(255,204,0,0.75);
          margin-bottom: 0.75rem;
        }
        .chub-cta-title {
          margin: 0 0 0.85rem;
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: clamp(1.6rem, 3vw, 2.4rem);
          font-weight: 800;
          color: #f2f2f2;
          line-height: 1.2;
        }
        .chub-cta-body {
          margin: 0 0 2rem;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.95rem;
          line-height: 1.72;
          color: rgba(242,242,242,0.7);
        }

        /* ─── Buttons ──────────────────────────────────────────────── */
        .chub-btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.85rem 1.75rem;
          border-radius: 13px;
          background: #FFCC00;
          color: #0f1f38;
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          text-decoration: none;
          transition: transform 150ms, background 150ms;
        }
        .chub-btn-primary:hover { transform: translateY(-2px); background: #e6b800; }

        .chub-btn-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.85rem 1.4rem;
          border-radius: 13px;
          background: transparent;
          color: #6C00AF;
          border: 1.5px solid rgba(108,0,175,0.3);
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          text-decoration: none;
          transition: transform 150ms, border-color 150ms;
        }
        .chub-btn-secondary:hover { transform: translateY(-2px); border-color: #6C00AF; }
      `}</style>
    </main>
  );
}
