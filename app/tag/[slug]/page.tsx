import Image from "next/image";
import { notFound } from "next/navigation";
import { loadVisibleAlumni } from "@/lib/loadAlumni";
import { AlumniRow } from "@/lib/types";
import MiniProfileCard from "@/components/profile/MiniProfileCard";
import SeasonsCarouselAlt from "@/components/alumni/SeasonsCarouselAlt";
import TagsGrid from "@/components/alumni/TagsGrid";
import { getCanonicalTag, slugifyTag } from "@/lib/tags";

export const revalidate = 3600;

// ✅ Build all valid tag slugs from data (server-safe)
export async function generateStaticParams() {
  const alumni: AlumniRow[] = await loadVisibleAlumni();
  const slugs = new Set<string>();

  for (const artist of alumni) {
    for (const tag of artist.identityTags ?? []) {
      const canonical = getCanonicalTag(tag);
      if (canonical) slugs.add(slugifyTag(canonical));
    }
  }

  return Array.from(slugs).map((slug) => ({ slug }));
}

export default async function TagPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const alumni: AlumniRow[] = await loadVisibleAlumni();
  const slugLower = slug.toLowerCase();

  // ✅ Filter by tag (canonicalized → slugified)
  const filtered = alumni.filter((artist) =>
    (artist.identityTags ?? []).some((tag) => {
      const c = getCanonicalTag(tag);
      return c ? slugifyTag(c) === slugLower : false;
    })
  );

  if (!filtered.length) return notFound();

  // ✅ Compute nice display label from actual tags present; fallback to humanized slug
  const displayLabel =
    filtered
      .flatMap((a) => a.identityTags ?? [])
      .map((t: string) => getCanonicalTag(t))
      .find((c) => c && slugifyTag(c) === slugLower) ??
    slug
      .split("-")
      .map((w) => w[0]?.toUpperCase() + w.slice(1))
      .join(" ");

  return (
    <div>
      {/* ✅ HERO IMAGE (mirrors RolePage) */}
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
          alt={`${displayLabel} Hero`}
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
            {displayLabel}
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
            Artists tagged as {displayLabel.toLowerCase()}
          </p>
        </div>
      </div>

      {/* ✅ MAIN CONTENT (mirrors RolePage) */}
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

        {/* ✅ TAGS NAV GRID (dynamic, hides empty) */}
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

        {/* ✅ SEASON NAV (kept for parity with RolePage) */}
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
