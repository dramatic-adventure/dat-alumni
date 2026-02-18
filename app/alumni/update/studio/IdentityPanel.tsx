"use client";

import type { CSSProperties, ReactNode } from "react";

type StudioTab = "basics" | "identity" | "media" | "contact" | "story" | "event";
type UploadKind = "headshot" | "album" | "reel" | "event";

type IdentityPanelProps = {
  explainStyleLocal: CSSProperties;
  subheadChipStyle: CSSProperties;
  labelStyle: CSSProperties;
  inputStyle: CSSProperties;
  datButtonLocal: CSSProperties;

  loading: boolean;

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

export default function IdentityPanel({
  explainStyleLocal,
  subheadChipStyle,
  labelStyle,
  inputStyle,
  datButtonLocal,
  loading,
  profile,
  setProfile,
  renderFieldsOrNull,
  MODULES,
  saveCategory,
}: IdentityPanelProps) {
  return (
    <div>
      <div id="studio-identity-anchor" />
      <p style={explainStyleLocal}>
        Identity helps us represent you accurately and build the right rooms for collaboration.
      </p>

      <span style={subheadChipStyle} className="subhead-chip">
        Identity + Roles
      </span>

      {renderFieldsOrNull([
        ...MODULES["Identity"].fieldKeys,
        ...MODULES["Roles"].fieldKeys,
      ]) ?? (
        <div style={{ display: "grid", gap: 14 }}>
          <div>
            <label style={labelStyle}>Pronouns</label>
            <input
              value={profile.pronouns || ""}
              onChange={(e) =>
                setProfile((p: any) => ({ ...p, pronouns: e.target.value }))
              }
              style={inputStyle}
              placeholder="she/her, he/him, they/them…"
            />
          </div>

          <div>
            <label style={labelStyle}>Identity Tags</label>
            <input
              value={profile.identityTags || ""}
              onChange={(e) =>
                setProfile((p: any) => ({ ...p, identityTags: e.target.value }))
              }
              style={inputStyle}
              placeholder="comma-separated"
            />
          </div>

          <div>
            <label style={labelStyle}>Languages</label>
            <input
              value={profile.languages || ""}
              onChange={(e) =>
                setProfile((p: any) => ({ ...p, languages: e.target.value }))
              }
              style={inputStyle}
              placeholder="comma-separated"
            />
          </div>

          <div>
            <label style={labelStyle}>Roles</label>
            <input
              value={profile.roles || ""}
              onChange={(e) =>
                setProfile((p: any) => ({ ...p, roles: e.target.value }))
              }
              style={inputStyle}
              placeholder="Actor, Director, Designer…"
            />
          </div>
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 10,
          flexWrap: "wrap",
          marginTop: 16,
        }}
      >
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

        <button
          type="button"
          style={datButtonLocal}
          className="dat-btn"
          disabled={loading}
          onClick={() =>
            saveCategory({
              tag: "Roles",
              fieldKeys: MODULES["Roles"].fieldKeys,
              uploadKinds: [],
            })
          }
        >
          Save Roles
        </button>
      </div>
    </div>
  );
}
