"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { COLOR, subheadChipStyle, explainStyleLocal } from "@/app/alumni/update/updateStyles";
import {
  GLASS_CSS,
  glassLabelClass,
  glassInputClass,
} from "@/app/alumni/update/studio/glassStyles";

type EventItem = {
  eventId: string;
  title: string;
  link: string;
  date: string;
  expiresAt: string;
  description: string;
  city: string;
  stateCountry: string;
  mediaType: string;
  mediaUrl: string;
  mediaFileId: string;
  mediaAlt: string;
  videoAutoplay: string;
  hidden?: boolean;
  __legacy?: boolean;
};

type EventForm = Omit<EventItem, "eventId" | "hidden" | "__legacy">;

const BLANK: EventForm = {
  title: "",
  link: "",
  date: "",
  expiresAt: "",
  description: "",
  city: "",
  stateCountry: "",
  mediaType: "",
  mediaUrl: "",
  mediaFileId: "",
  mediaAlt: "",
  videoAutoplay: "",
};

// ── Buttons (filled, high-contrast — match the story/spotlight managers) ───────
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
const editBtn: CSSProperties = { ...actionBtnBase, background: COLOR.teal, color: COLOR.snow };
const deleteBtn: CSSProperties = { ...actionBtnBase, background: COLOR.red, color: COLOR.snow };
const neutralBtn: CSSProperties = {
  ...actionBtnBase,
  background: "rgba(255,255,255,0.14)",
  color: COLOR.snow,
  border: "1px solid rgba(255,255,255,0.30)",
};
const primaryBtn: CSSProperties = {
  ...actionBtnBase,
  padding: "11px 20px",
  fontSize: 13,
  background: COLOR.teal,
  color: COLOR.snow,
};

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

const fieldLabel = glassLabelClass;
const fieldInput = glassInputClass;

function isExpired(e: { date?: string; expiresAt?: string }): boolean {
  const now = Date.now();
  const exp = String(e.expiresAt ?? "").trim();
  const date = String(e.date ?? "").trim();
  if (exp) {
    const t = Date.parse(exp);
    return Number.isFinite(t) ? t < now : false;
  }
  if (date) {
    const t = Date.parse(date);
    return Number.isFinite(t) ? t + 24 * 60 * 60 * 1000 < now : false;
  }
  return false;
}

function fmtDate(d: string): string {
  const s = String(d ?? "").trim();
  if (!s) return "";
  const t = Date.parse(s);
  if (!Number.isFinite(t)) return s;
  return new Date(t).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function metaLine(e: EventItem): string {
  return [fmtDate(e.date), [e.city, e.stateCountry].filter(Boolean).join(", ")]
    .filter(Boolean)
    .join(" · ");
}

export default function EventManager({
  alumniId,
  onSaved,
}: {
  alumniId: string;
  onSaved?: () => void;
}) {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [hidden, setHidden] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [view, setView] = useState<"list" | "form">("list");
  const [form, setForm] = useState<EventForm>(BLANK);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);

  // Image media: upload to Drive (fileId) or paste a URL.
  const [imageSource, setImageSource] = useState<"upload" | "url">("upload");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    if (!alumniId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/alumni/events?alumniId=${encodeURIComponent(alumniId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        setEvents(Array.isArray(d?.events) ? d.events : []);
        setHidden(Array.isArray(d?.hidden) ? d.hidden : []);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [alumniId]);

  const upcoming = events.filter((e) => !isExpired(e));
  const archived = events.filter((e) => isExpired(e));

  const set =
    (key: keyof EventForm) =>
    (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
      const val =
        e.target.type === "checkbox"
          ? (e.target as HTMLInputElement).checked
            ? "true"
            : ""
          : e.target.value;
      setForm((f) => ({ ...f, [key]: val }));
      setError(null);
    };

  const openAdd = () => {
    setForm(BLANK);
    setEditingId(null);
    setImageSource("upload");
    setError(null);
    setView("form");
  };

  const openEdit = (ev: EventItem) => {
    setForm({
      title: ev.title,
      link: ev.link,
      date: ev.date,
      expiresAt: ev.expiresAt,
      description: ev.description,
      city: ev.city,
      stateCountry: ev.stateCountry,
      mediaType: ev.mediaType,
      mediaUrl: ev.mediaUrl,
      mediaFileId: ev.mediaFileId,
      mediaAlt: ev.mediaAlt,
      videoAutoplay: ev.videoAutoplay,
    });
    setEditingId(ev.eventId || ""); // "" = legacy → save creates a real event
    setImageSource(ev.mediaFileId ? "upload" : "url");
    setError(null);
    setView("form");
  };

  async function uploadImage(file: File) {
    if (!alumniId) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("alumniId", alumniId);
      fd.append("kind", "event");
      fd.append("name", file.name);
      fd.append("isFeatured", "FALSE"); // don't touch the legacy single-event pointer
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j?.ok || !j?.fileId) throw new Error(j?.error || "Upload failed");
      setForm((f) => ({ ...f, mediaType: "image", mediaFileId: String(j.fileId), mediaUrl: "" }));
    } catch (err: any) {
      setError(err?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Event title is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const mode = editingId ? "edit" : "create";
      const res = await fetch("/api/alumni/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alumniId,
          mode,
          event: { ...form, eventId: editingId || undefined },
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j?.ok) throw new Error(j?.error || `Failed (${res.status})`);

      const savedItem: EventItem = { ...form, eventId: String(j.eventId || editingId || ""), hidden: false };
      if (mode === "edit" && editingId) {
        setEvents((list) => list.map((x) => (x.eventId === editingId ? savedItem : x)));
      } else {
        setEvents((list) => [...list, savedItem]);
      }
      setForm(BLANK);
      setEditingId(null);
      setView("list");
      onSaved?.();
    } catch (err: any) {
      setError(err?.message || "Network error");
    } finally {
      setSaving(false);
    }
  };

  const mutateHidden = async (ev: EventItem, hide: boolean) => {
    if (!ev.eventId) return;
    setBusyId(ev.eventId);
    setConfirmDelete(null);
    try {
      const res = await fetch("/api/alumni/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alumniId, mode: hide ? "delete" : "restore", eventId: ev.eventId }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j?.ok) throw new Error(j?.error || `Failed (${res.status})`);
      // Optimistic move between lists (no refetch — sheet reads can lag).
      if (hide) {
        setEvents((list) => list.filter((x) => x.eventId !== ev.eventId));
        setHidden((list) => [...list, { ...ev, hidden: true }]);
      } else {
        setHidden((list) => list.filter((x) => x.eventId !== ev.eventId));
        setEvents((list) => [...list, { ...ev, hidden: false }]);
      }
    } catch {
      /* ignore */
    } finally {
      setBusyId(null);
    }
  };

  // ── EVENT CARD ───────────────────────────────────────────────────────────────
  const renderCard = (ev: EventItem, kind: "upcoming" | "archived" | "deleted") => {
    const meta = metaLine(ev);
    const busy = busyId === ev.eventId;
    const confirming = confirmDelete === ev.eventId && ev.eventId !== "";
    return (
      <div key={ev.eventId || "legacy"} style={{ ...cardStyle, opacity: kind === "deleted" ? 0.85 : 1 }}>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: 15,
              fontWeight: 600,
              color: COLOR.snow,
            }}
          >
            {ev.title || "(untitled event)"}
            {kind === "archived" ? (
              <span
                style={{
                  marginLeft: 8,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: COLOR.gold,
                  border: `1px solid ${COLOR.gold}`,
                  borderRadius: 6,
                  padding: "1px 6px",
                  verticalAlign: "middle",
                }}
              >
                Past
              </span>
            ) : null}
          </div>
          {meta ? (
            <div
              style={{
                fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                fontSize: 13,
                color: COLOR.snow,
                opacity: 0.7,
                marginTop: 2,
              }}
            >
              {meta}
            </div>
          ) : null}
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          {kind === "deleted" ? (
            <button
              type="button"
              style={{ ...editBtn, opacity: busy ? 0.6 : 1 }}
              disabled={busy}
              onClick={() => mutateHidden(ev, false)}
            >
              {busy ? "Restoring…" : "Restore"}
            </button>
          ) : confirming ? (
            <>
              <button
                type="button"
                style={{ ...deleteBtn, opacity: busy ? 0.6 : 1 }}
                disabled={busy}
                onClick={() => mutateHidden(ev, true)}
              >
                {busy ? "Deleting…" : "Confirm"}
              </button>
              <button type="button" style={neutralBtn} disabled={busy} onClick={() => setConfirmDelete(null)}>
                Cancel
              </button>
            </>
          ) : (
            <>
              <button type="button" style={editBtn} disabled={busy} onClick={() => openEdit(ev)}>
                Edit
              </button>
              {ev.eventId ? (
                <button
                  type="button"
                  style={deleteBtn}
                  disabled={busy}
                  onClick={() => setConfirmDelete(ev.eventId)}
                >
                  Delete
                </button>
              ) : null}
            </>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div id="studio-event-anchor" style={{ padding: "24px 0", opacity: 0.5, color: COLOR.snow, fontSize: 14 }}>
        Loading…
      </div>
    );
  }

  // ── FORM VIEW ────────────────────────────────────────────────────────────────
  if (view === "form") {
    const isEdit = Boolean(editingId);
    const isVideo = form.mediaType === "video";
    const mailtoHref = (() => {
      const subject = encodeURIComponent(
        form.title ? `DAT Promotion Request: ${form.title}` : "DAT Promotion Request"
      );
      const body = encodeURIComponent(
        [
          "Hi DAT team,",
          "",
          "I'd like to request consideration for broader promotion of my event.",
          "",
          form.title ? `Event: ${form.title}` : "",
          form.link ? `Link: ${form.link}` : "",
          "",
          "How this aligns with DAT's mission:",
          "",
          "(Please share how this connects to adventurous storytelling, community engagement, cross-cultural exchange, or alumni collaboration.)",
          "",
          "Thank you,",
        ].join("\n")
      );
      return `mailto:hello@dramaticadventure.com?subject=${subject}&body=${body}`;
    })();
    const chip = (active: boolean): CSSProperties => ({
      border: 0,
      cursor: "pointer",
      borderRadius: 999,
      padding: "6px 16px",
      fontSize: 13,
      fontFamily: "inherit",
      fontWeight: active ? 600 : 500,
      background: active ? COLOR.teal : "transparent",
      color: active ? "#fff" : "rgba(242,242,242,0.8)",
    });
    return (
      <form onSubmit={handleSubmit}>
        <style dangerouslySetInnerHTML={{ __html: GLASS_CSS }} />
        <div id="studio-event-anchor" />

        <div style={{ marginBottom: 12 }}>
          <button type="button" style={neutralBtn} disabled={saving} onClick={() => setView("list")}>
            ← Your events
          </button>
        </div>
        <div style={{ marginBottom: 14 }}>
          <span style={subheadChipStyle} className="subhead-chip">
            {isEdit ? "Edit Event" : "New Event"}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <label className={fieldLabel}>Event title</label>
            <input className={fieldInput} value={form.title} onChange={set("title")} placeholder="e.g. Opening night of Into the Woods" />
          </div>

          <div>
            <label className={fieldLabel}>Link</label>
            <input className={fieldInput} type="url" value={form.link} onChange={set("link")} placeholder="https://… tickets or info" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label className={fieldLabel}>Date</label>
              <input className={fieldInput} type="date" value={form.date} onChange={set("date")} />
            </div>
            <div>
              <label className={fieldLabel}>Hide after</label>
              <input className={fieldInput} type="date" value={form.expiresAt} onChange={set("expiresAt")} />
            </div>
          </div>

          <div>
            <label className={fieldLabel}>Description</label>
            <textarea className={`${fieldInput} dat-glass-textarea`} value={form.description} onChange={set("description")} placeholder="A sentence about the event." />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label className={fieldLabel}>City</label>
              <input className={fieldInput} value={form.city} onChange={set("city")} placeholder="e.g. New York" />
            </div>
            <div>
              <label className={fieldLabel}>State / Country</label>
              <input className={fieldInput} value={form.stateCountry} onChange={set("stateCountry")} placeholder="e.g. NY or Slovakia" />
            </div>
          </div>

          <div>
            <label className={fieldLabel}>Media</label>
            <div style={{ display: "inline-flex", background: "rgba(255,255,255,0.08)", borderRadius: 999, padding: 4, gap: 2, marginBottom: 12 }}>
              {(["image", "video"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  style={chip(form.mediaType === t)}
                  onClick={() => setForm((f) => ({ ...f, mediaType: t }))}
                >
                  {t === "image" ? "Image" : "Video"}
                </button>
              ))}
              {form.mediaType ? (
                <button
                  key="none"
                  type="button"
                  style={chip(false)}
                  onClick={() => setForm((f) => ({ ...f, mediaType: "", mediaUrl: "", mediaFileId: "", mediaAlt: "", videoAutoplay: "" }))}
                >
                  None
                </button>
              ) : null}
            </div>

            {form.mediaType === "image" && (
              <>
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  <button
                    type="button"
                    style={chip(imageSource === "upload")}
                    onClick={() => {
                      setImageSource("upload");
                      setForm((f) => ({ ...f, mediaUrl: "" }));
                    }}
                  >
                    Upload
                  </button>
                  <button
                    type="button"
                    style={chip(imageSource === "url")}
                    onClick={() => {
                      setImageSource("url");
                      setForm((f) => ({ ...f, mediaFileId: "" }));
                    }}
                  >
                    Paste URL
                  </button>
                </div>

                {imageSource === "upload" ? (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const fl = e.target.files;
                        if (fl && fl[0]) uploadImage(fl[0]);
                        e.target.value = "";
                      }}
                    />
                    {form.mediaFileId ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`/api/media/thumb/${encodeURIComponent(form.mediaFileId)}?w=200`}
                        alt=""
                        style={{ height: 80, borderRadius: 8, display: "block", objectFit: "cover", marginBottom: 8 }}
                      />
                    ) : null}
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button type="button" style={neutralBtn} disabled={uploading} onClick={() => fileInputRef.current?.click()}>
                        {uploading ? "Uploading…" : form.mediaFileId ? "Change image" : "Choose image"}
                      </button>
                      {form.mediaFileId ? (
                        <button type="button" style={deleteBtn} onClick={() => setForm((f) => ({ ...f, mediaFileId: "" }))}>
                          Remove
                        </button>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <input
                    className={fieldInput}
                    type="url"
                    value={form.mediaUrl}
                    onChange={set("mediaUrl")}
                    placeholder="https://… direct image link (jpg, png, webp)"
                  />
                )}

                <input className={fieldInput} style={{ marginTop: 12 }} value={form.mediaAlt} onChange={set("mediaAlt")} placeholder="Image description (alt text)" />
              </>
            )}

            {isVideo && (
              <>
                <input
                  className={fieldInput}
                  type="url"
                  value={form.mediaUrl}
                  onChange={set("mediaUrl")}
                  placeholder="https://… YouTube, Vimeo, MP4, or WebM"
                />
                <label style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, cursor: "pointer", color: COLOR.snow, fontSize: 13 }}>
                  <input type="checkbox" checked={form.videoAutoplay === "true"} onChange={set("videoAutoplay")} style={{ width: 16, height: 16, accentColor: COLOR.teal }} />
                  Autoplay silently (muted loop)
                </label>
              </>
            )}
          </div>
        </div>

        <div
          style={{
            marginTop: 22,
            padding: "14px 16px",
            borderRadius: 12,
            border: "1px solid rgba(108,0,175,0.5)",
            background: "rgba(108,0,175,0.26)",
          }}
        >
          <p style={{ margin: "0 0 6px", fontSize: 12.5, fontWeight: 700, color: "rgba(255,255,255,0.92)" }}>
            Want DAT to help amplify this event?
          </p>
          <p style={{ margin: "0 0 12px", fontSize: 12, color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>
            If it aligns with DAT&apos;s mission — adventurous storytelling, community engagement,
            cross-cultural exchange, or alumni collaboration — we may be able to feature it beyond
            your profile.
          </p>
          <a
            href={mailtoHref}
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "7px 16px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              color: "#c4b5fd",
              background: "rgba(139,92,246,0.22)",
              border: "1px solid rgba(139,92,246,0.55)",
              textDecoration: "none",
            }}
          >
            Reach Out
          </a>
        </div>

        {error && (
          <p style={{ color: COLOR.red, fontSize: 13, fontFamily: "var(--font-dm-sans), system-ui, sans-serif", margin: "14px 0 0" }}>{error}</p>
        )}

        <div
          style={{
            marginTop: 26,
            paddingTop: 18,
            borderTop: "1px solid rgba(255,255,255,0.10)",
            display: "flex",
            justifyContent: "flex-end",
            gap: 14,
          }}
        >
          <button type="button" style={neutralBtn} disabled={saving} onClick={() => setView("list")}>
            Cancel
          </button>
          <button type="submit" style={{ ...primaryBtn, opacity: saving ? 0.6 : 1 }} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save Event" : "Add Event"}
          </button>
        </div>
      </form>
    );
  }

  // ── LIST VIEW ────────────────────────────────────────────────────────────────
  return (
    <div>
      <div id="studio-event-anchor" />
      <p style={explainStyleLocal}>
        Add events people can catch you at. The soonest upcoming one shows on your profile; once an
        event passes it moves to your archive, where you can still edit, reuse, or remove it.
      </p>

      <span style={subheadChipStyle} className="subhead-chip">
        Your Events
      </span>

      <div style={{ marginTop: 16 }}>
        {upcoming.length === 0 ? (
          <p style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: 14, color: COLOR.snow, opacity: 0.6, marginBottom: 14 }}>
            No upcoming events.
          </p>
        ) : (
          <div style={{ marginBottom: 16 }}>{upcoming.map((e) => renderCard(e, "upcoming"))}</div>
        )}

        <button type="button" style={primaryBtn} onClick={openAdd}>
          + Add an Event
        </button>

        {archived.length > 0 && (
          <div style={{ marginTop: 22 }}>
            <button
              type="button"
              onClick={() => setShowArchived((v) => !v)}
              style={collapseToggleStyle}
            >
              {showArchived ? "▾" : "▸"} Archived ({archived.length})
            </button>
            {showArchived && <div style={{ marginTop: 10 }}>{archived.map((e) => renderCard(e, "archived"))}</div>}
          </div>
        )}

        {hidden.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <button type="button" onClick={() => setShowDeleted((v) => !v)} style={collapseToggleStyle}>
              {showDeleted ? "▾" : "▸"} Deleted ({hidden.length})
            </button>
            {showDeleted && (
              <div style={{ marginTop: 10 }}>
                <p style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", fontSize: 12, color: COLOR.snow, opacity: 0.55, margin: "0 0 10px" }}>
                  Removed from your profile but kept here. Restore any to bring it back.
                </p>
                {hidden.map((e) => renderCard(e, "deleted"))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const collapseToggleStyle: CSSProperties = {
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
};
