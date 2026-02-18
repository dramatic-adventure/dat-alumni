"use client";

import type { CSSProperties } from "react";

import Dropzone from "@/components/media/Dropzone";
import ProfileStudio, { Field, ghostButton as studioGhostButton } from "@/components/alumni/update/ProfileStudio";

type StudioTab = "basics" | "identity" | "media" | "contact" | "story" | "event";
type UploadKind = "headshot" | "album" | "reel" | "event";

type MediaPanelProps = {
  explainStyleLocal: CSSProperties;
  inputStyle: CSSProperties;
  datButtonLocal: CSSProperties;

  loading: boolean;

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
  inputStyle,
  datButtonLocal,
  loading,
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
  return (
    <div>
      <div id="studio-media-anchor" />
      <p style={explainStyleLocal}>
        Albums + reels live here. You’re choosing placement before uploading.
      </p>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
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

      <div style={{ display: "grid", gap: 12 }}>
        <Field label="Album name (optional)">
          <input
            value={albumName || ""}
            onChange={(e) => setAlbumName(e.target.value)}
            style={inputStyle}
            placeholder="e.g. Production photos, BTS, PASSAGE…"
          />
        </Field>

        <Field label="Add photos to album">
          <Dropzone
            accept="image/*"
            multiple
            disabled={loading}
            label="Add photos to album"
            sublabel="or drag & drop here"
            onFiles={(files) => setAlbumFiles(files)}
            onReject={(rej) => showToastError(rej[0]?.reason || "File rejected")}
          />
        </Field>

        <Field label="Add reels (video files)">
          <Dropzone
            accept="video/*"
            multiple
            disabled={loading}
            label="Add reels"
            sublabel="or drag & drop here"
            onFiles={(files) => setReelFiles(files)}
            onReject={(rej) => showToastError(rej[0]?.reason || "File rejected")}
          />
        </Field>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
        <button
          type="button"
          style={datButtonLocal}
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
          Upload Staged Media
        </button>
      </div>
    </div>
  );
}
