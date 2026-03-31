// components/productions/ProductionPageTemplate.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, type ReactNode, type CSSProperties } from "react";
import type { DatEvent } from "@/lib/events";
import {
  formatDateRange,
  shortMonth,
  dayOfMonth,
  eventYear,
  categoryMeta,
  productionEventStatus,
} from "@/lib/events";

import { DATButtonLink } from "@/components/ui/DATButton";
import ProductionTagButtons from "@/components/ui/ProductionTagButtons";
import DramaClubBadge from "@/components/ui/DramaClubBadge";
import ProcessBand from "@/components/productions/ProcessBand";
import type { RelatedItem } from "@/lib/buildRelated";
import Lightbox from "@/components/shared/Lightbox";

/* -------------------------- Types -------------------------- */
export type GalleryImage = { src: string; alt?: string };

export type PersonRole = {
  role: string;
  name: string;
  href?: string;
  dramaClubSlug?: string;
};

type InputImage = GalleryImage;
type SafeImage = { src: string; alt: string };

type CreditPerson = { name?: string; href?: string };

export type ResourceLink = { label?: string; href?: string };

/** Must stay structurally compatible with ProcessSlide in ProcessBand.tsx */
type ProcessSlice = {
  heading?: string;
  body?: string | string[];
  image?: InputImage;
  videoUrl?: string;
  videoTitle?: string;
  videoPoster?: string;
  align?: "left" | "right";
  quote?: { text: string; attribution?: string };
};

type CauseForTemplate = {
  label?: string;
  iconSrc?: string;
  iconAlt?: string;
  href?: string;
};

type PartnerForTemplate = {
  name?: string;
  href?: string;
  type?: "community" | "artistic" | "impact" | "primary";
  logoSrc?: string;
  logoAlt?: string;
};

export interface ProductionPageTemplateProps {
  title: string;
  originalTitle?: string;

  // Season / hero
  seasonLabel?: string;
  seasonHref?: string;
  subtitle?: string;

  // Credits
  creditPrefix?: string;
  creditPeople?: CreditPerson[];
  playwright?: string;
  playwrightHref?: string;

  // Meta
  dates?: string;
  festival?: string;
  festivalHref?: string;
  venue?: string;
  venueHref?: string;
  city?: string;
  location?: string;
  runtime?: string;
  ageRecommendation?: string;

  runStartISO?: string;
  runEndISO?: string;

  // Hero
  heroImageUrl?: string;
  heroImageAlt?: string;

  // Body
  synopsis?: string | string[];
  themes?: string[];
  pullQuote?: {
    quote: string;
    attribution?: string;
    attributionHref?: string;
  };
  quoteImageUrl?: string;

  // Roster
  creativeTeam?: Array<{
    role?: string;
    name?: string;
    href?: string;
    dramaClubSlug?: string;
  }>;
  cast?: Array<{
    role?: string;
    name?: string;
    href?: string;
    dramaClubSlug?: string;
  }>;

  // Media
  galleryImages?: GalleryImage[];
  productionPhotographer?: string | null;
  productionAlbumHref?: string | null;
  productionAlbumLabel?: string | null;

  fieldGalleryImages?: GalleryImage[];
  fieldGalleryTitle?: string;
  fieldAlbumHref?: string | null;
  fieldAlbumLabel?: string | null;

  // Community / Supporters
  dramaClubName?: string;
  dramaClubLocation?: string;
  dramaClubLink?: string;

  causes?: CauseForTemplate[];
  partners?: PartnerForTemplate[];

  // CTAs
  getInvolvedLink?: string;
  donateLink?: string;
  donateProductionSlug?: string;
  ticketsLink?: string;
  notifyMeUrl?: string;

  // Process
  processSections?: ProcessSlice[];

  // Related
  relatedItems?: RelatedItem[];
  relatedProductions?: RelatedItem[];
  relatedTitle?: string;

  // Misc
  resources?: ResourceLink[];
  autoLinkPeopleBase?: string;
  renderAfterHero?: ReactNode;

  /** Events linked to this production via lib/events.ts (production field = slug) */
  productionEvents?: DatEvent[];

  /** Manual override to force the ARCHIVE status badge */
  forceArchive?: boolean;
}

/* ----------------------- Utilities ------------------------- */
const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const isExternal = (href?: string) => !!href && /^(https?:)?\/\//i.test(href);

const cleanStr = (v?: string | null): string | undefined => {
  const t = (v ?? "").trim();
  return t.length ? t : undefined;
};

const cleanHref = (v?: string | null): string | undefined => {
  const t = (v ?? "").trim();
  return t.length ? t : undefined;
};

const stripHtml = (s: string) =>
  s
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const isMeaningfulText = (s: string) => stripHtml(s).length > 0;

const normalize = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();

/* -------------------- Small Components --------------------- */
function SmartLink({
  href,
  className,
  children,
  newTabIfExternal = false,
  style,
  "aria-label": ariaLabel,
}: {
  href: string;
  className?: string;
  children: ReactNode;
  newTabIfExternal?: boolean;
  style?: CSSProperties;
  "aria-label"?: string;
}) {
  const external = isExternal(href);
  if (external) {
    const rel = newTabIfExternal ? "noreferrer" : undefined;
    const target = newTabIfExternal ? "_blank" : undefined;
    return (
      <a
        href={href}
        className={className}
        target={target}
        rel={rel}
        style={style}
        aria-label={ariaLabel}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className} style={style} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}

function NameCell({
  name,
  href,
  dramaClubSlug,
  base = "/alumni",
}: {
  name: string;
  href?: string;
  dramaClubSlug?: string;
  base?: string;
}) {
  const safeName = cleanStr(name);
  if (!safeName) return null;

  const finalHref =
    cleanHref(href) ??
    (cleanStr(dramaClubSlug)
      ? `/drama-club/${dramaClubSlug}`
      : `${base}/${slugify(safeName)}`);

  return (
    <Link
      href={finalHref}
      className="namecell no-underline transition-colors"
      style={{ textDecoration: "none" }}
    >
      {safeName}
    </Link>
  );
}

function parseHeroTitle(raw: string): { main: string; variant?: string } {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return { main: "" };

  const ddIndex = trimmed.indexOf("--");

  let mainPart = trimmed;
  let rest: string | undefined;

  if (ddIndex !== -1) {
    mainPart = trimmed.slice(0, ddIndex);
    rest = trimmed.slice(ddIndex + 2);
  }

  mainPart = mainPart.replace(/\s+/g, " ").trim();

  let variant: string | undefined;
  if (rest) {
    const r = rest.trim().replace(/\s+/g, " ");
    const parenMatch = r.match(/^(.*)\(([^)]+)\)\s*$/);
    if (parenMatch) {
      const before = parenMatch[1].trim();
      const inside = parenMatch[2].trim();
      if (before && inside) variant = `${before}, ${inside}`;
      else if (before) variant = before;
      else if (inside) variant = inside;
    } else {
      variant = r;
    }
  }

  return { main: mainPart || trimmed, variant };
}

function inferIsPastRun(dates?: string): boolean {
  const d = cleanStr(dates);
  if (!d) return false;

  const lower = d.toLowerCase();
  if (lower.includes("original production")) return true;

  const yearMatches = d.match(/\b(19|20)\d{2}\b/g);
  if (!yearMatches) return false;

  const years = yearMatches.map((y) => parseInt(y, 10));
  const latestYear = Math.max(...years);
  const currentYear = new Date().getFullYear();

  return latestYear < currentYear;
}

function PartnerLogoShell({ src, alt }: { src?: string; alt: string }) {
  const [isBroken, setIsBroken] = useState(false);
  const safeSrc = cleanStr(src);
  if (!safeSrc || isBroken) return null;

  return (
    <div className="partner-logo-shell">
      <Image
        src={safeSrc}
        alt={alt}
        width={58}
        height={58}
        className="partner-logo"
        loading="lazy"
        onError={() => setIsBroken(true)}
      />
    </div>
  );
}

function RelatedCard({ item }: { item: RelatedItem }) {
  const href =
    item.kind === "project" ? `/project/${item.slug}` : `/theatre/${item.slug}`;

  const [imgSrc, setImgSrc] = useState<string>(
    cleanStr(item.heroImageUrl)
      ? (item.heroImageUrl as string)
      : "/posters/fallback-16x9.jpg"
  );

  const handleError = () => {
    if (imgSrc !== "/posters/fallback-16x9.jpg")
      setImgSrc("/posters/fallback-16x9.jpg");
  };

  return (
    <Link
      href={href}
      className="related-card no-underline"
      aria-label={item.title}
    >
      <div className="related-image-shell">
        <Image
          src={imgSrc}
          alt={item.title}
          fill
          sizes="(max-width: 900px) 86vw, 340px"
          className="object-cover"
          onError={handleError}
        />
      </div>

      <div className="related-meta">
        <div className="related-title">{item.title}</div>

        {(item.seasonLabel || item.dates) && (
          <div className="related-sub">
            {[item.seasonLabel, item.dates].filter(Boolean).join(" • ")}
          </div>
        )}
      </div>
    </Link>
  );
}

/* ---------------- Field Gallery ---------------- */
function FieldGridGallery({
  title,
  images,
  albumHref,
  albumLabel,
}: {
  title?: string;
  images: InputImage[];
  albumHref?: string | null;
  albumLabel?: string | null;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);

  const safeTitle = cleanStr(title);

  const safeImages = useMemo<SafeImage[]>(() => {
    return (images ?? []).flatMap((img) => {
      const src = cleanStr(img?.src);
      if (!src) return [];
      const alt = cleanStr(img?.alt) ?? "";
      return [{ src, alt }];
    });
  }, [images]);

  if (!safeImages.length) return null;

  const collapsedImages = safeImages.slice(0, 2);
  const hasMoreThanTwo = safeImages.length > 2;
  const visibleImages = expanded ? safeImages : collapsedImages;

  const albumHrefSafe = cleanHref(albumHref ?? undefined);
  const baseLabel = cleanStr(albumLabel ?? undefined) ?? "OPEN FULL ALBUM";
  const albumLabelText = `${baseLabel} ↗`;

  return (
    <section className="section-block section-block-indent fieldgrid-block">
      <h2 className="section-head fieldgrid-head">From the Field</h2>

      <div
        className="fieldgrid-track"
        aria-label="From the Field photos"
        role="list"
      >
        {visibleImages.map((img, i) => (
          <button
            key={`${img.src}-${i}`}
            className="fieldgrid-card"
            onClick={() => setOpen(i)}
            aria-label={`Open photo ${i + 1}`}
            type="button"
            role="listitem"
          >
            <div className="fieldgrid-img-shell glare-sheen">
              <Image
                src={img.src}
                alt={img.alt || safeTitle || "From the Field"}
                fill
                sizes="(max-width: 900px) 44vw, 240px"
                className="object-cover"
              />
            </div>
          </button>
        ))}
      </div>

      <div className="fieldgrid-footer">
        {hasMoreThanTwo && (
          <button
            type="button"
            className="meta-link fieldgrid-toggle"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
          >
            {expanded ? "SEE LESS" : "SEE MORE"}
          </button>
        )}

        {albumHrefSafe && (
          <SmartLink
            href={albumHrefSafe}
            className="meta-link fieldgrid-album-link"
            newTabIfExternal
          >
            {albumLabelText}
          </SmartLink>
        )}
      </div>

      {open !== null && (
        <Lightbox
          images={safeImages.map((i) => i.src)}
          startIndex={open}
          onClose={() => setOpen(null)}
        />
      )}
    </section>
  );
}

/* ---------------- Production Gallery ---------------- */
function PhotoRowGallery({
  title,
  images,
  albumHref,
  albumLabel,
  photographer,
  photographerHref,
  maxVisible = 9,
}: {
  title: string;
  images: InputImage[];
  albumHref?: string | null;
  albumLabel?: string | null;
  photographer?: string | null;
  photographerHref?: string | null;
  maxVisible?: number;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);

  const safeTitle = cleanStr(title) ?? "Production Gallery";

  const safeImages = useMemo<SafeImage[]>(() => {
    return (images ?? []).flatMap((img) => {
      const src = cleanStr(img?.src);
      if (!src) return [];
      const alt = cleanStr(img?.alt) ?? "";
      return [{ src, alt }];
    });
  }, [images]);

  if (!safeImages.length) return null;

  const hasMore = safeImages.length > maxVisible;
  const visible = expanded ? safeImages : safeImages.slice(0, maxVisible);

  const albumHrefSafe = cleanHref(albumHref ?? undefined);
  const baseLabel = cleanStr(albumLabel ?? undefined) ?? "OPEN FULL ALBUM";
  const albumLabelText = `${baseLabel} ↗`;

  const photographerSafe = cleanStr(photographer ?? undefined);
  const photographerHrefSafe = cleanHref(photographerHref ?? undefined);

  return (
    <div className="prodrow-block" aria-label={`${safeTitle} photos`}>
      <div className="prodrow-head">
        <h3 className="section-head prodrow-title">{safeTitle}</h3>

        {photographerSafe && (
          <div className="prodrow-credit">
            Photos by{" "}
            {photographerHrefSafe ? (
              <Link href={photographerHrefSafe} className="meta-link">
                {photographerSafe}
              </Link>
            ) : (
              photographerSafe
            )}
          </div>
        )}
      </div>

      <div className="prodrow-grid" role="list">
        {visible.map((img, i) => (
          <button
            key={`${img.src}-${i}`}
            className="prodrow-card"
            onClick={() => setOpen(i)}
            aria-label={`Open photo ${i + 1}`}
            type="button"
            role="listitem"
          >
            <div className="prodrow-img-shell glare-sheen">
              <Image
                src={img.src}
                alt={img.alt || safeTitle}
                fill
                sizes="(max-width: 900px) 92vw, (max-width: 1200px) 30vw, 360px"
                className="object-cover"
              />
            </div>
          </button>
        ))}
      </div>

      <div className="prodrow-footer">
        <div className="prodrow-footer-left">
          {hasMore && (
            <button
              type="button"
              className="meta-link prodrow-toggle"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
            >
              {expanded ? "SEE LESS" : "SEE MORE"}
            </button>
          )}
        </div>

        <div className="prodrow-footer-right">
          {albumHrefSafe && (
            <SmartLink href={albumHrefSafe} className="meta-link" newTabIfExternal>
              {albumLabelText}
            </SmartLink>
          )}
        </div>
      </div>

      {open !== null && (
        <Lightbox
          images={safeImages.map((i) => i.src)}
          startIndex={open}
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  );
}

function hasRenderableProcess(sections?: ProcessSlice[]) {
  if (!Array.isArray(sections) || sections.length === 0) return false;

  return sections.some((s) => {
    if (s.heading?.trim()) return true;

    if (typeof s.body === "string" && s.body.trim()) return true;
    if (Array.isArray(s.body) && s.body.some((b) => b.trim())) return true;

    if (s.image?.src?.trim()) return true;
    if (s.videoUrl?.trim()) return true;

    if (s.quote?.text?.trim() || s.quote?.attribution?.trim()) return true;

    return false;
  });
}


/* ===================== PROD EVENTS SECTION ================= */
function ProdEventCard({ event }: { event: DatEvent }) {
  const meta = categoryMeta[event.category];
  const hasImage = !!event.image;
  const upcomingPerfs = event.status === "upcoming";
  const dateLabel = formatDateRange(event.date, event.endDate);
  const day = dayOfMonth(event.date);
  const mon = shortMonth(event.date);
  const yr = eventYear(event.date);
  const endDay = event.endDate ? dayOfMonth(event.endDate) : null;
  const endMon = event.endDate ? shortMonth(event.endDate) : null;
  const sameMonth =
    event.endDate &&
    shortMonth(event.date) === shortMonth(event.endDate) &&
    eventYear(event.date) === eventYear(event.endDate);

  return (
    <div className="pev-card">
      {hasImage && (
        <div className="pev-card-img-shell">
          <Image
            src={event.image!}
            alt={event.title}
            fill
            sizes="(max-width: 700px) 100vw, 400px"
            className="pev-card-img object-cover"
          />
          <div className="pev-card-img-gradient" />
        </div>
      )}

      <div className="pev-card-body">
        {/* Date stamp */}
        <div className="pev-date-block">
          <span className="pev-date-day">{day}</span>
          {endDay && !sameMonth ? (
            <span className="pev-date-mon">{mon} – {endMon}</span>
          ) : endDay && sameMonth ? (
            <span className="pev-date-mon">{mon} {day}–{endDay}</span>
          ) : (
            <span className="pev-date-mon">{mon}</span>
          )}
          <span className="pev-date-yr">{yr}</span>
        </div>

        {/* Category pill */}
        <div className="pev-cat-pill" style={{ background: `${meta.color}22`, borderColor: `${meta.color}55`, color: meta.color }}>
          {meta.eyebrow}
        </div>

        {/* Venue */}
        <p className="pev-venue">{event.venue}</p>
        <p className="pev-city">{event.city}{event.country !== "Online" ? `, ${event.country}` : ""}</p>

        {event.time && <p className="pev-time">{event.doors ?? event.time}</p>}

        <p className="pev-desc">{event.description}</p>

        <div className="pev-card-footer">
          {event.ticketUrl && upcomingPerfs ? (
            <a
              href={event.ticketUrl}
              target="_blank"
              rel="noreferrer"
              className="pev-ticket-btn"
            >
              {event.ticketPrice ? `Tickets · ${event.ticketPrice}` : "Get Tickets →"}
            </a>
          ) : (
            <span className="pev-ticket-pill">
              {event.ticketType === "free" ? "Free" : event.ticketType === "pay-what-you-can" ? "Pay What You Can" : event.ticketPrice ?? ""}
            </span>
          )}
          <Link href={`/events/${event.category === "performance" ? "performances" : event.category === "festival" ? "festivals" : "fundraisers"}`} className="pev-cat-link">
            All {meta.label}s →
          </Link>
        </div>
      </div>
    </div>
  );
}

function ProdEventsSection({
  events,
  productionTitle,
}: {
  events: DatEvent[];
  productionTitle: string;
}) {
  const upcoming = events.filter((e) => e.status === "upcoming");
  const past = events.filter((e) => e.status === "past");
  const hasUpcoming = upcoming.length > 0;

  return (
    <section className="pev-section">
      {/* Atmospheric glow */}
      <div className="pev-glow pev-glow-left" />
      <div className="pev-glow pev-glow-right" />

      <div className="pev-inner">
        <div className="pev-head">
          <p className="pev-eyebrow">SEE IT LIVE</p>
          <h2 className="pev-title">
            {hasUpcoming ? "Catch It Live" : "Performance History"}
          </h2>
          {hasUpcoming && (
            <p className="pev-subtitle">
              {productionTitle} is on stage. Book your place.
            </p>
          )}
        </div>

        {/* Upcoming event cards */}
        {upcoming.length > 0 && (
          <div className="pev-grid">
            {upcoming.map((e) => (
              <ProdEventCard key={e.id} event={e} />
            ))}
          </div>
        )}

        {/* Past runs — compact list */}
        {past.length > 0 && (
          <div className="pev-past-wrap">
            <p className="pev-past-head">
              {hasUpcoming ? "Past Runs" : "Where It's Been"}
            </p>
            <ul className="pev-past-list">
              {past.map((e) => (
                <li key={e.id} className="pev-past-item">
                  <span className="pev-past-year">{eventYear(e.date)}</span>
                  <span className="pev-past-info">
                    {e.venue} · {e.city}
                    {e.endDate
                      ? ` · ${formatDateRange(e.date, e.endDate)}`
                      : ` · ${formatDateRange(e.date)}`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="pev-footer-link">
          <Link href="/events" className="pev-all-events-link">
            Browse All DAT Events →
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ======================= COMPONENT ========================= */
export default function ProductionPageTemplate(props: ProductionPageTemplateProps) {
  const {
    title,
    originalTitle,
    seasonLabel,
    seasonHref,
    subtitle,

    creditPrefix,
    creditPeople,
    playwright,
    playwrightHref,

    dates,
    festival,
    festivalHref,
    venue,
    venueHref,
    city,
    location,
    runtime,
    ageRecommendation,

    runStartISO,
    runEndISO,

    heroImageUrl,
    heroImageAlt,

    synopsis,
    themes,
    pullQuote,
    quoteImageUrl,

    creativeTeam,
    cast,

    galleryImages,
    productionPhotographer,
    productionAlbumHref,
    productionAlbumLabel,

    fieldGalleryImages,
    fieldGalleryTitle,
    fieldAlbumHref,
    fieldAlbumLabel,

    dramaClubName,
    dramaClubLocation,
    dramaClubLink,

    causes,
    partners,

    getInvolvedLink,
    donateLink,
    donateProductionSlug,
    ticketsLink,

    processSections,

    relatedTitle = "Related Plays & Projects",
    relatedItems,
    relatedProductions,

    resources,
    autoLinkPeopleBase = "/alumni",
    renderAfterHero,
    productionEvents,
    forceArchive = false,
  } = props;

  const titleText = cleanStr(title) ?? "";
  const originalTitleText = cleanStr(originalTitle);
  const seasonLabelText = cleanStr(seasonLabel);
  const seasonHrefText = cleanHref(seasonHref);
  const subtitleText = cleanStr(subtitle);

  const datesText = cleanStr(dates);
  const festivalText = cleanStr(festival);
  const festivalHrefText = cleanHref(festivalHref);

  const venueText = cleanStr(venue);
  const venueHrefText = cleanHref(venueHref);

  const cityText = cleanStr(city);
  const locationText = cleanStr(location);

  const runtimeText = cleanStr(runtime);
  const ageRecText = cleanStr(ageRecommendation);

  const heroImageUrlText = cleanHref(heroImageUrl);
  const heroImageAltText = cleanStr(heroImageAlt);

  const donateLinkText = cleanHref(donateLink);
  const donateProductionSlugText = cleanStr(donateProductionSlug);
  const getInvolvedLinkText = cleanHref(getInvolvedLink);
  const ticketsLinkText = cleanHref(ticketsLink);

  const dramaClubNameText = cleanStr(dramaClubName);
  const dramaClubLocationText = cleanStr(dramaClubLocation);
  const dramaClubLinkText = cleanHref(dramaClubLink);

  const [heroBroken, setHeroBroken] = useState(false);
  const heroSrc: string =
    !heroBroken && heroImageUrlText ? heroImageUrlText : "/posters/fallback-16x9.jpg";

  const { main: heroTitleMain, variant: heroTitleVariant } = parseHeroTitle(titleText);
  const displayTitle = heroTitleMain;

  const safeThemes = (themes ?? []).flatMap((t) => {
    const v = cleanStr(t);
    return v ? [v] : [];
  });
  const hasThemes = safeThemes.length > 0;

  const safeCast = useMemo<PersonRole[]>(() => {
    return (cast ?? []).flatMap((m) => {
      const role = cleanStr(m?.role);
      const name = cleanStr(m?.name);
      if (!role || !name) return [];
      const href = cleanHref(m?.href);
      const dramaClubSlug = cleanStr(m?.dramaClubSlug);
      return [
        {
          role,
          name,
          ...(href ? { href } : {}),
          ...(dramaClubSlug ? { dramaClubSlug } : {}),
        },
      ];
    });
  }, [cast]);

  const safeCreativeTeam = useMemo<PersonRole[]>(() => {
    return (creativeTeam ?? []).flatMap((m) => {
      const role = cleanStr(m?.role);
      const name = cleanStr(m?.name);
      if (!role || !name) return [];
      const href = cleanHref(m?.href);
      const dramaClubSlug = cleanStr(m?.dramaClubSlug);
      return [
        {
          role,
          name,
          ...(href ? { href } : {}),
          ...(dramaClubSlug ? { dramaClubSlug } : {}),
        },
      ];
    });
  }, [creativeTeam]);

  const hasCast = safeCast.length > 0;
  const hasCreativeTeam = safeCreativeTeam.length > 0;

  const synopsisParas: string[] = (() => {
    if (!synopsis) return [];
    if (Array.isArray(synopsis)) {
      return synopsis
        .flatMap((s) => {
          const v = typeof s === "string" ? s.trim() : "";
          return v ? [v] : [];
        })
        .filter(isMeaningfulText);
    }
    if (typeof synopsis === "string") {
      const raw = synopsis.trim();
      if (!raw) return [];
      return raw
        .split(/\n{2,}/)
        .map((s) => s.trim())
        .filter(Boolean)
        .filter(isMeaningfulText);
    }
    return [];
  })();

  const hasSynopsis = synopsisParas.length > 0;

  const gallery = useMemo<InputImage[]>(() => galleryImages ?? [], [galleryImages]);
  const fieldGalleryRaw = useMemo<InputImage[]>(
    () => fieldGalleryImages ?? [],
    [fieldGalleryImages]
  );

  const hasMainGallery = (gallery ?? []).some((g) => !!cleanStr(g?.src));
  const hasFieldGalleryRaw = (fieldGalleryRaw ?? []).some((g) => !!cleanStr(g?.src));

  const fallbackFieldFromMain = useMemo<InputImage[]>(() => {
    const picked: InputImage[] = [];
    for (const img of gallery ?? []) {
      const src = cleanStr(img?.src);
      if (!src) continue;
      picked.push({ src, alt: img?.alt });
      if (picked.length >= 3) break;
    }
    return picked;
  }, [gallery]);

  const fieldGallery: InputImage[] = hasFieldGalleryRaw ? fieldGalleryRaw : fallbackFieldFromMain;
  const hasFieldGallery = fieldGallery.some((g) => !!cleanStr(g?.src));

  // ✅ PROCESS: normalize + drop placeholder/empty slides
  const safeProcessSections = useMemo<ProcessSlice[]>(() => {
    const slides = (processSections ?? []).flatMap((s) => {
      const heading = cleanStr(s?.heading);

      const bodyText = Array.isArray(s?.body)
        ? s.body.map((x) => cleanStr(x)).filter(Boolean).join(" ")
        : cleanStr(typeof s?.body === "string" ? s.body : "");

      const quoteText = cleanStr(s?.quote?.text);
      const quoteAttr = cleanStr(s?.quote?.attribution);

      const imageSrc = cleanHref(s?.image?.src);
      const videoUrl = cleanHref(s?.videoUrl);
      const videoPoster = cleanHref(s?.videoPoster);
      const videoTitle = cleanStr(s?.videoTitle);

      const hasText = !!heading || !!bodyText || !!quoteText || !!quoteAttr;
      const hasMedia = !!imageSrc || !!videoUrl;

      if (!hasText && !hasMedia) return [];

      const cleaned: ProcessSlice = {
        ...s,
        heading,
        body: bodyText ? s.body : undefined,
        image: imageSrc ? { src: imageSrc, alt: cleanStr(s?.image?.alt) } : undefined,
        videoUrl,
        videoTitle,
        videoPoster,
        quote: quoteText ? { text: quoteText, attribution: quoteAttr } : undefined,
      };

      return [cleaned];
    });

    return slides;
  }, [processSections]);

  const hasProcess = hasRenderableProcess(safeProcessSections);

  const safeResources = (resources ?? []).flatMap((r) => {
  const label = cleanStr(r?.label);
  if (!label) return [];
  const href = cleanHref(r?.href);
  return [{ label, href }]; // ✅ keep label regardless
});
  const hasResources = safeResources.length > 0;

  const safeCauses = (causes ?? []).flatMap((c) => {
    const label = cleanStr(c?.label);
    if (!label) return [];
    const href = cleanHref(c?.href);
    return [{ label, ...(href ? { href } : {}) }];
  });
  const hasCauses = safeCauses.length > 0;

    const safePartners = (partners ?? []).flatMap((p) => {
    const name = cleanStr(p?.name);
    if (!name) return [];

    const href = cleanHref(p?.href); // ✅ optional
    const logoSrc = cleanStr(p?.logoSrc);
    const logoAlt = cleanStr(p?.logoAlt);

    return [
      {
        name,
        ...(href ? { href } : {}),
        ...(logoSrc ? { logoSrc } : {}),
        ...(logoAlt ? { logoAlt } : {}),
      },
    ];
  });
  const hasPartners = safePartners.length > 0;


  const relatedList: RelatedItem[] = (relatedItems ?? relatedProductions ?? []).filter(
    (ri) => !!ri && !!ri.slug && !!ri.title
  );
  const hasRelated = relatedList.length > 0;

  const hasRealPhotographer =
    typeof productionPhotographer === "string" && productionPhotographer.trim().length > 0;

  const photographerDisplay = hasRealPhotographer ? productionPhotographer!.trim() : undefined;
  const photographerHref = photographerDisplay
    ? `/alumni/${slugify(photographerDisplay)}`
    : undefined;

  const albumHrefDisplay = cleanHref(productionAlbumHref ?? undefined) ?? null;
  const albumLabelDisplay = cleanStr(productionAlbumLabel ?? undefined) ?? null;

  const fieldAlbumHrefDisplay = cleanHref(fieldAlbumHref ?? undefined) ?? null;
  const fieldAlbumLabelDisplay = cleanStr(fieldAlbumLabel ?? undefined) ?? null;

  // ✅ About is now strictly story/tags. Gallery is rendered as its own full-width row.
  const showAboutSection = hasSynopsis || hasThemes;
  const showResourcesSection = hasResources;

  const showSidebarCol = hasCast || hasCreativeTeam || showResourcesSection;
  const showPrimaryNarrativeGrid = showAboutSection || showSidebarCol;

  const narrativeGridClass =
    showAboutSection && showSidebarCol ? "primary-narrative-grid pn-two" : "primary-narrative-grid";

  const now = new Date();

  const parsedRunEnd = cleanStr(runEndISO) ? new Date(runEndISO as string) : null;
  const parsedRunStart = cleanStr(runStartISO) ? new Date(runStartISO as string) : null;

  const hasValidRunEnd = !!parsedRunEnd && !Number.isNaN(parsedRunEnd.getTime());
  const hasValidRunStart = !!parsedRunStart && !Number.isNaN(parsedRunStart.getTime());

  const runIsPast = hasValidRunEnd
    ? parsedRunEnd < now
    : inferIsPastRun(datesText);

  const runIsUpcomingOrCurrent = hasValidRunEnd
    ? parsedRunEnd >= now
    : hasValidRunStart
      ? parsedRunStart >= now || !inferIsPastRun(datesText)
      : !runIsPast;

  // ── Production event status (events-first, date-based fallback) ─────────────
  const safeProductionEvents = productionEvents ?? [];
  const eventStatusLabel = productionEventStatus(safeProductionEvents);
  // Derive display status: events take priority, then fall back to date inference
  const displayStatus: "NOW PLAYING" | "UPCOMING" | "ARCHIVE" | null =
    eventStatusLabel ??
    (runIsUpcomingOrCurrent ? "UPCOMING" : runIsPast ? "ARCHIVE" : null);
  const displayStatusColor =
    displayStatus === "NOW PLAYING"
      ? "#2FA873"
      : displayStatus === "UPCOMING"
        ? "#FFCC00"
        : "#6a6a6a";

  const pastProductionDonateHref =
    "/donate?mode=new-work&freq=monthly";

  const currentProductionDonateHref = donateProductionSlugText
    ? `/donate?mode=new-work-specific&freq=one_time&production=${encodeURIComponent(
        donateProductionSlugText
      )}`
    : donateLinkText ?? "/donate?mode=new-work&freq=monthly";

  let primaryCtaHref = "";
  let primaryCtaLabel = "";

  if (ticketsLinkText && runIsUpcomingOrCurrent) {
    primaryCtaHref = ticketsLinkText;
    primaryCtaLabel = "Purchase Tickets";
  } else if (runIsUpcomingOrCurrent) {
    primaryCtaHref = currentProductionDonateHref;
    primaryCtaLabel = "Sponsor This New Work";
  } else if (runIsPast) {
    primaryCtaHref = pastProductionDonateHref;
    primaryCtaLabel = "Sponsor Stories Like This";
  } else if (getInvolvedLinkText) {
    primaryCtaHref = getInvolvedLinkText;
    primaryCtaLabel = "Get Involved";
  }

  const subtitleNorm = subtitleText ? normalize(subtitleText) : null;

  const inlineSynopsisNodes = (() => {
    if (!hasSynopsis) return null;

    if (!subtitleText) {
      return synopsisParas.map((p, i) =>
        /\<a\s/i.test(p) ? (
          <p
            key={i}
            className="body-text about-body mt-4"
            dangerouslySetInnerHTML={{ __html: p }}
          />
        ) : (
          <p key={i} className="body-text about-body mt-4">
            {p}
          </p>
        )
      );
    }

    let replaced = false;
    return synopsisParas.map((p, i) => {
      const pNorm = normalize(stripHtml(p));
      if (!replaced && subtitleNorm && pNorm.includes(subtitleNorm)) {
        replaced = true;
        return (
          <p key={`tag-${i}`} className="tagline-inline mt-2">
            {subtitleText}
          </p>
        );
      }

      return /\<a\s/i.test(p) ? (
        <p
          key={i}
          className="body-text about-body mt-4"
          dangerouslySetInnerHTML={{ __html: p }}
        />
      ) : (
        <p key={i} className="body-text about-body mt-4">
          {p}
        </p>
      );
    });
  })();

  const cityLabel = cityText ?? locationText;

const metaValues: Array<{ value: ReactNode; hero?: boolean }> = [];
const seenMeta = new Set<string>();

const pushMeta = (rawLabel: string | undefined, node: ReactNode, hero = true) => {
  const key = rawLabel ? normalize(stripHtml(rawLabel)) : "";
  if (!key || seenMeta.has(key)) return;
  seenMeta.add(key);
  metaValues.push({ value: node, hero });
};

if (datesText) pushMeta(datesText, datesText, true);

// Festival
if (festivalText) {
  const href = festivalHrefText;
  const node = href ? (
    isExternal(href) ? (
      <a className="meta-link" href={href} target="_blank" rel="noreferrer">
        {festivalText}
      </a>
    ) : (
      <Link className="meta-link" href={href}>
        {festivalText}
      </Link>
    )
  ) : (
    festivalText
  );

  pushMeta(festivalText, node, true);
}

// Venue
if (venueText) {
  const href = venueHrefText;
  const node = href ? (
    isExternal(href) ? (
      <a className="meta-link" href={href} target="_blank" rel="noreferrer">
        {venueText}
      </a>
    ) : (
      <Link className="meta-link" href={href}>
        {venueText}
      </Link>
    )
  ) : (
    venueText
  );

  pushMeta(venueText, node, true);
}

// City (or location fallback) — skip if it’s already embedded in venue text
if (cityLabel) {
  const cityNorm = normalize(stripHtml(cityLabel));
  const venueNorm = venueText ? normalize(stripHtml(venueText)) : "";
  if (!venueNorm || !venueNorm.includes(cityNorm)) {
    pushMeta(cityLabel, cityLabel, true);
  }
}

if (runtimeText) metaValues.push({ value: runtimeText });
if (ageRecText) metaValues.push({ value: ageRecText });

  const safeCreditPeople = (creditPeople ?? []).flatMap((p) => {
    const name = cleanStr(p?.name);
    if (!name) return [];
    const href = cleanHref(p?.href);
    return [{ name, ...(href ? { href } : {}) }];
  });

  const creditPrefixText = cleanStr(creditPrefix);

  const creditNodes = (() => {
    if (safeCreditPeople.length) {
      const count = safeCreditPeople.length;
      return safeCreditPeople.map((p, i) => {
        const isLast = i === count - 1;
        const isPenultimate = i === count - 2;
        const sep = isLast ? "" : isPenultimate ? (count >= 3 ? ", and " : " & ") : ", ";

        const href = p.href;

        const node = href ? (
          <Link
            key={`${p.name}-${i}`}
            href={href}
            className="playwright-link inline-block no-underline"
          >
            {p.name}
          </Link>
        ) : (
          <span
            key={`${p.name}-${i}`}
            className="inline-block playwright-link"
            style={{ color: "#ffcc00" }}
          >
            {p.name}
          </span>
        );

        return (
          <span key={`credit-${i}`}>
            {node}
            {sep}
          </span>
        );
      });
    }

    const playwrightText = cleanStr(playwright);
    const playwrightHrefText = cleanHref(playwrightHref);

    if (playwrightText) {
      return playwrightHrefText ? (
        <Link href={playwrightHrefText} className="playwright-link inline-block no-underline">
          {playwrightText}
        </Link>
      ) : (
        <span className="inline-block playwright-link" style={{ color: "#ffcc00" }}>
          {playwrightText}
        </span>
      );
    }

    return null;
  })();

  const showByline = Boolean(creditPrefixText || creditNodes);
  const bylinePrefix = creditPrefixText ?? (creditNodes ? "By" : undefined);

  const impactBlurb =
    "Whether you’ve discovered this production while it’s on stage or years after the final curtain, your support helps fuel long-term youth drama clubs, artist mentorship, and new work in communities around the world.";

  const hasImpactCTA =
    runIsPast || runIsUpcomingOrCurrent || !!getInvolvedLinkText;
  const showDramaClubBlock = !!dramaClubNameText || !!dramaClubLinkText;

  const showImpactRight = showDramaClubBlock || hasCauses || hasPartners;
  const showImpactBlock = hasImpactCTA || showDramaClubBlock || hasCauses || hasPartners;

  const impactRowClass = showImpactRight ? "row row50 impact-row" : "row rowFull impact-row";

  return (
    <main
      className="min-h-screen"
      style={{ color: "#241123" }}
    >
      {/* ========================= HERO ========================= */}
      <section className="relative isolate">
        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "16 / 9",
            overflow: "hidden",
            zIndex: 0,
            boxShadow: "0 18px 38px rgba(0,0,0,0.18)",
          }}
        >
          <Image
            src={!heroBroken && heroImageUrlText ? heroImageUrlText : "/posters/fallback-16x9.jpg"}
            alt={heroImageAltText || displayTitle || "Production hero image"}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
            onError={() => setHeroBroken(true)}
          />

          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/70 to-black/35" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
          </div>

          <div
            className="hero-stack"
            style={{
              position: "absolute",
              bottom: "clamp(1.5rem, 5vw, 3rem)",
              left: "clamp(1.25rem, 7vw, 7%)",
              right: "clamp(1.25rem, 7vw, 7%)",
              zIndex: 2,
            }}
          >
            <div className="hero-text-shade" />
            <div className="hero-text-group">
              {seasonLabelText &&
                (seasonHrefText ? (
                  <Link href={seasonHrefText} className="season-link hit-area no-underline">
                    <span className="eyebrow season-eyebrow">{seasonLabelText}</span>
                  </Link>
                ) : (
                  <span className="eyebrow season-eyebrow">{seasonLabelText}</span>
                ))}

              <div className="hero-title-lockup">
                <h1 className="hero-title">{displayTitle}</h1>

                {originalTitleText && (
                  <p className="hero-original-title font-sans">
                    <span className="hero-original-text" lang="es">
                      {originalTitleText}
                    </span>
                  </p>
                )}
              </div>

              {heroTitleVariant && <p className="hero-subtitle">{heroTitleVariant}</p>}

              {showByline && (
                <p className="hero-byline">
                  {bylinePrefix && <span className="byline-prefix">{bylinePrefix} </span>}
                  {creditNodes}
                </p>
              )}

            </div>
          </div>
        </div>
      </section>

      {renderAfterHero ?? null}

      {/* ===================== WHITE CARD ====================== */}
      <section style={{ display: "grid", placeItems: "center" }}>
        <article
          style={{
            width: "90vw",
            maxWidth: "1200px",
            background: "rgba(255,255,255,0.80)",
            borderRadius: 18,
            margin: "clamp(1.25rem, 3vw, 2.25rem) 0 clamp(3.2rem, 8vw, 6rem)",
            ["--card-pad" as any]: "clamp(1.2rem, 3.2vw, 2.4rem)",
            padding: "var(--card-pad)",
            boxShadow: "0 2px 8px rgba(36,17,35,0.06), 0 20px 60px rgba(36,17,35,0.22), 0 8px 80px rgba(0,0,0,0.14)",
            backdropFilter: "blur(12px) saturate(1.1)",
            borderTop: `3px solid ${displayStatus === "NOW PLAYING" ? "#2FA873" : displayStatus === "UPCOMING" ? "#D9A919" : "rgba(36,17,35,0.14)"}`,
          }}
        >
          <section className="rows">
            {/* TOPBAR: status badge (left) + sponsor CTA (right) */}
            <div className="card-topbar">
              {displayStatus ? (
                <span
                  className="status-pill"
                  style={{
                    background:
                      displayStatus === "NOW PLAYING" ? "#2FA873"
                      : displayStatus === "UPCOMING"   ? "#D9A919"
                      : "rgba(36,17,35,0.12)",
                    borderColor:
                      displayStatus === "NOW PLAYING" ? "#2FA873"
                      : displayStatus === "UPCOMING"   ? "#D9A919"
                      : "rgba(36,17,35,0.22)",
                    color:
                      displayStatus === "NOW PLAYING" ? "#fff"
                      : displayStatus === "UPCOMING"   ? "#241123"
                      : "#7a6a7a",
                  }}
                >
                  {displayStatus !== "ARCHIVE" && (
                    <span
                      className="status-dot"
                      style={{
                        background:
                          displayStatus === "NOW PLAYING" ? "rgba(255,255,255,0.7)"
                          : "rgba(36,17,35,0.35)",
                      }}
                    />
                  )}
                  {displayStatus}
                </span>
              ) : <span />}
              {primaryCtaHref && primaryCtaLabel && (
                <DATButtonLink
                  href={primaryCtaHref}
                  size="md"
                  variant="pink"
                  className="card-topbar-cta"
                  aria-label={
                    primaryCtaLabel === "Purchase Tickets"
                      ? `Purchase tickets for ${displayTitle}`
                      : primaryCtaLabel
                  }
                >
                  {primaryCtaLabel}
                </DATButtonLink>
              )}
            </div>

            {/* BACKSTAGE PASS — full-width with production meta + events
                Shows for any production that has event records OR is a past/archive production */}
            {(safeProductionEvents.length > 0 || runIsPast) && (
              <div className={`prod-backstage-pass${runIsPast ? " prod-backstage-pass--archive" : ""}`}>
                {/* Production meta grid */}
                <div className="prod-backstage-meta">
                  <div className="prod-backstage-meta-left">
                    <p className="prod-backstage-meta-title">{displayTitle}</p>
                    {subtitleText && <p className="prod-backstage-meta-sub">{subtitleText}</p>}
                    {festivalText && <p className="prod-backstage-meta-detail">{festivalText}</p>}
                    {dramaClubNameText && (
                      <p className="prod-backstage-meta-detail prod-backstage-meta-club">
                        {dramaClubNameText}{dramaClubLocationText ? ` · ${dramaClubLocationText}` : ""}
                      </p>
                    )}
                  </div>
                  <div className="prod-backstage-meta-right">
                    {(venueText || (cityText ?? locationText)) && (
                      <div className="prod-backstage-chip">
                        <span className="prod-bp-chip-label">Location</span>
                        <span className="prod-bp-chip-value">
                          {[venueText, cityText ?? locationText].filter(Boolean).join(" · ")}
                        </span>
                      </div>
                    )}
                    {runtimeText && (
                      <div className="prod-backstage-chip">
                        <span className="prod-bp-chip-label">Runtime</span>
                        <span className="prod-bp-chip-value">{runtimeText}</span>
                      </div>
                    )}
                    {ageRecText && (
                      <div className="prod-backstage-chip">
                        <span className="prod-bp-chip-label">Ages</span>
                        <span className="prod-bp-chip-value">{ageRecText}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Events header + rows — only rendered when event records exist */}
                {safeProductionEvents.length > 0 && (
                  <>
                    <div className="prod-backstage-header">
                      <span className="prod-backstage-label">
                        {safeProductionEvents.filter((e) => e.status === "upcoming").length > 0
                          ? "Where to See It"
                          : "Where It\u2019s Been"}
                      </span>
                      {runIsPast && (
                        <span className="prod-backstage-archive-badge">ARCHIVE</span>
                      )}
                    </div>
                    <div className="prod-backstage-events">
                      <div className="prod-events-list">
                        {safeProductionEvents.map((e) => {
                          const isPast = e.status !== "upcoming";
                          return (
                            <div key={e.id} className={`prod-event-row ${isPast ? "prod-event-row--past" : ""}`}>
                              <div className="prod-event-date">
                                {e.endDate
                                  ? `${shortMonth(e.date)} ${dayOfMonth(e.date)}–${dayOfMonth(e.endDate)}, ${eventYear(e.date)}`
                                  : `${shortMonth(e.date)} ${dayOfMonth(e.date)}, ${eventYear(e.date)}`}
                              </div>
                              <div className="prod-event-venue">
                                <span className="prod-event-name">{e.venue}</span>
                                <span className="prod-event-city"> · {e.city}, {e.country}</span>
                              </div>
                              {e.ticketUrl && !isPast && (
                                <a
                                  href={e.ticketUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="prod-event-ticket"
                                >
                                  {e.ticketPrice ? e.ticketPrice : "Tickets →"}
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}

                <Link href="/events" className="prod-backstage-all-link">All DAT Events →</Link>
              </div>
            )}

            {/* Quote band */}
            {pullQuote?.quote && cleanStr(pullQuote.quote) && (
              <div className="row rowFull section-block quote-wrap">
                <div className="quote-band">
                  <div className="quote-img">
                    <Image
                      src={cleanHref(quoteImageUrl) ?? heroSrc ?? "/images/teaching-amazon.jpg"}
                      alt={cleanStr(pullQuote.attribution) ?? displayTitle}
                      fill
                      sizes="(max-width: 900px) 90vw, 600px"
                      className="object-cover"
                    />
                  </div>
                  <div className="quote-copy">
                    <blockquote className="big-quote">“{pullQuote.quote}”</blockquote>
                    {cleanStr(pullQuote.attribution) && (
                      <p className="big-quote-source">
                        {cleanHref(pullQuote.attributionHref) ? (
                          <SmartLink
                            href={pullQuote.attributionHref!}
                            className="quote-source-link"
                            newTabIfExternal
                          >
                            — {pullQuote.attribution}
                          </SmartLink>
                        ) : (
                          <>— {pullQuote.attribution}</>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* PRIMARY NARRATIVE GRID */}
            {showPrimaryNarrativeGrid && (
              <div className={narrativeGridClass}>
                {showAboutSection && (
                  <section className="section-block section-block-indent pn-about">
                    <h2 id="about-heading" className="section-head">
                      About
                    </h2>

                    {inlineSynopsisNodes}

                    {hasThemes && (
                      <div className="mt-5 production-tags">
                        <ProductionTagButtons tags={safeThemes} dense hrefBase="/theme" />
                      </div>
                    )}
                  </section>
                )}

                {showSidebarCol && (
                  <div className="pn-sidebar">
                    {hasCast && (
                      <section className="section-block pn-block pn-cast" aria-labelledby="cast-heading">
                        <h2 id="cast-heading" className="section-head">
                          Cast
                        </h2>
                        <ul className="mt-4">
                          {safeCast.map((member, i) => (
                            <li
                              key={`${member.role}-${member.name}-${i}`}
                              className="credit-row border-top-soft"
                            >
                              <span className="role-label">{member.role}</span>
                              <span className="credit-name">
                                <NameCell
                                  name={member.name}
                                  href={member.href}
                                  dramaClubSlug={member.dramaClubSlug}
                                  base={autoLinkPeopleBase}
                                />
                              </span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}

                    {hasCreativeTeam && (
                      <section className="section-block pn-block pn-team" aria-labelledby="team-heading">
                        <h2 id="team-heading" className="section-head">
                          Creative Team
                        </h2>
                        <ul className="mt-4">
                          {safeCreativeTeam.map((person, i) => (
                            <li
                              key={`${person.role}-${person.name}-${i}`}
                              className="credit-row border-top-soft"
                            >
                              <span className="role-label">{person.role}</span>
                              <span className="credit-name">
                                <NameCell
                                  name={person.name}
                                  href={person.href}
                                  dramaClubSlug={person.dramaClubSlug}
                                  base={autoLinkPeopleBase}
                                />
                              </span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}

                    {/* Resources */}
                    {showResourcesSection && (
                      <section
                        className="section-block section-block-indent pn-block pn-resources-right pn-resources"
                        aria-labelledby="resources-heading"
                      >
                        <h2 id="resources-heading" className="section-head">
                          Resources
                        </h2>

                        {hasResources && (
                          <ul className="resources-list">
  {safeResources.map((item, idx) => (
    <li key={idx} className="resource-item">
      {item.href ? (
        <SmartLink href={item.href} className="resource-link" newTabIfExternal>
          {item.label}
        </SmartLink>
      ) : (
        <span className="resource-link" style={{ color: "#241123CC" }}>
          {item.label}
        </span>
      )}
    </li>
  ))}
</ul>
                        )}
                      </section>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ✅ PRODUCTION GALLERY (full width of the card) */}
            {hasMainGallery && (
              <div className="row rowFull prodgallery-row" aria-label="Production Gallery row">
                <PhotoRowGallery
                  title="Production Gallery"
                  images={gallery}
                  photographer={
                    typeof productionPhotographer === "string" && productionPhotographer.trim()
                      ? productionPhotographer.trim()
                      : null
                  }
                  photographerHref={photographerHref ?? null}
                  albumHref={albumHrefDisplay}
                  albumLabel={albumLabelDisplay}
                  maxVisible={9}
                />
              </div>
            )}

            {/* ✅ PROCESS (only when contentful) */}
            {hasProcess && (
              <div className="row rowFull section-block process-wrap" id="process">
                <ProcessBand slides={safeProcessSections} title="Process" />
              </div>
            )}
          </section>

          {/* Impact row */}
          {showImpactBlock && (
            <div className={impactRowClass}>
              {/* left column */}
              <section className="section-block section-block-indent impact-left" aria-labelledby="impact-cta-heading">
                <h2 id="impact-cta-heading" className="section-head">
                  Impact & Community
                </h2>
                <p className="body-text" style={{ marginTop: 8, maxWidth: 680 }}>
                  {impactBlurb}
                </p>

                <div className="impact-cta-stack" style={{ marginTop: 10 }}>
                  {(runIsUpcomingOrCurrent || runIsPast) && (
                    <DATButtonLink
                      href={runIsPast ? pastProductionDonateHref : currentProductionDonateHref}
                      size="lg"
                      className="sponsor-btn"
                    >
                      {runIsPast ? "Sponsor Stories Like This" : "Sponsor This New Work"}
                    </DATButtonLink>
                  )}
                  {getInvolvedLinkText && (
                    <Link href={getInvolvedLinkText} className="involved-link under-btn">
                      Volunteer / Get Involved
                    </Link>
                  )}
                </div>

                {/* From the Field */}
                {hasFieldGallery && (
                  <div className="impact-field-slot">
                    <FieldGridGallery
                      title={cleanStr(fieldGalleryTitle)}
                      images={fieldGallery}
                      albumHref={fieldAlbumHrefDisplay}
                      albumLabel={fieldAlbumLabelDisplay}
                    />
                  </div>
                )}
              </section>

              {/* right column */}
              {(showDramaClubBlock || hasCauses || hasPartners) && (
                <section className="section-block impact-right">
                  <div
                    className="grid items-start"
                    style={{
                      gridTemplateColumns: "auto 1fr",
                      gap: "clamp(20px, 3.5vw, 44px)",
                    }}
                  >
                    {showDramaClubBlock && (
                      <>
                        <div className="drama-club-wrapper">
                          {dramaClubLinkText ? (
                            <Link
                              href={dramaClubLinkText}
                              className="drama-club-link no-underline"
                              aria-label={dramaClubNameText ?? "Drama Club"}
                            >
                              <DramaClubBadge
                                name={dramaClubNameText ?? ""}
                                size={150}
                                wrappedByParentLink
                              />
                            </Link>
                          ) : (
                            <div className="drama-club-link">
                              <DramaClubBadge name={dramaClubNameText ?? ""} size={150} />
                            </div>
                          )}
                        </div>

                        {(dramaClubNameText || dramaClubLocationText) && (
                          <div style={{ alignSelf: "center" }}>
                            <p className="support-eyebrow-tight">THIS PRODUCTION SUPPORTS</p>
                            {dramaClubNameText && (
                              <h3 className="club-name" style={{ marginTop: 6 }}>
                                {dramaClubLinkText ? (
                                  <Link href={dramaClubLinkText} className="club-link-black no-underline">
                                    {dramaClubNameText}
                                  </Link>
                                ) : (
                                  dramaClubNameText
                                )}
                              </h3>
                            )}
                            {dramaClubLocationText && <p className="club-loc">{dramaClubLocationText}</p>}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {hasCauses && (
                    <div className="mt-5 mb-6 section-block-indent">
                      <p className="support-eyebrow-tight">CAUSES WE CHAMPION</p>
                      <div className="cause-row">
                        {safeCauses.map((c) => {
                          const causeHref = c.href ?? `/cause/${slugify(c.label)}`;
                          return (
                            <Link key={c.label} href={causeHref} className="cause-chip no-underline">
                              {c.label}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {hasPartners && (
                    <div className="impact-partners-block section-block-indent">
                      <p className="support-eyebrow-tight">IMPACT PARTNERS</p>

                      <div className="partner-list">
                        {safePartners.map((p) => {
  const hasLogo = !!p.logoSrc;
  const href = cleanHref(p.href); // ✅ might be undefined
  const className = `partner-bar ${hasLogo ? "" : "partner-no-logo"}`;

  // No link → render as plain row (keep text + optional logo)
  if (!href) {
    return (
      <div key={p.name} className={className}>
        {hasLogo && <PartnerLogoShell src={p.logoSrc} alt={p.logoAlt ?? p.name} />}
        <div className="partner-text">
          <span className="partner-name">{p.name}</span>
        </div>
      </div>
    );
  }

  const external = isExternal(href);

  if (!external) {
    return (
      <Link key={p.name} href={href} className={className}>
        {hasLogo && <PartnerLogoShell src={p.logoSrc} alt={p.logoAlt ?? p.name} />}
        <div className="partner-text">
          <span className="partner-name">{p.name}</span>
        </div>
      </Link>
    );
  }

  return (
    <a key={p.name} href={href} className={className} target="_blank" rel="noreferrer">
      {hasLogo && <PartnerLogoShell src={p.logoSrc} alt={p.logoAlt ?? p.name} />}
      <div className="partner-text">
        <span className="partner-name">{p.name}</span>
      </div>
    </a>
  );
})}

                      </div>
                    </div>
                  )}
                </section>
              )}
            </div>
          )}

          {/* RELATED swipe row */}
          {hasRelated && (
            <section className="row rowFull section-block related-block">
              <div className="related-head">
                <h2 className="section-head">{relatedTitle}</h2>
              </div>

              <div className="related-row" aria-label="Related Plays & Projects">
                <div className="related-spacer" aria-hidden="true" />
                {relatedList.map((ri) => (
                  <RelatedCard key={ri.slug} item={ri} />
                ))}
              </div>
            </section>
          )}
        </article>
      </section>

      <style>{`
        .eyebrow,.hero-title,.hero-subtitle,.hero-byline{
          text-shadow:
            0 0 4px rgba(0,0,0,0.82),
            0 8px 24px rgba(0,0,0,0.90);
        }

        main a,
        main a:link,
        main a:visited,
        main a:hover,
        main a:focus,
        main a:focus-visible,
        main a:active{
          text-decoration: none !important;
        }

        .eyebrow{
          display:block; margin-bottom:0.375rem;
          font-family: var(--font-space-grotesk, system-ui, sans-serif);
          font-size: 0.7rem; text-transform: uppercase; font-weight: 600; letter-spacing: 0.22em;
          color: #f2f2f2; opacity: 0.75;
          transition: opacity 160ms ease, letter-spacing 160ms ease, color 160ms ease;
        }
        .hit-area{ display:inline-block; padding:20px 14px; margin-left:-8px; margin-top:-4px; margin-bottom:-2px; }
        .season-link:hover .season-eyebrow{ color:#FFCC00 !important; letter-spacing:0.30em; opacity:1 !important; }

        .hero-title{
          display: block;
          width: max-content;
          max-width: 100%;
          font-family: var(--font-anton, system-ui, sans-serif);
          font-size: clamp(2.8rem, 7vw, 7rem);
          color: #f2f2f2;
          text-transform: uppercase;
          margin: 0;
          line-height: 1;
          letter-spacing: 0.06em;
          opacity: .9;
        }
        .hero-subtitle{
          margin-top: .4rem;
          font-family: var(--font-space-grotesk, system-ui, sans-serif);
          font-size: clamp(1rem, 2.2vw, 1.5rem); letter-spacing: .18em;
          text-transform: uppercase; font-weight: 600; color: #f2f2f2; opacity: 0.9;
        }
        .hero-original-title{
          margin: 0;
          margin-top: clamp(0.2rem, 0.8vw, 0.45rem);
          display: block;
          width: max-content;
          max-width: 100%;
          text-align: right;
          font-family: var(--font-space-grotesk, system-ui, sans-serif);
          font-size: clamp(0.9rem, 1.35vw, 1.15rem);
          line-height: 1.15;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-weight: 500;
          color: #FFCC00;
          opacity: 0.96;
          text-shadow:
            0 0 4px rgba(0,0,0,0.82),
            0 8px 24px rgba(0,0,0,0.90);
        }

        .hero-original-text{
          color: inherit;
        }
        .hero-title-lockup{
          display: inline-flex;
          flex-direction: column;
          align-items: flex-end;
          width: max-content;
          max-width: 100%;
        }
        .hero-text-group{
          display: inline-flex;
          flex-direction: column;
          align-items: flex-start;
          width: fit-content;
          max-width: min(92vw, 1100px);
        }
        .hero-stack{
          position: relative;
          width: fit-content;
          max-width: min(92vw, 1100px);
        }

        .hero-text-shade{
          position: absolute;
          inset: -1.2rem -1.6rem -1rem -1.6rem;
          background:
            radial-gradient(
              ellipse at left center,
              rgba(36,17,35,0.52) 0%,
              rgba(36,17,35,0.38) 38%,
              rgba(36,17,35,0.18) 68%,
              rgba(36,17,35,0.00) 100%
            );
          filter: blur(14px);
          pointer-events: none;
          z-index: 0;
        }

        .hero-text-group{
          position: relative;
          z-index: 1;
        }
        .hero-byline{
          margin-top: .65rem;
          font-family: var(--font-space-grotesk, system-ui, sans-serif);
          font-size: .9rem; letter-spacing: .08em; text-transform: uppercase; font-weight: 600; color: #f2f2f2;
        }
        .byline-prefix{ opacity:.6; }

        .playwright-link {
          color: #f2f2f2 !important; font-weight: 700; letter-spacing: 0.22em; opacity: .85;
          text-decoration: none !important;
          transition: color 180ms ease, letter-spacing 180ms ease, transform 180ms ease, opacity 180ms ease;
        }
        .playwright-link:hover,
        .playwright-link:focus-visible {
          color:#FFCC00 !important; letter-spacing:0.30em; transform: translateX(2px); opacity:1;
          text-decoration: none !important;
        }

        .tagline-inline{
          font-family: var(--font-rock-salt, cursive);
          font-weight: 400; line-height: 1.25; color: #F23359;
          font-size: clamp(1.15rem, 3.0vw, 2.0rem); word-break: break-word;
        }

        .rows{ display: grid; gap: clamp(30px, 4.2vw, 48px); }
        .row{ display:grid; gap: clamp(12px, 1.6vw, 18px); align-items:start; }
        .row70{ grid-template-columns: 6.5fr 3.5fr; }
        .row50{ grid-template-columns: 1fr 1fr; }
        .rowFull{ grid-template-columns: 1fr; }
        .r1-tickets{ justify-self: end; align-self: flex-start; }

        /* ── Poster column inside white card ───────────────────────── */
        .meta-with-poster{
          display: flex;
          gap: clamp(1rem, 2.5vw, 2rem);
          align-items: flex-start;
        }
        .card-poster{
          flex-shrink: 0;
          width: clamp(120px, 18vw, 200px);
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 8px 28px rgba(36,17,35,0.22), 0 2px 6px rgba(36,17,35,0.12);
        }
        .card-poster-img{
          width: 100%;
          height: auto;
          display: block;
          aspect-ratio: 16 / 9;
          object-fit: cover;
        }
        .meta-col{ flex: 1; min-width: 0; }
        @media (max-width: 600px){
          .meta-with-poster{ flex-direction: column; }
          .card-poster{ width: 100%; max-width: 320px; aspect-ratio: 16/9; }
          .card-poster-img{ aspect-ratio: 16/9; }
        }

        .section-block{
          border-top: 1px solid #2411231F;
          padding-top: 12px;
          margin-top: 24px;
        }

        .section-block-indent{ padding-left: 2.5rem; }
        #about-heading,#impact-cta-heading,#resources-heading{ margin-left: -2.5rem; }

        .section-head{
          font-family: var(--font-dm-sans, system-ui, sans-serif);
          font-size: .86rem; text-transform: uppercase; letter-spacing: .22em;
          color: #241123B3; font-weight: 300; margin: 0 0 12px 0;
        }

        .meta-stack{ display:flex; flex-direction:column; gap:6px; }
        .meta-line{
          font-family: var(--font-space-grotesk, system-ui, sans-serif);
          letter-spacing: 0.12em; text-transform: uppercase; line-height: 1.2;
        }
        .meta-line.meta-hero{ font-size: 1.14rem; font-weight: 900; color: #241123; }
        .meta-line.meta-sub{ font-size: .78rem; font-weight: 600; color: #24112399; }

        .meta-title{
          margin: 0;
          font-family: var(--font-space-grotesk, system-ui, sans-serif);
          font-size: clamp(1.4rem, 3vw, 2.1rem);
          letter-spacing: .12em; text-transform: uppercase; font-weight: 900; color: #241123;
        }

        .meta-link,
        .meta-link:link,
        .meta-link:visited,
        .meta-link:hover,
        .meta-link:focus,
        .meta-link:focus-visible,
        .meta-link:active{
          color: #6c00af !important;
          text-decoration: none !important;
          transform-origin: left center;
          transition: color 160ms ease, transform 160ms ease, opacity 160ms ease, letter-spacing 160ms ease;
        }
        .meta-link:hover,
        .meta-link:focus-visible{
          color: #F23359 !important;
          transform: scale(1.02) translateX(1px);
          letter-spacing: .16em;
        }

        .body-text{
          font-family: var(--font-space-grotesk, system-ui, sans-serif);
          font-size: 1.05rem; line-height: 1.66; color: #241123E6;
        }
        .about-body{ font-weight: 500; letter-spacing: .005em; }

        .about-body a,
        .about-body a:link,
        .about-body a:visited,
        .about-body a:hover,
        .about-body a:focus,
        .about-body a:focus-visible,
        .about-body a:active{
          color:#6c00af !important;
          font-weight: 600;
          text-decoration: none !important;
          transition: color 160ms ease, transform 160ms ease;
        }
        .about-body a:hover,
        .about-body a:focus-visible{
          color:#F23359 !important;
          transform: translateY(-1px);
        }

        .process-wrap{ padding-top: 40px; padding-bottom: 15px !important; display: flex; flex-direction: column; justify-content: center; }
        .quote-wrap{ padding-top: 40px; padding-bottom: -10px !important; display: flex; flex-direction: column; justify-content: center; }

        .impact-cta-stack{ display:flex; flex-direction:column; width:max-content; align-items:stretch; }
        .under-btn{ display:block; text-align:center; margin-top:8px; }

        .involved-link,
        .involved-link:link,
        .involved-link:visited,
        .involved-link:hover,
        .involved-link:focus,
        .involved-link:focus-visible,
        .involved-link:active{
          color: #6c00af !important; font-weight: 500; letter-spacing: .01em;
          text-decoration: none !important;
          transition: transform 160ms ease, letter-spacing 160ms ease, opacity 160ms ease, color 160ms ease;
        }
        .involved-link:hover,
        .involved-link:focus-visible{
          transform: scale(1.02); letter-spacing:.02em; opacity:.9; color:#F23359 !important;
        }

        .support-eyebrow-tight{
          margin: 0;
          font-family: var(--font-space-grotesk, system-ui, sans-serif);
          font-size: .67rem; text-transform: uppercase; letter-spacing: .22em;
          font-weight: 600; color: #24112399;
        }
        .club-name{
          margin: .15rem 0 0 0;
          font-family: var(--font-anton, system-ui, sans-serif);
          font-weight: 400;
          font-size: 1.6rem;
          letter-spacing: .03em;
          color: #000;
        }
        .club-loc{ margin: 0; font-size: .92rem; color: #241123B3; }

        .club-link-black,
        .club-link-black:link,
        .club-link-black:visited,
        .club-link-black:hover,
        .club-link-black:focus,
        .club-link-black:focus-visible,
        .club-link-black:active{
          color:#6c00af !important; font-weight: 400;
          text-decoration: none !important;
          transition: transform 160ms ease, letter-spacing 160ms ease, opacity 160ms ease, color 160ms ease;
        }
        .club-link-black:hover,
        .club-link-black:focus-visible{
          transform: scale(1.02) translateX(1px); letter-spacing:.06em; opacity:.96; color:#F23359 !important;
        }

        .drama-club-wrapper{ transition: transform 160ms ease, filter 160ms ease; display:inline-block; margin-top: 1rem; margin-bottom: 2rem; }
        .drama-club-link{ display:inline-block; text-decoration: none !important; }
        .drama-club-link:hover, .drama-club-wrapper:hover{ transform: translateY(-2px); filter: brightness(0.88); }

        .cause-row{ margin-top: 8px; display:flex; flex-wrap:wrap; gap: 8px; }
        .cause-chip {
          display: inline-flex;
          align-items: center;
          padding: 0.25rem 0.6rem;
          border-radius: 999px;
          border: 1px solid rgba(36,17,35,0.16);
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.11em;
          background: rgba(255,255,255,0.9);
          text-decoration: none !important;
          color: #241123;
          transition: background-color 150ms ease, color 150ms ease, transform 130ms ease, box-shadow 130ms ease, border-color 130ms ease, opacity 130ms ease;
        }
        .cause-chip:hover,
        .cause-chip:focus-visible {
          background-color: #FFCC00;
          border-color: #FFCC00;
          color: #241123;
          transform: translateY(-1px);
          box-shadow: 0 6px 14px rgba(0,0,0,0.22);
          opacity: 0.97;
          text-decoration: none !important;
        }

        .impact-partners-block{ margin-top: 3.8rem; padding-top: 0rem; }
        .partner-list{ margin-top: 8px; display: flex; flex-direction: column; gap: 8px; }
        .partner-bar{
          position: relative; display: flex; align-items: center; gap: 12px; padding: 8px 10px;
          border-radius: 5px; background: #f2f2f24d; border: 1px solid #2411231A; text-decoration: none !important;
          transition: transform 120ms ease, background-color 120ms ease;
        }
        .partner-bar:hover,
        .partner-bar:focus-visible{ transform: translateY(-1px); background: #FFcc0040; text-decoration: none !important; }
        .partner-logo-shell{
          flex: 0 0 auto; width: 64px; height: 64px; border-radius: 3px; background: #24112312;
          display: flex; align-items: center; justify-content: center;
        }
        .partner-logo{ max-width: 58px; max-height: 58px; object-fit: contain; }
        .partner-bar.partner-no-logo{ padding-left: 12px; }
        .partner-text{ min-width: 0; display:flex; flex-direction:column; justify-content:center; }
        .partner-name{
          font-family: var(--font-space-grotesk, system-ui, sans-serif);
          font-size: 0.98rem; line-height: 1.35; font-weight: 700; letter-spacing: .01em;
          color:#24112399; white-space: normal;
        }

        .resources-list{ list-style: none; margin: 0; padding-left: 0; display: grid; row-gap: 8px; margin-top: 1rem; }
        .resource-item{ position: relative; padding-left: 1.1rem; }
        .resource-item::before{ content: "›"; position: absolute; left: 0; top: 0.08rem; font-weight: 500; letter-spacing: .02em; color: #241123CC; }
        .resource-link,
        .resource-link:link,
        .resource-link:visited,
        .resource-link:hover,
        .resource-link:focus,
        .resource-link:focus-visible,
        .resource-link:active{
          color:#6c00af !important; font-weight: 500; transform-origin: left center;
          transition: transform 140ms ease, opacity 140ms ease, color 140ms ease, letter-spacing 140ms ease;
          text-decoration: none !important;
        }
        .resource-link:hover,
        .resource-link:focus-visible{
          color:#F23359 !important; transform: scale(1.02) translateX(1px); opacity:.96; letter-spacing:.03em;
        }

        .role-label{
          display: block;
          min-width: 0;
          white-space: normal;
          overflow-wrap: anywhere;
          word-break: break-word;
          line-height: 1.35;
          font-size: .68rem;
          font-weight: 400;
          text-transform: uppercase;
          letter-spacing: .2em;
          color: #24112399;
        }
        .border-top-soft{ border-top: 1px solid #2411231A; }

        .namecell,
        .namecell:link,
        .namecell:visited,
        .namecell:hover,
        .namecell:focus,
        .namecell:focus-visible,
        .namecell:active{
          color: #6c00af !important;
          font-weight: 400;
          text-decoration: none !important;
          text-transform: none !important;
          font-variant-ligatures: normal;
          unicode-bidi: plaintext;
          transition: color 160ms ease, transform 160ms ease, letter-spacing 160ms ease, line-height 160ms ease;
        }
        .namecell:hover,
        .namecell:focus-visible{
          color: #F23359 !important; transform: translateX(-2px); letter-spacing: .02em; line-height: 1.05;
        }

        .tickets-btn{
          background-color: #f23359 !important; border-color: #f23359 !important; color: #ffffff !important;
          opacity: 1; transition: background-color 160ms ease, transform 160ms ease, box-shadow 160ms ease;
          box-shadow: 0 4px 12px rgba(242, 51, 89, 0.25);
        }
        .tickets-btn:hover{
          background-color: #d62c4f !important; border-color: #d62c4f !important;
          transform: translateY(-1px); box-shadow: 0 8px 18px rgba(242, 51, 89, 0.28);
        }

        .sponsor-btn{ font-size: 1.1rem; transition: transform 160ms ease, box-shadow 160ms ease; }
        .sponsor-btn:hover{ transform: translateY(-1px); box-shadow: 0 8px 18px #6c00af; }

        .quote-band{
          position: relative; display: grid; grid-template-columns: 1.2fr 1fr; gap: clamp(14px, 2vw, 24px);
          border-radius: 18px; overflow: hidden; background: #0f0a10; color: #fff;
        }
        .quote-img{ position: relative; min-height: 260px; }
        .quote-copy{ padding: clamp(16px,2.2vw,24px); display:flex; flex-direction:column; justify-content:center; }
        .big-quote{
          font-family: var(--font-anton, system-ui, sans-serif);
          font-size: clamp(1.8rem, 4.2vw, 3.2rem); line-height: 1.05; margin: 0; letter-spacing: .01em;
        }
        .big-quote-source{ margin-top: .6rem; font-family: var(--font-space-grotesk, system-ui, sans-serif); font-size: .9rem; opacity: .9; }
        .quote-source-link,
        .quote-source-link:link,
        .quote-source-link:visited,
        .quote-source-link:hover,
        .quote-source-link:focus,
        .quote-source-link:focus-visible,
        .quote-source-link:active{
          color:#FFCC00 !important; transition: color 160ms ease, letter-spacing 160ms ease; text-decoration: none !important;
        }
        .quote-source-link:hover,
        .quote-source-link:focus-visible{ color:#F23359 !important; letter-spacing:.01em; }

        .glare-sheen{
          position: relative;
          box-shadow: 0 4px 12px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.06);
          transition: transform 160ms ease, box-shadow 160ms ease, filter 160ms ease;
        }
        .glare-sheen::after{
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(120% 90% at 18% 12%, rgba(255,255,255,0.26) 0%, rgba(255,255,255,0.00) 55%),
            linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.00) 38%, rgba(255,255,255,0.07) 70%, rgba(255,255,255,0.00) 100%);
          opacity: 0.85;
          mix-blend-mode: screen;
        }

        .fieldgrid-track{ margin-top: 16px; display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 12px; }
        .fieldgrid-card{ border:none; background:transparent; padding:0; cursor:pointer; }
        .fieldgrid-img-shell{
          position:relative;
          width:100%;
          aspect-ratio: 1 / 1;
          border-radius:14px;
          overflow:hidden;
          background:#fdfaf7;
        }
        .fieldgrid-card:hover .fieldgrid-img-shell{
          transform: translateY(-2px);
          box-shadow: 0 10px 18px rgba(0,0,0,0.14);
          filter: brightness(0.98);
        }
        .fieldgrid-footer{
          margin-top: 8px;
          display:flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          gap: 10px;
          flex-wrap: wrap;
          font-family: var(--font-space-grotesk, system-ui, sans-serif);
          font-size:.74rem;
          letter-spacing:.12em;
          text-transform:uppercase;
          font-weight:700;
          color:#24112399;
        }
        .fieldgrid-toggle{ background: none; border: none; padding: 0; cursor: pointer; }

        .fieldgrid-block{
          margin-left: -2.5rem;
          width: calc(100% + 2.5rem);
        }
        .fieldgrid-head{ margin-left: -2.5rem !important; }

        .impact-field-slot{ margin-top: 60px; }

        .prodrow-block{
          border-top: 1px solid #2411231F;
          padding-top: 14px;
          margin-top: 0;
        }
        .prodrow-head{
          margin-bottom: 8px;
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
        .prodrow-title{ margin: 0; }
        .prodrow-credit{
          margin: 0;
          margin-left: auto;
          text-align: right;
          white-space: nowrap;
          font-family: var(--font-space-grotesk, system-ui, sans-serif);
          font-size: .72rem;
          letter-spacing: .12em;
          text-transform: uppercase;
          opacity: .75;
          color:#24112399;
        }

        .prodrow-grid{
          margin-top: 18px;
          padding-left: 2.5rem;
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
          width: 100%;
        }
        .prodrow-card{ border:none; background:transparent; padding:0; cursor:pointer; }

        .prodrow-img-shell{
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 9;
          border-radius: 14px;
          overflow: hidden;
          background:#fdfaf7;
        }
        .prodrow-card:hover .prodrow-img-shell{
          transform: translateY(-2px);
          box-shadow: 0 14px 24px rgba(0,0,0,0.16);
          filter: brightness(0.99);
        }

        .prodrow-footer{
          margin-top: 10px;
          display:flex;
          align-items: center;
          gap: 10px;
          flex-wrap: nowrap;
          font-family: var(--font-space-grotesk, system-ui, sans-serif);
          font-size:.74rem;
          letter-spacing:.12em;
          text-transform:uppercase;
          font-weight:700;
          color:#24112399;
        }
        .prodrow-footer-left{ flex: 0 0 auto; }
        .prodrow-footer-right{ margin-left: auto; text-align: right; }

        @media (min-width: 901px){
          .prodrow-grid{ grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }

        .primary-narrative-grid{
          display: grid;
          gap: clamp(26px, 4vw, 48px);
          align-items: start;
          grid-template-columns: 1fr;
          min-width: 0;
        }
        .pn-about{ min-width: 0; }
        .pn-sidebar{ min-width: 0; }

        .pn-sidebar *{
          min-width: 0;
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        @media (min-width: 901px){
          .primary-narrative-grid.pn-two{
            grid-template-columns: minmax(0, 65%) minmax(0, 35%);
          }
        }

        .pn-team{ margin-top: 80px; }
        .pn-resources{ margin-top: 80px; }

        @media (max-width: 900px){
          .row70{ grid-template-columns: 1fr !important; }
          .row50{ grid-template-columns: 1fr !important; }
        }

        .related-block{
          position: relative;
          border-top: none !important;
          padding-top: 14px;
          margin-top: 60px;
          padding-left: 0;
          padding-right: 0;
          margin-left: calc(-1 * var(--card-pad));
          margin-right: calc(-1 * var(--card-pad));
        }
        .related-block::before{
          content: "";
          position: absolute;
          top: 0;
          left: var(--card-pad);
          right: var(--card-pad);
          height: 1px;
          background: #2411231F;
        }
        .related-head{
          padding-left: var(--card-pad);
          padding-right: var(--card-pad);
          margin-bottom: -22px;
        }
        .related-row{
          margin-top: 2px;
          display: flex;
          gap: clamp(10px, 1.8vw, 14px);
          overflow-x: auto;
          overflow-y: visible;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          padding-top: 8px;
          padding-bottom: 12px;
          scroll-padding-left: 5rem;
          scrollbar-width: thin;
          scrollbar-color: transparent transparent;
        }
        .related-spacer{ flex: 0 0 5rem; }

        .related-row::-webkit-scrollbar{ height: 8px; background: transparent; }
        .related-row::-webkit-scrollbar-thumb{ background: transparent; border-radius: 999px; transition: background 200ms ease; }
        .related-row:hover::-webkit-scrollbar-thumb,
        .related-row:focus-within::-webkit-scrollbar-thumb{ background: #24112333; }
        .related-row:hover{ scrollbar-color: #24112333 transparent; }
        .related-row:focus-within{ scrollbar-color: #24112333 transparent; }

        .related-card{
          flex: 0 0 auto;
          width: min(340px, 78vw);
          display: grid;
          grid-template-rows: auto 1fr;
          border-radius: 10px;
          overflow: visible;
          background: rgba(255,255,255,0.75);
          border: 1px solid #2411231A;
          transition: transform 160ms ease, box-shadow 160ms ease, background-color 160ms ease;
          scroll-snap-align: start;
        }
        .related-card:hover{
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 14px 28px rgba(36,17,35,0.16);
          background: rgba(255,255,255,0.9);
        }
        .related-image-shell{ position: relative; width: 100%; aspect-ratio: 16 / 9; background: #24112312; overflow: hidden; }
        .related-meta{ padding: 8px 10px 10px; }
        .related-title{
          font-family: var(--font-space-grotesk, system-ui, sans-serif);
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: .075em;
          font-size: .86rem;
          color: #241123;
          line-height: 1.2;
        }
        .related-sub{
          margin-top: 4px;
          font-family: var(--font-space-grotesk, system-ui, sans-serif);
          text-transform: uppercase;
          letter-spacing: .11em;
          font-size: .66rem;
          font-weight: 600;
          color: #24112380;
        }

        .credit-row{
          display: grid;
          grid-template-columns: minmax(0, 0.95fr) minmax(0, 1fr);
          align-items: start;
          gap: 1rem;
        }

        .credit-name{
          min-width: 0;
          text-align: right;
          justify-self: end;
        }

        .credit-name .namecell{
          display: inline-block;
          max-width: 100%;
          text-align: right;
          white-space: normal;
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        @media (max-width: 640px){
          .fieldgrid-track{ gap: 10px; }
          .prodrow-footer{ flex-wrap: wrap; }
          .prodrow-footer-right{ width: 100%; margin-left: 0; text-align: right; }
        }

        /* ── Status badge pill (hero) ───────────────────────────────── */
        .status-pill{
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 0.25rem 0.75rem 0.25rem 0.55rem;
          border-radius: 999px;
          border: 1px solid;
          font-family: var(--font-space-grotesk, system-ui, sans-serif);
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          backdrop-filter: blur(6px);
        }
        .status-dot{
          width: 7px;
          height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
          animation: status-pulse 2s ease-in-out infinite;
        }
        @keyframes status-pulse{
          0%,100%{ opacity: 1; transform: scale(1); }
          50%{ opacity: 0.6; transform: scale(0.85); }
        }

        /* ── Inline events (inside white card meta column) ──────────── */
        .prod-events-inline{
          margin-top: clamp(1.25rem, 3vw, 2rem);
          padding-top: clamp(1rem, 2.5vw, 1.5rem);
          border-top: 1px solid rgba(36,17,35,0.12);
        }
        .prod-events-eyebrow{
          font-family: var(--font-dm-sans, system-ui, sans-serif);
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: #D9A919;
          margin: 0 0 0.85rem;
        }
        .prod-events-list{
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }
        .prod-event-row{
          display: grid;
          grid-template-columns: 9rem 1fr auto;
          align-items: center;
          gap: 0.75rem;
          padding: 0.65rem 1rem 0.65rem 1.5rem;
          background: transparent;
          border-bottom: 1px solid rgba(242,51,89,0.08);
          transition: background 0.15s;
        }
        .prod-event-row:last-child{ border-bottom: none; }
        .prod-event-row:hover{ background: rgba(242,51,89,0.03); }
        .prod-event-row--past{
          opacity: 0.52;
        }
        .prod-event-date{
          font-family: var(--font-dm-sans, system-ui, sans-serif);
          font-size: 0.78rem;
          font-weight: 700;
          color: #241123;
          white-space: nowrap;
        }
        .prod-event-venue{
          font-family: var(--font-space-grotesk, system-ui, sans-serif);
          font-size: 0.82rem;
          color: #241123cc;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .prod-event-name{ font-weight: 600; }
        .prod-event-city{ opacity: 0.7; }
        .prod-event-ticket{
          font-family: var(--font-dm-sans, system-ui, sans-serif);
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #fff;
          background: #F23359;
          padding: 0.3rem 0.7rem;
          border-radius: 6px;
          text-decoration: none !important;
          white-space: nowrap;
          flex-shrink: 0;
          transition: opacity 0.15s;
        }
        .prod-event-ticket:hover{ opacity: 0.85; }
        .prod-events-all-link{
          display: inline-block;
          margin-top: 0.75rem;
          font-family: var(--font-dm-sans, system-ui, sans-serif);
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #7a5e80;
          text-decoration: none !important;
        }
        .prod-events-all-link:hover{ color: #241123; }
        @media (max-width: 600px){
          .prod-event-row{ grid-template-columns: 1fr; gap: 0.3rem; }
          .prod-event-venue{ white-space: normal; }
        }

        /* ── Card topbar ────────────────────────────────────────────── */
        .card-topbar{
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 1.5rem;
          padding-bottom: 1.25rem;
          border-bottom: 1px solid rgba(36,17,35,0.08);
          flex-wrap: wrap;
        }
        .card-topbar-cta{ white-space: nowrap; flex-shrink: 0; }

        /* ── Backstage pass ─────────────────────────────────────────── */
        .prod-backstage-pass{
          margin-top: 0.5rem;
          background: rgba(242,51,89,0.03);
          border: 1.5px solid rgba(242,51,89,0.18);
          border-radius: 14px;
          overflow: hidden;
          position: relative;
        }
        .prod-backstage-pass::before{
          content: '';
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 4px;
          background: linear-gradient(to bottom, #F23359, rgba(242,51,89,0.3));
          border-radius: 4px 0 0 4px;
        }

        /* Meta grid — production info at top */
        .prod-backstage-meta{
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem 2rem;
          padding: 1rem 1.25rem 1rem 1.5rem;
          border-bottom: 1px dashed rgba(242,51,89,0.15);
          background: rgba(242,51,89,0.04);
        }
        @media (max-width: 600px){
          .prod-backstage-meta{ grid-template-columns: 1fr; }
        }
        .prod-backstage-meta-left{ display: flex; flex-direction: column; gap: 0.25rem; }
        .prod-backstage-meta-title{
          font-family: var(--font-dm-sans, system-ui, sans-serif);
          font-size: 0.85rem;
          font-weight: 700;
          color: #241123;
          margin: 0;
          line-height: 1.3;
        }
        .prod-backstage-meta-sub{
          font-family: var(--font-dm-sans, system-ui, sans-serif);
          font-size: 0.78rem;
          font-weight: 600;
          color: rgba(36,17,35,0.6);
          margin: 0;
          font-style: italic;
        }
        .prod-backstage-meta-detail{
          font-family: var(--font-space-grotesk, system-ui, sans-serif);
          font-size: 0.78rem;
          color: rgba(36,17,35,0.55);
          margin: 0;
        }
        .prod-backstage-meta-club{
          font-size: 0.75rem;
          color: rgba(242,51,89,0.7);
          font-weight: 600;
        }
        .prod-backstage-meta-right{
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .prod-backstage-chip{
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
        }
        .prod-bp-chip-label{
          font-family: var(--font-dm-sans, system-ui, sans-serif);
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(242,51,89,0.65);
          white-space: nowrap;
          flex-shrink: 0;
          min-width: 4.5rem;
        }
        .prod-bp-chip-value{
          font-family: var(--font-space-grotesk, system-ui, sans-serif);
          font-size: 0.8rem;
          color: rgba(36,17,35,0.75);
        }

        .prod-backstage-header{
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.55rem 1rem 0.55rem 1.5rem;
          border-bottom: 1px dashed rgba(242,51,89,0.15);
          background: rgba(242,51,89,0.04);
        }
        .prod-backstage-archive-badge{
          font-family: var(--font-dm-sans, system-ui, sans-serif);
          font-size: 0.6rem;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(36,17,35,0.35);
          border: 1px solid rgba(36,17,35,0.18);
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
        }
        .prod-backstage-label{
          font-family: var(--font-dm-sans, system-ui, sans-serif);
          font-size: 0.63rem;
          font-weight: 700;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          color: rgba(242,51,89,0.75);
        }
        .prod-backstage-events{ padding: 0.35rem 0 0.1rem; }
        .prod-backstage-all-link{
          display: block;
          padding: 0.6rem 1rem 0.6rem 1.5rem;
          border-top: 1px dashed rgba(242,51,89,0.15);
          font-family: var(--font-dm-sans, system-ui, sans-serif);
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(242,51,89,0.7);
          text-decoration: none;
          transition: color 0.15s;
        }
        .prod-backstage-all-link:hover{ color: #F23359; }

        /* ── Backstage pass — ARCHIVE variant ───────────────────────── */
        .prod-backstage-pass--archive{
          background: rgba(36,17,35,0.03);
          border-color: rgba(36,17,35,0.14);
        }
        .prod-backstage-pass--archive::before{
          background: rgba(36,17,35,0.12);
        }
        .prod-backstage-pass--archive .prod-backstage-meta{
          background: rgba(36,17,35,0.04);
        }
        .prod-backstage-pass--archive .prod-backstage-meta-title{
          color: rgba(36,17,35,0.55);
        }
        .prod-backstage-pass--archive .prod-backstage-meta-club{
          color: rgba(36,17,35,0.4);
        }
        .prod-backstage-pass--archive .prod-backstage-header{
          background: rgba(36,17,35,0.04);
          border-bottom-color: rgba(36,17,35,0.10);
        }
        .prod-backstage-pass--archive .prod-backstage-label{
          color: rgba(36,17,35,0.40);
        }
        .prod-backstage-pass--archive .prod-backstage-all-link{
          border-top-color: rgba(36,17,35,0.10);
          color: rgba(36,17,35,0.45);
        }
        .prod-backstage-pass--archive .prod-backstage-all-link:hover{
          color: rgba(36,17,35,0.70);
        }
        .prod-backstage-pass--archive .prod-bp-chip-label{
          color: rgba(36,17,35,0.35);
        }
        .prod-backstage-pass--archive .prod-bp-chip-value{
          color: rgba(36,17,35,0.55);
        }

        /* ── Production Events Section ─────────────────────────────── */
        .pev-section{
          position: relative;
          background: #0d0812;
          padding: clamp(2.5rem, 6vw, 5rem) 0;
          overflow: hidden;
        }
        .pev-glow{
          position: absolute;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          pointer-events: none;
          opacity: 0.12;
          filter: blur(100px);
        }
        .pev-glow-left{
          top: -150px; left: -180px;
          background: radial-gradient(circle, #F23359 0%, transparent 70%);
        }
        .pev-glow-right{
          bottom: -200px; right: -180px;
          background: radial-gradient(circle, #2493A9 0%, transparent 70%);
        }

        .pev-inner{
          position: relative;
          z-index: 1;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 clamp(1.25rem, 6vw, 3rem);
        }

        .pev-head{ margin-bottom: clamp(1.5rem, 3vw, 2.5rem); }
        .pev-eyebrow{
          margin: 0 0 0.5rem;
          font-family: var(--font-space-grotesk, system-ui, sans-serif);
          font-size: 0.68rem; font-weight: 700; letter-spacing: 0.28em;
          text-transform: uppercase; color: #FFCC00;
        }
        .pev-title{
          margin: 0;
          font-family: var(--font-anton, system-ui, sans-serif);
          font-size: clamp(2rem, 5vw, 3.8rem);
          color: #f2f2f2; text-transform: uppercase; letter-spacing: 0.04em; line-height: 1;
        }
        .pev-subtitle{
          margin: 0.6rem 0 0;
          font-family: var(--font-space-grotesk, system-ui, sans-serif);
          font-size: 1rem; color: rgba(255,255,255,0.55); font-weight: 400;
        }

        /* Cards grid */
        .pev-grid{
          display: grid;
          gap: clamp(14px, 2.2vw, 20px);
          grid-template-columns: 1fr;
        }
        @media(min-width: 640px){ .pev-grid{ grid-template-columns: repeat(2, 1fr); } }
        @media(min-width: 1000px){ .pev-grid{ grid-template-columns: repeat(3, 1fr); } }

        /* Card */
        .pev-card{
          position: relative;
          background: #1a0f1e;
          border: 1px solid rgba(255,204,0,0.12);
          border-radius: 14px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease;
        }
        .pev-card:hover{
          transform: translateY(-3px);
          box-shadow: 0 16px 36px rgba(0,0,0,0.5);
          border-color: rgba(255,204,0,0.28);
        }

        .pev-card-img-shell{
          position: relative;
          width: 100%;
          height: 190px;
          flex-shrink: 0;
        }
        .pev-card-img{ object-position: center 30%; opacity: 0.38; }
        .pev-card-img-gradient{
          position: absolute; inset: 0;
          background: linear-gradient(to bottom, transparent 30%, #1a0f1e 100%);
        }

        .pev-card-body{
          padding: clamp(14px, 2vw, 20px);
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1;
        }

        .pev-date-block{
          display: flex;
          align-items: baseline;
          gap: 6px;
          margin-bottom: 6px;
        }
        .pev-date-day{
          font-family: var(--font-anton, system-ui, sans-serif);
          font-size: clamp(2.2rem, 4vw, 3rem);
          color: #FFCC00;
          line-height: 1;
        }
        .pev-date-mon{
          font-family: var(--font-space-grotesk, system-ui, sans-serif);
          font-size: 0.72rem; font-weight: 700; letter-spacing: 0.22em;
          text-transform: uppercase; color: rgba(255,255,255,0.55);
        }
        .pev-date-yr{
          font-family: var(--font-space-grotesk, system-ui, sans-serif);
          font-size: 0.72rem; font-weight: 400; letter-spacing: 0.12em;
          color: rgba(255,255,255,0.35);
          margin-left: 2px;
        }

        .pev-cat-pill{
          display: inline-flex;
          align-items: center;
          padding: 0.15rem 0.55rem;
          border-radius: 999px;
          border: 1px solid;
          font-family: var(--font-space-grotesk, system-ui, sans-serif);
          font-size: 0.6rem; font-weight: 700; letter-spacing: 0.18em;
          text-transform: uppercase;
          width: fit-content;
          margin-bottom: 4px;
        }

        .pev-venue{
          margin: 0;
          font-family: var(--font-space-grotesk, system-ui, sans-serif);
          font-size: 0.92rem; font-weight: 700; color: #f2f2f2; letter-spacing: 0.04em;
        }
        .pev-city{
          margin: 0;
          font-family: var(--font-space-grotesk, system-ui, sans-serif);
          font-size: 0.76rem; font-weight: 500; color: rgba(255,255,255,0.5);
          text-transform: uppercase; letter-spacing: 0.12em;
        }
        .pev-time{
          margin: 0;
          font-family: var(--font-space-grotesk, system-ui, sans-serif);
          font-size: 0.74rem; color: rgba(255,255,255,0.4); letter-spacing: 0.08em;
        }
        .pev-desc{
          margin: 6px 0 0;
          font-family: var(--font-space-grotesk, system-ui, sans-serif);
          font-size: 0.84rem; line-height: 1.5; color: rgba(255,255,255,0.62);
          flex: 1;
        }

        .pev-card-footer{
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid rgba(255,255,255,0.08);
        }
        .pev-ticket-btn{
          display: inline-block;
          padding: 0.4rem 1rem;
          background: #F23359;
          color: #fff !important;
          border-radius: 6px;
          font-family: var(--font-space-grotesk, system-ui, sans-serif);
          font-size: 0.74rem; font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase;
          text-decoration: none !important;
          transition: background 150ms ease, transform 150ms ease;
        }
        .pev-ticket-btn:hover{ background: #c9273f; transform: translateY(-1px); }

        .pev-ticket-pill{
          font-family: var(--font-space-grotesk, system-ui, sans-serif);
          font-size: 0.72rem; color: rgba(255,255,255,0.45); letter-spacing: 0.1em;
        }

        .pev-cat-link,
        .pev-cat-link:link,
        .pev-cat-link:visited,
        .pev-cat-link:hover,
        .pev-cat-link:focus,
        .pev-cat-link:focus-visible,
        .pev-cat-link:active{
          font-family: var(--font-space-grotesk, system-ui, sans-serif);
          font-size: 0.68rem; font-weight: 600; letter-spacing: 0.16em;
          text-transform: uppercase; color: rgba(255,204,0,0.7) !important;
          text-decoration: none !important;
          transition: color 150ms ease;
        }
        .pev-cat-link:hover, .pev-cat-link:focus-visible{ color: #FFCC00 !important; }

        /* Past runs list */
        .pev-past-wrap{
          margin-top: clamp(2rem, 4vw, 3rem);
          padding-top: 1.5rem;
          border-top: 1px solid rgba(255,255,255,0.07);
        }
        .pev-past-head{
          margin: 0 0 1rem;
          font-family: var(--font-space-grotesk, system-ui, sans-serif);
          font-size: 0.68rem; font-weight: 700; letter-spacing: 0.22em;
          text-transform: uppercase; color: rgba(255,255,255,0.4);
        }
        .pev-past-list{
          list-style: none; margin: 0; padding: 0;
          display: flex; flex-direction: column; gap: 8px;
        }
        .pev-past-item{
          display: flex; align-items: baseline; gap: 12px;
          font-family: var(--font-space-grotesk, system-ui, sans-serif);
          font-size: 0.84rem;
        }
        .pev-past-year{
          flex-shrink: 0;
          font-weight: 700; color: rgba(255,204,0,0.7);
          letter-spacing: 0.08em;
        }
        .pev-past-info{ color: rgba(255,255,255,0.5); }

        .pev-footer-link{
          margin-top: clamp(1.5rem, 3vw, 2.5rem);
          display: flex;
          justify-content: flex-end;
        }
        .pev-all-events-link,
        .pev-all-events-link:link,
        .pev-all-events-link:visited,
        .pev-all-events-link:hover,
        .pev-all-events-link:focus,
        .pev-all-events-link:focus-visible,
        .pev-all-events-link:active{
          font-family: var(--font-space-grotesk, system-ui, sans-serif);
          font-size: 0.78rem; font-weight: 700; letter-spacing: 0.18em;
          text-transform: uppercase; color: rgba(255,255,255,0.45) !important;
          text-decoration: none !important;
          transition: color 150ms ease;
        }
        .pev-all-events-link:hover, .pev-all-events-link:focus-visible{
          color: #FFCC00 !important;
        }
      `}</style>
    </main>
  );
}
