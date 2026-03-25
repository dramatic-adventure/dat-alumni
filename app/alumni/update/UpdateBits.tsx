"use client";

import type { ReactNode } from "react";
import { COLOR } from "./updateStyles";

export function Section({ children }: { children?: ReactNode }) {
  return (
    <div
      style={{
        textAlign: "left",
        marginBottom: "3rem",
        background: "rgba(36, 17, 35, 0.22)",
        borderRadius: 10,
        padding: "2rem",
        color: COLOR.snow,
      }}
    >
      {children}
    </div>
  );
}

export function ProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, Math.round(value || 0)));
  return (
    <div
      style={{
        width: "100%",
        height: 8,
        borderRadius: 999,
        background: "rgba(255,255,255,0.18)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          borderRadius: 999,
          transition: "width .25s ease",
          background: `linear-gradient(90deg, ${COLOR.gold}, ${COLOR.brand})`,
        }}
      />
    </div>
  );
}
