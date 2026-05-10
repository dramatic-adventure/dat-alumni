// app/directory/page.tsx
import "server-only";

import { Suspense } from "react";
import { connection } from "next/server";
import { loadVisibleAlumni } from "@/lib/loadAlumni";
import { loadRoleAssignments } from "@/lib/loadRoleAssignments";
import { getPrimaryDatRoleForProfile, deriveBoardStatus } from "@/lib/profileRoleAssignments";
import DirectoryPageClient from "@/components/alumni/DirectoryPageClient";

import { enrichAlumniData } from "@/components/alumni/AlumniSearch/enrichAlumniData.server";
import {
  loadProfileLiveRowsPublic,
  loadProfileMediaRows,
} from "@/lib/alumniSheetsPublic.server";
import { programMap } from "@/lib/programMap";

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

  // Build programs + seasons per alumni slug directly from programMap (source of truth)
  const programsBySlug = new Map<string, Set<string>>();
  const seasonsBySlug = new Map<string, Set<string>>();
  for (const prog of Object.values(programMap)) {
    for (const artistSlug of Object.keys(prog.artists)) {
      if (!programsBySlug.has(artistSlug)) programsBySlug.set(artistSlug, new Set());
      programsBySlug.get(artistSlug)!.add(prog.program);
      if (!seasonsBySlug.has(artistSlug)) seasonsBySlug.set(artistSlug, new Set());
      seasonsBySlug.get(artistSlug)!.add(`Season ${prog.season}`);
    }
  }

  // Build updatedAt per slug from Profile-Live rows — that sheet has the timestamps
  const updatedAtBySlug = new Map<string, number>();
  for (const r of profileLiveRows) {
    if (r.updatedAt && !Number.isNaN(Date.parse(r.updatedAt))) {
      const ts = new Date(r.updatedAt).getTime();
      if (r.slug) updatedAtBySlug.set(r.slug, ts);
      if ((r as any).canonicalSlug) updatedAtBySlug.set((r as any).canonicalSlug, ts);
    }
  }

  const now = new Date();
  const alumniWithPrimary = alumni.map((a) => ({
    ...a,
    primaryRole: primaryRoleBySlug[a.slug] || (a.roles || [])[0] || "",
    statusFlags: deriveBoardStatus(a.slug, roleAssignments, now)
      ? Array.from(new Set([...(a.statusFlags || []), "Board Member"]))
      : a.statusFlags || [],
    programs: Array.from(programsBySlug.get(a.slug) || []),
    seasons: Array.from(seasonsBySlug.get(a.slug) || []),
    updatedAt: updatedAtBySlug.get(a.slug),
  }));

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
