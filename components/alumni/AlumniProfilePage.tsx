"use client";
export {};

import { useState } from "react";
import ShareButton from "@/components/ShareButton";
import { AlumniRow, StoryRow } from "@/lib/types";
import ProfileCard from "./ProfileCard";
import ImageCarousel from "./ImageCarousel";
import FieldNotes from "./FieldNotes";
import PosterStrip from "@/components/PosterStrip";
import AlumniMapPreview from "@/components/alumni/AlumniMapPreview";
import Lightbox from "@/components/Lightbox";
import LightboxPortal from "@/components/LightboxPortal";

interface AlumniProfileProps {
  data: AlumniRow;
  relatedStories?: StoryRow[];
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
  relatedStories = [],
}: AlumniProfileProps) {
  const {
    slug,
    name,
    role,
    headshotUrl,
    programBadges,
    identityTags,
    statusFlags,
    artistStatement,
    fieldNotes,
    imageUrls = [],
    locations = [],
    posterUrls = [],
  } = data;

  const profileUrl = `https://stories.dramaticadventure.com/alumni/${slug}`;
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <main>
      <div
        className="max-w-[1000px] mx-auto shadow-md overflow-hidden rounded-[16px] bg-white"
        style={{ marginTop: "8rem", marginBottom: "8rem" }}
      >
        {/* 🟫 Kraft / Teal / White Profile Section */}
        <div
          className="rounded-t-[16px] overflow-hidden"
          style={{
            backgroundColor: "#C39B6C",
            backgroundImage: "url('/texture/kraft-background.png')",
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            backgroundBlendMode: "multiply",
            backgroundPosition: "center",
          }}
        >
          <ProfileCard
            slug={slug}
            name={name}
            role={role ?? ""}
            headshotUrl={headshotUrl ?? ""}
            programBadges={programBadges ?? []}
            identityTags={identityTags ?? []}
            statusFlags={statusFlags ?? []}
            artistStatement={artistStatement ?? ""}
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
          <LightboxPortal>
            <Lightbox
              images={imageUrls}
              startIndex={lightboxIndex}
              onClose={() => setLightboxIndex(null)}
            />
          </LightboxPortal>
        )}

        {/* 🗺️ Map Preview */}
        {locations.length > 0 && (
          <div className="mt-6 px-6">
            <AlumniMapPreview locations={locations} />
          </div>
        )}

        {/* 📓 Field Notes */}
        {fieldNotes && fieldNotes.length > 0 && (
          <div className="popup-story mt-6 px-6">
            <FieldNotes notes={fieldNotes} />
          </div>
        )}

        {/* 📰 Related Stories */}
        {relatedStories.length > 0 && (
          <div className="mt-10 px-6 pb-10">
            <h2 className="popup-title">Featured Stories</h2>
            <div className="grid md:grid-cols-2 gap-6 mt-4">
              {relatedStories.map((story) => (
                <a
                  key={story.slug}
                  href={`/story/${story.slug}`}
                  className="block border rounded-lg p-4 shadow-md bg-white hover:shadow-lg transition"
                  aria-label={`View story titled ${story.title}`}
                >
                  <h3 className="font-bold text-lg mb-2">{story.title}</h3>
                  {story.imageUrl && (
                    <img
                      src={story.imageUrl}
                      alt={story.title}
                      className="w-full h-48 object-cover rounded mb-2"
                      loading="lazy"
                    />
                  )}
                  <p className="text-sm text-gray-600">
                    {story.story?.slice(0, 100)}...
                  </p>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
