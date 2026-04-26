import React from "react";

type TextureOverlay = { color: string; opacity: number };

type TextureOption = {
  key: string;
  label: string;
  image: string;
  overlay?: TextureOverlay;
};

/**
 * Texture options for the Basics panel.
 * Kraft Paper is the default/global background — selecting it clears any
 * custom override (the save layer already treats "kraft" as the baseline).
 * Add new entries here to extend the texture picker without changing the UI.
 */
const OPTIONS: TextureOption[] = [
  { key: "kraft", label: "Kraft Paper", image: "/texture/kraft-paper.jpg" },
  {
    key: "leather",
    label: "Red Leather",
    image: "/texture/leather.webp",
    overlay: { color: "#241123", opacity: 0.15 },
  },
];

type Props = {
  value: string;
  onChange: (next: string) => void;
};

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
        Background Texture
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
                flexDirection: "column",
                alignItems: "center",
                gap: 7,
                border: active
                  ? "2px solid rgba(255,255,255,0.60)"
                  : "2px solid rgba(255,255,255,0.12)",
                background: active ? "rgba(255,255,255,0.10)" : "transparent",
                padding: "8px 10px",
                borderRadius: 12,
                cursor: "pointer",
                color: "#F2F2F2",
                fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                fontSize: 13,
              }}
            >
              {/* Real texture snippet — position:relative + overflow:hidden clips the image */}
              <span
                aria-hidden
                style={{
                  position: "relative",
                  display: "block",
                  width: 80,
                  height: 52,
                  borderRadius: 7,
                  overflow: "hidden",
                  backgroundImage: `url(${opt.image})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.32)",
                }}
              >
                {opt.overlay ? (
                  <span
                    aria-hidden
                    style={{
                      position: "absolute",
                      inset: 0,
                      backgroundColor: opt.overlay.color,
                      opacity: opt.overlay.opacity,
                    }}
                  />
                ) : null}
              </span>
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
