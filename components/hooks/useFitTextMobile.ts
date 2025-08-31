import { useLayoutEffect, useRef } from "react";

/**
 * Fits the element's text to its container width on mobile only.
 * Give this ref to a SPAN (inline-block) inside your H2.
 */
export function useFitTextMobile<T extends HTMLElement = HTMLElement>(
  minPx = 24,
  maxPx = 260,
  desktopMin = 1024
) {
  const ref = useRef<T | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    // We want the span's container width. Its parent (the H2) is full width of headline-box.
    const container = el.parentElement as HTMLElement | null;
    if (!container) return;

    const compute = () => {
      const isDesktop = window.matchMedia(`(min-width:${desktopMin}px)`).matches;

      if (isDesktop) {
        // Desktop: let CSS control the size (e.g. lg:text-[12rem])
        el.style.fontSize = "";
        return;
      }

      // Mobile fit
      el.style.whiteSpace = "nowrap";
      el.style.display = "inline-block";
      el.style.fontSize = ""; // start from CSS size

      const target = container.clientWidth || 1; // available width
      const measured = el.scrollWidth || 1;      // natural text width

      const currentPx = parseFloat(getComputedStyle(el).fontSize) || 16;
      let next = currentPx * (target / measured); // scale to fit

      // Clamp to keep it sane
      next = Math.max(minPx, Math.min(maxPx, next));
      el.style.fontSize = `${next}px`;
    };

    const ro = new ResizeObserver(compute);
    ro.observe(container);
    ro.observe(el);

    window.addEventListener("load", compute);
    window.addEventListener("orientationchange", compute);
    (document as any).fonts?.ready?.then?.(compute).catch?.(() => {});

    compute();

    return () => {
      ro.disconnect();
      window.removeEventListener("load", compute);
      window.removeEventListener("orientationchange", compute);
    };
  }, [desktopMin, minPx, maxPx]);

  return ref;
}
