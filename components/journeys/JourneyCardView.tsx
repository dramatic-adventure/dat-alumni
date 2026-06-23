// components/journeys/JourneyCardView.tsx
// Production V1 Journey Card view — a faithful port of the approved v17 mockup
// (app/journey-card-mockup/v17/JourneyCardV17.tsx), driven by LIVE data.
//
// It keeps the v17 "passport book" exactly: native 1080×580 landscape scaled to
// fit any desktop/laptop via CSS transform, and a passport-book reflow on phones
// and portrait tablets. Flip with arrows / dots / swipe / keyboard.
//
// V1 renders the pages our authored data supports:
//   Cover → (Story, if the artist wrote a body / added photos) → Back cover.
// The deep multi-chapter interior (per-chapter photos, responses, partner orgs,
// ambient audio) is authored by the Companion/capture tools in a later phase and
// slots in between cover and back cover when that data exists. Audio is omitted
// in V1 (no audio data yet).
//
// All artist photos render via plain <img> (arbitrary hosts; no next/image
// allow-list) and the DAT logo is a plain <img> too (a local SVG needs no
// optimization, and next/image was leaving a placeholder box around it).

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DAT_DISCLAIMER, type JourneyCard } from "@/lib/journeyCard";
import { A as C, STAMP_SHADOW, KRAFT_PAGE, safeMediaUrl } from "./journeyTheme";

export type CardViewAlum = {
  name: string;
  slug: string;
  roles: string[];
  headshotUrl?: string;
};

const GET_INVOLVED = "https://www.dramaticadventure.com/get-involved";
const TRAVEL_URL = "https://dramaticadventure.com/travel-opportunities";

type Ctx = { card: JourneyCard; alum: CardViewAlum };

// ── Program wordmark + COUNTRY · YEAR stack (the v17 PassageStack, live) ──────
function ProgramStack({
  ctx, size, align = "left",
}: {
  ctx: Ctx;
  size: "lg" | "xl-mobile";
  align?: "left" | "center";
}) {
  const program = String(ctx.card.program ?? "").trim();
  const words = program.split(/\s+/).filter(Boolean);
  const isMulti = words.length > 1;
  const lead = isMulti ? words.slice(0, -1).join(" ") : "";
  const main = isMulti ? words[words.length - 1] : program;

  const big = size === "lg" ? 80 : "clamp(52px, 15vw, 64px)";
  const small = size === "lg" ? 17 : "clamp(13px, 3.6vw, 15px)";
  const leadSize = size === "lg" ? 30 : "clamp(20px, 6vw, 26px)";

  const tail = [ctx.card.country, ctx.card.year].filter(Boolean).join(" ");

  return (
    <div style={{ textAlign: align, lineHeight: 1 }}>
      <a href={GET_INVOLVED} target="_blank" rel="noopener noreferrer" className="jcb-link"
        style={{ textDecoration: "none", color: "inherit", display: "inline-block" }}>
        {isMulti && (
          <span style={{
            display: "block",
            fontFamily: "var(--font-anton), system-ui, sans-serif",
            fontSize: leadSize, color: C.ink, opacity: 0.92,
            letterSpacing: "0.01em", lineHeight: 1, marginBottom: 2,
          }}>{lead}</span>
        )}
        <h1 style={{
          fontFamily: "var(--font-anton), system-ui, sans-serif",
          fontSize: big, lineHeight: 0.91, color: C.ink,
          margin: "0 0 6px", letterSpacing: "0.01em", textTransform: "none",
        }}>{main}</h1>
      </a>
      {tail && (
        <p style={{
          fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
          fontWeight: 700, fontSize: small, letterSpacing: "0.28em",
          textTransform: "uppercase", color: C.teal, margin: 0,
        }}>{tail}</p>
      )}
    </div>
  );
}

// ── Share ─────────────────────────────────────────────────────────────────────
function ShareButton({ title, text, onCopied }: { title: string; text: string; onCopied: () => void }) {
  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try { await (navigator as any).share({ title, text, url }); } catch { /* dismissed */ }
    } else {
      try { await navigator.clipboard.writeText(url); onCopied(); } catch { /* no clipboard */ }
    }
  };
  return (
    <button type="button" onClick={share} className="jcb-btn" title="Share this journey"
      style={{
        display: "flex", alignItems: "center", gap: 7,
        border: `1.5px solid ${C.border}`, borderRadius: 20,
        padding: "7px 14px", cursor: "pointer", backgroundColor: "transparent", color: C.ink,
      }}>
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </svg>
      <span style={{
        fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
        fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
      }}>Share</span>
    </button>
  );
}

// ── Photo grid (v17 port; plain <img>) ────────────────────────────────────────
function PhotoGrid({ photos, W, H }: { photos: string[]; W: number; H: number }) {
  const n = photos.length;
  const G = 2;
  const Img = ({ src }: { src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" loading="lazy" decoding="async"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
  );
  const cell = (src: string, w: number | string, h: number | string, key?: number) => (
    <div key={key} style={{ width: w, height: h, position: "relative", overflow: "hidden", flexShrink: 0 }}>
      <Img src={src} />
    </div>
  );
  if (n === 0) return <div style={{ width: W, height: H, backgroundColor: "#e8e2da" }} />;
  if (n === 1) return cell(photos[0], W, H);
  if (n === 2) {
    const w = Math.floor((W - G) / 2);
    return <div style={{ display: "flex", gap: G, width: W, height: H }}>{photos.map((p, i) => cell(p, w, H, i))}</div>;
  }
  if (n === 3) {
    const lW = Math.floor(W * 0.56); const rW = W - lW - G; const rH = Math.floor((H - G) / 2);
    return (
      <div style={{ display: "flex", gap: G, width: W, height: H }}>
        {cell(photos[0], lW, H)}
        <div style={{ display: "flex", flexDirection: "column", gap: G, width: rW, flexShrink: 0 }}>
          {cell(photos[1], rW, rH)}{cell(photos[2], rW, rH)}
        </div>
      </div>
    );
  }
  if (n === 4) {
    const w = Math.floor((W - G) / 2); const h = Math.floor((H - G) / 2);
    return (
      <div style={{ display: "grid", gridTemplateColumns: `repeat(2,${w}px)`, gridTemplateRows: `repeat(2,${h}px)`, gap: G }}>
        {photos.map((p, i) => (
          <div key={i} style={{ position: "relative", overflow: "hidden" }}><Img src={p} /></div>
        ))}
      </div>
    );
  }
  const lW = Math.floor((W - G) / 2); const rW = W - lW - G; const rH = Math.floor((H - G) / 2);
  return (
    <div style={{ display: "flex", gap: G, width: W, height: H }}>
      {cell(photos[0], lW, H)}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: `${rH}px ${rH}px`, gap: G, width: rW, flexShrink: 0 }}>
        {photos.slice(1, 5).map((p, i) => (
          <div key={i} style={{ position: "relative", overflow: "hidden" }}><Img src={p} /></div>
        ))}
      </div>
    </div>
  );
}

// ── Cover page (v17 port, desktop + mobile) ───────────────────────────────────
function CoverPage({ ctx, isMobile, W, H, onCopied }: { ctx: Ctx; isMobile: boolean; W: number; H: number; onCopied: () => void }) {
  const { card, alum } = ctx;
  const hero = safeMediaUrl(card.heroUrl);
  const shot = safeMediaUrl(alum.headshotUrl) || "/images/default-headshot.png";
  const roles = card.primaryRole || alum.roles.join(" · ");

  if (isMobile) {
    const HERO_H = Math.round(H * 0.42);
    const STAMP = 120;
    return (
      <div style={{ position: "relative", width: W, height: H, backgroundColor: C.bg, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ width: W, height: HERO_H, position: "relative", overflow: "hidden", flexShrink: 0, backgroundColor: "#e8e2da" }}>
          {hero && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={hero} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          )}
        </div>
        <a href="/" title="Dramatic Adventure Theatre" className="jcb-imglink"
          style={{ position: "absolute", left: "50%", top: HERO_H, transform: "translate(-50%, -50%)", width: STAMP, height: STAMP, zIndex: 10, display: "block" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/dat-logo7.svg" alt="Dramatic Adventure Theatre" style={{ width: STAMP, height: STAMP, display: "block", filter: STAMP_SHADOW }} />
        </a>
        <div className="jcb-scroll" style={{
          flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column",
          padding: `${STAMP / 2 + 8}px 22px 16px 22px`, textAlign: "center", alignItems: "center",
        }}>
          <a href="/" className="jcb-link" style={{ textDecoration: "none" }}>
            <p style={{ fontFamily: "var(--font-space-grotesk), system-ui, sans-serif", fontWeight: 700, fontSize: 9, letterSpacing: "0.28em", textTransform: "uppercase", color: C.pink, margin: "0 0 10px" }}>Dramatic Adventure Theatre</p>
          </a>
          <ProgramStack ctx={ctx} size="xl-mobile" align="center" />
          {card.dates && <p style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: 10, color: C.muted, margin: "6px 0 12px" }}>{card.dates}</p>}
          {card.title && (
            <p style={{ fontFamily: "var(--font-anton), system-ui, sans-serif", fontSize: 20, color: C.ink, margin: "0 0 8px", lineHeight: 1.05 }}>{card.title}</p>
          )}
          {card.pullQuote && (
            <p style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontStyle: "italic", fontSize: 12, lineHeight: 1.6, color: C.ink, opacity: 0.82, margin: "0 0 auto" }}>&ldquo;{card.pullQuote}&rdquo;</p>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 14 }}>
            <a href={`/alumni/${alum.slug}`} className="jcb-imglink" style={{ display: "block", textDecoration: "none", flexShrink: 0 }}>
              <div style={{ width: 96, height: 120, borderRadius: 4, overflow: "hidden", position: "relative", border: `1px solid ${C.border}` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={shot} alt={alum.name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 12%" }} />
              </div>
            </a>
            <div style={{ textAlign: "left", flex: 1, minWidth: 0 }}>
              <a href={`/alumni/${alum.slug}`} className="jcb-link" style={{ textDecoration: "none", color: "inherit" }}>
                <p style={{ fontFamily: "var(--font-anton), system-ui, sans-serif", fontSize: 18, color: C.ink, margin: "0 0 2px", textTransform: "uppercase", lineHeight: 1 }}>{alum.name}</p>
              </a>
              {roles && <p style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: 10, color: C.teal, margin: "0 0 8px", fontWeight: 600 }}>{roles}</p>}
              <ShareButton title={card.programLabel} text={card.pullQuote || card.title} onCopied={onCopied} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Desktop
  const LEFT_W = 470;
  const STAMP_SIZE = 184;
  return (
    <div style={{ position: "relative", display: "flex", width: W, height: H, backgroundColor: C.bg, overflow: "hidden" }}>
      <div style={{ width: LEFT_W, flexShrink: 0, backgroundColor: C.bg, display: "flex", flexDirection: "column", padding: "26px 32px 22px 28px", zIndex: 2 }}>
        <a href="/" className="jcb-link" style={{ textDecoration: "none", maxWidth: "70%" }}>
          <p style={{ fontFamily: "var(--font-space-grotesk), system-ui, sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: "0.28em", textTransform: "uppercase", color: C.pink, margin: "0 0 10px" }}>Dramatic Adventure Theatre</p>
        </a>
        <div style={{ maxWidth: "78%" }}><ProgramStack ctx={ctx} size="lg" align="left" /></div>
        {card.dates && <p style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: 12, color: C.muted, margin: "10px 0 14px", maxWidth: "70%" }}>{card.dates}</p>}
        <div style={{ width: 40, height: 1, backgroundColor: C.ink, opacity: 0.2, marginBottom: 16 }} />
        {card.title && (
          <p style={{ fontFamily: "var(--font-anton), system-ui, sans-serif", fontSize: 26, color: C.ink, margin: "0 0 10px", lineHeight: 1.04, maxWidth: "82%" }}>{card.title}</p>
        )}
        {card.pullQuote && (
          <p style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontStyle: "italic", fontSize: 16, lineHeight: 1.6, color: C.ink, margin: "0 0 auto", opacity: 0.8, maxWidth: "82%" }}>&ldquo;{card.pullQuote}&rdquo;</p>
        )}
        <div style={{ marginTop: 16, display: "flex", gap: 14, alignItems: "stretch" }}>
          <a href={`/alumni/${alum.slug}`} className="jcb-imglink" style={{ flexShrink: 0, display: "block", textDecoration: "none" }}>
            <div style={{ width: 132, height: 168, borderRadius: 4, overflow: "hidden", position: "relative", border: `1px solid ${C.border}` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={shot} alt={alum.name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 12%" }} />
            </div>
          </a>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", minWidth: 0, paddingTop: 4 }}>
            <div>
              <a href={`/alumni/${alum.slug}`} className="jcb-link" style={{ textDecoration: "none", color: "inherit" }}>
                <p style={{ fontFamily: "var(--font-anton), system-ui, sans-serif", fontSize: 22, color: C.ink, margin: "0 0 2px", textTransform: "uppercase", lineHeight: 1 }}>{alum.name}</p>
              </a>
              {roles && <p style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: 11, color: C.teal, margin: "0 0 6px", fontWeight: 600 }}>{roles}</p>}
            </div>
            <div style={{ display: "flex", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
              <ShareButton title={card.programLabel} text={card.pullQuote || card.title} onCopied={onCopied} />
            </div>
            <p style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: 9.5, color: C.dim, margin: 0, fontStyle: "italic", letterSpacing: "0.02em" }}>
              Created by {alum.name}. {DAT_DISCLAIMER}
            </p>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, position: "relative", overflow: "hidden", backgroundColor: "#e8e2da" }}>
        {hero && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={hero} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        )}
      </div>
      <a href="/" title="Dramatic Adventure Theatre" className="jcb-imglink"
        style={{ position: "absolute", left: LEFT_W - STAMP_SIZE / 2, top: "50%", transform: "translateY(-50%)", width: STAMP_SIZE, height: STAMP_SIZE, zIndex: 10, display: "block" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/dat-logo7.svg" alt="Dramatic Adventure Theatre" style={{ display: "block", width: STAMP_SIZE, height: STAMP_SIZE, filter: STAMP_SHADOW }} />
      </a>
    </div>
  );
}

// ── Story page (the V1 "chapter": authored body + photos) ─────────────────────
function StoryPage({ ctx, photos, isMobile, W, H }: { ctx: Ctx; photos: string[]; isMobile: boolean; W: number; H: number }) {
  const { card } = ctx;
  const accent = accentFor(card.accent);
  const paras = (card.body || "").split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  const Journal = ({ width }: { width: number | string }) => (
    <div style={{ width, flexShrink: 0, backgroundColor: C.bg, display: "flex", flexDirection: "column", height: isMobile ? "auto" : H, minHeight: 0, borderRight: isMobile ? "none" : `1px solid ${C.sep}` }}>
      <div style={{ padding: isMobile ? "12px 18px 6px" : "20px 24px 12px", flexShrink: 0 }}>
        <p style={{ fontFamily: "var(--font-space-grotesk), system-ui, sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: C.pink, margin: "0 0 3px" }}>{card.programLabel}</p>
        {card.title && <p style={{ fontFamily: "var(--font-anton), system-ui, sans-serif", fontSize: isMobile ? 18 : 22, color: C.ink, margin: 0, lineHeight: 1.05 }}>{card.title}</p>}
        <div style={{ width: 28, height: 2, backgroundColor: accent, borderRadius: 1, margin: "10px 0 0" }} />
      </div>
      <div className="jcb-scroll" style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: isMobile ? "8px 18px 14px" : "8px 24px 16px" }}>
        {card.pullQuote && (
          <p style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontStyle: "italic", fontSize: isMobile ? 13 : 14.5, lineHeight: 1.6, color: C.ink, margin: "0 0 12px", borderLeft: `3px solid ${accent}`, paddingLeft: 12 }}>&ldquo;{card.pullQuote}&rdquo;</p>
        )}
        {paras.map((p, i) => (
          <p key={i} style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: isMobile ? 12 : 13, color: C.muted, lineHeight: 1.6, margin: "0 0 10px" }}>{p}</p>
        ))}
      </div>
    </div>
  );

  if (isMobile) {
    const PHOTO_H = Math.round(H * 0.34);
    return (
      <div style={{ width: W, height: H, display: "flex", flexDirection: "column", backgroundColor: C.bg }}>
        <div style={{ width: W, height: PHOTO_H, overflow: "hidden", backgroundColor: "#e8e2da", flexShrink: 0, position: "relative" }}>
          <PhotoGrid photos={photos} W={W} H={PHOTO_H} />
        </div>
        <div style={{ flex: 1, minHeight: 0, display: "flex" }}><Journal width={W} /></div>
      </div>
    );
  }
  const journalW = 378;
  return (
    <div style={{ display: "flex", width: W, height: H }}>
      <Journal width={journalW} />
      <div style={{ flex: 1, overflow: "hidden", backgroundColor: "#e8e2da", position: "relative" }}>
        <PhotoGrid photos={photos} W={W - journalW} H={H} />
      </div>
    </div>
  );
}

// ── Back cover (v17 port: mosaic + stamp + credit + disclaimer + travel CTA) ──
function BackCoverPage({ ctx, photos, isMobile, W, H }: { ctx: Ctx; photos: string[]; isMobile: boolean; W: number; H: number }) {
  const { card, alum } = ctx;
  const G = 2;
  const cols = isMobile ? 3 : 4;
  const rows = isMobile ? 5 : 4;
  const cellW = Math.floor((W - G * (cols - 1)) / cols);
  const cellH = Math.floor((H - G * (rows - 1)) / rows);
  const total = cols * rows;
  const grid: string[] = [];
  if (photos.length) { while (grid.length < total) grid.push(photos[grid.length % photos.length]); }
  const BACK_STAMP = isMobile ? Math.min(220, Math.max(180, Math.round(W * 0.58))) : 172;

  return (
    <div style={{ position: "relative", width: W, height: H, overflow: "hidden", backgroundColor: "#e8e2da" }}>
      {grid.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, ${cellW}px)`, gridTemplateRows: `repeat(${rows}, ${cellH}px)`, gap: G }}>
          {grid.map((src, i) => (
            <div key={i} style={{ position: "relative", overflow: "hidden" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" loading="lazy" decoding="async" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          ))}
        </div>
      )}
      <div style={{ position: "absolute", inset: 0, background: "rgba(36,17,35,0.32)", pointerEvents: "none" }} />
      <a href="/" title="Dramatic Adventure Theatre — Home" className="jcb-imglink"
        style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: BACK_STAMP, height: BACK_STAMP, display: "block", zIndex: 10 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/dat-logo7.svg" alt="Dramatic Adventure Theatre" style={{ display: "block", width: BACK_STAMP, height: BACK_STAMP, filter: STAMP_SHADOW }} />
      </a>
      <div style={{ position: "absolute", bottom: isMobile ? 12 : 16, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 5, zIndex: 11, pointerEvents: "none", padding: "0 16px" }}>
        <span style={{ fontFamily: "var(--font-space-grotesk), system-ui, sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "#f9f4ea", backgroundColor: "rgba(36,17,35,0.66)", padding: "6px 16px", borderRadius: 2 }}>Created by {alum.name}</span>
        <span style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: isMobile ? 8.5 : 9, fontStyle: "italic", lineHeight: 1.4, color: "#f9f4ea", maxWidth: 360, textAlign: "center", backgroundColor: "rgba(36,17,35,0.6)", padding: "5px 14px", borderRadius: 2 }}>{DAT_DISCLAIMER}</span>
      </div>
      <a href={card.ctaUrl || TRAVEL_URL} target="_blank" rel="noopener noreferrer" className="jcb-cta"
        style={{ position: "absolute", top: isMobile ? 12 : 16, left: isMobile ? 12 : 16, zIndex: 11, display: "inline-flex", alignItems: "center", fontFamily: "var(--font-space-grotesk), system-ui, sans-serif", fontWeight: 800, fontSize: isMobile ? 11 : 12, letterSpacing: "0.18em", textTransform: "uppercase", textDecoration: "none", color: "#fff", backgroundColor: C.pink, padding: isMobile ? "9px 16px" : "11px 20px", borderRadius: 999, boxShadow: "0 4px 14px rgba(242,51,89,0.45)" }}>
        {card.ctaText || "Travel with DAT"}
      </a>
    </div>
  );
}

function accentFor(a: JourneyCard["accent"]): string {
  switch (a) { case "pink": return C.pink; case "teal": return C.teal; case "yellow": return C.yellow; case "grape": return C.grape; }
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function JourneyCardView({ card, alum }: Ctx) {
  const ctx: Ctx = { card, alum };
  const heroPhotos = useMemo(() => card.mediaUrls.map(safeMediaUrl).filter(Boolean), [card.mediaUrls]);
  const storyPhotos = heroPhotos.length ? heroPhotos : [safeMediaUrl(card.heroUrl)].filter(Boolean);
  const mosaicPhotos = useMemo(() => {
    const all = [safeMediaUrl(card.heroUrl), ...heroPhotos].filter(Boolean);
    return Array.from(new Set(all));
  }, [card.heroUrl, heroPhotos]);

  const hasStory = Boolean((card.body || "").trim()) || heroPhotos.length > 0;
  const pages = useMemo(() => {
    const ps: Array<{ key: string; label: string }> = [{ key: "cover", label: "Cover" }];
    if (hasStory) ps.push({ key: "story", label: "Story" });
    ps.push({ key: "back", label: "End" });
    return ps;
  }, [hasStory]);
  const TOTAL = pages.length;

  const [page, setPage] = useState(0);
  const [toast, setToast] = useState(false);
  const [layout, setLayout] = useState<{ isMobile: boolean; W: number; H: number; scale: number }>({ isMobile: false, W: 1080, H: 580, scale: 1 });
  const touchStartX = useRef<number | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Adaptive layout — identical strategy to the v17 mockup.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const MOBILE_BP = 760, TABLET_PORTRAIT_MAX = 1024, NATIVE_W = 1080, NATIVE_H = 580;
    const HORIZ_GUTTER = 32, SCALE_MIN = 0.7, SCALE_MAX = 1.28;
    const compute = () => {
      const vw = window.innerWidth, vh = window.innerHeight;
      const isPortrait = vh >= vw;
      const useBook = vw < MOBILE_BP || (isPortrait && vw <= TABLET_PORTRAIT_MAX);
      if (useBook) {
        const W = Math.min(Math.max(vw - 24, 300), 520);
        const H = Math.round(W * 1.58);
        setLayout({ isMobile: true, W, H, scale: 1 });
        return;
      }
      const raw = (vw - HORIZ_GUTTER * 2) / NATIVE_W;
      const scale = Math.min(SCALE_MAX, Math.max(SCALE_MIN, raw));
      setLayout({ isMobile: false, W: NATIVE_W, H: NATIVE_H, scale });
    };
    compute();
    window.addEventListener("resize", compute);
    window.addEventListener("orientationchange", compute);
    return () => { window.removeEventListener("resize", compute); window.removeEventListener("orientationchange", compute); };
  }, []);

  const goTo = useCallback((idx: number) => { if (idx >= 0 && idx < TOTAL) setPage(idx); }, [TOTAL]);
  useEffect(() => { if (page >= TOTAL) setPage(TOTAL - 1); }, [page, TOTAL]);

  const showToast = useCallback(() => {
    setToast(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(false), 2200);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") goTo(page + 1);
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") goTo(page - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [page, goTo]);

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  const { isMobile, W, H, scale } = layout;
  const visibleW = Math.round(W * scale);
  const visibleH = Math.round(H * scale);

  const renderPage = (key: string) => {
    if (key === "cover") return <CoverPage ctx={ctx} isMobile={isMobile} W={W} H={H} onCopied={showToast} />;
    if (key === "story") return <StoryPage ctx={ctx} photos={storyPhotos} isMobile={isMobile} W={W} H={H} />;
    return <BackCoverPage ctx={ctx} photos={mosaicPhotos} isMobile={isMobile} W={W} H={H} />;
  };

  return (
    <main style={{
      ...KRAFT_PAGE, minHeight: "100vh",
      padding: "clamp(84px, 12vh, 140px) 12px 56px",
      display: "flex", flexDirection: "column", alignItems: "center",
    }}>
      <style>{`
        .jcb-btn { transition: all 0.18s ease; }
        .jcb-btn:hover { transform: translateY(-1px); box-shadow: 0 3px 10px rgba(36,17,35,0.18); }
        .jcb-link { transition: opacity 0.15s ease; }
        .jcb-link:hover { opacity: 0.65; }
        .jcb-imglink { transition: transform 0.22s ease; display: block; }
        .jcb-imglink:hover { transform: scale(0.975); }
        .jcb-cta { transition: transform 0.18s ease, box-shadow 0.18s ease; }
        .jcb-cta:hover { transform: translateY(-2px); box-shadow: 0 6px 22px rgba(242,51,89,0.55); }
        .jcb-scroll { scrollbar-width: thin; scrollbar-color: rgba(36,17,35,0.22) transparent; }
        .jcb-scroll::-webkit-scrollbar { width: 4px; }
        .jcb-scroll::-webkit-scrollbar-thumb { background: rgba(36,17,35,0.22); border-radius: 2px; }
        .jcb-outer { border-radius: 6px; overflow: hidden; position: relative; flex-shrink: 0;
          border: 1px solid ${C.border}; box-shadow: 0 10px 44px rgba(36,17,35,0.16), 0 2px 10px rgba(36,17,35,0.07); }
      `}</style>

      {/* Back to this alum's journeys */}
      <div style={{ width: "100%", maxWidth: Math.max(visibleW, 320), display: "flex", justifyContent: "flex-start", marginBottom: 12 }}>
        <a href={`/journeys/${card.profileSlug}`} style={{
          fontFamily: "var(--font-space-grotesk), system-ui, sans-serif", fontWeight: 700, fontSize: 11,
          letterSpacing: "0.18em", textTransform: "uppercase", color: C.ink, textDecoration: "none",
          border: `1.5px solid ${C.border}`, background: "rgba(255,255,255,0.6)", borderRadius: 999, padding: "8px 14px",
        }}>‹ {alum.name}’s journeys</a>
      </div>

      {/* Status row */}
      <div style={{ width: "100%", maxWidth: visibleW, display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontFamily: "var(--font-space-grotesk), system-ui, sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: C.muted }}>
          {pages[Math.min(page, TOTAL - 1)].key === "cover" ? "Cover" : pages[Math.min(page, TOTAL - 1)].key === "back" ? "Back Cover" : "Story"}
        </span>
        {TOTAL > 1 && <span style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: "0.65rem", color: C.muted, fontStyle: "italic" }}>← → / swipe</span>}
      </div>

      {/* Scale frame */}
      <div style={{ width: visibleW, height: visibleH, position: "relative" }}>
        <div className="jcb-outer"
          style={{ width: W, height: H, transform: `scale(${scale})`, transformOrigin: "top left", position: "absolute", top: 0, left: 0 }}
          onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchStartX.current;
            if (dx < -40) goTo(page + 1);
            if (dx > 40) goTo(page - 1);
            touchStartX.current = null;
          }}>
          <div style={{ display: "flex", width: `${TOTAL * W}px`, height: "100%", transform: `translateX(-${page * W}px)`, transition: "transform 360ms cubic-bezier(0.4,0,0.2,1)", willChange: "transform" }}>
            {pages.map((p) => (
              <div key={p.key} style={{ width: W, height: "100%", flexShrink: 0 }}>{renderPage(p.key)}</div>
            ))}
          </div>
          {page > 0 && (
            <button type="button" onClick={() => goTo(page - 1)} aria-label="Previous page" className="jcb-btn"
              style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 32, height: 32, borderRadius: "50%", border: "none", cursor: "pointer", backgroundColor: "rgba(242,242,242,0.85)", boxShadow: "0 1px 6px rgba(36,17,35,0.16)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 12 }}>
              <span style={{ fontSize: 18, color: C.ink, opacity: 0.7, lineHeight: 1, marginRight: 2 }}>‹</span>
            </button>
          )}
          {page < TOTAL - 1 && (
            <button type="button" onClick={() => goTo(page + 1)} aria-label="Next page" className="jcb-btn"
              style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", width: 32, height: 32, borderRadius: "50%", border: "none", cursor: "pointer", backgroundColor: "rgba(242,242,242,0.85)", boxShadow: "0 1px 6px rgba(36,17,35,0.16)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 12 }}>
              <span style={{ fontSize: 18, color: C.ink, opacity: 0.7, lineHeight: 1, marginLeft: 2 }}>›</span>
            </button>
          )}
        </div>
      </div>

      {/* Dots */}
      {TOTAL > 1 && (
        <div style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "center", padding: "12px 0 0" }}>
          {pages.map((p, i) => (
            <button key={p.key} type="button" onClick={() => goTo(i)} title={p.label}
              style={{ width: page === i ? 22 : 7, height: 7, borderRadius: 4, border: "none", padding: 0, cursor: "pointer", backgroundColor: page === i ? C.ink : C.dim, transition: "width 0.22s ease, background-color 0.18s ease" }} />
          ))}
        </div>
      )}

      {/* Toast */}
      <div style={{
        position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
        backgroundColor: C.ink, color: C.bg, borderRadius: 6, padding: "10px 20px", zIndex: 999, pointerEvents: "none",
        fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: 13,
        opacity: toast ? 1 : 0, transition: "opacity 0.3s ease", boxShadow: "0 4px 16px rgba(36,17,35,0.25)",
      }}>Link copied!</div>
    </main>
  );
}
