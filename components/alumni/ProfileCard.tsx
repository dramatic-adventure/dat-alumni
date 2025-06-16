"use client";
export {}; // ✅ ensure ES module scope

import { useState, useLayoutEffect, useRef } from "react";
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

  // Name styling
  nameFontFamily?: string;
  nameFontSize?: string;
  nameColor?: string;
  nameLetterSpacing?: string;

  // Role styling
  roleFontFamily?: string;
  roleFontSize?: string;
  roleColor?: string;
  roleLetterSpacing?: string;
  roleMarginTop?: string;

  // Layout
  headshotShadow?: string;
  textPaddingLeft?: string;

  // Shared
  textAlign?: "left" | "center" | "right";
  textTransform?: "uppercase" | "lowercase" | "capitalize" | "none";

  kraftTexture?: boolean;
  maxNameWidth?: number;
}

// ✅ Cache scale per name for speed
const scaleCache = new Map<string, { first: number; last: number }>();

export default function ProfileCard({
  name,
  role,
  headshotUrl,
  identityTags = [],
  statusFlags = [],
  programBadges = [],

  nameFontFamily = "Anton, sans-serif",
  nameFontSize = "4.5rem",
  nameColor = "#F6E4C1",
  nameLetterSpacing = "5px",

  roleFontFamily = "Space Grotesk, sans-serif",
  roleFontSize = "1rem",
  roleColor = "#241123",
  roleLetterSpacing = "2px",
  roleMarginTop = "0rem",

  headshotShadow = "6px 8px 20px rgba(0, 0, 0, 0.25)",
  textPaddingLeft = "2rem",

  textAlign = "left",
  textTransform = "uppercase",

  kraftTexture = true,
  maxNameWidth = 360,
}: ProfileCardProps) {
  const [isModalOpen, setModalOpen] = useState(false);

  const nameParts = name.trim().split(" ");
  const firstName = nameParts.slice(0, -1).join(" ") || nameParts[0];
  const lastName = nameParts.slice(-1).join(" ") || "";

  const firstNameRef = useRef<HTMLDivElement>(null);
  const lastNameRef = useRef<HTMLDivElement>(null);

  const cached = scaleCache.get(name);
  const [firstScale, setFirstScale] = useState(cached?.first ?? 1);
  const [lastScale, setLastScale] = useState(cached?.last ?? 1);
  const [hasMeasured, setHasMeasured] = useState(!!cached);

  useLayoutEffect(() => {
    if (hasMeasured) return;

    const first = firstNameRef.current;
    const last = lastNameRef.current;

    if (first && last) {
      const firstWidth = first.scrollWidth;
      const lastWidth = last.scrollWidth;
      const widest = Math.max(firstWidth, lastWidth);

      const shouldScale = widest > maxNameWidth;
      const targetWidth = shouldScale ? maxNameWidth : widest;

      const newFirstScale = targetWidth / firstWidth;
      const newLastScale = targetWidth / lastWidth;

      scaleCache.set(name, { first: newFirstScale, last: newLastScale });
      setFirstScale(newFirstScale);
      setLastScale(newLastScale);
      setHasMeasured(true);
    }
  }, [name, hasMeasured, maxNameWidth]);

  return (
    <div className="w-full bg-white m-0 p-0">
      <div className="flex items-start m-0 p-0">
        {/* 📸 Headshot */}
        {headshotUrl && (
          <div
            className="cursor-zoom-in overflow-hidden rounded"
            style={{
              width: "260px",
              height: "325px",
              boxShadow: headshotShadow,
              backgroundColor: "#eee",
              flexShrink: 0,
              position: "relative",
              zIndex: 2,
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

        {/* 📝 Kraft Panel */}
        <div
          className="pt-6 pb-8 w-full relative"
          style={{
            backgroundColor: "#C39B6C",
            backgroundImage: kraftTexture
              ? "url('/texture/kraft-background.png')"
              : undefined,
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            backgroundBlendMode: "multiply",
            backgroundPosition: "center",
            color: nameColor,
            textAlign,
            paddingLeft: textPaddingLeft,
          }}
        >
          {statusFlags.length > 0 && (
            <div className="absolute top-4 right-4 z-40">
              <StatusFlags flags={statusFlags} />
            </div>
          )}

          {/* NAME */}
          <div
            style={{
              visibility: hasMeasured ? "visible" : "hidden",
              display: "inline-flex",
              flexDirection: "column",
              alignItems: "flex-start",
              fontFamily: nameFontFamily,
              fontSize: nameFontSize,
              color: nameColor,
              textTransform,
              lineHeight: 1.1,
              textAlign,
              marginBottom: "0",
              letterSpacing: nameLetterSpacing,
              fontWeight: 500,
              textShadow: "none",
            }}
          >
            {/* hidden refs */}
            <div
              ref={firstNameRef}
              style={{
                position: "absolute",
                visibility: "hidden",
                whiteSpace: "nowrap",
                pointerEvents: "none",
              }}
            >
              {firstName}
            </div>
            <div
              ref={lastNameRef}
              style={{
                position: "absolute",
                visibility: "hidden",
                whiteSpace: "nowrap",
                pointerEvents: "none",
              }}
            >
              {lastName}
            </div>

            {/* scaled + spaced names */}
            <div
              style={{
                transform: `scale(${firstScale})`,
                transformOrigin: "left",
                whiteSpace: "nowrap",
                marginTop: "0.5em", // subtle top margin
              }}
            >
              {firstName}
            </div>
            <div
              style={{
                transform: `scale(${lastScale})`,
                transformOrigin: "left",
                whiteSpace: "nowrap",
                marginTop: "0.15em", // padding between names
              }}
            >
              {lastName}
            </div>
          </div>

          {/* ROLE */}
          {role && (
            <p
              style={{
                fontFamily: roleFontFamily,
                fontSize: roleFontSize,
                color: roleColor,
                textTransform,
                letterSpacing: roleLetterSpacing,
                fontWeight: 700,
                opacity: 0.85,
                marginTop: roleMarginTop,
                marginBottom: "0.5rem",
                textAlign,
              }}
            >
              {role}
            </p>
          )}

          {/* IDENTITY TAGS */}
          {identityTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              <IdentityTags tags={identityTags} />
            </div>
          )}

          {/* PROGRAM STAMPS */}
          {programBadges.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              <ProgramStamps badges={programBadges} />
            </div>
          )}
        </div>
      </div>

      {/* 🖼️ Lightbox */}
      {isModalOpen && headshotUrl && (
        <Lightbox images={[headshotUrl]} onClose={() => setModalOpen(false)} />
      )}
    </div>
  );
}
