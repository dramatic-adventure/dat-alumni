// lib/itineraryServerSnapshot.ts
//
// Slice 2 (hash alignment) — the SHARED server-side itinerary snapshot, extracted
// from the API route so BOTH the route and the itinerary PAGE render through one
// code path. A short module-level TTL cache (per warm instance) shares one Sheets
// read across the request fleet AND across the page's SSR.
//
// Why share it: the live-refresh client compares the page's rendered hash against
// the endpoint's hash. If the page hashed its own independent read while the
// endpoint hashed a cached one, the two could differ by a steady-state quirk and
// trigger a spurious "Itinerary updated" refresh. Rendering both through this
// cache makes the two hashes identical within the TTL window — the only cost is
// the displayed page may trail live edits by ≤ TTL, which is acceptable.

import "server-only";
import { loadProgramItinerary } from "@/lib/loadProgram";
import { hashItinerary, type ProgramItinerary } from "@/lib/programItinerary";

export type ItinerarySnapshot = { itinerary: ProgramItinerary | null; hash: string };

// Short shared cache: long enough to absorb a fleet of 30s pollers + the page's
// SSR, short enough that change detection stays near-real-time.
const CACHE_TTL_MS = 8_000;

const snapshotCache = new Map<string, { at: number; value: ItinerarySnapshot }>();

// Keyed by programId only — the itinerary is program-level (identical for every
// roster member), so asId never affects what's returned, only whether the caller
// is allowed in (gated at the call sites).
export async function getItinerarySnapshot(programId: string): Promise<ItinerarySnapshot> {
  const now = Date.now();
  const hit = snapshotCache.get(programId);
  if (hit && now - hit.at < CACHE_TTL_MS) return hit.value;

  const itinerary = await loadProgramItinerary(programId);
  const value: ItinerarySnapshot = {
    itinerary,
    hash: itinerary ? hashItinerary(itinerary) : "",
  };
  snapshotCache.set(programId, { at: now, value });
  return value;
}
