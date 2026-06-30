// components/field-kit/TripAlerts.tsx
//
// Slice 3 (Notifications) — the in-kit opt-in for trip alerts (web push). Renders
// inside the AccountMenu dropdown. It requests notification permission, subscribes
// the device via the Field Kit service worker's pushManager, and stores the
// PushSubscription through the gated /api/field-kit/push/subscribe endpoint.
//
// iOS only supports web push for an INSTALLED PWA (iOS 16.4+, standalone display
// mode). On iOS in a normal browser tab the APIs are absent, so we detect that
// and show an "install first" hint instead of a dead button. Everywhere else we
// offer a one-tap opt-in (and an opt-out once subscribed).

"use client";

import { useCallback, useEffect, useState } from "react";
import { BellRing, BellOff } from "lucide-react";
import { T, FONT } from "@/components/field-kit/tokens";

type State =
  | "loading"
  | "unsupported" // no push support at all (and not the iOS-install case)
  | "ios-install" // iOS, not installed → must Add to Home Screen first
  | "off" // supported, not subscribed
  | "on" // subscribed on this device
  | "denied" // permission blocked in OS/browser settings
  | "working"; // request in flight

const rowStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  textAlign: "left",
  padding: "11px 14px",
  fontFamily: FONT.grotesk,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: T.ink,
  textDecoration: "none",
  background: "transparent",
  border: "none",
  cursor: "pointer",
};

const iconRow: React.CSSProperties = { ...rowStyle, display: "flex", alignItems: "center", gap: 9 };

const hintStyle: React.CSSProperties = {
  fontFamily: FONT.dm,
  fontSize: 11,
  lineHeight: 1.45,
  color: T.muted,
  margin: 0,
  padding: "0 14px 12px",
  textTransform: "none",
  letterSpacing: 0,
};

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

function isStandalone(): boolean {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIOS(): boolean {
  const ua = window.navigator.userAgent || "";
  return /iphone|ipad|ipod/i.test(ua) || (/Macintosh/.test(ua) && "ontouchend" in document);
}

export default function TripAlerts({ programId }: { programId: string }) {
  const [state, setState] = useState<State>("loading");
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

  // Resolve the current opt-in state on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!pushSupported() || !vapidKey) {
        // iOS in a tab can't support push until installed — guide that case.
        if (typeof window !== "undefined" && isIOS() && !isStandalone()) {
          if (!cancelled) setState("ios-install");
        } else if (!cancelled) {
          setState("unsupported");
        }
        return;
      }
      if (Notification.permission === "denied") {
        if (!cancelled) setState("denied");
        return;
      }
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (!cancelled) setState(sub ? "on" : "off");
      } catch {
        if (!cancelled) setState("off");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [vapidKey]);

  const enable = useCallback(async () => {
    setState("working");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "off");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      const sub =
        existing ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        }));
      const res = await fetch("/api/field-kit/push/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ program: programId, subscription: sub.toJSON() }),
      });
      if (!res.ok) {
        // Roll back the local subscription if the server wouldn't store it.
        await sub.unsubscribe().catch(() => undefined);
        setState("off");
        return;
      }
      setState("on");
    } catch {
      setState("off");
    }
  }, [programId, vapidKey]);

  const disable = useCallback(async () => {
    setState("working");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/field-kit/push/unsubscribe", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ program: programId, endpoint: sub.endpoint }),
        }).catch(() => undefined);
        await sub.unsubscribe().catch(() => undefined);
      }
      setState("off");
    } catch {
      setState("on");
    }
  }, [programId]);

  if (state === "loading" || state === "unsupported") return null;

  return (
    <div style={{ borderTop: `1px solid ${T.sep}` }}>
      {state === "ios-install" && (
        <>
          <div style={{ ...iconRow, cursor: "default" }}>
            <BellRing size={15} aria-hidden /> Get trip alerts
          </div>
          <p style={hintStyle}>Install the Field&nbsp;Kit first: tap Share, then Add to Home Screen, then open it from your home screen to turn on alerts.</p>
        </>
      )}

      {state === "denied" && (
        <>
          <div style={{ ...iconRow, cursor: "default", color: T.muted }}>
            <BellOff size={15} aria-hidden /> Trip alerts blocked
          </div>
          <p style={hintStyle}>Notifications are turned off for the Field&nbsp;Kit in your device settings. Re-enable them there to get trip alerts.</p>
        </>
      )}

      {(state === "off" || state === "working") && (
        <>
          <button type="button" role="menuitem" onClick={enable} disabled={state === "working"} style={iconRow}>
            <BellRing size={15} aria-hidden /> {state === "working" ? "Turning on…" : "Get trip alerts"}
          </button>
          <p style={hintStyle}>Field updates and rally points, pushed to this device — even when the kit is closed.</p>
        </>
      )}

      {state === "on" && (
        <>
          <div style={{ ...iconRow, cursor: "default", color: T.green }}>
            <BellRing size={15} aria-hidden /> Trip alerts on
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={disable}
            style={{ ...rowStyle, color: T.muted, paddingTop: 0 }}
          >
            Turn off on this device
          </button>
        </>
      )}
    </div>
  );
}
