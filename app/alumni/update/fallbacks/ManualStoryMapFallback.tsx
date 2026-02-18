type Props = {
  profile: any;
  setProfile: (fn: any) => void;
  labelStyle: any;
  inputStyle: any;
  explainStyleLocal: any;
};

export default function ManualStoryMapFallback({
  profile,
  setProfile,
  labelStyle,
  inputStyle,
  explainStyleLocal,
}: Props) {
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div>
        <label style={labelStyle}>Story Title</label>
        <input
          value={profile.storyTitle || ""}
          onChange={(e) => setProfile((p: any) => ({ ...p, storyTitle: e.target.value }))}
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>Associated Program</label>
        <input
          value={profile.storyProgram || ""}
          onChange={(e) => setProfile((p: any) => ({ ...p, storyProgram: e.target.value }))}
          style={inputStyle}
          placeholder="ACTion / RAW / CASTAWAY / PASSAGE / ..."
        />
      </div>

      <div>
        <label style={labelStyle}>Country</label>
        <input
          value={profile.storyCountry || ""}
          onChange={(e) => setProfile((p: any) => ({ ...p, storyCountry: e.target.value }))}
          style={inputStyle}
          placeholder="Ecuador, Slovakia..."
        />
      </div>

      <div>
        <label style={labelStyle}>Year(s)</label>
        <input
          value={profile.storyYears || ""}
          onChange={(e) => setProfile((p: any) => ({ ...p, storyYears: e.target.value }))}
          style={inputStyle}
          placeholder="2016 or 2015–2016"
        />
      </div>

      <div>
        <label style={labelStyle}>Location Name (map pin label)</label>
        <input
          value={profile.storyLocationName || ""}
          onChange={(e) =>
            setProfile((p: any) => ({ ...p, storyLocationName: e.target.value }))
          }
          style={inputStyle}
          placeholder="City / Region / Landmark"
        />
      </div>

      <div>
        <label style={labelStyle}>Partners</label>
        <input
          value={profile.storyPartners || ""}
          onChange={(e) => setProfile((p: any) => ({ ...p, storyPartners: e.target.value }))}
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>Media URL</label>
        <input
          value={profile.storyMediaUrl || ""}
          onChange={(e) => setProfile((p: any) => ({ ...p, storyMediaUrl: e.target.value }))}
          style={inputStyle}
          placeholder="https://..."
        />
      </div>

      <div>
        <label style={labelStyle}>More Info URL</label>
        <input
          value={profile.storyMoreInfoUrl || ""}
          onChange={(e) =>
            setProfile((p: any) => ({ ...p, storyMoreInfoUrl: e.target.value }))
          }
          style={inputStyle}
          placeholder="https://..."
        />
      </div>

      <div>
        <label style={labelStyle}>Short Story</label>
        <textarea
          value={profile.storyShortStory || ""}
          onChange={(e) =>
            setProfile((p: any) => ({ ...p, storyShortStory: e.target.value }))
          }
          rows={6}
          style={{ ...inputStyle, minHeight: 160, resize: "vertical" }}
        />
      </div>

      <div>
        <label style={labelStyle}>Quote (no quotation marks)</label>
        <textarea
          value={profile.storyQuote || ""}
          onChange={(e) => setProfile((p: any) => ({ ...p, storyQuote: e.target.value }))}
          rows={3}
          style={{ ...inputStyle, minHeight: 110, resize: "vertical" }}
        />
      </div>

      <div>
        <label style={labelStyle}>Quote Author</label>
        <input
          value={profile.storyQuoteAttribution || ""}
          onChange={(e) =>
            setProfile((p: any) => ({ ...p, storyQuoteAttribution: e.target.value }))
          }
          style={inputStyle}
        />
      </div>

      <label style={{ fontWeight: 700 }}>
        <input
          type="checkbox"
          checked={
            String(profile.storyShowOnMap || "").toLowerCase() === "true" ||
            profile.storyShowOnMap === true
          }
          onChange={(e) =>
            setProfile((p: any) => ({ ...p, storyShowOnMap: e.target.checked ? "true" : "" }))
          }
          style={{ marginRight: 10 }}
        />
        Show on Map?
      </label>

      <p style={{ ...explainStyleLocal, marginTop: 6 }}>
        (Fallback UI) Add Story Map keys to <code>PROFILE_FIELDS</code> to render via FieldRenderer.
      </p>
    </div>
  );
}
