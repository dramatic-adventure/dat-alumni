// components/productions/ProcessBand.tsx
"use client";
import { useState, useMemo } from "react";
import Image from "next/image";

export type ProcessSlide = {
  // If image is provided, it takes precedence; video is a fallback
  image?: { src: string; alt?: string };
  videoUrl?: string;              // YouTube or MP4
  videoTitle?: string;            // a11y title for iframe
  videoPoster?: string;           // optional poster for MP4
  heading?: string;
  body?: string | string[];
  quote?: { text: string; attribution?: string };
};

export default function ProcessBand({
  slides,
  title = "Process",
}: {
  slides: ProcessSlide[];
  title?: string;
}) {
  const [i, setI] = useState(0);

  // guard
  const safeSlides = useMemo(
    () => (slides?.length ? slides : []),
    [slides]
  );
  if (!safeSlides.length) return null;

  const next = () => setI((p) => (p + 1) % safeSlides.length);
  const prev = () => setI((p) => (p - 1 + safeSlides.length) % safeSlides.length);

  const s = safeSlides[i];

  return (
    <section aria-label={title} className="proc-wrap">
      <div className="proc-band">
        <div className="proc-media">
          <MediaPane
            image={s.image}
            videoUrl={s.videoUrl}
            videoTitle={s.videoTitle}
            videoPoster={s.videoPoster}
          />
        </div>

        <div className="proc-copy">
          {s.heading && <h3 className="proc-head">{s.heading}</h3>}

          {Array.isArray(s.body)
            ? s.body.map((p, idx) => (
                <p key={idx} className="proc-body">
                  {p}
                </p>
              ))
            : s.body && <p className="proc-body">{s.body}</p>}

          {s.quote?.text && (
            <blockquote className="proc-quote">“{s.quote.text}”</blockquote>
          )}
          {s.quote?.attribution && (
            <p className="proc-quote-src">— {s.quote.attribution}</p>
          )}

          {safeSlides.length > 1 && (
            <div className="proc-ctls">
              <button type="button" onClick={prev} aria-label="Previous slide">
                ‹
              </button>
              <span className="proc-index">
                {i + 1} / {safeSlides.length}
              </span>
              <button type="button" onClick={next} aria-label="Next slide">
                ›
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .proc-wrap {
          width: 100%;
        }
        .proc-band {
          position: relative;
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: clamp(14px, 2vw, 24px);
          border-radius: 18px;
          overflow: hidden;
          background: #0f0a10;
          color: #fff;
        }
        /* Constrain the media box to prevent full-screen flash */
        .proc-media {
          position: relative;
          min-height: 260px;
          aspect-ratio: 16 / 9;
          overflow: hidden;
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
          font-family: var(--font-space-grotesk, "Space Grotesk"), system-ui,
            sans-serif;
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
          font-family: var(--font-space-grotesk, "Space Grotesk"), system-ui,
            sans-serif;
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
            grid-template-columns: 1fr;
          }
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
}: {
  image?: { src: string; alt?: string };
  videoUrl?: string;
  videoTitle?: string;
  videoPoster?: string;
}) {
  // Prefer image if provided – avoids iframe/video flicker on load
  if (image?.src) {
    return (
      <Image
        src={image.src}
        alt={image.alt || "Process image"}
        fill
        className="object-cover"
        sizes="(min-width: 1024px) 720px, 100vw"
        priority={false}
      />
    );
  }

  // Only use video when there is no image
  if (videoUrl) {
    const yt = toYouTubeEmbed(videoUrl);
    if (yt) {
      return (
        <iframe
          title={videoTitle}
          src={yt}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            border: 0,
          }}
        />
      );
    }
    // MP4 fallback
    return (
      <video
        src={videoUrl}
        poster={videoPoster}
        muted
        autoPlay
        loop
        playsInline
        controls
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
    );
  }

  // Empty state
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "#222",
      }}
    />
  );
}

/* YouTube helper: returns embed URL with autoplay muted & loop */
function toYouTubeEmbed(url: string) {
  try {
    const u = new URL(url);
    let id = "";
    if (u.hostname.includes("youtu.be")) {
      id = u.pathname.replace("/", "");
    } else if (u.hostname.includes("youtube.com")) {
      id = u.searchParams.get("v") || "";
      // also support /embed/ID
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
      playlist: id, // required for proper loop on YT
      rel: "0",
      modestbranding: "1",
    }).toString();
    return `https://www.youtube.com/embed/${id}?${params}`;
  } catch {
    return null;
  }
}
