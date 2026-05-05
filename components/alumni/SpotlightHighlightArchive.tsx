"use client";

import { useState, useMemo } from "react";
import type { SpotlightUpdate } from "@/components/alumni/SpotlightPanel";
import type { HighlightCard } from "@/components/alumni/HighlightPanel";
import ThumbnailMedia from "@/components/shared/ThumbnailMedia";

type ArchiveItem = {
  type: "spotlight" | "highlight";
  headline: string;
  subheadline?: string;
  body?: string;
  mediaUrl?: string;
  ctaLink?: string;
  category?: string;
  sortDate?: string;
  evergreen?: boolean;
};

function toArchiveSpotlight(u: SpotlightUpdate): ArchiveItem {
  return {
    type: "spotlight",
    headline: u.headline,
    subheadline: u.subheadline,
    body: u.body,
    mediaUrl: u.mediaUrl,
    ctaLink: u.ctaLink,
    category: u.category,
    evergreen: u.evergreen,
  };
}

function toArchiveHighlight(c: HighlightCard): ArchiveItem {
  return {
    type: "highlight",
    headline: c.headline,
    subheadline: c.subheadline,
    body: c.body,
    mediaUrl: c.mediaUrl,
    ctaLink: c.ctaLink,
    category: c.category,
    evergreen: c.evergreen,
  };
}

function ArchiveRow({ item }: { item: ArchiveItem }) {
  const isSpotlight = item.type === "spotlight";

  return (
    <div
      style={{
        display: "flex",
        gap: "0.875rem",
        alignItems: "flex-start",
        padding: "1rem 0",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {/* Thumbnail */}
      {item.mediaUrl && (
        <div
          style={{
            width: "72px",
            flexShrink: 0,
            borderRadius: "6px",
            overflow: "hidden",
          }}
        >
          <ThumbnailMedia imageUrl={item.mediaUrl} title={item.headline} />
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Type badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            marginBottom: "0.35rem",
          }}
        >
          <div
            style={{
              width: "5px",
              height: "5px",
              borderRadius: "50%",
              backgroundColor: isSpotlight ? "#FFCC00" : "rgba(255,255,255,0.35)",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "0.62rem",
              fontWeight: 700,
              color: isSpotlight ? "rgba(255,204,0,0.6)" : "rgba(255,255,255,0.35)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            {isSpotlight ? "DAT Spotlight" : "Highlight"}
          </span>
        </div>

        {/* Category */}
        {item.category && (
          <p
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "0.62rem",
              fontWeight: 700,
              color: "#74C1CF",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              marginBottom: "0.2rem",
            }}
          >
            {item.category}
          </p>
        )}

        {/* Headline */}
        <h3
          style={{
            fontFamily: "var(--font-anton), system-ui, sans-serif",
            fontSize: "1rem",
            color: isSpotlight ? "#FFCC00" : "rgba(255,255,255,0.88)",
            textTransform: "uppercase",
            lineHeight: "1.15",
            marginBottom: item.subheadline || item.body ? "0.3rem" : "0",
            ...(isSpotlight ? {} : {
              borderLeft: "2px solid rgba(255,204,0,0.4)",
              paddingLeft: "0.5rem",
            }),
          }}
        >
          {item.headline}
        </h3>

        {/* Subheadline */}
        {item.subheadline && (
          <p
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "0.78rem",
              color: "rgba(255,255,255,0.5)",
              marginBottom: "0.25rem",
            }}
          >
            {item.subheadline}
          </p>
        )}

        {/* Body (truncated) */}
        {item.body && (
          <p
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "0.8rem",
              color: "rgba(255,255,255,0.45)",
              lineHeight: "1.45",
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {item.body}
          </p>
        )}

        {/* CTA */}
        {item.ctaLink && (
          <a
            href={item.ctaLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              marginTop: "0.4rem",
              fontSize: "0.72rem",
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontWeight: 600,
              color: "#FFCC00",
              textDecoration: "underline",
              letterSpacing: "0.04em",
            }}
          >
            More Details →
          </a>
        )}
      </div>
    </div>
  );
}

interface SpotlightHighlightArchiveProps {
  spotlights: SpotlightUpdate[];
  highlights: HighlightCard[];
  /** When true (default), skip index 0 of each array (primary already shown above). Set false to show all passed items. */
  skipFirst?: boolean;
}

export default function SpotlightHighlightArchive({
  spotlights,
  highlights,
  skipFirst = true,
}: SpotlightHighlightArchiveProps) {
  const [open, setOpen] = useState(false);

  // Merge all items beyond the first of each (those are shown in the primary panels).
  // Sort evergreen first, then maintain original order.
  const archiveItems = useMemo(() => {
    const sortedSpotlights = [
      ...spotlights.filter((u) => u.evergreen),
      ...spotlights.filter((u) => !u.evergreen),
    ];
    const sortedHighlights = [
      ...highlights.filter((c) => c.evergreen),
      ...highlights.filter((c) => !c.evergreen),
    ];

    const extra = [
      ...(skipFirst ? sortedSpotlights.slice(1) : sortedSpotlights).map(toArchiveSpotlight),
      ...(skipFirst ? sortedHighlights.slice(1) : sortedHighlights).map(toArchiveHighlight),
    ];

    return extra;
  }, [spotlights, highlights, skipFirst]);

  if (archiveItems.length === 0) return null;

  return (
    <div
      style={{
        marginTop: "1rem",
        fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          fontFamily: "var(--font-rock-salt), system-ui, sans-serif",
          fontSize: "0.78rem",
          color: "rgba(255,255,255,0.45)",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.75)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}
      >
        {open
          ? `hide archive ↑`
          : `see all (${archiveItems.length} more) →`}
      </button>

      {open && (
        <div
          style={{
            backgroundColor: "#1A0C22",
            borderRadius: "12px",
            padding: "0.25rem 1.25rem",
            marginTop: "0.75rem",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {archiveItems.map((item, i) => (
            <ArchiveRow key={i} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
