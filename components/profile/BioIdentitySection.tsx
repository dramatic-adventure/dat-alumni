"use client";

import React, { useState } from "react";
import AlumniTagSections from "@/components/alumni/AlumniTagSections";
import useIsMobile from "@/hooks/useIsMobile";

interface BioIdentitySectionProps {
  identityTags?: string[];
  practiceTags?: string[];
  exploreCareTags?: string[];
  artistStatement?: string;
  directlyBelowHero?: boolean;
}

export default function BioIdentitySection({
  identityTags = [],
  practiceTags = [],
  exploreCareTags = [],
  artistStatement,
  directlyBelowHero = false,
}: BioIdentitySectionProps) {
  const isMobile = useIsMobile();
  const [expanded, setExpanded] = useState(false);

  const hasAnyTags =
    identityTags.length > 0 ||
    practiceTags.length > 0 ||
    exploreCareTags.length > 0;
  const bio = artistStatement?.trim() ?? "";

  if (!bio && !hasAnyTags) return null;

  // Split bio into lead paragraph and body
  let leadText = "";
  let bodyText = "";
  if (bio) {
    const byDoubleBreak = bio.split(/\n\n+/);
    if (byDoubleBreak.length >= 2) {
      leadText = byDoubleBreak[0].trim();
      bodyText = byDoubleBreak.slice(1).join("\n\n").trim();
    } else {
      const bySingleBreak = bio.split(/\n/);
      if (bySingleBreak.length >= 2) {
        leadText = bySingleBreak[0].trim();
        bodyText = bySingleBreak.slice(1).join("\n").trim();
      } else {
        leadText = bio;
        bodyText = "";
      }
    }
  }

  const isLong = bio.length > 280;
  const hasBody = bodyText.length > 0;
  const showToggle = isLong && hasBody;
  const showBody = !showToggle || expanded;

  const paddingTop =
    !isMobile && directlyBelowHero ? "5rem" : isMobile ? "2.5rem" : "4rem";

  const hasBio = bio.length > 0;
  const useGrid = !isMobile && hasBio && hasAnyTags;

  const eyebrow = (
    <p
      style={{
        fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
        fontSize: "0.78rem",
        textTransform: "uppercase",
        letterSpacing: "0.2rem",
        fontWeight: 600,
        color: "#FFCC00",
        opacity: 0.85,
        margin: "0 0 1.1rem 0",
      }}
    >
      WHO I AM
    </p>
  );

  return (
    <section
      style={{
        backgroundColor: "#2493A9",
        position: "relative",
        padding: `${paddingTop} 30px ${isMobile ? "3rem" : "5rem"}`,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: useGrid ? "grid" : "block",
          gridTemplateColumns: useGrid ? "1fr 0.6fr" : undefined,
          gap: useGrid ? "3rem" : undefined,
        }}
      >
        {/* Left column: bio */}
        {hasBio && (
          <div>
            {eyebrow}
            <p
              style={{
                fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                fontSize: "clamp(1.4rem, 2.2vw, 1.9rem)",
                fontWeight: 300,
                color: "#241123",
                lineHeight: 1.45,
                margin: 0,
                maxWidth: useGrid ? undefined : "72ch",
              }}
            >
              {leadText}
            </p>

            <div
              style={{
                width: "5rem",
                height: "2px",
                backgroundColor: "#FFCC00",
                margin: "1.25rem 0",
              }}
            />

            {showBody && hasBody && (
              <p
                style={{
                  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                  fontSize: "1rem",
                  fontWeight: 300,
                  lineHeight: 1.75,
                  color: "#241123d4",
                  margin: 0,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  overflowWrap: "anywhere",
                  maxWidth: useGrid ? undefined : "72ch",
                }}
              >
                {bodyText}
              </p>
            )}

            {showToggle && (
              <button
                type="button"
                onClick={() => setExpanded((e) => !e)}
                style={{
                  display: "block",
                  marginTop: "1rem",
                  background: "none",
                  border: "none",
                  color: "#6c00af",
                  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.15rem",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                {expanded ? "LESS ↑" : "FULL BIO →"}
              </button>
            )}
          </div>
        )}

        {/* Right column: identity tags */}
        {hasAnyTags && (
          <div style={{ marginTop: isMobile && hasBio ? "2rem" : 0 }}>
            {!hasBio && eyebrow}
            <AlumniTagSections
              identityTags={identityTags}
              practiceTags={practiceTags}
              exploreCareTags={exploreCareTags}
              align="start"
            />
          </div>
        )}
      </div>

    </section>
  );
}
