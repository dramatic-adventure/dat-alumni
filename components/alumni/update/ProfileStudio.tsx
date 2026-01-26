"use client";

import { useMemo, useState, useEffect } from "react";
import type { CSSProperties, ReactNode } from "react";

export type StudioTab = "basics" | "identity" | "media" | "contact" | "story" | "event";
export type UploadKind = "headshot" | "album" | "reel" | "event";

const COLOR = {
  ink: "#241123",
  brand: "#6C00AF",
  gold: "#D9A919",
  teal: "#2493A9",
  snow: "#F2F2F2",
};

const DIRECT_ASSET_HELP =
  "Use a direct asset link (the URL should end in .jpg, .png, .webp, .gif, .mp4, etc — not a webpage link).";

const tabRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  alignItems: "center",
};

const tabStyle = (active: boolean): CSSProperties => ({
  borderRadius: 999,
  padding: "10px 14px",
  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
  fontWeight: 800,
  letterSpacing: ".08em",
  textTransform: "uppercase",
  fontSize: 12,
  cursor: "pointer",
  border: active
    ? "1px solid rgba(255,255,255,0.55)"
    : "1px solid rgba(255,255,255,0.28)",
  background: active ? "rgba(255,255,255,0.10)" : "transparent",
  color: COLOR.snow,
  opacity: active ? 1 : 0.78,
});

const panelStyle: CSSProperties = {
  marginTop: 14,
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 14,
  padding: 14,
};

const studioExplainStyle: CSSProperties = {
  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
  fontSize: 13,
  lineHeight: 1.5,
  color: COLOR.snow,
  opacity: 0.85,
  margin: "0 0 12px",
};

const footerRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  marginTop: 14,
};

const datButton: CSSProperties = {
  borderRadius: 14,
  padding: "12px 16px",
  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
  fontWeight: 700,
  fontSize: "0.85rem",
  textTransform: "uppercase",
  letterSpacing: "0.18em",
  background: COLOR.teal,
  color: COLOR.snow,
  border: "1px solid rgba(0,0,0,0.22)",
  boxShadow: "0 10px 26px rgba(0,0,0,0.18)",
  cursor: "pointer",
};

const ghostButton: CSSProperties = {
  borderRadius: 14,
  padding: "10px 14px",
  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
  fontWeight: 700,
  letterSpacing: "0.05em",
  background: "transparent",
  color: "#f2f2f2",
  border: "1px solid rgba(255,255,255,0.55)",
  cursor: "pointer",
};

function Row({ children }: { children: ReactNode }) {
  return <div style={{ display: "grid", gap: 12 }}>{children}</div>;
}

function Field({
  label,
  help,
  children,
}: {
  label: string;
  help?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div
        style={{
          fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
          fontSize: 12,
          letterSpacing: ".06em",
          textTransform: "uppercase",
          fontWeight: 800,
          opacity: 0.9,
          marginBottom: 6,
        }}
      >
        {label}
      </div>

      {children}

      {help ? (
        <p style={{ ...studioExplainStyle, marginTop: 6, marginBottom: 0 }}>
          {help}
        </p>
      ) : null}
    </div>
  );
}

type ProfileStudioProps = {
  /** Uncontrolled default (used only when `tab` is not provided) */
  defaultTab?: StudioTab;

  /** Controlled mode (optional) */
  tab?: StudioTab;
  onTabChange?: (t: StudioTab) => void;

  // shared
  loading: boolean;
  onOpenPicker: (k: UploadKind) => void;

  // panels
  basicsPanel: ReactNode;
  identityPanel: ReactNode;
  mediaPanel: ReactNode;
  contactPanel: ReactNode;
  storyPanel: ReactNode;
  eventPanel: ReactNode;
};

/**
 * ProfileStudio is intentionally dumb:
 * - It does not know about buildLiveChanges, baseline, drafts, etc.
 * - It just calls the callbacks you already trust.
 *
 * Supports BOTH:
 * - controlled:   tab + onTabChange
 * - uncontrolled: defaultTab (internal state)
 */
export default function ProfileStudio(props: ProfileStudioProps) {
  const {
    defaultTab = "basics",
    tab: controlledTab,
    onTabChange,

    loading,
    onOpenPicker,

    basicsPanel,
    identityPanel,
    mediaPanel,
    contactPanel,
    storyPanel,
    eventPanel,
  } = props;

  const isControlled = controlledTab != null;

  const [internalTab, setInternalTab] = useState<StudioTab>(defaultTab);

  // Keep internal in sync when uncontrolled, and gracefully handle mode flips.
  useEffect(() => {
    if (!isControlled) {
      setInternalTab(defaultTab);
    } else {
      // if we become controlled, mirror the controlled tab once (prevents a stale flash if later uncontrolled again)
      setInternalTab(controlledTab ?? defaultTab);
    }
  }, [defaultTab, isControlled, controlledTab]);

  const tab: StudioTab = isControlled ? (controlledTab ?? internalTab) : internalTab;

  const setTab = (t: StudioTab) => {
    if (isControlled) onTabChange?.(t);
    else setInternalTab(t);
  };

  const panel = useMemo(() => {
    if (tab === "basics") return basicsPanel;
    if (tab === "identity") return identityPanel;
    if (tab === "media") return mediaPanel;
    if (tab === "contact") return contactPanel;
    if (tab === "story") return storyPanel;
    return eventPanel;
  }, [
    tab,
    basicsPanel,
    identityPanel,
    mediaPanel,
    contactPanel,
    storyPanel,
    eventPanel,
  ]);

  return (
    <div>
      {/* Top nav (replaces MediaHub category row) */}
      <div style={tabRowStyle}>
        <button
            type="button"
            style={tabStyle(tab === "basics")}
            onClick={() => setTab("basics")}
            aria-pressed={tab === "basics"}
        >
            Basics
        </button>

        <button
            type="button"
            style={tabStyle(tab === "identity")}
            onClick={() => setTab("identity")}
            aria-pressed={tab === "identity"}
        >
            Identity
        </button>

        <button
            type="button"
            style={tabStyle(tab === "media")}
            onClick={() => setTab("media")}
            aria-pressed={tab === "media"}
        >
            Media
        </button>

        <button
            type="button"
            style={tabStyle(tab === "contact")}
            onClick={() => setTab("contact")}
            aria-pressed={tab === "contact"}
        >
            Contact
        </button>

        <button
            type="button"
            style={tabStyle(tab === "story")}
            onClick={() => setTab("story")}
            aria-pressed={tab === "story"}
        >
            Story
        </button>

        <button
            type="button"
            style={tabStyle(tab === "event")}
            onClick={() => setTab("event")}
            aria-pressed={tab === "event"}
        >
            Event
        </button>


        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <button
            type="button"
            style={{ ...ghostButton, padding: "10px 12px", opacity: 0.9 }}
            disabled={loading}
            onClick={() => onOpenPicker("album")}
            title="Open media library"
          >
            Library
          </button>
        </div>
      </div>

      <div style={panelStyle}>{panel}</div>
    </div>
  );
}

// Export the helper too so modules can use it consistently.
export {
  Field,
  Row,
  datButton,
  ghostButton,
  studioExplainStyle,
  footerRowStyle,
  DIRECT_ASSET_HELP,
};
