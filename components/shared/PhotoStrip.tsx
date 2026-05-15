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
        {/* Logo block */}
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
            width={130}
            height={130}
            className="strip-logo-img"
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
        {/* Visible handle below grid */}
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
        /* ── Shared ──────────────────────────────────────── */
        .photo-strip {
          width: 100%;
          overflow: hidden;
          background: #1a0f1e;
        }

        .strip-cell {
          position: relative;
          overflow: hidden;
          display: block;
        }
        .strip-cell a {
          display: block;
          width: 100%;
          height: 100%;
          position: absolute;
          inset: 0;
        }
        .strip-cell :global(img) {
          transition: transform 0.4s ease, filter 0.4s ease;
        }
        .strip-cell:hover :global(img) {
          transform: scale(1.06);
          filter: brightness(1.08);
        }
        .strip-cell--empty {
          background: rgba(255,255,255,0.04);
        }

        /* ── Desktop layout ──────────────────────────────── */
        .strip-desktop {
          display: flex;
          align-items: stretch;
          height: ${height}px;
        }

        /* Logo block */
        .strip-logo-block {
          flex-shrink: 0;
          width: 170px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: #241123;
          padding: 16px 12px;
          text-decoration: none;
          border-right: 1px solid rgba(255,255,255,0.07);
          transition: background 0.2s;
        }
        .strip-logo-block:hover {
          background: #2e1630;
        }
        .strip-logo-img {
          filter: drop-shadow(0 2px 8px rgba(0,0,0,0.4));
        }
        .strip-ig-handle {
          font-size: 0.72rem;
          font-family: var(--font-dm-sans, "DM Sans", system-ui, sans-serif);
          font-weight: 600;
          letter-spacing: 0.04em;
          color: rgba(255,204,0,0.85);
          text-transform: lowercase;
        }

        /* Image row */
        .strip-row {
          display: flex;
          flex: 1;
          overflow: hidden;
        }
        .strip-row .strip-cell {
          flex: 1;
          height: ${height}px;
          cursor: pointer;
        }
        .strip-row .strip-cell--empty {
          flex: 1;
          height: ${height}px;
        }

        /* ── Mobile ──────────────────────────────────────── */
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
          }
          .strip-grid .strip-cell,
          .strip-grid .strip-cell--empty {
            height: 28vw;
          }

          /* Logo centered over the 2×4 grid */
          .strip-mobile-logo {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 10;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 110px;
            height: 110px;
            border-radius: 50%;
            /* subtle scrim behind logo so it reads over any image */
            background: radial-gradient(
              circle,
              rgba(26,15,30,0.72) 40%,
              transparent 72%
            );
            padding: 4px;
            transition: transform 0.2s;
          }
          .strip-mobile-logo:hover {
            transform: translate(-50%, -50%) scale(1.05);
          }

          .strip-mobile-handle {
            display: block;
            text-align: center;
            padding: 8px 0 10px;
            font-size: 0.78rem;
            font-family: var(--font-dm-sans, "DM Sans", system-ui, sans-serif);
            font-weight: 600;
            letter-spacing: 0.05em;
            color: rgba(255,204,0,0.85);
            text-decoration: none;
            background: #1a0f1e;
          }
          .strip-mobile-handle:hover {
            color: #ffcc00;
          }
        }

        /* ── Tablet tweak ─────────────────────────────────── */
        @media (min-width: 768px) and (max-width: 1023px) {
          .strip-logo-block {
            width: 140px;
          }
          .strip-desktop {
            height: ${Math.round(height * 0.85)}px;
          }
          .strip-row .strip-cell,
          .strip-row .strip-cell--empty {
            height: ${Math.round(height * 0.85)}px;
          }
        }
      `}</style>
    </div>
  );
}
