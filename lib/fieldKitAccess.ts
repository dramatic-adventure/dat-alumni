// lib/fieldKitAccess.ts
//
// In-program access gate for the Field Kit. The Field Kit is NOT public and not
// all-alumni: it is for artists enrolled in the active program, plus staff
// (admins). The roster source is lib/programMap.ts (Jesse's decision): a trip is
// modeled as a CLUSTER of programMap entries that share a `cluster` key, so the
// roster is the union of `artists` across the cluster.

import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  isAdmin,
  getAlumniIdForOwnerEmail,
  resolveSlugToAlumniId,
  normalizeGmail,
} from "@/lib/ownership";
import { programMap } from "@/lib/programMap";
import { registerAlumniCacheInvalidationHook } from "@/lib/loadAlumni";

export const FIELD_KIT_PROGRAM_ID = process.env.FIELD_KIT_PROGRAM_ID || "passage-slovakia-2026";

function norm(s: unknown): string {
  return String(s ?? "").trim().toLowerCase();
}

/* ──────────────────────────────────────────────────────────
 * Owner → alumniId resolution cache (per warm instance)
 *
 * getFieldKitAccess is React cache()'d, which is REQUEST-scoped only — so every
 * Field Kit request was re-reading the Profile-Owners tab from Sheets in the
 * gate. This short cross-request TTL cache (mirrors ALUMNI_TTL_MS in
 * lib/loadAlumni) memoizes the email→alumniId answer per warm serverless slot.
 * Negative results ("" — no owning profile) are cached too, so anon/non-roster
 * emails don't hammer Sheets either; correctness is unchanged because the roster
 * check still runs on the cached id. Cleared alongside the alumni cache.
 * ────────────────────────────────────────────────────────── */
const OWNER_RESOLVE_TTL_MS = Number(process.env.ALUMNI_TTL_MS || 60_000);
const _ownerIdCache = new Map<string, { id: string; ts: number }>();

async function resolveOwnedAlumniIdCached(
  spreadsheetId: string,
  email: string,
): Promise<string> {
  const key = `${spreadsheetId}::${normalizeGmail(email)}`;
  const now = Date.now();
  const hit = _ownerIdCache.get(key);
  if (hit && now - hit.ts < OWNER_RESOLVE_TTL_MS) return hit.id;
  const id = await getAlumniIdForOwnerEmail(spreadsheetId, email);
  _ownerIdCache.set(key, { id, ts: now });
  return id;
}

/** Clear the owner-resolution cache. Registered with the alumni cache reset. */
export function invalidateFieldKitOwnerCache(): void {
  _ownerIdCache.clear();
}

registerAlumniCacheInvalidationHook(invalidateFieldKitOwnerCache);

/**
 * Every alumni slug on a trip — the union of `artists` across every programMap
 * entry whose cluster (or, for standalone entries, own slug) matches the key.
 */
export const clusterRoster = cache((clusterId: string): Set<string> => {
  const key = norm(clusterId);
  const slugs = new Set<string>();
  for (const entry of Object.values(programMap)) {
    if (norm(entry.cluster ?? entry.slug) !== key) continue;
    for (const slug of Object.keys(entry.artists ?? {})) slugs.add(norm(slug));
  }
  return slugs;
});

export type FieldKitAccess =
  | {
      allowed: true;
      email: string;
      isAdmin: boolean;
      programId: string;
      slug: string;
      impersonating: boolean;
    }
  | { allowed: false; reason: "signed-out"; loginUrl: string }
  | { allowed: false; reason: "not-in-program"; email: string };

/**
 * Resolve whether the current session may use the Field Kit for a program.
 *
 * Admin impersonation: an ADMIN may pass `asId` (a roster member's slug, or an
 * alumniId resolved via resolveSlugToAlumniId — mirroring /alumni/update) to act
 * as that member. The impersonated id MUST be on this program's roster; if it
 * doesn't resolve to a roster member the param is ignored and the admin keeps
 * their own access (impersonation never widens scope). `asId` is honored ONLY
 * when isAdmin — a non-admin sending it gets their normal own access. asId is
 * part of the cache key.
 */
export const getFieldKitAccess = cache(
  async (
    programId: string = FIELD_KIT_PROGRAM_ID,
    asId?: string
  ): Promise<FieldKitAccess> => {
    const session = await auth();
    const email = session?.user?.email || "";
    if (!email) {
      return {
        allowed: false,
        reason: "signed-out",
        loginUrl: `/login?callbackUrl=${encodeURIComponent("/field-kit")}`,
      };
    }

    // Resolve the owned slug ONCE here so every caller can reuse access.slug
    // instead of reading it again. Done before the admin short-circuit so an
    // admin who is ALSO a cohort member still gets their own slug.
    // NOTE: Profile-Owners keys profiles by alumniId; for cohort members in this
    // codebase that is the human slug (e.g. "jesse-baxter"), which is what
    // programMap.artists uses. If a member's alumniId ever diverges from their
    // slug, refine this to resolve slug<->alumniId.
    const spreadsheetId = process.env.ALUMNI_SHEET_ID || "";
    const ownedId = await resolveOwnedAlumniIdCached(spreadsheetId, email);

    // Admins bypass the ROSTER requirement, but still get their own slug when they
    // have a profile row (so an admin who is also a cohort member can capture).
    if (isAdmin(email)) {
      // Admin impersonation — honored ONLY for admins. Accept a slug directly, or
      // an alumniId resolved via resolveSlugToAlumniId (same as /alumni/update).
      // REQUIRE the result to be on this program's roster; otherwise ignore asId
      // and fall through to the admin's own access (never widen scope).
      const wanted = norm(asId);
      if (wanted) {
        let impersonatedSlug = "";
        if (clusterRoster(programId).has(wanted)) {
          impersonatedSlug = wanted;
        } else {
          const resolved = norm(await resolveSlugToAlumniId(spreadsheetId, wanted));
          if (resolved && clusterRoster(programId).has(resolved)) {
            impersonatedSlug = resolved;
          }
        }
        if (impersonatedSlug) {
          return {
            allowed: true,
            email,
            isAdmin: true,
            programId,
            slug: impersonatedSlug,
            impersonating: true,
          };
        }
      }
      return { allowed: true, email, isAdmin: true, programId, slug: ownedId, impersonating: false };
    }

    if (ownedId && clusterRoster(programId).has(norm(ownedId))) {
      return { allowed: true, email, isAdmin: false, programId, slug: ownedId, impersonating: false };
    }
    return { allowed: false, reason: "not-in-program", email };
  }
);

type FieldKitAllowed = Extract<FieldKitAccess, { allowed: true }>;

/**
 * Page-level guard — DEFENSE IN DEPTH. Call this at the TOP of every /field-kit
 * page server component, BEFORE loading any program/itinerary data.
 *
 * Why pages must guard even though app/field-kit/layout.tsx also gates: in the
 * App Router the page's server component still EXECUTES when the layout chooses
 * not to render {children}. So without this, an unauthorized request would still
 * trigger the page's data fetch. Gating here means no program data is loaded for
 * anyone who isn't an admin or on this program's roster.
 *
 * Behavior:
 *   - signed-out      → redirect to /login (throws; never returns)
 *   - not-in-program  → returns null. The caller MUST `return null` immediately
 *     and load NO data; the layout renders the generic gate screen (which leaks
 *     no itinerary/program metadata).
 *   - allowed         → returns the access record (carries the verified programId
 *     so callers scope their data load to exactly that program).
 */
export async function requireFieldKitPage(
  programId: string = FIELD_KIT_PROGRAM_ID,
  asId?: string
): Promise<FieldKitAllowed | null> {
  const access = await getFieldKitAccess(programId, asId);
  if (access.allowed) return access;
  if (access.reason === "signed-out") redirect(access.loginUrl);
  return null; // not-in-program: load nothing; the layout shows the gate.
}

/**
 * RULE — every Field Kit route handler, API route, and server action MUST call
 * this (or getFieldKitAccess) ITSELF and bail before touching program data.
 * Never trust the layout or middleware: those guard page rendering only, not
 * direct hits to /api/* or POSTed server actions. Returns a 401 (signed-out) or
 * 403 (not on the program roster) NextResponse to return as-is, or null when the
 * caller may proceed. Scope strictly by program: derive programId from the
 * route/body for multi-program routes so a member of one program cannot reach
 * another's data.
 *
 *   const denied = await guardFieldKitApi(programId);
 *   if (denied) return denied;
 */
export async function guardFieldKitApi(
  programId: string = FIELD_KIT_PROGRAM_ID,
  asId?: string
): Promise<NextResponse | null> {
  const access = await getFieldKitAccess(programId, asId);
  if (access.allowed) return null;
  const status = access.reason === "signed-out" ? 401 : 403;
  return NextResponse.json({ error: "Forbidden" }, { status });
}

/**
 * ADMIN-ONLY API guard for the Field Kit staff console routes. Same defense-in-
 * depth contract as guardFieldKitApi, but additionally requires access.isAdmin.
 * Returns the verified access record (carrying the scoped programId) when the
 * caller is an admin, or a 401/403 NextResponse to return as-is otherwise:
 *
 *   const access = await guardFieldKitAdminApi(program);
 *   if (access instanceof NextResponse) return access;
 *   // access.programId is the verified program scope
 */
export async function guardFieldKitAdminApi(
  programId: string = FIELD_KIT_PROGRAM_ID,
  asId?: string
): Promise<FieldKitAllowed | NextResponse> {
  const access = await getFieldKitAccess(programId, asId);
  if (!access.allowed) {
    const status = access.reason === "signed-out" ? 401 : 403;
    return NextResponse.json({ error: "Forbidden" }, { status });
  }
  if (!access.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return access;
}
