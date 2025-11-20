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
    .replace(/^-+|-+$/g, "");

export type GalleryImage = { src: string; alt: string };

type ProductionGalleryProps = {
  images: GalleryImage[];
  title?: string;
  /** e.g. "Jane Doe" */
  photographer?: string | null;
  /** Optional override: link directly to a custom URL instead of alumni slug */
  photographerHref?: string;
  /** Full Flickr (or other) album URL */
  albumHref?: string | null;
  /** Optional override copy for the album tile */
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
      {/* Single hairline ABOVE header; no extra section-block here to avoid double line */}
      <div className="row rowFull gallery-row">
        <section className="pg-wrapper" aria-label="Production gallery">
          {/* Header: title + dynamic photographer credit */}
          <div className="pg-header">
            <h2 className="pg-heading">
              {isFieldGallery ? "From the Field" : "Production Gallery"}
            </h2>
            <div className="pg-meta">
              {photographer ? (
                <p className="pg-credit">
                  <span className="pg-credit-label">
                    Production Photography by</span>
                  <a
                    href={
                      photographerHref || `/alumni/${slugify(photographer)}`
                    }
                    className="pg-credit-link"
                  >
                    <span className="pg-credit-name">{photographer}</span>
                  </a>
                </p>
              ) : (
                baseTitle && (
                  <p className="pg-credit pg-credit-muted">
                    The journey of {" "}
                    <span className="pg-credit-name-static">{baseTitle}</span>
                  </p>
                )
              )}
            </div>
          </div>

          {/* Strip of square tiles (smaller) */}
          <div className="pg-strip">
            {images.map((img, idx) => (
              <button
                key={img.src}
                type="button"
                className="pg-card"
                onClick={() => openLightbox(idx)}
                aria-label={`Open image ${idx + 1} in gallery`}
              >
                <div
  className="pg-card-inner"
  style={{
    position: "relative",      // makes the fill image stay inside this card
    width: "100%",
    paddingBottom: "100%",     // square ratio even before CSS loads
  }}
>
  <Image
    src={img.src}
    alt={img.alt}
    fill
    className="pg-img"
    sizes="(min-width: 1024px) 240px, (min-width: 640px) 33vw, 80vw"
    priority={idx < 2}
    style={{
      objectFit: "cover",
      objectPosition: "center",
    }}
  />
  <span className="pg-sheen" />
</div>
              </button>
            ))}

            {/* Album tile at the end (only if albumHref provided) */}
            {hasAlbumLink && (
              <a
                href={albumHref!}
                className="pg-card pg-card-album"
                target="_blank"
                rel="noreferrer"
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

          /* Single divider line above this block */
          border-top: 1px solid #2411231f;
          padding-top: 14px;

          /* No horizontal padding – align with white card edges */
          padding-left: 0;
          padding-right: 0;

          /* Keep a bit of vertical breathing room */
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

        /* LINKED name (photographer) – purple */
        .pg-credit-name {
          display: inline-block;
          padding-inline: 2px;
          transform-origin: center center;
          transition: transform 160ms ease, color 160ms ease, opacity 160ms ease;
          color: #6c00af;
          font-weight: 700;
        }

        /* STATIC name (Moments from TITLE) – neutral, not a link */
        .pg-credit-name-static {
          display: inline-block;
          padding-inline: 2px;
          transform-origin: center center;
          transition: color 160ms ease, opacity 160ms ease;
          color: #241123cc;
          font-weight: 700;
        }

        /* Hover for linked photographer only */
        .pg-credit-link:hover .pg-credit-name {
          color: #f23359;
          transform: scale(1.03);
          opacity: 0.97;
        }

        /* Smaller squares */
        .pg-strip {
  margin-top: 1.3rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1.1rem;
  overflow: visible;
  justify-content: flex-start; /* NEW: keep cards from stretching weirdly */
}

.pg-card {
  position: relative;
  border: none;
  padding: 0;
  background: transparent;
  cursor: pointer;
  border-radius: 20px;
  box-shadow: 0 12px 26px rgba(0, 0, 0, 0.26);
  overflow: visible;
  transition: transform 220ms ease, box-shadow 220ms ease;

  max-width: 260px;         /* NEW: cap card width so it can't fill the white card */
  width: 100%;
  justify-self: flex-start; /* NEW: align each tile to the left within its grid cell */
}


        .pg-card-inner {
          position: relative;
          aspect-ratio: 1 / 1;
          border-radius: 18px;
          overflow: hidden; /* crop inside, but allow outer lift */
          background: #050308;
          transform-origin: center center;
          transition: transform 260ms ease, box-shadow 260ms ease;
          cursor: pointer;
        }

        .pg-card:hover .pg-card-inner {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 16px 34px rgba(0, 0, 0, 0.32);
        }

        .pg-img {
          display: block;
        }

        /* Sheen: a bit faster + natural */
        .pg-sheen {
          pointer-events: none;
          position: absolute;
          inset: -25%;
          background: linear-gradient(
            120deg,
            rgba(255, 255, 255, 0) 15%,
            rgba(255, 255, 255, 0.26) 40%,
            rgba(255, 255, 255, 0) 70%
          );
          mix-blend-mode: screen;
          opacity: 0;
          transform: translateX(-120%) rotate(2deg);
          transition: transform 650ms ease, opacity 360ms ease;
        }
        .pg-card:hover .pg-sheen {
          opacity: 0.6;
          transform: translateX(0%) rotate(2deg);
        }

        /* Album tile – whole square is the pill/button */
        .pg-card-album {
          text-decoration: none;
          cursor: pointer;
        }
        .pg-card-inner-album {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.55rem;
          min-height: 150px;
          border-radius: 18px;
          background: #fdf4dd;
          border: 1px solid #c9a96a;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.6);
        }

        .pg-card-album:hover .pg-card-inner-album {
          transform: translateY(-3px) scale(1.02);
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
        }
      `}</style>
    </>
  );
}
