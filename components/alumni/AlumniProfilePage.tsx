"use client";

import Head from "next/head";
import { useMemo, useState, useEffect } from "react";
import { AlumniRow, StoryRow } from "@/lib/types";
import ProfileCard from "@/components/profile/ProfileCard";
import AlumniProfileBackdrop from "@/components/alumni/AlumniProfileBackdrop";

interface AlumniProfileProps {
  data: AlumniRow;
  allStories: StoryRow[];
  offsetTop?: string;        // Additional offset for fine-tuning (e.g., "-2rem")
  offsetBottom?: string;     // Space below section (e.g., "-6rem")
  minSectionHeight?: string; // Ensures parallax coverage (e.g., "140vh")
}

const HEADER_HEIGHT = "84px"; // ✅ Adjust if your header height changes

export default function AlumniProfilePage({
  data,
  allStories,
  offsetTop = "-40rem",
  offsetBottom = "-25rem",
  minSectionHeight = "100vh",
}: AlumniProfileProps) {
  const {
    slug,
    name,
    role = "",
    headshotUrl = "",
    programBadges = [],
    identityTags = [],
    statusFlags = [],
    artistStatement = "",
    backgroundChoice = "kraft",
    location = "",
    email = "",
    website = "",
    socials = [],
  } = data || {};

  const authorStories = useMemo(
    () => allStories.filter((story) => story.authorSlug === slug),
    [allStories, slug]
  );

  // ✅ Detect mobile viewport
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkScreen = () => setIsMobile(window.innerWidth < 768);
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{name} | DAT Alumni</title>
      </Head>

      <main style={{ margin: 0, padding: 0, width: "100%", display: "block" }}>
        <AlumniProfileBackdrop backgroundKey={backgroundChoice}>
          <section
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-start",
              width: "100%",
              position: "relative",
              minHeight: minSectionHeight,
              paddingTop: 0,
              marginBottom: offsetBottom,
            }}
          >
            <div
              style={{
                width: isMobile ? "100%" : "85%", // ✅ Mobile full width, desktop narrower
                maxWidth: "1200px",
                margin: isMobile ? "0" : "0 auto", // ✅ Center on desktop
                marginLeft: isMobile ? "3%" : "auto", // ✅ Mobile unique left margin
                marginRight: isMobile ? "10%" : "auto", // ✅ Mobile unique right margin
                position: "relative",
                overflow: "visible", // ✅ Contact tab remains visible
                borderRadius: "18px",
                top: `calc(${HEADER_HEIGHT} + ${offsetTop})`, // ✅ Accounts for header height
                transition: "top 0.3s ease-in-out", // ✅ Smooth position change
              }}
            >
              <ProfileCard
                slug={slug}
                name={name}
                role={role}
                headshotUrl={headshotUrl}
                location={location}
                programBadges={programBadges}
                identityTags={identityTags}
                statusFlags={statusFlags}
                artistStatement={artistStatement}
                stories={authorStories}
                email={email}
                website={website}
                socials={socials}
              />
            </div>
          </section>
        </AlumniProfileBackdrop>
      </main>
    </>
  );
}
