"use client";

import Image from "next/image";

interface ImageCarouselProps {
  images?: string[];
  onImageClick?: (index: number) => void;
  /** CSS aspect-ratio for each thumb (w/h). e.g. "4 / 3" or "1 / 1" */
  aspectRatio?: string;
  /** Optional sizes hint for responsive loading */
  sizes?: string;
}

export default function ImageCarousel({
  images,
  onImageClick,
  aspectRatio = "4 / 3",
  sizes = "(min-width: 768px) 50vw, 100vw",
}: ImageCarouselProps) {
  if (!images?.length) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {images.map((url, idx) => {
        // Basic alt from filename if nothing better is available
        const alt =
          `Image ${idx + 1}` ||
          url.split("/").pop()?.split("?")[0]?.replace(/[-_]/g, " ") ||
          "Gallery image";

        return (
          <div
            key={`${url}-${idx}`}
            className="relative rounded shadow cursor-pointer overflow-hidden"
            style={{ aspectRatio }}
            role="button"
            tabIndex={0}
            aria-label={`Open image ${idx + 1}`}
            onClick={() => onImageClick?.(idx)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onImageClick?.(idx);
              }
            }}
          >
            <Image
              src={url}
              alt={alt}
              fill
              sizes={sizes}
              className="object-cover"
              loading="lazy"
              decoding="async"
              // If some URLs might be http://, let Next handle, or normalize before passing in
              // unoptimized // <-- leave commented; enable only if an external domain isn't in next.config images.remotePatterns
            />
          </div>
        );
      })}
    </div>
  );
}
