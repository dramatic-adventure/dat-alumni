// components/alumni/ContactTab.tsx

"use client";

import React from "react";

export interface ContactTabProps {
  email?: string;
  website?: string;
  socials?: string[];
  onClick?: React.MouseEventHandler;
  isOpen?: boolean;
}

export default function ContactTab({
  email,
  website,
  socials = [],
  onClick,
  isOpen = false,
}: ContactTabProps) {
  const hasContactInfo = Boolean(email || website || socials.length > 0);
  if (!hasContactInfo) return null;

  return (
    <button
      onClick={onClick}
      aria-label="Open or close contact panel"
      className="select-none"
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
        fontFamily: "Space Grotesk, sans-serif",
        fontSize: "1.1rem",
        letterSpacing: "0.125rem",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: isOpen
          ? "4px 0 8px rgba(0, 0, 0, 0.25), 0 4px 6px rgba(0, 0, 0, 0.15)"
          : "2px 0 6px rgba(0, 0, 0, 0.2), 0 2px 4px rgba(0, 0, 0, 0.1), inset 6px 0 6px -6px rgba(0, 0, 0, 0.25)",
      }}
    >
      CONTACT
    </button>
  );
}
