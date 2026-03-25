// components/media/VideoEmbed.tsx
"use client";

import * as React from "react";

import { resolveVideo } from "@/lib/media/resolveVideo";
import type { VideoEmbedInput, ResolvedVideo } from "@/lib/media/resolveVideo";

type Props = {
  /** Any supported input: YouTube/Vimeo URL, direct mp4/webm URL, or local `/videos/...` path */
  src?: VideoEmbedInput;

  /** Optional title shown to screen readers + iframe title attribute */
  title?: string;

  /** Optional poster for self-hosted/direct videos */
  poster?: string;

  /** Rendered above the player (optional) */
  heading?: React.ReactNode;

  /** 16/9 by default; also accepts strings like "4/3" or "1/1" */
  ratio?: number | `${number}/${number}`;

  /** Autoplay is usually blocked unless muted; defaults false */
  autoPlay?: boolean;

  /** If true, video starts muted (useful if autoPlay) */
  muted?: boolean;

  /** Loop playback */
  loop?: boolean;

  /** Show controls (true by default for <video>) */
  controls?: boolean;

  /** Start time in seconds (YouTube/Vimeo/direct mp4). Best-effort. */
  start?: number;

  /** Extra className applied to outer wrapper */
  className?: string;

  /** Extra className applied to the inner frame/video element */
  mediaClassName?: string;

  /** If set, renders nothing when src can’t be resolved */
  silentFail?: boolean;
};

const DEFAULT_RATIO: `${number}/${number}` = "16/9";

function ratioToPaddingTop(ratio: number | `${number}/${number}`): string {
  // returns percentage string for padding-top, e.g. "56.25%"
  if (typeof ratio === "number") {
    const r = ratio > 0 ? ratio : 16 / 9;
    return `${(1 / r) * 100}%`;
  }

  const [wRaw, hRaw] = ratio.split("/");
  const w = Number(wRaw);
  const h = Number(hRaw);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
    return "56.25%";
  }
  return `${(h / w) * 100}%`;
}

function safeNewUrl(input: string): URL {
  // In client components, window exists; this keeps URL() happy even if someone
  // accidentally passes a relative embedUrl someday.
  const base =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "https://example.invalid";
  return new URL(input, base);
}

function buildIframeSrc(v: ResolvedVideo & { kind: "embed" }, start?: number): string {
  const url = safeNewUrl(v.embedUrl);

  // Start time (best-effort)
  if (typeof start === "number" && start > 0) {
    const s = String(Math.floor(start));
    if (v.provider === "youtube") url.searchParams.set("start", s);
    if (v.provider === "vimeo") url.hash = `t=${s}s`;
  }

  // Sensible defaults
  if (v.provider === "youtube") {
    // modest branding + playsinline + rel=0
    if (!url.searchParams.has("modestbranding")) url.searchParams.set("modestbranding", "1");
    if (!url.searchParams.has("playsinline")) url.searchParams.set("playsinline", "1");
    if (!url.searchParams.has("rel")) url.searchParams.set("rel", "0");
  }

  return url.toString();
}

export default function VideoEmbed({
  src,
  title,
  poster,
  heading,
  ratio = DEFAULT_RATIO,
  autoPlay = false,
  muted = false,
  loop = false,
  controls = true,
  start,
  className,
  mediaClassName,
  silentFail = false,
}: Props) {
  const resolved = React.useMemo(() => {
    if (!src) return null;
    return resolveVideo(src);
  }, [src]);

  const sectionClass = ["dat-video-embed", className].filter(Boolean).join(" ");
  const frameClass = ["dat-video__frame", mediaClassName].filter(Boolean).join(" ");

  if (!src || !resolved) {
    return silentFail ? null : (
      <section className={sectionClass} aria-label="Video">
        {heading ? <div className="dat-video__heading">{heading}</div> : null}
        <div className="dat-video__fallback">Video unavailable (missing or unsupported source).</div>
        <VideoEmbedStyles />
      </section>
    );
  }

  const paddingTop = ratioToPaddingTop(ratio);
  const aria = typeof title === "string" ? title : "Video";

  return (
    <section className={sectionClass} aria-label={aria}>
      {heading ? <div className="dat-video__heading">{heading}</div> : null}

      <div className="dat-video" style={{ paddingTop }}>
        {resolved.kind === "embed" && (
          <iframe
            className={frameClass}
            src={buildIframeSrc(resolved, start)}
            title={title || resolved.title || "Video"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
          />
        )}

        {resolved.kind === "file" && (
          <video
            className={frameClass}
            src={resolved.src}
            poster={poster || resolved.poster}
            controls={controls}
            autoPlay={autoPlay}
            muted={muted}
            loop={loop}
            playsInline
          />
        )}
      </div>

      {(title || resolved.title) && (
        <div className="dat-video__caption">{title || resolved.title}</div>
      )}

      <VideoEmbedStyles />
    </section>
  );
}

function VideoEmbedStyles() {
  return (
    <style jsx global>{`
      .dat-video-embed {
        width: 100%;
      }

      .dat-video__heading {
        margin-bottom: 10px;
      }

      .dat-video {
        position: relative;
        width: 100%;
        overflow: hidden;
        border-radius: 16px;
        background: rgba(0, 0, 0, 0.75);
        border: 1px solid rgba(255, 255, 255, 0.12);
        box-shadow: 0 10px 22px rgba(0, 0, 0, 0.25);
      }

      .dat-video__frame {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        border: 0;
        display: block;
      }

      /* Ensure <video> crops nicely (like your earlier intent) */
      video.dat-video__frame {
        object-fit: cover;
      }

      .dat-video__caption {
        margin-top: 10px;
        font-size: 14px;
        opacity: 0.9;
      }

      .dat-video__fallback {
        font-size: 14px;
        opacity: 0.85;
      }
    `}</style>
  );
}
