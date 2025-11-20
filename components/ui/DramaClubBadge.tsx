"use client";

import * as React from "react";

/**
 * DramaClubBadge (editorial, auto-fit, no outline)
 *
 * - Solid circle in a deterministic “club color” (or override via `primaryColor`).
 * - Each word stays on one line; long words shrink just enough to fit.
 * - If the total stack is too tall, everything scales down uniformly.
 * - Avoid nested anchors with `wrappedByParentLink`.
 */
export default function DramaClubBadge({
  name,
  location,
  href,
  size = 116,
  wrappedByParentLink = false,
  showLocation = false,
  ariaLabel,
  primaryColor,
}: {
  name?: string;
  location?: string;
  href?: string;
  size?: number;
  wrappedByParentLink?: boolean;
  showLocation?: boolean;
  ariaLabel?: string;
  primaryColor?: string;
}) {
  // ✅ Use a safe string so hooks can always run, even if name is undefined
  const safeName = name ?? "";

  /* ---------- Palette (DAT-adjacent) ---------- */
  const CLUB_COLORS = [
    "#6C00AF", // DAT Purple
    "#F23359", // DAT Pink
    "#2493A9", // DAT Blue
    "#F2C94C", // warm yellow
    "#E86F34", // burnt orange
    "#7A9E1F", // olive/green
    "#2B59C3", // royal blue
    "#9B51E0", // violet
  ];
  const hashOf = (s: string) =>
    Array.from(s).reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 0);
  const circleColor =
    primaryColor ??
    CLUB_COLORS[hashOf(safeName) % CLUB_COLORS.length] ??
    "#6C00AF";

  /* ---------- Geometry & tokens ---------- */
  const tokens = React.useMemo(
    () => safeName.split(/\s+/).filter(Boolean),
    [safeName]
  );

  // Scale base diameter slightly for long labels
  const totalLen = safeName.length;
  let diameter = size;
  if (totalLen > 26) diameter = Math.max(size, size + 18);
  if (totalLen > 36) diameter = Math.max(size, size + 34);
  if (totalLen > 44) diameter = Math.max(size, size + 52);

  // Padding inside the circle (no rim / outline)
  const padding = Math.max(8, Math.round(diameter * 0.08));
  const inner = Math.max(0, diameter - padding * 2);

  // Baseline font sizing
  const baseWordPx = Math.max(10, Math.round(inner * 0.20));
  const locationPx = Math.max(9, Math.round(inner * 0.12));
  const lineGap = Math.max(2, Math.round(inner * 0.04));

  /* ---------- Measurement & scaling ---------- */
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const tokenRefs = React.useRef<Array<HTMLSpanElement | null>>([]);
  const setTokenRef =
    (idx: number) =>
    (el: HTMLSpanElement | null): void => {
      tokenRefs.current[idx] = el;
    };

  const [tokenScales, setTokenScales] = React.useState<number[]>(
    () => tokens.map(() => 1)
  );
  const [globalScale, setGlobalScale] = React.useState(1);

  React.useLayoutEffect(() => {
    const box = containerRef.current;
    if (!box) return;

    const maxWordWidth = inner * 0.84;

    // 1) Per-word horizontal fit
    const nextTokenScales = tokens.map((_tok, i) => {
      const el = tokenRefs.current[i];
      if (!el) return 1;
      el.style.fontSize = `${baseWordPx}px`;
      el.style.transform = "scale(1)";
      el.style.whiteSpace = "nowrap";

      const natural = el.scrollWidth;
      if (natural <= maxWordWidth) return 1;
      return Math.max(0.55, Math.min(1, maxWordWidth / natural));
    });

    setTokenScales(nextTokenScales);

    // 2) Vertical stack fit (measure real heights)
    tokenRefs.current.forEach((el, i) => {
      if (el) {
        el.style.fontSize = `${Math.round(
          baseWordPx * nextTokenScales[i]
        )}px`;
      }
    });

    let linesHeight = 0;
    tokenRefs.current.forEach((el) => {
      if (el) linesHeight += el.offsetHeight;
    });

    const gaps = Math.max(0, tokens.length - 1) * lineGap;
    const locHeight =
      showLocation && location ? Math.round(locationPx * 1.15) : 0;
    const totalBlock =
      linesHeight + gaps + (locHeight ? locHeight + lineGap : 0);

    const maxStackHeight = inner * 0.86;
    const neededGlobal =
      totalBlock > maxStackHeight ? maxStackHeight / totalBlock : 1;
    setGlobalScale(Math.max(0.6, Math.min(1, neededGlobal)));
  }, [tokens, inner, lineGap, baseWordPx, locationPx, location, showLocation]);

  // ✅ Hooks are all declared above.
  // Now it's safe to early-return if there's no *real* name.
  if (!name) return null;

  /* ---------- Core (single solid circle, no outline) ---------- */
  const Core = (
    <div
      aria-hidden={wrappedByParentLink || !href ? true : undefined}
      role={!wrappedByParentLink && !href ? "img" : undefined}
      aria-label={
        !wrappedByParentLink && !href ? ariaLabel ?? name : undefined
      }
      style={{
        width: diameter,
        height: diameter,
        borderRadius: 999,
        background: circleColor,
        display: "grid",
        placeItems: "center",
        boxSizing: "border-box",
        padding, // internal padding only – no secondary inner disc
        transition: "opacity 120ms ease",
      }}
    >
      <div
        ref={containerRef}
        style={{
          width: inner,
          height: inner,
          display: "grid",
          placeItems: "center",
          textAlign: "center",
        }}
      >
        <div
          style={{
            transform: `scale(${globalScale})`,
            transformOrigin: "center",
            maxWidth: Math.round(inner * 0.9),
          }}
        >
          {tokens.map((tok, i) => (
            <div
              key={`${tok}-${i}`}
              style={{ marginTop: i === 0 ? 0 : lineGap, lineHeight: 1.0 }}
            >
              <span
                ref={setTokenRef(i)}
                style={{
                  display: "inline-block",
                  color: "#FFFFFF",
                  fontFamily:
                    'var(--font-anton), "Anton", system-ui, sans-serif',
                  textTransform: "uppercase",
                  letterSpacing: ".02em",
                  whiteSpace: "nowrap",
                  fontSize: `${Math.round(
                    baseWordPx * tokenScales[i]
                  )}px`,
                  textShadow: "0 1px 0 rgba(0,0,0,0.1)",
                }}
              >
                {tok}
              </span>
            </div>
          ))}

          {showLocation && location && (
            <div style={{ marginTop: lineGap, lineHeight: 1.05 }}>
              <span
                style={{
                  color: "rgba(255,255,255,0.92)",
                  fontFamily:
                    'var(--font-dm-sans), "DM Sans", system-ui, sans-serif',
                  fontWeight: 700,
                  letterSpacing: ".02em",
                  fontSize: `${Math.round(
                    locationPx * globalScale
                  )}px`,
                }}
              >
                {location}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const wrapperStyle: React.CSSProperties = {
    display: "inline-grid",
    placeItems: "center",
    lineHeight: 0,
    verticalAlign: "middle",
  };

  if (wrappedByParentLink || !href) {
    return <span style={wrapperStyle}>{Core}</span>;
  }

  return (
    <a
      href={href}
      aria-label={ariaLabel ?? `${name}${location ? `, ${location}` : ""}`}
      style={{ ...wrapperStyle, textDecoration: "none" }}
      onMouseEnter={(e) => {
        const el = e.currentTarget.firstElementChild as HTMLElement | null;
        if (el) el.style.opacity = "0.94";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget.firstElementChild as HTMLElement | null;
        if (el) el.style.opacity = "1";
      }}
    >
      {Core}
    </a>
  );
}
