export {}; // ✅ ensure ES module scope
import React from "react";

interface StoryMediaProps {
  imageUrl?: string;
  title?: string;
  style?: React.CSSProperties;
  mode?: "default" | "lightbox"; // 🔄 new prop
}

export default function StoryMedia({ imageUrl, title, style, mode = "default" }: StoryMediaProps) {
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

  const requestFullscreen = (element: HTMLElement | null) => {
    if (!element) return;
    if (element.requestFullscreen) element.requestFullscreen();
    else if ((element as any).webkitRequestFullscreen) (element as any).webkitRequestFullscreen();
    else if ((element as any).mozRequestFullScreen) (element as any).mozRequestFullScreen();
    else if ((element as any).msRequestFullscreen) (element as any).msRequestFullscreen();
  };

  const containerClass = mode === "lightbox" ? "popup-media text-center" : "popup-media w-full max-w-3xl mx-auto my-4";
  const sharedStyle: React.CSSProperties = {
    maxHeight: "90vh",
    ...style,
  };

  if (isAudio(cleanUrl)) {
    return (
      <div className={containerClass}>
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
      <div className={containerClass}>
        <iframe
  title={title || "Embedded Video"}
  src={embedUrl}
  allowFullScreen
  loading="lazy"
  className={`rounded-xl shadow-md ${
    mode === "lightbox"
      ? "w-full max-w-[96vw] h-auto aspect-video"
      : "w-full aspect-video min-h-[300px] sm:min-h-[400px] lg:min-h-[480px]"
  }`}
/>


      </div>
    );
  }

  if (isVideoFile(cleanUrl)) {
  return (
    <div className={containerClass}>
      <video
        src={cleanUrl}
        controls
        autoPlay={mode === "lightbox"} // ✅ only autoplay in lightbox
        className={`w-full ${mode === "lightbox" ? "object-contain" : ""} shadow-md cursor-pointer`}
        style={{ ...sharedStyle, backgroundColor: "#000" }}
        onClick={(e) => requestFullscreen(e.currentTarget)}
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
}


  if (isImage(cleanUrl)) {
  return (
    <div className={containerClass}>
      <img
        src={cleanUrl}
        alt={title || "Story Image"}
        loading="lazy"
        decoding="async"
        className={`w-full ${mode === "lightbox" ? "object-contain" : ""} shadow-md`}
        style={sharedStyle}
        // ⛔️ no onClick in lightbox mode
        onClick={
          mode === "lightbox" ? undefined : (e) => requestFullscreen(e.currentTarget)
        }
      />
    </div>
  );
}


  return null;
}
