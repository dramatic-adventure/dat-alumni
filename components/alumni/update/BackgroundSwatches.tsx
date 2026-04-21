import React from "react";

type Props = {
  value: string;
  onChange: (next: string) => void;
};

const OPTIONS: { key: string; label: string; swatch: string }[] = [
  { key: "kraft", label: "Kraft Paper", swatch: "#D8C2A7" },
  { key: "leather", label: "Leather", swatch: "#5C3829" },
];

export default function BackgroundSwatches({ value, onChange }: Props) {
  return (
    <div>
      <div
        style={{
          fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
          fontSize: 13,
          color: "#F2F2F2",
          opacity: 0.9,
          marginBottom: 8,
        }}
      >
        Background Textures
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {OPTIONS.map((opt) => {
          const active = value === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => onChange(opt.key)}
              aria-pressed={active}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                border: "none",
                background: active ? "rgba(255,255,255,0.18)" : "transparent",
                padding: "8px 10px",
                borderRadius: 12,
                cursor: "pointer",
                color: "#F2F2F2",
                fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                fontSize: 14,
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  background: opt.swatch,
                  boxShadow:
                    "inset 0 0 0 2px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.18)",
                }}
              />
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
