// app/theatre/[slug]/page.tsx
import { notFound } from "next/navigation";
import { productionMap, type Production } from "@/lib/productionMap";
import {
  productionDetailsMap,
  type ProductionExtra,
} from "@/lib/productionDetailsMap";
import { dramaClubs } from "@/lib/dramaClubs";
import ProductionPageTemplate, {
  PersonRole,
  GalleryImage,
} from "@/components/productions/ProductionPageTemplate";
import { buildRelated } from "@/lib/buildRelated";

// NOTE: params is now a Promise in Next 15 for some routes
type PageProps = { params: Promise<{ slug: string }> };

// Match the partners shape expected by ProductionPageTemplate
type PartnerForTemplate = {
  name: string;
  href?: string; // ✅ optional (so missing/empty href doesn't drop the partner)
  type: "community" | "artistic" | "impact" | "primary";
  logoSrc?: string;
  logoAlt?: string;
};

function slugToName(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function splitArtists(
  artists: Record<string, string[]>,
): { creativeTeam: PersonRole[]; cast: PersonRole[] } {
  const creativeTeam: PersonRole[] = [];
  const cast: PersonRole[] = [];

  Object.entries(artists).forEach(([personSlug, roles]) => {
    if (!personSlug.trim()) return;
    const name = slugToName(personSlug);

    roles.forEach((role) => {
      const entry: PersonRole = { role, name }; // no href here
      if (role.toLowerCase().includes("actor")) {
        cast.push(entry);
      } else {
        creativeTeam.push(entry);
      }
    });
  });

  return { creativeTeam, cast };
}

function derivePlaywright(
  p: Production,
  extra?: ProductionExtra,
): string | undefined {
  if (extra?.playwright) return extra.playwright;

  const hit = Object.entries(p.artists).find(([, roles]) =>
    roles.some((r) => r.toLowerCase().includes("playwright")),
  );
  if (!hit) return undefined;

  return slugToName(hit[0]);
}

/* ---------- Meta link helpers ---------- */

function cleanStr(input?: string | null): string | undefined {
  if (typeof input !== "string") return undefined;
  const s = input.trim();
  return s ? s : undefined;
}

function makeSearchHref(q: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(q.trim())}`;
}

/* ---------- Image helpers ---------- */

function normalizeImagePath(input?: string | null): string | undefined {
  if (!input) return undefined;

  const raw = input.trim();
  if (!raw) return undefined;

  // Remote URL (CDN, WP, etc.)
  if (/^https?:\/\//i.test(raw)) return raw;

  // Strip accidental "public/" prefix (e.g. "public/posters/foo-landscape.jpg")
  if (raw.startsWith("public/")) {
    const withoutPublic = raw.slice("public/".length);
    return `/${withoutPublic.replace(/^\/+/, "")}`;
  }

  // Already root-relative
  if (raw.startsWith("/")) return raw;

  // Treat as relative to /public root
  return `/${raw.replace(/^\/+/, "")}`;
}

/**
 * Resolve the hero image URL for a production, matching your actual
 * /public/posters naming convention (everything is -landscape or -portrait).
 */
function getHeroImageUrl(
  slug: string,
  base: Production,
  extra?: ProductionExtra,
): string {
  const normalizedPosterUrl =
    base.posterUrl &&
    (base.posterUrl.includes("-landscape") ||
      base.posterUrl.includes("-portrait"))
      ? base.posterUrl
      : undefined;

  const candidates: Array<string | undefined> = [
    extra?.heroImageUrl,
    `/posters/${slug}-landscape.jpg`,
    `/posters/${slug}-portrait.jpg`,
    normalizedPosterUrl,
    "/posters/fallback-16x9.jpg",
  ];

  for (const raw of candidates) {
    const normalized = normalizeImagePath(raw);
    if (normalized) return normalized;
  }

  // Absolute last resort
  return "/posters/fallback-16x9.jpg";
}

/* ---------- Page component ---------- */

export default async function TheatreProductionPage({ params }: PageProps) {
  const { slug } = await params;

  const base = productionMap[slug];
  if (!base) notFound();

  const extra = productionDetailsMap[slug];

  const { creativeTeam, cast } = extra?.creativeTeamOverride
    ? {
        creativeTeam: extra.creativeTeamOverride,
        cast: extra.castOverride ?? [],
      }
    : splitArtists(base.artists);

  const heroImageUrl = getHeroImageUrl(slug, base as Production, extra);

  // Legacy/fallback playwright
  const playwrightName = derivePlaywright(base as Production, extra);
  const playwrightHref = playwrightName
    ? `/alumni/${playwrightName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")}`
    : undefined;

  // Derive drama club from shared map (using dramaClubSlug), then allow overrides
  const club = extra?.dramaClubSlug
    ? dramaClubs.find((c) => c.slug === extra.dramaClubSlug)
    : undefined;

  const dramaClubName = extra?.dramaClubName ?? club?.name ?? undefined;
  const dramaClubLocation =
    extra?.dramaClubLocation ?? club?.location ?? undefined;

  const defaultClubHref = club ? `/drama-clubs/${club.slug}` : undefined;
  const dramaClubLink = extra?.dramaClubLink ?? defaultClubHref;

  // Flexible credit line
  const creditPrefix = extra?.creditPrefix;
  const creditPeople =
    extra?.creditPeople && extra.creditPeople.length > 0
      ? extra.creditPeople
      : creditPrefix && playwrightName
        ? [{ name: playwrightName, href: playwrightHref }]
        : undefined;

  // ✅ Festival + link (explicit href wins; else generate an external search link)
  const festivalText = cleanStr(extra?.festival ?? base.festival);
  const festivalHref =
    cleanStr(extra?.festivalHref) ??
    (festivalText ? makeSearchHref(festivalText) : undefined);

  // ✅ Venue fallback: prefer extra.venue, then productionMap venue
  // ✅ Venue link: explicit href wins; else generate an external search link
  const venueText = cleanStr(extra?.venue ?? base.venue);
  const venueHref =
    cleanStr(extra?.venueHref) ??
    (venueText ? makeSearchHref(`${venueText} ${base.location}`) : undefined);

  // ✅ Normalize partners but DO NOT drop partner text if href is missing/empty
  const normalizedPartners: PartnerForTemplate[] | undefined =
    extra?.partners?.flatMap((p): PartnerForTemplate[] => {
      const name = cleanStr(p?.name);
      if (!name) return [];

      const href = cleanStr(p?.href); // empty string -> undefined
      const logoSrc = cleanStr(p?.logoSrc);
      const logoAlt = cleanStr(p?.logoAlt);

      const type: PartnerForTemplate["type"] =
        p.type === "artistic" ||
        p.type === "impact" ||
        p.type === "community" ||
        p.type === "primary"
          ? p.type
          : "community";

      return [
        {
          name,
          ...(href ? { href } : {}),
          type,
          ...(logoSrc ? { logoSrc } : {}),
          ...(logoAlt ? { logoAlt } : {}),
        },
      ];
    }) ?? undefined;

  // Map extra.processSections → template's ProcessSlice[]
  // IMPORTANT: do not invent fallback images here; let the template drop empty slides.
  // If videoUrl exists, it takes precedence and we omit image.
  const processSectionsForTemplate =
    extra?.processSections?.map((section) => {
      const videoUrl = cleanStr(section.videoUrl);
      const videoPoster = normalizeImagePath(section.videoPoster ?? undefined);

      const normalizedImageSrc = normalizeImagePath(section.image?.src);
      const image: GalleryImage | undefined =
        !videoUrl && normalizedImageSrc
          ? {
              src: normalizedImageSrc,
              alt: section.image?.alt ?? "",
            }
          : undefined;

      return {
        heading: section.heading,
        body: section.body,
        image,
        videoUrl,
        videoTitle: cleanStr(section.videoTitle),
        videoPoster,
        quote: section.quote
          ? { text: section.quote.text, attribution: section.quote.attribution }
          : undefined,
      };
    }) ?? undefined;

  // --- Related productions/projects (dynamic) ---
  const related = buildRelated(slug, 8);
  const relatedItems = Array.isArray(related.items) ? related.items : [];

  // Allow per-show override for the header label only
  const relatedTitle = extra?.relatedTitle?.trim() || "Related Plays & Projects";

  return (
    <ProductionPageTemplate
      title={base.title}
      seasonLabel={
        base.season ? `Season ${base.season} • ${base.year}` : String(base.year)
      }
      seasonHref={base.season ? `/season/${base.season}` : undefined}
      subtitle={extra?.subtitle}
      /* Credits */
      creditPrefix={creditPrefix}
      creditPeople={creditPeople}
      playwright={playwrightName}
      playwrightHref={playwrightHref}
      /* Meta */
      dates={extra?.dates || base.festival || String(base.year)}
      festival={festivalText}
      festivalHref={festivalHref}
      venue={venueText}
      venueHref={venueHref}
      city={extra?.city}
      location={base.location}
      runtime={extra?.runtime}
      ageRecommendation={extra?.ageRecommendation}
      /* Hero / Quote image */
      heroImageUrl={heroImageUrl}
      heroImageAlt={base.title}
      quoteImageUrl={extra?.quoteImageUrl}
      /* About */
      synopsis={extra?.synopsis}
      themes={extra?.themes}
      pullQuote={extra?.pullQuote}
      /* Community / Impact */
      dramaClubName={dramaClubName}
      dramaClubLocation={dramaClubLocation}
      dramaClubLink={dramaClubLink}
      causes={extra?.causes}
      partners={normalizedPartners}
      /* CTAs */
      getInvolvedLink={extra?.getInvolvedLink}
      donateLink={extra?.donateLink}
      ticketsLink={extra?.ticketsLink}
      /* Rosters */
      creativeTeam={creativeTeam}
      cast={cast}
      /* Links section */
      resources={extra?.resources}
      /* Gallery */
      galleryImages={extra?.galleryImages}
      productionPhotographer={extra?.productionPhotographer}
      productionAlbumHref={extra?.productionAlbumHref}
      productionAlbumLabel={extra?.productionAlbumLabel}
      /* Field / BTS gallery */
      fieldGalleryImages={extra?.fieldGalleryImages}
      fieldGalleryTitle={extra?.fieldGalleryTitle}
      fieldAlbumHref={extra?.fieldAlbumHref ?? null}
      fieldAlbumLabel={extra?.fieldAlbumLabel ?? null}
      /* Process band */
      processSections={processSectionsForTemplate}
      /* Related plays/projects row */
      relatedItems={relatedItems}
      relatedTitle={relatedTitle}
    />
  );
}
