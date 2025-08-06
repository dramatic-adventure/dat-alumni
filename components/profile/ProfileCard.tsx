"use client";

import { useState, useLayoutEffect, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

import NameStack from "@/components/shared/NameStack";
import ArtistBio from "./ArtistBio";
import PosterStrip from "@/components/shared/PosterStrip";
import ProgramStamps from "@/components/alumni/ProgramStamps";
import FeaturedProductionsSection from "./FeaturedProductionsSection";
import ShareButton from "@/components/ui/ShareButton";
import Lightbox from "@/components/shared/Lightbox";
import LocationBadge from "@/components/shared/LocationBadge";
import ContactOverlay from "@/components/shared/ContactOverlay";
import ContactWidget from "@/components/shared/ContactWidget";
import {
  StoryRow,
  Production,
  SpotlightUpdate,
  HighlightCard,
  HighlightCategory,
  CreativeWorkUpdate, 
} from "@/lib/types";

import { productionMap } from "@/lib/productionMap";
import StatusFlags from "@/components/alumni/StatusFlags";

import MobileProfileHeader from "@/components/alumni/MobileProfileHeader";
import DesktopProfileHeader from "@/components/alumni/DesktopProfileHeader";
import useIsMobile from "@/hooks/useIsMobile";

import MyJourney from "@/components/alumni/MyJourney";
import SpotlightPanel from "@/components/alumni/SpotlightPanel";
import HighlightPanel from "@/components/alumni/HighlightPanel";

import ProfileShowcaseSection from "@/components/profile/ProfileShowcaseSection";

import CreativeWorkPanel from "@/components/alumni/CreativeWorkPanel";



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
  email?: string;
  website?: string;
  socials?: string[];
  updates?: SpotlightUpdate[];
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
  email,
  website,
  socials,
  updates = [],
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

  const isMobile = useIsMobile();

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
  .sort((a, b) => b.year - a.year); // ✅ Show all, most recent first


  const fallbackImage = "/images/default-headshot.png";
  const profileCardRef = useRef<HTMLDivElement>(null);
  const hasContactInfo = !!(email || website || (socials && socials.length > 0));

const highlightUpdates: HighlightCard[] = (updates || [])
  .filter((u) => u.tag === "Highlight")
  .map((u) => ({
    headline: u.headline || "",
    title: u.headline || "",
    excerpt: u.body || "",
    date: (u as any).dateAdded || "",
    location: (u as any).location || "",
    imageUrl: u.mediaUrl || "",
    ctaUrl: u.ctaLink || "",
    evergreen: u.evergreen ?? false,
    mediaUrl: u.mediaUrl || "",
    category: "Highlight" as HighlightCategory,
  }));

const spotlightUpdates = (updates || []).filter((u) => u.tag === "DAT Spotlight");

const hasSpotlight = spotlightUpdates.length > 0;
const hasHighlight = highlightUpdates.length > 0;

const creativeWorkUpdates = (updates || []).filter((u) => u.tag === "Creative Work");




const hasCreativeWork = creativeWorkUpdates.length > 0;

const hasAnyPanel = hasSpotlight || hasHighlight || hasCreativeWork;


console.log("✅ creativeWorkUpdates", creativeWorkUpdates);


  return (
  <div ref={profileCardRef} style={{ position: "relative" }}>
    {/* 🔹 Header */}
    {isMobile ? (
      <MobileProfileHeader
        name={name}
        role={role}
        location={location}
        headshotUrl={headshotUrl}
        email={email}
        website={website}
        socials={socials}
        statusFlags={statusFlags}
      />
    ) : (
      <DesktopProfileHeader
        name={name}
        role={role}
        location={location}
        headshotUrl={headshotUrl}
        email={email}
        website={website}
        socials={socials}
        statusFlags={statusFlags}
      />
    )}

    {/* 🔷 Blue background: Only shown if ArtistBio or Panels exist */}
    {(hasArtistBio || hasAnyPanel) && (
      <div
        style={{
          backgroundColor: "#2493A9",
          paddingTop: hasArtistBio ? "3rem" : "2rem",
          paddingBottom: "2.5rem",
        }}
      >
        {hasArtistBio && (
          <ArtistBio
            identityTags={identityTags}
            artistStatement={artistStatement}
            fontFamily='"DM Sans", sans-serif'
            fontSize="1.15rem"
            color="#0C2D37"
            fontStyle="normal"
            fontWeight={400}
            letterSpacing="normal"
            identityTagStyle={{
              marginTop: "0rem",
              marginBottom: "2.5rem",
              marginLeft: isMobile ? "30px" : "310px",
              marginRight: "30px",
            }}
            bioStyle={{
              marginLeft: "30px",
              marginRight: "30px",
              marginTop: "1rem",
              marginBottom: "3rem",
              maxWidth: "calc(100% - 60px)",
            }}
          />
        )}

        {hasAnyPanel && (
  <div style={{ margin: "2rem 30px 2.5rem 30px" }}>
    <ProfileShowcaseSection>
      {hasSpotlight && <SpotlightPanel updates={spotlightUpdates} />}
      {hasHighlight && <HighlightPanel cards={highlightUpdates} />}
      {hasCreativeWork && <CreativeWorkPanel updates={creativeWorkUpdates} />}
      <MyJourney />
    </ProfileShowcaseSection>
  </div>
)}

      </div>
    )}

    {/* 💛 Featured Productions Section */}
    {featuredProductions.length > 0 && (
      <div className="bg-[#19657c] py-[30px] px-[30px]">
        <h2
          className="text-6xl text-[#D9A919] mb-4"
          style={{ fontFamily: '"Space Grotesk", sans-serif' }}
        >
          Featured DAT Work
        </h2>
        <p
          className="text-[#5BBFD3] text-lg max-w-3xl mb-8"
          style={{ fontFamily: '"DM Sans", sans-serif' }}
        >
          Developed through cross-cultural exchange and a fearless approach to
          storytelling, this work reflects a deep engagement with place, people,
          and purpose.
        </p>
        <PosterStrip
          posters={featuredProductions.map((p) => ({
            posterUrl: `/posters/${p.slug}-landscape.jpg`,
            url: `https://www.dramaticadventure.com${p.url}`,
            title: p.title,
          }))}
        />
      </div>
    )}

    {/* 🟣 Program Badges */}
    {programBadges.length > 0 && (
      <div className="relative py-6 m-0 animate-fadeIn" style={{ zIndex: 50 }}>
        <div className="max-w-6xl mx-auto px-4">
          <ProgramStamps artistSlug={slug} />
        </div>
      </div>
    )}

    {/* 📰 Featured Stories */}
    {hasStories && (
      <section className="bg-[#f2f2f2] rounded-xl px-[30px] py-[30px] mt-[0px]">
        <FeaturedStories stories={stories} authorSlug={slug} />
      </section>
    )}

    {/* 💡 Headshot Modal Lightbox */}
    {isModalOpen && (
      <Lightbox
        images={[headshotUrl || fallbackImage]}
        onClose={() => setModalOpen(false)}
      />
    )}
  </div>
);
}