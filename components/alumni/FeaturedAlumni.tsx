"use client";

import { useMemo } from "react";
import MiniProfileCard from "@/components/profile/MiniProfileCard";

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
    <section style={{ margin: "0 auto", padding: "0 20px", marginBottom: "2rem" }}>
      <h2
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          color: "#241123",
          fontSize: "2rem",
          marginBottom: "1.5rem",
          textAlign: "left",
        }}
      >
        Featured Alumni
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "40px",
          justifyItems: "center",
        }}
      >
        {stableHighlights.map((alum, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              justifyContent: "center",
              transform: "scale(1.25)", // ✅ Default size (desktop)
              transformOrigin: "center",
            }}
            className="featured-alum-card"
          >
            <MiniProfileCard
              name={alum.name}
              role={alum.roles?.join(", ") || ""}
              slug={alum.slug}
              headshotUrl={alum.headshotUrl}
            />
          </div>
        ))}
      </div>

      {/* ✅ Responsive scaling with inline <style> */}
      <style>
        {`
          @media (max-width: 1024px) {
            .featured-alum-card {
              transform: scale(1.15); /* Tablet */
            }
          }

          @media (max-width: 640px) {
            .featured-alum-card {
              transform: scale(1.05); /* Mobile - still bigger than normal */
            }
          }
        `}
      </style>
    </section>
  );
}
