"use client";

import { useState, useEffect, useMemo } from "react";
import { useSwipeable } from "react-swipeable";
import Lightbox from "@/components/shared/Lightbox";
import ThumbnailMedia from "@/components/shared/ThumbnailMedia";

export type MemoryEntry = {
  tag?: string;
  headline: string;
  subheadline?: string;
  body?: string;
  ctaLink?: string;
  mediaUrl?: string;
  evergreen?: boolean;
};

export default function DatMemoryPanel({ memories = [] }: { memories: MemoryEntry[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [showArchive, setShowArchive] = useState(false);

  const carouselMemories = useMemo(() => {
    return memories.filter((m) => m.evergreen);
  }, [memories]);

  const archiveMemories = useMemo(() => {
    return memories.filter((m) => !m.evergreen);
  }, [memories]);

  const current = carouselMemories[currentIndex];
  const multiple = carouselMemories.length > 1;

  const handlers = useSwipeable({
    onSwipedLeft: () => multiple && setCurrentIndex((currentIndex + 1) % carouselMemories.length),
    onSwipedRight: () => multiple && setCurrentIndex((currentIndex - 1 + carouselMemories.length) % carouselMemories.length),
    trackMouse: true,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % carouselMemories.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [carouselMemories.length]);

  return (
    <>
      <div
        {...handlers}
        style={{
          backgroundColor: "#FDF6EC",
          color: "#241123",
          margin: "0 auto",
          padding: "1.5rem 1.5rem",
          maxWidth: "1120px",
          width: "100%",
          borderRadius: "20px",
          boxShadow: "0px 0px 25px rgba(0, 0, 0, 0.1)",
          position: "relative",
          border: "1px solid rgba(0,0,0,0.1)",
          height: "700px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          fontFamily: "DM Sans",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "0.5rem",
            left: "0.5rem",
            backgroundColor: "#C29200",
            color: "#FFF8E7",
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
              backgroundColor: "#FFF8E7",
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
                backgroundColor: "#C29200",
                border: "1px solid rgba(0,0,0,0.1)",
              }}
            />
          </div>
          DAT Memory
        </div>

        <div style={{ marginTop: "1.6rem", marginBottom: "1.5rem" }}>
          <div
            style={{
              width: "100%",
              height: "2px",
              backgroundColor: "#241123",
              opacity: 0.05,
            }}
          />
        </div>

        {current?.mediaUrl && (
          <div style={{ marginBottom: "1rem", border: "1px solid rgba(0,0,0,0.05)" }}>
            <ThumbnailMedia imageUrl={current.mediaUrl} title={current.headline} onClick={() => setLightboxOpen(true)} />
          </div>
        )}

        {current?.headline && (
          <h2
            style={{
              fontFamily: "Anton, sans-serif",
              fontSize: "2rem",
              marginTop: "0.5rem",
              marginBottom: "0.25rem",
              lineHeight: "1.3",
              letterSpacing: "0.04rem",
              textTransform: "uppercase",
            }}
          >
            {current.headline}
          </h2>
        )}

        {current?.subheadline && (
          <p
            style={{
              fontFamily: "Space Grotesk, sans-serif",
              fontSize: "0.8rem",
              marginBottom: "1.5rem",
              textTransform: "uppercase",
              textAlign: "left",
            }}
          >
            {current.subheadline}
          </p>
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "center",
            height: "300px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              flexGrow: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              paddingBottom: "2rem",
            }}
          >
            <p
              style={{
                fontFamily: "Rock Salt, cursive",
                fontSize: "1.25rem",
                color: current?.body ? "#241123" : "#888",
                lineHeight: "1.4",
                transform: "rotate(-2deg)",
                margin: 0,
              }}
            >
              {current.body || "No story added yet — just a memory."}
            </p>
          </div>

          {current?.ctaLink && (
            <a
              href={current.ctaLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block",
                backgroundColor: "#241123",
                color: "#FFF8E7",
                padding: "0.5rem 0.8rem",
                textTransform: "uppercase",
                textAlign: "center",
                letterSpacing: "0.4em",
                fontSize: "1rem",
                borderRadius: "0.5rem",
                fontFamily: "Space Grotesk, sans-serif",
                textDecoration: "none",
                width: "100%",
                opacity: "0.9",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.6")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.9")}
            >
              More Details
            </a>
          )}
        </div>

        {multiple && (
          <div style={{ display: "flex", justifyContent: "center", margin: "1rem 0" }}>
            {carouselMemories.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  margin: "0 5px",
                  backgroundColor: i === currentIndex ? "#241123" : "#D7CBB1",
                  transition: "all 0.2s ease-in-out",
                }}
              />
            ))}
          </div>
        )}

        <div style={{ marginTop: "1.5rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem" }}>
            <input type="checkbox" checked={showArchive} onChange={() => setShowArchive(!showArchive)} /> Show Archive
          </label>

          {showArchive && archiveMemories.length > 0 && (
            <div style={{ marginTop: "0.5rem" }}>
              {archiveMemories.map((entry, i) => (
                <div
                  key={i}
                  onClick={() => {
                    carouselMemories.push(entry);
                    setCurrentIndex(carouselMemories.length - 1);
                  }}
                  style={{
                    cursor: "pointer",
                    marginBottom: "1rem",
                    padding: "0.5rem",
                    border: "1px solid #EADDC3",
                    borderRadius: "0.5rem",
                    backgroundColor: "#FFF",
                  }}
                >
                  <strong>{entry.headline}</strong>
                  <br />
                  <span style={{ fontSize: "0.9rem" }}>{entry.subheadline}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {lightboxOpen && current?.mediaUrl && (
        <Lightbox images={[current.mediaUrl]} onClose={() => setLightboxOpen(false)} />
      )}
    </>
  );
}