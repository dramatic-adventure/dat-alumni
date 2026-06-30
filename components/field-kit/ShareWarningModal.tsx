// components/field-kit/ShareWarningModal.tsx
//
// Privacy/security warning shown BEFORE the itinerary is printed, copied, or
// shared. The program's exact day-by-day schedule and locations are sensitive —
// if they're posted publicly, anyone can find where the cohort will be and when.
// This makes the artist pause and confirm before creating a portable copy.

"use client";

import { useEffect, type CSSProperties } from "react";
import { T, FONT } from "@/components/field-kit/tokens";
import type { ShareAction } from "@/components/field-kit/useItineraryShare";

const VERB: Record<ShareAction, string> = {
  print: "Printing or saving",
  copy: "Copying",
  share: "Sharing",
};

export default function ShareWarningModal({
  open,
  action,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  action: ShareAction | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  // Escape closes; lock background scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onCancel]);

  if (!open || !action) return null;

  return (
    <div style={OVERLAY} onClick={onCancel}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="fk-share-warning-title"
        style={PANEL}
        onClick={(e) => e.stopPropagation()}
      >
        <p style={EYEBROW}>Keep this private</p>
        <h2 id="fk-share-warning-title" style={TITLE}>
          Your schedule is sensitive.
        </h2>
        <p style={BODY}>
          {VERB[action]} your itinerary creates a copy of the cohort&apos;s exact daily schedule and
          locations. <b style={{ opacity: 0.95 }}>Please don&apos;t post it online</b> — share it only with
          people close to you. Making your day-by-day whereabouts public is a safety risk.
        </p>
        <div style={ROW}>
          <button type="button" onClick={onCancel} style={CANCEL}>
            Cancel
          </button>
          <button type="button" onClick={onConfirm} style={CONFIRM} autoFocus>
            I understand — continue
          </button>
        </div>
      </div>
    </div>
  );
}

const OVERLAY: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 70,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
  backgroundColor: "rgba(14,10,19,0.72)",
  backdropFilter: "blur(4px)",
  WebkitBackdropFilter: "blur(4px)",
};

const PANEL: CSSProperties = {
  width: "100%",
  maxWidth: 380,
  backgroundColor: T.paper,
  border: `1px solid ${T.border}`,
  borderRadius: 16,
  padding: "22px 22px 18px",
  boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
};

const EYEBROW: CSSProperties = {
  fontFamily: FONT.grotesk,
  fontWeight: 700,
  fontSize: 10,
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  color: T.pink,
  margin: "0 0 8px",
};

const TITLE: CSSProperties = {
  fontFamily: FONT.anton,
  fontSize: "clamp(22px, 5vw, 28px)",
  lineHeight: 1.0,
  textTransform: "uppercase",
  color: T.ink,
  margin: "0 0 12px",
};

const BODY: CSSProperties = {
  fontFamily: FONT.dm,
  fontSize: 14,
  lineHeight: 1.55,
  color: T.ink,
  opacity: 0.86,
  margin: "0 0 20px",
};

const ROW: CSSProperties = {
  display: "flex",
  gap: 10,
  justifyContent: "flex-end",
  flexWrap: "wrap",
};

const btnBase: CSSProperties = {
  fontFamily: FONT.grotesk,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  padding: "10px 16px",
  borderRadius: 9,
  cursor: "pointer",
};

const CANCEL: CSSProperties = {
  ...btnBase,
  background: "transparent",
  color: T.ink,
  border: `1px solid ${T.border}`,
};

const CONFIRM: CSSProperties = {
  ...btnBase,
  background: T.yellow,
  color: T.black,
  border: "none",
};
