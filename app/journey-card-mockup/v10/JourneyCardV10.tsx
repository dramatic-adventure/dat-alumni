// app/journey-card-mockup/v10/JourneyCardV10.tsx
// ⚠️  MOCKUP ONLY — no live data, no auth, no backend.
//
// v10: Sliding-pages artifact. Each chapter fills the full stage.
//      Page 0 (BEFORE)    — Cover spread: PASSAGE dominant, departure photos.
//      Pages 1–5          — Journal spread: left panel (response) + right panel (photos).
//      Page 6 (AFTER)     — Closing spread: return photos + reflection.
//
// PARTICIPANT TEMPLATE NOTE:
//   Each artifact is filled by the individual participant. Replace:
//     ARTIST.*            — name, roles, headshot URL
//     PROGRAM.*           — program name, date range
//     PRIMARY_QUOTE       — the quote shown in profile embeds
//     CHAPTERS[n].response  — each personal response (artist's voice)
//     CHAPTERS[n].photos    — up to 5 photos per chapter
//     CHAPTERS[n].audioUrl  — optional: supply an ambient .mp3/.ogg URL per chapter
//                             (leave null to use the generated Web Audio fallback)
//
// MAP NOTE:
//   Currently uses an inline SVG Slovakia outline (zero dependencies).
//   For production: swap <SlovakiaMap> for a minimal Mapbox GL JS embed using
//   NEXT_PUBLIC_MAPBOX_TOKEN. See // TODO: mapbox comment below.

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";

// ── Design tokens ──────────────────────────────────────────────────────────────
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

// ── Artist & Program (PARTICIPANT: replace these) ─────────────────────────────
const ARTIST = {
  name:  "Isabel Martínez",
  roles: ["Actor", "Teaching Artist"],
  photo: "https://images.squarespace-cdn.com/content/v1/6022114419b886404b1030fa/1688754593745-N9E8YZU0VE49QMQIOG4J/Marisa+Puller+007.jpg",
};
const PROGRAM = {
  name:  "PASSAGE · SLOVAKIA 2026",
  dates: "July 12 – August 2, 2026",
};
const PRIMARY_QUOTE =
  "I arrived thinking I was here to teach. I left knowing how much I had been taught.";

// ── Types ─────────────────────────────────────────────────────────────────────
type Photo = { src: string; caption: string };
type Chapter = {
  id:          string;
  num:         string;       // "00"–"06"
  location:    string;
  component:   string;       // DAT label
  description: string;       // context line
  response:    string;       // PARTICIPANT: artist's personal response
  photos:      Photo[];      // PARTICIPANT: 1–5 images; grids adapt automatically
  audioUrl:    string | null;// PARTICIPANT: path/URL to ambient audio (mp3/ogg)
  accentColor: string;
  isCover:     boolean;      // true = full-width cover layout (Before/After)
  mapDotId:    string | null;// which Slovakia city dot to highlight (null = none)
};

// ── Chapter data (PARTICIPANT: fill responses, photos, audioUrl) ──────────────
const CHAPTERS: Chapter[] = [
  // ── 00 · BEFORE ─────────────────────────────────────────────────────────────
  {
    id:          "before",
    num:         "00",
    location:    "BEFORE · DEPARTURE",
    component:   "Prepare",
    description: "The bag is packed. The room is almost empty.",
    response:    "I was afraid I would not know how to enter the room. I had no idea the room would change what entering meant.",
    photos: [
      { src: "/images/opportunities/PLX-hero.jpg",          caption: "the night before." },
      { src: "/images/opportunities/artist-development.jpg", caption: "what you carry." },
    ],
    audioUrl:    null, // PARTICIPANT: e.g. "/audio/before.mp3"
    accentColor: C.dim,
    isCover:     true,
    mapDotId:    null,
  },
  // ── 01 · BRATISLAVA ─────────────────────────────────────────────────────────
  {
    id:          "bratislava",
    num:         "01",
    location:    "BRATISLAVA",
    component:   "Acclimate · Program Orientation",
    description: "Bratislava's cobblestone old town. First workshops. The group comes together.",
    response:    "The first moment I arrived was not at the airport. It was the first time I heard the group laugh together.",
    photos: [
      { src: "/images/projects/archive/action-heart-of-europe-street-theatre.webp", caption: "the hallway laugh." },
    ],
    audioUrl:    null,
    accentColor: C.yellow,
    isCover:     false,
    mapDotId:    "bratislava",
  },
  // ── 02 · KOŠICE ─────────────────────────────────────────────────────────────
  {
    id:          "kosice-lab",
    num:         "02",
    location:    "KOŠICE",
    component:   "Engage · DAT Lab",
    description: "Europe's City of Culture. Co-creative workshops with a local theatre company.",
    response:    "A doorway — who stands inside, who waits outside, who gets invited in.",
    photos: [
      { src: "/images/rehearsing-nitra.jpg",         caption: "the doorway exercise." },
      { src: "/images/drama-clubs/club-sample.jpg",  caption: "lab day two." },
    ],
    audioUrl:    null,
    accentColor: C.teal,
    isCover:     false,
    mapDotId:    "kosice",
  },
  // ── 03 · ZEMPLÍNSKA TEPLICA ─────────────────────────────────────────────────
  {
    id:          "teplica",
    num:         "03",
    location:    "ZEMPLÍNSKA TEPLICA",
    component:   "Connect · Teaching Artist Residency",
    description: "Community storytelling with Roma youth alongside ETP Slovensko.",
    response:    "A student corrected my rhythm with her whole body. She taught me before we shared a language.",
    photos: [
      { src: "/images/projects/archive/teaching-artist-residency-slovakia-camp.webp", caption: "she counted with her shoulders." },
      { src: "/images/drama-clubs/boy-with-wings.jpg",                                caption: "games before language." },
    ],
    audioUrl:    null,
    accentColor: C.grape,
    isCover:     false,
    mapDotId:    "teplica",
  },
  // ── 04 · SLOVENSKÝ RAJ ──────────────────────────────────────────────────────
  {
    id:          "raj",
    num:         "04",
    location:    "SLOVENSKÝ RAJ",
    component:   "Create · Cohort Retreat",
    description: "Mountain wilderness. The Dobšinská Ice Cave. Work development in the Slovak Paradise.",
    response:    "The cave felt older than language. I stopped trying to make meaning and started listening.",
    photos: [
      { src: "/images/opportunities/team-adventure.jpg",               caption: "older than language." },
      { src: "/images/projects/archive/ACTion-Tanzania-3-hike.webp",   caption: "the long way up." },
    ],
    audioUrl:    null,
    accentColor: C.teal,
    isCover:     false,
    mapDotId:    "raj",
  },
  // ── 05 · KOŠICE (FINAL) ─────────────────────────────────────────────────────
  {
    id:          "kosice-final",
    num:         "05",
    location:    "KOŠICE",
    component:   "Perform · Eclectic Evening",
    description: "Return to Košice. Polish, rehearse, share. An evening of everything.",
    response:    "A different relationship to silence.",
    photos: [
      { src: "/images/theatre/archive/hotel-millionaire/hotel_millionaire1.jpg", caption: "Eclectic Evening." },
      { src: "/images/theatre/archive/hotel-millionaire/hotel_millionaire2.jpg", caption: "the stage we built." },
      { src: "/images/theatre/archive/hotel-millionaire/hotel_millionaire3.jpg", caption: "final night." },
      { src: "/images/theatre/archive/esmeraldas_dumbshow.webp",                 caption: "the body remembers." },
    ],
    audioUrl:    null,
    accentColor: C.yellow,
    isCover:     false,
    mapDotId:    "kosice",
  },
  // ── 06 · AFTER ──────────────────────────────────────────────────────────────
  {
    id:          "after",
    num:         "06",
    location:    "AFTER · RETURN",
    component:   "Integrate",
    description: "Home looks the same. Something in the looking has changed.",
    response:    "Home looked the same. I kept looking at it differently.",
    photos: [
      { src: "/images/opportunities/collaboration-joy.jpg", caption: "what you bring back." },
      { src: "/images/performing-zanzibar.jpg",             caption: "the practice continues." },
      { src: "/images/teaching-andes.jpg",                  caption: "the work goes on." },
    ],
    audioUrl:    null,
    accentColor: C.teal,
    isCover:     true,
    mapDotId:    null,
  },
];

// ── Slovakia mini-map ─────────────────────────────────────────────────────────
// Hand-crafted SVG outline in viewBox "0 0 160 54".
// TODO: mapbox — replace <SlovakiaMap> with a Mapbox GL JS static tile using
//   NEXT_PUBLIC_MAPBOX_TOKEN for a richer geographic treatment in production.
const SLOVAKIA_PATH =
  "M 4,40 L 10,49 L 22,51 L 36,50 L 50,48 L 64,44 L 78,40 " +
  "L 90,35 L 103,30 L 116,28 L 128,26 L 140,24 L 150,22 L 157,19 L 160,15 " +
  "L 156,9 L 147,4 L 132,1 L 116,2 L 100,0 L 82,4 L 66,2 L 52,7 " +
  "L 38,12 L 24,18 L 12,26 L 5,34 Z";

// City dot positions within the 160×54 viewBox
const MAP_DOTS: Record<string, { x: number; y: number; label: string }> = {
  bratislava: { x: 6,   y: 38, label: "BRA" },
  kosice:     { x: 138, y: 21, label: "KOŠ" },
  teplica:    { x: 148, y: 14, label: "ZT"  },
  raj:        { x: 120, y: 22, label: "SR"  },
};

function SlovakiaMap({ activeDotId }: { activeDotId: string | null }) {
  return (
    <svg
      viewBox="0 0 160 54"
      style={{ width: 112, height: 38, display: "block" }}
      aria-hidden
    >
      <path
        d={SLOVAKIA_PATH}
        fill={C.dim}
        stroke={C.ink}
        strokeWidth="0.6"
        strokeOpacity="0.35"
        fillOpacity="0.5"
      />
      {Object.entries(MAP_DOTS).map(([id, dot]) => {
        const active = activeDotId === id;
        return (
          <g key={id}>
            {active && (
              <circle cx={dot.x} cy={dot.y} r={5} fill={C.yellow} opacity={0.3} />
            )}
            <circle
              cx={dot.x} cy={dot.y}
              r={active ? 3.5 : 2.5}
              fill={active ? C.yellow : C.ink}
              opacity={active ? 1 : 0.5}
            />
          </g>
        );
      })}
    </svg>
  );
}

// ── Web Audio ambient system ───────────────────────────────────────────────────
// PARTICIPANT: supply audioUrl on each chapter for real recordings.
// The generated profiles serve as expressive placeholders.
interface AmbientProfile {
  noiseFreq:  number;  // low-pass cutoff (Hz) — higher = brighter
  noiseGain:  number;  // noise amplitude
  droneFreq:  number;  // base drone pitch (Hz)
  droneGain:  number;  // drone volume
  lfoRate:    number;  // modulation speed (Hz)
  lfoDepth:   number;  // pitch modulation depth (Hz)
  masterGain: number;  // overall volume
}

const AUDIO_PROFILES: Record<string, AmbientProfile> = {
  before:       { noiseFreq: 2200, noiseGain: 0.45, droneFreq: 55,  droneGain: 0.12, lfoRate: 0.07, lfoDepth: 2,  masterGain: 0.22 },
  bratislava:   { noiseFreq: 900,  noiseGain: 0.50, droneFreq: 65,  droneGain: 0.10, lfoRate: 0.13, lfoDepth: 5,  masterGain: 0.20 },
  "kosice-lab": { noiseFreq: 420,  noiseGain: 0.30, droneFreq: 82,  droneGain: 0.18, lfoRate: 0.06, lfoDepth: 2,  masterGain: 0.18 },
  teplica:      { noiseFreq: 3500, noiseGain: 0.32, droneFreq: 98,  droneGain: 0.10, lfoRate: 0.28, lfoDepth: 9,  masterGain: 0.18 },
  raj:          { noiseFreq: 180,  noiseGain: 0.18, droneFreq: 41,  droneGain: 0.28, lfoRate: 0.02, lfoDepth: 1,  masterGain: 0.16 },
  "kosice-final":{ noiseFreq: 650, noiseGain: 0.35, droneFreq: 110, droneGain: 0.16, lfoRate: 0.10, lfoDepth: 4,  masterGain: 0.20 },
  after:        { noiseFreq: 280,  noiseGain: 0.14, droneFreq: 65,  droneGain: 0.20, lfoRate: 0.04, lfoDepth: 1.5,masterGain: 0.14 },
};

function buildReverb(ctx: AudioContext, secs: number, decay: number): ConvolverNode {
  const len = ctx.sampleRate * secs;
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  const conv = ctx.createConvolver();
  conv.buffer = buf;
  return conv;
}

/** Start ambient for a chapter. Returns a stop/fade-out function. */
function startAmbient(ctx: AudioContext, chapterId: string): () => void {
  const p = AUDIO_PROFILES[chapterId];
  if (!p) return () => {};

  // Master gain (starts at 0, fades in)
  const master = ctx.createGain();
  master.gain.setValueAtTime(0, ctx.currentTime);
  master.gain.linearRampToValueAtTime(p.masterGain, ctx.currentTime + 1.0);

  // Reverb send
  const reverb = buildReverb(ctx, 2.5, 3.0);
  const reverbGain = ctx.createGain();
  reverbGain.gain.value = 0.35;
  reverb.connect(reverbGain);
  reverbGain.connect(master);

  // ── Noise source ────────────────────────────────────────────────────────────
  const nBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const nd = nBuf.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource();
  noise.buffer = nBuf;
  noise.loop = true;
  const nFilter = ctx.createBiquadFilter();
  nFilter.type = "lowpass";
  nFilter.frequency.value = p.noiseFreq;
  const nGain = ctx.createGain();
  nGain.gain.value = p.noiseGain;
  noise.connect(nFilter);
  nFilter.connect(nGain);
  nGain.connect(master);
  nGain.connect(reverb);
  noise.start();

  // ── Drone oscillator ────────────────────────────────────────────────────────
  const drone = ctx.createOscillator();
  drone.type = "sine";
  drone.frequency.value = p.droneFreq;
  const dGain = ctx.createGain();
  dGain.gain.value = p.droneGain;

  // LFO modulates drone pitch
  const lfo = ctx.createOscillator();
  lfo.type = "sine";
  lfo.frequency.value = p.lfoRate;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = p.lfoDepth;
  lfo.connect(lfoGain);
  lfoGain.connect(drone.frequency);

  drone.connect(dGain);
  dGain.connect(master);
  dGain.connect(reverb);
  drone.start();
  lfo.start();

  master.connect(ctx.destination);

  // Return stop function
  return (fadeTime = 0.45) => {
    const t = ctx.currentTime;
    master.gain.linearRampToValueAtTime(0, t + fadeTime);
    setTimeout(() => {
      try { noise.stop(); drone.stop(); lfo.stop(); master.disconnect(); } catch { /* already gone */ }
    }, (fadeTime + 0.15) * 1000);
  };
}

// ── Photo grid ────────────────────────────────────────────────────────────────
// Layouts adapt to 1–5 photos. Panel dimensions: w × h passed as props.
function PhotoGrid({ photos, panelW, panelH }: { photos: Photo[]; panelW: number; panelH: number }) {
  const n = photos.length;
  if (n === 0) return <div style={{ width: panelW, height: panelH, backgroundColor: C.bg }} />;

  const gap = 2;

  // 1 photo — full fill
  if (n === 1) return (
    <div style={{ width: panelW, height: panelH, position: "relative", overflow: "hidden" }}>
      <Image src={photos[0].src} alt={photos[0].caption} fill sizes={`${panelW}px`}
        style={{ objectFit: "cover", objectPosition: "center" }} />
    </div>
  );

  // 2 photos — side by side
  if (n === 2) {
    const w = Math.floor((panelW - gap) / 2);
    return (
      <div style={{ display: "flex", gap, width: panelW, height: panelH }}>
        {photos.map((p, i) => (
          <div key={i} style={{ width: w, height: panelH, position: "relative", overflow: "hidden", flexShrink: 0 }}>
            <Image src={p.src} alt={p.caption} fill sizes={`${w}px`}
              style={{ objectFit: "cover", objectPosition: "center" }} />
          </div>
        ))}
      </div>
    );
  }

  // 3 photos — left tall (55%) + right two stacked (45%)
  if (n === 3) {
    const lW = Math.floor(panelW * 0.55);
    const rW = panelW - lW - gap;
    const rH = Math.floor((panelH - gap) / 2);
    return (
      <div style={{ display: "flex", gap, width: panelW, height: panelH }}>
        <div style={{ width: lW, height: panelH, position: "relative", overflow: "hidden", flexShrink: 0 }}>
          <Image src={photos[0].src} alt={photos[0].caption} fill sizes={`${lW}px`}
            style={{ objectFit: "cover", objectPosition: "center" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap, width: rW, flexShrink: 0 }}>
          {[photos[1], photos[2]].map((p, i) => (
            <div key={i} style={{ width: rW, height: rH, position: "relative", overflow: "hidden" }}>
              <Image src={p.src} alt={p.caption} fill sizes={`${rW}px`}
                style={{ objectFit: "cover", objectPosition: "center" }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 4 photos — 2×2 grid
  if (n === 4) {
    const w = Math.floor((panelW - gap) / 2);
    const h = Math.floor((panelH - gap) / 2);
    return (
      <div style={{ display: "grid", gridTemplateColumns: `${w}px ${w}px`, gridTemplateRows: `${h}px ${h}px`, gap, width: panelW, height: panelH }}>
        {photos.map((p, i) => (
          <div key={i} style={{ position: "relative", overflow: "hidden" }}>
            <Image src={p.src} alt={p.caption} fill sizes={`${w}px`}
              style={{ objectFit: "cover", objectPosition: "center" }} />
          </div>
        ))}
      </div>
    );
  }

  // 5 photos — left column tall (1 photo) + right 2×2 (4 photos)
  const lW = Math.floor((panelW - gap) / 2);
  const rW = panelW - lW - gap;
  const rH = Math.floor((panelH - gap) / 2);
  return (
    <div style={{ display: "flex", gap, width: panelW, height: panelH }}>
      <div style={{ width: lW, height: panelH, position: "relative", overflow: "hidden", flexShrink: 0 }}>
        <Image src={photos[0].src} alt={photos[0].caption} fill sizes={`${lW}px`}
          style={{ objectFit: "cover", objectPosition: "center" }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `1fr 1fr`, gridTemplateRows: `${rH}px ${rH}px`, gap, width: rW, flexShrink: 0 }}>
        {photos.slice(1, 5).map((p, i) => (
          <div key={i} style={{ position: "relative", overflow: "hidden" }}>
            <Image src={p.src} alt={p.caption} fill sizes={`${Math.floor(rW / 2)}px`}
              style={{ objectFit: "cover", objectPosition: "center" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Sound button ──────────────────────────────────────────────────────────────
function SoundButton({
  enabled, playing, onToggle, label,
}: {
  enabled: boolean; playing: boolean; onToggle: () => void; label: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title={playing ? "Mute ambient sound" : "Play ambient sound"}
      style={{
        display: "flex", alignItems: "center", gap: 7, background: "none",
        border: `1px solid ${playing ? C.ink : C.border}`,
        borderRadius: 3, padding: "5px 10px", cursor: "pointer",
        opacity: playing ? 1 : 0.55, transition: "opacity 0.18s, border-color 0.18s",
      }}
    >
      {/* Animated bars */}
      <span style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 14 }}>
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            style={{
              display: "block", width: 3, borderRadius: 1,
              backgroundColor: C.ink, opacity: 0.7,
              height: playing ? `${[10, 14, 8][i - 1]}px` : "4px",
              transition: "height 0.25s ease",
              animation: playing ? `waveBar${i} 0.${5 + i * 1}s ease-in-out infinite alternate` : "none",
            }}
          />
        ))}
      </span>
      <span style={{
        fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
        fontSize: "8.5px", fontWeight: 700, letterSpacing: "0.14em",
        textTransform: "uppercase", color: C.ink,
      }}>
        {playing ? label : "Listen"}
      </span>
    </button>
  );
}

// ── Cover page (Before / After) ───────────────────────────────────────────────
function CoverPage({
  chapter, isAfter, soundPlaying, onSoundToggle,
}: {
  chapter: Chapter; isAfter: boolean; soundPlaying: boolean; onSoundToggle: () => void;
}) {
  const photoW = 520;
  const photoH = 580;

  return (
    <div style={{ display: "flex", width: 1080, height: 580, backgroundColor: C.bg }}>

      {/* ── Left: identity panel ── */}
      <div style={{
        width: 560, flexShrink: 0, backgroundColor: C.bg,
        display: "flex", flexDirection: "column",
        padding: isAfter ? "32px 40px 28px" : "30px 40px 28px",
        position: "relative", overflow: "hidden",
      }}>
        {/* Chapter tag */}
        <p style={{
          fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
          fontWeight: 700, fontSize: "9px", letterSpacing: "0.26em",
          textTransform: "uppercase", color: C.teal, margin: "0 0 14px",
        }}>
          {chapter.num} · {chapter.component}
        </p>

        {/* PASSAGE — the loudest element on the cover */}
        <h1 style={{
          fontFamily: "var(--font-anton), system-ui, sans-serif",
          fontSize: 92, lineHeight: 0.92, color: C.ink,
          margin: "0 0 6px", letterSpacing: "0.01em", textTransform: "uppercase",
        }}>
          PASSAGE
        </h1>

        {/* Program line */}
        <p style={{
          fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
          fontWeight: 700, fontSize: "13px", letterSpacing: "0.24em",
          textTransform: "uppercase", color: C.teal, margin: "0 0 4px",
        }}>
          SLOVAKIA 2026
        </p>
        <p style={{
          fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
          fontSize: "11px", color: C.muted, margin: "0 0 22px",
        }}>
          {PROGRAM.dates}
        </p>

        {/* Thin rule */}
        <div style={{ width: 48, height: 1, backgroundColor: C.ink, opacity: 0.25, marginBottom: 22 }} />

        {/* Artist response — large italic, the emotional center */}
        <p style={{
          fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
          fontStyle: "italic", fontSize: 18, lineHeight: 1.62,
          color: C.ink, margin: "0 0 auto", maxWidth: 420,
        }}>
          &ldquo;{chapter.response}&rdquo;
        </p>

        {/* Bottom: artist name + sound */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: 28 }}>
          <div>
            <p style={{ fontFamily: "var(--font-anton), system-ui, sans-serif", fontSize: 22, color: C.ink, margin: "0 0 2px", textTransform: "uppercase" }}>
              {ARTIST.name}
            </p>
            <p style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: 10, color: C.muted, margin: 0 }}>
              {ARTIST.roles.join(" · ")}
            </p>
          </div>
          <SoundButton enabled playing={soundPlaying} onToggle={onSoundToggle} label={chapter.description.slice(0, 18)} />
        </div>
      </div>

      {/* ── Right: photos ── */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        <PhotoGrid photos={chapter.photos} panelW={photoW} panelH={photoH} />
      </div>
    </div>
  );
}

// ── Journey page (chapters 01–05) ────────────────────────────────────────────
function JourneyPage({
  chapter, soundPlaying, onSoundToggle,
}: {
  chapter: Chapter; soundPlaying: boolean; onSoundToggle: () => void;
}) {
  const journalW = 380;
  const photoW   = 1080 - journalW;
  const photoH   = 580;

  return (
    <div style={{ display: "flex", width: 1080, height: 580 }}>

      {/* ── Left: journal panel ── */}
      <div style={{
        width: journalW, flexShrink: 0, backgroundColor: C.bg,
        display: "flex", flexDirection: "column",
        padding: "22px 28px 22px 28px",
        borderRight: `1px solid ${C.sep}`,
        position: "relative",
      }}>
        {/* Header: PASSAGE (dignified, persistent) */}
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 16 }}>
          <span style={{
            fontFamily: "var(--font-anton), system-ui, sans-serif",
            fontSize: 22, color: C.ink, letterSpacing: "0.04em",
            textTransform: "uppercase", lineHeight: 1,
          }}>
            PASSAGE
          </span>
          <span style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontWeight: 700, fontSize: "8px", letterSpacing: "0.18em",
            textTransform: "uppercase", color: C.teal,
          }}>
            {PROGRAM.dates.split("–")[0].trim()} –
          </span>
        </div>

        {/* Thin rule */}
        <div style={{ width: "100%", height: 1, backgroundColor: C.sep, marginBottom: 18 }} />

        {/* Chapter number — large decorative ghost */}
        <div style={{ position: "relative" }}>
          <span style={{
            position: "absolute", top: -8, left: -4,
            fontFamily: "var(--font-anton), system-ui, sans-serif",
            fontSize: 96, lineHeight: 1, color: C.ink, opacity: 0.05,
            pointerEvents: "none", userSelect: "none", letterSpacing: "0.02em",
          }}>
            {chapter.num}
          </span>

          {/* Location name */}
          <p style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontWeight: 700, fontSize: "13px", letterSpacing: "0.14em",
            textTransform: "uppercase", color: C.ink,
            margin: "0 0 4px", position: "relative", zIndex: 1,
          }}>
            {chapter.location}
          </p>

          {/* Component / DAT label */}
          <p style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontSize: "10px", color: C.teal, margin: "0 0 18px",
            lineHeight: 1.3, position: "relative", zIndex: 1,
          }}>
            {chapter.component}
          </p>
        </div>

        {/* Artist's response — primary content, set large */}
        <p style={{
          fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
          fontStyle: "italic", fontSize: 16, lineHeight: 1.72,
          color: C.ink, margin: "0 0 auto",
          borderLeft: `3px solid ${chapter.accentColor}`,
          paddingLeft: 14,
        }}>
          &ldquo;{chapter.response}&rdquo;
        </p>

        {/* Context description */}
        <p style={{
          fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
          fontSize: "10.5px", color: C.muted, lineHeight: 1.5, margin: "16px 0 18px",
        }}>
          {chapter.description}
        </p>

        {/* Bottom: Slovakia mini-map + sound */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <p style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontWeight: 700, fontSize: "7px", letterSpacing: "0.2em",
              textTransform: "uppercase", color: C.dim, margin: "0 0 5px",
            }}>
              Slovakia
            </p>
            <SlovakiaMap activeDotId={chapter.mapDotId} />
          </div>
          <SoundButton enabled playing={soundPlaying} onToggle={onSoundToggle} label={chapter.location.split(" ")[0]} />
        </div>
      </div>

      {/* ── Right: photo panel ── */}
      <div style={{ flex: 1, overflow: "hidden", backgroundColor: "#e8e2da" }}>
        <PhotoGrid photos={chapter.photos} panelW={photoW} panelH={photoH} />
      </div>
    </div>
  );
}

// ── Chapter dots ──────────────────────────────────────────────────────────────
function ChapterDots({ total, current, onSelect }: { total: number; current: number; onSelect: (i: number) => void }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "center", padding: "12px 0 0" }}>
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i} type="button" onClick={() => onSelect(i)}
          title={CHAPTERS[i].location}
          style={{
            width: current === i ? 20 : 7,
            height: 7, borderRadius: 4, border: "none", padding: 0, cursor: "pointer",
            backgroundColor: current === i ? C.ink : C.dim,
            transition: "width 0.22s ease, background-color 0.18s ease",
          }}
        />
      ))}
    </div>
  );
}

// ── Mockup banner ─────────────────────────────────────────────────────────────
function MockupBanner() {
  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 200, backgroundColor: C.yellow,
      padding: "0.38rem 1.25rem", display: "flex", alignItems: "center",
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
          /journey-card-mockup/v10 · 7 sliding pages · arrows or dots to navigate · click Listen for ambient sound
        </span>
      </div>
      <nav style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
        {([
          ["/journey-card-mockup/v8", "← v8"],
          ["/journey-card-mockup/v9", "← v9"],
          ["/journey-card-mockup/v10", "v10"],
        ] as [string, string][]).map(([href, label]) => (
          <a key={href} href={href} style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "0.58rem", fontWeight: 600, letterSpacing: "0.08em",
            textTransform: "uppercase", color: C.ink, textDecoration: "none",
            padding: "0.18rem 0.5rem", borderRadius: "3px",
            backgroundColor: label === "v10" ? "rgba(36,17,35,0.18)" : "rgba(36,17,35,0.09)",
          }}>{label}</a>
        ))}
      </nav>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function JourneyCardV10() {
  const [page, setPage]               = useState(0);
  const [soundPlaying, setSoundPlaying] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const audioCtxRef  = useRef<AudioContext | null>(null);
  const stopAudioRef = useRef<((fadeTime?: number) => void) | null>(null);
  // For touch/swipe
  const touchStartX  = useRef<number | null>(null);

  const total = CHAPTERS.length; // 7

  // ── Navigate to page ────────────────────────────────────────────────────────
  const goTo = useCallback((idx: number) => {
    if (idx < 0 || idx >= total) return;
    setPage(idx);

    // If sound is playing, crossfade to new chapter's ambient
    if (soundPlaying && audioCtxRef.current) {
      if (stopAudioRef.current) { stopAudioRef.current(0.35); stopAudioRef.current = null; }
      stopAudioRef.current = startAmbient(audioCtxRef.current, CHAPTERS[idx].id);
    }
  }, [soundPlaying, total]);

  // ── Toggle sound ────────────────────────────────────────────────────────────
  const toggleSound = useCallback(() => {
    if (!hasInteracted) {
      // First interaction — create AudioContext and start playing
      const Ctor =
        (typeof window !== "undefined" &&
          (window.AudioContext ||
            (window as unknown as Record<string, typeof AudioContext>).webkitAudioContext)) as
          | typeof AudioContext
          | undefined;
      if (!Ctor) return;
      const ctx = new Ctor();
      audioCtxRef.current = ctx;
      stopAudioRef.current = startAmbient(ctx, CHAPTERS[page].id);
      setSoundPlaying(true);
      setHasInteracted(true);
      return;
    }
    if (soundPlaying) {
      // Mute
      if (stopAudioRef.current) { stopAudioRef.current(0.4); stopAudioRef.current = null; }
      setSoundPlaying(false);
    } else {
      // Unmute
      if (audioCtxRef.current) {
        stopAudioRef.current = startAmbient(audioCtxRef.current, CHAPTERS[page].id);
      }
      setSoundPlaying(true);
    }
  }, [hasInteracted, soundPlaying, page]);

  // ── Keyboard nav ────────────────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === "ArrowDown")  goTo(page + 1);
      if (e.key === "ArrowLeft"  || e.key === "ArrowUp")    goTo(page - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [page, goTo]);

  // ── Cleanup audio on unmount ─────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (stopAudioRef.current) stopAudioRef.current(0.1);
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  const ch = CHAPTERS[page];

  return (
    <>
      {/* Wave bar animation keyframes */}
      <style>{`
        @keyframes waveBar1 { from { height: 6px; } to { height: 13px; } }
        @keyframes waveBar2 { from { height: 10px; } to { height: 4px; }  }
        @keyframes waveBar3 { from { height: 4px; }  to { height: 10px; } }
        .jc-v10-outer {
          width: 1080px;
          height: 580px;
          border-radius: 5px;
          overflow: hidden;
          position: relative;
          flex-shrink: 0;
          border: 1px solid ${C.border};
          box-shadow: 0 8px 40px rgba(36,17,35,0.14), 0 2px 10px rgba(36,17,35,0.07);
          touch-action: pan-y;
        }
        @media (max-width: 1120px) {
          .jc-v10-outer {
            width: 100%;
            height: auto;
            min-height: 560px;
          }
          .jc-v10-track > * {
            width: 100vw !important;
          }
        }
      `}</style>

      <MockupBanner />

      <main style={{
        backgroundColor: "#e8e2da", minHeight: "100vh",
        padding: "28px 16px 64px",
        display: "flex", flexDirection: "column", alignItems: "center",
      }}>
        {/* ── Meta label ── */}
        <div style={{
          width: "100%", maxWidth: 1080,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 12,
        }}>
          <span style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.24em",
            textTransform: "uppercase", color: C.muted,
          }}>
            Journey Card · v10 · {ch.num} of 06 — {ch.location}
          </span>
          <span style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontSize: "0.6rem", color: C.muted, fontStyle: "italic",
          }}>
            ← → to navigate
          </span>
        </div>

        {/* ── Sliding card ── */}
        <div
          className="jc-v10-outer"
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
            className="jc-v10-track"
            style={{
              display: "flex",
              width: `${total * 1080}px`,
              height: "100%",
              transform: `translateX(-${page * 1080}px)`,
              transition: "transform 360ms cubic-bezier(0.4, 0, 0.2, 1)",
              willChange: "transform",
            }}
          >
            {CHAPTERS.map((c, idx) => (
              <div key={c.id} style={{ width: 1080, height: "100%", flexShrink: 0 }}>
                {c.isCover ? (
                  <CoverPage
                    chapter={c}
                    isAfter={c.id === "after"}
                    soundPlaying={soundPlaying && page === idx}
                    onSoundToggle={toggleSound}
                  />
                ) : (
                  <JourneyPage
                    chapter={c}
                    soundPlaying={soundPlaying && page === idx}
                    onSoundToggle={toggleSound}
                  />
                )}
              </div>
            ))}
          </div>

          {/* ← Prev arrow */}
          {page > 0 && (
            <button
              type="button"
              onClick={() => goTo(page - 1)}
              style={{
                position: "absolute", left: 0, top: 0, bottom: 0, width: 52,
                background: "linear-gradient(to right, rgba(242,242,242,0.55) 0%, transparent 100%)",
                border: "none", cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "flex-start", padding: "0 14px",
                zIndex: 10, transition: "opacity 0.18s",
              }}
              aria-label="Previous chapter"
            >
              <span style={{
                fontFamily: "system-ui, sans-serif", fontSize: 20,
                color: C.ink, opacity: 0.55, lineHeight: 1,
              }}>‹</span>
            </button>
          )}

          {/* → Next arrow */}
          {page < total - 1 && (
            <button
              type="button"
              onClick={() => goTo(page + 1)}
              style={{
                position: "absolute", right: 0, top: 0, bottom: 0, width: 52,
                background: "linear-gradient(to left, rgba(242,242,242,0.55) 0%, transparent 100%)",
                border: "none", cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "flex-end", padding: "0 14px",
                zIndex: 10,
              }}
              aria-label="Next chapter"
            >
              <span style={{
                fontFamily: "system-ui, sans-serif", fontSize: 20,
                color: C.ink, opacity: 0.55, lineHeight: 1,
              }}>›</span>
            </button>
          )}
        </div>

        {/* ── Chapter dots ── */}
        <div style={{ width: "100%", maxWidth: 1080 }}>
          <ChapterDots total={total} current={page} onSelect={goTo} />
        </div>

        {/* ── Chapter labels row ── */}
        <div style={{
          width: "100%", maxWidth: 1080, display: "flex",
          justifyContent: "center", gap: 2, marginTop: 8,
        }}>
          {CHAPTERS.map((c, i) => (
            <button
              key={c.id} type="button" onClick={() => goTo(i)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                fontSize: "7px", fontWeight: 700, letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: i === page ? C.ink : C.dim,
                padding: "2px 4px",
                transition: "color 0.18s",
                whiteSpace: "nowrap",
              }}
            >
              {c.num}
            </button>
          ))}
        </div>
      </main>
    </>
  );
}
