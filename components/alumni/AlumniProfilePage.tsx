"use client";

import Head from "next/head";
import { useState, useMemo } from "react";
import { AlumniRow, StoryRow } from "@/lib/types";
import { getPostersForArtist } from "@/lib/getPostersForArtist";
import ProfileCard from "@/components/profile/ProfileCard";
import ImageCarousel from "@/components/alumni/ImageCarousel";
import FieldNotes from "@/components/alumni/FieldNotes";
import Lightbox from "@/components/shared/LightboxPortal";
import AlumniProfileBackdrop from "@/components/alumni/AlumniProfileBackdrop";
import ContactWidget from "@/components/shared/ContactWidget";
import ContactOverlay from "@/components/shared/ContactOverlay"; // ✅ NEW

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

  const hasContactInfo = !!(email || website || (socials && socials.length > 0));
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

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

      {/* ✅ Vertical "Contact" tab (link triggers #contact) */}
      <ContactWidget email={email} website={website} socials={socials} />

      <main>
        <AlumniProfileBackdrop backgroundKey={backgroundChoice}>
          <div
            className="relative w-[90vw] sm:w-[85vw] lg:w-[80vw] max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-36 z-10 shadow-[0_8px_24px_rgba(0,0,0,0.25)] bg-white"
            style={{ marginTop: "-33rem", overflow: "visible" }}
          >
            <div className="relative z-10" style={{ overflow: "visible" }}>
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
          </div>

          {imageUrls.length > 0 && (
            <section className="mt-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <ImageCarousel
                images={imageUrls}
                onImageClick={setLightboxIndex}
              />
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

      {/* ✅ New lightweight overlay modal */}
      <ContactOverlay email={email} website={website} socials={socials} />
    </>
  );
}
