// app/theme/[slug]/page.tsx

import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { productionMap, type Production } from "@/lib/productionMap";
import {
  productionDetailsMap,
  type ProductionExtra,
} from "@/lib/productionDetailsMap";
import { slugifyTag as slugify, getCanonicalTag } from "@/lib/tags";

import PosterCard from "@/components/shared/PosterCard";
import SeasonsCarouselAlt from "@/components/alumni/SeasonsCarouselAlt";

export const revalidate = 3600;

/** Optional per-theme hero / copy overrides (keys = canonical theme slugs). */
type ThemeMeta = {
  heroImageUrl?: string;
  intro?: string;
};

const themeMetaMap: Record<string, ThemeMeta> = {
  // "migration-and-belonging": {
  //   heroImageUrl: "/images/themes/migration-hero.jpg",
  //   intro: "Plays tracing the lines between home, movement, and identity.",
  // },
};

type ParamsLike<T> = Promise<T> | T;

async function resolveParams(
  params: ParamsLike<{ slug: string }> | ParamsLike<{ slug?: string }>
) {
  const p = (params instanceof Promise ? await params : params) as {
    slug?: string;
  };
  return p;
}

/* ===============================
   Helpers
=============================== */

function normalizeStaticSrc(src?: string): string | undefined {
  if (!src || typeof src !== "string") return undefined;

  const trimmed = src.trim();
  if (!trimmed) return undefined;

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  const withoutLeadingDots = trimmed.replace(/^\.?\//, "");
  return `/${withoutLeadingDots}`;
}

function humanizeSlug(slug: string): string {
  const safe = typeof slug === "string" ? slug : "";
  return safe
    .split("-")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
    .join(" ");
}

/* ===============================
   Static params
=============================== */

export async function generateStaticParams() {
  const allProductions: Production[] = Object.values(productionMap);
  const slugs = new Set<string>();

  for (const prod of allProductions) {
    const extra = productionDetailsMap[prod.slug] as ProductionExtra | undefined;
    const themes: string[] = ((extra as any)?.themes ?? []) as string[];

    for (const raw of themes) {
      if (!raw) continue;
      const canonical = getCanonicalTag(raw) ?? raw;
      slugs.add(slugify(canonical));
    }
  }

  return Array.from(slugs).map((slug) => ({ slug }));
}

/* ===============================
   Metadata
=============================== */

export async function generateMetadata({
  params,
}: {
  params: ParamsLike<{ slug: string }> | { slug: string };
}): Promise<Metadata> {
  const p = await resolveParams(params);
  const slug = String(p?.slug ?? "").trim();
  const slugLower = slug.toLowerCase();

  // ✅ Never crash in metadata
  if (!slugLower) {
    return {
      title: "DAT Themes",
      description: "Explore productions by theme.",
      alternates: { canonical: "/theme" },
      openGraph: {
        title: "DAT Themes",
        description: "Explore productions by theme.",
        url: "/theme",
        type: "website",
      },
      twitter: {
        card: "summary",
        title: "DAT Themes",
        description: "Explore productions by theme.",
      },
    };
  }

  const allProductions: Production[] = Object.values(productionMap);

  const labelFromData =
    allProductions
      .flatMap((prod: Production) => {
        const extra = productionDetailsMap[prod.slug] as ProductionExtra | undefined;
        return (((extra as any)?.themes ?? []) as string[]);
      })
      .map((t: string) => getCanonicalTag(t) ?? t)
      .find((c: string) => slugify(c) === slugLower) ?? humanizeSlug(slug);

  const title = `${labelFromData} — DAT Themes`;
  const description = `Plays that explore the theme: ${labelFromData}.`;
  const canonicalPath = `/theme/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title,
      description,
      url: canonicalPath,
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

/* ===============================
   Page
=============================== */

export default async function ThemePage({
  params,
}: {
  params: ParamsLike<{ slug: string }> | { slug: string };
}) {
  const p = await resolveParams(params);
  const slug = String(p?.slug ?? "").trim();

  // ✅ seasons-style guard
  if (!slug) {
    notFound();
  }

  const slugLower = slug.toLowerCase();

  const allProductions: Production[] = Object.values(productionMap);

  const matchTag = (raw: string): boolean => {
    const canonical = getCanonicalTag(raw) ?? raw;
    return slugify(canonical) === slugLower;
  };

  // --- Productions for this theme ---
  const productionsForTheme: Production[] = allProductions.filter((prod: Production) => {
    const extra = productionDetailsMap[prod.slug] as ProductionExtra | undefined;
    const themes: string[] = ((extra as any)?.themes ?? []) as string[];
    return themes.some((t: string) => matchTag(t));
  });

  if (!productionsForTheme.length) {
    return notFound();
  }

  const displayLabelFromData =
    allProductions
      .flatMap((prod: Production) => {
        const extra = productionDetailsMap[prod.slug] as ProductionExtra | undefined;
        return (((extra as any)?.themes ?? []) as string[]);
      })
      .map((t: string) => getCanonicalTag(t) ?? t)
      .find((c: string) => slugify(c) === slugLower);

  const displayLabel = displayLabelFromData ?? humanizeSlug(slug);

  // ✅ Dynamic hero headline
  const heroHeadline = displayLabel;

  // --- Collect all themes for "Explore More Themes" chips ---
  const themeSlugToLabel = new Map<string, string>();

  const addThemeLabel = (label: string | undefined | null) => {
    if (!label) return;
    const canonical = getCanonicalTag(label) ?? label;
    const s = slugify(canonical);
    if (!themeSlugToLabel.has(s)) {
      themeSlugToLabel.set(s, canonical);
    }
  };

  for (const prod of allProductions) {
    const extra = productionDetailsMap[prod.slug] as ProductionExtra | undefined;
    const themes: string[] = ((extra as any)?.themes ?? []) as string[];
    for (const t of themes) addThemeLabel(t);
  }

  const moreThemeLinks: Array<[string, string]> = Array.from(themeSlugToLabel.entries())
    .filter(([s]) => s !== slugLower)
    .sort(([, aLabel], [, bLabel]) =>
      aLabel.localeCompare(bLabel, undefined, { sensitivity: "base" })
    );

  // Optional per-theme meta
  const meta = themeMetaMap[slugLower] || {};
  const heroSrc = normalizeStaticSrc(meta.heroImageUrl) || "/images/alumni-hero.jpg";
  const heroIntro = meta.intro || "How this idea shapes our journey.";

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundImage: 'url("/texture/kraft-paper.png")',
        backgroundSize: "cover",
        backgroundAttachment: "fixed",
        backgroundRepeat: "repeat",
      }}
    >
      {/* HERO (mirrors cause page proportions) */}
      <div
        style={{
          position: "relative",
          height: "55vh",
          overflow: "hidden",
          zIndex: 0,
          boxShadow: "0 0 33px rgba(0, 0, 0, 0.5)",
        }}
      >
        <Image
          src={heroSrc}
          alt={`${displayLabel} Theme Hero`}
          fill
          priority
          className="object-cover object-center"
        />

        {/* Right-aligned hero text, like cause page */}
        <div
          style={{
            position: "absolute",
            bottom: "1.1rem",
            right: "0",
            paddingRight: "2.5vw",
            textAlign: "right",
          }}
        >
          <h1
            style={{
              fontFamily: "var(--font-anton), system-ui, sans-serif",
              fontSize: "clamp(3.2rem, 7.8vw, 7.6rem)",
              color: "#f2f2f2",
              opacity: 0.88,
              textTransform: "uppercase",
              textShadow: "0 8px 20px rgba(0,0,0,0.8)",
              margin: 0,
              lineHeight: "1",
            }}
          >
            {heroHeadline}
          </h1>
          <p
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "1.5rem",
              color: "#f2f2f2",
              opacity: 0.72,
              margin: 0,
              marginTop: "0rem",
              textShadow: "0 4px 9px rgba(0,0,0,0.9)",
              textAlign: "right",
            }}
          >
            {heroIntro}
          </p>
        </div>
      </div>

      {/* MAIN — mirrors cause page: one big label, shell, grid */}
      <main
        style={{
          marginTop: "-5rem",
          padding: "8rem 0 2rem",
          position: "relative",
          opacity: 0.97,
          zIndex: 10,
        }}
      >
        <div style={{ width: "90%", maxWidth: 1200, margin: "0 auto" }}>
          {/* SECTION: Plays */}
          <section style={{ marginBottom: "4rem" }} aria-label={`Productions tagged with ${displayLabel}`}>
            <SectionLabel>Stories That Move Through This Terrain</SectionLabel>

            <div className="theme-shell">
              <div className="poster-grid">
                {productionsForTheme.map((prod: Production) => {
                  const extra = productionDetailsMap[prod.slug] as ProductionExtra | undefined;
                  const extraAny = extra as any;

                  // Hero / poster image selection (portrait-first)
                  const rawHero: string | undefined =
                    (extraAny?.heroImageUrl as string | undefined) ||
                    (extraAny?.heroImage as string | undefined) ||
                    ((prod as any)?.heroImageUrl as string | undefined);

                  let posterSrcRaw: string | undefined;

                  if (rawHero) {
                    if (rawHero.includes("-portrait")) posterSrcRaw = rawHero;
                    else if (rawHero.includes("-landscape"))
                      posterSrcRaw = rawHero.replace("-landscape", "-portrait");
                    else posterSrcRaw = rawHero;
                  } else {
                    posterSrcRaw = "/posters/fallback-16x9.jpg";
                  }

                  const posterSrc =
                    normalizeStaticSrc(posterSrcRaw) ?? "/posters/fallback-16x9.jpg";

                  // Subtitle priority (tagline → location → season → year → extras)
                  const tagline = extraAny?.tagline as string | undefined;
                  const subtitle =
                    tagline ||
                    (prod as any)?.location ||
                    (extraAny?.seasonLabel as string | undefined) ||
                    (prod as any)?.year?.toString() ||
                    (extra as any)?.subtitle ||
                    (extra as any)?.city ||
                    undefined;

                  return (
                    <PosterCard
                      key={prod.slug}
                      href={`/theatre/${prod.slug}`}
                      title={prod.title}
                      subtitle={subtitle}
                      imageSrc={posterSrc}
                    />
                  );
                })}
              </div>
            </div>
          </section>

          {/* SECTION: Explore more themes */}
          {moreThemeLinks.length > 0 && (
            <section style={{ marginTop: "0.5rem" }} aria-label="Explore other themes">
              <SectionLabel>Other Constellations</SectionLabel>

              <div
                style={{
                  background: "rgba(36, 17, 35, 0.2)",
                  borderRadius: "8px",
                  padding: "2rem",
                }}
              >
                <div className="more-themes-grid">
                  {moreThemeLinks.map(([themeSlug, label]) => (
                    <Link key={themeSlug} href={`/theme/${themeSlug}`} className="theme-chip">
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Season nav — mirror cause page footer */}
        <section
          style={{
            width: "100vw",
            backgroundColor: "#6C00AF",
            boxShadow: "0px 0px 33px rgba(0.8,0.8,0.8,0.8)",
            padding: "4rem 0",
            marginTop: "4rem",
            marginBottom: "-2rem",
          }}
        >
          <SeasonsCarouselAlt />
        </section>

        {/* Local, page-scoped styles */}
        <style>{`
          a { text-decoration: none; }
          a:hover { text-decoration: none; }

          .theme-shell{
            background: rgba(36, 17, 35, 0.18);
            border-radius: 12px;
            padding: 2rem;
            box-shadow: none;
          }

          .more-themes-grid{
            display: flex;
            flex-wrap: wrap;
            gap: 0.7rem;
          }

          .theme-chip{
            display: inline-flex;
            align-items: center;
            padding: 0.55rem 1.5rem;
            border-radius: 999px;
            background: rgba(255,255,255,0.55);
            border: 1px solid rgba(36,17,35,0.22);
            font-family: var(--font-space-grotesk), system-ui, sans-serif;
            font-size: 0.82rem;
            font-weight: 800;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: #241123;
            transition:
              background-color 0.18s ease,
              color 0.18s ease,
              transform 0.18s ease,
              box-shadow 0.18s ease,
              border-color 0.18s ease,
              opacity 0.18s ease;
          }
          .theme-chip:hover{
            background: #FFCC00;
            opacity: 0.95;
            color: #241123;
            transform: translateY(-1px);
            box-shadow: 0 6px 15px rgba(0,0,0,0.2);
            border-color: #FFCC00;
          }

          @media (max-width: 900px){
            main{
              margin-top: -3.5rem;
              padding-top: 5.5rem;
            }
            .theme-shell{
              padding: 1.6rem;
            }
          }
        `}</style>
      </main>
    </div>
  );
}

/* ===============================
   Shared label to match cause page
=============================== */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontFamily: "var(--font-anton), system-ui, sans-serif",
        fontSize: "2.4rem",
        margin: "3.5rem 0 1.1rem",
        textTransform: "uppercase",
        letterSpacing: "0.2rem",
        color: "#241123",
        backgroundColor: "#FFCC00",
        opacity: 0.7,
        padding: "0.1em 0.5em",
        borderRadius: "0.3em",
        display: "inline-block",
      }}
    >
      {children}
    </h2>
  );
}
