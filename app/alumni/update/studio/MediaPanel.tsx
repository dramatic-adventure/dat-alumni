"use client";

import type { CSSProperties } from "react";
import { useState, useEffect, useCallback, useMemo } from "react";

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
const SLOT_SIZE = 82;

// ── Helpers ───────────────────────────────────────────────────────────────────
function thumbUrl(item: LibraryItem, w = 200): string {
  return `/api/media/thumb/${encodeURIComponent(item.fileId)}?w=${w}`;
}

function itemColKey(item: LibraryItem): string {
  return item.collectionId || item.collectionTitle || "__ungrouped__";
}

function groupIntoCollections(items: LibraryItem[]): Collection[] {
  const map = new Map<string, Collection>();
  for (const item of items) {
    const key   = itemColKey(item);
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

  // ── Cover photo state ─────────────────────────────────────────────────────
  // pendingCovers: colKey → fileId to feature (null = explicitly unset cover).
  // Undefined key = no pending change for that collection.
  // Selections are purely local until Save is clicked.
  const [pendingCovers, setPendingCovers] = useState<Record<string, string | null>>({});
  const [coverSaving,   setCoverSaving]   = useState(false);
  const [hoveredCoverId, setHoveredCoverId] = useState<string | null>(null);

  // ── Collection deletion ───────────────────────────────────────────────────
  const [confirmDeleteColId, setConfirmDeleteColId] = useState<string | null>(null);
  const [deletingColId,      setDeletingColId]      = useState<string | null>(null);

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

  // ── Video dirty tracking ──────────────────────────────────────────────────
  const [videoDirty, setVideoDirty] = useState(false);

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
    setVideoDirty(false);
  }, [
    profile?.reelVideoUrl1, profile?.reelVideoUrl2, profile?.reelVideoUrl3,
    profile?.videoTitle1, profile?.videoTitle2, profile?.videoTitle3,
    profile?.videoAspect1, profile?.videoAspect2, profile?.videoAspect3,
    profile?.videoAutoplay, profile?.videoFullBleed,
  ]);

  // ── Fetch library ────────────────────────────────────────────────────────────
  const fetchLibrary = useCallback(async (bust = false) => {
    if (!alumniId) return;
    setLibraryLoading(true);
    try {
      const res = await fetch(
        `/api/alumni/media/list?alumniId=${encodeURIComponent(alumniId)}&kind=album&limit=200${bust ? "&_bust=1" : ""}`,
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

  useEffect(() => {
    if (openColId !== null && !collections.find((c) => c.id === openColId)) {
      setOpenColId(null);
    }
  }, [collections, openColId]);

  // ── Cover photo selection (local only — saved on Save button) ─────────────
  // Returns the effective cover fileId for a collection, accounting for pending.
  function effectiveCoverFileId(col: Collection): string | null {
    const colKey = col.id;
    if (colKey in pendingCovers) return pendingCovers[colKey];
    return col.items.find((it) => it.isFeatured)?.fileId ?? null;
  }

  function selectCover(item: LibraryItem, col: Collection) {
    const colKey = col.id;
    const current = effectiveCoverFileId(col);

    if (current === item.fileId) {
      // Clicking the active cover: unset it.
      // If the library already has no cover (or it matches), remove the pending
      // entry so we don't trigger a no-op API call on save.
      const libCover = col.items.find((it) => it.isFeatured)?.fileId ?? null;
      if (libCover === null) {
        // Nothing to change — remove any stale pending entry
        setPendingCovers((p) => { const n = { ...p }; delete n[colKey]; return n; });
      } else {
        setPendingCovers((p) => ({ ...p, [colKey]: null }));
      }
    } else {
      // Clicking a non-cover photo: set it as pending cover.
      // If this matches the library state, remove the pending entry (back to original).
      const libCover = col.items.find((it) => it.isFeatured)?.fileId ?? null;
      if (libCover === item.fileId) {
        setPendingCovers((p) => { const n = { ...p }; delete n[colKey]; return n; });
      } else {
        setPendingCovers((p) => ({ ...p, [colKey]: item.fileId }));
      }
    }
  }

  // ── Delete (hide) a collection ───────────────────────────────────────────
  async function deleteCollection(colKey: string) {
    if (!alumniId || deletingColId) return;
    setDeletingColId(colKey);
    setConfirmDeleteColId(null);
    try {
      const res = await fetch("/api/alumni/media/collection/hide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alumniId, colKey }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j.ok) throw new Error(j?.error || "Could not remove collection");
      // Remove the collection from local library state immediately
      setLibrary((prev) => prev.filter((item) => itemColKey(item) !== colKey));
      // Clean up any pending cover selection for this collection
      setPendingCovers((p) => { const n = { ...p }; delete n[colKey]; return n; });
    } catch (e: any) {
      showToastError(e?.message || "Could not remove collection");
    } finally {
      setDeletingColId(null);
    }
  }

  // ── Dirty flags ───────────────────────────────────────────────────────────
  const hasUploadWork   = albumFiles.length > 0;
  const hasCoverChanges = Object.keys(pendingCovers).length > 0;
  const isDirty         = hasUploadWork || videoDirty || hasCoverChanges || externalDirty;

  // ── Progressive video slot visibility ────────────────────────────────────────
  const showVideo2     = !!reelUrl1.trim() || !!reelUrl2.trim();
  const showVideo3     = !!reelUrl2.trim() || !!reelUrl3.trim();
  const multipleVideos = [reelUrl1, reelUrl2, reelUrl3].filter((u) => u.trim()).length > 1;

  // ── Save handler (covers + profile fields + uploads) ─────────────────────
  const handleSave = useCallback(async () => {
    if (loading || coverSaving) return;

    // 1. Persist pending cover selections via the feature API
    const coverEntries = Object.entries(pendingCovers);
    if (coverEntries.length > 0 && alumniId) {
      setCoverSaving(true);
      try {
        for (const [colKey, targetFileId] of coverEntries) {
          const currentCoverFileId =
            library.find(
              (p) => p.isFeatured && itemColKey(p) === colKey,
            )?.fileId ?? null;

          // Skip if nothing actually changed
          if (currentCoverFileId === targetFileId) continue;

          // Unfeature the old cover first (if any)
          if (currentCoverFileId) {
            await fetch("/api/media/feature", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ alumniId, kind: "album", fileId: currentCoverFileId }),
            });
          }

          // Feature the new cover (if set)
          if (targetFileId) {
            const res = await fetch("/api/media/feature", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ alumniId, kind: "album", fileId: targetFileId }),
            });
            const j = await res.json().catch(() => ({}));
            if (!res.ok || !j.ok) {
              showToastError(j?.error || "Could not save cover photo");
              return; // abort — leave pending so user can retry
            }
          }
        }

        // Optimistically apply pending covers to library so the picker stays
        // correct until fetchLibrary(bust) returns fresh server data.
        setLibrary((prev) =>
          prev.map((item) => {
            const colKey = itemColKey(item);
            if (!(colKey in pendingCovers)) return item;
            return { ...item, isFeatured: item.fileId === pendingCovers[colKey] };
          }),
        );
        setPendingCovers({});
      } catch (e: any) {
        showToastError(e?.message || "Could not save cover photos");
        return;
      } finally {
        setCoverSaving(false);
      }
    }

    // 2. Save profile fields + uploads via the standard saveCategory path.
    //    If there's nothing profile-y to save (only covers changed), we still
    //    call it so the parent's savedRecently flash fires correctly.
    saveCategory({
      tag: "Media",
      fieldKeys: [
        "reelVideoUrl1", "reelVideoUrl2", "reelVideoUrl3",
        "videoTitle1", "videoTitle2", "videoTitle3",
        "videoAspect1", "videoAspect2", "videoAspect3",
        "videoAutoplay", "videoFullBleed",
      ],
      uploadKinds: albumFiles.length ? (["album"] as UploadKind[]) : [],
      afterSave: () => {
        onSaved?.();
        setVideoDirty(false);
        fetchLibrary(true);
      },
    });
  }, [
    loading, coverSaving, pendingCovers, alumniId, library,
    saveCategory, albumFiles, onSaved, showToastError, fetchLibrary,
  ]);

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div>
      <style>{`
        @keyframes _mp_fadeSlideIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        ._mp_videoExtra { animation: _mp_fadeSlideIn 0.18s ease; }
      `}</style>

      <div id="studio-media-anchor" />

      <p style={explainStyleLocal}>
        Manage your photo albums, reels, and featured media. Photos marked as
        featured appear in the fan on your public profile.
      </p>

      {/* ═══════════════════════════════════════════════════════════
          UPLOAD PHOTOS
      ═══════════════════════════════════════════════════════════ */}
      <span style={subheadChipStyle} className="subhead-chip">
        Upload Photos
      </span>

      <p style={{ ...explainStyleLocal, opacity: 0.55, fontSize: "0.8rem", fontStyle: "italic" }}>
        Drop photos below to add them to your library. After uploading,
        they&apos;ll appear in the cover photo picker below.
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
            onFiles={(files) => setAlbumFiles([...albumFiles, ...files])}
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
            <p style={{ margin: 0, fontWeight: 600, fontSize: 15, opacity: 0.85 }}>
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
                        position: "relative",
                        width: 72, height: 72, borderRadius: 8, overflow: "hidden",
                        border: "1.5px solid rgba(255,255,255,0.2)",
                        background: "rgba(255,255,255,0.06)",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url} alt={f.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        onLoad={() => URL.revokeObjectURL(url)}
                      />
                      {/* Remove button */}
                      <button
                        type="button"
                        aria-label={`Remove ${f.name}`}
                        onClick={() => setAlbumFiles(albumFiles.filter((_, j) => j !== i))}
                        style={{
                          position: "absolute", top: 3, right: 3,
                          width: 18, height: 18, borderRadius: "50%",
                          background: "rgba(0,0,0,0.65)",
                          border: "1px solid rgba(255,255,255,0.25)",
                          color: "#fff", fontSize: 10, fontWeight: 700,
                          lineHeight: 1, cursor: "pointer", padding: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >×</button>
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

      {/* ═══════════════════════════════════════════════════════════
          COVER PHOTOS
      ═══════════════════════════════════════════════════════════ */}
      <div
        style={{
          marginTop: 28,
          paddingTop: 22,
          borderTop: "1px solid rgba(255,255,255,0.10)",
        }}
      >
        <span style={subheadChipStyle} className="subhead-chip">
          Cover Photos
        </span>

        <p style={{ ...explainStyleLocal, opacity: 0.55, fontSize: "0.8rem", fontStyle: "italic" }}>
          Choose one cover photo per collection. Selections are saved when you
          hit Save below.
        </p>

        {libraryLoading ? (
          <div style={{ fontSize: 12, opacity: 0.45, padding: "12px 0", fontStyle: "italic" }}>
            Loading collections…
          </div>
        ) : collections.length === 0 ? (
          <div style={{ fontSize: 12, opacity: 0.45, padding: "8px 0", fontStyle: "italic" }}>
            No photo collections yet — upload some photos above and they&apos;ll appear here.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 8, marginBottom: 20 }}>
            {collections.map((col) => {
              const colKey         = col.id;
              const effCoverFileId = effectiveCoverFileId(col);
              const coverItem      = col.items.find((it) => it.fileId === effCoverFileId) ?? col.items[0];
              const isPending      = colKey in pendingCovers;
              const isEditing      = openColId === colKey;

              return (
                <div
                  key={colKey}
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
                    onClick={() => setOpenColId(isEditing ? null : colKey)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 12,
                      padding: "10px 14px", background: "none", border: "none",
                      cursor: "pointer", textAlign: "left",
                    }}
                  >
                    {/* Cover thumb */}
                    <div
                      style={{
                        width: SLOT_SIZE, height: SLOT_SIZE, borderRadius: 7,
                        overflow: "hidden", flexShrink: 0,
                        background: "rgba(255,255,255,0.06)",
                        border: effCoverFileId
                          ? "2px solid rgba(108,0,175,0.8)"
                          : "1.5px solid rgba(255,255,255,0.12)",
                      }}
                    >
                      {coverItem && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumbUrl(coverItem)} alt=""
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                        />
                      )}
                    </div>

                    {/* Labels */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#e0d0f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {col.title}
                      </div>
                      <div style={{ fontSize: 10, opacity: 0.45, marginTop: 2 }}>
                        {col.items.length} photo{col.items.length !== 1 ? "s" : ""}
                        {effCoverFileId ? " · cover selected" : " · no cover set"}
                        {isPending && (
                          <span style={{ color: "#f5c542", marginLeft: 4 }}>● unsaved</span>
                        )}
                      </div>
                    </div>

                    {/* Caret + delete button */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                      <span style={{ fontSize: 11, opacity: 0.4, color: "#e0d0f0" }}>
                        {isEditing ? "▲" : "▼"}
                      </span>
                      <button
                        type="button"
                        title="Remove this collection from your profile"
                        disabled={!!deletingColId}
                        onClick={(e) => {
                          e.stopPropagation(); // don't open/close the accordion
                          setConfirmDeleteColId(confirmDeleteColId === colKey ? null : colKey);
                        }}
                        style={{
                          background: "none", border: "none", padding: "2px 4px",
                          cursor: "pointer", color: "rgba(255,255,255,0.3)",
                          fontSize: 13, lineHeight: 1,
                          opacity: deletingColId === colKey ? 0.3 : 1,
                        }}
                      >
                        <svg width="12" height="13" viewBox="0 0 12 13" fill="none" aria-hidden="true">
                          <path d="M1 3h10M4 3V2h4v1M2 3l.8 8h6.4L10 3" stroke="currentColor"
                            strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </button>

                  {/* Inline delete confirmation */}
                  {confirmDeleteColId === colKey && (
                    <div style={{
                      padding: "10px 14px 12px",
                      borderTop: "1px solid rgba(255,255,255,0.07)",
                      background: "rgba(180,30,30,0.10)",
                      display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
                    }}>
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", flex: 1, minWidth: 160 }}>
                        Remove from profile? Photos stay in Drive.
                      </span>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteColId(null)}
                          style={{
                            background: "none", border: "1px solid rgba(255,255,255,0.18)",
                            borderRadius: 6, padding: "4px 10px", fontSize: 11,
                            color: "rgba(255,255,255,0.6)", cursor: "pointer",
                          }}
                        >Cancel</button>
                        <button
                          type="button"
                          onClick={() => deleteCollection(colKey)}
                          disabled={!!deletingColId}
                          style={{
                            background: "rgba(200,40,40,0.75)", border: "none",
                            borderRadius: 6, padding: "4px 10px", fontSize: 11,
                            color: "#fff", cursor: "pointer", fontWeight: 600,
                          }}
                        >
                          {deletingColId === colKey ? "Removing…" : "Remove"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Expanded photo picker */}
                  {isEditing && (
                    <div style={{ padding: "0 14px 14px", display: "flex", flexWrap: "wrap", gap: 7 }}>
                      {col.items.map((item) => {
                        const isCover   = item.fileId === effCoverFileId;
                        const isHovered = hoveredCoverId === item.fileId;
                        return (
                          <button
                            key={item.fileId}
                            type="button"
                            title={isCover ? "Current cover — click to unset" : "Set as cover"}
                            disabled={loading || coverSaving}
                            onClick={() => selectCover(item, col)}
                            onMouseEnter={() => setHoveredCoverId(item.fileId)}
                            onMouseLeave={() => setHoveredCoverId(null)}
                            style={{
                              position: "relative", width: 68, height: 68, borderRadius: 7,
                              overflow: "hidden",
                              border: isCover
                                ? "2.5px solid rgba(108,0,175,0.95)"
                                : isHovered
                                ? "2px solid rgba(108,0,175,0.7)"
                                : "1.5px solid rgba(255,255,255,0.12)",
                              background: "#1a0c22", padding: 0, cursor: "pointer",
                              transition: "border-color 0.15s", flexShrink: 0,
                            }}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={thumbUrl(item)} alt=""
                              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                            />
                            {isCover && (
                              <div
                                style={{
                                  position: "absolute", bottom: 0, left: 0, right: 0,
                                  background: isHovered ? "rgba(160,0,60,0.92)" : "rgba(108,0,175,0.88)",
                                  fontSize: 8, fontWeight: 700, letterSpacing: "0.06em",
                                  textAlign: "center", padding: "2px 0 3px", color: "#fff",
                                  textTransform: "uppercase", pointerEvents: "none",
                                  transition: "background 0.15s",
                                }}
                              >
                                {isHovered ? "✕ unset" : "cover"}
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
                label: "Video 1", show: true,
                urlValue: reelUrl1, urlKey: "reelVideoUrl1" as const, urlSetter: setReelUrl1,
                titleValue: videoTitle1, titleKey: "videoTitle1" as const, titleSetter: setVideoTitle1,
                aspectValue: videoAspect1, aspectKey: "videoAspect1" as const, aspectSetter: setVideoAspect1,
              },
              {
                label: "Video 2", show: showVideo2,
                urlValue: reelUrl2, urlKey: "reelVideoUrl2" as const, urlSetter: setReelUrl2,
                titleValue: videoTitle2, titleKey: "videoTitle2" as const, titleSetter: setVideoTitle2,
                aspectValue: videoAspect2, aspectKey: "videoAspect2" as const, aspectSetter: setVideoAspect2,
              },
              {
                label: "Video 3", show: showVideo3,
                urlValue: reelUrl3, urlKey: "reelVideoUrl3" as const, urlSetter: setReelUrl3,
                titleValue: videoTitle3, titleKey: "videoTitle3" as const, titleSetter: setVideoTitle3,
                aspectValue: videoAspect3, aspectKey: "videoAspect3" as const, aspectSetter: setVideoAspect3,
              },
            ] as const
          ).filter(({ show }) => show).map(({ label, urlValue, urlKey, urlSetter, titleValue, titleKey, titleSetter, aspectValue, aspectKey, aspectSetter }) => (
            <div key={label} style={{ display: "grid", gap: 8 }}>
              <label style={smallLabel}>{label}</label>
              <input
                type="url" value={urlValue}
                onChange={(e) => {
                  urlSetter(e.target.value);
                  setProfile?.((p: any) => ({ ...p, [urlKey]: e.target.value }));
                  setVideoDirty(true);
                }}
                placeholder="https://… (YouTube, Vimeo, Loom, Google Drive, etc.)"
                style={inputStyle}
              />
              {urlValue.trim() && (
                <div className="_mp_videoExtra" style={{ display: "grid", gap: 6 }}>
                  <input
                    type="text" value={titleValue}
                    onChange={(e) => {
                      titleSetter(e.target.value);
                      setProfile?.((p: any) => ({ ...p, [titleKey]: e.target.value }));
                      setVideoDirty(true);
                    }}
                    placeholder="Custom title (optional — auto-detected if blank)"
                    style={inputStyle}
                  />
                  <select
                    value={aspectValue}
                    onChange={(e) => {
                      aspectSetter(e.target.value);
                      setProfile?.((p: any) => ({ ...p, [aspectKey]: e.target.value }));
                      setVideoDirty(true);
                    }}
                    style={inputStyle}
                  >
                    <option value="">Default (16:9)</option>
                    <option value="16/9">16:9 widescreen</option>
                    <option value="9/16">9:16 portrait</option>
                    <option value="1/1">1:1 square</option>
                    <option value="21/9">21:9 cinematic</option>
                    <option value="4/3">4:3</option>
                  </select>
                </div>
              )}
            </div>
          ))}

          {/* Autoplay — muted only (browsers block unmuted autoplay universally) */}
          <div style={{ display: "grid", gap: 4 }}>
            <label style={smallLabel}>Autoplay first video on page load</label>
            <select
              value={videoAutoplay}
              onChange={(e) => {
                setVideoAutoplay(e.target.value);
                setProfile?.((p: any) => ({ ...p, videoAutoplay: e.target.value }));
                setVideoDirty(true);
              }}
              style={inputStyle}
            >
              <option value="">Off (no autoplay)</option>
              <option value="muted">Autoplay — muted</option>
            </select>
          </div>

          {/* Full bleed — shown whenever video 1 is set; disabled when multiple videos */}
          {reelUrl1.trim() && (
            <div>
              <label
                style={{
                  display: "flex", alignItems: "flex-start", gap: 8,
                  cursor: multipleVideos ? "default" : "pointer",
                  fontSize: 13,
                  color: multipleVideos ? "rgba(255,255,255,0.38)" : "rgba(255,255,255,0.85)",
                  lineHeight: 1.45,
                }}
              >
                <input
                  type="checkbox" checked={videoFullBleed} disabled={multipleVideos}
                  onChange={(e) => {
                    setVideoFullBleed(e.target.checked);
                    setProfile?.((p: any) => ({ ...p, videoFullBleed: e.target.checked ? "true" : "false" }));
                    setVideoDirty(true);
                  }}
                  style={{ marginTop: 2, flexShrink: 0 }}
                />
                Full bleed — video fills the full section width
              </label>
              {multipleVideos && (
                <p style={{ margin: "4px 0 0 24px", fontSize: 11, opacity: 0.4, fontStyle: "italic" }}>
                  Only available when a single video is featured
                </p>
              )}
            </div>
          )}
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
        {hasCoverChanges && !savedRecently && (
          <span style={{ fontSize: 12, opacity: 0.7, display: "flex", alignItems: "center", gap: 5, color: "#f5c542" }}>
            <span style={{ fontSize: 8 }}>●</span> Cover changes pending
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
            ...(savedRecently
              ? { background: "rgba(52,211,153,0.25)", borderColor: "rgba(52,211,153,0.5)" }
              : {}),
            ...(!isDirty && !savedRecently ? { opacity: 0.45 } : {}),
          }}
          disabled={loading || coverSaving}
          onClick={handleSave}
        >
          {coverSaving
            ? "Saving…"
            : savedRecently
            ? "Saved ✓"
            : hasUploadWork
            ? "Upload & Save"
            : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
