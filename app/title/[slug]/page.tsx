// app/title/[slug]/page.tsx
/**
 * Creative titles with custom buckets (e.g., Executive Directors, Stage Managers, Designers, Playwrights, Travel Writers, etc.).
 * Supports comma-separated titles, special merges, exclusions, and de-duplication via lib/titles.
 */
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { loadVisibleAlumni } from "@/lib/loadAlumni";
import type { AlumniRow } from "@/lib/types";
import MiniProfileCard from "@/components/profile/MiniProfileCard";
import SeasonsCarouselAlt from "@/components/alumni/SeasonsCarouselAlt";
import TitlesGrid from "@/components/alumni/TitlesGrid";
import { buildTitleBuckets, slugifyTitle } from "@/lib/titles";

// Use ISR instead of force-dynamic
export const revalidate = 3600;

type ParamsLike<T> = Promise<T> | T;

function humanizeSlug(slug: string) {
  const safe = typeof slug === "string" ? slug : "";
  return safe
    .split("-")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}
function titleCase(input: string) {
  const safe = typeof input === "string" ? input : "";
  return safe
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

async function resolveParams(
  params: ParamsLike<{ slug: string }> | ParamsLike<{ slug?: string }>
) {
  const p = (params instanceof Promise ? await params : params) as {
    slug?: string;
  };
  return p;
}

export async function generateStaticParams() {
  const alumni: AlumniRow[] = await loadVisibleAlumni();
  const buckets = buildTitleBuckets(alumni);
  const valid = Array.from(buckets.values()).filter((b) => b.people.size > 0);

  const seen = new Set<string>();
  const out: { slug: string }[] = [];
  for (const b of valid) {
    const keySlug = String(b.meta.key); // fixed buckets: use key (e.g., "playwrights")
    const labelSlug = slugifyTitle(b.meta.label); // dynamic buckets: use label
    const canonical = keySlug.startsWith("title:") ? labelSlug : keySlug;

    if (!seen.has(canonical)) {
      out.push({ slug: canonical });
      seen.add(canonical);
    }
    // also allow labelSlug for fixed buckets
    if (!keySlug.startsWith("title:") && !seen.has(labelSlug)) {
      out.push({ slug: labelSlug });
      seen.add(labelSlug);
    }
  }
  return out;
}

export async function generateMetadata({
  params,
}: {
  params: ParamsLike<{ slug: string }> | { slug: string };
}): Promise<Metadata> {
  const p = await resolveParams(params);
  const slug = String(p?.slug ?? "").trim();

  // ✅ Metadata must never crash; fall back gracefully.
  if (!slug) {
    return {
      title: "DAT Alumni — Titles",
      description: "Explore creative titles in the DAT alumni community.",
    };
  }

  const alumni: AlumniRow[] = await loadVisibleAlumni();
  const buckets = buildTitleBuckets(alumni);
  const target = slug.toLowerCase();

  const entry = Array.from(buckets.values()).find((b) => {
    const keySlug = String(b.meta.key);
    const labelSlug = slugifyTitle(b.meta.label);
    const canonical = keySlug.startsWith("title:") ? labelSlug : keySlug;
    return canonical === target || labelSlug === target;
  });

  const label = entry?.meta.label ?? humanizeSlug(slug);
  const title = `${label} — DAT Alumni`;
  const description = `Explore ${(typeof label === "string" ? label : "")
    .toLowerCase()} in the DAT alumni community.`;

  return { title, description };
}

export default async function TitlePage({
  params,
}: {
  params: ParamsLike<{ slug: string }> | { slug: string };
}) {
  const p = await resolveParams(params);

  const slug = String(p?.slug ?? "").trim();
  const target = slug.toLowerCase();

  // ✅ seasons-style guard
  if (!target) {
    notFound();
  }

  const alumni: AlumniRow[] = await loadVisibleAlumni();
  const buckets = buildTitleBuckets(alumni);

  // Find target bucket by either key or label slug
  const entry = Array.from(buckets.values()).find((b) => {
    const keySlug = String(b.meta.key); // e.g., "designers" or "title:actors"
    const labelSlug = slugifyTitle(b.meta.label); // e.g., "actors"
    const canonical = keySlug.startsWith("title:") ? labelSlug : keySlug;
    return canonical === target || labelSlug === target;
  });

  if (!entry || entry.people.size === 0) return notFound();

  const displayLabel = entry.meta.label;

  // Quick lookup for slug -> AlumniRow
  const bySlug = new Map(alumni.map((a) => [a.slug, a]));

  // Only Designers has subcategories; everyone else is a flat grid
  const isDesigners = entry.meta.key === "designers";

  const flatSelected = !isDesigners
    ? alumni
        .filter((a) => entry.people.has(a.slug))
        .sort((a, b) => a.name.localeCompare(b.name))
    : [];

  const designerGroups =
    isDesigners && entry.subcats
      ? Array.from(entry.subcats.entries())
          .map(([lcSubcat, slugs]) => {
            const title = titleCase(lcSubcat);
            const people = Array.from(slugs)
              .map((s) => bySlug.get(s))
              .filter(Boolean)
              .sort((a, b) =>
                (a!.name || "").localeCompare(b!.name || "")
              ) as AlumniRow[];
            return { title, people };
          })
          .sort((a, b) => a.title.localeCompare(b.title))
      : null;

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
            Celebrating our incredible {humanizeSlug(slug).toLowerCase()}
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
            {designerGroups ? (
              <div style={{ display: "grid", gap: "2.5rem" }}>
                {designerGroups.map((group) => (
                  <section key={group.title}>
                    <h4
                      style={{
                        fontFamily:
                          "var(--font-space-grotesk), system-ui, sans-serif",
                        fontSize: "1.9rem",
                        fontWeight: 500,
                        color: "#D9A919",
                        margin: "0 0 1rem",
                        backgroundColor: "#241123",
                        opacity: 0.6,
                        padding: "0.1em 0.5em",
                        borderRadius: "0.3em",
                        display: "inline-block",
                      }}
                    >
                      {group.title} Designers
                    </h4>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fill, minmax(140px, 1fr))",
                        gap: "1rem",
                        justifyItems: "center",
                      }}
                    >
                      {group.people.map((artist) => (
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
                  </section>
                ))}
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                  gap: "1rem",
                  justifyItems: "center",
                }}
              >
                {flatSelected.map((artist) => (
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
            )}
          </div>
        </div>

        {/* NAV GRID */}
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
            Explore More Titles
          </h3>

          <div
            style={{
              background: "rgba(36, 17, 35, 0.2)",
              borderRadius: "8px",
              padding: "2rem",
            }}
          >
            <TitlesGrid alumni={alumni} />
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
            marginBottom: "-2rem", // ✅ tuck into footer like /role
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
