"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";

type MediaCardProps = {
  file?: File;               // local staged file (preview)
  kind: "headshot" | "album" | "reel" | "event";
  label?: string;
  onSetFeatured?: () => void;
  onRemove?: () => void;
  onOpenPicker?: () => void;
  ariaLabel?: string;
};

export default function MediaCard({
  file,
  kind,
  label,
  onSetFeatured,
  onRemove,
  onOpenPicker,
  ariaLabel,
}: MediaCardProps) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) return;
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  // basic type deduction for local previews
  const mime = (file?.type || "").toLowerCase();
  const isImg = mime.startsWith("image/");
  const isVid = mime.startsWith("video/");
  const isPdf = mime === "application/pdf";

  const titleText = label || file?.name || kind;

  return (
    <div
      className="media-card"
      role="button"
      aria-label={ariaLabel || titleText}
      tabIndex={0}
      style={{
        width: 280,
        aspectRatio: "16 / 9",
        borderRadius: 16,
        overflow: "hidden",
        position: "relative",
        boxShadow: "0 18px 55px rgba(0,0,0,0.33)",
        transform: "translateZ(0)",
      }}
    >
      {/* Poster */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.10)",
        }}
      >
        {isImg && url && (
          <div className="relative w-full h-full">
            <Image
              src={url}
              alt={titleText}
              fill
              sizes="280px"
              className="object-cover"
              decoding="async"
              // blob:/data: previews must be unoptimized
              unoptimized
              draggable={false}
            />
          </div>
        )}

        {isVid && url && (
          <video
            src={url}
            muted
            playsInline
            preload="metadata"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        )}

        {isPdf && (
          <div
            style={{
              width: "100%",
              height: "100%",
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02))",
              display: "grid",
              placeItems: "center",
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: 20,
              color: "#fff",
            }}
          >
            PDF
          </div>
        )}

        {!file && (
          <div
            style={{
              width: "100%",
              height: "100%",
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
              display: "grid",
              placeItems: "center",
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: 16,
              color: "#fff",
            }}
          >
            Empty
          </div>
        )}
      </div>

      {/* Gradient overlay */}
      <div
        className="media-card__overlay"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.0) 48%, rgba(0,0,0,0.7) 100%)",
          opacity: 0.0,
          transition: "opacity .2s ease",
          pointerEvents: "none",
        }}
      />

      {/* Caption + actions */}
      <div
        className="media-card__meta"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          padding: "10px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: 14,
            color: "#fff",
            textShadow: "0 2px 12px rgba(0,0,0,0.6)",
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            maxWidth: "65%",
          }}
          title={titleText}
        >
          {titleText}
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          {onSetFeatured && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSetFeatured();
              }}
              className="media-ghost"
            >
              Feature
            </button>
          )}
          {onOpenPicker && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenPicker();
              }}
              className="media-ghost"
            >
              Library
            </button>
          )}
          {onRemove && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="media-ghost danger"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {/* hover styles */}
      <style jsx>{`
        .media-card:hover .media-card__overlay,
        .media-card:focus .media-card__overlay {
          opacity: 1;
        }
        .media-ghost {
          border: 1px solid rgba(255, 255, 255, 0.45);
          background: rgba(0, 0, 0, 0.18);
          color: #fff;
          font-size: 12px;
          padding: 6px 8px;
          border-radius: 8px;
          cursor: pointer;
        }
        .media-ghost.danger {
          border-color: rgba(242, 51, 89, 0.7);
          background: rgba(242, 51, 89, 0.18);
        }
      `}</style>
    </div>
  );
}
