// app/journey-card-mockup/v14/alumni-index/MockupChrome.tsx
// ⚠️  MOCKUP ONLY — shared review-chrome banner for the alumni-index pages.

"use client";

import { A } from "./sampleJourneys";

type ActiveTab =
  | "index"
  | "option-a-index"
  | "option-b-inline"
  | "option-c-stack";

const TABS: { id: ActiveTab; label: string; href: string }[] = [
  { id: "index",            label: "Overview",     href: "/journey-card-mockup/v14/alumni-index" },
  { id: "option-a-index",   label: "A · Index",    href: "/journey-card-mockup/v14/alumni-index/option-a-index" },
  { id: "option-b-inline",  label: "B · Inline",   href: "/journey-card-mockup/v14/alumni-index/option-b-inline" },
  { id: "option-c-stack",   label: "C · Stack",    href: "/journey-card-mockup/v14/alumni-index/option-c-stack" },
];

export default function MockupChrome({ active }: { active: ActiveTab }) {
  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 200,
      backgroundColor: A.yellow,
      padding: "0.4rem 1.25rem",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: "0.75rem", flexWrap: "wrap",
      boxShadow: "0 2px 6px rgba(0,0,0,0.10)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
        <span style={{
          fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
          fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.2em",
          textTransform: "uppercase",
          backgroundColor: A.ink, color: A.yellow,
          padding: "0.18em 0.55em", borderRadius: "3px",
        }}>⚠ MOCKUP</span>
        <span style={{
          fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
          fontSize: "0.75rem", color: A.ink, opacity: 0.65,
        }}>
          V14 · alumni-index treatments — how multiple journey cards live on /alumni/[slug]
        </span>
      </div>
      <nav style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
        <a href="/journey-card-mockup/v14" style={chip(false)}>← v14</a>
        {TABS.map((t) => (
          <a key={t.id} href={t.href} style={chip(active === t.id)}>{t.label}</a>
        ))}
      </nav>
    </div>
  );
}

function chip(isActive: boolean): React.CSSProperties {
  return {
    fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
    fontSize: "0.58rem", fontWeight: 600, letterSpacing: "0.08em",
    textTransform: "uppercase", color: A.ink, textDecoration: "none",
    padding: "0.18rem 0.5rem", borderRadius: "3px",
    backgroundColor: isActive ? "rgba(36,17,35,0.18)" : "rgba(36,17,35,0.09)",
  };
}
