// app/tag/[slug]/page.tsx

import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { loadVisibleAlumni } from "@/lib/loadAlumni";
import type { AlumniRow } from "@/lib/types";
import MiniProfileCard from "@/components/profile/MiniProfileCard";
import SeasonsCarouselAlt from "@/components/alumni/SeasonsCarouselAlt";
import TagsGrid from "@/components/alumni/TagsGrid";
import { getCanonicalTag, slugifyTag } from "@/lib/tags";

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

/**
 * Fallback slugify for unknown/non-canonical tags.
 * Keeps routing stable even if a new tag appears in Sheets before the canonical map is updated.
 */
function fallbackSlugify(raw: string): string {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "") // drop apostrophes
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * ✅ Canonicalize if possible; otherwise fall back to raw tag string.
 * For canonical tags we use slugifyTag (typed). For unknown tags we use fallbackSlugify.
 */
function normalizeTagForSlug(tag: unknown): { label: string; slug: string } | null {
  const raw = String(tag ?? "").trim();
  if (!raw) return null;

  const canonical = getCanonicalTag(raw);

  if (canonical) {
    return { label: canonical, slug: slugifyTag(canonical) };
  }

  // unknown tag — still allow routing
  return { label: raw, slug: fallbackSlugify(raw) };
}

// Build all valid tag slugs at build time
export async function generateStaticParams() {
  const alumni: AlumniRow[] = await loadVisibleAlumni();
  const slugs = new Set<string>();

  for (const artist of alumni) {
    for (const tag of artist.identityTags ?? []) {
      const norm = normalizeTagForSlug(tag);
      if (norm?.slug) slugs.add(norm.slug);
    }
  }

  return Array.from(slugs).map((slug) => ({ slug }));
}

// Helpful metadata per tag page
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
      title: "DAT Alumni Tags",
      description: "Explore DAT alumni tags.",
      alternates: { canonical: "/tag" },
      openGraph: {
        title: "DAT Alumni Tags",
        description: "Explore DAT alumni tags.",
        url: "/tag",
        type: "website",
      },
      twitter: {
        card: "summary",
        title: "DAT Alumni Tags",
        description: "Explore DAT alumni tags.",
      },
    };
  }

  const alumni: AlumniRow[] = await loadVisibleAlumni();

  // Try to find a label for this slug from actual data (canonical OR unknown tags)
  const labelFromData =
    alumni
      .flatMap((a) => a.identityTags ?? [])
      .map((t) => normalizeTagForSlug(t))
      .find((x) => x && x.slug.toLowerCase() === slugLower)?.label ?? humanizeSlug(slug);

  const title = `${labelFromData} — DAT Alumni`;
  const description = `Explore artists tagged as ${labelFromData}.`;
  const canonicalPath = `/tag/${slug}`;

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

export default async function TagPage({
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
  const alumni: AlumniRow[] = await loadVisibleAlumni();

  // Filter by canonicalized tag; fallback to raw tag slug if canonical is unknown
  const filteredRaw = alumni.filter((artist) =>
    (artist.identityTags ?? []).some((tag) => {
      const norm = normalizeTagForSlug(tag);
      return norm ? norm.slug.toLowerCase() === slugLower : false;
    })
  );

  // De-dupe by slug and stable-sort by last → first
  const seen = new Set<string>();
  const filtered = filteredRaw
    .filter((a) => (a.slug ? !seen.has(a.slug) && seen.add(a.slug) : false))
    .sort((a, b) => {
      const [af, al] = splitName(a.name);
      const [bf, bl] = splitName(b.name);
      return bl.localeCompare(al) || af.localeCompare(bf);
    });

  if (!filtered.length) return notFound();

  // Display label from data if possible; fallback to humanized slug
  const displayLabel =
    filtered
      .flatMap((a) => a.identityTags ?? [])
      .map((t) => normalizeTagForSlug(t))
      .find((x) => x && x.slug.toLowerCase() === slugLower)?.label ?? humanizeSlug(slug);

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
          alt={`${displayLabel} Hero`}
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
              opacity: 0.7,
              margin: 0,
              marginTop: "0rem",
              textShadow: "0 4px 9px rgba(0,0,0,0.9)",
              textAlign: "right",
            }}
          >
            Artists tagged as {String(displayLabel ?? "").toLowerCase()}
          </p>
        </div>
      </div>

      {/* MAIN */}
      <main
        style={{
          marginTop: "-5rem",
          padding: "8rem 0 2rem",
          position: "relative",
          opacity: 0.9,
          zIndex: 10,
        }}
      >
        <div style={{ width: "90%", margin: "0 auto" }}>
          <h3
            style={{
              fontFamily: "var(--font-anton), system-ui, sans-serif",
              fontSize: "2.4rem",
              margin: "3.5rem 0 1.1rem",
              textTransform: "uppercase",
              letterSpacing: "0.2rem",
              color: "#241123",
              backgroundColor: "#FFCC00",
              opacity: 0.6,
              padding: "0.1em 0.5em",
              borderRadius: "0.3em",
              display: "inline-block",
            }}
          >
            {displayLabel}
          </h3>

          <div
            style={{
              background: "rgba(36, 17, 35, 0.2)",
              borderRadius: "8px",
              padding: "2rem",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                gap: "1rem",
                justifyItems: "center",
              }}
            >
              {filtered.map((artist) => (
                <MiniProfileCard
                  key={artist.slug}
                  // ✅ match the role page pattern if MiniProfileCard supports it
                  alumniId={artist.slug}
                  name={artist.name}
                  role={artist.role}
                  slug={artist.slug}
                  headshotUrl={artist.headshotUrl}
                />
              ))}
            </div>
          </div>
        </div>

        {/* TAGS NAV */}
        <section style={{ width: "90%", margin: "4rem auto 0" }}>
          <h3
            style={{
              fontFamily: "var(--font-anton), system-ui, sans-serif",
              fontSize: "2.4rem",
              margin: "0rem 0 1.1rem",
              textTransform: "uppercase",
              letterSpacing: "0.2rem",
              color: "#241123",
              backgroundColor: "#FFCC00",
              opacity: 0.6,
              padding: "0.1em 0.5em",
              borderRadius: "0.3em",
              display: "inline-block",
            }}
          >
            Explore More Tags
          </h3>

          <div
            style={{
              background: "rgba(36, 17, 35, 0.2)",
              borderRadius: "8px",
              padding: "2rem",
            }}
          >
            <TagsGrid alumni={alumni} />
          </div>
        </section>

        {/* SEASON NAV */}
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
      </main>

      <style>{`
        a { text-decoration: none; }
        h3 { color: #FFCC00; }
      `}</style>
    </div>
  );
}

// ------- helpers -------
function humanizeSlug(slug: string) {
  const safe = typeof slug === "string" ? slug : "";
  return safe
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
