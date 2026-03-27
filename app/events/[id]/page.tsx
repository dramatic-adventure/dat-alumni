import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import CopyEventLinkButton from "@/components/events/CopyEventLinkButton";
import { productionMap } from "@/lib/productionMap";
import { dramaClubs as rawDramaClubs } from "@/lib/dramaClubMap";
import {
  allEventIds,
  categoryMeta,
  eventById,
  formatDateRange,
  getEventImage,
  isCommunityShowcase,
  type DatEvent,
} from "@/lib/events";

type PageProps = { params: Promise<{ id: string }> };

const SITE_URL = "https://dramaticadventure.com";

type DramaClubRef = {
  slug: string;
  name: string;
  location?: string;
  logoSrc?: string;
  logoAlt?: string;
};

const dramaClubs = rawDramaClubs as DramaClubRef[];

const THEME_BY_CATEGORY: Record<
  DatEvent["category"],
  {
    accent: string;
    surface: string;
    surface2: string;
    glow: string;
    heroOverlay: string;
    buttonText: string;
  }
> = {
  performance: {
    accent: "#F23359",
    surface: "#0d0812",
    surface2: "#3a0013",
    glow: "rgba(242, 51, 89, 0.18)",
    heroOverlay:
      "linear-gradient(to top, rgba(13,8,18,1) 0%, rgba(13,8,18,0.95) 12%, rgba(13,8,18,0.78) 38%, rgba(13,8,18,0.35) 70%, rgba(13,8,18,0.12) 100%)",
    buttonText: "#ffffff",
  },
  festival: {
    accent: "#2493A9",
    surface: "#05141a",
    surface2: "#052f3d",
    glow: "rgba(36, 147, 169, 0.18)",
    heroOverlay:
      "linear-gradient(to top, rgba(5,20,26,1) 0%, rgba(5,20,26,0.95) 12%, rgba(5,20,26,0.82) 38%, rgba(5,20,26,0.4) 70%, rgba(5,20,26,0.12) 100%)",
    buttonText: "#ffffff",
  },
  fundraiser: {
    accent: "#D9A919",
    surface: "#140c04",
    surface2: "#2e2000",
    glow: "rgba(217, 169, 25, 0.18)",
    heroOverlay:
      "linear-gradient(to top, rgba(20,12,4,1) 0%, rgba(20,12,4,0.95) 12%, rgba(20,12,4,0.82) 38%, rgba(20,12,4,0.42) 70%, rgba(20,12,4,0.12) 100%)",
    buttonText: "#241123",
  },
};

function normalizeImagePath(input?: string | null): string | undefined {
  if (!input) return undefined;
  const raw = input.trim();
  if (!raw) return undefined;

  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("public/")) {
    return `/${raw.slice("public/".length).replace(/^\/+/, "")}`;
  }
  if (raw.startsWith("/")) return raw;
  return `/${raw.replace(/^\/+/, "")}`;
}

function toAbsoluteUrl(input?: string | null): string {
  const normalized = normalizeImagePath(input) ?? "/posters/fallback-16x9.jpg";
  if (/^https?:\/\//i.test(normalized)) return normalized;
  return `${SITE_URL}${normalized}`;
}

function splitParagraphs(text?: string): string[] {
  if (!text) return [];
  return text
    .split(/\n\s*\n/g)
    .map((p) => p.trim())
    .filter(Boolean);
}

function getEventEyebrow(event: DatEvent): string {
  if (isCommunityShowcase(event)) return "Community Showcase";
  if (event.subcategory === "benefit") return "Benefit Event";
  if (event.subcategory === "screening") return "Screening";
  if (event.subcategory === "commission") return "Commission";
  return categoryMeta[event.category].eyebrow;
}

function getPrimaryAction(event: DatEvent):
  | { href: string; label: string; external?: boolean; tone?: "primary" | "invite" }
  | null {
  if (isCommunityShowcase(event) && event.contactEmail) {
    return {
      href: `mailto:${event.contactEmail}?subject=${encodeURIComponent(
        `Attendance Request: ${event.title}`,
      )}`,
      label: "Request an Invite →",
      tone: "invite",
    };
  }

  if (!event.ticketUrl) return null;

  return {
    href: event.ticketUrl,
    label:
      event.ticketType === "free"
        ? "Register Free →"
        : event.ticketType === "pay-what-you-can"
          ? "Get Your Ticket →"
          : "Reserve Your Seat →",
    external: true,
    tone: "primary",
  };
}

function resolveDramaClubSlugs(event: DatEvent): string[] {
  const singular = event.dramaClub ? [event.dramaClub] : [];
  const plural =
    "dramaClubs" in event && Array.isArray((event as DatEvent & { dramaClubs?: string[] }).dramaClubs)
      ? ((event as DatEvent & { dramaClubs?: string[] }).dramaClubs ?? [])
      : [];

  return Array.from(new Set([...singular, ...plural].filter(Boolean)));
}

function resolveDramaClubs(event: DatEvent): DramaClubRef[] {
  const slugs = resolveDramaClubSlugs(event);
  return slugs
    .map((slug) => dramaClubs.find((club) => club.slug === slug))
    .filter(Boolean) as DramaClubRef[];
}

export async function generateStaticParams() {
  return allEventIds().map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const event = eventById(id);

  if (!event) {
    return {
      title: "Event Not Found | Dramatic Adventure Theatre",
    };
  }

  const image = toAbsoluteUrl(getEventImage(event));
  const title = event.subtitle
    ? `${event.title} | ${event.subtitle} | Dramatic Adventure Theatre`
    : `${event.title} | Dramatic Adventure Theatre`;

  return {
    title,
    description: event.description,
    alternates: {
      canonical: `/events/${event.id}`,
    },
    openGraph: {
      title,
      description: event.description,
      url: `${SITE_URL}/events/${event.id}`,
      siteName: "Dramatic Adventure Theatre",
      type: "article",
      images: [
        {
          url: image,
          alt: event.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: event.description,
      images: [image],
    },
  };
}

export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params;
  const event = eventById(id);

  if (!event) notFound();

  const meta = categoryMeta[event.category];
  const theme = THEME_BY_CATEGORY[event.category];
  const heroImage = normalizeImagePath(getEventImage(event)) ?? "/posters/fallback-16x9.jpg";
  const paragraphs = splitParagraphs(event.longDescription ?? event.description);
  const primaryAction = getPrimaryAction(event);
  const relatedProduction = event.production ? productionMap[event.production] : undefined;
  const linkedDramaClubs = resolveDramaClubs(event);

  const shareSubject = encodeURIComponent(`${event.title} — Dramatic Adventure Theatre`);
  const shareBody = encodeURIComponent(
    `I thought you might like this event:\n\n${event.title}\n${SITE_URL}/events/${event.id}`,
  );

  const heroVars = {
    backgroundImage: `url('${heroImage}')`,
    ["--evd-accent" as string]: theme.accent,
    ["--evd-surface" as string]: theme.surface,
    ["--evd-surface-2" as string]: theme.surface2,
    ["--evd-glow" as string]: theme.glow,
    ["--evd-hero-overlay" as string]: theme.heroOverlay,
    ["--evd-button-text" as string]: theme.buttonText,
  } as CSSProperties;

  return (
    <>
      <div className="evd-hero" style={heroVars}>
        <div className="evd-hero-overlay" />
        <div className="evd-hero-glow" />
        <div className="evd-container evd-hero-content">
          <nav className="evd-breadcrumb" aria-label="Breadcrumb">
            <Link href="/events">Events</Link>
            <span>/</span>
            <Link href={meta.href}>{meta.label}s</Link>
            <span>/</span>
            <span>{event.title}</span>
          </nav>

          <p className="evd-eyebrow">{getEventEyebrow(event)}</p>
          <h1 className="evd-title">{event.title}</h1>

          {event.subtitle ? (
            <p className="evd-subtitle">{event.subtitle}</p>
          ) : null}

          <p className="evd-standfirst">{event.description}</p>

          <div className="evd-hero-pills">
            <span className="evd-pill">{formatDateRange(event.date, event.endDate)}</span>
            {event.time ? <span className="evd-pill">{event.time}</span> : null}
            <span className="evd-pill">
              {event.venue}
              {event.city !== "Worldwide" ? ` · ${event.city}` : ""}
            </span>
          </div>
        </div>
      </div>

        <section className="evd-meta-band">
        <div className="evd-container">
            <div className="evd-meta-shell">
            <div className="evd-meta-grid">
                <div className="evd-meta-card">
                <p className="evd-meta-label">Dates</p>
                <p className="evd-meta-value">{formatDateRange(event.date, event.endDate)}</p>
                </div>

                {event.time ? (
                <div className="evd-meta-card">
                    <p className="evd-meta-label">Time</p>
                    <p className="evd-meta-value">{event.time}</p>
                </div>
                ) : null}

                {event.doors ? (
                <div className="evd-meta-card">
                    <p className="evd-meta-label">Doors</p>
                    <p className="evd-meta-value">{event.doors}</p>
                </div>
                ) : null}

                <div className="evd-meta-card">
                <p className="evd-meta-label">Venue</p>
                <p className="evd-meta-value">{event.venue}</p>
                {event.address ? <p className="evd-meta-sub">{event.address}</p> : null}
                </div>

                <div className="evd-meta-card">
                <p className="evd-meta-label">Location</p>
                <p className="evd-meta-value">
                    {event.city}
                    {event.country ? `, ${event.country}` : ""}
                </p>
                </div>

                {(event.ticketPrice || primaryAction) ? (
                <div className="evd-meta-card">
                    <p className="evd-meta-label">Tickets</p>
                    <p className="evd-meta-value">{event.ticketPrice ?? "Details below"}</p>
                </div>
                ) : null}
            </div>

            <div className="evd-actions">
                {primaryAction ? (
                <a
                    href={primaryAction.href}
                    target={primaryAction.external ? "_blank" : undefined}
                    rel={primaryAction.external ? "noopener noreferrer" : undefined}
                    className={`evd-btn ${primaryAction.tone === "invite" ? "evd-btn-invite" : "evd-btn-primary"}`}
                >
                    {primaryAction.label}
                </a>
                ) : null}

                {relatedProduction ? (
                <Link href={`/theatre/${event.production}`} className="evd-btn-ghost">
                    Full Production →
                </Link>
                ) : null}

                <a
                href={`mailto:?subject=${shareSubject}&body=${shareBody}`}
                className="evd-btn-ghost"
                >
                Share by Email →
                </a>

                <CopyEventLinkButton className="evd-btn-ghost" />
            </div>
            </div>
        </div>
        </section>

      <section className="evd-body-band">
        <div className="evd-container evd-body-grid">
          <div className="evd-body-heading-box">
            <p className="evd-body-eyebrow">About the Event</p>
            <h2 className="evd-body-title">What to Expect</h2>
          </div>

          <div className="evd-body-copy">
            {paragraphs.map((p, i) => (
              <p key={i} className="evd-body-paragraph">
                {p}
              </p>
            ))}
          </div>
        </div>
      </section>

      {linkedDramaClubs.length > 0 ? (
        <section className="evd-clubs-band">
          <div className="evd-container">
            <div className="evd-section-head">
              <p className="evd-section-eyebrow">Featuring DAT Drama Clubs</p>
              <h2 className="evd-section-title">
                {linkedDramaClubs.length > 1 ? "Participating Ensembles" : "Participating Ensemble"}
              </h2>
            </div>

            <div className="evd-club-grid">
              {linkedDramaClubs.map((club) => (
                <Link key={club.slug} href={`/drama-club/${club.slug}`} className="evd-club-card">
                  {club.logoSrc ? (
                    <div className="evd-club-logo-wrap">
                      <img
                        src={club.logoSrc}
                        alt={club.logoAlt ?? club.name}
                        className="evd-club-logo"
                      />
                    </div>
                  ) : null}
                  <div className="evd-club-copy">
                    <h3 className="evd-club-name">{club.name}</h3>
                    {club.location ? (
                      <p className="evd-club-location">{club.location}</p>
                    ) : null}
                    <span className="evd-club-link">Visit Drama Club →</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {relatedProduction ? (
        <section className="evd-related-band">
          <div className="evd-container">
            <div className="evd-section-head">
              <p className="evd-section-eyebrow">Related Production</p>
              <h2 className="evd-section-title">Go Deeper into the Work</h2>
            </div>

            <div className="evd-production-card">
              <div
                className="evd-production-image"
                style={{
                  backgroundImage: `url('${normalizeImagePath(relatedProduction.posterUrl) ?? "/posters/fallback-16x9.jpg"}')`,
                }}
              />
              <div className="evd-production-copy">
                <p className="evd-production-label">From the Theatre Archive</p>
                <h3 className="evd-production-title">{relatedProduction.title}</h3>
                <p className="evd-production-meta">
                  {relatedProduction.location}
                  {relatedProduction.festival ? ` · ${relatedProduction.festival}` : ""}
                </p>
                <Link href={`/theatre/${event.production}`} className="evd-btn-ghost">
                  Full Production →
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="evd-bottom-band">
        <div className="evd-container evd-bottom-inner">
          <p className="evd-bottom-label">Explore More</p>
          <div className="evd-bottom-links">
            <Link href={meta.href} className="evd-bottom-link evd-bottom-link--accent">
              {meta.plural} →
            </Link>
            {event.production ? (
              <Link href={`/theatre/${event.production}`} className="evd-bottom-link evd-bottom-link--muted">
                Theatre Archive →
              </Link>
            ) : (
              <Link href="/projects" className="evd-bottom-link evd-bottom-link--muted">
                Projects Archive →
              </Link>
            )}
            <Link href="/events" className="evd-bottom-link evd-bottom-link--muted">
              ← All Events
            </Link>
          </div>
        </div>
      </section>

      <style>{`
        :root {
          color-scheme: dark;
        }

        .evd-container {
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 clamp(1.25rem, 5vw, 3rem);
        }

        .evd-hero {
          position: relative;
          min-height: 78vh;
          background-size: cover;
          background-position: center 34%;
          display: flex;
          align-items: flex-end;
          overflow: hidden;
        }
        .evd-hero-overlay {
          position: absolute;
          inset: 0;
          background: var(--evd-hero-overlay);
        }
        .evd-hero-glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 70% 55% at 12% 88%, var(--evd-glow) 0%, transparent 62%);
        }
        .evd-hero::after {
        content: "";
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 35%;
        background: linear-gradient(to bottom, transparent 0%, var(--evd-surface) 100%);
        box-shadow: 0 18px 30px rgba(0, 0, 0, 0.22);
        z-index: 3;
        pointer-events: none;
        }
        .evd-hero-content {
          position: relative;
          z-index: 4;
          padding: clamp(6rem, 12vw, 10rem) clamp(1.5rem, 6vw, 5rem) clamp(2.5rem, 5vw, 4.5rem);
          max-width: 760px;
        }

        .evd-breadcrumb {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
          font-family: "DM Sans", sans-serif;
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.42);
          margin-bottom: 1.25rem;
        }
        .evd-breadcrumb a {
          color: rgba(255,255,255,0.42);
          text-decoration: none;
          transition: color 0.2s;
        }
        .evd-breadcrumb a:hover {
          color: var(--evd-accent);
        }

        .evd-eyebrow,
        .evd-body-eyebrow,
        .evd-section-eyebrow,
        .evd-bottom-label {
          font-family: "DM Sans", sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.28em;
          text-transform: uppercase;
        }

        .evd-eyebrow {
          color: var(--evd-accent);
          margin: 0 0 0.8rem;
        }

        .evd-title {
          font-family: "Anton", sans-serif;
          font-size: clamp(3.1rem, 9vw, 7.75rem);
          line-height: 0.9;
          color: #fff;
          margin: 0 0 0.9rem;
          letter-spacing: 0.01em;
          text-shadow: 0 2px 24px rgba(0,0,0,0.5);
        }

        .evd-subtitle {
          font-family: "Space Grotesk", sans-serif;
          font-size: clamp(1rem, 2vw, 1.35rem);
          font-weight: 700;
          color: rgba(255,255,255,0.86);
          line-height: 1.4;
          margin: 0 0 1rem;
        }

        .evd-standfirst {
          font-family: "Space Grotesk", sans-serif;
          font-size: clamp(0.98rem, 2vw, 1.12rem);
          color: rgba(255,255,255,0.72);
          line-height: 1.7;
          margin: 0 0 2rem;
          max-width: 560px;
        }

        .evd-hero-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 0.65rem;
        }
        .evd-pill {
          font-family: "DM Sans", sans-serif;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.78);
          border: 1px solid rgba(255,255,255,0.16);
          background: rgba(0,0,0,0.22);
          border-radius: 999px;
          padding: 0.48rem 0.92rem;
        }

        .evd-meta-band {
        background: var(--evd-surface);
        padding: clamp(2rem, 4vw, 3rem) 0 clamp(2.5rem, 5vw, 3.5rem);
        }

        .evd-meta-shell {
        background: rgba(20, 16, 22, 0.52);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 18px;
        padding: clamp(1rem, 2vw, 1.3rem);
        box-shadow:
            0 18px 40px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        }

        .evd-meta-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 1rem;
        }

        .evd-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        margin-top: 1.1rem;
        padding-top: 1rem;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .evd-meta-card {
        background: rgba(255, 255, 255, 0.045);
        border: 1px solid rgba(255, 255, 255, 0.07);
        border-radius: 14px;
        padding: 1rem 1rem 1.05rem;
        }
        .evd-meta-label {
          font-family: "DM Sans", sans-serif;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.38);
          margin: 0 0 0.5rem;
        }
        .evd-meta-value {
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.98rem;
          font-weight: 700;
          color: #fff;
          line-height: 1.45;
          margin: 0;
        }
        .evd-meta-sub {
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.86rem;
          color: rgba(255,255,255,0.5);
          line-height: 1.5;
          margin: 0.4rem 0 0;
        }

        .evd-btn,
        .evd-btn-ghost {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.45rem;
          min-height: 46px;
          padding: 0.8rem 1.2rem;
          border-radius: 10px;
          font-family: "DM Sans", sans-serif;
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          text-decoration: none;
          transition: transform 0.18s, opacity 0.18s, border-color 0.18s;
        }
        .evd-btn:hover,
        .evd-btn-ghost:hover {
          transform: translateY(-1px);
          opacity: 0.92;
        }

        .evd-btn-primary {
          background: var(--evd-accent);
          color: var(--evd-button-text);
          border: none;
        }
        .evd-btn-invite {
          background: #2FA873;
          color: #fff;
          border: none;
        }
        .evd-btn-ghost {
          color: rgba(255,255,255,0.78);
          background: transparent;
          border: 1.5px solid rgba(255,255,255,0.16);
          cursor: pointer;
        }

        .evd-body-band {
        background: transparent;
        padding: clamp(3rem, 6vw, 5rem) 0;
        border-top: 8px solid var(--evd-accent);
        }
        .evd-body-grid {
          display: grid;
          grid-template-columns: 1fr 1.6fr;
          gap: clamp(2rem, 5vw, 4.5rem);
          align-items: start;
        }
        @media (max-width: 800px) {
          .evd-body-grid {
            grid-template-columns: 1fr;
          }
        }
        .evd-body-heading-box {
        display: inline-flex;
        flex-direction: column;
        gap: 0.2rem;
        background: rgba(36, 17, 35, 0.22);
        border-left: 4px solid var(--evd-accent);
        border-radius: 0 10px 10px 0;
        padding: 0.8rem 1.5rem 0.8rem 1rem;
        }
        .evd-body-eyebrow {
          color: #5a4060;
          margin: 0 0 0.35rem;
        }
        .evd-body-title {
          font-family: "Anton", sans-serif;
          font-size: clamp(2rem, 4vw, 3.2rem);
          line-height: 1;
          color: #241123;
          margin: 0;
        }
        .evd-body-copy {
        background: transparent;
        border-radius: 0;
        padding: 0;
        }
        .evd-body-paragraph {
        font-family: "Space Grotesk", sans-serif;
        font-size: 1rem;
        line-height: 1.8;
        color: #241123;
        margin: 0 0 1rem;
        text-shadow: 0 1px 0 rgba(255, 255, 255, 0.15);
        }
        .evd-body-paragraph:last-child {
          margin-bottom: 0;
        }

        .evd-clubs-band,
        .evd-related-band {
          background: var(--evd-surface);
          padding: clamp(3rem, 6vw, 4.5rem) 0;
        }

        .evd-section-head {
          margin-bottom: 1.4rem;
        }
        .evd-section-eyebrow {
          color: rgba(255,255,255,0.4);
          margin: 0 0 0.55rem;
        }
        .evd-section-title {
          font-family: "Anton", sans-serif;
          font-size: clamp(1.9rem, 4vw, 3rem);
          line-height: 1;
          color: #fff;
          margin: 0;
        }

        .evd-club-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1rem;
        }
        .evd-club-card {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 1rem;
          align-items: center;
          text-decoration: none;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          padding: 1rem;
          transition: transform 0.18s, border-color 0.18s, background 0.18s;
        }
        .evd-club-card:hover {
          transform: translateY(-2px);
          border-color: rgba(255,255,255,0.16);
          background: rgba(255,255,255,0.06);
        }
        .evd-club-logo-wrap {
          width: 72px;
          height: 72px;
          border-radius: 14px;
          background: rgba(255,255,255,0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          flex-shrink: 0;
        }
        .evd-club-logo {
          max-width: 84%;
          max-height: 84%;
          object-fit: contain;
        }
        .evd-club-copy {
          min-width: 0;
        }
        .evd-club-name {
          font-family: "Space Grotesk", sans-serif;
          font-size: 1rem;
          font-weight: 700;
          color: #fff;
          margin: 0 0 0.25rem;
        }
        .evd-club-location {
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.9rem;
          color: rgba(255,255,255,0.55);
          margin: 0 0 0.45rem;
        }
        .evd-club-link {
          font-family: "DM Sans", sans-serif;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--evd-accent);
        }

        .evd-production-card {
          display: grid;
          grid-template-columns: minmax(220px, 320px) 1fr;
          gap: 1.2rem;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          overflow: hidden;
        }
        @media (max-width: 760px) {
          .evd-production-card {
            grid-template-columns: 1fr;
          }
        }
        .evd-production-image {
          min-height: 240px;
          background-size: cover;
          background-position: center;
        }
        .evd-production-copy {
          padding: 1.4rem;
          display: flex;
          flex-direction: column;
          gap: 0.55rem;
          justify-content: center;
        }
        .evd-production-label {
          font-family: "DM Sans", sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--evd-accent);
          margin: 0;
        }
        .evd-production-title {
          font-family: "Anton", sans-serif;
          font-size: clamp(1.7rem, 4vw, 2.7rem);
          line-height: 0.95;
          color: #fff;
          margin: 0;
        }
        .evd-production-meta {
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.95rem;
          color: rgba(255,255,255,0.6);
          line-height: 1.6;
          margin: 0 0 0.25rem;
        }

        .evd-bottom-band {
          background: var(--evd-surface-2);
          padding: clamp(2.5rem, 5vw, 4rem) 0;
        }
        .evd-bottom-inner {
          display: flex;
          flex-direction: column;
          gap: 1.2rem;
        }
        .evd-bottom-label {
          color: rgba(255,255,255,0.35);
          margin: 0;
        }
        .evd-bottom-links {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
        }
        .evd-bottom-link {
          font-family: "DM Sans", sans-serif;
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          text-decoration: none;
          padding: 0.65rem 1.35rem;
          border-radius: 8px;
          transition: opacity 0.2s, transform 0.15s;
        }
        .evd-bottom-link:hover {
          opacity: 0.85;
          transform: translateY(-1px);
        }
        .evd-bottom-link--accent {
          background: var(--evd-accent);
          color: var(--evd-button-text);
        }
        .evd-bottom-link--muted {
          color: rgba(255,255,255,0.42);
          border: 1.5px solid rgba(255,255,255,0.14);
        }

        @media (max-width: 640px) {
          .evd-title {
            word-break: break-word;
          }
          .evd-actions {
            flex-direction: column;
            align-items: stretch;
          }
          .evd-btn,
          .evd-btn-ghost {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}