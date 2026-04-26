"use client";

import type { CSSProperties } from "react";

import Dropzone from "@/components/media/Dropzone";
import { ghostButton as studioGhostButton } from "@/components/alumni/update/ProfileStudio";

type UploadKind = "headshot" | "album" | "reel" | "event";

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
};

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
}: MediaPanelProps) {
  const isDirty = albumFiles.length > 0 || reelFiles.length > 0;

  return (
    <div>
      <div id="studio-media-anchor" />
      <p style={explainStyleLocal}>
        Albums + reels live here. Stage your files, then hit Upload.
      </p>

      <span style={subheadChipStyle} className="subhead-chip">
        Photos &amp; Reels
      </span>

      <p style={{ ...explainStyleLocal, opacity: 0.65, fontSize: "0.8rem" }}>
        Use the pickers to select from your existing library, or drop new files below.
      </p>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <button
          type="button"
          style={studioGhostButton}
          onClick={() => openPicker("album")}
          disabled={loading}
        >
          Choose album media
        </button>
        <button
          type="button"
          style={studioGhostButton}
          onClick={() => openPicker("reel")}
          disabled={loading}
        >
          Choose reel media
        </button>
      </div>

      <div style={{ display: "grid", gap: 14 }}>
        <div>
          <label style={labelStyle}>Album name (optional)</label>
          <input
            value={albumName || ""}
            onChange={(e) => setAlbumName(e.target.value)}
            style={inputStyle}
            placeholder="e.g. Production photos, BTS, PASSAGE…"
          />
        </div>

        <div>
          <label style={labelStyle}>Add photos to album</label>
          <Dropzone
            accept="image/*"
            multiple
            disabled={loading}
            label="Add photos to album"
            sublabel="or drag & drop here"
            onFiles={(files) => setAlbumFiles(files)}
            onReject={(rej) => showToastError(rej[0]?.reason || "File rejected")}
          />
        </div>

        <div>
          <label style={labelStyle}>Add reels (video files)</label>
          <Dropzone
            accept="video/*"
            multiple
            disabled={loading}
            label="Add reels"
            sublabel="or drag & drop here"
            onFiles={(files) => setReelFiles(files)}
            onReject={(rej) => showToastError(rej[0]?.reason || "File rejected")}
          />
        </div>
      </div>

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
          <span
            style={{
              fontSize: 12,
              opacity: 0.7,
              display: "flex",
              alignItems: "center",
              gap: 5,
              color: "#f5c542",
            }}
          >
            <span style={{ fontSize: 8 }}>●</span> Unsaved changes
          </span>
        )}
        {savedRecently && (
          <span
            style={{
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              gap: 5,
              color: "#6ee7b7",
              opacity: 0.9,
            }}
          >
            <span style={{ fontSize: 10 }}>✓</span> Uploaded
          </span>
        )}
        <button
          type="button"
          style={{
            ...datButtonLocal,
            ...(savedRecently
              ? { background: "rgba(52,211,153,0.25)", borderColor: "rgba(52,211,153,0.5)" }
              : {}),
          }}
          disabled={loading || (!albumFiles.length && !reelFiles.length)}
          onClick={() =>
            saveCategory({
              tag: "Media Upload",
              fieldKeys: [],
              uploadKinds: [
                ...(albumFiles.length ? (["album"] as UploadKind[]) : []),
                ...(reelFiles.length ? (["reel"] as UploadKind[]) : []),
              ],
            })
          }
        >
          {savedRecently ? "Uploaded ✓" : "Upload Staged Media"}
        </button>
      </div>
    </div>
  );
}
