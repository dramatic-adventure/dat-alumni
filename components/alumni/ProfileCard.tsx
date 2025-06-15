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
    <div className="w-full bg-white m-0 p-0">
      <div className="flex items-start m-0 p-0">
        {/* 📸 Headshot — flush-left full-bleed 4:5 */}
        {headshotUrl && (
          <div
            className="cursor-zoom-in overflow-hidden rounded"
            style={{
              width: "260px",
              height: "325px",
              boxShadow: "4px 6px 20px rgba(0, 0, 0, 0.15)",
              backgroundColor: "#eee",
              flexShrink: 0,
              margin: 0,
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
                objectPosition: "center",
                display: "block",
              }}
            />
          </div>
        )}

        {/* 📝 Profile Text */}
        <div
          className="pl-6 pr-6 pt-6 pb-8 w-full"
          style={{
            backgroundColor: "#F9F4E7",
            backgroundImage: kraftTexture ? "url('/texture/kraft-background.png')" : undefined,
            backgroundSize: "cover",
            backgroundBlendMode: "overlay",
            color: textColor,
            textAlign,
          }}
        >
          {statusFlags.length > 0 && (
            <div className="absolute top-4 right-4 z-40">
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

      {/* 🖼️ Optional Lightbox */}
      {isModalOpen && headshotUrl && (
        <Lightbox images={[headshotUrl]} onClose={() => setModalOpen(false)} />
      )}
    </div>
  );
}
