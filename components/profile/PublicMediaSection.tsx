// components/profile/PublicMediaSection.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Lightbox from "@/components/shared/Lightbox";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface MediaItem {
  fileId: string;
  kind: string;
  collectionTitle?: string; // preserved for album grouping follow-up
  collectionId?: string;    // preserved for album grouping follow-up
  externalUrl?: string;
  uploadedAt?: string;
  note?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function toThumbUrl(item: MediaItem, w = 600): string {
  if (item.fileId) return `/api/media/thumb/${encodeURIComponent(item.fileId)}?w=${w}`;
  if (item.externalUrl) return `/api/img?url=${encodeURIComponent(item.externalUrl)}`;
  return "";
}

// ---------------------------------------------------------------------------
// Fan layout config
// Each entry: [rotateDeg, translateX(px), translateY(px), zIndex]
// ---------------------------------------------------------------------------
const FAN_SLOTS: [number, number, number, number][][] = [
  // 1 item — centred, no rotation
  [[0, 0, 0, 1]],
  // 2 items
  [[-5, -18, 6, 1], [5, 18, 4, 2]],
  // 3 items
  [[-8, -34, 10, 1], [0, 0, 0, 3], [7, 34, 8, 2]],
  // 4 items
  [[-10, -48, 14, 1], [-3, -16, 5, 2], [4, 16, 5, 3], [10, 48, 14, 4]],
];

const CARD_W = 148;
const CARD_H = 196;

// Grid: show this many photo slots before the "+N more" card
const GRID_PHOTOS_BEFORE_EXPAND = 4;

// ---------------------------------------------------------------------------
// PhotoCard — Polaroid-style, absolutely positioned inside fan container
// ---------------------------------------------------------------------------
interface PhotoCardProps {
  src: string;
  alt: string;
  rotate: number;
  tx: number;
  ty: number;
  zIndex: number;
  onClick: () => void;
}

function PhotoCard({ src, alt, rotate, tx, ty, zIndex, onClick }: PhotoCardProps) {
  const [errored, setErrored] = useState(false);

  const baseTransform = `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) rotate(${rotate}deg)`;
  const hoverTransform = `translate(calc(-50% + ${tx}px), calc(-50% + ${ty - 10}px)) rotate(${rotate * 0.4}deg) scale(1.05)`;

  return (
    <button
      type="button"
      aria-label={alt}
      onClick={onClick}
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: CARD_W,
        height: CARD_H,
        transform: baseTransform,
        zIndex,
        border: "none",
        padding: 0,
        cursor: "pointer",
        borderRadius: 4,
        overflow: "hidden",
        boxShadow: "0 5px 20px rgba(0,0,0,0.55), 0 1px 5px rgba(0,0,0,0.3)",
        transition: "transform 0.22s cubic-bezier(.22,.68,0,1.2), box-shadow 0.2s ease, z-index 0s",
        background: "#1a0c22",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.transform = hoverTransform;
        el.style.zIndex = "20";
        el.style.boxShadow = "0 12px 36px rgba(0,0,0,0.65), 0 2px 10px rgba(0,0,0,0.4)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.transform = baseTransform;
        el.style.zIndex = String(zIndex);
        el.style.boxShadow = "0 5px 20px rgba(0,0,0,0.55), 0 1px 5px rgba(0,0,0,0.3)";
      }}
    >
      {/* Polaroid/photo paper border */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          border: "7px solid #f5f0e8",
          borderBottom: "26px solid #f5f0e8",
          zIndex: 2,
          borderRadius: 3,
          pointerEvents: "none",
        }}
      />
      {!errored && src ? (
        <img
          src={src}
          alt={alt}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          onError={() => setErrored(true)}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            background: "linear-gradient(135deg, #2a1035 0%, #1a0c22 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#6C00AF",
            fontSize: 28,
          }}
        >
          ◈
        </div>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// GridCard — compact square thumbnail for grid layout
// ---------------------------------------------------------------------------
interface GridCardProps {
  src: string;
  alt: string;
  hiddenCount?: number; // if > 0, render "+N" overlay instead of showing as photo
  onClick: () => void;
}

function GridCard({ src, alt, hiddenCount = 0, onClick }: GridCardProps) {
  const [errored, setErrored] = useState(false);
  const isOverlay = hiddenCount > 0;

  return (
    <button
      type="button"
      aria-label={isOverlay ? `View ${hiddenCount} more photos` : alt}
      onClick={onClick}
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "1 / 1",
        border: "none",
        padding: 0,
        cursor: "pointer",
        borderRadius: 8,
        overflow: "hidden",
        boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
        transition: "transform 0.18s ease, box-shadow 0.18s ease",
        background: "#1a0c22",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.03)";
        e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.55)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.4)";
      }}
    >
      {!errored && src ? (
        <img
          src={src}
          alt={alt}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          onError={() => setErrored(true)}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            background: "linear-gradient(135deg, #2a1035 0%, #1a0c22 100%)",
          }}
        />
      )}
      {isOverlay && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(24, 14, 31, 0.78)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "clamp(1.4rem, 4vw, 2rem)",
              fontWeight: 700,
              color: "#FFCC00",
              lineHeight: 1,
            }}
          >
            +{hiddenCount}
          </span>
          <span
            style={{
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              fontSize: "0.75rem",
              color: "#c0a8d4",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            more
          </span>
        </div>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function PublicMediaSection({ alumniId }: { alumniId: string }) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    if (!alumniId) return;
    let alive = true;
    setLoading(true);

    (async () => {
      try {
        // Fetch album + reel media — featuredOnly=true ensures the server only
        // returns rows where isFeatured is explicitly truthy. Unfeatured/private
        // media is never included in the response; no client-side filtering needed.
        const base = `/api/media/list?alumniId=${encodeURIComponent(alumniId)}&featuredOnly=true`;
        const [albumRes, reelRes] = await Promise.allSettled([
          fetch(`${base}&kind=album&limit=50`),
          fetch(`${base}&kind=reel&limit=20`),
        ]);

        const all: MediaItem[] = [];

        if (albumRes.status === "fulfilled" && albumRes.value.ok) {
          const j = await albumRes.value.json();
          if (Array.isArray(j?.items)) all.push(...j.items);
        }
        if (reelRes.status === "fulfilled" && reelRes.value.ok) {
          const j = await reelRes.value.json();
          if (Array.isArray(j?.items)) all.push(...j.items);
        }

        // Server has already filtered to featured-only; just sort.
        all.sort(
          (a, b) => (Date.parse(b.uploadedAt || "") || 0) - (Date.parse(a.uploadedAt || "") || 0),
        );

        if (alive) setItems(all);
      } catch {
        // swallow — section stays hidden
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [alumniId]);

  const lightboxUrls = items.map((it) => toThumbUrl(it, 1600));

  const openLightbox = useCallback((idx: number) => {
    setLightboxIndex(idx);
    setLightboxOpen(true);
  }, []);

  // Hide section when loading or no public media
  if (loading || items.length === 0) return null;

  const count = items.length;
  const isFanMode = count <= 4;

  // Grid mode: show GRID_PHOTOS_BEFORE_EXPAND photos + "+N" slot (if needed)
  const gridSlots = expanded ? count : Math.min(GRID_PHOTOS_BEFORE_EXPAND + 1, count);
  const hiddenInLastSlot =
    !expanded && count > GRID_PHOTOS_BEFORE_EXPAND + 1
      ? count - GRID_PHOTOS_BEFORE_EXPAND
      : 0;

  // Fan container dimensions — enough horizontal spread + vertical clearance for rotated cards
  const fanSpread = count > 1 ? (count - 1) * 56 : 0;
  const fanContainerW = CARD_W + fanSpread + 32;
  const fanContainerH = CARD_H + 48;

  return (
    <section
      aria-label="Photos &amp; Media"
      style={{
        background: "#180e1f",
        padding: isFanMode ? "3.5rem 30px 4rem" : "3rem 30px 3.5rem",
      }}
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ marginBottom: isFanMode ? "2.5rem" : "1.5rem" }}>
        <h2
          style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "clamp(2rem, 5vw, 3rem)",
            color: "#FFCC00",
            margin: 0,
            lineHeight: 1,
          }}
        >
          Photos &amp; Media
        </h2>
        {count > 1 && (
          <p
            style={{
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              fontSize: "0.9rem",
              color: "#7a4f90",
              margin: "0.35rem 0 0",
              letterSpacing: "0.02em",
            }}
          >
            {count} {count === 1 ? "photo" : "photos"}
          </p>
        )}
      </div>

      {/* ── Fan layout (1–4 items) ──────────────────────────────── */}
      {isFanMode && (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div
            role="list"
            style={{
              position: "relative",
              width: fanContainerW,
              height: fanContainerH,
            }}
          >
            {items.map((item, i) => {
              const [rotate, tx, ty, zIdx] = FAN_SLOTS[count - 1]?.[i] ?? [0, 0, 0, i + 1];
              return (
                <PhotoCard
                  key={item.fileId || i}
                  src={toThumbUrl(item, 600)}
                  alt={item.collectionTitle || item.note || `Photo ${i + 1}`}
                  rotate={rotate}
                  tx={tx}
                  ty={ty}
                  zIndex={zIdx}
                  onClick={() => openLightbox(i)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* ── Grid layout (5+ items) ─────────────────────────────── */}
      {!isFanMode && (
        <>
          <div
            role="list"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: 10,
              maxWidth: 860,
            }}
          >
            {items.slice(0, gridSlots).map((item, i) => {
              const isLastSlot = !expanded && i === gridSlots - 1 && hiddenInLastSlot > 0;
              return (
                <GridCard
                  key={item.fileId || i}
                  src={toThumbUrl(item, 600)}
                  alt={item.collectionTitle || item.note || `Photo ${i + 1}`}
                  hiddenCount={isLastSlot ? hiddenInLastSlot : 0}
                  onClick={() => {
                    if (isLastSlot) setExpanded(true);
                    else openLightbox(i);
                  }}
                />
              );
            })}
          </div>

          {expanded && count > GRID_PHOTOS_BEFORE_EXPAND + 1 && (
            <button
              type="button"
              onClick={() => setExpanded(false)}
              style={{
                marginTop: "1.25rem",
                fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                fontSize: "0.85rem",
                color: "#7a4f90",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                letterSpacing: "0.04em",
                padding: "4px 0",
                textDecoration: "underline",
                textUnderlineOffset: 3,
              }}
            >
              Show fewer
            </button>
          )}
        </>
      )}

      {/* ── Click hint for fan ─────────────────────────────────── */}
      {isFanMode && (
        <p
          style={{
            textAlign: "center",
            marginTop: "1.75rem",
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontSize: "0.75rem",
            color: "#4a2860",
            letterSpacing: "0.07em",
            textTransform: "uppercase",
          }}
        >
          {count === 1 ? "Click to view" : "Click a photo to view"}
        </p>
      )}

      {/* ── Lightbox ───────────────────────────────────────────── */}
      {lightboxOpen && lightboxUrls.length > 0 && (
        <Lightbox images={lightboxUrls} startIndex={lightboxIndex} onClose={() => setLightboxOpen(false)} />
      )}
    </section>
  );
}
