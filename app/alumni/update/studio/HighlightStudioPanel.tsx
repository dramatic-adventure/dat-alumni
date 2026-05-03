"use client";

import { useState, useEffect, type CSSProperties } from "react";
import {
  COLOR,
  subheadChipStyle,
  explainStyleLocal,
  labelStyle,
  inputStyle,
  datButtonLocal,
  datButtonGhost,
} from "@/app/alumni/update/updateStyles";
import { footerRowStyle } from "@/components/alumni/update/ProfileStudio";

// ── Chip style matches ImpactPanel ────────────────────────────────────────────
const chipStyle = (selected: boolean): CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  padding: "5px 11px",
  borderRadius: 999,
  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
  fontSize: 12,
  fontWeight: selected ? 700 : 500,
  cursor: "pointer",
  border: selected
    ? `1px solid ${COLOR.teal}`
    : "1px solid rgba(255,255,255,0.25)",
  background: selected ? COLOR.teal : "rgba(255,255,255,0.07)",
  color: COLOR.snow,
  transition: "background 140ms, border-color 140ms",
});

const textareaStyle: CSSProperties = {
  ...inputStyle,
  resize: "vertical" as const,
  minHeight: 80,
  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
  fontSize: 14,
};

const fieldStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column" as const,
  gap: 0,
  marginBottom: 14,
};

const dividerStyle: CSSProperties = {
  borderTop: "1px solid rgba(255,255,255,0.08)",
  margin: "20px 0",
};

const CATEGORY_SUGGESTIONS = [
  "Award",
  "Press",
  "Performance",
  "New Project",
  "Release",
  "Residency",
  "Teaching",
  "Tour",
  "Other",
];

type Form = {
  title: string;
  subtitle: string;
  bodyNote: string;
  mediaUrls: string;
  ctaText: string;
  ctaUrl: string;
  tags: string;
  evergreen: boolean;
  expirationDate: string;
};

const BLANK: Form = {
  title: "",
  subtitle: "",
  bodyNote: "",
  mediaUrls: "",
  ctaText: "",
  ctaUrl: "",
  tags: "",
  evergreen: true,
  expirationDate: "",
};

type HighlightStudioPanelProps = {
  profileSlug: string;
  onSaved?: () => void;
};

function isExpired(row: { evergreen: boolean; expirationDate: string }): boolean {
  if (row.evergreen) return false;
  if (!row.expirationDate) return false;
  return new Date(row.expirationDate) < new Date();
}

export default function HighlightStudioPanel({
  profileSlug,
  onSaved,
}: HighlightStudioPanelProps) {
  const [form, setForm] = useState<Form>(BLANK);
  const [saving, setSaving] = useState(false);
  const [savedRecently, setSavedRecently] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasExisting, setHasExisting] = useState(false);

  // Pre-populate with existing active highlight on mount
  useEffect(() => {
    if (!profileSlug) { setLoading(false); return; }
    let alive = true;
    fetch(`/api/alumni/spotlight?slug=${encodeURIComponent(profileSlug)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!alive) return;
        const highlights: any[] = data?.highlights ?? [];
        const active = highlights.find((h) => !isExpired(h));
        if (active) {
          setForm({
            title: active.title ?? "",
            subtitle: active.subtitle ?? "",
            bodyNote: active.bodyNote ?? "",
            mediaUrls: active.mediaUrls ?? "",
            ctaText: active.ctaText ?? "",
            ctaUrl: active.ctaUrl ?? "",
            tags: active.tags ?? "",
            evergreen: Boolean(active.evergreen),
            expirationDate: active.expirationDate ?? "",
          });
          setHasExisting(true);
        }
      })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [profileSlug]);

  const set =
    (key: keyof Form) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) => {
      const val =
        e.target.type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : e.target.value;
      setForm((f) => ({ ...f, [key]: val }));
      setError(null);
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Headline is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/alumni/spotlight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileSlug,
          type: "highlight",
          title: form.title.trim(),
          subtitle: form.subtitle.trim(),
          bodyNote: form.bodyNote.trim(),
          mediaUrls: form.mediaUrls.trim(),
          ctaText: form.ctaText.trim(),
          ctaUrl: form.ctaUrl.trim(),
          tags: form.tags.trim(),
          evergreen: form.evergreen,
          expirationDate: form.expirationDate.trim(),
          mediaType: "",
          eventDate: "",
          featured: false,
          sortDate: "",
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j?.ok) {
        setError(j?.error || `Failed (${res.status})`);
      } else {
        setForm(BLANK);
        setSavedRecently(true);
        setTimeout(() => setSavedRecently(false), 2500);
        onSaved?.();
      }
    } catch (err: any) {
      setError(err?.message || "Network error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div id="studio-highlight-anchor" style={{ padding: "24px 0", opacity: 0.5, fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: 14, color: COLOR.snow }}>
        Loading…
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div id="studio-highlight-anchor" />

      <p style={explainStyleLocal}>
        {hasExisting
          ? "Your current highlight is pre-filled below — update anything and save to replace it."
          : "Share something notable — a recent project, award, press mention, or anything you want people to know about right now."}
      </p>

      <div style={{ marginBottom: 18 }}>
        <span style={subheadChipStyle} className="subhead-chip">
          {hasExisting ? "Edit Highlight" : "Add a Highlight"}
        </span>
      </div>

      {/* Headline */}
      <div style={fieldStyle}>
        <label style={labelStyle}>Headline *</label>
        <input
          style={{ ...inputStyle, fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: 14 }}
          type="text"
          value={form.title}
          onChange={set("title")}
          placeholder="e.g. Just released my debut album"
          required
        />
      </div>

      {/* Subtitle */}
      <div style={fieldStyle}>
        <label style={labelStyle}>Subtitle</label>
        <input
          style={{ ...inputStyle, fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: 14 }}
          type="text"
          value={form.subtitle}
          onChange={set("subtitle")}
          placeholder="e.g. Available everywhere now"
        />
      </div>

      {/* Body */}
      <div style={fieldStyle}>
        <label style={labelStyle}>A little more detail</label>
        <textarea
          style={textareaStyle}
          value={form.bodyNote}
          onChange={set("bodyNote")}
          placeholder="A sentence or two about what this moment means to you."
        />
      </div>

      <div style={dividerStyle} />

      {/* Category */}
      <div style={fieldStyle}>
        <label style={labelStyle}>Category</label>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            marginBottom: 8,
          }}
        >
          {CATEGORY_SUGGESTIONS.map((cat) => (
            <button
              key={cat}
              type="button"
              style={chipStyle(form.tags === cat)}
              onClick={() => {
                setForm((f) => ({ ...f, tags: f.tags === cat ? "" : cat }));
                setError(null);
              }}
            >
              {cat}
            </button>
          ))}
        </div>
        <input
          style={{ ...inputStyle, fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: 14 }}
          type="text"
          value={form.tags}
          onChange={set("tags")}
          placeholder="Or type a custom category"
        />
      </div>

      <div style={dividerStyle} />

      {/* Media URL */}
      <div style={fieldStyle}>
        <label style={labelStyle}>Media URL</label>
        <input
          style={{ ...inputStyle, fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: 14 }}
          type="url"
          value={form.mediaUrls}
          onChange={set("mediaUrls")}
          placeholder="https://… direct link to an image or video"
        />
      </div>

      {/* CTA */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 2fr",
          gap: 10,
          marginBottom: 14,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label style={labelStyle}>Button label</label>
          <input
            style={{ ...inputStyle, fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: 14 }}
            type="text"
            value={form.ctaText}
            onChange={set("ctaText")}
            placeholder="e.g. Listen Now"
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label style={labelStyle}>Button link</label>
          <input
            style={{ ...inputStyle, fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: 14 }}
            type="url"
            value={form.ctaUrl}
            onChange={set("ctaUrl")}
            placeholder="https://…"
          />
        </div>
      </div>

      <div style={dividerStyle} />

      {/* Evergreen */}
      <div style={{ marginBottom: 14 }}>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          <input
            type="checkbox"
            checked={form.evergreen}
            onChange={set("evergreen")}
            style={{ width: 16, height: 16, accentColor: COLOR.teal, cursor: "pointer" }}
          />
          <span
            style={{
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              fontSize: 13,
              color: COLOR.snow,
              opacity: 0.85,
            }}
          >
            Keep this pinned — don't expire it automatically
          </span>
        </label>
      </div>

      {!form.evergreen && (
        <div style={fieldStyle}>
          <label style={labelStyle}>Expires on</label>
          <input
            style={{ ...inputStyle, fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: 14 }}
            type="date"
            value={form.expirationDate}
            onChange={set("expirationDate")}
          />
        </div>
      )}

      {error && (
        <p
          style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontSize: 13,
            color: COLOR.red,
            margin: "0 0 12px",
          }}
        >
          {error}
        </p>
      )}

      <div style={footerRowStyle}>
        <button
          type="button"
          style={datButtonGhost}
          onClick={() => { setForm(BLANK); setError(null); }}
          disabled={saving}
        >
          Clear
        </button>
        <button
          type="submit"
          style={{ ...datButtonLocal, opacity: saving ? 0.6 : 1 }}
          disabled={saving}
        >
          {saving ? "Saving…" : savedRecently ? "✓ Saved" : hasExisting ? "Update Highlight" : "Add Highlight"}
        </button>
      </div>
    </form>
  );
}
