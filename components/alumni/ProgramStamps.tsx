"use client";
import React from "react";
import { programMap } from "@/lib/programMap";
import StampShape from "./StampShape";

type ProgramStampsProps = {
  artistSlug: string;
};

export default function ProgramStamps({ artistSlug }: ProgramStampsProps) {
  const programs = Object.values(programMap).filter((p) => p.artists[artistSlug]);
  if (!programs.length) return null;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "600px",
        backgroundColor: "#d2b48c", // parchment
        overflow: "visible",
      }}
    >
      {programs.map((program, i) => (
        <StampShape
          key={program.slug}
          program={program.program}
          location={program.location}
          year={program.year}
          color={getProgramColor(program.program)}
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
