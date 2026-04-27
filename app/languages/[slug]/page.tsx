// app/languages/[slug]/page.tsx

import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { loadVisibleAlumni } from "@/lib/loadAlumni";
import { loadRoleAssignments } from "@/lib/loadRoleAssignments";
import { getPrimaryDatRoleForProfile } from "@/lib/profileRoleAssignments";
import type { AlumniRow } from "@/lib/types";
import MiniProfileCard from "@/components/profile/MiniProfileCard";
import SeasonsCarouselAlt from "@/components/alumni/SeasonsCarouselAlt";
import { parseLanguages, buildLanguageSummaries } from "@/lib/languages";

export const revalidate = 3600;

type RouteParams = Promise<{ slug: string }>;

function norm(v: unknown) {
  return String(v ?? "").trim().toLowerCase();
}

export async function generateStaticParams() {
  const alumni = await loadVisibleAlumni();
  const summaries = buildLanguageSummaries(alumni.map((a) => a.languages));
  return summaries.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: RouteParams;
}): Promise<Metadata> {
  const { slug } = await params;
  const alumni = await loadVisibleAlumni();
  const summaries = buildLanguageSummaries(alumni.map((a) => a.languages));
  const lang = summaries.find((l) => l.slug === norm(slug));
  const name = lang?.name ?? slug;

  const title = `${name} — DAT Alumni by Language`;
  const description = `DAT alumni who speak ${name}.`;

  return {
    title,
    description,
    alternates: { canonical: `/languages/${slug}` },
    openGraph: { title, description, url: `/languages/${slug}`, type: "website" },
    twitter: { card: "summary", title, description },
  };
}

export default async function LanguageDetailPage({
  params,
}: {
  params: RouteParams;
}) {
  const { slug } = await params;
  const slugLower = norm(slug);

  const [alumni, roleAssignments] = await Promise.all([
    loadVisibleAlumni(),
    loadRoleAssignments(),
  ]);

  const primaryRoleBySlug: Record<string, string> = Object.fromEntries(
    alumni.map((a) => [
      a.slug,
      getPrimaryDatRoleForProfile(a.slug, a.roles || [], roleAssignments),
    ])
  );

  const summaries = buildLanguageSummaries(alumni.map((a) => a.languages));
  const langSummary = summaries.find((l) => l.slug === slugLower);
  if (!langSummary) notFound();

  type ArtistWithLevel = { artist: AlumniRow; level?: string };

  const artistsWithLevel: ArtistWithLevel[] = [];
  for (const artist of alumni) {
    const langs = parseLanguages(artist.languages);
    const match = langs.find((l) => l.slug === slugLower);
    if (match) {
      artistsWithLevel.push({ artist, level: match.level });
    }
  }

  const levelOrder: Record<string, number> = {
    Native: 0,
    Fluent: 1,
    Advanced: 2,
    Intermediate: 3,
    Beginner: 4,
  };

  artistsWithLevel.sort((a, b) => {
    const aOrder = a.level ? (levelOrder[a.level] ?? 5) : 6;
    const bOrder = b.level ? (levelOrder[b.level] ?? 5) : 6;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return (a.artist.name ?? "").localeCompare(b.artist.name ?? "");
  });

  const langName = langSummary.name;

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
          alt={`${langName} — Language Hero`}
          fill
          priority
          className="object-cover object-center"
        />
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
            {langName}
          </h1>
          <p
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "1.5rem",
              color: "#f2f2f2",
              opacity: 0.72,
              margin: 0,
              textShadow: "0 4px 9px rgba(0,0,0,0.9)",
              textAlign: "right",
            }}
          >
            Artists and alumni who create, collaborate, teach, or connect in {langName}.
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
          {/* Breadcrumb */}
          <p
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "0.78rem",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              fontWeight: 600,
              color: "#f2f2f2",
              opacity: 0.6,
              margin: "0 0 1.5rem",
            }}
          >
            <Link
              href="/languages"
              style={{ color: "inherit", textDecoration: "none" }}
            >
              Languages
            </Link>
            {" / "}
            {langName}
            <span style={{ opacity: 0.55, fontWeight: 400, marginLeft: "0.75rem" }}>
              {artistsWithLevel.length}{" "}
              {artistsWithLevel.length === 1 ? "artist" : "artists"}
            </span>
          </p>

          <div
            style={{
              background: "rgba(36, 17, 35, 0.18)",
              borderRadius: "12px",
              padding: "2rem",
            }}
          >
            {artistsWithLevel.length === 0 ? (
              <p
                style={{
                  color: "#f2f2f2aa",
                  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                }}
              >
                No artists found for this language.
              </p>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                  gap: "1rem",
                  justifyItems: "center",
                }}
              >
                {artistsWithLevel.map(({ artist, level }) => (
                  <MiniProfileCard
                    key={artist.slug}
                    alumniId={artist.slug}
                    name={artist.name ?? ""}
                    slug={artist.slug}
                    role={primaryRoleBySlug[artist.slug] ?? (artist.roles?.[0] ?? "")}
                    headshotUrl={artist.headshotUrl}
                    variant="dark"
                    viaLabel={level ? `Language level: ${level}` : undefined}
                    viaSource="label-only"
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Season nav */}
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
        a:hover { text-decoration: none; }
        @media (max-width: 900px) {
          main {
            margin-top: -3.5rem;
            padding-top: 5.5rem;
          }
        }
      `}</style>
    </div>
  );
}

