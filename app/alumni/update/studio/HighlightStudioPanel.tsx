"use client";

import { COLOR, datButtonLocal } from "@/app/alumni/update/updateStyles";
import SpotlightHighlightManager, {
  type SpotlightItem,
} from "@/app/alumni/update/studio/SpotlightHighlightManager";
import type { SpotlightPreloadData } from "@/app/alumni/update/studio/SpotlightAdminPanel";

type HighlightStudioPanelProps = {
  profileSlug: string;
  onSaved?: () => void;
  /** Preloaded API data — when provided the list paints instantly. */
  initialData?: SpotlightPreloadData;
};

export default function HighlightStudioPanel({
  profileSlug,
  onSaved,
  initialData,
}: HighlightStudioPanelProps) {
  return (
    <SpotlightHighlightManager
      profileSlug={profileSlug}
      kind="highlight"
      typeValue="highlight"
      accent={COLOR.teal}
      saveButtonStyle={datButtonLocal}
      anchorId="studio-highlight-anchor"
      noun="Highlight"
      introCopy="Share something notable — a recent project, award, press mention, or anything you want people to know about right now. Add as many as you like; edit or remove them anytime."
      titlePlaceholder="e.g. Just released my debut album"
      subtitlePlaceholder="e.g. Available everywhere now"
      bodyPlaceholder="A sentence or two about what this moment means to you."
      ctaTextPlaceholder="e.g. Listen Now"
      initialActive={initialData?.highlights as SpotlightItem[] | undefined}
      initialHidden={initialData?.hiddenHighlights as SpotlightItem[] | undefined}
      onSaved={onSaved}
    />
  );
}
