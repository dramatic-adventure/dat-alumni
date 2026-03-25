// components/drama/MiniDramaClubCard.tsx

"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { DramaClub } from "@/lib/dramaClubMap";
import {
  computeDramaClubStatus,
  type DramaClubStatus,
} from "@/lib/dramaClubStatus";

type MiniDramaClubCardProps = {
  club: DramaClub;
  /**
   * full  = normal card (featured & detail grids)
   * micro = collapsed height version used in the index grid
   */
  variant?: "full" | "micro";
  /** Used only when variant === "micro" */
  onClick?: () => void;
};

const FALLBACK_IMAGE = "/images/drama-clubs/club-fallback.jpg";

// Small helper to centralize hero + alt fallback logic
function pickHeroImage(club: DramaClub): { src: string; alt: string } {
  // Prefer explicit cardImage, then heroImage
  const rawHero =
    typeof club.cardImage === "string" && club.cardImage.trim().length > 0
      ? club.cardImage.trim()
      : typeof club.heroImage === "string" && club.heroImage.trim().length > 0
      ? club.heroImage.trim()
      : undefined;

  // Then fall back to first gallery image
  const gallerySrc =
    club.gallery && club.gallery[0]?.src
      ? club.gallery[0].src.trim()
      : undefined;

  // Normalize to root-relative URLs
  const hero =
    rawHero && !rawHero.startsWith("/") ? `/${rawHero}` : rawHero;
  const gallery =
    gallerySrc && !gallerySrc.startsWith("/") ? `/${gallerySrc}` : gallerySrc;

  const src = hero ?? gallery ?? FALLBACK_IMAGE;

  const alt =
    (club as any).heroAlt ??
    (club.gallery && club.gallery[0]?.alt) ??
    `${club.name} Drama Club`;

  return { src, alt };
}

// Color-coded styles for the status chip
const chipStyles: Record<
  DramaClubStatus,
  { bg: string; text: string; border: string }
> = {
  new: {
    bg: "rgba(242, 51, 89, 0.15)",
    text: "#F23359",
    border: "rgba(242, 51, 89, 0.55)",
  },
  ongoing: {
    bg: "rgba(255, 204, 0, 0.18)",
    text: "#8A6400",
    border: "#8A6400",
  },
  legacy: {
    bg: "rgba(108, 0, 175, 0.22)",
    text: "#3B1D59",
    border: "rgba(108, 0, 175, 0.7)",
  },
};

const statusLabelMap: Record<DramaClubStatus, string> = {
  new: "NEW",
  ongoing: "ONGOING",
  legacy: "LEGACY",
};

const SYSTEM_STACK =
  'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

export default function MiniDramaClubCard({
  club,
  variant = "full",
  onClick,
}: MiniDramaClubCardProps) {
  const isMicro = variant === "micro";

  // 🔹 Compute status instead of reading club.status
  const status: DramaClubStatus = computeDramaClubStatus(club);
  const chip = chipStyles[status];
  const tagLabel = statusLabelMap[status];

  // ----- Images -----
  const { src: heroImage, alt: heroAlt } = pickHeroImage(club);

  // Runtime fallback if the resolved hero path 404s
  const [imageSrc, setImageSrc] = useState(heroImage);

  const handleImageError = () => {
    if (imageSrc !== FALLBACK_IMAGE) {
      setImageSrc(FALLBACK_IMAGE);
    }
  };

  // ----- Text bits -----
  const regionCountry = club.region
    ? `${club.region} · ${club.country}`
    : club.country;

  const shortBlurb = (club as any).shortBlurb ?? club.description;
  const hasStats = !!(club.approxYouthServed || club.showcasesCount);

  const showBlurb = !!shortBlurb && !isMicro;
  const showStats = hasStats && !isMicro;
  const showButton = !isMicro;

  const cardArticle = (
    <article
      className="group drama-card"
      style={{
        borderRadius: "26px",
        border: "1px solid rgba(36,17,35,0.25)",
        padding: 0,
        display: "flex",
        height: "100%",
        boxSizing: "border-box",
        maxWidth: "360px",
        width: "100%",
        boxShadow: "0 18px 40px rgba(0,0,0,0.45)",
      }}
    >
      <div
        className="drama-card-bg"
        style={{
          borderRadius: "26px",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          flex: 1,
          boxSizing: "border-box",
          backgroundColor: "rgba(253, 249, 241, 1)",
        }}
      >
        {/* IMAGE BLOCK */}
        <div
          style={{
            position: "relative",
            width: "100%",
            paddingBottom: "75%",
            overflow: "hidden",
            borderRadius: "18px",
            marginBottom: isMicro ? "10px" : "16px",
          }}
        >
          <Image
            src={imageSrc}
            alt={heroAlt}
            fill
            className="object-cover drama-card-img"
            onError={handleImageError}
          />

          {/* Status chip */}
          <div
            style={{
              position: "absolute",
              top: "10px",
              left: "10px",
              borderRadius: "999px",
              backgroundColor: chip.bg,
              border: `1px solid ${chip.border}`,
              padding: "4px 11px",
              fontSize: "0.62rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.22em",
              color: chip.text,
              pointerEvents: "none",
              backdropFilter: "blur(3px)",
            }}
          >
            {tagLabel}
          </div>
        </div>

        {/* BODY */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
            }}
          >
            {/* Region / country line */}
            <div
              style={{
                fontFamily: SYSTEM_STACK,
                fontSize: "0.7rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.22em",
                color: "#6C00AF",
              }}
            >
              {regionCountry}
            </div>

            {/* Club name */}
            <h3
              style={{
                marginTop: "4px",
                marginBottom: 0,
                fontFamily: SYSTEM_STACK,
                fontSize: "1.4rem",
                fontWeight: 700,
                lineHeight: 1.1,
                color: "#241123",
              }}
            >
              {club.name}
            </h3>

            {/* DAT identity tag */}
            <div
              style={{
                marginTop: "6px",
                fontFamily: SYSTEM_STACK,
                fontSize: "0.65rem",
                textTransform: "uppercase",
                letterSpacing: "0.22em",
                color: "rgba(60, 37, 59, 0.6)",
              }}
            >
              DAT Drama Club
            </div>

            {/* Blurb (only for full variant) */}
            {showBlurb && (
              <p
                style={{
                  marginTop: "12px",
                  marginBottom: 0,
                  fontFamily: SYSTEM_STACK,
                  fontSize: "0.9rem",
                  lineHeight: 1.6,
                  color: "#3c253b",
                }}
              >
                {shortBlurb}
              </p>
            )}

            {/* STATS (only for full variant) */}
            {showStats && (
              <div
                style={{
                  marginTop: "16px",
                  paddingTop: "10px",
                  borderTop: "1px solid #e4d3be",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: "6px",
                  fontFamily: SYSTEM_STACK,
                  fontSize: "0.72rem",
                  color: "#3c253b",
                }}
              >
                {club.approxYouthServed && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: "4px",
                    }}
                  >
                    <span style={{ fontSize: "0.95rem", fontWeight: 600 }}>
                      {club.approxYouthServed}+
                    </span>
                    <span
                      style={{
                        textTransform: "uppercase",
                        letterSpacing: "0.18em",
                      }}
                    >
                      youth reached
                    </span>
                  </div>
                )}
                {club.showcasesCount && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: "4px",
                    }}
                  >
                    <span style={{ fontSize: "0.95rem", fontWeight: 600 }}>
                      {club.showcasesCount}+
                    </span>
                    <span
                      style={{
                        textTransform: "uppercase",
                        letterSpacing: "0.18em",
                      }}
                    >
                      showcases
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Faux button pinned to bottom (only full) */}
          {showButton && (
            <div
              className="drama-card-button"
              style={{
                marginTop: hasStats ? "20px" : "18px",
                display: "inline-flex",
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
                padding: "0.85rem 1.15rem",
                borderRadius: 16,
                fontFamily:
                  'var(--font-dm-sans), "DM Sans", system-ui, sans-serif',
                fontSize: "0.78rem",
                lineHeight: 1.15,
                fontWeight: 800,
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                textDecoration: "none",
                color: "#F2F2F2",
                WebkitTextFillColor: "#F2F2F2",
                boxShadow: "none",
              }}
            >
              View this Drama Club
            </div>
          )}
        </div>
      </div>
    </article>
  );

  return (
    <>
      {/* Local styles: simple hover enlarge, Ken Burns, button hover */}
      <style>{`
        .drama-card-link {
          text-decoration: none;
        }
        .drama-card-link:hover {
          text-decoration: none;
        }

        .drama-card {
          cursor: pointer;
          transform: scale(1);
          transform-origin: center center;
          transition:
            transform 180ms ease-out,
            box-shadow 180ms ease-out;
          box-shadow: 0 18px 40px rgba(0,0,0,0.45);
        }

        .drama-card-bg {
          background-color: rgba(253, 249, 241, 1);
          transition: background-color 160ms ease-out;
        }

        .drama-card-img {
          transform-origin: center center;
        }

        .drama-card:hover {
          transform: scale(1.04);
          box-shadow: 0 26px 70px rgba(0,0,0,0.6);
        }

        .drama-card:hover .drama-card-img {
          animation: drama-kenburns-zoom 44s linear infinite;
        }

        @keyframes drama-kenburns-zoom {
          from { transform: scale(1.02); }
          to   { transform: scale(4); }
        }

        .drama-card-button {
          background-color: #2493A9;
          transition:
            background-color 140ms ease-out,
            transform 120ms ease-out;
        }
        .drama-card-button:hover {
          background-color: #1F7F92;
        }
      `}</style>

      {isMicro ? (
        // MICRO MODE: no Link, parent controls expansion
        <button
          type="button"
          onClick={onClick}
          className="drama-card-link w-full max-w-[360px] text-left"
          aria-label={club.name}
          style={{
            border: "none",
            background: "transparent",
            padding: 0,
            cursor: "pointer",
          }}
        >
          {cardArticle}
        </button>
      ) : (
        // FULL MODE: exactly your existing featured card behaviour
        <Link
          href={`/drama-club/${club.slug}`}
          className="drama-card-link w-full max-w-[360px]"
          aria-label={club.name}
        >
          {cardArticle}
        </Link>
      )}
    </>
  );
}
