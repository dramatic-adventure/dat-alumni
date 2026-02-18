type Props = {
  profile: any;
  setProfile: (fn: any) => void;
  labelStyle: any;
  inputStyle: any;
  explainStyleLocal: any;
};

export default function ManualUpcomingEventFallback({
  profile,
  setProfile,
  labelStyle,
  inputStyle,
  explainStyleLocal,
}: Props) {
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div>
        <label style={labelStyle}>Event Title</label>
        <input
          value={profile.upcomingEventTitle || ""}
          onChange={(e) => setProfile((p: any) => ({ ...p, upcomingEventTitle: e.target.value }))}
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>Event Link</label>
        <input
          value={profile.upcomingEventLink || ""}
          onChange={(e) => setProfile((p: any) => ({ ...p, upcomingEventLink: e.target.value }))}
          style={inputStyle}
          placeholder="https://..."
        />
      </div>

      <div>
        <label style={labelStyle}>Event Date</label>
        <input
          value={profile.upcomingEventDate || ""}
          onChange={(e) => setProfile((p: any) => ({ ...p, upcomingEventDate: e.target.value }))}
          style={inputStyle}
          placeholder="YYYY-MM-DD"
        />
      </div>

      <div>
        <label style={labelStyle}>Expires At</label>
        <input
          value={profile.upcomingEventExpiresAt || ""}
          onChange={(e) =>
            setProfile((p: any) => ({ ...p, upcomingEventExpiresAt: e.target.value }))
          }
          style={inputStyle}
          placeholder="YYYY-MM-DD"
        />
      </div>

      <div>
        <label style={labelStyle}>Description</label>
        <textarea
          value={profile.upcomingEventDescription || ""}
          onChange={(e) =>
            setProfile((p: any) => ({ ...p, upcomingEventDescription: e.target.value }))
          }
          rows={5}
          style={{ ...inputStyle, minHeight: 160, resize: "vertical" }}
        />
      </div>

      <p style={{ ...explainStyleLocal, marginTop: 6 }}>
        (Fallback UI) Add these keys to <code>PROFILE_FIELDS</code> to render via FieldRenderer.
      </p>
    </div>
  );
}
