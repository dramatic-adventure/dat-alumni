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
  savedRecently?: boolean;
  onSaved?: () => void;
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
  savedRecently = false,
  onSaved,
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

  // What's currently visible on the public Contact tab
  const websiteShown =
    isPubliclyVisible(profile?.showWebsite) && !!String(profile?.website || "").trim();
  const emailShown =
    isPubliclyVisible(profile?.showPublicEmail) && !!String(profile?.publicEmail || "").trim();
  const featuredSocial =
    featuredSelectValue && String(profile?.[featuredSelectValue] || "").trim()
      ? { key: featuredSelectValue, label: ADDITIONAL_LINKS.find((l) => l.key === featuredSelectValue)?.label ?? featuredSelectValue, value: profile[featuredSelectValue] }
      : null;

  const previewItems: { key: string; label: string; value: string }[] = [
    ...(websiteShown ? [{ key: "website", label: "Website", value: profile.website }] : []),
    ...(emailShown ? [{ key: "email", label: "Email", value: profile.publicEmail }] : []),
    ...(featuredSocial ? [featuredSocial] : []),
  ];

  // Shared button styles for feature toggles
  const featureBtn: CSSProperties = {
    ...datButtonGhost,
    padding: "6px 12px",
    fontSize: "0.76rem",
    whiteSpace: "nowrap",
    flexShrink: 0,
    borderRadius: 10,
  };
  const featureBtnActive: CSSProperties = {
    ...featureBtn,
    background: "rgba(108,0,175,0.22)",
    border: "1px solid rgba(108,0,175,0.65)",
    color: "rgba(210,185,255,0.95)",
  };

  // Zone B: saved links that are collapsed and not currently featured
  const savedCollapsedNotFeatured = featuredOptions.filter(
    (o) => o.key !== featuredSelectValue && !openPlatforms.has(o.key)
  );

  return (
    <div>
      <div id="studio-contact-anchor" />

      {/* ── Your Contact Tab ──────────────────────────────────── */}
      <span style={subheadChipStyle} className="subhead-chip">
        Your Contact Tab
      </span>
      <p style={{ ...explainStyleLocal, opacity: 0.65, fontSize: "0.8rem" }}>
        Choose what appears publicly on the Contact tab of your DAT profile.
      </p>

      {/* Preview area */}
      {previewItems.length > 0 ? (
        <div
          style={{
            background: "rgba(108,0,175,0.09)",
            borderLeft: "3px solid rgba(108,0,175,0.42)",
            borderRadius: "0 6px 6px 0",
            padding: "11px 16px",
            marginBottom: 20,
          }}
        >
          <span
            style={{
              display: "block",
              fontSize: "0.67rem",
              color: "rgba(185,145,255,0.85)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            Showing on your profile
          </span>
          {previewItems.map((item) => (
            <div
              key={item.key}
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 8,
                marginBottom: 4,
              }}
            >
              <span
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  opacity: 0.6,
                  minWidth: 56,
                  flexShrink: 0,
                }}
              >
                {item.label}
              </span>
              <span style={{ fontSize: "0.78rem", opacity: 0.88, wordBreak: "break-all" }}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p
          style={{
            ...explainStyleLocal,
            opacity: 0.38,
            fontSize: "0.8rem",
            marginBottom: 20,
            paddingLeft: 4,
          }}
        >
          Nothing on your Contact tab yet — feature your website, email, or a social link below.
        </p>
      )}

      <div style={{ display: "grid", gap: 16, marginBottom: 28 }}>
        {/* Website */}
        <div>
          <label style={labelStyle}>Website / Portfolio</label>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <input
              value={profile?.website || ""}
              onChange={(e) => setProfile((p) => ({ ...p, website: e.target.value }))}
              style={{ ...inputStyle, flex: 1, minWidth: 0, width: "auto" }}
              placeholder="https://yoursite.com"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() =>
                setProfile((p) => ({
                  ...p,
                  showWebsite: isPubliclyVisible(p.showWebsite) ? "false" : "true",
                }))
              }
              style={websiteShown ? featureBtnActive : featureBtn}
              disabled={loading}
            >
              {websiteShown ? "✓ On profile" : "Feature this website"}
            </button>
          </div>
        </div>

        {/* Public Email */}
        <div>
          <label style={labelStyle}>Public email</label>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <input
              type="email"
              value={profile?.publicEmail || ""}
              onChange={(e) => setProfile((p) => ({ ...p, publicEmail: e.target.value }))}
              style={{ ...inputStyle, flex: 1, minWidth: 0, width: "auto" }}
              placeholder="name@example.com"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() =>
                setProfile((p) => ({
                  ...p,
                  showPublicEmail: isPubliclyVisible(p.showPublicEmail) ? "false" : "true",
                }))
              }
              style={emailShown ? featureBtnActive : featureBtn}
              disabled={loading}
            >
              {emailShown ? "✓ On profile" : "Feature this email"}
            </button>
          </div>
        </div>
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

      {/* Expanded inputs with inline Feature button */}
      {ADDITIONAL_LINKS.filter(({ key }) => openPlatforms.has(key)).map(
        ({ key, label, placeholder }) => {
          const hasValue = !!String(profile?.[key] || "").trim();
          const isFeatured = featuredSelectValue === key;
          return (
            <div key={key} style={{ marginBottom: 14 }}>
              <label style={labelStyle}>{label}</label>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <input
                  value={profile?.[key] || ""}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, [key]: e.target.value }))
                  }
                  style={{ ...inputStyle, flex: 1, minWidth: 0, width: "auto" }}
                  placeholder={placeholder}
                  disabled={loading}
                />
                {hasValue && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!isFeatured) {
                        setPrimarySocial(key);
                        setProfile((p) => ({ ...p, primarySocial: key }));
                      }
                    }}
                    style={isFeatured ? featureBtnActive : featureBtn}
                    disabled={loading || isFeatured}
                  >
                    {isFeatured ? "✓ Featured" : "Feature this link"}
                  </button>
                )}
              </div>
            </div>
          );
        }
      )}

      {/* Zone B: saved links that are collapsed and not currently featured */}
      {savedCollapsedNotFeatured.length > 0 && (
        <div
          style={{
            marginTop: 8,
            marginBottom: 8,
            borderTop: "1px solid rgba(255,255,255,0.06)",
            paddingTop: 12,
          }}
        >
          {savedCollapsedNotFeatured.map(({ key, label }) => (
            <div
              key={key}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "9px 0",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <div>
                <div style={{ fontSize: "0.83rem", fontWeight: 500, opacity: 0.85 }}>
                  {label}
                </div>
                <div
                  style={{
                    fontSize: "0.73rem",
                    opacity: 0.45,
                    marginTop: 2,
                    wordBreak: "break-all",
                  }}
                >
                  {profile?.[key]}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPrimarySocial(key);
                  setProfile((p) => ({ ...p, primarySocial: key }));
                }}
                style={{
                  ...datButtonGhost,
                  padding: "5px 11px",
                  fontSize: "0.76rem",
                  whiteSpace: "nowrap",
                  opacity: 0.75,
                }}
                disabled={loading}
              >
                Feature this link
              </button>
            </div>
          ))}
        </div>
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
          onClick={() =>
            saveCategory({
              tag: "Contact",
              fieldKeys: contactFieldKeys,
              uploadKinds: [],
              afterSave: () => {
                onClearDraft();
                onSaved?.();
              },
            })
          }
          style={{
            ...datButtonLocal,
            ...(savedRecently
              ? { background: "rgba(52,211,153,0.25)", borderColor: "rgba(52,211,153,0.5)" }
              : {}),
          }}
          className="dat-btn"
          disabled={loading}
        >
          {savedRecently ? "Saved ✓" : "Save Contact Info"}
        </button>
      </div>

      <p style={{ ...explainStyleLocal, marginTop: 12, opacity: 0.45, fontSize: "0.78rem" }}>
        Clearing a link&apos;s value and saving will remove it from your public profile.
      </p>
    </div>
  );
}
