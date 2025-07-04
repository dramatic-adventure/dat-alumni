"use client";
import React, { useState } from "react";
import { programMap } from "@/lib/programMap";
import StampShape from "./StampShape";

type ProgramStampsProps = {
  artistSlug: string;
  panelHeight: number;
};

export default function ProgramStamps({ artistSlug }: ProgramStampsProps) {
  const programs = Object.values(programMap).filter((p) => p.artists[artistSlug]);
  if (!programs.length) return null;

  const panelHeight = 250;

  // ✅ new: track hovered
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        minHeight: "250px",
        maxHeight: "500px",
        backgroundColor: "#F6E4C1",
        overflow: "hidden",
      }}
    >
      {programs.map((program) => (
        <StampShape
          key={program.slug}
          program={program.program}
          location={program.location}
          year={program.year}
          color={getProgramColor(program.program)}
          panelHeight={panelHeight}
          hoveredSlug={hoveredSlug}            // ✅ pass down
          setHoveredSlug={setHoveredSlug}      // ✅ pass down
          mySlug={program.slug}                // ✅ identify itself
        />
      ))}
    </div>
  );
}

function getProgramColor(program: string) {
  switch (program.toUpperCase()) {
    case "RAW":
      return "#006D77";
    case "CASTAWAY":
      return "#6C00AF";
    case "ACTION":
      return "#E63946";
    case "TRAVELOGUE":
      return "#F4A261";
    case "SITE-LINES":
      return "#8E44AD";
    case "TEACHING ARTIST RESIDENCY":
      return "#0096C7";
    case "COMPANY RETREAT":
      return "#F4A300";
    case "CREATIVE TREK":
      return "#B22222";
    default:
      return "#333333";
  }
}
