// app/journey-card-mockup/v12/JourneyCardV12.tsx
// ⚠️  MOCKUP ONLY — no live data, no auth, no backend.
//
// v12 changes from v11:
//   • DAT stamp: no big disc border; repositioned to top-left of hero image
//     (fully clear of quote text at all times)
//   • Headshot: 72×90px (face-visible), new layout — left of name/title/clubs/buttons
//   • All links wired: hero → profile, headshot → profile, artist name → profile,
//     DAT logo → /, program name → /get-involved, drama clubs → /drama-club/[slug]
//   • Hover effects: CSS-class based throughout (buttons, pills, image links)
//   • Drama clubs: featured in cover bottom with link pills
//   • "My Journey" first-person framing on cover
//   • "Traveling Teaching Artist" — communicates physical travel
//   • Attribution line: "Created by the artist"
//   • Partner org link on chapter 03 (ETP Slovensko)
//   • Apply CTA on back cover
//   • Other integrations (cohort, event page, partner orgs) noted as TODOs
//
// PARTICIPANT TEMPLATE: Replace ARTIST, PROGRAM, COVER_HERO, PRIMARY_QUOTE,
//   DRAMA_CLUBS, PROFILE_SLUG, and each chapter's .response / .photos / .audioUrl.
"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Image from "next/image";

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:     "#f2f2f2",
  ink:    "#241123",
  yellow: "#f5c842",
  teal:   "#2493a9",
  grape:  "#7b4fa6",
  muted:  "rgba(36,17,35,0.45)",
  dim:    "rgba(36,17,35,0.20)",
  sep:    "rgba(36,17,35,0.10)",
  border: "rgba(36,17,35,0.13)",
};

// ── Participant data (REPLACE all of this per artist) ─────────────────────────
const PROFILE_SLUG = "isa-martinez"; // → /alumni/isa-martinez

const ARTIST = {
  name:  "Isabel Martínez",
  // PARTICIPANT: your primary role(s) with DAT
  roles: ["Actor", "Teaching Artist"],
  photo: "https://images.squarespace-cdn.com/content/v1/6022114419b886404b1030fa/1688754593745-N9E8YZU0VE49QMQIOG4J/Marisa+Puller+007.jpg",
};

const PROGRAM = {
  name:     "PASSAGE · SLOVAKIA 2026",
  dates:    "July 12 – August 2, 2026",
  // PARTICIPANT: link to the event page for this program (or /get-involved)
  link:     "/get-involved",
  // PARTICIPANT: link to this program's event detail page if it exists
  // eventLink: "/events/passage-slovakia-2026",
};

const PRIMARY_QUOTE =
  "I arrived thinking I was here to teach. I left knowing how much I had been taught.";

// PARTICIPANT: one image that represents your entire journey — shown on the cover.
const COVER_HERO = {
  src:     "/images/projects/archive/teaching-artist-residency-slovakia-camp.webp",
  caption: "PASSAGE · Slovakia 2026",
};

// PARTICIPANT: drama clubs you work with — featured on the cover, linked.
// TODO: pull from participant's alumni profile data in production.
const DRAMA_CLUBS = [
  { name: "Teatro Esperanza", slug: "teatro-esperanza",  location: "Chicago, IL" },
  { name: "Young Voices Lab", slug: "young-voices-lab",  location: "Brooklyn, NY" },
];

// PARTICIPANT: cohort members on the same program — link to their profiles.
// TODO: pull from program roster in production; cross-link their journey cards.
// const COHORT = [
//   { name: "Javier Spivey", slug: "javier-spivey" },
//   { name: "Ana Arellano",  slug: "ana-arellano"  },
// ];

// ── Types ─────────────────────────────────────────────────────────────────────
type Photo   = { src: string; caption: string };
type Chapter = {
  id:          string;
  num:         string;
  location:    string;
  component:   string;
  description: string;
  response:    string;
  photos:      Photo[];
  audioUrl:    string | null;
  accentColor: string;
  mapDotId:    string | null;
  partnerOrg?: { name: string; url: string }; // optional partner org link
};

// ── Chapter data ──────────────────────────────────────────────────────────────
const CHAPTERS: Chapter[] = [
  {
    id: "before", num: "00", location: "BEFORE · DEPARTURE",
    component: "Prepare",
    description: "The bag is packed. The room is almost empty.",
    response: "I was afraid I would not know how to enter the room. I had no idea the room would change what entering meant.",
    photos: [
      { src: "/images/opportunities/PLX-hero.jpg",           caption: "the night before." },
      { src: "/images/opportunities/artist-development.jpg", caption: "what you carry." },
    ],
    audioUrl: null, accentColor: C.dim, mapDotId: null,
  },
  {
    id: "bratislava", num: "01", location: "BRATISLAVA",
    component: "Acclimate · Program Orientation",
    description: "Bratislava's cobblestone old town. First workshops. The group comes together.",
    response: "The first moment I arrived was not at the airport. It was the first time I heard the group laugh together.",
    photos: [
      { src: "/images/projects/archive/action-heart-of-europe-street-theatre.webp", caption: "the hallway laugh." },
    ],
    audioUrl: null, accentColor: C.yellow, mapDotId: "bratislava",
  },
  {
    id: "kosice-lab", num: "02", location: "KOŠICE",
    component: "Engage · DAT Lab",
    description: "Europe's City of Culture. Co-creative workshops with a local theatre company.",
    response: "A doorway — who stands inside, who waits outside, who gets invited in.",
    photos: [
      { src: "/images/rehearsing-nitra.jpg",        caption: "the doorway exercise." },
      { src: "/images/drama-clubs/club-sample.jpg", caption: "lab day two." },
    ],
    audioUrl: null, accentColor: C.teal, mapDotId: "kosice",
  },
  {
    id: "teplica", num: "03", location: "ZEMPLÍNSKA TEPLICA",
    component: "Connect · Teaching Artist Residency",
    description: "Community storytelling with Roma youth alongside ETP Slovensko.",
    response: "A student corrected my rhythm with her whole body. She taught me before we shared a language.",
    photos: [
      { src: "/images/projects/archive/teaching-artist-residency-slovakia-camp.webp", caption: "she counted with her shoulders." },
      { src: "/images/drama-clubs/boy-with-wings.jpg",                                caption: "games before language." },
    ],
    audioUrl: null, accentColor: C.grape, mapDotId: "teplica",
    // Partner org for this chapter
    partnerOrg: { name: "ETP Slovensko", url: "https://etp.sk" },
  },
  {
    id: "raj", num: "04", location: "SLOVENSKÝ RAJ",
    component: "Create · Cohort Retreat",
    description: "Mountain wilderness. The Dobšinská Ice Cave. Work development in the Slovak Paradise.",
    response: "The cave felt older than language. I stopped trying to make meaning and started listening.",
    photos: [
      { src: "/images/opportunities/team-adventure.jpg",             caption: "older than language." },
      { src: "/images/projects/archive/ACTion-Tanzania-3-hike.webp", caption: "the long way up." },
    ],
    audioUrl: null, accentColor: C.teal, mapDotId: "raj",
  },
  {
    id: "kosice-final", num: "05", location: "KOŠICE",
    component: "Perform · Eclectic Evening",
    description: "Return to Košice. Polish, rehearse, share. An evening of everything.",
    response: "A different relationship to silence.",
    photos: [
      { src: "/images/theatre/archive/hotel-millionaire/hotel_millionaire1.jpg", caption: "Eclectic Evening." },
      { src: "/images/theatre/archive/hotel-millionaire/hotel_millionaire2.jpg", caption: "the stage we built." },
      { src: "/images/theatre/archive/hotel-millionaire/hotel_millionaire3.jpg", caption: "final night." },
      { src: "/images/theatre/archive/esmeraldas_dumbshow.webp",                 caption: "the body remembers." },
    ],
    audioUrl: null, accentColor: C.yellow, mapDotId: "kosice",
    // TODO: link to the Eclectic Evening production page when it exists
    // partnerOrg: { name: "Eclectic Evening Program", url: "/events/eclectic-evening-2026" },
  },
  {
    id: "after", num: "06", location: "AFTER · RETURN",
    component: "Integrate",
    description: "Home looks the same. Something in the looking has changed.",
    response: "Home looked the same. I kept looking at it differently.",
    photos: [
      { src: "/images/opportunities/collaboration-joy.jpg", caption: "what you bring back." },
      { src: "/images/performing-zanzibar.jpg",             caption: "the practice continues." },
      { src: "/images/teaching-andes.jpg",                  caption: "the work goes on." },
    ],
    audioUrl: null, accentColor: C.teal, mapDotId: null,
  },
];

const ALL_CHAPTER_PHOTOS: Photo[] = CHAPTERS.flatMap((c) => c.photos);

function seededShuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  let s = 42;
  const rng = () => { s = (Math.imul(1664525, s) + 1013904223) | 0; return (s >>> 0) / 4294967296; };
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ── Slovakia mini-map ─────────────────────────────────────────────────────────
const SLOVAKIA_PATH =
  "M 4,40 L 10,49 L 22,51 L 36,50 L 50,48 L 64,44 L 78,40 " +
  "L 90,35 L 103,30 L 116,28 L 128,26 L 140,24 L 150,22 L 157,19 L 160,15 " +
  "L 156,9 L 147,4 L 132,1 L 116,2 L 100,0 L 82,4 L 66,2 L 52,7 " +
  "L 38,12 L 24,18 L 12,26 L 5,34 Z";
const MAP_DOTS: Record<string, { x: number; y: number }> = {
  bratislava: { x: 6,   y: 38 },
  kosice:     { x: 138, y: 21 },
  teplica:    { x: 148, y: 14 },
  raj:        { x: 120, y: 22 },
};

function SlovakiaMap({ dotId }: { dotId: string | null }) {
  return (
    <svg viewBox="0 0 160 54" style={{ width: 116, height: 40, display: "block" }} aria-hidden>
      <path d={SLOVAKIA_PATH} fill={C.dim} stroke={C.ink} strokeWidth="0.7" strokeOpacity="0.3" fillOpacity="0.45" />
      {Object.entries(MAP_DOTS).map(([id, d]) => {
        const active = dotId === id;
        return (
          <g key={id}>
            {active && <circle cx={d.x} cy={d.y} r={5.5} fill={C.yellow} opacity={0.28} />}
            <circle cx={d.x} cy={d.y} r={active ? 3.5 : 2.5} fill={active ? C.yellow : C.ink} opacity={active ? 1 : 0.45} />
          </g>
        );
      })}
    </svg>
  );
}

// ── Web Audio ─────────────────────────────────────────────────────────────────
interface AmbientProfile { noiseFreq: number; noiseGain: number; droneFreq: number; droneGain: number; lfoRate: number; lfoDepth: number; masterGain: number; }
const AUDIO_PROFILES: Record<string, AmbientProfile> = {
  before:         { noiseFreq: 2200, noiseGain: 0.45, droneFreq: 55,  droneGain: 0.12, lfoRate: 0.07, lfoDepth: 2,  masterGain: 0.22 },
  bratislava:     { noiseFreq: 900,  noiseGain: 0.50, droneFreq: 65,  droneGain: 0.10, lfoRate: 0.13, lfoDepth: 5,  masterGain: 0.20 },
  "kosice-lab":   { noiseFreq: 420,  noiseGain: 0.30, droneFreq: 82,  droneGain: 0.18, lfoRate: 0.06, lfoDepth: 2,  masterGain: 0.18 },
  teplica:        { noiseFreq: 3500, noiseGain: 0.32, droneFreq: 98,  droneGain: 0.10, lfoRate: 0.28, lfoDepth: 9,  masterGain: 0.18 },
  raj:            { noiseFreq: 180,  noiseGain: 0.18, droneFreq: 41,  droneGain: 0.28, lfoRate: 0.02, lfoDepth: 1,  masterGain: 0.16 },
  "kosice-final": { noiseFreq: 650,  noiseGain: 0.35, droneFreq: 110, droneGain: 0.16, lfoRate: 0.10, lfoDepth: 4,  masterGain: 0.20 },
  after:          { noiseFreq: 280,  noiseGain: 0.14, droneFreq: 65,  droneGain: 0.20, lfoRate: 0.04, lfoDepth: 1.5,masterGain: 0.14 },
  cover:          { noiseFreq: 500,  noiseGain: 0.20, droneFreq: 55,  droneGain: 0.18, lfoRate: 0.05, lfoDepth: 2,  masterGain: 0.14 },
};

function buildReverb(ctx: AudioContext, secs: number, decay: number): ConvolverNode {
  const len = ctx.sampleRate * secs;
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  const conv = ctx.createConvolver(); conv.buffer = buf; return conv;
}

function startAmbient(ctx: AudioContext, id: string): () => void {
  const p = AUDIO_PROFILES[id] ?? AUDIO_PROFILES.cover;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0, ctx.currentTime);
  master.gain.linearRampToValueAtTime(p.masterGain, ctx.currentTime + 1.0);
  const reverb = buildReverb(ctx, 2.2, 3.0);
  const rvGain = ctx.createGain(); rvGain.gain.value = 0.3;
  reverb.connect(rvGain); rvGain.connect(master);
  const nBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const nd = nBuf.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource(); noise.buffer = nBuf; noise.loop = true;
  const nFilter = ctx.createBiquadFilter(); nFilter.type = "lowpass"; nFilter.frequency.value = p.noiseFreq;
  const nGain = ctx.createGain(); nGain.gain.value = p.noiseGain;
  noise.connect(nFilter); nFilter.connect(nGain); nGain.connect(master); nGain.connect(reverb); noise.start();
  const drone = ctx.createOscillator(); drone.type = "sine"; drone.frequency.value = p.droneFreq;
  const dGain = ctx.createGain(); dGain.gain.value = p.droneGain;
  const lfo = ctx.createOscillator(); lfo.type = "sine"; lfo.frequency.value = p.lfoRate;
  const lfoG = ctx.createGain(); lfoG.gain.value = p.lfoDepth;
  lfo.connect(lfoG); lfoG.connect(drone.frequency);
  drone.connect(dGain); dGain.connect(master); dGain.connect(reverb); drone.start(); lfo.start();
  master.connect(ctx.destination);
  return (t = 0.45) => {
    master.gain.linearRampToValueAtTime(0, ctx.currentTime + t);
    setTimeout(() => { try { noise.stop(); drone.stop(); lfo.stop(); master.disconnect(); } catch { /**/ } }, (t + 0.2) * 1000);
  };
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function SpeakerIcon({ muted, size = 18 }: { muted: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none" />
      {muted ? (
        <><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></>
      ) : (
        <><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></>
      )}
    </svg>
  );
}

function ShareIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

// ── Controls ──────────────────────────────────────────────────────────────────
function SoundToggle({ playing, onToggle }: { playing: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} className="jc-v12-btn"
      title={playing ? "Mute ambient sound" : "Play ambient sound"}
      style={{
        display: "flex", alignItems: "center", gap: 7,
        border: `1.5px solid ${playing ? C.ink : C.border}`,
        borderRadius: 20, padding: "7px 14px", cursor: "pointer",
        backgroundColor: playing ? C.ink : "transparent",
        color: playing ? C.bg : C.ink,
      }}>
      <SpeakerIcon muted={!playing} size={16} />
      <span style={{
        fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
        fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
      }}>{playing ? "Sound on" : "Listen"}</span>
    </button>
  );
}

function ShareButton({ title, text, onCopied }: { title: string; text: string; onCopied: () => void }) {
  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      try { await navigator.share({ title, text, url }); } catch { /* dismissed */ }
    } else {
      try { await navigator.clipboard.writeText(url); onCopied(); } catch { /* no clipboard */ }
    }
  };
  return (
    <button type="button" onClick={share} className="jc-v12-btn" title="Share this journey"
      style={{
        display: "flex", alignItems: "center", gap: 7,
        border: `1.5px solid ${C.border}`, borderRadius: 20,
        padding: "7px 14px", cursor: "pointer",
        backgroundColor: "transparent", color: C.ink,
      }}>
      <ShareIcon size={16} />
      <span style={{
        fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
        fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
      }}>Share</span>
    </button>
  );
}

// ── Photo grid ────────────────────────────────────────────────────────────────
function PhotoGrid({ photos, W, H }: { photos: Photo[]; W: number; H: number }) {
  const n = photos.length;
  const G = 2;
  if (n === 0) return <div style={{ width: W, height: H, backgroundColor: "#e8e2da" }} />;
  if (n === 1) return (
    <div style={{ width: W, height: H, position: "relative", overflow: "hidden" }}>
      <Image src={photos[0].src} alt={photos[0].caption} fill sizes={`${W}px`} style={{ objectFit: "cover" }} />
    </div>
  );
  if (n === 2) {
    const w = Math.floor((W - G) / 2);
    return (
      <div style={{ display: "flex", gap: G, width: W, height: H }}>
        {photos.map((p, i) => (
          <div key={i} style={{ width: w, height: H, position: "relative", overflow: "hidden", flexShrink: 0 }}>
            <Image src={p.src} alt={p.caption} fill sizes={`${w}px`} style={{ objectFit: "cover" }} />
          </div>
        ))}
      </div>
    );
  }
  if (n === 3) {
    const lW = Math.floor(W * 0.56); const rW = W - lW - G; const rH = Math.floor((H - G) / 2);
    return (
      <div style={{ display: "flex", gap: G, width: W, height: H }}>
        <div style={{ width: lW, height: H, position: "relative", overflow: "hidden", flexShrink: 0 }}>
          <Image src={photos[0].src} alt={photos[0].caption} fill sizes={`${lW}px`} style={{ objectFit: "cover" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: G, width: rW, flexShrink: 0 }}>
          {[1, 2].map((i) => (
            <div key={i} style={{ width: rW, height: rH, position: "relative", overflow: "hidden" }}>
              <Image src={photos[i].src} alt={photos[i].caption} fill sizes={`${rW}px`} style={{ objectFit: "cover" }} />
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (n === 4) {
    const w = Math.floor((W - G) / 2); const h = Math.floor((H - G) / 2);
    return (
      <div style={{ display: "grid", gridTemplateColumns: `repeat(2,${w}px)`, gridTemplateRows: `repeat(2,${h}px)`, gap: G }}>
        {photos.map((p, i) => (
          <div key={i} style={{ position: "relative", overflow: "hidden" }}>
            <Image src={p.src} alt={p.caption} fill sizes={`${w}px`} style={{ objectFit: "cover" }} />
          </div>
        ))}
      </div>
    );
  }
  // 5: left tall + right 2×2
  const lW = Math.floor((W - G) / 2); const rW = W - lW - G; const rH = Math.floor((H - G) / 2);
  return (
    <div style={{ display: "flex", gap: G, width: W, height: H }}>
      <div style={{ width: lW, height: H, position: "relative", overflow: "hidden", flexShrink: 0 }}>
        <Image src={photos[0].src} alt={photos[0].caption} fill sizes={`${lW}px`} style={{ objectFit: "cover" }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: `${rH}px ${rH}px`, gap: G, width: rW, flexShrink: 0 }}>
        {photos.slice(1, 5).map((p, i) => (
          <div key={i} style={{ position: "relative", overflow: "hidden" }}>
            <Image src={p.src} alt={p.caption} fill sizes={`${Math.floor(rW / 2)}px`} style={{ objectFit: "cover" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Cover page ────────────────────────────────────────────────────────────────
function CoverPage({
  soundPlaying, onSoundToggle, onCopied,
}: {
  soundPlaying: boolean; onSoundToggle: () => void; onCopied: () => void;
}) {
  const LEFT_W     = 470;
  const STAMP_SIZE = 148; // larger, no big disc

  return (
    <div style={{ position: "relative", display: "flex", width: 1080, height: 580, backgroundColor: C.bg, overflow: "hidden" }}>

      {/* ── Left: identity panel ── */}
      <div style={{
        width: LEFT_W, flexShrink: 0, backgroundColor: C.bg,
        display: "flex", flexDirection: "column",
        padding: "26px 32px 22px 28px", zIndex: 2,
      }}>
        {/* "My Journey" framing — establishes first-person authorship */}
        <p style={{
          fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
          fontWeight: 700, fontSize: "10px", letterSpacing: "0.28em",
          textTransform: "uppercase", color: C.teal, margin: "0 0 8px",
        }}>
          ✦ My Journey
        </p>

        {/* PASSAGE — dominant */}
        <h1 style={{
          fontFamily: "var(--font-anton), system-ui, sans-serif",
          fontSize: 84, lineHeight: 0.91, color: C.ink,
          margin: "0 0 8px", letterSpacing: "0.01em", textTransform: "uppercase",
        }}>
          PASSAGE
        </h1>

        {/* SLOVAKIA 2026 — linked to program page, more prominent */}
        <a href={PROGRAM.link} className="jc-v12-link" style={{ textDecoration: "none" }}>
          <p style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontWeight: 700, fontSize: "17px", letterSpacing: "0.28em",
            textTransform: "uppercase", color: C.teal, margin: "0 0 4px",
          }}>
            SLOVAKIA 2026 ↗
          </p>
        </a>
        <p style={{
          fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
          fontSize: "12px", color: C.muted, margin: "0 0 16px",
        }}>
          {PROGRAM.dates}
        </p>

        {/* Thin rule */}
        <div style={{ width: 40, height: 1, backgroundColor: C.ink, opacity: 0.2, marginBottom: 16 }} />

        {/* Primary quote */}
        <p style={{
          fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
          fontStyle: "italic", fontSize: 14, lineHeight: 1.72,
          color: C.ink, margin: "0 0 auto", opacity: 0.82,
        }}>
          &ldquo;{PRIMARY_QUOTE}&rdquo;
        </p>

        {/* ── Bottom: headshot + identity + clubs + controls ── */}
        <div style={{ marginTop: 18, display: "flex", gap: 14, alignItems: "stretch" }}>

          {/* Headshot — linked to profile, large enough to see the face */}
          <a
            href={`/alumni/${PROFILE_SLUG}`}
            className="jc-v12-imglink"
            style={{ flexShrink: 0, display: "block", textDecoration: "none" }}
          >
            <div style={{
              width: 70, height: 88, borderRadius: 4, overflow: "hidden",
              position: "relative", border: `1px solid ${C.border}`,
            }}>
              <Image
                src={ARTIST.photo} alt={ARTIST.name} fill sizes="70px"
                style={{ objectFit: "cover", objectPosition: "center 12%" }}
              />
            </div>
          </a>

          {/* Right of headshot: name, role, clubs, buttons */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", minWidth: 0 }}>

            {/* Name + roles */}
            <div>
              <a
                href={`/alumni/${PROFILE_SLUG}`}
                className="jc-v12-link"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <p style={{
                  fontFamily: "var(--font-anton), system-ui, sans-serif",
                  fontSize: 19, color: C.ink, margin: "0 0 1px",
                  textTransform: "uppercase", lineHeight: 1,
                }}>
                  {ARTIST.name}
                </p>
              </a>
              {/* "Traveling Teaching Artist" — communicates physical travel */}
              <p style={{
                fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                fontSize: "11px", color: C.teal, margin: "0 0 6px", fontWeight: 600,
              }}>
                Traveling {ARTIST.roles.join(" · ")}
              </p>

              {/* Drama clubs — featured, linked */}
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {DRAMA_CLUBS.map((dc) => (
                  <a
                    key={dc.slug}
                    href={`/drama-club/${dc.slug}`}
                    className="jc-v12-pill"
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 3,
                      fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                      fontSize: "9.5px", fontWeight: 700, letterSpacing: "0.08em",
                      textTransform: "uppercase", textDecoration: "none",
                      color: C.grape, border: `1px solid ${C.grape}`,
                      borderRadius: 10, padding: "2px 8px",
                    }}
                  >
                    {dc.name} ↗
                  </a>
                ))}
              </div>
            </div>

            {/* Controls */}
            <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
              <SoundToggle playing={soundPlaying} onToggle={onSoundToggle} />
              <ShareButton title={PROGRAM.name} text={PRIMARY_QUOTE} onCopied={onCopied} />
            </div>
          </div>
        </div>

        {/* Attribution — clearly created by the artist */}
        <p style={{
          fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
          fontSize: "10px", color: C.dim, margin: "10px 0 0",
          fontStyle: "italic", letterSpacing: "0.02em",
        }}>
          This journey card was created by {ARTIST.name}.
        </p>
      </div>

      {/* ── Right: hero image — full bleed, linked to artist profile ── */}
      <a
        href={`/alumni/${PROFILE_SLUG}`}
        className="jc-v12-imglink"
        style={{ flex: 1, position: "relative", overflow: "hidden", display: "block" }}
      >
        <Image
          src={COVER_HERO.src}
          alt={COVER_HERO.caption}
          fill priority sizes="610px"
          style={{ objectFit: "cover", objectPosition: "center" }}
        />
      </a>

      {/* ── DAT logo stamp — top-left corner of the hero image ──────────────────
          Positioned entirely within the photo panel, kissing the panel boundary.
          This guarantees the stamp never overlaps any text on the left panel.   */}
      <a
        href="/"
        title="Dramatic Adventure Theatre"
        style={{
          position: "absolute",
          left: LEFT_W - 18,        // 18px overlap into right panel boundary
          top: 16,
          zIndex: 10,
          display: "block",
          textDecoration: "none",
        }}
      >
        <div style={{
          width: STAMP_SIZE + 12,   // minimal disc: just 6px padding each side
          height: STAMP_SIZE + 12,
          borderRadius: "50%",
          backgroundColor: C.bg,
          display: "flex", alignItems: "center", justifyContent: "center",
          filter: "drop-shadow(0 3px 12px rgba(36,17,35,0.28))",
        }}>
          <Image
            src="/images/dat-logo7.svg"
            alt="Dramatic Adventure Theatre"
            width={STAMP_SIZE} height={STAMP_SIZE}
            style={{ display: "block" }}
          />
        </div>
      </a>
    </div>
  );
}

// ── Back cover page ───────────────────────────────────────────────────────────
function BackCoverPage({ photos }: { photos: Photo[] }) {
  const G = 2; const cols = 4; const rows = 4;
  const cellW = Math.floor((1080 - G * (cols - 1)) / cols);
  const cellH = Math.floor((580 - G * (rows - 1)) / rows);
  const grid = [...photos.slice(0, 16)];
  while (grid.length < 16) grid.push(photos[grid.length % photos.length]);

  return (
    <div style={{ position: "relative", width: 1080, height: 580, overflow: "hidden" }}>
      {/* Image mosaic */}
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, ${cellW}px)`,
        gridTemplateRows: `repeat(${rows}, ${cellH}px)`,
        gap: G,
      }}>
        {grid.map((p, i) => (
          <div key={i} style={{ position: "relative", overflow: "hidden" }}>
            <Image src={p.src} alt={p.caption} fill sizes={`${cellW}px`} style={{ objectFit: "cover" }} />
          </div>
        ))}
      </div>

      {/* Dark scrim */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(36,17,35,0.22)", pointerEvents: "none" }} />

      {/* DAT stamp — centered — linked to homepage */}
      <a href="/" title="Dramatic Adventure Theatre — Home" style={{
        position: "absolute", left: "50%", top: "50%",
        transform: "translate(-50%, -50%)",
        display: "block", textDecoration: "none", zIndex: 10,
      }}>
        <div style={{
          width: 160, height: 160, borderRadius: "50%",
          backgroundColor: C.bg,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 6px 30px rgba(36,17,35,0.35)",
          filter: "drop-shadow(0 2px 6px rgba(36,17,35,0.2))",
        }}>
          <Image
            src="/images/dat-logo7.svg"
            alt="Dramatic Adventure Theatre"
            width={148} height={148}
            style={{ display: "block" }}
          />
        </div>
      </a>

      {/* Program + artist credit */}
      <div style={{
        position: "absolute", bottom: 16, left: 0, right: 0,
        display: "flex", justifyContent: "center", zIndex: 11, pointerEvents: "none",
      }}>
        <span style={{
          fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
          fontWeight: 700, fontSize: "10px", letterSpacing: "0.22em",
          textTransform: "uppercase", color: C.bg, opacity: 0.8,
          backgroundColor: "rgba(36,17,35,0.4)", padding: "4px 16px", borderRadius: 2,
        }}>
          {PROGRAM.name} · Created by {ARTIST.name}
        </span>
      </div>

      {/* Apply CTA — top left */}
      <a
        href="/apply"
        className="jc-v12-btn"
        style={{
          position: "absolute", top: 16, left: 16, zIndex: 11,
          display: "flex", alignItems: "center", gap: 6,
          fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
          fontWeight: 700, fontSize: "10px", letterSpacing: "0.14em",
          textTransform: "uppercase", textDecoration: "none",
          color: C.ink, backgroundColor: C.yellow,
          padding: "7px 14px", borderRadius: 3,
        }}
      >
        Travel with DAT ↗
      </a>
    </div>
  );
}

// ── Journey page ──────────────────────────────────────────────────────────────
function JourneyPage({
  chapter, soundPlaying, onSoundToggle, onCopied,
}: {
  chapter: Chapter; soundPlaying: boolean; onSoundToggle: () => void; onCopied: () => void;
}) {
  const journalW = 378;
  const photoW   = 1080 - journalW;

  return (
    <div style={{ display: "flex", width: 1080, height: 580 }}>

      {/* ── Left: journal panel ── */}
      <div style={{
        width: journalW, flexShrink: 0, backgroundColor: C.bg,
        display: "flex", flexDirection: "column",
        padding: "22px 24px 18px 24px",
        borderRight: `1px solid ${C.sep}`,
      }}>
        {/* Header: DAT logo (small, linked) + PASSAGE + program label */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <a href="/" title="Dramatic Adventure Theatre" className="jc-v12-link" style={{ display: "block", lineHeight: 0 }}>
              <Image src="/images/dat-logo7.svg" alt="DAT" width={28} height={28} />
            </a>
            <a href={PROGRAM.link} className="jc-v12-link" style={{ textDecoration: "none" }}>
              <span style={{
                fontFamily: "var(--font-anton), system-ui, sans-serif",
                fontSize: 20, color: C.ink, letterSpacing: "0.04em", textTransform: "uppercase",
              }}>PASSAGE</span>
            </a>
          </div>
          <span style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontWeight: 700, fontSize: "10px", letterSpacing: "0.16em",
            textTransform: "uppercase", color: C.teal,
          }}>SLOVAKIA 2026</span>
        </div>

        <div style={{ width: "100%", height: 1, backgroundColor: C.sep, marginBottom: 14 }} />

        {/* Chapter number + location */}
        <p style={{
          fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
          fontWeight: 700, fontSize: "10px", letterSpacing: "0.22em",
          textTransform: "uppercase", color: C.teal, margin: "0 0 3px",
        }}>
          {chapter.num}
        </p>
        <p style={{
          fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
          fontWeight: 700, fontSize: "14px", letterSpacing: "0.1em",
          textTransform: "uppercase", color: C.ink, margin: "0 0 2px", lineHeight: 1.2,
        }}>
          {chapter.location}
        </p>
        <p style={{
          fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
          fontSize: "11px", color: C.teal, margin: "0 0 14px", lineHeight: 1.3,
        }}>
          {chapter.component}
        </p>

        {/* Artist's response — primary content */}
        <p style={{
          fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
          fontStyle: "italic", fontSize: 15, lineHeight: 1.72,
          color: C.ink, margin: "0 0 auto",
          borderLeft: `3px solid ${chapter.accentColor}`,
          paddingLeft: 13,
        }}>
          &ldquo;{chapter.response}&rdquo;
        </p>

        {/* Attribution on each chapter */}
        <p style={{
          fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
          fontSize: "10px", color: C.dim, fontStyle: "italic",
          margin: "6px 0 0", paddingLeft: 16,
        }}>
          — {ARTIST.name}
        </p>

        {/* Context line */}
        <p style={{
          fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
          fontSize: "11px", color: C.muted, lineHeight: 1.5, margin: "10px 0 12px",
        }}>
          {chapter.description}
        </p>

        {/* Partner org link (if present — e.g. ETP Slovensko on chapter 03) */}
        {chapter.partnerOrg && (
          <a
            href={chapter.partnerOrg.url}
            target="_blank"
            rel="noopener noreferrer"
            className="jc-v12-pill"
            style={{
              display: "inline-flex", alignItems: "center", gap: 3,
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "9.5px", fontWeight: 700, letterSpacing: "0.08em",
              textTransform: "uppercase", textDecoration: "none",
              color: C.teal, border: `1px solid ${C.teal}`,
              borderRadius: 10, padding: "2px 9px", marginBottom: 10,
              width: "fit-content",
            }}
          >
            In partnership with {chapter.partnerOrg.name} ↗
          </a>
        )}

        {/* Bottom: map + controls */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            {chapter.mapDotId && (
              <>
                <p style={{
                  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                  fontWeight: 700, fontSize: "10px", letterSpacing: "0.18em",
                  textTransform: "uppercase", color: C.dim, margin: "0 0 4px",
                }}>Slovakia</p>
                <SlovakiaMap dotId={chapter.mapDotId} />
              </>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5, alignItems: "flex-end" }}>
            <SoundToggle playing={soundPlaying} onToggle={onSoundToggle} />
            <ShareButton
              title={`${chapter.location} — ${PROGRAM.name}`}
              text={chapter.response}
              onCopied={onCopied}
            />
          </div>
        </div>
      </div>

      {/* ── Right: photo panel ── */}
      <div style={{ flex: 1, overflow: "hidden", backgroundColor: "#e8e2da" }}>
        <PhotoGrid photos={chapter.photos} W={photoW} H={580} />
      </div>
    </div>
  );
}

// ── Chapter dots ──────────────────────────────────────────────────────────────
const PAGE_LABELS = ["Cover", ...CHAPTERS.map((c) => c.num), "End"];

function ChapterDots({ total, current, onSelect }: { total: number; current: number; onSelect: (i: number) => void }) {
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "center", padding: "12px 0 0" }}>
      {Array.from({ length: total }).map((_, i) => (
        <button key={i} type="button" onClick={() => onSelect(i)} title={PAGE_LABELS[i]}
          className="jc-v12-dot"
          style={{
            width: current === i ? 22 : 7, height: 7, borderRadius: 4,
            border: "none", padding: 0, cursor: "pointer",
            backgroundColor: current === i ? C.ink : C.dim,
            transition: "width 0.22s ease, background-color 0.18s ease",
          }} />
      ))}
    </div>
  );
}

// ── Mockup banner ─────────────────────────────────────────────────────────────
function MockupBanner() {
  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 200, backgroundColor: C.yellow,
      padding: "0.4rem 1.25rem", display: "flex", alignItems: "center",
      justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap",
      boxShadow: "0 2px 6px rgba(0,0,0,0.10)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
        <span style={{
          fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
          fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase",
          backgroundColor: C.ink, color: C.yellow, padding: "0.18em 0.55em", borderRadius: "3px",
        }}>⚠ MOCKUP</span>
        <span style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: "0.75rem", color: C.ink, opacity: 0.65 }}>
          /journey-card-mockup/v12 · links · drama clubs · hover effects · bigger headshot
        </span>
      </div>
      <nav style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
        {([
          ["/journey-card-mockup/v10", "← v10"],
          ["/journey-card-mockup/v11", "← v11"],
          ["/journey-card-mockup/v12", "v12"],
        ] as [string, string][]).map(([href, label]) => (
          <a key={href} href={href} style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "0.58rem", fontWeight: 600, letterSpacing: "0.08em",
            textTransform: "uppercase", color: C.ink, textDecoration: "none",
            padding: "0.18rem 0.5rem", borderRadius: "3px",
            backgroundColor: label === "v12" ? "rgba(36,17,35,0.18)" : "rgba(36,17,35,0.09)",
          }}>{label}</a>
        ))}
      </nav>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div style={{
      position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
      backgroundColor: C.ink, color: C.bg, borderRadius: 6,
      padding: "10px 20px", zIndex: 999, pointerEvents: "none",
      fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
      fontSize: "13px", letterSpacing: "0.02em",
      opacity: visible ? 1 : 0, transition: "opacity 0.3s ease",
      boxShadow: "0 4px 16px rgba(36,17,35,0.25)",
    }}>
      {message}
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function JourneyCardV12() {
  const TOTAL = 2 + CHAPTERS.length; // 9: cover + 7 chapters + back cover

  const [page, setPage]               = useState(0);
  const [soundPlaying, setSoundPlaying] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [toastMsg, setToastMsg]       = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const audioCtxRef  = useRef<AudioContext | null>(null);
  const stopRef      = useRef<((fadeTime?: number) => void) | null>(null);
  const touchStartX  = useRef<number | null>(null);
  const toastTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);

  const shuffledPhotos = useMemo(() => seededShuffle(ALL_CHAPTER_PHOTOS), []);

  const chapterIdForPage = (p: number): string => {
    if (p === 0 || p === TOTAL - 1) return "cover";
    return CHAPTERS[p - 1].id;
  };

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg); setToastVisible(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastVisible(false), 2400);
  }, []);

  const goTo = useCallback((idx: number) => {
    if (idx < 0 || idx >= TOTAL) return;
    setPage(idx);
    if (soundPlaying && audioCtxRef.current) {
      if (stopRef.current) { stopRef.current(0.35); stopRef.current = null; }
      stopRef.current = startAmbient(audioCtxRef.current, chapterIdForPage(idx));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundPlaying, TOTAL]);

  const toggleSound = useCallback(() => {
    if (!hasInteracted) {
      const Ctor = typeof window !== "undefined"
        ? (window.AudioContext || (window as unknown as Record<string, typeof AudioContext>).webkitAudioContext)
        : undefined;
      if (!Ctor) return;
      const ctx = new Ctor();
      audioCtxRef.current = ctx;
      stopRef.current = startAmbient(ctx, chapterIdForPage(page));
      setSoundPlaying(true); setHasInteracted(true);
      return;
    }
    if (soundPlaying) {
      if (stopRef.current) { stopRef.current(0.4); stopRef.current = null; }
      setSoundPlaying(false);
    } else {
      if (audioCtxRef.current) stopRef.current = startAmbient(audioCtxRef.current, chapterIdForPage(page));
      setSoundPlaying(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasInteracted, soundPlaying, page]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") goTo(page + 1);
      if (e.key === "ArrowLeft"  || e.key === "ArrowUp")   goTo(page - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [page, goTo]);

  useEffect(() => () => {
    if (stopRef.current) stopRef.current(0.1);
    if (audioCtxRef.current) audioCtxRef.current.close();
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const isChapterPage = page > 0 && page < TOTAL - 1;
  const chapter       = isChapterPage ? CHAPTERS[page - 1] : null;

  return (
    <>
      <style>{`
        /* ── Hover effects ─────────────────────────────────────────── */
        .jc-v12-btn {
          transition: all 0.18s ease;
        }
        .jc-v12-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 3px 10px rgba(36,17,35,0.18);
        }
        .jc-v12-link {
          transition: opacity 0.15s ease;
        }
        .jc-v12-link:hover {
          opacity: 0.65;
        }
        .jc-v12-imglink {
          transition: transform 0.22s ease;
          display: block;
        }
        .jc-v12-imglink:hover {
          transform: scale(0.975);
        }
        .jc-v12-pill {
          transition: background-color 0.15s ease, opacity 0.15s ease;
        }
        .jc-v12-pill:hover {
          background-color: rgba(36,17,35,0.06);
        }
        .jc-v12-dot:hover {
          background-color: rgba(36,17,35,0.45) !important;
        }
        /* ── Container ─────────────────────────────────────────────── */
        .jc-v12-outer {
          width: 1080px; height: 580px;
          border-radius: 5px; overflow: hidden; position: relative;
          flex-shrink: 0;
          border: 1px solid ${C.border};
          box-shadow: 0 8px 40px rgba(36,17,35,0.14), 0 2px 10px rgba(36,17,35,0.07);
        }
        @media (max-width: 1120px) {
          .jc-v12-outer { width: 100%; height: auto; min-height: 560px; }
          .jc-v12-track > * { width: 100vw !important; }
        }
      `}</style>

      <MockupBanner />

      <main style={{
        backgroundColor: "#e8e2da", minHeight: "100vh",
        padding: "28px 16px 64px",
        display: "flex", flexDirection: "column", alignItems: "center",
      }}>
        {/* Meta label */}
        <div style={{
          width: "100%", maxWidth: 1080,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 12,
        }}>
          <span style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.2em",
            textTransform: "uppercase", color: C.muted,
          }}>
            {page === 0 ? "Cover" : page === TOTAL - 1 ? "Back Cover" : `${chapter?.num} · ${chapter?.location}`}
          </span>
          <span style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: "0.65rem", color: C.muted, fontStyle: "italic" }}>
            ← → to navigate
          </span>
        </div>

        {/* ── Sliding card ── */}
        <div
          className="jc-v12-outer"
          onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchStartX.current;
            if (dx < -40) goTo(page + 1);
            if (dx >  40) goTo(page - 1);
            touchStartX.current = null;
          }}
        >
          {/* Slide track */}
          <div
            className="jc-v12-track"
            style={{
              display: "flex", width: `${TOTAL * 1080}px`, height: "100%",
              transform: `translateX(-${page * 1080}px)`,
              transition: "transform 360ms cubic-bezier(0.4, 0, 0.2, 1)",
              willChange: "transform",
            }}
          >
            {/* Page 0: Cover */}
            <div style={{ width: 1080, height: "100%", flexShrink: 0 }}>
              <CoverPage soundPlaying={soundPlaying && page === 0} onSoundToggle={toggleSound} onCopied={() => showToast("Link copied!")} />
            </div>

            {/* Pages 1–7: Chapters */}
            {CHAPTERS.map((ch, i) => (
              <div key={ch.id} style={{ width: 1080, height: "100%", flexShrink: 0 }}>
                <JourneyPage
                  chapter={ch}
                  soundPlaying={soundPlaying && page === i + 1}
                  onSoundToggle={toggleSound}
                  onCopied={() => showToast("Link copied!")}
                />
              </div>
            ))}

            {/* Page 8: Back Cover */}
            <div style={{ width: 1080, height: "100%", flexShrink: 0 }}>
              <BackCoverPage photos={shuffledPhotos} />
            </div>
          </div>

          {/* ← Prev */}
          {page > 0 && (
            <button type="button" onClick={() => goTo(page - 1)} aria-label="Previous page"
              className="jc-v12-btn"
              style={{
                position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                width: 36, height: 36, borderRadius: "50%", border: "none", cursor: "pointer",
                backgroundColor: "rgba(242,242,242,0.82)",
                boxShadow: "0 1px 6px rgba(36,17,35,0.14)",
                display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10,
              }}>
              <span style={{ fontSize: 20, color: C.ink, opacity: 0.6, lineHeight: 1, marginRight: 2 }}>‹</span>
            </button>
          )}

          {/* → Next */}
          {page < TOTAL - 1 && (
            <button type="button" onClick={() => goTo(page + 1)} aria-label="Next page"
              className="jc-v12-btn"
              style={{
                position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                width: 36, height: 36, borderRadius: "50%", border: "none", cursor: "pointer",
                backgroundColor: "rgba(242,242,242,0.82)",
                boxShadow: "0 1px 6px rgba(36,17,35,0.14)",
                display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10,
              }}>
              <span style={{ fontSize: 20, color: C.ink, opacity: 0.6, lineHeight: 1, marginLeft: 2 }}>›</span>
            </button>
          )}
        </div>

        {/* ── Dots ── */}
        <div style={{ width: "100%", maxWidth: 1080 }}>
          <ChapterDots total={TOTAL} current={page} onSelect={goTo} />
        </div>

        {/* ── Page labels ── */}
        <div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap", justifyContent: "center" }}>
          {PAGE_LABELS.map((label, i) => (
            <button key={i} type="button" onClick={() => goTo(i)}
              className="jc-v12-btn"
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: i === page ? C.ink : C.dim,
                padding: "2px 5px",
              }}>
              {label}
            </button>
          ))}
        </div>
      </main>

      <Toast message={toastMsg} visible={toastVisible} />
    </>
  );
}
