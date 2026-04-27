"use client";

import React, { useState } from "react";
import Link from "next/link";
import AlumniTagSections from "@/components/alumni/AlumniTagSections";
import useIsMobile from "@/hooks/useIsMobile";
import {
  CAUSE_CATEGORIES,
  CAUSE_SUBCATEGORIES_BY_CATEGORY,
} from "@/lib/causes";
import { dramaClubs } from "@/lib/dramaClubMap";

interface BioIdentitySectionProps {
  identityTags?: string[];
  practiceTags?: string[];
  exploreCareTags?: string[];
  languages?: string;
  artistStatement?: string;
  directlyBelowHero?: boolean;
  impactCauses?: string;
  supportedClubs?: string;
}

function parseCommaList(raw: string | undefined | null): string[] {
  if (!raw) return [];
  return String(raw)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function BioIdentitySection({
  identityTags = [],
  practiceTags = [],
  exploreCareTags = [],
  languages,
  artistStatement,
  directlyBelowHero = false,
  impactCauses,
  supportedClubs,
}: BioIdentitySectionProps) {
  const isMobile = useIsMobile();
  const [expanded, setExpanded] = useState(false);

  const languageList = parseCommaList(languages);

  const hasAnyTags =
    identityTags.length > 0 ||
    practiceTags.length > 0 ||
    exploreCareTags.length > 0 ||
    languageList.length > 0;
  const bio = artistStatement?.trim() ?? "";

  // Resolve impactCauses IDs → labels
  const causeIds = parseCommaList(impactCauses);
  const resolvedCauses: string[] = [];
  for (const cat of CAUSE_CATEGORIES) {
    const subs = CAUSE_SUBCATEGORIES_BY_CATEGORY[cat.id] ?? [];
    for (const sub of subs) {
      if (causeIds.includes(sub.id)) {
        resolvedCauses.push(sub.shortLabel ?? sub.label);
      }
    }
  }

  // Resolve supportedClubs slugs → name + country + slug (for linking)
  const clubSlugs = parseCommaList(supportedClubs);
  const clubSlugSet = new Set(clubSlugs);
  const resolvedClubs = dramaClubs
    .filter((c) => clubSlugSet.has(c.slug))
    .map((c) => ({ slug: c.slug, label: `${c.name} — ${c.country}` }));

  const hasImpact = resolvedCauses.length > 0 || resolvedClubs.length > 0;

  if (!bio && !hasAnyTags && !hasImpact) return null;

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
  const useGrid = !isMobile && hasBio && (hasAnyTags || hasImpact);

  const eyebrow = (
    <p
      style={{
        fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
        fontSize: "0.78rem",
        textTransform: "uppercase",
        letterSpacing: "0.2rem",
        fontWeight: 600,
        color: "#F2f2f2",
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
                fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                fontSize: "clamp(1.4rem, 2.2vw, 1.9rem)",
                fontWeight: 500,
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
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#FFCC00";
                  e.currentTarget.style.letterSpacing = "0.25rem";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#6c00af";
                  e.currentTarget.style.letterSpacing = "0.15rem";
                }}
                onFocus={(e) => {
                  e.currentTarget.style.color = "#FFCC00";
                  e.currentTarget.style.letterSpacing = "0.25rem";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.color = "#6c00af";
                  e.currentTarget.style.letterSpacing = "0.15rem";
                }}
                style={{
                  display: "block",
                  marginTop: "1rem",
                  background: "none",
                  border: "none",
                  color: "#6c00af",
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
        )}

        {/* Right column: identity tags + impact */}
        {(hasAnyTags || hasImpact) && (
          <div style={{ marginTop: isMobile && hasBio ? "2rem" : 0 }}>
            {!hasBio && eyebrow}
            {hasAnyTags && (
              <AlumniTagSections
                identityTags={identityTags}
                practiceTags={practiceTags}
                exploreCareTags={exploreCareTags}
                align="start"
              />
            )}
            {languageList.length > 0 && (
              <div style={{ marginTop: (identityTags.length > 0 || practiceTags.length > 0 || exploreCareTags.length > 0) ? "1.25rem" : 0 }}>
                <p
                  style={{
                    fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                    fontSize: "0.78rem",
                    textTransform: "uppercase" as const,
                    letterSpacing: "0.2rem",
                    fontWeight: 600,
                    color: "#241123",
                    opacity: 0.75,
                    margin: "0 0 0.5rem 0",
                  }}
                >
                  Languages
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                  {languageList.map((lang) => (
                    <span
                      key={lang}
                      style={{
                        display: "inline-block",
                        padding: "3px 10px",
                        borderRadius: 999,
                        fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        textTransform: "uppercase" as const,
                        letterSpacing: "0.12rem",
                        color: "#241123",
                        background: "rgba(36,17,35,0.10)",
                        border: "1px solid rgba(36,17,35,0.15)",
                      }}
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {hasImpact && (
              <div style={{ marginTop: hasAnyTags ? "1.75rem" : 0 }}>
                {resolvedCauses.length > 0 && (
                  <div style={{ marginBottom: resolvedClubs.length > 0 ? "1.25rem" : 0 }}>
                    <p
                      style={{
                        fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                        fontSize: "0.78rem",
                        textTransform: "uppercase" as const,
                        letterSpacing: "0.2rem",
                        fontWeight: 600,
                        color: "#241123",
                        opacity: 0.75,
                        margin: "0 0 0.5rem 0",
                      }}
                    >
                      Causes I Stand For
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                      {resolvedCauses.map((label) => (
                        <span
                          key={label}
                          style={{
                            display: "inline-block",
                            padding: "3px 10px",
                            borderRadius: 999,
                            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                            fontSize: "0.72rem",
                            fontWeight: 600,
                            textTransform: "uppercase" as const,
                            letterSpacing: "0.12rem",
                            color: "#241123",
                            background: "rgba(36,17,35,0.10)",
                            border: "1px solid rgba(36,17,35,0.15)",
                          }}
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {resolvedClubs.length > 0 && (
                  <div>
                    <p
                      style={{
                        fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                        fontSize: "0.78rem",
                        textTransform: "uppercase" as const,
                        letterSpacing: "0.2rem",
                        fontWeight: 600,
                        color: "#241123",
                        opacity: 0.75,
                        margin: "0 0 0.5rem 0",
                      }}
                    >
                      Drama Clubs I Support
                    </p>
                    <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: "0.35rem" }}>
                      {resolvedClubs.map((club) => (
                        <li key={club.slug}>
                          <Link
                            href={`/drama-club/${club.slug}`}
                            style={{
                              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                              fontSize: "0.84rem",
                              fontWeight: 400,
                              color: "#241123d4",
                              textDecoration: "none",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = "#6c00af"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = "#241123d4"; }}
                          >
                            {club.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

    </section>
  );
}
