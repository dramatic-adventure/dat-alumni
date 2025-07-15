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
import { StoryRow, Production } from "@/lib/types";
import { productionMap } from "@/lib/productionMap";
import StatusFlags from "@/components/alumni/StatusFlags";

import MobileProfileHeader from "@/components/alumni/MobileProfileHeader";
import DesktopProfileHeader from "@/components/alumni/DesktopProfileHeader";
import useIsMobile from "@/hooks/useIsMobile";

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

  return (
    <div ref={profileCardRef} style={{ position: "relative" }}>
      {/* <ContactOverlay
        email={email}
        website={website}
        socials={socials}
        profileCardRef={profileCardRef}
      /> */}

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

      {/* 👇 COMMENTED OUT: moved to DesktopProfileHeader */}
      {/*
      {headshotUrl || fallbackImage ? (
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
      ) : null}

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

        {(role || location) && (
          <div className="flex flex-row items-center flex-wrap gap-x-3 gap-y-2" style={{ marginTop: "0.5rem", marginBottom: "0.5rem", textAlign: "left" }}>
            {role && (
              <Link
                href={`/role/${role.toLowerCase().replace(/\s+/g, "-")}`}
                style={{
                  fontFamily: "Space Grotesk, sans-serif",
                  fontSize: "1.7rem",
                  color: "#241123",
                  textTransform: "uppercase",
                  letterSpacing: "2px",
                  fontWeight: 700,
                  opacity: 0.9,
                  textDecoration: "none",
                }}
              >
                {role}
              </Link>
            )}
            {role && location && (
              <span style={{ fontSize: "1.2rem", color: "#241123", padding: "0 14px", opacity: 0.5 }}>•</span>
            )}
            {location && (
              <LocationBadge
                location={location}
                fontFamily="DM Sans, sans serif"
                fontSize="1.2rem"
                fontWeight={900}
                letterSpacing="2px"
                textTransform="none"
                opacity={0.5}
              />
            )}
          </div>
        )}
      </div>
      */}

      {/* <StatusFlags
        flags={statusFlags}
        fontSize="1.75rem"
        fontFamily='"DM Sans", sans-serif'
        textColor="#F6E4C1"
        borderRadius="33px"
      /> */}

      {/* <div className="absolute z-40" style={{ top: "1rem", right: "1rem" }}>
        <ShareButton url={currentUrl} />
      </div> */}

      {hasArtistBio && (
  <div
    style={{
      backgroundColor: "#2493A9",
      paddingTop: "2rem", // container padding
      paddingBottom: "2rem",
    }}
  >
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
        marginTop: "0rem",     // ✅ equal top margin
        marginBottom: "1.85rem",  // ✅ equal bottom margin
        marginLeft: isMobile ? "30px" : "310px",
        marginRight: "30px",
      }}
      bioStyle={{
        marginLeft: "30px",
        marginRight: "30px",
        marginTop: "1rem",     // ✅ match identity tag bottom
        marginBottom: "1rem",  // ✅ even spacing
        maxWidth: "calc(100% - 60px)",
      }}
    />
  </div>
)}


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
    storytelling, this work reflects a deep engagement with place, people, and
    purpose.
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

      {programBadges.length > 0 && (
        <div
          className="relative bg-[#F6E4C1] py-6 m-0 overflow-hidden h-[50vh] min-h-[300px] max-h-[600px]"
          style={{ zIndex: 50 }}
        >
          <div className="max-w-6xl mx-auto px-4 relative h-full">
            <ProgramStamps artistSlug={slug} />
          </div>
        </div>
      )}

      {hasStories && (
        <section className="bg-[#f2f2f2] rounded-xl px-[30px] py-[30px] mt-[0px]">
          <FeaturedStories stories={stories} authorSlug={slug} />
        </section>
      )}

      {isModalOpen && (
        <Lightbox
          images={[headshotUrl || fallbackImage]}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
