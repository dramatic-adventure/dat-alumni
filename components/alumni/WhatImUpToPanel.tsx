"use client";

import { useState, useEffect, useMemo } from "react";
import { useSwipeable } from "react-swipeable";
import Lightbox from "@/components/shared/Lightbox";
import ThumbnailMedia from "@/components/shared/ThumbnailMedia";

export type WhatImUpToUpdate = {
  tag?: string;
  headline: string;
  subheadline?: string;
  body: string;
  ctaLink?: string;
  mediaUrl?: string;
  evergreen?: boolean;
};

export default function WhatImUpToPanel({ updates = [] }: { updates: WhatImUpToUpdate[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [archiveMode, setArchiveMode] = useState(false);
  const [selectedArchivedIndex, setSelectedArchivedIndex] = useState<number | null>(null);

  const evergreen = useMemo(() => updates.filter((u) => u.evergreen), [updates]);
  const archived = useMemo(() => updates.filter((u) => !u.evergreen), [updates]);
  const current = archiveMode && selectedArchivedIndex !== null ? archived[selectedArchivedIndex] : evergreen[currentIndex];
  const multiple = evergreen.length > 1;

  const handlers = useSwipeable({
    onSwipedLeft: () => !archiveMode && multiple && setCurrentIndex((currentIndex + 1) % evergreen.length),
    onSwipedRight: () => !archiveMode && multiple && setCurrentIndex((currentIndex - 1 + evergreen.length) % evergreen.length),
    trackMouse: true,
  });

  useEffect(() => {
    if (!archiveMode) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % evergreen.length);
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [evergreen.length, archiveMode]);

  return (
    <>
      <div
        {...handlers}
        style={{
          backgroundColor: "#C6F6D5",
          color: "#1D3B2A",
          padding: "1.5rem",
          margin: "0 auto",
          maxWidth: "1120px",
          width: "100%",
          borderRadius: "20px",
          boxShadow: "0px 0px 25px rgba(0, 0, 0, 0.15)",
          position: "relative",
          height: "700px",
          overflowY: "auto",
          fontFamily: "DM Sans",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Badge */}
        <div
          style={{
            position: "absolute",
            top: "0.5rem",
            left: "0.5rem",
            backgroundColor: "#1D3B2A",
            color: "#C6F6D5",
            fontSize: "0.9rem",
            padding: "0.4rem 0.85rem",
            borderRadius: "999px",
            fontFamily: "Space Grotesk, sans-serif",
            fontWeight: 600,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            zIndex: 30,
          }}
        >
          <div
            style={{
              width: "16px",
              height: "16px",
              borderRadius: "50%",
              backgroundColor: "#C6F6D5",
              boxShadow: "inset 3px 3px 3px rgba(0, 0, 0, 0.25)",
            }}
          />
          What I&apos;m Up To
        </div>

        {/* Divider */}
        <div style={{ marginTop: "2rem", marginBottom: "1.5rem" }}>
          <div
            style={{
              width: "100%",
              height: "2px",
              backgroundColor: "#1D3B2A",
              opacity: 0.15,
            }}
          />
        </div>

        {/* Media */}
        {current?.mediaUrl && (
          <div style={{ marginBottom: "1rem", border: "1px solid rgba(0,0,0,0.1)" }}>
            <ThumbnailMedia imageUrl={current.mediaUrl} title={current.headline} onClick={() => setLightboxOpen(true)} />
          </div>
        )}

        {/* Headline */}
        {current?.headline && (
          <h2
            style={{
              fontFamily: "Anton, sans-serif",
              fontSize: "2rem",
              margin: "0.5rem 0 0.25rem",
              lineHeight: "1.3",
              textTransform: "uppercase",
              color: "#1D3B2A",
            }}
          >
            {current.headline}
          </h2>
        )}

        {/* Subheadline */}
        {current?.subheadline && (
          <p
            style={{
              fontFamily: "Space Grotesk, sans-serif",
              fontSize: "0.8rem",
              marginBottom: "1.25rem",
              textTransform: "uppercase",
              color: "#1D3B2A",
            }}
          >
            {current.subheadline}
          </p>
        )}

        {/* Body */}
        {current?.body && (
          <p
            style={{
              fontFamily: "Rock Salt, cursive",
              fontSize: "1.2rem",
              lineHeight: "1.4",
              color: "#1D3B2A",
              transform: "rotate(-1deg)",
              textAlign: "center",
              marginBottom: "2rem",
            }}
          >
            {current.body}
          </p>
        )}

        {/* CTA Button */}
        {current?.ctaLink && (
          <a
            href={current.ctaLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              backgroundColor: "#1D3B2A",
              color: "#C6F6D5",
              padding: "0.6rem 1rem",
              borderRadius: "0.5rem",
              textDecoration: "none",
              textAlign: "center",
              width: "100%",
              fontFamily: "Space Grotesk, sans-serif",
              letterSpacing: "0.4em",
              fontSize: "1rem",
              textTransform: "uppercase",
              opacity: 0.9,
              display: "inline-block",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.6")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.9")}
          >
            More Details
          </a>
        )}

        {/* Nav Dots */}
        {!archiveMode && multiple && (
          <div style={{ display: "flex", justifyContent: "center", margin: "1rem 0 0.5rem" }}>
            {evergreen.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  margin: "0 5px",
                  backgroundColor: i === currentIndex ? "#1D3B2A" : "#A2E1BC",
                  border: "none",
                  transition: "all 0.2s ease-in-out",
                }}
              />
            ))}
          </div>
        )}

        {/* Archive Mode Toggle */}
        <div style={{ textAlign: "right", marginTop: "auto" }}>
          {!archiveMode ? (
            <button
              onClick={() => setArchiveMode(true)}
              style={{
                fontFamily: "Rock Salt, cursive",
                background: "none",
                border: "none",
                fontSize: "0.85rem",
                color: "#1D3B2A",
                opacity: 0.6,
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              see all updates →
            </button>
          ) : (
            <button
              onClick={() => {
                setArchiveMode(false);
                setSelectedArchivedIndex(null);
              }}
              style={{
                fontFamily: "Rock Salt, cursive",
                background: "none",
                border: "none",
                fontSize: "0.85rem",
                color: "#1D3B2A",
                opacity: 0.6,
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              ← back to current updates
            </button>
          )}
        </div>

        {/* Archived Posts */}
        {archiveMode && (
          <div style={{ marginTop: "1rem" }}>
            {archived.map((entry, i) => (
              <div
                key={i}
                onClick={() => setSelectedArchivedIndex(i)}
                style={{
                  backgroundColor: selectedArchivedIndex === i ? "#A2E1BC" : "#E3FCEB",
                  padding: "0.75rem 1rem",
                  borderRadius: "12px",
                  marginBottom: "0.5rem",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  fontFamily: "DM Sans",
                  color: "#1D3B2A",
                  boxShadow: "0px 1px 4px rgba(0,0,0,0.05)",
                }}
              >
                {entry.headline}
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
