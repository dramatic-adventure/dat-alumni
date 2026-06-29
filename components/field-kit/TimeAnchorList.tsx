// components/field-kit/TimeAnchorList.tsx
//
// The shared baseline-aligned time gutter, ported from the V17 mockup and used
// by BOTH the Itinerary day leaf and the Today/Home screen so the two can't
// drift. Server-safe (NO "use client"): pure render of TimeAnchor props with
// inline styles. Time values arrive already display-normalized ("9:00am") by
// lib/programItinerary#formatTimeCell — do not reformat here.

import { T, FONT } from "@/components/field-kit/tokens";
import type { TimeAnchor } from "@/lib/programItinerary";

export default function TimeAnchorList({
  times,
  acc,
  isToday,
}: {
  times: TimeAnchor[];
  acc: string;
  isToday: boolean;
}) {
  return (
    <div style={{ margin: "10px 0 0" }}>
      <p style={{ fontFamily: FONT.grotesk, fontSize: 8.5, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: T.muted, margin: "0 0 6px" }}>Schedule</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {times.map((t, i) => (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "baseline", padding: "5px 0", borderTop: i > 0 ? `1px solid ${T.sep}` : "none" }}>
            <span style={{ fontFamily: FONT.grotesk, fontSize: 10, fontWeight: 700, letterSpacing: "0.04em", color: isToday && t.bold ? acc : T.muted, flexShrink: 0, width: 52 }}>
              {t.time}
            </span>
            <div style={{ flex: 1 }}>
              <span style={{ fontFamily: FONT.dm, fontSize: t.bold ? 13 : 12.5, fontWeight: t.bold ? 700 : 400, color: T.ink, opacity: isToday ? 1 : 0.85 }}>
                {t.marker && <span style={{ color: acc, fontFamily: FONT.grotesk, fontWeight: 700, marginRight: 4 }}>»</span>}
                {t.label}
              </span>
              {t.note && <p style={{ fontFamily: FONT.dm, fontStyle: "italic", fontSize: 11.5, color: T.ink, opacity: 0.58, margin: "2px 0 0" }}>{t.note}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
