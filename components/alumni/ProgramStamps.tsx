"use client";
import React, { useState, useRef, useEffect } from "react";
import { programMap } from "@/lib/programMap";
import StampShape from "./StampShape";

type ProgramStampsProps = {
  artistSlug: string;
};

export default function ProgramStamps({ artistSlug }: ProgramStampsProps) {
  const programs = Object.values(programMap).filter((p) => p.artists[artistSlug]);
  if (!programs.length) return null;

  // stable measured height
  const [panelHeight, setPanelHeight] = useState(600);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (panelRef.current) {
      setPanelHeight(panelRef.current.offsetHeight);
    }
  }, []);

  // usedPositions in a ref
  const usedPositions = useRef<{ top: number; left: number }[]>([]);

  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);

  return (
    <div
      ref={panelRef}
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
          panelHeight={panelHeight}           // now measured consistently
          hoveredSlug={hoveredSlug}
          setHoveredSlug={setHoveredSlug}
          mySlug={program.slug}
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
