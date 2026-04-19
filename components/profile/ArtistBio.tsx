import React from "react";
import AlumniTagSections from "@/components/alumni/AlumniTagSections";

interface ArtistBioProps {
  identityTags?: string[];
  practiceTags?: string[];
  exploreCareTags?: string[];
  artistStatement?: string;
  fontFamily?: string;
  fontSize?: string;
  color?: string;
  fontStyle?: "normal" | "italic";
  fontWeight?: number | string;
  letterSpacing?: string;
  identityTagStyle?: React.CSSProperties;
  bioStyle?: React.CSSProperties;
  sectionStyle?: React.CSSProperties;
}

export default function ArtistBio({
  identityTags = [],
  practiceTags = [],
  exploreCareTags = [],
  artistStatement,
  fontFamily = 'var(--font-dm-sans), system-ui, sans-serif',
  fontSize = "1.15rem",
  color = "#ffffff",
  fontStyle = "normal",
  fontWeight = 200,
  letterSpacing = "normal",
  identityTagStyle = {},
  bioStyle = {},
  sectionStyle = {},
}: ArtistBioProps) {
  const hasAnyTags =
    identityTags.length > 0 ||
    practiceTags.length > 0 ||
    exploreCareTags.length > 0;

  if (!artistStatement && !hasAnyTags) return null;

  return (
    <section
      style={{
        backgroundColor: "#2493A9",
        color: "#fff",
        ...sectionStyle,
      }}
    >
      {hasAnyTags && (
        <div style={identityTagStyle}>
          <AlumniTagSections
            identityTags={identityTags}
            practiceTags={practiceTags}
            exploreCareTags={exploreCareTags}
            align="end"
          />
        </div>
      )}
      {artistStatement && (
        <div
          style={{
            fontFamily,
            fontSize,
            color,
            fontStyle,
            fontWeight,
            letterSpacing,
            ...bioStyle,
          }}
        >
          {artistStatement}
        </div>
      )}
    </section>
  );
}
