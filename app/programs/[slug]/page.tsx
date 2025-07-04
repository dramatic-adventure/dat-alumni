"use client";

import { programMap } from "@/lib/programMap";
import { notFound } from "next/navigation";
import Link from "next/link";

interface ProgramPageProps {
  params: {
    slug: string;
  };
}

export default function ProgramPage({ params }: ProgramPageProps) {
  const { slug } = params;

  const program = programMap[slug];

  if (!program) {
    return notFound();
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-4">{program.title}</h1>
      <p className="text-lg mb-6 text-gray-600">
        {program.program} — {program.location} — {program.year}
      </p>

      <h2 className="text-2xl font-semibold mb-2">Participating Artists</h2>
      <ul className="space-y-2">
        {Object.keys(program.artists).map((artistSlug) => (
          <li key={artistSlug}>
            <Link
              href={`/alumni/${artistSlug}`}
              className="text-[#6C00AF] hover:underline"
            >
              {artistSlug.replace(/-/g, " ")}
            </Link>{" "}
            — {program.artists[artistSlug].join(", ")}
          </li>
        ))}
      </ul>
    </main>
  );
}
