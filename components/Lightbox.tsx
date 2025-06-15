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
    onSwipedLeft: () => goTo(currentIndex + 1),
    onSwipedRight: () => goTo(currentIndex - 1),
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
      backgroundColor: "rgba(0, 0, 0, 0.6)", // ✅ Dim
      backdropFilter: "blur(6px)",          // ✅ Blur
      WebkitBackdropFilter: "blur(6px)",    // ✅ Safari fallback
    }}
  >
    <div onClick={(e) => e.stopPropagation()}>
      <img
        src={images[currentIndex]}
        alt=""
        className="h-[90vh] w-auto object-contain"
      />
    </div>
  </div>
</LightboxPortal>

  );
}
