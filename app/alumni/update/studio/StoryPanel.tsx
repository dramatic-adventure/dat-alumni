"use client";

import type { ReactNode } from "react";

import type { UploadKind } from "@/lib/uploader";
import { ghostButton as studioGhostButton } from "@/components/alumni/update/ProfileStudio";

type MyStory = {
  storyKey: string;
  storyTitle?: string;
  storyProgram?: string;
  storyCountry?: string;
  storyYears?: string;
};

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
  saveStoryMapViaWriter: (opts?: { clearAfter?: boolean }) => Promise<void> | void;

  // "My Stories" list
  myStories: MyStory[];
  myStoriesLoading: boolean;
  refreshMyStories: (targetIdArg?: string) => Promise<void> | void;
  onSelectStoryFromMyStories: (storyKey: string) => Promise<void> | void;

  // rendering helpers
  renderFieldsOrNull: (keys: string[]) => ReactNode;
  storyMapEditKeys: string[];
  manualFallback: ReactNode;
}) {
  const {
    loading,
    explainStyleLocal,
    datButtonLocal,
    datButtonGhost,
    subheadChipStyle,
    profile,
    setProfile,
    clearStoryEditor,
    saveStoryMapViaWriter,
    myStories,
    myStoriesLoading,
    refreshMyStories,
    onSelectStoryFromMyStories,
    renderFieldsOrNull,
    storyMapEditKeys,
    manualFallback,
  } = props;

  return (
    <div>
      <div id="studio-story-anchor" />
      <p style={explainStyleLocal}>
        Your story becomes a map pin + memory. If you paste media, it should be a direct URL to the
        file.
      </p>

      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <button
          type="button"
          style={studioGhostButton}
          disabled={loading}
          onClick={() => clearStoryEditor()}
          title="Start a new story (clears the editor)"
        >
          New Story
        </button>

        <select
          value={String(profile.storyKey || "")}
          disabled={loading || myStoriesLoading}
          onChange={(e) => {
            const k = String(e.target.value || "").trim();
            if (!k) return;
            onSelectStoryFromMyStories(k);
          }}
          className="dat-btn-ghost"
          style={{ ...(datButtonGhost as any), padding: "10px 12px", minWidth: 260 }}
          title="Load one of your previously published stories"
        >
          <option value="">
            {myStoriesLoading ? "Loading your stories…" : "Select a published story…"}
          </option>

          {(myStories || []).map((s) => {
            const title = String(s.storyTitle || "").trim() || "(untitled)";
            const program = String(s.storyProgram || "").trim();
            const country = String(s.storyCountry || "").trim();
            const years = String(s.storyYears || "").trim();

            // Title -- Program: Country Year(s)
            const label = `${title} -- ${program || "Program"}: ${country || "Country"}${
              years ? ` ${years}` : ""
            }`;

            return (
              <option key={s.storyKey} value={s.storyKey}>
                {label}
              </option>
            );
          })}
        </select>

        <button
          type="button"
          style={studioGhostButton}
          disabled={loading || myStoriesLoading}
          onClick={() => refreshMyStories()}
          title="Refresh My Stories list"
        >
          Refresh
        </button>
      </div>

      {renderFieldsOrNull(storyMapEditKeys) ?? manualFallback}

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
        <button
          type="button"
          style={datButtonLocal}
          disabled={loading}
          onClick={() => saveStoryMapViaWriter({ clearAfter: true })}
        >
          Publish Story to Map
        </button>
      </div>
    </div>
  );
}
