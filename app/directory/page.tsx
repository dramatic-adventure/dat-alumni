// app/directory/page.tsx
import "server-only";

import { Suspense } from "react";
import { connection } from "next/server";
import { loadVisibleAlumni } from "@/lib/loadAlumni";
import { loadRoleAssignments } from "@/lib/loadRoleAssignments";
import { getPrimaryDatRoleForProfile, getOrderedProfileRoles, deriveBoardStatus } from "@/lib/profileRoleAssignments";
import DirectoryPageClient from "@/components/alumni/DirectoryPageClient";

import { enrichAlumniData } from "@/components/alumni/AlumniSearch/enrichAlumniData.server";
import {
  loadProfileLiveRowsPublic,
  loadProfileMediaRows,
} from "@/lib/alumniSheetsPublic.server";
import { programMap } from "@/lib/programMap";
import { productionMap } from "@/lib/productionMap";

import type { EnrichedProfileLiveRow } from "@/components/alumni/AlumniSearch/enrichAlumniData.server";


export default async function DirectoryPage() {
  await connection();

  const [alumni, profileLiveRows, profileMediaRows, roleAssignments] = await Promise.all([
    loadVisibleAlumni(),
    loadProfileLiveRowsPublic(),
    loadProfileMediaRows(),
    loadRoleAssignments(),
  ]);

  const enrichedData: EnrichedProfileLiveRow[] = await enrichAlumniData(
    profileLiveRows,
    profileMediaRows,
    roleAssignments,
  );

  const primaryRoleBySlug = Object.fromEntries(
    alumni.map((a) => [
      a.slug,
      getPrimaryDatRoleForProfile(a.slug, a.roles || [], roleAssignments),
    ])
  );

  const normSlug = (s: string) => String(s || "").trim().toLowerCase();

  // Build programs, seasons, and project roles per alumni slug from programMap + productionMap
  const programsBySlug = new Map<string, Set<string>>();
  const seasonsBySlug = new Map<string, Set<string>>();
  const projectRolesBySlug = new Map<string, string[]>();

  for (const prog of Object.values(programMap)) {
    for (const [artistSlug, artistRoles] of Object.entries(prog.artists)) {
      const ns = normSlug(artistSlug);
      if (!programsBySlug.has(ns)) programsBySlug.set(ns, new Set());
      programsBySlug.get(ns)!.add(prog.program);
      if (!seasonsBySlug.has(ns)) seasonsBySlug.set(ns, new Set());
      seasonsBySlug.get(ns)!.add(`Season ${prog.season}`);
      if (!projectRolesBySlug.has(ns)) projectRolesBySlug.set(ns, []);
      projectRolesBySlug.get(ns)!.push(...artistRoles);
    }
  }
  for (const prod of Object.values(productionMap)) {
    for (const [artistSlug, artistRoles] of Object.entries(prod.artists)) {
      const ns = normSlug(artistSlug);
      if (!projectRolesBySlug.has(ns)) projectRolesBySlug.set(ns, []);
      projectRolesBySlug.get(ns)!.push(...artistRoles);
    }
  }

  // Build updatedAt per slug from Profile-Live rows — that sheet has the timestamps
  const updatedAtBySlug = new Map<string, number>();
  for (const r of profileLiveRows) {
    if (r.updatedAt && !Number.isNaN(Date.parse(r.updatedAt))) {
      const ts = new Date(r.updatedAt).getTime();
      if (r.slug) updatedAtBySlug.set(normSlug(r.slug), ts);
      if ((r as any).canonicalSlug) updatedAtBySlug.set(normSlug((r as any).canonicalSlug), ts);
    }
  }

  const now = new Date();
  const alumniWithPrimary = alumni.map((a) => {
    const ns = normSlug(a.slug);
    const projectRoles = projectRolesBySlug.get(ns) || [];
    const mergedRoles = getOrderedProfileRoles(
      a.profileId || a.slug,
      a.roles || [],
      roleAssignments,
      now,
      projectRoles
    );
    return {
      ...a,
      roles: mergedRoles,
      primaryRole: mergedRoles[0] || primaryRoleBySlug[a.slug] || "",
      statusFlags: deriveBoardStatus(a.slug, roleAssignments, now)
        ? Array.from(new Set([...(a.statusFlags || []), "Board Member"]))
        : a.statusFlags || [],
      programs: Array.from(programsBySlug.get(ns) || []),
      seasons: Array.from(seasonsBySlug.get(ns) || []),
      updatedAt: updatedAtBySlug.get(ns),
    };
  });

  return (
    <Suspense fallback={<div style={{ height: 1 }} />}>
      <DirectoryPageClient
        alumni={alumniWithPrimary}
        enrichedData={enrichedData}
        primaryRoleBySlug={primaryRoleBySlug}
      />
    </Suspense>
  );
}
