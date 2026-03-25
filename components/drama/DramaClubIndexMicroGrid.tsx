// components/drama/DramaClubIndexMicroGrid.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { DramaClub } from "@/lib/dramaClubMap";
import {
  computeDramaClubStatus,
  type DramaClubStatus,
} from "@/lib/dramaClubStatus";

type DramaClubIndexMicroGridProps = {
  clubs: DramaClub[];
};

const FALLBACK_IMAGE = "/images/drama-clubs/club-fallback.jpg";

const SYSTEM_STACK =
  'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

/* ===============================
   Image helpers
=============================== */

function normalizeLocalSrc(src?: string | null): string | undefined {
  if (!src) return undefined;
  const trimmed = src.trim();
  if (!trimmed) return undefined;

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

// Treat `card-sample` as generic (not custom art) for MICRO cards
function pickHeroImage(club: DramaClub): { src: string; alt: string } {
  const cardImageRaw =
    typeof club.cardImage === "string" && club.cardImage.trim().length > 0
      ? club.cardImage.trim()
      : undefined;

  const isGenericSample =
    cardImageRaw && cardImageRaw.includes("card-sample");

  const heroCandidate =
    typeof club.heroImage === "string" && club.heroImage.trim().length > 0
      ? club.heroImage.trim()
      : undefined;

  const galleryCandidate =
    club.gallery && club.gallery[0]?.src
      ? club.gallery[0].src.trim()
      : undefined;

  const normalizedHero = normalizeLocalSrc(heroCandidate);
  const normalizedGallery = normalizeLocalSrc(galleryCandidate);
  const normalizedCard = !isGenericSample
    ? normalizeLocalSrc(cardImageRaw)
    : undefined;

  // Priority: specific card art → hero → gallery → global fallback
  const src =
    normalizedCard || normalizedHero || normalizedGallery || FALLBACK_IMAGE;

  const alt =
    (club as any).heroAlt ??
    (club.gallery && club.gallery[0]?.alt) ??
    `${club.name} Drama Club`;

  return { src, alt };
}

/* ===============================
   Status helpers
=============================== */

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

const statusOrder: Record<DramaClubStatus, number> = {
  new: 0,
  ongoing: 1,
  legacy: 2,
};

/**
 * How many clubs to show when collapsed:
 * - Phones (<640px): 3  (1 col × 3 rows)
 * - Tablets (640–1023px): 6 (2 cols × 3 rows)
 * - Desktop (≥1024px): 9 (3 cols × 3 rows)
 */
function useBaseVisibleCount() {
  const [count, setCount] = useState<number>(9); // safe default for SSR

  useEffect(() => {
    if (typeof window === "undefined") return;

    const queries: { mql: MediaQueryList; value: number }[] = [
      { mql: window.matchMedia("(max-width: 639px)"), value: 3 },
      {
        mql: window.matchMedia(
          "(min-width: 640px) and (max-width: 1023px)"
        ),
        value: 6,
      },
      { mql: window.matchMedia("(min-width: 1024px)"), value: 9 },
    ];

    const update = () => {
      for (const { mql, value } of queries) {
        if (mql.matches) {
          setCount(value);
          return;
        }
      }
      setCount(9);
    };

    update();

    queries.forEach(({ mql }) => {
      mql.addEventListener("change", update);
    });

    return () => {
      queries.forEach(({ mql }) => {
        mql.removeEventListener("change", update);
      });
    };
  }, []);

  return count;
}

/* ===============================
   Grid wrapper
=============================== */

export default function DramaClubIndexMicroGrid({
  clubs,
}: DramaClubIndexMicroGridProps) {
  // Defensive re-sort in case the caller ever passes unsorted data.
  const sorted = [...clubs].sort((a, b) => {
    const aStatus: DramaClubStatus = computeDramaClubStatus(a);
    const bStatus: DramaClubStatus = computeDramaClubStatus(b);

    const statusDiff = statusOrder[aStatus] - statusOrder[bStatus];
    if (statusDiff !== 0) return statusDiff;

    const aCountry = a.country ?? "";
    const bCountry = b.country ?? "";
    const countryDiff = aCountry.localeCompare(bCountry);
    if (countryDiff !== 0) return countryDiff;

    const aName = a.name ?? "";
    const bName = b.name ?? "";
    return aName.localeCompare(bName);
  });

  const baseVisibleCount = useBaseVisibleCount();
  const [showAll, setShowAll] = useState(false);

  const visibleCount = showAll
    ? sorted.length
    : Math.min(baseVisibleCount, sorted.length);

  const visibleClubs = sorted.slice(0, visibleCount);
  const hasMoreThanBase = sorted.length > baseVisibleCount;

  return (
    <>
      <style>{`
        /* Grid: 1 col mobile, 2 cols tablet, 3 cols desktop */
        .drama-micro-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 56px;
          justify-content: center;
          justify-items: center;
        }

        @media (min-width: 640px) {
          .drama-micro-grid {
            grid-template-columns: repeat(2, minmax(260px, 1fr));
          }
        }

        @media (min-width: 1024px) {
          .drama-micro-grid {
            grid-template-columns: repeat(3, minmax(260px, 1fr));
          }
        }

        .drama-micro-link {
          text-decoration: none;
        }
        .drama-micro-link:hover {
          text-decoration: none;
        }

        .drama-micro-card {
          cursor: pointer;
          transform-origin: center center;
          transition:
            transform 180ms ease-out,
            box-shadow 180ms ease-out;
          box-shadow: 0 18px 40px rgba(0,0,0,0.45);
          border-radius: 26px;
          border: 1px solid rgba(36,17,35,0.25);
          max-width: 360px;
          width: 100%;
          background: transparent;
        }

        .drama-micro-card-bg {
          border-radius: 26px;
          background-color: rgba(253, 249, 241, 1);
          padding: 16px;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          overflow: hidden;
        }

        .drama-micro-card:hover {
          transform: scale(1.04);
          box-shadow: 0 26px 70px rgba(0,0,0,0.6);
        }

        /* IMAGE: 21:9 collapsed, ~4:3 on hover (MiniDramaClubCard height) */
        .drama-micro-img-wrap {
          position: relative;
          width: 100%;
          padding-bottom: 42.857%; /* 21:9 collapsed */
          overflow: hidden;
          border-radius: 18px;
          margin-bottom: 16px;
          transition: padding-bottom 200ms ease-out;
        }

        .drama-micro-card:hover .drama-micro-img-wrap {
          padding-bottom: 75%; /* ~4:3 like MiniDramaClubCard */
        }

        .drama-micro-img {
          transform-origin: center center;
        }

        .drama-micro-card:hover .drama-micro-img {
          animation: drama-kenburns-zoom 44s linear infinite;
        }

        @keyframes drama-kenburns-zoom {
          from { transform: scale(1.02); }
          to   { transform: scale(4); }
        }

        /* EXPANDED SECTION (everything below DAT Drama Club line) */
        .drama-micro-extra {
          max-height: 0;
          overflow: hidden;
          opacity: 0;
          margin-top: 0;
          transition:
            max-height 220ms ease-out,
            opacity 200ms ease-out,
            margin-top 200ms ease-out;
        }

        .drama-micro-card:hover .drama-micro-extra {
          max-height: 900px; /* plenty for full mini-card body */
          opacity: 1;
          margin-top: 12px;
        }

        .drama-micro-button {
          background-color: #2493A9;
          transition:
            background-color 140ms ease-out,
            transform 120ms ease-out;
        }
        .drama-micro-button:hover {
          background-color: #1F7F92;
        }

        /* See more / See fewer button */
        .drama-micro-toggle-wrapper {
          display: flex;
          justify-content: center;
          margin-top: 1.75rem;
        }

        .drama-micro-toggle-button {
          border-radius: 999px;
          border: 1px solid rgba(36,17,35,0.26);
          background-color: #fdf5e6;
          padding: 0.6rem 1.8rem;
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: #241123;
          box-shadow: 0 10px 28px rgba(0,0,0,0.32);
          cursor: pointer;
          outline: none;
          transition:
            border-color 120ms ease-out,
            color 120ms ease-out,
            box-shadow 120ms ease-out,
            transform 120ms ease-out,
            background-color 120ms ease-out;
        }

        .drama-micro-toggle-button:hover {
          border-color: rgba(108,0,175,0.5);
          color: #6C00AF;
          background-color: #fcefdc;
          box-shadow: 0 16px 40px rgba(0,0,0,0.45);
          transform: translateY(-1px);
        }

        .drama-micro-toggle-button:focus-visible {
          box-shadow:
            0 0 0 2px rgba(255,255,255,0.9),
            0 0 0 4px rgba(108,0,175,0.7);
        }
      `}</style>

      <div className="drama-micro-grid">
        {visibleClubs.map((club) => (
          <DramaClubMicroCard key={club.slug} club={club} />
        ))}
      </div>

      {hasMoreThanBase && (
        <div className="drama-micro-toggle-wrapper">
          <button
            type="button"
            className="drama-micro-toggle-button"
            onClick={() => setShowAll((prev) => !prev)}
            style={{
              fontFamily:
                "var(--font-space-grotesk), system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            }}
          >
            {showAll ? "See fewer clubs" : "See more clubs"}
          </button>
        </div>
      )}
    </>
  );
}

/* ===============================
   Individual card
=============================== */

type DramaClubMicroCardProps = {
  club: DramaClub;
};

function DramaClubMicroCard({ club }: DramaClubMicroCardProps) {
  const status: DramaClubStatus = computeDramaClubStatus(club);
  const chip = chipStyles[status];
  const tagLabel = statusLabelMap[status];

  const { src: initialHeroImage, alt: heroAlt } = pickHeroImage(club);
  const [imageSrc, setImageSrc] = useState(initialHeroImage);

  const regionCountry = club.region
    ? `${club.region} · ${club.country}`
    : club.country;

  const shortBlurb = (club as any).shortBlurb ?? club.description;
  const hasStats = !!(club.approxYouthServed || club.showcasesCount);

  return (
    <Link
      href={`/drama-club/${club.slug}`}
      className="drama-micro-link"
      aria-label={club.name}
    >
      <article className="drama-micro-card group">
        <div className="drama-micro-card-bg">
          {/* IMAGE (collapses/expands height) */}
          <div className="drama-micro-img-wrap">
            <Image
              src={imageSrc}
              alt={heroAlt}
              fill
              className="object-cover drama-micro-img"
              onError={() => {
                if (imageSrc !== FALLBACK_IMAGE) {
                  setImageSrc(FALLBACK_IMAGE);
                }
              }}
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

          {/* Always-visible core text (up to DAT Drama Club) */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
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

            {/* Club name (2-line clamp) */}
            <h3
              style={{
                marginTop: "4px",
                marginBottom: 0,
                fontFamily: SYSTEM_STACK,
                fontSize: "1.4rem",
                fontWeight: 700,
                lineHeight: 1.1,
                color: "#241123",
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                wordBreak: "break-word",
              }}
            >
              {club.name}
            </h3>

            {/* DAT identity tag — visible in collapsed & expanded */}
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
          </div>

          {/* Everything below this point is "expanded mini-card mode" */}
          <div className="drama-micro-extra">
            {/* Blurb */}
            {shortBlurb && (
              <p
                style={{
                  marginTop: 0,
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

            {/* STATS */}
            {hasStats && (
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
                    <span
                      style={{ fontSize: "0.95rem", fontWeight: 600 }}
                    >
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
                    <span
                      style={{ fontSize: "0.95rem", fontWeight: 600 }}
                    >
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

            {/* Faux button pinned near bottom in expanded state */}
            <div
              className="drama-micro-button"
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
          </div>
        </div>
      </article>
    </Link>
  );
}
