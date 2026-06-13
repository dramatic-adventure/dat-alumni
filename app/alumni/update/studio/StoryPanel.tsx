"use client";

import { useEffect, useMemo, useState, type ReactNode, type CSSProperties } from "react";

import { ghostButton as studioGhostButton } from "@/components/alumni/update/ProfileStudio";
import { COLOR } from "@/app/alumni/update/updateStyles";

type MyStory = {
  storyKey: string;
  storyTitle?: string;
  storyProgram?: string;
  storyCountry?: string;
  storyYears?: string;
  deleted?: boolean;
};

// ── Filled, high-contrast action buttons (readable on the dark studio bg) ──────
const actionBtnBase: CSSProperties = {
  borderRadius: 9,
  padding: "7px 14px",
  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
  fontWeight: 700,
  fontSize: 12,
  letterSpacing: "0.04em",
  border: "1px solid transparent",
  cursor: "pointer",
  whiteSpace: "nowrap",
};
const editBtn: CSSProperties = { ...actionBtnBase, background: COLOR.teal, color: COLOR.snow };
const deleteBtn: CSSProperties = { ...actionBtnBase, background: COLOR.red, color: COLOR.snow };
const neutralBtn: CSSProperties = {
  ...actionBtnBase,
  background: "rgba(255,255,255,0.14)",
  color: COLOR.snow,
  border: "1px solid rgba(255,255,255,0.30)",
};

const cardStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 12,
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.04)",
  marginBottom: 10,
};

const sectionHeaderStyle: CSSProperties = {
  display: "flex",
  width: "100%",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 12,
  padding: "12px 14px",
  marginTop: 12,
  cursor: "pointer",
  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
  fontWeight: 600,
  fontSize: 14,
  color: COLOR.snow,
};

// White-card field styling, matched to FieldRenderer so the custom Country
// control blends in with the sheet-driven fields around it.
const fieldWrapClass = "rounded-2xl bg-white/70 p-3";
const fieldLabelClass =
  "block mb-1 text-[11px] tracking-wider uppercase text-gray-600 font-medium";
const fieldInputClass =
  "w-full rounded-xl border border-black/10 bg-white/80 px-3 py-2 text-[15px] text-[#241123] shadow-sm outline-none focus:ring-2 focus:ring-black/10";
const fieldHelpClass = "mt-1 text-xs text-gray-500";

const OTHER = "__other__";

function Section({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div>
      <button type="button" style={sectionHeaderStyle} onClick={onToggle} aria-expanded={open}>
        <span>{title}</span>
        <span style={{ opacity: 0.7 }}>{open ? "▾" : "▸"}</span>
      </button>
      {open && <div style={{ padding: "12px 2px 4px" }}>{children}</div>}
    </div>
  );
}

export default function StoryPanel(props: {
  loading: boolean;

  // styles
  explainStyleLocal: any;
  datButtonLocal: any;
  datButtonGhost: any;
  subheadChipStyle: any;

  // profile state
  profile: any;
  setProfile: (updater: any) => void;

  // story editor + publishing
  clearStoryEditor: () => void;
  saveStoryMapViaWriter: (opts?: { clearAfter?: boolean }) => Promise<boolean> | void;

  // "My Stories" list
  myStories: MyStory[];
  myStoriesLoading: boolean;
  refreshMyStories: (targetIdArg?: string) => Promise<void> | void;
  onSelectStoryFromMyStories: (storyKey: string) => Promise<void> | void;

  // soft delete / restore
  deleteStory: (storyKey: string) => Promise<void> | void;
  restoreStory: (storyKey: string) => Promise<void> | void;

  // rendering helpers
  renderFieldsOrNull: (keys: string[]) => ReactNode;
  storyMapEditKeys: string[];
  manualFallback: ReactNode;
}) {
  const {
    loading,
    explainStyleLocal,
    datButtonLocal,
    subheadChipStyle,
    profile,
    setProfile,
    clearStoryEditor,
    saveStoryMapViaWriter,
    myStories,
    myStoriesLoading,
    refreshMyStories,
    onSelectStoryFromMyStories,
    deleteStory,
    restoreStory,
    renderFieldsOrNull,
    storyMapEditKeys,
    manualFallback,
  } = props;

  const [view, setView] = useState<"list" | "editor">("list");
  const [openGroups, setOpenGroups] = useState({
    basics: true,
    story: false,
    media: false,
    publish: false,
  });
  const toggleGroup = (k: keyof typeof openGroups) =>
    setOpenGroups((g) => ({ ...g, [k]: !g[k] }));

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);

  // Dynamic country list (curated DAT base ∪ countries already used in stories).
  const [countries, setCountries] = useState<string[]>([]);
  const [countryOther, setCountryOther] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/map/countries")
      .then((r) => r.json())
      .then((d) => {
        if (alive && Array.isArray(d?.countries)) setCountries(d.countries);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // Reset the Other toggle whenever a different story is loaded into the editor.
  const storyKey = String(profile?.storyKey || "");
  useEffect(() => {
    setCountryOther(false);
  }, [storyKey]);

  const activeStories = useMemo(
    () => (myStories || []).filter((s) => !s.deleted),
    [myStories]
  );
  const deletedStories = useMemo(
    () => (myStories || []).filter((s) => s.deleted),
    [myStories]
  );

  const fieldsAvailable = renderFieldsOrNull(storyMapEditKeys) != null;

  const openEditorForNew = () => {
    clearStoryEditor();
    setCountryOther(false);
    setOpenGroups({ basics: true, story: false, media: false, publish: false });
    setView("editor");
  };

  const openEditorForEdit = async (key: string) => {
    await onSelectStoryFromMyStories(key);
    setCountryOther(false);
    setOpenGroups({ basics: true, story: false, media: false, publish: false });
    setView("editor");
  };

  const handlePublish = async () => {
    const ok = await saveStoryMapViaWriter({ clearAfter: true });
    if (ok) setView("list");
  };

  // ── Custom Country field (dynamic options + Other → manual entry) ────────────
  const currentCountry = String(profile?.storyCountry || "");
  const known = countries.includes(currentCountry);
  const effectiveOther =
    countryOther || (!!currentCountry && countries.length > 0 && !known);
  const selectValue = effectiveOther ? OTHER : known ? currentCountry : "";

  const setCountry = (v: string) =>
    setProfile((p: any) => ({ ...p, storyCountry: v }));

  const countryField = (
    <div className={fieldWrapClass}>
      <label className={fieldLabelClass}>Country</label>
      <select
        className={fieldInputClass}
        value={selectValue}
        onChange={(e) => {
          const v = e.target.value;
          if (v === OTHER) {
            setCountryOther(true);
          } else {
            setCountryOther(false);
            setCountry(v);
          }
        }}
      >
        <option value="">Select…</option>
        {countries.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
        <option value={OTHER}>Other (type it in)</option>
      </select>

      {effectiveOther && (
        <input
          type="text"
          className={`${fieldInputClass} mt-2`}
          value={currentCountry}
          placeholder="Type the country name"
          onChange={(e) => setCountry(e.target.value)}
        />
      )}

      <p className={fieldHelpClass}>
        Country associated with this story. Choose “Other” to add one that isn’t listed yet.
      </p>
    </div>
  );

  // ── LIST VIEW ────────────────────────────────────────────────────────────────
  if (view === "list") {
    return (
      <div>
        <div id="studio-story-anchor" />
        <p style={explainStyleLocal}>
          Your stories become map pins + memories. Add as many as you like — edit or remove any of
          them anytime. Deleting only hides a story; we keep a copy in the backend.
        </p>

        <span style={subheadChipStyle} className="subhead-chip">
          Your Stories
        </span>

        <div style={{ marginTop: 16 }}>
          {myStoriesLoading ? (
            <p
              style={{
                fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                fontSize: 14,
                color: COLOR.snow,
                opacity: 0.6,
              }}
            >
              Loading your stories…
            </p>
          ) : activeStories.length === 0 ? (
            <p
              style={{
                fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                fontSize: 14,
                color: COLOR.snow,
                opacity: 0.6,
                marginBottom: 14,
              }}
            >
              No stories yet.
            </p>
          ) : (
            <div style={{ marginBottom: 16 }}>
              {activeStories.map((s) => {
                const meta = [s.storyProgram, s.storyCountry, s.storyYears]
                  .map((x) => String(x || "").trim())
                  .filter(Boolean)
                  .join(" · ");
                const confirming = confirmDelete === s.storyKey;
                return (
                  <div key={s.storyKey} style={cardStyle}>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                          fontSize: 15,
                          fontWeight: 600,
                          color: COLOR.snow,
                        }}
                      >
                        {String(s.storyTitle || "").trim() || "(untitled)"}
                      </div>
                      {meta ? (
                        <div
                          style={{
                            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                            fontSize: 13,
                            color: COLOR.snow,
                            opacity: 0.7,
                            marginTop: 2,
                          }}
                        >
                          {meta}
                        </div>
                      ) : null}
                    </div>
                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      {confirming ? (
                        <>
                          <button
                            type="button"
                            style={{ ...deleteBtn, opacity: loading ? 0.6 : 1 }}
                            disabled={loading}
                            onClick={async () => {
                              await deleteStory(s.storyKey);
                              setConfirmDelete(null);
                            }}
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            style={neutralBtn}
                            disabled={loading}
                            onClick={() => setConfirmDelete(null)}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            style={editBtn}
                            disabled={loading}
                            onClick={() => openEditorForEdit(s.storyKey)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            style={deleteBtn}
                            disabled={loading}
                            onClick={() => setConfirmDelete(s.storyKey)}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <button type="button" style={datButtonLocal} disabled={loading} onClick={openEditorForNew}>
              + Add a Story
            </button>
            <button
              type="button"
              style={studioGhostButton}
              disabled={loading || myStoriesLoading}
              onClick={() => refreshMyStories()}
              title="Refresh your stories"
            >
              Refresh
            </button>
          </div>

          {deletedStories.length > 0 && (
            <div style={{ marginTop: 22 }}>
              <button
                type="button"
                onClick={() => setShowDeleted((v) => !v)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: COLOR.snow,
                  opacity: 0.6,
                }}
              >
                {showDeleted ? "▾" : "▸"} Deleted ({deletedStories.length})
              </button>

              {showDeleted && (
                <div style={{ marginTop: 10 }}>
                  <p
                    style={{
                      fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                      fontSize: 12,
                      color: COLOR.snow,
                      opacity: 0.55,
                      margin: "0 0 10px",
                    }}
                  >
                    These are hidden from your profile and the map, but still saved. Restore one to
                    bring it back as a draft.
                  </p>
                  {deletedStories.map((s) => {
                    const meta = [s.storyProgram, s.storyCountry, s.storyYears]
                      .map((x) => String(x || "").trim())
                      .filter(Boolean)
                      .join(" · ");
                    return (
                      <div key={s.storyKey} style={{ ...cardStyle, opacity: 0.85 }}>
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                              fontSize: 14,
                              fontWeight: 600,
                              color: COLOR.snow,
                            }}
                          >
                            {String(s.storyTitle || "").trim() || "(untitled)"}
                          </div>
                          {meta ? (
                            <div
                              style={{
                                fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                                fontSize: 12,
                                color: COLOR.snow,
                                opacity: 0.6,
                                marginTop: 2,
                              }}
                            >
                              {meta}
                            </div>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          style={editBtn}
                          disabled={loading}
                          onClick={() => restoreStory(s.storyKey)}
                        >
                          Restore
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── EDITOR VIEW ──────────────────────────────────────────────────────────────
  return (
    <div>
      <div id="studio-story-anchor" />

      <button
        type="button"
        style={{ ...neutralBtn, marginBottom: 14 }}
        disabled={loading}
        onClick={() => setView("list")}
      >
        ← Your stories
      </button>

      <span style={subheadChipStyle} className="subhead-chip">
        {storyKey ? "Edit Story" : "New Story"}
      </span>

      <p style={{ ...explainStyleLocal, marginTop: 12 }}>
        If you paste media, use a direct URL to the file.
      </p>

      {!fieldsAvailable ? (
        manualFallback
      ) : (
        <>
          <Section title="Basics" open={openGroups.basics} onToggle={() => toggleGroup("basics")}>
            {renderFieldsOrNull(["storyTitle", "storyProgram"])}
            <div style={{ marginTop: 12 }}>{countryField}</div>
            <div style={{ marginTop: 12 }}>
              {renderFieldsOrNull(["storyYears", "storyLocationName"])}
            </div>
          </Section>

          <Section title="The Story" open={openGroups.story} onToggle={() => toggleGroup("story")}>
            {renderFieldsOrNull([
              "storyShortStory",
              "storyQuote",
              "storyQuoteAttribution",
              "storyPartners",
            ])}
          </Section>

          <Section
            title="Media & Links"
            open={openGroups.media}
            onToggle={() => toggleGroup("media")}
          >
            {renderFieldsOrNull(["storyMediaUrl", "storyMoreInfoUrl"])}
          </Section>

          <Section
            title="Publish"
            open={openGroups.publish}
            onToggle={() => toggleGroup("publish")}
          >
            {renderFieldsOrNull(["storyShowOnMap"])}
          </Section>
        </>
      )}

      <div
        style={{
          marginTop: 28,
          paddingTop: 18,
          borderTop: "1px solid rgba(255,255,255,0.10)",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 14,
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          style={studioGhostButton}
          disabled={loading}
          onClick={() => setView("list")}
        >
          Cancel
        </button>
        <button type="button" style={datButtonLocal} disabled={loading} onClick={handlePublish}>
          Publish Story to Map
        </button>
      </div>
    </div>
  );
}
