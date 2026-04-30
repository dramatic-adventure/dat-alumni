"use client";

import type { CSSProperties } from "react";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";

import Dropzone from "@/components/media/Dropzone";
import { ghostButton as studioGhostButton } from "@/components/alumni/update/ProfileStudio";

type UploadKind = "headshot" | "album" | "reel" | "event";

interface LibraryItem {
  fileId: string;
  collectionTitle?: string;
  collectionId?: string;
  note?: string;
  uploadedAt?: string;
  isFeatured?: boolean;
  drive?: { name?: string; webViewLink?: string; thumbnailLink?: string };
}

interface Collection {
  id: string;
  title: string;
  items: LibraryItem[];
}

type MediaPanelProps = {
  explainStyleLocal: CSSProperties;
  subheadChipStyle: CSSProperties;
  labelStyle: CSSProperties;
  inputStyle: CSSProperties;
  datButtonLocal: CSSProperties;

  loading: boolean;
  savedRecently?: boolean;

  albumName: string;
  setAlbumName: (v: string) => void;

  albumFiles: File[];
  setAlbumFiles: (files: File[]) => void;

  reelFiles: File[];
  setReelFiles: (files: File[]) => void;

  openPicker: (kind: "headshot" | "album" | "reel" | "event") => void;

  showToastError: (msg: string) => void;

  saveCategory: (args: {
    tag: string;
    fieldKeys?: string[];
    uploadKinds?: UploadKind[];
    afterSave?: () => void;
    profileOverride?: any;
  }) => void;

  alumniId?: string;
  profile?: any;
  setProfile?: (updater: any) => void;
  onSaved?: () => void;
  isDirty?: boolean;
};

// ── Constants ─────────────────────────────────────────────────────────────────
const MAX_FEATURED  = 4;
const SLOT_SIZE     = 82;   // featured staging slot px
const COL_STACK_W   = 58;   // collection card thumb px
const COL_STACK_H   = 58;
const COL_STACK_PAD = 14;   // bleed space for rotated layers
const PHOTO_THUMB   = 76;   // open-collection photo px
const LAYER_ROTS    = [-5, 3, 0]; // bottom → top rotation for stack

// ── Helpers ───────────────────────────────────────────────────────────────────
// Always use our proxy — Drive thumbnailLinks are domain-restricted and expire.
function thumbUrl(item: LibraryItem, w = 200): string {
  return `/api/media/thumb/${encodeURIComponent(item.fileId)}?w=${w}`;
}

function groupIntoCollections(items: LibraryItem[]): Collection[] {
  const map = new Map<string, Collection>();
  for (const item of items) {
    const key   = item.collectionId || item.collectionTitle || "__ungrouped__";
    const title = item.collectionTitle || "All Photos";
    if (!map.has(key)) map.set(key, { id: key, title, items: [] });
    map.get(key)!.items.push(item);
  }
  return Array.from(map.values()).filter((c) => c.items.length > 0);
}

// ── Small inline sub-label ────────────────────────────────────────────────────
const smallLabel: CSSProperties = {
  fontSize: 11.5,
  fontWeight: 600,
  color: "rgba(255,255,255,0.7)",
  letterSpacing: "0.01em",
  display: "block",
  marginBottom: 4,
};

// ── Main component ────────────────────────────────────────────────────────────
export default function MediaPanel({
  explainStyleLocal,
  subheadChipStyle,
  labelStyle,
  inputStyle,
  datButtonLocal,
  loading,
  savedRecently = false,
  albumName,
  setAlbumName,
  albumFiles,
  setAlbumFiles,
  reelFiles,
  setReelFiles,
  openPicker,
  showToastError,
  saveCategory,
  alumniId,
  profile,
  setProfile,
  onSaved,
  isDirty: externalDirty = false,
}: MediaPanelProps) {

  // ── Library + derived collections ───────────────────────────────────────────
  const [library,        setLibrary]        = useState<LibraryItem[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [togglingId,     setTogglingId]     = useState<string | null>(null);
  const [featSavedFlash, setFeatSavedFlash] = useState(false);
  const featSavedFlashTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Picker state ─────────────────────────────────────────────────────────────
  const [openColId, setOpenColId] = useState<string | null>(null);

  // ── Reel URL placeholders ────────────────────────────────────────────────────
  const [reelUrl1, setReelUrl1] = useState(() => String(profile?.reelVideoUrl1 || ""));
  const [reelUrl2, setReelUrl2] = useState(() => String(profile?.reelVideoUrl2 || ""));
  const [reelUrl3, setReelUrl3] = useState(() => String(profile?.reelVideoUrl3 || ""));

  useEffect(() => {
    setReelUrl1(String(profile?.reelVideoUrl1 || ""));
    setReelUrl2(String(profile?.reelVideoUrl2 || ""));
    setReelUrl3(String(profile?.reelVideoUrl3 || ""));
  }, [profile?.reelVideoUrl1, profile?.reelVideoUrl2, profile?.reelVideoUrl3]);

  // ── Fetch library ────────────────────────────────────────────────────────────
  const fetchLibrary = useCallback(async () => {
    if (!alumniId) return;
    setLibraryLoading(true);
    try {
      const res = await fetch(
        `/api/alumni/media/list?alumniId=${encodeURIComponent(alumniId)}&kind=album&limit=200`,
      );
      if (!res.ok) return;
      const j = await res.json();
      const items: LibraryItem[] = Array.isArray(j?.items) ? j.items : [];
      items.sort(
        (a, b) =>
          (Date.parse(b.uploadedAt || "") || 0) -
          (Date.parse(a.uploadedAt || "") || 0),
      );
      setLibrary(items);
    } catch {
      // swallow
    } finally {
      setLibraryLoading(false);
    }
  }, [alumniId]);

  useEffect(() => { fetchLibrary(); }, [fetchLibrary]);

  // ── Derived data ─────────────────────────────────────────────────────────────
  const collections   = useMemo(() => groupIntoCollections(library), [library]);
  const featuredItems = useMemo(() => library.filter((p) => p.isFeatured), [library]);
  const featuredCount = featuredItems.length;
  const openCol       = collections.find((c) => c.id === openColId) ?? null;

  // True when every item is ungrouped — skip two-level nav, show flat grid.
  const allUngrouped =
    collections.length === 1 && collections[0].id === "__ungrouped__";

  // Reset stale openColId if the collection it pointed to no longer exists.
  useEffect(() => {
    if (openColId !== null && !collections.find((c) => c.id === openColId)) {
      setOpenColId(null);
    }
  }, [collections, openColId]);

  // ── Toggle featured ──────────────────────────────────────────────────────────
  async function toggleFeatured(item: LibraryItem) {
    if (!alumniId || togglingId) return;
    if (!item.isFeatured && featuredCount >= MAX_FEATURED) {
      showToastError(`Already ${MAX_FEATURED} featured — remove one first.`);
      return;
    }
    setTogglingId(item.fileId);
    // Optimistic
    setLibrary((prev) =>
      prev.map((p) =>
        p.fileId === item.fileId ? { ...p, isFeatured: !p.isFeatured } : p,
      ),
    );
    try {
      const res = await fetch("/api/media/feature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alumniId, kind: "album", fileId: item.fileId }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j?.error || "Failed");
      // Optimistic update already reflects the new state — no re-fetch needed.
      // Re-fetching here would race with Sheets write propagation and snap back.
      if (featSavedFlashTimeout.current) clearTimeout(featSavedFlashTimeout.current);
      setFeatSavedFlash(true);
      featSavedFlashTimeout.current = setTimeout(() => setFeatSavedFlash(false), 1500);
    } catch (e: any) {
      showToastError(e?.message || "Could not update featured status");
      setLibrary((prev) =>
        prev.map((p) =>
          p.fileId === item.fileId ? { ...p, isFeatured: item.isFeatured } : p,
        ),
      );
    } finally {
      setTogglingId(null);
    }
  }

  const hasUploadWork = albumFiles.length > 0 || reelFiles.length > 0;
  const isDirty       = hasUploadWork || externalDirty;

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div>
      <div id="studio-media-anchor" />

      <p style={explainStyleLocal}>
        Manage your photo albums, reels, and featured media. Photos marked as
        featured appear in the fan on your public profile.
      </p>

      {/* ═══════════════════════════════════════════════════════════
          FEATURED PHOTOS
      ═══════════════════════════════════════════════════════════ */}
      <span style={subheadChipStyle} className="subhead-chip">
        Featured Photos
      </span>

      <p style={{ ...explainStyleLocal, opacity: 0.55, fontSize: "0.8rem", fontStyle: "italic" }}>
        Up to {MAX_FEATURED} photos appear in the fan on your public profile.
        Browse your collections below to choose them.
      </p>

      {/* ── Staging area ──────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "flex-start",
          flexWrap: "wrap",
          padding: "14px 16px",
          borderRadius: 12,
          background: "rgba(0,0,0,0.18)",
          border: "1px solid rgba(255,255,255,0.10)",
          marginBottom: 20,
        }}
      >
        {Array.from({ length: MAX_FEATURED }).map((_, i) => {
          const item = featuredItems[i];
          if (item) {
            const toggling = togglingId === item.fileId;
            return (
              <div
                key={item.fileId}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  opacity: toggling ? 0.5 : 1,
                  transition: "opacity 0.15s",
                }}
              >
                {/* Thumb with remove ×  */}
                <div style={{ position: "relative" }}>
                  <div
                    style={{
                      width: SLOT_SIZE,
                      height: SLOT_SIZE,
                      borderRadius: 9,
                      overflow: "hidden",
                      border: "2.5px solid rgba(108,0,175,0.9)",
                      background: "rgba(255,255,255,0.06)",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={thumbUrl(item)}
                      alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>
                  {/* Slot number badge */}
                  <div
                    style={{
                      position: "absolute",
                      top: 4,
                      left: 5,
                      background: "rgba(108,0,175,0.88)",
                      borderRadius: 5,
                      padding: "1px 5px",
                      fontSize: 9,
                      fontWeight: 700,
                      color: "#fff",
                      letterSpacing: "0.04em",
                      pointerEvents: "none",
                    }}
                  >
                    {i + 1}
                  </div>
                  {/* Remove × */}
                  <button
                    type="button"
                    title="Remove from featured"
                    disabled={loading || !!togglingId}
                    onClick={() => toggleFeatured(item)}
                    style={{
                      position: "absolute",
                      top: -6,
                      right: -6,
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: "rgba(30,12,44,0.92)",
                      border: "1.5px solid rgba(255,255,255,0.25)",
                      color: "rgba(255,255,255,0.8)",
                      fontSize: 11,
                      fontWeight: 700,
                      lineHeight: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      padding: 0,
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "rgba(200,50,50,0.85)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "rgba(30,12,44,0.92)";
                    }}
                  >
                    ×
                  </button>
                </div>
                {/* Short label */}
                <div
                  style={{
                    width: SLOT_SIZE,
                    fontSize: 9.5,
                    opacity: 0.55,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    textAlign: "center",
                    color: "#e0d0f0",
                  }}
                >
                  {item.collectionTitle || item.note || "—"}
                </div>
              </div>
            );
          }

          // Empty slot
          return (
            <div
              key={`empty-${i}`}
              style={{
                width: SLOT_SIZE,
                height: SLOT_SIZE,
                borderRadius: 9,
                border: "2px dashed rgba(255,255,255,0.18)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 3,
                opacity: 0.4,
              }}
            >
              <span style={{ fontSize: 18, lineHeight: 1, color: "rgba(255,255,255,0.5)" }}>+</span>
              <span style={{ fontSize: 9, letterSpacing: "0.04em", color: "rgba(255,255,255,0.45)" }}>
                SLOT {i + 1}
              </span>
            </div>
          );
        })}

        {/* Count label at end */}
        <div
          style={{
            alignSelf: "center",
            marginLeft: 4,
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: featuredCount >= MAX_FEATURED ? "#c4b5fd" : "rgba(255,255,255,0.45)",
                letterSpacing: "0.03em",
              }}
            >
              ★ {featuredCount} / {MAX_FEATURED}
            </span>
            {featSavedFlash && (
              <span
                style={{
                  fontSize: 10,
                  color: "#6ee7b7",
                  fontWeight: 700,
                  opacity: 0.9,
                  transition: "opacity 0.2s",
                }}
              >
                ✓ Saved
              </span>
            )}
          </div>
          {featuredCount >= MAX_FEATURED && (
            <div style={{ fontSize: 10, opacity: 0.6, color: "#c4b5fd", maxWidth: 80, lineHeight: 1.3 }}>
              Remove one to swap
            </div>
          )}
        </div>
      </div>

      {/* ── Collection picker ─────────────────────────────────── */}
      <div
        style={{
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(0,0,0,0.12)",
          overflow: "hidden",
        }}
      >
        {/* Header row */}
        <div
          style={{
            padding: "10px 14px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.7, letterSpacing: "0.03em" }}>
            {!allUngrouped && openCol
              ? (
                <button
                  type="button"
                  onClick={() => setOpenColId(null)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "rgba(255,255,255,0.55)",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    letterSpacing: "0.02em",
                  }}
                >
                  ← Collections
                </button>
              )
              : allUngrouped ? "Photos" : "Collections"}
          </div>
          {!allUngrouped && openCol && (
            <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.85 }}>
              {openCol.title}
              <span style={{ fontWeight: 400, opacity: 0.5, marginLeft: 6 }}>
                · {openCol.items.length} photo{openCol.items.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={fetchLibrary}
            disabled={libraryLoading}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.35)",
              fontSize: 12,
              cursor: "pointer",
              padding: 0,
              transition: "opacity 0.15s",
              opacity: libraryLoading ? 0.3 : 1,
            }}
            title="Refresh library"
          >
            ↺
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "14px 14px 12px" }}>
          {libraryLoading && library.length === 0 ? (
            <div style={{ fontSize: 13, opacity: 0.4, padding: "12px 0" }}>
              Loading your library…
            </div>
          ) : library.length === 0 ? (
            <div style={{ fontSize: 13, opacity: 0.4, padding: "12px 0" }}>
              No photos yet — upload some below and they&apos;ll appear here.
            </div>
          ) : allUngrouped || openCol ? (
            /* ── Photo grid (flat or inside an open collection) ─── */
            (() => {
              const photoGridItems = allUngrouped ? collections[0].items : openCol!.items;
              return (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              {photoGridItems.map((item) => {
                const isFeat   = !!item.isFeatured;
                const toggling = togglingId === item.fileId;
                const blocked  = !isFeat && featuredCount >= MAX_FEATURED;

                return (
                  <button
                    key={item.fileId}
                    type="button"
                    title={
                      isFeat
                        ? "Click to remove from featured"
                        : blocked
                        ? `${MAX_FEATURED} featured already — remove one first`
                        : "Click to add to featured"
                    }
                    disabled={loading || toggling || (blocked && !isFeat)}
                    onClick={() => toggleFeatured(item)}
                    style={{
                      position: "relative",
                      width: PHOTO_THUMB,
                      height: PHOTO_THUMB,
                      borderRadius: 8,
                      overflow: "hidden",
                      border: isFeat
                        ? "2.5px solid rgba(108,0,175,0.95)"
                        : "2px solid rgba(255,255,255,0.12)",
                      background: "#1a0c22",
                      padding: 0,
                      cursor: blocked ? "not-allowed" : "pointer",
                      opacity: toggling ? 0.45 : blocked ? 0.35 : 1,
                      transition: "opacity 0.15s, border-color 0.15s",
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => {
                      if (!blocked && !toggling)
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(108,0,175,0.7)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = isFeat
                        ? "rgba(108,0,175,0.95)"
                        : "rgba(255,255,255,0.12)";
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={thumbUrl(item)}
                      alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                    {/* Featured overlay */}
                    {isFeat && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: 0,
                          left: 0,
                          right: 0,
                          background: "rgba(108,0,175,0.85)",
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: "0.05em",
                          textAlign: "center",
                          padding: "2px 0 3px",
                          color: "#fff",
                          pointerEvents: "none",
                        }}
                      >
                        ★ {featuredItems.indexOf(item) + 1}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
              );
            })()
          ) : (
            /* ── Collection grid ────────────────────────────────── */
            <div
              style={{
                display: "flex",
                gap: 14,
                overflowX: "auto",
                paddingBottom: 8,
                scrollbarWidth: "none",
              } as CSSProperties}
            >
              {collections.map((col) => {
                const stackImgs  = col.items.slice(0, 3).reverse(); // bottom → top
                const hasFeat    = col.items.some((it) => it.isFeatured);
                const containerW = COL_STACK_W + COL_STACK_PAD * 2;
                const containerH = COL_STACK_H + COL_STACK_PAD * 2;

                return (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => setOpenColId(col.id)}
                    style={{
                      flexShrink: 0,
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 5,
                      opacity: libraryLoading ? 0.5 : 1,
                      transition: "opacity 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.opacity = "0.75";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.opacity = "1";
                    }}
                  >
                    {/* Stack */}
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
                            width: COL_STACK_W,
                            height: COL_STACK_H,
                            top: "50%",
                            left: "50%",
                            transform: `translate(-50%, -50%) rotate(${LAYER_ROTS[si] ?? 0}deg)`,
                            zIndex: si + 1,
                            borderRadius: 8,
                            overflow: "hidden",
                            boxShadow: "0 2px 10px rgba(0,0,0,0.35)",
                            background: "#1a0c22",
                            border: hasFeat && si === stackImgs.length - 1
                              ? "2px solid rgba(108,0,175,0.7)"
                              : "none",
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={thumbUrl(img, 150)}
                            alt=""
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                          />
                        </div>
                      ))}

                      {/* Featured dot on top-right if this collection has featured photos */}
                      {hasFeat && (
                        <div
                          style={{
                            position: "absolute",
                            top: COL_STACK_PAD - 4,
                            right: COL_STACK_PAD - 4,
                            zIndex: 20,
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: "#6C00AF",
                            border: "1.5px solid rgba(255,255,255,0.5)",
                            pointerEvents: "none",
                          }}
                        />
                      )}
                    </div>

                    {/* Label */}
                    <div style={{ textAlign: "center", maxWidth: containerW + 8 }}>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          opacity: 0.8,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          color: "#e0d0f0",
                        }}
                      >
                        {col.title}
                      </div>
                      <div style={{ fontSize: 10, opacity: 0.4, marginTop: 1 }}>
                        {col.items.length}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          UPLOAD PHOTOS
      ═══════════════════════════════════════════════════════════ */}
      <div
        style={{
          marginTop: 28,
          paddingTop: 22,
          borderTop: "1px solid rgba(255,255,255,0.10)",
        }}
      >
        <span style={subheadChipStyle} className="subhead-chip">
          Upload Photos
        </span>

        <p style={{ ...explainStyleLocal, opacity: 0.55, fontSize: "0.8rem", fontStyle: "italic" }}>
          Drop photos below to add them to your library. After uploading,
          they appear in the collection picker above.
        </p>

        <div style={{ display: "grid", gap: 14, marginTop: 14 }}>
          <div>
            <label style={labelStyle}>Album / collection name (optional)</label>
            <input
              value={albumName || ""}
              onChange={(e) => setAlbumName(e.target.value)}
              style={inputStyle}
              placeholder="e.g. Production photos, BTS, Summer Camp 2024…"
            />
          </div>

          <div>
            <label style={labelStyle}>Add photos</label>
            <Dropzone
              accept="image/*"
              multiple
              disabled={loading}
              label=""
              sublabel=""
              onFiles={(files) => setAlbumFiles(files)}
              onReject={(rej) => showToastError(rej[0]?.reason || "File rejected")}
              style={{
                minHeight: 160,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "36px 24px",
                textAlign: "center",
                gap: 0,
              }}
            >
              <p style={{ margin: 0, fontWeight: 700, fontSize: 17, letterSpacing: "0.01em" }}>
                Upload Photos
              </p>
              <p style={{ margin: "10px 0 4px", fontWeight: 600, fontSize: 15, opacity: 0.85 }}>
                Drag &amp; Drop
              </p>
              <p style={{ margin: "0 0 8px", fontSize: 12, opacity: 0.5 }}>or</p>
              <p style={{ margin: 0, fontSize: 13, opacity: 0.75, textDecoration: "underline" }}>
                Click to Browse
              </p>
            </Dropzone>
          </div>

          {/* Staged file preview */}
          {albumFiles.length > 0 && (
            <div
              style={{
                padding: 12,
                border: "1px solid rgba(255,255,255,0.14)",
                borderRadius: 12,
                background: "rgba(0,0,0,0.18)",
                display: "grid",
                gap: 10,
              }}
            >
              <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
                {albumFiles.map((f, i) => {
                  const url = URL.createObjectURL(f);
                  return (
                    <div key={`${f.name}-${i}`} style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: 3 }}>
                      <div
                        style={{
                          width: 72,
                          height: 72,
                          borderRadius: 8,
                          overflow: "hidden",
                          border: "1.5px solid rgba(255,255,255,0.2)",
                          background: "rgba(255,255,255,0.06)",
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={f.name}
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                          onLoad={() => URL.revokeObjectURL(url)}
                        />
                      </div>
                      <div style={{ width: 72, fontSize: 10, opacity: 0.6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {f.name}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>
                  {albumFiles.length} photo{albumFiles.length !== 1 ? "s" : ""} staged
                </div>
                <button
                  type="button"
                  className="dat-btn-ghost"
                  style={{ ...studioGhostButton, flexShrink: 0 }}
                  onClick={() => setAlbumFiles([])}
                  disabled={loading}
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          REELS
      ═══════════════════════════════════════════════════════════ */}
      <div
        style={{
          marginTop: 24,
          paddingTop: 22,
          borderTop: "1px solid rgba(255,255,255,0.10)",
        }}
      >
        <span style={subheadChipStyle} className="subhead-chip">
          Reels
        </span>

        <p style={{ ...explainStyleLocal, opacity: 0.55, fontSize: "0.8rem", fontStyle: "italic" }}>
          Paste links to your short-form video reels (Instagram, TikTok, YouTube
          Shorts, Vimeo, etc.). These will be wired up to a dedicated reel
          display in a future update.
        </p>

        <div style={{ display: "grid", gap: 14, marginTop: 14 }}>
          {(
            [
              { label: "Reel 1", value: reelUrl1, setter: setReelUrl1 },
              { label: "Reel 2", value: reelUrl2, setter: setReelUrl2 },
              { label: "Reel 3", value: reelUrl3, setter: setReelUrl3 },
            ] as { label: string; value: string; setter: (v: string) => void }[]
          ).map(({ label, value, setter }) => (
            <div key={label}>
              <label style={smallLabel}>{label}</label>
              <input
                type="url"
                value={value}
                onChange={(e) => setter(e.target.value)}
                placeholder="https://… (Instagram, TikTok, YouTube, Vimeo, etc.)"
                style={inputStyle}
              />
            </div>
          ))}

          <div>
            <label style={labelStyle}>Or upload reel video files</label>
            <Dropzone
              accept="video/*"
              multiple
              disabled={loading}
              label=""
              sublabel=""
              onFiles={(files) => setReelFiles(files)}
              onReject={(rej) => showToastError(rej[0]?.reason || "File rejected")}
              style={{
                minHeight: 120,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "28px 24px",
                textAlign: "center",
                gap: 0,
              }}
            >
              <p style={{ margin: 0, fontWeight: 600, fontSize: 15 }}>Upload Video Files</p>
              <p style={{ margin: "8px 0 4px", fontSize: 13, opacity: 0.7 }}>Drag &amp; Drop</p>
              <p style={{ margin: 0, fontSize: 12, opacity: 0.5, textDecoration: "underline" }}>
                Click to Browse
              </p>
            </Dropzone>

            {reelFiles.length > 0 && (
              <div
                style={{
                  marginTop: 10,
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(0,0,0,0.14)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700 }}>
                  {reelFiles.length} reel{reelFiles.length !== 1 ? "s" : ""} staged
                  <div style={{ fontSize: 11, opacity: 0.55, fontWeight: 400, marginTop: 2 }}>
                    {reelFiles.map((f) => f.name).join(", ")}
                  </div>
                </div>
                <button
                  type="button"
                  className="dat-btn-ghost"
                  style={{ ...studioGhostButton, flexShrink: 0 }}
                  onClick={() => setReelFiles([])}
                  disabled={loading}
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          BROWSE & DOWNLOAD
      ═══════════════════════════════════════════════════════════ */}
      <div
        style={{
          marginTop: 24,
          paddingTop: 22,
          borderTop: "1px solid rgba(255,255,255,0.10)",
        }}
      >
        <span style={subheadChipStyle} className="subhead-chip">
          Browse &amp; Download
        </span>
        <p style={{ ...explainStyleLocal, opacity: 0.55, fontSize: "0.8rem", fontStyle: "italic" }}>
          Open the full library picker to browse or follow Google Drive links to
          download original files.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
          <button
            type="button"
            style={studioGhostButton}
            onClick={() => openPicker("album")}
            disabled={loading}
          >
            Browse photo library
          </button>
          <button
            type="button"
            style={studioGhostButton}
            onClick={() => openPicker("reel")}
            disabled={loading}
          >
            Browse reel library
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          SAVE ROW
      ═══════════════════════════════════════════════════════════ */}
      <div
        style={{
          marginTop: 32,
          paddingTop: 18,
          borderTop: "1px solid rgba(255,255,255,0.10)",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 14,
          flexWrap: "wrap",
        }}
      >
        {isDirty && !savedRecently && (
          <span style={{ fontSize: 12, opacity: 0.7, display: "flex", alignItems: "center", gap: 5, color: "#f5c542" }}>
            <span style={{ fontSize: 8 }}>●</span> Unsaved changes
          </span>
        )}
        {savedRecently && (
          <span style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 5, color: "#6ee7b7", opacity: 0.9 }}>
            <span style={{ fontSize: 10 }}>✓</span> Uploaded
          </span>
        )}
        <button
          type="button"
          style={{
            ...datButtonLocal,
            ...(savedRecently ? { background: "rgba(52,211,153,0.25)", borderColor: "rgba(52,211,153,0.5)" } : {}),
          }}
          disabled={loading || !hasUploadWork}
          onClick={() =>
            saveCategory({
              tag: "Media Upload",
              fieldKeys: [],
              uploadKinds: [
                ...(albumFiles.length ? (["album"] as UploadKind[]) : []),
                ...(reelFiles.length  ? (["reel"]  as UploadKind[]) : []),
              ],
              afterSave: () => {
                onSaved?.();
                fetchLibrary();
              },
            })
          }
        >
          {savedRecently ? "Uploaded ✓" : "Upload Staged Media"}
        </button>
      </div>
    </div>
  );
}
