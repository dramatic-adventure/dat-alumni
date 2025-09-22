"use client";

import { useState, useEffect, useMemo } from "react";
import { useSwipeable } from "react-swipeable";
import Lightbox from "@/components/shared/Lightbox";
import ThumbnailMedia from "@/components/shared/ThumbnailMedia";

export type WhatsNextUpdate = {
  tag?: string;
  headline: string;
  subheadline?: string;
  body: string;
  ctaLink?: string;
  mediaUrl?: string;
  evergreen?: boolean;
};

export default function WhatsNextPanel({ updates = [] }: { updates: WhatsNextUpdate[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [includeArchiveInCarousel, setIncludeArchiveInCarousel] = useState(false);

  const sortedUpdates = useMemo(() => {
    const evergreen = updates.filter((u) => u.evergreen);
    const others = updates.filter((u) => !u.evergreen);
    return [...evergreen, ...others];
  }, [updates]);

  const carouselUpdates = useMemo(() => {
    return includeArchiveInCarousel
      ? sortedUpdates
      : sortedUpdates.filter((_, i) => i === 0 || sortedUpdates[i].evergreen);
  }, [sortedUpdates, includeArchiveInCarousel]);

  const current = carouselUpdates[currentIndex];
  const multiple = carouselUpdates.length > 1;

  const pastUpdates = updates
    .map((u, i) => ({ ...u, index: i }))
    .filter((_, i) => i !== currentIndex)
    .reverse();

  const handlers = useSwipeable({
    onSwipedLeft: () => multiple && setCurrentIndex((currentIndex + 1) % carouselUpdates.length),
    onSwipedRight: () => multiple && setCurrentIndex((currentIndex - 1 + carouselUpdates.length) % carouselUpdates.length),
    trackMouse: true,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % carouselUpdates.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [carouselUpdates.length]);

  return (
    <>
      <div
        {...handlers}
        style={{
          backgroundColor: "#F3F1EF",
          opacity: 0.95,
          margin: "0rem auto",
          padding: "1.5rem 1.5rem",
          maxWidth: "1120px",
          width: "100%",
          borderRadius: "20px",
          boxShadow: "0px 0px 25px rgba(0, 0, 0, 0.15)",
          position: "relative",
          zIndex: 20,
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
            backgroundColor: "#6C00AF",
            color: "#FFCC00",
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
          What&apos;s Next
        </div>

        <div style={{ marginTop: "1.55rem", marginBottom: "1.9rem" }}>
          <div
            style={{
              width: "100%",
              height: "2px",
              backgroundColor: "#241123",
              opacity: 0.1,
            }}
          />
        </div>

        {current?.mediaUrl && (
          <div style={{ marginBottom: "1rem", border: "1px solid rgba(0,0,0,0.1)" }}>
            <ThumbnailMedia imageUrl={current.mediaUrl} title={current.headline} onClick={() => setLightboxOpen(true)} />
          </div>
        )}

        {current?.headline && (
          <h2
            style={{
              fontFamily: "Anton, sans-serif",
              fontSize: "2rem",
              color: "#241123",
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
              color: "#241123",
              marginTop: "0.5rem",
              marginBottom: "1.5rem",
              textTransform: "uppercase",
              textAlign: "left",
            }}
          >
            {current.subheadline}
          </p>
        )}

        {current?.body && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              alignItems: "center",
              height: "300px",
              textAlign: "center",
              padding: "0rem",
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
                  color: "#241123",
                  lineHeight: "1.4",
                  transform: "rotate(-2deg)",
                  margin: 0,
                }}
              >
                {current.body}
              </p>
            </div>

            {current?.ctaLink && (
              <a
                href={current.ctaLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block",
                  backgroundColor: "#6C00AF",
                  color: "#FFCC00",
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
        )}

        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <button
            onClick={() => setShowArchive((prev) => !prev)}
            style={{
              background: "none",
              border: "none",
              color: "#6C00AF",
              fontFamily: "Rock Salt, cursive",
              fontSize: "1rem",
              textDecoration: "underline",
              cursor: "pointer",
              marginTop: "1rem",
            }}
          >
            {showArchive ? "hide past updates ↑" : "see all updates →"}
          </button>
        </div>

        {showArchive && (
          <div
            style={{
              backgroundColor: "#F9F8F7",
              borderTop: "1px solid rgba(0,0,0,0.1)",
              marginTop: "1rem",
              paddingTop: "1rem",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              maxHeight: "300px",
              overflowY: "auto",
            }}
          >
            {pastUpdates.map((update, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: "#FFFFFF",
                  padding: "0.75rem 1rem",
                  borderRadius: "12px",
                  border: "1px solid rgba(0,0,0,0.07)",
                  boxShadow: "0px 0px 4px rgba(0,0,0,0.04)",
                }}
              >
                <strong style={{ fontFamily: "Anton, sans-serif" }}>{update.headline}</strong>
                {update.subheadline && <div style={{ fontSize: "0.75rem", opacity: 0.65 }}>{update.subheadline}</div>}
                <div
                  style={{
                    fontFamily: "Rock Salt, cursive",
                    fontSize: "0.95rem",
                    color: "#241123",
                    marginTop: "0.5rem",
                    lineHeight: 1.4,
                  }}
                >
                  {update.body}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {lightboxOpen && current?.mediaUrl && <Lightbox images={[current.mediaUrl]} onClose={() => setLightboxOpen(false)} />}
    </>
  );
}
