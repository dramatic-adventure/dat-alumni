// components/field-kit/OutboxBanner.tsx
//
// Unmissable outbox state for the Field Kit.
//
// WHY THIS EXISTS: on iOS there is NO background upload path. Safari has never
// shipped the Background Sync API (no SyncManager on iOS/iPadOS/macOS, and
// WebKit has published no position on the spec), so lib/captureSync's drain
// loop only runs while this page is open AND foregrounded. Lock the phone or
// switch apps and iOS suspends the page and kills any in-flight fetch; close
// the tab and the queue simply sits there forever, on any connection.
//
// The only signal the artist had was SyncStatus's 8.5px chip in the top bar —
// easy to miss, and it never said the one thing that actually matters: KEEP
// THIS SCREEN OPEN. Captures were being made in the field, the app got
// backgrounded, and nobody knew anything was stranded until weeks later.
//
// So this is deliberately loud: it takes real estate directly under the top
// bar whenever anything is unsent, states the constraint in plain language,
// and gives a full-width Sync now button. It renders NOTHING when the outbox
// is empty, so the normal state is untouched.
//
// Deliberately NOT duplicated here: the wake lock (SyncStatus already holds it
// via useSyncWakeLock whenever pending > 0) and the drain logic itself. This
// component only observes the three drainers and drives their public kick/
// retry entry points.

"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { T, FONT } from "@/components/field-kit/tokens";
import { start, kick, retryFailed, subscribe, type SyncCounts } from "@/lib/captureSync";
import {
  start as startOps,
  kick as kickOps,
  retryFailed as retryFailedOps,
  subscribe as subscribeOps,
  type OpsSyncCounts,
} from "@/lib/opsSync";
import {
  start as startTraceMutations,
  kick as kickTraceMutations,
  retryFailed as retryFailedTraceMutations,
  subscribe as subscribeTraceMutations,
  type TraceMutationSyncCounts,
} from "@/lib/traceMutationSync";

export default function OutboxBanner() {
  const [counts, setCounts] = useState<SyncCounts>({ pending: 0, failed: 0 });
  const [opsCounts, setOpsCounts] = useState<OpsSyncCounts>({ pending: 0, failed: 0 });
  const [traceCounts, setTraceCounts] = useState<TraceMutationSyncCounts>({ pending: 0, failed: 0 });
  const [online, setOnline] = useState(true);

  // start() is idempotent (SyncStatus calls it too) — calling it here means the
  // banner still works on any future page that mounts it without the top bar.
  useEffect(() => {
    start();
    startOps();
    startTraceMutations();
    const unsubCaptures = subscribe(setCounts);
    const unsubOps = subscribeOps(setOpsCounts);
    const unsubTrace = subscribeTraceMutations(setTraceCounts);
    return () => {
      unsubCaptures();
      unsubOps();
      unsubTrace();
    };
  }, []);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  const pending = counts.pending + opsCounts.pending + traceCounts.pending;
  const failed = counts.failed + opsCounts.failed + traceCounts.failed;
  const total = pending + failed;

  // Last line of defence: closing the tab with work still queued is the exact
  // moment the upload dies. Browsers show their own generic copy here (ours is
  // ignored by design) and iOS Safari honours this inconsistently — but when it
  // does fire it's the difference between a stranded capture and a synced one.
  useEffect(() => {
    if (pending === 0) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [pending]);

  if (total === 0) return null;

  const syncNow = () => {
    // retryFailed() revives failed rows and drains; kick() drains the rest.
    // Run both whenever anything has failed so a mixed queue clears in one tap.
    if (failed > 0) {
      void retryFailed();
      void retryFailedOps();
      void retryFailedTraceMutations();
    }
    kick();
    kickOps();
    kickTraceMutations();
  };

  const accent = failed > 0 ? T.pink : T.yellow;

  return (
    <div role="status" aria-live="polite" style={{ ...WRAP, borderColor: accent }}>
      <p style={{ ...EYEBROW, color: accent }}>
        {online ? "Not yet uploaded" : "Offline — waiting for signal"}
      </p>

      <h2 style={TITLE}>
        {total} {total === 1 ? "item" : "items"} still on this phone
      </h2>

      <p style={BODY}>
        {online ? (
          <>
            These haven&apos;t reached the server yet. Uploads only run while this screen is open
            and awake — <strong style={{ color: T.ink }}>keep the Field Kit in front and don&apos;t
            let the phone lock</strong> until this banner disappears. Large photos and voice notes
            can take a few minutes each.
          </>
        ) : (
          <>
            You&apos;re offline, so nothing can upload right now. Your work is safe on this device.
            Reconnect, then keep this screen open until the banner clears.
          </>
        )}
      </p>

      {failed > 0 && (
        <p style={{ ...BODY, color: T.pink, opacity: 1 }}>
          {failed} {failed === 1 ? "item" : "items"} failed a previous attempt. Tap below to try
          again — open Traces to see the exact error for each one.
        </p>
      )}

      <button type="button" onClick={syncNow} disabled={!online} style={{ ...CTA, opacity: online ? 1 : 0.45 }}>
        {failed > 0 ? "Retry & sync now" : "Sync now"}
      </button>

      <p style={FOOTNOTE}>
        {pending > 0 ? `${pending} waiting` : null}
        {pending > 0 && failed > 0 ? " · " : null}
        {failed > 0 ? `${failed} failed` : null}
      </p>
    </div>
  );
}

const WRAP: CSSProperties = {
  margin: "12px 16px 0",
  padding: "16px 18px 18px",
  backgroundColor: T.paper,
  border: "1px solid",
  borderRadius: 14,
  boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
};

const EYEBROW: CSSProperties = {
  fontFamily: FONT.grotesk,
  fontWeight: 700,
  fontSize: 10,
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  margin: "0 0 8px",
};

const TITLE: CSSProperties = {
  fontFamily: FONT.anton,
  fontSize: "clamp(19px, 4.6vw, 24px)",
  lineHeight: 1.05,
  textTransform: "uppercase",
  color: T.ink,
  margin: "0 0 10px",
};

const BODY: CSSProperties = {
  fontFamily: FONT.dm,
  fontSize: 13.5,
  lineHeight: 1.55,
  color: T.ink,
  opacity: 0.86,
  margin: "0 0 14px",
};

const CTA: CSSProperties = {
  display: "block",
  width: "100%",
  fontFamily: FONT.grotesk,
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  padding: "13px 16px",
  borderRadius: 10,
  border: "none",
  background: T.yellow,
  color: T.black,
  cursor: "pointer",
};

const FOOTNOTE: CSSProperties = {
  fontFamily: FONT.grotesk,
  fontSize: 9.5,
  fontWeight: 700,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: T.muted,
  margin: "10px 0 0",
  textAlign: "center",
};
