"use client";
export {}; // ✅ ensure ES module scope

import { useState } from "react";
import StatusFlags from "@/components/alumni/StatusFlags";
import IdentityTags from "@/components/alumni/IdentityTags";
import ProgramStamps from "@/components/alumni/ProgramStamps";
import Lightbox from "@/components/Lightbox";

interface ProfileCardProps {
  name: string;
  role: string;
  headshotUrl: string;
  identityTags?: string[];
  statusFlags?: string[];
  programBadges?: string[];
  nameFont?: string;
  nameFontSize?: string;
  roleFontSize?: string;
  textAlign?: "left" | "center" | "right";
  textColor?: string;
  kraftTexture?: boolean;
}

export default function ProfileCard({
  name,
  role,
  headshotUrl,
  identityTags = [],
  statusFlags = [],
  programBadges = [],
  nameFont = "Anton, sans-serif",
  nameFontSize = "text-5xl",
  roleFontSize = "text-xl",
  textAlign = "left",
  textColor = "#241123",
  kraftTexture = true,
}: ProfileCardProps) {
  const [isModalOpen, setModalOpen] = useState(false);

  return (
    <div className="w-full bg-white px-6 py-10">
      <div className="flex gap-6 items-start">
        {/* 📸 Fixed Headshot */}
        {headshotUrl && (
  <div
    className="cursor-zoom-in overflow-hidden rounded"
    style={{
      width: "320px",
      height: "400px",
      boxShadow: "4px 6px 20px rgba(0, 0, 0, 0.15)", // ⬅️ Drop shadow bottom-right
      backgroundColor: "#eee",
    }}
    onClick={() => setModalOpen(true)}
  >
    <img
      src={headshotUrl}
      alt={name}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        objectPosition: "top center",
        display: "block",
      }}
    />
  </div>
)}
        {/* 📝 Text Block */}
        <div
          className="flex-1 p-6 rounded-md shadow-inner"
          style={{
            backgroundColor: "#F9F4E7",
            backgroundImage: kraftTexture
              ? "url('/texture/kraft-background.png')"
              : undefined,
            backgroundSize: "cover",
            backgroundBlendMode: "overlay",
            color: textColor,
            textAlign,
          }}
        >
          {statusFlags.length > 0 && (
            <div className="flex justify-end mb-2">
              <StatusFlags flags={statusFlags} />
            </div>
          )}

          <div
            className={`${nameFontSize} font-extrabold uppercase leading-none`}
            style={{ fontFamily: nameFont }}
          >
            {name}
          </div>

          {role && (
            <div className={`${roleFontSize} font-semibold mt-1`} style={{ color: textColor }}>
              {role}
            </div>
          )}

          {identityTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              <IdentityTags tags={identityTags} />
            </div>
          )}

          {programBadges.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              <ProgramStamps badges={programBadges} />
            </div>
          )}
        </div>
      </div>

      {/* 🔍 Lightbox */}
      {isModalOpen && headshotUrl && (
        <Lightbox images={[headshotUrl]} onClose={() => setModalOpen(false)} />
      )}
    </div>
  );
}
