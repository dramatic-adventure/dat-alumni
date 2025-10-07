"use client";
type Props = {
  loading?: boolean;
  disabled?: boolean;
  onClick: () => void;
  bg?: string; // optional override
  ink?: string;
};
export default function SaveBar({ loading, disabled, onClick, bg = "rgba(255,255,255,.95)", ink = "#241123" }: Props) {
  return (
    <div className="fixed bottom-0 left-0 right-0" style={{ background: `linear-gradient(180deg, rgba(255,255,255,0) 0%, ${bg} 48%)`, backdropFilter: "saturate(150%) blur(8px)" }}>
      <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-end">
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          aria-busy={loading}
          style={{
            fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif',
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.22rem",
            fontSize: ".95rem",
            color: "#F2F2F2",
            backgroundColor: loading ? "#4f0087" : "#6C00AF",
            padding: "12px 22px",
            borderRadius: 14,
            border: "none",
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.7 : 1,
            boxShadow: "0 12px 30px rgba(108,0,175,.25)",
          }}
        >
          {loading ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
