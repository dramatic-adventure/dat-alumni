// =============================================
// Story Map – Faithful Migration for Next.js
// =============================================
// Notes (read first):
// • Behavior & aesthetics are preserved from your standalone version.
// • Mapbox token is read from process.env.NEXT_PUBLIC_MAPBOX_TOKEN (add to .env.local)
// • Cluster radius, maxZoom, popup HTML, search animation, and event logic are identical.
// • The CSS rules that hid Mapbox attribution/logo are also included to keep the look the same.
// (We can revert that if you prefer to show attribution.)
// • Route path: /story-map


// app/story-map/page.tsx
import StoryMap from "@/components/map/StoryMap";

export const metadata = { title: "Story Map | Dramatic Adventure Theatre" };

export default function StoryMapPage() {
  return (
    <main className="w-full">
      {/* Headline panel */}
      <section className="w-full text-white" style={{ backgroundColor: "#0b0b0b" }}>
        <div className="mx-auto max-w-6xl px-6 py-10 md:py-14">
          <h1
            style={{ fontFamily: "Anton, sans-serif", color: "#FFCC00" }}
            className="leading-none text-[16vw] md:text-[8rem]"
          >
            20 YEARS
          </h1>

          <div
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            className="text-3xl md:text-4xl italic mt-1"
          >
            of
          </div>

          <div
            style={{ fontFamily: "Anton, sans-serif" }}
            className="mt-2 leading-[0.9] text-[18vw] md:text-[10rem]"
          >
            THEATRE
          </div>

          {/* script lines */}
          <div className="mt-2">
            <div
              style={{ fontFamily: "'Rock Salt', cursive", color: "#F23359" }}
              className="text-xl md:text-2xl pl-[6ch]"
            >
              that
            </div>
            <div
              style={{ fontFamily: "'Rock Salt', cursive", color: "#F23359" }}
              className="text-xl md:text-2xl pl-[2ch] -mt-1"
            >
              and
            </div>
          </div>

          <div
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            className="mt-3 uppercase tracking-wide text-2xl md:text-3xl"
          >
            FEEDS THE FIRE
          </div>
          <div
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            className="uppercase tracking-wide text-2xl md:text-3xl"
          >
            SINGS TO THE MOUNTAINS
          </div>
        </div>
      </section>

      {/* Map */}
      <StoryMap />

      {/* Footer */}
      <footer className="w-full text-white" style={{ backgroundColor: "#0b0b0b" }}>
        <div className="mx-auto max-w-6xl px-6 py-8 text-sm opacity-80">
          © Dramatic Adventure Theatre · All rights reserved
        </div>
      </footer>
    </main>
  );
}
