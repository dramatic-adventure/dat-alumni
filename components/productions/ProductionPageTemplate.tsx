// components/productions/ProductionPageTemplate.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, type ReactNode, type CSSProperties } from "react";

import { DATButtonLink } from "@/components/ui/DATButton";
import ProductionTagButtons from "@/components/ui/ProductionTagButtons";
import DramaClubBadge from "@/components/ui/DramaClubBadge";
import ProcessBand from "@/components/productions/ProcessBand";
import type { RelatedItem } from "@/lib/buildRelated";
import Lightbox from "@/components/shared/Lightbox";

/* -------------------------- Types -------------------------- */
export type GalleryImage = { src: string; alt?: string };

export type PersonRole = { role: string; name: string; href?: string };

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
  creativeTeam?: Array<{ role?: string; name?: string; href?: string }>;
  cast?: Array<{ role?: string; name?: string; href?: string }>;

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
  base = "/alumni",
}: {
  name: string;
  href?: string;
  base?: string;
}) {
  const safeName = cleanStr(name);
  if (!safeName) return null;

  const finalHref = cleanHref(href) ?? `${base}/${slugify(safeName)}`;

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


/* ======================= COMPONENT ========================= */
export default function ProductionPageTemplate(props: ProductionPageTemplateProps) {
  const {
    title,
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
    ticketsLink,

    processSections,

    relatedTitle = "Related Plays & Projects",
    relatedItems,
    relatedProductions,

    resources,
    autoLinkPeopleBase = "/alumni",
    renderAfterHero,
  } = props;

  const titleText = cleanStr(title) ?? "";
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
      return [{ role, name, ...(href ? { href } : {}) }];
    });
  }, [cast]);

  const safeCreativeTeam = useMemo<PersonRole[]>(() => {
    return (creativeTeam ?? []).flatMap((m) => {
      const role = cleanStr(m?.role);
      const name = cleanStr(m?.name);
      if (!role || !name) return [];
      const href = cleanHref(m?.href);
      return [{ role, name, ...(href ? { href } : {}) }];
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
    const href = cleanHref(r?.href);
    if (!label || !href) return [];
    return [{ label, href }];
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
    const href = cleanHref(p?.href);
    if (!name || !href) return [];
    const logoSrc = cleanStr(p?.logoSrc);
    const logoAlt = cleanStr(p?.logoAlt);
    return [
      {
        name,
        href,
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

  const runIsPast = inferIsPastRun(datesText);

  let primaryCtaHref = "";
  let primaryCtaLabel = "";

  if (ticketsLinkText && !runIsPast) {
    primaryCtaHref = ticketsLinkText;
    primaryCtaLabel = "Purchase Tickets";
  } else if (donateLinkText) {
    primaryCtaHref = donateLinkText;
    primaryCtaLabel = "Sponsor the Story";
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

  const venueCity = [venueText, cityText || locationText].filter(Boolean).join(", ");

  const metaValues: Array<{ value: ReactNode; hero?: boolean }> = [];
  if (datesText) metaValues.push({ value: datesText, hero: true });

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
    metaValues.push({ value: node, hero: true });
  }

  if (venueCity) {
    const href = venueHrefText;
    const node = href ? (
      isExternal(href) ? (
        <a className="meta-link" href={href} target="_blank" rel="noreferrer">
          {venueCity}
        </a>
      ) : (
        <Link className="meta-link" href={href}>
          {venueCity}
        </Link>
      )
    ) : (
      venueCity
    );
    metaValues.push({ value: node, hero: true });
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

  const hasImpactCTA = !!donateLinkText || !!getInvolvedLinkText;
  const showDramaClubBlock = !!dramaClubNameText || !!dramaClubLinkText;

  const showImpactRight = showDramaClubBlock || hasCauses || hasPartners;
  const showImpactBlock = hasImpactCTA || showDramaClubBlock || hasCauses || hasPartners;

  const impactRowClass = showImpactRight ? "row row50 impact-row" : "row rowFull impact-row";

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
            <div className="hero-text-group">
              {seasonLabelText &&
                (seasonHrefText ? (
                  <Link href={seasonHrefText} className="season-link hit-area no-underline">
                    <span className="eyebrow season-eyebrow">{seasonLabelText}</span>
                  </Link>
                ) : (
                  <span className="eyebrow season-eyebrow">{seasonLabelText}</span>
                ))}

              <h1 className="hero-title">{displayTitle}</h1>

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
            background: "rgba(255,255,255,0.60)",
            borderRadius: 18,
            margin: "clamp(1.25rem, 3vw, 2.25rem) 0 clamp(3.2rem, 8vw, 6rem)",
            ["--card-pad" as any]: "clamp(1.2rem, 3.2vw, 2.4rem)",
            padding: "var(--card-pad)",
            boxShadow: "0 18px 48px rgba(36,17,35,0.10)",
            backdropFilter: "saturate(1.05)",
          }}
        >
          <section className="rows">
            {/* ROW 1: Dates/Festival/Venue + CTA */}
            <div className="row row70">
              <div>
                <div className="meta-stack">
                  <h2 className="meta-title">{displayTitle}</h2>
                  {metaValues.map(({ value, hero }, i) => (
                    <div key={i} className={`meta-line ${hero ? "meta-hero" : "meta-sub"}`}>
                      {value}
                    </div>
                  ))}
                </div>
              </div>

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
                              className="flex items-center justify-between gap-4 py-3 border-top-soft text-sm"
                            >
                              <span className="role-label">{member.role}</span>
                              <span className="font-medium">
                                <NameCell name={member.name} href={member.href} base={autoLinkPeopleBase} />
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
                              className="flex items-center justify-between gap-4 py-3 border-top-soft text-sm"
                            >
                              <span className="role-label">{person.role}</span>
                              <span className="font-medium">
                                <NameCell name={person.name} href={person.href} base={autoLinkPeopleBase} />
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
                            {safeResources.map((item, idx) => {
                              const external = isExternal(item.href);
                              return (
                                <li key={idx} className="resource-item">
                                  {external ? (
                                    <a href={item.href} className="resource-link" target="_blank" rel="noreferrer">
                                      {item.label}
                                    </a>
                                  ) : (
                                    <Link href={item.href} className="resource-link">
                                      {item.label}
                                    </Link>
                                  )}
                                </li>
                              );
                            })}
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
                  {donateLinkText && (
                    <DATButtonLink href={donateLinkText} size="lg" className="sponsor-btn">
                      Sponsor the Story
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
                          const external = isExternal(p.href);

                          if (!external) {
                            return (
                              <Link
                                key={p.name}
                                href={p.href}
                                className={`partner-bar ${hasLogo ? "" : "partner-no-logo"}`}
                              >
                                {hasLogo && <PartnerLogoShell src={p.logoSrc} alt={p.logoAlt ?? p.name} />}
                                <div className="partner-text">
                                  <span className="partner-name">{p.name}</span>
                                </div>
                              </Link>
                            );
                          }

                          return (
                            <a
                              key={p.name}
                              href={p.href}
                              className={`partner-bar ${hasLogo ? "" : "partner-no-logo"}`}
                              target="_blank"
                              rel="noreferrer"
                            >
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
          font-family: var(--font-anton, system-ui, sans-serif);
          font-size: clamp(2.8rem, 7vw, 7rem);
          color: #f2f2f2; text-transform: uppercase;
          margin: 0; line-height: 1; letter-spacing: 0.06em; opacity: .9;
        }
        .hero-subtitle{
          margin-top: .4rem;
          font-family: var(--font-space-grotesk, system-ui, sans-serif);
          font-size: clamp(1rem, 2.2vw, 1.5rem); letter-spacing: .18em;
          text-transform: uppercase; font-weight: 600; color: #f2f2f2; opacity: 0.9;
        }
        .hero-byline{
          margin-top: .65rem;
          font-family: var(--font-space-grotesk, system-ui, sans-serif);
          font-size: .9rem; letter-spacing: .08em; text-transform: uppercase; font-weight: 600; color: #f2f2f2;
        }
        .byline-prefix{ opacity:.6; }

        .playwright-link {
          color: #f2f2f2 !important; font-weight: 700; letter-spacing: 0.22em; opacity: .85;
          transition: color 180ms ease, letter-spacing 180ms ease, transform 180ms ease, opacity 180ms ease;
        }
        .playwright-link:hover { color:#FFCC00 !important; letter-spacing:0.30em; transform: translateX(2px); opacity:1; }

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

        .meta-link, .meta-link:visited{
          color: #6c00af !important;
          text-decoration: none;
          transform-origin: left center;
          transition: color 160ms ease, transform 160ms ease, opacity 160ms ease, letter-spacing 160ms ease;
        }
        .meta-link:hover{ color: #F23359 !important; transform: scale(1.02) translateX(1px); letter-spacing: .16em; }

        .body-text{
          font-family: var(--font-space-grotesk, system-ui, sans-serif);
          font-size: 1.05rem; line-height: 1.66; color: #241123E6;
        }
        .about-body{ font-weight: 500; letter-spacing: .005em; }

        .about-body a, .about-body a:visited{
          color:#6c00af !important; font-weight: 600; text-decoration: underline; text-underline-offset: 3px;
          transition: color 160ms ease, transform 160ms ease;
        }
        .about-body a:hover{ color:#F23359 !important; transform: translateY(-1px); }

        .process-wrap{ padding-top: 40px; padding-bottom: 15px; display: flex; flex-direction: column; justify-content: center; }
        .quote-wrap{ padding-top: 40px; padding-bottom: -10px !important; display: flex; flex-direction: column; justify-content: center; }

        .impact-cta-stack{ display:flex; flex-direction:column; width:max-content; align-items:stretch; }
        .under-btn{ display:block; text-align:center; margin-top:8px; }

        .involved-link, .involved-link:visited{
          color: #6c00af !important; font-weight: 500; letter-spacing: .01em;
          transition: transform 160ms ease, letter-spacing 160ms ease, opacity 160ms ease, color 160ms ease;
        }
        .involved-link:hover{ transform: scale(1.02); letter-spacing:.02em; opacity:.9; color:#F23359 !important; }

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

        .club-link-black, .club-link-black:visited{
          color:#6c00af !important; font-weight: 400;
          transition: transform 160ms ease, letter-spacing 160ms ease, opacity 160ms ease, color 160ms ease;
        }
        .club-link-black:hover{ transform: scale(1.02) translateX(1px); letter-spacing:.06em; opacity:.96; color:#F23359 !important; }

        .drama-club-wrapper{ transition: transform 160ms ease, filter 160ms ease; display:inline-block; margin-top: 1rem; margin-bottom: 2rem; }
        .drama-club-link{ display:inline-block; }
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
          text-decoration: none;
          color: #241123;
          transition: background-color 150ms ease, color 150ms ease, transform 130ms ease, box-shadow 130ms ease, border-color 130ms ease, opacity 130ms ease;
        }
        .cause-chip:hover {
          background-color: #FFCC00;
          border-color: #FFCC00;
          color: #241123;
          transform: translateY(-1px);
          box-shadow: 0 6px 14px rgba(0,0,0,0.22);
          opacity: 0.97;
        }

        .impact-partners-block{ margin-top: 3.8rem; padding-top: 0rem; }
        .partner-list{ margin-top: 8px; display: flex; flex-direction: column; gap: 8px; }
        .partner-bar{
          position: relative; display: flex; align-items: center; gap: 12px; padding: 8px 10px;
          border-radius: 5px; background: #f2f2f24d; border: 1px solid #2411231A; text-decoration: none;
          transition: transform 120ms ease, background-color 120ms ease;
        }
        .partner-bar:hover{ transform: translateY(-1px); background: #FFcc0040; }
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
        .resource-link, .resource-link:visited{
          color:#6c00af !important; font-weight: 500; transform-origin: left center;
          transition: transform 140ms ease, opacity 140ms ease, color 140ms ease, letter-spacing 140ms ease;
          text-decoration: none;
        }
        .resource-link:hover{
          color:#F23359 !important; transform: scale(1.02) translateX(1px); opacity:.96; letter-spacing:.03em;
        }

        .role-label{ font-size: .68rem; font-weight: 400; text-transform: uppercase; letter-spacing: .2em; color: #24112399; }
        .border-top-soft{ border-top: 1px solid #2411231A; }

        .namecell, .namecell:link, .namecell:visited{
          color: #6c00af !important; font-weight:400; text-underline-offset: 4px;
          transition: color 160ms ease, transform 160ms ease, letter-spacing 160ms ease, line-height 160ms ease;
        }
        .namecell:hover, .namecell:focus-visible{
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
        .quote-source-link{ color:#FFCC00 !important; transition: color 160ms ease, letter-spacing 160ms ease; text-decoration: none; }
        .quote-source-link:hover{ color:#F23359 !important; letter-spacing:.01em; }

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

        /* From the Field alignment */
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

        @media (max-width: 640px){
          .fieldgrid-track{ gap: 10px; }
          .prodrow-footer{ flex-wrap: wrap; }
          .prodrow-footer-right{ width: 100%; margin-left: 0; text-align: right; }
        }
      `}</style>
    </main>
  );
}
