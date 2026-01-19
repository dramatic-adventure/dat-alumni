// /components/alumni/AlumniPage.tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import SeasonsCarouselAlt from "@/components/alumni/SeasonsCarouselAlt";
import FeaturedAlumni from "@/components/alumni/FeaturedAlumni";
import AlumniSearch from "@/components/alumni/AlumniSearch/AlumniSearch";
import MiniProfileCard from "@/components/profile/MiniProfileCard";
import type { ProfileLiveRow } from "@/components/alumni/AlumniSearch/profileLiveTypes";
import type { EnrichedProfileLiveRow } from "@/components/alumni/AlumniSearch/enrichAlumniData.server";

const UpdatesPanel = dynamic(() => import("@/components/shared/UpdatesPanel"), {
  ssr: false,
  loading: () => (
    <div
      className="updates-placeholder"
      style={{
        minHeight: "450px",
        background: "rgba(108, 0, 175, 0.05)",
        borderRadius: "8px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
        fontWeight: 600,
        color: "#f2f2f2",
        opacity: 0.8,
      }}
    >
      Loading updates...
    </div>
  ),
});

type AlumniItem = { name: string; slug: string; roles?: string[]; headshotUrl?: string };
type UpdateItem = { text: string; link?: string; author?: string };

function rolesToArray(v?: string) {
  return String(v || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function AlumniPage({
  highlights,
  alumniData,
  initialUpdates,
  enrichedData,
}: {
  highlights: { name: string; roles?: string[]; slug: string; headshotUrl?: string }[];
  alumniData: AlumniItem[];
  initialUpdates: UpdateItem[];
  enrichedData: EnrichedProfileLiveRow[]; // ✅ required because AlumniSearch expects it
}) {
  const [updates, setUpdates] = useState<UpdateItem[]>(initialUpdates || []);
  const [data, setData] = useState<AlumniItem[]>(alumniData || []);

  // ✅ Search results are ProfileLiveRow[] now
  const [primaryResults, setPrimaryResults] = useState<ProfileLiveRow[]>([]);
  const [secondaryResults, setSecondaryResults] = useState<ProfileLiveRow[]>([]);
  const [query, setQuery] = useState<string>("");

  useEffect(() => {
    setData(alumniData || []);
    setUpdates(initialUpdates || []);
  }, [alumniData, initialUpdates]);

  return (
    <div>
      {/* HERO */}
      <section
        style={{
          position: "relative",
          width: "100%",
          height: "55vh",
          boxShadow: "0px 0px 33px rgba(0,0,0,0.5)",
          zIndex: 1,
        }}
      >
        <Image
          src="/images/alumni-hero.jpg"
          alt="Alumni Hero"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div style={{ position: "absolute", bottom: "1rem", right: "5%" }}>
          <h1
            style={{
              fontFamily: "var(--font-anton), system-ui, sans-serif",
              fontSize: "clamp(4rem, 9vw, 10rem)",
              color: "#f2f2f2",
              textTransform: "uppercase",
              textShadow: "0 8px 20px rgba(0,0,0,0.8)",
              margin: 0,
            }}
          >
            ALUMNI
          </h1>
        </div>
      </section>

      <main style={{ padding: "4rem 0 0" }}>
        {/* Intro + Search */}
        <section
          style={{
            width: "70%",
            maxWidth: "1200px",
            margin: "0 auto",
            marginBottom: "3rem",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              color: "#6C00AF",
              opacity: "0.9",
              fontSize: "clamp(2.8rem, 5vw, 3.25rem)",
              fontWeight: 700,
              marginBottom: "1rem",
            }}
          >
            Meet our family of storytellers.
          </h2>

          <p
            style={{
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              color: "#f2f2f2",
              opacity: "0.6",
              fontSize: "clamp(1.4rem, 1.5vw, 1.8rem)",
              lineHeight: "1.6",
              marginBottom: "2rem",
            }}
          >
            Each season brings together bold creators who take the journey and stand alongside our
            neighbors — collaborating to craft new stories rooted in real experiences and honest,
            human connection. Explore our alumni, revisit past projects, and see how each artist&apos;s journey
            continues to inspire.
          </p>

          <div style={{ display: "flex", gap: "1rem", alignItems: "stretch" }}>
            <div style={{ flex: 1, height: "47px" }}>
              <AlumniSearch
                enrichedData={enrichedData} // ✅ required prop
                onResults={(primary, secondary, q) => {
                  setPrimaryResults(primary);
                  setSecondaryResults(secondary);
                  setQuery(q);
                }}
                showAllIfEmpty={false}
              />
            </div>

            <Link
              href="/directory"
              prefetch
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "47px",
                fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                fontWeight: 600,
                backgroundColor: "#6C00AF",
                color: "#f2f2f2",
                padding: "0 1rem",
                border: "none",
                borderRadius: "6px",
                textDecoration: "none",
                fontSize: "1rem",
                letterSpacing: "0.1rem",
                whiteSpace: "nowrap",
                transition: "opacity 0.3s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              DIVE DEEPER IN THE DIRECTORY
            </Link>
          </div>
        </section>

        {/* Results */}
        {query && primaryResults.length > 0 && (
          <section style={{ width: "100%", margin: "1.5rem auto" }}>
            <h3
              style={{
                fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                textAlign: "left",
                margin: "0 0 0.25rem 2rem",
                fontWeight: 1000,
                letterSpacing: 0.1,
                color: "#241123",
                opacity: 0.8,
                marginBottom: "1rem",
                fontSize: "1.5rem",
              }}
            >
              Top matches:
            </h3>

            <div
              style={{
                display: "flex",
                gap: "1rem",
                overflowX: "auto",
                padding: "2rem 2rem",
                scrollSnapType: "x mandatory",
                scrollPaddingLeft: "2rem",
                scrollBehavior: "smooth",
                WebkitOverflowScrolling: "touch",
                background: "rgba(36, 17, 35, 0.2)",
              }}
            >
              {primaryResults.map((alum, idx) => (
                <div
                  key={`primary-${alum.slug}-${idx}`}
                  style={{ flex: "0 0 auto", width: "150px", scrollSnapAlign: "start" }}
                >
                  <MiniProfileCard
                    name={alum.name}
                    role={rolesToArray(alum.roles).join(", ")}
                    slug={alum.slug}
                    headshotUrl={alum.currentHeadshotUrl || ""}
                    priority={idx < 6}
                  />
                </div>
              ))}
              <div style={{ flex: "0 0 2rem" }} />
            </div>
          </section>
        )}

        {query && secondaryResults.length > 0 && (
          <section style={{ width: "100%", margin: "2rem auto", textAlign: "center" }}>
            <h4
              style={{
                fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                margin: "0 0 0.25rem 2rem",
                textAlign: "left",
                fontWeight: 1000,
                letterSpacing: 0.1,
                color: "#241123",
                opacity: 0.8,
                marginBottom: "1rem",
                fontSize: "1.5rem",
              }}
            >
              More matches you might like:
            </h4>

            <div
              style={{
                display: "flex",
                gap: "1rem",
                overflowX: "auto",
                padding: "2rem 2rem",
                scrollSnapType: "x mandatory",
                scrollPaddingLeft: "2rem",
                scrollBehavior: "smooth",
                WebkitOverflowScrolling: "touch",
                background: "rgba(36, 17, 35, 0.2)",
              }}
            >
              <div style={{ flex: "0 0 2rem" }} />
              {secondaryResults.map((alum, idx) => (
                <div
                  key={`secondary-${alum.slug}-${idx}`}
                  style={{ flex: "0 0 auto", width: "150px", scrollSnapAlign: "start" }}
                >
                  <MiniProfileCard
                    name={alum.name}
                    role={rolesToArray(alum.roles).join(", ")}
                    slug={alum.slug}
                    headshotUrl={alum.currentHeadshotUrl || ""}
                    priority={idx < 6}
                  />
                </div>
              ))}
              <div style={{ flex: "0 0 2rem" }} />
            </div>

            <Link
              href={`/directory?q=${encodeURIComponent(query)}`}
              prefetch
              style={{
                display: "inline-block",
                marginTop: "1.5rem",
                backgroundColor: "#6C00AF",
                color: "#fff",
                padding: "0.8rem 1.5rem",
                borderRadius: "6px",
                fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                fontWeight: 500,
                fontSize: "0.95rem",
                letterSpacing: "1.2px",
                textTransform: "uppercase",
                textDecoration: "none",
                transition: "opacity 0.3s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.6")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              View All Matches
            </Link>
          </section>
        )}

        {/* Highlights & Updates */}
        <section style={{ width: "100%", textAlign: "center", margin: "2rem 0" }}>
          <h2
            style={{
              fontFamily: "var(--font-anton), system-ui, sans-serif",
              fontSize: "clamp(2rem, 6vw, 8rem)",
              textTransform: "uppercase",
              color: "#241123",
              opacity: 0.95,
              margin: 0,
            }}
          >
            Highlights from the DAT Family
          </h2>
        </section>

        <div className="alumni-grid">
          <div className="featured-col">
            <FeaturedAlumni highlights={highlights} />
          </div>
          <div className="updates-col">
            <UpdatesPanel updates={updates} linkText="Explore All Alumni" linkUrl="/directory" />
          </div>
        </div>

        <section
          style={{
            width: "100%",
            backgroundColor: "#6C00AF",
            boxShadow: "0px 0px 33px rgba(0,0,0,0.8)",
            padding: "4rem 0",
            marginTop: "4rem",
          }}
        >
          <div style={{ width: "100%", margin: "0 auto" }}>
            <SeasonsCarouselAlt />
          </div>
        </section>

        <style jsx>{`
          .alumni-grid {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 2rem;
            width: 90%;
            max-width: 1200px;
            margin: 0 auto;
            align-items: start;
          }
          .updates-col {
            min-width: 350px;
            min-height: 450px;
          }
          @media (max-width: 1100px) {
            .alumni-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </main>
    </div>
  );
}
