"use client";

import { useEffect, useState, useCallback } from "react";
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
  const total = images.length;
  const multiple = total > 1;

  const goTo = useCallback(
    (index: number) => {
      setCurrentIndex((index + total) % total);
    },
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

    // Google Drive hotlinks can fail in the browser (redirect/cookie/html response).
    // Routing through Next's image optimizer makes it load reliably (server-side fetch).
    const isDrive =
      u.includes("drive.google.com/uc") ||
      u.includes("drive.google.com/thumbnail") ||
      u.includes("lh3.googleusercontent.com") ||
      u.includes("googleusercontent.com");

    if (isDrive) {
      return `/_next/image?url=${encodeURIComponent(u)}&w=2048&q=75`;
    }

    return u;
  }, []);

  const currentUrlRaw = images[currentIndex] ?? "";
  const currentUrl = toLightboxSrc(currentUrlRaw);

  if (total === 0) return null;

  // a11y helper for side-panels
  const onSidePanelKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <LightboxPortal>
      <div className="fixed inset-0 z-[99999] grid grid-cols-3 w-screen h-screen">
        {/* Left Panel (click/keyboard to close; below image stack) */}
        <div
          className="w-full h-full"
          onClick={onClose}
          onKeyDown={onSidePanelKeyDown}
          role="button"
          aria-label="Close lightbox"
          tabIndex={0}
          style={{
            position: "relative",
            zIndex: 30,
            backgroundColor: "transparent",
            backdropFilter: "blur(0px)",
            WebkitBackdropFilter: "blur(0px)",
            pointerEvents: "auto",
            cursor: "pointer",
          }}
        />

        {/* Center Panel (dim backdrop; image sits above this panel) */}
        <div
          className="flex items-center justify-center col-start-2"
          style={{
            position: "relative",
            zIndex: 20,
            backgroundColor: "rgba(0, 0, 0, 0.75)", // 0.70 OK too
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            marginLeft: "calc(-100vw)",
            marginRight: "calc(-100vw)",
            cursor: "pointer",
          }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
        >
          {/* IMAGE STACK — sits ABOVE side panels and backdrop; clicking image does NOT close */}
          <div
            className="relative max-w-[95vw] max-h-[95vh]"
            style={{ pointerEvents: "auto", zIndex: 50 }}
            onClick={(e) => e.stopPropagation()}
            {...swipeHandlers}
          >
            <StoryMedia
              imageUrl={currentUrl}
              title={`Media ${currentIndex + 1}`}
              mode="lightbox"
            />

            {multiple && (
              <div
                className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50"
                style={{ width: "min(520px, 78vw)" }}
                aria-label={`Image ${currentIndex + 1} of ${total}`}
              >
                <div
                  className="flex items-center gap-2"
                  style={{
                    padding: "10px 12px",
                    borderRadius: 999,
                    background: "rgba(0,0,0,0.35)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                    boxShadow: "0 10px 28px rgba(0,0,0,0.35)",
                  }}
                >
                  {/* segmented bar */}
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

                  {/* compact counter */}
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

        {/* Right Panel (click/keyboard to close; below image stack) */}
        <div
          className="w-full h-full"
          onClick={onClose}
          onKeyDown={onSidePanelKeyDown}
          role="button"
          aria-label="Close lightbox"
          tabIndex={0}
          style={{
            position: "relative",
            zIndex: 30,
            backgroundColor: "transparent",
            backdropFilter: "blur(0px)",
            WebkitBackdropFilter: "blur(0px)",
            pointerEvents: "auto",
            cursor: "pointer",
          }}
        />
      </div>

      {/* Global tweak: kill zoom/magnifier cursor and stray inline gaps on images inside the dialog */}
      <style jsx global>{`
        .col-start-2[role="dialog"] img {
          cursor: default !important;
          display: block;
        }
      `}</style>
    </LightboxPortal>
  );
}
