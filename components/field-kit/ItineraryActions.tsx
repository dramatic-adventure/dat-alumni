// components/field-kit/ItineraryActions.tsx
//
// Print / Copy / Share toolbar shown on the itinerary itself. Renders inside
// ItineraryCompanion, so it appears in BOTH the live (online) and snapshot
// (offline) views, always exporting exactly the itinerary on screen. Each action
// is gated by ShareWarningModal via the shared useItineraryShare hook.

"use client";

import { useCallback, type CSSProperties } from "react";
import { Printer, Copy, Share2 } from "lucide-react";
import { useItineraryShare } from "@/components/field-kit/useItineraryShare";
import ShareWarningModal from "@/components/field-kit/ShareWarningModal";
import { T, FONT } from "@/components/field-kit/tokens";
import type { ProgramItinerary } from "@/lib/programItinerary";

export default function ItineraryActions({ itinerary }: { itinerary: ProgramItinerary }) {
  const getItinerary = useCallback(async () => itinerary, [itinerary]);
  const { pending, request, confirm, cancel, notice, canShare } = useItineraryShare(getItinerary);

  return (
    <div style={WRAP}>
      <div style={ROW}>
        <button type="button" onClick={() => request("print")} style={BTN}>
          <Printer size={14} aria-hidden /> Print / Save
        </button>
        <button type="button" onClick={() => request("copy")} style={BTN}>
          <Copy size={14} aria-hidden /> Copy
        </button>
        {canShare && (
          <button type="button" onClick={() => request("share")} style={BTN}>
            <Share2 size={14} aria-hidden /> Share
          </button>
        )}
        {notice && (
          <span role="status" style={NOTICE}>
            {notice}
          </span>
        )}
      </div>

      <ShareWarningModal open={pending != null} action={pending} onCancel={cancel} onConfirm={confirm} />
    </div>
  );
}

const WRAP: CSSProperties = {
  display: "flex",
  alignItems: "center",
  marginBottom: 26,
};

const ROW: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
};

const BTN: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  fontFamily: FONT.grotesk,
  fontSize: 10.5,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: T.ink,
  background: "transparent",
  border: `1px solid ${T.border}`,
  borderRadius: 8,
  padding: "7px 11px",
  cursor: "pointer",
};

const NOTICE: CSSProperties = {
  fontFamily: FONT.grotesk,
  fontSize: 9.5,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: T.teal,
};
