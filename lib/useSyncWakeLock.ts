// lib/useSyncWakeLock.ts
//
// Holds a Screen Wake Lock while the Field Kit outbox has work in flight, so an
// auto screen-lock can't suspend the page mid-upload — the #1 cause of stranded
// captures on iOS PWAs (iOS suspends a backgrounded/locked web app and kills any
// in-flight fetch). Released the instant the queue empties.
//
// The platform auto-releases the lock whenever the page is hidden, so we
// re-acquire on visibilitychange → visible while still active. Fully
// feature-detected and guarded: browsers without the API (older iOS, etc.) and
// SSR simply no-op. Best-effort only — a failed/absent lock never throws.

import { useEffect, useRef } from "react";

// Minimal structural type so we don't depend on the DOM lib's WakeLockSentinel
// being present in tsconfig's `lib`.
type WakeLockSentinelLike = { release: () => Promise<void>; released: boolean };
type WakeLockLike = { request: (type: "screen") => Promise<WakeLockSentinelLike> };

function getWakeLock(): WakeLockLike | null {
  if (typeof navigator === "undefined") return null;
  const wl = (navigator as Navigator & { wakeLock?: WakeLockLike }).wakeLock;
  return wl ?? null;
}

/**
 * Keep the screen awake while `active` is true (i.e. the outbox has pending/
 * in-flight items). No-ops where the Wake Lock API is unavailable.
 */
export function useSyncWakeLock(active: boolean): void {
  const sentinelRef = useRef<WakeLockSentinelLike | null>(null);

  useEffect(() => {
    const wl = getWakeLock();
    if (!wl) return; // unsupported — nothing to do

    let cancelled = false;

    const release = () => {
      const s = sentinelRef.current;
      sentinelRef.current = null;
      if (s && !s.released) void s.release().catch(() => {});
    };

    const acquire = async () => {
      // Already holding a live lock, or the page isn't visible (request would
      // reject) — skip.
      if (sentinelRef.current && !sentinelRef.current.released) return;
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      try {
        const s = await wl.request("screen");
        if (cancelled) {
          void s.release().catch(() => {});
          return;
        }
        sentinelRef.current = s;
      } catch {
        // Rejected (not visible / not user-active) — harmless; a later
        // visibilitychange re-attempts.
      }
    };

    if (!active) {
      release();
      return () => {
        cancelled = true;
      };
    }

    void acquire();
    // The OS drops the lock when the page hides; re-take it on return.
    const onVisible = () => {
      if (document.visibilityState === "visible") void acquire();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      release();
    };
  }, [active]);
}
