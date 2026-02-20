// StoryMedia.tsx
"use client";

/* eslint-disable @next/next/no-img-element */

import React from "react";
import Image from "next/image";

interface StoryMediaProps {
  imageUrl?: string;
  title?: string;
  style?: React.CSSProperties;
  mode?: "default" | "lightbox";
}

export default function StoryMedia({
  imageUrl,
  title,
  style,
  mode = "default",
}: StoryMediaProps) {
  if (!imageUrl) return null;

  const trimmedUrl = imageUrl.trim().replace(/\s+/g, "");

  const cleanUrl = (() => {
    try {
      // ✅ allow relative URLs like /api/img?... and /_next/image?...
      const parsed = new URL(trimmedUrl, "http://local");

      // strip tracking params
      parsed.searchParams.forEach((_, key) => {
        const k = key.toLowerCase();
        if (k.startsWith("utm") || k === "fbclid") parsed.searchParams.delete(key);
      });

      const isLocal = parsed.origin === "http://local";

      // ✅ keep locals as relative paths (don’t leak dummy origin)
      if (isLocal) {
        const qs = parsed.searchParams.toString();
        return parsed.pathname + (qs ? `?${qs}` : "");
      }

      // ✅ remote stays fully qualified
      return parsed.toString();
    } catch {
      return trimmedUrl;
    }
  })();


  const baseUrl = cleanUrl.split("?")[0];
  const isRemote = /^https?:\/\//i.test(cleanUrl);

  // ✅ Next.js image optimizer output (relative URL, no file extension)
  const isNextImageOptimized = cleanUrl.startsWith("/_next/image");

  // Detect image URLs that don't end with an extension (e.g., Google Drive /uc, googleusercontent)
  const isLikelyImageNoExt = (() => {
    try {
      const u = new URL(cleanUrl, "http://local");

      // ✅ our local proxy endpoints are images (no file extension)
      if (u.origin === "http://local") {
        return u.pathname.startsWith("/api/img") || u.pathname.startsWith("/api/media/thumb");
      }

      const host = u.hostname;

      const isDriveUc =
        host === "drive.google.com" &&
        (u.pathname === "/uc" ||
          u.pathname.startsWith("/uc/") ||
          u.pathname.startsWith("/thumbnail")) &&
        (u.searchParams.has("id") || u.searchParams.has("export"));

      const isGoogleUserContent = host.endsWith("googleusercontent.com");

      return isDriveUc || isGoogleUserContent;
    } catch {
      return false;
    }
  })();

  const isImage =
    isNextImageOptimized ||
    /\.(png|jpe?g|gif|webp|svg|heic|heif)$/i.test(baseUrl) ||
    isLikelyImageNoExt;

  const isVideoFile = /\.(mp4|webm|mov|ogg)$/i.test(baseUrl);

  const isAudio =
    /\.(mp3|wav|ogg)$/i.test(baseUrl) || cleanUrl.includes("soundcloud.com");

  const getEmbedUrl = (url: string): string | null => {
    try {
      const parsed = new URL(url);
      const host = parsed.hostname;

      if (host.includes("youtu.be")) {
        const id = parsed.pathname.slice(1);
        return `https://www.youtube.com/embed/${id}`;
      }
      if (host.includes("youtube.com")) {
        const id = parsed.searchParams.get("v");
        if (id) return `https://www.youtube.com/embed/${id}`;
        const parts = parsed.pathname.split("/");
        const shortId = parts.includes("shorts")
          ? parts[parts.indexOf("shorts") + 1]
          : null;
        if (shortId) return `https://www.youtube.com/embed/${shortId}`;
      }
      if (host.includes("vimeo.com")) {
        const id = parsed.pathname.split("/")[1];
        return `https://player.vimeo.com/video/${id}`;
      }
      if (host.includes("drive.google.com")) {
        const match = parsed.pathname.match(/\/d\/(.+?)\//);
        if (match?.[1]) return `https://drive.google.com/file/d/${match[1]}/preview`;
      }
      if (host.includes("dropbox.com")) {
        return url
          .replace("www.dropbox.com", "dl.dropboxusercontent.com")
          .replace("?dl=0", "");
      }
      return null;
    } catch {
      return null;
    }
  };

  const requestFullscreen = (element: HTMLElement | null) => {
    if (!element) return;
    if (element.requestFullscreen) element.requestFullscreen();
    else if ((element as any).webkitRequestFullscreen)
      (element as any).webkitRequestFullscreen();
    else if ((element as any).mozRequestFullScreen)
      (element as any).mozRequestFullScreen();
    else if ((element as any).msRequestFullscreen)
      (element as any).msRequestFullscreen();
  };

  const containerClass =
    mode === "lightbox"
      ? "popup-media text-center"
      : "popup-media w-full my-4"; // ✅ remove mx-auto (centering often pairs with max-width rules)


  // ✅ Default: fill parent container width; parent controls padding
  const defaultBoxStyle: React.CSSProperties =
    mode === "lightbox"
      ? {
          width: "90vw",
          height: "90vh",
          maxWidth: "1600px",
          maxHeight: "90vh",
          margin: "0 auto",
        }
      : {
          width: "100%",
          maxWidth: "100%",
          aspectRatio: "16 / 9",     // ✅ gives stable layout
          maxHeight: "70vh",         // ✅ prevents absurdly tall on large screens
          margin: 0,
        };



  const boxStyle: React.CSSProperties = {
    ...defaultBoxStyle,
    ...style,
    position: "relative",
    overflow: "hidden",
  };

  // ✅ IMPORTANT: use the original URL and let next/image handle remote optimization
  // (except when it's already a "/_next/image?..." URL; see image block below)
  const imgSrc = cleanUrl;

  // 🎧 Audio
  if (isAudio) {
    return (
      <div className={containerClass}>
        <audio
          controls
          className="w-full rounded-xl shadow-md"
          title={title || "Audio player"}
          aria-label={title || "Audio player"}
        >
          <source src={cleanUrl} />
          Your browser does not support the audio element.
        </audio>
      </div>
    );
  }

  // ▶️ Embedded Videos
  const embedUrl = getEmbedUrl(cleanUrl);
  if (embedUrl) {
    if (mode === "lightbox") {
      return (
        <div
          className="flex justify-center items-center w-full h-full px-0 z-[100]"
          style={{ position: "relative" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="z-[100]"
            style={{
              maxWidth: "1400px",
              width: "80vw",
              height: "calc(80vw * 9 / 16)",
              maxHeight: "90vh",
              margin: "0 auto",
            }}
          >
            <iframe
              src={embedUrl}
              title={title || "Embedded video"}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ border: "none", display: "block" }}
              aria-label={title || "Embedded video"}
            />
          </div>
        </div>
      );
    }

    return (
      <div className={containerClass}>
        <iframe
          title={title || "Embedded Video"}
          src={embedUrl}
          allowFullScreen
          loading="lazy"
          className="w-full aspect-video rounded-xl shadow-md min-h-[300px] sm:min-h-[400px] lg:min-h-[480px]"
          style={{ border: "none", display: "block" }}
          aria-label={title || "Embedded video"}
        />
      </div>
    );
  }

  // 🎬 Raw video files
  if (isVideoFile) {
    return mode === "lightbox" ? (
      <div className="flex justify-center items-center w-full h-full">
        <video
          src={cleanUrl}
          controls
          autoPlay
          className="rounded-lg shadow-lg"
          style={{
            width: "90vw",
            maxWidth: "1600px",
            aspectRatio: "16 / 9",
            objectFit: "contain",
            backgroundColor: "#000",
          }}
          title={title}
        />
      </div>
    ) : (
      <div className={containerClass}>
        <video
          src={cleanUrl}
          controls
          className="w-full shadow-md rounded-lg"
          style={{ maxHeight: "90vh", ...style }}
          onClick={(e) => requestFullscreen(e.currentTarget)}
          title={title}
        />
      </div>
    );
  }

  // 🖼 Images (local + remote via next/image)
  if (isImage) {
    // ✅ If we're already looking at Next's optimized image URL, render it directly.
    // Avoids double-optimizing and fixes "blank swipe" when Lightbox receives "/_next/image?..."
    if (isNextImageOptimized) {
      return (
        <div className={containerClass}>
          <div style={boxStyle}>
            <img
              src={cleanUrl}
              alt={title || "Image"}
              loading={mode === "lightbox" ? "eager" : "lazy"}
              decoding="async"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                borderRadius: mode === "lightbox" ? 0 : 16,
              }}
            />
          </div>
        </div>
      );
    }

    return (
      <div className={containerClass} style={{ width: "100%", maxWidth: "100%" }}>
        <div style={{ ...boxStyle, width: "100%", maxWidth: "100%" }}>
          <Image
            src={imgSrc}
            alt={title || "Image"}
            fill
            className={
              mode === "lightbox"
                ? "object-contain"
                : "object-cover rounded-xl shadow-md"
            }
            sizes={
              mode === "lightbox"
                ? "90vw"
                : "(max-width: 640px) 92vw, (max-width: 1024px) 85vw, 1100px"
            }
            priority={mode === "lightbox"}
          />
        </div>
      </div>
    );
  }

  return null;
}
