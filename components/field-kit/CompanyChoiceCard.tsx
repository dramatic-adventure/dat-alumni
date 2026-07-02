// components/field-kit/CompanyChoiceCard.tsx
//
// Slice 5 — the Company Choice vote card, INLINE on Today (Jesse's decision:
// the question "pops up" on Home with a push; no separate screen). Ported from
// the mockup's Shell tile + AdminFieldOps vote-bar section, on the artist side.
//
// Voting is OPTIMISTIC and offline-queued (lib/opsQueue/opsSync); an artist can
// change their answer until the question closes. Results are visibility-gated
// per question (Jesse, 2026-07-02): live tallies are never shown to artists in
// any mode — after close, "public" shows the full breakdown, "result-only"
// shows just the announced outcome, "private" shows neither. Leaders (staff +
// road managers/directors) additionally get the live LeaderChoiceBoard.

"use client";

import { T, FONT } from "@/components/field-kit/tokens";
import { useOpsAction } from "@/components/field-kit/useOpsAction";
import { LeaderChoiceBoard } from "@/components/field-kit/LeaderBoards";
import type { CompanyChoiceState } from "@/lib/programItinerary";

export default function CompanyChoiceCard({
  choice,
  serverMySelection,
  isLeader,
}: {
  choice: CompanyChoiceState;
  serverMySelection: string;
  isLeader: boolean;
}) {
  const { value, act, queueState, failedError } = useOpsAction("vote", choice.id, serverMySelection);
  const open = !choice.closedAt;

  // A closed private question the artist never engaged with: nothing to show.
  if (!open && choice.resultsVisibility === "private" && !value) return null;

  return (
    <section
      aria-label="Company choice"
      style={{ margin: "16px auto 0", maxWidth: 560, padding: "0 clamp(14px, 4vw, 40px)" }}
    >
      <div
        style={{
          padding: "13px 15px",
          borderRadius: 14,
          border: `1px solid ${T.border}`,
          borderLeft: `4px solid ${T.grape}`,
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
              color: T.grape,
            }}
          >
            Company choice
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

        <p style={{ fontFamily: FONT.dm, fontWeight: 700, fontSize: 15, color: T.ink, margin: "0 0 2px", lineHeight: 1.35 }}>
          {choice.question}
        </p>
        {open && choice.deadline && (
          <p style={{ fontFamily: FONT.dm, fontSize: 11.5, color: T.muted, margin: "0 0 10px" }}>
            Vote by <strong style={{ color: T.pink }}>{choice.deadline}</strong>
          </p>
        )}

        {open && (
          <div style={{ display: "flex", flexDirection: "column", gap: 7, margin: "8px 0" }}>
            {choice.choices.map((c) => {
              const active = value === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => act(c)}
                  aria-pressed={active}
                  style={{
                    cursor: "pointer",
                    textAlign: "left",
                    fontFamily: FONT.dm,
                    fontSize: 13.5,
                    fontWeight: active ? 700 : 400,
                    color: active ? "#fff" : T.ink,
                    backgroundColor: active ? T.grape : "rgba(246,239,227,0.06)",
                    border: `1.5px solid ${active ? T.grape : T.border}`,
                    padding: "11px 13px",
                    borderRadius: 10,
                    boxShadow: active ? `0 6px 16px ${T.grape}55` : "none",
                    lineHeight: 1.35,
                  }}
                >
                  {c}
                </button>
              );
            })}
          </div>
        )}

        {open && value && queueState !== "failed" && (
          <p style={{ fontFamily: FONT.dm, fontSize: 11.5, color: T.green, margin: 0, lineHeight: 1.4 }}>
            ✓ Your choice is in{queueState === "queued" && " — saved on this device, syncs when signal returns"}.
            You can change it until voting closes.
          </p>
        )}
        {queueState === "failed" && (
          <p style={{ fontFamily: FONT.dm, fontSize: 11.5, color: T.pink, margin: 0, lineHeight: 1.4 }}>
            {failedError && /closed/i.test(failedError)
              ? "Voting closed before your choice could sync — no shame, it happens in the field."
              : `Your choice is saved on this device but couldn't sync${failedError ? ` (${failedError})` : ""}.`}
          </p>
        )}

        {!open && <ClosedResults choice={choice} mySelection={value} />}

        {isLeader && open && <LeaderChoiceBoard choiceSetId={choice.id} />}
      </div>
    </section>
  );
}

// What artists see once voting has closed, per the question's visibility.
function ClosedResults({ choice, mySelection }: { choice: CompanyChoiceState; mySelection: string }) {
  const line: React.CSSProperties = {
    fontFamily: FONT.dm,
    fontSize: 12.5,
    lineHeight: 1.45,
    color: T.ink,
    margin: "6px 0 0",
  };

  if (choice.resultsVisibility === "public" && choice.results) {
    const max = Math.max(...choice.results.map((r) => r.votes), 1);
    return (
      <div style={{ marginTop: 8 }}>
        {choice.outcome && (
          <p style={{ ...line, fontWeight: 700, margin: "0 0 8px" }}>
            The company chose: <span style={{ color: T.grape }}>{choice.outcome}</span>
          </p>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {choice.results.map((r) => {
            const isOutcome = choice.outcome === r.choice;
            return (
              <div key={r.choice}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
                  <span style={{ fontFamily: FONT.dm, fontSize: 12.5, color: T.ink, fontWeight: isOutcome ? 700 : 400 }}>
                    {r.choice}
                    {mySelection === r.choice && (
                      <span style={{ color: T.muted, fontSize: 11 }}> · your vote</span>
                    )}
                  </span>
                  <span style={{ fontFamily: FONT.grotesk, fontSize: 10.5, fontWeight: 700, color: isOutcome ? T.grape : T.muted, marginLeft: 8, flexShrink: 0 }}>
                    {r.votes}
                  </span>
                </div>
                <div style={{ height: 4, borderRadius: 2, backgroundColor: "rgba(246,239,227,0.10)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(r.votes / max) * 100}%`, borderRadius: 2, backgroundColor: isOutcome ? T.grape : T.teal }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (choice.resultsVisibility === "result-only" && choice.outcome) {
    return (
      <p style={{ ...line, fontWeight: 700 }}>
        The company chose: <span style={{ color: T.grape }}>{choice.outcome}</span>
      </p>
    );
  }

  return <p style={{ ...line, color: T.muted }}>Voting closed — the road team will take it from here.</p>;
}
