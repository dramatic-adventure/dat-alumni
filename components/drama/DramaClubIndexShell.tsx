// components/drama/DramaClubIndexShell.tsx
"use client";

import { useMemo, useState } from "react";
import type { DramaClub } from "@/lib/dramaClubMap";
import {
  computeDramaClubStatus,
  type DramaClubStatus,
} from "@/lib/dramaClubStatus";
import DramaClubIndexMicroGrid from "@/components/drama/DramaClubIndexMicroGrid";

import type {
  DramaClubCause,
  DramaClubCauseCategory,
  DramaClubCauseSubcategory,
  DramaClubCauseSubcategoryMeta,
} from "@/lib/causes";
import {
  CAUSE_CATEGORIES,
  CAUSE_SUBCATEGORIES_BY_CATEGORY,
} from "@/lib/causes";

type DramaClubIndexShellProps = {
  clubs: DramaClub[];
  statusCounts: Record<DramaClubStatus, number>;
};

const statusLabelMap: Record<DramaClubStatus, string> = {
  new: "NEW",
  ongoing: "ONGOING",
  legacy: "LEGACY",
};

const statusChipStyles: Record<
  DramaClubStatus,
  { bg: string; text: string; border: string }
> = {
  new: {
    bg: "rgba(242, 51, 89, 0.3)",
    text: "#fdd9e0ff",
    border: "rgba(242, 51, 89, 0.6)",
  },
  ongoing: {
    bg: "rgba(255, 204, 0, 0.3)",
    text: "#fce7a7ff",
    border: "rgba(200, 159, 55, 1)",
  },
  legacy: {
    bg: "rgba(108, 0, 175, 0.20)",
    text: "#e9c9fdff",
    border: "rgba(108, 0, 175, 0.5)",
  },
};

const SYSTEM_STACK =
  'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

type StatusFilter = "all" | DramaClubStatus;
type ViewMode = "status" | "country" | "cause";

// Filter keys
const BUCKET_PREFIX = "bucket::"; // categoryId
const LABEL_PREFIX = "label::"; // `${categoryId}::${subcategoryId}`

type CauseBucketItem = {
  id: string; // `${categoryId}::${subcategoryId}`
  label: string;
  categoryId: DramaClubCauseCategory;
  subcategoryId: DramaClubCauseSubcategory;
};

type CauseBucket = {
  categoryId: DramaClubCauseCategory;
  label: string; // nice category label
  items: CauseBucketItem[];
};

export default function DramaClubIndexShell({
  clubs,
  statusCounts,
}: DramaClubIndexShellProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("status");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [causeFilter, setCauseFilter] = useState<string>("all");

  // which cause categories are expanded as accordions
  const [expandedCategories, setExpandedCategories] = useState<
    DramaClubCauseCategory[]
  >([]);

  const toggleCategoryExpanded = (categoryId: DramaClubCauseCategory) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // ---------- Browse options ----------
  const countryOptions = useMemo(() => {
    const set = new Set<string>();
    clubs.forEach((club) => {
      if (club.country) set.add(club.country);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [clubs]);

  // Buckets: { categoryId → Set of subcategoryIds }
  const causeBuckets: CauseBucket[] = useMemo(() => {
    const bucketMap = new Map<
      DramaClubCauseCategory,
      Set<DramaClubCauseSubcategory>
    >();

    clubs.forEach((club) => {
      const causes = club.causes as DramaClubCause[] | undefined;
      if (!Array.isArray(causes) || causes.length === 0) return;

      causes.forEach(({ category, subcategory }) => {
        if (!bucketMap.has(category)) {
          bucketMap.set(category, new Set<DramaClubCauseSubcategory>());
        }
        bucketMap.get(category)!.add(subcategory);
      });
    });

    return Array.from(bucketMap.entries())
      .map(([categoryId, subSet]) => {
        const catMeta = CAUSE_CATEGORIES.find((c) => c.id === categoryId);
        const categoryLabel =
          catMeta?.shortLabel || catMeta?.label || String(categoryId);

        const subMetaList: DramaClubCauseSubcategoryMeta[] =
          CAUSE_SUBCATEGORIES_BY_CATEGORY[categoryId] ?? [];

        const items: CauseBucketItem[] = Array.from(subSet).map(
          (subcategoryId) => {
            const subMeta =
              subMetaList.find((s) => s.id === subcategoryId) ?? undefined;
            const subLabel = subMeta?.label || String(subcategoryId);
            const id = `${categoryId}::${subcategoryId}`;

            return {
              id,
              label: subLabel,
              categoryId,
              subcategoryId,
            };
          }
        );

        items.sort((a, b) => a.label.localeCompare(b.label));

        return {
          categoryId,
          label: categoryLabel,
          items,
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [clubs]);

  // ---------- Filtered list ----------
  const filteredClubs = useMemo(() => {
    let result = [...clubs];

    if (viewMode === "status") {
      if (statusFilter !== "all") {
        result = result.filter(
          (club) => computeDramaClubStatus(club) === statusFilter
        );
      }
      return result;
    }

    if (viewMode === "country") {
      if (countryFilter !== "all") {
        result = result.filter((club) => club.country === countryFilter);
      }
      return result;
    }

    // viewMode === "cause"
    if (causeFilter !== "all") {
      if (causeFilter.startsWith(BUCKET_PREFIX)) {
        const categoryId = causeFilter.slice(
          BUCKET_PREFIX.length
        ) as DramaClubCauseCategory;
        result = result.filter((club) => {
          const causes = club.causes as DramaClubCause[] | undefined;
          if (!Array.isArray(causes) || causes.length === 0) return false;
          return causes.some((cause) => cause.category === categoryId);
        });
      } else if (causeFilter.startsWith(LABEL_PREFIX)) {
        const key = causeFilter.slice(LABEL_PREFIX.length);
        const [rawCategoryId, rawSubcategoryId] = key.split("::");
        const categoryId = rawCategoryId as DramaClubCauseCategory | undefined;
        const subcategoryId =
          rawSubcategoryId as DramaClubCauseSubcategory | undefined;

        if (categoryId && subcategoryId) {
          result = result.filter((club) => {
            const causes = club.causes as DramaClubCause[] | undefined;
            if (!Array.isArray(causes) || causes.length === 0) return false;
            return causes.some(
              (cause) =>
                cause.category === categoryId &&
                cause.subcategory === subcategoryId
            );
          });
        }
      }
    }

    return result;
  }, [clubs, viewMode, statusFilter, countryFilter, causeFilter]);

  const totalClubs = clubs.length;

  // ---------- Mode label ----------
  let modeLabel: string;
  if (viewMode === "status") {
    modeLabel =
      statusFilter === "all"
        ? "All clubs"
        : `${statusLabelMap[statusFilter]} clubs`;
  } else if (viewMode === "country") {
    modeLabel =
      countryFilter === "all"
        ? "All Countries"
        : `Country view: ${countryFilter}`;
  } else {
    // viewMode === "cause"
    if (causeFilter === "all") {
      modeLabel = "All Causes We Champion";
    } else if (causeFilter.startsWith(BUCKET_PREFIX)) {
      const rawCategoryId = causeFilter.slice(BUCKET_PREFIX.length);
      const categoryId = rawCategoryId as DramaClubCauseCategory;
      const bucket = causeBuckets.find((b) => b.categoryId === categoryId);
      const label = bucket?.label || rawCategoryId;
      modeLabel = `Cause bucket: ${label}`;
    } else if (causeFilter.startsWith(LABEL_PREFIX)) {
      const key = causeFilter.slice(LABEL_PREFIX.length);
      const [rawCategoryId, rawSubcategoryId] = key.split("::");
      const categoryId = rawCategoryId as DramaClubCauseCategory | undefined;
      const subcategoryId =
        rawSubcategoryId as DramaClubCauseSubcategory | undefined;

      let label = key;
      if (categoryId && subcategoryId) {
        const bucket = causeBuckets.find((b) => b.categoryId === categoryId);
        const item = bucket?.items.find(
          (i) => i.subcategoryId === subcategoryId
        );
        label = item?.label || label;
      }
      modeLabel = `Cause: ${label}`;
    } else {
      modeLabel = "All Causes We Champion";
    }
  }

  return (
    <section
      aria-label="Drama Club browse controls & index"
      className="dc-section"
    >
      <div className="dc-shell">
        <div className="dc-heading text-center max-w-3xl mx-auto">
          {/* Title */}
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
            Drama Clubs around the world
          </h2>

          {/* Paragraph Copy */}
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
            A global constellation of creative spaces where culture is
            celebrated, new voices emerge, and communities dream forward.
          </p>
        </div>

        {/* 🔳 Shaded dashboard box — matches StatsStrip card */}
        <div className="dc-card">
          {/* Top row: mode controls + view tabs */}
          <div className="dc-top-row">
            {/* Left: mode-specific controls */}
            <div className="dc-mode-controls">
              {viewMode === "status" && (
                <div className="dc-status-strip">
                  {/* Row 1: ALL CLUBS */}
                  <div className="dc-status-strip-main">
                    <button
                      type="button"
                      className="dc-chip"
                      data-active={statusFilter === "all"}
                      onClick={() => {
                        setStatusFilter("all");
                      }}
                    >
                      <span style={{ fontWeight: 700 }}>ALL CLUBS</span>
                      <span className="dc-chip-count">
                        {totalClubs} total
                      </span>
                    </button>
                  </div>

                  {/* Row 2: sub-status chips */}
                  <div className="dc-status-strip-sub">
                    {(["new", "ongoing", "legacy"] as DramaClubStatus[]).map(
                      (status) => {
                        const count = statusCounts[status];
                        if (!count) return null;
                        const chip = statusChipStyles[status];
                        const isActive = statusFilter === status;
                        const label = statusLabelMap[status];

                        return (
                          <button
                            key={status}
                            type="button"
                            className="dc-chip"
                            data-status={status}
                            data-active={isActive}
                            onClick={() => {
                              setStatusFilter(status);
                            }}
                          >
                            <span
                              className="dc-chip-badge"
                              style={{
                                backgroundColor: chip.bg,
                                border: `1px solid ${chip.border}`,
                                color: chip.text,
                              }}
                            >
                              {label}
                            </span>
                            <span className="dc-chip-count">
                              {count} club{count === 1 ? "" : "s"}
                            </span>
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>
              )}

              {viewMode === "country" && countryOptions.length > 1 && (
                <div className="dc-filter-strip dc-filter-strip-stacked">
                  {/* Row 1: All Countries */}
                  <div className="dc-filter-main">
                    <button
                      type="button"
                      className="dc-chip dc-chip-simple"
                      data-active={countryFilter === "all"}
                      onClick={() => setCountryFilter("all")}
                    >
                      <span className="dc-chip-label">All Countries</span>
                    </button>
                  </div>

                  {/* Row 2: country chips */}
                  <div className="dc-filter-sub">
                    {countryOptions.map((country) => (
                      <button
                        key={country}
                        type="button"
                        className="dc-chip dc-chip-simple"
                        data-active={countryFilter === country}
                        onClick={() => setCountryFilter(country)}
                      >
                        <span className="dc-chip-label">{country}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {viewMode === "cause" && causeBuckets.length > 0 && (
                <div className="dc-filter-buckets">
                  <div className="dc-filter-strip dc-filter-strip-all">
                    <button
                      type="button"
                      className="dc-chip dc-chip-simple"
                      data-active={causeFilter === "all"}
                      onClick={() => setCauseFilter("all")}
                    >
                      <span className="dc-chip-label">
                        All Causes We Champion
                      </span>
                    </button>
                  </div>

                  {causeBuckets.map((bucket) => {
                    const bucketKey = BUCKET_PREFIX + bucket.categoryId;
                    const bucketActive = causeFilter === bucketKey;
                    const isExpanded = expandedCategories.includes(
                      bucket.categoryId
                    );

                    return (
                      <div
                        className="dc-filter-bucket"
                        key={bucket.categoryId}
                        data-active={bucketActive}
                        data-expanded={isExpanded ? "true" : "false"}
                      >
                        {/* Category label = accordion toggle + bucket filter */}
                        <button
                          type="button"
                          className="dc-filter-bucket-label"
                          onClick={() => {
                            const nextFilter = bucketActive ? "all" : bucketKey;
                            setCauseFilter(nextFilter);
                            toggleCategoryExpanded(bucket.categoryId);
                          }}
                        >
                          <span className="dc-filter-bucket-label-text">
                            {bucket.label}
                          </span>
                          <span className="dc-filter-bucket-chevron">
                            {isExpanded ? "−" : "+"}
                          </span>
                        </button>

                        {/* Subcategory chips only when expanded */}
                        {isExpanded && (
                          <div className="dc-filter-strip">
                            {bucket.items.map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                className="dc-chip dc-chip-simple"
                                data-active={
                                  causeFilter === LABEL_PREFIX + item.id
                                }
                                onClick={() =>
                                  setCauseFilter(
                                    causeFilter === LABEL_PREFIX + item.id
                                      ? "all"
                                      : LABEL_PREFIX + item.id
                                  )
                                }
                              >
                                <span className="dc-chip-label">
                                  {item.label}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: view-mode tabs */}
            <div className="dc-view-tabs-wrap">
              <div className="dc-view-tabs">
                <button
                  type="button"
                  className="dc-view-tab"
                  data-active={viewMode === "status"}
                  onClick={() => {
                    setViewMode("status");
                    setStatusFilter("all");
                    setCountryFilter("all");
                    setCauseFilter("all");
                    setExpandedCategories([]);
                  }}
                >
                  Status
                </button>
                <button
                  type="button"
                  className="dc-view-tab"
                  data-active={viewMode === "country"}
                  onClick={() => {
                    setViewMode("country");
                    setCountryFilter("all");
                    setStatusFilter("all");
                    setCauseFilter("all");
                    setExpandedCategories([]);
                  }}
                >
                  Country
                </button>
                <button
                  type="button"
                  className="dc-view-tab"
                  data-active={viewMode === "cause"}
                  onClick={() => {
                    setViewMode("cause");
                    setCauseFilter("all");
                    setStatusFilter("all");
                    setCountryFilter("all");
                    // start with all accordions collapsed
                    setExpandedCategories([]);
                  }}
                >
                  Cause
                </button>
              </div>
            </div>
          </div>

          {/* Bottom row: summary + tagline */}
          <div className="dc-bottom-row">
            <span className="dc-summary-pill">
              Showing {filteredClubs.length} of {totalClubs} club
              {totalClubs === 1 ? "" : "s"} • {modeLabel}
            </span>
            <span className="dc-summary-pill dc-summary-pill-soft">
              Every club is a rehearsal for revolution.
            </span>
          </div>
        </div>
      </div>

      {/* Grid below the shaded box */}
      <DramaClubIndexMicroGrid clubs={filteredClubs} />

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

        /* 🔳 MATCHES StatsStrip card */
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
          order: 2; /* below tabs on mobile */
        }

        .dc-view-tabs-wrap {
          flex-shrink: 0;
          display: flex;
          justify-content: flex-end;
          align-self: flex-end;
          margin-left: auto;
          order: 1; /* tabs first on mobile */
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

        /* STATUS STRIP: two rows (ALL on top, subs below) */
        .dc-status-strip {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.4rem;
        }

        .dc-status-strip-main {
          /* row for ALL CLUBS */
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

        /* COUNTRY STRIP: two rows (All Countries on top, subs below) */
        .dc-filter-strip-stacked {
          flex-wrap: nowrap;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.4rem;
        }

        .dc-filter-main {
          /* row for the ALL button */
        }

        .dc-filter-sub {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          max-width: 100%;
        }

        .dc-filter-buckets {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
        }

        .dc-filter-strip-all {
          margin-bottom: 0.25rem;
        }

        .dc-filter-bucket {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          padding: 0.25rem 0;
          border-bottom: 1px dashed rgba(246, 228, 193, 0.18);
        }

        .dc-filter-bucket:last-of-type {
          border-bottom: none;
        }

        .dc-filter-bucket-label {
          display: inline-flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          width: 100%;
          font-family: ${SYSTEM_STACK};
          font-size: 0.65rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: #f6e4c1;
          opacity: 0.85;
          background: none;
          border: none;
          padding: 0;
          text-align: left;
          cursor: pointer;
          transition:
            color 140ms ease-out,
            opacity 140ms ease-out,
            transform 120ms ease-out;
        }

        .dc-filter-bucket[data-active="true"] .dc-filter-bucket-label {
          color: #ffcc00;
          opacity: 1;
          transform: translateY(-0.5px);
        }

        .dc-filter-bucket-chevron {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          line-height: 1;
          font-weight: 500;
          color: rgba(246, 228, 193, 0.98);
          background: none;
          box-shadow: none;
        }

        .dc-filter-bucket-chevron::before,
        .dc-filter-bucket-chevron::after {
          content: none !important;
        }

        .dc-filter-bucket[data-active="true"] .dc-filter-bucket-chevron {
          color: #ffcc00;
          transform: translateY(-0.25px);
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
            color 140ms.ease-out,
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

        /* Simpler label inside country/cause chips (no nested badge) */
        .dc-chip-simple .dc-chip-label {
          font-size: 0.64rem;
          letter-spacing: 0.19em;
        }

        /* Status-specific ACTIVE colors */
        .dc-chip[data-status="new"][data-active="true"] {
          color: #f23359 !important;
        }
        .dc-chip[data-status="new"][data-active="true"] .dc-chip-badge {
          color: #f23359 !important;
        }

        .dc-chip[data-status="ongoing"][data-active="true"] {
          color: #846a0eff !important;
        }
        .dc-chip[data-status="ongoing"][data-active="true"] .dc-chip-badge {
          color: #846a0eff !important;
        }

        .dc-chip[data-status="legacy"][data-active="true"] {
          color: #6c00af !important;
        }
        .dc-chip[data-status="legacy"][data-active="true"] .dc-chip-badge {
          color: #6c00af !important;
        }

        .dc-chip-count {
          font-size: 0.7rem;
          font-weight: 500;
          letter-spacing: 0.14em;
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
