"use client";

import MediaCard from "./MediaCard";

type RailProps = {
  title: string;
  kind: "headshot" | "album" | "reel" | "event";
  files: File[];               // staged files for this rail
  onRemoveAt: (idx: number) => void;
  onOpenPicker?: () => void;
  onSetFeaturedAt?: (idx: number) => void;
};

export default function MediaRail({
  title,
  kind,
  files,
  onRemoveAt,
  onOpenPicker,
  onSetFeaturedAt,
}: RailProps) {
  return (
    <section style={{ marginTop: 24 }}>
      <div
        style={{
          fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
          fontSize: "1.2rem",
          color: "#f2f2f2",
          margin: "0 0 10px 6px",
          opacity: 0.9,
        }}
      >
        {title}
      </div>
      <div
        className="rail"
        style={{
          display: "flex",
          gap: 14,
          overflowX: "auto",
          padding: "12px 6px",
          scrollSnapType: "x mandatory",
        }}
      >
        {files.length === 0 && (
          <div
            style={{
              width: "100%",
              minWidth: 280,
              aspectRatio: "16/9",
              borderRadius: 16,
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
              display: "grid",
              placeItems: "center",
              color: "#fff",
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              opacity: 0.7,
            }}
          >
            No staged items — use the Uploader Dock
          </div>
        )}

        {files.map((f, i) => (
          <div key={i} style={{ scrollSnapAlign: "start" }}>
            <MediaCard
              file={f}
              kind={kind}
              label={f.name}
              onRemove={() => onRemoveAt(i)}
              onOpenPicker={onOpenPicker}
              onSetFeatured={onSetFeaturedAt ? () => onSetFeaturedAt(i) : undefined}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
