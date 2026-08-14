"use client";

// Cloudflare Turnstile widget for the mailing-list forms.
//
// Renders nothing when NEXT_PUBLIC_TURNSTILE_SITE_KEY is unset (inlined at
// build time), so the forms work unchanged until the Cloudflare keys exist.
//
// AESTHETICS: the widget is a Cloudflare-hosted iframe, so its internals can't
// be recolored or made transparent (deliberate on their side — a challenge you
// can restyle is a challenge you can spoof). What IS ours:
//   - `theme` — matched to the host form (all three mailing-list forms are
//     dark, so they pass "dark"; default "auto").
//   - WHEN it runs — `execution: "execute"` defers the challenge until the
//     parent flips `run` to true (the forms do this on the first keystroke in
//     the name/email fields). Visitors who never touch the form never load a
//     challenge; those who do usually still see nothing ("interaction-only"
//     keeps it invisible unless Cloudflare is suspicious).
//   - Layout — while invisible the container compensates the parent's flex
//     gap with a negative margin, so form spacing is pixel-identical to having
//     no widget. When a challenge is about to show
//     (`before-interactive-callback`), the container opens up full-width.
//
// The parent form should NOT block submission on a missing token: if the
// script is blocked or slow, the server records the tokenless signup as
// quarantined for review instead of losing it (see /api/mailing-list).

import { useEffect, useRef, useState } from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  execute: (widgetId: string) => void;
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
  run = true,
  theme = "auto",
  /** The parent form's flex `gap`, compensated while the widget is invisible. */
  gap = "0.75rem",
}: {
  /** Called with a fresh token, or null when the token expires/errors. */
  onToken: (token: string | null) => void;
  /** The challenge only runs once this becomes true (e.g. first keystroke). */
  run?: boolean;
  theme?: "light" | "dark" | "auto";
  gap?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;
  const widgetIdRef = useRef<string | null>(null);
  const executedRef = useRef(false);
  const [rendered, setRendered] = useState(false);
  // True from the moment Cloudflare decides to show an interactive challenge.
  const [challengeVisible, setChallengeVisible] = useState(false);

  useEffect(() => {
    if (!SITE_KEY) return;
    let cancelled = false;

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          theme,
          execution: "execute", // idle until we call execute() below
          callback: (token: string) => onTokenRef.current(token),
          "expired-callback": () => onTokenRef.current(null),
          "error-callback": () => onTokenRef.current(null),
          "before-interactive-callback": () => setChallengeVisible(true),
          "refresh-expired": "auto",
          appearance: "interaction-only",
          size: "flexible",
        });
        setRendered(true);
      })
      .catch(() => {
        // Script blocked (ad blocker, offline). Submission proceeds without a
        // token; the server quarantines it for review rather than losing it.
      });

    return () => {
      cancelled = true;
      executedRef.current = false;
      setRendered(false);
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // already gone
        }
        widgetIdRef.current = null;
      }
    };
  }, [theme]);

  // Fire the (usually invisible) challenge once the visitor engages the form.
  useEffect(() => {
    if (!run || !rendered || executedRef.current) return;
    if (window.turnstile && widgetIdRef.current) {
      executedRef.current = true;
      window.turnstile.execute(widgetIdRef.current);
    }
  }, [run, rendered]);

  if (!SITE_KEY) return null;
  return (
    <div
      ref={containerRef}
      style={
        challengeVisible
          ? // Challenge on screen: span the form, breathe a little, and take
            // the same 8px corner rounding as the form inputs.
            { width: "100%", margin: "0.25rem 0", borderRadius: 8, overflow: "hidden" }
          : // Idle/invisible: cancel the parent flex gap this element would
            // otherwise introduce, so the form layout is unchanged.
            { width: "100%", marginTop: `-${gap}` }
      }
    />
  );
}
