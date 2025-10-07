"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";

interface NameStackProps {
  firstName: string;
  lastName: string;
  containerWidth?: number; // default 290
  gap?: string; // default 0.4rem
}

export default function NameStack({
  firstName,
  lastName,
  containerWidth = 290,
  gap = "0.4rem",
}: NameStackProps) {
  const firstRef = useRef<HTMLDivElement>(null);
  const lastRef = useRef<HTMLDivElement>(null);
  const [firstFontSize, setFirstFontSize] = useState("4.5rem");
  const [lastFontSize, setLastFontSize] = useState("4.5rem");
  const [isReady, setIsReady] = useState(false);

  // --- HARD RELOAD FAILSAFE ---
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deadlineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const POLL_MS = 120;
  const DEADLINE_MS = 3000;         // reload if still not correct after 3s
  const RELOAD_COOLDOWN_MS = 10000; // avoid reload loops

  const safeReload = () => {
    try {
      const key = "namestack_last_reload";
      const last = Number(sessionStorage.getItem(key) || "0");
      const now = Date.now();
      if (now - last < RELOAD_COOLDOWN_MS) return; // avoid loop
      sessionStorage.setItem(key, String(now));
    } catch {
      /* no-op */
    }
    (globalThis as unknown as Window).location.reload();
  };

  const calculateSizes = useCallback(() => {
    const firstEl = firstRef.current;
    const lastEl = lastRef.current;
    if (!firstEl || !lastEl) return;

    const firstWidth = firstEl.scrollWidth;
    const lastWidth = lastEl.scrollWidth;

    // If either width is 0 (fonts/layout not ready yet), retry next frame
    if (firstWidth === 0 || lastWidth === 0) {
      requestAnimationFrame(calculateSizes);
      return;
    }

    const baseFontSize = 72;
    const firstRatio = containerWidth / firstWidth;
    const lastRatio = containerWidth / lastWidth;

    setFirstFontSize(`${baseFontSize * firstRatio}px`);
    setLastFontSize(`${baseFontSize * lastRatio}px`);
  }, [containerWidth]);

  const verifySizes = useCallback(() => {
    const firstEl = firstRef.current;
    const lastEl = lastRef.current;
    if (!firstEl || !lastEl) return false;

    const fw = Math.round(firstEl.getBoundingClientRect().width);
    const lw = Math.round(lastEl.getBoundingClientRect().width);

    if (fw === 0 || lw === 0) return false;

    const tol = 2;
    const okFirst = Math.abs(fw - containerWidth) <= tol;
    const okLast = Math.abs(lw - containerWidth) <= tol;
    return okFirst && okLast;
  }, [containerWidth]);

  useEffect(() => {
    // cleanup
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    if (deadlineTimerRef.current) clearTimeout(deadlineTimerRef.current);
    setIsReady(false);

    const tick = () => {
      calculateSizes();

      // allow one paint then verify
      requestAnimationFrame(() => {
        const ok = verifySizes();
        if (ok) {
          setIsReady(true);
          return; // stop polling; deadline will no-op
        }
        // keep polling
        pollTimerRef.current = setTimeout(tick, POLL_MS);
      });
    };

    const start = () => {
      // your original delayed verifies
      setTimeout(() => verifySizes() || calculateSizes(), 150);
      setTimeout(() => verifySizes() || calculateSizes(), 500);

      // start polling loop
      tick();

      // final deadline: if still not OK, reload
      deadlineTimerRef.current = setTimeout(() => {
        if (!verifySizes()) safeReload();
      }, DEADLINE_MS);
    };

    if ((document as any).fonts?.ready) {
      (document as any).fonts.ready.then(start);
    } else {
      start();
    }

    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
      if (deadlineTimerRef.current) clearTimeout(deadlineTimerRef.current);
    };
  }, [firstName, lastName, containerWidth, calculateSizes, verifySizes]);

  const baseStyle: React.CSSProperties = {
    fontFamily: "var(--font-anton), system-ui, sans-serif",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
    color: "#F6E4C1",
    lineHeight: 1,
    margin: 0,
  };

  const containerStyle: React.CSSProperties = {
    width: `${containerWidth}px`,
    display: "flex",
    justifyContent: "flex-start",
    overflow: "visible",
  };

  return (
    <>
      <style>{`
        @media (max-width: 1024px) {
          .scaled-name-outer {
            display: flex;
            justify-content: center;
            width: 100%;
            margin: 0 auto;
          }
          .scaled-name-inner {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
        }
      `}</style>

      <div
        className="scaled-name-outer"
        style={{
          opacity: isReady ? 1 : 0,
          transition: "opacity 0.15s ease",
        }}
      >
        <div className="scaled-name-inner">
          {/* First Name */}
          <div style={{ ...containerStyle, alignItems: "flex-end" }}>
            <div ref={firstRef} style={{ ...baseStyle, fontSize: firstFontSize }}>
              {firstName}
            </div>
          </div>

          {/* Gap */}
          <div style={{ height: gap }} />

          {/* Last Name */}
          <div style={{ ...containerStyle, alignItems: "flex-start" }}>
            <div ref={lastRef} style={{ ...baseStyle, fontSize: lastFontSize }}>
              {lastName}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
