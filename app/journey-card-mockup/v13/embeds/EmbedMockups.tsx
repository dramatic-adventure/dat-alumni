// app/journey-card-mockup/v13/embeds/EmbedMockups.tsx
// ⚠️  MOCKUP ONLY — faux platform UI showing how the share unfurl renders.
//
// Each preview mimics the chrome of a specific platform (iMessage bubble,
// Slack unfurl, Twitter summary_large_image card, etc.) and uses the actual
// journey-card cover image cropped to that platform's expected aspect ratio.
// These are static visual references for stakeholder review — not embeds.

"use client";

import Image from "next/image";

const C = {
  bg:     "#f2f2f2",
  ink:    "#241123",
  yellow: "#f5c842",
  pink:   "#F23359",
  teal:   "#2493a9",
  muted:  "rgba(36,17,35,0.45)",
  border: "rgba(36,17,35,0.13)",
};

const COVER = "/images/projects/archive/teaching-artist-residency-slovakia-camp.webp";
const PAGE_URL = "dramaticadventure.com/journey/isa-martinez";
const TITLE  = "Isabel Martínez · PASSAGE Slovakia 2026 — DAT Journey Card";
const DESC   =
  "A first-person journey through Dramatic Adventure Theatre's PASSAGE Slovakia 2026 program — workshops, residencies, and the Roma youth storytelling work at Zemplínska Teplica.";

// ─── iMessage bubble (large rich link) ────────────────────────────────────
function IMessageEmbed() {
  return (
    <div style={{
      width: 320, borderRadius: 18, overflow: "hidden",
      backgroundColor: "#1c1c1e", border: `1px solid ${C.border}`,
      boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
    }}>
      <div style={{ width: 320, aspectRatio: "1.91 / 1", position: "relative", backgroundColor: "#000" }}>
        <Image src={COVER} alt={TITLE} fill sizes="640px" quality={92} style={{ objectFit: "cover" }} />
      </div>
      <div style={{ padding: "10px 14px 12px" }}>
        <p style={{
          fontFamily: "var(--font-dm-sans), -apple-system, system-ui, sans-serif",
          fontSize: 13, color: "#fff", margin: "0 0 2px",
          fontWeight: 600, lineHeight: 1.3,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>{TITLE}</p>
        <p style={{
          fontFamily: "var(--font-dm-sans), -apple-system, system-ui, sans-serif",
          fontSize: 11, color: "rgba(255,255,255,0.55)", margin: 0,
          textTransform: "lowercase",
        }}>{PAGE_URL}</p>
      </div>
    </div>
  );
}

// ─── Slack unfurl ─────────────────────────────────────────────────────────
function SlackEmbed() {
  return (
    <div style={{
      width: 480, padding: "10px 14px", borderRadius: 8,
      backgroundColor: "#fff", borderLeft: `4px solid ${C.teal}`,
      boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
      fontFamily: "Slack-Lato, -apple-system, system-ui, sans-serif",
    }}>
      <p style={{ fontSize: 13, color: "#1d1c1d", fontWeight: 700, margin: "0 0 3px" }}>
        Dramatic Adventure Theatre
      </p>
      <a href="#" style={{ fontSize: 14, color: "#1264a3", textDecoration: "none", fontWeight: 700 }}>
        {TITLE}
      </a>
      <p style={{ fontSize: 13, color: "#1d1c1d", margin: "4px 0 8px", lineHeight: 1.4,
        display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
      }}>
        {DESC}
      </p>
      <div style={{ width: 360, aspectRatio: "1.91 / 1", position: "relative", borderRadius: 6, overflow: "hidden" }}>
        <Image src={COVER} alt={TITLE} fill sizes="720px" quality={92} style={{ objectFit: "cover" }} />
      </div>
    </div>
  );
}

// ─── Twitter / X summary_large_image card ────────────────────────────────
function TwitterEmbed() {
  return (
    <div style={{
      width: 480, borderRadius: 16, overflow: "hidden",
      border: "1px solid #cfd9de", backgroundColor: "#fff",
      fontFamily: "TwitterChirp, -apple-system, system-ui, sans-serif",
    }}>
      <div style={{ width: 480, aspectRatio: "16 / 9", position: "relative", backgroundColor: "#000" }}>
        <Image src={COVER} alt={TITLE} fill sizes="960px" quality={92} style={{ objectFit: "cover" }} />
      </div>
      <div style={{ padding: "12px 16px 14px" }}>
        <p style={{ fontSize: 13, color: "#536471", margin: "0 0 2px" }}>{PAGE_URL.split("/")[0]}</p>
        <p style={{ fontSize: 15, color: "#0f1419", margin: "0 0 4px", fontWeight: 400, lineHeight: 1.3,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>{TITLE}</p>
        <p style={{ fontSize: 14, color: "#536471", margin: 0, lineHeight: 1.35,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>{DESC}</p>
      </div>
    </div>
  );
}

// ─── Facebook OG card ─────────────────────────────────────────────────────
function FacebookEmbed() {
  return (
    <div style={{
      width: 480, backgroundColor: "#f0f2f5",
      border: "1px solid #ced0d4", borderRadius: 8, overflow: "hidden",
      fontFamily: "SF Pro Text, -apple-system, system-ui, Helvetica, sans-serif",
    }}>
      <div style={{ width: 480, aspectRatio: "1.91 / 1", position: "relative", backgroundColor: "#000" }}>
        <Image src={COVER} alt={TITLE} fill sizes="960px" quality={92} style={{ objectFit: "cover" }} />
      </div>
      <div style={{ padding: "10px 14px 12px", backgroundColor: "#f0f2f5", borderTop: "1px solid #ced0d4" }}>
        <p style={{ fontSize: 12, color: "#65676b", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.02em" }}>
          DRAMATICADVENTURE.COM
        </p>
        <p style={{ fontSize: 17, color: "#050505", margin: "0 0 3px", fontWeight: 600, lineHeight: 1.25,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>{TITLE}</p>
        <p style={{ fontSize: 14, color: "#65676b", margin: 0, lineHeight: 1.3,
          display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>{DESC}</p>
      </div>
    </div>
  );
}

// ─── LinkedIn share preview ──────────────────────────────────────────────
function LinkedInEmbed() {
  return (
    <div style={{
      width: 480, backgroundColor: "#fff",
      border: "1px solid rgba(0,0,0,0.15)", borderRadius: 4, overflow: "hidden",
      fontFamily: "-apple-system, system-ui, Helvetica, sans-serif",
    }}>
      <div style={{ width: 480, aspectRatio: "1.91 / 1", position: "relative", backgroundColor: "#000" }}>
        <Image src={COVER} alt={TITLE} fill sizes="960px" quality={92} style={{ objectFit: "cover" }} />
      </div>
      <div style={{ padding: "12px 16px", backgroundColor: "#edf3f8" }}>
        <p style={{ fontSize: 14, color: "#000", margin: "0 0 4px", fontWeight: 600, lineHeight: 1.3,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>{TITLE}</p>
        <p style={{ fontSize: 12, color: "rgba(0,0,0,0.6)", margin: 0 }}>{PAGE_URL.split("/")[0]} • 2 min read</p>
      </div>
    </div>
  );
}

// ─── Instagram (DM / share sheet preview) — square ───────────────────────
function InstagramEmbed() {
  return (
    <div style={{
      width: 320, borderRadius: 16, overflow: "hidden",
      backgroundColor: "#fff", border: `1px solid ${C.border}`,
      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
      fontFamily: "-apple-system, system-ui, sans-serif",
    }}>
      <div style={{ width: 320, height: 320, position: "relative", backgroundColor: "#000" }}>
        <Image src={COVER} alt={TITLE} fill sizes="640px" quality={92} style={{ objectFit: "cover" }} />
      </div>
      <div style={{ padding: "10px 12px 12px" }}>
        <p style={{ fontSize: 12, color: "#8e8e8e", margin: "0 0 2px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.02em" }}>
          {PAGE_URL.split("/")[0]}
        </p>
        <p style={{ fontSize: 14, color: "#262626", margin: 0, fontWeight: 600, lineHeight: 1.3,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>{TITLE}</p>
      </div>
    </div>
  );
}

// ─── Pinterest pin — portrait ────────────────────────────────────────────
function PinterestEmbed() {
  return (
    <div style={{
      width: 240, borderRadius: 16, overflow: "hidden",
      backgroundColor: "#fff", boxShadow: "0 2px 14px rgba(0,0,0,0.10)",
      fontFamily: "-apple-system, system-ui, sans-serif",
    }}>
      <div style={{ width: 240, aspectRatio: "9 / 16", position: "relative", backgroundColor: "#000" }}>
        <Image src={COVER} alt={TITLE} fill sizes="480px" quality={92} style={{ objectFit: "cover" }} />
      </div>
      <div style={{ padding: "10px 12px 14px" }}>
        <p style={{ fontSize: 13, color: "#111", margin: "0 0 4px", fontWeight: 700, lineHeight: 1.3,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>{TITLE}</p>
        <p style={{ fontSize: 11, color: "#767676", margin: 0 }}>{PAGE_URL.split("/")[0]}</p>
      </div>
    </div>
  );
}

// ── Section helper ──────────────────────────────────────────────────────────
function EmbedSection({
  label, dims, notes, children,
}: {
  label: string; dims: string; notes: string; children: React.ReactNode;
}) {
  return (
    <section style={{
      padding: 24, backgroundColor: C.bg,
      border: `1px solid ${C.border}`, borderRadius: 8,
      display: "flex", flexDirection: "column", gap: 14,
      minWidth: 0,
    }}>
      <div>
        <p style={{
          fontFamily: "var(--font-anton), system-ui, sans-serif",
          fontSize: 22, color: C.ink, margin: "0 0 4px",
          textTransform: "uppercase", letterSpacing: "0.04em",
        }}>{label}</p>
        <p style={{
          fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
          fontWeight: 700, fontSize: 10, letterSpacing: "0.16em",
          textTransform: "uppercase", color: C.pink, margin: "0 0 4px",
        }}>{dims}</p>
        <p style={{
          fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
          fontSize: 12, color: C.muted, margin: 0, lineHeight: 1.5,
        }}>{notes}</p>
      </div>
      <div style={{ alignSelf: "flex-start" }}>{children}</div>
    </section>
  );
}

// ── Banner ─────────────────────────────────────────────────────────────────
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
          /journey-card-mockup/v13/embeds · faux platform share previews
        </span>
      </div>
      <nav style={{ display: "flex", gap: "0.35rem" }}>
        <a href="/journey-card-mockup/v13" style={{
          fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
          fontSize: "0.58rem", fontWeight: 600, letterSpacing: "0.08em",
          textTransform: "uppercase", color: C.ink, textDecoration: "none",
          padding: "0.18rem 0.5rem", borderRadius: "3px",
          backgroundColor: "rgba(36,17,35,0.09)",
        }}>← back to v13</a>
      </nav>
    </div>
  );
}

// ── Root ───────────────────────────────────────────────────────────────────
export default function EmbedMockups() {
  return (
    <>
      <MockupBanner />
      <main style={{
        backgroundColor: "#e8e2da", minHeight: "100vh",
        padding: "32px 20px 80px",
      }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <header style={{ marginBottom: 28 }}>
            <p style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontWeight: 700, fontSize: 11, letterSpacing: "0.22em",
              textTransform: "uppercase", color: C.pink, margin: "0 0 4px",
            }}>Share preview gallery</p>
            <h1 style={{
              fontFamily: "var(--font-anton), system-ui, sans-serif",
              fontSize: 44, color: C.ink, margin: "0 0 6px",
              textTransform: "uppercase", letterSpacing: "0.01em", lineHeight: 1,
            }}>Embed mockups</h1>
            <p style={{
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              fontSize: 14, color: C.muted, margin: 0, maxWidth: 680, lineHeight: 1.55,
            }}>
              Faux UI showing how the journey-card link will unfurl when shared on each
              platform. Each preview uses the actual cover image cropped to the
              platform&apos;s expected aspect ratio. The OG metadata in
              <code style={{ background: "rgba(36,17,35,0.08)", padding: "1px 5px", borderRadius: 3, margin: "0 4px" }}>page.tsx</code>
              advertises matching variants so each crawler picks the right size.
            </p>
          </header>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
            gap: 20,
            alignItems: "start",
          }}>
            <EmbedSection
              label="iMessage"
              dims="1.91:1 · 1200×630 served"
              notes="Rich link preview in chat. Black bubble, image at top, title + domain stacked beneath."
            >
              <IMessageEmbed />
            </EmbedSection>

            <EmbedSection
              label="Slack"
              dims="1.91:1 · unfurl"
              notes="Inline unfurl with team-colored accent bar, title, description excerpt, and inline image."
            >
              <SlackEmbed />
            </EmbedSection>

            <EmbedSection
              label="Twitter / X"
              dims="16:9 · 1200×675"
              notes="summary_large_image card. Image dominates; title and description below."
            >
              <TwitterEmbed />
            </EmbedSection>

            <EmbedSection
              label="Facebook"
              dims="1.91:1 · 1200×630"
              notes="Wide hero image with grey footer showing domain, title, and a single line of description."
            >
              <FacebookEmbed />
            </EmbedSection>

            <EmbedSection
              label="LinkedIn"
              dims="1.91:1 · 1200×630"
              notes="Image + light-blue footer with title and reading time. Compact, professional tone."
            >
              <LinkedInEmbed />
            </EmbedSection>

            <EmbedSection
              label="Instagram"
              dims="1:1 · 1080×1080"
              notes="DM / share-sheet preview is square. Title underneath; description usually trimmed."
            >
              <InstagramEmbed />
            </EmbedSection>

            <EmbedSection
              label="Pinterest"
              dims="9:16 · 1080×1920"
              notes="Pin-shaped portrait crop. Tall format keeps the photo dominant on a vertical feed."
            >
              <PinterestEmbed />
            </EmbedSection>
          </div>
        </div>
      </main>
    </>
  );
}
