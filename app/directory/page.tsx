// app/directory/page.tsx
import "server-only";

import { Suspense } from "react";
import { connection } from "next/server";
import { loadVisibleAlumni } from "@/lib/loadAlumni";
import { loadRoleAssignments } from "@/lib/loadRoleAssignments";
import { getPrimaryDatRoleForProfile } from "@/lib/profileRoleAssignments";
import DirectoryPageClient from "@/components/alumni/DirectoryPageClient";

import { enrichAlumniData } from "@/components/alumni/AlumniSearch/enrichAlumniData.server";
import {
  loadProfileLiveRowsPublic,
  loadProfileMediaRows,
} from "@/lib/alumniSheetsPublic.server";

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
    profileMediaRows
  );

  const primaryRoleBySlug = Object.fromEntries(
    alumni.map((a) => [
      a.slug,
      getPrimaryDatRoleForProfile(a.slug, a.roles || [], roleAssignments),
    ])
  );

  return (
    <Suspense fallback={<div style={{ height: 1 }} />}>
      <DirectoryPageClient
        alumni={alumni}
        enrichedData={enrichedData}
        primaryRoleBySlug={primaryRoleBySlug}
      />
    </Suspense>
  );
}
