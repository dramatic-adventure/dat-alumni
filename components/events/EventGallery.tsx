"use client";

import { useState } from "react";
import Lightbox from "@/components/shared/Lightbox";

interface GalleryItem {
  src: string;
  alt?: string;
}

interface Props {
  images: GalleryItem[];
  photoCredit?: string;
}

export default function EventGallery({ images, photoCredit }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (!images.length) return null;

  const srcs = images.map((img) => img.src);
  const [featured, ...rest] = images;

  return (
    <>
      <div className="evd-gallery-head">
        <p className="evd-gallery-eyebrow">Gallery</p>
        {photoCredit ? (
          <p className="evd-gallery-credit">Photos: {photoCredit}</p>
        ) : null}
      </div>

      {/* Featured first image — large 16:9 hero */}
      <button
        type="button"
        className="evd-gallery-featured evd-gallery-item--btn"
        aria-label={`Open photo 1${featured.alt ? `: ${featured.alt}` : ""}`}
        onClick={() => setLightboxIndex(0)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={featured.src}
          alt={featured.alt ?? "Production photo 1"}
          className="evd-gallery-img evd-gallery-featured-img"
          loading="lazy"
          decoding="async"
        />
        {/* Hint overlay on hover */}
        <span className="evd-gallery-featured-hint" aria-hidden="true">
          View all photos
        </span>
      </button>

      {/* Strip of remaining images */}
      {rest.length > 0 && (
        <div
          className="evd-gallery-scroll"
          role="list"
          aria-label="More production photos"
        >
          {rest.map((img, i) => (
            <button
              key={i}
              type="button"
              className="evd-gallery-item evd-gallery-item--btn"
              role="listitem"
              aria-label={`Open photo ${i + 2}${img.alt ? `: ${img.alt}` : ""}`}
              onClick={() => setLightboxIndex(i + 1)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.src}
                alt={img.alt ?? `Production photo ${i + 2}`}
                className="evd-gallery-img"
                loading="lazy"
                decoding="async"
              />
            </button>
          ))}
        </div>
      )}

      {lightboxIndex !== null ? (
        <Lightbox
          images={srcs}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      ) : null}
    </>
  );
}
