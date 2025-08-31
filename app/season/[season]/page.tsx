import Image from "next/image";
import Link from "next/link";
import { productionMap } from "@/lib/productionMap";
import { programMap } from "@/lib/programMap";
import { loadAlumni } from "@/lib/loadAlumni";
import MiniProfileCard from "@/components/profile/MiniProfileCard";
import SeasonsCarouselAlt from "@/components/alumni/SeasonsCarouselAlt";
import Collapsible from "@/components/ui/Collapsible";
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

  const programsByGroup: Record<string, typeof programs> = {};
  programs.forEach((program) => {
    const key = `${program.program ?? "Other"}: ${program.location ?? "Unknown"} ${program.year ?? "Unknown"}`;
    if (!programsByGroup[key]) programsByGroup[key] = [];
    programsByGroup[key].push(program);
  });

  const heroImagePath = `/seasons/season-${seasonNumber}.jpg`;

  return (
    <div>
      {/* ✅ HERO */}
      <div
        style={{
          position: "relative",
          height: "95vh",
          overflow: "hidden",
          zIndex: 0,
          boxShadow: "0 0 33px rgba(0, 0, 0, 0.5)",
        }}
      >
        <Image
          src={heroImagePath}
          alt={`${seasonInfo.seasonTitle} Hero`}
          fill
          priority
          className="object-cover object-center"
          style={{ zIndex: -1 }}
        />
        <div style={{ position: "absolute", bottom: "1rem", right: "5%" }}>
          <h1
            style={{
              fontFamily: "Anton, sans-serif",
              fontSize: "clamp(3rem, 7vw, 8rem)",
              color: "#f2f2f2",
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
              color: "#f2f2f2",
              opacity: 0.7,
              margin: 0,
              textShadow: "0 4px 12px rgba(0,0,0,0.9)",
              textAlign: "right",
            }}
          >
            {seasonInfo.years}
          </p>
        </div>
      </div>

      {/* ✅ MAIN CONTENT */}
      <main
        style={{
          marginTop: "-5rem",
          backgroundImage: "url('/images/kraft-texture.png')",
          backgroundSize: "cover",
          backgroundRepeat: "repeat",
          padding: "4rem 0 2rem",
          position: "relative",
          opacity: 0.9,
          zIndex: 10,
        }}
      >
        <div style={{ width: "90%", margin: "0 auto" }}>
          {/* ✅ PROGRAMS */}
          {programs.length > 0 && (
            <Collapsible title="Programs" defaultOpen={false}>
              {Object.entries(programsByGroup).map(([label, group]) => (
                <div key={label}>
                  <h3 style={{ margin: "3rem 0 1rem" }}>
                    {group[0].url ? (
                      <Link href={group[0].url} className="program-link">
                        {label}
                      </Link>
                    ) : (
                      <span className="program-link">{label}</span>
                    )}
                  </h3>

                  {group.map((program) => (
                    <div
                      key={program.slug}
                      style={{
                        textAlign: "left",
                        marginBottom: "3rem",
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
                </div>
              ))}
            </Collapsible>
          )}

          {/* ✅ PRODUCTIONS */}
          {productions.length > 0 && (
            <Collapsible title="Productions" defaultOpen={false}>
              {Object.keys(productionsByFestival).map((festival) => (
                <div key={festival}>
                  <h3
                    style={{
                      fontFamily: "Anton, sans-serif",
                      fontSize: "2.4rem",
                      margin: "2.5rem 0rem 1rem",
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
                    {festival}
                  </h3>

                  {productionsByFestival[festival].map((prod) => (
                    <div
                      key={prod.slug}
                      style={{
                        textAlign: "left",
                        marginBottom: "3rem",
                        background: "rgba(36, 17, 35, 0.2)",
                        borderRadius: "8px",
                        padding: "2rem",
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
                </div>
              ))}
            </Collapsible>
          )}
        </div>

        {/* ✅ SEASON NAV */}
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

        .program-link, .production-link {
  cursor: pointer;
  text-decoration: none !important;
}


        .explore-alumni-btn:hover { color: #FFCC00 !important; opacity: 0.9 }

        .program-link {
  font-family: "Anton", sans-serif;
  font-size: 2.4rem;
  text-transform: uppercase;
  color: #241123;
  display: inline-block;
  margin: 0rem 0rem 0.15rem;
  letter-spacing: 0.2rem;
  background-color: #FFCC00;
  opacity: 0.6;
  padding: 0.1em 0.5em;
  border-radius: 0.3em;
  transition: color 0.3s ease, letter-spacing 0.3s ease;
  text-decoration: none !important;
}

.program-link:hover {
  color: #6C00AF !important;
  letter-spacing: 0.4rem;
}


        .production-link {
          font-family: "Space Grotesk", sans-serif;
          font-size: 1.9rem;
          font-weight: 500;
          color: #D9A919 !important;
          display: inline-block;
          margin: 0 0 1rem;
          transition: letter-spacing 0.3s ease, color 0.3s ease;
          text-decoration: none !important;
            background-color: #241123;
  opacity: 0.6;
  padding: 0.1em 0.5em;
  border-radius: 0.3em;
        }
        .production-link:hover { color: #FFCC00 !important; letter-spacing: 2px; }

        h3 { color: #FFCC00; }
      `}</style>
    </div>
  );
}

export async function generateStaticParams() {
  return seasons.map((_, i) => ({ season: `${i + 1}` }));
}
