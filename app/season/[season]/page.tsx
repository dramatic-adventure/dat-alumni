import Image from "next/image";
import Link from "next/link";
import { productionMap } from "@/lib/productionMap";
import { programMap } from "@/lib/programMap";
import { loadAlumni } from "@/lib/loadAlumni";
import MiniProfileCard from "@/components/profile/MiniProfileCard";
import Collapsible from "@/components/ui/Collapsible";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { seasons } from "@/lib/seasonData";

export const revalidate = 3600;

export default async function SeasonPage({ params }: { params: { season: string } }) {
  const seasonNumber = parseInt(params.season, 10);
  if (isNaN(seasonNumber)) {
    return <div className="p-10 text-center text-red-600">Invalid season</div>;
  }

  const seasonInfo = seasons.find((s) => s.slug === `season-${seasonNumber}`);
  if (!seasonInfo) {
    return <div className="p-10 text-center text-gray-500">Season not found</div>;
  }

  const maxSeason = seasons.length;

  // ✅ Filter programs & productions for this season
  const programs = Object.values(programMap).filter((p) => p.season === seasonNumber);
  const productions = Object.values(productionMap).filter((p) => p.season === seasonNumber);

  // ✅ Load alumni
  const alumni = await loadAlumni();
  const alumniMap = alumni.reduce((acc: Record<string, any>, alum) => {
    acc[alum.slug] = alum;
    return acc;
  }, {});

  // ✅ Group productions by festival
  const productionsByFestival: Record<string, typeof productions> = {};
  productions.forEach((prod) => {
    const key = prod.festival || "Other Productions";
    if (!productionsByFestival[key]) productionsByFestival[key] = [];
    productionsByFestival[key].push(prod);
  });

  const heroImagePath = `/seasons/season-${seasonNumber}.jpg`;
  const prevSeason = seasonNumber > 1 ? seasonNumber - 1 : null;
  const nextSeason = seasonNumber < maxSeason ? seasonNumber + 1 : null;

  return (
    <main
      className="px-6 py-10 max-w-7xl mx-auto"
      style={{
        backgroundImage: "url('/images/kraft-texture.png')",
        backgroundSize: "cover",
        backgroundRepeat: "repeat",
        minHeight: "100vh",
      }}
    >
      {/* Hero */}
      <div className="mb-6">
        <Image
          src={heroImagePath}
          alt={`${seasonInfo.seasonTitle} Hero`}
          width={1600}
          height={600}
          className="w-full h-96 object-cover rounded-lg shadow-lg"
        />
      </div>

      {/* Back to All Seasons */}
      <div className="mb-6 text-center">
        <Link
          href="/seasons"
          className="inline-block px-5 py-2 bg-[#FFCC00] text-[#241123] rounded-sm text-lg font-bold hover:scale-105 transition-transform"
          style={{ fontFamily: "'Rock Salt', cursive", textDecoration: "none" }}
        >
          ← Back to All Seasons
        </Link>
      </div>

      {/* Header */}
      <h1
        className="text-6xl text-[#241123] uppercase tracking-wider mb-2 text-center"
        style={{ fontFamily: "Anton" }}
      >
        {seasonInfo.seasonTitle}
      </h1>
      <h3
        className="text-2xl text-[#6C00AF] mb-8 text-center"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        {seasonInfo.years}
      </h3>

      {/* PROGRAMS */}
      <Collapsible title="Programs" defaultOpen>
        {programs.length > 0 ? (
          programs.map((program) => (
            <div key={program.slug} className="mb-8">
              <Link
                href={program.url || "#"}
                className="text-2xl font-semibold text-[#6C00AF] hover:text-[#F23359] transition-colors"
                style={{ textDecoration: "none" }}
              >
                {program.title}
              </Link>
              <div
                className="grid gap-6 mt-4"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                }}
              >
                {Object.keys(program.artists).map((slug) => {
                  const alum = alumniMap[slug];
                  return alum ? (
                    <MiniProfileCard
                      key={slug}
                      name={alum.name}
                      role={program.artists[slug].join(", ")}
                      slug={alum.slug}
                      headshotUrl={alum.headshotUrl}
                    />
                  ) : null;
                })}
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No programs for this season.</p>
        )}
      </Collapsible>

      {/* PRODUCTIONS */}
      <Collapsible title="Productions" defaultOpen>
        {Object.keys(productionsByFestival).map((festival) => (
          <Collapsible key={festival} title={festival} defaultOpen level={3}>
            {productionsByFestival[festival].map((prod) => (
              <div key={prod.slug} className="mb-6">
                <Link
                  href={prod.url || "#"}
                  className="text-lg font-semibold text-[#FFCC00] hover:text-[#F23359] transition-colors"
                  style={{ textDecoration: "none" }}
                >
                  {prod.title}
                </Link>
                <div
                  className="grid gap-6 mt-3"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                  }}
                >
                  {Object.keys(prod.artists).map((slug) => {
                    const alum = alumniMap[slug];
                    return alum ? (
                      <MiniProfileCard
                        key={slug}
                        name={alum.name}
                        role={prod.artists[slug].join(", ")}
                        slug={alum.slug}
                        headshotUrl={alum.headshotUrl}
                      />
                    ) : null;
                  })}
                </div>
              </div>
            ))}
          </Collapsible>
        ))}
      </Collapsible>

      {/* Bottom Navigation */}
      <div className="flex justify-between items-center mt-12">
        {prevSeason ? (
          <Link
            href={`/season/${prevSeason}`}
            className="flex items-center gap-2 px-4 py-2 text-lg font-bold text-[#241123] hover:text-[#F23359] transition-colors"
            style={{ fontFamily: "'Rock Salt', cursive", textDecoration: "none" }}
          >
            <ChevronLeft size={24} />
            Season {prevSeason}
          </Link>
        ) : (
          <div />
        )}

        {nextSeason ? (
          <Link
            href={`/season/${nextSeason}`}
            className="flex items-center gap-2 px-4 py-2 text-lg font-bold text-[#241123] hover:text-[#F23359] transition-colors"
            style={{ fontFamily: "'Rock Salt', cursive", textDecoration: "none" }}
          >
            Season {nextSeason}
            <ChevronRight size={24} />
          </Link>
        ) : (
          <div />
        )}
      </div>
    </main>
  );
}

export async function generateStaticParams() {
  return Array.from({ length: seasons.length }, (_, i) => ({
    season: `${i + 1}`,
  }));
}
