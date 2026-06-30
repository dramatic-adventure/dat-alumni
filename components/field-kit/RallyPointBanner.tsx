// components/field-kit/RallyPointBanner.tsx
//
// Slice 3 (Notifications) — the artist-facing display of the CURRENT rally point.
// Presentational only (no client interactivity; acknowledgements are deferred).
// Rendered on the Today home (app/field-kit/page.tsx). The data rides the
// itinerary payload (lib/loadProgram), so it's also part of the offline snapshot.

import { MapPin, Eye, Clock, LogOut } from "lucide-react";
import type { RallyPoint } from "@/lib/programItinerary";
import { T, FONT } from "@/components/field-kit/tokens";

function Line({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
      <span aria-hidden style={{ color: T.pink, flexShrink: 0, transform: "translateY(2px)" }}>
        {icon}
      </span>
      <span style={{ minWidth: 0 }}>
        <span
          style={{
            fontFamily: FONT.grotesk,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: T.muted,
            marginRight: 8,
          }}
        >
          {label}
        </span>
        <span style={{ fontFamily: FONT.dm, fontSize: 14, color: T.ink }}>{value}</span>
      </span>
    </div>
  );
}

export default function RallyPointBanner({ rally }: { rally: RallyPoint }) {
  return (
    <section
      aria-label="Rally point"
      style={{
        margin: "16px clamp(14px, 4vw, 24px) 0",
        padding: "14px 16px",
        borderRadius: 14,
        border: `1px solid ${T.pink}`,
        backgroundColor: "rgba(255,64,103,0.08)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span
          style={{
            fontFamily: FONT.grotesk,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: T.pink,
          }}
        >
          Rally point
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        <Line icon={<MapPin size={15} />} label="Where" value={rally.location} />
        <Line icon={<Eye size={15} />} label="Look for" value={rally.lookFor} />
        <Line icon={<Clock size={15} />} label="Meet by" value={rally.meetTime} />
        <Line icon={<LogOut size={15} />} label="Departs" value={rally.departure} />
      </div>
    </section>
  );
}
