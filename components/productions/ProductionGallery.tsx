"use client";

import { useState } from "react";
import Image from "next/image";
import Lightbox from "@/components/shared/Lightbox";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "-");

export type GalleryImage = { src: string; alt: string };

type ProductionGalleryProps = {
  images: GalleryImage[];
  title?: string;
  photographer?: string | null;
  photographerHref?: string;
  albumHref?: string | null;
  albumLabel?: string;
};

export default function ProductionGallery({
  images,
  title,
  photographer,
  photographerHref,
  albumHref,
  albumLabel = "View full photo album",
}: ProductionGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  if (!images?.length) return null;

  const lightboxImages = images.map((img) => img.src);
  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const hasAlbumLink = !!albumHref;

  const isFieldGallery = !!title && title.includes("— From the Field");
  const baseTitle = isFieldGallery
    ? title.replace(" — From the Field", "")
    : title;

  return (
    <>
      {/* Single hairline ABOVE header; no extra section-block here */}
      <div className="row rowFull gallery-row">
        <section className="pg-wrapper" aria-label="Production gallery">
          {/* Header */}
          <div className="pg-header">
            <h2 className="pg-heading">
              {isFieldGallery ? "From the Field" : "Production Gallery"}
            </h2>
            <div className="pg-meta">
              {photographer ? (
                <p className="pg-credit">
                  <span className="pg-credit-label">
                    Production Photography by
                  </span>
                  <a
                    href={photographerHref || `/alumni/${slugify(photographer)}`}
                    className="pg-credit-link"
                  >
                    <span className="pg-credit-name">{photographer}</span>
                  </a>
                </p>
              ) : (
                baseTitle && (
                  <p className="pg-credit pg-credit-muted">
                    The journey of{" "}
                    <span className="pg-credit-name-static">{baseTitle}</span>
                  </p>
                )
              )}
            </div>
          </div>

          {/* ✅ iMessage-style swipeable photo pile */}
          <div className="pg-strip" role="list">
            {images.map((img, idx) => (
              <button
                key={img.src}
                type="button"
                className="pg-card"
                onClick={() => openLightbox(idx)}
                aria-label={`Open image ${idx + 1} in gallery`}
                role="listitem"
              >
                <div className="pg-card-inner">
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    className="pg-img"
                    sizes="(min-width: 1024px) 240px, (min-width: 640px) 33vw, 80vw"
                    priority={idx < 2}
                    style={{ objectFit: "cover", objectPosition: "center" }}
                  />
                  <span className="pg-sheen" />
                </div>
              </button>
            ))}

            {/* Album tile (no overlap) */}
            {hasAlbumLink && (
              <a
                href={albumHref!}
                className="pg-card pg-card-album"
                target="_blank"
                rel="noreferrer"
                role="listitem"
              >
                <div className="pg-card-inner pg-card-inner-album">
                  <p className="pg-album-text">
                    {albumLabel}
                    <span className="pg-album-arrow">↗</span>
                  </p>
                  {baseTitle && (
                    <p className="pg-album-sub">
                      See all photos from
                      <br /> {baseTitle.toUpperCase()}.
                    </p>
                  )}
                </div>
              </a>
            )}
          </div>
        </section>
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          images={lightboxImages}
          startIndex={lightboxIndex}
          onClose={closeLightbox}
        />
      )}

      <style jsx>{`
        .gallery-row {
          overflow: visible;
        }

        .pg-wrapper {
          width: 100%;
          margin-top: 0.2rem;
          overflow: visible;
          border-top: 1px solid #2411231f;
          padding-top: 14px;
          padding-left: 0;
          padding-right: 0;
          padding-bottom: 1.6rem;
        }

        .pg-header {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 0.75rem;
        }

        .pg-heading {
          margin: 0;
          font-family: "DM Sans", system-ui, sans-serif;
          font-size: 0.86rem;
          text-transform: uppercase;
          letter-spacing: 0.22em;
          color: #241123b3;
          font-weight: 700;
        }

        .pg-meta {
          text-align: right;
        }
        .pg-credit {
          margin: 0;
          font-family: "Space Grotesk", system-ui, sans-serif;
          font-size: 0.78rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #24112380;
          white-space: nowrap;
        }
        .pg-credit-muted {
          letter-spacing: 0.18em;
        }
        .pg-credit-label {
          opacity: 0.75;
          margin-right: 0.45em;
        }

        .pg-credit-link {
          color: #6c00af;
          text-decoration: none;
          margin-left: 0.35em;
        }

        .pg-credit-name {
          display: inline-block;
          padding-inline: 2px;
          transform-origin: center center;
          transition: transform 160ms ease, color 160ms ease, opacity 160ms ease;
          color: #6c00af;
          font-weight: 700;
        }

        .pg-credit-name-static {
          display: inline-block;
          padding-inline: 2px;
          color: #241123cc;
          font-weight: 700;
        }

        .pg-credit-link:hover .pg-credit-name {
          color: #f23359;
          transform: scale(1.03);
          opacity: 0.97;
        }

        /* =========================
           ✅ PHOTO PILE SWIPE TRACK
           ========================= */
        .pg-strip {
          --tile: 170px;              /* keep SAME square dimension */
          margin-top: 1.1rem;
          display: flex;
          gap: 0;                     /* overlap handles spacing */
          overflow-x: auto;
          overflow-y: visible;
          padding: 10px 0 8px 6px;    /* tiny left offset like iMessage */
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
        }

        .pg-strip::-webkit-scrollbar {
          height: 8px;
        }
        .pg-strip::-webkit-scrollbar-thumb {
          background: #24112333;
          border-radius: 999px;
        }

        .pg-card {
          flex: 0 0 auto;
          width: var(--tile);
          height: var(--tile);
          border: none;
          padding: 0;
          background: transparent;
          cursor: pointer;
          border-radius: 20px;
          position: relative;
          overflow: visible;
          scroll-snap-align: start;
          transition: transform 220ms ease;
        }

        /* overlap stack */
        .pg-card:not(:first-child) {
          margin-left: -54px; /* controls pile overlap */
        }

        /* stagger + slight rotations for “pile” */
        .pg-card:nth-child(3n + 1) {
          transform: translateY(2px) rotate(-1.2deg);
          z-index: 1;
        }
        .pg-card:nth-child(3n + 2) {
          transform: translateY(-4px) rotate(1deg);
          z-index: 2;
        }
        .pg-card:nth-child(3n) {
          transform: translateY(4px) rotate(-0.6deg);
          z-index: 1;
        }

        .pg-card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: 18px;
          overflow: hidden; /* crop inside */
          background: #050308;
          box-shadow: 0 8px 18px rgba(36, 17, 35, 0.18);
          transform-origin: center center;
          transition: transform 180ms ease, box-shadow 180ms ease, filter 180ms ease;
        }

        /* ✅ ORIGINAL hover vibe: lift + slight scale + front */
        .pg-card:hover {
          z-index: 10;
        }
        .pg-card:hover .pg-card-inner {
          transform: translateY(-6px) scale(1.04);
          box-shadow: 0 14px 28px rgba(36, 17, 35, 0.26);
          filter: saturate(1.03);
        }

        .pg-img {
          display: block;
        }

        /* ✅ ORIGINAL sheen sweep (not the current fade style) */
        .pg-sheen {
          pointer-events: none;
          position: absolute;
          inset: 0;
          background: linear-gradient(
            120deg,
            transparent 0%,
            rgba(255, 255, 255, 0) 35%,
            rgba(255, 255, 255, 0.35) 50%,
            rgba(255, 255, 255, 0) 65%,
            transparent 100%
          );
          transform: translateX(-120%);
          transition: transform 480ms ease;
          mix-blend-mode: screen;
        }
        .pg-card:hover .pg-sheen {
          transform: translateX(120%);
        }

        /* =========================
           Album tile (no overlap / no rotation)
           ========================= */
        .pg-card-album {
          text-decoration: none;
          cursor: pointer;
          margin-left: 14px !important;
          transform: none !important;
          z-index: 0 !important;
        }
        .pg-card-inner-album {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.55rem;
          width: 100%;
          height: 100%;
          border-radius: 18px;
          background: #fdf4dd;
          border: 1px solid #c9a96a;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.6);
          transition: transform 180ms ease, box-shadow 180ms ease;
        }

        .pg-card-album:hover .pg-card-inner-album {
          transform: translateY(-6px) scale(1.04);
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.2),
            inset 0 0 0 1px rgba(255, 255, 255, 0.8);
        }

        .pg-album-text {
          margin: 0;
          font-family: "Space Grotesk", system-ui, sans-serif;
          font-size: 0.86rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #241223 !important;
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          text-align: center;
        }
        .pg-album-arrow {
          font-size: 0.9rem;
        }

        .pg-album-sub {
          margin: 0;
          max-width: 14rem;
          font-family: "Space Grotesk", system-ui, sans-serif;
          font-size: 0.8rem;
          line-height: 1.5;
          color: #7b5a33;
          text-align: center;
        }

        @media (max-width: 768px) {
          .pg-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .pg-meta {
            text-align: left;
          }

          .pg-strip {
            --tile: 150px;          /* same idea, slightly smaller on phones */
            padding-left: 2px;
          }
          .pg-card:not(:first-child) {
            margin-left: -46px;     /* maintain overlap feeling */
          }
        }
      `}</style>
    </>
  );
}
