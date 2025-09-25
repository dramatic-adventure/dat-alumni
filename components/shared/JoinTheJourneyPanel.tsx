// components/shared/JoinTheJourneyPanel.tsx
"use client";

import { useEffect, useState } from "react";
import Lightbox from "@/components/shared/Lightbox";

const IMAGE_URLS = [
  "/images/performing-zanzibar.jpg",
  "/images/rehearsing-nitra.jpg",
  "/images/teaching-amazon.jpg",
  "/images/teaching-andes.jpg",
];

export default function JoinTheJourneyPanel() {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [startIndex, setStartIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const MAX_CARD_HEIGHT = 560; // lifesize cap

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Fan layout: a bit tighter on mobile
  const rotations = isMobile ? [-10, -3, 7, 14] : [-12, -4, 6, 15];
  const xOffsets  = isMobile ? [-90, -30, 30, 90] : [-160, -70, 45, 130];
  const zOrder    = [10, 20, 30, 40];

  const openLightbox = (i: number) => {
    setStartIndex(i);
    setLightboxOpen(true);
  };

  // Centered container, clamped at 70vw; overflow allowed for the fanned edges.
  const containerStyles: React.CSSProperties = {
    margin: "2rem auto 2.75rem", // spacing above/below the pile
    width: "min(70vw, 1100px)",
    height: isMobile ? "clamp(300px, 70vw, 560px)" : "clamp(240px, 50vw, 560px)",
    overflow: "visible",
    position: "relative",
  };

  return (
    <section
      className="relative text-center px-6 py-16 md:py-20"
      style={{
        backgroundImage: "url('/images/kraft-texture.png')",
        backgroundSize: "cover",
        backgroundRepeat: "repeat",
        overflow: "visible",
      }}
    >
      <div className="mx-auto max-w-6xl" style={{ overflow: "visible" }}>
        {/* Centered fan container (70vw cap) */}
        <div className="jj-pile" style={containerStyles} aria-label="DAT photo pile" role="region">
          {IMAGE_URLS.map((src, i) => {
            const rotation = rotations[i % rotations.length];
            const dx = xOffsets[i % xOffsets.length];
            const z = zOrder[i % zOrder.length];

            return (
              <button
                key={`${src}-${i}`}
                onClick={() => openLightbox(i)}
                aria-label={`Open image ${i + 1}`}
                style={{
                  position: "absolute",
                  top: 0,
                  left: "50%",
                  height: "100%",
                  aspectRatio: isMobile ? "2 / 3" : "3 / 2", // mobile portrait, desktop landscape
                  width: "auto",
                  transform: `translateX(-50%) translateX(${dx}px) rotate(${rotation}deg)`,
                  zIndex: z,
                  border: "none",
                  padding: 0,
                  background: "transparent",
                  cursor: "pointer",
                  transition: "transform 180ms ease, box-shadow 180ms ease, z-index 0s",
                  overflow: "visible",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.transform = `translateX(-50%) translateX(${dx}px) rotate(0deg) translateY(-4px) scale(1.02)`;
                  el.style.zIndex = "99";
                  const sheen = el.querySelector(".sheen") as HTMLDivElement | null;
                  if (sheen) sheen.style.opacity = "0.28";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.transform = `translateX(-50%) translateX(${dx}px) rotate(${rotation}deg)`;
                  el.style.zIndex = String(z);
                  const sheen = el.querySelector(".sheen") as HTMLDivElement | null;
                  if (sheen) sheen.style.opacity = "0";
                }}
              >
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    boxShadow: "0 18px 48px rgba(0,0,0,0.38)",
                    background: "#111",
                    borderRadius: 0, // crisp photo edges
                  }}
                >
                  <img
                    src={src}
                    alt="DAT program still"
                    draggable={false}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                      userSelect: "none",
                      pointerEvents: "none",
                      borderRadius: 0,
                      maxHeight: `${MAX_CARD_HEIGHT}px`,
                    }}
                  />
                  {/* Sheen pinned perfectly to each photo */}
                  <div
                    className="sheen"
                    style={{
                      position: "absolute",
                      inset: 0,
                      pointerEvents: "none",
                      background:
                        "linear-gradient(110deg, rgba(255,255,255,0.00) 18%, rgba(255,255,255,0.55) 34%, rgba(255,255,255,0.10) 48%, rgba(255,255,255,0.00) 62%)",
                      opacity: 0,
                      transition: "opacity 160ms ease",
                      borderRadius: 0,
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Headline — remove spacing underneath */}
        <h2
          className="leading-[0.95] text-black"
          style={{
            fontFamily: "Anton, sans-serif",
            textTransform: "uppercase",
            fontWeight: 800,
            letterSpacing: "0.02em",
            color: "#241123",
            opacity: 0.9, 
            fontSize: "clamp(2.25rem, 6vw, 6rem)",
            padding: "1rem 0.5rem",
            marginBottom: 0, // ← no spacing under headline
          }}
        >
          Join the Journey
        </h2>

        {/* Subtext — Space Grotesk (kept tight) */}
        <p
          className="mx-auto max-w-3xl text-base md:text-xl text-white/85"
          style={{ fontFamily: "Space Grotesk, sans-serif", color: "#f2f2f2", opacity: 0.8, marginTop: "0.25rem", marginBottom: "1.25rem" }}
        >
          Ready to create the next story? Join us on the road, perform with us, or help inspire a child.
        </p>

        {/* Buttons — DAT Purple with your formatting; add spacing under last button */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5" style={{ marginBottom: "2.5rem" }}>
          <a
            href="/submit-your-story"
            style={{
              fontFamily: '"Space Grotesk", sans-serif',
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.35rem",
              fontSize: "1.1rem",
              color: "#f2f2f2",
              backgroundColor: "#6c00af", // DAT Purple
              padding: "12px 30px",
              border: "none",
              borderRadius: "12px",
              cursor: "pointer",
              transition: "opacity 0.2s ease-in-out",
              display: "inline-block",
              textDecoration: "none",
              whiteSpace: "nowrap",
              marginTop: "1rem",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Submit Your Story
          </a>
          <br />
          <a
            href="/get-involved"
            style={{
              fontFamily: '"Space Grotesk", sans-serif',
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.35rem",
              fontSize: "1.1rem",
              color: "#f2f2f2",
              backgroundColor: "#6c00af", // DAT Purple
              padding: "12px 30px",
              border: "none",
              borderRadius: "12px",
              cursor: "pointer",
              transition: "opacity 0.2s ease-in-out",
              display: "inline-block",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Get Involved
          </a>
          <br />
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <Lightbox
          images={IMAGE_URLS}
          startIndex={startIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </section>
  );
}
