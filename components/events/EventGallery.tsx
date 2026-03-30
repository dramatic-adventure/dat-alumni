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

  return (
    <>
      <div className="evd-gallery-head">
        <p className="evd-gallery-eyebrow">Gallery</p>
        {photoCredit ? (
          <p className="evd-gallery-credit">Photos: {photoCredit}</p>
        ) : null}
      </div>

      <div
        className="evd-gallery-scroll"
        role="list"
        aria-label="Production photos"
      >
        {images.map((img, i) => (
          <button
            key={i}
            type="button"
            className="evd-gallery-item evd-gallery-item--btn"
            role="listitem"
            aria-label={`Open photo ${i + 1}${img.alt ? `: ${img.alt}` : ""}`}
            onClick={() => setLightboxIndex(i)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.src}
              alt={img.alt ?? `Production photo ${i + 1}`}
              className="evd-gallery-img"
              loading="lazy"
              decoding="async"
            />
          </button>
        ))}
      </div>

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
