"use client";

import type { CSSProperties } from "react";

import Dropzone from "@/components/media/Dropzone";
import BackgroundSwatches from "@/components/alumni/update/BackgroundSwatches";
import ProfileStudio, {
  Field,
  ghostButton as studioGhostButton,
} from "@/components/alumni/update/ProfileStudio";

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
  datButtonGhost,
  datButtonLocal,
  COLOR,

  loading,
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

  toast, // (msg, type?) => void
  openPicker, // (kind) => void
  onSave, // async () => void
}: {
  explainStyleLocal: CSSProperties;
  subheadChipStyle: CSSProperties;
  labelStyle: CSSProperties;
  inputStyle: CSSProperties;
  inputLockedStyle: CSSProperties;
  datButtonGhost: CSSProperties;
  datButtonLocal: CSSProperties;
  COLOR: { ink: string; brand: string; gold: string; teal: string; red: string; snow: string };

  loading: boolean;
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

  toast: (msg: string, type?: "success" | "error") => void;
  openPicker: (kind: "headshot" | "album" | "reel" | "event") => void;
  onSave: () => Promise<void>;
}) {
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

        <p style={explainStyleLocal} className="explain">
          Your professional name and slug are locked by default. If your professional name
          changed, unlock it and your slug preview will update automatically.
        </p>

        <div>
          <label htmlFor="slug" style={labelStyle}>
            Profile slug
          </label>
          <input id="slug" value={currentSlug} readOnly style={inputLockedStyle} />
          <p style={{ ...explainStyleLocal, marginTop: 6 }} className="explain">
            {autoDetected
              ? "We auto-detected your current slug from Profile-Live."
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
                style={datButtonGhost}
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
          <label style={{ fontWeight: 700 }}>
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
            Bi-coastal
          </label>

          {isCheckedTrue(profile?.isBiCoastal) ? (
            <div style={{ marginTop: 12 }}>
              <label style={labelStyle}>Second location</label>
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

      {/* Headshot actions (URL + library + upload) */}
      <div
        style={{
          marginTop: 16,
          paddingTop: 14,
          borderTop: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <div style={{ display: "grid", gap: 12 }}>
          <Field
            label="Headshot URL (optional)"
            help="If you paste a URL, it should point directly to the image file (not a webpage)."
          >
            <input
              value={profile?.currentHeadshotUrl || ""}
              onChange={(e) =>
                setProfile((p: any) => ({ ...p, currentHeadshotUrl: e.target.value }))
              }
              style={inputStyle}
              placeholder="https://... (direct image URL)"
            />
          </Field>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              style={studioGhostButton}
              onClick={() => openPicker("headshot")}
              disabled={loading}
            >
              Choose past headshot
            </button>
            <button
              type="button"
              style={studioGhostButton}
              onClick={() => openPicker("album")}
              disabled={loading}
            >
              Open library
            </button>
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <Dropzone
              accept="image/*"
              multiple={false}
              disabled={loading}
              label="Add a headshot"
              sublabel="or drag & drop here"
              onFiles={(files) => setHeadshotFile(files[0] || null)}
              onReject={(rej) => toast(rej[0]?.reason || "File rejected", "error")}
            />

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
                </div>

                <button
                  type="button"
                  className="dat-btn-ghost"
                  style={datButtonGhost}
                  onClick={() => setHeadshotFile(null)}
                  disabled={loading}
                >
                  Clear
                </button>
              </div>
            ) : null}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <button type="button" style={datButtonLocal} disabled={loading} onClick={onSave}>
                Save Profile Basics
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* (keep the same background palette you had available) */}
      <p style={{ ...explainStyleLocal, marginTop: 10, opacity: 0.85, color: COLOR.snow }}>
        Tip: Uploading a headshot here will set it as your featured headshot when you save.
      </p>
    </div>
  );
}
