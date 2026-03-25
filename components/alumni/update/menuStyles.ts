import type { CSSProperties } from "react";

export const MENU_COLORS = {
  ink: "#241123",
  snow: "#F2F2F2",
  brand: "#6C00AF",
};

export const actionMenuStyle: CSSProperties = {
  position: "absolute",
  top: "calc(100% + 8px)",
  right: 0,
  minWidth: 180,
  borderRadius: 14,
  padding: 8,
  background: "#f2f2f2",
  border: "1px solid rgba(36,17,35,0.14)",
  boxShadow: "0 14px 40px rgba(0,0,0,0.14)",
  zIndex: 9999,
};

export const actionItemStyle: CSSProperties = {
  width: "100%",
  textAlign: "left",
  border: "0px",
  background: "transparent",
  color: MENU_COLORS.ink,
  borderRadius: 12,
  padding: "10px 12px",
  cursor: "pointer",
  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
  fontSize: 14,
  fontWeight: 700,
  transition: "background 120ms ease, transform 120ms ease, filter 120ms ease",
};

/** Variant that matches your “brand action” look */
export const actionItemBrandStyle: CSSProperties = {
  ...actionItemStyle,
  color: MENU_COLORS.brand,
  fontWeight: 800,
};
