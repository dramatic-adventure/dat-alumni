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
  collectionTitle?: string;
  collectionId?: string;
  externalUrl?: string;
  uploadedAt?: string;
  note?: string;
  isFeatured?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function toThumbUrl(item: MediaItem, w = 600): string {
  if (item.fileId) return `/api/media/thumb/${encodeURIComponent(item.fileId)}?w=${w}`;
  if (item.externalUrl) return `/api/img?url=${encodeURIComponent(item.externalUrl)}`;
  return "";
}

// Group by collectionId (fall back to collectionTitle, then "uncategorized")
function groupByCollection(
  items: MediaItem[],
): Array<{ title: string; id: string; items: MediaItem[] }> {
  const map = new Map<string, { title: string; id: string; items: MediaItem[] }>();
  for (const item of items) {
    const key = item.collectionId || item.collectionTitle || "__uncategorized__";
    const title = item.collectionTitle || "Photos";
    if (!map.has(key)) map.set(key, { title, id: key, items: [] });
    map.get(key)!.items.push(item);
  }
  return Array.from(map.values()).filter((c) => c.items.length > 0);
}

// ---------------------------------------------------------------------------
// Fan layout — stolen exactly from JoinTheJourneyPanel (/story-map)
// ---------------------------------------------------------------------------
const ROTATIONS_DESKTOP = [-12, -4, 6, 15];
const ROTATIONS_MOBILE  = [-10, -3,  7, 14];
const XOFFSETS_DESKTOP  = [-96, -42, 27, 78];
const XOFFSETS_MOBILE   = [-54, -18, 18, 54];
const Z_ORDER           = [10, 20, 30, 40];

// Adjusted offsets/rotations for fewer than 4 cards (keeps fan centered)
function getFanParams(
  count: number,
  mobile: boolean,
): { rotations: number[]; xOffsets: number[] } {
  if (count === 4) {
    return {
      rotations: mobile ? ROTATIONS_MOBILE : ROTATIONS_DESKTOP,
      xOffsets:  mobile ? XOFFSETS_MOBILE  : XOFFSETS_DESKTOP,
    };
  }
  if (count === 3) {
    return {
      rotations: mobile ? [-9,  0,  9] : [-10, 0,  10],
      xOffsets:  mobile ? [-42, 0, 42] : [-66, 0, 66],
    };
  }
  if (count === 2) {
    return {
      rotations: mobile ? [-7, 7] : [-8, 8],
      xOffsets:  mobile ? [-24, 24] : [-39, 39],
    };
  }
  // 1 item
  return { rotations: [0], xOffsets: [0] };
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function PublicMediaSection({ alumniId }: { alumniId: string }) {
  const [fanItems,         setFanItems]    = useState<MediaItem[]>([]);
  const [collections,      setCollections] = useState<Array<{ title: string; id: string; items: MediaItem[] }>>([]);
  const [loading,          setLoading]     = useState(true);
  const [isMobile,         setIsMobile]    = useState(false);
  const [showCollections,  setShowCollections] = useState(false);

  // Shared lightbox
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex,  setLightboxIndex]  = useState(0);
  const [lightboxOpen,   setLightboxOpen]   = useState(false);

  // Responsive breakpoint
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
        const base = `/api/media/list?alumniId=${encodeURIComponent(alumniId)}`;

        // Featured (fan) + full album library (collections) in parallel
        const [featuredRes, allRes] = await Promise.allSettled([
          fetch(`${base}&featuredOnly=true&kind=album&limit=4`),
          fetch(`${base}&kind=album&limit=200`),
        ]);

        let featured: MediaItem[] = [];
        let all: MediaItem[] = [];

        if (featuredRes.status === "fulfilled" && featuredRes.value.ok) {
          const j = await featuredRes.value.json();
          if (Array.isArray(j?.items)) {
            featured = j.items
              .sort(
                (a: MediaItem, b: MediaItem) =>
                  (Date.parse(b.uploadedAt || "") || 0) -
                  (Date.parse(a.uploadedAt || "") || 0),
              )
              .slice(0, 4);
          }
        }

        if (allRes.status === "fulfilled" && allRes.value.ok) {
          const j = await allRes.value.json();
          if (Array.isArray(j?.items)) {
            all = j.items.sort(
              (a: MediaItem, b: MediaItem) =>
                (Date.parse(b.uploadedAt || "") || 0) -
                (Date.parse(a.uploadedAt || "") || 0),
            );
          }
        }

        if (alive) {
          setFanItems(featured);
          setCollections(groupByCollection(all));
        }
      } catch {
        // swallow — section stays hidden on error
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [alumniId]);

  const openLightboxFor = useCallback((images: string[], index: number) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxOpen(true);
  }, []);

  // Hide section when loading or no content
  if (loading || (fanItems.length === 0 && collections.length === 0)) return null;

  const count = fanItems.length;
  const { rotations, xOffsets } = getFanParams(count, isMobile);

  // Container height stolen exactly from JoinTheJourneyPanel
  const fanContainerH = isMobile
    ? "clamp(180px, 42vw, 336px)"
    : "clamp(144px, 30vw, 336px)";

  const fanImageUrls = fanItems.map((it) => toThumbUrl(it, 1600));

  // Collection stack constants
  const STACK_W   = isMobile ? 72 : 90;
  const STACK_H   = isMobile ? 72 : 90;
  const STACK_PAD = 18; // padding around stack for rotation bleed
  const layerRotations = [-5, 3, 0]; // bottom → top

  return (
    <section
      aria-label="Photos &amp; Media"
      style={{
        background: "#3FA9BE",
        padding: "4rem 0 4.5rem",
        overflow: "visible",
      }}
    >
      {/* ── Fan — exact JoinTheJourneyPanel implementation ─────── */}
      {fanItems.length > 0 && (
        <div style={{ overflow: "visible", marginBottom: "3.5rem" }}>
          {/* Centered fan container (70vw cap) — stolen exactly */}
          <div
            aria-label="Featured photos"
            role="region"
            style={{
              margin: "0 auto",
              width: "min(42vw, 660px)",
              height: fanContainerH,
              overflow: "visible",
              position: "relative",
            }}
          >
            {fanItems.map((item, i) => {
              const rotation = rotations[i] ?? 0;
              const dx       = xOffsets[i] ?? 0;
              const z        = Z_ORDER[i] ?? i + 1;
              const src      = toThumbUrl(item, 1200);

              return (
                <button
                  key={item.fileId || i}
                  onClick={() => openLightboxFor(fanImageUrls, i)}
                  aria-label={`Open photo ${i + 1}`}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: "50%",
                    height: "100%",
                    aspectRatio: isMobile ? "2 / 3" : "3 / 2",
                    width: "auto",
                    transform: `translateX(-50%) translateX(${dx}px) rotate(${rotation}deg)`,
                    zIndex: z,
                    border: "none",
                    padding: 0,
                    background: "transparent",
                    cursor: "pointer",
                    transition:
                      "transform 180ms ease, box-shadow 180ms ease, z-index 0s",
                    overflow: "visible",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget;
                    el.style.transform = `translateX(-50%) translateX(${dx}px) rotate(0deg) translateY(-4px) scale(1.02)`;
                    el.style.zIndex = "99";
                    const sheen = el.querySelector(
                      ".pms-sheen",
                    ) as HTMLDivElement | null;
                    if (sheen) sheen.style.opacity = "0.28";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget;
                    el.style.transform = `translateX(-50%) translateX(${dx}px) rotate(${rotation}deg)`;
                    el.style.zIndex = String(z);
                    const sheen = el.querySelector(
                      ".pms-sheen",
                    ) as HTMLDivElement | null;
                    if (sheen) sheen.style.opacity = "0";
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      height: "100%",
                      boxShadow: "0 18px 48px rgba(0,0,0,0.38)",
                      background: "#111",
                      borderRadius: 0,
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={item.collectionTitle || item.note || `Photo ${i + 1}`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                        userSelect: "none",
                        pointerEvents: "none",
                      }}
                    />
                    {/* Sheen — fades in on hover, pinned to each photo */}
                    <div
                      className="pms-sheen"
                      style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                        background:
                          "linear-gradient(110deg, rgba(255,255,255,0.00) 18%, rgba(255,255,255,0.55) 34%, rgba(255,255,255,0.10) 48%, rgba(255,255,255,0.00) 62%)",
                        opacity: 0,
                        transition: "opacity 160ms ease",
                        borderRadius: 0,
                      }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Collections — iMessage-style stacks ─────────────────── */}
      {collections.length > 0 && (
        <div style={{ padding: "0 clamp(20px, 5vw, 60px)" }}>
          {/* Reveal / hide toggle */}
          <div style={{ textAlign: "center", marginBottom: showCollections ? "1.25rem" : 0 }}>
            <button
              type="button"
              onClick={() => setShowCollections((v) => !v)}
              style={{
                background: "rgba(0,0,0,0.18)",
                border: "1px solid rgba(255,255,255,0.18)",
                borderRadius: 24,
                padding: "7px 20px",
                cursor: "pointer",
                fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                fontSize: isMobile ? 12 : 13,
                fontWeight: 600,
                color: "rgba(255,255,255,0.82)",
                letterSpacing: "0.03em",
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                transition: "background 0.18s, opacity 0.18s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.3)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.18)";
              }}
            >
              <span style={{ fontSize: isMobile ? 14 : 16, lineHeight: 1 }}>
                {showCollections ? "▲" : "◈"}
              </span>
              {showCollections
                ? "Hide collections"
                : `View collections · ${collections.length} album${collections.length !== 1 ? "s" : ""}`}
            </button>
          </div>

          {/* Scrollable stacks — only rendered when revealed */}
          {showCollections && (
          <div
            style={{
              display: "flex",
              gap: isMobile ? 16 : 28,
              overflowX: "auto",
              paddingBottom: 12,
              paddingTop: 8,
              /* hide scrollbar but keep scrollability */
              scrollbarWidth: "none",
              WebkitOverflowScrolling: "touch",
            } as React.CSSProperties}
          >
            {collections.map((col) => {
              // Show up to 3 images in the stack (rendered bottom-to-top)
              const stackImgs  = col.items.slice(0, 3).reverse();
              const totalCount = col.items.length;
              const colUrls    = col.items.map((it) => toThumbUrl(it, 1600));
              const containerW = STACK_W + STACK_PAD * 2;
              const containerH = STACK_H + STACK_PAD * 2;

              return (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => openLightboxFor(colUrls, 0)}
                  style={{
                    flexShrink: 0,
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 7,
                    transition: "opacity 150ms ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.opacity = "0.8";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.opacity = "1";
                  }}
                >
                  {/* Photo stack */}
                  <div
                    style={{
                      position: "relative",
                      width: containerW,
                      height: containerH,
                    }}
                  >
                    {stackImgs.map((img, si) => (
                      <div
                        key={img.fileId || si}
                        style={{
                          position: "absolute",
                          width: STACK_W,
                          height: STACK_H,
                          top: "50%",
                          left: "50%",
                          transform: `translate(-50%, -50%) rotate(${layerRotations[si] ?? 0}deg)`,
                          zIndex: si + 1,
                          borderRadius: 10,
                          overflow: "hidden",
                          boxShadow: "0 3px 14px rgba(0,0,0,0.32)",
                          background: "#1a0c22",
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={toThumbUrl(img, 300)}
                          alt=""
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                      </div>
                    ))}

                    {/* Photo count badge */}
                    {totalCount > 1 && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: STACK_PAD - 4,
                          right: STACK_PAD - 6,
                          zIndex: 10,
                          background: "rgba(24,14,31,0.82)",
                          backdropFilter: "blur(4px)",
                          borderRadius: 12,
                          padding: "2px 7px",
                          fontSize: 10,
                          fontWeight: 700,
                          color: "#FFCC00",
                          fontFamily:
                            "var(--font-space-grotesk), system-ui, sans-serif",
                          letterSpacing: "0.02em",
                          lineHeight: 1.4,
                          pointerEvents: "none",
                        }}
                      >
                        {totalCount}
                      </div>
                    )}
                  </div>

                  {/* Collection label */}
                  <div style={{ textAlign: "center", maxWidth: containerW + 12 }}>
                    <div
                      style={{
                        fontFamily:
                          "var(--font-space-grotesk), system-ui, sans-serif",
                        fontSize: isMobile ? 11 : 12,
                        fontWeight: 600,
                        color: "#241123",
                        opacity: 0.82,
                        letterSpacing: "0.01em",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {col.title}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          )} {/* end showCollections */}
        </div>
      )}

      {/* ── Lightbox ───────────────────────────────────────────── */}
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
