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

const MAX_ALBUMS = 4;

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function PublicMediaSection({ alumniId }: { alumniId: string }) {
  const [featured,     setFeatured]     = useState<MediaItem[]>([]);
  const [collections,  setCollections]  = useState<Array<{ title: string; id: string; items: MediaItem[] }>>([]);
  const [loading,      setLoading]      = useState(true);
  const [isMobile,     setIsMobile]     = useState(false);
  const [showAll,      setShowAll]      = useState(false);

  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex,  setLightboxIndex]  = useState(0);
  const [lightboxOpen,   setLightboxOpen]   = useState(false);

  // Responsive
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Data — fetch featured (top 2) and full album list in parallel
  useEffect(() => {
    if (!alumniId) return;
    let alive = true;
    setLoading(true);

    (async () => {
      try {
        const base = `/api/media/list?alumniId=${encodeURIComponent(alumniId)}`;
        const [featRes, allRes] = await Promise.allSettled([
          fetch(`${base}&featuredOnly=true&kind=album&limit=2`),
          fetch(`${base}&kind=album&limit=200`),
        ]);

        let feat: MediaItem[] = [];
        let all:  MediaItem[] = [];

        if (featRes.status === "fulfilled" && featRes.value.ok) {
          const j = await featRes.value.json();
          if (Array.isArray(j?.items)) {
            feat = j.items
              .sort((a: MediaItem, b: MediaItem) =>
                (Date.parse(b.uploadedAt || "") || 0) - (Date.parse(a.uploadedAt || "") || 0))
              .slice(0, 2);
          }
        }

        if (allRes.status === "fulfilled" && allRes.value.ok) {
          const j = await allRes.value.json();
          if (Array.isArray(j?.items)) {
            all = j.items.sort((a: MediaItem, b: MediaItem) =>
              (Date.parse(b.uploadedAt || "") || 0) - (Date.parse(a.uploadedAt || "") || 0));
          }
        }

        if (alive) {
          setFeatured(feat);
          setCollections(groupByCollection(all));
        }
      } catch {
        // swallow
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [alumniId]);

  const openLightboxFor = useCallback((images: string[], index: number) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxOpen(true);
  }, []);

  if (loading || (featured.length === 0 && collections.length === 0)) return null;

  const visibleAlbums = showAll ? collections : collections.slice(0, MAX_ALBUMS);
  const hasMore = collections.length > MAX_ALBUMS;

  // If we have fewer than 2 featured, fall back to the top collection items
  const heroItems = featured.length > 0
    ? featured
    : collections[0]?.items.slice(0, 2) ?? [];

  const [heroA, heroB] = heroItems;

  return (
    <section
      aria-label="Photos &amp; Media"
      style={{ background: "#0d2c38" }}
    >
      {/* ── Featured: full-bleed, separated by a 2px line ─────── */}
      {heroItems.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 2,
            background: "#0d2c38",
            height: isMobile ? "clamp(180px, 52vw, 300px)" : "clamp(260px, 34vw, 440px)",
          }}
        >
          {heroA && (
            <button
              type="button"
              onClick={() =>
                openLightboxFor(heroItems.map((it) => toThumbUrl(it, 1600)), 0)
              }
              aria-label="Open featured photo"
              style={{
                flex: heroB ? "0 0 62%" : "1",
                position: "relative",
                padding: 0,
                border: "none",
                borderRadius: 0,
                overflow: "hidden",
                background: "#0d2c38",
                cursor: "pointer",
                display: "block",
              }}
            >
              <FeaturedPhoto item={heroA} />
            </button>
          )}

          {heroB && (
            <button
              type="button"
              onClick={() =>
                openLightboxFor(heroItems.map((it) => toThumbUrl(it, 1600)), 1)
              }
              aria-label="Open featured photo"
              style={{
                flex: 1,
                position: "relative",
                padding: 0,
                border: "none",
                borderRadius: 0,
                overflow: "hidden",
                background: "#0d2c38",
                cursor: "pointer",
                display: "block",
              }}
            >
              <FeaturedPhoto item={heroB} />
            </button>
          )}
        </div>
      )}

      {/* ── Albums strip ──────────────────────────────────────── */}
      {collections.length > 0 && (
        <div style={{ padding: `2.5rem clamp(20px, 5vw, 56px) 3rem`, overflow: "visible" }}>
        <>
          <div style={labelStyle}>Albums</div>

          {/* Album grid — 5 cols desktop, 2 cols mobile, fan hover */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(5, 1fr)",
              columnGap: isMobile ? 28 : 40,
              rowGap: isMobile ? 32 : 40,
              overflow: "visible",
            }}
          >
            {visibleAlbums.map((col) => {
              const coverItem  = col.items[0];
              const peek1      = col.items[1];
              const peek2      = col.items[2];
              const colUrls    = col.items.map((it) => toThumbUrl(it, 1600));

              return (
                <AlbumCard
                  key={col.id}
                  title={col.title}
                  count={col.items.length}
                  coverItem={coverItem}
                  peek1={peek1}
                  peek2={peek2}
                  onClick={() => openLightboxFor(colUrls, 0)}
                />
              );
            })}
          </div>

          {/* See all */}
          {hasMore && (
            <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
              <button
                type="button"
                onClick={() => setShowAll((v) => !v)}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  borderRadius: 24,
                  padding: "7px 20px",
                  cursor: "pointer",
                  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.65)",
                  letterSpacing: "0.04em",
                  transition: "background 0.18s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "rgba(255,255,255,0.10)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "rgba(255,255,255,0.06)";
                }}
              >
                {showAll ? "Show less" : `See all ${collections.length} albums`}
              </button>
            </div>
          )}
        </>
        </div>
      )}

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
// Shared label style
// ---------------------------------------------------------------------------
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
// FeaturedPhoto — fills its button container edge to edge
// ---------------------------------------------------------------------------
function FeaturedPhoto({ item }: { item: MediaItem }) {
  const [hovered, setHovered] = useState(false);
  const src = toThumbUrl(item, 1400);

  return (
    <div
      style={{ position: "relative", width: "100%", height: "100%" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={item.note || item.collectionTitle || "Featured photo"}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            transform: hovered ? "scale(1.03)" : "scale(1)",
            transition: "transform 420ms ease",
            pointerEvents: "none",
            userSelect: "none",
          }}
        />
      )}
      {/* Subtle bottom vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, transparent 55%, rgba(0,0,0,0.35) 100%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// AlbumCard — with fan hover (2 back-photo layers)
// ---------------------------------------------------------------------------
function AlbumCard({
  title,
  count,
  coverItem,
  peek1,
  peek2,
  onClick,
}: {
  title: string;
  count: number;
  coverItem: MediaItem | undefined;
  peek1:     MediaItem | undefined;
  peek2:     MediaItem | undefined;
  onClick:   () => void;
}) {
  const [hovered, setHovered] = useState(false);

  const coverSrc = coverItem ? toThumbUrl(coverItem, 600) : "";
  const peek1Src = peek1     ? toThumbUrl(peek1, 300)     : coverSrc;
  const peek2Src = peek2     ? toThumbUrl(peek2, 300)     : coverSrc;

  return (
    // Outer wrapper: overflow visible so fan cards can bleed out
    <div
      style={{ position: "relative", overflow: "visible" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Back photo 2 — deepest in deck, most rotated clockwise from bottom pivot */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 8,
          overflow: "hidden",
          zIndex: 1,
          transformOrigin: "bottom center",
          transform: hovered ? "rotate(5deg)" : "rotate(2.5deg)",
          transition: "transform 280ms cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        }}
      >
        {peek2Src && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={peek2Src}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        )}
      </div>

      {/* Back photo 1 — middle of deck, slightly rotated */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 8,
          overflow: "hidden",
          zIndex: 2,
          transformOrigin: "bottom center",
          transform: hovered ? "rotate(2.5deg)" : "rotate(1deg)",
          transition: "transform 280ms cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        }}
      >
        {peek1Src && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={peek1Src}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        )}
      </div>

      {/* Front card — the actual clickable album cover */}
      <button
        type="button"
        onClick={onClick}
        aria-label={`Open ${title} — ${count} photo${count !== 1 ? "s" : ""}`}
        style={{
          position: "relative",
          zIndex: 3,
          width: "100%",
          aspectRatio: "2 / 3",
          padding: 0,
          border: "none",
          borderRadius: 8,
          overflow: "hidden",
          background: "#0d2c38",
          cursor: "pointer",
          display: "block",
          transform: hovered ? "translateY(-2px)" : "translateY(0)",
          boxShadow: hovered
            ? "0 12px 32px rgba(0,0,0,0.55)"
            : "0 3px 10px rgba(0,0,0,0.45)",
          transition: "transform 220ms ease, box-shadow 220ms ease",
        }}
      >
        {/* Cover photo */}
        {coverSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverSrc}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              pointerEvents: "none",
              userSelect: "none",
            }}
          />
        )}

        {/* Label bar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "8px 11px 9px",
            background: "rgba(0,0,0,0.54)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 6,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: 15,
              fontWeight: 600,
              color: "#fff",
              lineHeight: 1.25,
            }}
          >
            {title}
          </span>
          <span
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: 10,
              color: "rgba(255,255,255,0.45)",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {count}
          </span>
        </div>
      </button>
    </div>
  );
}
