"use client";

import type { ReactNode } from "react";

type UploadKind = "headshot" | "album" | "reel" | "event";

export default function EventPanel(props: {
  loading: boolean;

  // styles
  explainStyleLocal: any;
  datButtonLocal: any;

  // profile state
  profile: any;
  setProfile: (updater: any) => void;

  // rendering helpers
  renderFieldsOrNull: (keys: string[]) => ReactNode;
  eventEditKeys: string[];

  // save
  saveCategory: (args: {
    tag: string;
    fieldKeys?: string[];
    uploadKinds?: UploadKind[];
    afterSave?: () => void;
    profileOverride?: any;
  }) => void;
  eventFieldKeys: string[];

  // optional fallback (keeps your current inline fallback component intact)
  manualFallback?: ReactNode;

  savedRecently?: boolean;
  onSaved?: () => void;
}) {
  const {
    loading,
    explainStyleLocal,
    datButtonLocal,
    profile,
    setProfile,
    renderFieldsOrNull,
    eventEditKeys,
    saveCategory,
    eventFieldKeys,
    manualFallback,
    savedRecently = false,
    onSaved,
  } = props;

  return (
    <div>
      <div id="studio-event-anchor" />
      <p style={explainStyleLocal}>
        Add your most meaningful DAT-related events (performances, residencies, tours, festivals,
        workshops). Keep titles specific and dates accurate when possible.
      </p>

      {renderFieldsOrNull(eventEditKeys) ?? manualFallback ?? null}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 14,
          flexWrap: "wrap",
          marginTop: 20,
        }}
      >
        {savedRecently && (
          <span
            style={{
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              gap: 5,
              color: "#6ee7b7",
              opacity: 0.9,
            }}
          >
            <span style={{ fontSize: 10 }}>✓</span> Saved
          </span>
        )}
        <button
          type="button"
          style={{
            ...datButtonLocal,
            ...(savedRecently
              ? { background: "rgba(52,211,153,0.25)", borderColor: "rgba(52,211,153,0.5)" }
              : {}),
          }}
          className="dat-btn"
          disabled={loading}
          onClick={() =>
            saveCategory({
              tag: "Event",
              fieldKeys: eventFieldKeys,
              uploadKinds: [],
              afterSave: () => onSaved?.(),
            })
          }
        >
          {savedRecently ? "Saved ✓" : "Save Event"}
        </button>
      </div>
    </div>
  );
}
