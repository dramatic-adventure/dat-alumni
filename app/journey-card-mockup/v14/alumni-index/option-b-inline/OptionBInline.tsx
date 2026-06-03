// app/journey-card-mockup/v14/alumni-index/option-b-inline/OptionBInline.tsx
// ⚠️  MOCKUP ONLY — review-grade design exploration. No live data.

"use client";

import Image from "next/image";
import JourneyCardCover from "../JourneyCardCover";
import { A, SAMPLE_ALUM, SAMPLE_JOURNEYS } from "../sampleJourneys";
import MockupChrome from "../MockupChrome";

export default function OptionBInline() {
  return (
    <>
      <MockupChrome active="option-b-inline" />

      <main style={{
        backgroundColor: A.paper, minHeight: "100vh",
        padding: "32px 0 96px",
      }}>
        {/* ── Faux profile header (just enough context) ───────────────── */}
        <header style={{
          width: "100%", maxWidth: 1100, margin: "0 auto 36px",
          padding: "0 clamp(16px, 4vw, 48px)",
          display: "flex", alignItems: "center", gap: 22,
        }}>
          <div style={{
            width: 84, height: 104, position: "relative",
            border: `1px solid ${A.border}`, borderRadius: 4,
            overflow: "hidden", flexShrink: 0,
          }}>
            <Image
              src={SAMPLE_ALUM.headshot}
              alt={SAMPLE_ALUM.name}
              fill sizes="168px" quality={92}
              style={{ objectFit: "cover", objectPosition: "center 12%" }}
            />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontWeight: 700, fontSize: 10, letterSpacing: "0.28em",
              textTransform: "uppercase", color: A.pink, margin: "0 0 6px",
            }}>
              Alumni profile · /alumni/{SAMPLE_ALUM.slug}
            </p>
            <h1 style={{
              fontFamily: "var(--font-anton), system-ui, sans-serif",
              fontSize: "clamp(34px, 5vw, 52px)", lineHeight: 0.95,
              letterSpacing: "0.005em", textTransform: "uppercase",
              color: A.ink, margin: "0 0 4px",
            }}>
              {SAMPLE_ALUM.name}
            </h1>
            <p style={{
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              fontSize: 13, color: A.teal, margin: 0, fontWeight: 600,
            }}>
              Traveling {SAMPLE_ALUM.bylineRoles.join(" · ")}
            </p>
          </div>
        </header>

        {/* ── Inline Journeys section ─────────────────────────────────── */}
        <section style={{
          width: "100%", maxWidth: 1280, margin: "0 auto",
          padding: "0 clamp(16px, 4vw, 48px)",
        }}>
          {/* Section header — same shape used by other gallery sections */}
          <div style={{
            display: "flex", alignItems: "baseline", justifyContent: "space-between",
            gap: 24, marginBottom: 18,
            borderBottom: `1px solid ${A.border}`, paddingBottom: 10,
          }}>
            <div style={{ minWidth: 0 }}>
              <p style={{
                fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                fontWeight: 700, fontSize: 10, letterSpacing: "0.28em",
                textTransform: "uppercase", color: A.teal, margin: "0 0 6px",
              }}>
                Section
              </p>
              <h2 style={{
                fontFamily: "var(--font-anton), system-ui, sans-serif",
                fontSize: "clamp(28px, 3.5vw, 38px)", lineHeight: 1,
                letterSpacing: "0.01em", textTransform: "uppercase",
                color: A.ink, margin: 0,
              }}>
                Journeys
              </h2>
            </div>
            <p style={{
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              fontSize: 13, color: A.muted, margin: 0, fontStyle: "italic",
              textAlign: "right", flexShrink: 0,
            }}>
              {SAMPLE_JOURNEYS.length} programs · {
                SAMPLE_JOURNEYS.reduce((s, j) => s + j.chapters, 0)
              } chapters
            </p>
          </div>

          <p style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontSize: 15, color: A.ink, opacity: 0.78, lineHeight: 1.6,
            maxWidth: 640, margin: "0 0 22px",
          }}>
            Every DAT program {SAMPLE_ALUM.name} has traveled with — each as its
            own passport-book journey card. Swipe through, or open one to read
            the full chapter set.
          </p>

          {/* Horizontal scroll-snap rail */}
          <div style={{
            display: "flex", gap: 22, overflowX: "auto", overflowY: "visible",
            scrollSnapType: "x mandatory", padding: "8px 0 24px",
            WebkitOverflowScrolling: "touch",
          }}>
            {SAMPLE_JOURNEYS.map((j) => (
              <div
                key={j.slug}
                style={{
                  scrollSnapAlign: "start",
                  display: "flex", flexDirection: "column", gap: 12,
                  flexShrink: 0, width: 260,
                }}
              >
                <JourneyCardCover journey={j} size="md" />
                <div style={{ padding: "0 4px" }}>
                  <p style={{
                    fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                    fontWeight: 700, fontSize: 10, letterSpacing: "0.22em",
                    textTransform: "uppercase", color: A.teal, margin: "0 0 4px",
                  }}>
                    {j.year}
                  </p>
                  <p style={{
                    fontFamily: "var(--font-anton), system-ui, sans-serif",
                    fontSize: 18, lineHeight: 1.05,
                    textTransform: "uppercase", color: A.ink,
                    margin: "0 0 4px", letterSpacing: "0.01em",
                  }}>
                    {j.program} · {j.country}
                  </p>
                  <p style={{
                    fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                    fontSize: 12, color: A.muted, margin: 0, lineHeight: 1.4,
                  }}>
                    {j.primaryRole}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Subtle "see all" link */}
          <div style={{ paddingTop: 6 }}>
            <a href="/journey-card-mockup/v14/alumni-index/option-a-index" style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontWeight: 700, fontSize: 11, letterSpacing: "0.18em",
              textTransform: "uppercase", textDecoration: "none",
              color: A.pink,
            }}>
              See all journeys ›
            </a>
          </div>
        </section>

        {/* ── Adjacent placeholder section (so reviewers can feel how the
                 inline rail sits inside a profile page) ───────────────── */}
        <section style={{
          width: "100%", maxWidth: 1100, margin: "56px auto 0",
          padding: "0 clamp(16px, 4vw, 48px)",
        }}>
          <div style={{
            border: `1px dashed ${A.border}`, borderRadius: 6,
            padding: "18px 22px", color: A.muted,
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontSize: 13, lineHeight: 1.6,
          }}>
            ↑ Imagine this section embedded between the existing profile
            sections (Artist Statement, What I&rsquo;m Up To, Photo Gallery).
            It re-uses the gallery rhythm reviewers already know.
          </div>
        </section>
      </main>
    </>
  );
}
