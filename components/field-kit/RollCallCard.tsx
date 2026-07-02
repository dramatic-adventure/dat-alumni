// components/field-kit/RollCallCard.tsx
//
// Slice 5 — the Roll Call check-in card, INLINE on Today (Jesse's decision:
// zero navigation; the push notification just deep-links to /field-kit).
// Ported from the mockup roll-call/RollCall.tsx check-in block, narrowed to the
// spec's two states: "I'm here" / "Need help". One tap answers OPTIMISTICALLY —
// the write queues offline through lib/opsQueue/opsSync and the card shows the
// kit's standing "saved on this device" language while unsynced.
//
// Headcounts render ONLY for leaders (staff + road managers/directors), via the
// gated LeaderRollCallBoard; other artists see just their own status.
// The card's shared state (open/closed/label) rides the itinerary payload, so
// it works offline and updates via LiveRefresh like everything else on Today.

"use client";

import { T, FONT } from "@/components/field-kit/tokens";
import { useOpsAction } from "@/components/field-kit/useOpsAction";
import { LeaderRollCallBoard } from "@/components/field-kit/LeaderBoards";
import type { RollCallState, RollCallStatus } from "@/lib/programItinerary";

const STATUS_META: Record<RollCallStatus, { label: string; color: string; fg: string }> = {
  here: { label: "I'm here", color: T.green, fg: "#fff" },
  "needs-help": { label: "Need help", color: T.pink, fg: "#fff" },
};

export default function RollCallCard({
  rollCall,
  serverMyStatus,
  isLeader,
}: {
  rollCall: RollCallState;
  serverMyStatus: RollCallStatus | "";
  isLeader: boolean;
}) {
  const { value, act, queueState, failedError } = useOpsAction("roll-call", rollCall.id, serverMyStatus);
  const open = !rollCall.closedAt;
  const mine = (value === "here" || value === "needs-help" ? value : "") as RollCallStatus | "";

  // A closed roll call the artist never answered: nothing actionable — hide.
  if (!open && !mine) return null;

  return (
    <section
      aria-label="Roll call"
      style={{
        margin: "16px auto 0",
        maxWidth: 560,
        padding: "0 clamp(14px, 4vw, 40px)",
      }}
    >
      <div
        style={{
          padding: "13px 15px",
          borderRadius: 14,
          border: `1px solid ${T.border}`,
          borderLeft: `4px solid ${T.teal}`,
          backgroundColor: T.card,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span
            style={{
              fontFamily: FONT.grotesk,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: T.teal,
            }}
          >
            Roll call
          </span>
          <span
            style={{
              marginLeft: "auto",
              fontFamily: FONT.grotesk,
              fontSize: 7.5,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#fff",
              backgroundColor: open ? T.green : T.muted,
              padding: "2px 7px",
              borderRadius: 4,
            }}
          >
            {open ? "Open" : "Closed"}
          </span>
        </div>

        {rollCall.label && (
          <p style={{ fontFamily: FONT.dm, fontWeight: 700, fontSize: 14.5, color: T.ink, margin: "0 0 10px", lineHeight: 1.35 }}>
            {rollCall.label}
          </p>
        )}

        {open && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
            {(Object.keys(STATUS_META) as RollCallStatus[]).map((s) => {
              const meta = STATUS_META[s];
              const active = mine === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => act(s)}
                  aria-pressed={active}
                  style={{
                    cursor: "pointer",
                    textAlign: "center",
                    fontFamily: FONT.grotesk,
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: active ? meta.fg : T.ink,
                    backgroundColor: active ? meta.color : "rgba(246,239,227,0.06)",
                    border: `1.5px solid ${active ? meta.color : T.border}`,
                    padding: "13px 8px",
                    borderRadius: 10,
                    boxShadow: active ? `0 6px 16px ${meta.color}55` : "none",
                  }}
                >
                  {meta.label}
                </button>
              );
            })}
          </div>
        )}

        {mine && queueState !== "failed" && (
          <p style={{ fontFamily: FONT.dm, fontSize: 11.5, color: T.green, margin: 0, lineHeight: 1.4 }}>
            ✓ You answered <strong>{STATUS_META[mine].label}</strong>
            {queueState === "queued" && " — saved on this device, syncs when signal returns."}
            {queueState === "idle" && !open && " before this roll call closed."}
          </p>
        )}
        {queueState === "failed" && (
          <p style={{ fontFamily: FONT.dm, fontSize: 11.5, color: T.pink, margin: 0, lineHeight: 1.4 }}>
            Your answer is saved on this device but couldn&rsquo;t sync
            {failedError ? ` (${failedError})` : ""} — tell a road manager in person.
          </p>
        )}

        <p style={{ fontFamily: FONT.dm, fontStyle: "italic", fontSize: 10.5, color: T.muted, margin: "8px 0 0", textAlign: "center" }}>
          We move together. We take care of each other.
        </p>

        {isLeader && <LeaderRollCallBoard rollCallId={rollCall.id} />}
      </div>
    </section>
  );
}
