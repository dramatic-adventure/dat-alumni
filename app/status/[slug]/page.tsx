// app/status/[slug]/page.tsx

import { notFound } from "next/navigation";
import { loadVisibleAlumni } from "@/lib/loadAlumni";
import { AlumniRow } from "@/lib/types";
import MiniProfileCard from "@/components/profile/MiniProfileCard";

interface PageProps {
  params: {
    slug: string;
  };
}

export default async function StatusPage({ params }: PageProps) {
  const { slug } = params;
  const alumni: AlumniRow[] = await loadVisibleAlumni();

  const filtered = alumni.filter((artist) =>
    artist.statusFlags?.some(
      (flag) => flag.trim().toLowerCase() === slug.toLowerCase()
    )
  );

  if (!filtered.length) return notFound();

  const title = slug
    .split("-")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="text-5xl font-bold text-[#241123] mb-8">{title}s</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
  );
}
