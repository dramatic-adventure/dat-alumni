// app/cause/[slug]/page.tsx

import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { loadVisibleAlumni } from "@/lib/loadAlumni";
import type { AlumniRow } from "@/lib/types";

import { productionMap, type Production } from "@/lib/productionMap";
import {
  productionDetailsMap,
  type ProductionExtra,
  type CauseItem,
} from "@/lib/productionDetailsMap";

import MiniProfileCard from "@/components/profile/MiniProfileCard";
import SeasonsCarouselAlt from "@/components/alumni/SeasonsCarouselAlt";

import { stories, type Story } from "@/lib/stories";
import { dramaClubs, type DramaClub } from "@/lib/dramaClubMap";

// 🔹 NEW: micro-cards import
import DramaClubIndexMicroGrid from "@/components/drama/DramaClubIndexMicroGrid";

import { slugifyTag as slugify, getCanonicalTag } from "@/lib/tags";

// 🔹 NEW: taxonomy import
import {
  CAUSE_CATEGORIES,
  CAUSE_SUBCATEGORIES_BY_CATEGORY,
} from "@/lib/causes";

// 🔹 NEW: vertical poster card for productions
import PosterCard from "@/components/shared/PosterCard";

export const revalidate = 3600;

type ParamsLike<T> = Promise<T> | T;

async function resolveParams(
  params: ParamsLike<{ slug: string }> | ParamsLike<{ slug?: string }>
) {
  const p = (params instanceof Promise ? await params : params) as {
    slug?: string;
  };
  return p;
}

type PersonRoleMaybeSlug = {
  name: string;
  role: string;
  slug?: string;
  [key: string]: unknown;
};

/** Optional pre-wire for future cause-specific hero/copy.
 *  Keys should be canonicalized slug strings. Leave empty for now.
 */
type CauseMeta = {
  heroImageUrl?: string;
  intro?: string;
  partnersCopy?: string;
  chipImageUrl?: string; // future: use as chip background in "Other Causes"
};

const causeMetaMap: Record<string, CauseMeta> = {
  // example:
  // "indigenous-rights": {
  //   heroImageUrl: "/images/causes/indigenous-rights-hero.jpg",
  //   intro: "Stories and collaborations rooted in sovereignty, language, and land.",
  //   partnersCopy: "Created alongside Shuar leaders, youth, and allied advocates.",
  //   chipImageUrl: "/images/causes/indigenous-rights-chip.jpg",
  // }
};

// ===============================
// Helpers
// ===============================

function norm(v: unknown) {
  return String(v ?? "").trim().toLowerCase();
}

function normalizeStaticSrc(src?: string): string | undefined {
  if (!src) return undefined;

  const trimmed = src.trim();
  if (!trimmed) return undefined;

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  const withoutLeadingDots = trimmed.replace(/^\.?\//, "");
  return `/${withoutLeadingDots}`;
}

// 🔹 NEW: taxonomy lookup helper (subcategories + categories)
type CauseCategoryMeta = (typeof CAUSE_CATEGORIES)[number];
type CauseSubcategoryMeta =
  (typeof CAUSE_SUBCATEGORIES_BY_CATEGORY)[keyof typeof CAUSE_SUBCATEGORIES_BY_CATEGORY][number];

function findCauseBySlug(slug: unknown): {
  subCause?: CauseSubcategoryMeta;
  category?: CauseCategoryMeta;
} | null {
  const slugLower = norm(slug);

  // 1) Try subcategory IDs first (this is what DramaClubPageTemplate uses)
  for (const subList of Object.values(CAUSE_SUBCATEGORIES_BY_CATEGORY)) {
    const hit = subList.find((c) => (c as any).id === slugLower);
    if (hit) {
      const parentCategory = CAUSE_CATEGORIES.find(
        (cat) =>
          (cat as any).id === (hit as any).categoryId ||
          (cat as any).id === (hit as any).categorySlug
      );
      return { subCause: hit, category: parentCategory };
    }
  }

  // 2) Fallback: maybe you're hitting a category ID itself
  const catHit = CAUSE_CATEGORIES.find(
    (cat) => (cat as any).id === slugLower || (cat as any).slug === slugLower
  );

  if (catHit) {
    return { category: catHit };
  }

  return null;
}

// ===============================
// Static params
// ===============================

export async function generateStaticParams() {
  const alumni: AlumniRow[] = await loadVisibleAlumni();

  const slugs = new Set<string>();

  // Existing: slugs based on tag system
  for (const artist of alumni) {
    const causeTags: string[] = ((artist as any).causeTags ?? []) as string[];
    for (const tag of causeTags) {
      const canonical = getCanonicalTag(tag) ?? tag;
      slugs.add(slugify(canonical));
    }
  }

  const allProductions: Production[] = Object.values(productionMap);
  for (const prod of allProductions) {
    const extra = productionDetailsMap[prod.slug] as ProductionExtra | undefined;
    const causes = (extra?.causes ?? []) as CauseItem[];
    for (const cause of causes) {
      if (!cause?.label) continue;
      const canonical = getCanonicalTag(cause.label) ?? cause.label;
      slugs.add(slugify(canonical));
    }
  }

  for (const club of dramaClubs) {
    // 1) Explicit causeSlugs → already in canonical slug form
    for (const s of club.causeSlugs ?? []) {
      if (!s) continue;
      slugs.add(s.toLowerCase());
    }

    // 2) Also add subcategory IDs from the canonical causes list
    for (const c of club.causes ?? []) {
      if (!c?.category || !c?.subcategory) continue;

      const subList =
        CAUSE_SUBCATEGORIES_BY_CATEGORY[
          c.category as keyof typeof CAUSE_SUBCATEGORIES_BY_CATEGORY
        ] || [];

      const meta = subList.find((m) => (m as any).id === c.subcategory);
      if (meta && (meta as any).id) {
        slugs.add(String((meta as any).id).toLowerCase());
      }
    }
  }

  for (const story of stories as Story[]) {
    const causeTags: string[] = (story.causeTags ?? []) as string[];
    for (const tag of causeTags) {
      const canonical = getCanonicalTag(tag) ?? tag;
      slugs.add(slugify(canonical));
    }
  }

  // 🔹 NEW: also prebuild pages for canonical taxonomy IDs
  for (const cat of CAUSE_CATEGORIES) {
    const id = (cat as any).id as string | undefined;
    if (id) slugs.add(id.toLowerCase());
  }
  for (const subList of Object.values(CAUSE_SUBCATEGORIES_BY_CATEGORY)) {
    for (const sub of subList) {
      const id = (sub as any).id as string | undefined;
      if (id) slugs.add(id.toLowerCase());
    }
  }

  return Array.from(slugs).map((slug) => ({ slug }));
}

// ===============================
// Metadata
// ===============================

export async function generateMetadata({
  params,
}: {
  params: ParamsLike<{ slug: string }> | { slug: string };
}): Promise<Metadata> {
  const p = await resolveParams(params);
  const slug = String(p?.slug ?? "").trim();
  const slugLower = norm(slug);

  // ✅ Metadata must never crash; fall back gracefully.
  if (!slugLower) {
    return {
      title: "DAT Causes",
      description: "Explore plays, drama clubs, stories, and artists by cause.",
      alternates: { canonical: "/cause" },
      openGraph: {
        title: "DAT Causes",
        description: "Explore plays, drama clubs, stories, and artists by cause.",
        url: "/cause",
        type: "website",
      },
      twitter: {
        card: "summary",
        title: "DAT Causes",
        description: "Explore plays, drama clubs, stories, and artists by cause.",
      },
    };
  }

  const alumni: AlumniRow[] = await loadVisibleAlumni();

  const taxonomyHit = findCauseBySlug(slugLower);
  const taxonomyLabel = (() => {
    if (!taxonomyHit) return undefined;
    const meta: any = taxonomyHit.subCause ?? taxonomyHit.category;
    if (!meta) return undefined;
    return meta.shortLabel || meta.label;
  })();

  const labelFromData =
    alumni
      .flatMap((a) => (((a as any).causeTags ?? []) as string[]))
      .map((t) => getCanonicalTag(t) ?? t)
      .find((c) => slugify(c) === slugLower) ??
    taxonomyLabel ??
    humanizeSlug(slug);

  const title = `${labelFromData} — DAT Causes`;
  const description = `Plays, drama clubs, stories, and artists connected to the cause: ${labelFromData}.`;
  const canonicalPath = `/cause/${slug}`;

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

// ===============================
// Page
// ===============================

export default async function CausePage({
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

  const slugLower = norm(slug);

  const alumni: AlumniRow[] = await loadVisibleAlumni();
  const allProductions: Production[] = Object.values(productionMap);
  const allDramaClubs: DramaClub[] = dramaClubs;
  const allStories: Story[] = stories as Story[];

  const matchTag = (raw: string): boolean => {
    const canonical = getCanonicalTag(raw) ?? raw;
    return slugify(canonical) === slugLower;
  };

  const productionsForCause = allProductions.filter((prod) => {
    const extra = productionDetailsMap[prod.slug] as ProductionExtra | undefined;
    const causes = (extra?.causes ?? []) as CauseItem[];
    return causes.some((cause) => cause?.label && matchTag(cause.label));
  });

  // 🔹 UPDATED: clubs match either old causeTags OR new taxonomy causes
  const clubsForCause = allDramaClubs.filter((club) => {
    // 1) Direct slug match (causeSlugs array)
    const slugMatch = (club.causeSlugs ?? []).map((s) => norm(s)).includes(slugLower);

    // 2) Taxonomy match: any DramaClub.cause subcategory whose id == slug
    let taxonomyMatch = false;
    const rawCauses = club.causes ?? [];

    if (Array.isArray(rawCauses)) {
      taxonomyMatch = rawCauses.some((c) => {
        if (!c?.category || !c?.subcategory) return false;

        const subList =
          CAUSE_SUBCATEGORIES_BY_CATEGORY[
            c.category as keyof typeof CAUSE_SUBCATEGORIES_BY_CATEGORY
          ] || [];

        const meta = subList.find((m) => (m as any).id === c.subcategory);

        return String((meta as any)?.id ?? "").toLowerCase() === slugLower;
      });
    }

    return slugMatch || taxonomyMatch;
  });

  const storiesForCause = allStories.filter((story) =>
    ((story.causeTags ?? []) as string[]).some(matchTag)
  );

  const contributedSet = new Set<string>();

  type ExtraWithPeople = ProductionExtra & {
    cast?: PersonRoleMaybeSlug[];
    creativeTeam?: PersonRoleMaybeSlug[];
  };

  for (const prod of productionsForCause) {
    const extra = productionDetailsMap[prod.slug] as ExtraWithPeople | undefined;
    const people = [...(extra?.cast ?? []), ...(extra?.creativeTeam ?? [])] as PersonRoleMaybeSlug[];

    for (const p of people) {
      if (p.slug) contributedSet.add(p.slug);
    }
  }

  const hasCauseTag = (artist: AlumniRow) =>
    ((((artist as any).causeTags ?? []) as string[])).some(matchTag);

  const both: AlumniRow[] = [];
  const tagOnly: AlumniRow[] = [];
  const contribOnly: AlumniRow[] = [];

  for (const artist of alumni) {
    const tagged = hasCauseTag(artist);
    const contributed = artist.slug ? contributedSet.has(artist.slug) : false;

    if (tagged && contributed) both.push(artist);
    else if (tagged) tagOnly.push(artist);
    else if (contributed) contribOnly.push(artist);
  }

  // 🔹 NEW: taxonomy presence counts as “real”
  const taxonomyHit = findCauseBySlug(slugLower);

  const hasAnyContent =
    productionsForCause.length ||
    clubsForCause.length ||
    storiesForCause.length ||
    both.length ||
    tagOnly.length ||
    contribOnly.length;

  // If there is no content AND no taxonomy definition, then true 404
  if (!hasAnyContent && !taxonomyHit) return notFound();

  const displayLabelFromAlumni =
    alumni
      .flatMap((a) => (((a as any).causeTags ?? []) as string[]))
      .map((t) => getCanonicalTag(t) ?? t)
      .find((c) => slugify(c) === slugLower);

  const taxonomyLabel = (() => {
    if (!taxonomyHit) return undefined;
    const meta: any = taxonomyHit.subCause ?? taxonomyHit.category;
    if (!meta) return undefined;
    return meta.shortLabel || meta.label;
  })();

  const displayLabel = taxonomyLabel ?? displayLabelFromAlumni ?? humanizeSlug(slug);

  const byLastName = (a: AlumniRow, b: AlumniRow) => {
    const [af, al] = splitName(a.name);
    const [bf, bl] = splitName(b.name);
    return bl.localeCompare(al) || af.localeCompare(bf);
  };

  both.sort(byLastName);
  tagOnly.sort(byLastName);
  contribOnly.sort(byLastName);

  // 🔹 Build a set of which canonical subcategory IDs are *actually used*.
  const usedSubcategoryIds = new Set<string>();

  // 1) From drama clubs canonical taxonomy
  for (const club of allDramaClubs) {
    // a) From DramaClub.causes
    for (const c of club.causes ?? []) {
      if (!c?.category || !c?.subcategory) continue;

      const subList =
        CAUSE_SUBCATEGORIES_BY_CATEGORY[
          c.category as keyof typeof CAUSE_SUBCATEGORIES_BY_CATEGORY
        ] ?? [];

      const meta = subList.find((m) => (m as any).id === c.subcategory) as any | undefined;

      if (meta?.id) {
        usedSubcategoryIds.add(String(meta.id).toLowerCase());
      }
    }

    // b) From DramaClub.causeSlugs that match any known subcategory id
    for (const s of club.causeSlugs ?? []) {
      const id = String(s || "").toLowerCase();
      if (!id) continue;

      const isKnown = Object.values(CAUSE_SUBCATEGORIES_BY_CATEGORY).some((subList) =>
        subList.some((sub) => String((sub as any).id || "").toLowerCase() === id)
      );

      if (isKnown) {
        usedSubcategoryIds.add(id);
      }
    }
  }

  // Don’t show the current page’s slug as a chip
  usedSubcategoryIds.delete(slugLower);

  // 🔹 Group used subcategories by category for "Other Causes We Champion"
  const groupedUsedSubcategories: {
    categoryId: string;
    categoryLabel: string;
    items: { id: string; label: string }[];
  }[] = [];

  for (const cat of CAUSE_CATEGORIES) {
    const catAny = cat as any;
    const categoryId = String(catAny.id || catAny.slug || "").toLowerCase();
    if (!categoryId) continue;

    const categoryLabel =
      (catAny.shortLabel as string | undefined) ||
      (catAny.label as string | undefined) ||
      categoryId;

    const subList =
      CAUSE_SUBCATEGORIES_BY_CATEGORY[
        categoryId as keyof typeof CAUSE_SUBCATEGORIES_BY_CATEGORY
      ] ?? [];

    const items = subList
      .map((sub) => sub as any)
      .filter((sub) => usedSubcategoryIds.has(String(sub.id || "").toLowerCase()))
      .map((sub) => {
        const id = String(sub.id || "").toLowerCase();
        const label =
          (sub.shortLabel as string | undefined) ||
          (sub.label as string | undefined) ||
          id;
        return { id, label };
      });

    if (items.length > 0) {
      groupedUsedSubcategories.push({
        categoryId,
        categoryLabel,
        items,
      });
    }
  }

  // Optional meta (no-op if empty)
  const meta = causeMetaMap[slugLower] || {};
  const heroSrc = normalizeStaticSrc(meta.heroImageUrl) || "/images/alumni-hero.jpg";
  const heroIntro =
    meta.intro || "Plays, drama clubs, stories, and artists championing this cause";

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
      {/* HERO */}
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
          alt={`${displayLabel} Cause Hero`}
          fill
          priority
          className="object-cover object-center"
        />

        {/* Right aligned, minimal inset */}
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
              fontSize: "clamp(4rem, 9vw, 8rem)",
              color: "#f2f2f2",
              opacity: 0.88,
              textTransform: "uppercase",
              textShadow: "0 8px 20px rgba(0,0,0,0.8)",
              margin: 0,
              lineHeight: "1",
            }}
          >
            {displayLabel}
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

      {/* MAIN */}
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
          {productionsForCause.length > 0 && (
            <section style={{ marginBottom: "4rem" }}>
              <SectionLabel>Productions Born from This Cause</SectionLabel>

              <div className="cause-shell">
                <div className="poster-grid">
                  {productionsForCause.map((prod) => {
                    const extra = productionDetailsMap[prod.slug] as ProductionExtra | undefined;
                    const extraAny = extra as any;

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

                    const tagline = extraAny?.tagline as string | undefined;

                    const subtitle =
                      tagline ||
                      prod.location ||
                      (extraAny?.seasonLabel as string | undefined) ||
                      String(prod.year ?? "");

                    return (
                      <PosterCard
                        key={prod.slug}
                        href={`/theatre/${prod.slug}`}
                        title={prod.title}
                        eyebrow="Production"
                        subtitle={subtitle}
                        imageSrc={posterSrc}
                      />
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* SECTION: Drama Clubs */}
          {clubsForCause.length > 0 && (
            <section style={{ marginBottom: "4rem" }}>
              <SectionLabel>Drama Clubs on the Frontlines</SectionLabel>

              <div className="cause-shell">
                <DramaClubIndexMicroGrid clubs={clubsForCause} />
              </div>
            </section>
          )}

          {/* SECTION: Stories */}
          {storiesForCause.length > 0 && (
            <section style={{ marginBottom: "4rem" }}>
              <SectionLabel>Related Stories from the Field</SectionLabel>

              <div className="cause-shell cause-shell--stories">
                <div className="cause-grid">
                  {storiesForCause.map((story) => {
                    const img =
                      normalizeStaticSrc(
                        (story.heroImage as string | undefined) ??
                          (story.thumbnail as string | undefined)
                      ) ?? "/images/stories/fallback.jpg";

                    return (
                      <Link key={story.slug} href={`/stories/${story.slug}`} className="cause-card-link">
                        <article className="cause-card cause-card--story article-card">
                          {img && (
                            <div className="story-img-shell">
                              <Image src={img} alt={story.title} fill className="object-cover" />
                            </div>
                          )}

                          <div className="cause-card-body article-body">
                            <h3 className="story-title">{story.title}</h3>
                            {(story.locationLabel || story.programLabel) && (
                              <p className="story-meta">
                                {[story.locationLabel, story.programLabel].filter(Boolean).join(" • ")}
                              </p>
                            )}
                            {story.teaser && <p className="story-teaser">{story.teaser}</p>}

                            <div className="article-cta">Read story →</div>
                          </div>
                        </article>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* SECTION: Artists */}
          {(both.length > 0 || tagOnly.length > 0 || contribOnly.length > 0) && (
            <section>
              <SectionLabel>Artists Taking a Stand</SectionLabel>

              <div className="cause-shell cause-shell--artists">
                {both.length > 0 && (
                  <div>
                    <Subheading>Artists at the Heart of This Cause</Subheading>
                    <ArtistGrid artists={both} />
                  </div>
                )}

                {tagOnly.length > 0 && (
                  <div>
                    <Subheading>Artists Who Carry This Cause in Their Practice</Subheading>
                    <ArtistGrid artists={tagOnly} />
                  </div>
                )}

                {contribOnly.length > 0 && (
                  <div>
                    <Subheading>Artists Who’ve Worked on These Plays</Subheading>
                    <ArtistGrid artists={contribOnly} />
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        {/* EXPLORE MORE CAUSES (grouped by category, only used subcategories) */}
        {groupedUsedSubcategories.length > 0 && (
          <section style={{ width: "90%", maxWidth: 1200, margin: "4rem auto 0" }}>
            <SectionLabel>Other Causes We Champion</SectionLabel>

            <div
              style={{
                background: "rgba(36, 17, 35, 0.2)",
                borderRadius: "8px",
                padding: "2rem",
                display: "flex",
                flexDirection: "column",
                gap: "1.75rem",
              }}
            >
              {groupedUsedSubcategories.map((group) => (
                <div key={group.categoryId}>
                  <h3
                    style={{
                      fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                      fontSize: "1.1rem",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      margin: "0 0 0.6rem",
                      opacity: 0.8,
                    }}
                  >
                    {group.categoryLabel}
                  </h3>

                  <div className="more-causes-grid">
                    {group.items.map((item) => {
                      const chipMeta = causeMetaMap[item.id];
                      const chipBg = chipMeta?.chipImageUrl
                        ? normalizeStaticSrc(chipMeta.chipImageUrl)
                        : undefined;

                      return (
                        <Link
                          key={item.id}
                          href={`/cause/${item.id}`}
                          className={`cause-chip ${chipBg ? "cause-chip--image" : ""}`}
                          style={
                            chipBg
                              ? {
                                  backgroundImage: `linear-gradient(rgba(255,255,255,0.65), rgba(255,255,255,0.65)), url(${chipBg})`,
                                  backgroundSize: "cover",
                                  backgroundPosition: "center",
                                }
                              : undefined
                          }
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Season nav */}
        <section
          style={{
            width: "100vw",
            backgroundColor: "#6C00AF",
            boxShadow: "0px 0px 33px rgba(0.8,0.8,0.8,0.8)",
            padding: "4rem 0",
            marginTop: "4rem",
            marginBottom: "-2rem", // ✅ tuck into footer like other pages
          }}
        >
          <SeasonsCarouselAlt />
        </section>
      </main>

      <style>{`
        /* Global: remove underlines */
        a { text-decoration: none; }
        a:hover { text-decoration: none; }

        .cause-shell .drama-micro-card {
  opacity: 0.8;
  transition:
    transform 180ms ease-out,
    box-shadow 180ms ease-out,
    opacity 180ms ease-out;
}

.cause-shell .drama-micro-card:hover {
  opacity: 1;
}


        .cause-shell{
          background: rgba(36, 17, 35, 0.18);
          border-radius: 12px;
          padding: 2rem;
          box-shadow: none;
        }
        .cause-shell--artists{
          display: flex;
          flex-direction: column;
          gap: 2.5rem;
        }
        .cause-shell--stories{
          background: rgba(36, 17, 35, 0.10);
        }

        .cause-grid{
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
          gap: 1.5rem;
        }
        .cause-grid--tight{
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        }

        .cause-card-link{
          text-decoration: none;
          color: inherit;
        }

        .cause-card{
          border-radius: 12px;
          overflow: hidden;
          background-color: #2493A9;
          display: flex;
          flex-direction: column;
          box-shadow: 0 10px 24px rgba(0,0,0,0.22);
          transition:
            transform 0.22s ease,
            box-shadow 0.22s ease,
            background-color 0.22s ease;
        }
        .cause-card:hover{
          box-shadow: 0 16px 32px rgba(0,0,0,0.27);
          background-color: #0c6172ff;
        }

        /* Slight enlarge for play posters (now mainly used by story/club if at all) */
        .cause-card--poster:hover{
          transform: translateY(-4px) scale(1.03);
        }
        .cause-card--club:hover,
        .cause-card--story:hover{
          transform: translateY(-3px);
        }

        .cause-card-poster{
          position: relative;
          width: 100%;
          padding-top: 150%; /* portrait ratio */
          overflow: hidden;
          border-radius: 12px 12px 0 0;
        }

        .cause-card-body{
          padding: 0.75rem 0.9rem 1rem;
        }
        .cause-card-title{
          font-family: var(--font-space-grotesk), system-ui, sans-serif;
          font-size: 0.92rem;
          font-weight: 800;
          text-align: center;
          margin: 0;
          color: #f2f2f2;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          line-height: 1.15;
          transition: color 0.16s ease, opacity 0.16s ease;
        }
        .cause-card-link:hover .cause-card-title{
          color: #f2f2f2;
          opacity: 0.7;
        }

        .cause-card-tagline{
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 0.85rem;
          margin: 0.35rem 0 0;
          opacity: 0.7;
          text-align: center;
        }

        /* === Story cards: article vibe === */
        .article-card{
          background: rgba(255,255,255,0.95);
          color: #241123;
          box-shadow: 0 8px 20px rgba(0,0,0,0.18);
        }
        .article-card:hover{
          background: rgba(255,255,255,1);
        }
        .story-img-shell{
          position: relative;
          width: 100%;
          padding-top: 60%;
        }
        .article-body{
          padding: 1rem 1.1rem 1.1rem;
        }
        .story-title{
          font-family: var(--font-space-grotesk), system-ui, sans-serif;
          font-size: 1.15rem;
          margin: 0 0 0.35rem;
          font-weight: 800;
          letter-spacing: 0.01em;
        }
        .story-meta{
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 0.8rem;
          margin: 0 0 0.6rem;
          opacity: 0.7;
        }
        .story-teaser{
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 0.98rem;
          line-height: 1.45;
          margin: 0 0 0.75rem;
          opacity: 0.95;
        }
        .article-cta{
          font-family: var(--font-space-grotesk), system-ui, sans-serif;
          font-size: 0.85rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #6C00AF;
        }

        /* Explore More Causes chips — visible, no arrows */
        .more-causes-grid{
          display: flex;
          flex-wrap: wrap;
          gap: 0.7rem;
        }
        .cause-chip{
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
        .cause-chip:hover{
          background: #FFCC00;
          opacity: 0.95;
          color: #241123;
          transform: translateY(-1px);
          box-shadow: 0 6px 15px rgba(0,0,0,0.2);
          border-color: #FFCC00;
        }
        .cause-chip--image{
          background-blend-mode: normal;
        }

        @media (max-width: 900px){
          main{
            margin-top: -3.5rem;
            padding-top: 5.5rem;
          }
          .cause-shell{
            padding: 1.6rem;
          }
        }

        @media (max-width: 640px){
          .cause-grid{
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

// ===============================
// Small shared components / helpers
// ===============================

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

function Subheading({ children }: { children: React.ReactNode }) {
  return (
    <h3
      style={{
        fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
        fontSize: "1.3rem",
        margin: "0 0 1rem",
      }}
    >
      {children}
    </h3>
  );
}

function ArtistGrid({ artists }: { artists: AlumniRow[] }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
        gap: "1rem",
        justifyItems: "center",
      }}
    >
      {artists.map((artist) => (
        <MiniProfileCard
          key={artist.slug}
          alumniId={artist.slug}
          name={artist.name}
          role={artist.role}
          slug={artist.slug}
          headshotUrl={artist.headshotUrl}
        />
      ))}
    </div>
  );
}

function humanizeSlug(slug: unknown) {
  const s = String(slug ?? "").trim();
  if (!s) return "";
  return s
    .split("-")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
    .join(" ");
}

function splitName(full: string) {
  const parts = (typeof full === "string" ? full : "").trim().split(/\s+/);
  const first = parts[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1] : "";
  return [first, last] as const;
}