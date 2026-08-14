"use client";

// Cloudflare Turnstile widget for the mailing-list forms.
//
// Renders nothing when NEXT_PUBLIC_TURNSTILE_SITE_KEY is unset (inlined at
// build time), so the forms work unchanged until the Cloudflare keys exist.
// "interaction-only" keeps the widget invisible for the vast majority of
// visitors — it only surfaces a challenge when Cloudflare is suspicious.
//
// The parent form should NOT block submission on a missing token: if the
// script is blocked or slow, the server records the tokenless signup as
// quarantined for review instead of losing it (see /api/mailing-list).

import { useEffect, useRef } from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  remove: (id: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise<void>((resolve, reject) => {
      const s = document.createElement("script");
      s.src = SCRIPT_SRC;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => {
        scriptPromise = null; // allow a retry on next mount
        reject(new Error("turnstile script failed to load"));
      };
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
}

export default function TurnstileWidget({
  onToken,
}: {
  /** Called with a fresh token, or null when the token expires/errors. */
  onToken: (token: string | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;

  useEffect(() => {
    if (!SITE_KEY) return;
    let widgetId: string | null = null;
    let cancelled = false;

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        widgetId = window.turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          callback: (token: string) => onTokenRef.current(token),
          "expired-callback": () => onTokenRef.current(null),
          "error-callback": () => onTokenRef.current(null),
          "refresh-expired": "auto",
          appearance: "interaction-only",
          size: "flexible",
        });
      })
      .catch(() => {
        // Script blocked (ad blocker, offline). Submission proceeds without a
        // token; the server quarantines it for review rather than losing it.
      });

    return () => {
      cancelled = true;
      if (widgetId && window.turnstile) {
        try {
          window.turnstile.remove(widgetId);
        } catch {
          // already gone
        }
      }
    };
  }, []);

  if (!SITE_KEY) return null;
  return <div ref={containerRef} />;
}
