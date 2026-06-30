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

import { getSnapshot, putSnapshot } from "@/lib/itinerarySnapshot";
import type { ProgramItinerary } from "@/lib/programItinerary";

export type FetchItineraryResult = {
  itinerary: ProgramItinerary | null;
  hash: string;
  syncedAt: number | null; // when the returned data was synced live (null if never)
  source: "live" | "cache";
};

export async function fetchItinerary(
  programId: string,
  asId?: string
): Promise<FetchItineraryResult> {
  const online = typeof navigator === "undefined" || navigator.onLine !== false;

  if (online) {
    try {
      const params = new URLSearchParams({ program: programId });
      if (asId) params.set("asId", asId);
      const res = await fetch(`/api/field-kit/itinerary?${params.toString()}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = (await res.json()) as {
          itinerary?: ProgramItinerary | null;
          hash?: string;
        };
        const itinerary = data?.itinerary ?? null;
        const hash = data?.hash ?? "";
        const syncedAt = Date.now();
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
