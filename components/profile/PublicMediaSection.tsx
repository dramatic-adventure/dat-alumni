// components/profile/PublicMediaSection.tsx
"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Lightbox from "@/components/shared/Lightbox";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface MediaItem {
  fileId: string;
  kind: string;
  collectionTitle?: string;
  collectionId?: string;
  externalUrl?: string;
  uploadedAt?: string;
  note?: string;
  isFeatured?: boolean;
}

type Collection = { title: string; id: string; items: MediaItem[] };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function toThumbUrl(item: MediaItem, w = 1200): string {
  if (item.fileId) return `/api/media/thumb/${encodeURIComponent(item.fileId)}?w=${w}`;
  if (item.externalUrl) return `/api/img?url=${encodeURIComponent(item.externalUrl)}`;
  return "";
}

function groupByCollection(items: MediaItem[]): Collection[] {
  const map = new Map<string, Collection>();
  for (const item of items) {
    const key = item.collectionId || item.collectionTitle || "__uncategorized__";
    const title = item.collectionTitle || "Photos";
    if (!map.has(key)) map.set(key, { title, id: key, items: [] });
    map.get(key)!.items.push(item);
  }
  return Array.from(map.values()).filter((c) => c.items.length > 0);
}

const MIN_COLLECTION_SIZE = 3; // fewer than this → pooled into catch-all

// DAT brand tints — one per panel slot, cycling if there are more collections
const PANEL_TINTS = [
  "rgba(75,20,100,0.72)",   // deep purple
  "rgba(13,44,56,0.78)",    // DAT dark teal
  "rgba(90,65,10,0.76)",    // amber/gold
  "rgba(15,80,45,0.74)",    // forest green
  "rgba(100,20,20,0.74)",   // crimson
  "rgba(20,45,90,0.76)",    // midnight blue
];

const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
  fontSize: "0.65rem",
  fontWeight: 700,
  color: "rgba(255,255,255,0.28)",
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  marginBottom: "0.85rem",
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function PublicMediaSection({ alumniId }: { alumniId: string }) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Accordion state
  const [hoveredIdx, setHoveredIdx] = useState(0);
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [page, setPage] = useState(0);

  // Lightbox state
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Auto-cycle management
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const userInteracted = useRef(false);

  // Responsive
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Data fetch
  useEffect(() => {
    if (!alumniId) return;
    let alive = true;
    setLoading(true);

    (async () => {
      try {
        const res = await fetch(
          `/api/media/list?alumniId=${encodeURIComponent(alumniId)}&kind=album&limit=200`,
        );
        if (res.ok) {
          const j = await res.json();
          if (alive && Array.isArray(j?.items)) {
            const sorted = [...j.items].sort(
              (a: MediaItem, b: MediaItem) =>
                (Date.parse(b.uploadedAt || "") || 0) -
                (Date.parse(a.uploadedAt || "") || 0),
            );
            setCollections(groupByCollection(sorted)); // keep all — pagination handles the limit
          }
        }
      } catch {
        // swallow
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [alumniId]);

  // All display-ready panels: full collections + optional small-collection catch-all
  const accordionCollections = useMemo<Collection[]>(() => {
    const full      = collections.filter((c) => c.items.length >= MIN_COLLECTION_SIZE);
    const leftovers = collections
      .filter((c) => c.items.length < MIN_COLLECTION_SIZE)
      .flatMap((c) => c.items);
    return leftovers.length > 0
      ? [...full, { id: "__catchall__", title: "Photos", items: leftovers }]
      : full;
  }, [collections]);

  // 3 panels on mobile, 6 on tablet/desktop
  const maxPanels = isMobile ? 3 : 6;

  // Reset to page 0 when viewport class or collection list changes
  useEffect(() => { setPage(0); setHoveredIdx(0); }, [maxPanels, accordionCollections.length]);

  // Pagination — page through maxPanels collections at a time
  const totalPages         = Math.ceil(accordionCollections.length / maxPanels);
  const safePage           = Math.min(page, Math.max(0, totalPages - 1));
  const visibleCollections = accordionCollections.slice(
    safePage * maxPanels,
    (safePage + 1) * maxPanels,
  );

  const goToPage = useCallback((p: number) => {
    setPage(p);
    setHoveredIdx(0);
    setOpenIdx(null);
    userInteracted.current = false; // restart auto-cycle on the new page
  }, []);

  // Auto-cycle through visible panels when user hasn't interacted
  useEffect(() => {
    if (visibleCollections.length === 0) return;
    timerRef.current = setInterval(() => {
      if (!userInteracted.current) {
        setHoveredIdx((prev) => (prev + 1) % visibleCollections.length);
      }
    }, 2800);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [visibleCollections.length]);

  const stopAutoCycle = useCallback(() => {
    userInteracted.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const openLightboxFor = useCallback((images: string[], index: number) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxOpen(true);
  }, []);

  const handlePanelHover = useCallback(
    (idx: number) => {
      stopAutoCycle();
      setHoveredIdx(idx);
    },
    [stopAutoCycle],
  );

  const handlePanelClick = useCallback(
    (idx: number) => {
      stopAutoCycle();
      setHoveredIdx(idx);
      setOpenIdx((prev) => (prev === idx ? null : idx));
    },
    [stopAutoCycle],
  );

  if (loading || accordionCollections.length === 0) return null;

  const accordionHeight = isMobile ? 240 : 400;
  const collapsedWidth  = isMobile ? 44 : 58;
  const openCollection  = openIdx !== null ? (visibleCollections[openIdx] ?? null) : null;

  // ── Single-collection bypass: skip accordion, show grid directly ──────────
  if (accordionCollections.length === 1) {
    return (
      <section aria-label="Photos & Media" style={{ background: "#0d2c38", overflow: "hidden" }}>
        <ThumbnailGrid
          collection={accordionCollections[0]}
          isMobile={isMobile}
          onThumbClick={openLightboxFor}
        />
        {lightboxOpen && lightboxImages.length > 0 && (
          <Lightbox
            images={lightboxImages}
            startIndex={lightboxIndex}
            onClose={() => setLightboxOpen(false)}
          />
        )}
      </section>
    );
  }

  return (
    <section
      aria-label="Photos & Media"
      style={{ background: "#0d2c38", overflow: "hidden" }}
    >
      <div>
        {/* ── Accordion + overlaid pagination arrows ─────────────── */}
        <div style={{ position: "relative" }}>
        <div
          style={{
            display: "flex",
            gap: 4,
            height: accordionHeight,
          }}
        >
          {visibleCollections.map((col, i) => {
            const isActive = hoveredIdx === i;
            const isOpen = openIdx === i;
            const coverItem = col.items.find((it) => it.isFeatured) ?? col.items[0];
            // 1200 px: panels expand to ~900 px on desktop and we want retina
            // sharpness (2×). All panels get the same size so there's no
            // pixelation when a collapsed panel animates open.
            const coverSrc = coverItem ? toThumbUrl(coverItem, 1200) : "";
            const isFirst = i === 0;

            return (
              <div
                key={col.id}
                role="button"
                tabIndex={0}
                aria-label={`${col.title} — ${col.items.length} photo${col.items.length !== 1 ? "s" : ""}`}
                aria-expanded={isOpen}
                style={{
                  position: "relative",
                  flex: isActive ? "1 1 0" : `0 0 ${collapsedWidth}px`,
                  minWidth: 0,
                  transition: "flex 0.45s cubic-bezier(0.4, 0, 0.2, 1)",
                  overflow: "hidden",
                  borderRadius: 0,
                  cursor: "pointer",
                }}
                onMouseEnter={() => handlePanelHover(i)}
                onClick={() => handlePanelClick(i)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handlePanelClick(i);
                  }
                }}
              >
                {/* Gold top-bar — marks which collection's grid is open */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background: "#FFCC00",
                    opacity: isOpen ? 1 : 0,
                    transition: "opacity 0.3s ease",
                    zIndex: 10,
                    pointerEvents: "none",
                  }}
                />

                {/* Cover photo */}
                {coverSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={coverSrc}
                    alt=""
                    loading={isFirst ? "eager" : "lazy"}
                    // @ts-expect-error — fetchpriority is valid HTML but not yet in React types
                    fetchpriority={isFirst ? "high" : "auto"}
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                      transform: isActive ? "scale(1.04)" : "scale(1)",
                      transition: "transform 0.45s ease",
                      pointerEvents: "none",
                      userSelect: "none",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(255,255,255,0.04)",
                    }}
                  />
                )}

                {/* Color tint — fades out as panel expands to reveal the photo */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: PANEL_TINTS[i % PANEL_TINTS.length],
                    opacity: isActive ? 0 : 1,
                    transition: "opacity 0.45s ease",
                    pointerEvents: "none",
                  }}
                />

                {/* Gradient overlay */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.18) 55%, transparent 100%)",
                    pointerEvents: "none",
                  }}
                />

                {/* Collapsed: vertical title */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: isActive ? 0 : 1,
                    transition: "opacity 0.28s ease",
                    pointerEvents: "none",
                  }}
                >
                  <span
                    style={{
                      fontFamily:
                        "var(--font-space-grotesk), system-ui, sans-serif",
                      fontSize: 10,
                      fontWeight: 600,
                      color: "rgba(255,255,255,0.9)",
                      letterSpacing: "0.13em",
                      textTransform: "uppercase",
                      writingMode: "vertical-rl",
                      transform: "rotate(180deg)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {col.title}
                  </span>
                </div>

                {/* Expanded: label bar at bottom */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: "14px 16px 16px",
                    opacity: isActive ? 1 : 0,
                    transform: isActive ? "translateY(0)" : "translateY(8px)",
                    transition: "opacity 0.35s ease, transform 0.35s ease",
                    pointerEvents: "none",
                  }}
                >
                  <div
                    style={{
                      fontFamily:
                        "var(--font-space-grotesk), system-ui, sans-serif",
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#FFCC00",
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      marginBottom: 5,
                    }}
                  >
                    {col.items.length} photo{col.items.length !== 1 ? "s" : ""}
                  </div>
                  <div
                    style={{
                      fontFamily:
                        "var(--font-space-grotesk), system-ui, sans-serif",
                      fontSize: isMobile ? 14 : 18,
                      fontWeight: 600,
                      color: "#fff",
                      lineHeight: 1.2,
                      marginBottom: 8,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {col.title}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <span
                      style={{
                        fontFamily:
                          "var(--font-space-grotesk), system-ui, sans-serif",
                        fontSize: 11,
                        color: isOpen
                          ? "rgba(255,204,0,0.85)"
                          : "rgba(255,255,255,0.45)",
                        letterSpacing: "0.06em",
                        transition: "color 0.2s ease",
                      }}
                    >
                      {isOpen ? "▲ hide" : "▼ browse"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Overlaid prev/next arrows — only when multiple pages ─ */}
        {totalPages > 1 && (
          <>
            {/* Prev */}
            <button
              type="button"
              onClick={() => goToPage(safePage - 1)}
              disabled={safePage === 0}
              aria-label="Previous collections"
              style={{
                position: "absolute", top: "50%", left: 10,
                transform: "translateY(-50%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 36, height: 36, borderRadius: "50%", padding: 0,
                background: safePage === 0 ? "rgba(0,0,0,0.15)" : "rgba(0,0,0,0.45)",
                border: `1px solid ${safePage === 0 ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.22)"}`,
                backdropFilter: "blur(6px)",
                cursor: safePage === 0 ? "default" : "pointer",
                color: safePage === 0 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.85)",
                transition: "background 0.2s, color 0.2s",
                zIndex: 20,
              }}
            >
              <svg width="7" height="12" viewBox="0 0 7 12" fill="none" aria-hidden="true">
                <path d="M6 1L1 6L6 11" stroke="currentColor" strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* Page dots — centred at bottom of accordion */}
            <div style={{
              position: "absolute", bottom: 10, left: 0, right: 0,
              display: "flex", justifyContent: "center", gap: 6,
              zIndex: 20, pointerEvents: "none",
            }}>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goToPage(i)}
                  aria-label={`Page ${i + 1}`}
                  style={{
                    width: i === safePage ? 20 : 6, height: 6,
                    borderRadius: 3, padding: 0, border: "none",
                    background: i === safePage ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.35)",
                    cursor: i === safePage ? "default" : "pointer",
                    transition: "width 0.25s ease, background 0.2s",
                    pointerEvents: "all",
                    flexShrink: 0,
                  }}
                />
              ))}
            </div>

            {/* Next */}
            <button
              type="button"
              onClick={() => goToPage(safePage + 1)}
              disabled={safePage === totalPages - 1}
              aria-label="Next collections"
              style={{
                position: "absolute", top: "50%", right: 10,
                transform: "translateY(-50%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 36, height: 36, borderRadius: "50%", padding: 0,
                background: safePage === totalPages - 1 ? "rgba(0,0,0,0.15)" : "rgba(0,0,0,0.45)",
                border: `1px solid ${safePage === totalPages - 1 ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.22)"}`,
                backdropFilter: "blur(6px)",
                cursor: safePage === totalPages - 1 ? "default" : "pointer",
                color: safePage === totalPages - 1 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.85)",
                transition: "background 0.2s, color 0.2s",
                zIndex: 20,
              }}
            >
              <svg width="7" height="12" viewBox="0 0 7 12" fill="none" aria-hidden="true">
                <path d="M1 1L6 6L1 11" stroke="currentColor" strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </>
        )}
        </div>{/* end position:relative wrapper */}
      </div>

      {/* ── Thumbnail grid — animated reveal ─────────────────── */}
      <div
        style={{
          overflow: "hidden",
          maxHeight: openCollection ? "9999px" : "0px",
          transition: "max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {openCollection && (
          <ThumbnailGrid
            collection={openCollection}
            isMobile={isMobile}
            onThumbClick={openLightboxFor}
          />
        )}
      </div>

      {/* ── Lightbox ──────────────────────────────────────────── */}
      {lightboxOpen && lightboxImages.length > 0 && (
        <Lightbox
          images={lightboxImages}
          startIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// ThumbnailGrid
// ---------------------------------------------------------------------------
const THUMB_PAGE = 20;

function ThumbnailGrid({
  collection,
  isMobile,
  onThumbClick,
}: {
  collection: Collection;
  isMobile: boolean;
  onThumbClick: (images: string[], index: number) => void;
}) {
  const [showAll, setShowAll] = useState(false);

  const allUrls = collection.items.map((it) => toThumbUrl(it, 1600));
  const cols = isMobile ? 3 : 5;
  const hasMore = collection.items.length > THUMB_PAGE;
  const visible = showAll ? collection.items : collection.items.slice(0, THUMB_PAGE);

  return (
    <div
      style={{
        padding: `2rem clamp(20px, 5vw, 60px) 3rem`,
        background: "rgba(0,0,0,0.22)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Grid header */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 10,
          marginBottom: "1rem",
        }}
      >
        <span style={labelStyle}>{collection.title}</span>
        <span
          style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "0.65rem",
            color: "rgba(255,255,255,0.2)",
            letterSpacing: "0.08em",
            marginBottom: "0.85rem",
          }}
        >
          {collection.items.length} photos
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: isMobile ? 2 : 3,
        }}
      >
        {visible.map((item, idx) => (
          <ThumbnailCell
            key={item.fileId || idx}
            src={toThumbUrl(item, 500)}
            alt={item.note || `Photo ${idx + 1}`}
            onClick={() => onThumbClick(allUrls, idx)}
          />
        ))}
      </div>

      {/* Show all / show less */}
      {hasMore && (
        <div style={{ textAlign: "center", marginTop: "1.25rem" }}>
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 24,
              padding: "7px 22px",
              cursor: "pointer",
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: 12,
              fontWeight: 600,
              color: "rgba(255,255,255,0.55)",
              letterSpacing: "0.06em",
              transition: "background 0.18s, color 0.18s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.10)";
              (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.85)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)";
              (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.55)";
            }}
          >
            {showAll
              ? "Show less"
              : `Show all ${collection.items.length} photos`}
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ThumbnailCell
// ---------------------------------------------------------------------------
function ThumbnailCell({
  src,
  alt,
  onClick,
}: {
  src: string;
  alt: string;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={alt}
      style={{
        position: "relative",
        aspectRatio: "1 / 1",
        padding: 0,
        border: "none",
        borderRadius: 2,
        overflow: "hidden",
        background: "rgba(255,255,255,0.05)",
        cursor: "pointer",
        display: "block",
        width: "100%",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            transform: hovered ? "scale(1.07)" : "scale(1)",
            transition: "transform 300ms ease",
            pointerEvents: "none",
            userSelect: "none",
          }}
        />
      )}
      {/* Gold hover tint */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(255,204,0,0.14)",
          opacity: hovered ? 1 : 0,
          transition: "opacity 200ms ease",
          pointerEvents: "none",
        }}
      />
    </button>
  );
}
