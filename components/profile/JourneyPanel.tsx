"use client";

import { useState, useEffect, useMemo } from "react";
import { useSwipeable } from "react-swipeable";
import ThumbnailMedia from "@/components/shared/ThumbnailMedia";
import { JourneyCard } from "@/components/hooks/useFilteredJourneyCards";

interface JourneyPanelProps {
  cards: JourneyCard[];
  onCardClick?: (index: number) => void;
}

const categoryStyles: Record<string, { bg: string; color: string }> = {
  "DAT MEMORY": { bg: "#6C00AF", color: "#f2f2f2" },
  "CREATIVE WORK": { bg: "#F25C4D", color: "#f2f2f2" },
  "WHAT I’M UP TO": { bg: "#2493A9", color: "#f2f2f2" },
  "WHAT’S NEXT": { bg: "#FFCC00", color: "#241123" },
  "FUTURE VISION": { bg: "#3FB0C6", color: "#241123" },
  "": { bg: "#241123", color: "#f2f2f2" }, // fallback
};

export default function JourneyPanel({ cards = [], onCardClick }: JourneyPanelProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showArchive, setShowArchive] = useState(false);

  const sortedCards = useMemo(() => {
    const evergreen = cards.filter((c) => c.evergreen);
    const others = cards.filter((c) => !c.evergreen);
    return [...evergreen, ...others];
  }, [cards]);

  const current = sortedCards[currentIndex];
  const multiple = sortedCards.length > 1;
  const pastCards = sortedCards.filter((_, i) => i !== currentIndex).reverse();

  const handlers = useSwipeable({
    onSwipedLeft: () => multiple && setCurrentIndex((currentIndex + 1) % sortedCards.length),
    onSwipedRight: () => multiple && setCurrentIndex((currentIndex - 1 + sortedCards.length) % sortedCards.length),
    trackMouse: true,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % sortedCards.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [sortedCards.length]);

  return (
    <div
      {...handlers}
      style={{
        position: "relative",
        height: "700px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#65C7DA",
        opacity: 0.9,
        borderRadius: "20px",
        boxShadow: "0px 0px 25px rgba(0, 0, 0, 0.15)",
        border: "1px solid rgba(0,0,0,0.1)",
        fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
        width: "100%",
      }}
    >
      {/* Badge */}
      <div
        style={{
          position: "absolute",
          top: "0.5rem",
          left: "0.5rem",
          backgroundColor: "#F25C4D",
          color: "#241123",
          fontSize: "0.9rem",
          padding: "0.4rem 0.85rem 0.4rem 0.6rem",
          borderRadius: "999px",
          fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
          fontWeight: 900,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          boxShadow: "1px 1px 3px rgba(0,0,0,0.25)",
          zIndex: 30,
        }}
      >
        <div
          style={{
            width: "16px",
            height: "16px",
            borderRadius: "50%",
            backgroundColor: "#FFCC00",
            boxShadow: "inset 3px 3px 3px rgba(0, 0, 0, 0.25)",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "15.5px",
              height: "14.5px",
              borderRadius: "50%",
              backgroundColor: "#2493A9",
              boxShadow: "inset 1px 1px 2px rgba(0, 0, 0, 0.35)",
              border: "1px solid rgba(0,0,0,0.1)",
            }}
          />
        </div>
        My Journey
      </div>

      {/* Scrollable Content */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "2rem 1.5rem 1.5rem",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <div style={{ marginTop: "1.1rem", marginBottom: "1.9rem" }}>
          <div
            style={{
              width: "100%",
              height: "2px",
              backgroundColor: "#241123",
              opacity: 0.1,
            }}
          />
        </div>

        {current?.mediaUrl ? (
          <div style={{ marginBottom: "1.9rem" }}>
            <ThumbnailMedia
              imageUrl={current.mediaUrl}
              title={current.title}
              onClick={() => onCardClick?.(currentIndex)}
            />
          </div>
        ) : (
          <div style={{ marginTop: "1.9rem", marginBottom: "1.9rem" }}>
            <div
              style={{
                width: "100%",
                height: "2px",
                backgroundColor: "#241123",
                opacity: 0.1,
              }}
            />
          </div>
        )}

        {/* Category Badge */}
        {current?.category && (
          <div
            style={{
              display: "inline-block",
              backgroundColor: categoryStyles[current.category?.toUpperCase() || ""].bg,
              color: categoryStyles[current.category?.toUpperCase() || ""].color,
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "0.75rem",
              padding: "0.3rem 0.75rem",
              borderRadius: "999px",
              textTransform: "uppercase",
              fontWeight: 600,
              marginBottom: "0rem",
              letterSpacing: "0.03em",
              alignSelf: "flex-start",
            }}
          >
            {current.category}
          </div>
        )}

        {/* Title */}
        <h2
          style={{
            fontFamily: "var(--font-anton), system-ui, sans-serif",
            fontSize: "2rem",
            color: "#241123",
            marginBottom: "0.5rem",
            lineHeight: "1.3",
            letterSpacing: "0.04rem",
            textTransform: "uppercase",
          }}
        >
          {current?.title}
        </h2>

        {/* Story */}
        {current?.story && (
          <p
            style={{
              fontFamily: "var(--font-rock-salt), system-ui, sans-serif",
              fontSize: "1.2rem",
              color: "#241123",
              lineHeight: "1.4",
              textAlign: "center",
              transform: "rotate(-2deg)",
            }}
          >
            {current.story}
          </p>
        )}

        <div style={{ marginTop: "auto" }}>
          {multiple && (
            <div style={{ display: "flex", justifyContent: "center", margin: "1rem 0" }}>
              {sortedCards.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    margin: "0 5px",
                    backgroundColor: i === currentIndex ? "#241123" : "#FFCC00",
                    transition: "all 0.2s ease-in-out",
                  }}
                />
              ))}
            </div>
          )}

          {pastCards.length > 0 && (
            <button
              onClick={() => setShowArchive(!showArchive)}
              style={{
                fontFamily: "var(--font-rock-salt), system-ui, sans-serif",
                fontSize: "0.9rem",
                color: "#241123",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                display: "block",
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              {showArchive ? "hide stories ←" : "see all stories →"}
            </button>
          )}
        </div>

        {/* Archive Section */}
        {showArchive && pastCards.length > 0 && (
          <div style={{ borderTop: "1px solid #ccc", paddingTop: "1rem", marginTop: "1rem" }}>
            {pastCards.map((card, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: "1rem",
                  alignItems: "flex-start",
                  marginBottom: "1rem",
                  borderBottom: "1px solid #e5e5e5",
                  paddingBottom: "0.5rem",
                }}
              >
                <div style={{ width: "100px", flexShrink: 0 }}>
                  <ThumbnailMedia
                    imageUrl={card.mediaUrl}
                    title={card.title}
                    onClick={() => {
                      const trueIndex = sortedCards.findIndex((c) => c === card);
                      if (trueIndex !== -1) onCardClick?.(trueIndex);
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  {/* Archive pill */}
                  {card.category && (
                    <div
                      style={{
                        display: "inline-block",
                        backgroundColor: categoryStyles[card.category?.toUpperCase() || ""].bg,
                        color: categoryStyles[card.category?.toUpperCase() || ""].color,
                        fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                        fontSize: "0.7rem",
                        padding: "0.25rem 0.6rem",
                        borderRadius: "999px",
                        textTransform: "uppercase",
                        fontWeight: 600,
                        letterSpacing: "0.03em",
                        marginBottom: "0.3rem",
                      }}
                    >
                      {card.category}
                    </div>
                  )}

                  <h3
                    style={{
                      fontFamily: "var(--font-anton), system-ui, sans-serif",
                      fontSize: "1.1rem",
                      color: "#241123",
                      margin: "0.2rem 0",
                    }}
                  >
                    {card.title}
                  </h3>
                  {card.story && (
                    <p
                      style={{
                        fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                        fontSize: "0.9rem",
                        color: "#241123",
                      }}
                    >
                      {card.story}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
