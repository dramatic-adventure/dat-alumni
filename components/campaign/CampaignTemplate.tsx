// components/campaign/CampaignTemplate.tsx
"use client";

/**
 * Reusable DAT fundraising campaign template.
 *
 * Color palette (campaign-specific, distinct from DAT main-site purple identity):
 *   DARK    = #081C3A  deep midnight navy  (hero, band, testimonials, CTA)
 *   ACCENT  = #2493A9  DAT blue (eyebrows, dates, links, accents)
 *   YELLOW  = #FFCC00  DAT yellow (CTAs, highlights — unchanged)
 *   PURPLE  = #6C00AF  DAT purple (secondary nod, kept minimal)
 *
 * Sections (all config-driven; linked-content blocks hide when empty):
 *   1. Match banner        — above hero, only when matchActive
 *   2. Hero               — full-bleed, cinematic, editorial text panel
 *   3. Progress band      — thermometer + stats
 *   4. Story + Give       — editorial copy + sticky give panel
 *   5. Gift impact        — "Where your gift goes" table
 *   6. Stretch goals      — locked / unlocked states
 *   7. Testimonials       — dark editorial quote block
 *   8. Gallery            — horizontal photo strip
 *   9. Campaign updates   — chronological feed
 *  10. Supporters wall    — recent donors
 *  11. Linked content     — productions, alumni, drama clubs, events, stories
 *  12. CTA footer         — dark action strip
 */

import Image from "next/image";
import Link from "next/link";
import { useRef, useEffect, useState } from "react";
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
/* Color constants                                                     */
/* ------------------------------------------------------------------ */

const DARK = "#081C3A";
const ACCENT = "#2493A9";   // DAT Blue
const YELLOW = "#FFCC00";

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

  // Share state
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const [pageUrl, setPageUrl] = useState("");

  useEffect(() => {
    setPageUrl(window.location.href);
    setCanShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  const shareText =
    campaign.shareText ?? `Support ${campaign.title} — a DAT fundraising campaign.`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // silently ignore
    }
  };

  const handleNativeShare = async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({ title: campaign.title, text: shareText, url: pageUrl });
    } catch {
      // user dismissed — ignore
    }
  };

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
  const hasGiftImpact = (campaign.giftImpact?.length ?? 0) > 0;
  const hasAlumni = (campaign.alumni?.length ?? 0) > 0;
  const hasDramaClubs = (campaign.dramaClubs?.length ?? 0) > 0;
  const hasEvents = (campaign.events?.length ?? 0) > 0;
  const hasStories = (campaign.stories?.length ?? 0) > 0;
  const hasProductions = (campaign.productions?.length ?? 0) > 0;
  const hasLinkedContent = hasAlumni || hasDramaClubs || hasEvents || hasStories || hasProductions;

  return (
    <main style={{ background: "transparent", overflowX: "hidden" }}>

      {/* ── 1. MATCH BANNER ─────────────────────────────────────── */}
      {campaign.matchActive && campaign.matchDescription && (
        <div className="cmp-match-banner">
          <div className="cmp-match-inner">
            <span className="cmp-match-badge">MATCH ACTIVE</span>
            <span className="cmp-match-text">{campaign.matchDescription}</span>
            {campaign.matchCap && (
              <span className="cmp-match-cap">
                Up to {formatCurrency(campaign.matchCap, currency)}
              </span>
            )}
            {campaign.matchUnderwriterEmail && (
              <a
                href={`mailto:${campaign.matchUnderwriterEmail}?subject=${encodeURIComponent(`Matching Gift — ${campaign.title}`)}`}
                className="cmp-match-underwriter"
              >
                {campaign.matchUnderwriterLabel ?? "Interested in funding a matching gift?"} →
              </a>
            )}
          </div>
        </div>
      )}

      {/* ── 2. HERO ─────────────────────────────────────────────── */}
      <section className="cmp-hero-section">
        {/* Image layer with parallax */}
        <div
          ref={heroRef}
          className="cmp-hero-img-layer"
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

        {/* Primary gradient: transparent → solid DARK at bottom — eliminates the hard line */}
        <div className="cmp-hero-gradient-primary" />

        {/* Secondary gradient: soft left-column reading zone */}
        <div className="cmp-hero-gradient-left" />

        {/* Hero editorial text panel */}
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
            {campaign.matchActive && (
              <div className="cmp-band-stat cmp-band-stat--match">
                <span className="cmp-band-stat-val">2×</span>
                <span className="cmp-band-stat-lbl">Match Active</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── 4. STORY + GIVE ─────────────────────────────────────── */}
      <section id="give" className="cmp-story-section">
        <div className="cmp-story-inner">

          {/* Left: Editorial copy */}
          <div className="cmp-story-copy">
            <span className="cmp-eyebrow cmp-eyebrow--accent">The Campaign</span>
            <h2 className="cmp-section-title">{campaign.tagline}</h2>
            {campaign.heroCopy.split("\n\n").map((para, i) => (
              <p key={i} className="cmp-story-para">{para}</p>
            ))}

            {/* Donor callout pull-quote */}
            {campaign.donorCallout && (
              <blockquote className="cmp-donor-callout">
                <span className="cmp-donor-callout-mark">"</span>
                {campaign.donorCallout}
              </blockquote>
            )}

            {/* Learn more links — generic, not hardcoded to PASSAGE */}
            {(campaign.learnMoreUrl || campaign.secondaryUrl) && (
              <div className="cmp-story-links">
                {campaign.learnMoreUrl && (
                  <a
                    href={campaign.learnMoreUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cmp-text-link"
                  >
                    Learn more about {campaign.title} →
                  </a>
                )}
                {campaign.secondaryUrl && campaign.learnMoreUrl && (
                  <a
                    href={campaign.secondaryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cmp-text-link cmp-text-link--secondary"
                  >
                    About the {campaign.eyebrow ?? "Program"} →
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

      {/* ── 5. GIFT IMPACT ──────────────────────────────────────── */}
      {hasGiftImpact && (
        <section className="cmp-impact-section">
          <div className="cmp-impact-inner">
            <span className="cmp-eyebrow cmp-eyebrow--accent">Where Your Gift Goes</span>
            <h2 className="cmp-section-title" style={{ color: "#0f1f38" }}>
              Every amount moves the needle.
            </h2>
            <div className="cmp-impact-grid">
              {campaign.giftImpact!.map((item, i) => (
                <div key={i} className="cmp-impact-card">
                  {item.icon && (
                    <span className="cmp-impact-icon">{item.icon}</span>
                  )}
                  <span className="cmp-impact-amount">
                    {formatCurrency(item.amount, currency)}
                  </span>
                  <span className="cmp-impact-desc">{item.description}</span>
                  {isActive && (
                    <a href="#give" className="cmp-impact-give">Give {formatCurrency(item.amount, currency)} →</a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 6. STRETCH GOALS ────────────────────────────────────── */}
      {hasStretchGoals && (
        <section className="cmp-stretch-section">
          <div className="cmp-stretch-inner">
            <span className="cmp-eyebrow cmp-eyebrow--accent">Stretch Goals</span>
            <h2 className="cmp-section-title" style={{ color: "#0f1f38" }}>
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

      {/* ── 7. TESTIMONIALS ─────────────────────────────────────── */}
      {hasTestimonials && (
        <section className="cmp-quotes-section">
          <div className="cmp-quotes-inner">
            <span className="cmp-eyebrow" style={{ color: YELLOW, opacity: 0.85 }}>
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

      {/* ── 8. GALLERY ──────────────────────────────────────────── */}
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

      {/* ── 9. CAMPAIGN UPDATES ─────────────────────────────────── */}
      {hasUpdates && (
        <section className="cmp-updates-section">
          <div className="cmp-updates-inner">
            <span className="cmp-eyebrow cmp-eyebrow--accent">Campaign Updates</span>
            <h2 className="cmp-section-title" style={{ color: "#0f1f38" }}>
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

      {/* ── 10. SUPPORTERS WALL ─────────────────────────────────── */}
      {hasSupporters && (
        <section className="cmp-supporters-section">
          <div className="cmp-supporters-inner">
            <span className="cmp-eyebrow cmp-eyebrow--accent">Recent Supporters</span>
            <h2 className="cmp-section-title" style={{ color: "#0f1f38" }}>
              In good company.
            </h2>
            <div className="cmp-supporters-wall">
              {totals.recentSupporters.map((s, i) => (
                <div key={i} className="cmp-supporter-chip">
                  <span className="cmp-supporter-name">
                    {s.name ?? "Anonymous"}
                  </span>
                  <div className="cmp-supporter-sub">
                    <span className="cmp-supporter-amt">
                      {formatCurrencyMinor(s.amountMinor, s.currency)}
                    </span>
                    <span className="cmp-supporter-sep">·</span>
                    <span className="cmp-supporter-date">
                      {formatShortDate(s.createdAt.toString())}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {isActive && (
              <div className="cmp-supporters-cta">
                <a href="#give" className="cmp-text-link">Join them — give now →</a>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── 10.5 SHARE ──────────────────────────────────────────── */}
      {isActive && (
        <section className="cmp-share-section">
          <div className="cmp-share-inner">
            <div className="cmp-share-copy">
              <span className="cmp-share-eyebrow">Pass it on</span>
              <p className="cmp-share-text">
                Know someone who believes in this work? Sharing this campaign
                is one of the most powerful things you can do right now.
              </p>
            </div>
            <div className="cmp-share-actions">
              <button
                type="button"
                className={`cmp-share-btn${copied ? " cmp-share-btn--done" : ""}`}
                onClick={handleCopyLink}
              >
                {copied ? "✓ Copied!" : "Copy Link"}
              </button>
              {canShare && (
                <button
                  type="button"
                  className="cmp-share-btn cmp-share-btn--native"
                  onClick={handleNativeShare}
                >
                  Share →
                </button>
              )}
              {pageUrl && (
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText + " ")}&url=${encodeURIComponent(pageUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cmp-share-btn cmp-share-btn--x"
                >
                  Post on X
                </a>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── 11. LINKED CONTENT ──────────────────────────────────── */}
      {hasLinkedContent && (
        <section className="cmp-linked-section">
          <div className="cmp-linked-inner">

            {/* Meet the Artists (alumni) */}
            {hasAlumni && (
              <div className="cmp-linked-block">
                <span className="cmp-eyebrow cmp-eyebrow--accent">Meet the Artists</span>
                <h2 className="cmp-linked-block-title">The people doing the work.</h2>
                <div className="cmp-alumni-grid">
                  {campaign.alumni!.map((a) => (
                    <Link key={a.slug} href={`/alumni/${a.slug}`} className="cmp-alumni-card">
                      <div className={`cmp-alumni-avatar${a.imageUrl ? "" : " cmp-alumni-avatar--placeholder"}`}>
                        {a.imageUrl ? (
                          <Image
                            src={a.imageUrl}
                            alt={a.name}
                            fill
                            sizes="96px"
                            style={{ objectFit: "cover" }}
                          />
                        ) : (
                          <span>{a.name[0]}</span>
                        )}
                      </div>
                      <span className="cmp-alumni-name">{a.name}</span>
                      {a.role && <span className="cmp-alumni-role">{a.role}</span>}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Productions */}
            {hasProductions && (
              <div className="cmp-linked-block">
                <span className="cmp-eyebrow cmp-eyebrow--accent">Related Productions</span>
                <h2 className="cmp-linked-block-title">Work that emerges from this community.</h2>
                <div className="cmp-productions-grid">
                  {campaign.productions!.map((p) => (
                    <Link key={p.slug} href={`/theatre/${p.slug}`} className="cmp-production-card">
                      {p.imageUrl && (
                        <div className="cmp-production-img">
                          <Image
                            src={p.imageUrl}
                            alt={p.title}
                            fill
                            sizes="(min-width:1024px) 25vw, 80vw"
                            style={{ objectFit: "cover" }}
                          />
                        </div>
                      )}
                      <div className="cmp-production-info">
                        <span className="cmp-production-title">{p.title}</span>
                        {p.year && (
                          <span className="cmp-production-year">{p.year}</span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming event / Live moment */}
            {hasEvents && (
              <div className="cmp-linked-block">
                <span className="cmp-eyebrow cmp-eyebrow--accent">Upcoming Event</span>
                <h2 className="cmp-linked-block-title">Be there in person.</h2>
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

            {/* Community connection (drama clubs) */}
            {hasDramaClubs && (
              <div className="cmp-linked-block">
                <span className="cmp-eyebrow cmp-eyebrow--accent">Community Connection</span>
                <h2 className="cmp-linked-block-title">Partner drama clubs on the ground.</h2>
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

            {/* Related stories */}
            {hasStories && (
              <div className="cmp-linked-block">
                <span className="cmp-eyebrow cmp-eyebrow--accent">Related Stories</span>
                <h2 className="cmp-linked-block-title">Why this work matters.</h2>
                <div className="cmp-stories-list">
                  {campaign.stories!.map((s) => (
                    <Link key={s.slug} href={`/story/${s.slug}`} className="cmp-story-pill">
                      <span className="cmp-story-title">{s.title}</span>
                      {s.teaser && <span className="cmp-story-teaser">{s.teaser}</span>}
                      <span className="cmp-story-read">Read the story →</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── 12. CTA FOOTER ──────────────────────────────────────── */}
      <section className="cmp-cta-section">
        <div className="cmp-cta-inner">
          {isActive ? (
            <>
              <span className="cmp-eyebrow" style={{ color: YELLOW, opacity: 0.85 }}>
                {campaign.eyebrow ?? "Fundraising Campaign"}
              </span>
              <h2 className="cmp-cta-title">
                Ready to make it happen?
              </h2>
              <p className="cmp-cta-body">
                Every gift — at any level — sends an artist into the work and keeps it honest and open.
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
                    Learn More →
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
              <span className="cmp-eyebrow" style={{ color: YELLOW, opacity: 0.85 }}>Thank You</span>
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
                <Link href="/campaign" className="cmp-btn-ghost">
                  All Campaigns →
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
          background: ${YELLOW};
          padding: 0.55rem 1.5rem;
        }
        .cmp-match-inner {
          max-width: 1100px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.85rem;
          flex-wrap: wrap;
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.78rem;
          font-weight: 700;
          color: #081C3A;
          text-align: center;
        }
        .cmp-match-badge {
          background: #081C3A;
          color: ${YELLOW};
          font-size: 0.62rem;
          font-weight: 800;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          padding: 0.2rem 0.55rem;
          border-radius: 5px;
          flex-shrink: 0;
        }
        .cmp-match-text {
          letter-spacing: 0.02em;
        }
        .cmp-match-cap {
          font-size: 0.68rem;
          opacity: 0.65;
          font-weight: 600;
        }
        .cmp-match-underwriter {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.7rem;
          font-weight: 600;
          color: rgba(8,28,58,0.7);
          text-decoration: underline;
          text-underline-offset: 2px;
          opacity: 0.75;
          white-space: nowrap;
          transition: opacity 140ms;
        }
        .cmp-match-underwriter:hover { opacity: 1; }

        /* ─── Hero ─────────────────────────────────────────────────── */
        .cmp-hero-section {
          position: relative;
          height: 90vh;
          min-height: 580px;
          overflow: hidden;
          display: flex;
          align-items: flex-end;
        }
        .cmp-hero-img-layer {
          position: absolute;
          inset: -15% 0;
          will-change: transform;
        }
        /* Primary gradient: fades image into the dark progress band below */
        /* Fully opaque at 88% so there's no hard seam */
        .cmp-hero-gradient-primary {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(8,28,58,0.04) 0%,
            rgba(8,28,58,0.12) 22%,
            rgba(8,28,58,0.52) 50%,
            rgba(8,28,58,0.85) 70%,
            rgba(8,28,58,0.97) 85%,
            ${DARK} 100%
          );
        }
        /* Secondary gradient: creates a soft reading zone on the left */
        .cmp-hero-gradient-left {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to right,
            rgba(8,28,58,0.45) 0%,
            rgba(8,28,58,0.2) 40%,
            transparent 65%
          );
        }
        .cmp-hero-body {
          position: relative;
          z-index: 2;
          width: 100%;
          padding: 2.5rem max(1.5rem, calc(50vw - 540px));
          padding-right: max(1.5rem, calc(50vw - 100px));
        }
        @media (max-width: 900px) {
          .cmp-hero-body {
            padding: 2rem 1.5rem;
          }
        }
        .cmp-hero-eyebrow {
          display: block;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: ${YELLOW};
          margin-bottom: 0.75rem;
        }
        .cmp-hero-title {
          margin: 0;
          font-family: var(--font-anton), sans-serif;
          font-size: clamp(3rem, 9vw, 7rem);
          line-height: 0.96;
          text-transform: uppercase;
          color: #f2f2f2;
          text-shadow: 0 4px 32px rgba(0,0,0,0.65), 0 1px 4px rgba(0,0,0,0.9);
          max-width: 820px;
        }
        .cmp-hero-tagline {
          margin: 1.25rem 0 0;
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: clamp(1rem, 2vw, 1.3rem);
          font-weight: 500;
          color: rgba(242,242,242,0.9);
          max-width: 580px;
          line-height: 1.55;
          text-shadow: 0 1px 12px rgba(0,0,0,0.5);
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
          font-size: 0.64rem;
          color: rgba(242,242,242,0.35);
          font-style: italic;
        }

        /* ─── Progress band ────────────────────────────────────────── */
        .cmp-band { background: ${DARK}; padding: 2.5rem 2rem; }
        .cmp-band-inner {
          max-width: 1100px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .cmp-band-thermo { display: flex; flex-direction: column; gap: 0.6rem; }
        .cmp-band-track {
          height: 10px;
          background: rgba(255,255,255,0.1);
          border-radius: 999px;
          overflow: hidden;
        }
        .cmp-band-fill {
          height: 100%;
          background: linear-gradient(90deg, ${ACCENT}, ${YELLOW});
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
          color: ${YELLOW};
        }
        .cmp-band-goal {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.82rem;
          color: rgba(242,242,242,0.5);
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
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(242,242,242,0.45);
        }
        .cmp-band-stat--match .cmp-band-stat-val {
          color: ${YELLOW};
        }
        .cmp-band-stat--match .cmp-band-stat-lbl {
          color: rgba(255,204,0,0.6);
        }

        /* ─── Shared primitives ────────────────────────────────────── */
        .cmp-eyebrow {
          display: inline-block;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          margin-bottom: 0.6rem;
          color: rgba(36,17,35,0.45);
        }
        .cmp-eyebrow--accent {
          color: ${ACCENT};
        }
        .cmp-section-title {
          margin: 0 0 1.25rem;
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: clamp(1.75rem, 3.5vw, 2.75rem);
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
        .cmp-story-copy { color: #0f1f38; }
        .cmp-story-para {
          margin: 0 0 1.25rem;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: clamp(1rem, 1.6vw, 1.1rem);
          line-height: 1.78;
          color: rgba(8,28,58,0.78);
        }
        /* Donor callout pull-quote */
        .cmp-donor-callout {
          position: relative;
          margin: 1.75rem 0 1.5rem;
          padding: 1.25rem 1.5rem 1.25rem 1.75rem;
          border-left: 3px solid ${ACCENT};
          background: rgba(36, 147, 169, 0.06);
          border-radius: 0 12px 12px 0;
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 1.05rem;
          font-weight: 600;
          line-height: 1.6;
          color: #0f1f38;
          font-style: normal;
        }
        .cmp-donor-callout-mark {
          font-family: Georgia, serif;
          font-size: 2rem;
          line-height: 0;
          vertical-align: -0.6rem;
          margin-right: 0.2rem;
          color: ${ACCENT};
          opacity: 0.6;
        }

        .cmp-story-links { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 1rem; }
        .cmp-text-link {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.88rem;
          font-weight: 700;
          color: ${ACCENT};
          text-decoration: none;
          border-bottom: 1.5px solid rgba(26,95,212,0.25);
          padding-bottom: 1px;
          transition: color 140ms, border-color 140ms;
          align-self: flex-start;
        }
        .cmp-text-link:hover { color: #1c7a8a; border-color: #1c7a8a; }
        .cmp-text-link--secondary { color: rgba(8,28,58,0.5); border-color: rgba(8,28,58,0.18); font-size: 0.8rem; }

        .cmp-give-sticky { position: sticky; top: 2rem; }

        /* Ended panel */
        .cmp-ended-panel {
          background: rgba(8,28,58,0.03);
          border: 1.5px solid rgba(26,95,212,0.14);
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
          color: #0f1f38;
        }
        .cmp-ended-body {
          margin: 0;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.9rem;
          line-height: 1.65;
          color: rgba(8,28,58,0.68);
        }

        /* ─── Gift impact ──────────────────────────────────────────── */
        .cmp-impact-section {
          background: rgba(26,95,212,0.04);
          border-top: 1px solid rgba(26,95,212,0.1);
          border-bottom: 1px solid rgba(26,95,212,0.08);
          padding: 5rem 2rem;
        }
        .cmp-impact-inner { max-width: 1100px; margin: 0 auto; }
        .cmp-impact-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1.25rem;
          margin-top: 0.75rem;
        }
        .cmp-impact-card {
          background: #fff;
          border: 1.5px solid rgba(26,95,212,0.12);
          border-radius: 18px;
          padding: 1.5rem 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          transition: box-shadow 200ms, transform 200ms;
        }
        .cmp-impact-card:hover {
          box-shadow: 0 6px 24px rgba(26,95,212,0.1);
          transform: translateY(-2px);
        }
        .cmp-impact-icon {
          font-size: 1.5rem;
          line-height: 1;
        }
        .cmp-impact-amount {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 1.4rem;
          font-weight: 800;
          color: ${ACCENT};
          line-height: 1;
        }
        .cmp-impact-desc {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.82rem;
          line-height: 1.6;
          color: rgba(8,28,58,0.72);
          flex: 1;
        }
        .cmp-impact-give {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.7rem;
          font-weight: 700;
          color: ${ACCENT};
          text-decoration: none;
          letter-spacing: 0.06em;
          margin-top: 0.25rem;
          opacity: 0.7;
          transition: opacity 140ms;
          align-self: flex-start;
        }
        .cmp-impact-give:hover { opacity: 1; }

        /* ─── Stretch goals ────────────────────────────────────────── */
        .cmp-stretch-section { background: rgba(8,28,58,0.03); padding: 5rem 2rem; border-top: 1px solid rgba(8,28,58,0.06); }
        .cmp-stretch-inner { max-width: 1100px; margin: 0 auto; }
        .cmp-stretch-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
          margin-top: 0.5rem;
        }
        .cmp-stretch-card {
          background: #fff;
          border: 1.5px solid rgba(8,28,58,0.1);
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
          color: rgba(8,28,58,0.4);
          padding: 0.2rem 0.6rem;
          border-radius: 6px;
          background: rgba(8,28,58,0.06);
        }
        .cmp-stretch-card--unlocked .cmp-stretch-status {
          color: #2FA873;
          background: rgba(47,168,115,0.12);
        }
        .cmp-stretch-amount {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 1.05rem;
          font-weight: 800;
          color: ${ACCENT};
        }
        .cmp-stretch-card-title {
          margin: 0;
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 1rem;
          font-weight: 800;
          color: #0f1f38;
        }
        .cmp-stretch-card-desc {
          margin: 0;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.85rem;
          line-height: 1.65;
          color: rgba(8,28,58,0.68);
          flex: 1;
        }
        .cmp-stretch-mini-bar {
          height: 4px;
          background: rgba(8,28,58,0.08);
          border-radius: 999px;
          overflow: hidden;
          margin-top: 0.25rem;
        }
        .cmp-stretch-mini-fill {
          height: 100%;
          background: linear-gradient(90deg, ${ACCENT}, ${YELLOW});
          border-radius: 999px;
          min-width: 3px;
          transition: width 1s cubic-bezier(0.25, 1, 0.5, 1);
        }

        /* ─── Testimonials ─────────────────────────────────────────── */
        .cmp-quotes-section { background: ${DARK}; padding: 5rem 2rem; }
        .cmp-quotes-inner { max-width: 1100px; margin: 0 auto; }
        .cmp-quotes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-top: 1.5rem;
        }
        .cmp-quote-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
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
          color: ${YELLOW};
          opacity: 0.3;
          margin-bottom: -0.5rem;
        }
        .cmp-quote-text {
          margin: 0;
          font-family: var(--font-rock-salt), cursive;
          font-size: clamp(0.78rem, 1.4vw, 0.92rem);
          line-height: 1.78;
          color: rgba(242,242,242,0.88);
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
          border: 2px solid rgba(255,204,0,0.35);
        }
        .cmp-quote-name {
          display: block;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.8rem;
          font-weight: 700;
          color: ${YELLOW};
          opacity: 0.85;
        }
        .cmp-quote-role {
          display: block;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.7rem;
          color: rgba(242,242,242,0.4);
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
          color: rgba(8,28,58,0.45);
          font-style: italic;
          background: rgba(8,28,58,0.03);
          border-bottom: 1px solid rgba(8,28,58,0.06);
        }

        /* ─── Campaign updates ─────────────────────────────────────── */
        .cmp-updates-section { padding: 5rem 2rem; }
        .cmp-updates-inner { max-width: 780px; margin: 0 auto; }
        .cmp-updates-feed { display: flex; flex-direction: column; gap: 0; margin-top: 0.5rem; }
        .cmp-update-card {
          padding: 2rem 0;
          border-top: 1px solid rgba(8,28,58,0.08);
        }
        .cmp-update-card:last-child { border-bottom: 1px solid rgba(8,28,58,0.08); }
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
          color: ${ACCENT};
        }
        .cmp-update-author {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.72rem;
          color: rgba(8,28,58,0.45);
        }
        .cmp-update-title {
          margin: 0 0 0.5rem;
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 1.15rem;
          font-weight: 800;
          color: #0f1f38;
        }
        .cmp-update-body {
          margin: 0;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.92rem;
          line-height: 1.72;
          color: rgba(8,28,58,0.72);
        }

        /* ─── Supporters wall ──────────────────────────────────────── */
        .cmp-supporters-section { background: rgba(8,28,58,0.03); padding: 5rem 2rem; }
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
          gap: 0.25rem;
          background: #fff;
          border: 1.5px solid rgba(26,95,212,0.12);
          border-radius: 14px;
          padding: 0.85rem 1.1rem;
          min-width: 150px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.03);
          transition: box-shadow 160ms, transform 160ms;
        }
        .cmp-supporter-chip:hover {
          box-shadow: 0 4px 16px rgba(26,95,212,0.1);
          transform: translateY(-1px);
        }
        .cmp-supporter-name {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.88rem;
          font-weight: 700;
          color: #0f1f38;
        }
        .cmp-supporter-sub {
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        .cmp-supporter-amt {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.78rem;
          font-weight: 700;
          color: ${ACCENT};
        }
        .cmp-supporter-sep {
          font-size: 0.6rem;
          color: rgba(8,28,58,0.25);
        }
        .cmp-supporter-date {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.65rem;
          color: rgba(8,28,58,0.38);
        }
        .cmp-supporters-cta {
          margin-top: 1.5rem;
        }

        /* ─── Share section ────────────────────────────────────────── */
        .cmp-share-section {
          background: ${DARK};
          padding: 2.75rem 2rem;
        }
        .cmp-share-inner {
          max-width: 1100px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 2rem;
          flex-wrap: wrap;
        }
        .cmp-share-copy {
          flex: 1;
          min-width: 220px;
        }
        .cmp-share-eyebrow {
          display: block;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: ${ACCENT};
          margin-bottom: 0.4rem;
        }
        .cmp-share-text {
          margin: 0;
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.92rem;
          font-weight: 500;
          color: rgba(242,242,242,0.78);
          line-height: 1.55;
          max-width: 400px;
        }
        .cmp-share-actions {
          display: flex;
          gap: 0.65rem;
          flex-wrap: wrap;
          align-items: center;
        }
        .cmp-share-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.6rem 1.2rem;
          border-radius: 10px;
          border: 1.5px solid rgba(255,255,255,0.18);
          background: rgba(255,255,255,0.06);
          color: rgba(242,242,242,0.88);
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          cursor: pointer;
          text-decoration: none;
          transition: background 140ms, border-color 140ms, color 140ms;
          white-space: nowrap;
        }
        .cmp-share-btn:hover {
          background: rgba(255,255,255,0.12);
          border-color: rgba(255,255,255,0.35);
          color: #fff;
        }
        .cmp-share-btn--done {
          background: rgba(36,147,169,0.2);
          border-color: ${ACCENT};
          color: ${ACCENT};
        }
        .cmp-share-btn--native {
          background: ${ACCENT};
          border-color: ${ACCENT};
          color: #fff;
        }
        .cmp-share-btn--native:hover {
          background: #1c7a8a;
          border-color: #1c7a8a;
        }
        .cmp-share-btn--x {
          background: transparent;
        }
        @media (max-width: 640px) {
          .cmp-share-inner {
            flex-direction: column;
            align-items: flex-start;
          }
        }

        /* ─── Linked content ───────────────────────────────────────── */
        .cmp-linked-section { padding: 5rem 2rem; }
        .cmp-linked-inner { max-width: 1100px; margin: 0 auto; display: flex; flex-direction: column; gap: 4rem; }
        .cmp-linked-block { display: flex; flex-direction: column; gap: 0.5rem; }
        .cmp-linked-block-title {
          margin: 0 0 1.25rem;
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: clamp(1.2rem, 2.5vw, 1.75rem);
          font-weight: 800;
          color: #0f1f38;
          line-height: 1.2;
        }

        /* Alumni — larger, editorial cards */
        .cmp-alumni-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 1.5rem;
        }
        .cmp-alumni-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.65rem;
          text-decoration: none;
          width: 100px;
          transition: transform 160ms;
        }
        .cmp-alumni-card:hover { transform: translateY(-4px); }
        .cmp-alumni-avatar {
          position: relative;
          width: 88px;
          height: 88px;
          border-radius: 50%;
          overflow: hidden;
          border: 2.5px solid rgba(26,95,212,0.2);
          background: rgba(26,95,212,0.07);
        }
        .cmp-alumni-avatar--placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 1.75rem;
          font-weight: 800;
          color: ${ACCENT};
        }
        .cmp-alumni-name {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          color: #0f1f38;
          text-align: center;
          line-height: 1.3;
        }
        .cmp-alumni-role {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.62rem;
          color: rgba(8,28,58,0.5);
          text-align: center;
        }

        /* Productions */
        .cmp-productions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1.25rem;
        }
        .cmp-production-card {
          display: flex;
          flex-direction: column;
          text-decoration: none;
          border-radius: 14px;
          overflow: hidden;
          border: 1.5px solid rgba(8,28,58,0.1);
          transition: box-shadow 180ms, transform 180ms;
          background: #fff;
        }
        .cmp-production-card:hover {
          box-shadow: 0 6px 24px rgba(8,28,58,0.1);
          transform: translateY(-3px);
        }
        .cmp-production-img {
          position: relative;
          height: 140px;
          background: rgba(8,28,58,0.06);
        }
        .cmp-production-info {
          padding: 0.85rem 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }
        .cmp-production-title {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.88rem;
          font-weight: 700;
          color: #0f1f38;
        }
        .cmp-production-year {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.7rem;
          color: rgba(8,28,58,0.45);
        }

        /* Drama clubs */
        .cmp-clubs-list { display: flex; flex-wrap: wrap; gap: 0.65rem; }
        .cmp-club-pill {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          padding: 0.6rem 1rem;
          background: #fff;
          border: 1.5px solid rgba(26,95,212,0.16);
          border-radius: 12px;
          text-decoration: none;
          transition: border-color 140ms, transform 140ms;
        }
        .cmp-club-pill:hover { border-color: ${ACCENT}; transform: translateY(-2px); }
        .cmp-club-name {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.82rem;
          font-weight: 700;
          color: ${ACCENT};
        }
        .cmp-club-loc {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.68rem;
          color: rgba(8,28,58,0.48);
        }

        /* Events */
        .cmp-events-list { display: flex; flex-direction: column; gap: 0.85rem; }
        .cmp-event-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          padding: 1.1rem 1.4rem;
          background: #fff;
          border: 1.5px solid rgba(8,28,58,0.09);
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
          color: ${ACCENT};
          margin-bottom: 0.2rem;
        }
        .cmp-event-title {
          display: block;
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.95rem;
          font-weight: 700;
          color: #0f1f38;
        }
        .cmp-event-loc {
          display: block;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.75rem;
          color: rgba(8,28,58,0.52);
          margin-top: 0.15rem;
        }

        /* Stories */
        .cmp-stories-list { display: flex; flex-direction: column; gap: 0.75rem; }
        .cmp-story-pill {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          padding: 1.1rem 1.4rem;
          background: rgba(26,95,212,0.04);
          border: 1.5px solid rgba(26,95,212,0.12);
          border-radius: 14px;
          text-decoration: none;
          transition: border-color 140ms, background 140ms;
        }
        .cmp-story-pill:hover {
          border-color: ${ACCENT};
          background: rgba(26,95,212,0.07);
        }
        .cmp-story-title {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.95rem;
          font-weight: 700;
          color: ${ACCENT};
        }
        .cmp-story-teaser {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.82rem;
          color: rgba(8,28,58,0.6);
          line-height: 1.55;
        }
        .cmp-story-read {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.7rem;
          font-weight: 700;
          color: ${ACCENT};
          opacity: 0.65;
          letter-spacing: 0.06em;
          margin-top: 0.1rem;
        }

        /* ─── CTA footer ───────────────────────────────────────────── */
        .cmp-cta-section { background: ${DARK}; padding: 5rem 2rem; }
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
          line-height: 1.72;
          color: rgba(242,242,242,0.75);
        }
        .cmp-cta-actions {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 0.85rem;
        }

        /* ─── Shared buttons ───────────────────────────────────────── */
        .cmp-btn-yellow {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.9rem 1.8rem;
          border-radius: 14px;
          background: ${YELLOW};
          color: #0f1f38;
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
          background: ${YELLOW};
          color: #0f1f38;
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
          background: rgba(242,242,242,0.1);
          color: #f2f2f2;
          border: 2px solid rgba(242,242,242,0.35);
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          text-decoration: none;
          backdrop-filter: blur(6px);
          transition: transform 150ms, background 150ms;
        }
        .cmp-btn-ghost:hover { transform: translateY(-2px); background: rgba(242,242,242,0.18); }

        .cmp-btn-outline-light {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.9rem 1.8rem;
          border-radius: 14px;
          background: transparent;
          color: #f2f2f2;
          border: 2px solid rgba(242,242,242,0.32);
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          text-decoration: none;
          transition: transform 150ms, background 150ms;
        }
        .cmp-btn-outline-light:hover { transform: translateY(-2px); background: rgba(242,242,242,0.08); }
      `}</style>
    </main>
  );
}
