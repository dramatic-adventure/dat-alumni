// components/journeys/JourneyCover.tsx
// Production port of the approved v17 mockup `V14StyleCover` — the passport-book
// cover card. Hero photo + boundary DAT stamp + DAT eyebrow + program wordmark +
// COUNTRY + YEAR + role. ALL the information lives on the card, so the index /
// archive render these with NO caption beneath — the cards stand alone.
//
// Reads a live `JourneyCard` (lib/journeyCard.ts). Artist-authored hero photos
// can come from arbitrary hosts, so the hero is a plain <img> (http→https
// normalized); only the local DAT logo SVG uses next/image.

"use client";

import Link from "next/link";
import type { JourneyCard } from "@/lib/journeyCard";
import { A, STAMP_SHADOW, accentColor, safeMediaUrl } from "./journeyTheme";

type Size = "sm" | "md" | "lg";

const SIZE_MAP: Record<Size, { w: number; h: number; stamp: number; passage: number; label: number }> = {
  sm: { w: 200, h: 316, stamp: 76,  passage: 28, label: 9 },
  md: { w: 260, h: 412, stamp: 96,  passage: 36, label: 10 },
  lg: { w: 320, h: 508, stamp: 116, passage: 44, label: 11 },
};

export default function JourneyCover({
  card,
  size = "md",
  rotation = 0,
  elevated = false,
}: {
  card:      JourneyCard;
  size?:     Size;
  rotation?: number;
  elevated?: boolean;
}) {
  const { w, h, stamp, passage, label } = SIZE_MAP[size];
  const accent = accentColor(card.accent);

  // Long-title handling. A multi-word program (e.g. "Teaching Artist Residency")
  // puts its leading words on a small single row and keeps the FINAL word as the
  // big Anton wordmark — and that big word shrinks to fit so it can never spill
  // off the fixed-height card. Single-word programs (PASSAGE, ACTion) render big
  // as-is, with their literal brand casing preserved.
  const words = String(card.program ?? "").trim().split(/\s+/).filter(Boolean);
  const isMultiWord = words.length > 1;
  const leadWords = isMultiWord ? words.slice(0, -1).join(" ") : "";
  const mainWord = isMultiWord ? words[words.length - 1] : (card.program || "");
  const mainFont = mainWord.length > 8 ? Math.round((passage * 8) / mainWord.length) : passage;

  const hero = safeMediaUrl(card.heroUrl);

  const baseShadow = elevated
    ? "0 20px 52px rgba(36,17,35,0.26), 0 5px 16px rgba(36,17,35,0.12)"
    : "0 10px 30px rgba(36,17,35,0.18), 0 3px 10px rgba(36,17,35,0.10)";
  const hoverShadow = "0 26px 60px rgba(36,17,35,0.32), 0 8px 20px rgba(36,17,35,0.16)";
  const baseTransform = rotation ? `rotate(${rotation}deg)` : "";

  return (
    <Link
      href={card.href}
      style={{
        position: "relative",
        // Fluid: renders at its native width when there's room (identical to a
        // fixed size on desktop), but shrinks to fit a narrower parent on phones.
        // aspect-ratio keeps the height proportional as the width shrinks.
        width: w, maxWidth: "100%", aspectRatio: `${w} / ${h}`,
        borderRadius: 6, overflow: "hidden",
        backgroundColor: A.bg,
        display: "block", textDecoration: "none",
        boxShadow: baseShadow,
        transform: baseTransform || undefined,
        transformOrigin: "center 65%",
        transition: "transform 0.32s ease, box-shadow 0.32s ease",
      }}
      title={`${card.program}: ${card.country} ${card.year}`}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.transform = `${baseTransform} translateY(-4px) scale(1.045)`.trim();
        el.style.boxShadow = hoverShadow;
        el.style.zIndex = "6";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.transform = baseTransform;
        el.style.boxShadow = baseShadow;
        el.style.zIndex = "";
      }}
    >
      {/* Hero */}
      <div style={{ width: "100%", height: "55%", position: "relative", overflow: "hidden", backgroundColor: "#e8e2da" }}>
        {hero && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={hero}
            alt={`${card.program} ${card.country} ${card.year}`}
            loading="lazy"
            decoding="async"
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }}
          />
        )}
      </div>

      {/* Boundary DAT stamp */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: "50%", top: "55%",
          transform: "translate(-50%, -50%)",
          width: stamp, height: stamp, zIndex: 5,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/dat-logo7.svg"
          alt=""
          width={stamp}
          height={stamp}
          style={{ width: stamp, height: stamp, display: "block", filter: STAMP_SHADOW }}
        />
      </div>

      {/* Text panel — everything the card needs to stand alone */}
      <div style={{
        position: "absolute", left: 0, right: 0, top: "55%",
        bottom: 0, padding: `${stamp / 2 + 8}px 14px 12px`,
        display: "flex", flexDirection: "column",
        alignItems: "center", textAlign: "center",
      }}>
        <p style={{
          fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
          fontWeight: 700, fontSize: label, letterSpacing: "0.28em",
          textTransform: "uppercase", color: A.pink, margin: "0 0 5px",
        }}>
          Dramatic Adventure Theatre
        </p>

        {isMultiWord && (
          <p style={{
            fontFamily: "var(--font-anton), system-ui, sans-serif",
            fontSize: Math.round(passage * 0.5), letterSpacing: "0.02em",
            textTransform: "none", color: A.ink, opacity: 0.92,
            margin: "0 0 1px", whiteSpace: "nowrap", lineHeight: 1.0,
          }}>
            {leadWords}
          </p>
        )}
        <h2 style={{
          fontFamily: "var(--font-anton), system-ui, sans-serif",
          fontSize: mainFont, lineHeight: 0.92, color: A.ink,
          margin: "0 0 4px", letterSpacing: "0.01em", textTransform: "none",
          whiteSpace: "nowrap",
        }}>
          {mainWord}
        </h2>

        {/* COUNTRY — pink */}
        <p style={{
          fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
          fontWeight: 700, fontSize: Math.round(label * 1.15),
          letterSpacing: "0.26em",
          textTransform: "uppercase", color: A.pink, margin: "0 0 2px",
        }}>
          {card.country}
        </p>

        {/* Year — DAT blue */}
        <p style={{
          fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
          fontWeight: 700, fontSize: label,
          letterSpacing: "0.28em",
          textTransform: "uppercase", color: A.teal, margin: 0,
        }}>
          {card.year}
        </p>

        <span style={{ flex: 1 }} />

        {/* Accent rule + role */}
        {card.primaryRole && (
          <>
            <span
              aria-hidden
              style={{
                display: "block", width: 28, height: 2,
                backgroundColor: accent, borderRadius: 1,
                margin: "0 auto 6px",
              }}
            />
            <p style={{
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              fontStyle: "italic", fontSize: Math.max(9, Math.round(label * 1.1)),
              color: A.ink, opacity: 0.74, margin: 0, lineHeight: 1.3,
            }}>
              {card.primaryRole}
            </p>
          </>
        )}
      </div>

      {/* Soft satin sheen */}
      <span
        aria-hidden
        style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background:
            "linear-gradient(125deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 45%, rgba(255,255,255,0) 65%, rgba(255,255,255,0.06) 100%)",
          mixBlendMode: "screen",
          zIndex: 6,
        }}
      />
    </Link>
  );
}
