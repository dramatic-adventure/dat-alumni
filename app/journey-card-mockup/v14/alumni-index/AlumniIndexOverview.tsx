// app/journey-card-mockup/v14/alumni-index/AlumniIndexOverview.tsx
// ⚠️  MOCKUP ONLY — review-grade landing for the three options.

"use client";

import JourneyCardCover from "./JourneyCardCover";
import { A, SAMPLE_ALUM, SAMPLE_JOURNEYS } from "./sampleJourneys";
import MockupChrome from "./MockupChrome";

type Option = {
  id:    string;
  letter: "A" | "B" | "C";
  title: string;
  href:  string;
  blurb: string;
  pros:  string[];
  cons:  string[];
};

const OPTIONS: Option[] = [
  {
    id:    "option-a-index",
    letter: "A",
    title: "Editorial Index",
    href:  "/journey-card-mockup/v14/alumni-index/option-a-index",
    blurb:
      "A dedicated /alumni/[slug]/journeys page. Reads like a magazine table of contents — passport cover, dates, pull quote, and a clear way in.",
    pros:  [
      "Each journey gets editorial breathing room.",
      "Scales to ten+ journeys without crowding the profile.",
      "Doubles as a sharable career index.",
    ],
    cons:  [
      "New URL & nav slot to maintain.",
      "Doesn't help alumni who only ever visit the main profile.",
    ],
  },
  {
    id:    "option-b-inline",
    letter: "B",
    title: "Inline Profile Rail",
    href:  "/journey-card-mockup/v14/alumni-index/option-b-inline",
    blurb:
      "A horizontal scroll-snap rail of passport covers, dropped into the existing alumni profile next to the photo gallery and Journey carousel.",
    pros:  [
      "Lives where alumni already look — no extra navigation.",
      "Re-uses the gallery rhythm reviewers already know.",
      "Cheapest to wire up next to existing JourneyCardCarousel.",
    ],
    cons:  [
      "Can feel cramped when alumni have 6+ journeys.",
      "Less premium-editorial than Option A.",
    ],
  },
  {
    id:    "option-c-stack",
    letter: "C",
    title: "Passport Stack",
    href:  "/journey-card-mockup/v14/alumni-index/option-c-stack",
    blurb:
      "A tactile fanned stack of passport-books on the left, with the selected journey's editorial caption on the right. Clicking any card promotes it to the top.",
    pros:  [
      "Most distinctive — leans into the passport-as-artifact metaphor.",
      "Reinforces the V14 visual language at the profile level.",
      "Great hero treatment for marketing screenshots.",
    ],
    cons:  [
      "More design overhead to get right at every breakpoint.",
      "Pure visual; needs an obvious affordance for screen readers / keyboard.",
    ],
  },
];

export default function AlumniIndexOverview() {
  return (
    <>
      <MockupChrome active="index" />

      <main style={{
        backgroundColor: A.paper, minHeight: "100vh",
        padding: "36px clamp(16px, 4vw, 64px) 96px",
      }}>
        {/* ── Editorial header ─────────────────────────────────────── */}
        <header style={{
          width: "100%", maxWidth: 1180, margin: "0 auto 30px",
        }}>
          <p style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontWeight: 700, fontSize: 11, letterSpacing: "0.28em",
            textTransform: "uppercase", color: A.pink, margin: "0 0 10px",
          }}>
            V14 · Alumni-Index Design Review
          </p>
          <h1 style={{
            fontFamily: "var(--font-anton), system-ui, sans-serif",
            fontSize: "clamp(40px, 6.5vw, 76px)", lineHeight: 0.92,
            letterSpacing: "0.005em", textTransform: "uppercase",
            color: A.ink, margin: "0 0 14px",
          }}>
            Multiple journeys, one alumnus.
          </h1>
          <div style={{ display: "flex", gap: 12, alignItems: "center", maxWidth: 680 }}>
            <span style={{
              display: "inline-block", width: 26, height: 2,
              backgroundColor: A.pink, borderRadius: 1, flexShrink: 0,
            }} />
            <p style={{
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              fontStyle: "italic", fontSize: "clamp(15px, 1.8vw, 19px)",
              color: A.ink, opacity: 0.82, margin: 0, lineHeight: 1.4,
            }}>
              When an alum has lived through several DAT programs over the
              years, how should we present that arc on /alumni/[slug]? Three
              treatments below — all built from the same passport-cover unit.
            </p>
          </div>
        </header>

        {/* ── Sample journey row (the data each option renders) ─────── */}
        <section style={{
          width: "100%", maxWidth: 1180, margin: "0 auto 56px",
        }}>
          <p style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontWeight: 700, fontSize: 10, letterSpacing: "0.28em",
            textTransform: "uppercase", color: A.teal, margin: "0 0 14px",
          }}>
            Sample data · {SAMPLE_ALUM.name}
          </p>
          <div style={{
            display: "flex", gap: 18, overflowX: "auto",
            padding: "6px 2px 18px",
            WebkitOverflowScrolling: "touch",
          }}>
            {SAMPLE_JOURNEYS.map((j) => (
              <JourneyCardCover key={j.slug} journey={j} size="sm" />
            ))}
          </div>
        </section>

        {/* ── Option cards ─────────────────────────────────────────── */}
        <section style={{
          width: "100%", maxWidth: 1180, margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 24,
        }}>
          {OPTIONS.map((opt) => (
            <a
              key={opt.id}
              href={opt.href}
              style={{
                display: "flex", flexDirection: "column",
                textDecoration: "none", color: A.ink,
                backgroundColor: A.bg,
                border: `1px solid ${A.border}`,
                borderRadius: 8, padding: "22px 22px 24px",
                boxShadow: "0 4px 18px rgba(36,17,35,0.07)",
                transition: "transform 180ms ease, box-shadow 180ms ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 10px 26px rgba(36,17,35,0.13)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "";
                e.currentTarget.style.boxShadow = "0 4px 18px rgba(36,17,35,0.07)";
              }}
            >
              <div style={{
                display: "flex", alignItems: "baseline", gap: 12,
                marginBottom: 14,
              }}>
                <span style={{
                  fontFamily: "var(--font-anton), system-ui, sans-serif",
                  fontSize: 44, lineHeight: 0.9, color: A.pink,
                }}>
                  {opt.letter}
                </span>
                <span style={{
                  fontFamily: "var(--font-anton), system-ui, sans-serif",
                  fontSize: 22, lineHeight: 1, color: A.ink,
                  textTransform: "uppercase", letterSpacing: "0.01em",
                }}>
                  {opt.title}
                </span>
              </div>

              <p style={{
                fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                fontSize: 14, lineHeight: 1.55, color: A.ink,
                opacity: 0.82, margin: "0 0 16px",
              }}>
                {opt.blurb}
              </p>

              <PCList label="Strengths" color={A.teal} items={opt.pros} />
              <PCList label="Trade-offs" color={A.muted} items={opt.cons} />

              <span style={{
                marginTop: "auto", paddingTop: 14,
                fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                fontWeight: 700, fontSize: 11, letterSpacing: "0.18em",
                textTransform: "uppercase", color: A.pink,
              }}>
                Open mockup ›
              </span>
            </a>
          ))}
        </section>
      </main>
    </>
  );
}

function PCList({ label, color, items }: { label: string; color: string; items: string[] }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <p style={{
        fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
        fontWeight: 700, fontSize: 10, letterSpacing: "0.22em",
        textTransform: "uppercase", color, margin: "0 0 6px",
      }}>{label}</p>
      <ul style={{
        margin: 0, padding: 0, listStyle: "none",
        fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
        fontSize: 13, lineHeight: 1.55, color: A.ink, opacity: 0.85,
      }}>
        {items.map((it, i) => (
          <li key={i} style={{ display: "flex", gap: 8, marginBottom: 4 }}>
            <span aria-hidden style={{ color: A.dim }}>·</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
