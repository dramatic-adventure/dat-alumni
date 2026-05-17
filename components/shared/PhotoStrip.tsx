// components/shared/PhotoStrip.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

export type PhotoStripImage = {
  src: string;
  alt: string;
  href?: string;
};

type Props = {
  images?: PhotoStripImage[];
  instagramHandle?: string;
};

const DEFAULT_IMAGES: PhotoStripImage[] = [
  { src: "/images/teaching-amazon.jpg",                           alt: "Teaching in the Amazon" },
  { src: "/images/performing-zanzibar.jpg",                       alt: "Performing in Zanzibar" },
  { src: "/images/teaching-andes.jpg",                            alt: "Teaching in the Andes" },
  { src: "/images/rehearsing-nitra.jpg",                          alt: "Rehearsing in Nitra" },
  { src: "/images/Andean_Mask_Work.jpg",                          alt: "Andean mask work" },
  { src: "/images/projects/archive/ACTion-Tanzania-3-hike.webp", alt: "ACTion Tanzania" },
  { src: "/images/projects/archive/Creative-Trek-Zimbabwe.webp", alt: "Creative Trek Zimbabwe" },
  { src: "/images/theatre/archive/esmeraldas_dumbshow.webp",     alt: "Theatre in Esmeraldas" },
];

// ─── Size constants ────────────────────────────────────────────────────────────
//
// Desktop: strip height = 100vw / 8 = 12.5vw (square cells)
//          logo = 18vw  → always 44% taller than strip → equal bleed = 2.75vw each side
//
// Mobile:  each cell = 50vw × 50vw (2-col grid)
//          logo = 38vw  → covers ~38% of each of the 4 surrounding images from center
//
const LOGO_DESKTOP = "18vw";
const LOGO_MOBILE  = "38vw";

// Glow circle is smaller than the logo — blur spreads it outward
const GLOW_DESKTOP = "12vw";
const GLOW_MOBILE  = "26vw";

export default function PhotoStrip({ images, instagramHandle = "dramaticadventure" }: Props) {
  const [photos, setPhotos]   = useState<PhotoStripImage[]>(images ?? DEFAULT_IMAGES);
  const [isMobile, setMobile] = useState(false);

  // Responsive toggle — conditional render beats CSS show/hide (styled-jsx scoping)
  useEffect(() => {
    const check = () => setMobile(window.innerWidth <= 767);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Instagram feed
  useEffect(() => {
    if (images) return;
    fetch("/api/instagram-feed")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { images?: PhotoStripImage[] } | null) => {
        if (data?.images && data.images.length >= 4) setPhotos(data.images.slice(0, 8));
      })
      .catch(() => {});
  }, [images]);

  const igUrl  = `https://www.instagram.com/${instagramHandle}/`;
  const datUrl = "https://www.dramaticadventure.com";

  const slots: (PhotoStripImage | null)[] = [
    ...photos.slice(0, 8),
    ...Array(Math.max(0, 8 - photos.length)).fill(null),
  ];

  // ─── Desktop square cell ───────────────────────────────────────────────────
  // Aspect ratio via padding-bottom trick: height=0, padding=12.5vw → always square
  const cellStyle: React.CSSProperties = {
    flex: "1 1 0%",
    minWidth: 0,
    position: "relative",
    height: 0,
    paddingBottom: "12.5vw",
    overflow: "hidden",
  };

  const renderDesktopCell = (photo: PhotoStripImage | null, i: number) => {
    if (!photo) return <div key={i} style={{ ...cellStyle, background: "#1a0f1e" }} aria-hidden="true" />;
    return (
      <div key={i} style={cellStyle}>
        <a
          href={photo.href ?? igUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={photo.alt}
          style={{ position: "absolute", inset: 0 }}
          className="ps-cell-link"
        >
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            sizes="12.5vw"
            style={{ objectFit: "cover" }}
            loading={i < 3 ? "eager" : "lazy"}
          />
        </a>
      </div>
    );
  };

  // ─── Mobile square cell ─────────────────────────────────────────────────────
  const renderMobileCell = (photo: PhotoStripImage | null, i: number) => {
    if (!photo) return <div key={i} style={{ background: "#1a0f1e", aspectRatio: "1/1" }} aria-hidden="true" />;
    return (
      <a
        key={i}
        href={photo.href ?? igUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={photo.alt}
        style={{ display: "block", position: "relative", aspectRatio: "1/1", overflow: "hidden" }}
        className="ps-cell-link"
      >
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          sizes="50vw"
          style={{ objectFit: "cover" }}
          loading={i < 2 ? "eager" : "lazy"}
        />
      </a>
    );
  };

  // ─── Logo layer — shared between desktop & mobile ──────────────────────────
  const LogoLayer = ({
    logoSize,
    glowSize,
    overlayStyle,
  }: {
    logoSize: string;
    glowSize: string;
    overlayStyle: React.CSSProperties;
  }) => (
    <Link
      href={datUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Dramatic Adventure Theatre"
      style={overlayStyle}
    >
      {/* Purple glow disc — scales with logo */}
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: glowSize,
          height: glowSize,
          borderRadius: "50%",
          background: "#6C00AF",
          filter: "blur(1.8vw)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
      {/* Logo image — sized in vw so it scales with viewport */}
      <div style={{ width: logoSize, height: logoSize, position: "relative", zIndex: 2, flexShrink: 0 }}>
        <Image
          src="/images/dat-logo7.svg"
          alt="Dramatic Adventure Theatre"
          fill
          style={{ objectFit: "contain", filter: "drop-shadow(0 4px 18px rgba(0,0,0,0.55))" }}
          priority
          className="ps-logo-img"
        />
      </div>
    </Link>
  );

  return (
    <div style={{ position: "relative", width: "100%", overflow: "visible", zIndex: 2 }}>

      {isMobile ? (
        /* ── MOBILE: 2-col square grid, large centered logo ── */
        <div style={{ position: "relative" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", width: "100%" }}>
            {slots.map((p, i) => renderMobileCell(p, i))}
          </div>
          <LogoLayer
            logoSize={LOGO_MOBILE}
            glowSize={GLOW_MOBILE}
            overlayStyle={{
              position: "absolute",
              top: "50%",
              left: "50%",
              // center the logo box on the grid center
              transform: "translate(-50%, -50%)",
              zIndex: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          />
        </div>
      ) : (
        /* ── DESKTOP: full-bleed squares, logo overlaid ─────── */
        <>
          {/* Image row */}
          <div style={{ display: "flex", width: "100%", overflow: "hidden" }}>
            {slots.map((p, i) => renderDesktopCell(p, i))}
          </div>

          {/*
            Logo overlay:
            - top: 50% + translateY(-50%) = exact vertical centre of strip
            - Width/height of the link element = logo size (no padding/gap that would skew the centre)
            - The @handle is absolutely positioned BELOW, outside the centred box
          */}
          <LogoLayer
            logoSize={LOGO_DESKTOP}
            glowSize={GLOW_DESKTOP}
            overlayStyle={{
              position: "absolute",
              left: "22%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              // Size the link element to exactly the logo size so centering is pure
              width: LOGO_DESKTOP,
              height: LOGO_DESKTOP,
            }}
          />
        </>
      )}

      {/* Decorative only — no layout-critical rules */}
      <style jsx>{`
        :global(.ps-cell-link:hover img) {
          transform: scale(1.06);
          filter: brightness(1.1);
          transition: transform 0.45s ease, filter 0.45s ease;
        }
      `}</style>
    </div>
  );
}
