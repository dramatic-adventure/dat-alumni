// components/alumni/AlumniProfilePage.tsx

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

  /**
   * Optional list of slug aliases for this alum (including canonical).
   * Used ONLY to match cross-refs (productions/stories) that might still
   * reference a legacy slug.
   */
  slugAliases?: string[];

  offsetTop?: string; // Additional offset for fine-tuning (e.g., "-2rem")
  offsetBottom?: string; // Space below section (e.g., "-6rem")
  minSectionHeight?: string; // Ensures parallax coverage (e.g., "140vh")
}

const HEADER_HEIGHT = "84px"; // ✅ Adjust if your header height changes

function cleanStr(v?: string | null): string | undefined {
  const t = (v ?? "").trim();
  return t.length ? t : undefined;
}

/**
 * Normalize slug-ish things for cross-ref matching.
 * Handles:
 * - whitespace/case
 * - accidental "/alumni/<slug>" paths
 * - URL-ish strings where pathname contains /alumni/<slug>
 */
function normSlugish(raw: unknown): string {
  const s0 = String(raw ?? "").trim();
  if (!s0) return "";

  // If someone stored "/alumni/slug" (or full URL), extract the slug portion.
  // We do this in a non-throwing way.
  try {
    const u = new URL(s0, "http://local");
    const m = u.pathname.match(/^\/alumni\/([^\/?#]+)/i);
    if (m?.[1]) return m[1].trim().toLowerCase();
  } catch {
    // fall through
  }

  const m2 = s0.match(/^\/alumni\/([^\/?#]+)/i);
  if (m2?.[1]) return m2[1].trim().toLowerCase();

  return s0.toLowerCase();
}

export default function AlumniProfilePage({
  data,
  allStories,
  slugAliases = [],
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
  } = data || ({} as AlumniRow);

  clientDebug("🧪 updates passed to ProfileCard:", updates);

  // ✅ Prefer roles[] if available, otherwise fallback to role
  const displayRole = roles.length > 0 ? roles.join(", ") : role;

  // ✅ Canonical + alias slugs as a normalized set for robust matching
  const aliasNormSet = useMemo(() => {
    const set = new Set<string>();
    const add = (v: unknown) => {
      const t = normSlugish(v);
      if (t) set.add(t);
    };

    add(slug);
    for (const a of slugAliases) add(a);

    return set;
  }, [slug, slugAliases]);

  // ✅ Author stories (alias-aware, normalized)
  const authorStories = useMemo(() => {
    return allStories.filter((story) => {
      const as = (story as any)?.authorSlug;
      if (!as) return false;
      return aliasNormSet.has(normSlugish(as));
    });
  }, [allStories, aliasNormSet]);

  // ✅ Detect mobile viewport
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkScreen = () => setIsMobile(window.innerWidth < 768);
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  // ✅ Use the canonical slug for ProfileCard routing
  const safeSlugForLinks = cleanStr(slug) ?? "";

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
                width: "85%",
                maxWidth: "1200px",
                margin: isMobile ? "0" : "0 auto",

                ...(isMobile && {
                  marginLeft: "5%",
                  marginRight: "10%",
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
                slug={safeSlugForLinks}
                slugAliases={slugAliases}
                name={name}
                role={displayRole}
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
