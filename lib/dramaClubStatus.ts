// lib/dramaClubStatus.ts
import type { DramaClub } from "@/lib/dramaClubMap";

export type DramaClubStatus = "new" | "ongoing" | "legacy";

/**
 * Computes NEW / ONGOING / LEGACY from first/last active years.
 *
 * Rules (using current year):
 * - If statusOverride is set → return that.
 * - Else if lastYearActive is a number and < currentYear - 1  → LEGACY
 * - Else if currentYear - firstYearActive <= 2 → NEW
 * - Else → ONGOING
 *
 * Special:
 * - lastYearActive === "present" → treated as current year (e.g. "2019–Present").
 * - If lastYearActive is missing, we fall back to firstYearActive.
 */
export function computeDramaClubStatus(club: DramaClub): DramaClubStatus {
  const nowYear = new Date().getFullYear();

  const firstYear =
    typeof club.firstYearActive === "number"
      ? club.firstYearActive
      : nowYear;

  let lastYear: number;
  if (club.lastYearActive === "present") {
    lastYear = nowYear;
  } else if (typeof club.lastYearActive === "number") {
    lastYear = club.lastYearActive;
  } else {
    // No explicit “last” year → assume only the first year for safety
    lastYear = firstYear;
  }

  const override = (club as any).statusOverride as DramaClubStatus | undefined;
  if (override === "new" || override === "ongoing" || override === "legacy") {
    return override;
  }

  if (lastYear < nowYear - 1) return "legacy";
  if (nowYear - firstYear <= 2) return "new";
  return "ongoing";
}
