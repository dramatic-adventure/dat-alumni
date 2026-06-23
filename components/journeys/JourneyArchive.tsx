// components/journeys/JourneyArchive.tsx
// Production port of the approved v17 mockup `JourneyArchive` — the searchable
// global archive of every published Journey Card.
//
// One rule, applied everywhere: a group with >1 card shows as a passport STACK
// (a clean pile with buffer space); click → it expands into the ADAPTIVE INDEX
// of just that group (≤3 editorial · ≥4 rail). Default facet = "recent": a flat
// grid of every card, most-recently-added first. Facets: person (real
// FeaturedAlumni mini-cards, linking to /journeys/[slug]), country (with
// multi-country categories), program, project. Above the search: a rotating
// image + quote hero as a lean-back way in.

"use client";

import { useEffect, useMemo, useState } from "react";
import FeaturedAlumni from "@/components/alumni/FeaturedAlumni";
import JourneyCover from "./JourneyCover";
import { A, KRAFT_PAGE, GLASS, safeMediaUrl } from "./journeyTheme";
import { pickProfileLayout, countriesOf, type JourneyCard } from "@/lib/journeyCard";

export type ArchiveAlum = { name: string; role?: string; headshot?: string };
export type AlumniDirectory = Record<string, ArchiveAlum>;

type Facet = "recent" | "person" | "country" | "program" | "project";

const FACETS: { id: Facet; label: string }[] = [
  { id: "recent",  label: "Most recent" },
  { id: "person",  label: "By person" },
  { id: "country", label: "By country" },
  { id: "program", label: "By program" },
  { id: "project", label: "By project" },
];

const CARD_W = 320;

const sortKey = (c: JourneyCard) => String(c.sortDate || c.createdAt || "");
const byNewest = (a: JourneyCard, b: JourneyCard) => sortKey(b).localeCompare(sortKey(a));

const labelChip: React.CSSProperties = {
  ...GLASS,
  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
  fontWeight: 700, fontSize: 13, letterSpacing: "0.04em",
  color: "#241123", padding: "8px 16px", textAlign: "center",
  maxWidth: CARD_W,
};

// ── Full-bleed hero banner (house style — matches Theatre/Projects archives) ──
// Rotating background images drawn from the cards, a dark scrim, a fixed
// "JOURNEYS / SHARED" title bottom-right, and the rotating card's quote as a
// dynamic tagline. Dots let the viewer control the rotation.
function JourneysHero({ cards }: { cards: JourneyCard[] }) {
  const [i, setI] = useState(0);
  const slides = cards.filter((c) => safeMediaUrl(c.heroUrl)).slice(0, 6);
  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setI((p) => (p + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [slides.length]);
  const c = slides.length ? slides[Math.min(i, slides.length - 1)] : null;

  return (
    <section style={{
      position: "relative", width: "100%", height: "clamp(420px, 66vh, 660px)",
      overflow: "hidden", boxShadow: "0 0 40px rgba(36,17,35,0.5)",
      background: A.ink,
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

      {/* Scrims — bottom darkening + bottom-right pool for the title */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
        background: "linear-gradient(to top, rgba(36,17,35,0.9) 0%, rgba(36,17,35,0.32) 45%, transparent 72%)" }} />
      <div style={{ position: "absolute", bottom: 0, right: 0, width: "65%", height: "78%", pointerEvents: "none",
        background: "radial-gradient(ellipse 90% 80% at 85% 80%, rgba(36,17,35,0.5) 0%, rgba(36,17,35,0.15) 45%, transparent 72%)" }} />

      {/* Clickable to the current card */}
      {c && (
        <a href={c.href} aria-label={`${c.title} — ${c.program}: ${c.country} ${c.year}`} className="jc-herolink"
          style={{ position: "absolute", inset: 0, zIndex: 2, display: "block" }} />
      )}

      {/* Title block — bottom-right, house style */}
      <div style={{ position: "absolute", bottom: "4vw", right: "5%", maxWidth: "92vw", textAlign: "right", zIndex: 3, pointerEvents: "none" }}>
        <p style={{
          fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
          fontWeight: 700, fontSize: "clamp(11px, 1.4vw, 14px)", letterSpacing: "0.24em",
          textTransform: "uppercase", color: "#fff", opacity: 0.8, margin: "0 0 0.5rem",
          textShadow: "0 2px 8px rgba(0,0,0,0.7)",
        }}>
          Dramatic Adventure Theatre
        </p>
        <h1 style={{
          fontFamily: "var(--font-anton), system-ui, sans-serif",
          fontSize: "clamp(3rem, 9vw, 7rem)", textTransform: "uppercase",
          color: "#fff", lineHeight: 0.98, margin: 0, textShadow: "0 8px 24px rgba(0,0,0,0.8)",
        }}>
          Journeys<br /><span style={{ color: A.yellow }}>Shared</span>
        </h1>
        {c?.pullQuote && (
          <p style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontStyle: "italic", fontSize: "clamp(0.95rem, 1.8vw, 1.35rem)",
            color: "#fff", opacity: 0.85, margin: "0.7rem 0 0", maxWidth: 560, marginLeft: "auto",
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
              aria-label={`Show slide ${idx + 1}`} aria-current={idx === i}
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

// ── Passport stack ────────────────────────────────────────────────────────────
const STACK_ROT = [0, -4, 4];
const STACK_DX  = [0, -12, 12];
const STACK_DY  = [0, 8, 8];

function PassportStack({ cards, label, onOpen }: { cards: JourneyCard[]; label: string; onOpen: () => void }) {
  const layers = cards.slice(0, 3);
  const BOX_W = CARD_W + 40;
  const BOX_H = 508 + 28;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, width: BOX_W, maxWidth: "100%" }}>
      <button type="button" onClick={onOpen}
        style={{
          background: "none", border: "none", cursor: "pointer", padding: 0,
          // Fluid box so the stack shrinks to fit narrow phones instead of
          // forcing horizontal scroll. The layer cards are sized as a % of it.
          position: "relative", width: BOX_W, maxWidth: "100%", aspectRatio: `${BOX_W} / ${BOX_H}`,
        }}
        aria-label={`Open ${label} — ${cards.length} journeys`}
      >
        {layers.slice().reverse().map((c) => {
          const i = layers.indexOf(c);
          return (
            <div key={c.id} style={{
              position: "absolute", left: "50%", top: 8,
              width: `${(CARD_W / BOX_W) * 100}%`,
              transform: `translateX(calc(-50% + ${STACK_DX[i]}px)) translateY(${STACK_DY[i]}px) rotate(${STACK_ROT[i]}deg)`,
              transformOrigin: "center center",
              filter: i === 0 ? "none" : `brightness(${1 - i * 0.02})`,
            }}>
              <JourneyCover card={c} size="lg" elevated={i === 0} />
            </div>
          );
        })}
      </button>
      <span style={labelChip}>{label}</span>
    </div>
  );
}

function Avatar({ src }: { src?: string }) {
  return (
    <span className="jc-recent-shot" style={{
      width: 72, height: 90, borderRadius: 5, overflow: "hidden",
      position: "relative", flexShrink: 0, display: "inline-block", border: `1px solid ${A.border}`,
    }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={safeMediaUrl(src) || "/images/default-headshot.png"} alt="" loading="lazy" decoding="async"
        style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 18%" }} />
    </span>
  );
}

function CardTile({ card, label, artistSlug, artistHeadshot }: {
  card: JourneyCard; label: string; artistSlug?: string; artistHeadshot?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, width: CARD_W, maxWidth: "100%" }}>
      <JourneyCover card={card} size="lg" />
      {artistSlug ? (
        <a href={`/journeys/${artistSlug}`} className="jc-recent-chip"
          title={`${label}'s journeys`}
          style={{ ...labelChip, display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <Avatar src={artistHeadshot} />
          <span className="jc-recent-name" style={{ transition: "color 0.2s ease" }}>{label}</span>
        </a>
      ) : (
        <span style={labelChip}>{label}</span>
      )}
    </div>
  );
}

function ExpandedGroup({ cards, label, onBack }: { cards: JourneyCard[]; label: string; onBack: () => void }) {
  const sorted = [...cards].sort(byNewest);
  const layout = pickProfileLayout(sorted.length);
  return (
    <section style={{ ...GLASS, width: "100%", maxWidth: 1180, margin: "0 auto", padding: "24px clamp(16px,3vw,32px)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <button type="button" onClick={onBack} className="jc-back" style={{
          fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
          fontWeight: 700, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase",
          color: A.ink, cursor: "pointer",
          border: `1.5px solid ${A.border}`, background: "rgba(255,255,255,0.6)",
          borderRadius: 999, padding: "8px 14px",
        }}>‹ Archive</button>
        <span style={{
          fontFamily: "var(--font-anton), system-ui, sans-serif",
          fontSize: 26, letterSpacing: "0.01em", color: A.ink, textTransform: "uppercase",
        }}>{label}</span>
      </div>

      {layout === "editorial" ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 30, justifyContent: "flex-start" }}>
          {sorted.map((c) => <JourneyCover key={c.id} card={c} size="lg" />)}
        </div>
      ) : (
        <div style={{
          display: "flex", gap: 24, overflowX: "auto", padding: "4px 2px 18px",
          scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch",
        }}>
          {sorted.map((c) => (
            <div key={c.id} style={{ scrollSnapAlign: "center", flexShrink: 0 }}>
              <JourneyCover card={c} size="md" />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ── Grouping ──────────────────────────────────────────────────────────────────
type Group = { key: string; label: string; cards: JourneyCard[] };

function groupByCountry(cards: JourneyCard[]): Group[] {
  const established = new Set<string>();
  for (const c of cards) { const cs = countriesOf(c); if (cs.length === 1) established.add(cs[0]); }

  const map = new Map<string, JourneyCard[]>();
  const push = (k: string, c: JourneyCard) => { (map.get(k) ?? map.set(k, []).get(k)!).push(c); };
  for (const c of cards) {
    const cs = countriesOf(c);
    if (cs.length <= 1) { push(cs[0] ?? c.country, c); continue; }
    push(cs.join(" & "), c);
    for (const country of cs) if (established.has(country)) push(country, c);
  }
  return [...map.entries()]
    .map(([key, cs]) => ({ key, label: key, cards: [...cs].sort(byNewest) }))
    .sort((a, b) => byNewest(a.cards[0], b.cards[0]));
}

function groupBy(cards: JourneyCard[], keyer: (c: JourneyCard) => string, labeler?: (key: string) => string): Group[] {
  const map = new Map<string, JourneyCard[]>();
  const push = (k: string, c: JourneyCard) => { (map.get(k) ?? map.set(k, []).get(k)!).push(c); };
  for (const c of cards) push(keyer(c), c);
  return [...map.entries()]
    .map(([key, cs]) => ({ key, label: labeler ? labeler(key) : key, cards: [...cs].sort(byNewest) }))
    .sort((a, b) => byNewest(a.cards[0], b.cards[0]));
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function JourneyArchive({ cards, alumni }: { cards: JourneyCard[]; alumni: AlumniDirectory }) {
  const [facet, setFacet] = useState<Facet>("recent");
  const [query, setQuery] = useState("");
  const [openKey, setOpenKey] = useState<string | null>(null);

  const alumOf = (slug: string): ArchiveAlum | undefined =>
    alumni[slug] ?? alumni[String(slug ?? "").trim().toLowerCase()];
  const nameOf = (slug: string) => alumOf(slug)?.name ?? slug;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cards;
    return cards.filter((c) =>
      [nameOf(c.profileSlug), c.country, c.program, c.title, String(c.year), ...countriesOf(c)]
        .join(" ").toLowerCase().includes(q));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, cards]);

  const groups = useMemo<Group[] | null>(() => {
    if (facet === "recent") return null;
    if (facet === "country") return groupByCountry(filtered);
    if (facet === "person")  return groupBy(filtered, (c) => c.profileSlug, (slug) => nameOf(slug));
    if (facet === "program") return groupBy(filtered, (c) => c.program);
    return groupBy(filtered, (c) => c.programLabel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facet, filtered]);

  const openGroup = openKey && groups ? groups.find((g) => g.key === openKey) : null;
  const switchFacet = (f: Facet) => { setFacet(f); setOpenKey(null); };

  return (
    <>
      <style>{`
        .jc-recent-chip { transition: transform 0.2s ease; }
        .jc-recent-chip:hover { transform: translateY(-2px); }
        .jc-recent-chip:hover .jc-recent-name { color: ${A.pink}; }
        .jc-recent-shot { transition: transform 0.25s ease, filter 0.25s ease; }
        .jc-recent-chip:hover .jc-recent-shot { transform: scale(1.06); filter: brightness(1.04); }
        .jc-pill { transition: transform 0.15s ease, border-color 0.15s ease, background 0.15s ease; }
        .jc-pill:hover { transform: translateY(-1px); border-color: ${A.ink}; }
        .jc-back { transition: transform 0.15s ease, border-color 0.15s ease, background 0.15s ease; }
        .jc-back:hover { transform: translateY(-1px); border-color: ${A.ink}; background: rgba(255,255,255,0.9); }
        .jc-herolink { transition: box-shadow 0.2s ease; }
        .jc-herolink:hover { box-shadow: inset 0 0 0 9999px rgba(36,17,35,0.10); }
      `}</style>

      <main style={{ ...KRAFT_PAGE, minHeight: "100vh", paddingBottom: 110 }}>
        <JourneysHero cards={[...cards].sort(byNewest)} />

        <div style={{ padding: "30px clamp(14px, 4vw, 56px) 0" }}>
        <header style={{ ...GLASS, width: "100%", maxWidth: 1180, margin: "0 auto 30px", padding: "16px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <input
              type="search" value={query} onChange={(e) => { setQuery(e.target.value); setOpenKey(null); }}
              placeholder="Search artist, place, program…"
              style={{
                flex: "1 1 260px", minWidth: 0,
                fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: 14,
                padding: "10px 14px", borderRadius: 999,
                border: `1.5px solid ${A.border}`, background: "rgba(255,255,255,0.7)", color: A.ink,
              }}
            />
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {FACETS.map((f) => (
                <button key={f.id} type="button" className="jc-pill" onClick={() => switchFacet(f.id)} style={pill(facet === f.id)}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        {cards.length === 0 ? (
          <EmptyNote text="No Journey Cards have been published yet." />
        ) : openGroup ? (
          <ExpandedGroup cards={openGroup.cards} label={openGroup.label} onBack={() => setOpenKey(null)} />
        ) : facet === "recent" ? (
          <section style={archiveGrid}>
            {[...filtered].sort(byNewest).map((c) => (
              <CardTile key={c.id} card={c} label={nameOf(c.profileSlug)}
                artistSlug={c.profileSlug} artistHeadshot={alumOf(c.profileSlug)?.headshot} />
            ))}
            {filtered.length === 0 && <EmptyNote />}
          </section>
        ) : facet === "person" ? (
          groups!.length === 0 ? <EmptyNote /> : (
            <FeaturedAlumni
              dense
              linkBase="/journeys"
              highlights={groups!.map((g) => ({
                name: nameOf(g.key),
                role: alumOf(g.key)?.role ?? "",
                slug: g.key,
                headshotUrl: alumOf(g.key)?.headshot,
              }))}
            />
          )
        ) : (
          <section style={archiveGrid}>
            {groups!.map((g) =>
              g.cards.length === 1
                ? <CardTile key={g.key} card={g.cards[0]} label={g.label} />
                : <PassportStack key={g.key} cards={g.cards} label={g.label} onOpen={() => setOpenKey(g.key)} />
            )}
            {groups!.length === 0 && <EmptyNote />}
          </section>
        )}
        </div>
      </main>
    </>
  );
}

const archiveGrid: React.CSSProperties = {
  width: "100%", maxWidth: 1180, margin: "0 auto",
  display: "flex", flexWrap: "wrap", gap: 52, justifyContent: "flex-start",
  alignItems: "flex-start",
};

function EmptyNote({ text = "No journeys match that search." }: { text?: string }) {
  return (
    <p style={{
      ...GLASS, fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
      fontSize: 14, color: A.muted, padding: "16px 20px", maxWidth: 1180, margin: "0 auto",
    }}>
      {text}
    </p>
  );
}

function pill(active: boolean): React.CSSProperties {
  return {
    fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
    fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
    padding: "8px 14px", borderRadius: 999, cursor: "pointer",
    border: `1.5px solid ${active ? A.ink : A.border}`,
    background: active ? A.ink : "rgba(255,255,255,0.6)",
    color: active ? "#fff" : A.ink,
  };
}
