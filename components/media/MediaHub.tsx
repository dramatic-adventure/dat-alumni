"use client";

import React from "react";
import Dropzone from "@/components/media/Dropzone";

type Kind = "headshot" | "album" | "reel" | "event";

type Props = {
  // files
  headshotFile: File | null;
  setHeadshotFile: (f: File | null) => void;

  albumFiles: File[];
  setAlbumFiles: (f: File[]) => void;

  reelFiles: File[];
  setReelFiles: (f: File[]) => void;

  eventFiles: File[];
  setEventFiles: (f: File[]) => void;

  // album/collection name
  albumName: string;
  setAlbumName: (s: string) => void;

  // actions
  uploading?: boolean;
  onUploadAll: () => void;
  onOpenPicker: (k: Kind) => void;
  onFeature: (k: Kind, idx: number) => void;
};

const TAB_ORDER: { key: Kind; label: string; blurb: string; accept: string; multiple: boolean; icon: string }[] = [
  {
    key: "headshot",
    label: "Headshots",
    blurb: "Your primary promotional image. Crop tight, high-resolution, single subject.",
    accept: "image/*",
    multiple: false,
    icon: "🖼️",
  },
  {
    key: "reel",
    label: "Reels",
    blurb: "Short clips or highlight reels that showcase your work. MP4 or MOV preferred.",
    accept: "video/*",
    multiple: true,
    icon: "🎬",
  },
  {
    key: "album",
    label: "Photo Gallery",
    blurb: "A named collection of production stills or process images. Add a collection name below.",
    accept: "image/*",
    multiple: true,
    icon: "🗂️",
  },
  {
    key: "event",
    label: "Events",
    blurb: "Event posters, flyers, or PDFs for shows and workshops.",
    accept: "image/*,application/pdf",
    multiple: true,
    icon: "📎",
  },
];

function SectionHeader({
  label,
  blurb,
  right,
}: {
  label: string;
  blurb: string;
  right?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        alignItems: "end",
        gap: 16,
        marginBottom: 12,
      }}
    >
      <div>
        <div
          style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "1.6rem",
            color: "#F2F2F2",
            marginBottom: 8,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontSize: 14,
            opacity: 0.9,
            color: "#F2F2F2",
          }}
        >
          {blurb}
        </div>
      </div>
      {right}
    </div>
  );
}

function Rail({
  files,
  kind,
  onRemove,
  onFeature,
}: {
  files: File[];
  kind: Kind;
  onRemove: (i: number) => void;
  onFeature: (i: number) => void;
}) {
  if (!files?.length) {
    return (
      <div
        style={{
          fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
          color: "rgba(255,255,255,0.8)",
          fontSize: 14,
          marginTop: 10,
        }}
      >
        Nothing staged yet—drop files above.
      </div>
    );
  }
  return (
    <div className="rail">
      {files.map((f, i) => {
        const isImage = f.type.startsWith("image/");
        const url = isImage ? URL.createObjectURL(f) : undefined;
        return (
          <div key={`${f.name}-${i}`} className="tile" style={{ position: "relative" }}>
            <div
              style={{
                position: "relative",
                paddingBottom: "62%",
                background: "rgba(255,255,255,0.06)",
              }}
            >
              {isImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={url}
                  alt={f.name}
                  onLoad={() => url && URL.revokeObjectURL(url)}
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "grid",
                    placeItems: "center",
                    fontSize: 32,
                    color: "#fff",
                    opacity: 0.85,
                  }}
                >
                  🎞️
                </div>
              )}
            </div>

            <div className="meta">
              <div
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                title={f.name}
              >
                {f.name}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                <button
                  type="button"
                  onClick={() => onFeature(i)}
                  style={{
                    borderRadius: 8,
                    padding: "4px 8px",
                    background: "rgba(108,0,175,0.85)",
                    color: "#fff",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Feature
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(i)}
                  style={{
                    borderRadius: 8,
                    padding: "4px 8px",
                    background: "rgba(242,51,89,0.85)",
                    color: "#fff",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function MediaHub({
  headshotFile,
  setHeadshotFile,
  albumFiles,
  setAlbumFiles,
  reelFiles,
  setReelFiles,
  eventFiles,
  setEventFiles,
  albumName,
  setAlbumName,
  uploading,
  onUploadAll,
  onOpenPicker,
  onFeature,
}: Props) {
  const [tab, setTab] = React.useState<Kind>("headshot");

  const onFiles = (k: Kind, files: File[]) => {
    if (k === "headshot") {
      setHeadshotFile(files[0] ?? null);
    } else if (k === "album") {
      setAlbumFiles([...(albumFiles || []), ...files]);
    } else if (k === "reel") {
      setReelFiles([...(reelFiles || []), ...files]);
    } else if (k === "event") {
      setEventFiles([...(eventFiles || []), ...files]);
    }
  };

  const stagedCount =
    (headshotFile ? 1 : 0) +
    (albumFiles?.length || 0) +
    (reelFiles?.length || 0) +
    (eventFiles?.length || 0);

  return (
    <div
      style={{
        background: "rgba(36, 17, 35, 0.35)",
        borderRadius: 16,
        padding: "1.25rem",
        color: "#fff",
      }}
    >
      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          marginBottom: 14,
        }}
      >
        {TAB_ORDER.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            style={{
              borderRadius: 999,
              padding: "8px 14px",
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              border: "1px solid rgba(255,255,255,0.25)",
              background:
                tab === t.key ? "rgba(108,0,175,0.9)" : "rgba(255,255,255,0.04)",
              color: "#fff",
              cursor: "pointer",
            }}
            aria-pressed={tab === t.key}
          >
            <span style={{ marginRight: 8 }} aria-hidden>
              {t.icon}
            </span>
            {t.label}
          </button>
        ))}

        <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={() => onOpenPicker(tab)}
            style={{
              borderRadius: 12,
              padding: "8px 12px",
              border: "1px solid rgba(255,255,255,0.35)",
              background: "transparent",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Choose existing…
          </button>
          <button
            type="button"
            disabled={!stagedCount || uploading}
            onClick={onUploadAll}
            style={{
              borderRadius: 14,
              padding: "10px 14px",
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontWeight: 700,
              background:
                "linear-gradient(180deg, rgba(217,169,25,0.95), rgba(108,0,175,0.95))",
              color: "#fff",
              border: "none",
              boxShadow: "0 8px 22px rgba(0,0,0,0.25)",
              cursor: stagedCount ? "pointer" : "not-allowed",
              opacity: stagedCount ? 1 : 0.6,
            }}
          >
            {uploading ? "Uploading…" : "Upload staged media"}
          </button>
        </div>
      </div>

      {/* Current tab header */}
      {TAB_ORDER.filter((t) => t.key === tab).map((t) => (
        <SectionHeader key={t.key} label={t.label} blurb={t.blurb} />
      ))}

      {/* Album name input (Photo Gallery tab only) */}
      {tab === "album" && (
        <div style={{ marginBottom: 12 }}>
          <label
            style={{
              display: "block",
              marginBottom: 6,
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              fontSize: 13,
              opacity: 0.85,
            }}
          >
            Album / Collection name
          </label>
          <input
            value={albumName}
            onChange={(e) => setAlbumName(e.target.value)}
            placeholder="e.g., 2024 Spring Production"
            style={{
              width: "100%",
              borderRadius: 10,
              padding: "12px 14px",
              outline: "none",
              border: "none",
              background: "#fff",
              color: "#111",
              boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            }}
          />
        </div>
      )}

      {/* Drop area */}
      {TAB_ORDER.filter((t) => t.key === tab).map((t) => (
        <div key={t.key} className="dropzone-root">
          <Dropzone
            accept={t.accept}
            multiple={t.multiple}
            onFiles={(files) => onFiles(t.key, files)}
            label={
              t.key === "headshot"
                ? "Drop a headshot or browse"
                : t.key === "album"
                ? "Drop images or browse"
                : t.key === "reel"
                ? "Drop videos or browse"
                : "Drop images/PDFs or browse"
            }
            aria-label={`Upload to ${t.label}`}
          />
        </div>
      ))}

      {/* Staged rails */}
      <div className="staged">
        {tab === "headshot" && (
          <>
            <div style={{ marginTop: 16, fontFamily: "var(--font-dm-sans), system-ui, sans-serif" }}>
              {headshotFile ? (
                <Rail
                  files={[headshotFile]}
                  kind="headshot"
                  onRemove={() => setHeadshotFile(null)}
                  onFeature={(i) => onFeature("headshot", i)}
                />
              ) : (
                <div
                  style={{
                    color: "rgba(255,255,255,0.8)",
                    fontSize: 14,
                    marginTop: 10,
                  }}
                >
                  Nothing staged yet—drop a headshot above.
                </div>
              )}
            </div>
          </>
        )}

        {tab === "album" && (
          <Rail
            files={albumFiles}
            kind="album"
            onRemove={(i) => {
              const next = [...albumFiles];
              next.splice(i, 1);
              setAlbumFiles(next);
            }}
            onFeature={(i) => onFeature("album", i)}
          />
        )}

        {tab === "reel" && (
          <Rail
            files={reelFiles}
            kind="reel"
            onRemove={(i) => {
              const next = [...reelFiles];
              next.splice(i, 1);
              setReelFiles(next);
            }}
            onFeature={(i) => onFeature("reel", i)}
          />
        )}

        {tab === "event" && (
          <Rail
            files={eventFiles}
            kind="event"
            onRemove={(i) => {
              const next = [...eventFiles];
              next.splice(i, 1);
              setEventFiles(next);
            }}
            onFeature={(i) => onFeature("event", i)}
          />
        )}
      </div>
    </div>
  );
}
