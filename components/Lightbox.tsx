"use client";
export {}; // ✅ Ensure ES module scope

import { useEffect, useState } from "react";
import LightboxPortal from "./LightboxPortal";
import { useSwipeable } from "react-swipeable";

interface LightboxProps {
  images: string[];
  startIndex?: number;
  onClose: () => void;
}

export default function Lightbox({ images, startIndex = 0, onClose }: LightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(startIndex ?? 0);

  const total = images.length;
  const multiple = total > 1;

  const goTo = (index: number) => {
    setCurrentIndex((index + total) % total);
  };

  const handleNext = () => multiple && goTo(currentIndex + 1);
  const handlePrev = () => multiple && goTo(currentIndex - 1);

  // 🔐 ESC to close
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // 🔒 Prevent body scroll
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

  return (
    <LightboxPortal>
      <div
        className="fixed top-0 left-0 w-screen h-screen z-[99999] flex items-center justify-center"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
        }}
      >
        {/* Image container */}
        <div
          className="relative z-20 max-h-[90vh] max-w-full"
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          {...swipeHandlers}
        >
          <img
            src={images[currentIndex]}
            alt=""
            className="object-contain max-h-[90vh] w-auto"
            style={{
              touchAction: "pinch-zoom",
              cursor: multiple ? "pointer" : "default",
            }}
          />
        </div>

        {/* Dot navigation */}
        {multiple && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  goTo(index);
                }}
                className={`w-2.5 h-2.5 rounded-full transition ${
                  index === currentIndex ? "bg-white" : "bg-white/40"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </LightboxPortal>
  );
}
