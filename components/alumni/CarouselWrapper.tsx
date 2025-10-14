"use client";

import React from "react";
import JourneyCard from "./JourneyCard"; // adjust the import path if needed
import type { JourneyCardType } from "@/lib/types";

interface Props {
  cards: JourneyCardType[];
  onCardClick?: (index: number) => void;
}

export default function CarouselWrapper({ cards, onCardClick }: Props) {
  return (
    <div
      style={{
        display: "flex",
        gap: "1rem",
        overflowX: "auto",
        padding: "1rem",
        scrollSnapType: "x mandatory",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {cards.map((card, index) => (
        <div
          key={card.id ?? index}
          style={{
            flex: "0 0 auto",
            scrollSnapAlign: "start",
            width: "100%",
            minWidth: "280px", // ✅ allows it to fit on small phones
            maxWidth: "600px", // ✅ prevents it from getting too huge
          }}
        >
          <JourneyCard card={card} index={index} onClick={onCardClick} />
        </div>
      ))}
    </div>
  );
}
