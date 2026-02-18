"use client";

import type { CSSProperties, ReactNode } from "react";

import type { AlumniProfile } from "@/schemas";

type UploadKind = "headshot" | "album" | "reel" | "event";

type ContactPanelProps = {
  explainStyleLocal: CSSProperties;
  subheadChipStyle: CSSProperties;
  datButtonGhost: CSSProperties;
  datButtonLocal: CSSProperties;
  labelStyle: CSSProperties;
  inputStyle: CSSProperties;

  loading: boolean;

  ALL_SOCIALS: readonly string[];

  visibleSocials: string[];
  setVisibleSocials: (fn: (prev: string[]) => string[]) => void;

  primarySocial: string;
  setPrimarySocial: (v: string) => void;

  profile: any;
  setProfile: (fn: (prev: any) => any) => void;

  ContactEditKeys: string[];

  renderFieldsOrNull: (keys: string[]) => ReactNode;

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

export default function ContactPanel({
  explainStyleLocal,
  subheadChipStyle,
  datButtonGhost,
  datButtonLocal,
  labelStyle,
  inputStyle,
  loading,
  ALL_SOCIALS,
  visibleSocials,
  setVisibleSocials,
  primarySocial,
  setPrimarySocial,
  profile,
  setProfile,
  ContactEditKeys,
  renderFieldsOrNull,
  saveCategory,
  contactFieldKeys,
  onClearDraft,
}: ContactPanelProps) {
  return (
    <div>
      <div id="studio-contact-anchor" />
      <p style={explainStyleLocal}>
        Keep it calm: select the channels you use — then fields reveal.
      </p>

      <span style={subheadChipStyle} className="subhead-chip">
        Ways to reach you
      </span>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
        {ALL_SOCIALS.map((k) => {
          const on = visibleSocials.includes(k);
          return (
            <button
              key={k}
              type="button"
              className="dat-btn-ghost"
              style={{ ...(datButtonGhost as any), opacity: on ? 1 : 0.55 }}
              onClick={() =>
                setVisibleSocials((v) => (on ? v.filter((x) => x !== k) : [...v, k]))
              }
              disabled={loading}
            >
              {on ? "✓ " : ""} {k}
            </button>
          );
        })}

        <select
          value={primarySocial}
          onChange={(e) => {
            const v = e.target.value;
            setPrimarySocial(v);
            setProfile((p) => ({ ...p, primarySocial: v }));
          }}
          className="dat-btn-ghost"
          style={{ ...(datButtonGhost as any), padding: "10px 12px" }}
          title="Primary social"
          disabled={loading}
        >
          {(visibleSocials.length ? visibleSocials : ["instagram"]).map((k) => (
            <option key={k} value={k}>
              {k} (primary)
            </option>
          ))}
        </select>
      </div>

      {renderFieldsOrNull(ContactEditKeys) ?? (
        <div style={{ display: "grid", gap: 12 }}>
          {ContactEditKeys.filter((k) => k !== "primarySocial").map((k) => (
            <div key={k}>
              <label style={labelStyle}>{k}</label>
              <input
                value={(profile as any)[k] || ""}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, [k]: e.target.value }))
                }
                style={inputStyle}
                placeholder={k === "publicEmail" ? "name@email.com" : "https://..."}
              />
            </div>
          ))}

          <p style={{ ...explainStyleLocal, marginTop: 6 }}>
            (Fallback UI) Add contact keys to <code>PROFILE_FIELDS</code> if you want curated
            rendering.
          </p>
        </div>
      )}

      <div style={{ marginTop: 20 }}>
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
          Save Contact
        </button>
      </div>

      <p style={{ ...explainStyleLocal, marginTop: 12 }}>
        Tip: toggle which socials you want visible above — hidden ones will be cleared on save.
      </p>
    </div>
  );
}
