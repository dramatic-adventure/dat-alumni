"use client";

import SeasonCard from "./SeasonCard";
import { seasons } from "@/lib/seasonData";

export default function SeasonsGrid() {
  return (
    <section className="mt-16 px-6">
      <h2
        className="text-center mb-10"
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          color: "#f2f2f2",
          fontSize: "2.5rem",
        }}
      >
        Explore Our Seasons
      </h2>

      <div
        className="grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", // ✅ Fluid columns
          gap: "clamp(30px, 4vw, 60px)", // ✅ Responsive gap between cards
          maxWidth: "1400px", // ✅ Keeps grid from getting too wide
          margin: "0 auto", // ✅ Center the grid
          padding: "clamp(20px, 4vw, 40px)", // ✅ Responsive padding
        }}
      >
        {seasons.map((s) => (
          <SeasonCard
            key={s.slug}
            slug={s.slug}
            seasonTitle={s.seasonTitle}
            years={s.years}
            projects={s.projects}
          />
        ))}
      </div>
    </section>
  );
}
