// lib/loadFieldKitCrew.ts
//
// Data layer for the Field Kit "Crew" (The Company) screen. Mirrors the
// lib/loadProgram.ts conventions: server-only + React cache() request
// memoization. The roster source is the SAME cluster model the access gate
// uses (lib/fieldKitAccess#clusterRoster) — the union of programMap `artists`
// across every entry that shares the trip's cluster key.
//
// Each crew member shows a SINGLE role — their top DAT role, resolved with the
// same engine /alumni uses for a profile's primary role (getOrderedProfileRoles),
// with this program's roster roles folded in as projectRoles so participants
// without a DAT staff assignment still resolve to a meaningful label. Name +
// headshot come from the live alumni profile (loadAlumniBySlug); a member with
// no profile is kept with a humanized name and no photo rather than dropped.

import "server-only";
import { cache } from "react";
import { clusterRoster } from "@/lib/fieldKitAccess";
import { programMap } from "@/lib/programMap";
import { loadAlumniBySlug } from "@/lib/loadAlumni";
import { loadRoleAssignments } from "@/lib/loadRoleAssignments";
import { getOrderedProfileRoles } from "@/lib/profileRoleAssignments";

export type CrewMember = {
  slug: string;
  name: string;
  headshotUrl?: string;
  /** Single top DAT role label — resolved the same way /alumni resolves a
   *  profile's primary role (getOrderedProfileRoles[0]). May be "" if unknown. */
  role: string;
};

// Staff-first ordering. A member ranks by the FIRST keyword here that any of
// their roles matches; members with no leadership role sort after, then
// alphabetically by name. Tune this one list to change who leads the company.
const ROLE_PRIORITY = [
  "artistic director",
  "director of creative learning",
  "resident playwright",
  "teaching artist",
] as const;

function norm(s: unknown): string {
  return String(s ?? "").trim().toLowerCase();
}

/** "jesse-baxter" → "Jesse Baxter" — honest fallback when a profile is missing. */
function humanizeSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w[0]!.toUpperCase() + w.slice(1))
    .join(" ");
}

/** Union a slug's role lines across every cluster entry, deduped, order kept. */
function rolesForSlug(programId: string, slug: string): string[] {
  const cluster = norm(programId);
  const want = norm(slug);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const entry of Object.values(programMap)) {
    if (norm(entry.cluster ?? entry.slug) !== cluster) continue;
    for (const [s, roles] of Object.entries(entry.artists ?? {})) {
      if (norm(s) !== want) continue;
      for (const role of roles ?? []) {
        const key = norm(role);
        if (key && !seen.has(key)) {
          seen.add(key);
          out.push(role);
        }
      }
    }
  }
  return out;
}

/** Staff-first rank: index of the earliest leadership keyword any role matches. */
function rankOf(roles: string[]): number {
  let best: number = ROLE_PRIORITY.length; // everyone without a leadership role
  for (const role of roles) {
    const r = norm(role);
    for (let i = 0; i < ROLE_PRIORITY.length; i++) {
      if (i < best && r.includes(ROLE_PRIORITY[i])) best = i;
    }
  }
  return best;
}

/**
 * Turn a resolved AlumniRow into a render-ready, same-origin headshot src.
 * Uploaded headshots already resolve to a `/api/media/thumb/...` path (kept as
 * is — already cacheable). Otherwise, when the row carries a Drive fileId we
 * route through the image proxy's CACHEABLE `?id=` path (24h max-age + in-memory
 * cache) instead of `?url=`, which is served no-store and re-downloads from
 * Drive on every load. `sz` caps the payload to a thumbnail. We fall back to
 * `?url=` only when there is no fileId. Empty → undefined (initials placeholder).
 */
function renderableHeadshot(
  url: string | undefined,
  fileId: string | undefined,
  sz: string,
): string | undefined {
  const u = (url ?? "").trim();
  if (u.startsWith("/")) return u;
  const id = (fileId ?? "").trim();
  if (id) return `/api/img?id=${encodeURIComponent(id)}&sz=${sz}`;
  if (!u) return undefined;
  return `/api/img?url=${encodeURIComponent(u.replace(/^http:\/\//, "https://"))}`;
}

// Cross-request TTL cache, keyed by programId — mirrors PROGRAM_ITINERARY_TTL_MS
// in lib/loadProgram.ts. Without this, every Crew load re-ran the roster's
// per-slug role resolution (getOrderedProfileRoles) even though the underlying
// alumni/role-assignment reads were already TTL-cached — this collapses that
// recompute too. Cache().'d loadAlumniBySlug calls inside stay request-memoized
// on a miss; overridable via FIELD_KIT_ITINERARY_TTL_MS (same knob as the
// itinerary, since both tolerate the same staleness window).
const FIELD_KIT_CREW_TTL_MS = Number(process.env.FIELD_KIT_ITINERARY_TTL_MS || 60_000);
const _crewCache = new Map<string, { at: number; value: CrewMember[] }>();

/**
 * Ordered crew for a program's cluster roster. Staff first, then alphabetical.
 * Request-memoized via React cache(). Never throws on a missing profile.
 */
const loadFieldKitCrewUncached = cache(
  async (programId: string): Promise<CrewMember[]> => {
    const slugs = Array.from(clusterRoster(programId));
    const roleAssignments = await loadRoleAssignments();

    const ranked = await Promise.all(
      slugs.map(async (slug) => {
        const clusterRoles = rolesForSlug(programId, slug);
        const alum = await loadAlumniBySlug(slug);
        // Top DAT role — same resolver /alumni uses for a profile's primary role.
        // This program's roster roles ride along as projectRoles so participants
        // without a DAT staff assignment still resolve to a real label.
        const ordered = getOrderedProfileRoles(
          slug,
          alum?.roles ?? [],
          roleAssignments,
          new Date(),
          clusterRoles,
        );
        const member: CrewMember = {
          slug,
          name: alum?.name?.trim() || humanizeSlug(slug),
          // Roster thumbnails render in ~144px cards — w400 covers 2x DPR.
          headshotUrl: renderableHeadshot(alum?.headshotUrl, alum?.currentHeadshotId, "w400"),
          role: ordered[0] || "",
        };
        // Rank on the full resolved list so staff-first ordering is unchanged.
        return { member, rank: rankOf(ordered) };
      })
    );

    return ranked
      .sort((a, b) =>
        a.rank !== b.rank ? a.rank - b.rank : a.member.name.localeCompare(b.member.name),
      )
      .map((r) => r.member);
  }
);

/** TTL-cached across requests (FIELD_KIT_CREW_TTL_MS above); see loadFieldKitCrewUncached. */
export async function loadFieldKitCrew(programId: string): Promise<CrewMember[]> {
  const pid = norm(programId);
  const now = Date.now();
  const hit = _crewCache.get(pid);
  if (hit && now - hit.at < FIELD_KIT_CREW_TTL_MS) return hit.value;

  const value = await loadFieldKitCrewUncached(programId);
  _crewCache.set(pid, { at: now, value });
  return value;
}
