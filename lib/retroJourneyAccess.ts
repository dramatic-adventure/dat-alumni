// lib/retroJourneyAccess.ts
//
// Slice 6 — the Retroactive Journey Card gate (§4-R Q4, locked with Jesse
// 2026-07-02). Distinct from lib/fieldKitAccess.ts's in-program logic: a
// past-program alum can't be "in-program" — the trip is over. The gate here is
// BOTH conditions:
//
//   1. authenticated alumni-profile OWNER (session email → Profile-Owners), and
//   2. on the roster (programMap `artists`) of the specific past program they
//      are building a card for.
//
// The roster source is lib/programMap.ts — the same cluster model
// fieldKitAccess uses: entries sharing a `cluster` key are ONE trip, so roster
// membership on ANY entry in the cluster qualifies, and the umbrella entry's
// metadata (by convention slug === cluster) is used for display + snapshot.
//
// Admin impersonation mirrors the capture route: an admin may pass asId to act
// as that artist; it never widens scope (the impersonated slug still has to be
// on the program's roster to draft/publish for it).

import "server-only";
import { auth } from "@/auth";
import { isAdmin, getAlumniIdForOwnerEmail } from "@/lib/ownership";
import { programMap, type ProgramData } from "@/lib/programMap";
import { formatProgramLabel } from "@/lib/journeyCard";

function norm(s: unknown): string {
  return String(s ?? "").trim().toLowerCase();
}

/** A past program the signed-in alum can build a retroactive card for. */
export type RetroProgramOption = {
  /** cluster ?? slug — stored as the card's programId (§4-R Q6). */
  programId: string;
  label: string; // "ACTion: Ecuador 2010"
  program: string;
  location: string;
  country: string;
  year: string;
  /** ISO run dates when programMap has them. */
  startDate?: string;
  endDate?: string;
};

function optionFromEntry(entry: ProgramData): RetroProgramOption {
  return {
    programId: norm(entry.cluster ?? entry.slug),
    label: formatProgramLabel({ program: entry.program, location: entry.location, year: entry.year }),
    program: entry.program,
    location: entry.location,
    country: entry.country || entry.location,
    year: String(entry.year),
    startDate: entry.startDate,
    endDate: entry.endDate,
  };
}

/**
 * Every past program (deduped by cluster, umbrella entry's metadata preferred)
 * whose roster includes `slug`. Sorted newest first.
 */
export function retroProgramsForSlug(slug: string): RetroProgramOption[] {
  const want = norm(slug);
  if (!want) return [];
  // clusterId → its umbrella entry (slug === cluster) or first member seen.
  const byCluster = new Map<string, { display: ProgramData; onRoster: boolean }>();
  for (const entry of Object.values(programMap)) {
    const clusterId = norm(entry.cluster ?? entry.slug);
    const isUmbrella = norm(entry.slug) === clusterId;
    const onRoster = Object.keys(entry.artists ?? {}).some((s) => norm(s) === want);
    const cur = byCluster.get(clusterId);
    if (!cur) {
      byCluster.set(clusterId, { display: entry, onRoster });
    } else {
      byCluster.set(clusterId, {
        display: isUmbrella ? entry : cur.display,
        onRoster: cur.onRoster || onRoster,
      });
    }
  }
  return Array.from(byCluster.values())
    .filter((c) => c.onRoster)
    .map((c) => optionFromEntry(c.display))
    .sort((a, b) => b.year.localeCompare(a.year));
}

/** True when `slug` is on the roster of the cluster identified by programId. */
export function isOnRetroProgram(slug: string, programId: string): boolean {
  const want = norm(programId);
  return retroProgramsForSlug(slug).some((p) => p.programId === want);
}

export type RetroJourneyAccess =
  | {
      allowed: true;
      email: string;
      isAdmin: boolean;
      /** The artist the draft/card belongs to (impersonated when admin+asId). */
      slug: string;
      impersonating: boolean;
      /** Past programs this slug can build a card for, newest first. */
      programs: RetroProgramOption[];
    }
  | { allowed: false; reason: "signed-out"; loginUrl: string }
  | { allowed: false; reason: "no-profile"; email: string };

/**
 * Resolve whether the current session may use the Retroactive builder, and for
 * which programs. Program-specific enforcement (condition 2) happens against
 * the returned `programs` list — callers MUST check the target programId is in
 * it (or use isOnRetroProgram) before accepting a draft/publish.
 */
export async function getRetroJourneyAccess(asId?: string): Promise<RetroJourneyAccess> {
  const session = await auth();
  const email = session?.user?.email || "";
  if (!email) {
    return {
      allowed: false,
      reason: "signed-out",
      loginUrl: `/login?callbackUrl=${encodeURIComponent("/alumni/journey-card/create")}`,
    };
  }

  const spreadsheetId = process.env.ALUMNI_SHEET_ID || "";
  const admin = isAdmin(email);

  // Admin impersonation — honored ONLY for admins; the impersonated slug's own
  // roster memberships apply (never widens what that artist could do).
  if (admin && norm(asId)) {
    const slug = norm(asId);
    return {
      allowed: true,
      email,
      isAdmin: true,
      slug,
      impersonating: true,
      programs: retroProgramsForSlug(slug),
    };
  }

  const ownedId = spreadsheetId ? await getAlumniIdForOwnerEmail(spreadsheetId, email) : "";
  if (!ownedId) return { allowed: false, reason: "no-profile", email };

  return {
    allowed: true,
    email,
    isAdmin: admin,
    slug: norm(ownedId),
    impersonating: false,
    programs: retroProgramsForSlug(ownedId),
  };
}
