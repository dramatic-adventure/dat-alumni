"use client";
export default function Toast({ msg, type }: { msg: string; type: "success" | "error" }) {
  if (!msg) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        right: 16,
        bottom: 86,
        padding: "12px 16px",
        borderRadius: 12,
        background: type === "success" ? "#2493A9" : "#F23359",
        color: "#fff",
        fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif',
        boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
        zIndex: 99999,
      }}
    >
      {msg}
    </div>
  );
}
