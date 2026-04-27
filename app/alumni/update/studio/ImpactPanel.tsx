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

/* ---- Shared dark-glass style tokens ---- */

const FF_SANS =
  'var(--font-dm-sans), system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const FF_GROTESK =
  "var(--font-space-grotesk), system-ui, sans-serif";

const TEAL = "#2493A9";
const SNOW = "#F2F2F2";
const INK = "#241123";

const sectionHeadStyle: CSSProperties = {
  fontFamily: FF_GROTESK,
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: SNOW,
  opacity: 0.9,
  margin: "0 0 12px 0",
};

const categoryRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "10px 12px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 10,
  cursor: "pointer",
  userSelect: "none",
};

const categoryLabelStyle: CSSProperties = {
  fontFamily: FF_GROTESK,
  fontSize: 13,
  fontWeight: 700,
  color: SNOW,
  opacity: 0.9,
};

const chipStyle = (selected: boolean): CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  padding: "5px 11px",
  borderRadius: 999,
  fontFamily: FF_SANS,
  fontSize: 12,
  fontWeight: selected ? 700 : 400,
  cursor: "pointer",
  border: selected
    ? `1px solid ${TEAL}`
    : "1px solid rgba(255,255,255,0.18)",
  background: selected ? TEAL : "rgba(255,255,255,0.05)",
  color: selected ? SNOW : "rgba(242,242,242,0.75)",
  transition: "background 140ms, border-color 140ms, color 140ms",
});

const clubRowStyle = (selected: boolean): CSSProperties => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "8px 12px",
  borderRadius: 8,
  cursor: "pointer",
  border: selected
    ? `1px solid ${TEAL}`
    : "1px solid rgba(255,255,255,0.10)",
  background: selected ? "rgba(36,147,169,0.15)" : "rgba(255,255,255,0.04)",
  marginBottom: 4,
});

const clubNameStyle: CSSProperties = {
  fontFamily: FF_SANS,
  fontSize: 13,
  color: SNOW,
  opacity: 0.9,
};

const clubCountryStyle: CSSProperties = {
  fontFamily: FF_SANS,
  fontSize: 12,
  color: SNOW,
  opacity: 0.5,
};

const searchInputStyle: CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: 8,
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.15)",
  color: SNOW,
  fontFamily: FF_SANS,
  fontSize: 13,
  outline: "none",
  marginBottom: 10,
  boxSizing: "border-box",
};

const dividerStyle: CSSProperties = {
  borderTop: "1px solid rgba(255,255,255,0.08)",
  margin: "22px 0",
};

const saveButtonStyle = (loading: boolean): CSSProperties => ({
  borderRadius: 14,
  padding: "12px 20px",
  fontFamily: FF_GROTESK,
  fontWeight: 700,
  fontSize: "0.85rem",
  textTransform: "uppercase" as const,
  letterSpacing: "0.18em",
  background: loading ? "rgba(36,147,169,0.5)" : TEAL,
  color: SNOW,
  border: "1px solid rgba(0,0,0,0.22)",
  boxShadow: "0 10px 26px rgba(0,0,0,0.18)",
  cursor: loading ? "not-allowed" : "pointer",
  opacity: loading ? 0.6 : 1,
});

export default function ImpactPanel({
  profile,
  setProfile,
  saveCategory,
  loading,
  MODULES,
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
    // Clear stale featured values if their parent was deselected
    setProfile((prev: any) => {
      const clubs = new Set(parseCommaList(prev.supportedClubs));
      const causes = new Set(parseCommaList(prev.impactCauses));
      const staleFeaturedClub = prev.featuredSupportedClub && !clubs.has(prev.featuredSupportedClub);
      const staleFeaturedCause = prev.featuredImpactCause && !causes.has(prev.featuredImpactCause);
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

  return (
    <div id="studio-impact-anchor">
      {/* ── Causes ── */}
      <p style={sectionHeadStyle}>Causes I Stand For</p>
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
                    opacity: 0.6,
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
      <p style={sectionHeadStyle}>Drama Clubs I Support</p>
      <p style={{ ...studioExplainStyle, marginBottom: 14 }}>
        Select the DAT drama clubs you feel connected to.
      </p>

      <input
        type="search"
        placeholder="Search clubs…"
        value={clubSearch}
        onChange={(e) => setClubSearch(e.target.value)}
        style={searchInputStyle}
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

      {/* ── Featured Highlights ── */}
      {(featuredCauseOptions.length > 0 || featuredClubOptions.length > 0) && (
        <>
          <div style={dividerStyle} />
          <p style={sectionHeadStyle}>Feature on Your Profile</p>
          <p style={{ ...studioExplainStyle, marginBottom: 14 }}>
            Spotlight one cause and one drama club at the top of your community section.
          </p>

          {featuredCauseOptions.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <p
                style={{
                  fontFamily: FF_GROTESK,
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase" as const,
                  color: SNOW,
                  opacity: 0.6,
                  margin: "0 0 6px 0",
                }}
              >
                Featured Cause
              </p>
              <select
                value={profile.featuredImpactCause ?? ""}
                onChange={(e) =>
                  setProfile((prev: any) => ({ ...prev, featuredImpactCause: e.target.value }))
                }
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: SNOW,
                  fontFamily: FF_SANS,
                  fontSize: 13,
                  outline: "none",
                  boxSizing: "border-box" as const,
                }}
              >
                <option value="">— None —</option>
                {featuredCauseOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {featuredClubOptions.length > 0 && (
            <div>
              <p
                style={{
                  fontFamily: FF_GROTESK,
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase" as const,
                  color: SNOW,
                  opacity: 0.6,
                  margin: "0 0 6px 0",
                }}
              >
                Featured Drama Club
              </p>
              <select
                value={profile.featuredSupportedClub ?? ""}
                onChange={(e) =>
                  setProfile((prev: any) => ({ ...prev, featuredSupportedClub: e.target.value }))
                }
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: SNOW,
                  fontFamily: FF_SANS,
                  fontSize: 13,
                  outline: "none",
                  boxSizing: "border-box" as const,
                }}
              >
                <option value="">— None —</option>
                {featuredClubOptions.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name} — {c.country}
                  </option>
                ))}
              </select>
            </div>
          )}
        </>
      )}

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
