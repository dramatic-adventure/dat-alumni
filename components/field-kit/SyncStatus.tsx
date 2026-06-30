// components/field-kit/SyncStatus.tsx
//
// Field Kit connectivity + sync indicator for the top bar.
//
// Reports REAL connectivity (navigator.onLine) AND the live capture-queue state.
// Slice C wired the offline queue: captures land in IndexedDB first, then the
// drainer (lib/captureSync) syncs them. This component drives that drainer —
// start() on mount (which also wires online/visibility triggers) — and subscribes
// to its counts. While captures are unsynced it shows a tap-to-sync chip; that
// count is the user's only feedback until the items reach the server (Traces still
// reads the server, so an unsynced capture won't appear there yet).

"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { T, FONT } from "@/components/field-kit/tokens";
import { start, kick, retryFailed, subscribe, type SyncCounts } from "@/lib/captureSync";
import { getSnapshot, onSnapshotChange } from "@/lib/itinerarySnapshot";
import { formatRelativeTime } from "@/lib/relativeTime";

const LABEL: CSSProperties = {
  fontFamily: FONT.grotesk,
  fontSize: 8.5,
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
};

export default function SyncStatus({ programId }: { programId: string }) {
  const [online, setOnline] = useState(true);
  const [counts, setCounts] = useState<SyncCounts>({ pending: 0, failed: 0 });
  // Last itinerary sync time (epoch ms); null until a real sync has occurred.
  const [syncedAt, setSyncedAt] = useState<number | null>(null);
  // Bumped on a timer to re-tick the relative "Xm ago" label.
  const [, setTick] = useState(0);

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

  // Drive the drainer: start() wires the online/visibility triggers (idempotent)
  // and primes the counts we subscribe to.
  useEffect(() => {
    start();
    return subscribe(setCounts);
  }, []);

  // Surface the itinerary snapshot's last-synced time. Read on mount, refresh on
  // every snapshot write (fetchItinerary → putSnapshot fires onSnapshotChange),
  // and re-tick the relative label on a light interval.
  useEffect(() => {
    let alive = true;
    const read = () => {
      getSnapshot(programId).then((s) => {
        if (alive) setSyncedAt(s?.syncedAt ?? null);
      });
    };
    read();
    const unsub = onSnapshotChange(read);
    const id = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => {
      alive = false;
      unsub();
      clearInterval(id);
    };
  }, [programId]);

  const { pending, failed } = counts;

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
      <span
        title={online ? "Online — data loads live" : "Offline — captures queue locally"}
        style={{ ...LABEL, display: "inline-flex", alignItems: "center", gap: 6, color: "rgba(246,239,227,0.6)" }}
      >
        <span
          aria-hidden
          style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: online ? T.green : T.pink, flexShrink: 0 }}
        />
        {online ? "Online" : "Offline"}
      </span>

      {/* Itinerary last-synced — shown only once a real sync has occurred. */}
      {syncedAt != null && (
        <span
          title={online ? "Itinerary synced from live data" : "Offline — showing last synced itinerary"}
          style={{ ...LABEL, display: "inline-flex", alignItems: "center", gap: 6, color: "rgba(246,239,227,0.6)" }}
        >
          {online
            ? `synced ${formatRelativeTime(syncedAt)}`
            : `last synced ${formatRelativeTime(syncedAt)}`}
        </span>
      )}

      {(pending > 0 || failed > 0) && (
        <button
          type="button"
          onClick={() => (failed > 0 ? retryFailed() : kick())}
          title={failed > 0 ? "Retry failed captures" : "Sync now"}
          style={{
            ...LABEL,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            cursor: "pointer",
            border: "none",
            background: "transparent",
            padding: 0,
            color: failed > 0 ? T.pink : T.yellow,
          }}
        >
          <span
            aria-hidden
            style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: failed > 0 ? T.pink : T.yellow, flexShrink: 0 }}
          />
          {pending > 0 ? `${pending} to sync` : null}
          {pending > 0 && failed > 0 ? " · " : null}
          {failed > 0 ? `${failed} failed` : null}
        </button>
      )}
    </span>
  );
}
