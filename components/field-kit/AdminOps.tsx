// components/field-kit/AdminOps.tsx
//
// Slice 5 — the staff-console Roll Call + Company Choice sections, ported from
// the mockup's admin/AdminFieldOps.tsx (roll-call board + vote-bar section)
// onto the real gated APIs. Rendered inside AdminConsole; assumes the page
// already gated admin access server-side.
//
// Both sections refresh their boards from the leader-gated GET endpoints after
// every action; posting/opening pushes the roster via the admin POST routes
// (the notification piggyback — no second channel).

"use client";

import { useCallback, useEffect, useState } from "react";
import { ClipboardCheck, Vote, Loader2 } from "lucide-react";
import { T, FONT } from "@/components/field-kit/tokens";
import { label, field, primaryBtn, smallBtn, card, sectionTitle, sectionHint } from "@/components/field-kit/adminStyles";
import type { RollCallState, RollCallStatus, CompanyChoiceVisibility } from "@/lib/programItinerary";

// The board shapes returned by the leader-gated GET endpoints.
export type RollCallBoard = {
  rollCall: RollCallState;
  counts: { here: number; needsHelp: number; responded: number; total: number };
  responded: { slug: string; name: string; status: RollCallStatus; respondedAt: string }[];
  notResponded: { slug: string; name: string }[];
};

export type ChoiceBoard = {
  choice: {
    id: string;
    question: string;
    choices: string[];
    deadline: string;
    resultsVisibility: CompanyChoiceVisibility;
    outcome: string;
    postedAt: string;
    closedAt: string;
  };
  tallies: { choice: string; votes: number }[];
  votedCount: number;
  total: number;
  notVoted: { slug: string; name: string }[];
};

export type AdminRollCallInitial = RollCallBoard;
export type AdminChoiceInitial = ChoiceBoard;

const VISIBILITY_OPTIONS: { id: CompanyChoiceVisibility; label: string; note: string }[] = [
  { id: "private", label: "Private", note: "Staff & road team only — artists never see results" },
  { id: "result-only", label: "Result only", note: "Artists see the announced result after close" },
  { id: "public", label: "Public", note: "Artists see the full breakdown after close" },
];

const boardLine: React.CSSProperties = {
  fontFamily: FONT.dm,
  fontSize: 12.5,
  lineHeight: 1.45,
  color: T.ink,
  margin: "0 0 4px",
};

function firstNames(list: { name: string }[]): string {
  return list.map((m) => m.name.split(" ")[0]).join(", ");
}

// Auto-refresh an active board every 15s (visible tab + online only) so artist
// responses land on the console without tapping Refresh. The manual button
// stays as an immediate override.
const BOARD_POLL_MS = 15_000;

function useBoardPoll(activeId: string | null, refresh: (id: string) => Promise<void>) {
  useEffect(() => {
    if (!activeId) return;
    let pollId: ReturnType<typeof setInterval> | undefined;
    const tick = () => {
      if (typeof navigator !== "undefined" && !navigator.onLine) return;
      refresh(activeId);
    };
    const startPoll = () => {
      if (pollId == null) pollId = setInterval(tick, BOARD_POLL_MS);
    };
    const stopPoll = () => {
      if (pollId != null) {
        clearInterval(pollId);
        pollId = undefined;
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        tick();
        startPoll();
      } else {
        stopPoll();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("online", tick);
    if (document.visibilityState === "visible") startPoll();
    return () => {
      stopPoll();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("online", tick);
    };
  }, [activeId, refresh]);
}

async function postJson(url: string, body: Record<string, unknown>) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => null)) as
    | { ok?: boolean; sent?: number; total?: number; sendError?: string; error?: string }
    | null;
  return { ok: res.ok && !!data?.ok, data };
}

// ── Roll Call ─────────────────────────────────────────────────────────────────

export function AdminRollCallSection({
  programId,
  initial,
  todayDayId,
  flash,
}: {
  programId: string;
  initial: AdminRollCallInitial | null;
  todayDayId: string;
  flash: (msg: string) => void;
}) {
  const [board, setBoard] = useState<RollCallBoard | null>(initial);
  const [labelText, setLabelText] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/field-kit/roll-call?id=${encodeURIComponent(id)}`, {
          cache: "no-store",
        });
        if (res.ok) setBoard((await res.json()) as RollCallBoard);
      } catch {
        /* keep the current board */
      }
    },
    []
  );

  const open = useCallback(async () => {
    if (!labelText.trim() || busy) return;
    setBusy(true);
    try {
      const { ok, data } = await postJson("/api/field-kit/admin/roll-call", {
        program: programId,
        action: "open",
        label: labelText.trim(),
        dayId: todayDayId,
      });
      if (!ok) {
        flash(data?.error || "Could not open roll call");
        return;
      }
      setLabelText("");
      flash(
        data?.sendError
          ? `Roll call opened, but push failed: ${data.sendError}`
          : `Roll call opened · pushed to ${data?.sent ?? 0} of ${data?.total ?? 0} devices`
      );
      const rc = (data as unknown as { rollCall?: RollCallState }).rollCall;
      if (rc?.id) await refresh(rc.id);
    } finally {
      setBusy(false);
    }
  }, [labelText, busy, programId, todayDayId, flash, refresh]);

  const close = useCallback(async () => {
    if (!board || busy) return;
    setBusy(true);
    try {
      const { ok, data } = await postJson("/api/field-kit/admin/roll-call", {
        program: programId,
        action: "close",
        id: board.rollCall.id,
      });
      if (!ok) {
        flash(data?.error || "Could not close roll call");
        return;
      }
      flash("Roll call closed");
      await refresh(board.rollCall.id);
    } finally {
      setBusy(false);
    }
  }, [board, busy, programId, flash, refresh]);

  const active = board && !board.rollCall.closedAt;
  const needsHelp = board?.responded.filter((r) => r.status === "needs-help") ?? [];

  // Live board: check-ins stream in every 15s while the roll call is open.
  useBoardPoll(active ? board.rollCall.id : null, refresh);

  return (
    <section style={card}>
      <h2 style={sectionTitle}>
        <ClipboardCheck size={18} aria-hidden /> Roll call
      </h2>
      <p style={sectionHint}>
        A one-tap headcount for high-stakes movements. Opening pushes everyone a check-in nudge;
        &ldquo;need help&rdquo; answers alert staff and road managers immediately.
      </p>

      {active && board ? (
        <>
          <p style={{ ...boardLine, fontWeight: 700 }}>{board.rollCall.label}</p>
          <p style={boardLine}>
            <strong>
              {board.counts.here} of {board.counts.total} here
            </strong>
            {board.notResponded.length > 0 && ` · ${board.notResponded.length} not checked in`}
          </p>
          {needsHelp.length > 0 && (
            <p style={{ ...boardLine, color: T.pink, fontWeight: 700 }}>
              Needs help: {firstNames(needsHelp)}
            </p>
          )}
          {board.notResponded.length > 0 && (
            <p style={{ ...boardLine, color: T.muted }}>Waiting on: {firstNames(board.notResponded)}</p>
          )}
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button type="button" style={smallBtn} onClick={() => refresh(board.rollCall.id)}>
              Refresh
            </button>
            <button
              type="button"
              style={{ ...smallBtn, color: T.pink, borderColor: T.pink }}
              onClick={close}
              disabled={busy}
            >
              {busy ? "Closing…" : "Close roll call"}
            </button>
          </div>
        </>
      ) : (
        <>
          {board && board.rollCall.closedAt && (
            <p style={{ ...boardLine, color: T.muted, marginBottom: 10 }}>
              Last roll call &ldquo;{board.rollCall.label}&rdquo; closed — {board.counts.here} of{" "}
              {board.counts.total} checked in here.
            </p>
          )}
          <label style={label} htmlFor="rc-label">
            What&rsquo;s moving
          </label>
          <input
            id="rc-label"
            style={field}
            value={labelText}
            onChange={(e) => setLabelText(e.target.value)}
            placeholder="Bus to Košice — departs 3:45pm"
            maxLength={120}
          />
          <button
            type="button"
            style={{ ...primaryBtn, opacity: labelText.trim() && !busy ? 1 : 0.5 }}
            onClick={open}
            disabled={!labelText.trim() || busy}
          >
            {busy ? <Loader2 size={15} className="spin" aria-hidden /> : <ClipboardCheck size={15} aria-hidden />}
            {busy ? "Opening…" : "Open roll call & notify"}
          </button>
        </>
      )}
    </section>
  );
}

// ── Company Choice ────────────────────────────────────────────────────────────

export function AdminCompanyChoiceSection({
  programId,
  initial,
  flash,
}: {
  programId: string;
  initial: AdminChoiceInitial | null;
  flash: (msg: string) => void;
}) {
  const [board, setBoard] = useState<ChoiceBoard | null>(initial);
  const [question, setQuestion] = useState("");
  const [choicesText, setChoicesText] = useState("");
  const [deadline, setDeadline] = useState("");
  const [visibility, setVisibility] = useState<CompanyChoiceVisibility>("private"); // Jesse's default
  const [outcome, setOutcome] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/field-kit/company-choice?id=${encodeURIComponent(id)}`, {
        cache: "no-store",
      });
      if (res.ok) setBoard((await res.json()) as ChoiceBoard);
    } catch {
      /* keep the current board */
    }
  }, []);

  const post = useCallback(async () => {
    const choices = choicesText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!question.trim() || choices.length < 2 || busy) return;
    setBusy(true);
    try {
      const { ok, data } = await postJson("/api/field-kit/admin/company-choice", {
        program: programId,
        action: "post",
        question: question.trim(),
        choices,
        deadline: deadline.trim(),
        resultsVisibility: visibility,
      });
      if (!ok) {
        flash(data?.error || "Could not post the question");
        return;
      }
      setQuestion("");
      setChoicesText("");
      setDeadline("");
      flash(
        data?.sendError
          ? `Question posted, but push failed: ${data.sendError}`
          : `Question posted · pushed to ${data?.sent ?? 0} of ${data?.total ?? 0} devices`
      );
      const posted = (data as unknown as { choice?: { id: string } }).choice;
      if (posted?.id) await refresh(posted.id);
    } finally {
      setBusy(false);
    }
  }, [question, choicesText, deadline, visibility, busy, programId, flash, refresh]);

  const close = useCallback(async () => {
    if (!board || busy) return;
    setBusy(true);
    try {
      const { ok, data } = await postJson("/api/field-kit/admin/company-choice", {
        program: programId,
        action: "close",
        id: board.choice.id,
        ...(outcome.trim() ? { outcome: outcome.trim() } : {}),
      });
      if (!ok) {
        flash(data?.error || "Could not close the question");
        return;
      }
      setOutcome("");
      flash("Voting closed");
      await refresh(board.choice.id);
    } finally {
      setBusy(false);
    }
  }, [board, busy, outcome, programId, flash, refresh]);

  const activeBoard = board && !board.choice.closedAt;

  // Live board: votes stream in every 15s while voting is open.
  useBoardPoll(activeBoard ? board.choice.id : null, refresh);

  const max = board ? Math.max(...board.tallies.map((t) => t.votes), 1) : 1;
  const leading = board ? [...board.tallies].sort((a, b) => b.votes - a.votes)[0] : undefined;

  return (
    <section style={card}>
      <h2 style={sectionTitle}>
        <Vote size={18} aria-hidden /> Company choice
      </h2>
      <p style={sectionHint}>
        One quick group decision at a time. Posting pushes everyone a vote nudge; artists see
        results per the visibility you pick — never live tallies.
      </p>

      {activeBoard && board ? (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
            <p style={{ ...boardLine, fontWeight: 700, margin: 0 }}>{board.choice.question}</p>
            {board.choice.deadline && (
              <span style={{ fontFamily: FONT.dm, fontSize: 10.5, color: T.muted, flexShrink: 0 }}>
                By {board.choice.deadline}
              </span>
            )}
          </div>
          <p style={{ ...boardLine, color: T.muted, marginBottom: 10 }}>
            {VISIBILITY_OPTIONS.find((v) => v.id === board.choice.resultsVisibility)?.label} ·{" "}
            {board.votedCount} of {board.total} answered
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
            {board.tallies.map((t) => {
              const isLeading = leading && t.choice === leading.choice && t.votes > 0;
              return (
                <div key={t.choice}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                    <span style={{ fontFamily: FONT.dm, fontSize: 12.5, color: T.ink, fontWeight: isLeading ? 700 : 400, lineHeight: 1.3 }}>
                      {t.choice}
                    </span>
                    <span style={{ fontFamily: FONT.grotesk, fontSize: 10.5, fontWeight: 700, color: isLeading ? T.grape : T.muted, flexShrink: 0, marginLeft: 8 }}>
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

          {board.notVoted.length > 0 && (
            <p style={{ ...boardLine, color: T.muted, marginBottom: 10 }}>
              Not yet answered ({board.notVoted.length}): {firstNames(board.notVoted)}
            </p>
          )}

          <label style={label} htmlFor="cc-outcome">
            Announced result (optional — blank uses the top vote)
          </label>
          <input
            id="cc-outcome"
            style={field}
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            placeholder={leading && leading.votes > 0 ? leading.choice : "Your call"}
            maxLength={120}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" style={smallBtn} onClick={() => refresh(board.choice.id)}>
              Refresh
            </button>
            <button
              type="button"
              style={{ ...smallBtn, color: T.pink, borderColor: T.pink }}
              onClick={close}
              disabled={busy}
            >
              {busy ? "Closing…" : "Close voting"}
            </button>
          </div>
        </>
      ) : (
        <>
          {board && board.choice.closedAt && (
            <p style={{ ...boardLine, color: T.muted, marginBottom: 10 }}>
              Last question &ldquo;{board.choice.question}&rdquo; closed with {board.votedCount} of{" "}
              {board.total} voting.
            </p>
          )}
          <label style={label} htmlFor="cc-question">
            Question
          </label>
          <input
            id="cc-question"
            style={field}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Free afternoon: castle hike or thermal baths?"
            maxLength={160}
          />
          <label style={label} htmlFor="cc-choices">
            Choices (one per line)
          </label>
          <textarea
            id="cc-choices"
            style={{ ...field, minHeight: 72, resize: "vertical" }}
            value={choicesText}
            onChange={(e) => setChoicesText(e.target.value)}
            placeholder={"Castle hike\nThermal baths"}
            maxLength={600}
          />
          <label style={label} htmlFor="cc-deadline">
            Vote by
          </label>
          <input
            id="cc-deadline"
            style={field}
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            placeholder="Tonight 8pm"
            maxLength={60}
          />
          <span style={label}>Results visibility</span>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 4 }} role="radiogroup" aria-label="Results visibility">
            {VISIBILITY_OPTIONS.map((v) => {
              const on = visibility === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setVisibility(v.id)}
                  style={{
                    fontFamily: FONT.grotesk,
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                    border: `1px solid ${on ? T.grape : T.border}`,
                    backgroundColor: on ? "rgba(160,111,209,0.12)" : "transparent",
                    color: on ? T.grape : T.muted,
                    padding: "6px 10px",
                    borderRadius: 6,
                    cursor: "pointer",
                  }}
                >
                  {v.label}
                </button>
              );
            })}
          </div>
          <p style={{ ...sectionHint, margin: "0 0 12px" }}>
            {VISIBILITY_OPTIONS.find((v) => v.id === visibility)?.note}
          </p>
          <button
            type="button"
            style={{
              ...primaryBtn,
              opacity:
                question.trim() && choicesText.split("\n").filter((s) => s.trim()).length >= 2 && !busy
                  ? 1
                  : 0.5,
            }}
            onClick={post}
            disabled={
              !question.trim() || choicesText.split("\n").filter((s) => s.trim()).length < 2 || busy
            }
          >
            {busy ? <Loader2 size={15} className="spin" aria-hidden /> : <Vote size={15} aria-hidden />}
            {busy ? "Posting…" : "Post question & notify"}
          </button>
        </>
      )}
    </section>
  );
}
