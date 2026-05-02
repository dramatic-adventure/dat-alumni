"use client";

import React, { useState } from "react";
import Link from "next/link";
import AlumniTagSections from "@/components/alumni/AlumniTagSections";
import useIsMobile from "@/hooks/useIsMobile";
import { parseLanguages } from "@/lib/languages";
import { CAUSE_CATEGORIES, CAUSE_SUBCATEGORIES_BY_CATEGORY } from "@/lib/causes";

interface BioIdentitySectionProps {
  identityTags?: string[];
  practiceTags?: string[];
  exploreCareTags?: string[];
  languages?: string;
  artistStatement?: string;
  directlyBelowHero?: boolean;
  impactCauses?: string;
  featuredImpactCause?: string;
}

const MAX_CAUSE_PILLS = 4;

function parseCauseList(raw?: string | null): string[] {
  if (!raw) return [];
  return String(raw).split(",").map((s) => s.trim()).filter(Boolean);
}

function resolveCauseAnywhere(id: string) {
  for (const cat of CAUSE_CATEGORIES) {
    const sub = (CAUSE_SUBCATEGORIES_BY_CATEGORY[cat.id] ?? []).find((s) => s.id === id);
    if (sub) return { id: sub.id, label: sub.shortLabel ?? sub.label, description: sub.description };
  }
  return undefined;
}

export default function BioIdentitySection({
  identityTags = [],
  practiceTags = [],
  exploreCareTags = [],
  languages,
  artistStatement,
  directlyBelowHero = false,
  impactCauses,
  featuredImpactCause,
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

  // ── Cause resolution ──────────────────────────────────────────────────────
  const causeIdSet = new Set(parseCauseList(impactCauses));
  const resolvedCauses: { id: string; label: string; description?: string }[] = [];
  for (const cat of CAUSE_CATEGORIES) {
    const subs = CAUSE_SUBCATEGORIES_BY_CATEGORY[cat.id] ?? [];
    for (const sub of subs) {
      if (causeIdSet.has(sub.id)) {
        resolvedCauses.push({ id: sub.id, label: sub.shortLabel ?? sub.label, description: sub.description });
      }
    }
  }
  const featuredCauseId = featuredImpactCause?.trim() ?? "";
  const featuredCause = featuredCauseId
    ? (resolvedCauses.find((c) => c.id === featuredCauseId) ?? resolveCauseAnywhere(featuredCauseId))
    : undefined;
  const otherCauses = featuredCause
    ? resolvedCauses.filter((c) => c.id !== featuredCause.id)
    : resolvedCauses;
  const hasCauses = resolvedCauses.length > 0 || !!featuredCause;
  const visibleCausePills = otherCauses.slice(0, MAX_CAUSE_PILLS);
  const causePillOverflow = otherCauses.length - MAX_CAUSE_PILLS;
  // ─────────────────────────────────────────────────────────────────────────

  const paddingTop =
    !isMobile && directlyBelowHero ? "5rem" : isMobile ? "2.5rem" : "4rem";

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
        {/* ── Left column: bio (teal) ───────────────────────────────────── */}
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
                  fontWeight: 500,
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

              {/* Close to My Heart — personal values appended below bio */}
              {hasCauses && (
                <div
                  style={{
                    marginTop: "3.75rem",
                    padding: "1.1rem 1.4rem",
                    borderRadius: 10,
                    background: "rgba(108,0,175,0.075)",
                    border: "1px solid rgba(108,0,175,0.18)",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                      fontSize: "0.65rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.18rem",
                      fontWeight: 600,
                      color: "#6C00AF",
                      margin: "0 0 0.45rem 0",
                    }}
                  >
                    {featuredCause ? "Close to My Heart" : "Causes I Stand For"}
                  </p>

                  {featuredCause && (
                    <>
                      <Link
                        href={`/cause/${featuredCause.id}`}
                        style={{ display: "block", textDecoration: "none", cursor: "pointer" }}
                      >
                        <p
                          style={{
                            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                            fontSize: "1.25rem",
                            fontWeight: 600,
                            color: "#f4e3ff",
                            margin: 0,
                            lineHeight: 1.3,
                            transition: "color 140ms",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = "#ffcc00"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = "#f4e3ff"; }}
                        >
                          {featuredCause.label}
                        </p>
                      </Link>
                      {featuredCause.description && (
                        <p
                          style={{
                            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                            fontSize: "0.82rem",
                            color: "#2d0049d8",
                            lineHeight: 1.55,
                            margin: "0.55rem 0 0 0",
                          }}
                        >
                          {featuredCause.description}
                        </p>
                      )}
                    </>
                  )}

                  {visibleCausePills.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "0.4rem",
                        marginTop: featuredCause ? "0.9rem" : 0,
                      }}
                    >
                      {visibleCausePills.map(({ id, label }) => (
                        <Link
                          key={id}
                          href={`/cause/${id}`}
                          style={{
                            display: "inline-block",
                            padding: "4px 12px",
                            borderRadius: 999,
                            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                            fontSize: "0.72rem",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.08rem",
                            color: "#6C00AF",
                            background: "rgba(108,0,175,0.08)",
                            border: "1px solid rgba(108,0,175,0.22)",
                            textDecoration: "none",
                            cursor: "pointer",
                            transition: "background 140ms, border-color 140ms",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(108,0,175,0.16)";
                            e.currentTarget.style.borderColor = "rgba(108,0,175,0.38)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "rgba(108,0,175,0.08)";
                            e.currentTarget.style.borderColor = "rgba(108,0,175,0.22)";
                          }}
                        >
                          {label}
                        </Link>
                      ))}
                      {causePillOverflow > 0 && (
                        <span
                          style={{
                            display: "inline-block",
                            padding: "4px 12px",
                            borderRadius: 999,
                            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                            fontSize: "0.72rem",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.08rem",
                            color: "rgba(108,0,175,0.5)",
                            background: "rgba(108,0,175,0.04)",
                            border: "1px solid rgba(108,0,175,0.14)",
                          }}
                        >
                          +{causePillOverflow} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Right column: identity tags + languages (deep plum) ───────── */}
        {hasAnyTags && (
          <div
            style={{
              backgroundColor: "#3D1070",
              padding: `${useGrid ? paddingTop : "2.5rem"} clamp(2rem, 4vw, 4rem) ${isMobile ? "3rem" : "5rem"}`,
              color: "#F2F2F2",
            }}
          >
            {/* Section eyebrow — always shown in this column */}
            <p
              style={{
                fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                fontSize: "0.68rem",
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#9B89B4",
                margin: "0 0 1.75rem 0",
              }}
            >
              Who I Am
            </p>

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
                    color: "#9B89B4",
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
