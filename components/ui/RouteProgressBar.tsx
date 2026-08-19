"use client";

// components/ui/RouteProgressBar.tsx
//
// Global route-transition progress bar (zero dependencies).
//
// Many pages block on Google Sheets round-trips before the server can render,
// so a link click can produce no visual change for seconds. This paints a thin
// DAT-yellow bar along the very top of the viewport the moment a same-origin
// link is clicked (or back/forward is pressed), trickles toward 90%, and
// completes + fades when the route actually changes. It pairs with the
// route-level loading.tsx skeletons: the bar acknowledges the click instantly,
// the skeleton sketches the incoming page.
//
// Implementation notes:
// - The App Router has no public "navigation start" event, so we detect intent
//   via a capture-phase click listener on <a> elements plus popstate. All the
//   usual non-navigation cases are filtered out (new tab, download, modifier
//   keys, external origin, hash-only, same URL).
// - The bar only becomes visible after SHOW_DELAY_MS so instant navigations
//   (prefetched static pages) never flash it.
// - Completion is driven by usePathname/useSearchParams changing, which also
//   catches programmatic router.push() navigations we never saw a click for
//   (finish() is a no-op when the bar isn't active).
// - Add data-no-progress="true" to an <a> to opt it out (e.g. links that only
//   open modals).

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const BAR_COLOR = "#FFCC00"; // DAT yellow
const SHOW_DELAY_MS = 120; // don't flash on instant navigations
const SAFETY_TIMEOUT_MS = 20000; // never leave a stuck bar on screen

type Timers = {
  show?: number;
  trickle?: number;
  safety?: number;
  done?: number;
};

function ProgressBarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams?.toString() ?? "";

  const [progress, setProgress] = useState(0);
  const [opacity, setOpacity] = useState(0);

  const activeRef = useRef(false);
  const timersRef = useRef<Timers>({});

  const clearTimers = useCallback(() => {
    const t = timersRef.current;
    if (t.show !== undefined) window.clearTimeout(t.show);
    if (t.trickle !== undefined) window.clearInterval(t.trickle);
    if (t.safety !== undefined) window.clearTimeout(t.safety);
    if (t.done !== undefined) window.clearTimeout(t.done);
    timersRef.current = {};
  }, []);

  const finish = useCallback(() => {
    if (!activeRef.current) return;
    activeRef.current = false;
    clearTimers();
    // Sprint to the end, then fade out and reset.
    setOpacity(1);
    setProgress(100);
    timersRef.current.done = window.setTimeout(() => {
      setOpacity(0);
      timersRef.current.done = window.setTimeout(() => setProgress(0), 350);
    }, 250);
  }, [clearTimers]);

  const start = useCallback(() => {
    if (activeRef.current) return;
    activeRef.current = true;
    clearTimers();
    setProgress(0);

    timersRef.current.show = window.setTimeout(() => {
      setOpacity(1);
      setProgress(12);
      timersRef.current.trickle = window.setInterval(() => {
        setProgress((p) => (p >= 90 ? p : p + Math.max(0.4, (90 - p) * 0.08)));
      }, 220);
    }, SHOW_DELAY_MS);

    timersRef.current.safety = window.setTimeout(finish, SAFETY_TIMEOUT_MS);
  }, [clearTimers, finish]);

  // Detect navigation intent: same-origin link clicks + back/forward.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const el = e.target as HTMLElement | null;
      const anchor = el?.closest?.("a");
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;
      if (anchor.getAttribute("data-no-progress") === "true") return;

      const rawHref = anchor.getAttribute("href");
      if (!rawHref || rawHref.startsWith("#")) return;

      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      // Same page (hash change or identical URL) — no route transition coming.
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search
      ) {
        return;
      }

      start();
    };

    const onPopState = () => start();

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
    };
  }, [start]);

  // The route actually changed — complete the bar.
  useEffect(() => {
    finish();
  }, [pathname, search, finish]);

  // Cleanup on unmount.
  useEffect(() => clearTimers, [clearTimers]);

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        zIndex: 9999,
        pointerEvents: "none",
        opacity,
        transition: "opacity 300ms ease",
      }}
    >
      <div
        style={{
          height: "100%",
          width: "100%",
          transform: `scaleX(${progress / 100})`,
          transformOrigin: "left",
          backgroundColor: BAR_COLOR,
          boxShadow:
            "0 0 8px rgba(255, 204, 0, 0.7), 0 0 2px rgba(255, 204, 0, 0.9)",
          transition: "transform 200ms ease",
        }}
      />
    </div>
  );
}

export default function RouteProgressBar() {
  // useSearchParams requires a Suspense boundary in the App Router.
  return (
    <Suspense fallback={null}>
      <ProgressBarInner />
    </Suspense>
  );
}
