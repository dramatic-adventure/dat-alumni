// components/shared/PhotoStrip.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

export type PhotoStripImage = {
  src: string;
  alt: string;
  href?: string; // optional: link to specific IG post
};

type Props = {
  /** Override images entirely — skips the Instagram fetch. */
  images?: PhotoStripImage[];
  /** Instagram handle without @. Defaults to "dramaticadventure". */
  instagramHandle?: string;
};

// ─── Static fallback ──────────────────────────────────────────────────────────
const DEFAULT_IMAGES: PhotoStripImage[] = [
  { src: "/images/teaching-amazon.jpg",                             alt: "Teaching in the Amazon" },
  { src: "/images/performing-zanzibar.jpg",                         alt: "Performing in Zanzibar" },
  { src: "/images/teaching-andes.jpg",                              alt: "Teaching in the Andes" },
  { src: "/images/rehearsing-nitra.jpg",                            alt: "Rehearsing in Nitra" },
  { src: "/images/Andean_Mask_Work.jpg",                            alt: "Andean mask work" },
  { src: "/images/projects/archive/ACTion-Tanzania-3-hike.webp",   alt: "ACTion Tanzania" },
  { src: "/images/projects/archive/Creative-Trek-Zimbabwe.webp",   alt: "Creative Trek Zimbabwe" },
  { src: "/images/theatre/archive/esmeraldas_dumbshow.webp",       alt: "Theatre in Esmeraldas" },
];

export default function PhotoStrip({
  images,
  instagramHandle = "dramaticadventure",
}: Props) {
  const [photos, setPhotos] = useState<PhotoStripImage[]>(
    images ?? DEFAULT_IMAGES
  );

  useEffect(() => {
    if (images) return;
    fetch("/api/instagram-feed")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { images?: PhotoStripImage[] } | null) => {
        if (data?.images && data.images.length >= 4) {
          setPhotos(data.images.slice(0, 8));
        }
      })
      .catch(() => {});
  }, [images]);

  const igUrl = `https://www.instagram.com/${instagramHandle}/`;

  // Always exactly 8 slots
  const slots: (PhotoStripImage | null)[] = [
    ...photos.slice(0, 8),
    ...Array(Math.max(0, 8 - photos.length)).fill(null),
  ];

  // Cell style — must be inline because renderImg is a helper (styled-jsx scoping gap)
  const cellStyle: React.CSSProperties = {
    flex: "1 1 0%",
    minWidth: 0,
    position: "relative",
    overflow: "hidden",
    // aspect-ratio via padding-bottom trick for broad browser support
    paddingBottom: "12.5vw", // 100vw / 8 images = square
    height: 0,
  };
  const emptyCellStyle: React.CSSProperties = {
    ...cellStyle,
    background: "#1a0f1e",
  };

  const renderCell = (photo: PhotoStripImage | null, i: number) => {
    const style = photo ? cellStyle : emptyCellStyle;
    if (!photo) return <div key={i} style={style} aria-hidden="true" />;

    const linkHref = photo.href ?? igUrl;
    return (
      <div key={i} style={style}>
        <a
          href={linkHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={photo.alt}
          style={{
            position: "absolute",
            inset: 0,
            display: "block",
            overflow: "hidden",
          }}
        >
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            sizes="12.5vw"
            style={{
              objectFit: "cover",
              transition: "transform 0.45s ease, filter 0.45s ease",
            }}
            loading={i < 3 ? "eager" : "lazy"}
          />
        </a>
      </div>
    );
  };

  return (
    <div className="photo-strip" role="region" aria-label="Photo gallery">

      {/* ── Full-bleed image row ─────────────────────────── */}
      <div className="strip-row">
        {slots.map((p, i) => renderCell(p, i))}
      </div>

      {/* ── Logo overlay — sits ON TOP of the images ────── */}
      <Link
        href={igUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="strip-logo-overlay"
        aria-label={`@${instagramHandle} on Instagram`}
      >
        {/* Purple glow disc */}
        <span className="strip-logo-glow" aria-hidden="true" />
        {/* Logo */}
        <Image
          src="/images/dat-logo7.svg"
          alt="Dramatic Adventure Theatre"
          width={220}
          height={220}
          className="strip-logo-img"
          priority
        />
        {/* Handle */}
        <span className="strip-ig-handle" aria-hidden="true">
          @{instagramHandle}
        </span>
      </Link>

      {/* ── Mobile grid (2 cols, logo centred) ──────────── */}
      <div className="strip-mobile" aria-hidden="true">
        <div className="strip-mobile-grid">
          {slots.map((p, i) => {
            if (!p) return <div key={i} style={{ background: "#1a0f1e", aspectRatio: "1/1" }} />;
            return (
              <a
                key={i}
                href={p.href ?? igUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "block", position: "relative", aspectRatio: "1/1", overflow: "hidden" }}
              >
                <Image
                  src={p.src}
                  alt={p.alt}
                  fill
                  sizes="50vw"
                  style={{ objectFit: "cover" }}
                  loading={i < 2 ? "eager" : "lazy"}
                />
              </a>
            );
          })}
          {/* Centred logo over the grid */}
          <Link
            href={igUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="strip-mobile-logo"
            tabIndex={-1}
          >
            <span className="strip-logo-glow strip-logo-glow--mobile" aria-hidden="true" />
            <Image src="/images/dat-logo7.svg" alt="" width={120} height={120} />
          </Link>
        </div>
        <p className="strip-mobile-handle">@{instagramHandle}</p>
      </div>

      <style jsx>{`
        /* ── Outer wrapper ─────────────────────────────────
           overflow:visible so logo bleeds above & below     */
        .photo-strip {
          position: relative;
          width: 100%;
          overflow: visible;
          z-index: 2;
        }

        /* ── Full-bleed desktop image row ─────────────────── */
        .strip-row {
          display: flex;
          width: 100%;
          overflow: hidden;
        }
        /* Hover zoom applied via :global since cells use inline styles */
        .strip-row :global(a:hover img) {
          transform: scale(1.06);
          filter: brightness(1.1);
        }

        /* ── Logo overlay ─────────────────────────────────── */
        .strip-logo-overlay {
          position: absolute;
          /* ~22% from left, centred vertically on the strip */
          left: 22%;
          top: 50%;
          transform: translate(-50%, -50%);
          z-index: 6;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          text-decoration: none;
          /* bleed above+below by making this element tall enough */
          padding: 20px 0;
        }

        /* Soft purple glow disc behind the logo */
        .strip-logo-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 320px;
          height: 320px;
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(108, 0, 175, 0.55) 0%,
            rgba(70,  0, 120, 0.3)  38%,
            transparent             70%
          );
          pointer-events: none;
          z-index: -1;
        }

        .strip-logo-img {
          position: relative;
          z-index: 2;
          filter: drop-shadow(0 4px 16px rgba(0,0,0,0.5));
          transition: transform 0.25s ease;
        }
        .strip-logo-overlay:hover .strip-logo-img {
          transform: scale(1.04);
        }

        .strip-ig-handle {
          font-size: 0.68rem;
          font-family: var(--font-dm-sans, "DM Sans", system-ui, sans-serif);
          font-weight: 600;
          letter-spacing: 0.07em;
          color: rgba(255, 204, 0, 0.8);
          text-transform: lowercase;
          position: relative;
          z-index: 2;
          text-shadow: 0 1px 4px rgba(0,0,0,0.7);
        }

        /* ── Hide mobile on desktop ───────────────────────── */
        .strip-mobile { display: none; }

        /* ── Mobile ───────────────────────────────────────── */
        @media (max-width: 767px) {
          .strip-row          { display: none; }
          .strip-logo-overlay { display: none; }
          .strip-mobile       { display: block; position: relative; }

          .strip-mobile-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            width: 100%;
            position: relative;
          }

          .strip-mobile-logo {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 6;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .strip-logo-glow--mobile {
            width: 180px;
            height: 180px;
          }

          .strip-mobile-handle {
            text-align: center;
            padding: 7px 0 8px;
            margin: 0;
            font-size: 0.72rem;
            font-family: var(--font-dm-sans, "DM Sans", system-ui, sans-serif);
            font-weight: 600;
            letter-spacing: 0.06em;
            color: rgba(255, 204, 0, 0.85);
            background: #241123;
          }
        }

        /* ── Tablet: slightly smaller logo ───────────────── */
        @media (min-width: 768px) and (max-width: 1023px) {
          .strip-logo-overlay {
            left: 20%;
          }
          .strip-logo-glow {
            width: 240px;
            height: 240px;
          }
        }
      `}</style>
    </div>
  );
}
