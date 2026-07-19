// components/field-kit/EnableAlertsBanner.tsx
//
// Prominent "turn on trip alerts" nudge on the Today home. Push is how rally
// points and roll calls reach artists in SECONDS (the 20s itinerary poll is
// the fallback) — but the opt-in used to live only inside the account menu,
// so most devices never subscribed. This banner shows until alerts are ON:
//   • supported + not subscribed → one-tap enable (same flow as TripAlerts)
//   • iOS in a browser tab → walk through Add to Home Screen first
//   • permission denied → point at device settings
// Dismissible per SESSION (sessionStorage) so it isn't modal-level naggy, but
// it returns next open until the device is actually subscribed.
//
// Subscription plumbing mirrors components/field-kit/TripAlerts.tsx — keep the
// two in lockstep if the subscribe endpoint or VAPID handling changes.

"use client";

import { useCallback, useEffect, useState } from "react";
import { BellRing } from "lucide-react";
import { T, FONT } from "@/components/field-kit/tokens";

type State =
  | "hidden" // loading, unsupported, already on, or dismissed this session
  | "off" // supported, not subscribed → show the one-tap enable
  | "ios-install" // iOS browser tab → install first
  | "denied" // permission blocked at the OS level
  | "working";

const DISMISS_KEY = "fk-alerts-nudge-dismissed";

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

export default function EnableAlertsBanner({ programId }: { programId: string }) {
  const [state, setState] = useState<State>("hidden");
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (sessionStorage.getItem(DISMISS_KEY)) return;
      } catch {
        /* storage blocked — still show the nudge */
      }
      if (!pushSupported() || !vapidKey) {
        if (typeof window !== "undefined" && isIOS() && !isStandalone() && vapidKey) {
          if (!cancelled) setState("ios-install");
        }
        return; // truly unsupported → stay hidden
      }
      if (Notification.permission === "denied") {
        if (!cancelled) setState("denied");
        return;
      }
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (!cancelled) setState(sub ? "hidden" : "off");
      } catch {
        if (!cancelled) setState("off");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [vapidKey]);

  const dismiss = useCallback(() => {
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* fine — it just reappears */
    }
    setState("hidden");
  }, []);

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
        await sub.unsubscribe().catch(() => undefined);
        setState("off");
        return;
      }
      setState("hidden"); // done — alerts are on
    } catch {
      setState("off");
    }
  }, [programId, vapidKey]);

  if (state === "hidden") return null;

  return (
    <section
      aria-label="Turn on trip alerts"
      style={{
        margin: "16px clamp(14px, 4vw, 24px) 0",
        padding: "14px 16px",
        borderRadius: 14,
        border: `1px solid ${T.yellow}`,
        backgroundColor: "rgba(245,200,66,0.08)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <span aria-hidden style={{ color: T.yellow, flexShrink: 0, transform: "translateY(1px)" }}>
          <BellRing size={17} />
        </span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p
            style={{
              fontFamily: FONT.grotesk, fontSize: 10, fontWeight: 700,
              letterSpacing: "0.16em", textTransform: "uppercase", color: T.yellow,
              margin: "0 0 4px",
            }}
          >
            Turn on trip alerts
          </p>
          {state === "ios-install" ? (
            <p style={{ fontFamily: FONT.dm, fontSize: 13, lineHeight: 1.5, color: T.ink, margin: 0 }}>
              Rally points and roll calls reach you in seconds with alerts on. First install the
              Field&nbsp;Kit: tap <strong>Share</strong>, then <strong>Add to Home Screen</strong>,
              then open it from your home screen and tap this banner again.
            </p>
          ) : state === "denied" ? (
            <p style={{ fontFamily: FONT.dm, fontSize: 13, lineHeight: 1.5, color: T.ink, margin: 0 }}>
              Notifications are blocked for the Field&nbsp;Kit in your device settings — re-enable
              them there so rally points and roll calls reach you in seconds.
            </p>
          ) : (
            <p style={{ fontFamily: FONT.dm, fontSize: 13, lineHeight: 1.5, color: T.ink, margin: 0 }}>
              Rally points, roll calls, and field updates land on this device in seconds — even
              with the kit closed.
            </p>
          )}
          {(state === "off" || state === "working") && (
            <button
              type="button"
              onClick={enable}
              disabled={state === "working"}
              style={{
                marginTop: 10,
                fontFamily: FONT.grotesk, fontSize: 11, fontWeight: 700,
                letterSpacing: "0.1em", textTransform: "uppercase",
                color: T.black, backgroundColor: T.yellow,
                border: "none", borderRadius: 8, padding: "9px 18px",
                cursor: "pointer", opacity: state === "working" ? 0.6 : 1,
              }}
            >
              {state === "working" ? "Turning on…" : "Turn on alerts"}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Not now"
          style={{
            flexShrink: 0, border: "none", background: "transparent",
            color: T.muted, fontSize: 13, lineHeight: 1, cursor: "pointer", padding: 4,
          }}
        >
          ✕
        </button>
      </div>
    </section>
  );
}
