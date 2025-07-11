// components/alumni/ContactTab.tsx

"use client";

import React from "react";

export interface ContactTabProps {
  email?: string;
  website?: string;
  socials?: string[];
  onClick?: () => void; // ✅ Added click handler prop
}

export default function ContactTab({
  email,
  website,
  socials = [],
  onClick,
}: ContactTabProps) {
  const hasContactInfo = Boolean(email || website || socials.length > 0);
  if (!hasContactInfo) return null;

  return (
    <div
      role="button"
      aria-label="Toggle contact panel"
      tabIndex={0}
      onClick={onClick} // ✅ Attach click handler
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      className="text-white font-bold select-none"
      style={{
        writingMode: "vertical-lr",
        textOrientation: "mixed",
        backgroundColor: "#E2725B",
        height: "160px",
        width: "48px",
        borderTopRightRadius: "12px",
        borderBottomRightRadius: "12px",
        boxShadow: "1px 2px 4px rgba(0,0,0,0.15)",
        fontFamily: "Space Grotesk, sans-serif",
        fontSize: "1.1rem",
        letterSpacing: "0.2rem",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      CONTACT
    </div>
  );
}
