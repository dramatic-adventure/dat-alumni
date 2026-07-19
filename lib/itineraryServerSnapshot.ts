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
import { getLiveVersion } from "@/lib/fieldKitLiveVersion";
import { loadProgramItinerary } from "@/lib/loadProgram";
import {
  hashItinerary,
  resolveToday,
  type ProgramItinerary,
  type ResolvedToday,
} from "@/lib/programItinerary";

export type ItinerarySnapshot = {
  itinerary: ProgramItinerary | null;
  hash: string;
  /** "Today" resolved (in the program timezone) at snapshot time — pages should
   * render THIS rather than re-resolving, so their output always matches the
   * hash the live-refresh poller compares against. */
  today: ResolvedToday | null;
};

// Short shared cache: long enough to absorb a fleet of 30s pollers + the page's
// SSR, short enough that change detection stays near-real-time.
const CACHE_TTL_MS = 8_000;

const snapshotCache = new Map<string, { at: number; version: string | null; value: ItinerarySnapshot }>();

// Keyed by programId only — the itinerary is program-level (identical for every
// roster member), so asId never affects what's returned, only whether the caller
// is allowed in (gated at the call sites).
export async function getItinerarySnapshot(programId: string): Promise<ItinerarySnapshot> {
  const now = Date.now();
  // Same cross-instance freshness signal as lib/loadProgram: a staff-console
  // write bumps the live version and this 8s layer refetches immediately too.
  const version = await getLiveVersion(programId);
  const hit = snapshotCache.get(programId);
  if (hit && now - hit.at < CACHE_TTL_MS && hit.version === version) return hit.value;

  const itinerary = await loadProgramItinerary(programId);
  // Fold the resolved day into the hash: at midnight (program tz) the hash
  // changes even when the itinerary payload doesn't, so LiveRefresh pollers
  // pick up the day rollover instead of showing yesterday until an edit lands.
  const today = itinerary ? resolveToday(itinerary) : null;
  const value: ItinerarySnapshot = {
    itinerary,
    hash: itinerary
      ? `${hashItinerary(itinerary)}.${today?.todayDayId || today?.state || ""}`
      : "",
    today,
  };
  snapshotCache.set(programId, { at: now, version, value });
  return value;
}
