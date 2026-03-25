"use client";

import SeasonCardAlt from "./SeasonCardAlt";
import { seasons } from "@/lib/seasonData";

export default function SeasonsGridAlt() {
  return (
    <section className="mt-16 px-6">
      {/* ✅ Title */}
      <h2
        className="text-center mb-10"
        style={{
          fontFamily: "var(--font-anton), Sans Serif",
          backgroundColor: "transparent",
          fontWeight: 400,
          marginTop: "0.5rem",
          marginBottom: "1.5rem",
          color: "#f23359",
          fontSize: "5rem",
        }}
      >
        EXPLORE OUR SEASONS
      </h2>

      {/* ✅ Grid Layout */}
      <div
        className="grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "clamp(30px, 4vw, 60px)",
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "clamp(20px, 4vw, 40px)",
        }}
      >
        {seasons.map((s) => (
          <SeasonCardAlt
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
