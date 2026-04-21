"use client";

import { useState, type CSSProperties } from "react";

import Dropzone from "@/components/media/Dropzone";
import BackgroundSwatches from "@/components/alumni/update/BackgroundSwatches";
import {
  ghostButton as studioGhostButton,
} from "@/components/alumni/update/ProfileStudio";
import HeadshotChooser from "@/app/alumni/update/studio/HeadshotChooser";

function isCheckedTrue(v: any) {
  const s = String(v ?? "").trim().toLowerCase();
  return s === "true" || s === "1" || s === "yes" || v === true;
}

export default function BasicsTab({
  explainStyleLocal,
  subheadChipStyle,
  labelStyle,
  inputStyle,
  inputLockedStyle,
  datButtonLocal,
  COLOR,

  loading,
  isDirty = false,
  autoDetected,
  currentSlug,

  name,
  setName,
  nameLocked,
  setNameLocked,

  location,
  setLocation,

  profile,
  setProfile,

  headshotFile,
  setHeadshotFile,
  headshotPreviewUrl,
  extraHeadshotFiles = [],
  onExtraHeadshotFiles,

  toast,
  openPicker,
  onSave,
  savedRecently = false,
  alumniId,
  onHeadshotFeatured,
}: {
  explainStyleLocal: CSSProperties;
  subheadChipStyle: CSSProperties;
  labelStyle: CSSProperties;
  inputStyle: CSSProperties;
  inputLockedStyle: CSSProperties;
  datButtonLocal: CSSProperties;
  COLOR: { ink: string; brand: string; gold: string; teal: string; red: string; snow: string };

  loading: boolean;
  isDirty?: boolean;
  autoDetected: boolean;
  currentSlug: string;

  name: string;
  setName: (v: string) => void;
  nameLocked: boolean;
  setNameLocked: (fn: (prev: boolean) => boolean) => void;

  location: string;
  setLocation: (v: string) => void;

  profile: any;
  setProfile: (fn: any) => void;

  headshotFile: File | null;
  setHeadshotFile: (f: File | null) => void;
  headshotPreviewUrl: string;
  extraHeadshotFiles?: File[];
  onExtraHeadshotFiles?: (files: File[]) => void;

  toast: (msg: string, type?: "success" | "error") => void;
  openPicker: (kind: "headshot" | "album" | "reel" | "event") => void;
  onSave: (headshotUrl?: string) => Promise<boolean | void>;
  savedRecently?: boolean;
  alumniId?: string;
  onHeadshotFeatured?: (fileId: string) => void;
}) {
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [headshotUrlInput, setHeadshotUrlInput] = useState("");
  const [showHeadshotChooser, setShowHeadshotChooser] = useState(false);

  const storedHeadshotId = String(profile?.currentHeadshotId || "").trim();
  const storedHeadshotUrl = String(profile?.currentHeadshotUrl || "").trim();
  // Prefer ID-based thumbnail (reflects picker selection); fall back to direct URL
  const currentHeadshotDisplayUrl = storedHeadshotId
    ? `/api/media/thumb/${encodeURIComponent(storedHeadshotId)}?w=200`
    : storedHeadshotUrl;

  return (
    <div>
      <div id="studio-basics-anchor" />
      <p style={explainStyleLocal}>
        Start here. Confirm your headline profile details — and set your headshot.
      </p>

      <div style={{ display: "grid", gap: 14 }}>
        <span style={subheadChipStyle} className="subhead-chip">
          Profile Basics
        </span>

        <p style={{ ...explainStyleLocal, opacity: 0.65, fontSize: "0.8rem" }} className="explain">
          Your professional name and slug are locked by default. If your professional name
          changed, unlock it and your slug preview will update automatically.
        </p>

        <div>
          <label htmlFor="slug" style={labelStyle}>
            Profile slug
          </label>
          <input id="slug" value={currentSlug} readOnly style={inputLockedStyle} />
          <p style={{ ...explainStyleLocal, marginTop: 6, opacity: 0.5, fontSize: "0.78rem" }} className="explain">
            {autoDetected
              ? "Auto-detected from Profile-Live."
              : "Your slug mirrors your professional name."}
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 24,
            marginTop: 12,
          }}
        >
          <div>
            <label htmlFor="name" style={labelStyle}>
              Professional name
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12 }}>
              <input
                id="name"
                value={name}
                onChange={(e) => {
                  const v = e.target.value;
                  setName(v);
                  setProfile((p: any) => ({ ...p, name: v }));
                }}
                style={nameLocked ? inputLockedStyle : inputStyle}
                disabled={nameLocked}
              />
              <button
                type="button"
                className="dat-btn-ghost"
                style={studioGhostButton}
                onClick={() => setNameLocked((x) => !x)}
              >
                {nameLocked ? "My professional name changed" : "Lock name"}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="location" style={labelStyle}>
              Base
            </label>
            <input
              id="location"
              value={location}
              onChange={(e) => {
                const v = e.target.value;
                setLocation(v);
                setProfile((p: any) => ({ ...p, location: v }));
              }}
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <label style={{ fontWeight: 500, cursor: "pointer", fontSize: "0.9rem" }}>
            <input
              type="checkbox"
              checked={isCheckedTrue(profile?.isBiCoastal)}
              onChange={(e) =>
                setProfile((p: any) => ({
                  ...p,
                  isBiCoastal: e.target.checked ? "true" : "",
                }))
              }
              style={{ marginRight: 10 }}
            />
            Check here if you split your time between two cities (e.g. Los Angeles and New York City).
          </label>

          {isCheckedTrue(profile?.isBiCoastal) ? (
            <div style={{ marginTop: 12 }}>
              <label style={labelStyle}>Second city / location</label>
              <input
                value={profile?.secondLocation || ""}
                onChange={(e) =>
                  setProfile((p: any) => ({ ...p, secondLocation: e.target.value }))
                }
                style={inputStyle}
              />
            </div>
          ) : null}
        </div>

        <div style={{ marginTop: 18 }}>
          <BackgroundSwatches
            value={String(profile?.backgroundStyle || "kraft")}
            onChange={(next) => setProfile((p: any) => ({ ...p, backgroundStyle: next }))}
          />
        </div>

        <div style={{ marginTop: 18, display: "grid", gap: 12 }}>
          <div>
            <label style={labelStyle}>Bio / Artist Statement (public)</label>
            <textarea
              value={String(profile?.bioLong ?? "")}
              onChange={(e) => setProfile((p: any) => ({ ...p, bioLong: e.target.value }))}
              rows={10}
              style={{ ...inputStyle, minHeight: 220, resize: "vertical" }}
            />
          </div>
        </div>
      </div>

      {/* ── Headshot ──────────────────────────────────────────── */}
      <div
        style={{
          marginTop: 24,
          paddingTop: 16,
          borderTop: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <span style={subheadChipStyle} className="subhead-chip">
          Headshot
        </span>

        <div style={{ display: "grid", gap: 14 }}>
          {/* Current saved headshot (when no file is staged) */}
          {!headshotFile && currentHeadshotDisplayUrl ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "84px 1fr",
                gap: 12,
                alignItems: "center",
                padding: 10,
                border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: 12,
                background: "rgba(0,0,0,0.14)",
              }}
            >
              <div
                style={{
                  width: 84,
                  height: 84,
                  borderRadius: 12,
                  overflow: "hidden",
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.06)",
                  flexShrink: 0,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentHeadshotDisplayUrl}
                  alt="Current headshot"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, opacity: 0.85 }}>Current headshot</div>
                <div style={{ fontSize: 12, opacity: 0.5, marginTop: 2, color: "#d9d9d9" }}>
                  Upload a new file below, or use "Choose past headshot" to switch to a previous one.
                </div>
              </div>
            </div>
          ) : null}

          {/* Primary path: large drag-and-drop target */}
          <Dropzone
            accept="image/*"
            multiple={true}
            disabled={loading}
            label=""
            sublabel=""
            onFiles={(files) => {
              setHeadshotFile(files[0] || null);
              if (files.length > 1) onExtraHeadshotFiles?.(files.slice(1));
            }}
            onReject={(rej) => toast(rej[0]?.reason || "File rejected", "error")}
            style={{
              minHeight: 160,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "36px 24px",
              textAlign: "center",
              gap: 0,
            }}
          >
            <p style={{ margin: 0, fontWeight: 700, fontSize: 17, letterSpacing: "0.01em" }}>
              Upload a Headshot
            </p>
            <p style={{ margin: "10px 0 4px", fontWeight: 600, fontSize: 15, opacity: 0.85 }}>
              Drag &amp; Drop
            </p>
            <p style={{ margin: "0 0 8px", fontSize: 12, opacity: 0.5 }}>or</p>
            <p style={{ margin: 0, fontSize: 13, opacity: 0.75, textDecoration: "underline" }}>
              Click to Browse
            </p>
          </Dropzone>

          {/* Staged headshot preview */}
          {headshotFile ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "84px 1fr auto",
                gap: 12,
                alignItems: "center",
                padding: 10,
                border: "1px solid rgba(255,255,255,0.14)",
                borderRadius: 12,
                background: "rgba(0,0,0,0.18)",
              }}
            >
              <div
                style={{
                  width: 84,
                  height: 84,
                  borderRadius: 12,
                  overflow: "hidden",
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.06)",
                }}
              >
                {headshotPreviewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={headshotPreviewUrl}
                    alt="Staged headshot preview"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : null}
              </div>

              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, lineHeight: 1.2 }}>Staged headshot</div>
                <div
                  style={{
                    opacity: 0.8,
                    fontSize: 13,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {headshotFile.name} • {Math.round(headshotFile.size / 1024)} KB
                </div>
                <div style={{ opacity: 0.7, fontSize: 12, marginTop: 4 }}>
                  This will become your featured headshot when you save.
                </div>
                {extraHeadshotFiles.length > 0 && (
                  <div style={{ opacity: 0.7, fontSize: 12, marginTop: 4 }}>
                    + {extraHeadshotFiles.length} more file{extraHeadshotFiles.length > 1 ? "s" : ""} will also upload
                  </div>
                )}
              </div>

              <button
                type="button"
                className="dat-btn-ghost"
                style={studioGhostButton}
                onClick={() => { setHeadshotFile(null); onExtraHeadshotFiles?.([]); }}
                disabled={loading}
              >
                Clear
              </button>
            </div>
          ) : null}

          {/* Secondary actions row */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            {alumniId && (
              <button
                type="button"
                style={studioGhostButton}
                onClick={() => setShowHeadshotChooser((x) => !x)}
                disabled={loading}
              >
                {showHeadshotChooser ? "Hide past headshots" : "Choose past headshot"}
              </button>
            )}

            <button
              type="button"
              style={{
                ...studioGhostButton,
                opacity: 0.7,
                fontSize: "0.82rem",
              }}
              onClick={() => {
                setShowUrlInput((x) => !x);
                setHeadshotUrlInput("");
              }}
              disabled={loading}
            >
              {showUrlInput ? "Hide URL input" : "Use image URL instead"}
            </button>

            {/* Show "Use default" only when a headshot is currently selected */}
            {alumniId && (storedHeadshotId || storedHeadshotUrl || headshotFile) && (
              <button
                type="button"
                style={{
                  ...studioGhostButton,
                  opacity: 0.55,
                  fontSize: "0.78rem",
                }}
                onClick={() => {
                  setProfile((p: any) => ({ ...p, currentHeadshotId: "", currentHeadshotUrl: "" }));
                  setHeadshotFile(null);
                  setShowHeadshotChooser(false);
                  setShowUrlInput(false);
                  setHeadshotUrlInput("");
                }}
                disabled={loading}
              >
                Use default image
              </button>
            )}
          </div>

          {/* "Using default image" indicator — shown when no headshot is active */}
          {alumniId && !headshotFile && !storedHeadshotId && !storedHeadshotUrl && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.10)",
                fontSize: 13,
                opacity: 0.75,
                color: "#d9d9d9",
              }}
            >
              <div>No headshot set — your public profile will show the default image.</div>
              <div style={{ marginTop: 5, fontSize: 12, opacity: 0.75 }}>
                To use a real headshot: drag a file into the upload area above, paste a URL, or choose a past headshot.
              </div>
            </div>
          )}

          {/* Inline past-headshot chooser */}
          {showHeadshotChooser && alumniId && (
            <div
              style={{
                padding: "16px 0 8px",
                borderTop: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <HeadshotChooser
                alumniId={alumniId}
                loading={loading}
                profileHeadshotId={storedHeadshotId}
                profileHeadshotUrl={storedHeadshotUrl}
                onFeaturedUrl={(url) => {
                  setProfile((p: any) => ({
                    ...p,
                    currentHeadshotUrl: url,
                    currentHeadshotId: "",
                  }));
                  setHeadshotFile(null);
                }}
                onFeatured={(fileId) => {
                  setProfile((p: any) => ({
                    ...p,
                    currentHeadshotId: fileId,
                    currentHeadshotUrl: "",
                  }));
                  setHeadshotFile(null);
                }}
              />
            </div>
          )}

          {/* Collapsed URL input — starts blank; does NOT prefill the stored URL */}
          {showUrlInput ? (
            <div>
              <label style={labelStyle}>Image URL</label>
              <input
                value={headshotUrlInput}
                onChange={(e) => setHeadshotUrlInput(e.target.value)}
                style={inputStyle}
                placeholder="https://www.website.com/headshot.jpg"
              />
              <p style={{ ...explainStyleLocal, marginTop: 4, opacity: 0.6, fontSize: 12 }}>
                Paste a direct link to the image file (not a webpage).
              </p>
            </div>
          ) : null}

          <div
            style={{
              marginTop: 8,
              paddingTop: 18,
              borderTop: "1px solid rgba(255,255,255,0.10)",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 14,
              flexWrap: "wrap",
            }}
          >
            {isDirty && !savedRecently && (
              <span
                style={{
                  fontSize: 12,
                  opacity: 0.7,
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  color: "#f5c542",
                }}
              >
                <span style={{ fontSize: 8 }}>●</span> Unsaved changes
              </span>
            )}
            {savedRecently && (
              <span
                style={{
                  fontSize: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  color: "#6ee7b7",
                  opacity: 0.9,
                }}
              >
                <span style={{ fontSize: 10 }}>✓</span> Saved
              </span>
            )}
            <button
              type="button"
              style={{
                ...datButtonLocal,
                ...(savedRecently
                  ? { background: "rgba(52,211,153,0.25)", borderColor: "rgba(52,211,153,0.5)" }
                  : {}),
              }}
              disabled={loading}
              onClick={async () => {
                await onSave(headshotUrlInput.trim() || undefined);
                // Always close auxiliary panels after a save attempt — chooser and URL input
                // should never remain open after the user intentionally hit Save.
                setHeadshotUrlInput("");
                setShowUrlInput(false);
                setShowHeadshotChooser(false);
              }}
            >
              {savedRecently ? "Saved ✓" : "Save Profile Basics"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
