// components/field-kit/adminStyles.ts
//
// Shared style objects for the staff console (AdminConsole + the Slice 5
// AdminOps sections) — extracted verbatim from AdminConsole.tsx so the new
// Roll Call / Company Choice sections render identically without duplicating
// style literals.

import type { CSSProperties } from "react";
import { T, FONT } from "@/components/field-kit/tokens";

export const label: CSSProperties = {
  display: "block",
  fontFamily: FONT.grotesk,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: T.muted,
  margin: "0 0 5px",
};

export const field: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  fontFamily: FONT.dm,
  fontSize: 14.5,
  color: T.ink,
  background: T.bg,
  border: `1px solid ${T.border}`,
  borderRadius: 9,
  padding: "10px 12px",
  marginBottom: 12,
};

export const primaryBtn: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  width: "100%",
  fontFamily: FONT.grotesk,
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: T.black,
  background: T.yellow,
  border: "none",
  borderRadius: 9,
  padding: "12px 16px",
  cursor: "pointer",
};

export const smallBtn: CSSProperties = {
  fontFamily: FONT.grotesk,
  fontSize: 9.5,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: T.ink,
  background: "transparent",
  border: `1px solid ${T.border}`,
  borderRadius: 7,
  padding: "5px 9px",
  cursor: "pointer",
};

export const card: CSSProperties = {
  background: T.card,
  border: `1px solid ${T.border}`,
  borderRadius: 14,
  padding: "16px 16px 18px",
  marginBottom: 16,
};

export const sectionTitle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontFamily: FONT.anton,
  fontSize: 18,
  textTransform: "uppercase",
  color: T.ink,
  margin: "0 0 4px",
};

export const sectionHint: CSSProperties = {
  fontFamily: FONT.dm,
  fontSize: 12.5,
  lineHeight: 1.45,
  color: T.muted,
  margin: "0 0 14px",
};
