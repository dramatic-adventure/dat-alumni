// hooks/useFilteredJourneyCards.ts
import { useMemo } from "react";
import { SpotlightUpdate } from "@/components/alumni/SpotlightPanel";
import { HighlightCard } from "@/components/alumni/HighlightPanel";

// ✅ Define allowed JourneyCard categories
const validCategories = [
  "DAT Memory",
  "Creative Work",
  "What I’m Up To",
  "What’s Next",
] as const;

type JourneyCategory = typeof validCategories[number];

export type JourneyCard = {
  title: string;
  mediaUrl: string;
  category: JourneyCategory;
  expirationDate?: string;
  fallbackCategory?: JourneyCategory;
  evergreen?: boolean;
  story?: string;
  location?: string;
  programName?: string;
  dateAdded?: string;
};

export default function useFilteredJourneyCards(
  journeyCards: JourneyCard[],
  spotlightUpdates: SpotlightUpdate[],
  highlightCards: HighlightCard[]
) {
  const now = new Date();

  const isActive = (item: { expirationDate?: string; evergreen?: boolean }) => {
    if (item.evergreen) return true;
    if (!item.expirationDate) return true;
    return new Date(item.expirationDate) > now;
  };

  // ✅ Filter spotlight and highlight cards
  const spotlightActive = spotlightUpdates.some(isActive);
  const highlightActive = highlightCards.some(isActive);

  // ✅ Reclassify expired "What’s Next" cards and ensure valid category typing
  const reclassifiedCards: JourneyCard[] = journeyCards.map((card) => {
    const isExpired =
      card.category === "What’s Next" &&
      !card.evergreen &&
      card.expirationDate &&
      new Date(card.expirationDate) <= now;

    const category = isExpired
      ? (card.fallbackCategory || "What I’m Up To") as JourneyCategory
      : card.category;

    return {
      ...card,
      category,
    };
  });

  // ✅ Sorted feed based on dateAdded (newest first)
  const sortedUnifiedFeed = useMemo(() => {
    return [...reclassifiedCards]
      .sort((a, b) => {
        const aTime = a.dateAdded ? new Date(a.dateAdded).getTime() : 0;
        const bTime = b.dateAdded ? new Date(b.dateAdded).getTime() : 0;
        return bTime - aTime;
      })
      .filter((card) => card.mediaUrl);
  }, [reclassifiedCards]);

  // ✅ Filter for complete Story Map entries
  const storyMapEntries = useMemo(() => {
    return reclassifiedCards.filter(
      (c) =>
        c.category === "DAT Memory" &&
        c.story &&
        c.mediaUrl &&
        c.location &&
        c.title &&
        c.programName
    );
  }, [reclassifiedCards]);

  return {
    sortedUnifiedFeed,
    storyMapEntries,
    spotlightActive,
    highlightActive,
  };
}
