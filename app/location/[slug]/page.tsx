// app/location/[slug]/page.tsx

/**
 * 📍 This page is powered by normalized location tokens, not a single `location` field.
 * Params are plain objects in Next 15 — do NOT type them as Promises.
 */

import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { loadVisibleAlumni } from "@/lib/loadAlumni";
import type { AlumniRow } from "@/lib/types";
import MiniProfileCard from "@/components/profile/MiniProfileCard";
import SeasonsCarouselAlt from "@/components/alumni/SeasonsCarouselAlt";
import LocationsGrid from "@/components/alumni/LocationsGrid";

import {
  slugifyLocation,
  getParentFor,
  resolveNearbyCenter,
  findNearbyAlumniByPoint,
  getLocationLinksForAlumni,
  unslugToCanonical,
  isKnownLocationSlug,
  getCenterForLabel,
} from "@/lib/locations";

export const revalidate = 3600;

// ✅ Build all valid slugs from data (server-safe)
export async function generateStaticParams() {
  const alumni: AlumniRow[] = await loadVisibleAlumni();
  const slugs = new Set<string>();

  for (const artist of alumni) {
    for (const l of getLocationLinksForAlumni(artist)) {
      slugs.add(slugifyLocation(l.label));
    }
  }

  return Array.from(slugs).map((slug) => ({ slug }));
}

// ✅ Helpful metadata
export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const slug = params?.slug ?? "";
  const canonical = unslugToCanonical(slug);
  const parent = getParentFor(canonical);
  const mainLabel = parent?.label ?? canonical;

  const title = `${mainLabel} — DAT Locations`;
  const description = `Artists based in and around ${mainLabel}.`;

  return {
    title,
    description,
    alternates: { canonical: `/location/${slug ?? ""}` },
    openGraph: {
      title,
      description,
      url: `/location/${slug ?? ""}`,
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function LocationPage(
  { params }: { params: { slug: string } }
) {
  const slug = params?.slug ?? "";
  const alumni: AlumniRow[] = await loadVisibleAlumni();

  const canonical = unslugToCanonical(slug);      // e.g., "Brooklyn, NYC" or "New York City"
  const parent = getParentFor(canonical);         // boroughs → { label: "New York City", slug: "new-york-city" }
  const mainLabel = parent?.label ?? canonical;   // show parent bucket if borough
  const mainSlug = slugifyLocation(typeof mainLabel === "string" ? mainLabel : "");

  // Main bucket (deduped via canonicalized links) — include boroughs when viewing NYC
  const artistsInLocation = alumni.filter((artist) =>
    getLocationLinksForAlumni(artist).some((l: { label: string; href: string }) => {
      return (
        slugifyLocation(l.label) === mainSlug || // exact label match
        getParentFor(l.label)?.label === mainLabel // borough → NYC (or other parent schemes)
      );
    })
  );

  // Nearby (≤ 2 hours), center on parent if borough; exclude main bucket
  const centerLabel = resolveNearbyCenter(canonical);
  const excludeSlugs = new Set<string>();
  if (mainLabel === "New York City") {
    ["new-york-city", "brooklyn-nyc", "queens-nyc", "bronx-nyc", "staten-island-nyc"].forEach(
      (s) => excludeSlugs.add(s)
    );
  } else {
    excludeSlugs.add(mainSlug);
  }

  // ✅ Use CSV lat/lng where available, or bucket centroid if not in LOCATION_COORDS
  const centerPoint = getCenterForLabel(centerLabel, alumni);
  const nearby = centerPoint
    ? findNearbyAlumniByPoint(centerPoint, alumni, {
        hours: 2,
        avgMph: 50,
        excludeSlugs,
      })
    : [];

  // If the slug isn't recognized and we have no results at all, 404
  if (!isKnownLocationSlug(slug) && artistsInLocation.length === 0 && nearby.length === 0) {
    return notFound();
  }

  const displayLabel = mainLabel;

  return (
    <div>
      {/* ✅ HERO IMAGE */}
      <div
        style={{
          position: "relative",
          height: "55vh",
          overflow: "hidden",
          zIndex: 0,
          boxShadow: "0 0 33px rgba(0, 0, 0, 0.5)",
        }}
      >
        <Image
          src="/images/alumni-hero.jpg"
          alt={`${displayLabel} Hero`}
          fill
          priority
          className="object-cover object-center"
        />
        <div style={{ position: "absolute", bottom: "1rem", right: "5%" }}>
          <h1
            style={{
              fontFamily: "var(--font-anton), system-ui, sans-serif",
              fontSize: "clamp(3.6rem, 9vw, 8rem)",
              color: "#f2f2f2",
              textTransform: "uppercase",
              textShadow: "0 8px 20px rgba(0,0,0,0.8)",
              margin: 0,
              lineHeight: "1",
            }}
          >
            {displayLabel}
          </h1>
          <p
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "1.5rem",
              color: "#f2f2f2",
              opacity: 0.7,
              margin: 0,
              marginTop: "0rem",
              textShadow: "0 4px 9px rgba(0,0,0,0.9)",
              textAlign: "right",
            }}
          >
            Artists based in and around{" "}
            {(typeof displayLabel === "string" ? displayLabel : "").replace(
              /\w\S*/g,
              (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
            )}
          </p>
        </div>
      </div>

      {/* ✅ MAIN CONTENT */}
      <main
        style={{
          marginTop: "-5rem",
          padding: "8rem 0 2rem",
          position: "relative",
          opacity: 0.9,
          zIndex: 10,
        }}
      >
        <div style={{ width: "90%", margin: "0 auto" }}>
          <h3
            style={{
              fontFamily: "var(--font-anton), system-ui, sans-serif",
              fontSize: "2.4rem",
              margin: "3.5rem 0 1.1rem",
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
            {displayLabel}
          </h3>

          {parent && (
            <p
              style={{
                fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                margin: "0 0 1rem",
                opacity: 0.8,
              }}
            >
              Showing <strong>{parent.label}</strong> results for <em>{canonical}</em>.
            </p>
          )}

          <div
            style={{
              background: "rgba(36, 17, 35, 0.2)",
              borderRadius: "8px",
              padding: "2rem",
            }}
          >
            {artistsInLocation.length > 0 ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                  gap: "1rem",
                  justifyItems: "center",
                }}
              >
                {artistsInLocation.map((artist) => (
                  <MiniProfileCard
                    key={artist.slug}
                    name={artist.name}
                    role={artist.role}
                    slug={artist.slug}
                    headshotUrl={artist.headshotUrl}
                  />
                ))}
              </div>
            ) : (
              <p className="text-gray-600 italic">No artists currently listed in this location.</p>
            )}
          </div>
        </div>

        {/* ✅ NEARBY */}
        {nearby.length > 0 && (
          <section style={{ width: "90%", margin: "4rem auto 0" }}>
            <h3
              style={{
                fontFamily: "var(--font-anton), system-ui, sans-serif",
                fontSize: "2.4rem",
                margin: "0rem 0 1.1rem",
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
              Other Nearby Artists <span style={{ opacity: 0.7 }}>(≤ 2 hours)</span>
            </h3>

            <div
              style={{
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
                }}
              >
                {nearby.map((n) => (
                  <MiniProfileCard
                    key={n.alum.slug}
                    name={n.alum.name}
                    role={n.alum.role}
                    slug={n.alum.slug}
                    headshotUrl={n.alum.headshotUrl}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ✅ LOCATIONS NAV GRID (dynamic, hides empty) */}
        <section style={{ width: "90%", margin: "4rem auto 0" }}>
          <h3
            style={{
              fontFamily: "var(--font-anton), system-ui, sans-serif",
              fontSize: "2.4rem",
              margin: "0rem 0 1.1rem",
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
            Explore More Locations
          </h3>

          <div
            style={{
              background: "rgba(36, 17, 35, 0.2)",
              borderRadius: "8px",
              padding: "2rem",
            }}
          >
            <LocationsGrid alumni={alumni} />
          </div>
        </section>

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

      <style>{`
        a { text-decoration: none; }
        h3 { color: #FFCC00; }
      `}</style>
    </div>
  );
}
