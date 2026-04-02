import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";

import DramaClubBadge from "@/components/ui/DramaClubBadge";
import EventShareButton from "@/components/events/EventShareButton";
import EventProdrowGallery from "@/components/events/EventProdrowGallery";
import EventHeroText from "@/components/events/EventHeroText";
import EventBilingualContent from "@/components/events/EventBilingualContent";
import MailingListForm from "@/components/events/MailingListForm";
import { productionMap } from "@/lib/productionMap";
import { productionDetailsMap, type ProductionExtra } from "@/lib/productionDetailsMap";
import { dramaClubs as rawDramaClubs } from "@/lib/dramaClubMap";
import {
  allEventIds,
  canonicalEventPath,
  categoryMeta,
  events,
  formatDateRange,
  getEventImage,
  isCommunityShowcase,
  isElapsed,
  type DatEvent,
} from "@/lib/events";

type EventDetailRouteKind = "theatre" | "festivals" | "gatherings";

type EventDetailPageTemplateProps = {
  event: DatEvent;
  routeKind: EventDetailRouteKind;
};

const ORGANIZATION_URL = "https://dramaticadventure.com";
const DETAIL_URL_BASE = "https://stories.dramaticadventure.com";

/** Spanish labels for the bilingual breadcrumb nav */
const ES_CATEGORY_LABEL_NAV = {
  events: "Eventos",
  performance: "Funciones",
  festival: "Festivales",
  fundraiser: "Recaudaciones",
} as const;

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
      "linear-gradient(to top, rgba(13,8,18,0.97) 0%, rgba(13,8,18,0.80) 22%, rgba(13,8,18,0.22) 52%, rgba(13,8,18,0.04) 75%, rgba(13,8,18,0) 100%)",
    buttonText: "#ffffff",
  },
  festival: {
    accent: "#2493A9",
    surface: "#05141a",
    surface2: "#052f3d",
    glow: "rgba(36, 147, 169, 0.18)",
    heroOverlay:
      "linear-gradient(to top, rgba(5,20,26,0.97) 0%, rgba(5,20,26,0.80) 22%, rgba(5,20,26,0.22) 52%, rgba(5,20,26,0.04) 75%, rgba(5,20,26,0) 100%)",
    buttonText: "#ffffff",
  },
  fundraiser: {
    accent: "#D9A919",
    surface: "#140c04",
    surface2: "#2e2000",
    glow: "rgba(217, 169, 25, 0.18)",
    heroOverlay:
      "linear-gradient(to top, rgba(20,12,4,0.97) 0%, rgba(20,12,4,0.80) 22%, rgba(20,12,4,0.22) 52%, rgba(20,12,4,0.04) 75%, rgba(20,12,4,0) 100%)",
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
  return `${DETAIL_URL_BASE}${normalized}`;
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
    details: `${event.description}\n\n${DETAIL_URL_BASE}${canonicalEventPath(event)}`,
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
    body: `${event.description}\n\n${DETAIL_URL_BASE}${canonicalEventPath(event)}`,
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
      url: ORGANIZATION_URL,
    },
    image,
    url: `${DETAIL_URL_BASE}${canonicalEventPath(event)}`,
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
    .filter((e) => e.status !== "cancelled" && !isElapsed(e) && e.id !== current.id) 
    .sort((a, b) => a.date.localeCompare(b.date)) 
    .slice(0, 3);
}

type CycleEntry = { slug: string; title: string; posterUrl?: string; location?: string; festival?: string };

/**
 * Derives a dynamic status badge for the current event's production card.
 * Returns label, color class, and whether it's still upcoming (for link text).
 */
function getEventBadge(startDate: string, endDate?: string): {
  label: string;
  cls: "upcoming" | "nowplaying" | "archive";
  isUpcoming: boolean;
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date(startDate);
  // Give end date until EOD
  end.setHours(23, 59, 59, 999);

  if (today < start) {
    return { label: "Upcoming", cls: "upcoming", isUpcoming: true };
  }
  if (today <= end) {
    return { label: "Now Playing", cls: "nowplaying", isUpcoming: false };
  }
  return { label: "Archive", cls: "archive", isUpcoming: false };
}

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

type PrimaryAction = ReturnType<typeof getPrimaryAction>;

type ArchivedEventInfoBandProps = {
  event: DatEvent;
  routeKind: EventDetailRouteKind;
  relatedProduction?: { slug: string };
};

function ArchivedEventInfoBand({
  event,
  routeKind,
  relatedProduction,
}: ArchivedEventInfoBandProps) {
  return (
    <div className="evd-ticket-bar">
      <div className="evd-ticket-bar-inner">
        <div className="evd-ticket-row1">
          <div className="evd-ticket-chips">
            <span className="evd-tmeta-chip">
              {formatDateRange(event.date, event.endDate)}
            </span>

            <span className="evd-tmeta-chip">
              {event.venue}
              {event.city !== "Worldwide"
                ? ` · ${event.city}${event.country ? `, ${event.country}` : ""}`
                : ""}
            </span>

            {event.runtime ? (
              <span className="evd-tmeta-chip">{event.runtime}</span>
            ) : null}

            {event.language ? (
              <span className="evd-tmeta-chip">{event.language}</span>
            ) : null}

            {event.suitability ? (
              <span className="evd-tmeta-chip">{event.suitability}</span>
            ) : null}
          </div>

          <div className="evd-ticket-purchase">
            {routeKind === "theatre" && relatedProduction ? (
              <Link href={`/theatre/${relatedProduction.slug}`} className="evd-btn-ticket">
                View Production Archive →
              </Link>
            ) : (
              <Link href="/projects" className="evd-btn-ticket">
                Browse Project Archive →
              </Link>
            )}
          </div>
        </div>

        {event.archiveSummary ? (
          <div className="evd-a11y-inline">
            <span>{event.archiveSummary}</span>
          </div>
        ) : event.accessibility ? (
          <div className="evd-a11y-inline">
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              style={{ flexShrink: 0, opacity: 0.4 }}
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4m0 4h.01" />
            </svg>
            {event.translations ? (
              <>
                <span className="evd-bilingual-wrap-default">{event.accessibility}</span>
                <span className="evd-bilingual-wrap-alt evd-bilingual-en">
                  {event.translations["en"]?.accessibility ?? event.accessibility}
                </span>
              </>
            ) : (
              <span>{event.accessibility}</span>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

type UpcomingEventInfoBandProps = {
  event: DatEvent;
  routeKind: EventDetailRouteKind;
  primaryAction: PrimaryAction;
  gcalUrl: string;
  outlookUrl: string;
  eventUrl: string;
};

function UpcomingEventInfoBand({
  event,
  routeKind,
  primaryAction,
  gcalUrl,
  outlookUrl,
  eventUrl,
}: UpcomingEventInfoBandProps) {
  return (
    <div className="evd-ticket-bar">
      <div className="evd-ticket-bar-inner">
        <div className="evd-ticket-row1">
          <div className="evd-ticket-chips">
            {event.runtime ? (
              <span className="evd-tmeta-chip">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                {event.runtime}
              </span>
            ) : null}
            {event.language ? (
              <span className="evd-tmeta-chip">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                {event.language}
              </span>
            ) : null}
            {event.suitability ? (
              <span className="evd-tmeta-chip">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                {event.suitability}
              </span>
            ) : null}
          </div>

          <div className="evd-ticket-purchase">
            {event.ticketPrice ? (
              <span className="evd-tmeta-price">{event.ticketPrice}</span>
            ) : null}
            {primaryAction ? (
              <a
                href={primaryAction.href}
                target={primaryAction.external ? "_blank" : undefined}
                rel={primaryAction.external ? "noopener noreferrer" : undefined}
                className={`evd-btn-ticket${primaryAction.tone === "invite" ? " evd-btn-ticket--invite" : ""}`}
              >
                {primaryAction.label}
              </a>
            ) : null}
          </div>
        </div>

        <div className="evd-actions">
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
              {event.translations ? (
                <>
                  <span className="evd-bilingual-wrap-default">Agregar al Calendario</span>
                  <span className="evd-bilingual-wrap-alt evd-bilingual-en">Add to Calendar</span>
                </>
              ) : "Add to Calendar"}
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
              {event.translations ? (
                <>
                  <span className="evd-bilingual-wrap-default">Traer un Grupo →</span>
                  <span className="evd-bilingual-wrap-alt evd-bilingual-en">Bring a Group →</span>
                </>
              ) : "Bring a Group →"}
            </a>
          ) : null}
        </div>

        {event.accessibility ? (
          <div className="evd-a11y-inline">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0, opacity: 0.4 }}><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
            {event.translations ? (
              <>
                <span className="evd-bilingual-wrap-default">{event.accessibility}</span>
                <span className="evd-bilingual-wrap-alt evd-bilingual-en">
                  {event.translations["en"]?.accessibility ?? event.accessibility}
                </span>
              </>
            ) : (
              <span>{event.accessibility}</span>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function EventDetailPageTemplate({
  event,
  routeKind,

}: EventDetailPageTemplateProps) {

  const meta = categoryMeta[event.category];
  const theme = THEME_BY_CATEGORY[event.category];

  const isArchiveView = isElapsed(event);

  const heroDefaultLang = event.defaultLang ?? (event.translations ? "es" : "en");

  const relatedProduction = event.production ? productionMap[event.production] : undefined;
  const productionExtra = event.production ? productionDetailsMap[event.production] : undefined;

  const heroImage =
    normalizeImagePath(
      isArchiveView
        ? (event.archiveHeroImage ?? getEventImage(event))
        : getEventImage(event)
    ) ?? "/posters/fallback-16x9.jpg";




  const paragraphs = splitParagraphs(event.longDescription ?? event.description);
  const primaryAction = getPrimaryAction(event);
  const linkedDramaClubs = resolveDramaClubs(event);

  // Rich-content resolution (event-first, production fallback)
  const photoGallery = resolvePhotoGallery(event, productionExtra);
  const photoCredit = resolvePhotoCredit(event, productionExtra);
  const fieldGalleryImages = productionExtra?.fieldGalleryImages?.length
    ? (productionExtra.fieldGalleryImages as GalleryItem[])
    : undefined;
  const fieldGalleryTitle = productionExtra?.fieldGalleryTitle;
  const fieldAlbumHref = productionExtra?.fieldAlbumHref ?? undefined;
  const photographerHref = event.photographerHref;
  const albumHref = event.albumHref;
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

  const eventUrl = `${DETAIL_URL_BASE}${canonicalEventPath(event)}`;
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
        <div className="evd-hero-content">
          <nav className="evd-breadcrumb" aria-label="Breadcrumb">
            <Link href="/events">Events</Link>
            <span aria-hidden="true">/</span>
            <Link href={meta.href}>
              {routeKind === "theatre" ? "Performances" : routeKind === "festivals" ? "Festivals" : "Gatherings"}
            </Link>
            <span aria-hidden="true">/</span>
            <span>{event.title}</span>
          </nav>

          <EventHeroText
            defaultLang={heroDefaultLang}
            eyebrow={getEventEyebrow(event)}
            base={{
              title: event.title,
              subtitle: event.subtitle,
              description: !isArchiveView
                ? event.description
                : event.archiveSummary ?? event.description,
            }}
            translations={event.translations ?? {}}
          />

          {isArchiveView ? (
            <div className="evd-archive-badge-wrap">
              <span className="evd-archive-badge">Archive</span>
            </div>
          ) : null}

          <div className="evd-hero-pills">
            {event.ticketUrl ? (
              <a
                href={event.ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="evd-pill evd-pill--date evd-pill--link"
              >
                {formatDateRange(event.date, event.endDate)}
              </a>
            ) : (
              <span className="evd-pill evd-pill--date">
                {formatDateRange(event.date, event.endDate)}
              </span>
            )}

            <span className="evd-pill evd-pill--venue">
              {event.venue}
              {event.city !== "Worldwide"
                ? ` · ${event.city}${event.country ? `, ${event.country}` : ""}`
                : ""}
            </span>
          </div>
        </div>
      </div>

      {/* ── Ticket Dashboard ─────────────────────────────────────────────── */}
        <section className="evd-dashboard-band">
        {isArchiveView ? (
            <ArchivedEventInfoBand
            event={event}
            routeKind={routeKind}
            relatedProduction={relatedProduction}
            />
        ) : (
            <UpcomingEventInfoBand
            event={event}
            routeKind={routeKind}
            primaryAction={primaryAction}
            gcalUrl={gcalUrl}
            outlookUrl={outlookUrl}
            eventUrl={eventUrl}
            />
        )}
        </section>

      {/* ── White Content Card: description → creative team ─────────────── */}
      <section className="evd-content-section" style={{ "--evd-accent": theme.accent } as CSSProperties}>
        <div className="evd-container">
          <div className="evd-content-card">

            {/* Card-level title — frames the whole card */}
            <p className="evd-card-title" aria-hidden="true">
              {event.translations ? (
                <>
                  <span className="evd-bilingual-wrap-default">Dentro de la Obra</span>
                  <span className="evd-bilingual-wrap-alt evd-bilingual-en">Inside the Work</span>
                </>
              ) : "Inside the Work"}
            </p>

            {/* Two-column content: LEFT quote-image + about / RIGHT reviews + community impact */}
            <div className={`evd-dashboard-grid${editorialImg1 || event.pressQuotes?.length || linkedDramaClubs.length > 0 ? "" : " evd-dashboard-grid--single"}`}>

              {/* ── LEFT (60%): horizontal artist image → About → Video ── */}
              <div className="evd-dashboard-left">

                {/* Horizontal image+artist note — ABOVE About */}
                {editorialImg1 ? (
                  <div className="evd-elder-shell evd-elder-shell--horizontal">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={editorialImg1}
                      alt={artistNote?.by || event.title}
                      className="evd-elder-bg"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="evd-elder-overlay" aria-hidden="true" />
                    <div className="evd-elder-content">
                      <p className="evd-elder-label">
                        {event.translations ? (
                          <>
                            <span className="evd-bilingual-wrap-default">Del artista</span>
                            <span className="evd-bilingual-wrap-alt evd-bilingual-en">From the artist</span>
                          </>
                        ) : "From the artist"}
                      </p>
                      {artistNote ? (
                        event.translations ? (
                          <>
                            {/* ES artist note */}
                            <p className="evd-elder-text evd-bilingual-default">&ldquo;{artistNote.note}&rdquo;</p>
                            {artistNote.by ? (
                              <p className="evd-elder-meta evd-bilingual-default">
                                <span className="evd-elder-name">{artistNote.by}</span>
                              </p>
                            ) : null}
                            {/* EN artist note */}
                            {event.translations["en"]?.artistNote && (
                              <p className="evd-elder-text evd-bilingual-alt evd-bilingual-en">&ldquo;{event.translations["en"].artistNote}&rdquo;</p>
                            )}
                            {event.translations["en"]?.artistNoteBy && (
                              <p className="evd-elder-meta evd-bilingual-alt evd-bilingual-en">
                                <span className="evd-elder-name">{event.translations["en"].artistNoteBy}</span>
                              </p>
                            )}
                          </>
                        ) : (
                          <>
                            <p className="evd-elder-text">&ldquo;{artistNote.note}&rdquo;</p>
                            {artistNote.by ? (
                              <p className="evd-elder-meta">
                                <span className="evd-elder-name">{artistNote.by}</span>
                              </p>
                            ) : null}
                          </>
                        )
                      ) : null}
                    </div>
                  </div>
                ) : null}

                {/* About section */}
                {paragraphs.length > 0 ? (
                  <div className="evd-dash-description evd-about-block evd-section-block">
                    {event.translations ? (
                      <>
                        <h2 className="evd-about-head evd-bilingual-default">Sobre la Obra</h2>
                        <h2 className="evd-about-head evd-bilingual-alt evd-bilingual-en">About</h2>
                      </>
                    ) : (
                      <h2 className="evd-about-head">About</h2>
                    )}
                    {event.translations ? (
                      <>
                        {/* ES subtitle */}
                        {event.subtitle && (
                          <p className="evd-tagline-inline evd-bilingual-default">{event.subtitle}</p>
                        )}
                        {/* EN subtitle */}
                        {event.translations["en"]?.subtitle && (
                          <p className="evd-tagline-inline evd-bilingual-alt evd-bilingual-en">
                            {event.translations["en"].subtitle}
                          </p>
                        )}
                        {/* ES paragraphs */}
                        <div className="evd-bilingual-default">
                          {paragraphs.map((p, i) => (
                            <p key={i} className="evd-body-text evd-about-body">{p}</p>
                          ))}
                        </div>
                        {/* EN paragraphs */}
                        {event.translations["en"]?.longDescription && (
                          <div className="evd-bilingual-alt evd-bilingual-en">
                            {splitParagraphs(event.translations["en"].longDescription).map((p, i) => (
                              <p key={i} className="evd-body-text evd-about-body">{p}</p>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {event.subtitle ? (
                          <p className="evd-tagline-inline">{event.subtitle}</p>
                        ) : null}
                        {paragraphs.map((p, i) => (
                          <p key={i} className="evd-body-text evd-about-body">{p}</p>
                        ))}
                      </>
                    )}
                  </div>
                ) : null}

              </div>

              {/* ── RIGHT (40%): press reviews → Community Impact ── */}
              {(linkedDramaClubs.length > 0 || event.pressQuotes?.length || event.donateLink) ? (
                <div className="evd-dashboard-right">

                  {/* Press / audience reviews */}
                  {event.pressQuotes?.length ? (
                    <div className="evd-voices-quotes">
                      {event.translations ? (
                        <>
                          <h2 className="evd-about-head evd-voices-head evd-bilingual-default">La Respuesta</h2>
                          <h2 className="evd-about-head evd-voices-head evd-bilingual-alt evd-bilingual-en">The Response</h2>
                        </>
                      ) : (
                        <h2 className="evd-about-head evd-voices-head">The Response</h2>
                      )}
                      {event.translations ? (
                        <>
                          {/* ES quotes */}
                          <div className="evd-bilingual-default">
                            {event.pressQuotes.map((q, i) => (
                              <figure key={i} className="evd-voices-quote">
                                <blockquote className="evd-voices-blockquote">&ldquo;{q.text}&rdquo;</blockquote>
                                <figcaption className="evd-voices-figcaption">{q.attribution}</figcaption>
                              </figure>
                            ))}
                          </div>
                          {/* EN quotes */}
                          {event.translations["en"]?.pressQuotes?.length && (
                            <div className="evd-bilingual-alt evd-bilingual-en">
                              {event.translations["en"].pressQuotes!.map((q, i) => (
                                <figure key={i} className="evd-voices-quote">
                                  <blockquote className="evd-voices-blockquote">&ldquo;{q.text}&rdquo;</blockquote>
                                  <figcaption className="evd-voices-figcaption">{q.attribution}</figcaption>
                                </figure>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        event.pressQuotes.map((q, i) => (
                          <figure key={i} className="evd-voices-quote">
                            <blockquote className="evd-voices-blockquote">
                              &ldquo;{q.text}&rdquo;
                            </blockquote>
                            <figcaption className="evd-voices-figcaption">
                              {q.attribution}
                            </figcaption>
                          </figure>
                        ))
                      )}
                    </div>
                  ) : null}

                  {/* Community Impact: drama club badge + impact blurb + donate CTA */}
                  {(linkedDramaClubs.length > 0 || event.donateLink) ? (
                    <div className="evd-community-impact evd-section-block">
                      {event.translations ? (
                        <>
                          <h2 className="evd-about-head evd-bilingual-default">Impacto Comunitario</h2>
                          <h2 className="evd-about-head evd-bilingual-alt evd-bilingual-en">Community Impact</h2>
                        </>
                      ) : (
                        <h2 className="evd-about-head">Community Impact</h2>
                      )}

                      {linkedDramaClubs.length > 0 ? (
                        <div className="evd-impact-clubs">
                          {linkedDramaClubs.map((club) => (
                            <Link
                              key={club.slug}
                              href={`/drama-club/${club.slug}`}
                              className="evd-impact-club-row"
                            >
                              <DramaClubBadge
                                name={club.name}
                                location={club.location}
                                size={112}
                                wrappedByParentLink
                              />
                              <div className="evd-impact-club-copy">
                                <p className="evd-impact-support-eyebrow">
                                  {event.translations ? (
                                    <>
                                      <span className="evd-bilingual-wrap-default">Esta producción apoya</span>
                                      <span className="evd-bilingual-wrap-alt evd-bilingual-en">This production supports</span>
                                    </>
                                  ) : "This production supports"}
                                </p>
                                <p className="evd-impact-club-name">{club.name}</p>
                                {club.location ? (
                                  <p className="evd-impact-club-loc">{club.location}</p>
                                ) : null}
                              </div>
                            </Link>
                          ))}
                        </div>
                      ) : null}

                      {event.impactBlurb ? (
                        event.translations ? (
                          <>
                            <p className="evd-body-text evd-about-body evd-impact-blurb evd-bilingual-default">
                              {event.impactBlurb}
                            </p>
                            {event.translations["en"]?.impactBlurb && (
                              <p className="evd-body-text evd-about-body evd-impact-blurb evd-bilingual-alt evd-bilingual-en">
                                {event.translations["en"].impactBlurb}
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="evd-body-text evd-about-body evd-impact-blurb">
                            {event.impactBlurb}
                          </p>
                        )
                      ) : null}

                      <a
                        href={event.donateLink || "/donate"}
                        className="evd-impact-donate-btn"
                      >
                        {isArchiveView ? "Sponsor New Works Like This →" : "Sponsor This New Work →"}
                      </a>
                      {linkedDramaClubs.length > 0 && (
                        <a
                          href={`/donate?mode=drama-club&club=${linkedDramaClubs[0].slug}`}
                          className="evd-impact-donate-btn evd-impact-donate-btn--secondary"
                        >
                          Sponsor this Drama Club →
                        </a>
                      )}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            {/* Full-width video — spans both columns */}
            {videoEmbedUrl ? (
              <div className="evd-dash-video evd-dash-video--full">
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

            {/* Photo Gallery */}
            {(photoGallery?.length || fieldGalleryImages?.length) ? (
              <div className="evd-card-gallery">
                <EventProdrowGallery
                  images={photoGallery ?? []}
                  photoCredit={photoCredit}
                  photographerHref={photographerHref}
                  albumHref={albumHref}
                  fieldImages={fieldGalleryImages}
                  fieldGalleryTitle={fieldGalleryTitle}
                  fieldAlbumHref={fieldAlbumHref}
                />
              </div>
            ) : null}

            {/* Cast */}
            {castCredits.length > 0 ? (
              <div className="evd-card-cast">
                <div className="evd-cast-head">
                  <span className="evd-cast-head-rule" aria-hidden="true" />
                  <p className="evd-cast-head-label">
                    {event.translations ? (
                      <>
                        <span className="evd-bilingual-wrap-default">Elenco</span>
                        <span className="evd-bilingual-wrap-alt evd-bilingual-en">Cast</span>
                      </>
                    ) : "Cast"}
                  </p>
                  <span className="evd-cast-head-rule" aria-hidden="true" />
                </div>
                <div className="evd-cast-grid" role="list" aria-label="Cast members">
                  {castCredits.map((c, i) => {
                    const enRole = event.translations
                      ? (event.translations["en"]?.credits ?? []).find(
                          (ec) => ec.name === c.name && ec.group === "cast"
                        )?.role
                      : undefined;
                    const card = (
                      <div key={i} className="evd-cast-card" role="listitem">
                        <div className="evd-cast-photo-wrap">
                          {c.photo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={c.photo.replace(/^http:\/\//, "https://")}
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
                        <p className="evd-cast-role">
                          {enRole ? (
                            <>
                              <span className="evd-bilingual-wrap-default">{c.role}</span>
                              <span className="evd-bilingual-wrap-alt evd-bilingual-en">{enRole}</span>
                            </>
                          ) : c.role}
                        </p>
                        <p className="evd-cast-name">{c.name}</p>
                      </div>
                    );
                    return c.href ? (
                      <Link key={i} href={c.href} className="evd-cast-card-link">
                        {card}
                      </Link>
                    ) : card;
                  })}
                </div>
              </div>
            ) : null}

            {/* Creative Team */}
            {creativeCredits.length > 0 ? (
              <div className="evd-card-creative">
                <div className="evd-cast-head">
                  <span className="evd-cast-head-rule" aria-hidden="true" />
                  <p className="evd-cast-head-label">
                    {event.translations ? (
                      <>
                        <span className="evd-bilingual-wrap-default">
                          {castCredits.length > 0 ? "Equipo Creativo" : "La Compañía"}
                        </span>
                        <span className="evd-bilingual-wrap-alt evd-bilingual-en">
                          {castCredits.length > 0 ? "Creative Team" : "The Company"}
                        </span>
                      </>
                    ) : (
                      castCredits.length > 0 ? "Creative Team" : "The Company"
                    )}
                  </p>
                  <span className="evd-cast-head-rule" aria-hidden="true" />
                </div>
                <div className="evd-creative-grid">
                  {creativeCredits.map((c, i) => {
                    const enRole = event.translations
                      ? (event.translations["en"]?.credits ?? []).find(
                          (ec) => ec.name === c.name && (ec.group === "creative" || !ec.group)
                        )?.role
                      : undefined;
                    return (
                      <div key={i} className="evd-credit-item">
                        <p className="evd-credit-role">
                          {enRole ? (
                            <>
                              <span className="evd-bilingual-wrap-default">{c.role}</span>
                              <span className="evd-bilingual-wrap-alt evd-bilingual-en">{enRole}</span>
                            </>
                          ) : c.role}
                        </p>
                        {c.href ? (
                          <Link href={c.href} className="evd-credit-name evd-credit-link">{c.name}</Link>
                        ) : (
                          <p className="evd-credit-name">{c.name}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

          </div>
        </div>
      </section>

      {/* ── Related Productions Cycle ────────────────────────────────── */}
      {(relatedProduction || productionCycle.length > 0) ? (
        <section className="evd-cycle-band">
          {/* DAT logo sticker — half above section top edge */}
          <div className="evd-cycle-logo-sticker" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/dat-logo7.svg" alt="" className="evd-cycle-logo-img" />
          </div>
          <div className="evd-container">
            <div className="evd-section-head">
              <p className="evd-section-eyebrow">Production History</p>
              <h2 className="evd-section-title">The Full Cycle</h2>
            </div>
            <div className="evd-cycle-scroll-outer">
              <div className="evd-cycle-scroll" role="list" aria-label="Production history">

                {/* ── Current linked production — dynamic status badge ── */}
                {relatedProduction && event.production ? (() => {
                  const badge = getEventBadge(event.date, event.endDate);
                  return (
                    <Link
                      href={`/theatre/${event.production}`}
                      className="evd-cycle-card"
                      role="listitem"
                    >
                      <div
                        className="evd-cycle-img"
                        style={{
                          backgroundImage: (normalizeImagePath(
                            productionExtra?.heroImageUrl ?? relatedProduction.posterUrl
                          ))
                            ? `url('${normalizeImagePath(productionExtra?.heroImageUrl ?? relatedProduction.posterUrl)}')`
                            : undefined,
                        }}
                      >
                        <span className={`evd-cycle-badge evd-cycle-badge--${badge.cls}`}>
                          {badge.label}
                        </span>
                      </div>
                      <div className="evd-cycle-body">
                        <p className="evd-cycle-title">{relatedProduction.title}</p>
                        {(relatedProduction.location || relatedProduction.festival) ? (
                          <p className="evd-cycle-meta">
                            {relatedProduction.location}
                            {relatedProduction.festival ? ` · ${relatedProduction.festival}` : ""}
                          </p>
                        ) : null}
                        <span className="evd-cycle-link">
                          {badge.isUpcoming ? "Explore Production →" : "View Archive →"}
                        </span>
                      </div>
                    </Link>
                  );
                })() : null}

                {/* ── Other productions in the same cycle — always ARCHIVE ── */}
                {productionCycle.map((p) => (
                  <Link key={p.slug} href={`/theatre/${p.slug}`} className="evd-cycle-card" role="listitem">
                    <div
                      className="evd-cycle-img"
                      style={{
                        backgroundImage: p.posterUrl
                          ? `url('${p.posterUrl}')`
                          : undefined,
                      }}
                    >
                      <span className="evd-cycle-badge evd-cycle-badge--archive">Archive</span>
                    </div>
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
          </div>
        </section>
      ) : null}

      {/* ── Related Upcoming Events ────────────────────────────────────── */}
      {relatedEvents.length > 0 ? (
        <section className="evd-related-events-band">
          <div className="evd-container">
            <div className="evd-section-head">
              <p className="evd-section-eyebrow">More Events</p>
              <h2 className="evd-section-title">
                {isArchiveView ? "Explore More" : "Also Coming Up"}
                </h2>
            </div>
            <div className="evd-rel-events-grid">
              {relatedEvents.map((re) => {
                const relGlow = re.category === "performance" ? "#F23359"
                  : re.category === "festival" ? "#2493A9"
                  : "#D9A919";
                return (
                  <Link
                    key={re.id}
                    href={canonicalEventPath(re)}
                    className="evd-rel-card"
                    style={{ "--evd-rel-glow": relGlow } as CSSProperties}
                  >
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
                );
              })}
            </div>
            <div className="evd-rel-events-footer">
              <div className="evd-rel-footer-nav">
                <Link href="/events/performances" className="evd-bottom-link evd-bottom-link--pink">
                  Upcoming Performances →
                </Link>
                <Link href="/events/fundraisers" className="evd-bottom-link evd-bottom-link--gold">
                  Fundraisers &amp; Community Nights →
                </Link>
                <Link href="/events/festivals" className="evd-bottom-link evd-bottom-link--teal">
                  Festivals &amp; Showcases →
                </Link>
                <Link href="/theatre" className="evd-bottom-link evd-bottom-link--muted">
                  Theatre Archive →
                </Link>
              </div>
              <Link href="/events" className="evd-btn-ghost evd-rel-all-events-btn">
                All Events →
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
            <h2 className="evd-newsletter-title">
                {isArchiveView
                    ? "Stay connected to new work, revivals, and gatherings."
                    : "Never miss a show."}
            </h2>
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
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 clamp(1.25rem, 5vw, 3rem);
        }
        /* Content card gets theatre-style 90vw width */
        .evd-content-section .evd-container {
          max-width: none;
          padding: 0 5vw;
        }

        /* ── 2. Hero ───────────────────────────────────────────────────── */
        .evd-hero {
          position: relative;
          min-height: 100vh;
          background-size: cover;
          background-position: center;
          display: flex;
          align-items: flex-end;
          overflow: hidden;
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
          background: radial-gradient(ellipse 55% 35% at 8% 100%, var(--evd-glow) 0%, transparent 70%);
          z-index: 1;
        }

        /* Fade hero into dashboard */
        .evd-hero::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 28%;
          background: linear-gradient(to bottom, transparent 0%, var(--evd-surface) 100%);
          z-index: 3;
          pointer-events: none;
        }

        /* Subtle shadow from hero casting down onto dashboard */
        .evd-hero::before {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          bottom: -18px;
          height: 18px;
          background: transparent;
          box-shadow: 0 -2px 24px 8px rgba(0, 0, 0, 0.55);
          z-index: 6;
          pointer-events: none;
        }

        .evd-hero-content {
          position: relative;
          z-index: 4;
          padding: clamp(5rem, 10vw, 8rem) clamp(1.75rem, 4vw, 3rem) clamp(1.5rem, 2.5vw, 2.5rem);
          max-width: 960px;
          width: 100%;
        }

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
          margin: 0 0 0.85rem;
        }
        /* Breadcrumb nav in hero */
        .evd-breadcrumb {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
          font-family: "DM Sans", sans-serif;
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.10em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.45);
          margin-bottom: 1.25rem;
        }
        .evd-breadcrumb a {
          color: rgba(255,255,255,0.45);
          text-decoration: none;
          transition: color 0.18s ease;
        }
        .evd-breadcrumb a:hover {
          color: rgba(255,255,255,0.85);
        }
        .evd-breadcrumb span[aria-hidden] {
          color: rgba(255,255,255,0.22);
        }

        .evd-title {
          font-family: "Anton", sans-serif;
          font-size: clamp(2.8rem, 7vw, 6rem);
          line-height: 0.92;
          color: #fff;
          margin: 0 0 0.9rem;
          letter-spacing: 0.01em;
          text-transform: uppercase;
          text-shadow: 0 2px 24px rgba(0,0,0,0.5);
          padding-right: clamp(0.5rem, 4vw, 2rem);
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
          color: rgba(255,255,255,0.52);
          line-height: 1.7;
          margin: 0 0 2rem;
          max-width: 760px;
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
        /* Linked pills — pink border + letter-spacing on hover */
        a.evd-pill--link {
          text-decoration: none;
          transition: border-color 0.2s ease, letter-spacing 0.22s ease, color 0.2s ease;
        }
        a.evd-pill--link:hover,
        a.evd-pill--link:focus-visible {
          border-color: #F23359;
          color: #fff;
          letter-spacing: 0.14em;
        }

        /* ── 3. Ticket Dashboard ───────────────────────────────────────── */
        .evd-dashboard-band {
          background: var(--evd-surface);
          position: relative;
          z-index: 5;
        }

        /* Full-bleed ticket bar — spans viewport edge to edge */
        .evd-ticket-bar {
          background: rgba(0,0,0,0.50);
          border-top: 2px solid var(--evd-accent);
          border-bottom: 1px solid rgba(255,255,255,0.07);
          box-shadow: 0 8px 32px rgba(0,0,0,0.55);
          position: relative;
          z-index: 10;
        }
        .evd-ticket-bar-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 1.1rem clamp(1.75rem, 4vw, 3rem);
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }

        /* Row 1: chips left, price + CTA right — all on one line */
        .evd-ticket-row1 {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
          flex-wrap: wrap;
        }
        .evd-ticket-chips {
          display: flex;
          align-items: center;
          gap: 1.75rem;
          flex-wrap: wrap;
          flex: 1;
        }
        .evd-ticket-purchase {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          flex-shrink: 0;
        }
        .evd-tmeta-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          font-family: "DM Sans", sans-serif;
          font-size: 0.82rem;
          font-weight: 600;
          color: rgba(255,255,255,0.55);
          letter-spacing: 0.03em;
          white-space: nowrap;
        }
        .evd-tmeta-chip svg { opacity: 0.45; }
        .evd-tmeta-price {
          font-family: "Space Grotesk", sans-serif;
          font-size: 1.05rem;
          font-weight: 700;
          color: #fff;
          white-space: nowrap;
          padding-right: 0.25rem;
        }

        /* THE ticket button — always DAT pink, always prominent */
        .evd-btn-ticket {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
          padding: 0.8rem 2.25rem;
          border-radius: 10px;
          font-family: "DM Sans", sans-serif;
          font-size: 0.88rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          text-decoration: none;
          background: #F23359;
          color: #fff;
          border: none;
          white-space: nowrap;
          transition: opacity 0.18s ease;
        }
        .evd-btn-ticket:hover {
          opacity: 0.82;
        }
        .evd-btn-ticket--invite {
          background: #2FA873;
        }

        /* Accessibility note — subtle single line below secondary actions */
        .evd-a11y-inline {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          margin-top: 0.85rem;
          padding-top: 0.75rem;
          border-top: 1px solid rgba(255,255,255,0.06);
          font-family: "DM Sans", sans-serif;
          font-size: 0.74rem;
          color: rgba(255,255,255,0.32);
          line-height: 1.5;
        }
        .evd-a11y-inline svg { margin-top: 2px; }

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
          line-height: 1;
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
          grid-template-columns: 3fr 2fr;
          gap: clamp(1.75rem, 4vw, 3.5rem);
          align-items: start;
          padding: clamp(2.5rem, 5vw, 4rem) 0 clamp(3rem, 6vw, 5rem);
        }
        .evd-dashboard-grid--single {
          grid-template-columns: 1fr;
        }

        /* Section rule — mirrors ProductionPageTemplate .section-block */
        .evd-section-block {
          border-top: 1px solid rgba(36,17,35,0.12);
          padding-top: 14px;
          margin-top: clamp(1.5rem, 3vw, 2rem);
        }

        /* Left column: description text */
        .evd-dashboard-left {
          display: flex;
          flex-direction: column;
        }
        .evd-dash-description {
          /* spacing via evd-section-block */
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
          gap: 0;
          margin-top: 18px;
        }
        .evd-video-frame-wrap {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 9;
          border-radius: 16px;
          overflow: hidden;
          background: #000;
          box-shadow: 0 12px 40px rgba(0,0,0,0.35);
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

        /* ── Voices-from section (mirrors drama-club elder + alumni quotes) ─── */
        .evd-voices-head {
          margin: 0.3rem 0 0.1rem;
        }

        /* Elder-quote shell (full-bleed image card with overlay + Anton quote) */
        .evd-elder-shell {
          position: relative;
          display: flex;
          align-items: flex-end;
          border-radius: 18px;
          overflow: hidden;
          min-height: 444px;
          background: radial-gradient(circle at top left, rgba(108,0,175,0.18), rgba(36,17,35,0.85));
          box-shadow: 0 14px 30px rgba(0,0,0,0.35);
        }
        /* Horizontal variant: landscape aspect ratio for left-column placement */
        .evd-elder-shell--horizontal {
          min-height: unset;
          aspect-ratio: 16 / 9;
        }
        .evd-elder-shell--has-image {
          cursor: default;
        }
        .evd-elder-bg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: saturate(1.1) contrast(1.05);
          transform: scale(1.03);
        }
        .evd-elder-overlay {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(
              to top,
              rgba(0,0,0,0.95) 0%,
              rgba(0,0,0,0.82) 0%,
              rgba(0,0,0,0.45) 32%,
              rgba(0,0,0,0.12) 65%,
              rgba(0,0,0,0) 100%
            ),
            radial-gradient(
              circle at 20% 82%,
              rgba(0,0,0,0.95) 0%,
              rgba(0,0,0,0.75) 0%,
              rgba(0,0,0,0) 65%
            ),
            radial-gradient(circle at 88% 12%, rgba(108,0,175,0.35), transparent 55%);
        }
        .evd-elder-content {
          position: relative;
          padding: 1.2rem 1.3rem 1.4rem;
          color: #f5f2ff;
          max-width: 90%;
          width: 100%;
          box-sizing: border-box;
        }
        .evd-elder-label {
          margin: 0 0 0.3rem;
          font-size: 0.68rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          opacity: 0.85;
          font-family: "Space Grotesk", sans-serif;
        }
        .evd-elder-text {
          margin: 0;
          font-size: 1.6rem;
          line-height: 1.55;
          text-shadow: 0 5px 16px rgba(0,0,0,0.9);
          font-family: var(--font-anton, "Anton", sans-serif);
        }
        .evd-elder-meta {
          margin-top: 0.45rem;
          font-size: 0.82rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          opacity: 0.92;
          font-family: "Space Grotesk", sans-serif;
        }
        .evd-elder-name {
          font-weight: 600;
        }

        /* Press/alumni quotes — dc-quote-block--alumni style */
        .evd-voices-quotes {
          display: flex;
          flex-direction: column;
          gap: 0.9rem;
          border-top: 1px solid rgba(36,17,35,0.12);
          padding-top: 14px;
        }
        .evd-voices-quote {
          margin: 0;
          padding: 0.9rem 1rem 1rem;
          border-radius: 14px;
          background: rgba(36,17,35,0.04);
          color: #241123;
          border: 1px solid rgba(36,17,35,0.08);
        }
        .evd-voices-blockquote {
          margin: 0;
          font-size: 1.4rem;
          line-height: 1.2;
          font-family: var(--font-anton, "Anton", sans-serif);
        }
        .evd-voices-figcaption {
          margin-top: 0.45rem;
          font-size: 0.8rem;
          opacity: 0.8;
          font-family: "Space Grotesk", sans-serif;
        }

        /* ── Community Impact section ───────────────────────────────────── */
        .evd-impact-clubs {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }
        .evd-impact-club-row {
          display: flex;
          align-items: center;
          gap: 0.9rem;
          text-decoration: none;
          transition: opacity 0.18s;
        }
        .evd-impact-club-row:hover { opacity: 0.82; }
        .evd-impact-club-copy { min-width: 0; }
        .evd-impact-support-eyebrow {
          font-family: "DM Sans", sans-serif;
          font-size: 0.6rem;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--evd-accent, #F23359);
          margin: 0 0 0.2rem;
        }
        .evd-impact-club-name {
          font-family: "Space Grotesk", sans-serif;
          font-size: 1rem;
          font-weight: 700;
          color: #241123;
          margin: 0 0 0.1rem;
          line-height: 1.2;
        }
        .evd-impact-club-loc {
          font-family: "Space Grotesk", sans-serif;
          font-size: 0.82rem;
          color: rgba(36,17,35,0.5);
          margin: 0;
        }
        .evd-impact-blurb {
          margin-top: 0.75rem;
          margin-bottom: 1rem;
        }
        .evd-impact-donate-btn {
          display: inline-block;
          margin-top: 0.5rem;
          padding: 0.7rem 1.5rem;
          background: #6c00af;
          color: #fff;
          font-family: "DM Sans", sans-serif;
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          text-decoration: none;
          border-radius: 10px;
          transition: transform 0.16s, box-shadow 0.16s, background 0.16s;
          box-shadow: 0 4px 18px rgba(108,0,175,0.3);
        }
        .evd-impact-donate-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 26px rgba(108,0,175,0.45);
          background: #8a00d9;
        }
        .evd-impact-donate-btn--secondary {
          background: transparent;
          color: #6c00af;
          border: 1.5px solid rgba(108,0,175,0.35);
          box-shadow: none;
          margin-top: 0.5rem;
          display: block;
        }
        .evd-impact-donate-btn--secondary:hover {
          background: rgba(108,0,175,0.06);
          border-color: #6c00af;
          box-shadow: none;
          transform: translateY(-1px);
        }

        /* Full-width video strip — below the two-column grid */
        .evd-dash-video--full {
          margin-top: clamp(1.5rem, 3vw, 2rem);
          padding-top: 14px;
          border-top: 1px solid rgba(36,17,35,0.12);
        }

        /* ── 3a. White card top title ──────────────────────────────────── */
        .evd-card-title {
          font-family: "DM Sans", sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--evd-accent, #F23359);
          margin: 0 0 1.5rem;
          opacity: 0.75;
        }

        /* ── 3b. White Content Card ────────────────────────────────────── */
        .evd-content-section {
          background: var(--evd-surface);
          /* Extra bottom padding so white card clears the DAT logo (121px above cycle-band top) */
          padding: clamp(1.5rem, 3vw, 2.5rem) 0 calc(140px + 2rem);
        }
        .evd-content-card {
          background: rgba(255,255,255,0.62);
          border-radius: 18px;
          box-shadow: 0 18px 48px rgba(36,17,35,0.12);
          border: 1px solid rgba(36,17,35,0.08);
          backdrop-filter: saturate(1.05);
          padding: clamp(1.5rem, 3.5vw, 2.8rem) clamp(1.5rem, 3.5vw, 2.8rem);
          overflow: hidden;
          position: relative;
          width: 90vw;
          max-width: 1200px;
          margin: 0 auto;
        }
        /* Category accent stripe across the top of the white card */
        .evd-content-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 5px;
          background: var(--evd-accent, #F23359);
          border-radius: 18px 18px 0 0;
        }

        /* Text color overrides inside white card */
        .evd-content-card .evd-body-paragraph {
          color: rgba(36,17,35,0.82);
        }
        .evd-content-card .evd-body-paragraph--lead {
          color: #241123;
        }
        .evd-content-card .evd-dash-tagline {
          color: var(--evd-accent);
        }
        .evd-content-card .evd-dash-club-support {
          background: rgba(36,17,35,0.05);
          border-color: rgba(36,17,35,0.10);
        }
        .evd-content-card .evd-dash-club-support-name {
          color: #241123;
        }
        .evd-content-card .evd-dash-club-support-loc {
          color: rgba(36,17,35,0.52);
        }
        /* Gallery inside card */
        .evd-card-gallery {
          margin-top: clamp(1.5rem, 3vw, 2rem);
          padding-top: 14px;
          border-top: 1px solid rgba(36,17,35,0.12);
        }

        /* Cast inside card */
        .evd-card-cast {
          margin-top: clamp(2rem, 4vw, 3rem);
          padding-top: clamp(2rem, 4vw, 3rem);
          border-top: 1px solid rgba(36,17,35,0.08);
        }
        .evd-content-card .evd-cast-head-rule {
          background: linear-gradient(to right, transparent, rgba(36,17,35,0.12) 40%, rgba(36,17,35,0.12) 60%, transparent);
        }
        /* Inside card: cast/creative heading matches evd-about-head style */
        .evd-content-card .evd-cast-head-label {
          font-family: "DM Sans", sans-serif;
          font-size: 0.86rem;
          font-weight: 300;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(36,17,35,0.55);
        }

        /* Creative team inside card */
        .evd-card-creative {
          margin-top: clamp(2rem, 4vw, 3rem);
          padding-top: clamp(2rem, 4vw, 3rem);
          border-top: 1px solid rgba(36,17,35,0.08);
        }
        .evd-content-card .evd-creative-label {
          color: rgba(36,17,35,0.45);
        }
        .evd-content-card .evd-creative-rule {
          background: rgba(36,17,35,0.10);
        }
        .evd-content-card .evd-credit-item {
          border-bottom-color: rgba(36,17,35,0.07);
        }
        .evd-content-card .evd-credit-role {
          color: rgba(36,17,35,0.45);
        }
        .evd-content-card .evd-credit-name {
          color: #241123;
        }
        .evd-content-card .evd-credit-link,
        .evd-content-card .evd-credit-link:link,
        .evd-content-card .evd-credit-link:visited {
          color: #6c00af;
        }
        .evd-content-card .evd-credit-link:hover {
          color: #F23359;
        }

        /* ── 3c. About section (stolen from /theatre/[slug]) ───────────── */
        .evd-about-head {
          font-family: "DM Sans", sans-serif;
          font-size: 0.86rem;
          text-transform: uppercase;
          letter-spacing: 0.22em;
          color: rgba(36,17,35,0.55);
          font-weight: 300;
          margin: 0 0 0.9rem; /* space between heading and content below */
        }
        .evd-voices-head {
          margin-top: 0;
        }
        .evd-tagline-inline {
          font-family: var(--font-rock-salt, cursive);
          font-weight: 400;
          line-height: 1.25;
          color: #F23359;
          font-size: clamp(1rem, 2.5vw, 1.65rem);
          word-break: break-word;
          margin: 0 0 1.25rem;
          text-align: center;
          display: block;
        }
        .evd-body-text {
          font-family: "Space Grotesk", sans-serif;
          font-size: 1.05rem;
          line-height: 1.66;
          color: rgba(36,17,35,0.88);
          margin: 0 0 1.1rem;
        }
        .evd-about-body {
          font-weight: 500;
          letter-spacing: 0.005em;
        }
        .evd-body-text:last-child { margin-bottom: 0; }

        /* ── 3d. Gallery inside card (PhotoRowGallery style) ───────────── */
        .evd-card-gallery-inner {
          /* intentionally no extra wrapper — prodrow styles handle everything */
        }
        /* prodrow-* styles (from ProductionPageTemplate, adapted for event card) */
        .evd-prodrow-block {
          margin-top: 0;
        }
        .evd-prodrow-head {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
          margin-bottom: 0.85rem;
        }
        .evd-prodrow-title {
          font-family: "DM Sans", sans-serif;
          font-size: 0.86rem;
          text-transform: uppercase;
          letter-spacing: 0.22em;
          color: rgba(36,17,35,0.55);
          font-weight: 300;
          margin: 0;
        }
        .evd-prodrow-credit {
          font-family: "DM Sans", sans-serif;
          font-size: 0.72rem;
          color: rgba(36,17,35,0.38);
          margin: 0;
        }
        .evd-prodrow-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }
        .evd-prodrow-card {
          border: none;
          background: transparent;
          padding: 0;
          cursor: zoom-in;
          border-radius: 8px;
          overflow: hidden;
          position: relative;
          aspect-ratio: 4 / 3;
        }
        .evd-prodrow-card::after {
          content: "";
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0);
          transition: background 0.18s;
          border-radius: 8px;
        }
        .evd-prodrow-card:hover::after { background: rgba(0,0,0,0.14); }
        .evd-prodrow-img-shell {
          width: 100%;
          height: 100%;
          position: relative;
          border-radius: 8px;
          overflow: hidden;
        }
        .evd-prodrow-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 0.65rem;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .evd-prodrow-toggle,
        .evd-prodrow-album {
          font-family: "DM Sans", sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #6c00af;
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          text-decoration: none;
          transition: color 0.18s;
        }
        .evd-prodrow-toggle:hover, .evd-prodrow-album:hover { color: #F23359; }

        /* Field gallery inside card (2-column) */
        .evd-fieldgrid-block {
          margin-top: 0;
        }
        .evd-fieldgrid-track {
          margin-top: 10px;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }
        .evd-fieldgrid-card {
          border: none;
          background: transparent;
          padding: 0;
          cursor: zoom-in;
          border-radius: 8px;
          overflow: hidden;
          position: relative;
        }
        .evd-fieldgrid-img-shell {
          width: 100%;
          aspect-ratio: 4 / 3;
          position: relative;
          border-radius: 8px;
          overflow: hidden;
          transition: transform 0.22s ease;
        }
        .evd-fieldgrid-card:hover .evd-fieldgrid-img-shell { transform: scale(1.03); }
        .evd-fieldgrid-footer {
          display: flex;
          justify-content: flex-end;
          margin-top: 0.65rem;
        }

        /* ── Bilingual CSS content switching ───────────────────────────── */
        /* Block-level: alternate language content hidden by default */
        .evd-bilingual-alt { display: none; }
        /* When :root[data-evd-lang="en"]: hide default, show EN */
        :root[data-evd-lang="en"] .evd-bilingual-default { display: none !important; }
        :root[data-evd-lang="en"] .evd-bilingual-alt.evd-bilingual-en { display: block !important; }
        /* Inline/flex wrap — use display:contents so text flows naturally */
        .evd-bilingual-wrap-default { display: contents; }
        .evd-bilingual-wrap-alt { display: none; }
        :root[data-evd-lang="en"] .evd-bilingual-wrap-default { display: none !important; }
        :root[data-evd-lang="en"] .evd-bilingual-wrap-alt.evd-bilingual-en { display: contents !important; }

        /* ── 8b. Cycle band: DAT logo sticker ──────────────────────────── */
        .evd-cycle-band { position: relative; }
        .evd-cycle-logo-sticker {
          position: absolute;
          top: -121px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 20;
          pointer-events: none;
        }
        .evd-cycle-logo-img {
          display: block;
          width: 242px;
          height: 242px;
          filter: drop-shadow(0 3px 14px rgba(0,0,0,0.45));
          opacity: 0.92;
        }

        /* ── 4. Photo Gallery ──────────────────────────────────────────── */
        /* Legacy band (kept for possible standalone use) */
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

        /* Portrait card grid — FeaturedAlumni style */
        .evd-cast-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
          gap: 2.5rem;
          justify-items: center;
        }
        .evd-cast-card-link {
          text-decoration: none;
          color: inherit;
          display: flex;
          justify-content: center;
          width: 100%;
        }
        .evd-cast-card {
          background: #f2f2f2;
          border-radius: 8px;
          box-shadow: 4px 8px 16px rgba(0,0,0,0.30);
          overflow: hidden;
          width: 100%;
          max-width: 240px;
          display: flex;
          flex-direction: column;
          padding: 0.75rem;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          cursor: default;
        }
        .evd-cast-card-link:hover .evd-cast-card,
        .evd-cast-card-link:focus-visible .evd-cast-card {
          transform: translateY(-10px) rotate(-1.5deg) scale(1.05);
          box-shadow: 0 22px 44px rgba(0,0,0,0.40);
          cursor: pointer;
        }
        .evd-cast-photo-wrap {
          width: 100%;
          aspect-ratio: 4 / 5;
          overflow: hidden;
          position: relative;
          border-radius: 4px;
          margin-bottom: 0.75rem;
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
          background: #d8d8d8;
          color: rgba(0,0,0,0.2);
        }
        .evd-cast-role {
          font-family: "DM Sans", sans-serif;
          font-size: 0.82rem;
          font-weight: 600;
          color: #6C00AF;
          margin: 0 0 0.2rem;
          text-align: center;
        }
        .evd-cast-name {
          font-family: "Space Grotesk", sans-serif;
          font-size: 1.05rem;
          font-weight: 600;
          color: #241123;
          margin: 0;
          line-height: 1.25;
          text-align: center;
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
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.45);
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
          padding: 1.1rem 1.25rem 1.1rem 0;
          border-bottom: 1px solid rgba(255,255,255,0.055);
          text-align: center;
        }
        .evd-credit-role {
          font-family: "DM Sans", sans-serif;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.35);
          margin: 0 0 0.35rem;
        }
        .evd-credit-name {
          font-family: "Space Grotesk", sans-serif;
          font-size: 1.08rem;
          font-weight: 800;
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
          padding: clamp(2rem, 3vw, 3rem) 0 clamp(2.5rem, 5vw, 4rem);
          border-top: 1px solid rgba(255,255,255,0.06);
        }

        /* Outer wrapper — gives vertical room for card lift + glow without clipping */
        .evd-cycle-scroll-outer {
          overflow-x: auto;
          overflow-y: visible;
          margin-top: 1.5rem;
          /* Negative vertical margins so the padding doesn't shift layout */
          padding-top: 0.75rem;
          margin-top: calc(1.5rem - 0.75rem);
          padding-bottom: 2.5rem;
          margin-bottom: -2.5rem;
        }
        /* Horizontal scroll of production cards */
        .evd-cycle-scroll {
          display: flex;
          gap: 1.25rem;
          padding: 0.25rem 0.25rem 0.25rem;
          min-width: max-content;
        }
        .evd-cycle-scroll .evd-cycle-card {
          flex-shrink: 0;
          width: 240px;
        }
        .evd-cycle-card {
          text-decoration: none;
          border-radius: 12px;
          overflow: visible;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          display: flex;
          flex-direction: column;
          transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
        }
        /* Clip image corners without clipping outer glow */
        .evd-cycle-img {
          border-radius: 11px 11px 0 0;
          overflow: hidden;
        }
        .evd-cycle-body {
          border-radius: 0 0 11px 11px;
        }
        .evd-cycle-card:hover {
          transform: translateY(-6px);
          border-color: rgba(242,51,89,0.35);
          box-shadow: 0 16px 48px rgba(242,51,89,0.28), 0 4px 16px rgba(0,0,0,0.4);
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
          position: relative;
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
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-family: "DM Sans", sans-serif;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.65);
          background: transparent;
          border: 1.5px solid rgba(255,255,255,0.18);
          border-radius: 9px;
          padding: 0.42rem 0.9rem;
          margin-top: 0.6rem;
          transition: border-color 0.18s, color 0.18s;
        }
        .evd-cycle-card:hover .evd-cycle-link {
          border-color: rgba(242,51,89,0.45);
          color: #fff;
        }
        /* Status badge — sits on the card image */
        .evd-cycle-badge {
          position: absolute;
          top: 0.55rem;
          left: 0.55rem;
          font-family: "DM Sans", sans-serif;
          font-size: 0.58rem;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          padding: 0.2rem 0.55rem;
          border-radius: 999px;
          border: 1px solid;
          backdrop-filter: blur(4px);
        }
        /* ARCHIVE — muted */
        .evd-cycle-badge--archive {
          color: rgba(255,255,255,0.7);
          background: rgba(0,0,0,0.48);
          border-color: rgba(255,255,255,0.18);
        }
        /* UPCOMING — amber/gold */
        .evd-cycle-badge--upcoming {
          color: #D9A919;
          background: rgba(217,169,25,0.14);
          border-color: rgba(217,169,25,0.5);
        }
        /* NOW PLAYING — green */
        .evd-cycle-badge--nowplaying {
          color: #2FA873;
          background: rgba(47,168,115,0.14);
          border-color: rgba(47,168,115,0.5);
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
          background: #0e3d25;
          background-image:
            radial-gradient(ellipse 80% 80% at 0% 100%, rgba(20,100,55,0.45) 0%, transparent 70%),
            radial-gradient(ellipse 60% 60% at 100% 0%, rgba(20,100,55,0.25) 0%, transparent 70%);
          padding: clamp(3rem, 6vw, 5rem) 0;
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        .evd-rel-events-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
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
          border-color: var(--evd-rel-glow, var(--evd-accent));
          box-shadow:
            0 12px 32px rgba(0,0,0,0.4),
            0 0 0 1px var(--evd-rel-glow, var(--evd-accent)),
            0 0 28px -4px var(--evd-rel-glow, var(--evd-accent));
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
          color: var(--evd-rel-glow, var(--evd-accent));
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
          align-items: center;
          flex-wrap: wrap;
          gap: 0.75rem;
        }
        .evd-rel-footer-nav {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          flex: 1;
        }
        .evd-rel-all-events-btn {
          flex-shrink: 0;
          margin-left: auto;
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
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          text-decoration: none;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          transition: opacity 0.2s, transform 0.18s, box-shadow 0.2s;
          white-space: nowrap;
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
        /* Gallery and cycle scroll containers */
        .evd-cycle-scroll-outer,
        .evd-gallery-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.10) transparent;
          -webkit-overflow-scrolling: touch;
        }
        .evd-cycle-scroll-outer::-webkit-scrollbar,
        .evd-gallery-scroll::-webkit-scrollbar { height: 4px; }
        .evd-cycle-scroll-outer::-webkit-scrollbar-track,
        .evd-gallery-scroll::-webkit-scrollbar-track { background: transparent; }
        .evd-cycle-scroll-outer::-webkit-scrollbar-thumb,
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
            white-space: normal;
            word-break: break-word;
          }
          .evd-ticket-bar-inner {
            flex-direction: column;
            align-items: flex-start;
            gap: 1.25rem;
          }
          .evd-ticket-purchase {
            align-items: stretch;
            width: 100%;
            flex-wrap: wrap;
          }
          .evd-btn-ticket {
            width: 100%;
            justify-content: center;
          }
          .evd-actions {
            flex-direction: column;
            align-items: stretch;
          }
          .evd-btn,
          .evd-btn-ghost {
            width: 100%;
          }
          /* Scale DAT logo down on mobile */
          .evd-cycle-logo-img {
            width: 160px;
            height: 160px;
          }
          .evd-cycle-logo-sticker {
            top: -80px;
          }
        }
      `}</style>
    </>
  );
}
