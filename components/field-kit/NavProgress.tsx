// components/field-kit/NavProgress.tsx
//
// Kit-wide "navigation in flight" indicator — a slim indeterminate progress
// bar pinned to the top of the viewport while a tapped link's soft navigation
// is pending. Every kit page is force-dynamic (blocks on Google Sheets), so on
// venue wifi there's a real gap between the tap and the route's loading.tsx
// skeleton painting; this bar fills that gap so the tap never reads as dead.
//
// How it works: a document-level click listener (bubble phase, so app handlers
// run first) watches for taps on same-origin links that will actually navigate
// somewhere new, and shows the bar. It hides the moment the router commits
// (usePathname/useSearchParams change — which is also when loading.tsx takes
// over), with a safety timeout in case a navigation is cancelled or fails.
// One mount in app/field-kit/layout.tsx covers every link in the kit — no
// per-link wiring.

"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { T } from "@/components/field-kit/tokens";

// Generous: slow field wifi is the whole point. If nothing committed by then,
// the navigation was cancelled/failed and the bar shouldn't linger forever.
const SAFETY_TIMEOUT_MS = 15_000;

export default function NavProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const [pending, setPending] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Show: a qualifying link tap.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // new-tab intents
      const anchor = (e.target as Element | null)?.closest?.("a[href]");
      if (!anchor) return;
      if (anchor.getAttribute("target") && anchor.getAttribute("target") !== "_self") return;
      if (anchor.hasAttribute("download")) return;
      const href = anchor.getAttribute("href") || "";
      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return; // external → full page load, browser shows its own progress
      // Same-URL / hash-only taps don't navigate — no bar (it would never clear).
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      setPending(true);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // Hide: the router committed (loading.tsx / the new page takes over now).
  useEffect(() => {
    setPending(false);
  }, [pathname, search]);

  // Safety valve for cancelled/failed navigations.
  useEffect(() => {
    if (!pending) return;
    timeoutRef.current = setTimeout(() => setPending(false), SAFETY_TIMEOUT_MS);
    return () => clearTimeout(timeoutRef.current);
  }, [pending]);

  if (!pending) return null;

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        top: "env(safe-area-inset-top, 0px)",
        left: 0,
        right: 0,
        height: 3,
        zIndex: 60, // above the sticky bars (40) and the account menu (51)
        pointerEvents: "none",
        overflow: "hidden",
        backgroundColor: "rgba(245,200,66,0.15)", // faint track in the bar's own color
      }}
    >
      <style>{`@keyframes fkNavProgress { 0% { transform: translateX(-100%); } 100% { transform: translateX(250%); } }`}</style>
      <span
        style={{
          display: "block",
          width: "40%",
          height: "100%",
          backgroundColor: T.yellow,
          borderRadius: 2,
          animation: "fkNavProgress 1s ease-in-out infinite",
        }}
      />
    </div>
  );
}
