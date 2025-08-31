"use client";

import React from "react";

interface ProfileShowcaseSectionProps {
  children: React.ReactNode;
}

export default function ProfileShowcaseSection({ children }: ProfileShowcaseSectionProps) {
  return (
    <div
      style={{
        display: "flex",
        gap: "2rem",
        justifyContent: "center",
        alignItems: "flex-start", // ⬅️ FIX: align children at the top
        flexWrap: "wrap",
        margin: "2rem 0",
      }}
    >
      {React.Children.map(children, (child) =>
        child ? (
          <div
            style={{
              flex: "1 1 300px",
              maxWidth: "1020px",
              minWidth: "290px",
              display: "flex",
              flexDirection: "column",
              alignSelf: "flex-start", // ⬅️ FIX: enforce top alignment per card
            }}
          >
            {child}
          </div>
        ) : null
      )}
    </div>
  );
}
