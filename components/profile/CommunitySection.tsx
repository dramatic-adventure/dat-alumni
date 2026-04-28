"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CAUSE_CATEGORIES, CAUSE_SUBCATEGORIES_BY_CATEGORY } from "@/lib/causes";
import { dramaClubs } from "@/lib/dramaClubMap";
import type { DramaClub } from "@/lib/dramaClubMap";
import useIsMobile from "@/hooks/useIsMobile";

interface CommunitySectionProps {
  supportedClubs?: string;
  impactCauses?: string;
  featuredSupportedClub?: string;
  featuredImpactCause?: string;
}

function parseCommaList(raw?: string | null): string[] {
  if (!raw) return [];
  return String(raw).split(",").map((s) => s.trim()).filter(Boolean);
}

const FF_GROTESK = "var(--font-space-grotesk), system-ui, sans-serif";
const FF_SANS = "var(--font-dm-sans), system-ui, sans-serif";
const FALLBACK_IMAGE = "/images/drama-clubs/club-fallback.jpg";

// Matches the Featured DAT Work section background
const SECTION_BG = "#19657c";

function resolveCauseAnywhere(id: string) {
  for (const cat of CAUSE_CATEGORIES) {
    const sub = (CAUSE_SUBCATEGORIES_BY_CATEGORY[cat.id] ?? []).find((s) => s.id === id);
    if (sub) return { id: sub.id, label: sub.shortLabel ?? sub.label, description: sub.description };
  }
  return undefined;
}

function normalizeSrc(raw: string | null | undefined): string | null {
  if (!raw || !raw.trim()) return null;
  const s = raw.trim();
  return s.startsWith("/") ? s : `/${s}`;
}

// ─── ClubChip ────────────────────────────────────────────────────────────────

type ClubChipData = { slug: string; name: string; thumbSrc: string | null };

function ClubChip({ chip }: { chip: ClubChipData }) {
  const [imgSrc, setImgSrc] = useState<string | null>(chip.thumbSrc);

  return (
    <Link
      href={`/drama-club/${chip.slug}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "4px 10px 4px 4px",
        borderRadius: 10,
        background: "rgba(255,255,255,0.10)",
        border: "1px solid rgba(255,255,255,0.18)",
        textDecoration: "none",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 7,
          overflow: "hidden",
          flexShrink: 0,
          background: imgSrc ? "transparent" : "rgba(255,255,255,0.2)",
          position: "relative",
        }}
      >
        {imgSrc && (
          <Image
            src={imgSrc}
            alt={chip.name}
            fill
            sizes="28px"
            style={{ objectFit: "cover" }}
            onError={() => setImgSrc(null)}
          />
        )}
      </div>
      <span
        style={{
          fontFamily: FF_GROTESK,
          fontSize: "0.72rem",
          fontWeight: 600,
          color: "#fdf9f1",
          whiteSpace: "nowrap",
        }}
      >
        {chip.name}
      </span>
    </Link>
  );
}

// ─── FeaturedClubBanner ───────────────────────────────────────────────────────

function FeaturedClubBanner({ club, isMobile }: { club: DramaClub; isMobile: boolean }) {
  const heroSrc =
    normalizeSrc(club.cardImage) ?? normalizeSrc(club.heroImage) ?? FALLBACK_IMAGE;
  const [imageSrc, setImageSrc] = useState(heroSrc);

  const logoSrc = normalizeSrc(club.logoSrc);

  const regionCountry = club.region ? `${club.region} · ${club.country}` : club.country;

  const blurbRaw = club.shortBlurb ?? club.description;
  const blurb = blurbRaw.length > 120 ? blurbRaw.slice(0, 117) + "…" : blurbRaw;

  return (
    <>
      <style>{`
        @keyframes drama-kenburns-zoom {
          from { transform: scale(1.02); }
          to   { transform: scale(1.12); }
        }
        .dat-banner-img {
          animation: drama-kenburns-zoom 22s ease-in-out infinite alternate;
          transform-origin: center center;
        }
        .dat-view-club-link:hover { color: #F23359 !important; }
      `}</style>

      <div
        style={{
          borderRadius: 16,
          overflow: "hidden",
          border: "1px solid rgba(36,17,35,0.14)",
          boxShadow: "0 4px 20px rgba(36,17,35,0.12)",
        }}
      >
        {/* Image zone */}
        <Link href={`/drama-club/${club.slug}`} style={{ display: "block", textDecoration: "none" }}>
          <div
            style={{
              position: "relative",
              width: "100%",
              paddingBottom: isMobile ? "52%" : "58%",
              overflow: "hidden",
              backgroundColor: "#1a0f1a",
            }}
          >
            <Image
              src={imageSrc}
              alt={`${club.name} Drama Club`}
              fill
              sizes="(max-width: 1023px) 100vw, 50vw"
              className="dat-banner-img"
              style={{ objectFit: "cover" }}
              onError={() => {
                if (imageSrc !== FALLBACK_IMAGE) setImageSrc(FALLBACK_IMAGE);
              }}
            />

            {/* Gradient overlay */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(180deg, transparent 30%, rgba(36,17,35,0.55) 65%, rgba(36,17,35,0.92) 100%)",
                pointerEvents: "none",
              }}
            />

            {/* Passport badge — low-opacity angled mark; only if logoSrc exists */}
            {logoSrc && (
              <div
                style={{
                  position: "absolute",
                  bottom: 18,
                  right: 16,
                  width: 96,
                  height: 96,
                  opacity: 0.15,
                  transform: "rotate(-18deg)",
                  pointerEvents: "none",
                  borderRadius: "50%",
                  overflow: "hidden",
                }}
              >
                <Image
                  src={logoSrc}
                  alt=""
                  fill
                  sizes="96px"
                  style={{ objectFit: "contain" }}
                />
              </div>
            )}

            {/* Text overlay — region · country / club name / DAT DRAMA CLUB */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                padding: "0 18px 18px",
                pointerEvents: "none",
              }}
            >
              <p
                style={{
                  margin: "0 0 4px 0",
                  fontFamily: FF_GROTESK,
                  fontSize: "9px",
                  textTransform: "uppercase",
                  letterSpacing: "0.18em",
                  color: "rgba(255,255,255,0.55)",
                  fontWeight: 500,
                }}
              >
                {regionCountry}
              </p>
              <p
                style={{
                  margin: 0,
                  fontFamily: FF_GROTESK,
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "#fff",
                  lineHeight: 1.2,
                }}
              >
                {club.name}
              </p>
              <p
                style={{
                  margin: "5px 0 0 0",
                  fontFamily: FF_GROTESK,
                  fontSize: "9px",
                  textTransform: "uppercase",
                  letterSpacing: "0.22em",
                  color: "rgba(255,255,255,0.5)",
                  fontWeight: 600,
                }}
              >
                DAT DRAMA CLUB
              </p>
            </div>
          </div>
        </Link>

        {/* Info strip */}
        <div style={{ background: "#fdf9f1", padding: "14px 18px 16px" }}>
          {blurb && !isMobile && (
            <p
              style={{
                margin: "0 0 10px 0",
                fontFamily: FF_SANS,
                fontSize: "0.82rem",
                color: "rgba(36,17,35,0.73)",
                lineHeight: 1.55,
              }}
            >
              {blurb}
            </p>
          )}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span
              style={{
                fontFamily: FF_GROTESK,
                fontSize: "9px",
                textTransform: "uppercase",
                letterSpacing: "0.18em",
                fontWeight: 700,
                color: "#6c00af",
              }}
            >
              Community Spotlight
            </span>
            <Link
              href={`/drama-club/${club.slug}`}
              className="dat-view-club-link"
              style={{
                fontFamily: FF_GROTESK,
                fontSize: "11px",
                fontWeight: 600,
                color: "#2493a9",
                textDecoration: "none",
                letterSpacing: "0.04em",
                transition: "color 140ms",
              }}
            >
              View Club →
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CommunitySection({
  supportedClubs,
  impactCauses,
  featuredSupportedClub,
  featuredImpactCause,
}: CommunitySectionProps) {
  const isMobile = useIsMobile();

  // Resolve clubs as full DramaClub objects
  const clubSlugs = parseCommaList(supportedClubs);
  const clubSlugSet = new Set(clubSlugs);
  const resolvedClubs = dramaClubs.filter((c) => clubSlugSet.has(c.slug));

  // Resolve causes preserving category order
  const causeIdSet = new Set(parseCommaList(impactCauses));
  const resolvedCauses: { id: string; label: string; description?: string }[] = [];
  for (const cat of CAUSE_CATEGORIES) {
    const subs = CAUSE_SUBCATEGORIES_BY_CATEGORY[cat.id] ?? [];
    for (const sub of subs) {
      if (causeIdSet.has(sub.id)) {
        resolvedCauses.push({ id: sub.id, label: sub.shortLabel ?? sub.label, description: sub.description });
      }
    }
  }

  const featuredClubSlug = featuredSupportedClub?.trim() ?? "";
  const featuredClub = featuredClubSlug
    ? (resolvedClubs.find((c) => c.slug === featuredClubSlug) ??
       dramaClubs.find((c) => c.slug === featuredClubSlug))
    : undefined;

  const otherClubs = featuredClub
    ? resolvedClubs.filter((c) => c.slug !== featuredClub.slug)
    : resolvedClubs;

  const featuredCauseId = featuredImpactCause?.trim() ?? "";
  const featuredCause = featuredCauseId
    ? (resolvedCauses.find((c) => c.id === featuredCauseId) ?? resolveCauseAnywhere(featuredCauseId))
    : undefined;
  const otherCauses = featuredCause
    ? resolvedCauses.filter((c) => c.id !== featuredCause.id)
    : resolvedCauses;

  const hasLeftColumn = !!featuredClub;
  const hasCauses = resolvedCauses.length > 0 || !!featuredCause;
  const hasRightColumn = hasCauses || otherClubs.length > 0;
  const hasBothColumns = hasLeftColumn && hasRightColumn;

  if (!hasLeftColumn && !hasRightColumn) return null;

  // Chip strip — max 5 visible + overflow count
  const MAX_CHIPS = 5;
  const visibleChips = otherClubs.slice(0, MAX_CHIPS);
  const chipOverflow = otherClubs.length - MAX_CHIPS;

  const subheaderStyle: React.CSSProperties = {
    fontFamily: FF_GROTESK,
    fontSize: "0.72rem",
    textTransform: "uppercase",
    letterSpacing: "0.18rem",
    fontWeight: 600,
    color: "rgba(255,255,255,0.55)",
    margin: "0 0 0.9rem 0",
  };

  return (
    <section
      style={{
        backgroundColor: SECTION_BG,
        padding: isMobile ? "3rem 24px 3.5rem" : "4.5rem 30px 5rem",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <p
          style={{
            fontFamily: FF_GROTESK,
            fontSize: "0.78rem",
            textTransform: "uppercase",
            letterSpacing: "0.2rem",
            fontWeight: 600,
            color: "rgba(255,255,255,0.6)",
            margin: "0 0 2.5rem 0",
          }}
        >
          What I&apos;m Part Of
        </p>

        <div
          style={{
            display: hasBothColumns && !isMobile ? "grid" : "block",
            gridTemplateColumns: hasBothColumns && !isMobile ? "1fr 0.85fr" : undefined,
            gap: hasBothColumns && !isMobile ? "4rem" : undefined,
            alignItems: "start",
          }}
        >
          {/* LEFT: Cinematic featured club banner */}
          {hasLeftColumn && (
            <div style={{ marginBottom: isMobile && hasRightColumn ? "3rem" : 0 }}>
              <FeaturedClubBanner club={featuredClub!} isMobile={isMobile} />
            </div>
          )}

          {/* RIGHT: Featured cause → Also Supporting chips → Other causes */}
          {hasRightColumn && (
            <div>
              {/* Featured cause card — "Close to My Heart" */}
              {featuredCause && (
                <div
                  style={{
                    padding: "1.1rem 1.4rem",
                    borderRadius: "10px",
                    background: "rgba(36,17,35,0.40)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    marginBottom:
                      otherClubs.length > 0 || otherCauses.length > 0 ? "1.5rem" : 0,
                    transition: "background 160ms, border-color 160ms",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(36,17,35,0.52)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(36,17,35,0.40)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                  }}
                >
                  <p
                    style={{
                      fontFamily: FF_GROTESK,
                      fontSize: "0.65rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.18rem",
                      fontWeight: 600,
                      color: "rgba(255,255,255,0.5)",
                      margin: "0 0 0.45rem 0",
                    }}
                  >
                    Close to My Heart
                  </p>
                  <Link
                    href={`/cause/${featuredCause.id}`}
                    style={{ display: "block", textDecoration: "none" }}
                  >
                    <p
                      style={{
                        fontFamily: FF_GROTESK,
                        fontSize: "1.25rem",
                        fontWeight: 600,
                        color: "#fdf9f1",
                        margin: 0,
                        lineHeight: 1.3,
                        transition: "color 140ms",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "#D9A919"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "#fdf9f1"; }}
                    >
                      {featuredCause.label}
                    </p>
                  </Link>
                  {featuredCause.description && (
                    <p
                      style={{
                        fontFamily: FF_SANS,
                        fontSize: "0.82rem",
                        color: "rgba(255,255,255,0.70)",
                        lineHeight: 1.55,
                        margin: "0.55rem 0 0 0",
                      }}
                    >
                      {featuredCause.description}
                    </p>
                  )}
                </div>
              )}

              {/* Also Supporting chip strip */}
              {otherClubs.length > 0 && (
                <div style={{ marginBottom: otherCauses.length > 0 ? "1.5rem" : 0 }}>
                  <p style={subheaderStyle}>Also Supporting</p>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: isMobile ? "nowrap" : "wrap",
                      gap: "0.5rem",
                      overflowX: isMobile ? "auto" : "visible",
                      paddingBottom: isMobile ? "4px" : 0,
                    }}
                  >
                    {visibleChips.map((club) => {
                      const thumbSrc =
                        normalizeSrc(club.logoSrc) ??
                        normalizeSrc(club.cardImage) ??
                        normalizeSrc(club.heroImage);
                      return (
                        <ClubChip
                          key={club.slug}
                          chip={{ slug: club.slug, name: club.name, thumbSrc }}
                        />
                      );
                    })}
                    {chipOverflow > 0 && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "4px 10px",
                          borderRadius: 10,
                          background: "rgba(255,255,255,0.08)",
                          border: "1px solid rgba(255,255,255,0.15)",
                          fontFamily: FF_GROTESK,
                          fontSize: "0.72rem",
                          fontWeight: 600,
                          color: "rgba(255,255,255,0.55)",
                          flexShrink: 0,
                        }}
                      >
                        +{chipOverflow} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Other causes pills — DAT Pink family */}
              {otherCauses.length > 0 && (
                <div>
                  {!featuredCause && (
                    <p style={{ ...subheaderStyle, margin: "0 0 1.1rem 0" }}>
                      Causes I Stand For
                    </p>
                  )}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                    {otherCauses.map(({ id, label }) => (
                      <Link
                        key={id}
                        href={`/cause/${id}`}
                        style={{
                          display: "inline-block",
                          padding: "4px 12px",
                          borderRadius: 999,
                          fontFamily: FF_GROTESK,
                          fontSize: "0.72rem",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.1rem",
                          color: "#fdf9f1",
                          background: "rgba(242,51,89,0.15)",
                          border: "1px solid rgba(242,51,89,0.30)",
                          textDecoration: "none",
                          transition: "background 140ms, border-color 140ms",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(242,51,89,0.28)";
                          e.currentTarget.style.borderColor = "rgba(242,51,89,0.48)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "rgba(242,51,89,0.15)";
                          e.currentTarget.style.borderColor = "rgba(242,51,89,0.30)";
                        }}
                      >
                        {label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </section>
  );
}
