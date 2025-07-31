"use client";

import { useEffect, useState, useCallback } from "react";
import { useSwipeable } from "react-swipeable";
import LightboxPortal from "@/components/shared/LightboxPortal";
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

  // 🧠 Defensive guard for empty image list
  if (total === 0) return null;

  const goTo = (index: number) => {
    setCurrentIndex((index + total) % total);
  };

  const handleNext = useCallback(() => {
    if (multiple) goTo(currentIndex + 1);
  }, [currentIndex, multiple]);

  const handlePrev = useCallback(() => {
    if (multiple) goTo(currentIndex - 1);
  }, [currentIndex, multiple]);

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

  const currentUrl = images[currentIndex] ?? "";

  return (
    <LightboxPortal>
      <div className="fixed inset-0 z-[99999] grid grid-cols-3 w-screen h-screen">

        {/* Left Panel */}
        <div
          className="w-full h-full z-0"
          onClick={onClose}
          style={{
            backgroundColor: "transparent",
            backdropFilter: "blur(0px)",
            WebkitBackdropFilter: "blur(0px)",
          }}
        />

        {/* Center Panel */}
        <div
          className="flex items-center justify-center col-start-2 z-20"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            marginLeft: "calc(-100vw)",
            marginRight: "calc(-100vw)",
          }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative z-20 max-w-[95vw] max-h-[95vh]"
            style={{ pointerEvents: "auto" }}
            onClick={(e) => e.stopPropagation()}
            {...swipeHandlers}
          >
            <StoryMedia
  imageUrl={currentUrl}
  title={`Media ${currentIndex + 1}`}
  mode="lightbox"
/>

{/* Navigation Dots */}
{multiple && (
  <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-30 flex gap-2">
    {images.map((_, i) => (
      <button
        key={i}
        onClick={() => setCurrentIndex(i)}
        className={`w-3 h-3 rounded-full transition-all duration-200 ${
          i === currentIndex
            ? "bg-[#FFCC00] scale-125 shadow-md"
            : "bg-[#FFCC00]/40 hover:bg-[#FFCC00]/70"
        }`}
        aria-label={`Go to image ${i + 1}`}
      />
    ))}
  </div>
)}
            
          </div>
        </div>

        {/* Right Panel */}
        <div
          className="w-full h-full z-0"
          onClick={onClose}
          style={{
            backgroundColor: "transparent",
            backdropFilter: "blur(0px)",
            WebkitBackdropFilter: "blur(0px)",
          }}
        />
      </div>
    </LightboxPortal>
  );
}
