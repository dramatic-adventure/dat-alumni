// components/alumni/AlumniProfilePage.tsx

import Link from "next/link";
import ShareButton from "@/components/ShareButton";
import { AlumniRow, StoryRow } from "@/lib/types";
import ProfileHeader from "./ProfileHeader";
import * as ArtistStatementModule from "./ArtistStatement";
const ArtistStatement = ArtistStatementModule.default;

import * as ImageCarouselModule from "./ImageCarousel";
const ImageCarousel = ImageCarouselModule.default;

import * as FieldNotesModule from "./FieldNotes";
const FieldNotes = FieldNotesModule.default;

import * as AlumniMapPreviewModule from "@/components/alumni/AlumniMapPreview";
const AlumniMapPreview = AlumniMapPreviewModule.default;

const DEBUG = process.env.SHOW_DAT_DEBUG === "true";
if (DEBUG) {
  console.log("🧪 AlumniProfilePage loaded");
}

interface AlumniProfileProps {
  data: AlumniRow;
  relatedStories?: StoryRow[];
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
    artistStatement,
    fieldNotes,
    imageUrls,
    locations = [],
  } = data;

  const profileUrl = `https://stories.dramaticadventure.com/alumni/${slug}`;

  if (DEBUG) {
    console.log("🧪 ProfileHeader type:", typeof ProfileHeader);
    console.log("🧪 ArtistStatement type:", typeof ArtistStatement);
    console.log("🧪 ImageCarousel type:", typeof ImageCarousel);
    console.log("🧪 FieldNotes type:", typeof FieldNotes);
    console.log("🧪 AlumniMapPreview type:", typeof AlumniMapPreview);
    console.log("🧪 Rendering AlumniMapPreview with", locations.length, "locations");
  }

  return (
    <main>
      <div
        className="story-page pointer-events-auto"
        style={{ marginTop: "8rem", marginBottom: "8rem" }}
      >
        {/* Top Bar: Back Link + Share */}
        <div className="flex justify-between items-center mb-4">
          <a
            href="https://dramaticadventure.com/story-map#impact"
            style={{
              fontFamily: "var(--font-rock-salt), cursive",
              fontSize: "1.15rem",
              color: "#ff007f",
              textDecoration: "none",
            }}
          >
            ← Explore More Stories
          </a>
          <ShareButton url={profileUrl} />
        </div>

        <ProfileHeader
          name={name}
          role={role ?? ""}
          headshotUrl={headshotUrl ?? ""}
          programBadges={programBadges ?? []}
        />

        {artistStatement && (
          <div className="popup-story mt-6">
            <ArtistStatement statement={artistStatement} />
          </div>
        )}

        {imageUrls && imageUrls.length > 0 && (
          <div className="mt-6">
            <ImageCarousel images={imageUrls} />
          </div>
        )}

        {fieldNotes && fieldNotes.length > 0 && (
          <div className="popup-story mt-6">
            <FieldNotes notes={fieldNotes} />
          </div>
        )}

        {locations.length > 0 && (
          <div className="mt-6">
            <AlumniMapPreview locations={locations} />
          </div>
        )}

        {relatedStories.length > 0 && (
          <div className="mt-10">
            <h2 className="popup-title">Featured Stories</h2>
            <div className="grid md:grid-cols-2 gap-6 mt-4">
              {relatedStories.map((story) => (
                <a
                  key={story.slug}
                  href={`/story/${story.slug}`}
                  className="block border rounded-lg p-4 shadow-md bg-white hover:shadow-lg transition"
                >
                  <h3 className="font-bold text-lg mb-2">{story.title}</h3>
                  {story.imageUrl && (
                    <img
                      src={story.imageUrl}
                      alt={story.title}
                      className="w-full h-48 object-cover rounded mb-2"
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
