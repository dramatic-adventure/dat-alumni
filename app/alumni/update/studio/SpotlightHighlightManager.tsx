"use client";

import { useState, useEffect, useCallback, type CSSProperties } from "react";
import {
  COLOR,
  subheadChipStyle,
  explainStyleLocal,
  labelStyle,
  inputStyle,
  datButtonGhost,
} from "@/app/alumni/update/updateStyles";
import { footerRowStyle } from "@/components/alumni/update/ProfileStudio";

// ── Shared types ──────────────────────────────────────────────────────────────
export type SpotlightItem = {
  profileSlug?: string;
  type?: string;
  title: string;
  subtitle?: string;
  bodyNote?: string;
  mediaUrls?: string;
  mediaType?: string;
  ctaText?: string;
  ctaUrl?: string;
  tags?: string;
  evergreen?: boolean;
  expirationDate?: string;
  eventDate?: string;
  featured?: boolean;
  sortDate?: string;
  hidden?: boolean;
};

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
  eventDate: string;
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
  eventDate: "",
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

// ── Local styles ──────────────────────────────────────────────────────────────
const textareaStyle: CSSProperties = {
  ...inputStyle,
  resize: "vertical",
  minHeight: 80,
  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
  fontSize: 14,
};

const fieldStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 0,
  marginBottom: 14,
};

const dividerStyle: CSSProperties = {
  borderTop: "1px solid rgba(255,255,255,0.08)",
  margin: "20px 0",
};

const inputTextStyle: CSSProperties = {
  ...inputStyle,
  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
  fontSize: 14,
};

const chipStyle = (selected: boolean, accent: string): CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  padding: "5px 11px",
  borderRadius: 999,
  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
  fontSize: 12,
  fontWeight: selected ? 700 : 500,
  cursor: "pointer",
  border: selected ? `1px solid ${accent}` : "1px solid rgba(255,255,255,0.25)",
  background: selected ? accent : "rgba(255,255,255,0.07)",
  color: COLOR.snow,
  transition: "background 140ms, border-color 140ms",
});

const cardStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 12,
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.04)",
  marginBottom: 10,
};

// Filled, high-contrast action buttons so they read clearly against the dark
// studio background (outlined/ghost buttons were hard to see).
const actionBtnBase: CSSProperties = {
  borderRadius: 9,
  padding: "7px 14px",
  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
  fontWeight: 700,
  fontSize: 12,
  letterSpacing: "0.04em",
  border: "1px solid transparent",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const badgeStyle = (color: string): CSSProperties => ({
  display: "inline-block",
  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color,
  border: `1px solid ${color}`,
  borderRadius: 6,
  padding: "1px 6px",
  marginLeft: 8,
  verticalAlign: "middle",
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function isExpired(item: { evergreen?: boolean; expirationDate?: string }): boolean {
  if (item.evergreen) return false;
  if (!item.expirationDate) return false;
  return new Date(item.expirationDate) < new Date();
}

function formFromItem(item: SpotlightItem): Form {
  return {
    title: item.title ?? "",
    subtitle: item.subtitle ?? "",
    bodyNote: item.bodyNote ?? "",
    mediaUrls: item.mediaUrls ?? "",
    ctaText: item.ctaText ?? "",
    ctaUrl: item.ctaUrl ?? "",
    tags: item.tags ?? "",
    evergreen: Boolean(item.evergreen),
    expirationDate: item.expirationDate ?? "",
    eventDate: item.eventDate ?? "",
  };
}

// ── Props ─────────────────────────────────────────────────────────────────────
export type SpotlightHighlightManagerProps = {
  profileSlug: string;
  /** Which collection this manager edits. */
  kind: "highlight" | "spotlight";
  /** Value written to the sheet's `type` column. */
  typeValue: string;
  /** Accent color for buttons / chips. */
  accent: string;
  /** Style for the primary Save button. */
  saveButtonStyle: CSSProperties;
  /** DOM id used by the studio for scroll anchoring. */
  anchorId: string;
  /** Singular noun, e.g. "Highlight" / "Spotlight". */
  noun: string;
  introCopy: string;
  titlePlaceholder: string;
  subtitlePlaceholder: string;
  bodyPlaceholder: string;
  ctaTextPlaceholder: string;
  /** Preloaded active items — when provided the list paints instantly. */
  initialActive?: SpotlightItem[];
  /** Preloaded hidden (soft-deleted) items. */
  initialHidden?: SpotlightItem[];
  onSaved?: () => void;
};

export default function SpotlightHighlightManager({
  profileSlug,
  kind,
  typeValue,
  accent,
  saveButtonStyle,
  anchorId,
  noun,
  introCopy,
  titlePlaceholder,
  subtitlePlaceholder,
  bodyPlaceholder,
  ctaTextPlaceholder,
  initialActive,
  initialHidden,
  onSaved,
}: SpotlightHighlightManagerProps) {
  const [items, setItems] = useState<SpotlightItem[]>(initialActive ?? []);
  const [hidden, setHidden] = useState<SpotlightItem[]>(initialHidden ?? []);
  const [loading, setLoading] = useState(initialActive === undefined);

  const [mode, setMode] = useState<"list" | "form">("list");
  const [form, setForm] = useState<Form>(BLANK);
  // Title of the item being edited (null = adding new). Tracked so a rename can
  // retire the old title via a soft-delete.
  const [editingItem, setEditingItem] = useState<SpotlightItem | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyTitle, setBusyTitle] = useState<string | null>(null);
  const [confirmTitle, setConfirmTitle] = useState<string | null>(null);
  const [purgeTitle, setPurgeTitle] = useState<string | null>(null);
  const [showHidden, setShowHidden] = useState(false);

  // Text color that sits on top of the accent fill (matches the Save button).
  const onAccent = (saveButtonStyle.color as string) || COLOR.snow;
  const editBtn: CSSProperties = { ...actionBtnBase, background: accent, color: onAccent };
  const deleteBtn: CSSProperties = { ...actionBtnBase, background: COLOR.red, color: COLOR.snow };
  const neutralBtn: CSSProperties = {
    ...actionBtnBase,
    background: "rgba(255,255,255,0.14)",
    color: COLOR.snow,
    border: "1px solid rgba(255,255,255,0.30)",
  };

  const reload = useCallback(async () => {
    if (!profileSlug) {
      setLoading(false);
      return;
    }
    try {
      const r = await fetch(`/api/alumni/spotlight?slug=${encodeURIComponent(profileSlug)}`);
      const data = await r.json();
      const active = kind === "highlight" ? data?.highlights : data?.spotlights;
      const hid = kind === "highlight" ? data?.hiddenHighlights : data?.hiddenSpotlights;
      setItems(Array.isArray(active) ? active : []);
      setHidden(Array.isArray(hid) ? hid : []);
    } catch {
      /* keep last-known data on failure */
    } finally {
      setLoading(false);
    }
  }, [profileSlug, kind]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const set =
    (key: keyof Form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const val =
        e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value;
      setForm((f) => ({ ...f, [key]: val }));
      setError(null);
    };

  // ── POST a row (add / edit / soft-delete / restore) ─────────────────────────
  const postRow = useCallback(
    async (item: SpotlightItem, hide: boolean) => {
      const res = await fetch("/api/alumni/spotlight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileSlug,
          type: typeValue,
          title: (item.title ?? "").trim(),
          subtitle: (item.subtitle ?? "").trim(),
          bodyNote: (item.bodyNote ?? "").trim(),
          mediaUrls: (item.mediaUrls ?? "").trim(),
          ctaText: (item.ctaText ?? "").trim(),
          ctaUrl: (item.ctaUrl ?? "").trim(),
          tags: (item.tags ?? "").trim(),
          evergreen: Boolean(item.evergreen),
          expirationDate: (item.expirationDate ?? "").trim(),
          mediaType: "",
          eventDate: (item.eventDate ?? "").trim(),
          featured: false,
          sortDate: "",
          hidden: hide,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j?.ok) {
        throw new Error(j?.error || `Failed (${res.status})`);
      }
    },
    [profileSlug, typeValue]
  );

  const openAdd = () => {
    setForm(BLANK);
    setEditingItem(null);
    setError(null);
    setMode("form");
  };

  const openEdit = (item: SpotlightItem) => {
    setForm(formFromItem(item));
    setEditingItem(item);
    setError(null);
    setMode("form");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = form.title.trim();
    if (!title) {
      setError("Headline is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await postRow({ ...form, title }, false);
      // If the title changed during an edit, retire the old item so it doesn't
      // linger as a separate entry (de-dup keys on type + title).
      const oldTitle = (editingItem?.title ?? "").trim();
      if (editingItem && oldTitle && oldTitle !== title) {
        await postRow({ ...editingItem }, true);
      }
      await reload();
      setForm(BLANK);
      setEditingItem(null);
      setMode("list");
      onSaved?.();
    } catch (err: any) {
      setError(err?.message || "Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: SpotlightItem) => {
    setBusyTitle(item.title);
    setConfirmTitle(null);
    try {
      await postRow(item, true);
      await reload();
    } catch {
      /* surface nothing destructive on failure */
    } finally {
      setBusyTitle(null);
    }
  };

  const handleRestore = async (item: SpotlightItem) => {
    setBusyTitle(item.title);
    try {
      await postRow(item, false);
      await reload();
    } catch {
      /* ignore */
    } finally {
      setBusyTitle(null);
    }
  };

  // Permanent purge — removes every underlying sheet row for this item.
  const handlePurge = async (item: SpotlightItem) => {
    setBusyTitle(item.title);
    setPurgeTitle(null);
    try {
      await fetch("/api/alumni/spotlight", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileSlug, kind, title: (item.title ?? "").trim() }),
      });
      await reload();
    } catch {
      /* ignore */
    } finally {
      setBusyTitle(null);
    }
  };

  if (loading) {
    return (
      <div
        id={anchorId}
        style={{
          padding: "24px 0",
          opacity: 0.5,
          fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
          fontSize: 14,
          color: COLOR.snow,
        }}
      >
        Loading…
      </div>
    );
  }

  // ── FORM VIEW ───────────────────────────────────────────────────────────────
  if (mode === "form") {
    const isEdit = Boolean(editingItem);
    return (
      <form onSubmit={handleSubmit}>
        <div id={anchorId} />

        <div style={{ marginBottom: 18 }}>
          <span style={{ ...subheadChipStyle, color: accent }} className="subhead-chip">
            {isEdit ? `Edit ${noun}` : `Add a ${noun}`}
          </span>
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Headline *</label>
          <input
            style={inputTextStyle}
            type="text"
            value={form.title}
            onChange={set("title")}
            placeholder={titlePlaceholder}
            required
          />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Subtitle</label>
          <input
            style={inputTextStyle}
            type="text"
            value={form.subtitle}
            onChange={set("subtitle")}
            placeholder={subtitlePlaceholder}
          />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>
            Event date <span style={{ opacity: 0.5, fontWeight: 400 }}>(optional)</span>
          </label>
          <input style={inputTextStyle} type="date" value={form.eventDate} onChange={set("eventDate")} />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>A little more detail</label>
          <textarea
            style={textareaStyle}
            value={form.bodyNote}
            onChange={set("bodyNote")}
            placeholder={bodyPlaceholder}
          />
        </div>

        <div style={dividerStyle} />

        <div style={fieldStyle}>
          <label style={labelStyle}>Category</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
            {CATEGORY_SUGGESTIONS.map((cat) => (
              <button
                key={cat}
                type="button"
                style={chipStyle(form.tags === cat, accent)}
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
            style={inputTextStyle}
            type="text"
            value={form.tags}
            onChange={set("tags")}
            placeholder="Or type a custom category"
          />
        </div>

        <div style={dividerStyle} />

        <div style={fieldStyle}>
          <label style={labelStyle}>Media URL</label>
          <input
            style={inputTextStyle}
            type="url"
            value={form.mediaUrls}
            onChange={set("mediaUrls")}
            placeholder="https://… direct link to an image or video"
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10, marginBottom: 14 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label style={labelStyle}>Button label</label>
            <input
              style={inputTextStyle}
              type="text"
              value={form.ctaText}
              onChange={set("ctaText")}
              placeholder={ctaTextPlaceholder}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label style={labelStyle}>Button link</label>
            <input
              style={inputTextStyle}
              type="url"
              value={form.ctaUrl}
              onChange={set("ctaUrl")}
              placeholder="https://…"
            />
          </div>
        </div>

        <div style={dividerStyle} />

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", userSelect: "none" }}>
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
              Keep this pinned — don&apos;t expire it automatically
            </span>
          </label>
        </div>

        {!form.evergreen && (
          <div style={fieldStyle}>
            <label style={labelStyle}>Expires on</label>
            <input
              style={inputTextStyle}
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
            onClick={() => {
              setMode("list");
              setForm(BLANK);
              setEditingItem(null);
              setError(null);
            }}
            disabled={saving}
          >
            Cancel
          </button>
          <button type="submit" style={{ ...saveButtonStyle, opacity: saving ? 0.6 : 1 }} disabled={saving}>
            {saving ? "Saving…" : isEdit ? `Save ${noun}` : `Add ${noun}`}
          </button>
        </div>
      </form>
    );
  }

  // ── LIST VIEW ───────────────────────────────────────────────────────────────
  return (
    <div>
      <div id={anchorId} />

      <p style={explainStyleLocal}>{introCopy}</p>

      <div style={{ marginBottom: 16 }}>
        <span style={{ ...subheadChipStyle, color: accent }} className="subhead-chip">
          {noun}s
        </span>
      </div>

      {items.length === 0 ? (
        <p
          style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontSize: 14,
            color: COLOR.snow,
            opacity: 0.6,
            margin: "0 0 14px",
          }}
        >
          No {noun.toLowerCase()}s yet.
        </p>
      ) : (
        <div style={{ marginBottom: 16 }}>
          {items.map((item, i) => {
            const expired = isExpired(item);
            const busy = busyTitle === item.title;
            const confirming = confirmTitle === item.title;
            return (
              <div key={`${item.title}-${i}`} style={cardStyle}>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                      fontSize: 15,
                      fontWeight: 600,
                      color: COLOR.snow,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {item.title || "(untitled)"}
                    {item.evergreen ? <span style={badgeStyle(accent)}>Pinned</span> : null}
                    {expired ? <span style={badgeStyle(COLOR.red)}>Expired</span> : null}
                  </div>
                  {item.subtitle ? (
                    <div
                      style={{
                        fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                        fontSize: 13,
                        color: COLOR.snow,
                        opacity: 0.7,
                        marginTop: 2,
                      }}
                    >
                      {item.subtitle}
                    </div>
                  ) : null}
                  {item.tags ? (
                    <div
                      style={{
                        fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                        fontSize: 11,
                        color: accent,
                        opacity: 0.9,
                        marginTop: 4,
                      }}
                    >
                      {item.tags}
                    </div>
                  ) : null}
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  {confirming ? (
                    <>
                      <button
                        type="button"
                        style={{ ...deleteBtn, opacity: busy ? 0.6 : 1 }}
                        onClick={() => handleDelete(item)}
                        disabled={busy}
                      >
                        {busy ? "Hiding…" : "Confirm"}
                      </button>
                      <button
                        type="button"
                        style={neutralBtn}
                        onClick={() => setConfirmTitle(null)}
                        disabled={busy}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        style={editBtn}
                        onClick={() => openEdit(item)}
                        disabled={busy}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        style={deleteBtn}
                        onClick={() => setConfirmTitle(item.title)}
                        disabled={busy}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button type="button" style={{ ...saveButtonStyle }} onClick={openAdd}>
        + Add a {noun}
      </button>

      {hidden.length > 0 && (
        <div style={{ marginTop: 22 }}>
          <button
            type="button"
            onClick={() => setShowHidden((v) => !v)}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 0,
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: COLOR.snow,
              opacity: 0.6,
            }}
          >
            {showHidden ? "▾" : "▸"} Hidden ({hidden.length})
          </button>

          {showHidden && (
            <div style={{ marginTop: 10 }}>
              <p
                style={{
                  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                  fontSize: 12,
                  color: COLOR.snow,
                  opacity: 0.55,
                  margin: "0 0 10px",
                }}
              >
                These are removed from the profile. Restore one to bring it back, or delete it
                permanently to remove it for good.
              </p>
              {hidden.map((item, i) => {
                const busy = busyTitle === item.title;
                const purging = purgeTitle === item.title;
                return (
                  <div key={`hidden-${item.title}-${i}`} style={{ ...cardStyle, opacity: 0.85 }}>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                          fontSize: 14,
                          fontWeight: 600,
                          color: COLOR.snow,
                        }}
                      >
                        {item.title || "(untitled)"}
                      </div>
                      {item.subtitle ? (
                        <div
                          style={{
                            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                            fontSize: 12,
                            color: COLOR.snow,
                            opacity: 0.6,
                            marginTop: 2,
                          }}
                        >
                          {item.subtitle}
                        </div>
                      ) : null}
                    </div>
                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      {purging ? (
                        <>
                          <button
                            type="button"
                            style={{ ...deleteBtn, opacity: busy ? 0.6 : 1 }}
                            onClick={() => handlePurge(item)}
                            disabled={busy}
                          >
                            {busy ? "Deleting…" : "Delete forever"}
                          </button>
                          <button
                            type="button"
                            style={neutralBtn}
                            onClick={() => setPurgeTitle(null)}
                            disabled={busy}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            style={{ ...editBtn, opacity: busy ? 0.6 : 1 }}
                            onClick={() => handleRestore(item)}
                            disabled={busy}
                          >
                            {busy ? "Restoring…" : "Restore"}
                          </button>
                          <button
                            type="button"
                            style={deleteBtn}
                            onClick={() => setPurgeTitle(item.title)}
                            disabled={busy}
                          >
                            Delete permanently
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
