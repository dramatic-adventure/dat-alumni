"use client";

import { useState, useEffect, useMemo } from "react";
import { useSwipeable } from "react-swipeable";
import Lightbox from "@/components/shared/Lightbox";
import ThumbnailMedia from "@/components/shared/ThumbnailMedia";

export type SpotlightUpdate = {
  tag?: string;
  headline: string;
  subheadline?: string;
  body: string;
  ctaLink?: string;
  mediaUrl?: string;
  evergreen?: boolean;
  highlighted?: boolean;
};

export default function SpotlightPanel({ updates = [] }: { updates: SpotlightUpdate[] }) {
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
    if (carouselUpdates.length <= 1) return;
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
          backgroundColor: "#B7E4EA",
          opacity: 0.9,
          margin: "0rem auto",
          padding: "1.5rem 1.5rem",
          maxWidth: "600px",
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
            backgroundColor: "#241123",
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
          DAT Spotlight
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
            <ThumbnailMedia
              imageUrl={current.mediaUrl}
              title={current.headline}
              onClick={() => setLightboxOpen(true)}
            />
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
                  backgroundColor: "#241123",
                  color: "#74C1CF",
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

        {multiple && (
          <div style={{ display: "flex", justifyContent: "center", margin: "1rem 0" }}>
            {carouselUpdates.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  margin: "0 5px",
                  backgroundColor: i === currentIndex ? "#241123" : "#F2DFA2",
                  transition: "all 0.2s ease-in-out",
                }}
              />
            ))}
          </div>
        )}

        {pastUpdates.length > 0 && (
          <div style={{ textAlign: "center", marginBottom: "0.5rem" }}>
            <label style={{ fontFamily: "Space Grotesk", fontSize: "0.85rem", color: "#241123" }}>
              <input
                type="checkbox"
                checked={includeArchiveInCarousel}
                onChange={() => setIncludeArchiveInCarousel(!includeArchiveInCarousel)}
                style={{ marginRight: "0.4rem" }}
              />
              Show archive in carousel
            </label>
          </div>
        )}

        {pastUpdates.length > 0 && (
          <button
            onClick={() => setShowArchive(!showArchive)}
            style={{
              fontFamily: "Rock Salt, cursive",
              fontSize: "0.9rem",
              color: "#241123",
              marginTop: "0.75rem",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              display: "block",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            {showArchive ? "hide updates ←" : "see all updates →"}
          </button>
        )}

        {showArchive && pastUpdates.length > 0 && (
          <div style={{ borderTop: "1px solid #ccc", paddingTop: "1rem", marginTop: "1rem" }}>
            {pastUpdates.map((update, index) => (
              <div
                key={index}
                onClick={() => {
                  setCurrentIndex(update.index);
                  setShowArchive(false);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                style={{
                  display: "flex",
                  gap: "1rem",
                  alignItems: "flex-start",
                  marginBottom: "1rem",
                  borderBottom: "1px solid #e5e5e5",
                  paddingBottom: "1rem",
                  cursor: "pointer",
                }}
              >
                <div style={{ width: "100px", flexShrink: 0 }}>
                  <ThumbnailMedia imageUrl={update.mediaUrl} title={update.headline} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3
                    style={{
                      fontFamily: "Anton, sans-serif",
                      fontSize: "1.1rem",
                      color: "#241123",
                    }}
                  >
                    {update.headline}
                  </h3>
                  {update.subheadline && (
                    <p
                      style={{
                        fontFamily: "DM Sans, sans-serif",
                        fontSize: "0.9rem",
                        color: "#4B3A50",
                      }}
                    >
                      {update.subheadline}
                    </p>
                  )}
                  <p
                    style={{
                      fontFamily: "Space Grotesk, sans-serif",
                      fontSize: "0.9rem",
                      color: "#241123",
                      marginTop: "0.5rem",
                    }}
                  >
                    {update.body}
                  </p>
                  {update.ctaLink && (
                    <a
                      href={update.ctaLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-block",
                        fontSize: "0.8rem",
                        marginTop: "0.25rem",
                        color: "#241123",
                        textDecoration: "underline",
                      }}
                    >
                      More Details
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {lightboxOpen && current?.mediaUrl && (
        <Lightbox images={[current.mediaUrl]} onClose={() => setLightboxOpen(false)} />
      )}
    </>
  );
}
