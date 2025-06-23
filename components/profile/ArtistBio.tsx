import React from "react";
import IdentityTags from "@/components/alumni/IdentityTags";

interface ArtistBioProps {
  identityTags?: string[];
  artistStatement?: string;
  fontFamily?: string;
  fontSize?: string;
  color?: string;
  fontStyle?: "normal" | "italic";
  fontWeight?: number | string;
  letterSpacing?: string;
  identityTagStyle?: React.CSSProperties;
  bioStyle?: React.CSSProperties;
}

export default function ArtistBio({
  identityTags = [],
  artistStatement,
  fontFamily = '"DM Sans", sans-serif',
  fontSize = "1.15rem",
  color = "#ffffff",
  fontStyle = "normal",
  fontWeight = 200,
  letterSpacing = "normal",
  identityTagStyle = {},
  bioStyle = {},
}: ArtistBioProps) {
  if (!artistStatement && identityTags.length === 0) return null;

  return (
    <section style={{ backgroundColor: "#2493A9", color: "#fff", padding: "1.2rem 60px 3rem" }}>
      {identityTags.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-end" style={identityTagStyle}>
          <IdentityTags tags={identityTags} />
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
