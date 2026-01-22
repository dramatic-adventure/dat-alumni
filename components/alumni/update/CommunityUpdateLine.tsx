// components/alumni/update/CommunityUpdateLine.tsx
"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { actionMenuStyle, actionItemStyle } from "@/components/alumni/update/menuStyles";

type CommunityUpdateLineProps = {
  name?: string;
  slug: string;
  /** content only (no name prefix) */
  text?: string;

  /** optional short label above the line (kept subtle) */
  label?: string;

  /** optional timestamp label (string) if you want it later */
  meta?: string;

  /** moderation */
  updateId?: string;
  /** parent override: keep dots visible even without hover */
  showActions?: boolean;
  onUndo?: (id: string) => Promise<void> | void;

  className?: string;
  style?: CSSProperties;
};

const COLORS = {
  snow: "#F2F2F2",
  ink: "#241123",
  brand: "#6C00AF",
  red: "#F23359",
};

const rowStyle: CSSProperties = {
  padding: "8px 8px",
  paddingLeft: 12,
  borderRadius: 12,
  background: "rgba(36, 17, 35, 0.16)",
  boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
  color: COLORS.snow,
  position: "relative",
};

const topRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
};

const lineWrapStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 0,
  alignItems: "center",
  lineHeight: 1.35,
  minWidth: 0,
};

const nameStyle: CSSProperties = {
  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
  fontWeight: 600,
  letterSpacing: "0.044em",
  textDecoration: "none",
  maxWidth: "100%",
};

const colonStyle: CSSProperties = {
  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
  fontWeight: 500,
  opacity: 0.55,
  margin: "0 8px 0 2px",
  color: "#6c00af",
};

const textStyle: CSSProperties = {
  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
  fontWeight: 500,
  opacity: 0.78,
  maxWidth: "100%",
  color: "#241123",
};

const dotsBtnStyle: CSSProperties = {
  color: COLORS.snow,
  borderRadius: 999,
  padding: "4px 8px",
  cursor: "pointer",
  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
  fontSize: 14,
  fontWeight: 800,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  lineHeight: 1,
  opacity: 0, // default hidden; CSS shows on hover/focus or via showActions
  transform: "translateY(0px)",
  transition:
    "opacity 140ms ease, transform 140ms ease, background 140ms ease, border-color 140ms ease, filter 140ms ease",
};

// Local variant (menuStyles doesn't export variants)
const actionItemPurpleTight: CSSProperties = {
  ...actionItemStyle,
  color: "#6C00AF",
  padding: "5px 8px",
  borderRadius: 10,
};

export default function CommunityUpdateLine({
  name,
  slug,
  text,
  updateId,
  showActions = false,
  onUndo,
  className,
  style,
}: CommunityUpdateLineProps) {
  const href = `/alumni/${encodeURIComponent(slug)}`;

  const safeName = (name || "").trim();
  const safeText = (text || "").trim();
  if (!safeName && !safeText) return null;

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const dotsBtnRef = useRef<HTMLButtonElement | null>(null);

  const [menuOpen, setMenuOpen] = useState(false);

  // toast
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("Undone.");
  const toastTimerRef = useRef<number | null>(null);

  const actionsEnabled = Boolean(updateId && onUndo);

  function clearToastTimer() {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
  }

  function closeMenu() {
    setMenuOpen(false);
    window.setTimeout(() => dotsBtnRef.current?.focus(), 0);
  }

  useEffect(() => {
    if (!menuOpen) return;

    const onDown = (e: MouseEvent) => {
      const t = e.target as Node | null;
      if (!t) return;
      if (wrapRef.current?.contains(t)) return;
      closeMenu();
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };

    const onScroll = () => closeMenu();

    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);

    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuOpen]);

  useEffect(() => {
    return () => clearToastTimer();
  }, []);

  async function handleUndoClick() {
    if (!actionsEnabled || !updateId) return;
    closeMenu();

    try {
      await onUndo?.(updateId);
      setToastMsg("Undone.");
      setToastOpen(true);
      clearToastTimer();
      toastTimerRef.current = window.setTimeout(() => setToastOpen(false), 2500);
    } catch {
      setToastMsg("Couldn’t undo.");
      setToastOpen(true);
      clearToastTimer();
      toastTimerRef.current = window.setTimeout(() => setToastOpen(false), 4000);
    }
  }

  return (
    <>
      <div
        ref={wrapRef}
        className={`dat-update-row ${showActions ? "show-actions" : ""} ${className || ""}`}
        style={{ ...rowStyle, ...style }}
      >
        <div style={topRowStyle}>
          <div style={lineWrapStyle}>
            {safeName ? (
              <Link href={href} className="feed-name dat-update-name" style={nameStyle}>
                {safeName}
              </Link>
            ) : null}

            {safeName && safeText ? <span style={colonStyle}>:</span> : null}
            {safeText ? <span style={textStyle}>{safeText}</span> : null}
          </div>

          {actionsEnabled ? (
            <div style={{ position: "relative" }}>
              <button
                ref={dotsBtnRef}
                type="button"
                className={`dat-update-dots ${menuOpen ? "is-open" : ""}`}
                aria-label="More actions"
                title="More actions"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                style={{
                  ...dotsBtnStyle,
                  ...(showActions || menuOpen ? { opacity: 1 } : null),
                }}
                onClick={() => setMenuOpen((v) => !v)}
              >
                ⋯
              </button>

              {menuOpen ? (
                <div role="menu" aria-label="Update actions" style={actionMenuStyle}>
                  <button
                    type="button"
                    role="menuitem"
                    style={actionItemPurpleTight}
                    onClick={handleUndoClick}
                  >
                    Undo post
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {toastOpen ? (
        <div className="dat-toast" role="status" aria-live="polite">
          <span className="dat-toast-msg">{toastMsg}</span>
        </div>
      ) : null}

      <style jsx>{`
        /* Base dots look (controlled by CSS, not inline) */
        .dat-update-dots {
          border: 1px solid rgba(242, 242, 242, 0.22);
          background: rgba(242, 242, 242, 0.08);
        }

        /* Row hover/focus: visible but not full */
        .dat-update-row:hover .dat-update-dots,
        .dat-update-row:focus-within .dat-update-dots {
          opacity: 0.55 !important;
          transform: translateY(-1px);
          background: rgba(242, 242, 242, 0.14);
          border-color: rgba(242, 242, 242, 0.34);
          filter: brightness(1.05);
        }

        /* Parent-forced always visible */
        .dat-update-row.show-actions .dat-update-dots {
          opacity: 1 !important;
          transform: translateY(-1px);
          background: rgba(242, 242, 242, 0.14);
          border-color: rgba(242, 242, 242, 0.34);
          filter: brightness(1.05);
        }

        /* Button hover: full */
        .dat-update-dots:hover {
          opacity: 1 !important;
          background: rgba(242, 242, 242, 0.22) !important;
          border-color: rgba(242, 242, 242, 0.46) !important;
          filter: brightness(1.12) !important;
        }

        /* Menu open: full */
        .dat-update-dots.is-open {
          opacity: 1 !important;
        }

        /* menu item hover */
        [role="menuitem"]:hover {
          background: rgba(108, 0, 175, 0.08);
          transform: translateX(1px);
        }
        [role="menuitem"]:active {
          transform: translateX(0px);
          filter: brightness(0.98);
        }

        /* Toast */
        .dat-toast {
          position: fixed;
          left: 50%;
          bottom: 22px;
          transform: translateX(-50%);
          z-index: 9999;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border-radius: 999px;
          background: rgba(36, 17, 35, 0.88);
          border: 1px solid rgba(242, 242, 242, 0.18);
          box-shadow: 0 14px 40px rgba(0, 0, 0, 0.28);
          backdrop-filter: blur(10px);
        }
        .dat-toast-msg {
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 13px;
          color: ${COLORS.snow};
          opacity: 0.92;
          white-space: nowrap;
        }
      `}</style>
    </>
  );
}
