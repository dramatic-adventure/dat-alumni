"use client";

import Dropzone from "@/components/media/Dropzone";

type Target = "auto" | "headshot" | "album" | "reel" | "event";

type Props = {
  onRouteFiles: (target: Target, files: File[]) => void;
  counts: { headshot: number; album: number; reel: number; event: number };
  onUploadAll?: () => void;         // will call your existing saveCategory({ uploadKinds:[...] })
  uploading?: boolean;
};

const CHIP: Array<{ key: Target; label: string }> = [
  { key: "auto", label: "Auto" },
  { key: "headshot", label: "Headshot" },
  { key: "album", label: "Gallery" },
  { key: "reel", label: "Reels" },
  { key: "event", label: "Events" },
];

export default function UploaderDock({
  onRouteFiles,
  counts,
  onUploadAll,
  uploading,
}: Props) {
  return (
    <div
      className="uploader-dock"
      style={{
        background: "rgba(36, 17, 35, 0.28)",
        borderRadius: 16,
        padding: "1.2rem",
        color: "#F2F2F2",
        boxShadow: "0 12px 36px rgba(0,0,0,0.24)",
      }}
    >
      {/* Target chips */}
      <TargetChips onRouteFiles={onRouteFiles} />

      {/* Single Drop area */}
      <div style={{ marginTop: 12 }}>
        <Dropzone
          accept="image/*,video/*,application/pdf"
          multiple
          label="Drop files here or browse"
          aria-label="Universal uploader"
          onFiles={(files) => onRouteFiles(currentTarget(), files)}
        />
      </div>

      {/* Queue summary + Upload All */}
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 10,
          flexWrap: "wrap",
          fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
          fontSize: 13,
          opacity: 0.92,
        }}
      >
        <div>
          <strong>Staged:</strong>&nbsp;
          {counts.headshot} headshot,&nbsp;
          {counts.album} gallery,&nbsp;
          {counts.reel} reels,&nbsp;
          {counts.event} events
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={onUploadAll}
            disabled={uploading}
            className="dock-ghost"
          >
            {uploading ? "Uploading…" : "Upload All"}
          </button>
        </div>
      </div>

      <style jsx>{`
        .dock-ghost {
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.35);
          padding: 10px 14px;
          font-family: var(--font-dm-sans), system-ui, sans-serif;          font-size: 14px;
          color: #f2f2f2;
          background: transparent;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}

/** Target chips with minimal global state via DOM data attr */
function TargetChips({
  onRouteFiles,
}: {
  onRouteFiles: (target: Target, files: File[]) => void;
}) {
  const chipsContainerId = "uploader-target-chips";

  function setTarget(t: Target) {
    const el = document.getElementById(chipsContainerId);
    if (!el) return;
    el.dataset.target = t;
    // focus cue is visual; nothing else to do
  }

  return (
    <div id={chipsContainerId} data-target="auto" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {CHIP.map((c) => (
        <button
          type="button"
          key={c.key}
          className="chip"
          onClick={() => setTarget(c.key)}
          aria-pressed={currentTarget() === c.key}
          data-chip={c.key}
        >
          {c.label}
        </button>
      ))}

      <style jsx>{`
        .chip {
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.28);
          padding: 8px 12px;
          font-family: var(--font-space-grotesk), system-ui, sans-serif;          font-size: 13px;
          color: #f2f2f2;
          background: rgba(0, 0, 0, 0.18);
          cursor: pointer;
          transition: transform 0.15s ease, background 0.15s ease;
        }
        .chip[aria-pressed="true"] {
          background: rgba(217, 169, 25, 0.25);
          border-color: rgba(217, 169, 25, 0.6);
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}

/** tiny helper kept global to avoid prop-drilling state */
function currentTarget(): Target {
  const el = document.getElementById("uploader-target-chips");
  const t = (el?.dataset?.target || "auto") as Target;
  return t;
}
