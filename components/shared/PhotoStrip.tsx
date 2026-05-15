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

export default function PhotoStrip({ images, instagramHandle = "dramaticadventure" }: Props) {
  const [photos, setPhotos] = useState<PhotoStripImage[]>(images ?? DEFAULT_IMAGES);
  const [isMobile, setIsMobile] = useState(false);

  // Detect viewport — drives conditional render instead of CSS show/hide
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 767);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Instagram feed fetch
  useEffect(() => {
    if (images) return;
    fetch("/api/instagram-feed")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { images?: PhotoStripImage[] } | null) => {
        if (data?.images && data.images.length >= 4) setPhotos(data.images.slice(0, 8));
      })
      .catch(() => {});
  }, [images]);

  const igUrl = `https://www.instagram.com/${instagramHandle}/`;

  const slots: (PhotoStripImage | null)[] = [
    ...photos.slice(0, 8),
    ...Array(Math.max(0, 8 - photos.length)).fill(null),
  ];

  // ─── Cell style (inline — avoids styled-jsx scoping gaps) ──────────────────
  // Square via padding-bottom trick: height=0, paddingBottom=12.5vw (100vw/8)
  const cellStyle: React.CSSProperties = {
    flex: "1 1 0%",
    minWidth: 0,
    position: "relative",
    height: 0,
    paddingBottom: "12.5vw",
    overflow: "hidden",
  };

  const renderCell = (photo: PhotoStripImage | null, i: number) => {
    if (!photo) {
      return <div key={i} style={{ ...cellStyle, background: "#1a0f1e" }} aria-hidden="true" />;
    }
    return (
      <div key={i} style={cellStyle}>
        <a
          href={photo.href ?? igUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={photo.alt}
          style={{ position: "absolute", inset: 0 }}
          className="strip-cell-link"
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

  // ─── Mobile cell ───────────────────────────────────────────────────────────
  const renderMobileCell = (photo: PhotoStripImage | null, i: number) => {
    if (!photo) {
      return <div key={i} style={{ background: "#1a0f1e", aspectRatio: "1/1" }} aria-hidden="true" />;
    }
    return (
      <a
        key={i}
        href={photo.href ?? igUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={photo.alt}
        style={{ display: "block", position: "relative", aspectRatio: "1/1", overflow: "hidden" }}
        className="strip-cell-link"
      >
        <Image src={photo.src} alt={photo.alt} fill sizes="50vw" style={{ objectFit: "cover" }} loading={i < 2 ? "eager" : "lazy"} />
      </a>
    );
  };

  // ─── Logo overlay — ALL positioning via inline style ──────────────────────
  const logoOverlayStyle: React.CSSProperties = {
    position: "absolute",
    left: "22%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    zIndex: 6,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
    textDecoration: "none",
    padding: "24px 0",
  };

  return (
    <div style={{ position: "relative", width: "100%", overflow: "visible", zIndex: 2 }}>

      {isMobile ? (
        /* ── MOBILE ── 2-col square grid, logo centred ─── */
        <div style={{ position: "relative" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", width: "100%" }}>
            {slots.map((p, i) => renderMobileCell(p, i))}
          </div>
          {/* Logo centred over the grid */}
          <Link
            href={igUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label={`@${instagramHandle} on Instagram`}
          >
            <span className="strip-glow strip-glow--mobile" aria-hidden="true" />
            <Image src="/images/dat-logo7.svg" alt="Dramatic Adventure Theatre" width={120} height={120} style={{ position: "relative", zIndex: 2 }} />
          </Link>
          <p style={{ textAlign: "center", margin: 0, padding: "7px 0 8px", fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.06em", color: "rgba(255,204,0,0.85)", background: "#241123" }}>
            @{instagramHandle}
          </p>
        </div>
      ) : (
        /* ── DESKTOP ── full-bleed squares, logo overlaid ─ */
        <>
          {/* Image row */}
          <div style={{ display: "flex", width: "100%", overflow: "hidden" }}>
            {slots.map((p, i) => renderCell(p, i))}
          </div>

          {/* Logo overlay */}
          <Link
            href={igUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={logoOverlayStyle}
            aria-label={`@${instagramHandle} on Instagram`}
            className="strip-logo-overlay"
          >
            {/* Purple glow disc */}
            <span className="strip-glow" aria-hidden="true" />
            <Image
              src="/images/dat-logo7.svg"
              alt="Dramatic Adventure Theatre"
              width={230}
              height={230}
              priority
              style={{ position: "relative", zIndex: 2, filter: "drop-shadow(0 4px 18px rgba(0,0,0,0.55))" }}
              className="strip-logo-img"
            />
            <span style={{
              fontSize: "0.68rem",
              fontFamily: 'var(--font-dm-sans, "DM Sans", system-ui, sans-serif)',
              fontWeight: 600,
              letterSpacing: "0.07em",
              color: "rgba(255,204,0,0.8)",
              textTransform: "lowercase",
              position: "relative",
              zIndex: 2,
              textShadow: "0 1px 4px rgba(0,0,0,0.7)",
            }}>
              @{instagramHandle}
            </span>
          </Link>
        </>
      )}

      {/* Decorative styles only — no layout-critical rules here */}
      <style jsx>{`
        /* Hover zoom on images */
        :global(.strip-cell-link:hover img) {
          transform: scale(1.06);
          filter: brightness(1.1);
          transition: transform 0.45s ease, filter 0.45s ease;
        }

        /* Logo hover */
        :global(.strip-logo-overlay:hover .strip-logo-img) {
          transform: scale(1.04);
          transition: transform 0.25s ease;
        }

        /* Purple glow disc behind logo */
        :global(.strip-glow) {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 340px;
          height: 340px;
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(108, 0, 175, 0.6) 0%,
            rgba(70,  0, 120, 0.32) 38%,
            transparent 68%
          );
          pointer-events: none;
          z-index: 1;
        }
        :global(.strip-glow--mobile) {
          width: 200px;
          height: 200px;
        }
      `}</style>
    </div>
  );
}
