"use client";

import { useState, useEffect, useRef } from "react";
import { useSwipeable } from "react-swipeable";
import JourneyCard from "@/components/alumni/JourneyCard";
import Lightbox from "@/components/shared/Lightbox";
import type { JourneyCard as JourneyCardType } from "@/components/hooks/useFilteredJourneyCards";

interface CategoryBlock {
  category: string;
  cards: JourneyCardType[];
}

const VALID_CATEGORIES = ["DAT Memory", "Creative Work", "What I’m Up To", "What’s Next"] as const;
type ValidCategory = typeof VALID_CATEGORIES[number];

const isValidCategory = (c: string): c is ValidCategory =>
  VALID_CATEGORIES.includes(c as ValidCategory);

interface JourneyCategoryCarouselProps {
  categories: CategoryBlock[];
}

export default function JourneyCategoryCarousel({ categories }: JourneyCategoryCarouselProps) {
  const allCards: JourneyCardType[] = categories.flatMap((block) =>
    isValidCategory(block.category)
      ? block.cards.map((card) => ({
          ...card,
          category: block.category as ValidCategory,
        }))
      : []
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);

  // Auto-advance every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % allCards.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [allCards.length]);

  const handlers = useSwipeable({
    onSwipedLeft: () => setCurrentIndex((prev) => (prev + 1) % allCards.length),
    onSwipedRight: () => setCurrentIndex((prev) => (prev - 1 + allCards.length) % allCards.length),
    trackMouse: true,
  });

  const handleCardClick = () => {
    const url = allCards[currentIndex].mediaUrl;
    setMediaUrls([url]);
    setLightboxOpen(true);
  };

  if (allCards.length === 0) return null;

  return (
    <>
      <div
        {...handlers}
        className="w-full max-w-full px-4 py-6"
        style={{ display: "flex", justifyContent: "center" }}
      >
        <div style={{ width: "100%", maxWidth: "800px" }}>
          <JourneyCard
            card={allCards[currentIndex]}
            index={currentIndex}
            onClick={() => handleCardClick()}
          />
        </div>
      </div>

      {lightboxOpen && (
        <Lightbox
          images={mediaUrls}
          startIndex={0}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      {/* Navigation dots */}
      <div className="flex justify-center mt-4">
        {allCards.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            style={{
              width: "10px",
              height: "10px",
              margin: "0 5px",
              borderRadius: "50%",
              border: "none",
              backgroundColor: i === currentIndex ? "#241123" : "#D8D8D8",
              transition: "background-color 0.3s ease",
              cursor: "pointer",
            }}
          />
        ))}
      </div>
    </>
  );
}
