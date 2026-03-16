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
  } = props;

  return (
    <div>
      <div id="studio-event-anchor" />
      <p style={explainStyleLocal}>
        Add your most meaningful DAT-related events (performances, residencies, tours, festivals,
        workshops). Keep titles specific and dates accurate when possible.
      </p>

      {renderFieldsOrNull(eventEditKeys) ?? manualFallback ?? null}

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
        <button
          type="button"
          style={datButtonLocal}
          className="dat-btn"
          disabled={loading}
          onClick={() =>
            saveCategory({
              tag: "Event",
              fieldKeys: eventFieldKeys,
              uploadKinds: [],
            })
          }
        >
          Save Event
        </button>
      </div>
    </div>
  );
}
