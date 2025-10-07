"use client";

import Head from "next/head";
import { useMemo, useState, useEffect } from "react";
import { AlumniRow, StoryRow } from "@/lib/types";
import ProfileCard from "@/components/profile/ProfileCard";
import AlumniProfileBackdrop from "@/components/alumni/AlumniProfileBackdrop";
import { clientDebug } from "@/lib/clientDebug";

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
  offsetTop = "2rem",
  offsetBottom = "15rem",
  minSectionHeight = "100vh",
}: AlumniProfileProps) {
  const {
    slug,
    name,
    roles = [],
    role = "", // legacy fallback
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
    updates = [], 
  } = data || {};

  clientDebug("🧪 updates passed to ProfileCard:", updates);

  // ✅ Prefer roles[] if available, otherwise fallback to role
  const displayRole = roles.length > 0 ? roles.join(", ") : role;

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
                width: "85%", // ✅ Base width on all screens
                maxWidth: "1200px",
                margin: isMobile ? "0" : "0 auto", // ✅ Desktop: center with auto margins

                // ✅ MOBILE Layout Tweaks
                ...(isMobile && {
                  marginLeft: "5%",   // ✅ Adjustable left margin for mobile
                  marginRight: "10%", // ✅ Adjustable right margin for mobile
                }),

                position: "relative",
                overflow: "visible",
                borderRadius: "18px",
                boxShadow: "6px 12px 20px rgba(0, 0, 0, 0.2)",
                top: `calc(${HEADER_HEIGHT} + ${offsetTop})`,
                transition: "top 0.3s ease-in-out",
              }}
            >
              <ProfileCard
                slug={slug}
                name={name}
                role={displayRole} // ✅ Show combined roles
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
                updates={updates}
              />
            </div>
          </section>
        </AlumniProfileBackdrop>
      </main>
    </>
  );
}
