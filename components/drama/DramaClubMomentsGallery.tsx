// components/drama/DramaClubMomentsGallery.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Lightbox from "@/components/shared/Lightbox";

type GalleryImage = {
  src: string;
  alt?: string | null;
};

type DramaClubMomentsGalleryProps = {
  images: GalleryImage[];
  clubName: string;
};

const t = (v?: string | null) => (v ?? "").trim();

// Only treat these as “local/public” for next/image.
// (If you later want absolute URLs here, either configure remotePatterns OR route them through your proxy.)
const isLocalPath = (src: string) => {
  const s = t(src);
  return s.startsWith("/");
};

export default function DramaClubMomentsGallery({
  images,
  clubName,
}: DramaClubMomentsGalleryProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [rowCapacity, setRowCapacity] = useState<number>(3);

  // Track broken image srcs so we can drop them cleanly.
  const [brokenSrcs, setBrokenSrcs] = useState<Set<string>>(() => new Set());

  const markBroken = (src: string) => {
    const s = t(src);
    if (!s) return;
    setBrokenSrcs((prev) => {
      if (prev.has(s)) return prev;
      const next = new Set(prev);
      next.add(s);
      return next;
    });
  };

  // Only keep real images (HOOK 1 — unconditional)
  const safeImages = useMemo(() => {
    return images
      .filter((img) => img && typeof img.src === "string" && t(img.src).length > 0)
      .map((img) => ({
        src: t(img.src),
        alt: t(img.alt) || undefined,
      }))
      .filter((img) => !brokenSrcs.has(img.src));
  }, [images, brokenSrcs]);

  // Stable array reference for Lightbox (HOOK 2 — unconditional)
  const lightboxImages = useMemo(() => safeImages.map((img) => img.src), [safeImages]);

  // Responsive row capacity (HOOK 3 — unconditional)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateRowCapacity = () => {
      const w = window.innerWidth;
      if (w < 480) setRowCapacity(1);
      else if (w < 900) setRowCapacity(2);
      else setRowCapacity(3);
    };

    updateRowCapacity();
    window.addEventListener("resize", updateRowCapacity);
    return () => window.removeEventListener("resize", updateRowCapacity);
  }, []);

  // Safety: if images change while lightbox is open, avoid invalid index
  useEffect(() => {
    if (openIndex === null) return;
    if (openIndex < 0 || openIndex >= safeImages.length) {
      setOpenIndex(null);
    }
  }, [openIndex, safeImages.length]);

  // ✅ Early return only AFTER hooks (no conditional hooks)
  if (!safeImages.length) return null;

  const collapsedCount = Math.min(rowCapacity, safeImages.length);
  const visibleImages = expanded ? safeImages : safeImages.slice(0, collapsedCount);

  const hasHiddenImages = safeImages.length > collapsedCount;
  const toggleLabel = expanded ? "SEE LESS" : "SEE MORE";

  return (
    <>
      <section
        className="dc-gallery-section dc-moments-section"
        aria-label="Moments from this club"
      >
        <header className="dc-moments-header">
          <h2 className="dc-section-head font-sans">Moments from this club</h2>
          <p className="dc-moments-subhead">
            Glimpses from <span className="dc-moments-club">{clubName}</span>
          </p>
        </header>

        <div
          className="dc-moments-track"
          role="list"
          aria-label={`Photos from ${clubName} Drama Club`}
        >
          {visibleImages.map((img, i) => {
            const alt = img.alt || `${clubName} Drama Club — photo ${i + 1}`;

            // i matches safeImages index because:
            // - collapsed is slice(0, N)
            // - expanded is full safeImages
            const onOpen = () => setOpenIndex(i);

            return (
              <button
                key={`${img.src}-${i}`}
                type="button"
                className="dc-moments-card"
                onClick={onOpen}
                aria-label={`Open photo ${i + 1} from ${clubName}`}
                role="listitem"
              >
                <div className="dc-moments-img-shell">
                  {isLocalPath(img.src) ? (
                    <Image
                      src={img.src}
                      alt={alt}
                      fill
                      // Square thumbnail look
                      style={{ objectFit: "cover", objectPosition: "center" }}
                      // Tell Next the rendered size so it serves a small file
                      sizes="(max-width: 480px) 92vw, (max-width: 900px) 44vw, 220px"
                      // First image can be higher priority; rest lazy by default
                      priority={i === 0}
                      onError={() => markBroken(img.src)}
                    />
                  ) : (
                    // Fallback for non-local strings (won’t crash next/image if not configured)
                    // NOTE: this WILL download the full file; ideally route these through your proxy or configure next/image.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={img.src}
                      alt={alt}
                      className="dc-moments-img"
                      loading={i === 0 ? "eager" : "lazy"}
                      decoding="async"
                      onError={() => markBroken(img.src)}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {hasHiddenImages && (
          <div className="dc-moments-footer">
            <button
              type="button"
              className="dc-moments-toggle"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
            >
              {toggleLabel}
            </button>
          </div>
        )}
      </section>

      {openIndex !== null && (
        <Lightbox
          images={lightboxImages}
          startIndex={openIndex}
          onClose={() => setOpenIndex(null)}
        />
      )}

      <style jsx>{`
        .dc-moments-section {
          margin-top: clamp(20px, 3vw, 28px);
          border-top: 1px solid rgba(36, 17, 35, 0.12);
          padding-top: 12px;
          padding-bottom: 1.8rem;
        }

        .dc-moments-header {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 0.75rem;
        }

        .dc-moments-subhead {
          margin: 0;
          font-family: var(
            --font-space-grotesk,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif
          );
          font-size: 0.78rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #24112380;
          text-align: right;
          white-space: nowrap;
        }

        .dc-moments-club {
          font-weight: 700;
          color: #241123cc;
        }

        .dc-moments-track {
          margin-top: 12px;
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .dc-moments-card {
          border: none;
          background: transparent;
          padding: 0;
          cursor: pointer;
          flex: 1 1 calc(30% - 10px);
          max-width: 220px;
        }

        .dc-moments-img-shell {
          position: relative;
          width: 100%;
          aspect-ratio: 1 / 1;
          border-radius: 14px;
          overflow: hidden;
          background: #fdfaf7;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.06);
          transition: transform 160ms ease, box-shadow 160ms ease;
        }

        .dc-moments-img-shell::after {
          content: "";
          position: absolute;
          inset: -40%;
          background: linear-gradient(
            120deg,
            transparent 45%,
            rgba(255, 255, 255, 0.1) 50%,
            transparent 55%
          );
          transform: translateX(-60%) rotate(8deg);
          opacity: 0;
          transition: transform 500ms ease, opacity 300ms ease;
          pointer-events: none;
        }

        /* For the <img> fallback only */
        .dc-moments-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          display: block;
        }

        .dc-moments-card:hover .dc-moments-img-shell {
          transform: translateY(-3px) scale(1.03);
          box-shadow: 0 14px 28px rgba(0, 0, 0, 0.18), 0 3px 8px rgba(0, 0, 0, 0.12);
        }

        .dc-moments-card:hover .dc-moments-img-shell::after {
          opacity: 0.6;
          transform: translateX(60%) rotate(8deg);
        }

        .dc-moments-footer {
          margin-top: 8px;
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          font-family: var(--font-space-grotesk, system-ui, sans-serif);
          font-size: 0.74rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-weight: 700;
          color: #24112399;
        }

        .dc-moments-toggle {
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          text-transform: inherit;
          letter-spacing: inherit;
          font: inherit;
          color: #6c00af;
          transition: color 150ms ease, transform 150ms ease, letter-spacing 150ms ease,
            opacity 150ms ease;
        }

        .dc-moments-toggle:hover {
          color: #f23359;
          transform: translateY(-1px);
          letter-spacing: 0.14em;
          opacity: 0.96;
        }

        @media (max-width: 900px) {
          .dc-moments-card {
            flex: 1 1 calc(50% - 10px);
            max-width: 200px;
          }
        }

        @media (max-width: 480px) {
          .dc-moments-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .dc-moments-subhead {
            text-align: left;
            white-space: normal;
          }

          .dc-moments-card {
            flex: 1 1 100%;
            max-width: 100%;
          }
        }
      `}</style>
    </>
  );
}
