// components/alumni/AlumniProfileBackdrop.tsx

"use client";

import React from "react";

interface AlumniProfileBackdropProps {
  backgroundKey?: string; // can be undefined
  children: React.ReactNode;
}

const backgroundMap: Record<string, string> = {
  kraft: "url('/images/texture/kraft-paper.png')",
  // other options to be added here later
};

export default function AlumniProfileBackdrop({
  backgroundKey = "kraft",
  children,
}: AlumniProfileBackdropProps) {
  const backgroundImage = backgroundMap[backgroundKey] || backgroundMap.kraft;

  return (
    <div
      className="bg-cover bg-center bg-fixed"
      style={{
        backgroundImage,
        backgroundColor: "#C39B6C",
        backgroundBlendMode: "multiply",
      }}
    >
      {children}
    </div>
  );
}
