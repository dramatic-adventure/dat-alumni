"use client";
export {}; // ✅ Ensure ES module scope

import { useEffect, useState } from "react";
import LightboxPortal from "@/components/shared/LightboxPortal";
import { useSwipeable } from "react-swipeable";
import StoryMedia from "@/components/shared/StoryMedia";

interface LightboxProps {
  images: string[];
  startIndex?: number;
  onClose: () => void;
}

export default function Lightbox({ images, startIndex = 0, onClose }: LightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(startIndex ?? 0);
  const total = images.length;
  const multiple = total > 1;

  const goTo = (index: number) => setCurrentIndex((index + total) % total);
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
      <div className="fixed inset-0 z-[99999] grid grid-cols-3 w-screen h-screen">
        {/* Left Panel - clickable blur */}
        <div
          className="w-full h-full"
          onClick={onClose}
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
          }}
        />

        {/* Center Panel - your original untouched code */}
        <div
          className="flex items-center justify-center"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
          }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative z-20 max-h-[90vh] max-w-[96vw] pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
            {...swipeHandlers}
          >
            <StoryMedia imageUrl={images[currentIndex]} mode="lightbox" />
          </div>

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

        {/* Right Panel - clickable blur */}
        <div
          className="w-full h-full"
          onClick={onClose}
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
          }}
        />
      </div>
    </LightboxPortal>
  );
}
