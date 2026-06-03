// app/journey-card-mockup/v14/alumni-index/JourneyCardCover.tsx
// ⚠️  MOCKUP ONLY — compact passport-book cover used in the alumni-index
// review pages. Mirrors the V14 cover visual language (hero photo + boundary
// DAT stamp + PASSAGE wordmark) at a thumbnail scale.

"use client";

import Image from "next/image";
import type { SampleJourney } from "./sampleJourneys";
import { A, accentColor } from "./sampleJourneys";

type Size = "sm" | "md" | "lg";

const SIZE_MAP: Record<Size, { w: number; h: number; stamp: number; passage: number; label: number }> = {
  sm: { w: 200, h: 316, stamp: 76,  passage: 28, label: 9 },
  md: { w: 260, h: 412, stamp: 96,  passage: 36, label: 10 },
  lg: { w: 320, h: 508, stamp: 116, passage: 44, label: 11 },
};

const STAMP_SHADOW =
  "drop-shadow(0 2px 4px rgba(36,17,35,0.35)) drop-shadow(0 6px 18px rgba(36,17,35,0.28))";

export default function JourneyCardCover({
  journey,
  size = "md",
  rotation = 0,
  elevated = false,
}: {
  journey:    SampleJourney;
  size?:      Size;
  rotation?:  number;
  elevated?:  boolean;
}) {
  const { w, h, stamp, passage, label } = SIZE_MAP[size];
  const heroH = Math.round(h * 0.55);
  const accent = accentColor(journey.accent);

  return (
    <a
      href={journey.href}
      style={{
        position: "relative",
        width: w, height: h,
        borderRadius: 6, overflow: "hidden",
        backgroundColor: A.bg,
        display: "block", textDecoration: "none",
        border: `1px solid ${A.border}`,
        boxShadow: elevated
          ? "0 18px 50px rgba(36,17,35,0.22), 0 4px 14px rgba(36,17,35,0.10)"
          : "0 8px 30px rgba(36,17,35,0.14), 0 2px 8px rgba(36,17,35,0.06)",
        transform: rotation ? `rotate(${rotation}deg)` : undefined,
        transformOrigin: "center 65%",
        flexShrink: 0,
      }}
      title={`${journey.program} · ${journey.country} ${journey.year}`}
    >
      {/* Hero */}
      <div style={{ width: w, height: heroH, position: "relative", overflow: "hidden" }}>
        <Image
          src={journey.heroSrc}
          alt={`${journey.program} ${journey.country} ${journey.year}`}
          fill
          sizes={`${w * 2}px`}
          quality={92}
          style={{ objectFit: "cover", objectPosition: "center" }}
        />
      </div>

      {/* Boundary DAT stamp */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: "50%", top: heroH,
          transform: "translate(-50%, -50%)",
          width: stamp, height: stamp, zIndex: 5,
        }}
      >
        <Image
          src="/images/dat-logo7.svg"
          alt=""
          width={stamp}
          height={stamp}
          quality={92}
          style={{ width: stamp, height: stamp, display: "block", filter: STAMP_SHADOW }}
        />
      </div>

      {/* Text panel */}
      <div style={{
        position: "absolute", left: 0, right: 0, top: heroH,
        bottom: 0, padding: `${stamp / 2 + 10}px 14px 14px`,
        display: "flex", flexDirection: "column",
        alignItems: "center", textAlign: "center",
      }}>
        <p style={{
          fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
          fontWeight: 700, fontSize: label, letterSpacing: "0.28em",
          textTransform: "uppercase", color: A.pink, margin: "0 0 8px",
        }}>
          Dramatic Adventure Theatre
        </p>

        {/* PASSAGE / Program wordmark */}
        <h2 style={{
          fontFamily: "var(--font-anton), system-ui, sans-serif",
          fontSize: passage, lineHeight: 0.92, color: A.ink,
          margin: "0 0 4px", letterSpacing: "0.01em", textTransform: "uppercase",
        }}>
          {journey.program}
        </h2>

        {/* COUNTRY (program location, V14 keeps this pink) */}
        <p style={{
          fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
          fontWeight: 700, fontSize: Math.round(label * 1.15),
          letterSpacing: "0.26em",
          textTransform: "uppercase", color: A.pink, margin: "0 0 2px",
        }}>
          {journey.country}
        </p>

        {/* Program-year — DAT Blue per V14 */}
        <p style={{
          fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
          fontWeight: 700, fontSize: label,
          letterSpacing: "0.28em",
          textTransform: "uppercase", color: A.teal, margin: 0,
        }}>
          {journey.year}
        </p>

        {/* Spacer */}
        <span style={{ flex: 1 }} />

        {/* Accent rule + role */}
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
          {journey.primaryRole}
        </p>
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
    </a>
  );
}
