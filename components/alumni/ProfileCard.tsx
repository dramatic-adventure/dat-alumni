"use client";
export {};

import { useState, useLayoutEffect, useRef } from "react";
import StatusFlags from "@/components/alumni/StatusFlags";
import IdentityTags from "@/components/alumni/IdentityTags";
import ProgramStamps from "@/components/alumni/ProgramStamps";
import Lightbox from "@/components/Lightbox";
import PosterStrip from "@/components/PosterStrip";
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
  textPaddingLeft?: string;
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
  nameFontFamily = "Anton, sans-serif",
  nameFontSize = "4.5rem",
  nameColor = "#F6E4C1",
  nameLetterSpacing = "5px",
  roleFontFamily = "Space Grotesk, sans-serif",
  roleFontSize = "1.7rem",
  roleColor = "#241123",
  roleLetterSpacing = "2px",
  roleMarginTop = "0.5rem",
  headshotShadow = "6px 8px 20px rgba(0, 0, 0, 0.25)",
  textPaddingLeft = "1.9rem",
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

  const showTealPanel = !!artistStatement || identityTags.length > 0;
  const showWhitePanel = programBadges.length > 0 || statusFlags.length > 0;

  const featuredProductions = Object.values(productionMap)
    .filter((p) => Object.keys(p.artists).includes(slug))
    .sort((a, b) => b.year - a.year)
    .slice(0, 3);

  return (
    <div className="relative w-full m-0 p-0">
      {/* 📸 Floating Headshot */}
      {headshotUrl && (
        <div
          className="absolute top-[0rem] left-[1.5rem] z-40"
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
        className="rounded-t-[16px] overflow-hidden"
        style={{
          backgroundColor: "#C39B6C",
          backgroundImage: kraftTexture ? "url('/texture/kraft-background.png')" : undefined,
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
        {/* SHARE BUTTON */}
        <div
          className="absolute z-30"
          style={{ top: shareButtonTop, right: shareButtonRight }}
        >
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: name, url: window.location.href });
              } else {
                navigator.clipboard.writeText(window.location.href);
                alert("Link copied to clipboard.");
              }
            }}
            style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
            title="Share this profile"
            aria-label="Share"
          >
            <img
              src="/icons/share-drawn.png"
              alt="Share"
              style={{ width: "28px", height: "28px", display: "block" }}
            />
          </button>
        </div>

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
          }}
        >
          <div ref={firstNameRef} style={{ position: "absolute", visibility: "hidden", whiteSpace: "nowrap", pointerEvents: "none" }}>{firstName}</div>
          <div ref={lastNameRef} style={{ position: "absolute", visibility: "hidden", whiteSpace: "nowrap", pointerEvents: "none" }}>{lastName}</div>

          <div style={{ transform: `scale(${firstScale})`, transformOrigin: "left", whiteSpace: "nowrap", marginTop: "0.5em" }}>{firstName}</div>
          <div style={{ transform: `scale(${lastScale})`, transformOrigin: "left", whiteSpace: "nowrap", marginTop: "0.15em" }}>{lastName}</div>
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
      </div>

      {/* 🟦 Teal Panel (Identity Tags + Artist Statement) */}
      {showTealPanel && (
        <div
          style={{
            backgroundColor: "#2493A9",
            color: "#fff",
            paddingLeft: "60px",
            paddingRight: "60px",
            paddingTop: "1.2rem",
            paddingBottom: "3rem",
          }}
        >
          <div
  style={{
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    marginLeft: "60px",
    marginRight: "60px",
  }}
>
  {identityTags.length > 0 && (
    <div className="flex flex-wrap gap-2 justify-end">
      <IdentityTags tags={identityTags} />
    </div>
  )}

  {artistStatement && (
    <div
      style={{
        fontFamily: artistFontFamily,
        fontSize: artistFontSize,
        color: artistColor,
        fontStyle: artistFontStyle,
        fontWeight: artistFontWeight,
        letterSpacing: artistLetterSpacing,
      }}
    >
      {artistStatement}
    </div>
  )}
</div>
        </div>
      )}

      {/* 🎭 Poster Strip Section (Dark Blue Panel) */}
{featuredProductions.length > 0 && (
  <div
    style={{
      backgroundColor: "#6C00AF",
      padding: "3rem 60px",
      display: "flex",
    }}
  >
    <PosterStrip
      justify="center" // ✅ Optional: also try "space-between", etc.
      posters={featuredProductions.map((p) => ({
        title: p.title,
        imageUrl: `/posters/${p.slug}-landscape.jpg`,
        url: p.url,
      }))}
    />
  </div>
)} 


      {/* ⬜ White Panel */}
      {showWhitePanel && (
        <div
          style={{
            backgroundColor: "#ffffff",
            color: "#000",
            paddingLeft: "320px",
            paddingTop: "3rem",
            paddingBottom: "3rem",
          }}
        >
          {programBadges.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              <ProgramStamps badges={programBadges} />
            </div>
          )}

          {statusFlags.length > 0 && (
            <div className="mb-4">
              <StatusFlags flags={statusFlags} />
            </div>
          )}

          <div
            style={{
              marginTop: "2.5rem",
              paddingLeft: textPaddingLeft,
              fontFamily: '"Rock Salt", cursive',
              fontSize: "1.8rem",
              color: "#F23359",
              cursor: "pointer",
            }}
          >
            ← Explore More Stories
          </div>
        </div>
      )}

      {/* 🔍 Lightbox */}
      {isModalOpen && headshotUrl && (
        <Lightbox images={[headshotUrl]} onClose={() => setModalOpen(false)} />
      )}
    </div>
  );
}
