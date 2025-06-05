import React from "react";

interface StoryMediaProps {
  imageUrl?: string;
  title?: string;
}

export default function StoryMedia({ imageUrl, title }: StoryMediaProps) {
  if (!imageUrl) return null;

  // Clean the URL
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

  // Media type helpers
  const isImage = (url: string) => /\.(png|jpe?g|gif|webp|svg|heic|heif)$/i.test(url.split("?")[0]);
  const isVideoFile = (url: string) => /\.(mp4|webm|mov|ogg)$/i.test(url.split("?")[0]);
  const isAudio = (url: string) =>
    /\.(mp3|wav|ogg)$/i.test(url.split("?")[0]) || url.includes("soundcloud.com");

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
        const shortId = parts.includes("shorts") ? parts[parts.indexOf("shorts") + 1] : null;
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

  // Render media by type
  if (isAudio(cleanUrl)) {
    return (
      <div className="popup-media w-full max-w-3xl mx-auto my-4">
        <audio controls className="w-full rounded-xl shadow-md">
          <source src={cleanUrl} />
          Your browser does not support the audio element.
        </audio>
      </div>
    );
  }

  const embedUrl = getEmbedUrl(cleanUrl);
  if (embedUrl) {
    return (
      <div className="popup-media">
        <iframe
          title={title || "Embedded Video"}
          src={embedUrl}
          allowFullScreen
          loading="lazy"
          className="w-full max-w-3xl aspect-video min-h-[300px] sm:min-h-[400px] lg:min-h-[480px] rounded-xl shadow-md"
        />
      </div>
    );
  }

  if (isVideoFile(cleanUrl)) {
    return (
      <div className="popup-media">
        <video
          src={cleanUrl}
          controls
          className="w-full max-w-3xl rounded-xl shadow-md"
        >
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  if (isImage(cleanUrl)) {
    return (
      <div className="popup-media">
        <img
          src={cleanUrl}
          alt={title || "Story Image"}
          loading="lazy"
          decoding="async"
          className="w-full max-w-3xl rounded-xl shadow-md"
        />
      </div>
    );
  }

  return null;
}
