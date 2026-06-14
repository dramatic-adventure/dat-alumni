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

// Frosted-glass field styling (matches the FieldRenderer "glass" variant) so the
// custom Project/Country controls blend in with the sheet-driven fields. The
// actual look lives in the GLASS_CSS <style> block injected in the editor view.
const fieldLabelClass = "dat-glass-label";
const fieldInputClass = "dat-glass-input";
const fieldSelectClass = "dat-glass-input dat-glass-select";

// Frosted theme for the story editor — defined as real CSS so ::placeholder and
// :focus work (inline styles can't), and so it never depends on Tailwind JIT.
const GLASS_CSS = `
.dat-glass-label{display:block;margin-bottom:8px;font-size:12px;letter-spacing:.03em;text-transform:uppercase;color:rgba(242,242,242,.6);font-weight:500;}
.dat-glass-input{width:100%;box-sizing:border-box;border-radius:12px;border:1px solid rgba(255,255,255,.15);background-color:rgba(255,255,255,.06);padding:13px 15px;font-size:15px;color:#F2F2F2;outline:none;font-family:inherit;transition:border-color .15s,box-shadow .15s;}
.dat-glass-input::placeholder{color:rgba(242,242,242,.4);}
.dat-glass-input:hover{border-color:rgba(255,255,255,.28);}
.dat-glass-input:focus{border-color:rgba(36,147,169,.75);box-shadow:0 0 0 3px rgba(36,147,169,.25);}
.dat-glass-input option{color:#241123;background:#F2F2F2;}
.dat-glass-select{appearance:none;-webkit-appearance:none;padding-right:42px;cursor:pointer;background-image:url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='16'%20height='16'%20fill='none'%20stroke='%23F2F2F2'%20stroke-opacity='0.6'%20stroke-width='2'%20stroke-linecap='round'%20stroke-linejoin='round'%3E%3Cpath%20d='M4%206l4%204%204-4'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 15px center;}
`;

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
    opts?: { helpAsPlaceholder?: boolean; gapPx?: number; variant?: "light" | "glass" }
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
  // Which source the Associated Program field is pulling from.
  const [programMode, setProgramMode] = useState<"program" | "production" | "custom">("program");

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
  }, [storyKey]);

  // Pick the right Associated Program mode for the loaded story (and re-derive
  // when the program/production lists arrive). Not keyed on every keystroke.
  useEffect(() => {
    const v = String(profile?.storyProgram || "").trim();
    if (!v) setProgramMode("program");
    else if (programs.includes(v)) setProgramMode("program");
    else if (productions.includes(v)) setProgramMode("production");
    else setProgramMode("custom");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyKey, programs, productions]);

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
    options: string[];
    other: boolean;
    setOther: (b: boolean) => void;
    placeholder: string;
    otherPlaceholder: string;
  }) => {
    const known = opts.options.includes(opts.value);
    const effectiveOther =
      opts.other || (!!opts.value && opts.options.length > 0 && !known);
    const selectValue = effectiveOther ? OTHER : known ? opts.value : "";

    return (
      <div>
        <label className={fieldLabelClass}>{opts.label}</label>
        <select
          className={fieldSelectClass}
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
          <option value="">{opts.placeholder}</option>
          {opts.options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
          <option value={OTHER}>Other (type it in)</option>
        </select>

        {effectiveOther && (
          <input
            type="text"
            className={fieldInputClass}
            style={{ marginTop: 12 }}
            value={opts.value}
            placeholder={opts.otherPlaceholder}
            onChange={(e) => opts.setValue(e.target.value)}
          />
        )}
      </div>
    );
  };

  // ── Associated Program — pick a source first (Program / Production / Other),
  //    then one control. Productions stay out of sight until that tab is chosen.
  const currentProgram = String(profile?.storyProgram || "");
  const programModes: {
    id: "program" | "production" | "custom";
    label: string;
    options: string[] | null;
  }[] = [
    { id: "program", label: "Program", options: programs },
    { id: "production", label: "Production", options: productions },
    { id: "custom", label: "Other", options: null },
  ];
  const activeProgramMode =
    programModes.find((m) => m.id === programMode) ?? programModes[0];

  const programChipStyle = (active: boolean): CSSProperties => ({
    border: 0,
    cursor: "pointer",
    borderRadius: 999,
    padding: "6px 16px",
    fontSize: 13,
    fontFamily: "inherit",
    fontWeight: active ? 600 : 500,
    background: active ? COLOR.teal : "transparent",
    color: active ? "#fff" : "rgba(242,242,242,0.8)",
    transition: "background 140ms, color 140ms",
  });

  const programField = (
    <div>
      <label className={fieldLabelClass}>Associated Project</label>
      <div
        style={{
          display: "inline-flex",
          background: "rgba(255,255,255,0.08)",
          borderRadius: 999,
          padding: 4,
          gap: 2,
          marginBottom: 12,
        }}
      >
        {programModes.map((m) => (
          <button
            key={m.id}
            type="button"
            style={programChipStyle(programMode === m.id)}
            onClick={() => setProgramMode(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>
      {activeProgramMode.options ? (
        <select
          className={fieldSelectClass}
          value={
            activeProgramMode.options.includes(currentProgram) ? currentProgram : ""
          }
          onChange={(e) => setField("storyProgram")(e.target.value)}
        >
          <option value="">
            {programMode === "production" ? "Select a production…" : "Select a program…"}
          </option>
          {activeProgramMode.options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : (
        <input
          type="text"
          className={fieldInputClass}
          value={currentProgram}
          placeholder="Type a program or production name"
          onChange={(e) => setField("storyProgram")(e.target.value)}
        />
      )}
    </div>
  );

  const countryField = renderDynamicSelect({
    label: "Country",
    value: String(profile?.storyCountry || ""),
    setValue: setField("storyCountry"),
    options: countries,
    other: countryOther,
    setOther: setCountryOther,
    placeholder: "Select a country…",
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
      <style>{GLASS_CSS}</style>
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
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {renderFieldsOrNull(["storyTitle"], {
                helpAsPlaceholder: true,
                gapPx: 20,
                variant: "glass",
              })}
              {programField}
              {countryField}
              {renderFieldsOrNull(["storyYears", "storyLocationName"], {
                helpAsPlaceholder: true,
                gapPx: 20,
                variant: "glass",
              })}
            </div>
          </Section>

          <Section title="The Story" open={openGroups.story} onToggle={() => toggleGroup("story")}>
            {renderFieldsOrNull(
              ["storyShortStory", "storyQuote", "storyQuoteAttribution", "storyPartners"],
              { helpAsPlaceholder: true, gapPx: 20, variant: "glass" }
            )}
          </Section>

          <Section
            title="Media & Links"
            open={openGroups.media}
            onToggle={() => toggleGroup("media")}
          >
            {renderFieldsOrNull(["storyMediaUrl", "storyMoreInfoUrl"], {
              helpAsPlaceholder: true,
              gapPx: 20,
              variant: "glass",
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
