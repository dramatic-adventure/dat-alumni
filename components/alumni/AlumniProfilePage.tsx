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
import AlumniProfileBackdrop from "@/components/alumni/AlumniProfileBackdrop";

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
    backgroundChoice = "kraft",
  } = data;

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const authorStories = allStories.filter((story) => story.authorSlug === slug);

  return (
    <main>
      <AlumniProfileBackdrop backgroundKey={backgroundChoice}>
        {/* 🧱 Floating White Card Container */}
        <div className="max-w-4xl mx-auto mt-[-2rem] mb-24 px-6 sm:px-10 relative z-10 rounded-2xl shadow-xl bg-white overflow-hidden">
          {/* 🟫 Kraft / Teal Profile Section */}
          <div
            className="rounded-t-2xl overflow-hidden"
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
            <section className="mt-10">
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
            </section>
          )}

          {/* 📷 Image Gallery */}
          {imageUrls.length > 0 && (
            <section className="mt-10">
              <ImageCarousel
                images={imageUrls}
                onImageClick={setLightboxIndex}
              />
            </section>
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
            <section className="mt-10">
              <FieldNotes notes={fieldNotes} />
            </section>
          )}

          {/* 🌍 Featured Stories */}
          {authorStories.length > 0 && (
            <section className="mt-10">
              <FeaturedStories stories={allStories} authorSlug={slug} />
            </section>
          )}
        </div>
      </AlumniProfileBackdrop>
    </main>
  );
}
