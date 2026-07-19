// components/field-kit/LeaderBoards.tsx
//
// Slice 5 — the LEADER-ONLY live boards that render inside the Today ops cards
// for staff + road managers/directors (never for other participants — the
// "no shame, no metrics" line). Each board fetches its leader-gated endpoint on
// mount, window focus, reconnect, and a light 30s poll while the tab is visible
// — the same trigger set LiveRefresh uses, applied to a leader-scoped read.
// Offline, the last fetched board simply stays on screen.

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { T, FONT } from "@/components/field-kit/tokens";

// 15s (was 30s): matches the staff console's board poll so road-team leaders
// see check-ins land at the same cadence.
const POLL_MS = 15_000;

function useLeaderBoard<TData>(url: string): TData | null {
  const asId = useSearchParams().get("asId")?.trim() || "";
  const [data, setData] = useState<TData | null>(null);
  const inFlight = useRef(false);

  const check = useCallback(async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const full = asId ? `${url}&asId=${encodeURIComponent(asId)}` : url;
      const res = await fetch(full, { cache: "no-store" });
      if (res.ok) setData((await res.json()) as TData);
    } catch {
      // network blip — the next focus/online/poll retries
    } finally {
      inFlight.current = false;
    }
  }, [url, asId]);

  useEffect(() => {
    let pollId: ReturnType<typeof setInterval> | undefined;
    const startPoll = () => {
      if (pollId == null) pollId = setInterval(check, POLL_MS);
    };
    const stopPoll = () => {
      if (pollId != null) {
        clearInterval(pollId);
        pollId = undefined;
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        check();
        startPoll();
      } else {
        stopPoll();
      }
    };
    const onWake = () => check();

    check();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onWake);
    window.addEventListener("online", onWake);
    if (document.visibilityState === "visible") startPoll();
    return () => {
      stopPoll();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onWake);
      window.removeEventListener("online", onWake);
    };
  }, [check]);

  return data;
}

// ── shared board styles ────────────────────────────────────────────────────────
const BOARD: React.CSSProperties = {
  marginTop: 12,
  paddingTop: 10,
  borderTop: `1px solid ${T.sep}`,
};
const KICKER: React.CSSProperties = {
  fontFamily: FONT.grotesk,
  fontSize: 8.5,
  fontWeight: 700,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: T.muted,
  margin: "0 0 6px",
};
const LINE: React.CSSProperties = {
  fontFamily: FONT.dm,
  fontSize: 12.5,
  lineHeight: 1.45,
  color: T.ink,
  margin: "0 0 4px",
};

function firstNames(list: { name: string }[]): string {
  return list.map((m) => m.name.split(" ")[0]).join(", ");
}

// ── Roll Call board ───────────────────────────────────────────────────────────

type RollCallBoard = {
  counts: { here: number; needsHelp: number; responded: number; total: number };
  responded: { slug: string; name: string; status: "here" | "needs-help"; respondedAt: string }[];
  notResponded: { slug: string; name: string }[];
};

export function LeaderRollCallBoard({ rollCallId }: { rollCallId: string }) {
  const data = useLeaderBoard<RollCallBoard>(
    `/api/field-kit/roll-call?id=${encodeURIComponent(rollCallId)}`
  );
  if (!data) return null;

  const needsHelp = data.responded.filter((r) => r.status === "needs-help");
  return (
    <div style={BOARD}>
      <p style={KICKER}>Road team view</p>
      <p style={LINE}>
        <strong>
          {data.counts.here} of {data.counts.total} here
        </strong>
        {data.notResponded.length > 0 && ` · ${data.notResponded.length} not checked in`}
      </p>
      {needsHelp.length > 0 && (
        <p style={{ ...LINE, color: T.pink, fontWeight: 700 }}>
          Needs help: {firstNames(needsHelp)}
        </p>
      )}
      {data.notResponded.length > 0 && (
        <p style={{ ...LINE, color: T.muted }}>Waiting on: {firstNames(data.notResponded)}</p>
      )}
    </div>
  );
}

// ── Company Choice board ──────────────────────────────────────────────────────

type ChoiceBoard = {
  tallies: { choice: string; votes: number }[];
  votedCount: number;
  total: number;
  notVoted: { slug: string; name: string }[];
};

export function LeaderChoiceBoard({ choiceSetId }: { choiceSetId: string }) {
  const data = useLeaderBoard<ChoiceBoard>(
    `/api/field-kit/company-choice?id=${encodeURIComponent(choiceSetId)}`
  );
  if (!data) return null;

  const max = Math.max(...data.tallies.map((t) => t.votes), 1);
  const leading = [...data.tallies].sort((a, b) => b.votes - a.votes)[0];
  return (
    <div style={BOARD}>
      <p style={KICKER}>
        Road team view · {data.votedCount} of {data.total} answered
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {data.tallies.map((t) => {
          const isLeading = leading && t.choice === leading.choice && t.votes > 0;
          return (
            <div key={t.choice}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
                <span style={{ fontFamily: FONT.dm, fontSize: 12.5, color: T.ink, fontWeight: isLeading ? 700 : 400 }}>
                  {t.choice}
                </span>
                <span style={{ fontFamily: FONT.grotesk, fontSize: 10.5, fontWeight: 700, color: isLeading ? T.grape : T.muted, marginLeft: 8, flexShrink: 0 }}>
                  {t.votes}
                </span>
              </div>
              <div style={{ height: 4, borderRadius: 2, backgroundColor: "rgba(246,239,227,0.10)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(t.votes / max) * 100}%`, borderRadius: 2, backgroundColor: isLeading ? T.grape : T.teal }} />
              </div>
            </div>
          );
        })}
      </div>
      {data.notVoted.length > 0 && (
        <p style={{ ...LINE, color: T.muted, marginTop: 8 }}>Waiting on: {firstNames(data.notVoted)}</p>
      )}
    </div>
  );
}
