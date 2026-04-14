// components/campaign/CampaignGiveWidget.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { FundraisingCampaign } from "@/lib/fundraisingCampaigns";
import {
  formatCurrencyMinor,
  formatCurrency,
  campaignProgress,
  activeStretchGoal,
  daysUntilDeadline,
} from "@/lib/fundraisingCampaigns";
import type { CampaignTotals } from "@/lib/getCampaignTotals";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type CheckoutResponse = {
  url?: string | null;
  error?: string;
};

type Props = {
  campaign: FundraisingCampaign;
  initialTotals: CampaignTotals;
  /** Display variant: "panel" (sidebar sticky) | "band" (full-width strip) */
  variant?: "panel" | "band";
};

/* ------------------------------------------------------------------ */
/* Countdown hook                                                      */
/* ------------------------------------------------------------------ */

function useCountdown(deadline: string | undefined) {
  const [days, setDays] = useState<number | null>(() => daysUntilDeadline(deadline));

  useEffect(() => {
    if (!deadline) return;
    const interval = setInterval(() => setDays(daysUntilDeadline(deadline)), 60_000);
    return () => clearInterval(interval);
  }, [deadline]);

  return days;
}

/* ------------------------------------------------------------------ */
/* Live totals hook (polls every 60s)                                  */
/* ------------------------------------------------------------------ */

function useLiveTotals(campaignId: string, initial: CampaignTotals) {
  const [totals, setTotals] = useState<CampaignTotals>(initial);

  useEffect(() => {
    const refresh = async () => {
      try {
        const res = await fetch(`/api/campaign/${campaignId}/totals`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setTotals(data);
        }
      } catch {
        // Silently ignore — keep showing last known totals
      }
    };

    const interval = setInterval(refresh, 60_000);
    return () => clearInterval(interval);
  }, [campaignId]);

  return totals;
}

/* ------------------------------------------------------------------ */
/* Main widget                                                         */
/* ------------------------------------------------------------------ */

export default function CampaignGiveWidget({ campaign, initialTotals, variant = "panel" }: Props) {
  const totals = useLiveTotals(campaign.id, initialTotals);
  const daysLeft = useCountdown(campaign.deadline);

  const defaultAmt = campaign.defaultAmount ?? campaign.giveAmounts[1] ?? campaign.giveAmounts[0];
  const [selectedAmount, setSelectedAmount] = useState<number>(defaultAmt);
  const [customAmount, setCustomAmount] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  // Evergreen annual-fund campaigns default to monthly; time-bound campaigns default to one-time.
  const [frequency, setFrequency] = useState<"one_time" | "monthly">(campaign.evergreen ? "monthly" : "one_time");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const customRef = useRef<HTMLInputElement>(null);

  const currency = campaign.currency ?? "usd";
  const pct = campaignProgress(totals.raisedMinor, campaign.goalAmount);
  const nextStretch = activeStretchGoal(campaign.stretchGoals, totals.raisedMinor);
  const raised = totals.raisedMinor;

  // Determine effective amount for submit
  const effectiveAmount = isCustom
    ? parseFloat(customAmount) || 0
    : selectedAmount;

  const handleAmountClick = (amt: number) => {
    setSelectedAmount(amt);
    setIsCustom(false);
    setCustomAmount("");
    setError(null);
  };

  const handleCustomClick = () => {
    setIsCustom(true);
    setError(null);
    setTimeout(() => customRef.current?.focus(), 0);
  };

  const handleSubmit = useCallback(async () => {
    if (effectiveAmount < 1) {
      setError("Please enter an amount of $1 or more.");
      return;
    }
    if (effectiveAmount > 100000) {
      setError("For gifts above $100,000, please contact us directly.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: effectiveAmount,
          frequency,
          currency,
          // Campaign attribution (checkout route detects "campaign" context automatically
          // when no club/production/project/cause fields are present)
          campaignSlug: campaign.id,
          contextLabel: campaign.title,
          // UTM passthrough
          utmCampaign: campaign.utmCampaign ?? campaign.id,
          utmMedium: "campaign-page",
          landingPath: typeof window !== "undefined" ? window.location.pathname : undefined,
        }),
      });

      const data: CheckoutResponse = await res.json();

      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        // Don't clear loading — user is navigating away
        return;
      }

      setError("Something went wrong. Please try again.");
      setLoading(false);
    } catch {
      setError("Network error. Please check your connection and try again.");
      setLoading(false);
    }
  }, [effectiveAmount, frequency, currency, campaign.id, campaign.title, campaign.utmCampaign]);

  const isBand = variant === "band";

  return (
    <div className={`cgw-root${isBand ? " cgw-root--band" : ""}`}>
      {/* ── Progress thermometer ────────────────────────────────── */}
      <div className="cgw-progress-section">
        <div className="cgw-progress-track">
          <div
            className="cgw-progress-fill"
            style={{ width: `${pct}%` }}
          />
          {/* Stretch goal marker */}
          {nextStretch && campaign.goalAmount > 0 && (
            <div
              className="cgw-stretch-marker"
              style={{
                left: `${Math.min(100, (nextStretch.amount / (campaign.goalAmount * 1.8)) * 100)}%`,
              }}
              title={`Stretch goal: ${formatCurrency(nextStretch.amount, currency)}`}
            />
          )}
        </div>

        <div className="cgw-progress-labels">
          <div className="cgw-progress-raised">
            <span className="cgw-raised-amount">
              {formatCurrencyMinor(raised, currency)}
            </span>
            <span className="cgw-raised-label"> {campaign.progressLabel ?? "raised"}</span>
          </div>
          <div className="cgw-progress-goal">
            <span className="cgw-goal-label">Goal: </span>
            <span className="cgw-goal-amount">
              {formatCurrency(campaign.goalAmount, currency)}
            </span>
          </div>
        </div>

        {/* Stat row */}
        <div className="cgw-stat-row">
          {totals.donorCount > 0 && (
            <div className="cgw-stat">
              <span className="cgw-stat-value">{totals.donorCount}</span>
              <span className="cgw-stat-label">
                {totals.donorCount === 1 ? "donor" : "donors"}
              </span>
            </div>
          )}
          {typeof daysLeft === "number" && daysLeft > 0 && (
            <div className="cgw-stat">
              <span className="cgw-stat-value">{daysLeft}</span>
              <span className="cgw-stat-label">
                {daysLeft === 1 ? "day left" : "days left"}
              </span>
            </div>
          )}
          {typeof daysLeft === "number" && daysLeft === 0 && (
            <div className="cgw-stat cgw-stat--ended">
              <span className="cgw-stat-label">Campaign ended</span>
            </div>
          )}
          {pct >= 100 && (
            <div className="cgw-stat cgw-stat--funded">
              <span className="cgw-stat-value">✓ Funded!</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Stretch goal next target ────────────────────────────── */}
      {nextStretch && pct >= 100 && (
        <div className="cgw-stretch-teaser">
          <span className="cgw-stretch-eyebrow">Next stretch goal</span>
          <span className="cgw-stretch-title">{nextStretch.title}</span>
          <span className="cgw-stretch-amount">
            {formatCurrency(nextStretch.amount, currency)}
          </span>
        </div>
      )}

      {/* ── Frequency toggle (only if allowMonthly) ─────────────── */}
      {campaign.allowMonthly && (
        <div className="cgw-freq-toggle">
          <button
            className={`cgw-freq-btn${frequency === "one_time" ? " cgw-freq-btn--active" : ""}`}
            onClick={() => setFrequency("one_time")}
            type="button"
          >
            One-time
          </button>
          <button
            className={`cgw-freq-btn${frequency === "monthly" ? " cgw-freq-btn--active" : ""}`}
            onClick={() => setFrequency("monthly")}
            type="button"
          >
            Monthly
          </button>
        </div>
      )}

      {/* ── Amount buttons ──────────────────────────────────────── */}
      <div className="cgw-amounts">
        {campaign.giveAmounts.map((amt) => (
          <button
            key={amt}
            type="button"
            className={`cgw-amt-btn${!isCustom && selectedAmount === amt ? " cgw-amt-btn--selected" : ""}`}
            onClick={() => handleAmountClick(amt)}
          >
            {formatCurrency(amt, currency)}
          </button>
        ))}
        <button
          type="button"
          className={`cgw-amt-btn cgw-amt-btn--custom${isCustom ? " cgw-amt-btn--selected" : ""}`}
          onClick={handleCustomClick}
        >
          Other
        </button>
      </div>

      {/* ── Custom amount input ─────────────────────────────────── */}
      {isCustom && (
        <div className="cgw-custom-wrap">
          <span className="cgw-custom-symbol">$</span>
          <input
            ref={customRef}
            type="number"
            min="1"
            step="1"
            placeholder="Enter amount"
            value={customAmount}
            onChange={(e) => {
              setCustomAmount(e.target.value);
              setError(null);
            }}
            className="cgw-custom-input"
          />
        </div>
      )}

      {/* ── Error ───────────────────────────────────────────────── */}
      {error && <p className="cgw-error">{error}</p>}

      {/* ── Match callout ───────────────────────────────────────── */}
      {campaign.matchActive && campaign.matchDescription && (
        <div className="cgw-match-callout">
          <span className="cgw-match-callout-bolt">⚡</span>
          <span className="cgw-match-callout-text">
            {campaign.matchDescription}
          </span>
        </div>
      )}

      {/* ── Submit ──────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading || effectiveAmount < 1}
        className="cgw-submit"
      >
        {loading
          ? "Redirecting…"
          : frequency === "monthly"
          ? `Give ${formatCurrency(effectiveAmount, currency)}/mo`
          : `Give ${formatCurrency(effectiveAmount, currency)}`}
      </button>

      {/* ── Trust line ──────────────────────────────────────────── */}
      <p className="cgw-trust">
        Secure checkout via Stripe · Tax-deductible · No account required
      </p>

      {/* ── Match gift underwriter path ──────────────────────────── */}
      {campaign.matchUnderwriterEmail && (
        <a
          href={`mailto:${campaign.matchUnderwriterEmail}?subject=${encodeURIComponent(`Matching Gift — ${campaign.title}`)}`}
          className="cgw-match-gift-link"
        >
          {campaign.matchUnderwriterLabel ?? "Interested in funding a match gift?"} →
        </a>
      )}

      {/* ── Styles ──────────────────────────────────────────────── */}
      <style>{`
        .cgw-root {
          background: #fff;
          border-radius: 20px;
          border: 2px solid rgba(108, 0, 175, 0.45);
          box-shadow:
            0 8px 40px rgba(108, 0, 175, 0.18),
            0 0 0 5px rgba(108, 0, 175, 0.07),
            inset 0 1px 0 rgba(255,255,255,0.8);
          padding: 1.75rem 1.5rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .cgw-root--band {
          border-radius: 0;
          border: none;
          box-shadow: none;
          background: transparent;
          padding: 0;
          max-width: 640px;
          width: 100%;
          margin: 0 auto;
        }

        /* Progress */
        .cgw-progress-section { display: flex; flex-direction: column; gap: 0.6rem; }

        .cgw-progress-track {
          position: relative;
          height: 10px;
          background: rgba(108, 0, 175, 0.12);
          border-radius: 999px;
          overflow: visible;
        }
        .cgw-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #6C00AF, #FFCC00);
          border-radius: 999px;
          transition: width 800ms cubic-bezier(0.25, 1, 0.5, 1);
          min-width: 4px;
        }
        .cgw-stretch-marker {
          position: absolute;
          top: -4px;
          width: 3px;
          height: 18px;
          background: #FFCC00;
          border-radius: 2px;
          transform: translateX(-50%);
          opacity: 0.7;
        }

        .cgw-progress-labels {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }
        .cgw-raised-amount {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 1.35rem;
          font-weight: 800;
          color: #6C00AF;
          line-height: 1;
        }
        .cgw-raised-label {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.8rem;
          color: rgba(36,17,35,0.6);
        }
        .cgw-goal-label {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.75rem;
          color: rgba(36,17,35,0.5);
        }
        .cgw-goal-amount {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.85rem;
          font-weight: 700;
          color: rgba(36,17,35,0.7);
        }

        .cgw-stat-row {
          display: flex;
          gap: 1.25rem;
          flex-wrap: wrap;
        }
        .cgw-stat {
          display: flex;
          flex-direction: column;
          gap: 0.1rem;
        }
        .cgw-stat-value {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 1.1rem;
          font-weight: 800;
          color: #241123;
          line-height: 1;
        }
        .cgw-stat-label {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(36,17,35,0.5);
        }
        .cgw-stat--funded .cgw-stat-value { color: #2FA873; }
        .cgw-stat--ended .cgw-stat-label { color: rgba(36,17,35,0.4); font-style: italic; }

        /* Stretch teaser */
        .cgw-stretch-teaser {
          background: rgba(255, 204, 0, 0.12);
          border: 1.5px solid rgba(255, 204, 0, 0.4);
          border-radius: 12px;
          padding: 0.75rem 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }
        .cgw-stretch-eyebrow {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(36,17,35,0.55);
        }
        .cgw-stretch-title {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.9rem;
          font-weight: 700;
          color: #241123;
        }
        .cgw-stretch-amount {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.8rem;
          font-weight: 700;
          color: #6C00AF;
        }

        /* Frequency toggle */
        .cgw-freq-toggle {
          display: flex;
          background: rgba(36,17,35,0.06);
          border-radius: 12px;
          padding: 3px;
          gap: 3px;
        }
        .cgw-freq-btn {
          flex: 1;
          padding: 0.5rem;
          border-radius: 9px;
          border: none;
          background: transparent;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.78rem;
          font-weight: 600;
          color: rgba(36,17,35,0.6);
          cursor: pointer;
          transition: background 150ms, color 150ms;
        }
        .cgw-freq-btn--active {
          background: #fff;
          color: #241123;
          box-shadow: 0 1px 4px rgba(0,0,0,0.12);
        }

        /* Amount buttons */
        .cgw-amounts {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.5rem;
        }
        .cgw-amt-btn {
          padding: 0.65rem 0.5rem;
          border-radius: 12px;
          border: 1.5px solid rgba(108, 0, 175, 0.2);
          background: #fff;
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.88rem;
          font-weight: 700;
          color: #241123;
          cursor: pointer;
          transition: border-color 140ms, background 140ms, color 140ms, transform 140ms;
          text-align: center;
        }
        .cgw-amt-btn:hover {
          border-color: #6C00AF;
          background: rgba(108, 0, 175, 0.05);
          transform: translateY(-1px);
        }
        .cgw-amt-btn--selected {
          border-color: #6C00AF;
          background: #6C00AF;
          color: #fff;
        }
        .cgw-amt-btn--selected:hover {
          background: #5a0094;
          border-color: #5a0094;
        }
        .cgw-amt-btn--custom { font-size: 0.8rem; color: rgba(36,17,35,0.65); }
        .cgw-amt-btn--custom.cgw-amt-btn--selected { color: #fff; }

        /* Custom input */
        .cgw-custom-wrap {
          display: flex;
          align-items: center;
          gap: 0;
          border: 1.5px solid #6C00AF;
          border-radius: 12px;
          overflow: hidden;
          background: rgba(108,0,175,0.04);
        }
        .cgw-custom-symbol {
          padding: 0 0.75rem;
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 1rem;
          font-weight: 700;
          color: #6C00AF;
        }
        .cgw-custom-input {
          flex: 1;
          padding: 0.65rem 0.75rem 0.65rem 0;
          border: none;
          background: transparent;
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 1rem;
          font-weight: 700;
          color: #241123;
          outline: none;
          min-width: 0;
        }
        .cgw-custom-input::placeholder { color: rgba(36,17,35,0.3); }
        .cgw-custom-input::-webkit-inner-spin-button,
        .cgw-custom-input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }

        /* Error */
        .cgw-error {
          margin: 0;
          padding: 0.6rem 0.85rem;
          background: rgba(200, 30, 30, 0.08);
          border: 1px solid rgba(200, 30, 30, 0.25);
          border-radius: 10px;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.82rem;
          color: #c81e1e;
        }

        /* Match callout */
        .cgw-match-callout {
          display: flex;
          align-items: center;
          gap: 0.55rem;
          padding: 0.65rem 0.9rem;
          background: rgba(255, 204, 0, 0.1);
          border: 1.5px solid rgba(255, 204, 0, 0.35);
          border-radius: 11px;
        }
        .cgw-match-callout-bolt {
          font-size: 0.9rem;
          line-height: 1;
          flex-shrink: 0;
        }
        .cgw-match-callout-text {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.75rem;
          font-weight: 600;
          color: #5a3d00;
          line-height: 1.4;
        }

        /* Submit */
        .cgw-submit {
          width: 100%;
          padding: 1rem;
          border-radius: 14px;
          border: none;
          background: #6C00AF;
          color: #fff;
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 1rem;
          font-weight: 800;
          letter-spacing: 0.04em;
          cursor: pointer;
          transition: background 150ms, transform 150ms, opacity 150ms;
        }
        .cgw-submit:hover:not(:disabled) {
          background: #5a0094;
          transform: translateY(-2px);
        }
        .cgw-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        /* Trust */
        .cgw-trust {
          margin: 0;
          text-align: center;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.7rem;
          color: rgba(36,17,35,0.45);
          line-height: 1.5;
        }

        /* Match gift underwriter path */
        .cgw-match-gift-link {
          display: block;
          text-align: center;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.7rem;
          font-weight: 600;
          color: rgba(108,0,175,0.65);
          text-decoration: none;
          border-bottom: 1px solid rgba(108,0,175,0.2);
          padding-bottom: 1px;
          align-self: center;
          transition: color 140ms, border-color 140ms;
          margin-top: -0.25rem;
        }
        .cgw-match-gift-link:hover {
          color: #6C00AF;
          border-bottom-color: rgba(108,0,175,0.55);
        }
      `}</style>
    </div>
  );
}
