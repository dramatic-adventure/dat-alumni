"use client";

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  getActiveTagsForLayer,
  getSeededTagsForLayer,
  LAYER_HELPER_COPY,
  LAYER_LABELS,
  SELECTION_LIMITS,
  searchTokensFor,
  type TaxonomyLayer,
  type TaxonomyTag,
} from "@/lib/alumniTaxonomy";

type UploadKind = "headshot" | "album" | "reel" | "event";

type IdentityPanelProps = {
  explainStyleLocal: CSSProperties;
  subheadChipStyle: CSSProperties;
  labelStyle: CSSProperties;
  inputStyle: CSSProperties;
  datButtonLocal: CSSProperties;

  loading: boolean;
  isDirty?: boolean;

  profile: any;
  setProfile: (updater: any) => void;

  renderFieldsOrNull: (keys: string[]) => ReactNode;

  MODULES: Record<string, { fieldKeys: string[]; uploadKinds: UploadKind[] }>;

  saveCategory: (args: {
    tag: string;
    fieldKeys?: string[];
    uploadKinds?: UploadKind[];
    afterSave?: () => void;
    profileOverride?: any;
  }) => void;
};

const LAYER_TO_PROFILE_KEY: Record<TaxonomyLayer, string> = {
  identity: "identityTags",
  practice: "practiceTags",
  exploreCare: "exploreCareTags",
};

function parseCommaList(raw: string | undefined | null): string[] {
  if (!raw) return [];
  return String(raw)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function joinCommaList(values: string[]): string {
  return values.join(", ");
}

function matchesSearch(tag: TaxonomyTag, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return searchTokensFor(tag).some((tok) => tok.toLowerCase().includes(q));
}

/* ---------------- Styles shared across layer pickers ---------------- */

const tipStyle: CSSProperties = {
  marginTop: 6,
  marginBottom: 0,
  fontSize: "0.74rem",
  opacity: 0.6,
  fontFamily:
    'var(--font-dm-sans), system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  color: "#d9d9d9",
};

const fieldBlockStyle: CSSProperties = {
  display: "grid",
  gap: 8,
  marginBottom: 24,
};

const chipRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
  marginTop: 10,
};

const chipStyle: CSSProperties = {
  borderRadius: 999,
  border: "1px solid rgba(148, 115, 255, 0.55)",
  padding: "4px 10px",
  fontSize: "0.72rem",
  textTransform: "none",
  letterSpacing: "0.02em",
  backgroundColor: "rgba(19, 7, 44, 0.8)",
  color: "#f2f2f2",
  cursor: "pointer",
  fontFamily:
    'var(--font-dm-sans), system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
};

const chipActiveStyle: CSSProperties = {
  ...chipStyle,
  backgroundColor: "#ffcc00",
  color: "#241123",
  borderColor: "rgba(24, 8, 32, 0.9)",
  fontWeight: 600,
};

const chipDisabledStyle: CSSProperties = {
  ...chipStyle,
  opacity: 0.4,
  cursor: "not-allowed",
};

const linkButtonStyle: CSSProperties = {
  background: "none",
  border: "none",
  padding: 0,
  color: "#a79bff",
  cursor: "pointer",
  fontSize: "0.74rem",
  textDecoration: "underline",
  fontFamily:
    'var(--font-dm-sans), system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const suggestionBoxStyle: CSSProperties = {
  marginTop: 10,
  padding: 12,
  borderRadius: 8,
  backgroundColor: "rgba(19, 7, 44, 0.5)",
  border: "1px solid rgba(148, 115, 255, 0.35)",
  display: "grid",
  gap: 8,
};

/* ---------------- Layer picker subcomponent ---------------- */

function LayerPicker({
  layer,
  profile,
  setProfile,
  loading,
  labelStyle,
  inputStyle,
}: {
  layer: TaxonomyLayer;
  profile: any;
  setProfile: (updater: any) => void;
  loading: boolean;
  labelStyle: CSSProperties;
  inputStyle: CSSProperties;
}) {
  const profileKey = LAYER_TO_PROFILE_KEY[layer];
  const limit = SELECTION_LIMITS[layer];
  const active = useMemo(
    () => parseCommaList(profile[profileKey]),
    [profile, profileKey]
  );
  const activeLowerSet = useMemo(
    () => new Set(active.map((v) => v.toLowerCase())),
    [active]
  );

  const seeded = useMemo(() => getSeededTagsForLayer(layer), [layer]);
  const all = useMemo(() => getActiveTagsForLayer(layer), [layer]);

  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestLabel, setSuggestLabel] = useState("");
  const [suggestRationale, setSuggestRationale] = useState("");
  const [suggestState, setSuggestState] = useState<
    "idle" | "sending" | "ok" | "error"
  >("idle");

  const visible = useMemo(() => {
    if (!expanded) return seeded;
    return all.filter((t) => matchesSearch(t, query));
  }, [expanded, seeded, all, query]);

  const atLimit = active.length >= limit;

  function isActive(tag: TaxonomyTag): boolean {
    return activeLowerSet.has(tag.label.toLowerCase());
  }

  function toggle(tag: TaxonomyTag) {
    setProfile((p: any) => {
      const list = parseCommaList(p[profileKey]);
      const idx = list.findIndex((v) => v.toLowerCase() === tag.label.toLowerCase());
      if (idx >= 0) {
        list.splice(idx, 1);
      } else {
        if (list.length >= limit) return p;
        list.push(tag.label);
      }
      return { ...p, [profileKey]: joinCommaList(list) };
    });
  }

  async function submitSuggestion() {
    const label = suggestLabel.trim();
    if (!label) return;
    setSuggestState("sending");
    try {
      const res = await fetch("/api/alumni/tag-suggestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          layer,
          label,
          rationale: suggestRationale.trim(),
          slug: profile?.slug || "",
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setSuggestState("ok");
      setSuggestLabel("");
      setSuggestRationale("");
    } catch {
      setSuggestState("error");
    }
  }

  return (
    <div style={fieldBlockStyle}>
      <label style={labelStyle}>{LAYER_LABELS[layer]}</label>
      <p style={{ ...tipStyle, marginTop: 0, marginBottom: 6 }}>
        {LAYER_HELPER_COPY[layer]}
      </p>

      {/* Current selections summary */}
      <p style={tipStyle}>
        {active.length === 0
          ? `Pick up to ${limit}.`
          : `${active.length} of ${limit} selected${
              atLimit ? " — deselect to swap." : "."
            }`}
      </p>

      {/* Search (only when expanded) */}
      {expanded && (
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ ...inputStyle, marginTop: 8 }}
          placeholder="Search tags…"
          disabled={loading}
        />
      )}

      {/* Chips */}
      <div style={chipRowStyle}>
        {visible.map((tag) => {
          const selected = isActive(tag);
          const disabled = !selected && atLimit;
          const style = selected
            ? chipActiveStyle
            : disabled
              ? chipDisabledStyle
              : chipStyle;
          return (
            <button
              key={tag.id}
              type="button"
              style={style}
              disabled={loading || (disabled && !selected)}
              onClick={() => toggle(tag)}
              aria-pressed={selected}
            >
              {tag.label}
            </button>
          );
        })}
        {expanded && visible.length === 0 && (
          <span style={tipStyle}>No tags match “{query}”.</span>
        )}
      </div>

      {/* Expand / collapse */}
      {all.length > seeded.length && (
        <div style={{ marginTop: 10, display: "flex", gap: 16, flexWrap: "wrap" }}>
          <button
            type="button"
            style={linkButtonStyle}
            disabled={loading}
            onClick={() => {
              setExpanded((v) => !v);
              setQuery("");
            }}
          >
            {expanded ? "Show fewer" : "Show more"}
          </button>
          <button
            type="button"
            style={linkButtonStyle}
            disabled={loading}
            onClick={() => setSuggestOpen((v) => !v)}
          >
            {suggestOpen ? "Cancel request" : "Request a new tag"}
          </button>
        </div>
      )}
      {all.length <= seeded.length && (
        <div style={{ marginTop: 10 }}>
          <button
            type="button"
            style={linkButtonStyle}
            disabled={loading}
            onClick={() => setSuggestOpen((v) => !v)}
          >
            {suggestOpen ? "Cancel request" : "Request a new tag"}
          </button>
        </div>
      )}

      {/* Suggestion form */}
      {suggestOpen && (
        <div style={suggestionBoxStyle}>
          <label style={{ ...labelStyle, fontSize: "0.8rem" }}>
            Suggest a tag for “{LAYER_LABELS[layer]}”
          </label>
          <input
            value={suggestLabel}
            onChange={(e) => setSuggestLabel(e.target.value)}
            style={inputStyle}
            placeholder="Proposed tag label"
            disabled={loading || suggestState === "sending"}
          />
          <textarea
            value={suggestRationale}
            onChange={(e) => setSuggestRationale(e.target.value)}
            style={{ ...inputStyle, minHeight: 60, resize: "vertical" }}
            placeholder="Optional: why this tag matters"
            disabled={loading || suggestState === "sending"}
          />
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              type="button"
              style={linkButtonStyle}
              disabled={
                loading || suggestState === "sending" || !suggestLabel.trim()
              }
              onClick={submitSuggestion}
            >
              {suggestState === "sending" ? "Sending…" : "Send suggestion"}
            </button>
            {suggestState === "ok" && (
              <span style={{ ...tipStyle, color: "#9ee5a6" }}>
                Thanks — your suggestion is in the queue for review.
              </span>
            )}
            {suggestState === "error" && (
              <span style={{ ...tipStyle, color: "#f5a6a6" }}>
                Couldn’t send. Please try again.
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Panel ---------------- */

export default function IdentityPanel({
  explainStyleLocal,
  subheadChipStyle,
  labelStyle,
  inputStyle,
  datButtonLocal,
  loading,
  isDirty = false,
  profile,
  setProfile,
  renderFieldsOrNull,
  MODULES,
  saveCategory,
}: IdentityPanelProps) {
  const pronounPresets = ["she/her", "he/him", "they/them", "she/they", "he/they"];
  const languagePresets = ["English", "Español", "Slovenský", "Shuar-Chicham"];

  function toggleLanguagePreset(lang: string) {
    setProfile((p: any) => {
      const list = parseCommaList(p.languages);
      const idx = list.findIndex((v) => v.toLowerCase() === lang.toLowerCase());
      if (idx >= 0) list.splice(idx, 1);
      else list.push(lang);
      return { ...p, languages: joinCommaList(list) };
    });
  }

  const allIdentityKeys = MODULES["Identity"].fieldKeys;

  return (
    <div>
      <div id="studio-identity-anchor" />

      <p style={explainStyleLocal}>
        Identity helps us represent you accurately, invite you into the right rooms,
        and connect you with collaborators who share your communities, causes, and
        creative language.
      </p>

      <span style={subheadChipStyle} className="subhead-chip">
        Identity
      </span>

      {renderFieldsOrNull(allIdentityKeys) ?? (
        <div style={{ marginTop: 24 }}>
          {/* Current role / title */}
          <div style={fieldBlockStyle}>
            <label style={labelStyle}>Current role / title</label>
            <input
              value={profile.currentTitle || ""}
              onChange={(e) =>
                setProfile((p: any) => ({ ...p, currentTitle: e.target.value }))
              }
              style={inputStyle}
              placeholder="e.g. Artistic Director, Freelance Actor, Teaching Artist…"
              disabled={loading}
            />
            <p style={tipStyle}>
              How would you introduce yourself in a room right now? This appears
              prominently on your public profile.
            </p>
          </div>

          {/* Pronouns */}
          <div style={fieldBlockStyle}>
            <label style={labelStyle}>Pronouns</label>
            <input
              value={profile.pronouns || ""}
              onChange={(e) =>
                setProfile((p: any) => ({ ...p, pronouns: e.target.value }))
              }
              style={inputStyle}
              placeholder="she/her, he/him, they/them…"
              disabled={loading}
            />
            <div style={chipRowStyle}>
              {pronounPresets.map((option) => {
                const isActive =
                  (profile.pronouns || "").toString().toLowerCase().trim() ===
                  option.toLowerCase();
                return (
                  <button
                    key={option}
                    type="button"
                    style={isActive ? chipActiveStyle : chipStyle}
                    disabled={loading}
                    onClick={() =>
                      setProfile((p: any) => ({ ...p, pronouns: option }))
                    }
                  >
                    {option}
                  </button>
                );
              })}
            </div>
            <p style={tipStyle}>Optional. Leave blank if you prefer not to share.</p>
          </div>

          {/* Three taxonomy layers */}
          <LayerPicker
            layer="identity"
            profile={profile}
            setProfile={setProfile}
            loading={loading}
            labelStyle={labelStyle}
            inputStyle={inputStyle}
          />
          <LayerPicker
            layer="practice"
            profile={profile}
            setProfile={setProfile}
            loading={loading}
            labelStyle={labelStyle}
            inputStyle={inputStyle}
          />
          <LayerPicker
            layer="exploreCare"
            profile={profile}
            setProfile={setProfile}
            loading={loading}
            labelStyle={labelStyle}
            inputStyle={inputStyle}
          />

          {/* Languages */}
          <div style={fieldBlockStyle}>
            <label style={labelStyle}>Languages you work in</label>
            <input
              value={profile.languages || ""}
              onChange={(e) =>
                setProfile((p: any) => ({ ...p, languages: e.target.value }))
              }
              style={inputStyle}
              placeholder="Comma-separated: e.g. English, Español, Slovenský…"
              disabled={loading}
            />
            <div style={chipRowStyle}>
              {languagePresets.map((lang) => {
                const isActive = parseCommaList(profile.languages).some(
                  (t) => t.toLowerCase() === lang.toLowerCase()
                );
                return (
                  <button
                    key={lang}
                    type="button"
                    style={isActive ? chipActiveStyle : chipStyle}
                    disabled={loading}
                    onClick={() => toggleLanguagePreset(lang)}
                  >
                    {lang}
                  </button>
                );
              })}
            </div>
            <p style={tipStyle}>
              Include any languages you create, teach, perform, or collaborate in.
            </p>
          </div>
        </div>
      )}

      {/* One save button */}
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
          style={datButtonLocal}
          className="dat-btn"
          disabled={loading}
          onClick={() =>
            saveCategory({
              tag: "Identity",
              fieldKeys: MODULES["Identity"].fieldKeys,
              uploadKinds: [],
            })
          }
        >
          Save Identity
        </button>
      </div>
    </div>
  );
}
