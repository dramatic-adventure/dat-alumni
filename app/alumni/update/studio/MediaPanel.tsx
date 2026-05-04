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
const SLOT_SIZE = 82;   // cover photo thumb px

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

  // ── Featured Video URL + metadata state ─────────────────────────────────────
  const [reelUrl1, setReelUrl1] = useState(() => String(profile?.reelVideoUrl1 || ""));
  const [reelUrl2, setReelUrl2] = useState(() => String(profile?.reelVideoUrl2 || ""));
  const [reelUrl3, setReelUrl3] = useState(() => String(profile?.reelVideoUrl3 || ""));
  const [videoTitle1, setVideoTitle1] = useState(() => String(profile?.videoTitle1 || ""));
  const [videoTitle2, setVideoTitle2] = useState(() => String(profile?.videoTitle2 || ""));
  const [videoTitle3, setVideoTitle3] = useState(() => String(profile?.videoTitle3 || ""));
  const [videoAspect1, setVideoAspect1] = useState(() => String(profile?.videoAspect1 || ""));
  const [videoAspect2, setVideoAspect2] = useState(() => String(profile?.videoAspect2 || ""));
  const [videoAspect3, setVideoAspect3] = useState(() => String(profile?.videoAspect3 || ""));
  const [videoAutoplay, setVideoAutoplay] = useState(
    () => String(profile?.videoAutoplay || "").trim(),
  );
  const [videoFullBleed, setVideoFullBleed] = useState(
    () => String(profile?.videoFullBleed || "").trim() === "true",
  );

  useEffect(() => {
    setReelUrl1(String(profile?.reelVideoUrl1 || ""));
    setReelUrl2(String(profile?.reelVideoUrl2 || ""));
    setReelUrl3(String(profile?.reelVideoUrl3 || ""));
    setVideoTitle1(String(profile?.videoTitle1 || ""));
    setVideoTitle2(String(profile?.videoTitle2 || ""));
    setVideoTitle3(String(profile?.videoTitle3 || ""));
    setVideoAspect1(String(profile?.videoAspect1 || ""));
    setVideoAspect2(String(profile?.videoAspect2 || ""));
    setVideoAspect3(String(profile?.videoAspect3 || ""));
    setVideoAutoplay(String(profile?.videoAutoplay || "").trim());
    setVideoFullBleed(String(profile?.videoFullBleed || "").trim() === "true");
  }, [
    profile?.reelVideoUrl1, profile?.reelVideoUrl2, profile?.reelVideoUrl3,
    profile?.videoTitle1, profile?.videoTitle2, profile?.videoTitle3,
    profile?.videoAspect1, profile?.videoAspect2, profile?.videoAspect3,
    profile?.videoAutoplay, profile?.videoFullBleed,
  ]);

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
  const collections = useMemo(() => groupIntoCollections(library), [library]);

  // Reset stale openColId if the collection it pointed to no longer exists.
  useEffect(() => {
    if (openColId !== null && !collections.find((c) => c.id === openColId)) {
      setOpenColId(null);
    }
  }, [collections, openColId]);

  // ── Set cover photo (1 per collection) ──────────────────────────────────────
  async function toggleFeatured(item: LibraryItem) {
    if (!alumniId || togglingId) return;
    const colKey = item.collectionId || item.collectionTitle || "__ungrouped__";

    // Find any existing cover in the same collection
    const prevCover = library.find(
      (p) =>
        p.isFeatured &&
        p.fileId !== item.fileId &&
        (p.collectionId || p.collectionTitle || "__ungrouped__") === colKey,
    );

    setTogglingId(item.fileId);

    // Optimistic: unfeature previous cover in this collection, toggle this one
    setLibrary((prev) =>
      prev.map((p) => {
        if (p.fileId === item.fileId) return { ...p, isFeatured: !p.isFeatured };
        if (prevCover && p.fileId === prevCover.fileId) return { ...p, isFeatured: false };
        return p;
      }),
    );

    try {
      // Unfeature the previous cover first (if any and we're featuring a new one)
      if (prevCover && !item.isFeatured) {
        await fetch("/api/media/feature", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ alumniId, kind: "album", fileId: prevCover.fileId }),
        });
      }
      // Toggle the clicked item
      const res = await fetch("/api/media/feature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alumniId, kind: "album", fileId: item.fileId }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j?.error || "Failed");

      if (featSavedFlashTimeout.current) clearTimeout(featSavedFlashTimeout.current);
      setFeatSavedFlash(true);
      featSavedFlashTimeout.current = setTimeout(() => setFeatSavedFlash(false), 1500);
    } catch (e: any) {
      showToastError(e?.message || "Could not update cover photo");
      // Roll back optimistic update
      setLibrary((prev) =>
        prev.map((p) => {
          if (p.fileId === item.fileId) return { ...p, isFeatured: item.isFeatured };
          if (prevCover && p.fileId === prevCover.fileId) return { ...p, isFeatured: true };
          return p;
        }),
      );
    } finally {
      setTogglingId(null);
    }
  }

  const hasUploadWork = albumFiles.length > 0;
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
          COVER PHOTOS
      ═══════════════════════════════════════════════════════════ */}
      <span style={subheadChipStyle} className="subhead-chip">
        Cover Photos
      </span>

      <p style={{ ...explainStyleLocal, opacity: 0.55, fontSize: "0.8rem", fontStyle: "italic" }}>
        Choose one cover photo per collection — it&apos;s shown in the accordion on your
        public profile. Click a collection to pick or change its cover.
      </p>

      {/* ── Per-collection cover rows ──────────────────────────── */}
      {collections.length > 0 && (
        <div
          style={{
            display: "grid",
            gap: 8,
            marginBottom: 20,
          }}
        >
          {collections.map((col) => {
            const cover = col.items.find((it) => it.isFeatured) ?? col.items[0];
            const isEditing = openColId === col.id;
            return (
              <div
                key={col.id}
                style={{
                  borderRadius: 10,
                  border: isEditing
                    ? "1px solid rgba(108,0,175,0.55)"
                    : "1px solid rgba(255,255,255,0.10)",
                  background: isEditing ? "rgba(108,0,175,0.10)" : "rgba(0,0,0,0.18)",
                  overflow: "hidden",
                  transition: "border-color 0.2s, background 0.2s",
                }}
              >
                {/* Row header */}
                <button
                  type="button"
                  onClick={() => setOpenColId(isEditing ? null : col.id)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 14px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  {/* Cover thumb */}
                  <div
                    style={{
                      width: SLOT_SIZE,
                      height: SLOT_SIZE,
                      borderRadius: 7,
                      overflow: "hidden",
                      flexShrink: 0,
                      background: "rgba(255,255,255,0.06)",
                      border: cover?.isFeatured
                        ? "2px solid rgba(108,0,175,0.8)"
                        : "1.5px solid rgba(255,255,255,0.12)",
                    }}
                  >
                    {cover && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumbUrl(cover)}
                        alt=""
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                      />
                    )}
                  </div>

                  {/* Labels */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#e0d0f0",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {col.title}
                    </div>
                    <div style={{ fontSize: 10, opacity: 0.45, marginTop: 2 }}>
                      {col.items.length} photo{col.items.length !== 1 ? "s" : ""}
                      {cover?.isFeatured ? " · cover set" : " · using first photo"}
                    </div>
                  </div>

                  {/* Caret + saved flash */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    {featSavedFlash && isEditing && (
                      <span style={{ fontSize: 10, color: "#6ee7b7", fontWeight: 700 }}>✓</span>
                    )}
                    <span style={{ fontSize: 11, opacity: 0.4, color: "#e0d0f0" }}>
                      {isEditing ? "▲" : "▼"}
                    </span>
                  </div>
                </button>

                {/* Expanded photo picker */}
                {isEditing && (
                  <div
                    style={{
                      padding: "0 14px 14px",
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 7,
                    }}
                  >
                    {col.items.map((item) => {
                      const isCover  = !!item.isFeatured;
                      const toggling = togglingId === item.fileId;
                      return (
                        <button
                          key={item.fileId}
                          type="button"
                          title={isCover ? "Current cover — click to remove" : "Set as cover"}
                          disabled={loading || toggling}
                          onClick={() => toggleFeatured(item)}
                          style={{
                            position: "relative",
                            width: 68,
                            height: 68,
                            borderRadius: 7,
                            overflow: "hidden",
                            border: isCover
                              ? "2.5px solid rgba(108,0,175,0.95)"
                              : "1.5px solid rgba(255,255,255,0.12)",
                            background: "#1a0c22",
                            padding: 0,
                            cursor: toggling ? "wait" : "pointer",
                            opacity: toggling ? 0.45 : 1,
                            transition: "opacity 0.15s, border-color 0.15s",
                            flexShrink: 0,
                          }}
                          onMouseEnter={(e) => {
                            if (!toggling)
                              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(108,0,175,0.7)";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.borderColor = isCover
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
                          {isCover && (
                            <div
                              style={{
                                position: "absolute",
                                bottom: 0,
                                left: 0,
                                right: 0,
                                background: "rgba(108,0,175,0.88)",
                                fontSize: 8,
                                fontWeight: 700,
                                letterSpacing: "0.06em",
                                textAlign: "center",
                                padding: "2px 0 3px",
                                color: "#fff",
                                textTransform: "uppercase",
                                pointerEvents: "none",
                              }}
                            >
                              cover
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}



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
          FEATURED VIDEOS
      ═══════════════════════════════════════════════════════════ */}
      <div
        style={{
          marginTop: 24,
          paddingTop: 22,
          borderTop: "1px solid rgba(255,255,255,0.10)",
        }}
      >
        <span style={subheadChipStyle} className="subhead-chip">
          Featured Videos
        </span>

        <p style={{ ...explainStyleLocal, opacity: 0.55, fontSize: "0.8rem", fontStyle: "italic" }}>
          Add up to 3 video links — YouTube, Vimeo, Loom, Google Drive, or any direct
          video URL. Great for performance reels, welcome messages, fundraising videos,
          trailers, or travel footage.
        </p>

        <div style={{ display: "grid", gap: 18, marginTop: 14 }}>
          {(
            [
              {
                label: "Video 1",
                urlValue: reelUrl1, urlKey: "reelVideoUrl1" as const,
                urlSetter: setReelUrl1,
                titleValue: videoTitle1, titleKey: "videoTitle1" as const,
                titleSetter: setVideoTitle1,
                aspectValue: videoAspect1, aspectKey: "videoAspect1" as const,
                aspectSetter: setVideoAspect1,
              },
              {
                label: "Video 2",
                urlValue: reelUrl2, urlKey: "reelVideoUrl2" as const,
                urlSetter: setReelUrl2,
                titleValue: videoTitle2, titleKey: "videoTitle2" as const,
                titleSetter: setVideoTitle2,
                aspectValue: videoAspect2, aspectKey: "videoAspect2" as const,
                aspectSetter: setVideoAspect2,
              },
              {
                label: "Video 3",
                urlValue: reelUrl3, urlKey: "reelVideoUrl3" as const,
                urlSetter: setReelUrl3,
                titleValue: videoTitle3, titleKey: "videoTitle3" as const,
                titleSetter: setVideoTitle3,
                aspectValue: videoAspect3, aspectKey: "videoAspect3" as const,
                aspectSetter: setVideoAspect3,
              },
            ] as const
          ).map(({ label, urlValue, urlKey, urlSetter, titleValue, titleKey, titleSetter, aspectValue, aspectKey, aspectSetter }) => (
            <div key={label} style={{ display: "grid", gap: 8 }}>
              <label style={smallLabel}>{label}</label>
              <input
                type="url"
                value={urlValue}
                onChange={(e) => {
                  urlSetter(e.target.value);
                  setProfile?.((p: any) => ({ ...p, [urlKey]: e.target.value }));
                }}
                placeholder="https://… (YouTube, Vimeo, Loom, Google Drive, etc.)"
                style={inputStyle}
              />
              {urlValue.trim() && (
                <>
                  <input
                    type="text"
                    value={titleValue}
                    onChange={(e) => {
                      titleSetter(e.target.value);
                      setProfile?.((p: any) => ({ ...p, [titleKey]: e.target.value }));
                    }}
                    placeholder="Custom title (optional — auto-detected if blank)"
                    style={{ ...inputStyle, marginTop: 2 }}
                  />
                  <select
                    value={aspectValue}
                    onChange={(e) => {
                      aspectSetter(e.target.value);
                      setProfile?.((p: any) => ({ ...p, [aspectKey]: e.target.value }));
                    }}
                    style={{ ...inputStyle, marginTop: 2 }}
                  >
                    <option value="">Default (16:9)</option>
                    <option value="16/9">16:9 widescreen</option>
                    <option value="9/16">9:16 portrait</option>
                    <option value="1/1">1:1 square</option>
                    <option value="21/9">21:9 cinematic</option>
                    <option value="4/3">4:3</option>
                  </select>
                </>
              )}
            </div>
          ))}

          {/* Autoplay */}
          <div style={{ display: "grid", gap: 4 }}>
            <label style={smallLabel}>Autoplay first video on page load</label>
            <select
              value={videoAutoplay}
              onChange={(e) => {
                setVideoAutoplay(e.target.value);
                setProfile?.((p: any) => ({ ...p, videoAutoplay: e.target.value }));
              }}
              style={inputStyle}
            >
              <option value="">Off (no autoplay)</option>
              <option value="muted">Autoplay — muted</option>
              <option value="unmuted">Autoplay — with sound</option>
            </select>
          </div>

          {/* Full bleed — only when only URL 1 is set */}
          {reelUrl1.trim() && !reelUrl2.trim() && !reelUrl3.trim() && (
            <label
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                cursor: "pointer",
                fontSize: 13,
                color: "rgba(255,255,255,0.85)",
                lineHeight: 1.45,
              }}
            >
              <input
                type="checkbox"
                checked={videoFullBleed}
                onChange={(e) => {
                  setVideoFullBleed(e.target.checked);
                  setProfile?.((p: any) => ({ ...p, videoFullBleed: e.target.checked ? "true" : "false" }));
                }}
                style={{ marginTop: 2, flexShrink: 0 }}
              />
              Full bleed — video fills the full section width
            </label>
          )}
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
        {hasUploadWork && !savedRecently && (
          <span style={{ fontSize: 12, opacity: 0.7, display: "flex", alignItems: "center", gap: 5, color: "#f5c542" }}>
            <span style={{ fontSize: 8 }}>●</span> Photos staged
          </span>
        )}
        {savedRecently && (
          <span style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 5, color: "#6ee7b7", opacity: 0.9 }}>
            <span style={{ fontSize: 10 }}>✓</span> Saved
          </span>
        )}
        <button
          type="button"
          style={{
            ...datButtonLocal,
            ...(savedRecently ? { background: "rgba(52,211,153,0.25)", borderColor: "rgba(52,211,153,0.5)" } : {}),
          }}
          disabled={loading}
          onClick={() =>
            saveCategory({
              tag: "Media",
              fieldKeys: [
                "reelVideoUrl1", "reelVideoUrl2", "reelVideoUrl3",
                "videoTitle1", "videoTitle2", "videoTitle3",
                "videoAspect1", "videoAspect2", "videoAspect3",
                "videoAutoplay", "videoFullBleed",
              ],
              uploadKinds: [
                ...(albumFiles.length ? (["album"] as UploadKind[]) : []),
              ],
              afterSave: () => {
                onSaved?.();
                if (albumFiles.length) fetchLibrary();
              },
            })
          }
        >
          {savedRecently ? "Saved ✓" : hasUploadWork ? "Upload & Save" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
