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
    className="min-h-screen bg-cover bg-center bg-fixed flex flex-col items-start w-full"
    style={{
      backgroundImage,
      backgroundAttachment: "fixed", // ✅ This is safe here
      backgroundBlendMode: "multiply",
    }}
  >
    {children}
  </div>
);
}

