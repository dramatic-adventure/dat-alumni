// components/shared/StoryMedia.tsx
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
  const raw = String(imageUrl || "").trim();

  // Keep existing behavior: remove whitespace that occasionally sneaks into URLs.
  const trimmedUrl = raw.replace(/\s+/g, "");

  const cleanUrl = (() => {
    if (!trimmedUrl) return "";
    try {
      const parsed = new URL(trimmedUrl);
      // strip tracking params (keep everything else intact)
      parsed.searchParams.forEach((_, key) => {
        const k = key.toLowerCase();
        if (k.startsWith("utm") || k === "fbclid") parsed.searchParams.delete(key);
      });
      return parsed.toString();
    } catch {
      // relative URLs (like "/_next/image?...") will land here
      return trimmedUrl;
    }
  })();

  if (!cleanUrl) return null;

  const baseUrl = cleanUrl.split("?")[0];
  const isRemote = /^https?:\/\//i.test(cleanUrl);

  const getPathname = (url: string): string | null => {
    try {
      // If we have a browser, support relative + absolute (important for /api/img and /_next/image)
      if (typeof window !== "undefined") {
        return new URL(url, window.location.origin).pathname;
      }
      // Server-side fallback: absolute only
      if (isRemote) return new URL(url).pathname;
      return null;
    } catch {
      return null;
    }
  };

  const pathname = getPathname(cleanUrl);

  // ✅ Must ALWAYS treat these as images, even when absolute.
  const isNextImageOptimized =
    cleanUrl.startsWith("/_next/image") || pathname === "/_next/image";

  const isApiImg = cleanUrl.startsWith("/api/img") || pathname === "/api/img";

  // Detect image URLs that don't end with an extension (e.g., Google Drive /uc, googleusercontent)
  const isLikelyImageNoExt = (() => {
    try {
      const u = new URL(cleanUrl);
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
      // relative URLs will land here
      return false;
    }
  })();

  const isImage =
    isApiImg ||
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
        return id ? `https://www.youtube.com/embed/${id}` : null;
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
        return id ? `https://player.vimeo.com/video/${id}` : null;
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
      : "popup-media w-full mx-auto my-4";

  // HARD clamp to prevent “oversized” layout explosions
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
          maxWidth: "min(92vw, 1100px)",
          height: "clamp(260px, 55vh, 620px)",
          margin: "0 auto",
        };

  const boxStyle: React.CSSProperties = {
    ...defaultBoxStyle,
    ...style,
    position: "relative",
    overflow: "hidden",
  };

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

  // 🖼 Images
  if (isImage) {
    // ✅ Requirement: always render /api/img?... and /_next/image?... as <img>, even when absolute.
    if (isApiImg || isNextImageOptimized) {
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

    // Everything else: keep existing next/image behavior.
    return (
      <div className={containerClass}>
        <div style={boxStyle}>
          <Image
            src={cleanUrl}
            alt={title || "Image"}
            fill
            className={
              mode === "lightbox"
                ? "object-contain"
                : "object-contain rounded-xl shadow-md"
            }
            sizes={
              mode === "lightbox"
                ? "90vw"
                : "(max-width: 640px) 92vw, (max-width: 1024px) 85vw, 1100px"
            }
            priority={mode === "lightbox"}
            unoptimized={!isRemote}
          />
        </div>
      </div>
    );
  }

  // 🔗 Fallback: clean link card (instead of returning null)
  const parseLinkMeta = (url: string) => {
    try {
      const u =
        typeof window !== "undefined"
          ? new URL(url, window.location.origin)
          : isRemote
          ? new URL(url)
          : null;

      if (!u) return { href: url, host: "", display: url };

      const host = u.hostname.replace(/^www\./i, "");
      const path = u.pathname && u.pathname !== "/" ? u.pathname : "";
      const display = `${host}${path}`;
      return { href: u.toString(), host, display };
    } catch {
      return { href: url, host: "", display: url };
    }
  };

  const linkMeta = parseLinkMeta(cleanUrl);

  return (
    <div className={containerClass}>
      <a
        href={linkMeta.href}
        target="_blank"
        rel="noreferrer noopener"
        className="block"
        style={{ textDecoration: "none" }}
        aria-label={title ? `Open link: ${title}` : "Open link"}
      >
        <div
          style={{
            ...defaultBoxStyle,
            height: mode === "lightbox" ? "auto" : undefined,
            padding: mode === "lightbox" ? 18 : 16,
            borderRadius: 16,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.14)",
            boxShadow: "0 10px 28px rgba(0,0,0,0.28)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            color: "rgba(255,255,255,0.92)",
            maxWidth: mode === "lightbox" ? "min(900px, 90vw)" : "min(1100px, 92vw)",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              fontSize: 12,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.65)",
              marginBottom: 10,
            }}
          >
            Link
          </div>

          <div
            style={{
              fontSize: mode === "lightbox" ? 18 : 16,
              fontWeight: 800,
              lineHeight: 1.2,
              marginBottom: 8,
              wordBreak: "break-word",
            }}
          >
            {title || linkMeta.host || "Open link"}
          </div>

          <div
            style={{
              fontSize: 14,
              color: "rgba(255,255,255,0.78)",
              wordBreak: "break-word",
            }}
          >
            {linkMeta.display}
          </div>

          <div
            style={{
              marginTop: 12,
              fontSize: 13,
              color: "rgba(255,204,0,0.92)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              fontWeight: 800,
            }}
          >
            Open →
          </div>
        </div>
      </a>
    </div>
  );
}
