'use client';

import { useState } from 'react';
import JourneyCard from '@/components/alumni/JourneyCard';
import Lightbox from '@/components/shared/Lightbox';
import { shuffleAndInterleaveUpdates } from '@/utils/shuffleAndInterleaveUpdates';
import type { JourneyCardType } from '@/lib/types';

interface JourneyFeedProps {
  updates: JourneyCardType[];
}

export default function JourneyFeed({ updates }: JourneyFeedProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Shuffle to avoid same artist appearing back-to-back
  const cards = shuffleAndInterleaveUpdates(updates);

  const handleCardClick = (index: number) => {
    setLightboxIndex(index);
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
  };

  if (!cards?.length) return null;

  return (
    <div className="w-full max-w-[92rem] mx-auto px-4 sm:px-6 lg:px-8">
      <h2 className="text-2xl md:text-3xl font-bold mb-4">🎭 Journey Feed</h2>

      <div className="flex overflow-x-auto space-x-4 snap-x snap-mandatory pb-6">
        {cards.map((card, index) => (
          <div
            key={card.id ?? `${card.artistId}-${index}`}
            className="
              shrink-0 snap-start
              w-[85vw] sm:w-[65vw] md:w-[45vw] lg:w-[30vw]
              rounded-2xl shadow-xl
              transition-transform duration-300 ease-in-out
              hover:scale-105
            "
            onClick={() => handleCardClick(index)}
            aria-label={card.headline ?? card.title ?? 'Alumni update'}
          >
            {/* JourneyCard requires `index` prop in your codebase */}
            <JourneyCard card={card} index={index} />
          </div>
        ))}
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          images={cards.map((card) => card.mediaUrl ?? '')}
          startIndex={lightboxIndex}
          onClose={closeLightbox}
        />
      )}
    </div>
  );
}
