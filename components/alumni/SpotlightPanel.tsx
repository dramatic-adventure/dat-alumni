"use client";

import { useState } from "react";
import Lightbox from "@/components/shared/Lightbox";
import StoryMedia from "@/components/shared/StoryMedia";
import ThumbnailMedia from "@/components/shared/ThumbnailMedia";

export type SpotlightUpdate = {
  tag?: string;
  headline: string;
  subheadline?: string;
  body: string;
  ctaLink?: string;
  mediaUrl?: string;
};

export default function SpotlightPanel({ updates = [] }: { updates: SpotlightUpdate[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [showArchive, setShowArchive] = useState(false);

  const current = updates[currentIndex];
  const multiple = updates.length > 1;

  const isImageFile = (url?: string) =>
    !!url && /\.(png|jpe?g|gif|webp|svg|heic|heif)$/i.test(url.split("?")[0]);

  const pastUpdates = updates
    .map((u, i) => ({ ...u, index: i }))
    .filter((_, i) => i !== currentIndex)
    .reverse();

  return (
    <>
      <div
        className="rounded-2xl shadow-xl space-y-6"
        style={{
          backgroundColor: "#FFCC00",
          margin: "2rem auto",
          padding: "1.5rem",
          maxWidth: "430px",
          width: "90%",
        }}
      >
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
          {/* Left (Text) */}
          <div className="flex-1 space-y-3">
            {/* Tag */}
            {current?.tag && (
              <span className="inline-block bg-[#FF8AAE] text-[#241123] px-3 py-1 text-sm font-spacegrotesk rounded-md">
                {current.tag}
              </span>
            )}
            {current?.headline && (
              <h2 className="font-anton text-2xl sm:text-3xl md:text-4xl text-[#241123]">
                {current.headline}
              </h2>
            )}
            {current?.subheadline && (
              <p className="font-dmsans text-base text-[#241123]">
                {current.subheadline}
              </p>
            )}
            {current?.body && (
              <p className="font-spacegrotesk text-base text-[#241123]">
                {current.body}
              </p>
            )}

            {current?.ctaLink && (
              <a
                href={current.ctaLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-[#241123] text-white px-4 py-2 text-sm uppercase tracking-wide font-spacegrotesk rounded-md hover:bg-[#3a1d3d] transition-colors duration-150"
              >
                More Details
              </a>
            )}
          </div>

          {/* Right (Media) */}
          {current.mediaUrl && (
  <div
    className="aspect-square w-full cursor-pointer"
    onClick={() => setLightboxOpen(true)}
  >
    <ThumbnailMedia
      imageUrl={current.mediaUrl}
      title={current.headline}
    />
  </div>
)}

        </div>

        {/* Carousel Dots */}
        {multiple && (
          <div className="flex justify-center mt-2">
            {updates.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-3 h-3 rounded-full mx-1 transition-all duration-200 ${
                  i === currentIndex ? "bg-[#241123]" : "bg-[#F2DFA2]"
                }`}
                aria-label={`Switch to update ${i + 1}`}
              />
            ))}
          </div>
        )}

        {/* Archive */}
        {showArchive && pastUpdates.length > 0 && (
          <div className="mt-6 border-t pt-4 space-y-4">
            {pastUpdates.map((update, index) => (
              <div key={index} className="flex gap-4 items-start border-b pb-4">
                <div className="w-[140px] shrink-0">
                  <ThumbnailMedia imageUrl={update.mediaUrl} title={update.headline} />
                </div>
                <div className="flex-1">
                  <h3 className="font-anton text-lg text-[#241123]">{update.headline}</h3>
                  {update.subheadline && (
                    <p className="font-dmsans text-sm text-[#4B3A50]">{update.subheadline}</p>
                  )}
                  <p className="font-spacegrotesk text-sm mt-1 text-[#241123]">{update.body}</p>
                  {update.ctaLink && (
                    <a
                      href={update.ctaLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-1 text-sm text-[#241123] underline hover:no-underline"
                    >
                      More Details
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Archive Toggle */}
        {pastUpdates.length > 0 && (
          <button
            onClick={() => setShowArchive(!showArchive)}
            className="font-rocksalt text-sm text-[#241123] mt-2"
          >
            {showArchive ? "hide updates ←" : "see all updates →"}
          </button>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && current?.mediaUrl && (
        <Lightbox
          images={[current.mediaUrl]}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}
