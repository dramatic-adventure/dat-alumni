"use client";
export {};

import Head from "next/head";
import { useState, useMemo } from "react";
import { AlumniRow, StoryRow } from "@/lib/types";
import { getPostersForArtist } from "@/lib/getPostersForArtist";
import ProfileCard from "@/components/profile/ProfileCard";
import FeaturedStories from "@/components/shared/FeaturedStories";
import PosterStrip from "@/components/shared/PosterStrip";
import ImageCarousel from "@/components/alumni/ImageCarousel";
import FieldNotes from "@/components/alumni/FieldNotes";
import Lightbox from "@/components/shared/LightboxPortal";
import AlumniProfileBackdrop from "@/components/alumni/AlumniProfileBackdrop";
import Footer from "@/components/ui/Footer";

interface AlumniProfileProps {
  data: AlumniRow;
  allStories: StoryRow[];
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
  backgroundChoice = "kraft",
  location, // grab raw field here
} = data;

const locationName = location || "";

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const authorStories = useMemo(
    () => allStories.filter((story) => story.authorSlug === slug),
    [allStories, slug]
  );

  const posters = useMemo(() => getPostersForArtist(slug), [slug]);

  const backgroundStyles: Record<string, string> = {
    kraft: "url('/images/texture/kraft-paper.png')",
    coral: "url('/images/texture/coral-paper.png')",
    grape: "url('/images/texture/grape-fiber.png')",
  };

  const bgImage = backgroundStyles[backgroundChoice];

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{name} | DAT Alumni</title>
      </Head>

      <main>
        <AlumniProfileBackdrop backgroundKey={backgroundChoice}>
          <div
            className="mt-0 pt-0 w-[90vw] sm:w-[85vw] lg:w-[80vw] max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-36 relative z-10 shadow-xl bg-white overflow-hidden"
            style={{ marginTop: "-36rem" }}
          >
            {bgImage && (
              <div
                className="absolute inset-0 z-0"
                style={{
                  backgroundImage: bgImage,
                  backgroundSize: "cover",
                  backgroundRepeat: "no-repeat",
                  backgroundBlendMode: "multiply",
                  backgroundPosition: "center",
                }}
              />
            )}

            <div className="relative z-10">
              <ProfileCard
                slug={slug}
                name={name}
                role={role}
                headshotUrl={headshotUrl}
                locationName={locationName}
                programBadges={programBadges}
                identityTags={identityTags}
                statusFlags={statusFlags}
                artistStatement={artistStatement}
                stories={authorStories}
              />
            </div>
          </div>

          {imageUrls.length > 0 && (
            <section className="mt-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <ImageCarousel images={imageUrls} onImageClick={setLightboxIndex} />
            </section>
          )}

          {imageUrls.length > 0 && lightboxIndex !== null && (
            <Lightbox>
              <img
                src={imageUrls[lightboxIndex]}
                alt={`Gallery image ${lightboxIndex + 1}`}
                style={{ width: "100%", height: "auto", objectFit: "contain" }}
              />
            </Lightbox>
          )}

          {fieldNotes && fieldNotes.length > 0 && (
            <section className="mt-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <FieldNotes notes={fieldNotes} />
            </section>
          )}

          <div className="h-[150px] sm:h-[300px] md:h-[400px]" />
        </AlumniProfileBackdrop>
      </main>
    </>
  );
}
