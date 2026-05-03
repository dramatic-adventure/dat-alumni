"use client";

import { useMemo, useState } from "react";
import Lightbox from "@/components/shared/Lightbox";
import ThumbnailMedia from "@/components/shared/ThumbnailMedia";

export type HighlightCard = {
  headline: string;
  mediaUrl?: string;
  subheadline?: string;
  body?: string;
  ctaLink?: string;
  ctaText?: string;
  evergreen?: boolean;
  expirationDate?: string;
  category?: string;
};

function HighlightCardView({ card, compact }: { card: HighlightCard; compact: boolean }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <>
      <div
        style={{
          background: "linear-gradient(150deg, #FAF0D4 0%, #EDDFBF 45%, #E4D1AC 100%)",
          borderRadius: compact ? "10px" : "16px",
          padding: compact ? "1rem" : "1.25rem",
          border: "1px solid rgba(36,17,35,0.1)",
          boxShadow: compact ? "none" : "0 3px 16px rgba(120,80,20,0.12)",
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
              backgroundColor: "#241123",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "0.7rem",
              fontWeight: 700,
              color: "rgba(36,17,35,0.45)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            Highlight
          </span>
        </div>

        {/* Image */}
        {card.mediaUrl && (
          <div
            style={{
              marginBottom: "0.875rem",
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
            <ThumbnailMedia
              imageUrl={card.mediaUrl}
              title={card.headline}
              onClick={() => setLightboxOpen(true)}
            />
          </div>
        )}

        {/* Category */}
        {card.category && (
          <p
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "0.68rem",
              fontWeight: 700,
              color: "#2493A9",
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              marginBottom: "0.3rem",
            }}
          >
            {card.category}
          </p>
        )}

        {/* Headline — left gold accent bar */}
        {card.headline && (
          <h2
            style={{
              fontFamily: "var(--font-anton), system-ui, sans-serif",
              fontSize: compact ? "1.25rem" : "1.75rem",
              color: "#241123",
              textTransform: "uppercase",
              letterSpacing: "0.02em",
              lineHeight: "1.1",
              marginBottom: "0.6rem",
              borderLeft: "3px solid #FFCC00",
              paddingLeft: "0.6rem",
              borderRadius: 0,
            }}
          >
            {card.headline}
          </h2>
        )}

        {/* Subheadline */}
        {card.subheadline && (
          <p
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "0.78rem",
              color: "#4B3A50",
              letterSpacing: "0.03em",
              marginBottom: "0.75rem",
            }}
          >
            {card.subheadline}
          </p>
        )}

        {/* Body */}
        {card.body && (
          <p
            style={{
              fontFamily: "var(--font-rock-salt), system-ui, sans-serif",
              fontSize: compact ? "0.8rem" : "0.95rem",
              color: "#241123",
              lineHeight: "1.6",
              opacity: 0.75,
              marginBottom: card.ctaLink ? "1rem" : "0",
            }}
          >
            {card.body}
          </p>
        )}

        {/* CTA */}
        {card.ctaLink && (
          <a
            href={card.ctaLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "block",
              backgroundColor: "#241123",
              color: "#FFCC00",
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
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.75")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            {card.ctaText || "More Details"}
          </a>
        )}
      </div>

      {lightboxOpen && card.mediaUrl && (
        <Lightbox images={[card.mediaUrl]} onClose={() => setLightboxOpen(false)} />
      )}
    </>
  );
}

function isExpired(c: HighlightCard): boolean {
  if (c.evergreen) return false;
  if (!c.expirationDate) return false;
  return new Date(c.expirationDate) < new Date();
}

export default function HighlightPanel({
  cards = [],
  compact = false,
}: {
  cards: HighlightCard[];
  compact?: boolean;
}) {
  const sorted = useMemo(() => {
    const active = cards.filter((c) => !isExpired(c));
    const evergreen = active.filter((c) => c.evergreen);
    const others = active.filter((c) => !c.evergreen);
    return [...evergreen, ...others];
  }, [cards]);

  // Show only the primary (first sorted) item; remaining items surface in the unified archive
  const primary = sorted[0];
  if (!primary) return null;

  return <HighlightCardView card={primary} compact={compact} />;
}
