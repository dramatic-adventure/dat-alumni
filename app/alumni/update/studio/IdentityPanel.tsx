"use client";

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  getActiveTagsForLayer,
  LAYER_HELPER_COPY,
  LAYER_LABELS,
  SELECTION_LIMITS,
  type TaxonomyLayer,
  type TaxonomyTag,
} from "@/lib/alumniTaxonomy";
import { datButtonGhost } from "@/app/alumni/update/updateStyles";

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

  renderFieldsOrNull?: (keys: string[]) => ReactNode; // retained for prop-compat; Identity always renders its own UI

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
  marginBottom: 32,
};

const chipRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  marginTop: 8,
};

/* Pronouns / language preset chips — DAT BLUE idle, DAT BLUE active */
const presetChip: CSSProperties = {
  borderRadius: 14,
  border: "1px solid rgba(36,147,169,0.5)",   /* DAT BLUE #2493A9 */
  padding: "6px 13px",
  fontSize: "0.8rem",
  letterSpacing: "0.02em",
  background: "transparent",
  color: "#f2f2f2",
  cursor: "pointer",
  fontFamily: FF,
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  fontWeight: 500,
  opacity: 0.8,
  transition: "background 0.15s, border-color 0.15s, opacity 0.15s",
};

const presetChipActive: CSSProperties = {
  ...presetChip,
  background: "rgba(36,147,169,0.8)",          /* DAT BLUE #2493A9 — muted active */
  color: "#f2f2f2",                            /* DAT WHITE */
  border: "1px solid rgba(36,147,169,0.6)",
  fontWeight: 600,
  opacity: 1,
};

/* Taxonomy tag chips — same base as ContactPanel platform chips */
const tagChipBase: CSSProperties = {
  ...datButtonGhost,
  padding: "7px 13px",
  fontSize: "0.82rem",
  letterSpacing: "0.02em",
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  lineHeight: 1.3,
  transition: "background 0.15s, border-color 0.15s, opacity 0.15s",
};

/* idle: muted ghost — identical to ContactPanel unselected */
const tagIdle: CSSProperties = {
  ...tagChipBase,
  fontWeight: 500,
  background: "transparent",
  border: "1px solid rgba(255,255,255,0.4)",
  opacity: 0.6,
};

/* selected: DAT PURPLE tint — identical to ContactPanel selected */
const tagSelected: CSSProperties = {
  ...tagChipBase,
  fontWeight: 700,
  background: "rgba(108,0,175,0.22)",
  border: "1px solid rgba(108,0,175,0.7)",
  opacity: 1,
};

/* disabled: at-limit unselected */
const tagDisabled: CSSProperties = {
  ...tagChipBase,
  fontWeight: 500,
  background: "transparent",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "rgba(255,255,255,0.22)",
  cursor: "not-allowed",
  opacity: 0.35,
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
  marginTop: 12,
  padding: 12,
  borderRadius: 8,
  backgroundColor: "rgba(19, 7, 44, 0.5)",
  border: "1px solid rgba(148, 115, 255, 0.35)",
  display: "grid",
  gap: 8,
};

/* Card container */
const layerCardStyle: CSSProperties = {
  borderRadius: 12,
  border: "1px solid rgba(148,115,255,0.18)",
  background: "rgba(0,0,0,0.15)",
  padding: "14px 18px",
  marginBottom: 14,
};

const layerTitleStyle: CSSProperties = {
  fontSize: "0.88rem",
  fontWeight: 600,
  letterSpacing: "0.01em",
  color: "#f2f2f2",                            /* white */
  fontFamily: FF,
  lineHeight: 1.3,
};

const layerHelpStyle: CSSProperties = {
  margin: "4px 0 0",
  fontSize: "0.74rem",
  lineHeight: 1.5,
  opacity: 0.72,
  fontFamily: FF,
  color: "#d9d9d9",
};

/* ---------------- Language level helpers ---------------- */

const LANGUAGE_LEVELS = ["Conversational", "Working", "Fluent", "Native"] as const;
type LangEntry = { lang: string; level: string };

function parseLangEntries(raw: string | undefined | null): LangEntry[] {
  return parseCommaList(raw).map((s) => {
    const m = s.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
    return m ? { lang: m[1].trim(), level: m[2].trim() } : { lang: s.trim(), level: "" };
  });
}

function formatLangEntries(entries: LangEntry[]): string {
  return entries.map((e) => (e.level ? `${e.lang} (${e.level})` : e.lang)).join(", ");
}

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

  const all = useMemo(() => getActiveTagsForLayer(layer), [layer]);

  // Open by default if the user already has selections; closed otherwise
  const [isOpen, setIsOpen] = useState(() => parseCommaList(profile[profileKey]).length > 0);

  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestLabel, setSuggestLabel] = useState("");
  const [suggestRationale, setSuggestRationale] = useState("");
  const [suggestState, setSuggestState] = useState<
    "idle" | "sending" | "ok" | "error"
  >("idle");
  const [suggestError, setSuggestError] = useState("");

  const atLimit = active.length >= limit;

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
      const j = await res.json().catch(() => ({}));
      if (!res.ok || j?.ok === false) {
        throw new Error(j?.note || j?.error || `Status ${res.status}`);
      }
      setSuggestState("ok");
      setSuggestLabel("");
      setSuggestRationale("");
    } catch (err: any) {
      setSuggestError(err?.message || "Unknown error");
      setSuggestState("error");
    }
  }

  return (
    <div style={{
      ...layerCardStyle,
      border: isOpen
        ? "1px solid rgba(148,115,255,0.18)"
        : "1px solid rgba(148,115,255,0.35)",
    }}>
      {/* Card header — always visible, clicking toggles open/close */}
      <button
        type="button"
        className="layer-card-header"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          width: "100%",
          background: "none",
          border: "none",
          padding: "4px 6px",
          margin: "-4px -6px",
          borderRadius: 8,
          cursor: "pointer",
          textAlign: "left",
        }}
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
      >
        {/* Left: title + help text */}
        <div style={{ flex: 1 }}>
          <div style={layerTitleStyle}>{LAYER_LABELS[layer]}</div>
          <p style={{ ...layerHelpStyle, marginTop: 2 }}>
            {!isOpen && active.length > 0
              ? `${active.length} of ${limit} selected`
              : LAYER_HELPER_COPY[layer]}
          </p>
        </div>
        {/* Right: count badge + chevron */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "3px 9px",
              borderRadius: 999,
              fontSize: "0.7rem",
              fontWeight: 600,
              fontFamily: FF,
              background: atLimit
                ? "rgba(245,197,66,0.15)"
                : active.length > 0
                ? "rgba(148,115,255,0.15)"
                : "rgba(255,255,255,0.06)",
              border: atLimit
                ? "1px solid rgba(245,197,66,0.45)"
                : active.length > 0
                ? "1px solid rgba(148,115,255,0.4)"
                : "1px solid rgba(255,255,255,0.12)",
              color: atLimit ? "#f5c542" : active.length > 0 ? "#c4b5fd" : "rgba(255,255,255,0.4)",
            }}
          >
            {active.length > 0 ? `${active.length} / ${limit}` : `up to ${limit}`}
          </span>
          {/* Chevron — far right, standard accordion affordance */}
          <span style={{
            fontSize: "1.1rem",
            color: "rgba(255,255,255,0.75)",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
            display: "inline-block",
            lineHeight: 1,
          }}>▾</span>
        </div>
      </button>

      {/* Collapsed summary — selected chips only */}
      {!isOpen && active.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
          {active.map((label) => (
            <span
              key={label}
              style={{
                ...tagSelected,
                cursor: "default",
                fontSize: "0.78rem",
                padding: "5px 11px",
              }}
            >
              <span style={{ marginRight: 3, fontSize: "0.65em", opacity: 0.8 }}>✓</span>
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Expanded body */}
      {isOpen && (
        <>
          {/* Tag chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
            {all.map((tag) => {
              const sel = isActive(tag);
              const dis = !sel && atLimit;
              return (
                <button
                  key={tag.id}
                  type="button"
                  style={sel ? tagSelected : dis ? tagDisabled : tagIdle}
                  disabled={loading || dis}
                  onClick={() => toggle(tag)}
                  aria-pressed={sel}
                >
                  {sel && (
                    <span style={{ marginRight: 3, fontSize: "0.65em", opacity: 0.8 }}>✓</span>
                  )}
                  {tag.label}
                </button>
              );
            })}
          </div>

          {/* At-limit nudge */}
          {atLimit && (
            <p style={{ marginTop: 10, marginBottom: 0, fontSize: "0.72rem", color: "#f5c542", opacity: 0.8, fontFamily: FF }}>
              {limit} selected — deselect one to swap.
            </p>
          )}

          {/* Suggest link */}
          <div style={{ marginTop: 14 }}>
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
              <label style={{ ...layerTitleStyle, fontSize: "0.8rem" }}>
                Suggest a tag for &ldquo;{LAYER_LABELS[layer]}&rdquo;
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
                  disabled={loading || suggestState === "sending" || !suggestLabel.trim()}
                  onClick={submitSuggestion}
                >
                  {suggestState === "sending" ? "Sending…" : "Send suggestion"}
                </button>
                {suggestState === "ok" && (
                  <span style={{ ...layerHelpStyle, color: "#9ee5a6", opacity: 1 }}>
                    Thanks — queued for review.
                  </span>
                )}
                {suggestState === "error" && (
                  <span style={{ ...layerHelpStyle, color: "#f5a6a6", opacity: 1 }}>
                    {suggestError || "Couldn\u2019t send. Try again."}
                  </span>
                )}
              </div>
            </div>
          )}
        </>
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
  renderFieldsOrNull: _renderFieldsOrNull, // not used — Identity always renders its own UI
  MODULES,
  saveCategory,
}: IdentityPanelProps) {
  const pronounPresets = ["she/her", "he/him", "they/them", "she/they", "he/they"];
  const languagePresets = [
    // Slovakia / ETP
    "Slovenský", "Romani", "Hungarian",
    // Ecuador
    "Español", "Shuar-Chicham", "Quechua",
    // Tanzania
    "Kiswahili", "German",
    // Zimbabwe
    "Shona", "Ndebele",
    // Ivory Coast
    "French",
    // Global
    "English",
  ];

  // Derived — parsed language entries (lang + optional level)
  const langEntries = parseLangEntries(profile.languages);

  function toggleLang(lang: string) {
    setProfile((p: any) => {
      const entries = parseLangEntries(p.languages);
      const idx = entries.findIndex((e) => e.lang.toLowerCase() === lang.toLowerCase());
      if (idx >= 0) entries.splice(idx, 1);
      else entries.push({ lang, level: "" });
      return { ...p, languages: formatLangEntries(entries) };
    });
  }

  function setLangLevel(lang: string, level: string) {
    setProfile((p: any) => {
      const entries = parseLangEntries(p.languages);
      const entry = entries.find((e) => e.lang.toLowerCase() === lang.toLowerCase());
      if (entry) entry.level = entry.level === level ? "" : level; // tap again to clear
      return { ...p, languages: formatLangEntries(entries) };
    });
  }

  return (
    <div>
      <div id="studio-identity-anchor" />

      <p style={explainStyleLocal}>
        Identity helps us represent you accurately, invite you into the right rooms,
        and connect you with collaborators who share your communities, causes, and
        creative language.
      </p>

      {/* Eyebrow */}
      <div style={{ marginBottom: 14 }}>
        <span style={subheadChipStyle} className="subhead-chip">
          Identity
        </span>
      </div>

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

        {/* Pronouns + Languages — side by side on wide, stacked on mobile */}
        <div
          className="identity-pair-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
            marginBottom: 24,
            alignItems: "start",
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

          {/* Languages — includes level picker directly below */}
          <div style={{ display: "grid", gap: 8 }}>
            <label style={labelStyle}>Languages</label>
            <input
              value={profile.languages || ""}
              onChange={(e) =>
                setProfile((p: any) => ({ ...p, languages: e.target.value }))
              }
              style={inputStyle}
              placeholder="English, Español (Fluent), Slovenský…"
              disabled={loading}
            />
            <div style={chipRowStyle}>
              {languagePresets.map((lang) => {
                const entry = langEntries.find(
                  (e) => e.lang.toLowerCase() === lang.toLowerCase()
                );
                const isOn = !!entry;
                return (
                  <button
                    key={lang}
                    type="button"
                    style={isOn ? presetChipActive : presetChip}
                    disabled={loading}
                    onClick={() => toggleLang(lang)}
                  >
                    {isOn && entry?.level ? `${lang} (${entry.level})` : lang}
                  </button>
                );
              })}
            </div>
            <p style={tipStyle}>
              Languages you create, teach, perform, or collaborate in.
            </p>

            {/* Language level picker — right column, directly under preset chips */}
            {langEntries.length > 0 && (
              <div
                style={{
                  marginTop: 4,
                  paddingLeft: 12,
                  paddingTop: 8,
                  paddingBottom: 8,
                  borderLeft: "2px solid rgba(36,147,169,0.4)",
                }}
              >
                <p style={{ ...tipStyle, marginTop: 0, marginBottom: 10, letterSpacing: "0.03em" }}>
                  Language levels
                </p>
                <div style={{ display: "grid", gap: 8 }}>
                  {langEntries.map((entry) => (
                    <div
                      key={entry.lang}
                      style={{ display: "grid", gap: 5 }}
                    >
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          color: "rgba(255,255,255,0.9)",
                          fontFamily: FF,
                        }}
                      >
                        {entry.lang}
                      </span>
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                        {LANGUAGE_LEVELS.map((level) => (
                          <button
                            key={level}
                            type="button"
                            style={{
                              ...(entry.level === level ? presetChipActive : presetChip),
                              fontSize: "0.72rem",
                              padding: "4px 10px",
                            }}
                            disabled={loading}
                            onClick={() => setLangLevel(entry.lang, level)}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
