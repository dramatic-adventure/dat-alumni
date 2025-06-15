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

  const goTo = (index: number) => {
    setCurrentIndex((index + images.length) % images.length);
  };

  const handleNext = () => goTo(currentIndex + 1);

  // 🔐 ESC to close
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // 🔒 Prevent body scroll while modal is open
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: handleNext,
    onSwipedRight: () => goTo(currentIndex - 1),
    preventScrollOnSwipe: true,
    trackTouch: true,
    trackMouse: true,
  });

  return (
   <LightboxPortal>
  <div
    className="fixed inset-0 z-[99999] w-screen h-[100dvh]"
    role="dialog"
    aria-modal="true"
    onClick={onClose}
  >
    {/* ✅ Dim + Blur background */}
    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-10" />

    {/* ✅ Image on top */}
    <div className="relative z-20 w-full h-full flex items-center justify-center">
      <div onClick={(e) => e.stopPropagation()}>
        <img
          src={images[currentIndex]}
          alt=""
          className="h-[90vh] w-auto object-contain"
        />
      </div>
    </div>
  </div>
</LightboxPortal>
  );
}
