"use client";
export {};

import { useState, useLayoutEffect, useEffect, useRef } from "react";

import NameStack from "@/components/shared/NameStack";
import ArtistBio from "./ArtistBio";
import AffiliationBlock from "@/components/profile/AffiliationBlock";
import FeaturedProductionsSection from "./FeaturedProductionsSection"; // ✅ default import
import dynamic from "next/dynamic";
const FeaturedStories = dynamic(() => import("@/components/shared/FeaturedStories"), {
  ssr: false,
});
import ShareButton from "@/components/ui/ShareButton";
import Lightbox from "@/components/shared/Lightbox";

import { StoryRow } from "@/lib/types";
import { productionMap } from "@/lib/productionMap";

interface ProfileCardProps {
  name: string;
  slug: string;
  role: string;
  headshotUrl: string;
  identityTags?: string[];
  statusFlags?: string[];
  programBadges?: string[];
  artistStatement?: string;
  stories?: StoryRow[];
  nameFontFamily?: string;
  nameFontSize?: string;
  nameColor?: string;
  nameLetterSpacing?: string;
  roleFontFamily?: string;
  roleFontSize?: string;
  roleColor?: string;
  roleLetterSpacing?: string;
  roleMarginTop?: string;
  headshotShadow?: string;
  textAlign?: "left" | "center" | "right";
  textTransform?: "uppercase" | "lowercase" | "capitalize" | "none";
  kraftTexture?: boolean;
  maxNameWidth?: number;
  shareButtonTop?: string;
  shareButtonRight?: string;
  artistFontFamily?: string;
  artistFontSize?: string;
  artistColor?: string;
  artistFontStyle?: "italic" | "normal";
  artistFontWeight?: number | string;
  artistLetterSpacing?: string;
}

const scaleCache = new Map<string, { first: number; last: number }>();

export default function ProfileCard({
  name,
  slug,
  role,
  headshotUrl,
  identityTags = [],
  statusFlags = [],
  programBadges = [],
  artistStatement,
  stories = [],
  nameFontFamily = "Anton, sans-serif",
  nameFontSize = "4.5rem",
  nameColor = "#F6E4C1",
  nameLetterSpacing = "5px",
  roleFontFamily = "Space Grotesk, sans-serif",
  roleFontSize = "1.7rem",
  roleColor = "#241123",
  roleLetterSpacing = "2px",
  roleMarginTop = "0.5rem",
  headshotShadow = "6px 8px 20px rgba(0,0,0,0.25)",
  textAlign = "left",
  textTransform = "uppercase",
  kraftTexture = true,
  maxNameWidth = 360,
  shareButtonTop = "1rem",
  shareButtonRight = "1.5rem",
  artistFontFamily = '"DM Sans", sans-serif',
  artistFontSize = "1.15rem",
  artistColor = "#ffffff",
  artistFontStyle = "normal",
  artistFontWeight = 200,
  artistLetterSpacing = "normal",
}: ProfileCardProps) {
  const [isModalOpen, setModalOpen] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.href);
    }
  }, []);

  const nameParts = name.trim().split(" ");
  const firstName = nameParts.slice(0, -1).join(" ") || nameParts[0];
  const lastName = nameParts.slice(-1).join(" ") || "";

  const firstNameRef = useRef<HTMLDivElement>(null);
  const lastNameRef = useRef<HTMLDivElement>(null);

  const cached = scaleCache.get(name);
  const [firstScale, setFirstScale] = useState(cached?.first ?? 0.95);
  const [lastScale, setLastScale] = useState(cached?.last ?? 0.95);
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

  const safeIdentityTags = Array.isArray(identityTags) ? identityTags : [];
  const safeProgramBadges = Array.isArray(programBadges) ? programBadges : [];
  const safeStatusFlags = Array.isArray(statusFlags) ? statusFlags : [];

  const showTealPanel = !!artistStatement || safeIdentityTags.length > 0;
  const showGreenPanel = safeProgramBadges.length > 0 || safeStatusFlags.length > 0;

  let featuredProductions: any[] = [];

  try {
    if (productionMap && typeof productionMap === "object") {
      featuredProductions = Object.values(productionMap)
        .filter(
          (p) =>
            p?.artists &&
            typeof p.artists === "object" &&
            Object.keys(p.artists).includes(slug)
        )
        .sort((a, b) => b.year - a.year)
        .slice(0, 3);
    } else {
      console.warn("⚠️ productionMap is invalid");
    }
  } catch (err) {
    console.error("❌ Error in featuredProductions logic:", err);
  }

  return (
    <div className="relative w-full m-0 p-0">
      {/* 🟪 Floating Share Button */}
      <div className="fixed z-50" style={{ top: shareButtonTop, right: shareButtonRight }}>
        <ShareButton url={currentUrl} />
      </div>

      {/* 📸 Floating Headshot */}
      {headshotUrl && (
        <div
          className="absolute top-0 left-[1.5rem] z-40"
          style={{
            width: "260px",
            height: "325px",
            boxShadow: headshotShadow,
            backgroundColor: "#241123",
          }}
          onClick={() => setModalOpen(true)}
        >
          <img
            src={headshotUrl}
            alt={name}
            loading="lazy"
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

      {/* 🟫 Kraft Panel */}
      <div
        style={{
          backgroundColor: "#C39B6C",
          backgroundImage: kraftTexture ? "url('/images/texture/kraft-paper.png')" : undefined,
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundBlendMode: "multiply",
          backgroundPosition: "center",
          color: nameColor,
          textAlign,
          paddingLeft: "320px",
          paddingTop: "0.25rem",
          paddingBottom: "2rem",
        }}
      >
        <NameStack
  firstName={firstName}
  lastName={lastName}
  firstNameRef={firstNameRef}
  lastNameRef={lastNameRef}
  firstScale={firstScale}
  lastScale={lastScale}
  hasMeasured={hasMeasured}
  nameFontFamily={nameFontFamily}
  nameFontSize={nameFontSize}
  nameColor={nameColor}
  letterSpacing={nameLetterSpacing}
  textTransform={textTransform}
  textAlign="left"
/>

/
  
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
      </div>

      {/* 🟦 Artist Bio */}
      {showTealPanel && (
        <ArtistBio
          identityTags={safeIdentityTags}
          artistStatement={artistStatement}
          fontFamily={artistFontFamily}
          fontSize={artistFontSize}
          color={artistColor}
          fontStyle={artistFontStyle}
          fontWeight={artistFontWeight}
          letterSpacing={artistLetterSpacing}
        />
      )}

      {/* 🟦 Featured DAT Works */}
      {featuredProductions.length > 0 && (
        <FeaturedProductionsSection productions={featuredProductions} />
      )}

      {/* 📰 Featured Stories */}
{stories.length > 0 && <FeaturedStories stories={stories} authorSlug={slug} />}

{/* 💚 Artist Badges */}
{showGreenPanel && (
  <AffiliationBlock programBadges={safeProgramBadges} statusFlags={safeStatusFlags} />
)}

{/* 🔍 Lightbox */}
{isModalOpen && headshotUrl && (
  <Lightbox images={[headshotUrl]} onClose={() => setModalOpen(false)} />
)}
    </div>
  );
}
