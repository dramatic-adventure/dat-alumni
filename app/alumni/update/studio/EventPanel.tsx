"use client";

import type { ReactNode } from "react";
import { useState, useEffect, useRef } from "react";

type UploadKind = "headshot" | "album" | "reel" | "event";

const EVENT_MEDIA_KEYS = [
  "featuredEventId",
  "upcomingEventMediaType",
  "upcomingEventMediaUrl",
  "upcomingEventMediaAlt",
  "upcomingEventVideoAutoplay",
] as const;

export default function EventPanel(props: {
  loading: boolean;

  // styles
  explainStyleLocal: any;
  datButtonLocal: any;

  // profile state
  profile: any;
  setProfile: (updater: any) => void;

  // rendering helpers
  renderFieldsOrNull: (keys: string[]) => ReactNode;
  eventEditKeys: string[];

  // save
  saveCategory: (args: {
    tag: string;
    fieldKeys?: string[];
    uploadKinds?: UploadKind[];
    afterSave?: () => void;
    profileOverride?: any;
  }) => void;
  eventFieldKeys: string[];

  // media upload
  eventFile?: File | null;
  onEventFileChange?: (f: File | null) => void;

  // optional fallback (keeps your current inline fallback component intact)
  manualFallback?: ReactNode;

  savedRecently?: boolean;
  onSaved?: () => void;
}) {
  const {
    loading,
    explainStyleLocal,
    datButtonLocal,
    profile,
    setProfile,
    renderFieldsOrNull,
    eventEditKeys,
    saveCategory,
    eventFieldKeys,
    eventFile,
    onEventFileChange,
    manualFallback,
    savedRecently = false,
    onSaved,
  } = props;

  const [mediaPreviewUrl, setMediaPreviewUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!eventFile) { setMediaPreviewUrl(""); return; }
    const url = URL.createObjectURL(eventFile);
    setMediaPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [eventFile]);

  const eventTitle = String(profile?.upcomingEventTitle || "").trim();
  const eventLink  = String(profile?.upcomingEventLink  || "").trim();

  const mediaType        = String(profile?.upcomingEventMediaType      || "").trim();
  const mediaUrl         = String(profile?.upcomingEventMediaUrl        || "").trim();
  const mediaAlt         = String(profile?.upcomingEventMediaAlt        || "").trim();
  const videoAutoplay    = String(profile?.upcomingEventVideoAutoplay   || "").trim();
  const storedFileId     = String(profile?.featuredEventId              || "").trim();

  const hasStoredMedia = Boolean(storedFileId || mediaUrl);
  const hasStagedFile  = Boolean(eventFile);

  // thumbnail for already-saved file
  const storedThumbUrl = storedFileId
    ? `/api/media/thumb/${encodeURIComponent(storedFileId)}?w=200`
    : "";

  const mailtoHref = (() => {
    const subject = encodeURIComponent(
      eventTitle ? `DAT Promotion Request: ${eventTitle}` : "DAT Promotion Request"
    );
    const bodyLines = [
      "Hi DAT team,",
      "",
      "I'd like to request consideration for broader promotion of my upcoming event.",
      "",
      eventTitle ? `Event: ${eventTitle}` : "",
      eventLink  ? `Link: ${eventLink}`   : "",
      "",
      "A bit about why this might align with DAT's mission:",
      "",
      "(Please share how this project connects to adventurous storytelling, community engagement, cross-cultural exchange, or alumni collaboration.)",
      "",
      "Thank you,",
    ]
      .filter((l) => l !== undefined)
      .join("\n");
    return `mailto:hello@dramaticadventure.com?subject=${subject}&body=${encodeURIComponent(bodyLines)}`;
  })();

  function handleFileSelect(files: FileList | null) {
    if (!files?.length) return;
    onEventFileChange?.(files[0]);
  }

  function clearMedia() {
    onEventFileChange?.(null);
    setProfile((p: any) => ({
      ...p,
      featuredEventId: "",
      upcomingEventMediaType: "",
      upcomingEventMediaUrl: "",
      upcomingEventMediaAlt: "",
      upcomingEventVideoAutoplay: "",
    }));
  }

  const fieldRowStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    marginBottom: 12,
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 11.5,
    fontWeight: 600,
    color: "rgba(255,255,255,0.7)",
    letterSpacing: "0.01em",
  };
  const inputStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: 6,
    padding: "6px 10px",
    fontSize: 13,
    color: "rgba(255,255,255,0.88)",
    width: "100%",
    boxSizing: "border-box",
    outline: "none",
  };

  return (
    <div>
      <div id="studio-event-anchor" />

      <h3
        style={{
          margin: "0 0 6px",
          fontSize: 15,
          fontWeight: 600,
          color: "rgba(255,255,255,0.92)",
          letterSpacing: "-0.01em",
        }}
      >
        Share an Upcoming Event
      </h3>

      <p style={{ ...explainStyleLocal, margin: "0 0 4px" }}>
        Let alumni and DAT&apos;s wider audience know where they can experience your work next.
      </p>
      <p style={{ ...explainStyleLocal, margin: "0 0 18px", opacity: 0.65 }}>
        This powers the <strong style={{ color: "rgba(255,255,255,0.75)" }}>Coming Up</strong>{" "}
        section on your public profile. The event disappears automatically once the event date or
        expiration date passes.
      </p>

      {renderFieldsOrNull(eventEditKeys) ?? manualFallback ?? null}

      {/* ── Event media ─────────────────────────────────────────────── */}
      <div
        style={{
          marginTop: 20,
          padding: "14px 16px",
          borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(255,255,255,0.03)",
        }}
      >
        <p
          style={{
            margin: "0 0 12px",
            fontSize: 13,
            fontWeight: 600,
            color: "rgba(255,255,255,0.85)",
          }}
        >
          Event Media <span style={{ fontWeight: 400, opacity: 0.5, fontSize: 11.5 }}>(optional)</span>
        </p>

        {/* Media type toggle */}
        <div style={{ ...fieldRowStyle, marginBottom: 14 }}>
          <span style={labelStyle}>Type</span>
          <div style={{ display: "flex", gap: 8 }}>
            {(["image", "video"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setProfile((p: any) => ({ ...p, upcomingEventMediaType: t }))}
                style={{
                  padding: "5px 14px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 600,
                  border: mediaType === t
                    ? "1px solid rgba(196,163,90,0.8)"
                    : "1px solid rgba(255,255,255,0.15)",
                  background: mediaType === t
                    ? "rgba(196,163,90,0.18)"
                    : "rgba(255,255,255,0.05)",
                  color: mediaType === t
                    ? "#C4A35A"
                    : "rgba(255,255,255,0.55)",
                  cursor: "pointer",
                  textTransform: "capitalize",
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Paste URL */}
        <div style={fieldRowStyle}>
          <label style={labelStyle}>Paste URL</label>
          <input
            type="url"
            value={mediaUrl}
            onChange={(e) => setProfile((p: any) => ({ ...p, upcomingEventMediaUrl: e.target.value }))}
            placeholder={mediaType === "video" ? "https://…  (mp4, mov, or streaming URL)" : "https://…  (jpg, png, webp, gif)"}
            style={inputStyle}
          />
        </div>

        {/* Upload file */}
        <div style={{ ...fieldRowStyle, marginBottom: 14 }}>
          <span style={labelStyle}>Or upload a file</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime"
            style={{ display: "none" }}
            onChange={(e) => handleFileSelect(e.target.files)}
          />

          {/* Staged file preview */}
          {hasStagedFile && mediaPreviewUrl && (
            <div style={{ marginBottom: 8, position: "relative", display: "inline-block" }}>
              {eventFile?.type.startsWith("video/") ? (
                <video
                  src={mediaPreviewUrl}
                  style={{ height: 80, borderRadius: 6, display: "block", background: "#000" }}
                  muted
                  playsInline
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mediaPreviewUrl}
                  alt=""
                  style={{ height: 80, borderRadius: 6, display: "block", objectFit: "cover" }}
                />
              )}
              <div style={{ fontSize: 11, opacity: 0.6, marginTop: 3, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {eventFile?.name}
              </div>
            </div>
          )}

          {/* Stored media preview (when nothing staged) */}
          {!hasStagedFile && storedThumbUrl && (
            <div style={{ marginBottom: 8 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={storedThumbUrl}
                alt=""
                style={{ height: 80, borderRadius: 6, display: "block", objectFit: "cover" }}
              />
              <div style={{ fontSize: 11, opacity: 0.5, marginTop: 3 }}>Current uploaded file</div>
            </div>
          )}

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: "5px 14px",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                border: "1px solid rgba(255,255,255,0.2)",
                background: "rgba(255,255,255,0.07)",
                color: "rgba(255,255,255,0.75)",
                cursor: "pointer",
              }}
            >
              {hasStagedFile ? "Change file" : "Choose file"}
            </button>

            {(hasStagedFile || hasStoredMedia) && (
              <button
                type="button"
                onClick={clearMedia}
                style={{
                  padding: "5px 14px",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  border: "1px solid rgba(255,100,100,0.35)",
                  background: "rgba(255,100,100,0.06)",
                  color: "rgba(255,120,120,0.85)",
                  cursor: "pointer",
                }}
              >
                Remove media
              </button>
            )}
          </div>
        </div>

        {/* Alt text */}
        <div style={fieldRowStyle}>
          <label style={labelStyle}>Alt text / caption <span style={{ fontWeight: 400, opacity: 0.5 }}>(optional)</span></label>
          <input
            type="text"
            value={mediaAlt}
            onChange={(e) => setProfile((p: any) => ({ ...p, upcomingEventMediaAlt: e.target.value }))}
            placeholder="Brief description of the image or video"
            maxLength={200}
            style={inputStyle}
          />
        </div>

        {/* Video autoplay toggle — only shown for video type */}
        {mediaType === "video" && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
            <input
              id="cu-video-autoplay"
              type="checkbox"
              checked={videoAutoplay === "true"}
              onChange={(e) =>
                setProfile((p: any) => ({
                  ...p,
                  upcomingEventVideoAutoplay: e.target.checked ? "true" : "",
                }))
              }
              style={{ width: 15, height: 15, cursor: "pointer" }}
            />
            <label
              htmlFor="cu-video-autoplay"
              style={{ fontSize: 12.5, color: "rgba(255,255,255,0.7)", cursor: "pointer" }}
            >
              Autoplay silently (muted loop, no controls)
            </label>
          </div>
        )}
      </div>

      {/* DAT promotion callout */}
      <div
        style={{
          marginTop: 22,
          padding: "12px 14px",
          borderRadius: 8,
          border: "1px solid rgba(139,92,246,0.25)",
          background: "rgba(139,92,246,0.07)",
        }}
      >
        <p
          style={{
            margin: "0 0 5px",
            fontSize: 12,
            fontWeight: 600,
            color: "rgba(255,255,255,0.75)",
            letterSpacing: "0.01em",
          }}
        >
          Want DAT to help amplify this event?
        </p>
        <p style={{ ...explainStyleLocal, margin: "0 0 10px", fontSize: 11.5 }}>
          If this project aligns with DAT&apos;s mission — through adventurous storytelling,
          community engagement, cross-cultural exchange, or alumni collaboration — we may be able to
          consider it for broader promotion beyond your alumni profile.
        </p>
        <a
          href={mailtoHref}
          style={{
            display: "inline-block",
            fontSize: 11.5,
            fontWeight: 600,
            color: "rgba(167,139,250,0.9)",
            textDecoration: "none",
            borderBottom: "1px solid rgba(167,139,250,0.4)",
            paddingBottom: 1,
          }}
        >
          Request DAT promotion →
        </a>
      </div>

      <div
        style={{
          marginTop: 20,
          paddingTop: 18,
          borderTop: "1px solid rgba(255,255,255,0.10)",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 14,
          flexWrap: "wrap",
        }}
      >
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
          className="dat-btn"
          disabled={loading}
          onClick={() =>
            saveCategory({
              tag: "Event",
              fieldKeys: [...eventFieldKeys, ...EVENT_MEDIA_KEYS],
              uploadKinds: ["event"],
              afterSave: () => onSaved?.(),
            })
          }
        >
          {savedRecently ? "Saved ✓" : "Save Event"}
        </button>
      </div>
    </div>
  );
}
