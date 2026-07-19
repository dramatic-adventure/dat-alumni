// lib/fetchItinerary.ts
//
// Slice 2 — the single client-side itinerary fetch used by LiveRefresh and the
// offline view. Network-FIRST: when online it hits the gated endpoint, writes the
// result to the on-device snapshot (with syncedAt = now), and returns source
// "live". When offline — or the fetch fails / is denied — it reads the last
// snapshot and returns source "cache". The core principle holds: callers that
// only act on the live path keep the snapshot strictly an offline fallback.
//
// SSR-safe: no "server-only"; guards navigator before reading it.

import { getSnapshot, putSnapshot, touchSnapshot } from "@/lib/itinerarySnapshot";
import type { ProgramItinerary } from "@/lib/programItinerary";

export type FetchItineraryResult = {
  itinerary: ProgramItinerary | null;
  hash: string;
  syncedAt: number | null; // when the returned data was synced live (null if never)
  source: "live" | "cache";
  /** True when a hash-only poll confirmed no change (itinerary is null but the
   * server's data matches what the caller already renders). */
  unchanged?: boolean;
};

export async function fetchItinerary(
  programId: string,
  asId?: string,
  opts?: {
    /** Hash the caller ALREADY renders. When set, the endpoint answers a
     * matching state with a few-byte `{ hash, unchanged }` instead of the full
     * payload — pollers on weak signal stay cheap. Callers that need the
     * payload itself (offline snapshot view, share flow) omit this. */
    knownHash?: string;
  }
): Promise<FetchItineraryResult> {
  const online = typeof navigator === "undefined" || navigator.onLine !== false;

  if (online) {
    try {
      const params = new URLSearchParams({ program: programId });
      if (asId) params.set("asId", asId);
      if (opts?.knownHash) params.set("since", opts.knownHash);
      const res = await fetch(`/api/field-kit/itinerary?${params.toString()}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = (await res.json()) as {
          itinerary?: ProgramItinerary | null;
          hash?: string;
          unchanged?: boolean;
        };
        const hash = data?.hash ?? "";
        const syncedAt = Date.now();
        if (data?.unchanged) {
          // Nothing changed server-side — keep the stored payload, but stamp
          // the snapshot so "synced Xs ago" reflects this successful check.
          await touchSnapshot(programId, syncedAt);
          return { itinerary: null, hash, syncedAt, source: "live", unchanged: true };
        }
        const itinerary = data?.itinerary ?? null;
        // Persist only a real, published itinerary — never overwrite a good
        // snapshot with an empty one.
        if (itinerary) {
          await putSnapshot({ programId, itinerary, hash, syncedAt });
        }
        return { itinerary, hash, syncedAt, source: "live" };
      }
      // Non-OK (gate/network hiccup) → fall through to the cached snapshot.
    } catch {
      // Network error → fall through to the cached snapshot.
    }
  }

  const snap = await getSnapshot(programId);
  return {
    itinerary: snap?.itinerary ?? null,
    hash: snap?.hash ?? "",
    syncedAt: snap?.syncedAt ?? null,
    source: "cache",
  };
}
