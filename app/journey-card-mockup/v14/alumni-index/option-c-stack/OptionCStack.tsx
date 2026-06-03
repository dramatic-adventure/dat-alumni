// app/journey-card-mockup/v14/alumni-index/option-c-stack/OptionCStack.tsx
// ⚠️  MOCKUP ONLY — review-grade design exploration. No live data.

"use client";

import { useState } from "react";
import JourneyCardCover from "../JourneyCardCover";
import { A, SAMPLE_ALUM, SAMPLE_JOURNEYS, accentColor } from "../sampleJourneys";
import MockupChrome from "../MockupChrome";

// Newest first, slight fan to the left as the stack deepens.
const FAN_DEG = [0, -7, -13, -19];
const OFFSET  = [0, 18, 36, 54]; // px down-right offset per layer

export default function OptionCStack() {
  const [activeIdx, setActiveIdx] = useState(0);

  // Re-order so activeIdx is the topmost card (last in z-order).
  const stack = [...SAMPLE_JOURNEYS]
    .map((j, i) => ({ j, i }))
    .sort((a, b) => {
      if (a.i === activeIdx) return  1;
      if (b.i === activeIdx) return -1;
      return a.i - b.i;
    });

  const active = SAMPLE_JOURNEYS[activeIdx];
  const accent = accentColor(active.accent);

  return (
    <>
      <MockupChrome active="option-c-stack" />

      <main style={{
        backgroundColor: A.paper, minHeight: "100vh",
        padding: "36px clamp(16px, 4vw, 64px) 96px",
      }}>
        {/* ── Header ──────────────────────────────────────────────────── */}
        <header style={{
          width: "100%", maxWidth: 1180, margin: "0 auto 30px",
        }}>
          <p style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontWeight: 700, fontSize: 11, letterSpacing: "0.28em",
            textTransform: "uppercase", color: A.pink, margin: "0 0 8px",
          }}>
            {SAMPLE_ALUM.name} · {SAMPLE_JOURNEYS.length} DAT Journeys
          </p>
          <h1 style={{
            fontFamily: "var(--font-anton), system-ui, sans-serif",
            fontSize: "clamp(40px, 6vw, 68px)", lineHeight: 0.94,
            letterSpacing: "0.005em", textTransform: "uppercase",
            color: A.ink, margin: 0,
          }}>
            The Passport Stack
          </h1>
        </header>

        {/* ── Stack + editorial column ────────────────────────────────── */}
        <section style={{
          width: "100%", maxWidth: 1180, margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "minmax(320px, 380px) 1fr",
          gap: "clamp(28px, 6vw, 80px)",
          alignItems: "center",
        }}>
          {/* The stack */}
          <div style={{
            position: "relative",
            width: 320, height: 540,
            margin: "0 auto",
          }}>
            {stack.map(({ j, i }, layerIdx) => {
              const depth = stack.length - 1 - layerIdx; // 0 = topmost
              const rot   = i === activeIdx ? 0 : FAN_DEG[Math.min(depth, FAN_DEG.length - 1)];
              const dx    = i === activeIdx ? 0 : OFFSET[Math.min(depth, OFFSET.length - 1)];
              return (
                <button
                  key={j.slug}
                  type="button"
                  onClick={() => setActiveIdx(i)}
                  style={{
                    position: "absolute",
                    top: dx, left: -dx,
                    background: "none", border: "none", padding: 0,
                    cursor: i === activeIdx ? "default" : "pointer",
                    zIndex: layerIdx + 1,
                    transition: "transform 280ms cubic-bezier(0.4, 0, 0.2, 1), top 280ms, left 280ms",
                    transform: `rotate(${rot}deg)`,
                    transformOrigin: "center 70%",
                    filter: i === activeIdx ? undefined : "saturate(0.92) brightness(0.97)",
                  }}
                  aria-label={`Bring ${j.program} ${j.country} ${j.year} to the front`}
                >
                  <JourneyCardCover
                    journey={j}
                    size="md"
                    elevated={i === activeIdx}
                  />
                </button>
              );
            })}
          </div>

          {/* Active-journey caption */}
          <div style={{ minWidth: 0 }}>
            <p style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontWeight: 700, fontSize: 11, letterSpacing: "0.28em",
              textTransform: "uppercase", color: A.teal, margin: "0 0 8px",
            }}>
              Selected · {active.year}
            </p>
            <h2 style={{
              fontFamily: "var(--font-anton), system-ui, sans-serif",
              fontSize: "clamp(34px, 5vw, 56px)", lineHeight: 0.94,
              letterSpacing: "0.01em", textTransform: "uppercase",
              color: A.ink, margin: "0 0 8px",
            }}>
              {active.program} · {active.country}
            </h2>
            <p style={{
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              fontSize: 14, color: A.muted, margin: "0 0 22px",
            }}>
              {active.dates} · {active.chapters} chapters
            </p>

            <div style={{
              display: "flex", gap: 14, margin: "0 0 22px", maxWidth: 560,
            }}>
              <span style={{
                display: "inline-block", width: 3, alignSelf: "stretch",
                backgroundColor: accent, flexShrink: 0, borderRadius: 1,
              }} />
              <p style={{
                fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                fontStyle: "italic", fontSize: 19, lineHeight: 1.5,
                color: A.ink, opacity: 0.85, margin: 0,
              }}>
                &ldquo;{active.pullQuote}&rdquo;
              </p>
            </div>

            <p style={{
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              fontSize: 13, color: A.teal, margin: "0 0 22px", fontWeight: 600,
            }}>
              {active.primaryRole}
            </p>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <a href={active.href} style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                fontWeight: 800, fontSize: 11, letterSpacing: "0.18em",
                textTransform: "uppercase", textDecoration: "none",
                color: "#fff", backgroundColor: A.pink,
                padding: "11px 20px", borderRadius: 999,
                boxShadow: "0 4px 14px rgba(242,51,89,0.4)",
              }}>
                Open the journey
              </a>

              {/* Quick journey-switcher */}
              <div role="tablist" style={{ display: "flex", gap: 6, alignItems: "center", paddingLeft: 8 }}>
                {SAMPLE_JOURNEYS.map((j, i) => (
                  <button
                    key={j.slug}
                    type="button"
                    role="tab"
                    aria-selected={i === activeIdx}
                    onClick={() => setActiveIdx(i)}
                    style={{
                      width: i === activeIdx ? 28 : 9, height: 9,
                      border: "none", borderRadius: 5, cursor: "pointer",
                      padding: 0,
                      backgroundColor: i === activeIdx ? A.ink : A.dim,
                      transition: "width 220ms ease, background-color 180ms ease",
                    }}
                    title={`${j.program} · ${j.country} · ${j.year}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
