"use client";

import { useState, useLayoutEffect, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

import NameStack from "@/components/shared/NameStack";
import ArtistBio from "./ArtistBio";
import PosterStrip from "@/components/shared/PosterStrip";
import AffiliationBlock from "@/components/profile/AffiliationBlock";
import FeaturedProductionsSection from "./FeaturedProductionsSection";
import ShareButton from "@/components/ui/ShareButton";
import Lightbox from "@/components/shared/Lightbox";
import LocationBadge from "@/components/shared/LocationBadge";
import { StoryRow, Production } from "@/lib/types";
import { productionMap } from "@/lib/productionMap";

const FeaturedStories = dynamic(() => import("@/components/shared/FeaturedStories"), {
  ssr: false,
});

interface ProfileCardProps {
  name: string;
  slug: string;
  role: string;
  headshotUrl?: string;
  location?: string;
  identityTags?: string[];
  statusFlags?: string[];
  programBadges?: string[];
  artistStatement?: string;
  stories?: StoryRow[];
}

const scaleCache = new Map<string, { first: number; last: number }>();

export default function ProfileCard({
  name,
  slug,
  role,
  headshotUrl,
  location,
  identityTags = [],
  statusFlags = [],
  programBadges = [],
  artistStatement,
  stories = [],
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
      const targetWidth = widest > 360 ? 360 : widest;
      const newFirstScale = targetWidth / firstWidth;
      const newLastScale = targetWidth / lastWidth;
      scaleCache.set(name, { first: newFirstScale, last: newLastScale });
      setFirstScale(newFirstScale);
      setLastScale(newLastScale);
      setHasMeasured(true);
    }
  }, [name, hasMeasured]);

  const hasArtistBio = !!artistStatement?.trim() || identityTags.length > 0;
  const hasBadges = programBadges.length > 0 || statusFlags.length > 0;
  const hasStories = stories?.length > 0;

  const featuredProductions: Production[] = Object.values(productionMap)
    .filter((p) => p?.artists?.[slug])
    .sort((a, b) => b.year - a.year)
    .slice(0, 3);

  const fallbackImage = "/images/default-headshot.png";

console.log("✅ TEST: ProfileCard received location:", location);
console.log("💬 Available props:", {
  slug,
  name,
  role,
  location,
  headshotUrl,
  programBadges,
  identityTags,
  statusFlags,
  artistStatement,
});
console.log("📍 Raw location:", location);
console.log("🎯 typeof location:", typeof location);
console.log("🧪 location.length:", location?.length);
console.log("📍 ProfileCard location:", location);


  return (
    <div className="relative">
      {/* Share Button */}
      <div className="absolute z-40" style={{ top: "1rem", right: "1.5rem" }}>
        <ShareButton url={currentUrl} />
      </div>

      {/* Headshot Card */}
      <div
        className="absolute top-0 left-[1.5rem] sm:left-4 z-40"
        style={{
          width: "280px",
          height: "350px",
          boxShadow: "6px 8px 20px rgba(0,0,0,0.25)",
          backgroundColor: "#241123",
        }}
        onClick={() => setModalOpen(true)}
      >
        <img
          src={headshotUrl || fallbackImage}
          alt={`${name}'s headshot`}
          loading="lazy"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
          }}
        />
      </div>

      {/* Name + Role + Location */}
      <div
        style={{
          backgroundColor: "#C39B6C",
          color: "#F6E4C1",
          textAlign: "left",
          paddingLeft: "340px",
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
          nameFontFamily="Anton, sans-serif"
          nameFontSize="4.5rem"
          nameColor="#F6E4C1"
          letterSpacing="5px"
          textTransform="uppercase"
          textAlign="left"
        />

<div
  className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
  style={{ marginTop: "0.5rem", marginBottom: "0.5rem", textAlign: "left" }}
>
  {role && (
    <p
      style={{
        fontFamily: "Space Grotesk, sans-serif",
        fontSize: "1.7rem",
        color: "#241123",
        textTransform: "uppercase",
        letterSpacing: "2px",
        fontWeight: 700,
        opacity: 0.85,
        margin: 0,
      }}
    >
      <Link
        href={`/role/${role.toLowerCase().replace(/\s+/g, "-")}`}
        className="hover:underline transition-colors duration-150 cursor-pointer"
      >
        {role}
      </Link>
    </p>
  )}

  {location && (
    <div
      style={{
        fontFamily: "Space Grotesk, sans-serif",
        fontSize: "1.7rem",
        textTransform: "uppercase",
        letterSpacing: "2px",
        fontWeight: 700,
        opacity: 0.85,
      }}
    >
      <LocationBadge location={location} className="text-[#241123]" />
    </div>
  )}
</div>
      </div>

      {/* Artist Bio */}
      {hasArtistBio && (
        <div className="bg-[#006D77] py-6 m-0">
          <div className="max-w-6xl mx-auto px-4">
            <ArtistBio
              identityTags={identityTags}
              artistStatement={artistStatement}
              fontFamily='"DM Sans", sans-serif'
              fontSize="1.15rem"
              color="#ffffff"
              fontStyle="normal"
              fontWeight={200}
              letterSpacing="normal"
              identityTagStyle={{ marginLeft: "250px" }}
              bioStyle={{ marginTop: "1rem", marginBottom: "2rem" }}
            />
          </div>
        </div>
      )}

      {/* Featured Productions */}
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
              <div className="flex justify-end mt-[4px] pr-[60px]">
                <PosterStrip
                  posters={featuredProductions.map((p) => ({
                    posterUrl: `/posters/${p.slug}-landscape.jpg`,
                    url: `https://www.dramaticadventure.com${p.url}`,
                    title: p.title,
                  }))}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Affiliation Block */}
      {hasBadges && (
        <div className="bg-[#9BC53D] py-6 m-0">
          <div className="max-w-6xl mx-auto px-4">
            <AffiliationBlock programBadges={programBadges} statusFlags={statusFlags} />
          </div>
        </div>
      )}

      {/* Featured Stories */}
      {hasStories && (
        <section className="bg-[#f2f2f2] rounded-xl px-[60px] py-[60px] mt-[0px]">
          <FeaturedStories stories={stories} authorSlug={slug} />
        </section>
      )}

      {/* Lightbox Modal */}
      {isModalOpen && (
        <Lightbox
          images={[headshotUrl || fallbackImage]}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
