// components/profile/ComingUpEventStrip.tsx
"use client";

import { useState } from "react";

export interface ComingUpEvent {
  title: string;
  link?: string;
  date?: string;
  expiresAt?: string;
  description?: string;
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

function deriveMediaSrc(ev: ComingUpEvent): string | null {
  if (ev.mediaFileId) return `/api/img?fileId=${encodeURIComponent(ev.mediaFileId)}`;
  if (ev.mediaUrl) {
    // Images: route through proxy for security. Videos: use URL directly (proxy buffers
    // the full file which prevents seek; direct URL lets the browser stream natively).
    if ((ev.mediaType || "image") === "video") return ev.mediaUrl;
    return `/api/img?url=${encodeURIComponent(ev.mediaUrl)}`;
  }
  return null;
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
    .cu-media {
      display: block;
      aspect-ratio: unset;
    }
  }
`;

export default function ComingUpEventStrip({ upcomingEvent }: Props) {
  const [mediaError, setMediaError] = useState(false);

  // Fail-closed: render nothing for missing/expired events
  if (!upcomingEvent?.title?.trim()) return null;
  if (isExpired(upcomingEvent.date, upcomingEvent.expiresAt)) return null;

  const formattedDate = formatDate(upcomingEvent.date);
  const mediaSrc     = deriveMediaSrc(upcomingEvent);
  const isVideo      = upcomingEvent.mediaType === "video";
  const showRealMedia = Boolean(mediaSrc) && !mediaError;

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
              <video
                src={mediaSrc!}
                onError={() => setMediaError(true)}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
                {...(upcomingEvent.videoAutoplay
                  ? { autoPlay: true, muted: true, loop: true, playsInline: true }
                  : { controls: true })}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mediaSrc!}
                alt={upcomingEvent.mediaAlt || ""}
                onError={() => setMediaError(true)}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
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

          {formattedDate && (
            <p
              style={{
                fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                fontSize: "0.78rem",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#C4A35A",
                margin: "0 0 0.4rem",
              }}
            >
              {formattedDate}
            </p>
          )}

          <h2
            style={{
              fontFamily: "var(--font-anton), system-ui, sans-serif",
              fontSize: "clamp(1.25rem, 3vw, 1.75rem)",
              lineHeight: 1.15,
              textTransform: "uppercase",
              color: "#F2ECE6",
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
                backgroundColor: "#C4A35A",
                textDecoration: "none",
                padding: "0.55rem 1.1rem",
                borderRadius: "6px",
              }}
            >
              View Event →
            </a>
          )}

        </div>
      </div>
    </div>
  );
}
