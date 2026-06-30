// components/field-kit/ItineraryPrivacyNotice.tsx
//
// One-time privacy heads-up, shown the FIRST time the itinerary is opened on a
// device. Unlike the per-action ShareWarningModal (sessionStorage, re-warns each
// launch), this is acknowledged ONCE and persisted in localStorage so it never
// nags again on that device. Purpose: set the expectation up front that the
// cohort's schedule + locations are private — the practical mitigation for the
// fact that the web can't detect screenshots.

"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { T, FONT } from "@/components/field-kit/tokens";

export default function ItineraryPrivacyNotice({ programId }: { programId: string }) {
  const [show, setShow] = useState(false);
  const storageKey = `fk:itinerary-privacy-ack:${programId}`;

  // Render nothing on SSR / first client paint; decide after mount (localStorage
  // is browser-only), so there's no hydration mismatch.
  useEffect(() => {
    try {
      if (localStorage.getItem(storageKey) !== "1") setShow(true);
    } catch {
      // storage unavailable (private mode) — skip the notice rather than nag.
    }
  }, [storageKey]);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(storageKey, "1");
    } catch {
      // ignore — worst case the notice shows again next time
    }
    setShow(false);
  }, [storageKey]);

  useEffect(() => {
    if (!show) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [show, dismiss]);

  if (!show) return null;

  return (
    <div style={OVERLAY} onClick={dismiss}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="fk-privacy-notice-title"
        style={PANEL}
        onClick={(e) => e.stopPropagation()}
      >
        <p style={EYEBROW}>Before you dive in</p>
        <h2 id="fk-privacy-notice-title" style={TITLE}>
          Keep your itinerary private.
        </h2>
        <p style={BODY}>
          This is the cohort&apos;s day-by-day schedule and exact locations. Keep it to yourself and people
          close to you — <b style={{ opacity: 0.95 }}>please don&apos;t post it publicly</b>. Making the
          group&apos;s whereabouts findable online is a safety risk.
        </p>
        <div style={ROW}>
          <button type="button" onClick={dismiss} style={CONFIRM} autoFocus>
            Got it
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
  color: T.teal,
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
  justifyContent: "flex-end",
};

const CONFIRM: CSSProperties = {
  fontFamily: FONT.grotesk,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  padding: "10px 18px",
  borderRadius: 9,
  cursor: "pointer",
  background: T.yellow,
  color: T.black,
  border: "none",
};
