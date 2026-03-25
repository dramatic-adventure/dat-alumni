// components/productions/QuoteBand.tsx
"use client";

import Image from "next/image";

interface QuoteBandProps {
  imageUrl?: string;
  alt?: string;
  quote?: string;
  attribution?: string;
  /** YouTube URL or direct MP4 URL */
  videoUrl?: string;
  videoTitle?: string;
  videoPoster?: string;
}

/**
 * Quote band with optional video. If videoUrl is provided, it replaces the image.
 * YouTube & MP4 are supported. Video autoplays muted with controls.
 */
export default function QuoteBand({
  imageUrl,
  alt = "Editorial image",
  quote,
  attribution,
  videoUrl,
  videoTitle = "Embedded video",
  videoPoster,
}: QuoteBandProps) {
  const trimmedQuote = quote?.trim() ?? "";
  const trimmedAttribution = attribution?.trim() ?? "";

  const yt = videoUrl ? toYouTubeEmbed(videoUrl) : null;

  const showVideo = Boolean(videoUrl);
  const showImage = !showVideo && Boolean(imageUrl);

  const hasContent =
    !!trimmedQuote || !!trimmedAttribution || showVideo || showImage;

  // If there is literally nothing meaningful, don't render anything.
  if (!hasContent) return null;

  return (
    <div className="quote-band">
      <div className="quote-media">
        {showVideo ? (
          yt ? (
            <iframe
              title={videoTitle}
              src={yt}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              className="quote-media-frame"
            />
          ) : (
            <video
              src={videoUrl}
              poster={videoPoster}
              muted
              autoPlay
              loop
              playsInline
              controls
              className="quote-media-video"
            />
          )
        ) : showImage ? (
          <Image
            src={imageUrl as string}
            alt={alt}
            fill
            className="quote-media-img"
          />
        ) : (
          <div className="quote-media-fallback" />
        )}
      </div>

      <div className="quote-copy">
        {trimmedQuote && (
          <blockquote className="big-quote">“{trimmedQuote}”</blockquote>
        )}
        {trimmedAttribution && (
          <p className="big-quote-source">— {trimmedAttribution}</p>
        )}
      </div>

      <style jsx>{`
        .quote-band {
          position: relative;
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: clamp(14px, 2vw, 24px);
          border-radius: 18px;
          overflow: hidden;
          background: #0f0a10;
          color: #fff;
        }

        .quote-media {
          position: relative;
          min-height: 260px;
          aspect-ratio: 16 / 9;
          overflow: hidden;
        }

        .quote-media-frame,
        .quote-media-video {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          border: 0;
        }

        .quote-media-video {
          object-fit: cover;
        }

        .quote-media-img {
          object-fit: cover;
        }

        .quote-media-fallback {
          position: absolute;
          inset: 0;
          background: #222;
        }

        .quote-copy {
          padding: clamp(16px, 2.2vw, 24px);
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .big-quote {
          font-family: var(--font-anton, "Anton"), system-ui, sans-serif;
          font-size: clamp(1.8rem, 4.2vw, 3.2rem);
          line-height: 1.05;
          margin: 0;
          letter-spacing: 0.01em;
        }

        .big-quote-source {
          margin-top: 0.6rem;
          font-family: var(
              --font-space-grotesk,
              "Space Grotesk"
            ),
            system-ui,
            sans-serif;
          font-size: 0.9rem;
          opacity: 0.9;
        }

        @media (max-width: 900px) {
          .quote-band {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

function toYouTubeEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    let id = "";

    if (u.hostname.includes("youtu.be")) {
      id = u.pathname.replace("/", "");
    } else if (u.hostname.includes("youtube.com")) {
      id = u.searchParams.get("v") || "";
      if (!id && u.pathname.includes("/embed/")) {
        id = u.pathname.split("/embed/")[1]?.split("/")[0] || "";
      }
    }

    if (!id) return null;

    const params = new URLSearchParams({
      autoplay: "1",
      mute: "1",
      controls: "1",
      playsinline: "1",
      loop: "1",
      playlist: id,
      rel: "0",
      modestbranding: "1",
    }).toString();

    return `https://www.youtube.com/embed/${id}?${params}`;
  } catch {
    return null;
  }
}
