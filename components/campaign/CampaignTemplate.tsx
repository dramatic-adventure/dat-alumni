// components/campaign/CampaignTemplate.tsx
"use client";

/**
 * Reusable DAT fundraising campaign template.
 *
 * Aesthetic direction: partners page + events page — cinematic, editorial,
 * minimal in the right ways, premium and DAT-native.
 *
 * Sections (all config-driven; linked-content blocks hide when empty):
 *   1. Hero — full-bleed parallax, title, CTAs, match banner
 *   2. Progress band — thermometer stats
 *   3. Story + Give — editorial copy + sticky give panel
 *   4. Stretch Goals — locked / unlocked states
 *   5. Testimonials — dark editorial quote block
 *   6. Gallery — photo strip
 *   7. Campaign Updates — chronological feed
 *   8. Recent Supporters — supporter wall
 *   9. Linked content — drama clubs, alumni, productions, events, stories
 *  10. CTA footer — dark purple action strip
 *  11. Ended state — replaces give panel when campaign.status = "ended"
 */

import Image from "next/image";
import Link from "next/link";
import { useRef, useEffect } from "react";
import type { FundraisingCampaign } from "@/lib/fundraisingCampaigns";
import {
  formatCurrencyMinor,
  formatCurrency,
  campaignProgress,
  daysUntilDeadline,
} from "@/lib/fundraisingCampaigns";
import type { CampaignTotals } from "@/lib/getCampaignTotals";
import CampaignGiveWidget from "@/components/campaign/CampaignGiveWidget";

/* ------------------------------------------------------------------ */
/* Props                                                               */
/* ------------------------------------------------------------------ */

type Props = {
  campaign: FundraisingCampaign;
  totals: CampaignTotals;
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function formatDate(iso: string) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function formatShortDate(iso: string) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* ------------------------------------------------------------------ */
/* Template                                                            */
/* ------------------------------------------------------------------ */

export default function CampaignTemplate({ campaign, totals }: Props) {
  const heroRef = useRef<HTMLDivElement>(null);
  const isActive = campaign.status === "active";
  const isEnded = campaign.status === "ended" || campaign.status === "archived";

  const currency = campaign.currency ?? "usd";
  const pct = campaignProgress(totals.raisedMinor, campaign.goalAmount);
  const daysLeft = daysUntilDeadline(campaign.deadline);

  // Parallax hero scroll
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const handle = () => {
      el.style.transform = `translateY(${window.scrollY * 0.28}px)`;
    };
    window.addEventListener("scroll", handle, { passive: true });
    return () => window.removeEventListener("scroll", handle);
  }, []);

  const hasTestimonials = (campaign.testimonials?.length ?? 0) > 0;
  const hasGallery = (campaign.gallery?.length ?? 0) > 0;
  const hasUpdates = (campaign.updates?.length ?? 0) > 0;
  const hasSupporters = totals.recentSupporters.length > 0;
  const hasStretchGoals = (campaign.stretchGoals?.length ?? 0) > 0;
  const hasAlumni = (campaign.alumni?.length ?? 0) > 0;
  const hasDramaClubs = (campaign.dramaClubs?.length ?? 0) > 0;
  const hasEvents = (campaign.events?.length ?? 0) > 0;
  const hasStories = (campaign.stories?.length ?? 0) > 0;
  const hasLinkedContent = hasAlumni || hasDramaClubs || hasEvents || hasStories;

  return (
    <main style={{ background: "transparent", overflowX: "hidden" }}>

      {/* ── 1. MATCH BANNER (above hero if active) ──────────────── */}
      {campaign.matchActive && campaign.matchDescription && (
        <div className="cmp-match-banner">
          <span className="cmp-match-flash">⚡</span>
          <span className="cmp-match-text">{campaign.matchDescription}</span>
        </div>
      )}

      {/* ── 2. HERO ─────────────────────────────────────────────── */}
      <section style={{ position: "relative", height: "90vh", minHeight: 580, overflow: "hidden", display: "flex", alignItems: "flex-end" }}>
        <div
          ref={heroRef}
          style={{ position: "absolute", inset: "-15% 0", willChange: "transform" }}
        >
          <Image
            src={campaign.heroImage}
            alt={campaign.title}
            fill
            priority
            sizes="100vw"
            style={{ objectFit: "cover", objectPosition: campaign.heroImageFocus ?? "center" }}
          />
        </div>

        {/* Gradient overlay */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(36,17,35,0.15) 0%, rgba(36,17,35,0.55) 45%, rgba(36,17,35,0.95) 100%)" }} />

        {/* Hero content */}
        <div className="cmp-hero-body">
          {campaign.eyebrow && (
            <span className="cmp-hero-eyebrow">{campaign.eyebrow}</span>
          )}
          <h1 className="cmp-hero-title">{campaign.title}</h1>
          <p className="cmp-hero-tagline">{campaign.tagline}</p>

          <div className="cmp-hero-actions">
            {isActive && (
              <a href="#give" className="cmp-btn-yellow">Give Now</a>
            )}
            {campaign.learnMoreUrl && (
              <a
                href={campaign.learnMoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="cmp-btn-ghost"
              >
                Learn More →
              </a>
            )}
            {campaign.secondaryUrl && !campaign.learnMoreUrl && (
              <a
                href={campaign.secondaryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="cmp-btn-ghost"
              >
                About PASSAGE →
              </a>
            )}
          </div>

          {campaign.heroImageCredit && (
            <p className="cmp-hero-credit">{campaign.heroImageCredit}</p>
          )}
        </div>
      </section>

      {/* ── 3. PROGRESS BAND ────────────────────────────────────── */}
      <section className="cmp-band">
        <div className="cmp-band-inner">
          {/* Thermometer */}
          <div className="cmp-band-thermo">
            <div className="cmp-band-track">
              <div className="cmp-band-fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="cmp-band-thermo-labels">
              <span className="cmp-band-raised">
                {formatCurrencyMinor(totals.raisedMinor, currency)} raised
              </span>
              <span className="cmp-band-goal">
                Goal: {formatCurrency(campaign.goalAmount, currency)}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="cmp-band-stats">
            {totals.donorCount > 0 && (
              <div className="cmp-band-stat">
                <span className="cmp-band-stat-val">{totals.donorCount}</span>
                <span className="cmp-band-stat-lbl">{totals.donorCount === 1 ? "Donor" : "Donors"}</span>
              </div>
            )}
            {typeof daysLeft === "number" && daysLeft > 0 && (
              <div className="cmp-band-stat">
                <span className="cmp-band-stat-val">{daysLeft}</span>
                <span className="cmp-band-stat-lbl">{daysLeft === 1 ? "Day Left" : "Days Left"}</span>
              </div>
            )}
            {typeof daysLeft === "number" && daysLeft === 0 && (
              <div className="cmp-band-stat">
                <span className="cmp-band-stat-val">Ended</span>
                <span className="cmp-band-stat-lbl">Thank You</span>
              </div>
            )}
            <div className="cmp-band-stat">
              <span className="cmp-band-stat-val">
                {Math.round(pct)}%
              </span>
              <span className="cmp-band-stat-lbl">Funded</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. STORY + GIVE ─────────────────────────────────────── */}
      <section id="give" className="cmp-story-section">
        <div className="cmp-story-inner">

          {/* Left: Editorial copy */}
          <div className="cmp-story-copy">
            <span className="cmp-eyebrow">The Campaign</span>
            <h2 className="cmp-section-title">{campaign.tagline}</h2>
            {campaign.heroCopy.split("\n\n").map((para, i) => (
              <p key={i} className="cmp-story-para">{para}</p>
            ))}

            {/* Learn more links */}
            {(campaign.learnMoreUrl || campaign.secondaryUrl) && (
              <div className="cmp-story-links">
                {campaign.learnMoreUrl && (
                  <a
                    href={campaign.learnMoreUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cmp-text-link"
                  >
                    Learn more about PASSAGE: Slovakia →
                  </a>
                )}
                {campaign.secondaryUrl && campaign.learnMoreUrl && (
                  <a
                    href={campaign.secondaryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cmp-text-link cmp-text-link--secondary"
                  >
                    About the PASSAGE Program →
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Right: Give panel (sticky) */}
          <div className="cmp-give-sticky">
            {isActive ? (
              <CampaignGiveWidget
                campaign={campaign}
                initialTotals={totals}
                variant="panel"
              />
            ) : (
              /* Ended state */
              <div className="cmp-ended-panel">
                <div className="cmp-ended-icon">✓</div>
                <h3 className="cmp-ended-title">
                  {campaign.archiveHeadline ?? "Campaign Complete"}
                </h3>
                <p className="cmp-ended-body">
                  {campaign.archiveSummary ??
                    `This campaign has ended. We raised ${formatCurrencyMinor(totals.raisedMinor, currency)} — thank you to every donor who made it possible.`}
                </p>
                <Link href="/donate" className="cmp-btn-yellow-sm">
                  Support DAT →
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── 5. STRETCH GOALS ────────────────────────────────────── */}
      {hasStretchGoals && (
        <section className="cmp-stretch-section">
          <div className="cmp-stretch-inner">
            <span className="cmp-eyebrow" style={{ color: "#6C00AF" }}>Stretch Goals</span>
            <h2 className="cmp-section-title" style={{ color: "#241123" }}>
              The further we go, the more we can do.
            </h2>
            <div className="cmp-stretch-grid">
              {campaign.stretchGoals!.map((goal, i) => {
                const raised = totals.raisedMinor / 100;
                const unlocked = raised >= goal.amount;
                return (
                  <div
                    key={i}
                    className={`cmp-stretch-card${unlocked ? " cmp-stretch-card--unlocked" : ""}`}
                  >
                    <div className="cmp-stretch-card-top">
                      <span className="cmp-stretch-status">
                        {unlocked ? "✓ Unlocked" : "Locked"}
                      </span>
                      <span className="cmp-stretch-amount">
                        {formatCurrency(goal.amount, currency)}
                      </span>
                    </div>
                    <h3 className="cmp-stretch-card-title">{goal.title}</h3>
                    <p className="cmp-stretch-card-desc">{goal.description}</p>
                    {!unlocked && (
                      <div className="cmp-stretch-mini-bar">
                        <div
                          className="cmp-stretch-mini-fill"
                          style={{
                            width: `${Math.min(100, (raised / goal.amount) * 100)}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── 6. TESTIMONIALS ─────────────────────────────────────── */}
      {hasTestimonials && (
        <section className="cmp-quotes-section">
          <div className="cmp-quotes-inner">
            <span className="cmp-eyebrow" style={{ color: "#FFCC00", opacity: 0.8 }}>
              Voices from the Work
            </span>
            <div className="cmp-quotes-grid">
              {campaign.testimonials!.map((t) => (
                <div key={t.id} className="cmp-quote-card">
                  <div className="cmp-quote-mark">"</div>
                  <blockquote className="cmp-quote-text">{t.quote}</blockquote>
                  <div className="cmp-quote-attr">
                    {t.imageUrl && (
                      <div className="cmp-quote-avatar">
                        <Image
                          src={t.imageUrl}
                          alt={t.name}
                          fill
                          sizes="48px"
                          style={{ objectFit: "cover" }}
                        />
                      </div>
                    )}
                    <div>
                      <span className="cmp-quote-name">{t.name}</span>
                      {t.role && <span className="cmp-quote-role">{t.role}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 7. GALLERY ──────────────────────────────────────────── */}
      {hasGallery && (
        <section className="cmp-gallery-section">
          <div className="cmp-gallery-strip">
            {campaign.gallery!.map((item, i) => (
              <div key={i} className="cmp-gallery-item">
                <div className="cmp-gallery-img-wrap">
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    sizes="(min-width:1024px) 33vw, 90vw"
                    style={{ objectFit: "cover" }}
                  />
                </div>
                {item.caption && (
                  <p className="cmp-gallery-caption">{item.caption}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 8. CAMPAIGN UPDATES ─────────────────────────────────── */}
      {hasUpdates && (
        <section className="cmp-updates-section">
          <div className="cmp-updates-inner">
            <span className="cmp-eyebrow" style={{ color: "#6C00AF" }}>Campaign Updates</span>
            <h2 className="cmp-section-title" style={{ color: "#241123" }}>
              What&apos;s happening.
            </h2>
            <div className="cmp-updates-feed">
              {campaign.updates!.map((u) => (
                <article key={u.id} className="cmp-update-card">
                  <div className="cmp-update-meta">
                    <time className="cmp-update-date">{formatDate(u.date)}</time>
                    {u.authorName && (
                      <span className="cmp-update-author">
                        {u.authorName}
                        {u.authorRole && ` · ${u.authorRole}`}
                      </span>
                    )}
                  </div>
                  <h3 className="cmp-update-title">{u.title}</h3>
                  <p className="cmp-update-body">{u.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 9. RECENT SUPPORTERS WALL ───────────────────────────── */}
      {hasSupporters && (
        <section className="cmp-supporters-section">
          <div className="cmp-supporters-inner">
            <span className="cmp-eyebrow" style={{ color: "#6C00AF" }}>Recent Supporters</span>
            <h2 className="cmp-section-title" style={{ color: "#241123" }}>
              In good company.
            </h2>
            <div className="cmp-supporters-wall">
              {totals.recentSupporters.map((s, i) => (
                <div key={i} className="cmp-supporter-chip">
                  <span className="cmp-supporter-name">
                    {s.name ?? "Anonymous"}
                  </span>
                  <span className="cmp-supporter-amt">
                    {formatCurrencyMinor(s.amountMinor, s.currency)}
                  </span>
                  <span className="cmp-supporter-date">
                    {formatShortDate(s.createdAt.toString())}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 10. LINKED CONTENT ──────────────────────────────────── */}
      {hasLinkedContent && (
        <section className="cmp-linked-section">
          <div className="cmp-linked-inner">

            {/* Alumni */}
            {hasAlumni && (
              <div className="cmp-linked-block">
                <span className="cmp-eyebrow" style={{ color: "#6C00AF" }}>Artists Involved</span>
                <div className="cmp-alumni-grid">
                  {campaign.alumni!.map((a) => (
                    <Link key={a.slug} href={`/alumni/${a.slug}`} className="cmp-alumni-card">
                      {a.imageUrl ? (
                        <div className="cmp-alumni-avatar">
                          <Image
                            src={a.imageUrl}
                            alt={a.name}
                            fill
                            sizes="80px"
                            style={{ objectFit: "cover" }}
                          />
                        </div>
                      ) : (
                        <div className="cmp-alumni-avatar cmp-alumni-avatar--placeholder">
                          <span>{a.name[0]}</span>
                        </div>
                      )}
                      <span className="cmp-alumni-name">{a.name}</span>
                      {a.role && <span className="cmp-alumni-role">{a.role}</span>}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Drama clubs */}
            {hasDramaClubs && (
              <div className="cmp-linked-block">
                <span className="cmp-eyebrow" style={{ color: "#6C00AF" }}>Partner Drama Clubs</span>
                <div className="cmp-clubs-list">
                  {campaign.dramaClubs!.map((c) => (
                    <Link key={c.slug} href={`/drama-club/${c.slug}`} className="cmp-club-pill">
                      <span className="cmp-club-name">{c.name}</span>
                      <span className="cmp-club-loc">
                        {c.city ? `${c.city}, ` : ""}{c.country}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Events */}
            {hasEvents && (
              <div className="cmp-linked-block">
                <span className="cmp-eyebrow" style={{ color: "#6C00AF" }}>Related Events</span>
                <div className="cmp-events-list">
                  {campaign.events!.map((e) => (
                    <div key={e.id} className="cmp-event-row">
                      <div>
                        <span className="cmp-event-date">{formatDate(e.date)}</span>
                        <span className="cmp-event-title">{e.title}</span>
                        <span className="cmp-event-loc">{e.venue} · {e.city}, {e.country}</span>
                      </div>
                      {e.ticketUrl && (
                        <a
                          href={e.ticketUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="cmp-btn-yellow-sm"
                        >
                          Tickets →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stories */}
            {hasStories && (
              <div className="cmp-linked-block">
                <span className="cmp-eyebrow" style={{ color: "#6C00AF" }}>Related Stories</span>
                <div className="cmp-stories-list">
                  {campaign.stories!.map((s) => (
                    <Link key={s.slug} href={`/story/${s.slug}`} className="cmp-story-pill">
                      <span className="cmp-story-title">{s.title}</span>
                      {s.teaser && <span className="cmp-story-teaser">{s.teaser}</span>}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── 11. CTA FOOTER ──────────────────────────────────────── */}
      <section className="cmp-cta-section">
        <div className="cmp-cta-inner">
          {isActive ? (
            <>
              <span className="cmp-eyebrow" style={{ color: "#FFCC00", opacity: 0.85 }}>
                {campaign.eyebrow ?? "Fundraising Campaign"}
              </span>
              <h2 className="cmp-cta-title">
                Ready to make it happen?
              </h2>
              <p className="cmp-cta-body">
                Every gift — at any level — sends an artist to Slovakia and keeps this work honest and open.
              </p>
              <div className="cmp-cta-actions">
                <a href="#give" className="cmp-btn-yellow">Give Now</a>
                {campaign.learnMoreUrl && (
                  <a
                    href={campaign.learnMoreUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cmp-btn-ghost"
                  >
                    Learn About PASSAGE →
                  </a>
                )}
                {campaign.secondaryUrl && (
                  <a
                    href={campaign.secondaryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cmp-btn-outline-light"
                  >
                    About the Program →
                  </a>
                )}
              </div>
            </>
          ) : (
            <>
              <span className="cmp-eyebrow" style={{ color: "#FFCC00", opacity: 0.85 }}>Thank You</span>
              <h2 className="cmp-cta-title">
                {campaign.archiveHeadline ?? "This campaign is complete."}
              </h2>
              <p className="cmp-cta-body">
                {campaign.archiveSummary ??
                  "Thank you to every donor who made this possible. The work continues — and so can your support."}
              </p>
              <div className="cmp-cta-actions">
                <Link href="/donate" className="cmp-btn-yellow">
                  Support DAT →
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── STYLES ──────────────────────────────────────────────── */}
      <style>{`
        /* ─── Match banner ─────────────────────────────────────────── */
        .cmp-match-banner {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          background: #FFCC00;
          padding: 0.6rem 1.5rem;
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: #241123;
          text-align: center;
        }
        .cmp-match-flash { font-size: 1rem; }

        /* ─── Hero ─────────────────────────────────────────────────── */
        .cmp-hero-body {
          position: relative;
          z-index: 2;
          width: 90vw;
          max-width: 1100px;
          margin: 0 auto 6vh;
          padding: 0 1rem;
        }
        .cmp-hero-eyebrow {
          display: block;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #FFCC00;
          margin-bottom: 0.75rem;
        }
        .cmp-hero-title {
          margin: 0;
          font-family: var(--font-anton), sans-serif;
          font-size: clamp(3rem, 9vw, 7rem);
          line-height: 0.96;
          text-transform: uppercase;
          color: #f2f2f2;
          text-shadow: 0 6px 32px rgba(0,0,0,0.55);
          max-width: 900px;
        }
        .cmp-hero-tagline {
          margin: 1.25rem 0 0;
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: clamp(1rem, 2vw, 1.35rem);
          font-weight: 500;
          color: rgba(242,242,242,0.88);
          max-width: 640px;
          line-height: 1.55;
        }
        .cmp-hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.85rem;
          margin-top: 2rem;
        }
        .cmp-hero-credit {
          margin: 1.5rem 0 0;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.65rem;
          color: rgba(242,242,242,0.4);
          font-style: italic;
        }

        /* ─── Progress band ────────────────────────────────────────── */
        .cmp-band { background: #241123; padding: 2.5rem 2rem; }
        .cmp-band-inner {
          max-width: 1100px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .cmp-band-thermo { display: flex; flex-direction: column; gap: 0.6rem; }
        .cmp-band-track {
          height: 12px;
          background: rgba(255,255,255,0.12);
          border-radius: 999px;
          overflow: hidden;
        }
        .cmp-band-fill {
          height: 100%;
          background: linear-gradient(90deg, #6C00AF, #FFCC00);
          border-radius: 999px;
          transition: width 1s cubic-bezier(0.25, 1, 0.5, 1);
          min-width: 4px;
        }
        .cmp-band-thermo-labels {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }
        .cmp-band-raised {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: clamp(1.2rem, 3vw, 1.8rem);
          font-weight: 800;
          color: #FFCC00;
        }
        .cmp-band-goal {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.85rem;
          color: rgba(242,242,242,0.55);
        }
        .cmp-band-stats {
          display: flex;
          gap: 2.5rem;
          flex-wrap: wrap;
        }
        .cmp-band-stat { display: flex; flex-direction: column; gap: 0.1rem; }
        .cmp-band-stat-val {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: clamp(1.5rem, 4vw, 2.5rem);
          font-weight: 800;
          color: #f2f2f2;
          line-height: 1;
        }
        .cmp-band-stat-lbl {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(242,242,242,0.5);
        }

        /* ─── Shared layout ────────────────────────────────────────── */
        .cmp-eyebrow {
          display: inline-block;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          margin-bottom: 0.6rem;
        }
        .cmp-section-title {
          margin: 0 0 1.25rem;
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 800;
          line-height: 1.15;
        }

        /* ─── Story + Give ─────────────────────────────────────────── */
        .cmp-story-section { padding: 5rem 2rem; }
        .cmp-story-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 4rem;
          align-items: start;
        }
        @media (max-width: 900px) {
          .cmp-story-inner {
            grid-template-columns: 1fr;
            gap: 2.5rem;
          }
        }
        .cmp-story-copy { color: #241123; }
        .cmp-story-para {
          margin: 0 0 1.25rem;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: clamp(1rem, 1.6vw, 1.1rem);
          line-height: 1.75;
          color: rgba(36,17,35,0.82);
        }
        .cmp-story-links { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 1rem; }
        .cmp-text-link {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.88rem;
          font-weight: 700;
          color: #6C00AF;
          text-decoration: none;
          border-bottom: 1.5px solid rgba(108,0,175,0.25);
          padding-bottom: 1px;
          transition: color 140ms, border-color 140ms;
          align-self: flex-start;
        }
        .cmp-text-link:hover { color: #5a0094; border-color: #5a0094; }
        .cmp-text-link--secondary { color: rgba(36,17,35,0.55); border-color: rgba(36,17,35,0.2); font-size: 0.8rem; }

        .cmp-give-sticky { position: sticky; top: 2rem; }

        /* Ended panel */
        .cmp-ended-panel {
          background: rgba(36,17,35,0.04);
          border: 1.5px solid rgba(108,0,175,0.15);
          border-radius: 20px;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 0.85rem;
        }
        .cmp-ended-icon {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: rgba(47,168,115,0.12);
          border: 2px solid rgba(47,168,115,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          color: #2FA873;
        }
        .cmp-ended-title {
          margin: 0;
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 1.3rem;
          font-weight: 800;
          color: #241123;
        }
        .cmp-ended-body {
          margin: 0;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.9rem;
          line-height: 1.65;
          color: rgba(36,17,35,0.7);
        }

        /* ─── Stretch goals ────────────────────────────────────────── */
        .cmp-stretch-section { background: rgba(36,17,35,0.03); padding: 5rem 2rem; border-top: 1px solid rgba(36,17,35,0.07); }
        .cmp-stretch-inner { max-width: 1100px; margin: 0 auto; }
        .cmp-stretch-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
          margin-top: 0.5rem;
        }
        .cmp-stretch-card {
          background: #fff;
          border: 1.5px solid rgba(36,17,35,0.12);
          border-radius: 18px;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          opacity: 0.72;
          transition: opacity 200ms, box-shadow 200ms;
        }
        .cmp-stretch-card--unlocked {
          border-color: rgba(47,168,115,0.4);
          background: rgba(47,168,115,0.04);
          opacity: 1;
          box-shadow: 0 4px 20px rgba(47,168,115,0.12);
        }
        .cmp-stretch-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .cmp-stretch-status {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(36,17,35,0.45);
          padding: 0.2rem 0.6rem;
          border-radius: 6px;
          background: rgba(36,17,35,0.06);
        }
        .cmp-stretch-card--unlocked .cmp-stretch-status {
          color: #2FA873;
          background: rgba(47,168,115,0.12);
        }
        .cmp-stretch-amount {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 1.05rem;
          font-weight: 800;
          color: #6C00AF;
        }
        .cmp-stretch-card-title {
          margin: 0;
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 1rem;
          font-weight: 800;
          color: #241123;
        }
        .cmp-stretch-card-desc {
          margin: 0;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.85rem;
          line-height: 1.65;
          color: rgba(36,17,35,0.7);
          flex: 1;
        }
        .cmp-stretch-mini-bar {
          height: 4px;
          background: rgba(36,17,35,0.08);
          border-radius: 999px;
          overflow: hidden;
          margin-top: 0.25rem;
        }
        .cmp-stretch-mini-fill {
          height: 100%;
          background: linear-gradient(90deg, #6C00AF, #FFCC00);
          border-radius: 999px;
          min-width: 3px;
          transition: width 1s cubic-bezier(0.25, 1, 0.5, 1);
        }

        /* ─── Testimonials ─────────────────────────────────────────── */
        .cmp-quotes-section { background: #241123; padding: 5rem 2rem; }
        .cmp-quotes-inner { max-width: 1100px; margin: 0 auto; }
        .cmp-quotes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-top: 1.5rem;
        }
        .cmp-quote-card {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 18px;
          padding: 2rem 1.5rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .cmp-quote-mark {
          font-family: var(--font-gloucester), serif;
          font-size: 5rem;
          line-height: 0.5;
          color: #FFCC00;
          opacity: 0.35;
          margin-bottom: -0.5rem;
        }
        .cmp-quote-text {
          margin: 0;
          font-family: var(--font-rock-salt), cursive;
          font-size: clamp(0.78rem, 1.4vw, 0.95rem);
          line-height: 1.75;
          color: rgba(242,242,242,0.9);
          font-style: normal;
          flex: 1;
        }
        .cmp-quote-attr {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .cmp-quote-avatar {
          position: relative;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;
          border: 2px solid rgba(255,204,0,0.4);
        }
        .cmp-quote-name {
          display: block;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.8rem;
          font-weight: 700;
          color: #FFCC00;
          opacity: 0.85;
        }
        .cmp-quote-role {
          display: block;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.7rem;
          color: rgba(242,242,242,0.45);
          margin-top: 0.15rem;
        }

        /* ─── Gallery ──────────────────────────────────────────────── */
        .cmp-gallery-section { padding: 0; overflow: hidden; }
        .cmp-gallery-strip {
          display: flex;
          gap: 0;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .cmp-gallery-strip::-webkit-scrollbar { display: none; }
        .cmp-gallery-item {
          flex-shrink: 0;
          width: clamp(260px, 35vw, 480px);
          display: flex;
          flex-direction: column;
        }
        .cmp-gallery-img-wrap {
          position: relative;
          height: 320px;
        }
        .cmp-gallery-caption {
          padding: 0.6rem 0.85rem;
          margin: 0;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.68rem;
          color: rgba(36,17,35,0.5);
          font-style: italic;
          background: rgba(36,17,35,0.03);
          border-bottom: 1px solid rgba(36,17,35,0.07);
        }

        /* ─── Campaign updates ─────────────────────────────────────── */
        .cmp-updates-section { padding: 5rem 2rem; }
        .cmp-updates-inner { max-width: 780px; margin: 0 auto; }
        .cmp-updates-feed { display: flex; flex-direction: column; gap: 0; margin-top: 0.5rem; }
        .cmp-update-card {
          padding: 2rem 0;
          border-top: 1px solid rgba(36,17,35,0.1);
        }
        .cmp-update-card:last-child { border-bottom: 1px solid rgba(36,17,35,0.1); }
        .cmp-update-meta {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
          flex-wrap: wrap;
        }
        .cmp-update-date {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #6C00AF;
        }
        .cmp-update-author {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.72rem;
          color: rgba(36,17,35,0.5);
        }
        .cmp-update-title {
          margin: 0 0 0.5rem;
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 1.15rem;
          font-weight: 800;
          color: #241123;
        }
        .cmp-update-body {
          margin: 0;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.92rem;
          line-height: 1.7;
          color: rgba(36,17,35,0.75);
        }

        /* ─── Recent supporters ─────────────────────────────────────── */
        .cmp-supporters-section { background: rgba(36,17,35,0.03); padding: 5rem 2rem; }
        .cmp-supporters-inner { max-width: 1100px; margin: 0 auto; }
        .cmp-supporters-wall {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          margin-top: 1.25rem;
        }
        .cmp-supporter-chip {
          display: flex;
          flex-direction: column;
          gap: 0.1rem;
          background: #fff;
          border: 1.5px solid rgba(108,0,175,0.14);
          border-radius: 14px;
          padding: 0.75rem 1rem;
          min-width: 160px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .cmp-supporter-name {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.88rem;
          font-weight: 700;
          color: #241123;
        }
        .cmp-supporter-amt {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.8rem;
          font-weight: 700;
          color: #6C00AF;
        }
        .cmp-supporter-date {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.65rem;
          color: rgba(36,17,35,0.4);
        }

        /* ─── Linked content ───────────────────────────────────────── */
        .cmp-linked-section { padding: 5rem 2rem; }
        .cmp-linked-inner { max-width: 1100px; margin: 0 auto; display: flex; flex-direction: column; gap: 3.5rem; }
        .cmp-linked-block { display: flex; flex-direction: column; gap: 1rem; }

        /* Alumni */
        .cmp-alumni-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 1.25rem;
        }
        .cmp-alumni-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          text-decoration: none;
          width: 80px;
          transition: transform 160ms;
        }
        .cmp-alumni-card:hover { transform: translateY(-3px); }
        .cmp-alumni-avatar {
          position: relative;
          width: 72px;
          height: 72px;
          border-radius: 50%;
          overflow: hidden;
          border: 2px solid rgba(108,0,175,0.2);
          background: rgba(108,0,175,0.08);
        }
        .cmp-alumni-avatar--placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 1.5rem;
          font-weight: 800;
          color: #6C00AF;
        }
        .cmp-alumni-name {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.7rem;
          font-weight: 700;
          color: #241123;
          text-align: center;
          line-height: 1.3;
        }
        .cmp-alumni-role {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.62rem;
          color: rgba(36,17,35,0.5);
          text-align: center;
        }

        /* Drama clubs */
        .cmp-clubs-list { display: flex; flex-wrap: wrap; gap: 0.65rem; }
        .cmp-club-pill {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          padding: 0.55rem 0.9rem;
          background: #fff;
          border: 1.5px solid rgba(108,0,175,0.18);
          border-radius: 12px;
          text-decoration: none;
          transition: border-color 140ms, transform 140ms;
        }
        .cmp-club-pill:hover { border-color: #6C00AF; transform: translateY(-2px); }
        .cmp-club-name {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.82rem;
          font-weight: 700;
          color: #6C00AF;
        }
        .cmp-club-loc {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.68rem;
          color: rgba(36,17,35,0.5);
        }

        /* Events */
        .cmp-events-list { display: flex; flex-direction: column; gap: 0.85rem; }
        .cmp-event-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.25rem;
          background: #fff;
          border: 1.5px solid rgba(36,17,35,0.1);
          border-radius: 14px;
          flex-wrap: wrap;
        }
        .cmp-event-date {
          display: block;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #6C00AF;
          margin-bottom: 0.2rem;
        }
        .cmp-event-title {
          display: block;
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.95rem;
          font-weight: 700;
          color: #241123;
        }
        .cmp-event-loc {
          display: block;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.75rem;
          color: rgba(36,17,35,0.55);
          margin-top: 0.15rem;
        }

        /* Stories */
        .cmp-stories-list { display: flex; flex-direction: column; gap: 0.65rem; }
        .cmp-story-pill {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          padding: 0.85rem 1.1rem;
          background: rgba(108,0,175,0.04);
          border: 1.5px solid rgba(108,0,175,0.14);
          border-radius: 14px;
          text-decoration: none;
          transition: border-color 140ms;
        }
        .cmp-story-pill:hover { border-color: #6C00AF; }
        .cmp-story-title {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.9rem;
          font-weight: 700;
          color: #6C00AF;
        }
        .cmp-story-teaser {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.78rem;
          color: rgba(36,17,35,0.6);
          line-height: 1.55;
        }

        /* ─── CTA footer ───────────────────────────────────────────── */
        .cmp-cta-section { background: #6C00AF; padding: 5rem 2rem; }
        .cmp-cta-inner {
          max-width: 700px;
          margin: 0 auto;
          text-align: center;
        }
        .cmp-cta-title {
          margin: 0 0 1rem;
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: clamp(1.8rem, 3.5vw, 2.8rem);
          font-weight: 800;
          color: #f2f2f2;
          line-height: 1.2;
        }
        .cmp-cta-body {
          margin: 0 0 2.25rem;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: clamp(0.95rem, 1.6vw, 1.05rem);
          line-height: 1.7;
          color: rgba(242,242,242,0.82);
        }
        .cmp-cta-actions {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 0.85rem;
        }

        /* ─── Shared button classes ─────────────────────────────────── */
        .cmp-btn-yellow {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.9rem 1.8rem;
          border-radius: 14px;
          background: #FFCC00;
          color: #241123;
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          text-decoration: none;
          border: none;
          cursor: pointer;
          transition: transform 150ms, background 150ms;
        }
        .cmp-btn-yellow:hover { transform: translateY(-2px); background: #e6b800; }

        .cmp-btn-yellow-sm {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.6rem 1.2rem;
          border-radius: 10px;
          background: #FFCC00;
          color: #241123;
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          text-decoration: none;
          transition: transform 150ms, background 150ms;
        }
        .cmp-btn-yellow-sm:hover { transform: translateY(-2px); background: #e6b800; }

        .cmp-btn-ghost {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.9rem 1.8rem;
          border-radius: 14px;
          background: rgba(242,242,242,0.12);
          color: #f2f2f2;
          border: 2px solid rgba(242,242,242,0.4);
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          text-decoration: none;
          backdrop-filter: blur(6px);
          transition: transform 150ms, background 150ms;
        }
        .cmp-btn-ghost:hover { transform: translateY(-2px); background: rgba(242,242,242,0.2); }

        .cmp-btn-outline-light {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.9rem 1.8rem;
          border-radius: 14px;
          background: transparent;
          color: #f2f2f2;
          border: 2px solid rgba(242,242,242,0.38);
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          text-decoration: none;
          transition: transform 150ms, background 150ms;
        }
        .cmp-btn-outline-light:hover { transform: translateY(-2px); background: rgba(242,242,242,0.1); }
      `}</style>
    </main>
  );
}
