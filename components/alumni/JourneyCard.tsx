"use client";

import React, { useRef, useState, useEffect } from "react";
import type { JourneyCardType } from "@/lib/types";

interface JourneyCardProps {
  card: JourneyCardType; // or just JourneyCard
  index: number;
  onClick?: (index: number) => void;
}

const categoryStyles: Record<string, { bg: string; color: string; dot?: string }> = {
  "DAT MEMORY": { bg: "#6C00AF", color: "#f2f2f2", dot: "#2493A9" },
  "CREATIVE WORK": { bg: "#F25C4D", color: "#f2f2f2", dot: "#2493A9" },
  "WHAT I’M UP TO": { bg: "#2493A9", color: "#f2f2f2", dot: "#2493A9" },
  "WHAT’S NEXT": { bg: "#FFCC00", color: "#241123", dot: "#2493A9" },
  "FUTURE VISION": { bg: "#3FB0C6", color: "#241123", dot: "#2493A9" },
  "": { bg: "#241123", color: "#f2f2f2", dot: "#2493A9" },
};

export default function JourneyCard({ card, index, onClick }: JourneyCardProps) {
  const { mediaUrl, title, category = "", story } = card;
  const isVideo =
    mediaUrl?.endsWith(".mp4") ||
    mediaUrl?.includes("youtube") ||
    mediaUrl?.includes("vimeo");

  const categoryStyle = categoryStyles[category.toUpperCase()] || categoryStyles[""];
  const cardRef = useRef<HTMLDivElement>(null);
  const [isWide, setIsWide] = useState(false);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const width = entry.contentRect.width;
        setIsWide(width > 500);
      }
    });

    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={cardRef}
      onClick={() => onClick?.(index)}
      className="cursor-pointer transition-transform"
      style={{
        position: "relative",
        backgroundColor: "#65C7DA",
        borderRadius: "20px",
        boxShadow: "0px 0px 25px rgba(0, 0, 0, 0.15)",
        overflow: "hidden",
        border: "1px solid rgba(0, 0, 0, 0.05)",
        fontFamily: "DM Sans, sans-serif",
        display: "flex",
        flexDirection: "column",
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        boxSizing: "border-box",
      }}
    >
      {/* Badge */}
      {category && (
        <div
          style={{
            position: "absolute",
            top: "0.5rem",
            left: "0.5rem",
            backgroundColor: categoryStyle.bg,
            color: categoryStyle.color,
            fontSize: "0.9rem",
            padding: "0.4rem 0.85rem 0.4rem 0.6rem",
            borderRadius: "999px",
            fontFamily: "Space Grotesk, sans-serif",
            fontWeight: 600,
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
                backgroundColor: categoryStyle.dot || "#2493A9",
                boxShadow: "inset 1px 1px 2px rgba(0, 0, 0, 0.35)",
                border: "1px solid rgba(0,0,0,0.1)",
              }}
            />
          </div>
          {category}
        </div>
      )}

      {/* Divider */}
      <div style={{ padding: "3rem 1.5rem 0rem" }}>
        <div
          style={{
            width: "100%",
            height: "2px",
            backgroundColor: "#241123",
            opacity: 0.1,
          }}
        />
      </div>

      {/* Main Content */}
      <div
        style={{
          display: "flex",
          flexDirection: isWide ? "row" : "column",
          padding: "1rem 1.5rem 1.5rem",
          gap: "1rem",
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
          boxSizing: "border-box",
        }}
      >
        {/* Media */}
        <div
          style={{
            width: isWide ? "200px" : "100%",
            maxWidth: "100%",
            minWidth: 0,
            aspectRatio: isWide ? "1 / 1" : "16 / 9",
            flexShrink: 1,
            borderRadius: "12px",
            overflow: "hidden",
            backgroundColor: "#f2f2f2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isVideo ? (
            <video
              src={mediaUrl}
              muted
              playsInline
              loop
              preload="metadata"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          ) : (
            <img
              src={mediaUrl}
              alt={title}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          )}
        </div>

        {/* Text */}
        <div
          style={{
            flex: "1 1 0",
            minWidth: 0,
            maxWidth: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            textAlign: isWide ? "left" : "center",
          }}
        >
          <h3
            style={{
              fontFamily: "Space Grotesk, sans-serif",
              fontSize: "1.1rem",
              fontWeight: 700,
              color: "#241123",
              marginBottom: "0.5rem",
            }}
          >
            {title}
          </h3>

          {story && (
            <p
              style={{
                fontFamily: "DM Sans, sans-serif",
                fontSize: "0.95rem",
                color: "#333",
                lineHeight: "1.5",
                marginBottom: "1rem",
              }}
            >
              {story}
            </p>
          )}

          <button
            style={{
              backgroundColor: "#6C00AF",
              color: "#FFEFE3",
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              fontFamily: "Space Grotesk, sans-serif",
              letterSpacing: "0.4em",
              fontSize: "0.8rem",
              textTransform: "uppercase",
              width: isWide ? "fit-content" : "100%",
              margin: isWide ? "0" : "0 auto",
              opacity: 0.9,
              border: "none",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.6")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.9")}
          >
            Learn More
          </button>
        </div>
      </div>
    </div>
  );
}
