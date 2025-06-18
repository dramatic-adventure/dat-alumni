"use client";

import React from "react";

interface ThumbnailMediaProps {
  imageUrl?: string;
  title?: string;
}

export default function ThumbnailMedia({ imageUrl, title }: ThumbnailMediaProps) {
  if (!imageUrl) return null;

  const trimmedUrl = imageUrl.trim().replace(/\s+/g, "");
  const cleanUrl = (() => {
    try {
      const parsed = new URL(trimmedUrl);
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

  const isImage = (url: string) =>
    /\.(png|jpe?g|gif|webp|svg|heic|heif)$/i.test(url.split("?")[0]);
  const isVideoFile = (url: string) =>
    /\.(mp4|webm|mov|ogg)$/i.test(url.split("?")[0]);
  const isAudio = (url: string) =>
    /\.(mp3|wav|ogg)$/i.test(url.split("?")[0]) || url.includes("soundcloud.com");

  const isYouTube = (url: string) =>
    url.includes("youtube.com") || url.includes("youtu.be");
  const isVimeo = (url: string) => url.includes("vimeo.com");

  const getYouTubeId = (url: string): string | null => {
    try {
      const parsed = new URL(url);
      if (parsed.hostname === "youtu.be") {
        return parsed.pathname.slice(1);
      }
      if (parsed.hostname.includes("youtube.com")) {
        const id = parsed.searchParams.get("v");
        if (id) return id;
        const parts = parsed.pathname.split("/");
        const shortId = parts.includes("shorts") ? parts[parts.indexOf("shorts") + 1] : null;
        if (shortId) return shortId;
      }
    } catch {}
    return null;
  };

  const getVimeoId = (url: string): string | null => {
    try {
      const match = url.match(/vimeo\.com\/(\d+)/);
      return match?.[1] || null;
    } catch {
      return null;
    }
  };

  const playOverlay = (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "36px",
        height: "36px",
        borderRadius: "50%",
        backgroundColor: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="white"
        width="20"
        height="20"
        style={{ marginLeft: "2px" }}
      >
        <path d="M8 5v14l11-7z" />
      </svg>
    </div>
  );

  // YouTube thumbnail
  const youtubeId = getYouTubeId(cleanUrl);
  if (youtubeId) {
    const thumb = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
    return (
      <div style={wrapperStyle}>
        <img src={thumb} alt={title || "YouTube thumbnail"} style={mediaStyle} />
        {playOverlay}
      </div>
    );
  }

  // Vimeo fallback
  if (isVimeo(cleanUrl)) {
    return (
      <div style={wrapperStyle}>
        <div
          style={{
            ...mediaStyle,
            backgroundColor: "#000",
            color: "#fff",
            fontSize: "0.7rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          Vimeo
        </div>
        {playOverlay}
      </div>
    );
  }

  // Audio fallback
  if (isAudio(cleanUrl)) {
    return (
      <div style={wrapperStyle}>
        <div
          style={{
            ...mediaStyle,
            backgroundColor: "#f1f1f1",
            color: "#555",
            fontSize: "0.8rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          Audio
        </div>
        {playOverlay}
      </div>
    );
  }

  // Video file fallback
  if (isVideoFile(cleanUrl)) {
    return (
      <div style={wrapperStyle}>
        <div
          style={{
            ...mediaStyle,
            backgroundColor: "#000",
          }}
        />
        {playOverlay}
      </div>
    );
  }

  // Static Image
  if (isImage(cleanUrl)) {
    return (
      <div style={wrapperStyle}>
        <img src={cleanUrl} alt={title || "Story image"} style={mediaStyle} />
      </div>
    );
  }

  return null;
}

// 🔧 Shared styles
const wrapperStyle: React.CSSProperties = {
  position: "relative",
  width: "100%",
  aspectRatio: "16/9",
  overflow: "hidden",
  borderRadius: "6px",
  backgroundColor: "#eee",
};

const mediaStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};
