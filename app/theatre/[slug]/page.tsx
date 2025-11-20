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

type PageProps = { params: { slug: string } };

// Match the partners shape expected by ProductionPageTemplate
type PartnerForTemplate = {
  name: string;
  href: string;
  type: "community" | "artistic" | "impact" | "primary";
  logoSrc?: string;
  logoAlt?: string;
};

// Local, forgiving type for items we care about from dramaClubs
type DramaClubForPage = {
  slug: string;
  name: string;
  location?: string;
  [key: string]: unknown;
};

function slugToName(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function splitArtists(
  artists: Record<string, string[]>
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
  extra?: ProductionExtra
): string | undefined {
  if (extra?.playwright) return extra.playwright;

  const hit = Object.entries(p.artists).find(([, roles]) =>
    roles.some((r) => r.toLowerCase().includes("playwright"))
  );
  if (!hit) return undefined;

  return slugToName(hit[0]);
}

/* ---------- Image helpers ---------- */

function normalizeImagePath(input?: string | null): string | undefined {
  if (!input) return undefined;

  const raw = input.trim();
  if (!raw) return undefined;

  // Remote URL (CDN, WP, etc.)
  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }

  // Strip accidental "public/" prefix (e.g. "public/posters/foo-landscape.jpg")
  if (raw.startsWith("public/")) {
    const withoutPublic = raw.slice("public/".length);
    return `/${withoutPublic.replace(/^\/+/, "")}`;
  }

  // Already root-relative
  if (raw.startsWith("/")) {
    return raw;
  }

  // Treat as relative to /public root
  return `/${raw.replace(/^\/+/, "")}`;
}

/**
 * Resolve the hero image URL for a production, matching your actual
 * /public/posters naming convention (everything is -landscape or -portrait).
 *
 * Priority:
 *   1) extra.heroImageUrl                 (explicit hero, if configured)
 *   2) /posters/[slug]-landscape.jpg      (primary DAT hero convention)
 *   3) /posters/[slug]-portrait.jpg       (backup if only portrait exists)
 *   4) base.posterUrl (ONLY if it already includes -landscape/-portrait)
 *   5) /posters/fallback-16x9.jpg         (global ultimate fallback)
 */
function getHeroImageUrl(
  slug: string,
  base: Production,
  extra?: ProductionExtra
): string | undefined {
  // Only trust base.posterUrl if it already matches the new naming scheme
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
    "/posters/fallback-16x9.jpg", // lives at public/posters/fallback-16x9.jpg
  ];

  for (const raw of candidates) {
    const normalized = normalizeImagePath(raw);
    if (normalized) return normalized;
  }

  return undefined;
}

/* ---------- Page component ---------- */

export default function TheatreProductionPage({ params }: PageProps) {
  const base = productionMap[params.slug];
  if (!base) notFound();

  const extra = productionDetailsMap[params.slug];

  const { creativeTeam, cast } = extra?.creativeTeamOverride
    ? {
        creativeTeam: extra.creativeTeamOverride,
        cast: extra.castOverride ?? [],
      }
    : splitArtists(base.artists);

  const heroImageUrl = getHeroImageUrl(
    params.slug,
    base as Production,
    extra
  );

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
  const club =
    extra?.dramaClubSlug
      ? dramaClubs.find(
          (c): c is DramaClubForPage =>
            typeof c === "object" &&
            c !== null &&
            "slug" in c &&
            (c as any).slug === extra.dramaClubSlug
        )
      : undefined;

  const dramaClubName =
    extra?.dramaClubName ?? club?.name ?? undefined;

  const dramaClubLocation =
    extra?.dramaClubLocation ?? club?.location ?? undefined;

  // If you have a dedicated route like /drama-clubs/[slug],
  // this gives you a default internal link:
  const defaultClubHref = club ? `/drama-clubs/${club.slug}` : undefined;

  const dramaClubLink =
    extra?.dramaClubLink ?? defaultClubHref;

  // Flexible credit line
  const creditPrefix = extra?.creditPrefix;
  const creditPeople =
    extra?.creditPeople && extra.creditPeople.length > 0
      ? extra.creditPeople
      : creditPrefix && playwrightName
      ? [{ name: playwrightName, href: playwrightHref }]
      : undefined;

  // Normalize partners to the template's expected shape
  const normalizedPartners: PartnerForTemplate[] | undefined =
    extra?.partners?.map((p): PartnerForTemplate => ({
      name: p.name,
      href: p.href,
      // keep known types; anything else falls back to "community"
      type:
        p.type === "artistic" ||
        p.type === "impact" ||
        p.type === "community" ||
        p.type === "primary"
          ? p.type
          : "community",
      logoSrc: p.logoSrc,
      logoAlt: p.logoAlt,
    })) ?? undefined;

  // Map extra.processSections → template's ProcessSlice[]
  const processSectionsForTemplate =
    extra?.processSections?.map((section) => {
      // Normalize or fallback the image
      const normalizedImageSrc = normalizeImagePath(section.image?.src);
      const image: GalleryImage = {
        src: normalizedImageSrc ?? "/images/teaching-amazon.jpg",
        alt: section.image?.alt ?? "",
      };

      return {
        heading: section.heading,
        body: section.body,
        image,
        // align is optional and can be added later if you want to control left/right
        quote: section.quote
          ? {
              text: section.quote.text,
              attribution: section.quote.attribution,
            }
          : undefined,
      };
    }) ?? undefined;

  return (
    <ProductionPageTemplate
      title={base.title}
      seasonLabel={
        base.season ? `Season ${base.season} • ${base.year}` : String(base.year)
      }
      seasonHref={base.season ? `/season/${base.season}` : undefined}
      subtitle={extra?.subtitle} // tagline (used inline if match in synopsis)

      /* Credits */
      creditPrefix={creditPrefix}
      creditPeople={creditPeople}
      playwright={playwrightName}
      playwrightHref={playwrightHref}

      /* Meta */
      dates={extra?.dates || base.festival || String(base.year)}
      festival={extra?.festival ?? base.festival}
      festivalHref={extra?.festivalHref}
      venue={extra?.venue}
      venueHref={extra?.venueHref}
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

      /* Community / Impact – wired to shared dramaClubs map with overrides */
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
    />
  );
}
