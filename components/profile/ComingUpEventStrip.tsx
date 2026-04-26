// components/profile/ComingUpEventStrip.tsx
"use client";

export interface ComingUpEvent {
  title: string;
  link?: string;
  date?: string;
  expiresAt?: string;
  description?: string;
}

interface Props {
  upcomingEvent?: ComingUpEvent;
}

function isExpired(date?: string, expiresAt?: string): boolean {
  const boundary = (expiresAt || "").trim() || (date || "").trim();
  if (!boundary) return false;
  const t = new Date();
  const today = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
  return today > boundary;
}

function formatDate(dateStr?: string): string | null {
  if (!dateStr) return null;
  const parts = dateStr.trim().split("-");
  if (parts.length !== 3) return null;
  const [y, m, d] = parts.map(Number);
  const dt = new Date(y, m - 1, d);
  if (isNaN(dt.getTime())) return null;
  return dt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default function ComingUpEventStrip({ upcomingEvent }: Props) {
  if (!upcomingEvent?.title?.trim()) return null;
  if (isExpired(upcomingEvent.date, upcomingEvent.expiresAt)) return null;

  const formattedDate = formatDate(upcomingEvent.date);

  return (
    <div
      style={{
        position: "relative",
        backgroundColor: "#1D1A24",
        borderTop: "3px solid #C4A35A",
        fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "1.5rem 2.5rem" }}>
        {/* Eyebrow */}
        <div
          style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "0.68rem",
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#9B89B4",
            marginBottom: "0.5rem",
          }}
        >
          Coming Up
        </div>

        {formattedDate && (
          <p
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "0.78rem",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#C4A35A",
              margin: "0 0 0.4rem",
            }}
          >
            {formattedDate}
          </p>
        )}

        <h2
          style={{
            fontFamily: "var(--font-anton), system-ui, sans-serif",
            fontSize: "clamp(1.25rem, 3vw, 1.75rem)",
            lineHeight: 1.15,
            textTransform: "uppercase",
            color: "#F2ECE6",
            margin: "0 0 0.75rem",
            letterSpacing: "0.02em",
            maxWidth: "52ch",
          }}
        >
          {upcomingEvent.title}
        </h2>

        {upcomingEvent.description && (
          <p
            style={{
              fontSize: "0.93rem",
              lineHeight: 1.6,
              color: "#B8B0C0",
              margin: "0 0 1.25rem",
              maxWidth: "56ch",
            }}
          >
            {upcomingEvent.description}
          </p>
        )}

        {upcomingEvent.link && (
          <a
            href={upcomingEvent.link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "0.75rem",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#1D1A24",
              backgroundColor: "#C4A35A",
              textDecoration: "none",
              padding: "0.55rem 1.1rem",
              borderRadius: "6px",
            }}
          >
            View Event →
          </a>
        )}
      </div>
    </div>
  );
}
