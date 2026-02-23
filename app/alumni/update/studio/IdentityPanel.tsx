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

function parseCommaList(raw: string | undefined | null): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function joinCommaList(values: string[]): string {
  return values.join(", ");
}

function toggleTag(raw: string | undefined | null, tag: string): string {
  const list = parseCommaList(raw);
  const idx = list.findIndex((v) => v.toLowerCase() === tag.toLowerCase());

  if (idx >= 0) {
    list.splice(idx, 1);
  } else {
    list.push(tag);
  }

  return joinCommaList(list);
}

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
  const pronounPresets = ["she/her", "he/him", "they/them", "she/they", "he/they"];

  const identityTagPresets = [
    "BIPOC",
    "Latine",
    "Roma",
    "Indigenous",
    "Queer",
    "Trans / Non-binary",
    "Disabled artist",
    "Neurodivergent",
    "Immigrant / 1st-gen",
    "Parent / Caregiver",
  ];

  const languagePresets = ["English", "Español", "Slovenský", "Shuar-Chicham"];

  const rolePresets = [
    "Actor",
    "Director",
    "Playwright",
    "Deviser",
    "Teaching Artist",
    "Producer",
    "Designer",
    "Stage Manager",
    "Dramaturg",
    "Filmmaker",
  ];

  const helperTextStyle: CSSProperties = {
    marginTop: 4,
    fontSize: "0.74rem",
    opacity: 0.78,
    fontFamily:
      'var(--font-dm-sans), system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  };

  const chipRowStyle: CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
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

  const sectionGridStyle: CSSProperties = {
    display: "grid",
    gap: 18,
    gridTemplateColumns: "minmax(0,1fr)",
  };

  const sectionSplitStyle: CSSProperties = {
    display: "grid",
    gap: 18,
  };

  return (
    <div>
      <div id="studio-identity-anchor" />

      {/* Top explainer */}
      <p style={explainStyleLocal}>
        Identity helps us represent you accurately, invite you into the right rooms,
        and connect you with collaborators who share your communities, causes, and
        creative language.
      </p>

      <span style={subheadChipStyle} className="subhead-chip">
        Identity + Roles
      </span>

      {/* If the sheet-driven config already defines these fields, use that.
          Otherwise, fall back to our enriched manual UI. */}
      {renderFieldsOrNull([
        ...MODULES["Identity"].fieldKeys,
        ...MODULES["Roles"].fieldKeys,
      ]) ?? (
        <div style={{ marginTop: 12 }}>
          {/* Layout: first block (pronouns + identity), second block (languages + roles) */}
          <div style={sectionGridStyle}>
            {/* Block 1: Pronouns + Identity tags */}
            <div style={sectionSplitStyle}>
              {/* Pronouns */}
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
                <div style={chipRowStyle}>
                  {pronounPresets.map((option) => {
                    const isActive =
                      (profile.pronouns || "")
                        .toString()
                        .toLowerCase()
                        .trim() === option.toLowerCase();
                    return (
                      <button
                        key={option}
                        type="button"
                        style={isActive ? chipActiveStyle : chipStyle}
                        onClick={() =>
                          setProfile((p: any) => ({
                            ...p,
                            pronouns: option,
                          }))
                        }
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
                <p style={helperTextStyle}>
                  Optional. If you&apos;d rather not share pronouns, you can leave this
                  blank.
                </p>
              </div>

              {/* Identity tags */}
              <div>
                <label style={labelStyle}>Identity Tags</label>
                <input
                  value={profile.identityTags || ""}
                  onChange={(e) =>
                    setProfile((p: any) => ({
                      ...p,
                      identityTags: e.target.value,
                    }))
                  }
                  style={inputStyle}
                  placeholder="Comma-separated: e.g. Queer, Latine, Parent, Disabled artist"
                />
                <div style={chipRowStyle}>
                  {identityTagPresets.map((tag) => {
                    const isActive = parseCommaList(profile.identityTags).some(
                      (t) => t.toLowerCase() === tag.toLowerCase()
                    );
                    return (
                      <button
                        key={tag}
                        type="button"
                        style={isActive ? chipActiveStyle : chipStyle}
                        onClick={() =>
                          setProfile((p: any) => ({
                            ...p,
                            identityTags: toggleTag(p.identityTags, tag),
                          }))
                        }
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
                <p style={helperTextStyle}>
                  Share only what feels right. These tags help us understand how you
                  move through the world and support representation in our casting,
                  programming, and panels.
                </p>
              </div>
            </div>

            {/* Block 2: Languages + Roles */}
            <div style={sectionSplitStyle}>
              {/* Languages */}
              <div>
                <label style={labelStyle}>Languages you work in</label>
                <input
                  value={profile.languages || ""}
                  onChange={(e) =>
                    setProfile((p: any) => ({ ...p, languages: e.target.value }))
                  }
                  style={inputStyle}
                  placeholder="Comma-separated: e.g. English, Español, Slovenský…"
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
                        onClick={() =>
                          setProfile((p: any) => ({
                            ...p,
                            languages: toggleTag(p.languages, lang),
                          }))
                        }
                      >
                        {lang}
                      </button>
                    );
                  })}
                </div>
                <p style={helperTextStyle}>
                  Include any languages you create, teach, perform, or collaborate in.
                  Write them the way you want them to appear on your public profile.
                </p>
              </div>

              {/* Roles */}
              <div>
                <label style={labelStyle}>Primary roles & disciplines</label>
                <input
                  value={profile.roles || ""}
                  onChange={(e) =>
                    setProfile((p: any) => ({ ...p, roles: e.target.value }))
                  }
                  style={inputStyle}
                  placeholder="Actor, Director, Teaching Artist, Deviser…"
                />
                <div style={chipRowStyle}>
                  {rolePresets.map((role) => {
                    const isActive = parseCommaList(profile.roles).some(
                      (t) => t.toLowerCase() === role.toLowerCase()
                    );
                    return (
                      <button
                        key={role}
                        type="button"
                        style={isActive ? chipActiveStyle : chipStyle}
                        onClick={() =>
                          setProfile((p: any) => ({
                            ...p,
                            roles: toggleTag(p.roles, role),
                          }))
                        }
                      >
                        {role}
                      </button>
                    );
                  })}
                </div>
                <p style={helperTextStyle}>
                  Think about how you&apos;d like to be introduced in a room. We&apos;ll
                  use these roles in our directory, casting, and invitations.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save buttons */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 10,
          flexWrap: "wrap",
          marginTop: 22,
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
