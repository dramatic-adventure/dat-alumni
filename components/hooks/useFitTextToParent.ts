"use client";

import { useLayoutEffect, useRef } from "react";

/** Auto-fit element width to its parent on mobile only. Desktop untouched. */
export function useFitTextToParent<T extends HTMLElement = HTMLHeadingElement>(
  { minPx = 28, maxPx = 520, desktopMin = 768 } = {}
) {
  const ref = useRef<T | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const parent = el.parentElement as HTMLElement | null;
    if (!parent) return;

    const fit = () => {
      const isDesktop = window.matchMedia(`(min-width:${desktopMin}px)`).matches;

      if (isDesktop) {
        // Hand control back to CSS on desktop
        el.style.fontSize = "";
        el.style.whiteSpace = "";
        el.style.display = "";
        return;
      }

      // Mobile auto-fit
      el.style.whiteSpace = "nowrap";
      el.style.display = "inline-block";
      el.style.fontSize = ""; // start from CSS size (vw), then adjust

      requestAnimationFrame(() => {
        const target = parent.getBoundingClientRect().width || 1;
        let curr = parseFloat(getComputedStyle(el).fontSize) || 16;

        // a few refinement passes
        for (let i = 0; i < 8; i++) {
          const w = el.scrollWidth || 1;
          const ratio = target / w;
          if (Math.abs(1 - ratio) < 0.002) break;
          curr = Math.max(minPx, Math.min(maxPx, curr * ratio));
          el.style.fontSize = `${curr}px`;
        }
      });
    };

    const ro = new ResizeObserver(fit);
    ro.observe(parent);
    ro.observe(el);
    window.addEventListener("resize", fit);
    window.addEventListener("orientationchange", fit);
    window.addEventListener("load", fit);
    fit();

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", fit);
      window.removeEventListener("orientationchange", fit);
      window.removeEventListener("load", fit);
    };
  }, [desktopMin, minPx, maxPx]);

  return ref;
}
