"use client";

// app/alumni/update/studio/JourneyStudioPanel.tsx
//
// Alum-facing Journey Card publisher (Profile Studio → "Journey" tab). Lets a
// logged-in alum publish/edit a Journey Card for their OWN profile slug, and
// take down / restore their own cards. Admins reach this same panel via the
// existing impersonation flow, so the take-down-with-reason + restore controls
// shown here serve both the owner and DAT staff. Writes go to the dedicated
// /api/alumni/journey route (never the spotlight route).

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  COLOR,
  datButtonLocal,
  datButtonGhost,
  labelStyle,
  inputStyle,
  explainStyleLocal,
} from "@/app/alumni/update/updateStyles";
import type { JourneyCard } from "@/lib/journeyCard";

type Props = {
  profileSlug: string;
  isAdmin?: boolean;
  onSaved?: () => void;
};

type Form = {
  id: string;
  program: string;
  location: string;
  country: string;
  year: string;
  dates: string;
  title: string;
  primaryRole: string;
  pullQuote: string;
  heroUrl: string;
  accent: string;
  body: string;
  mediaUrls: string;
  ctaText: string;
  ctaUrl: string;
};

const EMPTY: Form = {
  id: "", program: "", location: "", country: "", year: "", dates: "",
  title: "", primaryRole: "", pullQuote: "", heroUrl: "", accent: "teal",
  body: "", mediaUrls: "", ctaText: "", ctaUrl: "",
};

const ACCENTS = ["teal", "pink", "yellow", "grape"] as const;

const textareaStyle: React.CSSProperties = { ...inputStyle, minHeight: 84, resize: "vertical" };

export default function JourneyStudioPanel({ profileSlug, isAdmin = false, onSaved }: Props) {
  const [cards, setCards] = useState<JourneyCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState<Form>(EMPTY);

  const editing = Boolean(form.id);

  const load = useCallback(async () => {
    if (!profileSlug) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/alumni/journey?slug=${encodeURIComponent(profileSlug)}&includeRemoved=1`,
        { cache: "no-store" }
      );
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || `Failed (${res.status})`);
      setCards(Array.isArray(j.cards) ? j.cards : []);
    } catch (e: any) {
      setError(e?.message || "Couldn't load your Journey Cards.");
    } finally {
      setLoading(false);
    }
  }, [profileSlug]);

  useEffect(() => { void load(); }, [load]);

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const resetForm = () => { setForm(EMPTY); setError(""); };

  const startEdit = (c: JourneyCard) => {
    setForm({
      id: c.id,
      program: c.program ?? "",
      location: c.location ?? "",
      country: c.country ?? "",
      year: c.year ?? "",
      dates: c.dates ?? "",
      title: c.title ?? "",
      primaryRole: c.primaryRole ?? "",
      pullQuote: c.pullQuote ?? "",
      heroUrl: c.heroUrl ?? "",
      accent: c.accent ?? "teal",
      body: c.body ?? "",
      mediaUrls: (c.mediaUrls ?? []).join("\n"),
      ctaText: c.ctaText ?? "",
      ctaUrl: c.ctaUrl ?? "",
    });
    setError("");
    if (typeof window !== "undefined") {
      document.getElementById("studio-journey-anchor")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const save = useCallback(async () => {
    if (!form.title.trim() && !form.program.trim()) {
      setError("Add at least a title or a program.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/alumni/journey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileSlug, ...form }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j?.ok) throw new Error(j?.error || `Failed (${res.status})`);
      setNotice(editing ? "Journey Card updated." : "Journey Card published.");
      resetForm();
      await load();
      onSaved?.();
    } catch (e: any) {
      setError(e?.message || "Couldn't save your Journey Card.");
    } finally {
      setSaving(false);
    }
  }, [form, profileSlug, editing, load, onSaved]);

  const setStatus = useCallback(async (card: JourneyCard, status: "removed" | "live") => {
    let removalReason = "";
    if (status === "removed") {
      const label = card.title || `${card.program} ${card.country} ${card.year}`.trim();
      const ans = typeof window !== "undefined"
        ? window.prompt(`Take down "${label}"?\n\nOptionally add a reason (shown to the artist if a staff member is taking it down):`, "")
        : "";
      if (ans === null) return; // cancelled
      removalReason = ans;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/alumni/journey", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: card.id, status, removalReason }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j?.ok) throw new Error(j?.error || `Failed (${res.status})`);
      setNotice(status === "removed" ? "Journey Card taken down." : "Journey Card restored.");
      await load();
      onSaved?.();
    } catch (e: any) {
      setError(e?.message || "Couldn't update the Journey Card.");
    } finally {
      setSaving(false);
    }
  }, [load, onSaved]);

  const live = useMemo(() => cards.filter((c) => !c.removed), [cards]);
  const removed = useMemo(() => cards.filter((c) => c.removed), [cards]);

  return (
    <div id="studio-journey-anchor">
      <p style={explainStyleLocal}>
        Publish a Journey Card — your own post-program record of a DAT journey. It appears on your{" "}
        <a href={`/journeys/${profileSlug}`} style={{ color: COLOR.teal }} target="_blank" rel="noreferrer">journeys page</a>{" "}
        and in the public archive. Every card carries the note that it’s your individual reflection, not necessarily the views of DAT.
        Edit or take down your cards anytime — nothing is ever erased.
      </p>

      {error && <p style={{ ...explainStyleLocal, color: "#ff6b6b" }}>{error}</p>}
      {notice && <p style={{ ...explainStyleLocal, color: COLOR.teal }}>{notice}</p>}

      {/* ── Form ── */}
      <div style={{ display: "grid", gap: 12, marginBottom: 18 }}>
        <p style={{
          fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
          fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase",
          fontSize: 12, color: COLOR.snow, opacity: 0.9, margin: 0,
        }}>
          {editing ? "Edit Journey Card" : "New Journey Card"}
        </p>

        <Two>
          <Field label="Program" help='e.g. PASSAGE, ACTion, Teaching Artist Residency'>
            <input style={inputStyle} value={form.program} onChange={set("program")} placeholder="PASSAGE" />
          </Field>
          <Field label="Year">
            <input style={inputStyle} value={form.year} onChange={set("year")} placeholder="2026" />
          </Field>
        </Two>

        <Two>
          <Field label="Country" help="Shown big on the card (e.g. SLOVAKIA).">
            <input style={inputStyle} value={form.country} onChange={set("country")} placeholder="Slovakia" />
          </Field>
          <Field label="Location" help="Optional city/region.">
            <input style={inputStyle} value={form.location} onChange={set("location")} placeholder="Košice" />
          </Field>
        </Two>

        <Field label="Dates" help="Optional, e.g. July 12 – August 2, 2026.">
          <input style={inputStyle} value={form.dates} onChange={set("dates")} placeholder="July 12 – August 2, 2026" />
        </Field>

        <Field label="Title" help="Your story’s title.">
          <input style={inputStyle} value={form.title} onChange={set("title")} placeholder="Voices of the Village" />
        </Field>

        <Field label="Your role" help="How you traveled — e.g. Teaching Artist · Cohort Lead.">
          <input style={inputStyle} value={form.primaryRole} onChange={set("primaryRole")} placeholder="Teaching Artist" />
        </Field>

        <Field label="Pull quote" help="One line that captures the journey.">
          <textarea style={textareaStyle} value={form.pullQuote} onChange={set("pullQuote")}
            placeholder="I arrived thinking I was here to teach. I left knowing how much I had been taught." />
        </Field>

        <Field label="Hero image URL" help="Direct link to an image (ends in .jpg, .png, .webp).">
          <input style={inputStyle} type="url" value={form.heroUrl} onChange={set("heroUrl")} placeholder="https://… cover photo" />
        </Field>

        <Field label="Accent color">
          <select style={inputStyle} value={form.accent} onChange={set("accent")}>
            {ACCENTS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </Field>

        <Field label="Story" help="A few paragraphs. Separate paragraphs with a blank line.">
          <textarea style={{ ...textareaStyle, minHeight: 140 }} value={form.body} onChange={set("body")}
            placeholder="Tell the story of your journey…" />
        </Field>

        <Field label="More photos" help="Optional — one direct image URL per line.">
          <textarea style={textareaStyle} value={form.mediaUrls} onChange={set("mediaUrls")}
            placeholder={"https://… photo one\nhttps://… photo two"} />
        </Field>

        <Two>
          <Field label="Button text" help="Optional call-to-action.">
            <input style={inputStyle} value={form.ctaText} onChange={set("ctaText")} placeholder="e.g. Read more" />
          </Field>
          <Field label="Button link">
            <input style={inputStyle} type="url" value={form.ctaUrl} onChange={set("ctaUrl")} placeholder="https://…" />
          </Field>
        </Two>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button type="button" style={{ ...datButtonLocal, opacity: saving ? 0.6 : 1 }} disabled={saving} onClick={save}>
            {saving ? "Saving…" : editing ? "Update card" : "Publish card"}
          </button>
          {editing && (
            <button type="button" style={datButtonGhost} disabled={saving} onClick={resetForm}>
              Cancel edit
            </button>
          )}
        </div>
      </div>

      {/* ── Existing cards ── */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.12)", paddingTop: 14 }}>
        {loading ? (
          <p style={explainStyleLocal}>Loading your Journey Cards…</p>
        ) : cards.length === 0 ? (
          <p style={explainStyleLocal}>No Journey Cards yet — publish your first one above.</p>
        ) : (
          <>
            {live.map((c) => (
              <CardRow key={c.id} card={c} onEdit={() => startEdit(c)} onTakedown={() => setStatus(c, "removed")} disabled={saving} />
            ))}
            {removed.length > 0 && (
              <>
                <p style={{ ...explainStyleLocal, marginTop: 14, opacity: 0.7 }}>
                  Taken down {isAdmin ? "(reason stored; artist notified when DAT removes a card)" : ""}
                </p>
                {removed.map((c) => (
                  <CardRow key={c.id} card={c} removed onEdit={() => startEdit(c)} onRestore={() => setStatus(c, "live")} disabled={saving} />
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Small presentational helpers ──────────────────────────────────────────────

function Two({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>{children}</div>;
}

function Field({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={labelStyle}>{label}</div>
      {children}
      {help ? <p style={{ ...explainStyleLocal, marginTop: 6, marginBottom: 0 }}>{help}</p> : null}
    </div>
  );
}

function CardRow({
  card, removed = false, onEdit, onTakedown, onRestore, disabled,
}: {
  card: JourneyCard;
  removed?: boolean;
  onEdit: () => void;
  onTakedown?: () => void;
  onRestore?: () => void;
  disabled?: boolean;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12, padding: "10px 0",
      borderBottom: "1px solid rgba(255,255,255,0.08)", opacity: removed ? 0.6 : 1,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
          fontWeight: 700, fontSize: 14, color: COLOR.snow, margin: 0,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {card.title || card.programLabel || "Untitled journey"}
        </p>
        <p style={{ ...explainStyleLocal, margin: "2px 0 0" }}>
          {card.programLabel}{removed && card.removalReason ? ` · reason: ${card.removalReason}` : ""}
        </p>
      </div>
      <a href={card.href} target="_blank" rel="noreferrer" style={{ ...datButtonGhost, padding: "8px 12px", fontSize: 12 }}>View</a>
      <button type="button" style={{ ...datButtonGhost, padding: "8px 12px", fontSize: 12 }} disabled={disabled} onClick={onEdit}>Edit</button>
      {removed ? (
        <button type="button" style={{ ...datButtonGhost, padding: "8px 12px", fontSize: 12 }} disabled={disabled} onClick={onRestore}>Restore</button>
      ) : (
        <button type="button" style={{ ...datButtonGhost, padding: "8px 12px", fontSize: 12, borderColor: "rgba(255,107,107,0.5)", color: "#ff9a9a" }} disabled={disabled} onClick={onTakedown}>Take down</button>
      )}
    </div>
  );
}
