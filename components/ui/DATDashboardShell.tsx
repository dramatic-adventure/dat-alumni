"use client";

import type { ReactNode } from "react";

const SYSTEM_STACK =
  'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

type Props = {
  ariaLabel?: string;

  title: ReactNode;
  subtitle?: ReactNode;

  /** Inside the shaded dashboard card (left side) */
  controlsLeft: ReactNode;

  /** Inside the shaded dashboard card (right side) — usually the view-mode tabs */
  controlsRight?: ReactNode;

  /** Bottom row pills inside the shaded dashboard card */
  bottomLeft?: ReactNode;
  bottomRight?: ReactNode;

  /** Content that appears BELOW the shaded dashboard card (e.g., your grid/list) */
  belowCard?: ReactNode;
};

export default function DATDashboardShell({
  ariaLabel = "Dashboard",
  title,
  subtitle,
  controlsLeft,
  controlsRight,
  bottomLeft,
  bottomRight,
  belowCard,
}: Props) {
  return (
    <section aria-label={ariaLabel} className="dc-section">
      <div className="dc-shell">
        <div className="dc-heading text-center max-w-3xl mx-auto">
          <h2
            className="text-[clamp(2.2rem,6vw,6rem)] uppercase leading-[1.05] text-[#241123] opacity-[0.9]"
            style={{
              fontFamily:
                "var(--font-anton), system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
              letterSpacing: "0.02em",
              marginTop: "4rem",
              marginBottom: "0.35rem",
            }}
          >
            {title}
          </h2>

          {subtitle ? (
            <p
              className="text-[1.1rem] md:text-[1.1rem] leading-relaxed"
              style={{
                fontFamily:
                  "var(--font-dm-sans), system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
                color: "#f2f2f2",
                opacity: 0.85,
                marginTop: 0,
                marginBottom: "1.5rem",
              }}
            >
              {subtitle}
            </p>
          ) : null}
        </div>

        <div className="dc-card">
          <div className="dc-top-row">
            <div className="dc-mode-controls">{controlsLeft}</div>
            {controlsRight ? (
              <div className="dc-view-tabs-wrap">{controlsRight}</div>
            ) : null}
          </div>

          {bottomLeft || bottomRight ? (
            <div className="dc-bottom-row">
              {bottomLeft ? bottomLeft : <span />}
              {bottomRight ? bottomRight : <span />}
            </div>
          ) : null}
        </div>
      </div>

      {belowCard ? belowCard : null}

      <style jsx>{`
        .dc-section {
          margin-top: 0;
          border-top: none;
        }

        .dc-shell {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto 1.75rem;
        }

        .dc-heading {
          margin-bottom: 1.25rem;
        }

        /* 🔳 MATCHES DramaClubIndexShell dashboard */
        .dc-card {
          background: rgba(36, 17, 35, 0.2);
          border-radius: 12px;
          padding: 1.25rem;
          border: 1px solid rgba(36, 17, 35, 0.12);
        }
        @media (min-width: 640px) {
          .dc-card {
            padding: 1.75rem;
          }
        }
        @media (min-width: 1024px) {
          .dc-card {
            padding: 2rem;
          }
        }

        /* Mobile-first: stack, then side-by-side on md+ */
        .dc-top-row {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .dc-mode-controls {
          flex: 1;
          min-width: 0;
          order: 2;
        }

        .dc-view-tabs-wrap {
          flex-shrink: 0;
          display: flex;
          justify-content: flex-end;
          align-self: flex-end;
          margin-left: auto;
          order: 1;
        }

        @media (min-width: 768px) {
          .dc-top-row {
            flex-direction: row;
            align-items: flex-start;
            justify-content: space-between;
          }

          .dc-mode-controls {
            order: 0;
          }

          .dc-view-tabs-wrap {
            order: 0;
            align-self: flex-start;
          }
        }

        /* STATUS STRIP (same pattern as DramaClubIndexShell) */
        .dc-status-strip {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.4rem;
        }

        .dc-status-strip-sub {
          display: flex;
          flex-wrap: wrap;
          gap: 0.85rem;
        }

        .dc-filter-strip {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          max-width: 100%;
        }

        .dc-view-tabs {
          display: inline-flex;
          border-radius: 999px;
          padding: 2px;
          background: rgba(246, 228, 193, 0.2);
          border: 1px solid rgba(246, 228, 193, 0.35);
          gap: 2px;
        }

        .dc-view-tab {
          border: none;
          border-radius: 999px;
          padding: 4px 10px;
          font-family: ${SYSTEM_STACK};
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          background: transparent;
          color: #f6e4c1;
          cursor: pointer;
          transition:
            background-color 140ms ease-out,
            color 140ms ease-out,
            transform 120ms ease-out;
        }

        .dc-view-tab[data-active="true"] {
          background-color: rgba(255, 204, 0, 0.9);
          color: #241123;
          transform: translateY(-0.5px);
        }

        .dc-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border-radius: 999px;
          padding: 6px 14px;
          border: 1px solid rgba(246, 228, 193, 0.35);
          background-color: rgba(246, 228, 193, 0.18);
          font-family: ${SYSTEM_STACK};
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: rgba(255, 221, 0, 1);
          cursor: pointer;
          transition:
            background-color 140ms ease-out,
            border-color 140ms ease-out,
            box-shadow 140ms ease-out,
            transform 120ms ease-out,
            color 120ms ease-out;
          white-space: nowrap;
        }

        .dc-chip:hover {
          box-shadow: 0 12px 26px rgba(0, 0, 0, 0.35);
          transform: translateY(-1px);
        }

        .dc-chip[data-active="true"] {
          background-color: #ffcc00;
          color: #241123;
          border-color: rgba(36, 17, 35, 0.85);
          box-shadow: 0 16px 34px rgba(0, 0, 0, 0.55);
        }

        .dc-chip-badge {
          border-radius: 999px;
          padding: 3px 9px;
          font-size: 0.62rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.22em;
          background-color: rgba(253, 249, 241, 0.92);
        }

        .dc-chip-simple .dc-chip-label {
          font-size: 0.64rem;
          letter-spacing: 0.19em;
        }

        .dc-chip-count {
          font-size: 0.7rem;
          font-weight: 500;
          letter-spacing: 0.14em;
        }

        /* Status-specific ACTIVE colors (mirrors drama club behavior) */
        .dc-chip[data-status="open"][data-active="true"] {
          color: #f23359 !important;
        }
        .dc-chip[data-status="open"][data-active="true"] .dc-chip-badge {
          color: #f23359 !important;
        }

        .dc-chip[data-status="partial"][data-active="true"] {
          color: #846a0e !important;
        }
        .dc-chip[data-status="partial"][data-active="true"] .dc-chip-badge {
          color: #846a0e !important;
        }

        .dc-chip[data-status="funded"][data-active="true"] {
          color: #6c00af !important;
        }
        .dc-chip[data-status="funded"][data-active="true"] .dc-chip-badge {
          color: #6c00af !important;
        }

        .dc-bottom-row {
          margin-top: 0.9rem;
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          justify-content: space-between;
        }

        .dc-summary-pill {
          border-radius: 999px;
          border: 1px solid rgba(123, 95, 53, 0.32);
          background-color: rgba(255, 200, 89, 0.25);
          padding: 4px 10px;
          font-family: ${SYSTEM_STACK};
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: #241123;
          white-space: nowrap;
        }

        .dc-summary-pill-soft {
          border-style: dashed;
          opacity: 0.9;
        }

        @media (max-width: 480px) {
          .dc-summary-pill,
          .dc-summary-pill-soft {
            white-space: normal;
          }
        }
      `}</style>
    </section>
  );
}
