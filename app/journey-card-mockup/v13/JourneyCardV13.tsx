// app/journey-card-mockup/v13/JourneyCardV13.tsx
// ⚠️  MOCKUP ONLY — no live data, no auth, no backend.
//
// v13 — refinement pass:
//   • Cover stamp bumped to 184px and the trailing arrow on SLOVAKIA 2026 dropped.
//   • DRAMATIC ADVENTURE THEATRE is linked to "/" and rendered in DAT gold #D9A919.
//   • PASSAGE wordmark + SLOVAKIA 2026 are now both external links to
//     https://www.dramaticadventure.com/get-involved (cover + chapter pages).
//   • SLOVAKIA 2026 appears directly under PASSAGE on every page (consistent stack).
//   • Partner orgs are now a list (chapter.partnerOrgs[]) — each gets a richer
//     "feature-ette": logo + name + location + paragraph + external link.
//     Chapter 02 (Košice · DAT Lab) adds a local theatre company alongside ETP.
//   • Drama clubs use their own visually distinct treatment: circular logo +
//     horizontal mini-card. Logos pulled from /images/drama-clubs/.
//   • Travel-with-DAT CTA: DAT pink, no arrow, bigger pill — more enticing.
//   • Back-cover credit shortened to "Created by Isabel Martínez".
//   • Page sheen: a soft diagonal specular gradient overlays the card so it
//     reads as a printed/laminated artifact.
//   • Retina-ready: every Image gets quality=92 and a doubled `sizes` hint so
//     Next.js requests a high-DPI source. The Squarespace hero is requested at
//     a 2500w variant so it stays crisp on retina.
//   • Mobile: at viewports ≤720px the card reflows into a passport-sized book
//     (~380×600, portrait), with each page stacking content vertically and the
//     horizontal page-flip metaphor preserved. Above 720px the card stays at
//     its native 1080×580 (no scale tricks — the layout was designed for that
//     size and we render it natively when there's room).

"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Image from "next/image";

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:     "#f2f2f2",
  ink:    "#241123",
  yellow: "#f5c842",
  gold:   "#D9A919", // DAT gold — top "DRAMATIC ADVENTURE THEATRE" line.
  teal:   "#2493a9",
  pink:   "#F23359", // DAT pink — "hero" text only, never body copy.
  grape:  "#7b4fa6",
  muted:  "rgba(36,17,35,0.45)",
  dim:    "rgba(36,17,35,0.20)",
  sep:    "rgba(36,17,35,0.10)",
  border: "rgba(36,17,35,0.13)",
};

const STAMP_SHADOW = "drop-shadow(0 2px 4px rgba(36,17,35,0.35)) drop-shadow(0 6px 18px rgba(36,17,35,0.28))";

// ── Participant data (REPLACE all of this per artist) ─────────────────────────
const PROFILE_SLUG = "isa-martinez";

const ARTIST = {
  name:  "Isabel Martínez",
  roles: ["Actor", "Teaching Artist"],
  // PARTICIPANT: For retina crispness we request a 2500w Squarespace variant.
  photo: "https://images.squarespace-cdn.com/content/v1/6022114419b886404b1030fa/1688754593745-N9E8YZU0VE49QMQIOG4J/Marisa+Puller+007.jpg?format=2500w",
};

const PROGRAM = {
  name:  "PASSAGE · SLOVAKIA 2026",
  dates: "July 12 – August 2, 2026",
  // PARTICIPANT: external program/get-involved page.
  link:  "https://www.dramaticadventure.com/get-involved",
};

const PRIMARY_QUOTE =
  "I arrived thinking I was here to teach. I left knowing how much I had been taught.";

const COVER_HERO = {
  src:     "/images/projects/archive/teaching-artist-residency-slovakia-camp.webp",
  caption: "PASSAGE · Slovakia 2026",
};

// ── Drama clubs — Slovakia-based per spec ────────────────────────────────────
// Logo resolution mirrors how /theatre/[slug] pages source hero images via
// lib/dramaClubMap.ts (`logoSrc` → `cardImage` → `heroImage` → fallback). In
// production we'll import the real `DramaClub` records from lib/dramaClubMap
// and pass them straight through; for the mockup we mimic the shape inline.
type DramaClub = {
  name:       string;
  slug:       string;
  location:   string;
  descriptor: string;
  chapterId:  string;
  // Image fields (same priority as lib/dramaClubMap.ts):
  logoSrc?:   string;
  cardImage?: string;
  heroImage?: string;
};

const DRAMA_CLUB_LOGO_FALLBACK = "/images/drama-clubs/club-fallback.jpg";

function getDramaClubImage(club: DramaClub): string {
  return club.logoSrc
    ?? club.cardImage
    ?? club.heroImage
    ?? DRAMA_CLUB_LOGO_FALLBACK;
}

const DRAMA_CLUBS: DramaClub[] = [
  {
    name:       "Teatro Esperanza",
    slug:       "teatro-esperanza",
    location:   "Košice, SK",
    descriptor: "Youth ensemble · est. 2019",
    chapterId:  "kosice-lab",
    // In production: dramaClubMap["teatro-esperanza"].logoSrc
    cardImage:  "/images/drama-clubs/club-sample.jpg",
  },
  {
    name:       "Young Voices Lab",
    slug:       "young-voices-lab",
    location:   "Zemplínska Teplica, SK",
    descriptor: "Roma youth storytelling · 14 students",
    chapterId:  "teplica",
    cardImage:  "/images/drama-clubs/boy-with-wings.jpg",
  },
];

// ── Types ─────────────────────────────────────────────────────────────────────
type Photo = { src: string; caption: string };
type PartnerOrg = {
  name:        string;
  location?:   string;
  description: string;
  url:         string;
  logo:        string;
};
type Chapter = {
  id:           string;
  num:          string;
  location:     string;
  component:    string;
  description:  string;
  response:     string;
  photos:       Photo[];
  audioUrl:     string | null;
  accentColor:  string;
  mapDotId:     string | null;
  partnerOrgs?: PartnerOrg[];
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
    partnerOrgs: [
      {
        name:        "Divadlo Východ",
        location:    "Košice, SK",
        description: "An independent Košice theatre company who hosted the DAT Lab — sharing rehearsal space, dramaturgy support, and a Slovak-language workshop on physical storytelling that grounded the cohort's first week of co-creation.",
        url:         "https://example.org/divadlo-vychod",
        logo:        "/images/partners/amakhosi.jpg",
      },
    ],
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
    partnerOrgs: [
      {
        name:        "ETP Slovensko",
        location:    "Zemplínska Teplica, SK",
        description: "A local Roma education partner working with families across eastern Slovakia. ETP organized the youth participants, hosted the residency, and translated daily — anchoring the work in a real community rather than a parachute-in workshop.",
        url:         "https://etp.sk",
        logo:        "/images/partners/etp-slovensko.jpg",
      },
    ],
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

function SlovakiaMap({ dotId, width = 116, height = 40 }: { dotId: string | null; width?: number; height?: number }) {
  return (
    <svg viewBox="0 0 160 54" style={{ width, height, display: "block" }} aria-hidden>
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

function startAmbient(ctx: AudioContext, id: string): (fadeTime?: number) => void {
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
    <button type="button" onClick={onToggle} className="jc-v13-btn"
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
    <button type="button" onClick={share} className="jc-v13-btn" title="Share this journey"
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

// ── Drama club feature: logo-forward horizontal mini-card ────────────────────
function DramaClubFeature({ club }: { club: DramaClub }) {
  return (
    <a
      href={`/drama-club/${club.slug}`}
      className="jc-v13-club"
      style={{
        display: "flex", alignItems: "center", gap: 10,
        textDecoration: "none",
        backgroundColor: "rgba(36,17,35,0.04)",
        borderRadius: 10,
        padding: "7px 11px 7px 7px",
        margin: "0 0 10px",
      }}
    >
      <div style={{
        width: 42, height: 42, borderRadius: "50%",
        overflow: "hidden", flexShrink: 0,
        border: `2px solid ${C.pink}`, position: "relative",
        backgroundColor: C.bg,
      }}>
        <Image
          src={getDramaClubImage(club)} alt={`${club.name} logo`} fill sizes="84px" quality={92}
          style={{ objectFit: "cover" }}
        />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
          fontWeight: 700, fontSize: "8.5px", letterSpacing: "0.18em",
          textTransform: "uppercase", color: C.muted, margin: "0 0 1px",
        }}>Drama club</p>
        <p style={{
          fontFamily: "var(--font-anton), system-ui, sans-serif",
          fontSize: 15, color: C.pink, margin: "0 0 1px",
          textTransform: "uppercase", letterSpacing: "0.02em", lineHeight: 1.1,
        }}>{club.name} ›</p>
        <p style={{
          fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
          fontSize: "10.5px", color: C.teal, margin: 0, lineHeight: 1.3,
        }}>
          {club.location} · {club.descriptor}
        </p>
      </div>
    </a>
  );
}

// ── Partner-org feature-ette: vertical card with logo + paragraph ────────────
function PartnerFeature({ org }: { org: PartnerOrg }) {
  return (
    <a
      href={org.url}
      target="_blank"
      rel="noopener noreferrer"
      className="jc-v13-partner"
      style={{
        display: "block", textDecoration: "none",
        border: `1px solid ${C.border}`,
        borderLeft: `3px solid ${C.pink}`,
        borderRadius: 4,
        padding: "9px 11px",
        margin: "0 0 10px",
        backgroundColor: C.bg,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 6 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 4,
          overflow: "hidden", flexShrink: 0,
          border: `1px solid ${C.border}`, position: "relative",
          backgroundColor: C.bg,
        }}>
          <Image
            src={org.logo} alt={`${org.name} logo`} fill sizes="68px" quality={92}
            style={{ objectFit: "cover" }}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontWeight: 700, fontSize: "8.5px", letterSpacing: "0.18em",
            textTransform: "uppercase", color: C.muted, margin: "0 0 1px",
          }}>Partner</p>
          <p style={{
            fontFamily: "var(--font-anton), system-ui, sans-serif",
            fontSize: 15, color: C.pink, margin: 0,
            textTransform: "uppercase", letterSpacing: "0.02em", lineHeight: 1.1,
          }}>{org.name} ↗</p>
          {org.location && (
            <p style={{
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              fontSize: "10px", color: C.teal, margin: "1px 0 0", lineHeight: 1.2,
            }}>{org.location}</p>
          )}
        </div>
      </div>
      <p style={{
        fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
        fontSize: "10.5px", color: C.ink, opacity: 0.78, margin: 0, lineHeight: 1.45,
      }}>{org.description}</p>
    </a>
  );
}

// ── Photo grid ────────────────────────────────────────────────────────────────
function PhotoGrid({ photos, W, H }: { photos: Photo[]; W: number; H: number }) {
  const n = photos.length;
  const G = 2;
  const sizes = `${W * 2}px`; // retina-friendly
  if (n === 0) return <div style={{ width: W, height: H, backgroundColor: "#e8e2da" }} />;
  if (n === 1) return (
    <div style={{ width: W, height: H, position: "relative", overflow: "hidden" }}>
      <Image src={photos[0].src} alt={photos[0].caption} fill sizes={sizes} quality={92} style={{ objectFit: "cover" }} />
    </div>
  );
  if (n === 2) {
    const w = Math.floor((W - G) / 2);
    return (
      <div style={{ display: "flex", gap: G, width: W, height: H }}>
        {photos.map((p, i) => (
          <div key={i} style={{ width: w, height: H, position: "relative", overflow: "hidden", flexShrink: 0 }}>
            <Image src={p.src} alt={p.caption} fill sizes={`${w * 2}px`} quality={92} style={{ objectFit: "cover" }} />
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
          <Image src={photos[0].src} alt={photos[0].caption} fill sizes={`${lW * 2}px`} quality={92} style={{ objectFit: "cover" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: G, width: rW, flexShrink: 0 }}>
          {[1, 2].map((i) => (
            <div key={i} style={{ width: rW, height: rH, position: "relative", overflow: "hidden" }}>
              <Image src={photos[i].src} alt={photos[i].caption} fill sizes={`${rW * 2}px`} quality={92} style={{ objectFit: "cover" }} />
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
            <Image src={p.src} alt={p.caption} fill sizes={`${w * 2}px`} quality={92} style={{ objectFit: "cover" }} />
          </div>
        ))}
      </div>
    );
  }
  const lW = Math.floor((W - G) / 2); const rW = W - lW - G; const rH = Math.floor((H - G) / 2);
  return (
    <div style={{ display: "flex", gap: G, width: W, height: H }}>
      <div style={{ width: lW, height: H, position: "relative", overflow: "hidden", flexShrink: 0 }}>
        <Image src={photos[0].src} alt={photos[0].caption} fill sizes={`${lW * 2}px`} quality={92} style={{ objectFit: "cover" }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: `${rH}px ${rH}px`, gap: G, width: rW, flexShrink: 0 }}>
        {photos.slice(1, 5).map((p, i) => (
          <div key={i} style={{ position: "relative", overflow: "hidden" }}>
            <Image src={p.src} alt={p.caption} fill sizes={`${Math.floor(rW)}px`} quality={92} style={{ objectFit: "cover" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── PASSAGE / SLOVAKIA 2026 stack (used everywhere) ──────────────────────────
function PassageStack({
  size = "lg", align = "left",
}: {
  size?:  "lg" | "md";
  align?: "left" | "center";
}) {
  const big   = size === "lg" ? 80 : 26;
  const small = size === "lg" ? 17 : 11;
  return (
    <div style={{ textAlign: align, lineHeight: 1 }}>
      <a
        href={PROGRAM.link}
        target="_blank"
        rel="noopener noreferrer"
        className="jc-v13-link"
        style={{ textDecoration: "none", color: "inherit", display: "inline-block" }}
      >
        <h1 style={{
          fontFamily: "var(--font-anton), system-ui, sans-serif",
          fontSize: big, lineHeight: 0.91, color: C.ink,
          margin: "0 0 6px", letterSpacing: "0.01em", textTransform: "uppercase",
        }}>
          PASSAGE
        </h1>
      </a>
      <a
        href={PROGRAM.link}
        target="_blank"
        rel="noopener noreferrer"
        className="jc-v13-link"
        style={{ textDecoration: "none" }}
      >
        <p style={{
          fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
          fontWeight: 700, fontSize: small, letterSpacing: "0.28em",
          textTransform: "uppercase", color: C.pink, margin: 0,
        }}>
          SLOVAKIA 2026
        </p>
      </a>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// COVER PAGE — desktop + mobile variants
// ════════════════════════════════════════════════════════════════════════════
function CoverPage({
  soundPlaying, audioAvailable, onSoundToggle, onCopied, isMobile, W, H,
}: {
  soundPlaying:   boolean;
  audioAvailable: boolean;
  onSoundToggle:  () => void;
  onCopied:       () => void;
  isMobile:       boolean;
  W:              number;
  H:              number;
}) {
  if (isMobile) {
    const HERO_H = Math.round(H * 0.42);
    const STAMP  = 120;
    return (
      <div style={{ position: "relative", width: W, height: H, backgroundColor: C.bg, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {/* Hero photo */}
        <div style={{ width: W, height: HERO_H, position: "relative", overflow: "hidden", flexShrink: 0 }}>
          <Image
            src={COVER_HERO.src} alt={COVER_HERO.caption} fill priority sizes={`${W * 2}px`} quality={92}
            style={{ objectFit: "cover", objectPosition: "center" }}
          />
        </div>

        {/* Stamp — sits at the boundary between photo and text */}
        <a href="/" title="Dramatic Adventure Theatre" className="jc-v13-imglink"
          style={{
            position: "absolute", left: "50%", top: HERO_H,
            transform: "translate(-50%, -50%)",
            width: STAMP, height: STAMP, zIndex: 10, display: "block",
          }}>
          <Image
            src="/images/dat-logo7.svg" alt="Dramatic Adventure Theatre"
            width={STAMP} height={STAMP} quality={92}
            style={{ width: STAMP, height: STAMP, display: "block", filter: STAMP_SHADOW }}
          />
        </a>

        {/* Text panel */}
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          padding: `${STAMP / 2 + 8}px 22px 16px 22px`,
          textAlign: "center", alignItems: "center",
        }}>
          <a href="/" className="jc-v13-link" style={{ textDecoration: "none" }}>
            <p style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontWeight: 700, fontSize: 9, letterSpacing: "0.28em",
              textTransform: "uppercase", color: C.gold, margin: "0 0 10px",
            }}>Dramatic Adventure Theatre</p>
          </a>
          <PassageStack size="md" align="center" />
          <p style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontSize: 10, color: C.muted, margin: "6px 0 12px",
          }}>{PROGRAM.dates}</p>

          <p style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontStyle: "italic", fontSize: 11, lineHeight: 1.6,
            color: C.ink, opacity: 0.82, margin: "0 0 4px",
          }}>
            &ldquo;{PRIMARY_QUOTE}&rdquo;
          </p>
          <p style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontStyle: "italic", fontSize: 10, color: C.dim, margin: "0 0 auto",
          }}>— {ARTIST.name}</p>

          {/* Headshot row — kept large for editorial weight on mobile */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 14 }}>
            <a href={`/alumni/${PROFILE_SLUG}`} className="jc-v13-imglink" style={{ display: "block", textDecoration: "none", flexShrink: 0 }}>
              <div style={{ width: 110, height: 138, borderRadius: 4, overflow: "hidden", position: "relative", border: `1px solid ${C.border}` }}>
                <Image src={ARTIST.photo} alt={ARTIST.name} fill sizes="220px" quality={92}
                  style={{ objectFit: "cover", objectPosition: "center 12%" }} />
              </div>
            </a>
            <div style={{ textAlign: "left", flex: 1, minWidth: 0 }}>
              <a href={`/alumni/${PROFILE_SLUG}`} className="jc-v13-link" style={{ textDecoration: "none", color: "inherit" }}>
                <p style={{
                  fontFamily: "var(--font-anton), system-ui, sans-serif",
                  fontSize: 19, color: C.ink, margin: "0 0 2px",
                  textTransform: "uppercase", lineHeight: 1,
                }}>{ARTIST.name}</p>
              </a>
              <p style={{
                fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                fontSize: 10, color: C.teal, margin: "0 0 8px", fontWeight: 600,
              }}>Traveling {ARTIST.roles.join(" · ")}</p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {audioAvailable && <SoundToggle playing={soundPlaying} onToggle={onSoundToggle} />}
                <ShareButton title={PROGRAM.name} text={PRIMARY_QUOTE} onCopied={onCopied} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Desktop ──
  const LEFT_W     = 470;
  const STAMP_SIZE = 184; // bumped per spec

  return (
    <div style={{ position: "relative", display: "flex", width: W, height: H, backgroundColor: C.bg, overflow: "hidden" }}>
      <div style={{
        width: LEFT_W, flexShrink: 0, backgroundColor: C.bg,
        display: "flex", flexDirection: "column",
        padding: "26px 32px 22px 28px", zIndex: 2,
      }}>
        <a href="/" className="jc-v13-link" style={{ textDecoration: "none", maxWidth: "70%" }}>
          <p style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontWeight: 700, fontSize: 10, letterSpacing: "0.28em",
            textTransform: "uppercase", color: C.gold, margin: "0 0 10px",
          }}>
            Dramatic Adventure Theatre
          </p>
        </a>

        <div style={{ maxWidth: "70%" }}>
          <PassageStack size="lg" align="left" />
        </div>
        <p style={{
          fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
          fontSize: 12, color: C.muted, margin: "10px 0 14px", maxWidth: "70%",
        }}>{PROGRAM.dates}</p>

        <div style={{ width: 40, height: 1, backgroundColor: C.ink, opacity: 0.2, marginBottom: 16 }} />

        {/* Editorial framing line — magazine pull-quote intro. Pink leader rule
            lifts it off the page without competing with the 80px PASSAGE wordmark. */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "0 0 10px", maxWidth: "70%" }}>
          <span style={{
            display: "inline-block", width: 22, height: 2,
            backgroundColor: C.pink, flexShrink: 0, borderRadius: 1,
          }} />
          <p style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontStyle: "italic", fontWeight: 400, fontSize: 20,
            color: C.ink, opacity: 0.82, margin: 0,
            letterSpacing: "-0.005em", lineHeight: 1.1,
          }}>This is my journey.</p>
        </div>

        <p style={{
          fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
          fontStyle: "italic", fontSize: 14, lineHeight: 1.7,
          color: C.ink, margin: "0 0 6px", opacity: 0.78,
          maxWidth: "70%",
        }}>
          &ldquo;{PRIMARY_QUOTE}&rdquo;
        </p>

        <p style={{
          fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
          fontStyle: "italic", fontSize: 11, color: C.dim,
          margin: "0 0 auto", letterSpacing: "0.02em",
          maxWidth: "70%",
        }}>— {ARTIST.name}</p>

        <div style={{ marginTop: 16, display: "flex", gap: 14, alignItems: "stretch" }}>
          <a href={`/alumni/${PROFILE_SLUG}`} className="jc-v13-imglink"
            style={{ flexShrink: 0, display: "block", textDecoration: "none" }}>
            <div style={{
              width: 140, height: 176, borderRadius: 4, overflow: "hidden",
              position: "relative", border: `1px solid ${C.border}`,
            }}>
              <Image src={ARTIST.photo} alt={ARTIST.name} fill sizes="280px" quality={92}
                style={{ objectFit: "cover", objectPosition: "center 12%" }} />
            </div>
          </a>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", minWidth: 0, paddingTop: 4 }}>
            <div>
              <a href={`/alumni/${PROFILE_SLUG}`} className="jc-v13-link" style={{ textDecoration: "none", color: "inherit" }}>
                <p style={{
                  fontFamily: "var(--font-anton), system-ui, sans-serif",
                  fontSize: 22, color: C.ink, margin: "0 0 2px",
                  textTransform: "uppercase", lineHeight: 1,
                }}>{ARTIST.name}</p>
              </a>
              <p style={{
                fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                fontSize: 11, color: C.teal, margin: "0 0 6px", fontWeight: 600,
              }}>Traveling {ARTIST.roles.join(" · ")}</p>
            </div>

            <div style={{ display: "flex", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
              {audioAvailable && <SoundToggle playing={soundPlaying} onToggle={onSoundToggle} />}
              <ShareButton title={PROGRAM.name} text={PRIMARY_QUOTE} onCopied={onCopied} />
            </div>

            <p style={{
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              fontSize: 9.5, color: C.dim, margin: 0,
              fontStyle: "italic", letterSpacing: "0.02em",
            }}>This journey card was created by {ARTIST.name}.</p>
          </div>
        </div>
      </div>

      {/* Hero — NOT a link */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <Image src={COVER_HERO.src} alt={COVER_HERO.caption} fill priority sizes={`${(W - LEFT_W) * 2}px`} quality={92}
          style={{ objectFit: "cover", objectPosition: "center" }} />
      </div>

      {/* Boundary-centered DAT stamp */}
      <a href="/" title="Dramatic Adventure Theatre" className="jc-v13-imglink"
        style={{
          position: "absolute",
          left: LEFT_W - STAMP_SIZE / 2,
          top: "50%", transform: "translateY(-50%)",
          width: STAMP_SIZE, height: STAMP_SIZE,
          zIndex: 10, display: "block", textDecoration: "none",
        }}>
        <Image src="/images/dat-logo7.svg" alt="Dramatic Adventure Theatre"
          width={STAMP_SIZE} height={STAMP_SIZE} quality={92}
          style={{ display: "block", width: STAMP_SIZE, height: STAMP_SIZE, filter: STAMP_SHADOW }} />
      </a>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// BACK COVER PAGE
// ════════════════════════════════════════════════════════════════════════════
function BackCoverPage({ photos, isMobile, W, H }: { photos: Photo[]; isMobile: boolean; W: number; H: number }) {
  const G = 2;
  const cols = isMobile ? 3 : 4;
  const rows = isMobile ? 5 : 4;
  const cellW = Math.floor((W - G * (cols - 1)) / cols);
  const cellH = Math.floor((H - G * (rows - 1)) / rows);
  const total = cols * rows;
  const grid = [...photos.slice(0, total)];
  while (grid.length < total) grid.push(photos[grid.length % photos.length]);
  const BACK_STAMP = isMobile ? 132 : 172;

  return (
    <div style={{ position: "relative", width: W, height: H, overflow: "hidden" }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, ${cellW}px)`,
        gridTemplateRows: `repeat(${rows}, ${cellH}px)`,
        gap: G,
      }}>
        {grid.map((p, i) => (
          <div key={i} style={{ position: "relative", overflow: "hidden" }}>
            <Image src={p.src} alt={p.caption} fill sizes={`${cellW * 2}px`} quality={92} style={{ objectFit: "cover" }} />
          </div>
        ))}
      </div>

      <div style={{ position: "absolute", inset: 0, background: "rgba(36,17,35,0.28)", pointerEvents: "none" }} />

      <a href="/" title="Dramatic Adventure Theatre — Home" className="jc-v13-imglink"
        style={{
          position: "absolute", left: "50%", top: "50%",
          transform: "translate(-50%, -50%)",
          width: BACK_STAMP, height: BACK_STAMP,
          display: "block", textDecoration: "none", zIndex: 10,
        }}>
        <Image src="/images/dat-logo7.svg" alt="Dramatic Adventure Theatre"
          width={BACK_STAMP} height={BACK_STAMP} quality={92}
          style={{ display: "block", width: BACK_STAMP, height: BACK_STAMP, filter: STAMP_SHADOW }} />
      </a>

      {/* Shortened credit */}
      <div style={{
        position: "absolute", bottom: isMobile ? 12 : 16, left: 0, right: 0,
        display: "flex", justifyContent: "center", zIndex: 11, pointerEvents: "none",
      }}>
        <span style={{
          fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
          fontWeight: 700, fontSize: 10, letterSpacing: "0.22em",
          textTransform: "uppercase", color: C.bg, opacity: 0.9,
          backgroundColor: "rgba(36,17,35,0.5)", padding: "5px 16px", borderRadius: 2,
        }}>
          Created by {ARTIST.name}
        </span>
      </div>

      {/* Pink Travel CTA — no arrow */}
      <a href="https://dramaticadventure.com/travel-opportunities"
        target="_blank" rel="noopener noreferrer" className="jc-v13-cta"
        style={{
          position: "absolute", top: isMobile ? 12 : 16, left: isMobile ? 12 : 16, zIndex: 11,
          display: "inline-flex", alignItems: "center",
          fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
          fontWeight: 800, fontSize: isMobile ? 11 : 12, letterSpacing: "0.18em",
          textTransform: "uppercase", textDecoration: "none",
          color: "#fff", backgroundColor: C.pink,
          padding: isMobile ? "9px 16px" : "11px 20px", borderRadius: 999,
          boxShadow: "0 4px 14px rgba(242,51,89,0.45)",
        }}>
        Travel with DAT
      </a>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// CHAPTER PAGE — desktop + mobile variants
// ════════════════════════════════════════════════════════════════════════════
function JourneyPage({
  chapter, soundPlaying, audioAvailable, onSoundToggle, onCopied, isMobile, W, H,
}: {
  chapter:        Chapter;
  soundPlaying:   boolean;
  audioAvailable: boolean;
  onSoundToggle:  () => void;
  onCopied:       () => void;
  isMobile:       boolean;
  W:              number;
  H:              number;
}) {
  const dramaClub = DRAMA_CLUBS.find((dc) => dc.chapterId === chapter.id);

  if (isMobile) {
    const PHOTO_H = Math.round(H * 0.32);
    return (
      <div style={{ width: W, height: H, display: "flex", flexDirection: "column", backgroundColor: C.bg }}>
        {/* Top photo */}
        <div style={{ width: W, height: PHOTO_H, overflow: "hidden", backgroundColor: "#e8e2da", flexShrink: 0 }}>
          <PhotoGrid photos={chapter.photos} W={W} H={PHOTO_H} />
        </div>

        {/* Pinned mini-header */}
        <div style={{ padding: "12px 18px 6px 18px", flexShrink: 0 }}>
          <PassageStack size="md" align="left" />
          <div style={{ width: 28, height: 1, backgroundColor: C.sep, margin: "10px 0 8px" }} />
          <p style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontWeight: 700, fontSize: 9, letterSpacing: "0.22em",
            textTransform: "uppercase", color: C.teal, margin: "0 0 2px",
          }}>{chapter.num}</p>
          <p style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontWeight: 700, fontSize: 13, letterSpacing: "0.08em",
            textTransform: "uppercase", color: C.pink, margin: "0 0 1px", lineHeight: 1.2,
          }}>{chapter.location}</p>
          <p style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontSize: 10, color: C.teal, margin: 0,
          }}>{chapter.component}</p>
        </div>

        {/* Scrollable middle */}
        <div className="jc-v13-scroll" style={{
          flex: 1, minHeight: 0, overflowY: "auto",
          padding: "8px 18px 10px 18px",
          WebkitMaskImage:
            "linear-gradient(180deg, black 0, black calc(100% - 16px), transparent 100%)",
          maskImage:
            "linear-gradient(180deg, black 0, black calc(100% - 16px), transparent 100%)",
        }}>
          <p style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontStyle: "italic", fontSize: 13, lineHeight: 1.6,
            color: C.ink, margin: "0 0 4px",
            borderLeft: `3px solid ${chapter.accentColor}`, paddingLeft: 10,
          }}>
            &ldquo;{chapter.response}&rdquo;
          </p>
          <p style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontSize: 9.5, color: C.dim, fontStyle: "italic",
            margin: "0 0 10px", paddingLeft: 13,
          }}>— {ARTIST.name}</p>

          <p style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontSize: 11, color: C.muted, lineHeight: 1.5, margin: "0 0 10px",
          }}>{chapter.description}</p>

          {dramaClub && <DramaClubFeature club={dramaClub} />}
          {chapter.partnerOrgs?.map((org) => (
            <PartnerFeature key={org.url} org={org} />
          ))}
        </div>

        {/* Pinned controls footer */}
        <div style={{
          padding: "8px 18px 12px 18px", flexShrink: 0,
          borderTop: `1px solid ${C.sep}`,
          display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap",
        }}>
          {audioAvailable && <SoundToggle playing={soundPlaying} onToggle={onSoundToggle} />}
          <ShareButton title={`${chapter.location} — ${PROGRAM.name}`} text={chapter.response} onCopied={onCopied} />
        </div>
      </div>
    );
  }

  // ── Desktop ──
  const journalW = 378;
  const photoW   = W - journalW;

  return (
    <div style={{ display: "flex", width: W, height: H }}>
      <div style={{
        width: journalW, flexShrink: 0, backgroundColor: C.bg,
        display: "flex", flexDirection: "column",
        borderRight: `1px solid ${C.sep}`,
        height: H, minHeight: 0,
      }}>
        {/* ── Pinned header ─────────────────────────────────────────── */}
        <div style={{ padding: "20px 24px 12px 24px", flexShrink: 0 }}>
          <PassageStack size="md" align="left" />
          <div style={{ width: "100%", height: 1, backgroundColor: C.sep, margin: "12px 0 12px" }} />

          <p style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontWeight: 700, fontSize: 10, letterSpacing: "0.22em",
            textTransform: "uppercase", color: C.teal, margin: "0 0 3px",
          }}>{chapter.num}</p>
          <p style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontWeight: 700, fontSize: 14, letterSpacing: "0.1em",
            textTransform: "uppercase", color: C.pink, margin: "0 0 2px", lineHeight: 1.2,
          }}>{chapter.location}</p>
          <p style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontSize: 11, color: C.teal, margin: 0, lineHeight: 1.3,
          }}>{chapter.component}</p>
        </div>

        {/* ── Scrollable middle ─────────────────────────────────────────
            Anything that can balloon (long quote, many partners, future
            cohort cards) lives here. Pinned header above, pinned footer
            below. Soft bottom fade hints that more content scrolls.       */}
        <div className="jc-v13-scroll" style={{
          flex: 1, minHeight: 0, overflowY: "auto",
          padding: "8px 24px 12px 24px",
          position: "relative",
          WebkitMaskImage:
            "linear-gradient(180deg, black 0, black calc(100% - 18px), transparent 100%)",
          maskImage:
            "linear-gradient(180deg, black 0, black calc(100% - 18px), transparent 100%)",
        }}>
          <p style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontStyle: "italic", fontSize: 14.5, lineHeight: 1.65,
            color: C.ink, margin: "0 0 5px",
            borderLeft: `3px solid ${chapter.accentColor}`, paddingLeft: 13,
          }}>
            &ldquo;{chapter.response}&rdquo;
          </p>
          <p style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontSize: 10, color: C.dim, fontStyle: "italic",
            margin: "0 0 12px", paddingLeft: 16,
          }}>— {ARTIST.name}</p>

          <p style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontSize: 11, color: C.muted, lineHeight: 1.5, margin: "0 0 10px",
          }}>{chapter.description}</p>

          {dramaClub && <DramaClubFeature club={dramaClub} />}

          {chapter.partnerOrgs?.map((org) => (
            <PartnerFeature key={org.url} org={org} />
          ))}
        </div>

        {/* ── Pinned footer ─────────────────────────────────────────── */}
        <div style={{
          padding: "8px 24px 16px 24px", flexShrink: 0,
          borderTop: `1px solid ${C.sep}`,
          display: "flex", alignItems: "flex-end", justifyContent: "space-between",
        }}>
          <div>
            {chapter.mapDotId && (
              <>
                <p style={{
                  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                  fontWeight: 700, fontSize: 10, letterSpacing: "0.18em",
                  textTransform: "uppercase", color: C.dim, margin: "0 0 4px",
                }}>Slovakia</p>
                <SlovakiaMap dotId={chapter.mapDotId} />
              </>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5, alignItems: "flex-end" }}>
            {audioAvailable && <SoundToggle playing={soundPlaying} onToggle={onSoundToggle} />}
            <ShareButton title={`${chapter.location} — ${PROGRAM.name}`} text={chapter.response} onCopied={onCopied} />
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflow: "hidden", backgroundColor: "#e8e2da" }}>
        <PhotoGrid photos={chapter.photos} W={photoW} H={H} />
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
          className="jc-v13-dot"
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
          /journey-card-mockup/v13 · passport-book mobile · retina · sheen · partner feature-ettes
        </span>
      </div>
      <nav style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
        {([
          ["/journey-card-mockup/v12", "← v12"],
          ["/journey-card-mockup/v13", "v13"],
          ["/journey-card-mockup/v13/embeds", "embeds"],
        ] as [string, string][]).map(([href, label]) => (
          <a key={href} href={href} style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "0.58rem", fontWeight: 600, letterSpacing: "0.08em",
            textTransform: "uppercase", color: C.ink, textDecoration: "none",
            padding: "0.18rem 0.5rem", borderRadius: "3px",
            backgroundColor: label === "v13" ? "rgba(36,17,35,0.18)" : "rgba(36,17,35,0.09)",
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
      fontSize: 13, letterSpacing: "0.02em",
      opacity: visible ? 1 : 0, transition: "opacity 0.3s ease",
      boxShadow: "0 4px 16px rgba(36,17,35,0.25)",
    }}>
      {message}
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function JourneyCardV13() {
  const TOTAL = 2 + CHAPTERS.length;

  const [page, setPage]                     = useState(0);
  const [soundPlaying, setSoundPlaying]     = useState(false);
  const [hasInteracted, setHasInteracted]   = useState(false);
  const [audioAvailable, setAudioAvailable] = useState(false);
  const [toastMsg, setToastMsg]             = useState("");
  const [toastVisible, setToastVisible]     = useState(false);
  const [layout, setLayout]                 = useState<{ isMobile: boolean; W: number; H: number }>({
    isMobile: false, W: 1080, H: 580,
  });
  const audioCtxRef  = useRef<AudioContext | null>(null);
  const stopRef      = useRef<((fadeTime?: number) => void) | null>(null);
  const touchStartX  = useRef<number | null>(null);
  const toastTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);

  const shuffledPhotos = useMemo(() => seededShuffle(ALL_CHAPTER_PHOTOS), []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const Ctor = window.AudioContext
      || (window as unknown as Record<string, typeof AudioContext | undefined>).webkitAudioContext;
    if (Ctor) setAudioAvailable(true);
  }, []);

  // Layout — desktop above 720, otherwise passport-book portrait sized to viewport.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const compute = () => {
      const vw = window.innerWidth;
      if (vw > 720) {
        setLayout({ isMobile: false, W: 1080, H: 580 });
      } else {
        const W = Math.min(vw - 24, 420);
        const H = Math.round(W * 1.58); // ≈5:8 passport book
        setLayout({ isMobile: true, W, H });
      }
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

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
        ? (window.AudioContext || (window as unknown as Record<string, typeof AudioContext | undefined>).webkitAudioContext)
        : undefined;
      if (!Ctor) { setAudioAvailable(false); return; }
      try {
        const ctx = new Ctor();
        audioCtxRef.current = ctx;
        stopRef.current = startAmbient(ctx, chapterIdForPage(page));
        setSoundPlaying(true);
        setHasInteracted(true);
      } catch {
        setAudioAvailable(false);
      }
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
  const { isMobile, W, H } = layout;

  return (
    <>
      <style>{`
        .jc-v13-btn { transition: all 0.18s ease; }
        .jc-v13-btn:hover { transform: translateY(-1px); box-shadow: 0 3px 10px rgba(36,17,35,0.18); }
        .jc-v13-link { transition: opacity 0.15s ease; }
        .jc-v13-link:hover { opacity: 0.65; }
        .jc-v13-imglink { transition: transform 0.22s ease; display: block; }
        .jc-v13-imglink:hover { transform: scale(0.975); }
        .jc-v13-club { transition: background-color 0.15s ease, transform 0.18s ease; }
        .jc-v13-club:hover { background-color: rgba(36,17,35,0.08); transform: translateX(2px); }
        .jc-v13-partner { transition: background-color 0.15s ease, box-shadow 0.18s ease; }
        .jc-v13-partner:hover { background-color: #ffffff; box-shadow: 0 2px 12px rgba(36,17,35,0.10); }
        .jc-v13-cta { transition: transform 0.18s ease, box-shadow 0.18s ease; }
        .jc-v13-cta:hover { transform: translateY(-2px); box-shadow: 0 6px 22px rgba(242,51,89,0.55); }
        .jc-v13-dot:hover { background-color: rgba(36,17,35,0.45) !important; }
        /* Slim, low-contrast scrollbar for the journal scroll region. */
        .jc-v13-scroll { scrollbar-width: thin; scrollbar-color: rgba(36,17,35,0.22) transparent; }
        .jc-v13-scroll::-webkit-scrollbar { width: 4px; }
        .jc-v13-scroll::-webkit-scrollbar-track { background: transparent; }
        .jc-v13-scroll::-webkit-scrollbar-thumb {
          background: rgba(36,17,35,0.22);
          border-radius: 2px;
        }
        .jc-v13-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(36,17,35,0.36);
        }
        .jc-v13-outer {
          border-radius: 6px;
          overflow: hidden;
          position: relative;
          flex-shrink: 0;
          border: 1px solid ${C.border};
          box-shadow: 0 10px 44px rgba(36,17,35,0.16), 0 2px 10px rgba(36,17,35,0.07);
        }
        /* Subtle satin/laminate sheen — gives the card an artifact feel. */
        .jc-v13-outer::after {
          content: '';
          position: absolute; inset: 0;
          pointer-events: none;
          background:
            linear-gradient(125deg,
              rgba(255,255,255,0.08) 0%,
              rgba(255,255,255,0.02) 22%,
              rgba(255,255,255,0) 45%,
              rgba(255,255,255,0) 65%,
              rgba(255,255,255,0.05) 92%,
              rgba(255,255,255,0.10) 100%
            ),
            radial-gradient(ellipse at top left, rgba(255,255,255,0.05), transparent 55%);
          mix-blend-mode: screen;
          z-index: 8;
        }
      `}</style>

      <MockupBanner />

      <main style={{
        backgroundColor: "#e8e2da", minHeight: "100vh",
        padding: "20px 12px 56px",
        display: "flex", flexDirection: "column", alignItems: "center",
      }}>
        <div style={{
          width: "100%", maxWidth: W,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 10,
        }}>
          <span style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.2em",
            textTransform: "uppercase", color: C.muted,
          }}>
            {page === 0 ? "Cover" : page === TOTAL - 1 ? "Back Cover" : `${chapter?.num} · ${chapter?.location}`}
          </span>
          <span style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: "0.65rem", color: C.muted, fontStyle: "italic" }}>
            ← → / swipe
          </span>
        </div>

        <div
          className="jc-v13-outer"
          style={{ width: W, height: H }}
          onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchStartX.current;
            if (dx < -40) goTo(page + 1);
            if (dx >  40) goTo(page - 1);
            touchStartX.current = null;
          }}
        >
          <div
            className="jc-v13-track"
            style={{
              display: "flex", width: `${TOTAL * W}px`, height: "100%",
              transform: `translateX(-${page * W}px)`,
              transition: "transform 360ms cubic-bezier(0.4, 0, 0.2, 1)",
              willChange: "transform",
            }}
          >
            <div style={{ width: W, height: "100%", flexShrink: 0 }}>
              <CoverPage
                soundPlaying={soundPlaying && page === 0}
                audioAvailable={audioAvailable}
                onSoundToggle={toggleSound}
                onCopied={() => showToast("Link copied!")}
                isMobile={isMobile}
                W={W} H={H}
              />
            </div>

            {CHAPTERS.map((ch, i) => (
              <div key={ch.id} style={{ width: W, height: "100%", flexShrink: 0 }}>
                <JourneyPage
                  chapter={ch}
                  soundPlaying={soundPlaying && page === i + 1}
                  audioAvailable={audioAvailable}
                  onSoundToggle={toggleSound}
                  onCopied={() => showToast("Link copied!")}
                  isMobile={isMobile}
                  W={W} H={H}
                />
              </div>
            ))}

            <div style={{ width: W, height: "100%", flexShrink: 0 }}>
              <BackCoverPage photos={shuffledPhotos} isMobile={isMobile} W={W} H={H} />
            </div>
          </div>

          {page > 0 && (
            <button type="button" onClick={() => goTo(page - 1)} aria-label="Previous page" className="jc-v13-btn"
              style={{
                position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
                width: 32, height: 32, borderRadius: "50%", border: "none", cursor: "pointer",
                backgroundColor: "rgba(242,242,242,0.85)",
                boxShadow: "0 1px 6px rgba(36,17,35,0.16)",
                display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10,
              }}>
              <span style={{ fontSize: 18, color: C.ink, opacity: 0.7, lineHeight: 1, marginRight: 2 }}>‹</span>
            </button>
          )}

          {page < TOTAL - 1 && (
            <button type="button" onClick={() => goTo(page + 1)} aria-label="Next page" className="jc-v13-btn"
              style={{
                position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                width: 32, height: 32, borderRadius: "50%", border: "none", cursor: "pointer",
                backgroundColor: "rgba(242,242,242,0.85)",
                boxShadow: "0 1px 6px rgba(36,17,35,0.16)",
                display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10,
              }}>
              <span style={{ fontSize: 18, color: C.ink, opacity: 0.7, lineHeight: 1, marginLeft: 2 }}>›</span>
            </button>
          )}
        </div>

        <div style={{ width: "100%", maxWidth: W }}>
          <ChapterDots total={TOTAL} current={page} onSelect={goTo} />
        </div>

        <div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap", justifyContent: "center" }}>
          {PAGE_LABELS.map((label, i) => (
            <button key={i} type="button" onClick={() => goTo(i)} className="jc-v13-btn"
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
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
