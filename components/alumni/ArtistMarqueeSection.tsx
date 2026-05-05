"use client";

import { useMemo } from "react";
import SpotlightHighlightArchive from "@/components/alumni/SpotlightHighlightArchive";
import type { SpotlightUpdate } from "@/components/alumni/SpotlightPanel";
import type { HighlightCard } from "@/components/alumni/HighlightPanel";

function isExpired(item: { evergreen?: boolean; expirationDate?: string }): boolean {
  if (item.evergreen) return false;
  if (!item.expirationDate) return false;
  try {
    return new Date(item.expirationDate) < new Date();
  } catch {
    return false;
  }
}

function sortActive<T extends { evergreen?: boolean; expirationDate?: string }>(items: T[]): T[] {
  const active = items.filter((i) => !isExpired(i));
  return [...active.filter((i) => i.evergreen), ...active.filter((i) => !i.evergreen)];
}

interface ArtistMarqueeSectionProps {
  spotlightUpdates?: SpotlightUpdate[];
  highlightCards?: HighlightCard[];
  name?: string;
}

export default function ArtistMarqueeSection({
  spotlightUpdates = [],
  highlightCards = [],
  name,
}: ArtistMarqueeSectionProps) {
  const selection = useMemo(() => {
    const sortedSpotlights = sortActive(spotlightUpdates);
    const sortedHighlights = sortActive(highlightCards);

    if (sortedSpotlights.length > 0) {
      const s = sortedSpotlights[0];
      return {
        primary: {
          headline: s.headline,
          subheadline: s.subheadline,
          body: s.body,
          ctaLink: s.ctaLink,
          ctaText: s.ctaText,
          mediaUrl: s.mediaUrl,
          category: s.category,
        },
        itemType: "spotlight" as const,
        archiveSpotlights: sortedSpotlights.slice(1),
        archiveHighlights: sortedHighlights,
      };
    }

    if (sortedHighlights.length > 0) {
      const h = sortedHighlights[0];
      return {
        primary: {
          headline: h.headline,
          subheadline: h.subheadline,
          body: h.body,
          ctaLink: h.ctaLink,
          ctaText: h.ctaText,
          mediaUrl: h.mediaUrl,
          category: h.category,
        },
        itemType: "highlight" as const,
        archiveSpotlights: [] as SpotlightUpdate[],
        archiveHighlights: sortedHighlights.slice(1),
      };
    }

    return {
      primary: null,
      itemType: null,
      archiveSpotlights: [] as SpotlightUpdate[],
      archiveHighlights: [] as HighlightCard[],
    };
  }, [spotlightUpdates, highlightCards]);

  const { primary, itemType, archiveSpotlights, archiveHighlights } = selection;

  if (!primary || !itemType) return null;

  const isSpotlight = itemType === "spotlight";
  const accent = isSpotlight ? "#D9A919" : "#2493A9";

  const badgeLabel = isSpotlight ? "DAT Spotlight" : (primary.category || "Highlight");
  const eyebrowMeta = isSpotlight ? (name ?? "") : (primary.subheadline ?? "");
  const bodySubheadline = isSpotlight ? primary.subheadline : undefined;

  const { mediaUrl, headline, body, ctaLink, ctaText } = primary;
  const hasPhoto = !!mediaUrl;
  const hasArchiveItems = archiveSpotlights.length > 0 || archiveHighlights.length > 0;

  // ── Overlay content (badge → headline → body → CTA) ─────────────────────
  const overlayContent = (
    <div
      style={{
        padding: "clamp(1.25rem, 3vw, 1.75rem)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        // On photo: fill the full card height; on plain bg: size to content
        ...(hasPhoto ? { position: "absolute", inset: 0 } : {}),
      }}
    >
      {/* Badge + meta row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.75rem",
          marginBottom: "clamp(0.6rem, 1.5vw, 0.875rem)",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            display: "inline-block",
            padding: "4px 12px",
            borderRadius: "4px",
            backgroundColor: "rgba(0,0,0,0.52)",
            border: `1px solid ${accent}99`,
            color: accent,
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "0.6rem",
            fontWeight: 700,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            textShadow: "0 1px 3px rgba(0,0,0,0.8)",
          }}
        >
          {badgeLabel}
        </span>
        {eyebrowMeta && (
          <span
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "0.6rem",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "rgba(242,242,242,0.82)",
              textShadow: "0 1px 4px rgba(0,0,0,0.9)",
            }}
          >
            {eyebrowMeta}
          </span>
        )}
      </div>

      {/* Headline */}
      <h2
        style={{
          fontFamily: "var(--dat-font-heading), system-ui, sans-serif",
          fontWeight: 400,
          lineHeight: 0.95,
          color: "#F2F2F2",
          fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
          margin: "0 0 clamp(0.5rem, 1.5vw, 0.75rem)",
        }}
      >
        {headline}
      </h2>

      {/* Spotlight sub-title */}
      {bodySubheadline && (
        <p
          style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "0.82rem",
            color: "rgba(242,242,242,0.65)",
            lineHeight: 1.5,
            margin: "0 0 0.5rem",
          }}
        >
          {bodySubheadline}
        </p>
      )}

      {/* Body excerpt — clamped to 3 lines */}
      {body && (
        <p
          style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            color: "rgba(242,242,242,0.6)",
            lineHeight: 1.6,
            fontSize: "0.88rem",
            margin: "0 0 clamp(0.875rem, 2vw, 1.25rem)",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          } as React.CSSProperties}
        >
          {body}
        </p>
      )}

      {/* CTA row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: ctaLink ? "space-between" : "flex-end",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        {ctaLink && (
          <a
            href={ctaLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              backgroundColor: accent,
              color: isSpotlight ? "#241123" : "#F2F2F2",
              padding: "0.5rem 1.1rem",
              borderRadius: "6px",
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "0.65rem",
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              textDecoration: "none",
              transition: "opacity 150ms ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.75")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            {ctaText || "Explore More"} →
          </a>
        )}
        {isSpotlight && (
          <p
            style={{
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              fontSize: "0.62rem",
              fontStyle: "italic",
              color: "rgba(242,242,242,0.22)",
              margin: 0,
              textAlign: "right",
            }}
          >
            — Introduced by Dramatic Adventure Theatre
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div
      style={{
        borderRadius: "12px",
        overflow: "hidden",
        backgroundColor: "#0d2c38",
        boxShadow: "0 6px 36px rgba(0,0,0,0.5)",
      }}
    >
      {/* ── Photo zone with overlaid text ────────────────────────────── */}
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          ...(hasPhoto ? { minHeight: "clamp(300px, 48vw, 440px)" } : {}),
        }}
      >
        {hasPhoto && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={mediaUrl}
              alt={headline}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center top",
              }}
            />

            {/* Sheen — diagonal highlight in the upper-left quadrant */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.11) 0%, rgba(255,255,255,0.05) 28%, rgba(255,255,255,0) 52%)",
                pointerEvents: "none",
              }}
            />

            {/* Gradient overlay — light touch; only the bottom third goes opaque */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(to top, rgba(13,44,56,0.96) 0%, rgba(13,44,56,0.88) 20%, rgba(13,44,56,0.42) 42%, rgba(13,44,56,0.08) 62%, rgba(13,44,56,0) 78%)",
                pointerEvents: "none",
              }}
            />
          </>
        )}

        {/* All text — pinned to bottom on photo, flows normally on plain bg */}
        {overlayContent}
      </div>

      {/* ── Accent rule ───────────────────────────────────────────────── */}
      <div style={{ height: "3px", background: accent }} />

      {/* ── Archive — inside the card, below the rule ─────────────────── */}
      {hasArchiveItems && (
        <div style={{ padding: "clamp(1rem, 3vw, 1.5rem) clamp(1.25rem, 3vw, 1.75rem)" }}>
          <SpotlightHighlightArchive
            spotlights={archiveSpotlights}
            highlights={archiveHighlights}
            skipFirst={false}
          />
        </div>
      )}
    </div>
  );
}
