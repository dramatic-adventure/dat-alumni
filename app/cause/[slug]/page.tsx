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
import { dramaClubs, type DramaClub } from "@/lib/dramaClubs";

import { slugifyTag as slugify, getCanonicalTag } from "@/lib/tags";

export const revalidate = 3600;

// ===============================
// Static params
// ===============================

export async function generateStaticParams() {
  const alumni: AlumniRow[] = await loadVisibleAlumni();

  const slugs = new Set<string>();

  // 1) Causes from alumni profiles (using any so we don't have to touch AlumniRow yet)
  for (const artist of alumni) {
    const causeTags: string[] = ((artist as any).causeTags ?? []) as string[];
    for (const tag of causeTags) {
      const canonical = getCanonicalTag(tag) ?? tag;
      slugs.add(slugify(canonical));
    }
  }

  // 2) Causes from productions (CauseItem[])
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

  // 3) Causes from drama clubs
  for (const club of dramaClubs as DramaClub[]) {
    const causeTags: string[] = (club.causeTags ?? []) as string[];
    for (const tag of causeTags) {
      const canonical = getCanonicalTag(tag) ?? tag;
      slugs.add(slugify(canonical));
    }
  }

  // 4) Causes from stories
  for (const story of stories as Story[]) {
    const causeTags: string[] = (story.causeTags ?? []) as string[];
    for (const tag of causeTags) {
      const canonical = getCanonicalTag(tag) ?? tag;
      slugs.add(slugify(canonical));
    }
  }

  return Array.from(slugs).map((slug) => ({ slug }));
}

// ===============================
// Metadata
// ===============================

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const alumni: AlumniRow[] = await loadVisibleAlumni();
  const slugLower = params.slug.toLowerCase();

  const labelFromData =
    alumni
      .flatMap((a) => (((a as any).causeTags ?? []) as string[]))
      .map((t) => getCanonicalTag(t) ?? t)
      .find((c) => slugify(c) === slugLower) ?? humanizeSlug(params.slug);

  const title = `${labelFromData} — DAT Causes`;
  const description = `Plays, drama clubs, stories, and artists connected to the cause: ${labelFromData}.`;
  const canonicalPath = `/cause/${params.slug}`;

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

export default async function CausePage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const slugLower = slug.toLowerCase();

  const alumni: AlumniRow[] = await loadVisibleAlumni();
  const allProductions: Production[] = Object.values(productionMap);
  const allDramaClubs: DramaClub[] = dramaClubs as DramaClub[];
  const allStories: Story[] = stories as Story[];

  const matchTag = (raw: string): boolean => {
    const canonical = getCanonicalTag(raw) ?? raw;
    return slugify(canonical) === slugLower;
  };

  // 1) PRODUCTIONS for this cause
  const productionsForCause = allProductions.filter((prod) => {
    const extra = productionDetailsMap[prod.slug] as ProductionExtra | undefined;
    const causes = (extra?.causes ?? []) as CauseItem[];
    return causes.some((cause) => cause?.label && matchTag(cause.label));
  });

  // 2) DRAMA CLUBS for this cause
  const clubsForCause = allDramaClubs.filter((club) =>
    ((club.causeTags ?? []) as string[]).some(matchTag)
  );

  // 3) STORIES for this cause
  const storiesForCause = allStories.filter((story) =>
    ((story.causeTags ?? []) as string[]).some(matchTag)
  );

  // 4) ARTISTS (three buckets)
  const contributedSet = new Set<string>();

  type ExtraWithPeople = ProductionExtra & {
    cast?: PersonRoleMaybeSlug[];
    creativeTeam?: PersonRoleMaybeSlug[];
  };

  for (const prod of productionsForCause) {
    const extra = productionDetailsMap[prod.slug] as ExtraWithPeople | undefined;
    const people = [
      ...(extra?.cast ?? []),
      ...(extra?.creativeTeam ?? []),
    ] as PersonRoleMaybeSlug[];

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

  const hasAnyContent =
    productionsForCause.length ||
    clubsForCause.length ||
    storiesForCause.length ||
    both.length ||
    tagOnly.length ||
    contribOnly.length;

  if (!hasAnyContent) return notFound();

  const displayLabelFromAlumni =
    alumni
      .flatMap((a) => (((a as any).causeTags ?? []) as string[]))
      .map((t) => getCanonicalTag(t) ?? t)
      .find((c) => slugify(c) === slugLower);

  const displayLabel = displayLabelFromAlumni ?? humanizeSlug(slug);

  const byLastName = (a: AlumniRow, b: AlumniRow) => {
    const [af, al] = splitName(a.name);
    const [bf, bl] = splitName(b.name);
    return bl.localeCompare(al) || af.localeCompare(bf);
  };

  both.sort(byLastName);
  tagOnly.sort(byLastName);
  contribOnly.sort(byLastName);

  return (
    <div>
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
          src="/images/alumni-hero.jpg"
          alt={`${displayLabel} Cause Hero`}
          fill
          priority
          className="object-cover object-center"
        />
        <div style={{ position: "absolute", bottom: "1rem", right: "5%" }}>
          <h1
            style={{
              fontFamily: "var(--font-anton), system-ui, sans-serif",
              fontSize: "clamp(4rem, 9vw, 8rem)",
              color: "#f2f2f2",
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
              opacity: 0.8,
              margin: 0,
              marginTop: "0rem",
              textShadow: "0 4px 9px rgba(0,0,0,0.9)",
              textAlign: "right",
            }}
          >
            Plays, drama clubs, stories & artists working in this cause
          </p>
        </div>
      </div>

      {/* MAIN */}
      <main
        style={{
          marginTop: "-5rem",
          padding: "8rem 0 2rem",
          position: "relative",
          opacity: 0.95,
          zIndex: 10,
        }}
      >
        <div style={{ width: "90%", margin: "0 auto" }}>
          {/* SECTION: Plays */}
          {productionsForCause.length > 0 && (
            <section style={{ marginBottom: "4rem" }}>
              <SectionLabel>Plays in this Cause</SectionLabel>

              <div
                style={{
                  background: "rgba(36, 17, 35, 0.18)",
                  borderRadius: "12px",
                  padding: "2rem",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                    gap: "1.5rem",
                  }}
                >
                  {productionsForCause.map((prod) => {
                    const extra = productionDetailsMap[prod.slug] as ProductionExtra | undefined;

                    // Use any here so we don't have to edit Production / ProductionExtra types right now
                    const posterSrc =
                      (extra as any)?.posterImage ??
                      (prod as any)?.posterImage ??
                      "/images/posters/fallback.jpg";

                    const tagline = (extra as any)?.tagline as string | undefined;

                    return (
                      <Link
                        key={prod.slug}
                        href={`/theatre/${prod.slug}`}
                        style={{ textDecoration: "none", color: "inherit" }}
                      >
                        <article
                          style={{
                            borderRadius: "12px",
                            overflow: "hidden",
                            boxShadow: "0 10px 24px rgba(0,0,0,0.28)",
                            backgroundColor: "#ffffff",
                            display: "flex",
                            flexDirection: "column",
                            transition:
                              "transform 0.18s ease, box-shadow 0.18s ease",
                          }}
                          className="group"
                        >
                          <div
                            style={{
                              position: "relative",
                              width: "100%",
                              paddingTop: "150%",
                            }}
                          >
                            <Image
                              src={posterSrc}
                              alt={prod.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div style={{ padding: "0.75rem 0.9rem 1rem" }}>
                            <h3
                              style={{
                                fontFamily:
                                  "var(--font-space-grotesk), system-ui, sans-serif",
                                fontSize: "1.1rem",
                                fontWeight: 600,
                                margin: 0,
                              }}
                            >
                              {prod.title}
                            </h3>
                            {tagline && (
                              <p
                                style={{
                                  fontFamily:
                                    "var(--font-dm-sans), system-ui, sans-serif",
                                  fontSize: "0.85rem",
                                  margin: "0.35rem 0 0",
                                  opacity: 0.7,
                                }}
                              >
                                {tagline}
                              </p>
                            )}
                          </div>
                        </article>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* SECTION: Drama Clubs */}
          {clubsForCause.length > 0 && (
            <section style={{ marginBottom: "4rem" }}>
              <SectionLabel>Drama Clubs in this Cause</SectionLabel>

              <div
                style={{
                  background: "rgba(36, 17, 35, 0.18)",
                  borderRadius: "12px",
                  padding: "2rem",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
                    gap: "1.5rem",
                  }}
                >
                  {clubsForCause.map((club) => (
                    <article
                      key={club.slug}
                      style={{
                        borderRadius: "12px",
                        backgroundColor: "#ffffff",
                        padding: "1.1rem 1.2rem 1.25rem",
                        boxShadow: "0 10px 24px rgba(0,0,0,0.22)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                      }}
                    >
                      {club.logoSrc && (
                        <div
                          style={{
                            position: "relative",
                            width: "64px",
                            height: "64px",
                            marginBottom: "0.35rem",
                          }}
                        >
                          <Image
                            src={club.logoSrc}
                            alt={club.logoAlt ?? club.name}
                            fill
                            className="object-contain"
                          />
                        </div>
                      )}

                      <div>
                        <h3
                          style={{
                            fontFamily:
                              "var(--font-space-grotesk), system-ui, sans-serif",
                            fontSize: "1.1rem",
                            margin: 0,
                          }}
                        >
                          {club.name}
                        </h3>
                        {club.location && (
                          <p
                            style={{
                              fontFamily:
                                "var(--font-dm-sans), system-ui, sans-serif",
                              fontSize: "0.85rem",
                              margin: "0.25rem 0 0.4rem",
                              opacity: 0.7,
                            }}
                          >
                            {club.location}
                          </p>
                        )}
                      </div>

                      {club.blurb && (
                        <p
                          style={{
                            fontFamily:
                              "var(--font-dm-sans), system-ui, sans-serif",
                            fontSize: "0.9rem",
                            margin: 0,
                          }}
                        >
                          {club.blurb}
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* SECTION: Stories */}
          {storiesForCause.length > 0 && (
            <section style={{ marginBottom: "4rem" }}>
              <SectionLabel>Stories from the Map</SectionLabel>

              <div
                style={{
                  background: "rgba(36, 17, 35, 0.18)",
                  borderRadius: "12px",
                  padding: "2rem",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                    gap: "1.5rem",
                  }}
                >
                  {storiesForCause.map((story) => {
                    const img =
                      story.heroImage ??
                      story.thumbnail ??
                      "/images/stories/fallback.jpg";

                    return (
                      <Link
                        key={story.slug}
                        href={`/stories/${story.slug}`} // adjust if your story route differs
                        style={{ textDecoration: "none", color: "inherit" }}
                      >
                        <article
                          style={{
                            borderRadius: "12px",
                            overflow: "hidden",
                            boxShadow: "0 10px 24px rgba(0,0,0,0.22)",
                            backgroundColor: "#ffffff",
                            display: "flex",
                            flexDirection: "column",
                          }}
                        >
                          {img && (
                            <div
                              style={{
                                position: "relative",
                                width: "100%",
                                paddingTop: "60%",
                              }}
                            >
                              <Image
                                src={img}
                                alt={story.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}

                          <div style={{ padding: "0.8rem 0.95rem 1rem" }}>
                            <h3
                              style={{
                                fontFamily:
                                  "var(--font-space-grotesk), system-ui, sans-serif",
                                fontSize: "1.05rem",
                                margin: 0,
                              }}
                            >
                              {story.title}
                            </h3>
                            {(story.locationLabel || story.programLabel) && (
                              <p
                                style={{
                                  fontFamily:
                                    "var(--font-dm-sans), system-ui, sans-serif",
                                  fontSize: "0.8rem",
                                  margin: "0.35rem 0 0.45rem",
                                  opacity: 0.7,
                                }}
                              >
                                {[story.locationLabel, story.programLabel]
                                  .filter(Boolean)
                                  .join(" • ")}
                              </p>
                            )}
                            {story.teaser && (
                              <p
                                style={{
                                  fontFamily:
                                    "var(--font-dm-sans), system-ui, sans-serif",
                                  fontSize: "0.9rem",
                                  margin: 0,
                                }}
                              >
                                {story.teaser}
                              </p>
                            )}
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
              <SectionLabel>Artists Connected to this Cause</SectionLabel>

              <div
                style={{
                  background: "rgba(36, 17, 35, 0.18)",
                  borderRadius: "12px",
                  padding: "2rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "2.5rem",
                }}
              >
                {both.length > 0 && (
                  <div>
                    <Subheading>Artists at the Heart of This Cause</Subheading>
                    <ArtistGrid artists={both} />
                  </div>
                )}

                {tagOnly.length > 0 && (
                  <div>
                    <Subheading>
                      Artists Who Carry This Cause in Their Practice
                    </Subheading>
                    <ArtistGrid artists={tagOnly} />
                  </div>
                )}

                {contribOnly.length > 0 && (
                  <div>
                    <Subheading>
                      Artists Who’ve Worked on These Plays
                    </Subheading>
                    <ArtistGrid artists={contribOnly} />
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Season nav */}
        <section
          style={{
            width: "100vw",
            backgroundColor: "#6C00AF",
            boxShadow: "0px 0px 33px rgba(0.8,0.8,0.8,0.8)",
            padding: "4rem 0",
            marginTop: "4rem",
          }}
        >
          <SeasonsCarouselAlt />
        </section>
      </main>

      <style>{`
        a { text-decoration: none; }
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
        margin: "0 0 1.1rem",
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
          name={artist.name}
          role={artist.role}
          slug={artist.slug}
          headshotUrl={artist.headshotUrl}
        />
      ))}
    </div>
  );
}

function humanizeSlug(slug: string) {
  return slug
    .split("-")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
    .join(" ");
}

function splitName(full: string) {
  const parts = (full || "").trim().split(/\s+/);
  const first = parts[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1] : "";
  return [first, last] as const;
}

type PersonRoleMaybeSlug = {
  name: string;
  role: string;
  slug?: string;
  [key: string]: unknown;
};
