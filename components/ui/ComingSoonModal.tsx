"use client";

import { useState, useEffect } from "react";
import { ALUMNI_COUNT_DISPLAY, SEASON_COUNT, PRODUCTION_COUNT, CLUB_COUNT } from "@/lib/datStats";

// ─────────────────────────────────────────────────────────────────────────────
// Shows once per calendar day. Once dismissed, localStorage records today's
// date. The next calendar day the modal shows again, keeping the site feeling
// alive without nagging repeat visitors.
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = "dat-cs-seen";

export default function ComingSoonModal() {
  const [phase, setPhase] = useState<"hidden" | "entering" | "visible" | "exiting">("hidden");

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const seen = localStorage.getItem(STORAGE_KEY);
    if (seen !== today) {
      const t = setTimeout(() => setPhase("entering"), 280);
      return () => clearTimeout(t);
    }
  }, []);

  // entering → visible after animation completes
  useEffect(() => {
    if (phase === "entering") {
      const t = setTimeout(() => setPhase("visible"), 700);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const dismiss = () => {
    setPhase("exiting");
    const today = new Date().toISOString().split("T")[0];
    localStorage.setItem(STORAGE_KEY, today);
    setTimeout(() => setPhase("hidden"), 600);
  };

  if (phase === "hidden") return null;

  const isExiting = phase === "exiting";

  return (
    <>
      {/* ── Backdrop ──────────────────────────────────────────────────────── */}
      <div
        className={`csm-backdrop ${isExiting ? "csm-backdrop--out" : "csm-backdrop--in"}`}
        onClick={dismiss}
        aria-hidden="true"
      />

      {/* ── Modal ─────────────────────────────────────────────────────────── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Coming soon — Dramatic Adventure Theatre"
        className={`csm-wrap ${isExiting ? "csm-wrap--out" : "csm-wrap--in"}`}
      >
        <div className="csm-modal">

          {/* Background image layer */}
          <div className="csm-bg-img" aria-hidden="true" />

          {/* Gradient scrim layers */}
          <div className="csm-scrim" aria-hidden="true" />
          <div className="csm-scrim-vignette" aria-hidden="true" />

          {/* Animated spotlight pulse */}
          <div className="csm-spotlight" aria-hidden="true" />

          {/* Close button */}
          <button
            className="csm-close"
            onClick={dismiss}
            aria-label="Close"
            type="button"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M1 1l16 16M17 1L1 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>

          {/* ── Content ──────────────────────────────────────────────────── */}
          <div className="csm-content">

            {/* Top badge */}
            <div className="csm-badge-row">
              <div className="csm-badge">
                <span className="csm-badge-dot" />
                In Development
              </div>
            </div>

            {/* Eyebrow */}
            <p className="csm-eyebrow">stories.dramaticadventure.com</p>

            {/* Headline */}
            <h2 className="csm-headline">
              THE<br />CURTAIN<br />IS RISING.
            </h2>

            {/* Gold divider with star */}
            <div className="csm-divider" aria-hidden="true">
              <span className="csm-divider-line" />
              <span className="csm-divider-star">★</span>
              <span className="csm-divider-line" />
            </div>

            {/* Body */}
            <p className="csm-body">
              <strong>{SEASON_COUNT} seasons.</strong>{" "}
              <strong>{PRODUCTION_COUNT} original plays.</strong>{" "}
              <strong>{CLUB_COUNT} drama clubs</strong> for young people in communities
              around the world. And <strong>{ALUMNI_COUNT_DISPLAY} artists</strong> who gave
              everything to make it happen.
            </p>
            <p className="csm-body">
              We&apos;re building the platform their stories deserve. Alumni pages, production
              archives, an interactive story map — coming soon.
            </p>
            <p className="csm-body csm-body--em">
              It&apos;s almost showtime. Look around — much is already here.
            </p>

            {/* Actions */}
            <div className="csm-actions">
              <button
                className="csm-btn-primary"
                onClick={dismiss}
                type="button"
              >
                Start Exploring →
              </button>
              <a
                href="https://dramaticadventure.com"
                target="_blank"
                rel="noopener noreferrer"
                className="csm-btn-secondary"
              >
                Visit DAT Main Site
              </a>
            </div>

            {/* Footnote */}
            <p className="csm-footnote">
              We won&apos;t show this again today.
            </p>

          </div>
        </div>
      </div>

      {/* ── Styles ──────────────────────────────────────────────────────────── */}
      <style>{`

        /* ─ Animations ──────────────────────────────────────────────────── */
        @keyframes csm-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes csm-fade-out {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
        @keyframes csm-rise-in {
          from { opacity: 0; transform: translateY(28px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
        @keyframes csm-rise-out {
          from { opacity: 1; transform: translateY(0)    scale(1); }
          to   { opacity: 0; transform: translateY(16px) scale(0.97); }
        }
        @keyframes csm-spotlight-pulse {
          0%,100% { opacity: 0.7; transform: translate(-50%, -50%) scale(1); }
          50%      { opacity: 1;   transform: translate(-50%, -50%) scale(1.08); }
        }
        @keyframes csm-line-grow {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        @keyframes csm-gold-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes csm-badge-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.35; }
        }

        /* ─ Backdrop ────────────────────────────────────────────────────── */
        .csm-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(10, 4, 16, 0.82);
          z-index: 9000;
          cursor: pointer;
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
        }
        .csm-backdrop--in  { animation: csm-fade-in  0.5s ease forwards; }
        .csm-backdrop--out { animation: csm-fade-out 0.5s ease forwards; }

        /* ─ Wrap (centering layer) ──────────────────────────────────────── */
        .csm-wrap {
          position: fixed;
          inset: 0;
          z-index: 9001;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: clamp(1rem, 4vw, 2.5rem);
          pointer-events: none;
        }
        .csm-wrap--in  { animation: csm-rise-in  0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.05s both; }
        .csm-wrap--out { animation: csm-rise-out 0.45s ease forwards; }

        /* ─ Modal box ───────────────────────────────────────────────────── */
        .csm-modal {
          position: relative;
          width: 100%;
          max-width: 560px;
          min-height: 480px;
          border-radius: 20px;
          overflow: hidden;
          pointer-events: all;
          background: #0d0812;
          box-shadow:
            0 0 0 1px rgba(217,169,25,0.18),
            0 32px 80px rgba(0,0,0,0.7),
            0 0 120px rgba(217,169,25,0.06);
        }

        /* ─ Background image ────────────────────────────────────────────── */
        .csm-bg-img {
          position: absolute;
          inset: 0;
          background-image: url('/images/performing-zanzibar.jpg');
          background-size: cover;
          background-position: center 30%;
          opacity: 0.22;
          transition: opacity 0.4s;
        }
        .csm-modal:hover .csm-bg-img { opacity: 0.3; }

        /* ─ Scrims ──────────────────────────────────────────────────────── */
        .csm-scrim {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            165deg,
            rgba(10,4,16,0.6) 0%,
            rgba(10,4,16,0.3) 40%,
            rgba(10,4,16,0.75) 80%,
            rgba(10,4,16,0.95) 100%
          );
        }
        .csm-scrim-vignette {
          position: absolute;
          inset: 0;
          background: radial-gradient(
            ellipse 90% 70% at 80% 20%,
            rgba(217,169,25,0.07) 0%,
            transparent 60%
          );
        }

        /* ─ Spotlight ───────────────────────────────────────────────────── */
        .csm-spotlight {
          position: absolute;
          width: 420px;
          height: 420px;
          left: 50%;
          top: 42%;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(217,169,25,0.12) 0%,
            rgba(217,169,25,0.04) 45%,
            transparent 70%
          );
          animation: csm-spotlight-pulse 4s ease-in-out infinite;
          pointer-events: none;
        }

        /* ─ Close button ────────────────────────────────────────────────── */
        .csm-close {
          position: absolute;
          top: 1.1rem;
          right: 1.1rem;
          z-index: 10;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(10,4,16,0.6);
          color: rgba(255,255,255,0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.2s, color 0.2s, border-color 0.2s, transform 0.15s;
          backdrop-filter: blur(8px);
        }
        .csm-close:hover {
          background: rgba(242,51,89,0.2);
          border-color: rgba(242,51,89,0.4);
          color: #F23359;
          transform: scale(1.08);
        }

        /* ─ Content ─────────────────────────────────────────────────────── */
        .csm-content {
          position: relative;
          z-index: 2;
          padding: clamp(2rem, 5vw, 2.75rem) clamp(1.75rem, 5vw, 2.75rem) clamp(1.75rem, 4vw, 2.25rem);
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        /* Badge row */
        .csm-badge-row {
          display: flex;
          align-items: center;
          margin-bottom: 1.25rem;
        }
        .csm-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-family: "DM Sans", sans-serif;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.4);
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          padding: 0.3rem 0.75rem;
          border-radius: 50px;
        }
        .csm-badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #D9A919;
          animation: csm-badge-pulse 2s ease-in-out infinite;
          flex-shrink: 0;
        }

        /* Eyebrow */
        .csm-eyebrow {
          font-family: "DM Sans", sans-serif;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: #D9A919;
          margin: 0 0 0.85rem;
          opacity: 0.85;
        }

        /* Headline */
        .csm-headline {
          font-family: "Anton", sans-serif;
          font-size: clamp(3rem, 9vw, 5.5rem);
          font-weight: 400;
          line-height: 0.9;
          letter-spacing: 0.01em;
          margin: 0 0 1.5rem;
          background: linear-gradient(
            135deg,
            #ffffff 0%,
            #fff8e7 30%,
            #D9A919 55%,
            #fff8e7 75%,
            #ffffff 100%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: csm-gold-shimmer 5s linear infinite;
        }

        /* Divider */
        .csm-divider {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.4rem;
        }
        .csm-divider-line {
          flex: 1;
          height: 1px;
          background: rgba(217,169,25,0.35);
          transform-origin: left;
          animation: csm-line-grow 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both;
        }
        .csm-divider-star {
          font-size: 0.7rem;
          color: #D9A919;
          opacity: 0.7;
          flex-shrink: 0;
        }

        /* Body */
        .csm-body {
          font-family: "Space Grotesk", sans-serif;
          font-size: clamp(0.88rem, 2vw, 0.95rem);
          color: rgba(255,255,255,0.65);
          line-height: 1.7;
          margin: 0 0 0.85rem;
        }
        .csm-body strong {
          color: rgba(255,255,255,0.88);
          font-weight: 600;
        }
        .csm-body--em {
          color: rgba(255,255,255,0.5);
          font-style: italic;
          margin-bottom: 0;
        }

        /* Actions */
        .csm-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          margin-top: 1.75rem;
          margin-bottom: 1.25rem;
          align-items: center;
        }
        .csm-btn-primary {
          font-family: "DM Sans", sans-serif;
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #241123;
          background: #D9A919;
          border: none;
          border-radius: 10px;
          padding: 0.85rem 1.85rem;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 4px 20px rgba(217,169,25,0.25);
        }
        .csm-btn-primary:hover {
          background: #c49616;
          transform: translateY(-1px);
          box-shadow: 0 6px 28px rgba(217,169,25,0.4);
        }
        .csm-btn-secondary {
          font-family: "DM Sans", sans-serif;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.5);
          text-decoration: none;
          border: 1.5px solid rgba(255,255,255,0.15);
          border-radius: 10px;
          padding: 0.85rem 1.5rem;
          transition: color 0.2s, border-color 0.2s;
        }
        .csm-btn-secondary:hover {
          color: rgba(255,255,255,0.8);
          border-color: rgba(255,255,255,0.35);
        }

        /* Footnote */
        .csm-footnote {
          font-family: "DM Sans", sans-serif;
          font-size: 0.68rem;
          font-weight: 500;
          letter-spacing: 0.08em;
          color: rgba(255,255,255,0.22);
          margin: 0;
          text-align: right;
        }

        /* ─ Responsive ──────────────────────────────────────────────────── */
        @media (max-width: 480px) {
          .csm-modal { min-height: auto; border-radius: 16px; }
          .csm-actions { flex-direction: column; }
          .csm-btn-primary,
          .csm-btn-secondary { width: 100%; text-align: center; }
          .csm-footnote { text-align: center; }
        }

        /* ─ Reduced motion ──────────────────────────────────────────────── */
        @media (prefers-reduced-motion: reduce) {
          .csm-backdrop--in, .csm-backdrop--out,
          .csm-wrap--in, .csm-wrap--out {
            animation: none;
            opacity: 1;
          }
          .csm-backdrop--out, .csm-wrap--out { opacity: 0; }
          .csm-headline { animation: none; }
          .csm-spotlight { animation: none; }
          .csm-badge-dot { animation: none; }
          .csm-divider-line { animation: none; }
        }
      `}</style>
    </>
  );
}
