// app/story-map/page.tsx
import Image from "next/image";
import StoryMapClient from "@/components/map/StoryMapClient";
import StatsStrip from "@/components/shared/StatsStrip";
import JoinTheJourneyPanel from "@/components/shared/JoinTheJourneyPanel";


export const metadata = { title: "Story Map | Dramatic Adventure Theatre" };

export default function StoryMapPage() {
  return (
    <main className="w-full">
      {/* Overlap styles (pure CSS) */}
      <style>{`
        .overlap-stack { position: relative; width: 100%; }
        .impact-underlay {
          position: absolute; inset: 0; z-index: 0; pointer-events: none;
          display: flex; align-items: flex-start; justify-content: center;
          padding-top: 2.9rem; /* mobile default */
        }
        @media (min-width: 768px) { .impact-underlay { padding-top: 2rem; } }
        @media (min-width: 1280px) { .impact-underlay { padding-top: 1.2rem; } }
        .impact-underlay-inner { width: 100%; max-width: none; margin: 0 auto; text-align: center; }
      `}</style>

      {/* ✅ HERO */}
      <section
        style={{
          position: "relative",
          width: "100%",
          height: "75vh",
          boxShadow: "0px 0px 33px rgba(0,0,0,0.5)",
        }}
      >
        <Image
          src="/images/Andean_Mask_Work.jpg"
          alt="Alumni Directory Hero"
          fill
          priority
          className="object-cover object-center"
        />

        <div style={{ position: "absolute", bottom: "4vw", right: "5%" }}>
          <h1
            style={{
              fontFamily: "Anton, sans-serif",
              margin: 0,
              lineHeight: 1.0,
              textTransform: "uppercase",
              textShadow: "0 8px 20px rgba(0,0,0,0.8)",
            }}
          >
            <span
              style={{
                display: "block",
                color: "#FFCC00",
                opacity: 0.9,
                fontSize: "clamp(4rem, 12vw, 10rem)",
                textAlign: "right",
              }}
            >
              20 YEARS
            </span>
            <span
              style={{
                display: "block",
                color: "#d9a919",
                opacity: 0.9,
                fontSize: "clamp(2.6rem, 9.6vw, 6rem)",
                textAlign: "right",
              }}
            >
              OF THEATRE
            </span>
          </h1>

          <h4
            style={{
              fontFamily: "Space Grotesk, sans-serif",
              margin: 0,
              lineHeight: 1.2,
              textShadow: "0 3px 9px rgba(0,0,0,1.8)",
            }}
          >
            <span
              style={{
                display: "block",
                color: "#f2f2f2",
                opacity: 0.75,
                fontSize: "clamp(1.2rem, 2.2vw, 1.8rem)",
                textAlign: "right",
              }}
            >
              rehearsing in the wild,<br />
              building stories in the margins,<br />
              and making art that moves.
            </span>
          </h4>
        </div>
      </section>

      {/* ==== Overlapped heading + map (heading is under the map) ==== */}
      <section className="overlap-stack">
        {/* Underlay heading (no layout height; sits behind the map) */}
        <div className="impact-underlay">
          <div className="impact-underlay-inner">
            <h2
              style={{
                fontFamily: "Anton, sans-serif",
                fontSize: "clamp(2rem, 7.5vw, 8rem)",
                opacity: 0.75,
                textTransform: "uppercase",
                color: "#241123",
                margin: 0,
              }}
            >
              Explore our Global Impact
            </h2>
          </div>
        </div>

        {/* Map overlays the heading and defines the section height */}
        <div className="map-overlay">
          <StoryMapClient initialZoom={1.5} />
        </div>
      </section>

      {/* ✅ STATS under the StoryMap */}
      <StatsStrip />

<JoinTheJourneyPanel />

      {/* Footer */}
      <footer className="w-full text-white" style={{ backgroundColor: "#0b0b0b" }} />
    </main>
  );
}
