import { loadAlumni } from "@/lib/loadAlumni";
import { AlumniRow } from "@/lib/types";
import MiniProfileCard from "@/components/profile/MiniProfileCard";
import { notFound } from "next/navigation";

interface LocationPageProps {
  params: {
    slug: string;
  };
}

export default async function LocationPage({ params }: LocationPageProps) {
  const { slug } = params;

  // Convert slug back to readable location name
  const locationName = slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const alumni: AlumniRow[] = await loadAlumni();

  // Filter alumni based on slugified location match
  const artistsInLocation = alumni.filter((a) =>
    a.location?.toLowerCase().replace(/\s+/g, "-") === slug
  );

  if (!artistsInLocation.length) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-6">
          DAT Artists Based in {locationName}
        </h1>
        <p className="text-gray-600 italic">
          No artists currently listed in this location.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold mb-6">
        DAT Artists Based in {locationName}
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {artistsInLocation.map((artist) => (
          <MiniProfileCard key={artist.slug} {...artist} />
        ))}
      </div>
    </div>
  );
}
