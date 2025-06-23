"use client";

import { useState, useLayoutEffect, useEffect, useRef } from "react";
import dynamic from "next/dynamic";

import NameStack from "@/components/shared/NameStack";
import ArtistBio from "./ArtistBio";
import PosterStrip from "@/components/shared/PosterStrip";
import AffiliationBlock from "@/components/profile/AffiliationBlock";
import FeaturedProductionsSection from "./FeaturedProductionsSection";
import ShareButton from "@/components/ui/ShareButton";
import Lightbox from "@/components/shared/Lightbox";
import { StoryRow, Production } from "@/lib/types";
import { productionMap } from "@/lib/productionMap";

const FeaturedStories = dynamic(() => import("@/components/shared/FeaturedStories"), { ssr: false });

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

  const hasArtistBio = !!artistStatement?.trim() || identityTags.length > 0;
  const hasBadges = programBadges.length > 0 || statusFlags.length > 0;
  const hasStories = stories?.length > 0;

  const featuredProductions: Production[] = Object.values(productionMap)
    .filter((p) => p?.artists?.[slug])
    .sort((a, b) => b.year - a.year)
    .slice(0, 3);

  return (
  <div className="relative outline outline-2 outline-red-500">
      <div className="absolute z-40" style={{ top: shareButtonTop, right: shareButtonRight }}>
        <ShareButton url={currentUrl} />
      </div>

      {headshotUrl && (
        <div
          className="absolute top-0 left-[1.5rem] sm:left-4 z-40"
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
            }}
          />
        </div>
      )}

      <div
        style={{
          backgroundColor: "#C39B6C",
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
          textAlign={textAlign}
        />
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

      {hasArtistBio && (
        <div className="bg-[#006D77] py-6 m-0">
          <div className="max-w-6xl mx-auto px-4">
            <ArtistBio
              identityTags={identityTags}
              artistStatement={artistStatement}
              fontFamily={artistFontFamily}
              fontSize={artistFontSize}
              color={artistColor}
              fontStyle={artistFontStyle}
              fontWeight={artistFontWeight}
              letterSpacing={artistLetterSpacing}
              identityTagStyle={{ marginLeft: "250px" }}
              bioStyle={{ marginTop: "1rem", marginBottom: "2rem" }}
            />
          </div>
        </div>
      )}

      {featuredProductions.length > 0 && (
        <div className="bg-[#19657c] py-[30px] m-0">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1">
              <div className="px-[60px]">
                <h2 className="text-6xl text-[#D9A919] mb-4" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
                  Featured DAT Work
                </h2>
                <p className="text-[#2493A9] text-lg max-w-3xl" style={{ fontFamily: '"DM Sans", sans-serif' }}>
                  Developed through cross-cultural exchange and a fearless approach to storytelling, this work reflects a
                  deep engagement with place, people, and purpose.
                </p>
              </div>
              <div className="flex justify-end mt-[4px]">
                <div className="pr-[60px]">
                  <PosterStrip
                    posters={featuredProductions.map((p): {
                      posterUrl: string;
                      url: string;
                      title: string;
                    } => ({
                      posterUrl: `/posters/${p.slug}-landscape.jpg`,
                      url: `https://www.dramaticadventure.com${p.url}`,
                      title: p.title,
                    }))}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {hasBadges && (
        <div className="bg-[#9BC53D] py-6 m-0">
          <div className="max-w-6xl mx-auto px-4">
            <AffiliationBlock programBadges={programBadges} statusFlags={statusFlags} />
          </div>
        </div>
      )}

      {hasStories && (
  <section className="bg-[#f2f2f2] rounded-xl px-[60px] py-[60px] mt-[0px]">
    <FeaturedStories stories={stories} authorSlug={slug} />
  </section>
)}



      {isModalOpen && headshotUrl && (
        <Lightbox images={[headshotUrl]} onClose={() => setModalOpen(false)} />
      )}
    </div>
  );
}
