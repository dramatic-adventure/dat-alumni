// app/languages/[slug]/page.tsx

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { loadVisibleAlumni } from "@/lib/loadAlumni";
import { loadRoleAssignments } from "@/lib/loadRoleAssignments";
import { getPrimaryDatRoleForProfile } from "@/lib/profileRoleAssignments";
import type { AlumniRow } from "@/lib/types";
import MiniProfileCard from "@/components/profile/MiniProfileCard";
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

  // Find which language name this slug corresponds to
  const summaries = buildLanguageSummaries(alumni.map((a) => a.languages));
  const langSummary = summaries.find((l) => l.slug === slugLower);
  if (!langSummary) notFound();

  // Collect artists who speak this language, along with their level
  type ArtistWithLevel = {
    artist: AlumniRow;
    level?: string;
  };

  const artistsWithLevel: ArtistWithLevel[] = [];
  for (const artist of alumni) {
    const langs = parseLanguages(artist.languages);
    const match = langs.find((l) => l.slug === slugLower);
    if (match) {
      artistsWithLevel.push({ artist, level: match.level });
    }
  }

  // Sort: by level priority (Native > Fluent > Advanced > Intermediate > Beginner > unknown), then by name
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
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#0e0b14",
        paddingBottom: "6rem",
      }}
    >
      {/* Hero */}
      <section
        style={{
          backgroundColor: "#2493A9",
          padding: "5rem 30px 4rem",
        }}
      >
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <p
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "0.78rem",
              textTransform: "uppercase",
              letterSpacing: "0.2rem",
              fontWeight: 600,
              color: "#F2f2f2",
              opacity: 0.85,
              margin: "0 0 1rem 0",
            }}
          >
            <Link
              href="/languages"
              style={{ color: "inherit", textDecoration: "none", opacity: 0.75 }}
            >
              Languages
            </Link>
            {" / "}
            {langName}
          </p>
          <h1
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 700,
              color: "#241123",
              margin: "0 0 0.5rem 0",
              lineHeight: 1.2,
            }}
          >
            {langName}
          </h1>
          <p
            style={{
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              fontSize: "1rem",
              color: "#241123aa",
              margin: 0,
            }}
          >
            {artistsWithLevel.length}{" "}
            {artistsWithLevel.length === 1 ? "artist" : "artists"}
          </p>
        </div>
      </section>

      {/* Artists grid */}
      <section style={{ padding: "4rem 30px 0", maxWidth: "1100px", margin: "0 auto" }}>
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
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: "1.25rem",
            }}
          >
            {artistsWithLevel.map(({ artist, level }) => (
              <MiniProfileCard
                key={artist.slug}
                name={artist.name ?? ""}
                slug={artist.slug}
                role={primaryRoleBySlug[artist.slug] ?? (artist.roles?.[0] ?? "")}
                headshotUrl={artist.headshotUrl}
                variant="dark"
                viaLabel={level}
                viaSource="dat-role"
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
