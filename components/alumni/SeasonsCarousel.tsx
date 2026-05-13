"use client";

import { useEffect, useRef, useState } from "react";
import { seasons } from "@/lib/seasonData";
import SeasonCard from "./SeasonCard";

export default function SeasonsCarousel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  // Pause auto-scroll while the user is touching the carousel
  const [isTouching, setIsTouching] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const SCROLL_SPEED = 0.8; // pixels per frame
  const AUTOSCROLL_INTERVAL = 16; // ~60fps

  // Auto-scroll logic — pauses on hover OR touch
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let scrollInterval: NodeJS.Timeout | null = null;

    const startScroll = () => {
      if (scrollInterval) return;
      scrollInterval = setInterval(() => {
        if (!isHovered && !isTouching) {
          container.scrollLeft += SCROLL_SPEED;
          if (
            container.scrollLeft >=
            container.scrollWidth - container.clientWidth
          ) {
            container.scrollLeft = 0; // Infinite loop
          }
        }
      }, AUTOSCROLL_INTERVAL);
    };

    startScroll();

    return () => {
      if (scrollInterval) clearInterval(scrollInterval);
    };
  }, [isHovered, isTouching]);

  const scrollByAmount = (amount: number) => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  // Touch swipe: record start position, then on release calculate delta and scroll
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setIsTouching(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsTouching(false);
    if (touchStartX.current === null) return;
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    // Only trigger a programmatic scroll for deliberate swipes (>40px)
    if (Math.abs(dx) > 40) {
      scrollByAmount(dx * 1.5);
    }
    touchStartX.current = null;
  };

  return (
    <section
      style={{
        position: "relative",
        backgroundColor: "#6C00AF",
        padding: "1rem 0",
        overflow: "hidden",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Title */}
      <h2
        style={{
          fontFamily: "var(--font-anton), system-ui, sans-serif",
          fontSize: "clamp(2.5rem, 6.5vw, 6rem)",
          fontWeight: 400,
          color: "#F23359",
          textAlign: "center",
          marginBottom: "2.5rem",
          marginTop: "0rem",
          letterSpacing: "2px",
        }}
      >
        EXPLORE OUR SEASONS
      </h2>

      {/* Timeline Line */}
      <div
        style={{
          position: "absolute",
          top: "40%",
          left: 0,
          width: "100%",
          height: "3px",
          backgroundColor: "#FFCC00",
          opacity: 0.8,
          zIndex: 0,
        }}
      />

      {/* Carousel Container */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          display: "flex",
          // Tighter gap on mobile so more of the next card peeks in
          gap: "clamp(16px, 4vw, 48px)",
          overflowX: "auto",
          scrollBehavior: "smooth",
          scrollbarWidth: "none",
          // Fixed 4rem side padding was 128px on a 375px screen — replaced with
          // clamp so mobile gets ~1rem and desktop retains the original 4rem.
          padding: "2rem clamp(1rem, 5vw, 4rem)",
        }}
      >
        {seasons.map((s) => (
          <div
            key={s.slug}
            style={{
              flex: "0 0 auto",
              width: "min(380px, 85vw)",
              backgroundColor: "#241123",
              borderRadius: "10px",
              boxShadow: "0px 4px 12px rgba(0,0,0,0.2)",
              padding: "1rem",
              position: "relative",
              zIndex: 1,
              transition: "transform 0.3s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "scale(1.1)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "scale(1)";
            }}
          >
            <SeasonCard
              slug={s.slug}
              seasonTitle={s.seasonTitle}
              years={s.years}
              projects={s.projects}
            />
          </div>
        ))}

        {/* Duplicate first few for infinite loop effect */}
        {seasons.slice(0, 3).map((s) => (
          <div
            key={`dup-${s.slug}`}
            style={{
              flex: "0 0 auto",
              width: "min(380px, 85vw)",
              backgroundColor: "#241123",
              borderRadius: "10px",
              boxShadow: "0px 4px 12px rgba(0,0,0,0.2)",
              padding: "1rem",
              position: "relative",
              zIndex: 1,
            }}
          >
            <SeasonCard
              slug={s.slug}
              seasonTitle={s.seasonTitle}
              years={s.years}
              projects={s.projects}
            />
          </div>
        ))}
      </div>

      {/* Elegant Arrows */}
      <button
        onClick={() => scrollByAmount(-400)}
        style={arrowStyle("left")}
        aria-label="Scroll Left"
      >
        ‹
      </button>
      <button
        onClick={() => scrollByAmount(400)}
        style={arrowStyle("right")}
        aria-label="Scroll Right"
      >
        ›
      </button>
    </section>
  );
}

function arrowStyle(position: "left" | "right") {
  return {
    position: "absolute" as const,
    top: "47%",
    [position]: "2%",
    transform: "translateY(-50%)",
    backgroundColor: "#FFCC00",
    color: "#241123",
    border: "none",
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    fontSize: "2.5rem",
    fontWeight: 600,
    cursor: "pointer",
    zIndex: 2,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0px 4px 10px rgba(0,0,0,0.3)",
    transition: "all 0.3s ease",
    opacity: 0.7,
  };
}
