"use client";

import { useState } from "react";
import useFilteredJourneyCards from "@/components/hooks/useFilteredJourneyCards";
import JourneyCarousel from "@/components/profile/JourneyPanel";
import Lightbox from "@/components/shared/Lightbox";

import type { SpotlightUpdate, HighlightCard } from "@/lib/types";



type JourneyCard = {
  slug: string;
  title: string;
  mediaUrl: string;
  category: "DAT Memory" | "Creative Work" | "What I’m Up To" | "What’s Next";
  expirationDate?: string;
  fallbackCategory?: "DAT Memory" | "Creative Work" | "What I’m Up To" | "What’s Next";
  evergreen?: boolean;
  story?: string;
  location?: string;
  programName?: string;
  dateAdded?: string;
};

const journeyCards: JourneyCard[] = [
  {
    slug: "raw-2025-ecuador",
    title: "RAW 2025, Ecuador",
    mediaUrl: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0",
    category: "DAT Memory",
  },
  {
    slug: "julius-caesar-scene",
    title: "Scene from Julius Caesar",
    mediaUrl: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e",
    category: "Creative Work",
  },
  {
    slug: "coaching-session-reel",
    title: "Coaching Session Reel",
    mediaUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    category: "What I’m Up To",
  },
  {
    slug: "new-play-development",
    title: "New Play Development",
    mediaUrl: "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2",
    category: "What’s Next",
    expirationDate: "2025-09-01",
    fallbackCategory: "Creative Work",
    evergreen: false,
    programName: "RAW 2025",
    dateAdded: "2025-08-02",
  },
];

const spotlightUpdates: SpotlightUpdate[] = [
  {
    tag: "DAT Premiere",
    headline: "CASTAWAY Ecuador 2025",
    body: "A bold new take on a classic, told where the story was born.",
    mediaUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
    evergreen: false,
  },
];

const highlightCards: HighlightCard[] = [
  {
    title: "Booked National Tour",
    headline: "Booked National Tour",
    mediaUrl: "https://images.unsplash.com/photo-1601933470928-c6d4b48d710c",
    expirationDate: "2025-09-15",
    category: "What’s Next",
  },
];

export default function MyJourney() {
  const {
    sortedUnifiedFeed,
  } = useFilteredJourneyCards(journeyCards, spotlightUpdates, highlightCards);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const mediaUrls = sortedUnifiedFeed.map((card) => card.mediaUrl);

  return (
    <div
      className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col"
      style={{
        height: "100%",
        minHeight: "650px",
        width: "100%",
        fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
      }}
    >
      <div
        className="p-4 flex-grow overflow-y-auto"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {sortedUnifiedFeed.length > 0 ? (
          <JourneyCarousel
            cards={sortedUnifiedFeed}
            onCardClick={(index: number) => {
              setLightboxIndex(index);
              setLightboxOpen(true);
            }}
          />
        ) : (
          <p className="text-sm text-gray-600">No updates yet.</p>
        )}
      </div>

      {lightboxOpen && (
        <Lightbox
          images={mediaUrls}
          startIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}
