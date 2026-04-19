"use client";

import { useState, useEffect, type CSSProperties } from "react";
import { datButtonGhost } from "@/app/alumni/update/updateStyles";

type UploadKind = "headshot" | "album" | "reel" | "event";

// Ordered to match Profile-Live column order
const ADDITIONAL_LINKS = [
  { key: "instagram",  label: "Instagram",           placeholder: "@handle or profile URL" },
  { key: "linkedin",   label: "LinkedIn",             placeholder: "handle (after /in/) or profile URL" },
  { key: "vimeo",      label: "Vimeo",                placeholder: "handle or profile URL" },
  { key: "youtube",    label: "YouTube",              placeholder: "@handle, channel URL, or video URL" },
  { key: "imdb",       label: "IMDb",                 placeholder: "nm1234567 or full IMDb URL" },
  { key: "facebook",   label: "Facebook",             placeholder: "username or profile URL" },
  { key: "tiktok",     label: "TikTok",               placeholder: "@handle or profile URL" },
  { key: "threads",    label: "Threads",              placeholder: "@handle or profile URL" },
  { key: "bluesky",    label: "Bluesky",              placeholder: "handle (e.g., name.bsky.social) or URL" },
  { key: "x",          label: "X",                    placeholder: "@handle or profile URL" },
  { key: "linktree",   label: "Linktree",             placeholder: "handle or linktr.ee URL" },
  { key: "newsletter", label: "Substack / Newsletter", placeholder: "https://yourname.substack.com" },
] as const;

type Platform = (typeof ADDITIONAL_LINKS)[number]["key"];

type ContactPanelProps = {
  explainStyleLocal: CSSProperties;
  subheadChipStyle: CSSProperties;
  datButtonLocal: CSSProperties;
  labelStyle: CSSProperties;
  inputStyle: CSSProperties;

  loading: boolean;
  isDirty?: boolean;

  primarySocial: string;
  setPrimarySocial: (v: string) => void;

  profile: any;
  setProfile: (fn: (prev: any) => any) => void;

  saveCategory: (args: {
    tag: string;
    fieldKeys?: string[];
    uploadKinds?: UploadKind[];
    afterSave?: () => void;
    profileOverride?: any;
  }) => void;

  contactFieldKeys: string[];
  onClearDraft: () => void;
};

/** Returns true when a field should be publicly visible (default: shown unless "false") */
function isPubliclyVisible(v: any) {
  return String(v ?? "").trim().toLowerCase() !== "false";
}

export default function ContactPanel({
  explainStyleLocal,
  subheadChipStyle,
  datButtonLocal,
  labelStyle,
  inputStyle,
  loading,
  isDirty = false,
  primarySocial,
  setPrimarySocial,
  profile,
  setProfile,
  saveCategory,
  contactFieldKeys,
  onClearDraft,
}: ContactPanelProps) {
  // Which platform inputs are currently expanded
  const [openPlatforms, setOpenPlatforms] = useState<Set<Platform>>(new Set());

  // Auto-expand any platform that already has a saved value when profile loads
  useEffect(() => {
    setOpenPlatforms((prev) => {
      const next = new Set(prev);
      for (const { key } of ADDITIONAL_LINKS) {
        if (String(profile?.[key] || "").trim()) next.add(key);
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.instagram, profile?.linkedin, profile?.vimeo, profile?.youtube,
      profile?.imdb, profile?.facebook, profile?.tiktok, profile?.threads,
      profile?.bluesky, profile?.x, profile?.linktree, profile?.newsletter]);

  const togglePlatform = (key: Platform) => {
    setOpenPlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Featured link options: only platforms that have actual values
  const featuredOptions = ADDITIONAL_LINKS.filter(({ key }) =>
    String(profile?.[key] || "").trim()
  );

  // If the saved primarySocial no longer has a value, show empty in the select
  const featuredSelectValue = featuredOptions.some((o) => o.key === primarySocial)
    ? primarySocial
    : "";

  return (
    <div>
      <div id="studio-contact-anchor" />

      {/* ── Primary contact ───────────────────────────────────── */}
      <span style={subheadChipStyle} className="subhead-chip">
        Primary contact
      </span>
      <p style={{ ...explainStyleLocal, opacity: 0.65, fontSize: "0.8rem" }}>
        Your website and email can each be shown or hidden on your public profile. Uncheck to store them for DAT&apos;s records only.
      </p>

      <div style={{ display: "grid", gap: 16, marginBottom: 28 }}>
        {/* Website */}
        <div>
          <label style={labelStyle}>Website / Portfolio</label>
          <input
            value={profile?.website || ""}
            onChange={(e) => setProfile((p) => ({ ...p, website: e.target.value }))}
            style={inputStyle}
            placeholder="https://yoursite.com"
            disabled={loading}
          />
          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              marginTop: 8,
              fontSize: 13,
              cursor: "pointer",
              opacity: 0.85,
            }}
          >
            <input
              type="checkbox"
              checked={isPubliclyVisible(profile?.showWebsite)}
              onChange={(e) =>
                setProfile((p) => ({ ...p, showWebsite: e.target.checked ? "true" : "false" }))
              }
              disabled={loading}
            />
            Show on public profile
          </label>
        </div>

        {/* Public Email */}
        <div>
          <label style={labelStyle}>Public email</label>
          <input
            type="email"
            value={profile?.publicEmail || ""}
            onChange={(e) => setProfile((p) => ({ ...p, publicEmail: e.target.value }))}
            style={inputStyle}
            placeholder="name@example.com"
            disabled={loading}
          />
          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              marginTop: 8,
              fontSize: 13,
              cursor: "pointer",
              opacity: 0.85,
            }}
          >
            <input
              type="checkbox"
              checked={isPubliclyVisible(profile?.showPublicEmail)}
              onChange={(e) =>
                setProfile((p) => ({ ...p, showPublicEmail: e.target.checked ? "true" : "false" }))
              }
              disabled={loading}
            />
            Show on public profile
          </label>
        </div>
      </div>

      {/* ── Featured link ─────────────────────────────────────── */}
      <span style={subheadChipStyle} className="subhead-chip">
        Featured link
      </span>
      <p style={{ ...explainStyleLocal, opacity: 0.65, fontSize: "0.8rem" }}>
        Choose one of the additional links below to feature on your profile.
      </p>
      <div style={{ marginBottom: 28 }}>
        <select
          value={featuredSelectValue}
          onChange={(e) => {
            const v = e.target.value;
            setPrimarySocial(v);
            setProfile((p) => ({ ...p, primarySocial: v }));
          }}
          style={{
            ...inputStyle,
            opacity: featuredOptions.length === 0 ? 0.55 : 1,
            cursor: featuredOptions.length === 0 ? "not-allowed" : "pointer",
          }}
          disabled={loading || featuredOptions.length === 0}
        >
          {featuredOptions.length === 0 ? (
            <option value="">— Add an additional link first —</option>
          ) : (
            <>
              <option value="">— None —</option>
              {featuredOptions.map(({ key, label }) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </>
          )}
        </select>
      </div>

      {/* ── Additional links ──────────────────────────────────── */}
      <span style={subheadChipStyle} className="subhead-chip">
        Additional links
      </span>
      <p style={{ ...explainStyleLocal, opacity: 0.65, fontSize: "0.8rem" }}>
        Select any platforms you use — the input expands below the chips.
      </p>

      {/* Chip grid */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
        {ADDITIONAL_LINKS.map(({ key, label }) => {
          const hasValue = !!String(profile?.[key] || "").trim();
          const isOpen = openPlatforms.has(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => togglePlatform(key)}
              disabled={loading}
              style={{
                ...datButtonGhost,
                padding: "7px 13px",
                fontSize: "0.82rem",
                letterSpacing: "0.02em",
                fontWeight: hasValue ? 700 : 500,
                background: hasValue
                  ? "rgba(108,0,175,0.22)"
                  : isOpen
                  ? "rgba(255,255,255,0.1)"
                  : "transparent",
                border: hasValue
                  ? "1px solid rgba(108,0,175,0.7)"
                  : "1px solid rgba(255,255,255,0.4)",
                opacity: hasValue || isOpen ? 1 : 0.6,
                transition: "background 0.15s, border-color 0.15s, opacity 0.15s",
              }}
            >
              {hasValue && <span style={{ marginRight: 4 }}>✓</span>}
              {label}
            </button>
          );
        })}
      </div>

      {/* Expanded inputs — in sheet column order, only open ones */}
      {ADDITIONAL_LINKS.filter(({ key }) => openPlatforms.has(key)).map(
        ({ key, label, placeholder }) => (
          <div key={key} style={{ marginBottom: 14 }}>
            <label style={labelStyle}>{label}</label>
            <input
              value={profile?.[key] || ""}
              onChange={(e) =>
                setProfile((p) => ({ ...p, [key]: e.target.value }))
              }
              style={inputStyle}
              placeholder={placeholder}
              disabled={loading}
            />
          </div>
        )
      )}

      {/* ── Panel footer ──────────────────────────────────────── */}
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
        {isDirty && (
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
        <button
          type="button"
          onClick={() =>
            saveCategory({
              tag: "Contact",
              fieldKeys: contactFieldKeys,
              uploadKinds: [],
              afterSave: () => onClearDraft(),
            })
          }
          style={datButtonLocal}
          className="dat-btn"
          disabled={loading}
        >
          Save Contact Info
        </button>
      </div>

      <p style={{ ...explainStyleLocal, marginTop: 12, opacity: 0.45, fontSize: "0.78rem" }}>
        Clearing a link&apos;s value and saving will remove it from your public profile.
      </p>
    </div>
  );
}
