// components/shared/ThumbnailMedia.tsx
"use client";

import React from "react";
import Image from "next/image";

interface ThumbnailMediaProps {
  imageUrl?: string;
  title?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export default function ThumbnailMedia({
  imageUrl,
  title,
  style,
  onClick,
}: ThumbnailMediaProps) {
  if (!imageUrl) return null;

  const trimmedUrl = imageUrl.trim().replace(/\s+/g, "");
  const cleanUrl = (() => {
    try {
      const parsed = new URL(trimmedUrl);
      // strip tracking params
      parsed.searchParams.forEach((_, key) => {
        if (key.toLowerCase().startsWith("utm") || key === "fbclid") {
          parsed.searchParams.delete(key);
        }
      });
      return parsed.toString();
    } catch {
      return trimmedUrl;
    }
  })();

  const base = cleanUrl.split("?")[0];
  const isImage = /\.(png|jpe?g|gif|webp|svg|heic|heif)$/i.test(base);
  const isVideoFile = /\.(mp4|webm|mov|ogg)$/i.test(base);
  const isAudio = /\.(mp3|wav|ogg)$/i.test(base) || cleanUrl.includes("soundcloud.com");
  const isYouTube = cleanUrl.includes("youtube.com") || cleanUrl.includes("youtu.be");
  const isVimeo = cleanUrl.includes("vimeo.com");

  const getYouTubeId = (url: string): string | null => {
    try {
      const u = new URL(url);
      if (u.hostname === "youtu.be") return u.pathname.slice(1);
      if (u.hostname.includes("youtube.com")) {
        const v = u.searchParams.get("v");
        if (v) return v;
        const parts = u.pathname.split("/");
        const i = parts.indexOf("shorts");
        if (i !== -1 && parts[i + 1]) return parts[i + 1];
      }
    } catch {}
    return null;
  };

  const isVideoOrAudio =
    isVideoFile || isAudio || isYouTube || isVimeo;

  const aspectRatio = isVideoOrAudio ? "16 / 9" : "1 / 1";

  const playOverlay = (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        display: "grid",
        placeItems: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 8,
          backgroundColor: "rgba(0,0,0,0.55)",
          display: "grid",
          placeItems: "center",
        }}
      >
        <svg viewBox="0 0 24 24" fill="white" width="20" height="20" style={{ marginLeft: 2 }}>
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
    </div>
  );

  const wrapperStyle: React.CSSProperties = {
    position: "relative",
    width: "100%",
    aspectRatio,
    overflow: "hidden",
    backgroundColor: "#eee",
    cursor: onClick ? "pointer" : "default",
    ...style,
  };

  const renderWrapper = (children: React.ReactNode, labelledBy?: string) =>
    onClick ? (
      <div style={wrapperStyle} onClick={onClick} aria-labelledby={labelledBy}>
        {children}
      </div>
    ) : (
      <div style={wrapperStyle} aria-labelledby={labelledBy}>
        {children}
      </div>
    );

  // YouTube → use thumb via next/image (requires i.ytimg.com in next.config)
  const youtubeId = getYouTubeId(cleanUrl);
  if (youtubeId) {
    const thumb = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
    const labelId = `yt-thumb-${youtubeId}`;
    return renderWrapper(
      <>
        <Image
          src={thumb}
          alt={title || "YouTube thumbnail"}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          priority={false}
        />
        {playOverlay}
        {/* hidden label target for a11y */}
        <span id={labelId} className="sr-only">
          {title || "YouTube video"}
        </span>
      </>,
      `yt-thumb-${youtubeId}`
    );
  }

  // Vimeo placeholder (no public thumb without API)
  if (isVimeo) {
    return renderWrapper(
      <>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            background: "#000",
            color: "#fff",
            fontSize: "0.8rem",
          }}
        >
          Vimeo
        </div>
        {playOverlay}
      </>
    );
  }

  // Audio placeholder
  if (isAudio) {
    return renderWrapper(
      <>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            background: "#f1f1f1",
            color: "#555",
            fontSize: "0.85rem",
          }}
        >
          Audio
        </div>
        {playOverlay}
      </>
    );
  }

  // Raw video file placeholder
  if (isVideoFile) {
    return renderWrapper(
      <>
        <div style={{ position: "absolute", inset: 0, background: "#000" }} />
        {playOverlay}
      </>
    );
  }

  // Static image → next/image
  if (isImage) {
    return renderWrapper(
      <Image
        src={cleanUrl}
        alt={title || "Story image"}
        fill
        className="object-cover"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        priority={false}
      />
    );
  }

  return null;
}
