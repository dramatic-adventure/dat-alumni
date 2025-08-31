"use client";

import { useLayoutEffect, useRef } from "react";

type Options = {
  minPx?: number;       // lower clamp for font-size
  maxPx?: number;       // upper clamp for font-size
  desktopMin?: number;  // disable fitting at/above this width
  smoothMs?: number;    // ease font-size changes (ms)
  snap?: boolean;       // if true, no easing (instant snap)
};

/**
 * Full-width, mobile-only fit:
 * - Uses font-size (like your proven version) for an exact fill under 768px
 * - rAF-throttled, observes parent + element
 * - One-pass ratio + tiny refine for precision
 */
export function useFitTextToParent<T extends HTMLElement = HTMLHeadingElement>({
  minPx = 28,
  maxPx = 520,
  desktopMin = 768,
  smoothMs = 120,
  snap = false,
}: Options = {}) {
  const ref = useRef<T | null>(null);
  const raf = useRef<number | null>(null);
  const ro = useRef<ResizeObserver | null>(null);
  const last = useRef<{ parentW: number; fontPx: number } | null>(null);

  const schedule = (fn: () => void) => {
    if (raf.current != null) cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(fn);
  };

  const fitNow = () => {
    const el = ref.current;
    if (!el) return;
    const parent = el.parentElement as HTMLElement | null;
    if (!parent) return;

    const isDesktop = window.matchMedia(`(min-width:${desktopMin}px)`).matches;
    if (isDesktop) {
      // Hand control back to CSS on desktop
      el.style.transition = "";
      el.style.fontSize = "";
      el.style.whiteSpace = "";
      el.style.display = "";
      el.style.transform = "translateZ(0)"; // keep GPU hint
      last.current = null;
      return;
    }

    // Mobile fit
    el.style.whiteSpace = "nowrap";
    el.style.display = "inline-block";
    el.style.transform = "translateZ(0)";
    el.style.transition = snap ? "" : `font-size ${smoothMs}ms ease-out`;

    const ps = getComputedStyle(parent);
    const avail =
      parent.clientWidth -
      (parseFloat(ps.paddingLeft) || 0) -
      (parseFloat(ps.paddingRight) || 0);

    const cs = getComputedStyle(el);
    let basePx = parseFloat(cs.fontSize) || minPx;
    basePx = Math.max(minPx, Math.min(maxPx, basePx));

    // If last measurement is close, skip tiny work
    if (last.current && Math.abs(last.current.parentW - avail) < 0.5) return;

    // --- Pass 1: compute exact ratio from current size ---
    el.style.fontSize = `${basePx}px`;
    const w1 = Math.max(1, el.scrollWidth);
    let targetPx = Math.max(minPx, Math.min(maxPx, (basePx * avail) / w1));

    // --- Pass 2 (refine): remeasure once at targetPx to reduce rounding error ---
    el.style.fontSize = `${targetPx}px`;
    const w2 = Math.max(1, el.scrollWidth);
    if (Math.abs(w2 - avail) / avail > 0.002) {
      targetPx = Math.max(minPx, Math.min(maxPx, (targetPx * avail) / w2));
      el.style.fontSize = `${targetPx}px`;
    }

    last.current = { parentW: avail, fontPx: targetPx };
  };

  useLayoutEffect(() => {
    const onResize = () => schedule(fitNow);
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);

    // Observe both parent & element for size/content changes
    const parent = ref.current?.parentElement;
    if (parent) {
      ro.current = new ResizeObserver(() => schedule(fitNow));
      ro.current.observe(parent);
      if (ref.current) ro.current.observe(ref.current);
    }

    // Initial
    schedule(fitNow);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      if (raf.current != null) cancelAnimationFrame(raf.current);
      ro.current?.disconnect();
      ro.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desktopMin, minPx, maxPx, smoothMs, snap]);

  return ref;
}
