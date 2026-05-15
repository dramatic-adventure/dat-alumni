// components/shared/PhotoStrip.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

export type PhotoStripImage = {
  src: string;
  alt: string;
  href?: string; // optional link (e.g. to an Instagram post)
};

type Props = {
  /** Override images entirely — skips the Instagram fetch. */
  images?: PhotoStripImage[];
  /** Instagram handle without @. Defaults to "dramaticadventure". */
  instagramHandle?: string;
  /** Height of the desktop strip in px. Defaults to 220. */
  height?: number;
};

// ─── Static fallback (used when no INSTAGRAM_ACCESS_TOKEN is set) ─────────────
const DEFAULT_IMAGES: PhotoStripImage[] = [
  { src: "/images/teaching-amazon.jpg",                               alt: "Teaching in the Amazon" },
  { src: "/images/performing-zanzibar.jpg",                           alt: "Performing in Zanzibar" },
  { src: "/images/teaching-andes.jpg",                                alt: "Teaching in the Andes" },
  { src: "/images/rehearsing-nitra.jpg",                              alt: "Rehearsing in Nitra" },
  { src: "/images/Andean_Mask_Work.jpg",                              alt: "Andean mask work" },
  { src: "/images/projects/archive/ACTion-Tanzania-3-hike.webp",     alt: "ACTion Tanzania hike" },
  { src: "/images/projects/archive/Creative-Trek-Zimbabwe.webp",     alt: "Creative Trek Zimbabwe" },
  { src: "/images/theatre/archive/esmeraldas_dumbshow.webp",         alt: "Theatre in Esmeraldas" },
];

export default function PhotoStrip({
  images,
  instagramHandle = "dramaticadventure",
  height = 220,
}: Props) {
  const [photos, setPhotos] = useState<PhotoStripImage[]>(
    images ?? DEFAULT_IMAGES
  );

  // Try to load Instagram feed; silently fall back to defaults on any error.
  useEffect(() => {
    if (images) return; // caller provided images — don't override
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

  // Pad or trim to exactly 8 slots so the grid math is always clean.
  const slots: (PhotoStripImage | null)[] = [
    ...photos.slice(0, 8),
    ...Array(Math.max(0, 8 - photos.length)).fill(null),
  ];

  // Inline styles for cells — styled-jsx doesn't scope elements returned from
  // helper functions, so layout-critical styles must be inline.
  const cellStyle: React.CSSProperties = {
    flex: "1 1 0%",
    position: "relative",
    overflow: "hidden",
    display: "block",
    minWidth: 0,
  };
  const emptyCellStyle: React.CSSProperties = {
    ...cellStyle,
    background: "rgba(255,255,255,0.04)",
  };
  const mobileCellStyle: React.CSSProperties = {
    position: "relative",
    overflow: "hidden",
  };

  const renderImg = (photo: PhotoStripImage | null, i: number, sizes: string, mobile = false) => {
    const style = mobile ? mobileCellStyle : (photo ? cellStyle : emptyCellStyle);
    if (!photo) return <div key={i} style={style} aria-hidden="true" />;
    const linkHref = photo.href ?? igUrl;
    return (
      <div key={i} style={style}>
        <a
          href={linkHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={photo.alt}
          style={{ position: "absolute", inset: 0, display: "block" }}
        >
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            sizes={sizes}
            style={{ objectFit: "cover", transition: "transform 0.4s ease, filter 0.4s ease" }}
            loading={i < 3 ? "eager" : "lazy"}
          />
        </a>
      </div>
    );
  };

  return (
    <div className="photo-strip" role="region" aria-label="Photo gallery">

      {/* ── DESKTOP ────────────────────────────────────────────── */}
      <div className="strip-desktop">

        {/* Logo block — overflows above + below the strip */}
        <Link
          href={igUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="strip-logo-block"
          aria-label={`@${instagramHandle} on Instagram`}
        >
          <Image
            src="/images/dat-logo7.svg"
            alt="Dramatic Adventure Theatre"
            width={240}
            height={240}
            className="strip-logo-img"
            style={{ position: "relative", zIndex: 2 }}
          />
          <span className="strip-ig-handle" aria-hidden="true">
            @{instagramHandle}
          </span>
        </Link>

        {/* Image row */}
        <div className="strip-row">
          {slots.map((p, i) => renderImg(p, i, "(max-width: 768px) 50vw, 12vw"))}
        </div>

      </div>

      {/* ── MOBILE ─────────────────────────────────────────────── */}
      <div className="strip-mobile" aria-hidden="true">
        <div className="strip-grid">
          {slots.map((p, i) => renderImg(p, i, "50vw", true))}
          {/* Logo floats centered over the grid */}
          <Link
            href={igUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="strip-mobile-logo"
            aria-label={`@${instagramHandle} on Instagram`}
            tabIndex={-1}
          >
            <Image
              src="/images/dat-logo7.svg"
              alt=""
              width={110}
              height={110}
            />
          </Link>
        </div>
        {/* Teal handle band */}
        <Link
          href={igUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="strip-mobile-handle"
          aria-label={`Follow @${instagramHandle} on Instagram`}
        >
          @{instagramHandle}
        </Link>
      </div>

      <style jsx>{`
        /* ══ Outer wrapper ══════════════════════════════════
           overflow: visible so the logo can bleed above/below */
        .photo-strip {
          width: 100%;
          position: relative;
          z-index: 2;
          overflow: visible;
        }

        /* ══ Desktop row ════════════════════════════════════ */
        .strip-desktop {
          display: flex;
          align-items: stretch;
          height: ${height}px;
          background: #241123;
        }

        /* Logo block — clips at the row height but the image
           itself is larger (set in JSX) and overflows visually */
        .strip-logo-block {
          flex-shrink: 0;
          width: 220px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: #241123;
          padding: 0 12px;
          text-decoration: none;
          position: relative;
          overflow: visible;   /* logo bleeds above + below */
          z-index: 3;
          transition: background 0.2s;
        }
        .strip-logo-block:hover {
          background: #2e1630;
        }
        .strip-ig-handle {
          font-size: 0.68rem;
          font-family: var(--font-dm-sans, "DM Sans", system-ui, sans-serif);
          font-weight: 600;
          letter-spacing: 0.05em;
          color: rgba(255, 204, 0, 0.7);
          text-transform: lowercase;
          position: relative;
          z-index: 3;
        }

        /* Image row */
        .strip-row {
          display: flex;
          flex: 1;
          overflow: hidden;
        }

        /* ══ Mobile ═════════════════════════════════════════ */
        .strip-mobile {
          display: none;
        }

        @media (max-width: 767px) {
          .strip-desktop { display: none; }
          .strip-mobile  { display: block; }

          .strip-grid {
            position: relative;
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-template-rows: repeat(4, 28vw);
            background: #241123;
          }

          /* Logo centered over grid, bleeds outward */
          .strip-mobile-logo {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 10;
            width: 130px;
            height: 130px;
            border-radius: 50%;
            background: radial-gradient(
              circle,
              rgba(36, 17, 35, 0.75) 38%,
              transparent 68%
            );
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.2s;
          }
          .strip-mobile-logo:hover {
            transform: translate(-50%, -50%) scale(1.05);
          }

          .strip-mobile-handle {
            display: block;
            text-align: center;
            padding: 8px 0 10px;
            font-size: 0.75rem;
            font-family: var(--font-dm-sans, "DM Sans", system-ui, sans-serif);
            font-weight: 600;
            letter-spacing: 0.05em;
            color: rgba(255, 204, 0, 0.85);
            text-decoration: none;
            background: #241123;
          }
        }

        /* ══ Tablet ════════════════════════════════════════ */
        @media (min-width: 768px) and (max-width: 1023px) {
          .strip-logo-block { width: 180px; }
          .strip-desktop    { height: ${Math.round(height * 0.82)}px; }
        }
      `}</style>
    </div>
  );
}
