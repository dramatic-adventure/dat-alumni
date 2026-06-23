// components/journeys/PersonJourneysHero.tsx
// Full-bleed hero for a single alum's journeys page (/journeys/[slug]).
// Same house pattern as the global archive hero, but the rotating images are
// drawn from THIS person's own Journey Cards. Title is the artist's voice —
// "My Journey(s) with Dramatic Adventure Theatre" (pluralized by count) — and
// the current slide's pull-quote rotates beneath it. With one card it's a
// single still (no dots, no rotation).

"use client";

import { useEffect, useState } from "react";
import { A, safeMediaUrl } from "./journeyTheme";
import type { JourneyCard } from "@/lib/journeyCard";

export default function PersonJourneysHero({ cards, totalCount }: { cards: JourneyCard[]; totalCount: number }) {
  const slides = cards.filter((c) => safeMediaUrl(c.heroUrl)).slice(0, 6);
  const [i, setI] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setI((p) => (p + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [slides.length]);

  if (slides.length === 0) return null;
  const c = slides[Math.min(i, slides.length - 1)];
  const line1 = `My ${totalCount === 1 ? "Journey" : "Journeys"} with`;

  return (
    <section style={{
      position: "relative", width: "100%", height: "clamp(360px, 56vh, 560px)",
      overflow: "hidden", boxShadow: "0 0 40px rgba(36,17,35,0.5)", background: A.ink,
    }}>
      {slides.map((card, idx) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={card.id} src={safeMediaUrl(card.heroUrl)} alt=""
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover", objectPosition: "center 28%",
            opacity: idx === i ? 1 : 0, transition: "opacity 0.9s ease",
          }} />
      ))}

      {/* Scrims */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
        background: "linear-gradient(to top, rgba(36,17,35,0.9) 0%, rgba(36,17,35,0.32) 45%, transparent 72%)" }} />
      <div style={{ position: "absolute", bottom: 0, right: 0, width: "65%", height: "78%", pointerEvents: "none",
        background: "radial-gradient(ellipse 90% 80% at 85% 80%, rgba(36,17,35,0.5) 0%, rgba(36,17,35,0.15) 45%, transparent 72%)" }} />

      {/* Whole hero links to the current card */}
      <a href={c.href} aria-label={`${c.title} — ${c.program}: ${c.country} ${c.year}`} className="jc-herolink"
        style={{ position: "absolute", inset: 0, zIndex: 2, display: "block" }} />
      <style>{`.jc-herolink { transition: box-shadow 0.2s ease; } .jc-herolink:hover { box-shadow: inset 0 0 0 9999px rgba(36,17,35,0.10); }`}</style>

      {/* Title + rotating pull-quote, bottom-right (house style) */}
      <div style={{ position: "absolute", bottom: "4vw", right: "4%", maxWidth: "min(900px, 94vw)", textAlign: "right", zIndex: 3, pointerEvents: "none" }}>
        <h1 style={{
          fontFamily: "var(--font-anton), system-ui, sans-serif",
          // Larger across all viewports while the long second line
          // ("DRAMATIC ADVENTURE THEATRE", 26 chars) stays on one row — the vw
          // term keeps it fitting on narrow screens; the widened container
          // (min(900px,94vw)) lets it grow on desktop without wrapping.
          fontSize: "clamp(1.6rem, 5vw, 3.4rem)", textTransform: "uppercase",
          color: "#fff", lineHeight: 1.04, margin: 0, textShadow: "0 8px 24px rgba(0,0,0,0.8)",
        }}>
          {line1}
          <br />
          <span style={{ color: "#ffcc00", whiteSpace: "nowrap" }}>Dramatic Adventure Theatre</span>
        </h1>
        {c.pullQuote && (
          <p style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontStyle: "italic", fontSize: "clamp(0.95rem, 1.8vw, 1.35rem)",
            color: "#fff", opacity: 0.88, margin: "0.7rem 0 0", marginLeft: "auto",
            textShadow: "0 3px 10px rgba(0,0,0,0.9)",
          }}>
            &ldquo;{c.pullQuote}&rdquo;
          </p>
        )}
      </div>

      {/* Dots — bottom-left */}
      {slides.length > 1 && (
        <div style={{ position: "absolute", left: "5%", bottom: "4vw", zIndex: 4, display: "flex", gap: 8 }}>
          {slides.map((card, idx) => (
            <button key={card.id} type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setI(idx); }}
              aria-label={`Show journey ${idx + 1}`} aria-current={idx === i}
              style={{
                width: idx === i ? 22 : 9, height: 9, borderRadius: 5,
                border: "none", padding: 0, cursor: "pointer",
                background: idx === i ? "#fff" : "rgba(255,255,255,0.55)", transition: "width 0.3s ease",
              }} />
          ))}
        </div>
      )}
    </section>
  );
}
