// app/role/[slug]/page.tsx

/**
 * 🔖 NOTE: This page is powered by `statusFlags`, not a literal `role` field.
 *
 * Even though this route lives under `/role/[slug]`, it filters artists using
 * the `statusFlags` array in the alumni data CSV (e.g., "Fellow", "Board Member").
 * These are status designations, not creative titles like "Actor" or "Director".
 *
 * We use the term "role" in the URL for readability, but internally this runs off
 * normalized status flags (canonicalized + slugified).
 *
 * ⚠️ Do not confuse this with `artist.role`, which refers to their creative title
 * and is used on the `/title/[slug]` route.
 */

import Image from "next/image";
import { notFound } from "next/navigation";
import { loadVisibleAlumni } from "@/lib/loadAlumni";
import { AlumniRow } from "@/lib/types";
import MiniProfileCard from "@/components/profile/MiniProfileCard";
import SeasonsCarouselAlt from "@/components/alumni/SeasonsCarouselAlt";
import RolesGrid from "@/components/alumni/RolesGrid";
import { pluralizeTitle } from "@/lib/pluralizeTitle";
import { getCanonicalFlag, slugifyFlag } from "@/lib/flags";

export const revalidate = 3600;

// ✅ Build all valid slugs from data (server-safe)
export async function generateStaticParams() {
  const alumni: AlumniRow[] = await loadVisibleAlumni();
  const slugs = new Set<string>();

  for (const artist of alumni) {
    for (const flag of artist.statusFlags ?? []) {
      const canonical = getCanonicalFlag(flag);
      if (canonical) slugs.add(slugifyFlag(canonical));
    }
  }

  return Array.from(slugs).map((slug) => ({ slug }));
}

export default async function RolePage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const alumni: AlumniRow[] = await loadVisibleAlumni();
  const slugLower = slug.toLowerCase();

  // Filter by status flag (canonicalized → slugified)
  const filtered = alumni.filter((artist) =>
    (artist.statusFlags ?? []).some((flag) => {
      const c = getCanonicalFlag(flag);
      return c ? slugifyFlag(c) === slugLower : false;
    })
  );

  if (!filtered.length) return notFound();

  // Compute nice display label from actual flags present, falling back to humanized slug
  const displayLabel =
    filtered
      .flatMap((a) => a.statusFlags ?? [])
      .map((f) => getCanonicalFlag(f))
      .find((c) => c && slugifyFlag(c) === slugLower) ??
    slug
      .split("-")
      .map((w) => w[0]?.toUpperCase() + w.slice(1))
      .join(" ");

  const pluralLabel = pluralizeTitle(displayLabel);

  return (
    <div>
      {/* ✅ HERO IMAGE */}
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
          src="/images/alumni hero.jpg"
          alt={`${pluralLabel} Hero`}
          fill
          priority
          className="object-cover object-center"
        />
        <div style={{ position: "absolute", bottom: "1rem", right: "5%" }}>
          <h1
            style={{
              fontFamily: "Anton, sans-serif",
              fontSize: "clamp(4rem, 9vw, 8rem)",
              color: "#f2f2f2",
              textTransform: "uppercase",
              textShadow: "0 8px 20px rgba(0,0,0,0.8)",
              margin: 0,
              lineHeight: "1",
            }}
          >
            {pluralLabel}
          </h1>
          <p
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "1.5rem",
              color: "#f2f2f2",
              opacity: 0.7,
              margin: 0,
              marginTop: "0rem",
              textShadow: "0 4px 9px rgba(0,0,0,0.9)",
              textAlign: "right",
            }}
          >
            Recognizing our incredible {pluralLabel.toLowerCase()}
          </p>
        </div>
      </div>

      {/* ✅ MAIN CONTENT */}
      <main
        style={{
          marginTop: "-5rem",
          backgroundImage: "url('/images/kraft-texture.png')",
          backgroundSize: "cover",
          backgroundRepeat: "repeat",
          padding: "8rem 0 2rem",
          position: "relative",
          opacity: 0.9,
          zIndex: 10,
        }}
      >
        <div style={{ width: "90%", margin: "0 auto" }}>
          <h3
            style={{
              fontFamily: "Anton, sans-serif",
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
            {pluralLabel}
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

{/* ✅ ROLES NAV GRID (dynamic, hides empty) */}
<section style={{ width: "90%", margin: "4rem auto 0" }}>
  <h3
    style={{
      fontFamily: "Anton, sans-serif",
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
    Explore More Roles
  </h3>

  <div
    style={{
      background: "rgba(36, 17, 35, 0.2)",
      borderRadius: "8px",
      padding: "2rem",
    }}
  >
    <RolesGrid alumni={alumni} />
  </div>
</section>




        {/* ✅ SEASON NAV */}
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
