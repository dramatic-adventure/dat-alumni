// lib/loadFieldKitArtist.ts
//
// Data layer for the Field Kit in-app artist screen (/field-kit/artist/[slug]).
// A STREAMLINED, crew-facing view of a single roster member's PUBLIC profile —
// not a mirror of the full marketing /alumni page. It reuses the exact engine
// lib/loadFieldKitCrew uses so the name / headshot / top DAT role match the Crew
// roster the viewer just tapped from:
//   - loadAlumniBySlug → name, headshot, bio, location, links
//   - getOrderedProfileRoles (+ loadRoleAssignments) → single top DAT role
//   - this program's cluster roster roles for the slug → "on this trip"
// Server-only + React cache() request memoization (mirrors loadFieldKitCrew).

import "server-only";
import { cache } from "react";
import { programMap } from "@/lib/programMap";
import { loadAlumniBySlug } from "@/lib/loadAlumni";
import { loadRoleAssignments } from "@/lib/loadRoleAssignments";
import { getOrderedProfileRoles } from "@/lib/profileRoleAssignments";

export type FieldKitArtistLink = { label: string; url: string };

export type FieldKitArtist = {
  slug: string;
  name: string;
  headshotUrl?: string;
  /** Single top DAT role label — same resolver /alumni + Crew use. May be "". */
  topRole: string;
  /** This program's roster role(s) for the slug — shown as "on this trip". */
  programRoles: string[];
  bio: string;
  location: string;
  links: FieldKitArtistLink[];
};

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

/** Union a slug's role lines across every cluster entry, deduped, order kept.
 *  Same shape as loadFieldKitCrew#rolesForSlug. */
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

/** Render-ready, same-origin headshot src — identical rule to loadFieldKitCrew:
 *  prefer the proxy's CACHEABLE `?id=` path (with a `sz` cap) when the row has a
 *  Drive fileId; fall back to `?url=` (no-store) only when there's no fileId. */
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

function normalizeUrl(raw: string): string {
  const s = String(raw || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  return `https://${s}`;
}

function displayUrl(raw: string): string {
  return String(raw || "").trim().replace(/^https?:\/\//i, "");
}

function normalizeSocialUrl(raw: string): string {
  const s = String(raw || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("@")) return `https://instagram.com/${s.slice(1)}`;
  if (/^[a-z0-9.-]+\.[a-z]{2,}\//i.test(s)) return `https://${s}`;
  return s;
}

/**
 * Streamlined public profile for one roster member, scoped to the trip's program.
 * Request-memoized via React cache(). Never throws on a missing profile.
 */
export const loadFieldKitArtist = cache(
  async (programId: string, slug: string): Promise<FieldKitArtist | null> => {
    const clean = norm(slug);
    if (!clean) return null;

    const clusterRoles = rolesForSlug(programId, clean);
    const alum = await loadAlumniBySlug(clean);
    // A member with no live profile is still a valid roster artist iff the
    // program lists trip role(s) for them; otherwise the slug doesn't resolve.
    if (!alum && clusterRoles.length === 0) return null;

    const roleAssignments = await loadRoleAssignments();
    // Top DAT role — same resolver /alumni + Crew use, with this program's
    // roster roles folded in so participants without a staff assignment resolve.
    const ordered = getOrderedProfileRoles(
      clean,
      alum?.roles ?? [],
      roleAssignments,
      new Date(),
      clusterRoles,
    );

    // Social / website links (public). Mirrors the visibility + normalization
    // rules the marketing profile applies (components/alumni ContactPanel).
    const links: FieldKitArtistLink[] = [];
    const showWebsite = norm(alum?.showWebsite) !== "false";
    const rawWebsite =
      String(alum?.website || "").trim() ||
      String(alum?.profileUrl || "").trim();
    if (showWebsite && rawWebsite) {
      links.push({ label: displayUrl(rawWebsite), url: normalizeUrl(rawWebsite) });
    }
    if (alum?.featuredLink?.url) {
      links.push({ label: alum.featuredLink.label || displayUrl(alum.featuredLink.url), url: alum.featuredLink.url });
    }
    for (const social of alum?.socials ?? alum?.socialLinks ?? []) {
      const s = String(social || "").trim();
      if (s) links.push({ label: s, url: normalizeSocialUrl(s) });
    }

    return {
      slug: clean,
      name: alum?.name?.trim() || humanizeSlug(clean),
      // Artist hero renders up to ~320px wide — w800 covers 2x DPR.
      headshotUrl: renderableHeadshot(alum?.headshotUrl, alum?.currentHeadshotId, "w800"),
      topRole: ordered[0] || "",
      programRoles: clusterRoles,
      bio: String(alum?.artistStatement || "").trim(),
      location: String(alum?.location || "").trim(),
      links,
    };
  }
);
