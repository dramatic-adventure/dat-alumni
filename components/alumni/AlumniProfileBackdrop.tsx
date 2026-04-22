"use client";
import React from "react";

interface AlumniProfileBackdropProps {
  backgroundKey?: string;
  children: React.ReactNode;
}

const backgroundMap: Record<string, string> = {
  kraft: "url('/texture/kraft-paper.png')",
  // Leather: DAT Dark Purple (#241123) at 15% opacity layered over leather texture
  leather: "linear-gradient(rgba(36,17,35,0.15), rgba(36,17,35,0.15)), url('/texture/leather.webp')",
};

export default function AlumniProfileBackdrop({
  backgroundKey = "kraft",
  children,
}: AlumniProfileBackdropProps) {
  const backgroundImage = backgroundMap[backgroundKey] || backgroundMap.kraft;

  return (
    <div className="relative w-full">
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
