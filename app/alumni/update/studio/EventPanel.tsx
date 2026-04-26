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
    renderFieldsOrNull,
    eventEditKeys,
    saveCategory,
    eventFieldKeys,
    manualFallback,
    savedRecently = false,
    onSaved,
  } = props;

  const eventTitle = String(profile?.upcomingEventTitle || "").trim();
  const eventLink = String(profile?.upcomingEventLink || "").trim();

  const mailtoHref = (() => {
    const subject = encodeURIComponent(
      eventTitle ? `DAT Promotion Request: ${eventTitle}` : "DAT Promotion Request"
    );
    const bodyLines = [
      "Hi DAT team,",
      "",
      "I'd like to request consideration for broader promotion of my upcoming event.",
      "",
      eventTitle ? `Event: ${eventTitle}` : "",
      eventLink ? `Link: ${eventLink}` : "",
      "",
      "A bit about why this might align with DAT's mission:",
      "",
      "(Please share how this project connects to adventurous storytelling, community engagement, cross-cultural exchange, or alumni collaboration.)",
      "",
      "Thank you,",
    ]
      .filter((l) => l !== undefined)
      .join("\n");
    return `mailto:hello@dramaticadventure.com?subject=${subject}&body=${encodeURIComponent(bodyLines)}`;
  })();

  return (
    <div>
      <div id="studio-event-anchor" />

      <h3
        style={{
          margin: "0 0 6px",
          fontSize: 15,
          fontWeight: 600,
          color: "rgba(255,255,255,0.92)",
          letterSpacing: "-0.01em",
        }}
      >
        Share an Upcoming Event
      </h3>

      <p style={{ ...explainStyleLocal, margin: "0 0 4px" }}>
        Let alumni and DAT&apos;s wider audience know where they can experience your work next.
      </p>
      <p style={{ ...explainStyleLocal, margin: "0 0 18px", opacity: 0.65 }}>
        This powers the <strong style={{ color: "rgba(255,255,255,0.75)" }}>Coming Up</strong>{" "}
        section on your public profile. The event disappears automatically once the event date or
        expiration date passes.
      </p>

      {renderFieldsOrNull(eventEditKeys) ?? manualFallback ?? null}

      {/* DAT promotion callout */}
      <div
        style={{
          marginTop: 22,
          padding: "12px 14px",
          borderRadius: 8,
          border: "1px solid rgba(139,92,246,0.25)",
          background: "rgba(139,92,246,0.07)",
        }}
      >
        <p
          style={{
            margin: "0 0 5px",
            fontSize: 12,
            fontWeight: 600,
            color: "rgba(255,255,255,0.75)",
            letterSpacing: "0.01em",
          }}
        >
          Want DAT to help amplify this event?
        </p>
        <p style={{ ...explainStyleLocal, margin: "0 0 10px", fontSize: 11.5 }}>
          If this project aligns with DAT&apos;s mission — through adventurous storytelling,
          community engagement, cross-cultural exchange, or alumni collaboration — we may be able to
          consider it for broader promotion beyond your alumni profile.
        </p>
        <a
          href={mailtoHref}
          style={{
            display: "inline-block",
            fontSize: 11.5,
            fontWeight: 600,
            color: "rgba(167,139,250,0.9)",
            textDecoration: "none",
            borderBottom: "1px solid rgba(167,139,250,0.4)",
            paddingBottom: 1,
          }}
        >
          Request DAT promotion →
        </a>
      </div>

      {/* Event media note */}
      <p
        style={{
          ...explainStyleLocal,
          marginTop: 12,
          marginBottom: 0,
          fontSize: 11,
          opacity: 0.45,
        }}
      >
        Event promo image / video is not yet rendered in the Coming Up strip — support coming in a future update.
      </p>

      <div
        style={{
          marginTop: 20,
          paddingTop: 18,
          borderTop: "1px solid rgba(255,255,255,0.10)",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 14,
          flexWrap: "wrap",
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
