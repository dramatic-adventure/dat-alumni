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

const TAB_ORDER: {
  key: Kind;
  label: string;
  blurb: string;
  accept: string;
  multiple: boolean;
  icon: string;
}[] = [
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

// ------------------------------------------------------------
// Minimal style system (composer-aligned; single low-opacity dark module)
// ------------------------------------------------------------
const HUB = {
  // one module background, lighter + calmer
  bg: "rgba(36, 17, 35, 0.22)",
  border: "rgba(255,255,255,0.10)",
  borderStrong: "rgba(255,255,255,0.16)",
  wash2: "rgba(255,255,255,0.03)",
  washHover: "rgba(255,255,255,0.065)",
  ink: "rgba(255,255,255,0.92)",
  inkSoft: "rgba(255,255,255,0.78)",
  inkFaint: "rgba(255,255,255,0.55)",
  grape: "#6C00AF",
  rose: "#F23359",
};

const hubText: React.CSSProperties = {
  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
  letterSpacing: "0.01em",
};

const hubTitle: React.CSSProperties = {
  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
  letterSpacing: "0.02em",
};

const btnBase: React.CSSProperties = {
  ...hubTitle,
  borderRadius: 999,
  padding: "8px 12px",
  border: `1px solid ${HUB.border}`,
  background: HUB.wash2,
  color: HUB.inkSoft,
  cursor: "pointer",
  userSelect: "none",
  textDecoration: "none",
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: "0.02em",
  transition:
    "transform 120ms ease, opacity 120ms ease, background 120ms ease, border-color 120ms ease, filter 120ms ease, box-shadow 120ms ease",
};

const btnPrimary: React.CSSProperties = {
  ...btnBase,
  borderRadius: 999,
  padding: "8px 12px",
  border: `1px solid ${HUB.borderStrong}`,
  background: "rgba(255,255,255,0.045)",
  color: HUB.inkSoft,
};

const btnAccent: React.CSSProperties = {
  ...btnBase,
  borderRadius: 999,
  padding: "8px 14px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(108,0,175,0.70)",
  color: "rgba(242,242,242,0.98)",
  fontWeight: 800,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  textIndent: "0.14em",
  boxShadow: "0 12px 26px rgba(0,0,0,0.18)",
};

const btnDanger: React.CSSProperties = {
  ...btnBase,
  borderRadius: 999,
  padding: "6px 10px",
  border: "1px solid rgba(242,51,89,0.30)",
  background: "rgba(242,51,89,0.10)",
  color: "rgba(255,255,255,0.86)",
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  textIndent: "0.06em",
};

const btnFeature: React.CSSProperties = {
  ...btnBase,
  borderRadius: 999,
  padding: "6px 10px",
  border: "1px solid rgba(108,0,175,0.38)",
  background: "rgba(108,0,175,0.16)",
  color: "rgba(255,255,255,0.86)",
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  textIndent: "0.06em",
};

const cardInset: React.CSSProperties = {
  // no second dark block; just a quiet outline + spacing container
  background: "transparent",
  border: `1px solid ${HUB.border}`,
  borderRadius: 14,
};

const inputDark: React.CSSProperties = {
  ...hubText,
  width: "100%",
  borderRadius: 12,
  padding: "12px 14px",
  outline: "none",
  border: `1px solid ${HUB.border}`,
  background: "rgba(255,255,255,0.06)",
  color: HUB.ink,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
};

// ------------------------------------------------------------

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
        marginBottom: 10,
      }}
    >
      <div>
        <div
          style={{
            ...hubTitle,
            fontSize: "1.05rem",
            color: HUB.ink,
            marginBottom: 6,
            fontWeight: 800,
          }}
        >
          {label}
        </div>
        <div
          style={{
            ...hubText,
            fontSize: 13,
            color: HUB.inkSoft,
            lineHeight: 1.35,
          }}
        >
          {blurb}
        </div>

        <div
          style={{
            ...hubText,
            marginTop: 8,
            fontSize: 12,
            color: HUB.inkFaint,
            lineHeight: 1.25,
          }}
        >
          Select a media type above, stage files here, then upload when ready.
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
      <div style={{ ...hubText, color: HUB.inkFaint, fontSize: 13, marginTop: 10 }}>
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
                background: "rgba(255,255,255,0.035)",
                border: `1px solid ${HUB.border}`,
                borderRadius: 12,
                overflow: "hidden",
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

            <div className="meta" style={{ ...hubText, color: HUB.inkSoft }}>
              <div
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  fontSize: 13,
                  opacity: 0.92,
                }}
                title={f.name}
              >
                {f.name}
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => onFeature(i)}
                  style={btnFeature}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = "0.96";
                    e.currentTarget.style.background = "rgba(108,0,175,0.22)";
                    e.currentTarget.style.borderColor = "rgba(108,0,175,0.46)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = "1";
                    e.currentTarget.style.background = "rgba(108,0,175,0.16)";
                    e.currentTarget.style.borderColor = "rgba(108,0,175,0.38)";
                    e.currentTarget.style.transform = "translateY(0px)";
                  }}
                  onMouseDown={(e) => (e.currentTarget.style.transform = "translateY(1px)")}
                  onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(0px)")}
                >
                  Feature
                </button>

                <button
                  type="button"
                  onClick={() => onRemove(i)}
                  style={btnDanger}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = "0.96";
                    e.currentTarget.style.background = "rgba(242,51,89,0.14)";
                    e.currentTarget.style.borderColor = "rgba(242,51,89,0.36)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = "1";
                    e.currentTarget.style.background = "rgba(242,51,89,0.10)";
                    e.currentTarget.style.borderColor = "rgba(242,51,89,0.30)";
                    e.currentTarget.style.transform = "translateY(0px)";
                  }}
                  onMouseDown={(e) => (e.currentTarget.style.transform = "translateY(1px)")}
                  onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(0px)")}
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
        background: HUB.bg,
        border: `1px solid ${HUB.border}`,
        borderRadius: 18,
        padding: "1.25rem",
        color: HUB.ink,
        boxShadow: "0 16px 40px rgba(0,0,0,0.18)",
      }}
    >
      {/* Tabs + picker */}
      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          marginBottom: 12,
          alignItems: "center",
        }}
      >
        {TAB_ORDER.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            style={{
              ...btnBase,
              background: tab === t.key ? "rgba(255,255,255,0.07)" : HUB.wash2,
              border:
                tab === t.key
                  ? "1px solid rgba(255,255,255,0.22)"
                  : `1px solid ${HUB.border}`,
              color: tab === t.key ? "rgba(255,255,255,0.95)" : HUB.inkSoft,
              boxShadow: tab === t.key ? "0 10px 22px rgba(0,0,0,0.14)" : "none",
            }}
            onMouseEnter={(e) => {
              if (tab === t.key) {
                e.currentTarget.style.background = "rgba(255,255,255,0.085)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.26)";
                e.currentTarget.style.opacity = "0.98";
                return;
              }
              e.currentTarget.style.background = HUB.washHover;
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.16)";
              e.currentTarget.style.opacity = "0.96";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
              e.currentTarget.style.background =
                tab === t.key ? "rgba(255,255,255,0.07)" : HUB.wash2;
              e.currentTarget.style.borderColor =
                tab === t.key ? "rgba(255,255,255,0.22)" : HUB.border;
              e.currentTarget.style.transform = "translateY(0px)";
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = "translateY(1px)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(0px)")}
            aria-pressed={tab === t.key}
          >
            <span
              style={{ marginRight: 8, opacity: tab === t.key ? 0.95 : 0.85 }}
              aria-hidden
            >
              {t.icon}
            </span>
            {t.label}
          </button>
        ))}

        <div style={{ marginLeft: "auto", display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => onOpenPicker(tab)}
            style={btnPrimary}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.98";
              e.currentTarget.style.background = "rgba(255,255,255,0.06)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)";
              e.currentTarget.style.boxShadow = "0 10px 22px rgba(0,0,0,0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
              e.currentTarget.style.background = "rgba(255,255,255,0.045)";
              e.currentTarget.style.borderColor = HUB.borderStrong;
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.transform = "translateY(0px)";
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = "translateY(1px)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(0px)")}
          >
            Choose existing…
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
              ...hubText,
              display: "block",
              marginBottom: 6,
              fontSize: 12,
              color: HUB.inkFaint,
            }}
          >
            Album / Collection name
          </label>

          <input
            value={albumName}
            onChange={(e) => setAlbumName(e.target.value)}
            placeholder="e.g., 2024 Spring Production"
            style={inputDark}
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
      <div style={{ ...cardInset, padding: 12, marginTop: 14 }}>
        <div className="staged">
          {tab === "headshot" && (
            <div style={{ marginTop: 4 }}>
              {headshotFile ? (
                <Rail
                  files={[headshotFile]}
                  kind="headshot"
                  onRemove={() => setHeadshotFile(null)}
                  onFeature={(i) => onFeature("headshot", i)}
                />
              ) : (
                <div style={{ ...hubText, color: HUB.inkFaint, fontSize: 13, marginTop: 10 }}>
                  Nothing staged yet—drop a headshot above.
                </div>
              )}
            </div>
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

      {/* Upload action (bottom right, after staging) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginTop: 12,
        }}
      >
        <div style={{ ...hubText, fontSize: 12, color: HUB.inkFaint, lineHeight: 1.25 }}>
          {stagedCount ? (
            <>
              Staged: <span style={{ color: HUB.inkSoft, fontVariantNumeric: "tabular-nums" }}>{stagedCount}</span>{" "}
              {stagedCount === 1 ? "file" : "files"} — review above, then upload.
            </>
          ) : (
            <>Nothing staged yet — choose a tab, then drop files above.</>
          )}
        </div>

        <button
          type="button"
          disabled={!stagedCount || uploading}
          onClick={onUploadAll}
          style={{
            ...btnAccent,
            cursor: stagedCount && !uploading ? "pointer" : "not-allowed",
            opacity: stagedCount && !uploading ? 1 : 0.55,
            transform: "translateY(0px)",
            background:
              stagedCount && !uploading ? "rgba(108,0,175,0.72)" : "rgba(108,0,175,0.52)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = stagedCount && !uploading ? "0.96" : "0.55";
            if (stagedCount && !uploading) {
              e.currentTarget.style.filter = "brightness(1.06)";
              e.currentTarget.style.boxShadow = "0 14px 28px rgba(0,0,0,0.16)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = stagedCount && !uploading ? "1" : "0.55";
            e.currentTarget.style.filter = "none";
            e.currentTarget.style.boxShadow = "0 12px 26px rgba(0,0,0,0.18)";
            e.currentTarget.style.transform = "translateY(0px)";
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = "translateY(1px)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(0px)")}
        >
          {uploading ? "Uploading…" : "Upload staged media"}
        </button>
      </div>
    </div>
  );
}
