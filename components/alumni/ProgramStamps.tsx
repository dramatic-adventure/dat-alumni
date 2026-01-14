"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { programMap } from "@/lib/programMap";
import StampShape from "./StampShape";

type ProgramStampsProps = {
  artistSlug: string;
  slugAliases?: string[];
};

const normSlugish = (raw: unknown) => String(raw ?? "").trim().toLowerCase();

export default function ProgramStamps({ artistSlug, slugAliases = [] }: ProgramStampsProps) {
  const [panelHeight, setPanelHeight] = useState(600);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (panelRef.current) {
      setPanelHeight(panelRef.current.offsetHeight);
    }
  }, []);

  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);

  // ✅ Alias-aware slug set
  const slugSet = useMemo(() => {
    const s = new Set<string>();
    s.add(normSlugish(artistSlug));
    for (const a of slugAliases) s.add(normSlugish(a));
    return s;
  }, [artistSlug, slugAliases]);

  // ✅ Alias-aware matching against programMap artists keys
  const programs = useMemo(() => {
    return Object.values(programMap).filter((p) => {
      if (!p?.artists) return false;
      for (const key of Object.keys(p.artists)) {
        if (slugSet.has(normSlugish(key))) return true;
      }
      return false;
    });
  }, [slugSet]);

  if (!programs.length) return null; // ✅ after hooks

  return (
    <div
      ref={panelRef}
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        minHeight: "250px",
        maxHeight: "500px",
        overflow: "hidden",
        backgroundColor: "#F6E4C1",
      }}
    >
      {/* ✅ Background Texture */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundImage: "url('/texture/passportpage.png')",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          opacity: 1,
          zIndex: 1,
        }}
      />

      {/* ✅ Overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "#F799A8",
          opacity: 0.3,
          zIndex: 2,
        }}
      />

      {/* ✅ Stamps */}
      <div style={{ position: "relative", zIndex: 3 }}>
        {programs.map((program) => (
          <StampShape
            key={program.slug}
            program={program.program}
            location={program.location}
            year={program.year}
            color={getProgramColor(program.program)}
            panelHeight={panelHeight}
            hoveredSlug={hoveredSlug}
            setHoveredSlug={setHoveredSlug}
            mySlug={program.slug}
          />
        ))}
      </div>
    </div>
  );
}

function getProgramColor(program: string) {
  switch (program.toUpperCase()) {
    case "RAW":
      return "#00454B";
    case "CASTAWAY":
      return "#3E0066";
    case "ACTION":
      return "#8C1E24";
    case "TRAVELOGUE":
      return "#8B531F";
    case "SITE-LINES":
      return "#532664";
    case "TEACHING ARTIST RESIDENCY":
      return "#005B7A";
    case "COMPANY RETREAT":
      return "#8B5D00";
    case "CREATIVE TREK":
      return "#661414";
    default:
      return "#333333";
  }
}
