"use client";

import { useState, useMemo, type CSSProperties } from "react";
import {
  CAUSE_CATEGORIES,
  CAUSE_SUBCATEGORIES_BY_CATEGORY,
} from "@/lib/causes";
import { dramaClubs } from "@/lib/dramaClubMap";
import { footerRowStyle, studioExplainStyle } from "@/components/alumni/update/ProfileStudio";

type UploadKind = "headshot" | "album" | "reel" | "event";

type ImpactPanelProps = {
  profile: any;
  setProfile: (updater: (prev: any) => any) => void;
  saveCategory: (args: {
    tag: string;
    fieldKeys?: string[];
    uploadKinds?: UploadKind[];
    afterSave?: () => void;
  }) => void;
  loading: boolean;
  MODULES: Record<string, { fieldKeys: string[]; uploadKinds: UploadKind[] }>;
  subheadChipStyle: CSSProperties;
  explainStyleLocal: CSSProperties;
  savedRecently?: boolean;
  onSaved?: () => void;
};

function parseCommaList(raw: string | undefined | null): string[] {
  if (!raw) return [];
  return String(raw)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function joinCommaList(values: string[]): string {
  return values.join(", ");
}

/* ---- Style tokens ---- */

const FF_SANS =
  'var(--font-dm-sans), system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const FF_GROTESK = "var(--font-space-grotesk), system-ui, sans-serif";

const TEAL = "#2493A9";
const SNOW = "#F2F2F2";
const INK = "#241123";

const subSectionLabelStyle: CSSProperties = {
  fontFamily: FF_GROTESK,
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: SNOW,
  margin: "0 0 12px 0",
};

const categoryRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "10px 12px",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: 10,
  cursor: "pointer",
  userSelect: "none",
};

const categoryLabelStyle: CSSProperties = {
  fontFamily: FF_GROTESK,
  fontSize: 13,
  fontWeight: 700,
  color: SNOW,
};

const chipStyle = (selected: boolean): CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  padding: "5px 11px",
  borderRadius: 999,
  fontFamily: FF_SANS,
  fontSize: 12,
  fontWeight: selected ? 700 : 500,
  cursor: "pointer",
  border: selected ? `1px solid ${TEAL}` : "1px solid rgba(255,255,255,0.25)",
  background: selected ? TEAL : "rgba(255,255,255,0.07)",
  color: SNOW,
  transition: "background 140ms, border-color 140ms",
});

const clubRowStyle = (selected: boolean): CSSProperties => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "8px 12px",
  borderRadius: 8,
  cursor: "pointer",
  border: selected ? `1px solid ${TEAL}` : "1px solid rgba(255,255,255,0.12)",
  background: selected ? "rgba(36,147,169,0.18)" : "rgba(255,255,255,0.05)",
  marginBottom: 4,
});

const clubNameStyle: CSSProperties = {
  fontFamily: FF_SANS,
  fontSize: 13,
  fontWeight: 500,
  color: SNOW,
};

const clubCountryStyle: CSSProperties = {
  fontFamily: FF_SANS,
  fontSize: 12,
  color: SNOW,
  opacity: 0.55,
};

/* Light input — matches the standard inputStyle used across all other panels */
const lightInputStyle: CSSProperties = {
  width: "100%",
  borderRadius: 10,
  padding: "10px 14px",
  outline: "none",
  border: "none",
  background: "#f2f2f2",
  color: INK,
  fontFamily: FF_SANS,
  fontSize: 13,
  boxSizing: "border-box",
  boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
};

const featuredSelectStyle = (hasValue: boolean): CSSProperties => ({
  ...lightInputStyle,
  border: hasValue ? `2px solid ${TEAL}` : "2px solid transparent",
  fontWeight: hasValue ? 600 : 400,
  cursor: "pointer",
});

const dividerStyle: CSSProperties = {
  borderTop: "1px solid rgba(255,255,255,0.08)",
  margin: "22px 0",
};

const saveButtonStyle = (isLoading: boolean): CSSProperties => ({
  borderRadius: 14,
  padding: "12px 20px",
  fontFamily: FF_GROTESK,
  fontWeight: 700,
  fontSize: "0.85rem",
  textTransform: "uppercase" as const,
  letterSpacing: "0.18em",
  background: isLoading ? "rgba(36,147,169,0.5)" : TEAL,
  color: SNOW,
  border: "1px solid rgba(0,0,0,0.22)",
  boxShadow: "0 10px 26px rgba(0,0,0,0.18)",
  cursor: isLoading ? "not-allowed" : "pointer",
  opacity: isLoading ? 0.6 : 1,
});

export default function ImpactPanel({
  profile,
  setProfile,
  saveCategory,
  loading,
  MODULES,
  subheadChipStyle,
  explainStyleLocal,
  savedRecently,
  onSaved,
}: ImpactPanelProps) {
  const selectedCauses = useMemo(
    () => new Set(parseCommaList(profile.impactCauses)),
    [profile.impactCauses]
  );
  const selectedClubs = useMemo(
    () => new Set(parseCommaList(profile.supportedClubs)),
    [profile.supportedClubs]
  );

  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());
  const [clubSearch, setClubSearch] = useState("");

  function toggleCategory(catId: string) {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  }

  function toggleCause(subcategoryId: string) {
    setProfile((prev: any) => {
      const current = new Set(parseCommaList(prev.impactCauses));
      if (current.has(subcategoryId)) {
        current.delete(subcategoryId);
        const clearFeatured = prev.featuredImpactCause === subcategoryId;
        return {
          ...prev,
          impactCauses: joinCommaList(Array.from(current)),
          ...(clearFeatured ? { featuredImpactCause: "" } : {}),
        };
      }
      current.add(subcategoryId);
      return { ...prev, impactCauses: joinCommaList(Array.from(current)) };
    });
  }

  function toggleClub(slug: string) {
    setProfile((prev: any) => {
      const current = new Set(parseCommaList(prev.supportedClubs));
      if (current.has(slug)) {
        current.delete(slug);
        const clearFeatured = prev.featuredSupportedClub === slug;
        return {
          ...prev,
          supportedClubs: joinCommaList(Array.from(current)),
          ...(clearFeatured ? { featuredSupportedClub: "" } : {}),
        };
      }
      current.add(slug);
      return { ...prev, supportedClubs: joinCommaList(Array.from(current)) };
    });
  }

  const filteredClubs = useMemo(() => {
    const q = clubSearch.trim().toLowerCase();
    if (!q) return dramaClubs;
    return dramaClubs.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q)
    );
  }, [clubSearch]);

  const featuredClubOptions = useMemo(
    () => dramaClubs.filter((c) => selectedClubs.has(c.slug)),
    [selectedClubs]
  );

  const featuredCauseOptions = useMemo(() => {
    const result: { id: string; label: string }[] = [];
    for (const cat of CAUSE_CATEGORIES) {
      const subs = CAUSE_SUBCATEGORIES_BY_CATEGORY[cat.id] ?? [];
      for (const sub of subs) {
        if (selectedCauses.has(sub.id)) {
          result.push({ id: sub.id, label: sub.shortLabel ?? sub.label });
        }
      }
    }
    return result;
  }, [selectedCauses]);

  function handleSave() {
    setProfile((prev: any) => {
      const clubs = new Set(parseCommaList(prev.supportedClubs));
      const causes = new Set(parseCommaList(prev.impactCauses));
      const staleFeaturedClub =
        prev.featuredSupportedClub && !clubs.has(prev.featuredSupportedClub);
      const staleFeaturedCause =
        prev.featuredImpactCause && !causes.has(prev.featuredImpactCause);
      if (!staleFeaturedClub && !staleFeaturedCause) return prev;
      return {
        ...prev,
        ...(staleFeaturedClub ? { featuredSupportedClub: "" } : {}),
        ...(staleFeaturedCause ? { featuredImpactCause: "" } : {}),
      };
    });
    saveCategory({
      tag: "Impact",
      fieldKeys: MODULES["Impact"].fieldKeys,
      afterSave: onSaved,
    });
  }

  const hasCauseSelections = selectedCauses.size > 0;
  const hasClubSelections = selectedClubs.size > 0;

  return (
    <div id="studio-impact-anchor">
      {/* ── Panel header — matches other Profile Studio panels ── */}
      <p style={explainStyleLocal}>
        Share the causes you stand for and the drama clubs you support. Optionally
        spotlight one of each at the top of your public community section.
      </p>
      <div style={{ marginBottom: 18 }}>
        <span style={subheadChipStyle} className="subhead-chip">
          Community Impact
        </span>
      </div>

      {/* ── Causes ── */}
      <p style={subSectionLabelStyle}>Causes I Stand For</p>
      <p style={{ ...studioExplainStyle, marginBottom: 14 }}>
        Select the causes that resonate with your work and values.
      </p>

      <div style={{ display: "grid", gap: 6 }}>
        {CAUSE_CATEGORIES.map((cat) => {
          const isOpen = openCategories.has(cat.id);
          const subs = CAUSE_SUBCATEGORIES_BY_CATEGORY[cat.id] ?? [];
          const selectedCount = subs.filter((s) => selectedCauses.has(s.id)).length;

          return (
            <div key={cat.id}>
              <div
                role="button"
                tabIndex={0}
                style={categoryRowStyle}
                onClick={() => toggleCategory(cat.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleCategory(cat.id);
                  }
                }}
              >
                <span style={categoryLabelStyle}>
                  {cat.shortLabel ?? cat.label}
                  {selectedCount > 0 && (
                    <span
                      style={{
                        marginLeft: 8,
                        background: TEAL,
                        color: SNOW,
                        borderRadius: 999,
                        padding: "1px 7px",
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {selectedCount}
                    </span>
                  )}
                </span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={SNOW}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    opacity: 0.7,
                    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 180ms",
                    flexShrink: 0,
                  }}
                  aria-hidden="true"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>

              {isOpen && (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                    padding: "10px 10px 4px",
                  }}
                >
                  {subs.map((sub) => (
                    <button
                      key={sub.id}
                      type="button"
                      style={chipStyle(selectedCauses.has(sub.id))}
                      onClick={() => toggleCause(sub.id)}
                    >
                      {sub.shortLabel ?? sub.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={dividerStyle} />

      {/* ── Drama Clubs ── */}
      <p style={subSectionLabelStyle}>Drama Clubs I Support</p>
      <p style={{ ...studioExplainStyle, marginBottom: 14 }}>
        Select the DAT drama clubs you feel connected to.
      </p>

      <input
        type="search"
        placeholder="Search clubs…"
        value={clubSearch}
        onChange={(e) => setClubSearch(e.target.value)}
        style={{ ...lightInputStyle, marginBottom: 10 }}
        aria-label="Search drama clubs"
      />

      <div style={{ maxHeight: 340, overflowY: "auto" }}>
        {filteredClubs.map((club) => {
          const sel = selectedClubs.has(club.slug);
          return (
            <div
              key={club.slug}
              role="button"
              tabIndex={0}
              style={clubRowStyle(sel)}
              onClick={() => toggleClub(club.slug)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggleClub(club.slug);
                }
              }}
            >
              <span style={clubNameStyle}>{club.name}</span>
              <span style={clubCountryStyle}>{club.country}</span>
            </div>
          );
        })}
        {filteredClubs.length === 0 && (
          <p style={{ ...studioExplainStyle, textAlign: "center", padding: "12px 0" }}>
            No clubs match your search.
          </p>
        )}
      </div>

      {/* ── Featured Highlights — always visible ── */}
      <div style={dividerStyle} />
      <p style={subSectionLabelStyle}>Feature on Your Profile</p>
      <p style={{ ...studioExplainStyle, marginBottom: 18 }}>
        Spotlight one cause and one drama club at the top of your community
        section. Make selections above first.
      </p>

      {/* Featured Cause */}
      <div style={{ marginBottom: 18 }}>
        <p
          style={{
            fontFamily: FF_GROTESK,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase" as const,
            color: SNOW,
            margin: "0 0 8px 0",
          }}
        >
          Featured Cause
        </p>
        {hasCauseSelections ? (
          <>
            <select
              value={profile.featuredImpactCause ?? ""}
              onChange={(e) =>
                setProfile((prev: any) => ({
                  ...prev,
                  featuredImpactCause: e.target.value,
                }))
              }
              style={featuredSelectStyle(!!profile.featuredImpactCause)}
            >
              <option value="">— None selected —</option>
              {featuredCauseOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            <p style={{ ...studioExplainStyle, marginTop: 6, marginBottom: 0, opacity: 0.65 }}>
              {profile.featuredImpactCause
                ? "This cause is highlighted at the top of your community section."
                : "Choose one cause to feature prominently on your profile."}
            </p>
          </>
        ) : (
          <p
            style={{
              fontFamily: FF_SANS,
              fontSize: 13,
              color: SNOW,
              opacity: 0.45,
              fontStyle: "italic",
              margin: 0,
            }}
          >
            Select at least one cause above to enable this.
          </p>
        )}
      </div>

      {/* Featured Drama Club */}
      <div style={{ marginBottom: 4 }}>
        <p
          style={{
            fontFamily: FF_GROTESK,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase" as const,
            color: SNOW,
            margin: "0 0 8px 0",
          }}
        >
          Featured Drama Club
        </p>
        {hasClubSelections ? (
          <>
            <select
              value={profile.featuredSupportedClub ?? ""}
              onChange={(e) =>
                setProfile((prev: any) => ({
                  ...prev,
                  featuredSupportedClub: e.target.value,
                }))
              }
              style={featuredSelectStyle(!!profile.featuredSupportedClub)}
            >
              <option value="">— None selected —</option>
              {featuredClubOptions.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name} — {c.country}
                </option>
              ))}
            </select>
            <p style={{ ...studioExplainStyle, marginTop: 6, marginBottom: 0, opacity: 0.65 }}>
              {profile.featuredSupportedClub
                ? "This club is highlighted at the top of your community section."
                : "Choose one drama club to feature prominently on your profile."}
            </p>
          </>
        ) : (
          <p
            style={{
              fontFamily: FF_SANS,
              fontSize: 13,
              color: SNOW,
              opacity: 0.45,
              fontStyle: "italic",
              margin: 0,
            }}
          >
            Select at least one drama club above to enable this.
          </p>
        )}
      </div>

      {/* ── Save ── */}
      <div style={footerRowStyle}>
        <div />
        <button
          type="button"
          style={saveButtonStyle(loading)}
          disabled={loading}
          onClick={handleSave}
        >
          {savedRecently ? "Saved ✓" : "Save Impact"}
        </button>
      </div>
    </div>
  );
}
