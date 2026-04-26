// components/profile/ComingUpEventStrip.tsx
"use client";

import { useState, useEffect } from "react";
import { resolveVideo } from "@/lib/media/resolveVideo";

export interface ComingUpEvent {
  title: string;
  link?: string;
  date?: string;
  expiresAt?: string;
  description?: string;
  city?: string;
  stateCountry?: string;
  mediaType?: "image" | "video";
  mediaFileId?: string;
  mediaUrl?: string;
  mediaAlt?: string;
  videoAutoplay?: boolean;
}

interface Props {
  upcomingEvent?: ComingUpEvent;
}

function isExpired(date?: string, expiresAt?: string): boolean {
  const boundary = (expiresAt || "").trim() || (date || "").trim();
  if (!boundary) return false;
  const t = new Date();
  const today = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
  return today > boundary;
}

function formatDate(dateStr?: string): string | null {
  if (!dateStr) return null;
  const parts = dateStr.trim().split("-");
  if (parts.length !== 3) return null;
  const [y, m, d] = parts.map(Number);
  const dt = new Date(y, m - 1, d);
  if (isNaN(dt.getTime())) return null;
  return dt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function isSafeExternalUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}

function deriveMediaSrc(ev: ComingUpEvent): string | null {
  if (ev.mediaFileId) return `/api/img?fileId=${encodeURIComponent(ev.mediaFileId)}`;
  if (ev.mediaUrl && isSafeExternalUrl(ev.mediaUrl)) return ev.mediaUrl;
  return null;
}

// Only true (boolean) or "true" (string) enables autoplay — guards against "false", "FALSE", "0", etc.
function isAutoplay(val: unknown): boolean {
  return val === true || val === "true";
}

function buildEmbedUrl(embedUrl: string, provider: "youtube" | "vimeo", autoplay: boolean): string {
  try {
    const u = new URL(embedUrl);
    if (autoplay) {
      if (provider === "youtube") {
        u.searchParams.set("autoplay", "1");
        u.searchParams.set("mute", "1");
      } else {
        u.searchParams.set("autoplay", "1");
        u.searchParams.set("muted", "1");
      }
    }
    return u.toString();
  } catch {
    return embedUrl;
  }
}

// Abstract DAT color wash — fills the left column on desktop when no real media exists.
function DATFallbackVisual() {
  return (
    <svg
      viewBox="0 0 400 300"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
    >
      <defs>
        <linearGradient id="cu-fb-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#1E0835" />
          <stop offset="55%"  stopColor="#6C00AF" />
          <stop offset="100%" stopColor="#C4A35A" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#cu-fb-bg)" />
    </svg>
  );
}

/*
 * Layout rules (scoped class names):
 *
 * Mobile (< 1024px):
 *   .cu-layout       — block, single column
 *   .cu-media        — display:none  (fallback hidden; no awkward empty block)
 *   .cu-media.cu-has-media — display:block, aspect-ratio 16/9  (real media only)
 *
 * Desktop (≥ 1024px):
 *   .cu-layout       — CSS grid: 415px | minmax(0, 1fr)
 *   .cu-media        — display:block always  (real media or branded fallback)
 *   .cu-media.cu-has-media — aspect-ratio unset  (grid row height drives the column)
 */
const STYLES = `
  .cu-layout {
    display: block;
  }
  .cu-media {
    position: relative;
    display: none;
    overflow: hidden;
  }
  .cu-media.cu-has-media {
    display: block;
    aspect-ratio: 16 / 9;
  }
  @media (min-width: 1024px) {
    .cu-layout {
      display: grid;
      grid-template-columns: 415px minmax(0, 1fr);
      align-items: stretch;
    }
    .cu-media,
    .cu-media.cu-has-media {
      display: block;
      aspect-ratio: unset;
    }
  }
`;

export default function ComingUpEventStrip({ upcomingEvent }: Props) {
  const [mediaError, setMediaError] = useState(false);

  // Derive src before early returns so useEffect is always called (rules of hooks).
  const mediaSrc = upcomingEvent ? deriveMediaSrc(upcomingEvent) : null;

  // Reset error whenever the media source changes (e.g. artist pastes a new URL).
  useEffect(() => {
    setMediaError(false);
  }, [mediaSrc]);

  // Fail-closed: render nothing for missing/expired events
  if (!upcomingEvent?.title?.trim()) return null;
  if (isExpired(upcomingEvent.date, upcomingEvent.expiresAt)) return null;

  const formattedDate = formatDate(upcomingEvent.date);
  const city         = upcomingEvent.city?.trim() || "";
  const stateCountry = upcomingEvent.stateCountry?.trim() || "";
  const locationLine = city && stateCountry ? `${city}, ${stateCountry}` : city || stateCountry || "";
  const isVideo       = upcomingEvent.mediaType === "video";
  // For video, resolve the URL to know whether it's an embed or a direct file.
  // An unresolvable video URL (not YouTube/Vimeo/known file) counts as broken.
  const resolvedVideo = isVideo && mediaSrc ? resolveVideo(mediaSrc) : null;
  const showRealMedia = Boolean(mediaSrc) && !mediaError && (!isVideo || resolvedVideo !== null);
  // External URLs (no fileId) render directly; apply referrerPolicy accordingly.
  const isExternalSrc = Boolean(mediaSrc && isSafeExternalUrl(mediaSrc));

  return (
    <div
      style={{
        position: "relative",
        backgroundColor: "#1D1A24",
        borderTop: "3px solid #C4A35A",
        fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* eslint-disable-next-line react/no-danger */}
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <div className="cu-layout">

        {/*
          Left column.
          cu-has-media is set only when a usable media src exists AND has not errored.
          Without cu-has-media: hidden on mobile, shown (with DATFallbackVisual) on desktop.
          With cu-has-media:    shown on mobile (aspect-video) and on desktop (grid stretch).
        */}
        <div className={showRealMedia ? "cu-media cu-has-media" : "cu-media"}>
          {showRealMedia ? (
            isVideo ? (
              resolvedVideo?.kind === "embed" ? (
                <iframe
                  src={buildEmbedUrl(resolvedVideo.embedUrl, resolvedVideo.provider, isAutoplay(upcomingEvent.videoAutoplay))}
                  title={upcomingEvent.mediaAlt || upcomingEvent.title || "Video"}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  loading="lazy"
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "block",
                    width: "100%",
                    height: "100%",
                    border: 0,
                  }}
                />
              ) : (
                <video
                  src={mediaSrc!}
                  onError={() => setMediaError(true)}
                  style={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "center center",
                  }}
                  {...(isExternalSrc ? { referrerPolicy: "no-referrer" } : {})}
                  {...(isAutoplay(upcomingEvent.videoAutoplay)
                    ? { autoPlay: true, muted: true, loop: true, playsInline: true }
                    : { controls: true })}
                />
              )
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mediaSrc!}
                alt={upcomingEvent.mediaAlt || ""}
                onError={() => setMediaError(true)}
                referrerPolicy={isExternalSrc ? "no-referrer" : undefined}
                style={{
                  display: "block",
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "center center",
                }}
              />
            )
          ) : (
            <DATFallbackVisual />
          )}
        </div>

        {/* Right column — always rendered; always in the right grid cell on desktop */}
        <div style={{ padding: "1.5rem 2.5rem", minWidth: 0 }}>

          {/* Eyebrow */}
          <div
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "0.68rem",
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#9B89B4",
              marginBottom: "0.5rem",
            }}
          >
            Coming Up
          </div>

          {(formattedDate || locationLine) && (
            <div
              style={{
                position: "relative",
                width: "360px",
                maxWidth: "100%",
                padding: "1rem 1.25rem",
                marginBottom: "2.75rem",
              }}
            >
              {/* Top horizontal line */}
              <span aria-hidden="true" style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "rgba(196,163,90,0.45)" }} />
              {/* Bottom horizontal line */}
              <span aria-hidden="true" style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "1px", background: "rgba(196,163,90,0.45)" }} />
              {/* Left corner returns */}
              <span aria-hidden="true" style={{ position: "absolute", top: 0, left: 0, width: "1px", height: "10px", background: "rgba(196,163,90,0.45)" }} />
              <span aria-hidden="true" style={{ position: "absolute", bottom: 0, left: 0, width: "1px", height: "10px", background: "rgba(196,163,90,0.45)" }} />
              {/* Right corner returns */}
              <span aria-hidden="true" style={{ position: "absolute", top: 0, right: 0, width: "1px", height: "10px", background: "rgba(196,163,90,0.45)" }} />
              <span aria-hidden="true" style={{ position: "absolute", bottom: 0, right: 0, width: "1px", height: "10px", background: "rgba(196,163,90,0.45)" }} />

              {formattedDate && (
                <p
                  style={{
                    fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                    fontSize: "0.90rem",
                    fontWeight: 600,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "#F23359",
                    margin: "0 0 0.2rem",
                  }}
                >
                  {formattedDate}
                </p>
              )}
              {locationLine && (
                <p
                  style={{
                    fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "#D9A919",
                    margin: 0,
                  }}
                >
                  {locationLine}
                </p>
              )}
            </div>
          )}

          <h2
            style={{
              fontFamily: "var(--font-anton), system-ui, sans-serif",
              fontSize: "clamp(1.45rem, 3vw, 1.95rem)",
              lineHeight: 1.15,
              textTransform: "uppercase",
              color: "#F2F2F2",
              margin: "0 0 0.75rem",
              letterSpacing: "0.02em",
              maxWidth: "52ch",
            }}
          >
            {upcomingEvent.title}
          </h2>

          {upcomingEvent.description && (
            <p
              style={{
                fontSize: "0.93rem",
                lineHeight: 1.6,
                color: "#B8B0C0",
                margin: "0 0 1.25rem",
                maxWidth: "56ch",
              }}
            >
              {upcomingEvent.description}
            </p>
          )}

          {upcomingEvent.link && (
            <a
              href={upcomingEvent.link}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                fontSize: "0.75rem",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#1D1A24",
                backgroundColor: "#D9A919",
                textDecoration: "none",
                padding: "0.55rem 1.1rem",
                borderRadius: "6px",
              }}
            >
              View Event
            </a>
          )}

        </div>
      </div>
    </div>
  );
}
