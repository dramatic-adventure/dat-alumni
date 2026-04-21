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

/* ---------------- Shared styles ---------------- */

const FF =
  'var(--font-dm-sans), system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const tipStyle: CSSProperties = {
  marginTop: 6,
  marginBottom: 0,
  fontSize: "0.74rem",
  opacity: 0.6,
  fontFamily: FF,
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
  marginTop: 8,
};

/* Pronouns / language preset chips (compact, pill) */
const presetChip: CSSProperties = {
  borderRadius: 999,
  border: "1px solid rgba(148, 115, 255, 0.55)",
  padding: "4px 10px",
  fontSize: "0.72rem",
  textTransform: "none",
  letterSpacing: "0.02em",
  backgroundColor: "rgba(19, 7, 44, 0.8)",
  color: "#f2f2f2",
  cursor: "pointer",
  fontFamily: FF,
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
};

const presetChipActive: CSSProperties = {
  ...presetChip,
  backgroundColor: "#ffcc00",
  color: "#241123",
  borderColor: "rgba(24, 8, 32, 0.9)",
  fontWeight: 600,
};

/* Taxonomy tag chips — lighter, cleaner */
const tagBase: CSSProperties = {
  borderRadius: 999,
  padding: "5px 12px",
  fontSize: "0.75rem",
  letterSpacing: "0.015em",
  cursor: "pointer",
  fontFamily: FF,
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  transition: "background 0.12s, border-color 0.12s, opacity 0.12s",
  lineHeight: 1.3,
};

const tagIdle: CSSProperties = {
  ...tagBase,
  background: "transparent",
  border: "1px solid rgba(255,255,255,0.22)",
  color: "rgba(255,255,255,0.82)",
};

const tagSelected: CSSProperties = {
  ...tagBase,
  background: "#ffcc00",
  border: "1px solid rgba(24,8,32,0.45)",
  color: "#241123",
  fontWeight: 700,
};

const tagDisabled: CSSProperties = {
  ...tagBase,
  background: "transparent",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "rgba(255,255,255,0.25)",
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
  fontFamily: FF,
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

/* ---------------- LayerPicker ---------------- */

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

  const atLimit = active.length >= limit;

  // Always surface currently-selected tags so they stay visible even when
  // they aren't in the seeded pool (e.g. loaded from a previous session).
  const visible = useMemo(() => {
    const pool = expanded
      ? all.filter((t) => matchesSearch(t, query))
      : seeded;
    const poolIds = new Set(pool.map((t) => t.id));
    const alwaysShow = all.filter(
      (t) => activeLowerSet.has(t.label.toLowerCase()) && !poolIds.has(t.id)
    );
    return [...alwaysShow, ...pool];
  }, [expanded, seeded, all, query, activeLowerSet]);

  function isActive(tag: TaxonomyTag): boolean {
    return activeLowerSet.has(tag.label.toLowerCase());
  }

  function toggle(tag: TaxonomyTag) {
    setProfile((p: any) => {
      const list = parseCommaList(p[profileKey]);
      const idx = list.findIndex(
        (v) => v.toLowerCase() === tag.label.toLowerCase()
      );
      if (idx >= 0) {
        list.splice(idx, 1);
      } else {
        if (list.length >= limit) return p; // enforce limit
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

  // Inline count badge next to label
  const countSuffix =
    active.length > 0
      ? ` · ${active.length}/${limit}${atLimit ? " — deselect to swap" : ""}`
      : "";

  return (
    <div style={fieldBlockStyle}>
      {/* Label row: name + count badge */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <label style={labelStyle}>
          {LAYER_LABELS[layer]}
          {countSuffix && (
            <span
              style={{
                fontWeight: 400,
                fontSize: "0.72rem",
                opacity: 0.65,
                marginLeft: 6,
                color: atLimit ? "#f5c542" : undefined,
              }}
            >
              {countSuffix}
            </span>
          )}
        </label>
      </div>

      <p style={{ ...tipStyle, marginTop: 0, marginBottom: 2 }}>
        {LAYER_HELPER_COPY[layer]}
      </p>

      {/* Search — only when expanded */}
      {expanded && (
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ ...inputStyle, marginTop: 6, marginBottom: 4 }}
          placeholder="Filter options…"
          disabled={loading}
        />
      )}

      {/* Chip grid */}
      <div style={{ ...chipRowStyle, marginTop: 10 }}>
        {visible.map((tag) => {
          const sel = isActive(tag);
          const dis = !sel && atLimit;
          const style = sel ? tagSelected : dis ? tagDisabled : tagIdle;
          return (
            <button
              key={tag.id}
              type="button"
              style={style}
              disabled={loading || dis}
              onClick={() => toggle(tag)}
              aria-pressed={sel}
            >
              {sel && (
                <span style={{ fontSize: "0.6rem", lineHeight: 1, opacity: 0.8 }}>
                  ✓
                </span>
              )}
              {tag.label}
            </button>
          );
        })}
        {expanded && query.trim() && visible.length === 0 && (
          <span style={tipStyle}>No tags match "{query}".</span>
        )}
      </div>

      {/* Footer links */}
      <div
        style={{
          marginTop: 10,
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {all.length > seeded.length && (
          <button
            type="button"
            style={linkButtonStyle}
            disabled={loading}
            onClick={() => {
              setExpanded((v) => !v);
              setQuery("");
            }}
          >
            {expanded
              ? "Show fewer options"
              : `Show all ${all.length} options`}
          </button>
        )}
        <button
          type="button"
          style={linkButtonStyle}
          disabled={loading}
          onClick={() => setSuggestOpen((v) => !v)}
        >
          {suggestOpen ? "Cancel" : "Suggest a tag"}
        </button>
      </div>

      {/* Suggestion form */}
      {suggestOpen && (
        <div style={suggestionBoxStyle}>
          <label style={{ ...labelStyle, fontSize: "0.8rem" }}>
            Suggest a tag for "{LAYER_LABELS[layer]}"
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
                loading ||
                suggestState === "sending" ||
                !suggestLabel.trim()
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
                Couldn't send. Please try again.
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

  function togglePresetList(
    fieldKey: string,
    value: string
  ) {
    setProfile((p: any) => {
      const list = parseCommaList(p[fieldKey]);
      const idx = list.findIndex((v) => v.toLowerCase() === value.toLowerCase());
      if (idx >= 0) list.splice(idx, 1);
      else list.push(value);
      return { ...p, [fieldKey]: joinCommaList(list) };
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

      {/* Eyebrow with extra breathing room below */}
      <div style={{ marginBottom: 20 }}>
        <span style={subheadChipStyle} className="subhead-chip">
          Identity
        </span>
      </div>

      {renderFieldsOrNull(allIdentityKeys) ?? (
        <div style={{ marginTop: 8 }}>
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

          {/* Pronouns + Languages — same row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 20,
              marginBottom: 24,
            }}
          >
            {/* Pronouns */}
            <div style={{ display: "grid", gap: 8 }}>
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
                  const isOn =
                    (profile.pronouns || "").toString().toLowerCase().trim() ===
                    option.toLowerCase();
                  return (
                    <button
                      key={option}
                      type="button"
                      style={isOn ? presetChipActive : presetChip}
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
              <p style={tipStyle}>Optional. Leave blank to not share.</p>
            </div>

            {/* Languages */}
            <div style={{ display: "grid", gap: 8 }}>
              <label style={labelStyle}>Languages</label>
              <input
                value={profile.languages || ""}
                onChange={(e) =>
                  setProfile((p: any) => ({ ...p, languages: e.target.value }))
                }
                style={inputStyle}
                placeholder="English, Español, Slovenský…"
                disabled={loading}
              />
              <div style={chipRowStyle}>
                {languagePresets.map((lang) => {
                  const isOn = parseCommaList(profile.languages).some(
                    (t) => t.toLowerCase() === lang.toLowerCase()
                  );
                  return (
                    <button
                      key={lang}
                      type="button"
                      style={isOn ? presetChipActive : presetChip}
                      disabled={loading}
                      onClick={() => togglePresetList("languages", lang)}
                    >
                      {lang}
                    </button>
                  );
                })}
              </div>
              <p style={tipStyle}>
                Languages you create, teach, perform, or collaborate in.
              </p>
            </div>
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
        </div>
      )}

      {/* Save button */}
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
