"use client";

import { useState } from "react";
import JourneyPanel from "@/components/profile/JourneyPanel";
import Lightbox from "@/components/shared/Lightbox";
import { JourneyCard } from "@/components/hooks/useFilteredJourneyCards";

interface JourneyShowcaseProps {
  journeyCards: JourneyCard[];
}

export default function JourneyShowcase({ journeyCards }: JourneyShowcaseProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const mediaUrls = journeyCards.map((card) => card.mediaUrl);

  const handleCardClick = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <section className="bg-[#f5f1eb] py-12 px-6 md:px-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        <div className="md:col-span-2 col-span-1 h-full">
          <JourneyPanel cards={journeyCards} onCardClick={handleCardClick} />
        </div>
      </div>

      {lightboxOpen && (
        <Lightbox
          images={mediaUrls}
          startIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </section>
  );
}
