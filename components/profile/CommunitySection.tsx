"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { dramaClubs } from "@/lib/dramaClubMap";
import type { DramaClub } from "@/lib/dramaClubMap";
import useIsMobile from "@/hooks/useIsMobile";

interface CommunitySectionProps {
  supportedClubs?: string;
  featuredSupportedClub?: string;
}

function parseCommaList(raw?: string | null): string[] {
  if (!raw) return [];
  return String(raw).split(",").map((s) => s.trim()).filter(Boolean);
}

const FF_GROTESK = "var(--font-space-grotesk), system-ui, sans-serif";
const FF_SANS = "var(--font-dm-sans), system-ui, sans-serif";
const INK = "#241123";
const FALLBACK_IMAGE = "/images/drama-clubs/club-fallback.jpg";
function normalizeSrc(raw: string | null | undefined): string | null {
  if (!raw || !raw.trim()) return null;
  const s = raw.trim();
  return s.startsWith("/") ? s : `/${s}`;
}

function pickClubImage(club: DramaClub): string {
  return normalizeSrc(club.cardImage) ?? normalizeSrc(club.heroImage) ?? FALLBACK_IMAGE;
}

// ─── CSS ─────────────────────────────────────────────────────────────────────

const CARD_CSS = `
  @keyframes cs-kenburns {
    from { transform: scale(1.02); }
    to   { transform: scale(4); }
  }

  /* ── Featured club card ── */
  .cs-club-card {
    cursor: pointer;
    transform-origin: center center;
    transition: transform 180ms ease-out, box-shadow 180ms ease-out;
    box-shadow: 0 18px 40px rgba(0,0,0,0.18);
    border-radius: 26px;
    border: 1px solid rgba(36,17,35,0.14);
    background: transparent;
  }
  .cs-club-card:hover {
    transform: scale(1.025);
    box-shadow: 0 26px 60px rgba(0,0,0,0.28);
  }
  .cs-club-card-bg {
    border-radius: 26px;
    background-color: #fdf9f1;
    padding: 16px;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    overflow: hidden;
  }
  .cs-club-img-wrap {
    position: relative;
    width: 100%;
    padding-bottom: 42.857%;
    overflow: hidden;
    border-radius: 18px;
    margin-bottom: 16px;
    transition: padding-bottom 200ms ease-out;
  }
  .cs-club-card:hover .cs-club-img-wrap {
    padding-bottom: 75%;
  }
  .cs-club-img {
    transform-origin: center center;
  }
  .cs-club-card:hover .cs-club-img {
    animation: cs-kenburns 44s linear infinite;
  }
  .cs-club-extra {
    max-height: 0;
    overflow: hidden;
    opacity: 0;
    margin-top: 0;
    transition:
      max-height 220ms ease-out,
      opacity 200ms ease-out,
      margin-top 200ms ease-out;
  }
  .cs-club-card:hover .cs-club-extra {
    max-height: 900px;
    opacity: 1;
    margin-top: 12px;
  }
  .cs-club-btn {
    background-color: #2493A9;
    transition: background-color 140ms ease-out;
  }
  .cs-club-btn:hover { background-color: #1F7F92; }

  /* ── Also Supporting cards ── */
  .cs-also-card {
    cursor: pointer;
    opacity: 0.28;
    transition: transform 180ms ease-out, box-shadow 180ms ease-out, opacity 240ms ease-out;
    box-shadow: 0 4px 16px rgba(0,0,0,0.08);
    border-radius: 14px;
    border: 1px solid rgba(36,17,35,0.12);
    background: transparent;
  }
  .cs-also-card:hover {
    opacity: 1;
    transform: scale(1.015);
    box-shadow: 0 12px 40px rgba(0,0,0,0.28);
  }
  .cs-also-bg {
    border-radius: 14px;
    background-color: #fdf9f1;
    padding: 12px 16px;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    overflow: hidden;
  }
  .cs-also-extra {
    max-height: 0;
    overflow: hidden;
    opacity: 0;
    margin-top: 0;
    transition:
      max-height 220ms ease-out,
      opacity 200ms ease-out,
      margin-top 200ms ease-out;
  }
  .cs-also-card:hover .cs-also-extra {
    max-height: 900px;
    opacity: 1;
    margin-top: 14px;
  }
  .cs-also-img-wrap {
    position: relative;
    width: 100%;
    padding-bottom: 56.25%;
    overflow: hidden;
    border-radius: 12px;
    margin-bottom: 12px;
  }
  .cs-also-img {
    transform-origin: center center;
  }
  .cs-also-card:hover .cs-also-img {
    animation: cs-kenburns 44s linear infinite;
  }
  .cs-also-btn {
    background-color: #2493A9;
    transition: background-color 140ms ease-out;
  }
  .cs-also-btn:hover { background-color: #1F7F92; }
`;

// ─── FeaturedClubCard ─────────────────────────────────────────────────────────

function FeaturedClubCard({ club }: { club: DramaClub }) {
  const [imageSrc, setImageSrc] = useState(pickClubImage(club));
  const regionCountry = club.region ? `${club.region} · ${club.country}` : club.country;
  const blurb = club.shortBlurb ?? club.description;
  const hasStats = !!(club.approxYouthServed || club.showcasesCount);

  return (
    <Link href={`/drama-club/${club.slug}`} style={{ display: "block", textDecoration: "none" }}>
      <div className="cs-club-card">
        <div className="cs-club-card-bg">
          {/* Image — 21:9 collapsed, 75% on hover */}
          <div className="cs-club-img-wrap">
            <Image
              src={imageSrc}
              alt={`${club.name} Drama Club`}
              fill
              className="object-cover cs-club-img"
              sizes="(max-width: 1023px) 90vw, 600px"
              onError={() => { if (imageSrc !== FALLBACK_IMAGE) setImageSrc(FALLBACK_IMAGE); }}
            />
          </div>

          {/* Always-visible text */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontFamily: FF_GROTESK,
                fontSize: "0.7rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.22em",
                color: "#6C00AF",
              }}
            >
              {regionCountry}
            </div>
            <h3
              style={{
                marginTop: 4,
                marginBottom: 0,
                fontFamily: FF_GROTESK,
                fontSize: "1.4rem",
                fontWeight: 700,
                lineHeight: 1.1,
                color: INK,
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                wordBreak: "break-word",
              }}
            >
              {club.name}
            </h3>
            <div
              style={{
                marginTop: 6,
                fontFamily: FF_GROTESK,
                fontSize: "0.65rem",
                textTransform: "uppercase",
                letterSpacing: "0.22em",
                color: "rgba(60,37,59,0.6)",
              }}
            >
              DAT Drama Club
            </div>
          </div>

          {/* Expanded content */}
          <div className="cs-club-extra">
            {blurb && (
              <p
                style={{
                  marginTop: 0,
                  marginBottom: 0,
                  fontFamily: FF_SANS,
                  fontSize: "0.9rem",
                  lineHeight: 1.6,
                  color: "#3c253b",
                }}
              >
                {blurb}
              </p>
            )}
            {hasStats && (
              <div
                style={{
                  marginTop: 16,
                  paddingTop: 10,
                  borderTop: "1px solid #e4d3be",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 6,
                  fontFamily: FF_GROTESK,
                  fontSize: "0.72rem",
                  color: "#3c253b",
                }}
              >
                {club.approxYouthServed && (
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                    <span style={{ fontSize: "0.95rem", fontWeight: 600 }}>{club.approxYouthServed}+</span>
                    <span style={{ textTransform: "uppercase", letterSpacing: "0.18em" }}>youth reached</span>
                  </div>
                )}
                {club.showcasesCount && (
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                    <span style={{ fontSize: "0.95rem", fontWeight: 600 }}>{club.showcasesCount}+</span>
                    <span style={{ textTransform: "uppercase", letterSpacing: "0.18em" }}>showcases</span>
                  </div>
                )}
              </div>
            )}
            <div
              className="cs-club-btn"
              style={{
                marginTop: hasStats ? 20 : 18,
                display: "inline-flex",
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
                padding: "0.85rem 1.15rem",
                borderRadius: 16,
                fontFamily: FF_SANS,
                fontSize: "0.78rem",
                lineHeight: 1.15,
                fontWeight: 800,
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                color: "#F2F2F2",
              }}
            >
              View this Drama Club
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── AlsoSupportingCard ───────────────────────────────────────────────────────

function AlsoSupportingCard({ club }: { club: DramaClub }) {
  const [imageSrc, setImageSrc] = useState(pickClubImage(club));
  const regionCountry = club.region ? `${club.region} · ${club.country}` : club.country;
  const blurb = club.shortBlurb ?? club.description;
  const hasStats = !!(club.approxYouthServed || club.showcasesCount);

  return (
    <Link href={`/drama-club/${club.slug}`} style={{ display: "block", textDecoration: "none" }}>
      <div className="cs-also-card">
        <div className="cs-also-bg">
          {/* Collapsed: name + region/country + DAT DRAMA CLUB — no image */}
          <div>
            <div
              style={{
                fontFamily: FF_GROTESK,
                fontSize: "0.62rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                color: "rgba(36,17,35,0.45)",
              }}
            >
              {regionCountry} · DAT Drama Club
            </div>
            <div
              style={{
                marginTop: 3,
                fontFamily: FF_GROTESK,
                fontSize: "1.05rem",
                fontWeight: 700,
                lineHeight: 1.2,
                color: INK,
              }}
            >
              {club.name}
            </div>
          </div>

          {/* Expanded: image + blurb + stats + button */}
          <div className="cs-also-extra">
            <div className="cs-also-img-wrap">
              <Image
                src={imageSrc}
                alt={`${club.name} Drama Club`}
                fill
                className="object-cover cs-also-img"
                sizes="(max-width: 1023px) 90vw, 400px"
                onError={() => { if (imageSrc !== FALLBACK_IMAGE) setImageSrc(FALLBACK_IMAGE); }}
              />
            </div>
            {blurb && (
              <p
                style={{
                  marginTop: 0,
                  marginBottom: 0,
                  fontFamily: FF_SANS,
                  fontSize: "0.88rem",
                  lineHeight: 1.6,
                  color: "#3c253b",
                }}
              >
                {blurb}
              </p>
            )}
            {hasStats && (
              <div
                style={{
                  marginTop: 12,
                  paddingTop: 8,
                  borderTop: "1px solid #e4d3be",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 4,
                  fontFamily: FF_GROTESK,
                  fontSize: "0.7rem",
                  color: "#3c253b",
                }}
              >
                {club.approxYouthServed && (
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                    <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>{club.approxYouthServed}+</span>
                    <span style={{ textTransform: "uppercase", letterSpacing: "0.18em" }}>youth reached</span>
                  </div>
                )}
                {club.showcasesCount && (
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                    <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>{club.showcasesCount}+</span>
                    <span style={{ textTransform: "uppercase", letterSpacing: "0.18em" }}>showcases</span>
                  </div>
                )}
              </div>
            )}
            <div
              className="cs-also-btn"
              style={{
                marginTop: hasStats ? 16 : 14,
                display: "inline-flex",
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: 12,
                fontFamily: FF_SANS,
                fontSize: "0.75rem",
                lineHeight: 1.15,
                fontWeight: 800,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "#F2F2F2",
              }}
            >
              View this Drama Club
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CommunitySection({
  supportedClubs,
  featuredSupportedClub,
}: CommunitySectionProps) {
  const isMobile = useIsMobile();

  const clubSlugs = parseCommaList(supportedClubs);
  const clubSlugSet = new Set(clubSlugs);
  const resolvedClubs = dramaClubs.filter((c) => clubSlugSet.has(c.slug));

  // Featured club: explicit slug → fallback to first supported club
  const featuredClubSlug = featuredSupportedClub?.trim() ?? "";
  const featuredClub = featuredClubSlug
    ? (resolvedClubs.find((c) => c.slug === featuredClubSlug) ??
       dramaClubs.find((c) => c.slug === featuredClubSlug))
    : resolvedClubs[0];

  const otherClubs = featuredClub
    ? resolvedClubs.filter((c) => c.slug !== featuredClub.slug)
    : resolvedClubs;

  const hasLeftColumn = !!featuredClub;
  const hasRightColumn = otherClubs.length > 0;
  const hasBothColumns = hasLeftColumn && hasRightColumn;

  if (!hasLeftColumn && !hasRightColumn) return null;

  const subheaderStyle: React.CSSProperties = {
    fontFamily: FF_GROTESK,
    fontSize: "0.72rem",
    textTransform: "uppercase",
    letterSpacing: "0.18rem",
    fontWeight: 600,
    color: "rgba(36,17,35,0.45)",
    margin: "0 0 0.9rem 0",
  };

  return (
    <section
      style={{
        backgroundColor: "#2493A9",
        padding: isMobile ? "3rem 24px 3.5rem" : "4.5rem 60px 5rem",
      }}
    >
      <style>{CARD_CSS}</style>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <p
          style={{
            fontFamily: FF_GROTESK,
            fontSize: "0.68rem",
            textTransform: "uppercase",
            letterSpacing: "0.18em",
            fontWeight: 700,
            color: "rgba(36,17,35,0.5)",
            margin: "0 0 1.5rem 0",
          }}
        >
          Proud to Support
        </p>

        <div
          style={{
            display: hasBothColumns && !isMobile ? "grid" : "block",
            gridTemplateColumns: hasBothColumns && !isMobile ? "0.925fr 0.925fr" : undefined,
            gap: hasBothColumns && !isMobile ? "2rem" : undefined,
            alignItems: "start",
          }}
        >
          {/* LEFT: Expandable featured club card */}
          {hasLeftColumn && (
            <div style={{ marginBottom: isMobile && hasRightColumn ? "3rem" : 0 }}>
              <FeaturedClubCard club={featuredClub!} />
            </div>
          )}

          {/* RIGHT: Also Supporting expandable cards */}
          {hasRightColumn && (
            <div>
              <div style={{ display: "flex", flexDirection: "column", marginTop: "0.25rem", gap: "0.6rem" }}>
                {otherClubs.map((club) => (
                  <AlsoSupportingCard key={club.slug} club={club} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
