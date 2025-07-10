"use client";
import React from "react";

interface AlumniProfileBackdropProps {
  backgroundKey?: string;
  children: React.ReactNode;
}

const backgroundMap: Record<string, string> = {
  kraft: "url('/texture/kraft-paper.png')",
  coral: "url('/texture/coral-paper.png')",
  grape: "url('/texture/grape-fiber.png')",
};

export default function AlumniProfileBackdrop({
  backgroundKey = "kraft",
  children,
}: AlumniProfileBackdropProps) {
  const backgroundImage = backgroundMap[backgroundKey] || backgroundMap.kraft;

  return (
    <div className="relative w-full overflow-visible" style={{ zIndex: 0 }}>
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          zIndex: -1,
          backgroundImage,
          backgroundBlendMode: "multiply",
          pointerEvents: "none", // ensure clicks pass through
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
