// components/productions/ProcessBand.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

export type ProcessSlide = {
  // If image is provided, it takes precedence; video is a fallback
  image?: { src: string; alt?: string };
  videoUrl?: string; // YouTube or MP4
  videoTitle?: string; // a11y title for iframe
  videoPoster?: string; // optional poster for MP4
  heading?: string;
  body?: string | string[];
  quote?: { text: string; attribution?: string };
};

interface ProcessBandProps {
  slides?: ProcessSlide[];
  title?: string;
}

type NormalizedSlide = {
  _origIndex: number;
  _hasText: boolean;
  _hasImage: boolean;
  _hasVideo: boolean;
  _imageOnly: boolean;
  _videoOnly: boolean;

  image?: { src: string; alt?: string };
  videoUrl?: string;
  videoTitle?: string;
  videoPoster?: string;
  heading?: string;
  body?: string | string[];
  quote?: { text: string; attribution?: string };
};

type LightboxState =
  | {
      kind: "image";
      src: string;
      alt?: string;
      title?: string;
    }
  | {
      kind: "youtube";
      src: string; // embed URL
      title?: string;
    }
  | {
      kind: "video";
      src: string; // file URL
      poster?: string;
      title?: string;
    };

const t = (v?: string | null) => (v ?? "").trim();

export default function ProcessBand({
  slides,
  title = "Process",
}: ProcessBandProps) {
  const [index, setIndex] = useState(0);

  // Track runtime failures so we can drop “media-only” slides if they break.
  const [brokenImages, setBrokenImages] = useState<Set<number>>(() => new Set());
  const [brokenVideos, setBrokenVideos] = useState<Set<number>>(() => new Set());

  // Lightbox
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);

  const normalizedSlides = useMemo<NormalizedSlide[]>(() => {
    if (!Array.isArray(slides) || !slides.length) return [];

    return slides.map((s, i) => {
      const slide = s || {};

      const hasHeading = !!t(slide.heading);

      const hasBody =
        typeof slide.body === "string"
          ? !!t(slide.body)
          : Array.isArray(slide.body)
          ? slide.body.some((b) => !!t(b))
          : false;

      const hasQuote = !!t(slide.quote?.text) || !!t(slide.quote?.attribution);

      const hasText = hasHeading || hasBody || hasQuote;

      const hasImage = !!t(slide.image?.src);
      const hasVideo = !!t(slide.videoUrl);

      return {
        _origIndex: i,
        _hasText: hasText,
        _hasImage: hasImage,
        _hasVideo: hasVideo,
        _imageOnly: !hasText && hasImage && !hasVideo,
        _videoOnly: !hasText && !hasImage && hasVideo,

        ...slide,
      };
    });
  }, [slides]);

  const visibleSlides = useMemo<NormalizedSlide[]>(() => {
    if (!normalizedSlides.length) return [];

    return normalizedSlides.filter((s) => {
      if (!s._hasText && !s._hasImage && !s._hasVideo) return false;
      if (s._imageOnly && brokenImages.has(s._origIndex)) return false;
      if (s._videoOnly && brokenVideos.has(s._origIndex)) return false;
      return true;
    });
  }, [normalizedSlides, brokenImages, brokenVideos]);

  const total = visibleSlides.length;

  // Keep index valid as slides drop out or change.
  useEffect(() => {
    if (total === 0) return;
    if (index >= total) setIndex(0);
  }, [index, total]);

  // Lightbox ESC to close
  useEffect(() => {
    if (!lightbox) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightbox]);

  if (!total) return null;

  const clampedIndex = index >= total ? 0 : index;
  const current = visibleSlides[clampedIndex];

  const next = () => setIndex((prev) => (prev + 1) % total);
  const prev = () => setIndex((prev) => (prev - 1 + total) % total);

  const bodyLines = normalizeBody(current.body);
  const hasQuoteText = !!t(current.quote?.text);
  const hasAttribution = !!t(current.quote?.attribution);

  const markImageBroken = (origIndex: number) => {
    setBrokenImages((prev) => {
      if (prev.has(origIndex)) return prev;
      const next = new Set(prev);
      next.add(origIndex);
      return next;
    });
  };

  const markVideoBroken = (origIndex: number) => {
    setBrokenVideos((prev) => {
      if (prev.has(origIndex)) return prev;
      const next = new Set(prev);
      next.add(origIndex);
      return next;
    });
  };

  const openLightboxForCurrent = () => {
    if (t(current.image?.src)) {
      setLightbox({
        kind: "image",
        src: t(current.image!.src),
        alt: t(current.image?.alt) || t(current.heading) || "Process image",
        title: t(current.heading) || title,
      });
      return;
    }

    if (t(current.videoUrl)) {
      const raw = t(current.videoUrl);
      const yt = toYouTubeEmbed(raw);
      if (yt) {
        setLightbox({
          kind: "youtube",
          src: yt,
          title: t(current.videoTitle) || t(current.heading) || "Embedded video",
        });
      } else {
        setLightbox({
          kind: "video",
          src: raw,
          poster: t(current.videoPoster) || undefined,
          title: t(current.videoTitle) || t(current.heading) || "Video",
        });
      }
    }
  };

  return (
    <section aria-label={title} className="proc-wrap">
      <div
        className="proc-band"
        style={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr",
          gap: "clamp(14px, 2vw, 24px)",
          borderRadius: 18,
          overflow: "hidden",
          background: "#0f0a10",
          color: "#fff",
        }}
      >
        <div className="proc-media" aria-label="Process media">
          <MediaPane
            image={current.image}
            videoUrl={current.videoUrl}
            videoTitle={current.videoTitle}
            videoPoster={current.videoPoster}
            onImageError={() => markImageBroken(current._origIndex)}
            onVideoError={() => markVideoBroken(current._origIndex)}
            onOpenLightbox={openLightboxForCurrent}
          />
        </div>

        <div className="proc-copy">
          {t(current.heading) && <h3 className="proc-head">{t(current.heading)}</h3>}

          {bodyLines.map((line, idx) => (
            <p key={idx} className="proc-body">
              {line}
            </p>
          ))}

          {hasQuoteText && (
            <blockquote className="proc-quote">“{t(current.quote!.text)}”</blockquote>
          )}

          {hasAttribution && <p className="proc-quote-src">— {t(current.quote!.attribution)}</p>}

          {total > 1 && (
            <div className="proc-ctls">
              <button type="button" onClick={prev} aria-label="Previous slide">
                ‹
              </button>
              <span className="proc-index">
                {clampedIndex + 1} / {total}
              </span>
              <button type="button" onClick={next} aria-label="Next slide">
                ›
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="proc-lb"
          role="dialog"
          aria-modal="true"
          aria-label="Media viewer"
          onClick={() => setLightbox(null)}
        >
          <div className="proc-lb-inner" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="proc-lb-close"
              aria-label="Close"
              onClick={() => setLightbox(null)}
            >
              ✕
            </button>

            {lightbox.kind === "image" ? (
              <div className="proc-lb-stage">
                <div className="proc-lb-imgbox">
                  <Image
                    src={lightbox.src}
                    alt={lightbox.alt || "Image"}
                    fill
                    className="proc-lb-img"
                    sizes="(max-width: 1024px) 92vw, 1400px"
                    priority
                    style={{ objectFit: "contain" }} // ✅ original ratio, no crop
                  />
                </div>
              </div>
            ) : lightbox.kind === "youtube" ? (
              <div className="proc-lb-stage">
                <div className="proc-lb-videobox">
                  <iframe
                    title={lightbox.title || "Embedded video"}
                    src={lightbox.src}
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                    style={{ border: 0, width: "100%", height: "100%" }}
                  />
                </div>
              </div>
            ) : (
              <div className="proc-lb-stage">
                <video
                  src={lightbox.src}
                  poster={lightbox.poster}
                  controls
                  autoPlay
                  className="proc-lb-video"
                  title={lightbox.title}
                />
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .proc-wrap {
          width: 100%;
        }

        /* ✅ Standard YouTube shape everywhere */
        .proc-media {
          position: relative;
          width: 100%;
          overflow: hidden;
          aspect-ratio: 16 / 9;
          background: #24112333;
        }

        .proc-copy {
          padding: clamp(16px, 2.2vw, 24px);
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .proc-head {
          margin: 0 0 6px 0;
          font-family: var(--font-dm-sans, "DM Sans"), system-ui, sans-serif;
          font-size: 1.06rem;
          letter-spacing: 0.02em;
        }

        .proc-body {
          margin: 6px 0 0 0;
          font-family: var(--font-space-grotesk, "Space Grotesk"), system-ui, sans-serif;
          font-size: 0.98rem;
          line-height: 1.6;
        }

        .proc-quote {
          margin: 10px 0 0 0;
          font-family: var(--font-anton, "Anton"), system-ui, sans-serif;
          font-size: clamp(1.2rem, 2.6vw, 1.6rem);
          line-height: 1.1;
        }

        .proc-quote-src {
          margin-top: 0.35rem;
          font-family: var(--font-space-grotesk, "Space Grotesk"), system-ui, sans-serif;
          font-size: 0.85rem;
          opacity: 0.9;
        }

        .proc-ctls {
          margin-top: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .proc-ctls button {
          border: 0;
          background: #ffffff14;
          color: #fff;
          padding: 6px 10px;
          border-radius: 999px;
          cursor: pointer;
          transition: opacity 160ms ease, transform 160ms ease;
        }

        .proc-ctls button:hover {
          opacity: 0.85;
          transform: translateY(-1px);
        }

        .proc-index {
          font-size: 0.82rem;
          opacity: 0.9;
        }

        @media (max-width: 900px) {
          .proc-band {
            grid-template-columns: 1fr !important;
          }
        }

        /* ---------- Lightbox ---------- */
        .proc-lb {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.78);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px;
        }

        .proc-lb-inner {
          position: relative;
          width: min(92vw, 1400px);
          max-height: 92vh;
        }

        .proc-lb-close {
          position: absolute;
          top: -10px;
          right: -10px;
          width: 40px;
          height: 40px;
          border-radius: 999px;
          border: 0;
          background: rgba(255, 255, 255, 0.16);
          color: #fff;
          cursor: pointer;
          display: grid;
          place-items: center;
        }

        .proc-lb-stage {
          width: 100%;
          max-height: 92vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Image: contain */
        .proc-lb-imgbox {
          position: relative;
          width: 100%;
          height: min(92vh, 900px);
        }

        /* YouTube: keep 16:9 in lightbox */
        .proc-lb-videobox {
          width: 100%;
          aspect-ratio: 16 / 9;
          background: #000;
          border-radius: 14px;
          overflow: hidden;
        }

        /* Raw video: contain */
        .proc-lb-video {
          width: 100%;
          max-height: 92vh;
          border-radius: 14px;
          background: #000;
          object-fit: contain;
        }
      `}</style>
    </section>
  );
}

/* ---------- MediaPane: image preferred, video as fallback ---------- */
function MediaPane({
  image,
  videoUrl,
  videoTitle = "Embedded video",
  videoPoster,
  onImageError,
  onVideoError,
  onOpenLightbox,
}: {
  image?: { src: string; alt?: string };
  videoUrl?: string;
  videoTitle?: string;
  videoPoster?: string;
  onImageError?: () => void;
  onVideoError?: () => void;
  onOpenLightbox?: () => void;
}) {
  const imgSrc = t(image?.src);
  const vidSrc = t(videoUrl);

  // Image wins (click anywhere to open)
if (imgSrc) {
  const alt = t(image?.alt) || "Process image";

  return (
    <button
      type="button"
      onClick={() => onOpenLightbox?.()}
      aria-label="Open image"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        padding: 0,
        border: 0,
        background: "transparent",
        cursor: "zoom-in",
      }}
    >
      <Image
        src={imgSrc}
        alt={alt}
        fill
        sizes="(max-width: 900px) 100vw, 55vw"
        priority={false}
        // helps prevent oversized decode/jank
        quality={75}
        style={{ objectFit: "cover" }}
        onError={() => onImageError?.()}
      />
    </button>
  );
}


  // Video
  if (vidSrc) {
    const yt = toYouTubeEmbed(vidSrc);

    // ✅ Don’t wrap iframe in a button (it breaks interaction). Instead show a small “open” button overlay.
    if (yt) {
      return (
        <div style={{ position: "absolute", inset: 0 }}>
          <iframe
            title={t(videoTitle) || "Embedded video"}
            src={yt}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            loading="lazy"
            onError={() => onVideoError?.()}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              border: 0,
              display: "block",
            }}
          />
          <button
            type="button"
            onClick={() => onOpenLightbox?.()}
            aria-label="Open video in lightbox"
            style={{
              position: "absolute",
              right: 10,
              bottom: 10,
              zIndex: 5,
              border: 0,
              borderRadius: 999,
              padding: "8px 10px",
              background: "rgba(0,0,0,0.45)",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            ⤢
          </button>
        </div>
      );
    }

    return (
      <div style={{ position: "absolute", inset: 0 }}>
        <video
          src={vidSrc}
          poster={t(videoPoster) || undefined}
          muted
          autoPlay
          loop
          playsInline
          controls
          onError={() => onVideoError?.()}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
        <button
          type="button"
          onClick={() => onOpenLightbox?.()}
          aria-label="Open video in lightbox"
          style={{
            position: "absolute",
            right: 10,
            bottom: 10,
            zIndex: 5,
            border: 0,
            borderRadius: 999,
            padding: "8px 10px",
            background: "rgba(0,0,0,0.45)",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          ⤢
        </button>
      </div>
    );
  }

  return <div style={{ position: "absolute", inset: 0, background: "#24112333" }} />;
}

function normalizeBody(body?: string | string[]): string[] {
  if (!body) return [];
  if (Array.isArray(body)) return body.map((b) => t(b)).filter(Boolean);
  return body
    .split(/\n{2,}/)
    .map((b) => t(b))
    .filter(Boolean);
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
      if (!id && u.pathname.includes("/shorts/")) {
        id = u.pathname.split("/shorts/")[1]?.split("/")[0] || "";
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
