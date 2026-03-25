// components/NameStack.tsx
"use client";
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { getHintSync, getHintAsync, setHint, type NameStackHint } from "@/lib/nameStackCache";

interface NameStackProps {
  firstName: string;
  lastName: string;
  /** "auto" = responsive to parent; or pass a fixed px width */
  containerWidth?: number | "auto";
  gapRem?: number;
  fill?: string;
  /** micro-correct via SVG measured widths */
  correctSvgWidth?: boolean;
  /** clamps for responsive mode */
  minWidth?: number;
  maxWidth?: number; // cap the visual box
}

type LayoutState = {
  fSize: number; lSize: number; y1: number; y2: number; svgH: number;
  stage: "fallback" | "final";
};

type Metrics = { w: number; asc: number; desc: number };
const measureCache = new Map<string, Metrics>();

export default function NameStack({
  firstName,
  lastName,
  containerWidth = "auto",
  gapRem = 0.6,
  fill = "#F6E4C1",
  correctSvgWidth = true,
  minWidth = 0,
  maxWidth = 360,           // ⬅️ cap at 360 (not 290)
}: NameStackProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const firstRef = useRef<SVGTextElement>(null);
  const lastRef  = useRef<SVGTextElement>(null);

  const upFirst = (firstName && firstName.trim() ? firstName : "\u00A0").toUpperCase();
  const upLast  = (lastName  && lastName.trim()  ? lastName  : "\u00A0").toUpperCase();

  // Measured container width in px (clamped to min/max)
  const [cw, setCw] = useState<number>(() =>
    typeof containerWidth === "number" ? containerWidth : maxWidth
  );

  useLayoutEffect(() => {
    if (typeof containerWidth === "number") {
      setCw(Math.max(minWidth, Math.min(maxWidth, containerWidth)));
      return;
    }
    const el = wrapperRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      const box = (Array.isArray(entry.contentBoxSize)
        ? entry.contentBoxSize[0]
        : (entry.contentBoxSize as any)) as { inlineSize?: number } | undefined;
      const width = (box?.inlineSize ?? el.clientWidth) || el.clientWidth;
      const clamped = Math.max(minWidth, Math.min(maxWidth, Math.round(width)));
      setCw(clamped);
    });

    ro.observe(el);
    const initial = Math.max(minWidth, Math.min(maxWidth, Math.round(el.clientWidth)));
    setCw(initial);

    return () => ro.disconnect();
  }, [containerWidth, minWidth, maxWidth]);

  const fontVersion = "anton-v27";
  const platform =
    typeof navigator !== "undefined"
      ? (navigator as any).userAgentData?.platform || (navigator as any).platform || "unknown"
      : "ssr";

  const hintKey = useMemo(
    () => `NS|${fontVersion}|${platform}|${cw}|${gapRem}|${upFirst}|${upLast}`,
    [fontVersion, platform, cw, gapRem, upFirst, upLast]
  );

  // fallback state (prevents blank flash)
  const [s, setS] = useState<LayoutState>(() => {
    const approx = Math.max(1, Math.round(cw * 0.38));
    const asc    = Math.round(approx * 0.9);
    const gapPx  = remToPxSafe(gapRem);
    return { fSize: approx, lSize: approx, y1: asc, y2: asc * 2 + gapPx, svgH: Math.max(2, asc * 2 + gapPx), stage: "fallback" };
  });

  useEffect(() => {
    const approx = Math.max(1, Math.round(cw * 0.38));
    const asc    = Math.round(approx * 0.9);
    const gapPx  = remToPxSafe(gapRem);
    setS({ fSize: approx, lSize: approx, y1: asc, y2: asc * 2 + gapPx, svgH: Math.max(2, asc * 2 + gapPx), stage: "fallback" });
  }, [cw, gapRem]);

  // hints
  useEffect(() => {
    const local = getHintSync(hintKey);
    if (local) {
      const { fSize, lSize, y1, y2, svgH } = local;
      setS({ fSize, lSize, y1, y2, svgH, stage: "fallback" });
    }
  }, [hintKey]);

  useLayoutEffect(() => {
    let cancelled = false;
    (async () => {
      const hit = await getHintAsync(hintKey);
      if (!cancelled && hit) {
        const { fSize, lSize, y1, y2, svgH } = hit;
        setS({ fSize, lSize, y1, y2, svgH, stage: "fallback" });
      }
    })();
    return () => { cancelled = true; };
  }, [hintKey]);

  // measurement canvas
  const canvas = useMemo(() => {
    if (typeof document === "undefined") return null;
    const c = document.createElement("canvas");
    c.width = c.height = 1;
    return c;
  }, []);

  useLayoutEffect(() => {
    if (!canvas) return;
    let cancelled = false;

    const BASE = 100;
    const FONT_FAMILY = `"Anton", system-ui, sans-serif`;
    const GAP_PX = remToPx(gapRem);

    const measureAt = (text: string, px: number): Metrics => {
      const ck = `${text}::${px}::${FONT_FAMILY}`;
      const cached = measureCache.get(ck);
      if (cached) return cached;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        const approx = { w: Math.max(1, text.length * px * 0.6), asc: 0.8 * px, desc: 0.2 * px };
        measureCache.set(ck, approx);
        return approx;
      }
      ctx.font = `${px}px ${FONT_FAMILY}`;
      ctx.textBaseline = "alphabetic";
      const m = ctx.measureText(text);
      const res = {
        w: Math.max(1, m.width),
        asc: Math.max(0, m.actualBoundingBoxAscent ?? 0.8 * px),
        desc: Math.max(0, m.actualBoundingBoxDescent ?? 0.2 * px),
      };
      measureCache.set(ck, res);
      return res;
    };

    let tries = 0;
    const MAX_TRIES = 6;

    const compute = () => {
      if (cancelled) return;

      const f = measureAt(upFirst, BASE);
      const l = measureAt(upLast,  BASE);
      if ((f.w < 1 || l.w < 1) && tries < MAX_TRIES) {
        tries++;
        requestAnimationFrame(compute);
        return;
      }

      const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

      // Aim ink width at the actual box width (cw). No factor > 1, so no clipping.
      const TARGET = cw;

      const fScale = clamp(TARGET / f.w, 0.05, 100);
      const lScale = clamp(TARGET / l.w, 0.05, 100);

      let fSize = Math.round(BASE * fScale);
      let lSize = Math.round(BASE * lScale);
      let fAsc  = Math.round(f.asc * fScale);
      let fDesc = Math.round(f.desc * fScale);
      let lAsc  = Math.round(l.asc * lScale);
      let lDesc = Math.round(l.desc * lScale);

      let y1   = fAsc;
      let y2   = fAsc + fDesc + Math.round(GAP_PX) + lAsc;
      let svgH = Math.ceil(Math.max(1, fAsc + fDesc + Math.round(GAP_PX) + lAsc + lDesc));

      const finalize = () => {
        if (cancelled) return;
        const finalState: LayoutState = { fSize, lSize, y1, y2, svgH, stage: "final" };
        setS(finalState);
        setHint(hintKey, finalState as NameStackHint);
      };

      const correctIfNeeded = () => {
        const fe = firstRef.current, le = lastRef.current;
        if (!fe || !le) return finalize();

        const fLen = fe.getComputedTextLength();
        const lLen = le.getComputedTextLength();
        if (!(fLen > 0 && lLen > 0)) return finalize();

        const NEED = 0.5;
        const off = Math.abs(TARGET - fLen) > NEED || Math.abs(TARGET - lLen) > NEED;
        if (!off || !correctSvgWidth) return finalize();

        const fCorr = TARGET / fLen;
        const lCorr = TARGET / lLen;
        const clampCorr = (x: number) => Math.max(0.98, Math.min(1.02, x));

        const fC = clampCorr(fCorr), lC = clampCorr(lCorr);
        fSize = Math.round(fSize * fC);
        lSize = Math.round(lSize * lC);

        const sF = fC, sL = lC;
        fAsc  = Math.round(fAsc  * sF);
        fDesc = Math.round(fDesc * sF);
        lAsc  = Math.round(lAsc  * sL);
        lDesc = Math.round(lDesc * sL);

        y1   = fAsc;
        y2   = fAsc + fDesc + Math.round(GAP_PX) + lAsc;
        svgH = Math.ceil(Math.max(1, fAsc + fDesc + Math.round(GAP_PX) + lAsc + lDesc));

        finalize();
      };

      setS({ fSize, lSize, y1, y2, svgH, stage: "fallback" });
      requestAnimationFrame(correctIfNeeded);
    };

    const start = async () => {
      try {
        // @ts-ignore
        if (document.fonts?.load) await document.fonts.load(`${BASE}px "Anton"`);
        // @ts-ignore
        if (document.fonts?.ready) await document.fonts.ready;
      } catch {}
      requestAnimationFrame(() => requestAnimationFrame(compute));
    };

    start();
    return () => { cancelled = true; };
  }, [hintKey, upFirst, upLast, cw, gapRem, correctSvgWidth, canvas]);

  const common: React.SVGProps<SVGTextElement> = {
    x: 0,
    dominantBaseline: "alphabetic",
    fill,
    style: { fontFamily: "var(--font-anton), system-ui, sans-serif" },
  };

  return (
    <div
      ref={wrapperRef}
      style={{
        width: "100%",
        maxWidth,     // ⬅️ responsive up to 360px
        display: "block",
        minWidth: 0,  // important in flex/grid parents
      }}
    >
      <svg
        viewBox={`0 0 ${cw} ${s.svgH}`}
        role="img"
        aria-label={`${firstName} ${lastName}`}
        style={{ width: "100%", height: "auto", display: "block" }}
        preserveAspectRatio="xMinYMin meet"
      >
        <text ref={firstRef} y={s.y1} fontSize={s.fSize} {...common}>
          {upFirst}
        </text>
        <text ref={lastRef} y={s.y2} fontSize={s.lSize} {...common}>
          {upLast}
        </text>
      </svg>
    </div>
  );
}

/* helpers */
function remToPxSafe(rem: number) {
  if (typeof document === "undefined") return Math.round(rem * 16);
  const root = parseFloat(getComputedStyle(document.documentElement).fontSize || "16");
  return Math.round(rem * root);
}
function remToPx(rem: number) {
  const root = parseFloat(getComputedStyle(document.documentElement).fontSize || "16");
  return rem * root;
}
