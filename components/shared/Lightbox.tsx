"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useSwipeable } from "react-swipeable";
import LightboxPortal from "./LightboxPortal";
import StoryMedia from "@/components/shared/StoryMedia";

interface LightboxProps {
  images: string[];
  startIndex?: number;
  onClose: () => void;
}

export default function Lightbox({
  images,
  startIndex = 0,
  onClose,
}: LightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [imgError, setImgError] = useState(false);
  const total = images.length;
  const multiple = total > 1;

  useEffect(() => {
    setCurrentIndex(startIndex);
    setImgError(false);
  }, [startIndex, images.length]);

  useEffect(() => { setImgError(false); }, [currentIndex]);

  const goTo = useCallback(
    (index: number) => setCurrentIndex((index + total) % total),
    [total]
  );

  const handleNext = useCallback(() => {
    if (multiple) goTo(currentIndex + 1);
  }, [currentIndex, multiple, goTo]);

  const handlePrev = useCallback(() => {
    if (multiple) goTo(currentIndex - 1);
  }, [currentIndex, multiple, goTo]);

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    },
    [onClose, handleNext, handlePrev]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: handleNext,
    onSwipedRight: handlePrev,
    preventScrollOnSwipe: true,
    trackTouch: true,
    trackMouse: true,
  });

  const toLightboxSrc = useCallback((src: string) => {
    const u = (src || "").trim();
    if (!u) return "";

    if (u.startsWith("/api/img")) return u;

    if (u.startsWith("/api/media/thumb")) {
      try {
        const parsed = new URL(u, "http://local");
        // New format: /api/media/thumb/[fileId] — fileId is the last path segment.
        // Legacy format: /api/media/thumb?fileId= — kept for any cached browser URLs.
        const fid = String(
          parsed.pathname.split("/").pop() || parsed.searchParams.get("fileId") || ""
        ).trim();
        if (fid) return `/api/img?fileId=${encodeURIComponent(fid)}`;
      } catch {}
      return u;
    }

    const isDriveLike =
      u.includes("drive.google.com") ||
      u.includes("googleusercontent.com") ||
      u.includes("lh3.googleusercontent.com") ||
      u.includes("lh4.googleusercontent.com") ||
      u.includes("lh5.googleusercontent.com") ||
      u.includes("lh6.googleusercontent.com");

    if (isDriveLike) return `/api/img?url=${encodeURIComponent(u)}`;

    return u;
  }, []);

  const currentUrlRaw = images[currentIndex] ?? "";
  const currentUrl = toLightboxSrc(currentUrlRaw);

  // Bounded preload window: current image + up to 3 prev + up to 3 next.
  // Re-runs every time currentIndex changes so the window slides as the user navigates.
  // For small galleries (≤ 7 images) this naturally covers the whole set; for large
  // galleries it caps at 7 requests, never blasting the whole gallery on open.
  const PRELOAD_WINDOW = 3;
  const windowUrls = useMemo(() => {
    const indices = new Set<number>();
    indices.add(currentIndex);
    for (let offset = 1; offset <= PRELOAD_WINDOW; offset++) {
      indices.add((currentIndex - offset + total) % total);
      indices.add((currentIndex + offset) % total);
    }
    return Array.from(indices)
      .map((i) => toLightboxSrc(images[i] ?? ""))
      .filter(Boolean);
  }, [currentIndex, images, total, toLightboxSrc]);

  if (total === 0) return null;

  const onSidePanelKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <LightboxPortal>
      {/* 3-panel scaffold: guarantees click-out targets exist */}
      <div className="fixed inset-0 z-[999999] grid grid-cols-3 w-screen h-screen">
        {/* LEFT CLICK-OUT PANEL */}
        <div
          className="w-full h-full"
          role="button"
          tabIndex={0}
          aria-label="Close lightbox"
          onClick={onClose}
          onKeyDown={onSidePanelKeyDown}
          style={{
            position: "relative",
            zIndex: 30,
            backgroundColor: "transparent",
            cursor: "pointer",
          }}
        />

        {/* CENTER PANEL: draws the dim/blur backdrop across full viewport */}
        <div
          role="dialog"
          aria-modal="true"
          className="col-start-2 flex items-center justify-center"
          onClick={onClose}
          style={{
            position: "relative",
            zIndex: 35,

            // Make THIS middle cell paint across the entire viewport width.
            marginLeft: "calc(-100vw)",
            marginRight: "calc(-100vw)",

            backgroundColor: "rgba(0, 0, 0, 0.70)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",

            cursor: "pointer",
          }}
        >
          {/* MEDIA + PAGER STACK: sits above click-out panels/backdrop */}
          <div
            style={{
              position: "relative",
              zIndex: 50,
              pointerEvents: "none", // ✅ stack is click-through
              width: "min(92vw, 1200px)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {/* Media box (~80% viewport height), swipe handlers only here */}
            <div
              {...swipeHandlers}
              className="relative w-full overflow-hidden"
              onClick={onClose}
              style={{
                height: "80vh",
                maxHeight: 760,
                cursor: "pointer",
                touchAction: "pan-y",
                pointerEvents: "auto", // ✅ re-enable events for media footprint
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {imgError || !currentUrl ? (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.45)", fontSize: 15 }}>
                  Image unavailable
                </div>
              ) : (
                <StoryMedia
                  imageUrl={currentUrl}
                  title={`Media ${currentIndex + 1}`}
                  mode="lightbox"
                  onError={() => setImgError(true)}
                />
              )}

              {multiple && (
                <button className="lb-arrow-btn" style={{ left: 12 }}
                  onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                  aria-label="Previous image">&#8249;</button>
              )}
              {multiple && (
                <button className="lb-arrow-btn" style={{ right: 12 }}
                  onClick={(e) => { e.stopPropagation(); handleNext(); }}
                  aria-label="Next image">&#8250;</button>
              )}
            </div>

            {/* Pager below with spacing */}
            {multiple && (
              <div
                className="flex justify-center"
                style={{ width: "min(520px, 78vw)", marginTop: 16, pointerEvents: "auto" }}
                aria-label={`Image ${currentIndex + 1} of ${total}`}
              >
                <div
                  className="flex items-center gap-2"
                  style={{
                    padding: "10px 12px",
                    borderRadius: 999,
                    background: "rgba(0,0,0,0.40)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                    boxShadow: "0 10px 28px rgba(0,0,0,0.35)",
                  }}
                  onClick={(e) => e.stopPropagation()}   // ✅ only the pill blocks click-out
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <div
                    className="flex-1"
                    style={{
                      display: "grid",
                      gridTemplateColumns: `repeat(${total}, 1fr)`,
                      gap: 6,
                      alignItems: "center",
                    }}
                  >
                    {images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentIndex(i)}
                        aria-label={`Go to image ${i + 1}`}
                        style={{
                          height: 6,
                          borderRadius: 999,
                          border: "none",
                          cursor: "pointer",
                          background:
                            i === currentIndex
                              ? "rgba(255,204,0,0.95)"
                              : "rgba(255,204,0,0.22)",
                          boxShadow:
                            i === currentIndex
                              ? "0 0 0 1px rgba(255,204,0,0.35), 0 6px 16px rgba(0,0,0,0.35)"
                              : "none",
                          transform:
                            i === currentIndex ? "scaleY(1.15)" : "scaleY(1)",
                          transition:
                            "background 160ms ease, transform 160ms ease, box-shadow 160ms ease",
                        }}
                      />
                    ))}
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.78)",
                      paddingLeft: 10,
                      borderLeft: "1px solid rgba(255,255,255,0.10)",
                      marginLeft: 10,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {currentIndex + 1}/{total}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT CLICK-OUT PANEL */}
        <div
          className="w-full h-full"
          role="button"
          tabIndex={0}
          aria-label="Close lightbox"
          onClick={onClose}
          onKeyDown={onSidePanelKeyDown}
          style={{
            position: "relative",
            zIndex: 30,
            backgroundColor: "transparent",
            cursor: "pointer",
          }}
        />
      </div>

      {/* Windowed preload: current ± 3 images only; slides as the user navigates */}
      <div aria-hidden style={{ display: "none" }}>
        {windowUrls.map((url) => (
          <img key={url} src={url} alt="" />
        ))}
      </div>

      <style jsx global>{`
        .col-start-2[role="dialog"] img {
          cursor: default !important;
          display: block;
        }
        .lb-arrow-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 10;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.18);
          background: rgba(0, 0, 0, 0.48);
          color: #fff;
          font-size: 28px;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          opacity: 0.82;
          transition: opacity 150ms ease, background 150ms ease;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        .lb-arrow-btn:hover,
        .lb-arrow-btn:focus-visible {
          opacity: 1;
          background: rgba(0, 0, 0, 0.70);
          outline: none;
        }
        .lb-arrow-btn:active {
          transform: translateY(-50%) scale(0.93);
        }
      `}</style>
    </LightboxPortal>
  );
}