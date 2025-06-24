// app/location/[slug]/page.tsx

import { loadAlumni } from "@/lib/loadAlumni";
import { AlumniRow } from "@/lib/types";
import MiniProfileCard from "@/components/profile/MiniProfileCard"; // Adjust if different
import { notFound } from "next/navigation";

interface LocationPageProps {
  params: {
    slug: string;
  };
}

export default async function LocationPage({ params }: LocationPageProps) {
  const { slug } = params;

  const locationName = slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const alumni: AlumniRow[] = await loadAlumni();

  // Match based on slugified version of location
  const artistsInLocation = alumni.filter((a) =>
    a.location?.toLowerCase().replace(/\s+/g, "-") === slug
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-6">
        DAT Artists Based in {locationName}
      </h1>

      {artistsInLocation.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {artistsInLocation.map((artist) => (
            <MiniProfileCard key={artist.slug} {...artist} />
          ))}
        </div>
      ) : (
        <p className="text-gray-600 italic">
          No artists currently listed in this location.
        </p>
      )}
    </div>
  );
}
