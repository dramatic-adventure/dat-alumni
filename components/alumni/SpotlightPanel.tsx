"use client";

import { useMemo, useState } from "react";
import Lightbox from "@/components/shared/Lightbox";
import ThumbnailMedia from "@/components/shared/ThumbnailMedia";

export type SpotlightUpdate = {
  tag?: string;
  headline: string;
  subheadline?: string;
  body: string;
  ctaLink?: string;
  ctaText?: string;
  mediaUrl?: string;
  evergreen?: boolean;
  expirationDate?: string;
  highlighted?: boolean;
  category?: string;
};

function SpotlightCard({ update, compact }: { update: SpotlightUpdate; compact: boolean }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <>
      <div
        style={{
          backgroundColor: "#241123",
          borderRadius: compact ? "10px" : "16px",
          padding: compact ? "1rem" : "1.25rem",
          border: "1px solid rgba(255,204,0,0.12)",
          boxShadow: compact ? "none" : "0 4px 24px rgba(0,0,0,0.3)",
          fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
        }}
      >
        {/* Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            marginBottom: "1rem",
          }}
        >
          <div
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              backgroundColor: "#FFCC00",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "0.7rem",
              fontWeight: 700,
              color: "rgba(255,204,0,0.65)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            DAT Spotlight
          </span>
        </div>

        {/* Image */}
        {update.mediaUrl && (
          <div
            style={{
              marginBottom: "0.875rem",
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
            <ThumbnailMedia
              imageUrl={update.mediaUrl}
              title={update.headline}
              onClick={() => setLightboxOpen(true)}
            />
          </div>
        )}

        {/* Category */}
        {update.category && (
          <p
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "0.68rem",
              fontWeight: 700,
              color: "#74C1CF",
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              marginBottom: "0.3rem",
            }}
          >
            {update.category}
          </p>
        )}

        {/* Headline */}
        {update.headline && (
          <h2
            style={{
              fontFamily: "var(--font-anton), system-ui, sans-serif",
              fontSize: compact ? "1.25rem" : "1.75rem",
              color: "#FFCC00",
              textTransform: "uppercase",
              letterSpacing: "0.02em",
              lineHeight: "1.1",
              marginBottom: "0.6rem",
            }}
          >
            {update.headline}
          </h2>
        )}

        {/* Subheadline */}
        {update.subheadline && (
          <p
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "0.78rem",
              color: "rgba(230,210,255,0.7)",
              letterSpacing: "0.03em",
              marginBottom: "0.75rem",
            }}
          >
            {update.subheadline}
          </p>
        )}

        {/* Body */}
        {update.body && (
          <p
            style={{
              fontFamily: "var(--font-rock-salt), system-ui, sans-serif",
              fontSize: compact ? "0.8rem" : "0.95rem",
              color: "rgba(255,255,255,0.72)",
              lineHeight: "1.6",
              marginBottom: update.ctaLink ? "1rem" : "0",
            }}
          >
            {update.body}
          </p>
        )}

        {/* CTA */}
        {update.ctaLink && (
          <a
            href={update.ctaLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "block",
              backgroundColor: "#FFCC00",
              color: "#241123",
              padding: "0.6rem 1rem",
              textTransform: "uppercase",
              textAlign: "center",
              letterSpacing: "0.28em",
              fontSize: "0.78rem",
              borderRadius: "6px",
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontWeight: 700,
              textDecoration: "none",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            {update.ctaText || "More Details"}
          </a>
        )}
      </div>

      {lightboxOpen && update.mediaUrl && (
        <Lightbox images={[update.mediaUrl]} onClose={() => setLightboxOpen(false)} />
      )}
    </>
  );
}

function isExpired(u: SpotlightUpdate): boolean {
  if (u.evergreen) return false;
  if (!u.expirationDate) return false;
  return new Date(u.expirationDate) < new Date();
}

export default function SpotlightPanel({
  updates = [],
  compact = false,
}: {
  updates: SpotlightUpdate[];
  compact?: boolean;
}) {
  const sorted = useMemo(() => {
    const active = updates.filter((u) => !isExpired(u));
    const evergreen = active.filter((u) => u.evergreen);
    const others = active.filter((u) => !u.evergreen);
    return [...evergreen, ...others];
  }, [updates]);

  // Show only the primary (first sorted) item; remaining items surface in the unified archive
  const primary = sorted[0];
  if (!primary) return null;

  return <SpotlightCard update={primary} compact={compact} />;
}
