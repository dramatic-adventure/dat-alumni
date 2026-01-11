// components/sponsorship/SponsorshipDashboardShell.tsx

"use client";

import { useMemo, useState } from "react";
import DATDashboardShell from "@/components/ui/DATDashboardShell";

type ViewMode = "status" | "campaign" | "context";
type StatusFilter = "all" | "open" | "funded" | "partial";

type Props = {
  // Keep this loose — swap to your real type later.
  items: Array<{
    id: string;
    label: string;
    status: "open" | "funded" | "partial";
    campaign?: string;
    context?: string;
  }>;
};

export default function SponsorshipDashboardShell({ items }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("status");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filtered = useMemo(() => {
    let result = [...items];

    if (viewMode === "status") {
      if (statusFilter !== "all") {
        result = result.filter((x) => x.status === statusFilter);
      }
      return result;
    }

    // Placeholder: you’ll wire these to your real campaign/context filters.
    return result;
  }, [items, viewMode, statusFilter]);

  const modeLabel =
    viewMode === "status"
      ? statusFilter === "all"
        ? "All sponsorships"
        : `${statusFilter} sponsorships`
      : viewMode === "campaign"
        ? "Campaign view"
        : "Context view";

  const total = items.length;

  return (
    <DATDashboardShell
      ariaLabel="Sponsorship dashboard"
      title="Sponsorship Dashboard"
      subtitle="Track what’s funded, what’s open, and what needs the next right ask."
      controlsLeft={
        <>
          {viewMode === "status" ? (
            <div className="dc-filter-strip">
              <button
                type="button"
                className="dc-chip dc-chip-simple"
                data-active={statusFilter === "all"}
                onClick={() => setStatusFilter("all")}
              >
                <span className="dc-chip-label">All</span>
                <span className="dc-chip-count">{total}</span>
              </button>

              {(["open", "partial", "funded"] as const).map((s) => {
                const count = items.filter((x) => x.status === s).length;
                if (!count) return null;

                return (
                  <button
                    key={s}
                    type="button"
                    className="dc-chip dc-chip-simple"
                    data-active={statusFilter === s}
                    onClick={() => setStatusFilter(s)}
                  >
                    <span className="dc-chip-label">{s}</span>
                    <span className="dc-chip-count">{count}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="dc-filter-strip">
              <button type="button" className="dc-chip dc-chip-simple" data-active="true">
                <span className="dc-chip-label">Wire your filters here</span>
              </button>
            </div>
          )}
        </>
      }
      controlsRight={
        <div className="dc-view-tabs">
          <button
            type="button"
            className="dc-view-tab"
            data-active={viewMode === "status"}
            onClick={() => {
              setViewMode("status");
              setStatusFilter("all");
            }}
          >
            Status
          </button>
          <button
            type="button"
            className="dc-view-tab"
            data-active={viewMode === "campaign"}
            onClick={() => setViewMode("campaign")}
          >
            Campaign
          </button>
          <button
            type="button"
            className="dc-view-tab"
            data-active={viewMode === "context"}
            onClick={() => setViewMode("context")}
          >
            Context
          </button>
        </div>
      }
      bottomLeft={
        <span className="dc-summary-pill">
          Showing {filtered.length} of {total} • {modeLabel}
        </span>
      }
      bottomRight={
        <span className="dc-summary-pill dc-summary-pill-soft">
          Fund moments, not maintenance.
        </span>
      }
      belowCard={
        <div className="max-w-[1200px] mx-auto">
          {/* Swap this for your real Sponsorship grid/list component */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((x) => (
              <div
                key={x.id}
                className="rounded-xl border border-black/10 bg-white/10 p-4"
              >
                <div className="text-[#241123] font-semibold">{x.label}</div>
                <div className="text-sm opacity-80">{x.status}</div>
              </div>
            ))}
          </div>
        </div>
      }
    />
  );
}
