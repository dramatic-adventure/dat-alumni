"use client";

import type { ReactNode } from "react";

export default function EventPanel(props: {
  loading: boolean;

  // styles
  explainStyleLocal: any;

  // profile state
  profile: any;
  setProfile: (updater: any) => void;

  // rendering helpers
  renderFieldsOrNull: (keys: string[]) => ReactNode;
  eventEditKeys: string[];

  // optional fallback (keeps your current inline fallback component intact)
  manualFallback?: ReactNode;
}) {
  const {
    loading,
    explainStyleLocal,
    profile,
    setProfile,
    renderFieldsOrNull,
    eventEditKeys,
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
    </div>
  );
}
