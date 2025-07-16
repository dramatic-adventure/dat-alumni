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
    <div className="relative w-full" style={{ zIndex: 0 }}>
      {/* ✅ Fixed parallax background */}
      <div
        className="fixed inset-0 bg-cover bg-center"
        style={{
          backgroundImage,
          backgroundAttachment: "fixed",
          backgroundSize: "cover",
          backgroundPosition: "center",
          zIndex: -1,
        }}
      />
      {/* ✅ Normal flow content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
