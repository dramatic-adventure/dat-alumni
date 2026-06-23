// components/journeys/AdaptiveProfileJourneys.tsx
// Per-alum Journey index for /journeys/[slug].
//
// Look ported from the v17 mockup "Option A" index (bigger headshot + oversized
// name header; each journey as a card + text row), but with the simpler header
// copy from the adaptive index. Fully responsive — built to look great on mobile
// and desktop with a SINGLE card (the common case), and:
//   ≤ 3 cards → Editorial rows (Option A look, the cover reads big)
//   > 3 cards → compact horizontal rail
// (pickProfileLayout() in lib/journeyCard.ts — the same rule the archive uses.)

import JourneyCover from "./JourneyCover";
import PersonJourneysHero from "./PersonJourneysHero";
import { A, KRAFT_PAGE, GLASS, accentColor, safeMediaUrl } from "./journeyTheme";
import { pickProfileLayout, type JourneyCard } from "@/lib/journeyCard";

export type ProfileAlum = {
  name: string;
  slug: string;
  roles: string[];
  headshotUrl?: string;
  /** Most current DAT title — shown under the name when there are no cards yet. */
  currentTitle?: string;
};

// The DAT roles the artist held across their journeys (distinct, in first-seen
// order), drawn from each card's primaryRole. Compound roles like
// "Teaching Artist · Cohort Lead" are split into individual roles.
function journeyRoles(cards: JourneyCard[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of cards) {
    for (const tok of String(c.primaryRole ?? "").split(/\s*[·,]\s*/)) {
      const t = tok.trim();
      if (!t) continue;
      const k = t.toLowerCase();
      if (!seen.has(k)) { seen.add(k); out.push(t); }
    }
  }
  return out;
}

// ── Header (Option A look · simple copy) ──────────────────────────────────────
function ProfileHeader({ alum, sub, count }: { alum: ProfileAlum; sub: string; count: number }) {
  const shot = safeMediaUrl(alum.headshotUrl) || "/images/default-headshot.png";
  return (
    <header className="jp-header">
      <a href={`/alumni/${alum.slug}`} className="jp-shotlink" style={{ display: "block", textDecoration: "none" }}>
        <div className="jp-shot">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={shot} alt={alum.name} loading="lazy" decoding="async"
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 12%" }} />
        </div>
      </a>
      <div className="jp-headtext" style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", margin: "0 0 14px" }}>
          <p style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontWeight: 700, fontSize: 11, letterSpacing: "0.28em",
            textTransform: "uppercase", color: A.pink, margin: 0,
          }}>
            <a href="/journeys" className="jp-crumb" style={{ color: "inherit", textDecoration: "none" }}>Journeys</a>
            {` / ${alum.slug}`}
          </p>
          {count > 0 && (
            <span style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontWeight: 800, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase",
              color: A.teal, border: `1px solid ${A.teal}`, borderRadius: 999,
              padding: "3px 10px", background: "rgba(36,147,169,0.08)", whiteSpace: "nowrap",
            }}>
              {count} {count === 1 ? "Journey" : "Journeys"}
            </span>
          )}
        </div>
        <a href={`/alumni/${alum.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
          <h1 className="jp-name" style={{
            fontFamily: "var(--font-anton), system-ui, sans-serif",
            lineHeight: 0.92, letterSpacing: "0.005em", textTransform: "uppercase",
            color: A.ink, margin: "0 0 12px", transition: "color .2s ease",
          }}>
            {alum.name}
          </h1>
        </a>
        <p style={{
          fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
          fontSize: "clamp(13px, 1.6vw, 16px)", color: A.muted, margin: 0,
        }}>
          {sub}
        </p>
      </div>
    </header>
  );
}

// ── Editorial rows (≤3) — card + text, Option A layout, simple copy ──────────
function EditorialList({ cards }: { cards: JourneyCard[] }) {
  return (
    <section style={{ width: "100%", display: "flex", flexDirection: "column", gap: 0 }}>
      {cards.map((c, idx) => {
        const accent = accentColor(c.accent);
        return (
          <article key={c.id} className="jp-row" style={{
            paddingBottom: idx === cards.length - 1 ? 0 : 36,
            marginBottom: idx === cards.length - 1 ? 0 : 36,
            borderBottom: idx === cards.length - 1 ? "none" : `1px solid ${A.sep}`,
          }}>
            <div className="jp-rowcard">
              <JourneyCover card={c} size="lg" />
            </div>

            <div className="jp-rowtext" style={{ display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0 }}>
              {c.pullQuote && (
                <div className="jp-quote" style={{ display: "flex", gap: 14, margin: "0 0 16px", maxWidth: 640 }}>
                  <span aria-hidden style={{ display: "inline-block", width: 3, alignSelf: "stretch", backgroundColor: accent, flexShrink: 0, borderRadius: 1 }} />
                  <p style={{
                    fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                    fontStyle: "italic", fontSize: "clamp(16px, 1.9vw, 19px)", lineHeight: 1.55,
                    color: A.ink, opacity: 0.85, margin: 0,
                  }}>
                    &ldquo;{c.pullQuote}&rdquo;
                  </p>
                </div>
              )}

              {c.dates && (
                <p style={{
                  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                  fontSize: 13, color: A.muted, margin: "0 0 18px",
                }}>
                  {c.dates}
                </p>
              )}

              <a href={c.href} className="jp-open" style={{
                alignSelf: "flex-start",
                display: "inline-flex", alignItems: "center", gap: 8,
                fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                fontWeight: 800, fontSize: 11, letterSpacing: "0.18em",
                textTransform: "uppercase", textDecoration: "none",
                color: "#fff", backgroundColor: A.pink,
                padding: "11px 20px", borderRadius: 999,
                boxShadow: "0 4px 14px rgba(242,51,89,0.35)",
              }}>
                Open journey card ›
              </a>
            </div>
          </article>
        );
      })}
    </section>
  );
}

// ── Rail (>3) — compact horizontal scroll ─────────────────────────────────────
function RailLayout({ cards }: { cards: JourneyCard[] }) {
  return (
    <section style={{ width: "100%" }}>
      <div style={{
        display: "flex", gap: 24, overflowX: "auto",
        padding: "4px 2px 18px",
        scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch",
      }}>
        {cards.map((c) => (
          <div key={c.id} style={{ scrollSnapAlign: "center", flexShrink: 0 }}>
            <JourneyCover card={c} size="md" />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function AdaptiveProfileJourneys({ alum, cards }: { alum: ProfileAlum; cards: JourneyCard[] }) {
  const count = cards.length;
  const layout = pickProfileLayout(count); // ≤3 editorial · >3 rail
  // Show the full-bleed person hero when at least one card has an image. When
  // present, it sits at the very top (the site nav overlays its dark scrim, like
  // the archive), so the main needs no top padding; otherwise we pad to clear nav.
  const showHero = cards.some((c) => safeMediaUrl(c.heroUrl));
  // Under the name: only the DAT roles from their journeys (distinct). With no
  // journeys yet, fall back to their most current DAT title.
  const sub = journeyRoles(cards).join(" · ") || alum.currentTitle || "";

  return (
    <main style={{
      ...KRAFT_PAGE, minHeight: "100vh",
      padding: showHero ? "0 0 80px" : "clamp(96px, 13vh, 150px) clamp(12px, 4vw, 56px) 80px",
    }}>
      <style>{`
        .jp-header {
          display: grid; grid-template-columns: auto minmax(0,1fr);
          gap: clamp(20px, 4vw, 36px); align-items: center;
          padding: 0 0 26px; margin-bottom: 36px; border-bottom: 1px solid ${A.border};
        }
        .jp-shot {
          width: clamp(120px, 20vw, 180px); aspect-ratio: 4 / 5; position: relative;
          border: 1px solid ${A.border}; border-radius: 6px; overflow: hidden;
          transition: transform .3s ease, box-shadow .3s ease;
        }
        .jp-shotlink:hover .jp-shot { transform: scale(1.04); box-shadow: 0 10px 26px rgba(36,17,35,0.2); }
        .jp-crumb { color: inherit; text-decoration: none; transition: color .15s ease; }
        .jp-crumb:hover { color: #ffcc00; text-decoration: underline; }
        .jp-name { font-size: clamp(38px, 7vw, 84px); }
        .jp-headtext a:hover .jp-name, .jp-header a:hover .jp-name { color: ${A.pink}; }
        .jp-row {
          display: grid; grid-template-columns: minmax(220px, 320px) minmax(0,1fr);
          gap: clamp(22px, 4vw, 44px); align-items: center;
        }
        .jp-rowcard { display: flex; align-items: center; justify-content: center; }
        .jp-open { transition: transform .18s ease, box-shadow .18s ease; }
        .jp-open:hover { transform: translateY(-2px); box-shadow: 0 8px 22px rgba(242,51,89,0.5); }
        @media (max-width: 760px) {
          .jp-header { grid-template-columns: 1fr; justify-items: center; text-align: center; }
          .jp-headtext { text-align: center; }
          .jp-row { grid-template-columns: 1fr; justify-items: center; text-align: center; }
          .jp-rowtext { align-items: center; }
          .jp-quote { text-align: left; }
          .jp-open { align-self: center !important; }
        }
      `}</style>

      {showHero && <PersonJourneysHero cards={cards} totalCount={count} />}

      <div style={{ ...GLASS, maxWidth: 1100,
        // When the hero is shown the main has no side padding, so the GLASS panel
        // provides its own horizontal gutter; otherwise it just centers.
        width: showHero ? "calc(100% - clamp(24px, 8vw, 112px))" : "100%",
        margin: showHero ? "clamp(28px, 5vh, 48px) auto 0" : "0 auto",
        padding: "clamp(20px, 4vw, 40px)" }}>
        <ProfileHeader alum={alum} sub={sub} count={count} />

        {count === 0 ? (
          <p style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontSize: 15, color: A.muted, margin: 0, textAlign: "center",
          }}>
            {alum.name} hasn’t published a Journey Card yet.
          </p>
        ) : layout === "editorial" ? (
          <EditorialList cards={cards} />
        ) : (
          <RailLayout cards={cards} />
        )}
      </div>
    </main>
  );
}
