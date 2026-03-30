import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import DramaClubBadge from "@/components/ui/DramaClubBadge";
import EventShareButton from "@/components/events/EventShareButton";
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
type CreditItem = { role: string; name: string; href?: string };

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
  const team = extra?.creativeTeamOverride ?? [];
  const cast = extra?.castOverride ?? [];
  const combined = [...team, ...cast].map((p) => ({
    role: p.role,
    name: p.name,
    href: p.href,
  }));
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

  const eventUrl = `${SITE_URL}/events/${event.id}`;
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
                {linkedDramaClubs.length > 0 ? (
                <div className="evd-clubs-inline" aria-label="Participating DAT Drama Clubs">
                    <div className="evd-clubs-inline-head">
                    <p className="evd-clubs-inline-eyebrow">
                        {linkedDramaClubs.length > 1
                        ? "Featuring DAT Drama Clubs"
                        : "Featuring a DAT Drama Club"}
                    </p>
                    <p className="evd-clubs-inline-title">
                        {linkedDramaClubs.length > 1
                        ? "Participating ensembles connected to this event"
                        : "The ensemble connected to this event"}
                    </p>
                    </div>

                    <div className="evd-clubs-inline-grid">
                    {linkedDramaClubs.map((club) => (
                        <Link
                        key={club.slug}
                        href={`/drama-club/${club.slug}`}
                        className="evd-clubs-inline-card"
                        >
                        <div className="evd-clubs-inline-badge">
                            <DramaClubBadge
                            name={club.name}
                            location={club.location}
                            size={72}
                            wrappedByParentLink
                            />
                        </div>

                        <div className="evd-clubs-inline-copy">
                            <h3 className="evd-clubs-inline-name">{club.name}</h3>
                            {club.location ? (
                            <p className="evd-clubs-inline-location">{club.location}</p>
                            ) : null}
                            <span className="evd-clubs-inline-link">View Drama Club →</span>
                        </div>
                        </Link>
                    ))}
                    </div>
                </div>
                ) : null}

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

                    {event.accessibility ? (
                    <div className="evd-meta-card evd-meta-card--full">
                        <p className="evd-meta-label">Accessibility</p>
                        <p className="evd-meta-value evd-meta-value--sm">{event.accessibility}</p>
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
                        <a href={gcalUrl} target="_blank" rel="noopener noreferrer"
                        className="evd-cal-option">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        Google Calendar
                        </a>
                        <a href={`/api/events/${event.id}/ics`}
                        className="evd-cal-option">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 6v6l4 2"/></svg>
                        Apple Calendar
                        </a>
                        <a href={`/api/events/${event.id}/ics`}
                        className="evd-cal-option">
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
            </div>
        </section>

      <section className="evd-body-band">
        <div className="evd-container evd-body-grid">
          <div className="evd-body-heading-box">
            <p className="evd-body-eyebrow">About the Event</p>
            <h2 className="evd-body-title">Inside the Event</h2>
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

      {/* ── Artist's Note ──────────────────────────────────────────────── */}
      {artistNote ? (
        <section className="evd-note-band">
          <div className="evd-container">
            <p className="evd-note-eyebrow">Artist&apos;s Note</p>
            <blockquote className="evd-note-quote">
              <span className="evd-note-mark" aria-hidden="true">&ldquo;</span>
              <p className="evd-note-text">{artistNote.note}&rdquo;</p>
              {artistNote.by ? (
                <footer className="evd-note-attribution">— {artistNote.by}</footer>
              ) : null}
            </blockquote>
          </div>
        </section>
      ) : null}

      {/* ── Photo Gallery ───────────────────────────────────────────────── */}
      {photoGallery?.length ? (
        <section className="evd-gallery-band">
          <div className="evd-container">
            <div className="evd-gallery-head">
              <p className="evd-gallery-eyebrow">Gallery</p>
              {photoCredit ? (
                <p className="evd-gallery-credit">Photos: {photoCredit}</p>
              ) : null}
            </div>
          </div>
          <div className="evd-gallery-scroll" role="list" aria-label="Production photos">
            {photoGallery.map((img, i) => (
              <div key={i} className="evd-gallery-item" role="listitem">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.src}
                  alt={img.alt ?? `Production photo ${i + 1}`}
                  className="evd-gallery-img"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* ── Video ───────────────────────────────────────────────────────── */}
      {videoEmbedUrl ? (
        <section className="evd-video-band">
          <div className="evd-container evd-video-inner">
            {videoData?.title ? (
              <p className="evd-video-title">{videoData.title}</p>
            ) : (
              <p className="evd-video-eyebrow">Watch</p>
            )}
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
        </section>
      ) : null}

      {/* ── Cast & Credits ──────────────────────────────────────────────── */}
      {credits?.length ? (
        <section className="evd-credits-band">
          <div className="evd-container">
            <div className="evd-section-head">
              <p className="evd-section-eyebrow">The Company</p>
              <h2 className="evd-section-title">Cast &amp; Creative Team</h2>
            </div>
            <div className="evd-credits-grid">
              {credits.map((c, i) => (
                <div key={i} className="evd-credit-item">
                  <p className="evd-credit-role">{c.role}</p>
                  {c.href ? (
                    <Link href={c.href} className="evd-credit-name evd-credit-link">
                      {c.name}
                    </Link>
                  ) : (
                    <p className="evd-credit-name">{c.name}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ── Press & Audience Quotes ─────────────────────────────────────── */}
      {event.pressQuotes?.length ? (
        <section className="evd-quotes-band">
          <div className="evd-container">
            <p className="evd-section-eyebrow evd-quotes-eyebrow">What People Are Saying</p>
            <div className="evd-quotes-grid">
              {event.pressQuotes.map((q, i) => (
                <blockquote key={i} className="evd-press-quote">
                  <p className="evd-press-quote-text">&ldquo;{q.text}&rdquo;</p>
                  <footer className="evd-press-quote-attr">— {q.attribution}</footer>
                </blockquote>
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
        background-position: center;
        display: flex;
        align-items: flex-end;
        overflow: visible;
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
        bottom: -18px;
        height: 38%;
        background: linear-gradient(to bottom, transparent 0%, var(--evd-surface) 100%);
        box-shadow: 0 22px 34px rgba(0, 0, 0, 0.28);
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
  
        .evd-clubs-inline {
        margin-bottom: 1.1rem;
        }

        .evd-clubs-inline-head {
        margin-bottom: 0.8rem;
        }

        .evd-clubs-inline-eyebrow {
        font-family: "DM Sans", sans-serif;
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.24em;
        text-transform: uppercase;
        color: var(--evd-accent);
        margin: 0 0 0.2rem;
        }

        .evd-clubs-inline-title {
        font-family: "Space Grotesk", sans-serif;
        font-size: 0.98rem;
        font-weight: 500;
        line-height: 1.45;
        color: rgba(255,255,255,0.7);
        margin: 0;
        max-width: 42rem;
        }

        .evd-clubs-inline-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 0.8rem;
        }

        .evd-clubs-inline-card {
        display: grid;
        grid-template-columns: 72px minmax(0, 1fr);
        gap: 0.9rem;
        align-items: center;
        text-decoration: none;
        background: linear-gradient(
            180deg,
            rgba(255,255,255,0.06) 0%,
            rgba(255,255,255,0.025) 100%
        );
        border: 1px solid rgba(255,255,255,0.09);
        border-radius: 16px;
        padding: 0.85rem 0.95rem;
        box-shadow: 0 10px 24px rgba(0,0,0,0.14);
        transition:
            transform 0.18s ease,
            border-color 0.18s ease,
            background 0.18s ease,
            box-shadow 0.18s ease;
        }

        .evd-clubs-inline-card:hover {
        transform: translateY(-2px);
        border-color: rgba(255,255,255,0.18);
        background: linear-gradient(
            180deg,
            rgba(255,255,255,0.075) 0%,
            rgba(255,255,255,0.035) 100%
        );
        box-shadow: 0 14px 30px rgba(0,0,0,0.2);
        }

        .evd-clubs-inline-card:focus-visible {
        outline: 2px solid var(--evd-accent);
        outline-offset: 3px;
        }

        .evd-clubs-inline-badge {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 72px;
        min-width: 72px;
        }

        .evd-clubs-inline-copy {
        min-width: 0;
        }

        .evd-clubs-inline-name {
        font-family: "Space Grotesk", sans-serif;
        font-size: 1rem;
        font-weight: 700;
        line-height: 1.15;
        color: #fff;
        margin: 0 0 0.2rem;
        }

        .evd-clubs-inline-location {
        font-family: "Space Grotesk", sans-serif;
        font-size: 0.87rem;
        color: rgba(255,255,255,0.58);
        line-height: 1.45;
        margin: 0 0 0.38rem;
        }

        .evd-clubs-inline-link {
        font-family: "DM Sans", sans-serif;
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--evd-accent);
        }
        .evd-meta-shell {
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 18px;
        padding: 1.05rem 1.05rem 1.15rem;
        box-shadow: none;
        }

        .evd-meta-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 1rem;
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
        .evd-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid rgba(255,255,255,0.08);
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
        box-shadow: none;
        }
        .evd-btn-invite {
        background: #2FA873;
        color: #fff;
        border: none;
        box-shadow: none;
        }
        .evd-btn-ghost {
        color: rgba(255,255,255,0.78);
        background: transparent;
        border: 1.5px solid rgba(255,255,255,0.16);
        cursor: pointer;
        }

        .evd-body-band {
        background: transparent;
        padding: clamp(3.5rem, 7vw, 6rem) 0;
        }
        .evd-body-grid {
        display: grid;
        grid-template-columns: minmax(280px, 0.95fr) minmax(0, 1.45fr);
        gap: clamp(2rem, 5vw, 4.75rem);
        align-items: start;
        }
        @media (max-width: 900px) {
        .evd-body-grid {
            grid-template-columns: 1fr;
        }
        }
        .evd-body-heading-box {
        display: inline-flex;
        flex-direction: column;
        gap: 0.3rem;
        background: rgba(36,17,35,0.22);
        border-left: 6px solid var(--evd-accent);
        border-radius: 0 18px 18px 0;
        padding: 1rem 1.55rem 1.1rem 1.2rem;
        max-width: 760px;
        }
        .evd-body-eyebrow {
        color: rgba(255,255,255,0.92);
        margin: 0 0 0.35rem;
        }
        .evd-body-title {
        font-family: "Anton", sans-serif;
        font-size: clamp(3rem, 6vw, 5.9rem);
        line-height: 0.92;
        color: rgba(255,255,255,0.93);
        margin: 0;
        max-width: 7.5ch;
        }
        .evd-body-copy {
        background: rgba(247,239,229,0.96);
        border-radius: 26px;
        padding: clamp(1.6rem, 3vw, 2.6rem);
        box-shadow: none;
        }
        .evd-body-paragraph {
        font-family: "Space Grotesk", sans-serif;
        font-size: clamp(1rem, 1.4vw, 1.08rem);
        line-height: 1.85;
        color: #241123;
        margin: 0 0 1.25rem;
        }
        .evd-body-paragraph:last-child {
        margin-bottom: 0;
        }

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
        position: relative;
        background: #0e3d25;
        padding: clamp(2.75rem, 5vw, 4rem) 0;
        border-top: 1px solid rgba(255,255,255,0.06);
        }
        .evd-bottom-inner {
        position: relative;
        z-index: 1;
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
        padding: 0.7rem 1.4rem;
        border-radius: 8px;
        transition: opacity 0.2s, transform 0.15s;
        }
        .evd-bottom-link:hover {
        opacity: 0.85;
        transform: translateY(-1px);
        }
        .evd-bottom-link--pink {
        background: #F23359;
        color: #fff;
        }
        .evd-bottom-link--gold {
        background: #D9A919;
        color: #241123;
        }
        .evd-bottom-link--teal {
        background: #2493A9;
        color: #fff;
        }
        .evd-bottom-link--muted {
        color: rgba(255,255,255,0.42);
        border: 1.5px solid rgba(255,255,255,0.14);
        }
        .evd-bottom-link--archive {
        background: rgba(36,17,35,0.9);
        color: #fff;
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

        /* ── Accessibility meta card ───────────────────────────────────── */
        .evd-meta-card--full {
          grid-column: 1 / -1;
        }
        .evd-meta-value--sm {
          font-size: 0.9rem;
          font-weight: 500;
        }

        /* ── Artist's Note ─────────────────────────────────────────────── */
        .evd-note-band {
          background: var(--evd-surface);
          padding: clamp(3.5rem, 7vw, 5.5rem) 0;
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        .evd-note-eyebrow {
          font-family: "DM Sans", sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: var(--evd-accent);
          margin: 0 0 2rem;
        }
        .evd-note-quote {
          max-width: 760px;
          margin: 0;
          padding: 0;
          border: none;
          position: relative;
        }
        .evd-note-mark {
          display: block;
          font-family: "Anton", sans-serif;
          font-size: clamp(5rem, 12vw, 9rem);
          line-height: 0.7;
          color: var(--evd-accent);
          opacity: 0.25;
          margin-bottom: 0.5rem;
          pointer-events: none;
          select: none;
        }
        .evd-note-text {
          font-family: "Space Grotesk", sans-serif;
          font-size: clamp(1.15rem, 2.5vw, 1.45rem);
          font-weight: 500;
          line-height: 1.7;
          color: rgba(255,255,255,0.88);
          margin: 0 0 1.25rem;
          font-style: italic;
        }
        .evd-note-attribution {
          font-family: "DM Sans", sans-serif;
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.38);
        }

        /* ── Photo Gallery ─────────────────────────────────────────────── */
        .evd-gallery-band {
          background: var(--evd-surface-2);
          padding: clamp(2.5rem, 5vw, 4rem) 0;
          overflow: hidden;
        }
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
        .evd-gallery-scroll {
          display: flex;
          gap: 0.6rem;
          overflow-x: auto;
          padding: 0 clamp(1.25rem, 5vw, 3rem) 1rem;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.12) transparent;
          -webkit-overflow-scrolling: touch;
        }
        .evd-gallery-scroll::-webkit-scrollbar { height: 4px; }
        .evd-gallery-scroll::-webkit-scrollbar-track { background: transparent; }
        .evd-gallery-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.14); border-radius: 999px; }
        .evd-gallery-item {
          flex-shrink: 0;
          height: clamp(200px, 30vw, 320px);
          border-radius: 10px;
          overflow: hidden;
        }
        .evd-gallery-img {
          height: 100%;
          width: auto;
          max-width: none;
          display: block;
          object-fit: cover;
          border-radius: 10px;
          transition: opacity 0.2s;
        }
        .evd-gallery-img:hover { opacity: 0.88; }

        /* ── Video ─────────────────────────────────────────────────────── */
        .evd-video-band {
          background: var(--evd-surface);
          padding: clamp(3rem, 6vw, 5rem) 0;
        }
        .evd-video-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.25rem;
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
        .evd-video-title {
          font-family: "Space Grotesk", sans-serif;
          font-size: clamp(1.1rem, 2vw, 1.3rem);
          font-weight: 700;
          color: rgba(255,255,255,0.9);
          margin: 0;
          align-self: flex-start;
        }
        .evd-video-frame-wrap {
          position: relative;
          width: 100%;
          max-width: 820px;
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

        /* ── Cast & Credits ────────────────────────────────────────────── */
        .evd-credits-band {
          background: var(--evd-surface-2);
          padding: clamp(3rem, 6vw, 5rem) 0;
        }
        .evd-credits-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 0;
          margin-top: 1.5rem;
          border-top: 1px solid rgba(255,255,255,0.07);
        }
        .evd-credit-item {
          padding: 0.85rem 0;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          padding-right: 1rem;
        }
        .evd-credit-role {
          font-family: "DM Sans", sans-serif;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.32);
          margin: 0 0 0.25rem;
        }
        .evd-credit-name {
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.95rem;
          font-weight: 600;
          color: #fff;
          margin: 0;
          line-height: 1.3;
        }
        .evd-credit-link {
          text-decoration: none;
          transition: color 0.15s;
        }
        .evd-credit-link:hover { color: var(--evd-accent); }

        /* ── Press Quotes ──────────────────────────────────────────────── */
        .evd-quotes-band {
          background: var(--evd-surface);
          padding: clamp(3rem, 6vw, 5rem) 0;
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        .evd-quotes-eyebrow {
          color: rgba(255,255,255,0.32) !important;
          margin-bottom: 2rem !important;
        }
        .evd-quotes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
        }
        .evd-press-quote {
          margin: 0;
          padding: 1.5rem 1.5rem 1.5rem 1.75rem;
          border-left: 3px solid var(--evd-accent);
          background: rgba(255,255,255,0.03);
          border-radius: 0 12px 12px 0;
        }
        .evd-press-quote-text {
          font-family: "Space Grotesk", sans-serif;
          font-size: clamp(1rem, 1.8vw, 1.15rem);
          font-weight: 500;
          font-style: italic;
          color: rgba(255,255,255,0.88);
          line-height: 1.65;
          margin: 0 0 0.85rem;
        }
        .evd-press-quote-attr {
          font-family: "DM Sans", sans-serif;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.32);
        }

        /* ── Related Upcoming Events ───────────────────────────────────── */
        .evd-related-events-band {
          background: var(--evd-surface-2);
          padding: clamp(3rem, 6vw, 5rem) 0;
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
          border-color: rgba(255,255,255,0.16);
          box-shadow: 0 12px 32px rgba(0,0,0,0.3);
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

        /* ── Share button dropdown ─────────────────────────────────────── */
        .evd-share-wrap {
          position: relative;
        }
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

        /* ── Add to Calendar ───────────────────────────────────────────── */
        .evd-cal-wrap {
          position: relative;
        }
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

        /* ── Newsletter band ───────────────────────────────────────────── */
        .evd-newsletter-band {
          background: #145c37;
          padding: clamp(3rem, 6vw, 5rem) 0;
        }
        .evd-newsletter-inner {
          display: grid;
          grid-template-columns: 1fr 1.3fr;
          gap: clamp(2rem, 5vw, 4.5rem);
          align-items: center;
        }
        @media (max-width: 760px) {
          .evd-newsletter-inner { grid-template-columns: 1fr; }
        }
        .evd-newsletter-eyebrow {
          font-family: "DM Sans", sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.35);
          margin: 0 0 0.65rem;
        }
        .evd-newsletter-title {
          font-family: "Anton", sans-serif;
          font-size: clamp(2rem, 4.5vw, 3.25rem);
          line-height: 0.95;
          color: #fff;
          margin: 0 0 0.85rem;
        }
        .evd-newsletter-body {
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.95rem;
          color: rgba(255,255,255,0.52);
          line-height: 1.65;
          margin: 0;
          max-width: 400px;
        }

        /* ── Mailing list form (shared with events hub) ────────────────── */
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
      `}</style>
    </>
  );
}