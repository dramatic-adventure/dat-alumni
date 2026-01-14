// app/season/[season]/page.tsx
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { productionMap } from "@/lib/productionMap";
import { programMap } from "@/lib/programMap";
import { loadVisibleAlumni } from "@/lib/loadAlumni";
import type { AlumniRow } from "@/lib/types";
import MiniProfileCard from "@/components/profile/MiniProfileCard";
import SeasonsCarouselAlt from "@/components/alumni/SeasonsCarouselAlt";
import Collapsible from "@/components/ui/Collapsible";
import { seasons } from "@/lib/seasonData";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { promises as fs } from "fs";
import path from "path";

/** local helper: normalize for slug keys */
function normSlugKey(s: string) {
  return (s || "").trim().toLowerCase();
}

/** Build alias->canonical map from alumni list */
function buildAliasToCanonical(alumni: AlumniRow[]) {
  const map = new Map<string, string>();

  const add = (alias: unknown, canonical: string) => {
    const a = normSlugKey(String(alias || ""));
    if (!a) return;
    map.set(a, canonical);
  };

  for (const alum of alumni) {
    const canonical = normSlugKey(alum.slug);
    if (!canonical) continue;

    add(alum.slug, canonical);

    const slugAliases =
      (alum as any).slugAliases ||
      (alum as any).aliasSlugs ||
      (alum as any).aliases ||
      [];

    if (Array.isArray(slugAliases)) {
      for (const a of slugAliases) add(a, canonical);
    }
  }

  return map;
}

/**
 * Given a Record<artistSlug, roles[]>, return a deduped list by canonical slug.
 * - resolves legacy/alias slugs to canonical
 * - merges roles from multiple alias keys
 */
function resolveArtists(
  artists: Record<string, string[]> | undefined,
  aliasToCanonical: Map<string, string>
) {
  const out = new Map<string, { keySlug: string; roles: Set<string> }>();
  if (!artists) return out;

  for (const rawSlug of Object.keys(artists)) {
    const key = normSlugKey(rawSlug);
    const canonical = aliasToCanonical.get(key) || key;

    if (!out.has(canonical)) {
      out.set(canonical, { keySlug: canonical, roles: new Set<string>() });
    }

    const roles = artists[rawSlug] || [];
    const bucket = out.get(canonical)!;
    roles.forEach((r) => {
      const v = (r || "").trim();
      if (v) bucket.roles.add(v);
    });
  }

  return out;
}

// Pre-generate all season pages (/season/1, /season/2, ...)
export async function generateStaticParams() {
  return seasons.map((_, i) => ({ season: `${i + 1}` }));
}

export async function generateMetadata(
  { params }: { params: { season: string } }
): Promise<Metadata> {
  const { season } = params;
  const n = Number(season);
  const info = Number.isFinite(n) ? seasons.find((s) => s.slug === `season-${n}`) : undefined;

  const title = info ? `${info.seasonTitle} — DAT` : `Season ${season} — DAT`;
  const description = info
    ? `Explore programs and productions from ${info.seasonTitle} (${info.years}).`
    : "Explore DAT seasons.";

  return { title, description };
}

export default async function SeasonPage(
  { params }: { params: { season: string } }
) {
  const { season } = params;

  const seasonNumber = parseInt(season, 10);
  if (!Number.isFinite(seasonNumber) || seasonNumber <= 0) {
    return <div className="p-10 text-center text-red-600">Invalid season</div>;
  }

  const seasonInfo = seasons.find((s) => s.slug === `season-${seasonNumber}`);
  if (!seasonInfo) {
    return <div className="p-10 text-center text-gray-500">Season not found</div>;
  }

  // Group data
  const programs = Object.values(programMap).filter((p) => p.season === seasonNumber);
  const productions = Object.values(productionMap).filter((p) => p.season === seasonNumber);

  // Visible alumni only
  const alumni = (await loadVisibleAlumni()) as AlumniRow[];

  // Canonical alumni map
  const alumniMap = alumni.reduce<Record<string, AlumniRow>>((acc, alum) => {
    acc[normSlugKey(alum.slug)] = alum;
    return acc;
  }, {});

  // Alias -> Canonical slug
  const aliasToCanonical = buildAliasToCanonical(alumni);

  // Festivals -> productions
  const productionsByFestival: Record<string, typeof productions> = {};
  for (const prod of productions) {
    const key = prod.festival || "Other Productions";
    (productionsByFestival[key] ||= []).push(prod);
  }

  // Programs grouped by label
  const programsByGroup: Record<string, typeof programs> = {};
  for (const program of programs) {
    const key = `${program.program ?? "Other"}: ${program.location ?? "Unknown"} ${program.year ?? "Unknown"}`;
    (programsByGroup[key] ||= []).push(program);
  }

  // SERVER-SIDE HERO IMAGE CHECK
  const heroFilename = `season-${seasonNumber}.jpg`;
  const heroFsPath = path.join(process.cwd(), "public", "seasons", heroFilename);

  let finalHeroSrc = `/seasons/${heroFilename}`;
  try {
    await fs.access(heroFsPath);
  } catch {
    finalHeroSrc = "/seasons/season-fallback.jpg";
  }

  return (
    <div>
      {/* HERO */}
      <div
        style={{
          position: "relative",
          height: "95vh",
          overflow: "hidden",
          zIndex: 0,
          boxShadow: "0 0 33px rgba(0, 0, 0, 0.5)",
          background: "linear-gradient(180deg, rgba(0,0,0,.25), rgba(0,0,0,.6))",
        }}
      >
        <Image
          src={finalHeroSrc}
          alt={`${seasonInfo.seasonTitle} Hero`}
          fill
          priority
          className="object-cover object-center"
        />
        <div style={{ position: "absolute", bottom: "1rem", right: "5%" }}>
          <h1
            style={{
              fontFamily: "var(--font-anton), system-ui, sans-serif",
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
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
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

      {/* MAIN */}
      <main
        style={{
          marginTop: "-5rem",
          padding: "4rem 0 2rem",
          position: "relative",
          opacity: 0.9,
          zIndex: 10,
        }}
      >
        <div style={{ width: "90%", margin: "0 auto" }}>
          {/* PROGRAMS */}
          {programs.length > 0 && (
            <Collapsible title="Programs" defaultOpen={false}>
              {Object.entries(programsByGroup).map(([label, group]) => (
                <div key={label}>
                  <h3 style={{ margin: "3rem 0 1rem" }}>
                    {renderMaybeLink(group[0].url, label, "program-link")}
                  </h3>

                  {group.map((program) => {
                    // ✅ Resolve + dedupe artists via alias map
                    const resolved = resolveArtists(program.artists, aliasToCanonical);
                    const canonicalSlugs = Array.from(resolved.keys()).sort();

                    return (
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
                          {canonicalSlugs.map((canon) => {
                            const alum = alumniMap[canon];
                            if (!alum) return null;

                            const roles = Array.from(resolved.get(canon)!.roles).join(", ");

                            return (
                              <MiniProfileCard
                                key={canon}
                                name={alum.name}
                                role={roles}
                                slug={alum.slug} // ✅ canonical
                                headshotUrl={alum.headshotUrl}
                              />
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </Collapsible>
          )}

          {/* PRODUCTIONS */}
          {productions.length > 0 && (
            <Collapsible title="Productions" defaultOpen={false}>
              {Object.keys(productionsByFestival)
                .sort((a, b) => a.localeCompare(b))
                .map((festival) => (
                  <div key={festival}>
                    <h3
                      style={{
                        fontFamily: "var(--font-anton), system-ui, sans-serif",
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

                    {productionsByFestival[festival]
                      .slice()
                      .sort((a, b) => a.title.localeCompare(b.title))
                      .map((prod) => {
                        const resolved = resolveArtists(prod.artists, aliasToCanonical);
                        const canonicalSlugs = Array.from(resolved.keys()).sort();

                        return (
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
                            {renderMaybeLink(prod.url, prod.title, "production-link")}

                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                                gap: "1rem",
                                justifyItems: "center",
                                marginTop: "1rem",
                              }}
                            >
                              {canonicalSlugs.map((canon) => {
                                const alum = alumniMap[canon];
                                if (!alum) return null;

                                const roles = Array.from(resolved.get(canon)!.roles).join(", ");

                                return (
                                  <MiniProfileCard
                                    key={canon}
                                    name={alum.name}
                                    role={roles}
                                    slug={alum.slug} // ✅ canonical
                                    headshotUrl={alum.headshotUrl}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ))}
            </Collapsible>
          )}
        </div>

        {/* SEASON NAV */}
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

      {/* STYLES */}
      <style>{`
        a { text-decoration: none; }

        .explore-alumni-btn {
          font-family: var(--font-rock-salt), system-ui, sans-serif;
          font-size: 1.8rem;
          color: #241123 !important;
          opacity: 0.9;
          transition: color 0.3s ease;
          text-decoration: none !important;
        }
        .explore-alumni-btn:hover { color: #FFCC00 !important; opacity: 0.9 }

        .program-link, .production-link { cursor: pointer; text-decoration: none !important; }

        .program-link {
          font-family: var(--font-anton), system-ui, sans-serif;
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
        }
        .program-link:hover { color: #6C00AF !important; letter-spacing: 0.4rem; }

        .production-link {
          font-family: var(--font-space-grotesk), system-ui, sans-serif;
          font-size: 1.9rem;
          font-weight: 500;
          color: #D9A919 !important;
          display: inline-block;
          margin: 0 0 1rem;
          transition: letter-spacing 0.3s ease, color 0.3s ease;
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

function renderMaybeLink(href: string | undefined, label: string, className: string) {
  if (!href) return <span className={className}>{label}</span>;
  const isInternal = href.startsWith("/");
  return isInternal ? (
    <Link href={href} prefetch className={className}>
      {label}
    </Link>
  ) : (
    <a href={href} className={className} target="_blank" rel="noopener noreferrer">
      {label}
    </a>
  );
}
