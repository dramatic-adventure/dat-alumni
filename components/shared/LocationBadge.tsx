"use client";

import Link from "next/link";
import React from "react";

interface LocationBadgeProps {
  location?: string;
  className?: string;
  fontFamily?: string;
  fontSize?: string;
  color?: string;
  fontWeight?: string | number;
  letterSpacing?: string;
  textTransform?: React.CSSProperties["textTransform"];
  opacity?: number;
  margin?: string;
  style?: React.CSSProperties; // ✅ Already added
}

export default function LocationBadge({
  location,
  className = "",
  fontFamily = "Space Grotesk, sans-serif",
  fontSize = "1.7rem",
  color = "#241123",
  fontWeight = 700,
  letterSpacing = "2px",
  textTransform = "none",
  opacity = 0.85,
  margin = "0",
  style, // ✅ Destructure style
}: LocationBadgeProps) {
  const trimmedLocation = location?.trim();
  if (!trimmedLocation) return null;

  const locationSlug = trimmedLocation.toLowerCase().replace(/\s+/g, "-");
  const link = `/location/${locationSlug}`;

  return (
    <Link
      href={link}
      className={`${className} transition-all duration-200 no-underline hover:no-underline focus:no-underline`}
      style={{
        fontFamily,
        fontSize,
        color,
        fontWeight,
        letterSpacing,
        textTransform,
        opacity,
        margin,
        textDecoration: "none",
        display: "inline-block",
        transformOrigin: "left",
        ...style, // ✅ Merge custom inline styles here
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scaleX(1.05)";
        e.currentTarget.style.letterSpacing = "2.75px";
        e.currentTarget.style.color = "#6C00AF";
        e.currentTarget.style.opacity = "1";
        e.currentTarget.style.textDecoration = "none";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scaleX(1)";
        e.currentTarget.style.letterSpacing = letterSpacing;
        e.currentTarget.style.color = color;
        e.currentTarget.style.opacity = opacity?.toString() ?? "0.9";
        e.currentTarget.style.textDecoration = "none";
      }}
    >
      Based in{" "}
      <span style={{ textTransform: "uppercase", fontWeight: "inherit" }}>
        {trimmedLocation}
      </span>
    </Link>
  );
}
