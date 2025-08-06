"use client";

import { useState } from "react";
import useFilteredJourneyCards from "@/components/hooks/useFilteredJourneyCards";
import JourneyCardCarousel from "@/components/alumni/JourneyCardCarousel";
import Lightbox from "@/components/shared/Lightbox";

import type { SpotlightUpdate, HighlightCard } from "@/lib/types";
import rawData from "@/lib/mockJourneyData.json" assert { type: "json" };

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

interface MockJourneyData {
  journeyCards: JourneyCard[];
  spotlightUpdates: SpotlightUpdate[];
  highlightCards: HighlightCard[];
}

const mockData = rawData as MockJourneyData;

const journeyCards: JourneyCard[] = mockData.journeyCards;
const spotlightUpdates: SpotlightUpdate[] = mockData.spotlightUpdates;
const highlightCards: HighlightCard[] = mockData.highlightCards;

export default function MyJourney() {
  const { sortedUnifiedFeed } = useFilteredJourneyCards(
    journeyCards,
    spotlightUpdates,
    highlightCards
  );

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const mediaUrls = sortedUnifiedFeed.map((card) => card.mediaUrl);

  if (sortedUnifiedFeed.length === 0) return null;

  return (
    <div
      className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col max-h-[720px] sm:max-h-[600px]"
      style={{
        width: "100%",
        fontFamily: '"DM Sans", sans-serif',
      }}
    >
      <div
        className="p-4 overflow-y-auto"
        style={{
          flexGrow: 1,
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <JourneyCardCarousel
  categories={[
    {
      category: "DAT Memory", // Or choose dynamically if needed
      cards: sortedUnifiedFeed,
    },
  ]}
/>
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
