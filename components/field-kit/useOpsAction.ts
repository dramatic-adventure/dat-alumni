// components/field-kit/useOpsAction.ts
//
// Slice 5 — the client half of an offline-queued ops action (Roll Call
// check-in / Company Choice vote). One hook per (kind, targetId):
//
//   value       — what this device believes it answered: the local ops-state
//                 record when one exists (this device's own action, persisted
//                 across reloads + sync), else the server-rendered value.
//   act(v)      — OPTIMISTIC: updates the UI immediately, persists the local
//                 state, enqueues the write (lib/opsQueue) and kicks the
//                 drainer (lib/opsSync). Never blocks on the network.
//   queueState  — "idle" (nothing in flight for this target), "queued"
//                 (saved on this device, syncing when signal allows), or
//                 "failed" (a permanent server rejection — e.g. voting closed
//                 before the queued vote landed) with failedError set.

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  enqueue,
  getAll,
  getOpsState,
  newOpId,
  putOpsState,
  type OpKind,
} from "@/lib/opsQueue";
import { start, kick, subscribe } from "@/lib/opsSync";

export type OpsQueueState = "idle" | "queued" | "failed";

export function useOpsAction(kind: OpKind, targetId: string, serverValue: string) {
  const asId = useSearchParams().get("asId")?.trim() || "";
  const [value, setValue] = useState(serverValue);
  const [queueState, setQueueState] = useState<OpsQueueState>("idle");
  const [failedError, setFailedError] = useState("");
  // Set the moment the user taps in THIS mounted instance — from then on,
  // neither the (possibly slower) mount-time ops-state read nor a re-rendered
  // serverValue may clobber the optimistic value.
  const acted = useRef(false);

  // This device's own persisted answer overrides the server render (the server
  // read is TTL-cached and may trail a just-synced action). Re-runs when
  // LiveRefresh re-renders the page with a fresh serverValue, so an answer
  // cast from ANOTHER device shows up here once the server knows it.
  useEffect(() => {
    let alive = true;
    getOpsState(kind, targetId).then((rec) => {
      if (!alive || acted.current) return;
      if (rec?.value) setValue(rec.value);
      else setValue(serverValue);
    });
    return () => {
      alive = false;
    };
  }, [kind, targetId, serverValue]);

  // Track queue state for THIS target: drive the drainer and re-scan on every
  // counts change (cheap — the queue holds at most a handful of items).
  useEffect(() => {
    start();
    let alive = true;
    const rescan = () => {
      getAll().then((items) => {
        if (!alive) return;
        const mine = items.filter((i) => i.kind === kind && i.targetId === targetId);
        const failed = mine.find((i) => i.status === "failed");
        if (failed) {
          setQueueState("failed");
          setFailedError(failed.lastError || "");
        } else if (mine.length) {
          setQueueState("queued");
          setFailedError("");
        } else {
          setQueueState("idle");
          setFailedError("");
        }
      });
    };
    rescan();
    const unsub = subscribe(rescan);
    return () => {
      alive = false;
      unsub();
    };
  }, [kind, targetId]);

  const act = useCallback(
    (next: string) => {
      acted.current = true;
      setValue(next); // optimistic — the tap lands instantly, connectivity or not
      setQueueState("queued");
      setFailedError("");
      void putOpsState(kind, targetId, next).catch(() => undefined);
      enqueue({
        opId: newOpId(),
        kind,
        targetId,
        value: next,
        createdAt: new Date().toISOString(),
        ...(asId ? { asId } : {}),
        status: "pending",
        attempts: 0,
      })
        .then(() => kick())
        .catch(() => {
          // The tap never reached the on-device queue (IndexedDB blocked/quota)
          // — say so instead of showing a "saved" line for a lost write.
          setQueueState("failed");
          setFailedError("Couldn't save on this device");
        });
    },
    [kind, targetId, asId]
  );

  return { value, act, queueState, failedError };
}
