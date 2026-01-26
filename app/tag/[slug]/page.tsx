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

// Build all valid tag slugs at build time
export async function generateStaticParams() {
  const alumni: AlumniRow[] = await loadVisibleAlumni();
  const slugs = new Set<string>();

  for (const artist of alumni) {
    for (const tag of artist.identityTags ?? []) {
      if (typeof tag !== "string") continue;
      const canonical = getCanonicalTag(tag);
      if (canonical) slugs.add(slugifyTag(canonical));
    }
  }
  return Array.from(slugs).map((slug) => ({ slug }));
}

// Helpful metadata per tag page
export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const slugLower = (params?.slug ?? "").toLowerCase();
  const alumni: AlumniRow[] = await loadVisibleAlumni();

  // Try to find the canonical label for this slug from actual data
  const labelFromData =
    alumni
      .flatMap((a) => a.identityTags ?? [])
      .map((t) => getCanonicalTag(t))
      .find((c) => c && slugifyTag(c) === slugLower) ??
        humanizeSlug(params?.slug ?? "");


  const title = `${labelFromData} — DAT Alumni`;
  const description = `Explore artists tagged as ${labelFromData}.`;
  const canonicalPath = `/tag/${params?.slug ?? ""}`;

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

export default async function TagPage({ params }: { params: { slug: string } }) {
  const slug = params?.slug ?? "";
  const alumni: AlumniRow[] = await loadVisibleAlumni();
  const slugLower = slug.toLowerCase();

  // Filter by canonicalized tag
  const filteredRaw = alumni.filter((artist) =>
    (artist.identityTags ?? []).some((tag) => {
      const c = getCanonicalTag(tag);
      return c ? slugifyTag(c) === slugLower : false;
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
      .map((t: string) => getCanonicalTag(t))
      .find((c) => c && slugifyTag(c) === slugLower) ?? humanizeSlug(slug);

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
            Artists tagged as {(displayLabel ?? "").toLowerCase()}
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
