"use client";

import { type CSSProperties } from "react";
import { COLOR } from "@/app/alumni/update/updateStyles";
import SpotlightHighlightManager, {
  type SpotlightItem,
} from "@/app/alumni/update/studio/SpotlightHighlightManager";

// Preload shape shared with HighlightStudioPanel + the update form.
export type SpotlightPreloadData = {
  spotlights: any[];
  highlights: any[];
  hiddenSpotlights?: any[];
  hiddenHighlights?: any[];
};

// Gold save button — visually signals an admin (editorial) action.
const adminSaveBtn: CSSProperties = {
  borderRadius: 14,
  padding: "12px 16px",
  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
  fontWeight: 500,
  fontSize: "0.9rem",
  textTransform: "uppercase",
  letterSpacing: "0.2em",
  background: COLOR.gold,
  color: COLOR.ink,
  border: "1px solid rgba(0,0,0,0.22)",
  boxShadow: "0 10px 26px rgba(0,0,0,0.22)",
  cursor: "pointer",
  transform: "translateZ(0)",
};

type SpotlightAdminPanelProps = {
  profileSlug: string;
  onSaved?: () => void;
  /** Preloaded API data — when provided the list paints instantly. */
  initialData?: SpotlightPreloadData;
};

export default function SpotlightAdminPanel({
  profileSlug,
  onSaved,
  initialData,
}: SpotlightAdminPanelProps) {
  return (
    <SpotlightHighlightManager
      profileSlug={profileSlug}
      kind="spotlight"
      typeValue="dat spotlight"
      accent={COLOR.gold}
      saveButtonStyle={adminSaveBtn}
      anchorId="studio-spotlight-anchor"
      noun="Spotlight"
      introCopy="Your editorial voice — spotlight what an alum is doing right now. Each one appears on their profile as a DAT Spotlight."
      titlePlaceholder="e.g. On Broadway in Into the Woods"
      subtitlePlaceholder="e.g. Opening night March 14"
      bodyPlaceholder="A short celebration, quote, or context — in DAT's voice."
      ctaTextPlaceholder="e.g. Get Tickets"
      initialActive={initialData?.spotlights as SpotlightItem[] | undefined}
      initialHidden={initialData?.hiddenSpotlights as SpotlightItem[] | undefined}
      onSaved={onSaved}
    />
  );
}
