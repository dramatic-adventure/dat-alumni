import type { CSSProperties, ReactNode } from "react";

/* ====== Aesthetic constants ====== */
export const COLOR = {
  ink: "#241123",
  brand: "#6C00AF",
  gold: "#D9A919",
  teal: "#2493A9",
  red: "#F23359",
  snow: "#F2F2F2",
};

export const subheadChipStyle: CSSProperties = {
  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
  fontSize: "2rem",
  fontWeight: 600,
  letterSpacing: ".5px",
  color: COLOR.gold,
  display: "inline-block",
  margin: "0 0 1rem",
  backgroundColor: COLOR.ink,
  opacity: 0.7,
  padding: "0.1em 0.6em",
  borderRadius: "0.35em",
  textDecoration: "none",
};

export const explainStyleLocal: CSSProperties = {
  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
  fontSize: 15,
  lineHeight: 1.55,
  color: COLOR.snow,
  opacity: 0.95,
  margin: "0 0 14px",
};

export const explainStyleLight: CSSProperties = {
  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
  fontSize: 15,
  lineHeight: 1.55,
  color: COLOR.ink,
  opacity: 0.75,
  margin: "0 0 14px",
};

export const labelStyle: CSSProperties = {
  display: "block",
  marginBottom: 8,
  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
  fontSize: 13,
  color: COLOR.snow,
  opacity: 0.9,
};

export const inputStyle: CSSProperties = {
  width: "100%",
  borderRadius: 10,
  padding: "12px 14px",
  outline: "none",
  border: "none",
  background: "#f2f2f2",
  color: "#241123",
  boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
};

export const inputLockedStyle: CSSProperties = {
  ...inputStyle,
  opacity: 0.65,
  cursor: "not-allowed",
};

export const datButtonLocal: CSSProperties = {
  borderRadius: 14,
  padding: "12px 16px",
  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
  fontWeight: 500,
  fontSize: "0.9rem",
  textTransform: "uppercase",
  letterSpacing: "0.2em",
  background: COLOR.teal,
  color: COLOR.snow,
  border: "1px solid rgba(0,0,0,0.22)",
  boxShadow: "0 10px 26px rgba(0,0,0,0.22)",
  cursor: "pointer",
  transform: "translateZ(0)",
};

export const datButtonGhost: CSSProperties = {
  borderRadius: 14,
  padding: "10px 14px",
  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
  fontWeight: 700,
  letterSpacing: "0.03em",
  background: "transparent",
  color: "#f2f2f2",
  border: "1px solid rgba(255,255,255,0.65)",
  boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
  cursor: "pointer",
};

/**
 * Optional: keep this type here so other extracted UI pieces can share it.
 * If nothing imports it, you can delete it later.
 */
export type SectionProps = { children?: ReactNode };
