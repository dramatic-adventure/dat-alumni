"use client";
export {};

import { useState } from "react";
import { AlumniRow, StoryRow } from "@/lib/types";
import ProfileCard from "@/components/profile/ProfileCard";
import FeaturedStories from "@/components/shared/FeaturedStories";
import PosterStrip from "@/components/shared/PosterStrip";
import ImageCarousel from "@/components/alumni/ImageCarousel";
import FieldNotes from "@/components/alumni/FieldNotes";
import Lightbox from "@/components/shared/LightboxPortal";

interface AlumniProfileProps {
  data: AlumniRow;
  allStories: StoryRow[];
}

function getPosterTitleFromUrl(url: string): string {
  const filename = url.split("/").pop() || "";
  return filename
    .replace(/-portrait\.jpg|-landscape\.jpg/i, "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AlumniProfilePage({
  data,
  allStories,
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
    fieldNotes,
    imageUrls = [],
    posterUrls = [],
  } = data;

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const authorStories = allStories.filter((story) => story.authorSlug === slug);

  return (
    <main>
      <div
        className="max-w-[1000px] mx-auto shadow-md overflow-hidden rounded-[16px] bg-white"
        style={{ marginTop: "8rem", marginBottom: "8rem" }}
      >
        {/* 🟫 Kraft / Teal Profile Section */}
        <div
          className="rounded-t-[16px] overflow-hidden"
          style={{
            backgroundColor: "#C39B6C",
            backgroundImage: "url('/images/texture/kraft-paper.png')",
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            backgroundBlendMode: "multiply",
            backgroundPosition: "center",
          }}
        >
          <ProfileCard
            slug={slug}
            name={name}
            role={role}
            headshotUrl={headshotUrl}
            programBadges={programBadges}
            identityTags={identityTags}
            statusFlags={statusFlags}
            artistStatement={artistStatement}
            stories={authorStories}
          />
        </div>

        {/* 🎭 Featured Posters */}
        {posterUrls.length > 0 && (
          <div className="mt-10 px-6">
            <h2 className="text-xl font-semibold tracking-wide uppercase mb-3 text-[#241123]">
              Featured DAT Works
            </h2>
            <PosterStrip
              posters={posterUrls.map((url) => ({
                imageUrl: url,
                url,
                title: getPosterTitleFromUrl(url),
                layout: "landscape",
              }))}
            />
          </div>
        )}

        {/* 📷 Image Gallery */}
        {imageUrls.length > 0 && (
          <div className="mt-6 px-6">
            <ImageCarousel images={imageUrls} onImageClick={setLightboxIndex} />
          </div>
        )}

        {/* 💡 Lightbox */}
        {imageUrls.length > 0 && lightboxIndex !== null && (
          <Lightbox>
            <img
              src={imageUrls[lightboxIndex]}
              alt={`Gallery image ${lightboxIndex + 1}`}
              style={{ width: "100%", height: "auto", objectFit: "contain" }}
            />
          </Lightbox>
        )}

        {/* 📓 Field Notes */}
        {fieldNotes && fieldNotes.length > 0 && (
          <div className="popup-story mt-6 px-6">
            <FieldNotes notes={fieldNotes} />
          </div>
        )}

        {/* 🌍 Featured Stories */}
        {authorStories.length > 0 && (
          <div className="mt-10 px-6">
            <FeaturedStories stories={allStories} authorSlug={slug} />
          </div>
        )}
      </div>
    </main>
  );
}
