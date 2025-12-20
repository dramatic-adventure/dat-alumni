// components/profile/ProfileCard.tsx
"use client";

import { useState, useLayoutEffect, useEffect, useRef } from "react";
import dynamic from "next/dynamic";

import ArtistBio from "./ArtistBio";
import PosterStrip from "@/components/shared/PosterStrip";
import ProgramStamps from "@/components/alumni/ProgramStamps";
import Lightbox from "@/components/shared/Lightbox";

import {
  StoryRow,
  Production,
  SpotlightUpdate,
  Update,
} from "@/lib/types";
import { productionMap } from "@/lib/productionMap";

import MobileProfileHeader from "@/components/alumni/MobileProfileHeader";
import DesktopProfileHeader from "@/components/alumni/DesktopProfileHeader";
import useIsMobile from "@/hooks/useIsMobile";

import SpotlightPanel from "@/components/alumni/SpotlightPanel";
import HighlightPanel from "@/components/alumni/HighlightPanel";
import type { HighlightCard as UIHighlightCard } from "@/components/alumni/HighlightPanel";

import ProfileShowcaseSection from "@/components/profile/ProfileShowcaseSection";

import CategoryScroller from "@/components/alumni/CategoryScroller";

import { mapSpotlightUpdateToUpdate } from "@/lib/mapSpotlightUpdateToUpdate";

import JourneyMiniCard from "@/components/alumni/JourneyMiniCard";

/* -----------------------------------------------------------
 * Local helpers for mapping CSV rows → panel props
 * (CSV headers: profileSlug, type, title, subtitle, bodyNote,
 *  mediaUrls, mediaType, eventDate, evergreen, expirationDate,
 *  ctaText, ctaUrl, featured, sortDate, tags)
 * ----------------------------------------------------------*/
type RawRow = {
  profileSlug?: string;
  type?: string;
  title?: string;
  subtitle?: string;
  bodyNote?: string;
  mediaUrls?: string;
  mediaType?: string;
  eventDate?: string;
  evergreen?: string | boolean;
  expirationDate?: string;
  ctaText?: string;
  ctaUrl?: string;
  featured?: string | boolean;
  sortDate?: string;
  tags?: string;
  [key: string]: any;
};

const norm = (s?: string) => (s ?? "").trim().toLowerCase();
const coerceBool = (v: any) => {
  if (typeof v === "boolean") return v;
  const s = norm(String(v));
  return s === "true" || s === "1" || s === "yes" || s === "y";
};
const firstMedia = (s?: string) => {
  if (!s) return "";
  const parts = s.split(/[,\s]+/).map((t) => t.trim()).filter(Boolean);
  return parts[0] ?? "";
};
const isSpotlightRow = (row: RawRow) => {
  const t = norm(row.type);
  return t === "dat spotlight" || t === "spotlight" || t === "dat-spotlight";
};
const isHighlightRow = (row: RawRow) => {
  const t = norm(row.type);
  return t === "highlight" || t === "highlights";
};

const toSpotlightUpdate = (row: RawRow): SpotlightUpdate => ({
  tag: row.type || "DAT Spotlight",
  headline: row.title || "",
  body: row.bodyNote || "",
  ctaLink: row.ctaUrl,
  mediaUrl: firstMedia(row.mediaUrls),
  evergreen: coerceBool(row.evergreen),
});

const toHighlightCard = (row: RawRow): UIHighlightCard => ({
  headline: row.title || "",
  mediaUrl: firstMedia(row.mediaUrls),
  subheadline: row.subtitle || undefined,
  body: row.bodyNote || undefined,
  ctaLink: row.ctaUrl || undefined,
  evergreen: coerceBool(row.evergreen),
  expirationDate: row.expirationDate || undefined,
  // category is optional in the panel type; map later if you add a CSV column
});

/** Filter rows to the current profile if profileSlug is present. */
const filterForSlugIfPresent = (rows: RawRow[], slug: string) => {
  const anyHaveSlug =
    rows.some((r) => r.profileSlug != null && String(r.profileSlug).trim() !== "");
  return anyHaveSlug ? rows.filter((r) => norm(r.profileSlug) === norm(slug)) : rows;
};
/* --------------------------------------------------------- */

const FeaturedStories = dynamic(() => import("@/components/shared/FeaturedStories"), {
  ssr: false,
});

/* -----------------------------------------------------------
 * Minimal local helper to normalize mixed string|number years
 * without touching shared types or other modules.
 * ----------------------------------------------------------*/
type WithMaybeYear = { year?: string | number };
const normalizeProductionYear = <T extends WithMaybeYear>(p: T) => ({
  ...p,
  year:
    typeof p.year === "string"
      ? parseInt(p.year, 10) || 0
      : (p.year ?? 0),
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
  /** Raw rows from spotlights-highlights.csv for this profile (or global; we filter). */
  updates?: RawRow[];
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
  const profileCardRef = useRef<HTMLDivElement>(null);

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

  // 🔧 Normalize year before typing/sorting to satisfy lib/types.Production
  const featuredProductions = (
    Object.values(productionMap) as Array<WithMaybeYear & Record<string, any>>
  )
    .filter((p) => p?.artists?.[slug])
    .map(normalizeProductionYear)
    .sort((a, b) => Number(b.year) - Number(a.year)) as unknown as Production[]; // keep downstream typings intact

  const hasContactInfo = !!(email || website || (socials && socials.length > 0));

  /* ---------- MAP RAW ROWS → PANEL PROPS (for this profile) ---------- */
  const rowsForThisProfile = filterForSlugIfPresent(updates as RawRow[], slug);

  const spotlightUpdates = rowsForThisProfile.filter(isSpotlightRow).map(toSpotlightUpdate);
  const highlightUpdates: UIHighlightCard[] = rowsForThisProfile
    .filter(isHighlightRow)
    .map(toHighlightCard);

  const hasSpotlight = spotlightUpdates.length > 0;
  const hasHighlight = highlightUpdates.length > 0;

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxUrls, setLightboxUrls] = useState<string[]>([]);

  const spotlightSection = hasSpotlight ? <SpotlightPanel updates={spotlightUpdates} /> : null;
  const highlightSection = hasHighlight ? <HighlightPanel cards={highlightUpdates} /> : null;

  /* ----- Build categorized journey updates from non-spotlight/highlight rows ----- */
  const categorizedUpdatesMap = new Map<string, Update[]>();

  rowsForThisProfile
    .filter((u) => !isHighlightRow(u) && !isSpotlightRow(u))
    .forEach((raw) => {
      // Build a minimal SpotlightUpdate-like object so the existing mapper can handle it
      const pseudo: SpotlightUpdate = {
        tag: raw.type,
        headline: raw.title || "",
        body: raw.bodyNote || "",
        ctaLink: raw.ctaUrl,
        mediaUrl: firstMedia(raw.mediaUrls),
        evergreen: coerceBool(raw.evergreen),
      };
      const update = mapSpotlightUpdateToUpdate(pseudo);
      const category = update.tag || "Other";
      if (!categorizedUpdatesMap.has(category)) categorizedUpdatesMap.set(category, []);
      categorizedUpdatesMap.get(category)!.push(update);
    });

  const categorizedJourneyUpdates = Array.from(categorizedUpdatesMap.entries()).map(
    ([category, updates]) => ({ category, updates })
  );

  /* ----------------------------- RENDER ------------------------------ */
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
      {(hasArtistBio || hasSpotlight || hasHighlight) && (
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
              fontFamily='var(--font-dm-sans), system-ui, sans-serif'
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

                // 🆕 keep prose readable & contained
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                overflowWrap: "anywhere",
              }}
            />
          )}
        </div>
      )}

      {/* 🎬 Spotlight + Highlights */}
      {(hasSpotlight || hasHighlight) && (
        <div style={{ margin: "2rem 30px 2.5rem 30px" }}>
          <ProfileShowcaseSection>
            {spotlightSection}
            {highlightSection}
          </ProfileShowcaseSection>
        </div>
      )}

      {/* 🗂️ Category Scroller */}
      <CategoryScroller
        categories={categorizedJourneyUpdates}
        onCardClick={(category) => {
          const el = document.getElementById(`journey-category-${category}`);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }}
      />

      {/* 🗂️ Categorized Journey Updates */}
      {categorizedJourneyUpdates.length > 0 && (
        <div style={{ margin: "2rem 30px 3rem 30px" }}>
          <ProfileShowcaseSection>
            {categorizedJourneyUpdates.map(({ category, updates }) => (
              <div key={category} id={`journey-category-${category}`} style={{ marginBottom: "2rem" }}>
                <h3
                  style={{
                    fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif',
                    fontSize: "2rem",
                    marginBottom: "1rem",
                    color: "#241123",
                  }}
                >
                  {category}
                </h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
                  {updates.map((update, index) => (
                    <JourneyMiniCard
                      key={index}
                      update={update}
                      onClick={() => {
                        const link = update.ctaLink?.trim();
                        const media =
                          update.mediaUrls?.split(",").map((url) => url.trim()).filter(Boolean) ||
                          [];

                        if (link?.startsWith("http")) {
                          window.open(link, "_blank");
                        } else if (media.length > 0) {
                          setLightboxUrls(media);
                          setLightboxOpen(true);
                        } else {
                          alert(
                            "This update has no link or media. Here's the content:\n\n" +
                              (update.body || "No content")
                          );
                        }
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </ProfileShowcaseSection>
        </div>
      )}

      {/* 💛 Featured Productions Section */}
      {featuredProductions.length > 0 && (
        <div className="bg-[#19657c] py-[30px] px-[30px]">
          <h2
            className="text-6xl text-[#D9A919] mb-4"
            style={{ fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif' }}
          >
            Featured DAT Work
          </h2>
          <p
            className="text-[#5BBFD3] text-lg max-w-3xl mb-8"
            style={{ fontFamily: 'var(--font-dm-sans), system-ui, sans-serif' }}
          >
            Developed through cross-cultural exchange and a fearless approach to
            storytelling, this work reflects a deep engagement with place, people,
            and purpose.
          </p>
          <PosterStrip
            posters={featuredProductions.map((p) => ({
              title: p.title,
              slug: p.slug, // used for keys + /theatre/[slug]
              posterUrl: `/posters/${p.slug}-landscape.jpg`,
              url: `/theatre/${p.slug}`, // relative, stays inside your app
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

      {/* 💡 Journey Update Lightbox */}
      {lightboxOpen && <Lightbox images={lightboxUrls} onClose={() => setLightboxOpen(false)} />}
    </div>
  );
}
