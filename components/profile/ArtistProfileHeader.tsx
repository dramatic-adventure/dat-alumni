// components/ArtistProfileHeader.tsx
"use client";

import React from "react";

interface ArtistProfileHeaderProps {
  headshotUrl: string;
  name: string;
  role: string;
  badges?: string[];
  onFieldNotesClick: () => void;
}

export default function ArtistProfileHeader({
  headshotUrl,
  name,
  role,
  badges = [],
  onFieldNotesClick,
}: ArtistProfileHeaderProps) {
  return (
    <div className="flex w-full h-80">
      {/* Left Panel */}
      <div className="w-1/4 relative">
        <div
          className="absolute inset-y-0 left-0 w-8 bg-foliage-strip bg-cover"
          aria-hidden="true"
        />
        <img
          src={headshotUrl}
          alt={`${name} headshot`}
          className="absolute top-1/2 left-10 -translate-y-1/2 w-24 h-24 object-cover rounded-full shadow-lg"
        />
      </div>

      {/* Center Panel */}
      <div className="w-2/4 bg-kraft-texture flex flex-col justify-center items-start p-6 relative">
        <h1 className="font-anton text-5xl text-transparent bg-white bg-clip-text">
          {name}
        </h1>
        <p className="font-space-grotesk text-xl absolute right-6 top-16">
          {role}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {badges.map((badge, idx) => (
            <span
              key={idx}
              className="px-3 py-1 border border-green-600 text-green-600 rounded-full text-sm font-space-grotesk"
            >
              {badge}
            </span>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-1/4 flex flex-col">
        <div className="flex-1 bg-coral bg-cover bg-center" />
        <div className="h-16 bg-teal bg-dotted-grid bg-repeat" />
        <div className="p-4">
          <button
            onClick={onFieldNotesClick}
            className="w-full py-2 font-space-grotesk text-white text-lg bg-teal hover:bg-teal/80 rounded-md transition-opacity"
            aria-label="View Field Notes"
          >
            FIELD NOTES
          </button>
        </div>
      </div>
    </div>
  );
}
