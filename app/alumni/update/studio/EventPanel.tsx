"use client";

import type { CSSProperties, ReactNode } from "react";
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
  explainStyleLocal: CSSProperties;
  subheadChipStyle: CSSProperties;
  labelStyle: CSSProperties;
  inputStyle: CSSProperties;
  datButtonLocal: CSSProperties;

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

  // optional fallback
  manualFallback?: ReactNode;

  isDirty?: boolean;
  savedRecently?: boolean;
  onSaved?: () => void;
}) {
  const {
    loading,
    explainStyleLocal,
    subheadChipStyle,
    labelStyle,
    inputStyle,
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
    isDirty = false,
    savedRecently = false,
    onSaved,
  } = props;

  const [mediaPreviewUrl, setMediaPreviewUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageSource, setImageSource] = useState<"upload" | "url">(() => {
    const sid = String(profile?.featuredEventId || "").trim();
    const mu  = String(profile?.upcomingEventMediaUrl || "").trim();
    if (sid) return "upload";
    if (mu)  return "url";
    return "upload";
  });

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
    setImageSource("upload");
    setProfile((p: any) => ({ ...p, upcomingEventMediaUrl: "" }));
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

  /* Ghost button used for media type toggle and file actions — matches reference panels */
  const mediaTypeBtn: CSSProperties = {
    padding: "5px 14px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    border: "1px solid rgba(255,255,255,0.15)",
    background: "rgba(255,255,255,0.05)",
    color: "rgba(255,255,255,0.55)",
    cursor: "pointer",
    textTransform: "capitalize" as const,
  };
  const mediaTypeBtnActive: CSSProperties = {
    ...mediaTypeBtn,
    border: "1px solid rgba(196,163,90,0.8)",
    background: "rgba(196,163,90,0.18)",
    color: "#C4A35A",
  };

  const fileActionBtn: CSSProperties = {
    padding: "5px 14px",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    border: "1px solid rgba(255,255,255,0.2)",
    background: "rgba(255,255,255,0.07)",
    color: "rgba(255,255,255,0.75)",
    cursor: "pointer",
  };
  const removeBtn: CSSProperties = {
    ...fileActionBtn,
    border: "1px solid rgba(255,100,100,0.35)",
    background: "rgba(255,100,100,0.06)",
    color: "rgba(255,120,120,0.85)",
  };

  /* Small label for sub-fields inside the Event Media card */
  const mediaSubLabel: CSSProperties = {
    fontSize: 11.5,
    fontWeight: 600,
    color: "rgba(255,255,255,0.7)",
    letterSpacing: "0.01em",
    display: "block",
    marginBottom: 4,
  };

  return (
    <div>
      <div id="studio-event-anchor" />

      <p style={explainStyleLocal}>
        Let alumni and DAT&apos;s wider audience know where they can experience your work next.
      </p>

      <span style={subheadChipStyle} className="subhead-chip">
        Share an Upcoming Event
      </span>

      <p style={{ ...explainStyleLocal, opacity: 0.55, fontSize: "0.8rem", fontStyle: "italic" }}>
        Powers the <strong style={{ color: "rgba(255,255,255,0.7)", fontStyle: "normal" }}>Coming Up</strong>{" "}
        strip on your public profile. Disappears automatically once the event date or expiration
        date passes.
      </p>

      {/* Field layout — responsive rows on desktop */}
      {(() => {
        const titleField = renderFieldsOrNull(["upcomingEventTitle"]);
        if (titleField === null) return manualFallback ?? null;
        return (
          <div style={{ marginTop: 16 }}>
            {titleField}
            <div className="event-field-row-3">
              <div>{renderFieldsOrNull(["upcomingEventLink"])}</div>
              <div>{renderFieldsOrNull(["upcomingEventDate"])}</div>
              <div>{renderFieldsOrNull(["upcomingEventExpiresAt"])}</div>
            </div>
            {renderFieldsOrNull(["upcomingEventDescription"])}
            <div className="event-field-row-2">
              <div>{renderFieldsOrNull(["upcomingEventCity"])}</div>
              <div>{renderFieldsOrNull(["upcomingEventStateCountry"])}</div>
            </div>
          </div>
        );
      })()}

      {/* ── Event media ─────────────────────────────────────────────── */}
      <div
        style={{
          marginTop: 20,
          padding: "14px 16px",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(0,0,0,0.14)",
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
          Event Media{" "}
          <span style={{ fontWeight: 400, opacity: 0.5, fontSize: 11.5 }}>(optional)</span>
        </p>

        {/* Media type toggle */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 14 }}>
          <span style={mediaSubLabel}>Type</span>
          <div style={{ display: "flex", gap: 8 }}>
            {(["image", "video"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setProfile((p: any) => ({ ...p, upcomingEventMediaType: t }))}
                style={mediaType === t ? mediaTypeBtnActive : mediaTypeBtn}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Image mode: mutually exclusive source choice */}
        {mediaType !== "video" && (
          <>
            {/* Source toggle */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 14 }}>
              <span style={mediaSubLabel}>Source</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    setImageSource("upload");
                    setProfile((p: any) => ({ ...p, upcomingEventMediaUrl: "" }));
                  }}
                  style={imageSource === "upload" ? mediaTypeBtnActive : mediaTypeBtn}
                >
                  Upload image
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setImageSource("url");
                    onEventFileChange?.(null);
                    setProfile((p: any) => ({ ...p, featuredEventId: "" }));
                  }}
                  style={imageSource === "url" ? mediaTypeBtnActive : mediaTypeBtn}
                >
                  Paste URL
                </button>
              </div>
            </div>

            {/* Upload panel */}
            {imageSource === "upload" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 14 }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  style={{ display: "none" }}
                  onChange={(e) => handleFileSelect(e.target.files)}
                />

                {hasStagedFile && mediaPreviewUrl && (
                  <div style={{ marginBottom: 8, position: "relative", display: "inline-block" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={mediaPreviewUrl}
                      alt=""
                      style={{ height: 80, borderRadius: 6, display: "block", objectFit: "cover" }}
                    />
                    <div style={{ fontSize: 11, opacity: 0.6, marginTop: 3, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {eventFile?.name}
                    </div>
                  </div>
                )}

                {!hasStagedFile && storedThumbUrl && (
                  <div style={{ marginBottom: 8 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={storedThumbUrl}
                      alt=""
                      style={{ height: 80, borderRadius: 6, display: "block", objectFit: "cover" }}
                    />
                    <div style={{ fontSize: 11, opacity: 0.5, marginTop: 3 }}>Current uploaded image</div>
                  </div>
                )}

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={fileActionBtn}
                  >
                    {hasStagedFile ? "Change image" : "Choose image"}
                  </button>

                  {(hasStagedFile || storedFileId) && (
                    <button type="button" onClick={clearMedia} style={removeBtn}>
                      Remove image
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* URL panel */}
            {imageSource === "url" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
                <label style={mediaSubLabel}>Image URL</label>
                <input
                  type="url"
                  value={mediaUrl}
                  onChange={(e) => {
                    onEventFileChange?.(null);
                    setProfile((p: any) => ({ ...p, upcomingEventMediaUrl: e.target.value, featuredEventId: "" }));
                  }}
                  placeholder="https://… (jpg, png, webp, gif)"
                  style={inputStyle}
                />
              </div>
            )}
          </>
        )}

        {/* Video mode: URL only */}
        {mediaType === "video" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
            <label style={mediaSubLabel}>Video URL</label>
            <input
              type="url"
              value={mediaUrl}
              onChange={(e) => setProfile((p: any) => ({ ...p, upcomingEventMediaUrl: e.target.value }))}
              placeholder="https://… (YouTube, Vimeo, MP4, or WebM)"
              style={inputStyle}
            />
            <p style={{ margin: "4px 0 0", fontSize: 11.5, opacity: 0.5, lineHeight: 1.4 }}>
              For video, paste a YouTube, Vimeo, MP4, or WebM link.
            </p>
          </div>
        )}

        {/* Video autoplay toggle */}
        {mediaType === "video" && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
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
          padding: "14px 16px",
          borderRadius: 10,
          border: "1px solid rgba(139,92,246,0.45)",
          background: "rgba(139,92,246,0.14)",
        }}
      >
        <p
          style={{
            margin: "0 0 6px",
            fontSize: 12.5,
            fontWeight: 700,
            color: "rgba(255,255,255,0.92)",
            letterSpacing: "0.01em",
          }}
        >
          Want DAT to help amplify this event?
        </p>
        <p style={{ ...explainStyleLocal, margin: "0 0 12px", fontSize: 12, opacity: 0.8 }}>
          If this project aligns with DAT&apos;s mission — adventurous storytelling, community
          engagement, cross-cultural exchange, or alumni collaboration — we may be able to feature it
          beyond your profile.
        </p>
        <a
          href={mailtoHref}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 16px",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 700,
            color: "#c4b5fd",
            background: "rgba(139,92,246,0.22)",
            border: "1px solid rgba(139,92,246,0.55)",
            textDecoration: "none",
            letterSpacing: "0.01em",
          }}
        >
          Reach Out →
        </a>
      </div>

      <div
        style={{
          marginTop: 32,
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
          className="dat-btn"
          disabled={loading}
          onClick={() => {
            // Blank the inactive source at save time so stale values never persist.
            let profileOverride: any;
            if (mediaType !== "video") {
              if (imageSource === "upload") {
                profileOverride = { ...profile, upcomingEventMediaUrl: "" };
              } else {
                profileOverride = { ...profile, featuredEventId: "" };
              }
            }
            saveCategory({
              tag: "Event",
              fieldKeys: [...eventFieldKeys, ...EVENT_MEDIA_KEYS],
              uploadKinds: ["event"],
              afterSave: () => onSaved?.(),
              ...(profileOverride ? { profileOverride } : {}),
            });
          }}
        >
          {savedRecently ? "Saved ✓" : "Save Event"}
        </button>
      </div>
    </div>
  );
}
