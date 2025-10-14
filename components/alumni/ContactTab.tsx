// components/alumni/ContactTab.tsx

"use client";

import React from "react";

export interface ContactTabProps {
  email?: string;
  website?: string;
  socials?: string[];
  onClick?: React.MouseEventHandler;
  onMouseDown?: React.MouseEventHandler;
  isOpen?: boolean;
}

export default function ContactTab({
  email,
  website,
  socials = [],
  onClick,
  onMouseDown,
  isOpen = false,
}: ContactTabProps) {
  return (
    <button
      onClick={onClick}
      onMouseDown={onMouseDown}
      aria-label="Open or close contact panel"
      className="select-none transition-opacity duration-200 hover:opacity-80"
      style={{
        color: "#7c312f",
        fontWeight: 600,
        writingMode: "vertical-lr",
        textOrientation: "mixed",
        backgroundColor: "#E2725B",
        height: "160px",
        width: "48px",
        border: "none",
        borderTopRightRadius: "12px",
        borderBottomRightRadius: "12px",
        fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
        fontSize: "1.1rem",
        letterSpacing: "0.125rem",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: isOpen
          ? "4px 6px 8px rgba(0, 0, 0, 0.3), 0 2px 1px rgba(0, 0, 0, 0.2)"
          : "4px 6px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.1), inset 6px 0 6px -6px rgba(0, 0, 0, 0.25)",
      }}
    >
      CONTACT
    </button>
  );
}
