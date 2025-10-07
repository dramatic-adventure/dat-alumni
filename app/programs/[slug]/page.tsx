// app/programs/[slug]/page.tsx

import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { programMap } from "@/lib/programMap";

export const revalidate = 3600;

// Pre-generate all program pages
export function generateStaticParams() {
  return Object.keys(programMap).map((slug) => ({ slug }));
}

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const { slug } = params;
  const program = programMap[slug];

  if (!program) {
    return {
      title: "Program Not Found — Dramatic Adventure Theatre",
      description: "This program could not be found.",
      alternates: { canonical: `/programs/${slug}` },
    };
  }

  const { title, program: programName, location, year } = program;
  const description = `${programName} — ${location} — ${year}`;

  return {
    title: `${title} — DAT Programs`,
    description,
    alternates: { canonical: `/programs/${slug}` },
    openGraph: {
      title: `${title} — DAT Programs`,
      description,
      url: `/programs/${slug}`,
      type: "article",
    },
    twitter: {
      card: "summary",
      title: `${title} — DAT Programs`,
      description,
    },
  };
}

interface ProgramPageProps {
  params: { slug: string };
}

function titleCaseFromSlug(slug: string) {
  return slug
    .split("-")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
    .join(" ");
}

export default function ProgramPage({ params }: ProgramPageProps) {
  const { slug } = params;
  const program = programMap[slug];

  if (!program) return notFound();

  const { title, program: programName, location, year, artists } = program;

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <header className="mb-6">
        <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
        <p className="text-lg mt-2 text-gray-600">
          {programName} — {location} — {year}
        </p>
      </header>

      <section aria-labelledby="artists-heading">
        <h2 id="artists-heading" className="text-2xl font-semibold mb-3">
          Participating Artists
        </h2>

        <ul className="space-y-2">
          {Object.keys(artists).map((artistSlug) => {
            const roles = artists[artistSlug];
            return (
              <li key={artistSlug} className="leading-relaxed">
                <Link
                  href={`/alumni/${artistSlug}`}
                  prefetch
                  className="text-[#6C00AF] hover:underline font-medium"
                  aria-label={`View profile for ${titleCaseFromSlug(artistSlug)}`}
                >
                  {titleCaseFromSlug(artistSlug)}
                </Link>
                {roles?.length ? (
                  <span className="text-gray-600"> — {roles.join(", ")}</span>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
