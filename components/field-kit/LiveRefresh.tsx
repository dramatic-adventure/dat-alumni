// components/field-kit/LiveRefresh.tsx
//
// Field Kit live-refresh — keeps the itinerary CURRENT while online without a
// manual reload. ItineraryCompanion stays the single renderer (the server
// component owns the first paint); this mounts alongside it, does NO rendering of
// itinerary content, and only watches for change.
//
// How it works: the page passes the hash of the itinerary it just rendered as
// `initialHash` — the baseline of "what's on screen". On window focus, tab
// re-show, the "online" event, and a light 30s poll (only while the tab is
// visible — paused when hidden), it fetches /api/field-kit/itinerary and compares
// the returned hash. On a difference it calls router.refresh() (re-runs the
// server component → ItineraryCompanion re-renders with live Sheets data, the URL
// /asId preserved) and surfaces a subtle, dismissible "Itinerary updated" banner
// so the change is noticed rather than shifting silently.

"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchItinerary } from "@/lib/fetchItinerary";
import { T, FONT } from "@/components/field-kit/tokens";

// 20s (was 30s): with the server's live-version cache-bust, this poll is the
// dominant term in how fast a console action reaches an open device.
const POLL_MS = 20_000;

export default function LiveRefresh({
  programId,
  initialHash,
  label = "Itinerary updated",
}: {
  programId: string;
  initialHash: string;
  /** Banner copy — Today (Slice 5) passes "Today updated" since a change there
   *  may be a roll call / company choice, not an itinerary edit. */
  label?: string;
}) {
  const router = useRouter();
  const asId = useSearchParams().get("asId")?.trim() || "";

  // The hash of what's currently displayed. After a refresh the page re-renders
  // with a fresh `initialHash`; the effect below re-syncs the ref to it so the
  // baseline always tracks the rendered document.
  const currentHash = useRef(initialHash);
  const inFlight = useRef(false);
  const [updated, setUpdated] = useState(false);

  useEffect(() => {
    currentHash.current = initialHash;
  }, [initialHash]);

  const check = useCallback(async () => {
    // Online-only: offline polling is pointless and the page can't be made fresher.
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      // fetchItinerary is network-first and writes the on-device snapshot on a
      // successful live fetch. Act ONLY on the live path: a "cache" result means
      // the fetch was denied / hiccuped, so behave like the old `!res.ok` no-op
      // (the snapshot is never used to drive an online refresh).
      const result = await fetchItinerary(programId, asId);
      if (result.source !== "live") return; // gate/network hiccup — a later trigger retries
      const next = result.hash ?? "";
      if (next && next !== currentHash.current) {
        currentHash.current = next; // adopt now so the refresh doesn't re-trigger
        setUpdated(true);
        router.refresh(); // re-run the server component → live data, same URL/asId
      }
    } catch {
      // network blip — ignore; the next focus/online/poll retries
    } finally {
      inFlight.current = false;
    }
  }, [programId, asId, router]);

  useEffect(() => {
    let pollId: ReturnType<typeof setInterval> | undefined;
    const startPoll = () => {
      if (pollId == null) pollId = setInterval(check, POLL_MS);
    };
    const stopPoll = () => {
      if (pollId != null) {
        clearInterval(pollId);
        pollId = undefined;
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        check(); // catch anything missed while hidden
        startPoll();
      } else {
        stopPoll(); // pause polling in the background
      }
    };
    const onFocus = () => check();
    const onOnline = () => check();

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onOnline);
    if (document.visibilityState === "visible") startPoll();

    return () => {
      stopPoll();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onOnline);
    };
  }, [check]);

  if (!updated) return null;

  return (
    <div role="status" aria-live="polite" style={BANNER_WRAP}>
      <div style={BANNER}>
        <span aria-hidden style={DOT} />
        <span style={LABEL}>{label}</span>
        <button
          type="button"
          onClick={() => setUpdated(false)}
          aria-label="Dismiss"
          style={DISMISS}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// Fixed toast below the sticky top bar, centered — consistent with the top/bottom
// bars (T.black surface, hairline border, grotesk caps).
const BANNER_WRAP: CSSProperties = {
  position: "fixed",
  top: "calc(env(safe-area-inset-top) + 52px)",
  left: 0,
  right: 0,
  zIndex: 45,
  display: "flex",
  justifyContent: "center",
  pointerEvents: "none",
  padding: "0 12px",
};

const BANNER: CSSProperties = {
  pointerEvents: "auto",
  display: "inline-flex",
  alignItems: "center",
  gap: 10,
  backgroundColor: "rgba(14, 10, 19, 0.92)",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  border: `1px solid ${T.border}`,
  borderRadius: 999,
  padding: "8px 10px 8px 14px",
  boxShadow: "0 8px 24px rgba(14,10,19,0.45)",
};

const DOT: CSSProperties = {
  width: 7,
  height: 7,
  borderRadius: "50%",
  backgroundColor: T.yellow,
  flexShrink: 0,
};

const LABEL: CSSProperties = {
  fontFamily: FONT.grotesk,
  fontSize: 9.5,
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: T.ink,
};

const DISMISS: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 18,
  height: 18,
  border: "none",
  background: "transparent",
  padding: 0,
  cursor: "pointer",
  color: T.muted,
  fontSize: 11,
  lineHeight: 1,
};
