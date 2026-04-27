"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CAUSE_CATEGORIES, CAUSE_SUBCATEGORIES_BY_CATEGORY } from "@/lib/causes";
import { dramaClubs } from "@/lib/dramaClubMap";
import type { DramaClub } from "@/lib/dramaClubMap";
import { computeDramaClubStatus, type DramaClubStatus } from "@/lib/dramaClubStatus";
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
const INK = "#241123";
const FALLBACK_IMAGE = "/images/drama-clubs/club-fallback.jpg";

const CHIP_STYLES: Record<DramaClubStatus, { bg: string; text: string; border: string }> = {
  new: { bg: "rgba(242, 51, 89, 0.15)", text: "#F23359", border: "rgba(242, 51, 89, 0.55)" },
  ongoing: { bg: "rgba(255, 204, 0, 0.18)", text: "#8A6400", border: "#8A6400" },
  legacy: { bg: "rgba(108, 0, 175, 0.22)", text: "#3B1D59", border: "rgba(108, 0, 175, 0.7)" },
};

const STATUS_LABEL: Record<DramaClubStatus, string> = {
  new: "NEW",
  ongoing: "ONGOING",
  legacy: "LEGACY",
};

function resolveCauseAnywhere(id: string) {
  for (const cat of CAUSE_CATEGORIES) {
    const sub = (CAUSE_SUBCATEGORIES_BY_CATEGORY[cat.id] ?? []).find((s) => s.id === id);
    if (sub) return { id: sub.id, label: sub.shortLabel ?? sub.label };
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
        background: "rgba(36,147,169,0.06)",
        border: "1px solid rgba(36,147,169,0.16)",
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
          background: imgSrc ? "transparent" : "rgba(36,147,169,0.35)",
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
          color: INK,
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
  const status = computeDramaClubStatus(club);
  const chip = CHIP_STYLES[status];
  const tagLabel = STATUS_LABEL[status];

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

            {/* Status chip */}
            <div
              style={{
                position: "absolute",
                top: 10,
                left: 10,
                borderRadius: 999,
                backgroundColor: chip.bg,
                border: `1px solid ${chip.border}`,
                padding: "4px 11px",
                fontSize: "0.62rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.22em",
                color: chip.text,
                backdropFilter: "blur(3px)",
                pointerEvents: "none",
              }}
            >
              {tagLabel}
            </div>

            {/* Logo watermark — only if logoSrc exists */}
            {logoSrc && (
              <div
                style={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  background: "rgba(253,249,241,0.12)",
                  border: "1.5px solid rgba(255,255,255,0.2)",
                  backdropFilter: "blur(4px)",
                  opacity: 0.7,
                  overflow: "hidden",
                  pointerEvents: "none",
                }}
              >
                <Image
                  src={logoSrc}
                  alt={club.logoAlt ?? `${club.name} logo`}
                  fill
                  sizes="52px"
                  style={{ objectFit: "contain" }}
                />
              </div>
            )}

            {/* Text overlay */}
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
                color: `${INK}bb`,
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
              Featured Club
            </span>
            <Link
              href={`/drama-club/${club.slug}`}
              style={{
                fontFamily: FF_GROTESK,
                fontSize: "11px",
                fontWeight: 600,
                color: "#2493a9",
                textDecoration: "none",
                letterSpacing: "0.04em",
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
  const resolvedCauses: { id: string; label: string }[] = [];
  for (const cat of CAUSE_CATEGORIES) {
    const subs = CAUSE_SUBCATEGORIES_BY_CATEGORY[cat.id] ?? [];
    for (const sub of subs) {
      if (causeIdSet.has(sub.id)) {
        resolvedCauses.push({ id: sub.id, label: sub.shortLabel ?? sub.label });
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
    color: INK,
    opacity: 0.45,
    margin: "0 0 0.9rem 0",
  };

  return (
    <section
      style={{
        backgroundColor: "#faf8f5",
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
            color: INK,
            opacity: 0.5,
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
              {/* Featured cause card */}
              {featuredCause && (
                <div
                  style={{
                    padding: "1.1rem 1.4rem",
                    borderRadius: "10px",
                    background: "rgba(108,0,175,0.05)",
                    border: "1px solid rgba(108,0,175,0.18)",
                    marginBottom:
                      otherClubs.length > 0 || otherCauses.length > 0 ? "1.5rem" : 0,
                    transition: "background 160ms, border-color 160ms",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(108,0,175,0.09)";
                    e.currentTarget.style.borderColor = "rgba(108,0,175,0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(108,0,175,0.05)";
                    e.currentTarget.style.borderColor = "rgba(108,0,175,0.18)";
                  }}
                >
                  <p
                    style={{
                      fontFamily: FF_GROTESK,
                      fontSize: "0.65rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.18rem",
                      fontWeight: 600,
                      color: "#6C00AF",
                      margin: "0 0 0.45rem 0",
                    }}
                  >
                    Featured Cause
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
                        color: INK,
                        margin: 0,
                        lineHeight: 1.3,
                        transition: "color 140ms",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "#6C00AF"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = INK; }}
                    >
                      {featuredCause.label}
                    </p>
                  </Link>
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
                          background: "rgba(36,147,169,0.06)",
                          border: "1px solid rgba(36,147,169,0.16)",
                          fontFamily: FF_GROTESK,
                          fontSize: "0.72rem",
                          fontWeight: 600,
                          color: `${INK}99`,
                          flexShrink: 0,
                        }}
                      >
                        +{chipOverflow} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Other causes pills */}
              {otherCauses.length > 0 && (
                <div>
                  {/* Show label when there's no featured cause card above to provide context */}
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
                          color: INK,
                          background: "rgba(36,17,35,0.07)",
                          border: "1px solid rgba(36,17,35,0.13)",
                          textDecoration: "none",
                          transition: "background 140ms, border-color 140ms",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(36,17,35,0.14)";
                          e.currentTarget.style.borderColor = "rgba(36,17,35,0.22)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "rgba(36,17,35,0.07)";
                          e.currentTarget.style.borderColor = "rgba(36,17,35,0.13)";
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
