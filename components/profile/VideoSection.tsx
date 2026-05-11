// components/profile/VideoSection.tsx
"use client";

import * as React from "react";
import VideoEmbed from "@/components/media/VideoEmbed";
import { resolveVideo } from "@/lib/media/resolveVideo";
import type { ResolvedVideo } from "@/lib/media/resolveVideo";

export type VideoSectionProps = {
  videos: Array<{
    url: string;
    title?: string;
    autoTitle?: string;
    aspect?: "16/9" | "9/16" | "1/1" | "21/9" | "4/3";
    autoplay?: boolean;
    muted?: boolean;
  }>;
  fullBleed?: boolean;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function canAutoplayEmbed(resolved: ResolvedVideo | null): boolean {
  return (
    resolved?.kind === "embed" &&
    (resolved.provider === "youtube" || resolved.provider === "vimeo")
  );
}

/** Apply clean embed params for a given provider. */
function buildEmbedUrl(
  embedUrl: string,
  provider: string,
  opts: { autoplay?: boolean; muted?: boolean } = {}
): string {
  try {
    const u = new URL(embedUrl);
    if (provider === "youtube") {
      // Reduce YouTube chrome as much as the API allows
      u.searchParams.set("rel", "0");             // no suggested videos at end
      u.searchParams.set("modestbranding", "1");  // minimal YouTube logo
      u.searchParams.set("iv_load_policy", "3");  // no annotations
      if (opts.autoplay) {
        u.searchParams.set("autoplay", "1");
        if (opts.muted) u.searchParams.set("mute", "1");
      }
    } else if (provider === "vimeo") {
      u.searchParams.set("title", "0");
      u.searchParams.set("byline", "0");
      u.searchParams.set("portrait", "0");
      if (opts.autoplay) {
        u.searchParams.set("autoplay", "1");
        if (opts.muted) u.searchParams.set("muted", "1");
      }
    }
    return u.toString();
  } catch {
    return embedUrl;
  }
}

function ratioToPaddingTop(aspect: string): string {
  const [wRaw, hRaw] = aspect.split("/");
  const w = Number(wRaw);
  const h = Number(hRaw);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0)
    return "56.25%";
  return `${(h / w) * 100}%`;
}

// ── Link fallback card ────────────────────────────────────────────────────────

function LinkCard({
  url,
  displayDomain,
  title,
}: {
  url: string;
  displayDomain: string;
  title?: string;
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "center",
        gap: 8,
        padding: "1.5rem",
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.16)",
        textDecoration: "none",
        color: "#f0e8d0",
        minHeight: 120,
      }}
    >
      <span
        style={{
          fontSize: 11,
          opacity: 0.6,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
          fontWeight: 700,
        }}
      >
        {displayDomain} ↗
      </span>
      <span style={{ fontWeight: 700, fontSize: "0.95rem", wordBreak: "break-all" }}>
        {title || url}
      </span>
    </a>
  );
}

// ── VideoSlot ─────────────────────────────────────────────────────────────────
// secondary  → right-rail (smaller overlay title, slight dim)
// fillHeight → fills parent container instead of using padding-top aspect trick
//              (parent must be position:relative with an explicit height)

function VideoSlot({
  item,
  secondary = false,
  fillHeight = false,
}: {
  item: VideoSectionProps["videos"][0];
  secondary?: boolean;
  fillHeight?: boolean;
}) {
  const resolved = React.useMemo(() => resolveVideo(item.url), [item.url]);
  const displayTitle = item.title?.trim() || item.autoTitle?.trim() || undefined;
  const aspect = item.aspect || "16/9";
  const doAutoplay = !!item.autoplay && canAutoplayEmbed(resolved);
  const doMute = item.muted !== false;
  const paddingTop = ratioToPaddingTop(aspect);

  const iframeAllow =
    "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";

  // Gradient + title overlay, scaled for primary vs secondary
  const titleOverlay = displayTitle ? (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        background: "linear-gradient(transparent, rgba(10,6,20,0.88))",
        padding: secondary ? "1.5rem 0.85rem 0.75rem" : "3rem 1.75rem 1.5rem",
        pointerEvents: "none",
      }}
    >
      <p
        style={{
          margin: 0,
          fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
          fontSize: secondary ? "0.68rem" : "clamp(1rem, 2vw, 1.4rem)",
          fontWeight: 900,
          textTransform: "uppercase",
          letterSpacing: secondary ? "0.06em" : "0.02em",
          color: "#f0e8d0",
          lineHeight: 1.2,
        }}
      >
        {displayTitle}
      </p>
    </div>
  ) : null;

  if (resolved?.kind === "link") {
    return (
      <LinkCard
        url={resolved.url}
        displayDomain={resolved.displayDomain}
        title={displayTitle}
      />
    );
  }

  if (resolved?.kind === "embed") {
    const embedSrc = buildEmbedUrl(resolved.embedUrl, resolved.provider, {
      autoplay: doAutoplay,
      muted: doMute,
    });

    // fillHeight: iframe fills a parent that already has a height (e.g. grid row)
    if (fillHeight) {
      return (
        <div
          style={{
            position: "absolute",
            inset: 0,
            ...(secondary ? { opacity: 0.88 } : {}),
          }}
        >
          <iframe
            src={embedSrc}
            title={displayTitle || "Video"}
            allow={iframeAllow}
            allowFullScreen
            loading="lazy"
            style={{ width: "100%", height: "100%", border: 0, display: "block" }}
          />
          {titleOverlay}
        </div>
      );
    }

    return (
      <div
        style={{
          position: "relative",
          width: "100%",
          ...(secondary ? { opacity: 0.88 } : {}),
        }}
      >
        <div style={{ position: "relative", width: "100%", paddingTop }}>
          <iframe
            src={embedSrc}
            title={displayTitle || "Video"}
            allow={iframeAllow}
            allowFullScreen
            loading="lazy"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0, display: "block" }}
          />
        </div>
        {titleOverlay}
      </div>
    );
  }

  // File / other
  return (
    <div style={{ position: "relative", ...(fillHeight ? { position: "absolute", inset: 0 } as React.CSSProperties : {}) }}>
      <VideoEmbed
        src={item.url}
        title={displayTitle}
        ratio={aspect}
        silentFail
        autoPlay={item.autoplay}
        muted={item.autoplay || item.muted}
      />
      {titleOverlay}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function VideoSection({ videos, fullBleed = true }: VideoSectionProps) {
  const validVideos = videos.filter((v) => v.url?.trim());
  if (validVideos.length === 0) return null;

  const count = validVideos.length;
  const primary = validVideos[0];
  const secondaries = validVideos.slice(1, 3);

  // ── Shared CSS: theatre wrapper + responsive padding + glow ──────────────
  // Desktop: generous horizontal padding so the video "floats" in the dark.
  // Tablet/mobile: nearly full width — just enough padding to feel distinct
  // from a true edge-to-edge full-bleed.
  const sharedStyle = `
    .dat-vs-theatre {
      background: linear-gradient(160deg, #0d0618 0%, #06101e 55%, #090c18 100%);
      font-family: var(--font-dm-sans), system-ui, sans-serif;
      /* Desktop: interior padding so the video "floats" in the dark theatre. */
      padding: clamp(2rem, 3vw, 3rem) 1rem;
    }
    /* Full-bleed variant: no padding — video fills the section edge-to-edge */
    .dat-vs-theatre.dat-vs-full {
      padding: 0;
    }
    /* Tablet — nearly full width */
    @media (max-width: 1024px) {
      .dat-vs-theatre { padding: 2rem 1.5rem; }
      .dat-vs-theatre.dat-vs-full { padding: 0; }
    }
    /* Mobile — essentially full width */
    @media (max-width: 640px) {
      .dat-vs-theatre { padding: 1.5rem 0.75rem; }
      .dat-vs-theatre.dat-vs-full { padding: 0; }
    }

    /* Rounded card — no outline, directional ombre glow:
       DAT pink bleeds from upper-right, DAT blue from lower-left,
       like ambient light spilling from a screen into a dark theatre. */
    .dat-vs-glow {
      border-radius: 14px;
      overflow: hidden;
      box-shadow:
        0 12px 50px rgba(0,0,0,0.68),
        60px -50px 130px rgba(242,51,89,0.18),
        -60px 50px 130px rgba(36,147,169,0.20);
    }

    /* Multi-video grid */
    .dat-vs-multi {
      display: flex;
      flex-direction: column;
    }
    .dat-vs-rail {
      display: flex;
      flex-direction: row;
      gap: 2px;
    }
    .dat-vs-secondary {
      flex: 1;
      position: relative;
      padding-top: 56.25%;
      background: #120820;
    }
    @media (min-width: 680px) {
      .dat-vs-multi {
        display: grid;
        grid-template-columns: ${count === 2 ? "1fr 1fr" : "2fr 1fr"};
        gap: 2px;
        align-items: stretch;
      }
      .dat-vs-rail {
        flex-direction: column;
        gap: 2px;
        height: 100%;
      }
      .dat-vs-secondary {
        padding-top: 0;
        flex: 1;
        min-height: 0;
      }
    }
  `;

  // ── Single video ──────────────────────────────────────────────────────────
  if (count === 1) {
    if (!fullBleed) {
      // Not full-bleed: floats to the right, clears the headshot on the left.
      // Desktop: increased max-width so the video uses more of the available
      // space to the right of the headshot, without negative margins.
      // On tablet/mobile there's no headshot overlap so it goes full width.
      return (
        <>
          <style>{sharedStyle}{`
            .dat-vs-float-right {
              display: flex;
              justify-content: flex-end;
            }
            .dat-vs-float-right .dat-vs-glow {
              width: min(600px, 62%);
            }
            @media (max-width: 1024px) {
              .dat-vs-float-right .dat-vs-glow { width: 100%; }
            }
          `}</style>
          <div className="dat-vs-theatre dat-vs-float-right">
            <div className="dat-vs-glow">
              <VideoSlot item={primary} />
            </div>
          </div>
        </>
      );
    }
    // Full-bleed: video fills the theatre section edge-to-edge.
    // No inner glow wrapper — no padding, no rounded corners, no overflow clip.
    return (
      <>
        <style>{sharedStyle}</style>
        <div className="dat-vs-theatre dat-vs-full">
          <VideoSlot item={primary} />
        </div>
      </>
    );
  }

  // ── 2–3 videos ────────────────────────────────────────────────────────────
  return (
    <>
      <style>{sharedStyle}</style>
      <div className="dat-vs-theatre">
        <div className="dat-vs-glow">
          <div className="dat-vs-multi">
            <div style={{ lineHeight: 0 }}>
              <VideoSlot item={primary} />
            </div>
            <div className="dat-vs-rail">
              {secondaries.map((v, i) => (
                <div key={i} className="dat-vs-secondary">
                  <VideoSlot item={v} secondary={count >= 3} fillHeight />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
