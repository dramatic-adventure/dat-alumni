// lib/programTiming.ts
//
// Shared "has this program begun?" gate, so the passport stamps and the
// Collective Artist derivation stay in sync. A program counts as begun once the
// artist is (or was) on the ground:
//
//   • If startDate is set → begun when today >= startDate (date-only compare).
//   • Otherwise fall back to the calendar year:
//       - past or current year  → begun (historical entries rarely carry dates)
//       - future year           → not begun
//
// This keeps old, dateless stamps visible while hiding clearly-future projects.
// As concrete dates firm up (added "starting with the current season"), the
// precise startDate gate takes over — e.g. PASSAGE: Slovakia 2026 stays hidden
// until 2026-07-12. Pure + client-safe (type-only import), usable on both the
// client (ProgramStamps) and the server (deriveCollectiveArtist).

import type { ProgramData } from "@/lib/programMap";

function isoDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function hasProgramBegun(
  prog: Pick<ProgramData, "startDate" | "year"> | null | undefined,
  now: Date = new Date()
): boolean {
  if (!prog) return false;

  const start = String(prog.startDate ?? "").trim();
  if (start) {
    return isoDay(now) >= start; // YYYY-MM-DD strings compare lexically
  }

  const year = Number(prog.year);
  if (!Number.isFinite(year)) return true; // no timing info → don't hide
  return year <= now.getFullYear();
}
