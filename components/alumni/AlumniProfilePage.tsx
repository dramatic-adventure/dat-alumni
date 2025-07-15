"use client";

import Head from "next/head";
import { useMemo, useState } from "react";
import { AlumniRow, StoryRow } from "@/lib/types";
import { getPostersForArtist } from "@/lib/getPostersForArtist";
import ProfileCard from "@/components/profile/ProfileCard";
import ImageCarousel from "@/components/alumni/ImageCarousel";
import FieldNotes from "@/components/alumni/FieldNotes";
import Lightbox from "@/components/shared/LightboxPortal";
import AlumniProfileBackdrop from "@/components/alumni/AlumniProfileBackdrop";

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
    location = "",
    email = "",
    website = "",
    socials = [],
  } = data || {};

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showContact, setShowContact] = useState(false);

  const authorStories = useMemo(
    () => allStories.filter((story) => story.authorSlug === slug),
    [allStories, slug]
  );

  const posters = useMemo(() => getPostersForArtist(slug), [slug]);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{name} | DAT Alumni</title>
      </Head>

      <main>
        <AlumniProfileBackdrop backgroundKey={backgroundChoice}>
          <div
            className="w-full overflow-hidden"
            style={{ marginTop: "-36rem" }}
          >
            <div
  className="w-[79%] mx-auto"
  style={{
    backgroundColor: "transparent",
    position: "relative",
    borderRadius: "18px",
    boxShadow: "0 12px 30px rgba(0, 0, 0, 0.15)", // ✅ Strong but soft shadow
    overflow: "hidden", // ✅ Makes edges look clean
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


            {/* Optional: Image gallery */}
            {imageUrls.length > 0 && (
              <section className="mt-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <ImageCarousel
                  images={imageUrls}
                  onImageClick={setLightboxIndex}
                />
              </section>
            )}

            {/* Optional: Lightbox view */}
            {imageUrls.length > 0 && lightboxIndex !== null && (
              <Lightbox>
                <img
                  src={imageUrls[lightboxIndex]}
                  alt={`Gallery image ${lightboxIndex + 1}`}
                  style={{ width: "100%", height: "auto", objectFit: "contain" }}
                />
              </Lightbox>
            )}

            {/* Optional: Field Notes */}
            {fieldNotes && fieldNotes.length > 0 && (
              <section className="mt-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <FieldNotes notes={fieldNotes} />
              </section>
            )}

            <div className="h-[150px] sm:h-[300px] md:h-[400px]" />
          </div>
        </AlumniProfileBackdrop>
      </main>
    </>
  );
}
