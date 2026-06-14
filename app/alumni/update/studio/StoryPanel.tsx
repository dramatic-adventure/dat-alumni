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
  renderFieldsOrNull: (
    keys: string[],
    opts?: { helpAsPlaceholder?: boolean; gapClass?: string }
  ) => ReactNode;
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
  });
  const toggleGroup = (k: keyof typeof openGroups) =>
    setOpenGroups((g) => ({ ...g, [k]: !g[k] }));

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);

  // Dynamic option lists (pulled from the maps so the dropdowns stay current).
  const [countries, setCountries] = useState<string[]>([]);
  const [countryOther, setCountryOther] = useState(false);
  const [programs, setPrograms] = useState<string[]>([]);
  const [productions, setProductions] = useState<string[]>([]);
  const [programOther, setProgramOther] = useState(false);
  // Productions are a long list, so they stay hidden until explicitly requested.
  const [showProductions, setShowProductions] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/map/countries")
      .then((r) => r.json())
      .then((d) => {
        if (alive && Array.isArray(d?.countries)) setCountries(d.countries);
      })
      .catch(() => {});
    fetch("/api/map/programs")
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        if (Array.isArray(d?.programs)) setPrograms(d.programs);
        if (Array.isArray(d?.productions)) setProductions(d.productions);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // Reset the Other toggles whenever a different story is loaded into the editor.
  const storyKey = String(profile?.storyKey || "");
  useEffect(() => {
    setCountryOther(false);
    setProgramOther(false);
    setShowProductions(false);
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
    setOpenGroups({ basics: true, story: false, media: false });
    setView("editor");
  };

  const openEditorForEdit = async (key: string) => {
    await onSelectStoryFromMyStories(key);
    setCountryOther(false);
    setOpenGroups({ basics: true, story: false, media: false });
    setView("editor");
  };

  const handlePublish = async () => {
    const ok = await saveStoryMapViaWriter({ clearAfter: true });
    if (ok) setView("list");
  };

  // ── Shared dynamic-select field (grouped options + Other → manual entry) ─────
  // Used for both Country and Associated Program so they look and behave the same.
  const setField = (key: string) => (v: string) =>
    setProfile((p: any) => ({ ...p, [key]: v }));

  const renderDynamicSelect = (opts: {
    label: string;
    value: string;
    setValue: (v: string) => void;
    groups: { label?: string; options: string[] }[];
    other: boolean;
    setOther: (b: boolean) => void;
    otherPlaceholder: string;
    footer?: ReactNode;
  }) => {
    const allOptions = opts.groups.flatMap((g) => g.options);
    const known = allOptions.includes(opts.value);
    const effectiveOther =
      opts.other || (!!opts.value && allOptions.length > 0 && !known);
    const selectValue = effectiveOther ? OTHER : known ? opts.value : "";

    return (
      <div className={fieldWrapClass}>
        <label className={fieldLabelClass}>{opts.label}</label>
        <select
          className={fieldInputClass}
          value={selectValue}
          onChange={(e) => {
            const v = e.target.value;
            if (v === OTHER) {
              opts.setOther(true);
            } else {
              opts.setOther(false);
              opts.setValue(v);
            }
          }}
        >
          <option value="">Select…</option>
          {opts.groups.map((g, gi) =>
            g.label ? (
              <optgroup key={gi} label={g.label}>
                {g.options.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </optgroup>
            ) : (
              g.options.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))
            )
          )}
          <option value={OTHER}>Other (type it in)</option>
        </select>

        {effectiveOther && (
          <input
            type="text"
            className={`${fieldInputClass} mt-2`}
            value={opts.value}
            placeholder={opts.otherPlaceholder}
            onChange={(e) => opts.setValue(e.target.value)}
          />
        )}

        {opts.footer}
      </div>
    );
  };

  // Productions stay hidden until requested — or auto-reveal if this story already
  // has a production selected (so the saved value is recognized, not shown as "Other").
  const currentProgram = String(profile?.storyProgram || "");
  const showProds = showProductions || productions.includes(currentProgram);
  const programGroups = showProds
    ? [
        { label: "Programs", options: programs },
        { label: "Productions", options: productions },
      ]
    : [{ label: "Programs", options: programs }];

  const programField = renderDynamicSelect({
    label: "Associated Program",
    value: currentProgram,
    setValue: setField("storyProgram"),
    groups: programGroups,
    other: programOther,
    setOther: setProgramOther,
    otherPlaceholder: "Type a program or production",
    footer:
      !showProds && productions.length > 0 ? (
        <button
          type="button"
          className="mt-2 text-[13px] font-medium text-[#2493A9] hover:underline"
          onClick={() => setShowProductions(true)}
        >
          + Choose a production instead
        </button>
      ) : null,
  });

  const countryField = renderDynamicSelect({
    label: "Country",
    value: String(profile?.storyCountry || ""),
    setValue: setField("storyCountry"),
    groups: [{ options: countries }],
    other: countryOther,
    setOther: setCountryOther,
    otherPlaceholder: "Type the country name",
  });

  // ── LIST VIEW ────────────────────────────────────────────────────────────────
  if (view === "list") {
    return (
      <div>
        <div id="studio-story-anchor" />
        <p style={explainStyleLocal}>
          Your stories become map pins + memories. Add as many as you like — edit or remove any anytime.
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

      <div style={{ marginBottom: 12 }}>
        <button
          type="button"
          style={neutralBtn}
          disabled={loading}
          onClick={() => setView("list")}
        >
          ← Your stories
        </button>
      </div>

      <div style={{ marginBottom: 4 }}>
        <span style={subheadChipStyle} className="subhead-chip">
          {storyKey ? "Edit Story" : "New Story"}
        </span>
      </div>

      {!fieldsAvailable ? (
        manualFallback
      ) : (
        <>
          <Section title="Basics" open={openGroups.basics} onToggle={() => toggleGroup("basics")}>
            <div className="flex flex-col gap-5">
              {renderFieldsOrNull(["storyTitle"], { helpAsPlaceholder: true, gapClass: "gap-5" })}
              {programField}
              {countryField}
              {renderFieldsOrNull(["storyYears", "storyLocationName"], {
                helpAsPlaceholder: true,
                gapClass: "gap-5",
              })}
            </div>
          </Section>

          <Section title="The Story" open={openGroups.story} onToggle={() => toggleGroup("story")}>
            {renderFieldsOrNull(
              ["storyShortStory", "storyQuote", "storyQuoteAttribution", "storyPartners"],
              { helpAsPlaceholder: true, gapClass: "gap-5" }
            )}
          </Section>

          <Section
            title="Media & Links"
            open={openGroups.media}
            onToggle={() => toggleGroup("media")}
          >
            {renderFieldsOrNull(["storyMediaUrl", "storyMoreInfoUrl"], {
              helpAsPlaceholder: true,
              gapClass: "gap-5",
            })}
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
