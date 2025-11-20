"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { DATButtonLink } from "@/components/ui/DATButton";
import ProductionTagButtons from "@/components/ui/ProductionTagButtons";
import DramaClubBadge from "@/components/ui/DramaClubBadge";
import ProcessBand from "@/components/productions/ProcessBand";
import ProductionGallery from "@/components/productions/ProductionGallery";

/* -------------------------- Types -------------------------- */
export type PersonRole = { role: string; name: string; href?: string };
export type GalleryImage = { src: string; alt: string };
type CreditPerson = { name: string; href?: string };

export type ResourceLink = { label: string; href: string };

type ProcessSlice = {
  heading?: string;
  body?: string | string[];
  image: GalleryImage;
  align?: "left" | "right";
  quote?: { text: string; attribution?: string };
};

type CauseForTemplate = {
  label: string;
  iconSrc?: string;
  iconAlt?: string;
  href?: string;
};

type PartnerForTemplate = {
  name: string;
  href: string;
  type: "community" | "artistic" | "impact" | "primary";
  logoSrc?: string;
  logoAlt?: string;
};

export interface ProductionPageTemplateProps {
  title: string;

  // Season / hero
  seasonLabel?: string;
  seasonHref?: string;

  /** Tagline — if found inside the synopsis, it will replace that paragraph inline */
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

  // Dates for dynamic button (kept in props but not needed for the simpler logic)
  runStartISO?: string; // e.g. "2025-03-12"
  runEndISO?: string; // e.g. "2025-04-02"

  // Hero
  heroImageUrl?: string;
  heroImageAlt?: string;

  // Body
  synopsis?: string | string[]; // supports inline HTML anchors
  themes?: string[];
  pullQuote?: { quote: string; attribution?: string; attributionHref?: string };
  quoteImageUrl?: string;

  // Roster
  creativeTeam?: PersonRole[];
  cast?: PersonRole[];

  // Media – main production gallery
  galleryImages?: GalleryImage[];
  /** e.g. "Jane Doe" – used in Production Gallery credit line */
  productionPhotographer?: string | null;
  /** Full album link (Flickr, etc.) for the Production Gallery tile */
  productionAlbumHref?: string | null;
  /** Optional custom copy for the album tile */
  productionAlbumLabel?: string | null;

  // Media – secondary “field / BTS” gallery
  fieldGalleryImages?: GalleryImage[];
  fieldGalleryTitle?: string;
  /** Full album link for the Field / BTS album */
  fieldAlbumHref?: string | null;
  /** Optional custom copy for the field album tile */
  fieldAlbumLabel?: string | null;

  // Community / Supporters
  dramaClubName?: string;
  dramaClubLocation?: string;
  dramaClubLink?: string;

  /** Generic causes this production champions */
  causes?: CauseForTemplate[];

  /** Impact / community / artistic partners */
  partners?: PartnerForTemplate[];

  // CTAs
  getInvolvedLink?: string;
  donateLink?: string;
  ticketsLink?: string;
  notifyMeUrl?: string; // <-- for “Get Ticket Updates” if we add that state later

  // Process (used by ProcessBand)
  processSections?: ProcessSlice[];

  // Misc
  resources?: ResourceLink[]; // all links (reviews, articles, etc.)
  autoLinkPeopleBase?: string;
  renderAfterHero?: ReactNode;
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

const isExternal = (href?: string) =>
  !!href && /^(https?:)?\/\//i.test(href);

function NameCell({
  name,
  href,
  base = "/alumni",
}: {
  name: string;
  href?: string;
  base?: string;
}) {
  const finalHref = href ?? `${base}/${slugify(name)}`;
  return (
    <Link
      href={finalHref}
      className="namecell no-underline transition-colors"
      style={{ textDecoration: "none" }}
    >
      {name}
    </Link>
  );
}

/**
 * Parse the title for hero display.
 *
 * Rules:
 *   - If the string contains `--`, text before is the main title.
 *   - Everything after `--` becomes the secondary line.
 *   - If the secondary part ends with parentheses, those become a
 *     comma phrase instead:
 *       "Staged Reading (Kennedy Center)" → "Staged Reading, Kennedy Center"
 */
function parseHeroTitle(raw: string): { main: string; variant?: string } {
  if (!raw) return { main: "" };

  const trimmed = raw.trim();
  const ddIndex = trimmed.indexOf("--");

  let mainPart = trimmed;
  let rest: string | undefined;

  if (ddIndex !== -1) {
    mainPart = trimmed.slice(0, ddIndex);
    rest = trimmed.slice(ddIndex + 2); // skip the "--"
  } else {
    mainPart = trimmed;
    rest = undefined;
  }

  mainPart = mainPart.replace(/\s+/g, " ").trim();

  let variant: string | undefined;
  if (rest) {
    let r = rest.trim().replace(/\s+/g, " ");

    // If we have trailing parentheses, convert them to a comma phrase
    const parenMatch = r.match(/^(.*)\(([^)]+)\)\s*$/);
    if (parenMatch) {
      const before = parenMatch[1].trim();
      const inside = parenMatch[2].trim();

      if (before && inside) {
        variant = `${before}, ${inside}`;
      } else if (before) {
        variant = before;
      } else if (inside) {
        variant = inside;
      }
    } else {
      variant = r;
    }
  }

  return { main: mainPart || trimmed, variant };
}

/**
 * Heuristic to determine if the run is clearly in the past
 * based on the freeform `dates` string.
 *
 * - Treat anything with "Original Production" as archival.
 * - Otherwise, look for year(s) and compare to current year.
 */
function inferIsPastRun(dates?: string): boolean {
  if (!dates) return false;

  const lower = dates.toLowerCase();

  // Explicit archival phrasing you already use
  if (lower.includes("original production")) return true;

  // Grab any 19xx/20xx years in the string
  const yearMatches = dates.match(/\b(19|20)\d{2}\b/g);
  if (!yearMatches) return false;

  const years = yearMatches.map((y) => parseInt(y, 10));
  const latestYear = Math.max(...years);
  const currentYear = new Date().getFullYear();

  return latestYear < currentYear;
}

function PartnerLogoShell({
  src,
  alt,
}: {
  src?: string;
  alt: string;
}) {
  const [isBroken, setIsBroken] = useState(false);

  // No src, empty string, or previously broken → render nothing
  if (!src || !src.trim() || isBroken) return null;

  return (
    <div className="partner-logo-shell">
      <img
        src={src}
        alt={alt}
        className="partner-logo"
        loading="lazy"
        onError={() => setIsBroken(true)}
      />
    </div>
  );
}

/* ======================= COMPONENT ========================= */
export default function ProductionPageTemplate(props: ProductionPageTemplateProps) {
  const {
    title,
    // hero/season
    seasonLabel,
    seasonHref,
    subtitle,

    // credits
    creditPrefix,
    creditPeople,
    playwright,
    playwrightHref,

    // meta
    dates,
    festival,
    festivalHref,
    venue,
    venueHref,
    city,
    location,
    runtime,
    ageRecommendation,
    // runStartISO, // kept in props but not needed for simplified logic
    // runEndISO,

    // hero
    heroImageUrl,
    heroImageAlt,

    // body
    synopsis,
    themes,
    pullQuote,
    quoteImageUrl,

    // roster
    creativeTeam,
    cast,

    // media – main gallery
    galleryImages,
    productionPhotographer,
    productionAlbumHref,
    productionAlbumLabel,

    // media – field/BTS gallery
    fieldGalleryImages,
    fieldGalleryTitle,
    fieldAlbumHref,
    fieldAlbumLabel,

    // community / supporters
    dramaClubName,
    dramaClubLocation,
    dramaClubLink,

    causes,
    partners,

    // CTAs
    getInvolvedLink,
    donateLink,
    ticketsLink,
    notifyMeUrl, // currently unused in this simpler logic

    // process
    processSections,

    // misc
    resources,
    autoLinkPeopleBase = "/alumni",
    renderAfterHero,
  } = props;

  // --- Hero fallback logic ---
  const [heroBroken, setHeroBroken] = useState(false);

  const heroSrc =
    !heroBroken && heroImageUrl
      ? heroImageUrl
      : "/posters/fallback-16x9.jpg";

  const { main: heroTitleMain, variant: heroTitleVariant } = parseHeroTitle(title);
  const displayTitle = heroTitleMain; // everywhere except hero secondary line

  const hasThemes = !!themes?.length;
  const hasPullQuote = !!pullQuote?.quote;
  const hasCreativeTeam = !!creativeTeam?.length;
  const hasCast = !!cast?.length;

  // Normalize synopsis
  const synopsisParas: string[] = (() => {
    if (!synopsis) return [];
    if (Array.isArray(synopsis)) return synopsis;
    return synopsis
      .split(/\n{2,}/)
      .map((s) => s.trim())
      .filter(Boolean);
  })();
  const hasSynopsis = synopsisParas.length > 0;

  // Fallback gallery if none provided (so you always see something)
  const fallbackGallery: GalleryImage[] = [
    { src: "/images/Andean_Mask_Work.jpg", alt: "Mask work exercise in the Andes" },
    { src: "/images/teaching-andes.jpg", alt: "Teaching theatre with Andean mountains behind" },
    { src: "/images/performing-zanzibar.jpg", alt: "Outdoor performance in Zanzibar" },
  ];
  const gallery =
    galleryImages && galleryImages.length > 0 ? galleryImages : fallbackGallery;
  const hasGallery = !!gallery?.length;

  // Field gallery: if none provided, reuse some production images so you can see the block
  const fieldGallery =
    fieldGalleryImages && fieldGalleryImages.length > 0
      ? fieldGalleryImages
      : gallery && gallery.length > 0
      ? gallery.slice(0, 3)
      : undefined;
  const hasFieldGallery = !!fieldGallery?.length;

  const hasProcess = !!processSections?.length;

  // Clean resources: skip broken ones
  const validResources = resources?.filter((r) => r && r.label && r.href) ?? [];
  const hasResources = validResources.length > 0;

  // --- Derived display values ---

  // Only show photographer credit when it's real
  const hasRealPhotographer =
    typeof productionPhotographer === "string" &&
    productionPhotographer.trim().length > 0;

  const photographerDisplay = hasRealPhotographer
    ? productionPhotographer!.trim()
    : undefined;

  const photographerHref =
    hasRealPhotographer && productionPhotographer
      ? `/alumni/${slugify(productionPhotographer.trim())}`
      : undefined;

  // Show the album tile even if a real link isn't wired yet
  const albumHrefDisplay =
    (productionAlbumHref?.trim() ?? "") !== ""
      ? productionAlbumHref!
      : "https://www.flickr.com/photos/your-handle/albums/1234567890";

  const albumLabelDisplay =
    (productionAlbumLabel?.trim() ?? "") !== ""
      ? productionAlbumLabel!
      : "View production album";

  const fieldAlbumHrefDisplay =
    (fieldAlbumHref?.trim() ?? "") !== ""
      ? fieldAlbumHref!
      : "https://www.flickr.com/photos/your-handle/albums/0987654321";

  const fieldAlbumLabelDisplay =
    (fieldAlbumLabel?.trim() ?? "") !== ""
      ? fieldAlbumLabel!
      : "View field album";

  // Determine primary CTA button for top-right of the white card
  const runIsPast = inferIsPastRun(dates);
  let primaryCtaHref = "";
  let primaryCtaLabel = "";

  if (ticketsLink && !runIsPast) {
    // Current or upcoming run with tickets
    primaryCtaHref = ticketsLink;
    primaryCtaLabel = "Purchase Tickets";
  } else if (donateLink) {
    // Archival / no tickets → sponsor
    primaryCtaHref = donateLink;
    primaryCtaLabel = "Sponsor the Story";
  } else if (getInvolvedLink) {
    // Fallback if nothing else is set
    primaryCtaHref = getInvolvedLink;
    primaryCtaLabel = "Get Involved";
  }

  // Tagline inline replacement (magazine-style)
  const normalized = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();
  const inlineSynopsisNodes = (() => {
    if (!hasSynopsis) return null;

    if (!subtitle) {
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
      if (!replaced && normalized(p).includes(normalized(subtitle))) {
        replaced = true;
        return (
          <p key={`tag-${i}`} className="tagline-inline mt-2">
            {subtitle}
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

  // Meta lines (feature the big three; rest much smaller)
  const venueCity = [venue, city || location].filter(Boolean).join(", ");
  const metaValues: Array<{ value: React.ReactNode; hero?: boolean }> = [];
  if (dates) metaValues.push({ value: dates, hero: true });
  if (festival || festivalHref) {
    const v = festivalHref ? (
      <a
        className="meta-link"
        href={festivalHref}
        {...(isExternal(festivalHref)
          ? { target: "_blank", rel: "noreferrer" }
          : {})}
      >
        {festival}
      </a>
    ) : (
      festival
    );
    metaValues.push({ value: v, hero: true });
  }
  if (venueCity) {
    const v = venueHref ? (
      <a
        className="meta-link"
        href={venueHref}
        {...(isExternal(venueHref)
          ? { target: "_blank", rel: "noreferrer" }
          : {})}
      >
        {venueCity}
      </a>
    ) : (
      venueCity
    );
    metaValues.push({ value: v, hero: true });
  }
  if (runtime) metaValues.push({ value: runtime });
  if (ageRecommendation) metaValues.push({ value: ageRecommendation });

  // Credit line
  const creditNodes = (() => {
    if (creditPeople?.length) {
      const count = creditPeople.length;
      return creditPeople.map((p, i) => {
        const isLast = i === count - 1;
        const isPenultimate = i === count - 2;
        const sep = isLast ? "" : isPenultimate ? (count >= 3 ? ", and " : " & ") : ", ";
        const node = p.href ? (
          <Link
            key={`${p.name}-${i}`}
            href={p.href}
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
    if (playwright) {
      return playwrightHref ? (
        <Link
          href={playwrightHref}
          className="playwright-link inline-block no-underline"
        >
          {playwright}
        </Link>
      ) : (
        <span
          className="inline-block playwright-link"
          style={{ color: "#ffcc00" }}
        >
          {playwright}
        </span>
      );
    }
    return null;
  })();

  const showByline = Boolean(creditPrefix || creditNodes);
  const bylinePrefix = creditPrefix ?? (creditNodes ? "By" : undefined);

  // Generic impact blurb – works if show is current OR archival
  const impactBlurb =
    "Whether you’ve discovered this production while it’s on stage or years after the final curtain, your support helps fuel long-term youth drama clubs, artist mentorship, and new work in communities around the world.";

  const showAboutSection = Boolean(hasSynopsis || hasThemes);

  // Impact visibility logic
  const hasImpactCTA = !!donateLink || !!getInvolvedLink;
  const hasDramaClub =
    !!dramaClubName || !!dramaClubLink || !!dramaClubLocation;
  const hasCauses = !!causes?.length;
  const hasPartners = !!partners?.length;
  const showImpactBlock =
    hasImpactCTA || hasDramaClub || hasCauses || hasPartners;

  return (
    <main
      className="min-h-screen"
      style={{
        color: "#241123",
        backgroundImage: 'url("/texture/kraft-paper.png")',
        backgroundSize: "cover",
        backgroundAttachment: "fixed",
        backgroundRepeat: "repeat",
      }}
    >
      {/* ========================= HERO ========================= */}
      <section className="relative isolate">
        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "16 / 9", // 16:9 hero container
            overflow: "hidden",
            zIndex: 0,
            boxShadow: "0 18px 38px rgba(0,0,0,0.18)",
          }}
        >
          <Image
            src={heroSrc}
            alt={heroImageAlt || displayTitle}
            fill
            priority
            className="object-cover object-center"
            onError={() => setHeroBroken(true)}
          />

          {/* readability overlay */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/70 to-black/35" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
          </div>

          {/* Hero title stack */}
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
            <div className="hero-text-group">
              {seasonLabel &&
                (seasonHref ? (
                  <Link
                    href={seasonHref}
                    className="season-link hit-area no-underline"
                  >
                    <span className="eyebrow season-eyebrow">
                      {seasonLabel}
                    </span>
                  </Link>
                ) : (
                  <span className="eyebrow season-eyebrow">
                    {seasonLabel}
                  </span>
                ))}

              <h1 className="hero-title">{heroTitleMain}</h1>

              {heroTitleVariant && (
                <p className="hero-subtitle">{heroTitleVariant}</p>
              )}

              {showByline && (
                <p className="hero-byline">
                  {bylinePrefix && (
                    <span className="byline-prefix">{bylinePrefix} </span>
                  )}
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
            background: "rgba(255,255,255,0.60)", // 60%
            borderRadius: 18,
            margin: "clamp(1.25rem, 3vw, 2.25rem) 0",
            padding: "clamp(1.2rem, 3.2vw, 2.4rem)",
            boxShadow: "0 18px 48px rgba(36,17,35,0.10)",
            backdropFilter: "saturate(1.05)",
          }}
        >
          <section className="rows">
            {/* ROW 1: Dates/Festival/Venue (70%) + Dynamic CTA Button (30%) */}
            <div className="row row70">
              {/* LEFT: title + meta */}
              <div>
                <div className="meta-stack">
                  <h2 className="meta-title">{displayTitle}</h2>
                  {metaValues.map(({ value, hero }, i) => (
                    <div
                      key={i}
                      className={`meta-line ${
                        hero ? "meta-hero" : "meta-sub"
                      }`}
                    >
                      {value}
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT: single dynamic button in top-right */}
              <div className="r1-tickets">
                {primaryCtaHref && primaryCtaLabel && (
                  <DATButtonLink
                    href={primaryCtaHref}
                    size="lg"
                    className="tickets-btn"
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
            </div>

            {/* Quote band (full width) */}
            {hasPullQuote && (
              <div className="row rowFull section-block">
                <div className="quote-band">
                  <div className="quote-img">
                    <Image
                      src={
                        quoteImageUrl ||
                        heroSrc ||
                        "/images/teaching-amazon.jpg"
                      }
                      alt={pullQuote?.attribution || displayTitle}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="quote-copy">
                    <blockquote className="big-quote">
                      “{pullQuote!.quote}”
                    </blockquote>
                    {pullQuote!.attribution && (
                      <p className="big-quote-source">
                        {pullQuote!.attributionHref ? (
                          <a
                            href={pullQuote!.attributionHref}
                            className="quote-source-link"
                            target="_blank"
                            rel="noreferrer"
                          >
                            — {pullQuote!.attribution}
                          </a>
                        ) : (
                          <>— {pullQuote!.attribution}</>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ROW: About & Resources (70/30) */}
            <div className="row row70">
              {/* ABOUT */}
              {showAboutSection && (
                <section className="section-block section-block-indent">
                  <h2 id="about-heading" className="section-head">
                    About
                  </h2>
                  {inlineSynopsisNodes}
                  {hasThemes && (
                    <div className="mt-5 production-tags">
                      <ProductionTagButtons tags={themes!} dense />
                    </div>
                  )}
                </section>
              )}

              {/* RESOURCES: all links */}
              {hasResources && (
                <section className="section-block resources-area section-block-indent">
                  <h2 id="resources-heading" className="section-head">
                    Resources
                  </h2>
                  <ul className="resources-list">
                    {validResources.map((item, idx) => (
                      <li key={idx} className="resource-item">
                        <a
                          href={item.href}
                          className="resource-link"
                          {...(isExternal(item.href)
                            ? { target: "_blank", rel: "noreferrer" }
                            : {})}
                        >
                          {item.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>

            {/* PROCESS (full width) */}
            {hasProcess && (
              <div className="row rowFull section-block" id="process">
                <ProcessBand slides={processSections!} title="Process" />
              </div>
            )}

            {/* ROW: Impact (L) & Supporters (R) — 50/50 */}
            {showImpactBlock && (
              <div className="row row50">
                {/* Impact & Community (left) */}
                <section
                  className="section-block section-block-indent"
                  aria-labelledby="impact-cta-heading"
                >
                  <h2 id="impact-cta-heading" className="section-head">
                    Impact & Community
                  </h2>
                  <p
                    className="body-text"
                    style={{ marginTop: 8, maxWidth: 680 }}
                  >
                    {impactBlurb}
                  </p>
                  <div
                    className="impact-cta-stack"
                    style={{ marginTop: 10 }}
                  >
                    {donateLink && (
                      <DATButtonLink
                        href={donateLink}
                        variant="yellow"
                        size="lg"
                        className="sponsor-btn"
                      >
                        Sponsor the Story
                      </DATButtonLink>
                    )}
                    {getInvolvedLink && (
                      <Link
                        href={getInvolvedLink}
                        className="involved-link under-btn"
                      >
                        Volunteer / Get Involved
                      </Link>
                    )}
                  </div>
                </section>

                {/* Supporters block (right) */}
                <section className="section-block">
                  <div
                    className="grid items-start"
                    style={{
                      gridTemplateColumns: "auto 1fr",
                      gap: "clamp(20px, 3.5vw, 44px)",
                    }}
                  >
                    {/* Drama Club */}
                    {(dramaClubName || dramaClubLink) && (
                      <>
                        <div className="drama-club-wrapper">
                          {dramaClubLink ? (
                            <Link
                              href={dramaClubLink}
                              className="drama-club-link no-underline"
                              aria-label={dramaClubName}
                            >
                              <DramaClubBadge
                                name={dramaClubName ?? ""}
                                size={150}
                                wrappedByParentLink
                              />
                            </Link>
                          ) : (
                            <div className="drama-club-link">
                              <DramaClubBadge
                                name={dramaClubName ?? ""}
                                size={150}
                              />
                            </div>
                          )}
                        </div>
                        <div style={{ alignSelf: "center" }}>
                          <p className="support-eyebrow-tight">
                            THIS PRODUCTION SUPPORTS
                          </p>
                          <h3
                            className="club-name"
                            style={{ marginTop: 6 }}
                          >
                            {dramaClubLink ? (
                              <Link
                                href={dramaClubLink}
                                className="club-link-black no-underline"
                              >
                                {dramaClubName}
                              </Link>
                            ) : (
                              dramaClubName
                            )}
                          </h3>
                          {dramaClubLocation && (
                            <p className="club-loc">{dramaClubLocation}</p>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Causes we champion */}
                  {!!causes?.length && (
                    <div className="mt-5 mb-6 section-block-indent">
                      <p className="support-eyebrow-tight">
                        CAUSES WE CHAMPION
                      </p>
                      <div className="cause-row">
                        {causes.map((c) =>
                          c.href ? (
                            <Link
                              key={c.label}
                              href={c.href}
                              className="cause-chip no-underline"
                            >
                              {c.label}
                            </Link>
                          ) : (
                            <span key={c.label} className="cause-chip">
                              {c.label}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* Impact / Community / Artistic partners */}
                  {!!partners?.length && (
                    <div className="impact-partners-block section-block-indent">
                      <p className="support-eyebrow-tight">
                        IMPACT PARTNERS
                      </p>

                      <div className="partner-list">
                        {partners.map((p) => {
                          const hasLogo =
                            typeof p.logoSrc === "string" &&
                            p.logoSrc.trim().length > 0;

                          return (
                            <a
                              key={p.name}
                              href={p.href}
                              className={`partner-bar ${
                                hasLogo ? "" : "partner-no-logo"
                              }`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {hasLogo && (
                                <PartnerLogoShell
                                  src={p.logoSrc}
                                  alt={p.logoAlt || p.name}
                                />
                              )}

                              <div className="partner-text">
                                <span className="partner-name">
                                  {p.name}
                                </span>
                              </div>
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </section>
              </div>
            )}

            {/* ROW: Cast & Team — 50/50 */}
            <div className="row row50">
              {hasCast && (
                <section
                  className="section-block"
                  aria-labelledby="cast-heading"
                  style={{ paddingLeft: 4 }}
                >
                  <h2 id="cast-heading" className="section-head">
                    Cast
                  </h2>
                  <ul className="mt-4">
                    {cast!.map((member, i) => (
                      <li
                        key={`${member.role}-${member.name}-${i}`}
                        className="flex items-center justify-between gap-4 py-3 border-top-soft text-sm"
                      >
                        <span className="role-label">
                          {member.role}
                        </span>
                        <span className="font-medium">
                          <NameCell
                            name={member.name}
                            href={member.href}
                            base={autoLinkPeopleBase}
                          />
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {hasCreativeTeam && (
                <section
                  className="section-block"
                  aria-labelledby="team-heading"
                  style={{ paddingLeft: 4 }}
                >
                  <h2 id="team-heading" className="section-head">
                    Creative Team
                  </h2>
                  <ul className="mt-4">
                    {creativeTeam!.map((person, i) => (
                      <li
                        key={`${person.role}-${person.name}-${i}`}
                        className="flex items-center justify-between gap-4 py-3 border-top-soft text-sm"
                      >
                        <span className="role-label">
                          {person.role}
                        </span>
                        <span className="font-medium">
                          <NameCell
                            name={person.name}
                            href={person.href}
                            base={autoLinkPeopleBase}
                          />
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>

            {/* GALLERY (full width) – Production */}
            {hasGallery && (
              <ProductionGallery
                images={gallery}
                title={displayTitle}
                photographer={photographerDisplay}
                albumHref={albumHrefDisplay}
                albumLabel={albumLabelDisplay}
                photographerHref={photographerHref}
              />
            )}

            {/* SECOND GALLERY – From the Field / BTS */}
            {hasFieldGallery && (
              <ProductionGallery
                images={fieldGallery!}
                title={fieldGalleryTitle || `${displayTitle} — From the Field`}
                photographer={null}
                photographerHref={undefined}
                albumHref={fieldAlbumHrefDisplay}
                albumLabel={fieldAlbumLabelDisplay}
              />
            )}
          </section>
        </article>
      </section>

      {/* Scoped editorial styles */}
      <style>{`
        /* Fonts (local fallbacks) */
        @font-face{ font-family:"DM Sans"; src:url("/fonts/dm-sans-v16-latin/dm-sans-v16-latin-regular.woff2") format("woff2"); font-display:swap; }
        @font-face{ font-family:"Space Grotesk"; src:url("/fonts/space-grotesk-v21-latin/space-grotesk-v21-latin-regular.woff2") format("woff2"); font-display:swap; }
        @font-face{ font-family:"Anton"; src:url("/fonts/anton-v27-latin_latin-ext_vietnamese-regular.woff2") format("woff2"); font-display:swap; }
        @font-face{ font-family:"Rock Salt"; src:url("/fonts/rock-salt-v23-latin-regular.woff2") format("woff2"); font-display:swap; }

        :where(main) a { text-decoration: none !important; }

        /* Unified subtle halo behind ALL hero text (season, title, subtitle, byline) */
        .eyebrow,
        .hero-title,
        .hero-subtitle,
        .hero-byline{
          text-shadow:
            0 0 4px rgba(0,0,0,0.82),
            0 8px 24px rgba(0,0,0,0.90);
        }

        .eyebrow{
          display:block; margin-bottom:0.375rem;
          font-family: "Space Grotesk", system-ui, sans-serif;
          font-size: 0.7rem; text-transform: uppercase; font-weight: 600; letter-spacing: 0.22em;
          color: #f2f2f2; opacity: 0.75;
          transition: opacity 160ms ease, letter-spacing 160ms ease, color 160ms ease;
        }

        /* Make season hover easier: larger hit-area */
        .hit-area{
          display:inline-block;
          padding:20px 14px;
          margin-left:-8px;
          margin-top:-4px;
          margin-bottom:-2px;
        }
        .season-link{ position: relative; }

        .hero-text-group{
          display:inline-block;
        }

        /* Only change season label while the season link itself is hovered */
        .season-link:hover .season-eyebrow{
          color:#FFCC00 !important;
          letter-spacing:0.30em;
          opacity:1 !important;
        }

        .hero-title{
          font-family: "Anton", system-ui, sans-serif;
          font-size: clamp(2.8rem, 7vw, 7rem);
          color: #f2f2f2; text-transform: uppercase;
          margin: 0; line-height: 1; letter-spacing: 0.06em; opacity: .9;
        }

        .hero-subtitle{
          margin-top: .4rem;
          font-family: "Space Grotesk", system-ui, sans-serif;
          font-size: clamp(1rem, 2.2vw, 1.5rem);
          letter-spacing: .18em;
          text-transform: uppercase;
          font-weight: 600;
          color: #f2f2f2;
          opacity: 0.9;
        }

        .hero-byline{
          margin-top: .65rem;
          font-family: "Space Grotesk", system-ui, sans-serif;
          font-size: .9rem; letter-spacing: .08em; text-transform: uppercase; font-weight: 600;
          color: #f2f2f2;
        }
        .byline-prefix{ opacity:.6; }

        .playwright-link {
          color: #f2f2f2;
          font-weight: 700;
          transition: color 180ms ease, letter-spacing 180ms ease, transform 180ms ease, opacity 180ms ease;
          letter-spacing: 0.22em;
          opacity: .85;
        }
        .playwright-link:hover {
          color:#FFCC00 !important;
          letter-spacing:0.30em;
          transform: translateX(2px);
          opacity:1;
        }

        /* Inline tagline (Rock Salt) */
        .tagline-inline{
          font-family: "Rock Salt", cursive;
          font-weight: 400; line-height: 1.25; color: #F23359;
          font-size: clamp(1.15rem, 3.0vw, 2.0rem);
          word-break: break-word;
        }

        /* Rows */
        .rows{ display: grid; gap: clamp(18px, 2.6vw, 28px); }
        .row{ display:grid; gap: clamp(16px, 2vw, 24px); align-items:start; }
        .row70{ grid-template-columns: 7fr 3fr; }
        .row50{ grid-template-columns: 1fr 1fr; }
        .rowFull{ grid-template-columns: 1fr; }
        .r1-tickets{ justify-self: end; align-self: flex-start; }

        .section-block{
          border-top: 1px solid #2411231F;
          padding-top: 14px;
          margin-top: 18px;
        }

        /* About & Impact & Resources indent by 2.5rem (content), headers nudged back for About + Impact) */
        .section-block-indent{
          padding-left: 2.5rem;
        }
        #about-heading,
        #impact-cta-heading,
        #resources-heading{
          margin-left: -2.5rem;
        }

        .section-head{
          font-family: "DM Sans", system-ui, sans-serif;
          font-size: .86rem;
          text-transform: uppercase;
          letter-spacing: .22em;
          color: #241123B3;
          font-weight: 700;
          margin: 0;
        }

        /* Meta */
        .meta-stack{ display:flex; flex-direction:column; gap:8px; }
        .meta-line{
          font-family: "Space Grotesk", system-ui, sans-serif;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          line-height: 1.2;
        }
        .meta-line.meta-hero{
          font-size: 1.14rem;
          font-weight: 900;
          color: #241123;
        }
        .meta-line.meta-sub{
          font-size: .78rem;
          font-weight: 600;
          color: #24112399;
        }

        .meta-title{
          margin: 0 0 0rem 0;
          font-family: "Space Grotesk", system-ui, sans-serif;
          font-size: clamp(1.4rem, 3vw, 2.1rem);
          letter-spacing: .12em;
          text-transform: uppercase;
          font-weight: 900;
          color: #241123;
        }

        /* Festival/Venue links: subtle expand + letter-spacing on hover (expand to the right) */
        .meta-link{
          color: #6c00af;
          text-decoration: none;
          transform-origin: left center;
          transition: color 160ms ease, transform 160ms ease, opacity 160ms ease, letter-spacing 160ms ease;
        }
        .meta-link:hover{
          color: #F23359;
          transform: scale(1.02) translateX(1px);
          opacity: 1;
          letter-spacing: .16em;
        }

        /* About body / synopsis weight (matches resources) */
        .body-text{
          font-family: "Space Grotesk", system-ui, sans-serif;
          font-size: 1.05rem;
          line-height: 1.66;
          color: #241123E6;
        }
        .about-body{
          font-weight: 400;
          letter-spacing: .005em;
        }

        .about-body a{
          color:#6c00af;
          font-weight: 500;
          text-decoration: underline;
          text-underline-offset: 3px;
          transition: color 160ms ease, transform 160ms ease;
        }
        .about-body a:hover{
          color:#F23359;
          transform: translateY(-1px);
        }

        /* Tags overrides: DAT Blue with darker hover */
        .production-tags :is(a,button,.tag){
          background-color: #2493A9 !important;
          color: #fdfaf7 !important;
          border: none !important;
          transition: transform 140ms ease, opacity 140ms ease, background-color 140ms ease;
        }
        .production-tags :is(a,button,.tag):hover{
          transform: translateY(-1px);
          opacity: .96;
          background-color: #1a6f80 !important;
        }

        /* Impact CTA: left button; center the link under the button only */
        .impact-cta-stack{
          display:flex;
          flex-direction:column;
          width:max-content;
          align-items:stretch;
        }
        .under-btn{
          display:block;
          text-align:center;
          margin-top:8px;
        }

        /* Volunteer link: expand + color change */
        .involved-link{
          color: #6c00af;
          font-weight: 500;
          letter-spacing: .01em;
          transition: transform 160ms ease, letter-spacing 160ms ease, opacity 160ms ease, color 160ms ease;
        }
        .involved-link:hover{
          transform: scale(1.02);
          letter-spacing:.02em;
          opacity:.9;
          color:#F23359;
        }

        /* Drama Club + supporters */
        .support-eyebrow-tight{
          margin: 0;
          font-family: "Space Grotesk", system-ui, sans-serif;
          font-size: .67rem;
          text-transform: uppercase;
          letter-spacing: .22em;
          font-weight: 800;
          color: #24112399;
        }
        .club-name{
          margin: .15rem 0 0 0;
          font-family: "Space Grotesk", system-ui, sans-serif;
          font-weight: 900;
          font-size: 1.3rem;
          letter-spacing: .01em;
          color: #000;
        }
        .club-loc{
          margin: 0;
          font-size: .92rem;
          color: #241123B3;
        }

        .club-link-black{
          color:#6c00af !important;
          font-weight: 900;
          transition: transform 160ms ease, letter-spacing 160ms ease, opacity 160ms ease, color 160ms ease;
        }
        .club-link-black:hover{
          transform: scale(1.02) translateX(1px);
          letter-spacing:.04em;
          opacity:.96;
          color:#F23359 !important;
          font-weight: 900;
        }

        /* Drama club hover (logo) */
        .drama-club-wrapper{
          transition: transform 160ms ease, filter 160ms ease;
          display:inline-block;
          margin-bottom: 1.5rem;
        }
        .drama-club-link{ display:inline-block; }
        .drama-club-link:hover,
        .drama-club-wrapper:hover{
          transform: translateY(-2px);
          filter: brightness(0.88);
        }

        /* Causes chips */
        .cause-row{
          margin-top: 10px;
          display:flex;
          flex-wrap:wrap;
          gap: 8px;
        }
        .cause-chip{
          display:inline-flex;
          align-items:center;
          gap:6px;
          padding: 6px 12px;
          border-radius: 999px;
          background:#2411230F;
          font-size: .78rem;
          font-weight: 700;
          letter-spacing: .01em;
          color:#241123;
          transition: transform 160ms ease, box-shadow 160ms ease, background-color 160ms ease, color 160ms ease;
        }
        .cause-chip:hover{
          transform: translateY(-1px);
          background:#F2335912;
          color:#F23359;
          box-shadow: 0 6px 14px rgba(36,17,35,0.12);
        }

        /* Impact partners – horizontal bars with framed logo */
        .impact-partners-block{
          margin-top: 1.5rem;
          padding-top: 0rem;
        }

        .partner-list{
          margin-top: 10px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .partner-bar{
          position: relative;
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 10px 10px;
          border-radius: 5px;
          background: #f2f2f24d;
          border: 1px solid #2411231A;
          text-decoration: none;
          transition:
            transform 140ms ease,
            box-shadow 140ms ease,
            background-color 140ms ease;
        }

        .partner-bar:hover{
          transform: translateY(-1px);
          background: #FFcc004d;
        }

        .partner-logo-shell{
          flex: 0 0 auto;
          width: 85px;
          height: 85px;
          border-radius: 3px;
          background: #2411231d;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .partner-logo{
          max-width: 80px;
          max-height: 80px;
          object-fit: contain;
        }

        .partner-bar.partner-no-logo{
          padding-left: 16px;
        }

        .partner-text{
          min-width: 0;
          display:flex;
          flex-direction:column;
          justify-content:center;
        }

        .partner-name{
          font-family: "space grotesk", system-ui, sans-serif;
          font-size: 1.05rem;
          line-height: 1.4;
          font-weight: 700;
          letter-spacing: .01em;
          color:#24112399;
          white-space: normal;
        }

        @media (max-width: 640px){
          .partner-bar{
            padding: 9px 14px;
            gap: 12px;
          }
          .partner-logo-shell{
            width: 88px;
            height: 88px;
            border-radius: 20px;
          }
          .partner-logo{
            max-width: 80px;
            max-height: 80px;
          }
          .partner-name{
            font-size: 0.96rem;
          }
        }

        /* RESOURCES */
        .resources-list{
          list-style: none;
          margin: 0;
          padding-left: 0;
          display: grid;
          row-gap: 10px;
          margin-top: 1.25rem;
        }
        .resource-item{
          position: relative;
          padding-left: 1.25rem;
        }
        .resource-item::before{
          content: "›";
          position: absolute;
          left: 0;
          top: 0.08rem;
          font-weight: 800;
          letter-spacing: .02em;
          color: #241123CC;
        }
        .resources-area .resource-link{
          color:#6c00af;
          font-weight: 400;
          transform-origin: left center;
          transition: transform 160ms ease, opacity 160ms ease, color 160ms ease, letter-spacing 160ms ease;
        }
        .resources-area .resource-link:hover{
          color:#F23359;
          transform: scale(1.02) translateX(1px);
          opacity:.96;
          letter-spacing:.03em;
        }

        /* Cast/Team labels + names */
        .role-label{
          font-size: .68rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: .2em;
          color: #24112399;
        }
        .border-top-soft{ border-top: 1px solid #2411231A; }

        .namecell,
        .namecell:link,
        .namecell:visited{
          color: #6c00af;
          text-underline-offset: 4px;
          transition: color 160ms ease, transform 160ms ease, letter-spacing 160ms ease, line-height 160ms ease;
        }
        .namecell:hover,
        .namecell:focus-visible{
          color: #F23359;
          transform: translateX(-2px);
          letter-spacing: .02em;
          line-height: 1.05;
        }

        /* Tickets button: DAT red (#f23359) with darker hover */
        .tickets-btn{
          background-color: #f23359 !important;
          border-color: #f23359 !important;
          color: #ffffff !important;
          opacity: 1;
          transition:
            background-color 160ms ease,
            transform 160ms ease,
            box-shadow 160ms ease;
          box-shadow: 0 4px 12px rgba(242, 51, 89, 0.25);
        }
        .tickets-btn:hover{
          background-color: #d62c4f !important;
          border-color: #d62c4f !important;
          transform: translateY(-1px);
          box-shadow: 0 8px 18px rgba(242, 51, 89, 0.28);
        }

        /* Sponsor the Story hover */
        .sponsor-btn{
          font-size: 1.1rem;
          transition: transform 160ms ease, box-shadow 160ms ease;
        }
        .sponsor-btn:hover{
          transform: translateY(-1px);
          box-shadow: 0 8px 18px rgba(36,17,35,0.18);
        }

        /* Quote band */
        .quote-band{
          position: relative;
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: clamp(14px, 2vw, 24px);
          border-radius: 18px;
          overflow: hidden;
          background: #0f0a10;
          color: #fff;
        }
        .quote-img{ position: relative; min-height: 260px; }
        .quote-copy{
          padding: clamp(16px,2.2vw,24px);
          display:flex;
          flex-direction:column;
          justify-content:center;
        }
        .big-quote{
          font-family: "Anton", system-ui, sans-serif;
          font-size: clamp(1.8rem, 4.2vw, 3.2rem);
          line-height: 1.05;
          margin: 0;
          letter-spacing: .01em;
        }
        .big-quote-source{
          margin-top: .6rem;
          font-family: "Space Grotesk", system-ui, sans-serif;
          font-size: .9rem;
          opacity: .9;
        }
        .quote-source-link{
          color:#FFCC00;
          transition: color 160ms ease, letter-spacing 160ms ease;
        }
        .quote-source-link:hover{
          color:#F23359;
          letter-spacing:.01em;
        }

        /* Mobile */
        @media (max-width: 900px){
          .row70, .row50, .rowFull{ grid-template-columns: 1fr !important; }
          .r1-tickets{ justify-self: start; }
          .quote-band{ grid-template-columns: 1fr; }
        }
      `}</style>
    </main>
  );
}
