"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";

interface FeaturedAlumniProps {
  highlights: {
    name: string;
    roles?: string[];
    slug: string;
    headshotUrl?: string;
  }[];
}

export default function FeaturedAlumni({ highlights }: FeaturedAlumniProps) {
  if (!highlights || highlights.length === 0) return null;

  const stableHighlights = useMemo(() => highlights, []);

  return (
    <section style={{ margin: "0 auto", padding: "0 10px", marginBottom: "4rem" }}>
      <div className="featured-alumni-grid">
        {stableHighlights.map((alum, index) => {
          const imgSrc = alum.headshotUrl
            ? alum.headshotUrl.replace(/^http:\/\//, "https://")
            : "/images/default-headshot.png";

          return (
            <Link
              key={index}
              href={`/alumni/${alum.slug}`}
              style={{
                textDecoration: "none",
                color: "inherit",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <div
                className="featured-alum-card"
                style={{
                  backgroundColor: "#f2f2f2",
                  borderRadius: "8px",
                  boxShadow: "4px 8px 16px rgba(0,0,0,0.25)",
                  overflow: "hidden",
                  width: "260px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: "0.75rem",
                  transition: "transform 0.35s ease, box-shadow 0.35s ease",
                  transformOrigin: "center",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  const randomTilt = Math.random() * 6 - 3;
                  el.style.transform = `translateY(-12px) rotate(${randomTilt}deg) scale(1.08)`;
                  el.style.boxShadow = `0 20px 40px rgba(0,0,0,0.35)`;
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform = `translateY(0) rotate(0deg) scale(1)`;
                  el.style.boxShadow = `4px 8px 16px rgba(0,0,0,0.25)`;
                }}
              >
                {/* ✅ Image */}
                <div
                  style={{
                    width: "100%",
                    aspectRatio: "4 / 5",
                    overflow: "hidden",
                    position: "relative",
                    borderRadius: "4px",
                    marginBottom: "0.75rem",
                  }}
                >
                  <Image src={imgSrc} alt={alum.name} fill className="object-cover" />
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background:
                        "radial-gradient(ellipse at center, rgba(0,0,0,0) 70%, rgba(0,0,0,0.35) 100%)",
                      pointerEvents: "none",
                    }}
                  />
                </div>

                {/* ✅ Name & Role */}
                <h3
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: "1.3rem",
                    fontWeight: 600,
                    color: "#241123",
                    margin: 0,
                  }}
                >
                  {alum.name}
                </h3>
                <p
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "0.9rem",
                    color: "#6C00AF",
                    margin: 0,
                    opacity: 0.8,
                  }}
                >
                  {(alum.roles && alum.roles.join(", ")) || "Artist"}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* ✅ Responsive CSS */}
      <style jsx>{`
  .featured-alumni-grid {
    display: grid;
    gap: 70px;
    justify-items: center;
    grid-template-columns: repeat(2, 1fr); /* ✅ Large screens: 4 per row */
  }

  @media (max-width: 1200px) {
    .featured-alumni-grid {
      grid-template-columns: repeat(2, 1fr); /* ✅ Medium screens: 2 per row */
    }
  }

  @media (max-width: 600px) {
    .featured-alumni-grid {
      grid-template-columns: 1fr; /* ✅ Small screens: 1 per row */
    }
  }
`}</style>

    </section>
  );
}
