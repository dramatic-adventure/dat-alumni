"use client";

import { useState } from "react";
import Image from "next/image";
import type { DramaClub } from "@/lib/dramaClubMap";
import {
  computeDramaClubStatus,
  type DramaClubStatus,
} from "@/lib/dramaClubStatus";

import {
  DRAMA_CLUB_STATUS_META,
  DRAMA_CLUB_STATUS_LABEL,
} from "@/lib/dramaClubStatusStyles";

type MicroDramaClubCardProps = {
  club: DramaClub;
  onClick: () => void;
};

// ✅ Confirmed by you:
const FALLBACK_IMAGE = "/images/drama-clubs/club-fallback.jpg";

function normalizeLocalSrc(src?: string | null): string | undefined {
  if (!src) return undefined;
  const trimmed = src.trim();
  if (!trimmed) return undefined;

  // Allow full URLs just in case
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  // Ensure a single leading slash for public/ assets
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

/**
 * For MICRO cards:
 * - We IGNORE `cardImage` if it's just the generic "card-sample" placeholder.
 * - Prefer heroImage → gallery[0].src → fallback.
 */
function pickHeroImage(club: DramaClub): { src: string; alt: string } {
  const cardImageRaw =
    typeof club.cardImage === "string" && club.cardImage.trim().length > 0
      ? club.cardImage.trim()
      : undefined;

  const isGenericCardSample =
    cardImageRaw && cardImageRaw.includes("card-sample");

  // ⬇️ MICRO CARDS: treat generic card-sample as "no dedicated art"
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

  // If there is a *non*-sample cardImage later you want to honor, you can
  // reintroduce it like:
  //
  // const normalizedCard = !isGenericCardSample
  //   ? normalizeLocalSrc(cardImageRaw)
  //   : undefined;
  //
  // and then prefer normalizedCard here.

  const src = normalizedHero || normalizedGallery || FALLBACK_IMAGE;

  const alt =
    (club as any).heroAlt ??
    (club.gallery && club.gallery[0]?.alt) ??
    `${club.name} Drama Club`;

  return { src, alt };
}

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

export default function MicroDramaClubCard({
  club,
  onClick,
}: MicroDramaClubCardProps) {
  const status: DramaClubStatus = computeDramaClubStatus(club);
const chip = DRAMA_CLUB_STATUS_META[status];
const tagLabel = DRAMA_CLUB_STATUS_LABEL[status];


  const { src: initialHeroImage, alt: heroAlt } = pickHeroImage(club);

  // Keep a src in state in case you still want error fallback
  const [heroImage, setHeroImage] = useState<string>(initialHeroImage);

  const regionCountry = club.region
    ? `${club.region} · ${club.country}`
    : club.country;

  const locationLine =
    club.city && club.city.trim().length > 0
      ? `${club.city}, ${club.country}`
      : club.country;

  return (
    <>
      <style>{`
        .drama-card-micro {
          cursor: pointer;
          transform: scale(1);
          transform-origin: center center;
          transition:
            transform 180ms ease-out,
            box-shadow 180ms ease-out;
          box-shadow: 0 18px 40px rgba(0,0,0,0.36);
        }

        .drama-card-micro:hover {
          transform: scale(1.04);
          box-shadow: 0 26px 70px rgba(0,0,0,0.6);
        }

        .drama-card-micro-bg {
          background-color: rgba(253, 249, 241, 1);
          transition: background-color 160ms ease-out;
        }
      `}</style>

      <article
        className="group drama-card-micro"
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
          }
        }}
        style={{
          borderRadius: "26px",
          border: "1px solid rgba(36,17,35,0.25)",
          padding: 0,
          display: "flex",
          height: "100%",
          boxSizing: "border-box",
          maxWidth: "360px",
        }}
      >
        <div
          className="drama-card-micro-bg"
          style={{
            borderRadius: "26px",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            flex: 1,
            boxSizing: "border-box",
          }}
        >
          {/* IMAGE */}
          <div
            style={{
              position: "relative",
              width: "100%",
              paddingBottom: "42.857%",
              overflow: "hidden",
              borderRadius: "18px",
              marginBottom: "16px",
            }}
          >
            <Image
              key={heroImage} // re-mount if we ever change src
              src={heroImage}
              alt={heroAlt}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
              onError={() => {
                if (heroImage !== FALLBACK_IMAGE) {
                  setHeroImage(FALLBACK_IMAGE);
                }
              }}
            />

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

          {/* TEXT */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
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

            <h3
              style={{
                margin: 0,
                fontFamily: SYSTEM_STACK,
                fontSize: "1.4rem",
                fontWeight: 700,
                lineHeight: 1.1,
                color: "#241123",
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}
            >
              {club.name}
            </h3>

            <div
              style={{
                fontFamily: SYSTEM_STACK,
                fontSize: "0.78rem",
                color: "rgba(60,37,59,0.7)",
                marginTop: "2px",
              }}
            >
              {locationLine}
            </div>
          </div>
        </div>
      </article>
    </>
  );
}
