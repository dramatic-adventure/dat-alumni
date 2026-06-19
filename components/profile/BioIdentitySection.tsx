"use client";

import React, { useState } from "react";
import Link from "next/link";
import AlumniTagSections from "@/components/alumni/AlumniTagSections";
import useIsMobile from "@/hooks/useIsMobile";
import { parseLanguages } from "@/lib/languages";
import ArtistMarqueeSection from "@/components/alumni/ArtistMarqueeSection";
import type { SpotlightUpdate } from "@/components/alumni/SpotlightPanel";
import type { HighlightCard } from "@/components/alumni/HighlightPanel";

interface BioIdentitySectionProps {
  identityTags?: string[];
  practiceTags?: string[];
  exploreCareTags?: string[];
  languages?: string;
  artistStatement?: string;
  directlyBelowHero?: boolean;
  spotlightUpdates?: SpotlightUpdate[];
  highlightCards?: HighlightCard[];
  name?: string;
}

export default function BioIdentitySection({
  identityTags = [],
  practiceTags = [],
  exploreCareTags = [],
  languages,
  artistStatement,
  directlyBelowHero = false,
  spotlightUpdates = [],
  highlightCards = [],
  name,
}: BioIdentitySectionProps) {
  const isMobile = useIsMobile();
  const [expanded, setExpanded] = useState(false);

  const languageList = parseLanguages(languages);

  const hasAnyTags =
    identityTags.length > 0 ||
    practiceTags.length > 0 ||
    exploreCareTags.length > 0 ||
    languageList.length > 0;
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

  const paddingTop = isMobile ? "2.5rem" : "6rem";

  const hasBio = bio.length > 0;
  const useGrid = !isMobile && hasBio && hasAnyTags;

  return (
    <section
      style={{
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: useGrid ? "grid" : "block",
          gridTemplateColumns: useGrid ? "0.925fr 0.675fr" : undefined,
        }}
      >
        {/* ── Left column: bio (light) ─────────────────────────────────── */}
        {hasBio && (
          <div
            style={{
              backgroundColor: "#2493A9",
              padding: `${paddingTop} clamp(2.5rem, 5vw, 5rem) ${isMobile ? "3rem" : "5rem"}`,
            }}
          >
            <div style={{ maxWidth: useGrid ? undefined : "72ch" }}>

              <p
                style={{
                  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                  fontSize: "clamp(1.4rem, 2.2vw, 1.8rem)",
                  fontWeight: 800,
                  letterSpacing: 1.005,
                  color: "#241123d1",
                  lineHeight: 1.3,
                  margin: 0,
                }}
              >
                {leadText}
              </p>

              <div
                style={{
                  width: "5rem",
                  height: "2px",
                  backgroundColor: "#24112327",
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
                  }}
                >
                  {bodyText}
                </p>
              )}

              {showToggle && (
                <button
                  type="button"
                  onClick={() => setExpanded((e) => !e)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#FFCC00";
                    e.currentTarget.style.letterSpacing = "0.25rem";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#6C00AF";
                    e.currentTarget.style.letterSpacing = "0.15rem";
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.color = "#FFCC00";
                    e.currentTarget.style.letterSpacing = "0.25rem";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.color = "#6C00AF";
                    e.currentTarget.style.letterSpacing = "0.15rem";
                  }}
                  style={{
                    display: "block",
                    marginTop: "1rem",
                    background: "none",
                    border: "none",
                    color: "#6C00AF",
                    fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.15rem",
                    cursor: "pointer",
                    padding: 0,
                    transition: "color 180ms ease, letter-spacing 180ms ease",
                  }}
                >
                  {expanded ? "LESS ↑" : "FULL BIO →"}
                </button>
              )}

            </div>

            {/* ── Spotlight / highlight card ──────────────────────────── */}
            {(spotlightUpdates.length > 0 || highlightCards.length > 0) && (
              <div style={{ marginTop: "clamp(1.5rem, 3vw, 2rem)" }}>
                <ArtistMarqueeSection
                  spotlightUpdates={spotlightUpdates}
                  highlightCards={highlightCards}
                  name={name}
                />
              </div>
            )}
          </div>
        )}

        {/* ── Right column: identity tags + languages (deep plum) ───────── */}
        {hasAnyTags && (
          <div
            style={{
              backgroundColor: "#19657c",
              padding: `${useGrid ? paddingTop : "2.5rem"} clamp(2rem, 4vw, 4rem) ${isMobile ? "3rem" : "5rem"}`,
              color: "#F2F2F2",
            }}
          >
            <AlumniTagSections
              identityTags={identityTags}
              practiceTags={practiceTags}
              exploreCareTags={exploreCareTags}
              align="start"
            />

            {languageList.length > 0 && (
              <div style={{ marginTop: (identityTags.length > 0 || practiceTags.length > 0 || exploreCareTags.length > 0) ? "2.5rem" : 0 }}>
                <p
                  style={{
                    fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                    fontSize: "0.68rem",
                    textTransform: "uppercase" as const,
                    letterSpacing: "0.18em",
                    fontWeight: 700,
                    color: "rgba(255,255,255,0.55)",
                    margin: "0 0 0.75rem 0",
                  }}
                >
                  Languages
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                  {languageList.map((lang) => (
                    <Link
                      key={lang.slug + (lang.level ?? "")}
                      href={`/languages/${lang.slug}`}
                      style={{
                        display: "inline-block",
                        padding: "3px 10px",
                        borderRadius: 999,
                        fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        textTransform: "uppercase" as const,
                        letterSpacing: "0.12rem",
                        color: "#D9A919",
                        background: "rgba(217,169,25,0.10)",
                        border: "1px solid rgba(217,169,25,0.25)",
                        textDecoration: "none",
                        transition: "background 140ms, border-color 140ms",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(217,169,25,0.20)";
                        e.currentTarget.style.borderColor = "rgba(217,169,25,0.45)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(217,169,25,0.10)";
                        e.currentTarget.style.borderColor = "rgba(217,169,25,0.25)";
                      }}
                    >
                      {lang.name}{lang.level ? ` (${lang.level})` : ""}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
