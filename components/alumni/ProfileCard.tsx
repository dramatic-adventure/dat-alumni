"use client";
export {}; // ✅ ensure ES module scope

import { useState } from "react";
import Image from "next/image";
import StatusFlags from "@/components/alumni/StatusFlags";
import IdentityTags from "@/components/alumni/IdentityTags"; // ✅ This is the fix!
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
    <div className="w-full bg-white overflow-hidden">
      <div className="relative w-full flex flex-col">
        {headshotUrl && (
          <div
            className="absolute top-0 left-0 z-30 cursor-zoom-in"
            onClick={() => setModalOpen(true)}
          >
            <Image
              src={headshotUrl}
              alt={name}
              width={300}
              height={420}
              className="object-cover w-[300px] h-[420px]"
            />
          </div>
        )}

        <div
          className="w-full min-h-[150px] pl-[320px] pr-6 pt-6 pb-8 relative"
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

        <div className="w-full bg-[#1b8a8f] text-white px-8 py-10">
          <p className="italic text-lg max-w-3xl">
            “I create where place and story meet. My voice moves between riverbeds and memory,
            always listening for the next scene.”
          </p>
        </div>

        <div className="w-full bg-white px-6 py-10">
          <p className="text-sm text-neutral-500 mb-6">[Story article blocks go here]</p>
        </div>
      </div>

      {isModalOpen && headshotUrl && (
        <Lightbox images={[headshotUrl]} onClose={() => setModalOpen(false)} />
      )}
    </div>
  );
}
