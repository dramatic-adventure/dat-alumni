import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import DramaClubBadge from "@/components/ui/DramaClubBadge";
import EventShareButton from "@/components/events/EventShareButton";
import EventGallery from "@/components/events/EventGallery";
import MailingListForm from "@/components/events/MailingListForm";
import { productionMap } from "@/lib/productionMap";
import { productionDetailsMap, type ProductionExtra } from "@/lib/productionDetailsMap";
import { dramaClubs as rawDramaClubs } from "@/lib/dramaClubMap";
import {
  allEventIds,
  categoryMeta,
  eventById,
  events,
  formatDateRange,
  getEventImage,
  isCommunityShowcase,
  type DatEvent,
} from "@/lib/events";

type PageProps = { params: Promise<{ id: string }> };

const SITE_URL = "https://dramaticadventure.com";
/** Share links use the stories subdomain for a cleaner social presence. */
const SHARE_URL = "https://stories.dramaticadventure.com";

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

// ── Calendar helpers ──────────────────────────────────────────────────────────

/** Returns a Google Calendar "add event" URL for any DatEvent. */
function googleCalendarUrl(event: DatEvent): string {
  const fmt = (d: string) => d.replace(/-/g, "");
  const startDate = fmt(event.date);
  // Google Calendar all-day events use exclusive end date (day after last day)
  const endRaw = event.endDate ?? event.date;
  const endObj = new Date(endRaw + "T00:00:00Z");
  endObj.setUTCDate(endObj.getUTCDate() + 1);
  const endDate = endObj.toISOString().slice(0, 10).replace(/-/g, "");
  const location = [event.venue, event.address, event.city, event.country]
    .filter(Boolean)
    .join(", ");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${startDate}/${endDate}`,
    details: `${event.description}\n\n${SITE_URL}/events/${event.id}`,
    location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Returns an Outlook Web calendar "add event" URL. */
function outlookCalendarUrl(event: DatEvent): string {
  const location = [event.venue, event.address, event.city, event.country]
    .filter(Boolean)
    .join(", ");
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: event.title,
    startdt: event.date,
    enddt: event.endDate ?? event.date,
    body: `${event.description}\n\n${SITE_URL}/events/${event.id}`,
    location,
  });
  return `https://outlook.office.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/** Builds a schema.org Event JSON-LD object for SEO + social previews. */
function buildEventJsonLd(event: DatEvent): Record<string, unknown> {
  const image = toAbsoluteUrl(getEventImage(event));
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.longDescription ?? event.description,
    startDate: event.date,
    ...(event.endDate ? { endDate: event.endDate } : {}),
    eventStatus:
      event.status === "cancelled"
        ? "https://schema.org/EventCancelled"
        : "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: event.venue,
      address: {
        "@type": "PostalAddress",
        ...(event.address ? { streetAddress: event.address } : {}),
        addressLocality: event.city,
        addressCountry: event.country,
      },
    },
    organizer: {
      "@type": "Organization",
      name: "Dramatic Adventure Theatre",
      url: SITE_URL,
    },
    image,
    url: `${SITE_URL}/events/${event.id}`,
    ...(event.ticketUrl
      ? {
          offers: {
            "@type": "Offer",
            url: event.ticketUrl,
            ...(event.ticketType === "free" ? { price: "0" } : {}),
            priceCurrency: event.country === "UK" ? "GBP" : "USD",
            availability: "https://schema.org/InStock",
          },
        }
      : {}),
  };
}

// ── Rich-content resolvers ────────────────────────────────────────────────────
// Each resolver tries the event's own data first, then falls back to the
// linked production's data, then returns undefined (section stays hidden).

type GalleryItem = { src: string; alt?: string };
type CreditItem = { role: string; name: string; href?: string; group?: "creative" | "cast"; photo?: string };

function resolvePhotoGallery(
  event: DatEvent,
  extra?: ProductionExtra,
): GalleryItem[] | undefined {
  if (event.photoGallery?.length) return event.photoGallery;
  const imgs = (extra?.galleryImages as GalleryItem[] | undefined) ?? [];
  return imgs.length ? imgs : undefined;
}

function resolvePhotoCredit(
  event: DatEvent,
  extra?: ProductionExtra,
): string | undefined {
  return event.photoCredit ?? extra?.productionPhotographer;
}

function resolveVideoUrl(
  event: DatEvent,
  extra?: ProductionExtra,
): { url: string; title?: string } | undefined {
  if (event.videoUrl) return { url: event.videoUrl, title: event.videoTitle };
  const first = extra?.processSections?.find((s) => s.videoUrl);
  return first?.videoUrl ? { url: first.videoUrl, title: first.videoTitle } : undefined;
}

function resolveArtistNote(
  event: DatEvent,
  extra?: ProductionExtra,
): { note: string; by?: string } | undefined {
  if (event.artistNote) return { note: event.artistNote, by: event.artistNoteBy };
  const pq = extra?.pullQuote;
  return pq?.quote ? { note: pq.quote, by: pq.attribution } : undefined;
}

function resolveCredits(
  event: DatEvent,
  extra?: ProductionExtra,
): CreditItem[] | undefined {
  if (event.credits?.length) return event.credits;
  const team = (extra?.creativeTeamOverride ?? []).map((p) => ({
    group: "creative" as const,
    role: p.role,
    name: p.name,
    href: p.href,
    photo: undefined as string | undefined,
  }));
  const cast = (extra?.castOverride ?? []).map((p) => ({
    group: "cast" as const,
    role: p.role,
    name: p.name,
    href: p.href,
    photo: undefined as string | undefined,
  }));
  const combined = [...team, ...cast];
  return combined.length ? combined : undefined;
}

/** Converts a YouTube or Vimeo URL to an embeddable iframe src. */
function getVideoEmbedUrl(url: string): string | undefined {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s?]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?rel=0&modestbranding=1`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}?color=ffffff&title=0&byline=0`;
  return undefined;
}

/** Returns up to 3 upcoming events in the same category, excluding the current one. */
function relatedUpcomingEvents(current: DatEvent): DatEvent[] {
  return events
    .filter((e) => e.status === "upcoming" && e.id !== current.id && e.category === current.category)
    .slice(0, 3);
}

type CycleEntry = { slug: string; title: string; posterUrl?: string; location?: string; festival?: string };

/**
 * Finds all productions that share the same relatedBaseTitle as the given
 * productionSlug — i.e., every iteration of a production cycle (revivals,
 * workshop versions, etc). Returns the list excluding the current slug.
 */
function relatedProductionCycle(productionSlug?: string): CycleEntry[] {
  if (!productionSlug) return [];

  const currentProd = productionMap[productionSlug];
  if (!currentProd) return [];

  const currentExtra = productionDetailsMap[productionSlug];
  const rawBase =
    currentExtra?.relatedBaseTitle ??
    currentProd.title?.split("--")[0]?.trim() ??
    "";
  const baseTitle = rawBase.replace(/\s+/g, " ").trim().toLowerCase();
  if (!baseTitle) return [];

  return Object.entries(productionMap)
    .filter(([slug, prod]) => {
      if (slug === productionSlug) return false;
      const extra = productionDetailsMap[slug];
      const thisRaw =
        extra?.relatedBaseTitle ?? prod.title?.split("--")[0]?.trim() ?? "";
      return thisRaw.replace(/\s+/g, " ").trim().toLowerCase() === baseTitle;
    })
    .map(([slug, prod]) => ({
      slug,
      title: prod.title,
      posterUrl: normalizeImagePath(
        productionDetailsMap[slug]?.heroImageUrl ?? prod.posterUrl,
      ),
      location: prod.location,
      festival: prod.festival,
    }));
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
  const productionExtra = event.production ? productionDetailsMap[event.production] : undefined;
  const linkedDramaClubs = resolveDramaClubs(event);

  // Rich-content resolution (event-first, production fallback)
  const photoGallery = resolvePhotoGallery(event, productionExtra);
  const photoCredit = resolvePhotoCredit(event, productionExtra);
  const videoData = resolveVideoUrl(event, productionExtra);
  const videoEmbedUrl = videoData ? getVideoEmbedUrl(videoData.url) : undefined;
  const artistNote = resolveArtistNote(event, productionExtra);
  const credits = resolveCredits(event, productionExtra);
  const relatedEvents = relatedUpcomingEvents(event);
  const productionCycle = relatedProductionCycle(event.production);

  // Pre-filtered credit groups for cast/creative sections
  const castCredits = (credits ?? []).filter((c) => c.group === "cast");
  const creativeCredits = (credits ?? []).filter((c) => !c.group || c.group === "creative");

  // Images for editorial overlays — photo gallery is the primary source
  const editorialImg1 = photoGallery?.[0]?.src ?? null;

  const eventUrl = `${SHARE_URL}/events/${event.id}`;
  const gcalUrl = googleCalendarUrl(event);
  const outlookUrl = outlookCalendarUrl(event);
  const jsonLd = buildEventJsonLd(event);

  const heroVars = {
    backgroundImage: `url('${heroImage}')`,
    backgroundPosition: event.imageFocus ?? "center",
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
          {/* DAT badge — small logo stamp above breadcrumb */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/dat-logo7.svg"
            alt="Dramatic Adventure Theatre"
            className="evd-hero-logo"
            aria-hidden="true"
          />

          <nav className="evd-breadcrumb" aria-label="Breadcrumb">
            <Link href="/events">Events</Link>
            <span aria-hidden="true">/</span>
            <Link href={meta.href}>{meta.label}s</Link>
            <span aria-hidden="true">/</span>
            <span>{event.title}</span>
          </nav>

          <p className="evd-eyebrow">{getEventEyebrow(event)}</p>
          <h1 className="evd-title">{event.title}</h1>

          {event.subtitle ? (
            <p className="evd-subtitle">{event.subtitle}</p>
          ) : null}

          <p className="evd-standfirst">{event.description}</p>

          <div className="evd-hero-pills">
            <span className="evd-pill evd-pill--date">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              {formatDateRange(event.date, event.endDate)}
            </span>
            {event.time ? <span className="evd-pill">{event.time}</span> : null}
            <span className="evd-pill evd-pill--venue">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 13-8 13S4 16 4 10a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {event.venue}{event.city !== "Worldwide" ? ` · ${event.city}` : ""}
            </span>
          </div>
        </div>
      </div>

      {/* ── Ticket Dashboard ─────────────────────────────────────────────── */}
      <section className="evd-dashboard-band">
        <div className="evd-container">
          {/* ── Top: info grid + CTA + secondary actions ────────────── */}
          <div className="evd-dash-top">
            <div className="evd-dash-info-grid">
              <div className="evd-dash-info-card">
                <p className="evd-dash-info-label">Dates</p>
                <p className="evd-dash-info-value">{formatDateRange(event.date, event.endDate)}</p>
              </div>
              {event.time ? (
                <div className="evd-dash-info-card">
                  <p className="evd-dash-info-label">Time</p>
                  <p className="evd-dash-info-value">{event.time}</p>
                </div>
              ) : null}
              {event.doors ? (
                <div className="evd-dash-info-card">
                  <p className="evd-dash-info-label">Doors</p>
                  <p className="evd-dash-info-value">{event.doors}</p>
                </div>
              ) : null}
              <div className="evd-dash-info-card">
                <p className="evd-dash-info-label">Venue</p>
                <p className="evd-dash-info-value">{event.venue}</p>
                {event.address ? <p className="evd-dash-info-sub">{event.address}</p> : null}
              </div>
              <div className="evd-dash-info-card">
                <p className="evd-dash-info-label">Location</p>
                <p className="evd-dash-info-value">
                  {event.city}{event.country ? `, ${event.country}` : ""}
                </p>
              </div>
              {(event.ticketPrice || primaryAction) ? (
                <div className="evd-dash-info-card">
                  <p className="evd-dash-info-label">Tickets</p>
                  <p className="evd-dash-info-value">{event.ticketPrice ?? "Details below"}</p>
                </div>
              ) : null}
              {event.accessibility ? (
                <div className="evd-dash-info-card evd-dash-info-card--full">
                  <p className="evd-dash-info-label">Accessibility</p>
                  <p className="evd-dash-info-value evd-dash-info-value--sm">{event.accessibility}</p>
                </div>
              ) : null}
            </div>

            {primaryAction ? (
              <div className="evd-dash-cta-wrap">
                <a
                  href={primaryAction.href}
                  target={primaryAction.external ? "_blank" : undefined}
                  rel={primaryAction.external ? "noopener noreferrer" : undefined}
                  className={`evd-btn-cta ${primaryAction.tone === "invite" ? "evd-btn-cta--invite" : ""}`}
                >
                  {primaryAction.label}
                </a>
              </div>
            ) : null}

            <div className="evd-actions">
              {relatedProduction ? (
                <Link href={`/theatre/${event.production}`} className="evd-btn-ghost">
                  Full Production →
                </Link>
              ) : null}
              <EventShareButton
                url={eventUrl}
                title={`${event.title} — Dramatic Adventure Theatre`}
                description={event.description}
              />
              <div className="evd-cal-wrap">
                <button type="button" className="evd-btn-ghost evd-cal-btn" aria-haspopup="true">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    aria-hidden="true" style={{ flexShrink: 0 }}>
                    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  Add to Calendar
                </button>
                <div className="evd-cal-dropdown">
                  <a href={gcalUrl} target="_blank" rel="noopener noreferrer" className="evd-cal-option">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    Google Calendar
                  </a>
                  <a href={`/api/events/${event.id}/ics`} className="evd-cal-option">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 6v6l4 2"/></svg>
                    Apple Calendar
                  </a>
                  <a href={`/api/events/${event.id}/ics`} className="evd-cal-option">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    Outlook / Other
                  </a>
                </div>
              </div>
              {event.groupBookingEmail ? (
                <a
                  href={`mailto:${event.groupBookingEmail}?subject=${encodeURIComponent(`Group Booking: ${event.title}`)}&body=${encodeURIComponent(`Hi,\n\nI'm interested in booking a group for:\n\n${event.title}\n${formatDateRange(event.date, event.endDate)} · ${event.venue}, ${event.city}\n\nGroup size:\nPreferred date(s):\nAny questions:\n`)}`}
                  className="evd-btn-ghost evd-btn-group"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  Bring a Group →
                </a>
              ) : null}
            </div>
          </div>

          {/* ── Two-column content: LEFT description+video / RIGHT club+photo+quotes ── */}
          <div className={`evd-dashboard-grid${editorialImg1 || videoEmbedUrl || event.pressQuotes?.length || linkedDramaClubs.length > 0 ? "" : " evd-dashboard-grid--single"}`}>

            {/* LEFT: description text (first para bold, Rock Salt subtitle) + video */}
            <div className="evd-dashboard-left">
              {paragraphs.length > 0 ? (
                <div className="evd-dash-description">
                  {event.subtitle ? (
                    <p className="evd-dash-tagline">{event.subtitle}</p>
                  ) : null}
                  {paragraphs.map((p, i) => (
                    <p key={i} className={`evd-body-paragraph${i === 0 ? " evd-body-paragraph--lead" : ""}`}>{p}</p>
                  ))}
                </div>
              ) : null}

              {videoEmbedUrl ? (
                <div className="evd-dash-video">
                  <p className="evd-video-eyebrow">{videoData?.title ?? "Watch"}</p>
                  <div className="evd-video-frame-wrap">
                    <iframe
                      src={videoEmbedUrl}
                      title={videoData?.title ?? `${event.title} video`}
                      className="evd-video-frame"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              ) : null}
            </div>

            {/* RIGHT: drama club badge + snapshot photo with quote + press quotes */}
            {(linkedDramaClubs.length > 0 || editorialImg1 || event.pressQuotes?.length) ? (
              <div className="evd-dashboard-right">
                {/* Drama club "in support of" */}
                {linkedDramaClubs.length > 0 ? (
                  <div className="evd-dash-club-support">
                    <p className="evd-dash-club-support-label">
                      {linkedDramaClubs.length > 1 ? "Featuring DAT Drama Clubs" : "In Support of a DAT Drama Club"}
                    </p>
                    <div className="evd-dash-club-support-links">
                      {linkedDramaClubs.map((club) => (
                        <Link key={club.slug} href={`/drama-club/${club.slug}`} className="evd-dash-club-support-card">
                          <DramaClubBadge
                            name={club.name}
                            location={club.location}
                            size={48}
                            wrappedByParentLink
                          />
                          <div className="evd-dash-club-support-copy">
                            <p className="evd-dash-club-support-name">{club.name}</p>
                            {club.location ? <p className="evd-dash-club-support-loc">{club.location}</p> : null}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Production snapshot with quote overlay */}
                {editorialImg1 ? (
                  <div
                    className="evd-dash-snapshot"
                    style={{ backgroundImage: `url('${editorialImg1}')` }}
                  >
                    <div className="evd-dash-snapshot-overlay" aria-hidden="true" />
                    {artistNote ? (
                      <blockquote className="evd-dash-quote">
                        <p className="evd-dash-quote-text">&ldquo;{artistNote.note}&rdquo;</p>
                        {artistNote.by ? (
                          <footer className="evd-dash-quote-attr">— {artistNote.by}</footer>
                        ) : null}
                      </blockquote>
                    ) : null}
                  </div>
                ) : null}

                {/* Press quotes — drama club style */}
                {event.pressQuotes?.length ? (
                  <div className="evd-dash-press-quotes">
                    {event.pressQuotes.map((q, i) => (
                      <blockquote key={i} className="evd-dash-press-quote">
                        <p className="evd-dash-press-quote-text">&ldquo;{q.text}&rdquo;</p>
                        <footer className="evd-dash-press-quote-attr">— {q.attribution}</footer>
                      </blockquote>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* ── Photo Gallery (with lightbox) ───────────────────────────────── */}
      {photoGallery?.length ? (
        <section className="evd-gallery-band">
          <div className="evd-container">
            <EventGallery images={photoGallery} photoCredit={photoCredit} />
          </div>
        </section>
      ) : null}

      {/* ── Cast — horizontal scroll with headshots ─────────────────────── */}
      {castCredits.length > 0 ? (
        <section className="evd-cast-band">
          <div className="evd-container">
            <div className="evd-cast-head">
              <span className="evd-cast-head-rule" aria-hidden="true" />
              <p className="evd-cast-head-label">Cast</p>
              <span className="evd-cast-head-rule" aria-hidden="true" />
            </div>
            <div className="evd-cast-scroll" role="list" aria-label="Cast members">
              {castCredits.map((c, i) => (
                <div key={i} className="evd-cast-card" role="listitem">
                  <div className="evd-cast-photo-wrap">
                    {c.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.photo}
                        alt={c.name}
                        className="evd-cast-photo"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="evd-cast-photo-placeholder" aria-hidden="true">
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      </div>
                    )}
                  </div>
                  <p className="evd-cast-role">{c.role}</p>
                  {c.href ? (
                    <Link href={c.href} className="evd-cast-name evd-cast-link">{c.name}</Link>
                  ) : (
                    <p className="evd-cast-name">{c.name}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ── Creative Team ────────────────────────────────────────────────── */}
      {creativeCredits.length > 0 ? (
        <section className="evd-creative-band">
          <div className="evd-container">
            <div className="evd-creative-head">
              <h3 className="evd-creative-label">
                {castCredits.length > 0 ? "Creative Team" : "The Company"}
              </h3>
              <span className="evd-creative-rule" aria-hidden="true" />
            </div>
            <div className="evd-creative-grid">
              {creativeCredits.map((c, i) => (
                <div key={i} className="evd-credit-item">
                  <p className="evd-credit-role">{c.role}</p>
                  {c.href ? (
                    <Link href={c.href} className="evd-credit-name evd-credit-link">{c.name}</Link>
                  ) : (
                    <p className="evd-credit-name">{c.name}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Production archive link — simple, unobtrusive */}
      {relatedProduction ? (
        <div className="evd-production-link-band">
          <div className="evd-container">
            <p className="evd-production-link-text">
              <span className="evd-production-link-eyebrow">Archive</span>
              {relatedProduction.title}
              {relatedProduction.location ? ` · ${relatedProduction.location}` : ""}
              {relatedProduction.festival ? ` · ${relatedProduction.festival}` : ""}
              <Link href={`/theatre/${event.production}`} className="evd-production-link-cta">
                Full Production →
              </Link>
            </p>
          </div>
        </div>
      ) : null}

      {/* ── Related Productions Cycle ────────────────────────────────── */}
      {productionCycle.length > 0 ? (
        <section className="evd-cycle-band">
          <div className="evd-container">
            <div className="evd-section-head">
              <p className="evd-section-eyebrow">Production History</p>
              <h2 className="evd-section-title">The Full Cycle</h2>
            </div>
            <div className="evd-cycle-scroll" role="list" aria-label="Production history">
              {productionCycle.map((p) => (
                <Link key={p.slug} href={`/theatre/${p.slug}`} className="evd-cycle-card" role="listitem">
                  <div
                    className="evd-cycle-img"
                    style={{
                      backgroundImage: p.posterUrl
                        ? `url('${p.posterUrl}')`
                        : undefined,
                    }}
                  />
                  <div className="evd-cycle-body">
                    <p className="evd-cycle-title">{p.title}</p>
                    {(p.location || p.festival) ? (
                      <p className="evd-cycle-meta">
                        {p.location}{p.festival ? ` · ${p.festival}` : ""}
                      </p>
                    ) : null}
                    <span className="evd-cycle-link">View Archive →</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ── Related Upcoming Events ────────────────────────────────────── */}
      {relatedEvents.length > 0 ? (
        <section className="evd-related-events-band">
          <div className="evd-container">
            <div className="evd-section-head">
              <p className="evd-section-eyebrow">More {meta.label}s</p>
              <h2 className="evd-section-title">Also Coming Up</h2>
            </div>
            <div className="evd-rel-events-grid">
              {relatedEvents.map((re) => (
                <Link key={re.id} href={`/events/${re.id}`} className="evd-rel-card">
                  {getEventImage(re) ? (
                    <div
                      className="evd-rel-card-img"
                      style={{
                        backgroundImage: `url('${getEventImage(re)}')`,
                        backgroundPosition: re.imageFocus ?? "center",
                      }}
                    />
                  ) : (
                    <div className="evd-rel-card-img evd-rel-card-img--blank" />
                  )}
                  <div className="evd-rel-card-body">
                    <p className="evd-rel-card-date">{formatDateRange(re.date, re.endDate)}</p>
                    <p className="evd-rel-card-title">{re.title}</p>
                    <p className="evd-rel-card-venue">{re.venue} · {re.city}</p>
                  </div>
                </Link>
              ))}
            </div>
            <div className="evd-rel-events-footer">
              <Link href={meta.href} className="evd-btn-ghost">
                All {meta.label}s →
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {/* ── Newsletter ─────────────────────────────────────────────────── */}
      <section className="evd-newsletter-band">
        <div className="evd-container evd-newsletter-inner">
          <div className="evd-newsletter-copy">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/dat-logo7.svg"
              alt=""
              className="evd-newsletter-logo"
              aria-hidden="true"
            />
            <p className="evd-newsletter-eyebrow">Stay Connected</p>
            <h2 className="evd-newsletter-title">Never miss a show.</h2>
            <p className="evd-newsletter-body">
              Events are announced first to our community list. Be the first
              to know when new shows, festivals, and community nights land.
            </p>
          </div>
          <div className="evd-newsletter-form">
            <MailingListForm source="event-detail" />
          </div>
        </div>
      </section>

      {/* ── Bottom nav ─────────────────────────────────────────────────── */}
      <section className="evd-bottom-band">
        <div className="evd-container evd-bottom-inner">
          <p className="evd-bottom-label">Explore More</p>
          <div className="evd-bottom-links">
            <Link href="/events/performances" className="evd-bottom-link evd-bottom-link--pink">
              Upcoming Performances →
            </Link>
            <Link href="/events/fundraisers" className="evd-bottom-link evd-bottom-link--gold">
              Fundraisers &amp; Community Nights →
            </Link>
            <Link href="/events/festivals" className="evd-bottom-link evd-bottom-link--teal">
              Festivals &amp; Showcases →
            </Link>
            <Link href="/theatre" className="evd-bottom-link evd-bottom-link--archive">
              Theatre Archive →
            </Link>
            <Link href="/events" className="evd-bottom-link evd-bottom-link--muted">
              ← All Events
            </Link>
          </div>
        </div>
      </section>

      {/* ── Schema.org Event structured data ──────────────────────────── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <style>{`
        /* ═══════════════════════════════════════════════════════════════════
           EVENT DETAIL PAGE — Dramatic Adventure Theatre
           Inline <style> scoped to this server component.

           CSS custom properties (--evd-accent, --evd-surface, etc.) are
           injected via heroVars on the root .evd-hero element and cascade
           to all children — this is why we stay inline rather than using
           a CSS module.

           Section index:
             0.  Global / color-scheme
             1.  Layout: container
             2.  Hero
             3.  Ticket Dashboard (info, CTA, two-col: description, video,
                   drama club, snapshot, press quotes)
             4.  Photo Gallery (EventGallery component styles)
             5.  Cast
             6.  Creative Team
             7.  Production Archive Link
             8.  Production Cycle
             9.  Related Upcoming Events (section-head shared)
            10.  Newsletter + Mailing List Form
            11.  Bottom Navigation
            12.  Dropdowns: Share & Calendar (EventShareButton component)
            13.  Shared scrollbar utility
            14.  Responsive overrides
           ═══════════════════════════════════════════════════════════════════ */

        /* ── 0. Global ─────────────────────────────────────────────────── */
        :root {
          color-scheme: dark;
        }

        /* ── 1. Layout: container ──────────────────────────────────────── */
        .evd-container {
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 clamp(1.25rem, 5vw, 3rem);
        }

        /* ── 2. Hero ───────────────────────────────────────────────────── */
        .evd-hero {
          position: relative;
          min-height: 92vh;
          background-size: cover;
          background-position: center;
          display: flex;
          align-items: flex-end;
          overflow: visible;
        }

        /* Subtle film grain texture */
        .evd-hero::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          background-repeat: repeat;
          background-size: 200px 200px;
          pointer-events: none;
          z-index: 1;
          mix-blend-mode: overlay;
          opacity: 0.35;
        }

        .evd-hero-overlay {
          position: absolute;
          inset: 0;
          background: var(--evd-hero-overlay);
          z-index: 1;
        }

        .evd-hero-glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 80% 60% at 10% 92%, var(--evd-glow) 0%, transparent 58%);
          z-index: 1;
        }

        /* Bleed fade from hero into dashboard */
        .evd-hero::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          bottom: -22px;
          height: 42%;
          background: linear-gradient(to bottom, transparent 0%, var(--evd-surface) 100%);
          z-index: 3;
          pointer-events: none;
        }

        .evd-hero-content {
          position: relative;
          z-index: 4;
          padding: clamp(6rem, 12vw, 10rem) clamp(1.5rem, 6vw, 5rem) clamp(3.5rem, 7vw, 6rem);
          max-width: 820px;
        }

        .evd-hero-logo {
          display: block;
          width: 52px;
          height: 52px;
          margin-bottom: 1.5rem;
          opacity: 0.78;
          filter: brightness(0) invert(1);
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
        .evd-breadcrumb a:hover { color: var(--evd-accent); }

        /* Shared eyebrow/label utility — DM Sans caps tracking */
        .evd-eyebrow,
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
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-family: "DM Sans", sans-serif;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.82);
          border: 1px solid rgba(255,255,255,0.16);
          background: rgba(0,0,0,0.28);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-radius: 999px;
          padding: 0.48rem 0.92rem;
        }
        .evd-pill--date {
          border-color: var(--evd-accent);
          color: #fff;
        }

        /* ── 3. Ticket Dashboard ───────────────────────────────────────── */
        .evd-dashboard-band {
          background: var(--evd-surface);
          padding: clamp(2.5rem, 5vw, 4rem) 0 clamp(3rem, 6vw, 5rem);
          position: relative;
          z-index: 5;
          margin-top: -80px;
        }

        /* Top row: info grid, CTA, secondary actions */
        .evd-dash-top {
          margin-bottom: clamp(2rem, 4vw, 3rem);
          padding-bottom: clamp(1.5rem, 3vw, 2rem);
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }

        .evd-dash-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 0.75rem;
          margin-bottom: 1.1rem;
        }
        .evd-dash-info-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
          padding: 0.85rem 1rem;
        }
        .evd-dash-info-card--full {
          grid-column: 1 / -1;
        }
        .evd-dash-info-label {
          font-family: "DM Sans", sans-serif;
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.35);
          margin: 0 0 0.4rem;
        }
        .evd-dash-info-value {
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.95rem;
          font-weight: 700;
          color: #fff;
          line-height: 1.35;
          margin: 0;
        }
        .evd-dash-info-value--sm {
          font-size: 0.88rem;
          font-weight: 500;
        }
        .evd-dash-info-sub {
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.82rem;
          color: rgba(255,255,255,0.46);
          margin: 0.35rem 0 0;
        }

        .evd-dash-cta-wrap {
          margin-bottom: 0.9rem;
        }

        /* Primary CTA — uses category accent color (not hardcoded pink) */
        .evd-btn-cta {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          padding: 1.1rem 1.5rem;
          border-radius: 12px;
          font-family: "DM Sans", sans-serif;
          font-size: 1rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          text-decoration: none;
          background: var(--evd-accent);
          color: var(--evd-button-text);
          border: none;
          transition: transform 0.18s, opacity 0.18s;
        }
        .evd-btn-cta:hover {
          transform: translateY(-2px);
          opacity: 0.92;
        }
        /* Invite-only variant (community showcases) */
        .evd-btn-cta--invite {
          background: #2FA873;
          color: #fff;
        }

        /* Secondary actions row */
        .evd-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.65rem;
          margin-top: 0.9rem;
          padding-top: 0.9rem;
          border-top: 1px solid rgba(255,255,255,0.08);
        }

        /* Ghost button base — shared by all secondary actions */
        .evd-btn,
        .evd-btn-ghost {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.45rem;
          min-height: 40px;
          padding: 0.65rem 1.05rem;
          border-radius: 9px;
          font-family: "DM Sans", sans-serif;
          font-size: 0.78rem;
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
        .evd-btn-ghost {
          color: rgba(255,255,255,0.72);
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(255,255,255,0.14);
          cursor: pointer;
        }

        /* Two-column body grid */
        .evd-dashboard-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: clamp(1.75rem, 4vw, 3.5rem);
          align-items: start;
        }
        .evd-dashboard-grid--single {
          grid-template-columns: 1fr;
        }

        /* Left column: description text */
        .evd-dashboard-left {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .evd-dash-description {
          margin-bottom: clamp(1.5rem, 3vw, 2.5rem);
        }
        .evd-dash-tagline {
          font-family: var(--font-rock-salt), cursive;
          font-size: clamp(0.9rem, 1.8vw, 1.15rem);
          line-height: 1.6;
          color: var(--evd-accent);
          margin: 0 0 1.25rem;
          opacity: 0.85;
        }

        /* Event description paragraphs */
        .evd-body-paragraph {
          font-family: "Space Grotesk", sans-serif;
          font-size: clamp(1rem, 1.4vw, 1.12rem);
          line-height: 1.85;
          color: rgba(255,255,255,0.85);
          margin: 0 0 1.25rem;
        }
        .evd-body-paragraph:last-child { margin-bottom: 0; }
        /* First paragraph is bold — acts as a standfirst */
        .evd-body-paragraph--lead {
          font-size: clamp(1.05rem, 1.6vw, 1.2rem);
          font-weight: 700;
          color: rgba(255,255,255,0.95);
          line-height: 1.65;
        }

        /* Video embed inside the dashboard left column */
        .evd-dash-video {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .evd-video-eyebrow {
          font-family: "DM Sans", sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: var(--evd-accent);
          margin: 0;
          align-self: flex-start;
        }
        .evd-video-frame-wrap {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 9;
          border-radius: 14px;
          overflow: hidden;
          background: #000;
          box-shadow: 0 24px 60px rgba(0,0,0,0.5);
        }
        .evd-video-frame {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          border: none;
        }

        /* Right column */
        .evd-dashboard-right {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        /* Drama club "in support of" */
        .evd-dash-club-support {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          padding: 0.9rem 1rem;
        }
        .evd-dash-club-support-label {
          font-family: "DM Sans", sans-serif;
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--evd-accent);
          margin: 0 0 0.75rem;
        }
        .evd-dash-club-support-links {
          display: flex;
          flex-direction: column;
          gap: 0.55rem;
        }
        .evd-dash-club-support-card {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-decoration: none;
          transition: opacity 0.18s;
        }
        .evd-dash-club-support-card:hover { opacity: 0.8; }
        .evd-dash-club-support-copy { min-width: 0; }
        .evd-dash-club-support-name {
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.95rem;
          font-weight: 700;
          color: #fff;
          margin: 0 0 0.1rem;
          line-height: 1.2;
        }
        .evd-dash-club-support-loc {
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.82rem;
          color: rgba(255,255,255,0.48);
          margin: 0;
        }

        /* Production snapshot — image panel with gradient + quote */
        .evd-dash-snapshot {
          position: relative;
          border-radius: 16px;
          overflow: hidden;
          background-size: cover;
          background-position: center;
          aspect-ratio: 4 / 3;
        }
        .evd-dash-snapshot-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to top,
            rgba(0,0,0,0.88) 0%,
            rgba(0,0,0,0.42) 42%,
            rgba(0,0,0,0.10) 100%
          );
        }
        .evd-dash-quote {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: clamp(1rem, 2.5vw, 1.75rem);
          margin: 0;
          border: none;
          z-index: 1;
        }
        .evd-dash-quote-text {
          font-family: "Space Grotesk", sans-serif;
          font-size: clamp(0.88rem, 1.5vw, 1.05rem);
          font-weight: 500;
          font-style: italic;
          line-height: 1.6;
          color: rgba(255,255,255,0.9);
          margin: 0 0 0.55rem;
          text-shadow: 0 1px 8px rgba(0,0,0,0.5);
        }
        .evd-dash-quote-attr {
          display: block;
          font-family: "DM Sans", sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--evd-accent);
        }

        /* Press quotes in right column */
        .evd-dash-press-quotes {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .evd-dash-press-quote {
          margin: 0;
          padding: 1rem 1.1rem 1rem 1.25rem;
          border-left: 3px solid var(--evd-accent);
          background: rgba(255,255,255,0.03);
          border-radius: 0 10px 10px 0;
        }
        .evd-dash-press-quote-text {
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.95rem;
          font-weight: 500;
          font-style: italic;
          color: rgba(255,255,255,0.88);
          line-height: 1.65;
          margin: 0 0 0.5rem;
        }
        .evd-dash-press-quote-attr {
          font-family: "DM Sans", sans-serif;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.32);
        }

        /* ── 4. Photo Gallery ──────────────────────────────────────────── */
        /* Band wrapper */
        .evd-gallery-band {
          background: var(--evd-surface);
          padding: clamp(2.5rem, 5vw, 4rem) 0;
          border-top: 1px solid rgba(255,255,255,0.05);
          overflow: hidden;
        }

        /* EventGallery component styles */
        .evd-gallery-head {
          display: flex;
          align-items: baseline;
          gap: 1.5rem;
          flex-wrap: wrap;
          margin-bottom: 1.5rem;
        }
        .evd-gallery-eyebrow {
          font-family: "DM Sans", sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: var(--evd-accent);
          margin: 0;
        }
        .evd-gallery-credit {
          font-family: "DM Sans", sans-serif;
          font-size: 0.75rem;
          color: rgba(255,255,255,0.28);
          margin: 0;
        }

        /* Featured (first) gallery image — large editorial 16:9 */
        .evd-gallery-featured {
          display: block;
          width: 100%;
          aspect-ratio: 16 / 9;
          border-radius: 16px;
          overflow: hidden;
          background: none;
          border: none;
          padding: 0;
          cursor: zoom-in;
          position: relative;
          margin: 0 0 0.75rem;
        }
        .evd-gallery-featured-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          border-radius: 16px;
          transition: transform 0.4s ease;
        }
        .evd-gallery-featured:hover .evd-gallery-featured-img {
          transform: scale(1.025);
        }
        /* "View all photos" hint — fades in on hover */
        .evd-gallery-featured-hint {
          position: absolute;
          bottom: 1rem;
          right: 1.25rem;
          font-family: "DM Sans", sans-serif;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.9);
          background: rgba(0,0,0,0.52);
          border-radius: 999px;
          padding: 0.35rem 0.9rem;
          opacity: 0;
          transition: opacity 0.22s;
          pointer-events: none;
        }
        .evd-gallery-featured:hover .evd-gallery-featured-hint { opacity: 1; }
        .evd-gallery-featured::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 16px;
          background: rgba(0,0,0,0);
          transition: background 0.22s;
        }
        .evd-gallery-featured:hover::after { background: rgba(0,0,0,0.14); }

        /* Scrollable thumbnail strip */
        .evd-gallery-scroll {
          display: flex;
          gap: 0.65rem;
          overflow-x: auto;
          padding: 0 0 1rem;
        }
        .evd-gallery-item--btn {
          flex-shrink: 0;
          height: clamp(160px, 22vw, 240px);
          border-radius: 10px;
          overflow: hidden;
          background: none;
          border: none;
          padding: 0;
          cursor: zoom-in;
          position: relative;
        }
        .evd-gallery-item--btn::after {
          content: "";
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0);
          border-radius: 10px;
          transition: background 0.18s;
        }
        .evd-gallery-item--btn:hover::after { background: rgba(0,0,0,0.18); }
        .evd-gallery-img {
          height: 100%;
          width: auto;
          max-width: none;
          display: block;
          object-fit: cover;
          border-radius: 10px;
          transition: transform 0.3s ease;
        }
        .evd-gallery-item--btn:hover .evd-gallery-img { transform: scale(1.03); }

        /* ── 5. Cast ───────────────────────────────────────────────────── */
        .evd-cast-band {
          background: var(--evd-surface);
          padding: clamp(2.5rem, 5vw, 4rem) 0;
          border-top: 1px solid rgba(255,255,255,0.06);
          overflow: hidden;
        }

        /* "Cast" header: label flanked by fading rules */
        .evd-cast-head {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          margin-bottom: 1.75rem;
        }
        .evd-cast-head-rule {
          flex: 1;
          height: 1px;
          background: linear-gradient(to right, transparent, rgba(255,255,255,0.10) 40%, rgba(255,255,255,0.10) 60%, transparent);
        }
        .evd-cast-head-label {
          font-family: "DM Sans", sans-serif;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.30em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.35);
          margin: 0;
          white-space: nowrap;
        }

        /* Horizontal portrait card scroll */
        .evd-cast-scroll {
          display: flex;
          gap: 1.25rem;
          overflow-x: auto;
          padding: 0 0 1.25rem;
        }
        .evd-cast-card {
          flex-shrink: 0;
          width: 175px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 0.55rem;
          cursor: default;
        }
        .evd-cast-photo-wrap {
          width: 175px;
          aspect-ratio: 4 / 5;
          border-radius: 12px;
          overflow: hidden;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.08);
          flex-shrink: 0;
          box-shadow: 4px 8px 20px rgba(0,0,0,0.35);
          transition: transform 0.28s ease, box-shadow 0.28s ease;
        }
        .evd-cast-card:hover .evd-cast-photo-wrap {
          transform: translateY(-6px) rotate(-1deg) scale(1.03);
          box-shadow: 0 18px 36px rgba(0,0,0,0.45);
        }
        .evd-cast-photo {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .evd-cast-photo-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255,255,255,0.2);
          background: linear-gradient(135deg, var(--evd-surface-2), var(--evd-surface));
        }
        .evd-cast-role {
          font-family: "DM Sans", sans-serif;
          font-size: 0.63rem;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.32);
          margin: 0;
        }
        .evd-cast-name {
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.95rem;
          font-weight: 700;
          color: #fff;
          margin: 0;
          line-height: 1.25;
        }
        /* Alumni links — DAT purple base, DAT pink on hover */
        .evd-cast-link,
        .evd-cast-link:link,
        .evd-cast-link:visited {
          text-decoration: none;
          color: #8b10d9;
          transition: color 160ms ease;
        }
        .evd-cast-link:hover,
        .evd-cast-link:focus-visible {
          color: #F23359;
        }

        /* ── 6. Creative Team ──────────────────────────────────────────── */
        .evd-creative-band {
          background: var(--evd-surface);
          padding: clamp(2rem, 4vw, 3.5rem) 0;
          border-top: 1px solid rgba(255,255,255,0.05);
        }
        .evd-creative-head {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.25rem;
        }
        .evd-creative-label {
          font-family: "DM Sans", sans-serif;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.30em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.35);
          margin: 0;
          white-space: nowrap;
        }
        .evd-creative-rule {
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.07);
        }
        .evd-creative-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 0;
        }

        /* Shared credit item (used by both Creative Team and cast grid) */
        .evd-credit-item {
          padding: 1rem 1.25rem 1rem 0;
          border-bottom: 1px solid rgba(255,255,255,0.055);
        }
        .evd-credit-role {
          font-family: "DM Sans", sans-serif;
          font-size: 0.63rem;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.28);
          margin: 0 0 0.3rem;
        }
        .evd-credit-name {
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.98rem;
          font-weight: 700;
          color: #fff;
          margin: 0;
          line-height: 1.25;
        }
        /* Alumni credit links — DAT purple base, DAT pink on hover */
        .evd-credit-link,
        .evd-credit-link:link,
        .evd-credit-link:visited {
          text-decoration: none;
          color: #8b10d9;
          transition: color 160ms ease, letter-spacing 160ms ease;
          display: inline-block;
        }
        .evd-credit-link:hover,
        .evd-credit-link:focus-visible {
          color: #F23359;
          letter-spacing: 0.04em;
        }

        /* ── 7. Production Archive Link ────────────────────────────────── */
        .evd-production-link-band {
          background: var(--evd-surface);
          padding: clamp(1rem, 2vw, 1.5rem) 0;
          border-top: 1px solid rgba(255,255,255,0.05);
        }
        .evd-production-link-text {
          font-family: "DM Sans", sans-serif;
          font-size: 0.78rem;
          font-weight: 600;
          color: rgba(255,255,255,0.38);
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.65rem;
          margin: 0;
        }
        .evd-production-link-eyebrow {
          font-family: "DM Sans", sans-serif;
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.22);
          background: rgba(255,255,255,0.06);
          border-radius: 999px;
          padding: 0.2rem 0.65rem;
        }
        .evd-production-link-cta {
          font-family: "DM Sans", sans-serif;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--evd-accent);
          text-decoration: none;
          transition: opacity 0.18s;
          margin-left: auto;
        }
        .evd-production-link-cta:hover { opacity: 0.75; }

        /* ── 8. Production Cycle ───────────────────────────────────────── */
        .evd-cycle-band {
          background: #111118;
          padding: clamp(2.5rem, 5vw, 4rem) 0;
          border-top: 1px solid rgba(255,255,255,0.06);
        }

        /* Horizontal scroll of production cards */
        .evd-cycle-scroll {
          display: flex;
          gap: 1rem;
          overflow-x: auto;
          padding: 0 0 1rem;
          margin-top: 1.5rem;
        }
        .evd-cycle-scroll .evd-cycle-card {
          flex-shrink: 0;
          width: 240px;
        }
        .evd-cycle-card {
          text-decoration: none;
          border-radius: 12px;
          overflow: hidden;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          display: flex;
          flex-direction: column;
          transition: transform 0.18s, border-color 0.18s, box-shadow 0.18s;
        }
        .evd-cycle-card:hover {
          transform: translateY(-3px);
          border-color: rgba(255,255,255,0.16);
          box-shadow: 0 12px 32px rgba(0,0,0,0.3);
        }
        .evd-cycle-card:focus-visible {
          outline: 2px solid var(--evd-accent);
          outline-offset: 3px;
        }
        .evd-cycle-img {
          height: 150px;
          background-size: cover;
          background-position: center;
          background-color: rgba(255,255,255,0.05);
        }
        .evd-cycle-body {
          padding: 1rem 1.1rem 1.1rem;
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          flex: 1;
        }
        .evd-cycle-title {
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.95rem;
          font-weight: 700;
          color: #fff;
          line-height: 1.25;
          margin: 0;
        }
        .evd-cycle-meta {
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.82rem;
          color: rgba(255,255,255,0.42);
          margin: 0;
          line-height: 1.45;
        }
        .evd-cycle-link {
          font-family: "DM Sans", sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--evd-accent);
          margin-top: 0.35rem;
        }

        /* ── 9. Related Upcoming Events ────────────────────────────────── */
        /* Shared section header (used by cycle + related events) */
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

        .evd-related-events-band {
          background: #0c0c14;
          padding: clamp(3rem, 6vw, 5rem) 0;
          border-top: 3px solid var(--evd-accent);
        }
        .evd-rel-events-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 1rem;
          margin-top: 1.5rem;
        }
        .evd-rel-card {
          text-decoration: none;
          border-radius: 14px;
          overflow: hidden;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          transition: transform 0.18s, border-color 0.18s, box-shadow 0.18s;
          display: flex;
          flex-direction: column;
        }
        .evd-rel-card:hover {
          transform: translateY(-3px);
          border-color: var(--evd-accent);
          box-shadow:
            0 12px 32px rgba(0,0,0,0.4),
            0 0 0 1px var(--evd-accent),
            0 0 28px -4px var(--evd-accent);
        }
        .evd-rel-card:focus-visible {
          outline: 2px solid var(--evd-accent);
          outline-offset: 3px;
        }
        .evd-rel-card-img {
          height: 160px;
          background-size: cover;
          background-position: center;
          background-color: var(--evd-surface);
        }
        .evd-rel-card-img--blank {
          background: linear-gradient(135deg, var(--evd-surface-2) 0%, var(--evd-surface) 100%);
        }
        .evd-rel-card-body {
          padding: 1rem 1.1rem 1.1rem;
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          flex: 1;
        }
        .evd-rel-card-date {
          font-family: "DM Sans", sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--evd-accent);
          margin: 0;
        }
        .evd-rel-card-title {
          font-family: "Space Grotesk", sans-serif;
          font-size: 1rem;
          font-weight: 700;
          color: #fff;
          line-height: 1.25;
          margin: 0;
        }
        .evd-rel-card-venue {
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.82rem;
          color: rgba(255,255,255,0.42);
          margin: 0;
        }
        .evd-rel-events-footer {
          margin-top: 1.5rem;
          display: flex;
          justify-content: flex-end;
        }

        /* ── 10. Newsletter ────────────────────────────────────────────── */
        .evd-newsletter-band {
          background: #145c37;
          background-image:
            radial-gradient(ellipse 80% 80% at 0% 100%, rgba(30,120,70,0.55) 0%, transparent 70%),
            radial-gradient(ellipse 60% 60% at 100% 0%, rgba(30,120,70,0.35) 0%, transparent 70%);
          padding: clamp(4rem, 8vw, 7rem) 0;
          border-top: 1px solid rgba(255,255,255,0.05);
          position: relative;
          overflow: hidden;
        }
        .evd-newsletter-band::before {
          content: "";
          position: absolute;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(20,92,55,0.3) 0%, transparent 70%);
          top: -200px;
          left: -200px;
          pointer-events: none;
        }
        .evd-newsletter-inner {
          display: grid;
          grid-template-columns: 1fr 1.3fr;
          gap: clamp(2rem, 5vw, 4.5rem);
          align-items: center;
          position: relative;
          z-index: 1;
        }
        .evd-newsletter-logo {
          display: block;
          width: 58px;
          height: 58px;
          margin-bottom: 1.5rem;
          opacity: 0.85;
        }
        .evd-newsletter-eyebrow {
          font-family: "DM Sans", sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.32em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.38);
          margin: 0 0 0.65rem;
        }
        .evd-newsletter-title {
          font-family: "Anton", sans-serif;
          font-size: clamp(2.25rem, 5vw, 3.75rem);
          line-height: 0.92;
          color: #fff;
          margin: 0 0 0.85rem;
        }
        .evd-newsletter-body {
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.95rem;
          color: rgba(255,255,255,0.5);
          line-height: 1.65;
          margin: 0;
          max-width: 420px;
        }

        /* Mailing list form (rendered inside MailingListForm component) */
        .evhub-ml-form { display: flex; flex-direction: column; gap: 0.75rem; align-items: flex-start; }
        .evhub-ml-inputs-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          align-items: stretch;
        }
        .evhub-ml-input {
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.9rem;
          background: rgba(255,255,255,0.08);
          border: 1.5px solid rgba(255,255,255,0.18);
          color: #fff;
          padding: 0.7rem 1rem;
          border-radius: 8px;
          flex: 1 1 160px;
          min-width: 0;
          outline: none;
          transition: border-color 0.18s;
        }
        .evhub-ml-input::placeholder { color: rgba(255,255,255,0.35); }
        .evhub-ml-input:focus { border-color: rgba(255,204,0,0.6); }
        .evhub-ml-input--email { flex: 2 1 200px; }
        .evhub-ml-btn {
          font-family: "DM Sans", sans-serif;
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          background: #D9A919;
          color: #241123;
          border: none;
          padding: 0.7rem 1.4rem;
          border-radius: 8px;
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
          transition: opacity 0.18s, transform 0.15s;
        }
        .evhub-ml-btn:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
        .evhub-ml-btn:disabled { opacity: 0.55; cursor: default; }
        .evhub-ml-fine {
          font-family: "DM Sans", sans-serif;
          font-size: 0.72rem;
          color: rgba(255,255,255,0.28);
          margin: 0;
          line-height: 1.5;
        }
        .evhub-ml-error {
          font-family: "DM Sans", sans-serif;
          font-size: 0.82rem;
          color: #F23359;
          margin: 0;
        }
        .evhub-ml-error a { color: #F23359; text-decoration: underline; }
        .evhub-ml-success {
          display: flex;
          align-items: flex-start;
          gap: 0.85rem;
          padding: 1rem 1.25rem;
          background: rgba(255,255,255,0.07);
          border-radius: 12px;
        }
        .evhub-ml-check {
          font-size: 1.1rem;
          color: #D9A919;
          flex-shrink: 0;
          margin-top: 0.1rem;
        }
        .evhub-ml-success-title {
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.98rem;
          font-weight: 700;
          color: #fff;
          margin: 0 0 0.2rem;
        }
        .evhub-ml-success-sub {
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.87rem;
          color: rgba(255,255,255,0.5);
          margin: 0;
        }

        /* ── 11. Bottom Navigation ─────────────────────────────────────── */
        .evd-bottom-band {
          position: relative;
          background: #0e3d25;
          padding: clamp(2.75rem, 5vw, 4.5rem) 0;
          border-top: 1px solid rgba(255,255,255,0.06);
          overflow: hidden;
        }
        .evd-bottom-band::before {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 60% 100% at 50% 100%, rgba(30,120,70,0.15) 0%, transparent 70%);
          pointer-events: none;
        }
        .evd-bottom-inner {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .evd-bottom-label {
          color: rgba(255,255,255,0.28);
          margin: 0;
        }
        .evd-bottom-links {
          display: flex;
          flex-wrap: wrap;
          gap: 0.65rem;
          align-items: center;
        }
        .evd-bottom-link {
          font-family: "DM Sans", sans-serif;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          text-decoration: none;
          padding: 0.72rem 1.4rem;
          border-radius: 9px;
          transition: opacity 0.2s, transform 0.18s, box-shadow 0.2s;
        }
        .evd-bottom-link:hover {
          opacity: 0.9;
          transform: translateY(-2px);
        }
        .evd-bottom-link--pink {
          background: #F23359;
          color: #fff;
          box-shadow: 0 4px 20px rgba(242,51,89,0.3);
        }
        .evd-bottom-link--pink:hover { box-shadow: 0 8px 28px rgba(242,51,89,0.45); }
        .evd-bottom-link--gold {
          background: #D9A919;
          color: #241123;
          box-shadow: 0 4px 20px rgba(217,169,25,0.25);
        }
        .evd-bottom-link--teal {
          background: #2493A9;
          color: #fff;
          box-shadow: 0 4px 20px rgba(36,147,169,0.25);
        }
        .evd-bottom-link--muted {
          color: rgba(255,255,255,0.42);
          border: 1.5px solid rgba(255,255,255,0.12);
        }
        .evd-bottom-link--archive {
          background: rgba(108,0,175,0.18);
          color: rgba(255,255,255,0.7);
          border: 1px solid rgba(108,0,175,0.35);
        }
        .evd-bottom-link--archive:hover {
          background: rgba(108,0,175,0.28);
          color: #fff;
        }

        /* ── 12. Dropdowns: Share & Calendar ───────────────────────────── */
        /* EventShareButton component */
        .evd-share-wrap { position: relative; }
        .evd-share-trigger {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
        }
        .evd-share-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          z-index: 300;
          background: #1a0f1e;
          border: 1px solid rgba(255,255,255,0.13);
          border-radius: 14px;
          padding: 0.45rem;
          min-width: 196px;
          box-shadow: 0 20px 56px rgba(0,0,0,0.55);
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        .evd-share-item {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          padding: 0.6rem 0.9rem;
          border-radius: 9px;
          font-family: "DM Sans", sans-serif;
          font-size: 0.84rem;
          font-weight: 600;
          color: rgba(255,255,255,0.78);
          text-decoration: none;
          transition: background 0.14s, color 0.14s;
          cursor: pointer;
          white-space: nowrap;
        }
        .evd-share-item:hover {
          background: rgba(255,255,255,0.09);
          color: #fff;
        }
        .evd-share-item--btn {
          background: none;
          border: none;
          text-align: left;
          width: 100%;
        }
        .evd-share-divider {
          height: 1px;
          background: rgba(255,255,255,0.08);
          margin: 0.3rem 0.5rem;
        }

        /* Add to Calendar dropdown */
        .evd-cal-wrap { position: relative; }
        .evd-cal-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
        }
        .evd-cal-dropdown {
          display: none;
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          z-index: 300;
          background: #1a0f1e;
          border: 1px solid rgba(255,255,255,0.13);
          border-radius: 12px;
          padding: 0.4rem;
          min-width: 170px;
          box-shadow: 0 16px 40px rgba(0,0,0,0.5);
          flex-direction: column;
          gap: 1px;
        }
        .evd-cal-wrap:hover .evd-cal-dropdown,
        .evd-cal-wrap:focus-within .evd-cal-dropdown {
          display: flex;
        }
        .evd-cal-option {
          display: flex;
          align-items: center;
          gap: 0.55rem;
          padding: 0.55rem 0.85rem;
          border-radius: 8px;
          font-family: "DM Sans", sans-serif;
          font-size: 0.83rem;
          font-weight: 600;
          color: rgba(255,255,255,0.78);
          text-decoration: none;
          white-space: nowrap;
          transition: background 0.13s, color 0.13s;
        }
        .evd-cal-option:hover {
          background: rgba(255,255,255,0.09);
          color: #fff;
        }
        .evd-btn-group {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
        }

        /* ── 13. Shared scrollbar utility ─────────────────────────────── */
        /* All three horizontal scroll containers use identical thin scrollbars */
        .evd-cast-scroll,
        .evd-cycle-scroll,
        .evd-gallery-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.10) transparent;
          -webkit-overflow-scrolling: touch;
        }
        .evd-cast-scroll::-webkit-scrollbar,
        .evd-cycle-scroll::-webkit-scrollbar,
        .evd-gallery-scroll::-webkit-scrollbar { height: 4px; }
        .evd-cast-scroll::-webkit-scrollbar-track,
        .evd-cycle-scroll::-webkit-scrollbar-track,
        .evd-gallery-scroll::-webkit-scrollbar-track { background: transparent; }
        .evd-cast-scroll::-webkit-scrollbar-thumb,
        .evd-cycle-scroll::-webkit-scrollbar-thumb,
        .evd-gallery-scroll::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.12);
          border-radius: 999px;
        }

        /* ── 14. Responsive overrides ──────────────────────────────────── */
        @media (max-width: 860px) {
          .evd-dashboard-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 760px) {
          .evd-newsletter-inner {
            grid-template-columns: 1fr;
          }
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
          .evd-btn-cta {
            padding: 1rem 1.25rem;
          }
        }
      `}</style>
    </>
  );
}
