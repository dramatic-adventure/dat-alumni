// app/journey-card-mockup/v14/alumni-index/option-a-index/OptionAIndex.tsx
// ⚠️  MOCKUP ONLY — review-grade design exploration. No live data.

"use client";

import Image from "next/image";
import JourneyCardCover from "../JourneyCardCover";
import { A, SAMPLE_ALUM, SAMPLE_JOURNEYS, accentColor } from "../sampleJourneys";
import MockupChrome from "../MockupChrome";

export default function OptionAIndex() {
  return (
    <>
      <MockupChrome active="option-a-index" />

      <main style={{
        backgroundColor: A.paper, minHeight: "100vh",
        padding: "32px clamp(16px, 4vw, 64px) 96px",
        display: "flex", flexDirection: "column", alignItems: "center",
      }}>
        {/* ── Editorial header ─────────────────────────────────────────── */}
        <header style={{
          width: "100%", maxWidth: 1100,
          display: "grid",
          gridTemplateColumns: "minmax(0,1fr) auto",
          gap: 28,
          alignItems: "end",
          padding: "12px 0 24px",
          borderBottom: `1px solid ${A.border}`,
          marginBottom: 40,
        }}>
          <div>
            <p style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontWeight: 700, fontSize: 11, letterSpacing: "0.28em",
              textTransform: "uppercase", color: A.pink, margin: "0 0 14px",
            }}>
              Dramatic Adventure Theatre · Journeys
            </p>
            <h1 style={{
              fontFamily: "var(--font-anton), system-ui, sans-serif",
              fontSize: "clamp(48px, 7.5vw, 88px)", lineHeight: 0.92,
              letterSpacing: "0.005em", textTransform: "uppercase",
              color: A.ink, margin: "0 0 14px",
            }}>
              {SAMPLE_ALUM.name}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 12, maxWidth: 540 }}>
              <span style={{
                display: "inline-block", width: 28, height: 2,
                backgroundColor: A.pink, borderRadius: 1, flexShrink: 0,
              }} />
              <p style={{
                fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                fontStyle: "italic", fontSize: "clamp(16px, 2vw, 22px)",
                color: A.ink, opacity: 0.82, margin: 0, lineHeight: 1.25,
              }}>
                Four journeys · three programs · the long thread of one practice.
              </p>
            </div>
          </div>

          <a href={`/alumni/${SAMPLE_ALUM.slug}`} style={{
            display: "block", textDecoration: "none",
            width: 110, height: 138, position: "relative",
            border: `1px solid ${A.border}`, borderRadius: 4,
            overflow: "hidden", flexShrink: 0,
          }}>
            <Image
              src={SAMPLE_ALUM.headshot}
              alt={SAMPLE_ALUM.name}
              fill sizes="220px" quality={92}
              style={{ objectFit: "cover", objectPosition: "center 12%" }}
            />
          </a>
        </header>

        {/* ── Index list ──────────────────────────────────────────────── */}
        <section style={{ width: "100%", maxWidth: 1100, display: "flex", flexDirection: "column", gap: 40 }}>
          {SAMPLE_JOURNEYS.map((j, idx) => {
            const accent = accentColor(j.accent);
            return (
              <article key={j.slug} style={{
                display: "grid",
                gridTemplateColumns: "minmax(220px, 280px) 1fr",
                gap: "clamp(20px, 4vw, 48px)",
                alignItems: "stretch",
                paddingBottom: idx === SAMPLE_JOURNEYS.length - 1 ? 0 : 36,
                borderBottom: idx === SAMPLE_JOURNEYS.length - 1 ? "none" : `1px solid ${A.sep}`,
              }}>
                {/* Passport cover */}
                <div style={{ display: "flex", alignItems: "flex-start" }}>
                  <JourneyCardCover journey={j} size="md" />
                </div>

                {/* Editorial copy */}
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0 }}>
                  <p style={{
                    fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                    fontWeight: 700, fontSize: 11, letterSpacing: "0.28em",
                    textTransform: "uppercase", color: A.teal, margin: "0 0 6px",
                  }}>
                    {String(idx + 1).padStart(2, "0")} · {j.year}
                  </p>

                  <h2 style={{
                    fontFamily: "var(--font-anton), system-ui, sans-serif",
                    fontSize: "clamp(28px, 4vw, 44px)", lineHeight: 0.96,
                    letterSpacing: "0.01em", textTransform: "uppercase",
                    color: A.ink, margin: "0 0 6px",
                  }}>
                    {j.program} · {j.country}
                  </h2>

                  <p style={{
                    fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                    fontSize: 13, color: A.muted, margin: "0 0 16px",
                  }}>
                    {j.dates} · {j.chapters} chapters
                  </p>

                  <div style={{
                    display: "flex", gap: 14, margin: "0 0 18px", maxWidth: 640,
                  }}>
                    <span style={{
                      display: "inline-block", width: 3, alignSelf: "stretch",
                      backgroundColor: accent, flexShrink: 0, borderRadius: 1,
                    }} />
                    <p style={{
                      fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                      fontStyle: "italic", fontSize: 17, lineHeight: 1.55,
                      color: A.ink, opacity: 0.85, margin: 0,
                    }}>
                      &ldquo;{j.pullQuote}&rdquo;
                    </p>
                  </div>

                  <p style={{
                    fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                    fontSize: 12, color: A.teal, margin: "0 0 14px", fontWeight: 600,
                  }}>
                    {j.primaryRole}
                  </p>

                  <a href={j.href} style={{
                    alignSelf: "flex-start",
                    display: "inline-flex", alignItems: "center", gap: 8,
                    fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                    fontWeight: 800, fontSize: 11, letterSpacing: "0.18em",
                    textTransform: "uppercase", textDecoration: "none",
                    color: "#fff", backgroundColor: A.pink,
                    padding: "10px 18px", borderRadius: 999,
                    boxShadow: "0 4px 14px rgba(242,51,89,0.35)",
                  }}>
                    Open journey card ›
                  </a>
                </div>
              </article>
            );
          })}
        </section>
      </main>
    </>
  );
}
