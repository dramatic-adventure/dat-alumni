import Image from "next/image";
import Link from "next/link";
import { productionMap } from "@/lib/productionMap";
import { programMap } from "@/lib/programMap";
import { loadAlumni } from "@/lib/loadAlumni";
import MiniProfileCard from "@/components/profile/MiniProfileCard";
import Collapsible from "@/components/ui/Collapsible";
import SeasonsCarouselAlt from "@/components/alumni/SeasonsCarouselAlt";
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

  const programs = Object.values(programMap).filter((p) => p.season === seasonNumber);
  const productions = Object.values(productionMap).filter((p) => p.season === seasonNumber);

  const alumni = await loadAlumni();
  const alumniMap = alumni.reduce((acc: Record<string, any>, alum) => {
    acc[alum.slug] = alum;
    return acc;
  }, {});

  const productionsByFestival: Record<string, typeof productions> = {};
  productions.forEach((prod) => {
    const key = prod.festival || "Other Productions";
    if (!productionsByFestival[key]) productionsByFestival[key] = [];
    productionsByFestival[key].push(prod);
  });

  const heroImagePath = `/seasons/season-${seasonNumber}.jpg`;

  return (
    <div>
      {/* ✅ HERO SECTION */}
      <section
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "95vh",
          boxShadow: "0px 0px 33px rgba(0,0,0,0.5)",
          zIndex: 0,
        }}
      >
        <Image
          src={heroImagePath}
          alt={`${seasonInfo.seasonTitle} Hero`}
          fill
          priority
          className="object-cover object-center"
        />
        <div style={{ position: "absolute", bottom: "1rem", right: "5%" }}>
          <h1
            style={{
              fontFamily: "Anton, sans-serif",
              fontSize: "clamp(3rem, 7vw, 8rem)",
              color: "#FFCC00",
              textTransform: "uppercase",
              textShadow: "0 8px 20px rgba(0,0,0,0.8)",
              margin: 0,
            }}
          >
            {seasonInfo.seasonTitle}
          </h1>
          <p
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "1.8rem",
              color: "#F23359",
              margin: 0,
            }}
          >
            {seasonInfo.years}
          </p>
        </div>
      </section>

      {/* ✅ MAIN CONTENT */}
      <main
        style={{
          marginTop: "-750px", // parallax effect
          backgroundImage: "url('/images/kraft-texture.png')",
          backgroundSize: "cover",
          backgroundRepeat: "repeat",
          padding: "2rem 0",
          position: "relative",
          zIndex: 10,
        }}
      >
        <div style={{ width: "90%", maxWidth: "1200px", margin: "0 auto" }}>
          {/* Explore More Alumni Button */}
          <div style={{ textAlign: "right", marginBottom: "2rem" }}>
            <Link href="/alumni" className="explore-alumni-btn">
              ← Explore More Alumni
            </Link>
          </div>

          {/* ✅ PROGRAMS */}
          {programs.length > 0 && (
            <Collapsible title="Programs" defaultOpen={false}>
              {programs.map((program) => (
                <div
                  key={program.slug}
                  style={{
                    textAlign: "left",
                    marginBottom: "3rem",
                    background: "rgba(36, 17, 35, 0.2)", // DAT Dark Purple @ 20%
                    borderRadius: "8px",
                    padding: "1.5rem",
                  }}
                >
                  {program.url ? (
  <Link href={program.url} className="program-link">
    {program.title}
  </Link>
) : (
  <span className="program-link">{program.title}</span>
)}

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                      gap: "1rem",
                      justifyItems: "center",
                      marginTop: "1rem",
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
              ))}
            </Collapsible>
          )}

          {/* ✅ PRODUCTIONS */}
          {Object.keys(productionsByFestival).length > 0 && (
            <Collapsible title="Productions" defaultOpen={false}>
              {Object.keys(productionsByFestival).map((festival) => (
                <Collapsible key={festival} title={festival} defaultOpen={false} level={3}>
                  {productionsByFestival[festival].map((prod) => (
                    <div
                      key={prod.slug}
                      style={{
                        textAlign: "left",
                        marginBottom: "3rem",
                        background: "rgba(36, 17, 35, 0.2)", // DAT Dark Purple @ 20%
                        borderRadius: "8px",
                        padding: "1.5rem",
                      }}
                    >
                      {prod.url ? (
  <Link href={prod.url} className="production-link">
    {prod.title}
  </Link>
) : (
  <span className="production-link">{prod.title}</span>
)}

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                          gap: "1rem",
                          justifyItems: "center",
                          marginTop: "1rem",
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
          )}
        </div>

        {/* ✅ SEASONS CAROUSEL */}
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

      {/* ✅ STYLES */}
      <style>{`
        a { text-decoration: none; }

        .explore-alumni-btn {
          font-family: 'Rock Salt', cursive;
          font-size: 1.8rem;
          color: #241123 !important;
          opacity: 0.9;
          transition: color 0.3s ease;
          text-decoration: none !important;
        }
        .explore-alumni-btn:hover { color: #FFCC00 !important; opacity: 0.9}

        .program-link {
          font-family: "Space Grotesk", sans-serif;
          font-size: 2.2rem;
          font-weight: 600;
          color: #D9A919 !important;
          display: inline-block;
          margin: 0 0 1rem;
          transition: letter-spacing 0.3s ease, color 0.3s ease;
          text-decoration: none !important;
        }
        .program-link:hover { color: #6C00AF !important; letter-spacing: 2px; }

        .production-link {
          font-family: "Space Grotesk", sans-serif;
          font-size: 1.9rem;
          font-weight: 500;
          color: #D9A919 !important;
          display: inline-block;
          margin: 0 0 1rem;
          transition: letter-spacing 0.3s ease, color 0.3s ease;
          text-decoration: none !important;
        }
        .production-link:hover { color: #6C00AF !important; letter-spacing: 2px; }

        h3 { color: #FFCC00; }
      `}</style>
    </div>
  );
}

export async function generateStaticParams() {
  return seasons.map((_, i) => ({ season: `${i + 1}` }));
}
