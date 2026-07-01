// components/field-kit/SignOutWarningModal.tsx
//
// Shown before sign-out ONLY when the on-device capture queue (lib/captureQueue)
// still has unsynced items. Signing out doesn't delete the queue itself, but if
// someone else signs in on this device afterward, the drainer would sync those
// items under THEIR session — misattributing captures. So we warn and let the
// artist choose, rather than silently proceeding or silently discarding.

"use client";

import { useEffect, type CSSProperties } from "react";
import { T, FONT } from "@/components/field-kit/tokens";

export default function SignOutWarningModal({
  open,
  count,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  count: number;
  onCancel: () => void;
  onConfirm: () => void;
}) {
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

  if (!open) return null;

  return (
    <div style={OVERLAY} onClick={onCancel}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="fk-signout-warning-title"
        style={PANEL}
        onClick={(e) => e.stopPropagation()}
      >
        <p style={EYEBROW}>Unsynced captures</p>
        <h2 id="fk-signout-warning-title" style={TITLE}>
          {count} unsynced {count === 1 ? "capture" : "captures"} on this device.
        </h2>
        <p style={BODY}>
          You have {count} unsynced {count === 1 ? "capture" : "captures"} that will be lost if you sign
          out on this device. They&apos;ll stay queued here, but if someone else signs in they could sync
          under the wrong name. Stay signed in until they sync, or sign out anyway and lose them.
        </p>
        <div style={ROW}>
          <button type="button" onClick={onCancel} style={CANCEL} autoFocus>
            Stay signed in
          </button>
          <button type="button" onClick={onConfirm} style={CONFIRM}>
            Sign out anyway
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
  fontSize: "clamp(20px, 5vw, 26px)",
  lineHeight: 1.05,
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
  background: T.yellow,
  color: T.black,
  border: "none",
};

const CONFIRM: CSSProperties = {
  ...btnBase,
  background: "transparent",
  color: T.pink,
  border: `1px solid ${T.border}`,
};
