// lib/fieldKitLeaders.ts
//
// Slice 5 (Field Ops) — the LEADER tier. Jesse's rule (2026-07-02): someone is
// a Field Kit leader for a program when they are ON THIS PROGRAM'S ROSTER and
// either (a) in the Staff bucket (/title's datStaffStatus routing —
// getStaffStatusForProfile "current"), or (b) their resolved roles land in the
// road-manager or director title buckets. Leaders see Roll Call headcounts and
// Company Choice tallies, and receive "needs help" pushes; other participants
// never do (the "no shame, no metrics" line).
//
// No new data entry: this is computed from the SAME sources /title and the Crew
// screen already resolve — programMap cluster roles + profile roles via
// getOrderedProfileRoles + Role-Assignments. Mirrors lib/loadFieldKitCrew's
// per-slug resolution and its TTL-cache pattern.

import "server-only";
import { cache } from "react";
import { clusterRoster, type FieldKitAccess } from "@/lib/fieldKitAccess";
import { programMap } from "@/lib/programMap";
import { loadAlumniBySlug } from "@/lib/loadAlumni";
import { loadRoleAssignments } from "@/lib/loadRoleAssignments";
import { getOrderedProfileRoles, getStaffStatusForProfile } from "@/lib/profileRoleAssignments";

function norm(s: unknown): string {
  return String(s ?? "").trim().toLowerCase();
}

/** Union a slug's role lines across every cluster entry (same as loadFieldKitCrew). */
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

/**
 * Does a role line land in the road-manager or director title buckets?
 * "Road Manager" and any "…Director…" title count ("Artistic Director",
 * "Director of Creative Learning", plain "Director"). Deliberately keyword-based
 * — the same broad matching /title's bucketsForTitleToken fallback produces for
 * these tokens.
 */
function isLeaderRole(role: string): boolean {
  const r = norm(role);
  return /\broad manager\b/.test(r) || /\bdirector\b/.test(r);
}

const LEADERS_TTL_MS = Number(process.env.FIELD_KIT_ITINERARY_TTL_MS || 60_000);
const _leaderCache = new Map<string, { at: number; value: Set<string> }>();

const resolveLeaderSlugsUncached = cache(async (programId: string): Promise<Set<string>> => {
  const slugs = Array.from(clusterRoster(programId));
  const roleAssignments = await loadRoleAssignments();
  const now = new Date();

  const flags = await Promise.all(
    slugs.map(async (slug) => {
      const clusterRoles = rolesForSlug(programId, slug);
      const alum = await loadAlumniBySlug(slug);
      const profileId = alum?.profileId || slug;
      if (getStaffStatusForProfile(profileId, roleAssignments, now) === "current") return true;
      const ordered = getOrderedProfileRoles(slug, alum?.roles ?? [], roleAssignments, now, clusterRoles);
      return [...ordered, ...clusterRoles].some(isLeaderRole);
    })
  );

  const leaders = new Set<string>();
  slugs.forEach((slug, i) => {
    if (flags[i]) leaders.add(norm(slug));
  });
  return leaders;
});

/**
 * The leader slugs for a program's roster. TTL-cached across requests (same
 * knob as the itinerary/crew caches); request-memoized underneath.
 */
export async function getFieldKitLeaderSlugs(programId: string): Promise<Set<string>> {
  const pid = norm(programId);
  const now = Date.now();
  const hit = _leaderCache.get(pid);
  if (hit && now - hit.at < LEADERS_TTL_MS) return hit.value;

  const value = await resolveLeaderSlugsUncached(programId);
  _leaderCache.set(pid, { at: now, value });
  return value;
}

/**
 * Is the current (allowed) session a leader for its program? Admins always
 * count; roster members count when their slug is in the leader set. An admin
 * IMPERSONATING a member is evaluated as that member — impersonation exists to
 * preview the member's real view, so it must not leak leader-only panels to a
 * non-leader artist's preview.
 */
export async function isFieldKitLeader(
  access: Extract<FieldKitAccess, { allowed: true }>
): Promise<boolean> {
  if (!access.impersonating && access.isAdmin) return true;
  const slug = norm(access.slug);
  if (!slug) return false;
  return (await getFieldKitLeaderSlugs(access.programId)).has(slug);
}
